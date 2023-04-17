(function()
{
	createNamespace("TF.Control").DocumentFilePreviewViewModel = DocumentFilePreviewViewModel;

	var ZOOM_LEVEL_MIN = 0.5;
	var ZOOM_LEVEL_MAX = 3;
	var COMPATIBLE_SCALE = 0.75;
	var BASE_FONT_SIZE = 16;

	var className = "document-file-preview";
	var selector = "." + className;
	var fileContentMap = {};
	var template = "<div class='tfmodal modal " + className + "' data-bind='css:obFileType'>\
						<div class='preview-top-bar'>\
							<div class='file-information'>\
								<div class='file-icon top-bar-icon'></div>\
								<span class='file-name' data-bind='text:obFileName'></span>\
							</div>\
							<div class='print-button top-bar-icon top-bar-button' data-bind='visible:obIsPrintBtnShow, click:onPrintBtnClick'></div>\
							<div class='download-button top-bar-icon top-bar-button' data-bind='click:onDownloadBtnClick'></div>\
							<div class='close-preview-button top-bar-icon top-bar-button' data-bind='click:hide'></div>\
						</div>\
						<div class='preview-content-container'>\
							<div class='preview-content'></div>\
							<div class='inline-alignment'></div>\
						</div>\
						<div class='preview-control'>\
							<span class='zoom-out control-button' data-bind='click:onZoomOutBtnClick'/>\
							<span class='zoom-in control-button' data-bind='click:onZoomInBtnClick'/>\
							<span class='fit-page control-button' data-bind='click:onFitToPageBtnClick'/>\
						</div>\
					</div>";
	var pdf_page_template = "<div class='page-wrap' page-rendered='false'>\
								<div class='canvas-wrap'>\
									<canvas />\
								</div>\
								<div class='text-layer'></div>\
							</div>";

	function DocumentFilePreviewViewModel($container)
	{
		var self = this;

		self.$container = $container;
		self.$element = null;
		self.isFitToPage = false;
		self.zoomIncrement = 0.1;
		self.zoomScale = 1;
		self.originHeight = 0;
		self.originWidth = 0;
		self.mimeType = null;
		self.cachePdfPages = [];
		self.pendingRenderPdfTask = null;

		// Pending task for preview control to fade away 
		self.pendingControlFadeAway = null;

		self.obFileName = ko.observable();
		self.obFileType = ko.observable();
		self.obControls = ko.observable(null);

		self.obIsPrintBtnShow = ko.observable(false);

		self.renderPdfPreview = self.renderPdfPreview.bind(self);
		self.renderImagePreview = self.renderImagePreview.bind(self);
		self.renderVideoPreview = self.renderVideoPreview.bind(self);
		//self.renderHtmlPreview = self.renderHtmlPreview.bind(self);
		self.updatePdfPreviewSizeWithScale = self.updatePdfPreviewSizeWithScale.bind(self);
		self.updateImgPreviewSizeWithScale = self.updateImgPreviewSizeWithScale.bind(self);
		self.updateVideoPreviewSizeWithScale = self.updateVideoPreviewSizeWithScale.bind(self);
		//self.updateHtmlPreviewSizeWithScale = self.updateHtmlPreviewSizeWithScale.bind(self);
		self.fitPdfPreviewToPage = self.fitPdfPreviewToPage.bind(self)
		self.fitImgPreviewToPage = self.fitImgPreviewToPage.bind(self)
		self.fitVideoPreviewToPage = self.fitVideoPreviewToPage.bind(self);
		//self.fitHtmlPreviewToPage = self.fitHtmlPreviewToPage.bind(self);
		//self.convertHtmlToBlob = self.convertHtmlToBlob.bind(self);
		self.onDownloadBtnClick = self.onDownloadBtnClick.bind(self);
		self.onZoomOutBtnClick = self.onZoomOutBtnClick.bind(self);
		self.onZoomInBtnClick = self.onZoomInBtnClick.bind(self);
		self.onFitToPageBtnClick = self.onFitToPageBtnClick.bind(self);
		self.hide = self.hide.bind(self);

		self.AVAILABLE_FILE_TYPES = {
			PDF: {
				MIME_TYPES: ["application/pdf"],
				RENDER_METHOD: self.renderPdfPreview,
				UPDATE_SCALE_METHOD: self.updatePdfPreviewSizeWithScale,
				FIT_TO_PAGE: self.fitPdfPreviewToPage,
				CONTROLS: "Controls"
			},
			IMG: {
				MIME_TYPES: ["image/jpeg", "image/png", "image/gif", "image/bmp"],
				RENDER_METHOD: self.renderImagePreview,
				UPDATE_SCALE_METHOD: self.updateImgPreviewSizeWithScale,
				FIT_TO_PAGE: self.fitImgPreviewToPage,
				CONTROLS: "Controls"
			},
			VDI: {
				MIME_TYPES: ["video/mp4", "video/ogg", "audio/x-m4a", "audio/mp3", "audio/ogg", "audio/wav"],
				RENDER_METHOD: self.renderVideoPreview,
				UPDATE_SCALE_METHOD: self.updateVideoPreviewSizeWithScale,
				FIT_TO_PAGE: self.fitVideoPreviewToPage,
				CONTROLS: null
			},
			/* HTML: {
				MIME_TYPES: ["text/html"],
				RENDER_METHOD: self.renderHtmlPreview,
				UPDATE_SCALE_METHOD: self.updateHtmlPreviewSizeWithScale,
				FIT_TO_PAGE: self.fitHtmlPreviewToPage,
				CONTROLS: "Controls",
				ConvertToBlob_METHOD: self.convertHtmlToBlob
			} */
		};

		self.CurPdfData = ko.observable(null);;

		self.init();
	}

	/**
	 * Initialization of the preview modal.
	 *
	 */
	DocumentFilePreviewViewModel.prototype.init = function()
	{
		var self = this,
			$element = self.$container.find(selector);

		if ($element.length === 0)
		{
			$element = $(template).appendTo(self.$container);
		}

		self.$element = $element;

		ko.cleanNode($element[0]);
		ko.applyBindings(self, $element[0]);

		self.bindEvents($element);
	};

	/**
	 * Bind related events for document preview.
	 *
	 */
	DocumentFilePreviewViewModel.prototype.bindEvents = function()
	{
		var self = this;
		// close the modal if click on the black drop
		self.$element.on("click", ".preview-content-container", function(e)
		{
			if ($(e.target).closest(".preview-content").length === 0)
			{
				self.hide();
			}
		});

		self.$element.on("mouseenter", ".preview-content, .preview-control", function(e)
		{
			self.togglePreviewControl(true);
		});

		self.$element.on("mouseleave", ".preview-content, .preview-control", function(e)
		{
			self.togglePreviewControl(false);
		});
	};

	/**
	 * Unbind events from document preview.
	 *
	 */
	DocumentFilePreviewViewModel.prototype.unbindEvents = function()
	{
		var self = this;
		self.$element.off("click", ".preview-content-container");
		self.$element.off("mouseenter", ".preview-content");
		self.$element.off("mouseleave", ".preview-content");

		self.$element.find(".preview-content-container").off("scroll");
	};

	/**
	 * Show document preview modal.
	 *
	 * @param {*} document
	 */
	DocumentFilePreviewViewModel.prototype.show = function(document)
	{
		var self = this;

		if (document)
		{
			var mimeType = document.MimeType,
				fileType = self.determineFileTypeFromMime(mimeType);

			self.mimeType = mimeType;
			self.obFileName(document.FileName);
			self.obFileType(fileType);
			self.obControls(fileType ? self.AVAILABLE_FILE_TYPES[fileType].CONTROLS : null);

			self.document = document;
			self.documentId = document ? document.Id : 0;

			self.renderPreview();

			if (document.option && document.option.NeedPrinterBtn)
			{
				this.obIsPrintBtnShow(true);
			}
		}

		self.$element.addClass("preview-show");

		var modalIndex = 0;
		$(".tfmodal-container .modal").each(function()
		{
			modalIndex = Math.max($(this).css("z-index"), modalIndex);
		});

		if (modalIndex)
		{
			self.$element.css("z-index", modalIndex + 1);
		}
	};

	/**
	 * Hide document preview modal.
	 *
	 */
	DocumentFilePreviewViewModel.prototype.hide = function()
	{
		var self = this;

		self.$element.find(".preview-content").empty();
		self.$element.removeClass("preview-show");

		this.obIsPrintBtnShow(false);
		this.CurPdfData(null);
	};

	/**
	 * Toggle preview cotrol display status.
	 *
	 * @param {Boolean} flag
	 */
	DocumentFilePreviewViewModel.prototype.togglePreviewControl = function(flag)
	{
		var self = this,
			leaveBuffer = 1000,
			fadeDuration = 300,
			showClassName = "showControl",
			$control = self.$element.find(".preview-control");

		if (!self.obControls())
		{
			return;	// In case the current file being previewed do not need Control bar items
		}

		// clear on-going status
		$control.stop().css("opacity", "");
		clearTimeout(self.pendingControlFadeAway);

		if (flag)
		{
			$control.addClass(showClassName);
		}
		else
		{
			$control.css("opacity", 0);
			self.pendingControlFadeAway = setTimeout(
				function()
				{
					$control.css("opacity", "");
					$control.removeClass(showClassName);
				}, leaveBuffer + fadeDuration);
		}
	};

	/**
	 * Detect if FileContent need to be fetched from server by checking "LastUpdated" field 
	 */
	DocumentFilePreviewViewModel.prototype.needToDownloadFileContent = function(documentId)
	{
		var cacheEntry = fileContentMap[documentId];
		if (!cacheEntry || !cacheEntry.LastUpdated)
		{
			return Promise.resolve(true);
		}

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "documents"), {
			cache: false,
			paramData: {
				Id: documentId,
				"@fields": "LastUpdated"
			}
		}).then(function(apiResponse)
		{
			if (apiResponse.Items && apiResponse.Items.length)
			{
				var serverLastUpdated = moment(apiResponse.Items[0].LastUpdated);
				var clientLastUpdated = moment(cacheEntry.LastUpdated);

				return serverLastUpdated > clientLastUpdated;
			}
			else
			{
				return true;
			}
		});
	}

	/**
	 * Read the document attached file stream from API.
	 *s
	 * @param {Number} documentId
	 */
	DocumentFilePreviewViewModel.prototype.readFileStream = function(documentId)
	{
		var self = this;

		return self.needToDownloadFileContent(documentId).then(
			function(needed)
			{
				if (needed === true)
				{
					return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "documents"), {
						cache: false,
						paramData: {
							Id: documentId,
							"@fields": "FileContent,LastUpdated"
						}
					}).then(function(data)
					{
						var lastUpdated = data.Items[0].LastUpdated;
						var fileContent = data.Items[0].FileContent;
						fileContentMap[documentId] = { LastUpdated: lastUpdated, FileContent: fileContent };

						return fileContent;
					});
				}
				else
				{
					return fileContentMap[documentId].FileContent;
				}
			});
	};

	/**
	 * Render preview including top bar and content.
	 *
	 */
	DocumentFilePreviewViewModel.prototype.renderPreview = function()
	{
		var self = this,
			fileContentSource = self.document.FileContent || self.readFileStream(self.documentId);

		self.zoomScale = 1;
		tf.loadingIndicator.showImmediately();

		Promise.resolve(fileContentSource)
			.then(function(fileContent)
			{
				//empty txt file  fileContent == ""
				if (fileContent == null)
				{
					tf.promiseBootbox.alert("The file content is empty!");
					tf.loadingIndicator.tryHide();
					self.hide();
					return;
				}

				var fileType = self.obFileType();

				if (!self.AVAILABLE_FILE_TYPES.hasOwnProperty(fileType))
				{
					tf.loadingIndicator.tryHide();
					return self.closeOnError("The file type is not support!");
				}

				self.AVAILABLE_FILE_TYPES[fileType]["RENDER_METHOD"](fileContent, self.mimeType).then(function()
				{
					tf.loadingIndicator.tryHide();
				});

			}, function(error)
			{
				console.error(error);
				tf.loadingIndicator.tryHide();
			});
	};

	/**
	 * Render preview for document file.
	 *
	 * @param {*} fileContent
	 */
	DocumentFilePreviewViewModel.prototype.renderPdfPreview = function(fileContent)
	{
		var self = this, pdfData = atob(fileContent);
		self.CurPdfData(fileContent);
		tf.loadingIndicator.show();
		return pdfjsLib.getDocument({ data: pdfData, disableAutoFetch: true, disableStream: true })
			.promise.then(function(pdf)
			{
				var i = 1, task, taskList = [],
					$container = self.$element.find(".preview-content-container"),
					$content = $container.find(".preview-content"),
					$preview = $("<div />", { class: "pdf-wrap" }).appendTo($content);

				for (; i <= pdf.numPages; i++)
				{
					var $page = $(pdf_page_template).appendTo($preview);

					task = pdf.getPage(i).then(function(page)
					{
						self.renderPdfPage(page, this, true);

						return [page, this];

					}.bind($page));

					taskList.push(task);
				}

				Promise.all(taskList)
					.then(function(result)
					{
						self.cachePdfPages = result;
						return self.renderOnScreenPdfPages()

					}).then(function()
					{
						$container.on("scroll", self.renderOnScreenPdfPages.bind(self));

						tf.loadingIndicator.tryHide();
					});

			}, function(err)
			{
				console.log(err);
				tf.loadingIndicator.tryHide();
			});
	};

	/**
	 * Renderring for a single pdf page.
	 *
	 * @param {Object} page
	 * @param {Object} canvas
	 * @param {Object} textLayer
	 */
	DocumentFilePreviewViewModel.prototype.renderPdfPage = function(page, $page, delayRender)
	{
		var self = this,
			viewport = page.getViewport(self.zoomScale),
			canvas = $page.find("canvas").get(0),
			textLayer = $page.find(".text-layer").get(0),
			context = canvas.getContext("2d"),
			renderContext = {
				canvasContext: context,
				viewport: viewport
			};

		canvas.height = viewport.height;
		canvas.width = viewport.width;

		$page.attr("page-rendered", !delayRender);

		if (!delayRender)
		{
			return page.render(renderContext).promise
				// Uncomment if it is desired that text is selecable.
				.then(function()
				{
					return page.getTextContent();
				})
				.then(function(textContent)
				{
					textLayer.style.top = canvas.offsetTop + "px";
					textLayer.style.left = canvas.offsetLeft + "px";
					textLayer.style.height = canvas.offsetHeight + "px";
					textLayer.style.width = canvas.offsetWidth + "px";

					pdfjsLib.renderTextLayer({
						textContent: textContent,
						container: textLayer,
						viewport: viewport,
						textDivs: []
					});
				});
		}
		else if (textLayer)
		{
			textLayer.style.transform = "scale(" + self.zoomScale + ")";
			textLayer.style.transformOrigin = '0% 0%';
		}
		return Promise.resolve();
	};

	DocumentFilePreviewViewModel.prototype.renderOnScreenPdfPages = function()
	{
		var self = this;

		if (Array.isArray(self.cachePdfPages) && self.cachePdfPages.length > 0)
		{
			var renderTasks = [],
				topbarHeight = self.$element.find(".preview-top-bar").height(),
				containerHeight = self.$element.find(".preview-content-container").height();

			$.each(self.cachePdfPages, function(_, item)
			{
				var page = item[0], $page = item[1];

				if ($page.attr("page-rendered") === "true")
				{
					return true;
				}

				var height = $page.height(), offset = $page.offset(),
					pageTop = offset.top - topbarHeight;

				if (pageTop >= containerHeight)
				{
					return false;
				}

				if (pageTop > -height && pageTop < containerHeight)
				{
					renderTasks.push(self.renderPdfPage(page, $page));
				}
			});

			return Promise.all(renderTasks);
		}

		return Promise.resolve();
	};

	/**
	 * Render preview for image file.
	 *
	 * @param {*} fileContent
	 */
	DocumentFilePreviewViewModel.prototype.renderImagePreview = function(fileContent, mimeType)
	{
		var self = this,
			$container = self.$element.find(".preview-content-container"),
			$content = $container.find(".preview-content"),
			imgData = "data:" + mimeType + ";base64," + fileContent,
			img = new Image();

		img.style.visibility = "hidden";
		img.onload = function()
		{
			var scale = self.getCompatiblePreviewScale(img.width, img.height);

			self.originHeight = img.height;
			self.originWidth = img.width;
			self.zoomScale = Math.round(scale * 10) / 10;
			self.updatePreviewSizeWithScale();
			img.style.visibility = "visible";
		}

		img.src = imgData;

		$content.append(img);

		return Promise.resolve();
	};

	/**
	 * Render preview for video file (such as .mp4).
	 *
	 * @param {*} fileContent
	 */
	DocumentFilePreviewViewModel.prototype.renderVideoPreview = function(fileContent, mimeType)
	{
		var self = this,
			$container = self.$element.find(".preview-content-container"),
			$content = $container.find(".preview-content"),
			videoDataURI = "data:" + mimeType + ";base64," + fileContent,
			player = document.createElement("video");

		player.className = "video-player";
		player.controls = "controls";	// show video player's control bar
		player.disablePictureInPicture = true;	// disable "Picture in Picture" option
		player.controlsList = "nodownload";	// disable "Download" menu option (chrome specific)
		player.autoplay = false;
		player.style.visibility = "hidden";

		var containerHeight = $container.height();
		// for video, need to calculate scale in onloadeddata event (where video aspect ratio info is available)
		player.onloadeddata = function()
		{
			var scale = self.getCompatiblePreviewScale(player.videoWidth, player.videoHeight);
			self.originHeight = player.videoHeight;
			self.originWidth = player.videoWidth;
			self.zoomScale = Math.round(scale * 10) / 10;
			self.updatePreviewSizeWithScale();

			var $player = $(player);
			var playerHeight = $player.height();
			var playerTop = playerHeight < containerHeight ? String.format("{0}px", (containerHeight - playerHeight) / 2.0) : "0";
			$player.css("top", playerTop);

			player.style.visibility = "visible";
			tf.loadingIndicator.tryHide();

			setTimeout(function()
			{
				player.play();
			}, 10);
		};

		tf.loadingIndicator.showImmediately();
		player.src = videoDataURI;
		$content.append(player);

		return Promise.resolve();
	};

	/**
	 * Render preview for html file.
	 *
	 * @param {*} fileContent
	 */
	/* DocumentFilePreviewViewModel.prototype.renderHtmlPreview = function(fileContent, mimeType)
	{
		var self = this,
			$container = self.$element.find(".preview-content-container"),
			$content = $container.find(".preview-content"),
			htmlPre = document.createElement('iframe'),
			COMPATIBLE_height = self.$container.height() * COMPATIBLE_SCALE,
			COMPATIBLE_width = self.$container.width() * 0.4;

		$(htmlPre).attr('src', "data:" + mimeType + ";base64," + fileContent);
		$(htmlPre).css({
			height: COMPATIBLE_height,
			width: COMPATIBLE_width,
			margin: 20,
		});
		self.originWidth = COMPATIBLE_width;
		self.originHeight = COMPATIBLE_height;
		$content.append(htmlPre);

		return Promise.resolve();
	} */

	/**
	 * Get compatible size for preview.
	 *
	 * @param {Number} width
	 * @param {Number} height
	 */
	DocumentFilePreviewViewModel.prototype.getCompatiblePreviewScale = function(width, height, forceToFit)
	{
		var self = this, scale = 1,
			$content = self.$element.find(".preview-content-container"),
			compatibleWidth = $content.width() * COMPATIBLE_SCALE,
			compatibleHeight = $content.height() * COMPATIBLE_SCALE;

		// if both width and height are within compatible size, nothing needs to be done.
		if (forceToFit
			|| width > compatibleWidth
			|| height > compatibleHeight)
		{
			scale = Math.min(compatibleWidth / width, compatibleHeight / height);
		}

		return scale;
	};

	/**
	 * Update pdf preview size according to new scale. 
	 *
	 */
	DocumentFilePreviewViewModel.prototype.updatePdfPreviewSizeWithScale = function()
	{
		var self = this, reRenderBufferTime = 500,
			cssTransform = function(item)
			{
				var page = item[0], $pageContainer = item[1],
					canvas = $pageContainer.find("canvas").get(0),
					textLayer = $pageContainer.find(".text-layer").get(0),
					viewport = page.getViewport(self.zoomScale),
					height = viewport.height,
					width = viewport.width;

				$pageContainer.attr("page-rendered", false);

				canvas.style.height = canvas.parentNode.style.height = $pageContainer[0].style.height = height + "px";
				canvas.style.width = canvas.parentNode.style.width = $pageContainer[0].style.width = width + "px";

				if (textLayer)
				{
					textLayer.style.top = canvas.offsetTop + "px";
					textLayer.style.left = canvas.offsetLeft + "px";
					textLayer.style.height = canvas.offsetHeight + "px";
					textLayer.style.width = canvas.offsetWidth + "px";
				}
			};

		self.cachePdfPages.map(cssTransform);

		clearTimeout(self.pendingRenderPdfTask);
		self.pendingRenderPdfTask = setTimeout(function()
		{
			self.renderOnScreenPdfPages();

		}, reRenderBufferTime);
	};

	/**
	 * Determine which is the current page for PDF.
	 *
	 * @returns
	 */
	DocumentFilePreviewViewModel.prototype.getCurrentPdfPageIndex = function()
	{
		var self = this;

		if (!Array.isArray(self.cachePdfPages) || self.cachePdfPages.length === 0)
		{
			return -1;
		}

		if (self.cachePdfPages.length === 1)
		{
			return 0;
		}

		var resultIdx = 0, maxInScreen = 0,
			topbarHeight = self.$element.find(".preview-top-bar").outerHeight(),
			containerHeight = self.$element.find(".preview-content-container").outerHeight();

		$.each(self.cachePdfPages, function(index, item)
		{
			var $page = item[1], pageTop = $page.offset().top - topbarHeight;

			// if the page top is greater than container height, below pages can never be current page.
			if (maxInScreen && pageTop >= containerHeight)
			{
				return false;
			}

			// the first page that is fully contained in screen should be considered as current page.
			var pageBottom = pageTop + $page.outerHeight();

			if (pageTop >= 0 && pageBottom <= containerHeight)
			{
				resultIdx = index;
				return false;
			}

			// if multiple pages are partially contained, consider the one that has the most height in screen as the current page.
			var inScreenHeight = Math.min(pageBottom, containerHeight) - Math.max(0, pageTop);

			if (inScreenHeight > maxInScreen)
			{
				maxInScreen = inScreenHeight;
				resultIdx = index;
			}
		});

		return resultIdx;
	};

	DocumentFilePreviewViewModel.prototype.updateImgPreviewSizeWithScale = function()
	{
		var self = this, $img = self.$element.find(".preview-content img");

		$img.css({
			width: self.originWidth * self.zoomScale,
			height: self.originHeight * self.zoomScale
		});
	};

	DocumentFilePreviewViewModel.prototype.updateVideoPreviewSizeWithScale = function()
	{
		var self = this,
			$player = self.$element.find(".preview-content video"),
			scaledWidth = self.originWidth * self.zoomScale, scaledHeight = self.originHeight * self.zoomScale;

		$player.css({
			width: scaledWidth,
			height: scaledHeight
		});

		// for html5 <player>, need to use width and height attributes
		$player[0].width = scaledWidth;
		$player[0].height = scaledHeight;
	};

	/* DocumentFilePreviewViewModel.prototype.updateHtmlPreviewSizeWithScale = function()
	{
		//todo
		var self = this, $iframe = self.$element.find(".preview-content iframe");
		$iframe.css({
			width: self.originWidth * self.zoomScale,
			height: self.originHeight * self.zoomScale
		});
	} */

	DocumentFilePreviewViewModel.prototype.updatePreviewSizeWithScale = function()
	{
		var self = this, fileType = self.obFileType(),
			scalingFunc = self.AVAILABLE_FILE_TYPES[fileType]["UPDATE_SCALE_METHOD"];

		if (typeof scalingFunc === "function")
		{
			scalingFunc();
		}
	};

	DocumentFilePreviewViewModel.prototype.fitPdfPreviewToPage = function()
	{
		var self = this, index = self.getCurrentPdfPageIndex(),
			pageItem = self.cachePdfPages[index];

		if (pageItem)
		{
			var $canvas = pageItem[1].find("canvas"),
				containerWidth = self.$element.find(".preview-content-container").width(),
				width = $canvas.width(),
				compatibleWidth = containerWidth * COMPATIBLE_SCALE;

			self.zoomScale = compatibleWidth / width;
			self.updatePreviewSizeWithScale();
		}
	};

	DocumentFilePreviewViewModel.prototype.fitImgPreviewToPage = function()
	{
		var self = this;
		self.zoomScale = self.getCompatiblePreviewScale(self.originWidth, self.originHeight, true);
		self.updatePreviewSizeWithScale();
	};

	DocumentFilePreviewViewModel.prototype.fitVideoPreviewToPage = function()
	{
		var self = this;
		self.zoomScale = self.getCompatiblePreviewScale(self.originWidth, self.originHeight, true);
		self.updatePreviewSizeWithScale();
	};

	/* DocumentFilePreviewViewModel.prototype.fitHtmlPreviewToPage = function()
	{
		//todo
		var self = this;
		self.zoomScale = self.getCompatiblePreviewScale(self.originWidth, self.originHeight, true);
		self.updatePreviewSizeWithScale();
	}; */

	/* DocumentFilePreviewViewModel.prototype.convertHtmlToBlob = function()
	{
		var self = this,
			$container = self.$element.find(".preview-content-container"),
			$content = $container.find(".preview-content");

		var domStr = $content.find('iframe') && $content.find('iframe')[0].srcdoc;
		if (domStr)
		{
			return URL.createObjectURL(new Blob([domStr], { type: 'text/html' }));
		}
	} */
	/**
	 * On when the download button is clicked.
	 *
	 */
	DocumentFilePreviewViewModel.prototype.onDownloadBtnClick = function()
	{
		var self = this, fileStreamSource = self.document.FileContent || self.readFileStream(self.documentId);

		Promise.resolve(fileStreamSource).then(function(content)
		{
			self.initDownloadOnBrowser(self.obFileName(), self.mimeType, content);
		});
	};

	/**
	* On when the print button is clicked.
	*
	*/
	DocumentFilePreviewViewModel.prototype.onPrintBtnClick = function()
	{
		var self = this,
			$container = self.$element.find(".preview-content-container"),
			$content = $container.find(".preview-content");
		/* if (self.obFileType() === 'HTML')
		{
			var $iframe = $content.find('iframe');
			var iframe = $iframe && $iframe[0].contentWindow;
			if (iframe)
			{
				iframe.focus();
				iframe.print();
			}
		} else */
		if (self.obFileType() === 'PDF')
		{
			var $canvas = $content.find("div.pdf-wrap");
			var canvas = $canvas && $canvas[0];
			if (canvas)
			{
				var objUrl = URL.createObjectURL(convertBase64DataToBlob(self.CurPdfData(), 'application/pdf'));
				var $iframe = document.createElement('iframe');
				$iframe.height = 0;
				$iframe.width = 0;
				$iframe.src = objUrl;
				$($iframe).css({
					display: 'None'
				});
				$($iframe).appendTo($content);

				var pdfWindow = $iframe.contentWindow;
				pdfWindow.onload = function()
				{
					pdfWindow.focus();
					pdfWindow.print();
				};
			}
		}

	}

	/**
	 * On when fit to page button is clicked.
	 *
	 */
	DocumentFilePreviewViewModel.prototype.onFitToPageBtnClick = function()
	{
		var self = this, fileType = self.obFileType(),
			fitToPageFunc = self.AVAILABLE_FILE_TYPES[fileType]["FIT_TO_PAGE"];

		if (typeof fitToPageFunc === "function")
		{
			fitToPageFunc();
		}
	};

	/**
		 * On when zoom out button is clicked.
		 *
		 */
	DocumentFilePreviewViewModel.prototype.onZoomOutBtnClick = function()
	{
		this.zoomScale = Math.max(ZOOM_LEVEL_MIN, this.zoomScale - this.zoomIncrement);
		this.updatePreviewSizeWithScale();
	};

	/**
	 * On when zoom in button is clicked.
	 *
	 */
	DocumentFilePreviewViewModel.prototype.onZoomInBtnClick = function()
	{
		this.zoomScale = Math.min(ZOOM_LEVEL_MAX, this.zoomScale + this.zoomIncrement);
		this.updatePreviewSizeWithScale();
	};

	/**
	 * Trigger download of the file on browser.
	 *
	 * @param {String} fileName
	 * @param {String} mimeType
	 * @param {String} fileContent
	 */
	DocumentFilePreviewViewModel.prototype.initDownloadOnBrowser = function(fileName, mimeType, fileContent)
	{
		var a = document.createElement('a');
		a.style = "display: none";
		document.body.appendChild(a);
		a.download = fileName;
		a.type = mimeType;

		var self = this, blobURI = null;
		if (self.obFileType() && self.AVAILABLE_FILE_TYPES[self.obFileType()]["ConvertToBlob_METHOD"])
		{
			blobURI = self.AVAILABLE_FILE_TYPES[self.obFileType()]["ConvertToBlob_METHOD"]();
		}
		else
		{
			blobURI = URL.createObjectURL(convertBase64DataToBlob(fileContent, mimeType));
		}
		a.href = blobURI;

		a.click();
		a.remove();
	};

	/**
	 * Trigger download of the file on browser.
	 *
	 * @param {String} fileName
	 * @param {String} mimeType
	 * @param {String} url
	 */
	DocumentFilePreviewViewModel.prototype.initDownloadFromUrlOnBrowser = function(fileName, mimeType, url)
	{
		var a = document.createElement('a');
		a.style = "display: none";
		a.target = "_blank";
		document.body.appendChild(a);
		a.download = fileName;
		a.type = mimeType;
		a.href = url;
		a.click();
		a.remove();
	};

	function convertBase64DataToBlob(fileContent, mimeType)
	{
		var binStr = atob(fileContent),
			len = binStr.length,
			arr = new Uint8Array(len);

		for (var i = 0; i < len; i++)
		{
			arr[i] = binStr.charCodeAt(i);
		}

		return new Blob([arr], {
			type: mimeType
		});
	}

	/**
	 * Determine the file type according to mime type.
	 * 
	 * @param {String} mimeType
	 */
	DocumentFilePreviewViewModel.prototype.determineFileTypeFromMime = function(mimeType)
	{
		for (var type in this.AVAILABLE_FILE_TYPES)
		{
			if (this.AVAILABLE_FILE_TYPES[type].MIME_TYPES.indexOf(mimeType) > -1)
			{
				return type;
			}
		}

		return null;
	};

	/**
	 * Determine if the file is previewable by given MimeType.
	 *
	 * @param {String} mimeType
	 */
	DocumentFilePreviewViewModel.prototype.isFilePreviewable = function(mimeType)
	{
		var self = this,
			fileType = self.determineFileTypeFromMime(mimeType);

		if (!fileType) return false;

		return true;
	};

	/**
	 * Close preview modal on error.
	 *
	 * @param {String} errorMessage
	 */
	DocumentFilePreviewViewModel.prototype.closeOnError = function(errorMessage)
	{
		var self = this;
		tf.promiseBootbox.alert(errorMessage)
			.then(function()
			{
				self.hide();
			});
	};

	/**
	 * Dispose function.
	 *
	 */
	DocumentFilePreviewViewModel.prototype.dispose = function()
	{
		var self = this;

		self.unbindEvents();

		if (self.$element && self.$element.length > 0)
		{
			self.$element.remove();
			self.$element = null;
		}

		self.$container = null;
		self.documentId = null;
	};
})();
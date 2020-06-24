(function()
{
	var CONFIRMATION_TITLE = "Confirmation Message";
	createNamespace("TF.DetailView.DataBlockComponent").AttachBlock = AttachBlock;

	function AttachBlock(options, detailView)
	{
		var self = this;

		TF.DetailView.DataBlockComponent.BaseDataBlock.call(self, detailView);

		self.options = options;
		self.entity = detailView.recordEntity;
		self.obEditing = detailView.obEditing;
		self.$detailViewRoot = detailView.$element;
		self.isCreateGridNewRecord = detailView.isCreateGridNewRecord;
		self.fieldEditorHelper = detailView.fieldEditorHelper;
		self.uploadDocumentHelper = detailView.uploadDocumentHelper;
		self.attachFileChangedEvent = detailView.attachFileChangedEvent;

		self.detailViewHelper = tf.helpers.detailViewHelper;
		self.uniqueClassName = options.uniqueClassName || self.detailViewHelper.generateUniqueClassName();

		self.refresh = self.refresh.bind(self);

		self.$el = $("<div>\
						<div class='grid-stack-item-content attach-document-stack'>\
								<div class='item-content add-document-data-point'>\
                                    <div class='place-holder" + (self.isReadOnly() ? " disabled" : "") + "'>Drop file to add document, or <span class='browse-file'>browse</span></div>\
									<div class='content-wrapper'>\
										<div class='file-container'>\
											<div class='file-icon'></div>\
											<div class='file-name'></div>\
										</div>\
										<div class='control-bar'>\
											<a class='preview hide'>Preview</a>\
											<a class='download'>Download</a>\
										</div>\
									</div>\
								</div>\
							</div>\
						</div>").addClass(self.uniqueClassName);

		if (!self.isReadOnly())
		{
			self.$el.find(".control-bar").append("<span class='trash-can'></span>");
		}

		var $uploadFileContainer = self.$detailViewRoot.find('.upload-file-container');

		if (self.isReadMode())
		{
			if (self.entity && self.entity.FileName)
			{
				self._updateDocumentBlock(self.entity, self.$el.find(".attach-document-stack"));
			}
		}
		else if ($uploadFileContainer.length > 0)
		{
			if ($uploadFileContainer.hasClass('active'))
			{
				$uploadFileContainer.removeClass('active');
			}
			self._unbindDragAndDropFileEvent();

			if (self.uploadDocumentHelper)
			{
				self.uploadDocumentHelper.dispose();
			}
		}
	}

	AttachBlock.prototype = Object.create(TF.DetailView.DataBlockComponent.BaseDataBlock.prototype);

	AttachBlock.prototype.getAdaptiveFileStream = function()
	{
		var self = this;

		if (!self.uploadDocumentHelper) return;

		var uploadFiles = self.uploadDocumentHelper.getFiles();

		if (Array.isArray(uploadFiles) && uploadFiles.length > 0)
		{
			var rawFile = uploadFiles[0].rawFile;

			return self.uploadDocumentHelper.getFileStream()
				.then(function(fileStream)
				{
					if (fileStream)
					{
						var fileStreamSplit = fileStream.split(",");
						return {
							FileName: rawFile.name,
							MimeType: rawFile.type,
							FileContent: fileStreamSplit.length == 2 ? _.last(fileStream.split(",")) : ""
						};
					}
				});
		}

		return Promise.resolve(self.entity);
	};

	AttachBlock.prototype._updateDocumentBlock = function(entity, $item)
	{
		var self = this,
			entity = entity || self.entity,
			isDocFilePreviewable = tf.docFilePreviewHelper.isFilePreviewable(entity.MimeType);
		/**
		 * Not the true content, but the filename.
		 * true content means FileContent field is not empty
		 */
		$item.addClass("with-content");
		$item.find('.file-name').text(entity.FileName);

		if (!isDocFilePreviewable)
		{
			$item.find(".preview").addClass("hide");
		}
		else
		{
			$item.find(".preview").removeClass("hide");
		}
	};

	/**
	 * Attach is only belong to Document grid.
	 * So the events(drag dragstart dragend dragover dragenter dragleave drop) will not be shared among different grids.
	 */
	AttachBlock.prototype._unbindDragAndDropFileEvent = function()
	{
		var self = this,
			$uploadFileContainer = self.$detailViewRoot.find('.upload-file-container'),
			$form = $uploadFileContainer.find('form');

		$form.off('drag dragstart dragend dragover dragenter dragleave drop');
		$(document).off('dragover' + self.detailView.eventNameSpace + ' dragenter' + self.detailView.eventNameSpace
			+ ' dragleave' + self.detailView.eventNameSpace + ' dragend' + self.detailView.eventNameSpace + ' drop' + self.detailView.eventNameSpace);
	};

	AttachBlock.prototype.resetAttachDocumentStackItem = function()
	{
		var self = this,
			$item = self.$el.find('.attach-document-stack');

		$item.removeClass("with-content");
		self.detailView.updateDetailView();
		self.obEditing(true);
	};

	AttachBlock.prototype.showDocumentPreview = function(document)
	{
		tf.docFilePreviewHelper.show(document);
	};

	AttachBlock.prototype.browseAttachFile = function(e)
	{
		var self = this,
			$fileSelector = self.$detailViewRoot.find('#document-file-selector');

		if (!self.isReadMode()) return;

		e.stopPropagation();
		$fileSelector.trigger('click');
	};

	AttachBlock.prototype.initEvents = function()
	{
		var self = this;

		self.$el.on("click", ".browse-file", self.browseAttachFile.bind(self));
		self.$el.on('click', ".preview", function(e)
		{
			self.getAdaptiveFileStream().then(function(document)
			{
				if (!document) return;

				self.showDocumentPreview(document);
			});
		});

		self.$el.on("click", ".download", function(e)
		{
			self.getAdaptiveFileStream().then(function(document)
			{
				var helper = tf.docFilePreviewHelper;
				if (document && document.FileContent)
				{
					helper.initDownloadOnBrowser(document.FileName, document.MimeType, document.FileContent);
				}
				else
				{
					helper.readFileStream(self.entity.Id).then(function(fileContent)
					{
						if (!fileContent)
						{
							tf.promiseBootbox.alert("The file content is empty!");
							return;
						}

						helper.initDownloadOnBrowser(self.entity.FileName, self.entity.MimeType, fileContent);
					});
				}
			});
		});

		self.$el.on('click', '.trash-can', function(e)
		{
			e.stopPropagation();

			var fileNameEditKey = "FileName",
				currentAttachedFileName = self.fieldEditorHelper.editFieldList[fileNameEditKey] ?
					self.fieldEditorHelper.editFieldList[fileNameEditKey].value : self.entity.FileName,
				confirmMsg = String.format("Are you sure you want to remove the attached file \"{0}\"?", currentAttachedFileName);

			tf.promiseBootbox.yesNo(confirmMsg, CONFIRMATION_TITLE)
				.then(function(result)
				{
					if (result)
					{
						if (self.uploadDocumentHelper)
						{
							self.uploadDocumentHelper.clearAllFiles();
						}

						self.attachFileChangedEvent.notify({ isEmpty: true });
						// self.grid.manageLayout();
						self.fieldEditorHelper.editFieldList[fileNameEditKey] = { value: "" };
					}
				});
		});

		self.attachFileChangedEvent.subscribe(self.refresh);
	};

	AttachBlock.prototype.refresh = function(e, data)
	{
		var self = this;

		if (data.isEmpty)
		{
			self.resetAttachDocumentStackItem();
		}
		else
		{
			self._setDocumentDataPoints(data.file);
		}
	};

	AttachBlock.prototype._setDocumentDataPoints = function(file)
	{
		var self = this,
			docEntity = { // For newly dragged file, compose a temp document entity with FileName and MimeType
				FileName: file.name,
				MimeType: file.type,
			};
		self._updateDocumentBlock(docEntity, self.$el.find('.attach-document-stack'));
		self.detailView.updateDetailView(file);
		self.obEditing(true);
	};

	AttachBlock.prototype._shouldUpdateNameWithFileName = function()
	{
		var self = this;
		if (self.isCreateGridNewRecord)
		{
			return self.fieldEditorHelper.editFieldList["Name"] == null || self.fieldEditorHelper.editFieldList["Name"].value.length === 0;
		}

		if (self.fieldEditorHelper.editFieldList["Name"] != null && self.fieldEditorHelper.editFieldList["Name"].value == null) return true;
	};

	AttachBlock.prototype.dispose = function()
	{
		var self = this;
		self.$el.off('click');
		self.attachFileChangedEvent.unsubscribe(self.refresh);
	};

})();
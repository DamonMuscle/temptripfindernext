(function()
{
	createNamespace("TF.Page").ResizablePage = ResizablePage;

	function ResizablePage(options)
	{
		var self = this;
		self.$element = null;
		self.$leftPage = null;
		self.$rightPage = null;
		self.$gridPage = null;
		self.$otherPage = null;
		self.$dragHandler = null;

		self.obShowGrid = ko.observable(true);
		self.obGridData = ko.observable();
		self.obOtherData = ko.observable();
		self.obRightData = ko.observable();
		self.obGridTemplate = ko.observable();
		self.obOtherTemplate = ko.observable();
		self.obRightTemplate = ko.observable();

		self.leftPageSizeKey = "leftpagesize.";
		self.leftPageType = "";
		self.minLeftWidth = 300;
		self.minRightWidth = 580;

		self.onLoaded = new TF.Events.Event();
	}

	ResizablePage.prototype.constructor = ResizablePage;

	ResizablePage.prototype.init = function(model, element)
	{
		var self = this;
		self.$element = $(element);
		self.$leftPage = self.$element.find(".left-page");
		self.$gridPage = self.$leftPage.find(".grid-page");
		self.$otherPage = self.$leftPage.find(".other-page");
		self.$rightPage = self.$element.find(".right-page");
		self.$dragHandler = self.$element.find(".resize-handler");

		self.initDragHandler();
		self.onLoaded.notify();
	};

	ResizablePage.prototype.setLeftPage = function(templateName, data, newGrid, firstLoad)
	{
		var self = this, $content;

		//grid page
		if (data.isGridPage)
		{
			if (newGrid)
			{
				self.clearLeftContent();

				self.obGridTemplate(templateName);
				self.obGridData(data);
				$content = $("<div class='main-body' data-bind='template:{ name: obGridTemplate, data: obGridData }'></div>");

				self.$gridPage.append($content);
				if (!firstLoad)
				{
					ko.applyBindings(ko.observable(self), $content[0]);
				}
			}
			self.obShowGrid(true);
		}
		else
		{
			self.clearLeftOtherContent();

			self.obOtherTemplate(templateName);
			self.obOtherData(data);
			$content = $("<div class='main-body' data-bind='template:{ name: obOtherTemplate, data: obOtherData }'></div>");
			self.$otherPage.append($content);
			ko.applyBindings(ko.observable(self), $content[0]);
			self.obShowGrid(false);
		}

		self.reLayoutPage();
	};

	ResizablePage.prototype.setRightPage = function(templateName, data)
	{
		var self = this, $content;

		self.clearRightContent();

		self.obRightTemplate(templateName);
		self.obRightData(data);
		$content = $("<div class='main-body' data-bind='template:{ name: obRightTemplate, data: obRightData }'></div>");

		self.$rightPage.append($content);
		ko.applyBindings(ko.observable(self), $content[0]);

		self.reLayoutPage();
	};

	ResizablePage.prototype.reLayoutPage = function()
	{
		var self = this, leftWidth, totalWidth;

		if (!self.$element)
		{
			return;
		}

		totalWidth = self.$element.outerWidth();
		leftWidth = totalWidth * (tf.storageManager.get(self.leftPageSizeKey + self.leftPageType) || 0.5);

		if (!self.obGridData() && !self.obOtherData())
		{
			return;
		}

		if (self.obRightData())
		{
			if (leftWidth < self.minLeftWidth)
			{
				leftWidth = self.minLeftWidth;
			}
			else if (totalWidth - leftWidth < self.minRightWidth)
			{
				leftWidth = totalWidth - self.minRightWidth;
			}

			self.$leftPage.width(leftWidth);
			if (!self.obShowGrid())
			{
				self.$otherPage.width(leftWidth);
			}
			self.$rightPage.width(totalWidth - leftWidth);
			self.$dragHandler.css("left", leftWidth + "px");
			self.resizeGrid(leftWidth);
		}
		else
		{
			self.$rightPage.width(0);
			self.$leftPage.width("100%");
			self.resizeGrid(totalWidth);
		}
	};

	ResizablePage.prototype.initDragHandler = function()
	{
		var self = this, totalWidth = self.$element.outerWidth();
		self.$dragHandler.draggable(
			{
				distance: 0,
				axis: "x",
				containment: "parent",
				start: function(e, ui)
				{
					if ($(e.originalEvent.target).hasClass("sliderbar-button"))
					{
						$(e.currentTarget).find(".sliderbar-button").addClass("slider-tapped");
					}
				},
				stop: function(e, ui)
				{
					$(e.currentTarget).find(".sliderbar-button").removeClass("slider-tapped");
					self.savePageRate();
				},
				drag: function(e, ui)
				{
					if (!ui.position || ui.position.left === null || ui.position.left === undefined) { return; }

					var totalWidth = self.$element.outerWidth(), currentLeft = ui.position.left;
					if (currentLeft < self.minLeftWidth)
					{
						currentLeft = self.minLeftWidth;
					}
					else if (totalWidth - currentLeft < self.minRightWidth)
					{
						currentLeft = totalWidth - self.minRightWidth;
					}
					ui.position.left = currentLeft;
					self.resize(currentLeft);
				}
			});
	};

	ResizablePage.prototype.savePageRate = function()
	{
		var self = this, totalWidth;

		if (!self.$element)
		{
			return;
		}

		totalWidth = self.$element.outerWidth();
		tf.storageManager.save(self.leftPageSizeKey + self.leftPageType, self.$leftPage.width() / totalWidth);
	};

	ResizablePage.prototype.resize = function(left)
	{
		var self = this, totalWidth = self.$element.outerWidth();

		self.$leftPage.width(left);
		if (!self.obShowGrid())
		{
			self.$otherPage.width(left);
		}
		else
		{
			self.resizeGrid(left);
		}
		self.$rightPage.width(totalWidth - left);
	};

	ResizablePage.prototype.resizeGrid = function(left)
	{
		var self = this, $grid, lockedHeaderWidth, paddingRight, width,
			iconRow, wrapRow, iconRowTop, iconRowLeft;

		$grid = self.$leftPage.find(".kendo-grid");
		if ($grid.length > 0)
		{
			lockedHeaderWidth = $grid.find('.k-grid-header-locked').width();
			paddingRight = parseInt($grid.find(".k-grid-content").css("padding-right"));
			width = left - lockedHeaderWidth - paddingRight;

			$.each($grid, function(index, container)
			{
				$(container).find(".k-auto-scrollable,.k-grid-content").width(width);
			});

			//update toolbar
			iconRow = self.$leftPage.find(".iconrow");
			wrapRow = self.$leftPage.find(".grid-staterow-wrap");
			iconRow.css("display", "block");
			wrapRow.removeClass("pull-left").addClass("pull-right");
			wrapRow.css("width", "auto");
			iconRow.css("width", "auto");
			$(document).off(".iconhover");
			wrapRow.off(".iconhover");
			if (self.$leftPage.find(".grid-icons").outerHeight() > 28)
			{
				iconRow.css("display", "none");
				wrapRow.removeClass("pull-right").addClass("pull-left").css("width", "100%");
				wrapRow.on("mousemove.iconhover", function()
				{
					wrapRow.css("display", "none");
					iconRow.css("display", "block");
					iconRow.css("width", "100%");
				});
				$(document).on("mousemove.iconhover", function(e)
				{
					iconRowTop = iconRow.offset().top, iconRowLeft = iconRow.offset().left;
					if (!(e.pageY > iconRowTop && e.pageY < iconRowTop + iconRow.outerHeight()
						&& e.pageX > iconRowLeft && e.pageX < iconRowLeft + iconRow.outerWidth()))
					{
						iconRow.css("display", "none");
						wrapRow.css("display", "block");
						wrapRow.css("width", "100%");
					}
				});
			}
			else
			{
				wrapRow.css("width", "auto");
				iconRow.css("width", "auto");
				wrapRow.css("display", "block");
				iconRow.css("display", "block");
			}
		}
	};

	ResizablePage.prototype.clearRightContent = function()
	{
		var self = this;

		if (self.obRightData() && self.obRightData().dispose)
		{
			self.obRightData().dispose();
		}
		self.$rightPage.empty();
		self.obRightData(null);
	};

	ResizablePage.prototype.clearLeftGridContent = function()
	{
		var self = this;

		if (self.obGridData() && self.obGridData().dispose)
		{
			self.obGridData().dispose();
		}

		self.$gridPage.empty();
		self.obGridData(null);
	};

	ResizablePage.prototype.clearLeftOtherContent = function()
	{
		var self = this;

		if (self.obOtherData() && self.obOtherData().dispose)
		{
			self.obOtherData().dispose();
		}

		self.$otherPage.empty();
		self.obOtherData(null);

		if (self.obGridData())
		{
			self.obShowGrid(true);
			self.resizeGrid(self.$leftPage.width());
		}
	};

	ResizablePage.prototype.clearLeftContent = function()
	{
		var self = this;

		self.clearLeftGridContent();
		self.clearLeftOtherContent();
	};

	ResizablePage.prototype.closeRightPage = function()
	{
		var self = this;

		self.clearRightContent();
		self.reLayoutPage();
	};

	ResizablePage.prototype.clearContent = function()
	{
		var self = this;
		self.clearRightContent();
		self.clearLeftContent();
	};
})();
(function()
{
	createNamespace("TF.Page").ResizablePage = ResizablePage;

	function ResizablePage(options)
	{
		var self = this;
		self.$element = null;
		self.$leftPage = null;
		self.$rightPage = null;
		self.$dragHandler = null;
		self.obLeftData = ko.observable();
		self.obRightData = ko.observable();
		self.obLeftTemplate = ko.observable();
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
		self.$rightPage = self.$element.find(".right-page");
		self.$dragHandler = self.$element.find(".resize-handler");

		self.initDragHandler();
		self.onLoaded.notify();
	};

	ResizablePage.prototype.setLeftPage = function(templateName, data)
	{
		var self = this, notFirstLoad = self.obLeftData(),
			$content;

		self.clearLeftContent();

		self.obLeftTemplate(templateName);
		self.obLeftData(data);
		$content = $("<div class='main-body' data-bind='template:{ name: obLeftTemplate, data: obLeftData }'></div>");

		self.$leftPage.append($content);
		if (notFirstLoad)
		{
			ko.applyBindings(ko.observable(self), $content[0]);
		}

		self.reLayoutPage();
	};

	ResizablePage.prototype.setRightPage = function(templateName, data)
	{
		var self = this, $content;

		self.clearRightContent();

		self.obRightTemplate(templateName);
		self.obRightData(data);
		$content = $("<div data-bind='template:{ name: obRightTemplate, data: obRightData }'></div>");

		self.$rightPage.append($content);
		ko.applyBindings(ko.observable(self), $content[0]);

		self.reLayoutPage();
	};

	ResizablePage.prototype.reLayoutPage = function()
	{
		var self = this, leftWidth, totalWidth = self.$element.outerWidth();

		leftWidth = tf.storageManager.get(self.leftPageSizeKey + self.leftPageType) || totalWidth / 2;

		if (!self.obLeftData())
		{
			return;
		}

		if (self.obRightData())
		{
			self.$leftPage.width(leftWidth);
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
		var self = this;
		self.$dragHandler.draggable(
			{
				distance: 0,
				axis: "x",
				containment: "parent",
				start: function(e, ui)
				{
				},
				stop: function(e, ui)
				{
					tf.storageManager.save(self.leftPageSizeKey + self.leftPageType, ui.position.left);
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

	ResizablePage.prototype.resize = function(left)
	{
		var self = this, totalWidth = self.$element.outerWidth();

		self.$leftPage.width(left);
		self.resizeGrid(left);
		self.$rightPage.width(totalWidth - left);
	};

	ResizablePage.prototype.resizeGrid = function(left)
	{
		var self = this, $grid, lockedHeaderWidth, paddingRight, width;
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

	ResizablePage.prototype.clearLeftContent = function()
	{
		var self = this;

		if (self.obLeftData() && self.obLeftData().dispose)
		{
			self.obLeftData().dispose();
		}
		self.$leftPage.empty();
		self.obLeftData(null);
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
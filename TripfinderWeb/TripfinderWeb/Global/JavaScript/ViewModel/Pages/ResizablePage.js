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
		self.onSizeChanged = new TF.Events.Event();
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

		if (window.opener && window.name.indexOf("new-detailWindow") >= 0)
		{
			self.$dragHandler.hide();
		}
		self.initDragHandler();
		self.onLoaded.notify();
		$(window).off(".resizepage").on("resize.resizepage", self.reLayoutPage.bind(self, null));
	};

	ResizablePage.prototype.setLeftPage = function(templateName, data, newGrid, firstLoad)
	{
		var self = this, $content;

		//grid page
		if (data && data.isGridPage || data && data.isSchedulerPage)
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
			if (!firstLoad)
			{
				ko.applyBindings(ko.observable(self), $content[0]);
			}
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

	ResizablePage.prototype.refreshLeftGrid = function()
	{
		var self = this, $grid, grid;
		$grid = self.$leftPage.find(".kendo-grid");
		grid = $grid.data("kendoGrid");
		grid.dataSource.read();
	};

	ResizablePage.prototype.reLayoutPage = function(width)
	{
		var self = this, leftWidth, totalWidth, result;

		if (!self.$element)
		{
			return;
		}

		totalWidth = self.$element.outerWidth();
		leftWidth = width ? width : totalWidth * (tf.storageManager.get(self.leftPageSizeKey + self.leftPageType) || 0.5);

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
			result = leftWidth;
		}
		else
		{
			self.$rightPage.width(0);
			self.$leftPage.width("100%");
			result = totalWidth;
		}

		if (self.leftPageType.indexOf("Scheduler") === -1)
		{
			self.resizeGrid(result);
		}
		else if ($(".kendoscheduler").length > 0 && $(".kendoscheduler").getKendoScheduler())
		{
			$(".kendoscheduler").getKendoScheduler().refresh();
		}

		if (self.obOtherData() && self.obOtherData().pageType === "detailview")
		{
			self.obOtherData().manageLayout();
		}
	};

	ResizablePage.prototype.initDragHandler = function()
	{
		var self = this, totalWidth = self.$element.outerWidth(), hasDragMoved, offsetLeftOnDragStart;
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
					offsetLeftOnDragStart = ui.offset.left;
					hasDragMoved = false;
				},
				stop: function(e, ui)
				{
					var currentLeft = ui.position.left;
					$(e.currentTarget).find(".sliderbar-button").removeClass("slider-tapped");

					if (!hasDragMoved)
					{
						self.$dragHandler.css("left", self.minLeftWidth + "px");
						self.resize(self.minLeftWidth);
					}
					else
					{
						self.resize(currentLeft);
					}
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

					if (offsetLeftOnDragStart !== ui.offset.left)
					{
						hasDragMoved = true;
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
		self.$rightPage.width(totalWidth - left);
		if (!self.obShowGrid())
		{
			self.$otherPage.width(left);
		}
		else
		{
			self.resizeGrid(left);
			if (self.leftPageType.indexOf("Scheduler") >= 0)
			{
				//It seems like a bug of kendo scheduler, refresh once only the layout of scheduler is correct,
				//the events in it will be messed up, refresh again will solve this issue.
				$(".kendoscheduler").getKendoScheduler().refresh();
				$(".kendoscheduler").getKendoScheduler().refresh();
			}
		}
		self.onSizeChanged.notify();
	};

	ResizablePage.prototype.resizeGrid = function(left)
	{
		var self = this, $grid, lockedHeaderWidth, paddingRight, width, totalWidth = self.$element.outerWidth(),
			iconRow, wrapRow, iconRowTop, iconRowLeft, $rightGrid, pageHeader, pageTitle, newRequest, newRequestTop, newRequestLeft;

		$grid = self.$leftPage.find(".kendo-grid");
		$rightGrid = self.$rightPage.find(".kendo-grid");
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
			if (!TF.isPhoneDevice)
			{
				iconRow = self.$leftPage.find(".iconrow");
				wrapRow = self.$leftPage.find(".grid-staterow-wrap");
				pageHeader = self.$leftPage.find(".desktop-header");
				pageTitle = self.$leftPage.find(".page-title:not(.detail)");
				newRequest = self.$leftPage.find(".desktop-header .new-request");

				iconRow.css("display", "block");
				wrapRow.removeClass("pull-left").addClass("pull-right");
				wrapRow.css("width", "auto");
				iconRow.css("width", "auto");
				$(document).off(".iconhover");
				wrapRow.off(".iconhover");
				$(document).off(".newRequestHover");
				pageHeader.off(".newRequestHover");

				if ((!self.obRightData() || self.obRightData().pageType === "detailview") && self.leftPageType !== "reports")
				{
					pageTitle.css({ "display": "block", "width": "auto" });
					newRequest.css({ "display": "block", "width": "140px" }).removeClass("pull-left").addClass("pull-right");
					pageHeader.css({ "height": "unset", "float": "left", "width": "100%" });

					if (self.obRightData())
					{
						self.obRightData().updateDetailViewPanelHeader();
					}

					if (pageHeader.outerHeight() > 56)
					{
						newRequest.hide();
						pageHeader.on("mousemove.newRequestHover", function()
						{
							pageTitle.css({ "display": "none", "width": "100%" });
							pageHeader.css({ "height": "56px" });
							newRequest.removeClass("pull-right").addClass("pull-left").css("display", "block");
						});
						$(document).on("mousemove.newRequestHover", function(e)
						{
							var pageHeaderTop = pageHeader.offset().top;
							var pageHeaderLeft = pageHeader.offset().left;
							if (!(e.pageY > pageHeaderTop && e.pageY < pageHeaderTop + pageHeader.outerHeight()
								&& e.pageX > pageHeaderLeft && e.pageX < pageHeaderLeft + pageHeader.outerWidth()))
							{
								newRequest.css("display", "none");
								pageTitle.css("display", "block");
							}
						});
					}
					else
					{
						pageTitle.css({ "display": "block", "width": "auto" });
						newRequest.css({ "display": "block" });
					}
				} else
				{
					pageTitle.css({ "display": "block", "width": "auto" });
					newRequest.css({ "display": "none" });
				}

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

					if (!TF.isMobileDevice)
					{
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
				}
				else
				{
					wrapRow.css("width", "auto");
					iconRow.css("width", "auto");
					wrapRow.css("display", "block");
					iconRow.css("display", "block");
				}
			}
		}
		if ($rightGrid && $rightGrid.length > 0)
		{
			lockedHeaderWidth = $rightGrid.find('.k-grid-header-locked').width();
			paddingRight = parseInt($rightGrid.find(".k-grid-content").css("padding-right"));
			width = $rightGrid.find(".k-grid-header").outerWidth() - lockedHeaderWidth - paddingRight;

			$.each($rightGrid, function(index, container)
			{
				$(container).find(".k-auto-scrollable,.k-grid-content").width(width);
			});
		}
	};

	ResizablePage.prototype.clearRightContent = function()
	{
		var self = this;

		if (self.obRightData())
		{
			if (self.obGridData())
			{
				self.obGridData().clearRelatedRightPage(self.obRightData().pageType);
			}

			if (self.obRightData().dispose)
			{
				self.obRightData().dispose();
			}
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
		self.$otherPage.css("width", "auto");
		self.obOtherData(null);

		if (self.obGridData())
		{
			self.obShowGrid(true);
			self.resize(self.$leftPage.width());
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
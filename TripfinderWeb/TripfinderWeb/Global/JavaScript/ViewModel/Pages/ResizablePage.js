(function()
{
	createNamespace("TF.Page").ResizablePage = ResizablePage;

	const RightPageContentType = {
		detailview: "detailview",
		splitmap: "splitmap",
		dataentry: "dataentry"
	};

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
		self.obGridTemplate = ko.observable();
		self.obOtherTemplate = ko.observable();
		self.obRightContentType = ko.observable();

		self.leftPageSizeKey = "leftpagesize.";
		self.leftPageType = "";
		self.minLeftWidth = 300;
		self.minRightWidth = 580;
		self.leftGridSelectItems = [];
		self.leftGrid = null;

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

	ResizablePage.prototype.setRightPage = async function(templateName, data, contentType, eventHandlers = null)
	{
		const self = this;
		let $content;

		if(!contentType)
		{
			if(data instanceof TF.DetailView.DetailViewViewModel)
			{
				contentType = RightPageContentType.detailview;
			}
			else if (data instanceof TF.DataEntry.FieldTripDataEntryViewModel)
			{
				contentType = RightPageContentType.dataentry;
			}
		}

		self.clearRightContent();

		self.obRightContentType(contentType);

		switch(contentType)
		{
			case RightPageContentType.dataentry:
				self.obRightDataEntryTemplate = ko.observable(templateName);
				self.obDataEntry = ko.observable(data);
				$content = $("<div class='main-body' data-bind='template:{ name: obRightDataEntryTemplate, data: obDataEntry }'></div>");
				self.$rightPage.find(".data-entry").append($content);
				ko.applyBindings(ko.observable(self), $content[0]);
				break;
			case RightPageContentType.splitmap:
				self.mapviewInstace = self.mapviewInstace || await TF.GIS.MapFactory.createInstance(self.$rightPage.find(".splitmap"), { eventHandlers });
				break;
			case RightPageContentType.detailview:
			default:
				self.obRightDetailViewTemplate = ko.observable(templateName);
				self.obDetailView = ko.observable(data);
				$content = $("<div class='main-body' data-bind='template:{ name: obRightDetailViewTemplate, data: obDetailView }'></div>");
				self.$rightPage.find(".detail-view-container").append($content);
				ko.applyBindings(ko.observable(self), $content[0]);
				break;
		}
		self.reLayoutPage();
	};

	ResizablePage.prototype.getRightData = function()
	{
		const self = this;
		switch(self.obRightContentType())
		{
			case RightPageContentType.detailview:
				return self.obDetailView();
			case RightPageContentType.dataentry:
				return self.obDataEntry();
			case RightPageContentType.splitmap:
				return self.mapviewInstace;
		}
	};

	ResizablePage.prototype.refreshLeftGrid = function()
	{
		var self = this, $grid, grid;
		$grid = self.$leftPage.find(".kendo-grid");
		grid = $grid.data("kendoGrid");
		grid.dataSource.read();
	};

	ResizablePage.prototype.refreshLeftGridKeepSelectItems = function()
	{
		var self = this, $grid;
		$grid = self.$leftPage.find(".kendo-grid");
		self.leftGrid = $grid.data("kendoGrid");
		var items = self.leftGrid.items();
		self.leftGridSelectItems = [];
		items.each(function(idx, row)
		{
			var dataItem = self.leftGrid.dataItem(row);
			if (row !== null && row.className.toString().indexOf('selected') >= 0 && self.leftGridSelectItems.indexOf(dataItem.id) === -1)
			{
				self.leftGridSelectItems.push(dataItem.id);
			}
		});
		//$grid.bind("dataBound", self.reLeftGridSelectSavedValue.bind(self));
		self.obGridData().searchGrid.onGridReadCompleted.subscribe(self.reLeftGridSelectSavedValue.bind(self));
		self.leftGrid.dataSource.read();

	};

	ResizablePage.prototype.reLeftGridSelectSavedValue = function()
	{
		var self = this;
		if (self.leftGridSelectItems.length > 0)
		{
			self.obGridData().searchGrid.getSelectedIds(self.leftGridSelectItems);
		}
		self.obGridData().searchGrid.onGridReadCompleted.unsubscribeAll();
	}

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

		if (self.obRightContentType())
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
			result = $("body").width() - $(".navigation-container").outerWidth() - 2;
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
		var self = this, hasDragMoved, offsetLeftOnDragStart;
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
					currentLeft = self.determineLeftPageWidth(totalWidth, currentLeft);

					if (offsetLeftOnDragStart !== ui.offset.left)
					{
						hasDragMoved = true;
					}
					ui.position.left = currentLeft;
					self.resize(currentLeft);
				}
			});
	};

	ResizablePage.prototype.determineLeftPageWidth = function(totalWidth, left)
	{
		const self = this;

		if (left < self.minLeftWidth)
		{
			if (self.obRightContentType() !== RightPageContentType.splitmap)
			{
				left = self.minLeftWidth;
			}
			else
			{
				left = (left > self.minLeftWidth/2) ? self.minLeftWidth : 0;
			}
		}
		else if (totalWidth - left < self.minRightWidth)
		{
			left = totalWidth - self.minRightWidth;
		}

		return left;
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
		left = self.determineLeftPageWidth(totalWidth, left);
		self.$leftPage.width(left);
		self.$rightPage.width(totalWidth - left);
		if (!self.obShowGrid())
		{
			self.$otherPage.width(left);
		}
		else
		{
			self.resizeGrid(left);

			self.$dragHandler.css("left", left + "px");
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
			iconRow, wrapRow, iconRowTop, iconRowLeft, pageHeader, pageTitle, newRequest, newRequestTop, newRequestLeft;

		$grid = self.$leftPage.find(".kendo-grid");
		if ($grid.length > 0)
		{
			lockedHeaderWidth = $grid.find('.k-grid-header-locked').width();
			paddingRight = parseInt($grid.find(".k-grid-content").css("padding-right"));
			width = left - lockedHeaderWidth - paddingRight;

			$.each($grid, function(index, container)
			{
				if ($(container).hasClass("kendo-summarygrid-container"))
				{
					$(container).find(".k-auto-scrollable,.k-grid-content").width(width + paddingRight);
				}
				else
				{
					$(container).find(".k-auto-scrollable,.k-grid-content").width(width);
				}
			});

			//update toolbar
			if (!TF.isPhoneDevice)
			{
				iconRow = self.$leftPage.find(".iconrow");
				wrapRow = self.$leftPage.find(".grid-staterow-wrap");
				pageHeader = self.$leftPage.find(".desktop-header");
				pageTitle = self.$leftPage.find(".page-title:not(.detail)");
				newRequest = self.$leftPage.find(".desktop-header .new-request");

				iconRow.css("display", "flex");
				wrapRow.removeClass("pull-left").addClass("pull-right");
				wrapRow.css("width", "auto");
				iconRow.css("width", "auto");
				$(document).off(".iconhover");
				wrapRow.off(".iconhover");
				$(document).off(".newRequestHover");
				pageHeader.off(".newRequestHover");

				if ((!self.obRightContentType() || self.obRightContentType() === RightPageContentType.detailview) && self.leftPageType !== "reports")
				{
					pageTitle.css({ "display": "block", "width": "auto" });
					if(tf.helpers.fieldTripAuthHelper.checkAddable(self.leftPageType))
					{
						newRequest.css({ "display": "block", "width": "140px" }).removeClass("pull-left").addClass("pull-right");
					}
					pageHeader.css({ "height": "unset", "float": "left", "width": "100%" });

					self.getRightData()?.updateDetailViewPanelHeader();

					if (pageHeader.outerHeight() > 56)
					{
						newRequest.hide();
						pageHeader.on("mousemove.newRequestHover", function()
						{
							pageTitle.css({ "display": "none", "width": "100%" });
							pageHeader.css({ "height": "56px" });
							if(tf.helpers.fieldTripAuthHelper.checkAddable(self.leftPageType))
							{
								newRequest.removeClass("pull-right").addClass("pull-left").css("display", "block");
							}
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
						if(tf.helpers.fieldTripAuthHelper.checkAddable(self.leftPageType))
						{
							newRequest.css({ "display": "block" });
						}
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
						iconRow.css("display", "flex");
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
					iconRow.css("display", "flex");
				}
			}
		}
	};

	ResizablePage.prototype.clearRightContent = function()
	{
		var self = this;

		if (self.obRightContentType() && self.obRightContentType() !== RightPageContentType.splitmap)
		{
			const data = self.getRightData();
			if (self.obGridData())
			{
				self.obGridData().clearRelatedRightPage(data.pageType);
			}

			if (data.dispose)
			{
				data.dispose();
			}
		}

		self.$rightPage.find(">div.detail-view-container, >div.data-entry").empty();
		self.obRightContentType(null);
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

			if (!TF.isMobileDevice)
			{
				self.obGridData().searchGrid && self.obGridData().searchGrid.fitContainer();
				self.resize(self.$leftPage.width());
			}
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
		self.$leftPage.focus();
		tf.pageManager.obFieldTripEditPage(null);
	};

	ResizablePage.prototype.clearContent = function()
	{
		var self = this;
		self.clearRightContent();
		self.clearLeftContent();
	};

	ResizablePage.prototype.showMapView = async function(eventHandlers = null)
	{
		const self = this;
		await self.setRightPage(null, null, RightPageContentType.splitmap, eventHandlers);
	};
})();
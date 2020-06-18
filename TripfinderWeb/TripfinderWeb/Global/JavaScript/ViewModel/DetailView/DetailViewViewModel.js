(function()
{
	createNamespace("TF.DetailView").DetailViewViewModel = DetailViewViewModel;

	var viewableMimeTypes = [
		"text/plain",
		"image/gif",
		"image/png",
		"image/jpeg",
		"image/bmp",
		"application/pdf"
	];

	/**
	 * Constructor
	 * @returns {void} 
	 */
	function DetailViewViewModel (optionId)
	{
		var self = this;
		self.gridType = "fieldtrip";
		self.pageType = "detailview";
		self.optionId = optionId ? optionId : null;
		self.UNITHEIGHT = 58;
		//vertical margin not support cannot set to 0, so set to 1, looks the same.
		self.PADDING = 1;
		self.INITINPUTWIDTH = 359;
		self.EXTRAWIDTH = 253;
		self.defaultLayout = {
			width: 4,
			items: []
		};
		self.startUpdateAfterAddBlock = false;
		self.stickyName = "grid.detailscreenlayoutid." + self.gridType;
		self.stickyLayoutName = "grid.detailscreenlayoutname." + self.gridType;
		self.$columnPopup = null;
		self.changeColorTimeout = [];
		self.currentEntityId = -1;
		self.pendingDataPointRefreshing = null;

		//Events
		self.onToggleDataPointPanelEvent = new TF.Events.Event();
		self.onClosePanelEvent = new TF.Events.Event();
		self.deleteDataBlockEvent = new TF.Events.Event();
		self.groupDataBlockEvent = new TF.Events.Event();
		self.changeDataPointEvent = new TF.Events.Event();
		self.toggleResizableEvent = new TF.Events.Event();
		self.onColumnChangedEvent = new TF.Events.Event();
		self.onCloseDetailEvent = new TF.Events.Event();
		self.onCloseEditMode = new TF.Events.Event();
		self.selectItemClick = self.selectItemClick.bind(self);
		self.saveGroup = self.saveGroup.bind(self);
		self.cancelGroup = self.cancelGroup.bind(self);
		self.closeEditMode = self.closeEditMode.bind(self);

		//Data point panel init.
		self.dataPointGroupHelper = new TF.DetailView.DataPointGroupHelper(self);
		self.lineBlockHelper = new TF.DetailView.LineBlockHelper(self);
		self.dataPointPanel = new TF.DetailView.DataPointPanel(self);

		self.defaultSliderFontRate = 0.5;
		self.obSliderFontRate = ko.observable(self.defaultSliderFontRate);
		self.obShowSlider = ko.observable(false);
		self.gridStackItemOrignalHeight = [];

		self.initData();
		self.initEvents();

		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
		self.pageLevelViewModel.autoFocus = false;
		self.appearanceTemplate = {
			backgroundColor: null,
			borderColor: null,
			titleColor: null,
			contentColor: null
		};
		self.defaultColors = {
			backgroundColor: "#FFFFFF",
			borderColor: "transparent",
			titleColor: "#70A130",
			contentColor: "#000000"
		};
		self.basicGridConfig = {
			fieldtrip: { title: "Name", subTitle: "DepartDateTime" }
		};
		//Image
		self.oberrormessage = ko.observable(null);
		self.imageUpdated = false;
		self.apiPrefix = typeof (databaseId) !== "undefined" ? (tf.api.apiPrefixWithoutDatabase() + "/" + databaseId) : tf.api.apiPrefix();

		self.obNeedShown = ko.observable(true);

		self.documentclassification = "documentclassification";

		tf.pageManager.resizablePage.onSizeChanged.subscribe(self.manageLayout);
		self.defaultLayoutId = null;
		self.defaultLayoutName = null;
		self.totalCostContent = null;
		self.isTemplateMenuOpened = false;

		self._disposed = false;
	}

	DetailViewViewModel.prototype.constructor = DetailViewViewModel;

	/** 
	 * Initialize the necessary events.
	 * @return {void}
	 */
	DetailViewViewModel.prototype.initEvents = function()
	{
		var self = this;
		$(document).on('mousedown.morebuttonmenu', function(e)
		{
			var $target = $(e.target),
				groupButtons = self.$element.find(".group-buttons");
			if (groupButtons.length > 0 && groupButtons.hasClass("open") && $target.closest(".group-buttons").length <= 0)
			{
				groupButtons.removeClass("open");
			}
		});

		$(window).on("resize.managelayout", function()
		{
			self.manageLayout();
		});

		$(document).on('contextmenu.rightClickMenu', '.grid-stack-item-content, .hori-line, .verti-line', function(e)
		{
			if (self.isReadMode && !self.isReadMode() && !$(this).parent().hasClass('beyond-overlay') && self.isGroupMode && !self.isGroupMode())
			{
				var dataBlocksMenu = new TF.DetailView.DataBlocksMenuViewModel({
					gridType: self.gridType,
					deleteDataBlockEvent: self.deleteDataBlockEvent,
					groupDataBlockEvent: self.groupDataBlockEvent,
					changeDataPointEvent: self.changeDataPointEvent,
					blocks: $.grep(self.dataPointPanel.obAllColumns(), function(item) { return item.title !== "Groups" }),
					target: e.currentTarget,
					toggleResizableEvent: self.toggleResizableEvent,
					defaultColors: self.defaultColors,
				}, self);
				if ($(e.target).hasClass("uploadedPhoto") || $(e.target).hasClass("image-stack-item") || $(e.target).parent().hasClass("image-stack-item"))
				{
					dataBlocksMenu.obNeedShown(false);
				} else
				{
					dataBlocksMenu.obNeedShown(true);
				}
				var contextmenu = new TF.ContextMenu.TemplateContextMenu(
					"workspace/detailview/datablockscontextmenu",
					dataBlocksMenu,
					function() { }
				);
				var $virsualTarget = $("<div></div>").css(
					{
						position: "absolute",
						left: window.screen.availWidth - e.clientX < 20 ? window.screen.availWidth - 20 : e.clientX,
						top: e.clientY
					});
				$("body").append($virsualTarget);

				tf.pageManager.showContextMenu($virsualTarget);
				tf.contextMenuManager.showMenu($virsualTarget, contextmenu);
			}
		});

		self.deleteDataBlockEvent.subscribe(function(e, data)
		{
			var $item = $(data.target).parents('.grid-stack-item');
			switch ($item.data("type"))
			{
				case "Calendar":
					var $calendarItem = self.allCalendars[$(data.target).find(".calendar").attr("role")],
						calendar = $calendarItem.length > 0 ? $calendarItem.data("kendoCalendar") : null;
					if (calendar)
					{
						calendar.destroy();
						delete $calendarItem;
					}
					break;
				case "grid":
					var kendoGrid = $item.find(".kendo-grid").data("kendoGrid");
					if (kendoGrid)
					{
						kendoGrid.destroy();
						delete kendoGrid;
					}
					break;
			}
			if ($(data.target).closest(".hori-line, .verti-line").length > 0)
			{
				$(data.target).closest(".hori-line, .verti-line").remove();
				self.lineBlockHelper.refresh();
			}
			else
			{
				self.grid.removeWidget($item[0]);
			}
		});

		self.groupDataBlockEvent.subscribe(self.groupDataBlock.bind(self));
		self.changeDataPointEvent.subscribe(function(e, data)
		{
			switch (data.modifiedType)
			{
				case 'Appearance':
					var $targetItem = $(data.target).parents('.grid-stack-item'),
						curAppearance = JSON.parse($targetItem.data("appearance"));
					$targetItem.data({
						appearance: JSON.stringify($.extend(curAppearance, data.appearance)),
						customizedTitle: data.customizedTitle
					});
					break;
				default://switch data block
					var defaultWidth = 1,
						defaultHeight = 1,
						gridItem = $(data.target).parents('.grid-stack-item'),
						resetGridItem = function(el)
						{
							self.grid.minHeight(el, 1);
							self.grid.minWidth(el, 1);
						};
					switch (data.dataPoint.type)
					{
						case 'Calendar':
							defaultHeight = parseInt(data.dataPoint['min-height']);
							break;
						case "grid":
							defaultHeight = 3;
							break;
						default:
							break;
					}

					resetGridItem(gridItem);
					self.grid.resize(gridItem, defaultWidth, defaultHeight);
					$(data.target).find('.item-title').text(data.dataPoint.title);
					$(data.target).find('.item-content').text(data.dataPoint.defaultValue);
					var currentData = {
						type: data.dataPoint.type,
						field: data.dataPoint.field,
						title: data.dataPoint.title,
						appearance: '',
						customizedTitle: '',
						defaultValue: data.dataPoint.defaultValue
					};
					if (data.dataPoint.type === "Boolean")
					{
						currentData.negativeLabel = data.dataPoint.negativeLabel;
						currentData.positiveLabel = data.dataPoint.positiveLabel;
					}
					if (data.dataPoint.type === "grid")
					{
						currentData.subUrl = data.dataPoint.subUrl;
						currentData.url = data.dataPoint.url;
						$(data.target).parents('.grid-stack-item').data("columns", []);
					}
					$(data.target).parents('.grid-stack-item').data(currentData);
					break;
			}

			self.setStackBlocks({ layout: self.serializeLayout() });
		});

		self.toggleResizableEvent.subscribe(function(e, isResizable)
		{
			self.grid.resizable(".grid-stack-item", isResizable);
		});

		$(document).on('click.slider', '.detial-view-overlay', function(e)
		{
			if (self.obShowSlider())
			{
				self.obShowSlider(false);
				$(e.currentTarget).remove();
			}
		});

		$(document).on('click.slider', '.slider-container .plus', function(e)
		{
			if (!$(e.currentTarget).hasClass('disable'))
			{
				self.obSliderFontRate(self.obSliderFontRate() + 0.25);
			}
		});

		$(document).on('click.slider', '.slider-container .minus', function(e)
		{
			if (!$(e.currentTarget).hasClass('disable'))
			{
				self.obSliderFontRate(self.obSliderFontRate() - 0.25);
			}
		});

		self.obSliderFontRate.subscribe(function(value)
		{
			$('.slider-container label').removeClass('disable');
			if (value == 1)
			{
				$('.slider-container .plus').addClass('disable');
			}
			else if (value == 0)
			{
				$('.slider-container .minus').addClass('disable');
			}
			self.adjustBlockUnitHeight(value);
			self.adjustFontSize(value);
			self.updateSectionHeaderTextInputWidth();
		});

		$(document).on("click.sectionheader", ".section-header-stack-item button.btn", function(e)
		{
			var sectionHeader = $(e.currentTarget).parents(".grid-stack-item");
			var options = { sectionHeader: { className: self.getDomUniqueClassName(sectionHeader), isCollapsed: $(e.currentTarget).find(".up").length == 0 } }
			self.setStackBlocks({ layout: self.serializeLayout(options) });
		});

		self.onCloseEditMode.subscribe(function(e, data)
		{
			self.checkLayoutChange(data && data.switchToLayoutId, data && data.callback)
		});
		self.obSelectName.subscribe(function(value)
		{
			tf.storageManager.save("current_detail_layout_name", value, true);
		});
	}

	/**
	 * adjust data block unit height when font size changed
	 */
	DetailViewViewModel.prototype.adjustBlockUnitHeight = function(rate)
	{
		var self = this, kendoGrids, kendoGrid, $hLines = self.$element.find(".hori-line"), $vLines = self.$element.find(".verti-line"),
			y, height, $vLine, $hLine;
		if (self.grid)
		{
			if (rate == 0.75)
			{
				self.UNITHEIGHT = 63;
			}
			else if (rate == 1)
			{
				self.UNITHEIGHT = 68;
			}
			else
			{
				self.UNITHEIGHT = 58;
			}
			self.grid.cellHeight(self.UNITHEIGHT);
			if ($hLines.length > 0)
			{
				$.each($hLines, function(index, hLine)
				{
					$hLine = $(hLine);
					y = parseInt($hLine.attr("y"));
					$hLine.css({
						top: (y * self.UNITHEIGHT + (y - 1) - 2) + "px"
					});
				});
			}
			if ($vLines.length > 0)
			{
				$.each($vLines, function(index, vLine)
				{
					$vLine = $(vLine);
					y = parseInt($vLine.attr("y"));
					height = parseInt($vLine.attr("height"));
					$vLine.css({
						top: (y * self.UNITHEIGHT + (y - 1)) + "px",
						height: (height * (self.UNITHEIGHT + 1)) + "px"
					});
				});
			}

			kendoGrids = self.$element.find(".grid-stack > .grid-stack-item .kendo-grid");
			if (kendoGrids.length > 0)
			{
				$.each(kendoGrids, function(index, grid)
				{
					kendoGrid = $(grid).data("kendoGrid");
					if (kendoGrid)
					{
						kendoGrid.refresh();
					}
				});
			}
		}
	}

	/**
	 * the applied detail layout id
	 */
	DetailViewViewModel.prototype.getEffectiveDetailLayoutId = function()
	{
		return tf.storageManager.get(this.stickyName);
	}

	/**
	 * adjust font size of data blocks
	 */
	DetailViewViewModel.prototype.adjustFontSize = function(rate)
	{
		var fontSizeRate;

		$(".grid-stack .grid-stack-item").find(".item-content").removeClass("low-linehight");

		$(".grid-stack .section-header-stack-item .item-toggle, .grid-stack .grid-stack-item .calendar-item").removeClass(function(index, className)
		{
			if (!className) return;
			return className.split(" ").filter(function(name)
			{
				return name.indexOf("percent") > -1
			}).join(" ").trim()
		});

		switch (rate)
		{
			case 0:
				fontSizeRate = 0.8;
				$(".grid-stack .section-header-stack-item .item-toggle").addClass("percent80");
				$(".grid-stack .grid-stack-item .calendar-item").addClass("percent80");
				break;
			case 0.25:
				fontSizeRate = 0.9;
				$(".grid-stack .section-header-stack-item .item-toggle").addClass("percent90");
				$(".grid-stack .grid-stack-item .calendar-item").addClass("percent90");
				break;
			case 0.5:
				fontSizeRate = 1;
				break;
			case 0.75:
				fontSizeRate = 1.25;
				$(".grid-stack .section-header-stack-item .item-toggle").addClass("percent125");
				$(".grid-stack .grid-stack-item .calendar-item").addClass("percent125");
				break;
			case 1:
				fontSizeRate = 1.5;
				$(".grid-stack .section-header-stack-item .item-toggle").addClass("percent150");
				$(".grid-stack .grid-stack-item .calendar-item").addClass("percent150");
				break;
			default:
				fontSizeRate = 1;
				break;
		}

		$(".grid-stack .grid-stack-item").find(".item-title").css("font-size", 11 * fontSizeRate + "px");
		$(".grid-stack .grid-stack-item").find(".item-content").css("font-size", 15 * fontSizeRate + "px");
		$(".grid-stack .section-header-stack-item .item-title").css("font-size", 17 * fontSizeRate + "px");
		$(".grid-stack .section-header-stack-item .item-title-ruler").css("font-size", 17 * fontSizeRate + "px");

		$(".grid-stack .grid-stack-item .boolean-stack-item .item-text").css("font-size", 17 * fontSizeRate + "px");
		if (fontSizeRate == 0.8)
		{
			$(".grid-stack .grid-stack-item").find(".item-content").addClass("low-linehight");
		}
	}

	DetailViewViewModel.prototype.groupDataBlock = function(e, data)
	{
		var self = this, $block = $(data.target).parents(".grid-stack-item");
		if ($block.length > 0)
		{
			self.dataPointGroupHelper.startGroup($block);
			self.dataPointPanel.startGroup();
		}
	};

	DetailViewViewModel.prototype.saveGroup = function()
	{
		this.dataPointGroupHelper.saveGroup();
	};

	DetailViewViewModel.prototype.cancelGroup = function()
	{
		this.dataPointGroupHelper.stopGroup();
		this.dataPointPanel.stopGroup();
	};

	/** 
	 * 
	 */
	DetailViewViewModel.prototype.inputFocused = function()
	{
		var self = this;
		self.$element.find("[data-bv-validator=callback]").css("display", "none");
	};

	/**
	 * Update name container.
	 * @param {Object} viewModel 
	 * @param {Event} e
	 * @return {void} 
	 */
	DetailViewViewModel.prototype.updateNameContainer = function(viewModel, e)
	{
		var self = this, $tempDiv, nameInput, name;
		if (!self.$element) { return; }

		nameInput = self.$element.find(".name");
		name = nameInput.val();
		if (!name)
		{
			self.$element.find(".name").width(self.INITINPUTWIDTH);
			return;
		}

		$tempDiv = $("<div>");
		$tempDiv.text(name).css({
			fontFamily: "SourceSansPro-Regular",
			fontSize: "21px",
			display: "inline"
		});
		$("body").append($tempDiv);

		self.$element.find(".name").css({
			"width": $tempDiv.width() + 1,
			"maxWidth": self.$element.closest(".detail-view-panel").outerWidth() - self.EXTRAWIDTH
		});
		$tempDiv.remove();
	};

	/**
	 * Initialize.
	 * @param {object} current view model
	 * @param {dom} element
	 * @returns {void} 
	 */
	DetailViewViewModel.prototype.init = function(model, element)
	{
		var self = this;

		self.$element = $(element);
		self.$preload = self.$element.find(".preload");
		self.$gridStack = $(".grid-stack");
		self.initStackGrid();
		self.initColumnPopup();

		$("body").on("mousedown.detailViewPanelSubTitle", function(e)
		{
			var $target = $(e.target);
			if ($target.closest(".sub-title-selector").length === 0 && self.$element.find(".sub-title-selector .dropdown-menu").css("display") !== "none")
			{
				self.$element.find(".sub-title-selector .dropdown-menu").hide();
			}
			if ($target.closest(".iconbutton.layout").length === 0 && $target.closest(".column-selector").length === 0 && self.$columnPopup.css("display") !== "none")
			{
				self.$columnPopup.hide();
			}
		});

		$("body").on("mousedown.detailViewPanelSave", function(e)
		{
			if ($(e.target).closest(".save-selector").length === 0 && self.$element.find(".save-selector .dropdown-menu").css("display") !== "none")
			{
				self.$element.find(".save-selector .dropdown-menu").hide();
			}
		});

		if (window.navigator.userAgent.toLocaleLowerCase().indexOf("firefox") > -1)
		{
			self.$element.find(".dropdown-menu ul").css({ "padding-right": "22px" });
			self.$element.find(".dropdown-menu ul li").css({ "width": "calc(100% + 22px)" });
		}

		var gridType = self.gridType;
		self.validationInit();
		self.applyLayoutTemplate(true, tf.storageManager.get(self.stickyName)).then(function()
		{
			self.updateDetailViewTitle();
			if (self.optionId)
			{
				self.show(self.optionId, gridType);
			}
		});
		self.detailViewHelper = new TF.DetailView.DetailViewHelper();
	};

	DetailViewViewModel.prototype.initColumnPopup = function()
	{
		var self = this;
		self.$columnPopup = $('<div class="column-selector">' +
			'<div class="up-arrow"></div>' +
			'<div class="columns-container">' +
			'<div class="column-container">' +
			'<div class="column-item">' +
			'<table><tr><td><div></div></td></tr></table>' +
			'</div>' +
			'<div class="column-title">1 Column</div>' +
			'</div>' +
			'<div class="column-container">' +
			'<div class="column-item">' +
			'<table><tr><td><div></div></td><td><div></div></td></tr></table>' +
			'</div>' +
			'<div class="column-title">2 Columns</div>' +
			'</div>' +
			'<div class="column-container">' +
			'<div class="column-item">' +
			'<table><tr><td><div></div></td><td><div></div></td><td><div></div></td></tr></table>' +
			'</div>' +
			'<div class="column-title">3 Columns</div>' +
			'</div>' +
			'<div class="column-container">' +
			'<div class="column-item">' +
			'<table><tr><td><div></div></td><td><div></div></td><td><div></div></td><td><div></div></td></tr></table>' +
			'</div>' +
			'<div class="column-title">4 Columns</div>' +
			'</div>' +
			'</div>' +
			'</div>');
		self.$columnPopup.find(".column-container").on("click.changeColumn", self.changeColumnsCount.bind(self));
		self.$columnPopup.hide();
		$("body").append(self.$columnPopup);
	};

	/**
	 * Change the column count of the detail view.
	 * @param {Event} e
	 * @return {void}  
	 */
	DetailViewViewModel.prototype.changeColumnsCount = function(e)
	{
		var self = this, nodeX, nodeWidth, barriers = [], crossBlocks = [], items = [],
			currentWidth = self.getCurrentWidth(),
			changeColorTimeOutLen = self.changeColorTimeout.length,
			width = self.$columnPopup.find(".column-container").index($(e.target).closest(".column-container")) + 1;

		if (changeColorTimeOutLen > 0)
		{
			for (var i = 0; i < changeColorTimeOutLen; i++)
			{
				clearTimeout(self.changeColorTimeout[i]);
			}
			self.changeColorTimeout.length = 0;
		}

		if (currentWidth === width)
		{
			self.$columnPopup.hide();
			return;
		}

		if (self.collapsedSectionHeaderList && self.collapsedSectionHeaderList.length > 0 && currentWidth > width)
		{
			var needExpandSectionNames = self.collapsedSectionHeaderList.reduce(function(result, current)
			{
				if (current.items.filter(function(item) { return item.x + 1 > width }).length > 0)
				{
					result.push(current.headerClassName);
				}

				return result;
			}, [])

			if (needExpandSectionNames.length > 0)
			{
				var currentLayout = JSON.parse(self.serializeLayout());
				var targetLayout = {
					width: currentLayout.width,
					sliderFontRate: currentLayout.sliderFontRate,
					items: []
				};

				targetLayout.items = currentLayout.items.map(function(item)
				{
					if (item.ownedBy && needExpandSectionNames.indexOf(item.ownedBy) != -1)
					{
						item.isHidden = false;
					}

					if (needExpandSectionNames.indexOf(item.uniqueClassName) != -1)
					{
						item.isCollapsed = false;
					}

					return item;
				})

				self.setStackBlocks({ layout: JSON.stringify(targetLayout) });
			}
		}

		items = $('.right-container .grid-stack > .grid-stack-item:visible,.grid-stack .verti-line, .grid-stack .hori-line');
		if (items.length > 0 && currentWidth > width)
		{
			//Find the barriers, show red border. if there is no barriers, reset blocks.
			$.each(items, function(index, item)
			{
				var $item = $(item), node = $item.data('_gridstack_node') || { x: $item.attr("x"), y: $item.attr("y"), width: $item.attr("width") }, appearance;
				//Reset border color
				appearance = $item.data("appearance");
				if ($item.find(".grid-stack-item-content").length > 0)
				{
					$item.find(".grid-stack-item-content").css("borderColor", JSON.parse(appearance).borderColor ? JSON.parse(appearance).borderColor : "transparent");
				}
				else
				{
					$item.find(".verti-line, .hori-line").css("borderColor", "#70A130");
				}
				nodeX = parseInt(node.x);
				nodeWidth = parseInt(node.width || 0);
				if (nodeX === width)
				{
					if (!$item.hasClass("verti-line"))
					{
						barriers.push($item);
					}
				}
				else if (nodeX > width)
				{
					barriers.push($item);
				}
				else if (nodeX + nodeWidth > width)
				{
					crossBlocks.push($item);
				}
			});
		}

		if (barriers.length > 0)
		{
			//Show red border.
			$.each(barriers, function(index, item)
			{
				var content = item.find(".grid-stack-item-content"), originColor, isLine = content.length <= 0;
				var $content = $(content[0]);
				var appearance = $content.parent().data("appearance");
				if (!isLine)
				{
					content.removeClass("animation");
					content.css("borderColor", "#ff0000");
				}
				else
				{
					item.css("backgroundColor", "#ff0000");
				}

				self.changeColorTimeout.push(setTimeout(function()
				{
					if (!isLine)
					{
						content.addClass("animation");
						content.css("borderColor", JSON.parse(appearance).borderColor ? JSON.parse(appearance).borderColor : "transparent");
						//animation just for border color changing.
						setTimeout(function()
						{
							content.removeClass("animation");
						}, 1000);
					}
					else
					{
						item.css("backgroundColor", JSON.parse(appearance).backgroundColor ? JSON.parse(appearance).backgroundColor : "transparent");
					}
				}, 5000));
			});
			self.pageLevelViewModel.obValidationErrorsSpecifed([{ message: "Remove block" + (barriers.length === 1 ? "" : "s") + " from the right column before changing the number of columns." }]);
			self.pageLevelViewModel.obErrorMessageDivIsShow(true);
		}
		else
		{
			if (crossBlocks.length > 0)
			{
				$.each(crossBlocks, function(index, item)
				{
					if (item.hasClass("hori-line"))
					{
						item.width(100 / width * (width - parseInt(item.attr("x"))) + "%");
						item.attr("width", width - parseInt(item.attr("x")));
					}
					else
					{
						self.grid.resize(item, width - item.data('_gridstack_node').x, null);
					}
				});
			}
			self.entityDataModel.layout(self.serializeLayout({ width: width }));
			self.setStackBlocks();
			self.lineBlockHelper.addLineContainers();
			self.onColumnChangedEvent.notify(width);
		}
		self.$columnPopup.hide();
	};

	/** 
	 * Get current width.
	 * @return {void}
	 */
	DetailViewViewModel.prototype.getCurrentWidth = function()
	{
		var self = this, layout, width = 4;
		if (self.entityDataModel && self.entityDataModel.layout)
		{
			layout = self.getLayout();
			width = layout.width;
		}
		return width;
	}

	/**
	 * Show the column popup.
	 * @param {Object} model 
	 * @param {Event} e
	 * @return {void} 
	 */
	DetailViewViewModel.prototype.showColumnPopup = function(model, e)
	{
		var self = this, width, containers;
		if (self.$columnPopup.length === 0)
		{
			self.initColumnPopup();
		}
		else if (self.$columnPopup.is(":visible"))
		{
			self.$columnPopup.hide();
			return;
		}

		width = self.getCurrentWidth();
		containers = self.$columnPopup.find(".column-container");
		containers.removeClass("active");
		containers.eq(width - 1).addClass("active");
		self.$columnPopup.show();
		self.$columnPopup.position({ my: 'right+55 top+22', at: 'bottom center', of: e.target });
	};

	/**
	 * Calendar initialize.
	 */
	DetailViewViewModel.prototype.initCalendar = function($calendar, role)
	{
		var self = this, calendarTypes = ["district", "school", "trip"], changeCalendarWidthTimeout = null;
		if (calendarTypes.indexOf(self.gridType) <= -1)
		{
			return;
		}
		$calendar.kendoCalendar({
			month: {
				content: '<div class="date-text">#= data.value #</div><div class="events-group"><div class="events-point"></div></div>'
			},
			width: "100%",
			height: "100%",
			value: new Date(),
			navigate: function()
			{
				var calendar = this;
				if (changeCalendarWidthTimeout)
				{
					clearTimeout(changeCalendarWidthTimeout);
					changeCalendarWidthTimeout = null;
				}
				if (self.calendarEvents)
				{
					calendar.element.next(".schedule").remove();
					self.addCalendarEvents(calendar.element.parent(), calendar._table.find("td a"));
				}
				changeCalendarWidthTimeout = setTimeout(function()
				{
					calendar._table.width("100%");
				}, 1000);
			}
		});
		self.allCalendars[role] = $calendar;
		self.maxCalendarRole = self.maxCalendarRole ? Math.max(self.maxCalendarRole, role) : role;
	};

	/**
	 * Init all data on this panel.
	 * @returns {void} 
	 */
	DetailViewViewModel.prototype.initData = function()
	{
		var self = this;
		self.entity = null;
		self.calendarEvents = null;
		self.allCalendars = {};
		self.entitySelectId = null;
		self.isSaveAsNew = false;

		self.isReadMode = ko.observable(true);
		self.isGroupMode = ko.observable(false);
		self.obName = ko.observable("");
		self.obSelectName = ko.observable("");
		self.obTitle = ko.observable("");
		self.obSubTitle = ko.observable("");
		self.obRecordPicture = ko.observable(null);
		self.obSubTitleLabel = ko.observable("");
		self.obDataPoints = ko.computed(function()
		{
			var dataPoints = [];
			self.dataPointPanel.obAllColumns().forEach(function(item)
			{
				if (item.title !== "Groups")
				{
					dataPoints = dataPoints.concat(item.columns());
				}
			});
			dataPoints = dataPoints.sort(function(a, b)
			{
				if (a.title.toUpperCase() === b.title.toUpperCase())
				{
					return 0;
				}
				return a.title.toUpperCase() > b.title.toUpperCase() ? 1 : -1;
			});

			return dataPoints;
		});
		self.obDataPointsForSubTitle = ko.computed(function()
		{
			return self.obDataPoints().filter(function(item)
			{
				excludeList = ["grid", "file", "map", "calendar", "schedule", "recordpicture"];
				return item.defaultValue !== undefined
					&& item.defaultValue !== null
					&& excludeList.indexOf(item.type.toLowerCase()) === -1;
			});
		});

		self.entityDataModel = new TF.DataModel.DetailScreenLayoutDataModel();
	};

	/**
	 * Get the matched data point.
	 * @param {String} field 
	 */
	DetailViewViewModel.prototype.getDataPointByField = function(field)
	{
		var key, match, dataPoints = dataPointsJSON[this.gridType];
		for (key in dataPoints)
		{
			$.each(dataPoints[key], function(index, item)
			{
				if (item.field === field)
				{
					match = item;
					return false;
				}
			});

			if (!!match) { break; }
		}

		return match;
	};

	/**
	 * Validation initialization.
	 * @returns {void}
	 */
	DetailViewViewModel.prototype.validationInit = function(model, element)
	{
		var self = this,
			validatorFields = {},
			isValidating = false;

		validatorFields.name = {
			trigger: "blur",
			validators:
			{
				callback: {
					message: "Name already exists",
					callback: function(value, validator, $field)
					{
						if (!value)
						{
							return true;
						}
						if (!self.entityDataModel.apiIsNew() && !self.isSaveAsNew)
						{
							return true;
						}

						return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreens"), {
							paramData: {
								name: value,
								dataTypeId: tf.DataTypeHelper.getId(self.gridType)
							}
						}, { overlay: false }).then(function(response)
						{
							var isUnique = !response.Items.length;
							return isUnique;
						});
					}
				}
			}
		};

		self.$element.bootstrapValidator(
			{
				excluded: [':hidden', ':not(:visible)'],
				live: 'enabled',
				message: 'This value is not valid',
				fields: validatorFields
			}).on('success.field.bv', function(e, data)
			{
				if (!isValidating)
				{
					isValidating = true;
					self.pageLevelViewModel.saveValidate(data.element).then(function()
					{
						isValidating = false;
					});
				}
			});

		self.pageLevelViewModel.load(self.$element.data("bootstrapValidator"));
	};

	/**
	 * Change data which will be display on this panel.
	 * @param {boolean} isReadMode check display read or edit view on this panel
	 * @param {number} layoutId selected detail screen id
	 * @returns {void} 
	 */
	DetailViewViewModel.prototype.applyLayoutTemplate = function(isReadMode, layoutId, isDeleted, entity)
	{
		var self = this, paramData = {};
		if (layoutId !== self.entityDataModel.id())
		{
			self.destroyControls();
		}

		if (!isDeleted)
		{
			self.isReadMode(isReadMode);
			// in edit mode, grid need more space at bottom so that user can move block to bottom.
			self.grid.reserveSpaceAtBottom(!isReadMode);
		}

		if (!entity)
		{
			if (self.isReadMode())
			{
				self.defaultLayoutId = null;
				self.defaultLayoutName = null;
				if (!layoutId || self.defaultLayoutId)
				{
					if (self.gridType)
					{
						paramData.DataTypeId = tf.DataTypeHelper.getId(self.gridType);
					}
					return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreens"), {
						paramData: paramData
					}, { overlay: false }).then(function(response)
					{
						var layoutEntity = {};
						if (response && response.Items)
						{
							var layouts = response.Items;
							if (layouts.length > 0)
							{
								var layout = layouts.filter(function(item)
								{
									return item.Name === 'FIELD TRIPS DEFAULT LAYOUT';
								});
								if (layout.length > 0)
								{
									layoutEntity = layout[0];
									self.defaultLayoutId = layout[0].Id;
									self.defaultLayoutName = layout[0].Name;
								} else
								{
									layoutEntity.Name = "Layout Name";
								}
							} else
							{
								layoutEntity.Name = "Layout Name";
							}
						}
						self.applyLayoutEntity(layoutEntity, isDeleted);
					});
				}
			}

			if (layoutId && layoutId !== self.entityDataModel.id())
			{
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreens", layoutId)).then(function(response)
				{
					if (response && response.Items && response.Items.length == 1)
					{
						self.applyLayoutEntity(response.Items[0], isDeleted);
					}
					else
					{

						var layoutEntities = self.layoutMenu && self.layoutMenu.obLayouts().filter(function(item) { return item.id() === id });
						var layoutName = layoutEntities && layoutEntities.length == 1 ? layoutEntities[0].name() : tf.storageManager.get(self.stickyLayoutName);
						tf.promiseBootbox.alert("The Detail Layout (" + layoutName + ") that you had applied has been deleted.  It is no longer available.");
						self.layoutMenu && self.layoutMenu.resetLayoutClick();
						tf.storageManager.delete(self.stickyName);
						tf.storageManager.delete(self.stickyLayoutName);
						if (self.gridType)
						{
							paramData.DataTypeId = tf.DataTypeHelper.getId(self.gridType);
						}
						return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreens"), {
							paramData: paramData
						}, { overlay: false }).then(function(response)
						{
							var layoutEntity = {};
							if (response && response.Items)
							{
								var layouts = response.Items;
								if (layouts.length > 0)
								{
									var layout = layouts.filter(function(item)
									{
										return item.Name === 'FIELD TRIPS DEFAULT LAYOUT';
									});
									if (layout.length > 0)
									{
										layoutEntity = layout[0];
										self.defaultLayoutId = layout[0].Id;
										self.defaultLayoutName = layout[0].Name;
									} else
									{
										layoutEntity.Name = "Layout Name";
									}
								} else
								{
									layoutEntity.Name = "Layout Name";
								}
							}
							self.applyLayoutEntity(layoutEntity, isDeleted);
						});
					}
				});
			}
			else if (layoutId && layoutId === self.entityDataModel.id())
			{
				entity = self.layoutEntityBeforeEditing;
			}
		}

		self.applyLayoutEntity(entity, isDeleted);

		return Promise.resolve();
	};

	/**
	 * 
	 */
	DetailViewViewModel.prototype.applyLayoutEntity = function(layoutEntity, isDeleted)
	{
		var self = this, gridType = self.gridType;
		if (layoutEntity && !layoutEntity.SubTitle && gridType === (layoutEntity.Table || layoutEntity.DataType))
		{
			layoutEntity.SubTitle = self.basicGridConfig[gridType].subTitle;
		}
		self.entityDataModel = new TF.DataModel.DetailScreenLayoutDataModel(layoutEntity);
		if (!layoutEntity)
		{
			self.entityDataModel.subTitle(self.basicGridConfig[gridType].subTitle);
		}

		if (!self.isReadMode() && !isDeleted)
		{
			var defaultPictureSrc = self.getDefaultRecordPicture(self.gridType);
			self.obName(self.entityDataModel.name());
			self.obRecordPicture(defaultPictureSrc ? ("url(" + defaultPictureSrc + ")") : "");
		}
		self.obSelectName(layoutEntity ? self.entityDataModel.name() : "");
		self.layoutEntityBeforeEditing = self.entityDataModel.toData();
	};

	/**
	  * Open the detail screen panel.
	  * @param {Array} ids the entity ids, which entities will be displayed
	  * @returns {void} 
	  */
	DetailViewViewModel.prototype.show = function(ids, gridType)
	{
		var self = this;
		if (gridType)
		{
			self.showDetailViewById(ids instanceof Array ? ids[0] : ids, gridType);
		}
		else
		{
			self.showDetailViewById(ids[0]);
		}
	};

	/**
	  * determine whether detail layout is alive
	  */
	DetailViewViewModel.prototype.checkDetailLayout = function()
	{
		var self = this;
		var id = tf.storageManager.get(self.stickyName);
		if (!!id)
		{
			tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreens", id)).then(function(response)
			{
				if (response && response.Items && response.Items.length == 1)
				{
					self.applyLayoutEntity(response.Items[0]);
				}
				else
				{
					var layoutEntities = self.layoutMenu && self.layoutMenu.obLayouts().filter(function(item) { return item.id() === id });
					var layoutName = layoutEntities && layoutEntities.length == 1 ? layoutEntities[0].name() : tf.storageManager.get(self.stickyLayoutName);
					tf.promiseBootbox.alert("The Detail Layout (" + layoutName + ") that you had applied has been deleted.  It is no longer available.");
					self.applyLayoutEntity({});
					self.obSelectName("Layout Name");
					self.layoutMenu && self.layoutMenu.resetLayoutClick();
					tf.storageManager.delete(self.stickyName);
					tf.storageManager.delete(self.stickyLayoutName);
				}
			});
		}
	}

	/**
	 * Show information in detail view panel in read mode by Id.
	 * @param {number} Id The entity's Id
	 * @returns {Promise}
	 */
	DetailViewViewModel.prototype.showDetailViewById = function(id, gridType)
	{
		var self = this, gridType = gridType || self.gridType;

		if (self._disposed) return;

		if (!self.isReadMode())
		{
			self.isReadMode(true);
			self.onCloseEditMode.notify();
		}

		self.entitySelectId = id;
		self.updateGridType(gridType).then(function()
		{
			self.addTotalCostStackBlock(id).then(function()
			{
				self.getRecordEntity(gridType, id).then(function(entity)
				{
					if (!entity) { return; }

					self.entity = entity;
					self.obRecordPicture(entity.ImageBase64 ? ("url(data:image/jpeg;base64," + entity.ImageBase64 + ")") : "");
					self.updateDetailViewTitle(entity);

					// Open detail view in a new tab
					if (window.opener && window.name.indexOf("new-detailWindow") >= 0)
					{
						self.hideExtraElement();
					}

					self.loadCalendarData(id).then(function()
					{
						self.setStackBlocks();
						self.onColumnChangedEvent.notify(self.getCurrentWidth());
					});
				});
			});
		});
	};

	/**
	 * Get the record entity by type and id.
	 * @param {String} gridType
	 * @param {Number} layoutId
	 */
	DetailViewViewModel.prototype.getRecordEntity = function(gridType, layoutId)
	{
		var requestUrl;
		if (gridType === "trip")
		{
			// TODO-V2, need to remove
			requestUrl = pathCombine(tf.api.apiPrefix(), gridType, layoutId, "detail", "?startDate=" + (new Date()).toISOString() + "&include=tripstop+driver+busaide+school+vehicle+tripstop.student");
		}
		else if (["altsite", "georegion", "student", "vehicle", "staff", "fieldtrip", "school", "contractor", "district", "tripstop"].indexOf(gridType) > -1)
		{
			requestUrl = pathCombine(tf.api.apiPrefix(), tf.DataTypeHelper.getEndpoint(gridType) + "?Id=" + layoutId + "&@relationships=all");
		}
		else
		{
			requestUrl = pathCombine(tf.api.apiPrefix(), gritf.DataTypeHelper.getEndpoint(gridType), layoutId);
		}


		return tf.promiseAjax.get(requestUrl).then(function(response)
		{
			return response.Items[0];
		});
	};

	/**
	 * Update the grid type.
	 * @param {String} gridType
	 * @return {Promise}
	 */
	DetailViewViewModel.prototype.updateGridType = function(gridType)
	{
		var self = this;
		if (self.gridType !== gridType)
		{
			self.gridType = gridType;
			self.pendingDataPointRefreshing = self.dataPointPanel.refreshData().then(function()
			{
				var savedTemplateId = tf.storageManager.get(self.stickyName);
				return self.applyLayoutTemplate(true, savedTemplateId).then(function()
				{
					self.pendingDataPointRefreshing = null;
				});
			});
		}

		if (self.pendingDataPointRefreshing)
		{
			return self.pendingDataPointRefreshing;
		}
		else
		{
			return Promise.resolve();
		}
	};

	/**
	 * hide extra element for new Window.
	 * @returns {void}
	 */
	DetailViewViewModel.prototype.hideExtraElement = function()
	{
		$("body").css("min-width", "585px");
		$(".page-container").css("width", "100%");
		$(".detail-view-panel.right-panel").css({ display: "block", width: "100%" });
		$(".buttons .iconbutton.new-window").addClass("hide");
		$(".buttons .iconbutton.close-detail").addClass("hide");
		$(".buttons .iconbutton.print").css("margin-left", "20px");
		$(".group-buttons .iconbutton.new-window").parents("li").hide();
		$(".group-buttons .iconbutton.close-detail").parents("li").hide();
		$(".selector-menu").css("margin-left", "36px");
		$(".sliderbar-button-wrap.ui-draggable").addClass("hide");
		$(".detail-header.width-enough").find($(".sliderbar-button-wrap.ui-draggable")).addClass("hide");
		this.updateDetailViewPanelHeader();
	};
	/**
	 * Get calendar data.
	 * @param {Number} Id the entity id
	 * @returns {Promise} the calendar data 
	 */
	DetailViewViewModel.prototype.loadCalendarData = function(Id)
	{
		var self = this, p = Promise.resolve();
		callback = function(data)
		{
			var startDate, endDate, firstDate, attendanceDate, events = {}, key, startTime, endTime, formatDate, today = moment();

			if (self.gridType === 'trip' && data.Items.length > 0)
			{
				endTime = data.Items[1].Info1;
				startTime = data.Items[1].Info1;
			}
			data.Items.forEach(function(item)
			{
				if (self.gridType === 'trip')
				{
					if (item.Sequence)
					{
						attendanceDate = moment(item.AttendanceDate);

						formatDate = moment(attendanceDate.format("M/D/YYYY"));

						key = formatDate.format("M/D/YYYY");
						newKey = key;
						if (!events[key])
						{
							events[key] = {
								date: formatDate.format("ddd M/D/YY"),
								events: [],
								isToday: today.isSame(key, "day")
							};
						}

						var itemInfo = moment(item.Info1, "HH:mm:ss a"),
							minTime = moment(startTime, "HH:mm:ss a"),
							maxTime = moment(endTime, "HH:mm:ss a");

						endTime = itemInfo > maxTime ? item.Info1 : endTime;
						startTime = itemInfo > minTime ? startTime : item.Info1;

						events[key].events[0] = {
							name: self.entity.Name,
							startTime: startTime,
							endTime: endTime,
							isAllDay: endTime - startTime === 86400000 || endTime - startTime === 86399000
						};
					}
				}
				else
				{
					startDate = moment(item.Start);
					endDate = moment(item.End);
					firstDate = moment(startDate.format("M/D/YYYY"));
					for (var t = firstDate; t < endDate; t = t.add(1, "days"))
					{
						key = t.format("M/D/YYYY");
						if (!events[key])
						{
							events[key] = {
								date: t.format("ddd M/D/YY"),
								events: [],
								isToday: today.isSame(key, "day")
							};
						}
						startTime = t > startDate ? t : startDate;
						endTime = moment(key).add(1, "days") > endDate ? endDate : t;
						events[key].events.push({
							name: item.Summary,
							startTime: startTime.format("h:mmA"),
							endTime: endTime.format("h:mmA"),
							isAllDay: endTime - startTime === 86400000 || endTime - startTime === 86399000
						});
					}
				}
			});

			self.calendarEvents = events;
		}

		switch (self.gridType)
		{
			case "district":
				// TODO-V2, need to remove
				p = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "calendarevents"), { paramData: { keys: Id, gridType: self.gridType } }).then(callback);
				break;
			case "school":
				// TODO-V2, need to remove
				p = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "school", Id)).then(function(response)
				{
					// TODO-V2, need to remove
					return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "calendarevents"), { paramData: { keys: response.Items[0].SchoolCode, gridType: self.gridType } }).then(callback);
				});
				break;
			case "trip":
				// TODO-V2, need to remove
				p = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "attendance", "tripId", self.entity.Id, "attendances")).then(callback);
				break;
			default:
				break;
		}

		return p;
	};

	DetailViewViewModel.prototype.updateDetailViewTitleWithDataPoint = function()
	{
		var layoutEntity = this.entityDataModel.toData(),
			gridConfig = this.basicGridConfig[this.gridType],
			titleFieldName = gridConfig.title,
			subTitleFieldName = layoutEntity.SubTitle || gridConfig.subTitle,
			titleLabel = this.getDataPointByField(titleFieldName).defaultValue,
			subTitleLabel = this.getSubtitleDefaultValueByFieldName(subTitleFieldName),
			entity = {};
		entity[titleFieldName] = titleLabel;
		entity[subTitleFieldName] = subTitleLabel;
		this.updateDetailViewTitle(entity);
	};

	/**
	 * Update the detail view's title and subTitle.
	 * @param {Object} entity 
	 */
	DetailViewViewModel.prototype.updateDetailViewTitle = function(entity)
	{
		var self = this, subTitleLabel = "", titleLabel = "", subTitleDataPoint,
			gridType = self.gridType,
			layoutEntity = self.entityDataModel.toData(),
			gridConfig = self.basicGridConfig[gridType],
			subTitleFieldName = layoutEntity.SubTitle || gridConfig.subTitle;
		// only read mode has entity.
		if (entity)
		{
			// record value
			switch (gridType)
			{
				case "staff":
					titleLabel = entity.FullName;
					break;
				case "student":
					titleLabel = entity.FirstName + " " + entity.LastName;
					break;
				case "tripstop":
					titleLabel = entity.Street;
					break;
				case "vehicle":
					titleLabel = entity.BusNum;
					break;
				default:
					titleLabel = entity.Name;
					break;
			}

			if (subTitleFieldName)
			{
				if (subTitleFieldName === "(none)")
				{
					subTitleDataPoint = null;
					subTitleLabel = "";
				}
				else
				{
					subTitleDataPoint = self.getDataPointByField(subTitleFieldName);
					subTitleLabel = self.formatDataContent(entity[subTitleFieldName], subTitleDataPoint.type, subTitleDataPoint.format);
				}
			}
		}

		self.obTitle(titleLabel);
		self.obSubTitle(subTitleFieldName);
		self.obSubTitleLabel(subTitleLabel);

		self.updateDetailViewPanelHeader();
	};

	/**
	 * Get the default subtitle value with specified field name.
	 * @param {String} fieldName 
	 * @return {String}
	 */
	DetailViewViewModel.prototype.getSubtitleDefaultValueByFieldName = function(fieldName)
	{
		var self = this, label;
		switch (self.gridType)
		{
			case "altsite":
				if (!fieldName)
				{
					label = "Public";
				}
				break;
			case "fieldtrip":
				if (fieldName === "(none)")
				{
					label = "";
					break;
				}
				var field = self.getDataPointByField(fieldName);
				label = field.defaultValue;
				if (field.type === "Time")
				{
					label = moment("2018-01-01T" + label).format("hh:mm A");
				}
				else if (field.type === "Date")
				{
					label = moment(label).format("YYYY-MM-DD");
				}
				break;
			case "tripstop":
				label = self.getDataPointByField(fieldName).defaultValue;
				label = moment("2018-01-01T" + label).format("hh:mm A");
			default:
				label = self.getDataPointByField(fieldName).defaultValue;
				break;
		}
		return label;
	};

	DetailViewViewModel.prototype.destroyControls = function()
	{
		var self = this, items = self.$element.find('.grid-stack-item'), $item;

		$.each(items, function(index, item)
		{
			$item = $(item);
			switch ($item.data("type"))
			{
				case "Calendar":
					var $calendarItem = self.allCalendars[$item.find(".calendar").attr("role")],
						calendar = ($calendarItem && $calendarItem.length > 0) ? $calendarItem.data("kendoCalendar") : null;
					if (calendar)
					{
						calendar.destroy();
						delete $calendarItem;
					}
					break;
				case "grid":
					var kendoGrid = $item.find(".kendo-grid").data("kendoGrid");
					if (kendoGrid)
					{
						kendoGrid.destroy();
						delete kendoGrid;
					}
					break;
				default:
					break;
			}
		})
	};

	/**
	 * Set stack blocks for current items.
	 * @returns {void}
	 */
	DetailViewViewModel.prototype.setStackBlocks = function(options)
	{
		var self = this, layout;
		if (!self.grid) { return; }

		layout = options && options.layout || self.entityDataModel.layout();

		var layoutObj = !layout ? self.defaultLayout : JSON.parse(layout);
		self.resetPreloadControl();
		self.$gridStack.off('.gridStack');
		self.grid.removeAll();
		self.$gridStack.empty();
		self.grid.setGridWidth(layoutObj.width);
		self.addStackBlocks(layout);
		self.manageLayout();

		if (self.isReadMode())
		{
			self.grid.setStatic(true);
			self.lineBlockHelper.setStatic(true);
		}
		else
		{
			self.updateDataBlocks();
			self.$gridStack.off('added.gridStack').on('added.gridStack', self.onNewElementAdded.bind(self));
			self.$gridStack.off('resizeBlock.gridStack').on('resizeBlock.gridStack', self.onBlockResized.bind(self));

			if (!layout.items || layout.items.length === 0)
			{
				self.$gridStack.addClass("full");
			}
		}
	};

	DetailViewViewModel.prototype.onBlockResized = function(e, node)
	{
		var self = this, $grid, grid, $node = $(node);
		if (!$node || $node.length < 0)
		{
			return;
		}
		$grid = $node.find(".kendo-grid");
		if ($grid.length > 0)
		{
			grid = $grid.data("kendoGrid");
			setTimeout(function()
			{
				if (grid)
				{
					grid.refresh();
				}
			}, 250);
		}
	};

	DetailViewViewModel.prototype.updateDataBlocks = function()
	{
		var self = this,
			$containment = self.grid.container.closest(".right-container .grid-stack"),
			$stackItems = self.grid.container.find(".grid-stack-item");
		self.grid.setStatic(false);
		self.lineBlockHelper.setStatic(false);
		self.grid.container.off(".container");
		self.grid.container.on("dragstart.container", self.obDataBlockDragStart.bind(self));
		self.grid.container.on("dragstop.container", self.onDataBlockDragStop.bind(self));
		self.grid.container.on("resizestart.container", self.onDataBlockResizeStart.bind(self));
		self.grid.container.on("gsresizestop.container", self.onDataBlockResizeStop.bind(self));
		self.grid.container.on("resize.container", function(e) { e.stopPropagation(); });

		$stackItems.on("dragstart.grid-stack-item", function(e)
		{
			$(e.target).addClass('dragging');
		});
		$stackItems.on("dragstop.grid-stack-item", function(e)
		{
			$(e.target).removeClass('dragging');
		});
		$stackItems.on("drag.grid-stack-item", function(e)
		{
			var draggingOffset = $('.data-point.ui-draggable-dragging').offset(),
				containerOffset = $(self.grid.container).offset();
			$(e.target).css({
				left: draggingOffset.left - containerOffset.left + 'px',
				top: draggingOffset.top - containerOffset.top + 'px'
			});
		});
		$stackItems.draggable("option", "containment", "#pageContent");
		$stackItems.draggable("option", "appendTo", "body");
		$stackItems.draggable("option", "helper", function(e)
		{
			var $gridItem = $(e.target).closest('.grid-stack-item'),
				$target = $gridItem.find('.grid-stack-item-content'),
				width = $gridItem.width() + 'px',
				height = $gridItem.height() + 'px',
				$wrapper = $('<div class="dragging-helper-wrapper"></div>'),
				$helper = $('<div class="data-point dragging-helper"></div>');

			$wrapper.append($target.clone());
			if ($gridItem.hasClass('section-header-stack-item'))
			{
				$wrapper.addClass('section-header-stack-item');
			}

			$helper.css({
				width: width,
				height: height
			});
			$helper.append($wrapper);

			return $helper[0];
		});

		$stackItems.resizable("option", "containment", $containment);
		self.updateDragHandlerStatus();
	};

	DetailViewViewModel.prototype.onNewElementAdded = function(e, elements)
	{
		var self = this;
		if (!self.startUpdateAfterAddBlock)
		{
			var currentLayout = self.serializeLayout(null, elements[0].el);
			self.resetPreloadControl();
			self.grid.removeAll();
			self.$gridStack.empty();
			self.startUpdateAfterAddBlock = true;
			self.addStackBlocks(currentLayout);
			self.updateDataBlocks();
			self.startUpdateAfterAddBlock = false;
		}
	};

	/**
	 * Reset all preload controls.
	 */
	DetailViewViewModel.prototype.resetPreloadControl = function()
	{
		var self = this;
		self.$preload.find(">div").addClass("to-be-removed");
		self.$preload.find(">div.to-be-removed").remove();
	};

	/**
	 * After browser resize.
	 * @returns {void}
	 */
	DetailViewViewModel.prototype.resizeDetailView = function()
	{
		var self = this;
		if (!self.$element)
		{
			return;
		}
		if (window.innerWidth < document.body.scrollWidth)
		{
			var SCROLLHEIGHT = window.innerHeight - document.body.offsetHeight;
			self.$element.find(".container-fluid").css("height", "calc(100vh - " + ((self.isReadMode() ? 56 : 112) + SCROLLHEIGHT + (self.isGroupMode() ? 56 : 0)) + "px)");
			self.$element.find(".sub-title-selector ul").css("max-height", "calc(100vh - " + (93 + SCROLLHEIGHT) + "px)");
		}
		else
		{
			self.$element.find(".container-fluid").css("height", "");
			self.$element.find(".sub-title-selector ul").css("max-height", "");
		}

		$('.detail-view-panel').trigger('detail-view-panel-resize');
	};

	/**
	 * Arrange the blocks.
	 * @returns {void}
	 */
	DetailViewViewModel.prototype.manageLayout = function()
	{
		var self = this, gridNodes = [];
		if (!self.grid || !self.isReadMode())
		{
			return;
		}

		self.grid.setAnimation(false);

		if (!self.heighteningBlockIdentifierGroups)
		{
			self.heighteningBlockIdentifierGroups = [];
		}
		var shorteningCandidates = [];
		var isExistingHeightening = false;//if existing data block which want to increase height, that means no data block will decrease height

		var getAffectedLines = function(item, lineNodes)
		{
			var affectedLines = [];

			lineNodes.forEach(function(line)
			{
				if ((item.y + item.height <= line.y + line.height && item.y >= line.y)
					|| (item.y > line.y && item.y < line.y + line.height)
					|| (item.y < line.y + line.height && item.y + item.height > line.y))
				{
					affectedLines.push(line);
				}
			});

			return affectedLines;
		};

		$.each(self.grid.grid.nodes, function(index, item)
		{
			var $contentContainer = $(item.el).find(".grid-stack-item-content");

			if ($contentContainer.length == 0) return;

			var heightChange = 0, height = item.height, $content = item.el.find('.item-content');

			/*
			total height: self.UNITHEIGHT * item.height + (item.height - 1) * self.PADDING
			$contentContainer boerder height: 1*2
			$contentContainer padding top & bottom: 8 * 2
			*/

			var availableContentHeight = self.UNITHEIGHT * item.height + (item.height - 1) * self.PADDING - item.el.find('.item-title:not(:hidden)').outerHeight() - 8 * 2 - 1 * 2;
			if ($content.length > 0 && $content[0].scrollHeight > availableContentHeight)
			{
				if ($contentContainer.hasClass('custom-grid') || $contentContainer.hasClass('document'))
				{
					heightChange = 0;
				}
				else
				{
					heightChange = Math.ceil(($content[0].scrollHeight - availableContentHeight) / (self.UNITHEIGHT + self.PADDING));
				}
			}
			else if (item.height > 1)
			{
				if ($contentContainer.hasClass('custom-grid') || $contentContainer.hasClass('document'))
				{
					if (self.getBlockIdentifiers().indexOf(self.getBlockUniqueClassName(item)) > -1)
					{
						heightChange = self.getBlockOrginalHeight(item) - height;
					}
					else
					{
						heightChange = 0;
					}
				}
				else
				{
					$content.css("height", "auto");
					heightChange = 0 - Math.floor((availableContentHeight - $content.outerHeight()) / (self.UNITHEIGHT + self.PADDING));
					if (height + heightChange < self.getBlockOrginalHeight(item))
					{
						if (self.getBlockIdentifiers().indexOf(self.getBlockUniqueClassName(item)) > -1)
						{
							heightChange = self.getBlockOrginalHeight(item) - height;
						}
						else
						{
							heightChange = 0;
						}
					}
				}
			}

			if (heightChange == 0)
			{
				return;
			}
			else if (heightChange > 0)
			{
				isExistingHeightening = true;

				var heightenAffectedBlocks = self.addHeightenAffectedBlocks(item);

				for (var m = 0; m < heightChange; m++)
				{
					//heightChange could be more than 1 (when initialize, data block content may be extremely long and add one unit height is not enough)
					self.heighteningBlockIdentifierGroups.push(heightenAffectedBlocks.map(function(block)
					{
						return self.getBlockUniqueClassName(block);
					}));
				}

				heightenAffectedBlocks.forEach(function(heighteningBlock)
				{
					self.grid.resize(heighteningBlock.el[0], heighteningBlock.width, heighteningBlock.height + heightChange);
				});

				var affectedLines = getAffectedLines(item, self.lineBlockHelper.getVerticalLines());
				affectedLines.forEach(function(line)
				{
					self.lineBlockHelper.resizeHeight(line, line.height + heightChange);
				});
			}
			else
			{
				if (shorteningCandidates[item.y] == undefined)
				{
					shorteningCandidates[item.y] = [];
				}
				shorteningCandidates[item.y].push({ item: item, heightChange: heightChange });
			}
		});

		if (!isExistingHeightening)
		{
			var shorteningCandidate, shorteningLen, lineNodes;
			for (var i = 0, len = shorteningCandidates.length; i < len; i++)
			{
				shorteningCandidate = shorteningCandidates[i];
				if (shorteningCandidate == undefined || shorteningCandidate.length == 0) continue;
				shorteningLen = shorteningCandidate.length;

				var y = shorteningCandidate[0].item.y;

				if (shorteningLen == $('.grid-stack').find('.grid-stack-item[data-gs-y=' + y + ']').length)
				{
					var shorteningBlocks = self.addOmittedBlocks(shorteningCandidate, shorteningCandidates);

					var matchedIndex = self.getShorteningBlocksIndex(shorteningBlocks.map(function(block)
					{
						return self.getBlockUniqueClassName(block.item);
					}));

					if (matchedIndex != -1)
					{
						var shorteningHeight = self.getShorteningHeight(shorteningBlocks);
						lineNodes = self.lineBlockHelper.getVerticalLines();

						shorteningBlocks.forEach(function(block)
						{
							var item = block.item;
							self.grid.resize(item.el[0], item.width, item.height + shorteningHeight);
						});

						shorteningCandidate.forEach(function(block)
						{
							var affectedLines = getAffectedLines(block.item, lineNodes);
							affectedLines.forEach(function(line)
							{
								if (!line.shortened)
								{
									line.shortened = true;
									self.lineBlockHelper.resizeHeight(line, line.height + shorteningHeight);
								}
							});
						});

						self.heighteningBlockIdentifierGroups.splice(matchedIndex, 1);
					}
				}
			}
		}

		var kendoGrids = $('.grid-stack .grid-stack-item .kendo-grid')
		if (kendoGrids && kendoGrids.length > 0)
		{
			$.each(kendoGrids, function(index, kendoGrid)
			{
				var grid = $(kendoGrid).data("kendoGrid");
				if (grid)
				{
					grid.refresh();
				}
			})
		}

		self.grid.setAnimation(true);

		self.updateSectionHeaderTextInputWidth();
	};

	/**
	 * get affected blocks when a block heightening
	 */
	DetailViewViewModel.prototype.addHeightenAffectedBlocks = function(heighteningBlock)
	{
		var self = this, affectedItems = [], blocksGroupByColumn = [], width = self.getCurrentWidth();

		for (var i = 0; i < width; i++)
		{
			blocksGroupByColumn[i] = self.grid.grid.nodes.filter(function(item)
			{
				return item.x == i;
			});
		}

		blocksGroupByColumn.forEach(function(group)
		{
			if (group.length == 0 || heighteningBlock.x == group[0].x) return;

			group.forEach(function(item)
			{
				if ((heighteningBlock.y + heighteningBlock.height <= item.y + item.height && heighteningBlock.y >= item.y)
					|| (heighteningBlock.y > item.y && heighteningBlock.y < item.y + item.height)
					|| (heighteningBlock.y < item.y + item.height && heighteningBlock.y + heighteningBlock.height > item.y)
					&& affectedItems.map(function(affectItem) { return affectItem.x }).indexOf(item.x) == -1)
				{
					affectedItems.push(item);
				}
			})
		});

		return affectedItems.concat(heighteningBlock);
	}

	/**
	 * get omitted data blocks when shortening height
	 * @param {Array} shorteningCandidatesPerRow 
	 * @param {Array} allCandidates 
	 */
	DetailViewViewModel.prototype.addOmittedBlocks = function(shorteningCandidatesPerRow, allCandidates)
	{
		var self = this, columns = shorteningCandidatesPerRow.map(function(block) { return block.item.x }), affectedItems = [];

		if (shorteningCandidatesPerRow.length == self.getCurrentWidth()) return shorteningCandidatesPerRow;

		allCandidates = allCandidates.reduce(function(result, current) { return result.concat(current); }, []);
		allCandidates.forEach(function(block)
		{
			var matched = shorteningCandidatesPerRow.every(function(candidate)
			{
				return ((candidate.item.y + candidate.item.height <= block.item.y + block.item.height && candidate.item.y >= block.item.y)
					|| (candidate.item.y > block.item.y && candidate.item.y < block.item.y + block.item.height)
					|| (candidate.item.y < block.item.y + block.item.height && candidate.item.y + candidate.item.height > block.item.y))
					&& columns.indexOf(block.item.x) == -1;
			});

			if (matched)
			{
				affectedItems.push(block);
			}
		})

		return affectedItems.concat(shorteningCandidatesPerRow);
	}

	/**
	 * get unique class name of data block
	 * @param {Object} dataBlock 
	 */
	DetailViewViewModel.prototype.getBlockUniqueClassName = function(dataBlock)
	{
		return '.' + this.getDomUniqueClassName(dataBlock.el);
	}

	/**
	 * get unique class name of data block
	 * @param {JQuery Object} $stackItem
	 */
	DetailViewViewModel.prototype.getDomUniqueClassName = function($stackItem)
	{
		return $stackItem.attr('class').split(' ').map(function(name) { return name.trim() }).filter(function(name) { return name.indexOf('grid-unique') > -1; })[0];;
	}

	/**
	 * check section header is collapsed
	 * @param {String} className 
	 */
	DetailViewViewModel.prototype.isCollapsedSectionHeader = function(className)
	{
		var self = this;
		return self.collapsedSectionHeaderList.filter(function(item)
		{
			return item.headerClassName === className
		}).length > 0
	}

	/**
	 * check data block is hidden
	 * @param {String} className 
	 */
	DetailViewViewModel.prototype.isDataBlockHidden = function(className)
	{
		return this.collapsedSectionHeaderList.filter(function(item) { return item.uniqueClassName === className }).length > 0;
	}

	/**
	 * flatten self.heighteningBlockIdentifierGroups
	 */
	DetailViewViewModel.prototype.getBlockIdentifiers = function()
	{
		var self = this;
		if (!self.heighteningBlockIdentifierGroups || self.heighteningBlockIdentifierGroups.length == 0) return [];

		return self.heighteningBlockIdentifierGroups.reduce(function(accumulator, current) { return accumulator.concat(current) }, []);
	}

	/**
	 * get the minimum shortening height
	 * @param {Array} shorteningBlocks 
	 */
	DetailViewViewModel.prototype.getShorteningHeight = function(shorteningBlocks)
	{
		if (!shorteningBlocks || shorteningBlocks.length == 0) return 0;

		return shorteningBlocks.reduce(function(accumulator, current)
		{
			return Math.abs(accumulator) <= Math.abs(current.heightChange) ? accumulator : current.heightChange;
		}, -10000);
	}

	/**
	 * get data block orignal height
	 * @param {Object} block 
	 */
	DetailViewViewModel.prototype.getBlockOrginalHeight = function(block)
	{
		return this.gridStackItemOrignalHeight.filter(function(i) { return block.el.hasClass(i.className) })[0].height;
	}

	DetailViewViewModel.prototype.getBlockOrginalHeightByClassName = function(className)
	{
		return this.gridStackItemOrignalHeight.filter(function(i) { return className === i.className })[0].height;
	}

	/**
	 * get the index of shorteningBlocksIdentifierGroup
	 * @param {Array} shorteningBlocksIdentifierGroup
	 */
	DetailViewViewModel.prototype.getShorteningBlocksIndex = function(shorteningBlocksIdentifierGroup)
	{
		var self = this;
		if (!self.heighteningBlockIdentifierGroups || self.heighteningBlockIdentifierGroups.length == 0) return -1;

		var matchedIndex = -1;
		self.heighteningBlockIdentifierGroups.forEach(function(info, index)
		{
			if (info.length == shorteningBlocksIdentifierGroup.length && shorteningBlocksIdentifierGroup.every(function(blockInfo)
			{
				return info.indexOf(blockInfo) > -1;
			}))
			{
				matchedIndex = index;
			}
		});

		return matchedIndex;
	}

	/**
	 * Create and initial the stack grid.
	 * @returns {void}
	 */
	DetailViewViewModel.prototype.initStackGrid = function()
	{
		var self = this;
		if (self.$gridStack.length === 0)
		{
			return;
		}
		if (self.$gridStack.data('gridstack'))
		{
			self.$gridStack.data('gridstack').destroy();
		}
		var options = {
			acceptWidgets: '.data-point-item',
			minWidth: 0,
			alwaysShowResizeHandle: true,
			resizable: {
				autoHide: true,
				handles: 'n, ne, e, se, s, sw, w, nw'
			},
			removable: '.other-page',
			removeTimeout: 100,
			animate: true
		};

		self.grid = self.$gridStack.gridstack(options).data('gridstack');
		self.grid.cellHeight(self.UNITHEIGHT);
		self.grid.verticalMargin(self.PADDING);
		self.lineBlockHelper.addLineContainers();
	};

	/**
	 * Set item data into item dom.
	 * @returns {void}
	 */
	DetailViewViewModel.prototype.setStackBlockData = function(itemDom, item, role)
	{
		itemDom.data({
			field: item.field,
			defaultValue: item.defaultValue,
			displayValue: item.displayValue,
			type: item.type,
			format: item.format,
			title: item.title,
			customizedTitle: item.customizedTitle,
			appearance: JSON.stringify(item.appearance),
			role: role,
			conditionalAppearance: item.conditionalAppearance,
			url: item.url,
			subUrl: item.subUrl,
			uniqueClassName: this.getDomUniqueClassName(itemDom),
			positiveLabel: item.positiveLabel,
			negativeLabel: item.negativeLabel
		});
	};

	DetailViewViewModel.prototype.getContentByFieldName = function(fieldName)
	{
		var self = this, fieldNames, currentAttributeVal;

		if (!fieldName)
		{
			return "";
		}
		else if (fieldName.indexOf(".") >= 0)
		{
			fieldNames = fieldName.split(".");
			$.each(fieldNames, function(index, name)
			{
				if (currentAttributeVal)
				{
					currentAttributeVal = currentAttributeVal[name];
				}
				else
				{
					currentAttributeVal = self.entity[name];
				}
			});
			return currentAttributeVal;
		}
		else if ((fieldName === "SchoolNameWithCode" && !self.entity.SchoolName) ||
			(fieldName === "DepartureSchoolNameWithCode" && !self.entity.DepartFromSchool))
		{
			return "None";
		}
		else
		{
			return self.entity[fieldName];
		}
	};

	/**
	 * Add blocks by data source.
	 * @returns {void}
	 */
	DetailViewViewModel.prototype.addStackBlocks = function(layout)
	{
		var self = this, content, items, displayNone = false, contentBoolean,
			layout = layout || self.entityDataModel.layout(),
			container = self.$element.find(".right-container");
		layout = !layout ? self.defaultLayout : JSON.parse(layout);
		layout = self.processLayout(layout);
		items = layout.items;
		self.gridStackItemOrignalHeight = [];
		self.heighteningBlockIdentifierGroups = [];
		self.collapsedSectionHeaderList = [];

		if (items && items.length > 0)
		{
			var isLine = function(item)
			{
				return item.type && (item.type === 'horizontalLine' || item.type === 'verticalLine');
			};

			items.sort(function(a, b)
			{
				var aWeight = parseInt(a.x) + parseInt(a.y) * layout.width + (isLine(a) ? 0 : 0.1);
				var bWeight = parseInt(b.x) + parseInt(b.y) * layout.width + (isLine(b) ? 0 : 0.1);
				return aWeight - bWeight;
			});

			self.$gridStack.removeClass("full");
			$.each(items, function(index, item)
			{
				if (item.isCollapsed)
				{
					self.collapsedSectionHeaderList.push({ headerClassName: item.uniqueClassName, items: [] })
				}
				if (item.isHidden)
				{
					var sectionHeader = self.collapsedSectionHeaderList.filter(function(collapsedItem)
					{
						return collapsedItem.headerClassName === item.ownedBy
					});

					if (sectionHeader.length == 0)
					{
						self.collapsedSectionHeaderList.push({ headerClassName: item.ownedBy, items: [item] })
					}
					else
					{
						sectionHeader[0].items.push(item);
					}

					return;
				}

				item.appearance = item.appearance || self.appearanceTemplate;

				if (self.isReadMode())
				{
					if (item.field === "TotalCost")
					{
						if (self.totalCostContent)
						{
							content = self.totalCostContent;
						} else
						{
							return;
						}
					} else
					{
						content = self.getContentByFieldName(item.field);
					}

					if (item.type === "Boolean")
					{
						contentBoolean = !!content;
					}

					displayNone = content === undefined || content === "" || content === null;

					if (displayNone && item.field === "EstimatedCost")
					{
						displayNone = false;
						content = item.defaultValue;
					}

					item.minHeight = item.h;
				}
				else
				{
					content = item.defaultValue;
					if (item.type === "Boolean")
					{
						contentBoolean = content !== "False";
					}
				}

				var dataBlockStyles = self.getDataBlockStyles(item);
				switch (item.type)
				{
					case "spacer":
						self.addSpacerStackBlock(item);
						break
					case "section-header":
						self.addSectionHeaderStackBlock(item);
						break;
					case "Calendar":
						self.addCalendarStackBlock(item, dataBlockStyles);
						break;
					case "Boolean":
						self.addBooleanStackBlock(contentBoolean ? item.positiveLabel : item.negativeLabel, item, dataBlockStyles, null, contentBoolean);
						break;
					case "grid":
						self.addGridStackBlock(item, dataBlockStyles);
						break;
					case "RecordPicture":
						self.addRecordPictureStackBlock(content, item, dataBlockStyles);
						break;
					case "image":
						var $container = self.addImageStackBlock(item), $dom = $container.find("img");
						if (item.image !== undefined)
						{
							setTimeout(function()
							{
								$dom.attr("src", item.image.fileData || item.image);
								$dom.css("opacity", "1");
								$container.data("filePostData", { fileData: item.image.fileData || item.image });
							});
						} else
						{
							$dom.attr("src", "global/Img/detail-screen/image_24x24-pos.svg");
						}
						$dom.parent().find(".uploadImg").on('change', function(e)
						{
							self.imageChange(e, $container);
						});
						break;
					case "horizontalLine":
						self.lineBlockHelper.addHoriLine(item.x, item.y, item.w);
						break;
					case "verticalLine":
						self.lineBlockHelper.addVertiLine(item.x, item.y, item.h);
						break;
					case "File":
						self.addDocumentStackBlock(item, dataBlockStyles);
						break;
					case "Schedule":
						self.addScheduleStackBlock(item, dataBlockStyles);
						break;
					default:
						content = displayNone ? " None" : self.formatDataContent(content, item.type, item.format);
						self.addGeneralStackBlock(content, item, dataBlockStyles);
						break;
				}
			});
			self.$gridStack.find(".ui-resizable-handle").empty().append("<div class='handle'></div>");
		}

		//Add Line containers
		self.lineBlockHelper.addLineContainers();

		var rate = layout.sliderFontRate === undefined ? self.defaultSliderFontRate : layout.sliderFontRate;
		self.obSliderFontRate(rate);
		self.adjustBlockUnitHeight(rate);
		self.adjustFontSize(rate);
		self.updateSectionHeaderTextInputWidth();

		container.find('.hori-line, .verti-line').addClass('disable-animation');
		self.lineBlockHelper.fixCollisions();
		setTimeout(function() { container.find('.hori-line,.verti-line').removeClass('disable-animation') }, 250);
	};

	DetailViewViewModel.prototype.getLayout = function() {
		var layout = this.entityDataModel.layout();
		layout = !layout ? this.defaultLayout : JSON.parse(layout);
		layout = this.processLayout(layout);
		return layout;
	}
	
	DetailViewViewModel.prototype.processLayout = function(layout) {
		var dataPoints = {}, 
			dps = dataPointsJSON.fieldtrip,
			newLayoutItems = [];
		
		for (var key in dps)
		{
			dps[key].forEach(function(dp) {
				dataPoints[dp.field] = dp;
			});
		}
		var offsetY = 0;
		layout.items.forEach(function(item) {
			item.y += offsetY;
			if(item.field) {
				var dataPoint = dataPoints[item.field];
				$.extend(item, dataPoint);
				newLayoutItems.push(item);
			} else if (item.type === 'tab') {
				//tab is not supported, so move items in tab out of the tab element.
				var ds = item.dataSource,
					h = item.h,
					x = item.x,
					tabsTotalH = 0;
					y = item.y;

				ds.forEach(function(tab) {
					var realH = 0,
						len = tab.items.length;
					tab.items.forEach(function(tabItem, i) {
						if(tabItem.y > realH) {
							realH++;
						}
						tabItem.y = y + tabsTotalH + realH;
						
						if(tabItem.field) {
							var dataPoint = dataPoints[tabItem.field];
							$.extend(tabItem, dataPoint);
						}
						newLayoutItems.push(tabItem);
						if(i === len - 1) {
							realH++;
						}
					});
					tabsTotalH += realH;
				});
				offsetY += (tabsTotalH - h);
			} else {
				newLayoutItems.push(item);
			}
		});
		layout.items = newLayoutItems;
		return layout;
	}

	/**
	 * generate unique class name for data block
	 */
	DetailViewViewModel.prototype.generateUniqueClassName = function()
	{
		return 'grid-unique-' + Math.random().toString(36).substring(7);
	}

	/**
	 * Process the data content.
	 * @param {Object} item 
	 * @param {String} content 
	 * @return {String}
	 */
	DetailViewViewModel.prototype.formatDataContent = function(content, type, format)
	{
		function formatNumber(num)
		{
			return num > 9 ? num : "0" + num;
		}

		if (content === null || content === undefined)
		{
			return "";
		}

		switch (type)
		{
			case "Number":
				if (format === "0.00")
				{
					content = parseFloat(content).toFixed(2);
				}
				else if (format === "Money")
				{
					content = "$" + parseFloat(content).toFixed(2);
				}
				break;
			case "Date":
				content = moment(content).format("YYYY-MM-DD");
				break;
			case "Time":
				if (format === "TimeSpan")
				{
					if (!isNaN(Number(content)))
					{
						var num = Number(content);
						var hours = parseInt(num / 3600);
						var remainder = num % 3600;
						content = formatNumber(hours) + ":" + formatNumber(parseInt(remainder / 60)) + ":" + formatNumber(remainder % 60);
					}
				}
				else
				{
					var time = moment(content);
					content = time.isValid() ? time.format("hh:mm A") : moment("2018-01-01T" + content).isValid() ? moment("2018-01-01T" + content).format("hh:mm A") : "";
				}
				break;
			case "Date/Time":
				content = moment(content).format("YYYY-MM-DD hh:mm A")
				break;
			default:
				if (format === "Time")
				{
					var start = new Date();
					start.setHours(0, 0, content, 0);
					content = moment(start).format("HH:mm:ss");
				}
				else if (format === "Money")
				{
					content = "$" + parseFloat(content).toFixed(2);
				}
				break;
		}

		return content;
	};

	/**
	 * update data block orignal height
	 * @param {String} className 
	 * @param {Number} height 
	 */
	DetailViewViewModel.prototype.updateStackBlockOrignalHeight = function(className, height)
	{
		this.gridStackItemOrignalHeight.push({ className: className, height: height });
	}

	/**
	 * Add Total Cost block by data.
	 * @param {String} content 
	 * @param {Object} item
	 * @return {void} 
	 */
	DetailViewViewModel.prototype.addTotalCostStackBlock = function(id)
	{
		var self = this;
		var layout = self.getLayout();
		items = layout.items;

		if (items && items.length > 0)
		{
			var totalCostData = items.filter(function(item) { return item.field === "TotalCost" });

			if (totalCostData.length > 0 && self.isReadMode())
			{
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "fieldTripConfigs")).then(function(data)
				{
					var fieldtripData = data.Items[0];
					if (fieldtripData.ShowTripTotalCost)
					{
						return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), tf.DataTypeHelper.getEndpoint(self.gridType) + "?Id=" + id + "&@relationships=FieldTripResourceGroup")).then(function(response)
						{
							var entityDataModel = {},
								entity = response.Items[0];
							entityDataModel.FieldTripResourceGroups = entity.FieldTripResourceGroups;
							entityDataModel.FixedCost = entity.FixedCost;
							entityDataModel.MinimumCost = entity.MinimumCost;
							self.totalCostContent = self.detailViewHelper.resourcesTotalComputer(entityDataModel);
						});
					} else
					{
						return "";
					}
				});
			}
			else
			{
				return Promise.resolve();
			}
		} else
		{
			return Promise.resolve();
		}
	}
	/**
	 * Add general block by data.
	 * @param {String} content 
	 * @param {Object} item
	 * @return {void} 
	 */
	DetailViewViewModel.prototype.addGeneralStackBlock = function(content, item, dataBlockStyles, grid)
	{
		var self = this, grid = grid || self.grid,
			randomClass = item.uniqueClassName || self.generateUniqueClassName(),
			$itemDom = $("<div>\
							<div class='grid-stack-item-content' style='background:" + dataBlockStyles.backgroundColor + ";border-color:" + dataBlockStyles.borderColor + "'>\
								<input class='item-title' type='text' style='color:" + dataBlockStyles.titleColor + "' value='" + (item.customizedTitle || item.title) + "' />\
								<div class='item-title' style='color:" + dataBlockStyles.titleColor + "'>" + (item.customizedTitle || item.title) + "</div>\
								<div class='item-content' style='color:" + dataBlockStyles.contentColor + "'>" + content + "</div>\
							</div>\
						</div>").addClass(randomClass);
		self.updateStackBlockOrignalHeight(randomClass, item.h);
		self.setStackBlockData($itemDom, item);
		grid.addWidget($itemDom, item.x, item.y, item.w, item.h, undefined, undefined, undefined, item.minHeight);
	};

	/**
	 * Add grid blocks by data.
	 */
	DetailViewViewModel.prototype.addGridStackBlock = function(item, dataBlockStyles, grid)
	{
		if ($.grep(dataPointsJSON[this.gridType].Grid, function(grid, index) { return item.field === grid.field }).length <= 0)
		{
			return;
		}
		var self = this, grid = grid || self.grid, type = item.url.toLowerCase(),
			randomClass = item.uniqueClassName || self.generateUniqueClassName(),
			$itemDom = $("<div>\
							<div class='grid-stack-item-content custom-grid' style='background:" + dataBlockStyles.backgroundColor + ";border-color:" + dataBlockStyles.borderColor + "'>\
								<input class='item-title' type='text' style='color:" + dataBlockStyles.titleColor + "' value='" + (item.customizedTitle || item.title) + "' />\
								<div class='item-title' style='color:" + dataBlockStyles.titleColor + "'>" + (item.customizedTitle || item.title) + "</div>\
								<div class='item-content grid' style='color:" + dataBlockStyles.contentColor + "'><div class='kendo-grid'></div></div>\
							</div>\
						</div>").addClass(randomClass);
		self.updateStackBlockOrignalHeight(randomClass, item.h);
		self.setStackBlockData($itemDom, item);
		grid.addWidget($itemDom, item.x, item.y, item.w, item.h, undefined, undefined, undefined, 3);

		self.initDetailGrid(type, item, $itemDom);
	};

	/**
	 * Ensure all required fields for document entity type is included in the fields collection
	 * @param {Array} fields 
	 */
	function ensureRequiredDocumentFields(fields)
	{
		var requiredDocumentFields = ['Name', 'FileName', 'MimeType'];
		$.each(requiredDocumentFields, function(_, field)
		{
			if (fields.indexOf(field) < 0) fields.push(field);
		});
	}

	/**
	 * 
	 * @param {String} dataType 
	 * @param {String} dataIdentifier
	 */
	DetailViewViewModel.prototype.getGridRelatedData = function(dataType, dataIdentifier, columns)
	{
		/**
		 * 
			case "fieldtripvehicle":
			case "document":
			case "fieldtripdriver":
			case "fieldtripaide":
		 */

		var self = this, fieldTripResourceTypes = ["fieldtripresource", "fieldtripinvoice", "fieldtripvehicle", "fieldtripdriver", "fieldtripaide"];
		var columnFields = columns.map(function(column)
		{
			return column.FieldName;
		})

		if (dataType === "fieldtriphistory")
		{
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "fieldtriphistories?fieldtripid=" + self.entitySelectId));
		} else if (dataType === "document") {
			ensureRequiredDocumentFields(columnFields);
			return self.detailViewHelper._getDocumentGridRecords(columnFields, self.gridType, self.recordId);
		}
		else if (fieldTripResourceTypes.indexOf(dataType) === -1)
		{
			return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), tf.DataTypeHelper.getEndpoint(dataType)), { 
				paramData: {
					"@fields": "Id",
					"fieldtripid": self.entitySelectId
				}
			}).then(function(result)
			{
				var ids = result.Items, newColumns = $.map(columns, function(column) { return column.FieldName; });
				if (newColumns.indexOf("Id") === -1)
				{
					newColumns.push("Id");
				}
				return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint(dataType)), {
					paramData: { take: 100000, skip: 0 },
					data: {
						fields: newColumns,
						filterClause: "",
						filterSet: null,
						idFilter: { IncludeOnly: ids, ExcludeAny: [] },
						sortItems: [{ Name: "Id", isAscending: "asc", Direction: "Ascending" }]
					}
				});
			});
		}
		else
		{
			var paramData = {},
				endPoint = tf.DataTypeHelper.getEndpoint(dataType);
			paramData["@filter"] = "eq(FieldTripId," + self.entitySelectId + ")";
			
			switch (dataType)
			{
				case "fieldtripvehicle":
					paramData["@relationships"] = "Vehicle";
					break;
				case "fieldtripdriver":
					paramData["@relationships"] = "Driver";
					break;
				case "fieldtripaide":
					paramData["@relationships"] = "Aide";
					break;
				case "fieldtripresource":
					paramData["@relationships"] = "Vehicle,Driver,Aide";
					break;
				case "fieldtripinvoice":
					paramData["@relationships"] = "FieldTripAccount";
					break;
			}
			
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), tf.DataTypeHelper.getEndpoint("fieldtripresourcegroup")), {
				paramData: paramData
			});
		}
	};

	/**
	 * 
	 * @param {String} gridType 
	 * @param {Object} dataItem 
	 * @param {JQuery} $itemDom 
	 */
	DetailViewViewModel.prototype.initDetailGrid = function(gridType, dataItem, $itemDom)
	{
		var self = this, columns;
		if (gridType === "aide" || gridType === "driver")
		{
			gridType = "staff";
		}

		if (dataItem.columns && dataItem.columns.length > 0)
		{
			if(dataItem.columns[0].FieldName) {
				columns = dataItem.columns;
			} else {
				columns = Enumerable.From(self.getDefinitionLayoutColumns(self.getGridDefinitionByType(gridType))).Where(function(c)
				{
					return dataItem.columns.indexOf(c.FieldName) > -1;
				}).Select(function(c)
				{
					return $.extend({}, c);
				}).ToArray();
			}
		}
		else
		{
			columns = Enumerable.From(self.getDefinitionLayoutColumns(self.getGridDefinitionByType(gridType))).Where(function(c)
			{
				return !c.hidden;
			}).Select(function(c)
			{
				return $.extend({}, c);
			}).ToArray();
		}

		$itemDom.data("columns", columns);

		var kendoGrid = $itemDom.find(".kendo-grid").kendoGrid({
			scrollable: {
				virtual: true
			},
			pageable: {
				numeric: false,
				previousNext: false,
				message: {
					display: " "
				}
			},
			sortable: true,
			columns: self.getKendoColumnsExtend(columns)
		}).data("kendoGrid");

		var hasPermission = self.checkDataTypePermission(dataItem.url) && columns.length > 0;
		if (self.isReadMode() && self.entitySelectId && hasPermission)
		{
			self.getGridRelatedData(dataItem.url, dataItem.subUrl, columns).then(function(result)
			{
				if (result.Items.length > 0)
				{
					var dataSource = new kendo.data.DataSource({
						schema: {
							model: {
								fields: self.getKendoField(columns)
							}
						},
						data: result.Items,
						sort: dataItem.sort
					});
					kendoGrid.setDataSource(dataSource);
				}
				self.updateGridFooter($itemDom, result.Items.length);
			}, function(error)
			{
				//  no permission
				self.initEmptyDetailGrid(kendoGrid, $itemDom, columns, dataItem.sort, false, dataItem.url);
			});
		}
		else
		{
			self.initEmptyDetailGrid(kendoGrid, $itemDom, columns, dataItem.sort, hasPermission, dataItem.url);
		}
	};


	/**
	 * Check the permission for specified grid type.
	 * @param {String} gridType 
	 * @return {Boolean}
	 */
	DetailViewViewModel.prototype.checkDataTypePermission = function(gridType)
	{
		switch (gridType)
		{
			case "fieldtripresource":
			case "fieldtripinvoice":
			case "fieldtriphistory":
			case "fieldtripvehicle":
			case "document":
			case "fieldtripdriver":
			case "fieldtripaide":
				return tf.permissions.obFieldTrips();
			default:
				return false;
		}
	};

	DetailViewViewModel.prototype.initEmptyDetailGrid = function(kendoGrid, $item, columns, sortFunc, hasPermission, type)
	{
		var self = this,
			dataSource = new kendo.data.DataSource({
				schema: {
					model: {
						fields: self.getKendoField(columns)
					}
				},
				data: [],
				sort: sortFunc
			});
		kendoGrid.setDataSource(dataSource);
		self.updateGridFooter($item, 0);

		if (!hasPermission)
		{
			$item.find(".grid-stack-item-content").addClass("no-permission");
			$item.find(".k-grid-content").empty().append("<p>You don't have permission to view " + type + " data.</p>");
		}
	};

	/**
	 * Add a record picture data block.
	 * @param {String} image
	 * @param {Object} item 
	 * @param {Object} dataBlockStyles 
	 * @param {Object} grid 
	 */
	DetailViewViewModel.prototype.addRecordPictureStackBlock = function(image, item, dataBlockStyles, grid)
	{
		var self = this, defaultImageSrc,
			minHeight = 2, grid = grid || self.grid,
			randomClass = item.uniqueClassName || self.generateUniqueClassName(),
			hasImage = image && image !== "None",
			imageSrc = hasImage ? ("data:image/jpeg;base64," + image) : self.getDefaultRecordPicture(self.gridType),
			$itemDom = $("<div>\
							<div class='grid-stack-item-content recordPicture-stack-item' style='"
				+ (dataBlockStyles.backgroundColor ? ("background:" + dataBlockStyles.backgroundColor + ";") : "")
				+ (dataBlockStyles.borderColor ? ("border-color:" + dataBlockStyles.borderColor + ";") : "")
				+ "'>\
								<img src='"+ imageSrc + "'/>\
							</div>\
						</div>").addClass(randomClass);

		self.updateStackBlockOrignalHeight(randomClass, item.h);
		self.setStackBlockData($itemDom, item);
		grid.addWidget($itemDom, item.x, item.y, item.w, item.h, undefined, undefined, undefined, minHeight);
	};

	DetailViewViewModel.prototype.updateGridFooter = function($grid, filterCount)
	{
		var pageFooter = $grid.find(".k-pager-wrap"),
			footerInfo = pageFooter.find(".count-info"),
			record = filterCount === 1 ? " Record" : " Records";
		if (footerInfo.length > 0)
		{
			footerInfo.html(filterCount + record);
		}
		else
		{
			pageFooter.append($("<div class='count-info'>" + filterCount + record + "</div>"));
		}
	}

	DetailViewViewModel.prototype.getDefinitionLayoutColumns = function(columns)
	{
		return Enumerable.From(columns).Where(function(c)
		{
			return !c.onlyForFilter;
		}).Select(function(c)
		{
			var displayName,
				updateString = function(str)
				{
					$.each(tf.APPLICATIONTERMDEFAULTVALUES, function(index, defaultTerm)
					{
						if (tf.applicationTerm[defaultTerm.Term])
						{
							str = str.replace(new RegExp('\\b' + defaultTerm.Singular + '\\b', 'ig'), tf.applicationTerm[defaultTerm.Term].Singular);
							str = str.replace(new RegExp('\\b' + defaultTerm.Plural + '\\b', 'ig'), tf.applicationTerm[defaultTerm.Term].Plural);
							str = str.replace(new RegExp('\\b' + defaultTerm.Abbreviation + '\\b', 'ig'), tf.applicationTerm[defaultTerm.Term].Abbreviation);
						}
					});

					return str;
				};

			displayName = c.DisplayName || c.FieldName;
			displayName = updateString(displayName);
			c.DisplayName = displayName;

			return $.extend({}, c)
		}).ToArray();
	};

	DetailViewViewModel.prototype.getGridDefinitionByType = function(type)
	{
		switch (type.toLowerCase())
		{
			case "fieldtrip":
				return tf.fieldTripGridDefinition.gridDefinition().Columns;
			case "fieldtripresource":
				return tf.fieldTripGridDefinition.getRelatedGridDefinition("resource").Columns;
			case "fieldtriphistory":
				return tf.fieldTripGridDefinition.getRelatedGridDefinition("history").Columns;
			case "fieldtripinvoice":
				return tf.FieldTripInvoiceGridDefinition.gridDefinition().Columns;
			case "fieldtripvehicle":
				return tf.fieldTripGridDefinition.getRelatedGridDefinition("vehicle").Columns;
			case "document":
				return  tf.documentGridDefinition.gridDefinition().Columns;
			case "fieldtripdriver":
				return tf.fieldTripGridDefinition.getRelatedGridDefinition("driver").Columns;
			case "fieldtripaide":
				return  tf.fieldTripGridDefinition.getRelatedGridDefinition("aide").Columns;
			default:
				return;
		}
	};

	DetailViewViewModel.prototype.getKendoField = function(columns)
	{
		var fields = {};
		columns.forEach(function(definition)
		{
			var field = {};
			switch (definition.type)
			{
				case "string":
				case "boolean":
					field.type = "string";
					break;
				case "integer":
				case "number":
					field.type = "number";
					break;
				case "time":
				case "datetime":
				case "date":
					field.type = "date";
					break;
			}
			field.validation = definition.validation;
			fields[definition.FieldName] = field;
		});
		return fields;
	};

	DetailViewViewModel.prototype.changeGridColumns = function(editColumnViewModel, gridBlock)
	{
		var self = this, $grid, kendoGrid;
		$grid = gridBlock.find(".kendo-grid");
		if ($grid.length <= 0)
		{
			return;
		}
		gridBlock.data("columns", editColumnViewModel.selectedColumns);
		kendoGrid = $grid.data("kendoGrid");
		if (kendoGrid)
		{
			kendoGrid.setOptions({ "columns": self.getKendoColumnsExtend(editColumnViewModel.selectedColumns) });
			self.updateGridFooter($grid, 0);
		}
	}

	DetailViewViewModel.prototype.getKendoColumnsExtend = function(currentColumns)
	{
		var self = this, defalultColumnWidth = "80px";
		var columns = currentColumns.map(function(definition)
		{
			var column = definition;
			column.field = definition.FieldName;
			column.title = definition.DisplayName;
			if (!column.width)
				column.width = definition.Width || defalultColumnWidth;
			else
				definition.Width = column.width;
			if (definition.filterable == null)
			{
				column.filterable = {
					cell: {}
				};
			}

			column.hidden = false; // Overwrite the value of hidden attribute which setting in api.
			column.locked = false;
			column.sortable = true;
			switch (definition.type)
			{
				case "integer":
					column.format = "{0:n0}";
					break;
				case "time":
					column.format = "{0:h:mm tt}";
					break;
				case "date":
					column.format = "{0:MM/dd/yyyy}";
					break;
				case "datetime":
					column.format = "{0:MM/dd/yyyy hh:mm tt}";
					break;
			}
			if (definition.template !== undefined)
			{
				column.template = definition.template;
			}
			return column;
		});
		return columns;
	}

	/**
	 * Add boolean blocks by data.
	 */
	DetailViewViewModel.prototype.addBooleanStackBlock = function(content, item, dataBlockStyles, grid, contentBoolean)
	{
		var self = this, grid = grid || self.grid,
			className = self.isReadMode() ? (contentBoolean ? "true-item" : "false-item") : (["active", "yes", "true"].indexOf(item.defaultValue.toLocaleLowerCase()) > -1 ? "true-item" : "false-item"),
			randomClass = item.uniqueClassName || self.generateUniqueClassName(),
			$itemDom = $("<div>\
							<div class='grid-stack-item-content boolean-stack-item " + className + "' style='background:" + dataBlockStyles.backgroundColor + ";border-color:" + dataBlockStyles.borderColor + "'>\
								<div class='item-text' style='color:" + dataBlockStyles.contentColor + "'>" + content + "</div>\
							</div>\
						</div>").addClass(randomClass)

		self.updateStackBlockOrignalHeight(randomClass, item.h);

		self.setStackBlockData($itemDom, item);
		grid.addWidget($itemDom, item.x, item.y, item.w, item.h, undefined, undefined, undefined, item.minHeight);
	};

	/**
	 * Add calendar blocks by data.
	 */
	DetailViewViewModel.prototype.addCalendarStackBlock = function(item, dataBlockStyles, grid)
	{
		var self = this, minHeight = 4, grid = grid || self.grid,
			columnClass = "four-columns", role = item.role ? item.role : self.maxCalendarRole ? self.maxCalendarRole + 1 : 1,
			fillClass = item.w === 1 ? "fill-one" : item.w === 2 ? "fill-two" : item.w === 3 ? "fill-three" : "fill-four",
			editModeClass = self.isReadMode() ? "" : "temp-edit",
			randomClass = item.uniqueClassName || self.generateUniqueClassName(),
			$itemDom = $("<div><div class='grid-stack-item-content'><div class='calendar-item " + columnClass + " " + fillClass + " " + editModeClass + "'></div></div></div>").addClass(randomClass)
		self.updateStackBlockOrignalHeight(randomClass, item.h);

		self.setStackBlockData($itemDom, item, role);
		grid.addWidget($itemDom, item.x, item.y, item.w, item.h, undefined, undefined, undefined, item.minHeight || minHeight);
		var $calendarItem = $itemDom.find(".grid-stack-item-content .calendar-item"),
			$calendar = self.$preload.find(".calendar[role=" + role + "]");

		if ($calendar.length <= 0)
		{
			$calendar = $("<div class='calendar' role='" + role + "'></div>");
			$calendarItem.append($calendar);
			self.initCalendar($calendar, role);
			if (!self.isReadMode())
			{
				self.addCalendarEvents($calendarItem, $calendar.find("table td a"));
			}
		}
		else
		{
			$calendarItem.append($calendar);
			self.addCalendarEvents($calendarItem, $calendar.find("table td a"));
		}
	};

	/**
	 * Add "Spacer" block.
	 * @param {Object} item 
	 * @return {void}
	 */
	DetailViewViewModel.prototype.addSpacerStackBlock = function(item, grid)
	{
		var self = this, grid = grid || self.grid,
			randomClass = item.uniqueClassName || self.generateUniqueClassName(),
			$itemDom = $("<div class='general-stack-item'>\
							<div class='grid-stack-item-content'></div>\
						</div > ").addClass(randomClass);

		self.updateStackBlockOrignalHeight(randomClass, item.h);
		self.setStackBlockData($itemDom, item);
		grid.addWidget($itemDom, item.x, item.y, item.w, item.h, undefined, undefined, undefined, item.minHeight);
	}

	/**
	 * Add "Section-Header" block
	 * @param {Object} item 
	 * @return {void}
	 */
	DetailViewViewModel.prototype.addSectionHeaderStackBlock = function(item, grid)
	{
		var self = this, grid = grid || self.grid,
			randomClass = item.uniqueClassName || self.generateUniqueClassName(),
			$itemDom = $("<div class=\"section-header-stack-item\">\
							<div class=\"grid-stack-item-content\">\
								<input class=\"item-title\" type=\"text\" value=\"" + (item.title || "SECTION HEADER") + "\" " + (self.isReadMode() ? "disabled" : "") + " />\
								<div class=\"item-title-ruler\">" + (item.title || "SECTION HEADER") + "</div>\
								<div class=\"item-toggle\">\
									<button type=\"button\" class=\"btn btn-default\">\
										<span class=\"caret "+ (item.isCollapsed ? "up" : "") + "\"></span>\
									</button >\
								</div>\
							</div>\
						</div>").addClass(randomClass);

		item.w = self.getCurrentWidth();
		item.h = 1;
		item.x = 0;

		self.updateStackBlockOrignalHeight(randomClass, 1);
		self.setStackBlockData($itemDom, item);
		grid.addWidget($itemDom, 0, item.y, item.w, 1);

		self.$element.find(".grid-stack .section-header-stack-item input.item-title").off("blur.section-header").on("blur.section-header", function(e)
		{
			self.updateSectionHeaderTextInputWidth();
			$(e.currentTarget).parents(".section-header-stack-item").data({ title: $(e.currentTarget).val() })
		});
	};

	DetailViewViewModel.prototype.addVerticalLine = function(item)
	{
		var self = this;
	};

	/**
	 * Add calendar events blocks by data.
	 * @param {JQuery} $calendarItem
	 * @param {JQuery} $tdItems
	 * @return {void}
	 */
	DetailViewViewModel.prototype.addCalendarEvents = function($calendarItem, $tdItems)
	{
		var self = this, $item,
			startDate = moment($($tdItems[0]).attr("title")).format("M/D/YYYY"),
			endDate = moment($($tdItems[$tdItems.length - 1]).attr("title")).format("M/D/YYYY"),
			$scheduleDom = $("<div class='schedule'></div>"),
			scheduleItemDom = "", eventsDom = "",
			allEvents = [];

		function getShortClassName()
		{
			return ($calendarItem.hasClass("fill-four") ||
				$calendarItem.hasClass("fill-three") ||
				($calendarItem.hasClass("fill-two") && $calendarItem.hasClass("two-columns")) ||
				($calendarItem.hasClass("fill-one") && $calendarItem.hasClass("one-column"))) ?
				"" : "short";
		}

		if (!self.isReadMode())
		{
			var shortClass = getShortClassName();

			$tdItems.each(function(index, item)
			{
				$item = $(item);
				$item.find(".events-group").removeClass("show");
				if (moment($item.attr("title")).format("M/D/YYYY") === moment().format("M/D/YYYY"))
				{
					$item.find(".events-group").addClass("show");
				}
			});
			eventsDom = "<div class='event'>" +
				"<div class='left " + shortClass + "'>In the Haunted House</div>" +
				"<div class='right'>" + (shortClass ? "12:00PM" : "12:00PM - 6:00PM") + "</div>" +
				"</div>";
			scheduleItemDom = "<div class='group'>" +
				"<div class='date today'>TODAY, " + moment().format("ddd M/D/YY") + "</div>" +
				"<div class='events'>" + eventsDom + "</div>" +
				"</div>";
			$scheduleDom.append($(scheduleItemDom));
			$calendarItem.append($scheduleDom);
			return;
		}

		if (self.calendarEvents)
		{
			for (var i in self.calendarEvents)
			{
				if (moment(i) >= moment(startDate) && moment(i) <= moment(endDate))
				{
					if (self.calendarEvents[i].isToday)
					{
						allEvents.unshift(self.calendarEvents[i]);
					}
					else
					{
						allEvents.push(self.calendarEvents[i]);
					}
				}
			}
		}

		if (allEvents.length > 0)
		{
			$tdItems.each(function(index, item)
			{
				$item = $(item);
				$item.find(".events-group").removeClass("show");
				if (self.calendarEvents[moment($item.attr("title")).format("M/D/YYYY")])
				{
					$item.find(".events-group").addClass("show");
				}
			});

			var shortClass = getShortClassName();

			allEvents.forEach(function(item)
			{
				eventsDom = "";
				item.events.forEach(function(event)
				{
					eventsDom += "<div class='event'>" +
						"<div class='left " + shortClass + " " + (event.isAllDay ? "full" : "") + "'>" + event.name + "</div>" +
						"<div class='right'>" + (event.isAllDay ? "" : shortClass ? event.startTime : event.startTime + " - " + event.endTime) + "</div>" +
						"</div>";
				});

				scheduleItemDom = "<div class='group'>" +
					"<div class='date " + (item.isToday ? "today" : "") + "'>" + (item.isToday ? "TODAY, " : "") + item.date + "</div>" +
					"<div class='events'>" + eventsDom + "</div>" +
					"</div>";
				$scheduleDom.append($(scheduleItemDom));
			});
		}
		else
		{
			$tdItems.each(function(index, item)
			{
				$item = $(item);
				$item.find(".events-group").removeClass("show");
			});
			$scheduleDom = $("<div class='schedule display-table'></div>");
			$scheduleDom.append($("<div class='empty'>No Events</div>"));
		}

		$calendarItem.append($scheduleDom);
	};
	/**
	 * Add image blocks by data.
	 */
	DetailViewViewModel.prototype.addImageStackBlock = function(item, grid)
	{
		var self = this, grid = grid || self.grid,
			inputElement = "", imageElement = "";

		if (self.isReadMode())
		{
			inputElement = "<input class='uploadImg' id='inputImage" + item.imageId + "' name='file' type='file' accept='image/*' disabled >";
		} else
		{
			inputElement = "<input class='uploadImg' id='inputImage" + item.imageId + "' name='file' type='file' accept='image/*'  newImage = '" + item.newImage + "' >";
		}
		imageElement = "<img class='uploadedPhoto' style = 'opacity:0.4;width:auto;height:auto;max-width:100%;max-height:100%'/>";
		randomClass = item.uniqueClassName || self.generateUniqueClassName(),
			$itemDom = $("<div class='image'>\
						<div class='grid-stack-item-content image-stack-item ' type='image'>\
						<label for='inputImage"+ item.imageId + "' style='width:100%; height: 100% '>" + inputElement + imageElement + "</label>\
							</div >\
					   </div > ").addClass(randomClass);
		self.updateStackBlockOrignalHeight(randomClass, item.h);
		self.setStackBlockData($itemDom, item);
		grid.addWidget($itemDom, item.x, item.y, item.w, item.h, undefined, undefined, undefined, item.minHeight);
		return $itemDom;
	};

	/**
	 * Add File block by data.
	 * @param {String} content 
	 * @param {Object} item
	 * @return {void} 
	 */
	DetailViewViewModel.prototype.addDocumentStackBlock = function(item, dataBlockStyles, grid)
	{
		var self = this, grid = grid || self.grid,
			randomClass = item.uniqueClassName || self.generateUniqueClassName(), columns, kendoGrid, data,
			$itemDom = $("<div>\
							<div class='document grid-stack-item-content' style='background:" + dataBlockStyles.backgroundColor + ";border-color:" + dataBlockStyles.borderColor + "'>\
								<input class='item-title' type='text' style='color:" + dataBlockStyles.titleColor + "' value='" + (item.customizedTitle || item.title) + "' />\
								<div class='item-title' style='color:" + dataBlockStyles.titleColor + "'>" + (item.customizedTitle || item.title) + "</div>\
								<div class='item-content grid' style='color:" + dataBlockStyles.contentColor + "'><div class='kendo-grid'></div>\
							</div>\
						</div>").addClass(randomClass),
			action = function(e, view)
			{
				if (!data) return;
				var item = data[$(e.target).closest("tr").index()],
					mimeType = (item.MimeType || "").toLowerCase(),
					databaseType = tf.storageManager.get("databaseType");
				tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "DocumentFiles"),
					{
						paramData: { documentId: item.Id }
					})
					.then(function(keyApiResponse)
					{
						var path = pathCombine(tf.api.apiPrefix(), "DocumentFiles?hashKey=" + keyApiResponse.Items[0]);
						if (view && viewableMimeTypes.indexOf(mimeType) > -1)
						{
							path += "&view=true";
						}

						window.open(path);
					});
				e.preventDefault();
			};

		self.updateStackBlockOrignalHeight(randomClass, item.h);
		self.setStackBlockData($itemDom, item);
		grid.addWidget($itemDom, item.x, item.y, item.w, item.h, undefined, undefined, undefined, 3);

		columns = [
			{
				width: 24,
				attributes: { title: "View Document" },
				command: {
					className: "icon-document",
					text: " ",
					click: function(e) { action(e, true); },
				}
			}, {
				FieldName: "FileName",
				DisplayName: "File Name",
				title: "File Name",
				width: "150px",
				type: "string"
			}, {
				FieldName: "Size",
				DisplayName: "Size(KB)",
				title: "Size(KB)",
				width: "150px",
				type: "string"
			}];
		$itemDom.data("columns", columns);
		kendoGrid = $itemDom.find('.kendo-grid').kendoGrid({
			scrollable: {
				virtual: true
			},
			pageable: false,
			columns: self.getKendoColumnsExtend(columns)
		}).data("kendoGrid");

		var hasPermission = tf.permissions.documentRead;
		if (self.isReadMode() && hasPermission)
		{
			tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "documents?attachedToTypeID = " + 4 + " & attachedToID=" + self.entity.Id + "&@excluded=FileContent"))
				.then(function(response)
				{
					var dataSource = new kendo.data.DataSource({
						schema: {
							model: {
								fields: self.getKendoField(columns)
							}
						},
						data: [],
					});
					$.each(response.Items, function(index, item)
					{
						var fileData = {};
						fileData.FileName = item.FileName;
						fileData.Size = item.FileSizeKB;
						dataSource.options.data.push(fileData);
					});
					kendoGrid.setDataSource(dataSource);
					data = response.Items;
					$(".document.grid-stack-item-content tbody").on("dblclick", action);
				});
		}
		else
		{
			self.initEmptyDetailGrid(kendoGrid, $itemDom, columns, null, hasPermission, "Document");

		}
	};
	/**
	 * change Image for Image block.
	 * @return {void}
	 */
	DetailViewViewModel.prototype.imageChange = function(e, $container)
	{
		var self = this;
		var files = e.currentTarget.files,
			url = window.URL || window.webkitURL,
			file,
			reader = new FileReader();
		self.$uploadedPhoto = $(e.currentTarget.nextElementSibling);
		if (files && files.length)
		{
			file = files[0];

			reader.onload = function(event)
			{
				$(this).data("filePostData", { fileName: file.name, fileData: event.target.result });
				$container.data("filePostData", { fileName: file.name, fileData: event.target.result });
			}.bind(e.target);
			reader.readAsDataURL(file);
			if (file.size >= 2097152)
			{
				this.oberrormessage('Size too large (<2MB)');
			}
			else
			{
				this.oberrormessage(null);
				var blobUrl = url.createObjectURL(file);
				this.$uploadedPhoto.attr('src', blobUrl);
				this.$uploadedPhoto.css('opacity', '1');
			}
		}
	};

	/**
	 * Add schedule blocks by data.
	 */
	DetailViewViewModel.prototype.addScheduleStackBlock = function(item, dataBlockStyles, grid)
	{
		var self = this, minHeight = 4, grid = grid || self.grid, minWidth,
			editModeClass = self.isReadMode() ? "" : "temp-edit",
			randomClass = item.uniqueClassName || self.generateUniqueClassName(),
			$itemDom = $("<div>\
							<div class='grid-stack-item-content schedule-stack-item' style='background:" + dataBlockStyles.backgroundColor + ";border-color:" + dataBlockStyles.borderColor + "'>\
								<input class='item-title' type='text' style='color:" + dataBlockStyles.titleColor + "' value='" + (item.customizedTitle || item.title) + "' />\
								<div class='item-title' style='color:" + dataBlockStyles.titleColor + "'>" + (item.customizedTitle || item.title) + "</div>\
								<div class='item-content schedule-item " + editModeClass + "'style='color:" + dataBlockStyles.contentColor + "'>\
								<div class='scheduleContain'></div></div>\
							</div>\
						</div > ").addClass(randomClass);
		self.updateStackBlockOrignalHeight(randomClass, item.h);
		self.setStackBlockData($itemDom, item);

		switch (self.getCurrentWidth())
		{
			case 1:
				minWidth = 1;
				break;
			case 2:
			case 3:
				minWidth = 2;
				break;
			case 4:
				minWidth = 3;
				break;
			default:
				break;
		}

		if (self.gridType === "student")
		{
			grid.addWidget($itemDom, item.x, item.y, item.w, item.h, undefined, minWidth, undefined, 4);

			if (self.isReadMode())
			{
				// TODO-V2, need to remove
				var pList = [],
					p0 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), self.gridType, self.entity.Id));
				pList.push(p0);
				// TODO-V2, need to remove
				var p1 = tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "trip", "tripbystudentIds"),
					{
						data: [self.entity.Id]
					}).catch(function() { return null });
				pList.push(p1);
				// TODO-V2, need to remove
				var p2 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "studentexception", self.entity.Id, "studentExceptions"));
				pList.push(p2);
				Promise.all(pList).then(function(data)
				{
					var modelEntity;

					modelEntity = data[0].Items[0];
					modelEntity.Exceptions = data[2].Items;

					var trips = Enumerable.From(data[1].Items);
					if (modelEntity.PickUpTripStop && modelEntity.PickUpTripStop.TripId > 0)
					{
						modelEntity.PickUpTripStop.Trip = trips.Where(function(item)
						{
							return item.Id == modelEntity.PickUpTripStop.TripId;
						}).SingleOrDefault();
					}
					if (modelEntity.DropOffTripStop && modelEntity.DropOffTripStop.TripId > 0)
					{
						modelEntity.DropOffTripStop.Trip = trips.Where(function(item)
						{
							return item.Id == modelEntity.DropOffTripStop.TripId;
						}).SingleOrDefault();
					}
					$itemDom.find(".scheduleContain").append(self.setStudentScheduleContent(modelEntity));
					self.manageLayout();
				});
			}
			else
			{
				$itemDom.find(".scheduleContain").append(self.setStudentScheduleContent());
			}
		}

		if (self.gridType === "staff" || self.gridType === "vehicle")
		{
			grid.addWidget($itemDom, item.x, item.y, item.w, item.h, undefined, minWidth, undefined, 3);
			if (self.isReadMode())
			{
				var pList = [];
				// TODO-V2, need to remove
				var p0 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), self.gridType, self.entity.Id, "trip"));
				pList.push(p0);
				// TODO-V2, need to remove
				var p1 = tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "schedresource", self.entity.Id, self.gridType), {
					paramData: {
						startTime: "1899-12-30T00:00:00+08:00",
						endTime: "4018-12-30T00:00:00+08:00"
					}
				});
				pList.push(p1);

				Promise.all(pList).then(function(data)
				{
					var tripEntity = data[0].Items,
						schedResourceEntity = data[1].Items,
						$scheduleDom = "";

					if (tripEntity)
					{
						tripEntity.forEach(function(item, index)
						{
							$scheduleDom += self.setVehicleOrStaffScheduleContent(item);
						})
					}
					if (schedResourceEntity)
					{
						schedResourceEntity.forEach(function(item, index)
						{
							$scheduleDom += self.setVehicleOrStaffScheduleContent(item, true);
						})
					}

					if (!tripEntity.length && !schedResourceEntity.length)
					{
						$scheduleDom += self.setVehicleOrStaffScheduleContent();
					}
					$itemDom.find(".scheduleContain").append($scheduleDom);
					self.manageLayout();
				});
			}
			else
			{
				$itemDom.find(".scheduleContain").append(self.setVehicleOrStaffScheduleContent());
			}
		}
	};

	/**
	 * set student schedule content. 
	 * @param {Object} modelEntity
	 * @return {String} 
	 */
	DetailViewViewModel.prototype.setStudentScheduleContent = function(modelEntity)
	{
		var self = this, pickUpTripStop, dropOffTripStop, pickUpAltsite, dropOffAltsite, firstForPickUp = true, firstForDropOff = true, count = 0,
			pickUpExceptionsItemDomString = "", dropOffExceptionsItemDomString = "", scheduleItemDomString = "", pickUpItemDomString = "", dropOffItemDomString = "";
		if (modelEntity)
		{
			pickUpTripStop = modelEntity.PickUpTripStop;
			dropOffTripStop = modelEntity.DropOffTripStop;
			pickUpAltsite = modelEntity.PickUpAltsite;
			dropOffAltsite = modelEntity.DropOffAltsite;

			exceptions = self.getStudentException(modelEntity.Exceptions);
			exceptions.sort(function(a, b)
			{
				return a.sort > b.sort;
			}).forEach(function(item, index)
			{
				var weekString = item.value.weekString,
					tripStop = item.value.TripStop,
					dateString = item.value.dateString,
					isShowPickUpTitle = pickUpAltsite || pickUpTripStop,
					isShowDropOffTitle = dropOffAltsite || dropOffTripStop;

				if (!item.value.TripStop || item.value.TripStop.Id < 0)
				{
					count += 1;
				} else
				{
					if (item.action === 0)
					{
						pickUpExceptionsItemDomString += "<ul class='list'><li>" +
							(isShowPickUpTitle ? ("<div class='exceptionValue'> " + weekString + "</div >") : (firstForPickUp ? "<div class='scheduleTitle'>Pickup</div>" : ("<div class='exceptionValue'> " + weekString + "</div >"))) +
							"<div class='scheduleTitle'>Trip Assignment</div>" +
							"<div class='scheduleTitle'>Stop Name</div>" +
							"</li>" +
							"<li>" +
							"<div class='exceptionValue'>" + (isShowPickUpTitle ? dateString : (firstForPickUp ? (weekString + "</br>" + dateString) : dateString)) + "</div>" +
							"<div class='scheduleValue'>" + (tripStop ? (tripStop.Trip ? tripStop.Trip.Name : "") : "") + "</div>" +
							"<div class='scheduleValue'>" + (tripStop ? (tripStop.Street ? tripStop.Street : "") : "") + "</div>" +
							"</li>" +
							"<li>" +
							"<div class='exceptionValue'></div>" +
							"<div class='scheduleTitle'>Vehicle</div>" +
							"<div class='scheduleTitle'>Stop Time</div>" +
							"</li>" +
							"<li>" +
							"<div class='exceptionValue'></div>" +
							"<div class='scheduleValue'>" + (tripStop ? (tripStop.Trip ? tripStop.Trip.Name : "") : "") + "</div>" +
							"<div class='scheduleValue'>" + (tripStop ? moment(tripStop.StopTime).format("LT") : " ") + "</div>" +
							"</li></ul>";
						firstForPickUp = false;
					}
					else
					{
						dropOffExceptionsItemDomString += "<ul class='list'><li>" +
							(isShowDropOffTitle ? ("<div class='exceptionValue'> " + weekString + "</div >") : (firstForDropOff ? "<div class='scheduleTitle'>Dropoff</div>" : ("<div class='exceptionValue'> " + weekString + "</div >"))) +
							"<div class='scheduleTitle'>Trip Assignment</div>" +
							"<div class='scheduleTitle'>Stop Name</div>" +
							"</li>" +
							"<li>" +
							"<div class='exceptionValue'>" + (isShowDropOffTitle ? dateString : (firstForDropOff ? (weekString + "</br>" + dateString) : dateString)) + "</div>" +
							"<div class='scheduleValue'>" + (tripStop ? (tripStop.Trip ? tripStop.Trip.Name : " ") : " ") + "</div>" +
							"<div class='scheduleValue'>" + (tripStop ? (tripStop.Street ? tripStop.Street : " ") : " ") + "</div>" +
							"</li>" +
							"<li>" +
							"<div class='exceptionValue'></div>" +
							"<div class='scheduleTitle'>Vehicle</div>" +
							"<div class='scheduleTitle'>Stop Time</div>" +
							"</li>" +
							"<li>" +
							"<div class='exceptionValue'></div>" +
							"<div class='scheduleValue'>" + (tripStop ? (tripStop.Trip && tripStop.Trip.Vehicle ? tripStop.Trip.Vehicle.BusNum : " ") : " ") + "</div>" +
							"<div class='scheduleValue'>" + (tripStop ? moment(tripStop.StopTime).format("LT") : " ") + "</div>" +
							"</li></ul>";
						firstForDropOff = false;
					}
				}

			});
		}

		if (!self.isReadMode() || pickUpTripStop)
		{
			pickUpItemDomString = "<ul class='list'><li>" +
				"<div class='scheduleTitle'> Pickup</div>" +
				"<div class='scheduleTitle'> Trip Assignment</div>" +
				"<div class='scheduleTitle'> Stop Name</div>" +
				"</li> " +
				"<li>" +
				"<div class='scheduleValue'>" + (self.isReadMode() ? (pickUpAltsite ? pickUpAltsite.Name : "Home") : "Home") + "</div>" +
				"<div class='scheduleValue'>" + (self.isReadMode() ? (pickUpTripStop ? (pickUpTripStop.Trip ? pickUpTripStop.Trip.Name : " ") : " ") : "25 AM Bayside") + "</div>" +
				"<div class='scheduleValue'>" + (self.isReadMode() ? (pickUpTripStop ? (pickUpTripStop.Street ? pickUpTripStop.Street : " ") : " ") : "31 Spooner St") + "</div>" +
				"</li>" +
				"<li>" +
				"<div class='scheduleTitle'></div>" +
				"<div class='scheduleTitle'>Vehicle</div>" +
				"<div class='scheduleTitle'>Stop Time</div>" +
				"</li>" +
				"<li>" +
				"<div class='scheduleValue'></div>" +
				"<div class='scheduleValue'>" + (self.isReadMode() ? (pickUpTripStop ? (pickUpTripStop.Trip && pickUpTripStop.Trip.Vehicle ? pickUpTripStop.Trip.Vehicle.BusNum : " ") : " ") : "Ecto-1") + "</div>" +
				"<div class='scheduleValue'>" + (self.isReadMode() ? (pickUpTripStop ? moment(pickUpTripStop.StopTime).format("LT") : " ") : "7:14:00 AM") + "</div>" +
				"</li></ul>";
		}
		if (!self.isReadMode() || dropOffTripStop)
		{
			dropOffItemDomString = "<ul class='list'><li>" +
				"<div class='scheduleTitle'>Dropoff</div>" +
				"<div class='scheduleTitle'>Trip Assignment</div>" +
				"<div class='scheduleTitle'>Stop Name</div>" +
				"</li>" +
				"<li>" +
				"<div class='scheduleValue'>" + (self.isReadMode() ? (dropOffAltsite ? dropOffAltsite.Name : "Home") : "Home") + "</div>" +
				"<div class='scheduleValue'>" + (self.isReadMode() ? (dropOffTripStop ? (dropOffTripStop.Trip ? dropOffTripStop.Trip.Name : " ") : " ") : "25 PM Bayside") + "</div>" +
				"<div class='scheduleValue'>" + (self.isReadMode() ? (dropOffTripStop ? (dropOffTripStop.Street ? dropOffTripStop.Street : " ") : " ") : "31 Spooner St") + "</div>" +
				"</li>" +
				"<li>" +
				"<div class='scheduleTitle'></div>" +
				"<div class='scheduleTitle'>Vehicle</div>" +
				"<div class='scheduleTitle'>Stop Time</div>" +
				"</li>" +
				"<li>" +
				"<div class='scheduleValue'></div>" +
				"<div class='scheduleValue'>" + (self.isReadMode() ? (dropOffTripStop ? (dropOffTripStop.Trip && dropOffTripStop.Trip.Vehicle ? dropOffTripStop.Trip.Vehicle.BusNum : " ") : " ") : "Ecto-1") + "</div>" +
				"<div class='scheduleValue'>" + (self.isReadMode() ? (dropOffTripStop ? moment(dropOffTripStop.StopTime).format("LT") : " ") : "3:50:00 PM") + "</div>" +
				"</li></ul>";
		}

		if (self.isReadMode())
		{
			if (!pickUpTripStop && !dropOffTripStop && !pickUpAltsite && !dropOffAltsite && count >= exceptions.length)
			{
				scheduleItemDomString = "<ul class='list no-data' ><li>No schedule for this student</li></ul>";
				$(".item-content.schedule-item").addClass("no-data");
				return scheduleItemDomString;
			}
			if (!pickUpAltsite && !pickUpTripStop)
			{
				pickUpItemDomString = "";
			}
			if (!dropOffAltsite && !dropOffTripStop)
			{
				dropOffItemDomString = "";
			}
			pickUpItemDomString += pickUpExceptionsItemDomString;
			dropOffItemDomString += dropOffExceptionsItemDomString;
			scheduleItemDomString += pickUpItemDomString + dropOffItemDomString;
			$(".item-content.schedule-item").removeClass("no-data");
		} else
		{
			scheduleItemDomString += pickUpItemDomString + dropOffItemDomString;
		}
		return scheduleItemDomString;
	};

	/**
	* general student schedule dom. 
	* @param {Object} exceptions
	* @return {Array} 
	*/
	DetailViewViewModel.prototype.getStudentException = function(exceptions)
	{
		var self = this, exceptionString = "", dateString = "", returnData = [],
			weeks = ["Su", "M", "Tu", "W", "Th", "F", "Sa"];
		for (var i = 0; i < exceptions.length; i++)
		{
			var exception = exceptions[i];
			var weekString = "", weekSort = "";
			if (exception.Day1Flag)
			{
				weekString = weekString + weeks[0] + ",";
				weekSort += "1,";
			}
			if (exception.Day2Flag)
			{
				weekString = weekString + weeks[1] + ",";
				weekSort += "2,";
			}
			if (exception.Day3Flag)
			{
				weekString = weekString + weeks[2] + ",";
				weekSort += "3,";
			}
			if (exception.Day4Flag)
			{
				weekString = weekString + weeks[3] + ",";
				weekSort += "4,";
			}
			if (exception.Day5Flag)
			{
				weekString = weekString + weeks[4] + ",";
				weekSort += "5,";
			}
			if (exception.Day6Flag)
			{
				weekString = weekString + weeks[5] + ",";
				weekSort += "6,";
			}
			if (exception.Day7Flag)
			{
				weekString = weekString + weeks[6] + ",";
				weekSort += "7,";
			}
			weekString = weekString ? weekString.substr(0, weekString.length - 1) : "";
			weekSort = weekSort ? weekSort.substr(0, weekSort.length - 1) : "";
			var endString = "No End";
			if (exception.EndDate)
			{
				endString = moment(exception.EndDate).format('L');
			}
			dateString = moment(exception.StartDate).format('L') + ' - ' + endString;

			exceptionObj = {
				"weekString": weekString,
				"dateString": dateString,
				"comment": exception.Comment,
				"TripStop": exception.TripStop,
				"ActionFlag": exception.ActionFlag
			};


			returnData.push({ "action": exception.ActionFlag, "sort": weekSort, "value": exceptionObj });
		}
		return returnData;
	};

	/**
	* set staff  vehicle  schedule content. 
	* @param {Object} entity
	* @return {string} 
	*/
	DetailViewViewModel.prototype.setVehicleOrStaffScheduleContent = function(entity, isResource)
	{
		var self = this,
			tripItemDomString = "", weekDay, startTime, finishTime, description;
		if (entity)
		{
			weekDay = self.formatWeekDay(entity.Day);
			if (isResource)
			{
				description = entity.Description;
				startTime = entity.BeginTime;
				finishTime = entity.EndTime;
			} else
			{
				description = "Trip: " + entity.Name;
				startTime = entity.StartTime;
				finishTime = entity.FinishTime;
			}
		}
		tripItemDomString += "<ul class='list'><li>" +
			"<div class='scheduleTitle'>Week</div>" +
			"<div class='scheduleTitle'>StartTime</div>" +
			"<div class='scheduleTitle'>EndTime</div>" +
			"</li>" +
			"<li>" +
			"<div class='scheduleValue'>" + (weekDay ? weekDay : (self.isReadMode() ? " " : "weekly")) + "</div>" +
			"<div class='scheduleValue'>" + (startTime ? moment(startTime).format("LT") : (self.isReadMode() ? " " : "07:23:00 AM ")) + "</div>" +
			"<div class='scheduleValue'>" + (finishTime ? moment(finishTime).format("LT") : (self.isReadMode() ? " " : "07:32:00 PM ")) + "</div>" +
			"</li>" +
			"<li>" +
			"<div class='scheduleTitle'></div>" +
			"<div class='scheduleTitle' style='flex-basis:67%'>Description</div>" +
			"</li>" +
			"<li>" +
			"<div class='scheduleValue'></div>" +
			"<div class='scheduleValue' style='flex-basis:67%'>" + (description ? description : (self.isReadMode() ? " " : "Trip: 110 AM IMS")) + "</div>" +
			"</li></ul>";
		if (self.isReadMode())
		{
			if (!weekDay && !startTime && !finishTime && !description)
			{
				tripItemDomString = "<ul class='list no-data' ><li>No schedule for this " + self.gridType + "</li></ul>";
				$(".item-content.schedule-item").addClass("no-data");
			} else
			{
				$(".item-content.schedule-item").removeClass("no-data");
			}
			return tripItemDomString;
		} else
		{
			return tripItemDomString;
		}
	};

	/**
	* format number to the week day.
	* @param {integer} dayNum
	* @return {String}
	*/
	DetailViewViewModel.prototype.formatWeekDay = function(dayNum)
	{
		var weekDay = "";
		switch (dayNum)
		{
			case 0:
				weekDay = "Monday";
				break;
			case 1:
				weekDay = "Tuesday";
				break;
			case 2:
				weekDay = "Wednesday";
				break;
			case 3:
				weekday = "Thursday";
				break;
			case 4:
				weekDay = "Friday";
				break;
			case 5:
				weekDay = "Saturday";
				break;
			case 6:
				weekDay = "Sunday";
				break;
			case 7:
				weekDay = "Weekly";
				break;
			default:
				break;
		}
		return weekDay;
	}

	/**
	 * Update the enable/disable status for data blocks.
	 * @return {void}
	 */
	DetailViewViewModel.prototype.updateDragHandlerStatus = function()
	{
		var self = this,
			containerWidth = self.grid.grid.width,
			$gridStacks = self.grid.container.find(".grid-stack-item:not(.grid-stack-placeholder)");

		$.each($gridStacks, function(index, item)
		{
			var $el = $(item),
				data = $el.data("_gridstack_node"),
				isTopDraggable = data.y || data.height > 1,
				isLeftDraggable = data.x || data.width > 1,
				isRightDraggable = (data.x + data.width) < containerWidth || data.width > 1;

			$el.find(".ui-resizable-handle.ui-resizable-sw .handle").toggleClass("disable", !isLeftDraggable);
			$el.find(".ui-resizable-handle.ui-resizable-w .handle").toggleClass("disable", !isLeftDraggable);
			$el.find(".ui-resizable-handle.ui-resizable-nw .handle").toggleClass("disable", !isTopDraggable || !isLeftDraggable);
			$el.find(".ui-resizable-handle.ui-resizable-n .handle").toggleClass("disable", !isTopDraggable);
			$el.find(".ui-resizable-handle.ui-resizable-ne .handle").toggleClass("disable", !isTopDraggable || !isRightDraggable);
			$el.find(".ui-resizable-handle.ui-resizable-e .handle").toggleClass("disable", !isRightDraggable);
			$el.find(".ui-resizable-handle.ui-resizable-se .handle").toggleClass("disable", !isRightDraggable);
		});
	};

	/**
	 * If the calendar reset the width, sticky the calendar width.
	 * The calendar width isn't changed when resizing.
	 * @param {HtmlDom} target
	 */
	DetailViewViewModel.prototype.fixdCalendarStatus = function(target)
	{
		var self = this, $target = $(target), $calendarGroup = $target.find(".calendar-item");
		if (!$calendarGroup)
		{
			return;
		}

		var $calendar = $calendarGroup.find(".calendar"),
			$events = $calendarGroup.find(".schedule"),
			calendarWidth = $calendar.width(),
			allPadding = 40;
		$calendar.width(calendarWidth);
		$events.width("calc(100% - " + (calendarWidth + allPadding) + "px)");
		$events.css("display", "block");
	};

	/**
	 * If the calendar reset the width, update the calendar style
	 * @param {HtmlDom} target
	 */
	DetailViewViewModel.prototype.updateCalendarStatus = function(target)
	{
		var self = this, $target = $(target), $calendarGroup = $target.find(".calendar-item");
		if (!$calendarGroup)
		{
			return;
		}

		var $calendar = $calendarGroup.find(".calendar"),
			$events = $calendarGroup.find(".schedule");

		function resetClass(className)
		{
			$calendarGroup.removeClass("fill-one");
			$calendarGroup.removeClass("fill-two");
			$calendarGroup.removeClass("fill-three");
			$calendarGroup.removeClass("fill-four");
			$calendarGroup.addClass(className);
		};

		function updateEvents(className)
		{
			if (!className || $calendarGroup.hasClass(className))
			{
				$events.find(".event .left").removeClass("short");
				$events.find(".event .right").text("12:00PM - 6:00PM");
			}
			else
			{
				$events.find(".event .left").addClass("short");
				$events.find(".event .right").text("12:00PM");
			}
		};

		switch ($target.data("_gridstack_node").width)
		{
			case 1:
				resetClass("fill-one");
				updateEvents("one-column");
				break;
			case 2:
				resetClass("fill-two");
				updateEvents("two-columns");
				break;
			case 3:
				resetClass("fill-three");
				updateEvents();
				break;
			case 4:
				resetClass("fill-four");
				updateEvents();
				break;
		}

		$calendar.width("");
		$events.width("");
		$events.css("display", "");
	};

	/**
	 * When the data block dragging stops.
	 * @param {Event} e
	 */
	DetailViewViewModel.prototype.onDataBlockDragStop = function(e, helper)
	{
		var self = this, $block = helper.helper;
		self.updateDragHandlerStatus();
	};

	DetailViewViewModel.prototype.obDataBlockDragStart = function(e, helper)
	{
	};

	/**
	 * When the data block resizing start.
	 * @param {Event} e
	 */
	DetailViewViewModel.prototype.onDataBlockResizeStart = function(e)
	{
		var self = this;
		self.fixdCalendarStatus(e.target);

		$(e.target).closest(".grid-stack").addClass("grid-stack-resizing");
		$(e.target).addClass("item-resizing");
	};

	/**
	 * When the data block resizing stops.
	* @param {Event} e
	 */
	DetailViewViewModel.prototype.onDataBlockResizeStop = function(e, target)
	{
		var self = this;
		self.updateDragHandlerStatus();
		self.updateCalendarStatus(target);

		$(target).closest(".grid-stack").removeClass("grid-stack-resizing");
		$(target).removeClass("item-resizing");
		if (!$(target).hasClass("ui-resizable-autohide"))
		{
			$(target).addClass("ui-resizable-autohide");
			$(target).find(".ui-resizable-handle").hide()
		}
	};

	/**
	 * Determine if layout template changed
	 * @param {Object} entity1 
	 * @param {Object} entity2 
	 */
	DetailViewViewModel.prototype.isLayoutEntityChanged = function(entity1, entity2)
	{
		return !(entity1.Name === entity2.Name
			&& (entity1.SubTitle === entity2.SubTitle || (!entity1.SubTitle && !entity2.SubTitle))
			&& this.deepCompareLayout(entity1.Layout, entity2.Layout))
	}

	/**
	 * compatible with previous data
	 * handle default value
	 * @param {Object} dataBlock 
	 */
	DetailViewViewModel.prototype.preprocessDataBlock = function(dataBlock)
	{
		var self = this;
		dataBlock.uniqueClassName = "";
		dataBlock.customizedTitle = dataBlock.customizedTitle || dataBlock.title;

		switch (dataBlock.type)
		{
			case "File":
				dataBlock.h = dataBlock.h < 3 ? 3 : dataBlock.h;//file document min-height:3
			case "horizontalLine":
			case "verticalLine":
			case "image":
				break;
			default:
				dataBlock.appearance.backgroundColor = dataBlock.appearance.backgroundColor || self.defaultColors.backgroundColor.toLowerCase();
				dataBlock.appearance.contentColor = dataBlock.appearance.contentColor || self.defaultColors.contentColor.toLowerCase();
				dataBlock.appearance.borderColor = dataBlock.appearance.borderColor || self.defaultColors.borderColor.toLowerCase();
				dataBlock.appearance.titleColor = dataBlock.appearance.titleColor || self.defaultColors.titleColor.toLowerCase();
				break;
		}

		return dataBlock;
	}

	DetailViewViewModel.prototype.deepCompareLayout = function(previous, current)
	{
		previous = JSON.parse(previous);
		current = JSON.parse(current);
		if (previous.sliderFontRate !== current.sliderFontRate && !(previous.sliderFontRate == undefined && current.sliderFontRate == 0.5))
		{
			return false;
		}

		if (previous.width !== current.width) return false;

		if (previous.items.length !== current.items.length) return false;

		previous.items.sort(function(a, b) { return a.x === b.x && a.y === b.y ? a.w - b.w != 0 ? a.w - b.w : a.h - b.h : a.x - b.x != 0 ? a.x - b.x : a.y - b.y });
		current.items.sort(function(a, b) { return a.x === b.x && a.y === b.y ? a.w - b.w != 0 ? a.w - b.w : a.h - b.h : a.x - b.x != 0 ? a.x - b.x : a.y - b.y });

		for (var i = 0; i < previous.items.length; i++)
		{
			if (!this.deepCompare(previous.items[i], current.items[i], true))
			{
				return false;
			}
		}

		return true;
	}

	DetailViewViewModel.prototype.deepCompare = function(previousItem, currentItem, needPreprocess)
	{
		/*
		* if CURRENT contains all the keys in PREVIOUS, and the values are equal that means NO CHANGE
		* previous:{a:1}
		* current:{a:1,b:2}
		*/
		if (needPreprocess)
		{
			previousItem = this.preprocessDataBlock(previousItem);
			currentItem = this.preprocessDataBlock(currentItem);
		}
		var keys = Object.keys(previousItem);

		for (var i = 0; i < keys.length; i++)
		{

			var str = Object.prototype.toString.apply(previousItem[keys[i]]);

			if (str.substring(8, str.length - 1) == "Object")
			{
				if (!this.deepCompare(previousItem[keys[i]], currentItem[keys[i]]))
				{
					return false;
				}
			}
			else if (Array.isArray(previousItem[keys[i]]) && Array.isArray(currentItem[keys[i]]))
			{
				if (keys[i] == "columns")
				{
					var sortFun = function(a, b)
					{
						var aName = a.FieldName.toUpperCase();
						var bName = b.FieldName.toUpperCase();

						if (aName > bName)
						{
							return 1;
						}
						else if (aName < bName)
						{
							return -1;
						}
						else
						{
							return 0;
						}
					};
					var previousColumns = previousItem[keys[i]], currentColumns = currentItem[keys[i]];
					previousColumns = $.grep(previousColumns, function(item) { return !!item.FieldName });
					currentColumns = $.grep(currentColumns, function(item) { return !!item.FieldName });

					if (previousColumns.length != currentColumns.length) return false;
					//FieldName will be unique
					previousColumns.sort(sortFun);
					currentColumns.sort(sortFun);
					for (var j = 0; j < previousColumns.length; j++)
					{
						if (!this.deepCompare(previousColumns[j], currentColumns[j]))
						{
							return false;
						}
					}
				}
				else if (keys[i] == "AllItems")//this property came from grid->columns->ListFilterTemplate->AllItems
				{
					var previousColumns = previousItem[keys[i]], currentColumns = currentItem[keys[i]];
					previousColumns.sort();
					currentColumns.sort();
					if (previousColumns.toString() != currentColumns.toString())
					{
						return false;
					}
				}
				else if (keys[i] == "conditionalAppearance")
				{
					//condition appearance is depend on the sequence. so if sequence changed, it does changed!
					var previousColumns = previousItem[keys[i]], currentColumns = currentItem[keys[i]];
					if (previousColumns.length != currentColumns.length) return false;
					for (var k = 0; k < previousColumns.length; k++)
					{
						if (!this.deepCompare(previousColumns[k], currentColumns[k]))
						{
							return false;
						}
					}
				}
				else if (previousItem[keys[i]] != currentItem[keys[i]])
				{
					console.warn("this key [" + keys[i] + "] also need handle")
					return false;
				}
			}
			else if (typeof previousItem[keys[i]] == "string"
				&& typeof currentItem[keys[i]] == "string"
				&& previousItem[keys[i]].indexOf("#") == 0
				&& currentItem[keys[i]].indexOf("#") == 0)
			{
				//color value should not be case sensitive
				if (previousItem[keys[i]].toLowerCase() != currentItem[keys[i]].toLowerCase())
				{
					return false;
				}
			}
			else if (previousItem[keys[i]] != currentItem[keys[i]])
			{
				return false;
			}
		}

		return true;
	}

	DetailViewViewModel.prototype.existChangeWarning = function(layoutId)
	{
		var self = this;
		return tf.promiseBootbox.yesNo({
			message: "Do you want to close edit mode without saving?",
			title: "Confirmation"
		}).then(function(result)
		{
			if (result)
			{
				self.dataPointPanel.closeClick();
				self.applyLayoutTemplate(true, layoutId || self.getEffectiveDetailLayoutId()).then(function()
				{
					self.showDetailViewById(self.entitySelectId);
				})
			}
		});
	}

	/**
	 * Open the manage layouts modal.
	 * @param {object} model data model.
	 * @param {object} e element.
	 * @return {void}
	 */
	DetailViewViewModel.prototype.openManageLayouts = function(model, e)
	{
		var self = this,
			manageModal = new TF.Modal.ManageDetailScreenLayoutModalViewModel(self.gridType, self.entityDataModel.id(), true);
		tf.modalManager.showModal(manageModal).then(function(result)
		{
			if (result && result.data)
			{
				if (result.isOpenTemp)
				{
					var data = result.data;
					self.onCloseEditMode.notify({
						switchToLayoutId: data.id,
						callback: function()
						{
							self.applyLayoutTemplate(false, data.id, data.isDeleted).then(function()
							{
								self.updateDetailViewTitleWithDataPoint();
								self.setStackBlocks();
								self.updateNameContainer();
							})
						}
					});
				}
				else
				{
					if (!result.data.isDeleted)
					{
						tf.storageManager.save(self.stickyName, result.data.selectId);
						tf.storageManager.save(self.stickyLayoutName, result.data.selectName);
					}
					else
					{
						tf.storageManager.delete(self.stickyName);
						tf.storageManager.delete(self.stickyLayoutName);
					}
					var data = result.data;
					self.onCloseEditMode.notify({
						switchToLayoutId: data.id,
						callback: function()
						{
							self.dataPointPanel.closeClick();
							self.applyLayoutTemplate(true, result.data.selectId).then(function()
							{
								self.showDetailViewById(self.entitySelectId);
							});
						}
					});
				}
			}
		});
	};

	/**
	 * Before save function.
	 * @param {object} model data model.
	 * @param {object} e element.
	 * @return {void}
	 */
	DetailViewViewModel.prototype.preSave = function(model, e)
	{
		var self = this, menu = $(e.currentTarget).next(".dropdown-menu");

		if (self.entityDataModel.id())
		{
			menu.show();
		}
		else
		{
			self.save();
		}
	};

	/**
	 * Save detial screen entity.
	 * @param {object} model data model.
	 * @param {object} e element.
	 * @return {void}
	 */
	DetailViewViewModel.prototype.save = function(model, e)
	{
		var self = this,
			menu = e ? $(e.currentTarget).parents('.type-selector').find(".dropdown-menu") : null,
			callback = function()
			{
				var data = self.entityDataModel.toData();

				if (self.isSaveAsNew)
				{
					data.Id = 0;
					data.APIIsNew = true;
				}
				if (data.APIIsNew)
				{
					tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreens"), {
						data: [data]
					}).then(function(apiResponse)
					{
						if (apiResponse && apiResponse.Items && apiResponse.Items[0])
						{
							var dataItem = apiResponse.Items[0], layout = JSON.parse(dataItem.Layout);
							dataItem.APIIsNew = false;
							self.dataPointPanel.closeClick();
							self.applyLayoutTemplate(true, dataItem.Id, null, dataItem).then(function()
							{
								self.showDetailViewById(self.entitySelectId);
								tf.storageManager.save(self.stickyName, dataItem.Id);
								tf.storageManager.save(self.stickyLayoutName, dataItem.Name);
							});
						}
					}).catch(function(error)
					{
						throw new Error('error occurred.');
					});
				} else
				{
					tf.promiseAjax.put(pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreens", data.Id), {
						data: data
					}).then(function(apiResponse)
					{
						if (apiResponse && apiResponse.Items && apiResponse.Items[0])
						{
							var dataItem = apiResponse.Items[0], layout = JSON.parse(dataItem.Layout);
							dataItem.APIIsNew = false;
							self.dataPointPanel.closeClick();
							self.applyLayoutTemplate(true, dataItem.Id, null, dataItem).then(function()
							{
								self.showDetailViewById(self.entitySelectId);
								tf.storageManager.save(self.stickyName, dataItem.Id);
								tf.storageManager.save(self.stickyLayoutName, dataItem.Name);
							});
						}
					}).catch(function(error)
					{
						throw new Error('error occurred.');
					});
				}

			};

		if (menu)
		{
			menu.hide();
		}
		self.updateLayoutEntity();

		if (self.obName())
		{
			self.pageLevelViewModel.saveValidate()
				.then(function(valid)
				{
					if (valid)
					{
						callback();
					}
					self.isSaveAsNew = false;
				}.bind(this));
		}
		else
		{
			tf.modalManager.showModal(new TF.Modal.SaveTemplateNameModalViewModel(self.entityDataModel)).then(function(name)
			{
				if (name)
				{
					self.entityDataModel.name(name);
					self.updateNameContainer();
					callback();
				}
				self.isSaveAsNew = false;
			})
		}
	};

	/**
	 * Save detial screen to a new entity.
	 * @param {object} model data model.
	 * @param {object} e element.
	 * @return {void}
	 */
	DetailViewViewModel.prototype.saveAsNew = function(model, e)
	{
		var self = this;
		self.isSaveAsNew = true;
		self.save(model, e);
	};

	/**
	 * 
	 * @param {number} targetLayoutId 
	 * @param {function} callback 
	 */
	DetailViewViewModel.prototype.checkLayoutChange = function(targetLayoutId, callback)
	{
		var self = this;
		self.updateLayoutEntity();
		var currentEntity = self.entityDataModel.toData();

		if (self.isLayoutEntityChanged(self.layoutEntityBeforeEditing, currentEntity))
		{
			self.existChangeWarning(targetLayoutId);
		}
		else if (callback)
		{
			callback();
		}
		else
		{
			self.dataPointPanel.closeClick();
			self.applyLayoutTemplate(true, self.getEffectiveDetailLayoutId()).then(function()
			{
				self.showDetailViewById(self.entitySelectId);
			});
		}
	}

	/**
	 * Update detail screen entity.
	 * @return {void}
	 */
	DetailViewViewModel.prototype.updateLayoutEntity = function(layout)
	{
		var self = this;
		self.entityDataModel.name(self.obName());
		self.entityDataModel.subTitle(self.obSubTitle());
		self.entityDataModel.layout(layout ? layout : self.serializeLayout());
		self.entityDataModel.dataTypeId(tf.DataTypeHelper.getId(self.gridType));
	};

	DetailViewViewModel.prototype.mergeHiddenBlockLayoutInfo = function(sectionHeaderInfo, layoutObj, isToggleSectionHeader)
	{
		var self = this,
			result = [],
			sectionHeaderLayout = layoutObj.items.filter(function(item) { return item.uniqueClassName === sectionHeaderInfo.className })[0],
			matchedSectionHeaders = self.collapsedSectionHeaderList.filter(function(item)
			{
				return item.headerClassName === sectionHeaderInfo.className
			});

		if (matchedSectionHeaders.length != 1) return [];
		var ownedItems = matchedSectionHeaders[0].items;

		if (isToggleSectionHeader)
		{
			self.collapsedSectionHeaderList = self.collapsedSectionHeaderList.filter(function(item)
			{
				return item.headerClassName !== sectionHeaderInfo.className
			})
		}

		var topmost = Number.MAX_VALUE, bottommost = -1;
		for (var i = 0; i < ownedItems.length; i++)
		{
			var ownedItem = ownedItems[i];
			if (ownedItem.y < topmost)
			{
				topmost = ownedItem.y;
			}
			if (ownedItem.y + ownedItem.h > bottommost)
			{
				bottommost = ownedItem.y + ownedItem.h;
			}

			if (isToggleSectionHeader)
			{
				ownedItem.isHidden = false;
			}
			ownedItem.y = ownedItem.distance + sectionHeaderLayout.y;

			result.push(ownedItem);
		}

		var downDistance = 0;
		if (topmost < Number.MAX_VALUE && bottommost >= 0)
		{
			downDistance = bottommost - topmost;
		}

		result = result.concat(layoutObj.items.map(function(item)
		{
			if (item.uniqueClassName === sectionHeaderInfo.className)
			{
				if (isToggleSectionHeader)
				{
					item.isCollapsed = false;
					item.isHidden = false;
				}
			}
			else if (item.y > sectionHeaderLayout.y)
			{
				item.y += downDistance;
			}

			return item;
		}))

		return result;
	}

	DetailViewViewModel.prototype.handleRelatedBlocksWhenToggleSectionHeader = function(sectionHeaderInfo, layoutObj)
	{
		var self = this,
			result = [],
			sectionHeader = $("." + sectionHeaderInfo.className),
			headers = sectionHeader.siblings('.section-header-stack-item'),
			y = parseInt(sectionHeader.attr("data-gs-y")),
			nextY = Infinity;

		for (var i = 0; i < headers.length; i++)
		{
			var temp = parseInt($(headers[i]).attr("data-gs-y"));
			if (temp > y && temp < nextY)
			{
				nextY = temp;
			}
		}

		if (layoutObj && layoutObj.items && layoutObj.items.length > 0)
		{
			if (sectionHeaderInfo.isCollapsed)
			{
				if (!self.collapsedSectionHeaderList)
				{
					self.collapsedSectionHeaderList = []
				}

				var sectionHeaderOwnedItems = [];
				result = layoutObj.items.map(function(item)
				{
					if ((y < item.y && item.y < nextY) || (item.y == nextY && item.type == "horizontalLine"))
					{
						item.distance = item.y - y;
						item.isHidden = true;
						item.ownedBy = sectionHeaderInfo.className;
						sectionHeaderOwnedItems.push(item);
					}

					return item;
				})

				self.collapsedSectionHeaderList.push({ headerClassName: sectionHeaderInfo.className, items: sectionHeaderOwnedItems })
			}
			else
			{
				result = self.mergeHiddenBlockLayoutInfo(sectionHeaderInfo, layoutObj, true)
			}
		}

		var allCollapsedSectionHeader = self.collapsedSectionHeaderList.reduce(function(result, current)
		{
			return result.concat(current.headerClassName)
		}, [])

		return result.map(function(item)
		{
			if (allCollapsedSectionHeader.indexOf(item.uniqueClassName) > -1)
			{
				item.isCollapsed = true;
				item.isHidden = false;
			}

			return item;
		})
	}

	/**
	 * serialize the layout to JSON.
	 * @returns {void}
	 */
	DetailViewViewModel.prototype.serializeLayout = function(options, $element)
	{
		var self = this, currentGroup, node,
			width = options && options.width,
			$gridStack = self.$element.find(".grid-stack"),
			items = $gridStack.find(">.grid-stack-item:visible, >.non-data-element"),
			$lines = $gridStack.find(".hori-line, .verti-line"),
			nonDataItems = $gridStack.find(">.non-data-element"),
			serializedData = {
				width: width || self.getCurrentWidth(),
				sliderFontRate: self.obSliderFontRate(),
				items: []
			};

		if (!self.grid || (items.length <= 0 && nonDataItems.length <= 0 && $lines.length <= 0)) { return JSON.stringify(serializedData); }

		$.map(items, function(el)
		{
			var $el = $(el), layoutItem;
			node = $el.data('_gridstack_node');
			if ($el.attr("type") === "group")
			{
				$.each(self.dataPointPanel.groups, function(index, group)
				{
					if (group.title === $el.attr("title"))
					{
						currentGroup = group;
						return false;
					}
				});
				if (currentGroup && currentGroup.items.length && currentGroup.items.length > 0)
				{
					$.each(currentGroup.items, function(index, item)
					{
						if (item.type === "Schedule")
						{
							item.w = serializedData.width;
						}
						serializedData.items.push({
							x: item.x + node.x,
							y: item.y + node.y,
							w: item.w,
							h: item.h,
							field: item.field,
							title: item.title,
							type: item.type,
							format: item.format,
							defaultValue: item.defaultValue,
							customizedTitle: item.customizedTitle,
							appearance: item.appearance,
							conditionalAppearance: item.conditionalAppearance,
							image: item.image,
							url: item.url,
							subUrl: item.subUrl,
							columns: item.columns,
							sort: item.sort,
							thematicId: item.thematicId,
							thematicName: item.thematicName,
							isLegendOpen: item.isLegendOpen,
							legendNameChecked: item.legendNameChecked,
							legendDescriptionChecked: item.legendDescriptionChecked
						});
					});
				}
			}
			else if ($el.attr("isgroupitem"))
			{
				var groupItem = null;
				$.each(self.dataPointPanel.groups, function(index, group)
				{
					if (group.title === $el.attr("groupName"))
					{
						$.each(group.items, function(index, item)
						{
							if (item.id === parseInt($el.attr("id")))
							{
								groupItem = item;
								return false;
							}
						});
						if (groupItem)
						{
							return false;
						}
					}
				});
				if (groupItem)
				{
					layoutItem = {
						x: node.x,
						y: node.y,
						w: groupItem.w,
						h: groupItem.h,
						field: groupItem.field,
						title: groupItem.title,
						type: groupItem.type,
						format: groupItem.format,
						defaultValue: groupItem.defaultValue,
						customizedTitle: groupItem.customizedTitle,
						appearance: groupItem.appearance,
						conditionalAppearance: groupItem.conditionalAppearance,
						image: groupItem.image,
						url: groupItem.url,
						subUrl: groupItem.subUrl,
						columns: groupItem.columns,
						sort: groupItem.sort
					};
				}
			}
			else if ($el.hasClass("non-data-element"))
			{
				layoutItem = {
					x: node.x,
					y: node.y,
					w: node.width,
					h: node.height,
					type: $el.attr("type")
				};
			}
			else if ($el.hasClass("image"))
			{
				layoutItem = {
					x: node.x,
					y: node.y,
					w: node.width,
					h: node.height,
					type: $el.data("type") || $el.attr("type"),
					image: node.el.find("input").data("filePostData") || node.el.data("filePostData"),
					imageId: node.el.find("input").length > 0 ? node.el.find("input")[0].id.split("inputImage")[1] : self.guid()
				};
				if ($element && $el[0] === $element[0])
				{
					layoutItem.newImage = true;
				}
			}
			else
			{
				if ($el.data("type") === "grid")
				{
					var grid = $el.find(".kendo-grid"), kendoGrid, sort;
					if (grid.length > 0)
					{
						kendoGrid = grid.data("kendoGrid");
						sort = kendoGrid.dataSource.sort();
					}
				}

				layoutItem = {
					x: node.x,
					y: node.y,
					w: node.width,
					h: node.height,
					field: $el.data("field") || $el.attr("field"),
					title: $el.data("title") || $el.attr("title"),
					type: $el.data("type") || $el.attr("type"),
					format: $el.data("format") || $el.attr("format"),
					defaultValue: $el.data("defaultValue") || $el.attr("defaultValue"),
					displayValue: $el.data("displayValue") || $el.attr("displayValue"),
					customizedTitle: $el.data("customizedTitle"),
					appearance: $el.data('appearance') ? JSON.parse($el.data('appearance')) : null,
					role: $el.data("role"),
					conditionalAppearance: $el.data("conditionalAppearance"),
					url: $el.data("url") || $el.attr("url"),
					subUrl: $el.data("subUrl") || $el.attr("subUrl"),
					columns: $el.data("columns"),
					sort: sort,
					positiveLabel: $el.data("positiveLabel") || $el.attr("positiveLabel"),
					negativeLabel: $el.data("negativeLabel") || $el.attr("negativeLabel")
				}
			}

			if (layoutItem)
			{
				var uniqueClassName = $el.data("uniqueClassName") || self.generateUniqueClassName();//no class name means new added block
				layoutItem.uniqueClassName = uniqueClassName;
				layoutItem.isHidden = self.isDataBlockHidden(uniqueClassName);
				layoutItem.isCollapsed = self.isCollapsedSectionHeader(uniqueClassName);
				serializedData.items.push(layoutItem);
			}
		});

		if ($lines.length > 0)
		{
			serializedData.items = serializedData.items.concat(self.lineBlockHelper.serializeLines($lines));
		}

		var collapsedHeaders = serializedData.items.filter(function(item) { return item.isCollapsed });
		if (options && options.sectionHeader && options.sectionHeader.className)
		{
			// click section header arrow icon
			serializedData.items = self.handleRelatedBlocksWhenToggleSectionHeader(options.sectionHeader, serializedData);
			collapsedHeaders = collapsedHeaders.filter(function(item) { return item.uniqueClassName !== options.sectionHeader.className });
		}

		collapsedHeaders.forEach(function(header)
		{
			serializedData.items = self.mergeHiddenBlockLayoutInfo({ className: header.uniqueClassName, isCollapsed: true }, serializedData, false);
		})

		serializedData.items.sort(function(a, b) { return a.y - b.y });

		return JSON.stringify(serializedData);
	}

	DetailViewViewModel.prototype.guid = function()
	{
		var s4 = function()
		{
			return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		}
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
	};

	/**
	 * Open the subtitle menu.
	 * @param {object} model data model.
	 * @param {object} e element.
	 * @return {void}
	 */
	DetailViewViewModel.prototype.subtitleMenuClick = function(model, e)
	{
		var self = this, menu = $(e.currentTarget).find(".dropdown-menu");

		if (self.searchTextFocused)
		{
			clearTimeout(self.clearFocusTimeout);
			self.setSearchInputCursor();
		}

		menu.show();
	};

	/**
	 * Select a subtitle on the subtitle menu.
	 * @param {object} model data model.
	 * @param {object} e element.
	 * @return {void}
	 */
	DetailViewViewModel.prototype.selectItemClick = function(model, e)
	{
		var self = this,
			menu = $(e.currentTarget).parents('.type-selector').find(".dropdown-menu"),
			selectedField = model.field;

		if (!!selectedField)
		{
			self.obSubTitle(selectedField);
			self.obSubTitleLabel(self.getSubtitleDefaultValueByFieldName(selectedField));
		}
		else
		{
			// select nothing.
			self.obSubTitle("(none)");
			self.obSubTitleLabel("");
		}
		menu.hide();
		e.stopPropagation();
	};

	DetailViewViewModel.prototype.closeTemplateMenu = function(model, e)
	{
		var self = this;

		if ((navigator.userAgent.indexOf('Firefox') >= 0 && $(e.relatedTarget).closest(".detail-screen-contextmenu").length <= 0)
			|| $(e.toElement).closest(".detail-screen-contextmenu").length <= 0)
		{
			self.isTemplateMenuOpened = false;
			tf.contextMenuManager.dispose();
		}
	};

	/**
	 * The event of details screent layout icon click.
	 * @param {object} viewModel The viewModel of this modal.
	 * @param {event} e The click event.
	 * @returns {void}
	 */
	DetailViewViewModel.prototype.templateMenuClick = function(model, e)
	{
		var self = this, target = $(e.currentTarget),
			isFromMoreButton = target.closest(".selector-menu").length <= 0,
			cacheOperatorBeforeHiddenMenu = TF.menuHelper.needHiddenOpenedMenu(e),
			cacheOperatorBeforeOpenMenu = TF.menuHelper.needOpenCurrentMenu(e);

		if (cacheOperatorBeforeHiddenMenu)
		{
			TF.menuHelper.hiddenMenu();
		}
		if (cacheOperatorBeforeOpenMenu)
		{
			self.isTemplateMenuOpened = true;
			var options = {
				gridType: self.gridType,
				defaultLayoutId: self.defaultLayoutId,
				defaultLayoutName: self.defaultLayoutName,
				stickyLayoutName: self.stickyLayoutName
			};

			if (isFromMoreButton)
			{
				if (TF.isPhoneDevice)
				{
					options.top = 0;
				}
				else
				{
					options.movingDistance = 0;
					options.top = 0 - target.outerHeight();
				}
			}
			else
			{
				options.movingDistance = target.outerWidth();
				options.top = -24;
			}

			var layoutMenu = new TF.DetailView.LayoutMenuViewModel(options, self);
			layoutMenu.loadingFinishEvent.subscribe(function()
			{
				var contextmenu = new TF.ContextMenu.TemplateContextMenu(
					"workspace/detailview/detailscreenlayoutcontextmenu",
					layoutMenu
				);

				layoutMenu.modifyItemEvent.subscribe(function(e, data)
				{
					data = data || {};
					self.applyLayoutTemplate(false, data.id, data.isDeleted, null, data.name).then(function()
					{
						self.updateDetailViewTitleWithDataPoint();
						self.setStackBlocks();
						self.updateNameContainer();
						if (!data.isDeleted)
						{
							self.toggleDataPointPanel(self.dataPointPanel);
						}
					});
				});

				layoutMenu.selectItemEvent.subscribe(function(e, id)
				{
					self.applyLayoutTemplate(true, id).then(function()
					{
						self.showDetailViewById(self.entitySelectId);
					});
				});
				if (self.isTemplateMenuOpened)
				{
					tf.pageManager.showContextMenu(e.currentTarget);
					tf.contextMenuManager.showMenu(e.currentTarget, contextmenu);
				}
				else
				{
					tf.contextMenuManager.dispose();
				}
			});
		}
	};

	/**
	* Toggle the Data Point Panel display status.
	* @param {Object} data The data object.
	* @return {void} 
	*/
	DetailViewViewModel.prototype.toggleDataPointPanel = function(data)
	{
		var self = this;
		if (self.dataPointPanel)
		{
			self.dataPointPanel.dispose();
			self.dataPointPanel = null;
		}
		self.dataPointPanel = data;
		self.dataPointPanel.onCloseDataPointPanelEvent.subscribe(function()
		{
			tf.pageManager.resizablePage.clearLeftOtherContent();
		});
		tf.pageManager.resizablePage.setLeftPage("workspace/detailview/DataPointPanel", self.dataPointPanel);
		self.grid.setRemovingBound();
	};

	/**
	 * @param {*} model
	 * @param {*} e
	 */
	DetailViewViewModel.prototype.showSlider = function(model, e)
	{
		var self = this;
		self.obShowSlider(true);
		$('.slider-container').position({ my: 'right+70 top+30', at: 'bottom center', of: e.target });
		if ($('.detial-view-overlay').length === 0)
		{
			var $overlay = $("<div></div>", { class: "detial-view-overlay" });
			$overlay.append($("<div></div>", { class: "detial-view-background" }));
			$('body').append($overlay);
		}
	}

	/**
	 * Merge style settings of the data block.
	 * @param {JQuery} $item
	* @return {Object}
	 */
	DetailViewViewModel.prototype.getDataBlockStyles = function(item)
	{
		var self = this, idx, condition,
			userSetting = item.appearance || {},
			conditionSetting = item.conditionalAppearance || [],
			styles = {
				backgroundColor: null,
				titleColor: null,
				contentColor: null,
				borderColor: null
			};

		if (userSetting)
		{
			styles = $.extend(styles, userSetting);
		}

		if (self.isReadMode())
		{
			for (idx = conditionSetting.length; idx > 0; idx--)
			{
				condition = conditionSetting[idx - 1];
				if (self.checkConditionMatch(condition))
				{
					styles.backgroundColor = condition.backgroundColor;
					styles.titleColor = condition.titleColor;
					styles.contentColor = condition.contentColor;
					styles.borderColor = condition.borderColor;
				}
			}
		}

		return styles;
	};

	/**
	 * Check if the record match with the condition.
	* @param {Object} condition
	 */
	DetailViewViewModel.prototype.checkConditionMatch = function(condition)
	{
		var self = this,
			entity = self.entity,
			entityFieldValue = entity[condition.field] || '',
			conditionType = condition.type.toLowerCase(),
			conditionValue = condition.value,
			conditionOperator = condition.operator.name;

		switch (conditionType)
		{
			case "string":
				entityFieldValue = entityFieldValue.toLowerCase();
				conditionValue = conditionValue.toLowerCase();
				return self.compareTwoValues([entityFieldValue, conditionValue], conditionOperator);
			case "number":
				return self.compareTwoValues([self.formatDataContent(entityFieldValue, "Number", condition.format), conditionValue], conditionOperator);
			case "time":
			case "date":
				var dataTime = moment(entityFieldValue),
					beforeTime = moment(conditionValue),
					afterTime = moment(condition.extraValue);
				if (conditionType === "time")
				{
					var year = dataTime.year(), month = dataTime.month(), date = dataTime.date();
					beforeTime.year(year).month(month).date(date);
					afterTime.year(year).month(month).date(date);
				}
				return self.compareTwoValues([dataTime, beforeTime, afterTime], conditionOperator);
			case "boolean":
				return entityFieldValue == conditionValue;
			default:
				return false;
		}
	};

	/**
	 * Compare values with specified operator.
	 * @param {Array} values
	 * @param {String} operator
	 * @return {Boolean}
	 */
	DetailViewViewModel.prototype.compareTwoValues = function(values, operator)
	{
		switch (operator)
		{
			case "EqualTo":
				return values[0] === values[1];
			case "NotEqualTo":
				return values[0] !== values[1];
			case "Empty":
				return !values[0];
			case "NotEmpty":
				return !!values[0];
			case "LessThan":
				return values[0] < values[1];
			case "LessThanOrEqualTo":
				return values[0] <= values[1];
			case "GreaterThan":
				return values[0] > values[1];
			case "GreaterThanOrEqualTo":
				return values[0] >= values[1];
			case "Contains":
				return values[0].indexOf(values[1]) !== -1;
			case "DoesNotContain":
				return values[0].indexOf(values[1]) === -1;
			case "StartsWith":
				return values[0].startsWith(values[1]);
			case "EndsWith":
				return values[0].endsWith(values[1]);
			case "On":
				return values[0].isValid() && values[0].isSame(values[1]);
			case "NotOn":
				return values[0].isValid() && !values[0].isSame(values[1]);
			case "Before":
				return values[0].isValid() && values[0].isBefore(values[1]);
			case "OnOrBefore":
				return values[0].isValid() && !values[0].isAfter(values[1]);
			case "After":
				return values[0].isValid() && values[0].isAfter(values[1]);
			case "OnOrAfter":
				return values[0].isValid() && !values[0].isBefore(values[1]);
			case "Between":
				return values[0].isValid() && !values[0].isBefore(values[1]) && !values[0].isAfter(values[2]);
			default:
				return false;
		}
	};

	/**
	 * Update the header display.
	 * @return {void}
	 */
	DetailViewViewModel.prototype.updateDetailViewPanelHeader = function()
	{
		var self = this;
		if (self.$element && self.$element.css("display") !== "none" && self.isReadMode())
		{
			var isWidthEnough,
				$header = self.$element.find(".detail-header"),
				$title = $header.find(".head-text:not(.hide)"),
				$buttons = $header.find(".buttons");


			$header.addClass("width-enough");
			$buttons.css("width", "auto");
			if (window.opener && window.name.indexOf("new-detailWindow") >= 0)
			{
				var $selectorMenu = $header.find(".selector-menu");
				$selectorMenu.css("width", "calc(100% - 80px)");
			}
			$title.css("width", "auto");
			isWidthEnough = self.$element.outerWidth() - 32 > $title.outerWidth() + $buttons.outerWidth();

			$buttons.css("width", "");
			$title.css("width", "");
			$header.toggleClass("width-enough", isWidthEnough);
		}
	};

	/**
	 * The event handler when "more" button is clicked.
	* @param {Object} data
	 * @param {Event} e
	 * @return {void}
	 */
	DetailViewViewModel.prototype.onHeaderMoreButtonClick = function(data, e)
	{
		$(e.target).closest(".group-buttons").toggleClass("open");
	};

	/**
	 * The new Window function.
	* @param {Object} data
	 * @param {Event} e
	 * @return {void}
	 */
	DetailViewViewModel.prototype.newWindowClick = function(data, e)
	{
		var self = this;
		window.open("#/?id=" + data.entitySelectId, "new-detailWindow_" + $.now());
	};

	/**
	 * The close detail function.
	 * @return {void}
	 */
	DetailViewViewModel.prototype.closeDetailClick = function(data, e)
	{
		var self = this;
		self.onCloseDetailEvent.notify();
	};

	/**
	 * The close edit detail model function.
	 * @return {void}
	 */
	DetailViewViewModel.prototype.closeEditMode = function()
	{
		var self = this;
		self.checkLayoutChange();
	};

	/**
	 * The print function.
		 * @param {Object} data
	 * @param {Event} e
	 * @return {void}
	 */
	DetailViewViewModel.prototype.printClick = function(data, e)
	{
		var self = this, printSettingsModal = new TF.Modal.PrintSettingsModalViewModel(),
			printHelper, $detailView, pageWidth, resizablePanel, oldDetailViewWidth, totalWidth;

		tf.modalManager.showModal(printSettingsModal).then(function(result)
		{
			if (!result) return;

			printHelper = new TF.DetailView.PrintHelper();
			$detailView = $(e.target).closest('.detail-view-panel');
			oldDetailViewWidth = $detailView.width();
			pageWidth = printSettingsModal.model.getPageWidth();
			resizablePanel = tf.pageManager.resizablePage;
			totalWidth = resizablePanel.$element.outerWidth();
			resizablePanel.resize(totalWidth - pageWidth);

			printHelper.print($detailView, printSettingsModal.model.obSelectedOrientation()).then(function(result)
			{
				ga('send', 'event', 'Action', 'Print Details');
				resizablePanel.resize(totalWidth - oldDetailViewWidth);
			});
		});
	};

	/**
	 * Update the width of the input.
	 */
	DetailViewViewModel.prototype.updateSectionHeaderTextInputWidth = function()
	{
		var self = this,
			sectionHeaders = $(".grid-stack .section-header-stack-item");
		self.adjustFontSize(self.obSliderFontRate());

		$.each(sectionHeaders, function(index, item)
		{
			var $item = $(item),
				$div = $item.find("div.item-title-ruler"),
				$input = $item.find("input.item-title"),
				content = $input.val().toUpperCase(),
				width = Math.min($div.text(content).css("display", "inline").outerWidth(), $item.outerWidth() * 2 / 3) + 1;

			$item.attr("title", content);
			$input.width(width);
			$div.css("display", "none");
		});
	};

	/**
	 * 
	 * @param {*} gridType 
	 */
	DetailViewViewModel.prototype.getDefaultRecordPicture = function(gridType)
	{
		if (gridType === "student" || gridType === "staff")
		{
			return "global/Img/detail-screen/staff-student.svg";
		}
		else if (gridType === "vehicle")
		{
			return "global/Img/detail-screen/vehicle.svg";
		}
		else
		{
			return null;
		}
	};

	/**
	  * The dispose function.
	* @returns {void}
	  */
	DetailViewViewModel.prototype.dispose = function()
	{
		var self = this, calendar;
		$("body").off("mousedown.detailViewPanelSubTitle");
		$("body").off("mousedown.detailViewPanelSave");
		$(document).off(".rightClickMenu");
		$(document).off(".slider");
		$(document).off(".sectionheader");
		$(window).off(".managelayout");
		for (var i in self.allCalendars)
		{
			calendar = self.allCalendars[i].data("kendoCalendar");
			if (calendar)
			{
				calendar.destroy();
			}
		}
		tf.pageManager.resizablePage.onSizeChanged.unsubscribe(self.manageLayout);
		self.onCloseDetailEvent.unsubscribeAll();
		self.onToggleDataPointPanelEvent.unsubscribeAll();
		self.onClosePanelEvent.unsubscribeAll();
		self.onCloseEditMode.unsubscribeAll();
		self.dataPointPanel.dispose();
		self.dataPointGroupHelper.dispose();
		self.lineBlockHelper.dispose();
		self.deleteDataBlockEvent.unsubscribeAll();
		self.groupDataBlockEvent.unsubscribeAll();
		self.changeDataPointEvent.unsubscribeAll();
		self.$element.find(".grid-stack .section-header-stack-item > input.item-title").off("blur.section-header");
		self.grid.container.off(".gridStack");
		self.$gridStack.off(".gridStack");
		if (self.$gridStack.data('gridstack'))
		{
			self.$gridStack.data('gridstack').destroy();
		}
		self.$columnPopup.find(".column-container").off(".changeColumn");
		self.$columnPopup.remove();

		self._disposed = true;
	};
}());
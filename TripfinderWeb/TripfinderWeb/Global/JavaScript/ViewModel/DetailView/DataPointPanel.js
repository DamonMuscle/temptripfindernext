(function()
{
	createNamespace("TF.DetailView").DataPointPanel = DataPointPanel;

	/**
	 * Constructor
	 * @returns {void} 
	 */
	function DataPointPanel(detailView)
	{
		var self = this;
		self.detailView = detailView;
		self.gridType = self.detailView.gridType;
		self.dataTypeName = tf.dataTypeHelper.getFormalDataTypeName(self.gridType);
		self.groups = [];
		self.gridOpt = null;
		self.isElementWithinRightPanel = false;
		self.$filterText = null;
		self.$filterBar = null;
		self.deferFilterTimeout = null;
		self.allColumns = [];

		//observable
		self.obGridWidth = ko.observable();
		self.pageTitle = ko.observable(getTitleByType(self.gridType));
		self.obColumns = ko.observableArray([]);
		self.obAllColumns = ko.observableArray([]);
		self.currentGroup = ko.observable(null);
		self.currentGroupId = -1;

		self.tooltip = new TF.Helper.TFTooltip();
		self.userDefinedFieldHelper = new TF.DetailView.UserDefinedFieldHelper();

		//Events
		self.closeClick = self.closeClick.bind(self);
		self.initDataPoint = self.initDataPoint.bind(self);
		self.onDataGroupMouseDown = self.onDataGroupMouseDown.bind(self);
		self.openGroupMenu = self.openGroupMenu.bind(self);
		self.deleteGroup = self.deleteGroup.bind(self);
		self.clearFilterClick = self.clearFilterClick.bind(self);
		self.onCloseDataPointPanelEvent = new TF.Events.Event();
		self.detailView.onColumnChangedEvent.subscribe(self.detailViewColumnChanged.bind(self));
		self.updateDataPoints();

		self.obFilterPlaceHolderText = ko.observable("Filter Data Blocks...");
	}

	/**
	 * Initialize.
	 * @param {object} current view model
	 * @param {dom} element
	 * @returns {void} 
	 */
	DataPointPanel.prototype.init = function(model, element)
	{
		var self = this;
		self.$element = $(element);
		self.$preload = self.$element.find(".preload");
		self.$filterBar = self.$element.find(".filter-bar");
		self.$filterText = self.$element.find(".filter-text");
		self.gridOpt = self.detailView.$element.find(".right-container>.grid-stack").data("gridstack").opts;
		self.obGridWidth(self.gridOpt.width);

		self.initToolTip();
		self.initCalendar();
		self.initNonDataElements();
		self.initFilterText();
	};

	/**
	 * Initialize calendar.
	 * @return {void}
	 */
	DataPointPanel.prototype.initCalendar = function()
	{
		var self = this;

		if (!!self.$calendar)
		{
			return;
		}

		var calendarTypes = ["district", "school", "trip"];
		if (calendarTypes.indexOf(self.gridType) > -1)
		{
			self.$calendar = self.$preload.find(".calendar-dom");
			self.$calendar.find(".calendar").kendoCalendar({
				month: {
					content: '<div class="date-text">#= data.value #</div><div class="events-group"><div class="events-point"></div></div>'
				},
				width: "100%",
				height: "100%",
				value: new Date()
			});
		}
	};

	DataPointPanel.prototype.initToolTip = function()
	{
		var self = this;
		self.$element.closest('.data-points-panel').find('.non-date-element-container > div').each(function(index, element)
		{
			var options = {
				placement: "left"
			};
			if ($(element).hasClass('image'))
			{
				options.title = "Image";
			} else if ($(element).hasClass("spacer"))
			{
				options.title = "Spacer";
			} else if ($(element).hasClass("vertical-line"))
			{
				options.title = "Vertical Line";
			} else if ($(element).hasClass("horizontal-line"))
			{
				options.title = "Horizontal Line";
			} else if ($(element).hasClass("tab"))
			{
				options.title = "Tab";
			} else
			{
				options.title = "Section Header";
			}

			self.tooltip.init($(element), options);
		});
	}

	//#region Data Point Filter

	DataPointPanel.prototype.initFilterText = function()
	{
		var self = this;
		$("body").on("mousedown", function(e)
		{
			var $target = $(e.target);

			if ($target.closest(".filter-bar.active").length <= 0 &&
				!$target.hasClass("filter-text"))
			{
				self.isMouseDownInFilterZone = false;
				self.$filterText.blur();
				if (self.$filterText.val().trim() === "")
				{
					self.$filterBar.removeClass('active');
				}
			} else
			{
				self.isMouseDownInFilterZone = true;
			}
		});

		$("body").on("mouseup", function(e)
		{
			self.isMouseDownInFilterZone = false;
		});

		self.$filterText.on("focus", function(e)
		{
			self.$filterBar.addClass('active');
		});

		self.$filterText.on("blur", function(evt)
		{
			if (!self.isMouseDownInFilterZone && !self.loseFocusOnWindow)
			{
				self.clearFocusTimeout = setTimeout(function()
				{
					self.loseFocusOnWindow = true;
					self.$filterText.blur();
					self.loseFocusOnWindow = false;
				}, 200);
			}
			evt.stopPropagation();
		});
		self.$filterText.on("keydown", self.inputKeyDown.bind(self));
		self.$filterText.on("input", self.inputFilterText.bind(self));
	};

	DataPointPanel.prototype.inputKeyDown = function(e)
	{
		var self = this,
			text = self.$filterText.val().trim();

		switch (e.keyCode)
		{
			case $.ui.keyCode.ENTER:
				self.filter(text);
				break;
			case $.ui.keyCode.ESCAPE:
				e.preventDefault();
				e.stopPropagation();
				self.clearText();
				break;
			default:
				break;
		}
	}

	DataPointPanel.prototype.inputFilterText = function()
	{
		var self = this,
			text = self.$filterText.val();

		if (self.deferFilterTimeout)
		{
			clearTimeout(self.deferFilterTimeout);
		}

		self.deferFilterTimeout = setTimeout(function()
		{
			self.filter(text);
		}, 500);
	}

	DataPointPanel.prototype.filter = function(text)
	{
		var self = this,
			text = text.trim().toUpperCase(),
			isGroupItemMatched = function(groupItem)
			{
				return groupItem.items.filter(function(point)
				{
					return self.getGroupMenuTitle(point).toUpperCase().indexOf(text) > -1
				}).length > 0
			};

		if (text.length === 0)
		{
			self.obColumns(self.allColumns);
			return;
		}

		self.obColumns(self.allColumns.reduce(function(accumulator, item)
		{
			if (item.title.toUpperCase().indexOf(text) > -1)
			{
				accumulator.push({
					title: item.title,
					columns: ko.observableArray(item.columns())
				})
			} else
			{
				var matchedItems = item.columns().reduce(function(commonAccumulator, dataPoint)
				{
					if (dataPoint.title.toUpperCase().indexOf(text) > -1 ||
						(item.title === "Groups" ? isGroupItemMatched(dataPoint) : false))
					{
						commonAccumulator.push(dataPoint);
					}

					return commonAccumulator;
				}, [])

				if (matchedItems.length > 0)
				{
					accumulator.push({
						title: item.title,
						columns: ko.observableArray(matchedItems)
					});
				}
			}
			return accumulator;
		}, []));
	}

	DataPointPanel.prototype.clearFilterClick = function(model, e)
	{
		this.clearText();
		e.stopPropagation();
	};

	/**
	 * Clear the text when there is any, collapse the filter when there is no text.
	 * @returns {void} 
	 */
	DataPointPanel.prototype.clearText = function()
	{
		var self = this,
			currentText = self.$filterText.val().trim();
		if (currentText === "")
		{
			self.$filterBar.removeClass('active');
		}
		else
		{
			clearTimeout(self.deferFilterTimeout);
			self.$filterText.val("");
			self.filter("");
			self.$filterText.focus();
			clearTimeout(self.clearFocusTimeout);
		}
	};

	//#endregion

	DataPointPanel.prototype.startGroup = function()
	{
		this.$element.addClass("group-mode");
	};

	DataPointPanel.prototype.stopGroup = function()
	{
		this.$element.removeClass("group-mode");
	};

	DataPointPanel.prototype.deleteGroup = function(view, e)
	{
		return tf.promiseBootbox.yesNo("Are you sure you would like to delete this group?", "Confirmation Message").then(function(ans)
		{
			view.currentGroup(null);
			if (ans && view && view.currentGroupId >= 0)
			{
				return tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "datapointgroups"), {
					data: [view.currentGroupId]
				}).then(function()
				{
					view.refreshData();
				});
			}
		});
	}

	DataPointPanel.prototype.onDataGroupMouseDown = function(group, e)
	{
		var self = this;
		if (e.which === 3)
		{
			self.openGroupMenu(group, e);
			e.stopPropagation();
		}
	};

	DataPointPanel.prototype.openGroupMenu = function(group, e)
	{
		var self = this,
			$target = $(e.target),
			$container, $arrow, $menu, left, groupItems, moveToLeftOffset = 0,
			detailViewWidth = self.detailView.getActiveGridStack().getCurrentWidth();
		if (!group || group.type !== "group")
		{
			return;
		}
		groupItems = $.map(group.items, function(item)
		{
			item.disable = detailViewWidth < item.w;
			return item;
		});

		self.currentGroupId = group.id;
		self.currentGroup({
			id: group.id,
			title: group.title,
			items: ko.observableArray(groupItems)
		});

		setTimeout(function()
		{
			$arrow = $target.closest(".data-point-item").find(".folder");
			$container = self.$element.find(".group-context-menu-container");
			$menu = self.$element.find(".group-context-menu");
			left = $arrow.offset().left - $(".navigation-container").outerWidth() - $container.outerWidth() / 2 + 6;
			moveToLeftOffset = left + $container.outerWidth() - self.$element.closest(".data-points-panel").outerWidth();
			if (moveToLeftOffset > 0)
			{
				left -= moveToLeftOffset;
			}
			self.$element.find(".group-context-menu").css({
				height: $container.outerHeight(),
				width: $container.outerWidth(),
				top: ($arrow.offset().top + $arrow.height() + 6) + "px",
				left: left < 0 ? 0 : left + "px"
			});
			$menu.find(".up-arrow").css("left", ($container.outerWidth() / 2 - 5 + (left < 0 ? left : 0) + (moveToLeftOffset > 0 ? moveToLeftOffset : 0)) + "px");

			self.initDataPoint(null, null, $container.find(".data-point-item"));

			$(document).off(".groupmenu").on("mousedown.groupmenu", function(e)
			{
				if ($(e.target).closest(".group-context-menu").length <= 0)
				{
					self.currentGroup(null);
				}
			});
		})
	};

	DataPointPanel.prototype.getGroupMenuTitle = function(data)
	{
		if (data['title']) return data['title'];

		switch (data['type'])
		{
			case 'spacer':
				return 'Spacer';
			case 'section-header':
				return 'Section Header';
			case 'image':
				return 'Image';
			case 'tab':
				return 'Tab';
		}

		return '';
	};

	DataPointPanel.prototype.updateDataPoints = function()
	{
		var self = this,
			dataPointGroup,
			requiredFields = tf.helpers.detailViewHelper.getRequiredFields(self.gridType),
			dataTypeName = tf.dataTypeHelper.getFormalDataTypeName(self.gridType),
			dataTypeId = tf.dataTypeHelper.getId(self.gridType),
			dataPointsForCurrentPage = dataPointsJSON[self.gridType];

		self.pageTitle(tf.applicationTerm.getApplicationTermPluralByName(dataTypeName).toUpperCase());

		return Promise.all([
			self.userDefinedFieldHelper.get(self.gridType),
			tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "datapointgroups"), {
				paramData: {
					DataTypeId: dataTypeId
				}
			})]).then(function(values)
			{
				var udfResult = values[0];

				self.groups.length = 0;
				self.allColumns.length = 0;

				if (udfResult)
				{
					dataPointsForCurrentPage["User Defined"] = udfResult.filter(function(i)
					{
						return !!i;
					});
				}

				Object.keys(dataPointsForCurrentPage).forEach(function(key)
				{
					self.allColumns.push({
						title: key,
						columns: ko.observableArray(dataPointsForCurrentPage[key].map(column =>
						{
							var c = { ...column };
							if (requiredFields.some(r => (r.udfId === c.UDFId && r.udfId > 0) || r.field === c.field))
							{
								c.isRequired = true;
							}
							return c;
						}))
					})
				});

				var result = values[1].Items;
				if (result && result.length > 0)
				{
					$.each(result, function(_, group)
					{
						dataPointGroup = {};
						dataPointGroup.id = group.ID;
						dataPointGroup.title = group.Name;
						dataPointGroup.type = "group";
						dataPointGroup.items = (JSON.parse(group.DataPoints) || []).map(function(i)
						{
							return tf.helpers.detailViewHelper.decompressDataBlockDescriptor(i, self.gridType);
						});
						dataPointGroup.hasTabBlock = dataPointGroup.items.some(function(value)
						{
							return value.type == "tab";
						});
						self.groups.push(dataPointGroup);
					});
					self.allColumns.unshift({
						title: "Groups",
						columns: ko.observableArray(self.groups)
					});
				}

				self.obColumns(self.allColumns);
				self.obAllColumns(self.allColumns);
				self.detailViewColumnChanged();
			});
	};

	DataPointPanel.prototype.getMinHeight = function($data)
	{
		var minY = Number.MAX_VALUE,
			maxY = 0;

		if ($data.type === "group")
		{
			$.each($data.items, function(index, item)
			{
				if (item.type === 'section-header')
				{
					item.h = 1;
				}
				minY = Math.min(minY, item.y);
				maxY = Math.max(maxY, item.y + item.h);
			});
			return maxY - minY;
		}
		else
		{
			return $data["min-height"];
		}
	};

	DataPointPanel.prototype.getMinWidth = function($data)
	{
		var self = this,
			minX = Number.MAX_VALUE,
			maxX = 0;

		if ($data.type === "group")
		{
			let gridstack = self.detailView.$element.find(".grid-stack").data("gridstack");
			$.each($data.items, function(index, item)
			{
				if (item.type === 'section-header')
				{
					item.x = 0;
					item.w = gridstack.grid.width;
				}
				if (minX > item.x)
				{
					minX = item.x;
				}
				if (maxX < item.x + item.w)
				{
					maxX = item.x + item.w;
				}
			});
			return maxX - minX;
		}
		else if ($data.type === "Schedule")
		{
			return self.getScheduleMinWidth();
		}
		else
		{
			return $data["min-width"];
		}
	};

	DataPointPanel.prototype.getScheduleMinWidth = function()
	{
		var containerWidth = this.detailView.getActiveGridStack().getCurrentWidth();
		switch (containerWidth)
		{
			case 2:
			case 3:
				return 2;
			case 4:
				return 3;
			default:
				return 1;
		}
	};

	DataPointPanel.prototype.detailViewColumnChanged = function(e, width)
	{
		var self = this,
			block, blocks;
		if (!self.$element)
		{
			return;
		}
		width ? width : width = self.detailView.rootGridStack.getCurrentWidth();
		blocks = self.$element.find(".category .data-point-item");
		if (blocks.length > 0)
		{
			blocks.removeClass("disable");
			$.each(blocks, function(index, item)
			{
				var $item = $(item);
				block = ko.dataFor(item);
				$item.attr('title', block.title);
				if (self.$element.find('.tab-enabled').length > 0 && block.hasTabBlock)
				{
					$item.addClass("disable");
					$item.attr('title', 'Data group with tab(s) cannot be dragged into a tab.');
					return;
				}
				if (width < self.getMinWidth(block))
				{
					$item.attr('title', 'Not enough width for ' + block.title)
					$item.addClass("disable");
				}
			});
		}
	};

	DataPointPanel.prototype.getDragHtmlForGroup = function($target, isGroupItem)
	{
		var self = this,
			group = ko.dataFor($target[0]),
			singleCellHeight = 58,
			padding = 8,
			width, height, items,
			$grid = self.detailView.$element.find(".grid-stack"),
			gridstack = $grid.data("gridstack"),
			blockWidth = ($grid.outerWidth() / gridstack.grid.width) - 8,
			container, grid,
			lightGridStack = self.detailView.getActiveGridStack();

		if (isGroupItem)
		{
			items = [group];
			width = group.w;
			height = group.h;
		} else
		{
			items = group.items;
			width = self.getMinWidth(group);
			height = self.getMinHeight(group);
		}

		container = $("<div class='in grid-stack hide' style='width:" + (blockWidth * width + (width - 1) * padding - 4) + "px;height:" + (singleCellHeight * height - padding) + "px'></div>");

		grid = container.gridstack().data('gridstack');
		grid.cellHeight(singleCellHeight);
		grid.verticalMargin(1);
		grid.setGridWidth(width);
		$.each(items, function(index, item)
		{
			var content = item.defaultValue,
				block = lightGridStack.generateDataBlock(item, content),
				options = block.options;
			grid.addWidget(block.$el,
				options.x, options.y, options.w, options.h,
				options.autoPosition, options.minWidth, options.maxWidth, options.minHeight, options.maxHeight);
		});
		grid.setStatic(true);
		return container;
	};

	/** 
	 * Initialize the non-date element.
	 * @return {void} 
	 */
	DataPointPanel.prototype.initNonDataElements = function()
	{
		var self = this,
			$nonDataElements = self.$element.find(".right > .data-point-item:not(.ui-draggable)");

		$nonDataElements.draggable({
			containment: "#pageContent",
			appendTo: "body",
			scroll: false,
			cursorAt: {
				top: 0,
				left: 0
			},
			helper: self.nonDataElementDraggableHelper.bind(self),
			drag: self.onNonDataElementDragging.bind(self),
			start: self.onNonDataElementDragStart.bind(self),
			stop: self.onNonDataElementDragStop.bind(self)
		});
	};

	/**
	 * The helper function for draggable non-data elements.
	 * @param {Event} evt 
	 * @return {String}
	 */
	DataPointPanel.prototype.nonDataElementDraggableHelper = function(evt)
	{
		var self = this,
			borderWidth = 2,
			$target = $(evt.target),
			typeName = $target.attr("type"),
			cssStyles = self.getNonDataElementStyles(typeName),
			width = cssStyles.width + borderWidth,
			height = cssStyles.height + borderWidth;

		return "<div class=\"element-overlay " + typeName + "\" type=\"" + typeName + "\" style=\"width:" + width + "px;height:" + height + "px;\">\
					<div class=\"in hide\" style=\"width:" + width + "px;height:" + height + "px;\"></div>\
					<div class=\"out\"></div>\
				</div>";
	};

	/**
	 * The event handler when the drag of non-data element starts.
	 * @param {Event} evt 
	 * @return {void}
	 */
	DataPointPanel.prototype.onNonDataElementDragStart = function(evt)
	{
		var self = this,
			data = {
				x: -1,
				y: -1,
				width: 0,
				height: 0
			},
			$indicator = $(".element-indicator"),
			gridstack = self.detailView.getActiveGridStack(),
			gridOpt = gridstack.getOptions();

		self.obGridWidth(gridOpt.width);
		$indicator.data("_gridstack_node", data);
		self.gridOpt = {
			cellWidth: gridstack.$wrapper.outerWidth() / gridOpt.width,
			cellHeight: gridOpt.cellHeight,
			horizontalMargin: gridOpt.horizontalMargin || 0,
			verticalMargin: gridOpt.verticalMargin || 0,
			stackList: gridstack.$wrapper.find(".grid-stack-item:not(.mock-item)"),
			boundingRect: gridstack.$wrapper[0].getBoundingClientRect(),
			indicator: $indicator
		};

		self.isElementWithinRightPanel = false;

		self.detailView.$element.closest(".detail-view-panel").addClass("on-dragging");
	};

	/**
	 * The event handler when the drag of non-data element stops.
	 * @param {Event} evt 
	 * @return {void}
	 */
	DataPointPanel.prototype.onNonDataElementDragStop = function(evt, ui)
	{
		var self = this,
			elementType = evt.target.getAttribute("type"),
			gridstack = self.detailView.getActiveGridStack();

		if (elementType === 'image')
		{
			if (self.isMouseWithinContainer(evt.clientX, evt.clientY, gridstack.$wrapper[0].getBoundingClientRect()))
			{
				setTimeout(function()
				{
					var $inputEle = _.last(gridstack.dataBlocks).$el.find("input[type=file]");
					$inputEle.trigger('click');
				}, 50);
			}
		} else if (elementType === "spacer" && self.$element.find(".non-date-element-container > .spacer").length === 0)
		{
			self.$element.find(".non-date-element-container > .vertical-line").insertAfter($("<div class=\"spacer data-point-item\" type=\"spacer\"></div>"));
		} else if (elementType === "section-header" && self.$element.find(".non-date-element-container > .section-header").length === 0)
		{
			self.$element.find(".non-date-element-container > .horizontal-line").insertBefore($("<div class=\"section-header data-point-item\" type=\"section-header\" data-bind=\"attr:{minWidth:obGridWidth}\"></div>"));
		}

		self.detailView.$element.closest(".detail-view-panel").removeClass("on-dragging");
		self.gridOpt.indicator = null;
	};

	/**
	 * The event handler when the drag of non-data element occurs.
	 * @param {Event} evt 
	 * @return {void}
	 */
	DataPointPanel.prototype.onNonDataElementDragging = function(evt)
	{
		var self = this,
			position,
			$el = $(".element-overlay"),
			rightPanelBoundingRect = self.detailView.$element.closest(".detail-view-panel")[0].getBoundingClientRect(),
			isWithinRightPanel = self.isMouseWithinContainer(evt.clientX, evt.clientY, rightPanelBoundingRect);

		if (isWithinRightPanel)
		{
			position = self.calculateNonDataElementPosition($el);
			if (!self.isElementWithinRightPanel)
			{
				self.switchNonDataElementDisplay($el, true);
			}
		} else if (self.isElementWithinRightPanel)
		{
			self.switchNonDataElementDisplay($el, false);
		}

		self.placeNonDataElementIndicator($el, position);
		self.isElementWithinRightPanel = isWithinRightPanel;
	};

	/**
	 * Place indicator for non-data element.
	 * @param {JQuery} $el  
	 * @return {void}
	 */
	DataPointPanel.prototype.placeNonDataElementIndicator = function($el, position)
	{
		var self = this;
		if (position && Array.isArray(position))
		{
			$.extend(self.gridOpt.indicator.data("_gridstack_node"), {
				x: position[1],
				y: position[0]
			});
			self.gridOpt.indicator.css({
				display: "block",
				top: position[0] * self.gridOpt.cellHeight,
				left: position[1] * self.gridOpt.cellWidth
			});
		} else
		{
			self.gridOpt.indicator.css("display", "none");
		}
	};

	/**
	 * Calculate the proper position for on-dragging non-data  
	 * @param {JQuery} $el
	 * @return {Array}
	 */
	DataPointPanel.prototype.calculateNonDataElementPosition = function($el)
	{
		var self = this,
			type = $el.attr("type"),
			gridStackBoundingRect = self.gridOpt.boundingRect,
			height = $el.outerHeight(),
			width = $el.outerWidth(),
			unitHeight = self.gridOpt.cellHeight,
			unitWidth = self.gridOpt.cellWidth,
			top = $el.offset().top - gridStackBoundingRect.top,
			left = $el.offset().left - gridStackBoundingRect.left,
			firstMidTop = Math.max(Math.floor(top / unitHeight + 0.5), 0),
			firstMidLeft = Math.max(Math.floor(left / unitWidth + 0.5), 0),
			height = Math.floor(height / unitHeight + 0.5),
			width = Math.floor(width / unitWidth + 0.5);

		while (!self.checkPositionAvailability(firstMidTop, firstMidLeft, height, width))
		{
			if (firstMidTop > 0)
			{
				firstMidTop -= 1;
			} else if (type === "vertical-line" && firstMidLeft > 0)
			{
				firstMidLeft -= 1;
			} else
			{
				break;
			}
		}

		return [firstMidTop, firstMidLeft];
	};

	/**
	 * Check if the position is occupied by grid stacks.
	 * @param {Number} x 
	 * @param {Number} y
	 * @param {Number} width
	 * @param {Number} height
	 * @return {Boolean}
	 */
	DataPointPanel.prototype.checkPositionAvailability = function(top, left, height, width)
	{
		var self = this,
			availability = true,
			hasSupport = false;

		$.each(self.gridOpt.stackList, function(index, item)
		{
			var stackData = $(item).data("_gridstack_node"),
				stackTop = stackData.y,
				stackLeft = stackData.x,
				stackBottom = stackTop + stackData.height,
				stackRight = stackLeft + stackData.width;

			if ((height === 0 && top > stackTop && top < stackBottom && left < stackRight && left + width > stackLeft) ||
				(width === 0 && left > stackLeft && left < stackRight && top < stackBottom && top + height > stackTop))
			{
				availability = false;
				return false;
			}

			if (!hasSupport && ((height === 0 && ((top === stackTop || top === stackBottom) && left < stackRight && left + width > stackLeft)) ||
				(width === 0 && ((left === stackLeft || left === stackRight) && top < stackBottom && top + height > stackTop))))
			{
				hasSupport = true;
			}
		});

		return hasSupport && availability;
	};

	/**
	 * Switch the display status of the non-data element.
	 * @param {JQuery} $el  
	 * @param {Boolean} flag 
	 * @return {void}
	 */
	DataPointPanel.prototype.switchNonDataElementDisplay = function($el, flag)
	{
		var self = this,
			duration = 250,
			$in = $el.find(".in"),
			$out = $el.find(".out"),
			inOffset = self.getOffset($in, $out),
			outOffset = self.getOffset($out, $in);

		if (flag)
		{
			self.animate($in, $out, inOffset, outOffset, duration);
		} else
		{
			self.animate($out, $in, outOffset, inOffset, duration);
		}
	};

	/** 
	 * Get the css style object for the non-data element.
	 * @param {String} type
	 * @return {Object}
	 */
	DataPointPanel.prototype.getNonDataElementStyles = function(type)
	{
		var self = this,
			width, height, horizontalMargin = 8,
			gridstack = self.detailView.getActiveGridStack(),
			containerWidth = gridstack.$wrapper.outerWidth(),
			unitWidth = containerWidth / gridstack.getCurrentWidth() - horizontalMargin,
			unitHeight = gridstack.getCellHeight() - horizontalMargin;

		switch (type)
		{
			case "section-header":
				width = containerWidth - horizontalMargin;
				height = unitHeight;
				break;
			case "horizontal-line":
				width = unitWidth;
				height = 0;
				break;
			case "vertical-line":
				width = 0;
				height = unitHeight;
				break;
			case "spacer":
				width = unitWidth;
				height = unitHeight;
				break;
			case "image":
				width = unitWidth;
				height = unitHeight * 2;
				break;
			case "tab":
				width = containerWidth - horizontalMargin;
				height = unitHeight * 2;
				break;
			default:
				break;
		}

		return {
			width: width,
			height: height
		};
	};

	/** 
	 * Refresh the data.
	 * @return {void}
	 */
	DataPointPanel.prototype.refreshData = function()
	{
		var self = this;
		self.obColumns([]);
		self.gridType = self.detailView.gridType;
		if (self.$element)
		{
			self.initCalendar();
		}
		return self.updateDataPoints();
	};

	DataPointPanel.prototype.initLines = function()
	{
		var self = this,
			HLine = self.$element.find(".right .horizontal-line"),
			VLine = self.$element.find(".right .vertical-line");

		HLine.draggable({
			containment: "#pageContent",
			appendTo: "body",
			scroll: false,
			cursorAt: {
				top: 0,
				left: 0
			},
			helper: function(e)
			{
				var borderWidth = 2,
					$target = $(e.target),
					typeName = $target.attr("type"),
					cssStyles = self.getNonDataElementStyles(typeName),
					width = cssStyles.width + borderWidth,
					height = cssStyles.height + borderWidth;

				return "<div class=\"element-overlay " + typeName + "\" type=\"" + typeName + "\" style=\"width:" + width + "px;height:" + height + "px;\">\
							<div class=\"out\"></div>\
						</div>";
			},
			drag: function(e, ui)
			{
				var lineBlockHelper = self.detailView.getActiveGridStack().lineBlockHelper;
				lineBlockHelper.hLineDraggingIn(ui.helper);
			},
			start: function()
			{
				var gridstack = self.detailView.getActiveGridStack();
				gridstack.$wrapper.find(">.line-container").addClass("drag-line");
			},
			stop: function()
			{
				var gridstack = self.detailView.getActiveGridStack();
				gridstack.$wrapper.find(">.line-container").removeClass("drag-line");
			}
		});

		VLine.draggable({
			containment: "#pageContent",
			appendTo: "body",
			scroll: false,
			cursorAt: {
				top: 0,
				left: 0
			},
			helper: function(e)
			{
				var borderWidth = 2,
					$target = $(e.target),
					typeName = $target.attr("type"),
					cssStyles = self.getNonDataElementStyles(typeName),
					width = cssStyles.width + borderWidth,
					height = cssStyles.height + borderWidth;

				return "<div class=\"element-overlay " + typeName + "\" type=\"" + typeName + "\" style=\"width:" + width + "px;height:" + height + "px;\">\
							<div class=\"out\"></div>\
						</div>";
			},
			drag: function(e, ui)
			{
				var lineBlockHelper = self.detailView.getActiveGridStack().lineBlockHelper;
				lineBlockHelper.vLineDraggingIn(ui.helper);
			},
			start: function()
			{
				var gridstack = self.detailView.getActiveGridStack();
				gridstack.$wrapper.find(">.line-container").addClass("drag-line");
			},
			stop: function()
			{
				var gridstack = self.detailView.getActiveGridStack();
				gridstack.$wrapper.find(">.line-container").removeClass("drag-line");
			}
		});
	}

	/**
	 * Initialize the data points.
	 * @return {void}
	 */
	DataPointPanel.prototype.initDataPoint = function(view, data, dataPoints)
	{
		var self = this,
			outOffset, inOffset, flag, duration = 250,
			dataPointItems = dataPoints || self.$element.find(".left .data-point-item:not(.disable)");

		dataPointItems.draggable({
			cancel: ".disable",
			start: function(e, ui) { },
			helper: function(e)
			{
				var gridstack = self.detailView.getActiveGridStack(),
					$target = $(e.target).closest(".data-point-item"),
					$targetCopy = $target.clone(),
					blockWidth = (gridstack.$wrapper.outerWidth() / gridstack.getCurrentWidth()) - 8,
					isGroupItem = $target.attr("isgroupitem"),
					isGroup = $target.attr("type") === "group",
					containerWidth, helper, groupHtml;

				$targetCopy.find("i.asterisk").remove();

				outOffset = null;
				inOffset = null;
				flag = "out";
				if (isGroup || isGroupItem)
				{
					groupHtml = self.getDragHtmlForGroup($target, isGroupItem);
				}

				var fieldName = $target.attr("field");
				if (fieldName === "Schedule")
				{
					blockWidth = self.getScheduleMinWidth() * blockWidth;
				}
				else if ($target.attr("minwidth"))
				{
					blockWidth = $target.attr("minwidth") * blockWidth;
				}

				containerWidth = Math.max($target.outerWidth(), isGroup ? groupHtml.width() - 4 : isGroupItem ? groupHtml.width() + 6 : blockWidth);
				helper = $("<div class='data-point' style='width:" + containerWidth + "px;'>\
								<div class='out' style='width:" + $target.outerWidth() + "px'>\
									<div class='grid-stack-item-title'>" + $targetCopy.text().toUpperCase() + "</div>\
								</div>\
							</div>");
				helper.append((isGroup || isGroupItem) ? groupHtml :
					$("<div class='in " + self.getDragStyle($target) + " hide " + (["grid", "treeList", "multipleGrid"].indexOf($target.attr("type")) >= 0 ? "grid" : "") + "' style='width:" + blockWidth + "px'>" + self.getDragInHtml($targetCopy) + "</div>"));
				return helper[0];
			},
			drag: function(e, ui)
			{
				var $in = ui.helper.find(".in"),
					$out = ui.helper.find(".out"),
					$item = $(e.target).closest(".data-point-item"),
					rectDetail = self.detailView.$element.closest(".detail-view-panel")[0].getBoundingClientRect(),
					isGroupItem = $item.attr("isgroupitem"),
					isGroup = $item.attr("type") === "group",
					minHeight;

				if (!isGroup && !isGroupItem)
				{
					minHeight = $item.attr("minheight");
				}

				outOffset = outOffset ? outOffset : self.getOffset($out, $in);
				inOffset = inOffset ? inOffset : self.getOffset($in, $out, minHeight);
				if (!isGroup && !isGroupItem)
				{
					$in.height(inOffset.height - 16);
				}
				if (self.isMouseWithinContainer(e.clientX, e.clientY, rectDetail))
				{
					if (flag === "out")
					{
						self.animate($in, $out, inOffset, outOffset, duration);
						flag = "in";
					}
				} else if (flag === "in")
				{
					self.animate($out, $in, outOffset, inOffset, duration);
					flag = "out";
				}
			},
			stop: function(e, ui)
			{
				var grid = ui.helper.find(".in.grid-stack"),
					gridstack;
				if (grid.length > 0)
				{
					gridstack = grid.data("gridstack");
					if (gridstack)
					{
						gridstack.destroy();
					}
				}
				self.currentGroup(null);
			},
			containment: "#pageContent",
			appendTo: "body",
			scroll: false
		});
		self.detailViewColumnChanged();
		self.initLines();
	}

	/**
	 * Check if the mouse is within the container.
	 * @param {Number} x 
	 * @param {Number} y 
	 * @param {Object} rect 
	 * @return {Boolean}
	 */
	DataPointPanel.prototype.isMouseWithinContainer = function(x, y, rect)
	{
		return x > rect.left && x < rect.right && y < rect.bottom && y > rect.top;
	};

	/**
	 * Execute the drag in/out animation.
	 * @param {JQuery} $show  
	 * @param {JQuery} $hide
	 * @param {Object} showOffset 
	 * @param {Object} hideOffset
	 * @param {Number} duration 
	 * @return {void}
	 */
	DataPointPanel.prototype.animate = function($show, $hide, showOffset, hideOffset, duration)
	{
		$show.children().hide();
		$hide.animate(showOffset, {
			duration: duration,
			queue: false,
			done: function()
			{
				$show.removeClass("hide");
				$hide.addClass("hide");
				$hide.css(hideOffset);
				$show.children().fadeIn(duration);
				if ($show.hasClass("in").length > 0)
				{
					var grids = $show.find(".kendo-grid");
					if (grids.length > 0)
					{
						$.each(grids, function(index, grid)
						{
							var kendoGrid = grid.data("kendoGrid");
							if (kendoGrid)
							{
								kendoGrid.refresh();
							}
						});
					}
				}
			}
		});
		$hide.children().fadeOut(duration);
	};

	/**
	 * Get the drag style.
	 * @param {JQuery} $target
	 * @return {String}  
	 */
	DataPointPanel.prototype.getDragStyle = function($target)
	{
		var className = "";
		switch ($target.attr("type"))
		{
			case "Boolean":
				className = "boolean-stack-item";
				break;
		}
		return className;
	};

	/**
	 * Get the offset.
	 * @param {JQuery} $show
	 * @param {JQuery} $hide
	 * @return {Object}
	 */
	DataPointPanel.prototype.getOffset = function($show, $hide, minHeight)
	{
		var offset, height, singleBlockHeight = 58,
			gap = 1,
			padding = 8;
		if ($show.hasClass("hide"))
		{
			if (minHeight)
			{
				height = minHeight * singleBlockHeight - padding + (minHeight * gap - 1);
			}
			$show.removeClass("hide");
			$hide.addClass("hide");
			offset = {
				width: $show.outerWidth(),
				height: height || $show.outerHeight()
			};
			$hide.removeClass("hide");
			$show.addClass("hide");
		} else
		{
			offset = {
				width: $show.outerWidth(),
				height: $show.outerHeight()
			};
		}
		return offset;
	};

	/**
	 * Get the drag-in element html.
	 * @param {JQuery} $target
	 * @return {String}  
	 */
	DataPointPanel.prototype.getDragInHtml = function($target)
	{
		var self = this,
			format, defaultValue, html = "",
			type = $target.attr("type");

		switch (type)
		{
			case "Calendar":
				html = self.$calendar.html();
				break;
			case "Boolean":
				html = `<div class='item-content'>${$target.attr("displayValue")}</div>`;
				break;
			case "treeList":
			case "multipleGrid":
			case "grid":
				html = `<div class='grid-stack-item-title'>${$target.text().toUpperCase()}</div>
						<div class='grid-stack-item-content'></div>`;
				break;
			case "RecordPicture":
				html = "<div class='record-image'></div>";
				break;
			case "address":
				var field = $target.attr("field"),
					data = self.getDataPointByField(field),
					contentHtml = tf.helpers.detailViewHelper.renderSpecialDefaultContent(data.defaultValue, type);
				html = `<div class='grid-stack-item-title'>${$target.text().toUpperCase()}</div>
						<div class='grid-stack-item-content address-stack-item'>
							<div class='item-content address-content temp-edit'>
								<div class='address-content'>${contentHtml.html()}</div>
							</div>\
						</div>`;
				break;
			default:
				format = $target.attr("format");
				defaultValue = $target.attr("defaultValue");

				if (type === "Date")
				{
					defaultValue = moment(defaultValue).format("YYYY-MM-DD");
				}
				if (format === "Time")
				{
					var start = new Date();
					start.setHours(0, 0, defaultValue, 0);
					defaultValue = moment(start).format("HH:mm:ss");
				} else if (format === "Money")
				{
					defaultValue = "$" + parseFloat(defaultValue).toFixed(2);
				}
				html = "<div class='grid-stack-item-title'>" + $target.text().toUpperCase() + "</div>" +
					"<div class='grid-stack-item-content'>" + defaultValue + "</div>";
				break;
		}
		return html;
	};

	/**
	 * Close this panel.
	 * @return {void}
	 */
	DataPointPanel.prototype.closeClick = function()
	{
		var self = this;
		self.onCloseDataPointPanelEvent.notify();
	};

	DataPointPanel.prototype.getDataPointByField = function(fieldName, dataPointType)
	{
		var self = this, dataPoint,
			dataPointType = dataPointType || "DEFAULT";

		switch (dataPointType)
		{
			case "DEFAULT":
				for (var key in self.allColumns)
				{
					var columnList = self.allColumns[key].columns();
					$.each(columnList, (_, column) =>
					{
						if (column.field === fieldName)
						{
							dataPoint = column;
							return false;
						}
					});

					if (dataPoint) { break; }
				}
				break;
			default:
				break;
		}

		return dataPoint;
	};

	/**
	 * The dispose function.
	 * @returns {void} 
	 */
	DataPointPanel.prototype.dispose = function()
	{
		var self = this,
			kendoCalendar;
		self.onCloseDataPointPanelEvent.unsubscribeAll();
		if (self.$calendar)
		{
			kendoCalendar = self.$calendar.find(".calendar").data("kendoCalendar");
			if (kendoCalendar)
			{
				kendoCalendar.destroy();
			}
		}
	};
}());
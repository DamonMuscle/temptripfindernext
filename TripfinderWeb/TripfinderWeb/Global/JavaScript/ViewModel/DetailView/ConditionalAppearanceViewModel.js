(function()
{
	createNamespace("TF.DetailView").ConditionalAppearanceViewModel = ConditionalAppearanceViewModel;

	function ConditionalAppearanceViewModel(options)
	{
		var self = this;

		self.currentConditionItem = null;
		self.availableOperators = {
			number: [
				{ text: "Equal To", name: "EqualTo" },
				{ text: "Not Equal To", name: "NotEqualTo" },
				{ text: "Empty", name: "Empty" },
				{ text: "Not Empty", name: "NotEmpty" },
				{ text: "Less Than", name: "LessThan" },
				{ text: "Less Than or Equal To", name: "LessThanOrEqualTo" },
				{ text: "Greater Than", name: "GreaterThan" },
				{ text: "Greater Than or Equal To", name: "GreaterThanOrEqualTo" }
			],
			string: [
				{ text: "Equal To", name: "EqualTo" },
				{ text: "Not Equal To", name: "NotEqualTo" },
				{ text: "Contains", name: "Contains" },
				{ text: "Does Not Contain", name: "DoesNotContain" },
				{ text: "Starts With", name: "StartsWith" },
				{ text: "Ends With", name: "EndsWith" },
				{ text: "Empty", name: "Empty" },
				{ text: "Not Empty", name: "NotEmpty" }
			],
			date: [
				{ text: "On", name: "On" },
				{ text: "Before", name: "Before" },
				{ text: "After", name: "After" },
				{ text: "On Or Before", name: "OnOrBefore" },
				{ text: "On Or After", name: "OnOrAfter" },
				{ text: "Not On", name: "NotOn" },
				{ text: "Between", name: "Between" }
			],
			time: [
				{ text: "On", name: "On" },
				{ text: "Before", name: "Before" },
				{ text: "After", name: "After" },
				{ text: "On Or Before", name: "OnOrBefore" },
				{ text: "On Or After", name: "OnOrAfter" },
				{ text: "Not On", name: "NotOn" },
				{ text: "Between", name: "Between" }
			],
			boolean: [
				{ text: "True", name: true },
				{ text: "False", name: false }
			]
		};

		self.availableOperators.geodistance = self.availableOperators.number;

		self.gridType = options.gridType;
		self.field = options.field;
		self.dataObj = options.dataObj;
		self.defaultColors = options.defaultColors;
		self.dataPoint = ko.observable({
			fieldName: ko.observable(""),
			displayText: ko.observable(""),
			dataType: ko.observable(""),
			format: ko.observable("")
		});
		self.initDataPointData();
		self.obPreviewContent = ko.observable('');
		self.obConditionList = ko.observableArray([]);
		self.obDropDownMenuContent = ko.observableArray([]);
		self.obDate = ko.observable();

		self.tempY = null;

		self.onConditionSelectElementClick = self.onConditionSelectElementClick.bind(self);
		self.onToggleConditionDetailBtnClick = self.onToggleConditionDetailBtnClick.bind(self);
		self.onAddNewBtnClick = self.onAddNewBtnClick.bind(self);
		self.onDeleteBtnClick = self.onDeleteBtnClick.bind(self);
		self.onConditionListUpdate = self.onConditionListUpdate.bind(self);
		self.onInputKeyDown = self.onInputKeyDown.bind(self);
		self.onInputBlur = self.onInputBlur.bind(self);
		self.onDropDownMenuItemClick = self.onDropDownMenuItemClick.bind(self);
		self.getDisplayValue = self.getDisplayValue.bind(self);

		self.conditionsUpdateEvent = new TF.Events.Event();
		self.onConditionMouseEvent = self.onConditionMouseEvent.bind(self);

		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
		$(document).off('.conditionAppearance');
	};

	/**
	 * Initialization.
	 * @return {void}
	 */
	ConditionalAppearanceViewModel.prototype.init = function(data, el)
	{
		var self = this;

		self.$modalContent = $(el);
		self.$modalDialog = self.$modalContent.closest(".modal-dialog");
		self.$dropDownMenu = self.$modalContent.find(".dropdown-menu");

		self.obConditionList.subscribe(function()
		{
			self.conditionsUpdateEvent.notify();
		});

		self.conditionsUpdateEvent.subscribe(function()
		{
			self.pageLevelViewModel.clearError();
			self.drawPreview(self.obConditionList());
		});

		if (self.dataObj && Array.isArray(self.dataObj) && self.dataObj.length > 0)
		{
			var list = self.dataObj.map(function(item)
			{
				return self.createConditionObj(item);
			});
			self.obConditionList(list);
		}
		else
		{
			self.obConditionList.push(self.createConditionObj());
		}
		self.initEvent();
	};

	/** 
	 * Initialize data points.
	 * @return {Object}
	 */
	ConditionalAppearanceViewModel.prototype.initDataPointData = function()
	{
		var self = this, dataPoints = self.getDataPoints(), dataPoint;
		if (dataPoints)
		{
			for (var i = 0, len = dataPoints.length; i < len; i++)
			{
				dataPoint = dataPoints[i];
				if (dataPoint.field === self.field)
				{
					self.dataPoint().fieldName(dataPoint.field);
					self.dataPoint().displayText(dataPoint.title);
					self.dataPoint().dataType(dataPoint.type);
					self.dataPoint().format(dataPoint.format);
					break;
				}
			}
		}
	};

	/** 
	 * Initialize colorPicker elements.
	 * @return {void}
	 */
	ConditionalAppearanceViewModel.prototype.initColorPickers = function($condition)
	{
		var self = this, dataObj = ko.dataFor($condition[0]),
			$colorPickerContainers = $condition.find(".color-picker-container"),
			$animateElements = $condition.find("button");

		if ($condition.hasClass("detail"))
		{
			$animateElements.removeClass("easeTransform");
			$.each($colorPickerContainers, function(index, item)
			{
				var $container = $(item);
				var treatWhiteAsTransparent = $container.attr('type') === "borderColor";
				if ($container.find(">span.k-colorpicker").length === 0)
				{
					var $select = $container.find(".color-picker-select"),
						targetType = $container.attr("type"),
						colorValue = dataObj[targetType](),
						options = {
							buttons: false,
							cookieName: "conditional-appearance",
							value: treatWhiteAsTransparent && colorValue === "transparent" ? "#fffffe" : colorValue,
							treatWhiteAsTransparent: treatWhiteAsTransparent,
							change: function(e)
							{
								if (treatWhiteAsTransparent && e.value === '#fffffe')
								{
									dataObj[targetType]('None');
								}
								else
								{
									dataObj[targetType](e.value);
								}
							}
						};

					$select.kendoColorPicker(options);

					if (treatWhiteAsTransparent && options.value === "#fffffe")
					{
						$container.find('.color-picker-label').text("None");
						$container.addClass('noBorder');
					}
				}
			});
			$animateElements.addClass("easeTransform");
		}
	};

	/** 
	 * Initialize necessary events.
	 * @return {void}
	 */
	ConditionalAppearanceViewModel.prototype.initEvent = function()
	{
		var self = this;
		$(document).on("mousedown.conditionAppearance", function(e)
		{
			if ($(e.target).closest(".dropdown-menu").length <= 0)
			{
				self.$dropDownMenu.hide();
				self.currentConditionItem = null;
			}
		});

		$(document).on("movetobottom.conditionAppearance", '.condition-list', function()
		{
			$(this).animate({ scrollTop: 10000 }, 0);
		});
	};

	ConditionalAppearanceViewModel.prototype.onConditionMouseEvent = function(viewModel, e)
	{
		var self = this;
		if (e.type === "mouseover")
		{
			self.drawPreview([viewModel]);
		}
		else
		{
			self.drawPreview(self.obConditionList());
		}
	}

	/** 
	 * Toggle Abbreviation/Detail status for condition item.
	 * @return {void}	
	 */
	ConditionalAppearanceViewModel.prototype.onToggleConditionDetailBtnClick = function(data, e)
	{
		var self = this,
			$conditionItem = $(e.target).closest(".condition-item"),
			isDetailed = data.showDetail();

		if (isDetailed)
		{
			data.showDetail(false);
		}
		else
		{
			data.showDetail(true);
			self.initColorPickers($conditionItem);
		}
	};

	/**
	 * Get the display value.
	 * @param {String} format 
	 * @param {Any} value 
	 * @param {String} type 
	 * @return {String}
	 */
	ConditionalAppearanceViewModel.prototype.getDisplayValue = function(format, value, type)
	{
		var self = this, dataPoints = self.getDataPoints();
		if (value)
		{
			type = self.getDataPointConceptualType(type, format);
			if (type === "time")
			{
				return moment(value).format("hh:mm A");
			}
			else
			{
				if (format === "Money")
				{
					return "$" + parseFloat(value).toFixed(2);
				}
				else if (format === "Time")
				{
					var start = new Date();
					start.setHours(0, 0, value, 0);
					return moment(start).format("HH:mm:ss");
				}
			}
			return value;
		}
		else if (value === false)
		{
			return value;
		}
		else
		{
			return "[click to enter value]";
		}
	};

	/**
	 * The event handler when select input element in condition is clicked.
	 * @param {Object} data The bound data object. 
	 * @param {Event} evt The event object.
	 * @return {void} 
	 */
	ConditionalAppearanceViewModel.prototype.onConditionSelectElementClick = function(data, evt)
	{
		evt.stopPropagation();

		var self = this, $input,
			$select = $(evt.target),
			type = $select.attr("selectType"), conditionItem = ko.dataFor($select[0]),
			dataFormat = conditionItem.format(),
			dataType = conditionItem.type();

		dataType = self.getDataPointConceptualType(dataType, dataFormat);
		if (type === "input" || type === "extraInput")
		{
			switch (dataType)
			{
				case "boolean":
					self.openDropDownMenu($select, "boolean");
					break;
				case "date":
					self.openDropDownMenu($select, "date", type);
					break;
				case "time":
					$select.parent().find(type === "extraInput" ? ".timeExtraValue" : ".timeValue").parent().find(".datepickerbutton").click();
					$(document).find(".bootstrap-datetimepicker-widget").offset($select.offset());
					break;
				default:
					$input = $select.closest(".condition-content").find("input");
					$input.val(conditionItem.value());
					conditionItem.displayValue(false);
					$input.focus();
					break;
			}
		}
		else
		{
			self.openDropDownMenu($select, type);
		}
	};

	ConditionalAppearanceViewModel.prototype.onInputKeyDown = function(data, e)
	{
		var self = this, $input = $(e.target), value = $input.val();
		switch (e.keyCode)
		{
			case $.ui.keyCode.ENTER:
				data.displayValue(true);
				e.stopPropagation();
				break;
			case $.ui.keyCode.ESCAPE:
				$input.val(data.value());
				data.displayValue(true);
				e.stopPropagation();
				break;
			default:
				return true;
		}
	};

	ConditionalAppearanceViewModel.prototype.onInputBlur = function(data, e)
	{
		var self = this, $input = $(e.target), value = $input.val();
		data.value(value);
		data.displayValue(true);
	};

	/** 
	 * The event handler when addNew button is clicked.
	 * @param {Object} data
	 * @param {Event} e
	 * @return {void}
	 */
	ConditionalAppearanceViewModel.prototype.onAddNewBtnClick = function(data, e)
	{
		var self = this;
		self.addNewConditionItem();
	};

	/** 
	 * The event handler when delete condition button is clicked.
	 * @param {Object} data
	 * @param {Event} e
	 * @return {void}
	 */
	ConditionalAppearanceViewModel.prototype.onDeleteBtnClick = function(data, e)
	{
		var self = this,
			$condition = $(e.target).closest(".condition-item"),
			colorPicker = $condition.find(".color-picker-select").data("kendoColorPicker");

		if (colorPicker)
		{
			colorPicker.destroy();
		}
		self.obConditionList.remove(data);
	};

	/**
	 * The event handler when item in dropdown menu is clicked.
	 * @param {Object} data 
	 * @param {Event} e
	 * @return {void} 
	 */
	ConditionalAppearanceViewModel.prototype.onDropDownMenuItemClick = function(data, e)
	{
		var self = this, operator,
			type = self.$dropDownMenu.attr("selectType");
		if (self.currentConditionItem)
		{
			switch (type)
			{
				case "dataPoint":
					if (self.currentConditionItem.field() !== data.name)
					{
						self.currentConditionItem.field(data.name);
						self.currentConditionItem.type(data.type);
						self.currentConditionItem.title(data.text);
						self.currentConditionItem.format(data.format);
						self.currentConditionItem.value("");
						self.currentConditionItem.extraValue("");
						if (data.type.toLowerCase() === "boolean")
						{
							operator = "";
						}
						else
						{
							operator = self.availableOperators[data.type.toLowerCase()][0];
						}
						self.currentConditionItem.operator(operator);
					}
					break;
				case "operator":
					self.currentConditionItem.operator(data);
					break;
				case "boolean":
					self.currentConditionItem.value(data.name);
					break;
				default:
					break;
			}
		}
		self.currentConditionItem = null;
		self.$dropDownMenu.hide();
	};

	/**
	 * The event handler when the condition list is updated.
	 * @param {Object} data 
	 * @param {Event} e
	 * @return {void} 
	 */
	ConditionalAppearanceViewModel.prototype.onConditionListUpdate = function(data, e)
	{
		var self = this;
		$.each(self.$modalContent.find(".condition-item"), function(index, item)
		{
			$item = $(item);
			if (!$item.hasClass("ui-draggable"))
			{
				$item.draggable({
					containment: "parent",
					start: self.onConditionItemDragStart.bind(self),
					stop: self.onConditionItemDragStop.bind(self),
					drag: self.onConditionItemDragging.bind(self)
				});
			}
			self.initColorPickers($item);
		});
	};

	/**
	 * The handler for condition item drag start event.
	 * @param {Event} evt
	 * @return {void} 
	 */
	ConditionalAppearanceViewModel.prototype.onConditionItemDragStart = function(evt, helper)
	{
		var self = this;
		// If the mousedown event is from colorPicker, drag should not get started.
		if ($(evt.originalEvent.target).closest(".color-picker-container").length > 0)
		{
			evt.originalEvent.stopPropagation();
			return;
		}

		var $condition = $(evt.target).closest(".condition-item");
		$condition.addClass("onDrag");
		self.tempY = helper.offset.top;
	};

	/**
	 * The handler for condition item drag stop event.
	 * @param {Event} evt
	 * @return {void} 
	 */
	ConditionalAppearanceViewModel.prototype.onConditionItemDragStop = function(evt, helper)
	{
		var self = this, targetIndex = 0,
			$conditionItems = self.$modalContent.find(".condition-item"),
			$condition = $(evt.target).closest(".condition-item"),
			curIndex = $conditionItems.index($condition[0]),
			conditionBottom = helper.offset.top + $condition.outerHeight(),
			moveUpOrDown = function(index, isUp)
			{
				if (!isUp && index < self.obConditionList().length - 1)
				{
					self.obConditionList.splice(index, 2, self.obConditionList()[index + 1], self.obConditionList()[index]);
				}
				else if (isUp && index > 0)
				{
					self.obConditionList.splice(index - 1, 2, self.obConditionList()[index], self.obConditionList()[index - 1]);
				}
			};

		$.each($conditionItems, function(index, item)
		{
			if ($condition.is(item)) { return true; }

			var $item = $(item), itemMiddleY = $item.offset().top + $item.outerHeight() / 2;
			if (conditionBottom <= itemMiddleY)
			{
				return false;
			}
			targetIndex++;
		});

		while (curIndex !== targetIndex)
		{
			var moveUp = curIndex > targetIndex;
			moveUpOrDown(curIndex, moveUp);
			curIndex += (moveUp ? -1 : 1);
		}

		$conditionItems.css({ top: "", left: "" });
		$condition.removeClass("onDrag");

		self.conditionsUpdateEvent.notify();
	};

	/**
	 * The handler for condition item dragging event.
	 * @param {Event} evt
	 * @return {void} 
	 */
	ConditionalAppearanceViewModel.prototype.onConditionItemDragging = function(evt, helper)
	{
		var self = this,
			$conditionItems = self.$modalContent.find(".condition-item"),
			$condition = $(evt.target).closest(".condition-item"),
			conditionIndex = $conditionItems.index($condition[0]),
			height = $condition.outerHeight(),
			offsetTop = helper.offset.top,
			dragDown = offsetTop > self.tempY;

		self.tempY = offsetTop;
		$condition.addClass("onDrag");

		$.each($conditionItems, function(index, item)
		{
			if ($condition.is(item)) { return true; }

			var $item = $(item), itemMiddleY = $item.offset().top + $item.outerHeight() / 2;
			if (dragDown)
			{
				if (offsetTop + height > itemMiddleY)
				{
					if (index > conditionIndex)
					{
						$item.css("top", -height);
					}
					else
					{
						$item.css("top", "");
					}
				}
			}
			else if (offsetTop < itemMiddleY)
			{
				if (index < conditionIndex)
				{
					$item.css("top", height);
				}
				else
				{
					$item.css("top", "");
				}
			}
		});
	};

	/** 
	 * Add a new condition item.
	 * @param {Object} conditionObj
	 * @return {void}
	 */
	ConditionalAppearanceViewModel.prototype.addNewConditionItem = function(conditionObj)
	{
		var self = this,
			conditionObj = conditionObj || self.createConditionObj();
		self.obConditionList.push(conditionObj);

		$('.condition-list').trigger('movetobottom');
	};

	/** 
	 * Create a default condition object.
	 * @return {Object} Default condition object.
	 */
	ConditionalAppearanceViewModel.prototype.createConditionObj = function(obj)
	{
		var self = this,
			format = self.dataPoint().format(),
			dataType = self.dataPoint().dataType(),
			dataType = self.getDataPointConceptualType(dataType, format),
			operations = self.availableOperators[dataType],
			condition = obj
				? {
					field: ko.observable(obj.field),
					type: ko.observable(obj.type),
					title: ko.observable(obj.title),
					format: ko.observable(obj.format),
					showDetail: ko.observable(obj.showDetail),
					operator: ko.observable(typeof (obj.operator) === "object" ? obj.operator : (obj.type.toLowerCase() === "boolean" ? "" : { text: "Equal To", name: "EqualTo" })),
					value: ko.observable(obj.value),
					extraValue: ko.observable(obj.extraValue),
					backgroundColor: ko.observable(obj.backgroundColor),
					borderColor: ko.observable(obj.borderColor),
					titleColor: ko.observable(obj.titleColor),
					contentColor: ko.observable(obj.contentColor),
					displayValue: ko.observable(true)
				}
				: {
					field: ko.observable(self.dataPoint().fieldName()),
					type: ko.observable(self.dataPoint().dataType()),
					title: ko.observable(self.dataPoint().displayText()),
					format: ko.observable(self.dataPoint().format()),
					showDetail: ko.observable(false),
					operator: ko.observable(dataType === "boolean" ? "" : operations[0]),
					value: ko.observable(""),
					extraValue: ko.observable(""),
					backgroundColor: ko.observable(self.defaultColors.backgroundColor),
					borderColor: ko.observable(self.defaultColors.borderColor),
					titleColor: ko.observable(self.defaultColors.titleColor),
					contentColor: ko.observable(self.defaultColors.contentColor),
					displayValue: ko.observable(true)
				};

		var keys = Object.keys(condition), key;
		for (var i = 0, len = keys.length; i < len; i++)
		{
			key = keys[i];
			if (key != "showDetail" && key != "displayValue")
			{
				condition[key].subscribe(function()
				{
					self.conditionsUpdateEvent.notify();
				});
			}
		}

		return condition;
	};

	/**
	 * Get the conceptual data type.
	 * @param {Object} dataPoint
	 * @return {String}
	 */
	ConditionalAppearanceViewModel.prototype.getDataPointConceptualType = function(type, format)
	{
		if (format && format.toLowerCase() === "time")
		{
			type = "time";
		}

		return type.toLowerCase();
	};

	/**
	 * Open the drop down menu.
	 * @param {JQuery} $select The clicked SELECT element.
	 * @param {string} type The SELECT type.
	 * @return {void} 
	 */
	ConditionalAppearanceViewModel.prototype.openDropDownMenu = function($select, type, dateValueType)
	{
		var self = this, dataPoints, dataPoint, dataPointItems,
			relativeTop = $select.offset().top - self.$modalContent.offset().top,
			relativeLeft = $select.offset().left - self.$modalContent.offset().left;

		self.currentConditionItem = ko.dataFor($select[0]);
		switch (type)
		{
			case "dataPoint":
				dataPoints = self.getDataPoints(), dataPointItems = [];
				if (dataPoints)
				{
					for (var i = 0, len = dataPoints.length; i < len; i++)
					{
						dataPoint = dataPoints[i];
						dataPointItems.push({ text: dataPoint.title, name: dataPoint.field, type: dataPoint.type, format: dataPoint.format });
					}
				}
				self.obDropDownMenuContent(dataPointItems);
				break;
			case "operator":
			case "boolean":
				var dataType = self.currentConditionItem.type(),
					format = self.currentConditionItem.format(),
					dataType = self.getDataPointConceptualType(dataType, format);
				self.obDropDownMenuContent(self.availableOperators[dataType]);
				break;
			case "date":
				self.obDropDownMenuContent([]);
				var $calendar = $("<div class='date-picker'></div>"), isExtraValue = dateValueType === "extraInput",
					calendar = self.$dropDownMenu.find(".date-picker"), value = isExtraValue ? self.currentConditionItem.extraValue() : self.currentConditionItem.value();
				if (calendar.length > 0)
				{
					if (calendar.data("kendoCalendar"))
					{
						calendar.data("kendoCalendar").destroy();
					}
					calendar.remove();
				}
				self.$dropDownMenu.find(".calendar-container").append($calendar);
				$calendar.kendoCalendar({
					width: "100%",
					height: "100%",
					value: moment(value).isValid() ? new Date(value) : new Date(),
					change: function()
					{
						var calendar = this;
						isExtraValue ? self.currentConditionItem.extraValue(moment(calendar.value()).format('YYYY-MM-DD')) :
							self.currentConditionItem.value(moment(calendar.value()).format('YYYY-MM-DD'));
						self.$dropDownMenu.hide();
					}
				});
				self.$dropDownMenu.find(".date-picker td.k-state-selected").on("click", function()
				{
					calendar = self.$dropDownMenu.find(".date-picker").data("kendoCalendar");
					isExtraValue ? self.currentConditionItem.extraValue(moment(calendar.value()).format('YYYY-MM-DD')) :
						self.currentConditionItem.value(moment(calendar.value()).format('YYYY-MM-DD'));
					self.$dropDownMenu.hide();
				});
				break;
		}

		self.$dropDownMenu.hide();
		self.$dropDownMenu.attr("selectType", type);
		self.$dropDownMenu.css($select.offset());
		self.$dropDownMenu.show();
		self.$dropDownMenu.css("maxHeight", parseInt($("body").outerHeight() - self.$dropDownMenu.offset().top));
	};

	/** 
	 * Get available data points.
	 * @return {Object}
	 */
	ConditionalAppearanceViewModel.prototype.getDataPoints = function()
	{
		var self = this, categories, key, dataPoints = [],
			dataPointObj = dataPointsJSON[self.gridType],
			currentAvailableTypes = ["boolean", "string", "number", "date", "time", "geodistance"];
		if (dataPointObj)
		{
			categories = Object.keys(dataPointObj);
			for (var i = 0, len = categories.length; i < len; i++)
			{
				key = categories[i];
				dataPoints = dataPoints.concat(dataPointObj[key].filter(
					function(item)
					{
						return item.type && currentAvailableTypes.indexOf(item.type.toLowerCase()) > -1
					}));
			}
		}
		return dataPoints;
	};

	/**
	 * Preview data block when contion changed
	 * @param {Array} conditions 
	 */
	ConditionalAppearanceViewModel.prototype.drawPreview = function(conditions)
	{
		var self = this, dataPoints = self.getDataPoints();
		var conditionsCopy = conditions.slice();
		var mergedCondition = conditionsCopy.reverse().reduce(function(accumulator, current)
		{
			accumulator.backgroundColor = current.backgroundColor();
			accumulator.borderColor = current.borderColor() === "None" ? "transparent" : current.borderColor();
			accumulator.titleColor = current.titleColor();
			accumulator.contentColor = current.contentColor();
			return accumulator;
		}, {}),
			displayTarget = dataPoints.filter(function(point) { return point.field === self.dataPoint().fieldName() })[0],
			previewContent;

		switch (self.dataPoint().dataType())
		{
			case "Boolean":
				content = displayTarget && ["active", "yes", "true"].indexOf(displayTarget.defaultValue.toLowerCase()) > -1;
				previewContent = "<div>\
									<div class='grid-stack-item-content boolean-stack-item " + (content ? "true-item" : "false-item") + "' style='background:" + mergedCondition.backgroundColor + ";border-color:" + mergedCondition.borderColor + "'>\
										<div class='item-content' style='text-transform: capitalize;color:" + mergedCondition.contentColor + "'>" + content + "</div>\
									</div>\
								</div>";
				break;
			default:
				content = displayTarget && displayTarget.defaultValue ? displayTarget.defaultValue : 'None';
				previewContent = '<div>\
									<div class="grid-stack-item-content" style="background:' + mergedCondition.backgroundColor + ';border-color:' + mergedCondition.borderColor + '">\
										<div class="item-title" style="color:' + mergedCondition.titleColor + '">' + self.dataPoint().displayText() + '</div>\
										<div class="item-content" style="color:' + mergedCondition.contentColor + '">' + content + '</div>\
									</div>\
								</div>';
				break;
		}

		self.obPreviewContent(previewContent);
	}

	/** 
	 * Save the conditional appearance.
	 * @return {Object}
	 */
	ConditionalAppearanceViewModel.prototype.save = function()
	{
		var self = this,
			data = self.exportData(),

			effectiveConditions = data.filter(function(condition)
			{
				if (condition.operator.text !== "Not Empty" && condition.operator.text !== "Empty")
				{
					if (condition.operator.text === "Between")
					{
						return !((!condition.value && condition.value !== false) || (!condition.extraValue && condition.extraValue !== false));
					}
					else
					{
						return !(!condition.value && condition.value !== false);
					}
				}
				return true;
			});

		return effectiveConditions;
	};

	/** 
	 * Export condition list as data object.
	 * @return {Object}
	 */
	ConditionalAppearanceViewModel.prototype.exportData = function()
	{
		var self = this,
			conditionList = self.obConditionList();
		return conditionList.map(function(item)
		{
			return {
				field: item.field(),
				type: item.type(),
				title: item.title(),
				showDetail: item.showDetail(),
				format: item.format(),
				operator: item.operator(),
				value: item.value(),
				extraValue: item.extraValue(),
				backgroundColor: item.backgroundColor(),
				borderColor: item.borderColor(),
				titleColor: item.titleColor(),
				contentColor: item.contentColor()
			}
		});
	};

	/** 
	 * The dispose function.
	 * @return {void}
	 */
	ConditionalAppearanceViewModel.prototype.dispose = function()
	{
	};
})();
(function ()
{
	createNamespace("TF.Map.Thematics").QuickFilterViewModel = QuickFilterViewModel;


	function QuickFilterViewModel(dataType, dataColumns, filtersInfo, thematicType, pageType)
	{
		var self = this;

		self.isInitializationFinished = false;
		self.defaultDate = "1899-12-30";
		self.fieldCount = 3;

		self.dataType = dataType;
		self.filtersInfo = filtersInfo;
		self.shouldDoFilter = true;
		self.pageType = pageType;
		self.dataColumns = dataColumns.sort(function (a, b)
		{
			var displayNameA = a.DisplayName || a.FieldName, displayNameB = b.DisplayName || b.FieldName;
			return (displayNameA.toLowerCase() < displayNameB.toLowerCase()) ? -1 : ((displayNameA.toLowerCase() == displayNameB.toLowerCase()) ? 0 : 1)
		});

		self.typeCodeEmun = { "string": "String", "integer": "Integer", "time": "Time", "number": "Number", "date": "Date", "datetime": "DateTime", "boolean": "Boolean" };
		self.typeCodeMenuEmun = { "string": "string", "integer": "number", "time": "time", "number": "number", "date": "date", "datetime": "datetime", "boolean": "boolean" };

		self.emptyColumn = { FieldName: null, DisplayName: "(None)" };
		self.availableFieldOptions = self.dataColumns;
		self.availableFieldOptions.splice(0, 0, self.emptyColumn);
		self.selectedFields = [];
		if (filtersInfo && filtersInfo.length > 0)
		{
			$.each(filtersInfo, function (index, item)
			{
				if (item.field)
				{
					self.selectedFields.push(item.field);
				}
			});
		}
		self.obFields = ko.observableArray([]);
		self.obMultipleFieldsUnSelect = ko.computed(function ()
		{
			return self.obFields().length > 0 ? self.obFields().filter(function (field) { return !field.filterDisabled() }).length < 2 : true;
		}, self);
		self.discardDefaultValue = thematicType === TF.ThematicTypeEnum.GRID;

		//Events
		self.filterMenuButtonClick = self.filterMenuButtonClick.bind(self);
		self.autocompletionMouseDownEvent = self.autocompletionMouseDownEvent.bind(self);
		self.openListFilterButtonClick = self.openListFilterButtonClick.bind(self);

		self.getFiltersInfo = self.getFiltersInfo.bind(this);
		self.changeFilter = self.changeFilter.bind(self);
		self.dispose = self.dispose.bind(self);
		self.init = self.init.bind(self);
		self.createCustomFilter = self.createCustomFilter.bind(this);

		self.onFilterChange = new TF.Events.Event();
		self.onFieldReordered = new TF.Events.Event();

		//Init
		self.filterMenuEventsInit();
		self.autoncompletionEventsInit();

		self.customfilterEventsInit();

		self.quickDateFilterTypes = [
			'lastxdays',
			'lastxhours',
			'lastxmonths',
			'lastxweeks',
			'lastxyears',
			'nextxdays',
			'nextxhours',
			'nextxmonths',
			'nextxweeks',
			'nextxyears',
			'olderthanxmonths',
			'olderthanxyears',
			'onyearx'
		];

		self.quickDateFilterTypesWithoutInput = [
			'all',
			'lastmonth',
			'lastweek',
			'lastyear',
			'nextbusinessday',
			'nextmonth',
			'nextweek',
			'nextyear',
			'thismonth',
			'thisweek',
			'thisyear',
			'today',
			'tomorrow',
			'yesterday'
		];

		self.quickDateFilterTypesDateTimeOnly = [
			'onx',
			'onorafterx',
			'onorbeforex'
		];

		self.quickDateFilterTypesDateTimeOnlyMapping = {
			'onx': 'On X',
			'onorafterx': 'On or After X',
			'onorbeforex': 'On or Before X'
		};

		self.quickDateFilterTypesNames = TF.Grid.LightKendoGrid.prototype.operatorKendoMapTF;
	};

	/**
	 * Quick filter init.
	 * @param {object} model data model.
	 * @param {object} e element.
	 * @return {void}
	 */
	QuickFilterViewModel.prototype.init = function (model, e)
	{
		var self = this,
			initialFields = self.getInitFields();

		self.$el = $(e);
		self.obFields(initialFields);
		self.listFilterTool = new TF.Map.Thematics.ListFilterTool(self.dataType, self.filtersInfo, self.obFields());

		// Set to true when the initialization is done.
		self.isInitializationFinished = true;
		if (self.filtersInfo)
		{
			self.notifyFilterChange();
		}

		/*
			If the focus is in filter input, there are some operations:
			A. User Click drag button.
				1. Sticky some parameters on mousedown event.
				2. On mouseup event, if the filter value was changed, refresh the grid.
				3. Reset the parameters.
			B. User drag the field element, but don't change the fields location, then lose focus from filter input.
				1. Sticky some parameters on mousedown event.
				2. Trigger the input blur event, and sticky some drag parameters.
				3. Set the focus into the field input.
				4. Since the filter value on 'obFields' was changed, the grid wasn't refreshed when filter input lose focus,
					On mouseup event, need to check the filter value is same to the first value, if not, refresh the grid.
				5. Reset the parameters.
			C. User drag the field element, then change the field's location.
				1. Sticky some parameters on mousedown event.
				2. Trigger the input blur event, and sticky some drag parameters.
				3. Reset the parameters.
				4. Refresh the grid.
		 */
		// If drag handle icon was clicked, the input need to lose focus. If drag handle icon was dragged, the input do not lose focus.
		self.$el.delegate(".drag-handle", "mousedown", function (e)
		{
			if ($(document.activeElement).hasClass("quick-filter-input"))
			{
				self.shouldDoFilter = false;//Do not refresh the grid when the field item was dragging.
				self.$activeEl = $(document.activeElement);//The input element.
				self.isDragActiveEl = false;//Decide if the field item would be dragged or clicked.
				if (self.$activeFieldValue === undefined)//The field filter value.
				{
					self.$activeFieldValue = self.obFields()[self.$activeEl.closest(".field-item").attr("index")].filterValue();
				}
				if (self.$activeFieldValue === "" || self.$activeFieldValue === null)
				{
					self.$activeEl.closest(".text-input").addClass("hideClearButton");
				}
			}
			$(".thematic-modal-field").hide();
		});

		$("body").on("mouseup.drag-handle", function (e)
		{
			// Only click event trigger and the mouse down event trigger from drag handle icon.
			if (self.$activeEl)
			{
				self.$activeEl.blur();//Set the field filter to a newest value.
				self.shouldDoFilter = true;//Open the switch, the grid can be refreshed.

				//If the filter value was changed, the grid need to be refreshed.
				if (self.$activeFieldValue !== self.obFields()[self.$activeEl.closest(".field-item").attr("index")].filterValue())
				{
					self.notifyFilterChange();
				}

				self.$activeEl.closest(".text-input").removeClass("hideClearButton");
				self.$activeEl = undefined;
				self.isDragActiveEl = false;
				self.$activeFieldValue = undefined;
			}
		});

		$("body").delegate(".quick-filter-input", "blur.drag-handle", function (e)
		{
			// After drag, if the input trigger blur event.
			if (self.isDragActiveEl)
			{
				self.isDragActiveEl = false;// If the user drag the field, this sign is true.
				if (self.$activeFieldValue !== undefined)
				{
					var $target = $(e.currentTarget),//Get the element which was dragged.
						index = $fieldItem = $(e.currentTarget).closest(".field-item").attr("index");
					$target.blur();//Set the field filter to a newest value.

					var field = self.obFields()[index], value = field.filterValue();
					self.shouldDoFilter = true;//Open the switch, the grid can be refreshed.

					//If the filter value was changed, the grid need to be refreshed.
					if (self.$activeFieldValue !== value)
					{
						self.notifyFilterChange();
					}

					$target.closest(".text-input").removeClass("hideClearButton");
					self.$activeFieldValue = undefined;
				}
			}
		});
	};

	/**
	 * Gets the filter info.
	 * @param {*} ignoreUnit ignore unit of measurement when determining whether the settings changed
	 * @return {Array} The array of filter info.
	 */
	QuickFilterViewModel.prototype.getFiltersInfo = function (ignoreUnit = false)
	{
		var self = this;
		return self.obFields().filter(field => field.selectField().FieldName).map(function (field)
		{
			var value = field.filterValue();
			if (field.filterType() === "custom")
			{
				value = field.customFilter ? JSON.stringify(field.customFilter.getFiltersInfo(ignoreUnit)) : "";
			}
			else if (field.filterType() === "list")
			{
				value = field.filterSet ? JSON.stringify(field.filterSet) : "";
			}

			var typeHint = null;
			switch (field.typeCode())
			{
				case "String":
					typeHint = "String";
					value = !value ? "" : value;
					break;
				case "Time":
					typeHint = "Time";
					break;
				case "Date":
					typeHint = "Date";
					break;
				case "Boolean":
					value = value === " " ? null : value;
					break;
				case "Number":
					if (field.filterType() !== "custom")
					{
						const fieldDefinition = self.getFieldObjectByName(field.selectField().FieldName);
						if (!ignoreUnit && !["", undefined, null].includes(value) && fieldDefinition.UnitOfMeasureSupported
							&& tf.measurementUnitConverter.isNeedConversion(fieldDefinition.UnitInDatabase))
						{
							const precision = fieldDefinition.Precision || 2;
							value = tf.measurementUnitConverter.convert({
								originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Imperial,
								targetUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
								precision,
								isReverse: !!fieldDefinition.UnitOfMeasureReverse,
								value: value,
								unitType: fieldDefinition.UnitTypeOfMeasureSupported
							});
						}
					}
					break;
			}

			var typeId = field.selectField().hasOwnProperty("TypeId") ? field.selectField().TypeId : null;

			return {
				"field": field.selectField().FieldName,
				"filterType": field.filterType(),
				"filterTypeOperator": field.typeCode() === "Boolean" ? "EqualTo" : TF.Grid.LightKendoGrid.prototype.operatorKendoMapTF[field.filterType()],
				"filterValue": value,
				"typeHint": typeHint,
				"typeId": typeId
			}
		});
	};

	QuickFilterViewModel.prototype.quickDateFilterFieldMaker = function (value, field)
	{
		let filterValue = Number(value);
		field.filterValue(filterValue);
		field.type = field.filterType();
		return filterValue;
	}

	QuickFilterViewModel.prototype.isQuickDateFilter = function (field)
	{
		return this.quickDateFilterTypes.includes(field.filterType());
	}

	QuickFilterViewModel.prototype.parseFilterValue = function (value, field)
	{
		let filterValue;
		switch (field.typeCode())
		{
			case "Boolean":
				let dataField = field.selectField();
				// convert the diaplay value to boolean for filtering
				if (dataField.questionType === 'Boolean')
				{
					let trueDisplayName = dataField.filterable.positiveLabel;
					let falseDisplayName = dataField.filterable.negativeLabel;
					if (trueDisplayName && value === trueDisplayName)
					{
						filterValue = true;
					}
					else if (falseDisplayName && value === falseDisplayName)
					{
						filterValue = false;
					}
					else
					{
						filterValue = value.toLowerCase() === "true" ? true : false;
					}
				}
				else
				{
					filterValue = value.toLowerCase() === "true" ? true : false;
				}
				break;
			case "Time":
				if (moment(value).isValid())
				{
					filterValue = toISOStringWithoutTimeZone(moment(value));
				}
				else if (moment(kendo.parseDate(value)).isValid())
				{
					var format1 = 'h:m tt';
					var timeValue = kendo.parseDate(value, format1) || kendo.parseDate(value);
					filterValue = toISOStringWithoutTimeZone(moment(timeValue));
				}
				break;
			case "Date":
				if (this.isQuickDateFilter(field)) //we only need this here because these are required to use input number as type.
				{
					this.quickDateFilterFieldMaker();
					break;
				}
				filterValue = toISOStringWithoutTimeZone(moment(value));
				break;
			case "DateTime":
				if (this.isQuickDateFilter(field))
				{
					this.quickDateFilterFieldMaker();
					break;
				}
				filterValue = toISOStringWithoutTimeZone(moment(value));
				break;
			default:
				filterValue = value;
				if (this.isQuickDateFilter(field))
				{
					this.quickDateFilterFieldMaker();
					typeHint = "DateTime";
				}
				break;
		}
		return filterValue;
	}

	/**
	 * Notify the filter was changed to other function.
	 * @param {object} model ViewModel.
	 * @param {object} e EventData.
	 * @return {void}
	 */
	QuickFilterViewModel.prototype.notifyFilterChange = function (model, e)
	{
		var self = this, searchParameters;
		if (!self.shouldDoFilter)
		{
			self.shouldDoFilter = false;
			return;
		}
		if (self.focusInAutoCompletion || !self.isInitializationFinished) { return; }

		searchParameters = self.getDefaultSearchParameters();

		self.obFields().map(function (field)
		{
			if (field.selectField() && field.selectField().FieldName)
			{
				var value = field.filterValue();
				value = (value !== null && value !== undefined) ? value.toString() : "";
				if (field.typeCode() === "Number" || field.typeCode() === "Integer")
				{
					value = Number(value) ? Number(value).toString() : value;
				}
				if ((value && (typeof (value) === "string" ? value : true)) || field.filterType() === "isempty" || field.filterType() === "isnotempty")
				{
					var typeHint;
					switch (field.typeCode())
					{
						case "Time":
							typeHint = "Time";
							break;
						case "Date":
							typeHint = "Date";
							break;
						case "DateTime":
							typeHint = "DateTime";
							break;
					}
					if (field.filterType() === "custom" || (field.filterType() === "list" && field.filterSet.LogicalOperator))
					{
						if (field.filterSet)
						{
							if (typeHint)
							{
								field.filterSet.FilterItems.map(function (item)
								{
									item.TypeHint = typeHint;
									item.Value = self.parseFilterValue(item.Value, field);
								});
							}
							searchParameters.filterSet.FilterSets.push(field.filterSet);
						}
					}
					else if (field.filterType() === "list")
					{
						if (field.filterSet)
						{
							if (typeHint)
							{
								field.filterSet.TypeHint = typeHint;
							}
							searchParameters.filterSet.FilterItems.push(field.filterSet);
						}
					}
					else
					{
						if (value === " " && field.typeCode()?.toLowerCase() === 'boolean')
						{
							searchParameters.fields.push(field.selectField().FieldName);
							return true;
						}

						var filterValue = self.parseFilterValue(value, field);
						let item = {
							FieldName: field.selectField().FieldName,
							Operator: field.typeCode() === "Boolean" ? "EqualTo" : TF.Grid.LightKendoGrid.prototype.operatorKendoMapTF[field.filterType()],
							Value: filterValue
						};

						if (typeHint)
						{
							item.TypeHint = typeHint;
						}

						searchParameters.filterSet.FilterItems.push(item);
					}
				}

				if (value === "" && (self.quickDateFilterTypesWithoutInput.includes(field.filterType()) || self.isQuickDateFilter()))
				{
					field.filterValue("");
					field.type = field.filterType();
					let item = {
						FieldName: field.selectField().FieldName,
						Operator: TF.Grid.LightKendoGrid.prototype.operatorKendoMapTF[field.filterType()],
						Value: self.quickDateFilterTypesWithoutInput.includes(field.filterType()) ? "X" : ""
					};
					item.TypeHint = "DateTime";
					if (!self.isQuickDateFilter())
					{
						searchParameters.filterSet.FilterItems.push(item);
					}
				}

				const fieldObj = field.selectField();
				searchParameters.fields.push(fieldObj.FieldName);
			}
		});

		self.onFilterChange.notify(searchParameters);
	};

	/**
	 * Gets the default search params.
	 * @return {object} search params.
	 */
	QuickFilterViewModel.prototype.getDefaultSearchParameters = function ()
	{
		return {
			fields: [],
			filterClause: "",
			filterSet: {
				FilterItems: [],
				FilterSets: [],
				LogicalOperator: "and"
			},
			idFilter: {
				IncludeOnly: null,
				ExcludeAny: []
			},
			sortItems: null
		};
	};

	QuickFilterViewModel.prototype.isQuickDateFilter = function (filterType)
	{
		return this.quickDateFilterTypes.includes(filterType) ||
			this.quickDateFilterTypesWithoutInput.includes(filterType) ||
			this.quickDateFilterTypesDateTimeOnly.includes(filterType);
	}

	QuickFilterViewModel.prototype.valuedQuickDateFilter = function (filterType, val)
	{
		if (this.isValuedQuickDateFilter(filterType) && val)
		{
			let filterPattern = TF.Grid.LightKendoGrid.OperatorWithDateTime.string[filterType];
			if (!filterPattern)
			{
				filterPattern = TF.Grid.LightKendoGrid.OperatorWithDate.string[filterType];
			}
			if (filterPattern)
			{
				// format display strip s with (s) for grammar compatibility.
				if (filterPattern.indexOf("X") > -1 && filterPattern.endsWith("s"))
				{
					filterPattern = filterPattern.substring(0, filterPattern.length - 1) + "(s)";
				}
				return filterPattern.replace("X", val);
			}
		}
		return null;
	}

	QuickFilterViewModel.prototype.isValuedQuickDateFilter = function (filterType)
	{
		return this.quickDateFilterTypes.includes(filterType) ||
			this.quickDateFilterTypesDateTimeOnly.includes(filterType);
	}

	QuickFilterViewModel.prototype.quickDateFilterElement = function ($dateTimeElem, el)
	{

		const validateFilterValue = (el, value) =>
		{
			let validateResult = this.validateDateTimeInteger(el.type, value);
			if (validateResult !== null)
			{
				tf.promiseBootbox.alert('The filter value must be range: ' + validateResult + '.');
				return -1;
			}
			return 0;
		}

		const valuedQuickDateFilterInput = (value) =>
		{
			let hint = this.valuedQuickDateFilter(el.type, value);
			if (hint)
			{
				el["valuedQuickDate"] = hint;
				$numberInput.val(hint);
				$numberInput.readOnly = true;
			}
		}

		let $inputEl = $dateTimeElem.find('.date-number');
		if ($inputEl.length === 1)
		{
			$inputEl.css('display', 'block');
			$($inputEl).val(this.valuedQuickDateFilter(el.type, el.filterValue()));
			$dateTimeElem.parent().closest('.clearButton').css('right', '0');
			return;
		}

		if (el.filterValue().toString().includes("-") || el.filterValue().toString().includes(":"))
		{
			el.filterValue("");
		}

		if (el.valuedQuickDate)
		{
			el.valuedQuickDate = null;
		}

		let $numberInput = $(`<input type="text" class="form-control quick-filter-input date-number date-number-normalize">`);
		$numberInput.val(el.filterValue());
		$numberInput.kendoNumericTextBox({
			format: "{0:0}",
			decimals: 0,
			min: 1,
			change: function (e) { }
		});
		$numberInput.on('focus', (e) =>
		{
			if (el.filterValue() !== "")
			{
				$numberInput.val(el.filterValue());
			}
			el.valuedQuickDate = null;
			$numberInput.readOnly = false;
			$numberInput.css('display', 'block');
			$dateTimeElem.parent().find('.clearButton').css('right', '0');
		});
		$numberInput.on('blur keydown', (e) =>
		{
			if (e.type === 'keydown' && e.keyCode !== 13)
			{
				return;
			}

			if (e.type === 'keydown' && e.keyCode === 13)
			{
				$numberInput.blur();
				e.preventDefault();
				e.stopPropagation();
				return;
			}

			// if clear button is clicked, do the following actions.
			if (e.relatedTarget && $(e.relatedTarget).hasClass('clearButton'))
			{
				$dateTimeElem.parent().find('.clearButton').click();
				$numberInput.val("");
				el.filterValue("");
				el.valuedQuickDate = null;
				$numberInput.css('display', 'block');
				this.notifyFilterChange();
				return;
			}

			if ($numberInput.val() === "" && el.filterValue() === "")
			{
				$numberInput.css('display', 'block');
				this.notifyFilterChange();
				return;
			}

			let value = $numberInput.val();
			if (value === null || el.filterValue() === value) return;
			if (this.isValuedQuickDateFilter(el.type) && el.valuedQuickDate && value === el.valuedQuickDate) return;

			let validation = validateFilterValue(el, value);
			if (validation === -1)
			{
				$numberInput.css('display', 'block');
				$dateTimeElem.parent().find('.clearButton').css('right', '0');
				return;
			}
			el.filterValue(value);
			$dateTimeElem.parent().find('.clearButton').css('right', '0');

			// for clearButton to show up, the filterValue should be set.
			let validateResult = this.validateDateTimeInteger(el.type, value);
			if (validateResult !== null)
			{
				$numberInput.val("");
			}
			el.filterValue(value);
			$numberInput.blur();
			this.notifyFilterChange();

			setTimeout(() =>
			{
				if (validateResult === null)
				{
					valuedQuickDateFilterInput(value);
				}
			}, 200);

			$numberInput.css('display', 'block');
			$dateTimeElem.parent().find('.clearButton').css('right', '0');
		});
		valuedQuickDateFilterInput(el.filterValue());
		$numberInput.data("kendoNumericTextBox").focus();
		$numberInput.parent().find('.date-number').focus();
		$dateTimeElem.find('.input-group').css('display', 'none');
		$dateTimeElem.append($numberInput);
		$dateTimeElem.parent().find('.clearButton').css('right', '0');
	}

	QuickFilterViewModel.prototype.validateDateTimeInteger = function (operator, value)
	{
		let allowRange = 0;

		if (operator === 'onyearx')
		{
			return value > 2040 || value < 1970 ? '1970 ~ 2040' : null;
		}

		switch (operator)
		{
			case "lastxdays":
			case "nextxdays":
				allowRange = 30 * 12 * 365;
				break;
			case "lastxhours":
			case "nextxhours":
				allowRange = 30 * 12 * 365 * 24;
				break;
			case "lastxmonths":
			case "nextxmonths":
				allowRange = 30 * 12;
				break;
			case "lastxweeks":
			case "nextxweeks":
				allowRange = 30 * 12 * 4;
				break;
			case "nextxyears":
			case "lastxyears":
				allowRange = 30;
				break;
			case "olderthanxmonths":
				allowRange = 30 * 12;
				break;
			case "olderthanxyears":
				allowRange = 30 * 2;
				break;
			case "lastxhours":
				allowRange = 30 * 12 * 365 * 24;
				break;
		}
		return value > allowRange ? '1 ~ ' + allowRange : null;
	}

	// for quick date filter that are with nil values to show the typeNames in the input in the UI as a hint title.
	QuickFilterViewModel.prototype.getDateQuickFilterTypeHint = function (newType, value)
	{
		if (this.quickDateFilterTypesWithoutInput.includes(newType))
		{
			return TF.Grid.LightKendoGrid.OperatorWithDateTime.string[newType] ?? "";
		}
		if (this.quickDateFilterTypesDateTimeOnly.includes(newType) && value)
		{
			let pattern = TF.Grid.LightKendoGrid.OperatorWithDateTime.string[newType];
			return pattern ? pattern.replace("X", value) : "";
		}
		return "";
	}

	QuickFilterViewModel.prototype.addDateTimePickerFormatForSpecialFields = function ($input, filterType)
	{
		let dateTimePicker = $input.data('kendoDateTimePicker');
		if (!dateTimePicker) dateTimePicker = $input.data('kendoDatePicker');
		if (!dateTimePicker) return;

		const namespace = ".thematiconx";

		if (!TF.FilterHelper.dateTimeDateParamFiltersOperator.includes(filterType))
		{
			dateTimePicker.element.off('focus' + namespace);
			dateTimePicker.element.off('blur' + namespace);
			return;
		}
		const operatorName = this.quickDateFilterTypesDateTimeOnlyMapping[filterType].replace("X", "").trim();
		if ($(dateTimePicker.element).val() && !$(dateTimePicker.element).val().startsWith(operatorName))
		{
			const cellValue = $(dateTimePicker.element).val();
			if (cellValue && cellValue !== '')
			{
				$(dateTimePicker.element).val(`${operatorName} ${cellValue}`);
			}
		}

		const isOnXPatternItem = function ()
		{
			const span = $(dateTimePicker.element[0].parentElement).closest('.text-input');
			return span && (span.hasClass('onx') || span.hasClass('onorafterx') || span.hasClass('onorbeforex'));
		}

		dateTimePicker.element.on('focus' + namespace, (e) =>
		{
			let datePicker = dateTimePicker.element.data("kendoDateTimePicker");
			if (!datePicker) datePicker = dateTimePicker.element.data("kendoDatePicker");
			const isOnXPattern = isOnXPatternItem();

			if (isOnXPattern && TF.FilterHelper.dateTimeDateParamFiltersOperator.includes(filterType))
			{
				let oldText = datePicker._oldText;
				if (oldText)
				{
					$(dateTimePicker.element).val(oldText);
				}
			}
		});

		dateTimePicker.element.on('blur' + namespace, (e) =>
		{
			const cellValue = $(dateTimePicker.element).val();
			const isOnXPattern = isOnXPatternItem();

			if (isOnXPattern && TF.FilterHelper.dateTimeDateParamFiltersOperator.includes(filterType))
			{
				if (cellValue && cellValue !== '')
				{
					// this setTimeout is to avoid date picker element value assignment conflict and overlap of the value
					// this setTimeout is necessary until better improvements found.
					setTimeout(() =>
					{
						$(dateTimePicker.element).val(`${operatorName} ${cellValue}`);
					}, 0);
				}
			}
		});
	}

	QuickFilterViewModel.prototype.dateQuickFilterHideSwitch = function ($dateTimeElem, isQuickDateFilter, newType)
	{
		if (!isQuickDateFilter)
		{
			$dateTimeElem.find('.date-number').css('display', 'none');
			let originalEl = $dateTimeElem.find('.input-group');
			originalEl.css('display', '');
			let originalInput = originalEl.find('.k-input');

			if (originalInput.length > 0)
			{
				originalInput.css('width', '100%');
				originalInput[0].disabled = false;
				originalInput.val(this.getDateQuickFilterTypeHint(newType, null));
				originalInput.css('display', 'block');
			}
		}
		else
		{
			$dateTimeElem.find('.input-group').css('display', 'none');
			let dateNumberEl = $dateTimeElem.find('.date-number');
			dateNumberEl.css('display', 'block');
			dateNumberEl.removeClass("k-input");
			dateNumberEl.val("");
			dateNumberEl.css('width', '100%');
			let clearButton = $dateTimeElem.parent().find('.clearButton');
			if (clearButton && clearButton.length > 0)
			{
				clearButton.css('right', '0');
			}
		}
	}

	/**
	 * When the field dragging action is complete this must be called for cleaning up the different element for quick date filter.
	 * @return {void}
	 * @param filterField - Entire field and related filter info
	 */
	QuickFilterViewModel.prototype.quickDateFilterOnDragHandler = function (filterField)
	{
		const filterType = filterField.filterMenuData.filterType;
		const value = filterField.filterValue();
		const $dateTimeElem = this.$el.find(".text-input[role=" + filterField.role + "]");
		const $inputGroup = $dateTimeElem.find(".input-group");
		const isXValueType = this.quickDateFilterTypes.includes(filterField.filterMenuData.filterType);

		_quickDateFilterOnDragElementHandler.call(this, filterType, $dateTimeElem, value);

		if (_isNotDateTimeXValueFilterType(filterField.type, $dateTimeElem, isXValueType))
		{
			_hideDateNumberInput($dateTimeElem);
		}
		else if (this.isQuickDateFilter(filterField.filterMenuData.filterType))
		{
			_hideDatePickerButton($inputGroup, isXValueType, filterField);
			_showClearButton(isXValueType, $dateTimeElem);
			if (_isOnYearX(filterField))
			{
				_hideDateNumberInput($dateTimeElem);
			}
			else
			{
				_hideNotDateNumberInput($inputGroup);
			}
		}
	}

	function _quickDateFilterOnDragElementHandler(filterType, $dateTimeElem, value)
	{
		if (!this.isQuickDateFilter(filterType))
		{
			_handleNonQuickDateFilterOnDrag($dateTimeElem, value);
			return;
		}

		if (this.quickDateFilterTypesWithoutInput.includes(filterType))
		{
			_handleQuickDateFilterWithoutInputOnDrag.call(this, $dateTimeElem, filterType, value);
			return;
		}

		if (this.quickDateFilterTypes.includes(filterType))
		{
			_handleQuickDateFilterDateNumberInputOnDrag($dateTimeElem, value, filterType);
			return;
		}

		if (this.quickDateFilterTypesDateTimeOnly.includes(filterType))
		{
			$dateTimeElem.parent().find('.clearButton').css('right', '22');
		}
	}

	function _handleNonQuickDateFilterOnDrag($dateTimeElem, value)
	{
		let $inputGroupEl = _showOriginalInputElement($dateTimeElem, "input-group", null, '100%');
		_showOriginalInputElement($inputGroupEl, "k-input", value, '90%');
	}

	function _showOriginalInputElement($element, elClassName, val, width)
	{
		if (!$element)
		{
			return null;
		}
		let filterEl = $element.find("." + elClassName);
		if (filterEl.length > 0)
		{
			filterEl[0].disabled = false;
			filterEl.css('display', 'block');
			filterEl.css('width', width);
			if (val !== null)
			{
				filterEl.val(val);
			}
			return filterEl;
		}
		return null;
	}

	function _handleQuickDateFilterWithoutInputOnDrag($dateTimeElem, filterType, value)
	{
		let originalEl = $dateTimeElem.find('.input-group');
		originalEl.css('display', 'block');
		let dateFilterEl = $dateTimeElem.find('.k-input');
		if (dateFilterEl.length > 0)
		{
			dateFilterEl[0].disabled = true;
			dateFilterEl.css('disabled', 'disable');
			dateFilterEl.css('display', 'block');
			dateFilterEl.css('width', '90%');
			dateFilterEl.val(this.getDateQuickFilterTypeHint(filterType, value));
		}
	}

	function _handleQuickDateFilterDateNumberInputOnDrag($dateTimeElem, value, filterType)
	{
		let originalEl = $dateTimeElem.find('.input-group');
		originalEl.css('display', 'none');

		let originalInput = $($dateTimeElem.find('.date-number'));

		if (originalInput.length > 0)
		{
			originalInput[0].disabled = false;
			originalInput.css('display', 'block');
			originalInput.css('width', '100%');
			if (value)
			{
				let pattern = TF.Grid.LightKendoGrid.OperatorWithDateTime.string[filterType];
				// format display strip s with (s) for grammar compatibility.
				if (pattern.indexOf("X") > -1 && pattern.endsWith("s"))
				{
					pattern = pattern.substring(0, pattern.length - 1) + "(s)";
				}
				let maskVal = pattern ? pattern.replace("X", value) : "";
				originalInput.val(maskVal);
			}
		}
	}

	function _isNotDateTimeXValueFilterType(filterType, $filterEl, isXValueType)
	{
		return (!['date', 'datetime'].includes(filterType.toLowerCase()) || !isXValueType);
	}

	function _hideDateNumberInput($filterEl)
	{
		let extraInputForSpecialDate = $filterEl.find(".date-number");
		if (extraInputForSpecialDate && extraInputForSpecialDate.length > 0)
		{
			$(extraInputForSpecialDate).css('display', 'none');
		}
	}

	function _hideDatePickerButton(inputGroup, isXValueType, filter)
	{
		if (inputGroup && inputGroup.length > 0)
		{
			let datepicker = inputGroup.find('.datepickerbutton');
			if (datepicker && datepicker.length > 0 && (isXValueType || filter.filterMenuData.filterType === 'onyearx'))
			{
				datepicker.css('display', 'none');
			}
		}
	}

	function _showClearButton(isXValueType, $filterEl)
	{
		if (isXValueType)
		{
			let clearButton = $filterEl.find('.clearButton');
			if (clearButton && clearButton.length > 0)
			{
				clearButton.css('display', 'normal');
			}
		}
	}

	function _isOnYearX(filter)
	{
		return (filter.filterMenuData.filterType !== 'onyearx');
	}

	function _hideNotDateNumberInput(inputGroup)
	{
		inputGroup.css('display', 'none');
	}

	QuickFilterViewModel.prototype.dateQuickFilterElementEditorInit = function (el)
	{
		let $input = this.$el.find(".text-input[role=" + el.role + "]");
		let $inputElem = $input.find('.text-input-group');

		if (this.quickDateFilterTypes.includes(el.type) &&
			this.quickDateFilterTypes.includes(el.filterMenuData?.filterType))
		{
			let $dateTimeElem = $inputElem.find('.input-group').find('.k-input');
			if ($dateTimeElem && $dateTimeElem.length === 1)
			{
				$dateTimeElem.css('display', 'none');
			}

			$inputElem.parent().find('.clearButton').css('right', '0');
			this.quickDateFilterElement($inputElem, el);
		}
		if (this.quickDateFilterTypesWithoutInput.includes(el.type) &&
			this.quickDateFilterTypesWithoutInput.includes(el.filterMenuData?.filterType))
		{
			let $dateTimeElem = $inputElem.find('.input-group').find('.k-input');
			if ($dateTimeElem.length > 0)
			{
				$dateTimeElem.val(this.getDateQuickFilterTypeHint(el.type, el.filterValue()));
				$dateTimeElem[0].disabled = true;
			}
		}

		if (this.quickDateFilterTypesDateTimeOnly.includes(el.filterMenuData?.filterType))
		{
			let input = $inputElem.find('.input-group .k-input');
			input.val(el.filterValue());
			this.addDateTimePickerFormatForSpecialFields(input, el.filterMenuData?.filterType);
		}
	}

	/**
	 * When filter menu change.
	 * @param {object} e EventData .
	 * @param {object} result Which filter type is selected.
	 * @return {void}
	 */
	QuickFilterViewModel.prototype.filterMenuChange = function (e, result)
	{
		let index = this.index,
			self = this.self,
			field = self.obFields()[index],
			$input = self.$el.find(".text-input[role=" + field.role + "]"),
			oldType = field.filterType(),
			hasChanged = (oldType !== result.type);

		field.filterType(result.type);
		field.filterStyle(result.style);

		if (result.type === "list")
		{
			if (hasChanged) { self.resetFilterInput(field); }
			self.openListFilter(field, hasChanged);
		}
		else
		{
			self.resetFilterInput(field);
			if (result.type === "custom")
			{
				self.LaunchCustomFilter(field, $input, false);
			}
			else if (result.type === "isempty" ||
				result.type === "isnotempty" ||
				oldType === "isempty" ||
				oldType === "isnotempty" ||
				self.quickDateFilterTypes.includes(oldType) ||
				self.quickDateFilterTypes.includes(result.type) ||
				self.quickDateFilterTypesWithoutInput.includes(oldType) ||
				self.quickDateFilterTypesWithoutInput.includes(result.type))
			{
				self.notifyFilterChange();
			}
			self.filterMenuChangeOnQuickDateFilter(oldType, result.type, $input, field);
		}
	};

	QuickFilterViewModel.prototype.filterMenuChangeOnQuickDateFilter = function (oldType, newType, $input, field)
	{
		let self = this;

		const switchInput = (disable) =>
		{
			let $dateTimeElem = $input.find('.text-input-group').find('.input-group').find('.k-input');
			if ($dateTimeElem && ($dateTimeElem.length === 1))
			{
				$dateTimeElem[0].disabled = disable;
				$dateTimeElem.val(self.getDateQuickFilterTypeHint(newType));
			}
		}

		if (self.quickDateFilterTypes.includes(oldType) &&
			!self.quickDateFilterTypes.includes(newType))
		{
			let $dateTimeElem = $input.find('.text-input-group');
			self.dateQuickFilterHideSwitch($dateTimeElem, false, newType);  // switch to normal filter.
		}

		if (self.quickDateFilterTypes.includes(newType))
		{
			let $dateTimeElem = $input.find('.text-input-group');
			if ($dateTimeElem.find('.date-number').length === 1)
			{
				// quick date filter already created.
				self.dateQuickFilterHideSwitch($dateTimeElem, true, newType);  // switch to quick date filter.
			}
			else
			{
				// quick date filter not yet created, need to create new.
				$input.removeClass('DateTime');
				self.quickDateFilterElement($dateTimeElem, field);  // create new quick date filter.
			}
			return;
		}

		if (self.quickDateFilterTypesWithoutInput.includes(oldType))
		{
			switchInput(false);
		}

		// if it's one of quickDateFilterTypesWithoutInput types, then disable the input and calendar selector.
		if (self.quickDateFilterTypesWithoutInput.includes(newType))
		{
			switchInput(true);
		}

		if (self.quickDateFilterTypesDateTimeOnly.includes(newType))
		{
			let $dateTimeElem = $input.find('.text-input-group').find('.input-group');
			if ($dateTimeElem && ($dateTimeElem.length === 1))
			{
				let datepicker = $dateTimeElem.find('.datepickerbutton');
				if (datepicker && datepicker.length === 1)
				{
					$(datepicker).css('display', 'normal');
				}
			}
		}
	}

	/**
	 * Launch custom filter
	 * @param {Object} field The data field object.
	 * @param {jQuery} $input The input element.
	 * @param {boolean} noDisplay Whether the custom filter panel should display.
	 * @return {void}
	 */
	QuickFilterViewModel.prototype.LaunchCustomFilter = function (field, $input, noDisplay)
	{
		var self = this;
		if (!field.customFilter)
		{
			self.createCustomFilter(field, !noDisplay);
		}
		else if ($input && !noDisplay)
		{
			$input.find(".custom-filter").addClass("active");
		}

		field.customActive(true);
		field.customFilter.changeType(field.selectField().FieldName, self.typeCodeMenuEmun[field.typeCode().toLowerCase()], field.typeCode());
	};

	/**
	 * Create the custom filter modal.
	 * @param {object} field The data of the field which attempts to open the modal.
	 * @return {void}
	 */
	QuickFilterViewModel.prototype.createCustomFilter = function (field, shouldDisplay)
	{
		var self = this;
		field.customFilter = new TF.Map.Thematics.CustomFilterViewModel(
			self.dataType,
			field.role,
			field.selectField().FieldName,
			self.typeCodeMenuEmun[self.fieldType(field.type)],
			field.typeCode());
		field.customFilter.onCustomFilterInit.subscribe(function (e, $el)
		{
			$el.toggleClass("active", shouldDisplay)
		});
		field.customFilter.onCustomFilterApply.subscribe(function (e, result)
		{
			field.filterSet = result.filterSet;
			field.filterValue(result.value);
		});
	};

	/**
	 * Open the list filter modal.
	 * @param {object} field The data of the field which attempts to open the modal.
	 * @return {Promise}
	 */
	QuickFilterViewModel.prototype.openListFilter = function (field, isNew)
	{
		var self = this, filterSet, value,
			columnObj = field.selectField(),
			fieldName = columnObj.FieldName,
			listFilterTemplate = columnObj.ListFilterTemplate;

		return self.listFilterTool.open(fieldName, listFilterTemplate, isNew).then(function (filterSet)
		{
			if (filterSet)
			{
				field.filterSet = listFilterTemplate.ConvertListFilterSet ? listFilterTemplate.ConvertListFilterSet(filterSet, self.dataType) : filterSet;
				field.filterValue(filterSet.Value);
			}
		});
	};

	/**
	 * Reset filter menu and input.
	 * @param {object} field the field info include filter info.
	 * @return {void}
	 */
	QuickFilterViewModel.prototype.changeFilter = function (field)
	{
		let self = this, selectField = field.selectField();
		field.discardDefaultValue = self.discardDefaultValue;
		if (selectField && selectField.FieldName)
		{
			let isQuickDateFilter = self.isQuickDateFilter(selectField.type);
			field.filterMenuData.changeType(selectField.FieldName, self.typeCodeMenuEmun[self.fieldType(selectField.type)], isQuickDateFilter);
			field.type = selectField.type;
			field.filterDisabled(false);
			field.typeCode(self.typeCodeEmun[self.fieldType(self.fieldType(selectField.type))]);

			if (self.obFields()[field.index + 1])
			{
				self.obFields()[field.index + 1].disabled(false);
			}
		}
		else
		{
			field.type = "string";
			field.typeCode("String");
			field.filterDisabled(true);

			if (self.obFields()[field.index + 1] && self.obFields()[field.index + 1].selectFieldText())
			{
				self.obFields()[field.index + 1].disabled(false);
			}
		}

		field.filterType(field.typeCode() === "String" ? "contains" : "eq");
		field.filterStyle(TF.Grid.LightKendoGrid.prototype.operatorKendoMapFilterNameValue[field.filterType()]);

		self.resetFilterInput(field);
	};


	/**
	 * get field type for UDF(user defined feild).
	 * @param {object} feild the feild type include the type from database and user defined feild.
	 * @return {String}
	 */
	QuickFilterViewModel.prototype.fieldType = function (type)
	{
		switch (type)
		{
			case 'date/time':
				return 'datetime';
			case 'text':
			case 'phone number':
			case 'memo':
			case 'select':
			case 'list':
			case 'email':
				return 'string';
			case 'currency':
				return 'number';
			// case 'list': // to do list
			// 	return '';
			default:
				return type;
		}
	}

	/**
	 * Reset filter input.
	 * @param {object} field the field info include filter info.
	 * @return {void}
	 */
	QuickFilterViewModel.prototype.resetFilterInput = function (field)
	{
		var self = this, $input = self.$el.find(".text-input[role=" + field.role + "]");
		$input.off('keydown').on('keydown', function (e)
		{
			// Capture enter key
			if (e.keyCode === 13)
			{
				e.stopPropagation();
			}
		})
		field.filterSet = null;
		const filterValue = ["Date","DateTime"].indexOf(field.typeCode()) > -1 ? null : "";
		field.filterValue(filterValue);
	};

	/**
	 * Get initialized fields' info.
	 * @return {object} the fields' info
	 */
	QuickFilterViewModel.prototype.getInitFields = function ()
	{
		var self = this, isEnabled, filterInfo, idx, fieldTemp,
			fields = [],
			dataType = self.dataType,
			filterInfoList = self.filtersInfo;

		for (var i = 0; i < self.fieldCount; i++)
		{
			isEnabled = (i == 0);
			fields.push(self.createEmptyField(i, dataType, !isEnabled));
		}

		if (filterInfoList)
		{
			for (idx = 0; idx < filterInfoList.length; idx++)
			{
				filterInfo = filterInfoList[idx];
				fieldTemp = fields[idx];
				if (!fieldTemp)
				{
					continue;
				}
				fieldTemp.disabled(false);

				if (!self.getFieldObjectByName(filterInfo.field) || !filterInfo.field)
				{
					filterInfoList.splice(idx, 1);
					idx--
					continue;
				}

				self.applyFilterInfoToField(filterInfo, fieldTemp);
			}

			if (filterInfoList.length < 3)
			{
				fields[filterInfoList.length].disabled(false);
			}
		}

		return fields;
	};

	/**
	 * Apply filter info to a field.
	 * @param {Object} filterInfo The filter info data object.
	 * @param {Object} field The field to apply the filter info.
	 * @return {void}
	 */
	QuickFilterViewModel.prototype.applyFilterInfoToField = function (filterInfo, field)
	{
		var self = this, filterValue = "", filterSet, typeCode, filterStyle;

		selectedColumnObj = self.getFieldObjectByName(filterInfo.field);
		typeCode = self.typeCodeEmun[self.fieldType(selectedColumnObj.type)];
		filterStyle = TF.Grid.LightKendoGrid.prototype.operatorKendoMapFilterNameValue[filterInfo.filterType];

		field.selectField(selectedColumnObj);
		field.selectFieldText(selectedColumnObj.DisplayName || selectedColumnObj.FieldName);
		field.filterType(filterInfo.filterType);
		let isQuickDateFilter = self.isQuickDateFilter(selectedColumnObj.type);
		field.filterMenuData.changeType(filterInfo.field, self.typeCodeMenuEmun[self.fieldType(selectedColumnObj.type)], filterInfo.filterType, isQuickDateFilter);
		field.filterStyle(filterStyle);
		field.typeCode(typeCode);
		field.filterDisabled(false);
		field.type = self.typeCodeMenuEmun[self.fieldType(selectedColumnObj.type)];

		if (filterInfo.filterValue !== undefined && filterInfo.filterValue !== "")
		{
			if (filterInfo.filterType === "custom")
			{
				filterSet = JSON.parse(filterInfo.filterValue);
				field.filterSet = filterSet;

				self.LaunchCustomFilter(field, null, true);
				field.customFilter.updateInfo(filterSet);
				filterValue = field.customFilter.obDisplayValue();
			}
			else if (filterInfo.filterType === "list")
			{
				filterSet = JSON.parse(filterInfo.filterValue);
				field.filterSet = filterSet;
				var listFilterTemplate = field.selectField().ListFilterTemplate;
				if (listFilterTemplate && listFilterTemplate.ConvertFilterValueList)
				{
					filterValue = JSON.parse(listFilterTemplate.ConvertFilterValueList(filterSet)).join(",");
				}
				else
				{
					filterValue = filterSet.Value;
				}
			}
			else
			{
				filterValue = filterInfo.filterValue;
			}
		}
		field.filterValue(filterValue);
	};

	/**
	 * Create an empty data field object.
	 * @param {number} fieldIdx The index of the data field.
	 * @param {string} dataType The grid data type.
	 * @param {Boolean} isDisabled Whether the data field should be dissabled.
	 * @return {object} The empty data field object.
	 */
	QuickFilterViewModel.prototype.createEmptyField = function (fieldIdx, dataType, isDisabled)
	{
		let self = this, result,
			role = "field-role-" + (fieldIdx + 1),
			filterMenuData = new TF.Map.Thematics.FilterMenuViewModel(dataType, role);

		filterMenuData.onFilterChange.subscribe(self.filterMenuChange.bind({ index: fieldIdx, self: self }));

		result = {
			"index": ko.observable(fieldIdx),
			"role": role,
			"title": ko.observable("Field " + (fieldIdx + 1)),
			"fields": ko.observableArray(self.getAvailableOptions()),
			"selectField": ko.observable(self.emptyColumn),
			"selectFieldText": ko.observable(self.emptyColumn.DisplayName),
			"filterMenuData": filterMenuData,
			"disabled": ko.observable(isDisabled),
			"filterDisabled": ko.observable(true),
			"filterType": ko.observable("contains"),
			"filterStyle": ko.observable("contains"),
			"type": "string",
			"typeCode": ko.observable("String"),
			"filterValue": ko.observable(""),
			"autocompletion": ko.observableArray([]),
			"customActive": ko.observable(false),
			"filterSet": null
		};

		let filterValue = "";

		result.filterValue.subscribe(function (value)
		{
			//special, the string '1234' is same to int 1234 on this function.
			let valueString = (value !== null && value !== undefined) ? Number(value) ? Number(value).toString() : value.toString() : "";

			if (!self.quickDateFilterTypes.includes(result.filterType()) &&
				!self.isValidSQLDateTime(result.type, valueString, result.filterType()))
			{
				return;
			}

			if (filterValue !== valueString)
			{
				filterValue = valueString;
				self.notifyFilterChange();
				$(".autocompletion[role = '" + result.role + "']").removeClass("active");
			}
		});

		result.filterDisabled.subscribe(self.UpdateLastEnableDargHandleStyle.bind(self));
		return result;
	};

	/**
	 * Find the last enbale drag icon which was shown, and change this to be pointing up
	 * @return {void}
	 */
	QuickFilterViewModel.prototype.UpdateLastEnableDargHandleStyle = function ()
	{
		var self = this, index;
		self.obFields().forEach(function (item)
		{
			if (!item.filterDisabled())
			{
				index = item.index();
			}
		});
		if (index !== undefined)
		{
			self.$el.find(".field-item").removeClass("last-enable");
			self.$el.find(".field-item[index=" + index + "]").addClass("last-enable");
		}
	};

	/**
	 * Whether the dateTime is valid.
	 * @param {string} type The data type.
	 * @param {string} value The value.
	 * @return {boolean} Whether it is valid.
	 */
	QuickFilterViewModel.prototype.isValidSQLDateTime = function (type, value, filterType)
	{
		if (filterType === "custom")
		{
			return true;
		}
		if (type === "date" || type === "time" || type === "datetime")
		{
			if (moment("1/1/1753") > moment(value) || moment("12/31/9999") < moment(value) || (!moment(value).isValid() && value))
			{
				return false;
			}
		}
		else if (type === "integer" && value)
		{
			if (isNaN(parseInt(value)))
			{
				return false;
			}
		}
		else if (type === "number" && value)
		{
			if (isNaN(parseFloat(value)))
			{
				return false;
			}
		}
		return true;
	}

	/**
	 * The filter menu events init.
	 * @return {void}
	 */
	QuickFilterViewModel.prototype.filterMenuEventsInit = function ()
	{
		var self = this;
		$("body").on("mousedown.closeFilterMenu", function (e)
		{
			var role = $(e.target).closest(".menu-button").attr("role"), $menu = self.$el.find(".filter-menu");
			for (var i = 0; i < $menu.length; i++)
			{
				if ($($menu[i]).attr("role") != role || !role)
				{
					$($menu[i]).removeClass("active");
				}
			}
		});
	};

	/**
	 * The autocompletion events init.
	 * @return {void}
	 */
	QuickFilterViewModel.prototype.autoncompletionEventsInit = function ()
	{
		var self = this;
		$("body").on("mousedown.closeAutocompletion", function (e)
		{
			var role = $(e.target).closest(".text-input").attr("role"), $menu = self.$el.find(".autocompletion");
			for (var i = 0; i < $menu.length; i++)
			{
				if ($($menu[i]).attr("role") != role || !role)
				{
					$($menu[i]).removeClass("active");
				}
			}
		});
	};

	/**
	 * The custom filter events init.
	 * @return {void}
	 */
	QuickFilterViewModel.prototype.customfilterEventsInit = function ()
	{
		var self = this;
		$("body").on("mousedown.closeCustomFilter", function (e)
		{
			let target = $(e.target);
			if (target.hasClass("bootstrap-datetimepicker-overlay") || target.closest(".k-calendar-container").length > 0)
			{
				return;
			}
			var role = target.closest(".custom-filter-group").attr("role"), $menu = self.$el.find(".custom-filter");
			for (var i = 0; i < $menu.length; i++)
			{
				if ($($menu[i]).attr("role") != role || !role)
				{
					$($menu[i]).removeClass("active");
				}
			}
		});
	};

	/**
	 * The filter menu button click event.
	 * @param {object} model data model.
	 * @param {object} e element.
	 * @return {void}
	 */
	QuickFilterViewModel.prototype.filterMenuButtonClick = function (model, e)
	{
		var self = this, $filterMenu = $(e.currentTarget).next(".filter-menu"),
			$activeFilter = $filterMenu.find("li." + model.filterStyle());
		$filterMenu.find("li").removeClass("active");
		if ($activeFilter && !$activeFilter.hasClass("active"))
		{
			$activeFilter.addClass("active");
		}
		$filterMenu.toggleClass("active");
	};

	/**
	 * The clear button which is in filter textbox click event.
	 * @param {object} model data model.
	 * @param {object} e element.
	 * @return {void}
	 */
	QuickFilterViewModel.prototype.clearButtonClick = function (model, e)
	{
		let data = this;
		if (data.customFilter && data.filterType() === "custom")
		{
			data.customFilter.reset(data.typeCode());
		}
		let $textInput = $(e.target).parent().find('.text-input-group');
		if ($textInput.length === 1)
		{
			let $quickDateFilter = $textInput.find(".date-number");
			if ($quickDateFilter.length === 1)
			{
				$quickDateFilter.val("");
			}
		}
		data.filterSet = null;
		data.filterValue("");
	};

	/**
	 * autocompletion mouse down event.
	 * @return {void}
	 */
	QuickFilterViewModel.prototype.autocompletionMouseDownEvent = function ()
	{
		this.focusInAutoCompletion = true;
	};

	/**
	 * Open the custom filter menu.
	 * @param {object} model data model.
	 * @param {object} e element.
	 * @return {void}
	 */
	QuickFilterViewModel.prototype.filterCustomButtonClick = function (model, e)
	{
		$(e.currentTarget).next(".custom-filter").toggleClass("active");
	};

	/**
	 * Select autocompletion item event.
	 * @param {object} model data model.
	 * @param {object} e element.
	 * @return {void}
	 */
	QuickFilterViewModel.prototype.autocompletionItemClick = function (model, e)
	{
		var self = this.parents[1], data = this.data, dataModel = this.parents[0];
		self.focusInAutoCompletion = false;
		dataModel.filterValue(data);
		$(e.currentTarget).closest(".autocompletion").removeClass("active");
	};

	/**
	 * The filter text input event.
	 * @param {object} model data model.
	 * @param {object} e element.
	 * @return {void}
	 */
	QuickFilterViewModel.prototype.filterTextInput = function (model, e)
	{
		var self = this.parent, data = this.data, $target = $(e.currentTarget);
		if (self.dataType == "gpsevent") { return; }
		if (data.typeCode() === "String" && $target.val())
		{
			var searchParameters = self.getDefaultSearchParameters(),
				paramData = { FieldName: data.selectField().FieldName, AggregateOperator: 'Distinct100' };

			searchParameters.fields.push(data.selectField().FieldName);
			searchParameters.filterSet.FilterItems.push({
				FieldName: data.selectField().FieldName,
				Operator: "Contains",
				Value: $target.val()
			});

			if (self.dataType === "fieldtrip")
			{
				if (self.pageType === "approvals")
				{
					paramData["filterType"] = 'permission';
				} else if (self.pageType === "myrequests") 
				{
					paramData["filterType"] = 'submitted';
				}
			}

			var options = { data: searchParameters, paramData: paramData }, $loading = $target.closest(".text-input").find(".k-loading");

			$loading.addClass("active");
			tf.ajax["post"](pathCombine(tf.dataTypeHelper.getSearchApiPrefix(self.dataType), "aggregate"), options, { overlay: false }).then(function (result)
			{
				var $autocompletion = $target.closest(".text-input").find(".autocompletion");
				if (result.Items[0] && result.Items[0].length > 0)
				{
					data.autocompletion(result.Items[0]);
					if (!$autocompletion.hasClass("active"))
					{
						$autocompletion.addClass("active");
					}
				}
				else
				{
					data.autocompletion([]);
					if ($autocompletion.hasClass("active"))
					{
						$autocompletion.removeClass("active");
					}
				}
				$loading.removeClass("active");
			});
		}
	};

	QuickFilterViewModel.prototype.adjustCalendarPosition = function (target, calendar)
	{
		if (!(calendar instanceof $)) return;

		if (calendar.is(".bootstrap-datetimepicker-widget"))
		{
			var zindex = Math.max(...Array.from(target.parents()).map(el => parseInt($(el).css("z-index"))).filter(x => !Number.isNaN(x)));

			var rect = target.closest(".text-input-group")[0].getBoundingClientRect();

			calendar.css({
				"z-index": zindex + 1,
				top: rect.bottom - 1,
				left: rect.left + rect.width - calendar.width()
			});
		} else
		{
			setTimeout(() =>
			{
				var zindex = Math.max(...Array.from(target.parents()).map(el => parseInt($(el).css("z-index"))).filter(x => !Number.isNaN(x)));

				var rect = target.closest(".text-input-group")[0].getBoundingClientRect();

				calendar.closest(".k-animation-container").css({
					"z-index": zindex + 1,
					top: rect.bottom - 1,
					left: rect.left + rect.width - calendar.closest(".k-animation-container").width()
				});
			}, 0);
		}
	};

	/**
	 * Triggered when field selected option is changed.
	 * @param {object} model ViewModel.
	 * @param {object} e EventData.
	 * @return {void}
	 */
	QuickFilterViewModel.prototype.onFieldSelectChange = function (model, e)
	{
		const hideQuickDateFilterOnInit = (self, role) =>
		{
			let $input = self.$el.find(".text-input[role=" + role + "]");
			let $inputElem = $input.find('.text-input-group');
			let $dateTimeElem = $inputElem.find('.date-number');
			if ($dateTimeElem.length === 1)
			{
				$dateTimeElem.css('display', 'none');
			}
			let $inputGroupElem = $inputElem.find('.input-group');
			if ($inputGroupElem.length === 1)
			{
				$inputGroupElem.css('display', 'block');
				let $input = $inputGroupElem.find('.k-input');
				if ($input.length > 0)
				{
					displayFilterInputElem($input);
				}
				else
				{
					$input = $inputGroupElem.find('.quick-filter-input');
					let $timeTypeInput = $input?.attr('data-tf-input-type');
					if ($timeTypeInput && $timeTypeInput === 'Time')
					{
						displayFilterInputElem($input);
					}
				}
			}
		}

		const displayFilterInputElem = ($input) =>
		{
			$input[0].disabled = false;
			$input.css({ 'width': '90%', 'display': 'block' });
			$input.val("");
		}

		var self = this.parent,
			fieldData = this.data,
			selectedColumn,
			isEmpty = false,
			selectedValue = model.value(),
			idx = fieldData.index();

		if (selectedValue === "(None)")
		{
			self.selectedFields[idx] = false;
			isEmpty = true;
		}
		else
		{
			selectedColumn = self.getFieldObjectByName(selectedValue);
			self.selectedFields[idx] = selectedColumn.FieldName;
		}

		hideQuickDateFilterOnInit(self, fieldData.role);
		self.shouldDoFilter = false;
		self.changeFilter(fieldData);
		self.resetFieldDisableStatus(idx, isEmpty);
		self.resetDataFieldDropdownOptions(idx);

		self.shouldDoFilter = true;
		self.notifyFilterChange();
	};

	/**
	 * Reset the "disabled" status for data fields.
	 * @param {number} fieldIdx The index of the data field.
	 * @param {Boolean} isEmpty Whether the data field's input is empty.
	 * @return {void}
	 */
	QuickFilterViewModel.prototype.resetFieldDisableStatus = function (fieldIdx, isEmpty)
	{
		var self = this, idx,
			selector = ".field-item",
			nextField;

		// If a field is cleared, all after field that have values should be lifted up to fill the empty position.
		if (fieldIdx > self.fieldCount - 2) { return; }
		else if (isEmpty)
		{
			idx = fieldIdx + 1;
			while (idx < self.obFields().length)
			{
				if (!self.isFieldEmptyAtIndex(idx))
				{
					self.moveDataFieldForward(idx);
				}
				else
				{
					self.obFields()[idx].disabled(true);
					break;
				}
				idx++;
			}
		}
		else
		{
			self.obFields()[fieldIdx + 1].disabled(false);
		}
	};

	/**
	 * Reset the drop-downs for data fields.
	 * @return {void}
	 */
	QuickFilterViewModel.prototype.resetDataFieldDropdownOptions = function (index)
	{
		var self = this, idx;

		for (idx = 0; idx < self.obFields().length; idx++)
		{
			self.obFields()[idx].fields(self.getAvailableOptions(self.obFields()[idx].selectField().FieldName));
		}
	};

	/**
	 * Get available data columns (not selected yet).
	 * @return {Array} The filtered data columns.
	 */
	QuickFilterViewModel.prototype.getAvailableOptions = function (fieldName)
	{
		var self = this;

		return self.availableFieldOptions.filter(function (item)
		{
			if (fieldName === "DisabililityCode" || fieldName === "EthnicCode")
			{
				return self.selectedFields.indexOf(item.FieldName) === -1;
			}
			else
			{
				if (self.selectedFields.indexOf("DisabililityCode") >= 0 || self.selectedFields.indexOf("EthnicCode") >= 0)
				{
					if (item.FieldName === "DisabililityCode" || item.FieldName === "EthnicCode")
					{
						return false;
					}
				}
				return self.selectedFields.indexOf(item.FieldName) === -1;
			}
		});
	};

	/**
	 * Move the data field position a step forward.
	 * @param {number} curIndex The index of the data field that is to be moved.
	 * @return {void}
	 */
	QuickFilterViewModel.prototype.moveDataFieldForward = function (curIndex)
	{
		var self = this,
			targetIndex = curIndex - 1,
			dataType, fieldList, curDataField, targetField, isDisabled, availableOptions;

		if (curIndex < 0 || curIndex >= self.fieldCount
			|| targetIndex < 0 || targetIndex >= self.fieldCount) { return; }

		dataType = self.dataType;
		fieldList = self.obFields();

		fieldList[targetIndex] = self.copyFieldDataToAnother(fieldList[curIndex], fieldList[targetIndex]);
		self.selectedFields[targetIndex] = self.selectedFields[curIndex];

		fieldList[curIndex] = self.createEmptyField(curIndex, dataType, false);
		// self.copyFieldDataToAnother(self.createEmptyField(curIndex, dataType, false), fieldList[curIndex]);
		self.selectedFields[curIndex] = false;

		if ((curIndex + 1 < self.fieldCount) && self.isFieldEmptyAtIndex(curIndex + 1))
		{
			fieldList[curIndex + 1].disabled(true);
		}

		self.obFields(fieldList);
		self.UpdateLastEnableDargHandleStyle();
		self.bindDragAndDropEvent();
	};

	/**
	 * Copy all non-index-ralted content to another field.
	 * @param {object} fieldData The object to be copied.
	 * @param {object} targetField The object to be updated.
	 * @return {object} The updated data field object.
	 */
	QuickFilterViewModel.prototype.copyFieldDataToAnother = function (fieldData, targetField)
	{
		var self = this;

		targetField.selectField(fieldData.selectField());
		targetField.selectFieldText(fieldData.selectFieldText());
		targetField.disabled(fieldData.disabled());
		targetField.filterDisabled(fieldData.filterDisabled());
		targetField.filterType(fieldData.filterType());
		targetField.filterStyle(fieldData.filterStyle());
		targetField.typeCode(fieldData.typeCode());
		targetField.filterValue(fieldData.filterValue());
		targetField.autocompletion(fieldData.autocompletion());
		targetField.filterSet = fieldData.filterSet;
		targetField.type = fieldData.type;

		if (fieldData.filterType() === "custom")
		{
			var $input = self.$el.find(".text-input[role=" + targetField.role + "]"),
				filterInfo = fieldData.customFilter.getFiltersInfo();
			self.LaunchCustomFilter(targetField, $input, true);
			targetField.customFilter.updateInfo(filterInfo);
		}
		if (targetField.filterMenuData)
		{
			let isQuickDateFilter = self.isQuickDateFilter(fieldData.type);
			let fieldType = self.typeCodeMenuEmun[self.fieldType(fieldData.type)];
			if (!fieldType)
			{
				// handle undefined null when field dragging in UI is applied for UDF fields.
				fieldType = self.typeCodeMenuEmun[self.fieldType(fieldData.selectField().type)];
			}
			targetField.filterMenuData.changeType(fieldData.selectField().FieldName, fieldType, fieldData.filterType(), isQuickDateFilter);
		}
		return targetField;
	};

	/**
	 * Get the column object by its name.
	 * @param {string} displayName The FieldName or DisplayName of the selected data column.
	 * @return {object} The matched data column object.
	 */
	QuickFilterViewModel.prototype.getFieldObjectByName = function (value)
	{
		const self = this;

		for (let i = 0; i < self.dataColumns.length; i++)
		{
			let obj = self.dataColumns[i];
			if (obj.DisplayName === value || obj.FieldName === value)
			{
				return obj;
			}
		}
	};

	/**
	 * Check whether specified data field has user input value.
	 * @param {number} index The index of the data field to be checked.
	 * @return {Boolean} Whether the data field is empty.
	 */
	QuickFilterViewModel.prototype.isFieldEmptyAtIndex = function (index)
	{
		return this.obFields()[index].selectField().FieldName === this.emptyColumn.FieldName;
	};

	/**
	 * Click event handler for openListFilter button.
	 * @param {object} model The field data.
	 * @param {event} e The click event.
	 * @return {void}
	 */
	QuickFilterViewModel.prototype.openListFilterButtonClick = function (model, e)
	{
		this.openListFilter(model);
	};

	/**
	 * Fields drag and drop event.
	 * @return {void}
	 */
	QuickFilterViewModel.prototype.bindDragAndDropEvent = function ()
	{
		var self = this, distance = 100, $activeEl,
			fieldItems = self.$el.find(".field-item"),
			$dragItemTarget, dragItemOffset, dragItemIndex, lastMovedItemIndex, movedItemIndex = -1,
			postDragFieldItems = [];

		fieldItems.draggable({
			cursor: "move",
			handle: ".drag-handle",
			helper: function (event, ui)
			{
				return $(this).clone(true).width(283);
			},
			axis: "y",
			containment: self.$el,
			start: function (e)
			{
				var $item, itemOffset;
				$(".drag-handle").addClass("moving");
				//Sticky all field items offset before drag.
				fieldItems.each(function (index, item)
				{
					$item = $(item);
					itemOffset = $item.offset();
					$item.data("offset", itemOffset);
				});
				$(e.currentTarget).addClass("draggable-protoType");

				//If start drag, don't trigger click event.
				if (self.$activeEl)
				{
					self.$activeEl.blur();
					$activeEl = self.$activeEl;
					self.$activeEl = undefined;
					self.isDragActiveEl = true;
				}
			},
			drag: function (e, obj)
			{
				$dragItemTarget = self.$el.find(".ui-draggable-dragging");
				dragItemOffset = $dragItemTarget.offset();
				dragItemIndex = $dragItemTarget.attr("index");
				movedItemIndex = -1;
				var $item, itemOffset, itemIndex;
				//Find the position which is being dragged.
				fieldItems.each(function (index, item)
				{
					if (movedItemIndex !== -1)
					{
						return;
					}
					$item = $(item);
					itemIndex = $item.attr("index");
					itemOffset = $item.data("offset");
					if (Math.abs(dragItemOffset.top - itemOffset.top) < 30 &&
						Math.abs(dragItemOffset.left - itemOffset.left) < 250 &&
						!$item.find(".drag-handle").hasClass("disabled"))
					{
						movedItemIndex = itemIndex;
					}
				});
				//If no field item need to move
				if (movedItemIndex === -1)
				{
					return;
				}
				else if (movedItemIndex === dragItemIndex)
				{
					lastMovedItemIndex = null;
					//If the position which is being dragged is same to the start position. Reset all field items' position.
					fieldItems.each(function (index, item)
					{
						var top, originalTop;
						$item = $(item);
						itemIndex = $item.attr("index");
						itemOffset = $item.data("offset");

						originalTop = $item.css("top");
						$item.offset({ top: itemOffset.top });
						top = parseInt($item.css("top"));
						$item.css("top", originalTop);
						if (!$item.is(':animated'))
						{
							if (parseInt(originalTop) !== top)
							{
								$item.animate({
									top: top
								}, {
									duration: 150,
									complete: function ()
									{
									}
								});
							}
						}
					});
				}
				else
				{
					lastMovedItemIndex = movedItemIndex;
					//Move field item.
					fieldItems.each(function (index, item)
					{
						$item = $(item);
						itemIndex = $item.attr("index");
						itemOffset = $item.data("offset");
						var moveDistance = (movedItemIndex > dragItemIndex && movedItemIndex >= itemIndex && itemIndex > dragItemIndex) ? 0 - distance :
							(movedItemIndex < dragItemIndex && movedItemIndex <= itemIndex && itemIndex < dragItemIndex) ? distance : 0, top, originalTop;
						if (itemIndex === dragItemIndex)
						{
							moveDistance = (movedItemIndex - dragItemIndex) * distance;
						}

						originalTop = $item.css("top");
						$item.offset({ top: itemOffset.top + moveDistance });
						top = parseInt($item.css("top"));
						$item.css("top", originalTop);
						if (!$item.is(':animated'))
						{
							if (parseInt(originalTop) !== top)
							{
								$item.animate({
									top: top
								}, {
									duration: 150,
									complete: function ()
									{
									}
								});
							}
						}
					});
				}
			},
			stop: function (e)
			{
				var interval, dropItem = function ()
				{
					if (lastMovedItemIndex)
					{
						var $textInput;
						if ($activeEl)
						{
							var $textInput = $activeEl.closest(".text-input");
						}

						var itemIndex,
							fieldList = self.obFields(),
							selectFields = self.obFields().filter(function (field)
							{
								if (field.selectField() && field.selectField().FieldName)
								{
									itemIndex = field.index();
									return (lastMovedItemIndex > dragItemIndex && lastMovedItemIndex >= itemIndex && itemIndex >= dragItemIndex) ||
										(lastMovedItemIndex < dragItemIndex && lastMovedItemIndex <= itemIndex && itemIndex <= dragItemIndex);
								}
								return false;
							});
						if (selectFields.length > 1)
						{
							let selectField, length = selectFields.length - 1, selectedFieldText;
							self.shouldDoFilter = false;

							if (lastMovedItemIndex > dragItemIndex)
							{
								itemIndex = Number(selectFields[0].index());
								selectField = self.createEmptyField(itemIndex, self.dataType, false);
								selectField = self.copyFieldDataToAnother(selectFields[0], selectField);
								selectedFieldText = self.selectedFields[itemIndex];
								for (let i = 0; i < length; i++)
								{
									fieldList[itemIndex + i] = self.copyFieldDataToAnother(selectFields[i + 1], selectFields[i]);
									self.selectedFields[itemIndex + i] = self.selectedFields[itemIndex + i + 1];
								}
								fieldList[itemIndex + length] = self.copyFieldDataToAnother(selectField, selectFields[length]);
								self.selectedFields[itemIndex + length] = selectedFieldText;
							}
							else
							{
								itemIndex = Number(selectFields[length].index());
								selectField = self.createEmptyField(itemIndex, self.dataType, false);
								selectField = self.copyFieldDataToAnother(selectFields[length], selectField);
								selectedFieldText = self.selectedFields[itemIndex];
								for (let i = 0; i < length; i++)
								{
									fieldList[itemIndex - i] = self.copyFieldDataToAnother(selectFields[length - i - 1], selectFields[length - i]);
									self.selectedFields[itemIndex - i] = self.selectedFields[itemIndex - i - 1];
								}
								fieldList[itemIndex - length] = self.copyFieldDataToAnother(selectField, selectFields[0]);
								self.selectedFields[itemIndex - length] = selectedFieldText;
							}
							self.obFields(fieldList);
							self.bindDragAndDropEvent();
							self.shouldDoFilter = true;
							self.onFieldReordered.notify({ "startIndex": Number(dragItemIndex), "endIndex": Number(lastMovedItemIndex) });
							self.notifyFilterChange();

							fieldList.forEach(item => postDragFieldItems.push(item));
						}

						if ($textInput)
						{
							$activeEl = fieldItems.eq(lastMovedItemIndex).find(".text-input-group input");
							if ($textInput.hasClass("hideClearButton"))
							{
								$textInput.removeClass("hideClearButton");
								$activeEl.closest(".text-input").addClass("hideClearButton");
							}
							self.shouldDoFilter = false;
						}
					}
					var $item, itemOffset;
					fieldItems.each(function (index, item)
					{
						$item = $(item);
						itemOffset = $item.data("offset");
						$item.offset({ top: itemOffset.top });
					});
					$(e.target).removeClass("draggable-protoType");
					if ($activeEl)
					{
						$activeEl.focus();
					}
					$activeEl = undefined;
					lastMovedItemIndex = null;
					$(".drag-handle").removeClass("moving");

					// switch and clear up elements after dragging action.
					postDragFieldItems.forEach(item => self.quickDateFilterOnDragHandler(item));
				}, isAnimated = false;

				for (var i = 0; i < fieldItems.length; i++)
				{
					if ($(fieldItems[i]).is(':animated'))
					{
						isAnimated = true;
					}
				}

				if (isAnimated)
				{
					interval = setInterval(function ()
					{
						for (var i = 0; i < fieldItems.length; i++)
						{
							if ($(fieldItems[i]).is(':animated'))
							{
								return;
							}
						}
						dropItem();
						clearInterval(interval);
					}, 50);
				}
				else
				{
					dropItem();
				}
			}
		});
	};

	/**
	 * Dispose quick filter template.
	 * @return {void}
	 */
	QuickFilterViewModel.prototype.dispose = function ()
	{
		var self = this;
		self.onFilterChange.unsubscribeAll();
		self.$el.undelegate(".drag-handle", "mousedown");
		$("body").undelegate(".quick-filter-input", "blur.drag-handle");
		$("body").off("mousedown.closeFilterMenu");
		$("body").off("mousedown.closeAutocompletion");
		$("body").off("mouseup.drag-handle");
		self.obFields().map(function (field)
		{
			if (field.filterMenuData && typeof (field.filterMenuData.dispose) === "function")
			{
				field.filterMenuData.dispose();
			}

			if (field.customFilter && typeof (field.customFilter.dispose) === "function")
			{
				field.customFilter.dispose();
			}
		});
	};
})()

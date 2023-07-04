(function()
{
	createNamespace("TF.Map.Thematics").CustomFilterViewModel = CustomFilterViewModel;
	function CustomFilterViewModel(dataType, role, fieldName, type, filterType)
	{
		var self = this;
		self.dataType = dataType;
		self.fieldName = fieldName;
		self.filtersInfo = {};

		self.obFilterType = ko.observable(filterType);
		self.obRole = ko.observable(role);
		self.obType = ko.observable(type);

		self.obFirstFilterType = ko.observable("Equal To");
		self.obFirstFilterTypeCode = ko.observable("eq");
		self.obFirstFilterValue = ko.observable();
		self.laseFirstFilterTypeCode = "eq";
		self.lastFirstFilterValue = "";
		self.obFilterState = ko.observable("And");
		self.obFilterStateCode = ko.observable("and");
		self.lattFilterStateCode = "and";
		self.obSecondFilterType = ko.observable("Equal To");
		self.obSecondFilterTypeCode = ko.observable("eq");
		self.obSecondFilterValue = ko.observable();
		self.lastSecondFilterTypeCode = "eq";
		self.lastSecondFilterValue = "";
		self.obDisplayValue = ko.observable("");

		self.obFilterStateArray = ko.observableArray([{ "type": "and", style: "custom-and", "text": "And" }, { "type": "or", style: "custom-or", "text": "Or" }]);
		self.obFilterTypes = ko.computed(self.filterTypeComputer, self);

		//Events
		self.firstfilterClick = self.firstfilterClick.bind(self);
		self.secondfilterClick = self.secondfilterClick.bind(self);
		self.filterStateClick = self.filterStateClick.bind(self);
		self.applyClick = self.applyClick.bind(self);
		self.cancelClick = self.cancelClick.bind(self);

		self.init = self.init.bind(self);
		self.dispose = self.dispose.bind(self);
		self.changeType = self.changeType.bind(self);
		self.reset = self.reset.bind(self);
		self.getFiltersInfo = self.getFiltersInfo.bind(self);
		self.updateInfo = self.updateInfo.bind(self);

		//Init
		self.onCustomFilterInit = new TF.Events.Event();
		self.onCustomFilterApply = new TF.Events.Event();
	};

	/**
	 * Custom filter init.
	 * @param {object} model data model.
	 * @param {object} e element.
	 */
	CustomFilterViewModel.prototype.init = function(model, e)
	{
		var self = this;
		self.$el = $(e);
		self.filterMenuEventsInit();

		self.onCustomFilterInit.notify(self.$el);
	};

	/**
	 * Change field name and type.
	 * @param {string} fieldName field name.
	 * @param {string} type field type.
	 */
	CustomFilterViewModel.prototype.changeType = function(fieldName, type, filterType)
	{
		var self = this;
		self.fieldName = fieldName;
		self.obFilterType(filterType);
		self.obType(type);
		self.reset(filterType);
	};

	/**
	 * Update the custom filter based on filter info.
	 * @param {Object} filterInfo The filter info object.
	 * @return {void}
	 */
	CustomFilterViewModel.prototype.updateInfo = function(filterInfo)
	{
		if (!filterInfo) { return; }

		let self = this, filterSet,
			defaultType = "eq",
			defaultValue = "",
			firstFilterItem = filterInfo.firstFilter,
			secondFilterItem = filterInfo.secondFilter,
			filtertState = filterInfo.state,
			firstType = firstFilterItem ? firstFilterItem.type : defaultType,
			firstValue = firstFilterItem ? firstFilterItem.value : defaultValue,
			secondType = secondFilterItem ? secondFilterItem.type : defaultType,
			secondValue = secondFilterItem ? secondFilterItem.value : defaultValue,
			displayValue = "";

		self.obFirstFilterType(TF.Grid.LightKendoGrid.Operator2DisplayValue[firstType]);
		self.obFirstFilterTypeCode(firstType);
		self.obFirstFilterValue(firstValue);
		self.lastFirstFilterValue = firstValue;
		self.laseFirstFilterTypeCode = firstType;

		self.obSecondFilterType(TF.Grid.LightKendoGrid.Operator2DisplayValue[secondType]);
		self.obSecondFilterTypeCode(secondType);
		self.obSecondFilterValue(secondValue);
		self.lastSecondFilterValue = secondValue;
		self.lastSecondFilterTypeCode = secondType;

		if (filtertState)
		{
			self.obFilterState(filtertState === "or" ? "Or" : "And");
			self.obFilterStateCode(filtertState);
			self.lattFilterStateCode = filtertState;
		}

		self.filtersInfo = filterInfo;
		filterSet = self.createFilterSetObject(firstValue, firstType, secondValue, secondType, filtertState);

		const isFirstFilterNotEmpty = self.isNotEmptyFilter(firstValue, firstType);
		if (isFirstFilterNotEmpty)
		{
			displayValue += self.obFirstFilterType() + " " + firstValue;
		}

		const isSecondFilterNotEmpty = self.isNotEmptyFilter(secondValue, secondType);
		if (isSecondFilterNotEmpty)
		{
			if (filterSet.FilterItems.length > 0)
			{
				displayValue += " " + self.obFilterState().toUpperCase() + " ";
			}
			displayValue += self.obSecondFilterType() + " " + secondValue;
		}

		self.obDisplayValue(displayValue);

		self.onCustomFilterApply.notify({ filterSet: filterSet, value: displayValue });
	};

	/**
	 * Create the filterSet object for notification.
	 * @return {Object} The structured data object.
	 */
	CustomFilterViewModel.prototype.createFilterSetObject = function(firstValue, firstType, secondValue, secondType, operator)
	{
		var self = this,
			fieldName = self.fieldName,
			result = {
				"FilterItems": [],
				"FilterSets": [],
				"LogicalOperator": operator
			};

		if (self.isNotEmptyFilter(firstValue, firstType))
		{
			result.FilterItems.push({
				"FieldName": fieldName,
				"Operator": TF.Grid.LightKendoGrid.prototype.operatorKendoMapTF[firstType],
				"Value": firstValue
			});
		}
		if (self.isNotEmptyFilter(secondValue, secondType))
		{
			result.FilterItems.push({
				"FieldName": fieldName,
				"Operator": TF.Grid.LightKendoGrid.prototype.operatorKendoMapTF[secondType],
				"Value": secondValue
			});
		}
		return result.FilterItems.length > 0 ? result : null;
	};

	/**
	 * Check if this filter is not empty.
	 * @param {string} value The filter value.
	 * @param {string} type The filter type.
	 * @return {boolean} whether is has value.
	 */
	CustomFilterViewModel.prototype.isNotEmptyFilter = function(value, type)
	{
		return (value !== undefined && value !== null && (typeof (value) === "string" ? value.trim() : true)) || type === "isempty" || type === "isnotempty";
	};

	/**
	 * Reset custom filter info.
	 * @return {void}
	 */
	CustomFilterViewModel.prototype.reset = function(filterType)
	{
		var self = this;
		const filterValue = ["Date","DateTime"].indexOf(filterType) > -1 ? null : "";
		self.obFirstFilterType("Equal To");
		self.obFirstFilterTypeCode("eq");
		self.obFirstFilterValue(filterValue);
		self.laseFirstFilterTypeCode = "eq";
		self.lastFirstFilterValue = filterValue;
		self.obFilterState("And");
		self.obFilterStateCode("and");
		self.lattFilterStateCode = "and";
		self.obSecondFilterType("Equal To");
		self.obSecondFilterTypeCode("eq");
		self.obSecondFilterValue(filterValue);
		self.lastSecondFilterTypeCode = "eq";
		self.lastSecondFilterValue = filterValue;

		self.filtersInfo = {};
	};

	/**
	 * Gets the filter info.
	 * @param {*} ignoreUnit ignore unit of measurement when determining whether the settings changed 
	 * @return {Object} The filter info data object.
	 */
	CustomFilterViewModel.prototype.getFiltersInfo = function(ignoreUnit)
	{
		const self = this;

		const matchedField = tf.dataTypeHelper.getGridDefinition(self.dataType).Columns.find(x => x.UnitOfMeasureSupported && x.FieldName === self.fieldName);

		if (!matchedField)
		{
			return self.filtersInfo;
		}

		if (!tf.measurementUnitConverter.isNeedConversion(matchedField.UnitInDatabase))
		{
			return self.filtersInfo;
		}

		const result = $.extend(true, {}, self.filtersInfo);

		if (!ignoreUnit)
		{
			["firstFilter", "secondFilter"].forEach(key =>
			{
				if (result[key])
				{
					const value = tf.measurementUnitConverter.convert({
						originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Imperial,
						targetUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
						precision: matchedField.Precision || 2,
						isReverse: !!matchedField.UnitOfMeasureReverse,
						value: result[key].value
					});

					if (!Number.isNaN(value))
					{
						result[key].value = value;
					}
				}
			});
		}

		return result;
	};

	/**
	 * The filter menu events init.
	 * @return {void}
	 */
	CustomFilterViewModel.prototype.filterMenuEventsInit = function()
	{
		var self = this;
		$("body").on("mousedown.closeCustomFilterMenu." + self.obRole(), function(e)
		{
			var role = $(e.target).closest(".filter-menu").attr("role"), $menu = self.$el.find(".filter-menu-custom");
			for (var i = 0; i < $menu.length; i++)
			{
				var $selectMenu = $menu.eq(i);
				if ($selectMenu.attr("role") != role || !role)
				{
					$selectMenu.removeClass("active");
				}
			}
		});
	};

	/**
	 * Change filter menu type.
	 * @returns {object} the filter types' menu info
	 */
	CustomFilterViewModel.prototype.filterTypeComputer = function()
	{
		var self = this, filters = [],
			operator = TF.Grid.LightKendoGrid.BaseOperator[self.obType()];
		for (var i in operator)
		{
			filters.push({ "type": i, style: "custom-" + i, "text": operator[i] });
		}
		return filters;
	};

	/**
	 * the filter item click event.
	 * @param {object} model data model.
	 * @param {object} e element.
	 */
	CustomFilterViewModel.prototype.firstfilterClick = function(model, e)
	{
		var self = this;
		$(e.currentTarget).closest(".filter-menu-custom").removeClass("active");
		if (self.obFirstFilterTypeCode() !== model.type)
		{
			self.obFirstFilterType(model.text);
			self.obFirstFilterTypeCode(model.type);
			if (model.type === 'isnotempty' || model.type === 'isempty')
			{
				self.obFirstFilterValue("");
				self.$el.find(".first-value input").val('');
			}
		}
	};

	/**
	 * the filter item click event.
	 * @param {object} model data model.
	 * @param {object} e element.
	 */
	CustomFilterViewModel.prototype.secondfilterClick = function(model, e)
	{
		var self = this;
		$(e.currentTarget).closest(".filter-menu-custom").removeClass("active");
		if (self.obSecondFilterTypeCode() !== model.type)
		{
			self.obSecondFilterType(model.text);
			self.obSecondFilterTypeCode(model.type);
			if (model.type === 'isnotempty' || model.type === 'isempty')
			{
				self.obSecondFilterValue("");
				self.$el.find(".second-value input").val('');
			}
		}
	};

	/**
	 * the filter state click event.
	 * @param {object} model data model.
	 * @param {object} e element.
	 */
	CustomFilterViewModel.prototype.filterStateClick = function(model, e)
	{
		var self = this;
		$(e.currentTarget).closest(".filter-menu-custom").removeClass("active");
		if (self.obFilterStateCode() !== model.type)
		{
			self.obFilterState(model.text);
			self.obFilterStateCode(model.type);
		}
	};

	/**
	 * the filter menu click event.
	 * @param {object} model data model.
	 * @param {object} e element.
	 */
	CustomFilterViewModel.prototype.filterMenuClick = function(model, e)
	{
		var $filterMenu = $(e.currentTarget).next(".filter-menu-custom");
		if (!$filterMenu.hasClass("active"))
		{
			var $activeFilter = $filterMenu.find("li.custom-" + model);
			$filterMenu.find("li").removeClass("active");
			if ($activeFilter && !$activeFilter.hasClass("active"))
			{
				$activeFilter.addClass("active");
			}
		}
		$filterMenu.toggleClass("active");
	};

	/**
	 * The apply click event.
	 * @param {object} model data model.
	 * @param {object} e element.
	 */
	CustomFilterViewModel.prototype.applyClick = function(model, e)
	{
		this.applyCustomFilterSetting();
	};

	/**
	 * Apply current setting.
	 * @return {void} 
	 */
	CustomFilterViewModel.prototype.applyCustomFilterSetting = function()
	{
		let self = this,
			value = "",
			filterSet = {
				FilterItems: [],
				FilterSets: [],
				LogicalOperator: "and"
			},
			firstValue = self.obFirstFilterValue(),
			firstType = self.obFirstFilterTypeCode(),
			firstInputValue = self.$el.find(".first-value input").val().trim(),
			secondValue = self.obSecondFilterValue(),
			secondType = self.obSecondFilterTypeCode(),
			secondInputValue = self.$el.find(".second-value input").val().trim(),
			stateCode = self.obFilterStateCode();

		self.$el.removeClass("active");
		if (firstInputValue !== "" && !firstValue)
		{
			firstValue = self.lastFirstFilterValue;
			firstType = self.laseFirstFilterTypeCode;
		}
		self.obFirstFilterValue(firstValue !== null ? null : "");
		self.obFirstFilterValue(firstValue);

		const isFirstFilterNotEmpty = self.isNotEmptyFilter(firstValue, firstType);
		if (isFirstFilterNotEmpty)
		{
			value += self.obFirstFilterType() + " " + self.$el.find(".first-value input").val().trim();
			filterSet.FilterItems.push({
				FieldName: self.fieldName,
				Operator: TF.Grid.LightKendoGrid.prototype.operatorKendoMapTF[firstType],
				Value: firstValue
			});
			self.filtersInfo.firstFilter = {
				"type": firstType,
				"typeOperator": TF.Grid.LightKendoGrid.prototype.operatorKendoMapTF[firstType],
				"value": firstValue
			};
		}

		if (secondInputValue !== "" && !secondValue)
		{
			secondValue = self.lastSecondFilterValue;
			secondType = self.lastSecondFilterTypeCode;
		}
		self.obSecondFilterValue(secondValue !== null ? null : "");
		self.obSecondFilterValue(secondValue);
		const isSecondFilterNotEmpty = self.isNotEmptyFilter(secondValue, secondType);
		if (isSecondFilterNotEmpty)
		{
			if (filterSet.FilterItems.length > 0)
			{
				value += " " + self.obFilterState().toUpperCase() + " ";
				filterSet.LogicalOperator = stateCode;
				self.filtersInfo.state = stateCode;
			}
			value += self.obSecondFilterType() + " " + self.$el.find(".second-value input").val().trim();
			filterSet.FilterItems.push({
				FieldName: self.fieldName,
				Operator: TF.Grid.LightKendoGrid.prototype.operatorKendoMapTF[secondType],
				Value: secondValue
			});
			self.filtersInfo.secondFilter = {
				"type": secondType,
				"typeOperator": TF.Grid.LightKendoGrid.prototype.operatorKendoMapTF[secondType],
				"value": secondValue
			};
		}

		if (self.lastFirstFilterValue !== firstValue
			|| self.lastSecondFilterValue !== secondValue
			|| (self.laseFirstFilterTypeCode !== firstType && isFirstFilterNotEmpty)
			|| (self.lastSecondFilterTypeCode !== secondType && isSecondFilterNotEmpty)
			|| self.lattFilterStateCode !== stateCode)
		{
			self.lastFirstFilterValue = firstValue;
			self.laseFirstFilterTypeCode = firstType;
			self.lastSecondFilterValue = secondValue;
			self.lastSecondFilterTypeCode = secondType;
			self.lattFilterStateCode = stateCode;
			self.obDisplayValue(value);
			self.filtersInfo.displayValue = value;
			self.onCustomFilterApply.notify({ filterSet: filterSet.FilterItems.length > 0 ? filterSet : null, value: value });
		}
		else
		{
			self.obFirstFilterType(TF.Grid.LightKendoGrid.Operator2DisplayValue[self.laseFirstFilterTypeCode]);
			self.obFirstFilterTypeCode(self.laseFirstFilterTypeCode);
			self.obSecondFilterType(TF.Grid.LightKendoGrid.Operator2DisplayValue[self.lastSecondFilterTypeCode]);
			self.obSecondFilterTypeCode(self.lastSecondFilterTypeCode);
		}
	};

	/**
	 * The cancel click event.
	 * @param {object} model data model.
	 * @param {object} e element.
	 */
	CustomFilterViewModel.prototype.cancelClick = function(model, e)
	{
		var self = this;
		self.$el.removeClass("active");
	};

	/**
	 * Dispose custom filter template.
	 * @return {void}
	 */
	CustomFilterViewModel.prototype.dispose = function()
	{
		const self = this;
		self.onCustomFilterApply.unsubscribeAll();
		$("body").off("mousedown.closeCustomFilterMenu." + self.obRole());
	};
})()

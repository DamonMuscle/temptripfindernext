(function()
{
	createNamespace("TF.Map.Thematics").FilterMenuViewModel = FilterMenuViewModel;
	function FilterMenuViewModel(dataType, role, fieldName, type)
	{
		var self = this;
		self.fieldName = fieldName;
		self.dataType = dataType;
		self.filterType = "contains";

		self.obRole = ko.observable(role);
		self.obType = ko.observable(type);
		self.obFilters = ko.observableArray([]);

		//Events
		self.filterClick = self.filterClick.bind(self);
		self.init = self.init.bind(self);
		self.dispose = self.dispose.bind(self);

		self.onFilterChange = new TF.Events.Event();

		self.dataFieldHelper = new TF.Map.Thematics.DataFieldHelper();
	};

	/**
	 * Filter Menu init.
	 * @param {object} model data model.
	 * @param {object} e element.
	 */
	FilterMenuViewModel.prototype.init = function(model, e)
	{
		var self = this;
		self.$el = $(e);

		var timer;
		self.$el.closest(".menu-button").on("mouseenter.closeFilterMenu", function()
		{
			if (timer)
			{
				clearTimeout(timer);
			}
		});
		self.$el.closest(".menu-button").on("mouseleave.closeFilterMenu", function()
		{
			if (timer)
			{
				clearTimeout(timer);
			}
			timer = setTimeout(function()
			{
				self.$el.removeClass("active");
			}, 300);
		});
	};

	/**
	 * Change field name and type.
	 * @param {string} fieldName field name.
	 * @param {string} type field type.
	 * @param filterType
	 * @param isUDF
	 */
	FilterMenuViewModel.prototype.changeType = function(fieldName, type, filterType, isQuickDateFilter)
	{
		var self = this;
		self.fieldName = fieldName;
		if (filterType)
		{
			self.filterType = filterType;
		}
		else if (type === "string")
		{
			self.filterType = "contains";
		}
		else
		{
			self.filterType = "eq";
		}
		self.obType(type);
		self.updateFilter(isQuickDateFilter);
	};

	/**
	 * Change field name and type.
	 * @returns {object} the filters' menu info
	 */
	FilterMenuViewModel.prototype.updateFilter = function(isQuickDateFilter)
	{
		let self = this, filters = [];

		let columns = self.dataFieldHelper.getColumnsByType(self.dataType);
		let dataType = columns.filter((item) => item.FieldName === self.fieldName);

		let operator = self.getFilterOperator(dataType, isQuickDateFilter);

		for (let i in operator)
		{
			filters.push({ "type": i, "style": TF.Grid.LightKendoGrid.prototype.operatorKendoMapFilterNameValue[i], "text": operator[i] });
		}
		if (self.getListFilterTemplate())
		{
			filters.push({ "type": "list", "style": TF.Grid.LightKendoGrid.prototype.operatorKendoMapFilterNameValue["list"], "text": "List" });
		}
		self.obFilters(filters);
	};

	FilterMenuViewModel.prototype.getFilterOperator = function(dataType, isQuickDateFilter)
	{
		let operator = null, filtersType = this.obType();
		if (dataType && dataType.length > 0 && isQuickDateFilter)
		{
			filtersType = dataType[0].type;
			operator = TF.Grid.LightKendoGrid.OperatorWithDateTime[filtersType];
		}

		// for handling the UDF type fields when thematic dragging is applied.
		if (dataType && dataType.length === 0 && isQuickDateFilter)
		{
			if (filtersType === 'datetime')
			{
				operator = TF.Grid.LightKendoGrid.OperatorWithDateTime[filtersType];
			}
			else if (filtersType === 'date')
			{
				operator = TF.Grid.LightKendoGrid.OperatorWithDate[filtersType];
			}
			return operator;
		}

		if (!operator && filtersType === 'datetime')
		{
			operator = TF.Grid.LightKendoGrid.OperatorWithDateTime[filtersType];
		}
		else if (!operator && (filtersType === 'date'))
		{
			operator = TF.Grid.LightKendoGrid.OperatorWithDate[filtersType];
		}

		if (!operator && !isQuickDateFilter)
		{
			operator = TF.Grid.LightKendoGrid.DefaultOperator[this.obType()];
		}
		// operator must not be undefined nor null in order to assign the "Custom" filter option.
		// if in the above steps the operator could not be found, for example, boolean type operator does not need to have the "Custom" filter option.
		// if this is not checked there would be an error shown in the frontend.
		if (operator && !operator.hasOwnProperty('custom'))
		{
			operator.custom = 'Custom';
		}
		return operator;
	}

	/**
	 * the filter item click event.
	 */
	FilterMenuViewModel.prototype.filterClick = function(model, e)
	{
		var self = this;
		self.$el.removeClass("active");
		if (model.type === "list" || model.type === "custom" || self.filterType !== model.type)
		{
			self.filterType = model.type;
			self.onFilterChange.notify(model);
		}
	};

	/**
	 * Gets the list fiter template of field.
	 */
	FilterMenuViewModel.prototype.getListFilterTemplate = function()
	{
		var self = this, columns = self.dataFieldHelper.getColumnsByType(self.dataType),
			field = columns ? columns.filter(function(item) { return item.FieldName === self.fieldName }) : undefined;

		if (!field || field.length === 0)
		{
			return undefined;
		}

		return field[0].ListFilterTemplate;
	};

	/**
	 * Open the modal for List filter.
	 */
	FilterMenuViewModel.prototype.openListFilterModal = function(selectedItems)
	{
		var self = this,
			selectedItems = [],
			listFilterTemplate = self.getListFilterTemplate();

		return self.listFilterTool.open(selectedItems, listFilterTemplate);
	};

	/**
	 * Dispose quick menu template.
	 */
	FilterMenuViewModel.prototype.dispose = function()
	{
		var self = this;
		if (self.$el)
		{
			self.$el.off("mouseenter.closeFilterMenu");
			self.$el.off("mouseleave.closeFilterMenu");
		}
	};
})()

(function()
{
	createNamespace("TF.DetailView").SearchExistingRecordWrapper = SearchExistingRecordWrapper;

	function SearchExistingRecordWrapper(options)
	{
		var self = this, dataType = options.dataType,
			selectedItemWithId = options.selectedData || [],
			defaultColumns = options.defaultColumns,
			defaults = {
				availableTitle: "Available",
				height: 400,
				editCurrentDefinitionColumns: true,
				selectedTitle: "Selected",
				serverPaging: true,
				showRemoveColumnButton: true,
				sort: { Name: "Id", isAscending: "asc", Direction: "Ascending" },
				type: dataType,
				dataSource: options.dataSource
			};

		self.dataType = dataType;
		self.pageLevelViewModel = options.pageLevelViewModel;
		self.$element = null;
		self.template = "Workspace/ListMover/ListMoverWithVirtualScroll";
		self.gridDefinition = tf.dataTypeHelper.getGridDefinition(dataType);

		options = $.extend({}, defaults);
		self.columnSources[dataType] = tf.dataTypeHelper.getGridDefinition(dataType).Columns;

		// need to fill selectedData
		TF.Control.KendoListMoverWithSearchControlViewModel.call(self, selectedItemWithId, options);

		self.defaultColumns = defaultColumns;
		self.columns = defaultColumns;
	};

	SearchExistingRecordWrapper.prototype = Object.create(TF.Control.KendoListMoverWithSearchControlViewModel.prototype);
	SearchExistingRecordWrapper.prototype.constructor = SearchExistingRecordWrapper;

	/**
	 * Initialization
	 * @return {void}
	 */
	SearchExistingRecordWrapper.prototype.init = function(data, element)
	{
		var self = this;
		self.$element = $(element);

		TF.Control.KendoListMoverWithSearchControlViewModel.prototype.init.call(self, null, self.$element);
	};

	/**
	 * Save selected associations.
	 *
	 * @returns
	 */
	SearchExistingRecordWrapper.prototype.save = function()
	{
		var self = this;

		return {
			isChanged: self.isChanged,
			selectedIds: self.rightSearchGrid.obAllIds()
		}
	};

	SearchExistingRecordWrapper.prototype.rightKendoGridOption = function()
	{
		var options = TF.Control.KendoListMoverWithSearchControlViewModel.prototype.rightKendoGridOption.call(this);
		options.filterable = {
			extra: false,
			mode: "row"
		};

		options.dataSource.serverFiltering = true;
		return options;
	};

	SearchExistingRecordWrapper.prototype._getRightColumns = function()
	{
		var self = this;
		var currentColumns = this._gridDefinition.Columns;
		var columns = currentColumns.map(function(definition)
		{
			var column = definition;
			column.field = definition.FieldName;
			column.title = definition.DisplayName;
			column.width = definition.Width || KendoListMoverWithSearchControlViewModel.defaults.columnWidth;
			column.hidden = definition.hidden;
			self.setColumnFilterableCell(column, definition, "listmover");
			if (column.filterable &&
				column.filterable.cell)
			{
				column.filterable.cell.showOperators = false;
			}
			if (definition.AllowSorting === false)
			{
				column.sortable = false;
			}
			if (definition.template !== undefined)
			{
				column.template = definition.template;
			}

			return column;
		});
		return columns;
	};

	SearchExistingRecordWrapper.prototype._initGrids = function(el)
	{
		TF.Control.KendoListMoverWithSearchControlViewModel.prototype._initGrids.call(this, el);

		this.originalColumns = this.defaultColumns;
	};

	SearchExistingRecordWrapper.prototype.onLeftDataBound = function()
	{
		TF.Control.KendoListMoverWithSearchControlViewModel.prototype.onLeftDataBound.call(this);

		this.$form.find(".k-filter-row input").addClass("unBindHotKey");
	};

	/**
	 * Dispose
	 * 
	 * @return {void}
	 */
	SearchExistingRecordWrapper.prototype.dispose = function()
	{
		var self = this;

		TF.Control.KendoListMoverWithSearchControlViewModel.prototype.dispose.call(self);

		self.$element = null;
	};
})();
(function()
{
	createNamespace("TF.Control").ManageDetailScreenLayoutViewModel = ManageDetailScreenLayoutViewModel;

	/**
	 * Constructor
	 * @returns {void} 
	 */
	function ManageDetailScreenLayoutViewModel(gridType, selectId, alwaysApply)
	{
		var self = this;
		self.gridType = gridType;
		self.selectedIdOnPanel = selectId ? selectId : null;
		self.selectedId = selectId ? selectId : null;
		self.selectedName = "";
		self.isDeleted = false;
		self.alwaysApply = alwaysApply;

		self.obGridCountSummary = ko.observable("");
		self.layoutEntities = [];

		//Events
		self.onApplyToPanel = new TF.Events.Event();
		self.onEditToPanel = new TF.Events.Event();
	};

	/**
	 * Initialize the manage detail screen layout modal.
	 * @param {Object} viewModel The viewmodel.
	 * @param {DOM} el The DOM element bound with the viewmodel.
	 * @return {void}
	 */
	ManageDetailScreenLayoutViewModel.prototype.init = function(viewModel, el)
	{
		var self = this;

		self.$element = $(el);
		self.$grid = self.$element.find(".managefiltergrid-container");
		self.$footer = self.$element.closest(".modal-content").find(".modal-footer");
		self.kendoGrid = null;

		self.initData(self.gridType).then(function()
		{
			self.initParameters();
			self.initGrid();
		});
	};

	/**
	 * Initialize essential parameters.
	 * @return {void}
	 */
	ManageDetailScreenLayoutViewModel.prototype.initParameters = function()
	{
		var self = this;
		self.gridColumns = [
			{
				field: "Name",
				title: "Name",
				template: function(dataItem)
				{
					return kendo.htmlEncode(dataItem.Name);
				}
			},
			{
				command: [{
					name: "edit",
					click: self.editBtnClick.bind(self)
				}, {
					name: "delete",
					click: self.deleteBtnClick.bind(self)
				}],
				title: "Action",
				width: "80px",
				attributes: {
					"class": "text-center"
				}
			}
		];
	};

	/**
	 * Get essential data for initialization.
	 * @param {string} gridType The grid type.
	 * @return {Promise} When the process is done.
	 */
	ManageDetailScreenLayoutViewModel.prototype.initData = function(gridType)
	{
		var self = this, paramData = {};
		if (gridType)
		{
			paramData.table = gridType;
		}
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreen"), {
			paramData: paramData
		}).then(function(response)
		{
			if (response && response.Items && response.Items[0])
			{
				var entityList = response.Items[0].map(function(item)
				{
					return new TF.DataModel.DetailScreenLayoutDataModel(item);
				});
				self.layoutEntities = entityList;
				self.obGridCountSummary(entityList.length + " of " + response.TotalRecordCount);
			}
		});
	};

	/**
	 * Initialize grid.
	 * @return {void}
	 */
	ManageDetailScreenLayoutViewModel.prototype.initGrid = function()
	{
		var self = this,
			columns = self.gridColumns,
			grid = self.kendoGrid,
			entities = self.layoutEntities.map(function(entity)
			{
				return entity.toData();
			});

		if (grid) { grid.destroy(); }

		self.$grid.kendoGrid({
			dataSource: {
				data: entities,
				sort: { field: "Name", dir: "asc" }
			},
			height: 300,
			scrollable: true,
			selectable: true,
			columns: columns,
			change: self.onDataRowSelect.bind(self),
			dataBound: self.onDataBound.bind(self)
		});
	};

	/**
	 * The event handler when a data row is selected.
	 * @param {Event} e The change event.
	 * @return {void}
	 */
	ManageDetailScreenLayoutViewModel.prototype.onDataRowSelect = function(e)
	{
		var self = this,
			uid = self.kendoGrid.select().attr("data-kendo-uid"),
			dataRow = self.kendoGrid.dataSource.getByUid(uid);

		self.$footer.find(".btn.positive").prop("disabled", false);
		self.selectedId = dataRow.Id;
		self.selectedName = dataRow.Name;
	};

	/**
	 * The event handler when the data is bound to the grid.
	 * @param {Event} e The dataBound event.
	 * @return {void}
	 */
	ManageDetailScreenLayoutViewModel.prototype.onDataBound = function(e)
	{
		var self = this, dataList, $row, isAnySelected = false;

		self.kendoGrid = self.$grid.data("kendoGrid");
		dataList = self.kendoGrid.dataSource.data();

		$.each(dataList, function(index, item)
		{
			$row = $("[data-kendo-uid=\"" + item.uid + "\"]");
			$row.dblclick(function()
			{
				self.onApplyToPanel.notify(self.apply(item.Id, item.Name));
			});

			if (item["Id"] === self.selectedId)
			{
				self.kendoGrid.select($row);
				isAnySelected = true;
			}
		});

		self.$footer.find(".btn.positive").prop("disabled", !isAnySelected);
	};

	/**
	 * Get data row by entity id.
	 * @param {number} id The entity id.
	 * @return {Object} The kendoGrid data row.
	 */
	ManageDetailScreenLayoutViewModel.prototype.getDataRowByValue = function(dataList, propName, propValue)
	{
		var self = this, tmp, idx = -1;

		while (++idx < dataList.length)
		{
			tmp = dataList[idx];
			if (tmp[propName] === propValue)
			{
				return tmp;
			}
		}
	};

	/**
	 * The click event handler for Edit entity button.
	 * @param {Event} e The click event.
	 * @return {void}
	 */
	ManageDetailScreenLayoutViewModel.prototype.editBtnClick = function(e)
	{
		e.preventDefault();

		var self = this,
			entity = self.getEntityDataModelForEvent(e),
			selectData = {
				id: entity.id()
			};
		self.onEditToPanel.notify(selectData);
	};

	/**
	 * The click event handler for Delete entity button.
	 * @param {Event} e The click event.
	 * @return {void}
	 */
	ManageDetailScreenLayoutViewModel.prototype.deleteBtnClick = function(e)
	{
		e.preventDefault();

		var self = this, entity = self.getEntityDataModelForEvent(e), entityId = entity.id(),
			layout = JSON.parse(entity.layout()),
			messasge = "Are you sure you want to delete this record?";
		if (self.selectedIdOnPanel === entityId)
		{
			messasge = "This reocrd is used for your detail screen now, are you sure you want to delete this record?"
		}

		tf.promiseBootbox.yesNo(messasge, "Delete Confirmation")
			.then(function(operation)
			{
				if (operation)
				{
					self.deleteLayoutById(entityId, layout);
				}
			});
	};

	/**
	 * Refresh grid.
	 * @returns {void}
	 */
	ManageDetailScreenLayoutViewModel.prototype.refreshGrid = function()
	{
		var self = this;
		self.initData(self.gridType).then(function()
		{
			self.initGrid();
		});
	}

	/**
	 * Delete a entity by id.
	 * @param {number} entityId The id of the entity.
	 * @return {Promise}
	 */
	ManageDetailScreenLayoutViewModel.prototype.deleteLayoutById = function(entityId, layout)
	{
		var self = this;
		tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreen"), {
			data: [entityId]
		}).then(function(apiResponse)
		{
			if (apiResponse.Items[0])
			{
				if (self.selectedIdOnPanel === entityId)
				{
					self.selectedIdOnPanel = null;
					self.isDeleted = true;
				}
				self.refreshGrid();
			}
		});
	};

	/**
	 * Get the entity data model that is bound to the row.
	 * @param {Event} e The triggered event.
	 * @return {Object} The bound entity data model. Return null if the data model is not found.
	 */
	ManageDetailScreenLayoutViewModel.prototype.getEntityDataModelForEvent = function(e)
	{
		var self = this, idx, entity,
			$row = $(e.target).closest("tr"),
			dataId = self.kendoGrid.dataItem($row).Id,
			entityList = self.layoutEntities;

		for (idx = 0; idx < entityList.length; idx++)
		{
			entity = entityList[idx];
			if (entity.id() === dataId)
			{
				return entity;
			}
		}
	};

	/**
	 * Apply layout to panel.
	 * @param {int} id The selected entity id.
	 * @param {string} name The selected entity name.
	 * @return {void}
	 */
	ManageDetailScreenLayoutViewModel.prototype.apply = function(id, name)
	{
		var self = this, selectId = id ? id : self.selectedId, selectData;
		if (self.selectedIdOnPanel !== selectId || self.alwaysApply)
		{
			selectData = {
				selectId: selectId,
				selectName: name ? name : self.selectedName,
				isDeleted: self.isDeleted
			};
		}
		return Promise.resolve(selectData);
	};

	/**
	 * Dispose function.
	 * @return {void}
	 */
	ManageDetailScreenLayoutViewModel.prototype.dispose = function()
	{
		var self = this;

		if (self.kendoGrid)
		{
			self.kendoGrid.destroy();
		}

		self.onApplyToPanel.unsubscribeAll();
		self.onEditToPanel.unsubscribeAll();
	};
})();
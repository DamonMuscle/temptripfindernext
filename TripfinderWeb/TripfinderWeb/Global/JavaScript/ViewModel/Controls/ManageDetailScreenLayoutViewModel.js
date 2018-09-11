(function()
{
	createNamespace("TF.Control").ManageDetailScreenLayoutViewModel = ManageDetailScreenLayoutViewModel;

	/**
	 * Constructor
	 * @returns {void} 
	 */
	function ManageDetailScreenLayoutViewModel(gridType, selectId, alwaysApply)
	{
		var self = this, selectedDataType,
			availableDataTypes = tf.pageManager.getAvailableDataTypes();

		availableDataTypes = availableDataTypes.map(function(item)
		{
			return {
				name: ko.observable(item.name),
				label: ko.observable(item.label),
			}
		});
		selectedDataType = availableDataTypes.filter(function(item) { return item.name() === gridType; })[0];

		self.userMessages = {
			"WRONG_LAYOUT_TYPE": "This layout cannot be used with this data type. Please select a different layout.",
			"FAIL_VALIDATION_MSG": "File is unreadable. For more information, contact support.",
			"NO_PERMISSION_MSG": "You don't have the permission to this layout's grid type.",
			"WRONG_FILE_TYPE_MSG": "Incorrect file type. Please upload a [.tfdetaillayout] to import."
		};

		self.gridType = gridType;
		self.selectedIdOnPanel = selectId || null;
		self.selectedRowId = selectId || null;
		self.selectedRowName = "";
		self.isDeleted = false;
		self.alwaysApply = alwaysApply;

		self.obSelectedType = ko.observable(selectedDataType);
		self.obAvailableDataTypes = ko.observableArray(availableDataTypes);
		self.obGridCountSummary = ko.observable("");
		self.layoutEntities = [];

		//Events
		self.onApplyToPanel = new TF.Events.Event();
		self.onEditToPanel = new TF.Events.Event();

		self.onLayoutJsonFileSelected = self.onLayoutJsonFileSelected.bind(self);

		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
	};

	/**
	 * Initialize the manage detail screen layout modal.
	 * @param {Object} viewModel The viewmodel.
	 * @param {DOM} el The DOM element bound with the viewmodel.
	 * @return {void}
	 */
	ManageDetailScreenLayoutViewModel.prototype.init = function(viewModel, el)
	{
		var self = this, selectedType = self.obSelectedType().name();

		self.$element = $(el);
		self.$grid = self.$element.find(".managefiltergrid-container");
		self.$footer = self.$element.closest(".modal-content").find(".modal-footer");
		self.$importLayoutInput = self.$element.find("#import-layout");
		self.kendoGrid = null;
		self.detailViewHelper = new TF.DetailView.DetailViewHelper();

		self.initData(selectedType).then(function()
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
				field: "DataType",
				title: "Data Type",
				width: "160px",
				template: function(dataItem)
				{
					return tf.pageManager.getPageTitleByPageName(dataItem.Table);
				}
			},
			{
				command: [
					{
						name: "export",
						click: self.exportBtnClick.bind(self)
					},
					{
						name: "edit",
						click: self.editBtnClick.bind(self)
					},
					{
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
		if (gridType && gridType !== "all")
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
				self.obGridCountSummary(entityList.length + " of " + entityList.length);
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

		if (dataRow)
		{
			self.$footer.find(".btn.positive").prop("disabled", false);
			self.selectedRowId = dataRow.Id;
			self.selectedRowName = dataRow.Name;
			self.selectedRowType = dataRow.Table;
		}
		else
		{
			self.$footer.find(".btn.positive").prop("disabled", true);
			self.selectedId = null;
			self.selectedName = "";
		}
	};

	/**
	 * The event handler when the data is bound to the grid.
	 * @param {Event} e The dataBound event.
	 * @return {void}
	 */
	ManageDetailScreenLayoutViewModel.prototype.onDataBound = function(e)
	{
		var self = this, dataList, $row, isAnySelected = false;

		// Highlight current layout.
		self.kendoGrid = self.$grid.data("kendoGrid");
		dataList = self.kendoGrid.dataSource.data();

		$.each(dataList, function(index, item)
		{
			$row = $("[data-kendo-uid=\"" + item.uid + "\"]");
			$row.dblclick(function()
			{
				self.pageLevelViewModel.clearError();
				if (self.gridType !== item.Table)
				{
					self.pageLevelViewModel.popupErrorMessage(self.userMessages["WRONG_LAYOUT_TYPE"]);
				}
				else
				{
					self.onApplyToPanel.notify(self.apply(item.Id, item.Name));
				}
			});

			if (item["Id"] === self.selectedRowId)
			{
				self.kendoGrid.select($row);
				isAnySelected = true;
			}
		});

		self.$footer.find(".btn.positive").prop("disabled", !isAnySelected);

		// Alter for scrollbar
		var headerPaddingRight = 0,
			$gridContent = self.$grid.find(".k-grid-content");
		if ($gridContent.children('table').height() > $gridContent.height())
		{
			headerPaddingRight = 17;
		}
		self.$grid.find('.k-grid-header').css({
			'padding-right': headerPaddingRight + 'px'
		});
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
	 * The click event handler for export layout button.
	 * @param {Event} e The click event.
	 * @return {void}
	 */
	ManageDetailScreenLayoutViewModel.prototype.exportBtnClick = function(e)
	{
		e.preventDefault();

		var self = this, entity = self.getEntityDataModelForEvent(e),
			id = entity.id();

		window.location = pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreen", "download", id);
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
			entity = self.getEntityDataModelForEvent(e);

		if (self.gridType === entity.table())
		{
			self.onEditToPanel.notify({
				id: entity.id()
			});
		}
		else
		{
			self.pageLevelViewModel.clearError();
			self.pageLevelViewModel.popupErrorMessage(self.userMessages["WRONG_LAYOUT_TYPE"]);
		}
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
		var self = this, selectedType = self.obSelectedType().name();
		self.initData(selectedType).then(function()
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
		var self = this, selectId = id || self.selectedRowId, selectData;

		if (self.gridType !== self.selectedRowType)
		{
			self.pageLevelViewModel.clearError();
			self.pageLevelViewModel.popupErrorMessage(self.userMessages["WRONG_LAYOUT_TYPE"]);
			return Promise.resolve(false);
		}

		if (self.selectedIdOnPanel !== selectId || self.alwaysApply)
		{
			selectData = {
				selectId: selectId,
				selectName: name || self.selectedRowName,
				isDeleted: self.isDeleted
			};
		}
		return Promise.resolve(selectData);
	};

	/**
	 * The event handler when a layout json file is selected in the file input.
	 * @param {Object} model 
	 * @param {Event} e 
	 */
	ManageDetailScreenLayoutViewModel.prototype.onLayoutJsonFileSelected = function(model, e)
	{
		var self = this,
			fileInput = self.$importLayoutInput[0],
			selectedFile = fileInput.files[0],
			reader = new FileReader();

		reader.onload = function(e)
		{
			var layoutType, jsonStr = this.result;
			try
			{
				// Check if json string is valid json.
				entity = JSON.parse(jsonStr);
				entity.Layout = JSON.parse(entity.Layout);
				layoutType = entity.Table;

				// Check if the grid type is valid.
				if (!tf.pageManager.getPageTitleByPageName(layoutType))
				{
					throw "FAIL_VALIDATION_MSG";
				}
				else
				{
					// Check if the user has permission to the grid type.
					var layoutGridTypeObj = self.obAvailableDataTypes().filter(function(item) { return item.name() === layoutType; })[0];
					if (!layoutGridTypeObj)
					{
						throw "NO_PERMISSION_MSG";
					}
					// Validate the layout entity content.
					else if (self.detailViewHelper.validateLayoutEntity(entity, layoutType))
					{
						self.saveLayoutEntity(entity);

						var successMsg = "\"" + entity.Name + "\" (" + layoutGridTypeObj.label() + ") " + "has been successfully imported.";
						self.pageLevelViewModel.clearError();
						self.pageLevelViewModel.popupSuccessMessage(successMsg);
					}
					else
					{
						throw "FAIL_VALIDATION_MSG";
					}
				}
			}
			catch (e)
			{
				var msg = self.userMessages[e] || self.userMessages["FAIL_VALIDATION_MSG"];
				self.pageLevelViewModel.clearError();
				self.pageLevelViewModel.popupErrorMessage(msg);
			}
			fileInput.value = null;
		};

		// The filename must have correct extension.
		if (!selectedFile)
		{
			return;
		}
		if (selectedFile.name.endsWith(".tfdetaillayout"))
		{
			reader.readAsText(selectedFile);
		}
		else
		{
			self.pageLevelViewModel.clearError();
			self.pageLevelViewModel.popupErrorMessage(self.userMessages["WRONG_FILE_TYPE_MSG"]);
		}
	};

	/**
	 * Open the import layout file browser.
	 * @return {void}
	 */
	ManageDetailScreenLayoutViewModel.prototype.openImportLayoutFileInput = function()
	{
		var self = this;
		self.$importLayoutInput.click();
	};

	/**
	 * Import a layout entity.
	 * @param {Object} entity 
	 * @return {void}
	 */
	ManageDetailScreenLayoutViewModel.prototype.saveLayoutEntity = function(entity)
	{
		var self = this,
			saveCopy = new TF.DataModel.DetailScreenLayoutDataModel();

		var data = saveCopy.toData();
		data.Name = entity.Name;
		data.SubTitle = entity.SubTitle;
		data.Table = entity.Table;
		data.Layout = JSON.stringify(entity.Layout);
		data.Id = 0;
		data.APIIsNew = true;

		tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreen"), {
			data: data
		}).then(function(response)
		{
			self.refreshGrid();
		});
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
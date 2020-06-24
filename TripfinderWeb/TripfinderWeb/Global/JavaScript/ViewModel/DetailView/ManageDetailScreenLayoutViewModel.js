(function()
{
	createNamespace("TF.DetailView").ManageDetailScreenLayoutViewModel = ManageDetailScreenLayoutViewModel;

	/**
	 * Constructor
	 * @returns {void} 
	 */
	function ManageDetailScreenLayoutViewModel(gridType, selectId, disableApply)
	{
		var self = this;
		self.detailViewHelper = tf.helpers.detailViewHelper;

		self.disableApply = disableApply;
		var availableDataTypes = tf.dataTypeHelper.getAvailableDataTypes()
			.filter(function(item) { return item.enableDetailView; })
			.map(function(item)
			{
				return {
					key: ko.observable(item.key),
					name: ko.observable(item.name.toLowerCase()),
					label: ko.observable(item.label),
				}
			}),
			selectedDataType = availableDataTypes
				.filter(function(item) { return item.name() === tf.dataTypeHelper.getFormalDataTypeName(gridType).toLowerCase(); })[0];

		availableDataTypes.unshift({ name: ko.observable("all"), label: ko.observable("All Data Types"), key: ko.observable("all") });

		self.userMessages = {
			"WRONG_LAYOUT_TYPE": "This layout cannot be used with this data type. Please select a different layout.",
			"FAIL_VALIDATION_MSG": "File is unreadable. Please contact support for more information.",
			"NO_PERMISSION_MSG": "You don't have the permission to this layout's grid type.",
			"WRONG_FILE_TYPE_MSG": "Incorrect file type. Please upload a [.tfdetaillayout] to import."
		};

		self.gridType = gridType;
		self.dataTypeName = tf.dataTypeHelper.getFormalDataTypeName(gridType);
		self.selectedIdOnPanel = selectId || null;
		self.selectedRowId = selectId || null;
		self.selectedRowName = "";
		self.isDeleted = false;

		self.obSelectedType = ko.observable(selectedDataType);
		self.obAvailableDataTypes = ko.observableArray(availableDataTypes);
		self.obGridCountSummary = ko.observable("");
		self.layoutEntities = [];

		//Events
		self.onApplyToPanel = new TF.Events.Event();
		self.onEditToPanel = new TF.Events.Event();

		self.onSelectedDataTypeChanged = self.onSelectedDataTypeChanged.bind(self);
		self.onLayoutJsonFileSelected = self.onLayoutJsonFileSelected.bind(self);

		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();

		self.contactQuickAddStickyKey = "grid.detailscreenlayoutid.contact.quickadd";
		self.documentQuickAddStickyKey = "grid.detailscreenlayoutid.document.quickadd";
	};

	/**
	 * Initialize the manage detail screen layout modal.
	 * @param {Object} viewModel The viewmodel.
	 * @param {DOM} el The DOM element bound with the viewmodel.
	 * @return {void}
	 */
	ManageDetailScreenLayoutViewModel.prototype.init = function(viewModel, el)
	{
		var self = this, selectedType = self.obSelectedType().key();

		self.$element = $(el);
		self.$grid = self.$element.find(".managefiltergrid-container");
		self.$footer = self.$element.closest(".modal-content").find(".modal-footer");
		self.$importLayoutInput = self.$element.find("#import-layout");
		self.kendoGrid = null;

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
					return tf.dataTypeHelper.getNameById(dataItem.DataTypeId);
				}
			},
			{
				command: [
					{
						name: "export",
						template: '<a class="k-button k-button-icontext k-grid-export" title="Export"><span class=" "></span>export</a>',
						click: self.exportBtnClick.bind(self)
					},
					{
						name: "edit",
						template: '<a class="k-button k-button-icontext k-grid-edit" title="Edit"><span class="k-icon k-edit"></span>Edit</a>',
						click: self.editBtnClick.bind(self)
					},
					{
						name: "delete",
						template: '<a class="k-button k-button-icontext k-grid-delete" title="Delete"><span class=" "></span>delete</a>',
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
		var self = this, paramData = {
			"@fields": "Id,Name,Comments,DataTypeId"
		};

		if (gridType && gridType !== "all")
		{
			paramData.dataTypeId = tf.dataTypeHelper.getId(gridType);

		}

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreens"), {
			paramData: paramData
		}).then(function(response)
		{
			if (response && response.Items)
			{
				var entityList = response.Items.map(function(item)
				{
					return new TF.DataModel.DetailScreenLayoutDataModel(self.detailViewHelper.formatLayoutTemplate(item));
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
			columns = null,
			entities = self.layoutEntities.map(function(entity)
			{
				return entity.toData();
			});

		if (self._isContactSelected() ||
			self._isDocumentSelected())
		{
			columns = self._addQuickAddColumn(self.gridColumns);
			self._bindQuickAddRadioBtnEvents();
		}
		else
		{
			columns = self._removeQuickAddColumn(self.gridColumns);
			self._unbindQuickAddRadioBtnEvents();
		}

		var kendoGrid = self.$grid.getKendoGrid(),
			dataSource = {
				data: entities,
				sort: { field: "Name", dir: "asc" }
			};
		if (kendoGrid === undefined)
		{
			self.$grid.kendoGrid({
				dataSource: dataSource,
				height: 300,
				scrollable: true,
				selectable: true,
				columns: columns,
				change: self.onDataRowSelect.bind(self),
				dataBound: self.onDataBound.bind(self)
			});
		}
		else
		{
			var kendoOptions = kendoGrid.getOptions();
			kendoOptions.dataSource = dataSource
			kendoOptions.height = 300;
			kendoOptions.scrollable = true;
			kendoOptions.selectable = true;
			kendoOptions.columns = columns;
			kendoOptions.change = self.onDataRowSelect.bind(self);
			kendoOptions.dataBound = self.onDataBound.bind(self);
			kendoGrid.setOptions(kendoOptions);
		}
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
			self.$footer.find(".btn.positive").prop("disabled", self.disableApply);
			self.selectedRowId = dataRow.Id;
			self.selectedRowName = dataRow.Name;
			self.selectedRowType = tf.dataTypeHelper.getNameById(dataRow.DataTypeId);
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
		var self = this, dataList, $row, isAnySelected = false,
			quickAddLayoutId;

		// Highlight current layout.
		self.kendoGrid = self.$grid.data("kendoGrid");
		dataList = self.kendoGrid.dataSource.data();

		if (self._isContactSelected())
		{
			quickAddLayoutId = tf.storageManager.get(self.contactQuickAddStickyKey);
		}
		else if (self._isDocumentSelected())
		{
			quickAddLayoutId = tf.storageManager.get(self.documentQuickAddStickyKey);
		}

		$.each(dataList, function(index, item)
		{
			$row = $("[data-kendo-uid=\"" + item.uid + "\"]");
			$row.dblclick(function(e)
			{
				if ($(e.target).hasClass("quick-add-layout-radio")) return;
				if (self.disableApply) return;

				self.pageLevelViewModel.clearError();
				if (self.dataTypeName !== tf.dataTypeHelper.getNameById(item.DataTypeId))
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

			if (quickAddLayoutId != null && item["Id"] === quickAddLayoutId)
			{
				$row.find(".quick-add-layout-radio").prop("checked", true);
				self._lastSelectQuickaddRow = $row;
			}
		});

		self.$footer.find(".btn.positive").prop("disabled", self.disableApply || !isAnySelected);

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

	ManageDetailScreenLayoutViewModel.prototype.downloadTemplateFile = function(entity)
	{
		var id = entity.id(), downloadUrl = pathCombine(tf.api.apiPrefixWithoutDatabase(), "DetailScreenFiles", id);

		tf.promiseAjax.get(downloadUrl, {
			success: function(data, xhr)
			{
				var contentType = xhr.getResponseHeader("content-type"),
					contentDisposition = xhr.getResponseHeader("content-disposition"),
					fileName;

				contentDisposition.split(";").some(function(value)
				{
					value = value.trim();
					if (value.indexOf("filename") >= 0)
					{
						fileName = value.split("=")[1];
						fileName = fileName.trim().replace(/^"|"$/g, '');
						return true;
					}
				});

				var windowUrl = window.URL || window.webkitURL,
					anchor = $(document.createElement('a')),
					blob = new Blob([xhr.responseText], { type: contentType }), url = windowUrl.createObjectURL(blob);

				anchor.prop('href', url);
				anchor.prop('download', fileName);
				anchor.get(0).click();
				windowUrl.revokeObjectURL(url);
			}
		});
	};

	/**
	 * The click event handler for export layout button.
	 * @param {Event} e The click event.
	 * @return {void}
	 
	ManageDetailScreenLayoutViewModel.prototype.exportBtnClick = function(e)
	{
		e.preventDefault();

		this.downloadTemplateFile(this.getLayoutTemplateForEvent(e));
	};	*/

	/**
 * The click event handler for export layout button.
 * @param {Event} e The click event.
 * @return {void}
 */
	ManageDetailScreenLayoutViewModel.prototype.exportBtnClick = function(e)
	{
		e.preventDefault();

		var self = this, entity = self.getLayoutTemplateForEvent(e),
			id = entity.id();

		window.location = pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreenfiles", id);
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
			entity = self.getLayoutTemplateForEvent(e);

		if (self.dataTypeName === tf.dataTypeHelper.getNameById(entity.dataTypeId()))
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
	 * The click event handler for Delete layout template button.
	 * @param {Event} e The click event.
	 * @return {void}
	 */
	ManageDetailScreenLayoutViewModel.prototype.deleteBtnClick = function(e)
	{
		e.preventDefault();

		var self = this,
			layoutTemplate = self.getLayoutTemplateForEvent(e),
			layoutId = layoutTemplate.id(),
			message = "Are you sure you want to delete this record?";
		if (self.selectedIdOnPanel === layoutId)
		{
			message = "This record is used for your detail screen now, are you sure you want to delete this record?"
		}

		tf.promiseBootbox.yesNo(message, "Delete Confirmation")
			.then(function(operation)
			{
				if (operation)
				{
					self.deleteLayoutTemplateById(layoutId);
				}
			});
	};

	/**
	 * Refresh grid.
	 * @returns {void}
	 */
	ManageDetailScreenLayoutViewModel.prototype.refreshGrid = function()
	{
		var self = this, selectedType = self.obSelectedType().key();
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
	ManageDetailScreenLayoutViewModel.prototype.deleteLayoutTemplateById = function(entityId)
	{
		var self = this;
		tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreens", entityId))
			.then(function(apiResponse)
			{
				if (apiResponse > 0)
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
	ManageDetailScreenLayoutViewModel.prototype.getLayoutTemplateForEvent = function(e)
	{
		var self = this, idx, layoutTemplate,
			layoutEntities = self.layoutEntities,
			count = layoutEntities.length,
			$row = $(e.target).closest("tr"),
			dataId = self.kendoGrid.dataItem($row).Id;

		for (idx = 0; idx < count; idx++)
		{
			layoutTemplate = layoutEntities[idx];
			if (layoutTemplate.id() === dataId)
			{
				return layoutTemplate;
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

		if (self.dataTypeName !== self.selectedRowType)
		{
			self.pageLevelViewModel.clearError();
			self.pageLevelViewModel.popupErrorMessage(self.userMessages["WRONG_LAYOUT_TYPE"]);
			return Promise.resolve(false);
		}

		if (self.selectedIdOnPanel !== selectId)
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
	 * The event handler when selected data type is updated.
	 * @param {Object} model 
	 * @param {Event} e 
	 */
	ManageDetailScreenLayoutViewModel.prototype.onSelectedDataTypeChanged = function(model, e)
	{
		var self = this;
		self.refreshGrid();
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
			try
			{
				var entity = JSON.parse(this.result),
					table = entity.Table,
					layoutType = tf.dataTypeHelper.getFormalDataTypeName(table).toLowerCase();

				entity.Layout = JSON.parse(entity.Layout);
				entity.DataTypeId = tf.dataTypeHelper.getIdByName(table);

				var layoutGridTypeObj = self.obAvailableDataTypes().filter(function(item) { return item.name() === layoutType; })[0];
				if (!layoutGridTypeObj)
				{
					throw "NO_PERMISSION_MSG";
				}

				self.detailViewHelper.processImportLayoutPipeline(entity, tf.dataTypeHelper.getKeyById(entity.DataTypeId)).then(function(processedEntity)
				{
					self.saveLayoutEntity(processedEntity).then(function()
					{
						if (entity.Table.toLowerCase() !== self.obSelectedType().name())
						{
							self.changeGridSelectionByName("all");
						}

						var successMsg = String.format("\"{0}\" ({1}) has been successfully imported.", entity.Name, layoutGridTypeObj.label());
						self.pageLevelViewModel.clearError();
						self.pageLevelViewModel.popupSuccessMessage(successMsg);
					}).catch(function(response)
					{
						var msg = response.Message
						self.pageLevelViewModel.clearError();
						self.pageLevelViewModel.popupErrorMessage(typeof msg == "string" ? msg : "Error occurred.");
					});
				})
			}
			catch (e)
			{
				var msg = self.userMessages[e] || self.userMessages["FAIL_VALIDATION_MSG"];
				self.pageLevelViewModel.clearError();
				self.pageLevelViewModel.popupErrorMessage(msg);
			}
			finally
			{
				fileInput.value = null;
			}
		};

		// The filename must have correct extension.
		if (!selectedFile)
		{
			return;
		}
		if (selectedFile.name.toLowerCase().endsWith(".tfdetaillayout"))
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
		var self = this, data = {};

		data.Name = entity.Name;
		data.SubTitle = entity.SubTitle;
		data.DataTypeId = entity.DataTypeId;
		data.Layout = JSON.stringify(entity.Layout);
		data.ID = 0;

		if (!data.DataTypeId)
		{
			return Promise.reject("Template may be not compatible, please contact support.");
		}
		else
		{
			return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreens"), {
				data: [data]
			}).then(function()
			{
				self.refreshGrid();
			});
		}
	};

	/**
	 * Change the on-select grid type by name.
	 * @param {string} type 
	 */
	ManageDetailScreenLayoutViewModel.prototype.changeGridSelectionByName = function(type)
	{
		var self = this,
			selectedType = self.obAvailableDataTypes().filter(function(item)
			{
				return type === item.name();
			})[0];

		if (selectedType)
		{
			self.obSelectedType(selectedType);
		}
	};

	/**
	 * Dispose function.
	 * @return {void}
	 */
	ManageDetailScreenLayoutViewModel.prototype.dispose = function()
	{
		var self = this;
		self.onApplyToPanel.unsubscribeAll();
		self.onEditToPanel.unsubscribeAll();
	};

	ManageDetailScreenLayoutViewModel.prototype._isContactSelected = function()
	{
		return this.obSelectedType().name() === 'contact';
	};

	ManageDetailScreenLayoutViewModel.prototype._isDocumentSelected = function()
	{
		return this.obSelectedType().name() === "document";
	}

	ManageDetailScreenLayoutViewModel.prototype._addQuickAddColumn = function(columns)
	{
		var self = this,
			quickAddColumn = self._getQuickAddColumn();
		if (self._hasQuickAddColumn(columns)) return columns;

		return [].concat(columns.slice(0, 2), [quickAddColumn], columns.slice(-1));
	};

	ManageDetailScreenLayoutViewModel.prototype._removeQuickAddColumn = function(columns)
	{
		if (!this._hasQuickAddColumn(columns)) return columns;

		return columns.filter(function(column) { return column.field !== 'QuickAdd'; });
	};

	ManageDetailScreenLayoutViewModel.prototype._hasQuickAddColumn = function(columns)
	{
		return columns.filter(function(column) { return column.field === 'QuickAdd'; }).length > 0;
	};

	ManageDetailScreenLayoutViewModel.prototype._getQuickAddColumn = function()
	{
		var self = this;
		return {
			field: "QuickAdd",
			title: "Quick Add",
			width: "80px",
			attributes: {
				"class": "text-center"
			},
			template: function(dataItem)
			{
				return String.format('<input type="radio" name="quickAdd" value="{0}" class="quick-add-layout-radio" />', dataItem.Id);
			}
		}
	};

	ManageDetailScreenLayoutViewModel.prototype._bindQuickAddRadioBtnEvents = function()
	{
		var self = this;
		self.$grid.off('click.manageLayout').on('click.manageLayout', '.quick-add-layout-radio', function(e)
		{
			var $radioBtn = $(e.currentTarget), $row = $radioBtn.closest("tr");
			self.kendoGrid.select($row[0]);
			if (self._lastSelectQuickaddRow == null || self._lastSelectQuickaddRow[0] != $row[0])
			{
				self.changeQuickAddSelection($row);
			}
		});
	};

	ManageDetailScreenLayoutViewModel.prototype._unbindQuickAddRadioBtnEvents = function()
	{
		var self = this;
		self.$grid.off('.manageLayout');
	};

	ManageDetailScreenLayoutViewModel.prototype.changeQuickAddSelection = function($row)
	{
		var self = this,
			layoutId = $row.find(".quick-add-layout-radio").val(),
			layoutGridName = self._isContactSelected() ? "contact" :
				(self._isDocumentSelected() ? "document" : null);
		//Delete 500ms timeout function and request the layout-info independently
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreens"), {
			paramData: {
				id: layoutId,
				"@fields": "Layout"
			}
		}).
			then(function(res)
			{
				if (res && res.Items && res.Items.length > 0)
				{
					var dataItem = self.kendoGrid.dataItem($row), layoutObj = JSON.parse(res.Items[0].Layout),
						missingFieldsMessage = "",
						missingFields = self.detailViewHelper.validateRequiredFields(layoutObj, layoutGridName);

					if (missingFields.length > 0)
					{
						missingFieldsMessage = String.format("Required field{0} {1} {2} missing in layout \"{3}\". ",
							missingFields.length > 1 ? "s" : "",
							missingFields.map(function(item) { return "\"" + item.title + "\"" }).join(", "),
							missingFields.length > 1 ? "are" : "is",
							dataItem.Name);
					}
					tf.promiseBootbox.yesNo(missingFieldsMessage + "Do you want to change Quick Add selection?", "Quick Add Confirmation")
						.then(function(operation)
						{
							if (operation)
							{
								var key = self._isContactSelected() ? self.contactQuickAddStickyKey :
									(self._isDocumentSelected() ? self.documentQuickAddStickyKey : null);
								tf.storageManager.save(key, layoutId)
									.then(function()
									{
										self._lastSelectQuickaddRow = $row;
										self.pageLevelViewModel.popupSuccessMessage("Save quick add layout successfully.");
									});
							}
							else
							{
								if (self._lastSelectQuickaddRow == null)
								{
									$row.find(".quick-add-layout-radio").prop("checked", false);
								}
								else
								{
									self._lastSelectQuickaddRow.find(".quick-add-layout-radio").prop("checked", true);
								}
							}
						});
				}
			})
	};
})();
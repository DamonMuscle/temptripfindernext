(function()
{
	createNamespace("TF.Control").ManageThematicsViewModel = ManageThematicsViewModel;

	function ManageThematicsViewModel(options)
	{
		const self = this;
		const { kendoGrid, selectThematic, isDetailView, thematicType, positiveClick } = options;

		self.grid = kendoGrid;
		self.gridType = kendoGrid._gridType;
		self.selectThematic = selectThematic;
		self.selectedIdOnMap = selectThematic ? selectThematic.Id : null;
		self.selectedId = selectThematic ? selectThematic.Id : null;
		self.selectName = selectThematic ? selectThematic.Name : "";
		self.isDetailView = Boolean(isDetailView);

		self.obGridCountSummary = ko.observable("");
		self.obThematicsConfigs = ko.observableArray([]);

		self.onThematicsAdded = new TF.Events.Event();
		self.onThematicsEdited = new TF.Events.Event();
		self.onThematicsDeleted = new TF.Events.Event();
		self.onApplyThematicsToMap = new TF.Events.Event();
		self.thematicType = thematicType;
		self.positiveClick = positiveClick;
		self.description = `A thematic changes the way that data is presented on the ${self.thematicType === TF.ThematicTypeEnum.GRID ? "grid" : "map"}. It can be applied, created, edited, copied, and deleted.`
	}

	/**
	 * Initialize the manageThematics modal.
	 * @param {Object} viewModel The viewmodel.
	 * @param {DOM} el The DOM element bound with the viewmodel.
	 * @return {void}
	 */
	ManageThematicsViewModel.prototype.init = function(viewModel, el)
	{
		var self = this;

		self.$element = $(el);
		self.$grid = self.$element.find(".managefiltergrid-container");
		self.$footer = self.$element.closest(".modal-content").find(".modal-footer");
		self.kendoGrid = null;

		self.initData(self.gridType).then(function()
		{
			self.initParameters();
			self.initThematicsGrid();
		});
	};

	/**
	 * Initialize essential parameters.
	 * @return {void}
	 */
	ManageThematicsViewModel.prototype.initParameters = function()
	{
		var self = this;
		self.gridColumns = [
			{
				field: "Name",
				title: "Name",
				width: "75%",
				template: function(dataItem)
				{
					return kendo.htmlEncode(dataItem.Name);
				}
			},
			{
				command: [{
					name: "edit",
					template: '<a class="k-button k-button-icontext k-grid-edit" title="Edit"><span class="k-icon k-edit"></span>Edit</a>',
					click: self.editThematicsBtnClick.bind(self)
				}, {
					name: "copyandnew",
					template: '<a class="k-button k-button-icontext k-grid-copyandnew" title="Copy And New"><span class=" "></span>copyandnew</a>',
					click: self.copyAndNewThematicsBtnClick.bind(self)
				}, {
					name: "delete",
					template: '<a class="k-button k-button-icontext k-grid-delete" title="Delete"><span class=" "></span>delete</a>',
					click: self.deleteThematicsBtnClick.bind(self)
				}],
				title: "Action",
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
	ManageThematicsViewModel.prototype.initData = function(gridType)
	{
		var self = this;
		const paramData = tf.dataTypeHelper.getParamDataByThematicType(self.thematicType, gridType, null, self.grid.options && self.grid.options.gridData && self.grid.options.gridData.value);

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "thematicconfigs"), {
			paramData: paramData
		}).then(function(response)
		{
			if (!response) { return; }

			var isDelete = true;
			var entityList = response.Items.sort((last, now) => last.Name.toLowerCase() > now.Name.toLowerCase() ? 1 : -1)
				.map(function(item)
				{
					if (self.thematicType === TF.ThematicTypeEnum.GRID)
					{
						item.DBID = tf.datasourceManager.databaseId;
					}

					if (self.selectedIdOnMap === item.Id)
					{
						isDelete = false;
						item.Name = self.selectName;
					}
					return new TF.DataModel.ThematicConfigurationDataModel(item);
				});

			if (isDelete && self.selectedIdOnMap)
			{
				entityList.unshift(new TF.DataModel.ThematicConfigurationDataModel(self.selectThematic));
			}

			self.obThematicsConfigs(entityList);

			if (self.thematicType === TF.ThematicTypeEnum.GRID)
			{
				self.grid.obGridThematicDataModels(entityList);
			}

			self.obGridCountSummary(entityList.length + " of " + response.TotalRecordCount);
			return Promise.resolve(true);
		});


	};

	/**
	 * Initialize the thematics grid.
	 * @return {void}
	 */
	ManageThematicsViewModel.prototype.initThematicsGrid = function()
	{
		var self = this,
			columns = self.gridColumns,
			grid = self.kendoGrid,
			thematicsConfigs = self.obThematicsConfigs().map(function(entity)
			{
				return entity.toData();
			});

		if (grid) { grid.destroy(); }

		self.$grid.kendoGrid({
			dataSource: {
				data: thematicsConfigs,
				sort: { field: "Name", dir: "asc" }
			},
			height: 300,
			scrollable: true,
			selectable: true,
			columns: columns,
			change: self.onDataRowSelect.bind(self),
			dataBound: self.onDataBound.bind(self)
		});

		// fix the last column line not parallel
		var $gridContent = self.$grid.find(".k-grid-content");
		if ($gridContent.children('table').height() <= $gridContent.height())
		{
			self.$grid.find('.k-grid-header').css({
				'padding-right': '0'
			});
		}
	};

	/**
	 * The event handler when a data row is selected.
	 * @param {Event} e The change event.
	 * @return {void}
	 */
	ManageThematicsViewModel.prototype.onDataRowSelect = function(e)
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
	ManageThematicsViewModel.prototype.onDataBound = function(e)
	{
		var self = this, dataList, $row, isAnySelected = false;

		self.kendoGrid = self.$grid.data("kendoGrid");
		dataList = self.kendoGrid.dataSource.data();

		$.each(dataList, function(index, item)
		{
			$row = $("[data-kendo-uid=\"" + item.uid + "\"]");
			$row.dblclick(function(e)
			{
				switch (self.thematicType)
				{
					case TF.ThematicTypeEnum.MAP:
						self.onApplyThematicsToMap.notify(self.apply(item.Id, item.Name));
						break;
					case TF.ThematicTypeEnum.GRID:
						self.positiveClick();
						break;
					default:
						break;
				}
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
	 * Get data row by thematics id.
	 * @param {number} id The thematics id.
	 * @return {Object} The kendoGrid data row.
	 */
	ManageThematicsViewModel.prototype.getDataRowByValue = function(dataList, propName, propValue)
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
	 * The click event handler for New Thematics button.
	 * @return {void}
	 */
	ManageThematicsViewModel.prototype.newThematicsBtnClick = function()
	{
		var self = this;

		if (self.isDetailView)
		{
			self.grid.result = {};
			//Get the total count of student.
			p = tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", tf.dataTypeHelper.getEndpoint("student") + "?take=0&skip=0"));
		}
		else
		{
			p = Promise.resolve();
		}
		p.then(function(result)
		{
			if (result)
			{
				self.grid.result.TotalRecordCount = result.TotalRecordCount;
			}
			tf.modalManager.showModal(
				new TF.Modal.EditThematicConfigModalViewModel(self.grid, true, null, self.isDetailView, self.thematicType)
			).then(self.applyNewThematics.bind(self));
		});
	};

	/**
	 * The click event handler for Edit thematics button.
	 * @param {Event} e The click event.
	 * @return {void}
	 */
	ManageThematicsViewModel.prototype.editThematicsBtnClick = function(e)
	{
		e.preventDefault();

		var self = this,
			entity = self.getThematicsDataModelForEvent(e);

		self.editThematicsById(entity.id(), entity.name());
	};

	/**
	 * The click event handler for CopyAneNew thematics button.
	 * @param {Event} e The click event.
	 * @return {void}
	 */
	ManageThematicsViewModel.prototype.copyAndNewThematicsBtnClick = function(e)
	{
		e.preventDefault();

		var self = this,
			entity = self.getThematicsDataModelForEvent(e);

		self.copyAndNewThematicsById(entity.id(), entity.name());
	};

	/**
	 * The click event handler for Delete thematics button.
	 * @param {Event} e The click event.
	 * @return {void}
	 */
	ManageThematicsViewModel.prototype.deleteThematicsBtnClick = function(e)
	{
		e.preventDefault();

		var self = this, entity = self.getThematicsDataModelForEvent(e), entityId = entity.id(), promise = null;
		if (self.selectedIdOnMap !== entityId)
		{
			promise = self.getThematicEntityById(entityId, entity.name());
		}
		else
		{
			promise = Promise.resolve(true);
		}
		return promise.then(function(entity)
		{
			if (entity)
			{
				tf.promiseBootbox.yesNo("Deleting a Thematic will delete it for all users.  If a user is currently using this thematic it will no longer be available when the grid they are using refreshes.  Are you sure you want to delete?", "Delete Confirmation")
					.then(function(operation)
					{
						if (operation)
						{
							self.deleteThematicsById(entityId);
						}
						else
						{
							return;
						}
					});
			}
		});
	};

	/**
	 * Edit the thematics by id.
	 * @param {number} entityId The id of the thematics entity.
	 * @return {Object} The thematics entity.
	 */
	ManageThematicsViewModel.prototype.editThematicsById = function(entityId, entityName)
	{
		var self = this, promise = null;

		if (self.selectedIdOnMap !== entityId)
		{
			promise = self.getThematicEntityById(entityId, entityName);
		}
		else
		{
			promise = Promise.resolve(self.getSelectedThematicCopy());
		}
		return promise.then(function(entity)
		{
			if (entity)
			{
				if (Object.prototype.toString.call(entity.CustomDisplaySetting) !== "[object Array]")
				{
					entity.CustomDisplaySetting = JSON.parse(entity.CustomDisplaySetting);
				}
				tf.modalManager.showModal(
					new TF.Modal.EditThematicConfigModalViewModel(self.grid, false, entity, self.isDetailView, self.thematicType)
				).then(function(editedEntity)
				{
					if (!editedEntity) { return; }

					if (editedEntity.Id === 0)
					{
						return self.applyNewThematics(editedEntity);
					}
					if (self.selectedIdOnMap === entityId)
					{
						self.selectThematic = editedEntity;
						self.selectName = editedEntity.Name;
					}
					if (self.grid && self.grid.obSelectedGridThematicId && editedEntity.applyOnSave)
					{
						self.grid.obSelectedGridThematicId(editedEntity.Id);
					}

					self.refreshThematicsGrid();
					self.onThematicsEdited.notify(editedEntity);
				});
			}
		});
	};

	/**
	 * Copy and new the thematics by id.
	 * @param {number} entityId The id of the thematics entity.
	 * @return {Promise} The Promise with acquired thematics entity.
	 */
	ManageThematicsViewModel.prototype.copyAndNewThematicsById = function(entityId, entityName)
	{
		var self = this, promise = null;

		if (self.selectedIdOnMap !== entityId)
		{
			promise = self.getThematicEntityById(entityId, entityName);
		}
		else
		{
			promise = Promise.resolve(self.getSelectedThematicCopy());
		}
		return promise.then(function(entity)
		{
			if (entity)
			{
				if (Object.prototype.toString.call(entity.CustomDisplaySetting) !== "[object Array]")
				{
					entity.CustomDisplaySetting = JSON.parse(entity.CustomDisplaySetting);
				}
				tf.modalManager.showModal(
					new TF.Modal.EditThematicConfigModalViewModel(self.grid, true, entity, self.isDetailView, self.thematicType)
				).then(self.applyNewThematics.bind(self));
			}
		});
	};

	/**
	 * Refresh the thematic grid.
	 * @returns {void}
	 */
	ManageThematicsViewModel.prototype.refreshThematicsGrid = function()
	{
		var self = this;
		self.initData(self.gridType).then(function()
		{
			self.initThematicsGrid();
		});
	}

	/**
	 * Delete the thematics by id.
	 * @param {number} entityId The id of the thematics entity.
	 * @return {Promise}
	 */
	ManageThematicsViewModel.prototype.deleteThematicsById = function(entityId)
	{
		var self = this;
		tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "thematicconfigs", entityId))
			.then(function(apiResponse)
			{
				if (apiResponse)
				{
					self.onThematicsDeleted.notify(entityId);
					if (self.selectedIdOnMap === entityId)
					{
						self.selectThematic = null;
						self.selectedIdOnMap = null;
					}
					PubSub.publish(topicCombine(pb.DATA_CHANGE, "thematicMenu"));
					self.refreshThematicsGrid();
				}
			});
	};

	/**
	 * Get the thematic config data model that is bound to the row.
	 * @param {Event} e The triggered event.
	 * @return {Object} The bound thematic config data model. Return null if the data model is not found.
	 */
	ManageThematicsViewModel.prototype.getThematicsDataModelForEvent = function(e)
	{
		var self = this, idx, entity,
			$row = $(e.target).closest("tr"),
			dataId = self.kendoGrid.dataItem($row).Id,
			entityList = self.obThematicsConfigs();

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
	 * Get the thematic entity from API with its id.
	 * @param {number} entityId Whether the element is going to be visible.
	 * @returns {void}
	 */
	ManageThematicsViewModel.prototype.getThematicEntityById = function(entityId, entityName)
	{
		var self = this;

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "thematicconfigs", entityId))
			.then(function(response)
			{
				if (response)
				{
					if (response.Items[0])
					{
						return response.Items[0];
					}
					else
					{
						tf.promiseBootbox.alert("The Thematic (" + entityName + ") that you had applied has been deleted.  It is no longer available.").then(function()
						{
							self.refreshThematicsGrid();
						});
					}
				}
			});
	};


	/**
	 * Apply newly-added thematics
	 * @param {Object} entity The new thematics entity.
	 * @return {void}
	 */
	ManageThematicsViewModel.prototype.applyNewThematics = function(entity)
	{
		var self = this;
		if (!entity) { return; }
		if (self.thematicType === TF.ThematicTypeEnum.MAP)
		{
			if (self.selectedIdOnMap !== undefined && self.selectedIdOnMap !== null)
			{
				tf.promiseBootbox.yesNo("Would you like to apply the new thematic to the map?", "Confirmation").then(function(result)
				{
					if (result)
					{
						self.onApplyThematicsToMap.notify(entity);
					}
					else
					{
						self.refreshThematicsGrid();
					}
				});
			}
			else
			{
				self.onApplyThematicsToMap.notify(entity);
			}
		}
		else
		{
			self.onThematicsAdded.notify(entity);
			self.refreshThematicsGrid();
		}
	};

	/**
	 * Apply thematic to map.
	 * @param {Object} entity The new thematics entity.
	 * @return {void}
	 */
	ManageThematicsViewModel.prototype.apply = function(id, name)
	{
		var self = this, selectId = id ? id : self.selectedId, selectName = name ? name : self.selectedName;
		if (self.selectedIdOnMap === selectId)
		{
			return self.selectThematic;
		}
		else
		{
			return {
				"Id": selectId,
				"Name": selectName
			};
		}
	};

	/**
	 * Get a thematic info copy from selected thematic.
	 * @return {Object} The thematic entity.
	 */
	ManageThematicsViewModel.prototype.getSelectedThematicCopy = function()
	{
		var self = this, thematic = {};
		$.extend(true, thematic, self.selectThematic);
		return thematic;
	};

	/**
	 * Dispose function.
	 * @return {void}
	 */
	ManageThematicsViewModel.prototype.dispose = function()
	{
		var self = this;

		if (self.kendoGrid)
		{
			self.kendoGrid.destroy();
		}

		self.onApplyThematicsToMap.unsubscribeAll();
		self.onThematicsDeleted.unsubscribeAll();
		self.onThematicsEdited.unsubscribeAll();
		self.onThematicsAdded.unsubscribeAll();
	};
})();
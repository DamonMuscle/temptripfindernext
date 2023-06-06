(function()
{
	createNamespace("TF.Grid").KendoGridFilterMenu = KendoGridFilterMenu;

	function convertToOldGridDefinition(gridDefinition)
	{
		return gridDefinition.Columns.map(function(definition)
		{
			return TF.Grid.GridHelper.convertToOldGridDefinition(definition);
		});
	}

	function KendoGridFilterMenu()
	{
		this.inited = false;
		this._storageFilterDataKey = "grid.currentfilter." + this.getStorageKeyId() + ".id";
		this._storageGeoRegionTypeIdKey = "grid.currentGeoRegionType." + this.getStorageKeyId() + ".id";
		this._storageDisplayQuickFilterBarKey = "grid.displayQuickFilterBar." + this._gridType;
		this.obHeaderFilters = ko.observableArray([]);
		this.obGridFilterDataModels = ko.observableArray();
		this.obFieldTripStageFilters = ko.observableArray();
		this.selectedFieldTripStageFilters = ko.observableArray();

		this.obGridFilterDataModelsFromDataBase = ko.computed(function()
		{
			var filterDataModels = Enumerable.From(this.obGridFilterDataModels()).Where(function(c)
			{
				return c.id() > 0;
			}).ToArray();

			if (TF.isPhoneDevice && this.obSelectedGridFilterId && this.obSelectedGridFilterId())
			{
				var tmpFilterDataModels = [];
				filterDataModels.forEach(function(filterDataModel, idx)
				{
					if (filterDataModel.id() === this.obSelectedGridFilterId())
						tmpFilterDataModels.splice(0, 0, filterDataModels[idx]);
					else
						tmpFilterDataModels.push(filterDataModels[idx]);
				}, this);
				filterDataModels = tmpFilterDataModels;
			}

			return filterDataModels;
		}, this);

		this.obGridFilterDataModelsFormDashBoard = ko.computed(function()
		{
			return Enumerable.From(this.obGridFilterDataModels()).Where(function(c)
			{
				return c.id() < 0 && c.type() !== "relatedFilter";
			}).ToArray();
		}, this);

		this.obGridFilterDataModelsFromRelatedFilter = ko.computed(function()
		{
			return Enumerable.From(this.obGridFilterDataModels()).Where(function(c)
			{
				return c.type() === "relatedFilter";
			}).ToArray();
		}, this);

		this.obSelectedGridFilterId = ko.observable();
		if (this._gridState && typeof this._gridState.gridFilterId == "number")
		{
			this.obSelectedGridFilterId(this._gridState.gridFilterId);
		}
		this.subscriptions.push(this.obSelectedGridFilterId.subscribe(this._selectedGridFilterIdChange, this));
		this.saveFilterClick = this.saveFilterClick.bind(this);
		this.manageFilterClick = this.manageFilterClick.bind(this);
		this.createNewFilterClick = this.createNewFilterClick.bind(this);
		this.saveAsNewFilterClick = this.saveAsNewFilterClick.bind(this);
		this.clearGridFilterClick = this.clearGridFilterClick.bind(this);
		this.onClearGridFilterClickEvent = new TF.Events.Event();
		this.onRefreshPanelEvent = new TF.Events.Event();
		this.onFieldTripStageChanged = new TF.Events.Event();
		this.gridFilterClick = this.gridFilterClick.bind(this);
		this.quickFilterBarClick = this.quickFilterBarClick.bind(this);
		this.noApplyFilterNoModified = ko.observable(true);
		this.obCallOutFilterName = ko.observable(this.options.callOutFilterName);

		this.obSelectedGridFilterDataModel = ko.computed(this._selectedGridFilterDataModelComputer, this);
		this.subscriptions.push(this.obSelectedGridFilterDataModel.subscribe(this._omitRecordsChange, this));
		this.obSelectedGridFilterClause = ko.computed(this._selectedGridFilterWhereClauseComputer, this);
		this.obSelectedGridFilterType = ko.computed(this._selectedGridFilterTypeComputer, this);
		this.obSelectedGridFilterName = ko.computed(this._selectedGridFilterNameComputer, this);

		this.obSelectedStaticFilterName = ko.computed(function()
		{
			if (this.obSelectedGridFilterDataModel())
			{
				return this.obSelectedGridFilterDataModel().isStatic() ? this.obSelectedGridFilterDataModel().whereClause() : "";
			}
			return null;
		}, this);
		this.obIsSystemFilter = ko.computed(function()
		{
			if (this.obSelectedGridFilterDataModel())
			{
				return this.obSelectedGridFilterDataModel().isSystem() ? true : false;
			}
			return false;
		}, this);

		this.subscriptions.push(this.obHeaderFilters.subscribe(this._currentFilterChange, this));
		this.subscriptions.push(this.obHeaderFilterSets.subscribe(this._currentFilterChange, this));

		this.obIsQuickFilterApplied = ko.computed(function()
		{
			var quickFilters = this.obHeaderFilters(),
				quickFilterSets = this.obHeaderFilterSets(),
				isQuickFilterApplied = ((quickFilters && quickFilters.length) || (quickFilterSets && quickFilterSets.length));

			$('.grid-filter-clear-all').toggleClass('quick-filter-applied', isQuickFilterApplied);

		}, this);

		this.obSelectedGridFilterModified = ko.computed(this._selectedGridFilterModifiedComputer, this);
		this.obSelectedGridFilterModifiedMessage = ko.computed(() =>
		{
			return this.obSelectedGridFilterModified() ? "(modified)" : ""
		}, this);

		this.obQuickFilterBarCheckIcon = ko.observable("menu-item-checked");

		this.initReminder();
		if (this.options.gridType === "fieldtrip")
		{
			this.initFieldTripStageFilters();
		}
	}

	KendoGridFilterMenu.prototype.getFieldTripStageName = function(id)
	{
		switch (id)
		{
			case (1):
				return "Level 1 - Request Submitted";
			case (2):
				return "Level 2 - Request Declined";
			case (3):
				return "Level 2 - Request Approved";
			case (4):
				return "Level 3 - Request Declined";
			case (5):
				return "Level 3 - Request Approved";
			case (6):
				return "Level 4 - Request Declined";
			case (7):
				return "Level 4 - Request Approved";
			case (98):
				return "Declined by Transportation";
			case (99):
				return "Transportation Approved";
			case (100):
				return "Canceled - Request Canceled";
			case (101):
				return "Completed - Request Completed";
		}
	};

	KendoGridFilterMenu.prototype.gridFieldTripFilterClick = function(id, e)
	{
		var self = this, $target = $(e.target).closest(".menu-item"), index;

		if ($target.hasClass("menu-item-checked"))
		{
			self.selectedFieldTripStageFilters.remove(id);
		}
		else
		{
			index = self.selectedFieldTripStageFilters.indexOf(id);
			if (index < 0)
			{
				self.selectedFieldTripStageFilters.push(id);
			}
		}
		self.onFieldTripStageChanged.notify();
	};

	KendoGridFilterMenu.prototype.initFieldTripStageFilters = function()
	{
		var stageIds = [];
		if (tf.authManager.authorizationInfo.isAdmin || tf.authManager.isAuthorizedFor("transportationAdministrator", "read"))
		{
			stageIds = [101, 100, 99, 98, 7, 6, 5, 4, 3, 2, 1];
		}
		else if (tf.authManager.isAuthorizedFor("level4Administrator", "read"))
		{
			stageIds = [7, 6, 5, 4];
		}
		else if (tf.authManager.isAuthorizedFor("level3Administrator", "read"))
		{
			stageIds = [5, 4, 3, 2];
		}
		else if (tf.authManager.isAuthorizedFor("level2Administrator", "read"))
		{
			stageIds = [3, 2, 1];
		}
		else if (tf.authManager.isAuthorizedFor("level1Administrator", "read"))
		{
			stageIds = [1];
		}
		this.selectedFieldTripStageFilters($.extend([], stageIds));
		this.obFieldTripStageFilters(stageIds);
	};

	KendoGridFilterMenu.prototype._omitRecordsChange = function()
	{
		var omittedRecords = [];
		if (this.obSelectedGridFilterDataModel() && this.obSelectedGridFilterDataModel().omittedRecords())
		{
			for (var i = 0; i < this.obSelectedGridFilterDataModel().omittedRecords().length; i++)
			{
				omittedRecords.push(this.obSelectedGridFilterDataModel().omittedRecords()[i].OmittedRecordID);
			}
			this._gridState.filteredExcludeAnyIds = omittedRecords;
			this.obFilteredExcludeAnyIds(this._gridState.filteredExcludeAnyIds);
		}
	};

	KendoGridFilterMenu.prototype.getQuickFilterRawData = function()
	{
		var currentHeaderFilters = this.findCurrentHeaderFilters();
		var includeIds = this._gridState.filteredIds;
		var callOutFilterName = this.obCallOutFilterName();
		if (!currentHeaderFilters && includeIds && !callOutFilterName)
		{
			return null;
		}
		return new TF.SearchParameters(null, null, null, this.findCurrentHeaderFilters(), null, this._gridState.filteredIds, this.findCurrentOmittedRecords(), this.obCallOutFilterName());
	};

	KendoGridFilterMenu.prototype.saveQuickFilter = function(quickFilters)
	{
		var self = this;
		//IF the request from search, do not sticky quick filter.
		if (self.options.fromSearch || self.options.isTemporaryFilter)
		{
			return Promise.resolve();
		}
		var gridType = self.options.gridType;
		if (self.options.kendoGridOption && self.options.kendoGridOption.entityType)
		{
			gridType = self.options.kendoGridOption.entityType + "." + gridType;
		}
		return TF.Grid.FilterHelper.saveQuickFilter(gridType, quickFilters);
	};

	KendoGridFilterMenu.prototype.clearQuickFilter = function()
	{
		var self = this;
		//IF the request from search, do not sticky quick filter.
		if (self.options.fromSearch || self.options.isTemporaryFilter)
		{
			return Promise.resolve();
		}
		var gridType = self.options.gridType;
		if (self.options.kendoGridOption && self.options.kendoGridOption.entityType)
		{
			gridType = self.options.kendoGridOption.entityType + "." + gridType;
		}
		return TF.Grid.FilterHelper.clearQuickFilter(gridType);
	};

	KendoGridFilterMenu.prototype.getQuickFilter = function()
	{
		var self = this, gridType = self.options.gridType;
		if (self.options.kendoGridOption && self.options.kendoGridOption.entityType)
		{
			gridType = self.options.kendoGridOption.entityType + "." + gridType;
		}
		//IF the request from search or from a Dashboard Widget Grid, do not use the sticky quick filter.
		if (self.options.fromSearch || self.options.isTemporaryFilter
			|| (self.options.customGridType && self.options.customGridType.toLowerCase() === "dashboardwidget"))
		{
			return new TF.SearchParameters(null, null, null, null, null, null, null);
		}

		//If the request from mini grid. use sticky quick filter from options.
		if (self.options.isMiniGrid)
		{
			let filterSet = self.options.defaultFilter ? self.convertKendo2RequestFilterSet({}, self.options.defaultFilter) : null;
			return new TF.SearchParameters(null, null, null, filterSet, null, null, null);
		}

		return tf.storageManager.get(tf.storageManager.gridCurrentQuickFilter(gridType)) ||
			new TF.SearchParameters(null, null, null, null, null, null, null);
	};

	KendoGridFilterMenu.prototype.quickFilterBarClick = function()
	{
		var displayQuickFilterBar = false;
		if (this._quickFilterBarIsEnabled.bind(this)())
		{
			displayQuickFilterBar = !this._quickFilterBarDisplayed.bind(this)();
			this._setQuickFilterBarStatus.bind(this)(displayQuickFilterBar);
		}
		tf.storageManager.save(this._storageDisplayQuickFilterBarKey, displayQuickFilterBar);
	};

	KendoGridFilterMenu.prototype.initQuickFilterBar = function()
	{
		var self = this;
		if (self._quickFilterBarIsEnabled())
		{
			if (self.options.displayQuickFilterBar != null)
			{
				self._setQuickFilterBarStatus(self.options.displayQuickFilterBar);
				return;
			}
			var display = self._getStorageDisplayQuickFilterBarSetting();
			self._setQuickFilterBarStatus(display);
		}
	};

	KendoGridFilterMenu.prototype._getStorageDisplayQuickFilterBarSetting = function()
	{
		var display = tf.storageManager.get(this._storageDisplayQuickFilterBarKey);
		if (display === undefined) display = true;
		display = String.convertToBoolean(display);
		return display;
	};

	KendoGridFilterMenu.prototype._quickFilterBarIsEnabled = function()
	{
		var filterRow = this.$container.find(".k-grid-header").find(".k-filter-row");
		return (filterRow !== undefined && filterRow.length > 0);
	};

	KendoGridFilterMenu.prototype._quickFilterBarDisplayed = function()
	{
		var filterRow = this.$container.find(".k-grid-header").find(".k-filter-row");
		return !(filterRow[0].style.display == "none");
	};

	KendoGridFilterMenu.prototype._setQuickFilterBarStatus = function(display)
	{
		var filterRow = this.$container.children(".k-grid-header").find(".k-filter-row");
		if (display)
		{
			filterRow.css("display", "");
			this._filterHeight = 0;
			this.obQuickFilterBarCheckIcon("menu-item-checked");
		}
		else
		{
			filterRow.css("display", "none");
			this._filterHeight = filterRow.height();
			this.obQuickFilterBarCheckIcon("");
		}
		this.fitContainer();
		this.lightKendoGridDetail && this.lightKendoGridDetail.changeQuickFilterBarStatus(display);
	};

	KendoGridFilterMenu.prototype._selectedGridFilterModifiedComputer = function()
	{
		this._setgridStateTwoRowWhenOverflow && this._setgridStateTwoRowWhenOverflow();

		const quickFilters = this.obHeaderFilters();
		const quickFilterSets = this.obHeaderFilterSets();
		const isValidFilter = Array.isArray(quickFilters) && quickFilters.length > 0
			&& quickFilters.some(f => f['Operator'] != 'In' || f['Value'] != "");

		if (isValidFilter
			|| (Array.isArray(quickFilterSets) && quickFilterSets.length > 0)
			|| this.obTempOmitExcludeAnyIds().length > 0)
		{
			const filterModel = this.obSelectedGridFilterDataModel();

			if (filterModel && !(filterModel.isSystem() || filterModel.isStatic()))
			{
				return true;
			}
		}

		return false;
	};

	KendoGridFilterMenu.prototype._selectedGridFilterDataModelComputer = function()
	{
		const selectedFilterId = this.obSelectedGridFilterId();
		return this.obGridFilterDataModels().find(o => o.id() === selectedFilterId);
	};

	KendoGridFilterMenu.prototype._selectedGridFilterTypeComputer = function()
	{
		const filterModel = this.obSelectedGridFilterDataModel();
		return filterModel && filterModel.isForQuickSearch();
	};

	KendoGridFilterMenu.prototype._selectedGridFilterWhereClauseComputer = function()
	{
		const filterModel = this.obSelectedGridFilterDataModel();
		return filterModel && filterModel.whereClause();
	};

	KendoGridFilterMenu.prototype._selectedGridFilterNameComputer = function()
	{
		//show hide comma when filter and layout toggle split to tow row on tablet
		this._setgridStateTwoRowWhenOverflow && this._setgridStateTwoRowWhenOverflow();
		if (this.isFromRelated && this.isFromRelated())
		{
			return this.options.fromMenu;
		}

		const filterModel = this.obSelectedGridFilterDataModel();
		if (filterModel)
		{
			return filterModel.isValid() ? filterModel.name() : "None";
		}
		else if (this.obCallOutFilterName())
		{
			return this.obCallOutFilterName();
		}
		else if (this.options.fromSearch && !this._gridLoadingEnd)//IF the request from search, first go to view display "Search Results".
		{
			return "Search Results";
		}
		else if (this.options.isTemporaryFilter && this.options.filterName)
		{
			return this.options.filterName;
		}

		return "None";
	};

	KendoGridFilterMenu.prototype.filterMenuClick = function(e, done)
	{
		tf.contextMenuManager.showMenu(e.target, new TF.ContextMenu.TemplateContextMenu("workspace/grid/filtercontextmenu", new TF.Grid.GridMenuViewModel(this, this.searchGrid), done));
	};

	KendoGridFilterMenu.prototype.loadGridFilter = function(autoSetSummaryFliter)
	{
		if (this.options.layoutAndFilterOperation === false)
		{
			return Promise.resolve(true);
		}
		var self = this;
		return Promise.resolve(function()
		{
			if (!self.initialFilter)
				return self.clearQuickFilter();
			else
				return Promise.resolve(true);
		}).then(function()
		{
			return this._loadGridFilter(autoSetSummaryFliter);
		}.bind(self));
	};

	KendoGridFilterMenu.prototype.syncFilterRelationships = function(filterId)
	{
		const self = this;
		const gridFilters = self.obGridFilterDataModels();
		if (!gridFilters || !gridFilters.length)
		{
			return Promise.resolve();
		}

		const options = {
			"fields": "Id,AutoExportExists,AutoExports,Reminders",
			"relationships": "AutoExport,Reminder",
			"filterId": filterId
		};
		return self._findGridFilters(options).then((filters) =>
		{
			const filtersMap = {};
			filters.forEach(f =>
			{
				filtersMap[f.Id] = f;
			});

			gridFilters.forEach(gf =>
			{
				const filter = filtersMap[gf.id()];
				var isDirty = gf.apiIsDirty();
				if (filter)
				{
					gf.autoExportExists(!!filter.AutoExportExists);
					gf.autoExports(filter.AutoExports);
					gf.reminders(filter.Reminders);
				}
				else if (!filterId || gf.id() === filterId)
				{
					gf.autoExportExists(false);
					gf.autoExports(null);
					gf.reminders([]);
				}
				gf.apiIsDirty(isDirty);
			});

			return Promise.resolve();
		});
	}

	KendoGridFilterMenu.prototype._findGridFilters = function(options)
	{
		const self = this, filterUrl = "gridfilters";

		let filter = options.queryOtherDataSourceFilters ?
			`noteq(dbid, ${tf.datasourceManager.databaseId})&isnotnull(dbid,)&eq(datatypeId,${tf.dataTypeHelper.getId(self.options.gridType)})` :
			`(eq(dbid, ${tf.datasourceManager.databaseId})|isnull(dbid,))&eq(datatypeId,${tf.dataTypeHelper.getId(self.options.gridType)})`;

		if (self._gridType === 'form' && self.options && self.options.gridData && self.options.gridData.value)
		{
			filter = `${filter}&eq(udgridId,${self.options.gridData.value})`;
		}

		const paramData = { "@filter": filter };
		if (options.relationships)
		{
			paramData["@relationships"] = options.relationships;
		}
		if (options.fields)
		{
			paramData["@fields"] = options.fields;
		}
		if (options.filterId)
		{
			paramData["id"] = options.filterId;
		}

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), filterUrl), {
			paramData: paramData
		}, {
			overlay: self.options.customGridType !== "dashboardwidget"
		}).then(apiResponse => apiResponse.Items, () => []);
	}

	KendoGridFilterMenu.prototype._loadGridFilter = function(autoSetSummaryFliter)
	{
		var self = this;
		var filterUrl = "gridfilters";
		let filter = `(eq(dbid, ${tf.datasourceManager.databaseId})|isnull(dbid,))&eq(datatypeId,${tf.dataTypeHelper.getId(self.options.gridType)})`;

		let gridfiltersPromise = Promise.resolve([]);
		if (tf.permissions.filtersRead)
		{ 
			gridfiltersPromise = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), filterUrl), {
				paramData: {
					"@filter": filter,
					"@relationships": "OmittedRecord,Reminder"
				}
			}).then(apiResponse => apiResponse.Items, () => []);
		}
		let dataTypeId = tf.dataTypeHelper.getId(self._gridType);
		var staticfiltersPromise = Number.isInteger(dataTypeId) ? tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "staticfilters"), {
			paramData: {
				dataTypeId: dataTypeId
			}
		}).then(function(apiResponse)
		{
			var items = apiResponse.Items;
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), 'reminders'), {
				paramData: {
					"@filter": String.format("(in(StaticFilterName,{0}))", items.join(','))
				}
			}).then(apiResponse =>
			{
				return items.map((item, index) =>
				{
					return {
						Id: -(index + 1),
						IsValid: true,
						DataTypeID: dataTypeId,
						Name: item,
						WhereClause: item,
						Reminders: apiResponse.Items.filter(r => r.StaticFilterName === item),
						IsStatic: true
					}
				})
			});
		}) : Promise.resolve([]);
		return Promise.all([gridfiltersPromise, staticfiltersPromise])
			.then(Items =>
			{
				const currentLayout = self._obCurrentGridLayoutExtendedDataModel();
				const layoutFilterId = currentLayout && currentLayout.filterId();

				var gridFilterDataModels = TF.DataModel.BaseDataModel.create(TF.DataModel.GridFilterDataModel, Items.flat());
				gridFilterDataModels.forEach(function(gridFilter)
				{
					if (gridFilter.reminders().length > 0)
					{
						gridFilter.reminderId(gridFilter.reminders()[0].Id);
						gridFilter.reminderUserId(gridFilter.reminders()[0].UserID);
					}
				});
				if (self.options.staticFilterName)
				{
					let staticFilters = Items[1].filter(i => i.Name === self.options.staticFilterName);
					if (staticFilters.length > 0)
					{
						self.options.filterId = staticFilters[0].Id;
					}
				}

				//IF the request from search, do not use the sticky filter.
				if (self.options.fromSearch || self.options.isTemporaryFilter)
				{
					self.obGridFilterDataModels(gridFilterDataModels);
					return Promise.resolve();
				}
				var selectGridFilterEntityId;
				if (self.options && self.options.changeStorageKey)
				{
					self._storageFilterDataKey = self.options.changeStorageKey(self._storageFilterDataKey);
				}
				if ($.isNumeric(self.options.filterId) && self.options.filterId !== 0)
				{
					selectGridFilterEntityId = self.options.filterId;
				}
				else if (tf.storageManager.get(self._storageFilterDataKey, true))
				{
					//open new grid in viewfinder is use local storage
					selectGridFilterEntityId = tf.storageManager.get(self._storageFilterDataKey, true);
					if (!TF.isPhoneDevice)
					{
						tf.storageManager.save(self._storageFilterDataKey, selectGridFilterEntityId);
					}
					tf.storageManager.delete(self._storageFilterDataKey, true);
				}
				else if (self.options.gridLayout)
				{
					// dashboard grid.
					selectGridFilterEntityId = self.options.gridLayout.FilterId;
				} else if (tf.girdFilterFromNewWindow && tf.girdFilterFromNewWindow.gridType == self._gridType)
				{
					selectGridFilterEntityId = tf.girdFilterFromNewWindow;
					delete tf.girdFilterFromNewWindow;
				} else if (self.options.predefinedGridData && self.options.predefinedGridData.gridType == self._gridType)
				{
					selectGridFilterEntityId = self.options.predefinedGridData;
				}
				else
				{
					if (tf.isViewfinder)
					{
						if (tf.userPreferenceManager.getUserSetting("shouldRetainGridFilter"))
						{
							selectGridFilterEntityId = tf.storageManager.get(self._storageFilterDataKey) || layoutFilterId;
						} else
						{
							var temporaryFilterIdKey = "grid.temporaryfilter." + self._gridType + ".id";
							selectGridFilterEntityId = parseInt(tf.storageManager.get(temporaryFilterIdKey, true, true)) || null;
							tf.storageManager.delete(temporaryFilterIdKey, true, true);
						}
					} else
					{
						selectGridFilterEntityId = tf.storageManager.get(self._storageFilterDataKey) || layoutFilterId;
					}
				}

				if (selectGridFilterEntityId && selectGridFilterEntityId.filteredIds)
				{
					self.relatedFilterEntity = selectGridFilterEntityId;
				} else
				{
					self.relatedFilterEntity = undefined;
				}

				if (getQueryString("filterId"))
				{
					selectGridFilterEntityId = parseInt(getQueryString("filterId"));
				}

				// for the specific filters in the summary page of the viewfinderweb
				if (self.options.summaryFilters && self.options.summaryFilters.length > 0)
				{
					var summaryGridFilterDataModels = TF.DataModel.BaseDataModel.create(TF.DataModel.GridFilterDataModel, self.options.summaryFilters);
					gridFilterDataModels = gridFilterDataModels.concat(summaryGridFilterDataModels);
					self.obGridFilterDataModels(gridFilterDataModels);
					self._sortGridFilterDataModels();
					if (!self.inited)
					{
						if (!selectGridFilterEntityId && self.options.defaultFilter)
						{
							selectGridFilterEntityId = self.options.defaultFilter;
						}
						if (self.options.summaryFilterFunction && selectGridFilterEntityId && selectGridFilterEntityId < 0 && selectGridFilterEntityId != -9000 && autoSetSummaryFliter !== false)
						{
							self.obSelectedGridFilterId(selectGridFilterEntityId);
							return self.options.summaryFilterFunction(selectGridFilterEntityId)
								.then(function(filteredIds)
								{
									if ($.isArray(filteredIds))
									{
										self._gridState.filteredIds = self.mergeFilterIds(filteredIds);
									}
									else if (typeof (filteredIds) === "string")
									{
										self._gridState.filterClause = filteredIds;
									}
								});
						}
					}
				}
				else
				{
					self.obGridFilterDataModels(gridFilterDataModels);
				}

				if (self.relatedFilterEntity && self.relatedFilterEntity.filteredIds)
				{	//used to get new grid filter both route finder and view finder
					if (self._gridState)
					{
						self._gridState.filteredIds = self.relatedFilterEntity.filteredIds;
					}
					self.options.fromMenu = self.relatedFilterEntity.filterName;

					self.isFromRelated(true);
					var relatedFilter = [{
						Name: self.relatedFilterEntity.filterName,
						Id: -9000,
						Type: 'relatedFilter',
						IsValid: true
					}];
					var relatedFilterDataModels = TF.DataModel.BaseDataModel.create(TF.DataModel.GridFilterDataModel, relatedFilter);
					self.obGridFilterDataModels(gridFilterDataModels.concat(relatedFilterDataModels));
					if (!self.inited)
					{
						if (!self.obSelectedGridFilterId())
						{
							self.obSelectedGridFilterId(relatedFilter[0].Id);
						} else
						{
							self.isFromRelated(false);
						}
					}
				}

				if (selectGridFilterEntityId && typeof selectGridFilterEntityId == "number")
				{
					self.obSelectedGridFilterId(selectGridFilterEntityId);
				}
				self.inited = true;
				if (self._obCurrentGridLayoutExtendedDataModel && self._obCurrentGridLayoutExtendedDataModel())
				{
					return Promise.resolve();
				}
				return self.syncFilter();
			});
	};

	KendoGridFilterMenu.prototype.syncFilter = function(filterId)
	{
		// refresh UserPreference Cache before apply filter.
		var self = this;
		return tf.userPreferenceManager.getAllKey().then(function()
		{
			var filterId = filterId || tf.storageManager.get(self._storageFilterDataKey) || self.obSelectedGridFilterId();
			var message = 'The Filter that was applied has been deleted. The system default Filter will be applied to this grid.';
			return self._syncFilterAndNotifyStatusUpdated(filterId, message);
		});
	};

	KendoGridFilterMenu.prototype._syncFilterAndNotifyStatusUpdated = function(filterId, message)
	{
		var self = this;

		return TF.Grid.FilterHelper.validFilterId(filterId)
			.then(function(filterExist)
			{
				if (filterExist)
				{
					return true;
				}
				message = message || 'This Filter has been deleted. It cannot be applied.';
				return tf.promiseBootbox.alert(message, 'Warning', 40000)
					.then(function()
					{
						return Promise.all(
							self._deleteForeignKey.bind(self)(filterId),
							self._deleteStickFilter.bind(self)(filterId),
							self._clearFilterListCache.bind(self)(filterId),
							self._clearObSelectedGridFilterId.bind(self)(filterId)
						).then(() => false);
					});
			});
	};

	KendoGridFilterMenu.prototype._deleteForeignKey = function(filterId)
	{
		return tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridfilters", filterId));
	};

	KendoGridFilterMenu.prototype._deleteStickFilter = function(filterId)
	{
		var self = this;
		//IF the request from search, do not sticky filter.
		if (self.options.fromSearch || self.options.isTemporaryFilter)
		{
			return Promise.resolve(true);
		}
		var currentStickFilterId = tf.storageManager.get(self._storageFilterDataKey);
		if (currentStickFilterId === filterId)
			return tf.storageManager.save(self._storageFilterDataKey, '');
		else
			return Promise.resolve(true);
	};

	KendoGridFilterMenu.prototype._clearFilterListCache = function(filterId)
	{
		var self = this;
		for (var i = 0; i < self.obGridFilterDataModels().length; i++)
		{
			if (self.obGridFilterDataModels()[i].id() === filterId)
			{
				self.obGridFilterDataModels.remove(self.obGridFilterDataModels()[i]);
				i--;
				break;
			}
		}
		return Promise.resolve(true);
	};

	KendoGridFilterMenu.prototype._clearObSelectedGridFilterId = function(filterId)
	{
		var self = this;
		if (self.obSelectedGridFilterId() === filterId)
			self.obSelectedGridFilterId(null);
		return Promise.resolve(true);
	};

	KendoGridFilterMenu.prototype.saveFilterClick = function()
	{
		var self = this;
		var isNew = self.obSelectedGridFilterDataModel() ? false : true;
		if (isNew)
		{
			return self.saveAndEditGridFilter("new", self.obSelectedGridFilterDataModel(), true, true);
		}
		else
		{
			return self.saveFilter().then(function(result)
			{
				if (!result) return;

				self.clearKendoGridQuickFilter();
			});
		}
	};

	KendoGridFilterMenu.prototype.createNewFilterClick = function()
	{
		var options = { title: "New Filter" };
		this.saveAndEditGridFilter("new", undefined, undefined, undefined, options);
	};

	KendoGridFilterMenu.prototype.saveAsNewFilterClick = function()
	{
		if (this.obSelectedGridFilterDataModel())
		{
			this.saveAndEditGridFilter("new", this.obSelectedGridFilterDataModel(), true, true);
		}
		else
		{
			this.saveFilterClick();
		}
	};

	KendoGridFilterMenu.prototype._findOtherDataSourceGridFilters = function()
	{
		const _basicFilterOptions = {
			// "fields": "Id,AutoExportExists,AutoExports,Reminders",
			"relationships": "OmittedRecord,Reminder,AutoExport"
		}

		const qryFilterOptions = $.extend(_basicFilterOptions, { queryOtherDataSourceFilters: true });
		return this._findGridFilters(qryFilterOptions);
	}

	KendoGridFilterMenu.prototype.manageFilterClick = function()
	{
		Promise.all([
			this._findOtherDataSourceGridFilters(),
			this.syncFilterRelationships()
		]).then(function(ret)
		{
			const otherGridFilters = ret[0] || [];
			const otherGridFilterDataModels = TF.DataModel.BaseDataModel.create(TF.DataModel.GridFilterDataModel, otherGridFilters);
			// hide the otherGridFilterDataModels in phone device for VIEW-6244
			let gridFilterDataModels = TF.isPhoneDevice && tf.isViewfinder ? this.obGridFilterDataModels() : this.obGridFilterDataModels().concat(otherGridFilterDataModels);
			const filterData = ko.observableArray(gridFilterDataModels);
			filterData.sort(this._sortGridFilterDataModelsInternal);

			var selectedFilterModelJSONString = JSON.stringify(this.obSelectedGridFilterDataModel() ? this.obSelectedGridFilterDataModel().toData() : null);
			const manageFilterModal = new TF.Modal.Grid.ManageFilterModalViewModel({
				obAllFilters: filterData,
				editFilter: this.saveAndEditGridFilter.bind(this),
				applyFilter: this.applyGridFilter.bind(this),
				filterName: this.obSelectedGridFilterName,
				reminderHide: this.options.reminderOptionHide,
			});
			const manageFilterModalViewModel = manageFilterModal.data();

			manageFilterModalViewModel.onFilterDeleted.subscribe((evt, filterId) =>
			{
				const currentLayout = this._obCurrentGridLayoutExtendedDataModel();
				if (currentLayout.filterId() === filterId)
				{
					this.clearFilter();
					this.clearGridFilterClick();
				}

				const allLayouts = this.obGridLayoutExtendedDataModels();
				allLayouts.forEach(layout =>
				{
					if (layout.filterId() === filterId)
					{
						layout.filterId(0);
						layout.filterName("");
					}
				});

				this._clearFilterListCache(filterId);
			});

			manageFilterModalViewModel.onFilterEdited.subscribe((evt, filterData) =>
			{
				const filterDataChanged = typeof filterData !== "boolean";
				if (filterDataChanged && selectedFilterModelJSONString !== JSON.stringify(typeof filterData === "object" ? filterData.toData() : null))
				{
					this.refreshClick();
				}
			});

			tf.modalManager.showModal(manageFilterModal);

		}.bind(this));
	};

	/**
	 * Clear predefined grid filter state, e.g. from share link.
	 *
	 */
	KendoGridFilterMenu.prototype.clearPredefinedGridFilter = function()
	{
		const self = this;

		if (self.isFromRelated())
		{ //if is from related, the id not change, so need refresh it
			self._selectedGridFilterIdChange();
		}

		//need change the is from related once clear filter, don't change the position
		self.isFromRelated(false);
		delete self.relatedFilterEntity;

		if (self.options.predefinedGridData)
		{
			delete self.options.predefinedGridData.filteredIds;
		}
	};

	KendoGridFilterMenu.prototype.clearGridFilterClick = function()
	{
		var self = this;
		if (self.lightKendoGridDetail)
		{
			self.lightKendoGridDetail.refresh();
		}

		self.clearFilter();
		self.clearKendoGridQuickFilter();
		self.onClearGridFilterClickEvent.notify();
		if (TF.isMobileDevice && tf.isViewfinder)
		{
			return self.rebuildGrid().then(function()
			{
				self.onRefreshPanelEvent.notify();
			});
		}
		else
		{
			return self.rebuildGrid();
		}
	};

	KendoGridFilterMenu.prototype.clearFilter = function()
	{
		var self = this;
		self.obCallOutFilterName(null);
		self.options.callOutFilterName = null;
		self.options.searchFilter = null;
		self.obSelectedGridFilterId(null);
		if (self.options && self.options.changeStorageKey)
		{
			self._storageFilterDataKey = self.options.changeStorageKey(self._storageFilterDataKey);
		}
		//IF the request from search, do not sticky filter.
		if (!self.options.fromSearch && !self.options.isTemporaryFilter)
		{
			tf.storageManager.delete(self._storageFilterDataKey);
			tf.storageManager.delete(tf.storageManager.gridCurrentQuickFilter(self.options.gridType));
		}
		self.obClassicFilterSet(null);
		tf.storageManager.delete(tf.storageManager.gridCurrentClassicSearchFilter(self.options.gridType));
		if (self.isFromRelated())
		{ //if is from related, the id not change, so need refresh it
			self._selectedGridFilterIdChange();
		}

		//need change the is from related once clear filter, don't change the position
		self.isFromRelated(false);

		self.getSelectedIds([]);
		self.obTempOmitExcludeAnyIds([]);
		self.obFilteredExcludeAnyIds([]);

		self.shouldIncludeAdditionFilterIds = false;
		if (self.additionalFilterIds)
		{
			// If there is change to be reverted, show the loading indicator.
			self.additionalFilterIds = null;
			self.shouldIncludeAdditionFilterIds = false;
		}

		self._gridState.filteredIds = null;
		self._gridState.filterClause = "";
		self._filteredIds = null;
	};

	KendoGridFilterMenu.prototype.gridFilterClick = function(viewModel, event)
	{
		//need change the is from related once clear filter
		this.isFromRelated && this.isFromRelated(false);

		var isCheckedItem = $(event.target).parent().hasClass('menu-item-checked') && !$(event.target).parent().hasClass('menu-item-broken');
		this.options.searchFilter = null;
		if (TF.isPhoneDevice && isCheckedItem)
		{
			this.clearGridFilterClick();
		}
		else
		{
			this.applyGridFilter(viewModel);
			if (TF.isPhoneDevice && tf.isViewfinder)
			{
				this.onRefreshPanelEvent.notify();
			}
		}
	};

	KendoGridFilterMenu.prototype.saveAndEditGridFilter = function(isNew, gridFilterDataModel, getCurrentHeaderFilters, getCurrentOmittedRecords, options)
	{
		options = options || {};
		options.currentObFilters = this.obGridFilterDataModels.slice();

		const currentHeaderFilters = this.findCurrentHeaderFilters(true);

		return tf.modalManager.showModal(
			new TF.Modal.Grid.ModifyFilterModalViewModel(
				this.options.gridType, isNew,
				gridFilterDataModel ? gridFilterDataModel : null,
				getCurrentHeaderFilters ? currentHeaderFilters : null,
				{
					Columns: convertToOldGridDefinition(this.options.gridDefinition)
				},
				this.getOmittedRecordsID(gridFilterDataModel, getCurrentOmittedRecords),
				options,
				getCurrentHeaderFilters ? this.options.searchFilter : null
			)
		)
			.then(function(result)
			{
				if (!result)
				{
					return true;
				}
				var savedGridFilterDataModel = result.savedGridFilterDataModel;
				if (savedGridFilterDataModel)
				{
					if (isNew !== "new")
					{
						gridFilterDataModel.update(savedGridFilterDataModel.toData());
					}
					else
					{
						this.obGridFilterDataModels.push(savedGridFilterDataModel);
					}
					if (result.applyOnSave)
					{
						this.options.searchFilter = null;
						return this.setGridFilter(savedGridFilterDataModel);
					}
				}
				return savedGridFilterDataModel;
			}.bind(this));
	};

	KendoGridFilterMenu.prototype.getOmittedRecordsID = function(gridFilterDataModel, getCurrentOmittedRecords)
	{
		var currentOmittedRecordIDs = [];
		if (getCurrentOmittedRecords)
		{
			return currentOmittedRecordIDs = this.obFilteredExcludeAnyIds() ? this.obFilteredExcludeAnyIds().concat(this.obTempOmitExcludeAnyIds()) : this.obTempOmitExcludeAnyIds();
		}
		else
		{
			if (gridFilterDataModel == null)
			{
				return;
			}

			if (gridFilterDataModel.omittedRecords())
			{
				return currentOmittedRecordIDs.concat(gridFilterDataModel.omittedRecords().map(function(record) { return record.OmittedRecordID }));
			}
			else
			{
				return currentOmittedRecordIDs;
			}
		}
	};

	//save filter on change without open model
	KendoGridFilterMenu.prototype.saveFilter = function()
	{
		var searchData = new TF.SearchParameters(null, null, null, this.findCurrentHeaderFilters(), null, null, null);
		if (this.obTempOmitExcludeAnyIds().length > 0)
		{
			if (this.obSelectedGridFilterDataModel().dBID() == null)
			{
				tf.promiseBootbox.alert("The filter cannot be saved as a cross data source filter because it references specific records.  You can save it as a new data source specific filter.");
				return Promise.resolve(false);
			}
			var filterID = this.obSelectedGridFilterDataModel().id();
			for (var i = 0; i < this.obTempOmitExcludeAnyIds().length; i++)
			{
				var tempOmittedRecords = {
					FilterID: filterID,
					OmittedRecordID: this.obTempOmitExcludeAnyIds()[i],
					DBID: tf.datasourceManager.databaseId
				}
				this.obSelectedGridFilterDataModel().omittedRecords().push(tempOmittedRecords);
			}
		}
		if (!searchData.data.filterSet && this.obTempOmitExcludeAnyIds().length === 0)
		{
			var data = this.obSelectedGridFilterDataModel().toData(), oldDBID = data.DBID;
			data.DBID = TF.Grid.GridHelper.checkFilterContainsDataBaseSpecificFields(this.options.gridType, this.obSelectedGridFilterDataModel().whereClause()) ? tf.datasourceManager.databaseId : null;

			if (oldDBID == data.DBID) return Promise.resolve(false);

			return tf.promiseAjax.put(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridfilters", data.Id),
				{
					data: data
				}).then(function()
				{
					this.obSelectedGridFilterDataModel().update(data);
					return true;
				}.bind(this));
		}
		else if (!searchData.data.filterSet && this.obTempOmitExcludeAnyIds().length > 0) //only change omitted records
		{
			var data = this.obSelectedGridFilterDataModel().toData();
			return tf.promiseAjax.put(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridfilters", data.Id),
				{
					paramData: { "@relationships": "OmittedRecord" },
					data: data
				}).then(function(apiResponse)
				{
					this.obFilteredExcludeAnyIds(this.obFilteredExcludeAnyIds().concat(this.obTempOmitExcludeAnyIds()));
					this.obTempOmitExcludeAnyIds([]);
					this.obSelectedGridFilterDataModel().omittedRecords([]);
					if (apiResponse.Items.length > 0 && apiResponse.Items[0].OmittedRecords)
					{
						apiResponse.Items[0].OmittedRecords.forEach(function(omittedRecord)
						{
							this.obSelectedGridFilterDataModel().omittedRecords().push(omittedRecord);
						}.bind(this));
					}
					return true;
				}.bind(this));
		}
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", tf.dataTypeHelper.getEndpoint(this.options.gridType), "RawFilterClause"),
			{
				data: searchData.data.filterSet
			}).then(function(apiResponse)
			{
				this.obSelectedGridFilterDataModel().whereClause((this.obSelectedGridFilterDataModel().whereClause() ? this.obSelectedGridFilterDataModel().whereClause() + " AND " : "") + apiResponse.Items[0]);
			}.bind(this)).then(function()
			{
				var data = this.obSelectedGridFilterDataModel().toData();
				data.DBID = TF.Grid.GridHelper.checkFilterContainsDataBaseSpecificFields(this.options.gridType, this.obSelectedGridFilterDataModel().whereClause()) ? tf.datasourceManager.databaseId : null;
				return tf.promiseAjax.put(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridfilters", data.Id),
					{
						data: data
					});
			}.bind(this)).then(function()
			{
				return true;
			});
	};

	KendoGridFilterMenu.prototype.triggerClearQuickFilterBtn = function()
	{
		if ($('.grid-filter-clear-all'))
		{
			$('.grid-filter-clear-all').trigger('mousedown');
		}
	};

	KendoGridFilterMenu.prototype.clearQuickFilterCompent = function()
	{
		var self = this;
		self.triggerClearQuickFilterBtn();
		self.obHeaderFilters([]);
	};
	KendoGridFilterMenu.prototype.applyGridFilter = function(gridFilterDataModel)
	{
		var self = this;

		var currentFilterId = self.obSelectedGridFilterId();
		var nextFilterId = gridFilterDataModel.id();

		if (TF.Grid.FilterHelper.isDrillDownFillter(currentFilterId))
		{
			self.obHeaderFilters([]);
		}

		return self._syncFilterAndNotifyStatusUpdated(nextFilterId)
			.then(function(nextFilterExistence)
			{
				if (TF.Grid.FilterHelper.isDrillDownFillter(nextFilterId) && self.obHeaderFilters.length > 0)
				{
					self.clearQuickFilterCompent();
				}
				if (nextFilterExistence)
				{
					return self.setGridFilter(gridFilterDataModel, true);
				}
				return false;
			});
	};

	KendoGridFilterMenu.prototype.setGridFilter = function(gridFilterDataModel, isApplyFilter)
	{
		if (!gridFilterDataModel.isValid())
		{
			return tf.promiseBootbox.alert("Filter syntax is invalid. It cannot be applied.", 'Warning', 40000).then(function()
			{
				return false;
			}.bind(this));
		}
		this.obSelectedGridFilterId(gridFilterDataModel.id());
		if (isApplyFilter)
		{
			this.setCurrentFilter(gridFilterDataModel);
			return;
		}

		return this.loadGridFilter(false).then(() => { this.setCurrentFilter(gridFilterDataModel) });
	};

	KendoGridFilterMenu.prototype.setCurrentFilter = function(gridFilterDataModel)
	{
		var self = this;
		function refresh()
		{
			var filter = {};
			self.initStatusBeforeRefresh();
			self.kendoGrid.dataSource.filter(filter);
			self.clearDateTimeNumberFilterCellBeforeRefresh();
		}
		if (gridFilterDataModel.type() == "relatedFilter")
		{
			self._gridState.filteredIds = this.relatedFilterEntity.filteredIds;
			self._gridState.filterClause = "";
			refresh();
			return false;
		}
		else if (this.options.summaryFilterFunction && gridFilterDataModel.id() < 0)
		{
			return this.options.summaryFilterFunction(gridFilterDataModel.id())
				.then(function(filteredIds)
				{
					if ($.isArray(filteredIds))
					{
						this._gridState.filteredIds = filteredIds;
					}
					else if (typeof (filteredIds) === "string")
					{
						delete this._gridState.filteredIds;
						this._gridState.filterClause = filteredIds;
					}
					refresh();
					return false;
				}.bind(this));
		}
		else
		{
			refresh();
			return Promise.resolve(false);
		}
	}

	KendoGridFilterMenu.prototype._currentFilterChange = function()
	{
		if (!this.initialFilter)
		{
			var quickFilter = this.getQuickFilterRawData();
			if (quickFilter)
				this.saveQuickFilter(quickFilter);
		}
	};

	KendoGridFilterMenu.prototype._selectedGridFilterIdChange = function()
	{
		const self = this;
		self.obClassicFilterSet(null);

		const selectedFilterId = self.obSelectedGridFilterId();
		const currentLayout = self._obCurrentGridLayoutExtendedDataModel();

		if (currentLayout && currentLayout.filterId() !== selectedFilterId)
		{
			currentLayout.filterId(selectedFilterId);
			if (!selectedFilterId)
			{
				currentLayout.filterName('');
			}

			self._currentLayoutChange();
		}

		self.raiseGridStateChange && self.raiseGridStateChange();

		if (!selectedFilterId || selectedFilterId > 0)
		{
			//_filteredIds is the setting from outside, not grid inside.
			self._gridState.filteredIds = self._filteredIds;
		}

		//IF the request from search, do not sticky fliter.
		if (self.options.fromSearch || self.options.isTemporaryFilter)
		{
			return;
		}

		if (self.options && self.options.changeStorageKey)
		{
			self._storageFilterDataKey = self.options.changeStorageKey(self._storageFilterDataKey);
		}

		const currentFilter = self.obGridFilterDataModels().find(o => o.id() === selectedFilterId);
		if (!currentFilter)
		{
			tf.storageManager.delete(self._storageFilterDataKey);
		}
		else if (currentFilter.type() !== "relatedFilter" && (!self.options.customGridType || self.options.customGridType.toLowerCase() != "dashboardwidget"))
		{
			tf.storageManager.save(self._storageFilterDataKey, selectedFilterId);
		}
	};

	KendoGridFilterMenu.prototype.findCurrentHeaderFilters = function(forRawFilterClause)
	{
		let filterItems = $.extend(true, [], this.obHeaderFilters());
		let filterSets = $.extend(true, [], this.obHeaderFilterSets());
		let gridColumns = tf.dataTypeHelper.getGridDefinition(this._gridType) && tf.dataTypeHelper.getGridDefinition(this._gridType).Columns;

		const updateFilterValue = (_filterItems) =>
		{
			(_filterItems || []).forEach((filterItem) =>
			{
				const fieldItemDefinition = (gridColumns || []).find(item => item && (item.FieldName === filterItem.FieldName));
				if (fieldItemDefinition && !!fieldItemDefinition.isUTC && (filterItem.TypeHint || "").toLowerCase() === "datetime" &&
					TF.FilterHelper.dateTimeNilFiltersOperator.indexOf(filterItem.Operator.toLowerCase()) === -1)
				{
					filterItem.Value = toISOStringWithoutTimeZone(utcToClientTimeZone(moment(filterItem.Value).format("YYYY-MM-DDTHH:mm:ss")));
				}
			});
		};

		(filterItems && filterItems.length > 0) && updateFilterValue(filterItems);

		if (filterSets && filterSets.length > 0)
		{
			const updateFilterValueByFilterSets = (_filterSets) =>
			{
				(_filterSets || []).forEach(_filterSet =>
				{
					if (_filterSet.FilterSets && _filterSet.FilterSets.length > 0)
					{
						updateFilterValueByFilterSets(_filterSet.FilterSets);
					}

					if (_filterSet.FilterItems && _filterSet.FilterItems.length > 0)
					{
						updateFilterValue(_filterSet.FilterItems);
					}
				});
			};
			updateFilterValueByFilterSets(filterSets);
		}

		if (filterItems.length || filterSets.length)
		{
			var filterSet = new TF.FilterSet('And', filterItems, filterSets);
			var _dateTimeFields = tf.helpers.kendoGridHelper.getDateTimeFields(this._gridType);
			var _definitionDateTimeColumns = Array.from((gridColumns || []).filter(column => (column.type || "").toLowerCase() === "datetime" && column.isUTC), column => column.FieldName);
			var dateTimeFields = Array.from(new Set(_dateTimeFields.concat(_definitionDateTimeColumns)));
			if (forRawFilterClause && dateTimeFields.length)
			{
				filterSet = JSON.parse(JSON.stringify(filterSet));
				filterSet.IsConvertDateTimeToLocalFormat = true;
				this.setDateTimeSecondTypeHint(filterSet, dateTimeFields);
			}
			return filterSet;
		}
		return null;
	};

	KendoGridFilterMenu.prototype.setDateTimeSecondTypeHint = function(filterSet, dateTimeFields)
	{
		(filterSet.FilterSets || []).forEach(fs =>
		{
			this.setDateTimeSecondTypeHint(fs, dateTimeFields);
		});

		(filterSet.FilterItems || []).forEach(fi =>
		{
			if (dateTimeFields.indexOf(fi.FieldName) !== -1)
			{
				fi.TypeHint = "DateTimeSecond"; // DateTime will convert to range in one minute
			}
		});
	};

	KendoGridFilterMenu.prototype.findCurrentOmittedRecords = function()
	{
		return omittedRecords = this.obTempOmitExcludeAnyIds();
	};

	KendoGridFilterMenu.prototype.filterCausetoFilterSet = function(whereClause)
	{
		var arr = whereClause.replace(/ AND /g, ",").replace(/ OR /g, ",").split(",");
		var filterSet = [];
		arr.forEach(function(e)
		{
			var entity = this.convertFilter(e);
			if (entity)
			{
				filterSet.push(entity);
			}
		}.bind(this));

		return filterSet;
	};

	KendoGridFilterMenu.prototype.convertFilter = function(singleClause)
	{
		var operatorMap = {
			'=': 'eq',
			'<>': 'neq',
			"LIKE": 'contains',
			'>': 'gt',
			'>=': 'gte',
			'<': 'lt',
			'<=': 'lte'
		};

		var arr = singleClause.replace(/\s+/g, " ").split(" ");
		var definition = this.getDefinition.call(this, arr[0].substring(1, arr[0].length - 1));
		if (definition)
		{
			return {
				field: definition.FieldName,
				operator: operatorMap[arr[1]],
				value: this.getFieldValue.call(this, definition, arr[2])
			};
		}
	};

	KendoGridFilterMenu.prototype.getDefinition = function(dbName)
	{
		return this.options.gridDefinition.Columns.filter(function(definition)
		{
			if (definition.DBName)
			{
				return definition.DBName.toLowerCase() === dbName.toLowerCase();
			}
			return definition.FieldName.toLowerCase() === dbName.toLowerCase();
		})[0];
	};

	KendoGridFilterMenu.prototype.getFieldValue = function(definition, rawValue)
	{
		var type = definition.DBType ? definition.DBType : definition.type;
		switch (type)
		{
			case "string":
				return rawValue.substring(1, rawValue.length - 1).replace(/%/g, "");
			case "boolean":
				return rawValue == "true"
			case "integer":
				return parseInt(rawValue);
			case "number":
				return parseFloat(rawValue);
			case "date":
			case "time":
				return rawValue.substring(1, rawValue.length - 1).replace(/%/g, "");
			case "image": //there is no image type after tranfer
				break;
		}
		return arr[2][0] == "'" ? arr[2].substring(1, arr[2].length - 1).replace(/%/g, "") : arr[2];
	};

	KendoGridFilterMenu.prototype._sortGridFilterDataModels = function()
	{
		this.obGridFilterDataModels.sort(function(left, right)
		{
			if (left.id() < 0 && right.id() > 0)
			{
				return 1;
			}
			if (left.id() > 0 && right.id() < 0)
			{
				return -1;
			}
			return left.name().toLowerCase() == right.name().toLowerCase() ? 0 : (left.name().toLowerCase() < right.name().toLowerCase() ? -1 : 1);
		});
	};

	KendoGridFilterMenu.prototype._gridFilterDataModelsChange = function()
	{
		var self = this;
		if (this._gridFilterDataModelsChangeSubscription)
		{
			this._gridFilterDataModelsChangeSubscription.dispose();
		}
		this._sortGridFilterDataModels();
		this._gridFilterDataModelsChangeSubscription = this.obGridFilterDataModels.subscribe(this._gridFilterDataModelsChange, this);
		this.subscriptions.push(this._gridFilterDataModelsChangeSubscription);
		if (self.obSelectedGridFilterId() && self.obSelectedGridFilterId() != -9000 && !Enumerable.From(this.obGridFilterDataModels()).Where(function(c)
		{
			return c.id() == self.obSelectedGridFilterId();
		}).ToArray()[0])
		{
			this.obSelectedGridFilterId(null);
			this.refresh();
		}
	};

	KendoGridFilterMenu.prototype.mergeFilterIds = function(filteredIds)
	{
		if (!this._filteredIds)
		{ //if outside setting is null, just need current setting.
			return filteredIds;
		}

		var mergefilterIds = [];
		filteredIds.forEach(function(filter)
		{
			if (this._filteredIds.includes(filter))
			{
				mergefilterIds.push(filter);
			}
		}.bind(this));

		return mergefilterIds;
	};

	KendoGridFilterMenu.prototype.getBasicFilterCount = function()
	{
		var skip = 0;
		var take = 1;
		var omitIds = null;
		var filterSet = (this._gridState && this._gridState.filterSet) ? this._gridState.filterSet : null;
		if (this.obSelectedGridFilterDataModel() && this.obSelectedGridFilterDataModel().omittedRecords())
		{
			omitIds = this.obSelectedGridFilterDataModel().omittedRecords().map(function(o)
			{
				return o.OmittedRecordID;
			});
		}
		var filterClause = "";
		if (this._gridState && this._gridState.filterClause)
		{
			filterClause += this._gridState.filterClause;
		}
		if (this.obSelectedGridFilterClause())
		{
			filterClause += this.obSelectedGridFilterClause();
		}
		if(!(filterClause || "").trim())
		{
			filterClause = " 1=1";
		}
		var searchData = new TF.SearchParameters(skip, take, null, filterSet, filterClause, this._gridState.filteredIds, omitIds);
		searchData.data.fields = ['Id'];
		searchData.paramData.getCount = true;
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", tf.dataTypeHelper.getEndpoint(this._gridType)),
			{
				paramData: searchData.paramData,
				data: searchData.data
			}, { overlay: false })
			.then(function(response)
			{
				return response.FilteredRecordCount;
			})
			.catch(function()
			{
				throw false;
			});
	};

})();

(function()
{
	var KendoGridFilterMenu = TF.Grid.KendoGridFilterMenu;

	KendoGridFilterMenu.prototype.initReminder = function()
	{
		this.obReminderName = ko.observable(this.options.reminderName);
		this.obReminderId = ko.computed(function()
		{
			if (this.obSelectedGridFilterDataModel())
			{
				return this.obSelectedGridFilterDataModel().reminderId();
			}
			return 0;
		}, this);

		this.reminderMenuEnable = ko.computed(function()
		{
			return (this.obSelectedGridFilterId() > 0 || !!this.obSelectedStaticFilterName()) && !this.options.reminderOptionHide;
		}, this);
		this.loadGridFilter = this.loadGridFilter.bind(this);
		PubSub.subscribe(topicCombine(pb.DATA_CHANGE, "reminder"), this.loadGridFilter);
	};

	KendoGridFilterMenu.prototype.setReminder = function()
	{
		if ($.isNumeric(this.obReminderId()) && this.obReminderId() > 0)
		{
			TF.ReminderHelper.delete(this.obReminderId()).then(function(ans)
			{
				if (ans)
				{
					this.options.reminderName = "";
					this.obReminderName("");
					this.obSelectedGridFilterDataModel().reminderId(0);
					this.obSelectedGridFilterDataModel().reminderName("");
				}
			}.bind(this));
		}
		else
		{
			//set reminder
			this.saveAndEditGridFilter("edit", this.obSelectedGridFilterDataModel(), true, true,
				{
					isSetReminder: true
				}).then(function(ans)
				{
					if (ans)
					{
						if (this.obTempOmitExcludeAnyIds().length > 0) //only change omitted records
						{
							this.obFilteredExcludeAnyIds(this.obFilteredExcludeAnyIds().concat(this.obTempOmitExcludeAnyIds()));
							this.obTempOmitExcludeAnyIds([]);
						}
						this.clearKendoGridQuickFilter();
					}
				}.bind(this));
		}
	};
})();

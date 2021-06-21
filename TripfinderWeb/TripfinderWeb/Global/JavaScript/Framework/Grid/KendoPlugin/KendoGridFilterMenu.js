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
		this.obOpenRelatedFilter = ko.observable({});

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
		this.obSelectedGridFilterModifiedMessage = ko.computed(this._selectedGridFilterModifiedMessageComputer, this);
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
		if ((this.obHeaderFilters() && this.obHeaderFilters().length > 0 && !this._isFakeFilter())
			|| (this.obHeaderFilterSets() && this.obHeaderFilterSets().length > 0)
			|| this.obTempOmitExcludeAnyIds().length > 0)
		{
			return "modified";
		}
		else
		{
			return null;
		}
	};

	KendoGridFilterMenu.prototype._isFakeFilter = function()
	{
		var result = true;
		if (this.obHeaderFilters() && this.obHeaderFilters().length > 0)
		{
			this.obHeaderFilters().map(function(item)
			{
				if (item['Operator'] != 'In' || item['Value'] != "")
				{
					result = false;
				}
			});
		}
		return result;
	};

	KendoGridFilterMenu.prototype._selectedGridFilterModifiedMessageComputer = function()
	{
		this._setgridStateTwoRowWhenOverflow && this._setgridStateTwoRowWhenOverflow();
		if (
			this._selectedGridFilterModifiedComputer())
		{
			if (!this.obSelectedGridFilterDataModel() && !this.obCallOutFilterName() && (this.obSelectedGridFilterName() == 'None'))
			{
				this.noApplyFilterNoModified(false);
			}
			return "modified";
		}
		else
		{
			this.noApplyFilterNoModified(true);
			return null;
		}
	};


	KendoGridFilterMenu.prototype._selectedGridFilterDataModelComputer = function()
	{
		var gridFilterDataModels = this.obGridFilterDataModels();
		for (var i = 0; i < gridFilterDataModels.length; i++)
		{
			if (gridFilterDataModels[i].id() === this.obSelectedGridFilterId())
			{
				return gridFilterDataModels[i];
			}
		}
	};

	KendoGridFilterMenu.prototype._selectedGridFilterTypeComputer = function()
	{
		if (this.obSelectedGridFilterDataModel())
		{
			return this.obSelectedGridFilterDataModel().isForQuickSearch();
		}
		else
		{
			return false;
		}
	};

	KendoGridFilterMenu.prototype._selectedGridFilterWhereClauseComputer = function()
	{
		if (this.obSelectedGridFilterDataModel())
		{
			return this.obSelectedGridFilterDataModel().whereClause();
		}
		else
		{
			return null;
		}
	};

	KendoGridFilterMenu.prototype._selectedGridFilterNameComputer = function()
	{
		this.obResetLayout();
		//show hide comma when filter and layout toggle split to tow row on tablet
		this._setgridStateTwoRowWhenOverflow && this._setgridStateTwoRowWhenOverflow();
		if (this.isFromRelated && this.isFromRelated())
		{
			return this.options.fromMenu;
		}
		if (this.obSelectedGridFilterDataModel())
		{
			if (this.obSelectedGridFilterDataModel().isValid())
			{
				return this.obSelectedGridFilterDataModel().name();
			} else
			{
				return "None";
			}
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
		else
		{
			return "None";
		}
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

	KendoGridFilterMenu.prototype._loadGridFilter = function(autoSetSummaryFliter)
	{
		var self = this;
		var filterUrl = "gridfilters";
		var gridfiltersPromise = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), filterUrl), {
			paramData: {
				"@filter": String.format("(eq(dbid, {0})|isnull(dbid,))&eq(datatypeId,{1})", tf.datasourceManager.databaseId, tf.dataTypeHelper.getId(self.options.gridType)),
				"@relationships": "OmittedRecord,Reminder"
			}
		}).then(apiResponse => apiResponse.Items);
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
				if (!self.inited)
				{
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
					}
					else
					{
						if (tf.isViewfinder)
						{
							if (tf.userPreferenceManager.getUserSetting("shouldRetainGridFilter"))
							{
								selectGridFilterEntityId = tf.storageManager.get(self._storageFilterDataKey) || self._layoutFilterId;
							} else
							{
								var temporaryFilterIdKey = "grid.temporaryfilter." + self._gridType + ".id";
								selectGridFilterEntityId = parseInt(tf.storageManager.get(temporaryFilterIdKey, true, true)) || null;
								tf.storageManager.delete(temporaryFilterIdKey, true, true);
							}
						} else
						{
							selectGridFilterEntityId = tf.storageManager.get(self._storageFilterDataKey) || self._layoutFilterId;
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

		if (filterId && !message)
			message = 'This Filter has been deleted. It cannot be applied.';

		return TF.Grid.FilterHelper.validFilterId(filterId)
			.then(function(filterExist)
			{
				if (filterExist)
					return Promise.resolve(true);

				return tf.promiseBootbox.alert(message, 'Warning', 40000)
					.then(function()
					{
						return self._deleteForeignKey.bind(self)(filterId);
					})
					.then(function()
					{
						return self._deleteStickFilter.bind(self)(filterId);
					})
					.then(function()
					{
						return self._clearFilterListCache.bind(self)(filterId);
					})
					.then(function()
					{
						return self._clearObSelectedGridFilterId.bind(self)(filterId);
					})
					.then(function()
					{
						return Promise.resolve(false);
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

	KendoGridFilterMenu.prototype.manageFilterClick = function()
	{
		var selectedFilterModelJSONString = JSON.stringify(this.obSelectedGridFilterDataModel() ? this.obSelectedGridFilterDataModel().toData() : null);
		tf.modalManager.showModal(
			new TF.Modal.Grid.ManageFilterModalViewModel(
				this.obGridFilterDataModels,
				this.saveAndEditGridFilter.bind(this),
				this.applyGridFilter.bind(this),
				this.obSelectedGridFilterName,
				this.options.reminderOptionHide
			)
		).then(function()
		{
			if (selectedFilterModelJSONString != JSON.stringify(this.obSelectedGridFilterDataModel() ? this.obSelectedGridFilterDataModel().toData() : null))
			{
				this.refreshClick();
			}
		}.bind(this));
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
			tf.storageManager.save(self._storageFilterDataKey, null);
			tf.storageManager.save(tf.storageManager.gridCurrentQuickFilter(self.options.gridType), new TF.SearchParameters(null, null, null, null, null, null, null));
		}
		self.obClassicFilterSet(null);
		tf.storageManager.save(tf.storageManager.gridCurrentClassicSearchFilter(self.options.gridType), null);
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
		return tf.modalManager.showModal(
			new TF.Modal.Grid.ModifyFilterModalViewModel(
				this.options.gridType, isNew,
				gridFilterDataModel ? gridFilterDataModel : null,
				getCurrentHeaderFilters ? this.findCurrentHeaderFilters() : null,
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
				return true;
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

		return self._syncFilterAndNotifyStatusUpdated(gridFilterDataModel.id())
			.then(function(filterExisted)
			{
				if (filterExisted) {
					if (currentFilterId < 0) {
						return true;
					}
					return self.saveCurrentFilter();
				} else {
					return false;
				}
			})
			.then(function(ans)
			{
				if (TF.Grid.FilterHelper.isDrillDownFillter(nextFilterId) && self.obHeaderFilters.length > 0)
				{
					self.clearQuickFilterCompent();
				}

				var excuteSetFilter = true;
				if (typeof ans == 'boolean')
					excuteSetFilter = (ans !== false);
				else
					excuteSetFilter = (ans !== false && ans.operationResult !== null);

				if (excuteSetFilter)
					return self.setGridFilter(gridFilterDataModel);
				else
					return Promise.resolve(ans.operationResult);
			});
	};

	KendoGridFilterMenu.prototype.setGridFilter = function(gridFilterDataModel)
	{
		if (!gridFilterDataModel.isValid())
		{
			return tf.promiseBootbox.alert("Filter syntax is invalid. It cannot be applied.", 'Warning', 40000).then(function()
			{
				return false;
			}.bind(this));
		}
		this.obSelectedGridFilterId(gridFilterDataModel.id());
		return this.loadGridFilter(false).then(function()
		{
			var self = this;
			function refresh()
			{
				var filter = {};
				self.initStatusBeforeRefresh();
				self.kendoGrid.dataSource.filter(filter);
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
		}.bind(this));
	};

	KendoGridFilterMenu.prototype._currentFilterChange = function()
	{
		if (!this.initialFilter)
		{
			var quickFilter = this.getQuickFilterRawData();
			if (quickFilter)
				this.saveQuickFilter(quickFilter);
		}
	};

	KendoGridFilterMenu.prototype.saveCurrentFilter = function(triggerName)
	{
		var self = this;

		var handleResult = {
			savedResult: true,
			operationResult: true
		};

		if (self.obSelectedGridFilterId() &&
			(self.findCurrentHeaderFilters() || self.findCurrentOmittedRecords().length > 0))
		{
			var message = self._getSaveCurrentFilterPromtMessage(triggerName);
			return tf.promiseBootbox.yesNo(
				{
					message: message,
					closeButton: true
				}, "Unsaved Changes")
				.then(function(operationResult)
				{
					handleResult.operationResult = operationResult;
					if (operationResult && self.obSelectedGridFilterModified())
					{
						return self.saveFilter().then(function(savedResult)
						{
							handleResult.savedResult = savedResult;
							return Promise.resolve(handleResult);
						});
					}
					else
						return Promise.resolve(handleResult);
				});
		}
		else
			return Promise.resolve(handleResult);
	};

	KendoGridFilterMenu.prototype._getSaveCurrentFilterPromtMessage = function(triggerName)
	{
		triggerName = triggerName || 'filter';
		var self = this;

		var message = 'Save the current modified filter?';
		var gridFilterDataModel = self.obSelectedGridFilterDataModel();
		if (gridFilterDataModel)
			message = 'The currently applied filter (' + gridFilterDataModel.name() +
				') has unsaved changes.  Would you like to save these changes before applying this ' + triggerName + '?';
		return message;
	};

	KendoGridFilterMenu.prototype._selectedGridFilterIdChange = function()
	{
		var self = this;
		self.obClassicFilterSet(null);
		var gridLayoutExtendedDataModel = this._obSelectedGridLayoutExtendedDataModel && this._obSelectedGridLayoutExtendedDataModel();
		if (gridLayoutExtendedDataModel)
		{
			gridLayoutExtendedDataModel.filterId(this.obSelectedGridFilterId());
		}
		if (this._obCurrentGridLayoutExtendedDataModel)
		{
			this._obCurrentGridLayoutExtendedDataModel().filterId(this.obSelectedGridFilterId());
			if (!this._obCurrentGridLayoutExtendedDataModel().filterId())
			{
				this._obCurrentGridLayoutExtendedDataModel().filterName('');
			}
		}
		this.raiseGridStateChange && this.raiseGridStateChange();
		if (!this.obSelectedGridFilterId() || this.obSelectedGridFilterId() > 0)
		{ //_filteredIds is the setting from outside, not grid inside.
			this._gridState.filteredIds = this._filteredIds;
		}

		//IF the request from search, do not sticky filter.
		if (self.options.fromSearch || self.options.isTemporaryFilter)
		{
			return;
		}

		if (self.options && self.options.changeStorageKey)
		{
			self._storageFilterDataKey = self.options.changeStorageKey(self._storageFilterDataKey);
		}
		var currentFilter = Enumerable.From(this.obGridFilterDataModels()).Where("$.id()==" + this.obSelectedGridFilterId()).FirstOrDefault();
		if (!currentFilter)
		{
			tf.storageManager.save(this._storageFilterDataKey, null);
		}
		else if (currentFilter.type() !== "relatedFilter" && (!this.options.customGridType || this.options.customGridType.toLowerCase() != "dashboardwidget"))
		{
			tf.storageManager.save(this._storageFilterDataKey, this.obSelectedGridFilterId());
		}
	};

	KendoGridFilterMenu.prototype.findCurrentHeaderFilters = function()
	{
		var filterItems = this.obHeaderFilters();
		TF.ListFilterHelper.addSelectedIdsIntoFilterItems(filterItems, this.listFilters);
		var filterSets = this.obHeaderFilterSets();
		if (filterItems.length || filterSets.length)
		{
			var filterSet = new TF.FilterSet('And', filterItems, filterSets);
			return filterSet;
		}
		return null;
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
		var filterClause = " 1=1";
		if (this._gridState && this._gridState.filterClause)
		{
			filterClause += " and " + this._gridState.filterClause;
		}
		if (this.obSelectedGridFilterClause())
		{
			filterClause += " and " + this.obSelectedGridFilterClause();
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

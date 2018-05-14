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
		this._storageFilterDataKey = "grid.currentfilter." + this._gridType + ".id";
		this._storageDisplayQuickFilterBarKey = "grid.displayQuickFilterBar." + this._gridType;
		this.obHeaderFilters = ko.observableArray([]);
		this.obGridFilterDataModels = ko.observableArray();
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

		this.obSelectedGridFilterId = ko.observable(this._gridState.gridFilterId);
		this.subscriptions.push(this.obSelectedGridFilterId.subscribe(this._selectedGridFilterIdChange, this));
		this.saveFilterClick = this.saveFilterClick.bind(this);
		this.manageFilterClick = this.manageFilterClick.bind(this);
		this.createNewFilterClick = this.createNewFilterClick.bind(this);
		this.saveAsNewFilterClick = this.saveAsNewFilterClick.bind(this);
		this.clearGridFilterClick = this.clearGridFilterClick.bind(this);
		this.onClearGridFilterClickEvent = new TF.Events.Event();
		this.gridFilterClick = this.gridFilterClick.bind(this);
		this.quickFilterBarClick = this.quickFilterBarClick.bind(this);
		this.noApplyFilterNoModified = ko.observable(true);
		this.obCallOutFilterName = ko.observable(this.options.callOutFilterName);

		this.obSelectedGridFilterDataModel = ko.computed(this._selectedGridFilterDataModelComputer, this);
		this.subscriptions.push(this.obSelectedGridFilterDataModel.subscribe(this._omitRecordsChange, this));
		this.obSelectedGridFilterClause = ko.computed(this._selectedGridFilterWhereClauseComputer, this);
		this.obSelectedGridFilterName = ko.computed(this._selectedGridFilterNameComputer, this);
		// this.obIsFilterApplied = ko.computed(function() {
		// 	return this.obSelectedGridFilterName() !== 'None';
		// }, this);
		this.subscriptions.push(this.obHeaderFilters.subscribe(this._currentFilterChange, this));
		this.subscriptions.push(this.obHeaderFilterSets.subscribe(this._currentFilterChange, this));

		this.obIsQuickFilterApplied = ko.computed(function()
		{
			var quickFilters = this.obHeaderFilters();
			var quickFilterSets = this.obHeaderFilterSets();

			var isQuickFilterApplied = (
				(quickFilters && quickFilters.length)
				|| (quickFilterSets && quickFilterSets.length)
			);

			var $gridFilterClearBtn = $('.grid-filter-clear-all');
			if ($gridFilterClearBtn)
			{
				if (isQuickFilterApplied)
					$gridFilterClearBtn.addClass('quick-filter-applied');
				else
					$gridFilterClearBtn.removeClass('quick-filter-applied');
			}

		}, this);

		// this.obTempOmitExcludeAnyIds.subscribe(this._currentFilterChange, this);

		this.obSelectedGridFilterModified = ko.computed(this._selectedGridFilterModifiedComputer, this);
		this.obSelectedGridFilterModifiedMessage = ko.computed(this._selectedGridFilterModifiedMessageComputer, this);
		this.obQuickFilterBarCheckIcon = ko.observable("menu-item-checked");

	}


	KendoGridFilterMenu.prototype._omitRecordsChange = function()
	{
		var omittedRecords = [];
		if (this.obSelectedGridFilterDataModel() && this.obSelectedGridFilterDataModel().omittedRecord())
		{
			for (var i = 0; i < this.obSelectedGridFilterDataModel().omittedRecord().length; i++)
			{
				omittedRecords.push(this.obSelectedGridFilterDataModel().omittedRecord()[i].OmittedRecordId);
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
		if(!currentHeaderFilters && includeIds && !callOutFilterName)
		{
			return null;
		}
		return new TF.SearchParameters(null, null, null, this.findCurrentHeaderFilters(), null, this._gridState.filteredIds, this.findCurrentOmittedRecords(), this.obCallOutFilterName());
	};

	KendoGridFilterMenu.prototype.saveQuickFilter = function(quickFilters)
	{
		var gridType = this.options.gridType;
		if (this.options.kendoGridOption && this.options.kendoGridOption.entityType)
		{
			gridType = this.options.kendoGridOption.entityType + "." + gridType;
		}
		return TF.Grid.FilterHelper.saveQuickFilter(gridType, quickFilters);
	};

	KendoGridFilterMenu.prototype.clearQuickFilter = function()
	{
		var gridType = this.options.gridType;
		if (this.options.kendoGridOption && this.options.kendoGridOption.entityType)
		{
			gridType = this.options.kendoGridOption.entityType + "." + gridType;
		}
		return TF.Grid.FilterHelper.clearQuickFilter(gridType);
	};

	KendoGridFilterMenu.prototype.getQuickFilter = function()
	{
		var gridType = this.options.gridType;
		if (this.options.kendoGridOption && this.options.kendoGridOption.entityType)
		{
			gridType = this.options.kendoGridOption.entityType + "." + gridType;
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
		if (this._quickFilterBarIsEnabled())
		{
			var display = self._getStroageDisplayQuickFilterBarSetting();
			this._setQuickFilterBarStatus(display);
		}
	};

	KendoGridFilterMenu.prototype._getStroageDisplayQuickFilterBarSetting = function()
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
		var filterRow = this.$container.find(".k-grid-header").find(".k-filter-row");
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
	};

	KendoGridFilterMenu.prototype._selectedGridFilterModifiedComputer = function()
	{
		if ((this.obHeaderFilters() && this.obHeaderFilters().length > 0 && !this._isFakeFilter())
			||(this.obHeaderFilterSets() &&	this.obHeaderFilterSets().length > 0)
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
		this._setgridStateTwoRowWhenOverflow();
		if (
			// (this.obSelectedGridFilterDataModel() && this.obTempOmitExcludeAnyIds().length > 0 ) || // View-910
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
		//show hide comma when filter and layout toggle split to tow row on tablet
		this._setgridStateTwoRowWhenOverflow();
		if (this.isFromRelated())
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
		else
		{
			return "None";
		}
	};

	KendoGridFilterMenu.prototype.filterMenuClick = function(e)
	{
		tf.contextMenuManager.showMenu(e.target, new TF.ContextMenu.TemplateContextMenu("workspace/grid/filtercontextmenu", new TF.Grid.GridMenuViewModel(this, this.searchGrid)));
	};

	KendoGridFilterMenu.prototype.loadGridFilter = function(autoSetSummaryFliter)
	{
		if(this.options.layoutAndFilterOperation === false)
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
		var filterUrl = "gridfilter";
		if(tf.isViewfinder)
		{
			filterUrl = "gridFilter/skipReadReminderData/";
		}
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), filterUrl, self.options.gridType))
			.then(function(apiResponse)
			{
				var gridFilterDataModels = TF.DataModel.BaseDataModel.create(TF.DataModel.GridFilterDataModel, apiResponse.Items);
				var selectGridFilterEntityId;
				if(!self.inited)
				{
					if($.isNumeric(self.options.filterId) && self.options.filterId !== 0)
					{
						selectGridFilterEntityId = self.options.filterId;
					}
					else if(tf.storageManager.get(self._storageFilterDataKey,true))
					{
						//open new grid in viewfinder is use local storage
						selectGridFilterEntityId = tf.storageManager.get(self._storageFilterDataKey,true);
						if(!TF.isPhoneDevice)
						{
							tf.storageManager.save(self._storageFilterDataKey, selectGridFilterEntityId);
						}
						tf.storageManager.delete(self._storageFilterDataKey,true);
					} else
					{
						selectGridFilterEntityId = tf.storageManager.get(self._storageFilterDataKey) || self._layoutFilterId;
					}

					if (selectGridFilterEntityId && selectGridFilterEntityId.filteredIds)
					{
						self.relatedFilterEntity = selectGridFilterEntityId;
					} else {
						self.relatedFilterEntity = undefined;
					}

					if (getQueryString("filterId"))
					{
						selectGridFilterEntityId = parseInt(getQueryString("filterId"));
					}
					if (self._layoutFilterId)
					{
						//tf.storageManager.save(self._storageFilterDataKey, self._layoutFilterId);
					}
				}

				// for the specific filters in the summary page of the viewfinderweb
				if (self.options.summaryFilters && self.options.summaryFilters.length > 0)
				{
					var summaryGridFilterDataModels = TF.DataModel.BaseDataModel.create(TF.DataModel.GridFilterDataModel, self.options.summaryFilters);
					gridFilterDataModels = gridFilterDataModels.concat(summaryGridFilterDataModels);
					self.obGridFilterDataModels(gridFilterDataModels);
					self._sortGridFilterDataModels();
					if(!self.inited)
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
					var relatedFilter =[{
						Name:self.relatedFilterEntity.filterName,
						Id: -9000,
						Type:'relatedFilter',
						IsValid:true
					}];
					var relatedFilterDataModels = TF.DataModel.BaseDataModel.create(TF.DataModel.GridFilterDataModel, relatedFilter);
					self.obGridFilterDataModels(gridFilterDataModels.concat(relatedFilterDataModels));
					if(!self.inited)
					{
						if(!self.obSelectedGridFilterId())
						{
							self.obSelectedGridFilterId(relatedFilter[0].Id);
						} else
						{
							self.isFromRelated(false);
						}
					}
				}

				if (selectGridFilterEntityId && selectGridFilterEntityId > 0)
				{
					self.obSelectedGridFilterId(selectGridFilterEntityId);
				}
				self.inited = true;
				if (self._obCurrentGridLayoutExtendedDataModel())
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
			// self._alertMessageWhenLayoutIsDeleted();

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
		// else {
		//filterId = tf.storageManager.get(self._storageFilterDataKey);
		//message = 'The Filter that was applied has been deleted.';
		// }

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
		return tf.promiseAjax.delete(pathCombine(tf.api.apiPrefix(), "gridfilter", filterId));
		//return Promise.resolve(true);
	};

	KendoGridFilterMenu.prototype._deleteStickFilter = function(filterId)
	{
		var self = this;
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
				//tf.storageManager.save(self._storageFilterDataKey, '');
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
			return self.saveFilter().then(self.clearKendoGridQuickFilter.bind(self));
		}
	};

	KendoGridFilterMenu.prototype.createNewFilterClick = function()
	{
		var options = {title : "New Filter"};
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
		).then(function(){
			if(selectedFilterModelJSONString != JSON.stringify(this.obSelectedGridFilterDataModel() ? this.obSelectedGridFilterDataModel().toData() : null))
			{
				this.refreshClick();
			}
		}.bind(this));
	};

	KendoGridFilterMenu.prototype.clearGridFilterClick = function()
	{
		this.obCallOutFilterName(null);
		this.options.callOutFilterName = null;
		this.obSelectedGridFilterId(null);
		tf.storageManager.save(this._storageFilterDataKey, null);
		if (this.isFromRelated())
		{ //if is from related, the id not change, so need refresh it
			this._selectedGridFilterIdChange();
		}

		//need change the is from related once clear filter, don't change the position
		this.isFromRelated(false);

		this.getSelectedIds([]);
		this.obTempOmitExcludeAnyIds([]);
		this.obFilteredExcludeAnyIds([]);

		this.kendoGrid.lastClickItemId = 0;
		this._gridState.filteredIds = null;
		this._gridState.filterClause = "";

		this.clearKendoGridQuickFilter();
		this.rebuildGrid();

		this.onClearGridFilterClickEvent.notify();
	};

	KendoGridFilterMenu.prototype.gridFilterClick = function(viewModel, event)
	{
		//need change the is from related once clear filter
		this.isFromRelated(false);

		var isCheckedItem = $(event.target).parent().hasClass('menu-item-checked') && !$(event.target).parent().hasClass('menu-item-broken');
		if (TF.isPhoneDevice && isCheckedItem)
		{
			this.clearGridFilterClick();
		}
		else
			this.applyGridFilter(viewModel);
	};

	KendoGridFilterMenu.prototype.saveAndEditGridFilter = function(isNew, gridFilterDataModel, getCurrentHeaderFilters, getCurrentOmittedRecords, options)
	{
		options = options || {};
		options.currentObFilters = this.obGridFilterDataModels.slice();
		return tf.modalManager.showModal(
				new TF.Modal.Grid.ModifyFilterModalViewModel(
					this.options.gridType,
					isNew,
					gridFilterDataModel ? gridFilterDataModel : null,
					getCurrentHeaderFilters ? this.findCurrentHeaderFilters() : null,
					{
						Columns: convertToOldGridDefinition(this.options.gridDefinition)
					},
					this.getOmittedRecordsID(gridFilterDataModel, getCurrentOmittedRecords),
					options
				)
			)
			.then(function(result)
			{
				if (!result)
				{
					return true;
				}
				var savedGridFilterDataModel = result.savedGridFilterDataModel;
				if(savedGridFilterDataModel)
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
			currentOmittedRecords = gridFilterDataModel.omittedRecord();
			for (var i = 0; i < currentOmittedRecords.length; i++)
			{
				currentOmittedRecordIDs.push(currentOmittedRecords[i].OmittedRecordId);
			}
			return currentOmittedRecordIDs;
		}
	};

	//save filter on change without open model
	KendoGridFilterMenu.prototype.saveFilter = function()
	{
		var searchData = new TF.SearchParameters(null, null, null, this.findCurrentHeaderFilters(), null, null, null);
		if (this.obTempOmitExcludeAnyIds().length > 0)
		{
			var filterID = this.obSelectedGridFilterDataModel().id();
			for (var i = 0; i < this.obTempOmitExcludeAnyIds().length; i++)
			{
				var tempOmittedRecords = {
					FilterId: filterID,
					OmittedRecordId: this.obTempOmitExcludeAnyIds()[i]
				}
				this.obSelectedGridFilterDataModel().omittedRecord().push(tempOmittedRecords);
			}
		}
		if (!searchData.data.filterSet && this.obTempOmitExcludeAnyIds().length === 0)
		{
			return Promise.resolve(false);
		}
		else if (!searchData.data.filterSet && this.obTempOmitExcludeAnyIds().length > 0) //only change omitted records
		{
			// var entity = { ids: omittedRecordIds, tableType: gridType }
			return tf.promiseAjax.put(pathCombine(tf.api.apiPrefix(), "gridfilter"),
			{
				data: this.obSelectedGridFilterDataModel().toData()
			}).then(function()
			{
				this.obFilteredExcludeAnyIds(this.obFilteredExcludeAnyIds().concat(this.obTempOmitExcludeAnyIds()));
				this.obTempOmitExcludeAnyIds([]);
				return true;
			}.bind(this));
		}
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", this.options.gridType == "vehicle" ? "fleet" : this.options.gridType, "RawFilterClause"),
		{
			data: searchData.data.filterSet
		}).then(function(apiResponse)
		{
			this.obSelectedGridFilterDataModel().whereClause((this.obSelectedGridFilterDataModel().whereClause() ? this.obSelectedGridFilterDataModel().whereClause() + " AND " : "") + apiResponse.Items[0]);
		}.bind(this)).then(function()
		{
			return tf.promiseAjax.put(pathCombine(tf.api.apiPrefix(), "gridfilter"),
			{
				data: this.obSelectedGridFilterDataModel().toData()
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
		//return self.syncFilter(gridFilterDataModel.id())

		var currentFilterId = self.obSelectedGridFilterId();
		var nextFilterId = gridFilterDataModel.id();

		if (TF.Grid.FilterHelper.isDrillDownFillter(currentFilterId))
		{
			self.obHeaderFilters([]);
		}


		return self._syncFilterAndNotifyStatusUpdated(gridFilterDataModel.id())
			.then(function(filterExisted)
			{
				if (filterExisted)
					return self.saveCurrentFilter();
				else
					return false;
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
			function refresh(){
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
			if(quickFilter)
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
		var gridLayoutExtendedDataModel = this._obSelectedGridLayoutExtendedDataModel();
		if (gridLayoutExtendedDataModel)
		{
			gridLayoutExtendedDataModel.filterId(this.obSelectedGridFilterId());
		}
		this._obCurrentGridLayoutExtendedDataModel().filterId(this.obSelectedGridFilterId());
		if(!this._obCurrentGridLayoutExtendedDataModel().filterId())
		{
			this._obCurrentGridLayoutExtendedDataModel().filterName('');
		}
		this.raiseGridStateChange();
		if (!this.obSelectedGridFilterId() || this.obSelectedGridFilterId() > 0)
		{ //_filteredIds is the setting from outside, not grid inside.
			this._gridState.filteredIds = this._filteredIds;
		}
		// if (!this._layoutFilterId)
		// {


		var currentFilter = Enumerable.From(this.obGridFilterDataModels()).Where("$.id()=="+this.obSelectedGridFilterId()).FirstOrDefault();
		if(!currentFilter)
		{
			tf.storageManager.save(this._storageFilterDataKey, null);
		}
		else if(currentFilter.type()!=="relatedFilter")
		{
			tf.storageManager.save(this._storageFilterDataKey, this.obSelectedGridFilterId());
		}
		// }
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
				break;
			case "boolean":
				return rawValue == "true"
				break;
			case "integer":
				return parseInt(rawValue);
				break;
			case "number":
				return parseFloat(rawValue);
				break;
			case "date":
			case "time":
				return rawValue.substring(1, rawValue.length - 1).replace(/%/g, "");
				break;
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
		if ( self.obSelectedGridFilterId() && self.obSelectedGridFilterId() != -9000 && !Enumerable.From(this.obGridFilterDataModels()).Where(function(c)
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
		//issues:
		//1. There is a parameter "time" in trip search, but find it useless, so ignore it here.

		var skip = 0;
		var take = 1;
		var omitIds = null;
		var filterSet = (this._gridState && this._gridState.filterSet) ? this._gridState.filterSet : null;
		if (this.obSelectedGridFilterDataModel() && this.obSelectedGridFilterDataModel().omittedRecord())
		{
			omitIds = this.obSelectedGridFilterDataModel().omittedRecord().map(function(o)
			{
				return o.OmittedRecordId;
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
		//searchData.data.idFilter = { IncludeOnly: null, ExcludeAny: [84] };
		searchData.paramData.getCount = true;
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", this._gridType == "vehicle" ? "fleet" : this._gridType),
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

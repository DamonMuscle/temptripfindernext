(function()
{
	createNamespace("TF.Grid").LayoutHelper = LayoutHelper;

	function LayoutHelper()
	{ }
	LayoutHelper.compareLayoutColumns = function functionName(leftColumns, rightColumns)
	{
		var isEqual = true;

		if (leftColumns.length !== rightColumns.length)
		{
			isEqual = false;
			return isEqual;
		}

		leftColumns.map(function(leftColumn, idx)
		{
			if (!isEqual)
				return;

			var rightColumn = rightColumns[idx];
			if (leftColumn.FieldName !== rightColumn.FieldName)
			{
				isEqual = false;
				return;
			}

			var leftColumnKeys = Object.keys(leftColumn);
			var rightColumnKeys = Object.keys(rightColumn);
			var differentKeys = leftColumnKeys.filter(function(leftColumnKey, idx)
			{
				if (!TF.Grid.LayoutHelper.compareLayoutColumnSortSetting(leftColumn, rightColumn))
					return true; // Means has different keys

				if (!TF.Grid.LayoutHelper.compareLayoutColumnSummarySetting(leftColumn, rightColumn))
					return true; // Means has different keys
				return leftColumn['FieldName'] !== rightColumn['FieldName'];
			});
			if (differentKeys.length)
			{
				isEqual = false;
				return; // jump out of the current loop
			}
		});

		return isEqual;
	};

	LayoutHelper.compareLayoutColumnSortSetting = function(leftCol, rightCol)
	{
		var fieldName = 'SortIndex';
		var hasLeftColSortSetting = TF.Grid.LayoutHelper.hasIdentifyColumnSortSetting(leftCol, fieldName);
		var hasRightColSortSetting = TF.Grid.LayoutHelper.hasIdentifyColumnSortSetting(rightCol, fieldName);

		if (hasLeftColSortSetting === hasRightColSortSetting)
			return true;

		if (hasLeftColSortSetting !== hasRightColSortSetting)
			return false;

		return (leftCol[fieldName] === rightCol[fieldName] &&
			leftCol['SortAscending'] === rightCol['SortAscending']);
	};

	LayoutHelper.compareLayoutColumnSummarySetting = function(leftCol, rightCol)
	{
		var filedName = 'AggregationOperator';
		var hasLeftColSummarySetting = TF.Grid.LayoutHelper.hasIdentifyColumnSummarySetting(leftCol, filedName);
		var hasRightColSummarySetting = TF.Grid.LayoutHelper.hasIdentifyColumnSummarySetting(rightCol, filedName);

		if (hasLeftColSummarySetting === hasRightColSummarySetting)
			return true;

		if (hasLeftColSummarySetting !== hasRightColSummarySetting)
			return false;

		return (leftCol[filedName] === rightCol[filedName]);
	};

	LayoutHelper.hasIdentifyLayoutColumnSetting = function(column, fieldName)
	{
		var columnSortIndexKeyIdx = Object.keys(column).indexOf(fieldName);
		if (columnSortIndexKeyIdx < 0)
			return false;

		return column[fieldName] !== null;
	};

	LayoutHelper.hasIdentifyColumnSummarySetting = function(column, fieldName)
	{
		if (TF.Grid.LayoutHelper.hasIdentifyLayoutColumnSetting(column, fieldName) && column[fieldName] !== "")
		{
			return true;
		}
		return false;
	};

	LayoutHelper.hasIdentifyColumnSortSetting = function(column, fieldName)
	{
		return TF.Grid.LayoutHelper.hasIdentifyLayoutColumnSetting(column, fieldName);
	};

	createNamespace("TF.Grid").KendoGridLayoutMenu = KendoGridLayoutMenu;

	function KendoGridLayoutMenu()
	{
		this.setStorageLayoutDataKey();
		this._obCurrentGridLayoutExtendedDataModel = ko.observable(null);
		this.subscriptions.push(this._obCurrentGridLayoutExtendedDataModel.subscribe(this._currentLayoutChange, this));

		this._obAppliedLayoutInitState = ko.observable(null);
		this._obSelectedGridLayoutExtendedDataModel = ko.observable(null);
		this._obDefaultLayoutDataModel = ko.observable(null);
		this._obInitDefaultLayoutDataModel = ko.observable(null);

		this.obSelectedGridLayoutName = ko.computed(this._selectedGridLayoutNameComputer, this);

		this._obOnlyForUpdateSelectedGridLayoutModified = ko.observable(null);
		ko.computed(this._selectedGridLayoutModifiedComputer, this);
		this.obSelectedGridLayoutModified = ko.computed(function()
		{
			return this._obOnlyForUpdateSelectedGridLayoutModified();
		}, this);

		this.obGridLayoutExtendedDataModels = ko.observableArray();
		this.obContextMenuDisplayGridLayoutExtendedDataModels = ko.computed(function()
		{
			var result = [];
			result = this.obGridLayoutExtendedDataModels().map(function(item)
			{
				return item;
			});

			if (TF.isPhoneDevice &&
				this.obSelectedGridLayoutName && this.obSelectedGridLayoutName())
			{
				var tmpResult = [];
				result.forEach(function(filterDataModel, idx)
				{
					if (filterDataModel.name() === this.obSelectedGridLayoutName())
						tmpResult.splice(0, 0, result[idx]);
					else
						tmpResult.push(result[idx]);
				}, this);
				result = tmpResult;
			}

			return result;
		}, this);
		this._applyingLayout = false;

		this.applyLayout = this.applyLayout.bind(this);
		this.mangeLayoutClick = this.mangeLayoutClick.bind(this);
		this.saveAndEditLayout = this.saveAndEditLayout.bind(this);
		this.saveAsNewLayoutClick = this.saveAsNewLayoutClick.bind(this);
	}

	KendoGridLayoutMenu.prototype.setStorageLayoutDataKey = function()
	{
		this._storageLayoutDataKey = "grid.currentlayout." + ((this.options.kendoGridOption && this.options.kendoGridOption.entityType) ? this.options.kendoGridOption.entityType + "." : "")
			+ (this.pageType || this._gridType) + ".id";
	}

	KendoGridLayoutMenu.prototype._resetAppliedLayoutInitState = function(layoutDataModel)
	{
		var self = this;

		if (layoutDataModel)
			self._obAppliedLayoutInitState(layoutDataModel.clone());
		else
			self._obAppliedLayoutInitState(null);
	};

	KendoGridLayoutMenu.prototype._selectedGridLayoutNameComputer = function()
	{
		this.obResetLayout();
		this._setgridStateTwoRowWhenOverflow();
		if (this._obSelectedGridLayoutExtendedDataModel())
		{
			return this._obSelectedGridLayoutExtendedDataModel().name();
		}
		else if (this.options.fromSearch && !this._gridLoadingEnd)//IF the request from search,  first go to view display " All Columns".
		{
			return " All Columns";
		}
		else if (this.options.isTemporaryFilter && this.options.layoutName)//IF is temporary open grid, use the given layout name
		{
			return " " + this.options.layoutName;
		}
		else
		{
			//need i18n here;
			return "Default";
		}
	};

	KendoGridLayoutMenu.prototype._selectedGridLayoutModifiedComputer = function()
	{
		var self = this;
		this._setgridStateTwoRowWhenOverflow();
		var initLayoutDataModel;
		var currentlyLayoutDataModel;
		if (self._obSelectedGridLayoutExtendedDataModel())
		{
			initLayoutDataModel = self._obAppliedLayoutInitState();
			currentlyLayoutDataModel = self._obSelectedGridLayoutExtendedDataModel();
		}
		else if (self._obInitDefaultLayoutDataModel())
		{
			initLayoutDataModel = self._obInitDefaultLayoutDataModel();
			currentlyLayoutDataModel = self._obDefaultLayoutDataModel();
		}

		if (!currentlyLayoutDataModel || !currentlyLayoutDataModel.apiIsDirty())
		{
			self._obOnlyForUpdateSelectedGridLayoutModified(null);
			return;
		}

		if (currentlyLayoutDataModel._entityBackup.ShowSummaryBar !== currentlyLayoutDataModel.showSummaryBar())
		{
			self._obOnlyForUpdateSelectedGridLayoutModified("modified");
			return;
		}

		var hasLayoutColumnsChange = !TF.Grid.LayoutHelper.compareLayoutColumns(
			currentlyLayoutDataModel.layoutColumns(), initLayoutDataModel.layoutColumns()
		);
		var hasFilterIdChange = currentlyLayoutDataModel.filterId() != initLayoutDataModel.filterId();

		var hasFilterNameChange = initLayoutDataModel.filterId() > 0 && currentlyLayoutDataModel.filterName() != initLayoutDataModel.filterName();

		if ((!hasLayoutColumnsChange && !hasFilterIdChange && !hasFilterNameChange))
		{
			self._obOnlyForUpdateSelectedGridLayoutModified(null);
			return;
		}
		else if (hasLayoutColumnsChange || hasFilterNameChange)
		{
			self._obOnlyForUpdateSelectedGridLayoutModified("modified");
			return;
		}

		if (!self._hasFilterIdNeedToRevet(currentlyLayoutDataModel))
		{
			self._obOnlyForUpdateSelectedGridLayoutModified(null);
			return;
		}

		var filterId = currentlyLayoutDataModel._entityBackup.FilterId ||
			tf.storageManager.get(self._storageFilterDataKey) ||
			this._obCurrentGridLayoutExtendedDataModel().filterId();
		if (isNaN(filterId))
		{
			return;
		}
		return TF.Grid.FilterHelper.validFilterId(filterId)
			.then(function(canRevertLayoutFilterId)
			{
				if (!canRevertLayoutFilterId)
				{
					currentlyLayoutDataModel._entityBackup.FilterId = null; // Fixed issue(applie filter the layout not displayed modified) happend when excuted the case mentioned in tickect-VIEW-649 and create a new filter and applied it on same layout
					if (!currentlyLayoutDataModel.filterId() > 0)
					{
						self._obOnlyForUpdateSelectedGridLayoutModified(null);
						currentlyLayoutDataModel.apiIsDirty(false);
					}
					else
					{
						self._obOnlyForUpdateSelectedGridLayoutModified("modified");
					}
					return;
				}
				else if (self._obSelectedGridLayoutExtendedDataModel()) // Fixed When a layout that includes a filter is applied and user chooses to reset layouts, the "None layout" appears to be modified.
				{
					self._obOnlyForUpdateSelectedGridLayoutModified("modified");
					return;
				}
			});
	};

	KendoGridLayoutMenu.prototype._hasFilterIdNeedToRevet = function(gridLayoutExtendedDataModel)
	{
		return gridLayoutExtendedDataModel.filterId() != gridLayoutExtendedDataModel._entityBackup.FilterId;
	};

	KendoGridLayoutMenu.prototype.getDefinitionLayoutColumns = function()
	{
		return Enumerable.From(this._gridDefinition.Columns).Where(function(c)
		{
			return !c.hidden;
		}).Select(function(c)
		{
			return $.extend(
				{}, c)
		}).ToArray();
	};

	KendoGridLayoutMenu.prototype.loadLayout = function()
	{
		var self = this;
		var defaultGridLayoutExtendedEntity = {
			GridType: this.options.gridType,
			Name: "",
			LayoutColumns: this.getDefinitionLayoutColumns()
		};

		this._defaultGridLayoutExtendedEntity = defaultGridLayoutExtendedEntity;

		if (this.options.loadLayout === false)
		{
			this._obCurrentGridLayoutExtendedDataModel(new TF.DataModel.GridLayoutExtendedDataModel(defaultGridLayoutExtendedEntity));
			return Promise.resolve();
		}

		var typeName = this.options.gridType;
		if (this.options.kendoGridOption && this.options.kendoGridOption.entityType)
		{
			typeName = this.options.kendoGridOption.entityType + "." + this.options.gridType;
		}
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "gridlayout", typeName))
			.then(function(apiResponse)
			{
				apiResponse.Items = [defaultGridLayoutExtendedEntity].concat(apiResponse.Items);
				var validLayoutDataModels = self._filterLayoutsByDefaultColumns(apiResponse.Items.slice(1));
				var gridLayoutExtendedDataModels = TF.DataModel.BaseDataModel.create(TF.DataModel.GridLayoutExtendedDataModel, validLayoutDataModels);
				this.obGridLayoutExtendedDataModels(gridLayoutExtendedDataModels);
				this._sortGridLayoutExtendedDataModels();
				var selectGridLayoutExtendedEntity = null, currentGridLayoutExtendedEntity = null;
				//IF the request from search, do not use the sticky layout.
				if (!this.options.fromSearch && !this.options.isTemporaryFilter)
				{
					var selectGridLayoutExtendedEntityId = tf.storageManager.get(this._storageLayoutDataKey);
					if (selectGridLayoutExtendedEntityId && selectGridLayoutExtendedEntityId !== '')
					{
						selectGridLayoutExtendedEntity = Enumerable.From(gridLayoutExtendedDataModels).Where(function(c)
						{
							return c.name() == selectGridLayoutExtendedEntityId;
						}).FirstOrDefault();
					}
					currentGridLayoutExtendedEntity = tf.storageManager.get(this.options.storageKey);
					//set lock
					if (currentGridLayoutExtendedEntity && currentGridLayoutExtendedEntity.LayoutColumns.length > 0)
					{
						currentGridLayoutExtendedEntity.LayoutColumns.forEach(function(columnInStorage)
						{
							if (columnInStorage.locked && columnInStorage.locked == true)
							{
								self.tobeLockedColumns.push(
									{
										field: columnInStorage.FieldName
									});
							}
						});
					}
				}
				if (selectGridLayoutExtendedEntity)
				{
					//set width in layout
					if (currentGridLayoutExtendedEntity && currentGridLayoutExtendedEntity.LayoutColumns.length > 0)
					{
						selectGridLayoutExtendedEntity.layoutColumns().forEach(function(column)
						{
							currentGridLayoutExtendedEntity.LayoutColumns.forEach(function(columnInStorage)
							{
								if (columnInStorage.FieldName == column.FieldName)
								{
									column.Width = columnInStorage.Width;
									return;
								}
							});
						});
					}
					this._obCurrentGridLayoutExtendedDataModel(selectGridLayoutExtendedEntity);
					this._obSelectedGridLayoutExtendedDataModel(selectGridLayoutExtendedEntity);
					this._resetAppliedLayoutInitState(this._obSelectedGridLayoutExtendedDataModel());
				}
				else
				{
					var gridLayoutExtendedEntity = currentGridLayoutExtendedEntity && currentGridLayoutExtendedEntity.LayoutColumns.length > 0 ? currentGridLayoutExtendedEntity : defaultGridLayoutExtendedEntity;
					this._obCurrentGridLayoutExtendedDataModel(new TF.DataModel.GridLayoutExtendedDataModel(gridLayoutExtendedEntity));
					var defaultLayoutDataModels = TF.DataModel.BaseDataModel.create(TF.DataModel.GridLayoutExtendedDataModel, gridLayoutExtendedEntity);
					this._obDefaultLayoutDataModel(defaultLayoutDataModels);
				}
				this._obInitDefaultLayoutDataModel(TF.DataModel.BaseDataModel.create(TF.DataModel.GridLayoutExtendedDataModel, defaultGridLayoutExtendedEntity));
				this._layoutFilterId = this._obCurrentGridLayoutExtendedDataModel().filterId();

				return this._alertMessageWhenLayoutIsDeleted().then(function()
				{
					this._confirmMessageWhenLayoutFilterIsNotAvailableInCurrentDatasource();
				}.bind(this));
			}.bind(this));
	};

	KendoGridLayoutMenu.prototype._isLayoutFilterIsNotAvaliable = function(gridLayoutExtendedEntity)
	{
		if (gridLayoutExtendedEntity && !gridLayoutExtendedEntity.filterId() && gridLayoutExtendedEntity.filterName())
		{
			switch (gridLayoutExtendedEntity.filterName())
			{
				case "Do Not Include":
					return false;
				default:
					return true;
			}
		}
		return false;
	};

	KendoGridLayoutMenu.prototype._confirmMessageWhenLayoutFilterIsNotAvailableInCurrentDatasource = function(gridLayoutExtendedEntity)
	{
		var self = this;
		var gridLayoutExtendedEntity = gridLayoutExtendedEntity || self._obSelectedGridLayoutExtendedDataModel();
		if (self._isLayoutFilterIsNotAvaliable(gridLayoutExtendedEntity))
		{
			return tf.promiseBootbox.alert("The Filter saved with this Layout is not in the current database.  Only layout changes will be applied.")
				.then(function(result)
				{
					if (result)
					{
						gridLayoutExtendedEntity.filterName("");
					}
					return result;
				});
		}
		return Promise.resolve();
	};

	KendoGridLayoutMenu.prototype._alertMessageWhenLayoutIsDeleted = function(selectGridLayoutExtendedEntityId)
	{
		var message, isApply = !!selectGridLayoutExtendedEntityId;
		if (!selectGridLayoutExtendedEntityId)
		{
			selectGridLayoutExtendedEntityId = tf.storageManager.get(this._storageLayoutDataKey);
			message = 'The Layout that was applied has been deleted. The system default Layout will be applied to this grid.';
		}
		else
		{
			message = 'This Layout has been deleted. It cannot be applied.';
		}
		if (selectGridLayoutExtendedEntityId && selectGridLayoutExtendedEntityId !== '')
		{
			var selectGridLayoutExtendedEntity;
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "gridlayout", this.options.gridType))
				.then(function(apiResponse)
				{
					selectGridLayoutExtendedEntity = Enumerable.From(apiResponse.Items).Where(function(c)
					{
						if (c)
						{
							return c.Name == selectGridLayoutExtendedEntityId;
						}
						return false;
					}).FirstOrDefault();
				}.bind(this)).then(function()
				{
					if (!selectGridLayoutExtendedEntity)
					{
						return tf.promiseBootbox.alert(message, 'Warning', 40000).then(function()
						{
							for (var i = 0, l = this.obGridLayoutExtendedDataModels().length; i < l; i++)
							{
								if (this.obGridLayoutExtendedDataModels()[i].name() === selectGridLayoutExtendedEntityId)
								{
									this.obGridLayoutExtendedDataModels.remove(this.obGridLayoutExtendedDataModels()[i]);
									break;
								}
							}
							if (!isApply)
							{
								this._resetLayout();
							}
							return Promise.resolve(false);
						}.bind(this));
					}
					return Promise.resolve(true);
				}.bind(this));
		}
		return Promise.resolve(true);
	};

	KendoGridLayoutMenu.prototype._setConfiguration = function(showAllColumns)
	{
		var self = this, visibleColumns = [], hiddenColumns = [],
			layoutColumns = this._obCurrentGridLayoutExtendedDataModel().layoutColumns(), orderColumns = [];
		//If show all columns
		if (showAllColumns)
		{
			orderColumns = this._gridDefinition.Columns;
		}
		else
		{
			for (var i = 0, len = this._gridDefinition.Columns.length; i < len; i++)
			{
				var fieldName = this._gridDefinition.Columns[i].FieldName;
				var layoutColumn = Enumerable.From(layoutColumns).Where(function(c)
				{
					return c.FieldName == fieldName
				}).ToArray()[0];
				if (layoutColumn)
				{
					if (layoutColumn.Width)
					{
						this._gridDefinition.Columns[i].Width = layoutColumn.Width;
					}
					if (layoutColumn.locked)
					{
						this._gridDefinition.Columns[i].locked = layoutColumn.locked;
					}
					visibleColumns.push(this._gridDefinition.Columns[i]);
				}
				else
				{
					hiddenColumns.push(this._gridDefinition.Columns[i]);
				}
			}

			for (var i = 0, len = layoutColumns.length; i < len; i++)
			{
				var fieldName = layoutColumns[i].FieldName;
				var layoutColumn = Enumerable.From(visibleColumns).Where(function(c)
				{
					return c.FieldName == fieldName
				}).ToArray()[0];
				if (layoutColumn)
				{
					orderColumns.push(layoutColumn);
				}
			}
		}

		this.obSummaryGridVisible(this._obCurrentGridLayoutExtendedDataModel().showSummaryBar());
		this._obSelectedColumns(orderColumns);
		this._availableColumns = hiddenColumns;
		var sortedItems = Enumerable.From(layoutColumns)
			.Where(function(c)
			{
				return c.SortIndex != null
			})
			.Select(function(c)
			{
				return new TF.Grid.SortItem(c.FieldName, c.SortAscending)
			})
			.ToArray();
		if (!(this._obSortedItems().length == 0 && sortedItems.length == 0))
		{
			this._obSortedItems(sortedItems);
		}
		var aggregationMap = {};
		Enumerable.From(layoutColumns)
			.Where(function(c)
			{
				return c.AggregationOperator
			})
			.ForEach(function(c)
			{
				aggregationMap[c.FieldName] = c.AggregationOperator;
			});
		this.obAggregationMap(aggregationMap);
	};

	KendoGridLayoutMenu.prototype._updateCurrentLayout = function()
	{
		if (this._applyingLayout || !this.obLayoutFilterOperation || !this.obLayoutFilterOperation() || !this._obCurrentGridLayoutExtendedDataModel())
		{
			return;
		}
		var i, sortedItem, layoutColumn;
		var selectedColumns = this._obSelectedColumns();
		var sortedItems = this._obSortedItems();
		var aggregationMap = this.obAggregationMap();
		var currentGridLayoutExtendedDataModel = this._obCurrentGridLayoutExtendedDataModel();

		var newLayoutColumns = [];
		for (i = 0; i < selectedColumns.length; i++)
		{
			layoutColumn = {
				FieldName: selectedColumns[i].FieldName,
				Width: selectedColumns[i].width
			};
			if (selectedColumns[i].locked)
			{
				layoutColumn.locked = true;
			}
			sortedItem = Enumerable.From(sortedItems).Where(function(c)
			{
				return c.Name == selectedColumns[i].FieldName
			}).ToArray()[0];
			if (sortedItem)
			{
				layoutColumn.SortIndex = sortedItems.indexOf(sortedItem);
				layoutColumn.SortAscending = sortedItem.isAscending();
			}
			var aggregationOperator = aggregationMap[selectedColumns[i].FieldName];
			if (aggregationOperator)
			{
				layoutColumn.AggregationOperator = aggregationOperator;
			}
			newLayoutColumns.push(layoutColumn);
		}
		var oldString = JSON.stringify(currentGridLayoutExtendedDataModel.layoutColumns());
		var newString = JSON.stringify(newLayoutColumns);
		if (oldString != newString)
		{
			currentGridLayoutExtendedDataModel.layoutColumns(newLayoutColumns);
		}
		currentGridLayoutExtendedDataModel.showSummaryBar(this.obSummaryGridVisible());
		this._obCurrentGridLayoutExtendedDataModel.valueHasMutated();
	};

	KendoGridLayoutMenu.prototype._currentLayoutChange = function()
	{
		if (this.options.loadLayout === false)
		{
			return;
		}
		var gridLayoutExtendedDataModel = this._obCurrentGridLayoutExtendedDataModel().clone();
		gridLayoutExtendedDataModel.name("");
		gridLayoutExtendedDataModel.description("");
		gridLayoutExtendedDataModel.filterId(null);
		this._obDefaultLayoutDataModel(gridLayoutExtendedDataModel);
		this._obDefaultLayoutDataModel().apiIsDirty(true);
		//IF the request from search, do not sticky the layout.
		if (this.options.fromSearch || this.options.isTemporaryFilter)
		{
			return;
		}
		tf.storageManager.save(this.options.storageKey, gridLayoutExtendedDataModel.toData(), null, null, false);
	};

	KendoGridLayoutMenu.prototype.resetLayoutClick = function(viewModel, e)
	{
		var self = this;

		// View-847 - start
		// fix view-847 by setTimeout because currently show spinner operation seems not a sync operation,
		// so the spinner not display immediately when loadingIndicator function call, it displayed after resetLayout function finished,
		// so added setTimeout to switch code execute priority.
		return new Promise(function(resolve)
		{
			tf.loadingIndicator.showImmediately();
			setTimeout(function()
			{
				resolve();
			}, 0);
		})
			.then(function()
			{
				self._resetLayout();
				setTimeout(function()
				{
					tf.loadingIndicator.tryHide();
				}, 1000);
			});
		// View-847 - end
	};

	KendoGridLayoutMenu.prototype._resetLayout = function()
	{
		if (this._obCurrentGridLayoutExtendedDataModel()._entityBackup.FilterId && this._obCurrentGridLayoutExtendedDataModel()._entityBackup.FilterId === this._obCurrentGridLayoutExtendedDataModel().filterId())
		{
			this.obSelectedGridFilterId(null);
		}
		this._applyingLayout = true;
		this._layoutFilterId = null;
		this._revertCurrentLayoutChange();

		this._obSelectedGridLayoutExtendedDataModel(null);
		this._resetAppliedLayoutInitState(null);

		this._obCurrentGridLayoutExtendedDataModel(new TF.DataModel.GridLayoutExtendedDataModel(this._defaultGridLayoutExtendedEntity));
		this._setConfiguration();
		this._setGridState();
		this.obAggregationMap([]);
		this.obSummaryGridVisible(false);
		this._applyingLayout = false;
		this.obResetLayout(true);
		//IF the request from search, do not sticky the layout.
		if (this.options.fromSearch || this.options.isTemporaryFilter)
		{
			return;
		}
		tf.storageManager.save(this._storageLayoutDataKey, null);
	};

	KendoGridLayoutMenu.prototype.mangeLayoutClick = function(viewModel, e)
	{
		var self = this;
		this.obGridLayoutExtendedDataModels().forEach(function(item)
		{
			var filter = self.obGridFilterDataModels().filter(function(filter)
			{
				return filter.id() === item.filterId();
			});
			if (filter && filter.length > 0 && item.filterName() != filter[0].name())
			{
				item.filterName(filter[0].name());
			}
		});
		tf.modalManager.showModal(
			new TF.Modal.Grid.ManageLayoutModalViewModel(
				this.obGridLayoutExtendedDataModels,
				this.obGridFilterDataModels,
				this.saveAndEditLayout,
				this.applyLayout,
				this.obSelectedGridLayoutName
			)
		);
	};

	KendoGridLayoutMenu.prototype.gridLayoutClick = function(gridLayoutExtendDataModel, e)
	{
		var self = this;

		var isCheckedItem = $(e.target).parent().hasClass('menu-item-checked');
		if (TF.isPhoneDevice && isCheckedItem)
			return self._resetLayout();
		else
			return self.notifyUpdateAndApplyLayout.bind(self)(gridLayoutExtendDataModel);
	};

	KendoGridLayoutMenu.prototype.notifyUpdateAndApplyLayout = function(gridLayoutExtendDataModel)
	{
		var self = this;
		var saveCurrentFilterOperationResult = true;

		var triggerName = 'layout';
		return self.saveCurrentFilter(triggerName)
			.then(function(result)
			{
				saveCurrentFilterOperationResult = result.operationResult;
				if (saveCurrentFilterOperationResult !== null && self.kendoGrid.dataSource.filter())
					return self.clearKendoGridQuickFilter.bind(self)();
				else
					return Promise.resolve();
			})
			.then(function()
			{
				if (saveCurrentFilterOperationResult !== null)
					return self.applyLayout.bind(self)(gridLayoutExtendDataModel);
				else
					return Promise.resolve(saveCurrentFilterOperationResult);
			});
	};

	KendoGridLayoutMenu.prototype._confirmMessageWhenfilterIsNotValid = function(filter, gridLayoutExtendDataModel)
	{
		if (filter.IsValid === false)
		{
			return tf.promiseBootbox.yesNo(
				{
					message: "This Layout has a Filter associated with it that cannot be loaded. The Layout can be opened, but the Filter will not be applied. Are you sure you want to apply this Layout (" + gridLayoutExtendDataModel.name() + ")?"
				},
				"Confirmation Message"
			).then(function(result)
			{
				if (!result)
				{
					return Promise.reject();
				}
				return Promise.resolve(true);
			}.bind(this));
		}
		return Promise.resolve(true);
	};

	KendoGridLayoutMenu.prototype.applyLayout = function(gridLayoutExtendDataModel, isNoConfirm)
	{
		var self = this;

		return self._alertMessageWhenLayoutIsDeleted(gridLayoutExtendDataModel.name())
			.then(function(existLayout)
			{
				if (!existLayout)
					return Promise.resolve(false);

				if (self.obSelectedGridLayoutModified() == "modified" && self._obSelectedGridLayoutExtendedDataModel() && !isNoConfirm)
				{
					var message = "The currently applied layout (" + self._obSelectedGridLayoutExtendedDataModel().name() + ") has unsaved changes. Would you like to save these changes before applying this layout?";
					return tf.promiseBootbox.yesNo(message, "Unsaved Changes"
					).then(function(result)
					{
						if (result)
						{
							return Promise.resolve()
								.then(function(result)
								{
									return self.obSelectedGridLayoutModified() ? self.saveLayout() : Promise.resolve(result && true);
								})
								.then(function(result)
								{
									//IF the request from search, do not sticky the filter.
									if (this.options.fromSearch || this.options.isTemporaryFilter)
									{
										return self.applyLayoutExtended(gridLayoutExtendDataModel);
									}
									return tf.storageManager.save(self._storageFilterDataKey, gridLayoutExtendDataModel.filterId())
										.then(function()
										{
											return self.applyLayoutExtended(gridLayoutExtendDataModel);
										});
								});
						}
						else if (result === false)
						{
							self._revertCurrentLayoutChange();
							return self.applyLayoutExtended(gridLayoutExtendDataModel);
						}
						else
						{
							// Click cross button, nothing to do.
						}
					});
				}
				else
				{
					if (self.obSelectedGridLayoutModified() == "modified")
					{
						self._revertCurrentLayoutChange();
					}
					return self.applyLayoutExtended(gridLayoutExtendDataModel);
				}
			});
	};

	KendoGridLayoutMenu.prototype._getLayoutRelatedFilterId = function(layoutId)
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "gridlayout/id", layoutId))
			.then(function(apiResponse)
			{
				var getLayoutExtended = apiResponse;

				var relatedFilterId;
				if (getLayoutExtended)
					relatedFilterId = getLayoutExtended.FilterId;

				return Promise.resolve(relatedFilterId);
			});
	};

	KendoGridLayoutMenu.prototype.applyLayoutExtended = function(gridLayoutExtendDataModel)
	{
		var self = this;
		var layoutId = gridLayoutExtendDataModel.id();
		var filterId = gridLayoutExtendDataModel.filterId();
		var filter = null;
		return TF.Grid.FilterHelper.getFilterById(filterId)
			.then(function(filterObj)
			{
				filter = filterObj;
				if (filterId && !filterObj)
				{
					message = 'The Filter that was applied has been deleted. The system default Filter will be applied to this grid.';
					return tf.promiseBootbox.alert(message, 'Warning', 40000);
				}
				else
					return Promise.resolve(true);
			})
			.then(function()
			{
				return this._confirmMessageWhenfilterIsNotValid(filter, gridLayoutExtendDataModel);
			}.bind(this))
			.then(function()
			{
				return self._getLayoutRelatedFilterId.bind(self)(layoutId);
			})
			.then(function(relatedFilterId)
			{
				gridLayoutExtendDataModel.filterId(relatedFilterId);
				self._obSelectedGridLayoutExtendedDataModel(gridLayoutExtendDataModel);
				self._resetAppliedLayoutInitState(self._obSelectedGridLayoutExtendedDataModel());
				self._obCurrentGridLayoutExtendedDataModel(gridLayoutExtendDataModel);
				self._applyLayoutExtended.bind(self)(gridLayoutExtendDataModel);

				return Promise.resolve(true);
			}).then(function()
			{
				return self._confirmMessageWhenLayoutFilterIsNotAvailableInCurrentDatasource();
			}).catch(function() { });
	};

	KendoGridLayoutMenu.prototype._applyLayoutExtended = function(gridLayoutExtendDataModel)
	{
		var selectedObGridFilterDataModels = Enumerable.From(this.obGridFilterDataModels()).Where(function(c)
		{
			return c.id() == gridLayoutExtendDataModel.filterId();
		}).ToArray();

		if (selectedObGridFilterDataModels.length > 0)
			this.obSelectedGridFilterId(gridLayoutExtendDataModel.filterId());
		else
		{
			this.obSelectedGridFilterId(null);
		}

		if (this.relatedFilterEntity)
		{
			delete this.relatedFilterEntity;
		}
		if (this.obCallOutFilterName())
		{
			this.obCallOutFilterName(null);
		}
		if (this.options.callOutFilterName)
		{
			this.options.callOutFilterName = null;
		}
		if (this._gridState.filteredIds)
		{
			this._gridState.filteredIds = null;
		}
		if (this.isFromRelated())
		{
			this.isFromRelated(false);
		}

		if (gridLayoutExtendDataModel.filterId() && selectedObGridFilterDataModels.length === 0)
		{
			this._obSelectedGridLayoutExtendedDataModel().filterId(null);
			this.obSelectedGridFilterId(null);
			this.gridAlert.show(
				{
					alert: this.gridAlert.alertOption.danger,
					message: "The layout filter doesn't exist. No filter applied."
				});
		}

		this._setConfiguration();
		this._setGridState();
		this._obCurrentGridLayoutExtendedDataModel().apiIsDirty(false);
		//IF the request from search, do not sticky the layout.
		if (this.options.fromSearch || this.options.isTemporaryFilter)
		{
			return;
		}
		var layoutName = gridLayoutExtendDataModel.name();
		ga('send', 'event', 'Action', 'Grid Layout', layoutName);
		tf.storageManager.save(this._storageLayoutDataKey, layoutName);
	};

	KendoGridLayoutMenu.prototype.saveLayoutClick = function(viewModel, e)
	{
		var self = this;
		var isNew = !self._obSelectedGridLayoutExtendedDataModel();
		if (isNew)
			return self.saveAndEditLayout("new", self._obSelectedGridLayoutExtendedDataModel(), true);
		else
		{
			return self.syncFilter().then(self.saveLayout.bind(self)())
				.then(function()
				{
					return self._obSelectedGridLayoutExtendedDataModel().apiIsDirty(false);
				});
		}
	};

	KendoGridLayoutMenu.prototype.saveLayout = function()
	{
		this._resetAppliedLayoutInitState(this._obSelectedGridLayoutExtendedDataModel());
		this._updateGridLayoutExtendedDataModels(this._obSelectedGridLayoutExtendedDataModel());
		return tf.promiseAjax.put(pathCombine(tf.api.apiPrefix(), "gridlayout"),
			{
				data: this._obSelectedGridLayoutExtendedDataModel().toData()
			});
	};

	KendoGridLayoutMenu.prototype._updateGridLayoutExtendedDataModels = function(gridLayoutExtendedDataModel)
	{
		var apiIsDirty = gridLayoutExtendedDataModel.apiIsDirty();
		var apiIsNew = gridLayoutExtendedDataModel.apiIsNew();

		var self = this;
		self.obGridLayoutExtendedDataModels().map(function(obGridLayoutExtendedDataModel)
		{
			if (obGridLayoutExtendedDataModel.id() === gridLayoutExtendedDataModel.id())
			{
				var filter = self.obGridFilterDataModels().filter(function(filter)
				{
					return filter.id() === gridLayoutExtendedDataModel.filterId();
				});
				if (filter && filter.length > 0)
					gridLayoutExtendedDataModel.filterName(filter[0].name());
				obGridLayoutExtendedDataModel.update(gridLayoutExtendedDataModel.toData());
			}
		});

		gridLayoutExtendedDataModel.apiIsDirty(apiIsDirty);
		gridLayoutExtendedDataModel.apiIsNew(apiIsNew);
	};

	KendoGridLayoutMenu.prototype.saveAsNewLayoutClick = function(viewModel, e)
	{
		if (this._obSelectedGridLayoutExtendedDataModel())
		{
			this.saveAndEditLayout("new", this._obSelectedGridLayoutExtendedDataModel(), true);
		}
		else
		{
			this.saveLayoutClick(viewModel, e);
		}
	};

	KendoGridLayoutMenu.prototype.saveAndEditLayout = function(isNew, gridLayoutExtendedDataModel, isNoConfirm)
	{
		return tf.modalManager.showModal(new TF.Modal.Grid.ModifyLayoutModalViewModel(
			this._gridType,
			isNew,
			gridLayoutExtendedDataModel ? gridLayoutExtendedDataModel : this._obCurrentGridLayoutExtendedDataModel(),
			this.obGridFilterDataModels,
			this.obSelectedGridFilterId
		))
			.then(function(result)
			{
				if (!result)
				{
					return result;
				}
				var savedGridLayoutExtendedDataModel = result.savedGridLayoutExtendedDataModel;
				if (isNew !== "new")
				{
					gridLayoutExtendedDataModel.update(savedGridLayoutExtendedDataModel.toData());
				}
				else
				{
					this.obGridLayoutExtendedDataModels.push(savedGridLayoutExtendedDataModel);
				}
				if (result.applyOnSave)
				{
					return this.applyLayout(savedGridLayoutExtendedDataModel, isNoConfirm);
				}
				else
				{
					if (this._obSelectedGridLayoutExtendedDataModel() && isNew !== "new" && this._obSelectedGridLayoutExtendedDataModel().id() == gridLayoutExtendedDataModel.id())
					{
						this.applyLayout(gridLayoutExtendedDataModel, isNoConfirm);
					}
				}
				return true;
			}.bind(this));
	};

	KendoGridLayoutMenu.prototype._revertCurrentLayoutChange = function()
	{
		if (this._obSelectedGridLayoutExtendedDataModel())
		{
			this._obSelectedGridLayoutExtendedDataModel().revert();
		}
	};

	KendoGridLayoutMenu.prototype._sortGridLayoutExtendedDataModels = function()
	{
		this.obGridLayoutExtendedDataModels.sort(function(left, right)
		{
			return left.name().toLowerCase() == right.name().toLowerCase() ? 0 : (left.name().toLowerCase() < right.name().toLowerCase() ? -1 : 1);
		});
	};
	//Return all the layouts that  columns in default colums
	KendoGridLayoutMenu.prototype._filterLayoutsByDefaultColumns = function(gridLayouts)
	{
		var self = this, defaultColumns = self.getDefinitionLayoutColumns().map(function(item) { return item.FieldName }), validGridLayouts = [];
		gridLayouts.forEach(function(layout)
		{
			if (self._validColumns(layout, defaultColumns))
			{
				validGridLayouts.push(layout);
			}
		})
		return validGridLayouts;
	}

	KendoGridLayoutMenu.prototype._validColumns = function(gridLayout, defaultColumns)
	{
		var self = this, isValid = false, columns = gridLayout.LayoutColumns;
		for (i = 0; i < columns.length; i++)
		{
			if (defaultColumns.includes(columns[i].FieldName))
			{
				isValid = true;
				break;
			}
		}
		return isValid;
	}
	KendoGridLayoutMenu.prototype._gridLayoutExtendedDataModelsChange = function()
	{
		var self = this;
		if (this._gridLayoutExtendedDataModelsChangeSubscription)
		{
			this._gridLayoutExtendedDataModelsChangeSubscription.dispose();
		}
		this._sortGridLayoutExtendedDataModels();
		this._gridLayoutExtendedDataModelsChangeSubscription = this.obGridLayoutExtendedDataModels.subscribe(this._gridLayoutExtendedDataModelsChange, this);
		this.subscriptions.push(this._gridLayoutExtendedDataModelsChangeSubscription);
		// handle case of:
		// 1.user 1 applied layout A
		// 2.layout A be deleted by user 2
		// 3.user 1 refresh grid
		// 4.find layout A not exist, user 1's grid page reload
		if (self._obSelectedGridLayoutExtendedDataModel() && !Enumerable.From(this.obGridLayoutExtendedDataModels()).Where(function(c)
		{
			return c.id() == self._obSelectedGridLayoutExtendedDataModel().id()
		}).ToArray()[0])
		{
			this._resetLayout();
		}
	};
})();

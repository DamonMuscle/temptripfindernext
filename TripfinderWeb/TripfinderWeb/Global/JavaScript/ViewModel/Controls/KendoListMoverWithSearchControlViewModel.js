(function()
{
	createNamespace("TF.Control").KendoListMoverWithSearchControlViewModel = KendoListMoverWithSearchControlViewModel;

	KendoListMoverWithSearchControlViewModel.defaults = {
		description: "",
		availableTitle: "",
		selectedTitle: "",
		height: 400,
		showEnabled: false,
		displayCheckbox: true,
		filterCheckboxText: "",
		mustSelect: false,
		showBulkMenu: false,
		showLockedColumn: false,
		columnWidth: "150px",
		selectable: "multiple",
		disableDropIndicator: true,
		getUrl: function(gridType, options)
		{
			var prefix = tf.api.apiPrefix();
			if (options.dataSource)
			{
				prefix = pathCombine(tf.api.apiPrefixWithoutDatabase(), options.dataSource);
			}
			return pathCombine(prefix, "search", tf.dataTypeHelper.getEndpoint(gridType));
		},
		getParamData: function(searchData)
		{
			return searchData.paramData;
		},
		getData: function(searchData)
		{
			return searchData.data;
		},
		setRequestOption: function(option)
		{
			return option;
		},
		filterSetField: "",
		overlay: true,
		serverPaging: false,
		getSelectableRecords: null,
		additionalFilterItems: [] // this property is taken advantage to control the datasource in the list mover. for example, we show fieldtrips who have been geocoded only.
	};

	function KendoListMoverWithSearchControlViewModel(selectedData, options)
	{
		if (options.type == "student")
		{
			options.serverPaging = true;
		}
		this.options = $.extend({}, KendoListMoverWithSearchControlViewModel.defaults, options);

		this.leftSearchGrid = null;
		this.rightSearchGrid = null;

		this.isChanged = false;

		this.description = this.options.description;
		this.availableTitle = this.options.availableTitle;
		this.selectedTitle = this.options.selectedTitle;
		// If the grid is reading data from server(virtual scroll), only get ids.
		this.selectedData = this.options.serverPaging ? Enumerable.From(selectedData.slice()).Select("$.Id").ToArray() : selectedData.slice();
		this.oldData = this.options.serverPaging ? Enumerable.From(selectedData.slice()).Select("$.Id").ToArray() : selectedData.slice();

		this.headerFilters = null;

		this.columns = this.options.columnSources || this.columnSources[this.options.type];

		if (!this.columns && this.options.type === 'Genders')
		{
			this.columns = TF.ListFilterDefinition.ColumnSource.Gender;
		}

		this.originalColumns = [];
		this.allRecords = [];

		this.obLeftCount = ko.observable(0);
		this.obRightCount = ko.observable(0);

		this.obDisplayCheckbox = ko.observable(this.options.displayCheckbox);
		this.obDisplayAddButton = ko.observable(this.options.displayAddButton);

		this._obLeftSelData = ko.observableArray();
		this._obRightSelData = ko.observableArray();
		this.obAvailableCount = ko.observable(0);
		this.leftGridExcludeId = [];
		this.obShowEnabled = ko.observable(this.options.showEnabled);
		this.obFilterCheckboxText = ko.observable(this.options.filterCheckboxText);
		this.obSelectedData = ko.observableArray(this.selectedData);
		this.obSelectedData.subscribe(() =>
		{
			if (!this.obDisableControl) return;
			this.obDisableControl(this.obSelectedData().length === 0)
		});
		this.obshowRemoveColumnButton = ko.observable(options.showRemoveColumnButton);
		this.obEditCurrentDefinitionColumns = ko.observable(options.editCurrentDefinitionColumns);
		this.showRawImageColumn = options.showRawImageColumn;

		this.obLeftGridSelected = ko.computed(function()
		{
			return this._obLeftSelData() && this._obLeftSelData().length > 0;
		}, this);
		this.obRightGridSelected = ko.computed(function()
		{
			return this._obRightSelData() && this._obRightSelData().length > 0;
		}, this);
		this.obSelectedCount = ko.computed(function()
		{
			return this.obSelectedData().length;
		}, this);
		this.obShowEnabledCopmuter = ko.computed(function()
		{
			return this.obShowEnabled();
		}, this);
		this.obIsInoperableSelected = ko.observable(false);

		this.obErrorMessageDivIsShow = ko.observable(false);
		this.obErrorMessage = ko.observable("");
		this.obValidationErrors = ko.observableArray([]);
		this.obErrorMessageTitle = ko.observable("Error Occurred");
		this.obErrorMessageDescription = ko.observable("The following error occurred.");

		this._dataChangeReceive = this._dataChangeReceive.bind(this);
		PubSub.unsubscribe(topicCombine(pb.DATA_CHANGE, "listmover"));
		PubSub.subscribe(topicCombine(pb.DATA_CHANGE, "listmover"), this._dataChangeReceive);
	}

	KendoListMoverWithSearchControlViewModel.prototype._dataChangeReceive = function()
	{
		this.leftSearchGrid.refresh();
	};

	KendoListMoverWithSearchControlViewModel.prototype.filterMenuClick = function(viewModel, e)
	{
		return TF.Helper.KendoListMoverHelper.filterMenuClick.call(this, viewModel, e);
	};

	KendoListMoverWithSearchControlViewModel.prototype.createFilterMenu = function(viewModel, e)
	{
		var self = this;
		var leftGrid = this.leftSearchGrid;
		var gridType = this.options.type.toLowerCase();
		var allColumns = TF.Grid.FilterHelper.getGridDefinitionByType(gridType).Columns.slice(0);
		var gridDefinition = {
			Columns: allColumns.map(function(definition)
			{
				return TF.Grid.GridHelper.convertToOldGridDefinition(definition);
			})
		};

		if (!leftGrid.isFilterInited)
		{
			leftGrid.obSelectedGridFilterId = ko.observable();
			leftGrid.obSelectedGridFilterClause = ko.observable();
			leftGrid.reminderMenuEnable = ko.observable(false);
			leftGrid.obGridFilterDataModelsFromDataBase = ko.observableArray([]);
			leftGrid.isFilterInited = true;

			leftGrid.createNewFilterClick = function()
			{
				return tf.modalManager.showModal(
					new TF.Modal.Grid.ModifyFilterModalViewModel(
						gridType,
						"new",
						null,
						null,
						gridDefinition
					)
				).then(function(result)
				{
					if (!result)
					{
						return;
					}
					leftGrid.obGridFilterDataModelsFromDataBase.push(result.savedGridFilterDataModel);
					if (result.applyOnSave)
					{
						applyGridFilter(result.savedGridFilterDataModel);
					}
				});
			};

			leftGrid.manageFilterClick = function()
			{
				tf.modalManager.showModal(
					new TF.Modal.Grid.ManageFilterModalViewModel({
						obAllFilters: leftGrid.obGridFilterDataModelsFromDataBase,
						editFilter: saveAndEditGridFilter,
						applyFilter: applyGridFilter
					})
				).then(function()
				{
					if (!Enumerable.From(leftGrid.obGridFilterDataModelsFromDataBase()).Any(function(c) { return c.id() == leftGrid.obSelectedGridFilterId(); }))
					{
						leftGrid.clearGridFilterClick();
					}
				});
			};

			leftGrid.clearGridFilterClick = function()
			{
				applyGridFilter(null);
			};

			leftGrid.gridFilterClick = function(viewModel)
			{
				applyGridFilter(viewModel);
			};

			tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridfilters"), {
				paramData: {
					"@filter": String.format("(eq(dbid, {0})|isnull(dbid,))&eq(datatypeId,{1})&eq(IsValid,true)",
						tf.datasourceManager.databaseId, tf.dataTypeHelper.getId(gridType)),
				}
			}).then(function(data)
			{
				var gridFilterDataModels = TF.DataModel.BaseDataModel.create(TF.DataModel.GridFilterDataModel, data.Items);
				leftGrid.obGridFilterDataModelsFromDataBase(gridFilterDataModels);
			});
		}

		function saveAndEditGridFilter(isNew, gridFilterDataModel)
		{
			return tf.modalManager.showModal(
				new TF.Modal.Grid.ModifyFilterModalViewModel(
					gridType,
					isNew,
					gridFilterDataModel,
					null,
					gridDefinition
				)
			).then(function(result)
			{
				if (!result)
				{
					return true;
				}
				if (isNew !== "new")
				{
					gridFilterDataModel.update(result.savedGridFilterDataModel.toData());
				}
				else
				{
					leftGrid.obGridFilterDataModelsFromDataBase.push(result.savedGridFilterDataModel);
				}

				if (result.applyOnSave ||
					(result.savedGridFilterDataModel.id() == leftGrid.obSelectedGridFilterId()))
				{
					applyGridFilter(result.savedGridFilterDataModel);
				}
			});
		}

		function applyGridFilter(filter)
		{
			if (filter)
			{
				leftGrid.obSelectedGridFilterId(filter.id());
				leftGrid.obSelectedGridFilterClause(filter.whereClause());
			} else
			{
				leftGrid.obSelectedGridFilterId(null);
				leftGrid.obSelectedGridFilterClause("");
				leftGrid.clearKendoGridQuickFilter();
			}

			self.getAllRecords().then(function()
			{
				self.setDataSource();
			});
		}

		tf.contextMenuManager.showMenu(
			e.target,
			new TF.ContextMenu.TemplateContextMenu(
				"workspace/grid/FilterContextMenu",
				new TF.Grid.GridMenuViewModel((function()
				{
					var gridViewModel = {};
					gridViewModel.obShowSplitmap = ko.observable(false);
					return gridViewModel;
				})(), leftGrid)
			));
	};

	KendoListMoverWithSearchControlViewModel.prototype.onEnableCheckboxClick = function()
	{
		this.obShowEnabled(!this.obShowEnabled());

		if (this.leftSearchGrid)
		{
			if (this.options.serverPaging)
			{
				this.leftSearchGrid.triggerRefreshClick();
				this.careteKendoDropTargetEvent();
			}
			else
			{
				this.getAllRecords().then(function()
				{
					this.setDataSource("left");
					this.careteKendoDropTargetEvent();
				}.bind(this));
			}
		}
		return true;
	};

	KendoListMoverWithSearchControlViewModel.prototype.onAddClick = function(viewModel, el)
	{

	};

	KendoListMoverWithSearchControlViewModel.prototype.addRawImageColumn = function(allColumns)
	{
		var rawImage = {
			FieldName: "RawImage",
			DisplayName: " ",
			Width: "35px",
			sortable: false,
			locked: false,
			type: "nofilter",
			isSortItem: false,
			template: function(arg)
			{
				var url = "data:image/jpeg;base64," + arg.RawImage;
				return "<img style=\"width:20px; height:20px;\" src=\"" + url + "\" class=\"img-circle\"/>";
			},
			filterable: false
		};
		allColumns.push(rawImage);
	};

	KendoListMoverWithSearchControlViewModel.prototype.addRemoveColumnClick = function(viewModel, el)
	{
		function initHiddenLockedField(column)
		{
			if (typeof (column.hidden) == "undefined")
			{
				column.hidden = false;
			}
			if (typeof (column.locked) == "undefined")
			{
				column.locked = false;
			}
		}
		var listMoverColumns = this.columns;
		var availableColumns = [];
		var selectedColumns = [];
		var allColumns = [];
		if (this.obEditCurrentDefinitionColumns())
		{
			allColumns = $.extend(true, [], this.columnSources[this.options.type]);
		}
		else
		{
			var gridType = this.options.type.toLowerCase();
			allColumns =  $.extend(true, [], TF.Grid.FilterHelper.getGridDefinitionByType(gridType).Columns);
		}
		allColumns = TF.Helper.KendoListMoverHelper.removeOnlyForFilterColumn(allColumns);
		if (this.showRawImageColumn)
		{
			this.addRawImageColumn(allColumns);
		}
		availableColumns = allColumns.slice(0);
		allColumns.forEach(function(item)
		{
			item.hidden = true;
			initHiddenLockedField(item);
		});

		for (var i = 0, l = listMoverColumns.length; i < l; i++)
		{
			var existsColumn = null;
			for (var j = 0, jl = allColumns.length; j < jl; j++)
			{
				if (allColumns[j].FieldName == listMoverColumns[i].FieldName)
				{
					existsColumn = listMoverColumns[i];
					var tempColumn = Enumerable.From(availableColumns).Where("$.FieldName=='" + allColumns[j].FieldName + "'").FirstOrDefault();
					tempColumn.FieldName = "";
					allColumns[j] = existsColumn;
					break;
				}
			}
			var columnClone = $.extend(
				{}, listMoverColumns[i]);
			if (!columnClone.DisplayName || $.trim(columnClone.DisplayName) == "")
			{
				if (columnClone.FieldName !== "RawImage")
				{
					columnClone.DisplayName = columnClone.FieldName;
				}
				else
				{
					columnClone.DisplayName = "Image";
				}
			}
			initHiddenLockedField(columnClone);
			selectedColumns.push(columnClone);
			if (!existsColumn)
			{
				allColumns.unshift(columnClone);
			}
		}
		var self = this;
		availableColumns = Enumerable.From(availableColumns).Where("$.FieldName!=''").ToArray();
		tf.modalManager.showModal(
			new TF.Modal.Grid.EditKendoColumnModalViewModel(
				availableColumns,
				selectedColumns,
				self.defaultColumns || self.originalColumns
			)
		).then(function(editColumnViewModel)
		{
			if (!editColumnViewModel)
			{
				return;
			}
			var enumerable = Enumerable.From(self.originalColumns);
			// reset column setting to default
			editColumnViewModel.selectedColumns = editColumnViewModel.selectedColumns.map(function(item)
			{
				var oc = enumerable.Where("$.FieldName=='" + item.FieldName + "'").FirstOrDefault();
				return oc || item;
			});

			self.columns = editColumnViewModel.selectedColumns;
			self.saveCurrentSelectedColumns(self.options.type, self.columns);
			self.leftSearchGrid._gridDefinition.Columns = editColumnViewModel.selectedColumns;
			self.leftSearchGrid.rebuildGrid();
			if (self.options.updateColumnGrid == null || self.options.updateColumnGrid == 'right')
			{
				self.rightSearchGrid._gridDefinition.Columns = editColumnViewModel.selectedColumns;
				self.rightSearchGrid.rebuildGrid();
			}

			// columns is changed, need to request data again.
			if (!self.options.serverPaging)
			{
				self.getAllRecords().then(function()
				{
					self.setDataSource();
				});
			}
		});
	};

	KendoListMoverWithSearchControlViewModel.prototype.refreshClick = function()
	{
		var self = this;
		this.saveCurrentSelectedColumns(this.options.type, this.columns);
		this.leftSearchGrid._gridDefinition.Columns = this.columns;
		this.leftSearchGrid.rebuildGrid();
		this.rightSearchGrid._gridDefinition.Columns = this.columns;
		this.rightSearchGrid.rebuildGrid();
		if (!this.options.serverPaging)
		{
			this.getAllRecords().then(function()
			{
				self.setDataSource();
			});
		}
	};

	KendoListMoverWithSearchControlViewModel.prototype._initGrids = function(el)
	{
		this.$form = $(el);
		this.availableColGridContainer = this.$form.find(".availablecolumngrid-container");
		this.selectedColGridContainer = this.$form.find(".selectedcolumngrid-container");
		var stickyColumns = this.getCurrentSelectedColumns(this.options.type);
		if (stickyColumns && (!this.columns || this.columns.length == 0))
		{
			this.columns = stickyColumns;
		}
		this.columns.map(function(item)
		{
			if (item.FieldName == "RawImage")
			{
				item.template = function(arg)
				{
					var url = "data:image/jpeg;base64," + arg.RawImage;
					return "<img style=\"width:20px; height:20px;\" src=\"" + url + "\" class=\"img-circle\"/>";
				};
			}
		});
		this.originalColumns = this.columnSources[this.options.type] || this.originalColumns;
		tf.shortCutKeys.createSpecialHashMap(tf.shortCutKeys._currentHashKey);
		this.initRightGrid();
		this.initLeftGrid();
		this.getAllRecords().then(function()
		{
			this.setDataSource();
			this.afterInit();
			if (this.obDisableControl) this.obDisableControl(this.obSelectedData().length === 0)
		}.bind(this));
	};

	KendoListMoverWithSearchControlViewModel.prototype.init = function(viewModel, el)
	{
		this._initGrids(el);
	};

	KendoListMoverWithSearchControlViewModel.prototype.saveCurrentSelectedColumns = function(gridType, columns)
	{
		return tf.storageManager.save(tf.storageManager.listMoverCurrentSelectedColumns(gridType, tf.authManager.authorizationInfo.authorizationTree.username), columns);
	};

	KendoListMoverWithSearchControlViewModel.prototype.getCurrentSelectedColumns = function(gridType)
	{
		return tf.storageManager.get(tf.storageManager.listMoverCurrentSelectedColumns(gridType, tf.authManager.authorizationInfo.authorizationTree.username));
	};

	KendoListMoverWithSearchControlViewModel.prototype.careteKendoDropTargetEvent = function()
	{
		var self = this;
		setTimeout(function()
		{
			if (this.rightSearchGrid !== null)
			{
				this.rightSearchGrid.$container.find("tbody tr").kendoDropTarget(
					{
						dragenter: function(e)
						{
							if (self.options.disableDropIndicator)
							{
								return;
							}
							if (!self._isDragItem(e))
								return;
	
							var targetItem = $(e.dropTarget[0]);
							targetItem.addClass("drag-target-insert-after-cursor");
	
							this._appendDropTargetCursorTriangle(targetItem);
						}.bind(this),
						dragleave: function(e)
						{
							$(e.dropTarget[0]).removeClass("drag-target-insert-after-cursor");
							this._removeDropTargetCursorTriangle();
						}.bind(this),
						drop: this._selectedDrop.bind(this)
					});
			}
		}.bind(this), 1000);
	};

	KendoListMoverWithSearchControlViewModel.prototype.onLeftGridChange = function(e, rowsData)
	{
		var rowsDataFiltered = this._onLeftGridChangeSelectable(e, rowsData);
		this._obLeftSelData(rowsDataFiltered);
		if (this._obLeftSelData().length > 0)
		{
			this._clearRightSelection();
		}
	};

	KendoListMoverWithSearchControlViewModel.prototype._onLeftGridChangeSelectable = function(e, rowsData)
	{
		var self = this;
		if (self.options.getSelectableRecords && !self.changeLeftSelect)
		{
			rowsData = self.options.getSelectableRecords(rowsData, self.selectedData);
			clearTimeout(self.changeSelectIdsTimeout);
			self.changeSelectIdsTimeout = setTimeout(function(rowsData)
			{
				self.changeLeftSelect = true;
				self.leftSearchGrid.getSelectedIds(rowsData.map(function(r) { return r.Id; }));
				self.changeLeftSelect = false;
			}.bind(self, rowsData));
			return rowsData;
		}
		return rowsData;
	};

	KendoListMoverWithSearchControlViewModel.prototype.onRightGridChangeCheck = function(e, selectedItems)
	{
		this.obIsInoperableSelected(this.isOperableCheck(selectedItems));
	};

	KendoListMoverWithSearchControlViewModel.prototype.isOperableCheck = function(selectedItems) { };

	KendoListMoverWithSearchControlViewModel.prototype.onRightGridChange = function(e, rowsData)
	{
		this._obRightSelData(rowsData);

		if (this._obRightSelData().length > 0)
		{
			this._clearLeftSelection();
		}
	};

	KendoListMoverWithSearchControlViewModel.prototype.initLeftGrid = function()
	{
		tf.loadingIndicator.show();
		var options = {
			gridDefinition:
			{
				Columns: this.columns
			},
			isBigGrid: true,
			kendoGridOption: this.options.leftKendoGridOption || this.leftKendoGridOption,
			showOmittedCount: false,
			showSelectedCount: true,
			setRequestURL: this.setLeftGridRequestURL.bind(this),
			setRequestOption: this.setLeftRequestOption.bind(this),
			gridType: this.options.type,
			udGridID: this.options.UDGridID,
			isSmallGrid: true,
			url: this.options.getUrl(this.options.type, this.options),
			showBulkMenu: this.options.showBulkMenu,
			showLockedColumn: this.options.showLockedColumn,
			height: this.options.height,
			sort: this.options.sort,
			reorderable: true,
			columnReorder: function(e)
			{
				var selectedGrid = $(".selectedcolumngrid-container").data("kendoGrid");
				selectedGrid.reorderColumn(e.newIndex, selectedGrid.columns[e.oldIndex]);
			},
			onDataBound: function()
			{
				this.onBeforeLeftGridDataBound(this.leftSearchGrid);
				this.obAvailableCount(this.leftSearchGrid.obFilteredRecordCount());
				this.obLeftCount(this.leftSearchGrid.kendoGrid.dataSource._total);
				this.bindSearchGridDraggable(this.leftSearchGrid, false);
				this.bindSearchGridDraggable(this.rightSearchGrid, true);
				this.bindLeftGridDropTarget();
				this.bindRightGridDropTarget();
				this.careteKendoDropTargetEvent();
				this.onLeftDataBound();
				// this.initGridScrollBar(this.availableColGridContainer);
				this._updateContentTableWidth(this.leftSearchGrid);
				tf.loadingIndicator.tryHide();
			}.bind(this),
			aggregateSearchDataSource: this.options.dataSource
		};
		this.initGridOption(options, "left");
		this.leftSearchGrid = new TF.Grid.LightKendoGrid(this.availableColGridContainer, options);
		this.leftSearchGrid.getKendoColumn = this._getLeftColumns;
		this.leftSearchGrid.onRowsChanged.subscribe(this.onLeftGridChange.bind(this));
		this.leftSearchGrid.onDoubleClick.subscribe(this.onLeftDBClick.bind(this));
		this.leftSearchGrid.$container.on("click", function(e)
		{
			tf.shortCutKeys.changeHashKey(options.routeState);
			e.stopPropagation();
			e.preventDefault();
		});

		// this._cancelKendoGridSelectedArea(this.leftSearchGrid.kendoGrid);
	};

	KendoListMoverWithSearchControlViewModel.prototype._updateContentTableWidth = function(searchGrid)
	{
		var $table = searchGrid.$container.find(".k-grid-content table"),
			width = searchGrid.$container.find(".k-grid-content table").width();

		$table.width(width);
	};

	KendoListMoverWithSearchControlViewModel.prototype.getAllRecords = function()
	{
		var self = this;

		if (self.options.serverPaging)
		{
			return Promise.resolve();
		}

		var requestOption = self.setLeftRequestOption({
			data: {},
			paramData: {}
		});
		requestOption.data.idFilter = {};

		self._addSortItemIntoRequest(requestOption);

		if (self.options.UDFId)
		{
			requestOption.data.fields = self.columns.map(function(c) { return c.DisplayName; });
			requestOption.data.sortItems = requestOption.data.sortItems.map(function(item)
			{
				item.Name = tf.UDFDefinition.getOriginalName(item.Name);
				return item;
			});
		}

		if (this.leftSearchGrid && this.leftSearchGrid.obSelectedGridFilterClause)
		{
			requestOption.data.filterClause = this.leftSearchGrid.obSelectedGridFilterClause();
		}
		var promise;
		switch (self.options.GridType)
		{
			case 'GPSEventType':
				promise = TF.Helper.VehicleEventHelper.getEventTypes();
				break;
			case 'Grades':
			case 'StaffTypes':
			case 'GeneralDataListsDisabilityCode':
			case 'Genders':
			case 'schoollocation':
				promise = tf.promiseAjax.get(self.options.getUrl(self.options.type, self.options));
				break;				
			case 'GeneralDataListsDisabilityCode':
				promise = tf.promiseAjax.get(self.options.getUrl(self.options.type, self.options));
				break;
			case 'Form':
				const filterSet = {};
				const uDGridID = self.options.UDGridID;
				var defaultFilter = tf.udgHelper.getUDGridIdFilter(uDGridID);
				filterSet["FilterItems"] = [];
				filterSet["FilterItems"].push(...defaultFilter);
				filterSet["FilterSets"] = [];
				filterSet["LogicalOperator"] = "and";
				requestOption.data.fields = [self.options.filterField];
				requestOption.data.filterSet = filterSet;
				requestOption.data.filterSet.UDGridID = uDGridID;
				promise = tf.promiseAjax.post(self.setLeftGridRequestURL(self.options.getUrl(self.options.type, self.options)), requestOption);
				break;
			default:
				promise = tf.promiseAjax.post(self.setLeftGridRequestURL(self.options.getUrl(self.options.type, self.options)), requestOption);
				break;
		}

		return promise
			.then(function(response)
			{
				// Preprocess StaffTypes
				if (self.options.GridType === 'StaffTypes')
				{
					response.Items.forEach(x => x.Id = x.StaffTypeId);
					response.Items.sort((x, y) => (x.StaffTypeName.toLowerCase() > y.StaffTypeName.toLowerCase() ? 1 : -1));
				}

				// Preprocess Genders
				if (self.options.GridType === 'Genders')
				{
					response.Items.forEach(x => x.Id = x.ID);
					response.Items.sort((x, y) => (x.Name.toLowerCase() > y.Name.toLowerCase() ? 1 : -1));
				}

				/**
				 * preprocess response of UDF list
				 */
				if (self.options.UDFId && response && response.Items)
				{
					response.Items = response.Items.filter(function(item)
					{
						return !!item[self.options.OriginalName];
					}).map(function(item)
					{
						var result = $.extend({}, item);
						result[tf.UDFDefinition.getFieldNameById(self.options.UDFId)] = item[self.options.OriginalName];
						return result;
					});

					response.Items = _.uniqBy(response.Items, self.options.OriginalName);
				}

				if (!self.obshowRemoveColumnButton() && !self.options.skipEmptyAndDuplicateCheck)
				{
					// remove empty items
					response.Items = (response.Items || []).filter(function(item)
					{
						return self.columns.some(function(c) { return !!item[c.FieldName]; });
					});

					// remove duplicated value
					response.Items = _.uniqBy(response.Items || [], function(item)
					{
						return self.columns.map(function(c)
						{
							return item[c.FieldName] || "";
						}).join("_*&^@_");// to avoid accident
					});
				}

				return self._getSourceFromResponse(response).then(function(records)
				{
					self.allRecords = records;
					if (self.options.invalidIds &&
						self.options.invalidIds.length > 0)
					{
						self.allRecords = self.allRecords.filter(function(item)
						{
							return !Enumerable.From(self.options.invalidIds).Any("$=='" + item.Id + "'");
						});
					}
					// change all records data to use selected data, because some time selected data is temp changed by user
					self.selectedData.forEach(function(data)
					{
						for (var i = 0; i < self.allRecords.length; i++)
						{
							if (self.allRecords[i].Id == data.Id)
							{
								for (var key in self.allRecords[i])
								{
									if (self.allRecords[i].hasOwnProperty(key) && data.hasOwnProperty(key) && data[key] !== null && data[key] !== undefined)
									{
										self.allRecords[i][key] = data[key];
									}
								}
							}
						}
					});
				});
			});
	};

	KendoListMoverWithSearchControlViewModel.prototype._getSourceFromResponse = function(response)
	{
		var self = this;
		var data = $.isArray(response.Items[0]) ? response.Items[0] : response.Items;
		self.changeSourceDataToGridAcceptData(data);
		var records = data;
		if (self.options.modifySource)
		{
			records = self.options.modifySource(records);
		}
		return Promise.resolve(records);
	};

	KendoListMoverWithSearchControlViewModel.prototype._addSortItemIntoRequest = function(requestOption)
	{
		var self = this;

		// build sortItem
		var rawSortItemArray = [];
		if (self.columns && self.columns.length > 0)
		{
			self.columns.forEach(function(column, idx)
			{
				if (column.isSortItem)
				{
					var rawSortItem = {
						fieldName: column.FieldName,
						sortIdx: column.sortIdx ? column.sortIdx : idx + 1

					};
					rawSortItemArray.push(rawSortItem);
				}
			});
		}

		rawSortItemArray.sort(function(a, b)
		{
			return a.sortIdx - b.sortIdx;
		});

		if (rawSortItemArray.length > 0)
		{
			requestOption.data.sortItems = requestOption.data.sortItems || [];

			rawSortItemArray.forEach(function(sortItem)
			{
				sortItem = {
					Name: sortItem.fieldName,
					Direction: "Ascending",
					isAscending: true
				};
				requestOption.data.sortItems.push(sortItem);
			});
		}
	};

	KendoListMoverWithSearchControlViewModel.prototype.changeSourceDataToGridAcceptData = function(data)
	{
		var self = this;
		data.forEach(function(item)
		{
			self.columns.forEach(function(define)
			{
				if (item[define.FieldName] !== null &&
					item[define.FieldName] !== undefined)
				{
					switch (define.type)
					{
						case "datetime":
							item[define.FieldName] = new Date(item[define.FieldName]);
							break;
						case "date":
							item[define.FieldName] = moment(moment(new Date(item[define.FieldName])).format("L")).toDate();
							break;
						case "time":
							let time = item[define.FieldName];
							item[define.FieldName] = moment(moment(time.length === 8 && time.includes(":") ? `1899/12/30 ${time}` : time).format("1899/12/30 HH:mm:00")).toDate();
							break;
						case "boolean":
							item[define.FieldName] = item[define.FieldName].toString();
							break;
					}
				}
			});
		});
	};

	KendoListMoverWithSearchControlViewModel.prototype.setDataSource = function(gridType)
	{
		if (this.options.serverPaging)
		{
			return;
		}
		var self = this;
		setTimeout(function()
		{
			var leftData = [];
			var rightData = [];

			self.allRecords.filter(function(item)
			{
				if (Enumerable.From(self.selectedData).Any("$.Id=='" + item.Id + "'"))
				{
					rightData.push(item);
				}
				else 
				{
					leftData.push(item);
				}
			});

			if (gridType == "left" || !gridType)
			{
				TF.fixGeometryErrorInKendo(leftData);
				self.leftSearchGrid.kendoGrid.dataSource.data(leftData);
				self.leftSearchGrid.kendoGrid.dataSource.options.data = leftData;
				self.leftSearchGrid.kendoGrid.dataSource._ranges[0].start = 0;
				self.leftSearchGrid.kendoGrid.dataSource._ranges[0].end = leftData.length;
			}
			if (gridType == "right" || !gridType)
			{
				self.selectedData.forEach(function(item, i)
				{
					var d = Enumerable.From(rightData).Where("$.Id=='" + item.Id + "'").FirstOrDefault();
					if (d)
					{
						self.selectedData[i] = d;
					}
				});

				if (self.options.filterField)
				{
					self.selectedData = TF.ListMoverForListFilterHelper.processSelectedData(self.selectedData, self.options.filterField);
					self.selectedData.sort(function(a, b) { return a.FilterItem ? a.FilterItem.localeCompare(b.FilterItem) : 0; });
				}

				if (self.options.sortRightLeftGrid)
				{
					var sortName = self.options.sort.Name;
					self.options.sortRightLeftGrid(self.selectedData, sortName);
				}
				TF.fixGeometryErrorInKendo(self.selectedData);
				self.rightSearchGrid.kendoGrid.dataSource.data(self.selectedData);
				self.rightSearchGrid.kendoGrid.dataSource.options.data = self.selectedData;
				self.rightSearchGrid.kendoGrid.dataSource.transport.data = self.selectedData;
				self.rightSearchGrid.kendoGrid.dataSource._ranges[0].start = 0;
				self.rightSearchGrid.kendoGrid.dataSource._ranges[0].end = self.selectedData.length;
			}
			self._changeLeftGridSelectable();
		});
	};

	KendoListMoverWithSearchControlViewModel.prototype.initGridOption = function(options, gridType)
	{
		var self = this;
		if (this.options.serverPaging === false)
		{
			options.kendoGridOption = {
				filterable:
				{
					extra: false,
					mode: "row"
				},
				dataSource:
				{
					pageSize: 100,
					serverPaging: false,
					serverFiltering: false,
					serverSorting: false,
					transport: null
				},
				pageable: true
			};
			var originalDataBound = options.onDataBound;
			options.onDataBound = function()
			{
				if (originalDataBound)
				{
					originalDataBound();
				}
				self._changePageInfoDisplay(gridType);
			}.bind(this);

			// options.dataSource = this.allRecords;
			// options.kendoGridOption.dataSource.data = this.allRecords;
		}
		options.routeState = "ListMover" + gridType + "KendoGrid";
	};

	KendoListMoverWithSearchControlViewModel.prototype._changePageInfoDisplay = function(gridType)
	{
		var self = this;
		if (this.options.changePage != null)
		{
			return;
		}
		setTimeout(function()
		{
			this.maxReocrdCount = !this.maxReocrdCount ? this.allRecords.length : (this.maxReocrdCount < this.allRecords.length ? this.allRecords.length : this.maxReocrdCount);
			var grid = gridType == "left" ? this.leftSearchGrid : this.rightSearchGrid;

			var $pageInfo = grid.$container.children(".k-pager-wrap").find(".pageInfo");
			var gridTotal = grid.kendoGrid.dataSource.total();
			var pageInfoText = gridTotal + " of " + this.maxReocrdCount;
			if (self.options.getSelectableRecords)
			{
				var rightSelectedItems = self.rightSearchGrid.kendoGrid.dataSource.data();
				var selectableRecords = self.options.getSelectableRecords(self.allRecords, rightSelectedItems);
				var totalSameCount = selectableRecords.length;
				var additionText = "";
				if (totalSameCount == 0)
				{
					totalSameCount = this.allRecords.length;
				}
				if (gridType == "left" && !self.options.hideTotalFromLeftGrid)
				{
					gridTotal = self.options.getSelectableRecords(self._getFilterData(grid.kendoGrid.dataSource), rightSelectedItems).length;
					additionText = " (" + this.allRecords.length + " Total)";
				}
				pageInfoText = gridTotal + " of " + totalSameCount + additionText;
			}
			$pageInfo.html(pageInfoText);
		}.bind(this));
	};

	KendoListMoverWithSearchControlViewModel.prototype.onBeforeLeftGridDataBound = function(leftSearchGrid)
	{

	};

	// KendoListMoverWithSearchControlViewModel.prototype.initGridScrollBar = function(container)
	// {
	// 	var $gridContent = container.find(".k-grid-content");
	// 	$gridContent.css(
	// 	{
	// 		"overflow-y": "auto"
	// 	});
	// };

	KendoListMoverWithSearchControlViewModel.prototype.onLeftDBClick = function(e, rowData)
	{
		if (rowData)
		{
			var selectable = true;
			if (this.options.getSelectableRecords)
			{
				selectable = this.options.getSelectableRecords([rowData], this.selectedData).length > 0;
			}
			if (selectable)
			{
				this._obLeftSelData([rowData]);
				this._moveItem();
			}
		}
	};

	KendoListMoverWithSearchControlViewModel.prototype.setLeftGridRequestURL = function(url)
	{
		if (this.options.dataSource)
		{
			return pathCombine(tf.api.apiPrefixWithoutDatabase(), this.options.dataSource, "search", tf.dataTypeHelper.getEndpoint(this.options.type));
		}
		return url;
	};

	KendoListMoverWithSearchControlViewModel.prototype.setLeftRequestOption = function(requestOptions)
	{
		// delete requestOptions.paramData.take;
		// delete requestOptions.paramData.skip;

		var excludeIds = this.obSelectedData ? this.obSelectedData() : [];
		if (this.options && this.options.gridOptions && this.options.gridOptions.excludeIds && this.options.gridOptions.excludeIds.length > 0)
		{
			excludeIds = excludeIds.concat(this.options.gridOptions.excludeIds);
		}
		excludeIds = excludeIds.map(function(item)
		{
			if ($.isNumeric(item))
			{
				return item;
			}
			return item.Id;
		});

		requestOptions.data.idFilter = {
			ExcludeAny: excludeIds
		};

		if (this.options && this.options.gridOptions && this.options.gridOptions.filter && !this.obShowEnabledCopmuter())
		{
			requestOptions.data.filterSet = requestOptions.data.filterSet ||
			{
				FilterItems: [],
				FilterSets: [],
				LogicalOperator: "and"
			};
			if ($.isArray(this.options.gridOptions.filter))
			{
				this.options.gridOptions.filter.forEach(function(f)
				{
					requestOptions.data.filterSet.FilterItems.push(f);
				});
			}
			else
			{
				requestOptions.data.filterSet.FilterItems.push(this.options.gridOptions.filter);
			}
		}

		if(this.options && this.options.additionalFilterItems && this.options.additionalFilterItems.length > 0 && requestOptions && requestOptions.data)
		{
			requestOptions.data.filterSet = requestOptions.data.filterSet || {};
			requestOptions.data.filterSet.FilterItems = requestOptions.data.filterSet.FilterItems || [];
			requestOptions.data.filterSet.LogicalOperator = requestOptions.data.filterSet.LogicalOperator || "and";

			switch(this.options.GridType)
			{
				case "FieldTrip":
					requestOptions.data.filterSet.FilterItems.splice(0, 0, ...this.options.additionalFilterItems);
					break;
				default:
					break;
			}
		}

		if (this.options && this.options.filterSetField && this.obShowEnabledCopmuter())
		{
			requestOptions.data.filterSet = requestOptions.data.filterSet ||
			{
				FilterItems: [],
				FilterSets: [],
				LogicalOperator: "and"
			};
			if (this.options.filterSetField === "InProgress")
			{
				requestOptions.data.filterSet.FilterItems.push(
					{ "FieldName": "InProgress", "Operator": "EqualTo", "Value": "true", "TypeHint": "Bit" });
			}
			else
			{
				requestOptions.data.filterSet.FilterItems.push(
					{
						"FieldName": this.options.filterSetField,
						"Operator": "EqualTo",
						"Value": true
					});
			}
		}
		if (this.getFields)
		{
			requestOptions.data.fields = this.getFields();
		}

		if (this.options && this.options.setRequestOption)
		{
			requestOptions = this.options.setRequestOption(requestOptions);
		}

		this.resolveSortItems && this.resolveSortItems(requestOptions);
		return requestOptions;
	};

	// serverPaging means use skip and take param when call api.
	// API now has a bug: it should sort before use skip and take.
	// So here we ensure there is a sort item when use skip and take.
	// Once API fixes the bug, this method can be removed.
	KendoListMoverWithSearchControlViewModel.prototype.resolveSortItems = function(requestOptions)
	{
		if (this.options.serverPaging)
		{
			var sortItems = requestOptions.data.sortItems || [];

			if (!sortItems.length)
			{
				var fields = this.columnSources[this.options.type];
				sortItems.push({ Name: fields[0].FieldName, Direction: "Ascending", isAscending: true });
				requestOptions.data.sortItems = sortItems;
			}
		}
	};

	KendoListMoverWithSearchControlViewModel.prototype.leftKendoGridOption = {
		filterable:
		{
			extra: false,
			mode: "row"
		},
		dataSource:
		{
			pageSize: 100
		},
		// selectable: "row",
		pageable: true
	};

	KendoListMoverWithSearchControlViewModel.prototype.initRightGrid = function()
	{
		tf.loadingIndicator.show();

		var options = {
			gridDefinition:
			{
				Columns: this.columns
			},
			isBigGrid: true,
			kendoGridOption: this.rightKendoGridOption(),
			showOmittedCount: false,
			showSelectedCount: true,
			setRequestOption: this.setRightRequestOption.bind(this),
			gridType: this.options.type,
			isSmallGrid: true,
			url: this.options.getUrl(this.options.type, this.options),
			showBulkMenu: this.options.showBulkMenu,
			showLockedColumn: this.options.showLockedColumn,
			height: this.options.height,
			sort: this.options.sort,
			columnReorder: function(e)
			{
				var availableGrid = $(".availablecolumngrid-container").data("kendoGrid");
				availableGrid.reorderColumn(e.newIndex, availableGrid.columns[e.oldIndex]);
			},
			onDataBound: function()
			{
				this.onRightDataBound(this.rightSearchGrid);
				this.obRightCount(this.rightSearchGrid.kendoGrid.dataSource._total);
				this._updateContentTableWidth(this.rightSearchGrid);
				tf.loadingIndicator.tryHide();
			}.bind(this)
		};

		this.initGridOption(options, "right");
		this.rightSearchGrid = new TF.Grid.LightKendoGrid(this.selectedColGridContainer, options);
		this.rightSearchGrid.getKendoColumn = this._getRightColumns;
		this.rightSearchGrid.onRowsChangeCheck.subscribe(this.onRightGridChangeCheck.bind(this));
		this.rightSearchGrid.onRowsChanged.subscribe(this.onRightGridChange.bind(this));
		this.rightSearchGrid.onDoubleClick.subscribe(this.onRightDBClick.bind(this));

		this.rightSearchGrid.$container.on("click", function(e)
		{
			tf.shortCutKeys.changeHashKey(options.routeState);
			e.stopPropagation();
			e.preventDefault();
		});

		// this._cancelKendoGridSelectedArea(this.rightSearchGrid.kendoGrid);
	};

	KendoListMoverWithSearchControlViewModel.prototype.onLeftDataBound = function()
	{
		this._changeSelectableRowOnLeftGrid();
	};

	KendoListMoverWithSearchControlViewModel.prototype._changeSelectableRowOnLeftGrid = function()
	{
		var self = this;
		if (!this.options.getSelectableRecords)
		{
			return;
		}
		self.leftSearchGrid.$container.find(".k-grid-content tr").map(function(idx, row)
		{
			var $row = $(row);
			var selectable = self.options.getSelectableRecords([self.leftSearchGrid.kendoGrid.dataItem($row)], self.selectedData).length > 0;
			if (!selectable)
			{
				$row.addClass("disSelectable");
				$row.css("color", "lightgray");
			}
		});
		// make all right disable when not same
		var allLeftData = self._getFilterData(self.leftSearchGrid.kendoGrid.dataSource);
		var selectedDataCount = self.selectedData.length;
		var compare = [];
		if (selectedDataCount > 0)
		{
			compare = self.selectedData;
		} else
		{
			compare = [allLeftData[0]];
		}
		var leftSameCount = self.options.getSelectableRecords(allLeftData, compare).length;

		if ((leftSameCount != allLeftData.length && selectedDataCount == 0)
			|| (selectedDataCount > 0 && leftSameCount == 0))
		{
			self.obLeftCount(0);
		}
	};

	KendoListMoverWithSearchControlViewModel.prototype.onRightDataBound = function(rightSearchGrid)
	{
		var self = this;
		if (this.allRecords && this.allRecords.length)
		{
			rightSearchGrid.$container.find(".k-grid-content tr").map(function(idx, row)
			{
				var $row = $(row);
				var dataItem = rightSearchGrid.kendoGrid.dataItem(row);
				if (!Enumerable.From(self.allRecords).Any("$.Id=='" + dataItem.Id + "'"))
				{
					$row.addClass("disable").css("color", "grey");
				}
			});
		}
	};

	KendoListMoverWithSearchControlViewModel.prototype.onRightDBClick = function(e, rowData)
	{
		if (rowData)
		{
			this._obRightSelData([rowData]);
			this._moveItem();
		}
	};

	KendoListMoverWithSearchControlViewModel.prototype.setRightRequestOption = function(requestOptions)
	{
		if (!this.options.serverPaging)
		{
			delete requestOptions.paramData.take;
			delete requestOptions.paramData.skip;
		}

		requestOptions.data.idFilter = { IncludeOnly: this.obSelectedData() };
		if (this.getFields)
		{
			requestOptions.data.fields = this.getFields();
		}

		this.resolveSortItems(requestOptions);
		return requestOptions;
	};

	KendoListMoverWithSearchControlViewModel.prototype.rightKendoGridOption = function()
	{
		return {
			filterable: false,
			dataSource:
			{
				pageSize: 100,
				serverPaging: this.options.serverPaging,
				serverFiltering: false,
				serverSorting: false
			},
			pageable: true
		};
	};

	KendoListMoverWithSearchControlViewModel.prototype._getLeftColumns = function()
	{
		var self = this;
		var currentColumns = this._gridDefinition.Columns;
		var columns = currentColumns.map(function(definition)
		{
			var column = definition;
			column.field = definition.FieldName;
			column.title = definition.DisplayName;
			column.width = definition.Width || KendoListMoverWithSearchControlViewModel.defaults.columnWidth;
			column.hidden = definition.hidden; // Overwrite the value of hidden attribute which setting in api.
			// column.filterable = {
			// 	cell:
			// 	{
			// 		showOperators: false,
			// 		operator: "contains"
			// 	}
			// };
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

	KendoListMoverWithSearchControlViewModel.prototype._getRightColumns = function()
	{
		var self = this;
		var currentColumns = this._gridDefinition.Columns.map(x => $.extend({}, x));
		var columns = currentColumns.map(function(definition)
		{
			var column = definition;
			column.field = definition.FieldName;
			column.title = definition.DisplayName;
			column.width = definition.Width || KendoListMoverWithSearchControlViewModel.defaults.columnWidth;
			column.hidden = definition.hidden;
			self.setColumnFilterableCell(column, definition, "listmover");
			column.filterable = false;
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

	KendoListMoverWithSearchControlViewModel.prototype.bindSearchGridDraggable = function(searchGrid, autoScroll)
	{
		var option = {
			filter: ".k-grid-content tbody > tr:not(.disSelectable)",
			threshold: 100,
			autoScroll: autoScroll,
			holdToDrag: TF.isMobileDevice,
			cursorOffset: { top: -10, left: -10 },
			hint: function(e)
			{
				if (e.hasClass("k-state-selected"))
				{
					var selectedColumns = searchGrid.$container.find("tr.k-state-selected");
					return this._getHintElements(e, selectedColumns);
				}
				return this._getHintElements(e);
			}.bind(this),
			dragstart: function(e)
			{
				if (e.currentTarget.hasClass("disable"))
				{
					e.preventDefault();
				}
			},
			dragend: function()
			{
				$(".list-mover-drag-hint").hide();
			}.bind(this)
		};
		searchGrid.$container.kendoDraggable(option);
	};

	KendoListMoverWithSearchControlViewModel.prototype.bindLeftGridDropTarget = function()
	{
		var self = this;

		this.leftSearchGrid.$container.kendoDropTarget(
			{
				drop: function(e)
				{
					if (!self._isDragItem(e))
						return;

					e.draggable.hint.hide();
					if (!e.draggable.element.hasClass("availablecolumngrid-container"))
					{
						if (!e.draggable.currentTarget.hasClass("k-state-selected"))
						{
							var selectedUid = e.draggable.currentTarget.data().kendoUid;
							var selectedItem = this.rightSearchGrid.kendoGrid.dataItems().filter(function(dataItem)
							{
								return dataItem.uid === selectedUid;
							});
							this._obRightSelData(selectedItem);
						}

						if (this._obRightSelData())
						{
							this._obLeftSelData([]);
							this._moveItem();
						}
					}
				}.bind(this)
			});
	};

	KendoListMoverWithSearchControlViewModel.prototype.bindRightGridDropTarget = function()
	{
		var self = this;
		this.rightSearchGrid.$container.kendoDropTarget(
			{
				dragenter: function(e)
				{
					if (self.options.disableDropIndicator)
					{
						return;
					}
					if (!self._isDragItem(e))
						return;

					var selectedColItems = this.rightSearchGrid.$container.find("tr");
					var targetItem;
					var insertBeforeTarget;
					if (e.draggable.hint.offset().top < $(".selectedcolumngrid-container .k-grid-content").offset().top)
					{
						targetItem = $(selectedColItems[1]);
						targetItem.addClass("drag-target-insert-before-cursor"); // modify dropTarget element
						insertBeforeTarget = true;
					}
					else
					{
						targetItem = $(selectedColItems[selectedColItems.length - 1]);
						targetItem.addClass("drag-target-insert-after-cursor");
					}

					this._appendDropTargetCursorTriangle(targetItem, insertBeforeTarget);
				}.bind(this),
				dragleave: function()
				{
					this.clearSelectCursor();
					this._removeDropTargetCursorTriangle();
				}.bind(this),
				drop: this._selectedDrop.bind(this)
			});
	};

	KendoListMoverWithSearchControlViewModel.prototype.toAllRightClick = function()
	{
		var p, self = this;

		self.isChanged = true;

		if (self.options.serverPaging)
		{
			p = self.leftSearchGrid.getIdsWithCurrentFiltering().then(function(data)
			{
				return data.map(function(id)
				{
					return { Id: id };
				});
			});
		}
		else
		{
			var datasource = self.leftSearchGrid.kendoGrid.dataSource;
			p = Promise.resolve(self._getFilterData(datasource));
		}
		p.then(function(data)
		{
			data = self.filterToRightData(data);
			if (self.options.getSelectableRecords)
			{
				data = self.options.getSelectableRecords(data, self.selectedData.length > 0 ? self.selectedData : [data[0]]);
			}
			self._obLeftSelData(data);
			self._obRightSelData([]);
			self._moveItem(false);
		});
	};

	KendoListMoverWithSearchControlViewModel.prototype._getFilterData = function(datasource)
	{
		return (new kendo.data.Query(datasource.data()).filter(datasource.filter())).data;
	};

	KendoListMoverWithSearchControlViewModel.prototype.filterToRightData = function(data)
	{
		return data;
	};

	KendoListMoverWithSearchControlViewModel.prototype.toRightClick = function()
	{
		this._moveItem(true);
	};

	KendoListMoverWithSearchControlViewModel.prototype.toLeftClick = function()
	{
		this._moveItem(true);
	};

	KendoListMoverWithSearchControlViewModel.prototype.toAllLeftClick = function()
	{
		this.isChanged = true;

		if (!this.options.serverPaging)
		{
			this._obRightSelData(this.rightSearchGrid.kendoGrid.dataSource.data());
			this._obLeftSelData([]);
			this._moveItem(false);
		}
		else
		{
			this._obRightSelData([]);
			this._obLeftSelData([]);
			this.obSelectedData([]);
			this.selectedData = [];
			this.leftSearchGrid.triggerRefreshClick();
			this.rightSearchGrid.rebuildGrid();
			this._clearLeftSelection();
			this._clearRightSelection();
			this.careteKendoDropTargetEvent();
		}
	};

	KendoListMoverWithSearchControlViewModel.prototype._moveItem = function(enableSelected)
	{
		this.isChanged = true;

		// If the grid is reading data from server(virtual scroll), get the ids from grid. Because there are only 100 items in the grid's datasource.
		if (this.obLeftGridSelected())
		{
			var leftSelectedIds = this.leftSearchGrid.getSelectedIds();
			if (leftSelectedIds.length > 0 && enableSelected)
			{
				if (this.options.serverPaging)
				{
					this.selectedData = Array.extend(this.selectedData, leftSelectedIds);
				}
				else
				{
					var data = this.filterToRightData(this.leftSearchGrid.kendoGrid.dataSource.data());
					data = data.filter(function(item)
					{
						return Enumerable.From(leftSelectedIds).Any(function(c)
						{
							return c == item.Id;
						});
					})
					this._obLeftSelData(data);
					this.selectedData = Array.extend(this.selectedData, this._obLeftSelData());
				}
			}
			else
			{
				if (this.options.serverPaging)
				{
					this.selectedData = Array.extend(this.selectedData, leftSelectedIds.length > 0 ? leftSelectedIds : Enumerable.From(this._obLeftSelData()).Select("$.Id").ToArray());
				}
				else
				{
					this.selectedData = Array.extend(this.selectedData, this._obLeftSelData());
				}
			}
		}
		if (this.obRightGridSelected())
		{
			var rightSelectedIds = this.rightSearchGrid.getSelectedIds();
			if (rightSelectedIds.length > 0 && enableSelected)
			{
				this._obRightSelData(this.rightSearchGrid.kendoGrid.dataSource.data().filter(function(item)
				{
					return Enumerable.From(rightSelectedIds).Any(function(c)
					{
						return c == item.Id;
					});
				}));
			}
			else
			{
				if (this.options.serverPaging)
				{
					rightSelectedIds = rightSelectedIds.length > 0 ? rightSelectedIds : Enumerable.From(this._obRightSelData()).Select("$.Id").ToArray();
				}
			}
			this.selectedData = this.selectedData.filter(function(rightData)
			{
				var filter = true;
				if (this.options.serverPaging)
				{
					rightSelectedIds.forEach(function(data)
					{
						if (rightData === data)
						{
							filter = false;
							return;
						}
					});
				}
				else
				{
					this._obRightSelData().forEach(function(data)
					{
						if (rightData.Id === data.Id)
						{
							filter = false;
							return;
						}
					});
				}
				return filter;
			}.bind(this));
		}

		if (this.options.serverPaging)
		{
			this.obSelectedData(this.selectedData);
			this.leftSearchGrid.triggerRefreshClick();
			this.rightSearchGrid.rebuildGrid();
		}
		else
		{
			this.obSelectedData(Enumerable.From(this.selectedData).Select("$.Id").ToArray());
			this.setDataSource();
		}

		this._clearLeftSelection();
		this._clearRightSelection();

		this.careteKendoDropTargetEvent();
	};

	KendoListMoverWithSearchControlViewModel.prototype.getSelectedDataByIds = function(selectedData)
	{
		var self = this,
			url = self.leftSearchGrid.getApiRequestURL(self.leftSearchGrid.options.url);
		return tf.promiseAjax.post(pathCombine(url),
			{
				data: {
					sortItems: self.leftSearchGrid.searchOption.data.sortItems,
					fields: self.leftSearchGrid.searchOption.data.fields,
					filterClause: '',
					filterSet: null,
					idFilter: {
						ExcludeAny: [],
						IncludeOnly: selectedData || null,
					}
				}
			})
			.then(function(apiResponse)
			{
				return apiResponse.Items;
			});
	}

	KendoListMoverWithSearchControlViewModel.prototype.apply = function()
	{
		var self = this;
		var firstFieldName = self.columns[0].FieldName;
		this.saveCurrentSelectedColumns(self.options.type, self.columns);
		let p = Promise.resolve(self.selectedData);

		if (self.options.serverPaging && !self.options.onlyReturnId)
		{
			p = self.getSelectedDataByIds(self.selectedData);
		}

		return p.then(function(result)
		{
			self.selectedData = result;
			self.selectedData = self.selectedData.sort(function(a, b)
			{
				if (typeof a[firstFieldName] === "string")
				{
					return a[firstFieldName].toUpperCase() > (b[firstFieldName] || "").toUpperCase();
				}
				return 0;
			});
			return self.selectedData;
		})

	};

	KendoListMoverWithSearchControlViewModel.prototype.cancel = function() { };

	KendoListMoverWithSearchControlViewModel.prototype.clearSelectCursor = function()
	{
		var selectedColItems = this.rightSearchGrid.$container.find("tr");
		selectedColItems.removeClass("drag-target-insert-before-cursor");
		selectedColItems.removeClass("drag-target-insert-after-cursor");
	};

	KendoListMoverWithSearchControlViewModel.prototype._selectedDrop = function(e)
	{
		var self = this;
		if (!self._isDragItem(e))
			return;

		this.clearSelectCursor();
		e.draggable.hint.hide();
		if (e.draggable.currentTarget.hasClass("k-state-selected"))
		{
			if (!this.obLeftGridSelected() &&
				!this.obRightGridSelected())
			{
				this.rightSearchGrid.kendoGrid.clearSelection();
				return;
			}

			if (this.obLeftGridSelected())
			{
				this._moveItem();
			}
		}
		else
		{
			var selectedUid = e.draggable.currentTarget.data().kendoUid;

			if (e.draggable.element.hasClass("availablecolumngrid-container"))
			{
				var selectedItem = this.leftSearchGrid.kendoGrid.dataItems().filter(function(dataItem)
				{
					return dataItem.uid === selectedUid;
				});
				selectedItem = Enumerable.From(selectedItem).Distinct(function(c) { return c.uid; }).ToArray();
				this._obLeftSelData(selectedItem);
				this._obRightSelData([]);
				this._moveItem();
			}
		}

		this._removeDropTargetCursorTriangle();
	};

	KendoListMoverWithSearchControlViewModel.prototype._removeDropTargetCursorTriangle = function()
	{
		$("#left-triangle").remove();
		$("#right-triangle").remove();
	};

	KendoListMoverWithSearchControlViewModel.prototype._appendDropTargetCursorTriangle = function(targetItem, insertBeforeTarget)
	{
		var leftTriangle = $("<div id='left-triangle'></div>").addClass("drag-target-cursor-left-triangle");
		var rightTriangle = $("<div id='right-triangle'></div>").addClass("drag-target-cursor-right-triangle");

		leftTriangle.css("left", -1 + "px");
		rightTriangle.css("left", targetItem.width() - 14 + "px");

		if (insertBeforeTarget)
		{
			leftTriangle.css("top", "-6px");
			rightTriangle.css("top", "-6px");
		}

		targetItem.find("td:first").append(leftTriangle);
		targetItem.find("td:visible:last").append(rightTriangle);
	};

	KendoListMoverWithSearchControlViewModel.prototype._getHintElements = function(item, selectedColumns)
	{
		var hintElements = $("<div class='k-grid k-widget list-mover-drag-hint' style=''><table style='width:100%'><tbody></tbody></table></div>"),
			maxWidth = this.rightSearchGrid.kendoGrid.element.width(), tooLong = false;
		hintElements.css(
			{
				"background-color": "#FFFFCE",
				"opacity": 0.8,
				"cursor": "move",
				"overflow": "hidden"
			});
		if (selectedColumns === undefined)
		{
			tooLong = $(item).width() > maxWidth;
			hintElements.width(tooLong ? maxWidth : $(item).width());
			hintElements.find("tbody").append("<tr>" + (tooLong ? $(item.html())[0].outerHTML : item.html()) + "</tr>");
		}
		else
		{
			for (var i = 0; i < selectedColumns.length; i++)
			{
				if (selectedColumns[i].tagName === "SPAN") continue;
				tooLong = $(selectedColumns[i]).width() > maxWidth;
				hintElements.width(tooLong ? maxWidth : $(selectedColumns[i]).width());
				hintElements.find("tbody").append("<tr>" + (tooLong ? $($(selectedColumns[i]).html())[0].outerHTML : $(selectedColumns[i]).html()) + "</tr>");
			}
		}

		return hintElements;
	};

	KendoListMoverWithSearchControlViewModel.prototype._clearLeftSelection = function()
	{
		this._obLeftSelData([]);
		if (this.leftSearchGrid != null)
		{
			this.leftSearchGrid.clearSelection();
		}
	};

	KendoListMoverWithSearchControlViewModel.prototype._clearRightSelection = function()
	{
		this._obRightSelData([]);
		this.rightSearchGrid.clearSelection();
	};

	KendoListMoverWithSearchControlViewModel.prototype._isDragItem = function(e)
	{
		var isDragItem = (!$(e.target).hasClass("k-resize-handle") &&
			!$(e.draggable.element).hasClass("k-grid-header-wrap"));
		return isDragItem;
	};

	KendoListMoverWithSearchControlViewModel.prototype._changeLeftGridSelectable = function()
	{
		var self = this;
		if (self.options.getSelectableRecords)
		{
			var kendoOptions = self.leftSearchGrid.kendoGrid.getOptions();
			var newSelectable = "multiple";
			if (self.selectedData.length == 0)
			{
				newSelectable = "row";
			}
			if (newSelectable != kendoOptions.selectable)
			{
				self.leftSearchGrid.kendoGrid.options.selectable = newSelectable;
				self.leftSearchGrid.kendoGrid._selectable();
			}
		}
	};

	KendoListMoverWithSearchControlViewModel.prototype.columnSources = {};

	KendoListMoverWithSearchControlViewModel.prototype.afterInit = function() { };

	KendoListMoverWithSearchControlViewModel.prototype.dispose = function()
	{
		// this.leftSearchGrid.destroy();
		// this.rightSearchGrid.destroy();
		// this.leftSearchGrid = null;
		// this.rightSearchGrid = null;
		tf.shortCutKeys.resetUsingGolbal(2);
		tf.shortCutKeys.clearSpecialHashMap();
		PubSub.unsubscribe(topicCombine(pb.DATA_CHANGE, "listmover"));
	};
})();

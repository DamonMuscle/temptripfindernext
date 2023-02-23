(function()
{
	createNamespace("TF.Grid").LayoutHelper = LayoutHelper;

	const LAYOUT_COLUMN_COMPARE_LIST = ["SortIndex", "SortAscending", "AggregationOperator"];
	const PREVIOUS_GENDER_NAME = 'Sex';
	const CURRENT_GENDER_NAME = 'Gender';

	function LayoutHelper()
	{ }
	LayoutHelper.compareLayoutColumns = function functionName(leftColumns, rightColumns)
	{
		return leftColumns.length === rightColumns.length
			&& leftColumns.every((leftCol, idx) =>
			{
				const rightCol = rightColumns[idx];

				return LAYOUT_COLUMN_COMPARE_LIST.every(field => fuzzyCompare(leftCol[field], rightCol[field]))
					&& leftCol['FieldName'] === rightCol['FieldName'];
			});
	};

	/**
	 * Find grid layouts by certain criterias.
	 *
	 * @param {Object} options
	 * @returns
	 */
	LayoutHelper.findGridLayouts = function(options)
	{
		const paramData = {};
		const filterList = [];
		const showOverlay = options.hasOwnProperty("showOverlay") ? options.showOverlay : true;

		if (options.dataType)
		{
			const dataTypeId = tf.dataTypeHelper.getId(options.dataType);
			filterList.push(`eq(DataTypeID,${dataTypeId})`);
		}

		if (options.UDGridId)
		{
			filterList.push(`eq(UDGridId,${options.UDGridId})`);
		}

		if (options.layoutId)
		{
			filterList.push(`eq(ID,${options.layoutId})`);
		}

		if (filterList.length > 0)
		{
			paramData["@filter"] = filterList.join("&");
		}

		if (options.relationships)
		{
			paramData["@relationships"] = options.relationships;
		}

		if (options.fields)
		{
			paramData["@fields"] = options.fields;
		}

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridlayouts"),
			{
				paramData: paramData
			},
			{
				overlay: showOverlay
			})
			.then(res => res && res.Items);
	};

	createNamespace("TF.Grid").KendoGridLayoutMenu = KendoGridLayoutMenu;

	function KendoGridLayoutMenu()
	{
		this.setStorageLayoutDataKey();
		this._obCurrentGridLayoutExtendedDataModel = ko.observable(null);
		this.subscriptions.push(this._obCurrentGridLayoutExtendedDataModel.subscribe(this._currentLayoutChange, this));

		this.obGridLayoutExtendedDataModels = ko.observableArray();
		this.obGridLayoutExtendedDataModels.subscribe(val =>
		{
			const selectedLayout = this._obCurrentGridLayoutExtendedDataModel();
			if (selectedLayout && selectedLayout.id() && val.every(o => o.id() !== selectedLayout.id()))
			{
				this._resetLayout();
			}
		});

		this.obSelectedGridLayoutName = ko.computed(this._selectedGridLayoutNameComputer, this);
		this.obSelectedGridLayoutModified = ko.computed(this._selectedGridLayoutModifiedComputer, this);
		this.obCurrentLayoutStatus = ko.computed(() =>
		{
			return this.obSelectedGridLayoutModified() ? "(modified)" : "";
		});

		this.obContextMenuDisplayGridLayoutExtendedDataModels = ko.computed(function()
		{
			var result = this.obGridLayoutExtendedDataModels();

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
		this.manageLayoutClick = this.manageLayoutClick.bind(this);
		this.saveAndEditLayout = this.saveAndEditLayout.bind(this);
		this.saveAsNewLayoutClick = this.saveAsNewLayoutClick.bind(this);
	}

	KendoGridLayoutMenu.prototype.setStorageLayoutDataKey = function()
	{
		this._storageLayoutDataKey = "grid.currentlayout." + ((this.options.kendoGridOption && this.options.kendoGridOption.entityType) ? this.options.kendoGridOption.entityType + "." : "")
			+ this.getStorageKeyId() + ".id";
	};

	KendoGridLayoutMenu.prototype.getStorageKeyId = function()
	{
		return this.pageType || this._gridType;
	};

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
		this._setgridStateTwoRowWhenOverflow();
		if (this._obCurrentGridLayoutExtendedDataModel())
		{
			return this._obCurrentGridLayoutExtendedDataModel().name() || "Default";
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
		const self = this;
		self._setgridStateTwoRowWhenOverflow();

		let currentLayout = self._obCurrentGridLayoutExtendedDataModel();

		// If there is not a current layout
		if (!currentLayout)
		{
			currentLayout = new TF.DataModel.GridLayoutExtendedDataModel(self._defaultGridLayoutExtendedEntity);
		}

		// Check current layout and apiIsDirty status
		if (!currentLayout)
		{
			return false;
		}

		// Check if there is a change in summary bar status
		if (Boolean(currentLayout._entityBackup.ShowSummaryBar) !== Boolean(currentLayout.showSummaryBar()))
		{
			return true;
		}

		const currentLayoutInitState = self.getCurrentLayoutInitState();

		if (!currentLayoutInitState)
		{
			return false;
		}

		// Need to compare filter name is because users could use quick filter to modify filter.
		if (!TF.Grid.LayoutHelper.compareLayoutColumns(currentLayout.layoutColumns(), currentLayoutInitState.LayoutColumns)
			|| !fuzzyCompare(currentLayout.filterId(), currentLayoutInitState.FilterId))
		{
			return true;
		}
	};

	KendoGridLayoutMenu.prototype.getCurrentLayoutInitState = function()
	{
		let currentLayoutInitState = null;
		const currentLayout = this._obCurrentGridLayoutExtendedDataModel();

		if (currentLayout && currentLayout.id() && currentLayout.id() > 0)
		{
			const item = this.obGridLayoutExtendedDataModels().find(d => d.id() === currentLayout.id());
			if (item)
			{
				currentLayoutInitState = item.toData();
			}
		}
		else
		{
			currentLayoutInitState = this._defaultGridLayoutExtendedEntity;
		}

		return currentLayoutInitState;
	};

	KendoGridLayoutMenu.prototype.getDefinitionLayoutColumns = function()
	{
		return this._gridDefinition.Columns
			.filter(c => !c.hidden)
			.map(c => ({
				FieldName: c.FieldName,
				Width: c.Width
			}));
	};

	KendoGridLayoutMenu.prototype.syncLayoutAutoExports = function(layoutId)
	{
		const self = this;
		const gridLayouts = self.obGridLayoutExtendedDataModels();
		if (!gridLayouts || !gridLayouts.length)
		{
			return Promise.resolve();
		}

		const options = {
			fields: "Id,AutoExportExists,AutoExports",
			relationships: "AutoExport"
		};
		if (layoutId)
		{
			options["layoutId"] = layoutId;
		}
		else
		{
			var typeName = self.options.gridType;
			if (self.options.kendoGridOption && self.options.kendoGridOption.entityType)
			{
				typeName = `${self.options.kendoGridOption.entityType}.${self.options.gridType}`;
			}
			var UDGridId = self.options.gridData ? self.options.gridData.value : null;
			options["UDGridId"] = UDGridId;
			options["dataType"] = typeName;
		}

		return TF.Grid.LayoutHelper.findGridLayouts(options).then(function(layouts)
		{
			const layoutsMap = {};
			layouts.forEach(r =>
			{
				layoutsMap[r.Id] = r;
			});

			gridLayouts.forEach(gl =>
			{
				const layout = layoutsMap[gl.id()];
				var isDirty = gl.apiIsDirty();
				if (layout)
				{
					gl.autoExportExists(!!layout.AutoExportExists);
					gl.autoExports(layout.AutoExports);
				}
				else if (!layoutId || gl.id() === layoutId)
				{
					gl.autoExportExists(false);
					gl.autoExports(null);
				}
				gl.apiIsDirty(isDirty);
			});

			return Promise.resolve();
		}.bind(self));
	};


	KendoGridLayoutMenu.prototype.loadLayout = function()
	{
		const self = this;
		const { gridType, loadLayout, gridLayout, kendoGridOption, gridData } = self.options;
		const allColumns = self.getDefinitionLayoutColumns();
		const defaultLayout = {
			GridType: gridType,
			Name: "",
			LayoutColumns: allColumns,
			isModified: false
		};

		self._defaultGridLayoutExtendedEntity = defaultLayout;

		// don't load any layout, use default 
		if (loadLayout === false)
		{
			self._obCurrentGridLayoutExtendedDataModel(new TF.DataModel.GridLayoutExtendedDataModel(defaultLayout));
			return Promise.resolve();
		}

		// if layout is specified in option
		if (gridLayout)
		{
			self._obCurrentGridLayoutExtendedDataModel(new TF.DataModel.GridLayoutExtendedDataModel(gridLayout));
			return Promise.resolve();
		}

		let typeName = gridType;
		if (kendoGridOption && kendoGridOption.entityType)
		{
			typeName = kendoGridOption.entityType + "." + gridType;
		}

		var UDGridId = gridData ? gridData.value : null;
		var promise = !typeName ? Promise.resolve([]) :
			TF.Grid.LayoutHelper.findGridLayouts({ dataType: typeName, showOverlay: true, UDGridId: UDGridId, relationships: "AutoExport,Filter" });

		return promise.then(function(gridLayouts)
		{
			var gridLayoutExtendedDataModels = TF.DataModel.BaseDataModel.create(TF.DataModel.GridLayoutExtendedDataModel, gridLayouts);
			self.obGridLayoutExtendedDataModels(gridLayoutExtendedDataModels);
			self._sortGridLayoutExtendedDataModels();
			self.setFilterName();
			let layout = null;

			// If the request is from search, do not use the sticky layout.
			if (self.shouldUseStickyLayout() && !self.shouldUsePredefinedLayout())
			{
				layout = self.getStickyLayout()
			}


			// If cannot find layout in sticky, use the default one
			if (!layout || layout.layoutColumns().length === 0)
			{
				const defaultCopy = JSON.parse(JSON.stringify(defaultLayout));

				if (self.shouldUsePredefinedLayout())
				{
					defaultCopy.LayoutColumns = self.options.predefinedGridData.layoutColumns;
					defaultCopy.isModified = true;
				}

				layout = new TF.DataModel.GridLayoutExtendedDataModel(defaultCopy);
			}


			// Set lock columns
			if (layout && layout.layoutColumns().length > 0)
			{
				layout.layoutColumns().forEach(function(columnInStorage)
				{
					if (columnInStorage.locked === true)
					{
						self.tobeLockedColumns.push({ field: columnInStorage.FieldName });
					}
				});
			}

			// Store in observable
			self._obCurrentGridLayoutExtendedDataModel(layout);

			return self._alertMessageWhenLayoutIsDeleted()
				.then(() => self._confirmMessageWhenLayoutFilterIsNotAvailableInCurrentDatasource());
		});
	}

	/**
	 * Find sticky layout.
	 *
	 * @return {*} 
	 */
	KendoGridLayoutMenu.prototype.getStickyLayout = function()
	{
		// Firstly, find if there is a sticky layout
		let layout = tf.storageManager.get(this.options.storageKey + (TF.isMobileDevice ? ".mobile" : ""));

		// Secondly, find if there is a sticky layout id
		if (layout)
		{
			layout = new TF.DataModel.GridLayoutExtendedDataModel(layout);
		}
		else
		{
			const selectedLayoutId = tf.storageManager.get(this._storageLayoutDataKey);
			if (selectedLayoutId)
			{
				layout = this.obGridLayoutExtendedDataModels().find(o => o.id() === selectedLayoutId);

				// use a clone to avoid affecting value in gridLayoutExtendedDataModels
				layout && (layout = layout.clone());
			}
		}

		return layout;
	};

	KendoGridLayoutMenu.prototype._isFilterUnavailable = function(gridLayout)
	{
		if (gridLayout && !gridLayout.filterId() && gridLayout.filterName())
		{
			switch (gridLayout.filterName())
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
		var gridLayoutExtendedEntity = gridLayoutExtendedEntity || self._obCurrentGridLayoutExtendedDataModel();
		if (self._isFilterUnavailable(gridLayoutExtendedEntity))
		{
			return tf.promiseBootbox.confirm({
				message: "The Filter saved with this Layout is not in the current database.  Only layout changes will be applied."
			})
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

	KendoGridLayoutMenu.prototype._alertMessageWhenLayoutIsDeleted = function(layoutId)
	{
		var message;
		if (!layoutId)
		{
			layoutId = tf.storageManager.get(this._storageLayoutDataKey);
			message = 'The applied Layout has been deleted. The system default Layout will be applied to this grid.';
		}
		else
		{
			message = 'This Layout has been deleted. It cannot be applied.';
		}

		if (layoutId && this.options.customGridType && this.options.customGridType.toLowerCase() !== "dashboardwidget")
		{
			return TF.Grid.LayoutHelper.findGridLayouts(
				{
					dataType: this.options.gridType,
					showOverlay: true
				}).then(function(layouts)
				{
					const selectedLayout = _.find(layouts, (item) => item.Id == layoutId);
					if (!selectedLayout)
					{
						return true;
					}

					return tf.promiseBootbox.alert(message, 'Warning', 40000)
						.then(function()
						{
							const gridLayouts = this.obGridLayoutExtendedDataModels();
							for (var i = 0; i < gridLayouts.length; i++)
							{
								if (gridLayouts[i].id() === layoutId)
								{
									this.obGridLayoutExtendedDataModels.remove(gridLayouts[i]);
									break;
								}
							}

							return false;
						}.bind(this));
				}.bind(this));
		}

		return Promise.resolve(true);
	};

	KendoGridLayoutMenu.prototype._setGridColumnConfiguration = function(showAllColumns, invisible2VisibleUDFs)
	{
		const self = this;
		const currentLayout = self._obCurrentGridLayoutExtendedDataModel();

		if (!currentLayout) { return; }

		var visibleColumns = [],
			hiddenColumns = [],
			orderColumns = [],
			layoutColumns = currentLayout.layoutColumns() || [],
			invisible2VisibleUDFs = invisible2VisibleUDFs || [],
			allAvailableColumns = this._gridDefinition.Columns,
			/**
			 * Once user modify the layout, invisible udf columns will be discarded.
			 * It means that all invisible udf columns were shown together at a specific previous point.
			 */
			invisibleUDFColumns = self.getInvisibleUDFColumnsForCurrentLayout();

		//If show all columns
		if (showAllColumns)
		{
			orderColumns = allAvailableColumns;
		}
		else
		{
			if (typeof layoutColumns === 'string')
			{
				layoutColumns = JSON.parse(layoutColumns);
			}

			layoutColumns = layoutColumns.filter(function(c)
			{
				return !invisibleUDFColumns.some(function(i)
				{
					return i.UDFId === c.UDFId;
				});
			});

			invisibleUDFColumns.sort(function(a, b)
			{
				return a.index - b.index;
			}).forEach(function(item)
			{
				layoutColumns.splice(item.index, 0, item);
			});

			invisibleUDFColumns = self.handleInvisibleUDFColumns(layoutColumns).map(function(i)
			{
				return {
					UDFId: i.UDFId,
					index: _.findIndex(layoutColumns, function(u)
					{
						return u.UDFId === i.UDFId;
					})
				};
			});

			self._obSelectedInvisibleColumns(invisibleUDFColumns);

			layoutColumns = self.handleUDFColumns(layoutColumns);
			layoutColumnDict = _.keyBy(layoutColumns, col => col.FieldName);

			allAvailableColumns.forEach(col =>
			{
				// forward compatibility: support 'Sex' field
				if (col.FieldName === PREVIOUS_GENDER_NAME)
				{
					col.FieldName = CURRENT_GENDER_NAME;
				}

				const layoutColumn = layoutColumnDict[col.FieldName];
				if (layoutColumn)
				{
					if (layoutColumn.Width)
					{
						col.Width = layoutColumn.Width;
						//When displaying data, assign Width to width, which is used for page display
						col.width = layoutColumn.Width;
					}

					if (layoutColumn.locked)
					{
						col.locked = layoutColumn.locked;
					}

					col.hidden = false;
					visibleColumns.push(col);
				}
				else
				{
					col.hidden = true;
					hiddenColumns.push(col);
				}
			});


			for (var i = 0, len = layoutColumns.length; i < len; i++)
			{
				var udfId = layoutColumns[i].UDFId;
				if (udfId)
				{
					orderColumns = orderColumns.concat(visibleColumns.filter((c) => c.UDFId == udfId));
				}
				else
				{
					var fieldName = layoutColumns[i].FieldName;
					var layoutColumn = visibleColumns.find((c) => c.FieldName == fieldName);
					if (layoutColumn)
					{
						orderColumns.push(layoutColumn);
					}
				}
			}
		}


		orderColumns = orderColumns.filter((column) => !column.ParentField);

		var allChildColumns = allAvailableColumns.filter((column) => column.ParentField);
		if (allChildColumns.length > 0)
		{
			$.each(allChildColumns, function(i, childColumn)
			{
				var parentColumn = orderColumns.filter((column) => column.FieldName === childColumn.ParentField);

				if (parentColumn && parentColumn.length > 0)
				{
					orderColumns.splice(orderColumns.indexOf(parentColumn[0]) + 1, 0, childColumn);
				}
			});
		}

		var sortedItems = layoutColumns
			.filter((c) => c.SortIndex != null)
			.map((c) =>
			{
				var fieldName = tf.UDFDefinition.getOriginalName(c.FieldName);
				return new TF.Grid.SortItem(fieldName, c.SortAscending)
			});

		// Sort items need to be before selected columns.
		if (this._obSortedItems().length > 0 || sortedItems.length > 0)
		{
			this._obSortedItems(sortedItems);
		}

		this._obSelectedColumns(orderColumns);
		this._availableColumns = hiddenColumns;

		this.obSummaryGridVisible(currentLayout.showSummaryBar());

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

	KendoGridLayoutMenu.prototype.invisibleUDFColumnsStorageKey = function()
	{
		var self = this,
			id = self._obCurrentGridLayoutExtendedDataModel() && self._obCurrentGridLayoutExtendedDataModel().id();

		if (!id)
		{
			return String.format("grid.invisible.udfs.{0}", self.options.gridType);
		}

		return String.format("grid.invisible.udfs.{0}.{1}", self.options.gridType, id);
	}

	KendoGridLayoutMenu.prototype._invisibleUDFColumnsChange = function()
	{
		tf.storageManager.save(this.invisibleUDFColumnsStorageKey(), this._obSelectedInvisibleColumns(), null, null, false);
	};

	KendoGridLayoutMenu.prototype._clearInvisibleUDFColumns = function()
	{
		tf.storageManager.save(this.invisibleUDFColumnsStorageKey(), "", null, null, false);
	};

	KendoGridLayoutMenu.prototype.getInvisibleUDFColumnsForCurrentLayout = function()
	{
		return tf.storageManager.get(this.invisibleUDFColumnsStorageKey()) || [];
	};

	KendoGridLayoutMenu.prototype._updateCurrentLayout = function()
	{
		if (this._applyingLayout)
		{
			return;
		}

		let isLayoutUpdated = false;
		var selectedColumns = this._obSelectedColumns();
		var sortItemList = this._obSortedItems();
		var aggregationMap = this.obAggregationMap();
		var currentLayout = this._obCurrentGridLayoutExtendedDataModel();

		const sortItemDict = new Map();

		sortItemList.forEach((item, index) => sortItemDict.set(item.Name, index));

		const newLayoutColumns = selectedColumns.map(col =>
		{
			var fieldName = tf.UDFDefinition.getOriginalName(col.FieldName);
			const layoutColumn = {
				FieldName: fieldName,
				Width: col.width
			};

			if (col.UDFId)
			{
				layoutColumn.UDFId = col.UDFId;
				delete layoutColumn.FieldName;
			}

			if (col.locked)
			{
				layoutColumn.locked = true;
			}

			if (sortItemDict.has(fieldName))
			{
				const sortIndex = sortItemDict.get(fieldName);
				const sortItem = sortItemList[sortIndex]
				layoutColumn.SortIndex = sortIndex;
				layoutColumn.SortAscending = sortItem.isAscending();
			}

			var aggregationOperator = aggregationMap[fieldName];
			if (aggregationOperator)
			{
				layoutColumn.AggregationOperator = aggregationOperator;
			}

			return layoutColumn;
		});

		var oldString = JSON.stringify(currentLayout.layoutColumns());
		var newString = JSON.stringify(newLayoutColumns);
		if (oldString != newString)
		{
			currentLayout.layoutColumns(newLayoutColumns);
			isLayoutUpdated = true;
		}

		const summaryVisibleState = this.obSummaryGridVisible();
		if (currentLayout.showSummaryBar() !== summaryVisibleState)
		{
			currentLayout.showSummaryBar(summaryVisibleState);
			isLayoutUpdated = true;
		}

		if (isLayoutUpdated)
		{
			this._currentLayoutChange();
		}
	};

	KendoGridLayoutMenu.prototype._currentLayoutChange = function()
	{
		const self = this;
		if (self.options.loadLayout === false)
		{
			return;
		}

		// If the request from search, do not sticky the layout.
		const shouldUseStickyLayout = self.shouldUseStickyLayout();
		const isDashboardWidget = self.options.customGridType && self.options.customGridType.toLowerCase() == "dashboardwidget";
		const shouldUsePredefinedLayout = this.shouldUsePredefinedLayout();

		if (!shouldUseStickyLayout || isDashboardWidget || shouldUsePredefinedLayout)
		{
			return;
		}

		const key = `${self.options.storageKey}${(TF.isMobileDevice ? ".mobile" : "")}`;
		const clone = self._obCurrentGridLayoutExtendedDataModel().clone();

		clone.description("");

		tf.storageManager.save(key, clone.toData(), null, null, false);
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
		const self = this;
		const promiseTasks = [];

		self._applyingLayout = true;
		const defaultLayout = new TF.DataModel.GridLayoutExtendedDataModel(self._defaultGridLayoutExtendedEntity);
		self._obCurrentGridLayoutExtendedDataModel(defaultLayout);
		self.clearFilter();

		// clear predefined data from share link.
		delete self.options.predefinedGridData;

		//IF the request from search, do not sticky the layout.
		const shouldUseStickyLayout = self.shouldUseStickyLayout();
		if (shouldUseStickyLayout)
		{
			tf.storageManager.delete(self._storageLayoutDataKey);
			tf.storageManager.delete(self._storageFilterDataKey);
		}

		self._setGridColumnConfiguration();
		promiseTasks.push(self._setGridState({ obTempOmitExcludeAnyIds: self.obTempOmitExcludeAnyIds() }));
		self.obAggregationMap([]);
		self.obSummaryGridVisible(false);

		return Promise.all(promiseTasks)
			.then(() =>
			{
				self._applyingLayout = false;
			});
	};

	KendoGridLayoutMenu.prototype.manageLayoutClick = function(viewModel, e)
	{
		const self = this;
		self.setFilterName();
		const reloadLayout = () =>
		{
			return self.loadGridFilter()
				.then(() => { return self.loadLayout(); });
		};

		self.syncLayoutAutoExports().then(function()
		{
			tf.modalManager.showModal(
				new TF.Modal.Grid.ManageLayoutModalViewModel(
					self.obGridLayoutExtendedDataModels,
					self.obGridFilterDataModels,
					self.saveAndEditLayout,
					self.applyLayout,
					self.obSelectedGridLayoutName,
					self.options,
					reloadLayout
				)
			);
		});
	};

	KendoGridLayoutMenu.prototype.setFilterName = function()
	{
		const self = this;
		const filterIdDict = _.keyBy(self.obGridFilterDataModels(), o => o.id());

		self.obGridLayoutExtendedDataModels().forEach(function(item)
		{
			const filter = filterIdDict[item.filterId()];
			if (filter)
			{
				item.filterName(filter.name());
			}
		});
	}

	KendoGridLayoutMenu.prototype.gridLayoutClick = function(gridLayoutExtendDataModel, e)
	{
		var self = this;

		var isCheckedItem = $(e.target).parent().hasClass('menu-item-checked');
		if (TF.isPhoneDevice && isCheckedItem)
		{
			return self._resetLayout();
		}
		else
		{
			return self.notifyUpdateAndApplyLayout(gridLayoutExtendDataModel);
		}
	};

	KendoGridLayoutMenu.prototype.notifyUpdateAndApplyLayout = function(layout)
	{
		var self = this, prepareTask = null;
		if (self.kendoGrid.dataSource.filter() && layout.filterId() != null)
		{
			prepareTask = self.clearKendoGridQuickFilter();
		}

		return Promise.resolve(prepareTask)
			.then(() =>
			{
				return self.applyLayout(layout);
			});
	};

	KendoGridLayoutMenu.prototype._confirmMessageWhenfilterIsNotValid = function(filter, layoutName)
	{
		if (filter && filter.IsValid === false)
		{
			return tf.promiseBootbox.yesNo(
				{
					message: "This Layout has a Filter associated with it that cannot be loaded. The Layout can be opened, but the Filter will not be applied. Are you sure you want to apply this Layout (" + layoutName + ")?"
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

	KendoGridLayoutMenu.prototype.applyLayout = function(gridLayout, isNoConfirm)
	{
		var self = this;

		gridLayout = gridLayout.clone();

		return self._alertMessageWhenLayoutIsDeleted(gridLayout.name())
			.then(function(existLayout)
			{
				if (!existLayout)
					return Promise.resolve(false);

				return self.applyLayoutExtended(gridLayout);
			});
	};

	KendoGridLayoutMenu.prototype._getLayoutRelatedFilterId = function(layoutId)
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridlayouts", layoutId))
			.then(function(apiResponse)
			{
				return Promise.resolve(apiResponse && apiResponse.Items && apiResponse.Items[0] ? apiResponse.Items[0].FilterId : undefined);
			});
	};

	KendoGridLayoutMenu.prototype.applyLayoutExtended = function(gridLayout)
	{
		const self = this;
		const layoutId = gridLayout.id();

		return self._getLayoutRelatedFilterId.bind(self)(layoutId)
			.then(function(relatedFilterId)
			{
				gridLayout.filterId(relatedFilterId);
				return self.requestForLayoutExtendedData(gridLayout)
			})
			.then(function(res)
			{
				return self._confirmMessageWhenfilterIsNotValid(res.filterData, gridLayout.name());
			})
			.then(function(shouldProceed)
			{
				if (!shouldProceed)
				{
					return;
				}

				//IF the request from search, do not sticky the layout.
				const shouldUseStickyLayout = self.shouldUseStickyLayout();
				if (shouldUseStickyLayout && !self.isDashboardWidget())
				{
					// Remove custom filter ids when a layout is applied.
					tf.storageManager.delete(self._storageFilterDataKey);
					tf.storageManager.save(self._storageLayoutDataKey, gridLayout.id());
				}

				// set _applyingLayout to true, to avoid unnecessary value updates during the process.
				self._applyingLayout = true;
				self._obCurrentGridLayoutExtendedDataModel(gridLayout);
				self._applyLayoutExtended(gridLayout);
				self._setGridColumnConfiguration();
				return self._confirmMessageWhenLayoutFilterIsNotAvailableInCurrentDatasource()
					.then(function()
					{
						return self._setGridState(gridLayout.filterId() ? undefined : { obTempOmitExcludeAnyIds: self.obTempOmitExcludeAnyIds() });
					})
					.then(function()
					{
						self._applyingLayout = false;
						self._obCurrentGridLayoutExtendedDataModel.valueHasMutated();
					});
			})
			.catch((error) =>
			{
				console.log(error);
			});
	};

	/**
	 * Currently, layout is not well linked to filter and thematic in EF.
	 *
	 * @param {*} layoutData
	 * @returns
	 */
	KendoGridLayoutMenu.prototype.requestForLayoutExtendedData = function(layoutData)
	{
		const filterId = layoutData.filterId();
		let requestForFilter = null;

		if (filterId)
		{
			requestForFilter = TF.Grid.FilterHelper.getFilterById(filterId);
		}

		return Promise.all([
			requestForFilter
		]).then((res) =>
		{
			const [filterData] = res;
			const filterName = filterData ? filterData.Name : "";

			layoutData.filterName(filterName);

			return { filterData };
		});
	};

	KendoGridLayoutMenu.prototype._applyLayoutExtended = function(gridLayout)
	{
		var layoutFilterId = gridLayout.filterId(),
			currentFilterId = this.obSelectedGridFilterId(),
			filterNeedsChange = layoutFilterId !== currentFilterId,
			hasValidFilter = layoutFilterId && (this.obGridFilterDataModels() || []).some(c => c.id() === layoutFilterId);

		// Switch filter when necessary.
		if (filterNeedsChange)
		{
			this.obSelectedGridFilterId(layoutFilterId);
		}

		// Set up filter related variables.
		if (layoutFilterId)
		{
			delete this.relatedFilterEntity;
			this.obCallOutFilterName(null);
			this.options.callOutFilterName = null;
			this._gridState.filteredIds = null;
			this.isFromRelated(false);
		}
		else
		{
			filterNeedsChange = filterNeedsChange
				|| this.relatedFilterEntity
				|| this.obCallOutFilterName()
				|| this.options.callOutFilterName
				|| this._gridState.filteredIds
				|| this.isFromRelated()
				|| (this.obTempOmitExcludeAnyIds() && this.obTempOmitExcludeAnyIds().length);
		}

		// If there is an invalid in the layout, show the error message.
		if (layoutFilterId && !hasValidFilter)
		{
			gridLayout.filterId(null);
			this.obSelectedGridFilterId(null);
			this.gridAlert.show({
				alert: this.gridAlert.alertOption.danger,
				message: "The layout filter doesn't exist. No filter is applied."
			});
		}

		this.clearPredefinedGridFilter();
		gridLayout.apiIsDirty(filterNeedsChange);
	};

	KendoGridLayoutMenu.prototype.saveLayoutClick = function(viewModel, e)
	{
		var self = this;
		const selectedLayout = self._obCurrentGridLayoutExtendedDataModel();
		var isNew = !selectedLayout.id();

		if (isNew)
		{
			return self.saveAndEditLayout("new", selectedLayout, true);
		}
		else
		{
			return self.syncFilter().then(self.saveLayout.bind(self))
				.then(function(res)
				{
					if (res)
					{
						selectedLayout.apiIsDirty(false);
					}
					return res;
				});
		}
	};

	KendoGridLayoutMenu.prototype.saveLayout = function()
	{
		const gridLayout = this._obCurrentGridLayoutExtendedDataModel();
		const syncPromise = (gridLayout && gridLayout.id())
			? this.syncLayoutAutoExports(gridLayout.id())
			: Promise.resolve();
		return syncPromise.then(function()
		{
			if (gridLayout && gridLayout.autoExportExists())
			{
				var message = `This layout is associated with ${gridLayout.autoExportNames()}.`;
				message += " Changes to this layout will affect the data and format of the data being exported. Are you sure you want to modify this layout?";
				return tf.promiseBootbox.yesNo(message, "Confirmation Message");
			}
			return Promise.resolve(true);
		}.bind(this)).then(function(canSave)
		{
			return canSave ? this.saveLayoutCore() : Promise.resolve(false);
		}.bind(this));
	};

	KendoGridLayoutMenu.prototype.getCurrentLayoutEntity = function(options)
	{
		const gridType = this._gridType;
		const selectedLayout = this._obCurrentGridLayoutExtendedDataModel();
		const layoutColumns = options && options.LayoutColumns || selectedLayout.layoutColumns();
		const layoutAutoExportColumns = tf.dataTypeHelper.checkAutoExportSupport(gridType) ? tf.dataTypeHelper.mappingLayoutColumns(layoutColumns, gridType) : "";
		const layoutEntity = {
			ID: selectedLayout.id(),
			DataTypeID: tf.dataTypeHelper.getId(gridType),
			Name: selectedLayout.name(),
			UDGridId: this.options.gridData ? this.options.gridData.value : null,
			ShowSummaryBar: selectedLayout.showSummaryBar(),
			Description: selectedLayout.description(),
			LayoutColumns: JSON.stringify(layoutColumns),
			LayoutAutoExportColumns: JSON.stringify(layoutAutoExportColumns),
			FilterID: selectedLayout.filterId(),
			FilterName: selectedLayout.filterName(),
		};

		return layoutEntity;
	};

	KendoGridLayoutMenu.prototype.saveLayoutCore = function()
	{
		const layoutModel = this._obCurrentGridLayoutExtendedDataModel();
		const layoutEntity = this.getCurrentLayoutEntity();
		this._updateGridLayoutExtendedDataModels(layoutModel);
		return tf.promiseAjax.put(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridlayouts", layoutEntity.ID),
			{
				data: layoutEntity
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
		const currentLayout = this._obCurrentGridLayoutExtendedDataModel();
		this.saveAndEditLayout("new", currentLayout, true);
	};

	KendoGridLayoutMenu.prototype.saveAndEditLayout = function(isNew, editingLayout, isNoConfirm)
	{
		return tf.modalManager.showModal(new TF.Modal.Grid.ModifyLayoutModalViewModel({
			gridType: this._gridType,
			isNew,
			gridLayout: editingLayout ? editingLayout : this._obCurrentGridLayoutExtendedDataModel(),
			allFilters: this.obGridFilterDataModels(),
			selectedFilterId: this.obSelectedGridFilterId(),
			uDGridId: this.options.gridData ? this.options.gridData.value : null
		})).then(function(result)
		{
			if (!result)
			{
				return result;
			}

			const savedLayout = result.savedGridLayoutExtendedDataModel;

			if (isNew !== "new")
			{
				editingLayout.update(savedLayout.toData());
			}
			else
			{
				const newLayout = new TF.DataModel.GridLayoutExtendedDataModel(savedLayout.toData());
				this.obGridLayoutExtendedDataModels.push(newLayout);
				this._sortGridLayoutExtendedDataModels();
			}

			if (result.applyOnSave)
			{
				return this.applyLayout(savedLayout, isNoConfirm);
			}
			else
			{
				const selectedLayout = this._obCurrentGridLayoutExtendedDataModel();
				const isApplied = selectedLayout && isNew !== "new" && selectedLayout.id() === editingLayout.id()
				if (isApplied)
				{
					this.applyLayout(editingLayout, isNoConfirm);
				}
			}

			return savedLayout;
		}.bind(this));
	};

	KendoGridLayoutMenu.prototype._sortGridLayoutExtendedDataModels = function()
	{
		this.obGridLayoutExtendedDataModels.sort(function(left, right)
		{
			return left.name().toLowerCase() == right.name().toLowerCase() ? 0 : (left.name().toLowerCase() < right.name().toLowerCase() ? -1 : 1);
		});
	};

	/**
	 * Whether sticky layout should be used.
	 *
	 * @param {Object} options
	 * @returns
	 */
	KendoGridLayoutMenu.prototype.shouldUseStickyLayout = function(options)
	{
		const { fromSearch, isTemporaryFilter, useStickyLayout } = options || this.options;

		// isTemporaryFilter was used more than just for filter, the logic is twisted with layout.
		return (!fromSearch && !isTemporaryFilter) || useStickyLayout;
	};

	/**
	 * Whether pre-defined layout should be used.
	 *
	 * @returns
	 */
	KendoGridLayoutMenu.prototype.shouldUsePredefinedLayout = function()
	{
		return this.options.predefinedGridData && this.options.predefinedGridData.layoutColumns;
	};
})();

(function()
{
	createNamespace("TF.DetailView").AssociateRecordsViewModel = AssociateRecordsViewModel;

	function AssociateRecordsViewModel(selectedData, options)
	{
		var self = this,
			defaultOptions = {
				'description': '',
				'availableTitle': 'Available',
				'selectedTitle': 'Selected',
				"showRemoveColumnButton": true,
				"serverPaging": true,
				"updateColumnGrid": 'left',
				getUrl: function(gridType, options)
				{
					var prefix = tf.api.apiPrefix();
					if (options.dataSource)
					{
						prefix = pathCombine(tf.api.apiPrefixWithoutDatabase(), options.dataSource);
					}
					return pathCombine(prefix, "search", tf.dataTypeHelper.getEndpoint(gridType));
				}
			},
			defaultSelectType = {
				id: -1,
				key: "none",
				label: "Select Data Type",
				name: "none"
			};

		self.LEFT_GRID_SELECTOR = '.left-grid';
		self.RIGHT_GRID_SELECTOR = '.right-grid';

		self.options = $.extend({}, defaultOptions, options);
		self.modalViewModel = self.options.modalViewModel;
		self.leftTotalItemCount = 0;
		self.rightTotalItemCount = -1;

		self.obLeftSelected = ko.observable(false);
		self.obRightSelected = ko.observable(false);
		self.obSelected = ko.observable(defaultSelectType);

		self._allSelectedRecords = {
			'left': {},
			'right': {}
		};

		self.selectedItemChanged = new TF.Events.Event();

		self.selectedItems = selectedData;

		TF.Control.KendoListMoverWithSearchControlViewModel.call(self, selectedData, self.options);
	};

	AssociateRecordsViewModel.prototype = Object.create(TF.Control.KendoListMoverWithSearchControlViewModel.prototype);
	AssociateRecordsViewModel.prototype.constructor = AssociateRecordsViewModel;

	AssociateRecordsViewModel.prototype.init = function(viewModel, el)
	{
		var self = this;
		self.$element = $(el);

		self.$element.find(".grid-type .bottom-caret").on("click", function(e)
		{
			var contextmenu = new TF.ContextMenu.TemplateContextMenu(
				"workspace/switchgridmenu",
				new TF.SwitchGridMenuViewModel({
					availableTypes: self.getAvailableDataTypes(),
					selectedItem: self.obSelected(),
					selectedItemChanged: self.selectedItemChanged
				})
			);
			tf.contextMenuManager.showMenu(e.currentTarget, contextmenu);
		});

		self.selectedItemChanged.subscribe(function(e, value)
		{
			self.obSelected(value);
			self.enableApplyButton();
			self.initData(value).then(function(result)
			{
				self.leftTotalItemCount = result.availableSource.length + result.selectedSource.length;
				self.render();
			});
		});

		self._initEmptyLeftGrid();
		self._initRightGrid(self.options.selectedData);
	};

	AssociateRecordsViewModel.prototype.getAvailableDataTypes = function()
	{
		var self = this;
		switch (self.options.gridType)
		{
			case "contact":
				return tf.dataTypeHelper.getAvailableContactAssociationGridDataTypes();
			case "document":
				return tf.dataTypeHelper.getAvailableDocumentAssociationGridDataTypes();
		}
	};

	AssociateRecordsViewModel.prototype.initData = function(selectedType)
	{
		var self = this,
			dataTypeName = selectedType.name,
			requestUrl = self._getRequestUrlByDataType(selectedType);

		return tf.promiseAjax.get(requestUrl).then(function(response)
		{
			var availableSource = [], items = null;

			items = response.Items.map(function(item)
			{
				var name = self._getNameByDataType(dataTypeName, item);
				return {
					'RowId': -1,
					'Id': item.Id,
					'Name': name,
					'DataType': selectedType.name
				};
			});

			items = self._excludeSelectedItems(selectedType, items);
			availableSource = availableSource.concat(items);

			var result = {
				'availableSource': availableSource,
				'selectedSource': self.options.selectedData
			};

			return result;
		});
	};

	AssociateRecordsViewModel.prototype.render = function()
	{
		var self = this;
		self._destroyGrids(true);
		self.options.type = self.obSelected().key;
		tf.dataTypeHelper.getDefaultColumnsByDataType(self.options.type).then(function(columns)
		{
			self.columns = columns;
			self._initGrids(self.$element);
			self.originalColumns = columns;
		});
	};

	AssociateRecordsViewModel.prototype.careteKendoDropTargetEvent = function() { };

	AssociateRecordsViewModel.prototype.initGridOption = function(options, gridType)
	{
		TF.Control.KendoListMoverWithSearchControlViewModel.prototype.initGridOption.call(this, options, gridType);

		if (gridType === "left")
		{
			options.isSmallGrid = false;
		}
	};

	AssociateRecordsViewModel.prototype.initRightGrid = function()
	{
		// Override initRightGrid function.
	};

	AssociateRecordsViewModel.prototype.getGridColumnsFromDefinitionByType = function(type)
	{
		var self = this, columns = [];
		switch (type.toLowerCase())
		{
			case "staff":
				columns = tf.staffGridDefinition.gridDefinition().Columns;
				break;
			case "altsite":
				columns = tf.altsiteGridDefinition.gridDefinition().Columns;
				break;
			case "contractor":
				columns = tf.contractorGridDefinition.gridDefinition().Columns;
				break;
			case "document":
				columns = tf.documentGridDefinition.gridDefinition().Columns;
				break;
			case "district":
				columns = tf.districtGridDefinition.gridDefinition().Columns;
				break;
			case "fieldtrip":
				columns = tf.fieldTripGridDefinition.gridDefinition().Columns;
				break;
			case "georegion":
				columns = tf.georegionGridDefinition.gridDefinition().Columns;
				break;
			case "school":
				columns = tf.schoolGridDefinition.gridDefinition().Columns;
				break;
			case "tripstop":
				columns = tf.tripStopGridDefinition.gridDefinition().Columns;
				break;
			case "student":
				columns = tf.studentGridDefinition.gridDefinition().Columns;
				break;
			case "trip":
				columns = tf.tripGridDefinition.gridDefinition().Columns;
				break;
			case "vehicle":
				columns = tf.vehicleGridDefinition.gridDefinition().Columns;
				break;
			case "contact":
				columns = tf.contactGridDefinition.gridDefinition(self.gridType).Columns;
				break;
			default:
				break;
		}

		return columns;
	};

	AssociateRecordsViewModel.prototype._initEmptyLeftGrid = function()
	{
		var self = this,
			$container = self._getGridContainer(self.LEFT_GRID_SELECTOR);

		$container.empty();
		$container.kendoGrid({
			dataSource: {
				data: [],
				pageSize: 50
			},
			columns: [],
			selectable: "multiple",
			scrollable: {
				virtual: true
			},
			filterable: {
				extra: false,
				mode: "row"
			},
			height: 400,
			pageable: {},
			dataBound: function()
			{
				self.updateBottomBar(self.LEFT_GRID_SELECTOR);
			}
		});
	};

	AssociateRecordsViewModel.prototype._initRightGrid = function(source)
	{
		var self = this,
			options = {
				gridDefinition: {
					Columns: [
						{
							title: 'Name',
							field: "Name",
							DisplayName: "Name",
							FieldName: "Name",
							width: 100,
							filterable: {
								cell: {
									showOperators: false,
									operator: "contains"
								}
							}
						},
						{
							title: 'Data Type',
							field: "DataType",
							DisplayName: "Data Type",
							FieldName: "DataType",
							width: 100,
							filterable: {
								cell: {
									showOperators: false,
									operator: "contains"
								}
							}
						}
					]
				},
				dataSource: source,
				isSmallGrid: true,
				height: 400,
				showBulkMenu: false,
				showLockedColumn: false,
				onDataBound: function()
				{
					self.obRightCount(self.rightSearchGrid.kendoGrid.dataSource._total);
				}
			};

		self.rightSearchGrid = new TF.Grid.LightKendoGrid(self._getGridContainer(self.RIGHT_GRID_SELECTOR), options);
		self.rightSearchGrid.onRowsChangeCheck.subscribe(self.onRightGridChangeCheck.bind(self));
		self.rightSearchGrid.onRowsChanged.subscribe(self.onRightGridChange.bind(self));
		self.rightSearchGrid.onDoubleClick.subscribe(self.onRightDBClick.bind(self));
		self.rightSearchGrid.onDataBoundEvent.subscribe(function()
		{
			tf.dataTypeHelper.getAssociationTotalCount(self.options.gridType).then(function(totalCount)
			{
				self.rightTotalItemCount = totalCount;
				self.updateBottomBar(self.RIGHT_GRID_SELECTOR);
			});
		});
	};

	AssociateRecordsViewModel.prototype.toAllLeftClick = function()
	{
		var self = this;

		self.rightSearchGrid.getIdsWithCurrentFiltering().then(function(data)
		{
			self._obLeftSelData([]);
			self._obRightSelData(data.map(function(id)
			{
				return { Id: id };
			}));
			self._moveItem(false, true);
		});
	};

	AssociateRecordsViewModel.prototype.refreshClick = function()
	{
		var self = this;
		self.leftSearchGrid._gridDefinition.Columns = self.columns;
		self.leftSearchGrid.rebuildGrid();
	};

	AssociateRecordsViewModel.prototype.getIdAndNamesWithCurrentFiltering = function()
	{
		var self = this, searchOption = $.extend({}, self.leftSearchGrid.searchOption),
			url = self.leftSearchGrid.getApiRequestURL(self.leftSearchGrid.options.url),
			necessaryFields = self.getNecessaryFieldsByDataType(self.obSelected());

		searchOption.data.fields = ["Id"].concat(necessaryFields);

		return tf.promiseAjax.post(pathCombine(url),
			{
				data: searchOption.data
			})
			.then(function(apiResponse)
			{
				return apiResponse.Items;
			});
	};

	AssociateRecordsViewModel.prototype.toAllRightClick = function()
	{
		var self = this;
		if (!self.leftSearchGrid)
		{
			return;
		}

		self.getIdAndNamesWithCurrentFiltering().then(function(data)
		{
			self._obLeftSelData(data);
			self._obRightSelData([]);
			self._moveItem(false, true);
		});
	};

	AssociateRecordsViewModel.prototype._moveItem = function(enableSelected, isMoveAll)
	{
		var self = this;
		// If the grid is reading data from server(virtual scroll), get the ids from grid. Because there are only 100 items in the grid's datasource.
		if (self.obLeftGridSelected())
		{
			var leftSelectedIds = self.leftSearchGrid.getSelectedIds(),
				dataTypeName = self.obSelected().name,
				dataTypeLabel = tf.applicationTerm.getApplicationTermSingularByName(dataTypeName),
				leftSelectedItems = self.leftSearchGrid.getSelectedRecords().map(function(item)
				{
					return {
						RowId: '',
						Id: item.Id,
						Name: self._getNameByDataType(dataTypeName, item),
						DataType: dataTypeLabel,
						DataTypeName: dataTypeName,
					};
				});

			if (leftSelectedItems.length > 0 && enableSelected)
			{
				self.selectedData = Array.extend(self.selectedData, leftSelectedIds);
				self.selectedItems = Array.extend(self.selectedItems, leftSelectedItems);
			}
			else
			{
				self.selectedData = self.selectedData.concat(isMoveAll ? self._obLeftSelData().map(function(i) { return i.Id; }) : leftSelectedIds);
				self.selectedItems = self.selectedItems.concat(isMoveAll ? self._obLeftSelData().map(function(item)
				{
					return {
						RowId: '',
						Id: item.Id,
						Name: self._getNameByDataType(dataTypeName, item),
						DataType: dataTypeLabel,
						DataTypeName: dataTypeName,
					}
				}) : leftSelectedItems);
			}
		}

		if (self.obRightGridSelected())
		{
			var rightSelectedIds = self.rightSearchGrid.getSelectedIds();
			if (rightSelectedIds.length > 0 && enableSelected)
			{
				self._obRightSelData(self.rightSearchGrid.kendoGrid.dataSource.data().filter(function(item)
				{
					return Enumerable.From(rightSelectedIds).Any(function(c)
					{
						return c == item.Id;
					});
				}));
			}
			else
			{
				rightSelectedIds = isMoveAll ? self._obRightSelData().map(function(i) { return i.Id; }) : rightSelectedIds;
			}

			self.selectedItems = self.selectedItems.filter(function(item)
			{
				return rightSelectedIds.indexOf(item.Id) < 0;
			});

			self.selectedData = self.selectedData.filter(function(rightData)
			{
				var filter = true;
				if (self.options.serverPaging)
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
					self._obRightSelData().forEach(function(data)
					{
						if (rightData.Id === data.Id)
						{
							filter = false;
							return;
						}
					});
				}
				return filter;
			});
		}

		self.obSelectedData(self.selectedData);
		if (self.leftSearchGrid)
		{
			self.leftSearchGrid.rebuildGrid();
		}
		self._setRightDataSource();
		self.rightSearchGrid.rebuildGrid();

		self._clearLeftSelection();
		self._clearRightSelection();

		self.careteKendoDropTargetEvent();
		self.enableApplyButton();

		self.obRightCount(self.selectedData.length);
	};

	AssociateRecordsViewModel.prototype.setLeftRequestOption = function(requestOptions)
	{
		var self = this, selectedId = this.selectedItems.filter(function(item) { return item.DataTypeName === self.obSelected().name }).map(function(item) { return item.Id });
		var excludeIds = selectedId;

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
			requestOptions.data.filterSet.FilterItems.push(this.options.gridOptions.filter);
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
		if (this.options.setRequestOption)
		{
			requestOptions = this.options.setRequestOption(requestOptions);
		}
		return requestOptions;
	};

	AssociateRecordsViewModel.prototype._setRightDataSource = function()
	{
		var self = this;
		setTimeout(function()
		{
			TF.fixGeometryErrorInKendo(self.selectedData);
			self.rightSearchGrid.kendoGrid.dataSource.data(self.selectedItems);
			self.rightSearchGrid.kendoGrid.dataSource.options.data = self.selectedItems;
			self.rightSearchGrid.kendoGrid.dataSource.transport.data = self.selectedItems;
			self.rightSearchGrid.kendoGrid.dataSource._ranges[0].start = 0;
			self.rightSearchGrid.kendoGrid.dataSource._ranges[0].end = self.selectedItems.length;

			self._changeLeftGridSelectable();
		});
	};

	AssociateRecordsViewModel.prototype.updateBottomBar = function(selector)
	{
		var self = this,
			isLeftGrid = (selector === self.LEFT_GRID_SELECTOR),
			dataCount = self._getGridDataCount(isLeftGrid),
			selectedCount = self._getSelectedCount(isLeftGrid),
			$container = self.$element.find(selector + " .k-pager-wrap");

		$container.html(String.format("<span class=\"pageInfo\" style=\"float:left\">{0} of {1} {2}",
			dataCount,
			isLeftGrid ? self.leftTotalItemCount : self.rightTotalItemCount,
			selectedCount > 0 ? "(" + selectedCount + " selected)" : ""
		));
	};

	AssociateRecordsViewModel.prototype.afterRender = function() { };

	AssociateRecordsViewModel.prototype.exportResult = function()
	{
		var self = this,
			rightKendoGrid = self._getRightKendoGrid(),
			selectedItems = rightKendoGrid.dataSource.data()
				.map(function(item)
				{
					return {
						'Id': item.Id,
						'Name': item.Name,
						'Type': item.DataType,
						'TypeName': item.DataTypeName,
					};
				});

		return {
			data: selectedItems,
			total: self.totalItemCount
		};
	};

	AssociateRecordsViewModel.prototype.cancel = function()
	{
		return Promise.resolve(false);
	};

	AssociateRecordsViewModel.prototype.dispose = function()
	{
		var self = this;
		self._destroyGrids();
		self.obLeftSelected = null;
		self.obRightSelected = null;
		self._allSelectedRecords = null;
	};

	AssociateRecordsViewModel.prototype._getLeftKendoGrid = function()
	{
		return this.$element.find(".left-grid").data("kendoGrid");
	};

	AssociateRecordsViewModel.prototype._getRightKendoGrid = function()
	{
		return this.$element.find(".right-grid").data("kendoGrid");
	};

	AssociateRecordsViewModel.prototype._getAllSelectedRecords = function(isLeftGrid)
	{
		return isLeftGrid ? this._allSelectedRecords.left : this._allSelectedRecords.right;
	};

	AssociateRecordsViewModel.prototype._setAllSelectedRecords = function(isLeftGrid, selectedRecords)
	{
		isLeftGrid ? this._allSelectedRecords.left = selectedRecords : this._allSelectedRecords.right = selectedRecords;
	};

	AssociateRecordsViewModel.prototype._destroyGrids = function(onlyLeft)
	{
		var self = this,
			leftKendoGrid = self._getLeftKendoGrid(),
			rightKendoGrid = self._getRightKendoGrid();

		if (leftKendoGrid && leftKendoGrid.destroy)
		{
			leftKendoGrid.destroy();
			var $leftElement = self.$element.find(".left-grid");
			$leftElement.empty();
			$leftElement.parent().append($leftElement.clone());
			$leftElement.remove();
		}
		if (!onlyLeft && rightKendoGrid && rightKendoGrid.destroy)
		{
			rightKendoGrid.destroy();
		}
	};

	AssociateRecordsViewModel.prototype.getNecessaryFieldsByDataType = function(dataType)
	{
		var dataTypeKey = dataType.key,
			endPoint = tf.dataTypeHelper.getEndpoint(dataTypeKey);

		switch (endPoint)
		{
			case 'staffs':
			case 'students':
			case 'contacts':
				return ["FirstName", "LastName"];
			case 'tripstops':
				return ["Street"];
			case 'vehicles':
				return ["BusNum"];
			default:
				return ["Name"];
		}
	};

	AssociateRecordsViewModel.prototype._getRequestUrlByDataType = function(dataType)
	{
		var self = this,
			dataTypeKey = dataType.key,
			endPoint = tf.dataTypeHelper.getEndpoint(dataTypeKey),
			necessaryFields = self.getNecessaryFieldsByDataType(dataType),
			selectColumns = "?@fields=Id," + necessaryFields.join(",");

		if (endPoint === "contacts")
		{
			selectColumns += "&DBID=" + tf.api.datasourceManager.databaseId;
			return pathCombine(tf.api.apiPrefixWithoutDatabase(), endPoint) + selectColumns;
		}
		else
		{
			return pathCombine(tf.api.apiPrefix(), endPoint) + selectColumns;
		}
	};

	AssociateRecordsViewModel.prototype._excludeSelectedItems = function(dataType, items)
	{
		var self = this,
			selectedData = self.options.selectedData.filter(function(item)
			{
				return item.DataType === dataType;
			}),
			selectedIds = null;

		if (selectedData.length === 0)
		{
			return items;
		}

		selectedIds = selectedData.map(function(data) { return data.Id; });
		items = items.filter(function(item)
		{
			return !selectedIds.includes(item.Id);
		});

		return items;
	};

	AssociateRecordsViewModel.prototype._getLeftGridRecordCount = function()
	{
		var leftKendoGrid = this._getLeftKendoGrid();
		return leftKendoGrid ? leftKendoGrid.dataSource._total : 0;
	};

	AssociateRecordsViewModel.prototype._getRightGridRecordCount = function()
	{
		var rightKendoGrid = this._getRightKendoGrid();
		return rightKendoGrid ? rightKendoGrid.dataSource._total : 0;
	};

	AssociateRecordsViewModel.prototype._getGridDataCount = function(isLeftGrid)
	{
		return isLeftGrid ? this._getLeftGridRecordCount() : this._getRightGridRecordCount();
	};

	AssociateRecordsViewModel.prototype._getSelectedCount = function(isLeftGrid)
	{
		var self = this,
			allSelectedRecords = self._getAllSelectedRecords(isLeftGrid),
			count = 0;
		for (var item in allSelectedRecords)
		{
			if (allSelectedRecords[item] === true)
			{
				count++;
			}
		}
		return count;
	};

	AssociateRecordsViewModel.prototype._getGridContainer = function(selector)
	{
		return this.$element.find(selector);
	};

	AssociateRecordsViewModel.prototype.enableApplyButton = function()
	{
		var self = this;

		if (self.modalViewModel.obDisableControl())
		{
			self.modalViewModel.obDisableControl(false);
		}
	};

	AssociateRecordsViewModel.prototype._getNameByDataType = function(dataTypeName, item)
	{
		var name = '';
		switch (dataTypeName)
		{
			case 'Staff':
			case 'Student':
			case 'Contact':
				name = item.FirstName + " " + item.LastName;
				break;
			case 'Trip Stop':
				name = item.Street;
				break;
			case 'Vehicle':
				name = item.BusNum;
				break;
			default:
				name = item.Name;
				break;
		}
		return name;
	};

	AssociateRecordsViewModel.prototype._getDataByDataType = function()
	{
		var self = this,
			requestUrl = self._getRequestUrlByDataType(self.obSelected())
		return tf.promiseAjax.get(requestUrl);
	};

	AssociateRecordsViewModel.prototype.onLeftDataBound = function()
	{
		TF.Control.KendoListMoverWithSearchControlViewModel.prototype.onLeftDataBound.call(this);

		this.$form.find(".k-filter-row input").addClass("unBindHotKey");
	};
})();
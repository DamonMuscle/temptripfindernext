(function()
{
	var namespace = createNamespace("TF.Control");

	var _KendoUid = "kendoUid";
	var _keyPressName = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];



	var _availableColGrid = null,
		_selectedColGrid = null,
		_obLeftGridSelectedUids = ko.observableArray(),
		_obRightGridSelectedUids = ko.observableArray();

	var _totalColumnsCount = 0;

	var _DataFiledName,
		_GridConifg,
		_sortItems,
		_skipGridSort,
		_convertImportData,
		_getUnSelectedItems,
		_fillDisplayName,
		_convertOutputData,
		_sortKendoGrid,
		_allItems
		;

	var _sortByAllItems = function(a, b)
	{
		var x, y;

		x = a[_DataFiledName];
		y = b[_DataFiledName];
		var leftIdx = _allItems.indexOf(x);
		var rightIdx = _allItems.indexOf(y);
		return leftIdx < rightIdx ? -1 : 1;
	};

	function KendoListMoverControlViewModel (allItems, selectedItems, options, ModalName, requestOptions)
	{
		_DataFiledName = options._DataFiledName;
		_GridConifg = options._GridConifg;
		_allItems = allItems;
		if (options.sortType === 'byAllItems')
		{
			options._sortItems = _sortByAllItems;
			_skipGridSort = true;
		}
		_sortItems = options._sortItems;
		_convertImportData = options._convertImportData;
		_getUnSelectedItems = options._getUnSelectedItems;
		_fillDisplayName = options._fillDisplayName;
		_convertOutputData = options._convertOutputData;
		_sortKendoGrid = options._sortKendoGrid;
		this.options = options;
		this.requestOptions = requestOptions;

		this.getGridItems(allItems, selectedItems);

		this.obavailableColumns = ko.observableArray(this.unSelectedItems);
		this.obselectedColumns = ko.observableArray(this.selectedItems);
		this.originalColumns = [];
		this.columns = _GridConifg.gridColumns;
		this.obShowButtons = ko.observable(options.showButtons);
		this.obshowRemoveColumnButton = ko.observable(options.showRemoveColumnButton);

		_totalColumnsCount = this.unSelectedItems.length + this.selectedItems.length;

		this.obLeftGridSelected = ko.computed(function() { return _obLeftGridSelectedUids() && _obLeftGridSelectedUids().length > 0; }, this);
		this.obRightGridSelected = ko.computed(function()
		{
			return _obRightGridSelectedUids() && _obRightGridSelectedUids().length > 0;
		}, this);

		//key press in available table
		this._ModalName = ModalName;
		this.onKeyPress = this.onKeyPress.bind(this);
		tf.shortCutKeys.bind(_keyPressName, this.onKeyPress, this._ModalName);

		this.obEnabledMoveUp = ko.computed(function()
		{
			if (_obRightGridSelectedUids() && _obRightGridSelectedUids().length > 0)
			{
				var idxs = _getSelectedRowIdxs();
				var maxindex = Math.min.apply({}, idxs);
				if (maxindex <= 0)//actually it should compare with 0
				{
					if (Math.max.apply({}, idxs) - Math.min.apply({}, idxs) == idxs.length - 1)
					{
						return false;
					}
				}
			}
			return true;
		}, this);

		this.obEnabledMoveDown = ko.computed(function()
		{
			if (_obRightGridSelectedUids() && _obRightGridSelectedUids().length > 0)
			{
				var idxs = _getSelectedRowIdxs();
				var minindex = Math.max.apply({}, idxs) + 1;
				if (minindex >= _selectedColGrid.dataSource.data().length)//actually it should compare with 0
				{
					if (Math.max.apply({}, idxs) - Math.min.apply({}, idxs) == idxs.length - 1)
					{
						return false;
					}
				}
			}
			return true;
		}, this);
		this.pageLevelViewModel = new TF.PageLevel.ListMoverPageLevelViewModel(this);

		this.selectItemChange = new TF.Events.Event();
	}

	KendoListMoverControlViewModel.prototype.init = function(viewModel, el)
	{
		this.availableColGridContainer = $(el).find(".availablecolumngrid-container");
		this.selectedColGridContainer = $(el).find(".selectedcolumngrid-container");
		$(el).bootstrapValidator();
		var stickyColumns = this.getCurrentSelectedColumns(this.options.type);
		if (stickyColumns)
		{
			this.columns = stickyColumns;
		}
		this.originalColumns = _GridConifg.gridColumns;
		this.initLeftGrid();
		this.initRightGrid();
		this.obavailableColumns(_availableColGrid.dataSource.data());
		this.obselectedColumns(_selectedColGrid.dataSource.data());

		this.bindLeftGridDraggable();
		this.bindRightGridDraggable();
		this.bindLeftGridDropTarget();
		this.bindRightGridDropTarget();

		this.careteKendoDropTargetEvent();

		this.getSelectedUids = ko.observableArray([]);
		this.getSelectedUids.subscribe(this._selectedUidsChange, this);
		this.onCtrlIPress = this.onCtrlIPress.bind(this);
		this.onCtrlAPress = this.onCtrlAPress.bind(this);
		if (_GridConifg.selectable.indexOf("multiple") != -1)
		{
			tf.shortCutKeys.bind("ctrl+a", this.onCtrlAPress, this._ModalName);
			tf.shortCutKeys.bind("ctrl+i", this.onCtrlIPress, this._ModalName);
		}
		this.availableColGridContainer.on("dblclick", "tr.k-state-selected", function()
		{
			this.toRightClick();
		}.bind(this));

		this.selectedColGridContainer.on("dblclick", "tr.k-state-selected", function()
		{
			this.toLeftClick();
		}.bind(this));

		this.pageLevelViewModel.load($(el).data("bootstrapValidator"));
	};

	KendoListMoverControlViewModel.prototype.selectionAll = function()
	{
		var data = this.getUidsWithCurrentFiltering();
		if (data)
			this.getSelectedUids(data);
	};

	KendoListMoverControlViewModel.prototype.invertSelection = function()
	{
		var data = this.getUidsWithCurrentFiltering();
		if (!data)
			return;
		var selectedItems;
		if (this.obLeftGridSelected())
		{
			selectedItems = _obLeftGridSelectedUids();
		}
		else if (this.obRightGridSelected())
		{
			selectedItems = _obRightGridSelectedUids();
		}
		var Uids = data;
		var selectedUid = Enumerable.From(selectedItems);
		var selectedUids = Uids.filter(function(uid)
		{
			return !selectedUid.Contains(uid);
		});
		this.getSelectedUids(selectedUids);
	};

	KendoListMoverControlViewModel.prototype.addRemoveColumnClick = function(viewModel, el)
	{
		var self = this;
		function initHiddenLockedField (column)
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
		var allColumns = TF.Grid.FilterHelper.getGridDefinitionByType(this.options.type).Columns.slice(0);
		allColumns = TF.Helper.KendoListMoverHelper.removeOnlyForFilterColumn(allColumns);
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
			var columnClone = $.extend({}, listMoverColumns[i]);
			if (!columnClone.DisplayName || $.trim(columnClone.DisplayName) == "")
			{
				if (columnClone.FieldName !== 'RawImage')
				{
					columnClone.DisplayName = columnClone.FieldName;
				}
				else
				{
					columnClone.DisplayName = 'Image';
				}
			}
			initHiddenLockedField(columnClone);
			selectedColumns.push(columnClone);
			if (!existsColumn)
			{
				allColumns.unshift(columnClone);
			}
		}

		availableColumns = Enumerable.From(availableColumns).Where("$.FieldName!=''").ToArray();
		var resetColumns = this.originalColumns.map(function(item)
		{
			return Enumerable.From(allColumns).Where("$.FieldName=='" + item.FieldName + "'").FirstOrDefault();
		});
		var self = this;
		var p1 = TF.UserDefinedFieldUtil.prototype.loadUserDefinedLabel(this.options.type).then(function()
		{
			return TF.UserDefinedFieldUtil.prototype.mergeUserDefinedLabel(availableColumns);
		});
		var p2 = TF.UserDefinedFieldUtil.prototype.loadUserDefinedLabel(this.options.type).then(function()
		{
			return TF.UserDefinedFieldUtil.prototype.mergeUserDefinedLabel(selectedColumns);
		});
		Promise.all([p1, p2]).then(function()
		{
			tf.modalManager.showModal(
				new TF.Modal.Grid.EditKendoColumnModalViewModel(
					availableColumns,
					selectedColumns,
					resetColumns
				)
			)
				.then(function(editColumnViewModel)
				{
					if (!editColumnViewModel)
					{
						return;
					}
					var enumerable = Enumerable.From(self.originalColumns);
					//reset column setting to default
					editColumnViewModel.selectedColumns = editColumnViewModel.selectedColumns.map(function(item)
					{
						var oc = enumerable.Where("$.FieldName=='" + item.FieldName + "'").FirstOrDefault();
						return oc || item;
					});

					self.columns = editColumnViewModel.selectedColumns;
					// if(self.options.listFilterType)
					// {
					// 	self.originalColumns = editColumnViewModel.selectedColumns;
					// }
					self.saveCurrentSelectedColumns(self.options.type ? self.options.type : self.options.GridType, self.getKendoColumns(self.columns, "150px"));
					self.reFreshGrid(self.availableColGridContainer.data("kendoGrid"));
					self.reFreshGrid(self.selectedColGridContainer.data("kendoGrid"));
				});
		});
	};

	KendoListMoverControlViewModel.prototype.refreshClick = function()
	{
		var self = this;
		var filterValue = this.availableColGridContainer.data("kendoGrid").dataSource.filter();
		tf.loadingIndicator.showImmediately();
		this.saveCurrentSelectedColumns(this.options.type ? this.options.type : this.options.GridType, this.getKendoColumns(this.columns, "150px"));
		if (self.requestOptions)
		{
			var url = self.requestOptions.url,
				promiseAjaxRequest;
			if (self.requestOptions.method && self.requestOptions.method == 'post')
			{
				promiseAjaxRequest = tf.promiseAjax.post(url);
			}
			else
			{
				promiseAjaxRequest = tf.promiseAjax.get(url);
			}
			return promiseAjaxRequest.then(function(response)
			{
				var itemsDataEntity = self.getItemsData(response, self.requestOptions);
				self.getGridItems(itemsDataEntity.allItemsData, itemsDataEntity.selectedFilterItemsData);
				self.init(null, $('.list-mover-mover.edit-kendo-columns').parent()[0]);
				self.availableColGridContainer.data("kendoGrid").dataSource.filter(filterValue);
				tf.loadingIndicator.tryHide();
			});
		}
		else
		{
			this.availableColGridContainer.data("kendoGrid").refresh();
			this.selectedColGridContainer.data("kendoGrid").refresh();
			tf.loadingIndicator.tryHide();
		}
	};

	KendoListMoverControlViewModel.prototype.getGridItems = function(allItemsData, selectedFilterItemsData)
	{
		var self = this;
		var options = this.options;
		var unselectedItems = options._getUnSelectedItems(allItemsData, selectedFilterItemsData);
		unselectedItems = options._convertImportData(unselectedItems);
		var selectedItems = options._convertImportData(selectedFilterItemsData);

		self.unSelectedItems = options._fillDisplayName(unselectedItems).slice().sort(options._sortItems);
		self.selectedItems = options._fillDisplayName(selectedItems).slice().sort(options._sortItems);
	};

	KendoListMoverControlViewModel.prototype.getItemsData = function(response, options)
	{
		var self = this;
		function getItem (item)
		{
			if (options.filterField)
			{
				return item[options.filterField];
			}
			return $.trim(item);
		}

		var allItems = TF.ListFilterHelper.processMapData(response, options.modifySource);
		self.selectedItems = [];
		_selectedColGrid.dataSource.data().map(function(item)
		{
			for (var i = 0; i < allItems.length; i++)
			{
				if (allItems[i] == item.FieldName)
				{
					self.selectedItems.push(allItems[i]);
					break;
				}
			}
		});

		var allItemsData = allItems.map(function(item)
		{
			return getItem(item);
		});
		var selectedFilterItemsData = this.selectedItems.map(function(item)
		{
			return getItem(item);
		});

		return { allItemsData: allItemsData, selectedFilterItemsData: selectedFilterItemsData };
	};

	KendoListMoverControlViewModel.prototype.reFreshGrid = function(kendoGrid)
	{
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
				this.overlayShow = true;
				var columnsdefalultColumnWidth = '150px';
				var kendoOptions = kendoGrid.getOptions();
				kendoOptions.columns = this.getKendoColumns(this.columns, columnsdefalultColumnWidth);
				if (kendoOptions.columns.length == 1)
				{
					kendoOptions.columns[0].locked = false;
				}
				kendoGrid.setOptions(kendoOptions);
				_cancelKendoGridSelectedArea(kendoGrid);
				setTimeout(function()
				{
					this.overlayShow = false;
					tf.loadingIndicator.tryHide();
				}.bind(this), 1000);
			}.bind(this), 0);

	};

	KendoListMoverControlViewModel.prototype.getKendoColumns = function(currentColumns, defalultColumnWidth)
	{
		var self = this;
		var columns = currentColumns.map(function(definition)
		{
			var column = definition;
			if (definition.field)
			{
				column.field = definition.field;
			}
			else
			{
				column.field = definition.FieldName;
			}
			column.title = "";
			if (definition.DisplayName !== "Image")
				column.title = definition.DisplayName;
			if (!column.width)
				column.width = definition.Width || defalultColumnWidth;
			else
				definition.Width = column.width;
			self.setColumnFilterableCell(column, definition);
			column.hidden = false; // Overwrite the value of hidden attribute which setting in api.
			column.locked = false;
			return column;
		});

		return columns;
	};

	KendoListMoverControlViewModel.prototype.setColumnFilterableCell = function(column, definition)
	{
		var self = this;
		switch (definition.type)
		{
			case "string":
				column.filterable = {
					cell: {
						showOperators: false,
						operator: "contains"
					}
				};
				break;
			case "number":
				if (column.FieldName.indexOf('UserNum') !== 0)
				{
					column.format = definition.format ? definition.format : "{0:n2}";
				}
				column.filterable = {
					cell: {
						showOperators: false,
						operator: "eq",
						template: function(args)
						{
							args.element.kendoNumericTextBox({
								decimals: definition.Precision ? definition.Precision : 2,
								format: definition.format ? definition.format : "{0:n2}"
							});
						}
					}
				};
				break;
			case "integer":
				column.format = definition.format ? definition.format : "{0:n0}";
				column.filterable = {
					cell: {
						showOperators: false,
						operator: "eq",
						template: function(args)
						{
							args.element.kendoNumericTextBox({
								format: "n0"
							});
						}
					}
				};
				break;
			case "time":
				column.format = definition.format ? definition.format : "{0:h:mm tt}";
				column.filterable = {
					cell: {
						showOperators: false,
						template: function(args)
						{
							var span = $(args.element[0].parentElement);
							span.empty();
							span.append($("<span class='input-group tf-filter' data-kendo-bind='value: value' data-kendo-role='customizedtimepicker'></span>"));
						}
					}
				};
				break;
			case "date":
				column.format = "{0:MM/dd/yyyy}";
				column.filterable = {
					cell: {
						showOperators: false,
						operator: "eq",
						template: function(args)
						{
							args.element.kendoDatePicker();
							args.element.on("keypress", function(e)
							{
								if ((e.which < 45 || e.which > 57) && e.which != 37 && e.which != 39)
								{
									e.preventDefault();
								}
							});
						}
					}
				};
				break;

			case "datetime":
				column.format = "{0:MM/dd/yyyy hh:mm tt}";
				column.filterable = {
					cell: {
						showOperators: false,
						operator: "eq",
						template: function(args)
						{
							var span = $(args.element[0].parentElement);
							span.empty();
							span.append($("<span class='input-group tf-filter' data-kendo-bind='value: value' data-kendo-role='customizeddatetimepicker'></span>"));
						}
					}
				};
				break;

			case "boolean":
				column.filterable = {
					cell: {
						showOperators: false,
						template: function(args)
						{
							args.element.kendoDropDownList({
								dataSource: new kendo.data.DataSource({
									data: [
										{ someField: "", valueField: "" },
										{ someField: "True", valueField: "true" },
										{ someField: "False", valueField: "false" }
									]
								}),
								dataTextField: "someField",
								dataValueField: "valueField",
								valuePrimitive: true
							});
						},
						showOperators: false
					}
				};
				break;
			case "image":
				column.filterable = {
					cell: {
						template: function(args)
						{
							args.element.kendoDropDownList({
								dataSource: {
									data: self.getImageFilterableDataSource(definition.FieldName)
								},
								dataTextField: "someField",
								dataValueField: "valueField",
								valuePrimitive: true,
								valueTemplate: '<span class="icon-select-item #:data.someField#"></span>',
								template: '<span class="icon-select-item #:data.someField#"></span>'
							});
						},
						showOperators: false
					}
				};
				break;
			case "nofilter":
				break;
		}
	};

	KendoListMoverControlViewModel.prototype.getImageFilterableDataSource = function(fieldName)
	{
		var dataSource = [];
		switch (fieldName)
		{
			case "Ampmschedule":
				dataSource.push({ someField: "", valueField: "" });
				dataSource.push({ someField: tf.studentGridDefinition.gridDefinition().getIconUrl_Ampmschedule("14"), valueField: "14" });
				dataSource.push({ someField: tf.studentGridDefinition.gridDefinition().getIconUrl_Ampmschedule("15"), valueField: "15" });
				dataSource.push({ someField: tf.studentGridDefinition.gridDefinition().getIconUrl_Ampmschedule("16"), valueField: "16" });
				break;
			case "Ampmtransportation":
				dataSource.push({ someField: "", valueField: "" });
				dataSource.push({ someField: tf.studentGridDefinition.gridDefinition().getIconUrl_Ampmtransportation("10"), valueField: "10" });
				dataSource.push({ someField: tf.studentGridDefinition.gridDefinition().getIconUrl_Ampmtransportation("11"), valueField: "11" });
				dataSource.push({ someField: tf.studentGridDefinition.gridDefinition().getIconUrl_Ampmtransportation("12"), valueField: "12" });
				break;
			case "RidershipStatus":
				dataSource.push({ someField: "", valueField: "" });
				dataSource.push({ someField: tf.tripGridDefinition.gridDefinition().getIconUrl_RidershipStatus("37"), valueField: "37" });
				dataSource.push({ someField: tf.tripGridDefinition.gridDefinition().getIconUrl_RidershipStatus("39"), valueField: "39" });
				break;
			case "PolicyDeviation":
				dataSource.push({ someField: "", valueField: "" });
				dataSource.push({ someField: tf.studentGridDefinition.gridDefinition().getIconUrl_PolicyDeviation("37"), valueField: "37" });
				break;
			case "Notes":
				dataSource.push({ someField: "", valueField: "" });
				dataSource.push({ someField: tf.studentGridDefinition.gridDefinition().getIconUrl_Notes("5"), valueField: "5" });
				break;
			case "IsLocked":
				dataSource.push({ someField: "", valueField: "" });
				dataSource.push({ someField: tf.tripGridDefinition.gridDefinition().getIconUrl_IsLocked("6"), valueField: "6" });
				dataSource.push({ someField: tf.tripGridDefinition.gridDefinition().getIconUrl_IsLocked(""), valueField: "neq" });
				break;
		}
		return dataSource;
	};

	KendoListMoverControlViewModel.prototype.saveCurrentSelectedColumns = function(gridType, columns)
	{
		return tf.storageManager.save(tf.storageManager.listMoverCurrentSelectedColumns(gridType, tf.authManager.authorizationInfo.authorizationTree.username), columns);
	};

	KendoListMoverControlViewModel.prototype.getCurrentSelectedColumns = function(gridType)
	{
		return tf.storageManager.get(tf.storageManager.listMoverCurrentSelectedColumns(gridType, tf.authManager.authorizationInfo.authorizationTree.username));
	};

	KendoListMoverControlViewModel.prototype.onCtrlAPress = function(e, keyCombination)
	{
		this.selectionAll();
		e.preventDefault(); // Defence code
	};

	KendoListMoverControlViewModel.prototype.onCtrlIPress = function(e, keyCombination)
	{
		this.invertSelection();
		e.preventDefault(); // Prevent add page to bookmark by IE
	};

	KendoListMoverControlViewModel.prototype.getUidsWithCurrentFiltering = function()
	{
		if (this.obLeftGridSelected())
		{
			return _availableColGrid.dataSource.data().map(
				function(item) { return item["uid"] }
			);
		}
		else if (this.obRightGridSelected())
		{
			return _selectedColGrid.dataSource.data().map(
				function(item) { return item["uid"] }
			);
		}
		return false;
	};

	KendoListMoverControlViewModel.prototype._selectedUidsChange = function()
	{
		var self = this;
		var selectedAreaKendoGrid;
		if (this.obLeftGridSelected())
		{
			selectedAreaKendoGrid = this.availableColGridContainer.data("kendoGrid");
		}
		else if (this.obRightGridSelected())
		{
			selectedAreaKendoGrid = this.selectedColGridContainer.data("kendoGrid");
		}
		if (selectedAreaKendoGrid)
		{
			var selected = $.map(selectedAreaKendoGrid.items(), function(item)
			{
				var row = $(item).closest("tr");
				var dataItem = selectedAreaKendoGrid.dataItem(row);
				var selectedUid = Enumerable.From(self.getSelectedUids());
				if (dataItem && dataItem.uid && selectedUid.Contains(dataItem.uid))
				{
					return item;
				}
			});
			selectedAreaKendoGrid.clearSelection();
			selectedAreaKendoGrid.select(selected);
		}
	};

	KendoListMoverControlViewModel.prototype.careteKendoDropTargetEvent = function()
	{
		this.selectedColGridContainer.find("tbody tr").kendoDropTarget({
			dragenter: function(e)
			{
				var targetItem = $(e.dropTarget[0]);
				targetItem.addClass("drag-target-insert-after-cursor");

				_removeDropTargetCursorTriangle();
				_appendDropTargetCursorTriangle(targetItem);
			},
			dragleave: function(e)
			{
				$(e.dropTarget[0]).removeClass("drag-target-insert-after-cursor");
				_removeDropTargetCursorTriangle();
			},
			drop: _selectedDrop.bind(this)
		});
	};

	KendoListMoverControlViewModel.prototype.onLeftGridChange = function(arg)
	{
		var selected = $.map(this.select(), function(item)
		{
			return item.dataset[_KendoUid];
		}.bind(this));
		_obLeftGridSelectedUids(selected);

		if (_obLeftGridSelectedUids().length !== 0)
		{
			_clearRightSelection();
		}

		var bottomDom = TF.Control.KendoListMoverControlViewModel._buildGridBottom(
			this.dataItems().length,
			this.select().length,
			_totalColumnsCount
		);
		this.wrapper.find(".k-pager-wrap").html(bottomDom);
	};

	KendoListMoverControlViewModel.prototype.onRightGridChange = function(arg)
	{
		var selected = $.map(this.select(), function(item)
		{
			return item.dataset[_KendoUid];
		}.bind(this));
		_obRightGridSelectedUids(selected);

		if (_obRightGridSelectedUids().length !== 0)
		{
			_clearLeftSelection();
		}

		var bottomDom = TF.Control.KendoListMoverControlViewModel._buildGridBottom(
			this.dataItems().length,
			this.select().length,
			_totalColumnsCount
		);
		this.wrapper.find(".k-pager-wrap").html(bottomDom);
	};

	KendoListMoverControlViewModel._buildGridBottom = function(filteredRecordCount, selectedRecordCount, totalColumnsCount)
	{
		return '<span class="pageInfo" style="float:left">' +
			filteredRecordCount + ' of ' + totalColumnsCount + (selectedRecordCount > 0 ? ' (' + selectedRecordCount + ' selected)' : '') +
			'</span>';
	};

	var _cancelKendoGridSelectedArea = function(kendoGrid)
	{
		kendoGrid.selectable.userEvents.unbind("start");
		kendoGrid.selectable.userEvents.unbind("move");
		kendoGrid.selectable.userEvents.unbind("end");
	};

	KendoListMoverControlViewModel.prototype.initLeftGrid = function()
	{
		var self = this, oldShotcutExtener;
		if (_availableColGrid != null)
		{
			oldShotcutExtener = _availableColGrid.shortcutExtender;
		}
		_availableColGrid = null;

		var options = {
			dataSource: new kendo.data.DataSource({
				data: this.unSelectedItems,
				schema: _GridConifg.gridSchema
			}),
			columns: this.columns,
			height: _GridConifg.height,
			selectable: _GridConifg.selectable,
			sortable: self.options._GridConifg.sortable,
			change: this.onLeftGridChange,
			pageable: {},
			columnReorder: function(e)
			{
				var selectedGrid = $(".selectedcolumngrid-container").data("kendoGrid");
				selectedGrid.reorderColumn(e.newIndex, selectedGrid.columns[e.oldIndex]);
			},
			dataBound: function()
			{
				var bottomDom = TF.Control.KendoListMoverControlViewModel._buildGridBottom(
					this.dataItems().length,
					this.select().length,
					_totalColumnsCount
				);
				self.availableColGridContainer.find(".k-pager-wrap").html(bottomDom);
			}
		}

		if (this.options.leftGridWithSearch)
		{
			options.filterable = {
				extra: false,
				mode: "row"
			}
			options.columns.map(function(column)
			{
				column.filterable = {
					cell: {
						showOperators: false,
						operator: "contains"
					}
				}
			});
		}

		this.availableColGridContainer.kendoGrid(options);
		_availableColGrid = this.availableColGridContainer.data("kendoGrid");
		_cancelKendoGridSelectedArea(_availableColGrid);
		_availableColGrid.shortcutExtender = oldShotcutExtener ? oldShotcutExtener : new TF.KendoGridNavigator({ grid: _availableColGrid, pageSize: 8 });
		this.initGridScrollBar(this.availableColGridContainer);
	};

	KendoListMoverControlViewModel.prototype.initRightGrid = function()
	{
		var self = this, oldShotcutExtener;
		if (_selectedColGrid != null)
		{
			oldShotcutExtener = _selectedColGrid.shortcutExtender;
		}
		_selectedColGrid = null;
		this.selectedColGridContainer.kendoGrid({
			dataSource: new kendo.data.DataSource({
				data: this.selectedItems,
				schema: _GridConifg.gridSchema
			}),
			columns: this.columns,
			height: _GridConifg.height,
			selectable: _GridConifg.selectable,
			change: this.onRightGridChange,
			pageable: {},
			columnReorder: function(e)
			{
				var availableGrid = $(".availablecolumngrid-container").data("kendoGrid");
				availableGrid.reorderColumn(e.newIndex, availableGrid.columns[e.oldIndex]);
			},
			dataBound: function()
			{
				var bottomDom = TF.Control.KendoListMoverControlViewModel._buildGridBottom(
					this.dataItems().length,
					this.select().length,
					_totalColumnsCount
				);
				self.selectedColGridContainer.find(".k-pager-wrap").html(bottomDom);
			}
		});
		_selectedColGrid = this.selectedColGridContainer.data("kendoGrid");
		_cancelKendoGridSelectedArea(_selectedColGrid);
		_selectedColGrid.shortcutExtender = oldShotcutExtener ? oldShotcutExtener : new TF.KendoGridNavigator({ grid: _selectedColGrid, pageSize: 8 });
		this.initGridScrollBar(this.selectedColGridContainer);
	};

	KendoListMoverControlViewModel.prototype.initGridScrollBar = function(container)
	{
		// var $gridContent = container.find(".k-grid-content");
		// $gridContent.css({
		// 	"overflow-y": "auto"
		// });

		// if ($gridContent[0].clientHeight == $gridContent[0].scrollHeight)
		// {
		// 	$gridContent.find("colgroup col:last").css({
		// 		width: 77
		// 	});
		// }
		// else
		// {
		// 	$gridContent.find("colgroup col:last").css({
		// 		width: 60
		// 	});
		// }
	};

	KendoListMoverControlViewModel.prototype.bindLeftGridDraggable = function()
	{
		this.availableColGridContainer.kendoDraggable({
			filter: "tbody > tr",
			threshold: 100,
			holdToDrag: TF.isMobileDevice,
			hint: function(e)
			{
				if (e.hasClass("k-state-selected"))
				{
					var selectedColumns = this.availableColGridContainer.find('.k-state-selected');
					return _getHintElements(e, this.availableColGridContainer, selectedColumns);
				}
				else
				{
					return _getHintElements(e, this.availableColGridContainer);
				}
			}.bind(this),
			dragstart: function(e)
			{
			}.bind(this),
			autoScroll: true,
			cursorOffset: { top: -10, left: -10 },
			dragend: function(e)
			{
				$(".list-mover-drag-hint").hide();
			}.bind(this)
		});
	};

	KendoListMoverControlViewModel.prototype.bindRightGridDraggable = function()
	{
		this.selectedColGridContainer.kendoDraggable({
			filter: "tbody > tr",
			threshold: 100,
			holdToDrag: TF.isMobileDevice,
			autoScroll: true,
			hint: function(e)
			{
				if (e.hasClass("k-state-selected"))
				{
					var selectedColumns = this.selectedColGridContainer.find('.k-state-selected');
					return _getHintElements(e, this.selectedColGridContainer, selectedColumns);
				}
				else
				{
					return _getHintElements(e, this.selectedColGridContainer);
				}
			}.bind(this),
			dragstart: function(e)
			{
			}.bind(this),
			cursorOffset: { top: -10, left: -10 },
			dragend: function(e)
			{
				$(".list-mover-drag-hint").hide();
			}.bind(this)
		});
	};

	KendoListMoverControlViewModel.prototype.bindLeftGridDropTarget = function()
	{
		this.availableColGridContainer.kendoDropTarget({
			drop: function(e)
			{
				e.draggable.hint.hide();
				var selectedUids = e.draggable.currentTarget.hasClass("k-state-selected") ? _obRightGridSelectedUids() : [e.draggable.currentTarget.data().kendoUid];
				if (!e.draggable.element.hasClass("availablecolumngrid-container"))
				{
					this._moveItem(selectedUids, _selectedColGrid.dataSource, _availableColGrid.dataSource);
				}
				_sortKendoGrid(_availableColGrid, _sortItems);
				if (selectedUids.length > 0)
				{
					_obLeftGridSelectedUids(selectedUids);
				}
				var dropTargetTrs = e.dropTarget.find("tbody[role=rowgroup]").find("tr");
				var selectTrs = $.grep(dropTargetTrs, function(n)
				{
					return _obLeftGridSelectedUids().indexOf($(n).data().kendoUid) != -1;
				});
				if (selectTrs.length > 0)
				{
					$(selectTrs).addClass("k-state-selected");
				}

				_clearLeftSelection();
				_clearRightSelection();
			}.bind(this)
		});
	};

	KendoListMoverControlViewModel.prototype.bindRightGridDropTarget = function()
	{
		this.selectedColGridContainer.kendoDropTarget({
			drop: function(e)
			{
				e.draggable.hint.hide();
				var selectedUids = e.draggable.currentTarget.hasClass("k-state-selected") ? _obLeftGridSelectedUids() : [e.draggable.currentTarget.data().kendoUid];
				if (!e.draggable.element.hasClass("selectedcolumngrid-container"))
				{
					this._moveItem(selectedUids, _availableColGrid.dataSource, _selectedColGrid.dataSource);
				}
				_sortKendoGrid(_selectedColGrid, _sortItems);
				if (selectedUids.length > 0)
				{
					_obRightGridSelectedUids(selectedUids);
				}
				var dropTargetTrs = e.dropTarget.find("tbody[role=rowgroup]").find("tr");
				var selectTrs = $.grep(dropTargetTrs, function(n)
				{
					return _obRightGridSelectedUids().indexOf($(n).data().kendoUid) != -1;
				});
				if (selectTrs.length > 0)
				{
					$(selectTrs).addClass("k-state-selected");
				}

				_clearLeftSelection();
				_clearRightSelection();
			}.bind(this)
		});
	};

	KendoListMoverControlViewModel.prototype.toAllRightClick = function()
	{
		this._moveItem(_getUids(_availableColGrid.dataSource), _availableColGrid.dataSource, _selectedColGrid.dataSource);
		_sortKendoGrid(_selectedColGrid, _sortItems, _skipGridSort);
	};

	KendoListMoverControlViewModel.prototype.toRightClick = function()
	{
		this._moveItem(_obLeftGridSelectedUids(), _availableColGrid.dataSource, _selectedColGrid.dataSource);
		_sortKendoGrid(_selectedColGrid, _sortItems, _skipGridSort);
	};

	KendoListMoverControlViewModel.prototype.toLeftClick = function()
	{
		this._moveItem(_obRightGridSelectedUids(), _selectedColGrid.dataSource, _availableColGrid.dataSource);
		_sortKendoGrid(_availableColGrid, _sortItems, _skipGridSort);
	};

	KendoListMoverControlViewModel.prototype.toAllLeftClick = function()
	{
		this._moveItem(_getUids(_selectedColGrid.dataSource), _selectedColGrid.dataSource, _availableColGrid.dataSource);
		_sortKendoGrid(_availableColGrid, _sortItems, _skipGridSort);
	};

	KendoListMoverControlViewModel.prototype.onKeyPress = function(e, keyCombination)
	{
		var _columnsHeight = 28;
		var _top = 0;
		var _keyNum = _keyPressName.indexOf(keyCombination);
		if (_keyNum > 0)
		{
			var _availableGridTrs = this.availableColGridContainer.find("div.k-grid-content").find("tbody[role=rowgroup]").find("tr");
			var _beforeKeyColumns = $.grep(_availableGridTrs, function(n)
			{
				return _keyPressName.indexOf(n.innerText.substring(0, 1).toLowerCase()) < _keyNum;
			});
			var _keyColumns = $.grep(_availableGridTrs, function(n)
			{
				return n.innerText.substring(0, 1).toLowerCase() == _keyPressName[_keyNum];
			});
			if (_keyColumns.length === 0)
			{
				return;
			}
			_top = _beforeKeyColumns.length * 28;
		}
		this.availableColGridContainer.find("div.k-grid-content").scrollTop(_top);
	};

	KendoListMoverControlViewModel.prototype.reset = function()
	{
		var self = this;

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
				return self._applyDefaultColumns()
					.then(function(result)
					{
						setTimeout(function()
						{
							tf.loadingIndicator.tryHide();
						}, 1000);
						if (result)
							return this;
					}.bind(self));
			});
	};

	KendoListMoverControlViewModel.prototype._applyDefaultColumns = function()
	{
		var self = this;
		return (function()
		{
			self.toAllLeftClick();
			// self.defaultLayoutColumns.map(function(column)
			// {
			// 	self._moveItem(self._getUidByColumnName(column.FieldName, _availableColGrid.dataSource), _availableColGrid.dataSource, _selectedColGrid.dataSource);
			// });
			return Promise.resolve(true);
		})();
	};

	KendoListMoverControlViewModel.prototype._getUidByColumnName = function(columnFieldName, dataSource)
	{
		var uid;
		dataSource.data().map(function(item)
		{
			if (item.FieldName === columnFieldName)
			{
				uid = item.uid;
				return false;
			}
		});

		return [uid];
	};

	KendoListMoverControlViewModel.prototype.apply = function()
	{
		return this._save()
			.then(function(result)
			{
				if (result)
					return this._getResult();
			}.bind(this));
	};

	KendoListMoverControlViewModel.prototype._getResult = function()
	{
		return _convertOutputData(this.obselectedColumns());
	};

	KendoListMoverControlViewModel.prototype.getSelectDataCount = function()
	{
		return this.selectedItems.length;
	}

	KendoListMoverControlViewModel.prototype._save = function()
	{
		var self = this;
		return (function()
		{
			if (this.options.mustSelect)
			{
				return this.pageLevelViewModel.saveValidate().then(function(result)
				{
					if (result)
					{
						self.saveCurrentSelectedColumns(self.options.type ? self.options.type : self.options.GridType, $(".availablecolumngrid-container").data("kendoGrid").columns);
						return Promise.resolve(true);
					}
					else
					{
						return Promise.resolve(false);
					}
				}.bind(this));
			}
			else
			{
				return Promise.resolve(true);
			}
		}.bind(this))();
	};

	KendoListMoverControlViewModel.prototype._scrollUpDownByselectedUids = function(scrollUp)
	{
		var gridContentElement = this.selectedColGridContainer.find(".k-grid-content");
		var selectedItemElements = this.selectedColGridContainer.find('.k-state-selected');

		var itemHeight = $(selectedItemElements[0]).height();
		var maxItemRowCount = 9;

		var itemsOffSetTop = $(selectedItemElements[0]).offset().top;

		var gridContentHeight = $(selectedItemElements[0]).parent().height(); // include all items;
		var gridContentViewZoneBottom = gridContentElement.offset().top + itemHeight * maxItemRowCount;
		var itemsOffSetBottom = itemsOffSetTop + itemHeight;

		var topPostion;
		if (scrollUp)
		{
			var uponViewZone = itemsOffSetTop < gridContentElement.offset().top;
			if (uponViewZone)
			{
				topPostion = Math.max(gridContentElement.scrollTop() - itemHeight, 0);
			}
		}
		else
		{
			var underViewZone = itemsOffSetBottom > gridContentViewZoneBottom;
			if (underViewZone)
			{
				topPostion = Math.min(gridContentElement.scrollTop() + itemHeight, gridContentHeight);
			}
		}

		if (topPostion && !isNaN(topPostion))
		{
			this._scrollUpDown(topPostion);
		}
	};

	KendoListMoverControlViewModel.prototype._scrollUpDown = function(topPostion)
	{
		var gridContentElement = this.selectedColGridContainer.find(".k-grid-content");
		gridContentElement.scrollTop(topPostion);
	};

	KendoListMoverControlViewModel.prototype._moveItemUpDown = function(targetIdx)
	{
		var selectedRows = _getDataRowsBySelectedUids(_obRightGridSelectedUids(), _selectedColGrid.dataSource);

		var gridData = _selectedColGrid.dataSource.data();
		var insertBefore = Enumerable.From(gridData.slice(0, targetIdx)).Except(selectedRows).ToArray();
		var insertAfter = Enumerable.From(gridData.slice(targetIdx)).Except(selectedRows).ToArray();
		if (insertBefore.length > 0 && insertBefore[insertBefore.length - 1].locked == false)
		{
			selectedRows.forEach(function(item)
			{
				item.locked = false;
			});
		}
		else if (insertAfter.length > 0 && insertAfter[0].locked == true)
		{
			selectedRows.forEach(function(item)
			{
				item.locked = true;
			});
		}
		_selectedColGrid.dataSource.data([insertBefore, selectedRows, insertAfter].reduce(function(a, b) { return a.concat(b); }, []));

		_hightLightSelectedItems();

		this.careteKendoDropTargetEvent();
	};

	KendoListMoverControlViewModel.prototype._moveItem = function(selectedItemUids, depDataSource, distDataSource)
	{
		if (!selectedItemUids || selectedItemUids.length === 0)
		{
			return;
		}

		var selectedRows = [];
		for (var i = 0; i < selectedItemUids.length; i++)
		{
			selectedRows.push(depDataSource.getByUid(selectedItemUids[i]));
		}

		if (selectedRows.length > 0)
		{
			this.pageLevelViewModel.obValidationErrorsSpecifed([]);
		}

		for (var i = 0; i < selectedRows.length; i++)
		{
			depDataSource.remove(selectedRows[i]);
			distDataSource.add(selectedRows[i]);
		}

		_clearLeftSelection();
		_clearRightSelection();

		this.careteKendoDropTargetEvent();
		var availableColumns = _availableColGrid.dataSource.data();
		availableColumns.forEach(function(item)
		{
			item.locked = false;
		});
		this.obavailableColumns(availableColumns);
		this.obselectedColumns(_selectedColGrid.dataSource.data());

		this.initGridScrollBar(this.availableColGridContainer);
		this.initGridScrollBar(this.selectedColGridContainer);

		this.selectItemChange.notify();
	};

	KendoListMoverControlViewModel.prototype.dispose = function()
	{
		this.pageLevelViewModel.dispose();
	};

	var _selectedDrop = function(e)
	{

		e.draggable.hint.hide();
		if (e.draggable.currentTarget.hasClass("k-state-selected"))
		{
			if (!this.obLeftGridSelected() &&
				!this.obRightGridSelected())
			{
				_selectedColGrid.clearSelection();
				return;
			}

			var insertIdx = _getInsertIdx($(document.elementFromPoint(e.clientX, e.clientY)));

			if (this.obLeftGridSelected())
			{
				var tmp = _obLeftGridSelectedUids().slice();
				this._moveItem(_obLeftGridSelectedUids(), _availableColGrid.dataSource, _selectedColGrid.dataSource);
				_obRightGridSelectedUids(tmp);
				this._moveItemUpDown(insertIdx);
			}
			else
			{
				this._moveItemUpDown(insertIdx);
			}
		}
		else
		{
			var insertIdx = _getInsertIdx($(document.elementFromPoint(e.clientX, e.clientY)));
			var selectedUids = [e.draggable.currentTarget.data().kendoUid];
			if (e.draggable.element.hasClass("availablecolumngrid-container"))
			{
				this._moveItem(selectedUids, _availableColGrid.dataSource, _selectedColGrid.dataSource);
			}
			_obRightGridSelectedUids(selectedUids);
			this._moveItemUpDown(insertIdx);
		}
	};

	var _getInsertIdx = function(dest)
	{
		var insertIdx = 0;

		if (dest.is("th"))
		{
			insertIdx = 0;
		}
		else
		{
			var destData = _selectedColGrid.dataSource.getByUid(dest.parent().data(_KendoUid));
			var gridData = _selectedColGrid.dataSource.data();

			insertIdx = gridData.length;
			if (destData && gridData)
			{

				gridData.forEach(function(col, idx)
				{
					if (col === destData)
					{
						insertIdx = Math.min(idx + 1, gridData.length);
						return;
					}
				});
			}
		}

		return insertIdx;
	};

	var _getSelectedRowIdxs = function()
	{
		var selectedRows = _getDataRowsBySelectedUids(_obRightGridSelectedUids(), _selectedColGrid.dataSource);
		return selectedRows.map(function(row)
		{
			return _selectedColGrid.dataSource.data().indexOf(row);
		});
	};

	var _getUids = function(dataSource)
	{
		var uids = [];
		if (dataSource.data().length === 0)
		{
			return uids;
		}

		uids = $.map(dataSource.data(), function(dataItem)
		{
			return dataItem.uid;
		});

		return uids;
	};

	var _getDataRowsBySelectedUids = function(selectedUids, dataSource)
	{
		var dataRows = $.map(selectedUids, function(uid)
		{
			return dataSource.getByUid(uid);
		}.bind(this));
		return dataRows;
	};

	var _hightLightSelectedItems = function()
	{
		var items = _selectedColGrid.items();
		_obRightGridSelectedUids().forEach(function(uid)
		{
			$.map(items, function(item)
			{
				if (item.dataset[_KendoUid] == uid)
				{
					_selectedColGrid.select(item);
					return;
				}
			});
		});
	};

	var _removeDropTargetCursorTriangle = function()
	{
		$('#left-triangle').remove();
		$('#right-triangle').remove();
	};

	var _appendDropTargetCursorTriangle = function(targetItem, insertBeforeTarget)
	{
		var leftTriangle = $('<div id="left-triangle"></div>').addClass('drag-target-cursor-left-triangle');
		var rightTriangle = $('<div id="right-triangle"></div>').addClass('drag-target-cursor-right-triangle');

		leftTriangle.css("left", -1 + "px");
		rightTriangle.css("left", targetItem.width() - 14 + "px");

		if (insertBeforeTarget)
		{
			leftTriangle.css("top", "-6px");
			rightTriangle.css("top", "-6px");
		}

		targetItem.find('td:first').append(leftTriangle);
		targetItem.find('td:first').append(rightTriangle);
	};

	var _getHintElements = function(item, container, selectedColumns)
	{
		var hintElements = $('<div class="k-grid k-widget list-mover-drag-hint" style=""><table><tbody></tbody></table></div>'),
			maxWidth = container.width(), tooLong = false;
		hintElements.css({
			"background-color": "#FFFFCE",
			"opacity": 0.8,
			"cursor": "move"
		});
		if (selectedColumns == undefined)
		{
			tooLong = $(item).width() > maxWidth;
			hintElements.width(tooLong ? maxWidth : $(item).width());
			hintElements.find('tbody').append('<tr>' + (tooLong ? $(item.html())[0].outerHTML : item.html()) + '</tr>');
		}
		else
		{
			for (var i = 0; i < selectedColumns.length; i++)
			{
				if (selectedColumns[i].tagName === "SPAN") continue;
				tooLong = $(selectedColumns[i]).width() > maxWidth;
				hintElements.width(tooLong ? maxWidth : $(selectedColumns[i]).width());
				hintElements.find('tbody').append('<tr>' + (tooLong ? $($(selectedColumns[i]).html())[0].outerHTML : $(selectedColumns[i]).html()) + '</tr>');
			}
		}

		return hintElements;
	};

	var _clearRightSelection = function()
	{
		_obRightGridSelectedUids([]);
		_selectedColGrid.clearSelection();
	};

	var _clearLeftSelection = function()
	{
		_obLeftGridSelectedUids([]);
		_availableColGrid.clearSelection();
	};

	namespace.KendoListMoverControlViewModel = KendoListMoverControlViewModel;
})();

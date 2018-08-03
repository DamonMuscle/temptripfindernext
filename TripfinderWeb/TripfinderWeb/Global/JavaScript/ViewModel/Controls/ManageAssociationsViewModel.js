(function()
{
	var namespace = createNamespace("TF.Control");

	var _DataFiledName = 'DisplayName',
		_DataType = 'Type',
		_KendoUid = "kendoUid",
		_pageSize = 200,
		_GridConifg = namespace.GridConfig = {
			gridSchema: {
				model: {
					fields: {
						'FieldName': { type: "string" },
						'DisplayName': { type: "string" }
					}
				},
			},
			height: 400,
			selectable: TF.isMobileDevice ? "row" : "multiple"
		};

	var _availableGrid = null,
		_selectedGrid = null;

	function ManageAssociationsViewModel(selectedRecords, option, shortCutKeyHashMapKeyName)
	{
		this.shortCutKeyHashMapKeyName = shortCutKeyHashMapKeyName;
		this.option = option;
		this.leftMaxCount = 0;
		this.rightMaxCount = 0;
		this.obDocumentText = ko.observable((option.documentCount && option.documentCount > 1) ? "these documents" : "this document");
		this.obDataType = ko.observable("fieldtrip");

		this.obLeftCount = ko.observable(0);
		this.obRightCount = ko.observable(0);

		this.selectedRecords = selectedRecords.slice();
		this.obSelectedRecords = ko.observableArray(this.selectedRecords);

		this._obLeftGridSelectedUids = ko.observableArray();
		this._obRightGridSelectedUids = ko.observableArray();
		this.obTotalCount = ko.observable(0);
		this.currentCount = 0;

		this.leftSearchGrid = null;
		this.selectedColumns = null;
		this.leftInitialColumns = null;

		this.obLeftGridSelected = ko.computed(function()
		{
			return this._obLeftGridSelectedUids() && this._obLeftGridSelectedUids().length > 0;
		}, this);
		this.obRightGridSelected = ko.computed(function()
		{
			return this._obRightGridSelectedUids() && this._obRightGridSelectedUids().length > 0;
		}, this);

		//drop down list
		this.obDataTypeSource = ko.observableArray([
			{ value: "fieldtrip", text: "Field Trips" }]);
		this.obSelectedDataType = ko.observable(this.obDataTypeSource()[0]);
		this.obSelectedDataTypeText = ko.observable("Field Trips");
		this.obSelectedDataTypeText.subscribe(this.dataTypeChange, this);
	}

	ManageAssociationsViewModel.prototype.getDefaultColumms = function(gridType)
	{
		var columns = [];

		switch (gridType)
		{
			case "altsite":
			case "contractor":
			case "district":
			case "fieldtrip":
			case "fieldtriptemplate":
			case "georegion":
			case "school":
			case "trip":
				columns = [
					{
						FieldName: "Name",
						DisplayName: tf.applicationTerm.getApplicationTermSingularByName('Name'),
						Width: "150px",
						type: "string",
						isSortItem: true
					}];
				break;
			case "staff":
				columns = [
					{
						DBName: "first_name",
						FieldName: "FirstName",
						DisplayName: tf.applicationTerm.getApplicationTermSingularByName('First Name'),
						Width: "150px",
						type: "string",
						isSortItem: true
					}, {
						DBName: "last_name",
						FieldName: "LastName",
						DisplayName: tf.applicationTerm.getApplicationTermSingularByName('Last Name'),
						Width: "150px",
						type: "string",
						isSortItem: true
					}];
				break;
			case "student":
				columns = [
					{
						DBName: "first_name",
						FieldName: "FirstName",
						DisplayName: tf.applicationTerm.getApplicationTermSingularByName('First Name'),
						Width: "150px",
						type: "string",
						isSortItem: true
					}, {
						FieldName: "Mi",
						DisplayName: tf.applicationTerm.getApplicationTermSingularByName('Middle Initial'),
						Width: "150px",
						type: "string",
						isSortItem: true
					}, {
						DBName: "last_name",
						FieldName: "LastName",
						DisplayName: tf.applicationTerm.getApplicationTermSingularByName('Last Name'),
						Width: "150px",
						type: "string",
						isSortItem: true
					}];
				break;
			case "tripstop":
				columns = [
					{
						FieldName: "Street",
						DisplayName: "Street",
						Width: '330px',
						type: "string",
						isSortItem: true
					}];
				break;
			case "vehicle":
				columns = [
					{
						FieldName: "BusNum",
						DisplayName: "Vehicle",
						DBName: "Bus_Num",
						Width: '150px',
						type: "string",
						isSortItem: true
					}];
				break;
			default:
				break;
		}

		return columns;
	};

	ManageAssociationsViewModel.prototype.getTotalCount = function()
	{
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "document/associationscount"), { data: this.obDataTypeSource().map(function(item) { return item.value }) })
			.then(function(data)
			{
				if (data && data.Items && data.Items[0])
				{
					this.obTotalCount(data.Items[0]);
				}
			}.bind(this));
	};

	ManageAssociationsViewModel.prototype.getAvailable = function(selectType)
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), selectType))
			.then(function(data)
			{
				this.availableRecords = [];
				var selectedIds = Enumerable.From(this.obSelectedRecords()).Where(function(d)
				{
					return d.FieldType == selectType;
				}).Select(function(d) { return d.Id }).ToArray(),
					name, displayType;
				this._selectType = selectType;
				this.currentCount = data.Items.length;
				for (var i in data.Items)
				{
					if (selectedIds.indexOf(data.Items[i].Id) == -1)
					{
						name = tf.EntityHelper.getEntityName(selectType, data.Items[i]);
						displayType = tf.EntityHelper.getEntityType(selectType).display;
						if (!!name && !!displayType)
						{
							this.availableRecords.push({
								DisplayName: name,
								FieldName: name,
								Id: data.Items[i].Id,
								Type: displayType,
								FieldType: selectType
							});
						}
					}
				}
				this.availableRecords = this.availableRecords.slice();
				this.obAvailableRecords(this.availableRecords);

			}.bind(this));
	};

	ManageAssociationsViewModel.prototype.init = function(viewModel, el)
	{
		this.getTotalCount()
			.then(function()
			{
				var allColumns = TF.Grid.FilterHelper.getGridDefinitionByType("fieldtrip").Columns.slice(0);

				this.availableGridContainer = $(el).find(".availablecolumngrid-container");
				this.selectedGridContainer = $(el).find(".selectedcolumngrid-container");

				this.initRightGrid();
				this.initLeftGrid();

				this.bindLeftGridDraggable();
				this.bindRightGridDraggable();
				this.bindLeftGridDropTarget();
				this.bindRightGridDropTarget();

				this.getSelectedUids = ko.observableArray([]);
				this.getSelectedUids.subscribe(this._selectedUidsChange, this);
				this.onCtrlIPress = this.onCtrlIPress.bind(this);
				this.onCtrlAPress = this.onCtrlAPress.bind(this);
				if (_GridConifg.selectable.indexOf("multiple") != -1)
				{
					tf.shortCutKeys.bind("ctrl+a", this.onCtrlAPress, this.shortCutKeyHashMapKeyName);
					tf.shortCutKeys.bind("ctrl+i", this.onCtrlIPress, this.shortCutKeyHashMapKeyName);
				}
				this.availableGridContainer.on("dblclick", "tr.k-state-selected", function()
				{
					this.toRightClick();
				}.bind(this));

				this.selectedGridContainer.on("dblclick", "tr.k-state-selected", function()
				{
					this.toLeftClick();
				}.bind(this));
			}.bind(this));
	};

	ManageAssociationsViewModel.prototype.selectionAll = function()
	{
		var data = this.getUidsWithCurrentFiltering();
		if (data) { this.getSelectedUids(data); }
	};

	ManageAssociationsViewModel.prototype.invertSelection = function()
	{
		var data = this.getUidsWithCurrentFiltering();
		if (!data)
			return;
		var selectedItems;
		if (this.obLeftGridSelected())
		{
			selectedItems = this._obLeftGridSelectedUids();
		}
		else if (this.obRightGridSelected())
		{
			selectedItems = this._obRightGridSelectedUids();
		}
		var Uids = data;
		var selectedUid = Enumerable.From(selectedItems);
		var selectedUids = Uids.filter(function(uid)
		{
			return !selectedUid.Contains(uid);
		});
		this.getSelectedUids(selectedUids);
	};

	ManageAssociationsViewModel.prototype.onCtrlAPress = function(e, keyCombination)
	{
		this.selectionAll();
		e.preventDefault(); // Defence code
	};

	ManageAssociationsViewModel.prototype.onCtrlIPress = function(e, keyCombination)
	{
		this.invertSelection();
		e.preventDefault(); // Prevent add page to bookmark by IE
	};

	ManageAssociationsViewModel.prototype.getUidsWithCurrentFiltering = function()
	{
		if (this.obLeftGridSelected())
		{
			return this.availableGridContainer.data("kendoGrid").dataSource.data().map(
				function(item) { return item["uid"] }
			);
		}
		else if (this.obRightGridSelected())
		{
			return _selectedGrid.dataSource.data().map(
				function(item) { return item["uid"] }
			);
		}
		return false;
	};

	ManageAssociationsViewModel.prototype._selectedUidsChange = function()
	{
		var selectedAreaKendoGrid;
		if (this.obLeftGridSelected())
		{
			selectedAreaKendoGrid = this.availableGridContainer.data("kendoGrid");
		}
		else if (this.obRightGridSelected())
		{
			selectedAreaKendoGrid = this.selectedGridContainer.data("kendoGrid");
		}
		if (selectedAreaKendoGrid)
		{
			var selected = $.map(selectedAreaKendoGrid.items(), function(item)
			{
				var row = $(item).closest("tr");
				var dataItem = selectedAreaKendoGrid.dataItem(row);
				var selectedUid = Enumerable.From(this.getSelectedUids());
				if (dataItem && dataItem.uid && selectedUid.Contains(dataItem.uid))
				{
					return item;
				}
			}.bind(this));
			selectedAreaKendoGrid.clearSelection();
			selectedAreaKendoGrid.select(selected);
		}
	};

	ManageAssociationsViewModel.prototype.onLeftGridChange = function()
	{
		var selected = $.map(this.availableGridContainer.data("kendoGrid").select(), function(item)
		{
			return item.dataset[_KendoUid];
		}.bind(this));
		this._obLeftGridSelectedUids(selected);

		if (this._obLeftGridSelectedUids().length !== 0)
		{
			this._clearRightSelection();
		}
	};

	ManageAssociationsViewModel.prototype.onRightGridChange = function()
	{
		var selected = $.map(this.selectedGridContainer.data("kendoGrid").select(), function(item)
		{
			return item.dataset[_KendoUid];
		}.bind(this));
		this._obRightGridSelectedUids(selected);
		this._rebuildRightGrid();

		if (this._obRightGridSelectedUids().length !== 0)
		{
			this._clearLeftSelection();
		}
	};

	var _cancelKendoGridSelectedArea = function(kendoGrid)
	{
		if (kendoGrid)
		{
			kendoGrid.selectable.userEvents.unbind("start");
			kendoGrid.selectable.userEvents.unbind("move");
			kendoGrid.selectable.userEvents.unbind("end");
		}
	};

	ManageAssociationsViewModel.prototype.initLeftGrid = function()
	{
		var selectedType = this.obSelectedDataType().value;
		this.selectedColumns = this.getCurrentSelectedColumns(selectedType) || this.getDefaultColumms(selectedType).slice(0);
		this.leftInitialColumns = this.selectedColumns.slice(0);

		var options = {
			gridDefinition: {
				Columns: this.selectedColumns
			},
			url: pathCombine(tf.api.apiPrefix(), "search", selectedType),
			isSmallGrid: true,
			height: 400,
			showBulkMenu: false,
			showLockedColumn: false,
			setRequestOption: this.setRequestOption.bind(this),
			onDataBound: function()
			{
				_availableGrid = this.availableGridContainer.data("kendoGrid");
				this.obLeftCount(_availableGrid.dataSource._total);
				_cancelKendoGridSelectedArea(_availableGrid);
				this._rebuildLeftGrid(this.availableGridContainer);
			}.bind(this)
		};

		this.leftSearchGrid = new TF.Grid.LightKendoGrid(this.availableGridContainer, options);
		this.leftSearchGrid.onRowsChanged.subscribe(this.onLeftGridChange.bind(this));
	};

	ManageAssociationsViewModel.prototype._rebuildLeftGrid = function(leftGrid)
	{
		leftGrid.find(".pageInfo").append("&nbsp;" + this.obSelectedDataTypeText());
	}

	ManageAssociationsViewModel.prototype.setColumnCurrentFilterIcon = function()
	{
		this.availableGridContainer.find(".k-filtercell .k-dropdown-wrap .k-input").each(function(i, item)
		{
			var $item = $(item),
				text = $item.text();
			for (var key in this.filterNames)
			{
				if (text === key)
				{
					$item.next().children(".k-filter").addClass(this.filterNames[key]);
				}
			}
		}.bind(this));
	};

	ManageAssociationsViewModel.prototype.filterNames = {
		'Contains': 'contains',
		'Equal To': 'isequalto',
		'Not Equal To': 'isnotequalto',
		'Starts With': 'startswith',
		'Does Not Contain': 'doesnotcontain',
		'Ends With': 'endswith',
		'Empty': 'isempty',
		'Not Empty': 'isnotempty'
	};

	ManageAssociationsViewModel.prototype.initRightGrid = function()
	{
		this.selectedGridContainer.kendoGrid({
			dataSource: new kendo.data.DataSource({
				data: this.selectedRecords,
				schema: _GridConifg.gridSchema,
				sort: [{ field: _DataType, dir: "asc" }, { field: _DataFiledName, dir: "asc" }]
			}),
			columns: [
				{
					field: _DataFiledName,
					title: tf.applicationTerm.getApplicationTermSingularByName("Name")
				},
				{
					field: _DataType,
					title: "Data Type",
					width: '120px'
				}
			],
			pageable: {
				numeric: false,
				previousNext: false,
			},
			scrollable: {
				virtual: true
			},
			height: _GridConifg.height,
			selectable: _GridConifg.selectable,
			change: function()
			{
				this.onRightGridChange();
			}.bind(this),
			dataBound: function()
			{
				_selectedGrid = this.selectedGridContainer.data("kendoGrid");
				_cancelKendoGridSelectedArea(_selectedGrid);
				this._rebuildRightGrid();
			}.bind(this),
		});

		this.initGridScrollBar(this.selectedGridContainer);
	};

	ManageAssociationsViewModel.prototype._rebuildRightGrid = function()
	{
		if (!_selectedGrid)
		{
			return;
		}
		this.obRightCount(_selectedGrid.dataSource.data().length);
		var $bottom = this.selectedGridContainer.find('.k-pager-wrap.k-grid-pager');
		$bottom.css("padding", "4px 7px 4px 7px")
		$bottom.html("<span class='grid-info' style='float:left'>" + this.obRightCount() + " of " + this.obTotalCount() + (this._obRightGridSelectedUids().length > 0 ? " (" + this._obRightGridSelectedUids().length + " selected)" : "") + "</span>");

		if (this.selectedGridContainer.data("kendoGrid").dataSource.data().length === 0)
		{
			if (this.selectedGridContainer.find('.grid-notification').length === 0)
			{
				this.selectedGridContainer.append('<div class="grid-notification" style="position:absolute;top:48px;left:15px;font-size:12px;color:#666666">There are no matching records.</div>');
			}
		}
		else
		{
			this.selectedGridContainer.find('.grid-notification').remove();
		}
	};

	ManageAssociationsViewModel.prototype.initGridScrollBar = function(container)
	{
		var $gridContent = container.find(".k-grid-content");
		$gridContent.css({
			"overflow-y": "auto"
		});

		if ($gridContent[0].clientHeight == $gridContent[0].scrollHeight)
		{
			$gridContent.find("colgroup col:last").css({
				width: 120
			});
		}
		else
		{
			$gridContent.find("colgroup col:last").css({
				width: 120
			});
		}
	};

	ManageAssociationsViewModel.prototype.bindLeftGridDraggable = function()
	{
		this.availableGridContainer.kendoDraggable({
			filter: "tbody > tr",
			threshold: 100,
			holdToDrag: TF.isMobileDevice,
			cursorOffset: { top: -10, left: -10 },
			hint: function(e)
			{
				if (e.hasClass("k-state-selected"))
				{
					var selectedRecords = this.availableGridContainer.find('.k-state-selected')
					return _getHintElements(e, this.availableGridContainer, selectedRecords);
				}
				else
				{
					return _getHintElements(e, this.availableGridContainer);
				}
			}.bind(this),
			dragstart: function(e)
			{
			}.bind(this),
			autoScroll: true,
			dragend: function(e)
			{
				$(".list-mover-drag-hint").hide();
			}.bind(this)
		});
	};

	ManageAssociationsViewModel.prototype.bindRightGridDraggable = function()
	{
		this.selectedGridContainer.kendoDraggable({
			filter: "tbody > tr",
			threshold: 100,
			holdToDrag: TF.isMobileDevice,
			autoScroll: true,
			hint: function(e)
			{
				if (e.hasClass("k-state-selected"))
				{
					var selectedRecords = this.selectedGridContainer.find('.k-state-selected')
					return _getHintElements(e, this.selectedGridContainer, selectedRecords);
				}
				else
				{
					return _getHintElements(e, this.selectedGridContainer);
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

	ManageAssociationsViewModel.prototype.bindLeftGridDropTarget = function()
	{
		this.availableGridContainer.kendoDropTarget({
			drop: function(e)
			{
				e.draggable.hint.hide();
				if (!e.draggable.currentTarget.hasClass("k-state-selected"))
				{
					var selectedUid = e.draggable.currentTarget.data().kendoUid;
					var selectedItem = _selectedGrid.dataItems().filter(function(dataItem)
					{
						return dataItem.uid === selectedUid;
					});
					if (!selectedItem || selectedItem.length <= 0)
					{ return; }
					this._obRightGridSelectedUids([selectedUid]);
				}
				this._moveToLeft(this._obRightGridSelectedUids());
			}.bind(this)
		});
	};

	ManageAssociationsViewModel.prototype.bindRightGridDropTarget = function()
	{
		this.selectedGridContainer.kendoDropTarget({
			drop: function(e)
			{
				e.draggable.hint.hide();
				if (!e.draggable.currentTarget.hasClass("k-state-selected"))
				{
					var selectedUid = e.draggable.currentTarget.data().kendoUid;
					var selectedItem = this.leftSearchGrid.kendoGrid.dataItems().filter(function(dataItem)
					{
						return dataItem.uid === selectedUid;
					});
					if (!selectedItem || selectedItem.length <= 0)
					{ return; }
					this._obLeftGridSelectedUids([selectedUid]);
				}
				this._moveToRight(this._obLeftGridSelectedUids());
			}.bind(this)
		});
	};

	ManageAssociationsViewModel.prototype.dataTypeChange = function()
	{
		this.availableGridContainer.empty();
		this.initLeftGrid();
	}

	ManageAssociationsViewModel.prototype.toAllRightClick = function()
	{
		this._moveAllToRight();
	};

	ManageAssociationsViewModel.prototype.toRightClick = function()
	{
		this._moveToRight(this._obLeftGridSelectedUids());
	};

	ManageAssociationsViewModel.prototype.toLeftClick = function()
	{
		this._moveToLeft(this._obRightGridSelectedUids());
	};

	ManageAssociationsViewModel.prototype.toAllLeftClick = function()
	{
		this._moveAllToLeft();
	};

	ManageAssociationsViewModel.prototype.apply = function()
	{
		return Promise.resolve(this.obSelectedRecords());
	};

	ManageAssociationsViewModel.prototype._moveToLeft = function(itemUids)
	{
		var count = itemUids.length;

		if (count == 0 && itemUids.length <= 0) { return; }

		var selectedType = this.obSelectedDataType().value, idx,
			movingRows = [], row,
			rightGridDataSource = _selectedGrid.dataSource;

		if (itemUids.length === 1)
		{
			row = rightGridDataSource.getByUid(itemUids[0]);
			rightGridDataSource.remove(row);
		}
		else if (rightGridDataSource.data().length > 20000 && count < 5)
		{
			for (idx = 0; idx < count; idx++)
			{
				row = rightGridDataSource.getByUid(itemUids[idx]);
				rightGridDataSource.remove(row);
			}
		}
		else
		{
			var gridData = toJSON(rightGridDataSource.data()), deleteCount = 0;

			for (idx = gridData.length; idx > 0; idx--)
			{
				if (itemUids.indexOf(gridData[idx - 1].uid) !== -1)
				{
					gridData.splice(idx - 1, 1);
					deleteCount++;
				}
				if (deleteCount === count) { break; count }
			}
			rightGridDataSource.data(gridData);
		}

		this.leftSearchGrid.refresh();
		this.obSelectedRecords(_selectedGrid.dataSource.data());
		_selectedGrid.clearSelection();
	};

	ManageAssociationsViewModel.prototype._moveToRight = function(itemUids)
	{
		var count = this.leftSearchGrid.getSelectedIds().length;

		if (count == 0 && itemUids.length <= 0) { return; }

		var selectedType = this.obSelectedDataType().value,
			displayType = tf.EntityHelper.getEntityType(selectedType).display,
			movingRows = [], idx;

		if (itemUids.length === 1)
		{
			var row;
			row = _availableGrid.dataSource.getByUid(itemUids[0]);
			movingRows.push({
				DisplayName: tf.EntityHelper.getEntityName(selectedType, row),
				Type: displayType,
				FieldType: selectedType,
				Id: row.Id,
			});
			this.applyRowsMovementToRight(movingRows);
		}
		else if (count > 100 || count != itemUids.length)
		{
			var selectedIds = this.leftSearchGrid.getSelectedIds().sort(function(a, b) { return a - b; });
			tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), selectedType, "getEntityNames"), { data: selectedIds })
				.then(function(response)
				{
					for (idx = 0; idx < count; idx++)
					{
						movingRows.push({
							DisplayName: response.Items[idx],
							Type: displayType,
							FieldType: selectedType,
							Id: selectedIds[idx],
						});
					}
					this.applyRowsMovementToRight(movingRows);
				}.bind(this));
		}
		else
		{
			var row;
			for (idx = 0; idx < count; idx++)
			{
				row = _availableGrid.dataSource.getByUid(itemUids[idx]);
				movingRows.push({
					DisplayName: tf.EntityHelper.getEntityName(selectedType, row),
					Type: displayType,
					FieldType: selectedType,
					Id: row.Id,
				});
			}
			this.applyRowsMovementToRight(movingRows);
		}
		_availableGrid.clearSelection();
	}

	ManageAssociationsViewModel.prototype._moveAllToRight = function()
	{
		this.leftSearchGrid.getIdsWithCurrentFiltering()
			.then(function(ids)
			{
				var count = ids.length;

				if (count == 0) { return; }

				var selectedType = this.obSelectedDataType().value,
					displayType = tf.EntityHelper.getEntityType(selectedType).display,
					movingRows = [], idx;

				if (count > 100)
				{
					ids = ids.sort(function(a, b) { return a - b; });
					tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), selectedType, "getEntityNames"), { data: ids })
						.then(function(response)
						{
							for (idx = 0; idx < count; idx++)
							{
								movingRows.push({
									DisplayName: response.Items[idx],
									Type: displayType,
									FieldType: selectedType,
									Id: ids[idx],
								});
							}
							this.applyRowsMovementToRight(movingRows);
						}.bind(this));
				}
				else
				{
					var row;
					for (idx = 0; idx < count; idx++)
					{
						row = _availableGrid.dataSource.data()[idx];
						movingRows.push({
							DisplayName: tf.EntityHelper.getEntityName(selectedType, row),
							Type: displayType,
							FieldType: selectedType,
							Id: row.Id,
						});
					}
					this.applyRowsMovementToRight(movingRows);
				}
			}.bind(this));
	}

	ManageAssociationsViewModel.prototype._moveAllToLeft = function()
	{
		_selectedGrid.dataSource.data().empty();
		this.leftSearchGrid.refresh();
	}

	ManageAssociationsViewModel.prototype.applyRowsMovementToRight = function(rows)
	{
		if (_selectedGrid.dataSource.data().length > 20000 && rows.length < 5)
		{
			_selectedGrid.dataSource.pushUpdate(rows);
		}
		else
		{
			_selectedGrid.dataSource.data(_selectedGrid.dataSource.data().toJSON().concat(rows));
		}
		this.obSelectedRecords(_selectedGrid.dataSource.data());
		this.leftSearchGrid.refresh();
	};

	ManageAssociationsViewModel.prototype._clearRightSelection = function()
	{
		this._obRightGridSelectedUids([]);
		_selectedGrid.clearSelection();
	};

	ManageAssociationsViewModel.prototype._clearLeftSelection = function()
	{
		this._obLeftGridSelectedUids([]);
		this.availableGridContainer.data("kendoGrid").clearSelection();
	};

	ManageAssociationsViewModel.prototype.addRemoveColumnClick = function(viewModel, el)
	{
		var initHiddenLockedField = function(column)
		{
			if (typeof (column.hidden) == "undefined")
			{
				column.hidden = false;
			}
			if (typeof (column.locked) == "undefined")
			{
				column.locked = false;
			}
		};

		var gridType = this.obSelectedDataType().value,
			selectedFieldNames = this.selectedColumns.map(function(column) { return column.FieldName; }),
			availableColumns = $.grep(TF.Grid.FilterHelper.getGridDefinitionByType(gridType).Columns.slice(0), function(column)
			{
				return !!column.FieldName && selectedFieldNames.indexOf(column.FieldName) === -1;
			});

		availableColumns = availableColumns.filter(function(item)
		{
			return !item.onlyForFilter;
		});

		availableColumns.forEach(function(item)
		{
			initHiddenLockedField(item);
		});

		var p1 = TF.UserDefinedFieldUtil.prototype.loadUserDefinedLabel(gridType).then(function()
		{
			return TF.UserDefinedFieldUtil.prototype.mergeUserDefinedLabel(availableColumns);
		});
		var p2 = TF.UserDefinedFieldUtil.prototype.loadUserDefinedLabel(gridType).then(function()
		{
			return TF.UserDefinedFieldUtil.prototype.mergeUserDefinedLabel(this.selectedColumns);
		}.bind(this));
		Promise.all([p1, p2]).then(function()
		{

			tf.modalManager.showModal(
				new TF.Modal.Grid.EditKendoColumnModalViewModel(
					availableColumns,
					this.selectedColumns,
					this.leftInitialColumns
				)
			).then(function(vm)
			{
				if (!vm) { return; }
				this.selectedColumns = vm.selectedColumns;
				this.leftSearchGrid._gridDefinition.Columns = this.selectedColumns;
				this.leftSearchGrid.rebuildGrid();
				this.saveCurrentSelectedColumns(gridType, this.selectedColumns);
			}.bind(this));
		}.bind(this));
	};

	ManageAssociationsViewModel.prototype.setRequestOption = function(requestOptions)
	{
		var excludeIds = [], selectedType = this.obSelectedDataType().value;
		_selectedGrid.dataSource.data().forEach(function(item)
		{
			if (item.FieldType === selectedType)
			{
				excludeIds.push(item.Id);
			}
		});

		requestOptions.data.idFilter.ExcludeAny = excludeIds;

		return requestOptions;
	};

	ManageAssociationsViewModel.prototype.saveCurrentSelectedColumns = function(gridType, columns)
	{
		return tf.storageManager.save(tf.storageManager.DocumentAssociationLeftGridSelectedColumns(gridType, tf.authManager.authorizationInfo.authorizationTree.username), columns);
	};

	ManageAssociationsViewModel.prototype.getCurrentSelectedColumns = function(gridType)
	{
		return tf.storageManager.get(tf.storageManager.DocumentAssociationLeftGridSelectedColumns(gridType, tf.authManager.authorizationInfo.authorizationTree.username));
	};

	var _getHintElements = function(item, container, selectedRecords)
	{
		var hintElements = $('<div class="k-grid k-widget list-mover-drag-hint" style="width:500px"><table><tbody></tbody></table></div>'),
			maxWidth = container.width(), tooLong = false;
		hintElements.css({
			"background-color": "#F5F5DC",
			"opacity": 0.8,
			"cursor": "move"
		});
		if (selectedRecords == undefined)
		{
			tooLong = $(item).width() > maxWidth;
			hintElements.width(tooLong ? maxWidth : $(item).width());
			hintElements.find('tbody').append('<tr>' + (tooLong ? $(item.html())[0].outerHTML : item.html()) + '</tr>');
		}
		else
		{
			for (var i = 0; i < selectedRecords.length; i++)
			{
				if (selectedRecords[i].tagName === "SPAN") continue;
				tooLong = $(selectedRecords[i]).width() > maxWidth;
				hintElements.width(tooLong ? maxWidth : $(selectedRecords[i]).width());
				hintElements.find('tbody').append('<tr>' + (tooLong ? $($(selectedRecords[i]).html())[0].outerHTML : $(selectedRecords[i]).html()) + '</tr>');
			}
		}

		return hintElements;
	};

	var toJSON = function(data)
	{
		var idx, length = data.length, value, json = new Array(length);
		var requiredFields = ['DisplayName', 'FieldName', 'FieldType', 'Id', 'Type', 'locked', 'uid'];

		for (idx = 0; idx < length; idx++)
		{
			value = data[idx];
			result = {};
			for (field in value)
			{
				if (requiredFields.indexOf(field) != -1)
				{
					result[field] = value[field];
				}
			}
			json[idx] = result;
		}

		return json;
	};

	var removeItemInArray = function(array, item)
	{
		var idx, length = array.length;

		for (idx = 0; idx < length; idx++)
		{
			if (array[idx] === item)
			{
				array.splice(idx, 1);
				break;
			}
		}
	};

	namespace.ManageAssociationsViewModel = ManageAssociationsViewModel;
})();

(function()
{
	var namespace = createNamespace("TF.Grid");

	var _DataFiledName = 'DisplayName',
		_KendoUid = "kendoUid",
		_keyPressName = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"],
		_GridConifg = namespace.GridConfig = {
			gridSchema: {
				model: {
					fields: {
						'FieldName': {
							type: "string"
						},
						'DisplayName': {
							type: "string"
						}
					}
				},
			},
			gridColumns: [{
				field: _DataFiledName,
				title: "Name"
			},
			],
			height: 400,
			selectable: TF.isMobileDevice ? "row" : "multiple"
		};

	var _availableColGrid = null,
		_selectedColGrid = null,
		_obLeftGridSelectedUids = ko.observableArray(),
		_obRightGridSelectedUids = ko.observableArray();

	var _totalColumnsCount = 0;

	function EditKendoColumnViewModel(availableColumns, selectedColumns, defaultLayoutColumns, shortCutKeyHashMapKeyName)
	{
		this.shortCutKeyHashMapKeyName = shortCutKeyHashMapKeyName;

		this.obavailableColumns = ko.observableArray();
		this.obselectedColumns = ko.observableArray();

		this.availableColumns = _fillDisplayName(availableColumns).slice().sort(_sortByDisplayName);
		this.selectedColumns = _fillDisplayName(selectedColumns).slice();
		this.defaultLayoutColumns = defaultLayoutColumns? defaultLayoutColumns.slice() : [];

		this.obavailableColumns(this.availableColumns);
		this.obselectedColumns(this.selectedColumns);
		this.focusedGridName = 'available';
		_totalColumnsCount = this.availableColumns.length + this.selectedColumns.length;

		this.obLeftGridSelected = ko.computed(function()
		{
			return _obLeftGridSelectedUids() && _obLeftGridSelectedUids().length > 0;
		}, this);
		this.obRightGridSelected = ko.computed(function()
		{
			return _obRightGridSelectedUids() && _obRightGridSelectedUids().length > 0;
		}, this);

		//key press in available table
		tf.shortCutKeys.bind(_keyPressName, this.onKeyPress.bind(this), this.shortCutKeyHashMapKeyName);
		this.obErrorMessage = ko.observable("");

		this.obEnabledMoveUp = ko.computed(function()
		{
			if (_obRightGridSelectedUids() && _obRightGridSelectedUids().length > 0)
			{
				var idxs = _getSelectedRowIdxs();
				var maxindex = Math.min.apply({}, idxs);
				if (maxindex <= 0) //actually it should compare with 0
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
				if (minindex >= _selectedColGrid.dataSource.data().length) //actually it should compare with 0
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
	}

	EditKendoColumnViewModel.prototype.init = function(viewModel, el)
	{
		this.availableColGridContainer = $(el).find(".availablecolumngrid-container");
		this.selectedColGridContainer = $(el).find(".selectedcolumngrid-container");
		$(el).bootstrapValidator();

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
			tf.shortCutKeys.bind("ctrl+a", this.onCtrlAPress, this.shortCutKeyHashMapKeyName);
			tf.shortCutKeys.bind("ctrl+i", this.onCtrlIPress, this.shortCutKeyHashMapKeyName);
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

		this.availableColGridContainer.bind("click", function()
		{
			this.focusedGridName = "available";
			_availableColGrid.element.focus();
		}.bind(this));
		this.selectedColGridContainer.bind("click", function()
		{
			this.focusedGridName = "selected";
			_selectedColGrid.element.focus();
		}.bind(this));
	};

	EditKendoColumnViewModel.prototype.selectionAll = function()
	{
		var data = this.getUidsWithCurrentFiltering();
		if (data)
			this.getSelectedUids(data);
	};

	EditKendoColumnViewModel.prototype.invertSelection = function()
	{
		var data = this.getUidsWithCurrentFiltering();
		if (!data)
			return;
		var selectedItems;
		if (this.obLeftGridSelected())
		{
			selectedItems = _obLeftGridSelectedUids();
		} else if (this.obRightGridSelected())
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

	EditKendoColumnViewModel.prototype.onCtrlAPress = function(e, keyCombination)
	{
		this.selectionAll();
		e.preventDefault(); // Defence code
	};

	EditKendoColumnViewModel.prototype.onCtrlIPress = function(e, keyCombination)
	{
		this.invertSelection();
		e.preventDefault(); // Prevent add page to bookmark by IE
	};

	EditKendoColumnViewModel.prototype.getUidsWithCurrentFiltering = function()
	{
		if (this.obLeftGridSelected())
		{
			return _availableColGrid.dataSource.data().map(
				function(item)
				{
					return item["uid"]
				}
			);
		} else if (this.obRightGridSelected())
		{
			return _selectedColGrid.dataSource.data().map(
				function(item)
				{
					return item["uid"]
				}
			);
		}
		return false;
	};

	EditKendoColumnViewModel.prototype._selectedUidsChange = function()
	{
		var self = this;
		var selectedAreaKendoGrid;
		if (this.obLeftGridSelected())
		{
			selectedAreaKendoGrid = this.availableColGridContainer.data("kendoGrid");
		} else if (this.obRightGridSelected())
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

	EditKendoColumnViewModel.prototype.careteKendoDropTargetEvent = function()
	{
		this.selectedColGridContainer.find("tbody tr").kendoDropTarget({
			dragenter: function(e)
			{
				targetItem = $(e.dropTarget[0]);
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

	EditKendoColumnViewModel.prototype.onLeftGridChange = function(arg)
	{
		var grid = _availableColGrid,
			selected = $.map(grid.select(), function(item)
			{
				return item.dataset[_KendoUid];
			});
		_obLeftGridSelectedUids(selected);

		if (_obLeftGridSelectedUids().length !== 0)
		{
			_clearRightSelection();
		}

		var bottomDom = TF.Grid.EditKendoColumnViewModel._buildGridBottom(
			grid.dataItems().length,
			grid.select().length,
			_totalColumnsCount
		);
		grid.wrapper.find(".k-pager-wrap").html(bottomDom);
	};

	EditKendoColumnViewModel.prototype.onRightGridChange = function(arg)
	{
		var grid = _selectedColGrid,
			selected = $.map(grid.select(), function(item)
			{
				return item.dataset[_KendoUid];
			});
		_obRightGridSelectedUids(selected);

		if (_obRightGridSelectedUids().length !== 0)
		{
			_clearLeftSelection();
		}

		var bottomDom = TF.Grid.EditKendoColumnViewModel._buildGridBottom(
			grid.dataItems().length,
			grid.select().length,
			_totalColumnsCount
		);
		grid.wrapper.find(".k-pager-wrap").html(bottomDom);
	};

	EditKendoColumnViewModel._buildGridBottom = function(filteredRecordCount, selectedRecordCount, totalColumnsCount)
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

	EditKendoColumnViewModel.prototype.initLeftGrid = function()
	{
		var self = this;
		_availableColGrid = null;
		this.availableColGridContainer.kendoGrid({
			dataSource: new kendo.data.DataSource({
				data: this.availableColumns,
				schema: _GridConifg.gridSchema
			}),
			columns: _GridConifg.gridColumns,
			height: _GridConifg.height,
			selectable: _GridConifg.selectable,
			change: this.onLeftGridChange.bind(this),
			pageable: {},
			dataBound: function()
			{
				var bottomDom = TF.Grid.EditKendoColumnViewModel._buildGridBottom(
					this.dataItems().length,
					this.select().length,
					_totalColumnsCount
				);
				self.availableColGridContainer.find(".k-pager-wrap").html(bottomDom);
			}
		});
		_availableColGrid = this.availableColGridContainer.data("kendoGrid");
		_cancelKendoGridSelectedArea(_availableColGrid);
		_availableColGrid.shortcutExtender = new TF.KendoGridNavigator({ grid: _availableColGrid });
		this.initGridScrollBar(this.availableColGridContainer);
		return _availableColGrid;
	};

	EditKendoColumnViewModel.prototype.initRightGrid = function()
	{
		var self = this;
		_selectedColGrid = null;
		this.selectedColGridContainer.kendoGrid({
			dataSource: new kendo.data.DataSource({
				data: this.selectedColumns,
				schema: _GridConifg.gridSchema
			}),
			columns: _GridConifg.gridColumns,
			height: _GridConifg.height,
			selectable: _GridConifg.selectable,
			change: this.onRightGridChange.bind(this),
			pageable: {},
			dataBound: function()
			{
				var bottomDom = TF.Grid.EditKendoColumnViewModel._buildGridBottom(
					this.dataItems().length,
					this.select().length,
					_totalColumnsCount
				);
				self.selectedColGridContainer.find(".k-pager-wrap").html(bottomDom);
			}
		});
		_selectedColGrid = this.selectedColGridContainer.data("kendoGrid");
		_cancelKendoGridSelectedArea(_selectedColGrid);
		_selectedColGrid.shortcutExtender = new TF.KendoGridNavigator({ grid: _selectedColGrid });
		this.initGridScrollBar(this.selectedColGridContainer);
		return _selectedColGrid;
	};

	EditKendoColumnViewModel.prototype.initGridScrollBar = function(container)
	{
		var $gridContent = container.find(".k-grid-content");
		$gridContent.css({
			"overflow-y": "auto"
		});


		if ($gridContent[0].clientHeight == $gridContent[0].scrollHeight)
		{
			$gridContent.find("colgroup col:last").css({
				width: 77
			});
		} else
		{
			$gridContent.find("colgroup col:last").css({
				width: 60
			});
		}
	};

	EditKendoColumnViewModel.prototype.bindLeftGridDraggable = function()
	{
		this.availableColGridContainer.kendoDraggable({
			filter: "tbody > tr",
			threshold: 100,
			holdToDrag: TF.isMobileDevice,
			hint: function(e)
			{
				if (e.hasClass("k-state-selected"))
				{
					var selectedColumns = this.availableColGridContainer.find('.k-state-selected')
					return _getHintElements(e, selectedColumns);
				} else
				{
					return _getHintElements(e);
				}
			}.bind(this),
			dragstart: function(e) { }.bind(this),
			autoScroll: true
		});
	};

	EditKendoColumnViewModel.prototype.bindRightGridDraggable = function()
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
					var selectedColumns = this.selectedColGridContainer.find('.k-state-selected')
					return _getHintElements(e, selectedColumns);
				} else
				{
					return _getHintElements(e);
				}
			}.bind(this),
			dragstart: function(e) { }.bind(this),
		});
	};

	EditKendoColumnViewModel.prototype.bindLeftGridDropTarget = function()
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
				_sortAvailableGrid();
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

	EditKendoColumnViewModel.prototype.bindRightGridDropTarget = function()
	{
		this.selectedColGridContainer.kendoDropTarget({
			dragenter: function(e)
			{
				var selectedColItems = this.selectedColGridContainer.find('tr');
				var targetItem;
				var insertBeforeTarget;
				if (e.draggable.hint.offset().top < $('.selectedcolumngrid-container .k-grid-content').offset().top)
				{
					targetItem = $(selectedColItems[1]);
					targetItem.addClass("drag-target-insert-before-cursor"); //modify dropTarget element
					insertBeforeTarget = true;
				} else
				{
					targetItem = $(selectedColItems[selectedColItems.length - 1]);
					targetItem.addClass("drag-target-insert-after-cursor");
				}

				_removeDropTargetCursorTriangle();
				_appendDropTargetCursorTriangle(targetItem, insertBeforeTarget);
			}.bind(this),
			dragleave: function(e)
			{
				var selectedColItems = this.selectedColGridContainer.find('tr');
				selectedColItems.removeClass("drag-target-insert-before-cursor");
				selectedColItems.removeClass("drag-target-insert-after-cursor"); //modify dropTarget element

				_removeDropTargetCursorTriangle();

			}.bind(this),
			drop: _selectedDrop.bind(this)
		});
	};

	EditKendoColumnViewModel.prototype.toAllRightClick = function()
	{
		this._moveItem(_getUids(_availableColGrid.dataSource), _availableColGrid.dataSource, _selectedColGrid.dataSource);
	};

	EditKendoColumnViewModel.prototype.toRightClick = function()
	{
		this._moveItem(_obLeftGridSelectedUids(), _availableColGrid.dataSource, _selectedColGrid.dataSource);
	};

	EditKendoColumnViewModel.prototype.toLeftClick = function()
	{
		this._moveItem(_obRightGridSelectedUids(), _selectedColGrid.dataSource, _availableColGrid.dataSource);
		_sortAvailableGrid();
	};

	EditKendoColumnViewModel.prototype.toAllLeftClick = function()
	{
		this._moveItem(_getUids(_selectedColGrid.dataSource), _selectedColGrid.dataSource, _availableColGrid.dataSource);
		_sortAvailableGrid();
	};

	EditKendoColumnViewModel.prototype.toTopClick = function()
	{
		this._moveItemUpDown(0);
		this._scrollUpDown(0);
	};

	EditKendoColumnViewModel.prototype.toUpClick = function()
	{
		this._moveItemUpDown(Math.max(Math.min.apply({}, _getSelectedRowIdxs()) - 1, 0));

		var scrollUp = true;
		this._scrollUpDownByselectedUids(scrollUp);
	};

	EditKendoColumnViewModel.prototype.toDownClick = function()
	{
		this._moveItemUpDown(Math.min(Math.max.apply({}, _getSelectedRowIdxs()) + 2, _selectedColGrid.dataSource.data().length));

		var scrollUp = false;
		this._scrollUpDownByselectedUids(scrollUp);
	};

	EditKendoColumnViewModel.prototype.toBottomClick = function()
	{
		this._moveItemUpDown(_selectedColGrid.dataSource.data().length);

		this._scrollUpDown(_selectedColGrid.items().length * $(_selectedColGrid.items()[0]).height());
	};

	EditKendoColumnViewModel.prototype.onKeyPress = function(e, keyCombination)
	{
		if (this.focusedGridName === "selected")
		{
			return;
		}
		var gridContainer = this.focusedGridName === "available" ? this.availableColGridContainer : this.selectedColGridContainer;
		var top = 0;
		var gridTr = gridContainer.find("div.k-grid-content").find("tbody[role=rowgroup]").find("tr");
		for (var i = 0; i < gridTr.length; i++)
		{
			if (gridTr[i].innerText.substring(0, 1).toLowerCase() === keyCombination)
			{
				top = i * gridTr[i].offsetHeight;
				gridContainer.find("div.k-grid-content").scrollTop(top);
				break;
			}
		}
	};

	EditKendoColumnViewModel.prototype._clearMessage = function()
	{
		this.obErrorMessage("");
	};

	EditKendoColumnViewModel.prototype.reset = function()
	{
		var self = this;
		tf.shortCutKeys.power(true);
		return new Promise(function(resolve)
		{
			tf.loadingIndicator.showImmediately();
			setTimeout(function()
			{
				resolve();
			}, 0);
		}).then(function()
		{
			self._clearMessage();
			return self._applyDefaultColumns()
				.then(function(result)
				{
					setTimeout(function()
					{
						tf.shortCutKeys.power(false);
						tf.loadingIndicator.tryHide();
					}, 1000);
					if (result)
						return this;
				}.bind(self));
		});
	};

	EditKendoColumnViewModel.prototype._applyDefaultColumns = function()
	{
		var self = this;
		return (function()
		{
			self.toAllLeftClick();
			self.defaultLayoutColumns.map(function(column)
			{
				self._moveItem(self._getUidByColumnName(column.FieldName, _availableColGrid.dataSource), _availableColGrid.dataSource, _selectedColGrid.dataSource);
			});
			return Promise.resolve(true);
		})();
	};

	EditKendoColumnViewModel.prototype._getUidByColumnName = function(columnFieldName, dataSource)
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

	EditKendoColumnViewModel.prototype.apply = function()
	{
		this._clearMessage();

		return this._save()
			.then(function(result)
			{
				if (result)
					return this;
			}.bind(this));
	};

	EditKendoColumnViewModel.prototype.getSelectDataCount = function()
	{
		return this.selectedColumns.length;
	};

	//VIEW-1301 Grid will freeze up if last remaining unlocked column is removed from grid
	EditKendoColumnViewModel.prototype._removingOnlyOneUnLockColumn = function()
	{
		var lockedColumn = Enumerable.From(this.selectedColumns).Where("$.locked").ToArray();
		if (lockedColumn.length === this.selectedColumns.length)
		{
			return tf.promiseBootbox.confirm({
				message: "All grid columns in the Selected list box are locked. At least one grid column must be unlocked to preserve the locked columns. If you Apply these changes, all of these columns will be unlocked. Are you sure you want to continue?",
				title: "Confirmation"
			}).then(function(ans)
			{
				if (ans === true)
				{
					this.selectedColumns.forEach(function(element, index)
					{
						element.locked = false;
					});
				}
				return ans;
			}.bind(this));
		}
		return Promise.resolve(true);
	};

	EditKendoColumnViewModel.prototype._save = function()
	{
		return (function()
		{
			this._bindGridDataToColumns();
			return this.pageLevelViewModel.saveValidate().then(function(result)
			{
				if (result)
				{
					return this._removingOnlyOneUnLockColumn().then(function(removeOnlyOneConfirmResult)
					{
						return Promise.resolve(removeOnlyOneConfirmResult);
					});
				} else
				{
					return Promise.resolve(false);
				}
			}.bind(this));
		}.bind(this))();
	};

	EditKendoColumnViewModel.prototype._bindGridDataToColumns = function()
	{
		var getColKeys = function(col)
		{
			return {
				FieldName: col.FieldName,
				hidden: col.hidden,
				locked: col.locked
			};
		};

		var switchColumns = function(orign, dest, colKeys, filterCondition)
		{
			for (var i = 0; i < orign.length; i++)
			{
				if (colKeys.some(function(key)
				{
					return key.FieldName === orign[i].FieldName;
				}))
				{
					orign[i].hidden = !filterCondition;
					dest.push(orign[i]);
					orign.splice(i, 1);
					i--;
				}
			}
		};

		var orderColumnsByKeys = function(columns, keys)
		{
			var columnsCopy = columns.splice(0, columns.length);

			keys.forEach(function(key)
			{
				var column = columnsCopy.filter(function(col)
				{
					return col.FieldName === key.FieldName
				})[0];
				if (column)
				{
					column.locked = key.locked;
					columns.push(column);
				}
			});
		};

		rightColKeys = _selectedColGrid.dataSource.data().map(getColKeys);
		leftColKeys = _availableColGrid.dataSource.data().map(getColKeys);

		switchColumns(this.availableColumns, this.selectedColumns, rightColKeys, true);
		switchColumns(this.selectedColumns, this.availableColumns, leftColKeys, false);

		orderColumnsByKeys(this.availableColumns, leftColKeys);
		orderColumnsByKeys(this.selectedColumns, rightColKeys);
	};

	EditKendoColumnViewModel.prototype._scrollUpDownByselectedUids = function(scrollUp)
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
		} else
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

	EditKendoColumnViewModel.prototype._scrollUpDown = function(topPostion)
	{
		var gridContentElement = this.selectedColGridContainer.find(".k-grid-content");
		gridContentElement.scrollTop(topPostion);
	};

	EditKendoColumnViewModel.prototype._moveItemUpDown = function(targetIdx)
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
		} else if (insertAfter.length > 0 && insertAfter[0].locked == true)
		{
			selectedRows.forEach(function(item)
			{
				item.locked = true;
			});
		}
		_selectedColGrid.dataSource.data([insertBefore, selectedRows, insertAfter].reduce(function(a, b)
		{
			return a.concat(b);
		}, []));

		_hightLightSelectedItems();

		this.careteKendoDropTargetEvent();
	};

	EditKendoColumnViewModel.prototype._moveItem = function(selectedItemUids, depDataSource, distDataSource)
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
	};

	EditKendoColumnViewModel.prototype.dispose = function()
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
			} else
			{
				this._moveItemUpDown(insertIdx);
			}
		} else
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
		} else
		{
			destData = _selectedColGrid.dataSource.getByUid(dest.parent().data(_KendoUid));
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

	var _fillDisplayName = function(columns)
	{
		return columns.map(function(column)
		{
			if (!column[_DataFiledName])
			{
				column[_DataFiledName] = column.FieldName;
			}
			return column;
		});
	};

	var _sortByDisplayName = function(a, b)
	{
		var x, y;
		x = a[_DataFiledName] ? a[_DataFiledName].toLowerCase() : '';
		y = b[_DataFiledName] ? b[_DataFiledName].toLowerCase() : '';
		return (x == y ? 0 : (x > y ? 1 : -1));
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

	var _sortAvailableGrid = function()
	{
		_availableColGrid.dataSource.sort({
			field: _DataFiledName,
			dir: "asc"
		});
		_availableColGrid.dataSource.data().sort(_sortByDisplayName);
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

	var _getHintElements = function(item, selectedColumns)
	{
		var hintElements = $('<div class="k-grid k-widget list-mover-drag-hint" style=""><table><tbody></tbody></table></div>');
		hintElements.css({
			"width": item.width() + "px",
			"background-color": "#FFFFCE",
			"opacity": 0.8,
			"cursor": "move"
		});
		if (selectedColumns == undefined)
		{
			hintElements.find('tbody').append('<tr>' + item.html() + '</tr>');
		} else
		{
			for (var i = 0; i < selectedColumns.length; i++)
			{
				hintElements.find('tbody').append('<tr>' + $(selectedColumns[i]).html() + '</tr>');
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

	namespace.EditKendoColumnViewModel = EditKendoColumnViewModel;
})();
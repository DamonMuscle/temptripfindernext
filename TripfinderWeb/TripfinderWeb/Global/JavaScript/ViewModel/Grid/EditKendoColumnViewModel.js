(function()
{
	var namespace = createNamespace("TF.Grid");

	var _DataFiledName = 'DisplayName',
		_KendoUid = "kendoUid",
		_keyPressName = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"],
		_gridConfig = namespace.GridConfig = {
			gridSchema: {
				model: {
					fields: {
						'FieldName': { type: "string" },
						'DisplayName': { type: "string" }
					}
				},
			},
			gridColumns: [
				{
					field: _DataFiledName,
					title: "Name"
				}
			],
			height: 400,
			selectable: TF.isMobileDevice ? "row" : "multiple"
		};

	function EditKendoColumnViewModel(availableColumns, selectedColumns, defaultLayoutColumns, shortCutKeyHashMapKeyName, isMiniGrid, noLoadingIndicator, disableControl)
	{
		var gridConfig;
		if ($.isPlainObject(availableColumns))
		{
			var options = availableColumns;
			availableColumns = options.availableColumns;
			selectedColumns = options.selectedColumns;
			defaultLayoutColumns = options.defaultLayoutColumns;
			shortCutKeyHashMapKeyName = options.shortCutKeyHashMapKeyName;
			isMiniGrid = options.isMiniGrid;
			noLoadingIndicator = options.noLoadingIndicator;
			gridConfig = options.gridConfig;
		}

		this.name = "";
		this.showHandler = false;
		this.obIsEnabled = ko.observable(true);
		this.obRightGridDataSourceChanged = ko.observable(false);
		this.obRightGridDataSourceChanged.extend({ notify: 'always' });

		this._availableColGrid = null;
		this._selectedColGrid = null;
		this._obLeftGridSelectedUids = ko.observableArray();
		this._obRightGridSelectedUids = ko.observableArray();

		this.shortCutKeyHashMapKeyName = shortCutKeyHashMapKeyName;

		if (gridConfig)
		{
			this.gridConfig = gridConfig;
		}
		else
		{
			_gridConfig.gridColumns.forEach(function(item) { item.title = tf.applicationTerm.getApplicationTermSingularByName(item.title); });
			if (isMiniGrid)
			{
				_gridConfig.gridColumns = _gridConfig.gridColumns.filter(function(item) { return !(item.field === "Status" && item.title === "Show"); });
			}

			this.gridConfig = _gridConfig;
		}

		this.obavailableColumns = ko.observableArray();
		this.obselectedColumns = ko.observableArray();

		this.availableColumns = _fillDisplayName(availableColumns).slice().sort(this._sortByDisplayName).filter(x => !x.ParentField);
		this.selectedColumns = _fillDisplayName(selectedColumns).slice().filter(x => !x.ParentField);
		this.defaultLayoutColumns = defaultLayoutColumns ? defaultLayoutColumns.slice() : [];

		this.obavailableColumns(this.availableColumns);
		this.obselectedColumns(this.selectedColumns);
		this.focusedGridName = 'available';
		this._totalColumnsCount = this.availableColumns.length + this.selectedColumns.length;

		this.obLeftGridSelected = ko.computed(function()
		{
			return this._obLeftGridSelectedUids() && this._obLeftGridSelectedUids().length > 0;
		}, this);

		this.obRightGridSelected = ko.computed(function()
		{
			return this._obRightGridSelectedUids() && this._obRightGridSelectedUids().length > 0;
		}, this);

		// key press in available table
		tf.shortCutKeys.bind(_keyPressName, this.onKeyPress.bind(this), this.shortCutKeyHashMapKeyName);
		this.obErrorMessage = ko.observable("");

		this.obEnabledMoveUp = ko.computed(function()
		{
			if (this._obRightGridSelectedUids() && this._obRightGridSelectedUids().length > 0)
			{
				var idxs = this._getSelectedRowIdxs();
				var maxindex = Math.min.apply({}, idxs);
				if (maxindex <= 0)// actually it should compare with 0
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
			if (this._obRightGridSelectedUids() && this._obRightGridSelectedUids().length > 0)
			{
				var idxs = this._getSelectedRowIdxs();
				var minindex = Math.max.apply({}, idxs) + 1;
				if (minindex >= this._selectedColGrid.dataSource.data().length)// actually it should compare with 0
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
		this.noLoadingIndicator = noLoadingIndicator;
		this.obDisableControl = disableControl;
		this.obselectedColumns.subscribe(() =>
		{
			if (!this.obDisableControl) return;
			this.obDisableControl(this.obselectedColumns().length === 0);
		})
	}

	EditKendoColumnViewModel.prototype.init = function(viewModel, el)
	{
		this._init(el);
	};

	EditKendoColumnViewModel.prototype._init = function(el)
	{
		var self = this;
		this.availableColGridContainer = $(el).find(".availablecolumngrid-container");
		this.selectedColGridContainer = $(el).find(".selectedcolumngrid-container");
		$(el).bootstrapValidator();

		this.initLeftGrid();
		this.initRightGrid();
		this.obavailableColumns(this._availableColGrid.dataSource.data());
		this.obselectedColumns(this._selectedColGrid.dataSource.data());

		this.bindLeftGridDraggable();
		this.bindRightGridDraggable();
		this.bindLeftGridDropTarget();
		this.bindRightGridDropTarget();

		this.careteKendoDropTargetEvent();

		this.getSelectedUids = ko.observableArray([]);
		this.getSelectedUids.subscribe(this._selectedUidsChange, this);
		this.onCtrlIPress = this.onCtrlIPress.bind(this);
		this.onCtrlAPress = this.onCtrlAPress.bind(this);

		self.availableInfo = {
			_selectedIndex: null,
			findAllElements: function()
			{
				return self.availableColGridContainer.find("td");
			},
			select: function(index)
			{
				self._selectElement("available", index);
			}
		};
		self.selectedInfo = {
			_selectedIndex: null,
			findAllElements: function()
			{
				return self.selectedColGridContainer.find("td");
			},
			select: function(index)
			{
				self._selectElement("selected", index);
			}
		};

		self.availableGridQuickSearchHelper = new TF.Helper.QuickSearchHelper("", [], self.availableInfo.findAllElements.bind(self), self.availableInfo.select.bind(self), self.availableInfo);
		self.selectedGridQuickSearchHelper = new TF.Helper.QuickSearchHelper("", [], self.selectedInfo.findAllElements.bind(self), self.selectedInfo.select.bind(self), self.selectedInfo);
		self.setupQuickSearch();

		if (this.gridConfig.selectable.indexOf("multiple") != -1)
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
		}.bind(this));
		this.selectedColGridContainer.bind("click", function()
		{
			this.focusedGridName = "selected";
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
			return this._availableColGrid.dataSource.data().map(
				function(item) { return item["uid"]; }
			);
		}
		else if (this.obRightGridSelected())
		{
			return this._selectedColGrid.dataSource.data().map(
				function(item) { return item["uid"]; }
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

	EditKendoColumnViewModel.prototype.careteKendoDropTargetEvent = function()
	{
		var self = this;
		this.selectedColGridContainer.find("tbody tr").kendoDropTarget({
			dragenter: function(e)
			{
				var targetItem = self.careteDropTargetHelper(e);
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

	EditKendoColumnViewModel.prototype.careteDropTargetHelper = function(evt)
	{
		var targetItem = $(evt.dropTarget[0]);
		return targetItem;
	};

	EditKendoColumnViewModel.prototype.onLeftGridChange = function(arg)
	{
		var grid = this._availableColGrid,
			selected = $.map(grid.select(), function(item)
			{
				return item.dataset[_KendoUid];
			});
		this._obLeftGridSelectedUids(selected);

		if (this._obLeftGridSelectedUids().length !== 0)
		{
			this._clearRightSelection();
		}

		var bottomDom = TF.Grid.EditKendoColumnViewModel._buildGridBottom(
			grid.dataItems().length,
			grid.select().length,
			this._totalColumnsCount
		);
		grid.wrapper.find(".k-pager-wrap").html(bottomDom);
	};

	EditKendoColumnViewModel.prototype.onRightGridChange = function(arg)
	{
		var grid = this._selectedColGrid,
			selected = $.map(grid.select(), function(item)
			{
				return item.dataset[_KendoUid];
			});
		this._obRightGridSelectedUids(selected);

		if (this._obRightGridSelectedUids().length !== 0)
		{
			this._clearLeftSelection();
		}

		var bottomDom = TF.Grid.EditKendoColumnViewModel._buildGridBottom(
			grid.dataItems().length,
			grid.select().length,
			this._totalColumnsCount
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

	EditKendoColumnViewModel.prototype.initLeftGrid = function(gridColumns)
	{
		var self = this;
		this._availableColGrid = null;
		this.availableColGridContainer.kendoGrid({
			dataSource: new kendo.data.DataSource({
				data: this.availableColumns,
				schema: this.gridConfig.gridSchema
			}),
			columns: gridColumns || this.gridConfig.gridColumns,
			height: this.gridConfig.height,
			selectable: this.gridConfig.selectable,
			change: this.onLeftGridChange.bind(this),
			pageable: {},
			dataBound: function()
			{
				var bottomDom = TF.Grid.EditKendoColumnViewModel._buildGridBottom(
					this.dataItems().length,
					this.select().length,
					self._totalColumnsCount
				);
				self.availableColGridContainer.find(".k-pager-wrap").html(bottomDom);
			}
		});
		this._availableColGrid = this.availableColGridContainer.data("kendoGrid");
		_cancelKendoGridSelectedArea(this._availableColGrid);
		this._availableColGrid.shortcutExtender = new TF.KendoGridNavigator({ grid: this._availableColGrid, pageSize: 8 });
		this._availableColGrid.element.on('click', function() { this.focus(); });
		this.initGridScrollBar(this.availableColGridContainer);
		return this._availableColGrid;
	};

	EditKendoColumnViewModel.prototype.initRightGrid = function(gridColumns)
	{
		var self = this;
		this._selectedColGrid = null;
		this.selectedColGridContainer.kendoGrid({
			dataSource: new kendo.data.DataSource({
				data: this.selectedColumns,
				schema: this.gridConfig.gridSchema
			}),
			columns: gridColumns || this.gridConfig.gridColumns,
			height: this.gridConfig.height,
			selectable: this.gridConfig.selectable,
			change: this.onRightGridChange.bind(this),
			pageable: {},
			dataBound: function()
			{
				var bottomDom = TF.Grid.EditKendoColumnViewModel._buildGridBottom(
					this.dataItems().length,
					this.select().length,
					self._totalColumnsCount
				);
				self.selectedColGridContainer.find(".k-pager-wrap").html(bottomDom);
			}
		});
		this._selectedColGrid = this.selectedColGridContainer.data("kendoGrid");
		_cancelKendoGridSelectedArea(this._selectedColGrid);
		this._selectedColGrid.shortcutExtender = new TF.KendoGridNavigator({ grid: this._selectedColGrid, pageSize: 8 });
		this._selectedColGrid.element.on('click', function() { this.focus(); });
		this.initGridScrollBar(this.selectedColGridContainer);

		this._selectedColGrid.dataSource.bind("change", function(e)
		{
			if (e.action == "add" || e.action == "remove" || e.action == undefined) this.obRightGridDataSourceChanged(true); // add, remove, reorder
		    else if (e.action == "sync") this.obRightGridDataSourceChanged(false);
		}.bind(this));
		return this._selectedColGrid;
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
		}
		else
		{
			$gridContent.find("colgroup col:last").css({
				width: 60
			});
		}
	};

	EditKendoColumnViewModel.prototype.bindLeftGridDraggable = function(filter)
	{
		this.availableColGridContainer.kendoDraggable({
			filter: filter || "tbody > tr",
			threshold: 100,
			holdToDrag: TF.isMobileDevice,
			hint: function(e)
			{
				if (e.hasClass("k-state-selected"))
				{
					var selectedColumns = this.availableColGridContainer.find('.k-state-selected');
					return _getHintElements(e, selectedColumns);
				}
				else
				{
					return _getHintElements(e);
				}
			}.bind(this),
			dragstart: function(e)
			{
			}.bind(this),
			autoScroll: true
		});
	};

	EditKendoColumnViewModel.prototype.bindRightGridDraggable = function(filter)
	{
		this.selectedColGridContainer.kendoDraggable({
			filter: filter || "tbody > tr",
			threshold: 100,
			holdToDrag: TF.isMobileDevice,
			autoScroll: true,
			hint: function(e)
			{
				if (e.hasClass("k-state-selected"))
				{
					var selectedColumns = this.selectedColGridContainer.find('.k-state-selected');
					return _getHintElements(e, selectedColumns);
				}
				else
				{
					return _getHintElements(e);
				}
			}.bind(this),
			dragstart: function(e)
			{
			}.bind(this),
		});
	};

	EditKendoColumnViewModel.prototype.bindLeftGridDropTarget = function()
	{
		this.availableColGridContainer.kendoDropTarget({
			drop: function(e)
			{
				e.draggable.hint.hide();
				var selectedUids = e.draggable.currentTarget.hasClass("k-state-selected") ? this._obRightGridSelectedUids() : [e.draggable.currentTarget.data().kendoUid];
				if (!e.draggable.element.hasClass("availablecolumngrid-container"))
				{
					this._moveItem(selectedUids, this._selectedColGrid.dataSource, this._availableColGrid.dataSource);
				}
				this._sortAvailableGrid.bind(this)();
				if (selectedUids.length > 0)
				{
					this._obLeftGridSelectedUids(selectedUids);
				}
				var dropTargetTrs = e.dropTarget.find("tbody[role=rowgroup]").find("tr");
				var selectTrs = $.grep(dropTargetTrs, function(n)
				{
					return this._obLeftGridSelectedUids().indexOf($(n).data().kendoUid) != -1;
				}.bind(this));
				if (selectTrs.length > 0)
				{
					$(selectTrs).addClass("k-state-selected");
				}
				this._clearLeftSelection();
				this._clearRightSelection();
			}.bind(this)
		});
	};

	EditKendoColumnViewModel.prototype.bindRightGridDropTarget = function()
	{
		this.selectedColGridContainer.kendoDropTarget({
			dragenter: function(e)
			{
				var helper = this.rightGridDropTargetHelper(e);
				_removeDropTargetCursorTriangle();
				_appendDropTargetCursorTriangle(helper.targetItem, helper.insertBeforeTarget);
			}.bind(this),
			dragleave: function(e)
			{
				var selectedColItems = this.selectedColGridContainer.find('tr');
				selectedColItems.removeClass("drag-target-insert-before-cursor");
				selectedColItems.removeClass("drag-target-insert-after-cursor"); // modify dropTarget element

				_removeDropTargetCursorTriangle();

			}.bind(this),
			drop: _selectedDrop.bind(this)
		});
	};

	EditKendoColumnViewModel.prototype.rightGridDropTargetHelper = function(evt)
	{
		var selectedColItems = this.selectedColGridContainer.find('tr');
		var targetItem;
		var insertBeforeTarget = false;
		if (evt.draggable.hint.offset().top < $('.selectedcolumngrid-container .k-grid-content').offset().top)
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
		return {
			targetItem: targetItem,
			insertBeforeTarget: insertBeforeTarget
		};
	};

	EditKendoColumnViewModel.prototype.toAllRightClick = function()
	{
		this._moveItem(_getUids(this._availableColGrid.dataSource), this._availableColGrid.dataSource, this._selectedColGrid.dataSource);
	};

	EditKendoColumnViewModel.prototype.toRightClick = function()
	{
		this._moveItem(this._obLeftGridSelectedUids(), this._availableColGrid.dataSource, this._selectedColGrid.dataSource);
	};

	EditKendoColumnViewModel.prototype.toLeftClick = function()
	{
		this.toLeftGrid(this._obRightGridSelectedUids(), this._selectedColGrid.dataSource, this._availableColGrid.dataSource);
	};

	EditKendoColumnViewModel.prototype.toAllLeftClick = function()
	{
		this.toLeftGrid(_getUids(this._selectedColGrid.dataSource), this._selectedColGrid.dataSource, this._availableColGrid.dataSource);
	};

	EditKendoColumnViewModel.prototype.toLeftGrid = function(moveItems, sourceData, targetData)
	{
		this._moveItem(moveItems, sourceData, targetData);
		this._sortAvailableGrid.bind(this)();
	};

	EditKendoColumnViewModel.prototype.toTopClick = function()
	{
		this._moveItemUpDown(0);
		this._scrollUpDown(0);
	};

	EditKendoColumnViewModel.prototype.toUpClick = function()
	{
		this._moveItemUpDown(Math.max(Math.min.apply({}, this._getSelectedRowIdxs()) - 1, 0));
		var scrollUp = true;
		this._scrollUpDownByselectedUids(scrollUp);
	};

	EditKendoColumnViewModel.prototype.toDownClick = function()
	{
		this._moveItemUpDown(Math.min(Math.max.apply({}, this._getSelectedRowIdxs()) + 2, this._selectedColGrid.dataSource.data().length));
		var scrollUp = false;
		this._scrollUpDownByselectedUids(scrollUp);
	};

	EditKendoColumnViewModel.prototype.toBottomClick = function()
	{
		this._moveItemUpDown(this._selectedColGrid.dataSource.data().length);
		this._scrollUpDown(this._selectedColGrid.items().length * $(this._selectedColGrid.items()[0]).height());
	};

	EditKendoColumnViewModel.prototype.onKeyPress = function(e, keyCombination)
	{
		if (this.focusedGridName === "selected") { return; }
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

	EditKendoColumnViewModel.prototype.setupQuickSearch = function()
	{
		var self = this;
		self.availableColGridContainer.on("keydown", function(e)
		{
			self.availableGridQuickSearchHelper.quickSearch(e);
		});
		self.selectedColGridContainer.on("keydown", function(e)
		{
			self.selectedGridQuickSearchHelper.quickSearch(e);
		});
	};

	EditKendoColumnViewModel.prototype._selectElement = function(gridType, index)
	{
		var self = this;
		var grid;
		if (gridType == "available")
		{
			grid = self.availableColGridContainer;
			self.availableInfo._selectedIndex = index;
		}
		else
		{
			grid = self.selectedColGridContainer;
			self.selectedInfo._selectedIndex = index;
		}
		var row = grid.data("kendoGrid").tbody.find(">tr:not(.k-grouping-row)").eq(index);
		var top = row[0].offsetHeight * index;
		grid.find("div.k-grid-content").scrollTop(top);
		grid.data("kendoGrid").clearSelection();
		grid.data("kendoGrid").select(row);
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
			if (!self.noLoadingIndicator)
			{
				tf.loadingIndicator.showImmediately();
			}
			setTimeout(function()
			{
				resolve();
			}, 0);
		}).then(function()
		{
			self._clearMessage();
			self.obIsEnabled(true);
			return self._applyDefaultColumns()
				.then(function(result)
				{
					if (!self.noLoadingIndicator)
					{
						setTimeout(function()
						{
							tf.shortCutKeys.power(false);
							tf.loadingIndicator.tryHide();
						}, 1000);
					}
					else
					{
						tf.shortCutKeys.power(false);
					}

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
				self._moveItem(self._getUidByColumnName(column.FieldName, self._availableColGrid.dataSource), self._availableColGrid.dataSource, self._selectedColGrid.dataSource);
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
		var self = this;
		self._clearMessage();
		return self._save()
			.then(function(result)
			{
				if (result)
				{
					self.obRightGridDataSourceChanged(false);
					return self;
				}
			});
	};

	EditKendoColumnViewModel.prototype.getSelectDataCount = function()
	{
		return this.selectedColumns.length;
	};

	// VIEW-1301 Grid will freeze up if last remaining unlocked column is removed from grid
	EditKendoColumnViewModel.prototype._removingOnlyOneUnLockColumn = function()
	{
		var lockedColumn = Enumerable.From(this.selectedColumns).Where("$.locked").ToArray();
		if (this.selectedColumns.length > 0 && lockedColumn.length === this.selectedColumns.length)
		{
			return tf.promiseBootbox.confirm(
				{
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
				}
				else
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
			// var keys = Enumerable.From(colKeys).Where(function(r) { return typeof (r.hidden) === "undefined" || r.hidden === filterCondition; }).ToArray();
			for (var i = 0; i < orign.length; i++)
			{
				if (colKeys.some(function(key) { return key.FieldName === orign[i].FieldName; }))
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
				var column = columnsCopy.filter(function(col) { return col.FieldName === key.FieldName; })[0];
				if (column)
				{
					column.locked = key.locked;
					columns.push(column);
				}
			});
		};

		var rightColKeys = this._selectedColGrid.dataSource.data().map(getColKeys);
		var leftColKeys = this._availableColGrid.dataSource.data().map(getColKeys);

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

		var topPosition;
		if (scrollUp)
		{
			var uponViewZone = itemsOffSetTop < gridContentElement.offset().top;
			if (uponViewZone)
			{
				topPosition = Math.max(gridContentElement.scrollTop() - itemHeight, 0);
			}
		}
		else
		{
			var underViewZone = itemsOffSetBottom > gridContentViewZoneBottom;
			if (underViewZone)
			{
				topPosition = Math.min(gridContentElement.scrollTop() + itemHeight, gridContentHeight);
			}
		}

		if (topPosition && !isNaN(topPosition))
		{
			this._scrollUpDown(topPosition);
		}
	};

	EditKendoColumnViewModel.prototype._scrollUpDown = function(topPosition)
	{
		var gridContentElement = this.selectedColGridContainer.find(".k-grid-content");
		gridContentElement.scrollTop(topPosition);
	};

	EditKendoColumnViewModel.prototype._moveItemUpDown = function(targetIdx)
	{
		var selectedRows = _getDataRowsBySelectedUids(this._obRightGridSelectedUids(), this._selectedColGrid.dataSource);

		var gridData = this._selectedColGrid.dataSource.data();
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
		this._selectedColGrid.dataSource.data([insertBefore, selectedRows, insertAfter].reduce(function(a, b) { return a.concat(b); }, []));

		this._hightLightSelectedItems();

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
			if (selectedItemUids[i])
			{
				selectedRows.push(depDataSource.getByUid(selectedItemUids[i]));
			}
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

		this._clearLeftSelection();
		this._clearRightSelection();

		this.careteKendoDropTargetEvent();
		var availableColumns = this._availableColGrid.dataSource.data();
		availableColumns.forEach(function(item)
		{
			item.locked = false;
		});
		this.obavailableColumns(availableColumns);
		this.obselectedColumns(this._selectedColGrid.dataSource.data());

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
				this._selectedColGrid.clearSelection();
				return;
			}

			var insertIdx = this._getSelectedGridInsertIdx($(document.elementFromPoint(e.clientX, e.clientY)));

			if (this.obLeftGridSelected())
			{
				var tmp = this._obLeftGridSelectedUids().slice();
				this._moveItem(this._obLeftGridSelectedUids(), this._availableColGrid.dataSource, this._selectedColGrid.dataSource);
				this._obRightGridSelectedUids(tmp);
				this._moveItemUpDown(insertIdx);
			}
			else
			{
				this._moveItemUpDown(insertIdx);
			}
		}
		else
		{
			var insertIdx = this._getSelectedGridInsertIdx($(document.elementFromPoint(e.clientX, e.clientY)));
			var selectedUids = [e.draggable.currentTarget.data().kendoUid];
			if (e.draggable.element.hasClass("availablecolumngrid-container"))
			{
				this._moveItem(selectedUids, this._availableColGrid.dataSource, this._selectedColGrid.dataSource);
			}
			this._obRightGridSelectedUids(selectedUids);
			this._moveItemUpDown(insertIdx);
		}
	};

	EditKendoColumnViewModel.prototype._getSelectedGridInsertIdx = function(dest)
	{
		var insertIdx = 0;

		if (dest.is("th"))
		{
			insertIdx = 0;
		}
		else
		{
			var destData = this._selectedColGrid.dataSource.getByUid(dest.parent().data(_KendoUid));
			var gridData = this._selectedColGrid.dataSource.data();

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

	EditKendoColumnViewModel.prototype._sortByDisplayName = function(a, b)
	{
		var x, y;
		x = a[_DataFiledName] ? a[_DataFiledName].toLowerCase() : '';
		y = b[_DataFiledName] ? b[_DataFiledName].toLowerCase() : '';
		return (x == y ? 0 : (x > y ? 1 : -1));
	};

	EditKendoColumnViewModel.prototype._getSelectedRowIdxs = function()
	{
		var self = this;
		var selectedRows = _getDataRowsBySelectedUids(this._obRightGridSelectedUids(), this._selectedColGrid.dataSource);
		return selectedRows.map(function(row)
		{
			return self._selectedColGrid.dataSource.data().indexOf(row);
		});
	};

	EditKendoColumnViewModel.prototype._sortAvailableGrid = function()
	{
		this._availableColGrid.dataSource.sort({ field: _DataFiledName, dir: "asc", compare: this._sortByDisplayName });
		this._availableColGrid.dataSource.data().sort(this._sortByDisplayName);
	};

	EditKendoColumnViewModel.prototype._hightLightSelectedItems = function()
	{
		var self = this;
		var items = this._selectedColGrid.items();
		this._obRightGridSelectedUids().forEach(function(uid)
		{
			$.map(items, function(item)
			{
				if (item.dataset[_KendoUid] == uid)
				{
					self._selectedColGrid.select(item);
					return;
				}
			});
		});
	};

	EditKendoColumnViewModel.prototype._clearRightSelection = function()
	{
		this._obRightGridSelectedUids([]);
		this._selectedColGrid.clearSelection();
	};

	EditKendoColumnViewModel.prototype._clearLeftSelection = function()
	{
		this._obLeftGridSelectedUids([]);
		this._availableColGrid.clearSelection();
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

	function _getDataRowsBySelectedUids(selectedUids, dataSource)
	{
		var dataRows = $.map(selectedUids, function(uid)
		{
			return dataSource.getByUid(uid);
		}.bind(this));
		return dataRows;
	}

	function _removeDropTargetCursorTriangle()
	{
		$('#left-triangle').remove();
		$('#right-triangle').remove();
	}

	function _appendDropTargetCursorTriangle(targetItem, insertBeforeTarget)
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
	}

	function _getHintElements(item, selectedColumns)
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
		}
		else
		{
			for (var i = 0; i < selectedColumns.length; i++)
			{
				hintElements.find('tbody').append('<tr>' + $(selectedColumns[i]).html() + '</tr>');
			}
		}

		return hintElements;
	}

	namespace.EditKendoColumnViewModel = EditKendoColumnViewModel;
})();
(function ()
{
	createNamespace("TF.Grid").KendoGrid = KendoGrid;
	var defaults = {
		obDocumentFocusState: true,
		layoutAndFilterOperation: true,
		canDragDelete: true
	};

	const DEFAULT_THEMATIC_LABEL = "All Other Values";
	const THEMATIC_COLOR_ATTRIBUTE = "custom-bkg-color";
	const SCHEDULE_GRIDS = ["studentattendanceschedule", "tripschedule", "tripstopschedule"];
	const THEMATIC_NOT_BIG_GRIDS = ["session", "formsent", "dashboards", "dashboardLibrary", "scheduledmergedocument", "scheduledreport"];

	function addPlugin()
	{
		var base, sub = arguments[0];
		for (var i = 1; i < arguments.length; i++)
		{
			base = Object.create(arguments[i].prototype);
			for (var attr in base)
			{
				sub.prototype[attr] = base[attr];
			}
		}
	}

	function KendoGrid($container, options, gridState)
	{
		var self = this;
		this.isFromRelated = ko.observable(false);
		options = $.extend(true,
			{}, defaults, options);
		TF.Grid.LightKendoGrid.call(this, $container, options, gridState);

		this._columnsLockedTimesKey = "columnsLockedTimes";
		this._columnsUnLockedTimesKey = "columnsUnLockedTimes";
		this.initialFilter = true;
		this.$lockbar = null;
		this.isMobileDevice = isMobileDevice();
		this.randomKey = (new Date()).getTime();
		this.obLayoutFilterOperation = ko.observable(options.layoutAndFilterOperation);
		$(window).on("orientationchange.gridStateTwoRowWhenOverflow" + this.randomKey, function ()
		{
			setTimeout(function ()
			{
				self._setgridStateTwoRowWhenOverflow();
			});
		});

		this.thematicFields = [];
		this.selectedGridThematicConfigs = null;
		this.tempGridThematicDataModel = null;
		this.predefinedGridData = this.options.predefinedGridData;

		const isThematicSupported = tf.dataTypeHelper.checkGridThematicSupport(this._gridType);
		this.obThematicSupported = ko.observable(isThematicSupported);
		this.obIsThematicApplied = ko.observable(false);

		this.dataFieldHelper = new TF.Map.Thematics.DataFieldHelper();
	}

	KendoGrid.prototype = Object.create(TF.Grid.LightKendoGrid.prototype);

	KendoGrid.constructor = KendoGrid;

	KendoGrid.prototype.initParameter = function ()
	{
		TF.Grid.LightKendoGrid.prototype.initParameter.apply(this, arguments);
		this.isFromRelated(this.options.isFromRelated);
		this._obDocumentFocusState = ko.observable(this.options.obDocumentFocusState);

		TF.Grid.KendoGridFilterMenu.call(this);
		TF.Grid.KendoGridThematicMenu.call(this);
		TF.Grid.KendoGridLayoutMenu.call(this);
		TF.Grid.KendoGridSummaryGrid.call(this);
		this._obSortedItems.subscribe(this._updateCurrentLayout, this);

		this.summarybarIconClick = this.summarybarIconClick.bind(this);
		this.addRemoveColumnClick = this.addRemoveColumnClick.bind(this);
	};

	KendoGrid.prototype.loadAndCreateGrid = function ()
	{
		const self = this;
		if (this.options.kendoGridOption.autoBind !== false && !this.options.isMiniGrid)
		{
			tf.loadingIndicator.showImmediately();
		}
		self.loadRelatedFilterData().then(function(){
			return self.loadPresetData();
		}).then(function()
		{
			this.createGrid();
			this._setCustomizetimePickerborderradius();
			this.resizeHeightOnWindowResize();
			if (this._obCurrentGridLayoutExtendedDataModel())
			{
				this._obCurrentGridLayoutExtendedDataModel().apiIsDirty(this._layoutFilterId != this._obCurrentGridLayoutExtendedDataModel().filterId());
			}
		}.bind(this))
			.then(function ()
			{
				this.obSummaryGridVisible.subscribe(this.fitContainer, this);
				this.obSummaryGridVisible.subscribe(this.createSummaryGrid, this);
				this._obSelectedColumns.subscribe(this._updateCurrentLayout, this);
				this._obSelectedColumns.subscribe(this.updateSummaryGridColumns, this);
				if (this._obDocumentFocusState())
				{
					this._obDocumentFocusState.subscribe(this._documentFocusStateChange, this);
				}
				this._dataChangeReceive = this._dataChangeReceive.bind(this);
				this._gridFilterDataModelsChange();
				PubSub.subscribe(topicCombine(pb.DATA_CHANGE, this._gridType), this._dataChangeReceive);
				this._gridLoadingEnd = true;
			}.bind(this));
	};

	KendoGrid.prototype._setCustomizetimePickerborderradius = function () //set CustomizetimePicker border-radius.
	{
		var CustomizetimePickers = $(".form-control.datepickerinput");
		CustomizetimePickers.map(function (idx, item)
		{
			$(item).css("border-radius", "0");
			$(item).css("float", "right");
			$(item).next().css("border-radius", "0");
		});
	};

	KendoGrid.prototype._documentFocusStateChange = function ()
	{
		if (this._obDocumentFocusState())
		{
			if (this._pendingRefresh)
			{
				this._pendingRefresh = false;
				this.rebuildGrid().then(function ()
				{
					// rebuildGrid is a promise method
				});
			}
		}
	};

	KendoGrid.prototype._dataChangeReceive = function ()
	{
		this._pendingRefresh = true;
		this._documentFocusStateChange();
	};

	KendoGrid.prototype.loadRelatedFilterData = function()
	{
		const openRelatedData = this.options.openRelatedData;
		if (!openRelatedData)
		{
			return Promise.resolve();
		}

		//the filter will sticky once open a new grid, so save the sticky information in DB
		var storageFilterDataKey = `grid.currentfilter.${openRelatedData.pageType}.id`;
		return Promise.all([
			TF.Grid.FilterHelper.clearQuickFilter(openRelatedData.gridType),
			// tf.storageManager.save(`grid.currentlayout.${openRelatedData.pageType}.id`, ''),
			tf.storageManager.save(storageFilterDataKey,
			{
				"filteredIds": openRelatedData.selectedIds,
				"filterName": openRelatedData.filterName
			}, true)
		]);
	};

	KendoGrid.prototype.loadPresetData = function()
	{
		var self = this;
		if (!this.isBigGrid && !this.options.isMiniGrid)
		{
			return Promise.resolve();
		}
		return this.loadGridDefaults()
			.then(() =>
			{
				return this.loadLayout();
			})
			.then(() =>
			{
				if (this.options.isMiniGrid)
				{
					var promise = Promise.resolve();
				}
				else
				{
					var promise = Promise.all([self.loadGridFilter(), self.loadGridThematic()]);
				}

				return promise.then(function ()
				{
					self._applyingLayout = true;
					self._setGridColumnConfiguration(self.options.fromSearch);
					self._applyingLayout = false;
					return;
				});
			})
	};

	KendoGrid.prototype.loadGridDefaults = function ()
	{
		if (this.options.noNeedDefaultLayout || !this.isBigGrid)
		{
			return Promise.resolve();
		}
		var gridName = this.options.gridType;
		if (this.options.kendoGridOption && this.options.kendoGridOption.entityType)
		{
			gridName = this.options.kendoGridOption.entityType + "." + gridName;
		}
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "griddefaults?gridName=" + gridName))
			.then(function (apiResponse)
			{
				var columns;
				if (apiResponse.Items.length === 0)
				{
					columns = Enumerable.From(this._gridDefinition.Columns).Where(function (c)
					{
						return c.hidden !== true;
					}).Select(function (c)
					{
						return c.FieldName;
					}).ToArray();
					if (!this.options.kendoGridOption.entityType)
					{ //minigrid will ignore the grid default table values
						return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "griddefaults"),
							{
								data:
								{
									Id: 0,
									GridName: this.options.gridType,
									Columns: columns.join(","),
									ApiIsDirty: true,
									ApiIsNew: true
								}
							});
					}
				}
				else
				{
					columns = apiResponse.Items[0].Columns.split(",");
					this._gridDefinition.Columns.forEach(function (c)
					{
						c.hidden = true;
					});
					columns.reverse().forEach(function (item)
					{
						for (var i = 0, l = this._gridDefinition.Columns.length; i < l; i++)
						{
							if (this._gridDefinition.Columns[i].FieldName == item)
							{
								this._gridDefinition.Columns[i].hidden = false;
								var c = this._gridDefinition.Columns.splice(i, 1);
								this._gridDefinition.Columns.unshift(c[0]);
								break;
							}
						}
					}.bind(this));
				}
			}.bind(this));
	};

	KendoGrid.prototype.rebuildGrid = function (sortInfo)
	{
		return TF.Grid.LightKendoGrid.prototype.rebuildGrid.apply(this, sortInfo)
			.then(function (result)
			{
				if (result !== false)
				{
					this.options.canDragDelete && this.createDragDelete();
					this.changeSortModel(); //bind the function of change sort model in column mouse down
					this.resizableBinding();
					this.lockUnlockColumn();
					this.options.reorderable && this.initDragHeadEvent();
					this.initQuickFilterBar();

					this.createDropDocument();

					return true;
				}
				return false;
			}.bind(this));
	};

	KendoGrid.prototype.createGrid = function ()
	{
		TF.Grid.LightKendoGrid.prototype.createGrid.apply(this);

		this.changeSortModel(); //bind the function of chang sort model in colunm mousedown
		this.resizableBinding();
		this.options.canDragDelete && this.createDragDelete();
		this.lockUnlockColumn();
		this.options.reorderable && this.initDragHeadEvent();

		this.initQuickFilterBar();

		this.createDropDocument();
	};

	KendoGrid.prototype.createDropDocument = function ()
	{
		if (this.options.gridType == "document" || this.options.gridType == "documentmini")
		{
			this.handleMiniGridFileDrop = this.handleMiniGridFileDrop.bind(this);

			var gridContentElement = this.$container.find(".k-grid-content")[0];
			var gridLockedContentElement = this.$container.find(".k-grid-content-locked")[0];

			gridContentElement.addEventListener('dragenter', this.handleFileDrag);
			gridContentElement.addEventListener('dragleave', this.handleFileDrag);
			gridContentElement.addEventListener('dragover', this.handleFileDrag);
			if (this.options.gridType == "document")
				gridContentElement.addEventListener('drop', this.handleFileDrop);
			else
				gridContentElement.addEventListener('drop', this.handleMiniGridFileDrop);

			gridLockedContentElement.addEventListener('dragenter', this.handleFileDrag);
			gridLockedContentElement.addEventListener('dragleave', this.handleFileDrag);
			gridLockedContentElement.addEventListener('dragover', this.handleFileDrag);
			if (this.options.gridType == "document")
				gridLockedContentElement.addEventListener('drop', this.handleFileDrop);
			else
				gridLockedContentElement.addEventListener('drop', this.handleMiniGridFileDrop);
		}
	}

	KendoGrid.prototype.handleFileDrop = function (e)
	{ // may merge with handle minigrid
		e.stopPropagation();
		e.preventDefault();
		var documentData = tf.modalManager.showModal(new TF.Modal.DocumentModalViewModel(
			{
				files: e.dataTransfer.files
			}));
	}

	KendoGrid.prototype.handleMiniGridFileDrop = function (e)
	{
		e.stopPropagation();
		e.preventDefault();
		var documentData = tf.modalManager.showModal(new TF.Modal.DocumentModalViewModel(
			{
				parentType: this._gridState.entityType,
				parentId: this._gridState.entityId,
				files: e.dataTransfer.files
			}));
	};

	KendoGrid.prototype.handleFileDrag = function (e)
	{
		e.stopPropagation();
		e.preventDefault();
	};

	var unSupportDropColumnDridTypes = ["category"];

	KendoGrid.prototype.createDragDelete = function ()
	{
		var that = this,
			deleteColumn = function (e)
			{
				if (unSupportDropColumnDridTypes.indexOf(that._gridType) > -1)
					return;

				$(window).off(this.isMobileDevice ? "touchend" : "mouseup");
				$("body").off(this.isMobileDevice ? "touchmove" : "mousemove");
				var $dragEle = e.draggable.hint;
				if (!$dragEle.hasClass("dragIn")) return;
				$dragEle.remove();
				if (that._obSelectedColumns().length <= 1)
				{
					return that.gridAlert.show(
						{
							alert: "Warning",
							title: "Warning",
							message: "There should be at least one non locked column",
							key: that._columnsUnLockedTimesKey
						});
				}

				if (that._removingOnlyOneUnLockColumn(e.draggable.hint.text()))
				{
					return;
				}
				//All visible columns to the left of this column are locked. Removing this column will unlock those columns. Are you sure you want to remove this column?
				return tf.promiseBootbox.confirm(
					{
						message: "Are you sure you want to remove this column?",
						title: "Remove Confirmation"
					})
					.then(function (result)
					{
						if (result)
						{
							that._removeColumn(e.draggable.hint.text());
							that.rebuildGrid();
						}
					}.bind(that));
			};

		var docRoot = $("body");
		docRoot.kendoDropTarget(
			{
				group: that.kendoGrid._draggableInstance.options.group,
				dragenter: function (e)
				{
					if (unSupportDropColumnDridTypes.indexOf(that._gridType) > -1)
						return;

					var $fromEle = e.draggable.currentTarget;
					var $dragEle = e.draggable.hint;
					$(window).off(this.isMobileDevice ? "touchend.kendogrid" : "mouseup.kendogrid");
					$("body").on(this.isMobileDevice ? "touchmove" : "mousemove", function ()
					{
						var fromEleTop = $fromEle.offset().top,
							dragEleTop = $dragEle.offset().top;
						if (fromEleTop > dragEleTop + 40 || fromEleTop < dragEleTop - 40)
						{
							$dragEle.addClass("dragIn");
						}
						else
						{
							$dragEle.removeClass("dragIn");
						}
					})
				}.bind(this),
				dragleave: function (e)
				{
					if (unSupportDropColumnDridTypes.indexOf(that._gridType) > -1)
						return;

					var $dragEle = e.draggable.hint;
					if (e.pageX < 0 || e.pageX >= $(window).width() || e.pageY < 0 || e.pageY >= $(window).height())
					{
						$(window).off(this.isMobileDevice ? "touchend.kendogrid" : "mouseup.kendogrid").on(this.isMobileDevice ? "touchend.kendogrid" : "mouseup.kendogrid", function ()
						{
							deleteColumn(e);
						});
						return;
					}
					$("body").off(this.isMobileDevice ? "touchmove" : "mousemove");
					$dragEle.removeClass("dragIn");
				}.bind(this),
				drop: function (e)
				{
					if (unSupportDropColumnDridTypes.indexOf(that._gridType) > -1)
						return;

					deleteColumn(e);
					$(window).off(this.isMobileDevice ? "touchend.kendogrid" : "mouseup.kendogrid");
				}
			});
	};

	KendoGrid.prototype._removeColumn = function (columnDisplayName)
	{
		var columns = this._obSelectedColumns();
		var avaColumns = this._availableColumns;
		for (var idx = 0; idx < columns.length; idx++)
		{
			if (columns[idx].DisplayName === columnDisplayName)
			{
				avaColumns.push(columns[idx]);
				this.clearCustomFilterByFieldName(columns[idx].FieldName);
				columns.splice(idx, 1);
				break;
			}
		}
		this._obSelectedColumns(columns);
		this._availableColumns = avaColumns;
	};

	//view-1301 Grid will freeze up if last remaining unlocked column is removed from grid
	KendoGrid.prototype._removingOnlyOneUnLockColumn = function (columnDisplayName)
	{
		var that = this;
		var lockedColumn = Enumerable.From(that._obSelectedColumns()).Where("$.locked").ToArray();
		if (lockedColumn.length + 1 === that._obSelectedColumns().length)
		{
			tf.promiseBootbox.confirm(
				{
					message: "All visible columns to the left of this column are locked. Removing this column will unlock those columns. Are you sure you want to remove this column?",
					title: "Remove Confirmation"
				}).then(function (ans)
				{
					if (ans === true)
					{
						that._removeColumn(columnDisplayName);
						that.tobeLockedColumns = [];
						that.rebuildGrid();
					}
				});
			return true;
		}
		return false;
	};



	KendoGrid.prototype.getKendoSortColumn = function ()
	{
		if (Array.isArray(this.options.defaultSort) && this.options.defaultSort.length > 0)
		{
			return this.options.defaultSort;
		}

		if (this._obCurrentGridLayoutExtendedDataModel() && this._obCurrentGridLayoutExtendedDataModel().layoutColumns())
		{
			var list = Enumerable.From(this._obCurrentGridLayoutExtendedDataModel().layoutColumns()).Where(function (c)
			{
				return c.SortIndex != undefined;
			}).ToArray();
			return list.map(function (item)
			{
				return {
					field: item.FieldName,
					dir: item.SortAscending ? "asc" : "desc"
				}
			});
		}
		else
		{
			return [];
		}
	};

	KendoGrid.prototype.initDragHeadEvent = function ()
	{
		var self = this;
		var dragable = this.$container.data().kendoDraggable;
		dragable.setOptions(
			{
				container: $("body")
			});
		var dragIntervalEvent;
		dragable.bind('dragstart', function (e)
		{
			if (e.currentTarget.data("kendo-field") === "bulk_menu")
			{
				e.preventDefault();
				return;
			}
			if (self.tobeLockedColumns.length == 0 || (self.tobeLockedColumns[0].field === 'bulk_menu'))
			{
				self.kendoGrid.columns.forEach(function (item)
				{
					item.lockable = false;
				});
			}
			dragIntervalEvent = setInterval(function ()
			{
				var scrollleft = this.$container.find('.k-grid-header-wrap.k-auto-scrollable').scrollLeft();
				var gridContent = this.$container.find(".k-virtual-scrollable-wrap").length > 0 ? this.$container.find(".k-virtual-scrollable-wrap") : this.$container.find(".k-grid-content");
				gridContent.scrollLeft(scrollleft);
				if (this.$summaryContainer)
				{
					var $summaryGrid = this.$summaryContainer.find(".k-grid-content");
					$summaryGrid.scrollLeft(scrollleft);
				}
			}.bind(this), 10);
		}.bind(this)).bind('dragend', function ()
		{
			clearInterval(dragIntervalEvent);
			self.tobeLockedColumns = [];
			self.kendoGrid.columns.forEach(function (item)
			{

				item.lockable = true;
				if (item.locked)
				{
					self.tobeLockedColumns.push(item);
				}
			});
			if (self.obSummaryGridVisible())
			{
				self.fitContainer();
			}
		});
	};

	KendoGrid.prototype.columnReorderEvent = function (e)
	{
		var grid = this.kendoGrid;
		if (typeof e.column.reorderable != "undefined" && !e.column.reorderable)
		{
			setTimeout(function ()
			{
				grid.reorderColumn(e.oldIndex, grid.columns[e.newIndex]);
			}, 0);
			return;
		}

		if (e.oldIndex === 0 && this.options.showLockedColumn)
		{
			setTimeout(function ()
			{
				grid.reorderColumn(e.oldIndex, grid.columns[e.newIndex]);
			});
		}
		else
		{
			//use timeout because of columnReorder event fire before real reorded
			setTimeout(function ()
			{
				this.saveState();
			}.bind(this));
		}

	};

	KendoGrid.prototype.columnHideEvent = function (e)
	{
		this.saveState();
	};

	KendoGrid.prototype.columnShowEvent = function (e)
	{
		this.saveState();
	};

	KendoGrid.prototype.addRemoveColumnClick = function (model, e)
	{
		var self = this;

		function changeColumn(editColumnViewModel)
		{
			self._obSelectedColumns(editColumnViewModel.selectedColumns);
			self._availableColumns = editColumnViewModel.availableColumns;
			self.removeHiddenColumnQuickFilter(self._availableColumns);
			self.removeHiddenColumnSummaryFunction(editColumnViewModel.selectedColumns); //Similar to the quick filters, when a column is hidden the summary function associated with it should be cleared.
			self.tobeLockedColumns = self._obSelectedColumns().filter(function (item)
			{
				return item.locked === true;
			});

			self.rebuildGrid().then(function ()
			{
				// rebuildGrid is a promise method
			});
		}
		if (TF.isPhoneDevice)
		{
			var cacheOperatorBeforeHiddenMenu = TF.menuHelper.needHiddenOpenedMenu(e);
			var cacheOperatorBeforeOpenMenu = TF.menuHelper.needOpenCurrentMenu(e);

			if (cacheOperatorBeforeHiddenMenu)
			{
				TF.menuHelper.hiddenMenu();
			}

			if (cacheOperatorBeforeOpenMenu)
			{
				tf.pageManager.showContextMenu(e.currentTarget);
				tf.contextMenuManager.showMenu(e.target, new TF.ContextMenu.TemplateContextMenu("workspace/grid/EditKendoColumnForMobile",
					new TF.Modal.Grid.EditKendoColumnModalViewModelForMobile(
						this._availableColumns,
						this._obSelectedColumns(),
						this._defaultGridLayoutExtendedEntity.LayoutColumns,
						changeColumn
					)));
			}
		}
		else
		{
			tf.modalManager.showModal(
				new TF.Modal.Grid.EditKendoColumnModalViewModel(
					this._availableColumns,
					this._obSelectedColumns(),
					this._defaultGridLayoutExtendedEntity.LayoutColumns
				)
			)
				.then(function (editColumnViewModel)
				{
					if (!editColumnViewModel)
					{
						return;
					}
					changeColumn(editColumnViewModel);
				}.bind(this));
		}
	};

	KendoGrid.prototype.raiseGridStateChange = function ()
	{
		if (this.options.onGridStateChange)
		{
			this.options.onGridStateChange.notify();
		}
	};

	KendoGrid.prototype.exportCurrentGrid = function (selectedIds)
	{
		var self = this,
			url = pathCombine(tf.api.apiPrefix(), "search", `${tf.DataTypeHelper.getFormalDataTypeName(this.options.gridType).replace(/\s+/gi, "")}ExportFiles`);

		self.getIdsWithCurrentFiltering()
			.then(function (ids)
			{
				tf.promiseBootbox.dialog(
					{
						closeButton: true,
						title: "Save As",
						message: "Select the file format that you would like to save the selected records in." +
							"<div class='col-xs-24'>" +
							"<br/><label>Type</label>" +
							"<div class='save-content'>" +
							"<input id='csvradio' type='radio' checked='checked' name='type' value='csv' />" +
							"<label for='csvradio'>Comma Separated Value (.csv)</label>" +
							"<br/><input id='xlsradio' type='radio' name='type' value='xlsx' />" +
							"<label for='xlsradio'>Excel Workbook (.xlsx)</label>" +
							"<div>" +
							"</div>",
						buttons:
						{
							save:
							{
								label: "Save",
								className: "btn tf-btn-black btn-sm",
								callback: function ()
								{
									var fileFormat = $("#csvradio").is(':checked') ? 'csv' : 'xlsx';

									var gridLayoutExtendedEntity = self._obCurrentGridLayoutExtendedDataModel().toData();
									gridLayoutExtendedEntity.LayoutColumns = self._obSelectedColumns();
									if (self.options.gridType === "form" && self.options.exportColumns)
									{
										gridLayoutExtendedEntity.LayoutColumns = self.options.exportColumns;
									}

									var getDataUrl = url + '/';
									var getDataOption = {
										paramData:
										{
											fileFormat: fileFormat
										},
										data: {
											"gridLayoutExtendedEntity": gridLayoutExtendedEntity,
											"selectedIds": selectedIds ? selectedIds : ids,
											"sortItems": self.searchOption.data.sortItems
										}
									};

									if (self.options.gridType === "busfinderhistorical" ||
										self.options.gridType === "form")
									{
										self.options.setRequestOption(getDataOption);
									}

									tf.promiseAjax.post(getDataUrl, getDataOption).then(function (keyApiResponse)
									{
										let exportFileName;
										if (self.options.gridType === "form")
										{
											exportFileName = self.options.gridData.text;
										}
										else
										{
											const gridTypeName = tf.dataTypeHelper.getFormalDataTypeName(self.options.gridType);
											const gridTypeLabel = tf.applicationTerm.getApplicationTermSingularByName(gridTypeName);
											exportFileName = gridTypeLabel.replaceAll(" ", "").toLowerCase();
										}
										var fileUrl = `${url}?key=${keyApiResponse.Items[0]}&fileFormat=${fileFormat}&fileName=${encodeURIComponent(exportFileName)}`;
										window.open(fileUrl);
									});
								}
							},
							cancel:
							{
								label: "Cancel",
								className: "btn btn-link btn-sm"
							}
						}
					});
			});
	};

	KendoGrid.prototype.exportCurrentGridInMobile = function (selectedIds)
	{
		this.exportGridModalViewModel = new TF.Modal.ExportGridModalViewModel(selectedIds, this);
		tf.modalManager.showModal(this.exportGridModalViewModel);
	};

	KendoGrid.prototype.onShiftIPress = function (e, keyCombination)
	{
		if (this._obDocumentFocusState())
		{
			this.invertSelection();
		}
	};

	KendoGrid.prototype.onShiftOPress = function (e, keyCombination)
	{
		if (this._obDocumentFocusState())
		{
			this.omitSelection();
		}
	};

	KendoGrid.prototype.onShiftAPress = function (e, keyCombination)
	{
		if (this._obDocumentFocusState())
		{
			this.allSelection();
		}
	};

	KendoGrid.prototype.onDataBound = function ()
	{
		var self = this;
		if (!this.kendoGrid)
		{ //only for setdatasource directly
			this.kendoGrid = this.$container.data("kendoGrid");
		}

		if (this._hasLockedColumns())
			this.removeNotOnlyFirstColumnLockedStyle();
		else
			this.applyNotOnlyFirstColumnLockedStyle();

		if (this.isBigGrid || SCHEDULE_GRIDS.concat(THEMATIC_NOT_BIG_GRIDS).includes(this._gridType))
		{
			if (!this.selectedGridThematicConfigs)
			{
				this.selectedGridThematicConfigs = this.getSelectedGridThematicConfigs();
			}
		}

		TF.Grid.LightKendoGrid.prototype.onDataBound.apply(this);

		var $container = this.$container;
		var $lockedContent = $container.find(".k-grid-content-locked");
		if ($lockedContent &&
			this.obSummaryGridVisible && this.obSummaryGridVisible() && this.overlay !== false)
		{
			!this.options.isMiniGrid && tf.loadingIndicator.showImmediately();
			this.createSummaryGrid();
			this._delayHideLoadingIndicator();

			$lockedContent.height($lockedContent.next().height());
		}

		if (TF.isMobileDevice && $lockedContent)
		{
			var kendoGrid = this.kendoGrid;
			var $lockbar = $container.find('.tf-mobile-grid-lockbar');
			if ($lockbar.length > 0)
			{
				$lockbar.remove();
			}
			this.$lockbar = new TF.Grid.KendoGridLockbar();
			this.$lockbar._createLockbar($container, kendoGrid, this.permanentLockCount);
			this.$lockbar._bindEvent();
			this.$lockbar.onDragEnd.subscribe(function (event, data)
			{
				var lockedColumnIdx = data;

				var columns = this.kendoGrid.columns;
				var currentLockedColumnCount = this.countLockedColumns(columns);

				if (lockedColumnIdx + 1 === currentLockedColumnCount)
					return;
				if (lockedColumnIdx + 1 < this.permanentLockCount() &&
					currentLockedColumnCount === this.permanentLockCount())
					return;

				this._lockUnLockedByColumnIndex.bind(this)(lockedColumnIdx);
			}.bind(this));
			this.$lockbar._resetlockbarPosition();
			this.$lockbar._resetlockbarHeight();
		}

		if (this.initialFilter)
		{
			this.initialFilter = false;

			var filterData = this.getQuickFilter().data;

			if (filterData.callOutFilterName)
			{
				this.obCallOutFilterName(filterData.callOutFilterName);
			}

			if (filterData.idFilter && filterData.idFilter.ExcludeAny && filterData.idFilter.ExcludeAny.length > 0)
			{
				var excludeIds = filterData.idFilter.ExcludeAny;
				this.obTempOmitExcludeAnyIds(excludeIds);
			}

			if (filterData.idFilter && filterData.idFilter.IncludeOnly)
			{
				var includeIds = filterData.idFilter.IncludeOnly;
				this._gridState.filteredIds = includeIds;
			}

			setTimeout(function ()
			{
				this.allIds = [];
			}.bind(this), 1000);

			if (filterData.filterSet && filterData.filterSet.FilterItems.length > 0)
			{
				var kendoFilterItems = this.convertRequest2KendoFilterSet(filterData.filterSet);

				// sticky filter read, then set the filter icon after the element render, this settimeout is wait for the element render.
				this.kendoGrid.dataSource.filter(kendoFilterItems);
				setTimeout(function ()
				{
					this.setColumnCurrentFilterIcon();
					this.setColumnCurrentFilterInput();
				}.bind(this), 50);
				this.setFilterIconByKendoDSFilter();
			}
			else if (filterData.idFilter && ((filterData.idFilter.ExcludeAny && filterData.idFilter.ExcludeAny.length > 0) || filterData.idFilter.IncludeOnly))
			{
				this.kendoGrid.dataSource.read();
			}
		}
		if ($(".grid-staterow").find('span') && $(".grid-staterow").find('span').length > 0)
		{
			$(".grid-staterow").find('span')[1].setAttribute('title', this.obSelectedGridFilterName());
		}

		if (this.isBigGrid || SCHEDULE_GRIDS.concat(THEMATIC_NOT_BIG_GRIDS).includes(this._gridType))
		{
			if (this.predefinedGridData)
			{
				this.predefinedGridData = null;
			}
			if (!this.selectedGridThematicConfigs)
			{
				this.selectedGridThematicConfigs = this.getSelectedGridThematicConfigs();
			}

			if (this.lazyloadFields.udf.length === 0)
			{
				this.applyGridThematicConfigs();
			}
		}

		this._delayHideLoadingIndicator();
	};

	KendoGrid.prototype._delayHideLoadingIndicator = function (delayTime)
	{
		delayTime = delayTime || 200;
		setTimeout(function ()
		{
			tf.loadingIndicator.tryHide();
		}, delayTime);
	};

	KendoGrid.prototype.summarybarIconClick = function ()
	{
		this.toggleSummaryBar();
		setTimeout(function ()
		{
			this.saveState();
		}.bind(this));
	};

	KendoGrid.prototype.refreshClick = function ()
	{
		tf.loadingIndicator.showImmediately();
		var self = this;

		var stickGridConfig = {
			isLayoutApplied: self.obSelectedGridLayoutName() !== 'Default',
			isFilterApplied: self.obSelectedGridFilterName() !== 'None',
			stickLayoutModel: self._obCurrentGridLayoutExtendedDataModel(),
			stickLayoutAssociateFilter: null,
			stickFilterModel: self.obSelectedGridFilterDataModel()
		};

		var unsyncedDBLayoutTmp = null;
		if (self.obGridFilterDataModels() && self.obGridFilterDataModels().length > 0)
		{
			var stickLayoutAssociateFilterId = stickGridConfig.stickLayoutModel._entityBackup.FilterId;
			self.obGridFilterDataModels().map(function (filter)
			{
				if (filter.id() === stickLayoutAssociateFilterId)
					stickGridConfig.stickLayoutAssociateFilter = filter;
			});
		}
		self._syncGridConfigExceptAppliedLayoutAndPromptDeletedFilter(stickGridConfig)
			.then(function (unsyncedDBLayout)
			{
				unsyncedDBLayoutTmp = unsyncedDBLayout;
				return self._getStickGridConfigModifiedStatus(stickGridConfig, unsyncedDBLayoutTmp);
			})
			.then(function (modifiedStatus)
			{
				return self._refreshGridByConfigModifiedStatus(modifiedStatus, stickGridConfig, unsyncedDBLayoutTmp);
			}).then(function ()
			{
				setTimeout(function ()
				{
					tf.loadingIndicator.tryHide();
				}, 1500);
			});
	};

	KendoGrid.prototype._setGridState = function ()
	{
		var self = this, args = arguments;
		const preWorkList = [self.loadGridFilter()];

		if (self.obThematicSupported())
		{
			const currentLayout = self._obCurrentGridLayoutExtendedDataModel();
			preWorkList.push(self.loadGridThematic(currentLayout.thematicId()));
		}

		return Promise.all(preWorkList).then(function ()
		{
			TF.Grid.LightKendoGrid.prototype._setGridState.apply(self, args);
		});
	};

	KendoGrid.prototype._syncGridConfigExceptAppliedLayoutAndPromptDeletedFilter = function (stickGridConfig)
	{
		var self = this;
		return self.loadGridFilter() // sync filter and prompt deleted filter
			.then(function ()
			{
				return self._syncLayoutExceptApplied.bind(self)(stickGridConfig);
			});
	};

	// excpted applied layout because set knockout object obGridLayoutExtendedDataModels will trigger function 'resetLayout' and clear current layout
	KendoGrid.prototype._syncLayoutExceptApplied = function (stickGridConfig)
	{
		var unsyncedDBLayout = null;
		var self = this;
		const dataTypeId = tf.dataTypeHelper.getId(self.options.gridType)

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridlayouts?DataTypeID=" + dataTypeId))
			.then(function (apiResponse)
			{
				var gridLayoutExtendedDataModels =
					TF.DataModel.BaseDataModel.create(TF.DataModel.GridLayoutExtendedDataModel, apiResponse.Items);

				// updated layout except applied
				var stickLayoutId = stickGridConfig.stickLayoutModel ? stickGridConfig.stickLayoutModel.id() : null;
				const currentLayouts = self.obGridLayoutExtendedDataModels();
				let currentLayoutsChanged = false;
				var layoutCnt = currentLayouts.length;
				for (var idx = layoutCnt - 1; idx >= 0; idx--)
				{
					if (currentLayouts[idx].id() !== stickLayoutId)
					{
						currentLayouts.splice(idx, 1);
						currentLayoutsChanged = true;
					}
				}

				gridLayoutExtendedDataModels.map(function (layout, idx)
				{
					if (layout.id() !== stickLayoutId)
					{
						currentLayouts.push(layout);
						currentLayoutsChanged = true;
					}
					else
						unsyncedDBLayout = layout;
				});

				if (currentLayoutsChanged)
				{
					self.obGridLayoutExtendedDataModels(currentLayouts);
				}

				return Promise.resolve(unsyncedDBLayout);
			});
	};

	KendoGrid.prototype._getStickGridConfigModifiedStatus = function (stickGridConfig, unsyncedDBLayout)
	{
		var self = this;
		var modifiedStatus = {
			isDeletedLayout: false,
			isUpdatedLayout: false,
			isUpdatedLayoutOnlyFilterWhereCluase: false,
			isDeletedFilter: false,
			isUpdatedFilter: false
		};

		if (stickGridConfig.isLayoutApplied)
		{
			// Compare current layout and newLayouts
			if (!unsyncedDBLayout)
				modifiedStatus.isDeletedLayout = true;
			else
			{
				var formatedGridLayout = TF.DataModel.BaseDataModel.create(TF.DataModel.GridLayoutExtendedDataModel, stickGridConfig.stickLayoutModel._entityBackup);
				var stickBackUpLayoutColumns = formatedGridLayout.layoutColumns();
				var stickBackUpLayoutName = stickGridConfig.stickLayoutModel._entityBackup.Name;
				var stickBackUpLayoutShowSummaryBar = stickGridConfig.stickLayoutModel._entityBackup.ShowSummaryBar;
				modifiedStatus.isUpdatedLayout = (!TF.Grid.LayoutHelper.compareLayoutColumns(stickBackUpLayoutColumns, unsyncedDBLayout.layoutColumns()) ||
					stickBackUpLayoutName !== unsyncedDBLayout.name() ||
					stickBackUpLayoutShowSummaryBar !== unsyncedDBLayout.showSummaryBar()
				);

				var stickBackupFilterId = stickGridConfig.stickLayoutModel._entityBackup.FilterId;
				if (!modifiedStatus.isUpdatedLayout)
					modifiedStatus.isUpdatedLayout = (stickBackupFilterId !== unsyncedDBLayout.filterId());

				if (!modifiedStatus.isUpdatedLayout &&
					!TF.Grid.FilterHelper.isDrillDownFillter(stickBackupFilterId))
				{
					var syncedLayoutFilterModels = self.obGridFilterDataModels().filter(function (filter, idx)
					{
						return filter.id() === stickBackupFilterId;
					});

					if (syncedLayoutFilterModels && syncedLayoutFilterModels.length > 0)
					{
						var syncedLayoutFilterModel = syncedLayoutFilterModels[0];
						modifiedStatus.isUpdatedLayout = !TF.Grid.FilterHelper.compareFilterWhereClause(
							stickGridConfig.stickLayoutAssociateFilter.whereClause(), syncedLayoutFilterModel.whereClause()
						);

						// This status for case of : applyed layout only filter whereClause updated by another user
						modifiedStatus.isUpdatedLayoutOnlyFilterWhereCluase = modifiedStatus.isUpdatedLayout;
					}
				}
			}
		}
		else if (stickGridConfig.isFilterApplied)
		{
			if (stickGridConfig.stickFilterModel)
			{
				var stickFilterId = stickGridConfig.stickFilterModel.id();
				if (!TF.Grid.FilterHelper.isDrillDownFillter(stickFilterId))
				{
					var syncedFilterModels = self.obGridFilterDataModels().filter(function (filter, idx)
					{
						return filter.id() === stickFilterId;
					});

					if (!syncedFilterModels || syncedFilterModels.length === 0)
						modifiedStatus.isDeletedFilter = true;
					else
					{
						var syncedFilterModel = syncedFilterModels[0];
						modifiedStatus.isUpdatedFilter = !TF.Grid.FilterHelper.compareFilterWhereClause(
							stickGridConfig.stickFilterModel.whereClause(), syncedFilterModel.whereClause()
						);
					}
				}
			}
		}

		return Promise.resolve(modifiedStatus);
	};

	KendoGrid.prototype._handleUnsyncedLayout = function (unhandledStickLayoutId, unsyncedDBLayout)
	{
		var self = this;
		var layoutCnt = self.obGridLayoutExtendedDataModels().length;
		for (var idx = layoutCnt - 1; idx >= 0; idx--)
		{
			if (self.obGridLayoutExtendedDataModels()[idx].id() === unhandledStickLayoutId)
			{
				if (unsyncedDBLayout)
					self.obGridLayoutExtendedDataModels().splice(idx, 1, unsyncedDBLayout);
				else
					self.obGridLayoutExtendedDataModels().splice(idx, 1);
				break;
			}
		}
	};

	KendoGrid.prototype._refreshGridByConfigModifiedStatus = function (modifiedStatus, stickGridConfig, unsyncedDBLayout)
	{
		var self = this;
		var stickLayoutId;
		var message;

		if (modifiedStatus.isDeletedLayout && !self.options.fromSearch)
		{
			return self.applyLayout(self._obCurrentGridLayoutExtendedDataModel());
		}
		else if (modifiedStatus.isUpdatedLayout ||
			modifiedStatus.isUpdatedLayoutOnlyFilterWhereCluase)
		{
			if (modifiedStatus.isUpdatedLayoutOnlyFilterWhereCluase)
				message = 'The applied Filter has been modified. The latest definition will be applied.';
			else
				message = 'The applied Layout has been modified. The latest definition will be applied.';

			return tf.promiseBootbox.alert(message, 'Warning', 40000)
				.then(function ()
				{
					stickLayoutId = stickGridConfig.stickLayoutModel.id();
					self._handleUnsyncedLayout(stickLayoutId, unsyncedDBLayout);
					self._obCurrentGridLayoutExtendedDataModel(unsyncedDBLayout);

					var isNoConfirm = true;
					return self.applyLayout(self._obCurrentGridLayoutExtendedDataModel(), isNoConfirm);
				});
		}
		else if (modifiedStatus.isUpdatedFilter)
		{
			self.clearQuickFilterCompent();
			message = 'The applied Filter has been modified.  The latest definition will be applied.';
			return tf.promiseBootbox.alert(message, 'Warning', 40000)
				.then(function ()
				{
					return self.applyGridFilter(self.obSelectedGridFilterDataModel());
				});
		}
		else
		{
			return self._triggerRefreshClick();
		}
	};

	KendoGrid.prototype._triggerRefreshClick = function ()
	{
		var self = this;
		TF.Grid.LightKendoGrid.prototype.refreshClick.apply(self);
	};

	KendoGrid.prototype.toggleSummaryBar = function ()
	{
		this.obSummaryGridVisible(!this.obSummaryGridVisible());
		this.lockSummaryFirstColumn();
	};

	KendoGrid.prototype.resizableBinding = function ()
	{
		var self = this;
		if (self.options.resizable === false)
		{
			return;
		}
		self.kendoGrid.resizable.bind("start", function (e)
		{
			self.resizeTh = $(e.currentTarget).data("th");
			self.resizeIdx = self.resizeTh.index();
			self.isColumnLocked = $(self.resizeTh.parents()[3]).hasClass("k-grid-header-locked");
		});
		self.kendoGrid.resizable.bind("resize", function (e)
		{
			var dataTh = $(e.currentTarget).data("th");
			var columnOptions = [];
			if (dataTh) { columnOptions = self.kendoGrid.columns.filter(function (column) { return column.field == dataTh.data("kendoField") }); }

			var columnOption;
			if (columnOptions.length) { columnOption = columnOptions[0]; }

			var frozenWidth;
			if (columnOption) { frozenWidth = columnOption.frozenWidth; }

			var thead;
			var tbody;
			var summaryThead, summaryTbody;
			var minTableWidth = 0;
			var minColumnWidth = 150;
			if (self.isColumnLocked)
			{
				thead = self.kendoGrid.lockedHeader.find("table").closest("table");
				tbody = self.kendoGrid.lockedTable.closest("table");

				var tbodyWidth = tbody.width();

				var tbodyWidth = tbody.width();
				if (frozenWidth)
					tbodyWidth = 0;

				self.$container.find(".k-grid-header-locked,.k-grid-content-locked").width(tbodyWidth);

				if (self.summaryKendoGrid)
				{
					self.$summaryContainer.find(".k-grid-header-locked,.k-grid-content-locked").width(tbodyWidth);
					summaryThead = self.summaryKendoGrid.lockedHeader.find("table").closest("table");
					summaryTbody = self.summaryKendoGrid.lockedTable.closest("table");
					self.lockSummaryFirstColumn();
				}
				if (thead.children("thead").children("tr").filter(":first").find("th").eq(self.resizeIdx).data("kendoField") == "bulk_menu")
				{
					thead.children("colgroup").find("col").eq(self.resizeIdx).width('40px');
					tbody.children("colgroup").find("col").eq(self.resizeIdx).width('40px');
					self.lockGridFirstColumn();
					return;
				}
			}
			else
			{
				thead = self.kendoGrid.thead.closest("table");
				tbody = self.kendoGrid.tbody.closest("table");
				if (self.summaryKendoGrid)
				{
					summaryThead = self.summaryKendoGrid.thead.closest("table");
					summaryTbody = self.summaryKendoGrid.tbody.closest("table");
				}
			}

			var headerColumn = thead.children("thead").children("tr").filter(":first").find("th").eq(self.resizeIdx)[0];


			if (thead.children("thead").find("tr.k-filter-row").find("th").eq(self.resizeIdx).find(".k-i-clock").length > 0)
			{
				minColumnWidth = 170;
			}
			else if (thead.children("thead").find("tr.k-filter-row").find("th").eq(self.resizeIdx).find(".k-i-calendar").length > 0)
			{
				minColumnWidth = 170;
			}

			if (headerColumn != undefined && headerColumn.innerText.length > 20)
			{
				minColumnWidth = headerColumn.innerText.length * 7 + 10;
			}

			if ((self.resizeTh.width() >= minColumnWidth))
			{
				minTableWidth = tbody.width();
			}

			if (frozenWidth)
			{
				minTableWidth = 0;
				minColumnWidth = frozenWidth;
			}

			if (self.resizeTh.width() < minColumnWidth || frozenWidth)
			{
				// the next line is ONLY needed if Grid scrolling is enabled
				thead.width(minTableWidth).children("colgroup").find("col").eq(self.resizeIdx).width(minColumnWidth + 'px');
				tbody.width(minTableWidth).children("colgroup").find("col").eq(self.resizeIdx).width(minColumnWidth + 'px');
			}
			if (self.summaryKendoGrid)
			{
				self.$summaryContainer.find(".k-grid-content>table,.k-grid-header-wrap>table").width(tbody.width());
				var width = tbody.children("colgroup").find("col").eq(self.resizeIdx).width();
				[summaryThead, summaryTbody].forEach(function (table)
				{
					table.children("colgroup").find("col").eq(self.resizeIdx).width(width);
				});
			}

			self._refreshGridBlank();
		});

		self.kendoGrid.resizable.bind("resizeend", function (e)
		{
			self._refreshGridBlank();
			if (self.obSummaryGridVisible())
			{
				self.fitContainer();
			}
		});
	};

	KendoGrid.prototype.lockGridFirstColumn = function () //lock the first column
	{
		var theadTable = this.kendoGrid.lockedHeader.find("table");
		if (this.isColumnLocked && theadTable.children("thead").children("tr").filter(":first").find("th").eq(this.resizeIdx).data("kendoField") == "bulk_menu")
		{
			var tbodyTable = this.kendoGrid.lockedTable;
			if (theadTable.parent().find("col").length === 1)
			{
				theadTable.attr("style", "width:40px");
				tbodyTable.attr("style", "width:40px");
			}
			else //if the lock area has more than one column,keep the width of lock area donnot change
			{
				var width = 0;
				for (var i = 0; i < theadTable.parent().find("col").length; i++)
				{
					var colItem = theadTable.parent().find("col")[i];
					width += parseInt(colItem.style.width.substring(0, colItem.style.width.length - 2));
				}
				theadTable.attr("style", "width:" + width + "px");
				tbodyTable.attr("style", "width:" + width + "px");
			}
			theadTable.parent().find("col").eq(this.resizeIdx).attr("style", "width:40px");
			tbodyTable.parent().find("col").eq(this.resizeIdx).attr("style", "width:40px");
		}
	};

	//chang sort model {if shift press, the sort model is multiple; else, sort model is single}
	KendoGrid.prototype.changeSortModel = function ()
	{
		var self = this;
		this.kendoGrid.element.find("div.k-grid-header [data-kendo-role=columnsorter]").on("mousedown", function (e)
		{
			if ((self.kendoGrid.options.sortable.mode != "multiple" && e.shiftKey) || (self.kendoGrid.options.sortable.mode != "single" && !e.shiftKey))
			{
				var sortIdx = $(e.currentTarget).index();
				var isLockedColumn = $($(e.currentTarget).parents()[3]).hasClass("k-grid-header-locked");
				self.sortModel = e.shiftKey ? "multiple" : "single";
				self.rebuildGrid().then(function ()
				{
					// rebuildGrid is a promise method
					var thead;
					if (isLockedColumn)
					{
						thead = self.kendoGrid.lockedHeader.find("table").closest("table");
					}
					else
					{
						thead = self.kendoGrid.thead.closest("table");
					}
					thead.children("thead").children("tr").filter(":first").find("th").eq(sortIdx).click();
				});

			}
		});
	};

	KendoGrid.prototype.columnResizeEvent = function (e)
	{
		TF.Grid.LightKendoGrid.prototype.columnResizeEvent.apply(this);
		setTimeout(function ()
		{
			this.saveState();
		}.bind(this));
	};

	KendoGrid.prototype._lockUnLockedByColumnIndex = function (index)
	{
		var self = this;
		var column = self.kendoGrid.columns[index];

		if (column.locked)
		{
			tf.loadingIndicator.show();
			//Unlock Columns
			//find all locked columns, and unlock all the locked columns to the right of the clicked column (including the clicked column)
			var lockCount = self.countLockedColumns(self.kendoGrid.columns);
			var unlockColumn = [];
			if (index != lockCount - 1) //not the right-most locked column, unlock all locked columns to its right
			{
				for (var idx = lockCount - 1; idx > index; idx--)
				{
					var tmp = self.kendoGrid.columns[idx];
					unlockColumn.push(tmp.field);
				}
			}
			else //is the right-most locked column, unlock all
			{
				for (var idx = index; idx >= self.permanentLockCount(); idx--)
				{
					var tmp = self.kendoGrid.columns[idx];
					unlockColumn.push(tmp.field);
				}
			}
			for (var i = 0; i < self.tobeLockedColumns.length; i++)
			{
				for (var j = 0; j < unlockColumn.length; j++)
				{
					if (unlockColumn[j] === self.tobeLockedColumns[i].field)
					{
						self.tobeLockedColumns.splice(i, 1);
						i--;
						break;
					}
				}
			}

			self.rebuildGrid().then(function ()
			{
				// rebuildGrid is a promise method
				tf.loadingIndicator.tryHide();
				//if there is no locked column left, display message
				if (self._hasLockedColumns())
				{
					self.removeNotOnlyFirstColumnLockedStyle();
					self._showColumnUnlockedMessage();
				}
				else
				{
					self.applyNotOnlyFirstColumnLockedStyle();
					self._showColumnLockedMessage();
				}

			});
		}
		else
		{
			//Lock columns
			//store all the to be locked columns, and lock all the columns to the left of the clicked column (including the clicked column)
			var tobeLockedColumnsTmp = self.tobeLockedColumns.map(function (item)
			{
				return item;
			});
			for (var idx = self.permanentLockCount(); idx <= index; idx++)
			{
				var tmp = self.kendoGrid.columns[idx];
				if (!tmp.locked)
				{
					self.tobeLockedColumns.push(tmp);
				}
			}
			var tempColumns = self.tooManyLockedColumns(self.tobeLockedColumns);

			self.tobeLockedColumns = tempColumns;
			self.rebuildGrid().then(function ()
			{
				self._showColumnLockedMessage();
			});
		}

		setTimeout(function ()
		{
			self.saveState();
		});
	};

	KendoGrid.prototype._hasLockedColumns = function ()
	{
		var self = this;
		return (self.countLockedColumns(self.kendoGrid.columns) - self.permanentLockCount()) === 0;
	};

	KendoGrid.prototype.applyNotOnlyFirstColumnLockedStyle = function ()
	{
		$('.gridrow .full-height').addClass('not-only-first-column-locked');
	};

	KendoGrid.prototype.removeNotOnlyFirstColumnLockedStyle = function ()
	{
		$('.gridrow .full-height').removeClass('not-only-first-column-locked');
	};

	KendoGrid.prototype.lockUnlockColumn = function ()
	{
		var self = this;
		var header = self.$container.find("th[role='columnheader']");
		$(header).on("mousedown", function (e)
		{
			if (self.options.isMiniGrid)
			{
				return;
			}
			if (e.which == 3)
			{
				var index = parseInt($(this).attr("data-" + kendo.ns + "index"));
				if (index === header.length - 1)
				{
					self.gridAlert.show(
						{
							alert: "Warning",
							title: "Warning",
							message: "There should be at least one non locked column",
							key: self._columnsUnLockedTimesKey
						});
					return;
				}
				self._lockUnLockedByColumnIndex.bind(self)(index);
			}
		});
		$(header).on("contextmenu", function (e)
		{
			return false;
		});

		var $b = self.$container.find("th[role='columnheader'][data-kendo-field='bulk_menu']");
		$b.off("mousedown contextmenu");

		$b = self.$container.find("th[role='columnheader'][data-kendo-field='map_checkbox']");
		$b.off("mousedown contextmenu");
	};

	KendoGrid.prototype._showColumnUnlockedMessage = function ()
	{
		var unlockedAlertOptions = {
			title: "Columns Unlocked",
			message: "Grid columns are no longer locked.  Right click on a grid column header to lock the column and all columns to the left of it.",
			key: this._columnsUnLockedTimesKey
		};
		this.gridAlert.show(this._buildLockedUnLockedAlertOption(unlockedAlertOptions));
	};

	KendoGrid.prototype._showColumnLockedMessage = function ()
	{
		var lockedAlertOptions = {
			title: "Columns Locked",
			message: "Grid columns have been locked. Right click a grid column header to change the locked columns or right click the right-most locked column to remove the lock from all columns.",
			key: this._columnsLockedTimesKey
		};
		this.gridAlert.show(this._buildLockedUnLockedAlertOption(lockedAlertOptions));
	};

	KendoGrid.prototype._buildLockedUnLockedAlertOption = function (options)
	{
		var key = options.key,
			title = options.title,
			message = options.message;

		var times = tf.storageManager.get(key) || 0;
		var gridAlertOption = {
			title: title
		};
		if (times === 0)
		{
			tf.storageManager.save(key, 1);
			gridAlertOption.delay = 10 * 1000;
			gridAlertOption.message = message;
		}
		else if (times === 1)
		{
			tf.storageManager.save(key, 2);
			gridAlertOption.message = message;
		}
		else if (times === 2)
		{
			tf.storageManager.save(key, 3);
			gridAlertOption.message = message;
		}
		else if (times > 2)
		{
			gridAlertOption.width = 150;
			gridAlertOption.delay = 2 * 1000;
		}

		return gridAlertOption;
	};

	KendoGrid.prototype.countLockedColumns = function (columns)
	{
		var count = 0;
		for (var i in columns)
		{
			if (columns[i].locked)
			{
				count += 1;
			}
		}
		return count;
	};

	KendoGrid.prototype.tooManyLockedColumns = function (tobeLockedColumns)
	{
		var containerWidth = this.$container.find(".k-grid-header").width() - 50;
		var lockedWidth = 0;
		var tempColumns = [];
		//get total width of the to be locked columns' width
		for (var i = 0; i < tobeLockedColumns.length; i++)
		{
			lockedWidth += parseInt(tobeLockedColumns[i].width);
			if (lockedWidth > containerWidth)
			{
				return tempColumns;
			}
			tempColumns.push(tobeLockedColumns[i]);
		}
		return tempColumns;
	};

	KendoGrid.prototype.clearKendoGridQuickFilter = function ()
	{
		this.isFromRelated(false);
		this.listFilters = TF.ListFilterHelper.initListFilters();
		TF.CustomFilterHelper.clearCustomFilter();
		this.kendoGrid.dataSource.filter(
			{});
		return Promise.resolve(true);
	};

	KendoGrid.prototype.removeHiddenColumnQuickFilter = function (hiddenColumns)
	{
		var self = this;
		if (!self.kendoGrid.dataSource.filter ||
			!self.kendoGrid.dataSource.filter() ||
			self.kendoGrid.dataSource.filter().filters.length === 0 ||
			hiddenColumns.length === 0)
			return;

		var displayColumnQuickFilters = self.kendoGrid.dataSource.filter().filters.filter(function (filter)
		{
			if (filter.filters)
			{
				var hiddenColumnQuickFilters = hiddenColumns.filter(function (hiddenColumn)
				{
					return (filter.filters[0].field === hiddenColumn.FieldName);
				});
				return (hiddenColumnQuickFilters.length === 0);
			}
			else
			{
				var hiddenColumnQuickFilters = hiddenColumns.filter(function (hiddenColumn)
				{
					return (filter.field === hiddenColumn.FieldName);
				});
				return (hiddenColumnQuickFilters.length === 0);
			}
		});

		if (displayColumnQuickFilters.length === 0)
			return self.clearKendoGridQuickFilter();
		else
		{
			self.kendoGrid.dataSource.filter().filters = displayColumnQuickFilters;
			return Promise.resolve(true);
		}
	};

	KendoGrid.prototype.removeHiddenColumnSummaryFunction = function (selectColumns)
	{
		var self = this;
		if (!self.obAggregationMap() || selectColumns.length === 0)
			return;
		var aggregations = self.obAggregationMap();
		for (var key in aggregations)
		{
			if (aggregations[key])
			{
				var keyExist = false;
				selectColumns.map(function (selectColumn)
				{
					if (key === selectColumn["FieldName"])
					{
						keyExist = true;
						return;
					}
				});
				if (!keyExist)
				{
					delete aggregations[key];
				}
			}
		}
		self.obAggregationMap(aggregations);
	};

	KendoGrid.prototype._setgridStateTwoRowWhenOverflow = function ()
	{
		//show hide comma when filter and layout toggle split to tow row on tablet
		if (TF.isMobileDevice)
		{
			$(".grid-staterow-wrap").css("visibility", "hidden");
			setTimeout(function ()
			{
				$(".grid-staterow-wrap").each(function ()
				{
					var width = 0;
					var gridStaterowWrap = $(this);
					gridStaterowWrap.find(".grid-staterow-status").each(function ()
					{
						width += $(this).width();
					});
					var comma = gridStaterowWrap.find(".comma-split");
					var gridStaterow = gridStaterowWrap.children();
					if (width > gridStaterowWrap.width())
					{
						comma.hide();
						gridStaterow.addClass('overflow');
					}
					else
					{
						comma.show();
						gridStaterow.removeClass('overflow');
					}
					gridStaterowWrap.css("visibility", "visible");
				});
			});
		}
	};

	KendoGrid.prototype.bindNeedFileds = function (type, fields)
	{
		fields = TF.Grid.LightKendoGrid.prototype.bindNeedFileds.call(this, type, fields);
		if (type === 'student' || type === 'altsite' || type === 'school' || type === "georegion" || type == "fieldtriplocation")
		{
			if (!Enumerable.From(fields).Contains('Xcoord'))
			{
				fields = fields.concat(['Xcoord']);
			}
			if (!Enumerable.From(fields).Contains('Ycoord'))
			{
				fields = fields.concat(['Ycoord']);
			}
			if (!Enumerable.From(fields).Contains('Geocoded'))
			{
				fields = fields.concat(['Geocoded']);
			}
		}

		this.getSelectedGridThematicConfigs();

		if (this.thematicFields.length > 0)
		{
			var needToAddFields = [];
			this.thematicFields.forEach(function (needField)
			{
				if (!Enumerable.From(fields).Contains(needField))
				{
					needToAddFields.push(needField);
				}
			});

			fields = fields.concat(needToAddFields);
		}

		return fields;
	};

	KendoGrid.prototype.getCurrentGridLayout = function ()
	{
		return this._obCurrentGridLayoutExtendedDataModel();
	};

	/**
	 * Apply grid thematic configs.
	 *
	 * @param {*} selectedGridThematicConfigs
	 * @return {*}
	 */
	KendoGrid.prototype.applyGridThematicConfigs = function (selectedGridThematicConfigs)
	{
		const self = this;

		selectedGridThematicConfigs = selectedGridThematicConfigs || self.selectedGridThematicConfigs;

		const isToApplyThematic = Boolean(selectedGridThematicConfigs);
		const $table = (self.kendoGrid && self.kendoGrid.table) || self.$container.find("div[class^='k-grid-content'] table");
		const $trList = $table.find(">tbody>tr.k-master-row");

		self.obIsThematicApplied(isToApplyThematic);

		// Clear thematic marks.
		if (!isToApplyThematic)
		{
			$trList.attr(THEMATIC_COLOR_ATTRIBUTE, null);
			return;
		}

		// Apply thematic configurations.
		const $leadingTable = self.$container.find("div[class^='k-grid-content-locked'] table");
		const $leadingRows = $leadingTable.find(">tbody>tr.k-master-row");
		let $fullfillRows = self.$container.find(".kendogrid-blank-fullfill>tbody>tr.k-master-row");
		if (!$fullfillRows.length)
		{
			$fullfillRows = self.$container.find(".kendogrid-blank-fullfill>div.fillItem");
		}

		const dataType = self._gridType;
		const dataItems = self.kendoGrid.dataItems();
		const dataItemColorDict = TF.Helper.ThematicHelper.getDataItemColorDict(dataType, dataItems, selectedGridThematicConfigs, self._gridDefinition.Columns);
		const colorLightnessDict = new Map();

		Array.from($trList).forEach((tr, idx) =>
		{
			const $tr = $(tr);
			const uid = $tr.data().kendoUid;
			const color = dataItemColorDict[uid];
			let isLightColor;

			if (colorLightnessDict.has(color))
			{
				isLightColor = colorLightnessDict.get(color);
			}
			else
			{
				isLightColor = TF.isLightness(color);
				colorLightnessDict.set(color, isLightColor);
			}

			$tr.attr(THEMATIC_COLOR_ATTRIBUTE, color);

			self.updateRowColor($tr, color, isLightColor);
			self.updateRowColor($leadingRows.eq(idx), color, isLightColor);
			self.updateRowColor($fullfillRows.eq(idx), color, isLightColor);
		});
	}

	KendoGrid.prototype.updateRowColor = function ($row, bkgColor, isLightColor)
	{
		if ($row)
		{
			$row.removeClass("k-alt");
			$row.css("background-color", bkgColor);
			$row.find("td").toggleClass("thematic-light", !isLightColor);
		}
	}

	KendoGrid.prototype.getSelectedGridThematicConfigs = function ()
	{
		var self = this, customDisplaySettings, quickFilters, gridThematicConfigs;

		if (self.tempGridThematicDataModel)
		{
			customDisplaySettings = JSON.parse(self.tempGridThematicDataModel.customDisplaySetting());
			quickFilters = JSON.parse(self.tempGridThematicDataModel.quickFilters());
			gridThematicConfigs = [];
		}
		else if (self.obSelectedGridThematicDataModel && self.obSelectedGridThematicDataModel())
		{
			customDisplaySettings = JSON.parse(self.obSelectedGridThematicDataModel().customDisplaySetting());
			quickFilters = JSON.parse(self.obSelectedGridThematicDataModel().quickFilters());
			gridThematicConfigs = [];
		}

		if (customDisplaySettings)
		{
			customDisplaySettings.forEach(cds =>
			{
				var gridThematicConfig = [];
				if (cds.DisplayLabel === DEFAULT_THEMATIC_LABEL)
				{
					gridThematicConfig.push(
						{
							"field": DEFAULT_THEMATIC_LABEL,
							"value": DEFAULT_THEMATIC_LABEL,
							"color": cds.Color,
							"typeId": null,
							"imperialValue": DEFAULT_THEMATIC_LABEL
						});
					gridThematicConfigs.push(gridThematicConfig);
					return;
				}

				for (var i = 0; i < quickFilters.length; i++)
				{
					if (quickFilters[i].field)
					{
						gridThematicConfig.push(
							{
								"field": quickFilters[i].field,
								"value": cds[`Value${i + 1}`],
								"color": cds.Color,
								"typeId": quickFilters[i].typeId,
								"imperialValue": cds[`AdditionalValue${i + 1}`]
							});

						if (!Enumerable.From(self.thematicFields).Contains(quickFilters[i].field))
						{
							self.thematicFields.push(quickFilters[i].field);
						}
					}
				}

				gridThematicConfigs.push(gridThematicConfig);
			});

			return gridThematicConfigs;
		}

		return null;
	}

	KendoGrid.prototype.dispose = function ()
	{
		$(window).off("resize", this._onWindowResize);
		if (this.kendoGrid && this.kendoGrid._draggableInstance)
		{
			kendo.ui.DropTarget.destroyGroup(this.kendoGrid._draggableInstance.options.group);
		}
		this.obGridFilterDataModelsFromDataBase = null;
		this.obGridFilterDataModels = null;
		this.obGridFilterDataModelsFromRelatedFilter = null;
		if (this.summaryKendoGrid)
		{
			this.summaryKendoGrid.destroy();
		}
		this.summaryKendoGrid = null;
		PubSub.unsubscribe(this._dataChangeReceive);
		PubSub.unsubscribe(this.loadGridFilter);
		if (this.$lockbar)
		{
			this.$lockbar.dispose();
			this.$lockbar = null;
		}
		$(window).off("orientationchange.gridStateTwoRowWhenOverflow" + this.randomKey, null);
		if (this.thematicFields.length > 0)
		{
			this.thematicFields = [];
		}
		if (this.selectedGridThematicConfigs)
		{
			this.selectedGridThematicConfigs = null;
		}
		if (this.tempGridThematicDataModel)
		{
			this.tempGridThematicDataModel = null;
		}
		TF.Grid.LightKendoGrid.prototype.dispose.apply(this);
	};

	addPlugin(KendoGrid, TF.Grid.KendoGridFilterMenu, TF.Grid.KendoGridThematicMenu, TF.Grid.KendoGridLayoutMenu, TF.Grid.KendoGridSummaryGrid);
})();
(function ()
{
	createNamespace("TF.Grid").GridHelper =
	{
		convertToOldGridDefinition: function (definition)
		{
			var def = {
				TypeCode: (definition.DBType || definition.type).replace(/datetime/i, "DateTime")
					.replace(/\b(\w)|\s(\w)/g, function (m)
					{
						return m.toUpperCase();
					}),
				AllowSorting: definition.sortable,
				AllowFiltering: definition.filterable,
				FieldName: (definition.field ? definition.field : definition.FieldName),
				DisplayName: definition.title ? definition.title : (definition.DisplayName ? definition.DisplayName : definition.FieldName),
				PersistenceName: definition.DBName || definition.field || (definition.UDFId ? definition.OriginalName : definition.FieldName),
			};

			if (definition.UDFId)
			{
				def.UDFId = definition.UDFId;
			}
			if (definition.UDFPickListOptions)
			{
				def.UDFPickListOptions = definition.UDFPickListOptions;
			}

			if (definition.DBIDs)
			{
				def.DBIDs = definition.DBIDs;
			}

			return def;
		},
		_getDataSourceSpecificFields: function (gridType)
		{
			switch (gridType)
			{
				case "fieldtrip":
					return ["DistrictDepartmentID", "FieldTripActivityID", "FieldTripAccountID", "FieldTripClassificationID", "FieldTripDestinationID", "FieldTripEquipmentID", "FieldTripID", "FieldTripStageID"];
			}
		},
		checkFilterContainsDataBaseSpecificFields: function (gridType, whereClause)
		{
			var self = this, dbSpecificFields = self._getDataSourceSpecificFields(gridType);

			if (!dbSpecificFields) return false;

			if (!whereClause || whereClause.length == 0)
			{
				return false;
			}

			whereClause = whereClause.toLowerCase();
			return dbSpecificFields.some(function (field)
			{
				return new RegExp("\\b" + field.toLowerCase() + "\\b", "g").test(whereClause);
			});
		},
		_convertToOldGridDefinition: function (gridDefinition)
		{
			var self = this;
			return gridDefinition.gridDefinition().Columns.map(function (definition)
			{
				return self.convertToOldGridDefinition(definition);
			});
		},
		_grid: null,
		get GridInfo()
		{
			var self = this;
			if (this._grid)
			{
				return this._grid;
			}
			this._grid = [{
				gridType: "fieldtrip",
				tableName: "fieldtrip",
				authName: "fieldtrip",
				type: "baseGrid",
				plural: tf.applicationTerm.getApplicationTermPluralByName('Field Trip'),
				singular: tf.applicationTerm.getApplicationTermSingularByName('Field Trip'),
				get apiGridDefinition()
				{
					return self._convertToOldGridDefinition(tf.fieldTripGridDefinition);
				}
			}];
			return this._grid;
		}
	};
})();

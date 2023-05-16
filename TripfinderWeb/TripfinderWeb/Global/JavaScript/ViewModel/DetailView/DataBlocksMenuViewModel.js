(function()
{
	createNamespace("TF.DetailView").DataBlocksMenuViewModel = DataBlocksMenuViewModel;

	function DataBlocksMenuViewModel(options, detailView)
	{
		var self = this, itemData,
			$item = $(options.target).closest('.grid-stack-item');

		self.target = options.target;
		self.event = options.event;
		self.detailView = detailView;
		self.defaultColors = options.defaultColors;

		var isLine = !!$(self.target).closest(".hori-line, .verti-line").length;
		itemData = isLine ? {} : $item.data();
		self.title = itemData.title;
		self.field = itemData.field;
		self.type = !isLine ? itemData.type : ($(self.target).closest(".hori-line, .verti-line").attr("type") || "");
		self.showQuickFilter = !!itemData.showQuickFilter;
		self.showSummary = !!itemData.showSummary;
		self.isSupportFilter = tf.helpers.miniGridHelper.checkGridSupportFilter(itemData.field);

		switch (self.type)
		{
			case "section-header":
				self.title = "Section Header";
				break;
			case "spacer":
				self.title = "Spacer";
				break;
			case "horizontalLine":
				self.title = "Horizontal Line";
				break;
			case "verticalLine":
				self.title = "Vertical Line";
				break;
			case "tab":
				self.title = "Tab";
				break;
			default:
				break;
		}

		self.gridType = options.gridType;
		var isEditAppearanceEnable = !["map", "attach", "boolean", "calendar", "horizontalline", "verticalline", "tab"].includes(self.type.toLowerCase()),
			isConditionalAppearanceEnable = ["number", "string", "date", "time", "geodistance"].includes(self.type.toLowerCase());
		if (itemData.UDFId)
		{
			var udfItem = self.detailView.recordEntity.UserDefinedFields.find(function(udf) { return udf.Id == itemData.UDFId; });
			if (!self.detailView.userDefinedFieldHelper.isShowInCurrentDataSource(udfItem))
			{
				isEditAppearanceEnable = false;
				isConditionalAppearanceEnable = false;
			}
		}

		if (isEditAppearanceEnable)
		{
			self.appearance = $item.data("appearance") ? JSON.parse($item.data("appearance")) : {};
			self.customizedTitle = $item.data("customizedTitle");
		}

		var blocks = options.blocks.reduce(function(prev, current)
		{
			return prev.concat(current.columns().filter(function(column)
			{
				return column.title !== self.title && !column.unavailable;
			}))
		}, []);

		blocks.sort(function(a, b)
		{
			if (a.title.toUpperCase() === b.title.toUpperCase())
			{
				return 0;
			}
			return a.title.toUpperCase() > b.title.toUpperCase() ? 1 : -1;
		});
		self.blocks = ko.observableArray(blocks);

		self.changeDataPointEvent = options.changeDataPointEvent;
		self.deleteDataBlockEvent = options.deleteDataBlockEvent;
		self.groupDataBlockEvent = options.groupDataBlockEvent;
		self.toggleResizableEvent = options.toggleResizableEvent;
		self.isGroupChild = options.isGroupChild;
		self.changeDataPoint = self.changeDataPoint.bind(self);
		self.deleteDataPoint = self.deleteDataPoint.bind(self);
		self.groupDataPoint = self.groupDataPoint.bind(self);
		self.imageChange = self.imageChange.bind(self);
		self.changeColumns = self.changeColumns.bind(self);
		self.changeQuickFilterBar = self.changeQuickFilterBar.bind(self);
		self.changeSummaryBar = self.changeSummaryBar.bind(self);
		self.openConditionalAppearanceModal = self.openConditionalAppearanceModal.bind(self);
		self.editClicked = self.editClicked.bind(self);
		self.obDefaultTitle = ko.observable(self.title);
		self.obEditAppearanceEnable = ko.observable(isEditAppearanceEnable);
		self.obConditionalAppearanceEnable = ko.observable(isConditionalAppearanceEnable);
		self.obNeedShown = ko.observable(options.needRCM);
		self.editDataBlockAppearance = null;
		self.closeEditDataBlockAppearanceEvent = new TF.Events.Event();
	}

	DataBlocksMenuViewModel.prototype.init = function()
	{

	};

	DataBlocksMenuViewModel.prototype.getAllDataBlocks = function()
	{
		var self = this, allDataBlocks = [];
		self.detailView.rootGridStack.dataBlocks.forEach(function(dataBlock)
		{
			if (dataBlock instanceof TF.DetailView.DataBlockComponent.TabStripBlock)
			{
				dataBlock.nestedGridStacks.forEach(function(gridStack)
				{
					allDataBlocks = allDataBlocks.concat(gridStack.dataBlocks);
				});
			}

			allDataBlocks.push(dataBlock);
		});

		return allDataBlocks;
	};

	DataBlocksMenuViewModel.prototype.changeQuickFilterBar = function(viewModel, e)
	{
		var self = this;
		var gridBlock = $(self.target).closest(".grid-stack-item");
		var filterBar = !gridBlock.data("showQuickFilter");
		var lazyRebuildGrid = false;

		var lightKendoGrid = gridBlock.find(".kendo-grid-container")?.data("lightKendoGrid");
		if (!lightKendoGrid || !lightKendoGrid.kendoGrid)
		{
			return;
		}

		var filter = lightKendoGrid.kendoGrid.dataSource.filter();
		var isFilterableDisabled = lightKendoGrid.kendoGrid.options.filterable === false;

		if (filter && !filterBar)
		{
			return tf.promiseBootbox.confirm(
				{
					message: "By unselecting this you will lose your saved filter selections. Do you wish to continue?",
					title: "Confirmation",
					buttons:
					{
						OK:
						{
							label: "Yes"
						},
						Cancel:
						{
							label: "No"
						}
					}
				})
				.then(function(result)
				{
					if (result)
					{
						gridBlock.data("showQuickFilter", filterBar);
						lightKendoGrid.kendoGrid.dataSource.filter({}, lazyRebuildGrid);

						if (isFilterableDisabled)
						{
							self.rebuildDetailGrid(gridBlock);
							return;
						}

						lightKendoGrid.rebuildGrid().then(() =>
						{
							lightKendoGrid._setQuickFilterBarStatus(filterBar);
							self._updateLockedColumnVisibility(gridBlock);
						});
					}
					return;
				}.bind(self));
		}

		gridBlock.data("showQuickFilter", filterBar);
		if (isFilterableDisabled)
		{
			self.rebuildDetailGrid(gridBlock);
			return;
		}

		lightKendoGrid.rebuildGrid().then(() =>
		{
			lightKendoGrid._setQuickFilterBarStatus(filterBar);
			self._updateLockedColumnVisibility(gridBlock);
		});
	}

	DataBlocksMenuViewModel.prototype.changeSummaryBar = function(viewModel, e)
	{
		var self = this,
			gridBlock = $(self.target).closest(".grid-stack-item");
		var lightKendoGrid = gridBlock.find(".kendo-grid-container")?.data("lightKendoGrid");
		var summaryContainer = gridBlock.find(".kendo-summarygrid-container");
		if (!lightKendoGrid || !lightKendoGrid.kendoGrid)
		{
			return;
		}

		var summaryBar = !gridBlock.data("showSummary");
		gridBlock.data("showSummary", summaryBar);
		summaryContainer && summaryContainer.css("display", summaryBar ? "block" : "none");
		lightKendoGrid.obSummaryGridVisible(summaryBar);
		self._updateLockedColumnVisibility(gridBlock);
	}

	DataBlocksMenuViewModel.prototype._updateLockedColumnVisibility = function(gridBlock)
	{
		var lightKendoGrid = gridBlock.find(".kendo-grid-container")?.data("lightKendoGrid");
		var summaryBar = gridBlock.data("showSummary");
		var filterBar = gridBlock.data("showQuickFilter");
		if (!lightKendoGrid || !lightKendoGrid.kendoGrid)
		{
			return;
		}

		if (!!summaryBar || !!filterBar)
		{
			lightKendoGrid.kendoGrid.showColumn(lightKendoGrid.kendoGrid.columns[0]);
		}
		else
		{
			lightKendoGrid.kendoGrid.hideColumn(lightKendoGrid.kendoGrid.columns[0]);
		}
	}

	DataBlocksMenuViewModel.prototype.rebuildDetailGrid = function(gridBlock)
	{
		var self = this;
		var targetBlock = self.getAllDataBlocks().filter(function(dataBlock)
		{
			if (!dataBlock.uniqueClassName) return;

			return gridBlock.hasClass(dataBlock.uniqueClassName);
		})[0];

		if (targetBlock.dispose)
		{
			targetBlock.dispose();
		}

		if (targetBlock.initDetailGrid)
		{
			targetBlock.initDetailGrid();
		}
	}

	DataBlocksMenuViewModel.prototype.changeColumns = function(viewModel, e)
	{
		var self = this,
			gridBlock = $(self.target).closest(".grid-stack-item"),
			availableColumns = [],
			defaultColumns,
			isExisted = false,
			targetBlock = self.getAllDataBlocks().filter(function(dataBlock)
			{
				if (!dataBlock.uniqueClassName) return;

				return gridBlock.hasClass(dataBlock.uniqueClassName);
			})[0];

		if (gridBlock.hasClass("multiple-grid"))
		{
			var subGridIndex = 0;
			targetBlock.grids.forEach(function(grid, i)
			{
				var rect = grid.$el[0].getBoundingClientRect();
				if (self.event.clientY >= rect.top && self.event.clientY <= rect.bottom)
				{
					subGridIndex = i;
				}
			});

			targetBlock = targetBlock.grids[subGridIndex];
			gridBlock = gridBlock.find(".custom-grid").eq(subGridIndex);
		}

		var columns = gridBlock.data("columns");
		var allColumns = targetBlock.getGridColumnsByType(gridBlock.data("url") || targetBlock.options.url);
		defaultColumns = Enumerable.From(allColumns).Where(function(c)
		{
			return !c.hidden && c.OriginalName === undefined;
		}).Select(function(c)
		{
			return $.extend({}, c);
		}).ToArray();

		if (columns.length > 0)
		{
			$.map(allColumns, function(column)
			{
				isExisted = false;
				for (var i = 0; i < columns.length; i++)
				{
					if (column.FieldName === columns[i].FieldName)
					{
						isExisted = true;
						break;
					}
				}
				if (!isExisted)
				{
					availableColumns.push(column);
				}
			});
		}
		else
		{
			availableColumns = allColumns;
		}
		tf.modalManager.showModal(
			new TF.Modal.Grid.EditKendoColumnModalViewModel(
				availableColumns,
				columns,
				defaultColumns,
				true
			)
		).then(function(editColumnViewModel)
		{
			if (editColumnViewModel)
			{
				var lightKendoGrid = gridBlock.find(".kendo-grid-container")?.data("lightKendoGrid");
				if (lightKendoGrid)
				{
					// Need to rebuild the mini grid if mini grid support quick filter.
					lightKendoGrid._obSelectedColumns(editColumnViewModel.selectedColumns);
					lightKendoGrid.removeHiddenColumnQuickFilter(editColumnViewModel.availableColumns);
					gridBlock.data("columns", editColumnViewModel.selectedColumns);

					let updatedGridDefinition = tf.helpers.miniGridHelper.getKendoColumnsExtend(editColumnViewModel.selectedColumns);
					lightKendoGrid.options.gridDefinition = updatedGridDefinition;
					lightKendoGrid.refreshGridColumnDefinition();
					lightKendoGrid.rebuildGrid().then(() =>
					{
						var filterBar = gridBlock.data("showQuickFilter");
						lightKendoGrid._setQuickFilterBarStatus(filterBar);
						self._updateLockedColumnVisibility(gridBlock);
					});
				}
				else
				{
					self.detailView.changeGridColumns(editColumnViewModel, gridBlock);
				}
			}
		}.bind(this));
	};

	DataBlocksMenuViewModel.prototype.imageChange = function(viewModel, e)
	{
		var self = this;
		$(self.target).find('input[type=file]').trigger('click');
	};

	DataBlocksMenuViewModel.prototype.deleteDataPoint = function(viewModel, e)
	{
		var self = this;
		self.deleteDataBlockEvent.notify({ target: self.target });
	};

	DataBlocksMenuViewModel.prototype.groupDataPoint = function(viewModel, e)
	{
		var self = this;
		self.groupDataBlockEvent.notify({ target: self.target });
	};

	DataBlocksMenuViewModel.prototype.changeDataPoint = function(viewModel, e)
	{
		var self = this, data = { target: self.target, dataPoint: viewModel, e: e };
		self.changeDataPointEvent.notify(data);
	};

	DataBlocksMenuViewModel.prototype.openConditionalAppearanceModal = function(viewModel, e)
	{
		var self = this, $item = $(self.target).closest(".grid-stack-item"),
			dataObj = $item.data("conditionalAppearance");
		tf.modalManager.showModal(new TF.DetailView.ConditionalAppearanceModalViewModel({
			gridType: self.gridType,
			field: self.field,
			dataObj: dataObj,
			defaultColors: self.defaultColors
		})).then(function(result)
		{
			if (result && result.length >= 0)
			{
				$item.data("conditionalAppearance", result);
			}
		});
	};

	DataBlocksMenuViewModel.prototype.editClicked = function(viewModel, e)
	{
		var self = this;
		if ($('.detial-view-overlay').length === 0)
		{
			var $overlay = $("<div></div>", { class: "detial-view-overlay" });
			$overlay.append($("<div></div>", { class: "detial-view-background" }));
			var $menu = $('<div class="data-block-appearance-menu" data-bind="uiInit:init">\
							<div class="menu-content">\
								<div>\
									<ul>\
										<li>Background\
											<div class="color-picker-container">\
												<input class="form-control" name="color" data-type="backgroundColor" />\
											</div>\
										</li>\
										<li class="border">Border\
											<div class="color-picker-container">\
												<input class="form-control" name="color" data-type="borderColor" />\
											</div>\</li>\
										<li>Title\
											<div class="color-picker-container">\
												<input class="form-control" name="color" data-type="titleColor" />\
											</div>\
										</li>\
										<li>Data\
											<div class="color-picker-container">\
												<input class="form-control" name="color" data-type="contentColor" />\
											</div>\
										</li>\
										<li class="save-change" data-bind="click:saveChanges">Save Changes</li>\
									</ul>\
								</div>\
							</div>\
							<div class="caret"></div>\
						</div>');
			var target = self.target;
			$overlay.append($menu);
			$('body').append($overlay);
			ko.applyBindings(new TF.DetailView.EditDataBlockAppearance({
				target: target,
				changeDataPointEvent: self.changeDataPointEvent,
				toggleResizableEvent: self.toggleResizableEvent,
				defaultTitle: self.obDefaultTitle(),
				appearance: {
					backgroundColor: self.appearance.backgroundColor || self.defaultColors.backgroundColor,
					borderColor: self.appearance.borderColor || self.defaultColors.borderColor,
					titleColor: self.appearance.titleColor || self.defaultColors.titleColor,
					contentColor: self.appearance.contentColor || self.defaultColors.contentColor
				},
				customizedTitle: self.customizedTitle
			}), $menu[0]);
			$(target).parents('.grid-stack-item').addClass('beyond-overlay');
		}
	};

	DataBlocksMenuViewModel.prototype.dispose = function()
	{
		var self = this;
		self.target = null;
		self.blocks = null;
		if (self.editDataBlockAppearance !== null)
		{
			self.editDataBlockAppearance.dispose();
			self.editDataBlockAppearance = null;
		}
	};
})();
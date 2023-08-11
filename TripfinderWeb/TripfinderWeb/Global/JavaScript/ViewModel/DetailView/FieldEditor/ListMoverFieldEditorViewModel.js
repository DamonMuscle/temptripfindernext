(function()
{
	createNamespace("TF.DetailView").ListMoverFieldEditorViewModel = ListMoverFieldEditorViewModel;

	function ListMoverFieldEditorViewModel(options)
	{
		this.options = options;
		this.obLeftSelected = ko.observable(false);
		this.obRightSelected = ko.observable(false);
		this.obLeftRemaining = ko.observable(true);
		this.obRightRemaining = ko.observable(true);
		this.fixedRightIds = options.fixedRightIds || [];// fixed data, that can not be removed
		this.totalItemCount = options.availableSource.length + options.selectedSource.length;
	}

	ListMoverFieldEditorViewModel.prototype.init = function(viewModel, el)
	{
		var self = this;
		self.$element = $(el);
		self.initEvents();
		self.render(self.options.availableSource, self.options.selectedSource);
	}

	ListMoverFieldEditorViewModel.prototype.initEvents = function()
	{
		var self = this, $container = self.$element.closest(".tfmodal");

		$container.on("keydown.listmoverfieldeditor", function(e)
		{
			e.stopPropagation();
		});
		$container.on("click.listmoverfieldeditor", function(e)
		{
			e.stopPropagation();
		});

		$(document).on("dblclick.listmoverfieldeditor", ".list-mover-field-editor tr.k-state-selected", function(e)
		{
			if ($(e.currentTarget).closest(".kendo-grid.grid-container").hasClass("left-grid"))
			{
				self.toRightClick();
			}
			else
			{
				self.toLeftClick();
			}
		});
	};

	ListMoverFieldEditorViewModel.prototype.render = function(availableSource, selectedSource)
	{
		var self = this,
			leftKendoGrid = self.$element.find(".left-grid").data("kendoGrid"),
			rightKendoGrid = self.$element.find(".right-grid").data("kendoGrid"),
			gridHeight = 300;
		if (self.options && self.options.gridHeight)
		{
			gridHeight = self.options.gridHeight;
		}

		if (leftKendoGrid && leftKendoGrid.destroy)
		{
			leftKendoGrid.destroy();
		}
		if (rightKendoGrid && rightKendoGrid.destroy)
		{
			rightKendoGrid.destroy();
		}

		self.$element.find(".left-grid").kendoGrid({
			dataSource: availableSource,
			columns: [
				{
					title: self.options.title,
					field: "text",
					width: 100,
					template: function(dataItem)
					{
						return kendo.htmlEncode(dataItem.text);
					}
				}
			],
			selectable: "multiple",
			height: gridHeight,
			change: function()
			{
				self.obLeftSelected(true);
				self.updateBottomBar.call(this, self.$element.find(".left-grid .k-pager-wrap"), self.totalItemCount);
			},
			pageable: {},
			dataBound: function()
			{
				self.updateBottomBar.call(this, self.$element.find(".left-grid .k-pager-wrap"), self.totalItemCount);
			}
		});

		self.$element.find(".right-grid").kendoGrid({
			dataSource: selectedSource,
			columns: [
				{
					title: self.options.title,
					field: "text",
					width: 100,
					template: function(dataItem)
					{
						return kendo.htmlEncode(dataItem.text);
					}
				}
			],
			selectable: "multiple",
			change: function()
			{
				var grid = self.$element.find(".right-grid").data("kendoGrid");
				var selected = grid.select();
				if (self.fixedRightIds.length > 0)
				{
					// exclude can not remove data
					selected = [];
					$.map(grid.select(), function(item)
					{
						var row = $(item).closest("tr");
						var dataItem = grid.dataItem(row);
						if (!Enumerable.From(self.fixedRightIds).Any(function(c) { return c == dataItem.value; }))
						{
							selected.push(item);
							return dataItem.uid;
						}
					});
					if (!self.changeRightSelect)
					{
						clearTimeout(self.changeSelectIdsTimeout);
						self.changeSelectIdsTimeout = setTimeout(function()
						{
							self.changeRightSelect = true;
							grid.clearSelection();
							grid.select(selected);
							self.changeRightSelect = false;
						});
					}
				}
				if (selected.length > 0)
				{
					self.obRightSelected(true);
					self.updateBottomBar.call(this, self.$element.find(".right-grid .k-pager-wrap"), self.totalItemCount);
				}
			},
			height: gridHeight,
			pageable: {},
			dataBound: function()
			{
				self.updateBottomBar.call(this, self.$element.find(".right-grid .k-pager-wrap"), self.totalItemCount);
				setTimeout(function()
				{
					if (self.fixedRightIds.length > 0)
					{
						// add gray style to can not remove data
						var grid = self.$element.find(".right-grid").data("kendoGrid");
						grid.dataSource.data().forEach(function(dataItem)
						{
							if (self.fixedRightIds.includes(dataItem.value))
							{
								grid.tbody.find("tr[data-kendo-uid='" + dataItem.uid + "']").addClass("disSelectable");
							}
						});
					}
				});
			}
		});

		self.checkRemaining();
	}

	ListMoverFieldEditorViewModel.prototype.updateBottomBar = function($container, totalItemCount)
	{
		$container.html(String.format("<span class=\"pageInfo\" style=\"float:left\">{0} of {1} {2}",
			this.dataItems().length,
			totalItemCount,
			this.select().length > 0 ? "(" + this.select().length + " selected)" : ""
		));
	};

	ListMoverFieldEditorViewModel.prototype.checkRemaining = function()
	{
		var self = this,
			leftKendoGrid = self.$element.find(".left-grid").data("kendoGrid"),
			rightKendoGrid = self.$element.find(".right-grid").data("kendoGrid");
		self.obLeftRemaining(leftKendoGrid.dataItems().length > 0);
		self.obRightRemaining(rightKendoGrid.dataItems().length > 0);
	}

	ListMoverFieldEditorViewModel.prototype.getIds = function(dataSource)
	{
		if (dataSource.data().length === 0)
		{
			return [];
		}

		return $.map(dataSource.data(), function(dataItem)
		{
			return dataItem.uid;
		});
	};

	ListMoverFieldEditorViewModel.prototype.toRightClick = function(viewModel, e)
	{
		var self = this,
			leftKendoGrid = self.$element.find(".left-grid").data("kendoGrid"),
			rightKendoGrid = self.$element.find(".right-grid").data("kendoGrid");

		var selectedIds = $.map(leftKendoGrid.select(), function(item)
		{
			return item.dataset["kendoUid"];
		});

		self.moveItem(selectedIds, leftKendoGrid.dataSource, rightKendoGrid.dataSource);
	}

	ListMoverFieldEditorViewModel.prototype.toAllRightClick = function(viewModel, e)
	{
		var self = this,
			leftKendoGrid = self.$element.find(".left-grid").data("kendoGrid"),
			rightKendoGrid = self.$element.find(".right-grid").data("kendoGrid");

		self.moveItem(self.getIds(leftKendoGrid.dataSource), leftKendoGrid.dataSource, rightKendoGrid.dataSource);
	}

	ListMoverFieldEditorViewModel.prototype.toLeftClick = function(viewModel, e)
	{
		var self = this,
			leftKendoGrid = self.$element.find(".left-grid").data("kendoGrid"),
			rightKendoGrid = self.$element.find(".right-grid").data("kendoGrid");

		var selectedIds = $.map(rightKendoGrid.select(), function(item)
		{
			return item.dataset["kendoUid"];
		});

		self.moveItem(selectedIds, rightKendoGrid.dataSource, leftKendoGrid.dataSource);
	}

	ListMoverFieldEditorViewModel.prototype.toAllLeftClick = function(viewModel, e)
	{
		var self = this,
			leftKendoGrid = self.$element.find(".left-grid").data("kendoGrid"),
			rightKendoGrid = self.$element.find(".right-grid").data("kendoGrid");

		var selectedIds = Enumerable.From(rightKendoGrid.dataSource.data() || [])
			.Where(function(dataItem)
			{
				// exclude can not remove data;
				return !self.fixedRightIds.includes(dataItem.value);
			}).Select(function(dataItem)
			{
				return dataItem.uid;
			}).ToArray();

		self.moveItem(selectedIds, rightKendoGrid.dataSource, leftKendoGrid.dataSource);
	}

	ListMoverFieldEditorViewModel.prototype.reset = function()
	{
		this.render(this.options.availableSource, this.options.selectedSource);
	}

	ListMoverFieldEditorViewModel.prototype.moveItem = function(selectedIds, source, destination)
	{
		if (!selectedIds || selectedIds.length == 0) return;

		var self = this;

		selectedIds.map(function(id)
		{
			return source.getByUid(id);
		}).forEach(function(item)
		{
			source.remove(item);
			destination.add(item);
		});

		source.sort({ field: "text", dir: "asc" });
		destination.sort({ field: "text", dir: "asc" });

		self.obLeftSelected(false);
		self.obRightSelected(false);
		self.checkRemaining();
	};

	ListMoverFieldEditorViewModel.prototype.apply = function(viewModel, e)
	{
		var self = this,
			rightKendoGrid = self.$element.find(".right-grid").data("kendoGrid"),
			selectedIds = rightKendoGrid.dataItems().map((item) => item.value);

		if (selectedIds.length == 0 && !self.options.allowNullValue)
		{
			return tf.promiseBootbox.alert("One or more items are required. Please select one or more items to save.");
		}
		else if (self.options.validators)
		{
			var detailViewHelper = new TF.DetailView.DetailViewHelper();
			for (var iter in self.options.validators)
			{
				if (iter && detailViewHelper.AvailableOperators.includes(iter) && !detailViewHelper.compareTwoValues([selectedIds.length, self.options.validators[iter].value], iter))
				{

					return tf.promiseBootbox.alert(self.options.validators[iter].message);
				}
			}
			return Promise.resolve(selectedIds);
		}
		else
		{
			return Promise.resolve(selectedIds);
		}
	};

	ListMoverFieldEditorViewModel.prototype.dispose = function()
	{
		var self = this,
			leftKendoGrid = self.$element.find(".left-grid").data("kendoGrid"),
			rightKendoGrid = self.$element.find(".right-grid").data("kendoGrid");

		if (leftKendoGrid && leftKendoGrid.destroy)
		{
			leftKendoGrid.destroy();
		}
		if (rightKendoGrid && rightKendoGrid.destroy)
		{
			rightKendoGrid.destroy();
		}

		$(document).off(".listmoverfieldeditor");

		self.options = null;
		self.obLeftSelected = null;
		self.obRightSelected = null;
		self.obLeftRemaining = null;
		self.obRightRemaining = null;
	};
})();

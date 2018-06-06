(function()
{
	createNamespace("TF.DetailView").DataBlocksMenuViewModel = DataBlocksMenuViewModel;

	function DataBlocksMenuViewModel(options, detailView)
	{
		var self = this;
		self.target = options.target;
		self.detailView = detailView;
		self.defaultColors = options.defaultColors;
		self.title = $(self.target).parents('.grid-stack-item').data("title");
		self.field = $(self.target).parents('.grid-stack-item').data("field");
		self.type = $(self.target).parents('.grid-stack-item').data("type") || $(self.target).closest(".hori-line, .verti-line").attr("type") || "";
		if (self.type === "section-header")
		{
			self.title = "Section Header";
		}
		else if (self.type === "spacer")
		{
			self.title = "Spacer";
		}
		else if (self.type === "horizontalLine")
		{
			self.title = "Horizontal Line";
		}
		else if (self.type === "verticalLine")
		{
			self.title = "Vertical Line";
		}
		self.gridType = options.gridType;
		var isEditAppearanceEnable = ["map", "boolean", "calendar", "horizontalline", "verticalline"].indexOf(self.type.toLowerCase()) == -1;
		if (isEditAppearanceEnable)
		{
			self.appearance = JSON.parse($(self.target).parents('.grid-stack-item').data("appearance"));
			self.customizedTitle = $(self.target).parents('.grid-stack-item').data("customizedTitle");
		}
		var isConditionalAppearanceEnable = ["number", "string", "date", "time"].indexOf(self.type.toLowerCase()) > -1;
		var blocks = options.blocks.reduce(function(prev, current)
		{
			return prev.concat(current.columns().filter(function(column)
			{
				return !(column.title === self.title);
			}))
		}, []);

		blocks = blocks.sort(function(a, b)
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
		self.changeDataPoint = self.changeDataPoint.bind(self);
		self.deleteDataPoint = self.deleteDataPoint.bind(self);
		self.groupDataPoint = self.groupDataPoint.bind(self);
		self.imageChange = self.imageChange.bind(self);
		self.changeColumns = self.changeColumns.bind(self);
		self.openConditionalAppearanceModal = self.openConditionalAppearanceModal.bind(self);
		self.editClicked = self.editClicked.bind(self);
		self.obDefaultTitle = ko.observable(self.title);
		self.obEditAppearanceEnable = ko.observable(isEditAppearanceEnable);
		self.obConditionalAppearanceEnable = ko.observable(isConditionalAppearanceEnable);
		self.obNeedShown = ko.observable(true);
	}

	DataBlocksMenuViewModel.prototype.init = function()
	{

	};

	DataBlocksMenuViewModel.prototype.changeColumns = function(viewModel, e)
	{
		var self = this, gridBlock = $(self.target).closest(".grid-stack-item"), columns = gridBlock.data("columns"), availableColumns = [], defaultColumns, allColumns,
			isExisted = false;

		allColumns = self.detailView.getDefinitionLayoutColumns(self.detailView.getGridDefinitionByType(gridBlock.data("url")));
		defaultColumns = Enumerable.From(allColumns).Where(function(c)
		{
			return !c.hidden;
		}).Select(function(c)
		{
			return $.extend(
				{}, c)
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
				defaultColumns
			)
		).then(function(editColumnViewModel)
		{
			if (editColumnViewModel)
			{
				self.detailView.changeGridColumns(editColumnViewModel, gridBlock);
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
		tf.modalManager.showModal(new TF.Modal.ConditionalAppearanceModalViewModel({
			gridType: self.gridType,
			field: self.field,
			dataObj: dataObj,
			defaultColors: self.defaultColors
		})).then(function(result)
		{
			if (result && result.length > 0)
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
	};
})();
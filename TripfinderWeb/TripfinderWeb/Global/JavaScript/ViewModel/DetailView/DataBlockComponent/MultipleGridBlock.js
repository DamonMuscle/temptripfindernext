(function()
{
	createNamespace("TF.DetailView.DataBlockComponent").MultipleGridBlock = MultipleGridBlock;

	function MultipleGridBlock(options, detailView)
	{
		var self = this;
		self.options = options;

		TF.DetailView.DataBlockComponent.BaseDataBlock.call(self, detailView);

		self.initGrid();
		self.initElement(options);
	}

	MultipleGridBlock.prototype = Object.create(TF.DetailView.DataBlockComponent.BaseDataBlock.prototype);

	MultipleGridBlock.prototype.afterDomAttached = function()
	{
		this.grids.forEach(function(grid)
		{
			grid.afterDomAttached();
		});
	};

	MultipleGridBlock.prototype.initEvents = function()
	{
		this.grids.forEach(function(grid)
		{
			grid.initEvents();
		});
	};

	MultipleGridBlock.prototype.initGrid = function()
	{
		var self = this;
		this.grids = [];
		var gridOptions = self._getGridOptions();

		gridOptions.forEach(function(options, index)
		{
			options.inMultipleGridBlock = true;
			var grid = new TF.DetailView.DataBlockComponent.GridBlock(options, self.detailView);
			self.grids.push(grid);
			grid.$el.height(options.height);
			grid.$el.removeClass("grid-stack-item-content");
			if (index != 0)
			{
				grid.$el.css("padding-top", 15);
			}
		});
	};

	MultipleGridBlock.prototype._getGridOptions = function()
	{
		if (this.options.field == "TransportationRequirements")
		{
			var defaultGridHeight = 166;
			return [
				{
					field: "StudentRequirementGrid",
					title: "Default Requirements",
					url: TF.Helper.KendoGridHelper.studentRequirementItemsUrl,
					height: defaultGridHeight,
					columns: this.options.grids[0] ? this.options.grids[0].columns : null
				}, {
					field: "AdditionalRequirementGrid",
					title: "Additional Requirements",
					url: TF.Helper.KendoGridHelper.studentAdditionalRequirementUrl,
					height: 'calc(100% - ' + defaultGridHeight + 'px)',
					noHeightWhenEmpty: true,
					columns: this.options.grids[1] ? this.options.grids[1].columns : null
				}];
		}

		return [];
	};

	MultipleGridBlock.prototype.initElement = function(options)
	{
		var self = this;
		self.uniqueClassName = options.uniqueClassName || tf.helpers.detailViewHelper.generateUniqueClassName();
		self.$el = $("<div><div class='grid-stack-item-content'></div></div>").addClass(self.uniqueClassName + " multiple-grid");
		self.grids.forEach(function(grid)
		{
			self.$el.children().append(grid.$el);
		});
	};

	MultipleGridBlock.prototype.dispose = function()
	{
		this.grids.forEach(function(grid)
		{
			grid.dispose();
		});
	};
})();
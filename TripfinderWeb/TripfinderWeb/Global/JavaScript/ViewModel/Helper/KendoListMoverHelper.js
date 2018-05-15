(function()
{
	var namespace = createNamespace("TF.Helper");

	namespace.KendoListMoverHelper = KendoListMoverHelper;

	function KendoListMoverHelper()
	{

	}

	KendoListMoverHelper.prototype.constructor = KendoListMoverHelper;

	KendoListMoverHelper.removeOnlyForFilterColumn = function(allColumns)
	{
    return allColumns = allColumns.filter(function(item)
		{
			return !item.onlyForFilter;
		});
	}

	KendoListMoverHelper.filterMenuClick = function(viewModel, e)
	{
		var leftGrid;
		if(this.leftSearchGrid)
		{
			leftGrid = this.leftSearchGrid;
		}
		else
		{
			leftGrid = this.unassignedEntityContainer;
		}
		tf.contextMenuManager.showMenu(
			e.target,
			new TF.ContextMenu.TemplateContextMenu(
				"workspace/grid/listmoverfiltercontextmenu",
				new TF.Grid.GridMenuViewModel(this, leftGrid)
			)
		);
	};
})()

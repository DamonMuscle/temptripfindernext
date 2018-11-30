(function()
{
	createNamespace("TF.Grid").GridMenuViewModel = GridMenuViewModel;

	function GridMenuViewModel(gridViewModel, kendoGrid)
	{
		this.gridViewModel = gridViewModel;
		this.searchGrid = kendoGrid;
	}

	GridMenuViewModel.prototype = Object.create(TF.ContextMenu.BaseGeneralMenuViewModel.prototype);

	GridMenuViewModel.prototype.constructor = GridMenuViewModel;

	createNamespace("TF.Grid").GridState = GridState;

	function GridState(gridState)
	{
		$.extend(this, {
			gridFilterId: null,
			filteredIds: null,
			filteredExcludeAnyIds: null
		});
		$.extend(this, gridState);
	}
})();
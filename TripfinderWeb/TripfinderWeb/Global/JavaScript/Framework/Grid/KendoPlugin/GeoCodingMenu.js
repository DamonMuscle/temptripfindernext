(function()
{

	createNamespace("TF.Grid").GeoCodingMenu = GeoCodingMenu;

	function GeoCodingMenu()
	{
	}

	GeoCodingMenu.prototype.geocodedClick = function(searchGrid)
	{
		searchGrid.gridViewModel.geocode();
	}

	GeoCodingMenu.prototype.ungeocodedClick = function(searchGrid)
	{
		searchGrid.gridViewModel.ungeocode();
	}


})();

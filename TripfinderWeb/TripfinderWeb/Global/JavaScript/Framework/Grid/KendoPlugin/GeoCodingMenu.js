(function()
{

	createNamespace("TF.Grid").GeoCodingMenu = GeoCodingMenu;

	function GeoCodingMenu()
	{
	}

	GeoCodingMenu.prototype.geocodeClick = function(searchGrid)
	{
		searchGrid.gridViewModel.geocode();
	}

	GeoCodingMenu.prototype.ungeocodeClick = function(searchGrid)
	{
		searchGrid.gridViewModel.ungeocode();
	}


})();

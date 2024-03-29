(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingSearchViewModel = RoutingSearchViewModel;

	function RoutingSearchViewModel(mapInstance, options)
	{
		this.mapInstance = mapInstance;
		this.routingMapSearch = new TF.RoutingMap.RoutingMapSearch(mapInstance, options);
	}

	RoutingSearchViewModel.prototype.init = function()
	{

	};

	RoutingSearchViewModel.prototype.apply = function()
	{
		if (this.routingMapSearch.selectedItems)
		{
			return Promise.resolve(this.routingMapSearch.selectedItems.map(function(item)
			{
				return {
					XCoord: item.XCoord,
					YCoord: item.YCoord,
					Street: item.Street,
					City: item.City,
					address: item.address,
					name: item.Title
				};
			}));
		}
		return Promise.resolve(false);
	};

	RoutingSearchViewModel.prototype.cancel = function()
	{
		return Promise.resolve(true);
	};

})();
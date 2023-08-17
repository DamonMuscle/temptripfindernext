(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingSearchViewModel = RoutingSearchViewModel;

	function RoutingSearchViewModel(map, options)
	{
		this.map = map;
		this.routingMapSearch = new TF.RoutingMap.RoutingMapSearch(map, options);
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
				const isValidAddress = item.address?.replaceAll(",", " ").trim() !== '';
				const address = isValidAddress ? item.address : '', title = item.title?.trim(), UNNAMED_ADDRESS = "unnamed";
				return {
					XCoord: item.XCoord,
					YCoord: item.YCoord,
					Street: address || title || UNNAMED_ADDRESS,
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
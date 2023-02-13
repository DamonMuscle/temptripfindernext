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
				var result = $.extend({}, item, {
					type: item.type,
					geometry: new tf.map.ArcGIS.Point(item.geometry.x, item.geometry.y, item.geometry.spatialReference)
				});
				return result;
			}));
		}
		return Promise.resolve(false);
	};

	RoutingSearchViewModel.prototype.cancel = function()
	{
		return Promise.resolve(true);
	};

})();
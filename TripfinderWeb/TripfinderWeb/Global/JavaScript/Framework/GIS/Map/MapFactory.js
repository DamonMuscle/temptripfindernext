(function()
{
	const attrKey = "data-mapId";
	const instances = [];
	createNamespace("TF.GIS").MapFactory = {
		createInstance: async function($mapContainer, options)
		{
			if($($mapContainer).attr(attrKey))
			{
				throw new Error("Map instance has been created for this dom.");
			}

			const mapId = `mapId_${Date.now()}`;
			$($mapContainer).attr(attrKey, mapId);
			options.mapId = mapId;

			await TF.GIS.Map.LoadResources();
			const map = new TF.GIS.Map($mapContainer, options);
			instances.push({instance: map, id: mapId, container: $mapContainer});
			return map;
		},
		getMapInstanceById: function(id)
		{
			return instances.find(x=>x.id === id);
		},
		destroyMapInstanceById: function(id)
		{
			const index = instances.findIndex(x=>x.id === id);
			const [{instance, container}] = instances.splice(index, 1);
			$(container).removeAttr(attrKey);
			instance.dispose();
		}
	};
})();
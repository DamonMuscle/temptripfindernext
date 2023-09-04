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

			const mapId = `mapId_${Math.random().toString(36).substring(7)}`;
			$($mapContainer).attr(attrKey, mapId);
			options.mapId = mapId;

			await TF.GIS.Resources.Load();
			const map = new TF.GIS.Map($mapContainer, options);
			instances.push({instance: map, id: mapId, container: $mapContainer});
			return map;
		},
		getMapInstance: function($mapContainer)
		{
			const id = $($mapContainer)?.attr(attrKey);
			return instances.find(x=>x.id === id)?.instance;
		},
		destroyMapInstance: function(mapInstance)
		{
			const id = mapInstance.settings.mapId;
			const index = instances.findIndex(x=>x.id === id);
			if (index === -1)
			{
				console.warn(`Map instance ${id} has been destroyed.`);
				return;
			}

			const [{instance, container}] = instances.splice(index, 1);
			$(container).removeAttr(attrKey);
			instance.dispose();
		}
	};
})();
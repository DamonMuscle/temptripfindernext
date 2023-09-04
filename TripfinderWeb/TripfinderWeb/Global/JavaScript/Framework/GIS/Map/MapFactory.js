(function()
{
	const ATTR_DATA_MAP_ID = "data-mapId";
	
	const generateRandomMapId = () =>
	{
		const randomString = Math.random().toString(36).substring(7);
		return `mapId_${randomString}`;
	}

	const bindMapId = ($container, options) =>
	{
		const mapId = generateRandomMapId();
		$($container).attr(ATTR_DATA_MAP_ID, mapId);
		options.mapId = mapId;
	}

	const loadArcGISJavaScriptSDKs = async () =>
	{
		await TF.GIS.Resources.Load();
	}	
	
	const instances = [];

	createNamespace("TF.GIS").MapFactory =
	{
		createMapInstance: async ($container, options) =>
		{
			if ($($container).attr(ATTR_DATA_MAP_ID))
			{
				throw new Error("Map instance has been created for this dom.");
			}

			bindMapId($container, options);
			await loadArcGISJavaScriptSDKs();

			const map = new TF.GIS.Map($container, options);
			instances.push({instance: map, id: map.ID, container: $container});
			return map;
		},
		getMapInstance: ($container) =>
		{
			const id = $($container)?.attr(ATTR_DATA_MAP_ID);
			return instances.find(x=>x.id===id)?.instance;
		},
		destroyMapInstance: (mapInstance) =>
		{
			const id = mapInstance.ID;
			const index = instances.findIndex(x=>x.id === id);
			if (index === -1)
			{
				console.warn(`Map instance ${id} has been destroyed.`);
				return;
			}

			const [{instance, container}] = instances.splice(index, 1);
			$(container).removeAttr(ATTR_DATA_MAP_ID);
			instance.dispose();
		}
	};
})();
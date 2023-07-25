(function()
{
	createNamespace("TF.GIS").LayerManager = LayerManager;

	function LayerManager(mapInstance)
	{
		this.mapInstance = mapInstance;
	}

	LayerManager.prototype.createLayerInstances = async function(layerOptions)
	{
		const self = this,
			totalLayerCount = layerOptions.length,
			layerInstances = [];

		let layerCount = 0;
		const onLayerCreatedHandler = (resolve) => {
			layerCount++;
			if (layerCount === totalLayerCount)
			{
				resolve(layerInstances);
			}
		};

		const addFieldTripMapLayer = (layerInstance, resolve) => {
			return self.mapInstance.addLayerInstance(layerInstance, {
				eventHandlers: {
					onLayerCreated: onLayerCreatedHandler.bind(self, resolve)
				}
			});
		};

		return new Promise((resolve, _) =>
		{
			for (let i = 0; i < totalLayerCount; i++)
			{
				const { id, index, layerType } = layerOptions[i];
				const option = { id, index };
				const instance = layerType ? new TF.GIS.Layer[layerType](option) : new TF.GIS.Layer(option);

				addFieldTripMapLayer(instance, resolve);
				layerInstances.push(instance);
			}
		});
	}
})();
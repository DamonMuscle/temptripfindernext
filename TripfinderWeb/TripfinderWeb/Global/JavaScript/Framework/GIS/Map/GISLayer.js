(function()
{
	createNamespace("TF.GIS").Layer = Layer;

	const LAYER_TYPE = {
		FEATURE: "feature",
		GRAPHIC: "graphic"
	};

	const defaultOptions = {
		id: `layerId_${Date.now()}`,
		index: null,
		eventHandlers: {
			onLayerCreated: null
		}
	};

	function Layer(options, layerType = LAYER_TYPE.GRAPHIC)
	{
		this.settings = Object.assign({}, defaultOptions, options);
		this.defineReadOnlyProperty('index', this.settings.index);
		this.create(layerType);
	}

	Layer.prototype.defineReadOnlyProperty = function(propertyName, value)
	{
		Object.defineProperty(this, propertyName, {
			get() { return value; },
			enumerable: false,
			configurable: false
		});
	};

	Layer.prototype.create = function(layerType)
	{
		let layer = null;
		switch (layerType)
		{
			case LAYER_TYPE.GRAPHIC:
				layer = new TF.GIS.SDK.GraphicsLayer({ id: this.settings.id });
				break;
			case LAYER_TYPE.FEATURE:
				layer = new TF.GIS.SDK.FeatureLayer({ ...this.settings });
				break;
			default:
				console.warn(`Undefined layerType: ${layerType}, create layer failed.`);
				break;
		}

		this.defineReadOnlyProperty('layer', layer);
	}

	Layer.prototype.clearLayer = async function()
	{
		return new Promise((resolve, reject) =>
		{
			if (this.layer instanceof TF.GIS.SDK.GraphicsLayer) {
				const total = this.layer.graphics.items.length;
				this.layer.on("after-changes", (event) =>
				{
					console.log(event);
					count--;
					if (count === 0) {
						console.log("clear all");
						resolve();
					}
				});
				this.layer.removeAll();
			} else if (this.layer instanceof TF.GIS.SDK.FeatureLayer) {
				console.warn(`TODO: clear FeatureLayer, promise`);
				resolve();
			}
		});
	}

	Layer.prototype.addPoint = function(longitude, latitude, symbol, attributes)
	{
		const point = TF.GIS.SDK.webMercatorUtils.geographicToWebMercator(new TF.GIS.SDK.Point({ x: longitude, y: latitude }));
		this.add(point, symbol, attributes);
	}

	Layer.prototype.add = function(geometry, symbol, attributes)
	{
		if (this.layer instanceof TF.GIS.SDK.GraphicsLayer)
		{
			this.addGraphic(geometry, symbol, attributes);
		}
		else if (this.layer instanceof TF.GIS.SDK.FeatureLayer)
		{
			this.addFeature(geometry, symbol, attributes);
		}
	}

	Layer.prototype.addGraphic = function(geometry, symbol, attributes)
	{
		const graphic = new TF.GIS.SDK.Graphic({ geometry, symbol, attributes });
		this.layer.add(graphic);
	}

	Layer.prototype.addFeature = function(geometry, symbol, attributes)
	{
		console.warn(`TODO: add graphic to FeatureLayer, promise`);
	}

	Layer.prototype.queryFeatures = async function(geometry, condition = '1 = 1')
	{
		if (this.layer instanceof TF.GIS.SDK.GraphicsLayer)
		{
			const results = [];
			const items = this.layer.graphics.items;
			for (let i = 0; i < items.length; i++)
			{
				const item = items[i];
				if (TF.GIS.SDK.geometryEngine.intersects(geometry, item.geometry))
				{
					results.push(item);
				}
			}

			return Promise.resolve(results);
		}
		else if (this.layer instanceof TF.GIS.SDK.FeatureLayer)
		{
			console.warn(`TODO: query features on FeatureLayer`);
			const queryParams = this.layer.createQuery();
			queryParams.geometry = geometry;
			queryParams.where = condition;
			queryParams.outSpatialReference = { wkid: 102100 };
			queryParams.returnGeometry = true;
			queryParams.outFields = ['*'];

			return this.layer.queryFeatures(queryParams);
		}
	}
})();
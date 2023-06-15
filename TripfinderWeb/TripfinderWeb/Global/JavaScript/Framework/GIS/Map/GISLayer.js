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

	let _layer = null;

	function Layer(options, layerType = LAYER_TYPE.GRAPHIC)
	{
		this.settings = Object.assign({}, defaultOptions, options);
		this.create(layerType);
	}

	Object.defineProperty(Layer.prototype, 'layer', {
		get() { return _layer; },
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(Layer.prototype, 'index', {
		get() { return this.settings.index; },
		enumerable: false,
		configurable: false
	});

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

		_layer = layer;
	}

	Layer.prototype.clearLayer = function()
	{
		if (_layer instanceof TF.GIS.SDK.GraphicsLayer) {
			_layer.removeAll();
		} else if (_layer instanceof TF.GIS.SDK.FeatureLayer) {
			console.warn(`TODO: clear FeatureLayer, promise`);
		}
	}

	Layer.prototype.addPoint = function(longitude, latitude, symbol, attributes)
	{
		const point = TF.GIS.SDK.webMercatorUtils.geographicToWebMercator(new TF.GIS.SDK.Point({ x: longitude, y: latitude }));
		this.add(point, symbol, attributes);
	}

	Layer.prototype.add = function(geometry, symbol, attributes)
	{
		if (_layer instanceof TF.GIS.SDK.GraphicsLayer)
		{
			this.addGraphic(geometry, symbol, attributes);
		}
		else if (_layer instanceof TF.GIS.SDK.FeatureLayer)
		{
			this.addFeature(geometry, symbol, attributes);
		}
	}

	Layer.prototype.addGraphic = function(geometry, symbol, attributes)
	{
		const graphic = new TF.GIS.SDK.Graphic({ geometry, symbol, attributes });
		_layer.add(graphic);
	}

	Layer.prototype.addFeature = function(geometry, symbol, attributes)
	{
		console.warn(`TODO: add graphic to FeatureLayer, promise`);
	}

	Layer.prototype.queryFeatures = async function(geometry, condition = '1 = 1')
	{
		if (_layer instanceof TF.GIS.SDK.GraphicsLayer)
		{
			const results = [];
			const items = _layer.graphics.items;
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
		else if (_layer instanceof TF.GIS.SDK.FeatureLayer)
		{
			console.warn(`TODO: query features on FeatureLayer`);
			const queryParams = _layer.createQuery();
			queryParams.geometry = geometry;
			queryParams.where = condition;
			queryParams.outSpatialReference = { wkid: 102100 };
			queryParams.returnGeometry = true;
			queryParams.outFields = ['*'];

			return _layer.queryFeatures(queryParams);
		}
	}
})();
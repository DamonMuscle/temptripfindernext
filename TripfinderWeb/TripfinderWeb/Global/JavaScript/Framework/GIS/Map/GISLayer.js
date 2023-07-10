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
			if (this.layer instanceof TF.GIS.SDK.GraphicsLayer)
			{
				let total = this.layer.graphics.items.length;
				let handler = this.layer.graphics.on("after-remove", (event) =>
				{
					total--;
					if (total === 0) {
						handler.remove();
						handler = null;

						resolve();
					}
				});

				this.layer.removeAll();
			} else if (this.layer instanceof TF.GIS.SDK.FeatureLayer)
			{
				console.warn(`TODO: clear FeatureLayer, promise`);
				resolve();
			}
		});

	}

	Layer.prototype.addPoint = function(longitude, latitude, symbol, attributes, afterAdd = null)
	{
		const graphic = this.createPointGraphic(longitude, latitude, symbol, attributes);
		this.add(graphic, afterAdd);
	}

	Layer.prototype.addPolyline = function(paths, symbol, attributes, afterAdd = null)
	{
		const graphic = this.createPolylineGraphic(paths, symbol, attributes);
		this.add(graphic, afterAdd);
	}

	Layer.prototype.add = function(graphic, afterAdd = null)
	{
		if (this.layer instanceof TF.GIS.SDK.GraphicsLayer)
		{
			this._addGraphic(graphic, afterAdd);
		}
		else if (this.layer instanceof TF.GIS.SDK.FeatureLayer)
		{
			this._addFeature(graphic, afterAdd);
		}
	}

	Layer.prototype._addGraphic = function(graphic, afterAdd = null)
	{
		if (afterAdd !== null)
		{
			let total = 1;
			let handler = this.layer.graphics.on("after-add", (event) =>
			{
				total--;
				if (total === 0) {
					handler.remove();
					handler = null;

					console.log(`after-add: ${graphic.attributes.Sequence}`);
					afterAdd();
				}
			});
		}

		console.log(`add: ${graphic.attributes.Sequence}`);
		this.layer.add(graphic);
	}

	Layer.prototype._addFeature = function(geometry, symbol, attributes, afterAdd = null)
	{
		console.warn(`TODO: add graphic to FeatureLayer, promise`);
	}

	Layer.prototype.remove = function(graphic, afterRemove = null)
	{
		if (this.layer instanceof TF.GIS.SDK.GraphicsLayer)
		{
			this._removeGraphic(graphic, afterRemove);
		}
		else if (this.layer instanceof TF.GIS.SDK.FeatureLayer)
		{
			this._removeFeature(graphic, afterRemove);
		}
	}

	Layer.prototype._removeGraphic = function(graphic, afterRemove = null)
	{
		if (afterRemove !== null)
		{
			let total = 1;
			let handler = this.layer.graphics.on("after-remove", (event) =>
			{
				total--;
				if (total === 0)
				{
					handler.remove();
					handler = null;

					afterRemove();
				}
			});
		}

		this.layer.remove(graphic);
	}

	Layer.prototype._removeFeature = async function(feature, afterRemove = null)
	{
		const edits = {
			deleteFeatures: [feature]
		};

		const editsResult = await this.layer.applyEdits(edits);
		if (afterRemove)
		{
			afterRemove();
		}
	}

	Layer.prototype.createPointGraphic = function(longitude, latitude, symbol, attributes)
	{
		const geometry = TF.GIS.SDK.webMercatorUtils.geographicToWebMercator(new TF.GIS.SDK.Point({ x: longitude, y: latitude }));
		return new TF.GIS.SDK.Graphic({ geometry, symbol, attributes });
	}

	Layer.prototype.createPolylineGraphic = function(paths, symbol, attributes)
	{
		const geometry = TF.GIS.SDK.webMercatorUtils.geographicToWebMercator(new TF.GIS.SDK.Polyline({
			hasZ: false,
			hasM: false,
			paths: paths,
			spatialReference: { wkid: 4326 }
		}));
		return new TF.GIS.SDK.Graphic({ geometry, symbol, attributes });		
	}

	Layer.prototype.addGraphicsByOrder = async function(graphics)
	{
		return new Promise(async (resolve, reject) =>
		{
			if (this.layer instanceof TF.GIS.SDK.FeatureLayer)
			{
				return reject("addGraphicsByOrder doesn't support FeatureLayer");
			}

			const p = [];
			for (let i = 0; i < graphics.length; i++)
			{
				p.push(this._addAGraphic(graphics[i]));
			}

			return Promise.all(p).then(() =>
			{
				resolve();
			});
		});
	}

	Layer.prototype._addAGraphic = async function(graphic)
	{
		return new Promise((resolve, reject) =>
		{
			if (this.layer instanceof TF.GIS.SDK.FeatureLayer)
			{
				return reject("addGraphicsByOrder doesn't support FeatureLayer");
			}

			let total = 1;
			let handler = this.layer.graphics.on("after-add", (event) =>
			{
				total--;
				if (total === 0) {
					handler.remove();
					handler = null;
	
					console.log(`${event.item.geometry.longitude}, ${event.item.geometry.latitude} ${event.item.attributes.Sequence}`);
					resolve();
				}
			});

			this.layer.add(graphic);
		});
	}

	Layer.prototype.queryFeatures = async function(geometry, condition = '1 = 1')
	{
		let results = [];
		if (this.layer instanceof TF.GIS.SDK.GraphicsLayer)
		{
			const items = this.layer.graphics.items;
			if (geometry === null)
			{
				results = [].concat(items);
			}
			else
			{
				for (let i = 0; i < items.length; i++)
				{
					const item = items[i];
					if (TF.GIS.SDK.geometryEngine.intersects(geometry, item.geometry))
					{
						results.push(item);
					}
				}
			}
		}
		else if (this.layer instanceof TF.GIS.SDK.FeatureLayer)
		{
			const queryParams = this.layer.createQuery();
			if (geometry !== null)
			{
				queryParams.geometry = geometry;
			}
			queryParams.where = condition;
			queryParams.outSpatialReference = { wkid: 102100 };
			queryParams.returnGeometry = true;
			queryParams.outFields = ['*'];

			results = await this.layer.queryFeatures(queryParams);
		}

		return Promise.resolve(results);
	}

	Layer.prototype.queryFeatureCount = async function(geometry, condition = '1 = 1')
	{
		let featureCount = 0;
		if (this.layer instanceof TF.GIS.SDK.GraphicsLayer)
		{
			const items = this.layer.graphics.items;
			if (geometry === null)
			{
				featureCount = items.length;
			}
			else
			{
				for (let i = 0; i < items.length; i++)
				{
					const item = items[i];
					if (TF.GIS.SDK.geometryEngine.intersects(geometry, item.geometry))
					{
						featureCount++;
					}
				}
			}
		}
		else if (this.layer instanceof TF.GIS.SDK.FeatureLayer)
		{
			const queryParams = this.layer.createQuery();
			if (geometry !== null)
			{
				queryParams.geometry = geometry;
			}
			queryParams.where = condition;
			queryParams.returnGeometry = false;
			queryParams.outFields = [];

			featureCount = await this.layer.queryFeatureCount(queryParams);
		}

		return Promise.resolve(featureCount);
	}
})();
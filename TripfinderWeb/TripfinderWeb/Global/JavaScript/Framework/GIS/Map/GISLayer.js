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
		spatialReference: { wkid: TF.GIS.GeometryEnum.WKID.WEB_MERCATOR },
		eventHandlers: {
			onLayerCreated: null
		}
	};

	function Layer(options, layerType = LAYER_TYPE.GRAPHIC)
	{
		this.settings = Object.assign({}, defaultOptions, options);
		this.defineReadOnlyProperty('index', this.settings.index);
		this.defineReadOnlyProperty('LAYER_TYPE', LAYER_TYPE);
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
				layer = new TF.GIS.SDK.GraphicsLayer({
					id: this.settings.id,
					spatialReference: this.settings.spatialReference
				});
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
				if (total === 0)
				{
					resolve();
					return;
				}

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
			}
			else if (this.layer instanceof TF.GIS.SDK.FeatureLayer)
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
			this._addGraphics([graphic], afterAdd);
		}
		else if (this.layer instanceof TF.GIS.SDK.FeatureLayer)
		{
			this._addFeature(graphic, afterAdd);
		}
	}

	Layer.prototype.addMany = async function(graphics)
	{
		return new Promise((resolve, reject) =>
		{
			if (this.layer instanceof TF.GIS.SDK.GraphicsLayer)
			{
				this._addGraphics(graphics, () =>
				{
					resolve();
				});
			}
			else if (this.layer instanceof TF.GIS.SDK.FeatureLayer)
			{
				console.warn(`TODO: add many graphics to FeatureLayer`);
				resolve();
			}
		});
	}

	Layer.prototype._addGraphics = function(graphics, afterAdd = null)
	{
		if (afterAdd !== null)
		{
			let total = graphics.length;
			let handler = this.layer.graphics.on("after-add", (event) =>
			{
				total--;
				if (total === 0) {
					handler.remove();
					handler = null;

					afterAdd();
				}
			});
		}

		if (graphics.length === 1)
		{
			this.layer.add(graphics[0]);
		}
		else
		{
			this.layer.addMany(graphics);
		}
	}

	Layer.prototype._addFeature = function(geometry, symbol, attributes, afterAdd = null)
	{
		console.warn(`TODO: add graphic to FeatureLayer, promise`);
	}

	Layer.prototype.remove = function(graphic, afterRemove = null)
	{
		if (this.layer instanceof TF.GIS.SDK.GraphicsLayer)
		{
			this._removeGraphics([graphic], afterRemove);
		}
		else if (this.layer instanceof TF.GIS.SDK.FeatureLayer)
		{
			this._removeFeatures([graphic], afterRemove);
		}
	}

	Layer.prototype.removeMany = async function(graphics, afterRemove = null)
	{
		return new Promise((resolve, reject) =>
		{
			if (this.layer instanceof TF.GIS.SDK.GraphicsLayer)
			{
				this._removeGraphics(graphics, () =>
				{
					resolve();
				});
			}
			else if (this.layer instanceof TF.GIS.SDK.FeatureLayer)
			{
				this._removeFeatures(graphics, afterRemove);
				resolve();
			}
		});
	}

	Layer.prototype._removeGraphics = function(graphics, afterRemove = null)
	{
		if (afterRemove !== null)
		{
			let total = graphics.length;
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

		if (graphics.length === 1)
		{
			this.layer.remove(graphics[0]);
		}
		else
		{
			this.layer.removeMany(graphics);
		}
	}

	Layer.prototype._removeFeatures = async function(features, afterRemove = null)
	{
		const edits = { deleteFeatures: features };
		const editsResult = await this.layer.applyEdits(edits);
		if (afterRemove)
		{
			afterRemove();
		}
	}

	Layer.prototype.createPointGraphic = function(longitude, latitude, symbol, attributes)
	{
		const geometry = TF.GIS.GeometryHelper.ComputeWebMercatorPoint(longitude, latitude);
		return new TF.GIS.SDK.Graphic({ geometry, symbol, attributes });
	}

	Layer.prototype.createPolylineGraphic = function(paths, symbol, attributes)
	{
		const geometry = TF.GIS.GeometryHelper.ComputeWebMercatorPolyline(paths);
		return new TF.GIS.SDK.Graphic({ geometry, symbol, attributes });
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
			queryParams.outSpatialReference = { wkid: TF.GIS.GeometryEnum.WKID.WEB_MERCATOR };
			queryParams.returnGeometry = true;
			queryParams.outFields = ['*'];

			results = await this.layer.queryFeatures(queryParams);
		}

		return Promise.resolve(results);
	}

	Layer.prototype.queryFeatureCount = async function(geometry = null, condition = '1 = 1')
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

	Layer.prototype.show = function()
	{
		if (!this.layer.visible)
		{
			this.layer.visible = true;
		}
	}

	Layer.prototype.hide = function()
	{
		if (this.layer.visible)
		{
			this.layer.visible = false;
		}
	}

	Layer.prototype.setFeaturesVisibility = function(features, visible)
	{
		for (let i = 0; i < features.length; i++)
		{
			features[i].visible = visible;
		}
	}

	Layer.prototype.queryVisibleFeatures = async function()
	{
		let features = [];
		if (this.layer instanceof TF.GIS.SDK.GraphicsLayer)
		{
			features = await this.queryFeatures(null);
		}
		else if (this.layer instanceof TF.GIS.SDK.FeatureLayer)
		{
			const results = await this.queryFeatures(null);
			features = results.features;
		}
		
		return features.filter(item => item.visible === true);
	}

	Layer.prototype.getFeatures = function()
	{
		if (this.layer instanceof TF.GIS.SDK.GraphicsLayer)
		{
			return this.layer.graphics.items || [];
		}
		else if (this.layer instanceof TF.GIS.SDK.FeatureLayer)
		{
			console.warn("TODO: getFeatures for FeatureLayer, promise")
			return [];
		}		
	}

	Layer.prototype.setLayerDefinitionExpression = function(expression)
	{
		if (this.layer instanceof TF.GIS.SDK.FeatureLayer)
		{
			this.layer.definitionExpression = expression;
		}
	}
})();
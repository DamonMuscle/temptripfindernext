(function()
{
	createNamespace("TF.GIS.Layer").PathArrowLayer = PathArrowLayer;

	const defaultOptions = {
		id: null,
		index: null,
		objectIdField: "oid",
		fields: [
			{
				name: "oid",
				type: "oid"
			}, {
				name: "angle",
				type: "double"
			}, {
				name: "DBID",
				type: "integer"
			}, {
				name: "Id",
				type: "integer"
			}, {
				name: "Color",
				type: "string"
			}
		],
		source: [],
		renderer: null
	};

	function PathArrowLayer(mapInstance, options)
	{
		const self = this;
		const baseArrowOptions = {
			geometryType: mapInstance.GEOMETRY_TYPE.POINT,
			spatialReference: {
				wkid: mapInstance.WKID_WEB_MERCATOR
			},
			minScale: TF.Helper.MapHelper.zoomToScale(mapInstance.map, 13),
		};
		const layerOptions = Object.assign({}, defaultOptions, baseArrowOptions, options);
		TF.GIS.Layer.call(self, layerOptions);
		
		// self.arrowLayerHelper = new TF.GIS.ArrowLayerHelper(mapInstance);
		// self.symbolHelper = new TF.Map.Symbol();
		
		// mapInstance.onMapViewExtentChangeEvent.subscribe(self.onMapViewExtentChangeHandler.bind(self));
		self.mapInstance = mapInstance;
	}

	PathArrowLayer.prototype = Object.create(TF.GIS.Layer.prototype);
	PathArrowLayer.prototype.constructor = PathArrowLayer;

	PathArrowLayer.prototype.create = function()
	{
		TF.GIS.Layer.prototype.create.call(this, this.LAYER_TYPE.FEATURE);
	}

	PathArrowLayer.prototype.getRenderer = function()
	{
		return this.layer.renderer;
	}

	PathArrowLayer.prototype.setRenderer = function(renderer)
	{
		this.layer.renderer = renderer;
	}

	PathArrowLayer.prototype.onMapViewExtentChangeHandler = function(_, data)
	{
		const self = this, DELAY_MILLISECONDS = 500;
		if (self.mapViewExtentChangeTimeout !== null)
		{
			window.clearTimeout(self.mapViewExtentChangeTimeout);
			self.mapViewExtentChangeTimeout = null;
		}
		
		self.mapViewExtentChangeTimeout = window.setTimeout(() =>
		{
			if (self.mapInstance?.map.mapView.stationary)
			{
				self.redraw();
			}
		}, DELAY_MILLISECONDS);
	}

	PathArrowLayer.prototype.redraw = function()
	{
		console.log("TODO: redraw arrow layer");
	}
})();
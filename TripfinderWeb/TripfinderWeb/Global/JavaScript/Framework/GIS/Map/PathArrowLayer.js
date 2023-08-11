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
		
		self.previousMapScale = null;
		self.onRedrawEvent = new TF.Events.Event();
		self.onRedrawEvent.subscribe(self.settings.eventHandlers?.redraw.bind(self));

		mapInstance.onMapViewExtentChangeEvent.subscribe(self.onMapViewExtentChangeHandler.bind(self));
		mapInstance.onMapViewScaleChangeEvent.subscribe(self.onMapViewScaleChangeHandler.bind(self));
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
		if (self.previousMapScale === null)
		{
			self.previousMapScale = self._getMapScale();
			self.previousExtent = data.previous.clone();
		}
		
		self._clearOnMapViewExtentChangeHandlerTimeout();

		self.mapViewExtentChangeTimeout = window.setTimeout(() =>
		{
			if (self.mapInstance?.map.mapView.stationary)
			{
				data.mapScaleChanged = self._verifyMapScaleChanged();
				data.previous = self.previousExtent.clone();
				self.redraw(data);
				self.previousMapScale = null;
			}

			self._clearOnMapViewExtentChangeHandlerTimeout();
		}, DELAY_MILLISECONDS);
	}

	PathArrowLayer.prototype.onMapViewScaleChangeHandler = function(_, data)
	{
		if (this.layer.visible === true)
		{
			this.hide();
		}
	}

	PathArrowLayer.prototype.redraw = function(data)
	{
		this.onRedrawEvent.notify(data);
	}

	PathArrowLayer.prototype.queryArrowFeatures = async function(condition)
	{
		const queryResult = await this.queryFeatures(null, condition);
		return queryResult.features || [];
	}

	PathArrowLayer.prototype.isPathWithinMapExtentChanged = function(pathFeatures, data)
	{
		const { previous, extent, mapScaleChanged } = data;
		let result = true;
		if (mapScaleChanged === false)
		{
			const withinExtent = this.verifyPathArrowsWithinExtent(pathFeatures, extent);
			if (withinExtent)
			{
				const withinPreviousExtent = this.verifyPathArrowsWithinExtent(pathFeatures, previous);
				if (withinPreviousExtent)
				{
					result = false;
				}
			}
		}

		return result;
	}

	PathArrowLayer.prototype.verifyPathArrowsWithinExtent = function(arrowFeatures, extent)
	{
		let result = true;
		for (let index = 0; index < arrowFeatures.length; index++)
		{
			const geometry = arrowFeatures[index]?.geometry;
			if (!TF.GIS.SDK.geometryEngine.within(geometry, extent))
			{
				result = false;
				break;
			}
		}

		return result;
	}

	PathArrowLayer.prototype._clearOnMapViewExtentChangeHandlerTimeout = function()
	{
		if (this.mapViewExtentChangeTimeout !== null)
		{
			window.clearTimeout(this.mapViewExtentChangeTimeout);
			this.mapViewExtentChangeTimeout = null;
		}
	}

	PathArrowLayer.prototype._getMapScale = function()
	{
		return this.mapInstance.map.mapView.scale;
	}

	PathArrowLayer.prototype._verifyMapScaleChanged = function()
	{
		const mapScale = this._getMapScale();
		const mapScaleChanged = !(this.previousMapScale && this.previousMapScale === mapScale);
		this.previousMapScale = mapScale;

		return mapScaleChanged;
	}

	PathArrowLayer.prototype.dispose = function()
	{
		this.onRedrawEvent?.unsubscribeAll();
	}
})();
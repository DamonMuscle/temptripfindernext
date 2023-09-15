(function()
{
	createNamespace("TF.GIS.Layer").StopLayer = StopLayer;

	function StopLayer(options)
	{
		const self = this;
		TF.GIS.Layer.call(self, options);

		self._editing = {
			movingStop: null
		};
	}

	StopLayer.prototype = Object.create(TF.GIS.Layer.prototype);
	StopLayer.prototype.constructor = StopLayer;

	Object.defineProperty(StopLayer.prototype, 'editing', {
		get() { return this._editing; },
		enumerable: false,
		configurable: false
	});

	StopLayer.prototype.create = function()
	{
		TF.GIS.Layer.prototype.create.call(this, this.LAYER_TYPE.GRAPHIC);
	}

	StopLayer.prototype.addStops = function(stopGraphics)
	{
		this.addMany(stopGraphics);
	}

	StopLayer.prototype.moveStop = function(stopGraphic, sketchTool, callback = ()=>{})
	{
		const self = this;
		self.editing.movingStop = {
			graphic: stopGraphic
		};

		const options = {
			moveDuplicateNode: self._getMoveDuplicateNode.bind(self),
			isFeatureLayer: false,
		};
		sketchTool.transform(stopGraphic.clone(), options, self._moveStopCallback.bind(self, callback));
	}

	StopLayer.prototype._moveStopCallback = function(callback, graphics)
	{
		if (!graphics)
		{
			return;
		}

		const self = this;
		const updateGraphic = self._getMovedStopGraphic(graphics);
		const movedStopData = self._updateMovedStop(updateGraphic);

		// remove edit moving stop graphic.
		self.deleteStop(updateGraphic);

		callback(movedStopData);
	}

	StopLayer.prototype.deleteStop = function(stopGraphic)
	{
		this.remove(stopGraphic);
	}

	StopLayer.prototype.updateColor = function(graphics, color, createStopSymbol)
	{
		if (!createStopSymbol instanceof Function)
		{
			throw new Error("invalid parameter: createStopSymbol");
		}

		for (let i = 0; i < graphics.length; i++)
		{
			const graphic = graphics[i];
			graphic.symbol = createStopSymbol(graphic.attributes.Sequence, color);
			graphic.attributes.Color = color;
		}
	}

	StopLayer.prototype._getMovedStopGraphic = function(graphics)
	{
		const self = this,
			movingStopGraphic = self.editing.movingStop.graphic,
			{ FieldTripId, Sequence } = movingStopGraphic.attributes;

		let updateGraphic = null;
		graphics.forEach(function(graphic)
		{
			if (graphic.attributes.FieldTripId === FieldTripId &&
				graphic.attributes.Sequence === Sequence)
			{
				updateGraphic = graphic;
				return;
			}
		});

		return updateGraphic;
	}

	StopLayer.prototype.getGeocodeStop = async function(longitude, latitude)
	{
		const geocodeService = TF.GIS.Analysis.getInstance().geocodeService;
		const geocodeResult = await geocodeService.locationToAddress({x: longitude, y: latitude});

		if (geocodeResult?.errorMessage)
		{
			console.error(geocodeResult.errorMessage);
			return null;
		}

		const { Address, City, RegionAbbr, CountryCode } = geocodeResult?.attributes;
		if (!geocodeService.isAvailableCountry(CountryCode))
		{
			tf.promiseBootbox.alert({
				message: "Please add a stop in USA or Canada.",
				title: "Alert"
			});
			return null;
		}

		const data = { Address, City, RegionAbbr, CountryCode };

		return data;
	}

	StopLayer.prototype._updateMovedStop = function(updateGraphic)
	{
		const self = this,
			movingStopGraphic = self.editing.movingStop.graphic;

		// update previous stop to avoid z-index changed.
		const updateGeometry = updateGraphic.geometry;
		movingStopGraphic.geometry = updateGeometry;
		movingStopGraphic.visible = true;

		// update stop name by geocoding.
		const { longitude, latitude } = updateGeometry;
		return { longitude, latitude };
	}

	//#region Settings for sketchTool

	StopLayer.prototype._getMoveDuplicateNode = function()
	{
		return true;
	}

	StopLayer.prototype.forceStopToJunction = function(stop)
	{
		return Promise.resolve(stop)
	}

	StopLayer.prototype.getHeartBoundaryId = function()
	{
		return null;
	}

	//#endregion

	StopLayer.prototype.dispose = function()
	{
	}
})();
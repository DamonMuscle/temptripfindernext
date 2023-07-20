(function()
{
	createNamespace("TF.GIS.Layer").StopLayer = StopLayer;

	function StopLayer(options)
	{
		const self = this;
		TF.GIS.Layer.call(self, options);
		
		self.symbolHelper = new TF.Map.Symbol();
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

	StopLayer.prototype.createStop = function(longitude, latitude, attributes)
	{
		const DEFAULT_STOP_COLOR = "#FFFFFF", DEFAULT_STOP_SEQUENCE = 0;
		const Color = attributes.Color || DEFAULT_STOP_COLOR;
		const Sequence = attributes.Sequence || DEFAULT_STOP_SEQUENCE;
		const symbol = this.getStopSymbol(Sequence, Color);
		const graphic = this.createPointGraphic(longitude, latitude, symbol, attributes);
		return graphic;
	}

	StopLayer.prototype.createHighlightStop = function(longitude, latitude, attributes)
	{
		const color = [253, 245, 53, 0.7];
		const symbol = {
			type: "simple-marker",
			color: color,
			size: 32,
			outline: null
		};
		const graphic = this.createPointGraphic(longitude, latitude, symbol, attributes);
		return graphic;
	}

	StopLayer.prototype.addStops = function(stopGraphics)
	{
		this.addMany(stopGraphics);
	}

	StopLayer.prototype.moveStop = function(stopGraphic, sketchTool)
	{
		const self = this;
		self.editing.movingStop = {
			graphic: stopGraphic
		};

		const options = {
			moveDuplicateNode: self._getMoveDuplicateNode.bind(self),
			isFeatureLayer: false,
		};
		sketchTool.transform(stopGraphic.clone(), options, self.moveStopCallback.bind(self));
	}

	StopLayer.prototype.moveStopCallback = async function(graphics)
	{
		if (!graphics)
		{
			return;
		}

		const self = this,
			movingStopGraphic = self.editing.movingStop.graphic;

		// get updated graphic
		let updateGraphic = null;
		graphics.forEach(function(graphic)
		{
			if (graphic.attributes.FieldTripId === movingStopGraphic.attributes.FieldTripId &&
				graphic.attributes.Sequence === movingStopGraphic.attributes.Sequence)
			{
				updateGraphic = graphic;
				return;
			}
		});

		let { longitude, latitude } = updateGraphic.geometry;
		const geocodeStreet = await this._getGeocodeStopAddress(longitude, latitude);
		if (geocodeStreet !== "")
		{
			updateGraphic.attributes.Name = geocodeStreet;
		}

		// remove previous stop graphic.
		this.deleteStop(movingStopGraphic);

		// STOP moving
		TF.RoutingMap.EsriTool.prototype.movePointCallback.call(self, graphics);

		const data = { longitude, latitude, geocodeStreet };
		PubSub.publish("GISLayer.StopLayer.MoveStopCompleted", data);
	}

	StopLayer.prototype.deleteStop = function(stopGraphic)
	{
		this.remove(stopGraphic);
	}

	StopLayer.prototype.updateColor = function(graphics, color)
	{
		for (let i = 0; i < graphics.length; i++)
		{
			const graphic = graphics[i];
			graphic.symbol = this.getStopSymbol(graphic.attributes.Sequence, color);
			graphic.attributes.Color = color;
		}
	}

	StopLayer.prototype.getCloneFeatures = function()
	{
		return this.layer.graphics.clone().items || [];
	}

	StopLayer.prototype.getStopSymbol = function(sequence, color)
	{
		return this.symbolHelper.tripStop(sequence, color);
	}

	StopLayer.prototype._getGeocodeStopAddress = async function(longitude, latitude)
	{
		const geocodeService = TF.GIS.Analysis.getInstance().geocodeService;
		const geocodeResult = await geocodeService.locationToAddress({x: longitude, y: latitude});

		if (geocodeResult?.errorMessage)
		{
			console.error(geocodeResult.errorMessage);
			return null;
		}

		return geocodeResult?.attributes.Address;
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

	StopLayer.prototype.updateDataModel = function(graphics)
	{
		if (graphics && graphics.length !== 1)
		{
			console.warn(`updateDataModel: Multiple graphics updated! Failed.`);
			return;
		}

		const data = { graphic: graphics[0] };
		PubSub.publish("GISLayer.StopLayer.MoveStopCompleted_UpdateDataModel", data);

		return;
	}

	StopLayer.prototype.dispose = function()
	{
		if (this.symbolHelper)
		{
			this.symbolHelper.dispose();
			this.symbolHelper = null;
		}
	}

	//#endregion

})();
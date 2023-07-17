
(function()
{
	createNamespace("TF.RoutingPalette").FieldTripMap = FieldTripMap;

	//#region Constant

	const RoutingPalette_FieldTripPathArrowLayerId = "RoutingPalette_FieldTrip_PathArrowLayer";
	const RoutingPalette_FieldTripPathArrowLayer_Index = 1;
	const RoutingPalette_FieldTripPathLayerId = "RoutingPalette_FieldTrip_PathLayer";
	const RoutingPalette_FieldTripPathLayer_Index = 2;
	const RoutingPalette_FieldTripSequenceLineArrowLayerId = "RoutingPalette_FieldTrip_SequenceLineArrowLayer";
	const RoutingPalette_FieldTripSequenceLineArrowLayer_Index = 3;
	const RoutingPalette_FieldTripSequenceLineLayerId = "RoutingPalette_FieldTrip_SequenceLineLayer";
	const RoutingPalette_FieldTripSequenceLineLayer_Index = 4;
	const RoutingPalette_FieldTripStopLayerId = "RoutingPalette_FieldTrip_StopLayer";
	const RoutingPalette_FieldTripStopLayer_Index = 5;
	const PATH_LINE_TYPE = {
		Path: "Path",
		Sequence: "Sequence"
	};

	//#endregion

	function FieldTripMap(mapInstance)
	{
		if (!mapInstance)
		{
			console.error("FieldTripMap constructor failed! No valid mapInstance.");
			return;
		}

		this.mapInstance = mapInstance;
		this.arrowLayerHelper = new TF.GIS.ArrowLayerHelper(mapInstance);
		this.symbol = new TF.Map.Symbol();
		this._pathLineType = tf.storageManager.get('pathLineType') === 'Sequence' ? PATH_LINE_TYPE.Sequence : PATH_LINE_TYPE.Path;
		this._mapEditingFeatures = {
			movingStop: null
		};
		this.initLayers();
		this.defineReadOnlyProperty("PATH_LINE_TYPE", PATH_LINE_TYPE);

		PubSub.subscribe("GISLayer.StopLayer.MoveStopCompleted", this.onStopLayerMoveStopCompleted.bind(this));
		PubSub.subscribe("GISLayer.StopLayer.MoveStopCompleted_UpdateDataModel", this.onStopLayerMoveStopCompleted_UpdateDataModel.bind(this));
	}

	//#region Property

	FieldTripMap.prototype.defineReadOnlyProperty = function(propertyName, value)
	{
		Object.defineProperty(this, propertyName, {
			get() { return value; },
			enumerable: false,
			configurable: false
		});
	};

	Object.defineProperty(FieldTripMap.prototype, 'pathLineType', {
		get() { return this._pathLineType; },
		set(value)
		{
			this._pathLineType = value;
		},
		enumerable: false,
		configurable: false
	});

	FieldTripMap.prototype.setPathLineType = function(isSequenceLine)
	{
		this.pathLineType = isSequenceLine ? PATH_LINE_TYPE.Sequence : PATH_LINE_TYPE.Path;
	}

	Object.defineProperty(FieldTripMap.prototype, 'mapEditingFeatures', {
		get() { return this._mapEditingFeatures; },
		enumerable: false,
		configurable: false
	});

	//#endregion

	//#region Initialization

	FieldTripMap.prototype.initLayers = async function()
	{
		const self = this;

		const totalLayerCount = 3;
		let layerCount = 0;
		const onLayerCreatedHandler = (resolve) => {
			layerCount++;
			if (layerCount === totalLayerCount)
			{
				resolve();
			}
		};

		const addFieldTripMapLayer = (layerId, layerIndex, resolve) => {
			return self.mapInstance.addLayer({
				id: layerId,
				index: layerIndex,
				eventHandlers: {
					onLayerCreated: onLayerCreatedHandler.bind(self, resolve)
				}
			});
		};

		return new Promise((resolve, _) =>
		{
			if (self.fieldTripStopLayerInstance &&
				self.fieldTripPathLayerInstance &&
				self.fieldTripSequenceLineLayerInstance)
			{
				resolve();
			}

			self.fieldTripPathLayerInstance = addFieldTripMapLayer(RoutingPalette_FieldTripPathLayerId, RoutingPalette_FieldTripPathLayer_Index, resolve);
			self.defineReadOnlyProperty("fieldTripPathLayerInstance", this.fieldTripPathLayerInstance);

			self.fieldTripSequenceLineLayerInstance = addFieldTripMapLayer(RoutingPalette_FieldTripSequenceLineLayerId, RoutingPalette_FieldTripSequenceLineLayer_Index, resolve);
			self.defineReadOnlyProperty("fieldTripSequenceLineLayerInstance", this.fieldTripSequenceLineLayerInstance);


			self.fieldTripStopLayerInstance = new TF.GIS.Layer.StopLayer({
				id: RoutingPalette_FieldTripStopLayerId,
				index: RoutingPalette_FieldTripStopLayer_Index
			});
			self.mapInstance.addLayerInstance(self.fieldTripStopLayerInstance, {
				eventHandlers: {
					onLayerCreated: onLayerCreatedHandler.bind(self, resolve)
				}
			});
			self.defineReadOnlyProperty("fieldTripStopLayerInstance", this.fieldTripStopLayerInstance);
		});
	}

	FieldTripMap.prototype.initArrowLayers = function(fieldTrips)
	{
		const self = this;
		if (!self.mapInstance)
		{
			return;
		}

		if (self.fieldTripPathArrowLayerInstance && self.fieldTripSequenceLineArrowLayerInstance)
		{
			self.mapInstance.removeLayer(RoutingPalette_FieldTripPathArrowLayerId);
			self.fieldTripPathArrowLayerInstance = null;

			self.mapInstance.removeLayer(RoutingPalette_FieldTripSequenceLineArrowLayerId);
			self.fieldTripSequenceLineArrowLayerInstance = null;
		}

		const arrowRenderer = self._getArrowRenderer(fieldTrips);
		self.fieldTripPathArrowLayerInstance = self.arrowLayerHelper.create(RoutingPalette_FieldTripPathArrowLayerId, RoutingPalette_FieldTripPathArrowLayer_Index, arrowRenderer);
		self.fieldTripSequenceLineArrowLayerInstance = self.arrowLayerHelper.create(RoutingPalette_FieldTripSequenceLineArrowLayerId, RoutingPalette_FieldTripSequenceLineArrowLayer_Index, arrowRenderer);
	}

	//#endregion

	//#region Interaction

	//#region - Edit / View Field Trips

	FieldTripMap.prototype.addFieldTrip = async function(fieldTrip)
	{
		if (!this.mapInstance)
		{
			return;
		}

		this._sortBySequence(fieldTrip.FieldTripStops);

		await this.drawStops(fieldTrip);

		await this.addFieldTripPath(fieldTrip);
	}

	FieldTripMap.prototype.addFieldTripPath = async function(fieldTrip)
	{
		await this.drawFieldTripPath(fieldTrip);

		return new Promise((resolve, reject) =>
		{
			this.drawSequenceLine(fieldTrip, () => {
				this.updateFieldTripPathVisible([fieldTrip]);
	
				if (fieldTrip.visible === false)
				{
					// the Field Trips are hidden.
					this.setFieldTripVisible([fieldTrip]);
				}

				resolve();
			});
		});
	}

	//#endregion

	//#region - Show / Hide Layers

	FieldTripMap.prototype.setFieldTripVisible = async function(fieldTrips)
	{
		this.setFieldTripStopVisible(fieldTrips);

		this.setFieldTripPathVisible(fieldTrips);
		await this.setFieldTripPathArrowVisible(fieldTrips);

		this.setFieldTripSequenceLineVisible(fieldTrips);
		await this.setFieldTripSequenceLineArrowVisible(fieldTrips);
	}

	FieldTripMap.prototype.setFieldTripStopVisible = function(fieldTrips)
	{
		const stopFeatures = this._getStopFeatures();
		for (let i = 0; i < fieldTrips.length; i++)
		{
			const fieldTrip = fieldTrips[i],
				{ DBID, FieldTripId } = this._extractFieldTripFeatureFields(fieldTrip),
				visible = fieldTrip.visible;

			const fieldTripStops = this._queryMapFeatures(stopFeatures, DBID, FieldTripId);
			this._updateMapFeaturesVisible(fieldTripStops, visible);
		}
	}

	FieldTripMap.prototype.setFieldTripPathVisible = function(fieldTrips)
	{
		const pathFeatures = this._getPathFeatures();
		for (let i = 0; i < fieldTrips.length; i++)
		{
			const fieldTrip = fieldTrips[i],
				{ DBID, FieldTripId } = this._extractFieldTripFeatureFields(fieldTrip),
				visible = this.pathLineType === PATH_LINE_TYPE.Path && fieldTrip.visible,
				fieldTripPaths = this._queryMapFeatures(pathFeatures, DBID, FieldTripId);

			this._updateMapFeaturesVisible(fieldTripPaths, visible);
		}
	}

	FieldTripMap.prototype.setFieldTripSequenceLineVisible = function(fieldTrips)
	{
		const sequenceLineFeatures = this._getSequenceLineFeatures();
		for (let i = 0; i < fieldTrips.length; i++)
		{
			const fieldTrip = fieldTrips[i],
				{ DBID, FieldTripId } = this._extractFieldTripFeatureFields(fieldTrip),
				visible = this.pathLineType === PATH_LINE_TYPE.Sequence && fieldTrip.visible,
				fieldTripSequenceLines = this._queryMapFeatures(sequenceLineFeatures, DBID, FieldTripId);

			this._updateMapFeaturesVisible(fieldTripSequenceLines, visible);
		}
	}

	FieldTripMap.prototype._updateMapFeaturesVisible = function(features, visible)
	{
		for (let i = 0; i < features.length; i++)
		{
			features[i].visible = visible;
		}
	}

	//#endregion

	//#region - Zoom Map to Layers, Center Map

	FieldTripMap.prototype.zoomToFieldTripLayers = function(fieldTrips)
	{
		const stopFeatures = this._getStopFeatures(),
			pathFeatures = this._getPathFeatures(),
			sequenceLineFeatures = this._getSequenceLineFeatures();

		let graphics = [];

		for (let j = 0; j < fieldTrips.length; j++)
		{
			const fieldTrip = fieldTrips[j],
				{ DBID, FieldTripId } = this._extractFieldTripFeatureFields(fieldTrip);

			graphics = graphics.concat(this._queryMapFeatures(stopFeatures, DBID, FieldTripId));
			graphics = graphics.concat(this._queryMapFeatures(pathFeatures, DBID, FieldTripId));
			graphics = graphics.concat(this._queryMapFeatures(sequenceLineFeatures, DBID, FieldTripId));
		}

		this.mapInstance.setExtent(graphics);
	}

	FieldTripMap.prototype.zoomToFieldTripStop = function({longitude, latitude})
	{
		const DEFAULT_MAP_SCALE = 5000;
		this.mapInstance.centerAndZoom(longitude, latitude, DEFAULT_MAP_SCALE);
	}

	//#endregion

	//#region - Close Layer, Close Map

	FieldTripMap.prototype.removeFieldTrip = async function(fieldTrip)
	{
		const { DBID, FieldTripId } = this._extractFieldTripFeatureFields(fieldTrip),
			stopFeatures = this._getStopFeatures(),
			pathArrowFeatures = await this._getPathArrowFeatures(),
			pathFeatures = this._getPathFeatures(),
			sequenceLineArrowFeatures = await this._getSequenceLineArrowFeatures(),
			sequenceLineFeatures = this._getSequenceLineFeatures(),
			mapFeaturesTable = [stopFeatures, pathFeatures, sequenceLineFeatures],
			mapLayerInstanceTable = [this.fieldTripStopLayerInstance,  this.fieldTripPathLayerInstance, this.fieldTripSequenceLineLayerInstance],
			mapArrowFeaturesTable = [pathArrowFeatures, sequenceLineArrowFeatures],
			mapArrowLayerInstanceTable = [this.fieldTripPathArrowLayerInstance, this.fieldTripSequenceLineArrowLayerInstance];

		for (let i = 0; i < mapFeaturesTable.length; i++)
		{
			const features = this._queryMapFeatures(mapFeaturesTable[i], DBID, FieldTripId);
			this.removeMapLayerFeatures(mapLayerInstanceTable[i], features);
		}

		for (let i = 0; i < mapArrowFeaturesTable.length; i++)
		{
			const features = this._queryArrowFeatures(mapArrowFeaturesTable[i], DBID, FieldTripId);
			this.removeMapLayerFeatures(mapArrowLayerInstanceTable[i], features);
		}
	}

	FieldTripMap.prototype.removeMapLayerFeatures = function(layerInstance, removeFeatures)
	{
		for (let i = 0; i < removeFeatures.length; i++)
		{
			const feature = removeFeatures[i];
			layerInstance.remove(feature);
		}
	}

	//#endregion

	//#region - Update Layer Color

	FieldTripMap.prototype.updateSymbolColor = async function(fieldTrip)
	{
		const color = this._getColor(fieldTrip),
			{ DBID, FieldTripId } = this._extractFieldTripFeatureFields(fieldTrip),
			stopFeatures = this._getStopFeatures(),
			pathFeatures = this._getPathFeatures(),
			sequenceLineFeatures = this._getSequenceLineFeatures();

		const fieldTripStops = this._queryMapFeatures(stopFeatures, DBID, FieldTripId);
		for (let i = 0; i < fieldTripStops.length; i++)
		{
			const stopFeature = fieldTripStops[i];
			stopFeature.symbol = this.symbol.tripStop(stopFeature.attributes.Sequence, color);
			stopFeature.attributes.Color = color;
		}

		const fieldTripPaths = this._queryMapFeatures(pathFeatures, DBID, FieldTripId);
		this._updatePathGraphicColor(fieldTripPaths, color);

		const fieldTripSequenceLines = this._queryMapFeatures(sequenceLineFeatures, DBID, FieldTripId);
		this._updatePathGraphicColor(fieldTripSequenceLines, color);

		// update path arrow color
		const description = `DBID = ${DBID}, Id = ${FieldTripId}`;
		this._updatePathArrowFeatureColor(this.fieldTripPathArrowLayerInstance, description, color);
		this._updatePathArrowFeatureColor(this.fieldTripSequenceLineArrowLayerInstance, description, color);
		this.redrawFieldTripArrows([fieldTrip]);
	}

	FieldTripMap.prototype._updatePathGraphicColor = function(graphics, color)
	{
		for (let i = 0; i < graphics.length; i++)
		{
			const graphic = graphics[i];
			graphic.symbol =  this.symbol.tripPath(color);
			graphic.attributes.Color = color;
		}
	}

	FieldTripMap.prototype._updatePathArrowFeatureColor = function(layerInstance, description, color)
	{
		const arrowOnPath = this._isArrowOnPath();
		const layerRenderer = layerInstance.layer.renderer.clone();
		const valueInfo = layerRenderer.uniqueValueInfos.filter(item => item.description === description)[0];
		valueInfo.value = color;
		valueInfo.symbol = arrowOnPath ? this.symbol.arrow(color) : this.symbol.arrowOnSide(color);

		layerInstance.layer.renderer = layerRenderer;
	}

	//#endregion

	//#region - Switch Field Trip Path Type (Sequence Lines / Path Lines)

	FieldTripMap.prototype.updateFieldTripPathVisible = async function(fieldTrips)
	{
		this.updateArrowRenderer(fieldTrips);
		await this.redrawFieldTripArrows(fieldTrips);

		this.setFieldTripPathVisible(fieldTrips);
		this.setFieldTripSequenceLineVisible(fieldTrips);
	}

	//#endregion

	//#region TODO: Add / Insert Field Trip Stop

	//#endregion

	//#region TODO: Delete Field Trip Stop

	//#endregion

	//#region TODO: Geo Select Field Trip Stop

	//#endregion

	//#region TODO: Optimize Field Trip

	//#endregion

	//#region TODO: Refresh Field Trip Path

	FieldTripMap.prototype.refreshFieldTripPath = async function(fieldTrip)
	{
		this.clearFieldTripPath(fieldTrip);
		await this.clearFieldTripPathArrow(fieldTrip);

		this.clearSequenceLine(fieldTrip);
		await this.clearSequenceLineArrow(fieldTrip);

		await this.addFieldTripPath(fieldTrip);
	}

	FieldTripMap.prototype.clearFieldTripPath = function(fieldTrip)
	{
		const self = this,
			{ DBID, FieldTripId } = self._extractFieldTripFeatureFields(fieldTrip),
			pathFeatures = self._getPathFeatures(),
			fieldTripPaths = self._queryMapFeatures(pathFeatures, DBID, FieldTripId);
		
		for (let i = 0; i < fieldTripPaths.length; i++)
		{
			self.fieldTripPathLayerInstance.remove(fieldTripPaths[i]);
		}

		fieldTrip.routePath = null;
		fieldTrip.routePathAttributes = null;
		fieldTrip.directions = null;
	}

	FieldTripMap.prototype.clearSequenceLine = function(fieldTrip)
	{
		const self = this,
			{ DBID, FieldTripId } = self._extractFieldTripFeatureFields(fieldTrip),
			sequenceLineFeatures = this._getSequenceLineFeatures();
			sequenceLines = this._queryMapFeatures(sequenceLineFeatures, DBID, FieldTripId);

		for (let i = 0; i < sequenceLines.length; i++)
		{
			self.fieldTripSequenceLineLayerInstance.remove(sequenceLines[i]);
		}
	}

	FieldTripMap.prototype.clearFieldTripPathArrow = async function(fieldTrip)
	{
		const self = this,
			{ DBID, FieldTripId } = self._extractFieldTripFeatureFields(fieldTrip),
			edits = {},
			condition = `DBID = ${DBID} and Id = ${FieldTripId}`;
			deleteArrows = await self._getPathArrowFeatures(condition);

		if (deleteArrows.length >= 0)
		{
			edits.deleteFeatures = deleteArrows;
		}

		await self.fieldTripPathArrowLayerInstance.layer.applyEdits(edits);
	}

	FieldTripMap.prototype.clearSequenceLineArrow = async function(fieldTrip)
	{
		const self = this,
			{ DBID, FieldTripId } = self._extractFieldTripFeatureFields(fieldTrip),
			edits = {},
			condition = `DBID = ${DBID} and Id = ${FieldTripId}`;
			deleteArrows = await self._getSequenceLineArrowFeatures(condition);

		if (deleteArrows.length >= 0)
		{
			edits.deleteFeatures = deleteArrows;
		}

		await self.fieldTripSequenceLineArrowLayerInstance.layer.applyEdits(edits);
	}

	//#endregion

	//#region TODO: RCM on Map

	//#region Field Trip Stop

	//#region Move Stop Location

	FieldTripMap.prototype.moveStopLocation = async function(fieldTrip, stop, sketchTool)
	{
		const self = this;
		if (!self.fieldTripStopLayerInstance || !sketchTool)
		{
			return;
		}

		const sequence = stop.Sequence, fieldTripId = fieldTrip.id;
		const fieldTripStops = self._getStopFeatures();
		const stopGraphic = fieldTripStops.find(item => item.attributes.FieldTripId === fieldTripId && item.attributes.Sequence === sequence);
		if (!stopGraphic)
		{
			return;
		}

		console.log(stopGraphic.attributes.Name);

		self.mapEditingFeatures.movingStop = {
			fieldTrip: fieldTrip,
			stop: stop
		};

		self.fieldTripStopLayerInstance?.moveStop(stopGraphic, sketchTool);

		stopGraphic.visible = false;
	}

	FieldTripMap.prototype.onStopLayerMoveStopCompleted = function(_, data)
	{
		const self = this,
			fieldTrip = self.mapEditingFeatures.movingStop.fieldTrip,
			movingStop = self.mapEditingFeatures.movingStop.stop,
			{ longitude, latitude, geocodeStreet } = data;

		if (geocodeStreet !== "")
		{
			movingStop.Street = geocodeStreet;
		}
		movingStop.XCoord = +longitude.toFixed(6);
		movingStop.YCoord = +latitude.toFixed(6);

		self.refreshFieldTripPath(fieldTrip);
	}

	FieldTripMap.prototype.onStopLayerMoveStopCompleted_UpdateDataModel = function(_, data)
	{
		const stop = this.mapEditingFeatures.movingStop.stop,
			graphic = data.graphic,
			attributes = graphic.attributes;
		if (stop.FieldTripId === attributes.FieldTripId && stop.Sequence === attributes.Sequence)
		{
			const data = {
				DBID: attributes.DBID,
				FieldTripId: stop.FieldTripId,
				Sequence: stop.Sequence,
				Name: stop.Street,
				XCoord: stop.XCoord,
				YCoord: stop.YCoord,
			};
			PubSub.publish("on_FieldTripMap_MoveStopLocationCompleted", data);
		}
		else
		{
			console.warn(`updateDataModel: stop does not match!`);
		}

		return;
	}

	FieldTripMap.prototype.clearStops = function(fieldTrip, stops = null)
	{
		const self = this,
			{ DBID, FieldTripId } = self._extractFieldTripFeatureFields(fieldTrip),
			stopFeatures = self._getStopFeatures(),
			fieldTripStops = self._queryMapFeatures(stopFeatures, DBID, FieldTripId);

		if (stops)
		{
			stops.forEach(stop =>
			{
				const sequence = stop.Sequence,
					stopFeature = fieldTripStops.find(item => item.attributes.Sequence === sequence);
				self.fieldTripStopLayerInstance.deleteStop(stopFeature);
			});
		}
	}

	//#endregion

	//#region Delete Stop

	FieldTripMap.prototype.deleteStopLocation = async function(fieldTrip, stop)
	{
		const self = this;
		if (!self.fieldTripStopLayerInstance)
		{
			return;
		}

		const { DBID, FieldTripId } = self._extractFieldTripFeatureFields(fieldTrip),
			sequence = stop.Sequence,
			fieldTripStops = self._getStopFeatures();

		for (let i = 0; i < fieldTripStops.length; i++)
		{
			const stop = fieldTripStops[i],
				attributes = stop.attributes;
			if (attributes.DBID === DBID && attributes.FieldTripId === FieldTripId)
			{
				if (attributes.Sequence === sequence)
				{
					self.fieldTripStopLayerInstance.deleteStop(stop);
				}
				else if (attributes.Sequence > sequence)
				{
					attributes.Sequence -= 1;
				}
			}
		}

		const data = { fieldTripStopId: stop.id };
		PubSub.publish("on_FieldTripMap_DeleteStopLocationCompleted", data);

		self.refreshFieldTripPath(fieldTrip);
	}

	//#endregion

	//#endregion

	//#region Map Events

	FieldTripMap.prototype.onMapCanvasMapExtentChangeEvent = function(fieldTrips)
	{
		const self = this;
		if (self.mapExtentChangeTimeout !== null)
		{
			window.clearTimeout(self.mapExtentChangeTimeout);
			self.mapExtentChangeTimeout = null;
		}

		self.mapExtentChangeTimeout = window.setTimeout(() =>
		{
			if (self.mapInstance?.map.mapView.stationary)
			{
				self.redrawFieldTripArrows(fieldTrips);
			}

			self.mapExtentChangeTimeout = null;
		}, 500);
	}

	FieldTripMap.prototype.onMapClickEvent = async function(data)
	{
		const self = this, event = data.event;
		if (event.button === 2)
		{
			// right click
			const response = await self.mapInstance?.map.mapView.hitTest(event);
			if (response.results.length > 0)
			{
				const graphics = response.results.map(item => item.graphic);
				const stopGraphics = graphics.filter(item => item.layer.id === RoutingPalette_FieldTripStopLayerId);
				const data = stopGraphics.map(stop => {
					return { DBID: stop.attributes.DBID, FieldTripId: stop.attributes.FieldTripId, Sequence: stop.attributes.Sequence };
				});

				const dataWrapper = {
					data: data,
					event: event
				};

				console.log(dataWrapper);
				PubSub.publish("FieldTripMap_onMapClick_FieldTripStop", dataWrapper);
			}
		}
	}

	//#endregion

	//#endregion

	//#region Map Visualization

	FieldTripMap.prototype.drawStops = async function(fieldTrip)
	{
		const self = this,
		 	color = self._getColor(fieldTrip),
			Color = color,
			{ DBID, FieldTripId } = this._extractFieldTripFeatureFields(fieldTrip);

		let Sequence = null, Name = null, CurbApproach = 0, attributes = null;
		if (fieldTrip.FieldTripStops.length === 0)
		{
			Sequence = 1;
			Name = fieldTrip.SchoolName;
			attributes = {DBID, FieldTripId, Name, CurbApproach, Sequence, Color};
			const school = self.fieldTripStopLayerInstance?.createStop(fieldTrip.SchoolXCoord, fieldTrip.SchoolYCoord, attributes);

			Sequence = 2;
			Name = fieldTrip.Destination;
			attributes = {DBID, FieldTripId, Name, CurbApproach, Sequence, Color};
			const destination = self.fieldTripStopLayerInstance?.createStop(fieldTrip.FieldTripDestinationXCoord, fieldTrip.FieldTripDestinationYCoord, attributes);

			await self.fieldTripStopLayerInstance?.addStops([destination, school]);
		}
		else
		{
			const fieldTripStops = fieldTrip.FieldTripStops;
			const graphics = [];
			for (let i = fieldTripStops.length - 1; i >= 0; i--)
			{
				const stop = fieldTripStops[i];
				Name = stop.Street;
				Sequence = stop.Sequence;
				CurbApproach = stop.VehicleCurbApproach;
				attributes = {DBID, FieldTripId, Name, CurbApproach, Sequence, Color};
				graphics.push(self.fieldTripStopLayerInstance?.createStop(stop.XCoord, stop.YCoord, attributes));
			}

			await self.fieldTripStopLayerInstance?.addStops(graphics);
		}
	}

	FieldTripMap.prototype.drawFieldTripPath = async function(fieldTrip)
	{
		if (!fieldTrip.routePath)
		{
			const routeResults = await this.calculateRoute(fieldTrip);

			routeResults.forEach(routeResult => {
				fieldTrip.routePath = [...(fieldTrip.routePath||[]), ...this._computeRoutePath(routeResult)];
				fieldTrip.routePathAttributes = this._computePathAttributes(fieldTrip, routeResult);
				fieldTrip.directions = this._computeDirections(routeResult);
			});

			const data = { fieldTrip };
			PubSub.publish("on_FieldTripMap_DirectionUpdated", data);
		}

		const routePath = fieldTrip.routePath;
		if (!routePath)
		{
			return;
		}

		const pathAttributes = fieldTrip.routePathAttributes;
		const pathSymbol = this._computePathSymbol(fieldTrip);
		this.fieldTripPathLayerInstance?.addPolyline(routePath, pathSymbol, pathAttributes);
	}

	FieldTripMap.prototype.drawSequenceLine = function(fieldTrip, afterAdd = null)
	{
		const sequenceLine = this._computeSequenceLine(fieldTrip);
		const pathSymbol = this._computePathSymbol(fieldTrip);
		const Color = this._getColor(fieldTrip),
			{ DBID, FieldTripId } = this._extractFieldTripFeatureFields(fieldTrip),
			attributes = { DBID, FieldTripId, Color };

		this.fieldTripSequenceLineLayerInstance?.addPolyline(sequenceLine, pathSymbol, attributes, afterAdd);
	}

	FieldTripMap.prototype.sortMapFeatures = async function(fieldTrips)
	{
		const self = this;
		const fieldTripNames = fieldTrips.map(item => {
			return { Name: item.Name, FieldTripId: item.Id };
		}).sort((a, b)=> a.Name.localeCompare(b.Name));
		const fieldTripIds = fieldTripNames.map(item => item.FieldTripId);

		const fieldTripStops = this.fieldTripStopLayerInstance?.getCloneFeatures();
		if (fieldTripStops.length === 0)
		{
			return;
		}

		fieldTripStops.sort((a, b) => {
			// sort by tripName
			const aId = a.attributes.FieldTripId, bId = b.attributes.FieldTripId;
			if (aId === bId)
			{
				// sort by sequence desc
				return (-1) * (a.attributes.Sequence - b.attributes.Sequence);
			}
			return fieldTripIds.indexOf(aId) - fieldTripIds.indexOf(bId);
		});

		await self.fieldTripStopLayerInstance?.clearLayer();
		await self.fieldTripStopLayerInstance?.addStops(fieldTripStops);
	}

	//#region - Path Arrows

	FieldTripMap.prototype._getArrowRenderer = function(fieldTrips)
	{
		const uniqueValueInfos = [],
			arrowOnPath = this._isArrowOnPath();
		
		for (let i = 0; i < fieldTrips.length; i++)
		{
			const fieldTrip = fieldTrips[i],
				value = this._getColor(fieldTrip),
				DBID = fieldTrip.DBID,
				FieldTripId = fieldTrip.Id,
				description = `DBID = ${DBID}, Id = ${FieldTripId}`;
			const symbol = arrowOnPath ? this.symbol.arrow(value) : this.symbol.arrowOnSide(value);
			uniqueValueInfos.push({ value, symbol, description });
		}

		return this.arrowLayerHelper.createUniqueValueRenderer(uniqueValueInfos);
	}

	FieldTripMap.prototype.updateArrowRenderer = function(fieldTrips)
	{
		const arrowRenderer = this._getArrowRenderer(fieldTrips);
		this.fieldTripPathArrowLayerInstance.layer.renderer = arrowRenderer;
		this.fieldTripSequenceLineArrowLayerInstance.layer.renderer = arrowRenderer;
	}

	FieldTripMap.prototype.redrawFieldTripArrows = async function(fieldTrips)
	{
		for (let i = 0; i < fieldTrips.length; i++)
		{
			const fieldTrip = fieldTrips[i];
			if (fieldTrip.visible)
			{
				await this.drawFieldTripPathArrow(fieldTrip);
				await this.drawSequenceLineArrow(fieldTrip);
			}
		}

		await this.setFieldTripPathArrowVisible(fieldTrips);
		await this.setFieldTripSequenceLineArrowVisible(fieldTrips);
	}

	FieldTripMap.prototype.drawFieldTripPathArrow = async function(fieldTrip)
	{
		const self = this;
		if (self.pathLineType === PATH_LINE_TYPE.Sequence)
		{
			return;
		}

		const pathFeatures = self._getPathFeatures(),
			pathFeature = pathFeatures.filter(feature => feature.attributes.DBID === fieldTrip.DBID && feature.attributes.FieldTripId === fieldTrip.Id)[0],
			arrows = self._computeArrowFeatures(pathFeature);

		const edits = {};
		const condition = `DBID = ${fieldTrip.DBID} and Id = ${fieldTrip.Id}`;
		const deleteArrows = await self._getPathArrowFeatures(condition);
		if (deleteArrows.length > 0)
		{
			edits.deleteFeatures = deleteArrows;
		}
		if (arrows.length >= 0)
		{
			edits.addFeatures = arrows;
		}

		await self.fieldTripPathArrowLayerInstance.layer.applyEdits(edits);
	}

	FieldTripMap.prototype.drawSequenceLineArrow = async function(fieldTrip)
	{
		const self = this;
		if (self.pathLineType === PATH_LINE_TYPE.Path)
		{
			return;
		}

		const sequenceLineFeatures = self._getSequenceLineFeatures(),
			lineFeature = sequenceLineFeatures.filter(feature => feature.attributes.DBID === fieldTrip.DBID && feature.attributes.FieldTripId === fieldTrip.Id)[0],
			arrows = self._computeArrowFeatures(lineFeature);

		const edits = {};
		const condition = `DBID = ${fieldTrip.DBID} and Id = ${fieldTrip.Id}`;
		const deleteArrows = await self._getSequenceLineArrowFeatures(condition);
		if (deleteArrows.length > 0)
		{
			edits.deleteFeatures = deleteArrows;
		}
		if (arrows.length >= 0)
		{
			edits.addFeatures = arrows;
		}

		await self.fieldTripSequenceLineArrowLayerInstance.layer.applyEdits(edits);
	}

	FieldTripMap.prototype._computeArrowFeatures = function(polylineFeature)
	{
		let arrows = [];
		if (!polylineFeature)
		{
			return arrows;
		}

		const self = this,
			arrowOnPath = self._isArrowOnPath(),
			{ DBID, FieldTripId, Color } = polylineFeature.attributes,
			attributes = { DBID, Color };

		attributes.Id = FieldTripId;
		arrows = self.arrowLayerHelper.computeArrowFeatures(polylineFeature, arrowOnPath);

		for (let k = 0; k < arrows.length; k++)
		{
			const graphic = arrows[k];
			graphic.attributes = Object.assign({}, graphic.attributes, attributes);
		}

		return arrows;
	}

	FieldTripMap.prototype.setFieldTripPathArrowVisible = async function(fieldTrips)
	{
		const self = this;
		const pathArrowFeatures = await self._getPathArrowFeatures();
		let updateFeatures = [];
		for (let i = 0; i < fieldTrips.length; i++)
		{
			const fieldTrip = fieldTrips[i],
				Color = fieldTrip.color,
				visible = this.pathLineType === PATH_LINE_TYPE.Path && fieldTrip.visible,
				updateColor = visible ? Color : null;

			updateFeatures = updateFeatures.concat(self._computeUpdateArrow(fieldTrip, pathArrowFeatures, updateColor));
		}

		if (updateFeatures.length > 0)
		{
			const edits = { updateFeatures };
			await self.fieldTripPathArrowLayerInstance.layer.applyEdits(edits);
		}

		self.fieldTripPathArrowLayerInstance.layer.refresh();
	}

	FieldTripMap.prototype.setFieldTripSequenceLineArrowVisible = async function(fieldTrips)
	{
		const self = this;
		const sequenceLineArrowFeatures = await self._getSequenceLineArrowFeatures();
		let updateFeatures = [];
		for (let i = 0; i < fieldTrips.length; i++)
		{
			const fieldTrip = fieldTrips[i],
				Color = fieldTrip.color,
				visible = this.pathLineType === PATH_LINE_TYPE.Sequence && fieldTrip.visible,
				updateColor = visible ? Color : null;

			updateFeatures = updateFeatures.concat(self._computeUpdateArrow(fieldTrip, sequenceLineArrowFeatures, updateColor));
		}

		if (updateFeatures.length > 0)
		{
			const edits = { updateFeatures };
			await self.fieldTripSequenceLineArrowLayerInstance.layer.applyEdits(edits);
		}

		self.fieldTripSequenceLineArrowLayerInstance.layer.refresh();
	}

	FieldTripMap.prototype._computeUpdateArrow = function(fieldTrip, baseArrowFeatures, updateColor)
	{
		const self = this,
			{ DBID, FieldTripId } = this._extractFieldTripFeatureFields(fieldTrip),
			filterArrows = self._queryArrowFeatures(baseArrowFeatures, DBID, FieldTripId),
			updateFeatures = [];

		for (let j = 0; j < filterArrows.length; j++)
		{
			const arrowFeature = filterArrows[j];
			if (updateColor !== arrowFeature.attributes.Color)
			{
				arrowFeature.attributes.Color = updateColor;
				updateFeatures.push(arrowFeature);
			}
		}

		return updateFeatures;
	}

	FieldTripMap.prototype._isArrowOnPath = function()
	{
		return this.pathLineType === PATH_LINE_TYPE.Sequence;
	}

	//#endregion

	//#region - Computing Methods

	FieldTripMap.prototype._computeRoutePath = function(routeResult)
	{
		const route = routeResult?.route,
		 	paths = route?.geometry?.paths; 
		return paths;
	}

	FieldTripMap.prototype._computePathAttributes = function(fieldTrip, routeResult)
	{
		const Color = this._getColor(fieldTrip),
			{ DBID, FieldTripId } = this._extractFieldTripFeatureFields(fieldTrip),
			route = routeResult?.route,
			attributes = Object.assign({}, route?.attributes, {DBID, FieldTripId, Color});
		return attributes;
	}

	FieldTripMap.prototype._computePathSymbol = function(fieldTrip)
	{
		const color = fieldTrip.color;
		return this.symbol.tripPath(color);
	}

	FieldTripMap.prototype._computeSequenceLine = function(fieldTrip)
	{
		const paths = [];

		if (fieldTrip.FieldTripStops.length === 0)
		{
			paths.push([fieldTrip.SchoolXCoord, fieldTrip.SchoolYCoord]);
			paths.push([fieldTrip.FieldTripDestinationXCoord, fieldTrip.FieldTripDestinationYCoord]);
		}
		else
		{
			const fieldTripStops = fieldTrip.FieldTripStops;
			for (let i = 0; i < fieldTripStops.length; i++)
			{
				const stop = fieldTripStops[i];
				paths.push([stop.XCoord, stop.YCoord]);
			}
		}

		return paths;
	}

	FieldTripMap.prototype._computeDirections = function(routeResult)
	{
		const { features, routeName, strings, totalDriveTime, totalLength, totalTime } = routeResult.directions;
		const routeDirections = { features, routeName, strings, totalDriveTime, totalLength, totalTime };
		return routeDirections;
	}

	//#endregion

	//#endregion

	//#region Routing

	FieldTripMap.prototype.calculateRoute = async function(fieldTrip)
	{
		try
		{
			return [await this.calculateRouteByStops(fieldTrip.FieldTripStops)];
		}
		catch (ex)
		{
			if(ex?.unlocatedStopNames?.length)
			{
				const indexList = ex?.unlocatedStopNames?.reduce(function(result, stopName){
					const index = fieldTrip.FieldTripStops.findIndex(x=>x.Street == stopName);
					const temp = [...result, index];
					return index >= 0 ? [...new Set(temp)] : result;
				}, []);
				indexList.sort((a,b) => a-b);

				tf.promiseBootbox.alert(`Cannot solve path. No solution found from Stop ${fieldTrip.FieldTripStops[indexList[0]].Sequence - 1} to Stop ${fieldTrip.FieldTripStops[indexList[0]].Sequence + 1}`)

				const chunks = [];
				for(let i = 0; i < indexList.length; i++)
				{
					const lowBound = i === 0 ? 0 : indexList[i-1];
					const highBound = indexList[i];
					chunks.push(fieldTrip.FieldTripStops.slice(lowBound, highBound));
					if(highBound + 1 <= fieldTrip.FieldTripStops.length -1)
					{
						chunks.push(fieldTrip.FieldTripStops.slice(highBound + 1));
					}
				}

				return await Promise.all(chunks.filter(c=>c,length>1).map(c=>this.calculateRouteByStops(c)));
			}
		}
	}

	FieldTripMap.prototype.calculateRouteByStops = async function(fieldTripStops)
	{
		const networkService = TF.GIS.Analysis.getInstance().networkService,
		stops = [], MIN_ROUTING_STOPS = 2;

		for (let i = 0; i < fieldTripStops.length; i++)
		{
			const stop = fieldTripStops[i];
			const stopObject = {
				curbApproach: stop.VehicleCurbApproach,
				name: stop.Street,
				sequence: stop.Sequence,
				longitude: stop.XCoord,
				latitude: stop.YCoord,
			}
			stops.push(stopObject);
		}

		if (stops.length < MIN_ROUTING_STOPS)
		{
			return null;
		}

		const stopFeatureSet = await networkService.createStopFeatureSet(stops);
		const params = {
			impedanceAttribute: null,
			stops: stopFeatureSet,
		};

		const response = await networkService.solveRoute(params);
		return response?.results?.routeResults[0];
	}

	//#endregion

	//#region Private Methods

	FieldTripMap.prototype._getStopFeatures = function()
	{
		return this.fieldTripStopLayerInstance?.getFeatures();
	}

	FieldTripMap.prototype._getPathFeatures = function()
	{
		return this.fieldTripPathLayerInstance?.layer.graphics.items || [];
	}

	FieldTripMap.prototype._getPathArrowFeatures = async function(condition = '1 = 1')
	{
		const queryResult = await this.fieldTripPathArrowLayerInstance?.queryFeatures(null, condition);
		return queryResult.features || [];
	}

	FieldTripMap.prototype._getSequenceLineFeatures = function()
	{
		return this.fieldTripSequenceLineLayerInstance?.layer.graphics.items || [];
	}

	FieldTripMap.prototype._getSequenceLineArrowFeatures = async function(condition = '1 = 1')
	{
		const queryResult = await this.fieldTripSequenceLineArrowLayerInstance?.queryFeatures(null, condition);
		return queryResult.features || [];
	}

	FieldTripMap.prototype._getColor = function(fieldTrip)
	{
		return fieldTrip.color;
	}

	FieldTripMap.prototype._sortBySequence = function(stops)
	{
		return stops.sort((a, b) => a.Sequence - b.Sequence);
	}

	FieldTripMap.prototype._queryMapFeatures = function(features, DBID, FieldTripId)
	{
		const results = [];
		for (let i = 0; i < features.length; i++)
		{
			const feature = features[i];
			if (feature.attributes.DBID === DBID &&
				feature.attributes.FieldTripId === FieldTripId)
			{
				results.push(feature);
			}
		}

		return results;
	}

	FieldTripMap.prototype._queryArrowFeatures = function(features, DBID, Id)
	{
		const results = [];
		for (let i = 0; i < features.length; i++)
		{
			const feature = features[i];
			if (feature.attributes.DBID === DBID &&
				feature.attributes.Id === Id)
			{
				results.push(feature);
			}
		}

		return results;
	}

	FieldTripMap.prototype._extractFieldTripFeatureFields = function(fieldTrip)
	{
		const DBID = fieldTrip.DBID,
			FieldTripId = fieldTrip.id;

		return { DBID, FieldTripId };
	}

	//#endregion

	FieldTripMap.prototype.dispose = function()
	{
		const self = this;

		if (self.arrowLayerHelper)
		{
			self.arrowLayerHelper.dispose();
			self.arrowLayerHelper = null;
		}

		if (self.fieldTripStopLayerInstance &&
			self.fieldTripPathLayerInstance &&
			self.fieldTripSequenceLineLayerInstance)
		{
			self.mapInstance.removeLayer(RoutingPalette_FieldTripStopLayerId);
			self.fieldTripStopLayerInstance = null;

			self.mapInstance.removeLayer(RoutingPalette_FieldTripPathLayerId);
			self.fieldTripPathLayerInstance = null;

			self.mapInstance.removeLayer(RoutingPalette_FieldTripSequenceLineLayerId);
			self.fieldTripSequenceLineLayerInstance = null;
		}

		if (self.fieldTripPathArrowLayerInstance && self.fieldTripSequenceLineArrowLayerInstance)
		{
			self.mapInstance.removeLayer(RoutingPalette_FieldTripPathArrowLayerId);
			self.fieldTripPathArrowLayerInstance = null;

			self.mapInstance.removeLayer(RoutingPalette_FieldTripSequenceLineArrowLayerId);
			self.fieldTripSequenceLineArrowLayerInstance = null;
		}

		PubSub.unsubscribe("GISLayer.StopLayer.MoveStopCompleted");
		PubSub.unsubscribe("GISLayer.StopLayer.MoveStopCompleted_UpdateDataModel");
	}

})();


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
	const RoutingPalette_FieldTripHighlightLayerId = "RoutingPalette_FieldTrip_HighlightLayer";
	const RoutingPalette_FieldTripHighlightLayer_Index = 4;
	const RoutingPalette_FieldTripSequenceLineLayerId = "RoutingPalette_FieldTrip_SequenceLineLayer";
	const RoutingPalette_FieldTripSequenceLineLayer_Index = 5;
	const RoutingPalette_FieldTripStopLayerId = "RoutingPalette_FieldTrip_StopLayer";
	const RoutingPalette_FieldTripStopLayer_Index = 6;

	const PATH_LINE_TYPE = {
		Path: "Path",
		Sequence: "Sequence"
	};
	const INFO_STOP_COLOR = "#FFFFFF";

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

		const totalLayerCount = 4;
		let layerCount = 0;
		const onLayerCreatedHandler = (resolve) => {
			layerCount++;
			if (layerCount === totalLayerCount)
			{
				resolve();
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
			if (self.fieldTripStopLayerInstance &&
				self.fieldTripPathLayerInstance &&
				self.fieldTripSequenceLineLayerInstance)
			{
				resolve();
			}

			self.fieldTripPathLayerInstance = new TF.GIS.Layer.PathLayer({
				id: RoutingPalette_FieldTripPathLayerId,
				index: RoutingPalette_FieldTripPathLayer_Index
			});
			addFieldTripMapLayer(self.fieldTripPathLayerInstance, resolve);
			self.defineReadOnlyProperty("fieldTripPathLayerInstance", self.fieldTripPathLayerInstance);

			self.fieldTripSequenceLineLayerInstance = new TF.GIS.Layer.PathLayer({
				id: RoutingPalette_FieldTripSequenceLineLayerId,
				index: RoutingPalette_FieldTripSequenceLineLayer_Index
			});
			addFieldTripMapLayer(self.fieldTripSequenceLineLayerInstance, resolve);
			self.defineReadOnlyProperty("fieldTripSequenceLineLayerInstance", self.fieldTripSequenceLineLayerInstance);

			self.fieldTripStopLayerInstance = new TF.GIS.Layer.StopLayer({
				id: RoutingPalette_FieldTripStopLayerId,
				index: RoutingPalette_FieldTripStopLayer_Index
			});
			addFieldTripMapLayer(self.fieldTripStopLayerInstance, resolve);
			self.defineReadOnlyProperty("fieldTripStopLayerInstance", self.fieldTripStopLayerInstance);

			self.fieldTripHighlightLayerInstance = new TF.GIS.Layer({
				id: RoutingPalette_FieldTripHighlightLayerId,
				index: RoutingPalette_FieldTripHighlightLayer_Index
			});
			addFieldTripMapLayer(self.fieldTripHighlightLayerInstance, resolve);
			self.defineReadOnlyProperty("fieldTripHighlightLayerInstance", self.fieldTripHighlightLayerInstance);
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

		this.drawStops(fieldTrip);

		await this.addFieldTripPath(fieldTrip);
	}

	FieldTripMap.prototype.addFieldTripPath = async function(fieldTrip, effectSequences)
	{
		await this.drawFieldTripPath(fieldTrip, effectSequences);

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

		this.setFieldTripHighlightLayerVisible(fieldTrips);
	}

	FieldTripMap.prototype.setFieldTripStopVisible = function(fieldTrips)
	{
		const stopFeatures = this._getStopFeatures();
		this._setFieldTripLayerVisible(fieldTrips, this.fieldTripStopLayerInstance, stopFeatures);
	}

	FieldTripMap.prototype.setFieldTripPathVisible = function(fieldTrips)
	{
		const pathFeatures = this._getPathFeatures();
		const precondition = this.pathLineType === PATH_LINE_TYPE.Path;
		this._setFieldTripLayerVisible(fieldTrips, this.fieldTripPathLayerInstance, pathFeatures, precondition);
	}

	FieldTripMap.prototype.setFieldTripSequenceLineVisible = function(fieldTrips)
	{
		const sequenceLineFeatures = this._getSequenceLineFeatures();
		const precondition = this.pathLineType === PATH_LINE_TYPE.Sequence;
		this._setFieldTripLayerVisible(fieldTrips, this.fieldTripSequenceLineLayerInstance, sequenceLineFeatures, precondition);
	}

	FieldTripMap.prototype.setFieldTripHighlightLayerVisible = function(fieldTrips)
	{
		const fieldTripHighlightFeatures = this._getHighlightFeatures();
		this._setFieldTripLayerVisible(fieldTrips, this.fieldTripHighlightLayerInstance, fieldTripHighlightFeatures);
	}

	FieldTripMap.prototype._setFieldTripLayerVisible = function(fieldTrips, layerInstance, layerFeatures, precondition = null)
	{
		for (let i = 0; i < fieldTrips.length; i++)
		{
			const fieldTrip = fieldTrips[i],
				{ DBID, FieldTripId } = this._extractFieldTripFeatureFields(fieldTrip),
				visible = (precondition === null) ? fieldTrip.visible : (precondition && fieldTrip.visible),
				features = this._queryMapFeatures(layerFeatures, DBID, FieldTripId),
				updateFeatures = features.filter(item => item.visible !== visible);

			if (updateFeatures.length > 0)
			{
				layerInstance.setFeaturesVisible(updateFeatures, visible);
			}
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
			sequenceLineFeatures = this._getSequenceLineFeatures(),
			fieldTripHighlightFeatures = this._getHighlightFeatures();

		const fieldTripStops = this._queryMapFeatures(stopFeatures, DBID, FieldTripId);
		// prevent update info stop symbol.
		const stops = fieldTripStops.filter(item => item.attributes.Color !== INFO_STOP_COLOR);
		this.fieldTripStopLayerInstance.updateColor(stops, color);

		const fieldTripPaths = this._queryMapFeatures(pathFeatures, DBID, FieldTripId);
		this.fieldTripPathLayerInstance.updateColor(fieldTripPaths, color);

		const fieldTripSequenceLines = this._queryMapFeatures(sequenceLineFeatures, DBID, FieldTripId);
		this.fieldTripSequenceLineLayerInstance.updateColor(fieldTripSequenceLines, color);

		const fieldTripHighlights = this._queryMapFeatures(fieldTripHighlightFeatures, DBID, FieldTripId);
		// prevent update highlight path symbol.
		const highlightLines = fieldTripHighlights.filter(item => item.geometry.type === "polyline" && item.symbol.color.a === 1);
		this.fieldTripSequenceLineLayerInstance.updateColor(highlightLines, color);

		// update path arrow color
		const condition = this._extractArrowCondition(DBID, FieldTripId);
		this._updatePathArrowFeatureColor(this.fieldTripPathArrowLayerInstance, condition, color);
		this._updatePathArrowFeatureColor(this.fieldTripSequenceLineArrowLayerInstance, condition, color);
		this.redrawFieldTripArrows([fieldTrip]);
	}

	FieldTripMap.prototype._updatePathArrowFeatureColor = function(layerInstance, condition, color)
	{
		const arrowOnPath = this._isArrowOnPath();
		const layerRenderer = layerInstance.layer.renderer.clone();
		const valueInfo = layerRenderer.uniqueValueInfos.filter(item => item.description === condition)[0];
		valueInfo.value = color;
		valueInfo.symbol = this.arrowLayerHelper.getArrowSymbol(arrowOnPath, color);

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

	//#region New Copy

	FieldTripMap.prototype.isNewCopy = function(fieldTrip)
	{
		return fieldTrip.Id === 0;
	}

	FieldTripMap.prototype.updateCopyFieldTripAttribute = function(fieldTrip)
	{
		if (fieldTrip.id !== fieldTrip.routePathAttributes.FieldTripId)
		{
			fieldTrip.routePathAttributes.FieldTripId = fieldTrip.id;
			fieldTrip.routePathAttributes.Color = fieldTrip.color;
		}
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

	//#region Refresh Field Trip Path

	FieldTripMap.prototype.refreshFieldTripPath = async function(fieldTrip, effectSequences)
	{
		this.clearFieldTripPath(fieldTrip);
		await this.clearFieldTripPathArrow(fieldTrip);

		this.clearSequenceLine(fieldTrip);
		await this.clearSequenceLineArrow(fieldTrip);

		await this.addFieldTripPath(fieldTrip, effectSequences);
	}

	FieldTripMap.prototype.clearFieldTripPath = function(fieldTrip)
	{
		const self = this,
			{ DBID, FieldTripId } = self._extractFieldTripFeatureFields(fieldTrip),
			pathFeatures = self._getPathFeatures(),
			fieldTripPaths = self._queryMapFeatures(pathFeatures, DBID, FieldTripId);
		
		for (let i = 0; i < fieldTripPaths.length; i++)
		{
			self.fieldTripPathLayerInstance.deletePath(fieldTripPaths[i]);
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
			self.fieldTripSequenceLineLayerInstance.deletePath(sequenceLines[i]);
		}
	}

	FieldTripMap.prototype.clearFieldTripPathArrow = async function(fieldTrip)
	{
		const self = this,
			{ DBID, FieldTripId } = self._extractFieldTripFeatureFields(fieldTrip),
			edits = {},
			condition = self._extractArrowCondition(DBID, FieldTripId);
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
			condition = self._extractArrowCondition(DBID, FieldTripId);
			deleteArrows = await self._getSequenceLineArrowFeatures(condition);

		if (deleteArrows.length >= 0)
		{
			edits.deleteFeatures = deleteArrows;
		}

		await self.fieldTripSequenceLineArrowLayerInstance.layer.applyEdits(edits);
	}

	//#endregion

	//#region RCM on Map

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
			{ longitude, latitude, Address, City } = data;

		if (Address !== "")
		{
			movingStop.Street = Address;
			movingStop.City = City;
		}
		movingStop.XCoord = +longitude.toFixed(6);
		movingStop.YCoord = +latitude.toFixed(6);

		const effectSequences = self._computeEffectSequences(fieldTrip, {moveStop: movingStop});

		self.refreshFieldTripPath(fieldTrip, effectSequences);
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
			PubSub.publish(TF.RoutingPalette.FieldTripMapEventEnum.MoveStopLocationCompleted, data);
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
					stop.symbol = self.fieldTripStopLayerInstance.getStopSymbol(attributes.Sequence, attributes.Color);
				}
			}
		}

		const data = { fieldTripStopId: stop.id };
		PubSub.publish(TF.RoutingPalette.FieldTripMapEventEnum.DeleteStopLocationCompleted, data);

		const effectSequences = self._computeEffectSequences(fieldTrip, {deleteStop: stop});

		self.refreshFieldTripPath(fieldTrip, effectSequences);
	}

	//#endregion

	//#region Stop Info

	FieldTripMap.prototype.addHighlightFeatures = async function(data)
	{
		const self = this;
		if (!self.fieldTripStopLayerInstance || !self.fieldTripPathLayerInstance)
		{
			return;
		}

		const vertex = [],
			stops = [],
			{ DBID, FieldTripId, Color, beforeStop, currentStop, afterStop} = data,
			stopObjects = [beforeStop, currentStop, afterStop].filter(item => item);

		stopObjects.forEach(stop =>
		{
			const { XCoord, YCoord, id } = stop,
				attributes = { DBID, FieldTripId, id },
				graphic = self.fieldTripStopLayerInstance.createHighlightStop(XCoord, YCoord, attributes);
			stops.push(graphic);

			vertex.push([XCoord, YCoord]);
		});

		let highlightGraphics = [];
		// add highlight sequence line
		const paths = [vertex],
			pathAttributes = { DBID, FieldTripId, Color },
			basePathGraphic = self.fieldTripPathLayerInstance.createHighlightPath(paths, pathAttributes);
		highlightGraphics.push(basePathGraphic);

		const topPathGraphic = self.fieldTripPathLayerInstance.createPath(paths, pathAttributes);
		highlightGraphics.push(topPathGraphic);

		// add highlight stop
		highlightGraphics = highlightGraphics.concat(stops);

		self.fieldTripHighlightLayerInstance.addMany(highlightGraphics);

		// update currentStop color
		const fieldTripStops = self._getStopFeatures(),
			features = fieldTripStops.filter(item =>
				item.attributes.DBID === DBID &&
				item.attributes.FieldTripId === FieldTripId),
			currentStopFeature = features.find(item => item.attributes.Sequence === currentStop.Sequence);
		self.fieldTripStopLayerInstance.updateColor([currentStopFeature], INFO_STOP_COLOR);
	}

	FieldTripMap.prototype.clearHighlightFeatures = async function(fieldTrip = null)
	{
		const self = this;
		if (!self.fieldTripHighlightLayerInstance)
		{
			return;
		}

		await self.fieldTripHighlightLayerInstance.clearLayer();

		if (fieldTrip)
		{
			const color = fieldTrip.color,
				fieldTripStops = self._getStopFeatures(),
				features = fieldTripStops.filter(item =>
					item.attributes.DBID === fieldTrip.DBID &&
					item.attributes.FieldTripId === fieldTrip.id),
				currentStopFeature = features.find(item => item.attributes.Color !== fieldTrip.color);

			if (currentStopFeature)
			{
				self.fieldTripStopLayerInstance.updateColor([currentStopFeature], color);
			}
		}
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
					return { DBID: stop.attributes.DBID, FieldTripId: stop.attributes.FieldTripId, id: stop.attributes.id, Sequence: stop.attributes.Sequence };
				});

				const dataWrapper = {
					data: data,
					event: event
				};

				console.log(dataWrapper);
				PubSub.publish(TF.RoutingPalette.FieldTripMapEventEnum.FieldTripStopClick, dataWrapper);
			}
		}
	}

	//#endregion

	//#endregion

	//#region Map Visualization

	FieldTripMap.prototype.drawStops = function(fieldTrip)
	{
		const self = this,
		 	color = self._getColor(fieldTrip),
			Color = color,
			{ DBID, FieldTripId } = this._extractFieldTripFeatureFields(fieldTrip);

		let Sequence = null, Name = null, CurbApproach = 0, attributes = null, id = 0;
		if (fieldTrip.FieldTripStops.length === 0)
		{
			Sequence = 1;
			id = TF.createId();
			Name = fieldTrip.SchoolName;
			attributes = {DBID, FieldTripId, id, Name, CurbApproach, Sequence, Color};
			const school = self.fieldTripStopLayerInstance?.createStop(fieldTrip.SchoolXCoord, fieldTrip.SchoolYCoord, attributes);

			Sequence = 2;
			id = TF.createId();
			Name = fieldTrip.Destination;
			attributes = {DBID, FieldTripId, id, Name, CurbApproach, Sequence, Color};
			const destination = self.fieldTripStopLayerInstance?.createStop(fieldTrip.FieldTripDestinationXCoord, fieldTrip.FieldTripDestinationYCoord, attributes);

			self.fieldTripStopLayerInstance?.addStops([destination, school]);
		}
		else
		{
			const fieldTripStops = fieldTrip.FieldTripStops;
			const graphics = [];
			for (let i = fieldTripStops.length - 1; i >= 0; i--)
			{
				const stop = fieldTripStops[i];
				id = stop.id;
				Name = stop.Street;
				Sequence = stop.Sequence;
				CurbApproach = stop.vehicleCurbApproach;
				attributes = {DBID, FieldTripId, id, Name, CurbApproach, Sequence, Color};
				graphics.push(self.fieldTripStopLayerInstance?.createStop(stop.XCoord, stop.YCoord, attributes));
			}

			self.fieldTripStopLayerInstance?.addStops(graphics);
		}
	}

	FieldTripMap.prototype.drawFieldTripPath = async function(fieldTrip, effectSequences)
	{
		const routePath = await this._updateRoutepathAndDirection(fieldTrip, effectSequences);
		
		if (!routePath)
		{
			return;
		}

		if (!fieldTrip.routePathAttributes)
		{
			fieldTrip.routePathAttributes = this._computePathAttributes(fieldTrip, null);
		}

		if (this.isNewCopy(fieldTrip))
		{
			this.updateCopyFieldTripAttribute(fieldTrip);
		}

		const pathAttributes = fieldTrip.routePathAttributes;
		const graphic = this.fieldTripPathLayerInstance?.createPath(routePath, pathAttributes);
		// hide by default for UX.
		this.fieldTripPathLayerInstance?.setFeaturesVisible([graphic], false);
		this.fieldTripPathLayerInstance?.addPath(graphic);
	}

	FieldTripMap.prototype.drawSequenceLine = function(fieldTrip, afterAdd = null)
	{
		const sequenceLine = this._computeSequenceLine(fieldTrip);
		const Color = this._getColor(fieldTrip),
			{ DBID, FieldTripId } = this._extractFieldTripFeatureFields(fieldTrip),
			attributes = { DBID, FieldTripId, Color };

		const graphic = this.fieldTripSequenceLineLayerInstance?.createPath(sequenceLine, attributes);
		// hide by default for UX.
		this.fieldTripSequenceLineLayerInstance?.setFeaturesVisible([graphic], false);
		this.fieldTripSequenceLineLayerInstance?.addPath(graphic, afterAdd);
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
				description = this._extractArrowCondition(fieldTrip.DBID, fieldTrip.id),
				symbol = this.arrowLayerHelper.getArrowSymbol(arrowOnPath, value);
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
			pathFeature = pathFeatures.filter(feature => feature.attributes.DBID === fieldTrip.DBID && feature.attributes.FieldTripId === fieldTrip.id)[0],
			arrows = self._computeArrowFeatures(pathFeature);

		const edits = {};
		const condition = self._extractArrowCondition(fieldTrip.DBID, fieldTrip.id);
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
			lineFeature = sequenceLineFeatures.filter(feature => feature.attributes.DBID === fieldTrip.DBID && feature.attributes.FieldTripId === fieldTrip.id)[0],
			arrows = self._computeArrowFeatures(lineFeature);

		const edits = {};
		const condition = self._extractArrowCondition(fieldTrip.DBID, fieldTrip.id);
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
			// hide by default for UX.
			graphic.visible = false;
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

	FieldTripMap.prototype._extractArrowCondition = function(DBID, fieldTripId)
	{
		return `DBID = ${DBID} and id = ${fieldTripId}`;
	}

	//#endregion

	//#region - Computing Methods

	FieldTripMap.prototype._computeRoutePath = function(routeResult)
	{
		const route = routeResult?.route,
		 	paths = route?.geometry?.paths; 
		return paths;
	}

	FieldTripMap.prototype._computeEffectSequences = function(fieldTrip, {moveStop, deleteStop} = {})
	{
		let effectSequences = [];

		if (moveStop)
		{	
			effectSequences = fieldTrip.FieldTripStops.filter(stop => stop.Sequence >= moveStop.Sequence - 1 && stop.Sequence <= moveStop.Sequence + 1)
													  .map(stop => stop.Sequence);
		}
		else if(deleteStop)
		{
			effectSequences = fieldTrip.FieldTripStops.filter(stop => stop.Sequence == deleteStop.Sequence - 1 || stop.Sequence == deleteStop.Sequence)
												      .map(stop => stop.Sequence);
		}

		return effectSequences;
	}

	
	FieldTripMap.prototype._updateRoutepathAndDirection = async function(fieldTrip, effectSequences)
	{
		if (!fieldTrip.routePath)
		{
			let routeResults = [];
			let effectedStops = [];

			effectedStops = this._getEffectStops(fieldTrip, effectSequences);

			routeResults = await this.calculateRouteByStops(effectedStops, true);

			if (!Array.isArray(routeResults)) 
			{
				routeResults = [routeResults];
			}
			
			if(!routeResults)
			{
				console.error("routeResults is empty, the FieldTripStops is ->", effectedStops);
				return;
			}

			routeResults = routeResults.filter(routeResult => !!routeResult);

			if (routeResults.length > 0)
			{
				routeResults.forEach(routeResult => {
					fieldTrip.routePath = [...(fieldTrip.routePath||[]), ...this._computeRoutePath(routeResult)];
					fieldTrip.routePathAttributes = this._computePathAttributes(fieldTrip, routeResult);
	
					if (!fieldTrip.directions) 
					{
						fieldTrip.directions = [this._computeDirections(routeResult)];
					}
					else
					{
						const directions = this._computeDirections(routeResult);
						fieldTrip.directions.push(directions);
					}

					this._computeRoutePathForStop(effectedStops, routeResult);
					this._computeDirectionsForStop(effectedStops, routeResult);
				});
			}
			else
			{
				// if there is unsolved path, clear the changed stop's original path data
				this._clearRoutePathForStop(effectedStops); 
			}

			const data = { fieldTrip };

			PubSub.publish(TF.RoutingPalette.FieldTripMapEventEnum.DirectionUpdated, data);
		}

		let routePath = fieldTrip.FieldTripStops.filter(stop => !!stop._geoPath)
												.map(stop => stop._geoPath);

		return routePath;
	}
	
	FieldTripMap.prototype._getEffectStops = function(fieldTrip, effectSequences)
	{
		let effectedStops = [];
		if (!effectSequences)
		{
			effectedStops = fieldTrip.FieldTripStops;
		}
		else
		{
			effectedStops = fieldTrip.FieldTripStops.filter(stop => effectSequences.includes(stop.Sequence));
		}

		return effectedStops;
	}

	FieldTripMap.prototype._swapAttributeForStop = function(fieldTripStops, routeResult)
	{
		const stops = routeResult?.stops;

		stops.forEach(stop => {
			const matchedStop = fieldTripStops.find(originalStop => originalStop.Sequence == stop.attributes.Name);

			stop.attributes.OriginalSequence = stop.attributes.Name;

			stop.attributes.Name = matchedStop.Street;
		});
	}

	FieldTripMap.prototype._computeRoutePathForStop = function(changedStops, routeResult)
	{
		const route = routeResult?.route,
		 	paths = route?.geometry?.paths,
			stops = routeResult?.stops;

		paths.forEach((path, index) => {
			const sequence = stops[index].attributes.OriginalSequence;
			const matchedStop = changedStops.find(stop => stop.Sequence == sequence);

			matchedStop._geoPath = path;
		});
	}

	FieldTripMap.prototype._clearRoutePathForStop = function(changedStops)
	{
		for(var i = 0; i < changedStops.length - 1; i++)
		{
			changedStops[i]._geoPath = null;
		}
	}

	FieldTripMap.prototype._computeDirectionsForStop = function(changedStops, routeResult)
	{
		const { features, routeName, strings, totalDriveTime, totalLength, totalTime } = routeResult.directions;
		const routeDirections = { features, routeName, strings, totalDriveTime, totalLength, totalTime };
		const stops = routeResult?.stops;

		// TODO: extract directions for changed stops
	}	

	FieldTripMap.prototype._computePathAttributes = function(fieldTrip, routeResult)
	{
		const Color = this._getColor(fieldTrip),
			{ DBID, FieldTripId } = this._extractFieldTripFeatureFields(fieldTrip),
			route = routeResult?.route,
			attributes = Object.assign({}, route?.attributes, {DBID, FieldTripId, Color});
		return attributes;
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
			return this.calculateRouteErrorHandler(ex, fieldTrip.FieldTripStops);
		}
	}

	FieldTripMap.prototype.calculateRouteByStops = async function(fieldTripStops, needErrorHandler = false)
	{
		const networkService = TF.GIS.Analysis.getInstance().networkService,
		stops = [], MIN_ROUTING_STOPS = 2;

		for (let i = 0; i < fieldTripStops.length; i++)
		{
			const stop = fieldTripStops[i];
			const stopObject = {
				curbApproach: stop.vehicleCurbApproach,
				name: stop.Sequence,
				sequence: stop.Sequence,
				longitude: stop.XCoord,
				latitude: stop.YCoord,
			};
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

		if(needErrorHandler)
		{
			try
			{
				const response = await networkService.solveRoute(params);
				const result = response?.results?.routeResults[0];
		
				this._swapAttributeForStop(fieldTripStops, result);

				return result;
			}
			catch(ex)
			{
				return this.calculateRouteErrorHandler(ex, fieldTripStops);
			}
		}
		else
		{
			const response = await networkService.solveRoute(params);
			const result = response?.results?.routeResults[0];
	
			this._swapAttributeForStop(fieldTripStops, result);

			return result;
		}
	}

	FieldTripMap.prototype.calculateRouteErrorHandler = async function(ex, fieldTripStops)
	{
		const self = this;

		if(ex?.unlocatedStopNames?.length)
		{
			const indexList = ex?.unlocatedStopNames?.reduce(function(result, stopName){
				const index = fieldTripStops.findIndex(x=>x.Sequence == stopName);
				const temp = [...result, index];
				return index >= 0 ? [...new Set(temp)] : result;
			}, []);
			indexList.sort((a,b) => a-b);

			const [minSequence, maxSequence] = fieldTripStops.reduce(function([min, max], current)
			{
				return [Math.min(min, current.Sequence), Math.max(max, current.Sequence)];
			},[Number.MAX_SAFE_INTEGER, 0]);

			tf.promiseBootbox.alert(`Cannot solve path. No solution found from Stop ${Math.max(fieldTripStops[indexList[0]].Sequence - 1,minSequence)} to Stop ${Math.min(maxSequence,fieldTripStops[indexList[0]].Sequence + 1)}`)

			const chunks = [];
			for(let i = 0; i < indexList.length; i++)
			{
				const lowBound = i === 0 ? 0 : indexList[i-1];
				const highBound = indexList[i];
				chunks.push(fieldTripStops.slice(lowBound, highBound));
				if(highBound + 1 <= fieldTripStops.length -1)
				{
					chunks.push(fieldTripStops.slice(highBound + 1));
				}
			}

			return await Promise.all(chunks.filter(c=>c,length>1).map(c=>this.calculateRouteByStops(c)));
		}
		else
		{
			tf.promiseBootbox.alert(`Cannot solve path. One or more of your stops is invalid or unreachable.`);
		}
	}

	//#endregion

	//#region Private Methods

	FieldTripMap.prototype._getStopFeatures = function()
	{
		return this.fieldTripStopLayerInstance?.getFeatures();
	}

	FieldTripMap.prototype._getPathFeatures = function()
	{
		return this.fieldTripPathLayerInstance?.getFeatures();
	}

	FieldTripMap.prototype._getHighlightFeatures = function()
	{
		return this.fieldTripHighlightLayerInstance?.getFeatures();
	}

	FieldTripMap.prototype._getPathArrowFeatures = async function(condition = '1 = 1')
	{
		const queryResult = await this.fieldTripPathArrowLayerInstance?.queryFeatures(null, condition);
		return queryResult.features || [];
	}

	FieldTripMap.prototype._getSequenceLineFeatures = function()
	{
		return this.fieldTripSequenceLineLayerInstance?.getFeatures();
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

			self.mapInstance.removeLayer(RoutingPalette_FieldTripHighlightLayerId);
			self.fieldTripHighlightLayerInstance = null;
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

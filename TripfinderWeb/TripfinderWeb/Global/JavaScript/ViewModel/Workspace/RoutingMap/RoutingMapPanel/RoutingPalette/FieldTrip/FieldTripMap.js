
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

	function FieldTripMap(mapInstance, drawTool)
	{
		if (!mapInstance)
		{
			console.error("FieldTripMap constructor failed! No valid mapInstance.");
			return;
		}

		this.stopTool = drawTool.stopTool;
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
				this.updateFieldTripPathVisibility([fieldTrip]);
	
				if (fieldTrip.visible === false)
				{
					// the Field Trips are hidden.
					this.setFieldTripVisibility([fieldTrip]);
				}

				resolve();
			});
		});
	}

	//#endregion

	//#region - Show / Hide Layers

	FieldTripMap.prototype.setFieldTripVisibility = async function(fieldTrips)
	{
		this.setFieldTripStopVisibility(fieldTrips);

		this.setFieldTripPathVisibility(fieldTrips);
		await this.setFieldTripPathArrowVisibility(fieldTrips);

		this.setFieldTripSequenceLineVisibility(fieldTrips);
		await this.setFieldTripSequenceLineArrowVisibility(fieldTrips);

		this.setFieldTripHighlightLayerVisibility(fieldTrips);
	}

	FieldTripMap.prototype.setFieldTripStopVisibility = function(fieldTrips)
	{
		const stopFeatures = this._getStopFeatures();
		this._setFieldTripLayerVisibility(fieldTrips, this.fieldTripStopLayerInstance, stopFeatures);
	}

	FieldTripMap.prototype.setFieldTripPathVisibility = function(fieldTrips)
	{
		const pathFeatures = this._getPathFeatures();
		const precondition = this.pathLineType === PATH_LINE_TYPE.Path;
		this._setFieldTripLayerVisibility(fieldTrips, this.fieldTripPathLayerInstance, pathFeatures, precondition);
	}

	FieldTripMap.prototype.setFieldTripSequenceLineVisibility = function(fieldTrips)
	{
		const sequenceLineFeatures = this._getSequenceLineFeatures();
		const precondition = this.pathLineType === PATH_LINE_TYPE.Sequence;
		this._setFieldTripLayerVisibility(fieldTrips, this.fieldTripSequenceLineLayerInstance, sequenceLineFeatures, precondition);
	}

	FieldTripMap.prototype.setFieldTripHighlightLayerVisibility = function(fieldTrips)
	{
		const fieldTripHighlightFeatures = this._getHighlightFeatures();
		this._setFieldTripLayerVisibility(fieldTrips, this.fieldTripHighlightLayerInstance, fieldTripHighlightFeatures);
	}

	FieldTripMap.prototype._setFieldTripLayerVisibility = function(fieldTrips, layerInstance, layerFeatures, precondition = null)
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
				layerInstance.setFeaturesVisibility(updateFeatures, visible);
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

	FieldTripMap.prototype.updateFieldTripPathVisibility = async function(fieldTrips)
	{
		this.updateArrowRenderer(fieldTrips);
		await this.redrawFieldTripArrows(fieldTrips);

		this.setFieldTripPathVisibility(fieldTrips);
		this.setFieldTripSequenceLineVisibility(fieldTrips);
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

	FieldTripMap.prototype.onStopLayerMoveStopCompleted = async function(_, data)
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

		await self.refreshFieldTripPath(fieldTrip, effectSequences);

		if (tf.loadingIndicator)
		{
			tf.loadingIndicator.tryHide();
		}
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

		if (tf.loadingIndicator)
		{
			tf.loadingIndicator.showImmediately();
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

		await self.refreshFieldTripPath(fieldTrip, effectSequences);

		if (tf.loadingIndicator)
		{
			tf.loadingIndicator.tryHide();
		}
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
			const fieldTripStops = self._getStopFeatures(),
				highlightStopFeature = fieldTripStops.find(item => item.attributes.Color === INFO_STOP_COLOR);
			if (highlightStopFeature)
			{
				const fieldTripId = highlightStopFeature.attributes.FieldTripId,
					fieldTripPaths = self._getPathFeatures(),
					highlightPathFeature = fieldTripPaths.find(item => item.attributes.FieldTripId === fieldTripId);

				if (highlightPathFeature)
				{
					const color = highlightPathFeature.attributes.Color;
					self.fieldTripStopLayerInstance.updateColor([highlightStopFeature], color);
				}
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
		this.fieldTripPathLayerInstance?.setFeaturesVisibility([graphic], false);
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
		this.fieldTripSequenceLineLayerInstance?.setFeaturesVisibility([graphic], false);
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

		await this.setFieldTripPathArrowVisibility(fieldTrips);
		await this.setFieldTripSequenceLineArrowVisibility(fieldTrips);
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

	FieldTripMap.prototype.setFieldTripPathArrowVisibility = async function(fieldTrips)
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

	FieldTripMap.prototype.setFieldTripSequenceLineArrowVisibility = async function(fieldTrips)
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
			let effectedStops = this._getEffectStops(fieldTrip, effectSequences);
			await this.calculateRouteByStops(fieldTrip, effectedStops);

			const data = { fieldTrip };

			PubSub.publish(TF.RoutingPalette.FieldTripMapEventEnum.DirectionUpdated, data);
		}

		let routePath = fieldTrip.FieldTripStops.filter(stop => !!stop._geoPath)
												.map(stop => stop._geoPath.paths);
		routePath = _.flatMap(routePath);
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

	FieldTripMap.prototype._clearRoutePathForStop = function(changedStops)
	{
		for(var i = 0; i < changedStops.length - 1; i++)
		{
			changedStops[i]._geoPath = null;
		}
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

	FieldTripMap.prototype.calculateRouteByStops = async function(fieldTrip, fieldTripStops)
	{
		const MIN_ROUTING_STOPS = 2;
		if (fieldTripStops.length < MIN_ROUTING_STOPS)
		{
			return null;
		}

		const self = this, networkService = TF.GIS.Analysis.getInstance().networkService;
		const stops = self.createStopObjects(fieldTripStops);
		const stopFeatureSet = await networkService.createStopFeatureSet(stops);
		const params = self.createRouteParams(stopFeatureSet);

		let response = null;
		try
		{
			response = await networkService.solveRoute(params);
		}
		catch(err)
		{
			if (err.details.messages && err.details.messages.length > 0)
			{
				if (err.details.messages[0].indexOf("No solution found.") > -1 || err.details.messages[0].indexOf("Invalid locations detected") > -1)
				{
					return self.refreshTripByStopsSeperately(fieldTrip, fieldTripStops, networkService).then(function(tripStops)
					{
						let errorMessage = tripStops.reduce(({message, findInvalidStop}, stop, index, array) =>
						{
							const isTerminalStop = _.last(array) == stop;
							if (!findInvalidStop)
							{
								if (!stop._geoPath && !isTerminalStop)
								{
									message += ` No solution found from Stop ${stop.Sequence}`
									return { message, findInvalidStop: true };
								}
							}
							else if (findInvalidStop && (stop._geoPath || isTerminalStop))
							{
								message +=` to Stop ${ stop.Sequence }.`
								return { message, findInvalidStop: false};
							}

							return { message, findInvalidStop };
						}, { message: "Cannot solve path.", findInvalidStop: false});

						tf.promiseBootbox.alert(errorMessage);
						return tripStops;
					});
				}
			}

			tf.promiseBootbox.alert(`Cannot solve path. One or more of your stops is invalid or unreachable.`);
			return Promise.resolve();
		}

		const result = response?.results?.routeResults[0];
		var pathSegments = this._createPathSegments(response?.results);
		fieldTripStops = this._createTripStops(fieldTrip, fieldTripStops, pathSegments);
		this._swapAttributeForStop(fieldTripStops, result);

		return fieldTripStops;
	}

	FieldTripMap.prototype.createStopObjects = function(fieldTripStops)
	{
		const stops = [];

		for (let i = 0; i < fieldTripStops.length; i++)
		{
			const stop = fieldTripStops[i];
			const routeStop = {
				curbApproach: stop.vehicleCurbApproach,
				name: stop.Sequence,
				sequence: stop.Sequence,
				longitude: stop.XCoord,
				latitude: stop.YCoord,
			};
			stops.push(routeStop);
		}

		return stops;
	}

	FieldTripMap.prototype.createRouteParams = function(stopFeatureSet)
	{
		return {
			impedanceAttribute: null,
			preserveFirstStop: true,
			preserveLastStop: true,
			stops: stopFeatureSet
		};
	};

	FieldTripMap.prototype._isLastStop = function(trip, stop, allStops)
	{
		if (!trip)
		{
			return stop.Sequence === allStops.length;
		}
		return trip.FieldTripStops.length === stop.Sequence;
	};

	//if refresh path fail, will solve path one by one for each stop
	FieldTripMap.prototype.refreshTripByStopsSeperately = function(trip, tripStops, networkService)
	{
		var self = this,
			index = 0,
			resolve = null,
			errMessage = null,
			promise = new Promise(function(solve) { resolve = solve; });

		function solveRequest()
		{
			if (index < tripStops.length - 1)
			{
				var stops = self.createStopObjects([tripStops[index], tripStops[index + 1]]);
				var createStopsPromise = networkService.createStopFeatureSet(stops);
				let beforeStop = tripStops[index - 1] ? tripStops[index - 1] : self._getBeforeStop(trip, tripStops[index]);
				var vertexPromise = self._getVertexesCloseToStopOnPathSeperately(beforeStop, tripStops[index], networkService);
				return Promise.all([createStopsPromise, vertexPromise]).then(function(res)
				{
					var stopFeatureSet = res[0];
					var vertexFeatureSet = res[1];
					var vertex = null;
					if (vertexFeatureSet  && vertexFeatureSet.features && vertexFeatureSet.features[0])
					{
						vertex = vertexFeatureSet.features[0];
						stopFeatureSet.features.unshift(vertex);
					}
					const params = self.createRouteParams(stopFeatureSet);
					return networkService.solveRoute(params).then(function(res)
					{
						var result = res.results;
						if (!result.routeResults)
						{
							tripStops[index]._geoPath = null;
						} else
						{
							var pathSegments = self._createPathSegments(result);
							pathSegments = self._updatePathSegments(pathSegments, [vertex, null]);
							tripStops[index] = self._createTripStops(trip, [tripStops[index]], pathSegments)[0];
						}
						index++;
						solveRequest();
						return promise;
					}, function(err)
					{
						errMessage = err;
						tripStops[index]._geoPath = null;
						tripStops[index].Distance = 0;
						tripStops[index].DrivingDirections = "";
						tripStops[index].Speed = 0;
						index++;
						solveRequest();
						return promise;
					});
				});
			}
			else
			{
				return resolve(tripStops);
			}
		}
		return solveRequest();
	}

	FieldTripMap.prototype._updatePathSegments = function(pathSegments, vertexes)
	{
		if (vertexes && vertexes[0] && vertexes[0].geometry)
		{
			var firstSegmentGeom = tf.map.ArcGIS.geometryEngine.simplify(pathSegments[0].geometry);
			if (firstSegmentGeom && firstSegmentGeom.paths[0].length > 2 && pathSegments[0] && pathSegments[1])
			{
				firstSegmentGeom.removePoint(0, 0);
				var allPoints = [];
				firstSegmentGeom.paths.forEach(function(path)
				{
					allPoints = allPoints.concat(path);
				});
				pathSegments[1].geometry.paths[0] = allPoints.concat(pathSegments[1].geometry.paths[0]);
				pathSegments[1].length = parseFloat(pathSegments[0].length) + parseFloat(pathSegments[1].length);
				pathSegments[1].time = parseFloat(pathSegments[0].time) + parseFloat(pathSegments[1].time);
			}
			pathSegments = pathSegments.slice(1, pathSegments.length);
		}
		if (vertexes && vertexes[1] && vertexes[1].geometry)
		{
			var lastSegmentGeom = tf.map.ArcGIS.geometryEngine.simplify(pathSegments[pathSegments.length - 1].geometry);
			if (lastSegmentGeom && lastSegmentGeom.paths[0].length > 2 && pathSegments[pathSegments.length - 2] && pathSegments[pathSegments.length - 1])
			{
				lastSegmentGeom.removePoint(0, lastSegmentGeom.paths[0].length - 1);
				lastSegmentGeom.paths.forEach(function(path)
				{
					pathSegments[pathSegments.length - 2].geometry.paths[0] = pathSegments[pathSegments.length - 2].geometry.paths[0].concat(path);
				});
				pathSegments[pathSegments.length - 2].length = parseFloat(pathSegments[pathSegments.length - 2].length) + parseFloat(pathSegments[pathSegments.length - 1].length);
				pathSegments[pathSegments.length - 2].time = parseFloat(pathSegments[pathSegments.length - 2].time) + parseFloat(pathSegments[pathSegments.length - 1].time);
			}
			pathSegments = pathSegments.slice(0, pathSegments.length - 1);
		}
		return pathSegments;
	}

	FieldTripMap.prototype._getBeforeStop = function(trip, tripStop)
	{
		var beforeStops = trip.FieldTripStops.filter(s => s.Sequence < tripStop.Sequence);
		return beforeStops[beforeStops.length - 1];
	}

	FieldTripMap.prototype._getVertexesCloseToStopOnPathSeperately = function(beforeStop, afterStop, networkService)
	{
		var self = this, vertex = null;
		vertex = getPrevVertex();
		return Promise.resolve(vertex);

		function getPrevVertex()
		{
			if (beforeStop)
			{
				var prevPath = beforeStop._geoPath;
				if (!prevPath)
				{
					return null;
				}
				return self._findVertexToStopOnPath(prevPath, afterStop, networkService);
			}
			return null;
		}
	}

	FieldTripMap.prototype._findVertexToStopOnPath = function(path, stop, networkService)
	{
		var self = this;
		if (!path || !path.paths || !path.paths[0] || !path.paths[0][0]) return;
		path = tf.map.ArcGIS.webMercatorUtils.geographicToWebMercator(TF.cloneGeometry(path));
		var point = TF.xyToGeometry(stop.XCoord, stop.YCoord);
		var startPoint = path.paths[0][0];
		var distance1 = Math.sqrt((startPoint[0] - point.x) * (startPoint[0] - point.x) + (startPoint[1] - point.y) * (startPoint[1] - point.y));
		var endIndex = path.paths[0].length - 1;
		var endPoint = path.paths[0][endIndex];
		var distance2 = Math.sqrt((endPoint[0] - point.x) * (endPoint[0] - point.x) + (endPoint[1] - point.y) * (endPoint[1] - point.y));
		var vertexGeom = self.stopTool._getPointOnPolylineByDistanceToPoint(path, 3, distance1 < distance2);
		var location = tf.map.ArcGIS.webMercatorUtils.webMercatorToGeographic(vertexGeom);

		const stopObject = {
			curbApproach: stop.vehicleCurbApproach,
			name: stop.Sequence,
			sequence: stop.Sequence,
			longitude: location.x,
			latitude: location.y,
		};
		return networkService.createStopFeatureSet([stopObject]);
	}

	FieldTripMap.prototype._createPathSegments = function(result)
	{
		var self = this, pathSegments = [];
		var stopToStopPathGeometry = new tf.map.ArcGIS.Polyline({ spatialReference: { wkid: 102100 } });
		var stopToStopPathDirections = "";
		stopToStopPathGeometry.paths = [
			[]
		];
		var stopToStopPathLength = 0;
		var stopToStopPathTime = 0;
		if (result && result.routeResults)
		{
			result.routeResults[0].directions.features.forEach(function(feature)
			{
				if (feature.attributes.maneuverType == "esriDMTStop")
				{
					pathSegments.push({
						geometry: TF.cloneGeometry(stopToStopPathGeometry),
						length: stopToStopPathLength.toString(),
						time: stopToStopPathTime.toString(),
						direction: stopToStopPathDirections
					});
					stopToStopPathGeometry.paths[0] = [];
					stopToStopPathLength = 0;
					stopToStopPathTime = 0;
					stopToStopPathDirections = "";
				}

				if (feature.attributes.maneuverType == "railroadStop")
				{
					stopToStopPathDirections += "WARNING CROSS OVER RAILROAD.\n";
				}
				else if (feature.attributes.maneuverType != "esriDMTDepart" && feature.attributes.maneuverType != "esriDMTStop")
				{
					stopToStopPathDirections += feature.attributes.text + " " + feature.attributes.length.toFixed(2) + " km. \n";
				}
				stopToStopPathGeometry.paths[0] = stopToStopPathGeometry.paths[0].concat(feature.geometry.paths[0]);
				stopToStopPathLength += feature.attributes.length;
				stopToStopPathTime += feature.attributes.time;
			});
		}
		else
		{
			pathSegments.push({
				geometry: new self._arcgis.Polyline(self._map.mapView.spatialReference).addPath([])
			});
		}
		return pathSegments;
	}

	FieldTripMap.prototype._createTripStops = function(fieldTrip, tripStops, pathSegments)
	{
		var self = this;
		tripStops.forEach(function(stop, index)
		{
			if (pathSegments[index] && !stop.failedStop)
			{
				stop.DrivingDirections = pathSegments[index].direction;
				stop.RouteDrivingDirections = stop.DrivingDirections;
				stop.IsCustomDirection = false;
				stop.Speed = (pathSegments[index].time && pathSegments[index].time != 0) ? (pathSegments[index].length / pathSegments[index].time) * 60 : 0;
				stop.StreetSpeed = stop.Speed;
				stop.Distance = pathSegments[index].length ? pathSegments[index].length * 1 : -1;
				stop._geoPath = pathSegments[index].geometry;
			} else if (stop.failedStop || self._isLastStop(fieldTrip, stop, tripStops))
			{
				stop.path = {};
				stop.Distance = 0;
				stop.Speed = 0;
				stop.DrivingDirections = "";
			}
		});
		return tripStops;
	};

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


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
	const RoutingPalette_FieldTripHighlightStopLayerId = "RoutingPalette_FieldTrip_HighlightStopLayer";
	const RoutingPalette_FieldTripHighlightStopLayer_Index = 8;

	const PATH_LINE_TYPE = {
		Path: "Path",
		Sequence: "Sequence"
	};
	const INFO_STOP_COLOR = "#FFFFFF";
	const FIELD_TRIP_LAYER_TYPE = {
		PATH: "PathLayer",
		STOP: "StopLayer"
	};

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
		this.layerManager = new TF.GIS.LayerManager(mapInstance);
		this._pathLineType = tf.storageManager.get('pathLineType') === 'Sequence' ? PATH_LINE_TYPE.Sequence : PATH_LINE_TYPE.Path;
		this._fieldTripsData = null;
		this._editing = {
			isAddingStop: false,
			isMovingStop: false,
			features: {
				addingStop: null,
				movingStop: null
			}
		};
		this.defineReadOnlyProperty("PATH_LINE_TYPE", PATH_LINE_TYPE);
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

	Object.defineProperty(FieldTripMap.prototype, 'fieldTripsData', {
		get() { return this._fieldTripsData; },
		set(value)
		{
			this._fieldTripsData = value;
		},
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(FieldTripMap.prototype, 'editing', {
		get() { return this._editing; },
		enumerable: false,
		configurable: false
	});

	//#endregion

	//#region Initialization

	FieldTripMap.prototype.initLayers = async function()
	{
		const self = this;
		if (self.fieldTripStopLayerInstance &&
			self.fieldTripPathLayerInstance &&
			self.fieldTripSequenceLineLayerInstance)
		{
			return;
		}

		const layerOptions = [{
			id: RoutingPalette_FieldTripPathLayerId,
			index: RoutingPalette_FieldTripPathLayer_Index,
			layerType: FIELD_TRIP_LAYER_TYPE.PATH
		}, {
			id: RoutingPalette_FieldTripSequenceLineLayerId,
			index: RoutingPalette_FieldTripSequenceLineLayer_Index,
			layerType: FIELD_TRIP_LAYER_TYPE.PATH
		}, {
			id: RoutingPalette_FieldTripStopLayerId,
			index: RoutingPalette_FieldTripStopLayer_Index,
			layerType: FIELD_TRIP_LAYER_TYPE.STOP
		}, {
			id: RoutingPalette_FieldTripHighlightLayerId,
			index: RoutingPalette_FieldTripHighlightLayer_Index
		}, {
			id: RoutingPalette_FieldTripHighlightStopLayerId,
			index: RoutingPalette_FieldTripHighlightStopLayer_Index,
			layerType: FIELD_TRIP_LAYER_TYPE.STOP
		}];
		const layerInstances = await self.layerManager.createLayerInstances(layerOptions);

		self.fieldTripPathLayerInstance = layerInstances[0];
		self.defineReadOnlyProperty("fieldTripPathLayerInstance", self.fieldTripPathLayerInstance);

		self.fieldTripSequenceLineLayerInstance = layerInstances[1];
		self.defineReadOnlyProperty("fieldTripSequenceLineLayerInstance", self.fieldTripSequenceLineLayerInstance);

		self.fieldTripStopLayerInstance = layerInstances[2];
		self.defineReadOnlyProperty("fieldTripStopLayerInstance", self.fieldTripStopLayerInstance);

		self.fieldTripHighlightLayerInstance = layerInstances[3];
		self.defineReadOnlyProperty("fieldTripHighlightLayerInstance", self.fieldTripHighlightLayerInstance);

		self.fieldTripHighlightStopLayerInstance = layerInstances[4];
		self.defineReadOnlyProperty("fieldTripHighlightStopLayerInstance", self.fieldTripHighlightStopLayerInstance);
	}

	FieldTripMap.prototype.initArrowLayers = function()
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

		const arrowRenderer = self._getArrowRenderer();
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
		await this.drawSequenceLine(fieldTrip);
	}

	FieldTripMap.prototype.orderFeatures = async function()
	{
		const self = this,
			fieldTrips = self.fieldTripsData,
			sortedFieldTrips = self._sortFieldTripByName(fieldTrips),
			sortedStopFeatures = self._sortStopFeaturesByFieldTrips(sortedFieldTrips),
			sortedPathFeatures = self._sortPathFeaturesByFieldTrips(sortedFieldTrips),
			sortedSequenceLineFeatures = self._sortSequenceLineFeaturesByFieldTrips(sortedFieldTrips);
		// update map features
		await self.fieldTripStopLayerInstance.clearLayer();
		await self.fieldTripStopLayerInstance.addMany(sortedStopFeatures);

		await self.fieldTripPathLayerInstance.clearLayer();
		await self.fieldTripPathLayerInstance.addMany(sortedPathFeatures);

		await self.fieldTripSequenceLineLayerInstance.clearLayer();
		await self.fieldTripSequenceLineLayerInstance.addMany(sortedSequenceLineFeatures);
	}

	FieldTripMap.prototype._compareFieldTripNames = function(a, b)
	{
		// get the field trip data from palette.
		// sort the result as same as palette.
		const paletteFieldTripsData = tf.pageManager.obPages()[0].data.routingPaletteViewModel.fieldTripPaletteSection.display.treeview.dataSource.data();
		const paletteNameData = paletteFieldTripsData.map(item => item.text);
		const aIndex = paletteNameData.findIndex(item => item === a.Name);
		const bIndex = paletteNameData.findIndex(item => item === b.Name);

		return aIndex - bIndex;
	}

	FieldTripMap.prototype._sortFieldTripByName = function(fieldTrips)
	{
		const self = this;
		const fieldTripIdMapping = fieldTrips.map(item => {
			const { DBID, Name, id } = item;
			return { DBID, Name, id };
		});

		const sortedFieldTrips = fieldTripIdMapping.sort(self._compareFieldTripNames).map(item => {
			const { DBID, id } = item;
			return { DBID, id };
		});

		return sortedFieldTrips;
	}

	FieldTripMap.prototype._sortStopFeaturesByFieldTrips = function(sortedFieldTrips)
	{
		const self = this,
			stopFeatures = self._getStopFeatures();
		
		const sortedStopFeatures = stopFeatures.sort((a, b) =>
		{
			let aValue, bValue;
			{
				let { DBID, FieldTripId, Sequence } = a.attributes;
				aValue = Object.assign({}, { DBID, FieldTripId, Sequence });
			}

			{
				let { DBID, FieldTripId, Sequence } = b.attributes;
				bValue = Object.assign({}, { DBID, FieldTripId, Sequence });
			}

			const aIndex = sortedFieldTrips.findIndex(item => item.DBID === aValue.DBID && item.id === aValue.FieldTripId);
			const bIndex = sortedFieldTrips.findIndex(item => item.DBID === bValue.DBID && item.id === bValue.FieldTripId);;

			if (aIndex === bIndex)
			{
				// order by sequence desc
				return (-1) * (aValue.Sequence - bValue.Sequence);
			}
			
			// draw bottom layer (larger index) first.
			return (-1) * (aIndex - bIndex);
		});

		return [...sortedStopFeatures];
	}

	FieldTripMap.prototype._sortPathFeaturesByFieldTrips = function(sortedFieldTrips)
	{
		const self = this,
			pathFeatures = self._getPathFeatures();

		return self._sortLineFeatures(sortedFieldTrips, pathFeatures);
	}

	FieldTripMap.prototype._sortSequenceLineFeaturesByFieldTrips = function(sortedFieldTrips)
	{
		const self = this,
			sequenceLineFeatures = self._getSequenceLineFeatures();

		return self._sortLineFeatures(sortedFieldTrips, sequenceLineFeatures);
	}

	FieldTripMap.prototype._sortLineFeatures = function(sortedFieldTrips, lineFeatures)
	{
		const sortedLineFeatures = lineFeatures.sort((a, b) =>
		{
			let aValue, bValue;
			{
				let { DBID, FieldTripId } = a.attributes;
				aValue = Object.assign({}, { DBID, FieldTripId });
			}

			{
				let { DBID, FieldTripId } = b.attributes;
				bValue = Object.assign({}, { DBID, FieldTripId });
			}

			let aIndex = sortedFieldTrips.findIndex(item => item.DBID === aValue.DBID && item.id === aValue.FieldTripId);
			let bIndex = sortedFieldTrips.findIndex(item => item.DBID === bValue.DBID && item.id === bValue.FieldTripId);

			if (aIndex === bIndex)
			{
				// keep the original order.
				return 0;
			}
			
			// draw bottom layer (larger index) first.
			return (-1) * (aIndex - bIndex);
		});

		return [...sortedLineFeatures];
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

		const fieldTripHighlightStopFeatures = this._getHighlightStopFeatures();
		this._setFieldTripLayerVisibility(fieldTrips, this.fieldTripHighlightStopLayerInstance, fieldTripHighlightStopFeatures);
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
		this.fieldTripStopLayerInstance.updateColor(fieldTripStops, color);

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

	FieldTripMap.prototype.switchPathType = async function(fieldTrips)
	{
		this.updateArrowRenderer();
		await this.updateFieldTripPathVisibility(fieldTrips);
	}

	FieldTripMap.prototype.updateFieldTripPathVisibility = async function(fieldTrips)
	{
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
	
	//#region Add Field Trip Stop

	FieldTripMap.prototype.startAddFieldTripStop = function()
	{
		this.editing.isAddingStop = true;
		this.mapInstance.setMapCursor("crosshair");
	}

	FieldTripMap.prototype.stopAddFieldTripStop = async function()
	{
		this.editing.isAddingStop = false;
		this.mapInstance.setMapCursor("default");
		await this.clearHighlightFeatures();
	}

	FieldTripMap.prototype.applyAddFieldTripStop = async function(data, callback = ()=>{})
	{
		console.log(data);

		this._refreshStopSequenceLabel(data);
		this._drawNewStopFromMap(data);
		this.clearHighlightFeatures();
		await this._drawNewStopPathFromMap(data);

		callback();
	}

	FieldTripMap.prototype._addNewStop = async function(stopLayerInstance, mapPoint)
	{
		const self = this,
			newStopData = await self._createNewStop(stopLayerInstance, mapPoint),
			{ Name, City, RegionAbbr, CountryCode, XCoord, YCoord } = newStopData,
			highlightStop = self.getHighlightStop(),
			addGraphic = newStopData.newStop;

		let newStopGraphic = null;
		if (highlightStop)
		{
			newStopGraphic = highlightStop;
			newStopGraphic.geometry = addGraphic.geometry;
			newStopGraphic.attributes.Name = addGraphic.attributes.Name;
		}
		else
		{
			newStopGraphic = addGraphic;
			stopLayerInstance.addStops([newStopGraphic]);
		}

		return { Name, City, RegionAbbr, CountryCode, XCoord, YCoord };
	}

	FieldTripMap.prototype._createNewStop = async function(stopLayerInstance, mapPoint)
	{
		const NEW_STOP_ID = 0,
			NEW_STOP_SEQUENCE = 0,
			UNNAMED_ADDRESS = "unnamed",
			{ longitude, latitude } = mapPoint,
			{ Address, City, RegionAbbr, CountryCode } = await stopLayerInstance.getGeocodeStop(longitude, latitude),
			Name = Address || UNNAMED_ADDRESS,
			attributes = {
				id: NEW_STOP_ID,
				Name,
				Sequence: NEW_STOP_SEQUENCE
			},
			newStop = stopLayerInstance.createStop(longitude, latitude, attributes);

		return { Name, City, RegionAbbr, CountryCode, newStop, XCoord: +longitude.toFixed(6), YCoord: +latitude.toFixed(6) };
	}

	FieldTripMap.prototype._refreshStopSequenceLabel = function(data)
	{
		const self = this,
			{ DBID, FieldTripId, Sequence } = data,
			fieldTripStops = self._getStopFeatures(),
			stopGraphics = fieldTripStops.filter(item => item.attributes.DBID === DBID && item.attributes.FieldTripId === FieldTripId);

		for (let i = 0; i < stopGraphics.length; i++)
		{
			const stop = fieldTripStops[i],
				attributes = stop.attributes;
			if (attributes.Sequence >= Sequence)
			{
				attributes.Sequence += 1;
				self._updateStopGraphicSequenceLabel(stop);
			}
		}
	}

	FieldTripMap.prototype._drawNewStopFromMap = function(data)
	{
		const self = this,
			stopLayerInstance = self.fieldTripStopLayerInstance,
			{ id, DBID, FieldTripId, Name, Notes, Sequence, VehicleCurbApproach, XCoord, YCoord } = data,
			CurbApproach = VehicleCurbApproach,
			Color = self.fieldTripsData.find(item => item.id === FieldTripId)?.color || INFO_STOP_COLOR,  // prevent Color is undefined
			attributes = { DBID, FieldTripId, id, Name, CurbApproach, Sequence, Color},
			newStopGraphic = stopLayerInstance.createStop(XCoord, YCoord, attributes);

		stopLayerInstance.addStops([newStopGraphic]);
	}

	FieldTripMap.prototype._updateStopGraphicSequenceLabel = function(stopGraphic)
	{
		const self = this,
			stopLayerInstance = self.fieldTripStopLayerInstance,
			attributes = stopGraphic.attributes;

		stopGraphic.symbol = stopLayerInstance.getStopSymbol(attributes.Sequence, attributes.Color);
	}

	FieldTripMap.prototype._drawNewStopPathFromMap = async function(data)
	{
		const self = this,
			{ DBID, FieldTripId, Sequence } = data,
			fieldTrip = self.fieldTripsData.find(item => item.DBID === DBID && item.id === FieldTripId),
			effectSequences = self._computeEffectSequences(fieldTrip, { addStop: { Sequence } });

		console.log(`TODO: _drawNewStopPathFromMap, fieldTripId: ${FieldTripId}, ${JSON.stringify(effectSequences)}`);

		await self.refreshFieldTripPath(fieldTrip, effectSequences);
	}


	//#endregion

	//#region TODO: Insert Field Trip Stop

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
		await this.updateFieldTripPathVisibility([fieldTrip]);

		this.orderFeatures();
		this.zoomToFieldTripLayers([fieldTrip]);
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

		self.editing.isMovingStop = true;
		self.editing.features.movingStop = {
			fieldTrip: fieldTrip,
			stop: stop
		};

		self.fieldTripStopLayerInstance?.moveStop(stopGraphic, sketchTool, function(movedStopData){
			self.onStopLayerMoveStopCompleted(movedStopData);
			self.onStopLayerMoveStopCompleted_UpdateDataModel({graphic: stopGraphic});
		});

		stopGraphic.visible = false;
	}

	FieldTripMap.prototype.onStopLayerMoveStopCompleted = async function(data)
	{
		const self = this,
			{ fieldTrip, stop } = self.editing.features.movingStop,
			{ longitude, latitude, Address, City } = data;

		if (Address !== "")
		{
			stop.Street = Address;
			stop.City = City;
		}
		stop.XCoord = +longitude.toFixed(6);
		stop.YCoord = +latitude.toFixed(6);

		const effectSequences = self._computeEffectSequences(fieldTrip, {moveStop: stop});

		await self.refreshFieldTripPath(fieldTrip, effectSequences);

		self.editing.isMovingStop = false;
		self.editing.features.movingStop = null;
		self.hideLoadingIndicator();
	}

	FieldTripMap.prototype.onStopLayerMoveStopCompleted_UpdateDataModel = function(data)
	{
		const stop = this.editing.features.movingStop.stop,
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

		self.showLoadingIndicator();

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
					self._updateStopGraphicSequenceLabel(stop);
				}
			}
		}

		const data = { fieldTripStopId: stop.id };
		PubSub.publish(TF.RoutingPalette.FieldTripMapEventEnum.DeleteStopLocationCompleted, data);

		const effectSequences = self._computeEffectSequences(fieldTrip, {deleteStop: stop});

		await self.refreshFieldTripPath(fieldTrip, effectSequences);

		self.hideLoadingIndicator();
	}

	//#endregion

	//#region Update Stop
	FieldTripMap.prototype.updateStopSymbol = function(fieldTrip, stops)
	{
		const self = this;
		const { DBID, FieldTripId } = self._extractFieldTripFeatureFields(fieldTrip),
			stopFeatures = self._getStopFeatures().filter(f => f.attributes.DBID === DBID && f.attributes.FieldTripId === FieldTripId);

		stops.forEach(stop =>
		{
			const stopFeature = stopFeatures.find(s => s.attributes.id === stop.id);
			if (stopFeature)
			{
				stopFeature.attributes.Sequence = stop.Sequence;
				stopFeature.symbol = self.fieldTripStopLayerInstance.getStopSymbol(stop.Sequence, stopFeature.attributes.Color);
			}
		});
	};
	//#endregion

	//#region Stop Info

	FieldTripMap.prototype.addHighlightFeatures = async function(data)
	{
		const self = this;
		if (!self.fieldTripStopLayerInstance ||
			!self.fieldTripPathLayerInstance ||
			!self.fieldTripHighlightLayerInstance)
		{
			return;
		}

		// avoid add duplicate features.
		await self.fieldTripHighlightLayerInstance.clearLayer();

		const vertex = [],
			stops = [],
			{ DBID, FieldTripId, beforeStop, currentStop, afterStop, stopSequence} = data,
			isEditStop = !!currentStop;

		let stopObjects = null;
		if (isEditStop)
		{
			stopObjects = [beforeStop, currentStop, afterStop].filter(item => item);
		}
		else
		{
			// beforeStop and afterStop must be existing for new stop.
			const highlightStop = self.getHighlightStop();
			const midStop = {
				XCoord: highlightStop.geometry.longitude,
				YCoord: highlightStop.geometry.latitude,
				id: 0
			};
			stopObjects = [beforeStop, midStop, afterStop].filter(item => item);
		}

		stopObjects.forEach(stop =>
		{
			const { XCoord, YCoord, id } = stop,
				attributes = { DBID, FieldTripId, id },
				graphic = self.fieldTripStopLayerInstance.createHighlightStop(XCoord, YCoord, attributes);
			stops.push(graphic);

			vertex.push([XCoord, YCoord]);
		});

		const paths = [vertex];
		await self.drawHighlightFeatures(data, paths, stops);

		self.drawHighlightStop(data, currentStop, stopSequence, isEditStop);
	}

	FieldTripMap.prototype.clearHighlightFeatures = async function()
	{
		const self = this;
		if (!self.fieldTripHighlightLayerInstance)
		{
			return;
		}

		await self.fieldTripHighlightLayerInstance.clearLayer();

		await self.fieldTripHighlightStopLayerInstance.clearLayer();
	}

	FieldTripMap.prototype.drawHighlightFeatures = async function(data, paths, stops)
	{
		const self = this;
		if (!self.fieldTripPathLayerInstance)
		{
			return;
		}

		let highlightGraphics = [];
		// add highlight sequence line
		const { DBID, FieldTripId, Color } = data,
			pathAttributes = { DBID, FieldTripId, Color },
			basePathGraphic = self.fieldTripPathLayerInstance.createHighlightPath(paths, pathAttributes);
		highlightGraphics.push(basePathGraphic);

		const topPathGraphic = self.fieldTripPathLayerInstance.createPath(paths, pathAttributes);
		highlightGraphics.push(topPathGraphic);

		// add highlight stop
		highlightGraphics = highlightGraphics.concat(stops);

		await self.fieldTripHighlightLayerInstance.addMany(highlightGraphics);
	}

	FieldTripMap.prototype.drawHighlightStop = function(data, currentStop, stopSequence, isEditStop)
	{
		const self = this;
		let stopGraphic = null;
		if (isEditStop)
		{
			const attributes = {
				id: currentStop.id,
				DBID: data.DBID,
				FieldTripId: data.FieldTripId,
				CurbApproach: currentStop.vehicleCurbApproach,
				Name: currentStop.Street,
				Sequence: currentStop.Sequence,
				Color: INFO_STOP_COLOR
			},
			longitude = currentStop.XCoord,
			latitude = currentStop.YCoord;

			stopGraphic = self.fieldTripHighlightStopLayerInstance.createStop(longitude, latitude, attributes, stopSequence);
		}

		const highlightStop = self.getHighlightStop();
		if (highlightStop)
		{
			if (isEditStop)
			{
				highlightStop.geometry = stopGraphic.geometry;
				highlightStop.attributes = stopGraphic.attributes;
			}
			highlightStop.symbol = self.fieldTripHighlightStopLayerInstance.getStopSymbol(stopSequence, INFO_STOP_COLOR);
		}
		else
		{
			self.fieldTripHighlightStopLayerInstance.addStops([stopGraphic]);
		}
	}

	FieldTripMap.prototype.getHighlightStop = function()
	{
		const self = this;
		const features = self._getHighlightStopFeatures();
		let highlightStop = null;
		if (features && features.length === 1)
		{
			highlightStop = features[0];
		}

		return highlightStop;
	}

	//#endregion

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

		if (event.button === 0)
		{
			// click on map
			if (this.editing.isAddingStop)
			{
				const mapPoint = data.event.mapPoint;
				self.showLoadingIndicator();
				const newStopData = await self._addNewStop(self.fieldTripHighlightStopLayerInstance, mapPoint);
				self.hideLoadingIndicator();

				console.log(newStopData);
				PubSub.publish(TF.RoutingPalette.FieldTripMapEventEnum.AddStopFromMapCompleted, newStopData);
			}
		}
		else if (event.button === 2)
		{
			// right click
			if (this.editing.isAddingStop)
			{
				this.stopAddFieldTripStop();
			}

			const response = await self.mapInstance?.map.mapView.hitTest(event);
			if (response.results.length > 0)
			{
				const graphics = response.results.map(item => item.graphic);
				const stopGraphics = graphics.filter(item => item.layer?.id === RoutingPalette_FieldTripStopLayerId);
				if (stopGraphics.length > 0)
				{
					const data = stopGraphics.map(stop => {
						const { DBID, FieldTripId, id, Sequence } = stop.attributes;
						return { DBID, FieldTripId, id, Sequence };
					});
					const dataWrapper = { data, event };
					PubSub.publish(TF.RoutingPalette.FieldTripMapEventEnum.FieldTripStopClick, dataWrapper);
				}

				const pathGraphics = graphics.filter(item => item.layer?.id === RoutingPalette_FieldTripPathLayerId);
				if (pathGraphics.length > 0)
				{
					const data = pathGraphics.map(path => {
						const { DBID, FieldTripId, Sequence } = path.attributes;
						return { DBID, FieldTripId, Sequence };
					});
					const dataWrapper = { data, event };
					console.log(dataWrapper);
					PubSub.publish(TF.RoutingPalette.FieldTripMapEventEnum.FieldTripPathClick, dataWrapper);
				}
			}
		}
	}

	FieldTripMap.prototype.onMapKeyUpEvent = function(data)
	{
		if (data.event.key === "Escape")
		{
			if (this.editing.isAddingStop)
			{
				this.stopAddFieldTripStop();
			}
		}
	}

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
				// hide by default for UX.
				const graphic = self.fieldTripStopLayerInstance?.createStop(stop.XCoord, stop.YCoord, attributes);
				self.fieldTripStopLayerInstance?.setFeaturesVisibility([graphic], false);
				graphics.push(graphic);
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

		for (let i = 0; i < routePath.length; i++)
		{
			// draw route path split by stop.
			const stopPath = routePath[i];
			const pathAttributes = fieldTrip.routePathAttributes;
			const graphic = this.fieldTripPathLayerInstance?.createPath([stopPath], pathAttributes);
			// hide by default for UX.
			this.fieldTripPathLayerInstance?.setFeaturesVisibility([graphic], false);
			this.fieldTripPathLayerInstance?.addPath(graphic);
		}
	}

	FieldTripMap.prototype.drawSequenceLine = async function(fieldTrip)
	{
		const self = this;
		return new Promise((resolve, reject) =>
		{
			const sequenceLine = self._computeSequenceLine(fieldTrip);
			const Color = self._getColor(fieldTrip),
				{ DBID, FieldTripId } = self._extractFieldTripFeatureFields(fieldTrip),
				attributes = { DBID, FieldTripId, Color };
	
			const graphic = self.fieldTripSequenceLineLayerInstance?.createPath(sequenceLine, attributes);
			// hide by default for UX.
			self.fieldTripSequenceLineLayerInstance?.setFeaturesVisibility([graphic], false);
			self.fieldTripSequenceLineLayerInstance?.addPath(graphic, () =>
			{
				resolve();
			});
		});
	}

	//#region - Path Arrows

	FieldTripMap.prototype._getArrowRenderer = function()
	{
		const self = this,
		 	uniqueValueInfos = [],
			arrowOnPath = self._isArrowOnPath(),
			fieldTrips = this.fieldTripsData;
		
		// sort by Name to make sure the arrow z-index is correct.
		const fieldTripsClone = [...fieldTrips];
		fieldTripsClone.sort(self._compareFieldTripNames);

		for (let i = 0; i < fieldTripsClone.length; i++)
		{
			const fieldTrip = fieldTripsClone[i],
				value = self._getColor(fieldTrip),
				description = self._extractArrowCondition(fieldTrip.DBID, fieldTrip.id),
				symbol = self.arrowLayerHelper.getArrowSymbol(arrowOnPath, value);
			uniqueValueInfos.push({ value, symbol, description });
		}

		return self.arrowLayerHelper.createUniqueValueRenderer(uniqueValueInfos);
	}

	FieldTripMap.prototype.updateArrowRenderer = function()
	{
		const arrowRenderer = this._getArrowRenderer();
		this.fieldTripPathArrowLayerInstance.layer.renderer = arrowRenderer;
		this.fieldTripSequenceLineArrowLayerInstance.layer.renderer = arrowRenderer;
	}

	FieldTripMap.prototype.redrawFieldTripArrows = async function(fieldTrips)
	{
		for (let i = 0; i < fieldTrips.length; i++)
		{
			const fieldTrip = fieldTrips[i];
			// update path arrow position no matter whether field trip is visible or not.
			await this.drawFieldTripPathArrow(fieldTrip);
			await this.drawSequenceLineArrow(fieldTrip);
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

		const edits = {};
		const condition = self._extractArrowCondition(fieldTrip.DBID, fieldTrip.id);
		const deleteArrows = await self._getPathArrowFeatures(condition);
		if (deleteArrows.length > 0)
		{
			edits.deleteFeatures = deleteArrows;
		}

		const arrows = self._computeStopPathArrowFeatures(fieldTrip);
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

	FieldTripMap.prototype._computeStopPathArrowFeatures = function(fieldTrip)
	{
		const self = this,
			{ DBID, FieldTripId } = self._extractFieldTripFeatureFields(fieldTrip),
			pathFeatures =  self._getPathFeatures(),
			stopPathFeatures = pathFeatures.filter(feature => feature.attributes.DBID === DBID && feature.attributes.FieldTripId === FieldTripId);

		let arrows = [];
		for (let i = 0; i < stopPathFeatures.length; i++)
		{
			const stopPathFeature = stopPathFeatures[i];
			arrows = arrows.concat(self._computeArrowFeatures(stopPathFeature));
		}

		return arrows;
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

		// self.fieldTripSequenceLineArrowLayerInstance.layer.refresh();
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

	FieldTripMap.prototype._computeEffectSequences = function(fieldTrip, {addStop, moveStop, deleteStop} = {})
	{
		let effectSequences = [];

		if (addStop)
		{
			effectSequences = fieldTrip.FieldTripStops.filter(stop => stop.Sequence == addStop.Sequence - 1 || stop.Sequence == addStop.Sequence || stop.Sequence == addStop.Sequence + 1);
		}
		else if (moveStop)
		{
			effectSequences = fieldTrip.FieldTripStops.filter(stop => stop.Sequence >= moveStop.Sequence - 1 && stop.Sequence <= moveStop.Sequence + 1);
		}
		else if(deleteStop)
		{
			effectSequences = fieldTrip.FieldTripStops.filter(stop => stop.Sequence == deleteStop.Sequence - 1 || stop.Sequence == deleteStop.Sequence);
		}

		return effectSequences.map(stop => stop.Sequence);
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

		let routePath = fieldTrip.FieldTripStops.filter(stop => !!stop._geoPath).map(stop => stop._geoPath.paths);
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

	FieldTripMap.prototype._getHighlightStopFeatures = function()
	{
		return this.fieldTripHighlightStopLayerInstance?.getFeatures();
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

	FieldTripMap.prototype.showLoadingIndicator = function()
	{
		if (tf.loadingIndicator)
		{
			tf.loadingIndicator.showImmediately();
		}
	}

	FieldTripMap.prototype.hideLoadingIndicator = function()
	{
		if (tf.loadingIndicator)
		{
			tf.loadingIndicator.tryHide();
		}
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

			self.mapInstance.removeLayer(RoutingPalette_FieldTripHighlightStopLayerId);
			self.fieldTripHighlightStopLayerInstance = null;
		}

		if (self.fieldTripPathArrowLayerInstance && self.fieldTripSequenceLineArrowLayerInstance)
		{
			self.mapInstance.removeLayer(RoutingPalette_FieldTripPathArrowLayerId);
			self.fieldTripPathArrowLayerInstance = null;

			self.mapInstance.removeLayer(RoutingPalette_FieldTripSequenceLineArrowLayerId);
			self.fieldTripSequenceLineArrowLayerInstance = null;
		}
	}
})();

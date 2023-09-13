
(function()
{
	createNamespace("TF.RoutingPalette").FieldTripMapOperation = FieldTripMapOperation;

	console.log("0 TF.RoutingPalette.FieldTripMapOperation");

	//#region Constant

	const BASE_LAYER_ID = 0;
	const FieldTripMap_PathArrowLayerId = "FieldTripMap_PathArrowLayer";
	const FieldTripMap_PathArrowLayer_Index = BASE_LAYER_ID + 1;
	const FieldTripMap_PathLayerId = "FieldTripMap_PathLayer";
	const FieldTripMap_PathLayer_Index = BASE_LAYER_ID + 2;
	const FieldTripMap_SequenceLineArrowLayerId = "FieldTripMap_SequenceLineArrowLayer";
	const FieldTripMap_SequenceLineArrowLayer_Index = BASE_LAYER_ID +3;
	const FieldTripMap_HighlightLayerId = "FieldTripMap_HighlightLayer";
	const FieldTripMap_HighlightLayer_Index = BASE_LAYER_ID + 4;
	const FieldTripMap_SequenceLineLayerId = "FieldTripMap_SequenceLineLayer";
	const FieldTripMap_SequenceLineLayer_Index = BASE_LAYER_ID + 5;
	const FieldTripMap_StopLayerId = "FieldTripMap_StopLayer";
	const FieldTripMap_StopLayer_Index = BASE_LAYER_ID + 6;
	const FieldTripMap_HighlightStopLayerId = "FieldTripMap_HighlightStopLayer";
	const FieldTripMap_HighlightStopLayer_Index = BASE_LAYER_ID + 7;

	const INFO_STOP_COLOR = "#FFFFFF";
	const LAYER_TYPE = {
		PATH: "PathLayer",
		STOP: "StopLayer"
	};

	//#endregion

	function FieldTripMapOperation(mapInstance)
	{
		console.log("1 function FieldTripMapOperation");

		if (!mapInstance)
		{
			console.error("FieldTripMapOperation constructor failed! No valid mapInstance.");
			return;
		}

		this.mapInstance = mapInstance;
		_arrowLayerHelper = new TF.GIS.ArrowLayerHelper(mapInstance);
		_layerManager = new TF.GIS.LayerManager(mapInstance);
		_fieldTripMap = new TF.RoutingPalette.FieldTripMap(mapInstance);

		this._pathLineType = tf.storageManager.get('pathLineType') === TF.RoutingPalette.FieldTripEnum.PATH_TYPE.SEQUENCE_LINE ?
			TF.RoutingPalette.FieldTripEnum.PATH_TYPE.SEQUENCE_LINE : TF.RoutingPalette.FieldTripEnum.PATH_TYPE.PATH_LINE;
		this._fieldTripsData = null;
		this._editing = {
			isAddingStop: false,
			isMovingStop: false,
			features: {
				addingStop: null,
				movingStop: null
			}
		};
		mapInstance.events.onMapViewKeyUpEvent.subscribe(this.onMapKeyUpEvent.bind(this));
	}

	//#region Property

	FieldTripMapOperation.prototype.defineReadOnlyProperty = function(propertyName, value)
	{
		Object.defineProperty(this, propertyName, {
			get() { return value; },
			enumerable: false,
			configurable: false
		});
	};

	Object.defineProperty(FieldTripMapOperation.prototype, 'pathLineType', {
		get() { return this._pathLineType; },
		set(value)
		{
			this._pathLineType = value;
		},
		enumerable: false,
		configurable: false
	});

	FieldTripMapOperation.prototype.setPathLineType = function(type)
	{
		this.pathLineType = type;
	}

	Object.defineProperty(FieldTripMapOperation.prototype, 'fieldTripsData', {
		get() { return this._fieldTripsData; },
		set(value)
		{
			this._fieldTripsData = value;
		},
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(FieldTripMapOperation.prototype, 'editing', {
		get() { return this._editing; },
		enumerable: false,
		configurable: false
	});

	//#endregion

	//#region Private Property

	let _arrowLayerHelper = null;
	let _layerManager = null;

	let _pathArrowLayerInstance = null;
	let _pathLayerInstance = null;
	let _sequenceLineArrowLayerInstance = null;
	let _highlightLayerInstance = null;
	let _sequenceLineLayerInstance = null;
	let _stopLayerInstance = null;
	let _highlightStopLayerInstance = null;

	let _fieldTripRoutes = [];

	let _fieldTripMap = null;

	//#endregion

	//#region Initialization

	FieldTripMapOperation.prototype.initLayers = async function()
	{
		console.log("2 FieldTripMapOperation.prototype.initLayers");

		await _fieldTripMap.initLayers();
	}

	FieldTripMapOperation.prototype.initArrowLayers = function()
	{
		console.log("3 FieldTripMapOperation.prototype.initArrowLayers");

		const self = this;
		const sortedFieldTrips = _getSortedFieldTrips(self.fieldTripsData);
		const arrowOnPath = self._isArrowOnPath();
		_fieldTripMap.initArrowLayers(sortedFieldTrips, arrowOnPath);
	}

	//#endregion

	//#region Interaction

	//#region - Edit / View Field Trips

	FieldTripMapOperation.prototype.addFieldTrip = async function(fieldTrip)
	{
		console.log("4 FieldTripMapOperation.prototype.addFieldTrip");

		if (!this.mapInstance)
		{
			return;
		}

		_sortBySequence(fieldTrip.FieldTripStops);
		const color = _getFieldTripColor(fieldTrip);
		const { DBID, FieldTripId } = _extractFieldTripFeatureFields(fieldTrip);

		const fieldTripRoute = _fieldTripMap.initRoute(fieldTrip);
		const isEmptyRoute = await _fieldTripMap.drawRoute(DBID, FieldTripId, color, fieldTripRoute);

		if (!isEmptyRoute)
		{
			const data = { fieldTrip };
			await this.mapInstance.fireCustomizedEvent({ eventType: TF.RoutingPalette.FieldTripMapEventEnum.DirectionUpdated, data });
		}
	}

	FieldTripMapOperation.prototype.orderFeatures = async function()
	{
		console.log("5 FieldTripMapOperation.prototype.orderFeatures");

		const self = this,
			fieldTrips = self.fieldTripsData,
			sortedFieldTrips = _sortFieldTripByName(fieldTrips);

		await _fieldTripMap.reorderFeatures(sortedFieldTrips);
	}

	const _compareFieldTripNames = (a, b) =>
	{
		// get the field trip data from palette.
		// sort the result as same as palette.
		const paletteFieldTripsData = tf.pageManager.obPages()[0].data.routingPaletteViewModel.fieldTripPaletteSectionVM.display.treeview.dataSource.data();
		const paletteNameData = paletteFieldTripsData.map(item => item.text);
		const aIndex = paletteNameData.findIndex(item => item === a.Name);
		const bIndex = paletteNameData.findIndex(item => item === b.Name);

		if (aIndex !== bIndex)
		{
			return aIndex - bIndex;
		}

		return a.id - b.id;
	}

	const _sortFieldTripByName = (fieldTrips) =>
	{
		const fieldTripIdMapping = fieldTrips.map(item =>
		{
			const { DBID, FieldTripId } = _extractFieldTripFeatureFields(item);
			const data = {
				DBID: DBID,
				Name: item.Name,
				id: FieldTripId
			};
			return data;
		});

		const sortedFieldTrips = fieldTripIdMapping.sort(_compareFieldTripNames).map(item => {
			const { DBID, id } = item;
			return { DBID, id };
		});

		return sortedFieldTrips;
	}

	//#endregion

	//#region - Show / Hide Layers

	FieldTripMapOperation.prototype.setFieldTripVisibility = async function(fieldTrips)
	{
		console.log("6 FieldTripMapOperation.prototype.setFieldTripVisibility");

		this.setFieldTripStopVisibility(fieldTrips);

		const expression = _calculateArrowLayerExpression(this.fieldTripsData);
		_setFieldTripPathVisibility(fieldTrips, this.pathLineType);
		_setFieldTripPathArrowVisibility(expression);

		_setFieldTripSequenceLineVisibility(fieldTrips, this.pathLineType);
		_setFieldTripSequenceLineArrowVisibility(expression);

		_setFieldTripHighlightLayerVisibility(fieldTrips);
	}

	FieldTripMapOperation.prototype.setFieldTripStopVisibility = function(fieldTrips)
	{
		console.log("7 FieldTripMapOperation.prototype.setFieldTripStopVisibility");
		_fieldTripMap.setFieldTripStopVisibility(fieldTrips);

		// const stopFeatures = _getStopFeatures();
		// _setFieldTripLayerVisibility(fieldTrips, _stopLayerInstance, stopFeatures);
	}

	const _setFieldTripPathVisibility = (fieldTrips, pathLineType) =>
	{
		const pathFeatures = _getPathFeatures();
		const precondition = pathLineType === TF.RoutingPalette.FieldTripEnum.PATH_TYPE.PATH_LINE;
		_setFieldTripLayerVisibility(fieldTrips, _pathLayerInstance, pathFeatures, precondition);
	}

	const _setFieldTripSequenceLineVisibility = (fieldTrips, pathLineType) =>
	{
		const sequenceLineFeatures = _getSequenceLineFeatures();
		const precondition = pathLineType === TF.RoutingPalette.FieldTripEnum.PATH_TYPE.SEQUENCE_LINE;
		_setFieldTripLayerVisibility(fieldTrips, _sequenceLineLayerInstance, sequenceLineFeatures, precondition);
	}

	const _setFieldTripHighlightLayerVisibility = (fieldTrips) =>
	{
		const fieldTripHighlightFeatures = _getHighlightFeatures();
		_setFieldTripLayerVisibility(fieldTrips, _highlightLayerInstance, fieldTripHighlightFeatures);

		const fieldTripHighlightStopFeatures = _getHighlightStopFeatures();
		_setFieldTripLayerVisibility(fieldTrips, _highlightStopLayerInstance, fieldTripHighlightStopFeatures);
	}

	const _setFieldTripLayerVisibility = (fieldTrips, layerInstance, layerFeatures, precondition = null) =>
	{
		for (let i = 0; i < fieldTrips.length; i++)
		{
			const fieldTrip = fieldTrips[i],
				{ DBID, FieldTripId } = _extractFieldTripFeatureFields(fieldTrip),
				visible = (precondition === null) ? fieldTrip.visible : (precondition && fieldTrip.visible),
				features = _queryMapFeatures(layerFeatures, DBID, FieldTripId),
				updateFeatures = features.filter(item => item.visible !== visible);

			if (updateFeatures.length > 0)
			{
				layerInstance.setFeaturesVisibility(updateFeatures, visible);
			}
		}
	}

	//#endregion

	//#region - Zoom Map to Layers, Center Map

	FieldTripMapOperation.prototype.zoomToFieldTripLayers = function(fieldTrips)
	{
		console.log("8 FieldTripMapOperation.prototype.zoomToFieldTripLayers");

		_fieldTripMap.zoomToLayers(fieldTrips);
	}

	FieldTripMapOperation.prototype.zoomToFieldTripStop = function({longitude, latitude})
	{
		console.log("9 FieldTripMapOperation.prototype.zoomToFieldTripStop");

		this.mapInstance.centerAndZoom(longitude, latitude);
	}

	//#endregion

	//#region - Close Layer, Close Map

	FieldTripMapOperation.prototype.removeFieldTrip = async function(fieldTrip)
	{
		console.log("10 FieldTripMapOperation.prototype.removeFieldTrip");

		const { DBID, FieldTripId } = _extractFieldTripFeatureFields(fieldTrip),
			stopFeatures = _getStopFeatures(),
			pathArrowFeatures = await _getPathArrowFeatures(),
			pathFeatures = _getPathFeatures(),
			sequenceLineArrowFeatures = await _getSequenceLineArrowFeatures(),
			sequenceLineFeatures = _getSequenceLineFeatures(),
			mapFeaturesTable = [stopFeatures, pathFeatures, sequenceLineFeatures],
			mapLayerInstanceTable = [_stopLayerInstance, _pathLayerInstance, _sequenceLineLayerInstance],
			mapArrowFeaturesTable = [pathArrowFeatures, sequenceLineArrowFeatures],
			mapArrowLayerInstanceTable = [_pathArrowLayerInstance, _sequenceLineArrowLayerInstance];

		for (let i = 0; i < mapFeaturesTable.length; i++)
		{
			const features = _queryMapFeatures(mapFeaturesTable[i], DBID, FieldTripId);
			_removeMapLayerFeatures(mapLayerInstanceTable[i], features);
		}

		for (let i = 0; i < mapArrowFeaturesTable.length; i++)
		{
			const features = _queryArrowFeatures(mapArrowFeaturesTable[i], DBID, FieldTripId);
			_removeMapLayerFeatures(mapArrowLayerInstanceTable[i], features);
		}
	}

	const _removeMapLayerFeatures = (layerInstance, removeFeatures) => layerInstance.removeMany(removeFeatures);

	//#endregion

	//#region - Update Layer Color

	FieldTripMapOperation.prototype.updateSymbolColor = async function(fieldTrip)
	{
		console.log("11 FieldTripMapOperation.prototype.updateSymbolColor");

		const color = _getFieldTripColor(fieldTrip),
			{ DBID, FieldTripId } = _extractFieldTripFeatureFields(fieldTrip),
			stopFeatures = _getStopFeatures(),
			pathFeatures = _getPathFeatures(),
			sequenceLineFeatures = _getSequenceLineFeatures(),
			fieldTripHighlightFeatures = _getHighlightFeatures();

		const createStopSymbol = TF.RoutingPalette.FieldTripMap.StopGraphicWrapper.GetSymbol;
		const createPathSymbol = TF.RoutingPalette.FieldTripMap.PathGraphicWrapper.GetSymbol;

		const fieldTripStops = _queryMapFeatures(stopFeatures, DBID, FieldTripId);
		_stopLayerInstance.updateColor(fieldTripStops, color, createStopSymbol);

		const fieldTripPaths = _queryMapFeatures(pathFeatures, DBID, FieldTripId);
		_pathLayerInstance.updateColor(fieldTripPaths, color, createPathSymbol);

		const fieldTripSequenceLines = _queryMapFeatures(sequenceLineFeatures, DBID, FieldTripId);
		_sequenceLineLayerInstance.updateColor(fieldTripSequenceLines, color, createPathSymbol);

		const fieldTripHighlights = _queryMapFeatures(fieldTripHighlightFeatures, DBID, FieldTripId);
		// prevent update highlight path symbol.
		const highlightLines = fieldTripHighlights.filter(item => item.geometry.type === TF.GIS.GeometryEnum.GEOMETRY_TYPE.POLYLINE && item.symbol.color.a === 1);
		_sequenceLineLayerInstance.updateColor(highlightLines, color, createPathSymbol);

		// update path arrow color
		const condition = _extractArrowCondition(DBID, FieldTripId);
		const arrowOnPath = this._isArrowOnPath();
		_updatePathArrowFeatureColor(_pathArrowLayerInstance, condition, color, arrowOnPath);
		_updatePathArrowFeatureColor(_sequenceLineArrowLayerInstance, condition, color, arrowOnPath);
		this.redrawPathArrowLayer(null, {}, [fieldTrip]);
		this.redrawSequenceArrowLayer(null, {}, [fieldTrip]);
	}

	const _updatePathArrowFeatureColor = (arrowLayerInstance, condition, color, arrowOnPath) =>
	{
		const layerRenderer = arrowLayerInstance.getRenderer().clone();
		const valueInfo = layerRenderer.uniqueValueInfos.filter(item => item.description === condition)[0];
		valueInfo.value = color;
		valueInfo.symbol = _arrowLayerHelper.getArrowSymbol(arrowOnPath, color);

		arrowLayerInstance.setRenderer(layerRenderer);
	}

	//#endregion

	//#region - Switch Field Trip Path Type (Sequence Lines / Path Lines)

	FieldTripMapOperation.prototype.switchPathType = async function(fieldTrips)
	{
		console.log("12 FieldTripMapOperation.prototype.switchPathType");

		_pathArrowLayerInstance.hide();
		_sequenceLineArrowLayerInstance.hide();

		this.updateArrowRenderer();
		await this.updateFieldTripPathVisibility(fieldTrips);
	}

	FieldTripMapOperation.prototype.updateFieldTripPathVisibility = async function(fieldTrips)
	{
		console.log("13 FieldTripMapOperation.prototype.updateFieldTripPathVisibility");
		// await this.redrawPathArrowLayer(null, {}, fieldTrips);
		// await this.redrawSequenceArrowLayer(null, {}, fieldTrips);

		await _fieldTripMap.updateFieldTripPathVisibility(fieldTrips, this.pathLineType);
		// _setFieldTripPathVisibility(fieldTrips, this.pathLineType);
		// _setFieldTripSequenceLineVisibility(fieldTrips, this.pathLineType);
	}

	//#endregion

	//#region New Copy

	const _isNewCopy = (fieldTrip) => fieldTrip.Id === 0;

	const _updateCopyFieldTripAttribute = (fieldTrip) =>
	{
		if (fieldTrip.id !== fieldTrip.routePathAttributes.FieldTripId)
		{
			fieldTrip.routePathAttributes.FieldTripId = fieldTrip.id;
			fieldTrip.routePathAttributes.Color = fieldTrip.color;
		}
	}

	//#endregion
	
	//#region Add Field Trip Stop

	FieldTripMapOperation.prototype.startAddFieldTripStop = function()
	{
		console.log("14 FieldTripMapOperation.prototype.startAddFieldTripStop");
		if (!this.editing.isAddingStop)
		{
			this.editing.isAddingStop = true;
			this.mapInstance.setCrosshairCursor();
		}
	}

	FieldTripMapOperation.prototype.stopAddFieldTripStop = async function()
	{
		console.log("15 FieldTripMapOperation.prototype.stopAddFieldTripStop");
		if (this.editing.isAddingStop)
		{
			this.editing.isAddingStop = false;
			this.mapInstance.setDefaultCursor();
		}
	}

	FieldTripMapOperation.prototype.applyAddFieldTripStops = async function(stops, callback = ()=>{})
	{
		console.log("16 FieldTripMapOperation.prototype.applyAddFieldTripStops");
		if (!stops?.length >= 1)
		{
			console.warn(`No stops for applyAddFieldTripStops. RETURN`);
			return;
		}

		this.showLoadingIndicator();
		_refreshStopsSequenceLabel(stops);
		_drawNewStopsFromMap(this.fieldTripsData, stops);
		this.clearHighlightFeatures();
		await this._drawNewStopPathsFromMap(this.fieldTripsData, stops);
		this.hideLoadingIndicator();

		callback();
	}

	FieldTripMapOperation.prototype.highlightQuickAddStops = function(stops)
	{
		console.log("17 FieldTripMapOperation.prototype.highlightQuickAddStops");
		const self = this, graphics = [];
		for (let index = 0; index < stops.length; index++)
		{
			const stop = stops[index];
			const graphic = self.createNewStop(stop);
			graphics.push(graphic);
		}

		_highlightStopLayerInstance.addStops(graphics);
	}

	FieldTripMapOperation.prototype.addHighlightStops = function(addGraphic)
	{
		console.log("18 FieldTripMapOperation.prototype.addHighlightStops");
		const highlightStop = _getHighlightStop();

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
			_highlightStopLayerInstance.addStops([newStopGraphic]);
		}
	}

	FieldTripMapOperation.prototype.createNewStop = function(stop)
	{
		console.log("19 FieldTripMapOperation.prototype.createNewStop");
		return _createNewStop(stop.XCoord, stop.YCoord, stop.Street);
	}

	const _createNewStop = (longitude, latitude, stopName) =>
	{
		const NEW_STOP_ID = 0,
			NEW_STOP_SEQUENCE = 0,
			attributes = {
				id: NEW_STOP_ID,
				Name: stopName,
				Sequence: NEW_STOP_SEQUENCE
			};
		return TF.RoutingPalette.FieldTripMap.StopGraphicWrapper.CreateStop(longitude, latitude, attributes);
	}

	const _createGeocodingNewStop = async (longitude, latitude) =>
	{
		const data = await _highlightStopLayerInstance.getGeocodeStop(longitude, latitude);
		if (!data)
		{
			return null;
		}

		const UNNAMED_ADDRESS = "unnamed",
			{ Address, City, RegionAbbr, CountryCode } = data,
			Name = Address || UNNAMED_ADDRESS,
			newStop = _createNewStop(longitude, latitude, Name);

		return { Name, City, RegionAbbr, CountryCode, newStop, XCoord: +longitude.toFixed(6), YCoord: +latitude.toFixed(6) };
	}

	const _refreshStopsSequenceLabel = (data) =>
	{
		const { DBID, FieldTripId } = data[0],
			fieldTripStops = _getStopFeatures(),
			stopGraphics = fieldTripStops.filter(item => item.attributes.DBID === DBID && item.attributes.FieldTripId === FieldTripId);

		for (let j = 0, jCount = data.length; j < jCount; j++)
		{
			const Sequence = data[j].Sequence;
			for (let i = 0, iCount = stopGraphics.length; i < iCount; i++)
			{
				const stop = stopGraphics[i],
				attributes = stop.attributes,
				stopSequence = attributes.Sequence;

				if (stopSequence >= Sequence)
				{
					attributes.Sequence += 1;
					_updateStopGraphicSequenceLabel(stop);
				}
			}
		}
	}

	const _drawNewStopsFromMap = (fieldTripsData, data) =>
	{
		const { FieldTripId } = data[0],
			Color = fieldTripsData.find(item => item.id === FieldTripId)?.color || INFO_STOP_COLOR,  // prevent Color is undefined
			graphics = [];

		for (let i = 0; i < data.length; i++)
		{
			const { id, DBID, FieldTripId, Name, Sequence, VehicleCurbApproach, XCoord, YCoord } = data[i];
			const CurbApproach = VehicleCurbApproach;
			const attributes = { DBID, FieldTripId, id, Name, CurbApproach, Sequence, Color };
			const stop = TF.RoutingPalette.FieldTripMap.StopGraphicWrapper.CreateStop(XCoord, YCoord, attributes);
			graphics.push(stop);
		}

		_stopLayerInstance.addStops(graphics);
	}

	const _updateStopGraphicSequenceLabel = (stopGraphic) =>
	{
		const attributes = stopGraphic.attributes;
		stopGraphic.symbol = TF.RoutingPalette.FieldTripMap.StopGraphicWrapper.GetSymbol(attributes.Sequence, attributes.Color);
	}

	FieldTripMapOperation.prototype._drawNewStopPathsFromMap = async function(fieldTripsData, data)
	{
		console.log("20 FieldTripMapOperation.prototype._drawNewStopPathsFromMap");
		const self = this,
			{ DBID, FieldTripId } = data[0],
			fieldTrip = fieldTripsData.find(item => item.DBID === DBID && item.id === FieldTripId),
			effectSequences = data.map(item => item.Sequence),
			previousSequence = effectSequences[0] - 1,
			nextSequence = effectSequences[effectSequences.length - 1] + 1;

		effectSequences.unshift(previousSequence);
		effectSequences.push(nextSequence);

		await self.refreshFieldTripPath(fieldTrip, effectSequences);
	}

	//#endregion

	//#region Refresh Field Trip Path

	FieldTripMapOperation.prototype.refreshFieldTripPath = async function(fieldTrip, effectSequences, callZoomToLayers = true)
	{
		console.log("21 FieldTripMapOperation.prototype.refreshFieldTripPath");
		_clearFieldTripPath(fieldTrip);
		await _clearFieldTripPathArrow(fieldTrip);

		_clearSequenceLine(fieldTrip);
		await _clearSequenceLineArrow(fieldTrip);

		await this.drawFieldTripPath(fieldTrip, effectSequences);
		await _drawSequenceLine(fieldTrip);

		await this.updateFieldTripPathVisibility([fieldTrip]);

		await this.orderFeatures();
		if (callZoomToLayers)
		{
			this.zoomToFieldTripLayers([fieldTrip]);
		}
	}

	const _clearFieldTripPath = (fieldTrip) =>
	{
		const { DBID, FieldTripId } = _extractFieldTripFeatureFields(fieldTrip),
			pathFeatures = _getPathFeatures(),
			fieldTripPaths = _queryMapFeatures(pathFeatures, DBID, FieldTripId);
		
		for (let i = 0; i < fieldTripPaths.length; i++)
		{
			_pathLayerInstance.deletePath(fieldTripPaths[i]);
		}

		fieldTrip.routePath = null;
		fieldTrip.routePathAttributes = null;
		fieldTrip.directions = null;
	}

	const _clearSequenceLine = (fieldTrip) =>
	{
		const { DBID, FieldTripId } = _extractFieldTripFeatureFields(fieldTrip),
			sequenceLineFeatures = _getSequenceLineFeatures();
			sequenceLines = _queryMapFeatures(sequenceLineFeatures, DBID, FieldTripId);

		for (let i = 0; i < sequenceLines.length; i++)
		{
			_sequenceLineLayerInstance.deletePath(sequenceLines[i]);
		}
	}

	const _clearFieldTripPathArrow = async (fieldTrip) =>
	{
		const { DBID, FieldTripId } = _extractFieldTripFeatureFields(fieldTrip),
			edits = {},
			condition = _extractArrowCondition(DBID, FieldTripId);
			deleteArrows = await _getPathArrowFeatures(condition);

		if (deleteArrows.length >= 0)
		{
			edits.deleteFeatures = deleteArrows;
		}

		await _pathArrowLayerInstance.layer.applyEdits(edits);
	}

	const _clearSequenceLineArrow = async (fieldTrip) =>
	{
		const { DBID, FieldTripId } = _extractFieldTripFeatureFields(fieldTrip),
			edits = {},
			condition = _extractArrowCondition(DBID, FieldTripId);
			deleteArrows = await _getSequenceLineArrowFeatures(condition);

		if (deleteArrows.length >= 0)
		{
			edits.deleteFeatures = deleteArrows;
		}

		await _sequenceLineArrowLayerInstance.layer.applyEdits(edits);
	}

	//#endregion

	//#region RCM on Map

	//#region Field Trip Stop

	//#region Move Stop Location

	FieldTripMapOperation.prototype.moveStopLocation = async function(fieldTrip, stop, sketchTool)
	{
		const self = this;
		if (!_stopLayerInstance || !sketchTool)
		{
			return;
		}

		if (self.editing.isMovingStop)
		{
			return;
		}

		const sequence = stop.Sequence, fieldTripId = fieldTrip.id;
		const fieldTripStops = _getStopFeatures();
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

		_stopLayerInstance?.moveStop(stopGraphic, sketchTool, function(movedStopData){
			self.onStopLayerMoveStopCompleted(movedStopData);
			self.onStopLayerMoveStopCompleted_UpdateDataModel({graphic: stopGraphic});
		});

		stopGraphic.visible = false;
	}

	FieldTripMapOperation.prototype.onStopLayerMoveStopCompleted = async function(data)
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

	FieldTripMapOperation.prototype.onStopLayerMoveStopCompleted_UpdateDataModel = function(data)
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
			this.mapInstance.fireCustomizedEvent({ eventType: TF.RoutingPalette.FieldTripMapEventEnum.MoveStopLocationCompleted, data });
		}
		else
		{
			console.warn(`updateDataModel: stop does not match!`);
		}
	}

	//#endregion

	//#region Delete Stop

	FieldTripMapOperation.prototype.deleteStopLocation = async function(fieldTrip, stop)
	{
		const self = this;
		if (!_stopLayerInstance)
		{
			return;
		}

		self.showLoadingIndicator();

		self.stopAddFieldTripStop();

		const { DBID, FieldTripId } = _extractFieldTripFeatureFields(fieldTrip),
			sequence = stop.Sequence,
			fieldTripStops = _getStopFeatures();

		for (let i = 0; i < fieldTripStops.length; i++)
		{
			const stop = fieldTripStops[i],
				attributes = stop.attributes;
			if (attributes.DBID === DBID && attributes.FieldTripId === FieldTripId)
			{
				if (attributes.Sequence === sequence)
				{
					_stopLayerInstance.deleteStop(stop);
				}
				else if (attributes.Sequence > sequence)
				{
					attributes.Sequence -= 1;
					_updateStopGraphicSequenceLabel(stop);
				}
			}
		}

		const data = { fieldTripStopId: stop.id };
		self.mapInstance.fireCustomizedEvent({ eventType: TF.RoutingPalette.FieldTripMapEventEnum.DeleteStopLocationCompleted, data });

		const effectSequences = self._computeEffectSequences(fieldTrip, {deleteStop: stop});

		await self.refreshFieldTripPath(fieldTrip, effectSequences);

		self.hideLoadingIndicator();
	}

	//#endregion

	//#region Update Stop
	FieldTripMapOperation.prototype.updateStopSymbol = function(fieldTrip, stops)
	{
		const self = this;
		const { DBID, FieldTripId } = _extractFieldTripFeatureFields(fieldTrip),
			stopFeatures = _getStopFeatures().filter(f => f.attributes.DBID === DBID && f.attributes.FieldTripId === FieldTripId);

		stops.forEach(stop =>
		{
			const stopFeature = stopFeatures.find(s => s.attributes.id === stop.id);
			if (stopFeature)
			{
				stopFeature.attributes.Sequence = stop.Sequence;
				stopFeature.symbol = TF.RoutingPalette.FieldTripMap.StopGraphicWrapper.GetSymbol(stop.Sequence, stopFeature.attributes.Color);
			}
		});
	};
	//#endregion

	//#region Stop Info

	FieldTripMapOperation.prototype.addHighlightFeatures = async function(data)
	{
		const self = this;
		if (!_stopLayerInstance ||
			!_pathLayerInstance ||
			!_highlightLayerInstance ||
			!_highlightStopLayerInstance)
		{
			return;
		}

		// avoid add duplicate features.
		await _highlightLayerInstance.clearLayer();

		const isAllFieldTripsInvisible = self.fieldTripsData.map(item => item.visible).every(item => item === false);
		if (isAllFieldTripsInvisible)
		{
			return;
		}

		const { toFieldTrip, previousStop, currentStop, nextStop, AssignSequence } = data;
		const isToFieldTripVisible = toFieldTrip.visible;
		// show highlight stop
		if (!!currentStop)
		{
			await _highlightStopLayerInstance.clearLayer();
		}

		_drawHighlightStop(data, currentStop, AssignSequence);

		// show highlight line
		let fieldTripStops = null;
		if (!!currentStop)
		{
			fieldTripStops = [previousStop, currentStop, nextStop].filter(item => item);
		}
		else
		{
			// create stop
			const highlightStop = _getHighlightStop();
			if (highlightStop === null)
			{
				return;
			}

			const midStop = {
				XCoord: highlightStop.geometry.longitude,
				YCoord: highlightStop.geometry.latitude,
				id: 0
			};
			fieldTripStops = [previousStop, midStop, nextStop].filter(item => item);
		}

		const vertex = [],
			stops = [],
			DBID = toFieldTrip.DBID,
			FieldTripId = toFieldTrip.id,
			Color = toFieldTrip.color;
		fieldTripStops.forEach(stop =>
		{
			const { XCoord, YCoord, id } = stop,
				attributes = { DBID, FieldTripId, id },
				graphic = TF.RoutingPalette.FieldTripMap.StopGraphicWrapper.CreateHighlightBackgroundStop(XCoord, YCoord, attributes);
			stops.push(graphic);

			vertex.push([XCoord, YCoord]);
		});

		const paths = [vertex];
		const params = { DBID, FieldTripId, Color };
		await _drawHighlightFeatures(params, paths, stops, isToFieldTripVisible);
	}

	FieldTripMapOperation.prototype.clearHighlightFeatures = async function()
	{
		if (!_highlightLayerInstance)
		{
			return;
		}

		await _highlightLayerInstance.clearLayer();

		await _highlightStopLayerInstance.clearLayer();
	}

	const _drawHighlightFeatures = async (data, paths, stops, isShowHighlightPath) =>
	{
		if (!_pathLayerInstance)
		{
			return;
		}

		let highlightGraphics = [];
		if (isShowHighlightPath)
		{
			// add highlight sequence line
			const { DBID, FieldTripId, Color } = data,
				pathAttributes = { DBID, FieldTripId, Color },
				basePathGraphic = TF.RoutingPalette.FieldTripMap.PathGraphicWrapper.CreateHighlightBackgroundPath(paths, pathAttributes);
			highlightGraphics.push(basePathGraphic);

			const topPathGraphic = TF.RoutingPalette.FieldTripMap.PathGraphicWrapper.CreatePath(paths, pathAttributes);
			highlightGraphics.push(topPathGraphic);
		}

		// add highlight stop
		highlightGraphics = highlightGraphics.concat(stops);

		await _highlightLayerInstance.addMany(highlightGraphics);
	}

	const _drawHighlightStop = function(data, currentStop, sequence)
	{
		const isEditStop = !!currentStop;
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

			stopGraphic = TF.RoutingPalette.FieldTripMap.StopGraphicWrapper.CreateStop(longitude, latitude, attributes, sequence);
		}

		const highlightStop = _getHighlightStop();
		if (highlightStop)
		{
			if (isEditStop)
			{
				highlightStop.geometry = stopGraphic.geometry;
				highlightStop.attributes = stopGraphic.attributes;
			}
			highlightStop.symbol = TF.RoutingPalette.FieldTripMap.StopGraphicWrapper.GetHighlightSymbol(sequence);
		}
		else
		{
			_highlightStopLayerInstance.addStops([stopGraphic]);
		}
	}

	const _getHighlightStop = () =>
	{
		const features = _getHighlightStopFeatures();
		let highlightStop = null;
		if (features && features.length === 1)
		{
			highlightStop = features[0];
		}

		return highlightStop;
	}

	FieldTripMapOperation.prototype.updateStopInfo = function(data)
	{
		const self = this,
			{ DBID, fieldTripStopId, fromFieldTripId, toFieldTripId, toStopSequence, color } = data,
			fieldTrip = self.fieldTripsData.find(item => item.id === toFieldTripId),
			stopFeatures = _getStopFeatures().filter(f => f.attributes.DBID === DBID &&
				f.attributes.FieldTripId === fromFieldTripId &&
				f.attributes.id === fieldTripStopId);

		if (stopFeatures.length === 1)
		{
			const feature = stopFeatures[0];
			feature.attributes.DBID = DBID;
			feature.attributes.FieldTripId = toFieldTripId;
			feature.attributes.Color = color;
			feature.attributes.Sequence = toStopSequence;
			feature.symbol = TF.RoutingPalette.FieldTripMap.StopGraphicWrapper.GetSymbol(toStopSequence, color);
			feature.visible = fieldTrip?.visible;
		}
	}

	//#endregion

	//#endregion

	//#endregion

	//#endregion

	//#region Map Events

	FieldTripMapOperation.prototype.onMapClickEvent = async function(data)
	{
		const self = this, event = data.event;

		if (event.button === 0)
		{
			// click on map
			if (this.editing.isAddingStop)
			{
				const mapPoint = data.event.mapPoint;
				const { longitude, latitude } = mapPoint;
				self.showLoadingIndicator();
				const newStopData = await _createGeocodingNewStop(longitude, latitude);
				if (newStopData === null)
				{
					self.hideLoadingIndicator();
					return;
				}

				self.addHighlightStops(newStopData.newStop);
				self.hideLoadingIndicator();

				this.mapInstance.fireCustomizedEvent({ eventType: TF.RoutingPalette.FieldTripMapEventEnum.AddStopFromMapCompleted, data: newStopData });
				self.stopAddFieldTripStop();
			}
		}
		else if (event.button === 2)
		{
			// right click

			const stopGraphics = await self.mapInstance?.findFeaturesByHitTest(event, FieldTripMap_StopLayerId);
			const pathGraphics = await self.mapInstance?.findFeaturesByHitTest(event, FieldTripMap_PathLayerId);
			if (stopGraphics.length > 0 || pathGraphics.length > 0)
			{
				await this.confirmToExitAddingStop(false);
			}

			if (stopGraphics.length > 0)
			{
				const data = stopGraphics.map(stop => {
					const { DBID, FieldTripId, id, Sequence } = stop.attributes;
					return { DBID, FieldTripId, id, Sequence };
				});
				const dataWrapper = { data, event };
				this.mapInstance.fireCustomizedEvent({ eventType: TF.RoutingPalette.FieldTripMapEventEnum.FieldTripStopClick, data: dataWrapper });
			}

			if (pathGraphics.length > 0)
			{
				const data = pathGraphics.map(graphic => {
					const { DBID, FieldTripId, Sequence } = graphic.attributes;
					let geometry = graphic.geometry;
					if (geometry.spatialReference.isWebMercator)
					{
						geometry = TF.GIS.GeometryHelper.ConvertToWGS1984(geometry);
					}
					const { paths } = geometry;
					return { DBID, FieldTripId, Sequence, paths };
				});
				const dataWrapper = { data, event };
				this.mapInstance.fireCustomizedEvent({ eventType: TF.RoutingPalette.FieldTripMapEventEnum.FieldTripPathClick, data: dataWrapper });
			}
		}
	}

	FieldTripMapOperation.prototype.onMapKeyUpEvent = async function(_, data)
	{
		const keyName = data.event.key;
		switch (keyName)
		{
			case "Escape":
				await this.confirmToExitAddingStop();
				break;
			case "Enter":
				console.log("TODO: Press Enter on FieldTripMapOperation");
				break;
			case "Delete":
				console.log("TODO: Press Delete on FieldTripMapOperation");
				break;
			case "m":
			case "M":
				if (data.event.native.ctrlKey)
				{
					console.log("TODO: Press Ctrl + M on FieldTripMapOperation, refresh trip stop path which is NULL");
				}
				break;
			case "z":
			case "Z":
				if (data.event.native.ctrlKey)
				{
					console.log("TODO: Press Ctrl + Z on FieldTripMapOperation, revertMapClick");//see _initRevertOperation in Plus
				}
				break;
			default:
				break;
		}
	}

	FieldTripMapOperation.prototype.confirmToExitAddingStop = async function(needConfirmation = true, doFireEvent = true)
	{
		if (!this.editing.isAddingStop)
		{
			return false;
		}

		const apply = async () =>
		{
			this.stopAddFieldTripStop();
			await this.clearHighlightFeatures();
			if (doFireEvent)
			{
				this.mapInstance.fireCustomizedEvent({ eventType: TF.RoutingPalette.FieldTripMapEventEnum.ExitAddingStop });
			}
		}

		if (!needConfirmation)
		{
			return await apply();
		}

		const response = await tf.promiseBootbox.yesNo("Are you sure you want to cancel?", "Confirmation Message");
		if (response)
		{
			await apply();
		}
	}

	//#endregion

	//#region Map Visualization


	FieldTripMapOperation.prototype.drawFieldTripPath = async function(fieldTrip, effectSequences)
	{
		console.log("23 FieldTripMapOperation.prototype.drawFieldTripPath");
		const routePath = await this._updateRoutepathAndDirection(fieldTrip, effectSequences);
		
		if (!routePath)
		{
			return;
		}

		_calculatePathAttributesAndDraw(fieldTrip, routePath);
	}

	const _calculatePathAttributesAndDraw = (fieldTrip, routePath) =>
	{
		if (!fieldTrip.routePathAttributes)
		{
			fieldTrip.routePathAttributes = _computePathAttributes(fieldTrip);
		}

		if (_isNewCopy(fieldTrip))
		{
			_updateCopyFieldTripAttribute(fieldTrip);
		}

		const pathAttributes = fieldTrip.routePathAttributes;
		_drawRoutePath(routePath, pathAttributes);

	}

	const _drawRoutePath = async (routePaths, attributes) =>
	{
		const DEFAULT_PATH_VISIBILITY = false
		for (let i = 0; i < routePaths.length; i++)
		{
			const routePath = routePaths[i];
			// hide by default for UX.
			const graphic = TF.RoutingPalette.FieldTripMap.PathGraphicWrapper.CreatePath([routePath], {...attributes}, DEFAULT_PATH_VISIBILITY);
			_pathLayerInstance.addPath(graphic);
		}
	};

	const _drawSequenceLine = async (fieldTrip) =>
	{
		return new Promise((resolve, reject) =>
		{
			const sequenceLine = _computeSequenceLine(fieldTrip);
			const Color = _getFieldTripColor(fieldTrip),
				{ DBID, FieldTripId } = _extractFieldTripFeatureFields(fieldTrip),
				attributes = { DBID, FieldTripId, Color };
			// hide by default for UX.
			const graphic = TF.RoutingPalette.FieldTripMap.PathGraphicWrapper.CreatePath(sequenceLine, attributes, false);
			_sequenceLineLayerInstance?.addPath(graphic, () =>
			{
				resolve();
			});
		});
	}

	//#region - Path Arrows


	const _getSortedFieldTrips = (fieldTrips) =>
	{
		const fieldTripsClone = [...fieldTrips];
		fieldTripsClone.sort(_compareFieldTripNames);

		return fieldTripsClone;
	};

	FieldTripMapOperation.prototype.updateArrowRenderer = function()
	{
		console.log("25 FieldTripMapOperation.prototype.updateArrowRenderer");
		const sortedFieldTrips = _getSortedFieldTrips(this.fieldTripsData);
		const arrowOnPath = this._isArrowOnPath();

		_fieldTripMap.updateArrowRenderer(sortedFieldTrips, arrowOnPath);
	}

	FieldTripMapOperation.prototype.redrawPathArrowLayer = async function(_, data = {}, fieldTrips = null)
	{
		console.log("26 FieldTripMapOperation.prototype.redrawPathArrowLayer");
		const self = this;
		if (self.pathLineType === TF.RoutingPalette.FieldTripEnum.PATH_TYPE.SEQUENCE_LINE)
		{
			return;
		}

		const fieldTripsData = fieldTrips || self.fieldTripsData,
			arrowLayerInstance = _pathArrowLayerInstance,
			pathFeatures = _getPathFeatures();

		arrowLayerInstance.hide();

		const arrowOnPath = self._isArrowOnPath();
		await _redrawArrowLayer(fieldTripsData, arrowLayerInstance, pathFeatures, data, arrowOnPath);
		const expression = _calculateArrowLayerExpression(self.fieldTripsData);
		_setFieldTripPathArrowVisibility(expression);
		arrowLayerInstance.show();
	}

	FieldTripMapOperation.prototype.redrawSequenceArrowLayer = async function(_, data, fieldTrips = null)
	{
		console.log("27 FieldTripMapOperation.prototype.redrawSequenceArrowLayer");
		const self = this;
		if (self.pathLineType === TF.RoutingPalette.FieldTripEnum.PATH_TYPE.PATH_LINE)
		{
			return;
		}

		const fieldTripsData = fieldTrips || self.fieldTripsData,
			arrowLayerInstance = _sequenceLineArrowLayerInstance,
			sequenceLineFeatures = _getSequenceLineFeatures();

		arrowLayerInstance.hide();

		const arrowOnPath = self._isArrowOnPath();
		await _redrawArrowLayer(fieldTripsData, arrowLayerInstance, sequenceLineFeatures, data, arrowOnPath);
		const expression = _calculateArrowLayerExpression(self.fieldTripsData);
		_setFieldTripSequenceLineArrowVisibility(expression);
		arrowLayerInstance.show();
	}

	const _redrawArrowLayer = async (fieldTrips, arrowLayerInstance, pathFeatures, data, arrowOnPath) =>
	{
		for (let i = 0; i < fieldTrips.length; i++)
		{
			const fieldTrip = fieldTrips[i];
			const { DBID, FieldTripId } = _extractFieldTripFeatureFields(fieldTrip);
			const features = pathFeatures.filter(feature => feature.attributes.DBID === DBID && feature.attributes.FieldTripId === FieldTripId);
			if (!arrowLayerInstance.isPathWithinMapExtentChanged(features, data))
			{
				continue;
			}

			const edits = {};
			const condition = _extractArrowCondition(DBID, FieldTripId);
			const arrowFeatures = await arrowLayerInstance.queryArrowFeatures(condition);
			const deleteArrows = arrowFeatures;
			if (deleteArrows.length > 0)
			{
				edits.deleteFeatures = deleteArrows;
			}

			let arrows = [];
			for (let j = 0; j < features.length; j++)
			{
				const feature = features[j];
				arrows = arrows.concat(_computeArrowFeatures(feature, arrowOnPath));
			}

			if (arrows.length >= 0)
			{
				edits.addFeatures = arrows;
			}

			await arrowLayerInstance.layer.applyEdits(edits);
		}
	}

	const _computeArrowFeatures = (polylineFeature, arrowOnPath) =>
	{
		let arrows = [];
		if (!polylineFeature)
		{
			return arrows;
		}

		const { DBID, FieldTripId, Color } = polylineFeature.attributes,
			attributes = { DBID, Color };

		attributes.Id = FieldTripId;
		arrows = _arrowLayerHelper.computeArrowFeatures(polylineFeature, arrowOnPath);

		for (let k = 0; k < arrows.length; k++)
		{
			const graphic = arrows[k];
			graphic.attributes = Object.assign({}, graphic.attributes, attributes);
			// hide by default for UX.
			graphic.visible = false;
		}

		return arrows;
	}

	const _setFieldTripPathArrowVisibility = (expression) => _pathArrowLayerInstance.setLayerDefinitionExpression(expression);

	const _getVisibleFieldTrips = (fieldTripsData) => fieldTripsData.filter(item => item.visible);

	const _setFieldTripSequenceLineArrowVisibility = (expression) => _sequenceLineArrowLayerInstance.setLayerDefinitionExpression(expression);

	const _calculateArrowLayerExpression = (fieldTripsData) =>
	{
		const visibleFieldTrips = _getVisibleFieldTrips(fieldTripsData),
			conditions = visibleFieldTrips.map(item =>
			{
				const { DBID, FieldTripId } = _extractFieldTripFeatureFields(item);
				return _extractArrowCondition(DBID, FieldTripId);
			}),
			expression = (conditions.length > 1) ? `(${conditions.join(") OR (")})` :
				(conditions.length === 0) ? "1 = 0" : conditions;
		return expression;
	}

	FieldTripMapOperation.prototype._isArrowOnPath = function()
	{
		return this.pathLineType === TF.RoutingPalette.FieldTripEnum.PATH_TYPE.SEQUENCE_LINE;
	}

	const _extractArrowCondition = (DBID, fieldTripId) => `DBID = ${DBID} and id = ${fieldTripId}`;

	//#endregion

	//#region - Computing Methods

	FieldTripMapOperation.prototype._computeEffectSequences = function(fieldTrip, {addStop, moveStop, deleteStop} = {})
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

	FieldTripMapOperation.prototype._updateRoutepathAndDirection = async function(fieldTrip, effectSequences)
	{
		if (!fieldTrip.routePath)
		{
			let effectedStops = this._getEffectStops(fieldTrip, effectSequences);
			const fieldTripStops = await this.calculateRouteByStops(fieldTrip, effectedStops);
			if (fieldTripStops === null)
			{
				return null;
			}

			const data = { fieldTrip };

			await this.mapInstance.fireCustomizedEvent({ eventType: TF.RoutingPalette.FieldTripMapEventEnum.DirectionUpdated, data });
		}

		const routePath = fieldTrip.FieldTripStops.filter(stop => !!stop.Paths && stop.Paths.length > 0).map(stop => stop.Paths);
		return routePath;
	}
	
	FieldTripMapOperation.prototype._getEffectStops = function(fieldTrip, effectSequences)
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

	FieldTripMapOperation.prototype._swapAttributeForStop = function(fieldTripStops, routeResult)
	{
		const stops = routeResult?.stops;

		stops.forEach(stop => {
			const matchedStop = fieldTripStops.find(originalStop => originalStop.Sequence == stop.attributes.Name);

			stop.attributes.OriginalSequence = stop.attributes.Name;

			stop.attributes.Name = matchedStop.Street;
		});
	}

	const _computePathAttributes = (fieldTrip) =>
	{
		const Color = _getFieldTripColor(fieldTrip),
			{ DBID, FieldTripId } = _extractFieldTripFeatureFields(fieldTrip),
			attributes = { DBID, FieldTripId, Color };
		return attributes;
	}

	const _computeSequenceLine = (fieldTrip) =>
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

	//#endregion

	//#endregion

	//#region Routing

	FieldTripMapOperation.prototype.calculateRouteByStops = async function(fieldTrip, fieldTripStops)
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
								if (!stop.Paths && !isTerminalStop)
								{
									message += ` No solution found from Stop ${stop.Sequence}`
									return { message, findInvalidStop: true };
								}
							}
							else if (findInvalidStop && (stop.Paths || isTerminalStop))
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
			return null;
		}

		const result = response?.results?.routeResults[0];
		var pathSegments = this._createPathSegments(response?.results);
		fieldTripStops = this._createTripStops(fieldTrip, fieldTripStops, pathSegments);
		this._swapAttributeForStop(fieldTripStops, result);

		return fieldTripStops;
	}

	FieldTripMapOperation.prototype.createStopObjects = function(fieldTripStops)
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

	FieldTripMapOperation.prototype.createRouteParams = function(stopFeatureSet)
	{
		return {
			impedanceAttribute: null,
			preserveFirstStop: true,
			preserveLastStop: true,
			stops: stopFeatureSet
		};
	};

	FieldTripMapOperation.prototype._isLastStop = function(trip, stop, allStops)
	{
		if (!trip)
		{
			return stop.Sequence === allStops.length;
		}
		return trip.FieldTripStops.length === stop.Sequence;
	};

	//if refresh path fail, will solve path one by one for each stop
	FieldTripMapOperation.prototype.refreshTripByStopsSeperately = function(trip, tripStops, networkService)
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
				const tripStop = tripStops[index];
				var stops = self.createStopObjects([tripStop, tripStops[index + 1]]);
				var createStopsPromise = networkService.createStopFeatureSet(stops);
				let beforeStop = tripStops[index - 1] ? tripStops[index - 1] : self._getBeforeStop(trip, tripStop);
				var vertexPromise = self._getVertexesCloseToStopOnPathSeperately(beforeStop, tripStop, networkService);
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
							tripStop.Paths = null;
						}
						else
						{
							var pathSegments = self._createPathSegments(result);
							pathSegments = self._updatePathSegments(pathSegments, [vertex, null]);
							tripStops[index] = self._createTripStops(trip, [tripStop], pathSegments)[0];
						}
						index++;
						solveRequest();
						return promise;
					}, function(err)
					{
						errMessage = err;
						tripStop.Paths = null;
						tripStop.Distance = 0;
						tripStop.DrivingDirections = "";
						tripStop.Speed = 0;
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

	FieldTripMapOperation.prototype._updatePathSegments = function(pathSegments, vertexes)
	{
		if (vertexes && vertexes[0] && vertexes[0].geometry)
		{
			const pathGeometry = TF.GIS.GeometryHelper.ComputeWebMercatorPolyline(pathSegments[0].paths);
			var firstSegmentGeom = TF.GIS.GeometryHelper.SimplifyGeometry(pathGeometry);
			if (firstSegmentGeom && firstSegmentGeom.paths[0].length > 2 && pathSegments[0] && pathSegments[1])
			{
				firstSegmentGeom.removePoint(0, 0);
				var allPoints = [];
				firstSegmentGeom.paths.forEach(function(path)
				{
					allPoints = allPoints.concat(path);
				});
				pathSegments[1].paths = allPoints.concat(pathSegments[1].paths);
				pathSegments[1].length = pathSegments[0].length + pathSegments[1].length;
				pathSegments[1].time = pathSegments[0].time + pathSegments[1].time;
			}
			pathSegments = pathSegments.slice(1, pathSegments.length);
		}
		if (vertexes && vertexes[1] && vertexes[1].geometry)
		{
			const pathGeometry = TF.GIS.GeometryHelper.ComputeWebMercatorPolyline(pathSegments[pathSegments.length - 1].paths);
			var lastSegmentGeom = TF.GIS.GeometryHelper.SimplifyGeometry(pathGeometry);
			if (lastSegmentGeom && lastSegmentGeom.paths[0].length > 2 && pathSegments[pathSegments.length - 2] && pathSegments[pathSegments.length - 1])
			{
				lastSegmentGeom.removePoint(0, lastSegmentGeom.paths[0].length - 1);
				lastSegmentGeom.paths.forEach(function(path)
				{
					pathSegments[pathSegments.length - 2].paths = pathSegments[pathSegments.length - 2].paths.concat(path);
				});
				pathSegments[pathSegments.length - 2].length = pathSegments[pathSegments.length - 2].length + pathSegments[pathSegments.length - 1].length;
				pathSegments[pathSegments.length - 2].time = pathSegments[pathSegments.length - 2].time + pathSegments[pathSegments.length - 1].time;
			}
			pathSegments = pathSegments.slice(0, pathSegments.length - 1);
		}
		return pathSegments;
	}

	FieldTripMapOperation.prototype._getBeforeStop = function(trip, tripStop)
	{
		var beforeStops = trip.FieldTripStops.filter(s => s.Sequence < tripStop.Sequence);
		return beforeStops[beforeStops.length - 1];
	}

	FieldTripMapOperation.prototype._getVertexesCloseToStopOnPathSeperately = function(beforeStop, afterStop, networkService)
	{
		var self = this, vertex = null;
		vertex = getPrevVertex();
		return Promise.resolve(vertex);

		function getPrevVertex()
		{
			if (beforeStop)
			{
				var prevPaths = beforeStop.Paths;
				if (!prevPaths)
				{
					return null;
				}
				return self._findVertexToStopOnPath(prevPaths, afterStop, networkService);
			}
			return null;
		}
	}

	FieldTripMapOperation.prototype._findVertexToStopOnPath = function(paths, stop, networkService)
	{
		if (!paths || !paths[0]) return;
		var polyline = TF.GIS.GeometryHelper.ComputeWebMercatorPolyline(paths);
		var point = TF.GIS.GeometryHelper.ComputeWebMercatorPoint(stop.XCoord, stop.YCoord);
		var startPoint = polyline.paths[0][0];
		var distance1 = Math.sqrt((startPoint[0] - point.x) * (startPoint[0] - point.x) + (startPoint[1] - point.y) * (startPoint[1] - point.y));
		var endIndex = polyline.paths[0].length - 1;
		var endPoint = polyline.paths[0][endIndex];
		var distance2 = Math.sqrt((endPoint[0] - point.x) * (endPoint[0] - point.x) + (endPoint[1] - point.y) * (endPoint[1] - point.y));
		var locationPoint = TF.GIS.StopHelper.GetPointOnPolylineByDistanceToPoint(polyline, 3, distance1 < distance2);

		const stopObject = {
			curbApproach: stop.vehicleCurbApproach,
			name: stop.Sequence,
			sequence: stop.Sequence,
			longitude: locationPoint.longitude,
			latitude: locationPoint.latitude,
		};
		return networkService.createStopFeatureSet([stopObject]);
	}

	FieldTripMapOperation.prototype._createPathSegments = function(result)
	{
		const pathSegments = [];
		const directions = (result && result.routeResults) ? result.routeResults[0].directions : null;
		if (directions === null)
		{
			pathSegments.push({ paths: [] });
			return pathSegments;
		}

		const directionFeatures = directions.features;
		let stopToStopPaths = [];
		let stopToStopPathDirections = "";
		let stopToStopPathLength = 0;
		let stopToStopPathTime = 0;

		for (let i = 0, count = directionFeatures.length; i < count; i++)
		{
			const feature = directionFeatures[i];
			const attributes = feature.attributes;
			const maneuverType = feature.attributes.maneuverType;
			if (maneuverType === "esriDMTStop")
			{
				pathSegments.push({
					paths: [...stopToStopPaths],
					length: stopToStopPathLength,
					time: stopToStopPathTime,
					direction: stopToStopPathDirections
				});

				stopToStopPaths = [];
				stopToStopPathLength = 0;
				stopToStopPathTime = 0;
				stopToStopPathDirections = "";
			}

			if (maneuverType == "railroadStop")
			{
				stopToStopPathDirections += "WARNING CROSS OVER RAILROAD.\n";
			}
			else if (maneuverType != "esriDMTDepart" && maneuverType != "esriDMTStop")
			{
				stopToStopPathDirections += `${attributes.text} ${attributes.length.toFixed(2)} km. \n`;
			}

			stopToStopPaths = stopToStopPaths.concat(feature.geometry.paths[0]);
			stopToStopPathLength += attributes.length;
			stopToStopPathTime += attributes.time;
		}

		return pathSegments;
	}

	FieldTripMapOperation.prototype._createTripStops = function(fieldTrip, tripStops, pathSegments)
	{
		var self = this;
		tripStops.forEach(function(stop, index)
		{
			const segment = pathSegments[index];
			if (segment && !stop.failedStop)
			{
				stop.DrivingDirections = segment.direction;
				stop.RouteDrivingDirections = stop.DrivingDirections;
				stop.IsCustomDirection = false;
				stop.Speed = (segment.time && segment.time != 0) ? (segment.length / segment.time) * 60 : 0;
				stop.StreetSpeed = stop.Speed;
				stop.Distance = segment.length ? segment.length * 1 : -1;
				stop.Paths = segment.paths;
			}
			else if (stop.failedStop || self._isLastStop(fieldTrip, stop, tripStops))
			{
				stop.path = {};
				stop.Paths = [];
				stop.Distance = 0;
				stop.Speed = 0;
				stop.DrivingDirections = "";
			}
		});
		return tripStops;
	};

	//#endregion

	//#region Private Methods

	const _getStopFeatures = () => _stopLayerInstance.getFeatures();

	const _getPathFeatures = () => _pathLayerInstance.getFeatures();

	const _getHighlightFeatures = () => _highlightLayerInstance.getFeatures();

	const _getHighlightStopFeatures = () => _highlightStopLayerInstance?.getFeatures();

	const _getPathArrowFeatures = async (condition = '1 = 1') =>
	{
		return await _getArrowFeatures(_pathArrowLayerInstance, condition);
	}

	const _getSequenceLineFeatures = () => _sequenceLineLayerInstance?.getFeatures();

	const _getSequenceLineArrowFeatures = async (condition = '1 = 1') =>
	{
		return await _getArrowFeatures(_sequenceLineArrowLayerInstance, condition);
	}

	const _getArrowFeatures = async (arrowLayerInstance, condition = '1 = 1') =>
	{
		const queryResult = await arrowLayerInstance?.queryFeatures(null, condition);
		return queryResult.features || [];
	}

	const _getFieldTripColor = (fieldTrip) => fieldTrip.color;

	const _sortBySequence = (stops) => stops.sort((a, b) => a.Sequence - b.Sequence);

	const _queryMapFeatures = (features, DBID, FieldTripId) =>
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

	const _queryArrowFeatures = (features, DBID, Id) =>
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

	const _extractFieldTripFeatureFields = (fieldTrip) =>
	{
		const DBID = fieldTrip.DBID,
			FieldTripId = fieldTrip.oldId || fieldTrip.id;

		return { DBID, FieldTripId };
	};

	FieldTripMapOperation.prototype.showLoadingIndicator = function()
	{
		if (tf.loadingIndicator)
		{
			tf.loadingIndicator.showImmediately();
		}
	}

	FieldTripMapOperation.prototype.hideLoadingIndicator = function()
	{
		if (tf.loadingIndicator)
		{
			tf.loadingIndicator.tryHide();
		}
	}

	//#endregion

	FieldTripMapOperation.prototype.dispose = function()
	{
		if (_arrowLayerHelper)
		{
			_arrowLayerHelper.dispose();
			_arrowLayerHelper = null;
		}

		for (let i = 0; i < _fieldTripRoutes.length; i++)
		{
			_fieldTripRoutes[i].dispose();
		}
		_fieldTripRoutes = null;

		const layerInstances = [
			_stopLayerInstance,
			_pathLayerInstance,
			_sequenceLineLayerInstance,
			_highlightLayerInstance,
			_highlightStopLayerInstance,
			_pathArrowLayerInstance,
			_sequenceLineArrowLayerInstance,
		];
		_layerManager.removeLayerInstances(layerInstances);
		_layerManager = null;

		_stopLayerInstance = null;
		_pathLayerInstance = null;
		_sequenceLineLayerInstance = null;
		_highlightLayerInstance = null;
		_highlightStopLayerInstance = null;
		_pathArrowLayerInstance = null;
		_sequenceLineArrowLayerInstance = null;
	}
})();
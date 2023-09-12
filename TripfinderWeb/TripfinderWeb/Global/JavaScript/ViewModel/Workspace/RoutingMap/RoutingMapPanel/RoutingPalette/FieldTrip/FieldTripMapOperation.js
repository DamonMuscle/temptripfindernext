
(function()
{
	createNamespace("TF.RoutingPalette").FieldTripMapOperation = FieldTripMapOperation;

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
		if (!mapInstance)
		{
			console.error("FieldTripMapOperation constructor failed! No valid mapInstance.");
			return;
		}

		this.mapInstance = mapInstance;
		_arrowLayerHelper = new TF.GIS.ArrowLayerHelper(mapInstance);
		_layerManager = new TF.GIS.LayerManager(mapInstance);
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

	//#endregion

	//#region Initialization

	FieldTripMapOperation.prototype.initLayers = async function()
	{
		if (_stopLayerInstance &&
			_pathLayerInstance &&
			_sequenceLineLayerInstance)
		{
			return;
		}

		const layerOptions = [{
			id: FieldTripMap_PathLayerId,
			index: FieldTripMap_PathLayer_Index,
			layerType: LAYER_TYPE.PATH
		}, {
			id: FieldTripMap_HighlightLayerId,
			index: FieldTripMap_HighlightLayer_Index
		}, {
			id: FieldTripMap_SequenceLineLayerId,
			index: FieldTripMap_SequenceLineLayer_Index,
			layerType: LAYER_TYPE.PATH
		}, {
			id: FieldTripMap_StopLayerId,
			index: FieldTripMap_StopLayer_Index,
			layerType: LAYER_TYPE.STOP
		}, {
			id: FieldTripMap_HighlightStopLayerId,
			index: FieldTripMap_HighlightStopLayer_Index,
			layerType: LAYER_TYPE.STOP
		}];

		const layerInstances = await _layerManager.createLayerInstances(layerOptions);
		[_pathLayerInstance, _highlightLayerInstance, _sequenceLineLayerInstance, _stopLayerInstance, _highlightStopLayerInstance] = layerInstances;
	}

	FieldTripMapOperation.prototype.initArrowLayers = function()
	{
		const self = this;
		if (!self.mapInstance)
		{
			return;
		}

		if (_pathArrowLayerInstance && _sequenceLineArrowLayerInstance)
		{
			self.mapInstance.removeLayer(FieldTripMap_PathArrowLayerId);
			_pathArrowLayerInstance.dispose();
			_pathArrowLayerInstance = null;

			self.mapInstance.removeLayer(FieldTripMap_SequenceLineArrowLayerId);
			_sequenceLineArrowLayerInstance.dispose();
			_sequenceLineArrowLayerInstance = null;
		}

		const fieldTrips = _getSortedFieldTrips(self.fieldTripsData);
		const arrowOnPath = self._isArrowOnPath();
		const arrowRenderer = _getArrowRenderer(fieldTrips, arrowOnPath);

		const pathArrowLayerOptions = {
			id: FieldTripMap_PathArrowLayerId,
			index: FieldTripMap_PathArrowLayer_Index,
			renderer: arrowRenderer,
			eventHandlers: {
				redraw: self.redrawPathArrowLayer.bind(self)
			}
		};
		_pathArrowLayerInstance = new TF.GIS.Layer.PathArrowLayer(self.mapInstance, pathArrowLayerOptions);
		self.mapInstance.addLayerInstance(_pathArrowLayerInstance);

		const sequenceArrowLayerOptions = {
			id: FieldTripMap_SequenceLineArrowLayerId,
			index: FieldTripMap_SequenceLineArrowLayer_Index,
			renderer: arrowRenderer,
			eventHandlers: {
				redraw: self.redrawSequenceArrowLayer.bind(self)
			}
		};
		_sequenceLineArrowLayerInstance = new TF.GIS.Layer.PathArrowLayer(self.mapInstance, sequenceArrowLayerOptions);
		self.mapInstance.addLayerInstance(_sequenceLineArrowLayerInstance);
	}

	//#endregion

	//#region Interaction

	//#region - Edit / View Field Trips

	FieldTripMapOperation.prototype.addFieldTrip = async function(fieldTrip)
	{
		if (!this.mapInstance)
		{
			return;
		}

		_sortBySequence(fieldTrip.FieldTripStops);

		const fieldTripRoute = _getFieldTripRoute(fieldTrip);

		const color = _getFieldTripColor(fieldTrip);
		const { DBID, FieldTripId } = _extractFieldTripFeatureFields(fieldTrip);
		_drawStops(DBID, FieldTripId, color, fieldTripRoute);

		await this._drawFieldTripPath(fieldTrip, fieldTripRoute);

		await this.drawSequenceLine(fieldTrip);
	}

	FieldTripMapOperation.prototype.orderFeatures = async function()
	{
		const self = this,
			fieldTrips = self.fieldTripsData,
			sortedFieldTrips = _sortFieldTripByName(fieldTrips),
			sortedStopFeatures = _sortStopFeaturesByFieldTrips(sortedFieldTrips),
			sortedPathFeatures = _sortPathFeaturesByFieldTrips(sortedFieldTrips),
			sortedSequenceLineFeatures = _sortSequenceLineFeaturesByFieldTrips(sortedFieldTrips);
		// update map features
		await _stopLayerInstance.clearLayer();
		await _stopLayerInstance.addMany(sortedStopFeatures);

		await _pathLayerInstance.clearLayer();
		await _pathLayerInstance.addMany(sortedPathFeatures);

		await _sequenceLineLayerInstance.clearLayer();
		await _sequenceLineLayerInstance.addMany(sortedSequenceLineFeatures);
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

	const _sortStopFeaturesByFieldTrips = (sortedFieldTrips) =>
	{
		const stopFeatures = _getStopFeatures();

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

	const _sortPathFeaturesByFieldTrips = (sortedFieldTrips) =>
	{
		const pathFeatures = _getPathFeatures();
		return _sortLineFeatures(sortedFieldTrips, pathFeatures);
	}

	const _sortSequenceLineFeaturesByFieldTrips = (sortedFieldTrips) =>
	{
		const sequenceLineFeatures = _getSequenceLineFeatures();
		return _sortLineFeatures(sortedFieldTrips, sequenceLineFeatures);
	}

	const _sortLineFeatures = (sortedFieldTrips, lineFeatures) =>
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

	FieldTripMapOperation.prototype.setFieldTripVisibility = async function(fieldTrips)
	{
		this.setFieldTripStopVisibility(fieldTrips);

		const expression = this._calculateArrowLayerExpression();
		this.setFieldTripPathVisibility(fieldTrips);
		_setFieldTripPathArrowVisibility(expression);

		this.setFieldTripSequenceLineVisibility(fieldTrips);
		_setFieldTripSequenceLineArrowVisibility(expression);

		this.setFieldTripHighlightLayerVisibility(fieldTrips);
	}

	FieldTripMapOperation.prototype.setFieldTripStopVisibility = function(fieldTrips)
	{
		const stopFeatures = _getStopFeatures();
		this._setFieldTripLayerVisibility(fieldTrips, _stopLayerInstance, stopFeatures);
	}

	FieldTripMapOperation.prototype.setFieldTripPathVisibility = function(fieldTrips)
	{
		const pathFeatures = _getPathFeatures();
		const precondition = this.pathLineType === TF.RoutingPalette.FieldTripEnum.PATH_TYPE.PATH_LINE;
		this._setFieldTripLayerVisibility(fieldTrips, _pathLayerInstance, pathFeatures, precondition);
	}

	FieldTripMapOperation.prototype.setFieldTripSequenceLineVisibility = function(fieldTrips)
	{
		const sequenceLineFeatures = _getSequenceLineFeatures();
		const precondition = this.pathLineType === TF.RoutingPalette.FieldTripEnum.PATH_TYPE.SEQUENCE_LINE;
		this._setFieldTripLayerVisibility(fieldTrips, _sequenceLineLayerInstance, sequenceLineFeatures, precondition);
	}

	FieldTripMapOperation.prototype.setFieldTripHighlightLayerVisibility = function(fieldTrips)
	{
		const fieldTripHighlightFeatures = _getHighlightFeatures();
		this._setFieldTripLayerVisibility(fieldTrips, _highlightLayerInstance, fieldTripHighlightFeatures);

		const fieldTripHighlightStopFeatures = _getHighlightStopFeatures();
		this._setFieldTripLayerVisibility(fieldTrips, _highlightStopLayerInstance, fieldTripHighlightStopFeatures);
	}

	FieldTripMapOperation.prototype._setFieldTripLayerVisibility = function(fieldTrips, layerInstance, layerFeatures, precondition = null)
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
		const stopFeatures = _getStopFeatures(),
			pathFeatures = _getPathFeatures(),
			sequenceLineFeatures = _getSequenceLineFeatures();

		let graphics = [];

		for (let j = 0; j < fieldTrips.length; j++)
		{
			const fieldTrip = fieldTrips[j],
				{ DBID, FieldTripId } = _extractFieldTripFeatureFields(fieldTrip);

			graphics = graphics.concat(_queryMapFeatures(stopFeatures, DBID, FieldTripId));
			graphics = graphics.concat(_queryMapFeatures(pathFeatures, DBID, FieldTripId));
			graphics = graphics.concat(_queryMapFeatures(sequenceLineFeatures, DBID, FieldTripId));
		}

		this.mapInstance.goTo(graphics);
	}

	FieldTripMapOperation.prototype.zoomToFieldTripStop = function({longitude, latitude})
	{
		this.mapInstance.centerAndZoom(longitude, latitude);
	}

	//#endregion

	//#region - Close Layer, Close Map

	FieldTripMapOperation.prototype.removeFieldTrip = async function(fieldTrip)
	{
		const { DBID, FieldTripId } = _extractFieldTripFeatureFields(fieldTrip),
			stopFeatures = _getStopFeatures(),
			pathArrowFeatures = await this._getPathArrowFeatures(),
			pathFeatures = _getPathFeatures(),
			sequenceLineArrowFeatures = await this._getSequenceLineArrowFeatures(),
			sequenceLineFeatures = _getSequenceLineFeatures(),
			mapFeaturesTable = [stopFeatures, pathFeatures, sequenceLineFeatures],
			mapLayerInstanceTable = [_stopLayerInstance, _pathLayerInstance, _sequenceLineLayerInstance],
			mapArrowFeaturesTable = [pathArrowFeatures, sequenceLineArrowFeatures],
			mapArrowLayerInstanceTable = [_pathArrowLayerInstance, _sequenceLineArrowLayerInstance];

		for (let i = 0; i < mapFeaturesTable.length; i++)
		{
			const features = _queryMapFeatures(mapFeaturesTable[i], DBID, FieldTripId);
			this.removeMapLayerFeatures(mapLayerInstanceTable[i], features);
		}

		for (let i = 0; i < mapArrowFeaturesTable.length; i++)
		{
			const features = _queryArrowFeatures(mapArrowFeaturesTable[i], DBID, FieldTripId);
			this.removeMapLayerFeatures(mapArrowLayerInstanceTable[i], features);
		}
	}

	FieldTripMapOperation.prototype.removeMapLayerFeatures = function(layerInstance, removeFeatures)
	{
		layerInstance.removeMany(removeFeatures);
	}

	//#endregion

	//#region - Update Layer Color

	FieldTripMapOperation.prototype.updateSymbolColor = async function(fieldTrip)
	{
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
		_pathArrowLayerInstance.hide();
		_sequenceLineArrowLayerInstance.hide();

		this.updateArrowRenderer();
		await this.updateFieldTripPathVisibility(fieldTrips);
	}

	FieldTripMapOperation.prototype.updateFieldTripPathVisibility = async function(fieldTrips)
	{
		await this.redrawPathArrowLayer(null, {}, fieldTrips);
		await this.redrawSequenceArrowLayer(null, {}, fieldTrips);

		this.setFieldTripPathVisibility(fieldTrips);
		this.setFieldTripSequenceLineVisibility(fieldTrips);
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
		if (!this.editing.isAddingStop)
		{
			this.editing.isAddingStop = true;
			this.mapInstance.setCrosshairCursor();
		}
	}

	FieldTripMapOperation.prototype.stopAddFieldTripStop = async function()
	{
		if (this.editing.isAddingStop)
		{
			this.editing.isAddingStop = false;
			this.mapInstance.setDefaultCursor();
		}
	}

	FieldTripMapOperation.prototype.applyAddFieldTripStops = async function(stops, callback = ()=>{})
	{
		if (!stops?.length >= 1)
		{
			console.warn(`No stops for applyAddFieldTripStops. RETURN`);
			return;
		}

		this.showLoadingIndicator();
		this._refreshStopsSequenceLabel(stops);
		this._drawNewStopsFromMap(stops);
		this.clearHighlightFeatures();
		await this._drawNewStopPathsFromMap(stops);
		this.hideLoadingIndicator();

		callback();
	}

	FieldTripMapOperation.prototype.highlightQuickAddStops = function(stops)
	{
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
		const self = this,
			highlightStop = self.getHighlightStop();

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
		return this._createNewStop(stop.XCoord, stop.YCoord, stop.Street);
	}

	FieldTripMapOperation.prototype._createNewStop = function(longitude, latitude, stopName)
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

	FieldTripMapOperation.prototype._createGeocodingNewStop = async function(longitude, latitude)
	{
		const self = this,
			data = await _highlightStopLayerInstance.getGeocodeStop(longitude, latitude);
		if (!data)
		{
			return null;
		}

		const UNNAMED_ADDRESS = "unnamed",
			{ Address, City, RegionAbbr, CountryCode } = data,
			Name = Address || UNNAMED_ADDRESS,
			newStop = self._createNewStop(longitude, latitude, Name);

		return { Name, City, RegionAbbr, CountryCode, newStop, XCoord: +longitude.toFixed(6), YCoord: +latitude.toFixed(6) };
	}

	FieldTripMapOperation.prototype._refreshStopsSequenceLabel = function(data)
	{
		const self = this,
			{ DBID, FieldTripId } = data[0],
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
					self._updateStopGraphicSequenceLabel(stop);
				}
			}
		}
	}

	FieldTripMapOperation.prototype._drawNewStopsFromMap = function(data)
	{
		const self = this,
			{ FieldTripId } = data[0],
			Color = self.fieldTripsData.find(item => item.id === FieldTripId)?.color || INFO_STOP_COLOR,  // prevent Color is undefined
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

	FieldTripMapOperation.prototype._updateStopGraphicSequenceLabel = function(stopGraphic)
	{
		const attributes = stopGraphic.attributes;
		stopGraphic.symbol = TF.RoutingPalette.FieldTripMap.StopGraphicWrapper.GetSymbol(attributes.Sequence, attributes.Color);
	}

	FieldTripMapOperation.prototype._drawNewStopPathsFromMap = async function(data)
	{
		const self = this,
			{ DBID, FieldTripId } = data[0],
			fieldTrip = self.fieldTripsData.find(item => item.DBID === DBID && item.id === FieldTripId),
			effectSequences = data.map(item => item.Sequence),
			previousSequence = effectSequences[0] - 1,
			nextSequence = effectSequences[effectSequences.length - 1] + 1;

		effectSequences.unshift(previousSequence);
		effectSequences.push(nextSequence);

		await self.refreshFieldTripPath(fieldTrip, effectSequences);
	}


	//#endregion

	//#region TODO: Insert Field Trip Stop

	//#endregion

	//#region TODO: Geo Select Field Trip Stop

	//#endregion

	//#region TODO: Optimize Field Trip

	//#endregion

	//#region Refresh Field Trip Path

	FieldTripMapOperation.prototype.refreshFieldTripPath = async function(fieldTrip, effectSequences, callZoomToLayers = true)
	{
		_clearFieldTripPath(fieldTrip);
		await this.clearFieldTripPathArrow(fieldTrip);

		_clearSequenceLine(fieldTrip);
		await this.clearSequenceLineArrow(fieldTrip);

		await this.drawFieldTripPath(fieldTrip, effectSequences);
		await this.drawSequenceLine(fieldTrip);

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

	FieldTripMapOperation.prototype.clearFieldTripPathArrow = async function(fieldTrip)
	{
		const self = this,
			{ DBID, FieldTripId } = _extractFieldTripFeatureFields(fieldTrip),
			edits = {},
			condition = _extractArrowCondition(DBID, FieldTripId);
			deleteArrows = await self._getPathArrowFeatures(condition);

		if (deleteArrows.length >= 0)
		{
			edits.deleteFeatures = deleteArrows;
		}

		await _pathArrowLayerInstance.layer.applyEdits(edits);
	}

	FieldTripMapOperation.prototype.clearSequenceLineArrow = async function(fieldTrip)
	{
		const self = this,
			{ DBID, FieldTripId } = _extractFieldTripFeatureFields(fieldTrip),
			edits = {},
			condition = _extractArrowCondition(DBID, FieldTripId);
			deleteArrows = await self._getSequenceLineArrowFeatures(condition);

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
					self._updateStopGraphicSequenceLabel(stop);
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

		self.drawHighlightStop(data, currentStop, AssignSequence);

		// show highlight line
		let fieldTripStops = null;
		if (!!currentStop)
		{
			fieldTripStops = [previousStop, currentStop, nextStop].filter(item => item);
		}
		else
		{
			// create stop
			const highlightStop = self.getHighlightStop();
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
		await self.drawHighlightFeatures(params, paths, stops, isToFieldTripVisible);
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

	FieldTripMapOperation.prototype.drawHighlightFeatures = async function(data, paths, stops, isShowHighlightPath)
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

	FieldTripMapOperation.prototype.drawHighlightStop = function(data, currentStop, sequence)
	{
		const self = this, isEditStop = !!currentStop;
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

		const highlightStop = self.getHighlightStop();
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

	FieldTripMapOperation.prototype.getHighlightStop = function()
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
				const newStopData = await self._createGeocodingNewStop(longitude, latitude);
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

	FieldTripMapOperation.prototype.drawStops = function(fieldTrip)
	{
		const DEFAULT_STOP_VISIBILITY = false,
		 	color = _getFieldTripColor(fieldTrip),
			Color = color,
			{ DBID, FieldTripId } = _extractFieldTripFeatureFields(fieldTrip);

		let Sequence = null, Name = null, CurbApproach = 0, attributes = null, id = 0;
		if (fieldTrip.FieldTripStops.length === 0)
		{
			Sequence = 1;
			id = TF.createId();
			Name = fieldTrip.SchoolName;
			attributes = {DBID, FieldTripId, id, Name, CurbApproach, Sequence, Color};
			const school = TF.RoutingPalette.FieldTripMap.StopGraphicWrapper.CreateStop(fieldTrip.SchoolXCoord, fieldTrip.SchoolYCoord, attributes);

			Sequence = 2;
			id = TF.createId();
			Name = fieldTrip.Destination;
			attributes = {DBID, FieldTripId, id, Name, CurbApproach, Sequence, Color};
			const destination = TF.RoutingPalette.FieldTripMap.StopGraphicWrapper.CreateStop(fieldTrip.FieldTripDestinationXCoord, fieldTrip.FieldTripDestinationYCoord, attributes);

			_stopLayerInstance?.addStops([destination, school]);
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
				const graphic = TF.RoutingPalette.FieldTripMap.StopGraphicWrapper.CreateStop(stop.XCoord, stop.YCoord, attributes, DEFAULT_STOP_VISIBILITY);
				graphics.push(graphic);
			}

			_stopLayerInstance?.addStops(graphics);
		}
	}

	const _drawStops = (DBID, FieldTripId, Color, fieldTripRoute) =>
	{
		const DEFAULT_STOP_VISIBILITY = false,
			routeStops = fieldTripRoute.getRouteStops(),
			graphics = [];

		for (let i = routeStops.length - 1; i >=0; i--)
		{
			const stop = routeStops[i],
				attributes = {
					DBID,
					FieldTripId,
					id: stop.Id,
					Name: stop.Street,
					CurbApproach: stop.CurbApproach,
					Sequence: stop.Sequence,
					Color
				};
			// hide by default for UX.
			const graphic = TF.RoutingPalette.FieldTripMap.StopGraphicWrapper.CreateStop(stop.Longitude, stop.Latitude, attributes, null, DEFAULT_STOP_VISIBILITY);
			graphics.push(graphic);
		}

		_stopLayerInstance.addStops(graphics);
	}

	FieldTripMapOperation.prototype.drawFieldTripPath = async function(fieldTrip, effectSequences)
	{
		const routePath = await this._updateRoutepathAndDirection(fieldTrip, effectSequences);
		
		if (!routePath)
		{
			return;
		}

		_calculatePathAttributesAndDraw(fieldTrip, routePath);
	}

	FieldTripMapOperation.prototype._drawFieldTripPath = async function(fieldTrip, fieldTripRoute)
	{
		fieldTripRoute.reset();
		await fieldTripRoute.compute();

		const routePath = fieldTripRoute.getRoutePaths();
		if (routePath.length === 0)
		{
			return;
		}

		const data = { fieldTrip };
		await this.mapInstance.fireCustomizedEvent({ eventType: TF.RoutingPalette.FieldTripMapEventEnum.DirectionUpdated, data });

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

		for (let i = 0; i < routePath.length; i++)
		{
			// draw route path split by stop.
			const stopPath = routePath[i];
			const pathAttributes = fieldTrip.routePathAttributes;
			// hide by default for UX.
			const graphic = TF.RoutingPalette.FieldTripMap.PathGraphicWrapper.CreatePath([stopPath], pathAttributes, false);
			_pathLayerInstance.addPath(graphic);
		}
	}

	FieldTripMapOperation.prototype.drawSequenceLine = async function(fieldTrip)
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

	const _getArrowRenderer = (fieldTrips, arrowOnPath) =>
	{
		const uniqueValueInfos = [];

		for (let i = 0; i < fieldTrips.length; i++)
		{
			const fieldTrip = fieldTrips[i],
				value = _getFieldTripColor(fieldTrip),
				{ DBID, FieldTripId } = _extractFieldTripFeatureFields(fieldTrip),
				description = _extractArrowCondition(DBID,  FieldTripId),
				symbol = _arrowLayerHelper.getArrowSymbol(arrowOnPath, value);
			uniqueValueInfos.push({ value, symbol, description });
		}

		return _arrowLayerHelper.createUniqueValueRenderer(uniqueValueInfos);
	}

	const _getSortedFieldTrips = (fieldTrips) =>
	{
		const fieldTripsClone = [...fieldTrips];
		fieldTripsClone.sort(_compareFieldTripNames);

		return fieldTripsClone;
	};

	FieldTripMapOperation.prototype.updateArrowRenderer = function()
	{
		const fieldTrips = _getSortedFieldTrips(this.fieldTripsData);
		const arrowOnPath = this._isArrowOnPath();
		const arrowRenderer = _getArrowRenderer(fieldTrips, arrowOnPath);
		_pathArrowLayerInstance.setRenderer(arrowRenderer);
		_sequenceLineArrowLayerInstance.setRenderer(arrowRenderer);
	}

	FieldTripMapOperation.prototype.redrawPathArrowLayer = async function(_, data = {}, fieldTrips = null)
	{
		const self = this;
		if (self.pathLineType === TF.RoutingPalette.FieldTripEnum.PATH_TYPE.SEQUENCE_LINE)
		{
			return;
		}

		const fieldTripsData = fieldTrips || self.fieldTripsData,
			arrowLayerInstance = _pathArrowLayerInstance,
			pathFeatures = _getPathFeatures();

		arrowLayerInstance.hide();
		await self._redrawArrowLayer(fieldTripsData, arrowLayerInstance, pathFeatures, data);
		const expression = self._calculateArrowLayerExpression();
		_setFieldTripPathArrowVisibility(expression);
		arrowLayerInstance.show();
	}

	FieldTripMapOperation.prototype.redrawSequenceArrowLayer = async function(_, data, fieldTrips = null)
	{
		const self = this;
		if (self.pathLineType === TF.RoutingPalette.FieldTripEnum.PATH_TYPE.PATH_LINE)
		{
			return;
		}

		const fieldTripsData = fieldTrips || self.fieldTripsData,
			arrowLayerInstance = _sequenceLineArrowLayerInstance,
			sequenceLineFeatures = _getSequenceLineFeatures();

		arrowLayerInstance.hide();
		await self._redrawArrowLayer(fieldTripsData, arrowLayerInstance, sequenceLineFeatures, data);
		const expression = self._calculateArrowLayerExpression();
		_setFieldTripSequenceLineArrowVisibility(expression);
		arrowLayerInstance.show();
	}

	FieldTripMapOperation.prototype._redrawArrowLayer = async function(fieldTrips, arrowLayerInstance, pathFeatures, data)
	{
		const self = this;
		const arrowOnPath = self._isArrowOnPath();

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

	FieldTripMapOperation.prototype._getVisibleFieldTrips = function()
	{
		return this.fieldTripsData.filter(item => item.visible);
	}

	const _setFieldTripSequenceLineArrowVisibility = (expression) => _sequenceLineArrowLayerInstance.setLayerDefinitionExpression(expression);

	FieldTripMapOperation.prototype._calculateArrowLayerExpression = function()
	{
		const self = this,
			visibleFieldTrips = self._getVisibleFieldTrips(),
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

	FieldTripMapOperation.prototype._getPathArrowFeatures = async function(condition = '1 = 1')
	{
		return await this._getArrowFeatures(_pathArrowLayerInstance, condition);
	}

	const _getSequenceLineFeatures = () => _sequenceLineLayerInstance?.getFeatures();

	FieldTripMapOperation.prototype._getSequenceLineArrowFeatures = async function(condition = '1 = 1')
	{
		return await this._getArrowFeatures(_sequenceLineArrowLayerInstance, condition);
	}

	FieldTripMapOperation.prototype._getArrowFeatures = async function(arrowLayerInstance, condition = '1 = 1')
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


	//#region Manage FieldTripRoute

	const _createFieldTripRoute = (fieldTrip) =>
	{
		const fieldTripRoute = new TF.GIS.ADT.FieldTripRoute(fieldTrip);
		_fieldTripRoutes.push(fieldTripRoute);
		return fieldTripRoute;
	}

	const _findFieldTripRoute = (fieldTripId) => _fieldTripRoutes.find(item => item.Id === fieldTripId);

	const _getFieldTripRoute = (fieldTrip) =>
	{
		let fieldTripRoute = _findFieldTripRoute(fieldTrip.id);
		if (fieldTripRoute === undefined)
		{
			fieldTripRoute = _createFieldTripRoute(fieldTrip);
		}
		return fieldTripRoute;
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
(function()
{
	createNamespace("TF.RoutingPalette").FieldTripMap = FieldTripMap;

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

	let _allFieldTrips = null;
	let _pathLineType = null;

	//#endregion

	function FieldTripMap(mapInstance)
	{
		this.mapInstance = mapInstance;

		_arrowLayerHelper = new TF.GIS.ArrowLayerHelper(mapInstance);
		_layerManager = new TF.GIS.LayerManager(mapInstance);
		_initPathType();
	}

	Object.defineProperty(FieldTripMap.prototype, 'PathLineType', {
		get() { return _pathLineType; },
		set(value)
		{
			_pathLineType = value;
		},
		enumerable: false,
		configurable: false
	});

	//#region Public Methods

	FieldTripMap.prototype.initLayers = async function()
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
	};

	FieldTripMap.prototype.initArrowLayers = function(sortedFieldTrips)
	{
		const self = this;
		_disposeArrowLayers(self.mapInstance);

		const arrowRenderer = _getArrowRenderer(sortedFieldTrips);

		const pathArrowLayerOptions = {
			id: FieldTripMap_PathArrowLayerId,
			index: FieldTripMap_PathArrowLayer_Index,
			renderer: arrowRenderer,
			eventHandlers: {
				redraw: _redrawPathArrowLayer
			}
		};
		_pathArrowLayerInstance = new TF.GIS.Layer.PathArrowLayer(self.mapInstance, pathArrowLayerOptions);
		self.mapInstance.addLayerInstance(_pathArrowLayerInstance);

		const sequenceArrowLayerOptions = {
			id: FieldTripMap_SequenceLineArrowLayerId,
			index: FieldTripMap_SequenceLineArrowLayer_Index,
			renderer: arrowRenderer,
			eventHandlers: {
				redraw: _redrawSequenceArrowLayer
			}
		};
		_sequenceLineArrowLayerInstance = new TF.GIS.Layer.PathArrowLayer(self.mapInstance, sequenceArrowLayerOptions);
		self.mapInstance.addLayerInstance(_sequenceLineArrowLayerInstance);
	};

	FieldTripMap.prototype.initRoute = function(fieldTrip)
	{
		return _getFieldTripRoute(fieldTrip);
	};

	FieldTripMap.prototype.addRoute = async function(DBID, FieldTripId, fieldTripRoute)
	{
		_drawRouteStops(DBID, FieldTripId, fieldTripRoute);

		await fieldTripRoute.compute();

		if (!fieldTripRoute.IsEmpty)
		{
			await _drawRoutePaths(DBID, FieldTripId, fieldTripRoute);
		}

		await _drawSequenceLine(DBID, FieldTripId, fieldTripRoute);
	};

	FieldTripMap.prototype.removeRoute = async function(DBID, fieldTripId)
	{
		_removeRouteStop(DBID, fieldTripId);
		await _removeRoutePath(DBID, fieldTripId);
		await _removeRouteSequenceLine(DBID, fieldTripId);
	};

	FieldTripMap.prototype.updateArrowRenderer = function(sortedFieldTrips)
	{
		const arrowRenderer = _getArrowRenderer(sortedFieldTrips);
		_pathArrowLayerInstance.setRenderer(arrowRenderer);
		_sequenceLineArrowLayerInstance.setRenderer(arrowRenderer);
	};

	FieldTripMap.prototype.setFieldTripStopVisibility = function(fieldTrips)
	{
		const stopFeatures = _getStopFeatures();
		_setFieldTripLayerVisibility(fieldTrips, _stopLayerInstance, stopFeatures);
	};

	FieldTripMap.prototype.redrawArrowLayer = async function(allFieldTrips, fieldTrips)
	{
		switch (_pathLineType)
		{
			case TF.RoutingPalette.FieldTripEnum.PATH_TYPE.PATH_LINE:
				await _redrawPathArrowLayer(null, {}, fieldTrips, allFieldTrips);
				break;
			case TF.RoutingPalette.FieldTripEnum.PATH_TYPE.SEQUENCE_LINE:
				await _redrawSequenceArrowLayer(null, {}, fieldTrips, allFieldTrips);
				break;
		}
	};

	FieldTripMap.prototype.updateFieldTripPathVisibility = async function(fieldTripsData, fieldTrips)
	{
		const expression = _calculateArrowLayerExpression(fieldTripsData);

		_setFieldTripPathVisibility(fieldTrips);
		_setFieldTripPathArrowVisibility(expression);

		_setFieldTripSequenceLineVisibility(fieldTrips);
		_setFieldTripSequenceLineArrowVisibility(expression);

		// verify
		_setFieldTripHighlightLayerVisibility(fieldTrips);
	};

	FieldTripMap.prototype.reorderFeatures = async function(sortedFieldTrips)
	{
		const sortedStopFeatures = _sortStopFeaturesByFieldTrips(sortedFieldTrips),
		sortedPathFeatures = _sortPathFeaturesByFieldTrips(sortedFieldTrips),
		sortedSequenceLineFeatures = _sortSequenceLineFeaturesByFieldTrips(sortedFieldTrips);
		// update map features
		await _stopLayerInstance.clearLayer();
		await _stopLayerInstance.addMany(sortedStopFeatures);

		await _pathLayerInstance.clearLayer();
		await _pathLayerInstance.addMany(sortedPathFeatures);

		await _sequenceLineLayerInstance.clearLayer();
		await _sequenceLineLayerInstance.addMany(sortedSequenceLineFeatures);
	};

	FieldTripMap.prototype.zoomToLayers = function(fieldTrips)
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
	};

	FieldTripMap.prototype.zoomToRouteStop = function(fieldTripId, stopSequence)
	{
		const fieldTripRoute = _findFieldTripRoute(fieldTripId),
			routeStops = fieldTripRoute.getRouteStops(),
			routeStop = routeStops.find(item => item.Sequence === stopSequence);

		this.mapInstance.centerAndZoom(routeStop.Longitude, routeStop.Latitude);
	};

	FieldTripMap.prototype.onPathTypeChanged = async function(sortedFieldTrips, fieldTrips)
	{
		_pathArrowLayerInstance.hide();
		_sequenceLineArrowLayerInstance.hide();

		this.updateArrowRenderer(sortedFieldTrips);

		await this.redrawArrowLayer(sortedFieldTrips, fieldTrips);
		await this.updateFieldTripPathVisibility(sortedFieldTrips, fieldTrips);
	};

	FieldTripMap.prototype.updateRouteColor = async function(fieldTrip, allFieldTrips)
	{
		const createStopSymbol = TF.RoutingPalette.FieldTripMap.StopGraphicWrapper.GetSymbol;
		const createPathSymbol = TF.RoutingPalette.FieldTripMap.PathGraphicWrapper.GetSymbol;
		
		const color = _getFieldTripColor(fieldTrip),
			{ DBID, FieldTripId } = _extractFieldTripFeatureFields(fieldTrip),
			stopFeatures = _getStopFeatures(),
			pathFeatures = _getPathFeatures(),
			sequenceLineFeatures = _getSequenceLineFeatures(),
			fieldTripHighlightFeatures = _getHighlightFeatures();

		const fieldTripStops = _queryMapFeatures(stopFeatures, DBID, FieldTripId);
		_stopLayerInstance.updateColor(fieldTripStops, color, createStopSymbol);

		const fieldTripPaths = _queryMapFeatures(pathFeatures, DBID, FieldTripId);
		_pathLayerInstance.updateColor(fieldTripPaths, color, createPathSymbol);

		const fieldTripSequenceLines = _queryMapFeatures(sequenceLineFeatures, DBID, FieldTripId);
		_sequenceLineLayerInstance.updateColor(fieldTripSequenceLines, color, createPathSymbol);

		// verify
		const fieldTripHighlights = _queryMapFeatures(fieldTripHighlightFeatures, DBID, FieldTripId);
		// prevent update highlight path symbol.
		const highlightLines = fieldTripHighlights.filter(item => item.geometry.type === TF.GIS.GeometryEnum.GEOMETRY_TYPE.POLYLINE && item.symbol.color.a === 1);
		_sequenceLineLayerInstance.updateColor(highlightLines, color, createPathSymbol);

		// update path arrow color
		const condition = _extractArrowCondition(DBID, FieldTripId);
		const arrowOnPath = _isArrowOnPath();
		_updatePathArrowFeatureColor(_pathArrowLayerInstance, condition, color, arrowOnPath);
		_updatePathArrowFeatureColor(_sequenceLineArrowLayerInstance, condition, color, arrowOnPath);

		await _redrawPathArrowLayer(null, {}, [fieldTrip], allFieldTrips);
		await _redrawSequenceArrowLayer(null, {}, [fieldTrip], allFieldTrips);
	};

	FieldTripMap.prototype.updateRouteStopSequence = function(DBID, FieldTripId, stops)
	{
		const stopFeatures = _getStopFeatures().filter(f => f.attributes.DBID === DBID && f.attributes.FieldTripId === FieldTripId);

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

	FieldTripMap.prototype.updateRouteStopAttribute = function(DBID, fieldTripStopId, fromFieldTripId, toFieldTripId, toStopSequence, color, visible)
	{
		const stopFeatures = _getStopFeatures().filter(f => f.attributes.DBID === DBID &&
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
			if (visible !== undefined)
			{
				feature.visible = visible;
			}
		}
	};

	/**
	 * Click stop info, show focus stop on map.
	 * (Verify)
	 * @param {*} data 
	 * @param {*} fieldTripsData 
	 * @returns None
	 */
	FieldTripMap.prototype.focusOnRouteStop = async function(data, fieldTripsData)
	{
		// avoid add duplicate features.
		await _highlightLayerInstance.clearLayer();

		const isAllFieldTripsInvisible = fieldTripsData.map(item => item.visible).every(item => item === false);
		if (isAllFieldTripsInvisible)
		{
			return;
		}

		const { toFieldTrip, previousStop, currentStop, nextStop, AssignSequence } = data;
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
		const isToFieldTripVisible = toFieldTrip.visible;
		await _drawHighlightFeatures(params, paths, stops, isToFieldTripVisible);
	};

	FieldTripMap.prototype.unfocusedRouteStop = async function()
	{
		await _highlightLayerInstance.clearLayer();

		await _highlightStopLayerInstance.clearLayer();
	};

	FieldTripMap.prototype.quickAddStops = function(stops)
	{
		if (stops.length === 1)
		{
			const stopGraphic = createNewStop(stops[0]);
			_addHighlightStops(stopGraphic);
		}
		else
		{
			_highlightQuickAddStops(stops);
		}
	};

	FieldTripMap.prototype.deleteRouteStops = async function(DBID, fieldTripId, routeStopIds)
	{
		const fieldTripRoute = _findFieldTripRoute(fieldTripId);
		fieldTripRoute.removeRouteStops(routeStopIds);
		fieldTripRoute.refreshRouteStopSequence();
		fieldTripRoute.clearRoutePath();

		// refresh route on map.
		await this.removeRoute(DBID, fieldTripId);
		await this.addRoute(DBID, fieldTripId, fieldTripRoute);
	};



	FieldTripMap.prototype.dispose = function()
	{
		if (_arrowLayerHelper)
		{
			_arrowLayerHelper.dispose();
			_arrowLayerHelper = null;
		}

		_disposeLayers();

		_layerManager = null;
	};

	//#endregion

	//#region Private Methods

	const _initPathType = () =>
	{
		_pathLineType = tf.storageManager.get('pathLineType') === TF.RoutingPalette.FieldTripEnum.PATH_TYPE.SEQUENCE_LINE ?
			TF.RoutingPalette.FieldTripEnum.PATH_TYPE.SEQUENCE_LINE : TF.RoutingPalette.FieldTripEnum.PATH_TYPE.PATH_LINE;
	};

	const _disposeLayers = () =>
	{
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

		_stopLayerInstance = null;
		_pathLayerInstance = null;
		_sequenceLineLayerInstance = null;
		_highlightLayerInstance = null;
		_highlightStopLayerInstance = null;
		_pathArrowLayerInstance = null;
		_sequenceLineArrowLayerInstance = null;
	};

	const _disposeArrowLayers = (mapInstance) =>
	{
		if (_pathArrowLayerInstance && _sequenceLineArrowLayerInstance)
		{
			mapInstance.removeLayer(FieldTripMap_PathArrowLayerId);
			_pathArrowLayerInstance.dispose();
			_pathArrowLayerInstance = null;

			mapInstance.removeLayer(FieldTripMap_SequenceLineArrowLayerId);
			_sequenceLineArrowLayerInstance.dispose();
			_sequenceLineArrowLayerInstance = null;
		}
	};

	const _getArrowRenderer = (fieldTrips) =>
	{
		const uniqueValueInfos = [];
		const arrowOnPath = _isArrowOnPath();

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
	};

	const _redrawPathArrowLayer = async (_, data = {}, fieldTrips = null, allFieldTrips) =>
	{
		if (_pathLineType === TF.RoutingPalette.FieldTripEnum.PATH_TYPE.SEQUENCE_LINE)
		{
			return;
		}

		if (allFieldTrips === undefined)
		{
			if (_allFieldTrips === null)
			{
				return;
			}

			allFieldTrips = _allFieldTrips;
		}
		else
		{
			_allFieldTrips = allFieldTrips;
		}

		const fieldTripsData = fieldTrips || allFieldTrips,
			arrowLayerInstance = _pathArrowLayerInstance,
			pathFeatures = _getPathFeatures();

		arrowLayerInstance.hide();

		await _redrawArrowLayer(fieldTripsData, arrowLayerInstance, pathFeatures, data);
		const expression = _calculateArrowLayerExpression(allFieldTrips);
		_setFieldTripPathArrowVisibility(expression);
		arrowLayerInstance.show();
	};

	const _redrawSequenceArrowLayer = async (_, data = {}, fieldTrips = null, allFieldTrips) =>
	{
		if (_pathLineType === TF.RoutingPalette.FieldTripEnum.PATH_TYPE.PATH_LINE)
		{
			return;
		}

		if (allFieldTrips === undefined)
		{
			// temporary solution
			if (_allFieldTrips === null)
			{
				return;
			}

			allFieldTrips = _allFieldTrips;
		}
		else
		{
			_allFieldTrips = allFieldTrips;
		}

		const fieldTripsData = fieldTrips || allFieldTrips,
			arrowLayerInstance = _sequenceLineArrowLayerInstance,
			sequenceLineFeatures = _getSequenceLineFeatures();

		arrowLayerInstance.hide();

		await _redrawArrowLayer(fieldTripsData, arrowLayerInstance, sequenceLineFeatures, data);
		const expression = _calculateArrowLayerExpression(allFieldTrips);
		_setFieldTripSequenceLineArrowVisibility(expression);
		arrowLayerInstance.show();
	};

	const _drawRouteStops = (DBID, FieldTripId, fieldTripRoute) =>
	{
		const DEFAULT_VISIBILITY = false,
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
					Color: fieldTripRoute.Color
				};
			const graphic = TF.RoutingPalette.FieldTripMap.StopGraphicWrapper.CreateStop(stop.Longitude, stop.Latitude, attributes, null, DEFAULT_VISIBILITY);
			graphics.push(graphic);
		}

		_stopLayerInstance.addStops(graphics);
	};

	const _drawRoutePaths = async (DBID, FieldTripId, fieldTripRoute) =>
	{
		const DEFAULT_VISIBILITY = false;
		const Color = fieldTripRoute.Color;
		const attributes = { DBID, FieldTripId, Color };
		
		const routePaths = fieldTripRoute.getRoutePaths();
		for (let i = 0; i < routePaths.length; i++)
		{
			const routePath = routePaths[i];
			// hide by default for UX.
			const graphic = TF.RoutingPalette.FieldTripMap.PathGraphicWrapper.CreatePath([routePath], {...attributes}, DEFAULT_VISIBILITY);
			_pathLayerInstance.addPath(graphic);
		}
	};

	const _drawSequenceLine = async (DBID, FieldTripId, fieldTripRoute) =>
	{
		return new Promise((resolve, reject) =>
		{
			const DEFAULT_VISIBILITY = false;
			const sequenceLine = _computeSequenceLine(fieldTripRoute);
			const attributes = { DBID, FieldTripId, Color: fieldTripRoute.Color };
			// hide by default for UX.
			const graphic = TF.RoutingPalette.FieldTripMap.PathGraphicWrapper.CreatePath(sequenceLine, attributes, DEFAULT_VISIBILITY);
			_sequenceLineLayerInstance?.addPath(graphic, () =>
			{
				resolve();
			});
		});
	};

	//#region Remove Map Features

	const _removeRouteStop = (DBID, fieldTripId) =>
	{
		const stopFeatures = _getStopFeatures();
		const features = _queryMapFeatures(stopFeatures, DBID, fieldTripId);
		_removeMapLayerFeatures(_stopLayerInstance, features);
	};

	const _removeRoutePath = async (DBID, fieldTripId) =>
	{
		const pathArrowFeatures = await _getPathArrowFeatures(),
			pathFeatures = _getPathFeatures();

		const arrowFeatures = _queryArrowFeatures(pathArrowFeatures, DBID, fieldTripId);
		_removeMapLayerFeatures(_pathArrowLayerInstance, arrowFeatures);

		const features = _queryMapFeatures(pathFeatures, DBID, fieldTripId);
		_removeMapLayerFeatures(_pathLayerInstance, features);
	};

	const _removeRouteSequenceLine = async (DBID, fieldTripId) =>
	{
		const sequenceLineArrowFeatures = await _getSequenceLineArrowFeatures(),
			sequenceLineFeatures = _getSequenceLineFeatures();

		const arrowFeatures = _queryArrowFeatures(sequenceLineArrowFeatures, DBID, fieldTripId);
		_removeMapLayerFeatures(_sequenceLineArrowLayerInstance, arrowFeatures);

		const features = _queryMapFeatures(sequenceLineFeatures, DBID, fieldTripId);
		_removeMapLayerFeatures(_sequenceLineLayerInstance, features);
	};

	const _removeMapLayerFeatures = (layerInstance, removeFeatures) => layerInstance.removeMany(removeFeatures);

	//#endregion


	//#region Query Map Features

	const _getStopFeatures = () => _stopLayerInstance.getFeatures();

	const _getPathFeatures = () => _pathLayerInstance.getFeatures();

	const _getHighlightFeatures = () => _highlightLayerInstance.getFeatures();

	const _getHighlightStopFeatures = () => _highlightStopLayerInstance?.getFeatures();

	const _getPathArrowFeatures = async (condition = '1 = 1') =>
	{
		return await _getArrowFeatures(_pathArrowLayerInstance, condition);
	};

	const _getSequenceLineFeatures = () => _sequenceLineLayerInstance?.getFeatures();

	const _getSequenceLineArrowFeatures = async (condition = '1 = 1') =>
	{
		return await _getArrowFeatures(_sequenceLineArrowLayerInstance, condition);
	};

	const _getArrowFeatures = async (arrowLayerInstance, condition = '1 = 1') =>
	{
		const queryResult = await arrowLayerInstance?.queryFeatures(null, condition);
		return queryResult.features || [];
	};

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
	};

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

	//#endregion

	//#region Visibility

	const _setFieldTripPathVisibility = (fieldTrips) =>
	{
		const pathFeatures = _getPathFeatures();
		const precondition = _pathLineType === TF.RoutingPalette.FieldTripEnum.PATH_TYPE.PATH_LINE;
		_setFieldTripLayerVisibility(fieldTrips, _pathLayerInstance, pathFeatures, precondition);
	};

	const _setFieldTripSequenceLineVisibility = (fieldTrips) =>
	{
		const sequenceLineFeatures = _getSequenceLineFeatures();
		const precondition = _pathLineType === TF.RoutingPalette.FieldTripEnum.PATH_TYPE.SEQUENCE_LINE;
		_setFieldTripLayerVisibility(fieldTrips, _sequenceLineLayerInstance, sequenceLineFeatures, precondition);
	};

	const _setFieldTripHighlightLayerVisibility = (fieldTrips) =>
	{
		const fieldTripHighlightFeatures = _getHighlightFeatures();
		_setFieldTripLayerVisibility(fieldTrips, _highlightLayerInstance, fieldTripHighlightFeatures);

		const fieldTripHighlightStopFeatures = _getHighlightStopFeatures();
		_setFieldTripLayerVisibility(fieldTrips, _highlightStopLayerInstance, fieldTripHighlightStopFeatures);
	};

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
	};

	const _setFieldTripPathArrowVisibility = (expression) => _pathArrowLayerInstance.setLayerDefinitionExpression(expression);

	const _setFieldTripSequenceLineArrowVisibility = (expression) => _sequenceLineArrowLayerInstance.setLayerDefinitionExpression(expression);

	//#endregion

	//#region Sorting

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
	};

	const _sortPathFeaturesByFieldTrips = (sortedFieldTrips) =>
	{
		const pathFeatures = _getPathFeatures();
		return _sortLineFeatures(sortedFieldTrips, pathFeatures);
	};

	const _sortSequenceLineFeaturesByFieldTrips = (sortedFieldTrips) =>
	{
		const sequenceLineFeatures = _getSequenceLineFeatures();
		return _sortLineFeatures(sortedFieldTrips, sequenceLineFeatures);
	};

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
	};

	//#endregion

	//#region Arrow

	const _isArrowOnPath = () => _pathLineType === TF.RoutingPalette.FieldTripEnum.PATH_TYPE.SEQUENCE_LINE;

	const _redrawArrowLayer = async (fieldTrips, arrowLayerInstance, pathFeatures, data) =>
	{
		const arrowOnPath = _isArrowOnPath();
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
	};

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
	};

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
	};

	const _updatePathArrowFeatureColor = (arrowLayerInstance, condition, color, arrowOnPath) =>
	{
		const layerRenderer = arrowLayerInstance.getRenderer().clone();
		const valueInfo = layerRenderer.uniqueValueInfos.filter(item => item.description === condition)[0];
		valueInfo.value = color;
		valueInfo.symbol = _arrowLayerHelper.getArrowSymbol(arrowOnPath, color);

		arrowLayerInstance.setRenderer(layerRenderer);
	};

	//#endregion

	//#region Highlight

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

	//#endregion

	//#region (Quick) Add Stop(s)

	const _highlightQuickAddStops = (stops) =>
	{
		const graphics = [];
		for (let index = 0; index < stops.length; index++)
		{
			const stop = stops[index];
			const graphic = createNewStop(stop);
			graphics.push(graphic);
		}

		_highlightStopLayerInstance.addStops(graphics);
	}

	const _addHighlightStops = (stopGraphic) =>
	{
		const highlightStop = _getHighlightStop();

		let newStopGraphic = null;
		if (highlightStop)
		{
			newStopGraphic = highlightStop;
			newStopGraphic.geometry = stopGraphic.geometry;
			newStopGraphic.attributes.Name = stopGraphic.attributes.Name;
		}
		else
		{
			newStopGraphic = stopGraphic;
			_highlightStopLayerInstance.addStops([newStopGraphic]);
		}
	}

	const createNewStop = (stop) => _createNewStop(stop.XCoord, stop.YCoord, stop.Street);

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

	//#endregion

	//#region FieldTrip

	const _getVisibleFieldTrips = (fieldTripsData) => fieldTripsData.filter(item => item.visible);

	const _getFieldTripColor = (fieldTrip) => fieldTrip.color;

	const _extractFieldTripFeatureFields = (fieldTrip) =>
	{
		const DBID = fieldTrip.DBID,
			FieldTripId = fieldTrip.oldId || fieldTrip.id;

		return { DBID, FieldTripId };
	};

	const _extractArrowCondition = (DBID, fieldTripId) => `DBID = ${DBID} and id = ${fieldTripId}`;


	//#endregion

	//#region FieldTripRoute

	const _createFieldTripRoute = (fieldTrip) =>
	{
		const fieldTripRoute = new TF.GIS.ADT.FieldTripRoute(fieldTrip);
		_fieldTripRoutes.push(fieldTripRoute);
		return fieldTripRoute;
	};

	const _findFieldTripRoute = (fieldTripId) => _fieldTripRoutes.find(item => item.Id === fieldTripId);

	const _getFieldTripRoute = (fieldTrip) =>
	{
		let fieldTripRoute = _findFieldTripRoute(fieldTrip.id);
		if (fieldTripRoute === undefined)
		{
			fieldTripRoute = _createFieldTripRoute(fieldTrip);
		}
		return fieldTripRoute;
	};

	const _computeSequenceLine = (fieldTripRoute) =>
	{
		const paths = [];
		const routeStops = fieldTripRoute.getRouteStops()

		for (let i = 0; i < routeStops.length; i++)
		{
			const stop = routeStops[i];
			paths.push([stop.Longitude, stop.Latitude]);
		}

		return paths;
	};

	//#endregion

	//#endregion
})();
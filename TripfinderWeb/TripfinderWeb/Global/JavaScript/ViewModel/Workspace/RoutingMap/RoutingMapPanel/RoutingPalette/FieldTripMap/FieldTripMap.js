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

	FieldTripMap.prototype.addRoute = async function(DBID, FieldTripId, color, fieldTripRoute)
	{
		_drawRouteStops(DBID, FieldTripId, color, fieldTripRoute);

		const routePaths = await _computeRoutePaths(fieldTripRoute);
		const isEmptyRoute = routePaths.length === 0;
		if (!isEmptyRoute)
		{
			await _drawRoutePaths(DBID, FieldTripId, color, routePaths);
		}

		await _drawSequenceLine(DBID, FieldTripId, color, fieldTripRoute);

		return isEmptyRoute;
	};

	FieldTripMap.prototype.removeRoute = async function(DBID, fieldTripId)
	{
		const stopFeatures = _getStopFeatures(),
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
			const features = _queryMapFeatures(mapFeaturesTable[i], DBID, fieldTripId);
			_removeMapLayerFeatures(mapLayerInstanceTable[i], features);
		}

		for (let i = 0; i < mapArrowFeaturesTable.length; i++)
		{
			const features = _queryArrowFeatures(mapArrowFeaturesTable[i], DBID, fieldTripId);
			_removeMapLayerFeatures(mapArrowLayerInstanceTable[i], features);
		}
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

	const _computeRoutePaths = async (fieldTripRoute) =>
	{
		fieldTripRoute.reset();
		await fieldTripRoute.compute();
		return fieldTripRoute.getRoutePaths();
	};

	const _drawRouteStops = (DBID, FieldTripId, Color, fieldTripRoute) =>
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
					Color
				};
			const graphic = TF.RoutingPalette.FieldTripMap.StopGraphicWrapper.CreateStop(stop.Longitude, stop.Latitude, attributes, null, DEFAULT_VISIBILITY);
			graphics.push(graphic);
		}

		_stopLayerInstance.addStops(graphics);
	};

	const _drawRoutePaths = async (DBID, FieldTripId, Color, routePaths) =>
	{
		const DEFAULT_VISIBILITY = false;
		const attributes = { DBID, FieldTripId, Color };

		for (let i = 0; i < routePaths.length; i++)
		{
			const routePath = routePaths[i];
			// hide by default for UX.
			const graphic = TF.RoutingPalette.FieldTripMap.PathGraphicWrapper.CreatePath([routePath], {...attributes}, DEFAULT_VISIBILITY);
			_pathLayerInstance.addPath(graphic);
		}
	};

	const _drawSequenceLine = async (DBID, FieldTripId, Color, fieldTripRoute) =>
	{
		return new Promise((resolve, reject) =>
		{
			const DEFAULT_VISIBILITY = false;
			const sequenceLine = _computeSequenceLine(fieldTripRoute);
			const attributes = { DBID, FieldTripId, Color };
			// hide by default for UX.
			const graphic = TF.RoutingPalette.FieldTripMap.PathGraphicWrapper.CreatePath(sequenceLine, attributes, DEFAULT_VISIBILITY);
			_sequenceLineLayerInstance?.addPath(graphic, () =>
			{
				resolve();
			});
		});
	};

	const _removeMapLayerFeatures = (layerInstance, removeFeatures) => layerInstance.removeMany(removeFeatures);

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
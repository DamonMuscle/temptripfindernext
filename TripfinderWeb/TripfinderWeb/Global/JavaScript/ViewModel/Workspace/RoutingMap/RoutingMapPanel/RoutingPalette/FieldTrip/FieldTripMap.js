
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
	const DEBUG_ROUTE = false;
	const DEBUG_ARROW = false;

	//#endregion

	function FieldTripMap(mapInstance)
	{
		this.symbol = new TF.Map.Symbol(),
		this.mapInstance = mapInstance;
		this._pathLineType = PATH_LINE_TYPE.Path;
		this.initLayers();
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

	FieldTripMap.prototype.setPathLineType = function(isSequencePath)
	{
		this.pathLineType = isSequencePath ? PATH_LINE_TYPE.Sequence : PATH_LINE_TYPE.Path;
	}

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

			self.fieldTripStopLayerInstance = addFieldTripMapLayer(RoutingPalette_FieldTripStopLayerId, RoutingPalette_FieldTripStopLayer_Index, resolve);
			self.defineReadOnlyProperty("fieldTripStopLayerInstance", this.fieldTripStopLayerInstance);
		});
	}

	FieldTripMap.prototype.initArrowLayers = function(fieldTrips)
	{
		const self = this;
		if (self.fieldTripPathArrowLayerInstance && self.fieldTripSequenceLineArrowLayerInstance)
		{
			self.mapInstance.removeLayer(RoutingPalette_FieldTripPathArrowLayerId);
			self.fieldTripPathArrowLayerInstance = null;

			self.mapInstance.removeLayer(RoutingPalette_FieldTripSequenceLineArrowLayerId);
			self.fieldTripSequenceLineArrowLayerInstance = null;
		}

		const renderer = self.getPathArrowRenderer(fieldTrips);
		self.fieldTripPathArrowLayerInstance = self.addPathArrowLayer(RoutingPalette_FieldTripPathArrowLayerId, RoutingPalette_FieldTripPathArrowLayer_Index, renderer);
		self.fieldTripSequenceLineArrowLayerInstance = self.addPathArrowLayer(RoutingPalette_FieldTripSequenceLineArrowLayerId, RoutingPalette_FieldTripSequenceLineArrowLayer_Index, renderer);
	}

	//#endregion

	//#region Interaction

	//#region - Edit / View Field Trips

	FieldTripMap.prototype.addFieldTrip = async function(fieldTrip)
	{
		this._sortBySequence(fieldTrip.FieldTripStops);

		this.drawStops(fieldTrip);

		if (DEBUG_ROUTE)
		{
			const routeResult = await this.calculateRoute(fieldTrip);
			this.drawFieldTripPath(fieldTrip, routeResult);

			const routeDirections = routeResult.directions;
			console.log(routeDirections);
		}

		this.drawSequenceLine(fieldTrip, () => {
			this.updateFieldTripPathVisible([fieldTrip]);
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
				DBID = fieldTrip.DBID,
				Id = fieldTrip.Id,
				visible = fieldTrip.visible;

			const fieldTripStops = this._queryMapFeatures(stopFeatures, DBID, Id);
			this._updateMapFeaturesVisible(fieldTripStops, visible);
		}
	}

	FieldTripMap.prototype.setFieldTripPathVisible = function(fieldTrips)
	{
		const pathFeatures = this._getPathFeatures();
		for (let i = 0; i < fieldTrips.length; i++)
		{
			const fieldTrip = fieldTrips[i],
				DBID = fieldTrip.DBID,
				Id = fieldTrip.Id,
				visible = this.pathLineType === PATH_LINE_TYPE.Path && fieldTrip.visible,
				fieldTripPaths = this._queryMapFeatures(pathFeatures, DBID, Id);

			this._updateMapFeaturesVisible(fieldTripPaths, visible);
		}
	}

	FieldTripMap.prototype.setFieldTripSequenceLineVisible = function(fieldTrips)
	{
		const sequenceLineFeatures = this._getSequenceLineFeatures();
		for (let i = 0; i < fieldTrips.length; i++)
		{
			const fieldTrip = fieldTrips[i],
				DBID = fieldTrip.DBID,
				Id = fieldTrip.Id,
				visible = this.pathLineType === PATH_LINE_TYPE.Sequence && fieldTrip.visible,
				fieldTripSequenceLines = this._queryMapFeatures(sequenceLineFeatures, DBID, Id);

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
			 	DBID = fieldTrip.DBID,
				Id = fieldTrip.Id;

			graphics = graphics.concat(this._queryMapFeatures(stopFeatures, DBID, Id));
			graphics = graphics.concat(this._queryMapFeatures(pathFeatures, DBID, Id));
			graphics = graphics.concat(this._queryMapFeatures(sequenceLineFeatures, DBID, Id));
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
		const DBID = fieldTrip.DBID,
			Id = fieldTrip.Id,
			stopFeatures = this._getStopFeatures(),
			pathArrowFeatures = await this._getPathArrowFeatures(),
			pathFeatures = this._getPathFeatures(),
			sequenceLineArrowFeatures = await this._getSequenceLineArrowFeatures(),
			sequenceLineFeatures = this._getSequenceLineFeatures(),
			mapFeaturesTable = [stopFeatures, pathArrowFeatures, pathFeatures, sequenceLineArrowFeatures, sequenceLineFeatures],
			mapLayerInstanceTable = [this.fieldTripStopLayerInstance, this.fieldTripPathArrowLayerInstance, this.fieldTripPathLayerInstance,
				this.fieldTripSequenceLineArrowLayerInstance, this.fieldTripSequenceLineLayerInstance];

		for (let i = 0; i < mapFeaturesTable.length; i++)
		{
			const features = this._queryMapFeatures(mapFeaturesTable[i], DBID, Id);
			this.removeMapLayerFeatures(mapLayerInstanceTable[i], features);
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
			DBID = fieldTrip.DBID,
			Id = fieldTrip.Id,
			stopFeatures = this._getStopFeatures(),
			pathFeatures = this._getPathFeatures(),
			sequenceLineFeatures = this._getSequenceLineFeatures();

		const fieldTripStops = this._queryMapFeatures(stopFeatures, DBID, Id);
		for (let i = 0; i < fieldTripStops.length; i++)
		{
			const stopFeature = fieldTripStops[i];
			stopFeature.symbol = this.symbol.tripStop(stopFeature.attributes.Sequence, color);
			stopFeature.attributes.Color = color;
		}

		const fieldTripPaths = this._queryMapFeatures(pathFeatures, DBID, Id);
		this._updatePathGraphicColor(fieldTripPaths, color);

		const fieldTripSequenceLines = this._queryMapFeatures(sequenceLineFeatures, DBID, Id);
		this._updatePathGraphicColor(fieldTripSequenceLines, color);

		const description = `DBID = ${DBID}, Id = ${Id}`;
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
		// this.redrawFieldTripArrows(fieldTrips);

		this.setFieldTripPathVisible(fieldTrips);
		await this.setFieldTripPathArrowVisible(fieldTrips);

		this.setFieldTripSequenceLineVisible(fieldTrips);
		await this.setFieldTripSequenceLineArrowVisible(fieldTrips);
	}

	//#region TODO: Add / Insert Field Trip Stop

	//#endregion

	//#region TODO: Delete Field Trip Stop

	//#endregion

	//#region TODO: Geo Select Field Trip Stop

	//#endregion

	//#region TODO: Optimize Field Trip

	//#endregion

	//#region TODO: Refresh Field Trip Path

	//#endregion

	//#region TODO: RCM on Map

	//#endregion

	//#endregion

	//#endregion

	//#region Map Visualization

	FieldTripMap.prototype.drawStops = function(fieldTrip)
	{
		const self = this,
		 	color = self._getColor(fieldTrip),
			Color = color,
			DBID = fieldTrip.DBID,
			Id = fieldTrip.Id;

		if (fieldTrip.FieldTripStops.length === 0)
		{
			let Sequence = 2, attributes = {DBID, Id, Sequence, Color};
			let symbol = self.symbol.tripStop(Sequence, color);
			self.fieldTripStopLayerInstance?.addPoint(fieldTrip.FieldTripDestinationXCoord, fieldTrip.FieldTripDestinationYCoord, symbol, attributes);

			Sequence = 1, attributes = {DBID, Id, Sequence, Color};
			symbol = self.symbol.tripStop(Sequence, color);
			self.fieldTripStopLayerInstance?.addPoint(fieldTrip.SchoolXCoord, fieldTrip.SchoolYCoord, symbol, attributes);
		}
		else
		{
			const fieldTripStops = fieldTrip.FieldTripStops;

			for (let i = fieldTripStops.length - 1; i >= 0; i--)
			{
				const stop = fieldTripStops[i];
				let Sequence = stop.Sequence, attributes = {DBID, Id, Sequence, Color};
				let symbol = self.symbol.tripStop(Sequence, color);
				self.fieldTripStopLayerInstance?.addPoint(stop.XCoord, stop.YCoord, symbol, attributes);
			}
		}
	}

	FieldTripMap.prototype.drawFieldTripPath = function(fieldTrip, routeResult)
	{
		const routePath = this._computeRoutePath(routeResult);
		if (!routePath)
		{
			return;
		}

		const pathAttributes = this._computePathAttributes(fieldTrip, routeResult);
		const pathSymbol = this._computePathSymbol(fieldTrip);
		this.fieldTripPathLayerInstance?.addPolyline(routePath, pathSymbol, pathAttributes);
	}

	FieldTripMap.prototype.drawSequenceLine = function(fieldTrip, afterAdd = null)
	{
		const sequencePath = this._computeSequencePath(fieldTrip);
		const pathSymbol = this._computePathSymbol(fieldTrip);
		const DBID = fieldTrip.DBID,
			Id = fieldTrip.Id,
			Color = this._getColor(fieldTrip),
			attributes = { DBID, Id, Color };

		this.fieldTripSequenceLineLayerInstance?.addPolyline(sequencePath, pathSymbol, attributes, afterAdd);
	}

	//#region - Path Arrows

	FieldTripMap.prototype.addPathArrowLayer = function(layerId, layerIndex, renderer)
	{
		const self = this;
		const arrowLayer = self.mapInstance.addLayer({
			id: layerId,
			index: layerIndex,
			geometryType: self.mapInstance.GEOMETRY_TYPE.POINT,
			objectIdField: "oid",
			spatialReference: {
				wkid: self.mapInstance.WKID_WEB_MERCATOR
			},
			minScale: TF.Helper.MapHelper.zoomToScale(self.mapInstance.map, 13),
			fields: [
				{
					name: "oid",
					type: "oid"
				}, {
					name: "angle",
					type: "double"
				}, {
					name: "DBID",
					type: "integer"
				}, {
					name: "Id",
					type: "integer"
				}, {
					name: "Color",
					type: "string"
				}],
			source: [],
			renderer: renderer
		}, self.mapInstance.LAYER_TYPE.FEATURE);

		return arrowLayer;
	}

	FieldTripMap.prototype.getPathArrowRenderer = function(fieldTrips)
	{
		const uniqueValueInfos = [],
			arrowOnPath = this._isArrowOnPath();
		
		for (let i = 0; i < fieldTrips.length; i++)
		{
			const fieldTrip = fieldTrips[i],
				value = this._getColor(fieldTrip),
				DBID = fieldTrip.DBID,
				Id = fieldTrip.Id,
				description = `DBID = ${DBID}, Id = ${Id}`;
			const symbol = arrowOnPath ? this.symbol.arrow(value) : this.symbol.arrowOnSide(value);
			uniqueValueInfos.push({ value, symbol, description });
		}

		const renderer = {
			type: "unique-value",
			field: "Color",
			defaultSymbol: this.symbol.arrow([255, 255, 255, 0]),
			visualVariables: [{
				type: "rotation",
				field: "angle",
				rotationType: "geographic"
			}],
			uniqueValueInfos: uniqueValueInfos
		};

		return renderer;
	}

	FieldTripMap.prototype.redrawFieldTripArrows = async function(fieldTrips)
	{
		if (!DEBUG_ARROW)
		{
			return;
		}

		for (let i = 0; i < fieldTrips.length; i++)
		{
			const fieldTrip = fieldTrips[i];
			await this.drawFieldTripPathArrow(fieldTrip);
			await this.drawSequenceLineArrow(fieldTrip);
		}

		await this.setFieldTripPathArrowVisible(fieldTrips);
		await this.setFieldTripSequenceLineArrowVisible(fieldTrips);
	}

	FieldTripMap.prototype.drawFieldTripPathArrow = async function(fieldTrip)
	{
		const self = this,
			pathFeatures = self._getPathFeatures(),
			pathFeature = pathFeatures.filter(feature => feature.attributes.DBID === fieldTrip.DBID && feature.attributes.Id === fieldTrip.Id)[0],
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
		return;
	}

	FieldTripMap.prototype.drawSequenceLineArrow = async function(fieldTrip)
	{
		const self = this,
			sequenceLineFeatures = self._getSequenceLineFeatures(),
			lineFeature = sequenceLineFeatures.filter(feature => feature.attributes.DBID === fieldTrip.DBID && feature.attributes.Id === fieldTrip.Id)[0],
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
		const self = this,
			arrowOnPath = self._isArrowOnPath(),
			map = self.mapInstance.map,
			helper = TF.RoutingMap.MapEditingPalette.MyStreetsHelper;
		
		let arrows = [];

		if (!polylineFeature)
		{
			return arrows;
		}

		const DBID = polylineFeature.attributes.DBID,
			Id = polylineFeature.attributes.Id,
			Color = polylineFeature.attributes?.Color,
			attributes = { DBID, Id, Color },
			polyline = polylineFeature.geometry,
			paths = polyline.paths,
			unionPolyline = helper.multiPathsToSinglePath(map, paths);

		for (let j = 0; j < unionPolyline.length; j++)
		{
			const geometry = unionPolyline[j];
			const arrowGraphics = helper.createArrows(map, geometry, true, [255, 0, 0], arrowOnPath, true);

			for (let k = 0; k < arrowGraphics.length; k++)
			{
				const graphic = arrowGraphics[k];
				graphic.attributes = Object.assign({}, graphic.attributes, attributes);
			}
			arrows = arrows.concat(arrowGraphics);
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
			DBID = fieldTrip.DBID,
			Id = fieldTrip.Id,
			filterArrows = self._queryMapFeatures(baseArrowFeatures, DBID, Id),
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
		const DBID = fieldTrip.DBID,
			Color = this._getColor(fieldTrip),
			Id = fieldTrip.Id,
			route = routeResult?.route,
			attributes = Object.assign({}, route.attributes, {DBID, Id, Color});
		return attributes;
	}

	FieldTripMap.prototype._computePathSymbol = function(fieldTrip)
	{
		const color = fieldTrip.color;
		return this.symbol.tripPath(color);
	}

	FieldTripMap.prototype._computeSequencePath = function(fieldTrip)
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

	FieldTripMap.prototype.calculateRoute = async function(fieldTrip)
	{
		const networkService = TF.GIS.Analysis.getInstance().networkService;
		const stops = [], MIN_ROUTING_STOPS = 2;

		if (fieldTrip.FieldTripStops.length === 0)
		{
			const stop1 = {
				curbApproach: networkService.CURB_APPROACH.RIGHT_SIDE,
				name: fieldTrip.SchoolName,
				sequence: 1,
				longitude: fieldTrip.SchoolXCoord,
				latitude: fieldTrip.SchoolYCoord,
			}, stop2 = {
				curbApproach: networkService.CURB_APPROACH.RIGHT_SIDE,
				name: fieldTrip.Destination,
				sequence: 2,
				longitude: fieldTrip.FieldTripDestinationXCoord,
				latitude: fieldTrip.FieldTripDestinationYCoord,
			};
			stops.push(stop1);
			stops.push(stop2);
		}
		else
		{
			const fieldTripStops = fieldTrip.FieldTripStops;
			for (let i = 0; i < fieldTripStops.length; i++)
			{
				const stop = fieldTripStops[i];
				const stopObject = {
					curbApproach: networkService.CURB_APPROACH.RIGHT_SIDE,
					name: stop.Street,
					sequence: stop.Sequence,
					longitude: stop.XCoord,
					latitude: stop.YCoord,
				}
				stops.push(stopObject);
			}
		}

		if (stops.length < MIN_ROUTING_STOPS)
		{
			return null;
		}

		const stopFeatureSet = await networkService.createStopFeatureSet(stops);
		const params = {
			stops: stopFeatureSet,
		};
		const response = await networkService.solveRoute(params);

		const result = response?.results?.routeResults[0];
		return result;
	}

	//#endregion

	//#region Private Methods

	FieldTripMap.prototype._getStopFeatures = function()
	{
		return this.fieldTripStopLayerInstance?.layer.graphics.items || [];
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

	FieldTripMap.prototype._queryMapFeatures = function(features, DBID, Id)
	{
		const results = [];
		for (let i = 0; i < features.length; i++)
		{
			const feature = features[i];
			if (feature.attributes.DBID === DBID && feature.attributes.Id === Id)
			{
				results.push(feature);
			}
		}

		return results;
	}

	//#endregion

	FieldTripMap.prototype.dispose = function()
	{
		const self = this;

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
	}

})();
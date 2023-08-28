
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

	function FieldTripMap(mapInstance)
	{
		if (!mapInstance)
		{
			console.error("FieldTripMap constructor failed! No valid mapInstance.");
			return;
		}

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
		mapInstance.onMapViewKeyUpEvent.subscribe(this.onMapKeyUpEvent.bind(this));
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

	FieldTripMap.prototype.setPathLineType = function(type)
	{
		this.pathLineType = type;
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
		if (self.stopLayerInstance &&
			self.pathLayerInstance &&
			self.sequenceLineLayerInstance)
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

		self.pathLayerInstance = layerInstances[0];
		self.defineReadOnlyProperty("pathLayerInstance", self.pathLayerInstance);

		self.sequenceLineLayerInstance = layerInstances[1];
		self.defineReadOnlyProperty("sequenceLineLayerInstance", self.sequenceLineLayerInstance);

		self.stopLayerInstance = layerInstances[2];
		self.defineReadOnlyProperty("stopLayerInstance", self.stopLayerInstance);

		self.highlightLayerInstance = layerInstances[3];
		self.defineReadOnlyProperty("highlightLayerInstance", self.highlightLayerInstance);

		self.highlightStopLayerInstance = layerInstances[4];
		self.defineReadOnlyProperty("highlightStopLayerInstance", self.highlightStopLayerInstance);
	}

	FieldTripMap.prototype.initArrowLayers = function()
	{
		const self = this;
		if (!self.mapInstance)
		{
			return;
		}

		if (self.pathArrowLayerInstance && self.sequenceLineArrowLayerInstance)
		{
			self.mapInstance.removeLayer(RoutingPalette_FieldTripPathArrowLayerId);
			self.pathArrowLayerInstance.dispose();
			self.pathArrowLayerInstance = null;

			self.mapInstance.removeLayer(RoutingPalette_FieldTripSequenceLineArrowLayerId);
			self.sequenceLineArrowLayerInstance.dispose();
			self.sequenceLineArrowLayerInstance = null;
		}

		const arrowRenderer = self._getArrowRenderer();
		const pathArrowLayerOptions = {
			id: RoutingPalette_FieldTripPathArrowLayerId,
			index: RoutingPalette_FieldTripPathArrowLayer_Index,
			renderer: arrowRenderer,
			eventHandlers: {
				redraw: self.redrawPathArrowLayer.bind(self)
			}
		};
		self.pathArrowLayerInstance = new TF.GIS.Layer.PathArrowLayer(self.mapInstance, pathArrowLayerOptions);
		self.mapInstance.addLayerInstance(self.pathArrowLayerInstance);

		const sequenceArrowLayerOptions = {
			id: RoutingPalette_FieldTripSequenceLineArrowLayerId,
			index: RoutingPalette_FieldTripSequenceLineArrowLayer_Index,
			renderer: arrowRenderer,
			eventHandlers: {
				redraw: self.redrawSequenceArrowLayer.bind(self)
			}
		};
		self.sequenceLineArrowLayerInstance = new TF.GIS.Layer.PathArrowLayer(self.mapInstance, sequenceArrowLayerOptions);
		self.mapInstance.addLayerInstance(self.sequenceLineArrowLayerInstance);
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
		await self.stopLayerInstance.clearLayer();
		await self.stopLayerInstance.addMany(sortedStopFeatures);

		await self.pathLayerInstance.clearLayer();
		await self.pathLayerInstance.addMany(sortedPathFeatures);

		await self.sequenceLineLayerInstance.clearLayer();
		await self.sequenceLineLayerInstance.addMany(sortedSequenceLineFeatures);
	}

	FieldTripMap.prototype._compareFieldTripNames = function(a, b)
	{
		// get the field trip data from palette.
		// sort the result as same as palette.
		const paletteFieldTripsData = tf.pageManager.obPages()[0].data.routingPaletteViewModel.fieldTripPaletteSection.display.treeview.dataSource.data();
		const paletteNameData = paletteFieldTripsData.map(item => item.text);
		const aIndex = paletteNameData.findIndex(item => item === a.Name);
		const bIndex = paletteNameData.findIndex(item => item === b.Name);

		if (aIndex !== bIndex)
		{
			return aIndex - bIndex;
		}

		return a.id - b.id;
	}

	FieldTripMap.prototype._sortFieldTripByName = function(fieldTrips)
	{
		const self = this;
		const fieldTripIdMapping = fieldTrips.map(item =>
		{
			const { DBID, FieldTripId } = self._extractFieldTripFeatureFields(item);
			const data = {
				DBID: DBID,
				Name: item.Name,
				id: FieldTripId
			};
			return data;
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

		const expression = this._calculateArrowLayerExpression();
		this.setFieldTripPathVisibility(fieldTrips);
		this.setFieldTripPathArrowVisibility(expression);

		this.setFieldTripSequenceLineVisibility(fieldTrips);
		this.setFieldTripSequenceLineArrowVisibility(expression);

		this.setFieldTripHighlightLayerVisibility(fieldTrips);
	}

	FieldTripMap.prototype.setFieldTripStopVisibility = function(fieldTrips)
	{
		const stopFeatures = this._getStopFeatures();
		this._setFieldTripLayerVisibility(fieldTrips, this.stopLayerInstance, stopFeatures);
	}

	FieldTripMap.prototype.setFieldTripPathVisibility = function(fieldTrips)
	{
		const pathFeatures = this._getPathFeatures();
		const precondition = this.pathLineType === PATH_LINE_TYPE.Path;
		this._setFieldTripLayerVisibility(fieldTrips, this.pathLayerInstance, pathFeatures, precondition);
	}

	FieldTripMap.prototype.setFieldTripSequenceLineVisibility = function(fieldTrips)
	{
		const sequenceLineFeatures = this._getSequenceLineFeatures();
		const precondition = this.pathLineType === PATH_LINE_TYPE.Sequence;
		this._setFieldTripLayerVisibility(fieldTrips, this.sequenceLineLayerInstance, sequenceLineFeatures, precondition);
	}

	FieldTripMap.prototype.setFieldTripHighlightLayerVisibility = function(fieldTrips)
	{
		const fieldTripHighlightFeatures = this._getHighlightFeatures();
		this._setFieldTripLayerVisibility(fieldTrips, this.highlightLayerInstance, fieldTripHighlightFeatures);

		const fieldTripHighlightStopFeatures = this._getHighlightStopFeatures();
		this._setFieldTripLayerVisibility(fieldTrips, this.highlightStopLayerInstance, fieldTripHighlightStopFeatures);
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
		this.mapInstance.centerAndZoom(longitude, latitude);
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
			mapLayerInstanceTable = [this.stopLayerInstance,  this.pathLayerInstance, this.sequenceLineLayerInstance],
			mapArrowFeaturesTable = [pathArrowFeatures, sequenceLineArrowFeatures],
			mapArrowLayerInstanceTable = [this.pathArrowLayerInstance, this.sequenceLineArrowLayerInstance];

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
		layerInstance.removeMany(removeFeatures);
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
		this.stopLayerInstance.updateColor(fieldTripStops, color);

		const fieldTripPaths = this._queryMapFeatures(pathFeatures, DBID, FieldTripId);
		this.pathLayerInstance.updateColor(fieldTripPaths, color);

		const fieldTripSequenceLines = this._queryMapFeatures(sequenceLineFeatures, DBID, FieldTripId);
		this.sequenceLineLayerInstance.updateColor(fieldTripSequenceLines, color);

		const fieldTripHighlights = this._queryMapFeatures(fieldTripHighlightFeatures, DBID, FieldTripId);
		// prevent update highlight path symbol.
		const highlightLines = fieldTripHighlights.filter(item => item.geometry.type === "polyline" && item.symbol.color.a === 1);
		this.sequenceLineLayerInstance.updateColor(highlightLines, color);

		// update path arrow color
		const condition = this._extractArrowCondition(DBID, FieldTripId);
		this._updatePathArrowFeatureColor(this.pathArrowLayerInstance, condition, color);
		this._updatePathArrowFeatureColor(this.sequenceLineArrowLayerInstance, condition, color);
		this.redrawPathArrowLayer(null, {}, [fieldTrip]);
		this.redrawSequenceArrowLayer(null, {}, [fieldTrip]);
	}

	FieldTripMap.prototype._updatePathArrowFeatureColor = function(arrowLayerInstance, condition, color)
	{
		const arrowOnPath = this._isArrowOnPath();
		const layerRenderer = arrowLayerInstance.getRenderer().clone();
		const valueInfo = layerRenderer.uniqueValueInfos.filter(item => item.description === condition)[0];
		valueInfo.value = color;
		valueInfo.symbol = this.arrowLayerHelper.getArrowSymbol(arrowOnPath, color);

		arrowLayerInstance.setRenderer(layerRenderer);
	}

	//#endregion

	//#region - Switch Field Trip Path Type (Sequence Lines / Path Lines)

	FieldTripMap.prototype.switchPathType = async function(fieldTrips)
	{
		this.pathArrowLayerInstance.hide();
		this.sequenceLineArrowLayerInstance.hide();

		this.updateArrowRenderer();
		await this.updateFieldTripPathVisibility(fieldTrips);
	}

	FieldTripMap.prototype.updateFieldTripPathVisibility = async function(fieldTrips)
	{
		await this.redrawPathArrowLayer(null, {}, fieldTrips);
		await this.redrawSequenceArrowLayer(null, {}, fieldTrips);

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
		if (!this.editing.isAddingStop)
		{
			this.editing.isAddingStop = true;
			this.mapInstance.setMapCursor("crosshair");
		}
	}

	FieldTripMap.prototype.stopAddFieldTripStop = async function()
	{
		if (this.editing.isAddingStop)
		{
			this.editing.isAddingStop = false;
			this.mapInstance.setMapCursor("default");
		}
	}

	FieldTripMap.prototype.applyAddFieldTripStops = async function(stops, callback = ()=>{})
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

	FieldTripMap.prototype.highlightQuickAddStops = function(stops)
	{
		const self = this, graphics = [];
		for (let index = 0; index < stops.length; index++)
		{
			const stop = stops[index];
			const graphic = self.createNewStop(stop);
			graphics.push(graphic);
		}

		self.highlightStopLayerInstance.addStops(graphics);
	}

	FieldTripMap.prototype.addHighlightStops = function(addGraphic)
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
			self.highlightStopLayerInstance.addStops([newStopGraphic]);
		}
	}

	FieldTripMap.prototype.createNewStop = function(stop)
	{
		return this._createNewStop(stop.XCoord, stop.YCoord, stop.Street);
	}

	FieldTripMap.prototype._createNewStop = function(longitude, latitude, stopName)
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

	FieldTripMap.prototype._createGeocodingNewStop = async function(longitude, latitude)
	{
		const self = this,
		 	UNNAMED_ADDRESS = "unnamed",
			{ Address, City, RegionAbbr, CountryCode } = await self.highlightStopLayerInstance.getGeocodeStop(longitude, latitude),
			Name = Address || UNNAMED_ADDRESS,
			newStop = self._createNewStop(longitude, latitude, Name);

		return { Name, City, RegionAbbr, CountryCode, newStop, XCoord: +longitude.toFixed(6), YCoord: +latitude.toFixed(6) };
	}

	FieldTripMap.prototype._refreshStopsSequenceLabel = function(data)
	{
		const self = this,
			{ DBID, FieldTripId } = data[0],
			fieldTripStops = self._getStopFeatures(),
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

	FieldTripMap.prototype._drawNewStopsFromMap = function(data)
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

		self.stopLayerInstance.addStops(graphics);
	}

	FieldTripMap.prototype._updateStopGraphicSequenceLabel = function(stopGraphic)
	{
		const attributes = stopGraphic.attributes;
		stopGraphic.symbol = TF.RoutingPalette.FieldTripMap.StopGraphicWrapper.GetSymbol(attributes.Sequence, attributes.Color);
	}

	FieldTripMap.prototype._drawNewStopPathsFromMap = async function(data)
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

	FieldTripMap.prototype.refreshFieldTripPath = async function(fieldTrip, effectSequences, callZoomToLayers = true)
	{
		this.clearFieldTripPath(fieldTrip);
		await this.clearFieldTripPathArrow(fieldTrip);

		this.clearSequenceLine(fieldTrip);
		await this.clearSequenceLineArrow(fieldTrip);

		await this.addFieldTripPath(fieldTrip, effectSequences);
		await this.updateFieldTripPathVisibility([fieldTrip]);

		this.orderFeatures();
		if (callZoomToLayers)
		{
			this.zoomToFieldTripLayers([fieldTrip]);
		}
	}

	FieldTripMap.prototype.clearFieldTripPath = function(fieldTrip)
	{
		const self = this,
			{ DBID, FieldTripId } = self._extractFieldTripFeatureFields(fieldTrip),
			pathFeatures = self._getPathFeatures(),
			fieldTripPaths = self._queryMapFeatures(pathFeatures, DBID, FieldTripId);
		
		for (let i = 0; i < fieldTripPaths.length; i++)
		{
			self.pathLayerInstance.deletePath(fieldTripPaths[i]);
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
			self.sequenceLineLayerInstance.deletePath(sequenceLines[i]);
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

		await self.pathArrowLayerInstance.layer.applyEdits(edits);
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

		await self.sequenceLineArrowLayerInstance.layer.applyEdits(edits);
	}

	//#endregion

	//#region RCM on Map

	//#region Field Trip Stop

	//#region Move Stop Location

	FieldTripMap.prototype.moveStopLocation = async function(fieldTrip, stop, sketchTool)
	{
		const self = this;
		if (!self.stopLayerInstance || !sketchTool)
		{
			return;
		}

		if (self.editing.isMovingStop)
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

		self.stopLayerInstance?.moveStop(stopGraphic, sketchTool, function(movedStopData){
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
			this.mapInstance.fireCustomizedEvent({ eventType: TF.RoutingPalette.FieldTripMapEventEnum.MoveStopLocationCompleted, data });
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
				self.stopLayerInstance.deleteStop(stopFeature);
			});
		}
	}
	//#endregion

	//#region Delete Stop

	FieldTripMap.prototype.deleteStopLocation = async function(fieldTrip, stop)
	{
		const self = this;
		if (!self.stopLayerInstance)
		{
			return;
		}

		self.showLoadingIndicator();

		self.stopAddFieldTripStop();

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
					self.stopLayerInstance.deleteStop(stop);
				}
				else if (attributes.Sequence > sequence)
				{
					attributes.Sequence -= 1;
					self._updateStopGraphicSequenceLabel(stop);
				}
			}
		}

		const data = { fieldTripStopId: stop.id };
		this.mapInstance.fireCustomizedEvent({ eventType: TF.RoutingPalette.FieldTripMapEventEnum.DeleteStopLocationCompleted, data });

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
				stopFeature.symbol = TF.RoutingPalette.FieldTripMap.StopGraphicWrapper.GetSymbol(stop.Sequence, stopFeature.attributes.Color);
			}
		});
	};
	//#endregion

	//#region Stop Info

	FieldTripMap.prototype.addHighlightFeatures = async function(data)
	{
		const self = this;
		if (!self.stopLayerInstance ||
			!self.pathLayerInstance ||
			!self.highlightLayerInstance ||
			!self.highlightStopLayerInstance)
		{
			return;
		}

		// avoid add duplicate features.
		await self.highlightLayerInstance.clearLayer();

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
			await self.highlightStopLayerInstance.clearLayer();
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

	FieldTripMap.prototype.clearHighlightFeatures = async function()
	{
		const self = this;
		if (!self.highlightLayerInstance)
		{
			return;
		}

		await self.highlightLayerInstance.clearLayer();

		await self.highlightStopLayerInstance.clearLayer();
	}

	FieldTripMap.prototype.drawHighlightFeatures = async function(data, paths, stops, isShowHighlightPath)
	{
		const self = this;
		if (!self.pathLayerInstance)
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

		await self.highlightLayerInstance.addMany(highlightGraphics);
	}

	FieldTripMap.prototype.drawHighlightStop = function(data, currentStop, sequence)
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
			self.highlightStopLayerInstance.addStops([stopGraphic]);
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

	FieldTripMap.prototype.updateStopInfo = function(data)
	{
		const self = this,
			{ DBID, fieldTripStopId, fromFieldTripId, toFieldTripId, toStopSequence, color } = data,
			fieldTrip = self.fieldTripsData.find(item => item.id === toFieldTripId),
			stopFeatures = self._getStopFeatures().filter(f => f.attributes.DBID === DBID &&
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

	//#region Map Events

	FieldTripMap.prototype.onMapClickEvent = async function(data)
	{
		const self = this, event = data.event;
		let response = null;

		if (event.button === 0)
		{
			// click on map
			if (this.editing.isAddingStop)
			{
				const mapPoint = data.event.mapPoint;
				const { longitude, latitude } = mapPoint;
				self.showLoadingIndicator();
				const newStopData = await self._createGeocodingNewStop(longitude, latitude);
				self.addHighlightStops(newStopData.newStop);
				self.hideLoadingIndicator();

				this.mapInstance.fireCustomizedEvent({ eventType: TF.RoutingPalette.FieldTripMapEventEnum.AddStopFromMapCompleted, data: newStopData });
				self.stopAddFieldTripStop();
			}
		}
		else if (event.button === 2)
		{
			// right click

			response = await self.mapInstance?.map.mapView.hitTest(event);
			if (response.results.length > 0)
			{
				const graphics = response.results.map(item => item.graphic);
				const stopGraphics = graphics.filter(item => item.layer?.id === RoutingPalette_FieldTripStopLayerId);
				const pathGraphics = graphics.filter(item => item.layer?.id === RoutingPalette_FieldTripPathLayerId);

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
					const data = pathGraphics.map(path => {
						const { DBID, FieldTripId, Sequence } = path.attributes;
						return { DBID, FieldTripId, Sequence };
					});
					const dataWrapper = { data, event };
					this.mapInstance.fireCustomizedEvent({ eventType: TF.RoutingPalette.FieldTripMapEventEnum.FieldTripPathClick, data: dataWrapper });
				}
			}
		}
	}

	FieldTripMap.prototype.onMapKeyUpEvent = async function(_, data)
	{
		const keyName = data.event.key;
		switch (keyName)
		{
			case "Escape":
				await this.confirmToExitAddingStop();
				break;
			case "Enter":
				console.log("TODO: Press Enter on FieldTripMap");
				break;
			case "Delete":
				console.log("TODO: Press Delete on FieldTripMap");
				break;
			case "m":
			case "M":
				if (data.event.native.ctrlKey)
				{
					console.log("TODO: Press Ctrl + M on FieldTripMap, refresh trip stop path which is NULL");
				}
				break;
			case "z":
			case "Z":
				if (data.event.native.ctrlKey)
				{
					console.log("TODO: Press Ctrl + Z on FieldTripMap, revertMapClick");//see _initRevertOperation in Plus
				}
				break;
			default:
				break;
		}
	}

	FieldTripMap.prototype.confirmToExitAddingStop = async function(needConfirmation = true, doFireEvent = true)
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

	FieldTripMap.prototype.drawStops = function(fieldTrip)
	{
		const self = this,
			DEFAULT_STOP_VISIBILITY = false,
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
			const school = TF.RoutingPalette.FieldTripMap.StopGraphicWrapper.CreateStop(fieldTrip.SchoolXCoord, fieldTrip.SchoolYCoord, attributes);

			Sequence = 2;
			id = TF.createId();
			Name = fieldTrip.Destination;
			attributes = {DBID, FieldTripId, id, Name, CurbApproach, Sequence, Color};
			const destination = TF.RoutingPalette.FieldTripMap.StopGraphicWrapper.CreateStop(fieldTrip.FieldTripDestinationXCoord, fieldTrip.FieldTripDestinationYCoord, attributes);

			self.stopLayerInstance?.addStops([destination, school]);
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

			self.stopLayerInstance?.addStops(graphics);
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
			// hide by default for UX.
			const graphic = TF.RoutingPalette.FieldTripMap.PathGraphicWrapper.CreatePath([stopPath], pathAttributes, false);
			this.pathLayerInstance?.addPath(graphic);
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
			// hide by default for UX.
			const graphic = TF.RoutingPalette.FieldTripMap.PathGraphicWrapper.CreatePath(sequenceLine, attributes, false);
			self.sequenceLineLayerInstance?.addPath(graphic, () =>
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
				{ DBID, FieldTripId } = this._extractFieldTripFeatureFields(fieldTrip),
				description = self._extractArrowCondition(DBID,  FieldTripId),
				symbol = self.arrowLayerHelper.getArrowSymbol(arrowOnPath, value);
			uniqueValueInfos.push({ value, symbol, description });
		}

		return self.arrowLayerHelper.createUniqueValueRenderer(uniqueValueInfos);
	}

	FieldTripMap.prototype.updateArrowRenderer = function()
	{
		const arrowRenderer = this._getArrowRenderer();
		this.pathArrowLayerInstance.setRenderer(arrowRenderer);
		this.sequenceLineArrowLayerInstance.setRenderer(arrowRenderer);
	}

	FieldTripMap.prototype.hideArrowLayer = function()
	{
		const self = this;
		self.pathArrowLayerInstance.hide();
		self.sequenceLineArrowLayerInstance.hide();
	}

	FieldTripMap.prototype.redrawPathArrowLayer = async function(_, data = {}, fieldTrips = null)
	{
		const self = this;
		if (self.pathLineType === PATH_LINE_TYPE.Sequence)
		{
			return;
		}

		const fieldTripsData = fieldTrips || self.fieldTripsData,
			arrowLayerInstance = self.pathArrowLayerInstance,
			pathFeatures = self._getPathFeatures();

		arrowLayerInstance.hide();
		await self._redrawArrowLayer(fieldTripsData, arrowLayerInstance, pathFeatures, data);
		const expression = self._calculateArrowLayerExpression();
		self.setFieldTripPathArrowVisibility(expression);
		arrowLayerInstance.show();
	}

	FieldTripMap.prototype.redrawSequenceArrowLayer = async function(_, data, fieldTrips = null)
	{
		const self = this;
		if (self.pathLineType === PATH_LINE_TYPE.Path)
		{
			return;
		}

		const fieldTripsData = fieldTrips || self.fieldTripsData,
			arrowLayerInstance = self.sequenceLineArrowLayerInstance,
			sequenceLineFeatures = self._getSequenceLineFeatures();

		arrowLayerInstance.hide();
		await self._redrawArrowLayer(fieldTripsData, arrowLayerInstance, sequenceLineFeatures, data);
		const expression = self._calculateArrowLayerExpression();
		self.setFieldTripSequenceLineArrowVisibility(expression);
		arrowLayerInstance.show();
	}

	FieldTripMap.prototype._redrawArrowLayer = async function(fieldTrips, arrowLayerInstance, pathFeatures, data)
	{
		const self = this;

		for (let i = 0; i < fieldTrips.length; i++)
		{
			const fieldTrip = fieldTrips[i];
			const { DBID, FieldTripId } = self._extractFieldTripFeatureFields(fieldTrip);
			const features = pathFeatures.filter(feature => feature.attributes.DBID === DBID && feature.attributes.FieldTripId === FieldTripId);
			if (!arrowLayerInstance.isPathWithinMapExtentChanged(features, data))
			{
				continue;
			}
			
			const edits = {};
			const condition = self._extractArrowCondition(DBID, FieldTripId);
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
				arrows = arrows.concat(self._computeArrowFeatures(feature));
			}

			if (arrows.length >= 0)
			{
				edits.addFeatures = arrows;
			}

			await arrowLayerInstance.layer.applyEdits(edits);
		}
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

	FieldTripMap.prototype.setFieldTripPathArrowVisibility = function(expression)
	{
		this.pathArrowLayerInstance.setLayerDefinitionExpression(expression);
	}

	FieldTripMap.prototype._getVisibleFieldTrips = function()
	{
		return this.fieldTripsData.filter(item => item.visible);
	}

	FieldTripMap.prototype.setFieldTripSequenceLineArrowVisibility = function(expression)
	{
		this.sequenceLineArrowLayerInstance.setLayerDefinitionExpression(expression);
	}

	FieldTripMap.prototype._calculateArrowLayerExpression = function()
	{
		const self = this,
			visibleFieldTrips = self._getVisibleFieldTrips(),
			conditions = visibleFieldTrips.map(item =>
			{
				const { DBID, FieldTripId } = self._extractFieldTripFeatureFields(item);
				return this._extractArrowCondition(DBID, FieldTripId);
			}),
			expression = (conditions.length > 1) ? `(${conditions.join(") OR (")})` :
				(conditions.length === 0) ? "1 = 0" : conditions;
		return expression;
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

			await this.mapInstance.fireCustomizedEvent({ eventType: TF.RoutingPalette.FieldTripMapEventEnum.DirectionUpdated, data });
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
			var firstSegmentGeom = TF.GIS.GeometryHelper.SimplifyGeometry(pathSegments[0].geometry);
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
			var lastSegmentGeom = TF.GIS.GeometryHelper.SimplifyGeometry(pathSegments[pathSegments.length - 1].geometry);
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
		if (!path || !path.paths || !path.paths[0] || !path.paths[0][0]) return;
		var polyline = TF.GIS.GeometryHelper.ComputeWebMercatorPolyline(path.paths);
		var point = TF.xyToGeometry(stop.XCoord, stop.YCoord);
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

	FieldTripMap.prototype._createPathSegments = function(result)
	{
		var self = this, pathSegments = [];
		var stopToStopPathGeometry = TF.GIS.GeometryHelper.CreateWebMercatorPolyline([]);
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
				geometry: TF.GIS.GeometryHelper.CreateWebMercatorPolyline([])
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
		return this.stopLayerInstance?.getFeatures();
	}

	FieldTripMap.prototype._getPathFeatures = function()
	{
		return this.pathLayerInstance?.getFeatures();
	}

	FieldTripMap.prototype._getHighlightFeatures = function()
	{
		return this.highlightLayerInstance?.getFeatures();
	}

	FieldTripMap.prototype._getHighlightStopFeatures = function()
	{
		return this.highlightStopLayerInstance?.getFeatures();
	}

	FieldTripMap.prototype._getPathArrowFeatures = async function(condition = '1 = 1')
	{
		return await this._getArrowFeatures(this.pathArrowLayerInstance, condition);
	}

	FieldTripMap.prototype._getSequenceLineFeatures = function()
	{
		return this.sequenceLineLayerInstance?.getFeatures();
	}

	FieldTripMap.prototype._getSequenceLineArrowFeatures = async function(condition = '1 = 1')
	{
		return await this._getArrowFeatures(this.sequenceLineArrowLayerInstance, condition);
	}

	FieldTripMap.prototype._getArrowFeatures = async function(arrowLayerInstance, condition = '1 = 1')
	{
		const queryResult = await arrowLayerInstance?.queryFeatures(null, condition);
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
			FieldTripId = fieldTrip.oldId || fieldTrip.id;

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

		const layerInstances = [
			self.stopLayerInstance,
			self.pathLayerInstance,
			self.sequenceLineLayerInstance,
			self.highlightLayerInstance,
			self.highlightStopLayerInstance,
			self.pathArrowLayerInstance,
			self.sequenceLineArrowLayerInstance,
		];
		self.layerManager.removeLayerInstances(layerInstances);

		self.stopLayerInstance = null;
		self.pathLayerInstance = null;
		self.sequenceLineLayerInstance = null;
		self.highlightLayerInstance = null;
		self.highlightStopLayerInstance = null;
		self.pathArrowLayerInstance = null;
		self.sequenceLineArrowLayerInstance = null;
	}
})();
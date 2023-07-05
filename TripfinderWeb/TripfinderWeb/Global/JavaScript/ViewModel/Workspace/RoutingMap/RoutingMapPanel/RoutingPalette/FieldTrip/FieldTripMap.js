
(function()
{
	createNamespace("TF.RoutingPalette").FieldTripMap = FieldTripMap;

	const RoutingPalette_FieldTripPathArrowLayerId = "RoutingPalette_FieldTrip_PathArrowLayer";
	const RoutingPalette_FieldTripPathArrowLayer_Index = 1;
	const RoutingPalette_FieldTripPathLayerId = "RoutingPalette_FieldTrip_PathLayer";
	const RoutingPalette_FieldTripPathLayer_Index = 2;
	const RoutingPalette_FieldTripSequenceLineLayerId = "RoutingPalette_FieldTrip_SequenceLineLayer";
	const RoutingPalette_FieldTripSequenceLineLayer_Index = 3;
	const RoutingPalette_FieldTripStopLayerId = "RoutingPalette_FieldTrip_StopLayer";
	const RoutingPalette_FieldTripStopLayer_Index = 4;
	const PATH_LINE_TYPE = {
		Path: "Path",
		Sequence: "Sequence"
	};

	function FieldTripMap(mapInstance)
	{
		this.symbol = new TF.Map.Symbol(),
		this.mapInstance = mapInstance;
		this.fieldTripPathArrowLayerInstance = this.mapInstance.getMapLayerInstance(RoutingPalette_FieldTripPathArrowLayerId);
		this.fieldTripPathLayerInstance = this.mapInstance.getMapLayerInstance(RoutingPalette_FieldTripPathLayerId);
		this.fieldTripSequenceLineLayerInstance = this.mapInstance.getMapLayerInstance(RoutingPalette_FieldTripSequenceLineLayerId);
		this.fieldTripStopLayerInstance = this.mapInstance.getMapLayerInstance(RoutingPalette_FieldTripStopLayerId);
		this.pathLineType = null;
		this.initLayers();
		this.defineReadOnlyProperty("fieldTripPathArrowLayerInstance", this.fieldTripPathArrowLayerInstance);
		this.defineReadOnlyProperty("fieldTripPathLayerInstance", this.fieldTripPathLayerInstance);
		this.defineReadOnlyProperty("fieldTripSequenceLineLayerInstance", this.fieldTripSequenceLineLayerInstance);
		this.defineReadOnlyProperty("fieldTripStopLayerInstance", this.fieldTripStopLayerInstance);
		this.defineReadOnlyProperty("PATH_LINE_TYPE", PATH_LINE_TYPE);
	}

	FieldTripMap.prototype.defineReadOnlyProperty = function(propertyName, value)
	{
		Object.defineProperty(this, propertyName, {
			get() { return value; },
			enumerable: false,
			configurable: false
		});
	};

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

		return new Promise((resolve, reject) =>
		{
			if (self.fieldTripStopLayerInstance &&
				self.fieldTripPathLayerInstance &&
				self.fieldTripSequenceLineLayerInstance &&
				self.fieldTripPathArrowLayerInstance)
			{
				resolve();
			}

			self.fieldTripPathArrowLayerInstance = self.addPathArrowLayer();

			self.fieldTripPathLayerInstance = self.mapInstance.addLayer({
				id: RoutingPalette_FieldTripPathLayerId,
				index: RoutingPalette_FieldTripPathLayer_Index,
				eventHandlers: {
					onLayerCreated: onLayerCreatedHandler.bind(self, resolve)
				}
			})

			self.fieldTripSequenceLineLayerInstance = self.mapInstance.addLayer({
				id: RoutingPalette_FieldTripSequenceLineLayerId,
				index: RoutingPalette_FieldTripSequenceLineLayer_Index,
				eventHandlers: {
					onLayerCreated: onLayerCreatedHandler.bind(self, resolve)
				}
			})

			self.fieldTripStopLayerInstance = self.mapInstance.addLayer({
				id: RoutingPalette_FieldTripStopLayerId,
				index: RoutingPalette_FieldTripStopLayer_Index,
				eventHandlers: {
					onLayerCreated: onLayerCreatedHandler.bind(self, resolve)
				}
			});
		});
	}

	FieldTripMap.prototype.addFieldTrip = async function(fieldTrip)
	{
		this.setPathLineType([fieldTrip], this.PATH_LINE_TYPE.Path);
		this.drawStops(fieldTrip);

		// const routeResult = await this.calculateRoute(fieldTrip);
		// this.drawFieldTripPath(fieldTrip, routeResult);

		this.drawSequenceLine(fieldTrip, () => {
			this.hideSequenceLineByDefault(fieldTrip);
		});
	}

	FieldTripMap.prototype.drawStops = function(fieldTrip)
	{
		const color = this.getColor(fieldTrip),
			Color = color,
			DBID = fieldTrip.DBID,
			Id = fieldTrip.Id;

		if (fieldTrip.FieldTripStops.length === 0)
		{
			let Sequence = 1, attributes = {DBID, Id, Sequence, Color};
			let symbol = this.symbol.tripStop(Sequence, color);
			this.fieldTripStopLayerInstance?.addPoint(fieldTrip.SchoolXCoord, fieldTrip.SchoolYCoord, symbol, attributes);

			Sequence = 2;
			attributes = {DBID, Id, Sequence, Color};
			symbol = this.symbol.tripStop(Sequence, color);
			this.fieldTripStopLayerInstance?.addPoint(fieldTrip.FieldTripDestinationXCoord, fieldTrip.FieldTripDestinationYCoord, symbol, attributes);
		}
		else
		{
			const fieldTripStops = fieldTrip.FieldTripStops;
			for (let i = 0; i < fieldTripStops.length; i++)
			{
				const stop = fieldTripStops[i];
				let Sequence = stop.Sequence, attributes = {DBID, Id, Sequence, Color};
				let symbol = this.symbol.tripStop(Sequence, color);
				this.fieldTripStopLayerInstance?.addPoint(stop.XCoord, stop.YCoord, symbol, attributes);
			}
		}
	}

	FieldTripMap.prototype.goToStopsExtent = function()
	{
		const graphics = this.getStopFeatures();
		this.mapInstance.setExtent(graphics);
	}

	FieldTripMap.prototype.computeSequencePath = function(fieldTrip)
	{
		const paths = [];

		if (fieldTrip.FieldTripStops.length === 0)
		{
			paths.push([fieldTrip.SchoolXCoord, fieldTrip.SchoolYCoord]);
			paths.push([fieldTrip.FieldTripDestinationXCoord, fieldTrip.FieldTripDestinationYCoord]);
		}
		else
		{
			const fieldTripStops = fieldTrip.FieldTripStops.sort((a, b) => a.Sequence - b.Sequence);
			for (let i = 0; i < fieldTripStops.length; i++)
			{
				const stop = fieldTripStops[i];
				paths.push([stop.XCoord, stop.YCoord]);
			}
		}

		return paths;
	}

	FieldTripMap.prototype.drawSequenceLine = function(fieldTrip, afterAdd = null)
	{
		const sequencePath = this.computeSequencePath(fieldTrip);
		const pathSymbol = this.computePathSymbol(fieldTrip);
		const DBID = fieldTrip.DBID,
			Id = fieldTrip.Id,
			Color = this.getColor(fieldTrip),
			attributes = { DBID, Id, Color };

		this.fieldTripSequenceLineLayerInstance?.addPolyline(sequencePath, pathSymbol, attributes, afterAdd);
	}

	FieldTripMap.prototype.hideSequenceLineByDefault = function(fieldTrip)
	{
		this.setFieldTripSequenceLineVisible([fieldTrip]);
	}

	FieldTripMap.prototype.getColor = function(fieldTrip)
	{
		return fieldTrip.color;
	}

	FieldTripMap.prototype.updateSymbolColor = function(fieldTrip)
	{
		const color = this.getColor(fieldTrip),
			DBID = fieldTrip.DBID,
			Id = fieldTrip.Id,
			stopFeatures = this.getStopFeatures(),
			pathFeatures = this.getPathFeatures(),
			sequenceLineFeatures = this.getSequenceLineFeatures();
		
		for (let i = 0; i < stopFeatures.length; i++)
		{
			const stopFeature = stopFeatures[i];
			if (stopFeature.attributes.DBID === DBID && stopFeature.attributes.Id === Id)
			{
				stopFeature.symbol = this.symbol.tripStop(stopFeature.attributes.Sequence, color);
				stopFeature.attributes.Color = color;
			}
		}

		for (let i = 0; i < pathFeatures.length; i++)
		{
			const pathFeature = pathFeatures[i];
			if (pathFeature.attributes.DBID === DBID && pathFeature.attributes.Id === Id)
			{
				pathFeature.symbol = this.symbol.tripPath(color);
				pathFeature.attributes.Color = color;
			}
		}

		for (let i = 0; i < sequenceLineFeatures.length; i++)
		{
			const sequenceLineFeature = sequenceLineFeatures[i];
			if (sequenceLineFeature.attributes.DBID === DBID && sequenceLineFeature.attributes.Id === Id)
			{
				sequenceLineFeature.symbol = this.symbol.tripPath(color);
				sequenceLineFeature.attributes.Color = color;
			}
		}
	}

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
			
			const fieldTripStops = fieldTrip.FieldTripStops.sort((a, b) => a.Sequence - b.Sequence);;
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

	FieldTripMap.prototype.computeRoutePath = function(routeResult)
	{
		const route = routeResult?.route,
		 	paths = route?.geometry?.paths; 
		return paths;
	}

	FieldTripMap.prototype.computePathAttributes = function(fieldTrip, routeResult)
	{
		const DBID = fieldTrip.DBID,
			Color = this.getColor(fieldTrip),
			Id = fieldTrip.Id,
			route = routeResult?.route,
			attributes = Object.assign({}, route.attributes, {DBID, Id, Color});
		return attributes;
	}

	FieldTripMap.prototype.computePathSymbol = function(fieldTrip)
	{
		const color = fieldTrip.color;
		return this.symbol.tripPath(color);
	}

	FieldTripMap.prototype.drawFieldTripPath = function(fieldTrip, routeResult)
	{
		const routePath = this.computeRoutePath(routeResult);
		if (!routePath)
		{
			return;
		}

		const pathAttributes = this.computePathAttributes(fieldTrip, routeResult);
		const pathSymbol = this.computePathSymbol(fieldTrip);
		this.fieldTripPathLayerInstance?.addPolyline(routePath, pathSymbol, pathAttributes);
	}

	FieldTripMap.prototype.removeFieldTrip = function(fieldTrip)
	{
		const DBID = fieldTrip.DBID,
			Id = fieldTrip.Id,
			stopFeatures = this.getStopFeatures(),
			pathFeatures = this.getPathFeatures(),
			sequenceLineFeatures = this.getSequenceLineFeatures();


		for (let i = 0; i < stopFeatures.length; i++)
		{
			const stopFeature = stopFeatures[i];
			if (stopFeature.attributes.DBID === DBID && stopFeature.attributes.Id === Id)
			{
				this.fieldTripStopLayerInstance?.layer.remove(stopFeature);
				i--;
			}
		}

		for (let i = 0; i < pathFeatures.length; i++)
		{
			const pathFeature = pathFeatures[i];
			if (pathFeature.attributes.DBID === DBID && pathFeature.attributes.Id === Id)
			{
				this.fieldTripPathLayerInstance?.layer.remove(pathFeature);
				i--;
			}
		}

		for (let i = 0; i < sequenceLineFeatures.length; i++)
		{
			const sequenceLineFeature = sequenceLineFeatures[i];
			if (sequenceLineFeature.attributes.DBID === DBID && sequenceLineFeature.attributes.Id === Id)
			{
				this.fieldTripSequenceLineLayerInstance?.layer.remove(sequenceLineFeature);
				i--;
			}
		}
	}

	FieldTripMap.prototype.zoomToFieldTripLayers = function(fieldTrips)
	{
		const graphics = [],
			stopFeatures = this.getStopFeatures(),
			pathFeatures = this.getPathFeatures(),
			sequenceLineFeatures = this.getSequenceLineFeatures();

		for (let j = 0; j < fieldTrips.length; j++)
		{
			const fieldTrip = fieldTrips[j],
			 	DBID = fieldTrip.DBID,
				Id = fieldTrip.Id;

			for (let i = 0; i < stopFeatures.length; i++)
			{
				const stopFeature = stopFeatures[i];
				if (stopFeature.attributes.DBID === DBID && stopFeature.attributes.Id === Id)
				{
					graphics.push(stopFeature);
				}
			}

			for (let i = 0; i < pathFeatures.length; i++)
			{
				const pathFeature = pathFeatures[i];
				if (pathFeature.attributes.DBID === DBID && pathFeature.attributes.Id === Id)
				{
					graphics.push(pathFeature);
				}
			}

			for (let i = 0; i < sequenceLineFeatures.length; i++)
			{
				const sequenceLineFeature = sequenceLineFeatures[i];
				if (sequenceLineFeature.attributes.DBID === DBID && sequenceLineFeature.attributes.Id === Id)
				{
					graphics.push(sequenceLineFeature);
				}
			}
		}

		this.mapInstance.setExtent(graphics);
	}

	FieldTripMap.prototype.setFieldTripVisible = function(fieldTrips)
	{
		this.setFieldTripStopVisible(fieldTrips);
		this.setFieldTripPathVisible(fieldTrips);
		this.setFieldTripSequenceLineVisible(fieldTrips);
	}

	FieldTripMap.prototype.setFieldTripStopVisible = function(fieldTrips)
	{
		const stopFeatures = this.getStopFeatures();
		for (let i = 0; i < fieldTrips.length; i++)
		{
			const fieldTrip = fieldTrips[i],
				DBID = fieldTrip.DBID,
				Id = fieldTrip.Id,
				visible = fieldTrip.visible;

			for (let j = 0; j < stopFeatures.length; j++)
			{
				const stopFeature = stopFeatures[j];
				if (stopFeature.attributes.DBID === DBID && stopFeature.attributes.Id === Id)
				{
					stopFeature.visible = visible;
				}
			}
		}
	}

	FieldTripMap.prototype.setFieldTripPathVisible = function(fieldTrips)
	{
		const pathFeatures = this.getPathFeatures();
		for (let i = 0; i < fieldTrips.length; i++)
		{
			const fieldTrip = fieldTrips[i],
				DBID = fieldTrip.DBID,
				Id = fieldTrip.Id;
				
			let visible = fieldTrip.visible;
			if (visible && this.pathLineType === PATH_LINE_TYPE.Sequence)
			{
				visible = false;
			}

			for (let j = 0; j < pathFeatures.length; j++)
			{
				const pathFeature = pathFeatures[j];
				if (pathFeature.attributes.DBID === DBID && pathFeature.attributes.Id === Id)
				{
					pathFeature.visible = visible;
				}
			}
		}
	}

	FieldTripMap.prototype.setFieldTripSequenceLineVisible = function(fieldTrips)
	{
		const sequenceLineFeatures = this.getSequenceLineFeatures();
		for (let i = 0; i < fieldTrips.length; i++)
		{
			const fieldTrip = fieldTrips[i],
				DBID = fieldTrip.DBID,
				Id = fieldTrip.Id;

			let visible = fieldTrip.visible;
			if (visible && this.pathLineType === PATH_LINE_TYPE.Path)
			{
				visible = false;
			}

			for (let j = 0; j < sequenceLineFeatures.length; j++)
			{
				const sequenceLineFeature = sequenceLineFeatures[j];
				if (sequenceLineFeature.attributes.DBID === DBID && sequenceLineFeature.attributes.Id === Id)
				{
					sequenceLineFeature.visible = visible;
				}
			}
		}
	}

	FieldTripMap.prototype.getStopFeatures = function()
	{
		return this.fieldTripStopLayerInstance?.layer.graphics.items || [];
	}

	FieldTripMap.prototype.getPathFeatures = function()
	{
		return this.fieldTripPathLayerInstance?.layer.graphics.items || [];
	}

	FieldTripMap.prototype.getSequenceLineFeatures = function()
	{
		return this.fieldTripSequenceLineLayerInstance?.layer.graphics.items || [];
	}

	FieldTripMap.prototype.setPathLineType = function(fieldTrips, type)
	{
		if (this.pathLineType === type)
		{
			return;
		}

		this.pathLineType = type;

		this.setFieldTripPathVisible(fieldTrips);
		this.setFieldTripSequenceLineVisible(fieldTrips);
	}

	FieldTripMap.prototype.addPathArrowLayer = function()
	{
		const self = this;
		const arrowLayer = self.mapInstance.addLayer({
			id: RoutingPalette_FieldTripPathArrowLayerId,
			index: RoutingPalette_FieldTripPathArrowLayer_Index,
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
					name: "entityId",
					type: "string"
				}, {
					name: "color",
					type: "string"
				}],
			source: [],
			renderer: null
		}, self.mapInstance.LAYER_TYPE.FEATURE);

		return arrowLayer;
	}

	FieldTripMap.prototype.updatePathArrowLayerRenderer = function(fieldTrips)
	{
		const self = this;
		if (!self.fieldTripPathArrowLayerInstance)
		{
			return;
		}

		const renderer = self.getPathArrowRenderer(fieldTrips);
		self.fieldTripPathArrowLayerInstance.layer.renderer = renderer;
	}

	FieldTripMap.prototype.getPathArrowRenderer = function(fieldTrips)
	{
		const uniqueValueInfos = [],
			arrowOnPath = true;
		
		for (let i = 0; i < fieldTrips.length; i++)
		{
			const fieldTrip = fieldTrips[i];
			const value = this.getColor(fieldTrip);
			const symbol = arrowOnPath ? this.symbol.arrow(value) : this.symbol.arrowOnSide(value);
			uniqueValueInfos.push({ value, symbol });
		}

		const renderer = {
			type: "unique-value",
			field: "color",
			defaultSymbol: this.symbol.arrow(),
			visualVariables: [{
				type: "rotation",
				field: "angle",
				rotationType: "geographic"
			}],
			uniqueValueInfos: uniqueValueInfos
		};

		return renderer;
	}

})();

(function()
{
	createNamespace("TF.RoutingPalette").FieldTripMap = FieldTripMap;

	const RoutingPalette_FieldTripPathLayerId = "RoutingPalette_FieldTrip_PathLayer";
	const RoutingPalette_FieldTripPathLayer_Index = 1;
	const RoutingPalette_FieldTripSequenceLineLayerId = "RoutingPalette_FieldTrip_SequenceLineLayer";
	const RoutingPalette_FieldTripSequenceLineLayer_Index = 2;
	const RoutingPalette_FieldTripStopLayerId = "RoutingPalette_FieldTrip_StopLayer";
	const RoutingPalette_FieldTripStopLayer_Index = 3;
	const PATH_LINE_TYPE = {
		Path: "Path",
		Sequence: "Sequence"
	};

	function FieldTripMap(mapInstance)
	{
		this.symbol = new TF.Map.Symbol(),
		this.mapInstance = mapInstance;
		this.fieldTripPathLayerInstance = this.mapInstance.getMapLayerInstance(RoutingPalette_FieldTripPathLayerId);
		this.fieldTripSequenceLineLayerInstance = this.mapInstance.getMapLayerInstance(RoutingPalette_FieldTripSequenceLineLayerId);
		this.fieldTripStopLayerInstance = this.mapInstance.getMapLayerInstance(RoutingPalette_FieldTripStopLayerId);
		this.pathLineType = null;
		this.initLayers();
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
			if (self.fieldTripStopLayerInstance && self.fieldTripPathLayerInstance && self.fieldTripSequenceLineLayerInstance)
			{
				resolve();
			}

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
			DBID = fieldTrip.DBID,
			Id = fieldTrip.Id;

		if (fieldTrip.FieldTripStops.length === 0)
		{
			let Sequence = 1, attributes = {DBID, Id, Sequence};
			let symbol = this.symbol.tripStop(Sequence, color);
			this.fieldTripStopLayerInstance?.addPoint(fieldTrip.SchoolXCoord, fieldTrip.SchoolYCoord, symbol, attributes);

			Sequence = 2;
			attributes = {DBID, Id, Sequence};
			symbol = this.symbol.tripStop(Sequence, color);
			this.fieldTripStopLayerInstance?.addPoint(fieldTrip.FieldTripDestinationXCoord, fieldTrip.FieldTripDestinationYCoord, symbol, attributes);
		}
		else
		{
			const fieldTripStops = fieldTrip.FieldTripStops;
			for (let i = 0; i < fieldTripStops.length; i++)
			{
				const stop = fieldTripStops[i];
				let Sequence = stop.Sequence, attributes = {DBID, Id, Sequence};
				let symbol = this.symbol.tripStop(Sequence, color);
				this.fieldTripStopLayerInstance?.addPoint(stop.XCoord, stop.YCoord, symbol, attributes);
			}
		}

		const graphics = this.getStopFeatures();
		this.mapInstance.setExtent(graphics);
	}

	FieldTripMap.prototype.drawSequenceLine = function(fieldTrip, afterAdd = null)
	{
		const color = this.getColor(fieldTrip),
			DBID = fieldTrip.DBID,
			Id = fieldTrip.Id,
			attributes = { DBID, Id }
			paths = [];

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

		this.fieldTripSequenceLineLayerInstance?.addPolyline(paths, this.symbol.tripPath(color), attributes, afterAdd);
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
			}
		}

		for (let i = 0; i < pathFeatures.length; i++)
		{
			const pathFeature = pathFeatures[i];
			if (pathFeature.attributes.DBID === DBID && pathFeature.attributes.Id === Id)
			{
				pathFeature.symbol = this.symbol.tripPath(color);
			}
		}

		for (let i = 0; i < sequenceLineFeatures.length; i++)
		{
			const sequenceLineFeature = sequenceLineFeatures[i];
			if (sequenceLineFeature.attributes.DBID === DBID && sequenceLineFeature.attributes.Id === Id)
			{
				sequenceLineFeature.symbol = this.symbol.tripPath(color);
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

	FieldTripMap.prototype.drawFieldTripPath = function(fieldTrip, routeResult)
	{
		const color = fieldTrip.color,
			route = routeResult?.route,
			DBID = fieldTrip.DBID,
			Id = fieldTrip.Id,
			attributes = Object.assign({}, route.attributes, {DBID, Id}),
			paths = route?.geometry?.paths;

		if (!paths)
		{
			return;
		}

		this.fieldTripPathLayerInstance?.addPolyline(paths, this.symbol.tripPath(color), attributes);
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
})();
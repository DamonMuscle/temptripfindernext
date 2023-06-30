
(function()
{
	createNamespace("TF.RoutingPalette").FieldTripMap = FieldTripMap;

	const RoutingPalette_FieldTripPathLayerId = "RoutingPalette_FieldTrip_PathLayer";
	const RoutingPalette_FieldTripPathLayer_Index = 1;
	const RoutingPalette_FieldTripStopLayerId = "RoutingPalette_FieldTrip_StopLayer";
	const RoutingPalette_FieldTripStopLayer_Index = 2;

	function FieldTripMap(mapInstance)
	{
		this.symbol = new TF.Map.Symbol(),
		this.mapInstance = mapInstance;
		this.fieldTripPathLayerInstance = this.mapInstance.getMapLayerInstance(RoutingPalette_FieldTripPathLayerId);
		this.fieldTripStopLayerInstance = this.mapInstance.getMapLayerInstance(RoutingPalette_FieldTripStopLayerId);
		this.initLayers();
		this.defineReadOnlyProperty("fieldTripPathLayerInstance", this.fieldTripPathLayerInstance);
		this.defineReadOnlyProperty("fieldTripStopLayerInstance", this.fieldTripStopLayerInstance);
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
		return new Promise((resolve, reject) =>
		{
			if (self.fieldTripStopLayerInstance && self.fieldTripPathLayerInstance)
			{
				resolve();
			}

			const totalLayerCount = 2;
			let layerCount = 0;

			self.fieldTripPathLayerInstance = self.mapInstance.addLayer({
				id: RoutingPalette_FieldTripPathLayerId,
				index: RoutingPalette_FieldTripPathLayer_Index,
				eventHandlers:{
					onLayerCreated: () => {
						layerCount++;
						if (layerCount === totalLayerCount)
						{
							resolve();
						}
					}
				}
			})

			self.fieldTripStopLayerInstance = self.mapInstance.addLayer({
				id: RoutingPalette_FieldTripStopLayerId,
				index: RoutingPalette_FieldTripStopLayer_Index,
				eventHandlers:{
					onLayerCreated: () => {
						layerCount++;
						if (layerCount === totalLayerCount)
						{
							resolve();
						}
					}
				}
			});
		});
	}

	FieldTripMap.prototype.drawStops = function(fieldTrip)
	{
		if (fieldTrip.TripStops.length === 0)
		{
			const color = fieldTrip.color,
				DBID = fieldTrip.DBID,
				Id = fieldTrip.Id,
				attributes = {DBID, Id};
			this.fieldTripStopLayerInstance.addPoint(fieldTrip.SchoolXCoord, fieldTrip.SchoolYCoord, this.symbol.tripStop(1, color), attributes);
			this.fieldTripStopLayerInstance.addPoint(fieldTrip.FieldTripDestinationXCoord, fieldTrip.FieldTripDestinationYCoord, this.symbol.tripStop(2, color), attributes);
	
			const graphics = this.fieldTripStopLayerInstance.layer.graphics;
			this.mapInstance.setExtent(graphics);
		}
		else
		{
			console.log("TODO: draw TripStops");
		}
	}

	FieldTripMap.prototype.calculateRoute = async function(fieldTrip)
	{
		const networkService = TF.GIS.Analysis.getInstance().networkService;
		if (fieldTrip.TripStops.length === 0)
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
			const stopFeatureSet = await networkService.createStopFeatureSet([stop1, stop2]);
			const params = {
				stops: stopFeatureSet,
			};
			const response = await networkService.solveRoute(params);

			const result = response?.results?.routeResults[0];
			return result;
		}
		else
		{
			return null;
		}
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

		this.fieldTripPathLayerInstance.addPolyline(paths, this.symbol.tripPath(color), attributes);
	}

	FieldTripMap.prototype.removeFieldTrip = function(fieldTrip)
	{
		const DBID = fieldTrip.DBID,
			Id = fieldTrip.Id,
			stopFeatures = this.fieldTripStopLayerInstance.layer.graphics.items,
			pathFeatures = this.fieldTripPathLayerInstance.layer.graphics.items;

		for (let i = 0; i < stopFeatures.length; i++)
		{
			const stopFeature = stopFeatures[i];
			if (stopFeature.attributes.DBID === DBID && stopFeature.attributes.Id === Id)
			{
				this.fieldTripStopLayerInstance.layer.remove(stopFeature);
				i--;
			}
		}

		for (let i = 0; i < pathFeatures.length; i++)
		{
			const pathFeature = pathFeatures[i];
			if (pathFeature.attributes.DBID === DBID && pathFeature.attributes.Id === Id)
			{
				this.fieldTripPathLayerInstance.layer.remove(pathFeature);
				i--;
			}
		}
	}
})();
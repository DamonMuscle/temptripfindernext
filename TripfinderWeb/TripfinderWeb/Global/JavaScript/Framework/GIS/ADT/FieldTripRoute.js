(function()
{
	createNamespace("TF.GIS.ADT").FieldTripRoute = FieldTripRoute;

	const networkService = TF.GIS.Analysis.getInstance().networkService;

	function FieldTripRoute(fieldTrip)
	{
		this._fieldTrip = fieldTrip;
		this.reset();
	}

	Object.defineProperty(FieldTripRoute.prototype, "Id", {
		get() { return this._fieldTrip.id; },
		enumerable: false,
		configurable: false
	});


	FieldTripRoute.prototype.compute = async function()
	{
		if (this._routeStops.length < TF.GIS.NetworkEnum.MIN_ROUTING_STOP_COUNT)
		{
			return;
		}

		try
		{
			const routeParameters = await this._getRouteParameters();
			const response = await networkService.solveRoute(routeParameters);
			const routeResult = response?.results?.routeResults[0];
			this._calculateRoutePaths(routeResult);

			this._updateFieldTripStops();
		}
		catch (ex)
		{
			const errorMessages = ex.details.messages;
			if (errorMessages && errorMessages.length > 0)
			{
				const message = errorMessages[0];
				if (message.indexOf(TF.GIS.NetworkEnum.ERROR_MESSAGE.NO_SOLUTION) > -1 ||
					message.indexOf(TF.GIS.NetworkEnum.ERROR_MESSAGE.INVALID_LOCATION) > -1)
				{
					console.log("TODO: calculate routePath stop by stop.");
				}
			}

			tf.promiseBootbox.alert(`Cannot solve path. One or more of your stops is invalid or unreachable.`);
			return;
		}
	}

	FieldTripRoute.prototype.getRoutePaths = function()
	{
		return this._routePaths.map(item => item.Paths);
	}

	FieldTripRoute.prototype.moveStop = function(routeStopOptions)
	{
		const { sequence } = routeStopOptions;
		const routeStop = new TF.GIS.ADT.RouteStop(options);
		this._routeStops.find(item => item.Sequence === sequence) = routeStop;
	}

	FieldTripRoute.prototype.reset = function()
	{
		this._routeStops = [];
		this._routePaths = [];
		this._initRouteStops();
	}

	//#region Private Methods
	
	FieldTripRoute.prototype._getRouteParameters = async function()
	{
		const travelModeName = TF.GIS.ADT.FieldTripRouteConfiguration.TRAVEL_MODE;
		const travelMode = await networkService.fetchSupportedTravelModes(travelModeName);
		return {
			travelMode: travelMode,
			preserveFirstStop: true,
			preserveLastStop: true,
			restrictUTurns: TF.GIS.ADT.FieldTripRouteConfiguration.U_TURN_POLICY,
			stops: this._getRouteStopFeatureSet()
		};
	}

	FieldTripRoute.prototype._getRouteStopFeatureSet = function()
	{
		const routeStopGraphics = this._routeStops.map(item => item.toGraphic());
		return new TF.GIS.SDK.FeatureSet({ features: routeStopGraphics});
	}

	FieldTripRoute.prototype._initRouteStops = function()
	{
		const fieldTripStops = this._getFieldTripStops();
		const routeStops = [];
		for (let i = 0, count = fieldTripStops.length; i < count; i++)
		{
			const fieldTripStop = fieldTripStops[i];
			const options = {
				curbApproach: fieldTripStop.vehicleCurbApproach,
				sequence: fieldTripStop.Sequence,
				street: fieldTripStop.Street,
				longitude: fieldTripStop.XCoord,
				latitude: fieldTripStop.YCoord,
			};
			const routeStop = new TF.GIS.ADT.RouteStop(options);
			routeStops.push(routeStop);
		}

		this._routeStops = routeStops;
	}

	FieldTripRoute.prototype._isLastStop = function(fieldTripStop)
	{
		const stopSequences = this._routeStops.map(item => item.Sequence).sort((a, b) => a - b);
		const lastSequence = stopSequences[stopSequences.length - 1];
		return fieldTripStop.Sequence === lastSequence;
	}

	FieldTripRoute.prototype._getFieldTripStops = function()
	{
		return this._fieldTrip.FieldTripStops;
	}

	FieldTripRoute.prototype._updateFieldTripStops = function()
	{
		const fieldTripStops = this._getFieldTripStops();
		const stopCount = fieldTripStops.length;
		if (this._routePaths.length !== stopCount - 1)
		{
			return;
		}

		for (let i = 0; i < stopCount; i++)
		{
			const fieldTripStop = fieldTripStops[i];
			const routePath = this._routePaths[i];
			if (routePath)
			{
				fieldTripStop.DrivingDirections = routePath.DrivingDirections;
				fieldTripStop.RouteDrivingDirections = routePath.RouteDrivingDirections;
				fieldTripStop.IsCustomDirection = routePath.IsCustomDirection;
				fieldTripStop.Speed = routePath.Speed;
				fieldTripStop.StreetSpeed = routePath.StreetSpeed;
				fieldTripStop.Distance = routePath.Distance;
				fieldTripStop.Paths = routePath.Paths;
			}
			else if (this._isLastStop(fieldTripStop))
			{
				fieldTripStop.DrivingDirections = "";
				fieldTripStop.Speed = 0;
				fieldTripStop.Distance = 0;
				fieldTripStop.Paths = [];
			}
		}
	}

	FieldTripRoute.prototype._calculateRoutePaths = function(routeResult)
	{
		const routePaths = [];
		const directions = routeResult.directions;
		if (directions === null)
		{
			this._routePaths = [];
			return;
		}

		let routePath, routePathDirections, routePathDistance, routePathTime;
		const initAccumulator = () =>
		{
			routePath = [];
			routePathDistance = 0;
			routePathTime = 0;
			routePathDirections = "";
		}

		initAccumulator();
		const directionFeatures = directions.features;
		for (let i = 0, count = directionFeatures.length; i < count; i++)
		{
			const feature = directionFeatures[i];
			const attributes = feature.attributes;
			routePath = routePath.concat(feature.geometry.paths[0]);
			routePathDistance += attributes.length;
			routePathTime += attributes.time;
			
			const maneuverType = attributes.maneuverType;
			if (maneuverType === TF.GIS.NetworkEnum.MANEUVER_TYPE.STOP)
			{
				const options = {
					distance: routePathDistance,
					time: routePathTime,
					drivingDirections: routePathDirections,
					paths: [...routePath]
				};
				const path = new TF.GIS.ADT.RoutePath(options);
				path.RouteDrivingDirections = path.DrivingDirections;
				path.Speed = (path.Time && path.Time != 0) ? (path.Distance / path.Time) * 60 : 0;
				path.StreetSpeed = path.Speed;
				routePaths.push(path);

				initAccumulator();
			}

			if (maneuverType == TF.GIS.NetworkEnum.MANEUVER_TYPE.RAILROAD_STOP)
			{
				routePathDirections += "WARNING CROSS OVER RAILROAD.\n";
			}
			else if (maneuverType != TF.GIS.NetworkEnum.MANEUVER_TYPE.DEPART &&
					 maneuverType != TF.GIS.NetworkEnum.MANEUVER_TYPE.STOP)
			{
				routePathDirections += `${attributes.text} ${attributes.length.toFixed(2)} km. \n`;
			}
		}

		this._routePaths = routePaths;
	}

	//#endregion
})();

(function()
{
	createNamespace("TF.GIS.ADT").FieldTripRouteConfiguration = FieldTripRouteConfiguration;

	function FieldTripRouteConfiguration() { }

	FieldTripRouteConfiguration.TRAVEL_MODE = TF.GIS.NetworkEnum.SUPPORT_TRAVEL_MODE.DRIVING_TIME;
	FieldTripRouteConfiguration.U_TURN_POLICY = TF.GIS.NetworkEnum.U_TURN_POLICY.NOT_ALLOWED;
	FieldTripRouteConfiguration.PATH_ARROW_POSITION = null;
})();
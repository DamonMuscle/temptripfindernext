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

	FieldTripRoute.prototype._init = function()
	{
		this._initRouteStops();
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

		let stopToStopPaths, stopToStopPathDirections, stopToStopPathLength, stopToStopPathTime;
		const initAccumulator = () =>
		{
			stopToStopPaths = [];
			stopToStopPathLength = 0;
			stopToStopPathTime = 0;
			stopToStopPathDirections = "";
		}

		initAccumulator();
		const directionFeatures = directions.features;
		for (let i = 0, count = directionFeatures.length; i < count; i++)
		{
			const feature = directionFeatures[i];
			const attributes = feature.attributes;
			stopToStopPaths = stopToStopPaths.concat(feature.geometry.paths[0]);
			stopToStopPathLength += attributes.length;
			stopToStopPathTime += attributes.time;
			
			const maneuverType = attributes.maneuverType;
			if (maneuverType === TF.GIS.NetworkEnum.MANEUVER_TYPE.STOP)
			{
				const options = {
					distance: stopToStopPathLength,
					time: stopToStopPathTime,
					drivingDirections: stopToStopPathDirections,
					paths: [...stopToStopPaths]
				};
				const routePath = new TF.GIS.ADT.RoutePath(options);
				routePath.RouteDrivingDirections = routePath.DrivingDirections;
				routePath.Speed = (routePath.Time && routePath.Time != 0) ? (routePath.Distance / routePath.Time) * 60 : 0;
				routePath.StreetSpeed = routePath.Speed;
				routePaths.push(routePath);

				initAccumulator();
			}

			if (maneuverType == TF.GIS.NetworkEnum.MANEUVER_TYPE.RAILROAD_STOP)
			{
				stopToStopPathDirections += "WARNING CROSS OVER RAILROAD.\n";
			}
			else if (maneuverType != TF.GIS.NetworkEnum.MANEUVER_TYPE.DEPART &&
					 maneuverType != TF.GIS.NetworkEnum.MANEUVER_TYPE.STOP)
			{
				stopToStopPathDirections += `${attributes.text} ${attributes.length.toFixed(2)} km. \n`;
			}
		}

		this._routePaths = routePaths;
	}

	FieldTripRoute.prototype.calculateRoute = async function()
	{
		if (this._routeStops.length < TF.GIS.NetworkEnum.MIN_ROUTING_STOP_COUNT)
		{
			return;
		}

		try
		{
			const routeParameters = this._getRouteParameters();
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

	FieldTripRoute.prototype.reset = function()
	{
		this._routeStops = [];
		this._routePaths = [];
		this._init();
	}
	
	FieldTripRoute.prototype._getRouteParameters = function()
	{
		return {
			impedanceAttribute: null,
			preserveFirstStop: true,
			preserveLastStop: true,
			stops: this._getRouteStopFeatureSet()
		};
	}

	FieldTripRoute.prototype._getRouteStopFeatureSet = function()
	{
		const routeStopGraphics = this._routeStops.map(item => item.toGraphic());
		return new TF.GIS.SDK.FeatureSet({ features: routeStopGraphics});
	}
})();

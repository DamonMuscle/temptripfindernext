(function()
{
	createNamespace("TF.GIS.ADT").FieldTripRoute = FieldTripRoute;

	const networkService = TF.GIS.Analysis.getInstance().networkService;

	let MAX_STOP_SEQUENCE = -1;

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
		if (!_meetMinimumRoutingStopsRequirement(this._routeStops))
		{
			return;
		}

		this._routePaths = [];

		try
		{
			const stopFeatureSet = _toRouteStopFeatureSet(this._routeStops);
			const routeParameters = await _getRouteParameters(stopFeatureSet);
			const response = await networkService.solveRoute(routeParameters);
			const routeResult = response?.results?.routeResults[0];
			this._routePaths = _calculateRoutePaths(routeResult);

			const fieldTripStops = _getFieldTripStops(this._fieldTrip);
			_updateFieldTripStops(fieldTripStops, this._routePaths);
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
					const fieldTripStops = _getFieldTripStops(this._fieldTrip);
					this._routePaths = await this.computeByEachStop(fieldTripStops);
					const alertInformation = _getNoSolutionStopInformation(fieldTripStops);
					tf.promiseBootbox.alert(alertInformation);
					return;
				}
			}

			tf.promiseBootbox.alert(`Cannot solve path. One or more of your stops is invalid or unreachable.`);
			return;
		}
	}

	FieldTripRoute.prototype.computeByEachStop = async function(fieldTripStops)
	{
		let result = [];
		if (!_meetMinimumRoutingStopsRequirement(this._routeStops))
		{
			return result;
		}

		const stopCount = fieldTripStops.length;
		if (stopCount !== this._routeStops.length)
		{
			return result;
		}

		let index = 0;
		while (index < stopCount)
		{
			const fieldTripStop = fieldTripStops[index];
			const routeStop = this._routeStops[index];
			const nextRouteStop = this._routeStops[index + 1];
			if (nextRouteStop)
			{
				try
				{
					const stopFeatureSet = _toRouteStopFeatureSet([routeStop, nextRouteStop]);
					const routeParameters = await _getRouteParameters(stopFeatureSet);
					const response = await networkService.solveRoute(routeParameters);
					const routeResult = response?.results?.routeResults[0];
					if (!routeResult)
					{
						_setEmptyPaths(fieldTripStop);
					}
					else
					{
						const routePaths = _calculateRoutePaths(routeResult);
						_updateFieldTripStop(fieldTripStop, routePaths[0]);
						result = result.concat(routePaths);
					}
				}
				catch (ex)
				{
					_setEmptyPaths(fieldTripStop);
				}
			}
			else
			{
				_setEmptyPaths(fieldTripStop);
			}

			index++;
		}

		return result;
	}

	FieldTripRoute.prototype.getRoutePaths = function()
	{
		return this._routePaths.map(item => item.Paths);
	}

	FieldTripRoute.prototype.moveStop = function(routeStopOptions)
	{
		const { sequence } = routeStopOptions;
		const routeStop = new TF.GIS.ADT.RouteStop(options);
		let _routeStop = this._routeStops.find(item => item.Sequence === sequence);
		_routeStop = routeStop;
	}

	FieldTripRoute.prototype.reset = function()
	{
		const fieldTripStops = _getFieldTripStops(this._fieldTrip);
		this._routeStops = _toRouteStops(fieldTripStops);
		_setMaximumStopSequence(this._routeStops);

		this._routePaths = [];
	}

	//#region Private Methods

	const _toRouteStops = (fieldTripStops) =>
	{
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

		return routeStops;
	}

	const _setMaximumStopSequence = (routeStops) =>
	{
		if (routeStops.length === 0)
		{
			MAX_STOP_SEQUENCE = -1;
		}
		else
		{
			const stopSequences = routeStops.map(item => item.Sequence).sort((a, b) => a - b);
			const lastSequence = stopSequences[stopSequences.length - 1];
			MAX_STOP_SEQUENCE = lastSequence;
		}
	}

	const _isLastStop = (fieldTripStop) => fieldTripStop.Sequence === MAX_STOP_SEQUENCE;

	const _getFieldTripStops = (fieldTrip) => fieldTrip.FieldTripStops;

	const _updateFieldTripStops = (fieldTripStops, routePaths) =>
	{
		const stopCount = fieldTripStops.length;
		if (routePaths.length !== stopCount - 1)
		{
			return;
		}

		for (let i = 0; i < stopCount; i++)
		{
			const fieldTripStop = fieldTripStops[i];
			const routePath = routePaths[i];
			if (routePath)
			{
				_updateFieldTripStop(fieldTripStop, routePath);
			}
			else if (_isLastStop(fieldTripStop))
			{
				_setEmptyPaths(fieldTripStop);
			}
		}
	}

	const _updateFieldTripStop = (fieldTripStop, routePath) =>
	{
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
		else
		{
			_setEmptyPaths(fieldTripStop);
		}
	}

	const _calculateRoutePaths = (routeResult) =>
	{
		const routePaths = [];
		const directions = routeResult.directions;
		if (directions === null)
		{
			return routePaths;
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

		return routePaths;
	}

	const _meetMinimumRoutingStopsRequirement = (stops) => stops.length >= TF.GIS.NetworkEnum.MIN_ROUTING_STOP_COUNT;

	const _toRouteStopFeatureSet = (routeStops) =>
	{
		const routeStopGraphics = routeStops.map(item => item.toGraphic());
		return new TF.GIS.SDK.FeatureSet({ features: routeStopGraphics});
	}

	const _getRouteParameters = async (stopFeatureSet) =>
	{
		const travelModeName = TF.GIS.ADT.FieldTripRouteConfiguration.TRAVEL_MODE;
		const travelMode = await networkService.fetchSupportedTravelModes(travelModeName);
		return {
			travelMode: travelMode,
			preserveFirstStop: true,
			preserveLastStop: true,
			restrictUTurns: TF.GIS.ADT.FieldTripRouteConfiguration.U_TURN_POLICY,
			stops: stopFeatureSet
		};
	}

	const _setEmptyPaths = (fieldTripStop) =>
	{
		fieldTripStop.Paths = [];
		fieldTripStop.DrivingDirections = "";
		fieldTripStop.Speed = 0;
		fieldTripStop.Distance = 0;
	}

	const _getNoSolutionStopInformation = (fieldTripStops) =>
	{
		return fieldTripStops.reduce(({message, findInvalidStop}, stop, index, array) =>
			{
				const isTerminalStop = _.last(array) == stop;
				if (!findInvalidStop)
				{
					if (stop.Paths.length === 0 && !isTerminalStop)
					{
						message += ` No solution found from Stop ${stop.Sequence}`
						return { message, findInvalidStop: true };
					}
				}
				else if (findInvalidStop && (stop.Paths.length > 0 || isTerminalStop))
				{
					message +=` to Stop ${ stop.Sequence }.`
					return { message, findInvalidStop: false};
				}

				return { message, findInvalidStop };
			}, { message: "Cannot solve path.", findInvalidStop: false});
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
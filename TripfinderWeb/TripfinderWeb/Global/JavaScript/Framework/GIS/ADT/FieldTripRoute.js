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

	Object.defineProperty(FieldTripRoute.prototype, "Color", {
		get() { return this._fieldTrip.color; },
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(FieldTripRoute.prototype, "IsEmpty", {
		get() { return this.getRoutePaths().length === 0; },
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
					this._routePaths = await _computeByEachStop(fieldTripStops, this._routeStops);
					const alertInformation = _getNoSolutionStopInformation(fieldTripStops);
					tf.promiseBootbox.alert(alertInformation);
					return;
				}
			}

			tf.promiseBootbox.alert(`Cannot solve path. One or more of your stops is invalid or unreachable.`);
			return;
		}
	}

	FieldTripRoute.prototype.computeEmptyPath = async function()
	{
		const routeStops = this._routeStops;
		const fieldTripStops = _getFieldTripStops(this._fieldTrip);

		console.assert(routeStops.length === fieldTripStops.length, "fieldTripStops and routeStops not matched!");

		for (let i = 0, stopCount = routeStops.length; i < stopCount; i++)
		{
			const fieldTripStop = fieldTripStops[i];
			if (fieldTripStop.Paths?.length > 0)
			{
				continue;
			}

			const routeStop = routeStops[i];
			const nextRouteStop = routeStops[i + 1];

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
						let routePath = this._routePaths.find(item => item.Id === routeStop.Id);
						routePath = routePaths[0];

						_updateFieldTripStop(fieldTripStop, routePath);
					}
				}
				catch (ex)
				{
					console.log(ex);
					_setEmptyPaths(fieldTripStop);
				}
			}
			else
			{
				_setEmptyPaths(fieldTripStop);
			}
		}
	}

	FieldTripRoute.prototype.getRoutePaths = function()
	{
		return this._routePaths.map(item => item.Paths);
	}

	FieldTripRoute.prototype.clearRoutePath = function()
	{
		this._routePaths = [];
	}

	FieldTripRoute.prototype.getRouteStops = function() 
	{
		return this._routeStops;
	}

	FieldTripRoute.prototype.addRouteStops = function(routeStops)
	{
		this._routeStops = this._routeStops.concat(routeStops);
		this._routeStops.sort((a, b) => a.Sequence - b.Sequence);
	}

	FieldTripRoute.prototype.removeRouteStops = async function(routeStopIds)
	{
		// _removeFieldTripStops(this._fieldTrip, routeStopIds);

		for (let i = 0; i < routeStopIds.length; i++)
		{
			const routeStopId = routeStopIds[i];
			const routeStopIndex = this._routeStops.findIndex(item => item.Id === routeStopId);
			if (routeStopIndex >= 0)
			{
				// remove route stop
				this._routeStops.splice(routeStopIndex, 1);
			}
		}
	}

	FieldTripRoute.prototype.removeRoutePaths = function(routeStopIds)
	{
		for (let i = 0; i < routeStopIds.length; i++)
		{
			const routeStopId = routeStopIds[i];
			const routePathIndex = this._routePaths.findIndex(item => item.Id === routeStopId);
			if (routePathIndex >= 0)
			{
				// remove route path
				this._routePaths.splice(routePathIndex, 1);

				if (routePathIndex > 0)
				{
					// reset previous route path for recalculate route.
					const previousRoutePath = this._routePaths[routePathIndex - 1];
					previousRoutePath.clear();
				}
			}
		}
	}

	FieldTripRoute.prototype.refreshRouteStopSequence = function()
	{
		this._routeStops.map((item, index) => item.Sequence = (index + 1));

		// const fieldTripStops = _getFieldTripStops(this._fieldTrip);
		// fieldTripStops.map((item, index) => item.Sequence = (index + 1));
	}

	FieldTripRoute.prototype.moveStop = function(routeStopOptions)
	{
		const { sequence } = routeStopOptions;
		const routeStop = new TF.GIS.ADT.RouteStop(routeStopOptions);
		let _routeStop = this._routeStops.find(item => item.Sequence === sequence);
		_routeStop = routeStop;
	}

	FieldTripRoute.prototype.reset = function()
	{
		const fieldTripStops = _getFieldTripStops(this._fieldTrip);
		this._routeStops = _toRouteStops(fieldTripStops);
		_setMaximumStopSequence(this._routeStops);

		this.clearRoutePath();
	}

	FieldTripRoute.prototype.dispose = function()
	{
		this._fieldTrip = null;
		this._routeStops = null;
		this._routePaths = null;
	}

	//#region Private Methods

	const _toRouteStops = (fieldTripStops) =>
	{
		const routeStops = [];
		for (let i = 0, count = fieldTripStops.length; i < count; i++)
		{
			const fieldTripStop = fieldTripStops[i];
			const options = {
				id: fieldTripStop.id,
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
				_setRoutePathId(routePath, fieldTripStop);
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
		const ENABLE_TRAVEL_MODE = false;
		let travelMode = null;

		if (ENABLE_TRAVEL_MODE)
		{
			const travelModeName = TF.GIS.ADT.FieldTripRouteConfiguration.TRAVEL_MODE;
			travelMode = await networkService.fetchSupportedTravelModes(travelModeName);
			travelMode.uturnAtJunctions = TF.GIS.ADT.FieldTripRouteConfiguration.U_TURN_POLICY;
		}

		return {
			travelMode: travelMode,
			preserveFirstStop: true,
			preserveLastStop: true,
			stops: stopFeatureSet
		};
	}

	const _setEmptyPaths = (fieldTripStop) =>
	{
		fieldTripStop.DrivingDirections = "";
		fieldTripStop.RouteDrivingDirections = "";
		fieldTripStop.IsCustomDirection = false;
		fieldTripStop.Speed = 0;
		fieldTripStop.StreetSpeed = 0;
		fieldTripStop.Distance = 0;
		fieldTripStop.Paths = [];
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

	const _computeByEachStop = async (fieldTripStops, routeStops) =>
	{
		let result = [];
		if (!_meetMinimumRoutingStopsRequirement(routeStops))
		{
			return result;
		}

		const stopCount = fieldTripStops.length;
		if (stopCount !== routeStops.length)
		{
			return result;
		}

		let index = 0;
		while (index < stopCount)
		{
			const fieldTripStop = fieldTripStops[index];
			const routeStop = routeStops[index];
			const nextRouteStop = routeStops[index + 1];
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
						_setRoutePathId(routePaths[0], fieldTripStop);
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

	const _setRoutePathId = (routePath, fieldTripStop) => routePath.Id = fieldTripStop.id;

	const _removeFieldTripStops = (fieldTrip, fieldTripStopIds) =>
	{
		const fieldTripStops = _getFieldTripStops(fieldTrip);
		for (let i = 0; i < fieldTripStopIds.length; i++)
		{
			const stopId = fieldTripStopIds[i];
			const fieldTripStopIndex = fieldTripStops.findIndex(item => item.id === stopId);
			if (fieldTripStopIndex >= 0)
			{
				fieldTripStops.splice(fieldTripStopIndex, 1);

				if (fieldTripStopIndex > 0)
				{
					// reset previous field trip stop for recalculate route.
					const previousFieldTripStop = fieldTripStops[fieldTripStopIndex - 1];
					_setEmptyPaths(previousFieldTripStop);
				}
			}
		}
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
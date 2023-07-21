(function()
{
	createNamespace("TF.GIS.Analysis").NetworkService = NetworkService;

	const MODE = {
		ONLINE: "online",
		SERVER: "server"
	};

	const defaultOptions = {
		mode: MODE.ONLINE,
		onlineToken: "AAPK831e30fbca2e488eb45497c69f753bc6ufPNUlFdFwgUJODDnT0wC1wWks-xJN2dLidH1m9x3bB-Mov6i1RbGoVAVwLgjn8P",
		onlineNetworkServiceRouteUrl: "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World",
		serverNetworkServiceRouteUrl: null,
	};

	const CURB_APPROACH = {
		'EITHER_SIDE': 0,
		'RIGHT_SIDE': 1,
		'LEFT_SIDE': 2,
		'NO_U_TURN': 3
	};

	const LOCATION_TYPE = {
		'STOP': 0,
		'WAY_POINT': 1,
		'BREAK': 2
	};

	const U_TURN_POLICY = {
		'ALLOWED': 'allow-backtrack',
		'INTERSECTION_AND_DEAD_ENDS_ONLY': 'at-dead-ends-and-intersections',
		'DEAD_ENDS_ONLY': 'at-dead-ends-only',
		'NOT_ALLOWED': 'no-backtrack'
	};

	function NetworkService(options)
	{
		this.settings = Object.assign({}, defaultOptions, options);
		this._mode = this.settings.mode;
		this.name = `NetworkService - ${Date.now()}`;
		this.defineReadOnlyProperty('CURB_APPROACH', CURB_APPROACH);
		this.defineReadOnlyProperty('LOCATION_TYPE', LOCATION_TYPE);
		this.defineReadOnlyProperty('U_TURN_POLICY', U_TURN_POLICY);
	}

	Object.defineProperty(NetworkService.prototype, 'mode', {
		get() { return this._mode; },
		enumerable: false,
		configurable: false
	});

	NetworkService.prototype.setMode = function(mode = MODE.ONLINE)
	{
		if (![MODE.ONLINE, MODE.SERVER].includes(mode)) {
			mode = MODE.ONLINE;
		}

		this._mode = mode;
	}

	NetworkService.prototype.solveRoute = async function(parameters)
	{
		const self = this;

		const url = self.getValidRouteUrl("solveRoute");
		if (url === null) {
			return;
		}

		const defaultParameters = {
			directionsLengthUnits: 'kilometers',
			findBestSequence: false,
			ignoreInvalidLocations: false,
			impedanceAttribute: null,
			outputGeometryPrecision: 0,
			outputGeometryPrecisionUnits: "feet",
			outputLines: 'true-shape',
			outSpatialReference: "3857",
			pointBarriers: null,
			polylineBarriers: null,
			polygonBarriers: null,
			preserveFirstStop: false,
			preserveLastStop: false,
			restrictionAttributes: [],
			restrictUTurns: U_TURN_POLICY.DEAD_ENDS_ONLY,
			returnBarriers: false,
			returnDirections: true,
			returnPolygonBarriers: false,
			returnPolylineBarriers: false,
			returnPointBarriers: false,
			returnRoutes: true,
			returnStops: true,
			returnZ: false,
			startTime: new Date()
		};

		return new Promise((resolve, reject) =>
		{
			require({}, ["esri/config", "esri/tasks/RouteTask", "esri/tasks/support/RouteParameters"], (esriConfig, RouteTask, RouteParameters) =>
			{
				self.setOnlineToken(esriConfig);

				let results = null, errorMessage = null;
				const routeTask = new RouteTask(url);
				const params = Object.assign({}, defaultParameters, parameters);
				const routeParameters = new RouteParameters(params);

				return routeTask.solve(routeParameters).then((response) => {
					results = response;
					// console.log(results);

					self.clearOnlineToken(esriConfig);
					resolve( { results, errorMessage });
				}).catch((error) => {
					self.clearOnlineToken(esriConfig);

					const unlocatedStopNames = (error?.details?.messages || []).reduce((result, message) => {
						const mateched = (params.stops.features || []).find(stop => message === `Location "${stop.attributes.Name}" in "Stops" is unlocated.  Invalid locations detected.`);
						return mateched ? result.concat(mateched.attributes.Name) : result;
					}, []);
					reject({ results, originalParameters: params, ...error, unlocatedStopNames });
				});
			});
		});
	}

	NetworkService.prototype.getValidRouteUrl = function(callerName)
	{
		const self = this;
		const url = self.getRouteUrl();
		if (url === null) {
			console.warn(`NetworkService.prototype.${callerName} - No available network service route url. ${callerName} cancelled.`);
		}

		return url;
	}

	NetworkService.prototype.getRouteUrl = function()
	{
		const self = this;

		let url = null;
		if (self.mode === MODE.ONLINE) {
			url = self.settings.onlineNetworkServiceRouteUrl;
		} else if (self.mode === MODE.SERVER) {
			url = self.settings.serverNetworkServiceRouteUrl;
		}

		return url;
	}

	NetworkService.prototype.setOnlineToken = function(esriConfig)
	{
		const self = this;
		if (self.mode !== MODE.ONLINE) {
			return;
		}

		esriConfig.apiKey = self.settings.onlineToken;
	}

	NetworkService.prototype.clearOnlineToken = function(esriConfig)
	{
		if (this.mode !== MODE.ONLINE) {
			return;
		}

		esriConfig.apiKey = null;
	}

	NetworkService.prototype.createStopFeatureSet = async function(stops)
	{
		const defaultOptions = {
			curbApproach: CURB_APPROACH.EITHER_SIDE,
			locationType: LOCATION_TYPE.STOP,
			name: "defaultStopName",
			sequence: null
		};

		return new Promise((resolve, reject) =>
		{
			require(["esri/Graphic", "esri/geometry/Point", "esri/geometry/support/webMercatorUtils", "esri/tasks/support/FeatureSet"],
				(Graphic, Point, webMercatorUtils, FeatureSet) =>
			{
				let graphics = [], featureSet = null;
				for (let i = 0; i < stops.length; i++)
				{
					const stop = stops[i],
						stopOptions = Object.assign({}, defaultOptions, stop),
						longitude = stop.longitude,
						latitude = stop.latitude;
					if (longitude == 0 || latitude == 0)
					{
						continue;
					}

					const pointProperties = { longitude, latitude },
						geometry = webMercatorUtils.geographicToWebMercator(new Point(pointProperties)),
						attributes = {
							CurbApproach: stopOptions.curbApproach,
							Name: stopOptions.name,
							LocationType: stopOptions.locationType,
							Sequence: stopOptions.sequence
						},
						graphic = new Graphic(geometry, null, attributes);

					graphics.push(graphic);
				}

				if (graphics.length > 0)
				{
					featureSet = new FeatureSet({ features: graphics});
				}

				resolve(featureSet);
			});
		});
	}

	NetworkService.prototype.defineReadOnlyProperty = function(propertyName, value)
	{
		Object.defineProperty(this, propertyName, {
			get() { return value; },
			enumerable: false,
			configurable: false
		});
	};

	NetworkService.prototype.unitTest = async function()
	{
		const stop1 = {
			curbApproach: CURB_APPROACH.RIGHT_SIDE,
			name: "Stop 1 - Transfinder",
			sequence: 1,
			longitude: -73.940962,
			latitude: 42.813198,
		}, stop2 = {
			curbApproach: CURB_APPROACH.RIGHT_SIDE,
			name: "Stop 2 - 43 New Scotland Ave.",
			sequence: 2,
			longitude: -73.755210,
			latitude: 42.651550,
		};

		const stopFeatureSet = await this.createStopFeatureSet([stop1, stop2]);

		const params = {
			stops: stopFeatureSet,
		};
		this.solveRoute(params).then((response) =>
		{
			console.log(JSON.stringify(response));
		});
	}

})();
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
		onlineNetworkServiceTravelModesUrl: "https://route-api.arcgis.com/GetTravelModes/execute?f=pjson&token=",
		serverNetworkServiceRouteUrl: null,
	};

	function NetworkService(options)
	{
		this.settings = Object.assign({}, defaultOptions, options);
		this._mode = this.settings.mode;
		this.name = `NetworkService - ${Date.now()}`;
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
			outSpatialReference: TF.GIS.GeometryEnum.WKID.WEB_MERCATOR.toString(),
			pointBarriers: null,
			polylineBarriers: null,
			polygonBarriers: null,
			preserveFirstStop: false,
			preserveLastStop: false,
			restrictionAttributes: [],
			restrictUTurns: TF.GIS.NetworkEnum.U_TURN_POLICY.DEAD_ENDS_ONLY,
			returnBarriers: false,
			returnDirections: true,
			returnPolygonBarriers: false,
			returnPolylineBarriers: false,
			returnPointBarriers: false,
			returnTraversedEdges: false,
			returnTraversedJunctions: false,
			returnTraversedTurns: false,
			returnRoutes: true,
			returnStops: true,
			returnZ: false,
			startTime: new Date()
		};

		return new Promise((resolve, reject) =>
		{
			require({}, ["esri/config", "esri/rest/route", "esri/rest/support/RouteParameters"], (esriConfig, route, RouteParameters) =>
			{
				self.setOnlineToken(esriConfig);

				let results = null, errorMessage = null;
				const params = Object.assign({}, defaultParameters, parameters);
				const routeParameters = new RouteParameters(params);

				return route.solve(url, routeParameters).then((response) => {
					results = response;

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
			curbApproach: TF.GIS.NetworkEnum.CURB_APPROACH.EITHER_SIDE,
			locationType: TF.GIS.NetworkEnum.LOCATION_TYPE.STOP,
			name: "defaultStopName",
			sequence: null
		};

		return new Promise((resolve, reject) =>
		{
			require(["esri/Graphic", "esri/geometry/Point", "esri/geometry/support/webMercatorUtils", "esri/rest/support/FeatureSet"],
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

	NetworkService.prototype.fetchSupportedTravelModes = async function(travelModeName = null)
	{
		const self = this;

		const url = self.getValidRouteUrl("fetchSupportedTravelModes");
		if (url === null) {
			return;
		}

		return new Promise((resolve, reject) =>
		{
			require(["esri/rest/networkService"], (networkService) =>
			{
				(async function()
				{
					const serviceDescription = await networkService.fetchServiceDescription(url, self.settings.onlineToken);
					const { supportedTravelModes } = serviceDescription;
					if (travelModeName !== null)
					{
						const travelMode = supportedTravelModes.filter(item => item.name === travelModeName)[0];
						resolve(travelMode);
					}
					
					resolve(supportedTravelModes);
				})();
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
			curbApproach: TF.GIS.NetworkEnum.CURB_APPROACH.RIGHT_SIDE,
			name: "Stop 1 - Transfinder",
			sequence: 1,
			longitude: -73.940962,
			latitude: 42.813198,
		}, stop2 = {
			curbApproach: TF.GIS.NetworkEnum.CURB_APPROACH.RIGHT_SIDE,
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

		const travelModes = await this.fetchSupportedTravelModes(TF.GIS.NetworkEnum.SUPPORT_TRAVEL_MODE.DRIVING_TIME);
		console.log(travelModes);
	}

})();
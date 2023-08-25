(function()
{
	createNamespace("TF.GIS.Analysis").PlaceService = PlaceService;

	const MODE = {
		ONLINE: "online",
		SERVER: "server"
	};

	const defaultOptions = {
		mode: MODE.ONLINE,
		onlineToken: "AAPK831e30fbca2e488eb45497c69f753bc6ufPNUlFdFwgUJODDnT0wC1wWks-xJN2dLidH1m9x3bB-Mov6i1RbGoVAVwLgjn8P",
		onlineGeocodeServiceUrl: "https://places-api.arcgis.com/arcgis/rest/services/places-service/v1",
		serverGeocodeServiceUrl: null,
	};

	function PlaceService(options)
	{
		this.settings = Object.assign({}, defaultOptions, options);
		this._mode = this.settings.mode;
		this.name = `PlaceService - ${Date.now()}`;
	}

	PlaceService.prototype.constructor = PlaceService;

	Object.defineProperty(PlaceService.prototype, 'mode', {
		get() { return this._mode; },
		enumerable: false,
		configurable: false
	});

	PlaceService.prototype.setMode = function(mode = MODE.ONLINE)
	{
		if (![MODE.ONLINE, MODE.SERVER].includes(mode)) {
			mode = MODE.ONLINE;
		}

		this._mode = mode;
	}

	PlaceService.prototype.showDebugInfo = function()
	{
		console.log(`PlaceService Information: ${this.mode}, ${this.name}`);
	}

	// Note: Places permission in Location Services is required for ArcGIS Online.
	PlaceService.prototype.findPlaces = async function(location, searchText, categoryIds = null, searchRadius = 1000, extent = null, pageSize = 20)
	{
		const self = this;
		return new Promise((resolve, reject) =>
		{
			require({}, ["esri/rest/places", "esri/rest/support/PlacesQueryParameters"], (places, PlacesQueryParameters) =>
			{
				const defaultOptions = {
					apiKey: self.settings.onlineToken,
					radius: searchRadius,
					pageSize: pageSize
				};
				if (categoryIds !== null)
				{
					defaultOptions["categoryIds"] = categoryIds;
				}

				if (extent !== null)
				{
					defaultOptions["extent"] = extent;
				}

				const params = Object.assign({}, defaultOptions, {
					point: location,
					searchText: searchText,
				});

				const placesQueryParameters = new PlacesQueryParameters(params);
				
				let message = null;
				places.queryPlacesNearPoint(placesQueryParameters).then((placesQueryResult) =>
				{
					const results = placesQueryResult.results;
					resolve({ results, message });
				}).catch((error) =>
				{
					message = `No places was found for this location ${JSON.stringify(location)}, searchText: ${searchText}, categoryIds: ${categoryIds}, searchRadius: ${searchRadius}`;
					reject({ error, message });
				});
			});
		});
	}

	PlaceService.prototype.fetchPOIDetails = async function(placeId, fields = ["all"])
	{
		const self = this;
		return new Promise((resolve, reject) =>
		{
			require({}, ["esri/rest/places", "esri/rest/support/FetchPlaceParameters"], (places, FetchPlaceParameters) =>
			{
				const params = new FetchPlaceParameters({
					apiKey: self.settings.onlineToken,
					placeId: placeId,
					requestedFields: fields
				});

				let errorMessage = null;
				places.fetchPlace(params).then((fetchResult) =>
				{
					const results = fetchResult.placeDetails;
					resolve({ results, errorMessage });
				}).catch((error) =>
				{
					errorMessage = `No places was found for this placeId: ${placeId}`;
					reject({ errorMessage });
				});
			});
		});
	}

	PlaceService.prototype.dispose = function()
	{
		this.settings = null;
		this._mode = null;
		this.name = null;
	}
})();
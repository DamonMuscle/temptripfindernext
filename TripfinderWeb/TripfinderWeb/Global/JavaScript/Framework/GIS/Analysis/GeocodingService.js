/*

Sample:

// location to address

const analysis = TF.GIS.Analysis.getInstance();

const location = { x: -73.888011, y: 42.817926 };
analysis.geocodeService.locationToAddress(location).then((result) => {
	console.log(result);
	// '{"address":"Niskayuna High School Dr, Schenectady, New York, 12309","score":100,"errorMessage":null}'
}).catch((error) => {
	console.log(error);
});

// address to location

const address = {
	Street: "Niskayuna High School Dr",
	City: "Schenectady",
	State: "New York",
	Zone: "12309"
};

// const address = {
// 	SingleLine: "Niskayuna High School Dr, Schenectady, New York, 12309"
// };

analysis.geocodeService.addressToLocations(address).then((result) => {
	console.log({
		x: result.location.x,
		y: result.location.y,
		score: result.score
	});
	// '{"x":-73.94121999999999,"y":42.812380000000076,"score":100}'
}).catch((error) => {
	console.log(error);
});

// addresses to locations

const address1 = {
	OBJECTID: 0,
	"Single Line Input": "Niskayuna High School Dr, Schenectady, New York, 12309"
};
const address2 = {
	OBJECTID: 1,
	"Single Line Input": "440 State Street, Schenectady, New York, 12306"
};
analysis.geocodeService.addressesToLocations([address1, address2]).then((results) => {
	console.log(results);
}).catch((error) => {
	console.log(error);
});

// suggest addresses

const searchAddress = "440 State Street";
analysis.geocodeService.suggestLocations(searchAddress).then((result) => {
	console.log(result.addresses);
	// '["440 State Street Ext, Rock Hill, SC, 29730, USA",
	//   "440 State St SW, Cookeville, TN, 37902, USA",
	//   "440 State St, Alvord, TX, 76225, USA",
	//   "440 State St, Bay Saint Louis, MS, 39520, USA",
	//   "440 State St, Big Spring, TX, 79720, USA"]'
}).catch((error) => {
	console.log(error.errorMessage);
});

*/

(function()
{
	createNamespace("TF.GIS.Analysis").GeocodingService = GeocodingService;

	const MODE = {
		ONLINE: "online",
		SERVER: "server"
	};

	const defaultOptions = {
		mode: MODE.ONLINE,
		onlineToken: "AAPK831e30fbca2e488eb45497c69f753bc6ufPNUlFdFwgUJODDnT0wC1wWks-xJN2dLidH1m9x3bB-Mov6i1RbGoVAVwLgjn8P",
		onlineGeocodeServiceUrl: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
		serverGeocodeServiceUrl: null,
	};

	function GeocodingService(options)
	{
		this.settings = Object.assign({}, defaultOptions, options);
		this._mode = this.settings.mode;
		this.name = `GeocodingService - ${Date.now()}`;
	}

	GeocodingService.prototype.constructor = GeocodingService;

	Object.defineProperty(GeocodingService.prototype, 'mode', {
		get() { return this._mode; },
		enumerable: false,
		configurable: false
	});

	GeocodingService.prototype.setMode = function(mode = MODE.ONLINE)
	{
		if (![MODE.ONLINE, MODE.SERVER].includes(mode)) {
			mode = MODE.ONLINE;
		}

		this._mode = mode;
	}

	GeocodingService.prototype.showDebugInfo = function()
	{
		console.log(`GeocodingService Information: ${this.mode}, ${this.name}`);
	}

	GeocodingService.prototype.addressToLocations = async function(address)
	{
		const self = this;

		const url = self.getValidLocatorUrl("addressToLocations");
		if (url === null) {
			return;
		}

		return new Promise((resolve, reject) =>
		{
			require({}, ["esri/config", "esri/tasks/Locator", "esri/geometry/SpatialReference"], (esriConfig, Locator, SpatialReference) =>
			{
				self.setOnlineToken(esriConfig);

				let location = null, errorMessage = null;
				const outSpatialReference = SpatialReference.WGS84;
				const locator = new Locator({ url, outSpatialReference });

				const paramData = address.constructor === Object ? address : { address };
				locator.addressToLocations(paramData).then((response) => {
					if (response && response.length > 0) {
						const matched = response[0];
						const location = matched.location;
						const score = matched.score;

						self.clearOnlineToken(esriConfig);
						resolve({ location, score, errorMessage });
					} else {
						errorMessage = `No location was found for this address ${JSON.stringify(address)}`;

						self.clearOnlineToken(esriConfig);
						reject({ location, errorMessage });
					}
				}).catch(() => {
					errorMessage = `No location was found for this address ${JSON.stringify(address)}`;

					self.clearOnlineToken(esriConfig);
					reject({ location, errorMessage });
				});
			});
		});
	}

	GeocodingService.prototype.addressesToLocations = async function(addresses)
	{
		const self = this;
		const url = self.getValidLocatorUrl("addressesToLocations");
		if (url === null) {
			return;
		}

		return new Promise((resolve, reject) =>
		{
			require({}, ["esri/config", "esri/tasks/Locator", "esri/geometry/SpatialReference"], (esriConfig, Locator, SpatialReference) =>
			{
				self.setOnlineToken(esriConfig);

				let locations = null, errorMessage = null;
				const outSpatialReference = SpatialReference.WGS84;
				const locator = new Locator({ url, outSpatialReference });

				locator.addressesToLocations({ addresses }).then((response) => {

					if (response && response.length > 0) {
						console.log(response);

						resolve([]);
					} else {
						errorMessage = `No locations was found for addresses ${JSON.stringify(addresses)}`;

						self.clearOnlineToken(esriConfig);
						reject({ location, errorMessage });
					}

				}).catch((ex) => {
					// 'User does not have permissions to store geocoding results.'
					console.log(ex);
					errorMessage = `No locations was found for addresses ${JSON.stringify(addresses)}`;

					self.clearOnlineToken(esriConfig);
					reject({ location, errorMessage });
				});
			});
		});
	}

	GeocodingService.prototype.locationToAddress = async function(location)
	{
		const self = this;
		const url = self.getValidLocatorUrl("locationToAddress");
		if (url === null) {
			return;
		}

		return new Promise((resolve, reject) =>
		{
			try 
			{
				require({}, ["esri/config", "esri/tasks/Locator", "esri/geometry/SpatialReference"], (esriConfig, Locator, SpatialReference) =>
				{
					self.setOnlineToken(esriConfig);

					let address = null, errorMessage = null;
					const outSpatialReference = SpatialReference.WGS84;
					const locator = new Locator({ url, outSpatialReference });
					
					locator.locationToAddress({ location }).then((response) => {
						address = response.address;
						const score = response.score;
						const attributes = response.attributes;
		
						self.clearOnlineToken(esriConfig);
						resolve( { address, attributes, score, errorMessage });
					}).catch(() => {
						errorMessage = `No address was found for this location ${JSON.stringify(location)}`;
						
						self.clearOnlineToken(esriConfig);
						reject({ address, errorMessage });
					});
				});
			}
			catch (ex)
			{
				console.log(ex);
			}
		});
	}

	GeocodingService.prototype.suggestLocations = function(searchAddress)
	{
		const self = this;
		const url = self.getValidLocatorUrl("suggestLocations");
		if (url === null) {
			return;
		}

		return new Promise((resolve, reject) =>
		{
			require({}, ["esri/config", "esri/tasks/Locator", "esri/geometry/SpatialReference"], (esriConfig, Locator, SpatialReference) =>
			{
				self.setOnlineToken(esriConfig);

				let addresses = null, errorMessage = null;
				const outSpatialReference = SpatialReference.WGS84;
				const locator = new Locator({ url, outSpatialReference });
				
				locator.suggestLocations({ text: searchAddress }).then((response) => {
					addresses = response.map(item => {
						const [country, zip, state, city, street]= item.text.split(",").map(x=>x.trim()).reverse();
						return { text: item.text, country, zip, state, city, street };
					}).filter((item) => {
						const zipShouldBeDigits = /^[\d]+$/;
						return zipShouldBeDigits.test(item.zip) && item.street != null;
					});
	
					self.clearOnlineToken(esriConfig);
					resolve( { addresses, errorMessage });
				}).catch(() => {
					errorMessage = `No address was found for this location ${JSON.stringify(location)}`;
					
					self.clearOnlineToken(esriConfig);
					reject({ addresses, errorMessage });
				});
			});
		});
	}

	GeocodingService.prototype.suggestLocationsREST = async function(searchAddress)
	{
		const self = this;
		const url = self.getValidLocatorUrl("suggestLocationsREST");
		if (url === null) {
			return;
		}

		return new Promise((resolve, reject) =>
		{
			let addresses = null, errorMessage = null;
			const suggestUrl = `${url}/suggest`;
			$.ajax({
				url: suggestUrl,
				data: {
					countryCode: "USA",
					text: searchAddress,
					token: self.mode === MODE.ONLINE ? self.settings.onlineToken : null,
					f: "json"
				},
				success: (response) => {
					const suggestions = response.suggestions;
					addresses = suggestions.map(item => {
						const [country, zip, state, city, street]= item.text.split(",").map(x=>x.trim()).reverse();
						return { text: item.text, country, zip, state, city, street, magicKey: item.magicKey };
					}).filter((item) => {
						const zipShouldBeDigits = /^[\d]+$/;
						return zipShouldBeDigits.test(item.zip) && item.street != null;
					});
	
					resolve( { addresses, errorMessage });
				}
			});
		});
	}

	GeocodingService.prototype.findAddressCandidatesREST = async function(searchAddress, magicKey)
	{
		const self = this;
		const url = self.getValidLocatorUrl("suggestLocationsREST");
		if (url === null) {
			return;
		}

		return new Promise((resolve, reject) =>
		{
			let location = null, errorMessage = null;
			const findAddressCandidatesUrl = `${url}/findAddressCandidates`;
			$.ajax({
				url: findAddressCandidatesUrl,
				data: {
					magicKey: magicKey,
					text: searchAddress,
					token: self.mode === MODE.ONLINE ? self.settings.onlineToken : null,
					f: "json"
				},
				success: (response) => {
					if (response && response.candidates && response.candidates.length > 0) {
						const matched = response.candidates[0];
						const location = matched.location;
						const score = matched.score;

						resolve({ location, score, errorMessage });
					} else {
						errorMessage = `No location was found for this address ${JSON.stringify(searchAddress)}`;

						reject({ location, errorMessage });
					}
				}
			});
		});
	}

	GeocodingService.prototype.getValidLocatorUrl = function(callerName)
	{
		const self = this;
		const url = self.getLocatorUrl();
		if (url === null) {
			console.warn(`GeocodingService.prototype.${callerName} - No available geocoding service url. ${callerName} cancelled.`);
		}

		return url;
	}

	GeocodingService.prototype.getLocatorUrl = function()
	{
		const self = this;

		let url = null;
		if (self.mode === MODE.ONLINE) {
			url = self.settings.onlineGeocodeServiceUrl;
		} else if (self.mode === MODE.SERVER) {
			url = self.settings.serverGeocodeServiceUrl;
		}

		return url;
	}

	GeocodingService.prototype.isAvailableCountry = function(countryCode)
	{
		const AVAILABLE_COUNTRY_CODE = ['USA', 'CAN'];
		return AVAILABLE_COUNTRY_CODE.includes(countryCode)
	}

	GeocodingService.prototype.setOnlineToken = function(esriConfig)
	{
		const self = this;
		if (self.mode !== MODE.ONLINE) {
			return;
		}

		esriConfig.apiKey = self.settings.onlineToken;
	}

	GeocodingService.prototype.clearOnlineToken = function(esriConfig)
	{
		if (this.mode !== MODE.ONLINE) {
			return;
		}

		esriConfig.apiKey = null;
	}

	GeocodingService.prototype.unitTest = function()
	{
		let address = {
			Street: "Disney World",
			City: "Lake Buena Vista",
			State: "FL",
			Zone: null
		};
		
		// const address = {
		// 	SingleLine: "Niskayuna High School Dr, Schenectady, New York, 12309"
		// };

		address = {
			Street: "Vale Park",
			City: "Schenectady",
			State: null,
			Zone: null
		};
		
		// this.addressToLocations(address).then((result) => {
		// 	console.log({
		// 		x: result.location.x,
		// 		y: result.location.y,
		// 		score: result.score
		// 	});
		// 	// '{"x":-73.94121999999999,"y":42.812380000000076,"score":100}'
		// }).catch((error) => {
		// 	console.log(error);
		// });


		// const searchAddress = "1 Mickey Mouse Blvd, Lake Buena Vista, FL";
		// let searchAddress = "1 Mickey Mouse Blvd, Lake Buena Vista, Florida";
		// this.suggestLocations(searchAddress).then((result) => {
		// 	console.log(result.addresses);
		// }).catch((error) => {
		// 	console.log(error.errorMessage);
		// });

		let searchAddress = "mmm";
		this.suggestLocationsREST(searchAddress).then((result) => {
			console.log(result.addresses);
		}).catch((error) => {
			console.log(error.errorMessage);
		});
	}

	GeocodingService.prototype.dispose = function()
	{
		this.settings = null;
		this._mode = null;
		this.name = null;
	}
})();
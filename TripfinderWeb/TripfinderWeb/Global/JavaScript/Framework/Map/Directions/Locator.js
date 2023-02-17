(function()
{
	Tool = TF.RoutingMap.Directions.Tool;

	// Using Search Dijit to replace GeoCode Server.
	Tool.prototype._initLocator = function()
	{
		var self = this;

		self._searchTool = new self._arcgis.Search({
			'allPlaceholder': 'Enter address or location',
			'autoSelect': false,
			'locationEnabled': false,
			'maxResults': 1,
			'maxSuggestions': 1,
			'popupEnabled': false,
			'resultGraphicEnabled': false,
			'searchAllEnabled': false,
			'suggestionsEnabled': false,
			"includeDefaultSources": false,
			'view': self._map.mapView,
			sources: [
				{
					locator: new self._arcgis.Locator({ url: arcgisUrls.StreetGeocodeServiceFile }),
					singleLineFieldName: "SingleLine",
					outFields: ["Addr_type"],
					name: "Geocoding Service",
					localSearchOptions: {
						distance: 100
					}
				}
			]
		}, self._arcgis.domConstruct.create("div"));
	};

	Tool.prototype._disposeLocator = function()
	{
		var self = this;
		self._searchTool = null;
	};

	Tool.prototype._getAddress = function(mapPoint)
	{
		var self = this;
		return tf.startup.loadArcgisUrls().then(function()
		{
			var geocodeUrl = arcgisUrls.StreetGeocodeServiceFile;
			const mapServiceType = self._viewModel.directionPaletteViewModel.obMapServiceType();

			if (mapServiceType === 2)
			{
				// TODO: update tomtomna GeocodeServer
				geocodeUrl = "http://172.16.10.36/arcgis/rest/services/NorthAmerica/GeocodeServer";
			}
			else if (mapServiceType === 1)
			{
				geocodeUrl = "https://graphhopper.com/api/1/geocode";
			}
			else if (mapServiceType === 0)
			{
				self._arcgis.esriConfig.apiKey = "AAPK831e30fbca2e488eb45497c69f753bc6ufPNUlFdFwgUJODDnT0wC1wWks-xJN2dLidH1m9x3bB-Mov6i1RbGoVAVwLgjn8P";
				geocodeUrl =  "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";
			}

			if (mapServiceType === 1)
			{
				const point = `${mapPoint.latitude},${mapPoint.longitude}`;
				const url = `${geocodeUrl}?key=aaa190b8-70ca-468b-8aa6-0fa2897e1651&reverse=true&point=${point}`;
				const settings = {
					method: "get",
					mode: "cors"
				};
				return fetch(url, settings).then(function(res)
				{
					return res.json();
				}).then(function(res)
				{
					if (!res || !res.hits || !res.hits.length)
					{
						return false;
					}

					const hit = res.hits.find(h => h.housenumber !== undefined) || res.hits[0];
					let address = `${hit.city}, ${hit.state}, ${hit.postcode}`;
					if (hit.street)
					{
						address = `${hit.street}, ${address}`;
						if (hit.housenumber !== undefined)
						{
							address = `${hit.housenumber} ${address}`;
						}
					}

					return {
						Match_addr: address
					};
				}).catch(function()
				{
					return false;
				});
			}
			else
			{
				self._searchTool.sources.items[0].locator.url = geocodeUrl;
				return TF.locationToAddress(mapPoint, null, geocodeUrl);
			}
		});
	};
})();
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

			if (self._viewModel.directionPaletteViewModel.obMapServiceType() == 2)
			{
				// TODO: update tomtomna GeocodeServer
				// geocodeUrl = "http://tomtomna.transfinder.com/arcgis/rest/services/NorthAmerica/";
			}
			else if (self._viewModel.directionPaletteViewModel.obMapServiceType() == 0)
			{
				self._arcgis.esriConfig.apiKey = "AAPK831e30fbca2e488eb45497c69f753bc6ufPNUlFdFwgUJODDnT0wC1wWks-xJN2dLidH1m9x3bB-Mov6i1RbGoVAVwLgjn8P";
				geocodeUrl =  "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";
			}

			self._searchTool.sources.items[0].locator.url = geocodeUrl;

			return TF.locationToAddress(mapPoint, null, geocodeUrl);
		});
	};
})();
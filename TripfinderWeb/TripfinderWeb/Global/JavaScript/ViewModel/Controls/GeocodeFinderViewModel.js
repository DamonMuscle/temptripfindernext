(function()
{
	createNamespace("TF.Control").GeocodeFinderViewModel = GeocodeFinderViewModel;

	const GeocodeInteractiveLayerId = "geocodeInteractiveLayer";
	function GeocodeFinderViewModel(zipCodes, modalViewModel)
	{
		var self = this;
		self.modalViewModel = modalViewModel;
		self.zipCodes = zipCodes;
		self.obGeoStreet = ko.observable();
		self.obGeoZip = ko.observable();
		self.obGeoCity = ko.observable();
		self.addressCandidates = ko.observableArray([]);
		self.obSelectedAddress = ko.observable(null);
		self.obSelectedAddress.subscribe(function() { self.applyAddress(); });
		self.reFindAddress = self.reFindAddress.bind(this);
		self.geoSearch = new TF.RoutingMap.RoutingPalette.GeoSearch(tf.map.ArcGIS, null, false, "102100");
		self.result = null;
		self.btnSearchClick = self.btnSearchClick.bind(this);
		self.options = { detailView: null };
		self.type = "geocodeInteractive";
		self.onMapLoad = new TF.Events.Event();
		self.routeState = "";
		// this.mapLayersPaletteViewModel = new TF.RoutingMap.MapLayersPaletteViewModel(self, false, self.routeState);
	}

	GeocodeFinderViewModel.prototype.init = function(evt, elem)
	{
		var self = this;
		self.initMap($(elem).find(".map")).then(function(){
			self.initLayers();
		});
	};

	GeocodeFinderViewModel.prototype.initMap = async function(mapElement)
	{
		var self = this;
		self.element = mapElement;
		var options = {
			baseMapSaveKey: "rfweb.baseMapId.geocodeFinder",
			isDetailView: false,
			isReadMode: false,
			zoomAvailable: true,
			thematicAvailable: false,
			baseMapAvailable: true,
			measurementAvailable: true,
			manuallyPinAvailable: true,
			drawBoundaryAvailable: false,
			thematicInfo: false,
			legendStatus: false,
			geoFinderAvailable: false,
			expand: {
				enable: false,
			}
		};

		var map = await TF.Helper.MapHelper.createMapInstance(mapElement);
		self.mapInstance = map;
		self._map = map.map;
		self.mapInstance.onMapViewCreatedEvent.subscribe(self._onMapLoad.bind(self));

		self.RoutingMapTool = new TF.Map.RoutingMapTool(self, $.extend({
			thematicLayerId: "",
		}, options));

		if (options.expand && options.expand.enable)
		{
			self._map.expandMapTool = new TF.Map.ExpandMapTool(self._map, options.expand.container, self.RoutingMapTool);
		}

		self.sketchTool = new TF.RoutingMap.SketchTool(self._map, self);
	}

	GeocodeFinderViewModel.prototype._onMapLoad = function()
	{
		var self = this;
		this.mapLoaded = true;
		self.initShortKeyDownEvent();
		self.onMapLoad.notify();
	};

	GeocodeFinderViewModel.prototype.initShortKeyDownEvent = function()
	{
		var self = this;
		tf.shortCutKeys.bind(["esc"], self.exitCurrentMode.bind(self, false), self.modalViewModel.shortCutKeyHashMapKeyName);
	};

	GeocodeFinderViewModel.prototype.exitCurrentMode = function()
	{
		if (this.sketchTool) this.sketchTool.stop();
		if (this.RoutingMapTool.manuallyPinTool) this.RoutingMapTool.manuallyPinTool.stopPin();
		if (this.RoutingMapTool.measurementTool) this.RoutingMapTool.measurementTool.deactivate();
	}

	GeocodeFinderViewModel.prototype.initLayers = function()
	{
		let self = this,
			drawCoordinateTimer,
			invalidateCoordinate = function()
			{
				if (drawCoordinateTimer != null)
				{
					clearTimeout(drawCoordinateTimer);
				}

				drawCoordinateTimer = setTimeout(function()
				{
					self.drawCoordinate();
					drawCoordinateTimer = null;
				});
			};

		self.mapInstance.addLayer({ id: GeocodeInteractiveLayerId, index: 0, eventHandlers:{onLayerCreated: function(){ invalidateCoordinate();}}});

		self.obSelectedAddress.subscribe(invalidateCoordinate);
	}

	GeocodeFinderViewModel.prototype.getManuallyPinLayer = function()
	{
		return this.mapInstance.getMapLayer(GeocodeInteractiveLayerId);
	};

	GeocodeFinderViewModel.prototype.drawCoordinate = function(geometry)
	{
		const self = this, layerInstance = this.mapInstance.getMapLayerInstance(GeocodeInteractiveLayerId);
		const markerSymbol = {
				type: "simple-marker",
				color: [112, 123, 249]
			},
			attributes ={ type: self.type };

		layerInstance.clearLayer();

		if (geometry && geometry.longitude && geometry.latitude) {
			layerInstance.addPoint(geometry.longitude, geometry.latitude, markerSymbol, attributes);
			return;
		}

		if (!self.obSelectedAddress()) return;

		const longitude = self.obSelectedAddress().XCoord, latitude = self.obSelectedAddress().YCoord;
		if (!longitude || !latitude) return;
		
		layerInstance.addPoint(longitude, latitude, markerSymbol, attributes);
		
		self.mapInstance.centerAt(longitude, latitude);
	}

	GeocodeFinderViewModel.prototype.findAddress = function(address, city, zip)
	{
		var self = this;
		self.addressCandidates([]);
		self.obSelectedAddress(null);
		if (!address) return Promise.resolve();
		address = address.replace(/&&/g, " & ").replace(/ and /g, " & ");
		if (address.indexOf(" & ") < 0) { address = address.replace(/&/g, " & "); }
		var searchAddress = [address, city, zip].filter(function(c) { return c; }).join(",");

		self.obGeoStreet(address);
		self.obGeoCity(city);
		self.obGeoZip(zip);

		const computeAddress = (item) =>
		{
			let items = [];
			if (item.street || item.GeoStreet)
			{
				items.push(item.street || item.GeoStreet);
			}

			if (item.city || item.GeoCity)
			{
				items.push(item.city || item.GeoCity);
			}

			if (item.GeoCounty)
			{
				items.push(item.GeoCounty);
			}

			if (item.zip || item.GeoZip)
			{
				items.push(item.zip || item.GeoZip);
			}

			return items.join(", ");
		};

		return tf.loadingIndicator.enhancedShow(TF.GIS.Analysis.getInstance().geocodeService.suggestLocationsREST(searchAddress).then(function(response)
		{
			let selectIndex = 0, exactMatchRecord = null;
			data = response.addresses;

			return Promise.all(data.map(item=>TF.GIS.Analysis.getInstance().geocodeService.findAddressCandidatesREST(item.text, item.magicKey))).then(function(locations){
				data.forEach((item, index) => {
					const matched = locations[index];
					item.GeoStreet = item.street;
					item.GeoCity = matched?.attributes?.City || item.city;
					item.GeoCounty = matched?.attributes?.Subregion || null;
					item.GeoZip = matched?.attributes?.Postal || item.zip;
					item.address = computeAddress(item);
					item.XCoord = item.Xcoord = matched?.location.x;
					item.YCoord = item.Ycoord = matched?.location.y;
					item.Score = matched?.score;
	
					var isStreetMatch = item.street && TF.RoutingMap.GeocodeHelper.isExactMatchStreet((address || "").toLowerCase(), $.trim(item.street.toLowerCase()));
					if (isStreetMatch && $.trim(zip) == $.trim(item.zip))
					{
						selectIndex = index;
						exactMatchRecord = item;
					}
				});

				data.sort((a, b) =>
				{
					if (b.Score !== a.Score)
					{
						return b.Score - a.Score; // Sort by 'score' field in descending order first.
					}
					else
					{
						return a.address.localeCompare(b.address); // If 'score' is the same, sort by 'address' field in alphabetical order.
					}
				});

				self.addressCandidates(data);
	
				if (data.length > 0)
				{
					self.obSelectedAddress(data[selectIndex]);
				}
				return {
					candidates: data,
					exactMatchRecord
				};
			});
		}));
	};

	GeocodeFinderViewModel.prototype.btnSearchClick = function()
	{
		this.reFindAddress();
	};

	GeocodeFinderViewModel.prototype.reFindAddress = function()
	{
		this.findAddress(this.obGeoStreet(), this.obGeoCity(), this.obGeoZip());
	};

	GeocodeFinderViewModel.prototype.updateAddressFromPin = function(response, stopTool)
	{
		var self = this;
		var location = tf.map.ArcGIS.webMercatorUtils.webMercatorToGeographic(response.location);
		var results = response.address.split(",").map(item => item.trim());
		var candidate = {
			GeoStreet: response.attributes?.Address || results[0] || null,
			GeoCity: response.attributes?.City || results[1] || null,
			GeoZip: response.attributes?.Postal || results[3] || null,
			GeoCounty: response.attributes?.Subregion || null,
			address: response.address,
			XCoord: location.x,
			YCoord: location.y,
			isManuallyPin: true,
			Score: 100
		}
		self.addressCandidates([]);
		setTimeout(function()
		{
			self.result = candidate;
			self.drawCoordinate(response.location)
		});
	}

	GeocodeFinderViewModel.prototype.getZipCode = function(location)
	{
		var zip = "";
		var point = new tf.map.ArcGIS.Point({
			spatialReference: tf.map.ArcGIS.SpatialReference.WGS84,
			x: location.x,
			y: location.y
		});
		var zipcodes = TF.RoutingMap.GeocodeHelper.getZipCodes();
		if (zipcodes)
		{
			for (var i = 0; i < zipcodes.length; i++)
			{
				if (tf.map.ArcGIS.geometryEngine.intersects(zipcodes[i].geometry, point))
				{
					zip = "," + zipcodes[i].attributes.Name;
					break;
				}
			}
		}
		return zip;
	};

	GeocodeFinderViewModel.prototype.applyAddress = function()
	{
		var self = this;
		self.result = self.obSelectedAddress();
	};

	GeocodeFinderViewModel.prototype.getMapInstance = function()
	{
		return this.mapInstance;
	}
})();
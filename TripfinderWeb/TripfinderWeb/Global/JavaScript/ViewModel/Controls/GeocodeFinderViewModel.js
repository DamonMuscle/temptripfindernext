(function()
{
	createNamespace("TF.Control").GeocodeFinderViewModel = GeocodeFinderViewModel;

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

		var map = await TF.GIS.MapFactory.createInstance(mapElement, {eventHandlers:{onMapViewCreated:self._onMapLoad.bind(self)}});
		self._map = map.map;
		self._mapView = map.map.mapView;

		self.RoutingMapTool = new TF.Map.RoutingMapTool(self, $.extend({
			thematicLayerId: "",
		}, options));

		if (options.expand && options.expand.enable)
		{
			self._map.expandMapTool = new TF.Map.ExpandMapTool(self._map, options.expand.container, self.RoutingMapTool);
		}

		// var baseMapId = tf.userPreferenceManager.get(options.baseMapSaveKey);
		// if (baseMapId == "white-canvas")
		// {
		// 	$(map.mapView.container).css("background-color", "white");
		// }
		// else if (baseMapId == "my-maps")
		// {
		// 	// self.onMapLoad.subscribe(() =>
		// 	// {
		// 	// 	setTimeout(() =>
		// 	// 	{
		// 	// 		self.mapLayersPaletteViewModel.show();
		// 	// 	}, 100);
		// 	// });
		// }

		// var updatingEvent = map.mapView.watch('updating', function(result)
		// {
		// 	if (!result)
		// 	{
		// 		updatingEvent.remove();
		// 		self._onMapLoad();
		// 	}
		// });
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
		var self = this,
			coordLayer = new tf.map.ArcGIS.GraphicsLayer({ id: "geocodeInteractiveLayer" }),
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


		self.layer = coordLayer;
		self._map.add(self.layer);
		self.obSelectedAddress.subscribe(invalidateCoordinate);

		self._map.mapView.whenLayerView(coordLayer).then(function()
		{
			invalidateCoordinate();
		});
	}

	GeocodeFinderViewModel.prototype.drawCoordinate = function(geometry)
	{
		var self = this;
		self.layer.removeAll();
		if (geometry && geometry.x && geometry.y) return draw(geometry);
		if (!self.obSelectedAddress()) return;
		var x = self.obSelectedAddress().Xcoord, y = self.obSelectedAddress().Ycoord;
		if (!x || !y) return;
		var p = {
			attributes: self.obSelectedAddress().attributes,
			location: $.extend(true, {}, self.obSelectedAddress().location)
		}
		var point = new tf.map.ArcGIS.Point({ x: p.location.x, y: p.location.y, spatialReference: { wkid: 102100 } });
		draw(point);

		function draw(point)
		{
			var markerSymbol = {
				type: "simple-marker",
				color: [112, 123, 249]
			},
				graphic = new tf.map.ArcGIS.Graphic({
					geometry: point,
					symbol: markerSymbol,
					attributes: { type: self.type }
				});
			self.layer.add(graphic);
			if (!geometry)
			{
				self._map.mapView.center = point;
			}
		}
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

		return tf.loadingIndicator.enhancedShow(TF.GIS.Analysis.getInstance().geocodeService.suggestLocations(searchAddress).then(function(response)
		{
			let selectIndex = 0, exactMatchRecord = null;
			data = response.addresses;
			data.forEach((item, index) => {
				item.address = `${item.street}, ${item.city}, ${item.state}, ${item.zip}`;

				var isStreetMatch = TF.RoutingMap.GeocodeHelper.isExactMatchStreet((address || "").toLowerCase(), $.trim(item.street.toLowerCase()));
				if (isStreetMatch && $.trim(zip) == $.trim(item.zip))
				{
					selectIndex = index;
					exactMatchRecord = item;
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

	GeocodeFinderViewModel.prototype.updateAddressFromPin = function(address, stopTool)
	{
		var self = this;
		var location = tf.map.ArcGIS.webMercatorUtils.webMercatorToGeographic(address.location);
		var candidate = {
			GeoStreet: address.Street,
			GeoCity: address.City,
			GeoZip: address.Postal,
			GeoCounty: address.Region,
			address: undefined,
			Xcoord: location.x,
			Ycoord: location.y,
			isManuallyPin: true
		}
		self.addressCandidates([]);
		setTimeout(function()
		{
			self.result = candidate;
			self.drawCoordinate(address.location)
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
})();
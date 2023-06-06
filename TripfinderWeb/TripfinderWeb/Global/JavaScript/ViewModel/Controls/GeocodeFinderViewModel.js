(function()
{
	createNamespace("TF.Control").GeocodeFinderViewModel = GeocodeFinderViewModel;

	function GeocodeFinderViewModel(sourceType, zipCodes, modalViewModel)
	{
		var self = this;
		self.modalViewModel = modalViewModel;
		self.sourceType = sourceType;
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
		self.obGeocodeSources = ko.observable(['Address Point', 'Street Address Range']);
		self.obSelectedGeocodeSource = ko.observable('Street Address Range');
		self.options = { detailView: null };
		self.type = "geocodeInteractive";
		self.onMapLoad = new TF.Events.Event();
		self.routeState = "";
		// this.mapLayersPaletteViewModel = new TF.RoutingMap.MapLayersPaletteViewModel(self, false, self.routeState);
	}

	GeocodeFinderViewModel.prototype.init = function(evt, elem)
	{
		var self = this;
		if (evt.sourceType != "Phone") self.obSelectedGeocodeSource(evt.sourceType);
		self.initMap($(elem).find(".map"));
		self.initLayers();
	}

	GeocodeFinderViewModel.prototype.initMap = function(mapElement)
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

		var map = TF.Helper.MapHelper.createMap(self.element, self, options);
		self._map = map;
		self._mapView = map.mapView;

		var baseMapId = tf.userPreferenceManager.get(options.baseMapSaveKey);
		if (baseMapId == "white-canvas")
		{
			$(map.mapView.container).css("background-color", "white");
		}
		else if (baseMapId == "my-maps")
		{
			// self.onMapLoad.subscribe(() =>
			// {
			// 	setTimeout(() =>
			// 	{
			// 		self.mapLayersPaletteViewModel.show();
			// 	}, 100);
			// });
		}

		var updatingEvent = map.mapView.watch('updating', function(result)
		{
			if (!result)
			{
				updatingEvent.remove();
				self._onMapLoad();
			}
		});
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

	GeocodeFinderViewModel.prototype.findAddress = function(address, city, zip, sourceTypeInteractive)
	{
		var self = this;
		self.addressCandidates([]);
		self.obSelectedAddress(null);
		if (!address) return Promise.resolve();
		var promise = null;
		address = address.replace(/&&/g, " & ").replace(/ and /g, " & ");
		if (address.indexOf(" & ") < 0) { address = address.replace(/&/g, " & "); }
		var searchAddress = [address, zip].filter(function(c) { return c; }).join(",");
		if (sourceTypeInteractive)
		{
			promise = sourceTypeInteractive == "Address Point" ? self.geoSearch.suggestAddressPoint(searchAddress) : self.geoSearch.suggest(searchAddress);
		} else
		{
			if (self.sourceType == "Address Point")
			{
				promise = self.geoSearch.suggestAddressPoint(searchAddress);
			} else
			{
				promise = self.geoSearch.suggest(searchAddress);
			}
		}


		self.obGeoStreet(address);
		self.obGeoCity(city);
		self.obGeoZip(zip);

		tf.loadingIndicator.show();
		return promise.then(function(data)
		{
			tf.loadingIndicator.tryHide();
			data = Enumerable.From(data || []).Distinct("$.address").ToArray();
			var selectIndex = 0;
			var exactMatchRecord = null;
			data.forEach(function(item, index)
			{
				item.id = index;
				if (!item.address.split(",")[3])
				{
					item.address += self.getZipCode(item.location);
				}

				var lngLat = tf.map.ArcGIS.webMercatorUtils.xyToLngLat(item.location.x, item.location.y);
				var addressSplit = item.address.split(",");
				item.GeoStreet = addressSplit[0] || "";
				item.GeoCity = addressSplit[1] || "";
				item.GeoZip = addressSplit[3] || "";
				item.Xcoord = lngLat[0];
				item.Ycoord = lngLat[1];

				var isStreetMatch = TF.RoutingMap.GeocodeHelper.isExactMatchStreet((address || "").toLowerCase(), $.trim(item.GeoStreet.toLowerCase()));
				if (isStreetMatch &&
					// ((city || "").toLowerCase() == $.trim(item.GeoCity.toLowerCase()) || !city) &&
					$.trim(zip) == $.trim(item.GeoZip))
				{
					selectIndex = index;
					exactMatchRecord = item;
				}
			});

			data.sort((a, b) =>
			{
				if (b.score !== a.score)
				{
					return b.score - a.score; // Sort by 'score' field in descending order first.
				} else
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
				exactMatchRecord: exactMatchRecord
			};
		}).catch(function()
		{
			tf.loadingIndicator.tryHide();
		});
	};

	GeocodeFinderViewModel.prototype.btnSearchClick = function()
	{
		this.reFindAddress();
	};

	GeocodeFinderViewModel.prototype.reFindAddress = function()
	{
		this.findAddress(this.obGeoStreet(), this.obGeoCity(), this.obGeoZip(), this.obSelectedGeocodeSource());
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
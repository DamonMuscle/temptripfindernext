(function()
{
	createNamespace("TF.Map").ManuallyPinTool = ManuallyPinTool;

	function ManuallyPinTool(routingMapTool)
	{
		var self = this;
		self.symbol = new TF.Map.Symbol();
		self.routingMapTool = routingMapTool;
		self.map = self.routingMapTool.routingMapDocumentViewModel._map;
		self.mapInstance = self.routingMapTool.routingMapDocumentViewModel.mapInstance;
		self.routeState = self.routingMapTool.routingMapDocumentViewModel.routeState;
		self.record = self.routingMapTool.routingMapDocumentViewModel.data;
		self.type = self.routingMapTool.routingMapDocumentViewModel.type;
		self.layer = self.routingMapTool.routingMapDocumentViewModel.layer || self.routingMapTool.routingMapDocumentViewModel.getManuallyPinLayer();
		self.detailView = self.routingMapTool.routingMapDocumentViewModel.options.detailView;
		self.stopTool = new TF.RoutingMap.RoutingPalette.StopTool(null, self.map, null);
	}

	ManuallyPinTool.prototype.startPin = function()
	{
		this.routingMapTool.$container.find(".manuallypin").addClass("on");
		this.routingMapTool.startSketch("manuallyPinTool");
		this.cursorToPin();
		this.bindClickEvent();
		this.bindEscEvent();
	};

	ManuallyPinTool.prototype.stopPin = function()
	{
		this.routingMapTool.$container.find(".manuallypin").removeClass("on");
		this.routingMapTool.stopSketch("manuallyPinTool");
		this.cursorToDefault();
		tf.documentEvent.unbind("keydown.pin", this.routeState);
		this.mapClickEvent && this.mapClickEvent.remove();
		this.mapClickEvent = null;
	};

	ManuallyPinTool.prototype.modifyRecordToNewLocation = function(geometry, result)
	{
		const self = this;
		self.reverseKey = TF.createId();

		clearTimeout(self.getGeoStreetInfoTimeout);
		self.getGeoStreetInfoTimeout = setTimeout(function(reverseKey)
		{
			if (!result || reverseKey !== self.reverseKey)
			{
				return;
			}

			if (result.errorMessage === null)
			{
				const coordName = self.record && typeof self.record.XCoord != "undefined" ? "Coord" : "coord";
				const geoGraphic = tf.map.ArcGIS.webMercatorUtils.webMercatorToGeographic(geometry);
				self.update("X" + coordName, geoGraphic.x);
				self.update("Y" + coordName, geoGraphic.y);
				self.update("GeocodeScore", 100); // use fixed value since ManuallyPin does not have Geo Confidence
				
				const gridType = self.type === "geocodeInteractive" ? "location" : self.type;
				self.updateResult(gridType, "street", result.attributes.Address);
				self.updateResult(gridType, "city", result.attributes.City);
				self.updateResult(gridType, "zip", result.attributes.Postal);
				self.updateResult(gridType, "state", result.attributes.Subregion);

				if (self.detailView)
				{
					self.detailView.obEditing(true);
				}
			}
		}(self.reverseKey), 20);
	};

	ManuallyPinTool.prototype.update = function(fieldName, value)
	{
		const self = this;
		self.detailView && self.detailView.fieldEditorHelper && self.detailView.fieldEditorHelper._onNonUDFEditorApplied({
			lockName: fieldName,
			errorMessages: null,
			fieldName: fieldName,
			recordValue: value,
			relationshipKey: undefined,
			text: undefined,
		});
	};

	ManuallyPinTool.prototype.updateResult = function(gridType, resultType, resultValue)
	{
		const self = this;
		if (resultValue !== null)
		{
			self.update(TF.Grid.GeocodeTool.getAddressFieldNameByGridType(resultType, gridType), resultValue);
		}
	}

	ManuallyPinTool.prototype.bindClickEvent = function()
	{
		var self = this;
		self.mapClickEvent && self.mapClickEvent.remove();
		self.mapClickEvent = self.map.mapView.on("click", (event) =>
		{
			if (self.detailView && self.detailView.recordEntity && self.detailView.recordEntity.Geocoded)
			{
				const dataTypeName = tf.dataTypeHelper.getFormalDataTypeName(self.type),
					dataTypeLabel = tf.applicationTerm.getApplicationTermSingularByName(dataTypeName);
				tf.promiseBootbox.yesNo({
					message: `Are you sure you want to repin this ${dataTypeLabel}?`,
					title: "Confirmation Message"
				}).then((res) =>
				{
					if (!res)
					{
						return;
					}

					self.proceedPinEvent(event);
				});
			}
			else
			{
				self.proceedPinEvent(event);
			}
		});
	};

	ManuallyPinTool.prototype.proceedPinEvent = function(event)
	{
		var self = this;
		const geometry = event.mapPoint;
		const geocodeService = TF.GIS.Analysis.getInstance().geocodeService;
		geocodeService.locationToAddress({x: geometry.longitude, y: geometry.latitude}).then(function(result)
		{
			const countryCode = result.attributes && result.attributes.CountryCode || '';
			if (!geocodeService.isAvailableCountry(countryCode))
			{
				tf.promiseBootbox.alert({
					message: "Please pin a location in USA or Canada.",
					title: "Alert"
				});
				return;
			}

			self.modifyGraphicOnMap(geometry);
			self.modifyGeocodeInteractiveResult(geometry, result);
			self.modifyRecordToNewLocation(geometry, result);
			self.modifyGeoregionBoundaryGraphic(geometry);
		});
	};

	ManuallyPinTool.prototype.bindEscEvent = function()
	{
		var self = this;
		tf.documentEvent.bind("keydown.pin", self.routeState, function(e)
		{
			if (e.key === "Escape")
			{
				self.stopPin();
			}
		});
	};

	ManuallyPinTool.prototype.modifyGraphicOnMap = function(geometry)
	{
		var self = this;
		self.graphic = self.findGraphic();
		if (self.graphic)
		{
			self.graphic.geometry = geometry;
		} else
		{
			self.addGraphic(geometry);
		}
	};

	ManuallyPinTool.prototype.findGraphic = function()
	{
		var self = this;
		if (this.type === "school")
		{
			self.layer = self.map.findLayerById("schoolLayer");
		}
		if (this.type === "georegion")
		{
			self.layer = self.map.findLayerById("georegionPointLayer");
		}
		if (this.type === "fieldtriplocation")
		{
			self.layer = self.map.findLayerById("ManuallyPinLayer");
		}
		if (this.type === "geocodeInteractive")
		{
			self.layer = self.mapInstance.getMapLayer("geocodeInteractiveLayer");
			self.layerInstance = self.mapInstance.getMapLayerInstance("geocodeInteractiveLayer");
		}

		const graphics = self.layer.graphics.items;
		if (graphics.length === 0)
		{
			return null;
		}

		return Enumerable.From(graphics).FirstOrDefault(null, function(c)
		{
			return c.attributes?.type === self.type;
		});
	};

	ManuallyPinTool.prototype.addGraphic = function(geometry)
	{
		const symbol = this.getSymbol();
		const attributes = {
			id: this.record ? this.record.Id : TF.createId(),
			type: this.type
		};
		let graphic = null;
		if (this.type === "geocodeInteractive")
		{
			const { longitude, latitude } = geometry;
			graphic = this.layerInstance.createPointGraphic(longitude, latitude, symbol, attributes);
			this.layerInstance.add(graphic);
		}
		else
		{
			graphic = new tf.map.ArcGIS.Graphic({
				geometry: geometry,
				symbol: symbol,
				attributes: attributes
			});
			this.layer.add(graphic);
		}

		this.graphic = graphic;
	};

	ManuallyPinTool.prototype.getSymbol = function()
	{
		switch (this.type)
		{
			case "georegion":
				return this.symbol.georegionPoint();
			case "school":
				return this.symbol.school("#FF00FF");
			case "student":
				return this.symbol.student();
			case "altsite":
				return this.symbol.student();
			case "fieldtriplocation":
				return this.symbol.fieldTripLocation();
			default:
				return this.symbol.student();
		}
	};

	ManuallyPinTool.prototype.cursorToPin = function()
	{
		TF.Helper.MapHelper.setMapCursor(this.map, "pin");
		this.map.mapView.pining = true;
	};

	ManuallyPinTool.prototype.cursorToDefault = function()
	{
		TF.Helper.MapHelper.setMapCursor(this.map, "default");
		this.map.mapView.pining = false;
	};

	ManuallyPinTool.prototype.modifyGeocodeInteractiveResult = function(geometry, result)
	{
		var self = this;
		if (self.type === "geocodeInteractive")
		{
			result ||= {};//RW-37473
			result.location = geometry;
			self.routingMapTool.routingMapDocumentViewModel.updateAddressFromPin(result, self.stopTool);
		}
	};

	ManuallyPinTool.prototype.modifyGeoregionBoundaryGraphic = function(point)
	{
		var self = this;
		if (self.type === "georegion")
		{
			var georegionTypeId = self.detailView.getGeoRegionTypeId();

			tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "georegiontypes?Id=" + georegionTypeId)).then(function(response)
			{
				var georegionType = response.Items[0];
				if (georegionType && georegionType.Boundary === "User Defined")
				{
					var georegionBoundaryGraphic = self.map.findLayerById("georegionPolygonLayer").graphics.items[0];
					if (georegionBoundaryGraphic && georegionBoundaryGraphic.geometry)
					{
						georegionBoundaryGraphic.geometry = self._createFinger(point, georegionBoundaryGraphic.geometry);
						self.detailView.obEditing(true);
						self.detailView && self.detailView.fieldEditorHelper && self.detailView.fieldEditorHelper._onNonUDFEditorApplied(
							{
								lockName: "Shape",
								errorMessages: null,
								fieldName: "Shape",
								recordValue: georegionBoundaryGraphic.geometry,
								relationshipKey: undefined,
								text: undefined,
								type: "Shape"
							}
						);
					}
				}
			});
		}
	};

	ManuallyPinTool.prototype._createFinger = function(point, polygon)
	{
		var self = this;
		var nearestPoint = tf.map.ArcGIS.geometryEngine.nearestCoordinate(polygon, point).coordinate,
			line = new tf.map.ArcGIS.Polyline({ spatialReference: self.map.mapView.spatialReference, paths: [[[point.x, point.y], [nearestPoint.x, nearestPoint.y]]] }),
			distance = TF.Helper.MapHelper.convertPxToDistance(self.map, tf.map.ArcGIS, 5),
			buffer = tf.map.ArcGIS.geometryEngine.buffer(line, distance, "meters");

		return tf.map.ArcGIS.geometryEngine.union([tf.map.ArcGIS.geometryEngine.simplify(buffer), tf.map.ArcGIS.geometryEngine.simplify(polygon)]);
	};

	ManuallyPinTool.prototype.dispose = function()
	{
		this.stopPin();
		this.routingMapTool = null;
		this.map = null;
		this.routeState = null;
		this.record = null;
		this.type = null;
		this.layer = null;
		this.detailView = null;
	};
})();

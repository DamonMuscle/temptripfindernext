(function()
{
	createNamespace("TF.Map").ManuallyPinTool = ManuallyPinTool;

	function ManuallyPinTool(routingMapTool)
	{
		var self = this;
		self.symbol = new TF.Map.Symbol();
		self.routingMapTool = routingMapTool;
		self.map = self.routingMapTool.routingMapDocumentViewModel._map;
		self.routeState = self.routingMapTool.routingMapDocumentViewModel.routeState;
		self.record = self.routingMapTool.routingMapDocumentViewModel.data;
		self.type = self.routingMapTool.routingMapDocumentViewModel.type;
		self.layer = self.routingMapTool.routingMapDocumentViewModel.layer;
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

	ManuallyPinTool.prototype.modifyRecordToNewLocation = function(geometry)
	{
		var self = this;
		this.reverseKey = TF.createId();
		var geoGraphic = tf.map.ArcGIS.webMercatorUtils.webMercatorToGeographic(geometry);
		var coordName = self.record && typeof self.record.XCoord != "undefined" ? "Coord" : "coord";
		self.update("X" + coordName, geoGraphic.x);
		self.update("Y" + coordName, geoGraphic.y);
		self.update("GeoConfidence", TF.Grid.GeocodeTool.getGeoConfidence("ManuallyPin"));
		if (this.detailView)
		{
			this.detailView.obEditing(true);
		}

		clearTimeout(this.getGeoStreetInfoTimeout);
		this.getGeoStreetInfoTimeout = setTimeout(function(reverseKey)
		{
			TF.GIS.Analysis.getInstance().geocodeService.locationToAddress({x: geometry.longitude, y: geometry.latitude}).then(function(result)
			{
				if (!result || reverseKey !== self.reverseKey)
				{
					return;
				}
				
				var gridType = self.type === "geocodeInteractive" ? "location" : self.type;
				if (result.errorMessage === null)
				{
					const address = result.address.split(",");
					self.updateResult(gridType, "street", address[0]);
					self.updateResult(gridType, "city", address[1]);
					self.updateResult(gridType, "zip", address[3]);
					self.updateResult(gridType, "state", address[2]);
				}
			});
		}(this.reverseKey), 20);
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
		if (resultValue)
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
				const dataTypeName = tf.dataTypeHelper.getFormalDataTypeName(self.type);
				tf.promiseBootbox.yesNo({
					message: `Are you sure you want to repin this ${dataTypeName}?`,
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
		self.modifyGraphicOnMap(event.mapPoint);
		self.modifyGeocodeInteractiveResult(event.mapPoint);
		self.modifyRecordToNewLocation(event.mapPoint);
		self.modifyGeoregionBoundaryGraphic(event.mapPoint);
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
		return Enumerable.From(self.layer.graphics.items).FirstOrDefault(null, function(c)
		{
			return c.attributes.type === self.type;
		});
	};

	ManuallyPinTool.prototype.addGraphic = function(geometry)
	{
		var graphic = new tf.map.ArcGIS.Graphic({
			geometry: geometry,
			symbol: this.getSymbol(),
			attributes: {
				id: this.record ? this.record.Id : TF.createId(),
				type: this.type
			}
		});
		this.layer.add(graphic);
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

	ManuallyPinTool.prototype.modifyGeocodeInteractiveResult = function(geometry)
	{
		var self = this;
		if (self.type === "geocodeInteractive")
		{
			TF.locationToAddress(geometry).then(function(result)
			{
				result.location = geometry;
				self.routingMapTool.routingMapDocumentViewModel.updateAddressFromPin(result, self.stopTool);
			})

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

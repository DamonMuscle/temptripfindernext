(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingTripMapTool = RoutingTripMapTool;
	function RoutingTripMapTool(fieldTripPaletteSectionVM)
	{
		var self = this;
		self._map = fieldTripPaletteSectionVM._viewModal._map;
		self.dataModel = fieldTripPaletteSectionVM.dataModel;
		self._arcgis = tf.map.ArcGIS;
		self.editModal = fieldTripPaletteSectionVM.editFieldTripStopModal;
		self._viewModal = fieldTripPaletteSectionVM._viewModal;
		self.viewModel = fieldTripPaletteSectionVM;
		TF.RoutingMap.EsriTool.call(self, self._map, self._arcgis, fieldTripPaletteSectionVM.viewModel);

		self.initialize();

		self.stopTool = new TF.RoutingMap.RoutingPalette.StopTool(self);
		self.stopPreviewTool = new TF.RoutingMap.RoutingPalette.StopPreviewTool(self, self._map);

		self.initializeSettings();

		// self.dataModel.onTrialStopWalkoutPreviewChange.subscribe(self.stopPreviewTool.onTrialStopWalkoutPreviewChange.bind(self.stopPreviewTool));
		// self.dataModel.onSettingChangeEvent.subscribe(self.onSettingChangeEvent.bind(this));
		self.schoolSymbol = self.symbol.school("#cf39dc", 1, 16);
	}

	RoutingTripMapTool.prototype = Object.create(TF.RoutingMap.EsriTool.prototype);
	RoutingTripMapTool.prototype.constructor = RoutingTripMapTool;

	RoutingTripMapTool.prototype.initialize = function()
	{
		// the order is important ,so does not use base initialization . The order is  stop,student ,path, boundary
		var self = this;
		var layerIds = { pointLayerId: "routingTripStopLayer", polylineLayerId: "routingFeatureLayer", polygonLayerId: "routingTripStopBoundaryLayer" };

		self._crossStreetLayer = new self._arcgis.GraphicsLayer({
			"id": "routingCrossStreetLayer"
		});
		self._map.add(self._crossStreetLayer);
		self.viewModel.layers.push(self._crossStreetLayer.id);

		self._previewLayer = new self._arcgis.GraphicsLayer({
			"id": "tripStopPreviewLayer"
		});
		self._map.add(self._previewLayer);
		self.viewModel.layers.push(self._previewLayer.id);

		self._tempWalkoutRedrawLayer = new self._arcgis.GraphicsLayer({
			"id": "tempWalkoutRedrawLayer"
		});
		self._map.add(self._tempWalkoutRedrawLayer);
		self.viewModel.layers.push(self._tempWalkoutRedrawLayer.id);

		self._polygonLayer = new self._arcgis.GraphicsLayer({ "id": layerIds.polygonLayerId });
		self._map.add(self._polygonLayer);
		self.viewModel.layers.push(layerIds.polygonLayerId);

		// student stop assignment layer
		self._studentStopAssignmentLayer = new self._arcgis.GraphicsLayer({ id: "studentStopAssignmentLayer" });
		self._map.add(self._studentStopAssignmentLayer);
		self.viewModel.layers.push(self._studentStopAssignmentLayer.id);

		self._arrowLayer = new self._arcgis.GraphicsLayer({
			id: "routingArrowLayer",
			minScale: 36111.909643,
		});
		self._map.add(self._arrowLayer, 1);
		self._map.mapView.watch("rotation", function()
		{
			clearTimeout(self._rotationEvent);
			self._rotationEvent = setTimeout(function()
			{
				self.refreshTripArrow();
			}, 500);
		});
		self.viewModel.layers.push(self._arrowLayer.id);

		self._polylineLayer = new self._arcgis.GraphicsLayer({ "id": layerIds.polylineLayerId });
		self._map.add(self._polylineLayer);
		self.viewModel.layers.push(layerIds.polylineLayerId);

		self._studentLayer = new self._arcgis.GraphicsLayer({
			"id": "routingTripStudentLayer"
		});
		self._map.add(self._studentLayer);
		self.viewModel.layers.push(self._studentLayer.id);

		self._pointLayer = new self._arcgis.GraphicsLayer({ "id": layerIds.pointLayerId });
		self._map.add(self._pointLayer);
		self.viewModel.layers.push(layerIds.pointLayerId);

		self._studentCountLayer = new self._arcgis.GraphicsLayer({
			"id": "studentCountLayer"
		});
		self._map.add(self._studentCountLayer);
		self.viewModel.layers.push(self._studentCountLayer.id);

		self._schoolLocationLayer = new self._arcgis.GraphicsLayer({
			"id": "tripSchoolLocationLayer"
		});
		self._map.add(self._schoolLocationLayer);
		self.viewModel.layers.push(self._schoolLocationLayer.id);

		self._tempWalkoutLayer = new self._arcgis.GraphicsLayer({
			"id": "tripStopTempWalkoutLayer"
		});
		self._map.add(self._tempWalkoutLayer);
		self.viewModel.layers.push(self._tempWalkoutLayer.id);

		self._walkoutGuideLayer = new self._arcgis.GraphicsLayer({
			"id": "routingWalkoutGuideLayer"
		});
		self._map.add(self._walkoutGuideLayer);
		self.viewModel.layers.push(self._walkoutGuideLayer.id);

		self._pointArrowLayer = new self._arcgis.GraphicsLayer({
			"id": "tripPointArrowLayer"
		});
		self._map.add(self._pointArrowLayer);
		self.viewModel.layers.push(self._pointArrowLayer.id);
	};

	RoutingTripMapTool.prototype.initializeSettings = function()
	{
		var self = this;
		var setting = self.dataModel.getSetting(null, true);
		self._moveDuplicateNode = setting.moveDuplicateNodes;
		self._allowOverlap = !setting.removeOverlapping;
		self._smartSequence = setting.smartSequence;
		self._fillPattern = self.stopTool._getFillPatternValueBySetting(setting.fillPattern);
		self._uTurnPolicy = self.stopTool._getUturnPolicy(setting.uTurnPolicy);
		self._impedanceAttribute = setting.impedanceAttribute;
		self._pathThickness = setting.pathThickness;
		self._boundaryThickness = setting.boundaryThickness;
		self._boundaryLineStyle = setting.boundaryLineStyle;
		self._showAssignedStudents = setting.showAssignedStudents;
		self._showAssignedStudentsCount = setting.showAssignedStudentsCount;
		self._studentCountLabelColor = setting.studentCountLabelColor;
		self._arrowPosition = setting.arrowPosition;
		self._avgSpeed = setting.avgSpeed;
		self._speedType = setting.speedType;
		self._studentLayer.visible = !!self._showAssignedStudents;
		self._studentCountLayer.visible = !!self._showAssignedStudentsCount;
		self._showStopBoundary = !!setting.showStopBoundary;
	};

	RoutingTripMapTool.prototype.getDataModel = function()
	{
		return this.dataModel;
	};

	RoutingTripMapTool.prototype.getPaletteName = function()
	{
		return "Routing";
	};

	RoutingTripMapTool.prototype.startPreview = function(geometryType)
	{
		var self = this;
		if (geometryType == "point")
		{
			self.stopPreviewTool._startWalkoutPreview(self.editModal.walkoutDistance(), self.editModal.obSelectedDistanceUnit(), self.editModal.walkoutBuffer(), self.editModal.obSelectedBufferUnit(),
				self.editModal.walkoutType());
		}
	};

	RoutingTripMapTool.prototype.removeOverlapBoundaryWithEditTrips = function(graphic, centroid)
	{
		const self = this;
		if (self._allowOverlap) return graphic;

		const intersectGeometry = self._intersectWithCurrentEditTripBoundaries(graphic);
		if (intersectGeometry)
		{
			if (!centroid) centroid = self._newTripStopGraphic;
			let cutResult = self._arcgis.geometryEngine.difference(graphic.geometry, intersectGeometry);
			if (centroid && cutResult)
			{
				cutResult = self._cutResultHandler(cutResult, centroid.geometry);
			}
			if (cutResult)
			{
				graphic.geometry = cutResult;
			}
		}
		return graphic;
	};

	RoutingTripMapTool.prototype.addPointToLayer = function(graphic, options)
	{
		var self = this;
		self.isTripStopInTravelRegions([graphic]).then(inside =>
		{
			if (inside)
			{
				if (self.dataModel.viewModel.drawTool)
				{
					self.dataModel.viewModel.drawTool._previewLayer.removeAll();
					self.dataModel.viewModel.drawTool._clearTempDrawing();
				}
				self.dataModel.viewModel.drawTool.stopTool.clearCandidateGraphics();
				if (self.viewModel._viewModal.mode === 'Routing-Create')
				{
					self.dataModel.viewModel.drawTool.create("point");
				}
			} else
			{
				if (!self.removeOverlapCheckWithEditTrips(graphic)) 
				{
					self.overlapDialog().then(function() 
					{
						self._clearTempDrawing();
						if (self.viewModel._viewModal.mode === 'Routing-Create')
						{
							self.dataModel.viewModel.drawTool.create("point");
						}
					});
				}
				else
				{
					var promise = Promise.resolve(true);
					if (self._boundaryThickness == 0 && self._fillPattern == 0) { promise = tf.promiseBootbox.alert("stop is not visible"); }
					promise.then(function()
					{
						var lastType = self.editModal.getLastStopBoundaryType();
						if (self.editModal.showWalkout() && self.editModal.isShowWalkoutGuideType(lastType))
						{
							var travelScenarioId = self.dataModel.fieldTrips ? self.dataModel.fieldTrips[0].TravelScenarioId : 1;
							var travelScenario = self._viewModal.travelScenariosPaletteViewModel.travelScenariosViewModel.dataModel.getTravelScenariosById(travelScenarioId);
							const data = self.editModal.getWalkoutData();
							self.stopPreviewTool.addPreview(graphic, data.walkoutDistance, data.distanceUnit, data.walkoutBuffer, data.bufferUnit,
								self.editModal.walkoutType(), false, travelScenario);
						}
						options = options || {};
						self.onAddTripStopGraphic(graphic, { tryUseLastSettings: !!options.ctrlKey });
						return Promise.resolve(true);
					});
				}
			}
		});
	};

	RoutingTripMapTool.prototype.isTripStopInTravelRegions = function(tripStopGraphics)
	{
		var self = this;
		var queryPromise = tf.startup.loadArcgisUrls().then(function()
		{
			var travelScenarioId = self.dataModel.fieldTrips ? self.dataModel.fieldTrips[0].TravelScenarioId : 1;
			return TF.queryTravelSCenarios(travelScenarioId);
		});
		return queryPromise.then(function(res)
		{
			var isInside = false;
			if (res && res[1])
			{
				var list = res[1].filter(x => x.attributes.Type == 2);
				if (!list)
				{
					return isInside;
				}
				list.some(function(graphic)
				{
					tripStopGraphics.some(function(tripStopGraphic)
					{
						var result = tf.map.ArcGIS.geometryEngine.intersects(tripStopGraphic.geometry, graphic.geometry);
						if (result)
						{
							isInside = true;
							return isInside;
						}
					});
					if (isInside)
					{
						return isInside;
					}
				});
			}
			if (isInside)
			{
				return tf.promiseBootbox.alert("Unable to place stop due to it inside the prohibited travel region.", 'Warning').then(function()
				{
					return Promise.resolve(isInside);
				});
			}

			return Promise.resolve(isInside);
		});
	};

	RoutingTripMapTool.prototype.onAddTripStopGraphic = function(graphic, options)
	{
		var self = this;
		graphic.symbol = self.symbol.tripStop("0", "#FFFFFF");
		graphic.attributes = { "id": TF.createId() };
		self.getSnappedTripStop(graphic).then(function()
		{
			self.getTripStopStreetAddress(graphic).then(function()
			{
				self.addStopAddressAndBoundary(graphic, $.extend({}, options, { streetName: graphic.attributes.street }));
			});
		});
	};

	RoutingTripMapTool.prototype.addStopAddressAndBoundary = function(graphic, options)
	{
		this.stopTool.addStopAddressAndBoundary(graphic, options);
		this._newTripStopGraphic = graphic;
		if (options.addStopGraphic != false)
		{
			this._pointLayer.graphics.push(graphic);
			this._newTripStopGraphic = this._pointLayer.graphics.items[this._pointLayer.graphics.items.length - 1];
		}
	};

	RoutingTripMapTool.prototype.drawTempTripStopsOnMap = function(geometries)
	{
		var self = this;
		geometries.forEach(function(geometry)
		{
			var graphic = new tf.map.ArcGIS.Graphic({
				symbol: self.symbol.tripStop("0", "#FFFFFF"),
				geometry: geometry,
				attributes: { "id": TF.createId() }
			});
			self.sketchTool.drawTempPoint(graphic);
		});
	};

	RoutingTripMapTool.prototype.getTripStopStreetAddress = function(tripStop)
	{
		var self = this,
			streetName = "unnamed",
			promise = Promise.resolve(false);

		if (tripStop.attributes.junctionStreets && tripStop.attributes.junctionStreets.length > 0)
		{
			promise = Promise.resolve(self.stopTool.getStreetAddressByJunctionStreets(tripStop.attributes.junctionStreets));
		} else
		{
			promise = Promise.resolve(self.stopTool.getStopStreetAddress(tripStop.geometry));
		}
		return promise.then(function(street)
		{
			if (street) streetName = street;
			tripStop.attributes.street = streetName;
			return Promise.resolve(tripStop);
		});
	};

	RoutingTripMapTool.prototype.selectCallback = function(graphics)
	{
		var self = this, selectIds = [];
		graphics.forEach(function(graphic)
		{
			if (graphic.attributes.type == "tripStop")
			{
				var trip = self.dataModel.getFieldTripById(graphic.attributes.dataModel.FieldTripId);
				if (!graphic.attributes.dataModel.SchoolCode
					&& graphic.attributes.dataModel.OpenType === 'Edit' && ((trip && trip.visible) || (!trip)))
				{
					selectIds.push(graphic.attributes.dataModel.id);
				}
			}
		});
		self.selectionChange.notify(selectIds);
		self._viewModal.setMode("", "Normal");
	};

	RoutingTripMapTool.prototype.redrawPath = function(trip)
	{
		console.log("WARNING: REPLACE WITH NEW MAP OPERATIONS FUNCTIONS!");
		return;
	};

	RoutingTripMapTool.prototype.deleteTrip = function(trip)
	{
		var self = this;
		self._deleteTripById(trip.id);
	};

	RoutingTripMapTool.prototype._deleteTripById = function(tripId)
	{
		var self = this;
		self._getTripRelateGraphics(tripId).forEach(function(graphic)
		{
			if (graphic && graphic.layer)
			{
				graphic.layer.remove(graphic);
			}
		});
	};

	RoutingTripMapTool.prototype.updateTripId = function(oldTripId, newTripId)
	{
		this._getTripRelateGraphics(oldTripId).forEach(function(graphic)
		{
			graphic.attributes.FieldTripId = newTripId;
		});
	};

	RoutingTripMapTool.prototype._getTripRelateGraphics = function(tripId)
	{
		var self = this;

		function getGraphicsByFilter(layer)
		{
			return layer.graphics.items.filter(function(graphic)
			{
				return graphic.attributes && graphic.attributes.FieldTripId == tripId;
			});
		}

		return getGraphicsByFilter(self._pointLayer)
			.concat(getGraphicsByFilter(self._polygonLayer))
			.concat(getGraphicsByFilter(self._polylineLayer))
			.concat(getGraphicsByFilter(self._arrowLayer))
			.concat(getGraphicsByFilter(self._crossStreetLayer))
			.concat(getGraphicsByFilter(self._studentCountLayer))
			.concat(getGraphicsByFilter(self._pointArrowLayer))
			.concat(getGraphicsByFilter(self._studentStopAssignmentLayer));
	};

	RoutingTripMapTool.prototype._addTripStop = function(tripStop, tripId)
	{
		if (!tripStop.geometry)
		{
			return;
		}
		var self = this,
			stopGraphic,
			trip = self.dataModel.getFieldTripById(tripId),
			geometry = tripStop.geometry,
			stopColor = self.dataModel.getColorByTripId(tripId),
			stopSymbol = self.symbol.tripStopSimpleMarker(stopColor, 23),
			labelSymbol = self.symbol.tripStopLabel(stopColor);
		if (tripStop.SchoolCode && tripStop.SchoolCode.length > 0)
		{
			stopSymbol = self.schoolSymbol;
			stopGraphic = new self._arcgis.Graphic({
				geometry: geometry,
				symbol: stopSymbol,
				attributes: {
					"dataModel": tripStop,
					FieldTripId: tripId,
					type: "tripStop"
				}
			});
			if (trip.visible == false)
			{
				stopGraphic.visible = false;
			}
			if (tripStop.SchoolLocation)
			{
				stopGraphic.symbol = self.symbol.schoolLocation();
				stopGraphic.geometry = tripStop.SchoolLocation.geometry;
			}
			self._pointLayer.add(stopGraphic);
		}
		else
		{
			labelSymbol.text = tripStop.Sequence.toString();
			var stopLabel = new self._arcgis.Graphic({
				geometry: geometry,
				symbol: labelSymbol,
				attributes: {
					dataModel: tripStop,
					FieldTripId: tripId,
					type: "tripStopLabel"
				}
			});
			stopGraphic = new self._arcgis.Graphic({
				geometry: geometry,
				symbol: stopSymbol,
				attributes: {
					"dataModel": tripStop,
					FieldTripId: tripId,
					label: stopLabel,
					type: "tripStop"
				}
			});
			if (trip.visible == false)
			{
				stopGraphic.visible = false;
				stopLabel.visible = false;
			}
			self._pointLayer.add(stopGraphic);
			self._pointLayer.add(stopLabel);
		}

		if (tripStop.City == null || tripStop.City == "")
		{
			tripStop.City = TF.RoutingMap.GeocodeHelper.getCityName(tripStop.geometry);
		}
	};

	RoutingTripMapTool.prototype._updateTripStop = function(tripStop)
	{
		var self = this, stopSymbol, trip = self.dataModel.getFieldTripById(tripStop.FieldTripId), visible = trip.visible;
		var stopColor = self.dataModel.getColorByTripId(tripStop.FieldTripId);
		var stopGraphic = self._pointLayer.graphics.items.filter(function(graphic)
		{
			return graphic.attributes && graphic.attributes.dataModel && tripStop.id == graphic.attributes.dataModel.id;
		})[0];

		if (stopGraphic.attributes.label)
		{
			var labelSymbol = self.symbol.tripStopLabel(stopColor);
			labelSymbol.text = tripStop.Sequence;
			stopGraphic.attributes.label.symbol = labelSymbol;
			stopGraphic.attributes.label.attributes.FieldTripId = tripStop.FieldTripId;
			stopGraphic.attributes.label.attributes.dataModel = tripStop;
			stopGraphic.attributes.label.geometry = tripStop.geometry;
			// self._pointLayer.remove(stopGraphic.attributes.label);
		}
		stopGraphic.attributes = {
			"dataModel": tripStop,
			FieldTripId: tripStop.FieldTripId,
			type: "tripStop",
			label: stopGraphic.attributes.label
		};
		stopGraphic.geometry = tripStop.geometry;

		if (tripStop.SchoolCode && tripStop.SchoolCode.length > 0)
		{
			if (tripStop.SchoolLocation)
			{
				stopSymbol = self.symbol.schoolLocation();
				stopGraphic.geometry = tripStop.SchoolLocation.geometry;
			} else
			{
				stopSymbol = self.schoolSymbol;
			}
		} else
		{
			stopSymbol = self.symbol.tripStopSimpleMarker(stopColor, 23);// self.symbol.tripStop(tripStop.Sequence, self.dataModel.getColorByTripId(tripStop.FieldTripId));
		}

		if (visible == false)
		{
			stopGraphic.visible = false;
		}
		stopGraphic.symbol = stopSymbol;
	};

	RoutingTripMapTool.prototype._deleteTripStop = function(tripStop)
	{
		var self = this;
		var stop = self._findGraphicInLayerById(self._pointLayer, tripStop.id);
		if (stop)
		{
			self._pointLayer.remove(stop);
			if (stop.attributes.label)
			{
				self._pointLayer.remove(stop.attributes.label);
				delete stop.attributes.label;
			}
		}

		var graphics = $.extend([], self._crossStreetLayer.graphics.items);
		graphics.forEach(function(graphic)
		{
			if (graphic.attributes.tripStop.id == tripStop.id)
			{
				self._crossStreetLayer.remove(graphic);
			}
		});

	};

	RoutingTripMapTool.prototype.createStopBoundaryGraphic = function(dataModel, geometry, tripId)
	{
		var symbol = this._getTripBoundarySymbol(tripId);
		return new this._arcgis.Graphic({
			geometry: geometry,
			symbol: symbol,
			attributes: {
				"dataModel": dataModel,
				FieldTripId: tripId,
				type: "boundary"
			}
		});
	};

	RoutingTripMapTool.prototype._getTripBoundarySymbol = function(tripId)
	{
		var self = this;
		var color = self._getColorArray(tripId);
		var outlineSymbol = {
			type: "simple-line",
			style: self._boundaryLineStyle,
			color: self._computeColor(color, 1),
			width: self._boundaryThickness
		};
		if (self._boundaryThickness == 0)
		{
			outlineSymbol = {
				type: "simple-line",
				style: "none",
				color: [0, 0, 0],
				width: 1
			};
		}

		var symbol = {
			type: "simple-fill",
			style: "solid",
			outline: outlineSymbol,
			color: self._computeColor(color, self._fillPattern)
		};
		return symbol;
	};

	RoutingTripMapTool.prototype._getTripPathSymbol = function(tripId)
	{
		var self = this;
		var color = self._getColorArray(tripId);
		var symbol = {
			type: "simple-line",
			style: "solid",
			color: color,
			width: self._pathThickness
		};
		return symbol;
	};

	RoutingTripMapTool.prototype._getColorArray = function(tripId)
	{
		var self = this;
		var color = new tf.map.ArcGIS.Color(self.dataModel.getColorByTripId(tripId));
		return [color.r, color.g, color.b];
	};

	RoutingTripMapTool.prototype._clearTempDrawing = function()
	{
		var self = this;
		self._pointLayer.remove(self._newTripStopGraphic);
		self.sketchTool._drawingLayer.removeAll();
		self._walkoutGuideLayer.removeAll();
		self.stopTool.clearCandidateGraphics();
		self._newTripStopGraphic = null;
		self._oldBoundaryGraphic = null;
		self._oldBoundarySymbol = null;
		self.stopTool.stopBoundayType = "";
	};

	RoutingTripMapTool.prototype.stopPreview = function()
	{
		this.stopPreviewTool._stopWalkoutPreview();
	};

	RoutingTripMapTool.prototype.createPathGraphic = function(paths, trip)
	{
		var symbol = this._getTripPathSymbol(trip.id);
		var graphic = new this._arcgis.Graphic({
			geometry: {
				type: "polyline",
				paths: paths,
				spatialReference: {
					wkid: 102100
				}
			},
			symbol: symbol,
			attributes: {
				type: "tripPath",
				"dataModel": trip,
				FieldTripId: trip.id
			}
		});
		if (trip.visible == false)
		{
			graphic.visible = false;
		}
		return graphic;
	};

	RoutingTripMapTool.prototype._multiPolylinesToSinglePolyline = function(pathPolylines)
	{
		var paths = [];
		pathPolylines.forEach(function(pathPolyline)
		{
			if (pathPolyline &&
				pathPolyline.paths &&
				pathPolyline.paths.length > 0 &&
				pathPolyline.paths[0] &&
				pathPolyline.paths[0].length > 0)
			{
				paths.push(pathPolyline.paths[0]);
			}
		});
		return paths;
	};

	RoutingTripMapTool.prototype.refreshTripArrow = function(tripId)
	{
		var self = this, key = tripId || "all", minZoom = 14;
		var arrowOnLine = self._arrowPosition == 1 ? false : true;
		var isInExtent = true;
		if (TF.Helper.TripHelper.pathLineType() === "Sequence")
		{
			arrowOnLine = true;
			isInExtent = false;
		}
		if (self.dataModel.fieldTrips.length > 0 && self.dataModel.fieldTrips.filter(function(c) { return c.visible; }).length > 8)
		{
			minZoom = 16;
		}
		self._arrowLayer.minScale = TF.Helper.MapHelper.zoomToScale(self._map, minZoom);
		if (self._arrowLayer.minScale > 0 && self._arrowLayer.minScale < self._map.mapView.scale)
		{
			return;
		}
		if (!self.refreshTripArrowTimeout)
		{
			self.refreshTripArrowTimeout = {};
		}
		clearTimeout(self.refreshTripArrowTimeout[key]);
		self.refreshTripArrowTimeout[key] = setTimeout(function(tripId)
		{
			if (tripId)
			{
				var graphics = self._arrowLayer.graphics.items.slice();
				graphics.forEach(function(graphic)
				{
					if (graphic.attributes.FieldTripId == tripId)
					{
						self._arrowLayer.remove(graphic);
					}
				});
			} else
			{
				self._arrowLayer.removeAll();
			}
			var helper = TF.RoutingMap.MapEditingPalette.MyStreetsHelper;
			self._polylineLayer.graphics.forEach(function(graphic)
			{
				setTimeout(function()
				{
					var trip = self.dataModel.getFieldTripById(graphic.attributes.dataModel.id);
					if (trip && trip.visible && (!tripId || trip.id == tripId))
					{
						var color = self._getColorArray(trip.id);
						var connectedPaths = helper.multiPathsToSinglePath(self._map, graphic.geometry.paths);
						connectedPaths.forEach(function(connectedPath)
						{
							var arrowGraphics = helper.createArrows(self._map, connectedPath, true, color, arrowOnLine, isInExtent);
							arrowGraphics.forEach(function(arrowGraphic)
							{
								arrowGraphic.attributes = {
									dataModel: trip,
									FieldTripId: trip.id,
									type: "tripArrow"
								};
								arrowGraphic.visible = trip.visible;
							});
							self._arrowLayer.addMany(arrowGraphics);
						});
					}
				});
			});
		}.bind(self, tripId), 20);
	};

	RoutingTripMapTool.prototype._intersectWithCurrentPolygons = function(g)
	{
		let self = this,
			intersectGeometries = [];
		let editTripIds = self.dataModel.fieldTrips.filter(r=> r.OpenType == "Edit" && r.Id > 0).map(r=> r.Id);
		let graphics = self._polygonLayer.graphics.items.filter(r=> r.attributes.dataModel.OBJECTID == 0 || !editTripIds.indexOf(r.attributes.dataModel.FieldTripId));

		graphics.map(function(graphic)
		{
			if (g.attributes && g.attributes.dataModel)
			{
				if (g.geometry.type == "polygon")
				{
					if (graphic.attributes.dataModel.id != g.attributes.dataModel.id && self._isIntersect(graphic, g))
					{
						intersectGeometries.push(self._arcgis.geometryEngine.simplify(graphic.geometry));
					}
				} else if (g.geometry.type == "point")
				{
					if (graphic.attributes.dataModel.id != g.attributes.dataModel.boundary.id && self._isIntersect(graphic, g))
					{
						intersectGeometries.push(self._arcgis.geometryEngine.simplify(graphic.geometry));
					}
				}
			}
			else
			{
				if (self._isIntersect(graphic, g))
				{
					intersectGeometries.push(self._arcgis.geometryEngine.simplify(graphic.geometry));
				}
			}

		});
		if (intersectGeometries.length > 0) return self._arcgis.geometryEngine.union(intersectGeometries);
		return false;
	};

	RoutingTripMapTool.prototype.removeOverlapBoundaries = function(stops)
	{
		var self = this;

		var currentStops = new Set(), nonOverlapedStops = [];

		stops.forEach(function(stop)
		{
			stop.address = stop.Street;
			var trip = self.dataModel.getFieldTripById(stop.FieldTripId);
			trip.FieldTripStops.forEach(ts => currentStops.add(ts));
			if (stop.boundary.BdyType == 0 || !self._isContainedByCurrentPolygons(stop, self._polygonLayer.graphics.items.filter(x => { return x.attributes.dataModel.FieldTripId == stop.FieldTripId; })))
			{
				nonOverlapedStops.push(stop);
			}
		});
		currentStops = Array.from(currentStops);

		if (nonOverlapedStops.length == 0)
		{
			return tf.promiseBootbox.alert("Remove Overlapping Boundaries is set true! Since " + (stops.length == 1 ? "stop is" : "stops are") + " falling in current stop boundaries, no stops will be created", "Warning");
		}
		else if (nonOverlapedStops.length < stops.length)
		{
			tf.loadingIndicator.tryHide();
			return tf.promiseBootbox.alert("Remove Overlapping Boundaries is set as true! Some " + (stops.length - nonOverlapedStops.length == 1 ? "stop is" : "stops are") + " falling in current stop boundaries", "Warning").then(function()
			{
				tf.loadingIndicator.show();
				return self.stopTool.removeOverlapBoundariesByThiessen(nonOverlapedStops, currentStops).then(function(stops)
				{
					return stops;
				});
			});
		}
		else if (nonOverlapedStops.length == stops.length)
		{
			return self.stopTool.removeOverlapBoundariesByThiessen(stops, currentStops);
		}
		return Promise.resolve();
	};

	RoutingTripMapTool.prototype.getNotContainTrips = function(graphic)
	{
		var self = this;
		var trips = this.dataModel.fieldTrips;
		var notContainTrips = [];
		for (var i = 0; i < trips.length; i++)
		{
			var isContained = false;
			for (var j = 0; j < trips[i].FieldTripStops.length; j++)
			{
				var boundary = trips[i].FieldTripStops[j].boundary;
				if (boundary && boundary.geometry && contains(boundary, graphic))
				{
					isContained = true;
					break;
				}
			}

			if (!isContained)
			{
				notContainTrips.push(trips[i]);
			}
		}

		return notContainTrips;

		function contains(graphicContainer, graphic)
		{
			if (graphic.attributes && graphic.attributes.dataModel)
			{
				if (graphicContainer.attributes.dataModel.id != graphic.attributes.dataModel.id && self._isContained(graphicContainer, graphic))
				{
					return true;
				}
			}
			else
			{
				if (self._isContained(graphicContainer, graphic))
				{
					return true;
				}
			}
			return false;
		}
	};

	RoutingTripMapTool.prototype.redrawRegionDialog = function()
	{
		return this._warningDialogBox("Region needs to contain the trip stop!");
	};

	RoutingTripMapTool.prototype.removeRegionDialog = function()
	{
		return this._warningDialogBox("Region to be removed contains the trip stop!");
	};

	RoutingTripMapTool.prototype.overlapDialog = function()
	{
		return this._warningDialogBox("Remove Overlapping Boundaries is set as true,trip stop cannot be added here!");
	};

	RoutingTripMapTool.prototype.reverseGeocodeFailedDialog = function()
	{
		return this._warningDialogBox("Cannot find address here!");
	};

	RoutingTripMapTool.prototype._tripStopNotInBoundaryDialogBox = function()
	{
		return this._warningDialogBox("Please draw a new shape which includes the trip stop");
	};

	RoutingTripMapTool.prototype._stopInBoundaryCheck = function(stopGeom, boundaryGeom)
	{
		var self = this;
		if (!self._arcgis.geometryEngine.intersects(stopGeom, boundaryGeom))
		{
			return self._tripStopNotInBoundaryDialogBox().then(function()
			{
				self.sketchTool._drawingLayer.removeAll();
				self.create(self.editModal.obSelectedStopType().toLowerCase());
			});
		}
		return false;
	};

	RoutingTripMapTool.prototype.getBoundaryHeartId = function(boundaryGraphic)
	{
		return this.dataModel.getBoundaryHeartId(boundaryGraphic);
	};

	RoutingTripMapTool.prototype.getHeartBoundaryId = function(pointGraphic)
	{
		return this.dataModel.getHeartBoundaryId(pointGraphic);
	};

	RoutingTripMapTool.prototype.onSettingChangeEvent = function()
	{
		var self = this;
		self.dataModel.getSetting().then(function(setting)
		{
			self._moveDuplicateNode = setting.moveDuplicateNodes;
			self._allowOverlap = !setting.removeOverlapping;
			self._smartSequence = setting.smartSequence;
			self._fillPattern = self.stopTool._getFillPatternValueBySetting(setting.fillPattern);
			self._uTurnPolicy = self.stopTool._getUturnPolicy(setting.uTurnPolicy);
			self._impedanceAttribute = setting.impedanceAttribute;
			self._pathThickness = setting.pathThickness;
			self._boundaryThickness = setting.boundaryThickness;
			self._boundaryLineStyle = setting.boundaryLineStyle;
			self._showAssignedStudents = setting.showAssignedStudents;
			self._showAssignedStudentsCount = setting.showAssignedStudentsCount;
			self._studentCountLabelColor = setting.studentCountLabelColor;
			self._arrowPosition = setting.arrowPosition;
			self._avgSpeed = setting.avgSpeed;
			self._speedType = setting.speedType;

			self._map.findLayerById("routingTripStopBoundaryLayer").graphics.items.forEach(function(graphic)
			{
				var color = new tf.map.ArcGIS.Color([graphic.symbol.color.r, graphic.symbol.color.g, graphic.symbol.color.b, self._fillPattern]);
				var outlineSymbol = {
					type: "simple-line",
					style: self._boundaryLineStyle,
					color: new tf.map.ArcGIS.Color([graphic.symbol.color.r, graphic.symbol.color.g, graphic.symbol.color.b, 1]),
					width: self._boundaryThickness
				};
				if (self._boundaryThickness == 0)
				{
					outlineSymbol = {
						type: "simple-line",
						style: "none",
						color: new tf.map.ArcGIS.Color("black"),
						width: 1
					};
				}
				var symbol = {
					type: "simple-fill",
					color: color,
					style: "solid",
					outline: outlineSymbol
				};
				graphic.symbol = symbol;
			});
			self._polylineLayer.graphics.items.forEach(function(graphic)
			{
				var symbol = {
					type: "simple-line",
					style: "solid",
					color: graphic.symbol.color,
					width: self._pathThickness
				};
				graphic.symbol = symbol;
			});

			self._studentLayer.visible = !!self._showAssignedStudents;
			self._studentLayer.graphics.items.forEach(graphic =>
			{
				graphic.visible = !!self._showAssignedStudents;
			});
			self._studentCountLayer.visible = !!self._showAssignedStudentsCount;
			self.refreshTripArrow();
			self.viewModel._viewModal.geoSearchPaletteViewModel.childSections.TripStopSection.highlightedChangeSymbol();
		});
	};

	RoutingTripMapTool.prototype.movePoint = function(id)
	{
		var self = this, tripStopGraphic = self._findGraphicInLayerById(self._pointLayer, id);
		var boundaryGraphic = self._findGraphicInLayerById(self._polygonLayer, tripStopGraphic.attributes.dataModel.boundary.id);
		if (boundaryGraphic)
		{
			self._oldBoundaryGraphic = boundaryGraphic;
			self._oldBoundarySymbol = boundaryGraphic.symbol.clone();
			boundaryGraphic.symbol = self.symbol.editPolygonSymbol();
		} else
		{
			self._oldBoundaryGraphic = null;
			self._oldBoundarySymbol = null;
		}
		if (tripStopGraphic.attributes.label)
		{
			var tripId = tripStopGraphic.attributes.FieldTripId, labelGrapic = tripStopGraphic.attributes.label, tripStopSequence = labelGrapic.symbol.text, stopSymbol = self.symbol.tripStop(tripStopSequence, self.dataModel.getColorByTripId(tripId));
			tripStopGraphic.symbol = stopSymbol;
			//labelGrapic.visible = false;
			self._pointLayer.remove(labelGrapic);
			// delete tripStopGraphic.attributes.label;
		}
		self._oldTripStopGraphic = tripStopGraphic.clone();
		var options = { moveDuplicateNode: self.getMoveDuplicateNode.bind(self) };
		if (self._showAssignedStudentsCount)
		{
			var studentCountLabel = self._findGraphicInLayerById(self._studentCountLayer, id);
			options.moveTogetherGraphics = [studentCountLabel];
		}

		self.sketchTool.transform(tripStopGraphic, options, self.movePointCallback.bind(self));
		self._deleteTripStopArrow({ id: id });
	};

	RoutingTripMapTool.prototype.movePointCallback = function(graphics)
	{
		var self = this;
		if (!graphics)
		{
			self._oldBoundaryGraphic.symbol = self._oldBoundarySymbol;
			return;
		}
		self.isTripStopInTravelRegions(graphics).then(inside =>
		{
			if (inside) { graphics[0].geometry = self._oldTripStopGraphic.geometry; }
			graphics.forEach(function(graphic)
			{
				var stopGraphic = self._findGraphicInLayerById(self._pointLayer, graphic.attributes.dataModel.id);
				if (stopGraphic)
				{
					var stopColor = self.dataModel.getColorByTripId(graphic.attributes.FieldTripId);
					stopGraphic.symbol = self.symbol.tripStopSimpleMarker(stopColor, 23);
					if (stopGraphic.attributes.label)
					{
						stopGraphic.attributes.label.geometry = graphic.geometry;
						self._pointLayer.add(stopGraphic.attributes.label);
					}
				}
			});
			TF.RoutingMap.EsriTool.prototype.movePointCallback.call(self, graphics);
		});
	};

	RoutingTripMapTool.prototype.copyToTripStop = function(tripStop)
	{
		var self = this;
		var newStopBoundary = {
			OBJECTID: 0,
			id: TF.createId(),
			geometry: tripStop.boundary.geometry.clone(),
			type: "tripBoundary",
			BdyType: tripStop.boundary.BdyType
		};
		tripStop = $.extend({}, tripStop, { geometry: tripStop.geometry.clone(), boundary: newStopBoundary });
		var trips = self.dataModel.fieldTrips;
		// if overlap then cut overlap boundary 
		if (!self._allowOverlap)
		{
			trips = self.getNotContainTrips(tripStop);
			if (trips.length == 0)
			{
				self.overlapDialogTransform();
				return;
			}
		}
		return self.viewModel.editFieldTripStopModal.create({
			geometry: tripStop.geometry,
			Street: tripStop.Street,
			City: tripStop.City,
			ProhibitCrosser: tripStop.ProhibitCrosser || 0,
			vehicleCurbApproach: tripStop.vehicleCurbApproach,
			Comment: tripStop.Comments,
			TotalStopTime: TF.Helper.TripStopHelper.convertToMinuteSecond(TF.Helper.TripStopHelper.convertToSeconds(tripStop.TotalStopTime) || 0, "HH:mm:ss")
		}, function()
		{
			return Promise.resolve(newStopBoundary);
		}, { isCopied: true, Trips: trips });
	};

	RoutingTripMapTool.prototype.revert = function(data, type)
	{
		var self = this;
		if (type == "update" && data.length > 0)
		{
			if (data[0].type == "tripStop")
			{
				data.forEach(function(d)
				{
					var currentStop = self._findGraphicInLayerById(self._pointLayer, d.id);
					currentStop.geometry = TF.cloneGeometry(d.geometry);
					currentStop.attributes.label.geometry = TF.cloneGeometry(d.geometry);

					if (d.boundary)
					{
						var currentBoundary = self._findGraphicInLayerById(self._polygonLayer, d.boundary.id);
						currentBoundary.geometry = TF.cloneGeometry(d.boundary.geometry);
					}

					var currentStudentCount = self._findGraphicInLayerById(self._studentCountLayer, d.id);
					if (currentStudentCount) currentStudentCount.geometry = TF.cloneGeometry(d.geometry);
				});
				self.dataModel.fieldTripStopDataModel.update(data, true);
			} else if (data[0].type == "tripBoundary")
			{
				data.forEach(function(d)
				{
					var currentGraphic = self._findGraphicInLayerById(self._polygonLayer, d.id);
					if (d.geometry)
					{
						if (!currentGraphic)
						{
							currentGraphic = self.createStopBoundaryGraphic(d, d.geometry, d.FieldTripId);
							self._polygonLayer.add(currentGraphic);
						} else
						{
							currentGraphic.geometry = TF.cloneGeometry(d.geometry);
						}
					}
				});
			}
		}
		else if (type == "create")
		{
			self.dataModel.fieldTripStopDataModel.delete(data);
		} else if (type == "delete")
		{
			data.forEach(function(d)
			{
				self.dataModel.fieldTripStopDataModel.create(d);
			});
		}
	};

	RoutingTripMapTool.prototype._deleteTripStopArrow = function(tripStop)
	{
		var self = this;
		var graphics = self._pointArrowLayer.graphics.items.filter(function(graphic)
		{
			return graphic.attributes && graphic.attributes.Id == tripStop.id;
		});
		self._pointArrowLayer.removeMany(graphics);
	};

	RoutingTripMapTool.prototype.dispose = function()
	{

	};

})();
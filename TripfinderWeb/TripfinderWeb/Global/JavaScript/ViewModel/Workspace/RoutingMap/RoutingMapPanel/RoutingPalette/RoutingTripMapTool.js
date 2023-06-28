(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingTripMapTool = RoutingTripMapTool;
	function RoutingTripMapTool(viewModel)
	{
		var self = this;
		self._map = viewModel._viewModal._map;
		self.dataModel = viewModel.dataModel;
		self._arcgis = tf.map.ArcGIS;
		self.editModal = viewModel.editTripStopModal;
		self._viewModal = viewModel._viewModal;
		self.viewModel = viewModel;
		TF.RoutingMap.EsriTool.call(self, self._map, self._arcgis, viewModel.viewModel);

		self.initialize();

		self.dataModel.onAssignStudentsChangeToMapEvent.subscribe(self.onAssignStudentsChangeEvent.bind(this));
		self.dataModel.onTripsChangeEvent.subscribe(self.onTripsChangeEvent.bind(this));
		self.dataModel.onTripStopsChangeEvent.subscribe(self.onTripStopsChangeEvent.bind(self));
		self.dataModel.onChangeTripVisibilityEvent.subscribe(self.onChangeTripVisibilityEvent.bind(self));
		self.stopTool = new TF.RoutingMap.RoutingPalette.StopTool(self);
		self.stopPreviewTool = new TF.RoutingMap.RoutingPalette.StopPreviewTool(self, self._map);
		self.NAtool = new TF.RoutingMap.RoutingPalette.NetworkAnalysisTool(self);

		self.initializeSettings();

		self.dataModel.onTrialStopWalkoutPreviewChange.subscribe(self.stopPreviewTool.onTrialStopWalkoutPreviewChange.bind(self.stopPreviewTool));
		self.dataModel.onSettingChangeEvent.subscribe(self.onSettingChangeEvent.bind(this));
		self.dataModel.onTripColorChangeEvent.subscribe(self.refreshTrips.bind(self));
		self.dataModel.onTripSequenceChangeEvent.subscribe(self.refreshTrips.bind(this));
		self.dataModel.onTripPathLineDisplayChange.subscribe(self.onTripPathLineDisplayChange.bind(this));
		self.dataModel.onStopBoundaryShowChange.subscribe(self.onStopBoundaryShowChange.bind(this));
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

		// self.viewModel.viewModel.unassignedStudentViewModel.drawTool.initialize();// For correct layer order.

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

	RoutingTripMapTool.prototype.drawSchoolLocation = function(schoolLocations)
	{
		var self = this;
		self._schoolLocationLayer.removeAll();
		var symbol = self.symbol.schoolLocation();
		schoolLocations.forEach(function(schoolLocation)
		{
			var graphic = new self._arcgis.Graphic({
				geometry: schoolLocation.geometry,
				symbol: symbol
			});
			self._schoolLocationLayer.add(graphic);
		});
	};

	RoutingTripMapTool.prototype.addPolygonToLayer = function(graphic)
	{
		var self = this;

		if (!self._stopInBoundaryCheck(self._newTripStopGraphic.geometry, graphic.geometry))
		{
			graphic = self.removeOverlapBoundaryWithEditTrips(graphic);
			graphic.geometry = self._cutResultHandler(graphic.geometry, self._newTripStopGraphic.geometry);
			self.createStopBoundaryResolve({
				geometry: graphic.geometry,
				graphic: graphic,
				BdyType: self.editModal.isDoorToDoor() ? 0 : 1
			});
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
							var travelScenarioId = self.dataModel.trips ? self.dataModel.trips[0].TravelScenarioId : 1;
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
			var travelScenarioId = self.dataModel.trips ? self.dataModel.trips[0].TravelScenarioId : 1;
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
				var trip = self.dataModel.getTripById(graphic.attributes.dataModel.TripId);
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

	RoutingTripMapTool.prototype.onTripsChangeEvent = function(event, items)
	{
		var self = this;
		if (items.draw != false)
		{
			if (items.delete.length > 0)
			{
				items.delete.forEach(function(item)
				{
					self.deleteTrip(item);
				});
			} else if (items.add.length > 0)
			{
				items.add.forEach(function(item)
				{
					self.addTrip(item);
				});
			} else if (items.edit.length > 0)
			{
				items.edit.forEach(function(item)
				{
					self.deleteTrip(item);
				});
				items.edit.forEach(function(item)
				{
					self.addTrip(item);
				});
			}
		}
		self.updateStudentCountLabel();
		self.refreshStudentStopAssignment();
		// self.updateStudentVisible();
		// self.refreshTrips(); //comment for improve open trip performance. RW-11855
	};

	RoutingTripMapTool.prototype.onTripStopsChangeEvent = function(evt, items)
	{
		if (items && items.options && items.options.notNotifyTreeAndMap)
		{
			return;
		}
		var self = this;

		if (items.delete.length > 0)
		{
			items.delete.forEach(function(item)
			{
				self._deleteTripStop(item);
				self._deleteTripBoundary(item.boundary);
				self._deleteTripPathSegment(item);
				self._deleteTripStopArrow(item);
			});
		}
		if (items.add.length > 0)
		{
			items.add.forEach(function(item)
			{
				self._addTripStop(item, item.TripId);
				self._addTripBoundary(item.boundary, item.TripId);
				self._addTripPathSegment(item);
			});
		}
		if (items.edit.length > 0)
		{
			items.edit.forEach(function(item)
			{
				self._updateTripStop(item);
				self._updateTripBoundary(item);
				self._updateTripPathSegment(item);
			});
		}
		self.updateStudentCountLabel();
		self.refreshStudentStopAssignment();
		// // self.updateStudentVisible();
		if (items.refreshTrip != false)
		{
			self.refreshTrips();//reorder the trips to fix label/stop layer order issue. 
		}
	};

	RoutingTripMapTool.prototype.onTripPathLineDisplayChange = function()
	{
		this.dataModel.trips.forEach(trip =>
		{
			this.redrawPath(trip);
		});
	};

	RoutingTripMapTool.prototype.onTripColorChangeEvent = function(e, data)
	{
		var self = this;
		var tripId = data.TripId;
		var stopColor = self.dataModel.getColorByTripId(tripId);
		self._getTripRelateGraphics(tripId).items.forEach(function(graphic)
		{
			if (graphic.attributes.type == "crossRoute")
			{
				return;
			}
			if (graphic.attributes.type == "tripPath")
			{
				graphic.symbol = self._getTripPathSymbol(tripId);
			}
			if (graphic.attributes.type == "boundary")
			{
				graphic.symbol = self._getTripBoundarySymbol(tripId); // .color = new tf.map.ArcGIS.Color([color.r, color.g, color.b, self._fillPattern]);
			}
			// if (graphic.attributes.type == "student")
			// {
			// 	graphic.symbol = self.getStudentSymbol(graphic.attributes.dataModel);
			// }
			if (graphic.attributes.type == "tripStopPointer")
			{
				graphic.symbol = self.symbol.arrowToPoint(stopColor);
			}
			if (graphic.attributes.type == "tripStop")
			{
				if (!graphic.attributes.dataModel.SchoolCode)
				{
					if (graphic.attributes.label)
					{
						var text = graphic.attributes.label.symbol.text;
						var labelSymbol = self.symbol.tripStopLabel(stopColor);
						labelSymbol.text = text;
						graphic.symbol.color = stopColor;
						graphic.attributes.label.symbol = labelSymbol;
					} else
					{
						graphic.symbol = self.symbol.tripStop(graphic.attributes.dataModel.Sequence, stopColor);
					}
				}
			}
		});
		self.refreshTripArrow(tripId);
		self.refreshTrips();
	};

	RoutingTripMapTool.prototype.onTripSequenceChangeEvent = function(evt, items)
	{
		var self = this;
		if (!items || items.length == 0)
		{
			return;
		}

		items.forEach(function(item)
		{
			var tripStopGraphic = self._findGraphicInLayerById(self._pointLayer, item.id);
			if (tripStopGraphic)
			{
				var color = self.dataModel.getColorByTripId(item.TripId);
				var stopSymbol = self.symbol.tripStopSimpleMarker(color, 23);
				if (item.SchoolCode && item.SchoolCode.length > 0)
				{
					stopSymbol = self.schoolSymbol;
				}
				if (tripStopGraphic.attributes.label)
				{
					var labelSymbol = self.symbol.tripStopLabel(color);
					labelSymbol.text = item.Sequence;
					tripStopGraphic.attributes.label.symbol = labelSymbol;
					// self._pointLayer.remove(tripStopGraphic.attributes.label);
					// delete tripStopGraphic.attributes.label;
				}
				tripStopGraphic.symbol = stopSymbol;
				self._updateTripPathSegment(item);
			}
		});
		var trip = self.dataModel.getTripById(items[0].TripId);
		self.redrawPath(trip);
		self.refreshTrips();
	};

	RoutingTripMapTool.prototype.refreshTrips = function()
	{
		var self = this;
		self._pointLayer.removeAll();
		self._polygonLayer.removeAll();
		self._polylineLayer.removeAll();
		self._arrowLayer.removeAll();
		self.dataModel.trips.forEach(function(trip)
		{
			self.addTrip(trip);
		});
		self.updateStudentCountLabel();
		self.refreshStudentStopAssignment();
		self._map.reorder(self._pointLayer, self._map.layers.length + 1);//always keeps stop on top of other. 
	};

	RoutingTripMapTool.prototype._deleteTripPathSegment = function(tripStop)
	{
		var self = this;
		if (!tripStop)
		{
			return;
		}
		if (tripStop.path && tripStop.path.geometry)
		{
			var tripPath = self._findGraphicInLayerById(self._polylineLayer, tripStop.TripId);
			if (tripPath)
			{
				tripPath.geometry.paths.splice(tripStop.Sequence - 1, 1);
				var geometry = {
					type: "polyline",
					spatialReference: self._map.mapView.spatialReference,
					paths: tripPath.geometry.paths
				};
				tripPath.geometry = geometry;
			}
		}
		self.redrawPath(self.dataModel.getTripById(tripStop.TripId));
	};

	RoutingTripMapTool.prototype._addTripPathSegment = function(tripStop)
	{
		var self = this;
		if (!tripStop)
		{
			return;
		}
		if (tripStop.path && tripStop.path.geometry)
		{
			var tripPath = self._findGraphicInLayerById(self._polylineLayer, tripStop.TripId);
			if (tripPath)
			{
				tripPath.geometry.paths.splice(tripStop.Sequence - 1, 0, tripStop.path.geometry.paths[0]);
				var geometry = {
					type: "polyline",
					spatialReference: self._map.mapView.spatialReference,
					paths: tripPath.geometry.paths
				};
				tripPath.geometry = geometry;
			}
		}
		self.redrawPath(self.dataModel.getTripById(tripStop.TripId));
	};

	RoutingTripMapTool.prototype._updateTripPathSegment = function(tripStop)
	{
		var self = this, trip = self.dataModel.getTripById(tripStop.TripId), visible = trip.visible;
		if (tripStop.path && tripStop.path.geometry)
		{
			var tripPath = self._findGraphicInLayerById(self._polylineLayer, tripStop.TripId);
			if (tripPath)
			{
				tripPath.geometry.paths[tripStop.Sequence - 1] = tripStop.path.geometry.paths ? tripStop.path.geometry.paths[0] : [];
				var geometry = new self._arcgis.Polyline({
					type: "polyline",
					spatialReference: self._map.mapView.spatialReference,
					paths: tripPath.geometry.paths
				});
				tripPath.geometry = geometry;
				if (visible == false)
				{
					tripPath.visible = false;
				}
			}
		}
		self.redrawPath(self.dataModel.getTripById(tripStop.TripId));
	};

	RoutingTripMapTool.prototype.redrawPath = function(trip)
	{
		var self = this;
		self._deleteTripPath(trip);
		var tripPaths = [];
		trip.TripStops.forEach(stop =>
		{
			var path = TF.Helper.TripHelper.getDrawTripPathGeometry(stop, trip);
			if (path)
			{
				tripPaths.push(path)
			}
		})
		self._addTripPath(tripPaths, trip);
	};

	RoutingTripMapTool.prototype._deleteTripPath = function(trip)
	{
		var self = this;
		var graphics = self._polylineLayer.graphics.items;
		for (var i = 0; i < graphics.length; i++)
		{
			if (graphics[i].attributes.TripId == trip.id)
			{
				self._polylineLayer.remove(graphics[i]);
				return;
			}
		}
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

	RoutingTripMapTool.prototype.onChangeTripVisibilityEvent = function(e, data)
	{
		var self = this;
		var visible = data.visible;
		var tripIds = data.TripIds;
		self.viewModel.routingChangePath && self.viewModel.routingChangePath.stop();
		for (var i = 0; i < tripIds.length; i++)
		{
			var tripId = tripIds[i];
			self._getTripRelateGraphics(tripId).forEach(function(graphic)
			{
				var isVisible = visible;
				if (graphic.attributes.type === "boundary")
				{
					isVisible = isVisible && self._showStopBoundary;
				}
				graphic.visible = !!isVisible;
			});
			self.refreshTripArrow(tripId);
		}
		self.viewModel.viewModel.tripStopLabelSetting.labelDisplay._refreshGraphicsLazyRun();
	};

	RoutingTripMapTool.prototype.updateTripId = function(oldTripId, newTripId)
	{
		this._getTripRelateGraphics(oldTripId).forEach(function(graphic)
		{
			graphic.attributes.TripId = newTripId;
		});
	};

	RoutingTripMapTool.prototype._getTripRelateGraphics = function(tripId)
	{
		var self = this;

		function getGraphicsByFilter(layer)
		{
			return layer.graphics.items.filter(function(graphic)
			{
				return graphic.attributes && graphic.attributes.TripId == tripId;
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

	RoutingTripMapTool.prototype.addTrip = function(trip)
	{
		var self = this;
		var tripPaths = [];
		trip.TripStops.forEach(function(stop)
		{
			var path = TF.Helper.TripHelper.getDrawTripPathGeometry(stop, trip);
			if (path)
			{
				tripPaths.push(path);
			}
			self._addTripStop(stop, trip.id);
			self._addTripBoundary(stop.boundary, trip.id);
			// self._addStudent(stop, trip.id);
		});
		self._addTripPath(tripPaths, trip);
	};

	RoutingTripMapTool.prototype._addTripStop = function(tripStop, tripId)
	{
		if (!tripStop.geometry)
		{
			return;
		}
		var self = this,
			stopGraphic,
			trip = self.dataModel.getTripById(tripId),
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
					TripId: tripId,
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
					TripId: tripId,
					type: "tripStopLabel"
				}
			});
			stopGraphic = new self._arcgis.Graphic({
				geometry: geometry,
				symbol: stopSymbol,
				attributes: {
					"dataModel": tripStop,
					TripId: tripId,
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
		var self = this, stopSymbol, trip = self.dataModel.getTripById(tripStop.TripId), visible = trip.visible;
		var stopColor = self.dataModel.getColorByTripId(tripStop.TripId);
		var stopGraphic = self._pointLayer.graphics.items.filter(function(graphic)
		{
			return graphic.attributes && graphic.attributes.dataModel && tripStop.id == graphic.attributes.dataModel.id;
		})[0];

		if (stopGraphic.attributes.label)
		{
			var labelSymbol = self.symbol.tripStopLabel(stopColor);
			labelSymbol.text = tripStop.Sequence;
			stopGraphic.attributes.label.symbol = labelSymbol;
			stopGraphic.attributes.label.attributes.TripId = tripStop.TripId;
			stopGraphic.attributes.label.attributes.dataModel = tripStop;
			stopGraphic.attributes.label.geometry = tripStop.geometry;
			// self._pointLayer.remove(stopGraphic.attributes.label);
		}
		stopGraphic.attributes = {
			"dataModel": tripStop,
			TripId: tripStop.TripId,
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
			stopSymbol = self.symbol.tripStopSimpleMarker(stopColor, 23);// self.symbol.tripStop(tripStop.Sequence, self.dataModel.getColorByTripId(tripStop.TripId));
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
	RoutingTripMapTool.prototype._addTripBoundary = function(boundary, tripId)
	{
		var self = this;
		if (!boundary || !boundary.geometry)
		{
			return;
		}
		var trip = self.dataModel.getTripById(tripId);
		var geometry = boundary.geometry;
		// var newBoundary = JSON.parse(JSON.stringify(boundary));
		// TF.loopCloneGeometry(newBoundary, boundary);
		var graphic = this.createStopBoundaryGraphic(boundary, geometry, tripId);
		if (trip.visible == false || !self._showStopBoundary)
		{
			graphic.visible = false;
		}
		self._polygonLayer.add(graphic);
	};

	RoutingTripMapTool.prototype.createStopBoundaryGraphic = function(dataModel, geometry, tripId)
	{
		var symbol = this._getTripBoundarySymbol(tripId);
		return new this._arcgis.Graphic({
			geometry: geometry,
			symbol: symbol,
			attributes: {
				"dataModel": dataModel,
				TripId: tripId,
				type: "boundary"
			}
		});
	};

	RoutingTripMapTool.prototype._updateTripBoundary = function(tripStop)
	{
		var self = this, trip = self.dataModel.getTripById(tripStop.TripId), visible = trip.visible && this._showStopBoundary;
		if (tripStop.boundary && tripStop.boundary.geometry)
		{
			if (!self._arcgis.geometryEngine.intersects(tripStop.geometry, tripStop.boundary.geometry))
			{
				var nearestPointGeometry = self._arcgis.geometryEngine.nearestCoordinate(tripStop.boundary.geometry, tripStop.geometry).coordinate;
				tripStop.boundary.geometry = self._createFinger(nearestPointGeometry, tripStop.geometry, tripStop.boundary);
			}
			var boundaryGraphic = self._findGraphicInLayerById(self._polygonLayer, tripStop.boundary.id);
			if (!boundaryGraphic) return;
			boundaryGraphic.attributes = {
				"dataModel": tripStop.boundary,
				TripId: tripStop.TripId,
				type: "boundary"
			};
			if (visible == false)
			{
				boundaryGraphic.visible = false;
			}
			boundaryGraphic.geometry = tripStop.boundary.geometry;
			boundaryGraphic.symbol = self._getTripBoundarySymbol(tripStop.TripId);
		}
	};

	RoutingTripMapTool.prototype._deleteTripBoundary = function(tripBoundary)
	{
		var self = this;
		var boundary = self._findGraphicInLayerById(self._polygonLayer, tripBoundary.id);
		self._polygonLayer.remove(boundary);
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

	// RoutingTripMapTool.prototype._addStudent = function(tripStop, tripId)
	// {
	// 	var self = this;
	// 	var students = null;
	// 	students = tripStop.Students;
	// 	var visible = self.dataModel.getTripById(tripId).visible;
	// 	if (students)
	// 	{
	// 		students.forEach(function(student)
	// 		{
	// 			student.type = "student";
	// 			if (student.XCoord)
	// 			{
	// 				var geometry = student.geometry;
	// 				var studentSymbol = self.getStudentSymbol(student);
	// 				var studentGraphic = new self._arcgis.Graphic({
	// 					geometry: geometry,
	// 					symbol: studentSymbol,
	// 					attributes: {
	// 						"dataModel": student,
	// 						TripId: tripId,
	// 						type: "student"
	// 					}
	// 				});
	// 				studentGraphic.visible = visible && self._showAssignedStudents;
	// 				self._studentLayer.add(studentGraphic);
	// 			}
	// 		});
	// 	}
	// };

	// RoutingTripMapTool.prototype.getStudentSymbol = function(student)
	// {
	// 	var self = this;
	// 	if (student.IsAssigned)
	// 	{
	// 		return self.symbol.getAssignedStudentSymbol(self.dataModel.getColorByTripId(student.TripID));
	// 	}
	// 	return self.symbol.getUnassignedStudentSymbol();
	// };

	RoutingTripMapTool.prototype._addTripPath = function(paths, trip)
	{
		var self = this;
		var unionPath = self._multiPolylinesToSinglePolyline(paths);
		var graphic = this.createPathGraphic(unionPath, trip);
		if (graphic.geometry.paths.length > 0)
		{
			self._polylineLayer.add(graphic);
		}
		self.refreshTripArrow(trip.id);
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
				TripId: trip.id
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
		if (self.dataModel.trips.length > 0 && self.dataModel.trips.filter(function(c) { return c.visible; }).length > 8)
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
					if (graphic.attributes.TripId == tripId)
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
					var trip = self.dataModel.getTripById(graphic.attributes.dataModel.id);
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
									TripId: trip.id,
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

	RoutingTripMapTool.prototype.updateStudentCountLabel = function()
	{
		var self = this;
		if (!self._showAssignedStudentsCount) return;
		self._studentCountLayer.removeAll();
		self._pointLayer.graphics.items.forEach(function(graphic)
		{
			if (graphic.attributes && graphic.attributes.dataModel && graphic.attributes.type == "tripStop")
			{
				self._addStudentCountLabel(graphic.attributes.dataModel);
			}
		});
	};

	RoutingTripMapTool.prototype._addStudentCountLabel = function(stop)
	{
		var self = this;
		if (!self._showAssignedStudentsCount) return;
		if (!stop || (stop.SchoolCode && stop.SchoolCode.length > 0)) return;
		var trip = self.dataModel.getTripById(stop.TripId);
		if (trip)
		{
			// var screenPoint = self._arcgis.screenUtils.toScreenPoint(self._map.extent, self._map.width, self._map.height, stop.geometry);
			// var labelPoint = self._arcgis.screenUtils.toMapPoint(self._map.extent, self._map.width, self._map.height, screenPoint.offset(15, -15));
			var count = stop.Students.length; // .filter(function(student) { return student.IsAssigned; }).length;
			var stopSymbol = self.symbol.studentCount(count, "#000000");
			stopSymbol.xoffset = 13;
			stopSymbol.yoffset = 13;
			var graphic = new self._arcgis.Graphic({
				geometry: stop.geometry,
				symbol: stopSymbol,
				attributes: { dataModel: stop, type: "studentCount", TripId: stop.TripId }
			});
			if (trip.visible == false)
			{
				graphic.visible = false;
			}
			self._studentCountLayer.add(graphic);
		}
	};

	// RoutingTripMapTool.prototype.updateStudentVisible = function()
	// {
	// var self = this;
	// self._studentLayer.graphics.forEach(function(graphic)
	// {
	// 	if (graphic.attributes.dataModel.IsAssigned)
	// 	{
	// 		var trip = self.dataModel.getTripById(graphic.attributes.TripId);
	// 		if (!self._showAssignedStudents || (trip && trip.visible == false)) graphic.visible = false;
	// 		else { graphic.visible = true; }
	// 	}
	// });
	// };

	RoutingTripMapTool.prototype._intersectWithCurrentPolygons = function(g)
	{
		let self = this,
			intersectGeometries = [];
		let editTripIds = self.dataModel.trips.filter(r=> r.OpenType == "Edit" && r.Id > 0).map(r=> r.Id);
		let graphics = self._polygonLayer.graphics.items.filter(r=> r.attributes.dataModel.OBJECTID == 0 || !editTripIds.indexOf(r.attributes.dataModel.TripId));

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
			var trip = self.dataModel.getTripById(stop.TripId);
			trip.TripStops.forEach(ts => currentStops.add(ts));
			if (stop.boundary.BdyType == 0 || !self._isContainedByCurrentPolygons(stop, self._polygonLayer.graphics.items.filter(x => { return x.attributes.dataModel.TripId == stop.TripId; })))
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
		var trips = this.dataModel.trips;
		var notContainTrips = [];
		for (var i = 0; i < trips.length; i++)
		{
			var isContained = false;
			for (var j = 0; j < trips[i].TripStops.length; j++)
			{
				var boundary = trips[i].TripStops[j].boundary;
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

	RoutingTripMapTool.prototype.reshapeBoundaryDialog = function()
	{
		return this._warningDialogBox("The stop boundary shape will be reverted to original since it leads to the trip stop falls outside of the bounary. ");
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

	RoutingTripMapTool.prototype.onAssignStudentsChangeEvent = function(evt, items)
	{
		var self = this;
		// if (items.add.length > 0)
		// {
		// 	self._addStudent({
		// 		Students: items.add
		// 	}, items.add[0].Dly_TripID);
		// }
		// if (items.delete.length > 0)
		// {
		// 	items.delete.forEach(function(student)
		// 	{
		// 		self._deleteStudent(student);
		// 	});
		// }
		// if (items.edit.length > 0)
		// {
		// 	items.edit.forEach(function(student)
		// 	{
		// 		self._deleteStudent(student);
		// 		self._addStudent({
		// 			Students: [student]
		// 		}, student.Dly_TripID);
		// 	});
		// }
		self.updateStudentCountLabel();
		self.refreshStudentStopAssignment();
	};

	RoutingTripMapTool.prototype.onCandidatesStudentsChangeEvent = function(event, items)
	{
		// var self = this,
		// 	unassignStudentMapTool = self.viewModel.viewModel.unassignedStudentViewModel.drawTool;
		// if (items.delete.length > 0)
		// {
		// 	items.delete = items.delete.filter(function(c) { return c.IsShowOnMap; });
		// 	self.viewModel.viewModel.unassignedStudentViewModel.drawTool.clearArrow(items.delete);
		// }
		// if (items.add.length > 0)
		// {
		// 	items.add = items.add.filter(function(c)
		// 	{
		// 		c.type = "student";// add type for RCM;
		// 		return c.IsShowOnMap;
		// 	});
		// }
		// if (items.edit.length > 0)
		// {
		// 	items.edit = items.edit.filter(function(c) { return c.IsShowOnMap; });
		// }
		// return unassignStudentMapTool.onChangeEvent(event, items);
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

			self.updateStudentCountLabel();
			self.refreshStudentStopAssignment();
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
			var tripId = tripStopGraphic.attributes.TripId, labelGrapic = tripStopGraphic.attributes.label, tripStopSequence = labelGrapic.symbol.text, stopSymbol = self.symbol.tripStop(tripStopSequence, self.dataModel.getColorByTripId(tripId));
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
					var stopColor = self.dataModel.getColorByTripId(graphic.attributes.TripId);
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

	RoutingTripMapTool.prototype.createDoorToDoorStop = function(student)
	{
		var self = this;
		self.stopTool.findClosestLocationOnStreetForDoorToDoor({ geometry: student.geometry, address: student.Address }).then(function(result)
		{
			var stopLocation = student.geometry;
			if (result)
			{
				stopLocation = result.geometry;
			}
			var midPoint = self.stopTool.getDoorToDoorLocation(stopLocation, student.geometry);
			var pointGraphic = new self._arcgis.Graphic({
				geometry: midPoint,
				attributes: { id: TF.createId() },
				symbol: self.symbol.tripStop("0", "#FFFFFF")
			});
			self._pointLayer.add(pointGraphic);
			self._newTripStopGraphic = pointGraphic;
			var addressPromise = Promise.resolve();
			if (student.Address && student.Address.split(",")[0].length > 0)
			{
				addressPromise = Promise.resolve(student.Address.split(",")[0]);
			} else
			{
				addressPromise = self.stopTool.reverseGeocodeStop(midPoint);
			}
			addressPromise.then(function(result)
			{
				if (result)
				{
					var options = {
						isDoorToDoor: true,
						student: student,
						isCreateFromUnassignStudent: true,
						isCreateFromStopSearch: false,
						isCreateFromSearch: false,
						boundary: null,
						insertBehindSpecialStop: false,
						streetName: result
					};
					self.stopTool.addStopAddressAndBoundary(pointGraphic, options);
				} else
				{
					self._pointLayer.remove(self._newTripStopGraphic);
				}
			});
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
		var trips = self.dataModel.trips;
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
		return self.viewModel.editTripStopModal.create({
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

	RoutingTripMapTool.prototype.copyToTripStops = function(tripStops)
	{
		var self = this;
		var students = [];
		tripStops = tripStops.map(function(stop)
		{
			(stop.Students || []).forEach(function(student)
			{
				students.push(student);
			});
			return $.extend({}, stop,
				{
					geometry: stop.geometry.clone(),
					address: stop.Street,
					Students: stop.Students.slice(),
					ProhibitCrosser: stop.ProhibitCrosser,
					TotalStopTime: stop.TotalStopTime,
					boundary: {
						OBJECTID: 0,
						id: TF.createId(),
						geometry: stop.boundary.geometry,
						type: "tripBoundary",
						BdyType: stop.boundary.BdyType
					}
				});
		});
		var uniqueStudents = Enumerable.From(students).Distinct(function(c) { return c.id; }).ToArray();
		if (uniqueStudents.length == 0) return Promise.resolve(tripStops);

		var promises = [];
		for (var index = 0; index < uniqueStudents.length; index++)
		{
			var student = uniqueStudents[index];
			promises.push(self._containedByHowManyStops(student, tripStops).then(function(result)
			{
				var intersectedStops = result[0], minIndex = result[1];
				if (intersectedStops.length > 1)
				{
					intersectedStops.forEach(function(stop, i)
					{
						stop.unassignStudent = $.extend([], true, stop.Students);
						if (i != minIndex)
						{
							stop.unassignStudent = stop.unassignStudent.filter(function(s) { return s.id != student.id; });
						}
					});

				}
			}));
		}

		return Promise.all(promises).then(function()
		{
			return tripStops;
		});
	};

	RoutingTripMapTool.prototype._containedByHowManyStops = function(student, stops)
	{
		var self = this, promises = [], intersectedStops = [], distances = [];
		stops.forEach(function(stop)
		{
			var isStopContainsStudent = stop.Students.filter(function(s) { return s.id == student.id; }).length > 0;
			if (self._arcgis.geometryEngine.intersects(student.geometry, stop.boundary.geometry) && isStopContainsStudent)
			{
				intersectedStops.push(stop);
				var stops = new self._arcgis.FeatureSet();
				stops.features = self.NAtool._getStops([student, stop]);
				var routeParameters = new self._arcgis.RouteParameters();
				routeParameters.stops = stops;
				// routeParameters = self.stopTool.getWalkRouteParameters(routeParameters);
				var promise = self.stopTool.getWalkRouteParameters(routeParameters).then(function(routeParameters)
				{
					return routeParameters;
				}).then(function(routeParameters)
				{
					new self._arcgis.RouteTask(arcgisUrls.LocalRouteFile).solve(routeParameters)
						.then(function(data)
						{
							return data;
						}, function()
						{
							return;
						});
				});
				promises.push(promise);
			}
		});
		return Promise.all(promises).then(function(results)
		{
			results.forEach(function(result)
			{
				distances.push(result ? result.routeResults[0].route.attributes.Shape_Length : Number.MAX_VALUE);
			});
			return [intersectedStops, distances.indexOf(Math.min.apply(null, distances))];
		});
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
				self.dataModel.tripStopDataModel.update(data, true);
			} else if (data[0].type == "tripBoundary")
			{
				data.forEach(function(d)
				{
					var currentGraphic = self._findGraphicInLayerById(self._polygonLayer, d.id);
					if (d.geometry)
					{
						if (!currentGraphic)
						{
							currentGraphic = self.createStopBoundaryGraphic(d, d.geometry, d.TripId);
							self._polygonLayer.add(currentGraphic);
						} else
						{
							currentGraphic.geometry = TF.cloneGeometry(d.geometry);
						}
					}
				});
				self.dataModel.tripStopDataModel.updateTripBoundary(data, true);
			}
		}
		else if (type == "create")
		{
			self.dataModel.tripStopDataModel.delete(data);
		} else if (type == "delete")
		{
			data.forEach(function(d)
			{
				self.dataModel.tripStopDataModel.create(d);
			});
		}
	};

	RoutingTripMapTool.prototype.drawArrowToPoints = function(arrow)
	{
		this._pointArrowLayer.add(new tf.map.ArcGIS.Graphic({
			geometry: arrow.geometry,
			symbol: this.symbol.arrowToPoint(arrow.color),
			attributes: arrow.attributes
		}));
	};

	RoutingTripMapTool.prototype.clearArrowToPoints = function()
	{
		this._pointArrowLayer.removeAll();
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

	RoutingTripMapTool.prototype.clearCandidateStudents = function()
	{
		var layer = this.viewModel.viewModel.unassignedStudentViewModel.drawTool._pointLayer;
		return layer.queryFeatures().then(function(result)
		{
			if (result.features.length > 0)
			{
				return layer.applyEdits({ deleteFeatures: result.features });
			}
		});
	};

	RoutingTripMapTool.prototype.onStopBoundaryShowChange = function(model, visible)
	{
		this._showStopBoundary = visible;
		this._polygonLayer.graphics.items.forEach(graphic =>
		{
			if (graphic && graphic.attributes.type && graphic.attributes.type === "boundary")
			{
				graphic.visible = visible;
			}
		});
		this.refreshStudentStopAssignment();
	};

	RoutingTripMapTool.prototype.drawStudentStopAssignment = function(students, stop, trip)
	{
		if (!stop || !stop.geometry || !this._showAssignedStudents || this._showStopBoundary)
		{
			return;
		}
		var graphics = students.filter(x => x.geometry && x.geometry.x != 0).map(student =>
		{
			var graphic = this.createPathGraphic([[[student.geometry.x, student.geometry.y], [stop.geometry.x, stop.geometry.y]]], trip);
			graphic.attributes = {
				type: "StudentStopAssignment",
				studentRequirementId: student.RequirementID,
				tripStopId: stop.id,
				studentId: student.id,
				TripId: trip.id
			};
			graphic.symbol.width = 2;
			return graphic;
		});

		this._studentStopAssignmentLayer.addMany(graphics);
	};

	RoutingTripMapTool.prototype.refreshStudentStopAssignment = function()
	{
		this._studentStopAssignmentLayer.removeAll();
		var isVisible = !this._showStopBoundary;
		if (isVisible)
		{
			this.dataModel.trips.forEach((trip) =>
			{
				trip.TripStops.forEach((tripStop) =>
				{
					this.drawStudentStopAssignment(tripStop.Students, tripStop, trip);
				});
			});
		} else
		{
			this._studentStopAssignmentLayer.removeAll();
		}
	};

	RoutingTripMapTool.prototype.dispose = function()
	{

	};

})();
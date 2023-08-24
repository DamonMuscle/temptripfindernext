(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingChangePath = RoutingChangePath;
	var CurbApproachEnum = TF.RoutingMap.Directions.Enum.CurbApproachEnum;
	var LocationTypeEnum = TF.RoutingMap.Directions.Enum.LocationTypeEnum;

	function RoutingChangePath(fieldTripPaletteSectionVM)
	{
		var self = this;
		self.viewModel = fieldTripPaletteSectionVM;
		self.routeState = fieldTripPaletteSectionVM._viewModal.routeState;
		self._map = fieldTripPaletteSectionVM._viewModal._map;
		self._arcgis = fieldTripPaletteSectionVM._viewModal._arcgis;
		TF.RoutingMap.Directions.Tool.call(this, self._map, self._arcgis, fieldTripPaletteSectionVM._viewModal);
		self.isChangeRouteChecked = true;
		self.isMapDetailsChecked = true;
		self.isDirectionDetailsRequired = true;
		self._draggingGhostGraphic = [];
		self._$draggingTooltipHtml = null;
		self.points = [];
		self.path = null;
		self.trip = null;
		self.tripStop = null;
		self.isChanged = false;
		self.isStart = false;
		self.isHit = false;

		self._tripLayer = new self._arcgis.GraphicsLayer({ "id": "rouging_directions_tripLayer" });
		self._tripVertexLayer = new self._arcgis.GraphicsLayer({ "id": "rouging_directions_tripVertexLayer" });
		self._draggingGhostLayer = new self._arcgis.GraphicsLayer({ "id": "rouging_directions_dragging_ghostLayer" });
		self._stopLayer = new self._arcgis.GraphicsLayer({ "id": "rouging_directions_tripStopLayer" });
		self._directionArrowLayer = new self._arcgis.GraphicsLayer({ "id": "rouging_directions_tripStop_directionArrow_Layer" });
		self._stopSequenceLayer = new self._arcgis.GraphicsLayer({ "id": "rouging_directions_tripStop_sequence_Layer" });

		self.layers = [self._tripLayer, self._tripVertexLayer, self._draggingGhostLayer, self._directionArrowLayer, self._stopLayer, self._stopSequenceLayer];
		self.layers.forEach(function(layer)
		{
			self._map.add(layer);
			self.viewModel.layers.push(layer.id);
		});
		self.viewModel.dataModel.onChangeTripVisibilityEvent.subscribe(this.onChangeTripVisibilityEvent.bind(this));
		self.init();
	}

	RoutingChangePath.prototype = $.extend(RoutingChangePath.prototype, Object.create(TF.RoutingMap.Directions.Tool.prototype));
	RoutingChangePath.prototype.constructor = RoutingChangePath;

	RoutingChangePath.prototype.init = function()
	{
		var self = this;
		self._initSymbol();
		self._onStopChanged.subscribe(() =>
		{
			self.isChanged = true;
			self.changeStopPath();
			self.viewModel.dataModel.fieldTripStopDataModel.changeRevertStack([this.tripStop], false);
		});
	};

	RoutingChangePath.prototype.route = async function(tripStop)
	{
		var self = this;
		self.clearAll();
		self._initStops();
		self.reorderLayer();
		self.tripStop = $.extend({}, tripStop, { path: $.extend({}, tripStop.path, { geometry: tripStop.path.geometry.clone() }) });
		self.path = self.tripStop.path;
		self.trip = self.viewModel.dataModel.getFieldTripById(tripStop.TripId);
		self.travelScenarioId = self.trip.TravelScenarioId;
		self.useFileService = true;
		var nextTripStop = self.trip.TripStops[tripStop.Sequence];
		// add trip path start and end point to route direction
		var paths = self.path.geometry.paths[0];
		var startPoint = new self._arcgis.Point(paths[0], self._map.mapView.spatialReference);
		var endPoint = new self._arcgis.Point(paths[paths.length - 1], self._map.mapView.spatialReference);
		await self.stopTool.attachClosetStreetToStop([tripStop, nextTripStop]);
		self.points = ([startPoint, endPoint]).map(function(point, i)
		{
			var curbApproach = nextTripStop.vehicleCurbApproach;
			if (self.notAllowUTurn() && curbApproach == CurbApproachEnum.EITHER_SIDE)
			{
				curbApproach = CurbApproachEnum.NO_U_TURN;
			}
			var SideOfEdge = 0;
			if (i == 0 && tripStop.StreetSegment)
			{
				let geometry = tripStop.SchoolLocation ? tripStop.SchoolLocation.geometry : tripStop.geometry;
				SideOfEdge = self.stopTool._isPointOnRightOfLine(tripStop.StreetSegment.geometry, geometry) ? 1 : 2;
				if (paths.length > 1)
				{
					let nextPoint = paths[1],
						offset = offsetToSide(point, { x: nextPoint[0], y: nextPoint[1] }, geometry, 0.1);
					point = new self._arcgis.Point([offset.x, offset.y], self._map.mapView.spatialReference);
				}
			}
			else if (i != 0 && nextTripStop.StreetSegment)
			{
				let geometry = nextTripStop.SchoolLocation ? nextTripStop.SchoolLocation.geometry : nextTripStop.geometry;
				SideOfEdge = self.stopTool._isPointOnRightOfLine(nextTripStop.StreetSegment.geometry, geometry) ? 1 : 2;
				if (paths.length > 1)
				{
					let previousPoint = paths[paths.length - 2],
						offset = offsetToSide(point, { x: previousPoint[0], y: previousPoint[1] }, geometry, 0.1);
					point = new self._arcgis.Point([offset.x, offset.y], self._map.mapView.spatialReference);
				}
			}

			var graphic = new self._arcgis.Graphic({ geometry: point, attributes: { Sequence: i + 1, CurbApproach: curbApproach, SideOfEdge: SideOfEdge } });
			self._destinations.push(graphic);
			return graphic;
		});
		self._stops = self._destinations.slice();
		var routingStops = self.points;
		if (self.tripStop.routeStops)
		{
			routingStops = self.tripStop.routeStops;
		}
		var routeGeometry = self.path.geometry;
		self._routeDirections = { features: [self.path], mergedGeometry: routeGeometry, geometryType: "esriGeometryPolyline" };
		routingStops.filter(function(c)
		{
			return c.attributes && c.attributes.LocationType == LocationTypeEnum.WAY_POINT;
		}).forEach(function(c)
		{
			// add and display white control point to path
			self._addGhostStop(c);
			self._insertGhostStop(c, c.attributes.Sequence);
		});
		// display routing result on map
		self._refreshRoutingResult(self._routeDirections, routeGeometry);
		self.start(self._routeDirections);
	};

	function offsetToSide(origin, point, sidePoint, offset)
	{
		let pointAngle = solveAngle(Math.atan2(point.y - origin.y, point.x - origin.x)),
			sidePointAngle = solveAngle(Math.atan2(sidePoint.y - origin.y, sidePoint.x - origin.x)),
			deltaAngle = solveAngle(sidePointAngle - pointAngle),
			sideAngle = (deltaAngle < Math.PI ? 1 : -1) * Math.PI / 2,
			offsetAngle = solveAngle(pointAngle + sideAngle),
			x = Math.cos(offsetAngle) * offset,
			y = Math.sin(offsetAngle) * offset;
		return { x: origin.x + x, y: origin.y + y };
	}

	function solveAngle(angle)
	{
		if (!angle) return 0;

		let times = Math.floor(Math.abs(angle) / (Math.PI * 2));
		if (angle >= Math.PI * 2)
		{
			return angle - Math.PI * 2 * times;
		}

		if (angle < 0)
		{
			return angle + Math.PI * 2 * (times + 1);
		}

		return angle;
	}

	RoutingChangePath.prototype.start = function(directions)
	{
		var self = this;
		self.isStart = true;
		self.isChanged = false;
		self.initDraggingParam(directions.mergedGeometry);
		self.deleteCurrentStopPath();
		self.reorderLayer();
		this.bindDraggingGhostLayerEvents();
	};

	RoutingChangePath.prototype.stop = function()
	{
		var self = this;
		if (self.isStart)
		{
			self.isStart = false;
			if (self.isChanged)
			{
				this.changeStopPath();
				self._enableSnapping = true;
				self.isChanged = false;
			} else
			{
				this.drawCurrentStopPathBack();
			}
			TF.Helper.MapHelper.setMapCursor(self._map, "default");
			this.clearAll();
			this._$draggingTooltipHtml && this._$draggingTooltipHtml.hide();
		}
	};

	RoutingChangePath.prototype.changeStopPath = function()
	{
		this.tripStop.routeStops = this.getStopsClone();
		this.tripStop.path.geometry = this._routeGeometry;
		this.tripStop.DrivingDirections = this.getDrivingDirections();
		this.tripStop.RouteDrivingDirections = this.tripStop.DrivingDirections;
		this.tripStop.IsCustomDirection = false;
	};

	RoutingChangePath.prototype.getDrivingDirections = function()
	{
		var drivingDirections = "";
		if (this._routeDirections && this._routeDirections.features.length > 0)
		{
			for (var i = 0; i < this._routeDirections.features.length; i++)
			{
				let attributes = this._routeDirections.features[i].attributes;
				if (attributes && attributes.length > 0)
				{
					if (attributes.maneuverType == "railroadStop")
					{
						drivingDirections += "WARNING CROSS OVER RAILROAD.\n";
					}
					else
					{
						drivingDirections += attributes.text + "\n";
					}
				}
			}

			return drivingDirections;
		}

		return drivingDirections || this.tripStop.DrivingDirections || "";
	};

	RoutingChangePath.prototype.clearAll = function()
	{
		var self = this;
		self.layers.forEach(function(layer)
		{
			if (layer)
			{
				layer.removeAll();
			}
		});
		self.unbindEvent();
	};

	RoutingChangePath.prototype.onChangeTripVisibilityEvent = function(e, data)
	{
		var self = this;
		if (!self.trip || data.TripIds.indexOf(self.trip.id) < 0)
		{
			return;
		}
		self.layers.forEach(function(layer)
		{
			if (layer && layer.id !== "rouging_directions_tripLayer")
			{
				layer.visible = data.visible;
			}
		});
	};

	RoutingChangePath.prototype.reorderLayer = function()
	{
		var self = this;
		var layerCount = self._map.allLayers.length;
		this._map.reorder(self._tripLayer, layerCount + 1);
		this._map.reorder(self._tripVertexLayer, layerCount + 1);
		this._map.reorder(self._directionArrowLayer, layerCount + 2);
		this._map.reorder(self._draggingGhostLayer, layerCount + 2);
		this._map.reorder(self._stopLayer, layerCount + 2);
	};

	RoutingChangePath.prototype.initDraggingParam = function(mergedGeometry)
	{
		var self = this;
		self._initDraggingParam(mergedGeometry);
		self._draggingRoutingMillisec = 500000;
		self._initDraggingTooltips();
	};

	RoutingChangePath.prototype.bindDraggingGhostLayerEvents = function()
	{
		var self = this;
		var isPointerDown = false;
		self._draggingGhostLayerMouseDownEvent = self._map.mapView.on("pointer-down", function(e)
		{
			isPointerDown = true;
			if (e.button == 0)
			{
				self._map.mapView.allLayerViews.forEach(function(layerView)
				{
					if (layerView.layer == self._draggingGhostLayer)
					{
						self._hitTest(e, layerView, self._draggingGhostLayerMouseDownHandler);
					} else if (layerView.layer == self._stopLayer)
					{
						self._hitTest(e, layerView, self._stopLayerMouseDownHandler);
					}
				});
			}
		});
		self._draggingGhostLayerMouseUpEvent = self._map.mapView.on("pointer-up", function(e)
		{
			isPointerDown = false;
			self._draggingGhostLayerMouseUpHandler(e);
			self._stopLayerMouseUpHandler(e);
		});
		self._draggingMapMouseMoveEvent = self._map.mapView.on("pointer-move", function(e)
		{
			if (isPointerDown)
			{
				return;
			}
			self._draggingMapMouseMoveHandler(e);
			var stopLayerGraphic;

			self._map.mapView.allLayerViews.forEach(function(layerView)
			{
				if (layerView.layer == self._stopLayer)
				{
					var point = self._map.mapView.toMap(e);
					var graphics = layerView.graphicsView._graphicStore.hitTest(point.x, point.y, 2, layerView.graphicsView.view.state.resolution, layerView.graphicsView.view.state.rotation);
					if (graphics.length > 0)
					{
						e.stopPropagation();
						e.graphic = graphics[0];
						stopLayerGraphic = graphics[0];
						self._stopLayerMouseOverHandler(e);
					} else
					{
						if (stopLayerGraphic)
						{
							e.graphic = stopLayerGraphic;
							self._stopLayerMouseOutHandler(e);
							stopLayerGraphic = null;
						} else
						{
							self.enablePan();
						}
					}
				}
			});
		});

		self._draggingMapMouseDragEvent = self._map.mapView.on("drag", function(e)
		{
			self._draggingMapMouseDragHandler(e);
			clearTimeout(self._draggingRoutingTimeoutId);
		});

		self._draggingMapClickEvent = self._map.mapView.on("click", function(e)
		{
			if (!self.isHit && e.button == 0)
			{
				self.stop();
			}
		});

		tf.documentEvent.bind("keydown.changePath", self.routeState, function(e)
		{
			var key = e.key;
			if (key == "Escape")
			{
				self.stop();
			}
		});
		tf.documentEvent.bind("keydown.changePath", self.routeState, function(e)
		{
			if (e.ctrlKey && e.keyCode == 90)
			{
				self.isChanged = false;
				self.stop();
			}
		});
	};

	RoutingChangePath.prototype._hitTest = function(e, layerView, callback)
	{
		var self = this;
		var point = this._map.mapView.toMap(e);
		var graphics = layerView.graphicsView._graphicStore.hitTest(point.x, point.y, 2, layerView.graphicsView.view.state.resolution, layerView.graphicsView.view.state.rotation);
		self.isHit = false;
		if (graphics.length > 0)
		{
			self.isHit = true;
			e.stopPropagation();
			e.graphic = graphics[0];
			callback.call(this, e);
			return;
		}
	};

	RoutingChangePath.prototype._addTrips = function(geometry)
	{
		var self = this,
			symbol = self._tripSymbol(),
			graphic = new self._arcgis.Graphic({ geometry: geometry, symbol: symbol });

		self._tripLayer.add(graphic);
		self._routeGeometry = geometry;
	};

	/**
	* delete current stop path,and change it to edit mode
	*/
	RoutingChangePath.prototype.deleteCurrentStopPath = function()
	{
		var self = this;
		var pathGeometry = self.trip.TripStops.filter(function(stop)
		{
			return stop.path.geometry;
		}).map(function(stop)
		{
			var geometry = TF.cloneGeometry(stop.path.geometry);
			if (stop.id == self.path.TripStopId)
			{
				geometry.paths[0] = [];
			}
			return geometry;
		});
		if (pathGeometry[0].paths.length == 0 || pathGeometry[0].paths[0].length == 0)
		{
			pathGeometry = pathGeometry.slice(1);
		}
		self.deleteTripPath();
		self.drawTripPath(pathGeometry);
	};

	/**
	* when finish edit path, set path to view mode
	*/
	RoutingChangePath.prototype.drawCurrentStopPathBack = function()
	{
		var self = this;
		if (self._tripLayer.graphics.items.length == 0)
		{
			return;
		}
		self.deleteTripPath();
		self.viewModel.drawTool.redrawPath(self.trip);
	};

	RoutingChangePath.prototype.drawTripPath = function(pathGeometry)
	{
		var self = this;
		var trip = self.trip;
		var drawTool = self.viewModel.drawTool;
		var unionPath = drawTool._multiPolylinesToSinglePolyline(pathGeometry);
		var color = drawTool._getColorArray(trip.id);
		var symbol = drawTool._createLineSymbol(color);
		symbol.width = drawTool._pathThickness;
		drawTool._polylineLayer.add(new this._arcgis.Graphic({
			geometry: {
				type: "polyline",
				paths: unionPath.filter(function(c) { return c.length > 0; }),
				spatialReference: {
					wkid: 102100
				}
			},
			symbol: symbol,
			attributes: { "dataModel": self.trip, TripId: self.trip.id }
		}));
		drawTool.refreshTripArrow(trip.id);
	};

	RoutingChangePath.prototype.deleteTripPath = function()
	{
		var self = this;
		var drawTool = self.viewModel.drawTool;
		var graphics = drawTool._polylineLayer.graphics.items;
		for (var i = 0; i < graphics.length; i++)
		{
			if (graphics[i].attributes.TripId == self.trip.id)
			{
				drawTool._polylineLayer.remove(graphics[i]);
				return;
			}
		}
	};

	RoutingChangePath.prototype._updateTripStopProperty = function(result)
	{
		if (result.directions && result.directions.totalLength)
		{
			this.tripStop.Distance = result.directions.totalLength;
			var streetSpeed = result.directions.totalLength / result.directions.totalTime * 60;
			this.tripStop.Speed = streetSpeed;
			this.tripStop.StreetSpeed = streetSpeed;
			this.viewModel.drawTool.NAtool.changeTripStopSpeedByDefaultSpeed([this.tripStop], this.trip);
		}
	};

	RoutingChangePath.prototype.getStopsClone = function(result)
	{
		var self = this,
			stops = [], stop, attributes, geometry, symbol, graphic;
		self._mergeDestinationAndThroughPoints();

		if (result)
		{
			self._updateTripStopProperty.call(self, result);
		}

		if (self._stops.length === 0 && self._wayPoints.length === 0)
		{
			return [];
		}

		if (self._wayPoints.length > 0)
		{
			self._mergeStopsAndWayPoints(self._stops, self._wayPoints);
		}

		if (self._stops)
		{
			for (var i = 0, length = self._stops.length; i < length; i++)
			{
				stop = self._stops[i];
				attributes = stop.attributes;
				geometry = stop.geometry;
				symbol = stop.symbol;

				graphic = new self._arcgis.Graphic({
					geometry: new self._arcgis.Point(geometry.x, geometry.y, self._webMercator),
					symbol: symbol,
					attributes: {
						"Sequence": attributes.Sequence,
						"Address": attributes.Street,
						"LocationType": attributes.LocationType,
						"StopType": attributes.StopType,
						"Name": attributes.Street,
						"CurbApproach": attributes.CurbApproach,
						"SideOfEdge": attributes.SideOfEdge
					}
				});
				stops.push(graphic);
			}
		}
		return stops;
	};

	RoutingChangePath.prototype.notAllowUTurn = function()
	{
		return this.viewModel.drawTool._uTurnPolicy != "allow-backtrack";
	};

	RoutingChangePath.prototype._solve = function(stops)
	{
		var self = this;
		var tripStopSequence = self.tripStop.Sequence;
		var currentStop = self.trip.TripStops[self.tripStop.Sequence - 1];
		var nextStop = self.trip.TripStops[self.tripStop.Sequence];
		var startStop = stops.features[0];
		var endStop = stops.features[stops.features.length - 1];
		var naTool = self.viewModel.drawTool.NAtool;

		startStop.attributes = $.extend(startStop.attributes, currentStop);
		endStop.attributes = $.extend(endStop.attributes, nextStop);

		var vertexes = [null, null];
		// add additional stops to insure the path connect to the prev and next stop correctly
		if (tripStopSequence > 1)
		{
			var prevStop = self.trip.TripStops[tripStopSequence - 2];
			if (prevStop && nextStop.path && prevStop.path.geometry && prevStop.path.geometry.paths.length > 0 && prevStop.path.geometry.paths[0].length > 0)
			{
				var preVertex = naTool._findVertexToStopOnPath(prevStop.path.geometry, startStop.geometry);
				stops.features.unshift(preVertex);
				vertexes[0] = preVertex;
			}
		}
		if (nextStop && nextStop.path && nextStop.path.geometry && nextStop.path.geometry.paths.length > 0 && nextStop.path.geometry.paths[0].length > 0)
		{
			var afterVertex = naTool._findVertexToStopOnPath(nextStop.path.geometry, endStop.geometry);
			stops.features.push(afterVertex);
			vertexes[1] = afterVertex;
		}

		var stopsFeatureSet = new tf.map.ArcGIS.FeatureSet();
		var stopGraphics = naTool._getStops(stops.features);
		stopGraphics.forEach(function(graphic, i)
		{
			graphic.geometry = graphic.geometry.clone();
			graphic.attributes.Sequence = i + 1;
		});
		stopsFeatureSet.features = stopGraphics;
		var routeParameters = naTool.initRouteParameters();
		return naTool._getRouteParameters(routeParameters, self.trip.id).then(function()
		{
			routeParameters.stops = stopsFeatureSet;
			routeParameters.restrictUTurns = self.viewModel.drawTool._uTurnPolicy;
			return routeParameters;
		}).then(function(routeParameters)
		{
			return naTool._router.solve(routeParameters)
				.then(async function(result)
				{
					if (result)
					{
						await self.crossRailwayWarning(result);
						naTool.recalculateDirectionTimeWithBarriers(result);
						var pathSegments = naTool._createPathSegments(result);
						pathSegments = naTool._updatePathSegments(pathSegments, vertexes);
						var directions = "", length = 0, time = 0, mergedGeometry = new tf.map.ArcGIS.Polyline();
						pathSegments.forEach(ps =>
						{
							directions += ps.direction;
							length += parseFloat(ps.length);
							time += parseFloat(ps.time);
							mergedGeometry.paths[0] = (mergedGeometry.paths[0] || []).concat(ps.geometry.paths.reduce((p, n) => { return p.concat(n) }));
						});
						var attributes = {
							length: length,
							text: directions,
							time: time
						}
						// set new features
						result.routeResults[0].directions.features = [{
							attributes: attributes,
							geometry: mergedGeometry
						}];
						result.routeResults[0].directions.mergedGeometry.paths = mergedGeometry.paths;

						return result;
					}
				}, function()
				{
					tf.promiseBootbox.alert("Unable to find path.");
					return { polygonBarriers: [], routeResults: [{ directions: self._routeDirections }] };
				});
		});
	};

	RoutingChangePath.prototype._featuresToNAStops = function(features)
	{
		var self = this,
			stopCount = features.length,
			stops = features.map(function(feature)
			{
				var geometry = feature.geometry,
					attributes = feature.attributes || {};
				// curbApproach policy:
				// 1) destinations / through points - default setting: 1
				// 2) vertex stop - 4
				// 3) last vertex stop - 0
				attributes.CurbApproach = (attributes.CurbApproach === undefined) ?
					CurbApproachEnum.RIGHT_SIDE :
					(attributes.CurbApproach === 4 && (attributes.Sequence === stopCount && !self.isRoundTrip) ? CurbApproachEnum.EITHER_SIDE : attributes.CurbApproach);
				if (attributes.Address !== undefined)
				{
					delete attributes.Address;
				}

				if (attributes.LocationType !== undefined)
				{
					delete attributes.LocationType;
				}
				return new self._arcgis.Graphic({ geometry: geometry, attributes: attributes });
			});
		return stops;
	};

	RoutingChangePath.prototype._getStopExtents = function()
	{
		var self = this;
		return self.points.map(function(c)
		{
			return TF.Helper.MapHelper.getPointExtent(self._map, c.geometry);
		});
	};

	RoutingChangePath.prototype._addTripFeatureVertex = function(routingDirections)
	{
		var self = this;
		TF.RoutingMap.Directions.Tool.prototype._addTripFeatureVertex.call(this, routingDirections);
		self._removeTripStopVertex();
	};

	RoutingChangePath.prototype._addTripFeatureVertexWithTripGeometry = function(geometry)
	{
		var self = this;
		TF.RoutingMap.Directions.Tool.prototype._addTripFeatureVertexWithTripGeometry.call(this, geometry);
		self._removeTripStopVertex();
	};

	RoutingChangePath.prototype._removeTripStopVertex = function()
	{
		var self = this;
		var graphics = self._tripVertexLayer.graphics.items.slice();
		var endPointExtents = self._getStopExtents();

		for (var i = 0; i < graphics.length; i++)
		{
			if (endPointExtents[0].intersects(graphics[i].geometry) || endPointExtents[1].intersects(graphics[i].geometry))
			{
				self._tripVertexLayer.remove(graphics[i]);
			}
		}
	};

	RoutingChangePath.prototype._enableEdgeSnapping = function(movingPoint)
	{
		var self = this,
			polyline = self._draggingRouteGeometry,
			buffer = self._getCursorBuffer(movingPoint),
			isIntersects = null,
			endPointExtents = self._getStopExtents();
		if (polyline && buffer)
		{
			isIntersects = self._arcgis.geometryEngine.intersects(polyline, buffer)
				&& !endPointExtents[0].intersects(buffer)
				&& !endPointExtents[1].intersects(buffer);
			if (isIntersects)
			{
				TF.Helper.MapHelper.setMapCursor(self._map, "pointer");
				self.ghostPoint = self._getNearestPoint(movingPoint, polyline);
				if (self.ghostPoint)
				{
					self._showGhostGraphic(self.ghostPoint);
					self._$draggingTooltipHtml.text("Drag to change route");
					self._$draggingTooltipHtml.show();
				}
			} else
			{
				if (!self._onDragging)
				{
					TF.Helper.MapHelper.setMapCursor(self._map, "default");
					self._$draggingTooltipHtml.hide();
					self._draggingGhostLayer.removeAll();
				}
			}
		}
	};

	RoutingChangePath.prototype.unbindEvent = function()
	{
		var self = this;
		if (self._draggingGhostLayerMouseDownEvent)
		{
			self._draggingGhostLayerMouseDownEvent.remove();
			self._draggingGhostLayerMouseDownEvent = null;
		}

		if (self._draggingGhostLayerMouseUpEvent)
		{
			self._draggingGhostLayerMouseUpEvent.remove();
			self._draggingGhostLayerMouseUpEvent = null;
		}

		if (self._draggingMapMouseMoveEvent)
		{
			self._draggingMapMouseMoveEvent.remove();
			self._draggingMapMouseMoveEvent = null;
		}

		if (self._draggingMapMouseDragEvent)
		{
			self._draggingMapMouseDragEvent.remove();
			self._draggingMapMouseDragEvent = null;
		}

		if (self._draggingMapClickEvent)
		{
			self._draggingMapClickEvent.remove();
			self._draggingMapClickEvent = null;
		}

		tf.documentEvent.unbind("keydown.changePath", self.routeState);
		self._unbindDraggingEvents();
	};

	RoutingChangePath.prototype._getStopAddress = function()
	{
		return Promise.resolve("");
	};

	RoutingChangePath.prototype.dispose = function()
	{
		this.clearAll();
	};
})();

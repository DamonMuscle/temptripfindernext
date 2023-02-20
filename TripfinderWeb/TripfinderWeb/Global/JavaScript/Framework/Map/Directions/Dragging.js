(function()
{
	Tool = TF.RoutingMap.Directions.Tool;

	Tool.prototype._initDragging = function(routeGeometry, options)
	{
		var self = this;
		self._initDraggingParam(routeGeometry, options);
		self._initDraggingTooltips();
		self._addDraggingLayers();
		self._bindDraggingEvents();
		self._bindDraggingGhostLayerEvents();
	};

	var ROUTE_FEATURES = {
		"DESTINATION": 1,
		"THROUGH_POINT": 2,
		"VERTEX": 3,
		"GHOST_POINT": 4,
		"GHOST_STOP": 5
	};
	var MOUSE_STATUS = {
		"UP": 0,
		"DOWN": 1
	};

	Tool.prototype._initDraggingParam = function(routeGeometry, options)
	{
		var self = this,
			defaultOptions = {
				"pointSnapping": true,
				"vertexSnapping": self.isMapDetailsChecked,
				"edgeSnapping": self.isChangeRouteChecked,
				"snappingPixel": 10,
				"ghostLayerId": "directions_dragging_ghostLayer",
				"directionArrowLayerId": "directions_dragging_arrowLayer",
				"directionTripVertexLayerId": "directions_tripVertexLayer"
			};

		self._options = $.extend({}, defaultOptions, options);
		self._draggingElement = null;
		self._onDragging = false;
		if (routeGeometry)
		{
			self._draggingRouteGeometry = self._geographicToWebMercator(routeGeometry);
		}
		self._enableSnapping = true;
		self._snappingPixel = self._options.snappingPixel;
		self._snappingTolerance = self._getSnappingTolerance(self._snappingPixel);
		self._onPointSnapping = false;
		self._onVertexSnapping = false;
		self._draggingGhostGraphic = null;
		self._draggingStopGraphic = null;
		self._draggingStopPosition = null;

		self._isDraggingMouseDown = false;
		self._dragMouseDoubleClickMillisec = 200;
		self._leftDraggingMouseDownTimeout = null;
		self._draggingRoutingTimeoutId = null;
		self._draggingRoutingMillisec = 500;
		self._$draggingTooltipHtml && self._$draggingTooltipHtml.remove();
		self._$draggingTooltipHtml = null;
		self._segmentGraphics = [];
		self._isHighlightSegment = false;
	};

	Tool.prototype._disposeDragging = function()
	{
		var self = this;
		self._options = null;
		self._draggingElement = null;
		self._onDragging = null;
		self._draggingRouteGeometry = null;
		self._enableSnapping = null;
		self._snappingPixel = null;
		self._snappingTolerance = null;
		self._onPointSnapping = null;
		self._onVertexSnapping = null;
		self._draggingGhostGraphic = null;
		self._draggingStopGraphic = null;
		self._draggingStopPosition = null;

		self._isDraggingMouseDown = null;
		self._dragMouseDoubleClickMillisec = null;
		self._leftDraggingMouseDownTimeout = null;
		self._draggingRoutingTimeoutId = null;
		self._draggingRoutingMillisec = null;
		self._segmentGraphics = null;
		self._isHighlightSegment = null;

		self._disposeDraggingTooltips();
		self._removeDraggingLayers();
		self._unbindDraggingEvents();
		self._unbindDraggingGhostLayerEvents();
	};

	Tool.prototype._addDraggingLayers = function()
	{
		var self = this,
			map = self._map,
			mapLayerIds = TF.Helper.MapHelper.getMapGraphicsLayerIds(map),
			ghostLayerId = self._options.ghostLayerId,
			directionArrowLayerId = self._options.directionArrowLayerId,
			tripVertexIndex = TF.Helper.MapHelper.getMapLayerIndex(map, self._options.directionTripVertexLayerId),
			directionArrowIndex = tripVertexIndex + 1,
			draggingGhostIndex = tripVertexIndex + 2;

		if ($.inArray(directionArrowLayerId, mapLayerIds) === -1)
		{
			self._directionArrowLayer = new self._arcgis.GraphicsLayer({ "id": directionArrowLayerId });
			map.add(self._directionArrowLayer, directionArrowIndex);
		}

		if ($.inArray(ghostLayerId, mapLayerIds) === -1)
		{
			self._draggingGhostLayer = new self._arcgis.GraphicsLayer({ "id": ghostLayerId });
			map.add(self._draggingGhostLayer, draggingGhostIndex);
		}
	};

	Tool.prototype._removeDraggingLayers = function()
	{
		var self = this;
		if (self._draggingGhostLayer)
		{
			self._map.remove(self._draggingGhostLayer);
			self._draggingGhostLayer = null;
		}

		if (self._directionArrowLayer)
		{
			self._map.remove(self._directionArrowLayer);
			self._directionArrowLayer = null;
		}
	};

	Tool.prototype._bindDraggingEvents = function()
	{
		var self = this,
			mapView = self._map.mapView;

		self._unbindDraggingEvents();
		self._draggingMapViewDragEvent = mapView.on('drag', self._draggingMapMouseDragHandler.bind(self));
		self._draggingMapViewPointerMoveEvent = mapView.on('pointer-move', function(event)
		{
			if (self._onDragging || !self._stopLayer.visible)
			{
				return;
			}
			clearTimeout(self.pointermoveTimeout);
			self.pointermoveTimeout = setTimeout(function()
			{
				var stopGraphics, e = null;
				self._map.mapView.allLayerViews.forEach(function(layerView)
				{
					if (layerView.layer == self._stopLayer)
					{
						var point = self._map.mapView.toMap(event);
						stopGraphics = layerView.graphicsView._graphicStore.hitTest(point.x, point.y, 2, layerView.graphicsView.view.state.resolution, layerView.graphicsView.view.state.rotation);
					}
				});

				if (stopGraphics.length > 0)
				{
					self._mouseOverStopGraphic = stopGraphics[0];
					e = {
						graphic: self._mouseOverStopGraphic,
						screenPoint: {
							x: event.x,
							y: event.y
						}
					};

					self._stopLayerMouseOverHandler(e);
				}
				else
				{
					if (self._mouseOverStopGraphic)
					{
						e = { graphic: self._mouseOverStopGraphic, mousePressed: event.buttons > 0 };
						self._stopLayerMouseOutHandler(e);
						self._mouseOverStopGraphic = null;
					}

					self._draggingMapMouseMoveHandler(event);
				}
			}, 20);
		});

		self._draggingMapViewPointerMoveLeaveEvent = mapView.on("pointer-leave", function()
		{
			self._$draggingTooltipHtml && self._$draggingTooltipHtml.hide();
			self.enablePan();
		});

		self._mapViewInteractingHandle = self._arcgis.watchUtils.when(mapView, 'interacting', function()
		{
			self.startScale = mapView.scale;
		});

		self._mapViewStationaryHandle = self._arcgis.watchUtils.when(mapView, 'stationary', function()
		{
			var currentScale = mapView.scale;
			if (currentScale !== self.startScale)
			{
				self._draggingMapZoomEndHandler();
			}

			self.startScale = null;
		});
	};

	Tool.prototype._unbindDraggingEvents = function()
	{
		var self = this;
		if (self._draggingMapViewPointerMoveEvent)
		{
			self._draggingMapViewPointerMoveEvent.remove();
			self._draggingMapViewPointerMoveEvent = null;
		}

		if (self._draggingMapViewPointerLeaveEvent)
		{
			self._draggingMapViewPointerLeaveEvent.remove();
			self._draggingMapViewPointerLeaveEvent = null;
		}

		if (self._draggingMapViewDragEvent)
		{
			self._draggingMapViewDragEvent.remove();
			self._draggingMapViewDragEvent = null;
		}

		if (self._mapViewInteractingHandle)
		{
			self._mapViewInteractingHandle.remove();
			self._mapViewInteractingHandle = null;
		}

		if (self._mapViewStationaryHandle)
		{
			self._mapViewStationaryHandle.remove();
			self._mapViewStationaryHandle = null;
		}
	};

	Tool.prototype._bindDraggingGhostLayerEvents = function()
	{
		var self = this,
			mapView = self._map.mapView;

		self._unbindDraggingGhostLayerEvents();
		self._draggingMapViewPointerDownEvent = mapView.on('pointer-down', function(event)
		{
			self._map.mapView.allLayerViews.forEach(function(layerView)
			{
				if (layerView.layer == self._draggingGhostLayer)
				{
					self._hitTest(event, layerView, self._draggingGhostLayerMouseDownHandler);
				}
			});
		});

		self._draggingMapViewPointerUpEvent = mapView.on('pointer-up', function(event)
		{
			self._map.mapView.allLayerViews.forEach(function(layerView)
			{
				if (layerView.layer == self._draggingGhostLayer)
				{
					self._hitTest(event, layerView, self._draggingGhostLayerMouseUpHandler);
				}
			});
		});
	};

	Tool.prototype._hitTest = function(e, layerView, callback)
	{
		var point = this._map.mapView.toMap(e);
		var graphics = layerView.graphicsView._graphicStore.hitTest(point.x, point.y, 2, layerView.graphicsView.view.state.resolution, layerView.graphicsView.view.state.rotation);
		if (graphics.length > 0)
		{
			e.stopPropagation();
			e.graphic = graphics[0];
			e.pageX = e.x;
			e.pageY = e.y;
			callback.call(this, e);
			return;
		}
	};

	Tool.prototype._unbindDraggingGhostLayerEvents = function()
	{
		var self = this;
		if (self._draggingMapViewPointerDownEvent)
		{
			self._draggingMapViewPointerDownEvent.remove();
			self._draggingMapViewPointerDownEvent = null;
		}

		if (self._draggingMapViewPointerUpEvent)
		{
			self._draggingMapViewPointerUpEvent.remove();
			self._draggingMapViewPointerUpEvent = null;
		}
	};

	Tool.prototype._initDraggingTooltips = function()
	{
		var self = this;
		if (self._$draggingTooltipHtml == null)
		{
			self._$draggingTooltipHtml = $("<div class='direction-dragging-tooltip simpleDirections esriDirectionsRouteTooltip'></div>");
			$("body").append(self._$draggingTooltipHtml);
		}
		else
		{
			self._$draggingTooltipHtml.empty();
		}
	};

	Tool.prototype._disposeDraggingTooltips = function()
	{
		var self = this;
		if (self._$draggingTooltipHtml)
		{
			self._$draggingTooltipHtml.remove();
			self._$draggingTooltipHtml = null;
		}
	};

	Tool.prototype.startDraggingMode = function(routeGeometry)
	{
		this._initDragging(routeGeometry);
	};

	Tool.prototype.stopDraggingMode = function()
	{
		var self = this;
		self._disposeDragging();
	};

	Tool.prototype._draggingMapZoomEndHandler = function(e)
	{
		var self = this;
		self._snappingTolerance = self._getSnappingTolerance(self._snappingPixel);
		self._redrawHighlightSegment();
	};

	Tool.prototype._redrawHighlightSegment = function()
	{
		var self = this;
		if (self._highlightSegmentIndex)
		{
			self._unhighlightSegment();
			self._highlightSegment(self._highlightSegmentIndex);
		}
	};

	Tool.prototype._getSnappingTolerance = function(pixel)
	{
		var self = this,
			centerMapPoint = self._map.mapView.center;
		return self._calculateXDistance(centerMapPoint, pixel);
	};

	Tool.prototype._calculateXDistance = function(mapPoint, px)
	{
		var self = this,
			p1 = self._map.mapView.toScreen(mapPoint),
			p2MapPoint = self._map.mapView.toMap({
				x: p1.x + px,
				y: p1.y
			});

		return Math.sqrt(Math.pow((mapPoint.x - p2MapPoint.x), 2) + Math.pow((mapPoint.y - p2MapPoint.y), 2));
	};

	/**
	 * Map mouse-move event handler. Fires any time the mouse pointer moves over the map region.
	 * @param  {MouseEvent} e A standard DOM MouseEvent with additional properties mapPoint and screenPoint.
	 * @returns {void}
	 */
	Tool.prototype._draggingMapMouseMoveHandler = function(e)
	{
		var self = this;
		var screenPoint = { x: e.x, y: e.y };
		self._setTooltipPosition(e);
		self._startSnapping(self._map.mapView.toMap(screenPoint));
	};

	Tool.prototype._startSnapping = function(movingPoint)
	{
		var self = this;
		if (self._enableSnapping)
		{
			if (self.isMapDetailsChecked
				&& !self._onPointSnapping)
			{
				self._onVertexSnapping = false;
				self._enableVertexSnapping(movingPoint);
			}

			if (self.isChangeRouteChecked
				&& !self._onPointSnapping
				&& !self._onVertexSnapping)
			{
				self._enableEdgeSnapping(movingPoint);
			}
		}
	};

	Tool.prototype.disablePan = function()
	{
		this.panDisabled = true;
	};

	Tool.prototype.enablePan = function()
	{
		this.panDisabled = false;
	};

	Tool.prototype._enableEdgeSnapping = function(movingPoint)
	{
		var self = this,
			polyline = self._draggingRouteGeometry,
			buffer = self._getCursorBuffer(movingPoint),
			isIntersects = null;
		if (polyline && buffer)
		{
			isIntersects = self._arcgis.geometryEngine.intersects(polyline, buffer);
			if (isIntersects)
			{
				TF.Helper.MapHelper.setMapCursor(self._map, "pointer");
				self.ghostPoint = self._getNearestPoint(movingPoint, polyline);
				if (self.ghostPoint && self._draggingGhostLayer.visible)
				{
					self._showGhostGraphic(self.ghostPoint);
					self._$draggingTooltipHtml.text("Drag to change route");
					self._$draggingTooltipHtml.show();
					self.disablePan();
				}
			}
			else
			{
				if (!self._onDragging)
				{
					TF.Helper.MapHelper.setMapCursor(self._map, "default");
					TF.Helper.MapHelper.enablePan(self._map);
					self._$draggingTooltipHtml.hide();
					if (self._draggingGhostLayer.graphics.length > 0)
					{
						self._draggingGhostLayer.removeAll();
					}
					self.enablePan();
				}
			}
		}
	};

	Tool.prototype._getCursorBuffer = function(mapPoint)
	{
		var self = this,
			geometryEngine = self._arcgis.geometryEngine,
			distance = self._snappingTolerance,
			buffer = null;
		if (distance > 0)
		{
			buffer = geometryEngine.buffer(mapPoint, distance, "meters", true);
		}
		return buffer;
	};

	Tool.prototype._enableVertexSnapping = function(movingPoint)
	{
		var self = this,
			distance = self._snappingTolerance,
			vertices = self._tripVertexLayer.graphics.items,
			verticesCount = vertices.length,
			vertexGraphic, geometry, multiPoints, buffer, isIntersects, intersectVertex = null;
		if (verticesCount > 0)
		{
			multiPoints = new self._arcgis.Multipoint({
				spatialReference: self._webMercator
			});
			for (var i = verticesCount - 1; i >= 0; --i)
			{
				geometry = self._geographicToWebMercator(vertices[i].geometry);
				multiPoints.addPoint(geometry);
			}
			buffer = self._arcgis.geometryEngine.buffer(multiPoints, distance, "meters", true);

			if (buffer)
			{
				isIntersects = self._arcgis.geometryEngine.intersects(movingPoint, buffer);
				if (isIntersects)
				{
					TF.Helper.MapHelper.setMapCursor(self._map, "pointer");
					self._onVertexSnapping = true;

					intersectVertex = self._getNearestPoint(movingPoint, multiPoints);
					vertexGraphic = self._getVertexGraphic(intersectVertex);
					self._showGhostGraphic(intersectVertex);

					if (self.isDirectionDetailsRequired)
					{
						self._showVertexTooltip(vertexGraphic);
						self._highlightSegmentIndex = vertexGraphic.attributes.featureIndex;
						self._highlightSegment(self._highlightSegmentIndex);
					}
				}
				else
				{
					if (self.isDirectionDetailsRequired)
					{
						self._unhighlightSegment();
						self._highlightSegmentIndex = null;
					}
					TF.Helper.MapHelper.setMapCursor(self._map, "default");
					TF.Helper.MapHelper.enablePan(self._map);
					self._$draggingTooltipHtml.hide();
				}
			}
		}
	};

	Tool.prototype._showGhostGraphic = function(ghostPoint)
	{
		if (!this._draggingGhostLayer)
		{
			return;
		}
		var self = this,
			graphics = self._draggingGhostLayer.graphics.toArray(),
			count = graphics.length;

		if (count === 0)
		{
			self._draggingGhostGraphic = new self._arcgis.Graphic(ghostPoint, self._ghostSymbol());
			self._draggingGhostLayer.add(self._draggingGhostGraphic);
		}
		else if (count === 1)
		{
			graphics[0].geometry = ghostPoint;
			self._draggingGhostGraphic = graphics[0];
		}
		else
		{
			self._draggingGhostLayer.removeAll();
			self._draggingGhostGraphic = new self._arcgis.Graphic(ghostPoint, self._ghostSymbol());
			self._draggingGhostLayer.add(self._draggingGhostGraphic);
		}
	};

	Tool.prototype._getVertexGraphic = function(vertexGeometry)
	{
		var self = this,
			vertices = self._tripVertexLayer.graphics.items,
			geometry, graphic = null;
		for (var i = vertices.length - 1; i >= 0; --i)
		{
			graphic = vertices[i];
			geometry = graphic.geometry;
			if (Math.abs(geometry.x - vertexGeometry.x) < 0.0001 && Math.abs(geometry.y - vertexGeometry.y) < 0.0001)
			{
				break;
			}
			graphic = null;
		}
		return graphic;
	};

	Tool.prototype._getVertexGraphicByIndex = function(index)
	{
		var self = this,
			vertices = self._tripVertexLayer.graphics.items,
			graphic = null;
		for (var i = vertices.length - 1; i >= 0; --i)
		{
			graphic = vertices[i];
			if (graphic.attributes.featureIndex == index)
			{
				break;
			}
			if (index == 0 && graphic.attributes.featureIndex == 1)
			{
				break;
			}
			graphic = null;
		}
		return graphic;
	};

	Tool.prototype._showVertexTooltip = function(vertexGraphic)
	{
		var self = this,
			attributes, $tooltip = null;

		if (vertexGraphic)
		{
			attributes = vertexGraphic.attributes;

			$tooltip = self._getDirectionHtml(attributes);
		}
		else
		{
			$tooltip = $("<div></div>");
		}
		self._$draggingTooltipHtml.empty();
		self._$draggingTooltipHtml.append($tooltip);
		self._$draggingTooltipHtml.show();
	};

	Tool.prototype._getDirectionHtml = function(attributes)
	{
		var self = this,
			$table = $("<table class='esriRoutesTooltip'></table>"),
			$tbody = $("<tbody></tbody>"),
			$tr = $("<tr class='esriRoute'></tr>"),
			$tdIcon = $("<td class='esriRouteIconColumn'></td>"),
			$iconDiv = $("<div class='esriRouteIcon'></div>"),
			$tdText = $("<td class='esriRouteTextColumn'></td>"),
			$routeInfoDiv = $("<div class='esriRouteInfo'></div>"),
			$routeTextDiv = $("<div class='esriRouteText'></div>"),
			$routeLengthDiv = $("<div class='esriRouteLength'></div>"),
			distanceValue = tf.measurementUnitConverter.convert({
				value: attributes.distance,
				originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
				targetUnit: tf.measurementUnitConverter.getCurrentUnitOfMeasure()
			}),
			distance = distanceValue > 0.1
				? distanceValue.toFixed(1)
				: Math.floor(distanceValue * tf.measurementUnitConverter.getRatio()),
			distanceUnit = distanceValue > 0.1 ? tf.measurementUnitConverter.getShortUnits() : tf.measurementUnitConverter.getRulerUnits(),
			time = attributes.time > 1 ? attributes.time.toFixed(1) : (attributes.time * 60).toFixed(0),
			timeUnit = attributes.time > 1 ? "min" : "sec",
			featureIndex = attributes.featureIndex,
			text = attributes.text,
			maneuverType = attributes.maneuverType,
			sequence = null,
			stopSequence = null;

		$tr.addClass(maneuverType);
		if (maneuverType === "esriDMTStop")
		{
			sequence = self._getLastStop().attributes.Sequence;
			stopSequence = sequence - self._wayPoints.filter(function(item) { return item.attributes.Sequence < sequence; }).length;
			$tr.addClass("esriDMTStopDestination");
			$iconDiv.text(stopSequence);
		}

		$tdIcon.append($iconDiv);

		$routeTextDiv.append("<strong>" + featureIndex + ". </strong>" + text);

		if (distance > 0 || time > 0)
		{
			$routeLengthDiv.text(`${distance} ${distanceUnit} . ${time} ${timeUnit}`);
		}

		$routeInfoDiv.append($routeTextDiv).append($routeLengthDiv);
		$tdText.append($routeInfoDiv);

		$tr.append($tdIcon).append($tdText);
		$tbody.append($tr);
		$table.append($tbody);

		return $table;
	};

	Tool.prototype._setTooltipPosition = function(e)
	{
		var self = this,
			mapPosition = self._map.mapView.position,
			tooltip = self._$draggingTooltipHtml;
		if (tooltip)
		{
			tooltip.css({
				"top": e.y + mapPosition[1],
				"left": e.x + mapPosition[0]
			});
		}
	};

	Tool.prototype._draggingMapMouseDragHandler = function(e)
	{
		var self = this;
		if (self.panDisabled || self._isDraggingMouseDown == MOUSE_STATUS.DOWN)
		{
			e.stopPropagation();
		}
		if (self._onDragging)
		{
			var mapPoint = self._map.mapView.toMap({ x: e.x, y: e.y }),
				stops = self.getStopsClone(),
				features = null,
				sequence = self._draggingStopSequence;
			e.stopPropagation();
			self._stopDynamicRouting();

			switch (self._draggingElement)
			{
				case ROUTE_FEATURES.DESTINATION:
					self._showDraggingDestination(mapPoint, sequence);
					self._showDraggingDestinationLabel(mapPoint, sequence);
					features = self._updateStop(mapPoint, sequence, stops);
					break;
				case ROUTE_FEATURES.THROUGH_POINT:
					self._showDraggingThroughPoint(mapPoint, sequence);
					features = self._updateStop(mapPoint, sequence, stops);
					break;
				case ROUTE_FEATURES.VERTEX:
				case ROUTE_FEATURES.GHOST_POINT:
					self._unhighlightSegment();
					self._highlightSegmentIndex = null;
					self._showGhostGraphic(mapPoint);
					features = self._appendGhostStop(mapPoint, sequence, stops);
					break;
				case ROUTE_FEATURES.GHOST_STOP:
					self._showDraggingGhostStop(mapPoint, sequence);
					features = self._updateStop(mapPoint, sequence, stops);
					break;
				default:
					break;
			}

			// if (features && features.length >= 2)
			// {
			// 	self._draggingRoutingTimeoutId = window.setTimeout(function()
			// 	{
			// 		self._tripVertexLayer.removeAll();
			// 		self._startDynamicRouting(features);
			// 	}, self._draggingRoutingMillisec);
			// }
		}
	};

	Tool.prototype._showDraggingGhostStop = function(mapPoint, sequence)
	{
		var self = this,
			graphics = self._wayPoints.filter(function(item)
			{
				return item.attributes.Sequence === sequence;
			});
		if (graphics && graphics.length === 1)
		{
			self._draggingStopGraphic = graphics[0];
			self._draggingStopGraphic.geometry = mapPoint;
		}
	};

	Tool.prototype._appendGhostStop = function(mapPoint, sequence, stops)
	{
		var self = this,
			attributes = {
				"CurbApproach": self._getCurbApproach(),
				"LocationType": self.LocationTypeEnum.WAY_POINT,
				"Name": "Ghost",
				"Sequence": sequence,
				'StopType': self.StopTypeEnum.GHOST_STOP
			},
			graphic = new self._arcgis.Graphic(mapPoint, null, attributes),
			cloneStops = self._clone(stops),
			stopCount = cloneStops.length;

		for (var i = stopCount - 1; i >= 0; --i)
		{
			if (cloneStops[i].attributes.Sequence >= sequence)
			{
				cloneStops[i].attributes.Sequence += 1;
				cloneStops[i + 1] = cloneStops[i];
			}
			else
			{
				cloneStops[i + 1] = graphic;
				break;
			}
		}
		return cloneStops;
	};

	Tool.prototype._startDynamicRouting = function(features)
	{
		var self = this,
			clone = self._clone(features),
			stops = new self._arcgis.FeatureSet();
		stops.features = self._featuresToNAStops(clone);

		return self._getSelectedBarriers().then(function(barriers)
		{
			return barriers;
		}).then(function(barriers)
		{
			return self._solve(stops, null, null, barriers, false).then(function(results)
			{
				if (!results || self.isStart == false)
				{
					return;
				}
				self._tripLayer.removeAll();
				var result = results.routeResults[0],
					geometry = result.directions.mergedGeometry;
				// return self.crossRailwayWarning(results).then(function()
				// {
				if (self._stops.length == 0)
				{
					return;
				}
				self.racalculateDirectionTimeWithBarriers(results, barriers);
				self.addArrow(result.directions?.mergedGeometry);
				self._prevRouteResult = results;
				self._routeDirections = result.directions;
				if (self._noReachedRoute)
				{
					self._noReachedRoute = false;
					self._refreshStopSymbol();
					self._refreshStopSequenceSymbol();
				}

				if (geometry && geometry.paths.length > 0)
				{
					self._routeGeometry = geometry;
					self._addTrip(geometry);
					self._updateTripVertices(geometry);
					self._addTripFeatureVertex(self._routeDirections);
					self._calculateStopPosition(geometry);
					self._updateRouteSnapBuffer(geometry);
				}
				else
				{
					self._routeGeometry = null;
					self._routeDirections = null;
					self._tripVertices.length = 0;
					self._tripVertexLayer.removeAll();
				}
				self.notifyDirectionChanged(result);
				return result;
			});
		}, function(error)
		{
			self._routeGeometry = null;
			self._routeDirections = null;
			self._draggingRouteGeometry = null;
			self._noReachedRoute = true;
			self._setStopsNotReached();
			self._setStopSequenceNotReached();
			self._tripLayer.removeAll();
			self._arrowLayer && self._arrowLayer.removeAll();
			self._tripVertexLayer.removeAll();
			self._clearWayPoints();
			self.notifyDirectionChanged();
			return Promise.reject(error);
		});
		//})
	};

	Tool.prototype._clone = function(features)
	{
		var self = this,
			clone = [],
			attributes, geometry, graphic = null;

		for (var i = 0, length = features.length; i < length; i++)
		{
			attributes = $.extend(true, {}, features[i].attributes);
			geometry = features[i].geometry.clone();
			graphic = new self._arcgis.Graphic(geometry, null, attributes);
			clone.push(graphic);
		}
		return clone;
	};

	Tool.prototype._stopDynamicRouting = function()
	{
		var self = this;
		if (self._draggingRoutingTimeoutId)
		{
			window.clearTimeout(self._draggingRoutingTimeoutId);
			self._draggingRoutingTimeoutId = null;
		}
	};

	Tool.prototype._updateRouteGeometry = function(geometry)
	{
		var self = this,
			graphic = null;
		self._tripLayer.removeAll();
		graphic = new self._arcgis.Graphic(geometry, self._tripSymbol());
		self._tripLayer.add(graphic);
	};

	Tool.prototype._draggingGhostLayerMouseDownHandler = function(e)
	{
		var self = this;
		if (!self.isChangeRouteChecked) return;

		if (e.button == 0)
		{
			var graphic = e.graphic;
			self._isDraggingMouseDown = MOUSE_STATUS.DOWN;
			if (self._leftDraggingGhostMouseDownTimeout)
			{
				// on double click.
				clearTimeout(self._leftDraggingGhostMouseDownTimeout);
				self._leftDraggingGhostMouseDownTimeout = null;
				return;
			}

			self._leftDraggingGhostMouseDownTimeout = setTimeout(function()
			{
				self._leftDraggingGhostMouseDownTimeout = null;
				if (self._isDraggingMouseDown !== MOUSE_STATUS.UP)
				{
					if (self._isVertexGraphic(graphic))
					{
						self._dragVertexGraphic(graphic);
					}
					else
					{
						self._dragGhostGraphic(graphic);
					}
				}
				else
				{
					// on click
				}
			}, self._dragMouseDoubleClickMillisec, e);
		}
	};

	Tool.prototype._isVertexGraphic = function(graphic)
	{
		var self = this,
			vertexGraphics = self._tripVertexLayer.graphics.items,
			vertexGeometries = vertexGraphics.map(function(item) { return 'x:' + item.geometry.x + ',y:' + item.geometry.y; }),
			geometry = 'x:' + graphic.geometry.x + ',y:' + graphic.geometry.y;
		return $.inArray(geometry, vertexGeometries) !== -1;
	};

	Tool.prototype._draggingGhostLayerMouseUpHandler = function(e)
	{
		if (!this.isChangeRouteChecked) return;

		var self = this,
			stops = self.getStopsClone(),
			ghostPoint, ghostGraphic, routingStops, routingGeometry, routingDirections = null;

		if (e.button === 0)
		{
			self._isDraggingMouseDown = MOUSE_STATUS.UP;
			if (self._onDragging
				&& (self._draggingElement === ROUTE_FEATURES.GHOST_POINT || self._draggingElement === ROUTE_FEATURES.VERTEX))
			{
				self._onDragging = false;
				self._draggingElement = null;

				self._draggingGhostLayer.remove(self._draggingGhostGraphic);
				self._draggingGhostGraphic = null;

				ghostPoint = self._map.mapView.toMap(e);
				routingStops = self._appendGhostStop(ghostPoint, self._draggingStopSequence, stops);
				if (routingStops)
				{
					if (self._dynamicDraggingTimeout)
					{
						clearTimeout(self._dynamicDraggingTimeout);
						self._dynamicDraggingTimeout = null;
					}

					self._dynamicDraggingTimeout = setTimeout(function()
					{
						clearTimeout(self._dynamicDraggingTimeout);
						self._dynamicDraggingTimeout = null;

						if (routingStops === null)
						{
							return;
						}

						self._startDynamicRouting(routingStops).then(function(result)
						{
							if (!result) { return; }
							routingDirections = result.directions;
							routingGeometry = routingDirections.mergedGeometry;

							self._tripLayer.removeAll();

							if (routingGeometry && routingGeometry.paths.length > 0)
							{
								self._routeGeometry = routingGeometry;

								ghostGraphic = self._getGhostStopGraphic(ghostPoint, self._draggingStopSequence, routingGeometry);
								self._addGhostStop(ghostGraphic);
								self._insertGhostStop(ghostGraphic, self._draggingStopSequence);

								self._refreshRoutingResult(routingDirections, routingGeometry);
							}
							else
							{
								self._routeGeometry = null;
								self._tripVertices.length = 0;
							}
							self.notifyStopChanged(result);
							if (self.isDirectionDetailsRequired)
							{
								self.notifyDirectionChanged(result);
							}
						});
					});

				}
			}
		}
	};

	Tool.prototype._dragVertexGraphic = function(graphic)
	{
		var self = this,
			geometry = graphic.geometry;
		if (geometry.type === 'point')
		{
			self._onDragging = true;
			self._draggingElement = ROUTE_FEATURES.VERTEX;
			self._draggingStopPosition = self._getStopPosition(geometry.x, geometry.y);
			self._draggingStopSequence = self._calculateVertexSequence(self._draggingStopPosition);
			self._$draggingTooltipHtml.hide();
			self.enablePan();
		}
	};

	Tool.prototype._dragGhostGraphic = function(graphic)
	{
		var self = this,
			geometry = graphic.geometry;
		if (geometry.type === 'point')
		{
			self._onDragging = true;
			self._draggingElement = ROUTE_FEATURES.GHOST_POINT;
			self._draggingStopPosition = self._getStopPosition(geometry.x, geometry.y);
			self._draggingStopSequence = self._calculateVertexSequence(self._draggingStopPosition);
			self._$draggingTooltipHtml.hide();
			self.enablePan();
		}
	};

	Tool.prototype._getGhostStopGraphic = function(ghostStop, sequence, routingGeometry)
	{
		var self = this,
			geometry = self._getNearestPoint(ghostStop, routingGeometry),
			options = {
				'curbApproach': self._getCurbApproach(),
				'geometry': geometry,
				'sequence': sequence
			};
		ghostStop = new TF.RoutingMap.Directions.DirectionStop.ThroughStop(options);

		return ghostStop.getGraphic();
	};

	Tool.prototype._addGhostStop = function(graphic)
	{
		var self = this;
		self._stopLayer.add(graphic);
	};

	Tool.prototype._insertGhostStop = function(graphic, sequence)
	{
		var self = this,
			destinationsCount = self._destinations.length,
			throughPointsCount = self._throughPoints.length,
			wayPointsCount = self._wayPoints.length,
			i = null;

		// update destinations sequence.
		for (i = destinationsCount - 1; i >= 0; --i)
		{
			if (self._destinations[i].attributes.Sequence >= sequence)
			{
				self._destinations[i].attributes.Sequence += 1;
			}
			else
			{
				break;
			}
		}

		// update through points sequence.
		for (i = throughPointsCount - 1; i >= 0; --i)
		{
			if (self._throughPoints[i].attributes.Sequence >= sequence)
			{
				self._throughPoints[i].attributes.Sequence += 1;
			}
			else
			{
				break;
			}
		}

		self._mergeDestinationAndThroughPoints();

		// insert waypoints.
		for (i = wayPointsCount - 1; i >= 0; --i)
		{
			if (self._wayPoints[i].attributes.Sequence >= sequence)
			{
				self._wayPoints[i].attributes.Sequence += 1;
				self._wayPoints[i + 1] = self._wayPoints[i];
			}
			else
			{
				break;
			}
		}
		self._wayPoints[i + 1] = graphic;

		self._mergeStopsAndWayPoints(self._stops, self._wayPoints);
	};

	Tool.prototype._getNearestPoint = function(thePoint, geometry)
	{
		var self = this,
			point = self._geographicToWebMercator(thePoint),
			nearestObject = self._arcgis.geometryEngine.nearestCoordinate(geometry, point),
			nearestPoint = null;
		if (nearestObject && !nearestObject.isEmpty)
		{
			nearestPoint = nearestObject.coordinate;
		}
		return nearestPoint;
	};

	Tool.prototype._dragDestination = function(graphic)
	{
		var self = this,
			geometry = graphic.geometry;
		if (geometry.type === "point" && ROUTE_FEATURES)
		{
			self._onDragging = true;
			self._draggingElement = ROUTE_FEATURES.DESTINATION;
			self._draggingStopSequence = graphic.attributes.Sequence;
			self._$draggingTooltipHtml && self._$draggingTooltipHtml.hide();
			self.enablePan();
		}
	};

	Tool.prototype._dragThroughPoint = function(graphic)
	{
		var self = this,
			geometry = graphic.geometry;
		if (geometry.type === "point")
		{
			self._onDragging = true;
			self._draggingElement = ROUTE_FEATURES.THROUGH_POINT;
			self._draggingStopSequence = graphic.attributes.Sequence;
			self._$draggingTooltipHtml.hide();
			self.enablePan();
		}
	};

	Tool.prototype._showDraggingDestination = function(mapPoint, sequence)
	{
		var self = this,
			graphics = self._destinations.filter(function(item)
			{
				return item.attributes.Sequence === sequence;
			});

		if (graphics && graphics.length === 1)
		{
			self._draggingStopGraphic = graphics[0];
			self._draggingStopGraphic.geometry = mapPoint;
		}
	};

	Tool.prototype._showDraggingDestinationLabel = function(mapPoint, sequence)
	{
		var self = this,
			wayPointsSequenceLessThanDestinationCount = self._wayPoints.filter(function(item) { return item.attributes.Sequence < sequence; }).length,
			throughPointsSequenceLessThanDestinationCount = self._throughPoints.filter(function(item) { return item.attributes.Sequence < sequence; }).length,
			labelSequence = sequence - wayPointsSequenceLessThanDestinationCount - throughPointsSequenceLessThanDestinationCount,
			graphics = self._getStopLabelGraphic(labelSequence);
		if (graphics && graphics.length === 1)
		{
			graphics[0].geometry = mapPoint;
		}
	};

	Tool.prototype._showDraggingThroughPoint = function(mapPoint, sequence)
	{
		var self = this,
			graphics = self._throughPoints.filter(function(item)
			{
				return item.attributes.Sequence === sequence;
			});
		if (graphics && graphics.length === 1)
		{
			self._draggingStopGraphic = graphics[0];
			self._draggingStopGraphic.geometry = mapPoint;
		}
	};

	Tool.prototype._updateStop = function(mapPoint, sequence, stops, address)
	{
		var self = this;
		if (self._draggingStopGraphic)
		{
			for (var i = stops.length - 1; i >= 0; --i)
			{
				if (stops[i].attributes.Sequence === sequence)
				{
					stops[i] = self._draggingStopGraphic;

					if (address)
					{
						stops[i].attributes.Name = address;
						stops[i].attributes.Address = address;
					}
					break;
				}
			}
		}
		return stops;
	};

	Tool.prototype._stopLayerMouseDownHandler = function(e)
	{
		var self = this,
			graphic, stopType = null;

		if (!self.isChangeRouteChecked)
		{
			return;
		}
		if (e.button === 0)
		{
			self._isDraggingMouseDown = MOUSE_STATUS.DOWN;
			if (self._leftDraggingMouseDownTimeout)
			{
				// on double click.
				window.clearTimeout(self._leftDraggingMouseDownTimeout);
				self._leftDraggingMouseDownTimeout = null;
				return;
			}

			self._leftDraggingMouseDownTimeout = window.setTimeout(function(evt)
			{
				self._leftDraggingMouseDownTimeout = null;
				graphic = evt.graphic;
				stopType = graphic.attributes.StopType;
				if (self._isDraggingMouseDown !== MOUSE_STATUS.UP)
				{
					switch (stopType)
					{
						case self.StopTypeEnum.DESTINATION:
						case self.StopTypeEnum.TERMINAL:
							self._dragDestination(graphic);
							break;
						case self.StopTypeEnum.WAY_STOP:
							self._dragThroughPoint(graphic);
							break;
						case self.StopTypeEnum.GHOST_STOP:
							self._dragGhostStop(graphic);
							break;
						default:
							break;
					}
				}
				else
				{
					// on click
					if (stopType === self.StopTypeEnum.GHOST_STOP)
					{
						self._clickGhostStop(graphic);
					}
				}
			}, self._dragMouseDoubleClickMillisec, e);
		}
	};

	Tool.prototype._stopLayerMouseUpHandler = function(e)
	{
		if (!this.isChangeRouteChecked)
		{
			return;
		}
		var self = this,
			mapPoint = self._map.mapView.toMap(e),
			stops = self.getStopsClone(),
			routingStops, routingGeometry, routingDirections = null;
		if (e.button === 0)
		{
			self._isDraggingMouseDown = MOUSE_STATUS.UP;
			if (self._onDragging)
			{
				self._onDragging = false;

				self._getStopAddress(mapPoint).then(function(address)
				{
					routingStops = self._updateStop(mapPoint, self._draggingStopSequence, stops, address);
					if (routingStops && routingStops.length >= 2)
					{
						self._startDynamicRouting(routingStops).then(function(result)
						{
							if (!result)
							{
								return;
							}
							routingDirections = result.directions;
							routingGeometry = routingDirections.mergedGeometry;

							self._tripLayer.removeAll();
							if (routingGeometry && routingGeometry.paths.length > 0)
							{
								if (self._draggingElement === ROUTE_FEATURES.GHOST_STOP)
								{
									mapPoint = self._getNearestPoint(mapPoint, routingGeometry);
									self._showDraggingGhostStop(mapPoint, self._draggingStopSequence);
								}

								self._updateStop(mapPoint, self._draggingStopSequence, stops, address);
								self._refreshRoutingResult(routingDirections, routingGeometry);
							}
							else
							{
								self._routeGeometry = null;
								self._tripVertices.length = 0;
							}
							self.notifyStopChanged(result);
							self.notifyDirectionChanged(result);
							self._draggingElement = null;
						}).catch(function() { });
					}
					else
					{
						self.notifyStopChanged();
						self.notifyDirectionChanged();
					}
				});
			}
		}
	};

	Tool.prototype._dragGhostStop = function(graphic)
	{
		var self = this,
			geometry = graphic.geometry;
		if (geometry.type === "point")
		{
			self._onDragging = true;
			self._draggingElement = ROUTE_FEATURES.GHOST_STOP;
			self._draggingStopSequence = graphic.attributes.Sequence;
			self._$draggingTooltipHtml.hide();
			self.enablePan();
		}
	};

	Tool.prototype._clickGhostStop = function(graphic)
	{
		var self = this;
		self._$draggingTooltipHtml.hide();
		self.enablePan();
		self._removeGhostStop(graphic);
		self.notifyStopChanged();
		self._calculateTrip().then(function(result)
		{
			self._draggingRouteGeometry = result.directions.mergedGeometry;
		});
	};

	Tool.prototype._removeGhostStop = function(graphic)
	{
		var self = this,
			sequence = graphic.attributes.Sequence,
			destinationsCount = self._destinations.length,
			throughPointsCount = self._throughPoints.length,
			wayPointsCount = self._wayPoints.length,
			i = null;

		self._stopLayer.remove(graphic);

		// update destinations sequence.
		for (i = destinationsCount - 1; i >= 0; --i)
		{
			if (self._destinations[i].attributes.Sequence > sequence)
			{
				self._destinations[i].attributes.Sequence -= 1;
			}
			else
			{
				break;
			}
		}

		// update through points sequence.
		for (i = throughPointsCount - 1; i >= 0; --i)
		{
			if (self._throughPoints[i].attributes.Sequence > sequence)
			{
				self._throughPoints[i].attributes.Sequence -= 1;
			}
			else
			{
				break;
			}
		}

		self._mergeDestinationAndThroughPoints();

		// remove waypoints.
		for (i = 0; i <= wayPointsCount - 1; i++)
		{
			if (self._wayPoints[i].attributes.Sequence > sequence)
			{
				self._wayPoints[i].attributes.Sequence -= 1;
				self._wayPoints[i - 1] = self._wayPoints[i];
			}
		}
		self._wayPoints.pop();

		if (self._wayPoints.length > 0)
		{
			self._mergeStopsAndWayPoints(self._stops, self._wayPoints);
		}
	};

	/**
	 * Insert waypoints into stops order by sequence.
	 * @returns {void}
	 */
	Tool.prototype._mergeStopsAndWayPoints = function()
	{
		var self = this,
			wayPointsCount = self._wayPoints.length,
			wayPointIndex = 0, stopIndex = 0,
			wayPointSequence, stopCount, stopSequence = null;

		for (wayPointIndex = wayPointsCount - 1; wayPointIndex >= 0; --wayPointIndex)
		{
			wayPointSequence = self._wayPoints[wayPointIndex].attributes.Sequence;
			stopCount = self._stops.length;
			for (stopIndex = stopCount - 1; stopIndex >= 0; --stopIndex)
			{
				stopSequence = self._stops[stopIndex].attributes.Sequence;
				if (stopSequence > wayPointSequence)
				{
					self._stops[stopIndex + 1] = self._stops[stopIndex];
				}
				else if (stopSequence === wayPointSequence)
				{
					break;
				}
				else
				{
					self._stops[stopIndex + 1] = self._wayPoints[wayPointIndex];
					break;
				}
			}
		}
	};

	Tool.prototype._stopLayerMouseOverHandler = function(e)
	{
		var self = this,
			graphic = e.graphic,
			sequence = graphic.attributes.Sequence,
			wayPointsSequenceLessThanDestinationCount = self._wayPoints.filter(function(item) { return item.attributes.Sequence < sequence; }).length,
			throughPointsSequenceLessThanDestinationCount = self._throughPoints.filter(function(item) { return item.attributes.Sequence < sequence; }).length,
			labelSequence = sequence - wayPointsSequenceLessThanDestinationCount - throughPointsSequenceLessThanDestinationCount,
			labelGraphic = self._getStopLabelGraphic(labelSequence)[0],
			stopType = graphic.attributes.StopType,
			tooltip = self._$draggingTooltipHtml;

		if (!tooltip)
		{
			return;
		}

		if (stopType === self.StopTypeEnum.GHOST_STOP ||
			stopType === self.StopTypeEnum.WAY_STOP)
		{
			self._mouseOverLocationHandler(stopType);
			// Do not update ghost stop symbol and waypoint symbol.
			return;
		}

		if (self._onDragging || !self.isChangeRouteChecked)
		{
			return;
		}

		// hide sequence symbol
		if (labelGraphic)
		{
			labelGraphic.visible = false;
		}
		self._unhighlightSegment();

		self._setTooltipPosition(e);
		tooltip.text("Drag to change location");
		tooltip.show();
		self.disablePan();

		self._enableSnapping = false;
		TF.Helper.MapHelper.setMapCursor(self._map, "pointer");

		if (self._draggingGhostGraphic)
		{
			self._draggingGhostGraphic.visible = false;
		}

		// Update stop symbol
		graphic.symbol = self._getMovingDirectionStopSymbol(sequence);
	};

	Tool.prototype._mouseOverLocationHandler = function(stopType)
	{
		var self = this;
		TF.Helper.MapHelper.setMapCursor(self._map, "pointer");

		if (self._draggingGhostGraphic)
		{
			self._draggingGhostLayer.remove(self._draggingGhostGraphic);
		}

		var tooltip = stopType === self.StopTypeEnum.GHOST_STOP ? "Drag to change location or click to remove" : "Drag to change location";
		self._$draggingTooltipHtml.text(tooltip);
		self._$draggingTooltipHtml.show();
		self.disablePan();
	};

	Tool.prototype._stopLayerMouseOutHandler = function(e)
	{
		var self = this,
			graphic = e.graphic,
			sequence = graphic.attributes.Sequence,
			wayPointsSequenceLessThanDestinationCount = self._wayPoints.filter(function(item) { return item.attributes.Sequence < sequence; }).length,
			throughPointsSequenceLessThanDestinationCount = self._throughPoints.filter(function(item) { return item.attributes.Sequence < sequence; }).length,
			labelSequence = sequence - wayPointsSequenceLessThanDestinationCount - throughPointsSequenceLessThanDestinationCount,
			labelGraphic = self._getStopLabelGraphic(labelSequence)[0],
			stopType = graphic.attributes.StopType,
			tooltip = self._$draggingTooltipHtml;

		if (!tooltip)
		{
			return;
		}

		if (self._onDragging || !self.isChangeRouteChecked)
		{
			return;
		}

		if (!e.mousePressed)
		{
			self.enablePan();
		}

		tooltip.hide();
		self._enableSnapping = true;
		TF.Helper.MapHelper.enablePan(self._map);
		TF.Helper.MapHelper.setMapCursor(self._map, "default");

		if (stopType === self.StopTypeEnum.GHOST_STOP ||
			stopType === self.StopTypeEnum.WAY_STOP)
		{
			// Do not update ghost stop symbol and waypoint symbol.
			return;
		}

		// show sequence symbol
		if (labelGraphic)
		{
			labelGraphic.visible = true;
		}

		if (self._draggingGhostGraphic)
		{
			self._draggingGhostGraphic.visible = true;
		}

		// Remove move symbol.
		graphic.symbol = self._getDirectionStopSymbol(sequence);
	};

	Tool.prototype._getStopLabelGraphic = function(labelSequence)
	{
		var self = this,
			graphics = self._stopSequenceLayer.graphics.items;
		return graphics.filter(function(item)
		{
			return item.attributes.Label === labelSequence;
		});
	};

	Tool.prototype._refreshRoutingResult = function(routingDirections, routingGeometry)
	{
		var self = this;
		self._addTrip(routingGeometry);
		self._updateTripVertices(routingGeometry);
		if (self.isDirectionDetailsRequired)
		{
			self._addTripFeatureVertex(routingDirections);
		}
		else
		{
			self._addTripFeatureVertexWithTripGeometry(routingGeometry);
		}
		self._calculateStopPosition(routingGeometry);

		self._draggingRouteGeometry = routingGeometry;
	};

	/**
	 * rewrite _arcgis.Directions.prototype.highlightSegment function
	 * @param  {number} vertexIndex the vertex index.
	 * @param  {object} b undefined
	 */
	Tool.prototype._highlightSegment = function(vertexIndex, b)
	{
		var self = this,
			a = vertexIndex,
			b = null,
			c = self._arcgis.dojo.lang,
			fa = self._arcgis.Polyline,
			V = self._arcgis.ScreenPoint,
			w = self._arcgis.dojo.color,
			z = self._arcgis.Graphic;

		self._focusedDirectionsItem = false;
		self.directions = self._routeDirections;
		self.map = self._map;
		self.routeSymbol = {
			type: 'simple-line',
			color: [20, 89, 127, .75],
			width: 10,
			cap: 'round',
			join: 'round'
		};
		self.segmentSymbol = {
			type: 'simple-line',
			color: [255, 255, 255, 1],
			width: 6,
			cap: 'round',
			join: 'round'
		};

		if (!(self._focusedDirectionsItem && !b || a >= self.directions.features.length))
		{
			a = a || 0;
			var d = c.hitch(self, function(a)
			{
				var b = self.map.mapView.toMap({
					x: 0,
					y: 0
				});
				return self.map.mapView.toScreen(b.offset(a, 0)).x;
			})
				, e = c.hitch(self, function(a)
				{
					for (var b = 0, c = 0; c < a.length; c++)
						for (var e = 1; e < a[c].length; e++)
							var f = a[c][e - 1]
								, H = a[c][e]
								, b = b + d(Math.sqrt((f[0] - H[0]) * (f[0] - H[0]) + (f[1] - H[1]) * (f[1] - H[1])));
					return b;
				})
				, f = c.hitch(self, function(a)
				{
					var b = self.map.mapView.toMap({
						x: 0,
						y: 0
					});
					return self.map.mapView.toMap({
						x: a,
						y: 0
					}).x - b.x;
				})
				, H = function(a, b, c)
				{
					b = Math.max(1, b);
					for (var e = c ? a[0].length - 1 : 0, f = 0, H, g, h, k = [[a[0][c ? e : 0]]]; c && 0 < e || !c && e < a[0].length - 1;)
					{
						g = a[0][c ? e - 1 : e];
						h = a[0][c ? e : e + 1];
						if (H = d(Math.sqrt((g[0] - h[0]) * (g[0] - h[0]) + (g[1] - h[1]) * (g[1] - h[1]))))
							if (f + H < b)
								c ? k[0].splice(0, 0, g) : k[0].push(h),
									f += H;
							else
							{
								b = (b - f) / H;
								c ? k[0].splice(0, 0, [h[0] - (h[0] - g[0]) * b, h[1] - (h[1] - g[1]) * b]) : k[0].push([g[0] + (h[0] - g[0]) * b, g[1] + (h[1] - g[1]) * b]);
								break;
							}
						e += c ? -1 : 1;
					}
					return 0 < f + H ? k : a;
				}
				, g = self.directions.features[a]
				, k = new fa(g.geometry)
				, h = 40 * Math.PI / 180;
			c.mixin(g.attributes, {
				_index: a
			});
			if (a)
			{
				var Q = H(self.directions.features[a - 1].geometry.paths, 25, !0)
					, l = "esriDMTStop" !== g.attributes.maneuverType ? H(k.paths, 25, !1) : Q
					, Q = l !== Q ? [Q[0].concat(l[0])] : l
					, m = (new fa(l)).extent;
				if (1 < l[0].length && 15 <= d(Math.max(m.width, m.height)))
				{
					for (var H = 15 * Math.cos(h / 2), e = 15 * Math.sin(h / 2), n = l[0].length - 2, q, h = l[0][n + 1], m = 0; 0 <= n && !m;)
						q = l[0][n],
							m = d(Math.sqrt((q[0] - h[0]) * (q[0] - h[0]) + (q[1] - h[1]) * (q[1] - h[1]))),
							n--;
					22 > m && (l = m + (22 - m) / 3,
						n = m + 2 * (22 - m) / 3,
						n = [q[0] + n / m * (h[0] - q[0]), q[1] + n / m * (h[1] - q[1])],
						q = [h[0] - l / m * (h[0] - q[0]), h[1] - l / m * (h[1] - q[1])],
						h = n,
						m = 22);
					H /= m;
					l = [h[0] - (h[0] - q[0]) * H, h[1] - (h[1] - q[1]) * H];
					q[1] !== h[1] ? (H = (h[0] - q[0]) / (h[1] - q[1]),
						q = f(e / Math.sqrt(1 + H * H)),
						f = H * q) : (q = 0,
							f = f(e));
					Infinity === Math.abs(q) || Infinity === Math.abs(f) || isNaN(q) || isNaN(f) || (Q[0].push(h),
						Q[0].push([l[0] - q, l[1] + f]),
						Q[0].push([l[0] + q, l[1] - f]),
						Q[0].push(h));
				}
				else
				{
					Q = H(Q, 2 * e(l), !0);
				}
				k.paths = Q;
			}
			self._unhighlightSegment(self._segmentGraphics && self._segmentGraphics.length);
			f = c.clone(self.routeSymbol);
			f.width = self.segmentSymbol.width;
			f.color = new w([parseInt(.9 * self.segmentSymbol.color[0]), parseInt(.9 * self.segmentSymbol.color[1]), parseInt(.9 * self.segmentSymbol.color[2])]);

			self._segmentGraphics = [new z(g.geometry, f, g.attributes, null), new z(k, self.routeSymbol, g.attributes, null), new z(k, self.segmentSymbol, g.attributes, null)];
			true && (self._directionArrowLayer.add(self._segmentGraphics[0]),
				self._directionArrowLayer.add(self._segmentGraphics[1]),
				self._directionArrowLayer.add(self._segmentGraphics[2]));
			g = c.hitch(self, function(a)
			{
				if (0 < a && a < self.directions.features.length)
				{
					a = self.directions.features[a]._associatedFeaturesWithWaypoints;
					if (a)
					{
						for (var b = 0; b < a.length; b++)
							a[b]._associatedSnapFeature && a[b]._associatedSnapFeature.getDojoShape() && a[b]._associatedSnapFeature.getDojoShape().moveToFront();
					}
				}
			});
			g(a - 1);
			g(a);
		}
	};

	Tool.prototype._unhighlightSegment = function(a)
	{
		var self = this,
			graphics = self._segmentGraphics;
		if (graphics && graphics.length > 0)
		{
			for (var i = graphics.length - 1; i >= 0; --i)
			{
				self._directionArrowLayer.remove(graphics[i]);
			}
			self._segmentGraphics.length = 0;
		}
	};

	Tool.prototype._getCurbApproach = function()
	{
		return this.uTurnPolicy === TF.RoutingMap.Directions.Enum.UTurnPolicyEnum.ALLOWED ?
			TF.RoutingMap.Directions.Enum.CurbApproachEnum.EITHER_SIDE :
			TF.RoutingMap.Directions.Enum.CurbApproachEnum.NO_U_TURN;
	};
})();
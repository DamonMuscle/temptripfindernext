(function()
{
	Tool = TF.RoutingMap.Directions.Tool;

	/**
	 * Initialize Directions Tool map events variables.
	 * @returns {void}
	 */
	Tool.prototype._initEvents = function()
	{
		var self = this;
		self._isMouseDown = false;
		self._mouseDoubleClickMillisec = 300;
		self._leftMouseDownTimeout = null;

		self._isStopMouseDown = false;
		self._stopMouseDownTimeout = null;

		self._isStopSequenceMouseDown = false;
		self._stopSequenceMouseDownTimeout = null;

		self._isTripVertexMouseDown = false;
		self._tripVertexMouseDownTimeout = null;

		self._stopPopupWidth = 110;  // pixels
		self._stopPopupHeight = 50;

		self._pointMouseOverTimeout = null;
		self._pointMouseOutTimeout = null;
		self._pointMouseOverMillisec = 250;
		self._pointMouseOutMillisec = 1000;
		self._pointMouseOverStopType = null;
		self._pointMouseOverGraphicGeometry = null;

		self._tooltipShown = { shown: false };
		self._tooltipGenerated = { generated: false };

		self._mapCursorPosition = {
			'North': 'North',
			'NorthEast': 'NorthEast',
			'East': 'East',
			'SouthEast': 'SouthEast',
			'South': 'South',
			'SouthWest': 'SouthWest',
			'West': 'West',
			'NorthWest': 'NorthWest',
			'Center': 'Center'
		};
		self._mapAutoPanTolerance = 20;  // pixels
		self._MapAutoPanScale = 10;
		self._isMapAutoPan = true;  // start Map auto pan
		self._currentScreenPoint = { x: 0, y: 0 }; //log current screenPoint to compare whether its dragging or click
		self._disableClick = false;
		self._stopConnectionLineGraphic = null;
	};

	/**
	 * Release variables.
	 * @returns {void}
	 */
	Tool.prototype._disposeEvents = function()
	{
		var self = this;
		self._isMouseDown = null;
		self._mouseDoubleClickMillisec = null;
		self._leftMouseDownTimeout = null;

		self._isStopMouseDown = null;
		self._stopMouseDownTimeout = null;

		self._isStopSequenceMouseDown = null;
		self._stopSequenceMouseDownTimeout = null;

		self._isTripVertexMouseDown = null;
		self._tripVertexMouseDownTimeout = null;

		self._stopPopupWidth = null;
		self._stopPopupHeight = null;

		self._pointMouseOverTimeout = null;
		self._pointMouseOutTimeout = null;
		self._pointMouseOverMillisec = null;
		self._pointMouseStopMillisec = null;
		self._pointMouseOverStopType = null;
		self._pointMouseOverGraphicGeometry = null;

		if (self._tooltipShown)
		{
			self._tooltipShown.shown = false;
		}

		if (self._tooltipGenerated)
		{
			self._tooltipGenerated.generated = false;
		}

		self._mapCursorPosition = null;
		self._mapAutoPanTolerance = null;
		self._isMapAutoPan = null;
		self._currentScreenPoint = null;
		self._disableClick = false;
		self._stopConnectionLineGraphic = null;
	};

	/**
	 * Create map events in drop destinations / through points mode.
	 * @returns {void}
	 */
	Tool.prototype._bindMapEvents = function()
	{
		var self = this,
			mapView = self._map.mapView;

		self._mapBasemapChangeEvent = self._arcgis.watchUtils.pausable(self._map, 'basemap', function(e)
		{
			self._mapBasemapChangeHandler(e);
		});

		self._mapUpdateEndEvent = self._arcgis.watchUtils.whenOnce(mapView, 'ready', function()
		{
			// update-end
			self._mapUpdateEndHandler();
		});

	};

	/**
	 * Release map events in drop destinations / through points mode.
	 * @returns {void}
	 */
	Tool.prototype._unbindMapEvents = function()
	{
		var self = this;
		if (self._mapBasemapChangeEvent)
		{
			self._mapBasemapChangeEvent.remove();
			self._mapBasemapChangeEvent = null;
		}

		if (self._mapUpdateEndEvent)
		{
			self._mapUpdateEndEvent.remove();
			self._mapUpdateEndEvent = null;
		}

		if (self._mapZoomEvent)
		{
			self._mapZoomEvent.remove();
			self._mapZoomEvent = null;
		}
	};

	/**
	 * Create map events on drop destination or through points mode.
	 * @returns {void}
	 */
	Tool.prototype._bindDropStopMapEvents = function()
	{
		var self = this,
			mapView = self._map.mapView;
		self._mapViewPointerMoveEvent = mapView.on('pointer-move', self._mapMouseMoveHandler.bind(self));
		self._mapViewPointerDownEvent = mapView.on('pointer-down', self._mapMouseDownHandler.bind(self));
		self._mapViewPointerUpEvent = mapView.on('pointer-up', self._mapMouseUpHandler.bind(self));
		tf.documentEvent.bind("keydown.direction", self._viewModel.routeState, self._mapKeyDownHandler.bind(self));
	};

	/**
	 * Release map events with drop destination or through points mode.
	 * @returns {void}
	 */
	Tool.prototype._unbindDropStopMapEvents = function()
	{
		var self = this;
		if (self._mapViewPointerMoveEvent)
		{
			self._mapViewPointerMoveEvent.remove();
			self._mapViewPointerMoveEvent = null;
		}

		if (self._mapViewPointerDownEvent)
		{
			self._mapViewPointerDownEvent.remove();
			self._mapViewPointerDownEvent = null;
		}

		if (self._mapViewPointerUpEvent)
		{
			self._mapViewPointerUpEvent.remove();
			self._mapViewPointerUpEvent = null;
		}

		tf.documentEvent.unbind("keydown.direction", self._viewModel.routeState);
		self.stopZoomEvent && self.stopZoomEvent.remove();
		self.stopZoomEvent = null;
	};

	/**
	 * Create map layers events.
	 * @returns {void}
	 */
	Tool.prototype._bindLayerEvents = function()
	{
		var self = this,
			mapView = self._map.mapView;

		self._mapViewPointerDownEvent = mapView.on('pointer-down', function(event)
		{
			self._map.mapView.allLayerViews.forEach(function(layerView)
			{
				if (layerView.layer == self._stopLayer)
				{
					self._hitTest(event, layerView, self._stopLayerMouseDownHandler);
				}
				if (layerView.layer == self._tripVertexLayer)
				{
					self._hitTest(event, layerView, self._tripVertexLayerMouseDownHandler);
				}
			});
		});

		self._mapViewPointerUpEvent = mapView.on('pointer-up', function(event)
		{
			self._map.mapView.allLayerViews.forEach(function(layerView)
			{
				if (layerView.layer == self._stopLayer)
				{
					self._hitTest(event, layerView, self._stopLayerMouseUpHandler);
				}
				if (layerView.layer == self._stopSequenceLayer)
				{
					self._hitTest(event, layerView, self._stopSequenceLayerMouseUpHandler);
				}
				if (layerView.layer == self._tripVertexLayer)
				{
					self._hitTest(event, layerView, self._tripVertexLayerMouseUpHandler);
				}
			});
		});

		// self._bindTooltipEvents();
	};

	/**
	 * Create map tooltip events.
	 * @returns {void}
	 */
	Tool.prototype._bindTooltipEvents = function()
	{
		var self = this,
			mapView = self._map.mapView;

		self._mapViewPointerMoveEvent = mapView.on('pointer-move', function(event)
		{
			self._map.mapView.allLayerViews.forEach(function(layerView)
			{
				if (layerView.layer == self._stopLayer)
				{
					self._hitTest(event, layerView, self._pointMouseOverHandler);
				}
				if (layerView.layer == self._tripVertexLayer)
				{
					self._hitTest(event, layerView, self._pointMouseOverHandler);
				}
			});
			if (!event.graphic)
			{
				self._pointMouseOutHandler();
			}
		});
	};

	/**
	 * Release map layer events.
	 * @returns {void}
	 */
	Tool.prototype._unbindLayerEvents = function()
	{
		var self = this;
		if (self._mapViewPointerMoveEvent)
		{
			self._mapViewPointerMoveEvent.remove();
			self._mapViewPointerMoveEvent = null;
		}

		if (self._mapViewPointerDownEvent)
		{
			self._mapViewPointerDownEvent.remove();
			self._mapViewPointerDownEvent = null;
		}

		if (self._mapViewPointerUpEvent)
		{
			self._mapViewPointerUpEvent.remove();
			self._mapViewPointerUpEvent = null;
		}
	};

	/**
	 * Map mouse-move event handler. Fires any time the mouse pointer moves over the map region.
	 * @param  {MouseEvent} e A standard DOM MouseEvent with additional properties mapPoint and screenPoint.
	 * @returns {void}
	 */
	Tool.prototype._mapMouseMoveHandler = function(e)
	{
		var self = this;
		if (self._onDropMode && !self._pauseDropMode)
		{
			var mapView = self._map.mapView,
				mapPoint = mapView.toMap({ x: e.x, y: e.y }),
				screenPoint = mapView.toScreen(mapPoint);

			self._refreshMouseSymbol(mapPoint);

			if (self._isMapAutoPan)
			{
				if (!self.stopZoomEvent)
				{
					self.stopZoomEvent = self._map.mapView.on("mouse-wheel", function(event) { event.stopPropagation(); });
				}

				var cursorPosition = self._getCursorPosition(screenPoint);
				clearInterval(self._autoPanInterval);
				clearInterval(self._panCheckInterval);
				self._autoPanMap(screenPoint, cursorPosition, mapPoint);
				if (cursorPosition)
				{
					self._autoPanInterval = setInterval(self._autoPanMap.bind(self), 10, screenPoint, cursorPosition, mapPoint);
					self._panCheckInterval = setInterval(self._treatPanStatus.bind(self), 10);
				}
			}
		}
	};

	/**
	 * refreshMouse icon conditionally
	 * @param  {void}
	 * @returns {void}
	 */
	Tool.prototype._refreshMouseSymbol = function(mapPoint)
	{
		var self = this;
		self._cursorLayer.removeAll();
		if (self._onDropMode && !self._pauseDropMode)
		{
			self.setMapCursorToLocate();
			self._showStopConnectionLine(mapPoint);
		}
		else
		{
			TF.Helper.MapHelper.setMapCursor(self._map, "default");
		}
	};

	Tool.prototype.setMapCursorToLocate = function()
	{
		var isDark = this._isDarkMapTheme();
		TF.Helper.MapHelper.setMapCursor(this._map, isDark ? "locate-white" : "locate");
	};

	/**
	 * Display the line between last destination and current cursor location.
	 * @param  {Point} mapPoint point based on map coordinates
	 * @returns {void}
	 */
	Tool.prototype._showStopConnectionLine = function(mapPoint)
	{
		var self = this,
			lastStop = self._getLastStop();
		if (lastStop)
		{
			var geometry = new self._arcgis.Polyline(self._webMercator);
			geometry.addPath([lastStop.geometry, mapPoint]);

			var symbol = self._destinationConnectionLineSymbol();
			self._stopConnectionLineGraphic = new self._arcgis.Graphic(geometry, symbol);

			self._cursorLayer.add(self._stopConnectionLineGraphic);
		}
	};

	/**
	 * Remove the line between destination and current cursor location.
	 * @param  {Point} mapPoint point based on map coordinates
	 * @returns {void}
	 */
	Tool.prototype._removeStopConnectionLine = function()
	{
		var self = this;
		if (self._stopConnectionLineGraphic)
		{
			self._cursorLayer.remove(self._stopConnectionLineGraphic);
			self._stopConnectionLineGraphic = null;
		}
	};

	/**
	 * Customize pan operation on the map.
	 * @param  {string} direction 8-direction
	 * @param  {Point} screenPoint point based on screen coordinates
	 * @returns {void}
	 */
	Tool.prototype._pan = function(direction)
	{
		var self = this,
			mapView = self._map.mapView;
		mapView.mapViewNavigation.stop();
		switch (direction)
		{
			case 'Up':
				mapView.mapViewNavigation.continousPanUp();
				break;
			case 'UpperRight':
				break;
			case 'Right':
				mapView.mapViewNavigation.continousPanRight();
				break;
			case 'LowerRight':
				break;
			case 'Down':
				mapView.mapViewNavigation.continousPanDown();
				break;
			case 'LowerLeft':
				break;
			case 'Left':
				mapView.mapViewNavigation.continousPanLeft();
				break;
			case 'UpperLeft':
				break;
			default:
				break;
		}
	};

	/**
	 * Pan map automatically.
	 * @param  {ScreenPoint} screenPoint the screen point of cursor.
	 * @param  {String} cursorPosition cursor position.
	 */
	Tool.prototype._autoPanMap = function(screenPoint, cursorPosition)
	{
		var self = this,
			mapView = self._map.mapView,
			cursorMapPoint = mapView.toMap(screenPoint);

		switch (cursorPosition)
		{
			case self._mapCursorPosition.North:
				self._pan('Up');
				break;
			case self._mapCursorPosition.NorthEast:
				self._pan('UpperRight');
				break;
			case self._mapCursorPosition.East:
				self._pan('Right');
				break;
			case self._mapCursorPosition.SouthEast:
				self._pan('LowerRight');
				break;
			case self._mapCursorPosition.South:
				self._pan('Down');
				break;
			case self._mapCursorPosition.SouthWest:
				self._pan('LowerLeft');
				break;
			case self._mapCursorPosition.West:
				self._pan('Left');
				break;
			case self._mapCursorPosition.NorthWest:
				self._pan('UpperLeft');
				break;
			default:
				self._pan();
				break;
		}
		self._refreshMouseSymbol(cursorMapPoint);
	};

	/**
	 * pan map automatically.
	 * @param  {ScreenPoint} screenPoint the screen point of cursor.
	 * @returns {void}
	 */
	Tool.prototype._treatPanStatus = function()
	{
		var self = this,
			hoverMapDiv = !$(self._map.mapView.container).is(":hover");
		if (hoverMapDiv)
		{
			self._viewModel.autoPan.stopPan();
			// clearInterval(self._autoPanInterval);
			// clearInterval(self._panCheckInterval);
		}
	};

	/**
	 * Get the map position of cursor.
	 * @param  {ScreenPoint} screenPoint the screen point of cursor.
	 * @returns {string} position.
	 */
	Tool.prototype._getCursorPosition = function(screenPoint)
	{
		var cursorX = screenPoint.x,
			cursorY = screenPoint.y,
			mapRegionExtent = this._getMapRegionExtent();

		for (var directionDomain in mapRegionExtent)
		{
			//check own property to exclude undefined
			if (mapRegionExtent.hasOwnProperty(directionDomain))
			{
				if ((mapRegionExtent[directionDomain]).some(function(subDomain)
				{
					return (cursorX >= subDomain.minX && cursorX <= subDomain.maxX
						&& cursorY >= subDomain.minY && cursorY <= subDomain.maxY);
				}))
				{
					return this._mapCursorPosition[directionDomain];
				}
			}
		}

		return null;
	};

	/**
	 * Map mouse-down event handler. Fires when a mouse button is pressed down and the mouse cursor is in the map region of the HTML page.
	 * @param  {MouseEvent} e A standard DOM MouseEvent with additional properties mapPoint and screenPoint.
	 * @returns {void}
	 */
	Tool.prototype._mapMouseDownHandler = function(e)
	{
		var self = this,
			mapView = self._map.mapView,
			mapPoint = mapView.toMap({ x: e.x, y: e.y }),
			screenPoint = mapView.toScreen(mapPoint);
		self._clearTooltipHide();
		self._viewModel.autoPan.resetAutoPanZone();
		if (e.button === 0)
		{
			self._isMouseDown = true;
			self._currentScreenPoint.x = screenPoint.x;
			self._currentScreenPoint.y = screenPoint.y;

			if (self._leftMouseDownTimeout)
			{
				window.clearTimeout(self._leftMouseDownTimeout);
				self._leftMouseDownTimeout = null;
				self._onMapMouseDoubleClick(e);
				return;
			}

			self._leftMouseDownTimeout = window.setTimeout(function(evt)
			{
				self._leftMouseDownTimeout = null;
				if (self._isMouseDown)
				{
					self._onMapMouseDrag(e);
				}
				else
				{
					if (!self._disableClick)
					{
						self._onMapMouseClick(e);
					}
					self._disableClick = false;
				}
			}, self._mouseDoubleClickMillisec, e);
		}
		else if (e.button === 2)
		{
			self._onMapMouseRightClick(e);
		}
	};

	/**
	 * Fires when click and the mouse cursor is in the map region of the HTML page.
	 * @param  {MouseEvent} e A standard DOM MouseEvent with additional properties mapPoint and screenPoint.
	 * @returns {void}
	 */
	Tool.prototype._onMapMouseClick = function(e)
	{
		var self = this,
			mapView = self._map.mapView,
			mapPoint = mapView.toMap({ x: e.x, y: e.y });

		self._removeStopPopup();

		self._addDestination(mapPoint).then(function(destinationCount)
		{
			self.notifyStopChanged();

			if (destinationCount > 1)
			{
				self._calculateTrip().then(function()
				{
					// clear extend line.
					self._removeStopConnectionLine();
				}, function()
				{
				});
			}
		}, function(error)
		{
			console.error(error);
		});
	};

	/**
	 * Fires when double-click and the mouse cursor is in the map region of the HTML page.
	 * @param  {MouseEvent} e A standard DOM MouseEvent with additional properties mapPoint and screenPoint.
	 * @returns {void}
	 */
	Tool.prototype._onMapMouseDoubleClick = function(e)
	{
		var self = this,
			mapView = self._map.mapView,
			mapPoint = mapView.toMap({ x: e.x, y: e.y }),
			stopCount = self._stops.length;
		if (stopCount > 0)
		{
			self._addTerminalDestination(mapPoint).then(function()
			{
				self.notifyStopChanged();
				self._unbindDropStopMapEvents();
				self._hideDropStopInformationBox();
				self._calculateTrip().then(function()
				{
					self._stopDropMode();
				}, function(error)
				{
					self._stopDropMode();
				});
			}, function(error)
			{
				self._stopDropMode();
			});
		}
		else
		{
			// add first stop and stop drop mode.
			self._addDestination(mapPoint).then(function(destinationCount)
			{
				self.notifyStopChanged();
				self._stopDropMode();
				tf.loadingIndicator.tryHide();
			}, function(error)
			{
				console.error(error);
				tf.loadingIndicator.tryHide();
			});
		}
	};

	/**
	 * Fires when right-click and the mouse cursor is in the map region of the HTML page.
	 * @param  {MouseEvent} e A standard DOM MouseEvent with additional properties mapPoint and screenPoint.
	 * @returns {void}
	 */
	Tool.prototype._onMapMouseRightClick = function(e)
	{
		var self = this,
			mapView = self._map.mapView,
			mapPoint = mapView.toMap({ x: e.x, y: e.y });

		if (self._destinations.length > 0)
		{
			self._addThroughPoint(mapPoint).then(function()
			{
				self.notifyStopChanged();
				self._calculateTrip().then(function()
				{
					self._removeStopConnectionLine();
					tf.loadingIndicator.tryHide();
				});
			}, function(error)
			{
				console.error(error);
				tf.loadingIndicator.tryHide();
			});
		}
	};

	/**
	 * Fires when mouse drag and the mouse cursor is in the map region of the HTML page.
	 * @param  {MouseEvent} e A standard DOM MouseEvent with additional properties mapPoint and screenPoint.
	 * @returns {void}
	 */
	Tool.prototype._onMapMouseDrag = function(e) { };

	/**
	 * Map mouse-up event handler. Fires when the mouse button is released and the mouse pointer is within the map region of the HTML page.
	 * @param  {MouseEvent} e A standard DOM MouseEvent with additional properties mapPoint and screenPoint.
	 * @returns {void}
	 */
	Tool.prototype._mapMouseUpHandler = function(e)
	{
		var self = this,
			mapView = self._map.mapView,
			mapPoint = mapView.toMap({ x: e.x, y: e.y }),
			screenPoint = mapView.toScreen(mapPoint);

		e.stopPropagation();

		if (e.button === 0)
		{
			self._isMouseDown = false;
			if (self._currentScreenPoint.x !== screenPoint.x || self._currentScreenPoint.y !== screenPoint.y)
			{
				self._disableClick = true;
			}
		}
	};

	/**
	 * Map key-down event handler. Fires when a keyboard key is pressed.
	 * @param  {MouseEvent} e A standard DOM KeyboardEvent.
	 * @returns {void}
	 */
	Tool.prototype._mapKeyDownHandler = function(e)
	{
		var self = this;
		switch (e.key)
		{
			case 'Esc':  // Microsoft Edge
			case 'Escape':  // Chrome
				self.stop();
				break;
			default:
				break;
		}
	};

	Tool.prototype.stop = function()
	{
		this._clearTooltipHide();
		this._onEscMode();
	};

	Tool.prototype.mapZoomHandler = function()
	{
		if (this._tripLayer && this._tripLayer.graphics.length > 0)
		{
			this.addArrow();
		}
	};

	/**
	 * Press Esc to exit drop destinations / through points mode.
	 * @returns {void}
	 */
	Tool.prototype._onEscMode = function()
	{
		var self = this,
			nextStopSequence = null;
		if (!self._stops)
		{
			return;
		}
		if (self._clearLastThroughPoints())
		{
			self.notifyStopChanged();

			if (self._stops.length > 1)
			{
				self._calculateTrip().then(function()
				{
					self._stopDropMode();
				});
			}
			else
			{
				self._tripVertexLayer.removeAll();
				self._tripLayer.removeAll();
				self._arrowLayer.removeAll();
				self._routeGeometry = null;
				self._draggingRouteGeometry = null;
				self._stopDropMode();
			}
		}
		else
		{
			if (self._stops.length === 1)
			{
				nextStopSequence = self._stops.length + 1;
				self._updatePreviousStopSymbol(nextStopSequence);
				self._updatePreviousStopLabel(nextStopSequence);
				self._stopDropMode();
				return;
			}

			if (!self._routeGeometry)
			{
				self._calculateTrip().then(function()
				{
					self._stopDropMode();
				}, function(error)
				{
					self._stopDropMode();
				});
			} else
			{
				self._stopDropMode();
			}
		}
	};

	/**
	 * Map basemap-change event handler. Fired when the map's basemap is changed.
	 * @param  {Event} e Event Object
	 * @returns {void}
	 */
	Tool.prototype._mapBasemapChangeHandler = function(e)
	{
		var basemapName = e.id,
			isColorThematicChanged = this._updateColorThematic(basemapName);

		if (isColorThematicChanged)
		{
			this._refreshDirectionsStyle();
		}
	};

	/**
	 * Update thematic color value by basemap name.
	 * @param  {string} basemapName name of basemap
	 * @returns {boolean} Identify the modification.
	 */
	Tool.prototype._updateColorThematic = function(basemapName)
	{
		var self = this;
		basemapName = basemapName ? basemapName : self._map.basemap.title;
		var changed = false,
			colorThematic = (self._darkBasemaps.indexOf(basemapName) != -1) ? 'dark' : 'light';
		if (self._colorThematic() !== colorThematic)
		{
			self._colorThematic(colorThematic);
			changed = true;
		}
		return changed;
	};

	/**
	 * Clear timeout.
	 * @returns {void}
	 */
	Tool.prototype._clearMouseOverOutTimeout = function()
	{
		clearTimeout(this._pointMouseOutTimeout);
		clearTimeout(this._pointMouseOutTimeout);
	};

	/**
	 * Stop layer mouse-over event handler. Fires when the mouse first enters into a graphic on the GraphicsLayer.
	 * @param  {MouseEvent} e A standard DOM MouseEvent with additional properties mapPoint and screenPoint.
	 * @returns {void}
	 */
	Tool.prototype._pointMouseOverHandler = function(e)
	{
		var self = this;
		self._pauseDropMode = true;

		var sameStop = (e.graphic.geometry == self._pointMouseOverGraphicGeometry) &&
			((e.graphic.attributes ? e.graphic.attributes.StopType : null) === self._pointMouseOverStopType);
		if (self._tooltipShown.shown && sameStop)
		{
			self._clearMouseOverOutTimeout();
		}
		else
		{
			self._pointMouseOverGraphicGeometry = e.graphic.geometry;
			self._pointMouseOverStopType = e.graphic.attributes ? e.graphic.attributes.StopType : null;
			self._clearMouseOverOutTimeout();
			self._pointMouseOverTimeout = window.setTimeout(function()
			{
				if (self._pointMouseOverGraphicGeometry == arguments[1] &&
					self._pointMouseOverStopType == arguments[0])
				{
					clearTimeout(self._pointMouseOverTimeout)
					//render the tooltip, only render for the first time, refresh it when necessary
					//put in 200 instead of 200px
					var pageXin = arguments[2];
					var pageYin = arguments[3];
					var xPixel = (pageXin < document.body.clientWidth - 250) ? pageXin : (pageXin - 250);
					var yPixel = pageYin + 20;
					//if map background being dark
					var bkColor = '#FFFFFF';
					var bdColor = '#333333';
					var ftColor = '#333333';
					if (self._isLightMapTheme())
					{
						bkColor = '#4B4B4B';
						bdColor = '#797979';
						ftColor = '#FFFFFF';
					}
					var pointDescriptions = null;
					switch (self._pointMouseOverStopType)
					{
						case self.StopTypeEnum.DESTINATION:
						case self.StopTypeEnum.TERMINAL:
							pointDescriptions = ['Click and drag to move this Destination.', 'Right click to remove.'];
							break;
						case self.StopTypeEnum.WAY_STOP:
							pointDescriptions = ['Click and drag to move this Through Point.', 'Right click to remove or set as a Destination.'];
							break;
						default:    //vertex
							pointDescriptions = ['Click and drag to set a Through Point and adjust the path.', 'Right click to set as a Destination or Through Point.'];
					}
					if (!self._tooltipGenerated.generated)
					{
						self._tooltipViewModel = new TF.Map.TooltipViewModel(xPixel, yPixel, bkColor, bdColor, ftColor, pointDescriptions);
						self._tooltipViewModel.render(self._tooltipShown);
						self._tooltipGenerated.generated = true;
					}
					else
					{
						//refresh view model and tooltip div
						self._tooltipViewModel.refreshShowTooltip(xPixel, yPixel, bkColor, bdColor, ftColor, pointDescriptions, self._tooltipShown);
					}
				}
			}, self._pointMouseOverMillisec, self._pointMouseOverStopType, self._pointMouseOverGraphicGeometry, e.pageX, e.pageY);
		}
	};

	/**
	 * Stop layer mouse-out event handler. Fires as the mouse exits a graphic on the GraphicsLayer.
	 * @param  {MouseEvent} e A standard DOM MouseEvent with additional properties mapPoint and screenPoint.
	 * @returns {void}
	 */
	Tool.prototype._pointMouseOutHandler = function(e)
	{
		var self = this;
		self._pauseDropMode = false;

		//self._pointMouseOver = false;
		self._clearMouseOverOutTimeout();
		self._pointMouseOutTimeout = window.setTimeout(function()
		{
			//hide the tooltip, only destroy it in the dispose phase: tool.js=> _disposeTooltip
			self._clearTooltipHide();
			self._pointMouseOverGraphicGeometry = null;
			self._pointMouseOverStopType = null;
		}, self._pointMouseOutMillisec);
	};

	/**
	 * Close tooltip.
	 * @returns {void}
	 */
	Tool.prototype._clearTooltipHide = function()
	{
		this._clearMouseOverOutTimeout();
		if (this._tooltipViewModel)
		{
			this._tooltipViewModel.hideTooltip(this._tooltipShown);
		}
	};

	/**
	 * Fires when a stop graphic has been clicked.
	 * @param  {MouseEvent} e The returned object contains screenPoint, mapPoint, and Graphic.
	 * @returns {void}
	 */
	Tool.prototype._onStopMouseClick = function(e)
	{
		var stopGraphic = e.graphic,
			geometry = stopGraphic.geometry,
			attributes = stopGraphic.attributes,
			stopSequence = attributes.Sequence,
			locationType = attributes.LocationType;
		this._showStopPopup(geometry, locationType, stopSequence);
	};

	/**
	 * Stop Sequence layer mouse-down event handler. Fires when a mouse button is pressed down and the mouse cursor is on a graphic.
	 * @param  {MouseEvent} e A standard DOM MouseEvent with additional properties mapPoint and screenPoint.
	 * @returns {void}
	 */
	// Tool.prototype._stopSequenceLayerMouseDownHandler = function(e)
	// {
	// 	var self = this;
	// 	e.stopPropagation();

	// 	if (e.button === 0)
	// 	{
	// 		self._isStopSequenceMouseDown = true;

	// 		if (self._stopSequenceMouseDownTimeout)
	// 		{
	// 			window.clearTimeout(self._stopSequenceMouseDownTimeout);
	// 			self._stopSequenceMouseDownTimeout = null;
	// 			// double-click
	// 			return;
	// 		}

	// 		self._stopSequenceMouseDownTimeout = window.setTimeout(function(evt)
	// 		{
	// 			self._stopSequenceMouseDownTimeout = null;
	// 			if (self._isStopSequenceMouseDown)
	// 			{
	// 				// mouse-drag
	// 			}
	// 			else
	// 			{
	// 				self._onStopSequenceMouseClick(e);
	// 			}
	// 		}, self._mouseDoubleClickMillisec, e);
	// 	}
	// 	else if (e.button === 2)
	// 	{
	// 		// left-click
	// 		return;
	// 	}
	// };

	/**
	 * Stop Sequence layer mouse-up event handler. Fires when a mouse button is released and the mouse cursor is on a graphic.
	 * @param  {MouseEvent} e A standard DOM MouseEvent with additional properties mapPoint and screenPoint.
	 * @returns {void}
	 */
	Tool.prototype._stopSequenceLayerMouseUpHandler = function(e)
	{
		e.stopPropagation();

		if (e.button === 0)
		{
			this._isStopSequenceMouseDown = false;
		}
	};

	/**
	 * Fires when a stop sequence graphic has been clicked.
	 * @param  {MouseEvent} e The returned object contains screenPoint, mapPoint, and Graphic.
	 * @returns {void}
	 */
	Tool.prototype._onStopSequenceMouseClick = function(e)
	{
		var stopGraphic = e.graphic,
			geometry = stopGraphic.geometry,
			attributes = stopGraphic.attributes,
			stopSequence = attributes.Sequence,
			stopType = attributes.StopType;

		this._showStopPopup(geometry, stopType, stopSequence);
	};

	/**
	 * Display destination on demand menu.
	 * @param  {Point} mapPoint point based on map coordinates
	 * @param  {string} stopType StopTypeEnum constants.
	 * @param  {number} stopSequence The sequence of the destination / through point.
	 * @param  {object} data (optional) vertex graphic data.
	 * @returns {void}
	 */
	Tool.prototype._showStopPopup = function(mapPoint, stopType, stopSequence, data)
	{
		var self = this,
			mapId = self._map.id,
			$map = $('#' + mapId),
			mapExtent = self._map.extent,
			mapWidth = self._map.width,
			mapHeight = self._map.height,
			screenPoint = self._arcgis.screenUtils.toScreenPoint(mapExtent, mapWidth, mapHeight, mapPoint),
			data = data || {},
			$popup = self._createPopupDiv(stopType, mapPoint, stopSequence, data);

		// remove existing popup first, ensure there is only one popup on the map.
		self._removeStopPopup();

		$popup.css({
			'left': screenPoint.x - self._stopPopupWidth / 2 - 5,
			'top': screenPoint.y - self._stopPopupHeight,
			'display': 'block'
		});

		// display popup
		$map.append($popup[0]);

		self._fanOutPopup();
	};

	/**
	 * Remove destination on demand menu.
	 * @returns {void}
	 */
	Tool.prototype._removeStopPopup = function()
	{
		var $popup = $('.direction-popup-menu');
		$popup.remove();
	};

	/**
	 * Update location of destination on demand menu.
	 * @returns {void}
	 */
	Tool.prototype._updateStopPopup = function()
	{
		var self = this,
			$popup = $('.direction-popup-menu');
		if ($popup.length > 0)
		{
			var map = self._map,
				mapExtent = map.extent,
				mapWidth = map.width,
				mapHeight = map.height,
				mapPoint = new self._arcgis.Point($popup.attr('x'), $popup.attr('y'), self._webMercator),
				screenPoint = self._arcgis.screenUtils.toScreenPoint(mapExtent, mapWidth, mapHeight, mapPoint);

			$popup.css({
				'left': screenPoint.x - self._stopPopupWidth / 2 - 5,
				'top': screenPoint.y - self._stopPopupHeight,
				'display': 'block'
			});
		}
	};

	/**
	 * Fanout destination on demand menu.
	 * @returns {void}
	 */
	Tool.prototype._fanOutPopup = function()
	{
		var $btnRight = $('.direction-popup-menu .right');

		$btnRight.delay(500).animate({
			'top': 0,
			'left': 80,
			'opacity': 1
		}, {
			'speed': 500,
			'easing': 'linear'
		});
	};

	/**
	 * Create destination on demand menu div.
	 * @param  {string} stopType StopTypeEnum constants.
	 * @param  {Point} mapPoint point based on map coordinates
	 * @param  {number} stopSequence The sequence of the destination / through point.
	 * @param  {object} data (optional) vertex graphic data.
	 * @returns {void}
	 */
	Tool.prototype._createPopupDiv = function(stopType, mapPoint, stopSequence, data)
	{
		var self = this,
			$popup = $('<div></div>'),
			$btnLeft = $('<div></div>'),
			$btnRight = $('<div></div>'),
			$btnWaypoint = $('<div></div>'),
			$btnDestination = $('<div></div>'),
			$btnRemove = $('<div></div>'),
			$waypointLabel = $('<div></div>'),
			$destinationLabel = $('<div></div>'),
			$removeLabel = $('<div></div>');

		$popup.addClass('direction-popup-menu');
		$btnLeft.addClass('left');
		$btnRight.addClass('right');

		$btnWaypoint.addClass('wayPoint');
		$btnDestination.addClass('destination');
		$btnRemove.addClass('remove');
		$btnRemove.text('X');

		$waypointLabel.addClass('wayPoint label');
		$destinationLabel.addClass('destination label');
		$removeLabel.addClass('remove label');

		$waypointLabel.text('Set as Through Point');
		$destinationLabel.text('Set as Destination');
		$removeLabel.text('Remove');

		$popup.attr('x', mapPoint.x);
		$popup.attr('y', mapPoint.y);

		data = $.extend(data, {
			'stopType': stopType,
			'sequence': stopSequence
		});

		switch (stopType)
		{
			case self.StopTypeEnum.DESTINATION:
				if (stopSequence !== 1)
				{
					$btnLeft.append($btnWaypoint);
					$btnLeft.append($waypointLabel);
					$btnLeft.bind('click', data, self._onSetAsThroughPointClick.bind(self));

					$btnRight.append($btnRemove);
					$btnRight.append($removeLabel);
					$btnRight.bind('click', data, self._onRemoveStopClick.bind(self));
				}
				else
				{
					$btnLeft.css('display', 'none');

					$btnRight.css('display', 'none');
				}
				break;
			case self.StopTypeEnum.TERMINAL:
				$btnLeft.append($btnRemove);
				$btnLeft.append($removeLabel);
				$btnLeft.bind('click', data, self._onRemoveStopClick.bind(self));

				$btnRight.css('display', 'none');
				break;
			case self.StopTypeEnum.WAY_STOP:
				$btnLeft.append($btnDestination);
				$btnLeft.append($destinationLabel);
				$btnLeft.bind('click', data, self._onSetAsDestinationClick.bind(self));

				$btnRight.append($btnRemove);
				$btnRight.append($removeLabel);
				$btnRight.bind('click', data, self._onRemoveStopClick.bind(self));
				break;
			case self.StopTypeEnum.VERTEX:
				$btnLeft.append($btnDestination);
				$btnLeft.append($destinationLabel);
				$btnLeft.bind('click', data, self._onSetAsDestinationClick.bind(self));

				$btnRight.append($btnWaypoint);
				$btnRight.append($waypointLabel);
				$btnRight.bind('click', data, self._onSetAsThroughPointClick.bind(self));
				break;
			default:
				break;
		};

		if (self._isDarkMapTheme())
		{
			$btnLeft.addClass('light');
			$btnRight.addClass('light');
			$btnWaypoint.addClass('dark');
			$btnDestination.addClass('dark');
			$btnRemove.addClass('dark');
		}
		else
		{
			$btnLeft.addClass('dark');
			$btnRight.addClass('dark');
			$btnWaypoint.addClass('light');
			$btnDestination.addClass('light');
			$btnRemove.addClass('light');
		}

		$popup.append($btnLeft[0]);
		$popup.append($btnRight[0]);

		return $popup;
	};

	/**
	 * Dispose destination on demand menu.
	 * @returns {void}
	 */
	Tool.prototype._disposePopup = function()
	{
		this._removeStopPopup();
	};

	/**
	 * Trip vertex layer mouse-down event handler. Fires when a mouse button is pressed down and the mouse cursor is on a graphic.
	 * @param  {MouseEvent} e A standard DOM MouseEvent with additional properties mapPoint and screenPoint.
	 * @returns {void}
	 */
	Tool.prototype._tripVertexLayerMouseDownHandler = function(e)
	{
		var self = this;
		e.stopPropagation();

		self._clearTooltipHide();
		if (e.button === 0)
		{
			self._isTripVertexMouseDown = true;

			if (self._tripVertexMouseDownTimeout)
			{
				window.clearTimeout(self._tripVertexMouseDownTimeout);
				self._tripVertexMouseDownTimeout = null;
				// double-click
				return;
			}

			self._tripVertexMouseDownTimeout = window.setTimeout(function(evt)
			{
				self._tripVertexMouseDownTimeout = null;
				if (self._isTripVertexMouseDown)
				{
					// mouse-drag
				}
				else
				{
					self._onTripVertexMouseClick(e);
				}
			}, self._mouseDoubleClickMillisec, e);
		}
		else if (e.button === 2)
		{
			// left-click
			return;
		}
	};

	/**
	 * Trip vertex layer mouse-up event handler. Fires when a mouse button is released and the mouse cursor is on a graphic.
	 * @param  {MouseEvent} e A standard DOM MouseEvent with additional properties mapPoint and screenPoint.
	 * @returns {void}
	 */
	Tool.prototype._tripVertexLayerMouseUpHandler = function(e)
	{
		e.stopPropagation();

		if (e.button === 0)
		{
			this._isTripVertexMouseDown = false;
		}
	};

	/**
	 * Fires when a trip vertex graphic has been clicked.
	 * @param  {MouseEvent} e The returned object contains screenPoint, mapPoint, and Graphic.
	 * @returns {void}
	 */
	Tool.prototype._onTripVertexMouseClick = function(e)
	{
		var self = this,
			graphic = e.graphic,
			geometry = graphic.geometry,
			attributes = graphic.attributes,
			sequence = null,
			data = null;
		if (attributes.isEndPoint)
		{
			return;
		}
		else
		{
			sequence = self._calculateVertexSequence(attributes);
			data = { 'graphic': graphic };
			self._showStopPopup(geometry, self.StopTypeEnum.VERTEX, sequence, data);
		}
	};

	/**
	 * Map update-end event handler. Fires when a layer has finished updating its content.
	 * @param  {Error} e (Optional) The error object is available when an error occurs during the update.
	 * @returns {void}
	 */
	Tool.prototype._mapUpdateEndHandler = function(e)
	{
		this._updateStopPopup();
	};

	/**
	 * Fires when remove button clicked.
	 * @param  {object} e graphic attribute data.
	 * @returns {void}
	 */
	Tool.prototype._onRemoveStopClick = function(e)
	{
		var self = this,
			stopType = e.data.stopType,
			stopSequence = e.data.sequence;
		self._removeStopPopup();
		switch (stopType)
		{
			case self.StopTypeEnum.DESTINATION:
			case self.StopTypeEnum.TERMINAL:
			case self.StopTypeEnum.WAY_STOP:
				self._removeStop(stopSequence);
				break;
			default:
				break;
		}

		self.notifyStopChanged();
	};

	/**
	 * Fires when set as through point button clicked.
	 * @param  {object} e graphic attribute data.
	 * @returns {void}
	 */
	Tool.prototype._onSetAsThroughPointClick = function(e)
	{
		var self = this,
			stopType = e.data.stopType,
			stopSequence = e.data.sequence;
		self._removeStopPopup();
		switch (stopType)
		{
			case self.StopTypeEnum.DESTINATION:
			case self.StopTypeEnum.WAY_STOP:
				self._destinationToThroughPoint(stopSequence);
				break;
			case self.StopTypeEnum.VERTEX:
				self._vertexToStop(stopSequence, e.data.graphic, self.StopTypeEnum.WAY_STOP);
				break;
			default:
				break;
		}

		self.notifyStopChanged();
	};

	/**
	 * Fires when set as destination button clicked.
	 * @param  {object} e graphic attribute data.
	 * @returns {void}
	 */
	Tool.prototype._onSetAsDestinationClick = function(e)
	{
		var self = this,
			stopType = e.data.stopType,
			stopSequence = e.data.sequence;
		self._removeStopPopup();
		switch (stopType)
		{
			case self.StopTypeEnum.DESTINATION:
			case self.StopTypeEnum.WAY_STOP:
				self._throughPointToDestination(stopSequence);
				break;
			case self.StopTypeEnum.VERTEX:
				self._vertexToStop(stopSequence, e.data.graphic, self.StopTypeEnum.DESTINATION);
				break;
			default:
				break;
		}
	};

	/**
	 * Create map events out of drop destinations / through points mode.
	 * @returns {void}
	 */
	Tool.prototype._bindGeneralMapEvents = function()
	{
		this._onGeneralMapMouseClickEvent = this._map.on('click', this._onGeneralMapMouseClickHandler.bind(this));
	};

	/**
	 * Release map events out of drop destinations / through points mode.
	 * @returns {void}
	 */
	Tool.prototype._unbindGeneralMapEvents = function()
	{
		if (this._onGeneralMapMouseClickEvent)
		{
			this._onGeneralMapMouseClickEvent.remove();
			this._onGeneralMapMouseClickEvent = null;
		}
	};

	/**
	 * Map mouse-click event handler. Fires when a user single clicks on the map using the mouse and the mouse pointer is within the map region of the HTML page.
	 * @param  {MouseEvent} e A standard DOM MouseEvent with additional properties mapPoint and screenPoint.
	 * @returns {void}
	 */
	Tool.prototype._onGeneralMapMouseClickHandler = function(e)
	{
		this._removeStopPopup();
	};

	Tool.prototype._getLayerGraphicsAfterHitTest = function(results, graphicsLayer)
	{
		var layer = null;
		return results.filter(function(result)
		{
			layer = result.graphic.layer;
			return layer === graphicsLayer;
		});
	};
})();
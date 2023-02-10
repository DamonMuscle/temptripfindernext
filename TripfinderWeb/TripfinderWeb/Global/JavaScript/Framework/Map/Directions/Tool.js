(function()
{
	createNamespace('TF.RoutingMap.Directions').Tool = Tool;

	function Tool(map, arcgis, routingMapDocumentViewModel)
	{
		var self = this;
		self._map = map;
		self._viewModel = routingMapDocumentViewModel;
		self._arcgis = arcgis;
		self._useTimes = 0;
		self._onDropMode = false;
		self._pauseDropMode = false;

		self.CurbApproachEnum = TF.RoutingMap.Directions.Enum.CurbApproachEnum;
		self.LocationTypeEnum = TF.RoutingMap.Directions.Enum.LocationTypeEnum;
		self.StopTypeEnum = TF.RoutingMap.Directions.Enum.StopTypeEnum;
		self.UTurnPolicyEnum = TF.RoutingMap.Directions.Enum.UTurnPolicyEnum;

		self.defaultCurbApproach = self.CurbApproachEnum.RIGHT_SIDE;
		self.uTurnPolicy = self.UTurnPolicyEnum.ALLOWED;

		// routingMapDocumentViewModel.onModeChangeEvent.subscribe(this.onModeChange.bind(this));
		self.stopTool = new TF.RoutingMap.RoutingPalette.StopTool(null, self._map, self._viewModel);
		self._initialize();
	}

	Tool.prototype._initializeTooltip = function()
	{
		this._tooltipViewModel = null;
	};

	Tool.prototype._initialize = function()
	{
		var self = this;
		self._lightBasemaps = ['streets', 'terrain', 'topo', 'gray', 'oceans', 'osm'];
		self._darkBasemaps = ['satellite', 'dark-gray-vector', 'hybrid', 'dark-gray', 'national-geographic'];
		self._maxDropStopInformationBoxDisplayTimes = 3;

		self._wgs84 = new self._arcgis.SpatialReference(4326);
		self._webMercator = new self._arcgis.SpatialReference(3857);

		self._onRoutingResultChanged = new TF.Events.Event();
		self._onStopChanged = new TF.Events.Event();
		self._onDropDestinationsChanged = new TF.Events.Event();

		// refresh it to get left top as browser size could be changed in the middle
		self._infoBoxStandardRectBottom = 10;
		self._infoBoxStandardRectRight = 10;
		self._infoBoxStandardRect = { left: 0, top: 0, width: 300, height: 80 }; // left top to be refreshed when using
		// esri control and zoom position data
		self._esriCtrlPaddingX = 5;  // esri logo control x-axis padding
		self._esriZoomPaddingX = 10;  // esri zoom control x-axis padding
		self._esriCtrlRect = { left: 0, top: 0, width: 0, height: 0 }; // all to be refreshed
		self._esriZoomRect = { left: 0, top: 0, width: 0, height: 0 }; // all to be refreshed
		self._esriCtrlDivQueryStr = '.esri-attribution';
		self._esriZoomDivQueryStr = '#mapDiv_zoom_slider';
		self._esriZoomCtrlStatus = 'left';
	};

	Tool.prototype._beginDropMode = function()
	{
		// initialize tooltipViewModel
		var self = this;
		self._initializeTooltip();

		self._initSymbol();
		self._initLayers();
		self._initEvents();
		self._initLocator();
		self._initRouting();
		self._initStops();

		self._bindMapEvents();
		self._bindLayerEvents();

		self._addLayers();
	};

	Tool.prototype._endDropMode = function()
	{
		// dispose div if generated
		var self = this;
		self._disposeTooltip();

		self._disposeSymbol();
		self._disposeLayers();
		self._disposeEvents();
		self._disposeLocator();
		self._disposeRouting();
		self._disposeStops();
		self._disposePopup();

		self._unbindMapEvents();
		self._unbindLayerEvents();

		self._removeLayers();
	};

	Tool.prototype.toggleDropMode = function()
	{
		var self = this;
		self._onDropMode ? self._onEscMode() : self._startDropMode();
	};

	/**
	 * Make map into drop mode. Add Layers and map / layer events.
	 */
	Tool.prototype._startDropMode = function()
	{
		var self = this;
		if (self._onDropMode)
		{
			return;
		}

		self._onDropMode = true;
		self._isMapAutoPan = true;
		self._MapAutoPanScale = 10;
		self._onDropDestinationsChanged.notify(self._onDropMode);

		// self._hideDropStopInformationBox();
		if (self._useTimes === 0
			&& !self._stops)
		{
			self._beginDropMode();
			self._clearLayers();
		}
		self._bindDropStopMapEvents();
		self._disposePopup();

		self._useTimes++;
		// self._openDropStopInformationBox();

		TF.Helper.MapHelper.disableDoubleClickZoom(self._map);
		self.setMapCursorToLocate();

		self._unbindGeneralMapEvents();
		self.stopDraggingMode();
	};

	Tool.prototype.onModeChange = function()
	{
		if (this._onDropMode)
		{
			this._stopDropMode();
		}
	};

	Tool.prototype._stopDropMode = function()
	{
		var self = this;
		if (self._cursorLayer)
		{
			self._cursorLayer.removeAll();
		}

		self._isMapAutoPan = false;
		self._MapAutoPanScale = null;
		clearInterval(self._autoPanInterval);
		self._autoPanInterval = null;
		clearInterval(self._panCheckInterval);
		self._panCheckInterval = null;

		self._unbindDropStopMapEvents();
		self._hideDropStopInformationBox();
		self._removeStopPopup();

		TF.Helper.MapHelper.enableDoubleClickZoom(self._map);
		TF.Helper.MapHelper.setMapCursor(self._map, "default");

		self._bindGeneralMapEvents();
		self.startDraggingMode(self._routeGeometry);

		self._onDropMode = false;
		self._onDropDestinationsChanged.notify(self._onDropMode);
	};

	Tool.prototype._initLayers = function()
	{
		var self = this;
		self._stopLayer = new self._arcgis.GraphicsLayer({ 'id': 'directions_stopLayer' });
		self._stopSequenceLayer = new self._arcgis.GraphicsLayer({ 'id': 'directions_stopSequenceLayer' });
		self._tripLayer = new self._arcgis.GraphicsLayer({ 'id': 'directions_tripLayer' });
		self._tripVertexLayer = new self._arcgis.GraphicsLayer({ 'id': 'directions_tripVertexLayer' });
		self._cursorLayer = new self._arcgis.GraphicsLayer({ 'id': 'directions_cursorLayer' });
		self._arrowLayer = new self._arcgis.GraphicsLayer({ 'id': 'directions_arrowLayer' });
	};

	Tool.prototype.getLayers = function()
	{
		var self = this;
		return [self._cursorLayer,
		self._arrowLayer,
		self._tripLayer,
		self._tripVertexLayer,
		self._map.findLayerById("directions_dragging_arrowLayer"),
		self._map.findLayerById("directions_dragging_ghostLayer"),
		self._stopLayer,
		self._stopSequenceLayer].filter(function(c) { return !!c; });
	};

	Tool.prototype._addLayers = function()
	{
		var self = this;
		if (self._map)
		{
			self._map.add(self._tripLayer, 0);
			self._map.add(self._tripVertexLayer, 1);
			self._map.add(self._arrowLayer, 2);
			self._map.add(self._cursorLayer, 5);
			self._map.add(self._stopLayer, 6);
			self._map.add(self._stopSequenceLayer, 7);
		}
	};

	Tool.prototype._clearLayers = function()
	{
		var self = this,
			stopLayer = self._stopLayer,
			stopSequenceLayer = self._stopSequenceLayer,
			tripLayer = self._tripLayer,
			tripVertexLayer = self._tripVertexLayer,
			cursorLayer = self._cursorLayer,
			arrowLayer = self._arrowLayer;

		if (stopLayer)
		{
			stopLayer.removeAll();
		}

		if (stopSequenceLayer)
		{
			stopSequenceLayer.removeAll();
		}

		if (tripLayer)
		{
			tripLayer.removeAll();
		}

		if (tripVertexLayer)
		{
			tripVertexLayer.removeAll();
		}

		if (cursorLayer)
		{
			cursorLayer.removeAll();
		}

		if (arrowLayer)
		{
			arrowLayer.removeAll();
		}
	};

	Tool.prototype._removeLayers = function()
	{
		var self = this;
		if (self._tripLayer)
		{
			self._map.remove(self._tripLayer);
			self._tripLayer = null;
		}

		if (self._stopLayer)
		{
			self._map.remove(self._stopLayer);
			self._stopLayer = null;
		}

		if (self._tripVertexLayer)
		{
			self._map.remove(self._tripVertexLayer);
			self._tripVertexLayer = null;
		}

		if (self._stopSequenceLayer)
		{
			self._map.remove(self._stopSequenceLayer);
			self._stopSequenceLayer = null;
		}

		if (self._cursorLayer)
		{
			self._map.remove(self._cursorLayer);
			self._cursorLayer = null;
		}
	};

	Tool.prototype._openDropStopInformationBox = function()
	{
		var self = this;
		if (self._useTimes <= self._maxDropStopInformationBoxDisplayTimes)
		{
			var $map = self._getMapContainer(),
				$informationBox = self._createDropStopInformationBox();

			self._correctInformationBoxPosition($informationBox);
			$informationBox.css({
				'display': 'block',
				'position': 'absolute',
				'bottom': '15px',
				'background-color': '#FFFFFF',
				'height': '70px',
				'padding-left': '5px'
			});

			// display informationBox
			$map.append($informationBox);
			ko.applyBindings(self, $informationBox[0]);
		}
	};

	Tool.prototype._hideDropStopInformationBox = function()
	{
		if (this.$infoWindow && this.$infoWindow.length > 0)
		{
			this.$infoWindow.remove();
		}
	};

	Tool.prototype._closeDropStopInformationBox = function()
	{
		this._useTimes += this._maxDropStopInformationBoxDisplayTimes;

		this._hideDropStopInformationBox();
	};

	Tool.prototype._createDropStopInformationBox = function()
	{
		var self = this,
			$infoWindow = $('<div></div>'),
			$closeButton = $('<div></div>'),
			$p = $('<p></p>'),
			$p1 = $('<p></p>'),
			$p2 = $('<p></p>'),
			$p3 = $('<p></p>'),
			themeClassName = self._isLightMapTheme() ? 'light' : 'dark';

		$infoWindow.addClass('direction-drop-destination-infoWindow');
		$infoWindow.attr('data-bind', 'css:  _colorThematic()');
		$infoWindow.addClass(themeClassName);

		$closeButton.addClass('close');

		$p1.text('Left click to drop a Destination');
		$infoWindow.append($p1);

		$p2.text('Double Left-click to set the final Destination.');
		$infoWindow.append($p2);

		$infoWindow.append($p);

		$p3.text('Right click to set a Through Point');
		$infoWindow.append($p3[0]);

		$closeButton.text('x');
		$closeButton.bind('click', null, self._closeDropStopInformationBox.bind(self));

		$infoWindow.append($closeButton[0]);
		self.$infoWindow = $infoWindow;
		return $infoWindow;
	};

	Tool.prototype._correctEsriZoomCtrlPosition = function()
	{
		if ($(this._esriZoomDivQueryStr).length === 0 || this._viewModel.element.find(this._esriCtrlDivQueryStr).length === 0)
			return;
		var $panel = this._viewModel.element.find('.routingmap_panel:visible');
		// check existence of the panel div, if not, the timer suicides
		if ($panel.length === 0)
		{
			return;
		}
		this._refreshEsriRect();
		var panelRects = TF.Graphic.RectUtility.getElementRects($panel);
		if (this._checkEsriZoomCtrlCollision(panelRects))
		{
			this._changeSideEsriZoomCtrl(panelRects);
		}
	};

	Tool.prototype.correctPositions = function()
	{
		this._correctEsriZoomCtrlPosition();
		this._correctInformationBoxPosition();
	};

	Tool.prototype._checkEsriZoomCtrlCollision = function(panelRects)
	{
		return TF.Graphic.RectCollisionDetector.withCollisionByGroup([this._esriZoomRect], panelRects)
			|| TF.Graphic.RectCollisionDetector.withCollisionByGroup([this._esriCtrlRect], panelRects);
	};

	Tool.prototype._refreshEsriRect = function()
	{
		this._esriZoomRect = TF.Graphic.RectUtility.getElementRects(this._esriZoomDivQueryStr)[0];
		this._esriCtrlRect = TF.Graphic.RectUtility.getElementRects(this._esriCtrlDivQueryStr)[0];
	};

	Tool.prototype._changeSideEsriZoomCtrl = function(panelRects)
	{
		var refreshZoomCss =
		{
			left: 'auto',
			right: 'auto'
		},
			refreshCtrlCss =
			{
				left: 'auto',
				right: 'auto'
			},
			zoomRect = TF.Graphic.RectUtility.getElementRects(this._esriZoomDivQueryStr)[0],
			ctrlRect = TF.Graphic.RectUtility.getElementRects(this._esriCtrlDivQueryStr)[0],
			routingDockBaseStr = ".routingmap_panel.dock-",
			$map = this._getMapContainer(),
			mapOffset = $map.offset();
		if (this._esriZoomCtrlStatus === 'left')
		{
			// move to the right side
			refreshZoomCss.right = this._esriZoomPaddingX;
			refreshCtrlCss.right = this._esriCtrlPaddingX;
			zoomRect.left = $map.width() + mapOffset.left - refreshZoomCss.right - zoomRect.width;
			ctrlRect.left = $map.width() + mapOffset.left - refreshCtrlCss.right - ctrlRect.width;
			if (TF.Graphic.RectCollisionDetector.withCollisionByGroup([zoomRect], panelRects)
				|| TF.Graphic.RectCollisionDetector.withCollisionByGroup([ctrlRect], panelRects))
			{
				var dockRightGroupLeastLeft = TF.Graphic.RectUtility.getMinLeft(this._viewModel.element.find(routingDockBaseStr + "right:visible"));
				refreshZoomCss.right = $map.width() + mapOffset.left - dockRightGroupLeastLeft + this._esriZoomPaddingX;
				refreshCtrlCss.right = $map.width() + mapOffset.left - dockRightGroupLeastLeft + this._esriCtrlPaddingX;
				zoomRect.left = $map.width() + mapOffset.left - refreshZoomCss.right - zoomRect.width;
				ctrlRect.left = $map.width() + mapOffset.left - refreshCtrlCss.right - ctrlRect.width;
				if (TF.Graphic.RectCollisionDetector.withCollisionByGroup([zoomRect], panelRects)
					|| TF.Graphic.RectCollisionDetector.withCollisionByGroup([ctrlRect], panelRects))
				{
					return;
				}
			}
			this._esriZoomCtrlStatus = 'right';
		}
		else
		{
			refreshZoomCss.left = this._esriZoomPaddingX;
			refreshCtrlCss.left = this._esriCtrlPaddingX;
			zoomRect.left = mapOffset.left + refreshZoomCss.left;
			ctrlRect.left = mapOffset.left + refreshCtrlCss.left;
			if (TF.Graphic.RectCollisionDetector.withCollisionByGroup([zoomRect], panelRects)
				|| TF.Graphic.RectCollisionDetector.withCollisionByGroup([ctrlRect], panelRects))
			{
				var dockRightGroupMostWidth = TF.Graphic.RectUtility.getMaxWidth(routingDockBaseStr + "left:visible");
				refreshZoomCss.left = dockRightGroupMostWidth - mapOffset.left + this._esriZoomPaddingX;
				refreshCtrlCss.left = dockRightGroupMostWidth - mapOffset.left + this._esriCtrlPaddingX;
				zoomRect.left = mapOffset.left + refreshZoomCss.left;
				ctrlRect.left = mapOffset.left + refreshCtrlCss.left;
				if (TF.Graphic.RectCollisionDetector.withCollisionByGroup([zoomRect], panelRects)
					|| TF.Graphic.RectCollisionDetector.withCollisionByGroup([ctrlRect], panelRects))
				{
					return;
				}
			}
			this._esriZoomCtrlStatus = 'left';
		}

		this._viewModel.element.find(this._esriZoomDivQueryStr).css(refreshZoomCss);
		this._viewModel.element.find(this._esriCtrlDivQueryStr).css(refreshCtrlCss);
	};

	/**
	 * treat the collision between info box and the esri ctrl
	 * @param  { array } panelRects
	 * @param  { { detected: boolean } } collisionCtrlDetected
	 * @param  { { putToLeft: boolean } } putLeft
	 * @param  { { left:0, top:0, height:0, width:0 } } refreshCss
	 * @returns { void }
	 */
	Tool.prototype._treatInfoBoxEsriCollision = function(panelRects, collisionCtrlDetected, putLeft, refreshCss)
	{
		var self = this;
		collisionCtrlDetected.detected = true;
		// check collision with panel again if turned to the left of logo
		var infoBoxStandAvoidLogoRect = jQuery.extend({}, self._infoBoxStandardRect);
		infoBoxStandAvoidLogoRect.left = self._esriCtrlRect.left - self._infoBoxStandardRectRight - self._infoBoxStandardRect.width;
		if (TF.Graphic.RectCollisionDetector.withCollisionByGroup([infoBoxStandAvoidLogoRect], panelRects))
		{
			putLeft.putToLeft = true;
		}
		else
		{
			refreshCss.left = infoBoxStandAvoidLogoRect.left;
		}
	};

	/**
	 * correct the position of the informationBox if collision detected
	 * @returns {void}
	 */
	Tool.prototype._correctInformationBoxPosition = function()
	{
		var self = this,
			rect = null,
			$informationBox = null,
			generation = (arguments.length === 1);
		self._refreshStandardInfoBoxRect();
		if (generation)
		{
			rect = self._infoBoxStandardRect;
			$informationBox = arguments[0];
		}
		else
		{
			$informationBox = self.$infoWindow;
			rect = TF.Graphic.RectUtility.getElementRects($informationBox)[0];
		}

		if (!rect || $informationBox.length === 0)
		{
			return;
		}

		// refreshErsri rect data and generate refreshCss target for later use
		self._refreshEsriRect();
		var refreshCss =
		{
			left: self._infoBoxStandardRect.left,
			top: self._infoBoxStandardRect.top,
			height: self._infoBoxStandardRect.height,
			width: self._infoBoxStandardRect.width
		},
			putLeft = { putToLeft: false },
			panelRects = TF.Graphic.RectUtility.getElementRects('.routingmap_panel:visible');
		// sort panelRects from right to left with their left value, so when putting the infobox to the left, spacial check could be in sequence
		panelRects.sort(function(a, b)
		{
			return b.left - a.left;
		});

		var withCollision = TF.Graphic.RectCollisionDetector.withCollision,
			withCollisionByGroup = TF.Graphic.RectCollisionDetector.withCollisionByGroup,
			collisionCtrlDetected = { detected: false };

		/*
		if logo status being right and got collision the info box and enough space to contain the info box
		if not enough space but got collision, then put to the left of the panel
		*/

		if (withCollisionByGroup(panelRects, [rect]))
		{
			// if not generation check right bottom first, and then left bottom, then adjust
			if (!generation)
			{
				if (withCollisionByGroup(panelRects, [self._infoBoxStandardRect]))
				{
					putLeft.putToLeft = true;
				}
			}
			else
			{
				putLeft.putToLeft = true;
			}
		}
		else
		{
			// don't refresh if no collision and no generation
			if (!generation)
			{
				if (!withCollision(self._infoBoxStandardRect, self._esriCtrlRect))
				{
					return;
				}
				self._treatInfoBoxEsriCollision(panelRects, collisionCtrlDetected, putLeft, refreshCss);
			}
		}
		if (!collisionCtrlDetected.detected)
		{
			if (withCollision(self._infoBoxStandardRect, self._esriCtrlRect))
			{
				self._treatInfoBoxEsriCollision(panelRects, collisionCtrlDetected, putLeft, refreshCss);
			}
		}

		var panelRectChosenIndex = { index: 0 };
		// if to put to the left of the panel, refresh left of the info box
		if (putLeft.putToLeft)
		{
			refreshCss.left = self._getLeftInfoBoxWithPanelGroups(panelRects, panelRectChosenIndex);
		}

		if (refreshCss.left < 0)
		{
			if (panelRects[panelRectChosenIndex.index].left > 0)
			{
				// panel stick to the right
				refreshCss.left = 0;
			}
			else
			{
				refreshCss.left = self._infoBoxStandardRect.left;
			}
		}

		// calculate relative left top
		var $map = this._getMapContainer();
		var mapOffset = $map.offset();
		refreshCss.left -= mapOffset.left;
		refreshCss.top -= mapOffset.top;
		refreshCss.right = $map.width() - refreshCss.left - refreshCss.width;
		refreshCss.bottom = $map.height() - refreshCss.top - refreshCss.height;
		refreshCss.left = 0;
		refreshCss.top = 'auto';
		$informationBox.css(refreshCss);
	};

	/**
	 * sequentially check the left of the panels, return the first one with enough space
	 * @param  { [ { left:0, right:0, width:0, height:0 }, {...}, ... ] }  panelRects the panel array that stores the rect data of them
	 * @returns {[int, int]} the available left of the panels and the index of the panel chosen to put the box to the left of
	 */
	Tool.prototype._getLeftInfoBoxWithPanelGroups = function(panelRects, panelRectChosenIndex)
	{
		var self = this;
		var infoBoxPanelLeftRect = jQuery.extend({}, self._infoBoxStandardRect);
		for (var panelRectIndex in panelRects)
		{
			infoBoxPanelLeftRect.left = panelRects[panelRectIndex].left - self._infoBoxStandardRectRight - self._infoBoxStandardRect.width;
			if (!TF.Graphic.RectCollisionDetector.withCollisionByGroup([infoBoxPanelLeftRect], panelRects))
			{
				panelRectChosenIndex.index = panelRectIndex;
				return infoBoxPanelLeftRect.left;
			}
		}
	};

	// refresh it as browser size could be changed in the middle
	Tool.prototype._refreshStandardInfoBoxRect = function()
	{
		var self = this;
		var $map = self._getMapContainer();
		var mapOffset = $map.offset();
		self._infoBoxStandardRect.left = $map.width() + mapOffset.left - self._infoBoxStandardRectRight - self._infoBoxStandardRect.width;
		self._infoBoxStandardRect.top = $map.height() + mapOffset.top - self._infoBoxStandardRectBottom - self._infoBoxStandardRect.height;
	};

	// allow subscribe to different events
	Tool.prototype.subscribe = function(event, callback)
	{
		var handler = this._getEventHandlerByName(event);

		if (handler) { handler.subscribe(callback); }
	};

	Tool.prototype.unsubscribe = function(event, callback)
	{
		var handler = this._getEventHandlerByName(event);

		if (handler) { handler.unsubscribe(callback); }
	};

	Tool.prototype._getEventHandlerByName = function(event)
	{
		switch (event)
		{
			case 'onDirectionsChanged':
				return this._onRoutingResultChanged;
			case 'onStopChanged':
				return this._onStopChanged;
			case 'onDropDestinationsChanged':
				return this._onDropDestinationsChanged;
			default:
				return;
		}
	};

	Tool.prototype._disposeLayers = function()
	{

	};

	Tool.prototype._disposeTooltip = function()
	{
		if (this._tooltipGenerated)
		{
			if (this._tooltipGenerated.generated)
			{
				this._tooltipViewModel.destroyTooltip(this._tooltipShown, this._tooltipGenerated);
			}
		}
	};

	Tool.prototype._geographicToWebMercator = function(geometry)
	{
		if (!geometry.spatialReference.isWebMercator)
		{
			geometry = this._arcgis.webMercatorUtils.geographicToWebMercator(geometry);
		}
		return geometry;
	};

	Tool.prototype._getMapRegionExtent = function()
	{
		var self = this,
			mapView = self._map.mapView,
			mapWidth = mapView.width,
			mapHeight = mapView.height,
			tolerance = self._mapAutoPanTolerance,
			$routingMapPanel = self._viewModel.element.find('.routingmap_panel'),
			mapRegionExtent = { NorthWest: [], NorthEast: [], SouthWest: [], SouthEast: [], North: [], South: [], West: [], East: [] };

		$routingMapPanel.each(function()
		{
			var that = this,
				panelWidth = $(that).find(".list-container").outerWidth();

			if (panelWidth > 0)
			{
				mapRegionExtent.North.push.apply(mapRegionExtent.North, [{
					'minX': tolerance,
					'minY': 0,
					'maxX': mapWidth - tolerance,
					'maxY': tolerance
				}]);

				mapRegionExtent.NorthEast.push.apply(mapRegionExtent.NorthEast, [{
					'minX': mapWidth - tolerance,
					'minY': 0,
					'maxX': mapWidth,
					'maxY': tolerance
				}]);

				mapRegionExtent.East.push.apply(mapRegionExtent.East, [{
					'minX': mapWidth - tolerance,
					'minY': tolerance,
					'maxX': mapWidth,
					'maxY': mapHeight - tolerance
				}]);

				mapRegionExtent.SouthEast.push.apply(mapRegionExtent.SouthEast, [{
					'minX': mapWidth - tolerance,
					'minY': mapHeight - tolerance,
					'maxX': mapWidth,
					'maxY': mapHeight
				}]);

				mapRegionExtent.South.push.apply(mapRegionExtent.South, [{
					'minX': tolerance,
					'minY': mapHeight - tolerance,
					'maxX': mapWidth - tolerance,
					'maxY': mapHeight
				}]);

				mapRegionExtent.SouthWest.push.apply(mapRegionExtent.SouthWest, [{
					'minX': 0,
					'minY': mapHeight - tolerance,
					'maxX': tolerance,
					'maxY': mapHeight
				}]);

				mapRegionExtent.West.push.apply(mapRegionExtent.West, [{
					'minX': 0,
					'minY': tolerance,
					'maxX': tolerance,
					'maxY': mapHeight - tolerance
				}]);

				mapRegionExtent.NorthWest.push.apply(mapRegionExtent.NorthWest, [{
					'minX': 0,
					'minY': 0,
					'maxX': tolerance,
					'maxY': tolerance
				}]);
			}
		});

		return mapRegionExtent;
	};

	Tool.prototype.zoomToLayer = function(options)
	{
		var self = this,
			stops = self._stops,
			map = self._map;

		if (!stops || !stops.length)
			return;

		if (stops.length === 1)
		{
			TF.RoutingMap.EsriTool.centerSingleItem(map, self._stopLayer.graphics.toArray()[0]);
		}
		else
		{
			if (!self._tripLayer ||
				!self._tripLayer.graphics ||
				!self._tripLayer.graphics.length)
				return;

			TF.RoutingMap.EsriTool.centerSingleItem(map, self._tripLayer.graphics.toArray()[0]);
		}
	};

	Tool.prototype.getExtentWithPaddingWidth = function(map, extent, options)
	{
		var zoomRate = this.zoomRate(this._map, options);

		var dalterX = extent.xmax - extent.xmin;
		var dalterY = extent.ymax - extent.ymin;

		var dx = (dalterX / zoomRate - dalterX) / 2;
		var dy = (dalterY / zoomRate - dalterY) / 2;

		var newExtent = new this._arcgis.Extent(
			extent.xmin - dx,
			extent.ymin - dy,
			extent.xmax + dx,
			extent.ymax + dy,
			extent.spatialReference
		);

		return newExtent;
	};

	Tool.prototype.zoomRate = function(map, options)
	{
		var mapWidth = map.width;
		var visableMapWidth = map.width;
		options.forEach(function(option)
		{
			visableMapWidth = visableMapWidth - option.width;
		});

		var rate = visableMapWidth / mapWidth;

		var zoomRate = 1;
		if (rate <= 0 || rate >= 1)
			zoomRate = 1;
		else
			zoomRate = rate;

		return zoomRate;
	};

	Tool.prototype._getOffsetCenter = function(map, mapExtent, options)
	{
		var mapWidth = map.width;
		var mapHeight = map.height;

		var mapOffsets = [];
		options.forEach(function(option)
		{
			var tmp = {};
			if (option.dockerPosition === "right")
			{
				tmp.left = option.width / 2 * -1;
			}
			else if (option.dockerPosition === "left")
			{
				tmp.left = option.width / 2 * 1;
			}
			mapOffsets.push(tmp);
		}, this);

		var screenMapCenterX = mapWidth / 2;
		mapOffsets.forEach(function(mapOffset)
		{
			screenMapCenterX = screenMapCenterX - mapOffset.left;
		}, this);

		var screenMapCenterY = mapHeight / 2;
		var screenMapCenterPoint = { x: screenMapCenterX, y: screenMapCenterY };
		var screenMapPoint = this._arcgis.screenUtils.toMapPoint(mapExtent, mapWidth, mapHeight, screenMapCenterPoint);

		return screenMapPoint;
	};

	Tool.prototype._updateRouteSnapBuffer = function(geometry)
	{
		var self = this,
			mapLevel = self._map.mapView.zoom,
			distance = 163 - 8 * mapLevel;  // zoom-based snapping tolerance;
		self._routeGeometry = self._geographicToWebMercator(geometry);
		// self._routeBuffer = self._arcgis.geometryEngine.buffer(self._routeGeometry, distance, "meters", true);
	};

	/**
	 * Update trip geometry if the U-Turn policy changed.
	 * @returns {void}
	 */
	Tool.prototype.refreshTrip = function()
	{
		var self = this;
		if (self._stops && self._stops.length >= 2)
		{
			self._unbindDraggingEvents();
			self._bindDraggingEvents();
			return self._calculateTrip().then(function(results)
			{
				return Promise.resolve(results);
			}).catch(function() { });
		}
	};

	/**
	 * Clear all graphics and events.
	 */
	Tool.prototype.clear = function()
	{
		var self = this;
		self._routeGeometry = null;
		self._draggingRouteGeometry = null;
		self._stopDropMode();
		self._clearLayers();
		self._disposeStops();
		self._unbindDropStopMapEvents();
		self._unbindDraggingEvents();
		self._disposeDragging();
	};

	Tool.prototype.calcRoundTrip = function()
	{
		var self = this;
		self._clearLastThroughPoints();
		self._clearLastWayPoints();
		self._mergeDestinationAndThroughPoints();
		self._refreshDestinationsSymbol();
		if (self._stops.length >= 2)
		{
			self.refreshTrip().then(function(result)
			{
				self._updateDestinationsLabelWithoutOverlap();
				self.notifyStopChanged();

				if (result)
				{
					self._draggingRouteGeometry = result.directions.mergedGeometry;
				}
			});
		}
		else
		{
			self._unbindDraggingEvents();
			self.notifyStopChanged();
			self._draggingRouteGeometry = null;
			self._routeGeometry = null;
			self._routeDirections = null;
			self._tripVertices.length = 0;
			self._tripLayer.removeAll();
			self._arrowLayer.removeAll();
			self._tripVertexLayer.removeAll();
			self._clearWayPoints();
			self.notifyDirectionChanged();
		}
	};

	Tool.prototype.dispose = function()
	{
		var self = this;
		self._lightBasemaps = null;
		self._darkBasemaps = null;
		self._maxDropStopInformationBoxDisplayTimes = null;

		self._wgs84 = null;
		self._webMercator = null;

		self._infoBoxStandardRectBottom = null;
		self._infoBoxStandardRectRight = null;
		self._infoBoxStandardRect = null;
		self._endDropMode();
	};

	Tool.prototype._getMapContainer = function()
	{
		var self = this;
		if (!self._map)
		{
			return null;
		}

		return $(self._map.mapView.container);
	};
})();
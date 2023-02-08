(function()
{
	createNamespace("TF.Map").MapMeasureHelper = MapMeasureHelper;

	/**
	 * The helper taking care of measuring on map.
	 * @param {*} map 
	 * @param {*} arcgis 
	 */
	function MapMeasureHelper(map, arcgis, options)
	{
		var self = this;
		self.map = map;
		self.arcgis = arcgis;
		self.options = $.extend({
			isMobile: false,
			useGreatCircleLine: true
		}, options);

		self.currentType = "distance";
		self.currentUnit = "miles";
		self.defaultUnit = {
			"distance": "miles",
			"area": "squre-miles",
			"location": "degrees"
		};

		self.mapLayers = {};
		self.mapEvents = {};
		self.mapSymbols = {};
		self.domEvents = {};

		self.onDrawTrackPoint = null;
		self.onDrawVertexList = [];
		self.measuredGeometry = null;
		self.isDrawDone = false;
		self.isDrawPause = false;
		self.isActivatePinFeature = true;

		self.mouseDownX = 0;
		self.mouseDownY = 0;
		self.mouseDownTime = 0;
		self.lastClickX = 0;
		self.lastClickY = 0;
		self.lastClickTime = 0;
		self.maxSegment = 500000;

		// For Location, "onMeasure" gives tracking location, "onMeasureEnd" gives pin location.  
		self.onMeasure = new TF.Events.Event();
		self.onMeasureStart = new TF.Events.Event();
		self.onMeasureEnd = new TF.Events.Event();

		self.init();
	};

	MapMeasureHelper.prototype = Object.create(TF.Map.MapMeasureHelper.prototype);
	MapMeasureHelper.prototype.constructor = TF.Map.MapMeasureHelper;

	/**
	 * Initialization.
	 * @return {void}
	 */
	MapMeasureHelper.prototype.init = function()
	{
		var self = this;
		self.initMapSymbols();
	};

	/**
	 * Initialize the symbols that will be used.
	 * @return {void}
	 */
	MapMeasureHelper.prototype.initMapSymbols = function()
	{
		var self = this,
			Color = self.arcgis.Color,
			CartographicLineSymbol = self.arcgis.CartographicLineSymbol;

		if (CartographicLineSymbol)
		{
			self.mapSymbols["line"] = new CartographicLineSymbol(
				CartographicLineSymbol.STYLE_SOLID,
				new Color([40, 128, 252]),
				3,
				CartographicLineSymbol.CAP_BUTT,
				CartographicLineSymbol.JOIN_MITER,
				4
			);
		} else
		{
			self.mapSymbols["line"] = TF.Helper.MapHelper.SimpleLineSymbol(
				{
					style: "solid",
					color: [40, 128, 252],
					width: 3
				}
			);
		}

		self.mapSymbols["vertex"] = TF.Helper.MapHelper.SimpleMarkerSymbol({
			color: [255, 255, 255, 1],
			outline: TF.Helper.MapHelper.SimpleLineSymbol({ width: 1 }),
			size: 8
		});

		self.mapSymbols["fill"] = TF.Helper.MapHelper.SimpleFillSymbol({
			style: 'solid',
			color: [0, 0, 0, 0.5]
		});

		self.mapSymbols["polygon"] = TF.Helper.MapHelper.SimpleFillSymbol({
			style: 'solid',
			outline: self.mapSymbols["line"],
			color: [0, 0, 0, 0.5]
		});
	};

	/**
	 * Initialize the map layers.
	 * @return {void}
	 */
	MapMeasureHelper.prototype.addMapLayers = function()
	{
		// The order of layers in the array affects the display order on map.
		var self = this, temp,
			layerNames = ["measureVertexLayer", "measureLayer"],
			layers = layerNames.map(function(name)
			{
				temp = new self.arcgis.GraphicsLayer({ "id": name });
				self.mapLayers[name] = temp;
				return temp;
			});
		self.map.layers.addMany(layers);
	};

	/**
	 * Remove related layers.
	 * @return {void}
	 */
	MapMeasureHelper.prototype.removeMapLayers = function()
	{
		var self = this, key, layer;
		for (key in self.mapLayers)
		{
			layer = TF.Helper.MapHelper.getLayer(self.map, key);
			if (layer)
			{
				TF.Helper.MapHelper.removeLayer(self.map, layer);
			}
		}
	};

	/**
	 * Activate the measurement tool.
	 * @param {string} type The name of the measurment tool.
	 * @param {string} unit The name of the unit.
	 * @return {void}
	 */
	MapMeasureHelper.prototype.activate = function(type, unitType)
	{
		var self = this;
		self.isDrawPause = false;
		self.currentType = type;
		self.currentUnit = unitType;
		self.addMapLayers();
		self.bindMapEvents();
		TF.Helper.MapHelper.disableDoubleClickZoom(self.map);
		TF.Helper.MapHelper.setMapCursor(self.map, "crosshair");
		self.resetDrawStatus();
	};

	/**
	 * Bind essentail events to the map.
	 * @return {void}
	 */
	MapMeasureHelper.prototype.bindMapEvents = function()
	{
		var self = this;
		if (!self.options.isMobile)
		{
			self.mapEvents["mouse-move"] = TF.Helper.MapHelper.bind(self.map, "mouse-move", self.onMapMouseMove.bind(self));
			self.mapEvents["mouse-down"] = TF.Helper.MapHelper.bind(self.map, "mouse-down", self.onMapMouseDown.bind(self));
			self.mapEvents["mouse-up"] = TF.Helper.MapHelper.bind(self.map, "mouse-up", self.onMapMouseUp.bind(self));
		}
		else
		{
			self.mapEvents["touchstart"] = self.map.on("mouse-down", self.onMapTouchStart.bind(self));
			self.mapEvents["touchend"] = self.map.on("mouse-up", self.onMapTouchEnd.bind(self));
		}
	};

	/**
	 * Unbind the events.
	 * @return {void}
	 */
	MapMeasureHelper.prototype.unbindMapEvents = function()
	{
		var self = this, evtName;
		for (evtName in self.mapEvents)
		{
			self.mapEvents[evtName].remove();
			delete self.mapEvents[evtName];
		}
	};

	/**
	 * The mouse-down event handler on map.
	 * @param {Event} evt The event object.
	 * @return {void}
	 */
	MapMeasureHelper.prototype.onMapMouseDown = function(evt)
	{
		var self = this;
		self.mouseDownX = evt.clientX;
		self.mouseDownY = evt.clientY;
		self.mouseDownTime = Date.now();
	};

	/**
	 * The mouse-up event handler on map.
	 * @param {Event} evt The event object.
	 * @return {void}
	 */
	MapMeasureHelper.prototype.onMapMouseUp = function(evt)
	{
		var self = this,
			mouseSlideBuffer = 5,
			curTime = Date.now(),
			thisMouseX = evt.clientX, thisMouseY = evt.clientY;

		// Considered as a drag, not a click.
		if (evt.which !== 1
			|| Math.abs(thisMouseX - self.mouseDownX) > mouseSlideBuffer
			|| Math.abs(thisMouseY - self.mouseDownY) > mouseSlideBuffer)
		{
			return;
		}

		// Click will be triggered anyway, but if double-click is detected, the drawing will be finished.
		if (curTime - self.lastClickTime > 300
			|| Math.abs(thisMouseX - self.lastClickX) > mouseSlideBuffer / 2
			|| Math.abs(thisMouseY - self.lastClickY) > mouseSlideBuffer / 2)
		{
			self.addNewVertex(evt.mapPoint, false, evt);
		}
		else
		{
			// Double-click detected.
			self.finishDrawing();
		}

		self.lastClickX = thisMouseX;
		self.lastClickY = thisMouseY;
		self.lastClickTime = curTime;
	};

	/**
	 * The mouse-move event handler on map.
	 * @param {Event} evt The event object.
	 * @return {void}
	 */
	MapMeasureHelper.prototype.onMapMouseMove = function(evt)
	{
		var self = this;
		if (!self.isDrawPause && evt.mapPoint)
		{
			self.addNewVertex(evt.mapPoint, true);
			self.map.setMapCursor && self.map.setMapCursor("crosshair");
		}
	};

	/**
	 * 
	 */
	MapMeasureHelper.prototype.onMapTouchStart = function(evt)
	{
		var self = this;
		self.mouseDownX = evt.clientX;
		self.mouseDownY = evt.clientY;
		self.mouseDownTime = Date.now();
	};

	/**
	 * 
	 */
	MapMeasureHelper.prototype.onMapTouchEnd = function(evt)
	{
		var self = this,
			mouseSlideBuffer = 30,
			curTime = Date.now(),
			thisMouseX = evt.clientX, thisMouseY = evt.clientY;

		// Considered as a drag, not a click.
		if (Math.abs(thisMouseX - self.mouseDownX) > mouseSlideBuffer
			|| Math.abs(thisMouseY - self.mouseDownY) > mouseSlideBuffer)
		{
			return;
		}

		// Click will be triggered anyway, but if double-click is detected, the drawing will be finished.
		if (curTime - self.lastClickTime > 300
			|| Math.abs(thisMouseX - self.lastClickX) > mouseSlideBuffer / 2
			|| Math.abs(thisMouseY - self.lastClickY) > mouseSlideBuffer / 2)
		{
			self.addNewVertex(evt.mapPoint, false);
		}
		else
		{
			// Double-click detected.
			self.finishDrawing();
		}

		self.lastClickX = thisMouseX;
		self.lastClickY = thisMouseY;
		self.lastClickTime = curTime;
	};

	/**
	 * Appen a new vertex in the drawing.
	 * @param {Object} mapPoint The map point to be appened.
	 * @param {boolean} isTemp Is this a temporary vertex.
	 * @return {void}
	 */
	MapMeasureHelper.prototype.addNewVertex = function(mapPoint, isTemp, event)
	{
		var self = this, type = self.currentType,
			lonLat = self.getLonLatFromMapPoint(mapPoint),
			onDrawVertexCount = self.onDrawVertexList.length;

		// if this point is the same as the last vertex, it is meaningless to do anything.
		if (onDrawVertexCount === 0
			|| self.onDrawVertexList[onDrawVertexCount - 1][0] !== lonLat[0]
			|| self.onDrawVertexList[onDrawVertexCount - 1][1] !== lonLat[1])
		{
			if (type === "distance")
			{
				self.updateOnDrawLineFeature(lonLat, isTemp);
			}
			else if (type === "area")
			{
				self.updateOnDrawPolygonFeature(lonLat, isTemp);
			}
			else if (type === "location")
			{
				self.updatePinFeature(lonLat, isTemp, event);
			}
		}
	};

	/**
	 * Append a vertex as location.
	 * @param {Array} lonLat The array that contains longitude and latitude. 
	 * @param {boolean} isTrack Whether this is a track (temporary) location
	 * @return {void}
	 */
	MapMeasureHelper.prototype.updatePinFeature = function(lonLat, isTrack, event)
	{
		var self = this, type = "location", unit = self.currentUnit;

		if (isTrack)
		{
			self.onDrawTrackPoint = lonLat;
			self.onMeasure.notify({ type: type, value: lonLat, unit: unit });
		}
		else
		{
			var ptGeometry = new self.arcgis.Point(lonLat);
			self.onDrawVertexList[0] = lonLat;
			if (self.isActivatePinFeature) self.updateGraphic(self.mapLayers["measureLayer"], ptGeometry, self.mapSymbols["vertex"]);
			self.onMeasureEnd.notify({ type: type, value: lonLat, unit: unit, event: event });
		}
	};

	MapMeasureHelper.prototype.activatePinFeature = function()
	{
		this.isActivatePinFeature = true;
	};

	MapMeasureHelper.prototype.deactivatePinFeature = function()
	{
		this.isActivatePinFeature = false;
	};


	/**
	 * Append a vertex to Line feature.
	 * @param {Array} lonLat The array that contains longitude and latitude.
	 * @param {boolean} isTrack Whether this is a temporary vertex.
	 * @return {void}
	 */
	MapMeasureHelper.prototype.updateOnDrawLineFeature = function(lonLat, isTemp)
	{
		var self = this, vertexList = self.onDrawVertexList;

		if (!isTemp)
		{
			if (self.isDrawDone)
			{
				vertexList = [];
				self.resetDrawStatus();
				self.onMeasureStart.notify();
			}

			var vertexGraphic = new self.arcgis.Graphic(new self.arcgis.Point(lonLat), self.mapSymbols["vertex"]);
			self.mapLayers["measureVertexLayer"].add(vertexGraphic);
			self.onDrawVertexList.push(lonLat);
		}

		if (!self.isDrawDone && vertexList.length > 0)
		{
			var lineGeometry = self.createGeometry(vertexList.concat([lonLat]), "line");
			self.updateGraphic(self.mapLayers["measureLayer"], lineGeometry, self.mapSymbols["line"]);
			self.notifyMeasurement(lineGeometry);
		}
	};

	/**
	 * Append a vertex to polygon feature.
	 * @param {Array} lonLat The array that contains longitude and latitude.
	 * @param {boolean} isTrack Whether this is a temporary vertex.
	 * @return {void}
	 */
	MapMeasureHelper.prototype.updateOnDrawPolygonFeature = function(lonLat, isTemp)
	{
		var self = this, layer, vertexList = self.onDrawVertexList.concat([lonLat]);

		if (!isTemp)
		{
			if (self.isDrawDone)
			{
				vertexList = [lonLat];
				self.resetDrawStatus();
				self.onMeasureStart.notify();
			}
			self.onDrawVertexList.push(lonLat);
		}

		if (!self.isDrawDone)
		{
			layer = self.mapLayers["measureLayer"];
			// If there are only two vertices, it should be a line instead of polygon.
			if (vertexList.length === 2)
			{
				var lineGeometry = self.createGeometry(vertexList, "line");
				self.updateGraphic(layer, lineGeometry, self.mapSymbols["line"]);
			}
			else if (vertexList.length > 2)
			{
				TF.Helper.MapHelper.clearLayer(layer);
				var polygonGeometry = self.createGeometry(vertexList, "polygon");
				self.updateGraphic(layer, polygonGeometry, self.mapSymbols["polygon"]);
				self.notifyMeasurement(polygonGeometry);
			}
		}
	};

	/**
	 * Finish current drawing.
	 * @return {void}
	 */
	MapMeasureHelper.prototype.finishDrawing = function()
	{
		var self = this;
		if (self.isDrawDone) { return; }

		var geometryType = false,
			type = self.currentType,
			vertexList = self.onDrawVertexList,
			vertexCount = vertexList.length;
		if (type === "distance" && vertexCount > 1) { geometryType = "line"; }
		else if (type === "area" && vertexCount > 2) { geometryType = "polygon"; }

		if (geometryType)
		{
			var geometry = self.createGeometry(vertexList, geometryType);
			self.updateGraphic(self.mapLayers["measureLayer"], geometry, self.mapSymbols[geometryType]);
			self.notifyMeasurement(geometry);
			self.isDrawDone = true;
		}
	};

	/**
	 * Create line or polygon geometry according to given array of lonLat and type.
	 * @param {Array} vertexList The array of lon and lat.
	 * @param {string} type The geometry type.
	 * @return {Geometry} Esri Geometry object. 
	 */
	MapMeasureHelper.prototype.createGeometry = function(vertexList, type)
	{
		var self = this, geometry, graphic, geodesicGeomtry;
		if (type === "line")
		{
			geometry = new self.arcgis.Polyline(vertexList);
		}
		else if (type === "polygon")
		{
			geometry = new self.arcgis.Polygon(vertexList);
		}

		if (self.options.useGreatCircleLine)
		{
			geodesicGeomtry = new self.arcgis.geometryEngine.geodesicDensify(geometry, self.maxSegment);
			geodesicGeomtry = geodesicGeomtry.type ? geodesicGeomtry : null;
		}
		return geodesicGeomtry || geometry;
	};

	/**
	 * Notify the measurement result.
	 * @param {string} type The measurement type.
	 * @param {Array} vertexList The vertex list on stack.
	 * @return {void}
	 */
	MapMeasureHelper.prototype.notifyMeasurement = function(geometry)
	{
		var self = this, value,
			geometry = geometry || self.measuredGeometry,
			type = self.currentType, unit = self.currentUnit;

		self.measuredGeometry = geometry;
		if (type === "distance" && geometry && geometry.type === "polyline")
		{
			value = self.arcgis.geometryEngine.geodesicLength(geometry, unit);
			self.onMeasureEnd.notify({ type: type, value: value, unit: unit });
		}
		else if (type === "area" && geometry && geometry.type === "polygon")
		{
			// do the simplify to avoid negative result.
			geometry = new self.arcgis.geometryEngine.simplify(geometry);
			if (geometry.type === "polygon")
			{
				value = self.arcgis.geometryEngine.geodesicArea(geometry, unit);
				value = Math.max(value, 0);
				self.onMeasureEnd.notify({ type: type, value: value, unit: unit });
			}
		}
		else if (type === "location")
		{
			var trackLonLat = self.onDrawTrackPoint,
				pinLonLat = self.onDrawVertexList[0];

			if (trackLonLat)
			{
				self.onMeasure.notify({ type: type, value: trackLonLat, unit: unit });
			}
			if (pinLonLat)
			{
				self.onMeasureEnd.notify({ type: type, value: pinLonLat, unit: unit });
			}
		}
	};

	/**
	 * Update the geometry and symbol of the graphic.
	 * The graphic must be the only one in this layer.
	 * @param {Object} layer The target layer. 
	 * @param {Object} geometry New geometry. 
	 * @param {Object} symbol New symbol.
	 * @return {void}
	 */
	MapMeasureHelper.prototype.updateGraphic = function(layer, geometry, symbol)
	{
		var self = this, graphic = TF.Helper.MapHelper.getGraphics(layer)[0];
		if (!graphic)
		{
			layer.add(new self.arcgis.Graphic(geometry, symbol));
		}
		else if (graphic.geometry.type === geometry.type)
		{
			graphic.geometry = geometry;
		}
		else
		{
			graphic.geometry = geometry;
			graphic.symbol = symbol;
			layer.redraw && layer.redraw();
		}
	};

	/**
	 * Set the measurement tool type.
	 * @param {string} type The name of the tool. 
	 * @param {string} unit The name of the unit.
	 * @return {void}
	 */
	MapMeasureHelper.prototype.setTool = function(type)
	{
		var self = this;
		self.currentType = type;
		self.currentUnit = self.defaultUnit[type];
		self.resetDrawStatus();
	};

	/**
	 * Set the measurement unit.
	 * @param {string} unit The name of the unit.
	 * @return {void}
	 */
	MapMeasureHelper.prototype.setUnit = function(unit)
	{
		var self = this, type = self.currentType,
			vertexList = self.onDrawVertexList;
		self.currentUnit = unit;
		self.notifyMeasurement();
	};

	/**
	 * Set the measurement symbol.
	 * @param {string} key The key name of the symbol.
	 * @param {Object} symbol New symbol.
	 * @return {void}
	 */
	MapMeasureHelper.prototype.setSymbol = function(key, symbol)
	{
		this.mapSymbols[key] = symbol;
	};

	/**
	 * Get the longitude and latitude from the map point.
	 * @param {Object} mapPoint The map point.
	 * @param {string} unit The unit name.
	 * @return {Array} The array contains the longitude and latitude.
	 */
	MapMeasureHelper.prototype.getLonLatFromMapPoint = function(mapPoint, unit)
	{
		var self = this, lonLat;
		if (mapPoint.spatialReference.wkid === 102100)
		{
			lonLat = self.arcgis.webMercatorUtils.xyToLngLat(mapPoint.x, mapPoint.y)
		}
		else
		{
			lonLat = [mapPoint.x, mapPoint.y];
		}
		return lonLat;
	};

	/**
	 * Check if there is graphic in stack to be measured.
	 * @return {boolean} true if there is, false if there is not any.
	 */
	MapMeasureHelper.prototype.hasMeasureGraphic = function()
	{
		return this.mapLayers["measureLayer"].graphics.length > 0;
	};

	/**
	 * Pause current drawing.
	 * @return {void}
	 */
	MapMeasureHelper.prototype.pause = function()
	{
		this.isDrawPause = true;
	};

	/**
	 * Pause current drawing.
	 * @return {void}
	 */
	MapMeasureHelper.prototype.resume = function()
	{
		this.isDrawPause = false;
	};

	/**
	 * Reset the status for drawing.
	 * @return {void}
	 */
	MapMeasureHelper.prototype.resetDrawStatus = function()
	{
		var self = this;
		self.isDrawDone = false;
		self.measuredGeometry = null;
		self.onDrawTrackPoint = null;
		self.onDrawVertexList = [];
		self.clearAllFeatures();
	};

	/**
	 * Clear all features from related layers.
	 * @return {void}
	 */
	MapMeasureHelper.prototype.clearAllFeatures = function()
	{
		var self = this, key;
		for (key in self.mapLayers)
		{
			TF.Helper.MapHelper.clearLayer(self.mapLayers[key]);
		}
	};

	/**
	 * Deactivate the measurement tool.
	 * @return {void}
	 */
	MapMeasureHelper.prototype.deactivate = function()
	{
		var self = this;
		self.resetDrawStatus();
		self.removeMapLayers();
		self.unbindMapEvents();
		TF.Helper.MapHelper.enableDoubleClickZoom(self.map);
		TF.Helper.MapHelper.setMapCursor(self.map, "default");
	};

	/**
	 * Dispose.
	 * @return {void}
	 */
	MapMeasureHelper.prototype.dispose = function()
	{
		var self = this;
		self.deactivate();
		self.currentType = null;
		self.currentUnit = null;
		self.onMeasure = null;
		self.onMeasureStart = null;
		self.onMeasureEnd = null;
	};
})();
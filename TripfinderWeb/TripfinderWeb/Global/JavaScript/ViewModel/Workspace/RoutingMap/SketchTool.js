(function()
{
	createNamespace("TF.RoutingMap").SketchTool = SketchTool;

	function SketchTool(map, routingMapDocumentViewModel)
	{
		var self = this;
		self._arcgis = tf.map.ArcGIS;
		self._map = map;
		self.routingMapDocumentViewModel = routingMapDocumentViewModel;
		self.mapEventRemovers = [];
		self.init();
		self.initCurrentStatus();
	}

	SketchTool.prototype.init = function()
	{
		var self = this;
		self._layer = null;
		self._selectLayer = new self._arcgis.GraphicsLayer({ "id": "selectLayer" });
		self._map.add(self._selectLayer);
		self._drawingLayer = new self._arcgis.GraphicsLayer();
		self._map.add(self._drawingLayer);
		self._map.SketchViewModel = new self._arcgis.SketchViewModel({
			view: self._map.mapView,
			layer: self._drawingLayer,
			updateOnGraphicClick: false,
			defaultUpdateOptions: { // set the default options for the update operations
				toggleToolOnClick: false // only reshape operation will be enabled
			}
		});
		self._map.SketchViewModel.activeLineSymbol = new tf.map.ArcGIS.SimpleLineSymbol({
			color: [34, 205, 255, 1], //blue
			width: 2
		})
		self._map.SketchViewModel.activeVertexSymbol = new tf.map.ArcGIS.SimpleMarkerSymbol({
			style: "circle",
			size: 6,
			color: [34, 205, 255, 1],//blue
			outline: {
				color: [50, 50, 50],
				width: 1
			}
		})

		self._bindEvents();
		self.symbol = new TF.Map.Symbol();
	};

	SketchTool.prototype._bindEvents = function()
	{
		this.mapEventRemovers.push(
			this._map.mapView.on("click", this.handleClick.bind(this)),
			this._map.SketchViewModel.on("update", this._graphicUpdateEvent.bind(this)),
			this._map.SketchViewModel.on(["undo", "redo"], this._refreshDuplicateGraphic.bind(this))
		);
	};

	SketchTool.prototype.handleClick = function(event)
	{
		if (this.clickEndTimer != null)
		{
			clearTimeout(this.clickEndTimer);
		}

		this.ctrlKey = event.native.ctrlKey;
		this.rightClickKey = event.button === 2;

		const esriDoubleClickDelay = 250;
		this.clickEndTimer = setTimeout(() =>
		{
			this.ctrlKey = null;
			clearTimeout(this.clickEndTimer);
			this.clickEndTimer = null;
			this.rightClickKey = null;
		}, esriDoubleClickDelay + 1);
	};

	SketchTool.prototype._refreshDuplicateGraphic = function(e)
	{
		e.graphic = e.graphics[0];
		this._moveDuplicateNodeStopEvent(e);
	};

	SketchTool.prototype._graphicUpdateEvent = function(e)
	{
		var self = this;
		if (e.state == "cancel")
		{
			self.stop();
			return self._callback(false);
		}
		var isTransformTool = e.tool == "transform" || e.tool == "move";
		if (e.state == "start" && isTransformTool)
		{
			self._graphicMoveStartEvent(e);
		}
		else if (e.state == "active" && isTransformTool)
		{
			self._graphicMoveEvent(e);
		}
		else if (e.state == "complete" && isTransformTool)
		{
			self._graphicMoveStopEvent(e);
		}
		else if (e.state == "active" && e.tool == "reshape" && (e.toolEventInfo.type == "reshape-start" || e.toolEventInfo.type == "move-start"))
		{
			self._vertexMoveStartEvent(e);
		}
		else if (e.state == "active" && e.tool == "reshape" && (e.toolEventInfo.type == "reshape" || e.toolEventInfo.type == "move"))
		{
			self._vertexMoveEvent(e);
		}
		else if (e.state == "complete" && e.tool == "reshape")
		{
			self._vertexMoveStopEvent(e);
		}
		else if (e.state == "active" && e.tool == "reshape" && (e.toolEventInfo.type == "reshape-stop" || e.toolEventInfo.type == "move-stop"))
		{
			e.graphic = e.graphics[0];
			//self._moveDuplicateNodeStopEvent(e);
			self._moveDuplicateNodeWhileEdit(e);
		}
	};

	SketchTool.prototype.bringLayerToFront = function()
	{
		// comment this to fix RW-21847
		// in 4.12 js api, we have to add this code otherwise when the stop is below the polygon, it cannot be reshaped.
		// but fixed in 4.18, so the code is unnecessary.
		// var layerCount = this._map.allLayers.filter(function(c) { return c.visible; }).length;
		// this._map.reorder(this._drawingLayer, layerCount);
	};

	// #region public methods
	SketchTool.prototype.create = function(geometryType, callback, drawTool)
	{
		var self = this;
		self.stop();
		self.stopRoutingMapTool();
		self.bringLayerToFront();
		self.startDraw(geometryType);
		self._callback = callback;
		self.changeCurrentStatus(drawTool, geometryType, "create");
		self.createListener = self._map.SketchViewModel.on("create", self._createEventHandler.bind(self));
	};

	SketchTool.prototype.select = function(geometryType, layers, callback)
	{
		var self = this;
		self.stop();
		self.stopRoutingMapTool();
		self.startSelect(geometryType);
		self._layers = layers;
		self._callback = callback;
		self.selectListener = self._map.SketchViewModel.on("create", self._selectEventHandler.bind(self));
		self.drawTempGeometry(geometryType);
	};

	SketchTool.prototype.addRegion = function(geometryType, callback, drawTool)
	{
		var self = this;
		self.stop();
		self.stopRoutingMapTool();
		self.startDraw(geometryType);
		self._callback = callback;
		self.changeCurrentStatus(drawTool, geometryType, "addRegion");
		self.regionListener = self._map.SketchViewModel.on("create", self._regionEventHandler.bind(self));
	};

	SketchTool.prototype.removeRegion = function(geometryType, callback, drawTool)
	{
		var self = this;
		self.stop();
		self.stopRoutingMapTool();
		self.startDraw(geometryType);
		self._callback = callback;
		self.changeCurrentStatus(drawTool, geometryType, "removeRegion");
		self.regionListener = self._map.SketchViewModel.on("create", self._regionEventHandler.bind(self));
	};

	SketchTool.prototype.redrawRegion = function(geometryType, callback, drawTool)
	{
		var self = this;
		self.stop();
		self.stopRoutingMapTool();
		self.startDraw(geometryType);
		self._callback = callback;
		self.changeCurrentStatus(drawTool, geometryType, "redrawRegion");
		self.regionListener = self._map.SketchViewModel.on("create", self._regionEventHandler.bind(self));
	};

	SketchTool.prototype.reshape = function(graphic, options, callback, featureTool) 
	{
		var self = this;
		self.bringLayerToFront();
		self._initUpdate(graphic, options, callback);
		//self._changeGraphicSymbolToEdit(graphic);
		self.featureTool = featureTool;
		setTimeout(function()
		{
			self._map.SketchViewModel.update([graphic], {
				tool: "reshape"
			});
		}, 100);
	};

	SketchTool.prototype.transform = function(graphic, options, callback, featureTool) 
	{
		var self = this;
		self.bringLayerToFront();
		self._initUpdate(graphic, options, callback);
		if (options.moveTogetherGraphics) self._moveTogetherGraphics = options.moveTogetherGraphics;
		//self._changeGraphicSymbolToEdit(graphic);
		self.featureTool = featureTool;
		setTimeout(function()
		{
			self._map.SketchViewModel.update([graphic], {
				tool: graphic.geometry.type == "point" ? "move" : "transform"
			});
		}, 100);
	};

	// #endregion
	SketchTool.prototype.initCurrentStatus = function()
	{
		var self = this;
		self.currentDrawTool = null;
		self.currentDrawType = "";
		self.currentDrawStatus = "";
		self.isDrawing = false;
	}

	SketchTool.prototype.changeCurrentStatus = function(drawTool, geometryType, statusType, id)
	{
		var self = this;
		self.currentDrawTool = drawTool;
		self.currentDrawType = geometryType;
		self.currentDrawStatus = statusType;
	}
	// #region event handlers
	SketchTool.prototype._createEventHandler = function(e)
	{
		var self = this;
		if (this.rightClickKey)
		{
			self.clear();
			return;
		}
		if (e.state == "start")
		{
			self.isDrawing = true;
		}
		if (e.state == "complete" && e.graphic)
		{
			if (e.graphic.geometry.type == "polygon" && !tf.map.ArcGIS.geometryEngine.geodesicArea(e.graphic.geometry))
			{
				self.clear();
				return tf.promiseBootbox.alert("please draw a valid polygon!").then(function()
				{
					return self.startDraw("polygon");
				});
			}
			self._callback(e.graphic, { ctrlKey: this.ctrlKey });
			self.initCurrentStatus();
		}
	};

	SketchTool.prototype._regionEventHandler = function(e)
	{
		var self = this;
		if (e.state == "start")
		{
			self.isDrawing = true;
		}
		if (e.state == "complete" && e.graphic)
		{
			self._drawingLayer.removeAll();
			self._callback(e.graphic);
			self.initCurrentStatus();
		}
	};

	SketchTool.prototype._selectEventHandler = function(e)
	{
		var self = this, intersectedGraphics = [];
		if (e.state == "complete" && e.graphic)
		{
			self._selectLayer.removeAll();
			var selectGeom = e.graphic.geometry;
			var selectGeomForPoint = e.graphic.geometry;
			if (selectGeom.type == "point")
			{
				var distance = TF.Helper.MapHelper.convertPxToDistance(self._map, self._arcgis, 25);
				selectGeom = tf.map.ArcGIS.geometryEngine.buffer(e.graphic.geometry, 1, "meters");
				selectGeomForPoint = tf.map.ArcGIS.geometryEngine.buffer(e.graphic.geometry, distance, "meters");

			}
			if (self._layers)
			{
				var promises = [];
				self._layers.forEach(function(layer)
				{
					if (layer.graphics)
					{
						layer.graphics.items.forEach(function(graphic)
						{

							if (self._arcgis.geometryEngine.intersects(graphic.geometry.type == "point" ? selectGeomForPoint : selectGeom, graphic.geometry))
							{
								intersectedGraphics.push(graphic);
							}
						});
						promises.push(Promise.resolve());
					} else
					{
						var query = new tf.map.ArcGIS.Query();
						query.outFields = ["*"];
						query.where = "1=1";
						query.geometry = layer.geometryType == "point" ? selectGeomForPoint : selectGeom;
						query.returnGeometry = true;
						promises.push(layer.queryFeatures(query).then(function(featureSet)
						{
							intersectedGraphics = intersectedGraphics.concat(featureSet.features);
						}));
					}
				});
				Promise.all(promises).then(function()
				{
					self._callback(intersectedGraphics);
				});
			} else
			{
				self._callback([e.graphic]);
			}
		}
	};

	SketchTool.prototype._graphicMoveStartEvent = function(e)
	{
		var self = this;
		$(".menu.context-menu.right-click-menu").remove();

		e.graphic = e.graphics[0];
		// self._oldTransGraphic.geometry = e.geometry;

		// self._currentRightClickPolygon = $.extend(true, {}, e.graphic);
		if (e.graphic.geometry.rings)
		{
			self._oldParcelRings = JSON.parse(JSON.stringify(e.graphic.geometry.rings));
			self._moveDuplicateNodeStartEvent(e);
		}
	};

	SketchTool.prototype._graphicMoveEvent = function(e)
	{
		var self = this;
		// if (self._rightClickonMove) { return; }
		e.graphic = e.graphics[0];
		self._oldTransGraphic = e.graphic;
		// if (e.graphic.geometry.type != "point")
		// {
		self._moveDuplicateNodeEvent(e);
		self._moveOtherGraphics(e, self._moveTogetherGraphics);
		//}
	};

	SketchTool.prototype._graphicMoveStopEvent = function(e)
	{
		var self = this;

		e.graphic = e.graphics[0];
		self._oldTransGraphic = null;
		var touchedGraphics = [];
		if (e.graphic.geometry.type != "point")
		{
			self._moveDuplicateNodeStopEvent(e, "transform");
			touchedGraphics = self._getTouchedCurrentGraphics();
		}
		self._callback([e.graphic].concat(touchedGraphics));
	};

	SketchTool.prototype._vertexMoveStartEvent = function(e)
	{
		var self = this;
		e.graphic = e.graphics[0];
		e.graphic = self._oldTransGraphic;
		self._oldTransGraphic.geometry = e.graphic.geometry;
		self._moveDuplicateNodeStartEvent(e, "reshape");
		// self._vertexSymbolChange(e);
		if (e.graphic.geometry.paths)
		{
			this._oldParcelRings = JSON.parse(JSON.stringify(e.graphic.geometry.paths));
		} else
		{
			this._oldParcelRings = JSON.parse(JSON.stringify(e.graphic.geometry.rings));
		}
	};

	SketchTool.prototype._vertexMoveEvent = function(e)
	{
		var self = this;
		// if (!self._vertexMoving)
		// {
		// 	self._vertexMoveStartEvent(e);
		// }
		e.graphic = self._oldTransGraphic;
		e.graphic.geometry = e.graphics[0].geometry;
		self._oldTransGraphic.geometry = e.graphic.geometry;
		self._vertexMoving = true;
		self._moveDuplicateNodeEvent(e, "reshape");
	};

	SketchTool.prototype._vertexMoveStopEvent = function(e)
	{
		var self = this;
		// self._vertexMoving = false;
		self._vertexMoveEvent(e);
		self._oldTransGraphic = null;
		var touchedGraphics = self._getTouchedCurrentGraphics();
		self._callback([e.graphic].concat(touchedGraphics));
	};

	SketchTool.prototype._moveOtherGraphics = function(e, graphics)
	{
		if (graphics)
		{
			graphics.forEach(function(graphic)
			{
				graphic.geometry = e.graphic.geometry;
			});
		}
	};

	SketchTool.prototype._stopRightClick = function() { };
	// #endregion

	// #region 

	SketchTool.prototype._initUpdate = function(graphic, options, callback)
	{
		var self = this;
		self.stop();
		self._moveDuplicateNode = options.moveDuplicateNode;
		self._oldTransGraphic = graphic;
		self._callback = callback;
		if (options.isFeatureLayer)
		{
			self._layer = self._drawingLayer;
			if (!graphic.symbol) self._changeGraphicSymbolToEdit(graphic)
			self._drawingLayer.add(graphic);
			self._map.SketchViewModel.layer = self._drawingLayer;
		} else
		{
			self._layer = graphic.layer;
			self._map.SketchViewModel.layer = graphic.layer;
		}
	};

	SketchTool.prototype._changeGraphicSymbolToEdit = function(graphic)
	{
		var self = this, graphicType = graphic.geometry.type.toLowerCase();
		switch (graphicType)
		{
			case "point":
				var symbol = self.symbol.editPointSymbol();
				// only normal point can change to gray edit point, otherwise keep original symbol
				if (graphic.symbol && graphic.symbol.type != "simple-marker")
				{
					symbol = graphic.symbol;
				}
				graphic.symbol = symbol;
				break;
			case "polyline":
				graphic.symbol = self.symbol.editPolylineSymbol();
				break;
			case "polygon":
				graphic.symbol = self.symbol.editPolygonSymbol();// graphic.editSymbol ? graphic.editSymbol : graphic.symbol;
				break;
			default:
				break;
		}
	};

	/**
	* start drawing on the map
	* @param  {string}geometryType 'point','polyline','polygon','circle','rectangle','draw'
	*/
	SketchTool.prototype.startDraw = function(geometryType)
	{
		var self = this;
		// close direction draw
		if (self.routingMapDocumentViewModel._directionsTool) self.routingMapDocumentViewModel._directionsTool.stop();

		self._map.SketchViewModel.layer = self._drawingLayer;
		setTimeout(function()
		{
			if (geometryType == "draw")
			{
				self._map.SketchViewModel.create("polygon", { mode: "freehand" });
			}
			else if (geometryType == "polygon")
			{
				self._map.SketchViewModel.create("polygon", { mode: "click" });
			}
			else
			{
				self._map.SketchViewModel.create(geometryType);
			}
		}, 100);
	};

	SketchTool.prototype.startSelect = function(geometryType)
	{
		var self = this;
		self._map.SketchViewModel.layer = self._selectLayer;
		setTimeout(function()
		{
			if (geometryType == "draw")
			{
				self._map.SketchViewModel.create("polygon", { mode: "freehand" });
			}
			else if (geometryType == "polygon")
			{
				self._map.SketchViewModel.create("polygon", { mode: "click" });
			}
			else
			{
				self._map.SketchViewModel.create(geometryType);
			}
		}, 100);
	};

	SketchTool.prototype.stop = function()
	{
		var self = this;
		if (self._map.SketchViewModel.state == "active")
		{
			self._map.SketchViewModel.cancel();
			self.routingMapDocumentViewModel.setMode("", "Normal");
		}
		self._removeEventListeners();
		self.initCurrentStatus();
		self.featureTool = null;
		self._oldTransGraphic = null;
	};

	SketchTool.prototype.stopRoutingMapTool = function()
	{
		this.routingMapDocumentViewModel &&
			this.routingMapDocumentViewModel.RoutingMapTool &&
			this.routingMapDocumentViewModel.RoutingMapTool.inactiveOtherBy();
	};

	SketchTool.prototype.stopAndClear = function()
	{
		var self = this;
		self.stop();
		self.clear();
	};

	SketchTool.prototype.clear = function()
	{
		this._drawingLayer.removeAll();
	};

	SketchTool.prototype._removeEventListeners = function()
	{
		var self = this;
		if (self.createListener) self.createListener.remove();
		if (self.selectListener) self.selectListener.remove();
		if (self.regionListener) self.regionListener.remove();
		// if (self.removeRegionListener) self.removeRegionListener.remove();
		// if (self.redrawRegionListener) self.redrawRegionListener.remove();
	};
	// #endregion

	// #region draw internal methods
	SketchTool.prototype.drawTempGeometry = function(geometryType)
	{
		var self = this;
		switch (geometryType)
		{
			case "point":
				self._map.SketchViewModel.on("create", function(event)
				{
					self.drawTempPoint(event, null);
				});
				break;
			case "polyline":
				self._map.SketchViewModel.on("create", function(event)
				{
					self._drawTempPolyline(event, self.symbol.drawPolylineSymbol());
				});
				break;
			case "draw":
			case "polygon":
			case "rectangle":
			case "circle":
				self._map.SketchViewModel.on("create", function(event)
				{
					self._drawTempPolygon(event, self.symbol.drawPolygonSymbol());
				});
				break;
			default:
				break;
		}
	};

	SketchTool.prototype.drawTempPoint = function(event)
	{
		var self = this;
		self._tempDrawGraphic = null;
		if (event.geometry)
		{
			var tempGraphic = new tf.map.ArcGIS.Graphic({
				geometry: event.geometry,
				symbol: event.symbol
			});
			self._tempDrawGraphic = tempGraphic;
			self._drawingLayer.add(self._tempDrawGraphic);
		}
	};

	SketchTool.prototype._drawTempPolyline = function(event, symbol)
	{
		var self = this;
		self._tempDrawGraphic = null;
		var tempGraphic = new tf.map.ArcGIS.Graphic({
			geometry: event.geometry,
			symbol: symbol
		});
		self._tempDrawGraphic = tempGraphic;
	};

	SketchTool.prototype._drawTempPolygon = function(event, symbol)
	{
		var self = this;
		self._tempDrawGraphic = null;
		var tempGraphic = new tf.map.ArcGIS.Graphic({
			geometry: event.geometry,
			symbol: symbol
		});
		self._tempDrawGraphic = tempGraphic;
	};
	// #endregion

	// #region move duplicate nodes
	SketchTool.prototype._moveDuplicateNodeStartEvent = function(e, type)
	{
		var self = this;
		self.touchedVertexs = {};
		if (self._moveDuplicateNode() && e.graphic.geometry.type != "point")
		{
			var currentGraphicRings = e.graphic.geometry.type == "polyline" ? e.graphic.geometry.paths : e.graphic.geometry.rings;
			var allGraphics = self._getGraphicsByType(e.graphic.geometry);
			for (var i = 0; i < currentGraphicRings.length; i++)
			{
				for (var j = 0; j < currentGraphicRings[i].length; j++)
				{
					var currentRingPoint = e.graphic.geometry.getPoint(i, j);
					allGraphics.map(function(graphic)
					{
						if (graphic.attributes.dataModel.id != e.graphic.attributes.dataModel.id)
						{
							var touchedVertex = self.getTouchedVertexs(currentRingPoint, graphic.geometry.type == "polyline" ? graphic.geometry.paths : graphic.geometry.rings, graphic.geometry.type);

							if (touchedVertex.length > 0)
							{
								if (!self.touchedVertexs.hasOwnProperty(i + "," + j))
								{
									self.touchedVertexs[i + "," + j] = { ringIndex: i, pointIndex: j, touchedGraphicVertexes: [] };
								}
								var rings = JSON.parse(JSON.stringify(graphic.geometry.type == "polyline" ? graphic.geometry.paths : graphic.geometry.rings));
								var touchedGraphicVertex = { graphic: graphic, touchedVertexes: touchedVertex, oldRings: rings };
								self.touchedVertexs[i + "," + j].touchedGraphicVertexes.push(touchedGraphicVertex);
							}
						}
					});
				}
			}
		}
	};

	SketchTool.prototype._moveDuplicateNodeEvent = function(e, type)
	{
		var self = this;
		if (self._moveDuplicateNode() && e.graphic.geometry.type != "point")
		{
			for (var touchedVertex in self.touchedVertexs)
			{
				var v = self.touchedVertexs[touchedVertex];
				var point = e.graphic.geometry.getPoint(v.ringIndex, v.pointIndex);
				if (point)
				{
					self.setRingsInternal(point, v.touchedGraphicVertexes);
				}
			}
		}
	};
	SketchTool.prototype._moveDuplicateNodeWhileEdit = function(e)
	{
		var self = this;
		self._moveDuplicateNodeStopEvent(e);
		if (!self._moveDuplicateNode() || !self.featureTool || !self.featureTool._viewModal.routingSnapManager.isEnableSnapping || e.graphic.geometry.type == "point") return;
		var layer = self.featureTool.getLayer(e.graphic.geometry.type);
		var graphics = self._findGraphicsInLayer(e, e.graphic.geometry);
		if (graphics && graphics.length > 0)
		{
			var newTouchedGraphics = graphics.filter(function(g) { return self.featureTool._oldGraphics.filter(function(og) { return og.attributes.id == g.attributes.id }).length == 0 && g.attributes.oid })
			self.featureTool._oldGraphics = self.featureTool._oldGraphics.concat(newTouchedGraphics);
			var promise = Promise.resolve();
			if (newTouchedGraphics && newTouchedGraphics.length > 0)
			{
				promise = layer.applyEdits({ deleteFeatures: newTouchedGraphics });
			}
			promise.then(function()
			{
				var others = newTouchedGraphics.filter(function(c) { return c.attributes.id != e.graphic.attributes.id; });
				others.forEach(function(g)
				{
					g.symbol = self.featureTool._editingLayer.renderer.defaultSymbol || self.featureTool._editingLayer.renderer.symbol;
				});
				self._drawingLayer.addMany(others);
				self._moveDuplicateNodeStartEvent(e);
			});
		}
	};

	SketchTool.prototype._findGraphicsInLayer = function(e, geometry)
	{
		var self = this;

		var all = self.featureTool.dataModel.all;
		var extent = geometry.extent;
		var records = [];
		if (!$.isArray(all))
		{
			for (var key in all)
			{
				if (extent.intersects(all[key].geometry)) 
				{
					records.push(all[key]);
				}
			}
		} else
		{
			records = all.filter(function(item)
			{
				records.push(all[key]);
				return extent.intersects(item.geometry);
			});
		}

		if (geometry.type == "polyline") return self._findTouchedGraphics(e.graphic, records).polylines;
		else if (geometry.type == "polygon") return self._findTouchedGraphics(e.graphic, records).polygons;
		else if (geometry.type == "point") return self._findTouchedGraphics(e.graphic, records).points;

	}

	SketchTool.prototype._findTouchedGraphics = function(targetGraphic, source)
	{
		var self = this;
		//var target = source.filter(function(c) { return c.id == id; })[0];
		var touchGraphics = [];
		var others = source.filter(function(c) { return c.id != targetGraphic.attributes.id; });
		others.forEach(function(graphic)
		{
			var touches = tf.map.ArcGIS.geometryEngine.touches(targetGraphic.geometry, graphic.geometry);
			if (touches && self.featureTool._isTouchVertex(targetGraphic, graphic))
			{
				touchGraphics.push(graphic);
			}
		});
		var data = [targetGraphic].concat(touchGraphics);
		return this.featureTool.itemsToGraphics(data);
	};

	SketchTool.prototype._getTouchedCurrentGraphics = function()
	{
		var self = this, graphics = [], uniqueResults = [];
		for (var touchedVertex in self.touchedVertexs)
		{
			var v = self.touchedVertexs[touchedVertex];
			for (var i = 0; i < v.touchedGraphicVertexes.length; i++)
			{
				graphics.push(v.touchedGraphicVertexes[i].graphic);
				// var evt = { graphic: v.touchedGraphicVertexes[i].graphic };
				// self._removeOverlap(evt, v.touchedGraphicVertexes[i].oldRings, "transform");

			}
		}
		// graphics.push(e.graphic);
		$.each(graphics, function(i, el)
		{
			if ($.inArray(el, uniqueResults) === -1)
			{
				uniqueResults.push(el);
				el.oldRings = self._getTouchedGraphicOldRings(el);
			}
		});
		return uniqueResults;
	};

	SketchTool.prototype._getTouchedGraphicOldRings = function(graphic)
	{
		var self = this, oldRings = self._oldParcelRings;
		for (var touchedVertex in self.touchedVertexs)
		{
			var v = self.touchedVertexs[touchedVertex];
			for (var i = 0; i < v.touchedGraphicVertexes.length; i++)
			{
				if (v.touchedGraphicVertexes[i].graphic.attributes.dataModel.id == graphic.attributes.dataModel.id)
				{
					oldRings = v.touchedGraphicVertexes[i].oldRings;
				}
			}
		}
		return oldRings;

	};

	SketchTool.prototype.setRingsInternal = function(mapPoint, touchedGraphicVertexes)
	{
		for (var i = 0; i < touchedGraphicVertexes.length; i++)
		{
			var touchedGraphicVertex = touchedGraphicVertexes[i];
			var rings = touchedGraphicVertex.graphic.geometry.type == "polyline" ? touchedGraphicVertex.graphic.geometry.paths : touchedGraphicVertex.graphic.geometry.rings;
			var touchedVertexes = touchedGraphicVertex.touchedVertexes;
			for (var j = 0; j < touchedVertexes.length; j++)
			{
				var touchedVertex = touchedVertexes[j];
				rings[touchedVertex.indexI].splice(touchedVertex.indexJ, 1, [mapPoint.x, mapPoint.y]);
				if (touchedVertex.indexJ == 0 && touchedGraphicVertex.graphic.geometry.type != "polyline")
				{
					rings[touchedVertex.indexI].splice(rings[touchedVertex.indexI].length - 1, 1, [mapPoint.x, mapPoint.y]);
				}
			}
			var poly = null;
			if (touchedGraphicVertex.graphic.geometry.type == "polyline")
			{
				poly = new this._arcgis.Polyline(this._map.mapView.spatialReference);
				poly.paths = rings;
			}
			else
			{
				poly = new this._arcgis.Polygon({
					rings: rings,
					spatialReference: this._map.mapView.spatialReference
				});
			}
			touchedGraphicVertex.graphic.geometry = poly;
		}
	};

	SketchTool.prototype.getTouchedVertexs = function(geometry, rings, type)
	{
		if (!geometry)
		{
			return [];
		}
		var touchedVertexIndexes = [];
		type = type ? type : "polygon";
		for (var i = 0; i < rings.length; i++)
		{
			for (var j = 0; j < rings[i].length; j++)
			{
				if (type != "polyline" && j == (rings[i].length - 1)) continue;

				var point = rings[i][j];
				if (this._isOnVertex(geometry, point))
				{
					touchedVertexIndexes.push({ indexI: i, indexJ: j });
				}
			}
		}
		return touchedVertexIndexes;
	};

	SketchTool.prototype._isOnVertex = function(point, xyArray)
	{
		let toleranceXY = 0.01;
		if (Math.abs(point.x - xyArray[0]) < toleranceXY && Math.abs(point.y - xyArray[1]) < toleranceXY)
		{
			return true;
		}
		return false;
	}

	SketchTool.prototype._getGraphicsByType = function(polygon)
	{
		var self = this;
		var graphics = self._getGraphicsWithinCurrentPolygonBuffer(self._layer.graphics.items, polygon);
		return graphics;
		// return this.drawTool._polygonLayer.graphics;
	};

	SketchTool.prototype._getGraphicsWithinCurrentPolygonBuffer = function(graphics, polygon)
	{
		var self = this;
		// var buffer = self._arcgis.geometryEngine.buffer(polygon, distance, "meters");
		var intersectGraphics = [];
		graphics.forEach(function(graphic)
		{
			if (self._arcgis.geometryEngine.intersects(graphic.geometry, polygon))
			{
				intersectGraphics.push(graphic);
			}
		}, this);
		return intersectGraphics;
	};

	SketchTool.prototype._moveDuplicateNodeStopEvent = function(e, type)
	{
		var self = this;
		if (self._moveDuplicateNode() && e.graphic.geometry.type != "point")
		{
			for (var touchedVertex in self.touchedVertexs)
			{
				var v = self.touchedVertexs[touchedVertex];
				var point = e.graphic.geometry.getPoint(v.ringIndex, v.pointIndex);
				self.setRingsInternal(point, v.touchedGraphicVertexes);
			}
		}
		// self.viewModel._viewModal.toggleSnap();
	};

	SketchTool.prototype._getTouchedGraphicOldRings = function(graphic)
	{
		var self = this, oldRings = self._oldParcelRings;
		for (var touchedVertex in self.touchedVertexs)
		{
			var v = self.touchedVertexs[touchedVertex];
			for (var i = 0; i < v.touchedGraphicVertexes.length; i++)
			{
				if (v.touchedGraphicVertexes[i].graphic.attributes.dataModel.id == graphic.attributes.dataModel.id)
				{
					oldRings = v.touchedGraphicVertexes[i].oldRings;
				}
			}
		}
		return oldRings;

	};
	// #endregion

	SketchTool.prototype.dispose = function()
	{
		var self = this;

		self.symbol.dispose();
		self.mapEventRemovers.forEach(x => x.remove());
		self._removeEventListeners();
		self._map.SketchViewModel.destroy();

		tfdispose(this);
	}
})();
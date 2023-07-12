(function()
{
	createNamespace("TF.RoutingMap").BaseEditTool = BaseEditTool;

	function BaseEditTool(map, arcgis, contextMenuEvent, viewModel)
	{
		var self = this;
		self._map = map;
		self._arcgis = arcgis;
		self._mapView = self._arcgis.V4 ? viewModel.getMapView() : null;
		this.contextMenuEvent = contextMenuEvent;
		this._editToolbar = null;

		this.viewModel = viewModel;
		this.isEditing = false;
		this.drawTool = null;
		this.bindTag = false;
		this.EditParcelOperation = {};
		this.touchedVertexs = {};
		this.isActivated = false;

		// dataModel Events
		this.onVertexLeftClick = new TF.Events.Event();
		this.selectionChange = new TF.Events.Event();
		this.deleteChange = new TF.Events.Event();
		this.stopEditing = new TF.Events.Event();
		this.deleteChange_onCentroidDelete = new TF.Events.Event();

		// symbols
		this._ghostVertexSymbol = tf.map.ArcGIS.V4 ? new this._arcgis.SimpleMarkerSymbol({
			color: [0, 0, 0, 255],
			size: 6,
			xoffset: 0,
			yoffset: 0,
			style: "circle",
		}) : new this._arcgis.SimpleMarkerSymbol({
			"color": [0, 0, 0, 255],
			"size": 6,
			"xoffset": 0,
			"yoffset": 0,
			"type": "esriSMS",
			"style": "esriSMSCircle",
		});

		this._options = { allowAddVertices: true, allowDeleteVertices: true, vertexSymbol: self._vertexSymbol, ghostVertexSymbol: self._ghostVertexSymbol };

		// map events
		this._mapKeyESCDown = null;

		// graphics
		this._currentRightClickPolygon = null;
		this._currentSelectedVertex = null;
		this._tempSVGLayer = null;
		this._oldTransGraphic = null;
		this.switchEditParcel = this.switchEditParcel.bind(this)
	}
	BaseEditTool.prototype.initializeBase = function()
	{
		var self = this;
		self._editToolbar = tf.map.ArcGIS.V4 ? new self._arcgis.SketchViewModel({
			view: self._mapView
		}) : new self._arcgis.Edit(self._map);
		self._tempCentroidLayer = new self._arcgis.GraphicsLayer({ 'id': "tempCentroidLayer" });
		self._tempSVGLayer = new self._arcgis.GraphicsLayer();
		self._tempSVGLayer._intersects = function() { return [0] }
		tf.map.ArcGIS.V4 ? self._map.layers.addMany([self._tempCentroidLayer, self._tempSVGLayer]) : self._map.addLayers([self._tempCentroidLayer, self._tempSVGLayer]);
		PubSub.subscribe("DocumentManagerViewModel_TabChange", self.switchEditParcel);

	}
	BaseEditTool.prototype.getViewModel = function()
	{
		return this.viewModel;
	}
	BaseEditTool.prototype._bindEventsBase = function()
	{
		if (this.bindTag)
		{
			return false;
		}

		if (tf.map.ArcGIS.V4)
		{
			this._editToolbar.on("move-start", this._graphicMoveStartEvent.bind(this));
			this._editToolbar.on("move", this._graphicMoveEvent.bind(this));
			this._editToolbar.on("move-complete", this._graphicMoveStopEvent.bind(this));
			this._editToolbar.on("rotate-complete", this._transformStopEvent.bind(this));
			this._editToolbar.on("scale-complete", this._transformStopEvent.bind(this));
			//this._editToolbar.on("reshape", this._transformStopEvent.bind(this));
			this._editToolbar.on("update-complete", this._stopRightClick.bind(this));
			this._editToolbar.on("update-cancel", this._stopRightClick.bind(this));
			this._editToolbar.on("reshape-start", this._vertexMoveStartEvent.bind(this));
			this._editToolbar.on("reshape", this._vertexMoveEvent.bind(this));
			this._editToolbar.on("reshape-complete", this._vertexMoveStopEvent.bind(this));
		}
		else
		{
			this._editToolbar.on("vertex-click", this._vertexClickEvent.bind(this));
			this._editToolbar.on("vertex-first-move", this._vertexMoveStartEvent.bind(this));
			this._editToolbar.on("vertex-move", this._vertexMoveEvent.bind(this));
			this._editToolbar.on("vertex-move-stop", this._vertexMoveStopEvent.bind(this));
			this._editToolbar.on("graphic-move-start", this._graphicMoveStartEvent.bind(this));
			this._editToolbar.on("graphic-move-stop", this._graphicMoveStopEvent.bind(this));
			this._editToolbar.on("graphic-move", this._graphicMoveEvent.bind(this));
			this._editToolbar.on("rotate-stop", this._transformStopEvent.bind(this));
			this._editToolbar.on("scale-stop", this._transformStopEvent.bind(this));
			this._editToolbar.on("deactivate", this.isToolActivated.bind(this, false));
			this._editToolbar.on("activate", this.isToolActivated.bind(this, true));
			this._map.on("click", this._stopRightClick.bind(this));
		}
		this._editToolbar.on("scale-start", this._transformStartEvent.bind(this));
		this._editToolbar.on("scale", this._transformEvent.bind(this));
		this._editToolbar.on("rotate-start", this._transformStartEvent.bind(this));
		this._editToolbar.on("rotate", this._transformEvent.bind(this));

		return true;

	}

	BaseEditTool.prototype.isToolActivated = function(param)
	{
		this.isActivated = param;
	};

	BaseEditTool.prototype.switchEditParcel = function(eventKey, document)
	{
		var self = this;
		if (document && document._map && document._map.id === self._map.id)
		{
			for (var key in self.EditParcelOperation)
			{
				if (self.EditParcelOperation[key] === "moveAddressPoint")
				{
					self.rightPointClickEdit("movePoint", parseInt(key));
				}
				else
				{
					self.rightClickEdit(self.EditParcelOperation[key], parseInt(key), true);
				}
			}
		}
		else if (document && document._map && document._map.id !== self._map.id)
		{
			self._stopRightClick(null, true);
		}
	};

	BaseEditTool.prototype._makeRightMenuClickableWhenMoving = function(graphicMover)
	{
		var self = this;
		if (graphicMover._moveable)
		{
			graphicMover._moveable.onMouseDown = graphicMover._moveable.onMouseDown.createInterceptor(function(evt)
			{
				if (evt.button == 2)
				{
					evt.mapPoint = self._map.toMap({ x: evt.layerX, y: evt.layerY });
					if (self.viewModel._viewModal.contextMenu && self.viewModel._viewModal.contextMenu.showContextMenu)
					{
						self.viewModel._viewModal.contextMenu.show(evt, evt.mapPoint);
					} else
					{
						self.viewModel._viewModal.onRightClickMenu(evt);
					}
				}
			});
			graphicMover._moveable.onMoveStart = graphicMover._moveable.onMoveStart.createInterceptor(function()
			{
				self.contextMenuEvent && self.contextMenuEvent.removeContextMenu.call(self.contextMenuEvent);
				self._rightClickonMove = false;
				return true;
			});
			graphicMover._moveable.onMoving = graphicMover._moveable.onMoving.createInterceptor(function(graphic, moveDiff, event)
			{
				if (moveDiff.dx != 0 && moveDiff.dy != 0)
				{
					self.isMoving = true;
					self.contextMenuEvent && self.contextMenuEvent.removeContextMenu.call(self.contextMenuEvent);
				}
			});
			graphicMover._moveable.onMoveStop = graphicMover._moveable.onMoveStop.createInterceptor(function()
			{
				self.isMoving = false;
			});
		}

	};

	BaseEditTool.prototype._vertexClickEvent = function(e)
	{
		this._currentSelectedPoint = null;
		this._vertexSymbolChange(e);
		if (!e.vertexinfo.isGhost)
		{
			this._currentSelectedVertex = e;
			this._notifyEditParcelPanel(e);
		}
	};

	BaseEditTool.prototype._vertexSymbolChange = function() { };

	BaseEditTool.prototype._notifyEditParcelPanel = function(e)
	{
	};

	BaseEditTool.prototype._graphicMoveStartEvent = function(e)
	{
		var self = this;
		self._transformStartEvent(e);
		if (!tf.map.ArcGIS.V4)
		{
			self._map.disableScrollWheelZoom();
		}
	};

	BaseEditTool.prototype._graphicMoveEvent = function(e)
	{
		var self = this;
		if (self._rightClickonMove) { return; }
		if (tf.map.ArcGIS.V4)
		{
			e.transform = e;
		}
		if (e.transform && (e.transform.dx || e.transform.dy)) self._transformEvent(e);
	};
	BaseEditTool.prototype._graphicMoveStopEvent = function(e)
	{
		var self = this;
		if (tf.map.ArcGIS.V4)
		{
			// point dx and dy is always 0 , so add the type verify to fix this bug
			if (!e.dx && !e.dy && e.geometry.type != "point") return;
		}
		else
		{
			self._map.enableScrollWheelZoom();
			if (!e.transform || (!e.transform.dx && !e.transform.dy)) return;
			if (self._rightClickonMove) { return; }
		}
		self._transformStopEvent(e);
	};

	BaseEditTool.prototype._transformStartEvent = function(e)
	{
		var self = this;
		$(".menu.context-menu.right-click-menu").remove();
		if (tf.map.ArcGIS.V4)
		{
			e.graphic = self._oldTransGraphic;
			e.graphic.geometry = e.geometry;
			self._oldTransGraphic.geometry = e.geometry;
		}
		self.drawTool._currentRightClickPolygon = $.extend(true, {}, e.graphic);
		if (e.graphic.geometry.rings)
		{
			this._oldParcelRings = JSON.parse(JSON.stringify(e.graphic.geometry.rings));
			if (!tf.map.ArcGIS.V4)
			{
				self._editToolbar._boxEditor.suspend();
			}

			self._moveDuplicateNodeStartEvent(e);
		}

	};
	BaseEditTool.prototype._transformEvent = function(e)
	{
		var self = this;
		if (tf.map.ArcGIS.V4)
		{
			e.graphic = self._oldTransGraphic;
			e.graphic.geometry = e.geometry;
			self._oldTransGraphic.geometry = e.geometry;
		}
		self._moveDuplicateNodeEvent(e);

	}
	BaseEditTool.prototype._transformStopEvent = function(e)
	{
		var self = this;
		var ids = [];
		if (tf.map.ArcGIS.V4)
		{
			e.graphic = self._oldTransGraphic;
			e.graphic.geometry = e.geometry;
			self._oldTransGraphic.geometry = e.geometry;
		}
		self._moveDuplicateNodeStopEvent(e, "transform");

		var result = self._removeOverlap && self._removeOverlap(e, self._oldParcelRings, "transform");
		self._getTouchedCurrentGraphics(e).map(function(graphic)
		{
			var oldRings = self._getTouchedGraphicOldRings(graphic);

			self._donutFunc(graphic, oldRings);

			result = result.concat(self._removeOverlap({ graphic: graphic }, oldRings, "transform"));
			ids[graphic.attributes.dataModel.id] = true;
			if (graphic.attributes.dataModel.relateId) ids[graphic.attributes.dataModel.relateId] = true;
		});
		self._editToolbar._boxEditor && self._editToolbar._boxEditor.resume();
		ids[e.graphic.attributes.dataModel.id] = true;
		if (e.graphic.attributes.dataModel.relateId) ids[e.graphic.attributes.dataModel.relateId] = true;
		self._notifyEdit(ids);
		self.drawTool.saveInfoForRevert(result);
	};

	BaseEditTool.prototype._changeNotifyDataModel = function(graphic)
	{
		var ids = [];
		//graphic.attributes.dataModel.geometry = graphic.geometry;
		ids[graphic.attributes.dataModel.id] = true;
		if (graphic.attributes.dataModel.relateId) ids[graphic.attributes.dataModel.relateId] = true;
		this._notifyEdit(ids);
	}
	BaseEditTool.prototype._revertandNotifyTouchedGeometry = function(e)
	{
		var self = this, isTransform = true;
		//self._moveDuplicateNodeStopEvent(e, "transform");
		self._getTouchedCurrentGraphics(e).map(function(g)
		{
			if (g.attributes.dataModel.id == e.graphic.attributes.dataModel.id)
			{
				isTransform = false;
			}
			var oldPolygon = null;
			var rings = self._getTouchedGraphicOldRings(g);
			if (tf.map.ArcGIS.V4)
			{
				oldPolygon = new self._arcgis.Polygon({
					rings: rings,
					spatialReference: self._mapView.spatialReference
				});
				g.geometry = oldPolygon;
			} else
			{
				oldPolygon = new self._arcgis.Polygon(self._map.spatialReference);
				oldPolygon.rings = self._getTouchedGraphicOldRings(g);
				g.setGeometry(oldPolygon);
			}
			var dataModel = self.drawTool.createCopyDataModel(g);
			//g.attributes.dataModel.geometry = oldPolygon;
			self.stopEditing.notify([dataModel]);
		});
		if (!isTransform)
		{
			var oldGeometry = null;
			var graphic = self.drawTool.findPolygonById(self.drawTool._currentRightClickPolygon.attributes.dataModel.id);
			if (tf.map.ArcGIS.V4)
			{
				oldGeometry = new self._arcgis.Polygon({
					rings: self._oldParcelRings,
					spatialReference: self._mapView.spatialReference
				});
				graphic.geometry = oldGeometry;
			} else
			{
				oldGeometry = new self._arcgis.Polygon(self._map.spatialReference);
				oldGeometry.rings = self._oldParcelRings;
				graphic.setGeometry(oldGeometry);
			}
			var dataModel = self.drawTool.createCopyDataModel(graphic);
			//graphic.attributes.dataModel.geometry = oldGeometry;
			self.stopEditing.notify([dataModel]);
			self._stopEditPolygon();
		}
	}
	BaseEditTool.prototype._getTouchedCurrentGraphics = function(e)
	{
		var self = this, graphics = [], uniqueResults = [];
		for (var touchedVertex in self.touchedVertexs)
		{
			var v = self.touchedVertexs[touchedVertex];
			for (var i = 0; i < v.touchedGraphicVertexes.length; i++)
			{
				graphics.push(v.touchedGraphicVertexes[i].graphic);
				//var evt = { graphic: v.touchedGraphicVertexes[i].graphic };
				//self._removeOverlap(evt, v.touchedGraphicVertexes[i].oldRings, "transform");

			}
		}
		//graphics.push(e.graphic);
		$.each(graphics, function(i, el)
		{
			if ($.inArray(el, uniqueResults) === -1) uniqueResults.push(el);
		});
		return uniqueResults;
	}
	BaseEditTool.prototype._getTouchedGraphicOldRings = function(graphic)
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

	}
	/**
	 * Vertex move-start event handler. Fires any time before the moving/dragging of a parcel vertex.
	 * @param  {MouseEvent} e A standard DOM MouseEvent with additional properties mapPoint and screenPoint.
	 * @returns {void}
	 */
	BaseEditTool.prototype._vertexMoveStartEvent = function(e)
	{
		var self = this;
		if (tf.map.ArcGIS.V4)
		{
			e.graphic = self._oldTransGraphic;
			e.graphic.geometry = e.geometry;
			self._oldTransGraphic.geometry = e.geometry;
		}
		self._moveDuplicateNodeStartEvent(e, "reshape");
		self._vertexSymbolChange(e);
		if (e.graphic.geometry.paths)
		{
			this._oldParcelRings = JSON.parse(JSON.stringify(e.graphic.geometry.paths));
		} else
		{
			this._oldParcelRings = JSON.parse(JSON.stringify(e.graphic.geometry.rings));
		}
	};

	BaseEditTool.prototype._vertexMoveEvent = function(e)
	{
		var self = this;
		if (tf.map.ArcGIS.V4)
		{
			e.graphic = self._oldTransGraphic;
			e.graphic.geometry = e.geometry;
			self._oldTransGraphic.geometry = e.geometry;
		}
		self._moveDuplicateNodeEvent(e, "reshape");
	}

	BaseEditTool.prototype._vertexMoveStopEvent = function(e)
	{
		var self = this;
		if (tf.map.ArcGIS.V4)
		{
			e.graphic = self._oldTransGraphic;
			e.graphic.geometry = e.geometry;
			self._oldTransGraphic.geometry = e.geometry;
		}
		self._moveDuplicateNodeStopEvent(e, "reshape");
	}

	BaseEditTool.prototype._onMapKeyDown = function(e)
	{
		var key = "";
		// if (e && e.code)
		// {
		// 	key = e.code;
		// }
		// else if (e && e.key)
		// {
		key = e.key;
		// }
		switch (key)
		{
			case "Delete":
				this.deleteSelectedNode();
				this.drawTool._removeEvent();
				break;
			case "Escape":
				this._stopRightClick(e, null, true);
				this.viewModel._viewModal.setMode(this.drawTool.getPaletteName(), "Normal");
				this.drawTool._removeEvent();
				TF.RoutingMap.ContextMenuBase.prototype.removeContextMenu();
				break;
		}
	};
	BaseEditTool.prototype._removeEvent = function()
	{
		var self = this;
		if (self._mapKeyESCDown)
		{
			self._mapKeyESCDown.remove();
			self._mapKeyESCDown = null;
		}
		if (self._mapMouseMove)
		{
			self._mapMouseMove.remove();
			self._mapMouseMove = null;
		}
	};
	BaseEditTool.prototype._bindEvents = function() { }
	BaseEditTool.prototype.stopBase = function(e, stopByTabChange)
	{
		var self = this;
		if (self.editingGraphic)
		{
			self.viewModel._viewModal.onStopEditingEvent.notify();
		}
		self._removeEvent();
		self.isEditing = false;
		self.rightClickMode = "";
		self._currentSelectedVertex = null;
		self.drawTool.changeSymbolToNotEditing();
		if (!tf.map.ArcGIS.V4)
		{
			self._map.disableKeyboardNavigation();
		}
		if (!stopByTabChange)
		{
			self.EditParcelOperation = {};
		}
		self.reorderLayerBack();
	};

	BaseEditTool.prototype._stopRightClick = function(e, stopByTabChange)
	{
		var self = this;
		if (self.rightClickMode == "transform" ||
			self.rightClickMode == "reshape" || self.rightClickMode == "movePoint")
		{
			if (self._oldTransGraphic)
			{
				self._oldTransGraphic.visible = true;
				self._oldTransGraphic.attributes.dataModel.Visible = 1;
			}
			self.stop(e, stopByTabChange);
			if (!stopByTabChange)
			{
				PubSub.publish("clear_ContextMenu_Operation");
			}
		}
	};

	BaseEditTool.prototype.reorderLayerToTop = function(layers)
	{
		var self = this;
		layers = self.getViewModel().getLayers();
		var startIndex = self._map.graphicsLayerIds.length;

		// backup original order
		self._map.graphicsLayerIds.forEach(function(layerId, index)
		{
			layers.forEach(function(layer)
			{
				if (layer.id == layerId)
				{
					layer.originalOrder = index;
				}
			});
		});

		if ($.isArray(layers))
		{
			layers.forEach(function(layer)
			{
				if (layer)
				{
					self._map.reorderLayer(layer, startIndex);
					startIndex++;
				}
			});
		}
	};

	BaseEditTool.prototype.reorderLayerBack = function()
	{
		var self = this;
		var layers = self.getViewModel().getLayers();
		if ($.isArray(layers))
		{
			layers = layers.sort(function(a, b) { return a.originalOrder - b.originalOrder; });
			layers.forEach(function(layer)
			{
				if (layer && layer.originalOrder)
				{
					self._map.reorderLayer(layer, layer.originalOrder);
				}
			});
		}
	};

	BaseEditTool.prototype.rightClickEdit = function(type, id, stopByTapChange)
	{
		var self = this;
		self.reorderLayerToTop();
		self.drawTool._removeEvent();
		self.drawTool._numMapMouseDown = 0;
		self.viewModel._viewModal.setMode(self.drawTool.getPaletteName(), "Normal");
		self._bindEvents();
		var graphic = this.drawTool.findPolygonById(id);

		self.drawTool._currentRightClickPolygon = $.extend(true, {}, graphic);
		if (!stopByTapChange)
		{
			self._oldParcelForRevert = graphic.geometry.clone();
			if (graphic.attributes.dataModel.relateId)
			{
				self._oldPointForRevert = self._findCentroidById(graphic.attributes.dataModel.relateId).geometry.clone();
			}
			self.drawTool._currentRightClickPolygonId = id;
		}

		self.drawTool.changeSymbolToEditing(id);
		if (graphic)
		{
			self.rightClickMode = type;
			self.editingGraphic = graphic;
			switch (type)
			{
				case "reshape":
					self._startEditPolygon("reshape", graphic);
					break;
				case "movePoint":
					// var centroid = self._findCentroidById(graphic.attributes.dataModel.relateId, graphic.attributes.dataModel);
					self._startEditPoint(graphic);
					break;
				case "transform":
					self._startEditPolygon("transform", graphic);
					break;
			}
			self.isEditing = true;
			self.EditParcelOperation[id] = type;
			self.reorderLayers(graphic);
		}
	};
	BaseEditTool.prototype._stopEditPolygon = function()
	{
		if (tf.map.ArcGIS.V4)
		{
			this._editToolbar.reset();
		} else
		{
			this._editToolbar.deactivate();
		}
	};
	BaseEditTool.prototype._notifyEditBase = function(ids)
	{
		var self = this, dataModels = [];
		this.drawTool._polygonLayer.graphics.map(function(graphic)
		{
			if (graphic.attributes && graphic.attributes.dataModel && ids[graphic.attributes.dataModel.id])
			{
				var dataModel = self.drawTool.createCopyDataModel(graphic);
				dataModels.push(dataModel);
			}
		}.bind(this));
		this.stopEditing.notify(dataModels);
	}

	BaseEditTool.prototype._findPolygonById = function(id)
	{
		var result;
		this.drawTool._polygonLayer.graphics.map(function(graphic)
		{
			if (graphic.attributes.dataModel.id == id)
			{
				result = graphic;
			}
		});

		return result;
	}



	BaseEditTool.prototype._moveDuplicateNodeStartEvent = function(e, type)
	{
		var self = this;
		self.touchedVertexs = {};
		// if (e.vertexinfo && type == "reshape" && !e.vertexinfo.isGhost)
		// {
		// 	for (var i = 0; i < e.vertexinfo.graphic._layer.graphics.length / 2; i++)
		// 	{
		// 		if (e.vertexinfo.graphic._layer.graphics[i].geometry.x == e.vertexinfo.graphic.geometry.x && e.vertexinfo.graphic._layer.graphics[i].geometry.y == e.vertexinfo.graphic.geometry.y)
		// 		{
		// 			e.vertexinfo.graphic._layer.graphics[i].symbol.setColor(new self._arcgis.Color([0, 0, 0, 0])).setOutline(null);
		// 			e.vertexinfo.graphic._layer.redraw();
		// 		}
		// 	}
		// }
		if (self.drawTool._moveDuplicateNode)
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
						if (graphic.attributes.dataModel.id != e.graphic.attributes.dataModel.id || type == "reshape")
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
								self.touchedVertexs[i + "," + j].touchedGraphicVertexes.push(touchedGraphicVertex)
							}
						}
					});
				}
			}
		}
	};

	BaseEditTool.prototype._getGraphicsByType = function(polygon)
	{
		var self = this;
		var graphics = self._getGraphicsWithinCurrentPolygonBuffer(self.drawTool._polygonLayer.graphics, polygon);
		return graphics;
		//return this.drawTool._polygonLayer.graphics;
	}
	BaseEditTool.prototype._getGraphicsWithinCurrentPolygonBuffer = function(graphics, polygon)
	{
		var self = this;
		//var buffer = self._arcgis.geometryEngine.buffer(polygon, distance, "meters");
		var intersectGraphics = [];
		graphics.forEach(function(graphic)
		{
			if (self._arcgis.geometryEngine.intersects(graphic.geometry, polygon))
			{
				intersectGraphics.push(graphic);
			}
		}, this);
		return intersectGraphics;
	}

	BaseEditTool.prototype.getTouchedGraphic = function(item, type)
	{
		var self = this;
		var touchedGraphics = [];
		if (self.drawTool._moveDuplicateNode)
		{
			var currentGraphicRings = item.geometry.type == "polyline" ? item.geometry.paths : item.geometry.rings;
			var allGraphics = self._getGraphicsByType(item.geometry);
			for (var i = 0; i < currentGraphicRings.length; i++)
			{
				for (var j = 0; j < currentGraphicRings[i].length; j++)
				{
					var currentRingPoint = item.geometry.getPoint(i, j);
					allGraphics.forEach(function(graphic)
					{
						if (graphic.attributes.dataModel.id != item.id || type == "reshape")
						{
							var touchedVertex = self.getTouchedVertexs(currentRingPoint, graphic.geometry.type == "polyline" ? graphic.geometry.paths : graphic.geometry.rings, graphic.geometry.type);

							if (touchedVertex.length > 0)
							{
								touchedGraphics.push(graphic);
							}
						}
					})
				}
			}
		}
		return touchedGraphics;
	}

	BaseEditTool.prototype._moveDuplicateNodeEvent = function(e, type)
	{
		var self = this;
		// if (e.vertexinfo && type == "reshape" && !e.vertexinfo.isGhost)
		// {
		// 	for (var i = e.vertexinfo.graphic._layer.graphics.length - 1; i >= e.vertexinfo.graphic._layer.graphics.length / 2; i--)
		// 	{
		// 		e.vertexinfo.graphic._layer.graphics[i].setSymbol(null);
		// 	}

		// }

		if (self.drawTool._moveDuplicateNode)
		{
			for (var touchedVertex in self.touchedVertexs)
			{
				var v = self.touchedVertexs[touchedVertex];
				var point = e.graphic.geometry.getPoint(v.ringIndex, v.pointIndex);
				if (!tf.map.ArcGIS.V4)
				{
					var newVertex = self._calculateTransformedVertex(point, e);
					self.setRingsInternal(type == "reshape" ? point : newVertex, v.touchedGraphicVertexes);
				} else
				{
					self.setRingsInternal(point, v.touchedGraphicVertexes);
				}

			}

			if (type == "reshape" && !tf.map.ArcGIS.V4 && !e.vertexinfo.isGhost) 
			{
				var geo = e.vertexinfo.graphic.geometry;

				var screenPoint = this._map.toScreen(new this._arcgis.Point(geo.x, geo.y, this._map.spatialReference));
				var mapPoint = this._map.toMap(new this._arcgis.ScreenPoint(screenPoint.offset(e.transform.dx, e.transform.dy)));


				var rings = e.graphic.geometry.type == "polyline" ? e.graphic.geometry.paths : e.graphic.geometry.rings;
				var ringIndex = e.vertexinfo.segmentIndex;
				rings[ringIndex].splice(e.vertexinfo.pointIndex, 1, [mapPoint.x, mapPoint.y]);
				if (e.vertexinfo.pointIndex == 0 && e.graphic.geometry.type != "polyline")
				{
					rings[ringIndex].splice(e.graphic.geometry.rings[ringIndex].length - 1, 1, [mapPoint.x, mapPoint.y]);
				}

				var poly = null;
				if (e.graphic.geometry.type == "polyline")
				{
					poly = new this._arcgis.Polyline(this._map.spatialReference);
					poly.paths = rings;
				}
				else
				{
					poly = new this._arcgis.Polygon(this._map.spatialReference);
					poly.rings = rings;
				}
				e.graphic.setGeometry(poly);

			}

		}


	}

	BaseEditTool.prototype._moveDuplicateNodeStopEvent = function(e, type)
	{
		var self = this;
		if (self.drawTool._moveDuplicateNode)
		{
			if (tf.map.ArcGIS.V4 || type != "reshape" || !e.vertexinfo.isGhost)
			{
				for (var touchedVertex in self.touchedVertexs)
				{
					var v = self.touchedVertexs[touchedVertex];
					var point = e.graphic.geometry.getPoint(v.ringIndex, v.pointIndex);
					self.setRingsInternal(point, v.touchedGraphicVertexes);
				}
			}
		}
		self.viewModel._viewModal.toggleSnap();
	};

	BaseEditTool.prototype.getTouchedVertexs = function(geometry, rings, type)
	{
		if (!geometry)
		{
			return [];
		}
		var self = this, touchedVertexIndexes = [], type = type ? type : "polygon";
		for (var i = 0; i < rings.length; i++)
		{
			for (var j = 0; j < rings[i].length; j++)
			{
				if (type != "polyline" && j == (rings[i].length - 1)) continue;

				var point = rings[i][j];
				if (geometry.x == point[0] && geometry.y == point[1])
				{
					touchedVertexIndexes.push({ indexI: i, indexJ: j });
				}
			}
		}
		return touchedVertexIndexes;
	}
	BaseEditTool.prototype._calculateTransformedVertex = function(vertex, e)
	{
		var self = this;
		var g = new self._arcgis.Graphic(vertex, new self._arcgis.SimpleMarkerSymbol(
			{
				"color": [0, 0, 0, 0],
				"size": 12,
				"angle": -30,
				"xoffset": 0,
				"yoffset": 0,
				"style": "circle",
			}));
		this._tempSVGLayer.add(g);
		g.getDojoShape().setTransform(e.info ? e.info.transform : e.transform);
		var m = g.getDojoShape().rawNode.getScreenCTM();
		var x = g.getDojoShape().shape.cx;
		var y = g.getDojoShape().shape.cy;
		var offset = document.getElementById(self._map.id + "_layers").getBoundingClientRect();
		var newx = m.a * x + m.c * y + m.e - offset.left;
		var newy = m.b * x + m.d * y + m.f - offset.top;
		var newG = new self._arcgis.Graphic(self._map.toMap({ x: newx, y: newy }), new self._arcgis.SimpleMarkerSymbol());
		this._tempSVGLayer.clear();
		return newG.geometry;

	};
	BaseEditTool.prototype.setRingsInternal = function(mapPoint, touchedGraphicVertexes)
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
					rings[touchedVertex.indexI].splice(rings[touchedVertex.indexI].length - 1, 1, [mapPoint.x, mapPoint.y])
				}
			}
			var poly = null;
			if (touchedGraphicVertex.graphic.geometry.type == "polyline")
			{
				poly = new this._arcgis.Polyline(this._map.spatialReference);
				poly.paths = rings;
			}
			else
			{
				poly = new this._arcgis.Polygon(this._map.spatialReference);
				poly.rings = rings;
				if (tf.map.ArcGIS.V4)
				{
					poly = new this._arcgis.Polygon({
						rings: rings,
						spatialReference: this._mapView.spatialReference
					})
				}
			}
			if (tf.map.ArcGIS.V4)
			{
				touchedGraphicVertex.graphic.geometry = poly;
			} else
			{
				touchedGraphicVertex.graphic.setGeometry(poly);
			}
		}

	}

	BaseEditTool.prototype._removePointHandler = function(pointIndex, segmentIndex, graphic)
	{
		var self = this;
		if (pointIndex == 0)
		{
			graphic.geometry.removePoint(segmentIndex, pointIndex);
			graphic.geometry.rings[segmentIndex][graphic.geometry.rings[segmentIndex].length - 1] = graphic.geometry.rings[segmentIndex][0];
		}
		else
		{
			graphic.geometry.removePoint(segmentIndex, pointIndex);
		}
		self.drawTool._polygonLayer.redraw();
	}

	BaseEditTool.prototype.reorderLayers = function(graphic)
	{
		// var self = this;
		// self._map.reorderLayer(self.drawTool._polygonLayer, self._map.graphicsLayerIds.length + 1);
		// self._map.reorderLayer(self._map.getLayer("createZipCodeLayer"), 0);
		// self._map.reorderLayer(self._map.getLayer("createMunicipalBoundaryLayer"), 1);
		// self._map.reorderLayer(self._map.getLayer("createParcelLayer"), self._map.graphicsLayerIds.length + 1);
		// self._map.reorderLayer(self._map.getLayer("createBoundaryLayer"), self._map.graphicsLayerIds.length + 1);
		// self._map.reorderLayer(self._map.getLayer("createPopulationLayer"), self._map.graphicsLayerIds.length + 1);
		// self._map.reorderLayer(self._map.getLayer("createPointLayer"), self._map.graphicsLayerIds.length + 1);
		// self._map.reorderLayer(self._map.getLayer("centroidLayer"), self._map.graphicsLayerIds.length + 1);
		// if (graphic)
		// {
		// 	self._map.reorderLayer(self._map.getLayer(graphic._graphicsLayer.id), self._map.graphicsLayerIds.length + 1);
		// 	if (graphic._graphicsLayer.id == "streetFeatureLayer")
		// 	{
		// 		self._map.reorderLayer(self._map.getLayer("splitLayer"), self._map.graphicsLayerIds.length + 1);
		// 	}
		// }
	}

	BaseEditTool.prototype._revert = function()
	{
		var self = this;
		switch (self.viewModel._viewModal.revertMode)
		{
			case "create-populationRegion":
				self.drawTool.getDataModel().removePopulationRegion(self.viewModel._viewModal.revertData);
				break;
			case "create-travelRegion":
				self.drawTool.getDataModel().removeTravelRegion(self.viewModel._viewModal.revertData);
				break;
			case "create-mystreets":
				self.drawTool.getDataModel().delete(self.viewModel._viewModal.revertData);
				break;
			case "create-railroads":
				self.drawTool.getDataModel().delete(self.viewModel._viewModal.revertData);
				break;
			case "create-zipCode":
				self.drawTool.getDataModel().removeZipCode(self.viewModel._viewModal.revertData);
				break;
			case "create-Landmarks":
				self.drawTool.getDataModel().delete(self.viewModel._viewModal.revertData);
				break;
			case "create-Water":
				self.drawTool.getDataModel().delete(self.viewModel._viewModal.revertData);
				break;
			case "create-municipalBoundary":
				self.drawTool.getDataModel().removeMunicipalBoundary(self.viewModel._viewModal.revertData);
				break;
			case "create-schoolBoundary":
				self.drawTool.getDataModel().removeBoundary(self.viewModel._viewModal.revertData);
				break;
			case "create-parcel":
			case "create-addressPoint":
				self.drawTool.getDataModel()._delete([self.drawTool.viewModel._viewModal.revertData.id], false);
				break;
			case "update-populationRegion":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					var currentGraphic = self.drawTool._findGraphicInLayerById(self.drawTool._polygonLayer, oldData.id);
					currentGraphic.setGeometry(oldData.geometry);
				});
				self.drawTool.getDataModel().updatePopulationRegion(self.viewModel._viewModal.revertData);
				break;
			case "update-travelRegion":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					var currentGraphic = self.drawTool._findGraphicInLayerById(self.drawTool._polygonLayer, oldData.id);
					currentGraphic.setGeometry(oldData.geometry);
				});
				self.drawTool.getDataModel().updateTravelRegion(self.viewModel._viewModal.revertData);
				break;
			case "update-schoolBoundary":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					if (oldData.splitBoundaries)
					{
						oldData.splitBoundaries.forEach(function(boundary)
						{
							var boundaryGraphic = self.drawTool._findGraphicInLayerById(self.drawTool._polygonLayer, boundary.id);
							self.drawTool.getDataModel().removeBoundary([boundary]);
						});

					} else
					{
						var currentGraphic = self.drawTool._findGraphicInLayerById(self.drawTool._polygonLayer, oldData.id);
						currentGraphic.setGeometry(oldData.geometry);
						self.drawTool.getDataModel().updateBoundary([oldData]);
					}

				});
				break;
			case "update-parcel":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					var currentGraphic;
					if (oldData.type == "Parcel")
					{
						currentGraphic = self.drawTool._findGraphicInLayerById(self.drawTool._polygonLayer, oldData.id);
					}
					else if (oldData.type == "Point")
					{
						currentGraphic = self.drawTool.findCentroidById(oldData.id) || self.drawTool.findPointById(oldData.id);
					}
					currentGraphic.setGeometry(oldData.geometry.clone());

				});
				self.drawTool.getDataModel().edit(self.viewModel._viewModal.revertData);
				break;
			case "update-zipCode":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					var currentGraphic;

					currentGraphic = self.drawTool._findGraphicInLayerById(self.drawTool._polygonLayer, oldData.id);


					currentGraphic.setGeometry(oldData.geometry.clone());

				});
				self.drawTool.getDataModel().updateZipCode(self.viewModel._viewModal.revertData);
				break;
			case "update-municipalBoundary":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					var currentGraphic;

					currentGraphic = self.drawTool._findGraphicInLayerById(self.drawTool._polygonLayer, oldData.id);


					currentGraphic.setGeometry(oldData.geometry.clone());

				});
				self.drawTool.getDataModel().updateMunicipalBoundary(self.viewModel._viewModal.revertData);
				break;
			case "delete-zipCode":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					self.drawTool.getDataModel().createZipCode(oldData);
				});
				break;
			case "delete-municipalBoundary":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					self.drawTool.getDataModel().createMunicipalBoundary(oldData);
				});
				break;
			case "update-addressPoint-Parcel":
				self.drawTool.getDataModel()._delete([self.drawTool.viewModel._viewModal.revertData.id], true);
				break;
			case "delete-populationRegion":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					self.drawTool.getDataModel().createPopulationRegion(oldData);
				});
				break;
			case "delete-travelRegion":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					self.drawTool.getDataModel().createTravelRegion(oldData);
				});
				break;
			case "update-mystreets":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					var currentGraphic = self.drawTool._findGraphicInLayerById(self.drawTool._polygonLayer, oldData.id);
					var polyline = new self._arcgis.Polyline(self._map.spatialReference);
					polyline.addPath(oldData.geometry.paths[0]);
					currentGraphic.setGeometry(polyline);
				});
				self.drawTool.getDataModel().update(self.viewModel._viewModal.revertData);
				break;
			case "split-mystreets":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					var currentGraphic = self.drawTool._findGraphicInLayerById(self.drawTool._polygonLayer, oldData.old.id);
					var polyline = new self._arcgis.Polyline(self._map.spatialReference);
					polyline.addPath(oldData.old.geometry.paths[0]);
					currentGraphic.setGeometry(polyline);
					self.drawTool.getDataModel().delete([oldData.new]);
					self.drawTool.getDataModel().update([oldData.old]);
				});
				break;
			case "delete-mystreets":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					self.drawTool.getDataModel().create(oldData);
				});
				break;
			case "update-railroads":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					var currentGraphic = self.drawTool._findGraphicInLayerById(self.drawTool._polygonLayer, oldData.id);
					var polyline = new self._arcgis.Polyline(self._map.spatialReference);
					polyline.addPath(oldData.geometry.paths[0]);
					currentGraphic.setGeometry(polyline);
				});
				self.drawTool.getDataModel().update(self.viewModel._viewModal.revertData);
				break;
			case "delete-railroads":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					self.drawTool.getDataModel().create(oldData);
				});
				break;
			case "delete-schoolBoundary":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					self.drawTool.getDataModel().createBoundary(oldData);
				});
				break;
			case "delete-parcel-centroid":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					if (oldData.type == "Parcel")
					{
						self.drawTool.getDataModel().createParcelData(oldData);
					}
					else if (oldData.type == "Point" && !oldData.isCentroid)
					{
						self.drawTool.getDataModel().createPointData(oldData);
					}

				});
				break;
			case "delete-parcel":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					if (oldData.type == "Parcel")
					{
						self.drawTool.getDataModel().convertPointToParcel(oldData)
					}
					else if (oldData.type == "Point")
					{
						self.drawTool.getDataModel().createPointData(oldData);
					}
				});
				break;
			case "update-Landmarks":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					var currentGraphic = self.drawTool._findGraphicInLayerById(self.drawTool._polygonLayer, oldData.id);
					currentGraphic.setGeometry(TF.cloneGeometry(oldData.geometry));
				});
				self.drawTool.getDataModel().update(self.viewModel._viewModal.revertData);
				break;
			case "delete-Landmarks":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					self.drawTool.getDataModel().create(oldData);
				});
				break;
			case "update-Water":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					var currentGraphic = self.drawTool._findGraphicInLayerById(self.drawTool._polygonLayer, oldData.id);
					currentGraphic.setGeometry(TF.cloneGeometry(oldData.geometry));
				});
				self.drawTool.getDataModel().update(self.viewModel._viewModal.revertData);
				break;
			case "delete-Water":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					self.drawTool.getDataModel().create(oldData);
				});
				break;
			// case "create-TripStop":
			// 	self.drawTool.getDataModel().fieldTripStopDataModel.delete(self.viewModel._viewModal.revertData, true);
			// 	break;
			// case "delete-TripStop":
			// 	self.drawTool.getDataModel().fieldTripStopDataModel.create(self.viewModel._viewModal.revertData, true);
			// 	break;
			case "update-TripStop":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					var currentGraphic = self.drawTool._findGraphicInLayerById(self.drawTool._tripStopLayer, oldData.id);
					currentGraphic.setGeometry(TF.cloneGeometry(oldData.geometry));

					currentGraphic = self.drawTool._findGraphicInLayerById(self.drawTool._polygonLayer, oldData.boundary.id);
					currentGraphic.setGeometry(TF.cloneGeometry(oldData.boundary.geometry));

					currentGraphic = self.drawTool._findGraphicInLayerById(self.drawTool._studentCountLayer, oldData.id);
					currentGraphic && currentGraphic.setGeometry(TF.cloneGeometry(oldData.geometry));
				});
				self.drawTool.getDataModel().fieldTripStopDataModel.update(self.viewModel._viewModal.revertData, true);
				break;
			case "update-TripBoundary":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					var currentGraphic = self.drawTool._findGraphicInLayerById(self.drawTool._polygonLayer, oldData.id);
					currentGraphic.setGeometry(TF.cloneGeometry(oldData.geometry));
				});
				self.drawTool.getDataModel().fieldTripStopDataModel.updateTripBoundary(self.viewModel._viewModal.revertData, true);
				break;
			case "create-StopPool":
				self.drawTool.getDataModel().delete(self.viewModel._viewModal.revertData);
				break;
			case "update-StopPool":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					var boundaryGraphic = self.drawTool._findGraphicInLayerById(self.drawTool._polygonLayer, oldData.boundary.id);
					boundaryGraphic.setGeometry(TF.cloneGeometry(oldData.boundary.geometry));
					var stopGraphic = self.drawTool._findGraphicInLayerById(self.drawTool._stopPoolPointLayer, oldData.id);
					stopGraphic.setGeometry(TF.cloneGeometry(oldData.geometry));
				});
				self.drawTool.getDataModel().update(self.viewModel._viewModal.revertData);
				break;
			case "delete-StopPool":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					self.drawTool.getDataModel().create(oldData);
				});
				break;
			case "create-nonEligible":
				self.viewModel.dataModel.delete(self.viewModel._viewModal.revertData)
				break;
			case "update-nonEligible":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					var currentGraphic = self.drawTool._findGraphicInLayerById(self.drawTool._polygonLayer, oldData.id);
					if (tf.map.ArcGIS.V4)
					{
						currentGraphic.geometry = TF.cloneGeometry(oldData.geometry);
					} else
					{
						currentGraphic.setGeometry(TF.cloneGeometry(oldData.geometry));
					}
				});
				self.viewModel.dataModel.update(self.viewModel._viewModal.revertData, true);
				break;
			case "delete-nonEligible":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					self.viewModel.dataModel.create(oldData);
				});
				break;
			case "create-schoolLocation":
				self.viewModel.dataModel.delete(self.viewModel._viewModal.revertData)
				break;
			case "update-schoolLocation":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					var currentGraphic = self.drawTool._findGraphicInLayerById(self.drawTool._polygonLayer, oldData.id);
					if (tf.map.ArcGIS.V4)
					{
						currentGraphic.geometry = TF.cloneGeometry(oldData.geometry);
					} else
					{
						currentGraphic.setGeometry(TF.cloneGeometry(oldData.geometry));
					}
				});
				self.viewModel.dataModel.update(self.viewModel._viewModal.revertData, true);
				break;
			case "delete-schoolLocation":
				self.viewModel._viewModal.revertData.forEach(function(oldData)
				{
					self.viewModel.dataModel.create(oldData);
				});
				break;
		}
		if (self.viewModel._viewModal.revertData && self.viewModel._viewModal.revertData.length > 0)
		{
			self.viewModel._viewModal.onStopEditingEvent.notify();
		}
		self.drawTool.getDataModel().clearRevertInfo();
		if (self.isEditing)
		{
			self.restartEdit();
		}
	}
	BaseEditTool.prototype.restartEdit = function()
	{
		var self = this;
		self.rightClickEdit(self.rightClickMode, self.drawTool._currentRightClickPolygonId, true);

	}

	BaseEditTool.prototype._isRingsIntersect = function(rings)
	{
		var self = this;
		var outRings = self._findOutterRing(rings);
		var outPolygons = outRings.map(function(r) { return self._arcgis.Polygon(self._map.spatialReference).addRing(r); })
		if (self._combineTouchedPolygons(outPolygons).length > 1) return false;
		else return true;
	};

	BaseEditTool.prototype._findOutterRing = function(rings)
	{
		var self = this, geometries = [];
		for (var i = 0; i < rings.length; i++)
		{
			var polygon = new self._arcgis.Polygon(self._map.spatialReference);
			polygon.addRing(rings[i]);
			geometries.push(self._arcgis.geometryEngine.simplify(polygon));

		}
		var resultGeometry = self._arcgis.geometryEngine.union(geometries);
		return resultGeometry.rings;

	}

	BaseEditTool.prototype._combineTouchedPolygons = function(polygons)
	{
		var self = this, resultPolygons = [polygons[0]], rings = [];
		polygons.map(function(p)
		{
			p.rings.map(function(r) { rings.push(r); });

		})
		polygons.shift();
		polygons.map(function(p, index)
		{
			var istouch = false;
			resultPolygons.map(function(pr)
			{
				if (self._arcgis.geometryEngine.contains(pr, p) && self._arcgis.geometryEngine.contains(p, pr))
				{

				}
				else if (self.drawTool._isTouches(pr, p, rings))
				{
					p.rings.map(function(r)
					{
						pr.addRing(r);
						return;
					});
					istouch = true;
				}
			});
			if (!istouch)
			{
				resultPolygons.push(p);
			}

		});
		return resultPolygons;
	}

	BaseEditTool.prototype.convertPxToDistance = function(distance)
	{
		return TF.Helper.MapHelper.convertPxToDistance(this._map, this._arcgis, distance)
	};

	BaseEditTool.prototype.deleteSelectedNode = function()
	{
		var self = this;
		if (this._dialogOn) { return; }
		if (self._currentSelectedVertex && !self._currentSelectedVertex.vertexinfo.isGhost)
		{
			var pointIndex = self._currentSelectedVertex.vertexinfo.pointIndex;
			var graphic = self._currentSelectedVertex.graphic;
			if ((graphic.geometry.type == "polyline" && graphic.geometry.paths[0].length > 2)
				|| (graphic.geometry.type == "polygon" && graphic.geometry.rings[0].length > 4))
			{
				(graphic.geometry.paths || graphic.geometry.rings)[0].splice(pointIndex, 1);
				this.drawTool._polygonLayer.redraw && this.drawTool._polygonLayer.redraw();
				self._stopEditPolygon();
				self._startEditPolygon("reshape", graphic);
				var ids = {};
				ids[graphic.attributes.dataModel.id] = true;
				self._notifyEdit(ids);
			}
			else
			{
				this._dialogOn = true;
				tf.promiseBootbox.dialog(
					{
						message: "<p id='notallowredeleteLandmarkvertex'>The vertex cannot be deleted</p>",
						title: "Warning",
						closeButton: true,
						buttons: {
							yes: {
								label: "OK",
								className: "btn-primary btn-sm btn-primary-black"
							}
						}
					}).then(function()
					{
						self._dialogOn = false;
					});
			}
		}
	};

})();
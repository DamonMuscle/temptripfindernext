(function()
{
	createNamespace("TF.UserDefinedField").GeofenceMapTool = GeofenceMapTool;
	function GeofenceMapTool(viewModel)
	{
		var self = this;
		self.viewModel = viewModel;
		self.dataModel = viewModel.dataModel;
		self._map = viewModel._viewModal.map;
		TF.RoutingMap.EsriTool.call(self, self._map);

		self.initialize();
		self.dataModel.settingChangeEvent.subscribe(self.onSettingChangeEvent.bind(this));
		self.dataModel.onAllChangeEvent.subscribe(self.onChangeEvent.bind(self));
		self.dataModel.highlightChangedEvent.subscribe(self.onhighlightChangedEvent.bind(self));

	}
	GeofenceMapTool.prototype = Object.create(TF.RoutingMap.EsriTool.prototype);
	GeofenceMapTool.prototype.constructor = GeofenceMapTool;

	GeofenceMapTool.prototype.initialize = function()
	{
		var self = this;
		var layerIds = { polygonLayerId: "geofenceLayer" };
		self.viewModel.layers.push(layerIds.polygonLayerId);
		self.initializeBase.apply(self, [layerIds]);
		self.initializeSettings();
	}

	GeofenceMapTool.prototype.initializeSettings = function()
	{
		var self = this;
		var setting = self.dataModel.settings || {};
		self._moveDuplicateNode = setting.moveDuplicateNode;
		self._allowOverlap = !setting.removeOverlapping;
	};

	GeofenceMapTool.prototype.onSettingChangeEvent = function()
	{
		var self = this;
		self.initializeSettings();
	};

	GeofenceMapTool.prototype.getDataModel = function()
	{
		return this.viewModel.dataModel;
	}

	GeofenceMapTool.prototype.getSetting = function()
	{
		return this.viewModel.dataModel.getSetting();
	}

	GeofenceMapTool.prototype.getPaletteName = function()
	{
		return "Geofence";
	};

	GeofenceMapTool.prototype.start = function(geometryType, mode)
	{
		this.startBase(geometryType, mode);
	}
	GeofenceMapTool.prototype._initSymbols = function(mode)
	{
		this._initSymbolsBase(mode);
	};

	GeofenceMapTool.prototype.addPolygonToLayer = function(graphic)
	{
		var self = this;
		graphic = self.removeOverlapBoundary(graphic, "add");
		if (graphic)
		{
			if (!graphic.geometry)
			{
				return this._warningDialogBox("Remove Overlapping Boundaries is set as true");
			}
			self.viewModel._viewModal.geofenceEditModal.create({ geometry: graphic.geometry }).then(function()
			{
				self.viewModel.drawTool.sketchTool.stopAndClear();
			});
		}
		else
		{
			self.viewModel.drawTool.sketchTool.stopAndClear();
		}
	}

	GeofenceMapTool.prototype.overlapDialogTransform = function ()
	{
		return this._warningDialogBox("Remove Overlapping Boundaries is set as true, geofence cannot be moved here!");
	};

	GeofenceMapTool.prototype.handleEditingId = function(editingId, ids)
	{
		this.changeSymbolMeetStatus(editingId);
		if (ids)
		{
			ids.forEach(function(id)
			{
				self.changeSymbolMeetStatus(id);
			});
		}
	}

	GeofenceMapTool.prototype.changeSymbolMeetStatus = function(id)
	{
		var self = this,
			graphic = self.findPolygonById(id),
			polygonSymbol = $.extend(true, {}, self.symbol.PolygonCreateSymbol()),
			highlightPolygonSymbol = $.extend(true, {}, self.symbol.highlightPolygonSymbol());
		if (graphic)
		{
			var color = graphic.attributes.dataModel.color,
				fillPattern = graphic.attributes.dataModel.fillPattern,
				type = graphic.attributes.dataModel.type;
			if (color === undefined) color = self.viewModel._viewModal.geofenceEditModal.whiteColor;
			polygonSymbol = self._getSymbol(color, fillPattern / 2, false);
			highlightPolygonSymbol.color = self._computeColor(color, fillPattern / 2);

			var isHighlighted = self.viewModel.dataModel.isHighlighted(id);
			var isEditing = false //self._isCurrentEditing(id);    TODO
			var isRedraw = false// self._mode == "redraw" && self._currentRightClickPolygonId == id; TODO
			if (isRedraw)
			{
				polygonSymbol = self._polygonSymbolRedraw;
			} else if (isEditing)
			{
				polygonSymbol = self._polygonSymbolEditing;
				self._changeVertexSymbol(graphic.attributes.dataModel.color);
			} else if (isHighlighted)
			{
				polygonSymbol = highlightPolygonSymbol;
			}
			self._changeSymbol(id, polygonSymbol, isEditing, isHighlighted, graphic)

		}

	}
	GeofenceMapTool.prototype._changeVertexSymbol = function(color)
	{
		var self = this;
		if (self.editTool.isEditing && self.editTool._editToolbar._vertexEditor)
		{
			self.editTool._editToolbar._vertexEditor._vertexMovers.map(function(ring)
			{
				ring.map(function(vertex)
				{
					vertex.graphic.setSymbol(self._computeVertexSymbol(color));
				})
			})
		}
	}

	GeofenceMapTool.prototype._changeSymbol = function(id, polygonSymbol, isEditing, isHighlighted, graphic)
	{
		if (!graphic)
		{
			graphic = this.findPolygonById(id);
		}
		if (!graphic)
		{
			return;
		}
		var symbol = polygonSymbol;
		graphic.symbol = symbol;
	}


	GeofenceMapTool.prototype.redrawRegionCallback = function(graphic)
	{
		var self = this;
		self.endRegionCallback();
		var oldGeometry = self._oldBoundaryGraphic.geometry;
		self._oldBoundaryGraphic.geometry = graphic.geometry;
		var result = self.removeOverlapBoundary(self._oldBoundaryGraphic);
		if (result)
		{
			self.updateDataModel([self._oldBoundaryGraphic]);
		}
		else
		{
			self._oldBoundaryGraphic.geometry = oldGeometry;
		}
	};

	GeofenceMapTool.prototype.transformCallback = function(graphics)
	{
		PubSub.publish("clear_ContextMenu_Operation");
		var self = this;
		if (!graphics)
		{
			self._oldBoundaryGraphic.symbol = self._oldBoundarySymbol;
			return;
		}
		var needToRevert = false;
		graphics.forEach(function(graphic)
		{
			if (!self._isRingsIntersect(graphic.geometry.rings))
			{
				needToRevert = true;
				return tf.promiseBootbox.alert("Geofence cannot be reshaped into multi-parts");
			}
			if (!self._allowOverlap)
			{
				if (!self.overlapCheck(graphic))
				{
					needToRevert = true;
				} else
				{
					graphic.geometry = self.removeOverlapBoundary(graphic).geometry;
				}
			}
		});
		if (needToRevert)
		{
			graphics[0].geometry = self._oldBoundaryGraphic.geometry;
			for (var i = 1; i < graphics.length; i++)
			{
				graphics[i].geometry = new self._arcgis.Polygon({ spatialReference: self._map.mapView.spatialReference, rings: graphics[i].oldRings });
			}
		} else
		{
			self.updateDataModel(graphics);
		}
	};

	GeofenceMapTool.prototype.addRegionCallback = function(graphic)
	{
		var self = this;
		self.endRegionCallback();
		self._oldBoundaryGraphic.geometry = self._arcgis.geometryEngine.simplify(self._oldBoundaryGraphic.geometry);
		if (self._arcgis.geometryEngine.intersects(graphic.geometry, self._oldBoundaryGraphic.geometry))
		{
			var geometry = self._arcgis.geometryEngine.union(graphic.geometry, self._oldBoundaryGraphic.geometry);
			if (!self._isRingsIntersect(geometry.rings))
			{
				return tf.promiseBootbox.alert("Geofence cannot be reshaped into multi-parts");
			}

			var oldGeometry = self._oldBoundaryGraphic.geometry;
			self._oldBoundaryGraphic.geometry = geometry;
			var result = self.removeOverlapBoundary(self._oldBoundaryGraphic, 'remove');
			if (result)
			{
				self.updateDataModel([self._oldBoundaryGraphic]);
			}
			else
			{
				self._oldBoundaryGraphic.geometry = oldGeometry;
			}
		}
	};

	GeofenceMapTool.prototype.removeRegionCallback = function(graphic)
	{
		var self = this;
		self.endRegionCallback();
		if (self._arcgis.geometryEngine.intersects(graphic.geometry, self._oldBoundaryGraphic.geometry))
		{
			var geometry = self._arcgis.geometryEngine.difference(self._oldBoundaryGraphic.geometry, graphic.geometry);
			if (!geometry)
			{
				return;
			}
			if (!self._isRingsIntersect(geometry.rings))
			{
				return tf.promiseBootbox.alert("Geofence cannot be reshaped into multi-parts");
			}
			var oldGeometry = self._oldBoundaryGraphic.geometry;
			self._oldBoundaryGraphic.geometry = geometry;
			var result = self.removeOverlapBoundary(self._oldBoundaryGraphic, 'remove');
			if (result)
			{
				self.updateDataModel([self._oldBoundaryGraphic]);
			}
			else
			{
				self._oldBoundaryGraphic.geometry = oldGeometry;
			}
		}
	};

	GeofenceMapTool.prototype.addRegionFromSelection = function(oldBoundaryGraphic, graphic)
	{
		var self = this;
		self._oldBoundaryGraphic = oldBoundaryGraphic;
		self._oldBoundarySymbol = $.extend({}, oldBoundaryGraphic.symbol);
		self.addRegionCallback(graphic);
	};

	GeofenceMapTool.prototype.removeRegionFromSelection = function(oldBoundaryGraphic, graphic)
	{
		var self = this;
		self._oldBoundaryGraphic = oldBoundaryGraphic;
		self._oldBoundarySymbol = $.extend({}, oldBoundaryGraphic.symbol);
		self.removeRegionCallback(graphic);
	};

	GeofenceMapTool.prototype.removeOverlapBoundary = function(graphic, type)
	{
		var self = this;
		if (self._allowOverlap) return graphic;

		var intersectGeometry = self._intersectWithCurrentPolygons(graphic);
		if (intersectGeometry)
		{
			var cutResult = self._arcgis.geometryEngine.difference(graphic.geometry, intersectGeometry);
			if ((type == 'remove' || type == 'add') && (self._isContainedByCurrentPolygons(graphic) || !cutResult))
			{
				tf.promiseBootbox.alert("Remove Overlapping Boundaries is set as true!");
				return null;
			}
			else if (cutResult && !self._isRingsIntersect(cutResult.rings))
			{
				tf.promiseBootbox.alert("Geofence cannot be reshaped into multi-parts").then(function()
				{
					if (type != "add")
					{
						graphic.geometry = self._oldBoundaryGraphic.geometry;
					}
				})
				return null;
			}
			else
			{
				if (!cutResult)
				{
					tf.promiseBootbox.alert("Remove Overlapping Boundaries is set as true!");
					return null;
				}
				graphic.geometry = cutResult;
			}
		}
		return graphic;
	};

	GeofenceMapTool.prototype._add = function(item)
	{
		var self = this,
			symbol = self._getSymbol(item.color, item.fillPattern / 2, item.isHighlighted);

		var geometry = item.geometry;
		self._polygonLayer.add(new self._arcgis.Graphic({
			geometry: geometry,
			symbol: symbol,
			attributes: { 'dataModel': item }
		}));
	};
	GeofenceMapTool.prototype._delete = function(item)
	{
		var self = this;
		//if (self.editTool.isEditing) self.editTool.stop();
		self._polygonLayer.remove(self.findPolygonById(item.id));
	};

	GeofenceMapTool.prototype.deleteBoundary = function(Id)
	{
		var self = this;
		self._polygonLayer.graphics.map(function(graphic)
		{
			if (graphic.attributes.id == Id)
			{
				self._polygonLayer.remove(graphic);
				return;
			}
		});
	};

	GeofenceMapTool.prototype._getSymbol = function(color, fill, isHighlighted)
	{
		var self = this;
		if (color === undefined) color = self.viewModel._viewModal.geofenceEditModal.whiteColor;
		if (isHighlighted)
		{
			var highlightPolygonSymbol = $.extend(true, {}, self.symbol.highlightPolygonSymbol());
			highlightPolygonSymbol.color = self._computeColor(color, fill);
			return highlightPolygonSymbol;
		} else
		{
			var fillSymbol = {
				type: "simple-fill",
				style: "solid",
				color: self._computeColor(color, fill),
				outline: {
					type: "simple-line",
					style: "solid",
					color: self._computeColor(color, 1),
					width: 2
				}
			}
			return fillSymbol;
		}

	}

	GeofenceMapTool.prototype._computeSymbol = function(color, fill, isHighlighted)
	{
		var self = this;
		if (isHighlighted)
		{
			var highlightPolygonSymbol = $.extend(true, {}, self._highlightPolygonSymbol);
			highlightPolygonSymbol.setColor(self._computeColor(color, fill));
			return highlightPolygonSymbol;
		} else
		{
			var outlineSymbol = new self._arcgis.SimpleLineSymbol().setWidth(2),
				fillSymbol = new self._arcgis.SimpleFillSymbol();
			fillSymbol.setColor(self._computeColor(color, fill));
			outlineSymbol.setColor(self._computeColor(color, 1));
			fillSymbol.setOutline(outlineSymbol);
			return fillSymbol;
		}

	}
	GeofenceMapTool.prototype._computeVertexSymbol = function(color)
	{
		var self = this;

		var outlineSymbol = new self._arcgis.SimpleLineSymbol().setWidth(2),
			markerSymbol = new self._arcgis.SimpleMarkerSymbol().setSize(8);
		markerSymbol.setColor(self._computeColor(color, 1));
		outlineSymbol.setColor(self._computeColor(color, 1));
		markerSymbol.setOutline(outlineSymbol);
		return markerSymbol;
	}

	GeofenceMapTool.prototype._computeColor = function(hexvalue, alpha)
	{
		if ($.isArray(hexvalue))
		{
			return new this._arcgis.Color([hexvalue[0], hexvalue[1], hexvalue[2], alpha]);
		}
		hexvalue = hexvalue.toString();
		if (hexvalue.indexOf("#") < 0)
		{
			hexvalue = TF.Color.toHTMLColorFromLongColor(hexvalue);
		}
		var color = this._arcgis.Color.fromString(hexvalue).toRgb();
		return new this._arcgis.Color([color[0], color[1], color[2], alpha]);
	}

	GeofenceMapTool.prototype.onBoundarySetSelectionChanged = function(items)
	{
		var self = this;
		if (self.editTool.isEditing) self.editTool.stop();
	}

	GeofenceMapTool.prototype.onChangeEvent = function(e, items, type)
	{
		var self = this;
		if (items.delete.length > 0)
		{
			items.delete.forEach(function(item)
			{
				self._delete(item);
			});
		}
		else if (items.add.length > 0)
		{
			items.add.forEach(function(item)
			{
				self._add(item);
			});
		} else if (items.edit.length > 0)
		{
			items.edit.forEach(function(item)
			{
				self._update(item);
			});
		}
	};

	GeofenceMapTool.prototype._update = function(item)
	{
		var self = this;
		var graphics = self._polygonLayer.graphics.items;
		graphics.map(function(graphic)
		{
			if (graphic.attributes.dataModel.id == item.id)
			{
				graphic.visible = item.display == false ? false : true;
				graphic.attributes = { dataModel: item };
				graphic.geometry = item.geometry.clone();
				graphic.symbol = self._getSymbol(item.color, item.fillPattern / 2, item.isHighlighted);
				return;
			}
		});
	};

	GeofenceMapTool.prototype.getSymbol = function(graphic, type, color)
	{
		if (type == this.StatusType.edit)
		{
			return this.symbol.editPolygonSymbol();
		}
		color = TF.Helper.MapHelper.getColorArray(color || graphic.attributes.dataModel.color);
		if (type == this.StatusType.highlight)
		{
			return this.symbol.polygonSymbol(color, this.symbol.symbolColors.yellowForHighlight);
		}
		return this.symbol.polygonSymbol(color);
	};


	GeofenceMapTool.prototype.onhighlightChangedEvent = function(e, items)
	{
		var self = this;
		var layers = [self._polygonLayer];
		self.onHighlightedChangeEventBase(layers);
	};

	GeofenceMapTool.prototype.getUnionBoundaries = function(ids)
	{
		var self = this,
			geometries = [], polygon, result, unionResult = [];
		self._polygonLayer.graphics.map(function(g)
		{
			ids.map(function(id)
			{
				if (g.attributes.dataModel && id == g.attributes.dataModel.id)
				{
					geometries.push(self._arcgis.geometryEngine.simplify(g.geometry));
					return;
				}
			})
		});
		if (geometries.length > 0)
		{
			result = self._arcgis.geometryEngine.union(geometries);
			result.rings.map(function(ring)
			{
				polygon = new self._arcgis.Polygon(self._map.mapView.spatialReference);
				polygon.addRing(ring);
				unionResult.push(polygon);
				//this._polygonLayer.add(new this._arcgis.Graphic(polygon, new this._arcgis.SimpleFillSymbol().setColor(new this._arcgis.Color([255, 255, 255]))));
			});
		}
		return unionResult;
	}
	GeofenceMapTool.prototype.getUnionGeometry = function(ids)
	{
		var self = this,
			geometries = [], polygon, resultGeometry;
		self._polygonLayer.graphics.map(function(g)
		{
			ids.map(function(id)
			{
				if (g.attributes.dataModel && id == g.attributes.dataModel.id)
				{
					geometries.push(self._arcgis.geometryEngine.simplify(g.geometry));
					return;
				}
			})
		});

		resultGeometry = self._arcgis.geometryEngine.union(geometries);
		return resultGeometry;
	}

	GeofenceMapTool.prototype._isEdgeOverlap = function(line, Polygon)
	{
		var self = this, isOverlap = false;
		for (var i = 0; i < Polygon.rings.length; i++)
		{
			var polygonToLine = new self._arcgis.Polyline(self._map.mapView.spatialReference);
			polygonToLine.addPath(Polygon.rings[i]);
			var intersection = self._arcgis.geometryEngine.intersect(polygonToLine, line);
			if (intersection != null && intersection.type == "polyline")
			{
				//var intersectionOnPolygon = self._arcgis.geometryEngine.intersect(Polygon, line)
				if (self._arcgis.geometryEngine.equals(intersection, line))
				{
					isOverlap = true; break;
				}
			}
		}
		return isOverlap;
	}

	GeofenceMapTool.prototype.dispose = function()
	{
		TF.RoutingMap.EsriTool.prototype.dispose.call(this);
		//PubSub.unsubscribe(this._setAllowOverlap);
	};
})()
(function()
{
	createNamespace("TF.RoutingMap").EsriFeatureTool = EsriFeatureTool;

	function EsriFeatureTool(map)
	{
		var self = this;
		TF.RoutingMap.EsriTool.call(this, map);
		self.isTileRender = self.isTileRender != null ? self.isTileRender : false;
		self.minZoom = 13;
		self.addedIds = {};
		self.layerTypes = ["polygon", "polyline", "point"];
		self.isEditing = false;
	}

	EsriFeatureTool.prototype = Object.create(TF.RoutingMap.EsriTool.prototype);
	EsriFeatureTool.prototype.constructor = EsriFeatureTool;

	/**
	* initialize
	* @param {object} layers {polygon:{id:"",symbol:{}},polyline:{id:"",symbol:{}},point:{id:"",symbol:{}}}
	*/
	EsriFeatureTool.prototype.initializeBase = function(layers)
	{
		var self = this;
		var defaultOptions = {
			objectIdField: "oid",
			fields: [
				{
					name: "oid",// the oid used by feature layer itself
					type: "oid"
				},
				{
					name: "id",// the id used by datamodel to identify 
					type: "string"
				}],
			source: []
		};
		// add other filed if exists, those fields will help to display label
		if (self.otherFields())
		{
			defaultOptions.fields = defaultOptions.fields.concat(self.otherFields().map(function(field)
			{
				return {
					name: field.fieldName,
					type: "string"
				};
			}));
		}
		self.layerTypes.forEach(function(type)
		{
			if (layers[type])
			{
				var layerName = buildNewLayer(layers[type].id, type, layers[type]);
				self.viewModel.layers.push(self[layerName].id);
			}
		});

		function buildNewLayer(id, geometryType, options, order)
		{
			var layerName = "_" + geometryType + "Layer";
			var minScale = options.minScale || 0;
			if (self.isTileRender)
			{
				minScale = TF.Helper.MapHelper.zoomToScale(self._map, self.minZoom);
			}
			var layer = new tf.map.ArcGIS.FeatureLayer($.extend({}, defaultOptions, {
				id: id,
				geometryType: geometryType,
				renderer: options.renderer ? options.renderer : {
					type: "simple",
					symbol: options.symbol
				},
				spatialReference: {
					wkid: 102100
				},
				visible: options.visible == false ? false : true,
				minScale: minScale,
				opacity: options.opacity || 1,
				labelingInfo: options.labelingInfo
			}));

			self[layerName] = layer;
			bindRemoveAll(layer);
			self._map.add(layer, order);
			self._map.mapView.whenLayerView(layer).catch(function(error)
			{
				TF.consoleOutput("error", "At whenLayerView, EsriFeatureTool buildNewLayer fails: " + error);
			});

			layer.when(null, function(error)
			{
				TF.consoleOutput("error", "At layer when, EsriFeatureTool buildNewLayer fails: " + error);
			});

			return layerName;
		}

		function bindRemoveAll(layer)
		{
			layer.removeAll = function()
			{
				var order = TF.Helper.MapHelper.getOrder(self._map, layer.id);
				if (layer.loadStatus == "loading" || layer.loadStatus == "not-loaded")
				{
					layer.cancelLoad();
				}

				self._map.remove(layer);
				buildNewLayer(layer.id, layer.geometryType, {
					symbol: layer.renderer.symbol,
					visible: layer.visible,
					renderer: layer.renderer,
					minScale: layer.minScale,
					opacity: layer.opacity,
					labelingInfo: layer.labelingInfo
				}, order);
				self.addedIds = {};
			};
		}
	};

	/**
	* only display graphics in extent for performance
	*/
	EsriFeatureTool.prototype.watchExtentChange = function()
	{
		if (!this.isTileRender) { return; }
		if (this.watchExtent) { return; }
		var self = this;
		this.watchExtent = this._map.mapView.watch("extent", function()
		{
			clearTimeout(self.extentTimeout);
			self.extentTimeout = setTimeout(function()
			{
				self.displayGraphicInExtent();
			}, 20);
		});
	};

	EsriFeatureTool.prototype.otherFields = function()
	{
		return null;
	};

	EsriFeatureTool.prototype.onChangeEvent = function(e, items)
	{
		var self = this;
		var promises = [];
		if (items.delete && items.delete.length > 0)
		{
			modifyToLayer(items.delete, "deleteFeatures");
			if (self.isTileRender)
			{
				items.delete.forEach(function(c)
				{
					if (c)
					{
						delete self.addedIds[c.id];
					}
				});
			}
		}
		else if (items.add && items.add.length > 0)
		{
			self.layerTypes.forEach(function(type)
			{
				addToLayer(items.add.filter(function(c) { return c && c.geometry.type.toLowerCase() == type.toLowerCase(); }));
			});
		}
		else if (items.edit && items.edit.length > 0)
		{
			modifyToLayer(items.edit, "updateFeatures");
		}

		return Promise.all(promises);

		function addToLayer(items)
		{
			if (items.length == 0)
			{
				return;
			}

			if (self.isTileRender)
			{
				self.displayGraphicInExtent();
			} else
			{
				promises.push(self._applyEditsForAdd(items));
			}
		}

		function modifyToLayer(items, modifyFeaturesName)
		{
			return promises.push(self.modifyToLayer(items, modifyFeaturesName));
		}
	};

	EsriFeatureTool.prototype.modifyToLayer = function(items, modifyFeaturesName)
	{
		var self = this;
		var graphics = self.itemsToGraphics(items);
		var promises = [];
		for (var key in graphics)
		{
			if (graphics[key].length > 0)
			{
				var obj = {};
				obj[modifyFeaturesName] = graphics[key];
				promises.push(self["_" + key.substr(0, key.length - 1) + "Layer"].applyEdits(obj));
			}
		}
		return Promise.all(promises);
	};

	EsriFeatureTool.prototype.displayGraphicInExtent = function()
	{
		var self = this;
		this.watchExtentChange();
		if (!self.isTileRender || self._map.mapView.zoom < self.minZoom)
		{
			return;
		}

		var extent = self._map.mapView.extent;
		var itemsToDisplay = [];
		var promise = Promise.resolve();
		var hasGetDataInExtent = this.dataModel.getDataInExtent;
		if (hasGetDataInExtent)
		{
			promise = this.dataModel.getDataInExtent(extent);
		}
		promise.then(function()
		{
			self.dataModel.all.forEach(function(item)
			{
				if ((hasGetDataInExtent || extent.intersects(item.geometry)) && !self.addedIds[item.id])
				{
					itemsToDisplay.push(item);
					self.addedIds[item.id] = true;
				}
			});
			self.layerTypes.forEach(function(geometryType)
			{
				self._applyEditsForAdd(itemsToDisplay.filter(function(c) { return c.geometry.type == geometryType; }));
			});
		});
	};

	EsriFeatureTool.prototype._applyEditsForAdd = function(items)
	{
		if (items.length == 0)
		{
			return Promise.resolve();
		}
		var type = items[0].geometry.type;
		var graphics = this.itemsToGraphics(items);
		return this["_" + type + "Layer"].applyEdits({ addFeatures: graphics[type + "s"] }).then(function(result)
		{
			items.forEach(function(item, i)
			{
				if (!result.addFeatureResults[i].error) item.oid = result.addFeatureResults[i].objectId;
			});
		}).catch(function(error)
		{
			TF.consoleOutput("error", "EsriFeatureTool _applyEditsForAdd fails: " + error);
		});
	};

	EsriFeatureTool.prototype.isViewModelOpen = function()
	{
		var viewModel;
		if (this.viewModel.obShow)
		{
			viewModel = this.viewModel;
		} else
		{
			viewModel = this.viewModel.viewModel;
		}
		return viewModel.obShow() || viewModel.showCount > 0;
	};

	EsriFeatureTool.prototype.addPointToLayer = function(graphic)
	{
		var self = this;
		self.viewModel.editModal.create(graphic.geometry).then(function()
		{
			self.sketchTool.stopAndClear();
		});
	};

	EsriFeatureTool.prototype.addPolylineToLayer = function(graphic)
	{
		var self = this;
		self.viewModel.editModal.create(graphic.geometry).then(function()
		{
			self.sketchTool.stopAndClear();
		});
	};

	EsriFeatureTool.prototype.addPolygonToLayer = function(graphic)
	{
		var self = this;

		self.removeOverlapBoundary([graphic]);
		if (!graphic.geometry)
		{
			return this._warningDialogBox("Remove Overlapping Boundaries is set as true");
		}

		this.viewModel.editModal.create(graphic.geometry).then(function()
		{
			self.sketchTool.stopAndClear();
		});
	};

	EsriFeatureTool.prototype.reshape = function(id, type)
	{
		var self = this;
		return self._getSketchGraphic(id, type, true).then(function(graphics)
		{
			if (graphics)
			{
				self.changeRevertModeToUpdate();
				return new Promise(function(resolve, reject)
				{
					self.isEditing = true;
					if (graphics.length > 1)
					{
						var others = graphics.filter(function(c) { return c.attributes.id != id; });
						others.forEach(function(g)
						{
							g.symbol = self._editingLayer.renderer.defaultSymbol || self._editingLayer.renderer.symbol;
						});
						self.sketchTool._drawingLayer.addMany(others);
					}
					self.sketchTool.reshape(graphics.filter(function(c) { return c.attributes.id == id; })[0], { moveDuplicateNode: self.getMoveDuplicateNode.bind(self), isFeatureLayer: true }, function(graphic)
					{
						self.reshapeCallback(graphic);
						resolve();
					}, self);
				});
			}
		});
	};

	EsriFeatureTool.prototype.transform = function(id, type)
	{
		var self = this;
		return self._getSketchGraphic(id, type, true).then(function(graphics)
		{
			if (graphics)
			{
				return new Promise(function(resolve, reject)
				{
					self.isEditing = true;
					if (graphics.length > 1)
					{
						var others = graphics.filter(function(c) { return c.attributes.id != id; });
						others.forEach(function(g)
						{
							g.symbol = self._editingLayer.renderer.symbol;
						});
						self.sketchTool._drawingLayer.addMany(others);
					}
					return self.sketchTool.transform(
						graphics.filter(function(c) { return c.attributes.id == id; })[0],
						{ moveDuplicateNode: self.getMoveDuplicateNode.bind(self), isFeatureLayer: true },
						function(graphic)
						{
							if (type == "point")
							{
								self.movePointCallback(graphic);
							} else
							{
								self.transformCallback(graphic);
							}
							resolve();
						}, self);
				});
			}
		});
	};

	EsriFeatureTool.prototype.movePoint = function(id)
	{
		var self = this;
		return self.transform(id, "point");
	};

	EsriFeatureTool.prototype.addRegion = function(type, id)
	{
		var self = this;
		return self._getSketchGraphic(id, "polygon", false).then(function(graphics)
		{
			if (graphics)
			{
				graphics[0].attributes = { id: id }
				return new Promise(function(resolve, reject)
				{
					self.isEditing = true;
					if (graphics.length > 1)
					{
						var others = graphics.filter(function(c) { return c.attributes.id != id; });
						others.forEach(function(g)
						{
							g.symbol = self._editingLayer.renderer.symbol;
						});
						self.sketchTool._drawingLayer.addMany(others);
					}
					graphics[0].symbol = self.symbol.editPolygonSymbol();
					self.sketchTool._drawingLayer.add(graphics[0]);
					return self.sketchTool.addRegion(
						type,
						function(graphic)
						{
							self.addRegionCallback(graphic);

							resolve();
						}, self);
				});
			}
		});
	};

	EsriFeatureTool.prototype.removeRegion = function(type, id)
	{
		var self = this;
		return self._getSketchGraphic(id, "polygon", false).then(function(graphics)
		{
			if (graphics)
			{
				graphics[0].attributes = { id: id }
				return new Promise(function(resolve, reject)
				{
					self.isEditing = true;
					graphics[0].symbol = self.symbol.editPolygonSymbol();
					self.sketchTool._drawingLayer.add(graphics[0]);
					return self.sketchTool.removeRegion(
						type,
						function(graphic)
						{
							self.removeRegionCallback(graphic);

							resolve();
						}, self);
				});
			}
		});
	};

	EsriFeatureTool.prototype.redrawRegion = function(type, id)
	{
		var self = this;
		return self._getSketchGraphic(id, "polygon", false).then(function(graphics)
		{
			if (graphics)
			{
				graphics[0].attributes = { id: id }
				return new Promise(function(resolve, reject)
				{
					self.isEditing = true;
					graphics[0].symbol = self.symbol.editPolygonSymbol();
					self.sketchTool._drawingLayer.add(graphics[0]);
					return self.sketchTool.redrawRegion(
						type,
						function(graphic)
						{
							self.redrawRegionCallback(graphic);

							resolve();
						}, self);
				});
			}
		});
	};

	/**
	* if graphic in feature layer need to transform or reshape, it must delete from feature layer and add to a graphic layer, 
	* then after modify finished, add them back
	*/
	EsriFeatureTool.prototype._getSketchGraphic = function(id, type, withDuplicate)
	{
		var self = this;
		self.sketchTool.stopAndClear();
		return self._waitAddBackFinish().then(function()
		{
			var layer = self.getLayer(type);
			var graphics = self._findGraphicsInLayer(layer, id, withDuplicate);
			if (graphics && graphics.length > 0)
			{
				self._editingLayer = layer;
				self._oldGraphics = graphics.map(function(graphic) { return graphic.clone(); });
				return layer.applyEdits({ deleteFeatures: graphics }).then(function()
				{
					return graphics;
				});
			}
		});
	};

	/**
	* wait the graphics add back to feature layer
	*/
	EsriFeatureTool.prototype._waitAddBackFinish = function()
	{
		var self = this;
		if (self._addBackingPromise)
		{
			return self._addBackingPromise;
		}
		return Promise.resolve();
	};

	EsriFeatureTool.prototype.endRegionCallback = function()
	{
		var self = this;
		self.isEditing = false;
		PubSub.publish("clear_ContextMenu_Operation");
		self.sketchTool.clear();
		// when graphics call back, if nothing change, it won't send back touch graphics,
		// this will cause touch graphic not draw on map, so add length equal verify

		return addFeatureBack(self._editingLayer, self._oldGraphics);


		function addFeatureBack(layer, graphics)
		{
			self._addBackingPromise = layer.applyEdits({ addFeatures: graphics }).then(function(result)
			{
				graphics.forEach(function(graphic, i)
				{
					var item = self.dataModel.findById(self._oldGraphics[0].attributes.id);
					if (!result.addFeatureResults[i].error) item.oid = result.addFeatureResults[i].objectId;
				});
				self.updateDataModel(graphics);
				self.onHighlightChangedEvent(null, self.dataModel.getHighlighted());
			});
			return self._addBackingPromise;
		}
	};

	EsriFeatureTool.prototype.addRegionCallback = function(graphic)
	{
		var self = this;
		self.isEditing = false;
		PubSub.publish("clear_ContextMenu_Operation");
		self.sketchTool.clear();
		// when graphics call back, if nothing change, it won't send back touch graphics,
		// this will cause touch graphic not draw on map, so add length equal verify
		graphic.attributes = self._oldGraphics[0].attributes;
		self._oldGraphics[0].geometry = self._arcgis.geometryEngine.simplify(self._oldGraphics[0].geometry);
		if (self._arcgis.geometryEngine.intersects(graphic.geometry, self._oldGraphics[0].geometry))
		{
			graphic.geometry = self._arcgis.geometryEngine.union(graphic.geometry, self._oldGraphics[0].geometry);
		} else
		{
			return addFeatureBack(self._editingLayer, self._oldGraphics);
		}
		self.removeOverlapBoundary([graphic]);

		return addFeatureBack(self._editingLayer, [graphic]);


		function addFeatureBack(layer, graphics)
		{
			self._addBackingPromise = layer.applyEdits({ addFeatures: graphics }).then(function(result)
			{
				graphics.forEach(function(graphic, i)
				{
					var item = self.dataModel.findById(self._oldGraphics[0].attributes.id);
					if (!result.addFeatureResults[i].error) item.oid = result.addFeatureResults[i].objectId;
				});
				self.updateDataModel(graphics);
				self.onHighlightChangedEvent(null, self.dataModel.getHighlighted());
			});
			return self._addBackingPromise;
		}
	};

	EsriFeatureTool.prototype.removeRegionCallback = function(graphic)
	{
		var self = this;
		self.isEditing = false;
		PubSub.publish("clear_ContextMenu_Operation");
		self.sketchTool.clear();
		// when graphics call back, if nothing change, it won't send back touch graphics,
		// this will cause touch graphic not draw on map, so add length equal verify
		self._oldGraphics[0].geometry = self._arcgis.geometryEngine.simplify(self._oldGraphics[0].geometry);
		graphic.attributes = self._oldGraphics[0].attributes;
		if (self._arcgis.geometryEngine.intersects(graphic.geometry, self._oldGraphics[0].geometry))
		{
			graphic.geometry = self._arcgis.geometryEngine.difference(self._oldGraphics[0].geometry, graphic.geometry);
		} else
		{
			return addFeatureBack(self._editingLayer, self._oldGraphics);
		}
		self.removeOverlapBoundary([graphic]);

		return addFeatureBack(self._editingLayer, [graphic]);


		function addFeatureBack(layer, graphics)
		{
			self._addBackingPromise = layer.applyEdits({ addFeatures: graphics }).then(function(result)
			{
				graphics.forEach(function(graphic, i)
				{
					var item = self.dataModel.findById(self._oldGraphics[0].attributes.id);
					if (!result.addFeatureResults[i].error) item.oid = result.addFeatureResults[i].objectId;
				});
				self.updateDataModel(graphics);
				self.onHighlightChangedEvent(null, self.dataModel.getHighlighted());
			});
			return self._addBackingPromise;
		}
	};

	EsriFeatureTool.prototype.redrawRegionCallback = function(graphic)
	{
		var self = this;
		self.isEditing = false;
		PubSub.publish("clear_ContextMenu_Operation");
		self.sketchTool.clear();
		// when graphics call back, if nothing change, it won't send back touch graphics,
		// this will cause touch graphic not draw on map, so add length equal verify
		//	self._oldGraphics[0].geometry = self._arcgis.geometryEngine.simplify(self._oldGraphics[0].geometry);
		// if (self._arcgis.geometryEngine.intersects(graphic.geometry, self._oldGraphics[0].geometry))
		// {
		// 	graphic.geometry = self._arcgis.geometryEngine.difference(self._oldGraphics[0].geometry, graphic.geometry);
		// } else
		// {
		// 	return addFeatureBack(self._editingLayer, self._oldGraphics);
		// }
		graphic.attributes = self._oldGraphics[0].attributes;
		self.removeOverlapBoundary([graphic]);

		return addFeatureBack(self._editingLayer, [graphic]);


		function addFeatureBack(layer, graphics)
		{
			self._addBackingPromise = layer.applyEdits({ addFeatures: graphics }).then(function(result)
			{
				graphics.forEach(function(graphic, i)
				{
					var item = self.dataModel.findById(self._oldGraphics[0].attributes.id);
					if (!result.addFeatureResults[i].error) item.oid = result.addFeatureResults[i].objectId;
				});

				self.updateDataModel(graphics);
				self.onHighlightChangedEvent(null, self.dataModel.getHighlighted());
			});
			return self._addBackingPromise;
		}
	};


	/**
	* callback for reshape and transform
	*/
	EsriFeatureTool.prototype.transformCallback = function(graphics)
	{
		var self = this;
		self.isEditing = false;
		PubSub.publish("clear_ContextMenu_Operation");
		self.sketchTool.clear();
		// when graphics call back, if nothing change, it won't send back touch graphics,
		// this will cause touch graphic not draw on map, so add length equal verify
		var addBackGraphics = [];
		if (graphics && graphics.length == self._oldGraphics.length)
		{
			addBackGraphics = graphics;
		} else if (graphics && graphics.length < self._oldGraphics.length && graphics.length > 0)
		{
			var oldGraphics = self._oldGraphics.filter(function(oldgGraphic) { return graphics.filter(function(graphic) { return graphic.attributes.id == oldgGraphic.attributes.id }).length == 0 });
			addBackGraphics = graphics.concat(oldGraphics);
		} else
		{
			addBackGraphics = self._oldGraphics;
		}
		if (addBackGraphics[0].geometry.type == "polygon")
		{
			self.addFinderToCenterPoint(addBackGraphics);
			var result = self.removeOverlapBoundary(addBackGraphics);
			if (!result || !self.checkGeometry(addBackGraphics))
			{
				return self._warningDialogBox("Remove Overlapping Boundaries is set as true").then(function()
				{
					var layer = self.getLayer("polygon");
					addFeatureBack(self._editingLayer, self._findGraphicsInLayer(layer, addBackGraphics[0].attributes.id, true));
				});
			}
		}
		return addFeatureBack(self._editingLayer, addBackGraphics);

		function addFeatureBack(layer, graphics)
		{
			var addBackGraphics = graphics.filter(function(graphic) { return self.dataModel.findById(graphic.attributes.id) });
			if (addBackGraphics.length > 0)
			{
				self._addBackingPromise = layer.applyEdits({ addFeatures: addBackGraphics }).then(function(result)
				{
					addBackGraphics.forEach(function(graphic, i)
					{
						var item = self.dataModel.findById(graphic.attributes.id);
						if (!result.addFeatureResults[i].error) item.oid = result.addFeatureResults[i].objectId;
					});
					self.updateDataModel(addBackGraphics);
				});
			}

			return self._addBackingPromise;
		}
	};

	EsriFeatureTool.prototype.checkGeometry = function(graphics)
	{
		var self = this;
		for (var i = 0; i < graphics.length; i++)
		{
			if (!graphics[i].geometry || !centroidInsideParcel(graphics[i]))
			{
				return false;
			}
			if (graphics[i].geometry.rings.length > 1)
			{
				if (!self._pointLayer) return true;
				var centroid = self._findGraphicInLayerById(self._pointLayer, self.getBoundaryHeartId(graphics[i]));
				if (!centroid) return true
				for (var j = 0; j < graphics[i].geometry.rings.length; j++)
				{
					var polygon = new self._arcgis.Polygon({
						rings: [graphics[i].geometry.rings[j]],
						spatialReference: self._map.mapView.spatialReference
					});
					if (self._arcgis.geometryEngine.intersects(polygon, centroid.geometry))
					{
						graphics[i].geometry = polygon;
						break;
					}
				}

			}
		}
		function centroidInsideParcel(graphic)
		{
			var centroidId = self.getBoundaryHeartId(graphic);
			if (centroidId)
			{
				var centroid = self._findGraphicInLayerById(self._pointLayer, centroidId);
				return self._arcgis.geometryEngine.intersects(centroid.geometry, graphic.geometry);
			}
			return true;
		}
		return true;
	};

	/**
	* callback for move point
	*/
	EsriFeatureTool.prototype.movePointCallback = function(graphics)
	{
		var self = this;
		self.transformCallback(graphics);
	};
	EsriFeatureTool.prototype.addFinderToCenterPoint = function(graphics)
	{
		var self = this;
		graphics.map(function(graphic)
		{
			if (self._pointLayer)
			{
				var heartId = self.getBoundaryHeartId(graphic);
				if (heartId)
				{
					var centroid = self._findGraphicInLayerById(self._pointLayer, heartId);
					if (!self._arcgis.geometryEngine.intersects(graphic.geometry, centroid.geometry))
					{
						var nearestPoint = self._arcgis.geometryEngine.nearestCoordinate(graphic.geometry, centroid.geometry).coordinate;
						var parcelWithFinger = self._createFinger(nearestPoint, centroid.geometry, graphic);
						graphic.geometry = parcelWithFinger;
					}
				}
			}
		});
	};

	EsriFeatureTool.prototype.removeOverlapBoundary = function(graphics)
	{
		var self = this;
		var all = [];
		var mapping = {};
		var graphic, i;
		var dataArray = $.isArray(graphics) ? graphics : [graphics];
		if (self._allowOverlap || graphics[0].geometry.type != "polygon") { return graphics; }
		dataArray.forEach(function(graphic)
		{
			if (graphic.attributes && graphic.attributes.id)
			{
				mapping[graphic.attributes.id] = graphic;
			}
		});
		// replace graphic in all use the new modified geometry to check intersect
		for (i = 0; i < self.dataModel.all.length; i++)
		{
			var item = self.dataModel.all[i];
			if (mapping[item.id])
			{
				graphic = dataArray.filter(function(graphic) { return graphic.attributes.id == item.id })[0];
				all.push(new self._arcgis.Graphic({ geometry: graphic.geometry }));
			} else
			{
				all.push(item);
			}
		}
		for (i = 0; i < dataArray.length; i++)
		{
			graphic = dataArray[i];

			var intersectGeometry = self._intersectWithCurrentPolygons(graphic, all);
			if (intersectGeometry)
			{
				var cutResult = self._arcgis.geometryEngine.difference(graphic.geometry, intersectGeometry);
				graphic.geometry = cutResult;
			}
		}
		return graphics;
	};

	EsriFeatureTool.prototype._intersectWithCurrentPolygons = function(g, all)
	{
		var self = this,
			intersectGeometries = [];
		all.forEach(function(item)
		{
			if (item.geometry.type == "polygon")
			{
				var graphic = new self._arcgis.Graphic({ geometry: item.geometry });
				if (self._isIntersect(graphic, g))
				{
					if ((g.attributes && g.attributes.id != item.id) || !g.attributes)
					{
						intersectGeometries.push(self._arcgis.geometryEngine.simplify(graphic.geometry));
					}
				}
			}
		});
		if (intersectGeometries.length > 0) return self._arcgis.geometryEngine.union(intersectGeometries);
		return false;
	};

	EsriFeatureTool.prototype._findGraphicsInLayer = function(layer, id, withDuplicate)
	{
		var self = this;
		if (layer)
		{
			var all = self.dataModel.all;
			var records = [];
			if (!self._moveDuplicateNode || layer.geometryType == "point")
			{
				records = [self.dataModel.findById(id)];
			} else
			{
				var extent = self.dataModel.findById(id).geometry.extent;
				records = all.filter(function(item)
				{
					return extent.intersects(item.geometry);
				});
			}
			if (!withDuplicate)
			{
				var graphics = this.itemsToGraphics(records.filter(function(c) { return c.id == id; }));
				if (layer.geometryType == "polyline") return graphics.polylines;
				else if (layer.geometryType == "polygon") return graphics.polygons;
				else if (layer.geometryType == "point") return graphics.points;
			} else
			{
				if (layer.geometryType == "polyline") return self._findTouchedGraphics(id, records).polylines;
				else if (layer.geometryType == "polygon") return self._findTouchedGraphics(id, records).polygons;
				else if (layer.geometryType == "point") return self._findTouchedGraphics(id, records).points;
			}

		}
	};

	EsriFeatureTool.prototype._findTouchedGraphics = function(id, source)
	{
		var self = this;
		var target = source.filter(function(c) { return c.id == id; })[0];
		var touchGraphics = [];
		var others = source.filter(function(c) { return c.id != target.id; });
		others.forEach(function(graphic)
		{
			var touches = tf.map.ArcGIS.geometryEngine.touches(target.geometry, graphic.geometry);
			if (touches && self._isTouchVertex(target, graphic))
			{
				touchGraphics.push(graphic);
			}
		});
		var data = [target].concat(touchGraphics);
		return this.itemsToGraphics(data);
	};

	EsriFeatureTool.prototype._isTouchVertex = function(target, graphic)
	{
		var self = this, isTouch = false;
		if (target.geometry.type == "point") return isTouch;
		var currentGraphicRings = target.geometry.type == "polyline" ? target.geometry.paths : target.geometry.rings;
		for (var i = 0; i < currentGraphicRings.length; i++)
		{
			for (var j = 0; j < currentGraphicRings[i].length; j++)
			{
				var currentRingPoint = target.geometry.getPoint(i, j);
				var touchedVertex = self.sketchTool.getTouchedVertexs(currentRingPoint, graphic.geometry.type == "polyline" ? graphic.geometry.paths : graphic.geometry.rings, graphic.geometry.type);
				if (touchedVertex.length > 0)
				{
					isTouch = true;
					break;
				}
			}
		}
		return isTouch;
	}

	EsriFeatureTool.prototype._findGraphicInLayerById = function(layer, id)
	{
		var self = this;
		if (!id || !layer) return null;
		var symbol = null;
		var data = self.dataModel.findById(id);
		if (data.geometry.type == "point")
		{
			symbol = self._pointLayer.renderer.symbol;
		}
		else if (data.geometry.type == "polyline")
		{
			symbol = self._polylineLayer.renderer.symbol;
		}
		else if (data.geometry.type == "polygon")
		{
			symbol = self._polygonLayer.renderer.symbol;
		}
		var graphic = new self._arcgis.Graphic({ geometry: data.geometry, attributes: { id: id }, symbol: symbol });
		return graphic;
	};

	EsriFeatureTool.prototype.updateDataModel = function(graphics)
	{
		var self = this, dataModels = [];
		graphics.forEach(function(graphic)
		{
			var data = self.dataModel.findById(graphic.attributes.id);
			if (data)
			{
				var copyDataModel = $.extend(true, {}, data);
				if (graphic.oldRings) { copyDataModel.oldRings = $.extend(true, [], graphic.oldRings); }
				copyDataModel.geometry = TF.cloneGeometry(graphic.geometry);
				dataModels.push(copyDataModel);
			}

		});
		self.dataModel.update(dataModels);
	};

	EsriFeatureTool.prototype.onHighlightChangedEvent = function(e, items)
	{
		var self = this;
		this.isEditing && this.sketchTool.stop();
		this.layerTypes.forEach(function(type)
		{
			var layer = self.getLayer(type);
			if (layer)
			{
				self._map.mapView.whenLayerView(layer).then(function(layerView)
				{
					var eventName = "highlight" + type + "Select";
					if (self[eventName] && self[eventName].uid == layerView.uid)
					{
						self[eventName].remove();
					}
					if (items.length > 0)
					{
						self[eventName] = layerView.highlight(items.filter(function(item) { return item.geometry.type == type; }).map(function(item) { return item.oid; }));
						self[eventName].uid = layerView.uid;
					}
				}).catch(function(error)
				{
					console.log("EsriFeatureTool onHighlightChangedEvent error: " + error);
				});
			}
		});
	};

	EsriFeatureTool.prototype.updateLayerSymbolColor = function(layerId, color)
	{
		var self = this;
		var layer = self._map.findLayerById(layerId), originRenderer = layer.renderer.clone();
		originRenderer.symbol.color = color;
		if (layer.geometryType == 'polygon')
		{
			originRenderer.symbol.outline.color = color;
		}
		layer.renderer = originRenderer;
	};

	EsriFeatureTool.prototype.updateDynamicLayerSymbolColor = function(layerId, color)
	{
		let layer = this._map.findLayerById(layerId);
		if (layer.sublayers)
		{
			layer.sublayers.forEach(subLayer =>
			{
				subLayer.renderer.symbol.color = color;
			});
		}
		layer.refresh();
	};
	EsriFeatureTool.prototype.updateLayerOpacity = function(layerId, opacity)
	{
		var self = this;
		var layer = self._map.findLayerById(layerId);
		layer.opacity = opacity;
	};

	EsriFeatureTool.prototype.getLayer = function(type)
	{
		var self = this;
		if (type)
		{
			switch (type)
			{
				case "point":
					return self._pointLayer;
				case "polyline":
					return self._polylineLayer;
				case "polygon":
					return self._polygonLayer;
			}
		}
		return self._polygonLayer || self._polylineLayer || self._pointLayer;
	};

	EsriFeatureTool.prototype.itemsToGraphics = function(items)
	{
		var points = [], polylines = [], polygons = [];
		var otherFields = this.otherFields();
		items.forEach(function(item)
		{
			if (item && item.geometry && item.geometry.type)
			{
				var type = item.geometry.type.toLowerCase();
				if (type == "polyline")
				{
					polylines.push(itemToGraphic(item));
				}
				else if (type == "polygon")
				{
					polygons.push(itemToGraphic(item));
				}
				else if (type == "point")
				{
					points.push(itemToGraphic(item));
				}
			}
		});

		function itemToGraphic(item)
		{
			var attributes = {
				id: item.id + '',
				dataModel: { id: item.id },
				oid: item.oid
			};
			if (otherFields)
			{
				otherFields.forEach(function(field)
				{
					attributes[field.fieldName] = (field.getText ? field.getText(item) : (typeof item[field.fieldName] == "undefined" ? "" : item[field.fieldName])).toString();
				});
			}
			return new tf.map.ArcGIS.Graphic({
				geometry: item.geometry,
				attributes: attributes
			});
		}
		return { polygons: polygons, polylines: polylines, points: points };
	};

	EsriFeatureTool.prototype.revert = function(data, type)
	{
		var self = this;
		if (type == "update")
		{
			self.dataModel.update(data);
		}
		else if (type == "create")
		{
			self.dataModel.delete(data);
		} else if (type == "delete")
		{
			data.forEach(function(d)
			{
				self.dataModel.create(d);
			});
		} else if (type == "split")
		{
			data.forEach(function(d)
			{
				self.dataModel.update([d.old]);
				self.dataModel.delete([d.new]);
			})
		}
	}

	EsriFeatureTool.prototype.close = function()
	{
		this.watchExtent && this.watchExtent.remove();
		this.watchExtent = null;
	};

	EsriFeatureTool.prototype.dispose = function()
	{
		this.close();
		TF.RoutingMap.EsriTool.prototype.dispose.call(this);
	};
})();
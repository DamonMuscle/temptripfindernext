(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").MyStreetsControlDisplay = MyStreetsControlDisplay;
	var helper = TF.RoutingMap.MapEditingPalette.MyStreetsHelper;

	function MyStreetsControlDisplay(arcgis, map, viewModel)
	{
		this.arcgis = arcgis;
		this.map = map;
		this.viewModel = viewModel;
		this.dataModel = viewModel.dataModel;
		this.showDirectionSymbol = false;
		this.showCurb = false;
		this.showManeuvers = false;
		this.travelScenariosDataModel = this.viewModel.viewModel._viewModal.travelScenariosPaletteViewModel.travelScenariosViewModel.dataModel;
		this.directionLayer = this._addDirectionLayer();
		var minScale = TF.Helper.MapHelper.zoomToScale(map, this.viewModel.drawTool.minZoom);
		this.directionLayer.minScale = minScale;
		this.curbLayer = helper.addLayer("myStreetsCurbControlLayer", viewModel, map);
		this.curbLayer.minScale = minScale;
		this.maneuversLayer = helper.addLayer("myStreetsManeuversControlLayer", viewModel, map);
		this.maneuversLayer.minScale = minScale;
		this.invalidJunctionsLayer = helper.addLayer("myStreetsInvalidJunctionsLayerControlLayer", viewModel, map);
		this.invalidJunctionsLayer.minScale = minScale;
		this.dataModel.onAllChangeEvent.subscribe(this.onChangeEvent.bind(this));
		this.dataModel.curbTurnDataModel.onControlChangeEvent.subscribe(this.onControlChangeEvent.bind(this));
		this.dataModel.settingChangeEvent.subscribe(this.settingChange.bind(this));
		this.travelScenariosDataModel.settingChangeEvent.subscribe(this.settingChange.bind(this));
		this.setSettings();
	}

	MyStreetsControlDisplay.prototype.extentChangeEvent = function()
	{
		var self = this;
		clearTimeout(self.extentTimeout);
		self.extentTimeout = setTimeout(function()
		{
			if (self.dataModel.map.mapView.zoom >= self.viewModel.drawTool.minZoom)
			{
				// redraw direction in map extent range
				self.showDirectionSymbolToStreet();
				self.showManeuversSymbolToStreet();
				self.showInvalidJunctionsToStreet();
				// recalculate and redraw position of curb approach when zoom level changed, this helps to beautify curb arrow 
				if (!self.oldZoomLevel || self.oldZoomLevel != self.map.mapView.zoom)
				{
					self.showCurbSymbolToStreet();
					self.oldZoomLevel = self.map.mapView.zoom;
				}
			}
		}, 100);
	};

	MyStreetsControlDisplay.prototype.setSettings = function()
	{
		var self = this;
		return this.getSettings().then(function(settings)
		{
			self.showDirectionSymbol = settings.showDirection;
			self.showManeuvers = settings.showManeuvers;
			self.showCurb = settings.showCurb;
			self.showInvalidJunctions = settings.showInvalidJunctions;
		});
	};

	MyStreetsControlDisplay.prototype.getSettings = function()
	{
		return Promise.all([
			this.dataModel.getSetting(),
			this.travelScenariosDataModel.getSetting()]).then((data) =>
			{
				return $.extend({}, data[0], data[1]);
			});
	};

	MyStreetsControlDisplay.prototype.settingChange = function()
	{
		var self = this;
		var showInvalidJunctions = self.showInvalidJunctions;
		var showDirectionSymbol = self.showDirectionSymbol;
		var showManeuvers = self.showManeuvers;
		var showCurb = self.showCurb;
		self.setSettings().then(function()
		{
			if (showDirectionSymbol != self.showDirectionSymbol)
			{
				self.showDirectionSymbolToStreet();
			}
			if (showManeuvers != self.showManeuvers)
			{
				self.showManeuversSymbolToStreet();
			}
			if (showCurb != self.showCurb)
			{
				self.showCurbSymbolToStreet();
			}
			if (showInvalidJunctions != self.showInvalidJunctions)
			{
				setTimeout(function()
				{
					self.showInvalidJunctionsToStreet();
				});
			}
		});
	};

	MyStreetsControlDisplay.prototype.showAll = function()
	{
		this.showDirectionSymbolToStreet();
		this.showManeuversSymbolToStreet();
		this.showCurbSymbolToStreet();
		this.showInvalidJunctionsToStreet();
	};

	MyStreetsControlDisplay.prototype.onChangeEvent = function(e, data)
	{
		var self = this;
		clearTimeout(self.dataChangeTimeout);
		self.dataChangeTimeout = setTimeout(function()
		{
			self.showDirectionSymbolToStreet();
			self.initInvalidJunctionsLayer(data);
		}, 100);
	};

	MyStreetsControlDisplay.prototype.onControlChangeEvent = function()
	{
		this.showManeuversSymbolToStreet();
		this.showCurbSymbolToStreet();
	};

	MyStreetsControlDisplay.prototype.showDirectionSymbolToStreet = function()
	{
		var self = this;
		var streetFeatureLayer = self.map.findLayerById("streetFeatureLayer");

		if (!self.showDirectionSymbol || !TF.Helper.MapHelper.layerVisible(self.map, streetFeatureLayer) || !this.viewModel.showMode().mapEditing)
		{
			removeAllAndAdd();
			return;
		}

		return getStreetsInExtent().then(function(streets)
		{
			var newGraphics = [];
			streets.forEach(function(graphic)
			{
				var polylinePoints = graphic.geometry.paths[0];
				var ans = helper.calculateMiddlePos(polylinePoints, self.map);
				if (ans.length / self.map.mapView.scale * 2256 > 15)
				{
					var arrowGraphic = new tf.map.ArcGIS.Graphic({
						geometry: {
							type: "point",
							x: ans.middlePos.x,
							y: ans.middlePos.y,
							spatialReference: self.map.mapView.spatialReference
						},
						attributes: {
							angle: 360 - ans.angle * 180 / Math.PI
						}
					});
					newGraphics.push(arrowGraphic);
				}
			});
			removeAllAndAdd(newGraphics);
		});

		function getStreetsInExtent()
		{
			var query = new tf.map.ArcGIS.Query();
			query.outFields = ["id"];
			query.where = "1=1";
			query.geometry = self.map.mapView.extent;
			query.returnGeometry = true;

			return streetFeatureLayer.queryFeatures(query).then(function(featureSet)
			{
				return featureSet.features;
			});
		}

		function removeAllAndAdd(adds = [])
		{
			return self.directionLayer.queryFeatures().then(function(featureSet)
			{
				if (featureSet.features.length > 0 || adds.length > 0)
				{
					var obj = {};
					if (featureSet.features.length > 0)
					{
						obj.deleteFeatures = featureSet.features;
					}
					if (adds.length > 0)
					{
						obj.addFeatures = adds;
					}
					return self.directionLayer.applyEdits(obj);
				}
			});
		}
	};

	MyStreetsControlDisplay.prototype._addDirectionLayer = function()
	{
		var id = "myStreetsDirectionControlLayer";
		var layer = new tf.map.ArcGIS.FeatureLayer({
			id: id,
			geometryType: "point",
			objectIdField: "oid",
			spatialReference: {
				wkid: 102100
			},
			fields: [
				{
					name: "oid",
					type: "oid"
				}, {
					name: "angle",
					type: "double"
				}],
			source: [],
			renderer: {
				type: "simple",
				symbol: {
					type: "simple-marker",
					size: 16,
					color: [0, 0, 255],
					outline: {
						color: [0, 0, 0],
						width: 1
					},
					path: "M0 0 L9 9 L0 18 Z"
				},
				visualVariables: [{
					type: "rotation",
					field: "angle",
					rotationType: "geographic"
				}]
			}
		});
		this.viewModel.layers.push(id);
		this.map.add(layer);
		layer.removeAll = function()
		{
			var query = new tf.map.ArcGIS.Query();
			query.outFields = ["*"];
			layer.queryFeatures(query).then(function(featureSet)
			{
				if (featureSet.features.length > 0)
				{
					layer.applyEdits({ deleteFeatures: featureSet.features });
				}
			});
		};
		return layer;
	};

	MyStreetsControlDisplay.prototype.showManeuversSymbolToStreet = function()
	{
		var self = this;
		var streetFeatureLayer = self.map.findLayerById("streetFeatureLayer");
		self.maneuversLayer.removeAll();
		if (!self.showManeuvers || !streetFeatureLayer.visible || !this.viewModel.showMode().travelScenario)
		{
			return;
		}
		var points = {};
		var streetsMapping = self.dataModel.toMappingByObjectID();
		self.dataModel.curbTurnDataModel.maneuvers.forEach(function(maneuver)
		{
			var point = helper.getManeuverTouchPoint(maneuver, streetsMapping);
			if (point)
			{
				var key = point[0] + "-" + point[1];
				if (!points[key])
				{
					points[key] = true;
					self.maneuversLayer.add(self.createJunctionGraphic(point));
				}
			}
		});
	};

	MyStreetsControlDisplay.prototype.showCurbSymbolToStreet = function()
	{
		var self = this;
		self.curbLayer.removeAll();
		if (!self.showCurb || !self.map.findLayerById("streetFeatureLayer").visible || !this.viewModel.showMode().travelScenario)
		{
			return;
		}
		var allMapping = self.dataModel.toMappingByObjectID();
		self.dataModel.curbTurnDataModel.curbs.forEach(function(curb)
		{
			var street = allMapping[curb.StreetSegmentID];
			if (street)
			{
				var polylinePoints = street.geometry.paths[0];
				var middlePosInfo = helper.calculateMiddlePos(polylinePoints, self.map);
				var type = helper.getCurbType(curb.SideOfStreet);
				var color = helper.getCurbColor(curb.Type);
				var angle = middlePosInfo.angle;
				var point = helper.createCurbApproach(middlePosInfo.startPoint, middlePosInfo.endPoint, middlePosInfo.middlePos, type, angle, color, self.map);
				self.curbLayer.add(point.graphic);
			}
		});
	};

	// #region invalid junctions
	MyStreetsControlDisplay.prototype.initInvalidJunctionsLayer = function(data)
	{
		var self = this;

		if (!self.showInvalidJunctions || !self.map.findLayerById("streetFeatureLayer").visible || !this.viewModel.showMode().mapEditing)
		{
			return;
		}
		clearTimeout(this.invalidChangeTimeout);
		this.invalidChangeTimeout = setTimeout(function()
		{
			self.showInvalidJunctionsToStreet();
		}, 10);
	};

	MyStreetsControlDisplay.prototype.deleteInvalidJunctions = function(funcFilter)
	{
		var self = this;
		var changeGraphics = [];
		self.invalidJunctionsLayer.graphics.forEach(function(g)
		{
			if (funcFilter(g))
			{
				changeGraphics.push(g);
			}
		});
		changeGraphics.forEach(function(g)
		{
			self.invalidJunctionsLayer.remove(g);
		});
	};

	MyStreetsControlDisplay.prototype.showInvalidJunctionsToStreet = function()
	{
		var self = this;
		var streetFeatureLayer = self.map.findLayerById("streetFeatureLayer");
		if (!self.showInvalidJunctions || !streetFeatureLayer.visible || self.dataModel.all.length == 0 || !this.viewModel.showMode().mapEditing)
		{
			self.invalidJunctionsLayer.removeAll();
			return;
		}
		var extent = self.dataModel.map.mapView.extent;
		var split1 = self.splitStreetInExtent(extent, self.dataModel.all, 2);

		// insert street to split extent
		var extentSplitPromises = [];
		self.touchPoints = [];
		var invalidPoints = [];
		split1.forEach(function(extent)
		{
			extentSplitPromises.push(new Promise(function(resolve, reject)
			{
				setTimeout(function()
				{
					for (var i = 0; i < extent.streets.length; i++)
					{
						invalidPoints = invalidPoints.concat(self.showInvalidJunction(extent.streets[i], extent.streets, i + 1));
					}
					resolve();
				});
			}));
		});

		Promise.all(extentSplitPromises).then(function()
		{
			var invalidJunctionPointSets = new Set();
			invalidPoints.forEach((point) =>
			{
				return invalidJunctionPointSets.add(point.x + "-" + point.y);
			});
			self.deleteInvalidJunctions(function(g)
			{
				return (!invalidJunctionPointSets.has(g.geometry.x + "-" + g.geometry.y)) || Enumerable.From(self.touchPoints).Any(function(c) { return c[0] == g.geometry.x && c[1] == g.geometry.y; });
			});
			self.touchPoints = [];
		});
	};

	MyStreetsControlDisplay.prototype.splitStreetInExtent = function(extent, streetGraphics, count)
	{
		var splitCount = count;
		var xSplit = Math.abs(extent.xmax - extent.xmin) / splitCount;
		var ySplit = Math.abs(extent.ymax - extent.ymin) / splitCount;
		var splitExtents = [];
		for (var i = 0; i < splitCount; i++)
		{
			for (var j = 0; j < splitCount; j++)
			{
				var newExtent = new tf.map.ArcGIS.Extent(extent.xmin + xSplit * i, extent.ymin + ySplit * j, extent.xmin + xSplit * (i + 1), extent.ymin + ySplit * (j + 1), extent.spatialReference);
				var streets = [];
				streetGraphics.forEach(function(graphic)
				{
					if (newExtent.intersects(graphic.geometry))
					{
						streets.push(graphic);
					}
				});
				splitExtents.push({
					extent: newExtent,
					streets: streets
				});
			}
		}
		return splitExtents;
	};

	MyStreetsControlDisplay.prototype.showInvalidJunction = function(street, otherStreets)
	{
		var self = this;
		var invalidJunctionsPoints = [];
		var streetGeo = street.geometry;
		var streetId = street.id;

		for (var i = 0; i < otherStreets.length; i++)
		{
			if (otherStreets[i].id == streetId)
			{
				continue;
			}
			var intersects = self.getInvalidJunctionTouchPoint(street, otherStreets[i]);
			intersects.forEach(function(p)
			{
				p.attributes = {
					id1: streetId,
					id2: otherStreets[i].id
				};
				invalidJunctionsPoints.push(p);
			});
		}

		var notTouchPoints = [];
		if (!streetGeo.startTouch)
		{
			var p = helper.getStartPoint(streetGeo);
			notTouchPoints.push(p);
		}
		if (!streetGeo.endTouch)
		{
			var p = helper.getEndPoint(streetGeo);
			notTouchPoints.push(p);
		}
		notTouchPoints.forEach(function(p)
		{
			var point = new tf.map.ArcGIS.Point(p, streetGeo.spatialReference);
			for (var j = 0; j < otherStreets.length; j++)
			{
				if (otherStreets[j].id == streetId)
				{
					continue;
				}
				var distance = tf.map.ArcGIS.geometryEngine.distance(point, otherStreets[j].geometry, "meters");
				if (distance < 10 && distance > 0)
				{
					point.attributes = {
						id1: streetId,
						id2: 0
					};
					invalidJunctionsPoints.push(point);
					break;
				}
			}
		});
		invalidJunctionsPoints.forEach(function(c)
		{
			self.invalidJunctionsLayer.add(self.createJunctionGraphic([c.x, c.y], new tf.map.ArcGIS.Color([255, 0, 0, 1]), c.attributes));
		});
		return invalidJunctionsPoints;
	};

	MyStreetsControlDisplay.prototype.getInvalidJunctionTouchPoint = function(street1, street2)
	{
		var self = this;
		var points = [];
		var streetGeo1 = street1.geometry;
		var streetGeo2 = street2.geometry;
		var startPoint1 = streetGeo1.paths[0][0];
		var endPoint1 = streetGeo1.paths[0][streetGeo1.paths[0].length - 1];
		var startPoint2 = streetGeo2.paths[0][0];
		var endPoint2 = streetGeo2.paths[0][streetGeo2.paths[0].length - 1];
		var endPointTouch = false;
		if (helper.isSamePoint(startPoint1, startPoint2))
		{
			streetGeo1.startTouch = true;
			streetGeo2.startTouch = true;
			endPointTouch = true;
			self.touchPoints.push(startPoint1);
		}
		if (helper.isSamePoint(startPoint1, endPoint2))
		{
			streetGeo1.startTouch = true;
			streetGeo2.endTouch = true;
			endPointTouch = true;
			self.touchPoints.push(startPoint1);
		}
		if (helper.isSamePoint(endPoint1, startPoint2))
		{
			streetGeo1.endTouch = true;
			streetGeo2.startTouch = true;
			endPointTouch = true;
			self.touchPoints.push(endPoint1);
		}
		if (helper.isSamePoint(endPoint1, endPoint2))
		{
			streetGeo1.endTouch = true;
			streetGeo2.endTouch = true;
			endPointTouch = true;
			self.touchPoints.push(endPoint1);
		}
		if (endPointTouch)
		{
			return points;
		}

		if (tf.map.ArcGIS.geometryEngine.intersects(streetGeo1, streetGeo2) &&
			((street1.FromElevation == street2.ToElevation && street1.ToElevation == street2.FromElevation) || (street1.FromElevation == street2.FromElevation && street1.ToElevation == street2.ToElevation)))
		{
			var buffer1 = tf.map.ArcGIS.geometryEngine.buffer(streetGeo1, 0.1, "meters");
			var buffer2 = tf.map.ArcGIS.geometryEngine.buffer(streetGeo2, 0.1, "meters");
			var buffers = tf.map.ArcGIS.geometryEngine.intersect(buffer1, buffer2);
			if (buffers)
			{
				if (!$.isArray(buffers))
				{
					buffers = [buffers];
				}
				var polygons = [];
				for (var i = 0; i < buffers.length; i++)
				{
					for (var j = 0; j < buffers[i].rings.length; j++)
					{
						polygons.push(new tf.map.ArcGIS.Polygon([buffers[i].rings[j]], self.map.mapView.spatialReference));
					}

				}
				for (var i = 0; i < polygons.length; i++)
				{
					var touchPoint = polygons[i].centroid;
					[startPoint1, endPoint1, startPoint2, endPoint2].forEach(function(item, index)
					{
						if (helper.isSamePointInBuffer([touchPoint.x, touchPoint.y], item))
						{
							if (index == 0)
							{
								streetGeo1.startTouch = true;
							} else if (index == 1)
							{
								streetGeo1.endTouch = true;
							} else if (index == 2)
							{
								streetGeo2.startTouch = true;
							} else if (index == 3)
							{
								streetGeo2.endTouch = true;
							}
						}
					});
					points.push(touchPoint);
				}
			}
		}

		return points;
	};
	// endregion

	MyStreetsControlDisplay.prototype.createJunctionGraphic = function(xy, color, attributes)
	{
		color = color || new tf.map.ArcGIS.Color([99, 99, 99, 1]);
		var point = new tf.map.ArcGIS.Point(xy, this.map.mapView.spatialReference);
		var g = new tf.map.ArcGIS.Graphic(point, {
			type: "simple-marker",
			color: color,
			outline: null,
			size: 10,
			style: "square"
		}, attributes || {});
		return g;
	};

	MyStreetsControlDisplay.prototype.dispose = function()
	{
		this.scaleChange && this.scaleChange.remove();
	};

})();
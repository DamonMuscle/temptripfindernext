(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").MyStreetsMapTool = MyStreetsMapTool;

	function MyStreetsMapTool(viewModel)
	{
		var self = this;
		self.viewModel = viewModel;
		self._viewModal = viewModel.viewModel._viewModal;
		self.dataModel = viewModel.dataModel;
		self._map = self._viewModal._map;
		self.editModal = viewModel.editModal;
		TF.RoutingMap.EsriFeatureTool.call(self, self._map);
		self.minZoom = 15;
		self.isTileRender = true;
		self.currentColor = "#0090c0";
		self.streetEditHightColor = "#595959";

		self.dataModel.onAllChangeEvent.subscribe(this.onChangeEvent.bind(this));
		self.dataModel.highlightChangedEvent.subscribe(this.onHighlightChangedEvent.bind(this));
		self.dataModel.settingChangeEvent.subscribe(this.onSettingChangeEvent.bind(this));
		self.initialize();
	}

	MyStreetsMapTool.prototype = Object.create(TF.RoutingMap.EsriFeatureTool.prototype);
	MyStreetsMapTool.prototype.constructor = MyStreetsMapTool;

	var defaultSymbol = {
		type: "simple-line",
		color: TF.StreetHelper.color,
		width: 1,
		cap: "butt"
	};

	MyStreetsMapTool.prototype.initialize = function()
	{
		var self = this;
		self.initializeBase({
			polyline: {
				id: "streetFeatureLayer",
				symbol: defaultSymbol,
				renderer: self.getRenderer()
			}
		});

		self.splitLayer = new self._arcgis.GraphicsLayer({
			id: "splitStreet"
		});
		self._map.add(self.splitLayer);
		self.viewModel.layers.push(self.splitLayer.id);

		self.initializeSettings();
	};

	MyStreetsMapTool.prototype.initializeSettings = function()
	{
		var self = this;
		return self.dataModel.getSetting().then(function(settings)
		{
			self._moveDuplicateNode = settings.moveDuplicateNodes;
		});
	};

	MyStreetsMapTool.prototype.onSettingChangeEvent = function()
	{
		var self = this;
		self.initializeSettings();
	};

	MyStreetsMapTool.prototype._findGraphicsInLayer = function(layer, id)
	{
		var self = this;
		if (layer)
		{
			var all = self.dataModel.all;
			var records = [];
			if (!self._moveDuplicateNode || layer.geometryType == "point")
			{
				records = [self.dataModel.findAndCloneById(id)];
			} else
			{
				var extent = self.dataModel.findById(id).geometry.extent;
				records = all.filter(function(item)
				{
					return extent.intersects(item.geometry);
				}).map(function(item)
				{
					return $.extend({}, item, {
						geometry: item.geometry.clone()
					});
				});

			}
			if (layer.geometryType == "polyline") return self._findTouchedGraphics(id, records).polylines;
			else if (layer.geometryType == "polygon") return self._findTouchedGraphics(id, records).polygons;
			else if (layer.geometryType == "point") return self._findTouchedGraphics(id, records).points;
		}
	};

	MyStreetsMapTool.prototype.split = function(id)
	{
		var self = this;
		self.sketchTool.stopAndClear();
		return self._waitAddBackFinish().then(function()
		{
			var street = self.dataModel.findAndCloneById(id);
			self.splitLayer.removeAll();

			var pathGraphic = new self._arcgis.Graphic({
				geometry: street.geometry,
				symbol: self.symbol.editPolylineSymbol()
			});
			self.splitLayer.add(pathGraphic);

			// add terminal vertex 
			street.geometry.paths[0].map(function(p)
			{
				var vertexGraphic = new self._arcgis.Graphic({
					geometry: {
						type: "point",
						x: p[0],
						y: p[1],
						spatialReference: self._map.mapView.spatialReference
					},
					symbol: {
						type: "simple-marker",
						size: 8,
						color: [0, 0, 0, 1]
					}
				});
				self.splitLayer.add(vertexGraphic);
			});

			// add split point
			var splitPointGraphic = new self._arcgis.Graphic({
				geometry: {
					type: "point",
					x: 0,
					y: 0,
					spatialReference: self._map.mapView.spatialReference
				},
				symbol: {
					type: "simple-marker",
					size: 12,
					color: [153, 51, 0, 1]
				},
				visible: false
			});
			self.splitLayer.add(splitPointGraphic);

			// add events
			if (self.mouseDragHandler) { self.mouseDragHandler.remove(); }
			if (self.mouseDownHandler) { self.mouseDownHandler.remove(); }
			self.mouseDragHandler = self._map.mapView.on("pointer-move", function(evt)
			{
				var mapPoint = self._map.mapView.toMap(evt);
				var nearestPoint = new self._arcgis.geometryEngine.nearestCoordinate(street.geometry, mapPoint);
				var distance = self._arcgis.geometryEngine.distance(mapPoint, nearestPoint.coordinate, "meters");
				if (distance < 40)
				{
					splitPointGraphic.visible = true;
					splitPointGraphic.geometry = (nearestPoint.coordinate);
					TF.Helper.MapHelper.setMapCursor(self._map, "pointer");
				} else
				{
					splitPointGraphic.visible = false;
					TF.Helper.MapHelper.setMapCursor(self._map, "default");
				}
			});
			self.mouseDownHandler = self._map.mapView.on("click", function()
			{
				if (splitPointGraphic.visible)
				{
					self._viewModal.getSnappingPoint(splitPointGraphic.geometry).then(function(point)
					{
						self._splitConfirm().then(function(ans)
						{
							if (ans == true)
							{
								if (point) splitPointGraphic.geometry = point;
								self._splitStreet(splitPointGraphic, street);
								self._stopSplit();
							}
						});
					});
				} else
				{
					self._stopSplit();
				}
			});
		});
	};

	MyStreetsMapTool.prototype._splitStreet = function(graphic, street)
	{
		if (!street)
		{
			return;
		}
		var self = this,
			path = street.geometry.paths[0],
			seg1 = [path[0]], seg2 = [], find = false;
		TF.RoutingMap.MapEditingPalette.MyStreetsHelper.bindCurbToStreet(street, self.dataModel.curbTurnDataModel.curbs);
		TF.RoutingMap.MapEditingPalette.MyStreetsHelper.bindTurnToStreet(street, self.dataModel.curbTurnDataModel.maneuvers);
		var maneuverInfo = street.maneuverInfo;
		for (var i = 0; i < path.length - 1; i++)
		{
			var line = new self._arcgis.Polyline({ spatialReference: self._map.mapView.spatialReference });
			line.addPath([path[i], path[i + 1]]);
			if (self._arcgis.geometryEngine.intersects(line, graphic.geometry))
			{
				find = true;
				seg1.push([graphic.geometry.x, graphic.geometry.y]);
				seg2.push([graphic.geometry.x, graphic.geometry.y]);
			}

			if (find)
			{
				seg2.push(path[i + 1]);
			} else
			{
				seg1.push(path[i + 1]);
			}
		}
		var segment1 = new self._arcgis.Polyline({ spatialReference: self._map.mapView.spatialReference });
		segment1.addPath(seg1);
		var segment2 = new self._arcgis.Polyline({ spatialReference: self._map.mapView.spatialReference });
		segment2.addPath(seg2);
		if (!self._arcgis.geometryEngine.equals(street.geometry, segment1) &&
			!self._arcgis.geometryEngine.equals(street.geometry, segment2))
		{
			var backUpToRevert = $.extend({}, street, { geometry: TF.cloneGeometry(street.geometry) }, {
				maneuverInfo: {
					curbInfo: TF.RoutingMap.MapEditingPalette.MyStreetsHelper.getCurbToStreet(street, self.dataModel.curbTurnDataModel.curbs),
					maneuvers: TF.RoutingMap.MapEditingPalette.MyStreetsHelper.getTurnToStreet(street, self.dataModel.curbTurnDataModel.maneuvers)
				}
			});
			// delete street
			// street.Fromleft = 0;
			// street.Fromright = 0;
			// street.Toleft = 0;
			// street.Toright = 0;
			// street.geometry = segment1;
			self.dataModel.delete([street]);

			// add street
			var createDatas = [];
			[segment1, segment2].forEach(function(segment)
			{
				var createData = $.extend(true, {}, street);
				createData.id = TF.createId();
				createData.geometry = segment;
				createData.distance = self._arcgis.geometryEngine.geodesicLength(segment, "miles");
				createData.leftTime = (createData.distance / createData.Speedleft) * 60;
				createData.rightTime = (createData.distance / createData.Speedright) * 60;
				createData.Fromleft = 0;
				createData.Fromright = 0;
				createData.Toleft = 0;
				createData.Toright = 0;
				createData.OBJECTID = 0;
				createData.maneuverInfo = TF.RoutingMap.MapEditingPalette.MyStreetsHelper.copyManeuverInfo(maneuverInfo, createData);
				createDatas.push(createData);
				self.dataModel.create(createData, true);
			})



			// add revert data
			self._viewModal.revertMode = "split-mystreets";
			self._viewModal.revertData = [{ old: backUpToRevert, new: createDatas }];
		}
	};

	MyStreetsMapTool.prototype._splitStreetByMultiPoints = function(points, street)
	{
		if (!street)
		{
			return;
		}
		var self = this, pointsOnPath = street.geometry.paths[0];
		var result = [], lastIndex = 0;
		pointsOnPath.forEach(function(pt, index)
		{
			if (isOnSnapPoint(pt, points) || index == pointsOnPath.length - 1)
			{
				var segment = new tf.map.ArcGIS.Polyline({ spatialReference: self._map.mapView.spatialReference });
				if (lastIndex != index || index == pointsOnPath.length - 1)
				{
					segment.addPath(getPoints(lastIndex, index, pointsOnPath));
					result.push(segment);
					lastIndex = index;
				}

			}
		});
		function getPoints(startIndex, endIndex, points)
		{
			var result = [];
			for (var i = startIndex; i <= endIndex; i++)
			{
				result.push(points[i]);
			}
			return result;
		}
		function isOnSnapPoint(coor, points)
		{
			for (var i = 0; i < points.length; i++)
			{
				if (coor[0].toFixed(4) == points[i].x.toFixed(4) && coor[1].toFixed(4) == points[i].y.toFixed(4))
				{
					return true;
				}
			}

			return false;
		}
		return result;
	};


	MyStreetsMapTool.prototype._splitConfirm = function()
	{
		return tf.promiseBootbox.dialog(
			{
				message: "Are you sure you want to split the street segment at this point?",
				title: "Confirmation",
				closeButton: true,
				buttons: {
					yes: {
						label: "Yes",
						className: "btn-primary btn-sm btn-primary-black"
					},
					no: {
						label: "Cancel",
						className: "btn-default btn-sm btn-default-link"
					}
				}
			})
			.then(function(result)
			{
				if (result == "yes")
				{
					return true;
				}
			});
	};

	MyStreetsMapTool.prototype._stopSplit = function()
	{
		var self = this;
		if (self.mouseDownHandler) { self.mouseDownHandler.remove(); self.mouseDownHandler = null; }
		if (self.mouseDragHandler) { self.mouseDragHandler.remove(); self.mouseDragHandler = null; }
		self.splitLayer.removeAll();
		TF.Helper.MapHelper.setMapCursor(self._map, "default");
	};

	MyStreetsMapTool.prototype._onMapKeyDown = function(e)
	{
		if (e.key == "Escape")
		{
			this._stopSplit();
		}
	};

	MyStreetsMapTool.prototype.otherFields = function()
	{
		var otherFields = this.viewModel.viewModel._viewModal.mapLayersPaletteViewModel.myStreetDisplaySetting.getLabelFields();
		return otherFields.concat([{
			name: "styleValue",
			fieldName: 'styleValue'
		}, {
			name: "opacity",
			fieldName: 'opacity'
		}, {
			name: "width",
			fieldName: 'width'
		}, {
			name: "pattern",
			fieldName: 'pattern'
		}]);
	};

	MyStreetsMapTool.prototype.getRenderer = function()
	{
		var uniqueValueInfos = [];
		TF.Map.MapLineStyle.getAll().forEach(function(item)
		{
			TF.Map.MapLineStyle.colors.forEach(function(color)
			{
				uniqueValueInfos.push({
					value: item.pattern + ":" + color,
					symbol: {
						type: "simple-line",
						width: 1,
						style: item.style,
						color: color,
						cap: defaultSymbol.cap
					}
				});
			});
		});

		var sizeVisualVariable = {
			type: "size",
			field: "width",
			minDataValue: 1,
			maxDataValue: 18,
			minSize: 1,
			maxSize: 18
		};

		var opacityVisualVariable = {
			type: "opacity",
			field: "opacity",
			stops: [
				{ value: 1, opacity: 1 },
				{ value: 0, opacity: 0 }
			]
		};
		return {
			type: "unique-value",
			field: "styleValue",
			visualVariables: [sizeVisualVariable, opacityVisualVariable],
			defaultSymbol: defaultSymbol,
			uniqueValueInfos: uniqueValueInfos
		};
	};
})();

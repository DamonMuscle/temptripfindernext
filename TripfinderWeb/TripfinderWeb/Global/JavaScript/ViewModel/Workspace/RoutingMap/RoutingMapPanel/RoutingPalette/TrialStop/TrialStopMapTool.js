(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").TrialStopMapTool = TrialStopMapTool;

	function TrialStopMapTool(viewModel)
	{
		var self = this;
		self.viewModel = viewModel;
		self._viewModal = viewModel.viewModel._viewModal;
		self.dataModel = viewModel.dataModel;
		self._map = self._viewModal._map;
		self.editModal = viewModel.editModal;
		TF.RoutingMap.EsriTool.call(self, self._map);
		self._boundaryThickness = 5;

		self._walkoutHighlightLineSymbol = self.symbol.getHighlightLineSymbol();
		self.initialize();
		self.viewModel.dataModel.onAllChangeEvent.subscribe(this.onAllChangeEvent.bind(this));
		//self.viewModel.dataModel.studentUpdateEvent.subscribe(this.studentUpdateEvent.bind(this));
		self.viewModel.dataModel.highlightChangedEvent.subscribe(this.onHighlightChangedEvent.bind(this));
		self.viewModel.dataModel.settingChangeEvent.subscribe(this.settingChangeEvent.bind(this));

		self.stopTool = new TF.RoutingMap.RoutingPalette.StopTool(self);
		self.stopPreviewTool = new TF.RoutingMap.RoutingPalette.StopPreviewTool(self, self._map);
		self.dataModel.onTrialStopWalkoutPreviewChange.subscribe(self.stopPreviewTool.onTrialStopWalkoutPreviewChange.bind(self.stopPreviewTool));

	}
	TrialStopMapTool.prototype = Object.create(TF.RoutingMap.EsriTool.prototype);
	TrialStopMapTool.prototype.constructor = TrialStopMapTool;

	var labelMinScale = 36111.909643;

	TrialStopMapTool.prototype.initialize = function()
	{
		var self = this;
		self.initializePrevOtherLayers();
		var layerIds = { pointLayerId: "trialStopPointLayer", polygonLayerId: "trialStopFeatureLayer" };
		self.initializeBase.apply(self, [layerIds]);
		self.viewModel.layers.push(layerIds.pointLayerId);
		self.viewModel.layers.push(layerIds.polygonLayerId);
		self.initializeAfterOtherLayers();
		self.initializeSettings();
		self.zoomEvent = self._map.mapView.watch("zoom", function()
		{
			self.updateLabelLine();
			self.updateLabel();
		});
		self.mouseDown = self._map.mapView.on("pointer-down", self._activeMoveLabel.bind(self));
		self.mouseUp = self._map.mapView.on("pointer-up", self._inactiveMoveLabel.bind(self));
		self.mouseDrag = self._map.mapView.on("drag", self._addLineToMovedLabel.bind(self));
	};

	TrialStopMapTool.prototype.initializePrevOtherLayers = function()
	{
		var self = this;
		self._previewLayer = new self._arcgis.GraphicsLayer({
			"id": "trialStopPreviewLayer"
		});
		self._map.add(self._previewLayer);
		self.viewModel.layers.push(self._previewLayer.id);

		self._tempWalkoutLayer = new self._arcgis.GraphicsLayer({
			"id": "trialStopTempWalkoutLayer"
		});
		self._map.add(self._tempWalkoutLayer);
		self.viewModel.layers.push(self._tempWalkoutLayer.id);
	};

	TrialStopMapTool.prototype.initializeAfterOtherLayers = function()
	{
		var self = this;
		self._trialStopLineLayer = new self._arcgis.GraphicsLayer({
			"id": "trialStopLineLayer",
			minScale: labelMinScale
		});
		self._map.add(self._trialStopLineLayer, self._map.allLayers.items.indexOf(self._pointLayer) - 1);
		self.viewModel.layers.push(self._trialStopLineLayer.id);

		self._trialStopLabelLayer = new self._arcgis.GraphicsLayer({
			"id": "trialStopLabelLayer",
			minScale: labelMinScale
		});
		self._map.add(self._trialStopLabelLayer);
		self.viewModel.layers.push(self._trialStopLabelLayer.id);

		self._trialStopHighlightLayer = new self._arcgis.GraphicsLayer({
			"id": "trialStopHighlightLayer"
		});
		self._map.add(self._trialStopHighlightLayer);
		self.viewModel.layers.push(self._trialStopHighlightLayer.id);
	};

	TrialStopMapTool.prototype.initializeSettings = function()
	{
		var self = this;
		self.dataModel.getSetting().then(function(setting)
		{
			self._prohibitCrosser = setting.prohibitCrosser;
			self._walkoutType = setting.walkoutType;
			self._walkoutDistance = setting.walkoutDistance;
			self._walkoutDistanceUnit = setting.walkoutDistanceUnit;
			self._walkoutBuffer = setting.walkoutBuffer;
			self._walkoutBufferUnit = setting.walkoutBufferUnit;
		});
	}

	TrialStopMapTool.prototype.onAllChangeEvent = function(event, items)
	{
		var self = this;

		function handleData(data, handleFunction)
		{
			if (data.length > 0)
			{
				data.forEach(function(item)
				{
					handleFunction.call(self, item);
				});
			}
		}
		handleData(items.delete, self._deleteTrialStop);
		handleData(items.add, self._addTrialStop);
		handleData(items.edit, self._updateTrialStop);
	};

	TrialStopMapTool.prototype.startPreview = function(geometryType)
	{
		var self = this;
		if (geometryType == "point")
		{
			self.stopPreviewTool._startWalkoutPreview(self._walkoutDistance, self._walkoutDistanceUnit, self._walkoutBuffer,
				self._walkoutBufferUnit, self._walkoutType, true);
		}
	}
	TrialStopMapTool.prototype._addTrialStop = function(item)
	{
		var self = this;
		var geometry = TF.cloneGeometry(item.geometry);
		var stopGraphic = new this._arcgis.Graphic(TF.cloneGeometry(item.geometry), self.symbol.trialStopSymbol(item.Color), {
			"dataModel": item,
			type: "trialStop"
		});
		self._pointLayer.add(stopGraphic);

		if (item.boundary.geometry)
		{
			var selectColor = item.Color;
			var boundaryGeometry, boundarySymbol;
			if (item.WalkoutType == 0 && !item.isDoorToDoor)
			{
				boundaryGeometry = TF.cloneGeometry(item.walkoutGuide.geometry);
				boundarySymbol = {
					type: "simple-line",
					color: selectColor,
					width: self._boundaryThickness
				};
			} else
			{
				boundaryGeometry = TF.cloneGeometry(item.boundary.geometry);
				boundarySymbol = {
					type: "simple-fill",
					color: [0, 0, 0, 0],
					outline: {
						color: selectColor,
						width: self._boundaryThickness
					}
				};
			}
			var walkoutGraphic = new this._arcgis.Graphic(boundaryGeometry, boundarySymbol, {
				"dataModel": $.extend({}, item.boundary),
				type: "boundary"
			});
			stopGraphic.attributes.walkout = walkoutGraphic;
			self._polygonLayer.add(walkoutGraphic);
		}

		var labelGraphic = new this._arcgis.Graphic(geometry, self.symbol.createStudentLabelSymbol(item, false), {
			"dataModel": item,
			type: "label",
			xoffset: -68,
			yoffset: 28
		});
		self.setLabelGeometry(geometry, labelGraphic);
		self._trialStopLabelLayer.add(labelGraphic);
		self.updateLineSymbol(stopGraphic, labelGraphic);
	};

	TrialStopMapTool.prototype.setLabelGeometry = function(stopGeometry, labelGraphic)
	{
		var self = this;
		var screenPoint = self._map.mapView.toScreen(stopGeometry);
		var mapPoint = self._map.mapView.toMap({
			x: screenPoint.x + labelGraphic.attributes.xoffset,
			y: screenPoint.y + labelGraphic.attributes.yoffset
		});
		labelGraphic.geometry = mapPoint;
	};

	TrialStopMapTool.prototype._updateTrialStop = function(item)
	{
		var self = this;
		var boundaryGeometry, boundarySymbol;
		// update walkout
		self._polygonLayer.graphics.forEach(function(graphic)
		{
			if (graphic.attributes.dataModel.id == item.id)
			{
				var selectColor = item.Color;
				if (item.WalkoutType == 0 && !item.isDoorToDoor)
				{
					boundaryGeometry = TF.cloneGeometry(item.walkoutGuide.geometry);
					boundarySymbol = {
						type: "simple-line",
						color: selectColor,
						width: self._boundaryThickness
					};
				} else
				{
					boundaryGeometry = TF.cloneGeometry(item.boundary.geometry);
					boundarySymbol = {
						type: "simple-fill",
						color: [0, 0, 0, 0],
						outline: {
							color: selectColor,
							width: self._boundaryThickness
						}
					};
				}
				graphic.geometry = boundaryGeometry;
				graphic.symbol = boundarySymbol;
				graphic.attributes.dataModel = item.boundary;
			}
		});
		self._pointLayer.graphics.forEach(function(graphic)
		{
			if (graphic.attributes.dataModel.id == item.id)
			{
				graphic.attributes.dataModel.boundary = self._polygonLayer.graphics.items.filter(function(g) { return g.attributes.dataModel.id == graphic.attributes.dataModel.id; })[0].attributes.dataModel;
				graphic.symbol = self.symbol.trialStopSymbol(item.Color);
				graphic.geometry = item.geometry;
			}
		});
		self.updateLabelLine();
		var label = self.getGraphicByStopId(self._trialStopLabelLayer, item.id);
		label.symbol = self.symbol.createStudentLabelSymbol(item, false);
		self.onHighlightChangedEvent(null, self.viewModel.dataModel.highlighted);
	};

	TrialStopMapTool.prototype._deleteTrialStop = function(item)
	{
		var self = this;
		self.removeGraphic(self._pointLayer, item.id);
		self.removeGraphic(self._polygonLayer, item.id);
		self.removeGraphic(self._trialStopLabelLayer, item.id);
		self.removeGraphic(self._trialStopLineLayer, item.id);
	};

	TrialStopMapTool.prototype.removeGraphic = function(layer, id)
	{
		for (var i = 0; i < layer.graphics.items.length; i++)
		{
			if (layer.graphics.items[i].attributes.dataModel.id == id)
			{
				layer.remove(layer.graphics.items[i]);
				return;
			}
		}
	};

	TrialStopMapTool.prototype.updateLabelLine = function()
	{
		var self = this;
		self._pointLayer.graphics.map(function(graphic)
		{
			// update visibile trial stop label line
			if (self._map.mapView.extent.intersects(graphic.geometry))
			{
				self.updateLineSymbol(graphic);
			}
			else
			{
				// hidden unvisible trial stop label line
				var lineGraphic = self.getGraphicByStopId(self._trialStopLineLayer, graphic.attributes.dataModel.id);
				lineGraphic.visible = false;
			}
		});
	};

	TrialStopMapTool.prototype.updateLabel = function()
	{
		var self = this;
		var labelMaps = {};
		self._trialStopLabelLayer.graphics.forEach(function(graphic)
		{
			labelMaps[graphic.attributes.dataModel.id] = graphic;
		});
		self._pointLayer.graphics.map(function(graphic)
		{
			if (graphic.attributes.dataModel)// avoid temp draw stop point update label
			{
				self.setLabelGeometry(graphic.geometry, labelMaps[graphic.attributes.dataModel.id]);
			}
		});
	};

	TrialStopMapTool.prototype.updateLineSymbol = function(stopGraphic, labelGraphic)
	{
		var self = this;

		if (!stopGraphic.attributes.dataModel)
		{
			return;
		}

		if (!labelGraphic)
		{
			labelGraphic = self.getGraphicByStopId(self._trialStopLabelLayer, stopGraphic.attributes.dataModel.id);
		}

		if (!labelGraphic.visible)
		{
			labelGraphic.visible = true;
		}

		var selectColor = stopGraphic.attributes.dataModel.Color;
		var sms = {
			type: "simple-line",
			color: selectColor,
			width: 1
		};
		var lineGraphic = new self._arcgis.Graphic(self.createLine(stopGraphic.geometry, labelGraphic.geometry), sms, $.extend(stopGraphic.attributes, {
			"dataModel": stopGraphic.attributes.dataModel,
			type: "line"
		}));
		self.removeGraphic(self._trialStopLineLayer, stopGraphic.attributes.dataModel.id);
		self._trialStopLineLayer.add(lineGraphic);
	};

	TrialStopMapTool.prototype.createLine = function(p1, p2)
	{
		var self = this;
		var newGeom = new self._arcgis.Polyline({
			"paths": [[[p1.x, p1.y], [p2.x, p2.y]]],
			"spatialReference": self._map.mapView.spatialReference
		});
		return newGeom;
	};

	TrialStopMapTool.prototype.getGraphicByStopId = function(layer, id)
	{
		var result;
		layer.graphics.forEach(function(graphic)
		{
			if (graphic.attributes.dataModel.id == id)
			{
				result = graphic;
				return;
			}
		});
		return result;
	};

	TrialStopMapTool.prototype.getPaletteName = function()
	{
		return "TrialStop";
	};

	TrialStopMapTool.prototype.getDataModel = function()
	{
		return this.viewModel;
	};

	TrialStopMapTool.prototype.addPointToLayer = function(graphic)
	{
		var self = this;
		var promise = Promise.resolve(true);
		promise.then(function()
		{
			var currentTravelScenario = self._viewModal.travelScenariosPaletteViewModel.travelScenariosViewModel.obSelectedTravelScenarios();
			self.stopPreviewTool.addPreview(graphic, self._walkoutDistance, self._walkoutDistanceUnit, self._walkoutBuffer, self._walkoutBufferUnit,
				self._walkoutType, true, currentTravelScenario);
			self.onAddTripStopGraphic(graphic);
			return Promise.resolve(true);
		});
	}

	TrialStopMapTool.prototype.getSymbol = function(graphic, type)
	{
		var geometry = graphic;
		if (graphic.geometry)
		{
			geometry = graphic.geometry;
		}
		if (geometry.type == 'point')
		{
			return this.symbol.trialStopSymbol(this.symbol.symbolColors.grayForEditing);
		}
		else if (geometry.type == 'polyline')
		{
			return this.symbol.drawPolylineSymbol();
		}
		else
		{
			return this.symbol.drawPolygonSymbol();
		}
	};

	TrialStopMapTool.prototype.onAddTripStopGraphic = function(graphic, options)
	{
		var self = this;
		graphic.attributes = { "id": TF.createId() };
		graphic.symbol = self.symbol.trialStopSymbol("#000000");
		self.getSnappedTripStop(graphic).then(function()
		{
			self.getTripStopStreetAddress(graphic).then(function()
			{
				self.onAddGraphic(graphic);
			});
		});
	};

	TrialStopMapTool.prototype.getTripStopStreetAddress = function(tripStop)
	{
		var self = this,
			streetName = "unnamed",
			promise = Promise.resolve(false);

		if (tripStop.attributes.junctionStreets && tripStop.attributes.junctionStreets.length > 0)
		{
			promise = Promise.resolve(self.stopTool.getStreetAddressByJunctionStreets(tripStop.attributes.junctionStreets));
		} else
		{
			promise = Promise.resolve(self.stopTool.getStopStreetAddress(tripStop.geometry));
		}
		return promise.then(function(street)
		{
			if (street) streetName = street;
			tripStop.attributes.street = streetName;
			return Promise.resolve(tripStop);
		})
	}

	TrialStopMapTool.prototype.onAddGraphic = function(pointGraphic)
	{
		var self = this;
		self._pointLayer.add(pointGraphic);
		self._newTripStopGraphic = pointGraphic;

		// return self.stopTool.reverseGeocodeStop(pointGraphic.geometry, pointGraphic.address).then(function(result)
		// {
		// 	if (result)
		// 	{
		var trialStopEntity = self.createTrialStopEntity(pointGraphic, pointGraphic.attributes.street);
		trialStopEntity.id = 0;
		return self.editModal.create(trialStopEntity, self.stopTool.generateWalkoutZone)
			.then(function()
			{
				self._clearTempDrawing();
			});
		// 	} else
		// 	{
		// 		self._previewLayer.remove(self._newTripStopGraphic);
		// 	}
		// });

	};

	TrialStopMapTool.prototype._clearTempDrawing = function()
	{
		var self = this;
		self.stopTool.removeGraphicInLayer(this._pointLayer, this._newTripStopGraphic);
		//self._pointLayer.remove(self._newTripStopGraphic);
		self.sketchTool._drawingLayer.removeAll();
		self.stopTool.clearCandidateGraphics();
		self._newTripStopGraphic = [];
	};

	TrialStopMapTool.prototype.stopPreview = function()
	{
		this.stopPreviewTool._stopWalkoutPreview();
	}


	TrialStopMapTool.prototype.selectAndCreateJunctionOnMap = function(selectGraphic)
	{
		var self = this;
		self._viewModal.findJunctionInGeometry(selectGraphic.geometry).then(function(junctions)
		{
			self.createFromJunctions((junctions || []).map(function(point)
			{
				return { geometry: point, attributes: {} };
			}));
		});
	};

	TrialStopMapTool.prototype._findJunctionsByStudent = function(student, streets, barriers)
	{
		var self = this;
		return self.stopTool.findClosestLocationOnStreet({ geometry: student.geometry, address: student.Address }, streets).then(function(nearbyObject)
		{
			var nearbyStreet = nearbyObject.street;
			var nearbyLocationOnStreet = nearbyObject.geometry;
			var doorTodoorLocation = new self._arcgis.Point((nearbyLocationOnStreet.x + student.geometry.x) / 2,
				(nearbyLocationOnStreet.y + student.geometry.y) / 2, self._map.mapView.spatialReference);
			var doorTodoorWalkoutZone = self.stopTool.createDoorToDoorPolygon(doorTodoorLocation, student.geometry, null).geometry;
			var id = TF.createId();
			var doorTodoorGraphic = new self._arcgis.Graphic(doorTodoorLocation, null, { isDoorToDoor: true, walkoutZone: doorTodoorWalkoutZone, id: id, student: student });

			var result = null;
			var junctionPromises = [], walkoutPromises = [];
			if (nearbyStreet.ProhibitCrosser)
			{
				return Promise.resolve(doorTodoorGraphic);
			}

			var streetStartPt = new self._arcgis.Point(nearbyStreet.geometry.paths[0][0], self._map.mapView.spatialReference);
			var streetEndPt = new self._arcgis.Point(nearbyStreet.geometry.paths[0][nearbyStreet.geometry.paths[0].length - 1], self._map.mapView.spatialReference);
			walkoutPromises.push(self.stopTool.generateWalkoutZone(new self._arcgis.Graphic(streetStartPt), self._walkoutDistance, self._walkoutDistanceUnit, self._walkoutBuffer, self._walkoutBufferUnit, self._walkoutType, null, null, null, null, barriers));
			walkoutPromises.push(self.stopTool.generateWalkoutZone(new self._arcgis.Graphic(streetEndPt), self._walkoutDistance, self._walkoutDistanceUnit, self._walkoutBuffer, self._walkoutBufferUnit, self._walkoutType, null, null, null, null, barriers));
			junctionPromises.push(self._viewModal.routingSnapManager.getJunctionStreetOnPoint(streetStartPt, streets));
			junctionPromises.push(self._viewModal.routingSnapManager.getJunctionStreetOnPoint(streetEndPt, streets));
			return Promise.all(walkoutPromises.concat(junctionPromises)).then(function(results)
			{
				var distance1 = self._arcgis.geometryEngine.distance(student.geometry, streetStartPt);
				var distance2 = self._arcgis.geometryEngine.distance(student.geometry, streetEndPt);
				var isStartIntersects = self._arcgis.geometryEngine.intersects(results[0].walkoutZone.geometry, student.geometry);
				var isEndIntersects = self._arcgis.geometryEngine.intersects(results[1].walkoutZone.geometry, student.geometry);
				var startJunctionGraphic = new self._arcgis.Graphic(streetStartPt, null,
					{
						isDoorToDoor: false,
						junctionStreets: results[2],
						walkoutZone: results[0].walkoutZone.geometry,
						id: id
					});
				var endJunctionGraphic = new self._arcgis.Graphic(streetEndPt, null,
					{
						isDoorToDoor: false,
						junctionStreets: results[3],
						walkoutZone: results[1].walkoutZone.geometry,
						id: id
					});
				if (!results[2] && !results[3])
				{
					result = doorTodoorGraphic;
				} else if (results[2] && results[3])
				{

					if (distance1 < distance2)
					{
						if (isStartIntersects)
						{
							result = startJunctionGraphic;
						} else
						{
							if (isEndIntersects)
							{
								result = endJunctionGraphic;
							} else
							{
								result = doorTodoorGraphic;
							}
						}
					} else
					{
						if (isEndIntersects)
						{
							result = endJunctionGraphic;
						} else
						{
							if (isStartIntersects)
							{
								result = startJunctionGraphic;
							} else
							{
								result = doorTodoorGraphic;
							}
						}
					}
				} else
				{
					if (results[2])
					{
						if (isStartIntersects)
						{
							result = startJunctionGraphic;
						} else
						{
							result = doorTodoorGraphic;
						}
					} else if (results[3])
					{
						if (isEndIntersects)
						{
							result = endJunctionGraphic;
						}
						else
						{
							result = doorTodoorGraphic;
						}
					} else
					{
						result = doorTodoorGraphic;
					}
				}
				return Promise.resolve(result);
			})

		});

	}

	TrialStopMapTool.prototype.selectStudentAndCreateJunctionOnMap = function(students)
	{
		var self = this, junctions = [], promises = [];
		tf.loadingIndicator.showImmediately();
		return TF.StreetHelper.getStreetInExtent(students.map(function(p) { return p.geometry; }), "file").then(function(streets)
		{
			return self.stopTool._getSelectedBarriers(2).then(function(barriers)
			{
				students.map(function(student)
				{
					promises.push(self._findJunctionsByStudent(student, streets, barriers));
				});
				return Promise.all(promises).then(function(results)
				{
					results.forEach(function(junction)
					{
						if (junctions.filter(function(j) { return j.geometry.x == junction.geometry.x && j.geometry.y == junction.geometry.y }).length == 0)
						{
							junctions.push(junction);
						}
					});
					self._filterStops(junctions).then(function(junctions)
					{
						tf.loadingIndicator.tryHide();
						self.createFromJunctions(junctions);
					});
				});
			})
		});
	};

	TrialStopMapTool.prototype._filterStops = function(stops)
	{
		var self = this;
		var _resolve = null;
		var promise = new Promise(function(resolve, reject) { _resolve = resolve; });
		var doorTodoorStops = stops.filter(function(stop)
		{
			return stop.attributes.isDoorToDoor;
		});
		var junctions = stops.filter(function(stop)
		{
			return !stop.attributes.isDoorToDoor;
		});

		if (doorTodoorStops.length == 0) _resolve(stops);
		var resultStops = [], promises = [], dtdkeys = [];
		doorTodoorStops.forEach(function(dtd, i)
		{
			var intersectWithAnyJunction = false
			junctions.forEach(function(junction)
			{
				if (self._arcgis.geometryEngine.intersects(junction.attributes.walkoutZone, dtd.attributes.student.geometry))
				{
					intersectWithAnyJunction = true;
					// TODO:
					// promises.push(self.viewModel.viewModel.drawTool._highlightCrossStreetStudents(junction.attributes.walkoutZone, junction, [dtd.attributes.student]));
					dtdkeys.push(i);
				}
			});
			if (!intersectWithAnyJunction) { resultStops.push(dtd); }

		});
		Promise.all(promises).then(function(results)
		{
			results.forEach(function(result, i)
			{
				if (result[1].length > 0)
				{
					resultStops.push(doorTodoorStops[dtdkeys[i]]);
				}
			});
			resultStops = Enumerable.From(resultStops).Distinct(function(c) { return c.attributes.id; }).ToArray();
			_resolve(junctions.concat(resultStops));
		});
		return promise;
	};

	TrialStopMapTool.prototype.createFromJunctions = function(junctions)
	{
		var self = this;

		return this.prepareCreateFromJunctionData(junctions).then(function(trialStops)
		{
			return tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.SelectJunctionModalViewModel(trialStops, self, self.dataModel))
				.then(function(selected)
				{
					self.removeNotSelectGraphic(selected);
					self.stopPreviewTool._addPreviewOnHover();
					return self.editModal.create(selected || [], self.stopTool.generateWalkoutZone.bind(self.stopTool))
						.then(function()
						{
							self._clearTempDrawing();
						});
				});
		});
	};

	TrialStopMapTool.prototype.removeNotSelectGraphic = function(selected)
	{
		var self = this;
		var notSelectGraphic = (self._newTripStopGraphic || []).filter(function(stop)
		{
			return !Enumerable.From(selected).Any(function(c) { return c.id == stop.attributes.id; });
		});
		self.stopTool.removeGraphicInLayer(self._pointLayer, notSelectGraphic);
		var notSelectWalkoutGraphic = self._tempWalkoutLayer.graphics.items.filter(function(walkout)
		{
			return !Enumerable.From(selected).Any(function(c) { return c.previewId == walkout.attributes.previewId; });
		});
		self.stopTool.removeGraphicInLayer(self._tempWalkoutLayer, notSelectWalkoutGraphic);
	};

	TrialStopMapTool.prototype.prepareCreateFromJunctionData = function(junctions)
	{
		var self = this,
			reverseGeocodeStopPromises = [],
			trialStops = [];

		this._newTripStopGraphic = [];
		this.junctionsToCreateStop = junctions;
		return TF.StreetHelper.getStreetInExtent(junctions.map(function(p) { return p.geometry; }), "file").then(function(streets)
		{
			junctions.forEach(function(junction)
			{
				var pointGraphic = new self._arcgis.Graphic(junction.geometry, self.getSymbol(junction.geometry), {
					"id": junction.attributes.id ? junction.attributes.id : TF.createId()
				});
				var reverseGeocodeStopPromise = null;
				if (junction.attributes && junction.attributes.isDoorToDoor)
				{
					reverseGeocodeStopPromise = self.stopTool.getStopAddressByGeometry(pointGraphic.geometry).then(function(result)
					{
						self._pointLayer.add(pointGraphic);
						self._newTripStopGraphic.push(pointGraphic);
						trialStops.push(self.createTrialStopEntity(pointGraphic, result.Street));
					});
				} else if (junction.attributes && junction.attributes.junctionStreets)
				{
					reverseGeocodeStopPromise = new Promise(function(resolve) { resolve(); }).then(function()
					{
						self._pointLayer.add(pointGraphic);
						self._newTripStopGraphic.push(pointGraphic);

						var streetName = self.stopTool.getStreetAddressByJunctionStreets(junction.attributes.junctionStreets);
						trialStops.push(self.createTrialStopEntity(pointGraphic, streetName));
					});
				} else
				{
					reverseGeocodeStopPromise = self._viewModal.routingSnapManager.getJunctionStreetOnPoint(pointGraphic.geometry, streets)
						.then(function(junctionStreets)
						{
							if (junctionStreets)
							{
								self._pointLayer.add(pointGraphic);
								self._newTripStopGraphic.push(pointGraphic);

								var streetName = self.stopTool.getStreetAddressByJunctionStreets(junctionStreets);
								trialStops.push(self.createTrialStopEntity(pointGraphic, streetName));
							}
						});
				}

				reverseGeocodeStopPromises.push(reverseGeocodeStopPromise);
			});
			tf.loadingIndicator.showImmediately();
			return Promise.all(reverseGeocodeStopPromises).then(function()
			{
				var previewId = TF.createId();
				trialStops.forEach(function(item)
				{
					item.previewId = ++previewId;
					var junction = junctions.filter(function(j) { return j.attributes.id == item.id; })[0];
					if (junction)
					{
						item.walkoutZone = junction.attributes.walkoutZone;
						item.isDoorToDoor = junction.attributes.isDoorToDoor;
					}
				});
				return self.stopTool._getSelectedBarriers(2).then(function(barriers)
				{
					return self.stopPreviewTool._getWalkoutPreviews(trialStops, barriers);
				})
			}).then(function()
			{
				tf.loadingIndicator.tryHide();
				return trialStops;
			});
		})

	};

	TrialStopMapTool.prototype.stopSymbol = function(color)
	{
		return this.symbol.trialStopSymbol(color);
	};

	TrialStopMapTool.prototype.studentUpdateEvent = function(event, items)
	{
		var self = this;

		function handleData(data, handleFunction)
		{
			if (data.length > 0)
			{
				data.forEach(function(item)
				{
					handleFunction.call(self, item);
				});
			}
		}
		handleData(items.edit, self._updateStudents);
	};

	TrialStopMapTool.prototype.solveLocationAllocation = function(stops)
	{
		var covered = [], chosenIds = [], subsets = $.extend([], true, stops);

		//greedy algorithm to solve set cover problem
		var students = [];
		stops.forEach(function(stop) 
		{
			stop.students.forEach(function(student)
			{
				students.push(student);
			});
		});
		var universe = Enumerable.From(students).Distinct(function(c) { return c.id; }).ToArray();
		if (universe.length == 0) return false;

		while (covered.length != universe.length)
		{
			var maxnumberofuncovered = 0, maxuncoveredstopid = 0;

			for (var i = 0; i < subsets.length; i++)
			{
				var unconvered = 0;
				subsets[i].students.forEach(function(student)
				{
					if (covered.indexOf(student.id) < 0)
					{
						unconvered++;
					}
				});
				if (unconvered > maxnumberofuncovered)
				{
					maxnumberofuncovered = unconvered;
					maxuncoveredstopid = i;
				}
			}
			covered = covered.concat(Enumerable.From(subsets[maxuncoveredstopid].students).Select("$.id").ToArray());
			covered = Enumerable.From(covered).Distinct().ToArray();
			chosenIds.push(subsets[maxuncoveredstopid].id);
			subsets.splice(maxuncoveredstopid, 1);
		}
		return chosenIds;
	};

	TrialStopMapTool.prototype.settingChangeEvent = function()
	{
		this.initializeSettings();
	};

	TrialStopMapTool.prototype.onHighlightChangedEvent = function(evt, items)
	{
		var self = this;
		self._trialStopHighlightLayer.removeAll();
		var itemIds = Enumerable.From(items).Select("$.id").ToArray();
		self._pointLayer.graphics.forEach(function(graphic)
		{
			if (!graphic.attributes.dataModel) return;
			var isHighlight = itemIds.indexOf(graphic.attributes.dataModel.id) >= 0;
			var highlightColor = "#ffff00";
			if (isHighlight)
			{
				graphic.symbol = self.stopSymbol(highlightColor);
			}
			else
			{
				graphic.symbol = self.stopSymbol(graphic.attributes.dataModel.Color);
			}
			var line = self._map.findLayerById("trialStopFeatureLayer").graphics.items.filter(function(c) { return c.attributes.dataModel.id == graphic.attributes.dataModel.boundary.id; });
			if (line.length > 0)
			{
				line[0].symbol = {
					type: "simple-line",
					color: isHighlight ? highlightColor : graphic.attributes.dataModel.Color,
					width: self._boundaryThickness
				};
			}
		});
	};

	/** 
	 * hide label when move stop
	 */
	TrialStopMapTool.prototype.movePoint = function(id)
	{
		TF.RoutingMap.EsriTool.prototype.movePoint.call(this, id);
		var labelGraphic = this.getGraphicByStopId(this._trialStopLabelLayer, id);
		var lineGraphic = this.getGraphicByStopId(this._trialStopLineLayer, id);
		labelGraphic.visible = false;
		lineGraphic.visible = false;
	};

	/**
	 * show label after finish move stop
	 */
	TrialStopMapTool.prototype.movePointCallback = function(graphics)
	{
		var self = this;
		if (!graphics)
		{
			self._findGraphicInLayerById(self._pointLayer, self._oldTripStopGraphic.attributes.dataModel.id).symbol = self.symbol.trialStopSymbol(self._oldTripStopGraphic.attributes.dataModel.Color);
			//self._oldBoundaryGraphic.symbol = self._oldBoundarySymbol;
			var labelGraphic = self.getGraphicByStopId(self._trialStopLabelLayer, self._oldTripStopGraphic.attributes.dataModel.id);
			var lineGraphic = self.getGraphicByStopId(self._trialStopLineLayer, self._oldTripStopGraphic.attributes.dataModel.id);
			labelGraphic.visible = true;
			lineGraphic.visible = true;
			return;
		}
		var graphic = graphics[0];
		// change symbol to not updating
		graphic.symbol = self.symbol.trialStopSymbol(graphic.attributes.dataModel.Color);

		if (self._polygonLayer)
		{
			var parcel = self._findGraphicInLayerById(self._polygonLayer, graphic.attributes.walkout.attributes.dataModel.id);
			//parcel.symbol = self.getSymbol(graphic.attributes.walkout);

			self.stopTool.reverseGeocodeStop(graphic.geometry).then(function(result)
			{
				if (!result)
				{
					revertToOrigin();
				} else
				{
					var promise = Promise.resolve();
					if (graphic.attributes.dataModel.isDoorToDoor)
					{
						promise = Promise.resolve(self._createFinger(graphic.attributes.dataModel.geometry, graphic.geometry, parcel));

					} else
					{
						promise = self.stopTool.generateWalkoutZone(graphic, graphic.attributes.dataModel.Distance, graphic.attributes.dataModel.DistanceUnit,
							graphic.attributes.dataModel.Buffer, graphic.attributes.dataModel.BufferUnit, graphic.attributes.dataModel.WalkoutType, graphic.attributes.dataModel.Color);
					}

					promise.then(function(result)
					{
						self._viewModal.revertMode = "update-TrialStop";
						self._viewModal.revertData = [];
						var oldData = $.extend({}, graphic.attributes.dataModel, {
							geometry: TF.cloneGeometry(graphic.attributes.dataModel.geometry),
							walkoutGuide: graphic.attributes.dataModel.walkoutGuide ? TF.cloneGeometry(graphic.attributes.dataModel.walkoutGuide.geometry) : null
						});
						oldData.boundary.geometry = TF.cloneGeometry(graphic.attributes.dataModel.boundary.geometry);
						self._viewModal.revertData.push(oldData);
						if (result.walkoutGuide)
						{
							graphic.attributes.dataModel.boundary.geometry = result.walkoutZone.geometry;
							graphic.attributes.dataModel.walkoutGuide.geometry = result.walkoutGuide;
							parcel.geometry = result.walkoutGuide;
						} else
						{
							graphic.attributes.dataModel.boundary.geometry = result;
							oldData.doorToDoorBoundary = TF.cloneGeometry(parcel.geometry);
							parcel.geometry = result;
						}
						graphic.attributes.dataModel.geometry = graphic.geometry;
						self.updateDataModel([graphic]);
						//self.updateLabel();
					});
				}
			});

		} else
		{
			self.updateDataModel([graphic]);
		}

		function revertToOrigin()
		{
			graphic.geometry = self._oldTripStopGraphic.geometry;
			self.updateDataModel([graphic]);
		}
		var id = graphics[0].attributes.dataModel.id;
		var labelGraphic = self.getGraphicByStopId(self._trialStopLabelLayer, id);
		var lineGraphic = self.getGraphicByStopId(self._trialStopLineLayer, id);
		labelGraphic.visible = true;
		lineGraphic.visible = true;
		self.updateLabel();
		self.updateLabelLine();
	};

	TrialStopMapTool.prototype.createTrialStopEntity = function(pointGraphic, streetName)
	{
		var self = this;
		return {
			id: pointGraphic.attributes.id,
			geometry: pointGraphic.geometry,
			Street: streetName,
			City: TF.RoutingMap.GeocodeHelper.getCityName(pointGraphic.geometry),
			Distance: self._walkoutDistance,
			DistanceUnit: self._walkoutDistanceUnit,
			Buffer: self._walkoutBuffer,
			WalkoutType: self._walkoutType,
			BufferUnit: self._walkoutBufferUnit,
			ProhibitCrosser: self._prohibitCrosser,
		};
	};

	/**
	* drag label finished
	*/
	TrialStopMapTool.prototype._activeMoveLabel = function(evt)
	{
		var self = this;
		if (evt.button === 0 && self._trialStopLabelLayer && self._trialStopLabelLayer.graphics.length > 0)
		{
			self._map.mapView.allLayerViews.forEach(function(layerView)
			{
				if (layerView.layer == self._trialStopLabelLayer)
				{
					var point = self._map.mapView.toMap(evt);
					var graphics = layerView.graphicsView._graphicStore.hitTest(point.x, point.y, 2, layerView.graphicsView.view.state.resolution, layerView.graphicsView.view.state.rotation);
					if (graphics.length > 0)
					{
						evt.stopPropagation();
						evt.graphic = graphics[0];
						self.movingLabel = evt.graphic;
						var stopGraphic = null;
						self._pointLayer.graphics.forEach(function(graphic)
						{
							if (graphic.attributes.dataModel.id == self.movingLabel.attributes.dataModel.id)
							{
								stopGraphic = graphic;
								return;
							}
						});
						self._dragOriginStopGraphic = stopGraphic;
						var screenPoint = self._map.mapView.toScreen(graphics[0].geometry);
						self._dragOriginLabelOffset_x = evt.x - screenPoint.x;
						self._dragOriginLabelOffset_y = evt.y - screenPoint.y;
					}
				}
			});
		}
	};

	/**
	 * finish dragging label
	 */
	TrialStopMapTool.prototype._inactiveMoveLabel = function(evt)
	{
		var self = this;
		if (evt.button === 0)
		{
			self.movingLabel = null;
			self._dragOriginStopGraphic = null;
		}
	};

	/**
	* dragging label
	*/
	TrialStopMapTool.prototype._addLineToMovedLabel = function(evt)
	{
		var self = this;
		if (evt.button === 0 && self.movingLabel != null)
		{
			evt.stopPropagation();
			var labelScreenPoint = { x: evt.x - self._dragOriginLabelOffset_x, y: evt.y - self._dragOriginLabelOffset_y };
			var point = self._map.mapView.toMap(labelScreenPoint);
			self.movingLabel.geometry = point;
			var stopScreenPoint = self._map.mapView.toScreen(self._dragOriginStopGraphic.geometry);
			self.movingLabel.attributes.xoffset = labelScreenPoint.x - stopScreenPoint.x;
			self.movingLabel.attributes.yoffset = labelScreenPoint.y - stopScreenPoint.y;
			self.updateLineSymbol(self._dragOriginStopGraphic, self.movingLabel);
		}
	};

	TrialStopMapTool.prototype.revert = function(data, type)
	{
		var self = this;
		if (type == "update")
		{
			data.forEach(function(d)
			{
				var boundaryGraphic = self._findGraphicInLayerById(self._polygonLayer, d.boundary.id);
				var stopGraphic = self._findGraphicInLayerById(self._pointLayer, d.id);
				stopGraphic.geometry = TF.cloneGeometry(d.geometry);
				stopGraphic.attributes.dataModel.boundary.geometry = d.boundary.geometry;
				if (stopGraphic.attributes.dataModel.walkoutGuide)
				{
					boundaryGraphic.geometry = TF.cloneGeometry(d.walkoutGuide);
					stopGraphic.attributes.dataModel.walkoutGuide.geometry = boundaryGraphic.geometry;
				} else
				{
					boundaryGraphic.geometry = TF.cloneGeometry(d.doorToDoorBoundary);
				}
				stopGraphic.attributes.dataModel.geometry = stopGraphic.geometry;
				self.updateLabel();
				self.updateLabelLine();
			});

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
		}
	};

	TrialStopMapTool.prototype.dispose = function()
	{
		this.zoomEvent && this.zoomEvent.remove();
		this.mouseDown && this.mouseDown.remove();
		this.mouseUp && this.mouseUp.remove();
		this.mouseDrag && this.mouseDrag.remove();
	};

})();
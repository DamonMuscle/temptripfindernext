(function()
{
	createNamespace("TF.RoutingMap").EsriTool = EsriTool;
	function EsriTool(map)
	{
		var self = this;
		self._map = map;
		self._arcgis = tf.map.ArcGIS;
		if (!self._viewModal)
		{
			self._viewModal = self.viewModel._viewModal;
		}
		self.sketchTool = self._viewModal.sketchTool;
		self.symbol = new TF.Map.Symbol();
		this.selectionChange = new TF.Events.Event();

		self.stopPreviewTool = new TF.RoutingMap.RoutingPalette.StopPreviewTool(self, self._map);

		self.snapOffsetDistance = 5;
		self.snapInsetDistance = 5;
		self.pointToJunctionDistance = Math.sqrt(Math.pow(self.insetDistance, 2) + Math.pow(self.offsetDistance, 2));
	}

	EsriTool.prototype.initializeBase = function(layerIds)
	{
		var self = this;
		if (layerIds.polygonLayerId)
		{
			self._polygonLayer = new self._arcgis.GraphicsLayer({ "id": layerIds.polygonLayerId });
			self._map.add(self._polygonLayer);
		}
		if (layerIds.polylineLayerId)
		{
			self._polylineLayer = new self._arcgis.GraphicsLayer({ "id": layerIds.polylineLayerId });
			self._map.add(self._polylineLayer);
		}
		if (layerIds.pointLayerId)
		{
			self._pointLayer = new self._arcgis.GraphicsLayer({ "id": layerIds.pointLayerId });
			self._map.add(self._pointLayer);
		}
	};

	EsriTool.prototype.create = function(geometryType)
	{
		var self = this;
		if (self._viewModal.gridMapPopup)
		{
			self._viewModal.disableMouseEvent();
		}
		self.sketchTool.create(geometryType, self.createCallback.bind(self), self);
		self.startPreview(geometryType);
	};

	EsriTool.prototype.select = function(geometryType)
	{
		var self = this;
		var layers = [];
		[self._pointLayer, self._polylineLayer, self._polygonLayer]
			.forEach(function(layer)
			{
				if (layer)
				{
					layers.push(layer);
				}
			});
		self.sketchTool.select(geometryType, layers, function(graphics)
		{
			self.selectCallback(graphics, geometryType);
		});
	};

	EsriTool.prototype.selectCallback = function(graphics, geometryType)
	{
		var self = this, selectIds = [];
		if (TF.key.ctrlKey && geometryType === "point")
		{
			selectIds = self.dataModel.getSelected().map(function(item)
			{
				return item.id
			});
		}
		selectIds = selectIds.concat(graphics.map(function(graphic)
		{
			return graphic.attributes.id || graphic.attributes.dataModel.id;
		}));
		self.selectionChange.notify(selectIds);

		if (TF.key.ctrlKey && geometryType === "point")
		{
			self.select("point");
		} else
		{
			self._viewModal.setMode("", "Normal");
		}

	};

	EsriTool.prototype.addRegion = function(geometryType, id)
	{
		var self = this;
		if (self._viewModal.gridMapPopup)
		{
			self._viewModal.disableMouseEvent();
		}
		return new Promise(function(resolve, reject)
		{
			var graphic = self._findGraphicInLayerById(self._polygonLayer, id);
			self._oldBoundaryGraphic = graphic;
			self._oldBoundarySymbol = graphic.symbol.clone();
			graphic.symbol = self.symbol.editPolygonSymbol();
			self.sketchTool.addRegion(geometryType, function(grap)
			{
				self.addRegionCallback(grap);
				resolve();
			}, self);
		});
	}

	EsriTool.prototype.removeRegion = function(geometryType, id)
	{
		var self = this;
		if (self._viewModal.gridMapPopup)
		{
			self._viewModal.disableMouseEvent();
		}
		return new Promise(function(resolve, reject)
		{
			var graphic = self._findGraphicInLayerById(self._polygonLayer, id);
			self._oldBoundaryGraphic = graphic;
			self._oldBoundarySymbol = graphic.symbol.clone();
			graphic.symbol = self.symbol.editPolygonSymbol();
			self.sketchTool.removeRegion(geometryType, function(graph)
			{
				self.removeRegionCallback(graph);
				resolve();
			}, self);
		});
	}

	EsriTool.prototype.redrawRegion = function(geometryType, id)
	{
		var self = this;
		if (self._viewModal.gridMapPopup)
		{
			self._viewModal.disableMouseEvent();
		}
		return new Promise(function(resolve, reject)
		{
			var graphic = self._findGraphicInLayerById(self._polygonLayer, id);
			self._oldBoundaryGraphic = graphic;
			self._oldBoundarySymbol = graphic.symbol.clone();
			graphic.symbol = self.symbol.editPolygonSymbol();
			self.sketchTool.redrawRegion(geometryType, function(graph)
			{
				self.redrawRegionCallback(graph);
				resolve();
			}, self);
		});
	}

	EsriTool.prototype.redrawByWalkout = function(boundary)
	{
		var self = this;
		var tripStop = this.dataModel.getTripStopByStopId(boundary.TripStopId);
		var graphic = self._findGraphicInLayerById(self._polygonLayer, boundary.id);
		self._oldBoundarySymbol = graphic.symbol.clone();
		graphic.symbol = self.symbol.editPolygonSymbol();
		self._oldBoundaryGraphic = graphic;
		return tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.WalkoutStopBoundaryModalViewModel(tripStop, this.viewModel))
			.then(function(g)
			{
				self._tempWalkoutRedrawLayer.removeAll();
				if (self._oldBoundaryGraphic)
				{
					self._oldBoundaryGraphic.symbol = self._oldBoundarySymbol;
				}
				if (g)
				{
					var centroid = self._findGraphicInLayerById(self._pointLayer, graphic.attributes.dataModel.TripStopId);
					graphic.geometry = g.geometry;
					graphic.geometry = self.removeOverlapBoundary(graphic, centroid).geometry;
					graphic.symbol = self._oldBoundarySymbol;
					self.updateDataModel([graphic]);
				}
			});
	};

	EsriTool.prototype.reshape = function(id)
	{
		var self = this;
		return new Promise(function(resolve, reject)
		{
			self.changeRevertModeToUpdate();
			var graphic = self._findGraphicInLayerById(self._polygonLayer, id);
			self._oldBoundaryGraphic = graphic.clone();
			self._oldBoundarySymbol = graphic.symbol.clone();
			self.sketchTool.reshape(graphic, { moveDuplicateNode: self.getMoveDuplicateNode.bind(self) }, function(graph)
			{
				self.reshapeCallback(graph);
				resolve();
			});
		});
	};

	EsriTool.prototype.getMoveDuplicateNode = function()
	{
		return this._moveDuplicateNode;
	}

	EsriTool.prototype.changeRevertModeToUpdate = function()
	{
		if (this._viewModal.revertMode)
		{
			this._viewModal.revertMode = "update-" + this._viewModal.revertMode.split("-")[1];
		}
	};

	EsriTool.prototype.reshapePolyline = function(id)
	{
		var self = this;
		var graphic = self._findGraphicInLayerById(self._polylineLayer, id);
		self._oldBoundaryGraphic = graphic.clone();
		self._oldBoundarySymbol = graphic.symbol.clone();
		self.sketchTool.reshape(graphic, { moveDuplicateNode: self.getMoveDuplicateNode.bind(self) }, self.reshapeCallback.bind(self));
	}

	EsriTool.prototype.transform = function(id)
	{
		var self = this;
		return new Promise(function(resolve, reject)
		{
			var graphic = self._findGraphicInLayerById(self._polygonLayer, id);
			self._oldBoundaryGraphic = graphic.clone();
			self._oldBoundarySymbol = graphic.symbol.clone();
			graphic.editSymbol = self.symbol.editPolygonSymbol();
			self.sketchTool.transform(graphic, { moveDuplicateNode: self.getMoveDuplicateNode.bind(self) }, function(grap)
			{
				self.transformCallback(grap);
				resolve();
			});
		});
	}

	EsriTool.prototype.getHeartBoundaryId = function()
	{
		return null;
	}

	EsriTool.prototype.movePoint = function(id)
	{
		var self = this;
		return new Promise(function(resolve, reject)
		{
			var graphic = self._findGraphicInLayerById(self._pointLayer, id);
			// change symbol to updating
			if (self.getSymbol)
			{
				graphic.symbol = self.getSymbol(graphic, "edit");
			}
			var boundaryId = self.getHeartBoundaryId(graphic);
			if (boundaryId)
			{
				var boundaryGraphic = self._findGraphicInLayerById(self._polygonLayer, boundaryId);
				self._oldBoundaryGraphic = boundaryGraphic;
				self._oldBoundarySymbol = boundaryGraphic.symbol.clone();
				boundaryGraphic.symbol = boundaryGraphic.geometry.type === "polygon" ? self.symbol.editPolygonSymbol() : self.symbol.editPolylineSymbol();
			}
			self._oldTripStopGraphic = graphic.clone();
			self.sketchTool.transform(graphic, { moveDuplicateNode: self.getMoveDuplicateNode.bind(self) }, function(grap)
			{
				self.movePointCallback(grap);
				resolve();
			});
		});
	};

	EsriTool.prototype.createCallback = function(graphic)
	{
		const self = this;
		if (self._viewModal.gridMapPopup)
		{
			self._viewModal.enableMouseEvent();
		}
		if (graphic.geometry.type === "point")
		{
			self.addPointToLayer(graphic);
		}
		else if (graphic.geometry.type === "polyline")
		{
			self.addPolylineToLayer(graphic);
		}
		else if (graphic.geometry.type === "polygon")
		{
			// check polygon is a valid geometry, to avoid line style polygon
			if (tf.map.ArcGIS.geometryEngine.simplify(graphic.geometry))
			{
				self.addPolygonToLayer(graphic);
			} else
			{
				self.stop();
				tf.promiseBootbox.alert("Please draw a valid polygon");
			}

		}
		self._viewModal.setMode("", "Normal");
	};

	EsriTool.prototype.getBoundaryHeartId = function()
	{
		return null;
	}

	EsriTool.prototype.endRegionCallback = function()
	{
		var self = this;
		if (self._viewModal.gridMapPopup)
		{
			self._viewModal.enableMouseEvent();
		}
		PubSub.publish("clear_ContextMenu_Operation");
		self._oldBoundaryGraphic.symbol = {
			type: self._oldBoundarySymbol.type,
			color: self._oldBoundarySymbol.color,
			style: self._oldBoundarySymbol.style,
			outline: self._oldBoundarySymbol.outline
		};
	}

	EsriTool.prototype.addRegionCallback = function(graphic)
	{
		var self = this;
		self.endRegionCallback();
		self._oldBoundaryGraphic.geometry = self._arcgis.geometryEngine.simplify(self._oldBoundaryGraphic.geometry);
		if (self._arcgis.geometryEngine.intersects(graphic.geometry, self._oldBoundaryGraphic.geometry))
		{
			self._oldBoundaryGraphic.geometry = self._arcgis.geometryEngine.union(graphic.geometry, self._oldBoundaryGraphic.geometry);
			var heartId = self.getBoundaryHeartId(self._oldBoundaryGraphic);
			let centroid;
			if (self._pointLayer && heartId)
			{
				centroid = self._findGraphicInLayerById(self._pointLayer, heartId);
			}
			self._oldBoundaryGraphic.geometry = self.removeOverlapBoundary(self._oldBoundaryGraphic, centroid).geometry;
			if (centroid)
			{
				self._oldBoundaryGraphic.geometry = self._cutResultHandler(self._oldBoundaryGraphic.geometry, centroid.geometry);
			}
			self.updateDataModel([self._oldBoundaryGraphic]);
		}
	};

	EsriTool.prototype.removeRegionCallback = function(graphic)
	{
		var self = this, centroid;
		self.endRegionCallback();
		var heartId = self.getBoundaryHeartId(self._oldBoundaryGraphic);
		if (self._pointLayer && heartId)
		{
			centroid = self._findGraphicInLayerById(self._pointLayer, heartId);
			if (self._arcgis.geometryEngine.intersects(centroid.geometry, graphic.geometry))
			{
				return self.removeRegionDialog();
			}
		}
		if (self._arcgis.geometryEngine.intersects(graphic.geometry, self._oldBoundaryGraphic.geometry))
		{
			self._oldBoundaryGraphic.geometry = self._arcgis.geometryEngine.difference(self._oldBoundaryGraphic.geometry, graphic.geometry);
			self._oldBoundaryGraphic.geometry = self.removeOverlapBoundary(self._oldBoundaryGraphic, centroid).geometry;
			if (centroid)
			{
				self._oldBoundaryGraphic.geometry = self._cutResultHandler(self._oldBoundaryGraphic.geometry, centroid.geometry);
			}
			self.updateDataModel([self._oldBoundaryGraphic]);
		}
		return undefined;
	};

	EsriTool.prototype.redrawRegionCallback = function(graphic)
	{
		var self = this;
		self.endRegionCallback();
		var heartId = self.getBoundaryHeartId(self._oldBoundaryGraphic);
		let centroid;
		if (self._pointLayer && heartId)
		{
			centroid = self._findGraphicInLayerById(self._pointLayer, heartId);
			if (!self._arcgis.geometryEngine.intersects(centroid.geometry, graphic.geometry))
			{
				return self.redrawRegionDialog();
			}
		}
		self._oldBoundaryGraphic.geometry = graphic.geometry;
		self._oldBoundaryGraphic.geometry = self.removeOverlapBoundary(self._oldBoundaryGraphic, centroid).geometry;
		if (centroid)
		{
			self._oldBoundaryGraphic.geometry = self._cutResultHandler(self._oldBoundaryGraphic.geometry, centroid.geometry);
		}
		self.updateDataModel([self._oldBoundaryGraphic]);
		return undefined;
	}

	EsriTool.prototype.reshapeCallback = function(graphics)
	{
		var self = this;
		self.transformCallback(graphics);
	}

	EsriTool.prototype.transformCallback = function(graphics)
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
			if (self.transofrmSingleGraphic(graphic))
			{
				needToRevert = true;
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

	EsriTool.prototype.transofrmSingleGraphic = function(graphic)
	{
		const self = this;
		let needToRevert = false;
		if (self._pointLayer)
		{
			var heartId = self.getBoundaryHeartId(graphic);
			const centroid = self._findGraphicInLayerById(self._pointLayer, heartId);
			if (!self._arcgis.geometryEngine.intersects(graphic.geometry, centroid.geometry))
			{
				var nearestPoint = self._arcgis.geometryEngine.nearestCoordinate(graphic.geometry, centroid.geometry).coordinate;
				var parcelWithFinger = self._createFinger(nearestPoint, centroid.geometry, graphic);
				graphic.geometry = parcelWithFinger;
			}
			if (centroid)
			{
				graphic.geometry = self._cutResultHandler(graphic.geometry, centroid.geometry);
			}
		}
		if (!self._allowOverlap)
		{
			if (!self.overlapCheck(centroid || graphic))
			{
				needToRevert = true;
			}
			else
			{
				graphic.geometry = self.removeOverlapBoundary(graphic, centroid).geometry;
			}
		}
		return needToRevert;
	}


	function setStreetName(grap)
	{
		var promise;
		if (grap.attributes.junctionStreets)
		{
			promise = Promise.resolve(self.stopTool.getStreetAddressByJunctionStreets(grap.attributes.junctionStreets));
		} else
		{
			promise = self.stopTool.reverseGeocodeStop(grap.geometry).then(function(result)
			{
				if (result)
				{
					return result ? result : "Unnamed";
				}
				return undefined;
			});
		}

		return promise.then(function(name)
		{
			if (name)
			{
				grap.attributes.dataModel.Street = name;
			}
		});
	}

	function revertToOrigin()
	{
		graphic.geometry = self._oldTripStopGraphic.geometry;
		self.updateDataModel([graphic]);
	}

	EsriTool.prototype.polygonMoveCallback = function(graphic)
	{
		const self = this;
		var parcel = self._findGraphicInLayerById(self._polygonLayer, boundaryId);
		parcel.symbol = self._oldBoundarySymbol;

		if (self.removeOverlapCheck(graphic))
		{
			setStreetName(graphic).then(() =>
			{
				if (!self._arcgis.geometryEngine.intersects(parcel.geometry, graphic.geometry))
				{
					var nearestPointGeometry = self._arcgis.geometryEngine.nearestCoordinate(parcel.geometry, graphic.geometry).coordinate;
					var parcelWithFinger = self._createFinger(nearestPointGeometry, graphic.geometry, parcel);
					parcel.geometry = parcelWithFinger;
				}
				graphic.attributes.dataModel.City = TF.RoutingMap.GeocodeHelper.getCityName(graphic.attributes.dataModel.geometry);
				self.updateDataModel([graphic]);
			});
		}
		else
		{
			self.overlapDialogTransform().then(function()
			{
				revertToOrigin();
			});
		}
	}

	EsriTool.prototype.movePointCallback = function(graphics)
	{
		var self = this;
		if (!graphics)
		{
			self._oldBoundaryGraphic.symbol = self._oldBoundarySymbol;
			return;
		}
		var graphic = graphics[0];
		var stopSnappedPromise = self.forceStopToJunction(graphic);
		stopSnappedPromise.then(function()
		{
			// change symbol to not updating
			if (self.getSymbol)
			{
				graphic.symbol = self.getSymbol(graphic);
			}
			var boundaryId = self.getHeartBoundaryId(graphic);

			if (self._polygonLayer && boundaryId)
			{
				self.polygonMoveCallback(graphic);
			}
			else
			{
				self.updateDataModel([graphic]);
			}
		});
	};

	EsriTool.prototype.getSnappedTripStop = function(tripStop)
	{
		var self = this;
		return self.viewModel._viewModal.getSnappingPoint(tripStop.geometry).then(function(point)
		{
			if (point)
			{
				tripStop.geometry = point;
				return self.viewModel._viewModal.getJunctionStreetOnPoint(point).then(function(junctionStreets)
				{
					tripStop.attributes.junctionStreets = junctionStreets ? junctionStreets : [];
					tripStop.geometry = point;
					return Promise.resolve(tripStop);
				});
			} else
			{
				return self.forceStopToJunction(tripStop);
			}
		});

	};

	EsriTool.prototype.forceStopToJunctionResolveStop = function(nearbyJunction, tripStop)
	{
		const self = this;
		if (nearbyJunction && nearbyJunction.point)
		{
			if (result && result.distance <= self.snapOffsetDistance)
			{
				if (!tripStop.attributes)
				{
					tripStop.attributes = {};
				}
				tripStop.attributes.junctionStreets = nearbyJunction.streets;
				tripStop.geometry = nearbyJunction.point;
				return Promise.resolve(tripStop);
			}
			var polyline = new tf.map.ArcGIS.Polyline({
				paths: [[tripStop.geometry.x, tripStop.geometry.y], [nearbyJunction.point.x, nearbyJunction.point.y]],
				spatialReference: { wkid: 102100 }
			});
			if (tf.map.ArcGIS.geometryEngine.geodesicLength(polyline, "meters") <= self.snapInsetDistance)
			{
				if (!tripStop.attributes)
				{
					tripStop.attributes = {};
				}
				tripStop.attributes.junctionStreets = nearbyJunction.streets;
				tripStop.geometry = nearbyJunction.point;
				return Promise.resolve(tripStop);
			}
		}
		return Promise.resolve(tripStop);
	}
	//snap point to junction if within 5 meter to street and 5 meters to junction
	EsriTool.prototype.forceStopToJunction = function(tripStop)
	{
		var self = this;
		if (!self.stopTool)
		{
			return Promise.resolve(tripStop);
		}
		return self.stopTool.findClosestLocationOnStreet({ geometry: tripStop.geometry }).then(function(result)
		{
			var promise = self.viewModel._viewModal.getNearestJunctionPointInBuffer(tripStop.geometry, self.pointToJunctionDistance);
			return promise.then(function(nearbyJunction)
			{
				return self.forceStopToJunctionResolveStop(nearbyJunction, tripStop);
			});
		});
	};

	EsriTool.prototype._createFinger = function(point1, point2, parcel)
	{
		var self = this,
			line = new this._arcgis.Polyline({ spatialReference: self._map.mapView.spatialReference, paths: [[[point1.x, point1.y], [point2.x, point2.y]]] }),
			distance = self.convertPxToDistance(5),
			buffer = self._arcgis.geometryEngine.buffer(line, distance, "meters");

		return self._arcgis.geometryEngine.union([self._arcgis.geometryEngine.simplify(buffer), self._arcgis.geometryEngine.simplify(parcel.geometry)]);

	};

	EsriTool.prototype.convertPxToDistance = function(distance)
	{
		return TF.Helper.MapHelper.convertPxToDistance(this._map, this._arcgis, distance)
	};

	EsriTool.prototype.removeOverlapBoundary = function(graphic, centroid)
	{
		var self = this;
		if (self._allowOverlap)
		{
			return graphic;
		}

		var intersectGeometry = self._intersectWithCurrentPolygons(graphic);
		if (intersectGeometry)
		{
			if (!centroid)
			{
				centroid = self._newTripStopGraphic;
			}
			var cutResult = self._arcgis.geometryEngine.difference(graphic.geometry, intersectGeometry);
			if (centroid)
			{
				cutResult = self._cutResultHandler(cutResult, centroid.geometry);
			}
			graphic.geometry = cutResult;
		}
		return graphic;
	};

	EsriTool.prototype.seperatePolygon = function(geometry)
	{
		var self = this, resultPolygons = [];
		var rings = geometry.rings;
		var resultRings = self._findOutterRing(rings);
		for (var i = 0; i < resultRings.length; i++)
		{
			var polygon = new self._arcgis.Polygon(self._map.mapView.spatialReference);
			polygon.addRing(resultRings[i]);
			for (var j = 0; j < rings.length; j++)
			{
				var polygonJ = new self._arcgis.Polygon(self._map.mapView.spatialReference);
				polygonJ.addRing(rings[j]);
				if (self._arcgis.geometryEngine.contains(polygon, polygonJ) && !self._arcgis.geometryEngine.contains(polygonJ, polygon))
				{
					polygon.addRing(rings[j]);
				}
			}

			resultPolygons.push(self._arcgis.geometryEngine.simplify(polygon));
		}
		return self._combineTouchedPolygons(resultPolygons);
	};

	EsriTool.prototype.removeOverlapBoundaries = function(stops)
	{
		var self = this;
		var _resolve = null;
		var _reject = null;
		var promise = new Promise(function(resolve, reject)
		{
			_resolve = resolve;
			_reject = reject;
		});

		var currentStops = [], nonOverlapedStops = [];
		self.dataModel.trips.forEach(function(trip)
		{
			currentStops = currentStops.concat(trip.TripStops);
		});

		stops.forEach(function(stop)
		{
			stop.address = stop.Street;
			if (stop.boundary.BdyType === 0 || !self._isContainedByCurrentPolygons(stop))
			{
				nonOverlapedStops.push(stop);
			}
		});
		if (nonOverlapedStops.length === 0)
		{
			return _resolve(tf.promiseBootbox.alert(
				`Remove Overlapping Boundaries is set true! Since ${stops.length === 1 ? "stop is" : "stops are"} falling in current stop boundaries, no stops will be created`, "Warning"));
		}
		else if (nonOverlapedStops.length < stops.length)
		{
			tf.loadingIndicator.tryHide();
			tf.promiseBootbox.alert(
				`Remove Overlapping Boundaries is set as true! Some ${stops.length - nonOverlapedStops.length === 1 ? "stop is" : "stops are"} falling in current stop boundaries`, "Warning")
				.then(function()
				{
					tf.loadingIndicator.show();
					self.stopTool.removeOverlapBoundariesByThiessen(nonOverlapedStops, currentStops).then(function(_stops)
					{
						return _resolve(_stops);
					})
				})
		}
		else if (nonOverlapedStops.length === stops.length)
		{
			self.stopTool.removeOverlapBoundariesByThiessen(stops, currentStops).then(function(_stops)
			{
				return _resolve(_stops);
			})
		}
		return promise;
	}

	EsriTool.prototype.removeOverlapCheck = function(graphic)
	{
		var self = this;
		var isIntersect = self._intersectWithCurrentPolygons(graphic);
		if (self._allowOverlap || (!self._allowOverlap && !isIntersect))
		{
			return true;
		}

		return false;
	}

	EsriTool.prototype.overlapCheck = function(graphic)
	{
		var self = this;
		var isIntersect
		if (graphic.geometry.type === "point")
		{
			isIntersect = self._intersectWithCurrentPolygons(graphic);
		}
		else
		{
			isIntersect = self._isContainedByCurrentPolygons(graphic);
		}
		if (self._allowOverlap || (!self._allowOverlap && !isIntersect))
		{
			return true;
		}
		if (isIntersect)
		{
			self.overlapDialogTransform();
		}
		return false;
	};

	EsriTool.prototype.intersectGeometry = function(g, graphic)
	{
		const self = this;
		let intersectGeometry = null;
		if (g.attributes && g.attributes.dataModel)
		{
			if (g.geometry.type === "polygon")
			{
				if (graphic.attributes.dataModel.id !== g.attributes.dataModel.id && self._isIntersect(graphic, g))
				{
					intersectGeometry = self._arcgis.geometryEngine.simplify(graphic.geometry);
				}
			}
			else if (g.geometry.type === "point")
			{
				if (graphic.attributes.dataModel.id !== g.attributes.dataModel.boundary.id && self._isIntersect(graphic, g))
				{
					intersectGeometry = self._arcgis.geometryEngine.simplify(graphic.geometry);
				}
			}
		}
		elseif(self._isIntersect(graphic, g))
		{
			intersectGeometry = self._arcgis.geometryEngine.simplify(graphic.geometry)
		}
		return intersectGeometry;
	}

	EsriTool.prototype._intersectWithCurrentPolygons = function(g)
	{
		var self = this,
			intersectGeometries = [];
		var graphics = self._polygonLayer.graphics.items;

		graphics.map(function(graphic)
		{
			const intersestGeometry = self.intersectGeometry(g, graphic);
			if (intersestGeometry)
			{
				intersectGeometries.push(intersestGeometry);
			}
		});
		if (intersectGeometries.length > 0)
		{
			return self._arcgis.geometryEngine.union(intersectGeometries);
		}
		return false;
	};

	EsriTool.prototype._isContained = function(graphic1, graphic2)
	{
		if (this._arcgis.geometryEngine.contains(graphic1.geometry, graphic2.geometry) && graphic1.geometry !== graphic2.geometry)
		{
			return true;
		}
		return false;
	};

	EsriTool.prototype._combineTouchedPolygons = function(polygons)
	{
		var self = this, resultPolygons = [polygons[0]], rings = [];
		polygons.map(function(p)
		{
			p.rings.map(function(r)
			{
				rings.push(r);
			});

		})
		polygons.shift();
		polygons.map(function(p, index)
		{
			var istouch = false;
			resultPolygons.map(function(pr)
			{
				if (self._arcgis.geometryEngine.contains(pr, p) && self._arcgis.geometryEngine.contains(p, pr))
				{
					//empty
				}
				else if (self._isTouches(pr, p, rings))
				{
					p.rings.map(function(r)
					{
						pr.addRing(r);
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

	EsriTool.prototype._isTouches = function(pc, p, rings)
	{
		var self = this;
		if (self._arcgis.geometryEngine.touches(pc, p))
		{
			return true;
		}
		else
		{
			for (var i = 0; i < rings.length; i++)
			{
				var polygon = new self._arcgis.Polygon({
					rings: rings[i],
					spatialReference: self._map.mapView.spatialReference
				});
				if (self._arcgis.geometryEngine.touches(polygon, p) && self._isTouches(pc, polygon, rings.filter(function(r)
				{
					return r !== rings[i]
				})))
				{
					return true;
				}
			}
			return false;
		}
	};

	EsriTool.prototype._isRingsIntersect = function(rings)
	{
		var self = this;
		var outRings = self._findOutterRing(rings);
		var outPolygons = outRings.map(function(r)
		{
			return new self._arcgis.Polygon({
				rings: r,
				spatialReference: self._map.mapView.spatialReference
			});
		});
		return self._combineTouchedPolygons(outPolygons).length > 1;
	};

	EsriTool.prototype._findOutterRing = function(rings)
	{
		var self = this, geometries = [];
		for (var i = 0; i < rings.length; i++)
		{
			var polygon = new this._arcgis.Polygon({
				rings: rings[i],
				spatialReference: self._map.mapView.spatialReference
			});
			geometries.push(polygon);
		}
		var resultGeometry = self._arcgis.geometryEngine.union(geometries);
		return resultGeometry.rings.filter(function(ring)
		{
			return resultGeometry.isClockwise(ring);
		});

	}


	EsriTool.prototype._isContainedByCurrentPolygons = function(newParcel, currentPolygons)
	{
		var self = this, isContained = false;
		var graphics = currentPolygons || self._polygonLayer.graphics.items;
		graphics.map(function(graphic)
		{
			if (newParcel.attributes && newParcel.attributes.dataModel)
			{
				if (graphic.attributes.dataModel.id !== newParcel.attributes.dataModel.id && self._isContained(graphic, newParcel))
				{
					isContained = true;
				}
			}
			else
			{
				if (self._isContained(graphic, newParcel))
				{
					isContained = true;
				}
			}

		}.bind(self));
		return isContained;
	};

	EsriTool.prototype.updateDataModel = function(graphics)
	{
		var self = this, dataModels = [];
		graphics.forEach(function(graphic)
		{
			var dataModel = self.createCopyDataModel(graphic);
			dataModel.geometry = graphic.geometry;
			dataModels.push(dataModel);
		});
		self.dataModel.update(dataModels);
	};

	EsriTool.prototype._isOverlapWithCurrentPolygons = function(newParcel)
	{
		var self = this, isOverlap = false;
		self._polygonLayer.graphics.map(function(graphic)
		{
			if (newParcel.attributes.dataModel)
			{
				if (graphic.attributes.dataModel.id !== newParcel.attributes.dataModel.id && self._isOverlap(graphic, newParcel))
				{
					isOverlap = true;
				}
			}
			else
			{
				if (self._isOverlap(graphic, newParcel))
				{
					isOverlap = true;
				}
			}

		}.bind(self));
		return isOverlap;
	};
	EsriTool.prototype._isOverlap = function(graphic1, graphic2)
	{
		if (this._arcgis.geometryEngine.overlaps(graphic1.geometry, graphic2.geometry) ||
			this._arcgis.geometryEngine.contains(graphic1.geometry, graphic2.geometry) ||
			this._arcgis.geometryEngine.contains(graphic2.geometry, graphic1.geometry))
		{
			return true;
		}
		return false;
	};
	EsriTool.prototype._warningDialogBox = function(message)
	{
		return tf.promiseBootbox.dialog({
			message: message,
			title: "Warning",
			closeButton: true,
			buttons: {
				yes: {
					label: "OK",
					className: "btn-primary btn-sm btn-primary-black"
				}
			}
		});
	};

	EsriTool.prototype._computeSymbol = function(color, fill, isHighlighted)
	{
		var self = this;
		if (isHighlighted)
		{
			var highlightPolygonSymbol = self._highlightPolygonSymbol.clone();
			highlightPolygonSymbol.color = self._computeColor(color, fill);
			return highlightPolygonSymbol;
		}
		var outlineSymbol = new self._arcgis.SimpleLineSymbol();
		outlineSymbol.width = 2;
		var fillSymbol = new self._arcgis.SimpleFillSymbol();
		fillSymbol.color = self._computeColor(color, fill);
		outlineSymbol.color = self._computeColor(color, 1);
		fillSymbol.outline = outlineSymbol;
		return fillSymbol;
	}

	EsriTool.prototype._computeColor = function(hexvalue, alpha)
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

	EsriTool.prototype._createLineSymbol = function(color, outlineStyle)
	{
		var self = this;
		return new self._arcgis.SimpleLineSymbol({
			style: outlineStyle || "solid",
			color: color,//self._setOpacity(color, 179),
			width: 2
		});
	}

	EsriTool.prototype._setOpacity = function(color, opacity)
	{
		return color.concat([opacity / 255]);
	};

	EsriTool.prototype._isIntersect = function(graphic1, graphic2)
	{
		if (this._arcgis.geometryEngine.intersects(graphic1.geometry, graphic2.geometry) && graphic1.geometry !== graphic2.geometry)
		{
			return true;
		}
		return false;
	};

	EsriTool.prototype.findPolygonById = function(id)
	{
		var self = this
		return self._findGraphicInLayerById(self._polygonLayer, id);
	};

	EsriTool.prototype.onHighlightedChangeEventBase = function(layers)
	{
		var self = this;
		layers.forEach(function(layer)
		{
			layer.graphics.forEach(function(graphic, index)
			{
				self.changeSymbolMeetStatus(graphic.attributes.dataModel.id, graphic);
			});
		})
	}

	EsriTool.prototype._findGraphicInLayerById = function(layer, id)
	{
		var graphics = layer.graphics.items;
		for (var i = 0; i < graphics.length; i++)
		{
			if (graphics[i].attributes && graphics[i].attributes.dataModel && graphics[i].attributes.dataModel.id === id)
			{
				return graphics[i];
			}
		}
		return null;
	};

	EsriTool.prototype._cutResultHandler = function(cutResult, centroid)
	{
		var self = this;
		cutResult = tf.map.ArcGIS.geometryEngine.simplify(cutResult);
		if (cutResult.rings.length > 1 && centroid)
		{

			self._cutResult(cutResult, centroid);
		}
		return cutResult;
	};

	EsriTool.prototype._cutResult = function(cutResult, centroid)
	{
		const self = this;
		var polygonWithCentroid = self._findRingwithPoint(cutResult.rings, centroid);
		var removedids = [], remove = [], keep = [];
		cutResult.rings.map(function(ring, index)
		{
			var polygon = new self._arcgis.Polygon({
				type: "polygon",
				rings: [ring],
				spatialReference: self._map.mapView.spatialReference
			});
			if (!self._arcgis.geometryEngine.contains(polygonWithCentroid, polygon))
			{
				removedids.push(index);
				remove.push(polygon);
			}
			else
			{
				keep.push(polygon);
			}
		});
		for (var i = removedids.length - 1; i >= 0; i--)
		{
			var isremove = true;
			for (var j = 0; j < keep.length; j++)
			{
				if (self._arcgis.geometryEngine.contains(keep[j], remove[i]))
				{
					isremove = false;
					break;
				}
			}
			if (isremove)
			{
				cutResult.removeRing(removedids[i]);
			}
		}
	}

	EsriTool.prototype._findRingwithPoint = function(rings, centroid)
	{
		var self = this,
			polygon, minimalRegoin, result = [];
		rings.map(function(ring)
		{
			polygon = new self._arcgis.Polygon({
				type: "polygon",
				rings: [ring],
				spatialReference: self._map.mapView.spatialReference
			});
			if (self._arcgis.geometryEngine.intersects(polygon, centroid))
			{
				result.push(polygon);
			}
		});
		if (result.length > 1)
		{
			for (var i = 0; i < result.length - 1; i++)
			{
				if (self._arcgis.geometryEngine.intersects(result[i], result[i + 1]))
				{
					minimalRegoin = result[i + 1];
				} else
				{
					minimalRegoin = result[i];
				}
			}
		} else if (result.length === 1)
		{
			minimalRegoin = result[0];
		}
		return minimalRegoin;
	};

	EsriTool.prototype.createCopyDataModel = function(graphic)
	{
		var dataModel = $.extend(true, {}, graphic.attributes.dataModel);
		dataModel.geometry = graphic.clone().geometry;
		return dataModel;
	};

	EsriTool.prototype.highlightChangedEvent = function()
	{
		var self = this;
		this.sketchTool.stop();
		var highlightedItems = {};
		this.dataModel.highlighted.forEach(function(item)
		{
			highlightedItems[item.id] = true;
		});
		var layer = self._pointLayer || self._polygonLayer || self._polylineLayer;
		layer.graphics.forEach(function(graphic)
		{
			if (graphic.attributes.dataModel && graphic.attributes.dataModel.id)
			{
				var isHighlighted = highlightedItems[graphic.attributes.dataModel.id] === true;
				graphic.symbol = self.getSymbol(graphic, isHighlighted ? self.StatusType.highlight : "");
			}
		});
	};

	EsriTool.prototype.glowAndVisibleGeometries = function(geometries)
	{
		var self = this;
		if (geometries.length === 1 && !geometries[0].extent && !self._map.mapView.extent.contains(geometries[0]))
		{
			self._map.mapView.goTo(geometries[0]);
			return;
		}
		var extent = self.getMaxExtent(geometries);
		var xmin = extent.xmin, ymin = extent.ymin, xmax = extent.xmax, ymax = extent.ymax;
		var mapExtent = self._map.mapView.extent;
		var contain = mapExtent.xmax > xmax && mapExtent.xmin < xmin && mapExtent.ymax > ymax && mapExtent.ymin < ymin;
		if (!contain)
		{
			self._map.mapView.goTo(extent);
		}
	};

	EsriTool.prototype.stop = function()
	{
		return this.sketchTool.stopAndClear();
	};

	EsriTool.prototype.StatusType = {
		highlight: "highlight",
		edit: "edit"
	};

	EsriTool.prototype.getMaxExtent = function(geometries)
	{
		return EsriTool.getMaxExtent(geometries, this._map);
	};

	EsriTool.getMaxExtent = function(geometries, map, buffer)
	{
		var xmax, xmin, ymax, ymin;
		if (geometries && geometries.length > 0)
		{
			// geographic units (wkid: 4326)
			if (geometries[0].spatialReference.wkid === 4326)
			{
				buffer = buffer || (200 / 111000);
			}
			else
			{
				buffer = buffer || 200;
			}
		}

		geometries.forEach(function(item)
		{
			if (item && item.type)
			{
				const bufferRegion = self._calculateExtendBufferInTurn(item, buffer);
				if (bufferRegion)
				{
					xmin = bufferRegion.xmin;
					ymin = bufferRegion.ymin;
					xmax = bufferRegion.xmax;
					ymax = bufferRegion.ymax;
				}
			}
		});
		return new tf.map.ArcGIS.Extent({
			xmin: xmin,
			ymin: ymin,
			xmax: xmax,
			ymax: ymax,
			spatialReference: map.mapView.spatialReference
		});
	};

	EsriTool._calculateExtendBufferInTurn = function(item, buffer)
	{
		var xmax, xmin, ymax, ymin;
		var geometryExtent = item.extent;
		if (!geometryExtent)
		{
			if (!item.x || !item.y)
			{
				return null;
			}
			geometryExtent = new tf.map.ArcGIS.Extent({
				xmin: item.x - buffer,
				ymin: item.y - buffer,
				xmax: item.x + buffer,
				ymax: item.y + buffer,
				spatialReference: map.mapView.spatialReference
			});
		}
		if (!xmax)
		{
			xmax = geometryExtent.xmax;
			xmin = geometryExtent.xmin;
			ymax = geometryExtent.ymax;
			ymin = geometryExtent.ymin;
		}
		else
		{
			if (geometryExtent.xmax > xmax)
			{
				xmax = geometryExtent.xmax;
			}
			if (geometryExtent.ymax > ymax)
			{
				ymax = geometryExtent.ymax;
			}
			if (geometryExtent.xmin < xmin)
			{
				xmin = geometryExtent.xmin;
			}
			if (geometryExtent.ymin < ymin)
			{
				ymin = geometryExtent.ymin;
			}
		}

		return { xmax, xmin, ymax, ymin }
	}

	EsriTool.centerSingleItem = function(map, item)
	{
		if (item.geometry.type === "point")
		{
			TF.Helper.MapHelper.centerAndZoom(map, item.geometry, 17);
		} else if (item.geometry.extent)
		{
			map.mapView.goTo(item.geometry.extent);
		}
	};

	EsriTool.getCenterExtentMultipleItem = function(map, items)
	{
		if (items.length > 0)
		{
			var geometries = items.map(function(item)
			{
				return item.geometry || item;
			});
			return EsriTool.getMaxExtent(geometries, map);
		}
		return undefined;
	};

	EsriTool.centerMultipleItem = function(map, items)
	{
		if (items.length > 0)
		{
			var extent = EsriTool.getCenterExtentMultipleItem(map, items);
			return map.mapView.goTo(extent);
		}
		return Promise.resolve();
	};

	EsriTool.centerLayer = function(map, layer)
	{
		var graphics = layer.graphics;
		if (graphics.length === 0)
		{
			return;
		}
		EsriTool.centerMultipleItem(map, graphics);
	};

	EsriTool.prototype.overlapDialog = function()
	{
		return this._warningDialogBox("This remove overlapping boundaries setting is turned on.");
	};

	EsriTool.prototype.redrawRegionDialog = function()
	{
		return this._warningDialogBox("Region needs to contain the center point!");
	};

	EsriTool.prototype.removeRegionDialog = function()
	{
		return this._warningDialogBox("Region to be removed contains the center point!");
	};

	EsriTool.prototype.overlapDialogTransform = function()
	{
		return this._warningDialogBox("Remove Overlapping Boundaries is set as true,stop cannot be moved here!");
	};

	EsriTool.prototype.prepareUpdatePolygonData = function(data)
	{
		const self = this;
		return data.forEach(function(d)
		{
			if (self._polygonLayer)
			{
				var polygonGraphic = self._findGraphicInLayerById(self._polygonLayer, d.id);
				if (polygonGraphic)
				{
					polygonGraphic.geometry = TF.cloneGeometry(d.geometry);
				}
			}
			if (self._pointLayer)
			{
				var pointGraphic = self._findGraphicInLayerById(self._pointLayer, d.id);
				if (pointGraphic)
				{
					pointGraphic.geometry = TF.cloneGeometry(d.geometry);
				}
			}
		});
	}
	EsriTool.prototype.revert = function(data, type)
	{
		var self = this;
		if (type === "update")
		{
			self.prepareUpdatePolygonData(data);
			self.dataModel.update(data, true);
		}
		else if (type === "create")
		{
			self.dataModel.delete(data);
		}
		else if (type === "delete")
		{
			data.forEach(function(d)
			{
				self.dataModel.create(d);
			});
		}
	};

	EsriTool.prototype._clearTempDrawing = function()
	{
		//clearTeampDrawing
	}
	EsriTool.prototype.startPreview = function()
	{
		//start preview
	}
	EsriTool.prototype.stopPreview = function()
	{
		//stop preview
	}

	EsriTool.prototype.dispose = function()
	{
		// dispose
	};
})();

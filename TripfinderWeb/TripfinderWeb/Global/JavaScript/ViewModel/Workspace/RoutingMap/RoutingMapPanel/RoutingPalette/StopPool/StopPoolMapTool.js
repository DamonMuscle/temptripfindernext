(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").StopPoolMapTool = StopPoolMapTool;

	function StopPoolMapTool(viewModel)
	{
		var self = this;
		self.viewModel = viewModel.parentViewModel;
		self.stopPoolPaletteSection = viewModel;
		self._map = viewModel.parentViewModel._viewModal._map;
		self.dataModel = viewModel.dataModel;
		self._arcgis = tf.map.ArcGIS;
		self.editModal = self.viewModel.stopPoolPaletteSection.editModal;
		self.stopTool = new TF.RoutingMap.RoutingPalette.StopTool(self);
		self.initialize();
		self.stopPreviewTool = new TF.RoutingMap.RoutingPalette.StopPreviewTool(self, self._map);
		TF.RoutingMap.EsriTool.call(self, self._map);

		self.dataModel.onAllChangeEvent.subscribe(self.onAllChangeEvent.bind(self));
		self.dataModel.highlightChangedEvent.subscribe(self.onHighlightChangedEvent.bind(self));
		self.dataModel.settingChangeEvent.subscribe(self.onSettingChangeEvent.bind(self));
		self.dataModel.selectedCategorySettingChangedEvent.subscribe(self.selectedCategorySettingChangedEvent.bind(self));
		self.dataModel.onTrialStopWalkoutPreviewChange.subscribe(self.stopPreviewTool.onTrialStopWalkoutPreviewChange.bind(self.stopPreviewTool));
	}

	StopPoolMapTool.prototype = Object.create(TF.RoutingMap.EsriTool.prototype);
	StopPoolMapTool.prototype.constructor = StopPoolMapTool;

	StopPoolMapTool.prototype.initialize = function()
	{
		var self = this;
		var layerIds = { pointLayerId: "stopPoolPointLayer", polygonLayerId: "stopPoolFeatureLayer" };
		self.initializeBase.apply(self, [layerIds]);
		self.stopPoolPaletteSection.layers.push(layerIds.pointLayerId);
		self.stopPoolPaletteSection.layers.push(layerIds.polygonLayerId);
		self.initializeOtherLayers();
		self.initializeSettings();
	}

	StopPoolMapTool.prototype.initializeOtherLayers = function()
	{
		var self = this;
		self._previewLayer = new self._arcgis.GraphicsLayer({
			"id": "stopPoolPreviewLayer"
		});
		self._map.add(self._previewLayer);
		self.stopPoolPaletteSection.layers.push(self._previewLayer.id);

		self._tempWalkoutLayer = new self._arcgis.GraphicsLayer({
			"id": "stopPoolTempWalkoutLayer"
		});
		self._map.add(self._tempWalkoutLayer);
		self.stopPoolPaletteSection.layers.push(self._tempWalkoutLayer.id);

		self._walkoutGuideLayer = new self._arcgis.GraphicsLayer({
			"id": "stopPoolWalkoutGuideLayer"
		});
		self._map.add(self._walkoutGuideLayer);
		self.stopPoolPaletteSection.layers.push(self._walkoutGuideLayer.id);
	};

	StopPoolMapTool.prototype.initializeSettings = function()
	{
		var self = this;
		self.dataModel.getSetting().then(function(settings)
		{
			self._moveDuplicateNode = settings.moveDuplicateNodes;
			self._allowOverlap = !settings.removeOverlapping;
			self._fillPattern = self.stopTool._getFillPatternValueBySetting(settings.fillPattern);
			self._boundaryThickness = settings.boundaryThickness;
		});
	}

	StopPoolMapTool.prototype.getPaletteName = function()
	{
		return "StopPool";
	};

	StopPoolMapTool.prototype.getDataModel = function()
	{
		return this.stopPoolPaletteSection.dataModel;
	};

	StopPoolMapTool.prototype.startPreview = function(geometryType)
	{
		var self = this;
		if (geometryType == "point")
		{
			self.stopPreviewTool._startWalkoutPreview(self.editModal.walkoutDistance(), self.editModal.obSelectedDistanceUnit(), self.editModal.walkoutBuffer(), self.editModal.obSelectedBufferUnit(),
				self.editModal.walkoutType());
		}
	}

	StopPoolMapTool.prototype.onAllChangeEvent = function(event, items)
	{
		var self = this;

		if (items.delete.length > 0)
		{
			items.delete.forEach(function(item)
			{
				self._deleteStopPool(item);
			});
		} else if (items.add.length > 0)
		{
			items.add.forEach(function(item)
			{
				self._addStopPool(item);
			});
		} else if (items.edit.length > 0)
		{
			items.edit.forEach(function(item)
			{
				self._updateStopPool(item);
			})
		}
	};

	StopPoolMapTool.prototype._addStopPool = function(item)
	{
		var self = this;

		if (!item.geometry)
		{
			return;
		}
		var selectColor = self.dataModel.selectedCategory().Color, stopSymbole = self.symbol.createStopPoolSymbol(selectColor), geometry = item.geometry;
		self._pointLayer.add(new this._arcgis.Graphic({
			geometry: geometry,
			symbol: stopSymbole,
			attributes: {
				"dataModel": item,
				type: "tripStop"
			}
		}));
		if (!item.boundary.geometry)
		{
			return;
		}
		var boundarySymbol = self._getTripBoundarySymbol(selectColor),
			boundaryGeometry = item.boundary.geometry;
		self._polygonLayer.add(new this._arcgis.Graphic({
			geometry: boundaryGeometry,
			symbol: boundarySymbol,
			attributes: {
				"dataModel": $.extend({}, item.boundary),
				type: "boundary"
			}
		}));
	};

	StopPoolMapTool.prototype.getHeartBoundaryId = function(pointGraphic)
	{
		return this.dataModel.getHeartBoundaryId(pointGraphic);
	}

	StopPoolMapTool.prototype._getTripBoundarySymbol = function(selectColor, outlineColor)
	{
		var self = this, color = selectColor; outlineColor = outlineColor ? outlineColor : color;
		var outlineSymbol = {
			type: "simple-line",
			style: "solid",
			color: self._computeColor(outlineColor, 1),
			width: self._boundaryThickness
		};
		if (self._boundaryThickness == 0)
		{
			outlineSymbol = {
				type: "simple-line",
				style: "none",
				color: [0, 0, 0],
				width: 1
			};
		}

		var symbol = {
			type: "simple-fill",
			style: "solid",
			outline: outlineSymbol,
			color: self._computeColor(color, self._fillPattern)
		};
		return symbol;
	}

	StopPoolMapTool.prototype.removeRegionCallback = function(graphic)
	{
		var self = this, centroid = null;
		self.endRegionCallback();
		if (self._pointLayer)
		{
			centroid = self._findGraphicInLayerById(self._pointLayer, self._oldBoundaryGraphic.attributes.dataModel.StopId);
			if (centroid && self._arcgis.geometryEngine.intersects(centroid.geometry, graphic.geometry))
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
	};

	StopPoolMapTool.prototype.transformCallback = function(graphics)
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
			if (self._pointLayer)
			{
				var centroid = self._findGraphicInLayerById(self._pointLayer, self.dataModel.findByStopId(graphic.attributes.dataModel.StopId).id);
				if (centroid && !self._arcgis.geometryEngine.intersects(graphic.geometry, centroid.geometry))
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
				} else
				{
					graphic.geometry = self.removeOverlapBoundary(graphic, centroid).geometry;
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

	StopPoolMapTool.prototype.redrawRegionCallback = function(graphic)
	{
		var self = this;
		PubSub.publish("clear_ContextMenu_Operation");
		self._oldBoundaryGraphic.symbol = self._oldBoundarySymbol;
		if (self._pointLayer)
		{
			var centroid = self._findGraphicInLayerById(self._pointLayer, self._oldBoundaryGraphic.attributes.dataModel.StopId);
			if (centroid && !self._arcgis.geometryEngine.intersects(centroid.geometry, graphic.geometry))
			{
				return self.redrawRegionDialog();
			}
		}
		self._oldBoundaryGraphic.geometry = graphic.geometry;
		self._oldBoundaryGraphic.geometry = self.removeOverlapBoundary(self._oldBoundaryGraphic, centroid).geometry;
		self.updateDataModel([self._oldBoundaryGraphic]);
	}


	StopPoolMapTool.prototype._deleteStopPool = function(item)
	{
		var self = this;
		// if (self.editTool.isEditing) { self.editTool.stop(); }
		self._pointLayer.graphics.map(function(graphic)
		{
			if (!graphic.attributes.dataModel || graphic.attributes.dataModel.id == item.id)
			{
				self._pointLayer.remove(graphic);
				return;
			}
		});
		self._polygonLayer.graphics.map(function(graphic)
		{
			if (!graphic.attributes.dataModel || graphic.attributes.dataModel.id == item.boundary.id)
			{
				self._polygonLayer.remove(graphic);
				return;
			}
		});
	};

	StopPoolMapTool.prototype._updateStopPool = function(item)
	{
		var self = this;
		var stopGraphic = self._pointLayer.graphics.items.filter(function(graphic)
		{
			return graphic.attributes && graphic.attributes.dataModel && item.id == graphic.attributes.dataModel.id;
		})[0];
		if (stopGraphic)
		{
			stopGraphic.geometry = item.geometry;
		}

		var boundaryGraphic = self._findGraphicInLayerById(self._polygonLayer, item.boundary.id);
		if (boundaryGraphic)
		{
			if (!self._arcgis.geometryEngine.intersects(item.geometry, item.boundary.geometry))
			{
				var nearestPointGeometry = self._arcgis.geometryEngine.nearestCoordinate(item.boundary.geometry, item.geometry).coordinate;
				item.boundary.geometry = self._createFinger(nearestPointGeometry, item.geometry, item.boundary);
			}
			boundaryGraphic.geometry = item.boundary.geometry;
			var selectColor = self.dataModel.selectedCategory().Color;
			var isHighlighted = this.getDataModel().isHighlighted(item.id);
			boundaryGraphic.symbol = isHighlighted ? self._getTripBoundarySymbol(selectColor, self.symbol.symbolColors.yellowForHighlight) : self._getTripBoundarySymbol(selectColor);
		}
	};

	StopPoolMapTool.prototype.onHighlightChangedEvent = function()
	{
		var self = this;

		self._pointLayer.graphics.items.forEach(function(graphic)
		{
			if (graphic.attributes.dataModel)
			{
				self.changeSymbolMeetStatus(graphic.attributes.dataModel.id, graphic);
			}
		});
		self._polygonLayer.graphics.items.forEach(function(graphic)
		{
			if (graphic.attributes.dataModel)
			{
				var stop = self.dataModel.findByStopId(graphic.attributes.dataModel.StopId);
				if (stop)
				{
					self.changeSymbolMeetStatus(stop.id, graphic);
				}
			}
		});
	};

	StopPoolMapTool.prototype.changeSymbolMeetStatus = function(id, graphic)
	{
		var self = this, color = self.dataModel.selectedCategory().Color;
		if (graphic)
		{
			self._changeGraphicSymbol(graphic, color);
		}
	};

	StopPoolMapTool.prototype.onSettingChangeEvent = function()
	{
		var self = this;
		self.dataModel.getSetting().then(function(setting)
		{
			self._moveDuplicateNode = setting.moveDuplicateNodes;
			self._allowOverlap = !setting.removeOverlapping;
			self._fillPattern = self.stopTool._getFillPatternValueBySetting(setting.fillPattern);
			self._boundaryThickness = setting.boundaryThickness;

			var selectColor = self.dataModel.selectedCategory().Color;
			self._changeSymbolColor(selectColor);
		});
	};

	StopPoolMapTool.prototype.selectedCategorySettingChangedEvent = function(e, data)
	{
		var self = this;
		if (Object.keys(data).length > 0)
		{
			self._changeSymbolColor(data.Color);
		}
	};

	StopPoolMapTool.prototype._changeSymbolColor = function(color)
	{
		var self = this;
		self._getRelateGraphics().forEach(function(graphic)
		{
			self._changeGraphicSymbol(graphic, color);
		});
	};

	StopPoolMapTool.prototype._changeGraphicSymbol = function(graphic, color)
	{
		var self = this, stop = self.dataModel.findByStopId(graphic.attributes.dataModel.StopId),
			isHighlighted = stop ? this.getDataModel().isHighlighted(stop.id) : false;

		if (graphic.attributes.type == "boundary")
		{
			if (self.sketchTool._oldTransGraphic && graphic.attributes.dataModel.id == self.sketchTool._oldTransGraphic.attributes.dataModel.id) return;
			graphic.symbol = isHighlighted ? self._getTripBoundarySymbol(color, self.symbol.symbolColors.yellowForHighlight) : self._getTripBoundarySymbol(color);
		}
		if (graphic.attributes.type == "tripStop")
		{
			graphic.symbol = isHighlighted ? self.symbol.highlightStopPoolSymbol(color) : self.symbol.createStopPoolSymbol(color)
		}
	}
	StopPoolMapTool.prototype._getRelateGraphics = function()
	{
		var self = this;

		function getGraphics(layer)
		{
			return layer.graphics.items;
		}
		return getGraphics(self._pointLayer)
			.concat(getGraphics(self._polygonLayer));
	};

	StopPoolMapTool.prototype.addPolygonToLayer = function(graphic)
	{
		var self = this;

		if (!self._stopInBoundaryCheck(self._newTripStopGraphic.geometry, graphic.geometry))
		{
			graphic = self.removeOverlapBoundary(graphic);
			graphic.geometry = self._cutResultHandler(graphic.geometry, self._newTripStopGraphic.geometry);
			self.createStopBoundaryResolve({
				geometry: graphic.geometry,
				graphic: graphic,
				BdyType: self.editModal.isDoorToDoor() ? 0 : 1
			});
		}
	}

	StopPoolMapTool.prototype.drawTempTripStopsOnMap = function(geometries)
	{
		var self = this;
		geometries.forEach(function(geometry)
		{
			var graphic = new tf.map.ArcGIS.Graphic({
				symbol: self.symbol.tripStop("0", "#FFFFFF"),
				geometry: geometry,
				attributes: { "id": TF.createId() }
			});
			self.sketchTool.drawTempPoint(graphic);
		});
	};

	StopPoolMapTool.prototype._stopInBoundaryCheck = function(stopGeom, boundaryGeom)
	{
		var self = this;
		if (!self._arcgis.geometryEngine.intersects(stopGeom, boundaryGeom))
		{
			return self._tripStopNotInBoundaryDialogBox().then(function()
			{
				self.sketchTool._drawingLayer.graphics.items.forEach(function(graphic)
				{
					if (graphic.geometry.type == "polygon")
					{
						self.sketchTool._drawingLayer.remove(graphic);
					}
				});
				self.create("polygon");
			});
		}
		return false;
	};

	StopPoolMapTool.prototype._tripStopNotInBoundaryDialogBox = function()
	{
		return this._warningDialogBox("Please draw a new shape which includes the trip stop");
	};

	StopPoolMapTool.prototype._clearTempDrawing = function()
	{
		var self = this;
		self.stopPreviewTool.clear();
		self._pointLayer.remove(self._newTripStopGraphic);
		self.sketchTool._drawingLayer.removeAll();
		self._walkoutGuideLayer.removeAll();
		self.stopTool.clearCandidateGraphics();
		self._newTripStopGraphic = null;
		self._oldBoundaryGraphic = null;
		self._oldBoundarySymbol = null;
		self.stopTool.stopBoundayType = "";
	};

	StopPoolMapTool.prototype.stopPreview = function()
	{
		this.stopPreviewTool._stopWalkoutPreview();
	}

	StopPoolMapTool.prototype.addPointToLayer = function(graphic)
	{
		var self = this;
		// when click on map to create a point for door to door
		if (self.stopTool.stopBoundayType == "door-to-door")
		{
			graphic = self.stopTool.createDoorToDoorPolygon(graphic.geometry, self._newTripStopGraphic.geometry);
			self.createStopBoundaryResolve({
				geometry: graphic.geometry,
				graphic: graphic,
				BdyType: 0
			});
		} else
		{
			if (!self.removeOverlapCheck(graphic)) { self.overlapDialog().then(function() { self._clearTempDrawing(); }) }
			else
			{
				var promise = Promise.resolve(true);
				if (self._boundaryThickness == 0 && self._fillPattern == 0) { promise = tf.promiseBootbox.alert("stop is not visible"); }
				promise.then(function()
				{
					var currentTravelScenario = self._viewModal.travelScenariosPaletteViewModel.travelScenariosViewModel.obSelectedTravelScenarios();
					if (self.editModal.showWalkout())
					{
						self.stopPreviewTool.addPreview(graphic, self.editModal.walkoutDistance(), self.editModal.obSelectedDistanceUnit(), self.editModal.walkoutBuffer(), self.editModal.obSelectedBufferUnit(),
							self.editModal.walkoutType(), false, currentTravelScenario);
					}

					self.onAddTripStopGraphic(graphic);
					return Promise.resolve(true);
				});
			}
		}
	}

	StopPoolMapTool.prototype.onAddTripStopGraphic = function(graphic, options)
	{
		var self = this;
		graphic.symbol = self.symbol.tripStop("0", "#FFFFFF");
		graphic.attributes = { "id": TF.createId() };
		self.getSnappedTripStop(graphic).then(function()
		{
			self.getTripStopStreetAddress(graphic).then(function()
			{
				self.addStopAddressAndBoundary(graphic, $.extend({}, options, { streetName: graphic.attributes.street }));
			});
		});
	};

	StopPoolMapTool.prototype.updateDataModel = function(graphics)
	{
		var self = this, updateDataModels = [];
		graphics.forEach(function(graphic)
		{
			if (graphic.attributes && graphic.attributes.dataModel && graphic.attributes.dataModel.type == "stopPoolBoundary")
			{
				var boundaryDataModel = self.createCopyDataModel(graphic);
				var dataModel = self.createCopyDataModel(self._findGraphicInLayerById(self._pointLayer, self.dataModel.findByStopId(graphic.attributes.dataModel.StopId).id));
				dataModel.boundary = boundaryDataModel;
				updateDataModels.push(dataModel);
			}
			else
			{
				var dataModel = self.createCopyDataModel(graphic);
				dataModel.geometry = graphic.geometry;
				updateDataModels.push(dataModel);
			}
		});
		self.dataModel.update(updateDataModels);
	};

	StopPoolMapTool.prototype.getTripStopStreetAddress = function(tripStop)
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

	StopPoolMapTool.prototype.addStopAddressAndBoundary = function(graphic, options)
	{
		var self = this;
		self.stopTool.addStopAddressAndBoundary(graphic, options);
		this._newTripStopGraphic = graphic;
	};

	StopPoolMapTool.prototype.copyToStopPools = function(tripStops)
	{
		var self = this, isOverlap = false, data = [];
		tripStops.forEach(function(tripStop)
		{
			var newStopBoundary = {
				id: TF.createId(),
				type: "stopPoolBoundary",
				geometry: tripStop.boundary.geometry,
				StopId: 0,
				OBJECTID: 0,
				BdyType: tripStop.boundary.BdyType
			};
			data = {
				geometry: tripStop.geometry,
				address: tripStop.Street,
				Street: tripStop.Street,
				City: tripStop.City,
				vehicleCurbApproach: tripStop.vehicleCurbApproach,
				boundary: newStopBoundary,
				TotalStopTime: tripStop.TotalStopTime,
				ProhibitCrosser: tripStop.ProhibitCrosser
			};
			self.viewModel.stopPoolPaletteSection.dataModel.create(data);
		});
	};

	StopPoolMapTool.prototype.copyToStopPool = function(tripStop)
	{
		var self = this;
		var newStopBoundary = {
			id: TF.createId(),
			type: "stopPoolBoundary",
			geometry: tripStop.boundary.geometry,
			StopId: 0,
			OBJECTID: 0,
			BdyType: tripStop.boundary.BdyType
		};

		// if overlap then cut overlap boundary 
		if (!self._allowOverlap)
		{
			if (!self.overlapCheck(tripStop))
			{
				return;
			} else
			{
				newStopBoundary.geometry = self.removeOverlapBoundary(newStopBoundary, tripStop).geometry;
			}
		}

		return self.viewModel.stopPoolPaletteSection.editModal.create({
			geometry: tripStop.geometry,
			Street: tripStop.Street,
			City: tripStop.City,
			vehicleCurbApproach: tripStop.vehicleCurbApproach,
			Comments: tripStop.Comment,
			TotalStopTime: tripStop.TotalStopTime,
			ProhibitCrosser: tripStop.ProhibitCrosser
		}, function()
		{
			return Promise.resolve(newStopBoundary);
		}, { isCopied: true });
	};

	StopPoolMapTool.prototype.removeOverlapBoundaries = function(stops)
	{
		var self = this;
		var _resolve = null;
		var _reject = null;
		var promise = new Promise(function(resolve, reject) { _resolve = resolve; _reject = reject; });

		var nonOverlapedStops = [];

		stops.forEach(function(stop)
		{
			stop.address = stop.Street;
			if (!self._isContainedByCurrentPolygons(stop))
			{
				nonOverlapedStops.push(stop);
			}
		});
		if (nonOverlapedStops.length == 0)
		{
			return _resolve(tf.promiseBootbox.alert("Remove Overlapping Boundaries is set as true! Since all stops are falling in current stop boundaries, no stops will be created", "Warning"));
		}
		else if (nonOverlapedStops.length < stops.length)
		{
			tf.loadingIndicator.tryHide();
			tf.promiseBootbox.alert("Remove Overlapping Boundaries is set as true! Some stops are falling in current stop boundaries", "Warning").then(function()
			{
				tf.loadingIndicator.show();
				self.stopTool.removeOverlapBoundariesByThiessen(nonOverlapedStops, self.dataModel.all).then(function(stops)
				{
					return _resolve(stops);
				})
			})
		}
		else if (nonOverlapedStops.length == stops.length)
		{
			self.stopTool.removeOverlapBoundariesByThiessen(stops, self.dataModel.all).then(function(stops)
			{
				return _resolve(stops);
			})
		}
		return promise;
	}

	StopPoolMapTool.prototype.getBoundaryHeartId = function(boundaryGraphic)
	{
		return boundaryGraphic.attributes.dataModel.StopId;
	};

	StopPoolMapTool.prototype.revert = function(data, type)
	{
		var self = this;
		if (type == "update")
		{
			data.forEach(function(d)
			{
				var boundaryGraphic = self._findGraphicInLayerById(self._polygonLayer, d.boundary.id);
				boundaryGraphic.geometry = TF.cloneGeometry(d.boundary.geometry);
				var stopGraphic = self._findGraphicInLayerById(self._pointLayer, d.id);
				stopGraphic.geometry = TF.cloneGeometry(d.geometry);
			})
			self.dataModel.update(data, true);
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

	StopPoolMapTool.prototype.overlapDialog = function()
	{
		return this._warningDialogBox("This stop cannot be copied to stop pool since remove overlapping boundaries setting is turned on.");
	};
})();
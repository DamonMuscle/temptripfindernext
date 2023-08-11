(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").StopTool = StopTool;

	function StopTool(drawTool, map, viewModal)
	{
		var self = this;
		self._arcgis = tf.map.ArcGIS;
		self._map = map;
		self._viewModel = viewModal;
		if (drawTool)
		{
			self.drawTool = drawTool;
			self.dataModel = drawTool.dataModel;
			self.viewModel = drawTool.viewModel;
			self._viewModel = drawTool.viewModel._viewModal;
			self.editModal = drawTool.editModal;
			self._map = drawTool._map;
		}

		var serviceAreaUrl = arcgisUrls.WalkoutRoute;
		// self._serviceAreaTask = new self._arcgis.ServiceAreaTask(serviceAreaUrl);

		var locatorUrl = arcgisUrls.StreetGeocodeServiceFile;
		// self._geocoder = new self._arcgis.Locator(locatorUrl);

		self.streetUrl = arcgisUrls.MapEditingOneService + "/43";
		self.generateWalkoutZone = self.generateWalkoutZone.bind(self);
		self.generateThissenUrl = arcgisUrls.TFUtilitiesGPService + "/Create%20Thiessen%20Polygons";
		// self.generateThissenProcessor = new self._arcgis.Geoprocessor(self.generateThissenUrl);

		self.candidateGraphics = [];

		self.insetDistance = 5;
		self.offsetDistance = 2.5;
		self.pointToJunctionDistance = Math.sqrt(Math.pow(self.insetDistance, 2) + Math.pow(self.offsetDistance, 2));
		self.insetDistanceOnPreview = 5;
		self.offsetDistanceOnPreview = 2.5;
		self._closetStreetCache = new Map();
		self._closetStreetDoorToDoorCache = new Map();
		self.nearbyJunctionPoint;
	}

	StopTool.prototype.constructor = StopTool;

	/**
	 * generate walk out zone(radius path or circle)
	 * @param {geometry} stop
	 * @param {String/int} walkoutDistance
	 * @param {string} distanceUnit "meters","feet","miles","kilometers","yards"
	 * @param {String/int} walkoutBuffer
	 * @param {string} bufferUnit "meters","feet","miles","kilometers","yards"
	 * @param {int} walkoutType 0 or 1
	 * @param {string} color (optional)hexvalue
	 * @return {graphic} walkoutzone result graphic to be add onto layer.
	 */
	StopTool.prototype.generateWalkoutZone = function(stopGraphic, walkoutDistance, distanceUnit, walkoutBuffer, bufferUnit, walkoutType, color, notShowLoading, driveTime, travelScenario, barriers)
	{
		var self = this;
		if (!walkoutBuffer || !bufferUnit || !stopGraphic || !walkoutDistance || !distanceUnit)
		{
			return Promise.resolve();
		}
		var distance = self._calculateDistance(parseFloat(walkoutDistance), distanceUnit);
		// large distance will take a long time to calculate.
		var maxDistance = 10000;
		if (distance > maxDistance)
		{
			distance = maxDistance;
		}
		var bufferLength = self._calculateDistance(parseFloat(walkoutBuffer), bufferUnit);
		var promises = [];
		if (distance == 0 && bufferLength == 0)
		{
			return Promise.resolve();
		}
		if (walkoutType <= 2)
		{
			promises = [self.generateWalkout(stopGraphic, distance + bufferLength, bufferLength, walkoutType, color, notShowLoading, travelScenario, barriers),
			self.generateWalkout(stopGraphic, distance, bufferLength, walkoutType, color, notShowLoading, travelScenario, barriers)]
		} else
		{
			promises = [self.generateDriveTo(stopGraphic, bufferLength, driveTime, travelScenario)]
		}

		return Promise.all(promises).then(function(result)
		{
			if (walkoutType == 3)
			{
				return result[0];
			}
			else
			{
				if (result[0] && result[0].walkoutGuide)
				{
					var fullLengthWalkoutGuide = self._arcgis.geometryEngine.intersect(result[0].walkoutGuide, result[1].walkoutZone.geometry);
					result[1].walkoutGuide = fullLengthWalkoutGuide;
				}
				return result[1];
			}
		}).catch(e =>
		{
			self.viewModel.display.arcgisError(e.message);
		});
	};

	StopTool.prototype.generateDriveTo = function(stopGraphic, walkoutBuffer, driveTime, travelScenario)
	{
		var self = this;
		var buffer;
		var stop = stopGraphic.geometry;
		var serviceAreaParameters = new self._arcgis.ServiceAreaParameters();
		serviceAreaParameters.travelDirection = "to-facility";
		serviceAreaParameters.outSpatialReference = self._arcgis.SpatialReference.WebMercator;
		serviceAreaParameters.outputLines = "true-shape";
		serviceAreaParameters.impedanceAttribute = "Time";
		//serviceAreaParameters.defaultBreaks = [driveTime];
		var facilities = new self._arcgis.FeatureSet();
		facilities.features.push(new self._arcgis.Graphic({ geometry: stop, attributes: { "Breaks_Time": driveTime } }));
		serviceAreaParameters.facilities = facilities;

		var _resolve = null;
		var promise = new Promise(function(resolve, reject) { _resolve = resolve; });
		self.getRouteParamsByTravelScenario(serviceAreaParameters, "servicearea", travelScenario).then(function(serviceAreaParameters)
		{
			var walkoutGeom = null, unionGeom = null, walkoutZone = null;
			var id = TF.createId(), attributes = { "id": id };

			tf.startup.loadArcgisUrls().then(function()
			{
				// self._serviceAreaTask.url = arcgisUrls.WalkoutRoute;
				// self._serviceAreaTask.solve(serviceAreaParameters).then(showResult)
			})

			function showResult(result)
			{

				var geometries = [];
				result.serviceAreaPolylines.forEach(function(line)
				{
					geometries.push(line.geometry);
				});

				unionGeom = self._arcgis.geometryEngine.union(geometries);
				buffer = self._arcgis.geometryEngine.geodesicBuffer(unionGeom, parseFloat(walkoutBuffer), "meters");
				walkoutGeom = self._removeInnerRings(buffer);

				var symbol = {
					type: "simple-fill",
					color: [0, 51, 204, 0.5],
					outline: {
						color: [0, 51, 204],
						width: 2
					}
				}

				walkoutZone = new self._arcgis.Graphic(walkoutGeom, symbol, attributes);
				if (!self._arcgis.geometryEngine.intersects(walkoutZone.geometry, stop))
				{
					var nearestPointGeometry = self._arcgis.geometryEngine.nearestCoordinate(walkoutZone.geometry, stop).coordinate;
					var spatialReference = self._map ? self._map.mapView.spatialReference : new self._arcgis.SpatialReference(102100);
					var line = new self._arcgis.Polyline({
						type: "polyline",
						paths: [[nearestPointGeometry.x, nearestPointGeometry.y], [stop.x, stop.y]],
						spatialReference: spatialReference
					});
					buffer = self._arcgis.geometryEngine.buffer(line, 5, "meters");
					var parcelWithFinger = self._arcgis.geometryEngine.union([self._arcgis.geometryEngine.simplify(buffer), self._arcgis.geometryEngine.simplify(walkoutZone.geometry)]);
					walkoutZone.geometry = parcelWithFinger;

				}
				_resolve({ walkoutZone: walkoutZone, walkoutGuide: unionGeom });
			}
		})
		return promise;
	}

	StopTool.prototype.generateWalkout = function(stopGraphic, walkoutDistance, walkoutBuffer, walkoutType, color, notShowLoading, travelScenario, barriers)
	{
		var self = this;
		var buffer;
		var stop = stopGraphic.geometry;
		var distance = walkoutDistance;
		var bufferLength = walkoutBuffer;
		var breakLength = (distance > bufferLength) ? (distance - bufferLength) : distance;
		var serviceAreaParameters = new self._arcgis.ServiceAreaParameters();
		serviceAreaParameters.travelDirection = walkoutType == 2 ? "to-facility" : "from-facility";
		serviceAreaParameters.defaultBreaks = [100]; // units:meters
		serviceAreaParameters.outSpatialReference = self._arcgis.SpatialReference.WebMercator;
		serviceAreaParameters.outputLines = "true-shape";
		serviceAreaParameters.impedanceAttribute = "Length";
		serviceAreaParameters.defaultBreaks = [breakLength];
		var facilities = new self._arcgis.FeatureSet();
		facilities.features.push(new self._arcgis.Graphic(stop));
		serviceAreaParameters.facilities = facilities;

		if (!notShowLoading) { tf.loadingIndicator.showImmediately(); }
		var ts = (walkoutType == 2) ? travelScenario : { Id: 2 };
		return self.getRouteParamsByTravelScenario(serviceAreaParameters, "servicearea", ts, barriers).then(function(serviceAreaParameters)
		{
			var walkoutGeom = null, unionGeom = null, walkoutZone = null;
			var id = TF.createId(), attributes = { "id": id };
			if (walkoutType == 1)
			{
				if (!notShowLoading)
				{
					tf.loadingIndicator.tryHide();
				}
				walkoutGeom = self._arcgis.geometryEngine.geodesicBuffer(stop, distance, 'meters');
				walkoutZone = new self._arcgis.Graphic(walkoutGeom, null, attributes);
				return { walkoutZone: walkoutZone, walkoutGuide: unionGeom };
			} else if (walkoutType == 0 || walkoutType == 2)
			{
				var promise = null;
				if (!barriers) { promise = tf.startup.loadArcgisUrls(); }
				else { promise = Promise.resolve(); }
				return promise.then(function()
				{
					self._serviceAreaTask.url = arcgisUrls.WalkoutRoute;
					return self._serviceAreaTask.solve(serviceAreaParameters).then((result) =>
					{
						if (!notShowLoading)
						{
							tf.loadingIndicator.tryHide();
						}
						if (walkoutType == 0 || walkoutType == 2)
						{
							var geometries = [];
							result.serviceAreaPolylines.forEach(function(line)
							{
								geometries.push(line.geometry);
							});

							unionGeom = self._arcgis.geometryEngine.union(geometries);
							buffer = self._arcgis.geometryEngine.geodesicBuffer(unionGeom, parseFloat(walkoutBuffer), "meters");
							walkoutGeom = self._removeInnerRings(buffer);
						}
						else if (walkoutType == 1)
						{
							walkoutGeom = new self._arcgis.Circle(stop, { "radius": distance });
						}

						var symbol = {
							type: "simple-fill",
							color: [0, 51, 204, 0.5],
							outline: {
								color: [0, 51, 204],
								width: 2
							}
						};
						if (color)
						{
							var selectColor = tf.map.ArcGIS.Color.fromString(color);
							symbol = {
								type: "simple-fill",
								color: [selectColor.r, selectColor.g, selectColor.b, 0.5],
								outline: {
									color: [selectColor.r, selectColor.g, selectColor.b],
									width: 2
								}
							}
						}

						walkoutZone = new self._arcgis.Graphic(walkoutGeom, symbol, attributes);
						if (!self._arcgis.geometryEngine.intersects(walkoutZone.geometry, stop))
						{
							var nearestPointGeometry = self._arcgis.geometryEngine.nearestCoordinate(walkoutZone.geometry, stop).coordinate;
							var spatialReference = self._map ? self._map.mapView.spatialReference : new self._arcgis.SpatialReference(102100);
							var line = new self._arcgis.Polyline({
								type: "polyline",
								paths: [[nearestPointGeometry.x, nearestPointGeometry.y], [stop.x, stop.y]],
								spatialReference: spatialReference
							});
							buffer = self._arcgis.geometryEngine.geodesicBuffer(line, 5, "meters");
							var parcelWithFinger = self._arcgis.geometryEngine.union([self._arcgis.geometryEngine.simplify(buffer), self._arcgis.geometryEngine.simplify(walkoutZone.geometry)]);
							walkoutZone.geometry = parcelWithFinger;

						}
						return { walkoutZone: walkoutZone, walkoutGuide: unionGeom };
					}).catch(function()
					{
						if (!notShowLoading)
						{
							tf.loadingIndicator.tryHide();
						}
					});
				});
			}
		});
	};

	StopTool.prototype._generateWalkoutZone = function(stopGraphic, travelScenario)
	{
		var self = this;
		return new Promise(function(resolve)
		{
			const data = self.editModal.getWalkoutData();
			self.generateWalkoutZone(stopGraphic, data.walkoutDistance, data.distanceUnit, data.walkoutBuffer, data.bufferUnit,
				self.editModal.walkoutType(), null, null, null, travelScenario).then(function(result)
				{
					var walkoutZone = result.walkoutZone;
					walkoutZone.geometry = new self._arcgis.Polygon({
						type: "polygon",
						spatialReference: { wkid: 102100 },
						rings: walkoutZone.geometry.rings
					})
					//walkoutZone = self._removeOverlap(walkoutZone, stopGraphic.geometry);
					self.drawTool._boundaryGraphic = walkoutZone;
					var ret = {
						geometry: walkoutZone.geometry,
						graphic: walkoutZone
					};
					if (self.drawTool.createStopBoundaryResolve)
					{
						self.drawTool.createStopBoundaryResolve(ret);
					}
					resolve(ret);
				});
		}, function(err)
		{
			console.log(err);
		}, self);
	};
	StopTool.prototype._removeOverlap = function(walkoutZone, centroid)
	{
		var self = this;
		if (self.drawTool._allowOverlap || (!self.drawTool._allowOverlap && !self.drawTool._isOverlapWithCurrentPolygons(walkoutZone)))
		{
			return walkoutZone;
		}
		var intersectGeometry = self.drawTool._intersectWithCurrentPolygons(walkoutZone);
		if (intersectGeometry)
		{
			var cutResult = self._arcgis.geometryEngine.difference(walkoutZone.geometry, intersectGeometry);
			cutResult = self.drawTool.editTool._cutResultHandler(cutResult, centroid);
			if (!cutResult) return false;
			walkoutZone.geometry = cutResult;
			return walkoutZone;
		}
		return walkoutZone;

	}

	StopTool.prototype._generateWalkoutGuide = function(stopGraphic, travelScenario)
	{
		var self = this;
		return this._generateWalkoutGuideWithParam(stopGraphic,
			parseInt(self.editModal.walkoutDistance()),
			self.editModal.obSelectedDistanceUnit(),
			self.editModal.walkoutBuffer(),
			self.editModal.obSelectedBufferUnit(),
			self.editModal.showWalkout(),
			self.editModal.walkoutType(),
			travelScenario);
	};

	StopTool.prototype._generateWalkoutGuideWithParam = function(stopGraphic, walkoutDistance, distanceUnit, walkoutBuffer, bufferUnit, showWalkout, walkoutType, travelScenario)
	{
		var self = this;
		var distance = self._calculateDistance(walkoutDistance, distanceUnit);
		if (showWalkout)
		{
			if (walkoutType == 0)
			{
				this.generateWalkoutZone(stopGraphic, walkoutDistance, distanceUnit, walkoutBuffer, bufferUnit, walkoutType, null, null, null, travelScenario).then(function(result)
				{
					if (result && result.walkoutGuide)
					{

						var symbol = new self._arcgis.SimpleLineSymbol({
							style: "solid",
							color: "black",
							width: 5
						});
						self.drawTool._walkoutGuideLayer.graphics.add(new self._arcgis.Graphic(result.walkoutGuide, symbol, stopGraphic.attributes));
						return Promise.resolve(true);
					}
					return Promise.resolve(false);
				});
			} else
			{
				var circle = new self._arcgis.Circle(stopGraphic.geometry, {
					"radius": distance
				});
				var walkoutZone = new self._arcgis.Graphic(circle, new self._arcgis.SimpleFillSymbol(), stopGraphic.attributes);
				self.drawTool._walkoutGuideLayer.add(walkoutZone);
				return Promise.resolve(true);
			}
		}
		return Promise.resolve(true);
	};

	StopTool.prototype.generateWalkoutGeometry = function(stopGraphic, walkoutDistance, distanceUnit, walkoutBuffer, bufferUnit, walkoutType)
	{
		var self = this;
		if (walkoutType == 0)
		{
			return this.generateWalkoutZone(stopGraphic, walkoutDistance, distanceUnit, walkoutBuffer, bufferUnit, walkoutType).then(function(result)
			{
				if (result && result.walkoutZone)
				{
					return result.walkoutZone.geometry;
				}
			});
		} else
		{
			var circle = self._arcgis.geometryEngine.geodesicBuffer(stopGraphic.geometry, self._calculateDistance(walkoutDistance, distanceUnit), "meters");
			return Promise.resolve(circle);
		}
	};

	StopTool.prototype._calculateDistance = function(number, unit)
	{
		switch (unit)
		{
			case "meters":
				return number;
			case "feet":
			case "ft":
				return number * 0.3048;
			case "miles":
			case "mi":
				return number * 1609.344;
			case "kilometers":
				return number * 1000;
			case "yards":
				return number * 0.9144;
		}
	};

	StopTool.prototype._removeInnerRings = function(buffer)
	{
		var self = this;
		var polygons = [];
		buffer.rings.forEach(function(ring)
		{
			var spatialReference = self._map ? self._map.mapView.spatialReference : new self._arcgis.SpatialReference(102100);
			var polygon = new self._arcgis.Polygon({ spatialReference: spatialReference, rings: [ring] });
			polygons.push(self._arcgis.geometryEngine.simplify(polygon));
		});
		return self._arcgis.geometryEngine.union(polygons);
	};

	StopTool.prototype.getWalkRouteParameters = function(routeParameters, type)
	{
		var self = this;
		return self.getRouteParameters(routeParameters, type, { Id: 2 });
	}
	StopTool.prototype.getRouteParamsByTravelScenario = function(routeParameters, type, travelScenario, barriers)
	{
		var self = this;
		if (!travelScenario)
		{
			return self.getRouteParameters(routeParameters, type, { Id: 1 }, barriers);
		} else
		{
			return self.getRouteParameters(routeParameters, type, travelScenario, barriers);
		}

	}

	StopTool.prototype.getTravelMode = function(travelScenarioId, params)
	{
		return TF.getTravelMode(travelScenarioId, params);
	};

	StopTool.prototype.getRouteParameters = function(routeParameters, type, travelScenario, barriers)
	{
		var self = this,
			barrierPromise = null, travelModePromise = null;

		if (travelScenario.Id == 2)
		{
			routeParameters.restrictionAttributes = ["walktraverse", "redturn_1", "yellowturn_13"];
		} else
		{
			routeParameters.restrictionAttributes = ["Oneway", "vehicletraverse", "redturn_" + travelScenario.ProhibitedId, "yellowturn_" + travelScenario.RestrictedId];
		}

		if (barriers)
		{
			barrierPromise = Promise.resolve(barriers);
		} else
		{
			barrierPromise = self._getSelectedBarriers(travelScenario.Id);
		}

		travelModePromise = self.getTravelMode(travelScenario.Id, routeParameters);
		return Promise.all([barrierPromise, travelModePromise]).then(function(results)
		{
			var barriers = results[0];
			routeParameters.travelMode = results[1];
			routeParameters.outputLines = "true-shape";
			routeParameters.pointBarriers = barriers === null ? [] : barriers[0];
			routeParameters.returnPolygonBarriers = true;
			routeParameters.polylineBarriers = barriers === null ? [] : barriers[1];
			routeParameters.polygonBarriers = barriers === null ? [] : {
				features: barriers[2].features.map(function(f)
				{
					var b = new self._arcgis.Graphic();
					b.geometry = f.geometry;
					b.attributes = {
						"BarrierType": f.attributes.BarrierType,
						"Attr_Time": parseFloat(f.attributes.Attr_Time) + 0.000001,
					};
					return b
				})
			};
			return Promise.resolve(routeParameters);
		})
	};

	StopTool.prototype._getSelectedBarriers = function(travelScenarioId)
	{
		var self = this;
		if (!self._selectedBarriersTimeSpan)
		{
			return self._getBarriers(travelScenarioId);
		}
		else
		{
			var currentTimeSpan = moment();
			if (currentTimeSpan.diff(self._selectedBarriersTimeSpan, 'seconds') >= 2)
			{
				return self._getBarriers(travelScenarioId);
			}
			else
			{
				return Promise.resolve(self._allBarriers);
			}
		}
	};

	StopTool.prototype._getBarriers = function(travelScenarioId)
	{
		var self = this;
		var pointbarriers = new self._arcgis.FeatureSet();
		var linebarriers = new self._arcgis.FeatureSet();
		var polygonbarriers = new self._arcgis.FeatureSet();

		var allBarriers = [pointbarriers, linebarriers, polygonbarriers];
		var queryPromise = tf.startup.loadArcgisUrls().then(function()
		{
			return TF.queryTravelSCenarios(travelScenarioId)
		});
		return queryPromise.then(function(res)
		{
			var curbs, travelRegions;
			if (res)
			{
				curbs = res[0];
				travelRegions = res[1];
			}

			if (curbs)
			{
				curbs.forEach(function(curb)
				{
					var barrier = new self._arcgis.Graphic(curb.geometry, new self._arcgis.SimpleMarkerSymbol());
					barrier.geometry = self._arcgis.webMercatorUtils.webMercatorToGeographic(curb.geometry);
					var fullEdge = curb.attributes.Type == 0 ? true : false;
					barrier.attributes = {
						"FullEdge": fullEdge,
						"BarrierType": curb.attributes.Type,
						"Attr_Time": 0.1,
						"SideOfEdge": curb.attributes.SideOfStreet,
						"SourceOID": curb.attributes.StreetSegmentID,
						"SourceID": tf.streetSourceOid,
						"PosAlong": 0.474451,
						"CurbApproach": 1
					};
					pointbarriers.features.push(barrier);
				}, this);
			}
			if (travelRegions)
			{
				travelRegions.forEach(function(travelRegion)
				{
					var attributes = {
						"BarrierType": travelRegion.attributes.Type == 2 ? 0 : 1,
						"Attr_Time": parseFloat(travelRegion.attributes.Weight) + 0.000001,
						"isChangeTime": travelRegion.attributes.IsChangeTime
					};
					var barrierGraphic = new self._arcgis.Graphic(travelRegion.geometry, null, attributes);
					polygonbarriers.features.push(barrierGraphic);
				}, this);
			}
			self._selectedBarriersTimeSpan = moment();
			self._allBarriers = allBarriers;
			return Promise.resolve(allBarriers);
		});
	}

	StopTool.prototype.createDoorToDoorPolygon = function(geometry1, geometry2)
	{
		var self = this;
		var shape = null;
		if (geometry1.x == geometry2.x && geometry1.y == geometry2.y)
		{
			shape = geometry1;
		} else
		{
			shape = new self._arcgis.Polyline({
				spatialReference: { wkid: 102100 },
				paths: [[geometry1.x, geometry1.y], [geometry2.x, geometry2.y]]
			});
		}
		var buffer = self._arcgis.geometryEngine.geodesicBuffer(shape, 5, "meters");

		var id = TF.createId(),
			attributes = {
				"id": id,
				BdyType: 0
			};

		return new this._arcgis.Graphic({
			geometry: buffer, attributes: attributes
		});
	};

	StopTool.prototype.addStopAddressAndBoundary = function(pointGraphic, theOptions)
	{
		var defaultOptions = {
			student: null,
			isCreateFromStopSearch: false,
			isCreateFromSearch: false,
			boundary: null,
			insertBehindSpecialStop: null,
			streetName: "",
			isCopied: false,
			selectLastSelectedTrip: true,
			tryUseLastSettings: false
		};
		var options = $.extend(defaultOptions, theOptions);

		var self = this;
		var cityName = TF.RoutingMap.GeocodeHelper.getCityName(pointGraphic.geometry);
		pointGraphic.attributes = $.extend(pointGraphic.attributes, { stop: { address: options.streetName, geometry: pointGraphic.geometry } });

		return self.editModal.create({
			graphic: pointGraphic,
			geometry: pointGraphic.geometry,
			Street: options.streetName,
			City: cityName
		}, function(stopType, stop, travelScenario)
		{
			if (stopType.toLowerCase() === "none")
			{
				return Promise.resolve(true);
			}
			self.stopBoundayType = stopType.toLowerCase();
			var stopGraphic = new self._arcgis.Graphic(stop.geometry, null, { dataModel: stop });
			if (options.boundary && options.boundary.geometry && self.editModal.copyStopBoundarySelectionCreate() && options.isCreateFromStopSearch)
			{
				return Promise.resolve(new self._arcgis.Graphic(options.boundary.geometry, self._polygonSymbol, { "id": TF.createId() }));
			}
			if (stopType.toLowerCase() != "door-to-door")
			{
				if (!self.drawTool.overlapCheckCurrentEditTrips(stopGraphic))
				{
					return new Promise(function(resolve, reject)
					{
						self.drawTool.createStopBoundaryResolve = resolve;
						self.drawTool.createStopBoundaryreject = reject;
						self.drawTool.createStopBoundaryResolve(false);
					});
				}
			}
			self.drawTool.sketchTool.stop();
			self.focusOnActiveCandidateGraphics();

			if (stopType.toLowerCase() == "walkout")
			{
				self._generateWalkoutZone(stopGraphic, travelScenario);
				return new Promise(function(resolve, reject)
				{
					self.drawTool.createStopBoundaryResolve = resolve;
					self.drawTool.createStopBoundaryreject = reject;
				});
			}

			// self._generateWalkoutGuide(stopGraphic, travelScenario).then(function()
			// {
			self.drawTool.create(stopType.toLowerCase());
			//}, self);
			return new Promise(function(resolve, reject)
			{
				self.drawTool.createStopBoundaryResolve = resolve;
				self.drawTool.createStopBoundaryreject = reject;
			});
		}, options).then(function(data)
		{
			// if (data && data[0] && $.isArray(data))
			// {
			// 	self.drawTool._boundaryGraphic = data.map(function(c) { return c.graphic; });
			// }
			var previewLayer = self.drawTool._previewLayer || self.drawTool._map.findLayerById("tripStopPreviewLayer");
			previewLayer && previewLayer.removeAll();
			self.drawTool._clearTempDrawing();
			// self.drawTool._newTripStopBoundaryType = null;
			return Promise.resolve(true);
		}, function()
		{
			console.error(arguments);
		});
	};

	StopTool.prototype.removeGraphicInLayer = function(layer, graphics)
	{
		if (!graphics) return;
		var deleteGraphic = graphics;
		if (!$.isArray(graphics))
		{
			deleteGraphic = [graphics];
		}
		deleteGraphic.forEach(function(graphic)
		{
			if (graphic) { layer.remove(graphic); }
		});
	};

	StopTool.prototype.getPosAlong = function(point, polyline)
	{
		var self = this;
		var fullLength = self._arcgis.geometryEngine.geodesicLength(polyline, "meters");
		var nearestCoordinate = self._arcgis.geometryEngine.nearestCoordinate(polyline, point).coordinate;
		var culLength = 0;
		for (var i = 0; i < polyline.paths[0].length - 1; i++)
		{
			var segment = new self._arcgis.Polyline({
				paths: [[polyline.paths[0][i], polyline.paths[0][i + 1]]],
				spatialReference: { wkid: 102100 }
			});
			if (self._arcgis.geometryEngine.intersects(nearestCoordinate, segment))
			{
				var l = new self._arcgis.Polyline({
					paths: [[polyline.paths[0][i], [nearestCoordinate.x, nearestCoordinate.y]]],
					spatialReference: { wkid: 102100 }
				});
				culLength += self._arcgis.geometryEngine.geodesicLength(l, "meters");
				break;
			} else
			{
				culLength += self._arcgis.geometryEngine.geodesicLength(segment, "meters");
			}
		}
		return culLength / fullLength;
	}

	StopTool.prototype.getOppositePoint = function(point, polyline)
	{
		if (!point || !polyline) return;
		var self = this;
		var nearestCoordinate = self._arcgis.geometryEngine.nearestCoordinate(polyline, point).coordinate;
		var verticalPolyline = new self._arcgis.Polyline({
			paths: [[[point.x, point.y], [nearestCoordinate.x, nearestCoordinate.y]]],
			spatialReference: { wkid: 102100 }
		});
		var distance = self._arcgis.geometryEngine.geodesicLength(verticalPolyline, "meters");
		var oppositePoint = self._findPointOnLineByDistance(verticalPolyline, distance * 2);
		return oppositePoint;
	}

	StopTool.prototype.findClosestSegmentToPoint = function(point, polyline)
	{
		var self = this, minDistance = Number.MAX_VALUE, minSegment = null;
		for (var i = 0; i < polyline.paths[0].length - 1; i++)
		{
			var segment = new self._arcgis.Polyline({
				paths: [[polyline.paths[0][i], polyline.paths[0][i + 1]]],
				spatialReference: { wkid: 102100 }
			});
			var d = self._arcgis.geometryEngine.distance(point, segment, "meters");
			if (d < minDistance) { minDistance = d; minSegment = segment; }
		}
		return minSegment;
	}

	StopTool.prototype.getStopStreetAddress = function(geometry)
	{
		var self = this;
		var distance = TF.geocodeTolerance;
		return TF.locationToAddress(geometry).then(function(result)
		{
			if (result)
			{
				return result.Address;
			} else
			{
				return self.findClosestLocationOnStreet({ geometry: geometry }).then(function(closestStreet)
				{
					if (closestStreet && closestStreet.distance <= distance)
					{
						return Promise.resolve(closestStreet.address.split(",")[0]);
					}
					return self._reverseGeocodeDialogBox().then(function()
					{
						tf.loadingIndicator.tryHide();
						return Promise.resolve(false);
					});
				});
			}
		});
	};

	StopTool.prototype.reverseGeocodeStop = function(geometry, address)
	{
		var self = this;
		if (address)
		{
			return Promise.resolve(address.split(",")[0]);
		}
		return self.getStopStreetAddress(geometry);
	};

	StopTool.prototype.getDoorToDoorLocationForStudent = function(student, streets)
	{
		return this.findClosestLocationOnStreetForDoorToDoor({ geometry: student.geometry, address: student.address }, streets).then(result =>
		{
			if (result)
			{
				var stopLocation = result.geometry;
				var midPoint = this.getDoorToDoorLocation(stopLocation, student.geometry);
				return Promise.resolve(midPoint);
			}
			return Promise.resolve(student.geometry);
		});
	}

	StopTool.prototype.getDoorToDoorLocation = function(streetPointGeometry, studentGeometry)
	{
		if (tf.map.ArcGIS.geometryEngine.distance(streetPointGeometry, studentGeometry, "meters") < 10)
		{
			return studentGeometry;
		}
		var midPoint = new tf.map.ArcGIS.Point({
			x: (streetPointGeometry.x + studentGeometry.x) / 2,
			y: (streetPointGeometry.y + studentGeometry.y) / 2,
			spatialReference: { wkid: 102100 }
		});
		return midPoint;
	};

	StopTool.prototype.findClosestLocationOnStreet = function(stop, streets)
	{
		var self = this;
		return self.attachClosetStreetToStop(stop, "file", streets).then(function()
		{
			if (stop.StreetSegment)
			{
				var nearestStopGeom = self._arcgis.geometryEngine.nearestCoordinate(stop.StreetSegment.geometry, stop.geometry);
				return Promise.resolve({ geometry: nearestStopGeom.coordinate, distance: stop.streetDistance, address: stop.StreetSegment.Street, street: stop.StreetSegment });
			}
			return Promise.resolve(false);
		});
	};

	StopTool.prototype.findClosestLocationOnStreetForDoorToDoor = function(stop, streets)
	{
		var self = this;
		return self.attachClosetStreetToStopForDoorToDoor(stop, "file", streets).then(function()
		{
			if (stop.StreetSegment)
			{
				var nearestStopGeom = self._arcgis.geometryEngine.nearestCoordinate(stop.StreetSegment.geometry, stop.geometry);
				return Promise.resolve({ geometry: nearestStopGeom.coordinate, distance: stop.streetDistance, address: stop.StreetSegment.Street, street: stop.StreetSegment });
			}
			return Promise.resolve(false);
		});
	};

	/**
	* add closet StreetSegment property to stop
	*/
	StopTool.prototype.attachClosetStreetToStop = function(stops, type = "file", streets)
	{
		console.log("todo: attach closest street to stop");
		return Promise.resolve();

		if (stops.length == 0) return Promise.resolve(true);
		var self = this;

		if (!$.isArray(stops))
		{
			stops = [stops];
		}

		let stopsNotInCache = [],
			getGeometry = s => (s.SchoolLocation ? s.SchoolLocation.geometry : s.geometry) || (s.geometry = TF.xyToGeometry(s.XCoord, s.YCoord));

		stops.forEach(stop =>
		{
			let geometry = getGeometry(stop),
				key = geometry.x + "-" + geometry.y;
			if (this._closetStreetCache.has(key))
			{
				var data = this._closetStreetCache.get(key);
				stop.StreetSegment = data.StreetSegment;
				stop.streetDistance = data.streetDistance;
			} else
			{
				stopsNotInCache.push(stop);
			}
		});

		if (stopsNotInCache.length > 0)
		{
			return (streets ? Promise.resolve(streets) : TF.StreetHelper.getStreetInExtent(stopsNotInCache.map(getGeometry), type)).then(streets =>
			{
				setNearestStreet(stopsNotInCache, streets);
			});
		}

		return Promise.resolve();

		function getStopStreetInfo(stop)
		{
			var reg = /(\d*\.?\d*)\s((\w|\s)+)/,
				streetNumber = "",
				streetName = "";
			if (stop.address && reg.test(stop.address))
			{
				var regResult = reg.exec(stop.address);
				if (regResult.length > 2)
				{
					streetNumber = parseFloat(regResult[1]);
					streetName = regResult[2];
				}
			}
			return { streetNumber: streetNumber, streetName: streetName };
		}

		function findStreet(stop, streets)
		{
			var distance = 501,
				streetSegment = null,
				{ streetNumber, streetName } = getStopStreetInfo(stop),
				stopGeometry = getGeometry(stop);
			for (var i = 0; i < streets.length; i++)
			{
				var streetMatchStopStreet = streetNumber &&
					streetName &&
					streets[i].Street.toUpperCase() == streetName.toUpperCase() &&
					((parseFloat(streets[i].Fromleft) <= streetNumber && parseFloat(streets[i].Toleft) >= streetNumber) ||
						(parseFloat(streets[i].Fromright) <= streetNumber && parseFloat(streets[i].Toright) >= streetNumber));

				if (streetMatchStopStreet)
				{
					streetSegment = streets[i];
					break;
				}

				var d = self._arcgis.geometryEngine.distance(streets[i].geometry, stopGeometry, "meters");
				if (d < distance)
				{
					streetSegment = streets[i];
					distance = d;
				}
			}

			return streetSegment;
		}

		function setNearestStreet(stops, streets)
		{
			if (streets.length > 0)
			{
				stops.forEach(function(stop)
				{
					stop.StreetSegment = findStreet(stop, streets);
					if (stop.StreetSegment)
					{
						let stopGeometry = getGeometry(stop),
							closestPoint = self._arcgis.geometryEngine.nearestCoordinate(stop.StreetSegment.geometry, stopGeometry).coordinate,
							line = new self._arcgis.Polyline({
								spatialReference: tf.map.ArcGIS.SpatialReference.WebMercator,
								paths: [[closestPoint.x, closestPoint.y], [stopGeometry.x, stopGeometry.y]]
							});
						stop.streetDistance = self._arcgis.geometryEngine.geodesicLength(line, "meters");
						self._closetStreetCache.set(stopGeometry.x + "-" + stopGeometry.y, { StreetSegment: stop.StreetSegment, streetDistance: stop.streetDistance });
					}
				});
			}
		}
	};

	/**
	* add closet StreetSegment property to stop
	*/
	StopTool.prototype.attachClosetStreetToStopForDoorToDoor = function(stops, type = "file", streets)
	{
		if (stops.length == 0) return Promise.resolve(true);
		var self = this;

		if (!$.isArray(stops))
		{
			stops = [stops];
		}

		let stopsNotInCache = [],
			getGeometry = s => s.SchoolLocation ? s.SchoolLocation.geometry : s.geometry;

		stops.forEach(stop =>
		{
			let geometry = getGeometry(stop),
				key = geometry.x + "-" + geometry.y;
			if (this._closetStreetDoorToDoorCache.has(key))
			{
				var data = this._closetStreetDoorToDoorCache.get(key);
				stop.StreetSegment = data.StreetSegment;
				stop.streetDistance = data.streetDistance;
			} else
			{
				stopsNotInCache.push(stop);
			}
		});

		if (stopsNotInCache.length > 0)
		{
			return (streets ? Promise.resolve(streets) : TF.StreetHelper.getStreetInExtent(stopsNotInCache.map(getGeometry), type)).then(streets =>
			{
				setNearestStreet(stopsNotInCache, streets);
			});
		}

		return Promise.resolve();

		function getStopStreetInfo(stop)
		{
			var reg = /(\d*\.?\d*)\s((\w|\s)+)/,
				streetName = "";
			if (stop.address && reg.test(stop.address))
			{
				var regResult = reg.exec(stop.address);
				if (regResult.length > 2)
				{
					streetName = regResult[2];
				}
			}
			return { streetName: streetName };
		}

		function findStreet(stop, streets)
		{
			var distance = 501,
				streetSegment = null,
				{ streetName } = getStopStreetInfo(stop),
				stopGeometry = getGeometry(stop),
				matchedStreets = new Map();
			for (var i = 0; i < streets.length; i++)
			{
				var streetMatchStopStreet = streetName &&
					streets[i].Street.toUpperCase() == streetName.toUpperCase();
				var d = self._arcgis.geometryEngine.distance(streets[i].geometry, stopGeometry, "meters");
				if (d < distance)
				{
					matchedStreets.set(d, { street: streets[i], match: streetMatchStopStreet });
				}
			}
			if (matchedStreets.size > 0)
			{
				let keys = Array.from(matchedStreets.keys());
				for (let key of keys)
				{
					let data = matchedStreets.get(key);
					if (key < distance && data.match)
					{
						streetSegment = data.street;
						distance = key
					}
				}
				if (!streetSegment)
				{
					streetSegment = matchedStreets.get(Math.min(...keys)).street
				}
			}

			return streetSegment;
		}

		function setNearestStreet(stops, streets)
		{
			if (streets.length > 0)
			{
				stops.forEach(function(stop)
				{
					stop.StreetSegment = findStreet(stop, streets);
					if (stop.StreetSegment)
					{
						let stopGeometry = getGeometry(stop),
							closestPoint = self._arcgis.geometryEngine.nearestCoordinate(stop.StreetSegment.geometry, stopGeometry).coordinate,
							line = new self._arcgis.Polyline({
								spatialReference: tf.map.ArcGIS.SpatialReference.WebMercator,
								paths: [[closestPoint.x, closestPoint.y], [stopGeometry.x, stopGeometry.y]]
							});
						stop.streetDistance = self._arcgis.geometryEngine.geodesicLength(line, "meters");
						self._closetStreetDoorToDoorCache.set(stopGeometry.x + "-" + stopGeometry.y, { StreetSegment: stop.StreetSegment, streetDistance: stop.streetDistance });
					}
				});
			}
		}
	};

	StopTool.prototype.getStreetAddressByJunctionStreets = function(junctionStreets)
	{
		var streetName = "",
			streetNames = [];
		// Comment this code as GroupID always 0 for all user added streets.
		// junctionStreets.forEach(function(street)
		// {
		// 	if (!junctionDic[street.attributes.dataModel.GroupID])
		// 	{
		// 		streetNames.push(street.attributes.dataModel.Street);
		// 		junctionDic[street.attributes.dataModel.GroupID] = true;
		// 	}
		// });
		junctionStreets.forEach(function(street) { streetNames.push(street.attributes.dataModel.Street); });
		streetNames.sort(function(a, b)
		{
			return a.toLowerCase().localeCompare(b.toLowerCase());
		});
		streetNames = Array.from(new Set(streetNames));// remove duplicate street names
		streetNames.forEach(function(name)
		{
			streetName = streetName + name + " & ";
		});

		return streetName.slice(0, -2);
	};

	StopTool.prototype.getStopAddressByGeometry = function(geometry)
	{
		return TF.locationToAddress(geometry).then(function(result)
		{
			if (result) return result;
			else { return "unnamed" }
		});
	};

	StopTool.prototype._reverseGeocodeDialogBox = function()
	{
		return tf.promiseBootbox.dialog({
			message: "<p id='checkboxsinglepointmoveparcel'>Unable to find address for this location</p>",
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

	StopTool.prototype._getFillPatternValueBySetting = function(fillSettingStr)
	{
		var opacity = 0;
		switch (fillSettingStr)
		{
			case "None":
				opacity = 0;
				break;
			case "Semi":
				opacity = 0.3;
				break;
			case "Solid":
				opacity = 1;
				break;
		}
		return opacity;
	};

	StopTool.prototype._getUturnPolicy = function(uTurnPolicy)
	{
		var policy = null;
		switch (uTurnPolicy)
		{
			case 0:
				policy = "allow-backtrack";
				break;
			case 1:
				policy = "at-dead-ends-only";
				break;
			case 2:
				policy = "at-dead-ends-and-intersections";
				break;
			case 3:
				policy = "no-backtrack";
				break;
		}
		return policy;
	};

	/**
	* resolve data geometry by data xcoord and ycoord, or address
	* data like :	[{ x: -73.888011, y: 42.817926 }, { x: -73.888175, y: 42.817685 }, { address: "1180 Fernwood Dr" }, { address: "1291 Hempstead Rd" } ]
	*/
	StopTool.prototype.createStopGeometry = function(data, param)
	{
		var self = this;
		var allPromise = [];
		var stopResults = [];
		data.forEach(function(stop)
		{
			var promise = Promise.resolve(false);
			if (stop.x && stop.y)
			{
				var geometry = TF.xyToGeometry(stop.x, stop.y);
				stop.geometry = geometry;
				promise = TF.locationToAddress(geometry, param).then(function(result)
				{
					if (result) return [{ address: result.Street }];
					return [];
				});
			}
			else if (stop.address)
			{
				var sourceType = 'address point';
				if (!param || param.GeocodeType === TF.Helper.TripHelper.GeocodeSource.mapStreet.value)
				{
					sourceType = 'street address range';
				}
				promise = tf.startup.loadArcgisUrls().then(function()
				{
					var params = [
						{ GeoStreet: stop.address, GeoZip: stop.zip, GeoCity: stop.city }
					];
					return TF.Grid.GeocodeTool.geocodeAddresses(sourceType, params).then(function(result)
					{
						return result = result || [];
					});
				});
			}
			allPromise.push(promise);
		});
		return Promise.all(allPromise).then(function(results)
		{
			results.forEach(function(result, i)
			{
				if (result && result.length > 0)
				{
					if (result[0].location)
					{
						data[i].geometry = TF.xyToGeometry(result[0].location.x, result[0].location.y);
					}

					if (result[0].address)
					{
						data[i].street = data[i].street || result[0].address;
						data[i].address = data[i].address || result[0].address;
					}

					data[i].isValid = !!data[i].geometry;
					stopResults.push(data[i]);
				}
				else
				{
					data[i].isValid = false;
					stopResults.push(data[i]);
				}
			});
			return stopResults;
		});
	};

	StopTool.prototype._isPointOnRightOfLine = function(line, point)
	{
		if (!line)
		{
			return false;
		}
		var self = this;
		var mindistance = null, minSeg = null;
		for (var i = 0; i < line.paths[0].length - 1; i++)
		{
			var polyline = new self._arcgis.Polyline({
				spatialReference: { wkid: 102100 },
				paths: [[line.paths[0][i], line.paths[0][i + 1]]]
			});
			var distance = self._arcgis.geometryEngine.distance(polyline, point, "meters");
			if (!mindistance || mindistance > distance)
			{
				mindistance = distance;
				minSeg = polyline;
			}
		}

		var x = point.x, y = point.y,
			x1 = minSeg.paths[0][0][0], y1 = minSeg.paths[0][0][1],
			x2 = minSeg.paths[0][1][0], y2 = minSeg.paths[0][1][1];
		var d = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1);
		if (d > 0) return true;
		return false;
	};

	StopTool.prototype._getPointOnPolylineByDistanceToPoint = function(polyline, distance, fromStartToEnd)
	{
		var self = this;
		var segmentLength = 0,
			currentDifferenceLength = 0;
		polyline = polyline.clone();
		if (!fromStartToEnd) { polyline.paths[0] = polyline.paths[0].reverse(); }
		if (self._arcgis.geometryEngine.geodesicLength(polyline, "meters") <= distance)
		{
			return new self._arcgis.Point({
				type: "point",
				x: polyline.paths[0][0][0],
				y: polyline.paths[0][0][1],
				spatialReference: { wkid: 102100 }
			});
		}
		for (var i = 0; i < polyline.paths[0].length - 1; i++)
		{
			var segment = new self._arcgis.Polyline({
				type: "polyline",
				spatialReference: { wkid: 102100 },
				paths: [[polyline.paths[0][i], polyline.paths[0][i + 1]]]
			});
			// segment.addPath([polyline.paths[0][i], polyline.paths[0][i + 1]]);
			segmentLength = segmentLength + self._arcgis.geometryEngine.geodesicLength(segment, "meters");
			if (segmentLength > distance)
			{
				currentDifferenceLength = distance - (segmentLength - self._arcgis.geometryEngine.geodesicLength(segment, "meters"));
				return self._findPointOnLineByDistance(segment, currentDifferenceLength);
			}
		}
	};

	StopTool.prototype._findPointOnLineByDistance = function(line, distance)
	{
		var self = this;
		var fromPoint = new self._arcgis.Point({ type: "point", x: line.paths[0][0][0], y: line.paths[0][0][1], spatialReference: { wkid: 102100 } });
		var toPoint = new self._arcgis.Point({ type: "point", x: line.paths[0][1][0], y: line.paths[0][1][1], spatialReference: { wkid: 102100 } });
		var length = self._arcgis.geometryEngine.geodesicLength(line, "meters");
		var ratio = distance == 0 || length == 0 ? 0 : (distance / length);
		var point = new self._arcgis.Point({
			type: "point",
			x: (1 - ratio) * fromPoint.x + ratio * toPoint.x,
			y: (1 - ratio) * fromPoint.y + ratio * toPoint.y,
			spatialReference: { wkid: 102100 }
		});
		return point;
	};

	//#region cut overlap boundaries by thiessen polygons
	StopTool.prototype.removeOverlapBoundariesByThiessen = function(stops, currentStops)
	{
		var self = this;
		var _resolve = null;
		var _reject = null;
		var promise = new Promise(function(resolve, reject) { _resolve = resolve; _reject = reject; });
		var graphics = [], ids = "";
		var intersectedStops = self.getIntersectedStops(stops, currentStops);
		var stopsFromExistingTrip = intersectedStops.filter(function(s) { return currentStops.filter(function(c) { return c.id == s.id }).length > 0 });
		if (intersectedStops.length == 0) return Promise.resolve(stops);
		var isIntersect = false;
		stops.forEach(function(stop, i)
		{
			stops.forEach(function(s, j)
			{
				if (i != j)
				{
					if (self._arcgis.geometryEngine.intersects(stop.boundary.geometry, s.boundary.geometry))
					{
						isIntersect = true;
					}
				}
			});
		});
		if (!isIntersect)
		{
			self._removeOverlapFromExistingStops(stops, stopsFromExistingTrip);
			return Promise.resolve(stops);
		}
		stops.forEach(function(stop)
		{
			var graphic = new self._arcgis.Graphic(stop.geometry, null, {});
			graphics.push(graphic);
		});

		self.getThissenPolygonsByTripStops(graphics).then(function(polygons)
		{
			stops.forEach(function(stop)
			{
				polygons.forEach(function(polygon)
				{
					if (self._arcgis.geometryEngine.intersects(stop.geometry, polygon))
					{
						stop.ThissenPolygon = polygon;
						return;
					}
				});
			});
			self.cutStopsByThissenPolygon(stops);
			self._removeOverlapFromExistingStops(stops, stopsFromExistingTrip);
			return _resolve(stops);
		});

		return promise;
	};

	StopTool.prototype._removeOverlapFromExistingStops = function(stops, stopsFromExistingTrip)
	{
		var self = this;
		stops.forEach(function(stop)
		{
			stopsFromExistingTrip.forEach(function(s)
			{
				var geometry = self._arcgis.geometryEngine.difference(stop.boundary.geometry, s.boundary.geometry);
				if (geometry)
				{
					stop.boundary.geometry = geometry;
				}
			});
			stop.boundary.geometry = self.drawTool._cutResultHandler(stop.boundary.geometry, stop.geometry);
		});
	}
	StopTool.prototype.getIdString = function(results)
	{
		var ids = "OBJECTID in (";
		results.addFeatureResults.forEach(function(result)
		{
			ids = ids + result.objectId + ",";
		});
		ids = ids.substring(0, ids.length - 1);
		return ids + ")";
	}
	StopTool.prototype.getThissenPolygonsByTripStops = function(tripStops)
	{
		var self = this;
		var _resolve = null;
		var _reject = null;
		var promise = new Promise(function(resolve, reject) { _resolve = resolve; _reject = reject; });
		var inFeatures = new tf.map.ArcGIS.FeatureSet();
		inFeatures.features = tripStops;
		var params = { "in_features": inFeatures };
		self.generateThissenProcessor.submitJob(params).then(function(jobInfo)
		{
			var jobid = jobInfo.jobId;
			self.generateThissenProcessor.waitForJobCompletion(jobid, {}).then(function(res)
			{
				gpJobComplete(res)
			})
		})

		function gpJobComplete(result)
		{
			var jobId = result.jobId;
			var resultParamUrl = "out_feature_class";
			var polygons = [];
			self.generateThissenProcessor.getResultData(jobId, resultParamUrl).then(function(results)
			{
				results.value.features.forEach(function(feature)
				{
					polygons.push(feature.geometry);
				});
				return _resolve(polygons);
			});
		}
		return promise;
	}
	StopTool.prototype.getIntersectedStops = function(stops, currentStops)
	{
		var self = this, intersectedStops = [];

		stops.forEach(function(stop, i)
		{
			if (stop.boundary.BdyType == 0) return;
			var intersectsWithAnyStop = false;
			currentStops.forEach(function(cStop)
			{
				if (cStop.boundary && cStop.boundary.geometry &&
					self._arcgis.geometryEngine.intersects(stop.boundary.geometry, cStop.boundary.geometry))
				{
					intersectedStops.push(cStop);
					intersectsWithAnyStop = true;
				}
			});
			stops.forEach(function(cStop, j)
			{
				if (cStop.boundary && cStop.boundary.geometry && (cStop.id != stop.id || i != j) &&
					self._arcgis.geometryEngine.intersects(stop.boundary.geometry, cStop.boundary.geometry))
				{
					intersectsWithAnyStop = true;
				}
			});
			if (intersectsWithAnyStop) intersectedStops.push(stop);
		});
		intersectedStops = Enumerable.From(intersectedStops).Distinct().ToArray();
		return intersectedStops;
	}
	StopTool.prototype.cutStopsByThissenPolygon = function(stops)
	{
		var self = this;
		// stops.forEach(function(stop)
		// {
		// 	var graphic = new self._arcgis.Graphic(stop.boundary.geometry, new self._arcgis.SimpleFillSymbol().setColor("green"));
		// 	self._map.graphics.add(graphic);
		// })
		stops.forEach(function(stop, i)
		{
			stops.forEach(function(s, j)
			{
				if (i != j)
				{
					var g1 = new self._arcgis.Polygon({
						spatialReference: { wkid: 102100 },
						rings: stop.boundary.geometry.rings
					});
					var g2 = new self._arcgis.Polygon({
						spatialReference: { wkid: 102100 },
						rings: s.boundary.geometry.rings
					});
					if (self._arcgis.geometryEngine.intersects(g1, g2))
					{
						var partNotInIntersection = self._arcgis.geometryEngine.difference(g1, g2);
						if (partNotInIntersection && partNotInIntersection.type == "polygon")
						{
							var intersection = self._arcgis.geometryEngine.difference(g1, partNotInIntersection);
							if (intersection && intersection.type == "polygon")
							{
								var intersectionNotInThissen = self._arcgis.geometryEngine.difference(intersection, stop.ThissenPolygon);
								if (intersectionNotInThissen && intersectionNotInThissen.type == "polygon")
								{
									var stopBoundary = self._arcgis.geometryEngine.difference(stop.boundary.geometry, intersectionNotInThissen);
									if (stopBoundary.length > 1)
									{
										stopBoundary = self._arcgis.geometryEngine.union(stopBoundary);
									}
									if (stopBoundary && stopBoundary.type == "polygon")
									{
										stop.boundary.geometry = stopBoundary;
										//var graphic = new self._arcgis.Graphic(stop.boundary.geometry, new self._arcgis.SimpleFillSymbol().setColor("green"));
										//self._map.graphics.add(graphic);
									}
								}

							}
						}

					}

				}

			})
		})
	}
	//#endregion

	// #region get corner stops at junction
	StopTool.prototype.initStopControlOnJunction = function(stop, map)
	{
		var self = this;
		var promise = self.viewModel._viewModal.getJunctionStreetOnPoint(stop.geometry);
		promise.then(function(junctionStreets)
		{
			if (junctionStreets && junctionStreets.length > 0)
			{
				self.editModal.obShowStopLocationMap(true);
				var layers = self._initStopLocationMapLayers(map);
				var pointGraphic = new tf.map.ArcGIS.Graphic({
					geometry: stop.geometry,
					attributes: {
						stop: {
							"address": stop.Street,
							"geometry": stop.geometry
						}
					}
				});
				layers[0].add(pointGraphic);
				pointGraphic.attributes.stop = { geometry: pointGraphic.geometry, address: stop.Street }
				self.createStopControlOnJunction(pointGraphic, junctionStreets, layers[0], map, layers[1]);
			} else
			{
				self.editModal.obShowStopLocationMap(false);
			}
		});
	}
	StopTool.prototype.initStopInfoControlOnJunction = function(stop, map)
	{
		var self = this;
		var junctionOffsetPromise = self.viewModel._viewModal.getJunctionPointsInBuffer(stop.geometry, self.pointToJunctionDistance + 2);
		junctionOffsetPromise.then(function(nearbyJunctions)
		{
			if (!nearbyJunctions) return;
			var nearbyJunction = nearbyJunctions[0];
			if (nearbyJunction && nearbyJunction.point)
			{
				self.nearbyJunctionPoint = nearbyJunction.point;
				var streetOffsetPromise = self.findClosestLocationOnStreet({ geometry: stop.geometry });
				streetOffsetPromise.then(function(result)
				{
					if (result && self.offsetDistance - 1 < result.distance && result.distance < self.offsetDistance + 1)
					{
						_initStopControl(nearbyJunction, result);
					} else
					{
						secondCheck(nearbyJunction, result);
					}
				});
			}
			else
			{
				self.editModal.obShowStopLocationMap(false);
			}
		});
		function secondCheck(nearbyJunction, result)
		{
			var attr = { attributes: { dataModel: { id: result.street.OBJECTID, Street: result.street.Street } } }
			var secondClosestStreet = self._getSecondClosestStreet(stop.geometry, attr, nearbyJunction.streets);
			if (secondClosestStreet)
			{
				var closetVertex = tf.map.ArcGIS.geometryEngine.nearestCoordinate(secondClosestStreet.geometry, stop.geometry);
				var distanceLine = new tf.map.ArcGIS.Polyline({
					spatialReference: { wkid: 102100 },
					paths: [[[closetVertex.coordinate.x, closetVertex.coordinate.y], [stop.geometry.x, stop.geometry.y]]]
				});
				var distance = tf.map.ArcGIS.geometryEngine.geodesicLength(distanceLine, "meters");
				if (distance <= self.offsetDistance)
				{
					showStopControl(nearbyJunction)
				} else
				{
					self.editModal.obShowStopLocationMap(false);
				}
			} else
			{
				self.editModal.obShowStopLocationMap(false);
			}
		}
		function _initStopControl(nearbyJunction, result)
		{
			var line = new tf.map.ArcGIS.Polyline({ paths: [[stop.geometry.x, stop.geometry.y], [nearbyJunction.point.x, nearbyJunction.point.y]], spatialReference: { wkid: 102100 } });
			self.editModal.isJunction(isSame(nearbyJunction.point, stop.geometry));
			if (!isSame(nearbyJunction.point, stop.geometry)
				&& (Math.abs(result.distance - self.offsetDistance) >= 1 ||
					Math.abs(tf.map.ArcGIS.geometryEngine.geodesicLength(line, "meters") - self.pointToJunctionDistance) >= 2))
			{
				secondCheck(nearbyJunction, result);

			} else
			{
				showStopControl(nearbyJunction)
			}
		}
		function showStopControl(nearbyJunction)
		{
			self.editModal.obShowStopLocationMap(true);
			self.editModal.isJunction(isSame(nearbyJunction.point, stop.geometry));
			var layers = self._initStopLocationMapLayers(map);
			var pointGraphic = new tf.map.ArcGIS.Graphic({
				geometry: nearbyJunction.point,
				attributes: {
					stop: {
						"address": self.getStreetAddressByJunctionStreets(nearbyJunction.streets),//stop.Street,
						"geometry": nearbyJunction.point
					}
				}
			});
			layers[0].add(pointGraphic);
			//self.viewModel.drawTool._newTripStopGraphic = pointGraphic;
			var currentStopGraphic = null;
			if (nearbyJunction && stop.geometry.x.toFixed(4) != nearbyJunction.point.x.toFixed(4) && stop.geometry.y.toFixed(4) != nearbyJunction.point.y.toFixed(4))
			{
				var currentGeom = new self._arcgis.Point({ x: stop.geometry.x.toFixed(4), y: stop.geometry.y.toFixed(4), spatialReference: { wkid: 102100 } })
				currentStopGraphic = new self._arcgis.Graphic(currentGeom, null, { stop: { geometry: currentGeom, address: stop.Street } });
				layers[0].add(currentStopGraphic);
			}
			self.createStopControlOnJunction(pointGraphic, nearbyJunction.streets, layers[0], map, layers[1], currentStopGraphic, stop.OpenType == 'View');
		}

	};

	function isSame(point1, point2)
	{
		return point1.x.toFixed(4) == point2.x.toFixed(4) && point1.y.toFixed(4) == point2.y.toFixed(4);
	}


	StopTool.prototype.mouseMoveEventOnJunctionMap = function(e, map)
	{
		var self = this;
		var p1 = map.mapView.toMap({ x: e.x - 12, y: e.y + 12 });
		var p2 = map.mapView.toMap({ x: e.x + 12, y: e.y - 12 });
		var extent = new self._arcgis.Extent({ xmin: p1.x, ymin: p1.y, xmax: p2.x, ymax: p2.y, spatialReference: map.mapView.spatialReference })
		$(".stopLocationMap .esri-view-surface").css('cursor', 'default');
		map.findLayerById("candidateRoutingStopLayer").graphics.items.forEach(function(graphic)
		{
			if (self._arcgis.geometryEngine.intersects(extent, graphic.geometry))
			{
				$(".stopLocationMap .esri-view-surface").css('cursor', 'pointer');
			}
		})
	}

	StopTool.prototype._initStopLocationMapLayers = function(map)
	{
		var self = this, layers = [];
		var streetLayer = map.findLayerById("candidateRoutingStreetLayer");
		if (!streetLayer)
		{
			streetLayer = new self._arcgis.GraphicsLayer({
				"id": "candidateRoutingStreetLayer"
			});
			//map.addLayer(streetLayer);
			layers.push(streetLayer);
		}
		var stopLayer = map.findLayerById("candidateRoutingStopLayer");
		if (!stopLayer)
		{
			stopLayer = new self._arcgis.GraphicsLayer({
				"id": "candidateRoutingStopLayer"
			});
			//map.addLayer(stopLayer);
			layers.push(stopLayer);
		}
		map.addMany(layers);
		return [stopLayer, streetLayer];
	}
	StopTool.prototype._getNearbyJunction = function(point)
	{
		var self = this;
		var buffer = self._arcgis.geometryEngine.geodesicBuffer(point, 20, "meters");
		var junction = null, junctions = [];
		for (var i = 0; i < self._map.findLayerById("junctionFeatureLayer").graphics.length; i++)
		{
			var graphic = self._map.findLayerById("junctionFeatureLayer").graphics[i];
			if (self._arcgis.geometryEngine.intersects(buffer, graphic.geometry))
			{
				junctions.push(graphic.geometry);
			}
		}

		var mindistance = Number.MAX_VALUE;
		junctions.forEach(function(j)
		{
			var distance = self._arcgis.geometryEngine.distance(point, j, "meters");
			if (distance < mindistance)
			{
				mindistance = distance;
				junction = j;
			}
		});
		return junction;
	}
	StopTool.prototype.createStopControlOnJunction = function(junctionGraphic, streets, layer, map, streetLayer, currentStopGraphic, disableEdit)
	{
		var self = this;
		refreshCandidateGraphics();
		junctionGraphic.symbol = self.getCandidateGraphicActiveSymbol();
		if (currentStopGraphic &&
			currentStopGraphic.geometry.x != junctionGraphic.geometry.x &&
			currentStopGraphic.geometry.y != junctionGraphic.geometry.y)
		{
			junctionGraphic.symbol = self.getCandidateGraphicSymbol();
			currentStopGraphic.symbol = self.getCandidateGraphicActiveSymbol();
		}

		function refreshCandidateGraphics()
		{
			self.candidateGraphics = self._drawStopControlOnJunction(junctionGraphic.geometry, streets, layer, map, currentStopGraphic);
			self._drawStreetsAndLabelOnJunction(junctionGraphic.geometry, streets, streetLayer);
			self.candidateGraphics = self.candidateGraphics.concat([junctionGraphic]);
			if (currentStopGraphic) self.candidateGraphics = self.candidateGraphics.concat([currentStopGraphic]);
		}

		if (!disableEdit)
		{
			this.bindCandidateStopClickEvent(layer, map);
		}
	};

	StopTool.prototype.bindCandidateStopClickEvent = function(layer, map)
	{
		var self = this;
		//var layerId = layer.id;
		//if (this.candidateStopClickEvent) { this.candidateStopClickEvent.remove() }
		this.candidateStopClickEvent = map.mapView.on("click", function(event)
		{
			var graphic;
			// if (!event.graphic)
			// {
			// 	return;
			// }
			// if (event.graphic && event.graphic.layer.id == layerId && !event.graphic.attributes.dataModel)
			// {
			// 	graphic = event.graphic;

			// } else
			// {
			// use event extent to check the clicked graphic, because sometimes the stop graphic is covered by snap symbol
			var buffer = self._arcgis.geometryEngine.geodesicBuffer(event.mapPoint, 0.7, "meters");
			// var tolerance = 12;
			// var p1 = self._map.toMap(screenPoint.offset(-tolerance, tolerance));
			// var p2 = self._map.toMap(screenPoint.offset(tolerance, -tolerance));
			// var extent = new tf.map.ArcGIS.Extent(p1.x, p1.y, p2.x, p2.y, self._map.spatialReference);
			self.candidateGraphics.forEach(function(g)
			{
				if (self._arcgis.geometryEngine.intersects(buffer, g.geometry))
				{
					graphic = g;
				}
			});
			//}
			if (graphic)
			{
				self.candidateGraphics.forEach(function(g)
				{
					g.symbol = self.getCandidateGraphicSymbol();
				});
				self.editModal.isJunction(isSame(self.nearbyJunctionPoint, graphic.attributes.stop.geometry));
				graphic.symbol = self.getCandidateGraphicActiveSymbol();
				self.editModal.changeLocation(graphic.attributes.stop.geometry, graphic.attributes.stop.address);
			}
		});
	};

	StopTool.prototype.getCandidateGraphicActiveSymbol = function()
	{
		var symbol = this.getCandidateGraphicSymbol();
		symbol.size = 28;
		return symbol;
	};

	StopTool.prototype.getCandidateGraphicSymbol = function()
	{
		var symbol = new tf.map.ArcGIS.SimpleMarkerSymbol();
		symbol.color = new tf.map.ArcGIS.Color([255, 255, 255]);
		symbol.size = 12;
		return symbol;
	};

	StopTool.prototype._drawStopControlOnJunction = function(junctionPoint, streets, layer, map, currentStopGraphic)
	{
		var self = this;

		(this.candidateGraphics || []).forEach(function(g)
		{
			if (g.geometry.x != junctionPoint.x && g.geometry.y != junctionPoint.y)
			{
				map.findLayerById("candidateRoutingStopLayer").remove(g);
			}
		});

		var candidateStops = this.getAllCandidateStopsAtJunction(junctionPoint, streets, self.insetDistance, self.offsetDistance);
		var candidateStopsOnMap = this.getAllCandidateStopsAtJunction(junctionPoint, streets, self.insetDistanceOnPreview, self.offsetDistanceOnPreview);
		candidateStopsOnMap = candidateStopsOnMap.filter(function(csm) { return candidateStops.filter(function(cs) { return cs.id == csm.id }).length > 0 });
		var symbol = self.getCandidateGraphicSymbol();
		self.candidateGraphics = [];

		candidateStops.forEach(function(stop, i)
		{
			if ((currentStopGraphic && !self._isWithinGeodesicTolerance(stop.geometry, currentStopGraphic.geometry)) || (!currentStopGraphic))
			{
				var point = new self._arcgis.Point(
					{ x: candidateStopsOnMap[i].geometry.x, y: candidateStopsOnMap[i].geometry.y, spatialReference: { wkid: 102100 } })
				var graphic = new tf.map.ArcGIS.Graphic({
					geometry: point,
					symbol: symbol, attributes: { stop: stop }
				});
				self.candidateGraphics.push(graphic);
				layer.add(graphic);
			}
			else if (currentStopGraphic && self._isWithinGeodesicTolerance(stop.geometry, currentStopGraphic.geometry))
			{
				var point = new self._arcgis.Point(
					{ x: candidateStopsOnMap[i].geometry.x, y: candidateStopsOnMap[i].geometry.y, spatialReference: { wkid: 102100 } })
				currentStopGraphic.geometry = point;
			}
		});
		self._zoomToExtent(map, currentStopGraphic ? currentStopGraphic : { geometry: junctionPoint });
		return self.candidateGraphics;
	};

	StopTool.prototype._isWithinGeodesicTolerance = function(targetPoint, currentPoint)
	{
		var tolerance = 1;//unit:metrs(geodesic)
		var line = new tf.map.ArcGIS.Polyline({
			paths: [[targetPoint.x, targetPoint.y], [currentPoint.x, currentPoint.y]],
			spatialReference: { wkid: 102100 }
		});
		return tf.map.ArcGIS.geometryEngine.geodesicLength(line, "meters") <= tolerance;
	}

	StopTool.prototype._zoomToExtent = function(map, currentStopGraphic)
	{
		var self = this;
		if (self.candidateGraphics.length > 0)
		{
			var graphics = currentStopGraphic ? self.candidateGraphics.concat([currentStopGraphic]) : self.candidateGraphics;
			var points = graphics.map(function(g)
			{
				return [g.geometry.x, g.geometry.y];
			})
			var multiPoint = new self._arcgis.Multipoint({ points: points, spatialReference: { wkid: 102100 } });
			var extent = multiPoint.extent;
			var extentBuffer = extent.expand(2);
			map.mapView.extent = extentBuffer;
			// self.candidateGraphics.forEach(function(graphic)
			// {
			// 	$(graphic.getNode()).css("cursor", "pointer");
			// })
		} else
		{
			var buffer = new self._arcgis.geometryEngine.geodesicBuffer(currentStopGraphic.geometry, 3, "meters");
			map.mapView.extent = buffer.extent;
			map.mapView.center = currentStopGraphic.geometry;
		}

	}
	StopTool.prototype._drawStreetsAndLabelOnJunction = function(junctionPoint, streets, layer)
	{
		var self = this;
		var font = new self._arcgis.Font("11px");
		var streetNamesDic = {};
		streets.forEach(function(street)
		{
			var graphic = new self._arcgis.Graphic({ geometry: street.geometry, symbol: new self._arcgis.SimpleLineSymbol() });
			layer.add(graphic);
			if (!streetNamesDic[street.attributes.dataModel.Street])
			{
				var insetPoint = self._getInsetPointOnLine(junctionPoint, street.geometry.clone(), 5);
				if (insetPoint)
				{
					var angle = Math.atan2(insetPoint.y - junctionPoint.y, insetPoint.x - junctionPoint.x) * 180 / Math.PI;
					if (angle < -90 && angle > -180) angle = -180 - angle;
					else if (angle < 0 && angle >= -90) angle = -angle;
					else if (angle >= 0 && angle <= 90) angle = -angle;
					else if (angle > 90 && angle <= 180) angle = 180 - angle;
					var labelSymbol = new self._arcgis.TextSymbol({
						color: new self._arcgis.Color("black"),
						text: street.attributes.dataModel.Street,
						font: font,
						angle: angle,
						verticalAlignment: "middle"
					});
					var labelGraphic = new self._arcgis.Graphic({ geometry: insetPoint, symbol: labelSymbol });
					layer.add(labelGraphic);
					streetNamesDic[street.attributes.dataModel.Street] = true;
				}

			}

		})
	}
	StopTool.prototype.focusOnActiveCandidateGraphics = function()
	{
		var self = this, activeSize = this.getCandidateGraphicActiveSymbol().size;
		this.candidateGraphics.forEach(function(g)
		{
			if (g.symbol.size != activeSize)
			{
				self.editModal.map.findLayerById("candidateRoutingStopLayer").remove(g);
				//g.layer.remove(g);
			}
		});
		//this.candidateStopClickEvent && this.candidateStopClickEvent.remove();
	};

	StopTool.prototype.clearCandidateGraphics = function()
	{
		var self = this;
		(this.candidateGraphics || []).forEach(function(g)
		{
			self.editModal.map.findLayerById("candidateRoutingStopLayer").remove(g);
			//g.layer.remove(g);
		});

		//this.candidateStopClickEvent && this.candidateStopClickEvent.remove();
		if (self.editModal.map && self.editModal.map.findLayerById("candidateRoutingStreetLayer"))
		{
			self.editModal.map.findLayerById("candidateRoutingStreetLayer").removeAll();
		}
		if (self.editModal.map && self.editModal.map.findLayerById("candidateRoutingStopLayer"))
		{
			self.editModal.map.findLayerById("candidateRoutingStopLayer").removeAll();
		}
		if (self.layerHoverEvent)
		{
			self.layerHoverEvent.remove();
		}
	};

	StopTool.prototype.getAllCandidateStopsAtJunction = function(junctionPoint, Streets, insetDistance, offsetDistance)
	{
		var self = this;
		var candidateStops = [];
		Streets.forEach(function(street, i)
		{
			var insetPoint = self._getInsetPointOnLine(junctionPoint, street.geometry, insetDistance);
			if (insetPoint)
			{
				var buffer = self._arcgis.geometryEngine.geodesicBuffer(insetPoint, offsetDistance, "meters");
				var segment = new self._arcgis.Polyline({
					type: "polyline",
					spatialReference: { wkid: 102100 },
					paths: [[[junctionPoint.x, junctionPoint.y], [insetPoint.x, insetPoint.y]]]
				});

				var rotateSegment1 = self._arcgis.geometryEngine.rotate(segment, 90, insetPoint);
				var rotateSegment2 = self._arcgis.geometryEngine.rotate(segment, -90, insetPoint);
				var points = [];
				[rotateSegment1, rotateSegment2].forEach(function(rotateSegment)
				{
					var segmentIntersection = self._arcgis.geometryEngine.intersect(buffer, rotateSegment);
					var p = null;
					if (segmentIntersection.paths[0][0][0] == insetPoint.x && segmentIntersection.paths[0][0][1] == insetPoint.y)
					{
						p = new self._arcgis.Point({ x: segmentIntersection.paths[0][1][0], y: segmentIntersection.paths[0][1][1], spatialReference: { wkid: 102100 } });
					} else
					{
						p = new self._arcgis.Point({ x: segmentIntersection.paths[0][0][0], y: segmentIntersection.paths[0][0][1], spatialReference: { wkid: 102100 } });
					}
					points.push(p);
				})

				points.forEach(function(stop, j)
				{
					var secondClosestStreet = self._getSecondClosestStreet(stop, street, Streets);
					var bearingString = self._getBearingString(junctionPoint, stop);
					var address = street.attributes.dataModel.Street + " & " + secondClosestStreet.attributes.dataModel.Street + " (" + bearingString + ")";
					if (street.attributes.dataModel.Street == secondClosestStreet.attributes.dataModel.Street)
					{
						address = secondClosestStreet.attributes.dataModel.Street + " (" + bearingString + ")";
					}
					candidateStops.push({ "geometry": stop, "address": address, id: i + "-" + j });
				});
			}
		});
		return candidateStops;
	};
	StopTool.prototype._getInsetPointOnLine = function(junctionPoint, streetGeom, insetDistance)
	{
		var self = this;
		var segmentDistance = self._arcgis.geometryEngine.geodesicLength(streetGeom, "meters");
		if (insetDistance >= segmentDistance) return false;
		var fromStartToEnd = false;
		if (junctionPoint.x == streetGeom.paths[0][0][0] && junctionPoint.y == streetGeom.paths[0][0][1])
		{
			fromStartToEnd = true;
		}
		return self._getPointOnPolylineByDistanceToPoint(streetGeom, insetDistance, fromStartToEnd);
	};

	StopTool.prototype._getSecondClosestStreet = function(point, firstClosestStreet, allStreets)
	{
		var self = this;
		var otherStreets = findOtherBy("Street");
		if (otherStreets.length == 0)
		{
			otherStreets = findOtherBy("id");
		}
		var minDistance = Number.MAX_VALUE, minDistanceStreet = null;
		otherStreets.forEach(function(street)
		{
			var distance = self._arcgis.geometryEngine.distance(point, street.geometry, "meters");
			if (distance < minDistance) { minDistance = distance; minDistanceStreet = street; }
		});
		function findOtherBy(fieldName)
		{
			return allStreets.filter(function(street) { return street.attributes.dataModel[fieldName] != firstClosestStreet.attributes.dataModel[fieldName]; });
		}
		return minDistanceStreet;
	};

	StopTool.prototype._getBearingString = function(origin, stop)
	{
		var b = Math.atan2(stop.y - origin.y, stop.x - origin.x) * 180 / Math.PI;
		var bearing = "";
		switch (true)
		{
			case (b >= 0 && b < 22.5):
			case (b > -22.5 && b < 0):
				bearing = "E";
				break;
			case (b >= 22.5 && b < 67.5):
				bearing = "NE";
				break;
			case (b >= 67.5 && b < 112.5):
				bearing = "N";
				break;
			case (b >= 112.5 && b < 157.5):
				bearing = "NW";
				break;
			case (b >= 157.5 && b <= 180):
			case (b <= -157.5 && b > -180):
				bearing = "W";
				break;
			case (b <= -112.5 && b > -157.5):
				bearing = "SW";
				break;
			case (b <= -67.5 && b > -112.5):
				bearing = "S";
				break;
			case (b <= -22.5 && b > -67.5):
				bearing = "SE";
				break;
		}
		return bearing;
	};
	// #endregion

	StopTool.prototype.dispose = function()
	{
		tfdispose(this)
	}
})();
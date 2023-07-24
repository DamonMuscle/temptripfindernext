; (function()
{
	createNamespace('TF.RoutingMap.RoutingPalette').GeoLinkTool = GeoLinkTool

	function mathRound(value, decimal)
	{
		decimal = decimal || 0;
		let factor = Math.pow(10, decimal);
		return Math.round(value * factor) / factor;
	}

	function GeoLinkTool(tripStopDataModel)
	{
		this.dataModel = tripStopDataModel;
		this.precision = 0;
	}

	GeoLinkTool.prototype._isIntersectWithOtherPaths = function(oldItem, newItem)
	{
		let oldG = new tf.map.ArcGIS.Polyline({ spatialReference: 102100 });
		oldG.paths = oldItem.path.paths;
		let newG = new tf.map.ArcGIS.Polyline({ spatialReference: 102100 });
		newG.paths = newItem.path.paths;
		let diffG = tf.map.ArcGIS.geometryEngine.difference(oldG, newG);
		let intersectStop = this.dataModel.dataModel.trips.some(trip =>
		{
			return trip.TripStops.some(tripStop =>
			{
				if (tripStop.id !== oldItem.id && tripStop.path && tripStop.path.geometry && tripStop.path.geometry.paths)
				{
					let intersections = tf.map.ArcGIS.geometryEngine.intersect(tripStop.path.geometry, diffG);
					return intersections && intersections.paths && intersections.paths.length > 0 && intersections.paths[0].length > 1;

				}
			});
		})
		return intersectStop;
	}

	GeoLinkTool.prototype.getGeoLinkedData = function(data)
	{
		var self = this, promises = [];
		var geoLinkedData = [];
		if (data.changeType == "path")
		{
			if (!data.originalData[0] || !data.originalData[0].path || !data.newData[0].path) return Promise.resolve(data);

			data.originalData.forEach(function(oldItem, index)
			{
				if (self._isIntersectWithOtherPaths(oldItem, data.newData[index]))
				{
					var geoLinkedDataOneStop = [];
					promises.push(self._getIdenticalPaths(oldItem, data.newData[index]).then(function(changedPathsDic)
					{
						for (var tripStopId in changedPathsDic)
						{
							geoLinkedDataOneStop.push({
								TripStopId: tripStopId,
								linkedPathSegments: changedPathsDic[tripStopId]
							})
						}
						geoLinkedData.push(geoLinkedDataOneStop)
					}));
				}

			});
			return Promise.all(promises).then(function()
			{
				data.geoLinkedData = geoLinkedData;
				return Promise.resolve(data);
			})
		}
		else if (data.changeType == "move")
		{
			geoLinkedData.push(self._getIdenticalMoveStops(data.from, data.to, data.stops, data.tripId));
			data.geoLinkedData = geoLinkedData;
			return Promise.resolve(data);
		}
		else if (data.changeType == "stop")
		{
			data.originalData.forEach(function(oldItem, index)
			{
				var geoLinkedD = null;
				if (oldItem.x != data.newData[index].x || oldItem.y != data.newData[index].y)
				{
					var newItem = data.newData[index];
					geoLinkedData.push(self._getIdenticalStops(oldItem, newItem));
				} else
				{
					geoLinkedData.push(self._getIdenticalBoundaries(oldItem));
				}
			});
			data.geoLinkedData = geoLinkedData;
			return Promise.resolve(data);
		}
		else if (data.changeType == "create")
		{
			geoLinkedData = [self._getIdenticalStopsCreate(data)];
			data.geoLinkedData = geoLinkedData;
			return Promise.resolve(data);
		}
		else if (data.changeType == "delete")
		{
			geoLinkedData.push(self._getIdenticalDeleteStops(data));
			data.geoLinkedData = geoLinkedData;
			return Promise.resolve(data);
		}
		else
		{
			return Promise.resolve(data);
		}
	}

	GeoLinkTool.prototype.syncGeoLinkedData = function(syncEditTripStopsData, ids)
	{
		var self = this, routingDataModel = self.dataModel.dataModel;
		syncEditTripStopsData.geoLinkedData.forEach(function(item, i)
		{
			item.forEach(function(data)
			{
				if (data && ids.indexOf(parseInt(data.TripStopId)) >= 0)
				{
					if (data.type == "tripBoundary")
					{
						var tripStop = $.extend({}, routingDataModel.getFieldTripStopByStopId(data.TripStopId));
						//tripStop.boundary.geometry = TF.cloneGeometry(tripStop.boundary.geometry);
						var newBoundaryGeom = new tf.map.ArcGIS.Polygon({ spatialReference: 102100 });
						newBoundaryGeom.rings = syncEditTripStopsData.newData[i].boundary.rings;

						// push trip to change stack make the trip update and save button on
						var changeStack = routingDataModel.changeDataStack();
						var trip = routingDataModel.getTripById(tripStop.TripId);
						changeStack.unshift(trip);
						changeStack.push(trip);
						routingDataModel.changeDataStack(changeStack);
						// update boundary
						self.dataModel.updateTripBoundary([$.extend({}, tripStop.boundary, { geometry: newBoundaryGeom })], true);
					}
					else if (data.type == "sequenceChange")
					{
						var tripStop = $.extend({}, routingDataModel.getFieldTripStopByStopId(data.TripStopId));
						self.dataModel._reorderTripStopSequenceInOneTrip(tripStop, data.newSequence, true);
						var trip = routingDataModel.getTripById(tripStop.TripId);
						routingDataModel.updateTrip(trip);
					}
					else if (data.type == "tripStopDelete")
					{
						var tripStop = $.extend({}, routingDataModel.getFieldTripStopByStopId(data.TripStopId));
						self.dataModel.delete(tripStop, false, true);
					}
					else if (data.type == "tripStop")
					{
						var tripStop = $.extend({}, routingDataModel.getFieldTripStopByStopId(data.TripStopId)),
							newStopGeom = new tf.map.ArcGIS.Point({ x: syncEditTripStopsData.newData[i].x, y: syncEditTripStopsData.newData[i].y, spatialReference: 102100 });
						tripStop.geometry = newStopGeom;
						tripStop.XCoord = newStopGeom.longitude;
						tripStop.YCoord = newStopGeom.latitude;
						if (syncEditTripStopsData.originalData[i].boundary == null)
						{
							if (routingDataModel.getGeoLinkSetting())
							{
								var newBoundaryGeom = new tf.map.ArcGIS.Polygon({ spatialReference: 102100 });
								newBoundaryGeom.rings = syncEditTripStopsData.newData[i].boundary.rings;
								tripStop.boundary.geometry = newBoundaryGeom;
							}
						}
						self.dataModel.update([tripStop], true);
					}
					else if (data.type == "tripStopCreate")
					{
						// var stop = routingDataModel.getFieldTripStopByStopId(syncEditTripStopsData.createStop.id);
						var newStop = self._copyTripStop(syncEditTripStopsData.createStop);
						newStop.TripId = data.TripId;
						newStop.TripStopId = data.TripStopId;
						newStop.id = data.id;
						newStop.boundary.TripId = data.TripId;
						newStop.boundary.TripStopId = data.TripStopId;
						self.dataModel.create(newStop, false, data.Sequence, null, true);
					}
					else
					{
						var tripStop = $.extend({}, routingDataModel.getFieldTripStopByStopId(data.TripStopId));
						tripStop.path.geometry = TF.cloneGeometry(tripStop.path.geometry);
						if (data.linkedPathSegments)
						{
							data.linkedPathSegments.forEach(function(lp)
							{
								tripStop.path.geometry = self._replaceOldPathWithNew(tripStop.path.geometry, lp.oldPathSegmentGeometry, lp.newPathSegmentGeometry);
							})
						}
						self.dataModel.updatePath(tripStop, true);
					}
				}
			})

		})
	}

	GeoLinkTool.prototype._copyTripStop = function(stop)
	{
		return {
			StreetSegment: stop.StreetSegment,
			Street: stop.Street,
			City: stop.City,
			OpenType: stop.OpenType,
			vehicleCurbApproach: stop.vehicleCurbApproach,
			walkoutBuffer: stop.walkoutBuffer,
			walkoutDistance: stop.walkoutDistance,
			XCoord: stop.XCoord,
			YCoord: stop.YCoord,
			ProhibitCrosser: stop.ProhibitCrosser,
			geometry: stop.geometry ? TF.cloneGeometry(stop.geometry) : new tf.map.ArcGIS.Point({ x: stop.x, y: stop.y, spatialReference: { wkid: 102100 } }),
			boundary: {
				BdyType: stop.boundary.BdyType,
				type: "tripBoundary",
				geometry: stop.boundary.geometry ? TF.cloneGeometry(stop.boundary.geometry) : new tf.map.ArcGIS.Polygon({ rings: stop.boundary.rings, spatialReference: stop.boundary.spatialReference })
			}
		}
	}

	GeoLinkTool.prototype.getEditGeoLinkedData = function(data)
	{
		if (!data.geoLinkedData) return [];
		var self = this, editStops = [];
		if (data.changeType == "move" || data.changeType == "create" || data.changeType == "delete")
		{
			data.geoLinkedData[0].forEach(function(gs)
			{
				var editStop = {
					id: gs.TripStopId,
					name: gs.street,
					tripName: gs.TripId ? self.dataModel.dataModel.getTripById(gs.TripId).Name : ""
				}
				editStops.push(editStop);
			});
		}
		else
		{
			data.originalData.forEach(function(fromD, index)
			{
				var geoLinkedStops = data.geoLinkedData[index];
				if (geoLinkedStops)
				{
					geoLinkedStops.forEach(function(gs)
					{
						var s = self.dataModel.dataModel.getFieldTripStopByStopId(gs.TripStopId);
						var editStop = {
							id: s.id,
							name: s.Street,
							tripName: s.TripId ? self.dataModel.dataModel.getTripById(s.TripId).Name : ""
						}
						if (data.newData[index].boundary)
						{
							var newBoundaryGeom = new tf.map.ArcGIS.Polygon({ spatialReference: 102100 });
							newBoundaryGeom.rings = data.newData[index].boundary.rings;
							editStop.unassignedFrom = self._getUnassignedStudentsCountInBoundary(s.boundary.geometry);
							editStop.assignedFrom = s.Students.length;
							editStop.unassignedTo = self._getUnassignedStudentsCountInBoundary(newBoundaryGeom);
							editStop.assignedTo = self._getAssignedStudentsCountInBoundary(s.Students, newBoundaryGeom);
						}
						editStops.push(editStop);
					})
				}
			})
		}
		return editStops;
	}

	GeoLinkTool.prototype._getUnassignedStudentsCountInBoundary = function(boundaryGeom)
	{
		var self = this, count = 0;
		self.dataModel.dataModel.candidateStudents.forEach(function(student)
		{
			if (tf.map.ArcGIS.geometryEngine.intersects(boundaryGeom, student.geometry))
			{
				count++
			}
		});
		return count;
	}

	GeoLinkTool.prototype._getAssignedStudentsCountInBoundary = function(students, boundaryGeom)
	{
		var self = this, count = 0;
		students.forEach(function(student)
		{
			if (tf.map.ArcGIS.geometryEngine.intersects(boundaryGeom, student.geometry))
			{
				count++
			}
		});
		return count;
	}

	GeoLinkTool.prototype._getIdenticalPaths = function(oldItem, newItem)
	{
		var self = this, promises = [];
		var oldG = new tf.map.ArcGIS.Polyline({ spatialReference: 102100 });
		var newG = new tf.map.ArcGIS.Polyline({ spatialReference: 102100 });
		oldG.paths = oldItem.path.paths;
		newG.paths = newItem.path.paths;

		//var oldGeomLessPrecision = self._reduceGeometryPrecision(oldG)
		//var newGeomLessPrecision = self._reduceGeometryPrecision(newG)
		//var oldGeomDiff = tf.map.ArcGIS.geometryEngine.difference(oldGeomLessPrecision, newGeomLessPrecision)
		var oldGeomDiff = self._getGeometry1DiffSegmentsFromGeometry2(oldG, newG);
		//var newGeomDiff = tf.map.ArcGIS.geometryEngine.difference(newGeomLessPrecision, oldGeomLessPrecision)
		var newGeomDiff = self._getGeometry1DiffSegmentsFromGeometry2(newG, oldG);

		var changedPathsDic = {};
		if (oldGeomDiff || newGeomDiff)
		{
			var oldGeomDiffSegments = oldGeomDiff ? self._convertPolylineTolines(oldGeomDiff) : [];
			var newGeomDiffSegments = newGeomDiff ? self._convertPolylineTolines(newGeomDiff) : [];
			self.dataModel.dataModel.trips.filter(function(trip) { return trip.OpenType == "Edit" }).forEach(function(trip)
			{
				if (trip.TravelScenarioId == oldItem.scenarioId)
				{
					trip.TripStops.forEach(function(tripStop)
					{
						if (tripStop.id != oldItem.id)
						{
							promises.push(self._findIdenticalPathSegs(tripStop, oldGeomDiffSegments, newGeomDiffSegments, changedPathsDic));
						}
					})
				}
			})
		}
		return Promise.all(promises).then(function()
		{
			return Promise.resolve(changedPathsDic);
		})
	}

	GeoLinkTool.prototype._getGeometry1DiffSegmentsFromGeometry2 = function(geometry1, geometry2)
	{
		var self = this, points = [];
		var g1 = tf.map.ArcGIS.geometryEngine.simplify(geometry1);
		if (!g1) return false;
		for (var i = 0; i < g1.paths[0].length - 1; i++)
		{
			var segment = new tf.map.ArcGIS.Polyline({ spatialReference: 102100 });
			var lineCoors = [g1.paths[0][i], g1.paths[0][i + 1]]
			segment.addPath(lineCoors);
			if (!self._isLinesOverlap(geometry2, segment))
			{
				if (points.length == 0)
				{
					points.push(lineCoors);
				} else
				{
					var lastPoint = points[points.length - 1][points[points.length - 1].length - 1];
					if (self._equals(lastPoint, g1.paths[0][i]))
					{
						points[points.length - 1] = points[points.length - 1].concat(lineCoors);
					}
					else
					{
						points.push(lineCoors);
					}
				}
			}
		}
		var g = new tf.map.ArcGIS.Polyline({ spatialReference: 102100 });
		g.paths = points;
		return g;
	}

	GeoLinkTool.prototype._getIdenticalBoundaries = function(oldItem)
	{
		var self = this;
		if (!oldItem.boundary) return [];
		var oldG = new tf.map.ArcGIS.Polygon({ spatialReference: 102100 });
		oldG.rings = oldItem.boundary.rings;
		var oldGeomLessPrecision = self._reduceGeometryPrecision(oldG);

		var identicalBoundaries = [];
		self.dataModel.dataModel.trips.filter(function(trip) { return trip.OpenType == "Edit" }).forEach(function(trip)
		{
			trip.TripStops.forEach(function(tripStop)
			{
				if (tripStop.id != oldItem.id)
				{
					if (self._equals([tripStop.geometry.x, tripStop.geometry.y], [oldItem.x, oldItem.y]) &&
						tf.map.ArcGIS.geometryEngine.equals(oldGeomLessPrecision, self._reduceGeometryPrecision(tripStop.boundary.geometry)))
					{
						identicalBoundaries.push(tripStop.boundary);
					}
				}
			})
		})
		return identicalBoundaries;
	}
	GeoLinkTool.prototype._getIdenticalMoveStops = function(from, to, stops, tripId)
	{
		var self = this, stopCount = 0, identicalMoveStops = [], needMoveStops = [];

		self.dataModel.dataModel.trips.filter(function(trip) { return trip.OpenType == "Edit" }).forEach(function(trip)
		{
			if (trip.id != tripId)
			{
				stopCount = 0;
				needMoveStops = [];
				var changedStops = stops[0].Session + trip.Session == 1 ? stops.slice().reverse() : stops;
				trip.TripStops.forEach(function(tripStop, index)
				{
					changedStops.forEach(function(stop, stopIndex)
					{
						var stopBoundaryGeom = stop.boundary ? (stop.boundary.geometry ? stop.boundary.geometry : new tf.map.ArcGIS.Polygon({ spatialReference: 3857, rings: stop.boundary.rings })) : null;
						if (self._equals([tripStop.geometry.x, tripStop.geometry.y], [stop.x, stop.y]) && self._equalsBoundary(stopBoundaryGeom, tripStop.boundary.geometry))
						{
							if (needMoveStops.length > 0)
							{
								if (needMoveStops[stopIndex - 1] && needMoveStops[stopIndex - 1].Sequence == (tripStop.Sequence - 1))
								{
									needMoveStops.push(tripStop);
									stopCount++;
								}
							}
							else
							{
								needMoveStops.push(tripStop);
								stopCount++;
							}
						}
					});
				});
				if (stopCount == stops.length)
				{
					var _stops = stops[0].Session + trip.Session == 1 ? needMoveStops.slice().reverse() : needMoveStops;
					identicalMoveStops.push({ type: "sequenceChange", street: _stops[from - 1].Street, TripStopId: _stops[from - 1].id, TripId: _stops[from - 1].TripId, newSequence: _stops[to - 1].Sequence })
				}
			}
		});
		return identicalMoveStops;
	}

	GeoLinkTool.prototype._getIdenticalStops = function(oldItem, newItem)
	{
		var self = this, tripId = newItem.tripId, oldG = new tf.map.ArcGIS.Polygon({ spatialReference: 102100 }), newG = new tf.map.ArcGIS.Polygon({ spatialReference: 102100 });
		oldG.rings = oldItem.boundary.rings;
		var oldGeomLessPrecision = self._reduceGeometryPrecision(oldG);
		newG.rings = newItem.boundary.rings;
		var newGeomLessPrecision = self._reduceGeometryPrecision(newG);
		var identicalStops = [];
		self.dataModel.dataModel.trips.filter(function(trip) { return trip.OpenType == "Edit" }).forEach(function(trip)
		{
			if (trip.id != tripId)
			{
				trip.TripStops.forEach(function(tripStop, index)
				{
					var prevStop = trip.TripStops[index - 1], nextStop = trip.TripStops[index + 1];
					var isCurrentStopIdentical = self._isPrevAfterStopsSameByTripSession(trip, newItem, prevStop, nextStop, oldItem.prevStop, oldItem.nextStop);
					if (isCurrentStopIdentical)
					{
						if (!tf.map.ArcGIS.geometryEngine.equals(oldGeomLessPrecision, newGeomLessPrecision))
						{
							oldItem.boundary = null;//Identify the boundary changed when move stop location. Used in syncGeoLinkedData function.
						}
						identicalStops.push({ type: tripStop.type, TripStopId: tripStop.id, TripId: tripStop.TripId, street: tripStop.Street });
					}
				})
			}
		});
		return identicalStops;
	}

	GeoLinkTool.prototype._getIdenticalStopsCreate = function(data)
	{
		var self = this, stops = [];
		self.dataModel.dataModel.trips.filter(function(trip) { return trip.OpenType == "Edit" }).forEach(function(trip)
		{
			if (trip.id != data.tripId)
			{
				for (var i = 0; i < trip.TripStops.length - 1; i++)
				{
					if (self._isPrevAfterStopsSameByTripSession(trip, data.createStop, trip.TripStops[i], trip.TripStops[i + 1], data.prevStop, data.nextStop))
					{
						var stop = {
							TripStopId: TF.createId(),
							street: data.createStop ? data.createStop.Street : "unnamed",
							type: "tripStopCreate",
							Sequence: trip.TripStops[i].Sequence,
							TripId: trip.TripStops[i].TripId,
						}
						stops.push(stop);
					}
				}
			}
		});
		return stops;
	}

	GeoLinkTool.prototype._isPrevAfterStopsSameByTripSession = function(trip1, trip2, stop1Prev, stop1After, stop2Prev, stop2After)
	{
		var self = this;
		var isIdentical = false;
		if (trip1.Session == trip2.Session)
		{
			if (self._isStopSame(stop1Prev, stop2Prev) && self._isStopSame(stop1After, stop2After))
			{
				isIdentical = true;
			}
		}
		else
		{
			if (trip1.Session + trip2.Session == 1)
			{
				if (self._isStopSame(stop1Prev, stop2After) && self._isStopSame(stop1After, stop2Prev))
				{
					isIdentical = true;
				}
			}
		}
		return isIdentical;
	}

	GeoLinkTool.prototype._isStopSame = function(stop1, stop2)
	{
		var self = this;
		if (!stop1 && !stop2) return true;
		if (!stop1 || !stop2) return false;
		if ((!stop1.geometry && (!stop1.x || !stop1.y)) || (!stop2.geometry && (!stop2.x || !stop2.y))) return false
		//if stop point equals
		var stop1Geom = stop1.geometry ? stop1.geometry : new tf.map.ArcGIS.Point({ spatialReference: 102100, x: stop1.x, y: stop1.y });
		var stop2Geom = stop2.geometry ? stop2.geometry : new tf.map.ArcGIS.Point({ spatialReference: 102100, x: stop2.x, y: stop2.y });
		if (!tf.map.ArcGIS.geometryEngine.equals(self._reduceGeometryPrecision(stop1Geom), self._reduceGeometryPrecision(stop2Geom)))
		{
			return false;
		}
		//if stop bounary equals
		var stop1BoundaryGeom = createStopBoundaryGeom(stop1);
		var stop2BoundaryGeom = createStopBoundaryGeom(stop2);
		if (!stop1BoundaryGeom && !stop2BoundaryGeom) return true;
		if (!self._equalsBoundary(self._reduceGeometryPrecision(stop1BoundaryGeom), self._reduceGeometryPrecision(stop2BoundaryGeom)))
		{
			return false;
		}
		return true;

		function createStopBoundaryGeom(stop)
		{
			var stopBoundaryGeom;
			if (stop.boundary)
			{
				if (stop.boundary.geometry)
				{
					stopBoundaryGeom = self._isValidGeometry(stop.boundary.geometry) ? stop.boundary.geometry : null;
				} else
				{
					if (stop.boundary.rings && stop.boundary.rings.length > 0)
					{
						stopBoundaryGeom = new tf.map.ArcGIS.Polygon({ spatialReference: 102100 });
						stopBoundaryGeom.rings = stop.boundary.rings;
					}
				}
			}
			return stopBoundaryGeom;
		}
	}

	GeoLinkTool.prototype._getIdenticalDeleteStops = function(deleteItem)
	{
		var self = this,
			tripId = deleteItem.tripId,
			identicalStops = [];

		self.dataModel.dataModel.trips.filter(function(trip) { return trip.OpenType == "Edit" }).forEach(function(trip)
		{
			if (trip.id != tripId)
			{
				trip.FieldTripStops.forEach(function(tripStop, index)
				{
					var isCurrentStopIdentical = self._isPrevAfterStopsSameByTripSession(trip, deleteItem.deleteStop, trip.FieldTripStops[index - 1], trip.FieldTripStops[index + 1], deleteItem.prevStop, deleteItem.nextStop)

					if (isCurrentStopIdentical)
					{
						identicalStops.push({ type: "tripStopDelete", TripStopId: tripStop.id, TripId: tripStop.TripId, street: tripStop.Street });
					}
				})
			}
		});
		return identicalStops;
	}

	GeoLinkTool.prototype._reduceGeometryPrecision = function(g)
	{
		switch (g.type)
		{
			case 'point':
				var point = new tf.map.ArcGIS.Point({ spatialReference: 102100, x: mathRound(g.x, this.precision), y: mathRound(g.y, this.precision) });
				return point;
			case 'polyline':
				var polyline = new tf.map.ArcGIS.Polyline({ spatialReference: 102100 });
				g.paths.forEach(function(p)
				{
					var path = p.map(point => [mathRound(point[0], this.precision), mathRound(point[1], this.precision)]);
					polyline.addPath(path)
				})
				return polyline
			case 'polygon':
				var polygon = new tf.map.ArcGIS.Polygon({ spatialReference: 102100 })
				g.rings.forEach(function(r)
				{
					var ring = r.map(point => [mathRound(point[0], this.precision), mathRound(point[1], this.precision)]);
					polygon.addRing(ring)
				})
				return polygon
		}
	}

	GeoLinkTool.prototype._convertPolylineTolines = function(polyline)
	{
		return polyline.paths.map(function(path)
		{
			return new tf.map.ArcGIS.Polyline({ spatialReference: 102100 }).addPath(path)
		})
	}

	GeoLinkTool.prototype._findIdenticalPathSegs = function(tripStop, oldGeomDiffSegments, newGeomDiffSegments, changedPathsDic)
	{
		var self = this, promises = [];
		if (!tripStop.path || !tripStop.path.geometry) { return Promise.resolve(changedPathsDic) }
		oldGeomDiffSegments.forEach(function(oldG)
		{
			if (tripStop.path && self._isLinesOverlap(tripStop.path.geometry, oldG))
			{
				var newG = self._findMatchNewPathSegment(oldG, newGeomDiffSegments);
				if (newG)
				{
					promises.push(self._isNewSegmentsSame(tripStop.path.geometry, oldG, newG).then(function(res)
					{
						if (res)
						{
							if (!changedPathsDic[tripStop.id]) changedPathsDic[tripStop.id] = [];
							changedPathsDic[tripStop.id].push({ oldPathSegmentGeometry: oldG, newPathSegmentGeometry: newG });

						}
					}))
				}
			}
		});
		newGeomDiffSegments.forEach(function(newG)
		{
			//when new path segment is a circle, find the closing point on new line to replace it. 
			if (newG.paths[0][0][0] == newG.paths[0][newG.paths[0].length - 1][0] && newG.paths[0][0][1] == newG.paths[0][newG.paths[0].length - 1][1])
			{
				promises.push(self._findPointOnOldLine(newG.paths[0][0], tripStop.path.geometry.paths[0]).then(function(res)
				{
					if (res)
					{
						if (!changedPathsDic[tripStop.id]) changedPathsDic[tripStop.id] = [];
						changedPathsDic[tripStop.id].push({
							oldPathSegmentGeometry: new tf.map.ArcGIS.Point({ spatialReference: 102100, x: newG.paths[0][0][0], y: newG.paths[0][0][1] }),
							newPathSegmentGeometry: newG
						});
					}
				}))
			}

		})
		return Promise.all(promises).then(function()
		{
			return changedPathsDic;
		})
	}

	GeoLinkTool.prototype._findPointOnOldLine = function(coor, path)
	{
		var self = this;
		for (var i = 0; i < path.length - 1; i++)
		{
			if (self._equals(path[i], coor))
			{
				return Promise.resolve(true);
			}
		}
		return Promise.resolve(false);
	}

	GeoLinkTool.prototype._equalsBoundary = function(boundaryGeom1, boundaryGeom2)
	{
		var self = this;
		if (self.dataModel.dataModel.getGeoLinkSetting())
		{
			if (!g1 && !g2) return true;
			if (!g1 || !g2) return false;
			var g1 = createGeom(boundaryGeom1),
				g2 = createGeom(boundaryGeom2);
			return tf.map.ArcGIS.geometryEngine.equals(g1, g2);
		} else
		{
			return true;
		}
		function createGeom(geometry)
		{
			var g = null;
			if (geometry && geometry.type != "polygon")
			{
				g = new tf.map.ArcGIS.Polygon({ spatialReference: 102100 });
				g.rings = geometry.rings;
			} else { g = geometry; }
			return self._reduceGeometryPrecision(g);
		}

	}
	GeoLinkTool.prototype._equals = function(coor1, coor2)
	{
		return coor1 && coor2 &&
			mathRound(coor1[0], this.precision) == mathRound(coor2[0], this.precision) &&
			mathRound(coor1[1], this.precision) == mathRound(coor2[1], this.precision);
	}

	GeoLinkTool.prototype._isLinesOverlap = function(toPathGeo, oldG)
	{
		var self = this;
		if (!self._isValidGeometry(toPathGeo) || !self._isValidGeometry(oldG)) return false;
		var simplePath = tf.map.ArcGIS.geometryEngine.simplify(self._reduceGeometryPrecision(toPathGeo));
		var simpleOldG = tf.map.ArcGIS.geometryEngine.simplify(self._reduceGeometryPrecision(oldG));
		if (self._isValidGeometry(simplePath) && self._isValidGeometry(simpleOldG) && tf.map.ArcGIS.geometryEngine.intersects(simplePath, simpleOldG))
		{
			var indexes = self._findSegmentIndexesOfPath(simplePath, simpleOldG);
			if (indexes[0] >= 0 && indexes[1] >= 0)
			{
				if (indexes[0] < indexes[1])
				{
					var targetPathSegment = new tf.map.ArcGIS.Polyline({ spatialReference: 102100 });
					targetPathSegment.addPath(simplePath.paths[0].slice(indexes[0], indexes[1] + 1));
					//targetPathSegment = targetPathSegment;
					if (targetPathSegment)
					{
						var b = tf.map.ArcGIS.geometryEngine.buffer(targetPathSegment, 1, "meters");
						if (b)
						{
							var intersection = tf.map.ArcGIS.geometryEngine.intersect(b, simpleOldG)
							if (tf.map.ArcGIS.geometryEngine.equals(intersection, simpleOldG))
							{
								return true;
							}
						}

					}
				} else if (indexes[0] == indexes[1])
				{
					return true;
				}

			}

		}
		return false;
	}

	GeoLinkTool.prototype._isValidGeometry = function(geometry)
	{
		if (!geometry) return false;
		if (geometry.type == "polyline")
		{
			if (geometry && geometry.paths[0] && geometry.paths[0].length > 0) return true;
			return false;
		}
		else if (geometry.type == "polygon")
		{
			if (geometry && geometry.rings[0] && geometry.rings[0].length > 0) return true;
			return false;
		}
		return true;
	}

	GeoLinkTool.prototype._isNewSegmentsSame = function(tripStopPathGeom, oldG, newG)
	{
		var self = this;
		if (self._getUturn() == "allow-backtrack")
		{
			return Promise.resolve(true);
		} else
		{
			// tripStopPathGeom = tf.map.ArcGIS.geometryEngine.simplify(tripStopPathGeom);
			// var indexes = self._findSegmentIndexesOfPath(tripStopPathGeom, oldG);
			// var allStops = [tripStopPathGeom.paths[0][indexes[0] - 1], oldG.paths[0][0]].concat(routeStops).concat([oldG.paths[0][oldG.paths[0].length - 1], tripStopPathGeom.paths[0][indexes[1] + 1]]);
			// return self._getRoute(allStops).then(function(tripStopNewPathSegment)
			// {
			// 	if (self._isLinesOverlapSame(tripStopNewPathSegment, newG))
			// 	{
			// 		return Promise.resolve(true);
			// 	}
			// 	return Promise.resolve(false);
			// });
			tripStopPathGeom = tf.map.ArcGIS.geometryEngine.simplify(tripStopPathGeom);
			oldG = tf.map.ArcGIS.geometryEngine.simplify(oldG);
			newG = tf.map.ArcGIS.geometryEngine.simplify(newG);
			var indexes = self._findSegmentIndexesOfPath(tripStopPathGeom, oldG);
			var lessNewG = self._reduceGeometryPrecision(newG);
			var lessOriginalPath = self._reduceGeometryPrecision(tripStopPathGeom);

			if (lessOriginalPath.paths[0][indexes[0] - 1] &&
				(self._getLineAngle(lessOriginalPath.paths[0][indexes[0]], lessOriginalPath.paths[0][indexes[0] - 1]) ==
					self._getLineAngle(lessNewG.paths[0][0], lessNewG.paths[0][1])))
			{
				return Promise.resolve(false);
			}
			if (lessOriginalPath.paths[0][indexes[1] + 1] && lessNewG.paths[0][lessNewG.paths[0].length - 2] &&
				(self._getLineAngle(lessOriginalPath.paths[0][indexes[1]], lessOriginalPath.paths[0][indexes[1] + 1]) ==
					self._getLineAngle(lessNewG.paths[0][lessNewG.paths[0].length - 1], lessNewG.paths[0][lessNewG.paths[0].length - 2])))
			{
				return Promise.resolve(false);
			}
			return Promise.resolve(true);
		}

	}

	GeoLinkTool.prototype._getLineAngle = function(pS, pE)
	{
		var dx = pS[0] - pE[0];
		var dy = pS[1] - pE[1];
		var theta = Math.atan2(dy, dx);
		theta *= 180 / Math.PI;
		return theta;
	}

	GeoLinkTool.prototype._getUturn = function()
	{
		this.uturnPolicies = {
			0: "allow-backtrack",
			1: "at-dead-ends-only",
			2: "at-dead-ends-and-intersections",
			3: "no-backtrack"
		}
		return this.uturnPolicies[tf.storageManager.get("uTurnPolicyRouting")];
	}

	GeoLinkTool.prototype._findMatchNewPathSegment = function(oldG, newGeomDiffSegments)
	{
		var self = this;
		if (!self._isValidGeometry(oldG)) return null;
		return newGeomDiffSegments.filter(function(segment)
		{
			return self._equals(segment.paths[0][0], oldG.paths[0][0]) && self._equals(segment.paths[0][segment.paths[0].length - 1], oldG.paths[0][oldG.paths[0].length - 1]);
		})[0];
	}

	GeoLinkTool.prototype._replaceOldPathWithNew = function(path, oldSegment, newSegment)
	{
		var self = this
		oldSegment = tf.map.ArcGIS.geometryEngine.simplify(oldSegment);
		newSegment = tf.map.ArcGIS.geometryEngine.simplify(newSegment);
		if (oldSegment.type == "point")
		{
			var jointIndex = -1;
			for (var i = 0; i <= path.paths[0].length - 1; i++)
			{
				if (self._equals(path.paths[0][i], [oldSegment.x, oldSegment.y]))
				{
					jointIndex = i;
					break;
					//Here just consider the simple logic, if the circle is already exist in the original path, 
					//there will be multi jointIndex, which to relace will need to consider.
				}
			}
			path.paths[0] = path.paths[0].slice(0, jointIndex).concat(newSegment.paths[0]).concat(path.paths[0].slice(jointIndex))
		} else
		{
			path = tf.map.ArcGIS.geometryEngine.simplify(path);
			oldSegment = tf.map.ArcGIS.geometryEngine.simplify(oldSegment);
			var indexes = self._findSegmentIndexesOfPath(path, oldSegment);
			var startIndex = indexes[0], endIndex = indexes[1];
			if (startIndex >= 0 && endIndex >= 0 && endIndex >= startIndex)
			{
				path.paths[0] = path.paths[0].slice(0, startIndex).concat(newSegment.paths[0]).concat(path.paths[0].slice(endIndex))
			}
		}
		return path;
	}

	GeoLinkTool.prototype._findSegmentIndexesOfPath = function(path, segment)
	{
		var self = this;
		var _path = path,
			_segment = segment;
		var startIndex = -1, endIndex = -1;
		var startP = _segment.paths[0][0];
		for (var i = 0; i <= _path.paths[0].length - 1; i++)
		{
			var point = _path.paths[0][i];
			if (segment.type == "polyline")
			{
				if (self._equals(point, startP))
				{
					var slicePart = _path.paths[0].slice(i, i + _segment.paths[0].length);
					var newPath = new tf.map.ArcGIS.Polyline({ spatialReference: 102100 });
					newPath.addPath(slicePart);
					if (tf.map.ArcGIS.geometryEngine.equals(segment, newPath))
					{
						startIndex = i;
						endIndex = i + _segment.paths[0].length - 1;
						break;
					}
				}

			} else if (segment.type == "point")
			{
				startP = [segment.x, segment.y];
				if (self._equals(point, startP))
				{
					startIndex = i;
					endIndex = i;
				}
			}
		}
		return [startIndex, endIndex];
	}

	// GeoLinkTool.prototype._createPathSegments = function(result)
	// {
	// 	var self = this, pathSegments = [];
	// 	var stopToStopPathGeometry = new tf.map.ArcGIS.Polyline(tf.map.ArcGIS.SpatialReference({
	// 		wkid: 102100
	// 	}));
	// 	var stopToStopPathDirections = "";
	// 	stopToStopPathGeometry.paths = [
	// 		[]
	// 	];
	// 	var stopToStopPathLength = 0;
	// 	var stopToStopPathTime = 0;
	// 	if (result)
	// 	{
	// 		result.routeResults[0].directions.features.forEach(function(feature)
	// 		{
	// 			if (feature.attributes.maneuverType == "esriDMTStop")
	// 			{
	// 				pathSegments.push({
	// 					geometry: TF.cloneGeometry(stopToStopPathGeometry),
	// 					length: stopToStopPathLength.toString(),
	// 					time: stopToStopPathTime.toString(),
	// 					direction: stopToStopPathDirections
	// 				});
	// 				stopToStopPathGeometry.paths[0] = [];
	// 				stopToStopPathLength = 0;
	// 				stopToStopPathTime = 0;
	// 				stopToStopPathDirections = "";
	// 			}
	// 			if (feature.attributes.maneuverType != "esriDMTDepart" && feature.attributes.maneuverType != "esriDMTStop")
	// 			{
	// 				stopToStopPathDirections += feature.attributes.text + " " + feature.attributes.length.toFixed(2) + " mi. ";
	// 			}
	// 			stopToStopPathGeometry.paths[0] = stopToStopPathGeometry.paths[0].concat(feature.geometry.paths[0]);
	// 			stopToStopPathLength += feature.attributes.length;
	// 			stopToStopPathTime += feature.attributes.time;
	// 		});
	// 	} else
	// 	{
	// 		pathSegments.push({
	// 			geometry: new tf.map.ArcGIS.Polyline(self._map.mapView.spatialReference).addPath([])
	// 		});
	// 	}
	// 	return pathSegments;
	// }

	// GeoLinkTool.prototype._updatePathSegments = function(pathSegments, startCoor, endCoor)
	// {
	// 	var tripStopNewPath = new tf.map.ArcGIS.Polyline({ spatialReference: 102100 });
	// 	var path = [];
	// 	pathSegments.forEach(function(p, index)
	// 	{
	// 		var _path = tf.map.ArcGIS.geometryEngine.simplify(p.geometry);
	// 		if (index == 0)
	// 		{
	// 			var startIndex = 0;
	// 			for (var i = 0; i < _path.paths[0].length; i++)
	// 			{
	// 				var point = _path.paths[0][i];
	// 				if (point[0].toFixed(0) == startCoor[0].toFixed(0) && point[1].toFixed(0) == startCoor[1].toFixed(0))
	// 				{
	// 					startIndex = i;
	// 					break;
	// 				}
	// 			}
	// 			_path.paths[0] = _path.paths[0].slice(startIndex);
	// 		}
	// 		if (index == pathSegments.length - 1)
	// 		{
	// 			var endIndex = pathSegments.length - 1;
	// 			for (var i = 0; i < _path.paths[0].length; i++)
	// 			{
	// 				var point = _path.paths[0][i];
	// 				if (point[0].toFixed(0) == endCoor[0].toFixed(0) && point[1].toFixed(0) == endCoor[1].toFixed(0))
	// 				{
	// 					endIndex = i;
	// 					break;
	// 				}
	// 			}
	// 			_path.paths[0] = _path.paths[0].slice(0, endIndex);
	// 		}
	// 		path = path.concat(_path.paths[0]);
	// 	});
	// 	tripStopNewPath.addPath(path);
	// 	return tripStopNewPath;
	// }


	// GeoLinkTool.prototype._getRoute = function(stopCoords)
	// {
	// 	var self = this;
	// 	var stops = new tf.map.ArcGIS.FeatureSet();
	// 	var router = new tf.map.ArcGIS.RouteTask(arcgisUrls.LocalRouteFile);
	// 	var routeParameters = new tf.map.ArcGIS.RouteParameters();
	// 	routeParameters.returnDirections = true;
	// 	routeParameters.restrictUTurns = self._getUturn();
	// 	routeParameters.restrictionAttributes = ["oneway", "vehicletraverse"];
	// 	routeParameters.stops = stops;
	// 	stopCoords.forEach(function(coor, index)
	// 	{
	// 		var point = new tf.map.ArcGIS.Point({ spatialReference: 102100, x: coor[0], y: coor[1] });
	// 		var attributes = {
	// 			curbApproach: 1,
	// 			Name: parseInt(index)
	// 		};
	// 		var stop = new tf.map.ArcGIS.Graphic(point, null, attributes);
	// 		stops.features.push(stop);
	// 	});

	// 	return router.solve(routeParameters).then(function(result)
	// 	{
	// 		var pathSegments = self._createPathSegments(result);
	// 		var tripStopNewPath = self._updatePathSegments(pathSegments, stopCoords[1], stopCoords[stopCoords.length - 2]);

	// 		var layer = new tf.map.ArcGIS.GraphicsLayer();
	// 		self.dataModel._viewModal._map.add(layer)
	// 		var oldDiffG = new tf.map.ArcGIS.Graphic(tripStopNewPath, new tf.map.ArcGIS.SimpleLineSymbol())
	// 		layer.add(oldDiffG)

	// 		return Promise.resolve(tf.map.ArcGIS.geometryEngine.simplify(tripStopNewPath));
	// 	})
	// }

	// GeoLinkTool.prototype._getGeometry1DiffSegmentsFromGeometry2 = function(geometry1, geometry2)
	// {
	// 	var self = this, notExistIndexes = [];
	// 	geometry1.paths[0].forEach(function(point, index)
	// 	{
	// 		for (var i = 0; i < geometry2.paths[0].length; i++)
	// 		{
	// 			var find = false;
	// 			var point2 = geometry2.paths[0][i];
	// 			if (self._equals(point, point2))
	// 			{
	// 				find = true;
	// 				break;
	// 			}
	// 		}
	// 		if (!find) notExistIndexes.push(index);
	// 	});
	// 	notExistIndexes = notExistIndexes.sort(function(a, b) { return a - b; });
	// 	notExistIndexes = self._groupByConsecutiveNumbers(notExistIndexes);
	// 	var geometry = new tf.map.ArcGIS.Polyline({ spatialReference: 102100 });

	// 	notExistIndexes.forEach(function(indexRange)
	// 	{
	// 		var path = [];
	// 		var startIndex = parseInt(indexRange.split("-")[0]) > 0 ? parseInt(indexRange.split("-")[0]) - 1 : undefined;
	// 		var endIndex = parseInt(indexRange.split("-")[1]) && startIndex ? parseInt(indexRange.split("-")[1]) + 1 : startIndex + 2;
	// 		if (startIndex >= 0 && endIndex >= 0)
	// 		{
	// 			path = geometry1.paths[0].slice(startIndex, endIndex + 1);
	// 		}
	// 		geometry.addPath(path);
	// 	});

	// 	return geometry;

	// }
	// GeoLinkTool.prototype._groupByConsecutiveNumbers = function(num)
	// {
	// 	var result = "";
	// 	for (var i = 0; i < num.length; i++)
	// 	{
	// 		if (i == 0)
	// 		{
	// 			result = "" + num[i];
	// 		} else if (i == num.length - 1)
	// 		{
	// 			if (num[i] - num[i - 1] == 1)
	// 			{
	// 				result = result + "-" + num[i];
	// 			} else
	// 			{
	// 				result = result + "," + num[i];
	// 			}
	// 		} else
	// 		{
	// 			if ((num[i] - num[i - 1] == 1) && (num[i + 1] - num[i] == 1))
	// 			{
	// 				continue;
	// 			}
	// 			if ((num[i] - num[i - 1] == 1) && (num[i + 1] - num[i] != 1))
	// 			{
	// 				result = result + "-" + num[i];
	// 			}
	// 			if ((num[i] - num[i - 1] != 1))
	// 			{
	// 				result = result + "," + num[i];
	// 			}

	// 		}
	// 	}
	// 	return result.split(",");
	// }
	// GeoLinkTool.prototype._isLinesOverlapSame = function(geometry1, geometry2)
	// {
	// 	var self = this;
	// 	if (geometry1 && geometry2)
	// 	{
	// 		var simplifiedGeom1 = tf.map.ArcGIS.geometryEngine.simplify(self._reduceGeometryPrecision(geometry1));
	// 		var simplifiedGeom2 = tf.map.ArcGIS.geometryEngine.simplify(self._reduceGeometryPrecision(geometry2));
	// 		if (tf.map.ArcGIS.geometryEngine.equals(simplifiedGeom1, simplifiedGeom2))
	// 		{
	// 			// var intersection = tf.map.ArcGIS.geometryEngine.intersect(toPathGeo, tf.map.ArcGIS.geometryEngine.buffer(oldG, 1, 'meters'))
	// 			// if (tf.map.ArcGIS.geometryEngine.geodesicLength(intersection) >= tf.map.ArcGIS.geometryEngine.geodesicLength(oldG))
	// 			// {
	// 			return true;
	// 			// }
	// 		}
	// 	}

	// 	return false;

	// }
})()

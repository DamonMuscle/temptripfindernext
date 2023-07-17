(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").NetworkAnalysisTool = NetworkAnalysisTool;
	const DISTANCE_THRESHOLD = 1000;

	function NetworkAnalysisTool(drawTool)
	{
		var self = this;
		self._arcgis = tf.map.ArcGIS;
		self._map = drawTool._map;
		self.drawTool = drawTool;
		self.dataModel = drawTool.dataModel;
		self.viewModel = drawTool.viewModel;
		self._viewModel = (drawTool.viewModel || {})._viewModal;
		self._viewModal = drawTool._viewModal;
		self.editModal = drawTool.editModal;
		self.stopTool = drawTool.stopTool;

		self.initialize();

	}

	NetworkAnalysisTool.prototype.initialize = function()
	{
		var self = this;
		var localRouteUrl = arcgisUrls.LocalRouteFile;
		self._router = new self._arcgis.RouteTask(localRouteUrl);
		self.streetSourceOid = tf.streetSourceOid;
	}

	NetworkAnalysisTool.prototype.initRouteParameters = function()
	{
		var self = this;
		var routeParameters = new self._arcgis.RouteParameters();
		routeParameters.outputLines = "true-shape"; // the start point of route geometry is difference in round trip mode, use TRUE_SHAPE instead.
		routeParameters.returnRoutes = true;
		routeParameters.returnStops = true;
		routeParameters.returnDirections = true;
		routeParameters.returnPolygonBarriers = true;
		routeParameters.impedanceAttribute = self.drawTool._impedanceAttribute ? self.drawTool._impedanceAttribute : tf.storageManager.get("impedanceAttrRouting");//"Time";
		routeParameters.restrictionAttributes = ["oneway", "traversable"];
		routeParameters.ignoreInvalidLocations = false;
		routeParameters.directionsOutputType = "complete";
		routeParameters.preserveFirstStop = true;
		routeParameters.preserveLastStop = true;
		routeParameters.directionsTimeAttribute = "Time";
		routeParameters.directionsLengthUnits = "kilometers";
		return routeParameters;
	}

	NetworkAnalysisTool.prototype.refreshTrip = function(tripStop, type, hasSpecialOrder, isSmartAddStop)
	{
		var self = this;
		var trip = self.dataModel.getTripById(tripStop.FieldTripId);
		return self.stopTool.attachClosetStreetToStop(trip.FieldTripStops.concat(tripStop).filter(function(stop) { return !stop.StreetSegment })).then(function()
		{
			//var routeParameters = self._getRouteParameters(self.initRouteParameters(), tripStop.TripId);
			switch (type)
			{
				case "new":
					if (isSmartAddStop) return self._recalculateTripSmart(tripStop);
					if ((!self.drawTool._smartSequence) || hasSpecialOrder || tripStop.Sequence)
					{
						return self._recalculateTripMove(tripStop, true);
					}
					if (self._isSchoolLastStop(trip, tripStop, trip.FieldTripStops))
					{
						if (trip.Session <= 1 || (trip.Session > 1 && trip.FieldTripStops.length <= 2))
						{
							tripStop.Sequence = TF.Helper.TripHelper.getTripStopInsertSequenceBeforeSchool(trip.FieldTripStops.filter(s => s.id != tripStop.id), trip.Session, tripStop.doorToDoorSchoolId);
							return self._recalculateTripMove(tripStop);
						}
					}
					return self._recalculateTripSmart(tripStop);
				case "move":
					return self._recalculateTripMove(tripStop, true);
				case "delete":
					return self._recalculateTripDelete(tripStop);
			}
		})

	};
	NetworkAnalysisTool.prototype._isSchoolLastStop = function(trip, newTripStop, tripStops)
	{
		if (newTripStop.doorToDoorSchoolId)
		{
			if (tripStops.filter(function(stop) { return stop.SchoolCode && stop.SchoolId == newTripStop.doorToDoorSchoolId })[0].Sequence == (trip.Session == 0 ? 1 : trip.FieldTripStops.length - 1)) return true;
			return false;
		} else
		{
			if (tripStops.filter(function(stop) { return stop.Sequence > 0 && (!stop.SchoolCode) }).length == 0) return true;
			return false;
		}
	};

	NetworkAnalysisTool.prototype.getTravelScenario = function(travelScenarioId)
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase("v2"), "travelscenarios") + "?id=" + travelScenarioId).then(function(data)
		{
			return data.Items[0];
		});
	};

	NetworkAnalysisTool.prototype._getRouteParameters = async function(routeParameters, tripId, newTrip)
	{
		var self = this;

		routeParameters.restrictUTurns = self.drawTool ? self.drawTool._uTurnPolicy : "allow-backtrack";
		routeParameters.outputLines = "true-shape";
		routeParameters.restrictionAttributes = ["oneway", "vehicletraverse"];
		routeParameters.directionsTimeAttribute = "Time";
		routeParameters.travelMode = await TF.getTravelMode(1, routeParameters);
		routeParameters.directionsLengthUnits = "kilometers";

		var trip = newTrip ? newTrip : self.dataModel.getTripById(tripId);
		if (trip.TravelScenarioId)
		{
			return self.getTravelScenario(trip.TravelScenarioId).then(function(travelscenario)
			{
				if (!travelscenario)
				{
					travelscenario = self._viewModel.directionPaletteViewModel.travelScenario;
				}
				if (travelscenario && !((travelscenario.ProhibitedId == 1) && (travelscenario.RestrictedId == 13)))
				{
					var barriersPromise = self._getSelectedBarriers(travelscenario.Id);
					return barriersPromise.then(function(barriers)
					{
						routeParameters.pointBarriers = barriers === null ? [] : barriers[0];
						routeParameters.polylineBarriers = barriers === null ? [] : barriers[1];
						routeParameters.polygonBarriers = barriers === null ? [] : {
							features: barriers[2].features.map(function(f)
							{
								var b = new self._arcgis.Graphic();
								b.geometry = f.geometry;
								b.attributes = {
									"BarrierType": f.attributes.BarrierType,
									"Attr_Time": parseFloat(f.attributes.Attr_Time) + 0.000001,
									"Attr_Length": f.attributes.Attr_Length,
									"isChangeTime": f.attributes.isChangeTime
								};
								return b
							})
						};
						routeParameters.restrictionAttributes = ["oneway", "vehicletraverse", "redturn_" + travelscenario.ProhibitedId, "yellowturn_" + travelscenario.RestrictedId];
						routeParameters.travelMode.restrictionAttributeNames = routeParameters.restrictionAttributes;
						return Promise.resolve(routeParameters);
					});
				}
				return Promise.resolve(routeParameters);
			});
		} else
		{
			routeParameters.restrictionAttributes = ["oneway", "vehicletraverse"];
		}
		return Promise.resolve(routeParameters);
	};

	NetworkAnalysisTool.prototype._getBeforeStop = function(tripStop)
	{
		var self = this,
			trip = self.dataModel.getTripById(tripStop.TripId),
			beforeStops = trip.FieldTripStops.filter(s => s.Sequence < tripStop.Sequence);
		return beforeStops[beforeStops.length - 1];
	}

	NetworkAnalysisTool.prototype._getAfterStop = function(tripStop)
	{
		var self = this,
			trip = self.dataModel.getTripById(tripStop.TripId),
			afterStops = trip.FieldTripStops.filter(s => s.Sequence >= tripStop.Sequence && s.id != (tripStop.id || tripStop.Id));
		return afterStops[0];
	}

	NetworkAnalysisTool.prototype._recalculateTripMove = function(tripStop, isCurbApproachChange)
	{
		var self = this;
		var trip = self.dataModel.getTripById(tripStop.TripId);
		var stops = [];
		if (tripStop.Sequence != 1)
		{
			var beforeStop = self._getBeforeStop(tripStop);
			var _beforeStopToInsert = beforeStop ? beforeStop : trip.FieldTripStops[tripStop.Sequence - 2];
			if (_beforeStopToInsert) stops.push(_beforeStopToInsert);
		}
		stops.push(tripStop);
		if (tripStop.Sequence < trip.FieldTripStops.length)
		{
			var afterStop = self._getAfterStop(tripStop);//self._findStopBySequence(trip, tripStop.Sequence + 1);
			var _afterStopToInsert = afterStop ? afterStop : trip.FieldTripStops[tripStop.Sequence];
			if (_afterStopToInsert) stops.push(_afterStopToInsert);
		}
		return self.refreshTripByMultiStops(stops, false, true, isCurbApproachChange);
	};

	// calculate the start sequence and end sequene for a new stop to be smart inserted into the trip.
	NetworkAnalysisTool.prototype._getSequenceRangesToInsertStop = function(newTripStop, trip)
	{
		let self = this, schoolCodes = trip.FieldTripStops.filter(s => s.SchoolCode).map(s => s.SchoolCode);
		// RW-20666, stops needs to be placed before or after the students' school stop.
		// KNOWN ISSUE: student might not be able to be assigned to this stop based on their cross student status, but cross status needs the trip path.
		let intersectedStudents = self.dataModel.candidateStudents.filter(s => tf.map.ArcGIS.geometryEngine.intersects(newTripStop.boundary.geometry, s.geometry));
		if (intersectedStudents.length > 0)
		{
			schoolCodes = intersectedStudents.map(s => s.SchoolCode);
		}

		let schoolStops = trip.FieldTripStops.filter(s => s.SchoolCode && schoolCodes.indexOf(s.SchoolCode) >= 0);
		if (schoolStops.length == 0)
		{
			schoolStops = trip.FieldTripStops.filter(s => s.SchoolCode);
		}
		let startSequence = 1, endSequence = trip.FieldTripStops.length - 1;
		if (trip.Session == 0)
		{
			const sequence = schoolStops[0].Sequence;
			endSequence = endSequence < sequence ? endSequence : sequence;
		} else if (trip.Session == 1)
		{
			startSequence = schoolStops[schoolStops.length - 1].Sequence;
			const sequence = Math.max(...trip.FieldTripStops.map(function(o) { return o.Sequence; }))
			endSequence = endSequence < sequence ? endSequence : sequence;
		}

		return [startSequence, endSequence];
	}

	NetworkAnalysisTool.prototype.calculateStopToStopDistance = function(stop, otherStops)
	{
		var distances = [], stopToStopDistances = [];
		for (var i = 0; i < otherStops.length; i++)
		{
			var distance = this._arcgis.geometryEngine.distance(stop.geometry, otherStops[i].geometry, "meters");
			distances.push(distance);
		}
		for (var i = 0; i < distances.length - 1; i++)
		{
			stopToStopDistances.push({
				sequence: i + 1,
				distance: distances[i] + distances[i + 1],
				distance1: distances[i],
				distance2: distances[i + 1]
			});
		}
		return stopToStopDistances;
	};

	NetworkAnalysisTool.prototype.calculateSmartSequence = function(newTripStop)
	{
		var trip = this.dataModel.getTripById(newTripStop.TripId),
			promises = [], vertexPromises = [], allStopsList = [],
			tripStops = trip.FieldTripStops.sort((a, b) => a.Sequence - b.Sequence).filter(s => s.id != newTripStop.id);
		function getStopGeometry(tripStop)
		{
			if (!tripStop) return;
			if (tripStop.SchoolLocation)
			{
				return tripStop.SchoolLocation.geometry;
			}

			return tripStop.geometry;
		}
		let copyTrip = { ...trip };
		copyTrip.FieldTripStops = tripStops;
		var stopSequences = [];
		let [startSequence, endSequence] = this._getSequenceRangesToInsertStop(newTripStop, copyTrip);

		// if new trip stop far from current stops over 5km, only take top 3 stops smallest distance to calculate to help improve performance
		var stopToStopDistance = this.calculateStopToStopDistance(newTripStop, tripStops);
		var farawayDistance = 5000;
		if (tripStops.length > 10 && stopToStopDistance.filter(x => x.distance1 > farawayDistance && x.distance2 > farawayDistance).length == stopToStopDistance.length)
		{
			stopSequences = Enumerable.From(stopToStopDistance).Where(x => x.sequence >= startSequence && x.sequence <= endSequence).OrderBy(x => x.distance).Take(3).OrderBy(x => x.sequence).ToArray();
		} else
		{
			for (var i = startSequence; i <= endSequence; i++)
			{
				stopSequences.push({ sequence: i });
			}
		}

		for (var index = 0; index < stopSequences.length; index++)
		{
			var i = stopSequences[index].sequence - 1;
			var stop_before = tripStops[i];
			var stop_after = tripStops[i + 1];
			var stopBefore = new this._arcgis.Graphic(getStopGeometry(stop_before), null, $.extend(true, {}, stop_before));
			var stopAfter = new this._arcgis.Graphic(getStopGeometry(stop_after), null, $.extend(true, {}, stop_after));
			vertexPromises.push(this._getVertexesCloseToStopOnPath(stop_before, stop_after));
			var allStops = [stopBefore, newTripStop, stopAfter];
			allStopsList.push(allStops);
		}

		var routeBarriersPromise = this._getRouteParameters(this.initRouteParameters(), trip.id);
		var urlPromise = tf.startup.loadArcgisUrls();
		return Promise.all(vertexPromises.concat([routeBarriersPromise, urlPromise])).then(res =>
		{
			res.pop();
			var vertexesList = res.splice(0, res.length - 1);
			var routeParams = res[res.length - 1];
			this._router.url = arcgisUrls.LocalRouteFile;

			let createSolvePromise = routeStops =>
			{
				var stops = new this._arcgis.FeatureSet();
				stops.features = this._getStops(routeStops);
				var routeParameters = this.initRouteParameters();
				routeParameters.stops = stops;
				routeParameters.directionsTimeAttribute = routeParams.directionsTimeAttribute;
				routeParameters.outputLines = routeParams.outputLines;
				routeParameters.pointBarriers = routeParams.pointBarriers;
				routeParameters.polygonBarriers = routeParams.polygonBarriers;
				routeParameters.polylineBarriers = routeParams.polylineBarriers;
				routeParameters.restrictionAttributes = routeParams.restrictionAttributes;
				routeParameters.restrictUTurns = this.drawTool._uTurnPolicy;
				routeParameters.travelMode = routeParams.travelMode;
				if (this.drawTool._speedType == TF.Enums.RoutingSpeedType.DefaultSpeed && routeParameters.impedanceAttribute == "Time")
				{
					routeParameters.impedanceAttribute == "Length";
				}

				return this._router.solve(routeParameters).then(data => data, err => ({ errMessage: this._getAlertMessage(err) }));
			}
			let routeStops = [];
			tripStops.forEach((tripStop, index) =>
			{
				const stop = new this._arcgis.Graphic(getStopGeometry(tripStop), null,
					{
						StreetSegment: tripStop.StreetSegment,
						vehicleCurbApproach: tripStop.vehicleCurbApproach ? tripStop.vehicleCurbApproach : tripStop.VehicleCurbApproach,
						Name: tripStop.Sequence ? tripStop.Sequence : index + 1,
						SchoolLocation: tripStop.SchoolLocation
					});
				routeStops.push($.extend(true, {}, stop));
			});
			promises.push(createSolvePromise(routeStops));

			vertexesList.forEach((vertexes, index) =>
			{
				if (vertexes[0])
				{
					allStopsList[index][0].attributes.vehicleCurbApproach = 0;
					allStopsList[index].unshift(vertexes[0]);
				}

				if (vertexes[1])
				{
					allStopsList[index].push(vertexes[1]);
				}
			});

			promises.push(createSolvePromise(_.flatten(allStopsList)));

			return Promise.all(promises).then(results =>
			{
				let minDistAdded, minIndex, minRoute, errMessage,
					originTripResult = results.splice(0, 1)[0];
				this.recalculateDirectionTimeWithBarriers(originTripResult, routeParams.polygonBarriers);
				let originSegments = this._createPathSegments(originTripResult).map(i =>
				{
					let length = typeof i.length === 'string' ? parseFloat(i.length) : i.length;
					if (isNaN(length)) { length = 0; }
					length *= 1000;

					let time = typeof i.time === 'string' ? parseFloat(i.time) : i.time;
					if (isNaN(time)) { time = 0; }

					return {
						length: length,
						time: time
					};
				});
				results = this._formatDirectionResults(results[0], allStopsList)
				results.forEach((result, index) =>
				{
					if (!result.routeResults)
					{
						errMessage = originTripResult.errMessage || result.errMessage;
						return;
					}

					this.recalculateDirectionTimeWithBarriers(result, routeParams.polygonBarriers);
					var currentSequence = stopSequences[index].sequence;
					var oldStop = trip.FieldTripStops.find(stop => stop.Sequence == currentSequence && stop.id != newTripStop.id),
						oldSegment = originSegments[currentSequence - 1],
						distAdded = Number.MAX_VALUE;
					if (oldSegment && oldStop && oldStop.path && oldStop.path.geometry && this._isValidSequence(oldStop, newTripStop, trip))
					{
						if (this.drawTool._impedanceAttribute == "Time")
						{
							var newTime;
							if (this.drawTool._speedType == TF.Enums.RoutingSpeedType.DefaultSpeed)
							{
								newTime = this._calculateNewRouteTimeByAvgSpeed(result, vertexesList[index], oldStop.Speed, this.drawTool._avgSpeed);
							}
							else
							{
								newTime = this._calculateNewRouteTime(result, vertexesList[index]);
							}

							distAdded = newTime - oldSegment.time;
						}
						else
						{
							var newLength = this._calculateNewRouteLength(result, vertexesList[index]);
							distAdded = newLength - oldSegment.length;
						}
					}

					if (!minDistAdded)
					{
						minDistAdded = distAdded;
						minIndex = index;
						minRoute = result;
					}
					else if (distAdded < minDistAdded)
					{
						minDistAdded = distAdded;
						minIndex = index;
						minRoute = result;
					}
				});
				return minIndex != null ? {
					sequence: stopSequences[minIndex].sequence + 1,
					minRoute: minRoute,
					vertexes: vertexesList[minIndex],
				} : {
					errMessage: errMessage
				};
			});
		});
	}

	NetworkAnalysisTool.prototype._recalculateTripSmart = function(newTripStop)
	{
		var trip = this.dataModel.getTripById(newTripStop.TripId);
		return this.calculateSmartSequence(newTripStop).then(res =>
		{
			this.drawTool._clearTempDrawing();
			if (res.sequence != null)
			{
				newTripStop.Sequence = res.sequence;
				return this._updateTripSegment(res.minRoute, newTripStop, res.vertexes);
			}

			newTripStop.Sequence = TF.Helper.TripHelper.getTripStopInsertSequenceBeforeSchool(trip.FieldTripStops.filter(s => s.id != newTripStop.id), trip.Session, newTripStop.doorToDoorSchoolId);
			var beforeTripStop = this._getBeforeStop(newTripStop);
			var afterTripStop = this._getAfterStop(newTripStop);
			return this.refreshTripByMultiStops([beforeTripStop, newTripStop, afterTripStop], false, true, true)
		});
	}

	NetworkAnalysisTool.prototype._formatDirectionResults = function(results, allStopsList)
	{

		if (results.errMessage)
		{
			return [results];
		}

		var resultArrays = [];
		if (!results || !results.routeResults || !results.routeResults[0]) return resultArrays;
		var directions = results.routeResults[0].directions.features;

		var _directions = [], stopCount = 0, index = 0,
			totalTime = results.routeResults[0].directions.totalTime,
			totalLength = results.routeResults[0].directions.totalLength;
		directions.forEach(function(direction, i)
		{
			if (stopCount > 0 || i == 0)
			{
				_directions.push(direction);
			}

			if (direction.attributes.maneuverType == "esriDMTStop" || i == 0)
			{
				stopCount++;
			}

			if (allStopsList[index].length == stopCount)
			{
				var result = $.extend({}, results, { routeResults: [$.extend({}, results.routeResults[0], { directions: { features: [] } })] });
				result.routeResults[0].directions.features = _directions;
				result.routeResults[0].directions.totalTime = Enumerable.From(_directions).Sum(x => x.attributes.time);
				result.routeResults[0].directions.totalLength = Enumerable.From(_directions).Sum(x => x.attributes.length);
				resultArrays.push(result);
				_directions = [];
				index++;
				stopCount = 0;
			}
		});
		return resultArrays;
	}

	NetworkAnalysisTool.prototype._isValidSequence = function(oldStop, newStop, trip)
	{
		if (!newStop.doorToDoorSchoolId) return true;
		var newStopSchoolSequence = trip.FieldTripStops.filter(function(stop) { return stop.SchoolCode && stop.SchoolId == newStop.doorToDoorSchoolId })[0].Sequence;
		if (trip.Session == 0 && oldStop.Sequence >= newStopSchoolSequence) return false;
		if (trip.Session == 1 && oldStop.Sequence < newStopSchoolSequence) return false;
		return true;
	}

	NetworkAnalysisTool.prototype._findStopBySequence = function(trip, sequence)
	{
		var self = this, result = null;
		trip.FieldTripStops.forEach(function(stop)
		{
			if (stop.Sequence == sequence)
			{
				result = new self._arcgis.Graphic(self.getStopLocationGeom(stop), null, stop);
			}
		});
		return result;
	};
	NetworkAnalysisTool.prototype._calculateNewRouteLength = function(result, vertexes)
	{
		var self = this;
		var pathSegments = self._createPathSegments(result);
		pathSegments = self._updatePathSegments(pathSegments, vertexes);
		var length = self._arcgis.geometryEngine.geodesicLength(pathSegments[0].geometry, "meters") + self._arcgis.geometryEngine.geodesicLength(pathSegments[1].geometry, "meters");
		return length;
	}

	NetworkAnalysisTool.prototype._calculateNewRouteTime = function(result, vertexes)
	{
		var self = this;
		var pathSegments = self._createPathSegments(result);
		pathSegments = self._updatePathSegments(pathSegments, vertexes);
		var time = parseFloat(pathSegments[0].time) + parseFloat(pathSegments[1].time);
		return time;
	}

	NetworkAnalysisTool.prototype._calculateNewRouteTimeByAvgSpeed = function(result, vertexes, oldStopSpeed, newStopSpeed)
	{
		var self = this;
		var pathSegments = self._createPathSegments(result);
		pathSegments = self._updatePathSegments(pathSegments, vertexes);
		var time = parseFloat(pathSegments[0].length / oldStopSpeed) * 60 + parseFloat(pathSegments[1].length / newStopSpeed) * 60;
		return time;
	}

	NetworkAnalysisTool.prototype._recalculateTripDelete = function(tripStop)
	{
		var self = this;
		var trip = self.dataModel.getTripById(tripStop.TripId);

		var _beforeStop = self._getBeforeStop(tripStop);
		if (!_beforeStop)
		{
			return Promise.resolve([tripStop]);
		}
		var beforeStop = new self._arcgis.Graphic(self.getStopLocationGeom(_beforeStop), null, $.extend(true, {}, _beforeStop));
		var _afterStop = self._getAfterStop(tripStop);
		if (!_afterStop)
		{
			_beforeStop.Speed = 0;
			_beforeStop.Distance = 0;
			_beforeStop.path = {
				geometry: new self._arcgis.Polyline(self._map.mapView.spatialReference).addPath([])
			};
			return Promise.resolve([_beforeStop, tripStop]);
		}
		var afterStop = new self._arcgis.Graphic(self.getStopLocationGeom(_afterStop), null, $.extend(true, {}, _afterStop));

		var stops = new self._arcgis.FeatureSet();
		var allStops = [beforeStop, afterStop];

		var vertexPromise = self._getVertexesCloseToStopOnPath(_beforeStop, _afterStop)
		var urlPromise = tf.startup.loadArcgisUrls();
		var routeParameters = self.initRouteParameters();
		var routeBarriersPromise = self._getRouteParameters(routeParameters, tripStop.TripId);
		return Promise.all([vertexPromise, routeBarriersPromise, urlPromise]).then(function(result)
		{
			var vertexes = result[0];
			routeParameters = result[1];
			self._router.url = arcgisUrls.LocalRouteFile;
			if (vertexes[0])
			{
				//allStops[0].attributes.vehicleCurbApproach = 0;
				allStops.unshift(vertexes[0]);
			}
			if (vertexes[1])
			{
				allStops.push(vertexes[1]);
				//vertexes[1].attributes.vehicleCurbApproach = afterStop.attributes.vehicleCurbApproach;
			}
			stops.features = self._getStops(allStops);
			routeParameters.stops = stops;

			return self._router.solve(routeParameters).then(function(result)
			{
				if (!result.routeResults)
				{

					_beforeStop.Speed = 0;
					_beforeStop.Distance = 0;
					_beforeStop.path = {
						geometry: new self._arcgis.Polyline(self._map.mapView.spatialReference).addPath([])
					};
					return Promise.resolve([_beforeStop, tripStop]);
				}
				self.recalculateDirectionTimeWithBarriers(result, routeParameters.polygonBarriers);
				return self._updateTripSegment(result, tripStop, vertexes, true);
			}, function(err)
			{
				err.stops = [];
				if (_beforeStop.Sequence && _afterStop.Sequence)
				{
					err.stops = [_beforeStop.Sequence, _afterStop.Sequence];
				}
				self.alertSolveFailedMessage(err);
				_beforeStop.Speed = 0;
				_beforeStop.Distance = 0;
				_beforeStop.path = {
					geometry: new self._arcgis.Polyline(self._map.mapView.spatialReference).addPath([])
				};
				return Promise.resolve([_beforeStop, tripStop]);
			}, self);
		}).catch(e =>
		{
			self.viewModel.display.arcgisError(e.message);
		})

	};
	NetworkAnalysisTool.prototype._updateTripSegment = function(result, tripStop, vertexes)
	{
		var self = this;
		var pathSegments = self._createPathSegments(result);
		pathSegments = self._updatePathSegments(pathSegments, vertexes);
		var beforeStop = self._getBeforeStop(tripStop);

		return Promise.resolve(self._notifyTripPathChange(beforeStop, tripStop, pathSegments, null));
	};
	NetworkAnalysisTool.prototype._getVertexesCloseToStopOnPathSeperately = function(beforeStop, afterStop)
	{
		var self = this, vertex = null, promises = [];
		vertex = getPrevVertex();
		return Promise.resolve(vertex);

		function getPrevVertex()
		{
			if (beforeStop)
			{
				var prevPath = beforeStop.path && beforeStop.path.geometry ? beforeStop.path.geometry : null;
				if (!prevPath) return null;
				return self._findVertexToStopOnPath(prevPath, self.getStopLocationGeom(afterStop));
			}
			return null;
		}
	}
	NetworkAnalysisTool.prototype._getVertexesCloseToStopOnPath = function(beforeStop, afterStop)
	{
		var self = this, vertexes = [null, null];
		if (!beforeStop && !afterStop) return [null, null];
		var tripId = beforeStop ? beforeStop.TripId : afterStop.TripId;
		var trip = self.dataModel.getTripById(tripId);

		vertexes[0] = getPrevVertex();
		vertexes[1] = getAfterVertex();

		return Promise.resolve(vertexes);

		function getPrevVertex()
		{
			if (beforeStop && beforeStop.Sequence != 1)
			{
				var preBeforeStop = trip.FieldTripStops.filter(s => s.Sequence == beforeStop.Sequence - 1)[0];
				if (!preBeforeStop) return null;
				var prevPath = preBeforeStop.path && preBeforeStop.path.geometry ? preBeforeStop.path.geometry : null;
				if (!prevPath) return null;
				return self._findVertexToStopOnPath(prevPath, self.getStopLocationGeom(beforeStop));
			}
			return null;
		}
		function getAfterVertex()
		{
			if (afterStop && (afterStop.Sequence != trip.FieldTripStops.length || afterStop.Sequence != trip.FieldTripStops.length - 1))
			{
				var afterPath = afterStop.path && afterStop.path.geometry ? afterStop.path.geometry : null;
				if (!afterPath) return null;
				return self._findVertexToStopOnPath(afterPath, self.getStopLocationGeom(afterStop));
			}
			return null;
		}
	}
	NetworkAnalysisTool.prototype._findVertexToStopOnPath = function(path, point)
	{
		var self = this;
		if (!path || !path.paths || !path.paths[0] || !path.paths[0][0]) return;
		path = TF.cloneGeometry(path);
		var distance1 = Math.sqrt((path.paths[0][0][0] - point.x) * (path.paths[0][0][0] - point.x) + (path.paths[0][0][1] - point.y) * (path.paths[0][0][1] - point.y));
		var endIndex = path.paths[0].length - 1;
		var distance2 = Math.sqrt((path.paths[0][endIndex][0] - point.x) * (path.paths[0][endIndex][0] - point.x) + (path.paths[0][endIndex][1] - point.y) * (path.paths[0][endIndex][1] - point.y));
		var vertex = null;

		var vertexGeom = self.stopTool._getPointOnPolylineByDistanceToPoint(path, 3, distance1 < distance2);
		vertex = new self._arcgis.Graphic(vertexGeom, new self._arcgis.SimpleMarkerSymbol(), { vehicleCurbApproach: 0, geometry: vertexGeom });
		return vertex;
	}
	NetworkAnalysisTool.prototype._getSelectedBarriers = function(scenarioId)
	{
		var self = this;

		var pointbarriers = new self._arcgis.FeatureSet();
		var linebarriers = new self._arcgis.FeatureSet();
		var polygonbarriers = new self._arcgis.FeatureSet();

		var allBarriers = [pointbarriers, linebarriers, polygonbarriers];
		var queryPromise = tf.startup.loadArcgisUrls().then(function()
		{
			return TF.queryTravelSCenarios(scenarioId)
		});

		return queryPromise.then(function(res)
		{
			if (res && res[1])
			{
				res[1].forEach(function(graphic)
				{
					var barrier = new self._arcgis.Graphic();
					barrier.geometry = self._arcgis.webMercatorUtils.webMercatorToGeographic(graphic.geometry);
					var type = graphic.attributes.Type == 2 ? 0 : 1;
					var weight = graphic.attributes.Weight;
					barrier.attributes = {
						"BarrierType": type,
						//"Attr_Time": weight,
						"isChangeTime": graphic.attributes.IsChangeTime
					};
					if (self.drawTool._impedanceAttribute == "Length")
					{
						barrier.attributes["Attr_Length"] = weight.toFixed(2);
					} else
					{
						barrier.attributes["Attr_Time"] = weight.toFixed(2);
					}
					polygonbarriers.features.push(barrier);
				}, this);
			}

			let curbs = res && res[0];
			if (!curbs || !curbs.length)
			{
				return;
			}

			return TF.StreetHelper.getStreetsByIds(curbs.map(i => i.attributes.StreetSegmentID), "file").then(streets =>
			{
				let streetMap = {};
				streets.forEach(i => streetMap[i.OBJECTID] = i);
				curbs.forEach(curb =>
				{
					let barrier = new self._arcgis.Graphic(curb.geometry, new self._arcgis.SimpleMarkerSymbol()),
						street = streetMap[curb.attributes.StreetSegmentID];
					if (street && street.geometry && street.geometry.paths && street.geometry.paths[0])
					{
						const curbPoint = [curb.geometry.x, curb.geometry.y], rightSide = curb.attributes.SideOfStreet === 1;
						const offsetPoint = TF.RoutingMap.MapEditingPalette.MyStreetsHelper.getOffsetStreetCurbPoint(curbPoint, rightSide, street);
						if (offsetPoint && offsetPoint[0] && offsetPoint[1])
						{
							curb.geometry = new self._arcgis.Point({ x: offsetPoint[0], y: offsetPoint[1], spatialReference: curb.geometry.spatialReference });
						}
					}

					barrier.geometry = self._arcgis.webMercatorUtils.webMercatorToGeographic(curb.geometry);//there is an esri bug if geometry is 102100, so project it to 4326.
					var fullEdge = curb.attributes.Type == 0 ? true : false;
					barrier.attributes = {
						"FullEdge": fullEdge,
						"BarrierType": curb.attributes.Type,
						"Attr_Time": 0.1,
						"SideOfEdge": curb.attributes.SideOfStreet,
						"CurbApproach": 1,
						"SourceOID": curb.attributes.StreetSegmentID,
						"SourceID": tf.streetSourceOid,
						"PosAlong": 0.474451,
					};
					pointbarriers.features.push(barrier);
				});
			});
		}).then(() => allBarriers);
	};
	NetworkAnalysisTool.prototype._notifyTripPathChange = function(beforeStop, newStop, pathSegments, errMessage)
	{
		var self = this;
		var results = [];
		var trip = self.dataModel.getTripById(newStop.TripId);
		if (pathSegments.length == 0)
		{
			pathSegments.push({
				geometry: new self._arcgis.Polyline(self._map.mapView.spatialReference).addPath([])
			});
		}
		if (beforeStop)
		{
			beforeStop.DrivingDirections = pathSegments[0].direction;
			beforeStop.RouteDrivingDirections = beforeStop.DrivingDirections;
			beforeStop.IsCustomDirection = false;
			beforeStop.Speed = parseFloat(pathSegments[0].time) ? (parseFloat(pathSegments[0].length) / parseFloat(pathSegments[0].time)) * 60 : 0;
			beforeStop.StreetSpeed = beforeStop.Speed;
			beforeStop.Distance = parseFloat(pathSegments[0].length) ? parseFloat(pathSegments[0].length) * 1 : 0;
			beforeStop.path.geometry = parseFloat(pathSegments[0].length) && pathSegments[0].geometry ? pathSegments[0].geometry : new self._arcgis.Polyline({ wkid: 102100, paths: [] });

			self.changeTripStopSpeedByDefaultSpeed([beforeStop], trip);
		}
		results.push(beforeStop);
		if (newStop)
		{
			if (newStop.Sequence == trip.FieldTripStops.length)
			{
				newStop.Speed = 0;
				newStop.Distance = 0;
				newStop.path = {
					geometry: new self._arcgis.Polyline(self._map.mapView.spatialReference).addPath([])
				};
			} else
			{
				newStop.DrivingDirections = pathSegments[pathSegments.length - 1].direction;
				newStop.RouteDrivingDirections = newStop.DrivingDirections;
				newStop.IsCustomDirection = false;
				newStop.Speed = parseFloat(pathSegments[pathSegments.length - 1].time) ? (parseFloat(pathSegments[pathSegments.length - 1].length) / parseFloat(pathSegments[pathSegments.length - 1].time)) * 60 : 0;
				newStop.StreetSpeed = newStop.Speed;
				newStop.Distance = parseFloat(pathSegments[pathSegments.length - 1].length) ? (parseFloat(pathSegments[pathSegments.length - 1].length)) * 1 : 0;
				newStop.path = {
					id: TF.createId(),
					OBJECTID: 0,
					type: "tripPath",
					TripId: newStop.TripId,
					TripStopId: newStop.id,
					geometry: parseFloat(pathSegments[pathSegments.length - 1].length) && pathSegments[pathSegments.length - 1].geometry ? pathSegments[pathSegments.length - 1].geometry : new self._arcgis.Polyline(self._map.mapView.spatialReference).addPath([])
				};
				self.changeTripStopSpeedByDefaultSpeed([newStop], trip);
			}
			results.push(newStop);
		}
		var response = { stops: results };
		if (errMessage) response.err = errMessage;
		PubSub.publish(topicCombine(pb.DATA_CHANGE, "stoppath"), results);
		return response;
	};

	NetworkAnalysisTool.prototype.refreshTripByMultiStops = function(tripStops, isBestSequence, isMove, isCurbApproachChange, isRecalculateTripPath, newTrip)
	{
		var self = this;
		if (tripStops.length < 2)
		{
			return Promise.resolve(tripStops);
		}
		return self.stopTool.attachClosetStreetToStop(tripStops.filter(function(tripStop) { return tripStop && !tripStop.StreetSegment })).then(function()
		{
			var stops = new self._arcgis.FeatureSet();
			var tripStopGraphics = [];
			tripStops.forEach(function(tripStop, index)
			{
				var stop = new self._arcgis.Graphic(self.getStopLocationGeom(tripStop), null,
					{
						StreetSegment: tripStop.StreetSegment,
						vehicleCurbApproach: tripStop.vehicleCurbApproach ? tripStop.vehicleCurbApproach : tripStop.VehicleCurbApproach,
						Name: tripStop.Sequence ? tripStop.Sequence : index + 1,
						SchoolLocation: tripStop.SchoolLocation
					});
				tripStopGraphics.push($.extend(true, {}, stop));
			});
			var promise = Promise.resolve([]);
			if (isCurbApproachChange && tripStops.length > 2)
			{
				promise = self._getVertexesCloseToStopOnPath(tripStops[0], tripStops[2]);
			} else if (isRecalculateTripPath && tripStops.length > 1)
			{
				promise = self._getVertexesCloseToStopOnPath(tripStops[0], tripStops[1]);
			}
			var routeParameters = self.initRouteParameters();
			var routeParamPromise = self._getRouteParameters(routeParameters, tripStops[0].TripId, newTrip);
			return Promise.all([promise, routeParamPromise]).then(function(res)
			{
				var vertexes = res[0];
				routeParameters = res[1];
				if (vertexes[0] && vertexes[0].geometry)
				{
					//tripStopGraphics[0].attributes.vehicleCurbApproach = 0;
					tripStopGraphics.unshift(vertexes[0]);
				}
				if (vertexes[1] && vertexes[1].geometry)
				{
					//vertexes[1].attributes.vehicleCurbApproach = tripStopGraphics[tripStopGraphics.length - 1].attributes.vehicleCurbApproach;
					tripStopGraphics.push(vertexes[1]);
				}
				stops.features = self._getStops(tripStopGraphics);
				routeParameters.stops = stops;
				routeParameters.restrictUTurns = self.drawTool._uTurnPolicy ? self.drawTool._uTurnPolicy : self.stopTool._getUturnPolicy(tf.storageManager.get("uTurnPolicyRouting"));
				routeParameters.ignoreInvalidLocations = false;
				routeParameters.findBestSequence = isBestSequence ? true : false;
				// = self._getRouteParameters(routeParameters, tripStops[0].TripId, newTrip);

				return self.solve(routeParameters).then(function(result)
				{
					if (!result.routeResults)
					{
						return Promise.resolve({ stops: false, err: "No route found!" });
					}

					return TF.RoutingMap.MapEditingPalette.MyStreetsHelper.crossRailwayWarning(result).then(function()
					{
						if (isBestSequence)
						{
							tripStops = self._sortStops(tripStops, result.routeResults[0]);
						}
						self.recalculateDirectionTimeWithBarriers(result, routeParameters.polygonBarriers);
						var pathSegments = self._createPathSegments(result);
						if (isCurbApproachChange || isRecalculateTripPath)
						{
							pathSegments = self._updatePathSegments(pathSegments, vertexes);
						}
						tripStops = self._createTripStops(tripStops, pathSegments, newTrip);
						self.drawTool && self.drawTool._clearTempDrawing && self.drawTool._clearTempDrawing();
						return Promise.resolve(tripStops);
					});
				}, function(err)
				{
					if (err.details.messages && err.details.messages.length > 0)
					{
						if (err.details.messages[0].indexOf("No solution found.") > 0 || err.details.messages[0].indexOf("Invalid locations detected") > 0)
						{
							tf.promiseBootbox.alert(self._getAlertMessage(err));
							return self.refreshTripByStopsSeperately(tripStops, routeParameters);
						}
						return Promise.resolve({ stops: false, err: self._getAlertMessage(err) });
					}
					return Promise.resolve({ stops: false, err: self._getAlertMessage(err) });
				}, self);
			}).catch(e => ({ err: e.message }));
		});
	};

	NetworkAnalysisTool.prototype.alertSolveFailedMessage = function(err)
	{
		tf.promiseBootbox.alert(this._getAlertMessage(err));
	};

	//if refresh path fail, will solve path one by one for each stop
	NetworkAnalysisTool.prototype.refreshTripByStopsSeperately = function(tripStops, routeParams)
	{
		var self = this,
			index = 0,
			resolve = null,
			errMessage = null,
			promise = new Promise(function(solve) { resolve = solve; });

		function solveRequest()
		{
			if (index < tripStops.length - 1)
			{
				var tripStopGraphics = [];
				[tripStops[index], tripStops[index + 1]].forEach(function(tripStop)
				{
					var stop = new self._arcgis.Graphic(self.getStopLocationGeom(tripStop), null,
						{
							StreetSegment: tripStop.StreetSegment,
							vehicleCurbApproach: tripStop.vehicleCurbApproach,
							Name: tripStop.Sequence ? tripStop.Sequence : index + 1,
							SchoolLocation: tripStop.SchoolLocation
						});
					tripStopGraphics.push($.extend(true, {}, stop));
				});
				var routeParameters = self.initRouteParameters();
				routeParameters.polygonBarriers = routeParams.polygonBarriers;
				routeParameters.pointBarriers = routeParams.pointBarriers;
				routeParameters.restrictionAttributes = routeParams.restrictionAttributes;
				let beforeStop = tripStops[index - 1] ? tripStops[index - 1] : self._getBeforeStop(tripStops[index]);
				var vertexPromise = self._getVertexesCloseToStopOnPathSeperately(beforeStop, tripStops[index]);
				return Promise.all([vertexPromise]).then(function(res)
				{
					var vertex = res[0];
					if (vertex && vertex.geometry)
					{
						tripStopGraphics.unshift(vertex);
					}
					var stops = new self._arcgis.FeatureSet();
					stops.features = self._getStops(tripStopGraphics);
					routeParameters.stops = stops;
					if (self.drawTool)
					{
						routeParameters.restrictUTurns = self.drawTool._uTurnPolicy;
					}
					routeParameters.ignoreInvalidLocations = false;
					routeParameters.findBestSequence = false;
					return self._router.solve(routeParameters).then(function(result)
					{
						if (!result.routeResults)
						{
							tripStops[index].path = {
								id: TF.createId(),
								OBJECTID: 0,
								type: "tripPath",
								TripId: tripStops[index].tripId,
								TripStopId: tripStops[index].id,
								geometry: new self._arcgis.Polyline({ spatialReference: { wkid: 102100 } })
							};
						} else
						{
							self.recalculateDirectionTimeWithBarriers(result, routeParameters.polygonBarriers);
							var pathSegments = self._createPathSegments(result);
							pathSegments = self._updatePathSegments(pathSegments, [vertex, null]);
							tripStops[index] = self._createTripStops([tripStops[index]], pathSegments)[0];
						}
						index++;
						solveRequest();
						return promise;
					}, function(err)
					{
						errMessage = err;
						tripStops[index].path = {
							id: TF.createId(),
							OBJECTID: 0,
							type: "tripPath",
							TripId: tripStops[index].tripId,
							TripStopId: tripStops[index].id,
							geometry: new self._arcgis.Polyline({ spatialReference: { wkid: 102100 } })
						};
						tripStops[index].Distance = 0;
						tripStops[index].DrivingDirections = "";
						tripStops[index].Speed = 0;
						index++;
						solveRequest();
						return promise;
					})
				})
			}
			else
			{
				return resolve(tripStops);
			}
		}
		return solveRequest().then(function(tripStops)
		{
			return tripStops;
		})
	}

	NetworkAnalysisTool.prototype.recalcuteDirectionLengthWithBarriers = function(results, barriers)
	{
		var self = this;
		var travelregions = barriers && barriers.features ? barriers.features : [];
		var direction = results.routeResults[0].directions;
		var totalAddedLength = 0;
		direction.features.forEach(function(feature)
		{
			if (feature.attributes && feature.attributes.length != 0)
			{
				var geometry = feature.geometry;
				var addedLength = 0;
				travelregions.forEach(function(tr)
				{
					if (tr.attributes.BarrierType == 1 && !tr.attributes.isChangeTime)
					{
						var travelRegionGeom = tr.geometry;
						if (tr.geometry.spatialReference.wkid != 102100)
						{
							travelRegionGeom = self._arcgis.webMercatorUtils.geographicToWebMercator(travelRegionGeom);
						}
						var affectedroute = self._arcgis.geometryEngine.intersect(travelRegionGeom, geometry);
						if (affectedroute)
						{
							var affectedFactor = tr.attributes.Attr_Length;
							var affectedSegLength = self._arcgis.geometryEngine.geodesicLength(affectedroute, "miles");
							//var normalSegLength = feature.attributes.length - affectedSegLength;
							//var actualLength = normalSegLength + affectedSegLength * affectedFactor;
							addedLength = affectedSegLength - affectedSegLength * affectedFactor;
						}
					}
				})
				feature.attributes.length = feature.attributes.length + addedLength;
				totalAddedLength = totalAddedLength + addedLength;
			}
		})
		if (direction.summary)
		{
			direction.summary.totalLength = direction.summary.totalLength + totalAddedLength;
		}
		direction.totalLength = direction.totalLength + totalAddedLength;
	}

	NetworkAnalysisTool.prototype.recalculateDirectionTimeWithBarriers = function(results, barriers)
	{
		var self = this;
		if (!results.routeResults) return;
		if (self.drawTool._impedanceAttribute == "Length") { return self.recalcuteDirectionLengthWithBarriers(results, barriers); }
		var travelregions = barriers && barriers.features ? barriers.features : [];
		var direction = results.routeResults[0].directions;
		var totalAddedTime = 0;
		direction.features.forEach(function(feature)
		{
			if (feature.attributes && feature.attributes.length != 0)
			{
				var geometry = feature.geometry;
				var addedtime = 0;
				travelregions.forEach(function(tr)
				{
					if (tr.attributes.BarrierType == 1 && !tr.attributes.isChangeTime)
					{
						var travelRegionGeom = tr.geometry;
						if (tr.geometry.spatialReference.wkid != 102100)
						{
							travelRegionGeom = self._arcgis.webMercatorUtils.geographicToWebMercator(travelRegionGeom);
						}
						var affectedroute = self._arcgis.geometryEngine.intersect(travelRegionGeom, geometry);
						if (affectedroute)
						{
							var affectedFactor = tr.attributes.Attr_Time;
							var affectedSegLength = self._arcgis.geometryEngine.geodesicLength(affectedroute, "miles");
							var normalSegLength = feature.attributes.length - affectedSegLength;
							var actualspped = (normalSegLength + affectedSegLength * affectedFactor) / feature.attributes.time;
							var actualtime = (affectedSegLength / actualspped);
							addedtime = addedtime + actualtime * (1 - tr.attributes.Attr_Time);
						}
					}
				})
				feature.attributes.time = feature.attributes.time + addedtime;
				totalAddedTime = totalAddedTime + addedtime;
			}
		})
		if (direction.summary)
		{
			direction.summary.totalTime = direction.summary.totalTime + totalAddedTime;
		}
		direction.totalTime = direction.totalTime + totalAddedTime;
	}

	NetworkAnalysisTool.prototype.refreshTripByAddMultiStopsSmart = function(newTripStops, currentTripStops, newTrip)
	{
		var self = this;
		var alltripStops = [];
		var session = newTrip ? newTrip.Session : self.dataModel.getTripById(currentTripStops[0].tripId).Session;
		if (session == 1)
		{
			alltripStops = [currentTripStops[0]].concat(newTripStops).concat(currentTripStops.slice(1, currentTripStops.length - 1))
		} else
		{
			alltripStops = currentTripStops.slice(0, currentTripStops.length - 1).concat(newTripStops).concat(currentTripStops.slice(currentTripStops.length - 1));
		}

		return self.refreshTripByMultiStops(alltripStops, true, null, null, null, newTrip);
	};

	NetworkAnalysisTool.prototype.getStopLocationGeom = function(stop)
	{
		var schoolLocation = stop.attributes ? stop.attributes.SchoolLocation : stop.SchoolLocation;
		if (schoolLocation && schoolLocation.geometry)
		{
			return schoolLocation.geometry;
		}

		return stop.geometry;
	}

	NetworkAnalysisTool.prototype._createPathSegments = function(result)
	{
		var self = this, pathSegments = [];
		var stopToStopPathGeometry = new tf.map.ArcGIS.Polyline({ spatialReference: { wkid: 102100 } });
		var stopToStopPathDirections = "";
		stopToStopPathGeometry.paths = [
			[]
		];
		var stopToStopPathLength = 0;
		var stopToStopPathTime = 0;
		if (result && result.routeResults)
		{
			result.routeResults[0].directions.features.forEach(function(feature)
			{
				if (feature.attributes.maneuverType == "esriDMTStop")
				{
					pathSegments.push({
						geometry: TF.cloneGeometry(stopToStopPathGeometry),
						length: stopToStopPathLength.toString(),
						time: stopToStopPathTime.toString(),
						direction: stopToStopPathDirections
					});
					stopToStopPathGeometry.paths[0] = [];
					stopToStopPathLength = 0;
					stopToStopPathTime = 0;
					stopToStopPathDirections = "";
				}

				if (feature.attributes.maneuverType == "railroadStop")
				{
					stopToStopPathDirections += "WARNING CROSS OVER RAILROAD.\n";
				}
				else if (feature.attributes.maneuverType != "esriDMTDepart" && feature.attributes.maneuverType != "esriDMTStop")
				{
					stopToStopPathDirections += feature.attributes.text + " " + feature.attributes.length.toFixed(2) + " km. \n";
				}
				stopToStopPathGeometry.paths[0] = stopToStopPathGeometry.paths[0].concat(feature.geometry.paths[0]);
				stopToStopPathLength += feature.attributes.length;
				stopToStopPathTime += feature.attributes.time;
			});
		}
		else
		{
			pathSegments.push({
				geometry: new self._arcgis.Polyline(self._map.mapView.spatialReference).addPath([])
			});
		}
		return pathSegments;
	}

	NetworkAnalysisTool.prototype._updatePathSegments = function(pathSegments, vertexes)
	{
		if (vertexes && vertexes[0] && vertexes[0].geometry)
		{
			var firstSegmentGeom = this._arcgis.geometryEngine.simplify(pathSegments[0].geometry);
			if (firstSegmentGeom && firstSegmentGeom.paths[0].length > 2 && pathSegments[0] && pathSegments[1])
			{
				firstSegmentGeom.removePoint(0, 0);
				var allPoints = [];
				firstSegmentGeom.paths.forEach(function(path)
				{
					allPoints = allPoints.concat(path);
				});
				pathSegments[1].geometry.paths[0] = allPoints.concat(pathSegments[1].geometry.paths[0]);
				pathSegments[1].length = parseFloat(pathSegments[0].length) + parseFloat(pathSegments[1].length);
				pathSegments[1].time = parseFloat(pathSegments[0].time) + parseFloat(pathSegments[1].time);
			}
			pathSegments = pathSegments.slice(1, pathSegments.length);
		}
		if (vertexes && vertexes[1] && vertexes[1].geometry)
		{
			var lastSegmentGeom = this._arcgis.geometryEngine.simplify(pathSegments[pathSegments.length - 1].geometry);
			if (lastSegmentGeom && lastSegmentGeom.paths[0].length > 2 && pathSegments[pathSegments.length - 2] && pathSegments[pathSegments.length - 1])
			{
				lastSegmentGeom.removePoint(0, lastSegmentGeom.paths[0].length - 1);
				lastSegmentGeom.paths.forEach(function(path)
				{
					pathSegments[pathSegments.length - 2].geometry.paths[0] = pathSegments[pathSegments.length - 2].geometry.paths[0].concat(path);
				});
				pathSegments[pathSegments.length - 2].length = parseFloat(pathSegments[pathSegments.length - 2].length) + parseFloat(pathSegments[pathSegments.length - 1].length);
				pathSegments[pathSegments.length - 2].time = parseFloat(pathSegments[pathSegments.length - 2].time) + parseFloat(pathSegments[pathSegments.length - 1].time);
			}
			pathSegments = pathSegments.slice(0, pathSegments.length - 1);
		}
		return pathSegments;
	}

	NetworkAnalysisTool.prototype._createTripStops = function(tripStops, pathSegments, newTrip)
	{
		var self = this;
		tripStops.forEach(function(stop, index)
		{
			if (pathSegments[index] && !stop.failedStop)
			{
				stop.DrivingDirections = pathSegments[index].direction;
				stop.RouteDrivingDirections = stop.DrivingDirections;
				stop.IsCustomDirection = false;
				stop.Speed = (pathSegments[index].time && pathSegments[index].time != 0) ? (pathSegments[index].length / pathSegments[index].time) * 60 : 0;
				stop.StreetSpeed = stop.Speed;
				stop.Distance = pathSegments[index].length ? pathSegments[index].length * 1 : -1;
				stop.path = $.extend({
					id: TF.createId(),
					OBJECTID: 0,
					type: "tripPath",
					TripId: stop.tripId,
					TripStopId: stop.id,
				}, stop.path, {
					geometry: pathSegments[index].geometry ? pathSegments[index].geometry : {},
					AvgSpeed: stop.Speed ? stop.Speed : 0,
					Dist: stop.Distance
				});
				self.changeTripStopSpeedByDefaultSpeed([stop], newTrip);
			} else if (stop.failedStop || self._isLastStop(stop, tripStops))
			{
				stop.path = {};
				stop.Distance = 0;
				stop.Speed = 0;
				stop.DrivingDirections = "";
			}
		});
		PubSub.publish(topicCombine(pb.DATA_CHANGE, "stoppath"), tripStops);
		return tripStops;
	};

	NetworkAnalysisTool.prototype.changeTripStopSpeedByDefaultSpeed = function(stops, trip)
	{
		if (!trip && stops.length > 0 && this.dataModel.trips)
		{
			trip = this.dataModel.trips.find(t => t.id === stops[0].TripId)
		}

		if (stops.length > 0 &&
			trip &&
			trip.SpeedType == TF.Enums.RoutingSpeedType.DefaultSpeed)
		{
			var avgSpeed = trip.DefaultSpeed;
			stops.forEach((stop) =>
			{
				if (stop.path && stop.path.geometry)
				{
					stop.Speed = avgSpeed;
					stop.path.AvgSpeed = avgSpeed;
				} else
				{
					stop.Speed = 0;
				}
			});
		}
	};

	NetworkAnalysisTool.prototype._getStops = function(stops)
	{
		var self = this;
		var routingStops = [];
		stops.forEach(function(stop, index)
		{
			var curbApproach = 0;
			if (stop.attributes && stop.attributes.vehicleCurbApproach >= 0) curbApproach = stop.attributes.vehicleCurbApproach;
			else if (stop.vehicleCurbApproach) curbApproach = stop.vehicleCurbApproach;

			if (self.drawTool._uTurnPolicy != "allow-backtrack" && curbApproach == 0)
			{
				curbApproach = 3;
			}
			var attributes = {
				curbApproach: curbApproach,
				Name: parseInt(index) + 1 //RW-39325
			};
			attributes = self._appendNetWorkLocationAttributes(stop, attributes);
			var _stop = new self._arcgis.Graphic(self.getStopLocationGeom(stop), null, attributes);
			routingStops.push(_stop);
		});
		return routingStops;
	};

	NetworkAnalysisTool.prototype._appendNetWorkLocationAttributes = function(stop, attr)
	{
		var self = this;
		var streetSegment = stop.attributes ? stop.attributes.StreetSegment : stop.StreetSegment;
		var schoolLocation = stop.attributes ? stop.attributes.SchoolLocation : stop.SchoolLocation;
		var SideOfEdge = stop.attributes && stop.attributes.SideOfEdge ? stop.attributes.SideOfEdge : null;

		if (streetSegment &&
			(SideOfEdge || (!(self._arcgis.geometryEngine.intersects(stop.geometry, streetSegment.geometry) && !SideOfEdge))))
		{
			if (schoolLocation)
			{
				attr.SideOfEdge = self.stopTool._isPointOnRightOfLine(streetSegment.geometry, schoolLocation.geometry) ? 1 : 2;
				attr.PosAlong = self.stopTool.getPosAlong(schoolLocation.geometry, streetSegment.geometry)
			} else
			{
				attr.SideOfEdge = SideOfEdge ? SideOfEdge : self.stopTool._isPointOnRightOfLine(streetSegment.geometry, stop.geometry) ? 1 : 2;
				attr.PosAlong = self.stopTool.getPosAlong(stop.geometry, streetSegment.geometry);
			}
			attr.SourceOID = streetSegment.OBJECTID;
			attr.SourceID = tf.streetSourceOid;

		}
		return attr;
	}

	NetworkAnalysisTool.prototype._sortStops = function(stops, routeResult)
	{
		var self = this,
			tripStops = [],
			finishedStopReached = false,
			errorTripStops = [],
			errorTripStopsIndexes = [];
		var routeStops = routeResult.stops.sort(function(a, b) { return a.attributes.Sequence - b.attributes.Sequence })
		routeStops.forEach(function(stop)
		{
			if (!finishedStopReached)
			{
				stops[stop.attributes.Name - 1].failedStop = false;
				tripStops.push(stops[stop.attributes.Name - 1]);
			} else
			{
				stops[stop.attributes.Name - 1].failedStop = true;
				stops[stop.attributes.Name - 1].path = {
					geometry: new self._arcgis.Polyline(self._map.mapView.spatialReference).addPath([])
				};
				errorTripStops.push(stops[stop.attributes.Name - 1]);
				errorTripStopsIndexes.push(stop.attributes.Name - 1);
			}
			if (parseInt(stop.attributes.Name - 1) == stops.length - 1)
			{
				finishedStopReached = true;
			}
		});

		tripStops = tripStops.slice(0, tripStops.length - 1).concat(errorTripStops).concat(tripStops[tripStops.length - 1]);
		return tripStops;
	};

	NetworkAnalysisTool.prototype._isLastStop = function(stop, allStops)
	{
		var self = this;
		if (!self.dataModel)
		{
			return stop.Sequence == allStops.length;
		}
		if (self.dataModel.getTripById(stop.TripId) && self.dataModel.getTripById(stop.TripId).FieldTripStops.length == stop.Sequence)
			return true;
		return false;
	};

	NetworkAnalysisTool.prototype._getAcrossStreetStudents = function(tripStop, students, isInit, trip, isAssignStudent)
	{
		var self = this;
		var stop = $.extend({}, tripStop);
		if (stop.type == "tripStop")
		{
			if (!trip)
			{
				trip = self.drawTool.dataModel.getTripById(tripStop.TripId);
			}
			var _stop = tripStop.Sequence == 1 ? trip.FieldTripStops[0] : trip.FieldTripStops[tripStop.Sequence - 2];
			if (_stop && _stop.path && _stop.path.geometry && self._arcgis.geometryEngine.simplify(_stop.path.geometry)
				&& _stop.path.geometry.paths && _stop.path.geometry.paths[0])
			{
				if (!self._arcgis.geometryEngine.intersects(_stop.path.geometry, stop.geometry) && stop.StreetSegment &&
					(stop.vehicleCurbApproach == 2 || (stop.vehicleCurbApproach == 0 && !self._isPointOnRightOfLine(_stop.path.geometry, stop.geometry))))
				{

					stop.geometry = self.stopTool.getOppositePoint(stop.geometry, stop.StreetSegment.geometry);
				}
			}

		}
		var tripStopBoundary = tripStop && tripStop.boundary && tripStop.boundary.geometry;
		if (!tripStopBoundary)
		{
			tripStopBoundary = self.getStopBoundaryBuffer(tripStop);
		}
		if (students.length > 0)
		{
			return new TF.CrossStreetHelper().calculateCross(stop, students).then(results =>
			{
				let crossIds = [], studentsNeedToUnassign = [], stopCrosserIds = [];
				results.forEach((result, index) =>
				{
					if (result.isCross)
					{
						crossIds.push(students[index].id);
						if (result.isStopCrosser)
						{
							stopCrosserIds.push(result.id);
						}
						if (result.isUnassign) studentsNeedToUnassign.push(result.id);
					}
				});
				return [crossIds, studentsNeedToUnassign, {}, stopCrosserIds];
			})
		}
		return Promise.resolve([[], []]);
	};



	NetworkAnalysisTool.prototype.getStopBoundaryBuffer = function(tripStop)
	{
		return new tf.map.ArcGIS.geometryEngine.buffer(tripStop.geometry, DISTANCE_THRESHOLD, "meters");
	}

	NetworkAnalysisTool.prototype.setStopStreets = function(stops)
	{
		var geometries = [];
		stops.forEach((stop) =>
		{
			if (stop.boundary && stop.boundary.geometry)
			{
				if (stop.vehicleCurbApproach != 1)
				{
					geometries.push(new tf.map.ArcGIS.geometryEngine.geodesicBuffer(stop.geometry, 100, "meters"));
				}
				geometries.push(stop.boundary.geometry.extent);
			}
		});
		this._stopStreetsBoundary = tf.map.ArcGIS.geometryEngine.union(geometries);
		return TF.StreetHelper.getStreetInExtent(this._stopStreetsBoundary, "file").then((streets) =>
		{
			this._stopStreets = streets;
			return streets;
		});
	};

	NetworkAnalysisTool.prototype.removeStopStreets = function()
	{
		this._stopStreetsBoundary = null;
		this._stopStreets = null;
	};

	NetworkAnalysisTool.prototype._isPointOnRightOfLine = function(line, point)
	{
		var self = this;
		if (!line)
		{
			return false;
		}
		line = self._arcgis.geometryEngine.simplify(line);
		if (!(line && line.paths && line.paths[0] && line.paths[0].length > 0)) { return false; }
		var segments = [];
		var mindistance = null, minSeg = null;
		for (var i = 0; i < line.paths[0].length - 1; i++)
		{
			var polyline = new self._arcgis.Polyline({ spatialReference: self._map.mapView.spatialReference, paths: [[line.paths[0][i], line.paths[0][i + 1]]] });
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

	NetworkAnalysisTool.prototype._getAlertMessage = function(err)
	{
		let stopErrMessage = [];
		let message = "Cannot solve path.";
		if (err.stops && err.stops.length > 1)
		{
			message += " No solution found from Stop " + err.stops[0] + " to stop " + err.stops[1] + "."
			return message;
		}
		if (err.details.messages && err.details.messages.length > 0 && !err.stops)
		{
			let infos = err.details.messages[0].split(".");
			if (err.details.messages[0].indexOf("No solution found.") > 0)
			{
				for (let i = 0; i < infos.length; i++)
				{
					if (infos[i].indexOf("No route from location") >= 0 && infos[i].indexOf("to location") > 0)
					{
						const stopIndexes = infos[i].match(/\d+/g).map(Number);
						stopErrMessage.push(" No solution found from Stop " + (stopIndexes[0]) + " to stop " + (stopIndexes[1]) + ".");
					}
				}
				if (stopErrMessage.length > 0)
				{
					message += stopErrMessage.join(".")
					return message;
				}
			}
			if (err.details.messages[0].indexOf("Invalid locations detected") > 0)
			{

				for (let i = 0; i < infos.length; i++)
				{
					if (infos[i].indexOf("Location") >= 0 && infos[i].indexOf("unlocated") > 0)
					{
						const stopIndexes = infos[i].match(/\d+/g).map(Number);
						stopErrMessage.push(" stop " + (stopIndexes[0]));
					}
				}
				if (stopErrMessage.length > 0)
				{
					message += " Invalid" + stopErrMessage.join(",") + "."
					return message;
				}
			}
		}
		return message + " Please check your Routing Settings.";
	};

	NetworkAnalysisTool.prototype.solve = function(params)
	{
		var self = this;
		return tf.startup.loadArcgisUrls().then(function()
		{
			self._router.url = arcgisUrls.LocalRouteFile;
			return Promise.resolve(self._router.solve(params))
		})

	}

	NetworkAnalysisTool.prototype.getSmartAssignment = function(tripStop, trips)
	{
		var self = this, promises = [];
		tf.loadingIndicator.show();
		trips = this.filterTripsByDistance(tripStop, trips);
		trips.forEach(function(trip)
		{
			const _trip = { ...trip };
			_trip.FieldTripStops = _trip.FieldTripStops.sort((a, b) => a.Sequence - b.Sequence).filter(s => s.id != tripStop.id).map((item, index) =>
			{
				return {
					...item,
					Sequence: index + 1
				}
			});
			promises.push(self._getSmartSequence(tripStop, _trip));
		});

		return Promise.all(promises).then(function(res)
		{
			tf.loadingIndicator.tryHide();
			if (res.filter(function(r) { return !r.err }).length == 0)
			{
				tripStop.TripId = res[0].insertTrip.id;
				tripStop.Sequence = TF.Helper.TripHelper.getTripStopInsertSequence(res[0].insertTrip.FieldTripStops, res[0].insertTrip.Session);
				return Promise.resolve(tripStop);
			}
			res = res.sort(function(a, b)
			{
				return a.distanceAdded - b.distanceAdded
			});
			tripStop.TripId = res[0].insertTrip.id;
			tripStop.Sequence = res[0].insertIndex + 1;
			return Promise.resolve(tripStop);
		})
	}

	NetworkAnalysisTool.prototype._getSmartSequence = function(newTripStop, trip)
	{
		var self = this, promises = [], vertexPromises = [], allStopsList = [];
		var router = new tf.map.ArcGIS.RouteTask(arcgisUrls.LocalRouteFile);
		var routeParameters = self.initRouteParameters();
		var routeParamPromise = self._getRouteParameters(routeParameters, trip.id);
		if (trip.FieldTripStops.length == 1)
		{
			var stop_before = trip.FieldTripStops[0];
			var stopBefore = new tf.map.ArcGIS.Graphic(stop_before.geometry, null, $.extend(true, {}, stop_before));
			var stopAfter = new tf.map.ArcGIS.Graphic(newTripStop.geometry, null, $.extend(true, {}, newTripStop));
			var allStops = [stopBefore, stopAfter];
			allStopsList.push(allStops);
		} else
		{
			for (var i = 0; i <= trip.FieldTripStops.length - 2; i++)
			{
				var stop_before = trip.FieldTripStops.filter(function(stop) { return stop.Sequence == i + 1 && stop.id != newTripStop.id })[0];
				var stop_after = trip.FieldTripStops.filter(function(stop) { return stop.Sequence == i + 2 && stop.id != newTripStop.id })[0];
				var stopBefore = new tf.map.ArcGIS.Graphic(stop_before.geometry, null, $.extend(true, {}, stop_before));
				var stopAfter = new tf.map.ArcGIS.Graphic(stop_after.geometry, null, $.extend(true, {}, stop_after));
				vertexPromises.push(self._getVertexesCloseToStopOnPath(stop_before, stop_after, trip));
				var allStops = [stopBefore, newTripStop, stopAfter];
				allStopsList.push(allStops);
			}
		}

		return Promise.all(vertexPromises.concat([routeParamPromise])).then(function(res)
		{
			var vertexesList = res.splice(0, res.length - 1);
			var routeParams = res[res.length - 1];
			vertexesList.forEach(function(vertexes, index)
			{
				if (vertexes[0])
				{
					//allStopsList[index][0].attributes.vehicleCurbApproach = 0;
					allStopsList[index].unshift(vertexes[0]);
				}
				if (vertexes[1])
				{
					//vertexes[1].attributes.vehicleCurbApproach = allStopsList[index][allStopsList[index].length - 1].attributes.vehicleCurbApproach;
					allStopsList[index].push(vertexes[1]);
				}
			});
			var stops = new self._arcgis.FeatureSet();
			stops.features = self._getStops(_.flatten(allStopsList));
			var routeParameters = self.initRouteParameters();
			routeParameters.pointBarriers = routeParams.barriers;
			routeParameters.polygonBarriers = routeParams.polygonBarriers;
			routeParameters.polylineBarriers = routeParams.linebarriers;
			routeParameters.restrictionAttributes = routeParams.restrictionAttributes;
			routeParameters.stops = stops;
			routeParameters.restrictUTurns = self.drawTool._uTurnPolicy;
			return router.solve(routeParameters)
				.then(function(data)
				{
					var results = self._formatDirectionResults(data, allStopsList);
					if (results.length == 1 && results[0].errMessage)
					{
						return [{ err: self._getAlertMessage(results[0].errMessage) }];
					}
					return results;
				}, function(err)
				{
					return [{ err: self._getAlertMessage(err) }];
				}).then(function(result)
				{
					return self._getMinDeltaPath(result, trip, routeParameters.polygonBarriers, newTripStop);
				});
		});
	};

	NetworkAnalysisTool.prototype.filterTripsByDistance = function(tripStop, trips)
	{
		var distanceInfoTrips = [];
		if (trips.length < 10)
		{
			return trips;
		}

		trips.forEach(trip =>
		{
			const _trip = { ...trip };
			distanceInfoTrips.push(_trip);
			var distance = 10000;
			trip.FieldTripStops.forEach(x =>
			{
				if ((x.path.geometry || x.geometry) && tripStop.geometry)
				{
					var pathGeometry = x.path.geometry && x.path.geometry.paths.length > 0 && x.path.geometry.paths[0].length > 0 ? x.path.geometry : null;
					const distanceToStop = tf.map.ArcGIS.geometryEngine.distance(tripStop.geometry, pathGeometry || x.geometry, "meters");
					if (distanceToStop < distance)
					{
						distance = distanceToStop;
					}
				}
			});
			_trip.distanceToStop = distance;
		});
		var sortedTrips = Enumerable.From(distanceInfoTrips).OrderBy(x => x.distanceToStop).ToArray();
		var filteredTrips = [];
		var closestTrips = [];
		const closestDistance = 200;
		const bufferDistance = 700;
		for (var i = 0; i < sortedTrips.length; i++)
		{
			if (sortedTrips[i].distanceToStop < closestDistance)
			{
				closestTrips.push(sortedTrips[i]);
			}
			if (i < 10 || ((sortedTrips[i].distanceToStop - sortedTrips[10].distanceToStop) < bufferDistance))
			{
				filteredTrips.push(sortedTrips[i]);
			}
		}

		if (closestTrips.length > 0) { return closestTrips; }
		if (filteredTrips.length > 0) { return filteredTrips; }
		return trips;
	};

	NetworkAnalysisTool.prototype._getMinDeltaPath = function(routingResults, trip, polygonBarriers, newTripStop)
	{
		var self = this, minDistAdded = Number.MAX_VALUE, minIndex = 0, minPrevPath, minPath, err;
		routingResults.forEach(function(path, index)
		{
			if (!path.err && path.routeResults)
			{
				self.recalculateDirectionTimeWithBarriers(path, polygonBarriers);
				var pathSegments = self._createPathSegmentsDelta(path);
				var delta = null;
				if (self.drawTool._impedanceAttribute == "Time")
				{
					delta = path.routeResults[0].directions.totalTime - (trip.FieldTripStops[index].Distance / trip.FieldTripStops[index].Speed) * 60;
				} else
				{
					delta = path.routeResults[0].directions.totalLength - trip.FieldTripStops[index].Distance;
				}
				if (self._isValidSequence(trip.FieldTripStops[index], newTripStop, trip) && delta < minDistAdded)
				{
					minDistAdded = delta;
					minIndex = index + 1;
					minPrevPath = pathSegments[0];
					minPath = pathSegments[1];
				}
			} else
			{
				err = path.err;
			}
		});
		var response = {
			distanceAdded: minDistAdded,
			insertIndex: minIndex,
			insertTrip: trip,
			prevPath: minPrevPath,
			newStopPath: minPath
		};
		if (!minPrevPath) response.err = err
		return response;
	}
	NetworkAnalysisTool.prototype._createPathSegmentsDelta = function(result)
	{
		var self = this, pathSegments = [];
		var stopToStopPathGeometry = new tf.map.ArcGIS.Polyline(new tf.map.ArcGIS.SpatialReference({
			wkid: 102100
		}));
		var stopToStopPathDirections = "";
		stopToStopPathGeometry.paths = [
			[]
		];
		var stopToStopPathLength = 0;
		var stopToStopPathTime = 0;
		if (result)
		{
			result.routeResults[0].directions.features.forEach(function(feature)
			{
				if (feature.attributes.maneuverType == "esriDMTStop")
				{
					pathSegments.push({
						geometry: TF.cloneGeometry(stopToStopPathGeometry),
						length: stopToStopPathLength.toString(),
						time: stopToStopPathTime.toString(),
						direction: stopToStopPathDirections
					});
					stopToStopPathGeometry.paths[0] = [];
					stopToStopPathLength = 0;
					stopToStopPathTime = 0;
					stopToStopPathDirections = "";
				}
				if (feature.attributes.maneuverType != "esriDMTDepart" && feature.attributes.maneuverType != "esriDMTStop")
				{
					stopToStopPathDirections += feature.attributes.text + " " + feature.attributes.length.toFixed(2) + " mi. \n";
				}
				stopToStopPathGeometry.paths[0] = stopToStopPathGeometry.paths[0].concat(feature.geometry.paths[0]);
				stopToStopPathLength += feature.attributes.length;
				stopToStopPathTime += feature.attributes.time;
			});
		} else
		{
			pathSegments.push({
				geometry: new tf.map.ArcGIS.Polyline(self._map.mapView.spatialReference).addPath([])
			});
		}
		return pathSegments;
	};

	NetworkAnalysisTool.prototype.generatePath = function(stops, trip, createType)
	{
		return this.stopTool.attachClosetStreetToStop(stops).then(() =>
		{
			var points = [];
			stops.forEach((tripStop, i) =>
			{
				var point = tripStop.geometry;
				var SideOfEdge = 0;
				var nextStop = i < stops.length - 1 ? stops[i + 1] : null;
				if (i == 0 && tripStop.StreetSegment)
				{
					SideOfEdge = this.stopTool._isPointOnRightOfLine(tripStop.StreetSegment.geometry, tripStop.geometry) ? 1 : 2;
				}
				else if (nextStop && i != 0 && nextStop.StreetSegment)
				{
					SideOfEdge = this.stopTool._isPointOnRightOfLine(nextStop.StreetSegment.geometry, nextStop.geometry) ? 1 : 2;
				}
				var graphic = new tf.map.ArcGIS.Graphic({
					geometry: point, attributes: {
						Sequence: i + 1,
						CurbApproach: createType == "GPS" ? 0 : 3,
						SideOfEdge: SideOfEdge,
						SourceOID: tripStop.StreetSegment.OBJECTID,
						SourceID: tf.streetSourceOid,
						PosAlong: this.stopTool.getPosAlong(tripStop.geometry, tripStop.StreetSegment.geometry)
					}
				});
				points.push(graphic);
				if (tripStop.wayPoints && createType == "GPS")
				{
					tripStop.wayPoints.forEach(wayPoint =>
					{
						points.push(new tf.map.ArcGIS.Graphic({
							geometry: wayPoint.geometry,
							attributes: {
								CurbApproach: 0,
								Name: "Ghost",
								LocationType: TF.RoutingMap.Directions.Enum.LocationTypeEnum.WAY_POINT,
							}
						}));
					});
				}
			});

			points.forEach((graphic, i) =>
			{
				graphic.attributes.Sequence = i + 1;
			});
			var stopsFeatureSet = new tf.map.ArcGIS.FeatureSet();
			stopsFeatureSet.features = points;
			var routeParameters = this.initRouteParameters();
			routeParameters.restrictUTurns = "allow-backtrack";
			routeParameters.ignoreInvalidLocations = false;
			routeParameters.findBestSequence = false;
			if (createType == "DISTANCE")
			{
				routeParameters.impedanceAttribute = "Length";
			}
			else
			{
				routeParameters.impedanceAttribute = "Time";
			}

			return this._getRouteParameters(routeParameters, null, trip).then(() =>
			{
				routeParameters.stops = stopsFeatureSet;
				return routeParameters;
			}).then((routeParameters) =>
			{
				return this._router.solve(routeParameters);
			}).then(result =>
			{
				this.recalculateDirectionTimeWithBarriers(result, routeParameters.polygonBarriers);
				var pathSegments = this._createPathSegments(result);
				var tripStops = this._createTripStops(stops, pathSegments, trip);
				return tripStops;
			}).catch(err =>
			{
				if (err.details && err.details.messages[0].indexOf("Invalid locations detected") > 0)
				{
					return this.refreshTripByStopsSeperately(stops, routeParameters);
				}
				throw err;
			});
		});
	};

})();
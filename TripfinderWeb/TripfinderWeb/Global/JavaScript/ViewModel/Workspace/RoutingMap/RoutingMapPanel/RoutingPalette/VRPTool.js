(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").VRPTool = VRPTool;

	function VRPTool()
	{
		var self = this;
		self._arcgis = tf.map.ArcGIS;
		self.vrpURL = arcgisUrls.TFUtilitiesGPService + "/VRPTool";
		var localRouteUrl = arcgisUrls.LocalRouteFile;
		self._router = new self._arcgis.RouteTask(localRouteUrl);
		self._routeParameters = new self._arcgis.RouteParameters();
		// self._routeParameters.outSpatialReference = self._webMercator;
		self._routeParameters.outputLines = "true-shape"; // the start point of route geometry is difference in round trip mode, use TRUE_SHAPE instead.
		self._routeParameters.returnRoutes = true;
		self._routeParameters.returnStops = true;
		self._routeParameters.returnDirections = true;
		self._routeParameters.returnPolygonBarriers = true;
		self._routeParameters.impedanceAttribute = "Time";
		self._routeParameters.restrictionAttributes = ["Oneway", "traversable"];
		self._routeParameters.directionsOutputType = "complete";
		self._routeParameters.preserveFirstStop = true;
		self._routeParameters.preserveLastStop = true;

		self.uturnDic = {
			"allow-backtrack": "ALLOW_UTURNS",
			"at-dead-ends-only": "ALLOW_DEAD_ENDS_ONLY",
			"at-dead-ends-and-intersections": "ALLOW_DEAD_ENDS_AND_INTERSECTIONS_ONLY",
			"no-backtrack": "NO_UTURNS"
		};

		self.errDic = {
			1: "MaxOrderCount exceeded",
			2: "Capacities exceeded",
			4: "MaxTotalTime exceeded",
			8: "MaxTotalTravelTime exceeded",
			16: "MaxTotalDistance exceeded",
			32: "MaxRidingTime exceeded",
			1024: "Unreachable"
		}

	}

	VRPTool.prototype.copyTrips = function(trips)
	{
		var copyTrips = [];
		trips.forEach(function(trip)
		{
			var newTrip = JSON.parse(JSON.stringify(trip));
			TF.loopCloneGeometry(newTrip, trip);
			copyTrips.push(newTrip);
		});
		return copyTrips;

	}
	VRPTool.prototype.getVRP = function(trips, drawTool)
	{
		var self = this;
		trips = self.copyTrips(trips);
		var tripStops = [], newTrips = [];
		trips.forEach(function(trip)
		{
			var newTrip = $.extend(true, {}, trip);
			if (trip.Session == 3)
			{
				// VRP for both trip, the depots is last from school stop and first to school stop, the orders is general stops
				newTrip.SchoolTripStops = trip.TripStops.filter(stop => stop.SchoolCode);
				let groups = Enumerable.From(newTrip.SchoolTripStops).GroupBy(stop => stop.SchoolCode);
				let firstSchoolStop = groups.Select(g => g.source.sort((a, b)=> a.Sequence > b.Sequence ? 1: -1)[0]).OrderBy(stop => stop.Sequence).Last();
				let lastSchoolStop = groups.Select(g => g.source.sort((a, b)=> a.Sequence < b.Sequence ? 1: -1)[0]).OrderBy(stop => stop.Sequence).First();
				newTrip.TripStops = [firstSchoolStop, lastSchoolStop];
				tripStops = tripStops.concat(trip.TripStops.filter(stop => !stop.SchoolCode));
			}
			else
			{
				tripStops = tripStops.concat(trip.TripStops.filter(function(stop) { return !stop.SchoolCode && (stop.Sequence != 1) && (stop.Sequence != trip.TripStops.length) }));
				newTrip.TripStops = trip.TripStops.filter(function(stop) { return stop.SchoolCode || stop.Sequence == 1 || stop.Sequence == trip.TripStops.length });
			}

			newTrips.push(newTrip);
		});
		if (tripStops.length == 0) return Promise.resolve(trips.map(function(trip) { return trip.TripStops; }));
		var requiredStops = newTrips[0].TripStops;
		var maxNumberofNewTrips = newTrips.length + 10;//tripStops.length - newTrips.length > 100 ? 100 : tripStops.length - newTrips.length;
		let baseId = TF.createId(); // baseId should be same, if not, sometimes the TF.createId() + i should be same by different trips
		for (var i = 0; i < maxNumberofNewTrips; i++)
		{
			var tripId = baseId + i;
			var _stops = requiredStops.map(function(stop, i)
			{
				var newStop = $.extend(true, {}, stop);
				newStop.vrpName = newStop.id + "_" + tripId;
				return newStop;

			});
			var newTrip = { id: tripId, TripStops: _stops };
			newTrips.push(newTrip);
		}
		var currentTrips = $.extend(true, [], newTrips);
		var tripSession = trips[0].Session;
		if (tripSession > 1)
		{
			// Calculate timeToLastStop
			let promises = [];
			promises.push(self._getTimeFromCurrentFirstToTripFirst(newTrips[0].TripStops[0], trips[0].TripStops[0]));
			promises.push(self._getTimeFromCurrentLastToTripLast(newTrips[0].TripStops[newTrips[0].TripStops.length - 1], trips[0].TripStops[trips[0].TripStops.length - 1]));
			return Promise.all(promises).then(timeToLastStop => {
				return self.getVRPSequence(tripStops, newTrips, drawTool, trips, timeToLastStop[0] + timeToLastStop[1]).then(function(results)
				{
					if (!results)
					{
						tf.loadingIndicator.tryHide();
						return tf.promiseBootbox.alert("VRP calculation failed!");
					}
					var vrpData = [];
					self._getCurrentTrips(results, currentTrips, drawTool).forEach(function(trip)
					{
						// Includes other school stops which are not calculated in VRP
						if (trip.SchoolTripStops)
						{
							let beforeSchoolStops = [], afterSchoolStops = [], isBeforeSchoolStop = true;
							trip.SchoolTripStops.forEach(stop => {
								var existingStop = trip.TripStops.filter(_stop => _stop.id == stop.id)[0];
								if (!existingStop)
								{
									if (isBeforeSchoolStop)
									{
										beforeSchoolStops.push(stop);
									}
									else
									{
										afterSchoolStops.push(stop);
									}
								}
								else
								{
									isBeforeSchoolStop = false;
								}
							});

							trip.TripStops = beforeSchoolStops.concat(trip.TripStops).concat(afterSchoolStops);
						}

						if (trip.TripStops.length > requiredStops.length) { vrpData.push(trip.TripStops) }
					})
					return vrpData;
				})
			});		
		}
		var resolve = null;
		var promise = new Promise(function(solve) { resolve = solve; });

		var schools = trips[0].TripStops.filter(function(stop) { return stop.SchoolCode && stop.SchoolCode.length > 0 });
		if (tripSession == 1) schools = schools.reverse();
		var schoolCount = schools.length;
		var schoolCodes = schools.map(function(stop) { return stop.SchoolCode });

		var i = 0, remainingStops = $.extend(true, [], tripStops), calculatedStops = [];
		function vrpRequest()
		{
			if (i < schoolCount)
			{
				var newStops = i == schoolCount - 1 ? remainingStops : self._getStopsBeforeSchool(remainingStops, schoolCodes[i]);
				var newTrips = tripSession == 1 ? self._getTripsAfterSchool(currentTrips, schoolCodes[i]) : self._getTripsBeforeSchool(currentTrips, schoolCodes[i]);
				var timePromise = tripSession == 1 ? self._getTimeFromCurrentFirstToTripFirst(newTrips[0].TripStops[0], trips[0].TripStops[0]) : self._getTimeFromCurrentLastToTripLast(newTrips[0].TripStops[newTrips[0].TripStops.length - 1], trips[0].TripStops[trips[0].TripStops.length - 1])
				return timePromise.then(function(timeToLastStop)
				{
					return self.getVRPSequence(newStops, newTrips, drawTool, currentTrips, timeToLastStop).then(function(results)
					{
						if (newStops.length == 0)
						{
							if (i < schoolCount - 1)
							{
								i++;
								vrpRequest();
								return promise;
							} else
							{
								return resolve(currentTrips);
							}
						}
						if (!results)
						{
							if (schoolCount == 1) return false;
							else { return resolve(currentTrips); }
						}
						if (tripSession == 1) results = self._appendSequenceOffsetVRP(results, newTrips);
						calculatedStops = [];// calculatedStops.concat(results);
						currentTrips = self._getCurrentTrips(results, currentTrips, drawTool);
						currentTrips.forEach(function(tripStops)
						{
							calculatedStops = calculatedStops.concat(tripStops);
						})
						if (i == schoolCount - 1)
						{
							if (schoolCount == 1) return currentTrips;
							else { return resolve(currentTrips); }
						}
						remainingStops = remainingStops.filter(function(rs) { return newStops.filter(function(ns) { return ns.id == rs.id }).length == 0 });


						i++;
						vrpRequest();

						return promise;

					});
				})

			}
		}

		return vrpRequest().then(function(results)
		{
			if (!results)
			{
				tf.loadingIndicator.tryHide();
				return tf.promiseBootbox.alert("VRP calculation failed!");
			}
			var vrpData = [];
			results.forEach(function(trip)
			{
				if (trips.filter(function(t) { return t.id == trip.id }).length > 0
					|| trip.TripStops.length > requiredStops.length)
				{
					vrpData.push(trip.TripStops);
				}
			});

			self._resolveFirstOrLastStopStudents(vrpData);
			return vrpData;
		})
	};

	// remove duplicated assigned students because first and last stop should not be changed during optimizing trip
	VRPTool.prototype._resolveFirstOrLastStopStudents = function(vrpData)
	{
		if (vrpData.length > 1)
		{
			let firstTrip = vrpData[0], firstTripStop = firstTrip[0], toSchool = true;
			if (firstTripStop.SchoolCode)
			{
				firstTripStop = firstTrip[firstTrip.length - 1];
				toSchool = false;
			}

			let assignedStudents = {};
			firstTripStop.Students.forEach(s =>
			{
				if (s.IsAssigned)
				{
					assignedStudents[s.id] = true;
				}
			});

			var otherTrips = vrpData.slice(1);
			otherTrips.forEach(t =>
			{
				let stop = toSchool ? t[0] : t[t.length - 1];
				stop.Students = stop.Students.filter(s => !assignedStudents[s.id]);
			});
		}
	};

	VRPTool.prototype._getTimeFromCurrentFirstToTripFirst = function(currentFirstStop, originFirstStop)
	{
		var self = this;
		if (currentFirstStop.id == originFirstStop.id) return Promise.resolve(0);
		else
		{
			var beforeStop = new self._arcgis.Graphic(originFirstStop.geometry, null, originFirstStop);
			var afterStop = new self._arcgis.Graphic(currentFirstStop.geometry, null, currentFirstStop);
			var stops = new self._arcgis.FeatureSet();
			stops.features = self._getStops([beforeStop, afterStop]);
			self._routeParameters.stops = stops;
			self._routeParameters.directionsTimeAttribute = "time";
			return self._router.solve(self._routeParameters).then(function(result)
			{
				if (result && result.routeResults)
				{
					return Promise.resolve(result.routeResults[0].directions.totalTime);
				}
				return Promise.resolve(0);
			}, function(err)
			{
				return Promise.resolve(0);
			});
		}
	}

	VRPTool.prototype._getTimeFromCurrentLastToTripLast = function(currentLastStop, originLastStop)
	{
		var self = this;

		if (currentLastStop.id == originLastStop.id) return Promise.resolve(0);
		else
		{
			var beforeStop = new self._arcgis.Graphic(currentLastStop.geometry, null, currentLastStop);
			var afterStop = new self._arcgis.Graphic(originLastStop.geometry, null, currentLastStop);
			var stops = new self._arcgis.FeatureSet();
			stops.features = self._getStops([beforeStop, afterStop]);
			self._routeParameters.stops = stops;
			return self._router.solve(self._routeParameters).then(function(result)
			{
				if (result && result.routeResults)
				{
					return Promise.resolve(result.routeResults[0].directions.totalTime);
				}
				return Promise.resolve(0);
			}, function(err)
			{
				return Promise.resolve(0);
			});
		}
	}

	VRPTool.prototype._getCurrentTrips = function(results, currentTrips, drawTool)
	{

		//var vrpData = [];
		results.forEach(function(tripStops)
		{
			var targetTrip = currentTrips.filter(function(trip) { return trip.id == tripStops[0].attributes.RouteName })[0];
			//var _stops = [];
			tripStops.forEach(function(stop)
			{
				if (stop.attributes.StopType != 0) return;
				var existingStop = targetTrip.TripStops.filter(function(_stop) { return _stop.id == stop.attributes.Name.split("_")[0] })[0];
				if (existingStop)
				{
					existingStop.Sequence = stop.attributes.Sequence;
					existingStop.Speed = stop.attributes.Sequence;
					existingStop.Distance = stop.Distance;
					existingStop.path.geometry = stop.path ? stop.path.geometry : new tf.map.ArcGIS.Polyline({ spatialReference: { wkid: 102100 }, paths: [] });
					existingStop.DrivingDirections = stop.DrivingDirections;
					existingStop.RouteDrivingDirections = existingStop.DrivingDirections;
					existingStop.IsCustomDirection = false;
				} else
				{
					var oldStop = $.extend(true, {}, drawTool.dataModel.getFieldTripStopByStopId(stop.attributes.Name));
					oldStop.Sequence = stop.attributes.Sequence;
					oldStop.Speed = stop.Speed;
					oldStop.Distance = stop.Distance;
					oldStop.TripId = targetTrip ? targetTrip.id : -1;
					if (!oldStop.path) oldStop.path = stop.path;
					if (oldStop.path) oldStop.path.geometry = stop.path ? stop.path.geometry : new tf.map.ArcGIS.Polyline({ spatialReference: { wkid: 102100 }, paths: [] });
					oldStop.DrivingDirections = stop.DrivingDirections;
					oldStop.RouteDrivingDirections = oldStop.DrivingDirections;
					oldStop.IsCustomDirection = false;
					targetTrip.TripStops = targetTrip.TripStops.slice(0, oldStop.Sequence - 1).concat(oldStop).concat(targetTrip.TripStops.slice(oldStop.Sequence - 1));
					targetTrip.TripStops.forEach(function(stop, i) { stop.Sequence = i + 1; });
				}

				//	_stops.push(oldStop);
			});
			//targetTrip.TripStops = _stops;
			//vrpData.push(_stops);
		})

		return currentTrips;
	}

	VRPTool.prototype.getStopLocationGeom = function(stop)
	{
		if (stop && stop.SchoolLocation && stop.SchoolLocation.geometry)
		{
			return stop.SchoolLocation.geometry;
		}
		return stop.geometry;
	}

	VRPTool.prototype.getVRPSequence = function(tripStops, trips, drawTool, currentTrips, timeToLastStop)
	{
		var self = this, isToSchool = trips[0].Session == 0;
		tf.loadingIndicator.show();
		return self._getVrpSettings(drawTool.dataModel, trips).then(function(settings)
		{
			var vrpURL = self.vrpURL;
			var processor = new self._arcgis.Geoprocessor(vrpURL);

			var orders = new self._arcgis.FeatureSet();
			var depots = new self._arcgis.FeatureSet();
			var routes = new self._arcgis.FeatureSet();

			var tripMinRidingTime = self._gettripMinTime(settings, timeToLastStop);
			var timeWindowStart = 1355252400000;// December 11, 2012 7:00:00 PM
			var timeWindowEnd = timeWindowStart + tripMinRidingTime * 60 * 1000;
			var earliestStartTime = 1355230800000;//December 11, 2012 1:00:00 PM
			var LatestStartTime = 1355317200000;//December 12, 2012 1:00:00 PM
			var totalTime = settings.vrpSettings.totalTime;
			var totalDistance = settings.vrpSettings.totalDistance;

			depots.features.push(new self._arcgis.Graphic({
				geometry: self._arcgis.webMercatorUtils.webMercatorToGeographic(self.getStopLocationGeom(trips[0].TripStops[0])),
				attributes: {
					Name: trips[0].TripStops[0].id,
					CurbApproach: trips[0].TripStops[0].vehicleCurbApproach,
					"TimeWindowStart1": isToSchool ? null : timeWindowStart,
					"TimeWindowEnd1": isToSchool ? null : timeWindowStart
				}
			}));
			if (trips[0].TripStops.length > 1)
			{
				depots.features.push(new self._arcgis.Graphic({
					geometry: self._arcgis.webMercatorUtils.webMercatorToGeographic(trips[0].TripStops[trips[0].TripStops.length - 1].geometry),
					attributes: {
						Name: trips[0].TripStops[trips[0].TripStops.length - 1].id,
						CurbApproach: trips[0].TripStops[trips[0].TripStops.length - 1].vehicleCurbApproach,
						"TimeWindowStart1": isToSchool ? timeWindowEnd : null,
						"TimeWindowEnd1": isToSchool ? timeWindowEnd : null
					}
				}));
			}
			//else
			// {
			// 	depots.features[0].attributes.TimeWindowStart1 = timeWindowStart;
			// 	depots.features[0].attributes.TimeWindowEnd1 = timeWindowEnd;
			// }

			for (var i = 0; i < trips.length; i++)
			{
				var polyline = new self._arcgis.Polyline({
					spatialReference: new self._arcgis.SpatialReference({
						wkid: 4326
					})
				});
				routes.features.push(new self._arcgis.Graphic({
					geometry: polyline,
					attributes: {
						Name: trips[i].id,
						StartDepotName: depots.features.length == 1 ? (isToSchool ? null : trips[0].TripStops[0].id) : trips[0].TripStops[0].id,
						EndDepotName: depots.features.length == 1 ? (isToSchool ? trips[0].TripStops[trips[0].TripStops.length - 1].id : null) : trips[0].TripStops[trips[0].TripStops.length - 1].id,
						"MaxOrderCount": 150,
						"MaxTotalTime": totalTime,
						"MaxTotalDistance": totalDistance,
						"Capacities": self._getCapacity(trips[i], settings),
						"EarliestStartTime": earliestStartTime, "LatestStartTime": LatestStartTime,
					}
				}));
				for (var j = 1; j < trips[i].TripStops.length - 1; j++)
				{
					var stop = trips[i].TripStops[j];
					var seatCount = self._getStopSeatCount(stop, settings);
					var serviceTime = TF.stopTimeToMinute(stop.TotalStopTime);
					var timeWindow = self._getStopTimeWindowVRP(stop, timeWindowStart, timeWindowEnd, settings, timeToLastStop, isToSchool);
					orders.features.push(new self._arcgis.Graphic({
						geometry: self._arcgis.webMercatorUtils.webMercatorToGeographic(self.getStopLocationGeom(stop)),
						attributes: {
							Name: stop.vrpName ? stop.vrpName : stop.id,
							RouteName: trips[i].id,
							PickupQuantities: isToSchool ? seatCount : 0,
							DeliveryQuantities: isToSchool ? 0 : seatCount,
							ServiceTime: serviceTime,
							Sequence: stop.Sequence,
							AssignmentRule: 1,
							"TimeWindowStart1": timeWindow[0],
							"TimeWindowEnd1": timeWindow[1],
							MaxViolationTime1: (timeWindow[0] && timeWindow[1]) ? 0 : null,
							CurbApproach: (drawTool._uTurnPolicy != "allow-backtrack" && stop.vehicleCurbApproach == 0) ? 3 : stop.vehicleCurbApproach,
						}
					}));
				}
			}
			var AssignmentRule = 3;
			// if (!isSmartSequence)
			// {
			// 	if (trips[0].Session == 0) { AssignmentRule = 5; }
			// 	else { AssignmentRule = 4; }
			// }

			tripStops.forEach(function(stop, i)
			{
				stop.orderName = stop.id;//"newStop_" + i;
				var timeWindow = self._getStopTimeWindowVRP(stop, timeWindowStart, timeWindowEnd, settings, timeToLastStop, isToSchool);
				var seatCount = self._getStopSeatCount(stop, settings);
				orders.features.push(new self._arcgis.Graphic({
					geometry: self._arcgis.webMercatorUtils.webMercatorToGeographic(self.getStopLocationGeom(stop)),
					attributes: {
						Name: stop.id,//"newStop_" + i,
						AssignmentRule: AssignmentRule,
						ServiceTime: TF.stopTimeToMinute(stop.TotalStopTime),
						PickupQuantities: isToSchool ? seatCount : 0,
						DeliveryQuantities: isToSchool ? 0 : seatCount,
						"TimeWindowStart1": timeWindow[0],
						"TimeWindowEnd1": timeWindow[1],
						MaxViolationTime1: (timeWindow[0] && timeWindow[1]) ? 0 : null,
						CurbApproach: (drawTool._uTurnPolicy != "allow-backtrack" && stop.vehicleCurbApproach == 0) ? 3 : stop.vehicleCurbApproach,
					}
				}));
			});

			return drawTool.NAtool._getSelectedBarriers(trips[0].TravelScenarioId).then(function(barriers)
			{
				var params = {
					orders: orders,
					depots: depots,
					routes: routes,
					point_barriers: barriers[0].features.length > 0 ? barriers[0] : null,
					line_barriers: barriers[1].features.length > 0 ? barriers[1] : null,
					polygon_barriers: barriers[2].features.length > 0 ? barriers[2] : null,
					'uturn_policy': self.uturnDic[drawTool._uTurnPolicy],
					"f": "pjson",
					"default_date": 1355212800000,
					"excess_transit_factor": "High",
					"spatially_cluster_routes": false,
					"restrictions": self._getRestrictions(trips[0].TravelScenarioId, drawTool),
					"time_attribute": "Time"
				};
				return params;

			}).then(function(params)
			{
				return tf.startup.loadArcgisUrls().then(function()
				{
					processor.url = arcgisUrls.TFUtilitiesGPService + "/VRPTool";
					params.folder_path = arcgisUrls.LinuxFolderRootPath ? arcgisUrls.LinuxFolderRootPath : arcgisUrls.FileGDBPath;
					params.active_folder = arcgisUrls.ActiveServiceFolderName;
					return processor.submitJob(params).then(function(jobInfo)
					{
						var jobid = jobInfo.jobId;
						return processor.waitForJobCompletion(jobid, {}).then(function(res)
						{
							return gpJobComplete(res)
						})
					})
				})
				function gpJobComplete(result)
				{
					if (result.jobStatus.indexOf("failed") >= 0)
					{
						return false;
					}
					var jobId = result.jobId;
					var resultNames = ["out_stops", "solve_succeeded", "out_unassigned_stops", "out_directions", "out_routes"];

					var promises = [];
					resultNames.forEach(function(resultName)
					{
						var promise = processor.getResultData(jobId, resultName);

						promises.push(promise);
					});

					return Promise.all(promises).then(function(results)
					{
						tf.loadingIndicator.tryHide();
						if (results[1].value)
						{
							var outStops = results[0].value.features;
							outStops = self._checkStops(outStops);
							var outUnassignedStops = results[2].value.features;
							var outDirections = results[3].value.features;
							var outRoutes = results[4].value.features;
							return self._computeVRPResult(outStops, outDirections, outRoutes);
						} else
						{
							return Promise.resolve(false);
						}

					}, self);
				}

			})

		})
	};

	VRPTool.prototype._getRestrictions = function(TravelScenarioId, drawTool)
	{
		var restrictions = ["oneway", "vehicletraverse"];
		if (TravelScenarioId >= 0)
		{
			var travelscenario = drawTool.NAtool._viewModal.travelScenariosPaletteViewModel.travelScenariosViewModel.dataModel.getTravelScenariosById(TravelScenarioId);
			if (!travelscenario)
			{
				travelscenario = drawTool.NAtool.directionPaletteViewModel.travelScenario;
			}
			if (travelscenario && !((travelscenario.ProhibitedId == 1) && (travelscenario.RestrictedId == 13)))
			{
				restrictions = ["oneway", "vehicletraverse", "redturn_" + travelscenario.ProhibitedId, "yellowturn_" + travelscenario.RestrictedId];

			}
		}
		return restrictions;
	}


	VRPTool.prototype._getStops = function(stops)
	{
		var self = this;
		var routingStops = [];
		stops.forEach(function(stop, index)
		{
			var curbApproach = stop.attributes ? stop.attributes.vehicleCurbApproach : 1;
			if (self._uTurnPolicy != "esriNFSBAllowBacktrack" && curbApproach == 0)
			{
				curbApproach = 3;
			}
			var _stop = new self._arcgis.Graphic({
				geometry: self.getStopLocationGeom(stop), attributes: {
					curbApproach: curbApproach,
					Name: parseInt(index)
				}
			});
			routingStops.push(_stop);
		});
		return routingStops;
	};
	VRPTool.prototype._computeVRPResult = function(stops, directions, routes, firstDepot, lastDepot)
	{
		var self = this;
		var groupedStops = [],
			groupedDirections = [],
			trips = [],
			results = [];
		for (var i = 0; i < routes.length; i++)
		{
			var gStops = stops.filter(function(stop)
			{
				return (stop.attributes.RouteName == routes[i].attributes.Name) && (stop.attributes.Name.indexOf("copy") < 0)
			});
			gStops = gStops.sort(function(a, b)
			{
				return a.attributes.Sequence > b.attributes.Sequence ? 1 : -1;
			});
			groupedStops.push(gStops);
			var gDirections = directions.filter(function(direction)
			{
				return (direction.attributes.RouteName == routes[i].attributes.Name) && (direction.attributes.Text.indexOf("copy") < 0)
			});
			groupedDirections.push(gDirections);
		}
		groupedDirections.forEach(function(directions, index)
		{
			var stopToStopPathGeometry = new self._arcgis.Polyline({
				spatialReference: { wkid: 102100 }, paths: [[]]
			});
			var stopToStopPathDirections = "";

			var stopToStopPathLength = 0;
			var stopToStopPathTime = 0;
			var pathSegments = [];

			directions.forEach(function(feature)
			{

				if (feature.attributes.Type == 1)
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
				if (feature.geometry)
				{
					if (feature.attributes.maneuverType != "esriDMTDepart" && feature.attributes.maneuverType != "esriDMTStop")
					{
						stopToStopPathDirections += feature.attributes.Text + " " + feature.attributes.DriveDistance.toFixed(2) + " mi. ";
					}
					stopToStopPathGeometry.paths[0] = stopToStopPathGeometry.paths[0].concat(feature.geometry.paths[0]);
					stopToStopPathLength += feature.attributes.DriveDistance;
					stopToStopPathTime += feature.attributes.ElapsedTime;
				}
			});
			trips.push(pathSegments);
		});
		for (var i = 0; i < routes.length; i++)
		{
			var result = [];
			groupedStops[i].forEach(function(stop, index)
			{
				stop.DrivingDirections = trips[i][index] ? trips[i][index].direction : "";
				stop.RouteDrivingDirections = stop.DrivingDirections;
				stop.IsCustomDirection = false;
				stop.Sequence = index + 1;//stop.attributes.Sequence;
				stop.path = trips[i][index];
				stop.Speed = (trips[i][index] && +trips[i][index].time) ? (+trips[i][index].length / +trips[i][index].time) * 60 : 0;
				stop.Distance = (trips[i][index] && +trips[i][index].length) ? +trips[i][index].length * 1 : 0;
				result.push(stop);
			});
			if (result.length > 0) results.push(result);

		}
		return results;

	};


	VRPTool.prototype._isFirstStopReachable = function(firstStop, secondStop)
	{
		var self = this;
		if (!firstStop || !secondStop)
		{
			return Promise.resolve(false);
		}
		var beforeStop = new self._arcgis.Graphic(firstStop.geometry, null, firstStop);
		var afterStop = new self._arcgis.Graphic(secondStop.geometry, null, secondStop);
		var stops = new self._arcgis.FeatureSet();
		stops.features = self._getStops([beforeStop, afterStop]);
		self._routeParameters.stops = stops;
		return self._router.solve(self._routeParameters).then(function(result)
		{
			if (result && result.routeResults)
			{
				return Promise.resolve(true);
			}
			return Promise.resolve(false);
		}, function(err)
		{
			return Promise.resolve(false);
		});
	}

	VRPTool.prototype._getVrpSettings = function(dataModel, trips)
	{
		var settings = {};
		return Promise.all([dataModel.loadDistrictPolicy(), dataModel.loadTrip(trips)]).then(function(result)
		{
			settings.districtPolicies = result[0];
			settings.tripsWithVehicle = result[1];
			var vrpSettings = {
				capacity: tf.storageManager.get("vrpCapacityChange"),
				totalDistance: tf.storageManager.get("vrpMaxTripDistanceChange"),
				ridingTime: tf.storageManager.get("vrpMaxRidingTimeChange"),
				totalTime: tf.storageManager.get("vrpMaxTripTimeChange")
			};
			settings.vrpSettings = vrpSettings;
			return settings;
		})
	}

	VRPTool.prototype.getSmartAssignment = function(tripStops, trips, isSmartSequence, drawTool, isAbsorption, currentTrips, timeToLastStop)
	{
		var self = this, isToSchool = trips[0].Session == 0;
		tf.loadingIndicator.show();
		var tripMinRidingTime = null, timeWindowStart = null, timeWindowEnd = null, totalTime = null, totalDistance = null;
		var earliestStartTime = 1355230800000;//December 11, 2012 1:00:00 PM
		var LatestStartTime = 1355317200000;//December 12, 2012 1:00:00 PM
		return self._getVrpSettings(drawTool.dataModel, trips).then(function(settings)
		{
			var vrpURL = self.vrpURL;
			var processor = new self._arcgis.Geoprocessor(vrpURL);

			var orders = new self._arcgis.FeatureSet();
			var depots = new self._arcgis.FeatureSet();
			var routes = new self._arcgis.FeatureSet();

			if (isAbsorption)
			{
				tripMinRidingTime = self._gettripMinTime(settings, timeToLastStop);
				timeWindowStart = 1355252400000;// December 11, 2012 7:00:00 PM
				timeWindowEnd = timeWindowStart + tripMinRidingTime * 60 * 1000;
				totalTime = settings.vrpSettings.totalTime;
				totalDistance = settings.vrpSettings.totalDistance;

			}

			depots.features.push(new self._arcgis.Graphic({
				geometry: self._arcgis.webMercatorUtils.webMercatorToGeographic(trips[0].TripStops[0].geometry),
				attributes: {
					Name: trips[0].TripStops[0].Street,
					CurbApproach: trips[0].TripStops[0].vehicleCurbApproach,
					"TimeWindowStart1": isToSchool ? null : timeWindowStart,
					"TimeWindowEnd1": isToSchool ? null : timeWindowStart
				}
			}));
			if (trips[0].TripStops.length > 1)
			{
				depots.features.push(new self._arcgis.Graphic({
					geometry: self._arcgis.webMercatorUtils.webMercatorToGeographic(trips[0].TripStops[trips[0].TripStops.length - 1].geometry),
					attributes: {
						Name: trips[0].TripStops[trips[0].TripStops.length - 1].Street,
						CurbApproach: trips[0].TripStops[trips[0].TripStops.length - 1].vehicleCurbApproach,
						"TimeWindowStart1": isToSchool ? timeWindowEnd : null,
						"TimeWindowEnd1": isToSchool ? timeWindowEnd : null
					}
				}));
			}
			//else
			// {
			// 	depots.features[0].attributes.TimeWindowStart1 = timeWindowStart;
			// 	depots.features[0].attributes.TimeWindowEnd1 = timeWindowEnd;
			// }

			for (var i = 0; i < trips.length; i++)
			{
				var polyline = new self._arcgis.Polyline({
					spatialReference: new self._arcgis.SpatialReference({
						wkid: 4326
					})
				});
				routes.features.push(new self._arcgis.Graphic({
					geometry: polyline,
					attributes: {
						Name: trips[i].id,
						StartDepotName: depots.features.length == 1 ? (isToSchool ? null : trips[0].TripStops[0].Street) : trips[0].TripStops[0].Street,
						EndDepotName: depots.features.length == 1 ? (isToSchool ? trips[0].TripStops[trips[0].TripStops.length - 1].Street : null) : trips[0].TripStops[trips[0].TripStops.length - 1].Street,
						"MaxOrderCount": 500,
						"MaxTotalTime": totalTime,
						"MaxTotalDistance": totalDistance,
						"Capacities": isAbsorption ? self._getCapacity(trips[i], settings) : 2000,
						"EarliestStartTime": earliestStartTime, "LatestStartTime": LatestStartTime,
					}
				}));
				for (var j = 1; j < trips[i].TripStops.length - 1; j++)
				{
					var stop = trips[i].TripStops[j];
					var seatCount = self._getStopSeatCount(stop, settings);
					var serviceTime = TF.stopTimeToMinute(stop.TotalStopTime);
					var timeWindow = [null, null];
					if (isAbsorption)
					{
						timeWindow = self._getStopTimeWindowVRP(stop, timeWindowStart, timeWindowEnd, settings, timeToLastStop, isToSchool);
					}
					if (!stop.id) stop.id = TF.createId() + j;
					orders.features.push(new self._arcgis.Graphic({
						geometry: self._arcgis.webMercatorUtils.webMercatorToGeographic(self.getStopLocationGeom(stop)),
						attributes: {
							Name: stop.id,
							RouteName: trips[i].id,
							PickupQuantities: isToSchool ? seatCount : 0,
							DeliveryQuantities: isToSchool ? 0 : seatCount,
							"TimeWindowStart1": timeWindow[0],
							"TimeWindowEnd1": timeWindow[1],
							MaxViolationTime1: (isAbsorption && timeWindow[0] && timeWindow[1]) ? 0 : null,
							ServiceTime: serviceTime,
							Sequence: stop.Sequence,
							AssignmentRule: 1,
							CurbApproach: (drawTool._uTurnPolicy != "allow-backtrack" && stop.vehicleCurbApproach == 0) ? 3 : stop.vehicleCurbApproach,
						}
					}));
				}
			}
			var AssignmentRule = 3;
			if (!isSmartSequence)
			{
				if (trips[0].Session == 0) { AssignmentRule = 5; }
				else { AssignmentRule = 4; }
			}

			tripStops.forEach(function(stop, i)
			{
				stop.orderName = "newStop_" + i;
				var timeWindow = [null, null];
				if (isAbsorption)
				{
					timeWindow = self._getStopTimeWindowVRP(stop, timeWindowStart, timeWindowEnd, settings, timeToLastStop, isToSchool);
				}
				var seatCount = self._getStopSeatCount(stop, settings);
				var serviceTime = TF.stopTimeToMinute(stop.TotalStopTime);
				orders.features.push(new self._arcgis.Graphic({
					geometry: self._arcgis.webMercatorUtils.webMercatorToGeographic(self.getStopLocationGeom(stop)),
					attributes: {
						Name: "newStop_" + i,
						AssignmentRule: AssignmentRule,
						PickupQuantities: isToSchool ? seatCount : 0,
						DeliveryQuantities: isToSchool ? 0 : seatCount,
						ServiceTime: serviceTime,
						"TimeWindowStart1": timeWindow[0],
						"TimeWindowEnd1": timeWindow[1],
						MaxViolationTime1: (isAbsorption && timeWindow[0] && timeWindow[1]) ? 0 : null,
						CurbApproach: (drawTool._uTurnPolicy != "allow-backtrack" && stop.vehicleCurbApproach == 0) ? 3 : stop.vehicleCurbApproach,
					}
				}));
			});

			return drawTool.NAtool._getSelectedBarriers(trips[0].TravelScenarioId).then(function(barriers)
			{
				var params = {
					orders: orders,
					depots: depots,
					routes: routes,
					point_barriers: barriers[0].features.length > 0 ? barriers[0] : null,
					line_barriers: barriers[1].features.length > 0 ? barriers[1] : null,
					polygon_barriers: barriers[2].features.length > 0 ? barriers[2] : null,
					'uturn_policy': self.uturnDic[drawTool._uTurnPolicy],
					"f": "pjson",
					"default_date": 1355212800000,
					"excess_transit_factor": "Medium",
					"spatially_cluster_routes": isAbsorption ? true : false,
					"restrictions": self._getRestrictions(trips[0].TravelScenarioId, drawTool),
					"time_attribute": "Time"
				};
				return params;

			}).then(function(params)
			{
				return tf.startup.loadArcgisUrls().then(function()
				{
					processor.url = arcgisUrls.TFUtilitiesGPService + "/VRPTool";
					params.folder_path = arcgisUrls.LinuxFolderRootPath ? arcgisUrls.LinuxFolderRootPath : arcgisUrls.FileGDBPath;
					params.active_folder = arcgisUrls.ActiveServiceFolderName;
					return processor.submitJob(params).then(function(jobInfo)
					{
						var jobid = jobInfo.jobId;
						return processor.waitForJobCompletion(jobid, {}).then(function(res)
						{
							return gpJobComplete(res)
						})
					})
				})

				function gpJobComplete(result)
				{
					if (result.jobStatus.indexOf("failed") >= 0)
					{
						return false;
					}
					var jobId = result.jobId;
					var resultNames = ["out_stops", "solve_succeeded", "out_unassigned_stops"];

					var promises = [];
					resultNames.forEach(function(resultName)
					{
						var promise = processor.getResultData(jobId, resultName);

						promises.push(promise);
					});

					return Promise.all(promises).then(function(results)
					{
						tf.loadingIndicator.tryHide();
						var outUnassignedStops = results[2].value.features;
						if (results[1].value)
						{
							var outStops = results[0].value.features;
							outStops = self._checkStops(outStops);
							if (isAbsorption) return self._getStopsSequenceAbsorption(outStops, tripStops);
							return self._getStopsSequenceAndTrip(outStops, outUnassignedStops, tripStops, trips);
						} else
						{
							var errMessage = self._getErrMessage(outUnassignedStops, tripStops, drawTool);
							return Promise.resolve(errMessage);
						}

					}, self);
				}

			})

		})
	};

	VRPTool.prototype._getErrMessage = function(unassignedStops, tripStops, drawTool)
	{
		var self = this, messages = "", stopName = null, tripName = null, err = "";
		unassignedStops.forEach(stop =>
		{
			if (stop.attributes.ViolatedConstraints && self.errDic[stop.attributes.ViolatedConstraints])
			{
				var unassignedStop = tripStops.filter(s => s.orderName == stop.attributes.Name)[0];
				if (!unassignedStop)
				{
					unassignedStop = drawTool.dataModel.getFieldTripStopByStopId(stop.attributes.Name);
				}
				stopName = unassignedStop.Street;
				tripName = drawTool.dataModel.getTripById(unassignedStop.TripId).Name;
				err = self.errDic[stop.attributes.ViolatedConstraints];
				if (stop.attributes.ViolatedConstraints == 1024)
				{
					messages = "Stop " + stopName + " of trip " + tripName + " is unreachable from the preceding stop.\n";
				} else
				{
					messages += err + " on stop " + stopName + " of trip " + tripName + "\n";
				}
			}
		});
		return messages;
	}

	VRPTool.prototype._getStopTimeWindowVRP = function(stop, tripWindowStart, tripWindowEnd, settings, timeToLastStop, isToSchool)
	{
		var timeWindow = [tripWindowStart, tripWindowEnd];
		if (stop.Students.length == 0) return timeWindow;

		var minRidingTime = (tripWindowEnd - tripWindowStart) / 60000;
		stop.Students.forEach(function(student)
		{
			var districtPolicy = Enumerable.From(settings.districtPolicies).FirstOrDefault(null, function(c)
			{
				return c.Category == student.Grade;
			});
			if (districtPolicy)
			{
				minRidingTime = Math.min(...[minRidingTime, districtPolicy.Value4].filter(v => v >= 0));
			}
		});
		minRidingTime = Math.min(...[minRidingTime, settings.vrpSettings.ridingTime].filter(v => v >= 0));
		minRidingTime = minRidingTime - timeToLastStop > 0 ? minRidingTime - timeToLastStop : 0;
		if (isToSchool)
		{
			timeWindow = (tripWindowEnd - minRidingTime * 60000) > tripWindowStart ? [tripWindowEnd - minRidingTime * 60000, tripWindowEnd] : [tripWindowStart, tripWindowEnd];
		} else
		{
			timeWindow = (tripWindowStart + minRidingTime * 60000) < tripWindowEnd ? [tripWindowStart, tripWindowStart + minRidingTime * 60000] : [tripWindowStart, tripWindowEnd];
		}
		return timeWindow;
	}


	VRPTool.prototype._getStopTimeWindow = function(stop, tripWindowStart, tripWindowEnd, trips, currentTrips)
	{
		if (stop.Students.length == 0) return [null, null];
		if (trips[0].TripStops[trips[0].TripStops.length - 1].id == currentTrips[0].TripStops[currentTrips[0].TripStops.length - 1].id)
		{
			return [tripWindowStart, tripWindowEnd];
		}
		var schoolCode = trips[0].TripStops[trips[0].TripStops.length - 1].SchoolCode;
		if (stop.Students.filter(function(student) { return student.SchoolCode != schoolCode }).length == 0)
		{
			return [tripWindowStart, tripWindowEnd];
		}
		var maxTime = 0;
		trips.forEach(function(trip)
		{
			var currentTrip = currentTrips.filter(function(ct) { return ct.id == trip.id })[0];
			var timeToLastStop = 0;
			var schoolIndex = -1;
			currentTrip.TripStops.forEach(function(stop, index)
			{
				if (stop.SchoolCode == trip.TripStops[trip.TripStops.length - 1].SchoolCode)
				{
					schoolIndex = index;
					return;
				}
			});
			for (var i = schoolIndex; i < currentTrip.TripStops.length; i++)
			{
				timeToLastStop += Math.ceil(currentTrip.TripStops[i].Distance / currentTrip.TripStops[i].Speed * 60);
			}
			if (timeToLastStop > maxTime)
			{
				maxTime = timeToLastStop;
			}

		});
		var timeWindowStart = tripWindowStart + maxTime * 60 * 1000;
		return [timeWindowStart, tripWindowEnd];
	}

	VRPTool.prototype._getCapacity = function(trip, settings)
	{
		var tripWithVehicle = Enumerable.From(settings.tripsWithVehicle).FirstOrDefault(null, function(c) { return c.Id == trip.id; });
		var vehicleCapacity = tripWithVehicle && tripWithVehicle.Vehicle ? tripWithVehicle.Vehicle.Capacity : 200;
		vehicleCapacity = Math.min(...[settings.vrpSettings.capacity, vehicleCapacity].filter(v => v >= 0));
		return vehicleCapacity;

	}

	VRPTool.prototype._getStopSeatCount = function(stop, settings)
	{
		var seatCount = 0;
		stop.Students.forEach(function(student)
		{
			var districtPolicy = Enumerable.From(settings.districtPolicies).FirstOrDefault(null, function(c)
			{
				return c.Category == student.Grade;
			});
			if (districtPolicy)
			{
				seatCount += districtPolicy.Value3;
			} else
			{
				seatCount++;
			}
		});
		return Math.ceil(seatCount);
	}

	VRPTool.prototype._gettripMinTime = function(settings, timeToLastStop)
	{
		var minRidingTime = settings.vrpSettings.totalTime ? settings.vrpSettings.totalTime : 600;
		if (timeToLastStop) minRidingTime = minRidingTime - timeToLastStop > 0 ? minRidingTime - timeToLastStop : 0;
		return minRidingTime;
	}

	VRPTool.prototype._checkStops = function(stops)
	{
		var outStops = [], invalidStartDepot = [];
		stops.sort(function(a, b) { return a.attributes.Sequence - b.attributes.Sequence; });
		stops.forEach(function(stop)
		{
			if (stop.attributes.StopType == 1 && stop.attributes.Name.length == 0 && stop.attributes.Sequence == 1)
			{
				//the route contains only one depot. 
				invalidStartDepot.push(stop);
			} else
			{
				outStops.push(stop);
			}
		});
		if (invalidStartDepot.length == 0) return stops;
		outStops.forEach(function(stop)
		{
			if (invalidStartDepot.filter(function(isd) { return isd.attributes.RouteName == stop.attributes.RouteName }).length > 0)
				stop.attributes.Sequence = stop.attributes.Sequence - 1;
		});
		return outStops;
	}

	VRPTool.prototype._getStopsSequenceAbsorption = function(outStops, tripStops)
	{
		var solvedStops = [];
		// outStops = outStops.sort(function(a, b)
		// {
		// 	return a.attributes.Sequence - b.attributes.Sequence;
		// });
		outStops.forEach(function(os)
		{
			if (os.attributes.StopType == 0 && os.attributes.ViolationTime == 0)
			{
				var item = tripStops.filter(function(ts) { return ts.orderName == os.attributes.Name; });
				if (item.length > 0)
				{
					item[0].TripId = parseInt(os.attributes.RouteName);
					item[0].Sequence = os.attributes.Sequence;
					delete item[0].OrderName;
					solvedStops.push(item[0]);
				}
			}
		});
		solvedStops = solvedStops.sort(function(a, b)
		{
			return a.Sequence - b.Sequence;
		});

		return solvedStops;
	}

	VRPTool.prototype._getStopsSequenceAndTrip = function(outStops, outUnassignedStops, tripStops, trips)
	{
		//var _outStops = [];
		// outStops = outStops.sort(function(a, b)
		// {
		// 	return a.attributes.Sequence - b.attributes.Sequence;
		// });

		if (outUnassignedStops.length > 0)
		{
			outStops = outStops.filter(function(os) { return os.attributes.StopType == 0 });
			var firstTrip = trips[0];
			var stopsToFirstTrip = outStops.filter(function(os) { return os.attributes.RouteName == firstTrip.id })
			outUnassignedStops.forEach(function(ous, index)
			{
				ous.attributes.Sequence = stopsToFirstTrip[stopsToFirstTrip.length - 1].attributes.Sequence + 1 + index;
				ous.attributes.RouteName = firstTrip.id;
			});
			outStops = outStops.concat(outUnassignedStops);
		}


		//	var sequence = 1;
		// outStops.forEach(function(s)
		// {
		// 	if (s.attributes.Name.length > 0)
		// 	{
		// 		s.attributes.Sequence = sequence;
		// 		_outStops.push(s);
		// 		sequence++;
		// 	}
		// })
		outStops.forEach(function(os)
		{
			var item = tripStops.filter(function(ts) { return ts.orderName == os.attributes.Name; });
			if (item.length > 0)
			{
				item[0].TripId = parseInt(os.attributes.RouteName);
				item[0].Sequence = os.attributes.Sequence;
				delete item[0].OrderName;
			}
		});
		// assign a default trip to stop if auto assignment failed
		tripStops.forEach(function(tripStop)
		{
			if (!tripStop.TripId)
			{
				var insertToTrip = trips[0];
				tripStop.TripId = insertToTrip.id;
				tripStop.Sequence = TF.Helper.TripHelper.getTripStopInsertSequence(insertToTrip.TripStops, insertToTrip.Session);
			}
		});
		tripStops = tripStops.sort(function(a, b)
		{
			return a.Sequence - b.Sequence;
		});
		return tripStops;
	};

	VRPTool.prototype.recalculateDirectionTimeWithBarriers = function(results)
	{
		var self = this;
		var travelregions = results.polygonBarriers;
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
					if (tr.attributes.BarrierType == 1)
					{
						var affectedroute = self._arcgis.geometryEngine.intersect(tr.geometry, geometry);
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

	VRPTool.prototype.getTripAbsorption = function(tripStops, trips, drawTool)
	{
		var self = this;
		var resolve = null;
		var promise = new Promise(function(solve) { resolve = solve; });

		var groupedTrips = self._getTripsWithSameDepots(trips);
		var groupCount = 0;
		for (var key in groupedTrips)
		{
			groupCount++;
		}

		var i = 0, remainingStops = $.extend(true, [], tripStops), calculatedStops = []
		function sendRequest()
		{
			if (i < groupCount)
			{
				return self.getSmartAssignment_multi(remainingStops, groupedTrips[i], true, drawTool, true).then(function(_stops)
				{
					if (!_stops || !$.isArray(_stops) || _stops.length == 0) return _stops;
					calculatedStops = calculatedStops.concat(_stops);
					remainingStops = remainingStops.filter(function(rs) { return _stops.filter(function(ns) { return ns.id == rs.id }).length == 0 });
					if (remainingStops.length == 0) resolve(calculatedStops);
					else
					{
						if (i == groupCount - 1) resolve(calculatedStops);
						else
						{
							i++;
							sendRequest();
						}
					}
					return promise;

				})
			}

		}
		return sendRequest().then(function(results)
		{
			return results;
		})
	}

	VRPTool.prototype.getSmartAssignment_multi = function(tripStops, trips, isSmartSequence, drawTool, isAbsorption)
	{
		var self = this;

		var currentTrips = $.extend(true, [], trips);
		var tripSession = trips[0].Session;
		//if (trips[0].Session == 1) return self.getSmartAssignment_multi_from(tripStops, trips, isSmartSequence, drawTool, isAbsorption);
		//else if (trips[0].Session > 1) return self.getSmartAssignment(tripStops, trips, isSmartSequence, drawTool, isAbsorption, currentTrips);
		var resolve = null;
		var promise = new Promise(function(solve) { resolve = solve; });

		var schools = trips[0].TripStops.filter(function(stop) { return stop.SchoolCode && stop.SchoolCode.length > 0 });
		if (tripSession == 1) schools = schools.reverse();
		var schoolCount = schools.length;
		var schoolCodes = schools.map(function(stop) { return stop.SchoolCode });


		var i = 0, remainingStops = $.extend(true, [], tripStops), calculatedStops = [];
		function vrpRequest()
		{
			if (i < schoolCount)
			{
				var newStops = i == schoolCount - 1 ? remainingStops : self._getStopsBeforeSchool(remainingStops, schoolCodes[i]);
				var newTrips = tripSession == 1 ? self._getTripsAfterSchool(currentTrips, schoolCodes[i]) : self._getTripsBeforeSchool(currentTrips, schoolCodes[i]);
				var timePromise = tripSession == 1 ? self._getTimeFromCurrentFirstToTripFirst(newTrips[0].TripStops[0], trips[0].TripStops[0]) : self._getTimeFromCurrentLastToTripLast(newTrips[0].TripStops[newTrips[0].TripStops.length - 1], trips[0].TripStops[trips[0].TripStops.length - 1])
				return timePromise.then(function(timeToLastStop)
				{
					return self.getSmartAssignment(newStops, newTrips, isSmartSequence, drawTool, isAbsorption, currentTrips, timeToLastStop).then(function(results)
					{
						if (newStops.length == 0)
						{
							if (i < schoolCount - 1)
							{
								i++;
								vrpRequest();
								return promise;
							} else
							{
								return resolve(calculatedStops.length > 0 ? calculatedStops : results);
							}
						}
						if (!results || !$.isArray(results))
						{
							// if (schoolCount == 1) return false;
							// else
							// {
							// 	if (remainingStops.length > 0) { i++; vrpRequest(); }
							// 	else
							// 	{
							// 		return resolve(calculatedStops.length > 0 ? calculatedStops : false);
							// 	}
							// }
						} else
						{
							if (tripSession == 1) results = self._appendSequenceOffset(results, newTrips);
							calculatedStops = calculatedStops.concat(results);
						}

						if (i == schoolCount - 1)
						{
							if (schoolCount == 1) return calculatedStops.length > 0 ? calculatedStops : results;
							else { return resolve(calculatedStops.length > 0 ? calculatedStops : results); }
						}
						remainingStops = remainingStops.filter(function(rs) { return newStops.filter(function(ns) { return ns.id == rs.id }).length == 0 });
						if (results)
						{
							currentTrips = self._appendNewStopsToTrips(results, currentTrips);
						}
						i++;
						vrpRequest();
						return promise;
					})
				})

			}

		}

		return vrpRequest().then(function(results)
		{
			var grouped = {}, data = [];
			if (results && $.isArray(results) && results.length > 0)
			{
				results.forEach(function(stop)
				{
					if (!grouped[stop.TripId]) grouped[stop.TripId] = [];
					grouped[stop.TripId].push(stop);
				});
			} else
			{
				return results;
			}

			for (var key in grouped)
			{
				data = data.concat(grouped[key].sort(function(a, b) { return a.Sequence - b.Sequence }));
			}
			return data;
		})
	};

	VRPTool.prototype._appendNewStopsToTrips = function(stops, trips)
	{
		if (stops.length == 0) return trips;
		stops.forEach(function(stop)
		{
			trips.forEach(function(trip)
			{
				if (trip.id == stop.TripId)
				{
					trip.TripStops = trip.TripStops.slice(0, stop.Sequence - 1).concat(stop).concat(trip.TripStops.slice(stop.Sequence - 1));
					trip.TripStops.forEach(function(stop, index) { stop.Sequence = index + 1; })
				}
			})
		});
		return trips;
	}

	VRPTool.prototype._getStopsBeforeSchool = function(tripStops, schoolCode)
	{
		var stops = [], isBeforeSchool = false;
		tripStops.forEach(function(stop)
		{
			var students = stop.Students.length > 0 ? stop.Students : ($.isArray(stop.unassignStudent) ? stop.unassignStudent : [stop.unassignStudent]);
			students.forEach(function(student)
			{
				if (student && student.SchoolCode == schoolCode)
				{
					isBeforeSchool = true;
				}
			});
			if (isBeforeSchool) stops.push($.extend(true, {}, stop));
		});
		return stops;
	}

	VRPTool.prototype._getTripsBeforeSchool = function(trips, schoolCode)
	{
		var newTrips = [];
		trips.forEach(function(trip)
		{
			var newTrip = $.extend(true, {}, trip);
			newTrip.TripStops = [];
			for (var i = 0; i < trip.TripStops.length; i++)
			{
				if (trip.TripStops[i].SchoolCode != schoolCode)
				{
					newTrip.TripStops.push($.extend(true, {}, trip.TripStops[i]));
				} else
				{
					newTrip.TripStops.push($.extend(true, {}, trip.TripStops[i]));
					break;
				}
			}
			newTrips.push(newTrip);
		});
		return newTrips;
	}

	VRPTool.prototype._getTripsAfterSchool = function(trips, schoolCode)
	{
		var newTrips = [];
		trips.forEach(function(trip)
		{
			var newTrip = $.extend(true, {}, trip);
			newTrip.TripStops = [];
			for (var i = trip.TripStops.length - 1; i >= 0; i--)
			{
				if (trip.TripStops[i].SchoolCode != schoolCode)
				{
					newTrip.TripStops.push($.extend(true, {}, trip.TripStops[i]));
				} else
				{
					newTrip.TripStops.push($.extend(true, {}, trip.TripStops[i]));
					break;
				}
			}
			var schoolStop = newTrip.TripStops[newTrip.TripStops.length - 1];
			newTrip.sequenceOffset = schoolStop.Sequence - 1;
			newTrip.TripStops.forEach(function(stop)
			{
				stop.Sequence = stop.Sequence - newTrip.sequenceOffset;
			});
			newTrip.TripStops = newTrip.TripStops.sort(function(a, b) { return a.Sequence - b.Sequence; });
			newTrips.push(newTrip);
		});
		return newTrips;
	}

	VRPTool.prototype._appendSequenceOffset = function(results, trips)
	{
		results.forEach(function(stop)
		{
			var sequenceOffset = trips.filter(function(trip) { return trip.id == stop.TripId })[0].sequenceOffset;
			stop.Sequence = stop.Sequence + sequenceOffset;
		});
		return results;
	}
	VRPTool.prototype._appendSequenceOffsetVRP = function(results, trips)
	{
		results.forEach(function(tripStops)
		{
			tripStops.forEach(function(stop)
			{
				var sequenceOffset = trips.filter(function(trip) { return trip.id == stop.attributes.RouteName })[0].sequenceOffset;
				stop.attributes.Sequence = stop.attributes.Sequence + sequenceOffset;
			})
		});
		return results;
	}

	VRPTool.prototype._getTripsWithSameDepots = function(trips)
	{
		var self = this, grouped = {}, index = 0;
		grouped[index] = [trips[0]];
		trips.forEach(function(trip, i)
		{
			if (i == 0) return;
			if (self._isSameStopLocation(trip.TripStops[0], grouped[index][0].TripStops[0]) &&
				(self._isSameStopLocation(trip.TripStops[trip.TripStops.length - 1], grouped[index][0].TripStops[grouped[index][0].TripStops.length - 1])))
			{
				grouped[index].push(trip);
			} else
			{
				index++;
				grouped[index] = [trip];
			}
		});
		return grouped;
	}

	VRPTool.prototype._isSameStopLocation = function(stopa, stopb)
	{
		if (stopa.SchoolCode && stopa.SchoolCode.length > 0 && stopb.SchoolCode && stopb.SchoolCode.length > 0 && stopa.SchoolCode == stopb.SchoolCode) return true;
		if (stopa.geometry.x.toFixed(4) == stopb.geometry.x.toFixed(4)
			&& stopa.geometry.y.toFixed(4) == stopb.geometry.y.toFixed(4))
		{
			return true;
		}
		return false;
	};


	VRPTool.prototype.dispose = function()
	{

	};
})();
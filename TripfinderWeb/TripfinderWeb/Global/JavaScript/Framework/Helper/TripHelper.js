(function()
{
	var namespace = createNamespace("TF.Helper");

	namespace.TripHelper = TripHelper;

	function TripHelper()
	{

	}

	TripHelper.Sessions = {
		ToSchool: 0,
		FromSchool: 1,
		Shuttle: 2,
		Both: 3
	};

	TripHelper.GeocodeSource = {
		addressPoint: {
			value: "addressPoint",
			text: "Address Point"
		},
		mapStreet: {
			value: "mapStreet",
			text: "Street Address Range"
		}
	};

	TripHelper.AltSiteName = function(altSiteId, altSite)
	{
		if (altSiteId == -3)
		{
			return "Walker";
		}
		if (altSiteId == 0)
		{
			return "Home";
		}
		if (altSite)
		{
			return altSite.Name;
		}
		return "";
	};

	TripHelper.getColorByTripId = function(tripId)
	{
		return tf.colorSource[tripId % tf.colorSource.length];
	};

	TripHelper.loadUnassignedStudents = function(schoolCodes, trip, viewModal, map)
	{
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "student", "unassignedWithUngeo?timePeriod=" + (trip.Session == 0 ? "AM" : "PM")),
			{
				data: {
					schoolCodes: schoolCodes,
					HomeSchl: trip.HomeSchl,
					HomeTrans: trip.HomeTrans,
					Shuttle: trip.Shuttle
				}
			})
			.then(function(apiResponse)
			{
				var ungeoStudents = [];
				var studentDataModels = [];

				var students = apiResponse.Items;
				for (var i = 0, len = students.length; i < len; i++)
				{
					if (students[i].GeometryPoint == null)
					{
						ungeoStudents.push(students[i]);
					}
					else
					{
						studentDataModels.push(new TF.DataModel.StudentDataModel(students[i]));
					}
				}
				var unassignedStudentViewModel = new TF.Map.RoutingMap.UnassignedStudentViewModel(studentDataModels, trip.Session, viewModal, map);
				unassignedStudentViewModel.Show();

				return {
					ungeoStudents: ungeoStudents,
					studentDataModels: studentDataModels,
					unassignedStudentViewModel: unassignedStudentViewModel
				};

			}.bind(this));
	};

	TripHelper.LoadSchools = function(trip)
	{
		var schoolCodes = [];
		trip.Schools.split("!").forEach(function(item)
		{
			if (item != "")
			{
				schoolCodes.push(item);
			}
		});
		return schoolCodes;
	};

	TripHelper.assignStudents = function(object, viewModal, map)
	{// assign students to trip stops
		return TripHelper.loadUnassignedStudents(TripHelper.LoadSchools(object.TripEntity), object.TripEntity, viewModal, map)
			.then(function(data)
			{
				object.TripStopEntities.forEach(function(item)
				{
					var geometry = item.GeometryBoundary;
					if (geometry)
					{
						// olFeature=MapPageView.CreatePolygonFeature(feature.geometry,this.stopBoundaryLayer,undefined,"#"+self.colorTheme);
						var olFeature = new OpenLayers.Feature.Vector(tf.converter.GeoJson2OlGeometry(geometry), {
							type: "stopboundary"
						});
						item.olFeatureStopBoundary = olFeature;
						olFeature.geometryBoundary = geometry;
						olFeature.isStopBoundary = true;
					}

					TF.Helper.TripStopHelper.assignStudents(item, data.unassignedStudentViewModel);
				}.bind(this));

				return true;
			});
	};

	TripHelper.CalculateTripTransport = function(lNumAssigned, Id)
	{
		return Promise.resolve({}).then(function(response)
		{
			var lEstimatedRiders = 0;
			if (response.Items && response.Items[0])
			{
				if (response.Items[0].EstimatedRidership > 0)
				{
					lEstimatedRiders = response.Items[0].EstimatedRidership;
				}
			}

			var fRatio = 0;
			if (lEstimatedRiders > 0 && lNumAssigned > 0)
			{
				fRatio = lEstimatedRiders / lNumAssigned;
			}

			if (fRatio > 0)
			{
				return lEstimatedRiders + "(" + fRatio.toFixed(2) + ")";
			}

			return lEstimatedRiders;
		}.bind(this));
	};

	TripHelper.getCopyTrip = function(copyOption, tripData)
	{
		var tripStopData = this.processTripStops(tripData.TripStops);
		var assistVM = new TF.DataEntry.TripTripStopDataEntryMapViewModel();
		assistVM.load(null, tripData);

		var entity = {
			TripEntity: tripData,
			TripStopEntities: []
		};
		entity.TripEntity.TripStops = [];
		entity.TripEntity.APIIsNew = true;
		entity.TripEntity.Id = undefined;
		entity.TripEntity.Day = 7;
		entity.TripEntity.Name = copyOption.Name;
		entity.TripEntity.IName = copyOption.Name;
		entity.TripEntity.Session = copyOption.Session;
		entity.TripEntity.DriverId = 0;
		entity.TripEntity.AideId = 0;
		entity.TripEntity.VehicleId = 0;
		entity.TripEntity.Dhdistance = 0;// this need recalculate
		if (copyOption.ReverseTripStop)
		{
			entity.TripStopEntities = this.convertToCopyStops(tripStopData, copyOption.AssignStudent, true);
		}
		else
		{
			entity.TripStopEntities = this.convertToCopyStops(tripStopData, copyOption.AssignStudent);
		}

		entity.TripEntity.StartTime = entity.TripStopEntities[0].StopTime;
		entity.TripEntity.FinishTime = entity.TripStopEntities[entity.TripStopEntities.length - 1].StopTime;

		return (copyOption.AssignStudent ? this.assignStudents(entity, assistVM, assistVM.map) : Promise.resolve(true))
			.then(function()
			{
				this.updateCopyStopsTotalInfo(entity.TripStopEntities, tripData.SchoolCodes, tripData.Session);
				this.CalculateTotalInfo(entity);
				return entity;
			}.bind(this)).catch(function(args)
			{

			});
	};

	TripHelper.convertToCopyStops = function(tripStopData, isAssignStudent, isReverse)
	{
		var stops = [];
		if (isReverse)
		{
			var j = 0;
			for (var i = tripStopData.length - 1; i >= 0; i--)
			{
				var stop = this.convertToCopyStop(tripStopData[i], isReverse, j == 0 ? null : stops[j - 1].StopTime);
				stop.Sequence = j + 1;
				stops.push(stop);
				if (j == 0)
				{
					stop.StopTime = tf.setting.userProfile.DefaultTime;
				}
				else
				{
					var timeSpan = moment(tripStopData[i + 1].stopTime()).diff(stop.stopTime(), 'seconds');
					stop.StopTime = toISOStringWithoutTimeZone(moment(stops[j - 1].StopTime).add('seconds', timeSpan));
				}
				j++;
			}
		}
		else
		{
			var j = 1;
			tripStopData.forEach(function(item)
			{
				var stop = this.convertToCopyStop(item);
				stop.Sequence = j;
				stops.push(stop);
				j++;
			}.bind(this));
		}
		return stops;
	};

	TripHelper.convertToCopyStop = function(item, isReverse, stopTime)
	{
		var temp = item.olFeatureStopBoundary;
		item.olFeatureStopBoundary = null;
		var stop = $.extend(true, {}, item);
		stop.olFeatureStopBoundary = temp;
		stop.Id = undefined;
		stop.APIIsDirty = true;
		stop.APIIsNew = true;
		stop.isDeleted = item.isDeleted();
		stop.DropOffStudents = [];
		stop.DropOffTransferStudents = [];
		stop.ExceptionStudent = null;
		stop.PickUpStudents = [];
		stop.PickUpTransferStudents = [];
		stop.TripId = undefined;
		stop.Guid = undefined;
		stop.DrivingDirections = "";
		// will set to 0 after calculate.
		// stop.Distance = undefined;//may need calculate
		stop.AvgSpeed = 0;// may need calculate
		if (!stop.TotalStopTimeManualChanged)
		{// no manually changed, then set to 0;
			stop.TotalStopTime = 0;
		}
		if (isReverse)
		{// need confirm the logic
			stop.Distance = 0;
			stop.DrivingDirections = "";
			stop.AverageSpeed = 0;
			stop.TotalStopTime = 0;
			stop.TotalStopTimeManualChanged = 0;
		}
		return stop;
	};

	TripHelper.updateCopyStopsTotalInfo = function(stops, schools, session)
	{
		var schoolField = "DlyDoTschl";
		var schoolObject = {};
		schools.forEach(function(school)
		{
			schoolObject[school.SchoolCode || school] = {
				NumTrans: 0,
				NumStuds: 0
			};
		});
		if (session == "0") // AM
		{
			schoolField = "DlyPuTschl";
		}
		// handle normal stop
		stops.forEach(function(item)
		{
			if (item.SchlCode == "")
			{// normal stop
				var students = item.StudentList;
				var studentFilter = students.filter(function(student)
				{
					if (student[schoolField] != "")
					{// trans
						schoolObject[student[schoolField]].NumTrans++;
					}
					else
					{// normal
						schoolObject[student.SchoolCode].NumStuds++;
					}
					return true;
				}.bind(this));
				item.NumStuds = studentFilter.length;
				if (session == "1") // AM
				{// drop off in school
					item.NumStuds = 0 - item.NumStuds;
				}
			}
		}.bind(this));

		// handle school stop
		stops.forEach(function(item)
		{
			if (item.SchlCode != "")
			{// school stop
				if (session == "0") // AM
				{// drop off in school
					item.NumStuds = 0 - schoolObject[item.SchlCode].NumStuds;
					item.NumTrans = 0 - schoolObject[item.SchlCode].NumTrans;
				}
				else
				{// pick up in school
					item.NumStuds = schoolObject[item.SchlCode].NumStuds;
					item.NumTrans = schoolObject[item.SchlCode].NumTrans;
				}
			}
		}.bind(this));
	};

	TripHelper.processTripStops = function(stops)
	{
		var stopList = stops;
		for (var i = 0; i < stopList.length; i++)
		{
			for (var j = 0; j < stopList[i].PickUpStudents; j++)
			{
				stopList[i].PickUpStudents[j].isDeleted = false;
			}

			for (var j = 0; j < stopList[i].DropOffStudents; j++)
			{
				stopList[i].DropOffStudents[j].isDeleted = false;
			}

			stopList[i].stopTime = ko.observable(stopList[i].StopTime);
			stopList[i].isDeleted = ko.observable(false);
		}

		return stopList;
	};

	TripHelper.CalculateTotalInfo = function(entity)
	{
		var numOnBus = 0;
		var dhdistance = 0;
		var iTotalstuds = 0;
		entity.TripStopEntities.forEach(function(stop)
		{
			// calculate dhdistance
			numOnBus = numOnBus + stop.NumStuds + stop.NumTrans + stop.NumPushut + stop.NumDoshut;
			if (numOnBus == 0)
			{
				dhdistance += stop.Distance ? stop.Distance : 0;
			}
			// calculate NumTransport
			if (stop.NumStuds > 0)
			{
				iTotalstuds += stop.NumStuds;
			}
			if (stop.NumTrans > 0)
			{
				iTotalstuds += stop.NumTrans;
			}
			iTotalstuds = iTotalstuds + stop.NumPushut + stop.NumDoshut;
			stop.Distance = 0;
		});
		entity.TripEntity.NumTransport = iTotalstuds;
		entity.TripEntity.Dhdistance = dhdistance;
	};

	TripHelper.getJsonStops = function(object)
	{
		object.TripStopEntities.forEach(function(item)
		{
			delete item.isCollapsed;
			delete item.obPickUpStudents;
			delete item.olFeatureStopBoundary;
			delete item.stopTime;
			delete item.GeometryBoundary;
			delete item.GeometryPath;
			delete item.GeometryPoint;
		});

		object.TripEntity.TripStops = object.TripStopEntities;
		return object;
	};

	TripHelper.getTripStopInsertSequenceBeforeSchool = function(stops, session, schoolId)
	{
		var schoolIndex = 0;
		if (session == 0)
		{
			for (var i = 0; i < stops.length; i++)
			{
				if (stops[i].SchoolCode && (!schoolId || stops[i].SchoolId == schoolId))
				{
					schoolIndex = stops[i].Sequence;
					break;
				}
			}
			return schoolIndex;
		} else if (session == 1)
		{
			return stops.length + 1;
		} else if (session == 2)
		{
			return schoolIndex + 2;
		}
		else if (session == 3)
		{
			return TripHelper.getTripStopInsertSequence(stops, session);
		}

		for (var i = stops.length; i < 0; i--)
		{
			if (stops[i].SchoolCode && (!schoolId || stops[i].SchoolId == schoolId))
			{
				return stops[i].Sequence;
			}
		}

		return 0;
	};


	/**
	 * To school, insert before school
	 * From school, insert after school 
	 */
	TripHelper.getTripStopInsertSequence = function(stops, session)
	{
		var schoolIndex = 0;
		if (session == 0)
		{
			for (var i = 0; i < stops.length; i++)
			{
				if (stops[i].SchoolCode)
				{
					schoolIndex = i;
					break;
				}
			}
		}
		if (session == 1)
		{
			return stops.length + 1;
		}
		else if (session == 2)
		{
			schoolIndex = 1;
		}
		else if (session == 3)
		{
			var schools = [];

			// get all schools
			for (i = 0; i < stops.length; i++)
			{
				if (stops[i].SchoolCode && schools.indexOf(stops[i].SchoolCode) < 0)
				{
					schools.push(stops[i].SchoolCode);
				}
			}

			// calculate mid sequence
			for (i = 0; i < stops.length; i++)
			{
				if (stops[i].SchoolCode)
				{
					if (schools.length == 0)
					{
						schoolIndex = i;
						break;
					} else
					{
						var index = schools.indexOf(stops[i].SchoolCode);
						if (index >= 0)
						{
							schools.splice(index, 1);
						}
					}

				}
			}
		}
		return schoolIndex + 1;
	};

	TripHelper.confirmDateChangeAffectStudent = function(changedScheduleStds)
	{
		if (!changedScheduleStds)
		{
			return Promise.resolve(true);
		}

		let msg,
			exceptions = changedScheduleStds.filter(std => !std.RequirementID),
			exceptionCount = exceptions.length,
			studentsCount = Enumerable.From(changedScheduleStds).Distinct(e => e.id || e.Id).ToArray().length;
		if (exceptionCount)
		{
			exceptions = Enumerable.From(exceptions).Distinct(e => e.id || e.Id).OrderBy(i => (i.LastName || "").toLowerCase()).ThenBy(i => (i.FirstName || "").toLowerCase()).ToArray();
			let names = exceptions.map(i => `${i.FirstName} ${i.LastName}`);
			let exceptionWording = exceptionCount === 1 ? 'exception' : 'exceptions';
			msg = `Changing the trip dates will affect ${studentsCount} ${studentsCount == 1 ? "Student" : "Students"} including following student ${exceptionWording}:
			<br/>${names.join('<br/>')}
			<br/> Do you want to remove the affected schedules and ${exceptionWording} or update them based on the new trip dates?`;
		}
		else
		{
			msg = `Changing the trip dates will affect ${studentsCount} ${studentsCount == 1 ? "Student" : "Students"}. Do you want to remove the affected schedules or update them based on the new trip dates?`;
		}

		return tf.promiseBootbox.dialog({
			message: msg,
			title: "Confirmation Message",
			maxHeight: 600,
			buttons: {
				remove: {
					label: "Remove",
					className: "btn-primary btn-sm btn-primary-black"
				},
				update: {
					label: "Update",
					className: "btn-primary btn-sm btn-primary-black"
				},
				cancel: {
					label: "Cancel",
					className: "btn-default btn-sm btn-default-link pull-right"
				}
			}
		});
	};

	TripHelper.isTripDateReduce = function(oriTrip, newTrip)
	{
		if ((oriTrip.StartDate == null && newTrip.StartDate != null) ||
			(oriTrip.EndDate == null && newTrip.EndDate != null) ||
			(oriTrip.StartDate != null && newTrip.StartDate != null && moment(newTrip.StartDate).isAfter(moment(oriTrip.StartDate))) ||
			(oriTrip.EndDate != null && newTrip.EndDate != null && moment(newTrip.EndDate).isBefore(moment(oriTrip.EndDate))))
		{
			return true;
		}
		return false;
	};

	TripHelper.getPointAt = function(pathGeometry, portion)
	{
		var i, previousCoord, currentCoord, distance, subPortion, newCoordX, newCoordY;
		var totalDistance = 0;
		var distances = [];
		var accumulatedDistance = 0;
		var coordinates = pathGeometry.paths[0];
		previousCoord = coordinates[0];
		for (i = 1; i < coordinates.length; i++)
		{
			currentCoord = coordinates[i];
			distance = getDistance(previousCoord, currentCoord);
			distances.push(distance);
			totalDistance += distance;
			previousCoord = currentCoord;
		}
		for (i = 0; i < distances.length; i++)
		{
			accumulatedDistance += distances[i];
			if (accumulatedDistance / totalDistance > portion || i == distances.length - 1)
			{
				subPortion = ((portion - (accumulatedDistance - distances[i]) / totalDistance) * totalDistance) / distances[i];
				if (isNaN(subPortion))
				{
					subPortion = 0;
				}
				break;
			}
		}
		newCoordX = coordinates[i][0] - (coordinates[i][0] - coordinates[i + 1][0]) * subPortion;
		newCoordY = coordinates[i][1] - (coordinates[i][1] - coordinates[i + 1][1]) * subPortion;
		return new tf.map.ArcGIS.Point({
			x: newCoordX,
			y: newCoordY,
			spatialReference: pathGeometry.spatialReference
		});

		function getDistance(coord1, coord2)
		{
			return Math.sqrt(Math.pow(coord1[0] - coord2[0], 2) + Math.pow(coord1[1] - coord2[1], 2), 2);
		}
	};

	TripHelper.deleteTripGeometry = function(tripIds, dbid)
	{
		if (!tripIds || tripIds.length == 0)
		{
			return Promise.resolve();
		}

		let tripPath = { layer: createFeatureLayer(37), tripIdFieldName: "TripID" };
		let tripBoundary = { layer: createFeatureLayer(38), tripIdFieldName: "Trip_ID" };

		return Promise.all([tripPath, tripBoundary]
			.map(x =>
			{
				return deleteGeometry(x.layer, x.tripIdFieldName, tripIds, dbid);
			}));
	};

	TripHelper.PathLineTypes = {
		Path: "Path",
		Sequence: "Sequence"
	};

	TripHelper.pathLineType = function()
	{
		return tf.storageManager.get("pathLineType") || TripHelper.PathLineTypes.Path;
	};

	TripHelper.getDrawTripPathGeometry = function(tripStop, trip)
	{
		var pathLineType = TripHelper.pathLineType();
		for (var i = 0; i < trip.TripStops.length - 1; i++)
		{
			if (trip.TripStops[i] != tripStop)
			{
				continue;
			}
			var stop = trip.TripStops[i];
			if (pathLineType === TripHelper.PathLineTypes.Path)
			{
				return getTripPath(stop)
			}

			if (pathLineType === TripHelper.PathLineTypes.Sequence)
			{
				var nextStop = trip.TripStops[i + 1];
				return getSequencePath(stop, nextStop);
			}
		}

		function getTripPath(stop)
		{
			if (stop.path)
			{
				if (stop.path.geometry)
				{
					return stop.path.geometry;
				} else
				{
					return createPolyline([]);
				}
			}
			return null;
		}

		function getSequencePath(stop, nextStop)
		{
			var stopCoord = getCoord(stop), nextStopCoord = getCoord(nextStop);
			var stopGeometry = TF.xyToGeometry(stopCoord.x, stopCoord.y);
			var nextStopGeometry = TF.xyToGeometry(nextStopCoord.x, nextStopCoord.y);
			return createPolyline([[stopGeometry.x, stopGeometry.y], [nextStopGeometry.x, nextStopGeometry.y]]);
		}

		function getCoord(stop)
		{
			return {
				x: stop.SchoolLocation ? (stop.SchoolLocation.Xcoord) : stop.XCoord,
				y: stop.SchoolLocation ? (stop.SchoolLocation.Ycoord) : stop.YCoord
			};
		}

		function createPolyline(paths)
		{
			return new tf.map.ArcGIS.Polyline({
				type: "polyline",
				spatialReference: {
					wkid: 102100
				},
				paths: paths
			});
		}
	};

	function createFeatureLayer(id)
	{
		return new tf.map.ArcGIS.FeatureLayer(arcgisUrls.MapEditingOneService + "/" + id, {
			objectIdField: "OBJECTID"
		});
	}

	function deleteGeometry(featureLayer, tripIdFieldName, tripIds, dbid)
	{
		var query = new tf.map.ArcGIS.Query();
		query.outFields = ["OBJECTID"];
		query.where = `${tripIdFieldName} in (${tripIds.join()}) and DBID = ${dbid}`;
		return featureLayer.queryFeatures(query).then(function(featureSet)
		{
			var features = featureSet.features;
			if (features.length > 0)
			{
				return featureLayer.applyEdits({ deleteFeatures: features }).then(
					function()
					{
					},
					function()
					{
						console.error(arguments);
					});
			}
		});
	}
})();
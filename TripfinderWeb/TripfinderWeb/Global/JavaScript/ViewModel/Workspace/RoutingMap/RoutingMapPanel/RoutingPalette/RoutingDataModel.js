(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingDataModel = RoutingDataModel;

	function RoutingDataModel(viewModel)
	{
		var self = this;
		TF.RoutingMap.BaseMapDataModel.call(this, viewModel.viewModel._viewModal);
		self.viewModel = viewModel;
		self.routeState = viewModel.viewModel._viewModal.routeState;
		self.trips = [];
		self.candidateStudents = [];
		self.removedCandidateIds = [];//store the unassigned student ids being removed from unassigned palette. 
		self.tripStopDictionary = {};
		self.studentsDictionary = {};
		self.prohibitStreets = [];
		self.tripStopOriginalData = [];
		self.tripOriginalData = [];
		self.studentTripOriginalData = [];
		self.tripStudentOriginalData = [];
		self.originalTripAssignment = {};
		self.schoolLocationDictionary = {};
		self.tripOriginalRestrictions = {};
		self.expiredExceptions = {};
		self.schoolSequences = {};
		self.restrictions = ['Session', 'Schools', 'BusAide', 'Day', 'Disabled', 'FilterName',
			'NonDisabled', 'HomeSchl', 'HomeTrans', 'Shuttle', 'FilterSpec', 'TravelScenarioId'];
		self.stopPathDictionary = {};
		self.onInit = new TF.Events.Event();
		self.onTripsChangeEvent = new TF.Events.Event();
		self.onTripColorChangeEvent = new TF.Events.Event();
		self.onTripStopsChangeEvent = new TF.Events.Event();
		self.onChangeTripVisibilityEvent = new TF.Events.Event();
		self.onSettingChangeEvent = new TF.Events.Event();
		self.onAssignStudentsChangeEvent = new TF.Events.Event();
		self.onTripSequenceChangeEvent = new TF.Events.Event();
		self.onAssignStudentsChangeToMapEvent = new TF.Events.Event();
		self.onCandidatesStudentsChangeToMapEvent = new TF.Events.PromiseEvent();
		self.onTripDisplayRefreshEvent = new TF.Events.Event();
		self.onStudentCrossStreetStopChangeEvent = new TF.Events.Event();
		self.onWalkTSRestrictionChangeEvent = new TF.Events.Event();
		self.onTripSaveEvent = new TF.Events.Event();
		self.onStudentChangeEvent = new TF.Events.Event();
		self.onTripStopTimeChangeEvent = new TF.Events.Event();
		self.onTrialStopWalkoutPreviewChange = new TF.Events.Event();
		self.onOptimizeSequenceDiffRateChange = new TF.Events.Event();
		self.onShowChartChangeEvent = new TF.Events.Event();
		self.onSchoolLocationChangeEvent = new TF.Events.Event();
		self.onStopCandidateStudentChangeEvent = new TF.Events.Event();
		self.onTripTreeColorChangeEvent = new TF.Events.Event();
		self.onTripPathLineDisplayChange = new TF.Events.Event();

		// lock data
		self.featureData = new TF.RoutingMap.RoutingPalette.RoutingFeatureData(self);
		self.tripLockData = new TF.RoutingMap.RoutingPalette.RoutingLockData(self);
		self.schoolLockData = new TF.RoutingMap.RoutingPalette.SchoolLockData(self);
		self.fieldTripStopDataModel = new TF.RoutingMap.RoutingPalette.RoutingFieldTripStopDataModel(self);
		self.routingStudentManager = new TF.RoutingMap.RoutingPalette.RoutingStudentManager(self);

		// change count
		self.changeDataStack = ko.observableArray();
		self.changeDataStack.subscribe(self.changeDataStackChange.bind(self));
		self.obSelfChangeCount = ko.computed(self.calcSelfChangeCount.bind(self));

		// show impact difference chart
		self.showImpactDifferenceChart = ko.observable(false);

		// self.streetDataModel = self._viewModal.mapEditingPaletteViewModel.myStreetsViewModel.dataModel;
		// self.streetMeterBuffer = 40;

		self.setUserProfileTripColor = self.setUserProfileTripColor.bind(this);
		PubSub.subscribe(topicCombine(pb.DATA_CHANGE, "userprofile", pb.EDIT), this.setUserProfileTripColor);
		self.stopPathChange = self.stopPathChange.bind(this);
		PubSub.subscribe(topicCombine(pb.DATA_CHANGE, "stoppath"), this.stopPathChange);
		// this.districtPolicyChange = this.districtPolicyChange.bind(this);
		// PubSub.subscribe("DistrictPolicyChange", this.districtPolicyChange);
		this.onSchoolLocationDataSourceChange = this.onSchoolLocationDataSourceChange.bind(this);
		this.tripEditBroadcast = new TF.RoutingMap.RoutingPalette.TripEditBroadcast(this);
		self.geoLinkTool = new TF.RoutingMap.RoutingPalette.GeoLinkTool(self.fieldTripStopDataModel);
		this.needUpdateTrip = ko.observable(true);
		this.needUpdateTripColor = ko.observable(false);

		// toggle stop boundary
		self.onStopBoundaryShowChange = new TF.Events.Event();
	}

	RoutingDataModel.weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

	RoutingDataModel.prototype = Object.create(TF.RoutingMap.BaseMapDataModel.prototype);
	RoutingDataModel.prototype.constructor = RoutingDataModel;

	RoutingDataModel.prototype.init = function()
	{
		var self = this;
		this.tripEditBroadcast.init();
		// self.subscribeStreetChange();
		this._viewModal.onUpdateRecordsEvent.subscribe(this.onSchoolLocationDataSourceChange);
		// remove student
		// self._getUnassignedStudentViewModel().dataModel.settingChangeEvent.subscribe(this.unassignedStudentSettingChange.bind(this));

		// return Promise.all([self.setLoadTimeSettings(), self.setUserProfileTripColor()])
		return Promise.all([self.setUserProfileTripColor()]).then(function()
		{
			var docData = self._viewModal.DocumentData.data;
			// the trips that need to be auto open when trip panel initial
			if (docData && docData.trips)
			{
				var trips = docData.trips;
				if (docData.tryOpenFieldTrip)
				{
					self.tryOpenFieldTrip(trips);
					return;
				}

				if (trips[0].OpenType)
				{
					self.trips = trips;
					self.bindColor(true);
					// remove student
					// self.routingStudentManager.calculateStudentPUDOStatus();
					// self.routingStudentManager.refreshStudent();
					self._getSchoolLocations(trips).then(function()
					{
						// remove student
						// self.routingStudentManager.refreshDictionary(null, null);
						self.setFieldTripActualStopTime(self.trips);

						// remove student
						// self.setStudentTravelTime(self.trips);
						// self.setAllStudentValidProperty(self.trips);
						self.onTripsChangeEvent.notify({ add: self.trips, edit: [], delete: [] });
					});
				} else
				{
					self.displayByFindCandidateTripStops(trips);
				}
			}
			self.onInit.notify();
		});
	};

	RoutingDataModel.prototype.getExceptions = function(stopId)
	{
		return ((this.getFieldTripStop(stopId) || {}).Students || [])
			.filter(s => !s.RequirementID)
			.concat((this.expiredExceptions[stopId] || []).filter(e => e.TripStopID == stopId));
	};

	RoutingDataModel.prototype.getTripAllExceptions = function(tripId)
	{
		let trip = this.trips.find(t => t.id == tripId),
			exceptions = trip.FieldTripStops.flatMap(s => s.Students).filter(s => !s.RequirementID),
			expired = trip.FieldTripStops.flatMap(i => this.expiredExceptions[i.id] || []);
		return exceptions.concat(expired);
	};

	RoutingDataModel.prototype.tryOpenFieldTrip = function(fieldTrips)
	{
		var self = this;
		var openedTripIds = self.trips.map(function(c) { return c.Id; });
		fieldTrips = fieldTrips.filter((t) => { return openedTripIds.indexOf(t.Id) < 0; });
		if (fieldTrips.length == 0)
		{
			return Promise.resolve();
		}
		return self.tripLockData.getLockInfo().then(function(lockInfo)
		{
			return lockInfo.selfLockedList.filter(function(item)
			{
				return item.ExtraInfo != self.routeState;
			}).concat(lockInfo.lockedByOtherList).filter(item =>
			{
				return item.Type == "fieldtrip";
			});
		}).then(items =>
		{
			var openTrips = [],
				viewTrips = [],
				editTrips = self.getEditTrips(),
				tripA = editTrips.length > 0 ? editTrips[0] : fieldTrips[0];
			fieldTrips.forEach((trip) =>
			{
				if (items.some(i => i.Id == trip.Id))
				{
					viewTrips.push(trip);
				} else
				{
					openTrips.push(trip);
				}
			});
			return Promise.all([
				openTrips.length > 0 && self.setOpenFieldTrips(self.getEditTrips().concat(openTrips)),
				viewTrips.length > 0 && self.setViewFieldTrips(self.getViewTrips().concat(viewTrips))
			]);
		});
	};

	RoutingDataModel.prototype.initSchoolSequence = function(tripId, initTrips)
	{
		var self = this;
		var filteredTrips = initTrips;
		if (tripId != null)
		{
			filteredTrips = initTrips.filter(function(trip)
			{
				return trip.id == tripId;
			});
		}
		filteredTrips.forEach(function(trip)
		{
			var _tripId = trip.id;
			self.schoolSequences[_tripId] = {};
			var schools = self.getSchoolStopsByTrip(trip);
			schools.forEach(function(item)
			{
				var relation = self.schoolSequences[_tripId][item.SchoolCode];
				if (relation != null)
				{
					if (item.Sequence < relation.minSequence)
					{
						relation.minSequence = item.Sequence;
					}
					if (item.Sequence > relation.maxSequence)
					{
						relation.maxSequence = item.Sequence;
					}
				}
				else
				{
					self.schoolSequences[_tripId][item.SchoolCode] = {
						minSequence: item.Sequence,
						maxSequence: item.Sequence
					};
				}
			});
		});
	};

	RoutingDataModel.prototype.displayByFindCandidateTripStops = function(trips)
	{
		var self = this;
		self.setOpenFieldTrips(trips).then(function()
		{
			var tripStops = self._viewModal.DocumentData.data.tripStops;
			if (tripStops)
			{
				tripStops.forEach(function(stop)
				{
					self.viewModel.drawTool.drawArrowToPoints(
						{
							geometry: TF.xyToGeometry(stop.XCoord, stop.YCoord),
							color: self.getColorByTripId(stop.FieldTripId),
							attributes: { FieldTripId: stop.FieldTripId, Id: stop.id, type: "tripStopPointer" }
						});
				});
			}
		});
	};

	RoutingDataModel.prototype.clearFindCandidates = function(trips)
	{
		var self = this;
		if (self._viewModal.DocumentData.data?.trips)
		{
			for (var i = 0; i < trips.length; i++)
			{
				if (Enumerable.From(self._viewModal.DocumentData.data.trips).Any(function(c) { return c.Id == trips[i].Id; }))
				{
					self.viewModel.drawTool.clearArrowToPoints();
					break;
				}
			}
		}
	};

	RoutingDataModel.prototype.toggleShowOptimizeChart = function()
	{
		if (!this.showImpactDifferenceChart())
		{
			this.showImpactDifferenceChart(true);
		}
		else
		{
			this.showImpactDifferenceChart(false);
		}
		this.onShowChartChangeEvent.notify();
	};

	RoutingDataModel.prototype.setUserProfileTripColor = function()
	{
		var self = this;
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "userprofiles", "?dbid=" + tf.datasourceManager.databaseId)).then(function(responses)
		{
			self.colors = responses.Items[0].TripColors.split(";");
		});
	};

	RoutingDataModel.prototype.stopPathChange = function(name, stops)
	{
		let self = this;
		if (!($.isArray(stops))) return;
		(stops || []).map(function(stop)
		{
			if (stop)
			{
				self.stopPathDictionary[stop.id] = stop.DrivingDirections;
			}
		});
	};

	RoutingDataModel.prototype.getGeneratedPath = function(stopId)
	{
		return this.stopPathDictionary[stopId];
	};

	RoutingDataModel.prototype.setLoadTimeSettings = function()
	{
		var self = this;
		return self.loadDistrictPolicy().then(function(responses)
		{
			self.loadTimeSettings = responses;
		});
	};

	RoutingDataModel.prototype.loadDistrictPolicy = function()
	{
		var self = this;
		var databaseId = tf.datasourceManager.databaseId;
		var getDistrictStudentPolicies = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "districtStudentPolicies"), { paramData: { dbid: databaseId } }, { overlay: false });
		var getGrades = self.grades ? Promise.resolve({ Items: self.grades }) : tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "grades"));
		var getDistrictTripPolicies = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "districtTripPolicies"), { paramData: { dbid: databaseId } }, { overlay: false });

		return Promise.all([getDistrictStudentPolicies, getGrades, getDistrictTripPolicies])
			.then(function(data)
			{
				var districtStudentPolicies = data[0].Items;
				self.grades = data[1].Items;
				var districtTripPolicy = data[2].Items[0];
				var rawData = TF.DistrictPolicyHelper.mergeDistrictPolicies(districtStudentPolicies, self.grades, districtTripPolicy);
				return rawData;
			});
	};

	RoutingDataModel.prototype.loadTrip = function(trips)
	{
		var ids = trips.map(function(trip)
		{
			return trip.id;
		}).join(",");
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "trips"), {
			paramData: {
				"@filter": "in(id," + ids + ")",
				"@relationships": "TripStop,vehicle"
			}
		}, { overlay: false }).then(function(data)
		{
			return data.Items;
		});
	};

	RoutingDataModel.prototype.setViewFieldTrips = function(data)
	{
		var self = this;
		if (data.length == 0)
		{
			// if no need to open,close all view trips
			return self.closeAllViewTrips();
		}
		var newTrips = self._getNewTrip(data);
		var ids = newTrips.map(function(c) { return c.id; });
		self.trips = self.trips.concat(newTrips);
		self.bindColor();

		// var p1 = self._fetchTripData(newTrips.filter(function(trip)
		// {
		// 	return trip.Session == TF.Helper.TripHelper.Sessions.ToSchool;
		// }).map(function(c) { return c.Id; }));
		// var p2 = self._fetchTripData(newTrips.filter(function(trip)
		// {
		// 	return trip.Session == TF.Helper.TripHelper.Sessions.FromSchool;
		// }).map(function(c) { return c.Id; }));
		// var p3 = self._fetchTripData(newTrips.filter(function(trip)
		// {
		// 	return trip.Session == TF.Helper.TripHelper.Sessions.Both;
		// }).map(function(c) { return c.Id; }));
		// var p4 = self._fetchTripData(newTrips.filter(function(trip)
		// {
		// 	return trip.Session == TF.Helper.TripHelper.Sessions.Shuttle;
		// }).map(function(c) { return c.Id; }));

		// var p5 = self._getTripPathFeatureData(ids, Promise.all([p1, p2, p3]));
		// var p6 = self._getTripBoundaryFeatureData(ids, Promise.all([p1, p2, p3]));
		return Promise.all([ self._fetchTripData(ids)]).then(function()
		{
			self._setOpenType(newTrips, "View");
			return self._removeNotOpenViewTrips(data, newTrips);
		}).then(function()
		{
			// return self._getSchoolLocations(newTrips);
		}).then(function()
		{
			// self.setActualStopTime(self.trips);

			// remove student
			// self.setStudentTravelTime(self.trips);
			// self.setAllStudentValidProperty(self.trips);
			// self.routingStudentManager.refresh();
			self.onTripsChangeEvent.notify({ add: newTrips, edit: [], delete: [], draw: false });
		});
	};

	RoutingDataModel.prototype.setOpenFieldTrips = function(data, disableAutoZoom)
	{
		var self = this, newTrips = [], newTripIds = [], remainTripIds = [], remainTrips = [];

		if (data.length == 0)
		{
			// if no need to open,close all
			return self.closeAllEditTrips();
		}

		data = Enumerable.From(data).OrderBy("$.Name").ToArray();
		var viewTrips = self.getViewTrips().filter(function(trip)
		{
			return Enumerable.From(data).Any(function(c) { return c.Id == trip.id; });
		});
		if (viewTrips && viewTrips.length > 0)
		{
			self.closeByViewFieldTrips(viewTrips);
		}
		tf.loadingIndicator.showImmediately();
		return self._filterNotLockTripIds(data).then(function(availableIds)
		{
			data = data.filter(function(c) { return availableIds.indexOf(c.Id + "") >= 0; });
			if (data.length == 0)
			{
				return Promise.reject();
			}
			self.trips.forEach(function(trip)
			{
				if (Enumerable.From(data).Any(function(c) { return c.Id == trip.id; }))
				{
					remainTripIds.push(trip.id);
					remainTrips.push(trip);
				}
			});

			newTrips = self._getNewTrip(data);
			newTripIds = newTrips.map(function(c) { return c.id; });
			self.trips = self.trips.concat(newTrips);
			self.viewModel.routingChangePath && self.viewModel.routingChangePath.stop();
			self._removeNotOpenEditTrips(data);
			self.bindColor();

			var p1 = self._fetchTripData(newTripIds);
			var p2 = self._getFieldTripPathFeatureData(newTripIds, p1).then(function()
			{
				if (!disableAutoZoom)
				{
					self.viewModel.eventsManager.zoomClick({});
				}
			});

			// var p3 = self._getTripBoundaryFeatureData(newTripIds, p1);

			return Promise.all([p1, p2]);
		}).then(function(tripsData)
		{
			tf.loadingIndicator.tryHide();

			const fetchedTripsData = tripsData[0].FieldTrips;

			// remove not exist new trip
			newTrips = newTrips.filter(function(trip)
			{
				var exist = Enumerable.From(fetchedTripsData).Any(function(t) { return t.id == trip.id; });
				if (!exist)
				{
					self.trips = self.trips.filter(function(t) { return t.id != trip.id; });
				}
				return exist;
			});

			// remember trip original assignment info.
			for (let i = 0; i < fetchedTripsData.length; i++)
			{
				const tripData = fetchedTripsData[i];
				self.originalTripAssignment[tripData.id] = tripData;
			}

			self._setOpenType(newTrips, "Edit");

			// remove student
			/*
			if (remainTripIds.length == 0)
			{
				self._setCandidateStudent(tripsData[0].CandidateStudents);
			}
			self.routingStudentManager.calculateStudentPUDOStatus();
			self.setActualStopTime(self.trips);
			self.setStudentTravelTime(self.trips);
			self.setAllStudentValidProperty(self.trips);
			self.routingStudentManager.refreshStudent();
			self.viewModel.analyzeTripByDistrictPolicy.initCacheFromAssignedStudent();
			*/
			return Promise.resolve();
		}).then(function()
		{
			// return self._getSchoolLocations(newTrips);
		}).then(function()
		{
			// remove student
			// self.routingStudentManager.refreshDictionary(null, null);
			// self.viewModel.drawTool.stopTool.attachClosetStreetToStop(allTripStops); //comment for improve open trip performance.RW-11855
			self.onTripsChangeEvent.notify({ add: newTrips, edit: remainTrips, delete: [], draw: false });
			self.setTripOriginalData(newTrips);
			if (self.showImpactDifferenceChart()) { newTrips.forEach(function(trip) { self.refreshOptimizeSequenceRate(trip.id); }); }
			/*
			self.viewModel.analyzeTripByDistrictPolicy._getDistrictPolicies().then(function()
			{
				self.viewModel.analyzeTripByDistrictPolicy.analyze(self.trips, false, true);
			});
			*/

			// remove student
			// self.routingStudentManager.refreshStudentLock();
			self._updateTravelScenarioLock();
		}).catch(function(args)
		{
			console.log(args);
			self.tripLockData.unLock(data.map(x => x.Id));
			tf.loadingIndicator.tryHide();
		});
	};

	RoutingDataModel.prototype.initImportedStudentCrossStatus = function()
	{
		var self = this, promises = [];
		self.trips.map(function(trip)
		{
			trip.FieldTripStops.map(function(tripStop)
			{
				var unknowStudents = tripStop.Students.filter(function(s)
				{
					return s.CrossToStop === null || s.CrossToStop === undefined;
				});
				if (unknowStudents.length > 0)
				{
					promises.push(self.calculateStudentCrossStatus(tripStop, unknowStudents, null, trip));
				}
			});
		});

		if (promises.length == 0)
		{
			return Promise.resolve(true);
		}
		else
		{
			return Promise.all(promises).then(function()
			{
				return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "RoutingTrips"),
					{
						data: self.trips
					});
			});
		}
	};

	RoutingDataModel.prototype._setCandidateStudent = function(students)
	{
		var self = this;
		var candidates = self._buildCandidateStudent(students);
		this.candidateStudents = self.removeRemovedCandidate(candidates);
	};

	RoutingDataModel.prototype.unassignedStudentSettingChange = function()
	{
		var oldSetting = $.extend({}, this._candidateSetting);
		var newSetting = this._getCandidateSetting(true);
		var isCandidateChanged = false;
		var candidateChangedKey = ["endDate", "startDate", "filter", "friday", "monday", "saturday", "sunday", "thursday", "tuesday", "wednesday",
			"inCriteriaScheduledElsewhere", "inCriteriaUnassigned", "notInCriteriaScheduledElsewhere", "notInCriteriaUnassigned",
			"attendingUnassignedFilter", "attendingScheduledFilter", "notAttendingUnassignedFilter", "notAttendingScheduledFilter"];
		var thematicChangeKey = ["attendingScheduledSymbol", "attendingUnassignedSymbol", "notAttendingScheduledSymbol", "notAttendingUnassignedSymbol", "showLegend"];
		var isThematicChanged = false;
		for (var key in oldSetting)
		{
			if (candidateChangedKey.indexOf(key) >= 0 && oldSetting[key] != newSetting[key])
			{
				isCandidateChanged = true;
			}
			if (thematicChangeKey.indexOf(key) >= 0 && !TF.equals(oldSetting[key], newSetting[key]))
			{
				isThematicChanged = true;
			}
		}

		// clear thematic
		if ((isThematicChanged || isCandidateChanged) && this.viewModel._viewModal.RoutingMapTool.thematicTool)
		{
			this.viewModel._viewModal.RoutingMapTool.thematicTool.thematicMenu.clearThematicSelection(true, true);
		}

		if (isCandidateChanged)
		{
			this.refreshCandidateStudent();
		} else if (isThematicChanged)
		{
			this.routingStudentManager.getUnassignedStudentDrawTool().refreshUnassignStudentLegend();
		}
	};

	RoutingDataModel.prototype._buildCandidateStudent = function(students)
	{
		if (students && students.length > 0 && students[0].geometry)
		{
			return students;
		}
		var mapping = {
			IS: "IsShowOnMap",
			LN: "LastName",
			FN: "FirstName",
			G: "Grade",
			LT: "LoadTime",
			PC: "ProhibitCross",
			SC: "SchoolCode",
			SI: "SchoolId",
			X: "XCoord",
			Y: "YCoord",
			A: "Address"
		};

		// convert source to target by mapping
		function convert(source, target, mapping)
		{
			for (var key in source)
			{
				if (typeof mapping[key] == "string")
				{
					target[mapping[key]] = source[key];
				}
				else if (typeof mapping[key] == "object")
				{
					for (var s in mapping[key])
					{
						if ($.isArray(source[key]))
						{
							target[s] = [];
							for (var i = 0; i < source[key].length; i++)
							{
								var obj = {};
								convert(source[key][i], obj, mapping[key][s]);
								target[s].push(obj);
							}

						} else if (!source[key])
						{
							target[s] = source[key];
						} else
						{
							target[s] = {};
							convert(source[key], target[s], mapping[key][s]);
						}
					}
				}
				else if (!mapping[key])
				{
					target[key] = source[key];
				}
			}
		}

		return students.map(function(student)
		{
			var stud = {
				IsAssigned: false,
				TripID: 0,
				TripStopID: 0,
				AnotherTripStopID: 0,
				TransStopTime: '0001-01-01T00:00:00.000',
				CrossToStop: null,
				DistanceToStop: 0,
				InCriteriaScheduledElsewhere: false,
				InCriteriaUnassigned: false,
				NotInCriteriaScheduledElsewhere: true,
				NotInCriteriaUnassigned: false
			};
			convert(student, stud, mapping);
			RoutingDataModel.weekdays.forEach(function(item)
			{
				if (typeof (stud["Valid" + item]) == "undefined")
				{
					stud["Valid" + item] = stud[item];
				}
			});
			stud.IsShowOnMap = !!stud.XCoord;
			if (!stud.geometry)
			{
				stud.geometry = TF.xyToGeometry(stud.XCoord, stud.YCoord);
			}
			return stud;
		});
	};

	RoutingDataModel.prototype._setOpenType = function(trips, openType)
	{
		trips.map(function(trip)
		{
			trip.OpenType = openType;
			trip.FieldTripStops.map(function(tripStop)
			{
				tripStop.OpenType = openType;

				// remove student
				// tripStop.Students.map(function(student)
				// {
				// 	student.OpenType = openType;
				// });
			});
		});
	};

	RoutingDataModel.prototype._getSchoolLocations = function(trips)
	{
		var self = this, promiseAll = [];
		if (trips.length == 0)
		{
			return Promise.resolve([]);
		}
		trips[0].FieldTripStops.map(function(tripStop)
		{
			if (tripStop.SchoolCode)
			{
				promiseAll.push(tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "schoollocations", "?schoolCode=" + tripStop.SchoolCode))
					.then(function(apiResponse)
					{
						var items = apiResponse.Items;
						items.forEach(function(item)
						{
							item.geometry = TF.xyToGeometry(item.Xcoord, item.Ycoord);
						});
						self.schoolLocationDictionary[tripStop.SchoolCode] = items;
					}));
			}
		});
		return Promise.all(promiseAll);
	};

	/**
	* draw school location on map
	*/
	RoutingDataModel.prototype.drawSchoolLocation = function()
	{
		var locations = [];
		for (var key in this.schoolLocationDictionary)
		{
			locations = locations.concat(this.schoolLocationDictionary[key]);
		}
		this.viewModel.drawTool.drawSchoolLocation(locations);
	};

	RoutingDataModel.prototype.getSchoolLocationsBySchoolCode = function(schoolCode)
	{
		return this.schoolLocationDictionary[schoolCode];
	};

	RoutingDataModel.prototype.setTripOriginalData = function(trips)
	{
		var self = this;
		trips.map(function(trip, index)
		{
			// save current trip restrictions
			if (index == 0)
			{
				self.restrictions.map(function(r)
				{
					self.tripOriginalRestrictions[r] = trip[r];
				});
			}

			trip.FieldTripStops.map(function(tripStop)
			{
				self.stopPathDictionary[tripStop.id] = tripStop.DrivingDirections;
				self.tripStopOriginalData[tripStop.id] = trip.id;
				if (!self.tripOriginalData[trip.id])
				{
					self.tripOriginalData[trip.id] = [tripStop.id];
				}
				else
				{
					self.tripOriginalData[trip.id].push(tripStop.id);
				}

				// remove student
				// tripStop.Students.map(function(student)
				// {
				// 	RoutingDataModel.weekdays.forEach(function(name)
				// 	{
				// 		if (student[name])
				// 		{
				// 			if (!student.RequirementID)
				// 			{
				// 				return;
				// 			}

				// 			var key = student.RequirementID + "_" + student.PreviousScheduleID + "_" + name;
				// 			AddToArrayInDictionary(self.studentTripOriginalData, key, trip.id);
				// 			AddToArrayInDictionary(self.tripStudentOriginalData, trip.id, key);
				// 		}
				// 	});
				// });
			});
		});
	};

	RoutingDataModel.prototype.updateTripOriginalData = function(trips)
	{
		trips = trips.filter(function(trip) { return trip.OpenType == "Edit"; });
		this.clearTripOriginalData(trips);
		this.setTripOriginalData(trips);
	};

	RoutingDataModel.prototype.clearTripOriginalData = function(trips)
	{
		var self = this;
		trips.map(function(trip)
		{
			if (self.tripOriginalData[trip.id])
			{
				delete self.tripOriginalData[trip.id];
			}
			trip.FieldTripStops.map(function(tripStop)
			{
				self.expiredExceptions[tripStop.id] && delete self.expiredExceptions[tripStop.id];
				if (self.tripStopOriginalData[tripStop.id])
				{
					delete self.tripStopOriginalData[tripStop.id];
				}
				if (self.tripStudentOriginalData[trip.id])
				{
					self.tripStudentOriginalData[trip.id].map(function(key)
					{
						var value = self.studentTripOriginalData[key];
						if (value)
						{
							value = value.filter(e => { return e != trip.id; });
							if (value.length == 0)
							{
								delete self.studentTripOriginalData[key];
							}
						}
					});
				}
			});
			if (self.tripStudentOriginalData[trip.id])
			{
				delete self.tripStudentOriginalData[trip.id];
			}
		});
	};

	RoutingDataModel.prototype.handleRelatedTrip = function(trips, type)
	{
		var self = this;
		var allRelatedTrips = $.extend([], trips);
		self.getRelatedUnsavedTrip(trips, allRelatedTrips);
		if (allRelatedTrips.length > trips.length)
		{
			var otherRelatedTrips = allRelatedTrips.filter(function(trip)
			{
				return !Enumerable.From(trips).Any(function(p) { return p.id == trip.id; });
			});
			var message = self.getMessage(type);
			otherRelatedTrips.map(function(trip, index)
			{
				if (index != otherRelatedTrips.length - 1)
				{
					message += trip.Name + ', ';
				}
				else
				{
					message += trip.Name + '.';
				}
			});
			return { trips: allRelatedTrips, message: message };
		}
		else
		{
			return { trips: trips };
		}
	};

	RoutingDataModel.prototype.getMessage = function(type)
	{
		switch (type)
		{
			case 'save':
				return "Trips change related with other trips, you will be also saving ";
			case 'revert':
				return "Trips change related with other trips, you will also revert ";
			case 'close':
				return "Trips change related with other trips, you will be also closing ";
			default:
				return '';
		}
	};

	RoutingDataModel.prototype.getRelatedUnsavedTrip = function(trips, allRelatedTrips)
	{
		var relatedTripsDictionary = {}, self = this;
		function _getRelatedUnsavedTrip(trips, allRelatedTrips)
		{
			trips.map(function(trip)
			{
				trip.FieldTripStops.map(function(tripStop)
				{
					var tripId = self.tripStopOriginalData[tripStop.id];
					if (tripId)
					{
						if (!relatedTripsDictionary[tripId])
						{
							relatedTripsDictionary[tripId] = self.getTripById(tripId);
						}
					}

					// remove student
					// tripStop.Students.map(function(student)
					// {
					// 	RoutingDataModel.weekdays.forEach(function(name)
					// 	{
					// 		if (student[name])
					// 		{
					// 			if (!student.RequirementID)
					// 			{
					// 				return;
					// 			}

					// 			var tripIds = self.studentTripOriginalData[student.RequirementID + "_" + student.PreviousScheduleID + "_" + name];
					// 			if (tripIds && !tripIds.includes(trip.id))
					// 			{
					// 				tripIds.map(tripId =>
					// 				{
					// 					if (!relatedTripsDictionary[tripId])
					// 					{
					// 						relatedTripsDictionary[tripId] = self.getTripById(tripId);
					// 					}
					// 				});
					// 			}
					// 		}
					// 	});
					// });
				});

				if (self.tripOriginalData[trip.id])
				{
					self.tripOriginalData[trip.id].map(function(tripStopId)
					{
						if (tripStopId)
						{
							self.trips.map(function(tripTemp)
							{
								tripTemp.FieldTripStops.map(function(tripStop)
								{
									if (tripStop.id == tripStopId)
									{
										if (!relatedTripsDictionary[tripStop.FieldTripId])
										{
											relatedTripsDictionary[tripStop.FieldTripId] = tripTemp;
										}
									}
								});
							});
						}
					});
				}

				if (self.tripStudentOriginalData[trip.id])
				{
					self.tripStudentOriginalData[trip.id].map(function(key)
					{
						if (key && key.split("_").length > 0)
						{
							var keySplit = key.split("_");
							var requirementID = keySplit[0];
							var previousScheduleID = keySplit[1];
							var weekDayName = keySplit[2];
							self.trips.map(function(tripTemp)
							{
								if (self.tripStudentOriginalData[tripTemp.id] && self.tripStudentOriginalData[tripTemp.id].includes(key))
								{
									return;
								}

								// remove student
								// tripTemp.FieldTripStops.map(function(tripStop)
								// {
								// 	tripStop.Students.map(function(student)
								// 	{
								// 		if (student.RequirementID == requirementID &&
								// 			student.PreviousScheduleID == previousScheduleID &&
								// 			student[weekDayName])
								// 		{
								// 			if (!relatedTripsDictionary[tripStop.FieldTripId])
								// 			{
								// 				relatedTripsDictionary[tripStop.FieldTripId] = tripTemp;
								// 			}
								// 		}
								// 	});
								// });
							});
						}
					});
				}
			});
			var relatedTrips = [];
			for (var item in relatedTripsDictionary)
			{
				if (!Enumerable.From(allRelatedTrips).Any(function(p) { return p.id == item; }))
				{
					allRelatedTrips.push(relatedTripsDictionary[item]);
					relatedTrips.push(relatedTripsDictionary[item]);
				}
			}
			if (relatedTrips.length > 0)
			{
				return _getRelatedUnsavedTrip(relatedTrips, allRelatedTrips);
			}
			else
			{
				return allRelatedTrips;
			}
		}

		return _getRelatedUnsavedTrip(trips, allRelatedTrips);
	};

	RoutingDataModel.prototype.clearOptimizeImpact = function(canvas_container)
	{
		function clearCanvas(element)
		{
			var c = element;
			var ctx = c.getContext("2d");

			ctx.clearRect(0, 0, c.width, c.height);
		}
		if (canvas_container)
		{
			canvas_container.find('.trip-canvas-distance-info').map(function(index, element)
			{
				clearCanvas(element);
			});
			canvas_container.find('.trip-canvas-duration-info').map(function(index, element)
			{
				clearCanvas(element);
			});
		}
	};

	RoutingDataModel.prototype.refreshOptimizeSequenceRate = function(tripId, noNeedTriggerEvent, trip, inactiveHideLocator)
	{
		var self = this, tripStopRouteDictionary = {};
		var oldTrip = trip ? trip : self.getTripById(tripId);
		if (oldTrip.FieldTripStops.length <= 1)
		{
			if (!noNeedTriggerEvent)
			{
				self.onOptimizeSequenceDiffRateChange.notify({
					tripId: oldTrip.id
				});
			}
			return false;
		}
		var treeView = self.viewModel.$element.find("#routingtreeview").data('kendoTreeView');
		var tripNode = treeView.dataSource.getFirst(tripId, function(item)
		{
			return item.customData && item.customData.isTrip;
		});
		var canvas_container;
		if (tripNode)
		{
			var tripElement = treeView.findByUid(tripNode.uid);
			// add loading until complete
			self.clearOptimizeImpact(tripElement);
			canvas_container = tripElement.find('.trip-canvas-container');
			var loadingElement = '<div class="process-loading"></div>';
			canvas_container.append(loadingElement);
		}
		// remove route stop path, cause route stop property contain _map property, json copy would catch circular sturcture error
		oldTrip.FieldTripStops.map(function(tripStop)
		{
			if (tripStop.routeStops)
			{
				if (!tripStopRouteDictionary[tripStop.id])
				{
					tripStopRouteDictionary[tripStop.id] = tripStop.routeStops;
				}
				delete tripStop.routeStops;
			}
		});
		var newTrip = JSON.parse(JSON.stringify(oldTrip));
		// revert removed route stop property
		oldTrip.FieldTripStops.map(function(tripStop)
		{
			if (tripStopRouteDictionary[tripStop.id])
			{
				tripStop.routeStops = tripStopRouteDictionary[tripStop.id];
			}
		});
		TF.loopCloneGeometry(newTrip, oldTrip);
		var newTripStops = [];
		var promiseList = [];
		var startIndex = 0;
		for (var i = 0; i < newTrip.FieldTripStops.length; i++)
		{
			if (i != 0 && newTrip.FieldTripStops[i].SchoolCode)
			{
				promiseList.push(self.viewModel.drawTool.NAtool.refreshTripByMultiStops(newTrip.FieldTripStops.slice(startIndex, i + 1), true));
				startIndex = i;
			}
			else if (i == newTrip.FieldTripStops.length - 1 && (newTrip.FieldTripStops[i].SchoolCode === "" || newTrip.FieldTripStops[i].SchoolCode === null))
			{
				promiseList.push(self.viewModel.drawTool.NAtool.refreshTripByMultiStops(newTrip.FieldTripStops.slice(startIndex, i + 1), true));
			}
		}
		return Promise.all(promiseList).then(function(newList)
		{
			var promise = Promise.resolve(true);
			if (newList[0] && newList[0].err)
			{
				promise = Promise.reject(new Error(newList[0].err));
			}
			else
			{
				promise = self.recalculate([newTrip]);
				newList.map(function(stopsList, index)
				{
					var isNASolved = !!stopsList;
					if (isNASolved)
					{
						if (index == 0)
						{
							newTripStops = newTripStops.concat(stopsList);
						}
						else
						{
							newTripStops = newTripStops.concat(stopsList.slice(1, stopsList.length));
						}
					} else
					{
						newTripStops = newTrip.FieldTripStops;
					}

				});
				newTrip.FieldTripStops = newTripStops;
				newTrip.FieldTripStops.map(function(tripStop, index)
				{
					tripStop.Sequence = index + 1;
				});
			}
			return promise.then(function(response)
			{
				var tripData = response[0];
				newTrip.Distance = tripData.Distance;
				newTrip.Name = newTrip.Name + ' Copy';
				for (var j = 0; j < newTrip.FieldTripStops.length; j++)
				{
					newTrip.FieldTripStops[j].TotalStopTime = tripData.FieldTripStops[j].TotalStopTime;
					newTrip.FieldTripStops[j].Duration = tripData.FieldTripStops[j].Duration;
				}
				self.setActualStopTime([newTrip]);
				if (!inactiveHideLocator)
				{
					tf.loadingIndicator.tryHide();
				}
				var diffRates = self.getOptimizeDiffRate(oldTrip, newTrip);
				oldTrip.durationDiffRate = diffRates[0];
				oldTrip.distanceDiffRate = diffRates[1];
				oldTrip.durationDiff = diffRates[2];
				oldTrip.distanceDiff = diffRates[3];
				if (!noNeedTriggerEvent)
				{
					self.onOptimizeSequenceDiffRateChange.notify({
						durationDiffRate: diffRates[0],
						distanceDiffRate: diffRates[1],
						durationDiff: diffRates[2],
						distanceDiff: diffRates[3],
						tripId: newTrip.id
					});
				}
				if (canvas_container)
				{
					canvas_container.find('.process-loading').remove();
				}
			}).catch(function()
			{
				tf.loadingIndicator.tryHide();
				oldTrip.durationDiffRate = -999;
				oldTrip.distanceDiffRate = -999;
				oldTrip.durationDiff = -999;
				oldTrip.distanceDiff = -999;
				if (!noNeedTriggerEvent)
				{
					self.onOptimizeSequenceDiffRateChange.notify({
						durationDiffRate: -999,
						distanceDiffRate: -999,
						durationDiff: -999,
						distanceDiff: -999,
						tripId: oldTrip.id
					});
				}
				if (canvas_container)
				{
					canvas_container.find('.process-loading').remove();
				}
			});
		});
	};

	RoutingDataModel.prototype.recalculate = function(trips)
	{
		var cannotCalculate = false;
		trips.map(function(trip)
		{
			trip.FieldTripStops.map(function(tripStop)
			{
				if (!tripStop)
				{
					cannotCalculate = true;
					return;
				}
			});
		});
		if (cannotCalculate || this.recalculateAble === false)
		{
			return Promise.resolve(trips);
		}

		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "RoutingFieldTrips", "routing", "recalculate"),
			{
				data: trips
			}, { overlay: false }).then(function(response)
			{
				return response.Items;
			});
	};

	RoutingDataModel.prototype.getOptimizeDiffRate = function(oldTrip, newTrip)
	{
		var oldDuration = getTripDuration(oldTrip);
		var newDuration = getTripDuration(newTrip);
		var durationDiff = ((oldDuration - newDuration) / 60).toFixed(1);
		var durationDiffRate = oldDuration == 0 ? 'N/A' : ((((Math.abs((oldDuration - newDuration) / oldDuration)) * 100).toFixed(0)) * (durationDiff >= 0 ? 1 : -1));
		var distanceDiff = (oldTrip.Distance - newTrip.Distance).toFixed(2);
		var distanceDiffRate = oldTrip.Distance == 0 ? 'N/A' : (((Math.abs(distanceDiff / oldTrip.Distance)) * 100).toFixed(0) * (distanceDiff >= 0 ? 1 : -1));
		function getTripDuration(trip)
		{
			return Math.abs(convertToMoment(trip.ActualStartTime).diff(convertToMoment(trip.ActualEndTime), "s"));
		}
		return [durationDiffRate, distanceDiffRate, durationDiff, distanceDiff];
	};
	RoutingDataModel.prototype.bindOriginal = function(newTrips, oldTrips)
	{
		var oldTripsMap = {};
		oldTrips.forEach(function(trip)
		{
			oldTripsMap[trip.Id || trip.id] = trip;
		});
		newTrips.forEach(function(trip)
		{
			var oldTrip = oldTripsMap[trip.id];
			for (var key in oldTrip)
			{
				if (oldTrip.hasOwnProperty(key) && (typeof trip[key] == "undefined" || !trip[key]))
				{
					trip[key] = oldTrip[key];
				}
			}
		});
	};

	RoutingDataModel.prototype.getNewTripColor = function()
	{
		if (this.trips.length < this.colors.length)
		{
			return Enumerable.From(this.colors).FirstOrDefault(this.colors[0], (c) => { return !Enumerable.From(this.trips).Any((trip) => { return trip.color == c; }); });
		}
		return this.colors[this.trips.length % this.colors.length];
	};

	RoutingDataModel.prototype.createTrip = function()
	{
		var self = this;
		tf.modalManager.showModal(
			new TF.RoutingMap.RoutingPalette.RoutingTripModalViewModel({
				currentOpenTrip: self.trips.length > 0 ? self.trips[0] : null,
				dataModel: self,
				newTripColor: self.getNewTripColor()
			})
		).then(function(trip)
		{
			if (!trip)
			{
				return;
			}

			return self._getSchoolLocations([trip]).then(function()
			{
				var tripCount = self.getEditTrips().length;
				self.tripLockData.lockIds([trip.id]);
				self.trips.push(trip);
				// self.refreshCandidateStudent().then(function()
				// {
					// if (tripCount == 0)
					// 	self.autoAssignStudent([trip]);
					self.onTripsChangeEvent.notify({ add: [trip], edit: [], delete: [] });
					self.changeDataStack.push(trip);
					self.viewModel.drawTool.stopTool.attachClosetStreetToStop(trip.FieldTripStops);
				// });
				self._updateTravelScenarioLock();
			});
		});
	};

	RoutingDataModel.prototype.editTrip = function(trip)
	{
		var self = this;
		tf.modalManager.showModal(
			new TF.RoutingMap.RoutingPalette.RoutingTripModalViewModel({
				currentOpenTrip: self.trips.length > 0 ? self.trips[0] : null,
				dataModel: self,
				trip: trip
			})
		).then(function(trip)
		{
			if (!trip)
			{
				return;
			}
			for (var i = 0; i < self.trips.length; i++)
			{
				if (self.trips[i].id == trip.id)
				{
					self.trips[i] = trip;
					break;
				}
			}
			if (self.needUpdateTrip())
			{
				self.updateTrip(trip);
			}
			if (self.needUpdateTripColor())
			{
				self.changeTripColor(trip.id, trip.color, true);
			}
		});
	};

	RoutingDataModel.prototype.updateTrip = function(trip)
	{
		// this.routingStudentManager.refresh();
		this.onTripsChangeEvent.notify({ add: [], edit: [trip], delete: [] });
		this.changeDataStack.push(trip);
		if (this.showImpactDifferenceChart())
		{
			this.refreshOptimizeSequenceRate(trip.id);
		}
		this._updateTravelScenarioLock();
	};

	RoutingDataModel.prototype.saveAsNewTrip = function(trip)
	{
		var self = this;
		tf.modalManager.showModal(
			new TF.RoutingMap.RoutingPalette.RoutingTripModalViewModel({
				currentOpenTrip: self.trips.length > 0 ? self.trips[0] : null,
				saveToNewTrip: trip,
				dataModel: self,
				newTripColor: trip.color
			})
		).then(function(data)
		{
			if (!data)
			{
				return;
			}
			self.createNewTrip(data);
		});
	};

	RoutingDataModel.prototype.createNewTrip = function(trip)
	{
		var self = this;
		self.trips.push(trip);
		// remove student
		// self.routingStudentManager.refresh();
		// var deleteCandidateStudents = [];
		// trip.FieldTripStops.map(function(ts)
		// {
		// 	deleteCandidateStudents = deleteCandidateStudents.concat(ts.Students);
		// });
		// self.onStopCandidateStudentChangeEvent.notify({ add: [], edit: deleteCandidateStudents, delete: deleteCandidateStudents });
		self.onTripsChangeEvent.notify({ add: [trip], edit: [], delete: [], options: { resetScheduleTime: true } });
		if (trip.OpenType === 'Edit')
		{
			self.changeDataStack.push(trip);
		}
	};

	RoutingDataModel.prototype.resetCopyTripValue = function(trip)
	{
		var self = this;
		trip.id = TF.createId();
		trip.Id = 0;
		trip.NumTransport = 0;
		trip.MaxOnBus = 0;
		trip.color = self.getNewTripColor();
		trip.oldId = trip.id;
		let tripStopTempId = TF.createId();
		let stopBoundaryTempId = TF.createId();
		trip.FieldTripStops.map(function(tripStop)
		{
			tripStop.id = tripStopTempId++;
			tripStop.color = trip.color;
			tripStop.TripStopId = tripStop.id;
			tripStop.FieldTripId = trip.id;
			// remove student
			tripStop.Students = [];
			tripStop.ToSchoolStudents = { HomeToSchool: 0, SchoolToHome: 0 };
			tripStop.ToTransStudents = { HomeToTrans: 0, TransToHome: 0 };
			tripStop.TransToTrans = { PUTransToTrans: 0, DOTransToTrans: 0 };
			tripStop.PUTransToSchool = { TransToSchool: 0, SchoolToTrans: 0 };
			tripStop.DOTransToSchool = { TransToSchool: 0, SchoolToTrans: 0 };
			tripStop.AssignedStudentCount = 0;
			tripStop.TotalStudentCount = 0;
			tripStop.oldId = tripStop.id;
			if (tripStop.boundary)
			{
				tripStop.boundary.OBJECTID = 0;
				tripStop.boundary.FieldTripId = trip.id;
				tripStop.boundary.TripStopId = tripStop.id;
				tripStop.boundary.id = stopBoundaryTempId++;
				tripStop.boundary.newAssignStudent = [];
			}
		});
	};

	RoutingDataModel.prototype.resetCopyFieldTripValue = function(trip)
	{
		var self = this;
		trip.id = TF.createId();
		trip.Id = 0;
		// trip.NumTransport = 0;
		// trip.MaxOnBus = 0;
		trip.color = self.getNewTripColor();
		// trip.oldId = trip.id;
		let tripStopTempId = TF.createId();
		let stopBoundaryTempId = TF.createId();
		trip.FieldTripStops.map(function(tripStop)
		{
			// FieldTripStop TODO: Reset FieldTripStop field here
			tripStop.id = tripStopTempId++;
			tripStop.color = trip.color;
			tripStop.FieldTripStopId = tripStop.id;
			tripStop.FieldTripId = trip.id;
			
		});
	};

	/**
	* initial trip info for copy trip
	*/
	RoutingDataModel.prototype.initialNewTripInfo = function(trip, notAutoAssignStudent, changeTripType)
	{
		var self = this, promise = Promise.resolve(true), boundaries = [];
		if (trip.OpenType === 'Edit')
		{
			trip.FieldTripStops.map(function(tripStop)
			{
				if (tripStop.boundary.TripStopId)
				{
					boundaries.push(tripStop.boundary);
				}
			});
			promise = self.initCandidateStudentsCrossStatus(trip);
		}
		return promise.then(function()
		{
			promise = Promise.resolve(true);
			if (changeTripType)
			{
				promise = self.getCandidateStudent(trip);
			}
			else if (boundaries.length > 0 && !notAutoAssignStudent)
			{
				promise = self.fieldTripStopDataModel.updateTripBoundaryStudents(boundaries, trip.FieldTripStops, false, false, null, true);
			}
			return promise.then(function(newTripCandidateStudents)
			{
				var p = Promise.resolve(true);
				// remove student
				// if (trip.OpenType === 'View' && !notAutoAssignStudent)
				// {
				// 	p = self.assignedStudentsToViewTrip(newTripCandidateStudents, trip, changeTripType);
				// }
				return p.then(function()
				{
					return self.recalculate([trip]).then(function(response)
					{
						var tripData = response[0];
						trip.Distance = tripData.Distance;
						for (var j = 0; j < trip.FieldTripStops.length; j++)
						{
							trip.FieldTripStops[j].TotalStopTime = tripData.FieldTripStops[j].TotalStopTime;
							trip.FieldTripStops[j].Duration = tripData.FieldTripStops[j].Duration;
						}
						self.setFieldTripActualStopTime([trip]);
						// remove student
						// self.setStudentTravelTime([trip]);
						// self.setAllStudentValidProperty([trip]);
						return Promise.resolve(trip);
					});
				});
			});
		});
	};

	/**
	* initial trip info for copy field trip
	*/
	RoutingDataModel.prototype.initialNewFieldTripInfo = function(trip, notAutoAssignStudent, changeTripType)
	{
		var self = this, promise = Promise.resolve(true), boundaries = [];
		// if (trip.OpenType === 'Edit')
		// {
		// 	trip.FieldTripStops.map(function(tripStop)
		// 	{
		// 		if (tripStop.boundary.TripStopId)
		// 		{
		// 			boundaries.push(tripStop.boundary);
		// 		}
		// 	});
		// 	promise = self.initCandidateStudentsCrossStatus(trip);
		// }
		return promise.then(function()
		{
			promise = Promise.resolve(true);
			// if (changeTripType)
			// {
			// 	promise = self.getCandidateStudent(trip);
			// }
			// else if (boundaries.length > 0 && !notAutoAssignStudent)
			// {
			// 	promise = self.fieldTripStopDataModel.updateTripBoundaryStudents(boundaries, trip.FieldTripStops, false, false, null, true);
			// }
			return promise.then(function(newTripCandidateStudents)
			{
				var p = Promise.resolve(true);

				// remove student
				// if (trip.OpenType === 'View' && !notAutoAssignStudent)
				// {
				// 	p = self.assignedStudentsToViewTrip(newTripCandidateStudents, trip, changeTripType);
				// }
				return p.then(function()
				{
					return self.recalculate([trip]).then(function(response)
					{
						var tripData = response[0];
						trip.Distance = tripData.Distance;
						for (var j = 0; j < trip.FieldTripStops.length; j++)
						{
							trip.FieldTripStops[j].TotalStopTime = tripData.FieldTripStops[j].TotalStopTime;
							trip.FieldTripStops[j].Duration = tripData.FieldTripStops[j].Duration;
						}
						self.setFieldTripActualStopTime([trip]);

						// remove student
						// self.setStudentTravelTime([trip]);
						// self.setAllStudentValidProperty([trip]);
						return Promise.resolve(trip);
					});
				});
			});
		});
	};

	RoutingDataModel.prototype.assignedStudentsToViewTrip = function(newTripCandidateStudents, trip, changeTripType)
	{
		var self = this, boundaries = [], allNewAssignStudents = [];
		if (changeTripType)
		{
			allNewAssignStudents = newTripCandidateStudents.filter(function(student)
			{
				if (Enumerable.From(self.getAllStudents()).FirstOrDefault(null, function(c) { return c.id == student.id; }))
				{
					return true;
				}
			});
		}
		else
		{
			allNewAssignStudents = self.candidateStudents;
		}
		trip.FieldTripStops.map(function(tripStop)
		{
			if (tripStop.boundary.TripStopId)
			{
				boundaries.push(tripStop.boundary);
			}
		});
		boundaries = boundaries.filter(function(c) { return c.geometry && c.TripStopId; });
		var studentIds = self.getUnAssignStudentInBoundary(boundaries, allNewAssignStudents, true);
		var promiseList = [];
		trip.FieldTripStops.forEach(tripStop =>
		{
			let students = [];
			if (tripStop.boundary && tripStop.boundary.TripStopId && tripStop.boundary.geometry) // assign student for boundary stop
			{
				const boundary = Enumerable.From(boundaries).FirstOrDefault(null, x => x.TripStopId === tripStop.id);
				students = boundary.newAssignStudent.filter(student => Enumerable.From(studentIds).Any(c => c.id == student.id));
			} else if (tripStop.originalStudents.length > 0)// assign student for no boundary stop
			{
				students = allNewAssignStudents.filter(x => tripStop.originalStudents.some(y => y.id === x.id));
			}
			if (students.length > 0)
			{
				promiseList.push(self.assignStudent(students, tripStop, null, true, null, null, true, null, changeTripType));
			}
		});
		return Promise.all(promiseList);
	};

	RoutingDataModel.prototype.copyAsNewFieldTrip = function(trip)
	{
		var self = this;
		tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.CopyFieldTripModalViewModel(trip, self))
			.then(function(data)
			{
				if (!data)
				{
					return;
				}

				// remove student
				// self.routingStudentManager.refresh();
				// var deleteCandidateStudents = [];

				// data.FieldTripStops.map(function(ts)
				// {
				// 	deleteCandidateStudents = deleteCandidateStudents.concat(ts.Students);
				// });

				// self.onStopCandidateStudentChangeEvent.notify({ add: [], edit: deleteCandidateStudents, delete: deleteCandidateStudents });
				self.onTripsChangeEvent.notify({ add: [data], edit: [], delete: [], options: { resetScheduleTime: true } });
				if (data.OpenType === 'Edit')
				{
					// if (self.showImpactDifferenceChart())
					// {
					// 	self.refreshOptimizeSequenceRate(data.id);
					// }
					self.changeDataStack.push(data);
				}
			});
	};

	RoutingDataModel.prototype.copyAsNewTrip = function(trip)
	{
		var self = this;
		tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.CopyTripModalViewModel(trip, self))
			.then(function(data)
			{
				if (!data)
				{
					return;
				}

				// remove student
				// self.routingStudentManager.refresh();
				var deleteCandidateStudents = [];

				// remove student
				// data.FieldTripStops.map(function(ts)
				// {
				// 	deleteCandidateStudents = deleteCandidateStudents.concat(ts.Students);
				// });

				self.onStopCandidateStudentChangeEvent.notify({ add: [], edit: deleteCandidateStudents, delete: deleteCandidateStudents });
				self.onTripsChangeEvent.notify({ add: [data], edit: [], delete: [], options: { resetScheduleTime: true } });
				if (data.OpenType === 'Edit')
				{
					if (self.showImpactDifferenceChart())
					{
						self.refreshOptimizeSequenceRate(data.id);
					}
					self.changeDataStack.push(data);
				}
			});
	};

	RoutingDataModel.prototype.createTripFromGPS = function(trip)
	{
		var self = this, notAutoAssign = self.getNotAutoAssignStudentSetting();
		if (!trip)
		{
			return;
		}
		var schoolIds = trip.SchoolIds.split("!").filter(function(c) { return !!c; });
		return tf.ajax.get(pathCombine(tf.api.apiPrefix(), "schools"), {
			paramData: {
				"@filter": "in(Id," + schoolIds.toString() + ")"
			}
		}).then(function(response)
		{
			// trip.id = TF.createId();
			trip.Schools = trip.Schools;
			trip.SchoolIds = trip.SchoolIds;
			trip.IsToSchool = trip.Session == TF.Helper.TripHelper.Sessions.ToSchool;
			trip.type = "trip";
			trip.visible = true;
			var schools = schoolIds.map(function(schoolId)
			{
				return Enumerable.From(response.Items).FirstOrDefault({}, function(c) { return c.Id == schoolId; });
			});
			schools.forEach(function(school, i)
			{
				var tripStop = self.fieldTripStopDataModel.getDataModel();
				tripStop.id = TF.createId();
				tripStop.TripStopId = tripStop.id;
				tripStop.FieldTripId = trip.id;
				tripStop.StopTime = trip.Session != TF.Helper.TripHelper.Sessions.FromSchool ? (school.ArrivalTime ? school.ArrivalTime : "08:00:00") : (school.DepartTime ? school.DepartTime : "14:00:00");
				tripStop.XCoord = school.Xcoord;
				tripStop.YCoord = school.Ycoord;
				tripStop.Sequence = i + 1;
				tripStop.SchoolCode = school.SchoolCode;
				tripStop.SchoolId = school.Id;
				tripStop.Street = school.Name;
				tripStop.City = school.MailCity;
				tripStop.ToSchoolStudents = { HomeToSchool: 0, SchoolToHome: 0 };
				tripStop.ToTransStudents = { HomeToTrans: 0, TransToHome: 0 };
				tripStop.TransToTrans = { PUTransToTrans: 0, DOTransToTrans: 0 };
				tripStop.PUTransToSchool = { TransToSchool: 0, SchoolToTrans: 0 };
				tripStop.DOTransToSchool = { TransToSchool: 0, SchoolToTrans: 0 };
				tripStop.vehicleCurbApproach = 1;
				tripStop.geometry = TF.xyToGeometry(school.Xcoord, school.Ycoord);
				trip.FieldTripStops.push(tripStop);
			});
			var boundaries = trip.FieldTripStops.map(function(stop)
			{
				return stop.boundary;
			});

			self.trips.push(trip);
			self.bindColor();
			var copyTrip = $.extend({}, true, trip);
			copyTrip.FieldTripStops = trip.FieldTripStops.filter(function(stop) { return stop.SchoolCode && stop.SchoolCode.length > 0; });
			self.refreshCandidateStudent(copyTrip).then(function()
			{
				var promise = Promise.resolve(true);
				if (!notAutoAssign)
				{
					promise = self.fieldTripStopDataModel.assignStudentInBoundary(boundaries, false);
				}
				promise.then(function()
				{
					self.onTripsChangeEvent.notify({ add: [trip], edit: [], delete: [] });
					self.changeDataStack.push(trip);
				});
			});
		});
	};

	RoutingDataModel.prototype.refreshCandidateStudent = function(trip, includeTripIds, silent, tripsToClose)
	{
		var self = this;
		if (!self.trips || self.trips.length == 0)
		{
			return Promise.resolve();
		}

		trip = trip ? trip : self.trips[0];
		let studentIdsInTripStop = [], getCandidateStudentPromise;
		for (var key in self.tripStopDictionary)
		{
			studentIdsInTripStop = studentIdsInTripStop.concat(self.tripStopDictionary[key].map(function(d) { return d.student.id; }));
		}

		if (tripsToClose && tripsToClose.length > 0)
		{
			getCandidateStudentPromise = Promise.resolve(self.getCandidateStudentWithoutRequest(tripsToClose));
		}
		else
		{
			getCandidateStudentPromise = self.getCandidateStudent(trip, includeTripIds, silent);
		}

		return getCandidateStudentPromise.then(function(candidateStudents)
		{
			let tripIds = self.trips.map(t => t.id);
			//add exception student
			candidateStudents = candidateStudents.concat(self.candidateStudents.filter(x =>
			{
				if (x.RequirementID)
				{
					return false;
				}

				let assignedExceptionStudent = self.getAssignStudent(x.TripID).find(a => a.id == x.id && a.TripStopID == x.TripStopID && a.AnotherTripStopID == x.AnotherTripStopID);
				if (!assignedExceptionStudent && (x.IsAssigned || !tripIds.includes(x.TripID)))
				{
					return false;
				}

				let dateRange = getIntersectDateRange(x.StartDate, x.EndDate, trip.StartDate, trip.EndDate);
				if (!dateRange)
				{
					return false;
				}

				var weekDays = filterWeekDays(getDates(new Date(dateRange.startDate.valueOf()), new Date(dateRange.endDate.valueOf())));
				x.StartDate = dateRange.startDate;
				x.EndDate = dateRange.endDate;
				x.ValidSunday = weekDays.includes(0);
				x.ValidMonday = weekDays.includes(1);
				x.ValidTuesday = weekDays.includes(2);
				x.ValidWednesday = weekDays.includes(3);
				x.ValidThursday = weekDays.includes(4);
				x.ValidFriday = weekDays.includes(5);
				x.ValidSaturday = weekDays.includes(6);
				if (assignedExceptionStudent)
				{
					x.Sunday = weekDays.includes(0) && assignedExceptionStudent.Sunday;
					x.Monday = weekDays.includes(1) && assignedExceptionStudent.Monday;
					x.Tuesday = weekDays.includes(2) && assignedExceptionStudent.Tuesday;
					x.Wednesday = weekDays.includes(3) && assignedExceptionStudent.Wednesday;
					x.Thursday = weekDays.includes(4) && assignedExceptionStudent.Thursday;
					x.Friday = weekDays.includes(5) && assignedExceptionStudent.Friday;
					x.Saturday = weekDays.includes(6) && assignedExceptionStudent.Saturday;
				}

				return x.Sunday || x.Monday || x.Tuesday || x.Wednesday || x.Thursday || x.Friday || x.Saturday;
			}));
			candidateStudents = self.removeRemovedCandidate(candidateStudents);
			var candidateChanges = self.handleDictionaryOfStudents(self.candidateStudents, candidateStudents);
			self._setCandidateStudent(candidateStudents);
			self.routingStudentManager.oldCandidateStudentsToShow = "";
			self.routingStudentManager.calculateStudentPUDOStatus();
			self.routingStudentManager.refresh();
			var changeIds = candidateChanges.add.map(function(c) { return c.id; }).concat(candidateChanges.delete.map(function(c) { return c.id; }))
			if (!includeTripIds)
			{
				var editTrips = self.getEditTrips();
				var inStopChangeIds = Enumerable.From(changeIds).Where(function(c) { return studentIdsInTripStop.indexOf(c) >= 0; }).Distinct().ToArray();

				if (editTrips.length > 0 && editTrips[0].Session == TF.Helper.TripHelper.Sessions.Both && inStopChangeIds.length > 0)
				{
					self.viewModel.display.refreshAffectStopByStudentId(inStopChangeIds);
				} else
				{
					self.onStopCandidateStudentChangeEvent.notify(candidateChanges);
				}
			}
			self.routingStudentManager.refreshStudentLock();
			return changeIds;
		});
	};

	RoutingDataModel.prototype.removeRemovedCandidate = function(candidateStudents)
	{
		var self = this;
		if (self.removedCandidateIds.length > 0)
		{
			return candidateStudents.filter(function(student) { return self.removedCandidateIds.indexOf(student.RequirementID) < 0; });
		} else
		{
			return candidateStudents;
		}
	};

	RoutingDataModel.prototype.handleDictionaryOfStudents = function(previousCandidateStudents, currentCandidateStudents)
	{
		var deleteCandidateStudents = [], addCandidateStudents = [], editCandidateStudents = [];// , remainCandidateStudents = [];

		// remove student
		// remain students that unassign from trip
		// this.trips.forEach(function(trip)
		// {
		// 	 remainCandidateStudents = remainCandidateStudents.concat(trip.originalStudents || []);
		// });

		previousCandidateStudents.forEach(function(student)
		{
			if (!Enumerable.From(currentCandidateStudents).Any(function(c) { return c.RequirementID == student.RequirementID && c.PreviousScheduleID == student.PreviousScheduleID; }))
			{
				deleteCandidateStudents.push(student);
			}
		});

		currentCandidateStudents.forEach(function(student)
		{
			var studentInPrevious = Enumerable.From(previousCandidateStudents).FirstOrDefault(null, function(c) { return c.RequirementID == student.RequirementID && c.PreviousScheduleID == student.PreviousScheduleID; });
			if (!studentInPrevious)
			{
				addCandidateStudents.push(student);
			} else
			{
				var weekDayChanged = false;
				RoutingDataModel.weekdays.forEach(function(name)
				{
					if (student["Valid" + name] != studentInPrevious["Valid" + name])
					{
						weekDayChanged = true;
					}
				});
				if (weekDayChanged)
				{
					editCandidateStudents.push(student);
				}
			}
		});

		// deleteCandidateStudents = deleteCandidateStudents.filter(function(student)
		// {
		// 	return !Enumerable.From(remainCandidateStudents).Any(function(c) { return c.RequirementID == student.RequirementID && c.PreviousScheduleID == student.PreviousScheduleID; });
		// });

		// addCandidateStudents = addCandidateStudents.filter(function(student)
		// {
		// 	return !Enumerable.From(remainCandidateStudents).Any(function(c) { return c.RequirementID == student.RequirementID && c.PreviousScheduleID == student.PreviousScheduleID; });
		// });

		return { add: addCandidateStudents, edit: editCandidateStudents, delete: deleteCandidateStudents };

	};

	//RW-32613 If Scheduled Elsewhere is not checked there is no need to send RoutingCandidateStudents request.
	RoutingDataModel.prototype.getCandidateStudentWithoutRequest = function(tripsToClose)
	{
		if (tripsToClose && tripsToClose.length > 0)
		{
			const candidateStudentsAfterClose = this.candidateStudents.filter(c => !(tripsToClose.flatMap(t => t.originalStudents).flatMap(s => s.id)).includes(c.id))
			return this._buildCandidateStudent(candidateStudentsAfterClose);
		}
		else
		{
			return this._buildCandidateStudent([]);
		}
	}

	RoutingDataModel.prototype.getCandidateStudent = function(trip, includeTripIds, silent)
	{
		var self = this;
		var paramData = {
			SchoolIds: trip.SchoolIds,
			SchoolCodes: trip.Schools,
			Session: trip.Session,
			HasBusAide: trip.HasBusAide,
			HomeSchl: trip.HomeSchl,
			HomeTrans: trip.HomeTrans,
			Shuttle: trip.Shuttle,
			NonDisabled: trip.NonDisabled,
			Disabled: trip.Disabled,
			TripFilterSpec: trip.FilterSpec,
			TripMonday: trip.Monday,
			TripTuesday: trip.Tuesday,
			TripWednesday: trip.Wednesday,
			TripThursday: trip.Thursday,
			TripFriday: trip.Friday,
			TripSaturday: trip.Saturday,
			TripSunday: trip.Sunday,
			TripStartDate: trip.StartDate,
			TripEndDate: trip.EndDate,
			TripIds: []
		};
		if (includeTripIds)
		{
			paramData.TripIds = includeTripIds;
		} else
		{
			paramData.TripIds = this.getEditTrips().map(function(c) { return c.id; });
		}
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "RoutingCandidateStudents"), {
			paramData: $.extend(paramData, this._getCandidateSetting())
		}, {
			overlay: !silent
		});/*.then(function(response)
		{
			return self._buildCandidateStudent(response.Items);
		}).catch(function()
		{
			return self._buildCandidateStudent([]);
		});
		*/
	};

	RoutingDataModel.prototype._getCandidateSetting = function(withSymbolInfo)
	{
		this._candidateSetting = this._getUnassignedStudentViewModel().dataModel.getCandidateSetting();
		if (withSymbolInfo)
		{
			return {
				monday: this._candidateSetting.monday,
				tuesday: this._candidateSetting.tuesday,
				wednesday: this._candidateSetting.wednesday,
				thursday: this._candidateSetting.thursday,
				friday: this._candidateSetting.friday,
				saturday: this._candidateSetting.saturday,
				sunday: this._candidateSetting.sunday,
				startDate: this._candidateSetting.startDate,
				endDate: this._candidateSetting.endDate,
				inCriteriaUnassigned: this._candidateSetting.inCriteriaUnassigned,
				inCriteriaScheduledElsewhere: this._candidateSetting.inCriteriaScheduledElsewhere,
				notInCriteriaUnassigned: this._candidateSetting.notInCriteriaUnassigned,
				notInCriteriaScheduledElsewhere: this._candidateSetting.notInCriteriaScheduledElsewhere,
				attendingUnassignedSymbol: this._candidateSetting.attendingUnassignedSymbol,
				attendingScheduledSymbol: this._candidateSetting.attendingScheduledSymbol,
				notAttendingUnassignedSymbol: this._candidateSetting.notAttendingUnassignedSymbol,
				notAttendingScheduledSymbol: this._candidateSetting.notAttendingScheduledSymbol,
				showLegend: this._candidateSetting.showLegend,
				attendingUnassignedFilter: this._candidateSetting.attendingUnassignedFilter,
				attendingScheduledFilter: this._candidateSetting.attendingScheduledFilter,
				notAttendingUnassignedFilter: this._candidateSetting.notAttendingUnassignedFilter,
				notAttendingScheduledFilter: this._candidateSetting.notAttendingScheduledFilter
			};
		}
		else
		{
			return {
				monday: this._candidateSetting.monday,
				tuesday: this._candidateSetting.tuesday,
				wednesday: this._candidateSetting.wednesday,
				thursday: this._candidateSetting.thursday,
				friday: this._candidateSetting.friday,
				saturday: this._candidateSetting.saturday,
				sunday: this._candidateSetting.sunday,
				startDate: this._candidateSetting.startDate,
				endDate: this._candidateSetting.endDate,
				inCriteriaUnassigned: this._candidateSetting.inCriteriaUnassigned,
				inCriteriaScheduledElsewhere: this._candidateSetting.inCriteriaScheduledElsewhere,
				notInCriteriaUnassigned: this._candidateSetting.notInCriteriaUnassigned,
				notInCriteriaScheduledElsewhere: this._candidateSetting.notInCriteriaScheduledElsewhere,
				attendingUnassignedFilter: this._candidateSetting.attendingUnassignedFilter,
				attendingScheduledFilter: this._candidateSetting.attendingScheduledFilter,
				notAttendingUnassignedFilter: this._candidateSetting.notAttendingUnassignedFilter,
				notAttendingScheduledFilter: this._candidateSetting.notAttendingScheduledFilter
			};
		}
	};

	RoutingDataModel.prototype._fetchTripData = function(fieldTripIds, overlay)
	{
		var self = this;
		if (fieldTripIds.length == 0)
		{
			return { Trips: [] };
		}
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "routingfieldtrips"), {
			paramData: $.extend({ fieldTripIds: fieldTripIds.toString() }, self._getCandidateSetting())
		}, { overlay: overlay != false ? true : false }).then(function(response)
		{
			var data = response.Items[0];
			let filterTips = '';
			if (data.HasInvalidAdditionalStuFilter)
			{
				filterTips = 'The additional student filter is invalid.';
			}

			// if (data.HasInvalidNEZFilter)
			// {
			// 	filterTips = filterTips === '' ? 'Map NEZ student filter is invalid.' : 'Map NEZ student filter and additional student filter are invalid.';
			// }

			if (filterTips)
			{
				tf.promiseBootbox.alert(filterTips);
			}

			var schoolIdsDic = {}, schoolIds = [];
			data.FieldTrips.forEach(function(trip)
			{
				trip.visible = true;
				trip.type = "trip";
				trip.FieldTripStops.forEach(function(fieldTripStop)
				{
					fieldTripStop.FieldTripId = trip.id;
					fieldTripStop.type = "tripStop";
					fieldTripStop.vehicleCurbApproach = fieldTripStop.VehicleCurbApproach;
					if (fieldTripStop.SchoolLocation)
					{
						fieldTripStop.SchoolLocation.geometry = TF.xyToGeometry(fieldTripStop.SchoolLocation.Xcoord, fieldTripStop.SchoolLocation.Ycoord);
					}
					if (fieldTripStop.SchoolId > 0 && (fieldTripStop.XCoord == 0 || fieldTripStop.YCoord == 0))
					{
						if (!schoolIdsDic[fieldTripStop.SchoolId])
						{
							schoolIdsDic[fieldTripStop.SchoolId] = fieldTripStop.SchoolId;
						}
					}

					// self.removeExpiredExceptions(fieldTripStop.Students, fieldTripStop.id, self.expiredExceptions);
				});
				return trip;
			});

			for (var schoolId in schoolIdsDic)
			{
				schoolIds.push(schoolIdsDic[schoolId]);
			}
			var promise = Promise.resolve(true);
			if (schoolIds.length > 0)
			{
				promise = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "schools"), {
					paramData: {
						"@filter": "in(Id," + schoolIds.join(",") + ")"
					}
				}).then(function(result)
				{
					data.Trips.forEach(function(trip)
					{
						trip.FieldTripStops.forEach(function(fieldTripStop)
						{
							if (fieldTripStop.SchoolId > 0)
							{
								var school = Enumerable.From(result.Items).FirstOrDefault(null, function(s) { return s.Id == fieldTripStop.SchoolId; });
								if (school)
								{
									fieldTripStop.XCoord = school.Xcoord;
									fieldTripStop.YCoord = school.Ycoord;
								}
							}
						});
					});
				});
			}

			return promise.then(function()
			{
				return data;
			});
		}).then(function(tripsData)
		{
			var allTripStops = [];
			var assignedStudents = [];
			tripsData.FieldTrips.forEach(function(trip)
			{
				var existTrip = self.getTripById(trip.id);
				if (existTrip)
				{
					existTrip.originalStudents = [];
					for (var key in trip)
					{
						if(trip[key] !== null && trip[key] !== undefined)
						{
							existTrip[key] = trip[key];
						}
						if (typeof existTrip[key] == "undefined")
						{
							existTrip[key] = trip[key];
						}
					}

					// remove student
					// self.handleDepatureAndDestinationStop(existTrip);

					// existTrip.FieldTripStops.forEach(function(fieldTripStop)
					// {
					// 	allTripStops.push(fieldTripStop);
					// 	fieldTripStop.geometry = TF.xyToGeometry(fieldTripStop.XCoord, fieldTripStop.YCoord);
					// 	fieldTripStop.color = existTrip.color;
					// 	fieldTripStop.Students = fieldTripStop.Students || [];
					// 	fieldTripStop.Students.forEach(function(student)
					// 	{
					// 		student.geometry = TF.xyToGeometry(student.XCoord, student.YCoord);
					// 	});
					// 	fieldTripStop.originalStudents = fieldTripStop.Students.map(function(c) { return $.extend({ InCriteriaUnassigned: true }, c); });// save students data to trip stop to get the original students bind on the trip stop
					// 	existTrip.originalStudents = existTrip.originalStudents.concat(fieldTripStop.originalStudents);
					// 	// self.viewModel.drawTool && self.viewModel.drawTool._addTripStop(fieldTripStop, existTrip.id);
					// 	assignedStudents = assignedStudents.concat(fieldTripStop.originalStudents);
					// });
				}
			});
			// tripsData.CandidateStudents = (tripsData.CandidateStudents || []).concat(assignedStudents.filter(function(c) { return c.CanBeCandidate; }));
			tripsData.AllTripStops = allTripStops;
			return tripsData;
		});
	};

	/**
	 * REMOVING SOON
	 * 
	 * Once the legacy data migration is finished, this method will be removed.
	 * @param {*} fieldTrip 
	 */
	RoutingDataModel.prototype.handleDepatureAndDestinationStop = function(fieldTrip)
	{
		const minSequence = Math.min(...fieldTrip.FieldTripStops.map(x=>x.Sequence));
		if(minSequence==2)
		{
			fieldTrip.FieldTripStops.unshift({
				DBID: fieldTrip.DBID,
				FieldTripId: fieldTrip.Id,
				type: "tripStop",
				ActualStopTime: "00:00:00",

				City: null,
				Comment: null,
				Distance: 0,
				DrivingDirections: null,
				Duration: "00:00:00",
				FieldTripDestinationId: null,
				GeoPath: null,
				IsCustomDirection: false,
				LockStopTime: false,
				PrimaryDeparture: true,
				PrimaryDestination: false,
				RouteDrivingDirections: null,
				Sequence: 1,
				Speed: 18,
				StopTimeArrive: null,
				StopTimeDepart: null,
				Street: fieldTrip.SchoolName,
				StreetSpeed: null,
				Travel: "00:00:00",
				VehicleCurbApproach: 0,
				XCoord: fieldTrip.SchoolXCoord,
				YCoord: fieldTrip.SchoolYCoord,
				type: "tripStop",
				vehicleCurbApproach: 0
			});
		}

		if(!fieldTrip.FieldTripStops.map(x=>x.FieldTripDestinationId).includes(fieldTrip.FieldTripDestinationId))
		{
			fieldTrip.FieldTripStops.push({
				DBID: fieldTrip.DBID,
				FieldTripId: fieldTrip.Id,
				type: "tripStop",
				ActualStopTime: "00:00:00",

				City: null,
				Comment: null,
				Distance: 0,
				DrivingDirections: null,
				Duration: "00:00:00",
				FieldTripDestinationId: fieldTrip.FieldTripDestinationId,
				GeoPath: null,
				IsCustomDirection: false,
				LockStopTime: false,
				PrimaryDeparture: false,
				PrimaryDestination: true,
				RouteDrivingDirections: null,
				Sequence: fieldTrip.FieldTripStops.length + 1,
				Speed: 18,
				StopTimeArrive: null,
				StopTimeDepart: null,
				Street: fieldTrip.Destination,
				StreetSpeed: null,
				Travel: "00:00:00",
				VehicleCurbApproach: 0,
				XCoord: fieldTrip.FieldTripDestinationXCoord,
				YCoord: fieldTrip.FieldTripDestinationYCoord,
				type: "tripStop",
				vehicleCurbApproach: 0
			});
		}
	};

	RoutingDataModel.prototype.removeExpiredExceptions = function(students, tripStopId, expiredExceptions)
	{
		// remove expired exceptions
		var num = students.length;
		while (num--)
		{
			student = students[num];
			if (student.Expired)
			{
				expiredExceptions[tripStopId] ? expiredExceptions[tripStopId].push(student) : expiredExceptions[tripStopId] = new Array(student);
				students.splice(num, 1);
			}
		}
	};

	RoutingDataModel.prototype.clearExpiredExceptionCacheOfStops = function(tripStops, expiredExceptions)
	{
		tripStops.forEach(stop => 
		{
			expiredExceptions[stop.id] && delete expiredExceptions[stop.id];
		});
	};

	RoutingDataModel.prototype._getUnassignedStudentViewModel = function()
	{
		return this.viewModel.viewModel.unassignedStudentViewModel;
	};

	RoutingDataModel.prototype._getNewTrip = function(newTrips)
	{
		var self = this;
		return newTrips.filter(function(trip)
		{
			return trip.Id && !Enumerable.From(self.trips).Any(function(c) { return c.id == trip.Id || c.Id == trip.Id || c.Id == trip.id || c.id == trip.id; });
		}).map(function(trip)
		{
			trip.id = trip.Id;
			trip.visible = true;
			trip.FieldTripStops = [];
			trip.FieldTripStops = [];
			trip.type = "trip";
			return trip;
		});
	};

	RoutingDataModel.prototype.assignStops = function(tripStops, tripId, isSequenceOptimize, isSmartSequence, isPreserve)
	{
		var self = this, tripStopArray = [], affectedTrips = [self.getTripById(tripId)];
		tripStops.map(function(tripStop)
		{
			if (tripStop.FieldTripId != tripId)
			{
				var affectedTrip = self.getTripById(tripStop.FieldTripId);
				if (!affectedTrips.includes(affectedTrip))
				{
					affectedTrips.push(affectedTrip);
				}
				tripStopArray.push(tripStop);
			}
		});

		if (tripStopArray.length == 0)
		{
			return Promise.resolve();
		}

		tf.loadingIndicator.showImmediately();
		var tripIdDictionary = {};
		var promise = new Promise(function(resolve)
		{
			setTimeout(function()
			{
				self.fieldTripStopDataModel.moveTripStopsToOtherTrip(tripStopArray, tripId, null, isSequenceOptimize, isSmartSequence, isPreserve).then(function(stops)
				{
					tf.loadingIndicator.tryHide();
					if (!stops || !$.isArray(stops))
					{
						return tf.promiseBootbox.alert("VRP calculation failed!");
					}

					self.onTripsChangeEvent.notify({ add: [], edit: affectedTrips, delete: [] });
					resolve();
				});
			});
		});

		return promise;
	};

	/**
	 * calculate trip stop new sequence when drag a trip stop to another trip
	 * @param {*} trip 
	 * @param {*} tripStop 
	 */
	RoutingDataModel.prototype.calculateTripStopSequence = function(trip, tripStop)
	{
		if (!this.getSmartSequenceSetting())
		{
			return Promise.resolve(TF.Helper.TripHelper.getTripStopInsertSequence(trip.FieldTripStops, trip.Session));
		}
		return this.fieldTripStopDataModel.calculateSmartSequence(trip, tripStop);
	};

	RoutingDataModel.prototype.changeStopPosition = function(tripStop, tripId, newPositionIndex)
	{
		var self = this;
		return self.fieldTripStopDataModel.reorderTripStopSequence(tripStop, tripId, newPositionIndex + 1);
	};

	RoutingDataModel.prototype._removeNotOpenEditTrips = function(openTrips)
	{
		var self = this;
		var deleteTrips = [];
		self.getEditTrips().forEach(function(trip)
		{
			if (!Enumerable.From(openTrips).Any(function(c) { return c.Id == trip.id || c.id == trip.id; })
				&& trip.Id !== 0)
			{
				deleteTrips.push(trip);
			}
		});
		// self.closeByTrips(deleteTrips, true);
		self.closeByFieldTrips(deleteTrips, true);
	};

	RoutingDataModel.prototype._removeNotOpenViewTrips = function(openTrips, newTrips)
	{
		var self = this;
		var deleteTrips = [];
		self.getViewTrips().forEach(function(trip)
		{
			if (!Enumerable.From(openTrips).Any(function(c) { return c.Id == trip.id || c.id == trip.id; }))
			{
				deleteTrips.push(trip);
			}
		});
		// return this.closeByViewTrips(deleteTrips, newTrips);
		return this.closeByViewFieldTrips(deleteTrips, newTrips);
	};

	RoutingDataModel.prototype._filterNotLockTripIds = function(trips)
	{
		var self = this;
		return self.viewModel.eventsManager._getLockedByOtherTrips().then(function(lockedByOther)
		{
			return trips.filter(function(trip)
			{
				return !Enumerable.From(lockedByOther).Any(function(c) { return c.Id == trip.Id; });
			});
		}).then(function(trips)
		{
			return self.tripLockData.lockIds(trips.filter(function(trip)
			{
				return trip.Id;
			}).map(function(trip)
			{
				return trip.Id;
			}));
		});
	};

	RoutingDataModel.prototype.setLockTime = function(tripStopId, tripId)
	{
		var self = this;
		for (var i = 0; i < self.trips.length; i++)
		{
			if (self.trips[i].id == tripId)
			{
				for (var j = 0; j < self.trips[i].FieldTripStops.length; j++)
				{
					if (self.trips[i].FieldTripStops[j].id == tripStopId)
					{
						self.trips[i].FieldTripStops[j].LockStopTime = true;
					}
					else
					{
						self.trips[i].FieldTripStops[j].LockStopTime = false;
					}
				}
				break;
			}
		}
	};

	RoutingDataModel.prototype.getFieldTripStopByStopId = function(fieldTripStopId)
	{
		var self = this;
		for (var i = 0; i < self.trips.length; i++)
		{
			const fieldTrip = self.trips[i];
			for (var j = 0; j < fieldTrip.FieldTripStops.length; j++)
			{
				const fieldTripStop = fieldTrip.FieldTripStops[j];
				if (fieldTripStop.id === fieldTripStopId || fieldTripStop.oldId === fieldTripStopId)
				{
					return fieldTripStop;
				}
			}
		}

		return null;
	};

	RoutingDataModel.prototype.getTripStopByTripId = function(tripId)
	{
		var self = this;
		for (var i = 0; i < self.trips.length; i++)
		{
			if (tripId && self.trips[i].id != tripId)
			{
				continue;
			}
			return self.trips[i].FieldTripStops;
		}
	};

	RoutingDataModel.prototype.getSchoolStopsByTripId = function(tripId)
	{
		var self = this;
		for (var i = 0; i < self.trips.length; i++)
		{
			if (tripId && self.trips[i].id != tripId)
			{
				continue;
			}
			return self.trips[i].FieldTripStops.filter(function(item)
			{
				return !IsEmptyString(item.SchoolCode);
			});
		}
	};

	RoutingDataModel.prototype.getSchoolStopsByTrip = function(trip)
	{
		return trip.FieldTripStops.filter(function(item)
		{
			return !IsEmptyString(item.SchoolCode);
		});
	};

	RoutingDataModel.prototype.getSchoolStopsByTripIdSchoolCode = function(tripId, schoolCode)
	{
		var self = this;
		var trip = self.getTripById(tripId);
		return self.getSchoolStopsBySchoolCode(trip, schoolCode);
	};

	RoutingDataModel.prototype.getSchoolStopsBySchoolCode = function(trip, schoolCode)
	{
		return trip.FieldTripStops.filter(function(item)
		{
			return item.SchoolCode == schoolCode;
		});
	};

	RoutingDataModel.prototype.getTripStopsByTripIdStudentId = function(tripId, studentId)
	{
		var self = this;
		for (var i = 0; i < self.trips.length; i++)
		{
			if (tripId && self.trips[i].id != tripId)
			{
				continue;
			}
			for (var j = 0; j < self.trips[i].FieldTripStops.length; j++)
			{
				for (var k = 0; k < self.trips[i].FieldTripStops[j].Students.length; k++)
				{
					if (self.trips[i].FieldTripStops[j].Students[k].id == studentId)
					{
						return self.trips[i].FieldTripStops;
					}
				}
			}
		}
	};

	RoutingDataModel.prototype.getTripStopByStudentId = function(studentId, tripId)
	{
		var self = this;
		for (var i = 0; i < self.trips.length; i++)
		{
			if (tripId && self.trips[i].id != tripId)
			{
				continue;
			}
			for (var j = 0; j < self.trips[i].FieldTripStops.length; j++)
			{
				for (var k = 0; k < self.trips[i].FieldTripStops[j].Students.length; k++)
				{
					if (self.trips[i].FieldTripStops[j].Students[k].id == studentId)
					{
						return self.trips[i].FieldTripStops[j];
					}
				}
			}
		}
	};

	/**
	* get student for list mover assign student
	*/
	RoutingDataModel.prototype.bindStudentCrossStatus = function(students, tripStop)
	{
		var self = this, promises = [];
		const hasBoundary = tripStop && tripStop.boundary && tripStop.boundary.geometry;
		var groupResults = Enumerable.From(students).GroupBy("$.TripStopID").ToArray();
		groupResults.forEach(function(result)
		{
			var stop = hasBoundary ? self.getFieldTripStopByStopId(result.Key()) : tripStop;
			promises.push(self.calculateStudentCrossStatus(stop, result.source));
		});

		return Promise.all(promises);
	};

	RoutingDataModel.prototype.calculateStudentCrossStatus = function(tripStop, students, useBefore, trip, isAssign)
	{
		var self = this;
		var calculateList = [];
		students.forEach(function(student)
		{
			if ((student.XCoord != 0 && student.YCoord != 0 && student.RequirementID) && (typeof student.CrossToStop != "boolean" || useBefore == false))
			{
				calculateList.push(student);
			}
		});

		return self.viewModel.drawTool.NAtool._getAcrossStreetStudents(tripStop, calculateList, true, trip, isAssign).then(function(crossStudentArray)
		{
			calculateList.map(function(student)
			{
				student.StopCrosser = false;
				if (crossStudentArray[0].indexOf(student.id) == -1)
				{
					student.CrossToStop = false;
				}
				else
				{
					student.CrossToStop = true;
					if (crossStudentArray[3] && crossStudentArray[3].indexOf(student.id) > -1)
					{
						student.StopCrosser = true;
					}
				}
				self.updateStudentCrossStatus(tripStop.id, student, student.CrossToStop);
			});
			return crossStudentArray[1];
		});
	};

	RoutingDataModel.prototype.getAssignedStudentById = function(requirementID, tripId, previousScheduleID, tripStopId, studentId)
	{
		var self = this, trips;
		if (tripId)
		{
			trips = [self.getTripById(tripId)];
		}
		else
		{
			trips = self.trips;
		}
		for (var i = 0; i < trips.length; i++)
		{
			for (var j = 0; j < trips[i].FieldTripStops.length; j++)
			{
				if (tripStopId !== trips[i].FieldTripStops[j].id)
				{
					continue;
				}

				for (var k = 0; k < trips[i].FieldTripStops[j].Students.length; k++)
				{
					if (trips[i].FieldTripStops[j].Students[k].RequirementID == requirementID && trips[i].FieldTripStops[j].Students[k].PreviousScheduleID == previousScheduleID && studentId == trips[i].FieldTripStops[j].Students[k].id)
					{
						return trips[i].FieldTripStops[j].Students[k];
					}
				}
			}
		}
		return null;
	};

	RoutingDataModel.prototype.getCandidateStudentById = function(studentId)
	{
		var self = this;
		var candidates = self.routingStudentManager.getCandidates();
		for (var i = 0; i < candidates.length; i++)
		{
			if (candidates[i].id == studentId)
			{
				return candidates[i];
			}
		}
	};

	RoutingDataModel.prototype.getCanAssignCandidateStudentById = function(studentId, requirementID, previousScheduleID, exceptionStudent, isCalculateStudentStatus = true)
	{
		var self = this;
		return self.routingStudentManager.getCandidateById(studentId, requirementID, previousScheduleID, exceptionStudent, isCalculateStudentStatus);
	};

	RoutingDataModel.prototype.getCandidateBySession = function(student, session)
	{
		var self = this;
		return Enumerable.From(self.candidateStudents).Where(function(s)
		{
			return s.id == student.id && s.Session == session
				&& s.XCoord == (student.Xcoord || student.XCoord)
				&& s.YCoord == (student.Ycoord || student.YCoord);
		}).ToArray();
	};

	RoutingDataModel.prototype._getTripPathFeatureData = function(tripIds, tripDataPromise)
	{
		if (tripIds.length == 0)
		{
			return Promise.resolve([]);
		}
		var self = this;
		var tripIdWhereString = "(" + tripIds.join(",") + ")";
		return Promise.all([
			self.featureData.tripPathFeatureData.query({ where: "DBID = " + tf.datasourceManager.databaseId + " and Tripid in " + tripIdWhereString }),
			tripDataPromise])
			.then(function(records)
			{
				records = records[0];
				var enumerable = Enumerable.From(records);
				self.trips.forEach(function(trip)
				{
					// only refresh new trips
					if (tripIds.indexOf(trip.id) < 0)
					{
						return;
					}
					var tripPaths = [];
					trip.FieldTripStops.forEach(function(tripStop)
					{
						tripStop.path = enumerable.FirstOrDefault({}, function(c) { return c.TripStopId == tripStop.id && c.FieldTripId == trip.id; });
						var geometry = TF.Helper.TripHelper.getDrawTripPathGeometry(tripStop, trip, self.viewModel.drawTool.pathLineType);
						if (geometry)
						{
							tripPaths.push(geometry);
						}
					});
					self.viewModel.drawTool && self.viewModel.drawTool._addTripPath(tripPaths, trip);
				});
				return records;
			});
	};

	RoutingDataModel.prototype._getFieldTripPathFeatureData = function(tripIds, tripDataPromise)
	{
		if (tripIds.length === 0)
		{
			return Promise.resolve([]);
		}

		var self = this;
		return tripDataPromise.then(function()
		{
			const records = [];
			self.trips.forEach(function(trip)
			{
				// only refresh new trips
				if (tripIds.indexOf(trip.id) < 0)
				{
					return;
				}
				trip.FieldTripStops.forEach(function(tripStop)
				{
					let tripPath = {};
					if (tripStop.GeoPath)
					{
						tripPath = {
							id: TF.createId(),
							OBJECTID: 0,
							type: "tripPath",
							FieldTripId: tripStop.FieldTripId,
							FieldTripStopId: tripStop.id,
							// geometry: // todo, convert geo path to geometry
							AvgSpeed: tripStop.Speed || 0,
							Dist: tripStop.Distance
						};
						records.push(tripPath);
					}
					tripStop.path = tripPath;
				});
			});
			return records;
		});
	};

	RoutingDataModel.prototype._getTripBoundaryFeatureData = function(tripIds, tripDataPromise)
	{
		if (tripIds.length == 0)
		{
			return Promise.resolve([]);
		}
		var self = this;
		var tripIdWhereString = "(" + tripIds.join(",") + ")";
		return Promise.all([
			self.featureData.tripBoundaryFeatureData.query({ where: "DBID = " + tf.datasourceManager.databaseId + " and Trip_ID in " + tripIdWhereString }),
			tripDataPromise])
			.then(function(records)
			{
				records = records[0];
				var tripBoundaryEnumerable = Enumerable.From(records);
				self.trips.forEach(function(trip)
				{
					// only refresh new trips
					if (tripIds.indexOf(trip.id) < 0)
					{
						return;
					}
					trip.FieldTripStops.forEach(function(tripStop)
					{
						tripStop.boundary = tripBoundaryEnumerable.FirstOrDefault({}, function(c) { return c.TripStopId == tripStop.id && c.FieldTripId == trip.id; });
						self.viewModel.drawTool._addTripBoundary(tripStop.boundary, trip.id);

					});
				});
				return records;
			});
	};

	RoutingDataModel.prototype.getAllStudents = function()
	{
		var self = this;
		var allStudents = self.candidateStudents;
		self.trips.forEach(function(trip)
		{
			trip.FieldTripStops.forEach(function(tripStop)
			{
				allStudents = allStudents.concat(tripStop.Students);
			});
		});
		return allStudents;
	};

	RoutingDataModel.prototype.getBoundaryGeometry = function(rings)
	{
		var geometry = new tf.map.ArcGIS.Polygon(new tf.map.ArcGIS.SpatialReference({ "wkid": 102100 }));
		geometry.rings = rings;
		return geometry;
	};

	RoutingDataModel.prototype.getTripById = function(tripId)
	{
		return this.trips.find(function(trip)
		{
			return trip.id == tripId || trip.oldId == tripId;
		});
	};

	RoutingDataModel.prototype.getSession = function()
	{
		if (typeof this._session == "number")
		{
			return this._session;
		}
		var editTrips = this.getEditTrips();
		if (editTrips.length > 0)
		{
			this._session = editTrips[0].Session;
			setTimeout(function()
			{
				this._session = null;
			}.bind(this), 20);
			return this._session;
		}
		return null;
	};

	RoutingDataModel.prototype.getTripStopsByStopIds = function(tripStopIds)
	{
		var self = this;
		var tripStops = [];
		for (var i = 0; i < self.trips.length; i++)
		{
			for (var j = 0; j < self.trips[i].FieldTripStops.length; j++)
			{
				if (tripStopIds.indexOf(self.trips[i].FieldTripStops[j].id) > -1)
				{
					tripStops.push(self.trips[i].FieldTripStops[j]);
				}
			}
		}
		return tripStops;
	};

	RoutingDataModel.prototype.clearAllDictionary = function()
	{
		this.tripStopDictionary = {};
		this.studentsDictionary = {};
		this.expiredExceptions = {};
	};

	RoutingDataModel.prototype.copyStopTimeWithActualTime = function(trips)
	{
		for (var i = 0; i < trips.length; i++)
		{
			for (var j = 0; j < trips[i].FieldTripStops.length; j++)
			{
				trips[i].FieldTripStops[j].StopTime = trips[i].FieldTripStops[j].ActualStopTime;
			}
		}
		this.onTripStopTimeChangeEvent.notify({});
	};

	RoutingDataModel.prototype.copyFieldTripStopTimeWithActualTime = function(trips)
	{
		var stopTimeFormat = "YYYY-MM-DDTHH:mm:ss";
		for (var i = 0; i < trips.length; i++)
		{
			for (var j = 0; j < trips[i].FieldTripStops.length; j++)
			{
				const actualStopTime = trips[i].FieldTripStops[j].ActualStopTime;

				if(j == 0)
				{
					trips[i].FieldTripStops[j].StopTimeArrive = null;
					trips[i].FieldTripStops[j].StopTimeDepart = actualStopTime;
				}
				else if(j == trips[i].FieldTripStops.length - 1)
				{
					trips[i].FieldTripStops[j].StopTimeArrive = actualStopTime;
					trips[i].FieldTripStops[j].StopTimeDepart = null;
				}
				else
				{
					let pauseDuration = moment.duration(moment(trips[i].FieldTripStops[j].StopTimeDepart).diff(moment(trips[i].FieldTripStops[j].StopTimeArrive))).asMinutes();
					trips[i].FieldTripStops[j].StopTimeArrive = actualStopTime;
					trips[i].FieldTripStops[j].StopTimeDepart = moment(actualStopTime).add(Math.ceil(pauseDuration), "minutes").format(stopTimeFormat);
				}
			}
		}
		this.onTripStopTimeChangeEvent.notify({});
	};

	RoutingDataModel.prototype.setStudentDayValueByIndex = function(students, dayIndex, value)
	{
		if (students.length > 0)
		{
			for (var i = 0; i < students.length; i++)
			{
				switch (dayIndex)
				{
					case 0: { students[i].Monday = value; break; }
					case 1: { students[i].Tuesday = value; break; }
					case 2: { students[i].Wednesday = value; break; }
					case 3: { students[i].Thursday = value; break; }
					case 4: { students[i].Friday = value; break; }
					case 5: { students[i].Saturday = value; break; }
					case 6: { students[i].Sunday = value; break; }
				}
			}
		}
	};

	RoutingDataModel.prototype.filterStudentsOnOtherRoute = function(students, tripId, tripStopId)
	{
		var self = this;
		var studentId, requirementId;
		var studentsHasOtherRoute = [];
		if (students.length > 0)
		{
			studentId = students[0].id;
			requirementId = students[0].RequirementId;
			var length = self.trips.length;

			for (var i = 0; i < length; i++)
			{
				if (self.trips[i].id == tripId)
				{
					continue;
				}

				// remove student
				// for (var j = 0; j < self.trips[i].FieldTripStops.length; j++)
				// {
				// 	if (self.trips[i].FieldTripStops[j].id != tripStopId)
				// 	{
				// 		continue;
				// 	}
				// 	studentsHasOtherRoute = studentsHasOtherRoute.concat(self.trips[i].FieldTripStops[j].Students.filter(function(c)
				// 	{
				// 		return c.id == studentId && c.RequirementID == requirementId;
				// 	}));
				// }
			}
		}
		return studentsHasOtherRoute;
	};

	RoutingDataModel.prototype.setStudentDayOption = function(tripId, tripStopId, newStudent)
	{
		var self = this;
		self.trips.map(function(trip)
		{
			// remove student
			// trip.FieldTripStops.map(function(tripStop)
			// {
			// 	tripStop.Students.map(function(student)
			// 	{
			// 		if (trip.id === tripId && tripStop.id === tripStopId && student.id === newStudent.id && student.RequirementID === newStudent.RequirementID && student.PreviousScheduleID == newStudent.PreviousScheduleID)
			// 		{
			// 			self.updateStudentDayOption(student, newStudent);
			// 		}
			// 	});
			// });
		});
		// this.onStudentChangeEvent.notify({});
	};

	// remove student
	// RoutingDataModel.prototype.setStudentTravelTimeVRP = function(trips)
	// {
	// 	var self = this;
	// 	trips.map(function(trip)
	// 	{
	// 		trip.FieldTripStops.map(function(tripStop)
	// 		{
	// 			tripStop.Students.map(function(student)
	// 			{
	// 				self.calculateStudentTravelTimeVRP(student, tripStop, trip.FieldTripStops);
	// 			});
	// 		});
	// 	});
	// 	this.onTripStopTimeChangeEvent.notify({});
	// }

	RoutingDataModel.prototype.calculateStudentTravelTimeVRP = function(student, tripStop, tripStops)
	{
		var self = this;
		var schoolStop;
		var hasDirectSchool = Enumerable.From(tripStops).Any(function(c) { return c.SchoolCode == student.SchoolCode; });
		var hasValidTransSchool = Enumerable.From(tripStops).Any(function(c) { return c.SchoolCode && c.SchoolCode != student.TransSchoolCode && (student.Session == TF.Helper.TripHelper.Sessions.ToSchool || student.Session == TF.Helper.TripHelper.Sessions.Shuttle ? c.Sequence > tripStop.Sequence : c.Sequence < tripStop.Sequence); });

		var candidateSchools = Enumerable.From(tripStops).Where(function(c)
		{
			var result = c.SchoolCode && ((!hasDirectSchool && hasValidTransSchool) || (c.SchoolCode == student.SchoolCode && (student.Session == TF.Helper.TripHelper.Sessions.ToSchool || student.Session == TF.Helper.TripHelper.Sessions.Shuttle ? c.Sequence > tripStop.Sequence : c.Sequence < tripStop.Sequence))) && (c.SchoolCode != student.TransSchoolCode);
			if (result)
			{
				if (student.Session == TF.Helper.TripHelper.Sessions.ToSchool || student.Session == TF.Helper.TripHelper.Sessions.Shuttle)
				{
					return c.Sequence > tripStop.Sequence;
				}
				else if (student.Session == TF.Helper.TripHelper.Sessions.FromSchool)
				{
					return c.Sequence < tripStop.Sequence;
				}
				else
				{
					return false;
				}
			}
			else
			{
				return false;
			}
		}).ToArray();
		if (candidateSchools.length > 0)
		{
			schoolStop = candidateSchools[0];
		}
		if (schoolStop && schoolStop.id != 0)
		{
			student.AnotherTripStopID = schoolStop.id;
		}

		this.calculateStudentTravelTime(student, tripStop, tripStops);
	}

	RoutingDataModel.prototype.setStudentTravelTime = function(trips)
	{
		var self = this;
		// remove student
		// trips.map(function(trip)
		// {
		// 	trip.FieldTripStops.map(function(tripStop)
		// 	{
		// 		tripStop.Students.map(function(student)
		// 		{
		// 			self.calculateStudentTravelTime(student, tripStop, trip.FieldTripStops);
		// 		});
		// 	});
		// });
		// this.onTripStopTimeChangeEvent.notify({});
	};

	RoutingDataModel.prototype.calculateStudentTravelTime = function(student, tripStop, tripStops)
	{
		var stop = Enumerable.From(tripStops).FirstOrDefault(null, function(c) { return c.id == student.AnotherTripStopID; });
		if (stop)
		{
			var mins = Math.abs(moment(stop.StopTime === '00:00:00' ? '24:00:00' : stop.StopTime, "HH:mm:ss").diff(moment(tripStop.StopTime === '00:00:00' ? '24:00:00' : tripStop.StopTime, "HH:mm:ss"), "minutes"));
			student.TotalTime = mins;
		}
	};

	RoutingDataModel.prototype.updateStudentDayOption = function(student, newStudent)
	{
		student.Monday = newStudent.Monday;
		student.Tuesday = newStudent.Tuesday;
		student.Wednesday = newStudent.Wednesday;
		student.Thursday = newStudent.Thursday;
		student.Friday = newStudent.Friday;
		student.Saturday = newStudent.Saturday;
		student.Sunday = newStudent.Sunday;
	};

	RoutingDataModel.prototype.updateManuallyChangedStatusWhenClose = function()
	{
		var self = this;
		if (self.trips.length == 0)
		{
			self.routingStudentManager.manualChangedStudentStatus = {};
			self.routingStudentManager.calculateStudentPUDOStatus();
			self.routingStudentManager.refresh();
		}
	};

	RoutingDataModel.prototype.updateStudentPUDOStatus = function(student, session, tripId, needRefresh)
	{
		var self = this;
		// verify session
		if (this.getSession() != 3)
		{
			return Promise.resolve(false);
		}
		// nothing change
		if (self.routingStudentManager.getStudentPUDOStatusByTripId(student, tripId) == session)
		{
			return Promise.resolve(false);
		}

		if (!self.routingStudentManager.manualChangedStudentStatus[student.id])
		{
			self.routingStudentManager.manualChangedStudentStatus[student.id] = { Session: {} };
		}
		self.routingStudentManager.manualChangedStudentStatus[student.id].Session[tripId] = session;
		self.routingStudentManager.calculateStudentPUDOStatus();

		return self._changeStudentSessionForAssignStudent(student, session, tripId).then(function()
		{
			if (needRefresh != false)
			{
				self.routingStudentManager.refresh();
			}
			if (tripId)
			{
				self.changeDataStack.push(self.getTripById(tripId));
			}
			return true;
		});
	};

	RoutingDataModel.prototype.getStudentRequirementIdsBySession = function(studentId, session)
	{
		return this.routingStudentManager.getStudentRequirementIdsBySession(studentId, session);
	};

	RoutingDataModel.prototype._changeStudentSessionForAssignStudent = function(student, session, tripId)
	{
		var self = this, promises = [];
		var trip = self.getTripById(tripId);

		trip.FieldTripStops.forEach(function(tripStop)
		{

			// remove student
			// tripStop.Students.forEach(function(stud)
			// {
			// 	if (stud.id == student.id)
			// 	{
			// 		var studentInCandidates = self.getCandidateBySession(stud, session);
			// 		if (studentInCandidates.length > 0)
			// 		{

			// 			var studentInCandidate = studentInCandidates[0];

			// 			self.unLockRoutingStudentByUnAssign([{ tripStop: tripStop, students: [stud] }]);

			// 			stud.RequirementID = studentInCandidate.RequirementID;
			// 			stud.PreviousScheduleID = studentInCandidate.PreviousScheduleID;
			// 			stud.ProhibitCross = studentInCandidate.ProhibitCross;
			// 			stud.XCoord = studentInCandidate.XCoord;
			// 			stud.YCoord = studentInCandidate.YCoord;
			// 			stud.geometry = studentInCandidate.geometry;
			// 			stud.Session = session;
			// 			// swap school code
			// 			stud.Session == 0 ? stud.DOSchoolCode = (stud.PUSchoolCode || stud.SchoolCode) : stud.PUSchoolCode = (stud.DOSchoolCode || stud.SchoolCode);
			// 			stud.AnotherTripStopID = self.findRealSchoolStops(tripStop, stud).id;
			// 			var anyAssign = false;
			// 			RoutingDataModel.weekdays.forEach(function(weekday)
			// 			{
			// 				stud["Valid" + weekday] = studentInCandidate["Valid" + weekday];
			// 				stud[weekday] = studentInCandidate["Valid" + weekday] && stud[weekday];
			// 				anyAssign = anyAssign || stud[weekday];
			// 			});

			// 			// if not assign to any day, use the valid default weekdays
			// 			if (!anyAssign)
			// 			{
			// 				RoutingDataModel.weekdays.forEach(function(weekday)
			// 				{
			// 					stud[weekday] = studentInCandidate["Valid" + weekday];
			// 				});
			// 			}

			// 			// init lock info
			// 			promises.push(self.lockRoutingStudent([{}], stud, tripStop).then(function(data)
			// 			{
			// 				if (data)
			// 				{
			// 					data = data[0];
			// 					// set week day by lock info result
			// 					RoutingDataModel.weekdays.forEach(function(weekday)
			// 					{
			// 						stud[weekday] = data[weekday];
			// 					});
			// 				}
			// 			}));
			// 			self.assignStudent(studentInCandidates.slice(1, studentInCandidates.length), tripStop);
			// 		} else
			// 		{
			// 			self.unAssignStudent([stud], tripStop);
			// 		}
			// 	}
			// });
		});

		return Promise.all(promises);
	};

	RoutingDataModel.prototype.setActualStopTime = function(trips, reset)
	{
		var j = 0;
		for (var i = 0; i < trips.length; i++)
		{
			let lockStop;
			let lockStopIndex;
			if (!reset)
			{
				for (j = 0; j < trips[i].FieldTripStops.length; j++)
				{
					if (trips[i].FieldTripStops[j].LockStopTime)
					{
						trips[i].FieldTripStops[j].ActualStopTime = trips[i].FieldTripStops[j].StopTime;
						lockStop = trips[i].FieldTripStops[j];
						lockStopIndex = j;
						break;
					}
				}
				if (!lockStopIndex && trips[i].FieldTripStops.length > 0)
				{
					trips[i].FieldTripStops[0].LockStopTime = true;
					trips[i].FieldTripStops[0].ActualStopTime = trips[i].FieldTripStops[0].StopTime;
					lockStop = trips[i].FieldTripStops[0];
					lockStopIndex = 0;
				}
			}
			else
			{
				lockStop = trips[i].FieldTripStops[0];
				lockStopIndex = 0;
				for (j = 0; j < trips[i].FieldTripStops.length; j++)
				{
					if (trips[i].FieldTripStops[j].id == lockStop.id)
					{
						trips[i].FieldTripStops[j].LockStopTime = true;
					}
					else
					{
						trips[i].FieldTripStops[j].LockStopTime = false;
					}
				}
			}
			for (j = lockStopIndex + 1; j < trips[i].FieldTripStops.length; j++)
			{
				trips[i].FieldTripStops[j].ActualStopTime = moment(trips[i].FieldTripStops[j - 1].ActualStopTime, "HH:mm:ss")
					.add(Math.ceil(moment.duration(moment(trips[i].FieldTripStops[j - 1].Duration, "HH:mm:ss")).asMinutes()), "minutes").format("HH:mm:ss");
			}
			for (j = lockStopIndex - 1; j > -1; j--)
			{
				trips[i].FieldTripStops[j].ActualStopTime = moment(trips[i].FieldTripStops[j + 1].ActualStopTime, "HH:mm:ss")
					.subtract(Math.ceil(moment.duration(moment(trips[i].FieldTripStops[j].Duration, "HH:mm:ss")).asMinutes()), "minutes").format("HH:mm:ss");
			}
			if (trips[i].FieldTripStops.length > 0)
			{
				trips[i].ActualStartTime = trips[i].FieldTripStops[0].ActualStopTime;
				trips[i].ActualEndTime = trips[i].FieldTripStops[trips[i].FieldTripStops.length - 1].ActualStopTime;
			}
		}
	};

	RoutingDataModel.prototype.setFieldTripActualStopTime = function(trips, reset, resetDateTime)
	{
		var j = 0;
		var stopTimeFormat = "YYYY-MM-DDTHH:mm:ss";
		for (var i = 0; i < trips.length; i++)
		{
			let lockStop;
			let lockStopIndex;
			if (!reset)
			{
				for (j = 0; j < trips[i].FieldTripStops.length; j++)
				{
					if (trips[i].FieldTripStops[j].LockStopTime)
					{
						trips[i].FieldTripStops[j].ActualStopTime = trips[i].FieldTripStops[j].StopTimeArrive || trips[i].FieldTripStops[j].StopTimeDepart;
						lockStop = trips[i].FieldTripStops[j];
						lockStopIndex = j;
						break;
					}
				}
				if (!lockStopIndex && trips[i].FieldTripStops.length > 0)
				{
					trips[i].FieldTripStops[0].LockStopTime = true;
					trips[i].FieldTripStops[0].ActualStopTime = trips[i].FieldTripStops[0].StopTimeDepart;
					lockStop = trips[i].FieldTripStops[0];
					lockStopIndex = 0;
				}
			}
			else
			{
				lockStop = trips[i].FieldTripStops[0];
				lockStopIndex = 0;

				lockStop.ActualStopTime = moment(resetDateTime).format(stopTimeFormat);;

				for (j = 0; j < trips[i].FieldTripStops.length; j++)
				{
					if (trips[i].FieldTripStops[j].id == lockStop.id)
					{
						trips[i].FieldTripStops[j].LockStopTime = true;

					}
					else
					{
						trips[i].FieldTripStops[j].LockStopTime = false;
					}
				}
			}

			for (j = lockStopIndex + 1; j < trips[i].FieldTripStops.length; j++)
			{
				let previousStop = trips[i].FieldTripStops[j - 1];
				let actualStopTime = moment(previousStop.ActualStopTime, stopTimeFormat)
											.add(Math.ceil(moment.duration(previousStop.Duration).asMinutes()), "minutes")
											.format(stopTimeFormat);

				trips[i].FieldTripStops[j].ActualStopTime = actualStopTime;
			}
			for (j = lockStopIndex - 1; j > -1; j--)
			{
				let nextPauseStop = trips[i].FieldTripStops[j + 1];
				let actualStopTime = moment(nextPauseStop.ActualStopTime, stopTimeFormat)
											.subtract(Math.ceil(moment.duration(trips[i].FieldTripStops[j].Duration).asMinutes()), "minutes")
											.format(stopTimeFormat);

				trips[i].FieldTripStops[j].ActualStopTime = actualStopTime;
			}
			if (trips[i].FieldTripStops.length > 0)
			{
				trips[i].ActualStartTime = trips[i].FieldTripStops[0].ActualStopTime.format(stopTimeFormat);
				trips[i].ActualEndTime = trips[i].FieldTripStops[trips[i].FieldTripStops.length - 1].ActualStopTime.format(stopTimeFormat);
			}
		}
	};

	RoutingDataModel.prototype.setStopTimeForEmptyRecords = function(trip)
	{
		if (!trip)
		{
			return;
		}

		const emptyValue = "00:00:00";
		for (var i = 0; i < trip.FieldTripStops.length; i++)
		{
			let stop = trip.FieldTripStops[i];
			if (stop.StopTime == emptyValue)
			{
				stop.StopTime = stop.ActualStopTime;
				var prevStop = i == 0 ? null : trip.FieldTripStops[i - 1];
				var nextStop = i == trip.FieldTripStops.length - 1 ? null : trip.FieldTripStops[i + 1];
				if (prevStop && prevStop.StopTime != emptyValue && moment(stop.StopTime, "HH:mm:ss").diff(moment(prevStop.StopTime, "HH:mm:ss")) < 0)
				{
					stop.StopTime = prevStop.StopTime;
				}
				if (nextStop && nextStop.StopTime != emptyValue && moment(stop.StopTime, "HH:mm:ss").diff(moment(nextStop.StopTime, "HH:mm:ss")) > 0)
				{
					stop.StopTime = nextStop.StopTime;
				}
			}
		}
	};

	RoutingDataModel.prototype.setStopTimeAfterSpeedChange = function(trip, changeSpeedStop)
	{
		var secondsDiff;
		let lockStop;
		let lockStopIndex;
		let i;
		for (i = 0; i < trip.FieldTripStops.length; i++)
		{
			if (trip.FieldTripStops[i].LockStopTime)
			{
				trip.FieldTripStops[i].ActualStopTime = trip.FieldTripStops[i].StopTime;
				lockStop = trip.FieldTripStops[i];
				lockStopIndex = i;
				break;
			}
		}
		if (!lockStopIndex && trip.FieldTripStops.length > 0)
		{
			trip.FieldTripStops[0].LockStopTime = true;
			trip.FieldTripStops[0].ActualStopTime = trip.FieldTripStops[0].StopTime;
			lockStop = trip.FieldTripStops[0];
			lockStopIndex = 0;
		}
		if (changeSpeedStop.Sequence >= lockStopIndex + 1)
		{
			for (i = lockStopIndex + 1; i < trip.FieldTripStops.length; i++)
			{
				let nextStopSequence = changeSpeedStop.Sequence + 1;
				if (trip.FieldTripStops[i].Sequence == nextStopSequence)
				{
					let stopTimeNew = moment(trip.FieldTripStops[i - 1].StopTime, "HH:mm:ss")
						.add(moment.duration(moment(trip.FieldTripStops[i - 1].Duration, "HH:mm:ss")).asMinutes(), "minutes").format("HH:mm:ss");
					secondsDiff = moment(stopTimeNew, "HH:mm:ss").diff(moment(trip.FieldTripStops[i].StopTime, "HH:mm:ss"), "seconds");
					trip.FieldTripStops[i].StopTime = stopTimeNew;
				}
				else if (trip.FieldTripStops[i].Sequence > nextStopSequence)
				{
					trip.FieldTripStops[i].StopTime = moment(trip.FieldTripStops[i].StopTime, "HH:mm:ss").add(secondsDiff, "seconds").format("HH:mm:ss");
				}
			}
		}
		else
		{
			for (i = lockStopIndex - 1; i > -1; i--)
			{
				if (trip.FieldTripStops[i].Sequence == changeSpeedStop.Sequence)
				{
					let stopTimeNew = moment(trip.FieldTripStops[i + 1].StopTime, "HH:mm:ss")
						.subtract(moment.duration(moment(trip.FieldTripStops[i].Duration, "HH:mm:ss")).asMinutes(), "minutes").format("HH:mm:ss");
					secondsDiff = moment(stopTimeNew, "HH:mm:ss").diff(moment(trip.FieldTripStops[i].StopTime, "HH:mm:ss"), "seconds");
					trip.FieldTripStops[i].StopTime = stopTimeNew;
				}
				else if (trip.FieldTripStops[i].Sequence < changeSpeedStop.Sequence)
				{
					trip.FieldTripStops[i].StopTime = moment(trip.FieldTripStops[i].StopTime, "HH:mm:ss").add(secondsDiff, "seconds").format("HH:mm:ss");
				}
			}
		}

		this.onTripStopTimeChangeEvent.notify({});
	};

	RoutingDataModel.prototype.getLockTimeStop = function(tripId)
	{
		var self = this;
		for (var i = 0; i < self.trips.length; i++)
		{
			if (self.trips[i].id == tripId)
			{
				for (var j = 0; j < self.trips[i].FieldTripStops.length; j++)
				{
					if (self.trips[i].FieldTripStops[j].LockStopTime)
					{
						return self.trips[i].FieldTripStops[j];
					}
				}
			}
		}
	};

	RoutingDataModel.prototype.getFieldTripStop = function(tripStopId)
	{
		var trips = this.trips;
		for (var i = 0, l = trips.length; i < l; i++)
		{
			var tripStops = trips[i].FieldTripStops;
			for (var j = 0; j < tripStops.length; j++)
			{
				if (tripStops[j].id == tripStopId || tripStops[j].oldId == tripStopId)
				{
					return tripStops[j];
				}
			}
		}
	};


	RoutingDataModel.prototype.getFieldTripStopBySequence = function(trip, sequence)
	{
		return Enumerable.From(trip.FieldTripStops).FirstOrDefault(null, function(c) { return c.Sequence == sequence; });
	};

	RoutingDataModel.prototype.getAssignStudent = function(tripId)
	{
		var length = this.trips.length;
		var students = [];
		for (var i = 0; i < length; i++)
		{
			if (this.trips[i].id != tripId)
			{
				continue;
			}


			// remove student
			// for (var j = 0; j < this.trips[i].FieldTripStops.length; j++)
			// {
			// 	students = students.concat(this.trips[i].FieldTripStops[j].Students);
			// }
		}
		return students;
	};

	RoutingDataModel.prototype.autoUnassignStudentConfirmation = function(trips)
	{
		if (!trips || !trips.length)
		{
			return false;
		}

		// remove student
		// let studentsExceptions = {};
		// trips.forEach(function(trip)
		// {
		// 	trip.FieldTripStops.forEach(function(tripStop)
		// 	{
		// 		let stopStudentExceptions = tripStop.Students.filter((i) => !i.RequirementID);
		// 		if (stopStudentExceptions.length)
		// 		{
		// 			let tripStudentExceptions = studentsExceptions[trip.Name] || [];
		// 			studentsExceptions[trip.Name] = tripStudentExceptions.concat(stopStudentExceptions);
		// 		}
		// 	});
		// });
		// if (!Object.values(studentsExceptions).length)
		// {
		// 	return tf.promiseBootbox.yesNo({ message: "This change will unassign all students from the selected trips. This action cannot be undone.  Do you wish to continue?", title: "Confirmation Message", closeButton: true }).then((result) => result ? trips : null);
		// }
		// let exceptionInfo = "";
		// Object.keys(studentsExceptions).forEach((i) =>
		// {
		// 	exceptionInfo += "\n<strong>" + i + "</strong>\n";
		// 	Enumerable.From(studentsExceptions[i]).OrderBy(i => (i.LastName || "").toLowerCase()).ThenBy(i => (i.FirstName || "").toLowerCase()).ToArray().forEach((x) =>
		// 	{
		// 		exceptionInfo += x.FirstName + " " + x.LastName + "\n";
		// 	});
		// });
		// const haveExceptionMessage = "This change will unassign all students from the selected trips including the following student exceptions: \n" + exceptionInfo + "\nThis action cannot be undone.  Do you wish to continue?";
		// return tf.promiseBootbox.yesNo({ message: haveExceptionMessage, title: "Confirmation Message", maxHeight: 600, closeButton: true }).then((result) => result ? trips : null);
	};

	RoutingDataModel.prototype.getStudentById = function(studentId)
	{
		var self = this;

		// remove student
		// search in candidate students
		// for (var i = 0; i < self.candidateStudents.length; i++)
		// {
		// 	if (self.candidateStudents[i].id == studentId)
		// 	{
		// 		return self.candidateStudents[i];
		// 	}
		// }

		// // search in assigned students
		// var assignedStudents = [];
		// self.trips.forEach(function(trip)
		// {
		// 	trip.FieldTripStops.forEach(function(tripStop)
		// 	{
		// 		assignedStudents = assignedStudents.concat(tripStop.Students);
		// 	});
		// });
		// for (var i = 0; i < assignedStudents.length; i++)
		// {
		// 	if (assignedStudents[i].id == studentId)
		// 	{
		// 		return $.extend({}, assignedStudents[i]);
		// 	}
		// }

		return null;
	};

	RoutingDataModel.prototype.isSchoolStop = function(tripStopId)
	{
		var stop = this.getFieldTripStopByStopId(tripStopId);
		if (!IsEmptyString(stop.SchoolCode))
		{
			return true;
		}
		return false;
	};

	RoutingDataModel.prototype.getStudent = function(studentId, tripStopId, anotherTripStopID, requirementId, previousScheduleID)
	{
		var self = this;
		// find assign student in trips 
		var student = self.getStudentByRequirementId(studentId, tripStopId, anotherTripStopID, requirementId, null, previousScheduleID);
		if (student == null)
		{
			// find candidate student in dictionary
			student = self.getStudentFromStopByRequirementId(studentId, tripStopId, requirementId, null, previousScheduleID);
			if (student)
			{
				student = student.student;
			}
		}
		return student;
	};

	RoutingDataModel.prototype.getSchoolStudent = function(studentId, schoolStopId, requirementId, previousScheduleID)
	{
		var self = this;
		if (self.routingStudentManager.schoolStopDictionary[schoolStopId] == null)
		{
			return [];
		}
		return self.routingStudentManager.schoolStopDictionary[schoolStopId].map(function(c) { return c.student; }).filter(function(item)
		{
			return item.id == studentId && item.RequirementID == requirementId && item.PreviousScheduleID == previousScheduleID;
		});
	};

	RoutingDataModel.prototype.getStudentByRequirementId = function(studentId, tripStopId, anotherTripStopID, requirementId, session, previousScheduleID)
	{
		var length = this.trips.length;
		for (var i = 0; i < length; i++)
		{
			for (var j = 0; j < this.trips[i].FieldTripStops.length; j++)
			{
				if (this.trips[i].FieldTripStops[j].id != tripStopId)
				{
					continue;
				}
				var students = this.trips[i].FieldTripStops[j].Students;
				return Enumerable.From(students).FirstOrDefault(null, function(c)
				{
					return c.id == studentId &&
						c.RequirementID == requirementId &&
						((session !== null && session !== undefined && c.Session === session) || (session === null || session === undefined))
						&& (!previousScheduleID || c.PreviousScheduleID == previousScheduleID);
				});
			}
		}
	};

	RoutingDataModel.prototype.getStudentFromStopByRequirementId = function(studentId, tripStopId, requirementId, session, previousScheduleID)
	{
		var self = this, result;
		if (self.tripStopDictionary[tripStopId] && self.tripStopDictionary[tripStopId].length > 0)
		{
			result = Enumerable.From(self.tripStopDictionary[tripStopId]).FirstOrDefault(null, function(s)
			{
				return s.student.id == studentId &&
					((requirementId && s.student.RequirementID == requirementId) || (!requirementId)) &&
					((session !== null && session !== undefined && s.student.Session === session) || (session === null || session === undefined))
					&& (!previousScheduleID || s.student.PreviousScheduleID == previousScheduleID);
			});
		}

		return result;
	};

	RoutingDataModel.prototype.tryValidateSchoolStop = function(students, tripStop, refreshDictionary)
	{
		var self = this;
		students.map(function(student)
		{
			if (student.AnotherTripStopID)
			{
				var oldSchoolStop = self.getFieldTripStopByStopId(student.AnotherTripStopID);
				if (!oldSchoolStop)
				{
					return;
				}
				var desTrip = self.getTripById(oldSchoolStop.FieldTripId);
				var curSequence = tripStop.Sequence, desSequence = oldSchoolStop.Sequence;
				var sequenceRanges = self.schoolSequences[tripStop.FieldTripId];
				if (!sequenceRanges) return;
				var schoolSequenceRange = sequenceRanges[oldSchoolStop.SchoolCode];
				var tripStopSequenceRange = sequenceRanges[tripStop.SchoolCode];
				if (!schoolSequenceRange)
				{
					return;
				}
				var maxSchoolSequence = schoolSequenceRange.maxSequence, minSchoolSequence = schoolSequenceRange.minSequence;
				if (student.Session == TF.Helper.TripHelper.Sessions.ToSchool || student.Session == TF.Helper.TripHelper.Sessions.Shuttle)
				{
					var minTsSequence = tripStopSequenceRange ? tripStopSequenceRange.minSequence : curSequence;
					// currentStop is a school, we need to tryValid itself first
					if (tripStop.SchoolCode && curSequence > desSequence && minTsSequence < maxSchoolSequence)
					{
						if (minTsSequence < maxSchoolSequence)
						{
							var schlStop = self.getFieldTripStopBySequence(desTrip, minTsSequence);
							if (schlStop)
							{
								self.viewModel.display.changeSchoolStop(student, tripStop, schlStop, false, refreshDictionary);
							}
							student.IsValid = true;
						}
						else
						{
							student.IsValid = false;
						}
					}
					else
					{
						student.IsValid = (curSequence <= maxSchoolSequence);
					}

					// try to change
					desSequence = tripStop.Sequence;
					if (desSequence < maxSchoolSequence && desSequence > oldSchoolStop.Sequence)
					{
						var sequences = self.getSchoolSequence(tripStop.FieldTripId, oldSchoolStop.SchoolCode);
						var validSequence = Enumerable.From(sequences).FirstOrDefault(null, function(seq) { return seq > desSequence; });
						var schlStop = self.getFieldTripStopBySequence(desTrip, validSequence);
						if (schlStop)
						{
							self.viewModel.display.changeSchoolStop(student, oldSchoolStop, schlStop, true, refreshDictionary);
						}
					}
				}
				else if (student.Session == TF.Helper.TripHelper.Sessions.FromSchool)
				{
					var maxTsSequence = tripStopSequenceRange ? tripStopSequenceRange.maxSequence : curSequence;
					// currentStop is a school, we need to tryValid itself first
					if (tripStop.SchoolCode && curSequence < desSequence && maxTsSequence > minSchoolSequence)
					{
						if (maxTsSequence > minSchoolSequence)
						{
							var schlStop = self.getFieldTripStopBySequence(desTrip, maxTsSequence);
							if (schlStop)
							{
								self.viewModel.display.changeSchoolStop(student, tripStop, schlStop, false, refreshDictionary);
							}
							student.IsValid = true;
						}
						else
						{
							student.IsValid = false;
						}
					}
					else
					{
						student.IsValid = (curSequence >= minSchoolSequence);
					}

					// try to change
					desSequence = tripStop.Sequence;
					if (desSequence > minSchoolSequence && desSequence < oldSchoolStop.Sequence)
					{
						var sequences = self.getSchoolSequence(tripStop.FieldTripId, oldSchoolStop.SchoolCode);
						var validSequence = Enumerable.From(sequences).FirstOrDefault(null, function(seq) { return seq < desSequence; });
						var schlStop = self.getFieldTripStopBySequence(desTrip, validSequence);
						if (schlStop)
						{
							self.viewModel.display.changeSchoolStop(student, oldSchoolStop, schlStop, true, refreshDictionary);
						}
					}
				}
			}
		});
		if (refreshDictionary)
		{
			self.routingStudentManager.refresh();
		}
	};

	RoutingDataModel.prototype.getColorByTripId = function(tripId)
	{
		var trip = this.getTripById(tripId);
		return trip ? trip.color : "#FFFFFF";
	};

	RoutingDataModel.prototype.changeTripColor = function(tripId, color, onlyRefreshTree)
	{
		var self = this;
		self.trips.map(function(trip)
		{
			if (trip.id == tripId)
			{
				trip.color = color;
				trip.FieldTripStops.map(function(tripStop)
				{
					tripStop.color = color;
				});
			}
		});
		if (onlyRefreshTree)
		{
			self.onTripTreeColorChangeEvent.notify({ FieldTripId: tripId, color: color });
		}

		self.onTripColorChangeEvent.notify({ FieldTripId: tripId, color: color });
		// self.routingStudentManager.refreshAssignStudents();
		const fieldTrip = self.trips.filter(item => item.id === tripId)[0];
		PubSub.publish(TF.RoutingPalette.FieldTripMapEventEnum.UpdateColor, fieldTrip);
	};

	RoutingDataModel.prototype.bindColor = function(force = false)
	{
		var self = this;
		var trips = this.trips;
		trips.map(function(trip, index)
		{
			if (!trip.color || force)
			{
				var color = force ? self.colors[index] : self.generateColor(index);
				trip.color = color;
				trip.FieldTripStops.map(function(fieldTripStop)
				{
					fieldTripStop.color = color;
				});
			}
		});
	};

	RoutingDataModel.prototype.generateColor = function(index, vrpIndex)
	{
		var trips = this.trips,
			colors = this.colors;
		var notUsedColor = colors.filter(function(c)
		{
			return !Enumerable.From(trips).Any(function(t) { return t.color == c; });
		});
		if (vrpIndex >= 0) { return notUsedColor[vrpIndex] }
		index = index || this.trips.length;
		return notUsedColor.length > 0 ? notUsedColor[0] : colors[index % colors.length];
	};

	RoutingDataModel.prototype.changeTripVisibility = function(tripIds, visible)
	{
		var self = this;
		if (!$.isArray(tripIds))
		{
			tripIds = [tripIds];
		}
		self.trips.map(function(trip)
		{
			if (tripIds.indexOf(trip.id) >= 0)
			{
				trip.visible = visible;
			}
		});
		self.onChangeTripVisibilityEvent.notify({ TripIds: tripIds, visible: visible });

		const trips = self.trips.filter(trip => tripIds.includes(trip.id));
		PubSub.publish(TF.RoutingPalette.FieldTripMapEventEnum.ShowHide, trips);
		// self.routingStudentManager.refreshAssignStudents();
	};

	RoutingDataModel.prototype.closeByTrips = function(tripsToClose, notifyChange)
	{
		var self = this;
		var promise = Promise.resolve();
		if (tripsToClose && tripsToClose.length > 0)
		{
			tripsToClose.forEach(function(trip)
			{
				self.deleteChangeDataStackByTripId(trip.id);
			});
			// promise = self._releaseStudentToUnAssign(tripsToClose);
			self.unLockTripData(tripsToClose);
			self.removeNeedDeleteTrip(tripsToClose);
			if (notifyChange != false)
			{
				self.onTripsChangeEvent.notify({ add: [], edit: [], delete: tripsToClose });
			}

			// self.routingStudentManager.refresh();
		}

		self.viewModel.routingChangePath && self.viewModel.routingChangePath.clearAll();
		self.clearContextMenuOperation();
		self.viewModel.editFieldTripStopModal.closeEditModal();
		self._viewModal.setMode("Routing", "Normal");
		// self.clearTripOriginalData(tripsToClose);
		// self.clearFindCandidates(tripsToClose);
		return promise.then(function()
		{
			self._updateTravelScenarioLock(tripsToClose);
			if (self.getEditTrips().length == 0)
			{
				var promise = Promise.resolve(true);
				// var promise = self.clearCandidateStudents();
				// self.updateManuallyChangedStatusWhenClose();
				// self.routingStudentManager.refreshStudentLock(true);
				return promise;
			} else if (tripsToClose && tripsToClose.length > 0)
			{//RW-32613 If Scheduled Elsewhere is not checked there is no need to send RoutingCandidateStudents request.
				self._candidateSetting.inCriteriaScheduledElsewhere || self._candidateSetting.notInCriteriaScheduledElsewhere ? self.refreshCandidateStudent() :
					self.refreshCandidateStudent(null, null, null, tripsToClose);
				self.onTripsChangeEvent.notify({ add: [], edit: self.getEditTrips(), delete: [], draw: false });
			}
		});
	};

	RoutingDataModel.prototype.closeByFieldTrips = function(tripsToClose, notifyChange)
	{
		var self = this;
		var promise = Promise.resolve();
		if (tripsToClose && tripsToClose.length > 0)
		{
			tripsToClose.forEach(function(trip)
			{
				self.deleteChangeDataStackByTripId(trip.id);
			});
			// promise = self._releaseStudentToUnAssign(tripsToClose);
			self.unLockTripData(tripsToClose);
			self.removeNeedDeleteTrip(tripsToClose);
			if (notifyChange != false)
			{
				self.onTripsChangeEvent.notify({ add: [], edit: [], delete: tripsToClose });
			}

			// self.routingStudentManager.refresh();
		}

		self.viewModel.routingChangePath && self.viewModel.routingChangePath.clearAll();
		self.clearContextMenuOperation();
		self.viewModel.editFieldTripStopModal.closeEditModal();
		self._viewModal.setMode("Routing", "Normal");
		// self.clearTripOriginalData(tripsToClose);
		// self.clearFindCandidates(tripsToClose);
		return promise.then(function()
		{
			// self._updateTravelScenarioLock(tripsToClose);
			if (self.getEditTrips().length == 0)
			{
				// var promise = self.clearCandidateStudents();
				// self.updateManuallyChangedStatusWhenClose();
				// self.routingStudentManager.refreshStudentLock(true);
				// return promise;
			} else if (tripsToClose && tripsToClose.length > 0)
			{//RW-32613 If Scheduled Elsewhere is not checked there is no need to send RoutingCandidateStudents request.
				// self._candidateSetting.inCriteriaScheduledElsewhere || self._candidateSetting.notInCriteriaScheduledElsewhere ? self.refreshCandidateStudent() :
				// 	self.refreshCandidateStudent(null, null, null, tripsToClose);
				self.onTripsChangeEvent.notify({ add: [], edit: self.getEditTrips(), delete: [], draw: false });
			}
		});
	};	

	RoutingDataModel.prototype.closeAllEditTrips = function()
	{
		var self = this;
		// return self.closeByTrips(self.getEditTrips());
		return self.closeByFieldTrips(self.getEditTrips());
	};

	RoutingDataModel.prototype.closeUnsavedNewTrips = function(trips, noSaveCheck, exceptTrips)
	{
		var self = this, p = Promise.resolve(false);
		if (!noSaveCheck)
		{
			p = self.unSaveConfirmBox(trips);
		}
		return p.then(function(ans)
		{
			var savePromise = Promise.resolve(ans);
			if (ans)
			{
				savePromise = self.saveTrips(trips);
			}
			return savePromise.then(function(result)
			{
				tf.loadingIndicator.showImmediately();
				var releaseStudentPromise = Promise.resolve();
				if (!result)
				{
					trips.forEach(function(trip)
					{
						// remove student
						// RoutingDataModel.unLockRoutingStudentByTrip(trip.id);
						self.deleteChangeDataStackByTripId(trip.id);
					});

					// remove student
					// releaseStudentPromise = self._releaseStudentToUnAssign(trips).then(function(unassignedStudents)
					// {
					// 	self.onStopCandidateStudentChangeEvent.notify({ add: unassignedStudents, edit: [], delete: [] });
					// });
				} 
				// remove student
				// else
				// {
				// 	trips.forEach(function(trip)
				// 	{
				// 		trip.originalStudents.forEach(function(student)
				// 		{
				// 			var index = self.candidateStudents.findIndex(x => { return x.id == student.id });
				// 			self.candidateStudents.splice(index, 1);
				// 		})
				// 	});

				// }

				return releaseStudentPromise.then(function()
				{
					if (trips.length > 0)
					{
						self.removeNeedDeleteTrip(trips);
						// remove student
						// self.routingStudentManager.refresh();
						self.onTripsChangeEvent.notify({
							add: [],
							edit: self.getEditTrips().filter(function(a) { return !Enumerable.From(exceptTrips).Any(function(b) { return b.id == a.id; }); }),
							delete: trips
						});
					}

					// remove student
					// if (self.getEditTrips().length == 0)
					// {
					// 	self.clearCandidateStudents();
					// }
					self.clearContextMenuOperation();
					self.viewModel.editFieldTripStopModal.closeEditModal();
					self._viewModal.setMode("Routing", "Normal");
					tf.loadingIndicator.tryHide();
					self._updateTravelScenarioLock();
				});
			});
		});
	};

	RoutingDataModel.prototype.closeUnsavedNewFieldTrips = function(fieldTrips, noSaveCheck, exceptTrips)
	{
		var self = this, p = Promise.resolve(false);
		if (!noSaveCheck)
		{
			p = self.unSaveConfirmBox(fieldTrips);
		}
		return p.then(function(ans)
		{
			var savePromise = Promise.resolve(ans);
			if (ans)
			{
				savePromise = self.saveRoutingFieldTrips(fieldTrips);
			}
			return savePromise.then(function(result)
			{
				tf.loadingIndicator.showImmediately();

				if (!result)
				{
					fieldTrips.forEach(function(trip)
					{
						self.deleteChangeDataStackByTripId(trip.id);
					});

				}

				if (fieldTrips.length > 0)
				{
					self.removeNeedDeleteTrip(fieldTrips);
					self.onTripsChangeEvent.notify({
						add: [],
						edit: self.getEditTrips().filter(function(a) { return !Enumerable.From(exceptTrips).Any(function(b) { return b.id == a.id; }); }),
						delete: fieldTrips
					});
				}

				self.clearContextMenuOperation();
				self.viewModel.editFieldTripStopModal.closeEditModal();
				self._viewModal.setMode("Routing", "Normal");
				tf.loadingIndicator.tryHide();
				// self._updateTravelScenarioLock();
			});
		});
	};

	RoutingDataModel.prototype._updateTravelScenarioLock = function()
	{
		var travelScenarioIds = this.trips.map((trip) => { return trip.TravelScenarioId; });
		if (!this.lockTravelScenarioIds)
		{
			this.lockTravelScenarioIds = [];
		}
		var addIds = [], deleteIds = [];
		travelScenarioIds.forEach((id) =>
		{
			if (this.lockTravelScenarioIds.indexOf(id) < 0)
			{
				addIds.push(id);
			}
		});

		this.lockTravelScenarioIds.forEach((id) =>
		{
			if (travelScenarioIds.indexOf(id) < 0)
			{
				deleteIds.push(id);
			}
		});
		addIds.length > 0 && TF.RoutingMap.TravelScenariosPalette.TravelScenariosDataModel.useTravelScenario(addIds, this.routeState);
		deleteIds.length > 0 && TF.RoutingMap.TravelScenariosPalette.TravelScenariosDataModel.unUseTravelScenario(deleteIds, this.routeState);
		this.lockTravelScenarioIds = travelScenarioIds;
	};

	/**
	* if remove or close trip, release the students temporary assigned to the trip
	*/
	RoutingDataModel.prototype._releaseStudentToUnAssign = function(trips)
	{
		var promises = [],
			totalUnassignedStudents = [],
			self = this;
		trips.forEach(function(trip)
		{
			var studentsTripStops = [];
			trip.FieldTripStops.forEach(function(tripStop)
			{
				var unAssignStudents = [];
				if (!tripStop.originalStudents)
				{
					unAssignStudents = tripStop.Students;
				} else
				{
					// unAssignStudents is not exTripStopIDists in original students
					unAssignStudents = tripStop.Students.filter(function(student)
					{
						return !Enumerable.From(tripStop.originalStudents).Any(function(c) { return c.id == student.id; });
					});
				}

				unAssignStudents.forEach(function(student)
				{
					student.OpenType = "Edit";
				});
				totalUnassignedStudents = totalUnassignedStudents.concat(unAssignStudents);
				studentsTripStops.push({ students: unAssignStudents, tripStop: tripStop });
			});
			promises.push(self.unAssignStudentMultiple(studentsTripStops, false, false));
		});
		return Promise.all(promises).then(function()
		{
			return totalUnassignedStudents;
		});
	};

	RoutingDataModel.prototype.removeNeedDeleteTrip = function(deleteTrips)
	{
		this.trips = this.trips.filter(function(trip)
		{
			return !Enumerable.From(deleteTrips).Any(function(c) { return c.id == trip.id || c.id == trip.Id || c.Id == trip.id || c.oldId == trip.Id || c.oldId == trip.id; });
		});
	};

	RoutingDataModel.prototype.closeByViewTrips = function(viewTripsToClose)
	{
		var self = this;
		var promise = Promise.resolve();
		if (viewTripsToClose.length > 0)
		{
			self.removeNeedDeleteTrip(viewTripsToClose);
			self.onTripsChangeEvent.notify({ add: [], edit: [], delete: viewTripsToClose });
			// self.clearSchoolLocation(viewTripsToClose);
			// self.routingStudentManager.refresh();
		}
		self.clearContextMenuOperation();
		self.viewModel.editFieldTripStopModal.closeEditModal();
		self._viewModal.setMode("Routing", "Normal");
		return promise;
	};

	RoutingDataModel.prototype.closeByViewFieldTrips = function(viewTripsToClose)
	{
		var self = this;
		var promise = Promise.resolve();
		if (viewTripsToClose.length > 0)
		{
			self.removeNeedDeleteTrip(viewTripsToClose);
			self.onTripsChangeEvent.notify({ add: [], edit: [], delete: viewTripsToClose });
		}
		self.clearContextMenuOperation();
		self.viewModel.editFieldTripStopModal.closeEditModal();
		self._viewModal.setMode("Routing", "Normal");
		return promise;
	};

	RoutingDataModel.prototype.closeAllViewTrips = function()
	{
		var self = this;
		// return self.closeByViewTrips(self.getViewTrips());
		return self.closeByViewFieldTrips(self.getViewTrips());
	};

	RoutingDataModel.prototype.getViewTrips = function()
	{
		var self = this;
		return self.trips.filter(function(trip)
		{
			return trip.OpenType === "View";
		});
	};

	RoutingDataModel.prototype.getEditTrips = function()
	{
		var self = this;
		return self.trips.filter(function(trip)
		{
			return trip.OpenType === "Edit";
		});
	};

	RoutingDataModel.prototype.clearCandidateStudents = function()
	{
		if (this.candidateStudents && this.candidateStudents.length > 0)
		{
			var promise = this.onCandidatesStudentsChangeToMapEvent?.notify({ add: [], edit: [], delete: this.candidateStudents });
			this.candidateStudents = [];
			//this.routingStudentManager.oldCandidateStudentsToShow = "";
			this.viewModel.drawTool && this.viewModel.drawTool.clearCandidateStudents();
			return promise;
		}
		return Promise.resolve(true);
	};

	RoutingDataModel.prototype.clearSchoolLocation = function(tripsToClose)
	{
		var remainTrips = this.trips.filter(function(trip)
		{
			return !Enumerable.From(tripsToClose).Any(function(c) { return c.id == trip.id; });
		});
		var remainSchools = [];
		remainTrips.forEach(function(trip)
		{
			trip.FieldTripStops.forEach(function(tripStop)
			{
				if (tripStop.SchoolCode)
				{
					remainSchools.push(tripStop.SchoolCode);
				}
			});
		});
		for (var key in this.schoolLocationDictionary)
		{
			if (!Enumerable.From(remainSchools).Any(function(c) { return c == key; }))
			{
				delete this.schoolLocationDictionary[key];
			}
		}
		this.drawSchoolLocation();
	};

	RoutingDataModel.prototype.isHighlighted = function() { return false; };

	RoutingDataModel.prototype.unSaveCheckConfirmBox = function(tripsToClose, openTrips)
	{
		var self = this;
		if (tripsToClose.length == 0)
		{
			return Promise.resolve(true);
		}

		var editTrips = self.getEditTrips();
		if (!openTrips)
		{
			openTrips = editTrips.filter(function(trip)
			{
				return !Enumerable.From(tripsToClose).Any(function(c) { return c.id == trip.Id || c.Id == trip.Id || c.Id == trip.id || c.id == trip.id; });
			});
		}

		var message = null;

		return self.unSaveConfirmBox(tripsToClose, message).then(function(ans)
		{
			if (ans)
			{
				var changedTripsToClose = self.getChangedTrips(tripsToClose);
				var failMessage = self.checkDataValid(changedTripsToClose);
				if (failMessage)
				{
					tf.promiseBootbox.alert(
						{
							message: failMessage,
							title: "Error"
						});
					return Promise.resolve();
				}
				return self.saveRoutingFieldTrips(changedTripsToClose);
				// self.refresh(openTrips);
			}

			return Promise.resolve(true);
		});
	};

	RoutingDataModel.prototype.unSaveConfirmBox = function(trips, message)
	{
		var self = this;
		return self.unSaveCheck(trips).then(function(isChanged)
		{
			if (isChanged)
			{
				return tf.promiseBootbox.yesNo({
					message: message || "There are unsaved changes. Do you want to save your changes?",
					title: "Unsaved Changes"
				});
			}
			return false;
		});
	};

	RoutingDataModel.prototype.unSaveCheck = function(tripsToClose)
	{
		var self = this;
		return self.viewModel.editFieldTripStopModal.beforeChangeData().then(function(ans)
		{
			if (ans)
			{
				return self.save().then(function()
				{
					return false;
				});
			}
			return self.getChangedTrips(tripsToClose).length > 0;
		});
	};

	RoutingDataModel.prototype.getChangedTrips = function(tripsToClose)
	{
		var self = this;
		var trips = tripsToClose || self.trips.slice();
		var changeTrips = self.getChangeTripIds();
		return trips.filter(function(trip)
		{
			return Enumerable.From(changeTrips).Any(function(c) { return c == trip.id; });
		});
	};

	// #region edit

	RoutingDataModel.prototype.update = function(items, isNoStopChange)
	{
		var self = this,
			tripStops = [],
			tripBoundary = [];
		items = this.singleToArray(items);
		items.forEach(function(item)
		{
			switch (item.type)
			{
				case "tripBoundary":
					tripBoundary.push(item);
					break;
				case "tripStop":
					tripStops.push(item);
					break;
			}
		});

		if (tripBoundary.length > 0)
		{
			return this.fieldTripStopDataModel.updateTripBoundary(tripBoundary);
		}
		if (tripStops.length > 0)
		{
			return self.fieldTripStopDataModel.update(tripStops, false, isNoStopChange);
		}
	};

	// #endregion

	RoutingDataModel.prototype.deleteTrip = function(trip)
	{
		var self = this, promises = [];
		if (trip.Id && !tf.authManager.authorizationInfo.isAuthorizedFor("trip", "delete"))
		{
			return tf.promiseBootbox.alert("you don't have permission to delete trip");
		}

		tf.promiseBootbox.yesNo({
			message: "Are you sure you want to delete this trip?",
			title: "Confirm"
		}).then(function(ans)
		{
			if (ans)
			{
				var resultObject = self.handleRelatedTrip([trip], 'revert');
				if (resultObject.message)
				{
					tf.promiseBootbox.confirm({
						message: resultObject.message,
						title: "Confirmation"
					}).then(function(result)
					{
						if (result)
						{
							deleteTrip(trip);
							self.revert(resultObject.trips.filter(function(t)
							{
								return !Enumerable.From([trip]).Any(function(p) { return p.id == t.id; });
							}));
						}
					});
				}
				else
				{
					deleteTrip(trip);
				}
			}
		});

		function deleteTrip(trip)
		{
			var deletePromise = Promise.resolve();
			if (trip.Id)
			{
				deletePromise = tf.promiseAjax.delete(pathCombine(tf.api.apiPrefix(), "trips?id=" + trip.id));
			}
			deletePromise.then(function()
			{
				// save trip geometry data
				promises.push(self.featureData.delete(trip.id));
				Promise.all(promises).then(function()
				{
					self.closeByTrips([trip]);
					self.getStudentLockData().updateRecords();
					self.tripLockData.saveData([trip]);
				});
			});
		}
	};

	RoutingDataModel.prototype.save = function(trips)
	{
		var self = this;
		if (!trips || trips.length == 0)
		{
			trips = this.trips;
		}
		var failMessage = self.checkDataValid(trips);
		if (failMessage)
		{
			tf.promiseBootbox.alert(
				{
					message: failMessage,
					title: "Error"
				});
			return Promise.resolve();
		}
		self.viewModel.routingChangePath.stop();
		return self.saveTrips(trips).then(function(success)
		{
			if (success)
			{
				//self.routingStudentManager.refresh(null, true);
				self.showSaveSuccessToastMessage();
				self.updateTripOriginalData(trips);
				self.onTripDisplayRefreshEvent.notify(self.trips);
				self.tripLockData.lockIds(trips.filter(function(trip)
				{
					return trip.Id && trip.OpenType != "View";
				}).map(i => i.Id));
				self.viewModel.analyzeTripByDistrictPolicy.analyze(trips);
			}
		});
	};

	RoutingDataModel.prototype.saveFieldTrip = function(fieldTrips)
	{
		var self = this;
		if (!fieldTrips || fieldTrips.length == 0)
		{
			fieldTrips = this.fieldTrips;
		}
		var failMessage = self.checkDataValid(fieldTrips);
		if (failMessage)
		{
			tf.promiseBootbox.alert(
				{
					message: failMessage,
					title: "Error"
				});
			return Promise.resolve();
		}
		self.viewModel.routingChangePath.stop();
		return self.saveRoutingFieldTrips(fieldTrips).then(function(success)
		{
			if (success)
			{
				// self.routingStudentManager.refresh(null, true);
				self.showSaveSuccessToastMessage();
				self.updateTripOriginalData(fieldTrips);
				self.onTripDisplayRefreshEvent.notify(self.trips);
				self.tripLockData.lockIds(fieldTrips.filter(function(trip)
				{
					return trip.Id && trip.OpenType != "View";
				}).map(i => i.Id));
				// self.viewModel.analyzeTripByDistrictPolicy.analyze(fieldTrips);
			}
		});
	};

	RoutingDataModel.prototype.checkDataValid = function(trips)
	{
		var i, j;
		// remove student
		// this.setAllStudentValidProperty(trips);
		for (i = 0; i < trips.length; i++)
		{
			for (j = i + 1; j < trips.length; j++)
			{
				if (trips[i].Name === trips[j].Name)
				{
					return `The field trip name '${trips[i].Name}' is not unique. Please keep each field trip name unique before saving.`;
				}
			}

			// remove student
			// for (j = 0; j < trips[i].FieldTripStops.length; j++)
			// {
			// 	if (j + 1 < trips[i].FieldTripStops.length
			// 		&& convertToMoment(trips[i].FieldTripStops[j].StopTime) > convertToMoment(trips[i].FieldTripStops[j + 1].StopTime))
			// 	{
			// 		return `The trip '${trips[i].Name}' contains invalid or out of order times. Please correct before saving.`;
			// 	}

			// 	if (trips[i].FieldTripStops[j].Students.some(function(item) { return !item.IsValid; }))
			// 	{
			// 		if (trips[i].Session == TF.Helper.TripHelper.Sessions.ToSchool)
			// 		{
			// 			return `The trip '${trips[i].Name}' picks up students with wrong order. Please correct before saving.`;
			// 		}
			// 		return `The trip '${trips[i].Name}' drops off students with wrong order. Please correct before saving.`;
			// 	}
			// }
		}
		return null;
	};

	RoutingDataModel.prototype.getInvalidStudentByPUDOStatus = function(tripStop, tripId)
	{
		var self = this;
		var invalidStudents = [];
		if (tripStop.FieldTripId == tripId)
		{
			return invalidStudents;
		}
		for (var i = 0; i < tripStop.Students.length; i++)
		{
			var student = tripStop.Students[i];
			var pudoStatus = self.routingStudentManager.getStudentPUDOStatusInTrip(student, tripId);
			if (pudoStatus != null && pudoStatus != student.Session)
			{
				invalidStudents.push(student);
			}
		}
		return invalidStudents;
	};

	RoutingDataModel.prototype.getStudentValidValue = function(student, tripStop)
	{
		var self = this;
		var schoolStop = self.getSchoolStopsByTripId(tripStop.FieldTripId).filter(function(s)
		{
			return student.AnotherTripStopID == s.id;
		});
		if (schoolStop.length && schoolStop.length > 0)
		{
			return (schoolStop[0].Sequence > tripStop.Sequence && (student.Session == TF.Helper.TripHelper.Sessions.ToSchool || student.Session == TF.Helper.TripHelper.Sessions.Shuttle))
				|| (schoolStop[0].Sequence < tripStop.Sequence && student.Session == TF.Helper.TripHelper.Sessions.FromSchool);
		}
		else
		{
			return true;
		}
	};

	RoutingDataModel.prototype.getArrayOfRemoveElement = function(arr)
	{
		var what, a = arguments, L = a.length;
		var result = arr;
		while (L > 1 && arr.length)
		{
			what = a[--L];
			result = result.filter(function(element) { return element !== what; });
		}
		return result;
	};

	RoutingDataModel.prototype.getStudentSchoolCode = function(student, tripStop, isSelf)
	{
		var self = this;
		if (isSelf)
		{
			var _tripStop = self.getFieldTripStopByStopId(student.TripStopID);
			if (_tripStop)
			{
				return _tripStop.SchoolCode;
			}
			else
			{
				return '';
			}
		}
		else
		{
			return student.IsAssigned ? self.getSchoolCodeOfAssignedStudents(student) : self.getSchoolCodeOfUnassignedStudents(student, tripStop);
		}
	};

	RoutingDataModel.prototype.getSchoolCodeOfAssignedStudents = function(student)
	{
		return (student.Session == TF.Helper.TripHelper.Sessions.ToSchool || student.Session == TF.Helper.TripHelper.Sessions.Shuttle) ? student.DOSchoolCode : (student.Session == TF.Helper.TripHelper.Sessions.FromSchool ? student.PUSchoolCode : '');
	};

	RoutingDataModel.prototype.getSchoolCodeOfUnassignedStudents = function(student, tripStop)
	{
		var self = this;

		var tripId;
		if (tripStop)
		{
			tripId = tripStop.FieldTripId;
		}
		else
		{
			var _tripStop = self.getFieldTripStopByStopId(student.TripStopID);
			tripId = _tripStop.FieldTripId;
		}
		var schoolStops = self.getSchoolStopsByTripId(tripId);
		if (schoolStops.length > 0)
		{
			if (schoolStops.some(function(school) { return school.SchoolCode == student.SchoolCode; }))
			{
				return student.SchoolCode;
			}
			// school
			else if (tripStop && tripStop.SchoolCode && tripStop.SchoolCode != student.SchoolCode)
			{
				return tripStop.SchoolCode;
			}
			var firstSchoolCode = schoolStops[0].SchoolCode;
			return schoolStops.some(function(school) { return school.SchoolCode != firstSchoolCode; }) ? '' : firstSchoolCode;
		}
		else
		{
			return '';
		}
	};

	RoutingDataModel.prototype.getSchoolSequence = function(tripId, schoolCode)
	{
		var self = this;
		return self.getSchoolStopsByTripIdSchoolCode(tripId, schoolCode).map(function(item)
		{
			return item.Sequence;
		});
	};

	RoutingDataModel.prototype.findRealSchoolStops = function(tripStop, student)
	{
		var self = this;
		var trip = self.getTripById(tripStop.FieldTripId);
		var _schoolCode = self.getStudentSchoolCode(student, tripStop, false);
		if (!_schoolCode)
		{
			return { id: 0 };
		}
		var allSchools = Enumerable.From(trip.FieldTripStops).Where(function(c) { return c.SchoolCode == _schoolCode; }).ToArray();
		var session = $.isNumeric(student.Session) ? student.Session : trip.Session;
		if (allSchools.length == 0)
		{
			return { id: 0 };
		}
		else
		{
			var validSchool = Enumerable.From(allSchools).Where(function(c)
			{
				return (session == TF.Helper.TripHelper.Sessions.ToSchool && c.Sequence > tripStop.Sequence)
					|| (session == TF.Helper.TripHelper.Sessions.FromSchool && c.Sequence < tripStop.Sequence);
			}).ToArray();
			if (validSchool.length == 0)
			{
				return allSchools[0];
			}
			else
			{
				return validSchool[0];
			}
		}
	};

	RoutingDataModel.prototype.setAllStudentValidProperty = function(trips)
	{
		var self = this;
		trips.map(function(trip)
		{
			trip.FieldTripStops.map(function(tripStop)
			{
				self.setAssignedStudentValidProperty(tripStop, trip);
			});
		});
	};

	RoutingDataModel.prototype.setAssignedStudentValidProperty = function(tripStop)
	{
		var self = this;
		tripStop.Students.forEach(function(student)
		{
			student.IsValid = self.getStudentValidValue(student, tripStop);
		});
	};

	RoutingDataModel.prototype.initAllAssignedStudentCrossStatus = function()
	{
		var self = this;
		var changeTripStopList = [],
			promiseList = [];
		self.trips.forEach(function(trip)
		{
			trip.FieldTripStops.forEach(function(tripStop)
			{
				if (tripStop.Students.length == 0)
				{
					return;
				}
				changeTripStopList.push(tripStop);
				promiseList.push(self.viewModel.drawTool.NAtool._getAcrossStreetStudents(tripStop, tripStop.Students, true));
			});
		});

		return Promise.all(promiseList).then(function(crossStudentArray)
		{
			changeTripStopList.forEach(function(tripStop, index)
			{
				var crossStudentIds = crossStudentArray[index][0];
				tripStop.Students.forEach(function(student)
				{
					student.CrossToStop = crossStudentIds.indexOf(student.id) >= 0;
				});
			});
			return true;
		});
	};

	RoutingDataModel.prototype.isTransfer = function(student, tripStop)
	{
		return student.SchoolCode && tripStop.SchoolCode && student.SchoolCode != tripStop.SchoolCode && student.RequirementID;
	};

	RoutingDataModel.prototype.updateStudentCrossStatus = function(tripStopId, student, isCross)
	{
		var requirementID = student.RequirementID,
			previousScheduleID = student.PreviousScheduleID;

		if (student.customData)
		{
			requirementID = student.customData.requirementId;
			previousScheduleID = student.customData.previousScheduleID;
		}

		if (this.tripStopDictionary[tripStopId])
		{
			var students = this.tripStopDictionary[tripStopId].map(function(tripStopEntity)
			{
				return tripStopEntity.student;
			});
			for (var key in this.routingStudentManager.schoolStopDictionary)
			{
				students = students.concat(this.routingStudentManager.schoolStopDictionary[key].filter(function(data)
				{
					return data.student.TripStopID == tripStopId
						&& data.student.id == student.id
						&& data.student.RequirementID == requirementID
						&& data.student.PreviousScheduleID == previousScheduleID;
				}).map(function(data)
				{
					return data.student;
				}));
			}

			Enumerable.From(students).Where(function(s)
			{
				return s.id == student.id
					&& s.RequirementID == requirementID
					&& s.PreviousScheduleID == previousScheduleID;
			}).ToArray().forEach(function(student)
			{
				student.CrossToStop = isCross;
			});
		}
	};

	RoutingDataModel.prototype.initCandidateStudentsCrossStatus = function(trip)
	{
		var self = this,
			promiseList = [],
			studentList = [];
		if (trip)
		{
			trip.FieldTripStops.map(function(tripStop)
			{
				var tripStopEntities = self.tripStopDictionary[tripStop.id];
				if (tripStopEntities)
				{
					tripStop = tripStop ? tripStop : self.getFieldTripStopByStopId(tripStopId);
					var students = tripStopEntities.map(function(tripStopEntity)
					{
						return tripStopEntity.student;
					});
					studentList.push(students);
					let needCalcuAcrossStreetStudents = students.filter(stu => stu.XCoord != 0 && stu.YCoord != 0 && stu.RequirementID);
					promiseList.push(self.viewModel.drawTool.NAtool._getAcrossStreetStudents(tripStop, needCalcuAcrossStreetStudents, true, trip));
				}
			});
		}
		else
		{
			for (var tripStopId in self.tripStopDictionary)
			{
				if (self.tripStopDictionary.hasOwnProperty(tripStopId))
				{
					var tripStopEntities = self.tripStopDictionary[tripStopId];
					var tripStop = self.getFieldTripStopByStopId(tripStopId);
					if (tripStop)
					{
						var students = tripStopEntities.filter(function(t)
						{
							return t.canBeAssigned || (!t.canBeAssigned && t.student.TripStopID != tripStopId);
						}).map(function(tripStopEntity)
						{
							return tripStopEntity.student;
						});
						if (students.length != 0)
						{
							studentList.push(students);
							let needCalcuAcrossStreetStudents = students.filter(stu => stu.XCoord != 0 && stu.YCoord != 0 && stu.RequirementID);
							promiseList.push(self.viewModel.drawTool.NAtool._getAcrossStreetStudents(tripStop, needCalcuAcrossStreetStudents, true));
						}
					}
				}
			}
		}
		return Promise.all(promiseList).then(function(crossStudentArray)
		{
			for (var i = 0; i < studentList.length; i++)
			{
				studentList[i].map(function(student)
				{
					if (crossStudentArray[i][0].indexOf(student.id) == -1)
					{
						student.CrossToStop = false;
					}
					else
					{
						student.CrossToStop = true;
					}
				});
			}
			return Promise.resolve(true);
		});
	};

	RoutingDataModel.prototype.HandleExceptionsBeforeSave = function(trips, expiredExceptions)
	{
		trips.forEach((trip) => 
		{
			trip.FieldTripStops.forEach((tripStop) => 
			{
				var exceptions = expiredExceptions[tripStop.id];
				if (!exceptions)
				{
					return;
				}

				var num = exceptions.length;
				while (num--)
				{
					var exception = exceptions[num];
					var exceptionStartDate = new Date(exception.StartDate);
					var exceptionEndDate = new Date(exception.EndDate);
					if ((trip.StartDate != null && exceptionEndDate < new Date(trip.StartDate)) ||
						(trip.EndDate != null && exceptionStartDate > new Date(trip.EndDate)) ||
						exception.TripID != trip.id)
					{
						continue;
					}

					var stop1 = trip.FieldTripStops.find((stop) => { return stop.id == exception.TripStopID });
					var stop2 = trip.FieldTripStops.find((stop) => { return stop.id == exception.AnotherTripStopID });
					if (!stop1 || !stop2 || (trip.Session != TF.Helper.TripHelper.Sessions.FromSchool && stop1.Sequence > stop2.Sequence))
					{
						continue;
					}

					(trip.EndDate != null && exceptionEndDate > trip.EndDate) && (exception.EndDate = trip.EndDate);
					(trip.StartDate != null && exceptionStartDate < trip.StartDate) && (exception.StartDate = trip.StartDate);

					// remove student
					// one stop only one exception for each student
					// var studentException = tripStop.Students.find((student) => { return !student.RequirementID && student.id == exception.id; });
					// !studentException && tripStop.Students.push(exception);
				}
			});
		});
	};

	RoutingDataModel.prototype.saveTrips = function(trips)
	{
		var self = this;
		if (self.saving)
		{
			return Promise.resolve(false);
		}

		let copiedTrips = trips.filter(t => !!t.copyFromTripId);

		return self.validateName(trips).then(function(valid)
		{
			if (!valid)
			{
				return Promise.reject();
			}

			self.clearRevertInfo();
			tf.loadingIndicator.show();

			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "tripresources"), {
				paramData: {
					"DBID": tf.datasourceManager.databaseId,
					"@filter": "in(FieldTripId," + trips.map(x => x.id).join(",") + ")",
					"@fields": "FieldTripId,StartDate,EndDate,IsTripLevel"
				}
			}).then(function(response)
			{
				const tripResources = response && response.Items && response.Items.length > 0 ? response.Items.filter(c => !c.IsTripLevel) : null;
				// Check if any trip's assignment has been updated.
				let shouldUpdateTripResource = false;

				trips.forEach((trip) =>
				{
					trip.oldId = trip.id;
					trip.UnsavedNewTrip = false;
					const relatedTripResources = tripResources && tripResources.length > 0 ? tripResources.filter(c => c.FieldTripId == trip.id) : null;
					const originalAssignment = self.originalTripAssignment[trip.id];
					if (self.hasFutureResource(relatedTripResources))
					{
						if (!shouldUpdateTripResource && originalAssignment)
						{
							if (self.compareTripAssignment(trip, originalAssignment))
							{
								shouldUpdateTripResource = true;
							}
						}
					}
				});

				if (shouldUpdateTripResource)
				{
					shouldUpdateTripResource = tf.promiseBootbox.yesNo(
						"Future resource substitution exist.  Do you want to replace them with this change?",
						"Confirmation"
					);
				}

				return Promise.resolve(shouldUpdateTripResource)
					.then(result =>
					{
						self.HandleExceptionsBeforeSave(trips, self.expiredExceptions);
						return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "RoutingTrips"),
							{
								paramData: { affectFutureResource: result },
								data: trips
							})
							.then((response) =>
							{
								const savedTrips = response.Items;

								copiedTrips = savedTrips.reduce(function(result, st)
								{
									const matched = copiedTrips.find(x => x.Name === st.Name);
									if (!matched)
									{
										return result;
									}

									return result.concat({ ...st, copyFromTripId: matched.copyFromTripId })
								}, []);

								for (let i = 0; i < savedTrips.length; i++)
								{
									const tripData = savedTrips[i];
									self.originalTripAssignment[tripData.id] = tripData;
									let tripStopStudents = tripData.FieldTripStops.map(ts => ts.Students);
									let isExistsExceptionStds = tripStopStudents.some(stds => stds.some(std => std.IsExceptionScheduleChanged));
									if (isExistsExceptionStds)
									{
										self.changeExceptionStopInfo(tripData);
									}
								}

								self.getStudentLockData().updateRecords();
								var promises = [];
								var unSuccessAssignStudents = [];
								trips.forEach(function(trip)
								{
									RoutingDataModel.unLockRoutingStudentByTrip(trip.oldId || trip.id);
									self.deleteChangeDataStackByTripId(trip.oldId);
									var savedTrip = Enumerable.From(savedTrips).FirstOrDefault({}, function(c) { return c.Name == trip.Name; });
									// change id from local create to match the create after save 
									self.featureData.changeId(trip, savedTrip);
									self.viewModel.drawTool.updateTripId(trip.oldId, trip.id);
									trip.originalStudents = [];
									self.clearExpiredExceptionCacheOfStops(trip.FieldTripStops, self.expiredExceptions);

									// remove student
									// refresh trip stop original student
									// trip.FieldTripStops.forEach(function(tripStop)
									// {
									// 	var savedTripStop = Enumerable.From(savedTrip.FieldTripStops).FirstOrDefault(null, function(stop) { return stop.id == tripStop.id; });
									// 	tripStop.originalStudents = savedTripStop.Students.map(function(c) { return $.extend({}, c); });
									// 	trip.originalStudents = trip.originalStudents.concat(tripStop.originalStudents);
									// 	for (var i = 0; i < tripStop.Students.length; i++)
									// 	{
									// 		var student = tripStop.Students[i];
									// 		if (!Enumerable.From(savedTripStop.Students).Any(function(st) { return st.RequirementID == student.RequirementID && st.PreviousScheduleID == student.PreviousScheduleID; }))
									// 		{
									// 			unSuccessAssignStudents.push(student);
									// 			tripStop.Students.splice(i, 1);
									// 			i--;
									// 		}
									// 	}

									// 	self.removeExpiredExceptions(tripStop.Students, tripStop.id, self.expiredExceptions);
									// 	self.lockSchoolLocation(tripStop);
									// });

									// save trip geometry data
									promises.push(self.featureData.save(trip.id));
								});
								// alert unsuccess assign student message
								if (unSuccessAssignStudents.length > 0)
								{
									var names = unSuccessAssignStudents.map(function(student)
									{
										return student.FirstName + " " + student.LastName;
									}).join(', ');
									var message = "Student " + names + " is assigned to other trips.";
									if (unSuccessAssignStudents.length > 1)
									{
										message = "Students " + names + " are assigned to other trips.";
									}
									tf.promiseBootbox.alert(
										{
											message: message,
											title: "Warning"
										});
								}

								return Promise.all(promises).then(function()
								{
									self.onTripSaveEvent.notify(trips);
									self.tripLockData.saveData(trips);
									self.saving = false;
									tf.loadingIndicator.tryHide();
									return Promise.resolve(true);
								});
							}).catch(function(error)
							{
								tf.loadingIndicator.tryHide();
								if (error.Message) { tf.promiseBootbox.alert({ message: error.Message, title: "Error" }); }
								self.saving = false;
								return false;
							});
					});
			});
		}).then(function(result)
		{
			return self.copyTripUDFs(copiedTrips).then(() => result);
		});
	};

	RoutingDataModel.prototype.saveRoutingFieldTrips = function(fieldTrips)
	{
		var self = this;
		if (self.saving)
		{
			return Promise.resolve(false);
		}
	
		let copiedTrips = fieldTrips.filter(t => !!t.copyFromFieldTripId);
	
		return self.validateFieldTripName(fieldTrips).then(function(valid)
		{
			if (!valid)
			{
				return Promise.reject();
			}
	
			self.clearRevertInfo();
			tf.loadingIndicator.show();
	
			// return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "tripresources"), {
			// 	paramData: {
			// 		"DBID": tf.datasourceManager.databaseId,
			// 		"@filter": "in(FieldTripId," + fieldTrips.map(x => x.id).join(",") + ")",
			// 		"@fields": "FieldTripId,StartDate,EndDate,IsTripLevel"
			// 	}
			// })
			return Promise.resolve(null)
			.then(function(response)
			{
				const tripResources = response && response.Items && response.Items.length > 0 ? response.Items.filter(c => !c.IsTripLevel) : null;
				// Check if any trip's assignment has been updated.
				let shouldUpdateTripResource = false;
	
				fieldTrips.forEach((trip) =>
				{
					trip.oldId = trip.id;
					trip.UnsavedNewTrip = false;
					const relatedTripResources = tripResources && tripResources.length > 0 ? tripResources.filter(c => c.FieldTripId == trip.id) : null;
					const originalAssignment = self.originalTripAssignment[trip.id];
					if (self.hasFutureResource(relatedTripResources))
					{
						if (!shouldUpdateTripResource && originalAssignment)
						{
							if (self.compareTripAssignment(trip, originalAssignment))
							{
								shouldUpdateTripResource = true;
							}
						}
					}
				});
	
				if (shouldUpdateTripResource)
				{
					shouldUpdateTripResource = tf.promiseBootbox.yesNo(
						"Future resource substitution exist.  Do you want to replace them with this change?",
						"Confirmation"
					);
				}
	
				return Promise.resolve(shouldUpdateTripResource)
					.then(result =>
					{
						self.HandleExceptionsBeforeSave(fieldTrips, self.expiredExceptions);
						return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "routingfieldtrips"),
							{
								/* paramData: { affectFutureResource: result }, */
								data: fieldTrips
							})
							.then((response) =>
							{
								const savedTrips = response.Items;
	
								copiedTrips = savedTrips.reduce(function(result, st)
								{
									const matched = copiedTrips.find(x => x.Name === st.Name);
									if (!matched)
									{
										return result;
									}
	
									return result.concat({ ...st, copyFromTripId: matched.copyFromTripId })
								}, []);
								
								// remove student
								// for (let i = 0; i < savedTrips.length; i++)
								// {
								// 	const tripData = savedTrips[i];
								// 	self.originalTripAssignment[tripData.id] = tripData;
								// 	let tripStopStudents = tripData.FieldTripStops.map(ts => ts.Students);
								// 	let isExistsExceptionStds = tripStopStudents.some(stds => stds.some(std => std.IsExceptionScheduleChanged));
								// 	if (isExistsExceptionStds)
								// 	{
								// 		self.changeExceptionStopInfo(tripData);
								// 	}
								// }
								// self.getStudentLockData().updateRecords();
								var promises = [];
								var unSuccessAssignStudents = [];
								fieldTrips.forEach(function(trip)
								{
									// remove student
									// RoutingDataModel.unLockRoutingStudentByTrip(trip.oldId || trip.id);
									self.deleteChangeDataStackByTripId(trip.oldId);
									var savedTrip = Enumerable.From(savedTrips).FirstOrDefault({}, function(c) { return c.Name == trip.Name; });
									// change id from local create to match the create after save 
									self.featureData.changeId(trip, savedTrip);
									self.viewModel.drawTool.updateTripId(trip.oldId, trip.id);
									trip.originalStudents = [];
									self.clearExpiredExceptionCacheOfStops(trip.FieldTripStops, self.expiredExceptions);

									// remove student
									// refresh trip stop original student
									// trip.FieldTripStops.forEach(function(tripStop)
									// {
									// 	var savedTripStop = Enumerable.From(savedTrip.FieldTripStops).FirstOrDefault(null, function(stop) { return stop.id == tripStop.id; });
									// 	tripStop.originalStudents = savedTripStop.Students.map(function(c) { return $.extend({}, c); });
									// 	trip.originalStudents = trip.originalStudents.concat(tripStop.originalStudents);
									// 	for (var i = 0; i < tripStop.Students.length; i++)
									// 	{
									// 		var student = tripStop.Students[i];
									// 		if (!Enumerable.From(savedTripStop.Students).Any(function(st) { return st.RequirementID == student.RequirementID && st.PreviousScheduleID == student.PreviousScheduleID; }))
									// 		{
									// 			unSuccessAssignStudents.push(student);
									// 			tripStop.Students.splice(i, 1);
									// 			i--;
									// 		}
									// 	}
	
									// 	self.removeExpiredExceptions(tripStop.Students, tripStop.id, self.expiredExceptions);
									// 	self.lockSchoolLocation(tripStop);
									// });
	
									// save trip geometry data
									// promises.push(self.featureData.save(trip.id));
								});

								// remove student
								// alert unsuccess assign student message
								// if (unSuccessAssignStudents.length > 0)
								// {
								// 	var names = unSuccessAssignStudents.map(function(student)
								// 	{
								// 		return student.FirstName + " " + student.LastName;
								// 	}).join(', ');
								// 	var message = "Student " + names + " is assigned to other fieldTrips.";
								// 	if (unSuccessAssignStudents.length > 1)
								// 	{
								// 		message = "Students " + names + " are assigned to other fieldTrips.";
								// 	}
								// 	tf.promiseBootbox.alert(
								// 		{
								// 			message: message,
								// 			title: "Warning"
								// 		});
								// }
	
								return Promise.all(promises).then(function()
								{
									self.onTripSaveEvent.notify(fieldTrips);
									self.tripLockData.saveData(fieldTrips);
									self.saving = false;
									tf.loadingIndicator.tryHide();
									return Promise.resolve(true);
								});
							}).catch(function(error)
							{
								tf.loadingIndicator.tryHide();
								if (error.Message) { tf.promiseBootbox.alert({ message: error.Message, title: "Error" }); }
								self.saving = false;
								return false;
							});
					});
			});
		});
	};

	RoutingDataModel.prototype.copyTripUDFs = function(copiedTrips)
	{
		// It's ok even copiedTrips is empty.
		return Promise.all(copiedTrips.map(trip => Promise.all([
			tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "trips"), {
				paramData: {
					"@relationships": "UDF",
					id: trip.copyFromTripId
				}
			}).then((r => r.Items[0])),
			tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "trips"), {
				paramData: {
					id: trip.id
				}
			}).then((r => r.Items[0]))
		]).then(function([originalTrip, copiedTrip])
		{
			// 19:Roll-up   20:Case
			copiedTrip.UserDefinedFields = originalTrip.UserDefinedFields.filter(x => ![19, 20].includes(x.TypeId));

			return tf.promiseAjax.put(pathCombine(tf.api.apiPrefix(), "trips"), {
				paramData: {
					"@relationships": "UDF",
					affectFutureResource: false
				},
				data: [copiedTrip]
			})
		})));
	};

	RoutingDataModel.prototype.changeExceptionStopInfo = function(curTrip)
	{
		let prevTrip = this.trips.find(trip => trip.id === curTrip.id);
		if (!prevTrip)
		{
			return;
		}

		prevTrip.FieldTripStops.forEach(ts =>
		{
			let curTripStop = curTrip.FieldTripStops.find(tripStop => tripStop.id === ts.id);
			ts.Students.forEach(std =>
			{
				let curStudent = curTripStop.Students.find(curStd => curStd.id === std.id);
				std.StartDate = curStudent.StartDate;
				std.EndDate = curStudent.EndDate;
				std.Monday = curStudent.Monday;
				std.Tuesday = curStudent.Tuesday;
				std.Wednesday = curStudent.Wednesday;
				std.Thursday = curStudent.Thursday;
				std.Friday = curStudent.Friday;
				std.Saturday = curStudent.Saturday;
				std.Sunday = curStudent.Sunday;
				std.ValidMonday = curStudent.ValidMonday;
				std.ValidTuesday = curStudent.ValidTuesday;
				std.ValidWednesday = curStudent.ValidWednesday;
				std.ValidThursday = curStudent.ValidThursday;
				std.ValidFriday = curStudent.ValidFriday;
				std.ValidSaturday = curStudent.ValidSaturday;
				std.ValidSunday = curStudent.ValidSunday;
			});
		});
	};

	RoutingDataModel.prototype.compareTripAssignment = function(prev, cur)
	{
		return (((cur.DriverId || prev.DriverId) && cur.DriverId !== prev.DriverId)
			|| ((cur.AideId || prev.AideId) && cur.AideId !== prev.AideId)
			|| ((cur.VehicleId || prev.VehicleId) && cur.VehicleId !== prev.VehicleId));
	};

	RoutingDataModel.prototype.hasFutureResource = function(tripResources)
	{
		let hasFutureResource = false;
		if (tripResources && tripResources.length > 0)
		{
			let currentDate = moment().utc().startOf('day').add('s', -1); // include today
			for (let i = 0; i < tripResources.length; i++)
			{
				const startDate = moment.utc(tripResources[i].StartDate);
				const endDate = moment.utc(tripResources[i].EndDate);
				if (startDate.isAfter(currentDate) || endDate.isAfter(currentDate))
				{
					hasFutureResource = true;
					break;
				}
			}
		}
		return hasFutureResource
	};

	// #region street level Street Crossing

	/**
	 * subscribe street change to modify street Street Crossing
	 */
	// RoutingDataModel.prototype.subscribeStreetChange = function()
	// {
	// 	var self = this;
	// 	var notAutoAssign = self.getNotAutoAssignStudentSetting();
	// 	self.onStreetModifyEvent = function(e, data)
	// 	{
	// 		var street = data.newData;
	// 		var modifyType = data.type;
	// 		var isChange = false;

	// 		if (modifyType == "delete" && street.ProhibitCrosser)
	// 		{
	// 			isChange = true;
	// 		}
	// 		if (modifyType == "create" && street.ProhibitCrosser)
	// 		{
	// 			isChange = true;
	// 		}
	// 		if (modifyType == "update")
	// 		{
	// 			var oldStreet = data.oldData;
	// 			if (street.ProhibitCrosser != oldStreet.ProhibitCrosser)
	// 			{
	// 				isChange = true;
	// 			}

	// 		}

	// 		if (isChange)
	// 		{
	// 			var stops = self.findStopsIncludeStreet(street);
	// 			stops.forEach(function(stop)
	// 			{
	// 				var students = self.getUnAssignStudentInBoundary(stop.boundary);
	// 				if (stop.type == "tripStop" && !notAutoAssign) { self.assignStudent(students, stop); }
	// 				else if (stop.type == "trialStop") { self.viewModel.viewModel.trialStopViewModel.editModal.updateStudent(stop); }
	// 			});
	// 		}
	// 	};
	// 	self.streetDataModel.onStreetModifyEvent.subscribe(self.onStreetModifyEvent);
	// };

	// RoutingDataModel.prototype.findStopsIncludeStreet = function(street)
	// {
	// 	var self = this;
	// 	var streetBuffer = tf.map.ArcGIS.geometryEngine.buffer(street.geometry, self.streetMeterBuffer, "meters");
	// 	var stops = [];
	// 	self.trips.forEach(function(trip)
	// 	{
	// 		trip.FieldTripStops.forEach(function(tripStop)
	// 		{
	// 			if (tripStop.boundary && tripStop.boundary.geometry)
	// 			{
	// 				var isIntersect = tf.map.ArcGIS.geometryEngine.intersect(streetBuffer, tripStop.boundary.geometry);
	// 				if (isIntersect)
	// 				{
	// 					stops.push(tripStop);
	// 				}
	// 			}
	// 		});
	// 	});

	// 	self.viewModel.drawTool._crossStreetLayer.graphics.forEach(function(graphic)
	// 	{
	// 		if (tf.map.ArcGIS.geometryEngine.intersects(graphic.geometry, street.geometry))
	// 		{
	// 			stops.push(graphic.attributes.tripStop);
	// 		}
	// 	});

	// 	var uniqueStopIds = Enumerable.From(stops).Distinct(function(c) { return c.id; }).Select("$.id").ToArray();
	// 	return self.getTripStopByIds(uniqueStopIds);
	// };

	// RoutingDataModel.prototype.getTripStopByIds = function(ids)
	// {
	// 	var self = this, stops = [];
	// 	if (!ids || ids.length == 0)
	// 	{
	// 		return [];
	// 	}
	// 	self.trips.forEach(function(trip)
	// 	{
	// 		trip.FieldTripStops.forEach(function(tripStop)
	// 		{
	// 			if (ids.indexOf(tripStop.id) >= 0)
	// 			{
	// 				stops.push(tripStop);
	// 			}
	// 		});
	// 	});
	// 	return stops;
	// };

	// #endregion

	RoutingDataModel.prototype.revert = function(trips)
	{
		var self = this;
		var reopenTrips = self.getEditTrips().filter(function(t) { return t.Id; });
		var travelScenarios = new Map();
		trips.forEach((trip) => { travelScenarios.set(trip.TravelScenarioId, trip.TravelScenarioName); });
		return self.close(trips).then(function()
		{
			if (trips.length == 0 || reopenTrips.length == 0)
			{
				return;
			}
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "fieldtrips"), {
				paramData: {
					"@filter": "in(Id," + reopenTrips.map(function(t) { return t.Id; }).join(",") + ")"
				}
			}).then(function(response)
			{
				response.Items.forEach((trip) => { trip.TravelScenarioName = travelScenarios.get(trip.TravelScenarioId); })
				return self.setOpenFieldTrips(response.Items, true).then(function()
				{
					return self.showRevertSuccessToastMessage();
				});
			});
		});
	};

	RoutingDataModel.prototype.close = function(trips, notifyChange)
	{
		var self = this;
		trips = trips || self.trips;
		self.featureData.clear();
		self.clearRevertInfo();
		self.viewModel.routingChangePath && self.viewModel.routingChangePath.clearAll();
		var unsavedNewTrips = [], viewTrips = [], editTrips = [];
		trips.map(function(trip)
		{
			if (trip)
			{
				if (trip.UnsavedNewTrip && trip.OpenType === "Edit")
				{
					unsavedNewTrips.push(trip);
				}
				else if (trip.OpenType === "Edit")
				{
					editTrips.push(trip);
				}
				else
				{
					viewTrips.push(trip);
				}
			}
		});
		if (viewTrips && viewTrips.length > 0)
		{
			// self.closeByViewTrips(viewTrips);
			self.closeByViewFieldTrips(viewTrips);
		}
		var promise = Promise.resolve();
		if (unsavedNewTrips.length > 0)
		{
			promise = self.closeUnsavedNewTrips(unsavedNewTrips, true, editTrips);
		}
		if (editTrips.length > 0)
		{
			return promise.then(function()
			{
				// return self.closeByTrips(editTrips, notifyChange);
				return self.closeByFieldTrips(editTrips, notifyChange);
			});
		}
		else
		{
			return promise;
		}
	};

	RoutingDataModel.prototype.refresh = function(refreshTrips)
	{
		var self = this;

		// only exists trip can be refresh
		refreshTrips = (refreshTrips || []).filter(function(trip)
		{
			return Enumerable.From(self.trips).Any(function(c) { return c.id == trip.id || c.Id == trip.id; });
		});

		if (refreshTrips.length > 0)
		{
			var trips = refreshTrips.slice();
			self.featureData.clear();
			self.clearRevertInfo();
			self.viewModel.routingChangePath.clearAll();
			self.trips = self.getViewTrips();
			self.changeDataStack([]);
			self.onTripsChangeEvent.notify({ add: [], edit: [], delete: trips });
			self.setOpenFieldTrips(refreshTrips);
		}
	};

	RoutingDataModel.prototype.unLockTripData = function(trips)
	{
		var self = this,
			isCloseAll = trips.length == self.trips.length;
		this.unLockSchoolLocation(trips);

		if (isCloseAll)
		{
			this.tripLockData.unLockCurrentDocument();
		} else
		{
			var tripIds = trips.map(function(trip) { return trip.id || trip.Id; });
			this.tripLockData.unLock(tripIds);
		}
	};

	RoutingDataModel.prototype.unLockSchoolLocation = function(trips)
	{
		trips.forEach(function(trip)
		{
			trip.FieldTripStops.forEach(function(tripStop)
			{
				if (tripStop.SchoolLocation != null)
				{
					tf.lockData.unLockByExtraInfo(tripStop.id, "SchoolLocation");
				}
			});
		});
	};

	RoutingDataModel.prototype.lockSchoolLocation = function(tripStop)
	{
		var releaseLockPromise = Promise.resolve();
		if (tripStop.SchoolCode)
		{
			releaseLockPromise = tf.lockData.unLockByExtraInfo(tripStop.oldId || tripStop.id, "SchoolLocation");
		}
		return releaseLockPromise.then(function()
		{
			if (tripStop.SchoolLocation)
			{
				tf.lockData.setLock({
					ids: [tripStop.SchoolLocation.Id],
					extraInfo: tripStop.id,
					type: "SchoolLocation",
					isLock: true
				});
			}
		});
	};

	// #region setting

	RoutingDataModel.prototype.getStorage = function()
	{
		// convert 
		const defaultSpeed = tf.measurementUnitConverter.convert({
			value: 19,
			originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Imperial,
			targetUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric
		});

		return {
			autoRefresh: { key: "autoRefreshRouting", default: false },
			moveDuplicateNodes: { key: "moveDuplicateNodesRouting", default: false },
			removeOverlapping: { key: "removeOverlappingRouting", default: true },
			smartSequence: { key: "smartSequenceRouting", default: true },
			fillPattern: { key: "fillPatternRouting", default: "Semi" },
			uTurnPolicy: { key: "uTurnPolicyRouting", default: 1 },
			impedanceAttribute: { key: "impedanceAttrRouting", default: "Time" },
			pathThickness: { key: "pathThicknessRouting", default: 5 },
			boundaryThickness: { key: "boundaryThicknessRouting", default: 2 },
			boundaryLineStyle: { key: "boundaryLineStyleRouting", default: "short-dot" },
			showAssignedStudents: { key: "showAssignedStudentsRouting", default: true },
			showAssignedStudentsCount: { key: "showAssignedStudentsCountRouting", default: false },
			studentCountLabelColor: { key: "studentCountLabelColorRouting", default: "" },
			showLabel: { key: "routingTripStopShowLabel", default: false },
			arrowPosition: { key: "arrowPosition", default: 1 },
			geoLink: { key: "geoLink", default: false },
			avgSpeed: { key: "avgSpeed", default: defaultSpeed },
			speedType: { key: "speedType", default: 0 },
			showStopBoundary: { key: "showStopBoundary", default: true }
		};
	};

	RoutingDataModel.prototype.getGeoLinkSetting = function()
	{
		var storages = this.getStorage();
		var storageKey = storages.geoLink.key;
		var defaults = storages.geoLink.default;
		return this.getSettingByKey(storageKey, "", defaults);
	};

	RoutingDataModel.prototype.getSmartSequenceSetting = function()
	{
		var storages = this.getStorage();
		var storageKey = storages.smartSequence.key;
		var defaults = storages.smartSequence.default;
		return this.getSettingByKey(storageKey, "", defaults);
	};

	RoutingDataModel.prototype.getNotAutoAssignStudentSetting = function()
	{
		var routeState = this.routeState;
		if (!routeState)
		{
			throw "routeState is required";
		}
		var storages = this._getUnassignedStudentViewModel().dataModel.getStorage();
		var storageKey = storages.notAutoAssign.key;
		var defaults = storages.notAutoAssign.default;
		return this.getSettingByKey(storageKey, routeState, defaults);
	};

	RoutingDataModel.prototype.setSmartSequenceSetting = function(value)
	{
		var storages = this.getStorage();
		var storageKey = storages.smartSequence.key;
		tf.storageManager.save(storageKey, value);
		this.onSettingChangeEvent.notify();
	};
	// #endregion

	// #region assign and not assign student
	RoutingDataModel.prototype.autoUnassignStudent = function(trips)
	{
		var self = this;
		if (trips && trips.length > 0)
		{
			trips.forEach(function(trip)
			{
				var studentsTripStops = [];
				trip.FieldTripStops.forEach(function(tripStop)
				{
					studentsTripStops.push({ students: tripStop.Students, tripStop: tripStop });
				});
				self.unAssignStudentMultiple(studentsTripStops, false, false);
				self.changeDataStack.push(trip);
			});
		}

		this.onTripsChangeEvent.notify({ add: [], edit: trips, delete: [] });
		return Promise.resolve(true);
	};

	RoutingDataModel.prototype.autoAssignStudent = function(trips)
	{
		var self = this, allTripStudentsCount = 0;
		var tripStopDataModel = self.fieldTripStopDataModel;
		var promiseList = [];
		tf.loadingIndicator.show();
		if (trips && trips.length > 0)
		{
			trips.forEach(function(trip)
			{
				trip.FieldTripStops.map(function(tripStop)
				{
					if (self.tripStopDictionary[tripStop.id])
					{
						allTripStudentsCount += self.tripStopDictionary[tripStop.id].length;
					}
				});
			});
			trips.forEach(function(trip)
			{
				promiseList.push(tripStopDataModel.autoAssignStudent(trip.FieldTripStops));
				self.changeDataStack.push(trip);
			});
			return Promise.all(promiseList).then(function()
			{
				tf.loadingIndicator.tryHide();
				// remove student
				// self.setStudentTravelTime(trips);
				// self.setAllStudentValidProperty(trips);
				self.onTripsChangeEvent.notify({ add: [], edit: trips, delete: [] });
				tf.loadingIndicator.tryHide();
			});
		}
		else
		{
			return Promise.resolve(true);
		}
	};

	/**
	 * remove crosser on stop
	 * @param {Array} students 
	 * @param {Object} tripStop 
	 */
	RoutingDataModel.prototype.removeCrosserOnStop = function(students, tripStop, notifyEvent, notAffectCandidateStudents, trip, isAssignStudent)
	{
		var self = this;
		var allStudents = students;
		let succeedStudents = [], prohibitStudents = [];

		return self.getStudentRemoveCrosser(tripStop, allStudents, trip, isAssignStudent).then(function(canAssignStudents)
		{
			var canAssignStudentsEnumerable = Enumerable.From(canAssignStudents);
			if (!notAffectCandidateStudents)
			{
				var candidateStudentsEnumerable = Enumerable.From(self.candidateStudents);
				var crosser = allStudents.filter(function(student)
				{
					return !canAssignStudentsEnumerable.Any(function(c) { return c.id == student.id; }) &&
						!candidateStudentsEnumerable.Any(function(c) { return c.id == student.id; });
				});

				self.unAssignStudent(crosser, tripStop, notifyEvent);
			}

			students.map(s =>
			{
				if (canAssignStudentsEnumerable.Any(function(c) { return c.id == s.id; }))
				{
					succeedStudents.push(s);
				}
				else
				{
					prohibitStudents.push(s);
				}
			});

			return {
				succeedStudents: succeedStudents, prohibitStudents: prohibitStudents
			};
		});
	};

	RoutingDataModel.prototype.assignStudentMultiple = function(studentsTripStops, notifyEvent, notAffectCandidateStudents, notifyMapEvent, trip, autoAssign, schoolAssigned, isChangeType, isRecalculate, isAlertMessage = false)
	{
		var promises = [];
		var self = this;
		if (studentsTripStops.length == 0 || studentsTripStops.filter(x => x.students && x.students.length == 0).length == studentsTripStops.length)
		{
			return Promise.resolve();
		}
		tf.loadingIndicator.show();
		self.routingStudentManager.calculateStudentStatus();
		var tripIds = new Set();
		studentsTripStops.forEach(x =>
		{
			tripIds.add(x.tripStop.FieldTripId);
			x.students.forEach(s =>
			{
				s.key = s.key || self.getKey(s.id, s.RequirementID, s.TripStopID, s.AnotherTripStopID, s.PreviousScheduleID);
				self.studentsDictionary[s.key].forEach(sd => tripIds.add(sd.tripId));
			});
		});
		var trips = [];
		tripIds.forEach(x => trips.push(self.getTripById(x)));
		return self.viewModel.drawTool.NAtool.setStopStreets(studentsTripStops.map((c) => { return c.tripStop; })).then(() =>
		{
			studentsTripStops.forEach((studentsTripSop) =>
			{
				if (studentsTripSop.students && studentsTripSop.students.length > 0)
				{
					promises.push(self._prepareAssignStudent(studentsTripSop.students, studentsTripSop.tripStop, notifyEvent, notAffectCandidateStudents, trip, autoAssign, schoolAssigned, isChangeType, false));
				}
			});

			return Promise.all(promises).then((data) =>
			{
				let studentsTripStops = [], prohibitStudents = [];
				data.map(d => 
				{
					if (d && d.students)
					{
						studentsTripStops.push(d);
					}
					if (d && d.prohibitStudents)
					{
						prohibitStudents = [...prohibitStudents, ...d.prohibitStudents];
					}
				});
				return self.routingStudentManager.setWeekdaysForAssign(studentsTripStops).then(() =>
				{
					var students = [];
					studentsTripStops.forEach((studentsTripStop) =>
					{
						var studAssigned = self._doAssignStudent(studentsTripStop.students, studentsTripStop.tripStop, false, notAffectCandidateStudents, false, isRecalculate, isAlertMessage, false);
						if (studAssigned && studAssigned.length)
						{
							students = students.concat(studAssigned);
						}

						self.addIsSchoolStopFlagToTrips(studentsTripStop.tripStop);
					});
					self.routingStudentManager.refresh();
					if (notifyEvent != false)
					{
						self.onTripsChangeEvent.notify({ add: [], edit: trips, delete: [] });
					}
					if (notifyMapEvent != false)
					{
						self.onAssignStudentsChangeToMapEvent.notify({ add: students, edit: [], delete: [] });
					}
					tf.loadingIndicator.tryHide();
					self.viewModel.drawTool.NAtool.removeStopStreets();
					self.viewModel.analyzeTripByDistrictPolicy.analyze(trips);
					return { prohibitStudents: prohibitStudents };
				});
			});
		});
	};

	RoutingDataModel.prototype.addIsSchoolStopFlagToTrips = function(studentTripStop)
	{
		this.trips.forEach(trip =>
		{
			let tripStops = trip.FieldTripStops.filter(tripStop =>
			{
				return studentTripStop.path && tripStop.path.FieldTripId === studentTripStop.path.FieldTripId && tripStop.path.TripStopId === studentTripStop.path.TripStopId;
			});
			tripStops.forEach(tripStop =>
			{
				tripStop.isSchoolStop = studentTripStop.isSchoolStop;
			});
		});
	}

	RoutingDataModel.prototype.assignStudent = function(students, tripStop, notifyEvent, notAffectCandidateStudents, notifyMapEvent, trip, autoAssign, schoolAssigned, isChangeType, isRecalculate, isAlertMessage, isCalculateStudentStatus = true)
	{
		var self = this;

		if (!students || students.length == 0)
		{
			return Promise.resolve();
		}

		return self._prepareAssignStudent(students, tripStop, notifyEvent, notAffectCandidateStudents, trip, autoAssign, schoolAssigned, isChangeType, isCalculateStudentStatus).then(function(studentsTripStop)
		{
			if (studentsTripStop)
			{
				let prohibitStudents = studentsTripStop.prohibitStudents;
				if (studentsTripStop.students)
				{
					return self.routingStudentManager.setWeekdaysForAssign([studentsTripStop]).then(function()
					{
						self._doAssignStudent(studentsTripStop.students, studentsTripStop.tripStop, notifyEvent, notAffectCandidateStudents, notifyMapEvent, isRecalculate, isAlertMessage);
						return { prohibitStudents: prohibitStudents, transStudents: studentsTripStop.transStudents };
					});
				}
			}
		});
	};

	RoutingDataModel.prototype._prepareAssignStudent = function(students, tripStop, notifyEvent, notAffectCandidateStudents, trip, autoAssign, schoolAssigned, isChangeType, isCalculateStudentStatus = true)
	{
		var self = this;
		let transStudents = [];
		// clone student
		if (!isChangeType)
		{
			students = (students || []).map(function(student)
			{
				var stud = self.getCanAssignCandidateStudentById(student.id || student.Id, student.RequirementID, student.PreviousScheduleID, student, isCalculateStudentStatus);
				if (stud)
				{
					return $.extend({}, stud);
				}
				return null;
			}).filter((c) => { return c; });
		}

		if (!students || students.length == 0)
		{
			return Promise.resolve();
		}

		if (this.getSession() != 3)
		{
			let originalStudents = students;
			students = students.filter(function(student)
			{
				var validSchoolStops = self.routingStudentManager.findSchoolStops(tripStop, student, trip);
				var schoolCodes = [];
				for (var i = 0; i < validSchoolStops.length; i++)
				{
					var school = validSchoolStops[i];
					if (schoolCodes.indexOf(school.SchoolCode) == -1)
					{
						schoolCodes.push(school.SchoolCode);
					}
				}

				// this filter students that SchoolCode complies with trip or the trip only has one SchoolCode
				if (schoolAssigned)
				{
					return !!schoolAssigned.SchoolCode;
				}

				if (self.getArrayOfRemoveElement(schoolCodes, student.TransSchoolCode).length <= 1)
				{
					return true;
				}

				let schoolCode;
				if (!student.RequirementID)
				{
					schoolCode = student.DOSchoolCode || student.PUSchoolCode;
				}

				schoolCode = schoolCode || student.schoolCode;
				return schoolCodes.indexOf(schoolCode) > -1;
			});
			transStudents = originalStudents.filter(student => !students.some(x => (x.Id || x.id) === (student.Id || student.id)));
		} else
		{
			// student session must same for mid day trip
			students = students.filter(function(student)
			{
				return student.Session == self.routingStudentManager.getStudentPUDOStatusByTripId(student, tripStop.FieldTripId);
			});

			if (students.length == 0)
			{
				tf.promiseBootbox.alert(
					{
						message: "This student is already on the trip. ",
						title: "Warning"
					});
				return Promise.resolve('StudentSessionNotAvailable');
			}
		}

		return self.removeCrosserOnStop(students, tripStop, notifyEvent, notAffectCandidateStudents, trip, autoAssign || !self.getNotAutoAssignStudentSetting())
			.then(function(result)
			{
				students = result.succeedStudents;
				var prohibitStudents = result.prohibitStudents;
				if (tripStop.OpenType == 'Edit')
				{
					students = students.filter(function(student)
					{
						return self.routingStudentManager.canBeAssign(tripStop, student);
					});
				}

				if (trip === null || trip === undefined)
				{
					trip = self.getTripById(tripStop.FieldTripId);
				}
				self.initSchoolSequence(trip.id, [trip]);
				students.forEach(function(student)
				{
					if (!student.RequirementID) return; //used for exception student
					var schoolStop;
					if (schoolAssigned)
					{
						schoolStop = schoolAssigned;
					}
					else
					{
						var candidateSchools = self.routingStudentManager.findSchoolStops(tripStop, student, trip);
						if (candidateSchools.length > 0)
						{
							schoolStop = candidateSchools[0];
						}
					}
					if (schoolStop && schoolStop.id != 0)
					{
						student.AnotherTripStopID = schoolStop.id;
						self.tryValidateSchoolStop([student], tripStop, false);
						if (student.Session == TF.Helper.TripHelper.Sessions.ToSchool || student.Session == TF.Helper.TripHelper.Sessions.Shuttle)
						{
							student.DOSchoolCode = schoolStop.SchoolCode;
						}
						else if (student.Session == TF.Helper.TripHelper.Sessions.FromSchool)
						{
							student.PUSchoolCode = schoolStop.SchoolCode;
						}
					}
					else
					{
						return Promise.resolve(false);
					}
				});

				if (isChangeType)
				{
					tripStop.Students = tripStop.Students.concat(students);
					return Promise.resolve(true);
				}

				students = students.filter(function(student)
				{
					return student.AnotherTripStopID;
				});

				return { students: students, tripStop: tripStop, prohibitStudents: prohibitStudents, transStudents: transStudents };
			});
	};

	RoutingDataModel.prototype._doAssignStudent = function(students, tripStop, notifyEvent, notAffectCandidateStudents, notifyMapEvent, isRecalculate, isAlertMessage, isRefreshStudent = true)
	{
		if (students.length == 0)
		{
			return;
		}

		var self = this;
		var studentsAssigned = [],
			studentsUnassigned = [],
			hasAllWeekUnassign = true;
		students.forEach(function(student)
		{
			var isAssigned = false;
			RoutingDataModel.weekdays.forEach(function(day)
			{
				isAssigned = isAssigned || student[day];
			});
			isAssigned ? studentsAssigned.push(student) : studentsUnassigned.push(student);
			RoutingDataModel.weekdays.forEach(function(weekday)
			{
				if (student[weekday])
				{
					hasAllWeekUnassign = false;
				}
			});
		});

		if (hasAllWeekUnassign && !self.selectDayAlert && isAlertMessage != false)
		{
			self.selectDayAlert = true;
			tf.promiseBootbox.alert("Can not assign this student.").then(function()
			{
				self.selectDayAlert = false;
			});
		}
		else if (studentsUnassigned.length > 0)
		{
			// alert student can not assign when locked by other trip
			var studentsUnassignedToShow = studentsUnassigned.filter(function(s)
			{
				return !Enumerable.From(self.studentsDictionary[s.key]).Any(function(c) { return c.tripId == tripStop.FieldTripId && c.IsAssigned; });
			}).map(function(s)
			{
				return s.FirstName + " " + s.LastName;
			});
			if (studentsUnassignedToShow.length > 0 && !self.isAssignStudentAlert && isAlertMessage != false)
			{
				self.isAssignStudentAlert = true;
				tf.promiseBootbox.alert(studentsUnassignedToShow.join(",") + (studentsUnassignedToShow.length == 1 ? " is" : " are") + " assigned by other trips").then(function()
				{
					self.isAssignStudentAlert = false;
				});
			}
		}

		students = studentsAssigned;
		if (students.length == 0)
		{
			return;
		}
		tripStop.Students = tripStop.Students.concat(students);
		if (isRefreshStudent)
		{
			self.routingStudentManager.refresh(students);
		}
		if (notAffectCandidateStudents)
		{
			return;
		}
		if (notifyEvent != false)
		{
			self.onAssignStudentsChangeEvent.notify({ add: students, edit: [], delete: [], tripStop: tripStop, isRecalculate: typeof isRecalculate == "undefined" ? true : isRecalculate });
		}
		if (notifyMapEvent != false)
		{
			self.onAssignStudentsChangeToMapEvent.notify({ add: students, edit: [], delete: [], tripStop: tripStop });
		}
		return students;
	};

	RoutingDataModel.prototype.unAssignStudentMultiple = function(studentsTripStops, isNotifyUnAssignStudentEvent, notifyMapEvent)
	{
		var self = this;
		this.unLockRoutingStudentByUnAssign(studentsTripStops);
		var promises = [];
		studentsTripStops.forEach((studentsTripStop) =>
		{
			promises.push(this.unAssignStudent(studentsTripStop.students, studentsTripStop.tripStop, false, false, false));
		});
		return Promise.all(promises).then(function(data)
		{
			var students = [];
			data.forEach((studs) =>
			{
				students = students.concat(studs);
			});
			self.routingStudentManager.refresh();
			if (isNotifyUnAssignStudentEvent != false)
			{
				self.onTripsChangeEvent.notify({ add: [], edit: self.trips, delete: [] });
			}
			if (notifyMapEvent != false)
			{
				self.onAssignStudentsChangeToMapEvent.notify({ add: [], edit: [], delete: students });
			}

		});
	};

	RoutingDataModel.prototype.unAssignStudent = function(students, tripStop, isNotifyUnAssignStudentEvent, notifyMapEvent, unLockRouting = true)
	{
		var self = this;

		if (students.length == 0)
		{
			return Promise.resolve([]);
		}

		var studentEnumerable = Enumerable.From(students);
		tripStop.Students = tripStop.Students.filter(function(s)
		{
			return !studentEnumerable.Any(function(c) { return c.id == s.id && c.RequirementID == s.RequirementID && c.PreviousScheduleID == s.PreviousScheduleID; });
		});

		if (unLockRouting)
		{
			self.unLockRoutingStudentByUnAssign([{ tripStop: tripStop, students: students }]);
		}

		students.forEach(function(student)
		{
			student.IsAssigned = false;
		});

		let studentIds = students.map(s => s.id);

		self.candidateStudents.forEach(s =>
		{
			if (!s.RequirementID && studentIds.includes(s.id))
			{
				s.IsAssigned = false;
			}
		});

		self.routingStudentManager.setWeekdaysForUnassign(students, tripStop);
		if (unLockRouting)
		{
			self.routingStudentManager.refresh(students);
		}

		if (isNotifyUnAssignStudentEvent != false)
		{
			self.onAssignStudentsChangeEvent.notify({ add: [], edit: [], delete: students, tripStop: tripStop });
		}

		if (notifyMapEvent != false)
		{
			self.onAssignStudentsChangeToMapEvent.notify({ add: [], edit: [], delete: students, tripStop: tripStop });
		}

		return Promise.resolve(students);
	};

	RoutingDataModel.prototype._getAssignStudentIds = function(tripIds)
	{
		var self = this;
		var studentIds = [];
		tripIds.forEach(function(tripId)
		{

			studentIds = studentIds.concat(self.getAssignStudent(tripId).map(function(student)
			{
				return student.id;
			}));
		});
		return studentIds;
	};

	RoutingDataModel.prototype.getUnAssignStudentInBoundaryProhibitCross = function(stop)
	{
		var self = this;
		var allNewAssignStudents = self.getUnAssignStudentInBoundary([stop.boundary]);
		return self.getStudentRemoveCrosser(stop, allNewAssignStudents);
	};

	RoutingDataModel.prototype.getUnAssignStudentInBoundary = function(boundaries, students, needCopyStudent)
	{
		var self = this;
		var intersects = tf.map.ArcGIS.geometryEngine.intersects;
		var allNewAssignStudents = [];
		var allNewAssignStudentsMapping = {};

		if (!$.isArray(boundaries))
		{
			boundaries = [boundaries];
		}

		boundaries = boundaries.filter(x => x.geometry);

		if (boundaries.length == 0)
		{
			return [];
		}

		if (!students)
		{
			students = self.routingStudentManager.getCandidates(boundaries[0].FieldTripId);
		}

		boundaries.forEach(function(boundary)
		{
			if (!boundary)
			{
				return;
			}
			boundary.newAssignStudent = [];
			students.forEach(function(student)
			{
				if (!student.geometry)
				{
					student.geometry = TF.xyToGeometry(student.XCoord, student.YCoord);
				}
				if (student.geometry.x >= boundary.geometry.extent.xmin && student.geometry.x <= boundary.geometry.extent.xmax && student.geometry.y >= boundary.geometry.extent.ymin && student.geometry.y <= boundary.geometry.extent.ymax)
				{
					if (!allNewAssignStudentsMapping[student.id + "-" + student.RequirementID + "-" + student.PreviousScheduleID]
						&& boundary.geometry && intersects(boundary.geometry, student.geometry) && student.Session != TF.Helper.TripHelper.Sessions.Shuttle)
					{
						var isInSchoolStopIds = false;
						if (needCopyStudent)
						{
							var trip = self.getTripById(boundary.FieldTripId);
							if (trip)
							{
								var tripstop = trip.FieldTripStops.filter(r => r.boundary.TripStopId == boundary.TripStopId)[0];
								if (tripstop)
								{
									var schoolStopIds = self.routingStudentManager.findSchoolStopIds(trip, tripstop, student);
									if (schoolStopIds.length !== 0)
									{
										isInSchoolStopIds = true;
									}
								}
							}
						}
						else
						{
							isInSchoolStopIds = true;
						}

						if (isInSchoolStopIds)
						{
							var newStudent = student;
							if (needCopyStudent)
							{
								newStudent = $.extend({}, student);
								TF.loopCloneGeometry(newStudent, student);
							}
							boundary.newAssignStudent.push(newStudent);
							allNewAssignStudents.push(newStudent);
							allNewAssignStudentsMapping[newStudent.id + "-" + newStudent.RequirementID + "-" + newStudent.PreviousScheduleID] = true;
						}
					}
				}
			});
		});
		return allNewAssignStudents;
	};

	RoutingDataModel.prototype.getStudentRemoveCrosser = function(stop, newAssignStudents, trip, isAssignStudent)
	{
		let self = this;
		let allNewAssignStudents = newAssignStudents.slice();
		// exclude the ungeocode and exception student.
		let needCalcuAcrossStreetStudents = allNewAssignStudents.filter(stu => stu.XCoord != 0 && stu.YCoord != 0 && stu.RequirementID);

		return self.viewModel.drawTool.NAtool._getAcrossStreetStudents(stop, needCalcuAcrossStreetStudents, null, trip, isAssignStudent).then(function(results)
		{
			var crossStudentIds = results[0];
			var stopCrossStudentIds = results[3] || [];
			var allNewAssignStudentsMap = {};
			allNewAssignStudents.forEach(function(student)
			{
				allNewAssignStudentsMap[student.id] = true;
				setDlyCrossToStop(student);
			});

			function setDlyCrossToStop(student)
			{
				if (allNewAssignStudentsMap[student.id])
				{
					student.CrossToStop = crossStudentIds.indexOf(student.id) > -1;
					student.StopCrosser = stopCrossStudentIds.indexOf(student.id) > -1;
				}
			}

			stop.Students && stop.Students.forEach(function(student)
			{
				setDlyCrossToStop(student);
			});

			self.tripStopDictionary[stop.id] && self.tripStopDictionary[stop.id].forEach(function(studentEntity)
			{
				setDlyCrossToStop(studentEntity.student);
			});

			var crossProhibitStreetStudentIds = results[1];

			allNewAssignStudents = allNewAssignStudents.filter(function(c)
			{
				return !c.ProhibitCross || crossStudentIds.indexOf(c.id) < 0;
			});

			allNewAssignStudents = allNewAssignStudents.filter(function(c)
			{
				return crossProhibitStreetStudentIds.indexOf(c.id) < 0;
			});

			if (stop.ProhibitCrosser)
			{
				allNewAssignStudents = allNewAssignStudents.filter(function(c)
				{
					return crossStudentIds.indexOf(c.id) < 0;
				});
			}

			return Promise.resolve(allNewAssignStudents);
		});
	};

	// #endregion

	RoutingDataModel.prototype.deleteChangeDataStackByTripId = function(tripId)
	{
		var self = this;
		this.changeDataStack(this.changeDataStack().filter(function(data)
		{
			var records = data;
			if (!$.isArray(data))
			{
				records = [data];
			}
			return self.getTripId(records[0]) != tripId;
		}));
	};

	RoutingDataModel.prototype.getChangeTripIds = function()
	{
		var self = this;
		var tripIdObj = {};
		this.changeDataStack().forEach(function(data)
		{
			var records = data;
			if (!$.isArray(data))
			{
				records = [data];
			}
			records.forEach(function(record)
			{
				tripIdObj[self.getTripId(record)] = record;
			});
		});

		var tripIds = [];
		for (var key in tripIdObj)
		{
			tripIds.push(key);
		}
		return tripIds;
	};

	RoutingDataModel.prototype.calcSelfChangeCount = function()
	{
		var self = this;
		return self.getChangeTripIds().length;
	};

	RoutingDataModel.prototype.getTripId = function(data)
	{
		switch (data.type)
		{
			case "tripStop":
			case "tripBoundary":
				return data.FieldTripId;
			case "trip":
				return data.id;
		}
	};

	RoutingDataModel.prototype.getBoundaryHeartId = function(boundaryGraphic)
	{
		return boundaryGraphic.attributes.dataModel.TripStopId;
	};

	RoutingDataModel.prototype.getHeartBoundaryId = function(pointGraphic)
	{
		return pointGraphic.attributes.dataModel.boundary.id;
	};

	RoutingDataModel.prototype.getStudentLockData = function()
	{
		return this._getUnassignedStudentViewModel().dataModel.lockData;
	};

	RoutingDataModel.prototype.onSchoolLocationDataSourceChange = function(e, data)
	{
		var isSchoolLocationChanged = Enumerable.From(data.UpdatedRecords).Any(function(c) { return c.Type == "SchoolLocation"; });
		if (isSchoolLocationChanged && this.trips.length > 0)
		{
			this.onSchoolLocationChangeEvent.notify();
		}
	};

	RoutingDataModel.prototype.hasUnsavedRestrictions = function()
	{
		var self = this;
		var trips = self.getEditTrips();
		if (trips.length == 0)
		{
			return false;
		}

		function restrictionsHaveBeenModified(currentTrip, originalTrip)
		{
			if (self.restrictions.some(function(r)
			{
				if (r === 'Schools')
				{
					return !RoutingDataModel.isSchoolsEqual(currentTrip[r], originalTrip[r]);
				}
				else
				{
					return currentTrip[r] != originalTrip[r];
				}
			}))
			{
				return true;
			}
			return false;
		}

		return restrictionsHaveBeenModified(trips[0], self.tripOriginalRestrictions);

	};

	RoutingDataModel.prototype.validateName = function(trips)
	{
		var self = this;
		function valid(index)
		{
			if (index == trips.length)
			{
				return Promise.resolve(true);
			}
			return self.validateUniqueName(trips[index].Name, trips[index].Id).then(function()
			{
				return valid(++index);
			});
		}
		return valid(0);
	};

	RoutingDataModel.prototype.validateFieldTripName = function(fieldTrips)
	{
		var self = this;
		function valid(index)
		{
			if (index == fieldTrips.length)
			{
				return Promise.resolve(true);
			}
			return self.validateUniqueFieldTripName(fieldTrips[index].Name, fieldTrips[index].Id).then(function()
			{
				return valid(++index);
			});
		}
		return valid(0);
	}

	RoutingDataModel.prototype.validateUniqueName = function(name, id)
	{
		var self = this;
		var tripId = id || 0;
		if (name.trim() === '')
		{
			tf.promiseBootbox.alert("Field trip name is required.");
			return Promise.reject();
		}

		if (name.length > 150)
		{
			tf.promiseBootbox.alert("Field trip name should be less than 151 characters.");
			return Promise.reject();
		}

		return Promise.resolve(Enumerable.From(self.trips).Any(function(c) { return c.Name == name && c.Id != tripId; }))
			.then(function(nameDuplicate)
			{
				if (nameDuplicate)
				{
					return false;
				}
				// There is another trip in the database with the same name as this trip.Please change this trip"s name before saving it.
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "trips"), {
					paramData: {
						name: name
					}
				}).then(function(data)
				{
					return data.Items.length == 0 || tripId == data.Items[0].Id;
				});
			}).then(function(valid)
			{
				if (valid)
				{
					return Promise.resolve();
				}
				tf.promiseBootbox.alert("There is another trip with the same name as this trip. Please change this trip's name before saving it.");
				return Promise.reject();
			});
	};

	RoutingDataModel.prototype.validateUniqueFieldTripName = function(name, id)
	{
		var self = this;
		var tripId = id || 0;
		if (name.trim() === '')
		{
			tf.promiseBootbox.alert("Field trip name is required.");
			return Promise.reject();
		}

		// if (name.length > 150)
		// {
		// 	tf.promiseBootbox.alert("Field trip name should be less than 151 characters.");
		// 	return Promise.reject();
		// }

		return Promise.resolve(Enumerable.From(self.trips).Any(function(c) { return c.Name == name && c.Id != tripId; }))
			.then(function(nameDuplicate)
			{
				if (nameDuplicate)
				{
					return false;
				}
				// There is another trip in the database with the same name as this trip.Please change this trip"s name before saving it.
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "fieldtrips"), {
					paramData: {
						name: name
					}
				}).then(function(data)
				{
					return data.Items.length == 0 || tripId == data.Items[0].Id;
				});
			}).then(function(valid)
			{
				if (valid)
				{
					return Promise.resolve();
				}
				tf.promiseBootbox.alert("There is another field trip with the same name as this field trip. Please change this field trip's name before saving it.");
				return Promise.reject();
			});
	};	

	RoutingDataModel.prototype.getKey = function(studentId, requirementId, tripStopId, anotherTripStopID, previousScheduleID)
	{
		if (requirementId)
		{
			return `${studentId}_${requirementId}_${previousScheduleID}`;
		}
		else
		{
			return `${studentId}_StopID${tripStopId}_${anotherTripStopID}_${previousScheduleID}`;
		}
	}

	RoutingDataModel.prototype.changeAssignedStudentDay = function(studentId, requirementId, previousScheduleID, destinationDayValue, dayIndex, currentTripStop, anotherTripStopID, notAffectOtherStop)
	{
		var self = this;
		var key = this.getKey(studentId, requirementId, currentTripStop.id, anotherTripStopID, previousScheduleID);
		var tripStopEntities = self.studentsDictionary[key];
		if (tripStopEntities)
		{
			tripStopEntities.map(function(tripStopEntity)
			{
				var tripStopId = tripStopEntity.id;
				var student = self.getStudent(studentId, tripStopId, anotherTripStopID, requirementId, previousScheduleID);

				if (currentTripStop.id == tripStopId)
				{
					self.setStudentDayValue(dayIndex, destinationDayValue, student);
				}
				else if (!notAffectOtherStop)
				{
					self.setStudentDayValue(dayIndex, !destinationDayValue, student, true);
				}
			});

			self.routingStudentManager.refreshDictionary(true, [key]);
		}
	};

	RoutingDataModel.prototype.setStudentDayValue = function(dayIndex, destinationDayValue, student, notOperateStop)
	{
		var self = this;
		var dayAttrName = self.getWeekdayAttributeNameByIndex(dayIndex);
		if (student.IsAssigned && notOperateStop)
		{
			if (student['Valid' + dayAttrName] !== undefined && student['Valid' + dayAttrName] !== null && !student[dayAttrName])
			{
				student['Valid' + dayAttrName] = destinationDayValue;
			}
		}
		else
		{
			if (student[dayAttrName] !== undefined && student[dayAttrName] !== null)
			{
				student[dayAttrName] = destinationDayValue;
			}
			if (notOperateStop && student['Valid' + dayAttrName] !== undefined && student['Valid' + dayAttrName] !== null)
			{
				student['Valid' + dayAttrName] = destinationDayValue;
			}
		}
	};

	RoutingDataModel.prototype.validateDayOption = function(destinationDayValue, dayIndex, studentInfos, trip)
	{
		var self = this;
		function isDayValid(items, studentId, requirementId, previousScheduleID, dayAttrName)
		{
			for (var i = 0; i < items.length; i++)
			{
				if (items[i].id == studentId && items[i].RequirementId == requirementId && items[i].PreviousScheduleID == previousScheduleID)
				{
					return items[i][dayAttrName];
				}
			}
			return false;
		}
		if (!destinationDayValue)
		{
			return Promise.resolve();
		}
		var dayAttrName = self.getWeekdayAttributeNameByIndex(dayIndex);
		var params = self.getValidateStudentDayParam(studentInfos, trip);
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "studentvaliddays"), {
			paramData: params
		}).then(function(data)
		{
			if (data.Items.length < 1 || !isDayValid(data.Items, studentInfos[0].Id, studentInfos[0].RequirementId, studentInfos[0].PreviousScheduleID, dayAttrName))
			{
				tf.promiseBootbox.alert("The day you want to check for current student is already associated with another trip!");
				return Promise.reject();
			}
			return Promise.resolve();
		});
	};

	RoutingDataModel.prototype.lockRoutingStudent = function(lockInfo, student, tripStop, alert, trip)
	{
		var trips = trip ? [trip] : this.getEditTrips();
		var lockInfos = $.isArray(lockInfo) ? lockInfo : [lockInfo];
		var students = $.isArray(student) ? student : (student ? [student] : []);
		lockInfos = lockInfos.filter(l =>
		{
			return l.RequirementId;
		});

		students = students.filter(s =>
		{
			return s.RequirementID;
		});

		if (!trips || trips.length == 0 || lockInfos.length == 0)
		{
			return Promise.resolve();
		}

		if (students && students.length > 0)
		{
			students.forEach((student, i) =>
			{
				var lockInfo = {
					RequirementId: student.RequirementID,
					PreviousScheduleID: student.PreviousScheduleID,
					StudId: student.id,
					DBID: tf.datasourceManager.databaseId,
					FieldTripId: tripStop.FieldTripId,
					TripStopId: tripStop.id
				};
				RoutingDataModel.weekdays.forEach(function(weekday)
				{
					lockInfo[weekday] = student[weekday];
				});

				lockInfos[i] = lockInfo;
			});

		}

		lockInfos = lockInfos.map((lockInfo) =>
		{
			return $.extend({
				RequirementId: 0,
				PreviousScheduleID: 0,
				StudId: 0,
				DBID: tf.datasourceManager.databaseId,
				FieldTripId: 0,
				TripStopId: 0,
				StartDate: trips && trips[0] && trips[0].StartDate,
				EndDate: trips && trips[0] && trips[0].EndDate,
				Sunday: false,
				Monday: false,
				Tuesday: false,
				Wednesday: false,
				Thursday: false,
				Friday: false,
				Saturday: false
			}, lockInfo);
		});

		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "RoutingStudentLockDatas"), {
			data: lockInfos
		}).then(function(data)
		{
			data.Items.forEach((lockData, index) =>
			{
				if (alert)
				{
					var changed = true;
					RoutingDataModel.weekdays.forEach(function(weekday)
					{
						if (lockInfos[index][weekday] != lockData[weekday])
						{
							changed = false;
						}
					});
					if (!changed)
					{
						tf.promiseBootbox.alert("The day you want to check for current student is already assigned!");
						return Promise.reject();
					}
				}
			});

			return data.Items;
		});
	};

	/**
	* unlock routing student when not assign
	*/
	RoutingDataModel.prototype.unLockRoutingStudentByUnAssign = function(studentsTripStops)
	{
		var trips = this.getEditTrips();
		var lockInfos = [];
		studentsTripStops.forEach((studentsTripStop) =>
		{
			var tripStop = studentsTripStop.tripStop;
			studentsTripStop.students.forEach((student) =>
			{
				if (!student.RequirementID)
				{
					return;
				}

				var lockInfo = {
					RequirementId: student.RequirementID,
					PreviousScheduleID: student.PreviousScheduleID,
					DBID: tf.datasourceManager.databaseId,
					StudId: student.id,
					FieldTripId: tripStop.FieldTripId,
					StartDate: trips && trips[0] && trips[0].StartDate,
					EndDate: trips && trips[0] && trips[0].EndDate,
					TripStopId: tripStop.id
				};
				lockInfos.push(lockInfo);
			});
		});

		return tf.promiseAjax.put(pathCombine(tf.api.apiPrefix(), "RoutingStudentLockDatas"), {
			data: lockInfos
		});
	};

	/**
	* unlock routing student when close trip
	*/
	RoutingDataModel.unLockRoutingStudentByTrip = function(tripId)
	{
		return tf.promiseAjax.delete(pathCombine(tf.api.apiPrefix(), "RoutingStudentLockDatas"), {
			paramData: { tripId: tripId }
		});
	};

	RoutingDataModel.prototype.getWeekdayAttributeNameByIndex = function(dayIndex)
	{
		return RoutingDataModel.weekdays[dayIndex];
	};

	RoutingDataModel.prototype.getValidateStudentDayParam = function(studentInfos, trip)
	{
		var dayOption = {
			Monday: trip.Monday,
			Tuesday: trip.Tuesday,
			Wednesday: trip.Wednesday,
			Thursday: trip.Thursday,
			Friday: trip.Friday,
			Saturday: trip.Saturday,
			Sunday: trip.Sunday,
			StartDate: trip.StartDate,
			EndDate: trip.EndDate,
			StudentsInfo: studentInfos
		};
		if (trip)
		{
			dayOption = $.extend(dayOption, { FieldTripId: trip.id });
		}
		return dayOption;
	};

	RoutingDataModel.prototype.getVRPSetting = function()
	{
		return {
			capacity: tf.storageManager.get("vrpCapacityChange"),
			totalDistance: tf.storageManager.get("vrpMaxTripDistanceChange"),
			ridingTime: tf.storageManager.get("vrpMaxRidingTimeChange"),
			totalTime: tf.storageManager.get("vrpMaxTripTimeChange")
		};
	};

	RoutingDataModel.prototype.changeDataStackChange = function()
	{
		var self = this;
		self.getChangedTrips().forEach(function(trip)
		{
			// self.viewModel.analyzeTripByDistrictPolicy.analyze(trip);
		});
	};

	RoutingDataModel.prototype.getSyncEditTripStopsCount = function(data)
	{
		var self = this;
		if (self.getEditTrips().length > 0)
		{
			this.tripEditBroadcast.addNeedEditWindow(data.key);
			if (data.changeType == TF.RoutingMap.RoutingPalette.TripEditBroadcast.changeType.create)
			{
				this.geoLinkTool.getGeoLinkedData(data).then(function()
				{
					self.syncEditTripStopsData = data;
					var editTripStops = self.geoLinkTool.getEditGeoLinkedData(data);
					self.tripEditBroadcast.setEditTripStop(editTripStops, data.key);
				});
			} else
			{
				this.geoLinkTool.getGeoLinkedData(data).then(function()
				{
					self.syncEditTripStopsData = data;
					var editTripStops = self.geoLinkTool.getEditGeoLinkedData(data);
					self.tripEditBroadcast.setEditTripStop(editTripStops, data.key);
				});
			}
		}
	};

	RoutingDataModel.prototype.confirmSyncEditTripStops = function(tripStops, type)
	{
		var self = this;
		if (tripStops.length == 0)
		{
			return;
		}
		tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.SelectTripStopModalViewModel(tripStops, type, true))
			.then(function(tripStops)
			{
				if (!tripStops || tripStops.length == 0)
				{
					return;
				}
				self.tripEditBroadcast.syncEditTripStops(tripStops);
			});
	};

	RoutingDataModel.prototype.syncEditTripStops = function(tripStops)
	{
		var self = this;
		self.geoLinkTool.syncGeoLinkedData(this.syncEditTripStopsData, tripStops.map(function(stop) { return stop.id; }));
	};

	RoutingDataModel.prototype.isMidTrip = function()
	{
		var editTrips = this.getEditTrips();
		return editTrips.length > 0 ? editTrips[0].Session == TF.Helper.TripHelper.Sessions.Both : false;
	};

	// RoutingDataModel.prototype.districtPolicyChange = function()
	// {
	// 	this.setLoadTimeSettings().then(() =>
	// 	{
	// 		var trips = this.getEditTrips();
	// 		var candidateStudentDict = {};
	// 		var originalStudentsDict = {};
	// 		this.candidateStudents.forEach(student =>
	// 		{
	// 			if (!candidateStudentDict[student.id])
	// 			{
	// 				candidateStudentDict[student.id] = [];
	// 			}
	// 			candidateStudentDict[student.id].push(student);
	// 		});

	// 		trips.forEach((trip) =>
	// 		{
	// 			trip.originalStudents.forEach(student =>
	// 			{
	// 				if (!originalStudentsDict[student.id])
	// 				{
	// 					originalStudentsDict[student.id] = [];
	// 				}
	// 				originalStudentsDict[student.id].push(student);
	// 			});
	// 		});

	// 		return this.recalculate(trips).then((response) =>
	// 		{
	// 			trips.forEach((trip) =>
	// 			{
	// 				var tripData = Enumerable.From(response).FirstOrDefault(null, function(c) { return c.id == trip.id; });
	// 				for (var j = 0; j < trip.FieldTripStops.length; j++)
	// 				{
	// 					trip.FieldTripStops[j].TotalStopTime = tripData.FieldTripStops[j].TotalStopTime;
	// 					trip.FieldTripStops[j].Duration = tripData.FieldTripStops[j].Duration;
	// 					trip.FieldTripStops[j].Students.forEach((student, k) =>
	// 					{
	// 						student.LoadTime = tripData.FieldTripStops[j].Students[k].LoadTime;
	// 						(candidateStudentDict[student.id] || []).concat(originalStudentsDict[student.id] || []).forEach((c) =>
	// 						{
	// 							c.LoadTime = student.LoadTime;
	// 						});
	// 					});
	// 				}
	// 			});
	// 			this.setActualStopTime(trips);
	// 			this.onTripsChangeEvent.notify({ add: [], edit: trips, delete: [], isAfterDistrictPolicyChanged: true });
	// 		});
	// 	});
	// };

	RoutingDataModel.prototype._getFeatureFieldTripStops = function(fieldTripStops, features)
	{
		var featureStops = fieldTripStops.map((stop) => {
			var feature = features.find(feature => feature.strings.some((str => str.stringType == "esriDSTStreetName" && str.string == stop.Street)) && 
													feature.attributes.maneuverType == "esriDMTStop");
			if (feature)
			{
				feature.Sequence = stop.Sequence - 1;
				return feature;
			}
		});
		
		return featureStops.filter(featureStop => !!featureStop);
	}

	RoutingDataModel.prototype.recalculateStopTime = function(directions, fieldTripStops)
	{
		var stopTimeFormat = "YYYY-MM-DDTHH:mm:ss";
		var totalDuration = 0;
		var totalDistance = 0;

		var features = directions.features.map((item, index) => {

			totalDuration += item.attributes.time;
			totalDistance += item.attributes.length * 1.60934; // from miles to km

			item.attributes.totalDuration = totalDuration;
			item.attributes.totalDistance = totalDistance;

			return { 
				attributes: item.attributes, 
				strings: directions.strings[index] 
			}
		});

		var featureStops = this._getFeatureFieldTripStops(fieldTripStops, features);

		if(featureStops.length >= 1)
		{
			for (var i = 0; i < featureStops.length; ++i)
			{
				const stop = fieldTripStops.find(stop => stop.Sequence == featureStops[i].Sequence);
				const currDuration = featureStops[i] ? featureStops[i].attributes.totalDuration : totalDuration;
				const currDistance = featureStops[i] ? featureStops[i].attributes.totalDistance : totalDistance;
				const pauseDuration = moment.duration(moment(stop.StopTimeDepart).diff(moment(stop.StopTimeArrive))).asMinutes();

				if(i == 0)
				{
					const currDurationMoment = moment.duration(currDuration,'minute');

					stop.Duration = moment.utc(currDurationMoment.asMilliseconds()).format("HH:mm:ss");
					stop.Travel = moment.utc(currDurationMoment.add(pauseDuration, 'minute').asMilliseconds()).format("HH:mm:ss");
					stop.Distance = currDistance;
					stop.Speed = currDistance / currDurationMoment.asHours();
				}
				else
				{
					const subDuration = currDuration - featureStops[i - 1].attributes.totalDuration;
					const subDistance = currDistance - featureStops[i - 1].attributes.totalDistance;
					const subDurationMoment = moment.duration(subDuration, 'minute');

					stop.Duration = moment.utc(subDurationMoment.asMilliseconds()).format("HH:mm:ss");
					stop.Travel = moment.utc(subDurationMoment.add(pauseDuration, 'minute').asMilliseconds()).format("HH:mm:ss");
					stop.Distance = subDistance;
					stop.Speed = subDurationMoment.asHours() > 0 ? subDistance / subDurationMoment.asHours() : 0;

					const stopTimeArriveDuration = moment(fieldTripStops[i - 1].StopTimeDepart).add(moment.duration(fieldTripStops[i - 1].Duration));
					stop.StopTimeArrive = stopTimeArriveDuration.format(stopTimeFormat);
					
					if(!stop.PrimaryDestination && !stop.PrimaryDeparture)
					{
						stop.StopTimeDepart = stopTimeArriveDuration.add(Math.ceil(pauseDuration), "minutes").format(stopTimeFormat);
					}
				}
			}
		}

		return fieldTripStops;
	}

	RoutingDataModel.prototype.dispose = function()
	{
		this.tripLockData.unLockCurrentDocument();
		this.onTripsChangeEvent.unsubscribeAll();
		this.tripEditBroadcast.dispose();
		this.onCandidatesStudentsChangeToMapEvent.unsubscribeAll();
		this.onAssignStudentsChangeEvent.unsubscribeAll();
		this.onAssignStudentsChangeToMapEvent.unsubscribeAll();
		this.onTripColorChangeEvent.unsubscribeAll();
		this.onChangeTripVisibilityEvent.unsubscribeAll();
		this.onWalkTSRestrictionChangeEvent.unsubscribeAll();
		// this.streetDataModel.onStreetModifyEvent.unsubscribe(this.onStreetModifyEvent);
		this.onShowChartChangeEvent.unsubscribeAll();
		this._viewModal.onUpdateRecordsEvent.unsubscribe(this.onSchoolLocationDataSourceChange);
		this.onSchoolLocationChangeEvent.unsubscribeAll();
		this.routingStudentManager.dispose();
		PubSub.unsubscribe(this.setUserProfileTripColor);
		PubSub.unsubscribe(this.stopPathChange);
		// PubSub.unsubscribe(this.districtPolicyChange);
		this.schoolLockData.dispose();
		this.tripLockData.dispose();
		tfdispose(this);
	};

	RoutingDataModel.isSchoolsEqual = function(currentSchools, originalSchools)
	{
		if (!currentSchools || !originalSchools) { return false; }
		return currentSchools.replace(/\s/g, "").replace(/,/g, "!").split("!").filter(function(c) { return c; }).sort().join() == originalSchools.replace(/\s/g, "").replace(/,/g, "!").split("!").filter(function(c) { return c; }).sort().join();
	};

	RoutingDataModel.checkCriteria = function(tripA, tripB)
	{
		return tripA.Session == tripB.Session
			&& RoutingDataModel.isSchoolsEqual(tripA.Schools, tripB.Schools)
			&& !!tripA.BusAide == !!tripB.BusAide
			&& tripA.Disabled == tripB.Disabled
			&& (tripA.FilterName || "") == (tripB.FilterName || "")
			&& tripA.NonDisabled == tripB.NonDisabled
			&& tripA.Monday == tripB.Monday
			&& tripA.Tuesday == tripB.Tuesday
			&& tripA.Wednesday == tripB.Wednesday
			&& tripA.Thursday == tripB.Thursday
			&& tripA.Friday == tripB.Friday
			&& tripA.Saturday == tripB.Saturday
			&& tripA.Sunday == tripB.Sunday
			&& tripA.StartDate == tripB.StartDate
			&& tripA.EndDate == tripB.EndDate
			&& (tripA.FilterSpec || "") == (tripB.FilterSpec || "")
			&& tripA.TravelScenarioId == tripB.TravelScenarioId;
	};

	RoutingDataModel.checkFieldTripCriteria = function(tripA, tripB)
	{
		return true;
	};

	RoutingDataModel.prototype.copyFieldTrip = function(newTrip)
	{
		var self = this;
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), tf.DataTypeHelper.getEndpoint("FieldTrip")), {
			paramData: {
				copyFromId: newTrip.Id,
				fieldTripName: newTrip.Name
			}
		})
		.then(function(response)
		{
			if (response && response.StatusCode === 404)
			{//change the api side to avoid http error, using response status 404 to identify the nonexistence.
				return Promise.reject(response);
			}
			self.showSaveSuccessToastMessage();
			return true;
		}.bind(self))
		.catch(function(response)
		{
			if (response && response.StatusCode === 412)
			{
				tf.promiseBootbox.alert(
					{
						message: response.Message,
						title: "Error"
					});		
				return Promise.reject(response);
			}

			if (response && response.StatusCode === 404)
			{
				return Promise.reject(response);
			}
		}.bind(self));
	}

	RoutingDataModel.sessions = [
		{ name: "To School", session: 0 },
		{ name: "From School", session: 1 },
		{ name: "Shuttle", session: 2 },
		{ name: "Both", session: 3 }
	];
})();


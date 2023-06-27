(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingStudentManager = RoutingStudentManager;

	function RoutingStudentManager(dataModel)
	{
		this.dataModel = dataModel;
		this.students = {};
		this.candidates = {};
		this.studentIdDictionary = {};
		this.oidMapping = {};
		this.schoolStopDictionary = {};
		this.lockStudents = [];
		this.tripAvailableWeekdays = [true, true, true, true, true, true, true];
		this.studentPUDOStatus = {};// used to store each student PU/DO status when mid trip
		this.manualChangedStudentStatus = {};// used to store the students' PU/DO status if a student has ever been manually toggled when mid trip
	}
	var weekdays = TF.RoutingMap.RoutingPalette.RoutingDataModel.weekdays;

	RoutingStudentManager.prototype.refresh = function(students, reset)
	{
		this.refreshStudent(reset);
		this.refreshDictionary(null, this._getKeys(students));
	};

	RoutingStudentManager.prototype.refreshStudent = function(reset)
	{
		this.tripAvailableWeekdays = this.getAvailableWeekdaysByTripDataRange();
		this.calculateStudentStatus(reset);
		this.refreshCandidates();
		this.refreshAssignStudents();
	};

	RoutingStudentManager.prototype.getAvailableWeekdaysByTripDataRange = function(trip)
	{
		var tripAvailableWeekdays = [true, true, true, true, true, true, true];
		if (!trip)
		{
			var trips = this.dataModel.getEditTrips();
			if (trips.length == 0)
			{
				return tripAvailableWeekdays;
			}
			trip = trips[0];
		}
		var startDate = trip.StartDate,
			endDate = trip.EndDate;

		if (startDate && endDate)
		{
			var day = moment(startDate), end = moment(endDate);
			for (var i = 0; i < 7; i++)
			{
				var index = day.weekday() == 0 ? 6 : (day.weekday() - 1);
				tripAvailableWeekdays[index] = false;
				if (day <= end)
				{
					tripAvailableWeekdays[index] = true;
				}
				day = day.add(1, 'd');
			}
		}
		return tripAvailableWeekdays;
	};

	RoutingStudentManager.prototype.calculateStudentPUDOStatus = function()
	{
		var self = this;
		if (this.dataModel.getSession() != 3) return;
		self.studentPUDOStatus = {};

		self.dataModel.trips.forEach(function(trip)
		{
			trip.TripStops.forEach(function(stop)
			{
				stop.Students.forEach(function(student)
				{
					if (!self.studentPUDOStatus[student.id])
					{
						self.studentPUDOStatus[student.id] = {
							Session: {},
						};
					}

					self.studentPUDOStatus[student.id].Session[trip.id] = student.Session;
				});
			});
		});

		for (var key in self.manualChangedStudentStatus)
		{
			for (var tripId in self.manualChangedStudentStatus[key].Session)
			{
				if (!self.studentPUDOStatus[key])
				{
					self.studentPUDOStatus[key] = {
						Session: {},
					};
				}
				self.studentPUDOStatus[key].Session[tripId] = self.manualChangedStudentStatus[key].Session[tripId];
			}
		}
	};

	RoutingStudentManager.prototype.getAvailableSession = function(student, tripId, tripStop)
	{
		var self = this;
		var availableSession = [];

		this.studentIdDictionary[student.id].forEach(function(key)
		{
			var studentInfo = self.students[key];
			if (studentInfo.XCoord == (student.XCoord || student.Xcoord) && studentInfo.YCoord == (student.YCoord || student.Ycoord) && availableSession.indexOf(studentInfo.Session) < 0)
			{
				tripStop = !!tripStop ? self.dataModel.getTripStopByStopId(tripStop.id) : null;
				if (!!tripStop)
				{
					var trip = self.dataModel.getTripById(tripStop.TripId);
					var hasAttendanceSchool = Enumerable.From(trip.TripStops).Any(function(c) { return c.SchoolCode == studentInfo.SchoolCode; });
					var validAttendanceSchoolStops = Enumerable.From(trip.TripStops).Where(function(c) { return c.SchoolCode == studentInfo.SchoolCode && (studentInfo.Session == 0 ? c.Sequence > tripStop.Sequence : c.Sequence < tripStop.Sequence); });
					var validTransSchoolStops = Enumerable.From(trip.TripStops).Where(function(c) { return c.SchoolCode && c.SchoolCode != studentInfo.TransSchoolCode && (studentInfo.Session == 0 ? c.Sequence > tripStop.Sequence : c.Sequence < tripStop.Sequence); });
					if ((hasAttendanceSchool && validAttendanceSchoolStops.length == 0) || (!hasAttendanceSchool && validTransSchoolStops.length == 0))
					{
						return;
					}
				}

				if (studentInfo.isCandidate)
				{
					availableSession.push(studentInfo.Session);
				} else if (self._findAssignWeekDaysByTripId(studentInfo.assignWeekdays, tripId))
				{
					availableSession.push(studentInfo.Session);
				}
			}
		});

		return availableSession;
	};

	RoutingStudentManager.prototype.getStudentPUDOStatusByTripId = function(student, tripId)
	{
		if (this.dataModel.getSession() == 3)
		{
			if (this.studentPUDOStatus[student.id] && typeof this.studentPUDOStatus[student.id].Session[tripId] != "undefined")
			{
				return this.studentPUDOStatus[student.id].Session[tripId];
			}
			var stops = this.dataModel.studentsDictionary[this._getKey(student)];
			if (stops)
			{
				for (var i = 0; i < stops.length; i++)
				{
					if (stops[i].tripId == tripId)
					{
						var availableSessions = this.getAvailableSession(student, tripId, stops[i]).sort();
						if (availableSessions.length > 0)
						{
							return availableSessions[0];
						}
					}
				}
			}
			availableSessions = this.getAvailableSession(student, tripId).sort();
			if (availableSessions.length > 0)
			{
				return availableSessions[0];
			}
		}
		return student.Session;
	};

	RoutingStudentManager.prototype.getStudentPUDOStatusInTrip = function(student, tripId)
	{
		if (this.dataModel.getSession() == 3)
		{
			if (this.studentPUDOStatus[student.id] && typeof this.studentPUDOStatus[student.id].Session[tripId] != "undefined")
			{
				return this.studentPUDOStatus[student.id].Session[tripId];
			}
		}
		return null;
	};

	RoutingStudentManager.prototype.calculateStudentStatus = function(reset)
	{
		if (reset)
		{
			this.dataModel.candidateStudents = this.dataModel.candidateStudents.filter(s => s.RequirementID || s.IsAssigned);
		}

		let assignStudents = [], originalStudents = [], assignedStudentMap = {};
		this.students = {};
		this.candidates = {};
		this.dataModel.trips.forEach(trip =>
		{
			originalStudents = originalStudents.concat(trip.originalStudents || []);
			trip.TripStops.forEach(tripStop =>
			{
				assignStudents = assignStudents.concat(tripStop.Students.map(student =>
				{
					this.dataModel.calculateStudentTravelTime(student, tripStop, trip.TripStops);
					student.TripID = trip.id;
					student.TripStopID = tripStop.id;
					student.Color = trip.color;
					student.IsAssigned = true;
					assignedStudentMap[this._getKey(student)] = true;
					return student;
				}));
			});
		});

		this.dataModel.candidateStudents.forEach(student =>
		{
			if (student.RequirementID || (!student.RequirementID && student.AnotherTripStopID))
			{
				let key = this._getKey(student);
				this.candidates[key] = student;
				this._setByCandidateStudent(student);
				if (assignedStudentMap[key])
				{
					student.IsAssigned = true;
				}
			}
		});

		originalStudents.forEach(student =>
		{
			this._setByStopStudent(student);
		});

		assignStudents.forEach(student =>
		{
			this._setByAssignStudent(student);
		});

		this._calculateProperty();
		this._refreshStudentIdDictionary();
	};

	RoutingStudentManager.prototype._refreshStudentIdDictionary = function()
	{
		this.studentIdDictionary = {};
		for (var key in this.students)
		{
			if (!this.studentIdDictionary[this.students[key].id])
			{
				this.studentIdDictionary[this.students[key].id] = [];
			}
			this.studentIdDictionary[this.students[key].id].push(key);
		}
	};

	RoutingStudentManager.prototype._calculateProperty = function()
	{
		var candidateStudentsKey = _.keyBy(this.dataModel.candidateStudents, function(c)
		{
			return c.RequirementID + "-" + c.PreviousScheduleID;
		});
		for (var key in this.students)
		{
			var student = this.students[key];
			var isAllAssigned = true;
			var isNeverAssigned = true;

			student.oid = this.oidMapping[key];
			student.key = key;

			student.availableWeekdays.forEach(function(day, index)
			{
				if (day)
				{
					if (student.assignWeekdays[index].length == 0)
					{
						isAllAssigned = false;
					} else
					{
						isNeverAssigned = false;
					}
				}
			});
			student.isAllAssigned = isAllAssigned;
			student.isAnyAssigned = student.tripStops.length > 0;
			student.isCandidate = this.candidates[key] && (student.NotInCriteriaUnassigned || student.InCriteriaUnassigned) && !isAllAssigned;
			student.isShowOnCandidateMap = this.candidates[key] && student.XCoord && isNeverAssigned && student.tripStops.length == 0;

			if (!student.geometry)
			{
				student.geometry = TF.xyToGeometry(student.XCoord, student.YCoord);
			}

			var existInCandidate = candidateStudentsKey[student.RequirementID + "-" + student.PreviousScheduleID];
			if (student.isCandidate && !existInCandidate)
			{
				var inCriteriaUnassigned = this.dataModel.trips[0].Schools.indexOf(student.SchoolCode) >= 0;
				this.dataModel.candidateStudents.push($.extend(this._copyStudent(student), {
					IsAssigned: false,
					CrossToStop: null,
					WalkToStopDistance: 0,
					WalkToStopDistanceWarning: false,
					InCriteriaUnassigned: inCriteriaUnassigned,
					NotInCriteriaUnassigned: !inCriteriaUnassigned
				}));
				candidateStudentsKey[student.RequirementID + "-" + student.PreviousScheduleID] = true;
			}
		}
	};

	RoutingStudentManager.prototype._setByCandidateStudent = function(student)
	{
		var stud = this.createOrGet(student, null, this.tripAvailableWeekdays);
		stud.assignWeekdays = [[], [], [], [], [], [], []];
		return stud;
	};

	RoutingStudentManager.prototype._setByStopStudent = function(student)
	{
		var stud = this.createOrGet(student, null, this.tripAvailableWeekdays);
		return stud;
	};

	RoutingStudentManager.prototype._setByAssignStudent = function(student)
	{
		var stud = this._setByStopStudent(student);
		var assignInfo = {
			TripID: student.TripID,
			TripStopID: student.TripStopID,
			AnotherTripStopID: student.AnotherTripStopID,
			Color: student.Color,
			TotalTime: student.TotalTime,
			TransStopTime: student.TransStopTime,
			CrossToStop: student.CrossToStop,
			WalkToStopDistance: student.WalkToStopDistance,
			WalkToStopDistanceWarning: student.WalkToStopDistanceWarning,
			IsValid: student.IsValid
		};
		([student.Monday, student.Tuesday, student.Wednesday, student.Thursday, student.Friday, student.Saturday, student.Sunday])
			.forEach(function(item, index)
			{
				if (item)
				{
					stud.assignWeekdays[index].push(assignInfo);
					stud.availableWeekdays[index] = true;
				}
			});
		stud.tripStops.push(assignInfo);
		stud.color = student.Color;
	};

	RoutingStudentManager.prototype._getStudentStruct = function()
	{
		return $.extend(this._normalProperties(), this._selfProperties());
	};

	RoutingStudentManager.prototype._normalProperties = function()
	{
		return {
			id: 0,
			RequirementID: 0,
			PreviousScheduleID: 0,
			LastName: "",
			FirstName: "",
			Grade: "",
			LoadTime: "",
			WalkToStopDistance: 0,
			WalkToStopDistanceWarning: false,
			ProhibitCross: "",
			SchoolCode: "",
			DOSchoolCode: "",
			DOSchoolID: -1,
			PUSchoolCode: "",
			PUSchoolID: -1,
			TransSchoolCode: "",
			TransSchoolID: 0,
			SchoolId: "",
			XCoord: "",
			YCoord: "",
			Address: "",
			Session: 0,
			IsTotalMatch: true,
			InCriteriaScheduledElsewhere: false,
			InCriteriaUnassigned: true,
			NotInCriteriaScheduledElsewhere: false,
			NotInCriteriaUnassigned: false,
			geometry: null,
			type: "student",
			RequirementType: 0,
			RequirementStartDate: null,
			RequirementEndDate: null,
			RequirementDays: null
		};
	};

	RoutingStudentManager.prototype._selfProperties = function()
	{
		return {
			availableWeekdays: [false, false, false, false, false, false, false],// start from monday
			assignWeekdays: [[], [], [], [], [], [], []],
			tripStops: [],
			isShowOnCandidateMap: false,
			color: "#000000",
			isAllAssigned: false,
			isAnyAssigned: false,
			isCandidate: false
		};
	};

	RoutingStudentManager.prototype.createOrGet = function(student, dictionary, tripAvailableWeekdays)
	{
		dictionary = dictionary || this.students;
		var stud = dictionary[this._getKey(student)];
		var normalProperties = this._normalProperties();
		if (!stud)
		{
			stud = this._getStudentStruct();
			stud.id = student.id;
			stud.RequirementID = student.RequirementID;
			if (!student.RequirementID)
			{
				stud.AnotherTripStopID = student.AnotherTripStopID;
				stud.StartDate = student.StartDate;
				stud.EndDate = student.EndDate;
			}
			stud.PreviousScheduleID = student.PreviousScheduleID;
			dictionary[this._getKey(student)] = stud;
		}
		for (var key in student)
		{
			if (normalProperties.hasOwnProperty(key))
			{
				if (key == "ProhibitCross")
				{
					stud[key] = stud[key] || student[key];
				} else
				{
					stud[key] = student[key];
				}
			}
		}

		var availableWeekdays = [];
		weekdays.forEach(function(item, index)
		{
			availableWeekdays[index] = tripAvailableWeekdays[index] && (student["Valid" + item] || stud.availableWeekdays[index]);
		});
		stud.availableWeekdays = availableWeekdays;
		return stud;
	};

	RoutingStudentManager.getKey = function(student)
	{
		if (student.RequirementID)
		{
			return `${student.id}_${student.RequirementID}_${student.PreviousScheduleID || 0}`;
		}
		else
		{
			return `${student.id}_StopID${student.TripStopID}_${student.AnotherTripStopID}_${student.PreviousScheduleID || 0}`;
		}
	};

	RoutingStudentManager.prototype._getKey = function(student)
	{
		return RoutingStudentManager.getKey(student);
	};

	RoutingStudentManager.prototype._getKeys = function(students)
	{
		var self = this;
		if (!students)
		{
			return null;
		}
		return students.map(function(student)
		{
			return self._getKey(student);
		});
	};

	RoutingStudentManager.prototype.getCandidates = function(tripId)
	{
		this.debounce(20, this.calculateStudentPUDOStatus);
		var candidateStudents = [];
		for (var key in this.students)
		{
			var student = this.students[key];
			if (student.isCandidate)
			{
				if (!tripId || student.Session == this.getStudentPUDOStatusByTripId(student, tripId))
				{
					candidateStudents.push(student);
				}
			}
		}
		return candidateStudents;
	};

	RoutingStudentManager.prototype.debounce = function(delay, action)
	{
		if (!this._delayFlag)
		{
			action.apply(this);
		}
		this._delayFlag = true;
		clearTimeout(this._debounceTimeout);
		this._debounceTimeout = setTimeout(function()
		{
			this._delayFlag = false;
		}.bind(this), delay);
	};

	RoutingStudentManager.prototype.getCandidatesOnMap = function()
	{
		this.calculateStudentStatus();
		var candidateStudents = [];
		for (var key in this.students)
		{
			var student = this.students[key];
			if (student.isShowOnCandidateMap)
			{
				candidateStudents.push(student);
			}
		}
		return candidateStudents;
	};

	RoutingStudentManager.prototype.getCandidateById = function(studentId, requirementID, previousScheduleID, exceptionStudent, isCalculateStudentStatus = true)
	{
		if (isCalculateStudentStatus)
		{
			this.calculateStudentStatus();
		}
		var student = this.students[this._getKey(requirementID ? {
			id: studentId,
			RequirementID: requirementID,
			PreviousScheduleID: previousScheduleID
		} : exceptionStudent)];

		if (student && (!requirementID || !student.isAllAssigned) && (!requirementID || student.NotInCriteriaUnassigned || student.InCriteriaUnassigned))
		{
			if (!requirementID)
			{
				student.AnotherTripStopID = exceptionStudent.AnotherTripStopID;
				student.TripStopID = exceptionStudent.TripStopID;
				student.startDate = exceptionStudent.startDate;
				student.endDate = exceptionStudent.endDate;
				student.assignWeekdays = exceptionStudent.assignWeekday || exceptionStudent.assignWeekdays || student.assignWeekdays;
				student.Monday = exceptionStudent.monday || exceptionStudent.Monday || false;
				student.Tuesday = exceptionStudent.tuesday || exceptionStudent.Tuesday || false;
				student.Wednesday = exceptionStudent.wednesday || exceptionStudent.Wednesday || false;
				student.Thursday = exceptionStudent.thursday || exceptionStudent.Thursday || false;
				student.Friday = exceptionStudent.friday || exceptionStudent.Friday || false;
				student.Saturday = exceptionStudent.saturday || exceptionStudent.Saturday || false;
				student.Sunday = exceptionStudent.sunday || exceptionStudent.Sunday || false;
				student.isSchoolStop = exceptionStudent.isSchoolStop || false;
			}
			return student;
		}
		return null;
	};

	RoutingStudentManager.prototype.getStudentRequirementIdsBySession = function(studentId, session)
	{
		var requirementIds = [];
		for (var key in this.students)
		{
			var student = this.students[key];
			if (student.id == studentId && student.Session == session && student.RequirementID)
			{
				requirementIds.push({ RequirementID: student.RequirementID, PreviousScheduleID: student.PreviousScheduleID });
			}
		}
		return requirementIds;
	};

	RoutingStudentManager.prototype.refreshCandidates = function()
	{
		var self = this;
		clearTimeout(self.candidateRefreshTimeout);
		self.candidateRefreshTimeout = setTimeout(function()
		{
			self._refreshCandidates();
		}, 10);
	};

	RoutingStudentManager.prototype._refreshCandidates = function()
	{
		var self = this;
		var candidateStudentsToShow = {};
		for (var key in this.students)
		{
			var student = this.students[key];
			if (student.isShowOnCandidateMap)
			{
				candidateStudentsToShow[key] = $.extend({}, student, { id: key, studId: student.id, criteriaStatus: self.getCriteriaStatus(student) });
			}
		}

		var drawTool = this.getUnassignedStudentDrawTool();
		var query = new tf.map.ArcGIS.Query();
		query.outFields = ["*"];
		drawTool._pointLayer.queryFeatures(query).then(function(featureSet)
		{
			if (self.dataModel.getEditTrips().length == 0)
			{
				return;
			}
			var deletes = [];
			var deleteArrows = [];
			var adds = [];
			var edits = [];
			var onMapStudents = featureSet.features;
			var onMapStudentsMapping = {};
			onMapStudents.forEach(function(student)
			{
				onMapStudentsMapping[student.attributes.id] = student;
				if (!candidateStudentsToShow[student.attributes.id])
				{
					deletes.push(student);
					deleteArrows.push({
						id: student.attributes.id.split("_")[0]
					});
				}
			});
			for (var key in candidateStudentsToShow)
			{
				if (!onMapStudentsMapping[key])
				{
					adds.push(candidateStudentsToShow[key]);
				}
				else if (candidateStudentsToShow[key].criteriaStatus != onMapStudentsMapping[key].attributes.criteriaStatus)
				{
					onMapStudentsMapping[key].attributes.criteriaStatus = candidateStudentsToShow[key].criteriaStatus;
					edits.push(onMapStudentsMapping[key]);
				}
			}

			drawTool._applyEditsForAdd(adds).then(function()
			{
				self.students && adds.forEach(function(add)
				{
					if (self.students[add.id]) self.students[add.id].oid = add.oid;
					self.oidMapping[add.id] = add.oid;
				});
			});
			if (deletes.length > 0 || edits.length > 0)
			{
				drawTool._pointLayer.applyEdits({ deleteFeatures: deletes, updateFeatures: edits });
			}
			if (deleteArrows.length > 0)
			{
				drawTool.clearArrow(deleteArrows);
			}

			self.dataModel.onCandidatesStudentsChangeToMapEvent.notify({ add: adds, edit: [], delete: deleteArrows });
		});
	};

	RoutingStudentManager.prototype.getCriteriaStatus = function(student)
	{
		if (!student)
		{
			return "-1";
		}
		else if (student.InCriteriaUnassigned)
		{
			return "0";
		}
		else if (student.InCriteriaScheduledElsewhere)
		{
			return "1";
		}
		else if (student.NotInCriteriaUnassigned)
		{
			return "2";
		}
		else if (student.NotInCriteriaScheduledElsewhere)
		{
			return "3";
		}

		return "-1";
	};

	RoutingStudentManager.prototype.getCandidatesForStop = function(tripStop)
	{
		var candidateStudents = [];
		for (var key in this.students)
		{
			var student = this.students[key];
			var candidate = this.canBeAssign(tripStop, student);
			if (candidate && tripStop.boundary.geometry && this._intersects(student.geometry, tripStop.boundary.geometry))
			{
				candidateStudents.push(student);
			}
		}
		return candidateStudents;
	};

	RoutingStudentManager.prototype.canBeAssign = function(tripStop, student)
	{
		student = this.students[this._getKey(student)];
		return student.Session == this.getStudentPUDOStatusByTripId(student, tripStop.TripId)
			&& (student.isCandidate || !student.RequirementID)
			&& !this._findAssignWeekDaysByStopId(student.assignWeekdays, tripStop.id);
	};

	RoutingStudentManager.prototype._findAssignWeekDaysByStopId = function(assignWeekdays, stopId)
	{
		for (var i = 0; i < assignWeekdays.length; i++)
		{
			for (var j = 0; j < assignWeekdays[i].length; j++)
			{
				if (assignWeekdays[i][j].TripStopID == stopId)
				{
					return assignWeekdays[i][j];
				}
			}
		}
	};

	RoutingStudentManager.prototype._findAssignWeekDaysByTripId = function(assignWeekdays, tripId)
	{
		for (var i = 0; i < assignWeekdays.length; i++)
		{
			for (var j = 0; j < assignWeekdays[i].length; j++)
			{
				if (assignWeekdays[i][j].TripID == tripId)
				{
					return assignWeekdays[i][j];
				}
			}
		}
	};

	/**
	* when assign student, set the available weekdays for the assigned student
	*/
	RoutingStudentManager.prototype.setWeekdaysForAssign = function(studentsTripStops)
	{
		var self = this;
		var lockInfos = [];
		studentsTripStops.forEach((studentsTripStop) =>
		{
			var students = studentsTripStop.students, tripStop = studentsTripStop.tripStop;
			var studentsInDictionary = self.dataModel.tripStopDictionary[tripStop.id];

			students.forEach(function(student)
			{
				var studentMap = self.students[self._getKey(student)];

				var studInDict = Enumerable.From(studentsInDictionary).FirstOrDefault(null, function(c) { return c.student.id == student.id && c.student.RequirementID == student.RequirementID && c.student.PreviousScheduleID == student.PreviousScheduleID; });

				studentMap.availableWeekdays.forEach(function(weekday, index)
				{
					if (!student.RequirementID)
					{
						student["Valid" + weekdays[index]] = weekday;
					}
					else if (studInDict)
					{
						// candidate in boundary
						student[weekdays[index]] = weekday && studInDict.student[weekdays[index]];
						student["Valid" + weekdays[index]] = weekday && studInDict.student["Valid" + weekdays[index]];
					}
					else
					{
						// not assigned
						student[weekdays[index]] = weekday && studentMap.assignWeekdays[index].length == 0;
						student["Valid" + weekdays[index]] = weekday && studentMap.assignWeekdays[index].length == 0;
					}

				});

				var lockInfo = {
					RequirementId: student.RequirementID,
					PreviousScheduleID: student.PreviousScheduleID,
					StudId: student.id,
					DBID: tf.datasourceManager.databaseId,
					TripId: tripStop.TripId,
					TripStopId: tripStop.id
				};

				weekdays.forEach(function(weekday)
				{
					lockInfo[weekday] = student[weekday];
				});

				lockInfos.push(lockInfo);
			});
		});

		return self.dataModel.lockRoutingStudent(lockInfos).then(function(lockInfo)
		{
			if (!lockInfo) return; // no lockinfo for exception stundent 
			studentsTripStops.forEach((studentsTripStop) =>
			{
				var students = studentsTripStop.students, tripStop = studentsTripStop.tripStop;

				students.forEach(function(student)
				{
					if (!student.RequirementID) return;// exception stundent 
					var tripStopsInDict = self.dataModel.studentsDictionary[self._getKey(student)];
					var studentMap = self.students[self._getKey(student)];
					var data = Enumerable.From(lockInfo).FirstOrDefault({}, function(c) { return c.RequirementId == student.RequirementID && c.TripStopId == tripStop.id && c.PreviousScheduleID == student.PreviousScheduleID; });
					weekdays.forEach(function(weekday)
					{
						student[weekday] = data[weekday];
					});

					studentMap.availableWeekdays.forEach(function(weekday, index)
					{
						// update valid weekdays of the same student in other stop
						tripStopsInDict.forEach(function(tripStopEntity)
						{
							if (tripStopEntity.id != tripStop.id)
							{
								var studentInTrip = self.dataModel.getStudent(student.id, tripStopEntity.id, student.AnotherTripStopID, student.RequirementID, student.PreviousScheduleID);

								if (studentInTrip)
								{
									// change other stop candidate student status
									if (tripStopEntity.canBeAssigned)
									{
										studentInTrip[weekdays[index]] = studentInTrip[weekdays[index]] && weekday && !student[weekdays[index]];
									}
									// change student valid status include candidate and assign students
									studentInTrip["Valid" + weekdays[index]] = studentInTrip[weekdays[index]] || (studentInTrip["Valid" + weekdays[index]] && weekday && !student[weekdays[index]]);
								}
							}
						});
					});
				});
			});
		});
	};

	RoutingStudentManager.prototype.setWeekdaysForUnassign = function(students, tripStop)
	{
		var self = this;
		students.forEach(function(student)
		{
			if (!student.RequirementID)
			{
				return;
			}

			var key = self._getKey(student);
			var tripStopsInDict = self.dataModel.studentsDictionary[key];
			var studentMap = self.students[key];

			// release assign weekday in candidate student
			self.dataModel.candidateStudents.filter(function(s)
			{
				return key == self._getKey(s);
			}).forEach(function(student)
			{
				studentMap.assignWeekdays.forEach(function(assignInfoList, index)
				{
					assignInfoList.forEach(function(assignInfo)
					{
						if (assignInfo.TripStopID && assignInfo.TripStopID == tripStop.id)
						{
							student["Valid" + weekdays[index]] = true;
						}
					});
				});
			});

			studentMap.availableWeekdays.forEach(function(weekday, index)
			{
				// update valid weekdays of the same student in other stop
				tripStopsInDict.map(function(tripStopEntity)
				{
					if (tripStopEntity.id != tripStop.id)
					{
						var studentInTrip = self.dataModel.getStudent(student.id, tripStopEntity.id, student.AnotherTripStopID, student.RequirementID, student.PreviousScheduleID);
						// studentInTrip[weekdays[index]] = weekday && student[weekdays[index]];
						if (!studentInTrip["Valid" + weekdays[index]] && !studentInTrip[weekdays[index]])
						{
							var released = Enumerable.From(studentMap.assignWeekdays[index]).Any(function(c) { return c.TripStopID == tripStop.id; });
							studentInTrip["Valid" + weekdays[index]] = (released || weekday) && student[weekdays[index]];
						}
					}
				});
			});

		});
	};

	RoutingStudentManager.prototype.refreshAssignStudents = function()
	{
		var self = this;
		var studentsToShow = {};
		var drawTool = this.dataModel.viewModel.drawTool;
		var onMapStudents = drawTool._studentLayer.graphics.items;
		var deletes = [];
		var adds = [];
		var studentGraphic = null;
		var onMapStudentsMapping = {};

		for (var key in this.students)
		{
			var student = this.students[key];
			if (student.isAnyAssigned && student.XCoord && student.RequirementID)
			{
				studentsToShow[key] = $.extend({}, student, { key: key });
			}
		}

		onMapStudents.forEach(function(student)
		{
			if (student.attributes)
			{
				onMapStudentsMapping[student.attributes.key] = student;
				if (!studentsToShow[student.attributes.key])
				{
					deletes.push(student);
				}
			}
		});

		var trips = this.dataModel.trips;
		var tripMapping = {};
		trips.forEach(function(trip)
		{
			tripMapping[trip.id] = trip;
		});
		for (key in studentsToShow)
		{
			student = studentsToShow[key];
			var visible = false;
			var studentSymbol = drawTool.symbol.getAssignedStudentSymbol();
			student.tripStops.forEach(function(day)
			{
				if (day.TripID)
				{
					visible = visible || tripMapping[day.TripID].visible;
					if (tripMapping[day.TripID].visible)
					{
						studentSymbol = drawTool.symbol.getAssignedStudentSymbol(self.dataModel.getColorByTripId(day.TripID));
					}
				}
			});
			var tripId = Enumerable.From(student.tripStops).Where(function(c) { return c.TripID; }).Select(function(c) { return c.TripID; }).Distinct().ToArray();
			var attributes = {
				dataModel: { id: student.id, FirstName: student.FirstName, LastName: student.LastName, RequirementID: student.RequirementID, PreviousScheduleID: student.PreviousScheduleID, type: "student", geometry: student.geometry },
				TripId: tripId,
				type: "student",
				key: key
			};

			studentGraphic = onMapStudentsMapping[key];
			if (!studentGraphic)
			{
				studentGraphic = new tf.map.ArcGIS.Graphic({
					geometry: student.geometry,
					symbol: studentSymbol,
					attributes: attributes
				});

				adds.push(studentGraphic);
			}
			else
			{
				if (studentGraphic.symbol.color.toString() != studentSymbol.color.toString())
				{
					studentGraphic.symbol = studentSymbol;
				}
				studentGraphic.attributes = attributes;
			}
			studentGraphic.visible = visible && drawTool._showAssignedStudents;
		}
		if (deletes.length > 0)
		{
			drawTool._studentLayer.removeMany(deletes);
		}
		if (adds.length > 0)
		{
			drawTool._studentLayer.addMany(adds);
		}
	};

	RoutingStudentManager.prototype.getUnassignedStudentDrawTool = function()
	{
		return this.dataModel.viewModel.viewModel.unassignedStudentViewModel.drawTool;
	};

	RoutingStudentManager.prototype.refreshDictionary = function(recalculate, refreshStudentKeys)
	{
		if (recalculate)
		{
			this.calculateStudentStatus();
		}
		var self = this;
		var tripStopDictionary = {};
		var studentsDictionary = {};
		var schoolStopDictionary = {};
		var remainDictionary = {};
		var key, data;

		// init remainDictionary to keep candidate student assign week setting
		for (key in self.dataModel.tripStopDictionary)
		{
			remainDictionary[key] = {};
			self.dataModel.tripStopDictionary[key].forEach(function(studentInfo)
			{
				if (studentInfo.student.isAllAssigned != true)
				{
					remainDictionary[key][self._getKey(studentInfo.student)] = studentInfo.student;
				}
			});
		}
		var stops = [];
		var studentCurrentValidDaysDictionary = {};
		this.dataModel.trips.forEach(function(trip)
		{
			trip.TripStops.forEach(function(tripStop)
			{
				tripStop.TotalStudentCount = 0;
				tripStop.AssignedStudentCount = 0;
				tripStopDictionary[tripStop.id] = [];
				stops.push(tripStop);
				tripStop.Students.forEach(function(student)
				{
					if (student.assignWeekdays)
					{
						if (!studentCurrentValidDaysDictionary[student.key])
						{
							studentCurrentValidDaysDictionary[student.key] = [];
							student.assignWeekdays.forEach(function(assignedDay, index)
							{
								studentCurrentValidDaysDictionary[student.key][index] = !student[weekdays[index]] && student["Valid" + weekdays[index]];
							});
						}
						else
						{
							student.assignWeekdays.forEach(function(assignedDay, index)
							{
								studentCurrentValidDaysDictionary[student.key][index] = studentCurrentValidDaysDictionary[student.key][index] && !student[weekdays[index]] && student["Valid" + weekdays[index]];
							});
						}
					}
				});
			});
		});

		var refreshStudents = this.students;

		// refresh specific students
		if (refreshStudentKeys && refreshStudentKeys.length > 0)
		{
			tripStopDictionary = self.dataModel.tripStopDictionary;
			studentsDictionary = self.dataModel.studentsDictionary;
			schoolStopDictionary = self.schoolStopDictionary;

			// remove the student from original dictionary
			for (key in tripStopDictionary)
			{
				for (var i = 0; i < tripStopDictionary[key].length; i++)
				{
					let student = tripStopDictionary[key][i].student;
					if (refreshStudentKeys.indexOf(self._getKey(student)) >= 0)
					{
						tripStopDictionary[key].splice(i, 1);
						i--;
					}
				}
			}

			for (key in schoolStopDictionary)
			{
				for (i = 0; i < schoolStopDictionary[key].length; i++)
				{
					let student = schoolStopDictionary[key][i].student;
					if (refreshStudentKeys.indexOf(self._getKey(student)) >= 0)
					{
						schoolStopDictionary[key].splice(i, 1);
						i--;
					}
				}
			}

			stops.forEach(stop => this.calculateStopStudentCount(stop, tripStopDictionary));
			refreshStudents = {};
			refreshStudentKeys.forEach(function(refreshStudentKey)
			{
				refreshStudents[refreshStudentKey] = self.students[refreshStudentKey];
			});
		}

		let needCalculateStops = {};
		for (key in refreshStudents)
		{
			var student = self.students[key];
			if (!student) continue;
			studentsDictionary[key] = [];
			var studentStopDictionary = TF.toMapping(student.tripStops, function(c) { return c.TripStopID; });

			stops.forEach(function(tripStop)
			{
				var isTransferStudent = (student.TransSchoolCode == tripStop.SchoolCode && tripStop.SchoolCode !== null && tripStop.SchoolCode !== undefined);
				if (studentCurrentValidDaysDictionary[key] && student.assignWeekdays)
				{
					student.availableWeekdays = [];
					weekdays.forEach(function(item, index)
					{
						student.availableWeekdays[index] = studentCurrentValidDaysDictionary[key][index] || Enumerable.From(student.assignWeekdays[index]).Any(function(c) { return c.TripStopID == tripStop.id || c.AnotherTripStopID == tripStop.id; });
					});
				}
				var assignedToThisStop = studentStopDictionary[tripStop.id];
				const hasBoundary = tripStop.boundary && tripStop.boundary.geometry;
				// assigned
				if (assignedToThisStop) 
				{
					needCalculateStops[tripStop.id] = tripStop;
					studentsDictionary[key].push({ id: tripStop.id, tripId: tripStop.TripId, canBeAssigned: false, IsAssigned: true, schoolStopId: assignedToThisStop.AnotherTripStopID });
					var stud = $.extend(self._copyStudent(student, tripStop, true), {
						TripStopID: tripStop.id,
						AnotherTripStopID: assignedToThisStop.AnotherTripStopID,
						IsAssigned: true,
						TripID: tripStop.TripId,
						TotalTime: assignedToThisStop.TotalTime,
						TransStopTime: assignedToThisStop.TransStopTime,
						CrossToStop: assignedToThisStop.CrossToStop,
						WalkToStopDistance: assignedToThisStop.WalkToStopDistance,
						WalkToStopDistanceWarning: assignedToThisStop.WalkToStopDistanceWarning,
						IsValid: assignedToThisStop.IsValid
					});
					data = {
						student: stud, canBeAssigned: false
					};
					if (tripStopDictionary[tripStop.id]) tripStopDictionary[tripStop.id].push(data);
					self._pushToSchoolStopDictionary(schoolStopDictionary, assignedToThisStop.AnotherTripStopID, data);
				}
				// candidates
				else if (self.candidates[key]
					&& (student.NotInCriteriaUnassigned || student.InCriteriaUnassigned || !student.requirementID)
					&& self.getStudentPUDOStatusByTripId(student, tripStop.TripId) == student.Session
					&& tripStop.OpenType == 'Edit'
					&& (hasBoundary || isTransferStudent || (!student.requirementID && student.key.includes('_StopID') && self.candidates[key].TripStopID === tripStop.id)))
				{
					var intersects = tripStop.boundary.geometry && student.Session != 2 && self._intersects(student.geometry, tripStop.boundary.geometry);
					if (intersects || isTransferStudent || (!student.requirementID && student.key.includes('_StopID') && self.candidates[key].TripStopID === tripStop.id))
					{
						var trip = self.dataModel.getTripById(tripStop.TripId);
						var schoolStopIds = self.findSchoolStopIds(trip, tripStop, student);
						if (schoolStopIds.length !== 0)
						{
							var canAssign = !student.isAllAssigned;
							needCalculateStops[tripStop.id] = tripStop;
							studentsDictionary[key].push({ id: tripStop.id, tripId: tripStop.TripId, canBeAssigned: canAssign, IsAssigned: false, schoolStopId: schoolStopIds });
							var candidateStudent = $.extend(self._copyStudent(student, tripStop, false), {
								IsAssigned: false,
								CrossToStop: null,
								WalkToStopDistance: 0,
								WalkToStopDistanceWarning: false,
								AnotherTripStopID: 0,
								SchoolStopIds: schoolStopIds,
								TripStopID: tripStop.id,
								isAllAssigned: student.isAllAssigned
							});

							if (!student.RequirementID)
							{
								candidateStudent.AnotherTripStopID = student.AnotherTripStopID;
							}

							if (remainDictionary[tripStop.id] && remainDictionary[tripStop.id][self._getKey(candidateStudent)])
							{
								var remainInfo = remainDictionary[tripStop.id][self._getKey(candidateStudent)];
								candidateStudent.CrossToStop = remainInfo.CrossToStop;
								weekdays.forEach(function(name)
								{
									// week day do not valid should not keep assigned
									if (candidateStudent["Valid" + name])
									{
										candidateStudent[name] = remainInfo[name];
									}
								});
							}

							if (remainDictionary[tripStop.id] && typeof candidateStudent.CrossToStop != "boolean")
							{
								var otherStudent = Enumerable.From(Object.values(remainDictionary[tripStop.id])).FirstOrDefault(null,
									function(c) { return c.XCoord == student.XCoord && c.YCoord == student.YCoord && typeof c.CrossToStop == "boolean"; });
								if (otherStudent)
								{
									candidateStudent.CrossToStop = otherStudent.CrossToStop;
								}
							}

							data = {
								student: candidateStudent, canBeAssigned: canAssign
							};

							tripStopDictionary[tripStop.id].push(data);
							if (student.isCandidate || !student.RequirementID)
							{
								schoolStopIds.forEach(function(schoolStopId)
								{
									var candidateStudentCopy = $.extend(self._copyStudent(student, tripStop, false), {
										IsAssigned: false,
										CrossToStop: candidateStudent.CrossToStop,
										WalkToStopDistanceWarning: false,
										WalkToStopDistance: 0,
										AnotherTripStopID: 0,
										SchoolStopIds: schoolStopIds,
										TripStopID: tripStop.id,
									});
									weekdays.forEach(function(name)
									{
										candidateStudentCopy[name] = candidateStudent[name] && candidateStudentCopy[name];
									});
									var dataCopy = {
										student: candidateStudentCopy, canBeAssigned: canAssign
									};
									self._pushToSchoolStopDictionary(schoolStopDictionary, schoolStopId, dataCopy);
								});
							}
						}
					}
				}
			});
		}

		for (key in schoolStopDictionary)
		{
			schoolStopDictionary[key] = schoolStopDictionary[key].sort(function(a, b) { return a.student.LastName + a.student.FirstName > b.student.LastName + b.student.FirstName ? 1 : -1; });
		}

		this.dataModel.tripStopDictionary = tripStopDictionary;
		this.dataModel.studentsDictionary = studentsDictionary;
		this.schoolStopDictionary = schoolStopDictionary;
		Object.values(needCalculateStops).forEach(stop => this.calculateStopStudentCount(stop));
	};

	RoutingStudentManager.prototype.calculateStopStudentCount = function(tripStop, tripStopDictionary)
	{
		let students = {}, assignedStudents = {};
		(tripStop.Students || []).forEach(s =>
		{
			students[s.id] = true;
			if (s.IsAssigned && (s.RequirementID || !s.Expired))
			{
				assignedStudents[s.id] = true;
			}
		});

		tripStopDictionary = tripStopDictionary || this.dataModel.tripStopDictionary;
		let allStudents = tripStopDictionary[tripStop.id] || [];
		allStudents.filter(student => student.canBeAssigned).forEach(s =>
		{
			students[s.student.id] = true;
		});

		tripStop.TotalStudentCount = Object.keys(students).length;
		tripStop.AssignedStudentCount = Object.keys(assignedStudents).length;
	};

	RoutingStudentManager.prototype._pushToSchoolStopDictionary = function(schoolStopDictionary, schoolStopId, data)
	{
		let schoolStop = schoolStopDictionary[schoolStopId];
		if (!schoolStop)
		{
			schoolStop = [];
			schoolStopDictionary[schoolStopId] = schoolStop;
		}

		let schoolStudent = schoolStop.find(s => s.student.id === data.student.id);
		if (data.student.RequirementID || !schoolStudent || schoolStudent.student.RequirementID)
		{
			schoolStop.push(data);
			return;
		}

		schoolStudent.student.IsAssigned = data.student.IsAssigned;
	};

	RoutingStudentManager.prototype._intersects = function(point, polygon)
	{
		if (point && polygon)
		{
			return polygon.extent.intersects(point) && tf.map.ArcGIS.geometryEngine.intersects(point, polygon);
		}
		return false;
	};

	RoutingStudentManager.prototype._copyStudent = function(student, tripStop, setWeekDay)
	{
		var stud = {
			id: student.id,
			RequirementID: student.RequirementID,
			PreviousScheduleID: student.PreviousScheduleID,
			IsAssigned: true,
			CrossToStop: student.CrossToStop,
			LastName: student.LastName,
			FirstName: student.FirstName,
			Grade: student.Grade,
			LoadTime: student.LoadTime,
			WalkToStopDistance: student.WalkToStopDistance || 0,
			WalkToStopDistanceWarning: student.WalkToStopDistanceWarning,
			ProhibitCross: student.ProhibitCross,
			SchoolCode: student.SchoolCode,
			DOSchoolCode: student.DOSchoolCode,
			PUSchoolCode: student.PUSchoolCode,
			DOSchoolID: student.DOSchoolID,
			PUSchoolID: student.PUSchoolID,
			TransSchoolCode: student.TransSchoolCode,
			TransSchoolID: student.TransSchoolID,
			SchoolId: student.SchoolId,
			XCoord: student.XCoord,
			YCoord: student.YCoord,
			Address: student.Address,
			InCriteriaScheduledElsewhere: student.InCriteriaScheduledElsewhere,
			InCriteriaUnassigned: student.InCriteriaUnassigned,
			NotInCriteriaScheduledElsewhere: student.NotInCriteriaScheduledElsewhere,
			NotInCriteriaUnassigned: student.NotInCriteriaUnassigned,
			Session: student.Session,
			geometry: student.geometry
		};

		weekdays.forEach(function(name, index)
		{
			stud["Valid" + name] = student.availableWeekdays[index] && (!tripStop || student.assignWeekdays[index].length == 0 || Enumerable.From(student.assignWeekdays[index]).Any(function(c) { return c.TripStopID == tripStop.id; }));
			stud[name] = student.availableWeekdays[index] && student.assignWeekdays[index].length == 0;
		});

		if (setWeekDay)
		{
			student.assignWeekdays.forEach(function(items, index)
			{
				stud[weekdays[index]] = Enumerable.From(items).Any(function(c) { return c.TripStopID == tripStop.id; });
			});
		}

		return stud;
	};

	RoutingStudentManager.prototype.findSchoolStop = function(tripStop, student)
	{
		var schools = this.findSchoolStops(tripStop, student);
		if (schools.length == 0)
		{
			return { id: 0 };
		}
		return schools[0];
	};

	RoutingStudentManager.prototype.findSchoolStopIds = function(trip, tripStop, student)
	{
		var schools = this.findSchoolStops(tripStop, student, trip);
		return schools.length > 0 ? Enumerable.From(schools).Select(function(c) { return c.id; }).ToArray() : [];
	};

	RoutingStudentManager.prototype.findSchoolStops = function(tripStop, student, trip)
	{
		if (trip === null || trip === undefined)
		{
			trip = this.dataModel.getTripById(tripStop.TripId);
		}
		if (trip === null || trip === undefined)
		{
			return;
		}

		var hasDirectSchool = Enumerable.From(trip.TripStops).Any(function(c) { return c.SchoolCode == student.SchoolCode; });
		var hasValidTransSchool = Enumerable.From(trip.TripStops).Any(function(c) { return c.SchoolCode && c.SchoolCode != student.TransSchoolCode && (student.Session == 0 || student.Session == 2 ? c.Sequence > tripStop.Sequence : c.Sequence < tripStop.Sequence); });

		return Enumerable.From(trip.TripStops).Where(function(c)
		{
			var result = c.SchoolCode && ((!hasDirectSchool && hasValidTransSchool) || (c.SchoolCode == student.SchoolCode && (student.Session == 0 || student.Session == 2 ? c.Sequence > tripStop.Sequence : c.Sequence < tripStop.Sequence))) && (c.SchoolCode != student.TransSchoolCode);
			if (result)
			{
				if (student.Session == 0 || student.Session == 2)
				{
					return c.Sequence > tripStop.Sequence;
				}
				else if (student.Session == 1)
				{
					return c.Sequence < tripStop.Sequence;
				}
				return false;
			}

			return false;
		}).ToArray();
	};

	RoutingStudentManager.prototype.refreshStudentLock = function(clearAll)
	{
		var alreadyLockStudentsMap = {},
			allRequirementsMap = {},
			toLockStudents = [],
			toUnLockStudents = [];
		this.lockStudents.forEach(function(student)
		{
			alreadyLockStudentsMap[student.RequirementID] = true;
		});

		for (var key in this.students)
		{
			allRequirementsMap[this.students[key].RequirementID] = true;
			if (!alreadyLockStudentsMap[this.students[key].RequirementID] && this.students[key].XCoord)
			{
				toLockStudents.push(this.students[key]);
				this.lockStudents.push(this.students[key]);
			}
		}

		if (clearAll)
		{
			toUnLockStudents = toUnLockStudents.concat(this.lockStudents);
			this.lockStudents = [];
		}
		else
		{
			for (var i = 0; i < this.lockStudents.length; i++)
			{
				var student = this.lockStudents[i];
				if (!allRequirementsMap[student.RequirementID])
				{
					toUnLockStudents.push(student);
					this.lockStudents.splice(i, 1);
					i--;
				}
			}
		}

		var studentRequirementLockData = this.dataModel._getUnassignedStudentViewModel().dataModel.studentRequirementLockData;
		if (toLockStudents.length > 0)
		{
			studentRequirementLockData.lockIds(getStudentRequirementIds(toLockStudents));
			this.dataModel.getStudentLockData().lockIds(getStudentIds(toLockStudents));
		}
		if (toUnLockStudents.length > 0)
		{
			studentRequirementLockData.unLock(getStudentRequirementIds(toUnLockStudents));
			this.dataModel.getStudentLockData().unLock(getStudentIds(toUnLockStudents));
		}

		function getStudentRequirementIds(students)
		{
			return students.map(function(student)
			{
				return student.RequirementID;
			});
		}

		function getStudentIds(students)
		{
			return Enumerable.From(students.map(function(student)
			{
				return student.id;
			})).Distinct().ToArray();
		}
	};

	RoutingStudentManager.prototype.dispose = function()
	{
		this.refreshStudentLock(true);
		this.lockStudents = null;
		this.students = null;
		this.dataModel = null;
		this.oidMapping = null;
		this.schoolStopDictionary = null;
		this.studentPUDOStatus = null;
		this.manualChangedStudentStatus = null;
		clearTimeout(this.candidateRefreshTimeout);
		tfdispose(this);
	};
})();
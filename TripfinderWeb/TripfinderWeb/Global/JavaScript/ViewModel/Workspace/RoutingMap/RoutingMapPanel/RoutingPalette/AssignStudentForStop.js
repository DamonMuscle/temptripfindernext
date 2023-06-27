(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").AssignStudentForStop = AssignStudentForStop;

	var assignWeekdayInfos = {};

	function AssignStudentForStop(tripStopId, dataModel)
	{
		assignWeekdayInfos = {};
		var tripStop = dataModel.getTripStopByStopId(tripStopId);
		var trip = Enumerable.From(dataModel.trips).FirstOrDefault(null, function(c)
		{
			return c.id == tripStop.TripId;
		});

		var options = getOption(tripStop, trip, dataModel);

		tf.loadingIndicator.show();

		var unAssignedStudents = { geoStudents: [], ungeoStudents: [] };
		var assignStudents = [];
		unAssignedStudents.ungeoStudents = dataModel.routingStudentManager.getCandidates(trip.id).filter(function(student)
		{
			return student.XCoord == 0;
		});
		var dictionaryData = (dataModel.routingStudentManager.schoolStopDictionary[tripStopId] || [])
			.concat(dataModel.tripStopDictionary[tripStopId]);

		var addedKeys = {};

		dictionaryData.forEach(function(data)
		{
			var key = dataModel.routingStudentManager._getKey(data.student) + "_" + data.student.TripStopID;
			if (!addedKeys[key])
			{
				addedKeys[key] = true;
				if (data.student.IsAssigned)
				{
					assignStudents.push(data.student);
				} else if (data.canBeAssigned && !data.student.isAllAssigned && (data.student.XCoord || !data.student.RequirementID))
				{
					unAssignedStudents.geoStudents.push(data.student);
				}
			}
		});

		// geo but not assigned
		return dataModel.bindStudentCrossStatus(unAssignedStudents.geoStudents, tripStop).then(function()
		{
			var p1 = tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", tf.dataTypeHelper.getEndpoint("student")), {
				data: {
					"idFilter": {
						IncludeOnly: unAssignedStudents.geoStudents.map(function(student)
						{
							return student.id;
						})
					}
				}
			}).then(function(data)
			{
				return bindDlyCrossToStop(data, unAssignedStudents.geoStudents, dataModel, trip.id, true, tripStop, 'geoStudent');
			});

			// assigned student
			var p2 = tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", tf.dataTypeHelper.getEndpoint("student")), {
				data: {
					"idFilter": {
						IncludeOnly: assignStudents.map(function(student)
						{
							return student.id;
						})
					}
				}
			}).then(function(data)
			{
				return bindDlyCrossToStop(data, assignStudents, dataModel, trip.id, false, tripStop, 'geoStudent');
			});

			// ungeo student
			var p3 = tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", tf.dataTypeHelper.getEndpoint("student")), {
				data: {
					"idFilter": {
						IncludeOnly: unAssignedStudents.ungeoStudents.map(function(student)
						{
							return student.id;
						})
					}
				}
			}).then(function(data)
			{
				return bindDlyCrossToStop(data, unAssignedStudents.ungeoStudents, dataModel, trip.id, true, tripStop);
			});

			// var p4 = dataModel.getStudentLockData().lockAndGetLockInfo([]);

			return Promise.all([p1, p2, p3]).then(function(data)
			{
				tf.loadingIndicator.tryHide();
				var allStudent = data[0].Items.concat(data[1].Items, data[2].Items);
				// var lockList = data[3].lockedByOtherList;
				var isMidTrip = dataModel.isMidTrip();
				allStudent.map(function(student)
				{
					var studTemp = dataModel.routingStudentManager.students[dataModel.routingStudentManager._getKey(student)];
					if (studTemp)
					{
						student.OpenType = tripStop.OpenType;
						student.RequirementDateRange = moment(studTemp.RequirementStartDate).format("MM/DD/YYYY") + ' - ' + moment(studTemp.RequirementEndDate).format("MM/DD/YYYY");
						student.RequirementType = studTemp.RequirementType;
						student.RequirementDays = studTemp.RequirementDays;
						student.TravelType = isMidTrip && studTemp.Session != undefined ? (studTemp.Session == 0 ? " - PU" : " - DO") : "";
					}
				});
				bindLockInfo(trip, allStudent, []);
				options.validation = verifyStudentDay;
				options.showUngeocodedStudent = true;
				let exceptionData = trip.Session !== TF.SessionType.Shuttle ? { trip: trip, tripStop: tripStop } : null
				return tf.modalManager.showModal(new TF.Modal.KendoListMoverModalViewModel(data[0].Items, data[1].Items, data[2].Items, options, undefined, undefined, assignStudents, unAssignedStudents, exceptionData))
					.then(function(editStudentViewModel)
					{
						if (!editStudentViewModel)
						{
							return;
						}
						var updateStudentDayResultPromise = updateStudentDay(dataModel);
						var assignedList = [];
						var puDoStatusChangedPromises = [];
						let students = editStudentViewModel.obassignedEntity();
						return overrideExceptionConfirm(students, dataModel.expiredExceptions[tripStop.id])
							.then((confirm) => 
							{
								if (!confirm)
								{
									return;
								}

								let unassignStudents = editStudentViewModel.obunassignedEntity();
								updateCandidates(students, dataModel, assignStudents, unassignStudents);
								students.forEach(function(stud)
								{
									stud.id = stud.Id;
									puDoStatusChangedPromises.push(dataModel.updateStudentPUDOStatus(stud, stud.Session, trip.id, false));

									if (!data[1].Items.some(function(itemB)
									{
										return stud.Id == itemB.Id && stud.RequirementID == itemB.RequirementID && stud.PreviousScheduleID == itemB.PreviousScheduleID;
									}))
									{
										let student;
										if (!stud.RequirementID)
										{
											student = getExceptionStudent(stud, dataModel);
										}
										else
										{
											student = dataModel.getCanAssignCandidateStudentById(stud.Id, stud.RequirementID, stud.PreviousScheduleID, stud, false);
										}

										if (student)
										{
											assignedList.push($.extend({ TripStopID: stud.TripStopID }, student));
										}
									}
								});

								unassignStudents.forEach(function(stud)
								{
									stud.id = stud.Id;
									puDoStatusChangedPromises.push(dataModel.updateStudentPUDOStatus(stud, stud.Session, trip.id, false));
								});

								var assignPromises = [], unassignPromises = [];
								return Promise.all(puDoStatusChangedPromises.concat(updateStudentDayResultPromise)).then(function(result)
								{
									var puDoStatusChangedResults = result.slice(0, result.length - 1);
									var updateStudentDayResult = result[result.length - 1];
									if (assignedList.length > 0)
									{
										var groupResults = Enumerable.From(assignedList).GroupBy("$.TripStopID").ToArray();
										var assignData = {};
										groupResults.forEach(function(result)
										{
											var stop = dataModel.getTripStopByStopId(result.Key());
											result.source.forEach(function(student)
											{
												var schoolAssigned;
												if (tripStop.SchoolCode && ((student.TransSchoolCode != null && tripStop.SchoolCode != student.TransSchoolCode) || !student.TransSchoolCode))
												{
													schoolAssigned = tripStop;
												}
												var key = schoolAssigned ? schoolAssigned.id : 0;
												if (!assignData[key])
												{
													assignData[key] = { studentsTripStops: [], schoolAssigned: schoolAssigned };
												}
												var studentsTripStop = Enumerable.From(assignData[key].studentsTripStops).FirstOrDefault(null, function(c) { return c.tripStop == stop; });
												if (studentsTripStop)
												{
													studentsTripStop.students.push(student);
												} else
												{
													stop.isSchoolStop = student.isSchoolStop;
													assignData[key].studentsTripStops.push({ students: [student], tripStop: stop });
												}
											});
										});

										for (var key in assignData)
										{
											assignPromises.push(dataModel.assignStudentMultiple(assignData[key].studentsTripStops, true, null, null, null, true, assignData[key].schoolAssigned));
										}
									}

									if (updateStudentDayResult || puDoStatusChangedPromises.length > 0 && puDoStatusChangedResults.filter(function(c) { return c; }).length > 0)
									{
										dataModel.routingStudentManager.refresh();
										dataModel.viewModel.display.onTripChange(null, { add: [], delete: [], edit: [trip] });
									}

									var unassignedList = [];
									editStudentViewModel.obunassignedEntity().map(function(itemA)
									{
										// not in assign list
										if (!editStudentViewModel.obassignedEntity().some(function(itemB)
										{
											return itemA.RequirementID == itemB.RequirementID && itemA.PreviousScheduleID == itemB.PreviousScheduleID && itemB.id == itemA.id;
										}))
										{
											if (!itemA.RequirementID)
											{
												let stud = getExceptionStudent(itemA, dataModel);
												if (stud)
												{
													stud.tripStops = [];
													unassignedList.push(stud);
												}

												return;
											}

											var stud = dataModel.getAssignedStudentById(itemA.RequirementID, trip.id, itemA.PreviousScheduleID, itemA.TripStopID, itemA.id);
											if (stud)
											{
												unassignedList.push(stud);
											}
										}
									});
									if (unassignedList.length > 0)
									{
										var unassignedData = [];
										groupResults = Enumerable.From(unassignedList).GroupBy("$.TripStopID").ToArray();
										groupResults.forEach(function(result)
										{
											var stop = dataModel.getTripStopByStopId(result.Key());

											var studentsTripStop = Enumerable.From(unassignedData).FirstOrDefault(null, function(c) { return c.tripStop == stop; });
											if (studentsTripStop)
											{
												studentsTripStop.students = studentsTripStop.students.concat(result.source);
											} else
											{
												unassignedData.push({ students: result.source, tripStop: stop });
											}
										});
										unassignPromises.push(dataModel.unAssignStudentMultiple(unassignedData, true));
									}
									if (assignedList.length > 0 || unassignedList.length > 0)
									{
										return Promise.all(assignPromises).then(function(result)
										{
											Promise.all(unassignPromises).then(function()
											{
												dataModel.changeDataStack.push(tripStop);
											});
											let prohibitStudents = [];
											if (result && result.length > 0)
											{
												result.map(r => { return prohibitStudents = [...prohibitStudents, ...r.prohibitStudents]; });
											}
											return { prohibitStudents: prohibitStudents };
										});
									}
								});
							});
					});
			});
		});
	}

	function getExceptionStudent(entity, dataModel)
	{
		entity.monday = entity.assignWeekday && entity.assignWeekday[0];
		entity.tuesday = entity.assignWeekday && entity.assignWeekday[1];
		entity.wednesday = entity.assignWeekday && entity.assignWeekday[2];
		entity.thursday = entity.assignWeekday && entity.assignWeekday[3];
		entity.friday = entity.assignWeekday && entity.assignWeekday[4];
		entity.saturday = entity.assignWeekday && entity.assignWeekday[5];
		entity.sunday = entity.assignWeekday && entity.assignWeekday[6];
		let student = dataModel.getCanAssignCandidateStudentById(entity.Id, entity.RequirementID, entity.PreviousScheduleID, entity, false);
		return student;
	}

	async function overrideExceptionConfirm(assignedStudents, existExceptions)
	{
		if (!existExceptions)
		{
			return Promise.resolve(true);
		}

		var overrideStudentNames = [];
		assignedStudents.forEach((assignedStudent) => 
		{
			var exception = existExceptions.find((existException) => { return existException.id == assignedStudent.id });
			exception && overrideStudentNames.push(`'${exception.FirstName} ${exception.LastName}'`);
		});

		if (overrideStudentNames.length == 0)
		{
			return Promise.resolve(true);
		}

		var message = overrideStudentNames.join(', ');
		return await tf.promiseBootbox.yesNo(
			{
				message: `${message} already ${overrideStudentNames.length > 1 ? 'have' : 'has'} exception on this stop, are you sure you want to override the old one?`,
				title: "Confirm"
			});
	}

	function exceptionCandidates(students, dataModel, isAssigned)
	{
		return students.map(student =>
		{
			return student.AnotherTripStopID ? {
				Address: "",
				AnotherTripStopID: student.AnotherTripStopID,
				CanBeCandidate: false,
				CrossToStop: false,
				DOSchoolCode: student.DOSchoolCode,
				DOSchoolID: student.DOSchoolID,
				Disabled: student.Disabled,
				DistanceToStop: 0,
				EndDate: student.endDate,
				FirstName: student.FirstName,
				Friday: student.friday,
				Grade: student.Grade,
				InCriteria: true,
				IsAssigned: isAssigned !== false,
				IsComplete: false,
				IsShowOnMap: false,
				IsTotalMatch: false,
				LastName: student.LastName,
				LoadTime: dataModel.viewModel.display.routingDisplayHelper.getLoadTimeByGrade(student),
				Monday: student.monday,
				NotInCriteria: false,
				PUSchoolCode: student.PUSchoolCode,
				PUSchoolID: student.PUSchoolID,
				PreviousScheduleID: 0,
				ProhibitCross: false,
				RequirementDays: [true, true, true, true, true, false, false],
				RequirementEndDate: null,
				RequirementID: null,
				RequirementStartDate: null,
				RequirementType: 0,
				Saturday: student.saturday,
				SchoolCode: student.SchoolCode,
				SchoolId: student.SchoolId,
				Session: student.Session,
				StartDate: student.startDate,
				StudentType: 0,
				Sunday: student.sunday,
				Thursday: student.thursday,
				TotalTime: 0,
				TransSchoolCode: null,
				TransSchoolID: 0,
				TransStopTime: "0001-01-01T00:00:00.000",
				TripID: student.TripID,
				TripStopID: student.TripStopID,
				Tuesday: student.tuesday,
				ValidEndDate: student.endDate,
				ValidFriday: student.friday,
				ValidMonday: student.monday,
				ValidSaturday: student.saturday,
				ValidStartDate: student.startDate,
				ValidSunday: student.sunday,
				ValidThursday: student.thursday,
				ValidTuesday: student.tuesday,
				ValidWednesday: student.wednesday,
				Wednesday: student.wednesday,
				XCoord: student.Xcoord,
				YCoord: student.Ycoord,
				id: student.Id,
				isSchoolStop: student.isSchoolStop
			} : {}
		}).filter(student => !!student.id);
	}

	function updateCandidates(students, dataModel, assignStudents, unassignStudents)
	{
		let assignIds = students.reduce((ids, item) => ids.concat(item.id), []);
		let removeIds = assignStudents.reduce((ids, item) => ids.concat(assignIds.includes(item.id) ? [] : item.id), []);
		students = students.filter(s => !s.RequirementID);
		unassignStudents = unassignStudents.filter(s => !s.RequirementID);
		let exceptionStudents = exceptionCandidates(students, dataModel).concat(exceptionCandidates(unassignStudents, dataModel, false));
		let candidateStudentsChanged = false;
		if (exceptionStudents.length > 0)
		{
			dataModel.candidateStudents = dataModel.candidateStudents.concat(exceptionStudents);
			candidateStudentsChanged = true;
		}
		if (removeIds.length > 0)
		{
			candidateStudentsChanged = true;
		}
		if (candidateStudentsChanged)
		{
			dataModel.routingStudentManager.refresh();
		}
		else
		{
			dataModel.routingStudentManager.calculateStudentStatus();
		}
	}

	function bindLockInfo(trip, allStudent)
	{
		allStudent.map(function(student)
		{
			student.isLocked = false;
			student.lockedByUser = "";
		});
	}

	function getOption(tripStop, trip, dataModel)
	{
		var options = {
			pageTitle: "Student Assignments for stop: " + tripStop.Street,
			withOutImage: true,
			showCheckBox: false,
			displayCheckbox: true,
			showRemoveColumnButton: true,
			filterCheckboxText: "Include Ungeocoded Students",
			leftTitle: "Unassigned Students",
			rightTitle: "Assigned Students",
			type: "student",
			withOutSelectedValidate: true,
			hasLockedItems: true,
			sticky: true,
			stickyKey: "RoutingStudentAssign",
			configure: {
				stickColumns: [
					{
						field: "lock_menu",
						title: "<div></div>",
						width: "30px",
						sortable: false,
						filterable: false,
						locked: true,
						headerTemplate: "<div class='iconbutton normal-cursor lock'></div>",
						template: "<div class=\"#:isLocked?'iconbutton lock-black':''#\" title='#:lockedByUser#'></div>"
					}],
				gridColumns: [
					{
						title: "<div></div>",
						width: "30px",
						sortable: false,
						filterable: false,
						DisplayName: "Crosser",
						FieldName: "CrossToStop",
						headerTemplate: "<div class='iconbutton normal-cursor crosser'></div>",
						template: "<div class=\"#:CrossToStop?'iconbutton normal-cursor crosser-black':''#\"></div>"
					},
					{
						title: "<div></div>",
						width: "30px",
						sortable: false,
						filterable: false,
						DisplayName: "Exception",
						FieldName: "RequirementID",
						headerTemplate: "<div class='iconbutton normal-cursor student-exception-gray'></div>",
						template: "<div class=\"#:!RequirementID?'iconbutton normal-cursor student-exception':''#\"></div>"
					},
					{
						Width: "150px",
						type: "string",
						FieldName: "FullName",
						DisplayName: "Name",
						template: function(item)
						{
							return `${item.FirstName} ${item.LastName}`;
						}
					},
					{
						Width: "100px",
						type: "string",
						FieldName: "School",
						DisplayName: "School"
					},
					{
						Width: "120px",
						type: "integer",
						FieldName: "ActualLoadTime",
						DisplayName: "Actual Load Time"
					},
					{
						Width: "250px",
						type: "string",
						FieldName: "Weekday",
						DisplayName: "Days",
						minResizableWidth: 250,
						template: "<div class='studentWeekdayPicker'>" +
							"<span class=\"#:assignWeekday[0]?'checked':''# #:availableWeekday[0]?'':'cannot-checked'#\">Mo</span>" +
							"<span class=\"#:assignWeekday[1]?'checked':''# #:availableWeekday[1]?'':'cannot-checked'#\">Tu</span>" +
							"<span class=\"#:assignWeekday[2]?'checked':''# #:availableWeekday[2]?'':'cannot-checked'#\">We</span>" +
							"<span class=\"#:assignWeekday[3]?'checked':''# #:availableWeekday[3]?'':'cannot-checked'#\">Th</span>" +
							"<span class=\"#:assignWeekday[4]?'checked':''# #:availableWeekday[4]?'':'cannot-checked'#\">Fr</span>" +
							"<span class=\"#:assignWeekday[5]?'checked':''# #:availableWeekday[5]?'':'cannot-checked'#\">Sa</span>" +
							"<span class=\"#:assignWeekday[6]?'checked':''# #:availableWeekday[6]?'':'cannot-checked'#\">Su</span>" +
							"</div>"
					}, {
						Width: "120px",
						type: "number",
						FieldName: "WalkToStopDistance",
						DisplayName: "Walk to stop",
						UnitOfMeasureSupported: true,
					}
				],
				sort: [{ field: "LastName", dir: "asc" }, { field: "FirstName", dir: "asc" }],
				filterable: false,
			},
			// left grid item can select to right grid or not
			isDataItemCanSelect: function(student)
			{
				if (student)
				{
					// if student is locked, return false
					if (student.isLocked || student.isConfused)
					{
						return false;
					}
					// if student cross street and student is not allow to cross street, return false
					if (student.CrossToStop && student.ProhibitCross)
					{
						return false;
					}
					// if student cross street and trip stop not allow cross street, return false
					if (student.CrossToStop && dataModel.getTripStopByStopId(student.TripStopID).ProhibitCrosser)
					{
						return false;
					}
				}
				return true;
			},
			onDataBound: function(kendoGrid)
			{
				if (!kendoGrid) return;
				$(kendoGrid.element).find(".studentSessionPicker>span").off("click").on("click", function(event)
				{
					event.preventDefault();
					event.stopPropagation();
					var button = $(this), sibling = button.siblings().eq(0);
					if (button.hasClass("cannot-checked") || sibling.hasClass("cannot-checked"))
					{
						return;
					}
					var data = kendoGrid.dataItem(button.closest("tr"));
					data.Session = data.Session == 0 ? 1 : 0;
					// update student to new requirement by session
					var studentInCandidates = dataModel.getCandidateBySession(data, data.Session);
					if (studentInCandidates.length > 0)
					{
						var student = studentInCandidates[0];
						data.RequirementID = student.RequirementID;
						data.PreviousScheduleID = student.PreviousScheduleID;
					}
					button.toggleClass("checked");
					sibling.toggleClass("checked");
				});

				$(kendoGrid.element).find(".studentWeekdayPicker>span").off("click").on("click", function(event)
				{
					event.preventDefault();
					event.stopPropagation();
					var button = $(this), index = button.parent().children().index(button);
					if (button.hasClass("cannot-checked"))
					{
						return;
					}
					var data = kendoGrid.dataItem(button.closest("tr"));
					var key = dataModel.routingStudentManager._getKey(data);
					if (!assignWeekdayInfos[key])
					{
						assignWeekdayInfos[key] = {
							student: data,
							before: data.assignWeekday.slice()
						};
					}

					data.assignWeekday[index] = !data.assignWeekday[index];
					assignWeekdayInfos[key].after = data.assignWeekday;
					button.toggleClass("checked");
				});
			}
		};

		initOptionForMidDayTrip(trip, options);
		return options;
	}

	function verifyStudentDay(assignInfo)
	{
		var unAssignKeys = assignInfo.obunassignedEntity().map(function(s)
		{
			return TF.RoutingMap.RoutingPalette.RoutingStudentManager.getKey(s);
		});
		for (var key in assignWeekdayInfos)
		{
			if (unAssignKeys.indexOf(key) < 0 && !Enumerable.From(assignWeekdayInfos[key].after).Any(function(assign) { return assign; }))
			{
				tf.promiseBootbox.alert("Please at least select one day for assign students");
				return false;
			}
		}
		return true;
	}

	function updateStudentDay(dataModel)
	{
		var promises = [];
		var changed = false;
		for (var key in assignWeekdayInfos)
		{
			if (assignWeekdayInfos[key].before.toString() != assignWeekdayInfos[key].after.toString())
			{
				var lockInfo = {
					RequirementId: assignWeekdayInfos[key].student.RequirementID,
					PreviousScheduleID: assignWeekdayInfos[key].student.PreviousScheduleID,
					StudId: assignWeekdayInfos[key].student.id,
					TripId: assignWeekdayInfos[key].student.TripID,
					TripStopId: assignWeekdayInfos[key].student.TripStopID
				};
				TF.RoutingMap.RoutingPalette.RoutingDataModel.weekdays.forEach(function(weekday, index)
				{
					lockInfo[weekday] = assignWeekdayInfos[key].after[index];
				});

				promises.push((function(key)
				{
					return dataModel.lockRoutingStudent([lockInfo]).then(function(data)
					{
						data = data[0];
						TF.RoutingMap.RoutingPalette.RoutingDataModel.weekdays.forEach(function(weekday, index)
						{
							assignWeekdayInfos[key].after[index] = data[weekday];
						});
						assignWeekdayInfos[key].before.forEach(function(assignBefore, index)
						{
							var assignAfter = assignWeekdayInfos[key].after[index];
							if (assignAfter != assignBefore)
							{
								changed = true;
								var student = assignWeekdayInfos[key].student;
								dataModel.changeAssignedStudentDay(student.id, student.RequirementID, student.PreviousScheduleID, assignAfter, index, dataModel.getTripStopByStopId(student.TripStopID), student.AnotherTripStopID);
							}
						});
					});
				})(key));
			}
		}

		return Promise.all(promises).then(function()
		{
			return changed;
		});
	}

	function initOptionForMidDayTrip(trip, options)
	{
		if (trip.Session != 3)
		{
			return;
		}

		options.configure.gridColumns.push({
			Width: "100px",
			type: "string",
			FieldName: "Session",
			DisplayName: "Pu/Do",
			template: "<div class='studentSessionPicker'><span data-session='0' class=\"#:Session==0?'checked':''# #:availableSession.indexOf(0)<0?'cannot-checked':''#\">PU</span><span data-session='1' class=\"#:Session==1?'checked':''# #:availableSession.indexOf(1)<0?'cannot-checked':''#\">DO</span></div>"
		});
	}

	function bindDlyCrossToStop(data, students, dataModel, tripId, isCandidate, tripStop, bindType)
	{
		var map = toDictionary(students);
		var items = [];
		var routingDisplay = dataModel.viewModel.display;

		function getCandidatesWeekdays(stud, availableWeekday)
		{
			var studentInTripStop = dataModel.tripStopDictionary[tripStop.id].filter(function(c) { return dataModel.routingStudentManager._getKey(c.student) == dataModel.routingStudentManager._getKey(stud); });

			if (studentInTripStop.length > 0)
			{
				return TF.RoutingMap.RoutingPalette.RoutingDataModel.weekdays.map(function(item)
				{
					return studentInTripStop[0].student[item];
				});
			}
			return availableWeekday;
		}

		data.Items.forEach(function(item)
		{
			for (var i = 0; i < map[item.Id].length; i++)
			{
				var stud = map[item.Id][i];
				if (!stud.RequirementID && !stud.AnotherTripStopID)
				{
					stud.SchoolCode = stud.School;
					stud.AnotherTripStopID = dataModel.findRealSchoolStops(tripStop, stud).id;
				}

				var availableSession = dataModel.routingStudentManager.getAvailableSession(stud, tripId, tripStop);
				var studInDict = dataModel.routingStudentManager.students[dataModel.routingStudentManager._getKey(stud)];

				var availableWeekday = studInDict.availableWeekdays.map(function(available, index)
				{
					return available && (Enumerable.From(studInDict.assignWeekdays[index]).Any(function(c) { return c.TripStopID == stud.TripStopID; }) || studInDict.assignWeekdays[index].length == 0);
				});

				var isConfused = isCandidate && routingDisplay.IsConfusedStudent(stud.id, stud.RequirementID, stud.PreviousScheduleID, tripStop.id);
				if (bindType === 'geoStudent' && (item.Xcoord == null || item.Xcoord == 0))
				{
					item.Xcoord = studInDict.XCoord;
				}

				items.push($.extend({}, item, {
					id: item.Id,
					CrossToStop: stud.CrossToStop || false,
					RequirementID: stud.RequirementID,
					PreviousScheduleID: stud.PreviousScheduleID,
					TripStopID: stud.TripStopID || tripStop.id,
					Session: stud.Session,
					isConfused: isConfused,
					availableSession: availableSession,
					availableWeekday: availableWeekday,
					AnotherTripStopID: stud.AnotherTripStopID,
					SchoolCode: stud.SchoolCode,
					WalkToStopDistance: stud.WalkToStopDistance,
					assignWeekday: isCandidate ? getCandidatesWeekdays(stud, availableWeekday) : studInDict.assignWeekdays.map(function(assignInfoList)
					{
						return Enumerable.From(assignInfoList).Any(function(c) { return c.TripStopID == stud.TripStopID; });
					}),
					Weekday: ""
				}));
			}
		});
		data.Items = items;
		return data;
	}

	function toDictionary(data)
	{
		var map = {};
		(data || []).forEach(function(item)
		{
			if (map[item.id])
			{
				map[item.id].push(item);
			} else
			{
				map[item.id] = [item];
			}
		});
		return map;
	}

})();
(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").AnalyzeTripByDistrictPolicy = AnalyzeTripByDistrictPolicy;

	/**
	* Analyze trip status by district policy
	*/
	function AnalyzeTripByDistrictPolicy(viewModel)
	{
		this.viewModel = viewModel;
		this.dataModel = viewModel.dataModel;
		this.analyzeResult = {};
		this.studentWalkToStopResults = {};
		this.hasWalkToStopChange = {};
		this.hasWalkToStopWarningChange = {};
		this.hasTotalTimeChange = {};
		this.walkToStopDistanceChangeStudents = [];
	}

	AnalyzeTripByDistrictPolicy.prototype.analyze = function(trip, refreshDistrictPolicy = false, isOpenTrip)
	{
		if (refreshDistrictPolicy)
		{
			this._districtPolicy = null;
		}

		if ($.isArray(trip))
		{
			trip.forEach(t => { this._analyze(t, isOpenTrip); });
		} else
		{
			this._analyze(trip, isOpenTrip);
		}
	};

	AnalyzeTripByDistrictPolicy.prototype._analyze = function(trip, isOpenTrip)
	{
		if (!isOpenTrip)
		{
			this._calculateWalkToStopDistanceByStops(trip);
		}
		this.analyzeTrip(trip);
	};

	AnalyzeTripByDistrictPolicy.prototype.analyzeTrip = function(trip)
	{
		var self = this;
		Promise.all([this._getDistrictPolicies(), this._getTripVehicle(trip)]).then(function(results)
		{
			var analyzeResult = self._analyzeResult(trip, results[0], results[1]);
			self.analyzeResult[trip.id] = analyzeResult;
			clearTimeout(self.threshold);
			self.threshold = setTimeout(() =>
			{
				self._displayWarning();
			}, 500);
			self._notifyWalkToStopDistanceWarning(trip, analyzeResult);
			return analyzeResult;
		});
	};

	AnalyzeTripByDistrictPolicy.prototype.hasError = function(tripId)
	{
		var self = this;
		return self.analyzeResult[tripId] ? self.analyzeResult[tripId].hasError : false;
	};

	AnalyzeTripByDistrictPolicy.prototype._analyzeResult = function(trip, districtPolicies, tripWithVehicle)
	{
		var self = this;
		this.hasTotalTimeChange[trip.id] = false;
		this.hasWalkToStopWarningChange[trip.id] = false;
		var districtPoliciesSet = this._getDistrictPoliciesSet(districtPolicies);
		var vrpSetting = self.dataModel.getVRPSetting();
		var maxCapacity = tripWithVehicle[0] && tripWithVehicle[0].Vehicle ? Math.min(vrpSetting.capacity, tripWithVehicle[0].Vehicle.Capacity) : vrpSetting.capacity;
		var analyzeResult = {
			id: trip.id,
			measurementUnit: tf.measurementUnitConverter.getShortUnits(),
			hasError: false,
			isStudent: false,
			capacity: {
				max: maxCapacity,
				real: 0
			},
			totalDistance: {
				max: vrpSetting.totalDistance == null ? Number.MAX_VALUE : self.convertToCurrentMeasurementUnit(vrpSetting.totalDistance).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
				real: self.convertToCurrentMeasurementUnit(trip.Distance).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
			},
			totalTime: {
				max: vrpSetting.totalTime,
				real: trip.Duration
			},
			color: trip.color,
			tripStops: trip.TripStops.map(function(stop)
			{
				return {
					id: stop.id,
					stop: stop,
					maxCapacity: districtPoliciesSet.maxStudentsPerStop,
					capacity: 0,
					students: []
				};
			})
		};
		let MaxStudentsOnTrip = 0, currentStudentsOnTrip = 0;
		trip.TripStops.forEach(function(tripStop, stopIndex)
		{
			if (tripStop.NumStuds < 0)
			{
				MaxStudentsOnTrip = MaxStudentsOnTrip > currentStudentsOnTrip ? MaxStudentsOnTrip : currentStudentsOnTrip;
			}
			currentStudentsOnTrip += tripStop.NumStuds;

			var tripStopResult = analyzeResult.tripStops[stopIndex];
			var maxStudentRideTime = vrpSetting.ridingTime ? vrpSetting.ridingTime : Number.MAX_VALUE;
			var vrpRidingTime = vrpSetting.ridingTime ? vrpSetting.ridingTime : Number.MAX_VALUE;
			tripStopResult.hasWalkToStopWarningChange = false;
			tripStopResult.hasTotalTimeChange = false;
			tripStop.Students.forEach(function(student)
			{
				var districtPolicy = districtPoliciesSet[student.Grade];
				var maxWalkToStopDistance = Number.MAX_VALUE;
				if (districtPolicy)
				{
					var dpRidingTime = districtPolicy.maxRideTime ? districtPolicy.maxRideTime : Number.MAX_VALUE;
					maxStudentRideTime = Math.min(vrpRidingTime, dpRidingTime);
					maxWalkToStopDistance = districtPolicy.walkToStopDistance;
				} else
				{
					maxStudentRideTime = Math.min(vrpRidingTime, 60);
				}

				tripStopResult.capacity++;

				self.dataModel.calculateStudentTravelTime(student, tripStop, trip.TripStops);
				var hasTotalTimeError = student.TotalTime > maxStudentRideTime,
					parsedWalkToStopDistance = self.convertToCurrentMeasurementUnit(student.WalkToStopDistance),
					parsedMaxWalkToStopDistance = self.convertToCurrentMeasurementUnit(maxWalkToStopDistance),
					hasWalkDistanceError = parsedWalkToStopDistance > parsedMaxWalkToStopDistance;

				tripStopResult.students.push({
					id: student.id,
					name: student.FirstName + ' ' + student.LastName,
					totalTime: student.TotalTime,
					maxRideTime: maxStudentRideTime,
					hasTotalTimeError: hasTotalTimeError,
					walkToStopDistance: parsedWalkToStopDistance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
					maxWalkToStopDistance: parsedMaxWalkToStopDistance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
					hasWalkDistanceError: hasWalkDistanceError,
					student: student
				});

				if (student.WalkToStopDistanceWarning == null || typeof (student.WalkToStopDistance) == "undefined" || student.WalkToStopDistanceWarning != hasWalkDistanceError)
				{
					self.hasWalkToStopWarningChange[trip.id] = true;
					tripStopResult.hasWalkToStopWarningChange = true;
				}
				if (student.TotalTimeErrorWarning == null || student.TotalTimeErrorWarning != hasTotalTimeError)
				{
					self.hasTotalTimeChange[trip.id] = true;
					tripStopResult.hasTotalTimeChange = true;
				}
				student.WalkToStopDistanceWarning = hasWalkDistanceError || hasTotalTimeError;
				student.TotalTimeErrorWarning = hasTotalTimeError;
			});
		});
		analyzeResult.capacity.real = MaxStudentsOnTrip;
		analyzeResult.hasError = this._valid(analyzeResult);
		return analyzeResult;
	};

	/**
	* convert districtPolicies array to key value map by category key
	*/
	AnalyzeTripByDistrictPolicy.prototype._getDistrictPoliciesSet = function(districtPolicies)
	{
		var districtPoliciesSet = {};
		districtPolicies.forEach(function(districtPolicy)
		{
			districtPoliciesSet[districtPolicy.Category] = {
				capacity: districtPolicy.Value3,
				walkToStopDistance: districtPolicy.Value1,
				maxRideTime: districtPolicy.Value4
			};

			if (districtPolicy.Category == "Student/Stop")
			{
				districtPoliciesSet.maxStudentsPerStop = districtPolicy.Value1;
			}
		});
		return districtPoliciesSet;
	};

	AnalyzeTripByDistrictPolicy.prototype._getDistrictPolicies = function()
	{
		var self = this;
		if (this._districtPolicy)
		{
			return Promise.resolve(this._districtPolicy);
		}
		return this.dataModel.loadDistrictPolicy().then(function(districtPolicy)
		{
			self._districtPolicy = districtPolicy;
			return districtPolicy;
		});
	};

	AnalyzeTripByDistrictPolicy.prototype._getTripVehicle = function(trip)
	{
		var self = this;
		if (self._tripWithVehicle)
		{
			return Promise.resolve(self._tripWithVehicle);
		}
		return this.dataModel.loadTrip([trip]).then(function(tripWithVehicle)
		{
			self._tripWithVehicle = tripWithVehicle;
			return tripWithVehicle;
		});
	};

	/**
	* add warning icon to tree view
	*/
	AnalyzeTripByDistrictPolicy.prototype._displayWarning = function()
	{
		var self = this;
		var treeView = self.viewModel.$element.find("#routingtreeview");
		var tripRows = treeView.find(".tree-trip-row");
		var warningCssClass = "warning-icon";

		if (!self.viewModel.display.treeview) return;

		if (!treeView.data("delegate-warn"))
		{
			// display warning on trip
			treeView.delegate(".tree-trip-row>." + warningCssClass, "click", function(e)
			{
				var trip = self.viewModel.display.treeview.dataItem(e.target.closest('li'));
				var analyzeResult = self.analyzeResult[trip.id];
				self._displayDetail(e, analyzeResult);
			});
			// display warning on student
			treeView.delegate(".student-row-under-stop>." + warningCssClass, "click", function(e)
			{
				var trip = self.viewModel.display.treeview.dataItem($(e.target).closest('.k-treeview-lines').children().has($(e.target)));
				var studentTreeData = self.viewModel.display.treeview.dataItem(e.target);
				var studentId = studentTreeData.id, tripStopId = studentTreeData.customData.tripStopId;
				var analyzeResult = self.analyzeResult[trip.id];
				var students = analyzeResult.tripStops.filter(x => x.id == tripStopId)[0].students.filter(x => x.id == studentId);
				if (students.length > 0)
				{
					self._displayDetail(e, $.extend({ isStudent: true, measurementUnit: analyzeResult.measurementUnit }, students[0]));
				}
			});
			treeView.data("delegate-warn", true);
		}
		self.viewModel.display.treeview.dataSource.data().forEach(function(_, index)
		{
			var tripRow = tripRows.eq(index);
			var trip = self.viewModel.display.treeview.dataItem(tripRow);
			tripRow.parent().find("." + warningCssClass).remove();
			if (self.analyzeResult[trip.id] && self.analyzeResult[trip.id].hasError)
			{
				var warning = $("<div></div>").addClass(warningCssClass).attr("title", "Breaks District Policy");
				tripRow.append(warning);
			}
		});
	};

	AnalyzeTripByDistrictPolicy.prototype._valid = function(analyzeResult)
	{
		if (parseInt(analyzeResult.capacity.real) > parseInt(analyzeResult.capacity.max))
		{
			return true;
		}
		if (parseFloat(analyzeResult.totalDistance.real) > parseFloat(analyzeResult.totalDistance.max))
		{
			return true;
		}
		if (parseInt(analyzeResult.totalTime.real) > parseInt(analyzeResult.totalTime.max))
		{
			return true;
		}
		for (var i = 0; i < analyzeResult.tripStops.length; i++)
		{
			var tripStop = analyzeResult.tripStops[i];
			if (tripStop.students.length > 0 && tripStop.students.some(x => x.hasTotalTimeError || x.hasWalkDistanceError))
			{
				return true;
			}
			if (tripStop.capacity > tripStop.maxCapacity)
			{
				return true;
			}
		}
		return false;
	};

	AnalyzeTripByDistrictPolicy.prototype._displayDetail = function(event, analyzeResult)
	{
		event.stopPropagation();
		var className = "trip-district-policy-result";
		var templateUrl = "workspace/Routing Map/RoutingMapPanel/RoutingPalette/TripDistrictPolicyResult";
		var template = $("<div data-bind=\"template: { name: " + "'" + templateUrl + "'" + "}\"></div>").addClass(className);
		var data = this._createDisplayData(analyzeResult, event);
		ko.applyBindings(data, template[0]);
		var container = $("body");
		container.children("." + className).remove();
		container.append(template);
		var eventName = "mousedown." + className;
		container.bind(eventName, function(e)
		{
			if ($(e.target).closest("." + className).length == 0)
			{
				close();
			}
		});

		$(event.target).closest(".scrollable").one("scroll", function()
		{
			close();
		});

		function close()
		{
			template.remove();
			container.unbind(eventName);
		}
	};

	/**
	* the data for display
	*/
	AnalyzeTripByDistrictPolicy.prototype._createDisplayData = function(analyzeResult, event)
	{
		var self = this;
		if (!analyzeResult.isStudent)
		{
			var trip = self.dataModel.getTripById(analyzeResult.id);
			analyzeResult.color = trip.color;
		}
		return $.extend({
			uiInit: function(model, e)
			{
				var icon = $(event.target);
				var container = $("body");
				var element = $(e);
				var template = element.parent();
				if (analyzeResult.isStudent)
				{
					template.width(200);
					template.find(".content").css({ padding: "10px" });
				}
				setTimeout(function()
				{
					template.show();
					var arrow = template.find(".arrow");
					var left = icon.offset().left + icon.width() + 20;
					var top = icon.offset().top - element.height() / 2 + 6;
					top = top < 0 ? 10 : top;
					if (left + template.width() > container.width())
					{
						left = icon.offset().left - icon.width() - 10 - template.outerWidth();
						arrow.addClass("left");
					}
					template.css({
						top: top,
						left: left
					});
					template.find(".content").css({
						'max-height': container.height() - 50
					});
					arrow.css({
						top: icon.offset().top - top - 3
					});
				});
			},
			centerClick: function(model)
			{
				TF.RoutingMap.EsriTool.centerSingleItem(self.viewModel.drawTool._map, model.stop || model.student);
			}

		}, analyzeResult);
	};

	AnalyzeTripByDistrictPolicy.prototype._calculateWalkToStopDistanceByStops = function(trip)
	{
		var self = this,
			promises = [],
			studentManager = this.dataModel.routingStudentManager,
			originalResults = JSON.stringify(this.studentWalkToStopResults);
		this.hasWalkToStopChange[trip.id] = false;
		this.walkToStopDistanceChangeStudents = [];
		trip.TripStops.forEach(tripStop =>
		{
			tripStop.Students.forEach(student =>
			{
				// exclude exception student
				if (student.RequirementID)
				{
					promises.push(this._calculateWalkToStopDistance(student.XCoord, student.YCoord, tripStop.XCoord, tripStop.YCoord, student).then(result =>
					{
						student.WalkToStopDistance = result;
						updateStudentWalkToStopDistance(tripStop.Students, student, result, studentManager);
						this.studentWalkToStopResults[`${studentManager._getKey(student)},${tripStop.id}`] = result;
					}));
				}
			});
		});

		return Promise.all(promises).then(() =>
		{
			if (originalResults != JSON.stringify(this.studentWalkToStopResults))
			{
				this.hasWalkToStopChange[trip.id] = true;
				self.analyzeTrip(trip);
			}
		});
	};

	function updateStudentWalkToStopDistance(source, student, value, studentManager)
	{
		source.filter(x => studentManager._getKey(x) == studentManager._getKey(student)).forEach(x =>
		{
			x.WalkToStopDistance = value;
		});
	}

	AnalyzeTripByDistrictPolicy.prototype.initCacheFromAssignedStudent = function()
	{
		this.dataModel.trips.forEach(trip =>
		{
			trip.TripStops.forEach(tripStop =>
			{
				tripStop.Students.forEach(student =>
				{
					if (student.WalkToStopDistance && student.XCoord)
					{
						var key = createCacheKey(student.XCoord, student.YCoord, tripStop.XCoord, tripStop.YCoord);
						walkToStopCaches[key] = Promise.resolve(student.WalkToStopDistance);
					}
				});
			});
		});
	};

	function createCacheKey(studentX, studentY, stopX, stopY)
	{
		var _studentX = parseFloat(studentX),
			_studentY = parseFloat(studentY),
			_stopX = parseFloat(stopX),
			_stopY = parseFloat(stopY);
		return `${_studentX}:${_studentY}:${_stopX}:${_stopY}`;
	}

	var walkToStopCaches = {};
	AnalyzeTripByDistrictPolicy.prototype._calculateWalkToStopDistance = function(studentX, studentY, stopX, stopY, student)
	{
		var key = createCacheKey(studentX, studentY, stopX, stopY);
		if (walkToStopCaches[key])
		{
			return walkToStopCaches[key];
		}
		this.walkToStopDistanceChangeStudents.push(student);
		var promise = TF.calculateDistance(studentX, studentY, stopX, stopY).then((distance) =>
		{
			return parseFloat(distance.toFixed(2));
		}).catch(function()
		{
			return null;
		});
		walkToStopCaches[key] = promise;
		return promise;
	};

	AnalyzeTripByDistrictPolicy.prototype._notifyWalkToStopDistanceWarning = function(trip, analyzeResult)
	{
		if (this.hasWalkToStopChange[trip.id] || this.hasWalkToStopWarningChange[trip.id] || this.hasTotalTimeChange[trip.id] || this.walkToStopDistanceChangeStudents.length > 0)
		{
			var tripStopIds = new Set();
			analyzeResult.tripStops.forEach(x =>
			{
				x.students.forEach(s =>
				{
					if (s.hasWalkDistanceError || x.hasWalkToStopWarningChange || x.hasTotalTimeChange)
					{
						this.walkToStopDistanceChangeStudents.push(s);
						tripStopIds.add(x.id);
						tripStopIds.add(s.student.AnotherTripStopID);
					}
				});
			});

			// refresh display
			this.dataModel.routingStudentManager.refresh(this.walkToStopDistanceChangeStudents);
			trip.TripStops.map((tripStop) =>
			{
				if (tripStopIds.has(tripStop.id) || Enumerable.From(this.walkToStopDistanceChangeStudents).Any(x => x.TripStopID == tripStop.id || x.AnotherTripStopID == tripStop.id))
				{
					this.viewModel.display.refreshStopNode(tripStop, trip);
				}
			});
		}
	};

	function mathRound(value, decimal)
	{
		decimal = decimal || 0;
		let factor = Math.pow(10, decimal);
		return Math.round(value * factor) / factor;
	}

	AnalyzeTripByDistrictPolicy.prototype.convertToCurrentMeasurementUnit = function(value)
	{
		if (!tf.measurementUnitConverter.isImperial())
		{
			return mathRound(value, 2);
		}

		return mathRound(tf.measurementUnitConverter.convert({
			originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
			targetUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Imperial,
			precision: 5,
			value: value
		}), 2);
	};

	AnalyzeTripByDistrictPolicy.prototype.dispose = function()
	{
		clearTimeout(this.threshold);
		tfdispose(this);
	};
})();
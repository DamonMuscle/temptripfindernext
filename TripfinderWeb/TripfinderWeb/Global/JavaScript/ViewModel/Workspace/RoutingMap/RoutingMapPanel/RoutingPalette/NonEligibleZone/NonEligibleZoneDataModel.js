(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").NonEligibleZoneDataModel = NonEligibleZoneDataModel;

	function NonEligibleZoneDataModel(viewModel)
	{
		TF.DataEntry.SchoolDataEntryNonEligibleDataModel.call(this, viewModel);
		this.getTripDataModel().onTripsChangeEvent.subscribe(this.onTripsChangeEvent.bind(this));
		this.schools = [];
		this.lockData.dispose();
		this.lockData = new TF.RoutingMap.RoutingPalette.NonEligibleZoneLockData(this);
	}

	NonEligibleZoneDataModel.prototype = Object.create(TF.DataEntry.SchoolDataEntryNonEligibleDataModel.prototype);
	NonEligibleZoneDataModel.prototype.constructor = NonEligibleZoneDataModel;

	NonEligibleZoneDataModel.prototype.getTripDataModel = function()
	{
		return this.viewModel.viewModel.tripViewModel.dataModel;
	};

	NonEligibleZoneDataModel.prototype.getTripDisplay = function()
	{
		return this.viewModel.viewModel.tripViewModel.display;
	};

	NonEligibleZoneDataModel.prototype.getSchool = function()
	{
		var trips = this.getTripDataModel().getEditTrips();
		var schools = [];
		trips.forEach(function(trip)
		{
			schools = schools.concat(trip.Schools.split("!").filter(function(c) { return !!c; }));
		});
		return schools.map(function(code)
		{
			return {
				SchoolCode: code
			};
		});
	};

	NonEligibleZoneDataModel.prototype.onTripsChangeEvent = function()
	{
		var newSchools = this.getSchool();
		if (JSON.stringify(this.schools) != JSON.stringify(newSchools))
		{
			this.schools = newSchools;
			return this.init();
		}
		return Promise.resolve();
	};

	NonEligibleZoneDataModel.prototype.refresh = function(oldStudents)
	{
		var self = this;
		var tripDataModel = self.getTripDataModel();

		function getIds(nezStudents)
		{
			return Enumerable.From(nezStudents).Select(function(c) { return c.StudentId; }).Distinct().OrderBy().ToArray();
		}

		// update student in route display
		// function updateStudentInRouteDisplay(tripStop, allStudents)
		// {
		// 	var oldStudentsInStop = tripDataModel.tripStopDictionary[tripStop.id];
		// 	var newStudentsInStop = tripDataModel.getStopCandidateStudent(tripStop, allStudents);

		// 	if (oldStudentsInStop && newStudentsInStop && oldStudentsInStop.length != newStudentsInStop.length)
		// 	{
		// 		self.getTripDisplay().onTripStopsChange({}, { add: [], edit: [tripStop], delete: [] });
		// 	}

		// }

		// update student in map
		function unAssignStudent(tripStop, newStudents)
		{
			var unAssignStudents = [];
			tripStop.Students.forEach(function(student)
			{
				if (newStudents.indexOf(student.id) > -1)
				{
					unAssignStudents.push(student);
				}
			});
			if (unAssignStudents.length > 0)
			{
				tripDataModel.unAssignStudent(unAssignStudents, tripStop);
			}
		}

		function loopStop(callback)
		{
			tripDataModel.trips.forEach(function(trip)
			{
				trip.TripStops.forEach(function(tripStop)
				{
					callback(tripStop);
				});
			});
		}

		var oldStudentIds = getIds(oldStudents);

		var newStudents = getIds(self.getAllStudentInNEZ());
		// if student changed, trigger refreshCandidateStudent
		if (JSON.stringify(oldStudentIds) != JSON.stringify(newStudents))
		{
			// unAssign Student
			loopStop(function(tripStop)
			{
				unAssignStudent(tripStop, newStudents);
			});
			// refresh candidate
			tripDataModel.refreshCandidateStudent().then(function()
			{
				// var allStudents = tripDataModel.getAllStudents();

				// loopStop(function(tripStop)
				// {
				// 	updateStudentInRouteDisplay(tripStop, allStudents);
				// });
			});
		}
	};

	NonEligibleZoneDataModel.prototype.getAutoRefreshSetting = function()
	{
		var storages = this.getStorage();
		var defaults = storages.autoRefresh.default;
		return this.getSettingByKey(storages.autoRefresh.key, this.routeState, defaults);
	};

})();
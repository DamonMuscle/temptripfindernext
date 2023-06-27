(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").UnassignedStudentDataModel = UnassignedStudentDataModel;

	function UnassignedStudentDataModel(viewModel)
	{
		TF.RoutingMap.BaseMapDataModel.call(this, viewModel._viewModal, viewModel);
		var self = this;
		self.viewModel = viewModel;
		self.routingPaletteViewModel = self.viewModel.viewModel;
		self.tripViewModel = self.routingPaletteViewModel.tripViewModel;
		self.tripDataModel = self.tripViewModel.dataModel;
		self.routeState = self.routingPaletteViewModel.routeState;
		self.all = [];
		self.highlighted = [];
		self.selected = [];
		self.keyProperty = "key";
		self.currentSettings = null;
		self.isMidTrip = false;
		self.lockData = new TF.RoutingMap.RoutingPalette.UnassignedStudentLockData(self);
		self.studentRequirementLockData = new TF.RoutingMap.LockData({
			displayName: "studentRequirement", viewModel: self.routingPaletteViewModel, type: function()
			{
				return "studentRequirement";
			}
		});

		self.onAllChangeEvent = new TF.Events.Event();
		self.highlightChangedEvent = new TF.Events.Event();
		self.selectedChangedEvent = new TF.Events.Event();
		self.settingChangeEvent = new TF.Events.Event();

		self.tripDataModel.onCandidatesStudentsChangeToMapEvent.subscribe(this.onCandidatesStudentsChangeEvent.bind(this));
		self.tripDataModel.onTripsChangeEvent.subscribe(this.onTripsChangeEvent.bind(this));

	}

	UnassignedStudentDataModel.prototype = Object.create(TF.RoutingMap.BaseMapDataModel.prototype);
	UnassignedStudentDataModel.prototype.constructor = UnassignedStudentDataModel;

	UnassignedStudentDataModel.prototype.init = function()
	{
	};

	UnassignedStudentDataModel.prototype.onCandidatesStudentsChangeEvent = function()
	{
		var self = this;
		self.viewModel.drawTool && self.viewModel.drawTool.deferRefreshCandidateTripArrow();
		self.all = this.tripDataModel.routingStudentManager.getCandidatesOnMap().filter(function(item) { return item.XCoord; });
		self.refreshSelectAndHighlighted();
		self.viewModel._viewModal.RoutingMapTool.reloadThematicsTool(self.all, []);
	};

	UnassignedStudentDataModel.prototype.onTripsChangeEvent = function()
	{
		if (this.tripViewModel.dataModel.trips.length == 0)
		{
			this.clearCandidateStudent();
		}

		var editTrips = this.tripViewModel.dataModel.getEditTrips();
		if (editTrips.length > 0 && TF.RoutingMap.RoutingPalette.RoutingDataModel.sessions[editTrips[0].Session].name.toLocaleLowerCase() == 'both')
		{
			this.isMidTrip = true;
		}
		else
		{
			this.isMidTrip = false;
		}
	};

	UnassignedStudentDataModel.prototype.clearCandidateStudent = function()
	{
		this.all = [];
		this.refreshSelectAndHighlighted();
	};

	UnassignedStudentDataModel.prototype.getDrawTool = function()
	{
		return this.viewModel.drawTool;
	};

	UnassignedStudentDataModel.prototype.sortSelected = function(source)
	{
		return Enumerable.From(source).OrderBy(r => r.LastName).ThenBy(r => r.FirstName).ToArray();
	};

	UnassignedStudentDataModel.prototype._getDataModelItems = function(items)
	{
		var self = this;
		var records = [];
		items.forEach(function(item)
		{
			var key = item.key ? item.key : item;
			var selectedItem = self.tripDataModel.routingStudentManager.students[key];
			if (selectedItem)
			{
				records.push(selectedItem);
			}
		});
		return Enumerable.From(records).Distinct(function(c) { return c.key; }).ToArray();
	};

	UnassignedStudentDataModel.prototype.getStudentById = function(key)
	{
		return this.tripDataModel.routingStudentManager.students[key];
	};

	// #region setting

	UnassignedStudentDataModel.prototype.getStorage = function()
	{
		return {
			autoRefresh: { key: "autoRefreshUnassignedStudent", default: false },
			notAutoAssign: { key: "notAutoAssignUnassignedStudent", default: true },
			daysCheckList: { key: "daysCheckListOfStudent", default: [true, true, true, true, true, true, true] },
			attendingSchoolCheckList: { key: "attendingSchoolCheckListOfStudent", default: [true, false] },
			notAttendingSchoolCheckList: { key: "notAttendingSchoolCheckList", default: [false, false] },
			attendingUnassignedSymbol: { key: "attendingUnassignedSymbol", default: { symbol: "0", size: "10", color: "#1940aa", borderishow: true, bordersize: "1", bordercolor: "#000000" } },
			attendingScheduledSymbol: { key: "attendingScheduledSymbol", default: { symbol: "0", size: "10", color: "#1940aa", borderishow: true, bordersize: "1", bordercolor: "#000000" } },
			notAttendingUnassignedSymbol: { key: "notAttendingUnassignedSymbol", default: { symbol: "0", size: "10", color: "#1940aa", borderishow: true, bordersize: "1", bordercolor: "#000000" } },
			notAttendingScheduledSymbol: { key: "notAttendingScheduledSymbol", default: { symbol: "0", size: "10", color: "#1940aa", borderishow: true, bordersize: "1", bordercolor: "#000000" } },
			showLegend: { key: "showLegendUnassignedStudent", default: true },
			dateRange: { key: "dateRange", default: ['', ''] },
			attendingUnassignedFilter: { key: "attendingUnassignedFilter", default: ''},
			attendingScheduledFilter: { key: "attendingScheduledFilter", default: ''},
			notAttendingUnassignedFilter: { key: "notAttendingUnassignedFilter", default: ''},
			notAttendingScheduledFilter: { key: "notAttendingScheduledFilter", default: ''},
			attendingUnassignedFilterName: { key: "attendingUnassignedFilterName", default: ''},
			attendingScheduledFilterName: { key: "attendingScheduledFilterName", default: ''},
			notAttendingUnassignedFilterName: { key: "notAttendingUnassignedFilterName", default: ''},
			notAttendingScheduledFilterName: { key: "notAttendingScheduledFilterName", default: ''}
		};
	};

	UnassignedStudentDataModel.prototype.getCandidateSetting = function()
	{
		var setting = this.getSetting(true);
		return {
			monday: setting.daysCheckList[0],
			tuesday: setting.daysCheckList[1],
			wednesday: setting.daysCheckList[2],
			thursday: setting.daysCheckList[3],
			friday: setting.daysCheckList[4],
			saturday: setting.daysCheckList[5],
			sunday: setting.daysCheckList[6],
			startDate: setting.dateRange[0],
			endDate: setting.dateRange[1],
			inCriteriaUnassigned: setting.attendingSchoolCheckList[0],
			inCriteriaScheduledElsewhere: setting.attendingSchoolCheckList[1],
			notInCriteriaUnassigned: setting.notAttendingSchoolCheckList[0],
			notInCriteriaScheduledElsewhere: setting.notAttendingSchoolCheckList[1],
			attendingUnassignedSymbol: setting.attendingUnassignedSymbol,
			attendingScheduledSymbol: setting.attendingScheduledSymbol,
			notAttendingUnassignedSymbol: setting.notAttendingUnassignedSymbol,
			notAttendingScheduledSymbol: setting.notAttendingScheduledSymbol,
			showLegend: setting.showLegend,
			attendingUnassignedFilter: setting.attendingUnassignedFilter,
			attendingScheduledFilter: setting.attendingScheduledFilter,
			notAttendingUnassignedFilter: setting.notAttendingUnassignedFilter,
			notAttendingScheduledFilter: setting.notAttendingScheduledFilter
		};
	};

	UnassignedStudentDataModel.prototype.getSetting = function(noPromise)
	{
		var self = this;
		if (!self.currentSettings)
		{
			self.currentSettings = self.getStorageSetting();
		}
		return noPromise ? self.currentSettings : Promise.resolve(self.currentSettings);
	}
	UnassignedStudentDataModel.prototype.getStorageSetting = function()
	{
		var self = this;
		return TF.RoutingMap.BaseMapDataModel.prototype.getSetting.call(self, "", true);
	}


	// #endregion

	UnassignedStudentDataModel.prototype.dispose = function()
	{
		this.currentSettings = null;
	};

})();
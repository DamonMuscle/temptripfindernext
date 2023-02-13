(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").UnassignedStudentLockData = UnassignedStudentLockData;

	function UnassignedStudentLockData(dataModel)
	{
		var options = {};
		this.dataModel = dataModel;
		this.tripDataModel = dataModel.tripDataModel;
		this.viewModel = dataModel.viewModel.viewModel;
		options.type = function()
		{
			return "student";
		};
		options.displayName = "Student";
		options.viewModel = this.viewModel;
		options.getAutoRefreshSetting = this.getUnAssignStudentAutoRefreshSetting.bind(this);
		options.refreshOtherChangeData = this.refreshOtherChangeData.bind(this);
		TF.RoutingMap.LockData.call(this, options);
	}

	UnassignedStudentLockData.prototype = Object.create(TF.RoutingMap.LockData.prototype);
	UnassignedStudentLockData.prototype.constructor = UnassignedStudentLockData;

	UnassignedStudentLockData.prototype.getUnAssignStudentAutoRefreshSetting = function()
	{
		return this.dataModel.getSettingByKey(this.dataModel.getStorage().autoRefresh.key, this.dataModel.routeState, false);
	};

	UnassignedStudentLockData.prototype.refreshOtherChangeData = function(updatedRecords)
	{
		var self = this;

		if (updatedRecords.length > 0 && self.tripDataModel.trips.length > 0)
		{
			return self.tripDataModel.refreshCandidateStudent(null, null, true).then(function(changeIds)
			{
				if (changeIds && changeIds.length > 0)
				{
					return Promise.resolve(changeIds);
				}
				else
				{
					return Promise.resolve([]);
				}
			});
		}
		else
		{
			return Promise.resolve([]);
		}
	};

	/**
	* call api to notify other change 
	*/
	UnassignedStudentLockData.prototype.updateRecords = function()
	{
		var self = this;
		TF.RoutingMap.LockData.prototype.updateRecords.call(this, [{
			Id: 0, // Unassigned Student just need a notify of change, so use the first id.
			Type: self.options.type(),
			Operation: "edit"
		}]);
	};

})();
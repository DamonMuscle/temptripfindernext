(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").NonEligibleZoneLockData = NonEligibleZoneLockData;

	function NonEligibleZoneLockData(dataModel)
	{
		TF.DataEntry.SchoolDataEntryNonEligibleLockData.call(this, dataModel);
	}

	NonEligibleZoneLockData.prototype = Object.create(TF.DataEntry.SchoolDataEntryNonEligibleLockData.prototype);
	NonEligibleZoneLockData.prototype.constructor = NonEligibleZoneLockData;

	NonEligibleZoneLockData.prototype.refreshOtherChangeData = function(refreshIds)
	{
		var self = this;
		if (!refreshIds || refreshIds.length == 0)
		{
			return Promise.resolve();
		}
		var oldStudents = this.dataModel.getAllStudentInNEZ();
		return TF.DataEntry.SchoolDataEntryNonEligibleLockData.prototype.refreshOtherChangeData.call(this, refreshIds).then(function()
		{
			return self.dataModel.refresh(oldStudents);
		});
	};

})();
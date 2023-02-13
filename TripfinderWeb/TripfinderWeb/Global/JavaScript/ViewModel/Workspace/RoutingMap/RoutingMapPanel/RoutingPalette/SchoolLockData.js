(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").SchoolLockData = SchoolLockData;

	function SchoolLockData(dataModel)
	{
		var options = {};
		this.dataModel = dataModel;
		this.viewModel = dataModel.viewModel;
		options.type = function()
		{
			return "School";
		};
		options.displayName = "School";
		options.viewModel = dataModel.viewModel.viewModel;
		TF.RoutingMap.LockData.call(this, options);
		this.init();
	}

	SchoolLockData.prototype = Object.create(TF.RoutingMap.LockData.prototype);
	SchoolLockData.prototype.constructor = SchoolLockData;

	SchoolLockData.prototype.init = function()
	{
		var self = this;
		this.dataModel.onTripsChangeEvent.subscribe(function()
		{
			var alreadyLockIds = self.selfLockIds();
			var unLockSchoolIds = alreadyLockIds.slice();
			self.dataModel.getEditTrips().forEach(function(trip)
			{
				var schoolIds = trip.SchoolIds.split("!").filter(function(c) { return c; });
				unLockSchoolIds = alreadyLockIds.filter(function(c) { return schoolIds.indexOf(c) < 0; });
				var lockSchoolIds = schoolIds.filter(function(c) { return c && alreadyLockIds.indexOf(c) < 0; });
				if (lockSchoolIds.length > 0)
				{
					self.lockIds(lockSchoolIds);
				}
			});

			if (unLockSchoolIds.length > 0)
			{
				self.unLock(unLockSchoolIds);
			}
		});
	};

	SchoolLockData.prototype.dispose = function()
	{
		this.unLockCurrentDocument();
		TF.RoutingMap.LockData.prototype.dispose.call(this);
	};
})();

(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingLockData = RoutingLockData;

	function RoutingLockData(dataModel)
	{
		var options = {};
		this.dataModel = dataModel;
		this.viewModel = dataModel.viewModel;
		options.type = function()
		{
			return "fieldtrip";
		};
		options.displayName = "Field Trip";
		options.featureData = this.dataModel.featureData;
		options.viewModel = dataModel.viewModel.viewModel;
		options.getAutoRefreshSetting = this.dataModel.getAutoRefreshSetting;
		options.refreshOtherChangeData = this.refreshOtherChangeData.bind(this);
		options.extraInfo = function()
		{
			return dataModel.viewModel.viewModel.routeState;
		};
		TF.RoutingMap.LockData.call(this, options);
	}

	RoutingLockData.prototype = Object.create(TF.RoutingMap.LockData.prototype);
	RoutingLockData.prototype.constructor = RoutingLockData;

	/**
	 * only auto refresh view trips
	 * @param {Array} updatedRecords
	 */
	RoutingLockData.prototype.filterUpdatedRecords = function(updatedRecords)
	{
		var viewTrips = this.dataModel.getViewTrips();
		return updatedRecords.filter(function(item)
		{
			return Enumerable.From(viewTrips).Any(function(c) { return c.id == item.RecordId; });
		});
	};

	RoutingLockData.prototype.displayUpdatedRecords = function(updatedRecords)
	{
		updatedRecords = this.filterUpdatedRecords(updatedRecords);
		TF.RoutingMap.LockData.prototype.displayUpdatedRecords.call(this, updatedRecords);
	};

	RoutingLockData.prototype.refreshOtherChangeData = function(refreshIds)
	{
		var self = this;
		var remainViewTrips = [];
		var refreshViewTrips = [];
		self.dataModel.getViewTrips().forEach(function(c)
		{
			if (Enumerable.From(refreshIds).Any(function(id) { return id == c.id; }))
			{
				refreshViewTrips.push(c);
			} else
			{
				remainViewTrips.push(c);
			}
		});
		// self.dataModel.closeByViewTrips(refreshViewTrips);
		self.dataModel.closeByViewFieldTrips(refreshViewTrips);
		return self.dataModel.setViewFieldTrips(refreshViewTrips.concat(remainViewTrips));
	};

	RoutingLockData.prototype.calcSelfChangeCount = function() { };

	RoutingLockData.prototype.saveData = function(changeData)
	{
		var self = this;
		var updatedRecords = [];
		changeData.forEach(function(item)
		{
			var record = {
				Id: item.id,
				Type: self.options.type(),
				Operation: "edit"
			};
			if (item.oldId == item.id)
			{
				updatedRecords.push(record);
			}
		});
		self.updateRecords(updatedRecords);
	};

	RoutingLockData.prototype.unLock = function(tripIds)
	{
		var self = this;
		TF.RoutingMap.LockData.prototype.unLock.apply(this, arguments);
		if (tripIds && !$.isArray(tripIds))
		{
			tripIds = [tripIds];
		}
		tripIds = tripIds || (this.lockInfo.selfLockedList || []).map(function(c) { return c.id; });
		if (tripIds.length == 0)
		{
			return;
		}
		tripIds.forEach(function(tripId)
		{
			// TF.RoutingMap.RoutingPalette.RoutingDataModel.unLockRoutingStudentByTrip(tripId);
		});
	};

})();
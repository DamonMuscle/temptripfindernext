(function()
{
	createNamespace("TF.RoutingMap.TravelScenariosPalette").TravelScenariosLockData = TravelScenariosLockData;

	function TravelScenariosLockData()
	{

	}

	TravelScenariosLockData.prototype = Object.create(TF.LockData.prototype);
	TravelScenariosLockData.prototype.constructor = TravelScenariosLockData;

	TravelScenariosLockData.prototype.setLock = function(options)
	{
		var self = this;
		return TF.LockData.prototype.setLock.call(self, options).then(function(lockInfo)
		{
			self.updateRecords(options);
			return lockInfo;
		});
	};
	TravelScenariosLockData.prototype.getLockInfo = function()
	{
		return tf.lockData.setLock({
			ids: [],
			extraInfo: "",
			type: "travelScenarios",
			isLock: true,
			databaseId: "-999"
		}).then(function(lockInfo)
		{
			var lockedByInfo;
			if (lockInfo && lockInfo.lockedByOtherList && lockInfo.selfLockedList)
			{
				lockedByInfo = lockInfo.lockedByOtherList[0] ? lockInfo.lockedByOtherList[0] : lockInfo.selfLockedList[0];
			}
			return lockedByInfo;
		});
	};

	TravelScenariosLockData.prototype.updateRecords = function(options)
	{
		var updatedRecords = [{
			Id: options.ids.toString(),
			Type: "travelScenarios",
			Operation: ""
		}];
		return TF.RoutingMap.MapUpdatedRecordsHubHelper.prototype.updateRecords(updatedRecords, "MapCanvasUpdatedRecordsHub");
	};

})();
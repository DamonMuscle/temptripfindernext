(function()
{
	createNamespace("TF.RoutingMap.TravelScenariosPalette").TravelRegionsLockData = TravelRegionsLockData;

	function TravelRegionsLockData(options)
	{
		TF.RoutingMap.LockData.call(this, options);
	}

	TravelRegionsLockData.prototype = Object.create(TF.RoutingMap.LockData.prototype);
	TravelRegionsLockData.prototype.constructor = TravelRegionsLockData;

	TravelRegionsLockData.prototype.saveData = function(changeData)
	{
		var self = this;
		var updatedRecords = [];
		changeData.addGraphic.map(function(item)
		{
			var record = {
				Id: self._getId(item.attributes),
				Type: self.options.type(),
				Operation: "add",
				ScenarioId: item.attributes.ScenarioId
			};
			updatedRecords.push(record);
		});
		changeData.editGraphic.map(function(item)
		{
			var record = {
				Id: self._getId(item.attributes),
				Type: self.options.type(),
				Operation: "edit",
				ScenarioId: item.attributes.ScenarioId
			};
			updatedRecords.push(record);
		});
		changeData.deleteGraphic.map(function(item)
		{
			var record = {
				Id: self._getId(item.attributes),
				Type: self.options.type(),
				Operation: "delete",
				ScenarioId: item.attributes.ScenarioId
			};
			updatedRecords.push(record);
		});
		self.updateRecords(updatedRecords);
	};

	TravelRegionsLockData.prototype.updateRecords = function(updatedRecords)
	{
		var self = this;
		updatedRecords.forEach(function(item)
		{
			item.routeState = self.options.viewModel.routeState;

			self.updatedRecords[item.Id] = $.extend({}, item);
			self.updatedRecords[item.Id].ScenarioId = item.ScenarioId;
		});
		return TF.RoutingMap.MapUpdatedRecordsHubHelper.prototype.updateRecords(updatedRecords, "MapCanvasUpdatedRecordsHub");
	};
	var dataBaseWhiteList = ["travelRegion"];
	TravelRegionsLockData.prototype.onUpdateRecords = function(e, data)
	{
		var self = this;
		if (!self.options.viewModel.obShow())
		{
			return;
		}
		var updatedRecords = Enumerable.From(data.UpdatedRecords).Where(function(c)
		{
			if (dataBaseWhiteList.indexOf(c.Type) < 0 && data.DatabaseId != tf.datasourceManager.databaseId)
			{
				return false;
			}
			if (self.options.viewModel.travelScenariosViewModel.obSelectedTravelScenarios().Id != c.ScenarioId)
			{
				return false;
			}
			var isModifyBySelf = self.updatedRecords[c.RecordId] && c.UserId == self.getSelfUserId();
			if (isModifyBySelf && c.RouteState && c.RouteState != self.options.viewModel.routeState)
			{
				isModifyBySelf = false;
			}
			return c.Type == self.options.type() && !isModifyBySelf;
		}).ToArray();

		self.displayUpdatedRecords(updatedRecords);
	};
})();
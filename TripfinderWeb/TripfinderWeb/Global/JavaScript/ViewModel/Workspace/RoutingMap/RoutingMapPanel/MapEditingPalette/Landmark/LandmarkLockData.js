(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").LandmarkLockData = LandmarkLockData;

	function LandmarkLockData(dataModel)
	{
		var options = {};
		this.dataModel = dataModel;
		this.viewModel = dataModel.viewModel;
		options.type = function()
		{
			return "landmark";
		};
		options.displayName = "My Landmarks";
		options.featureData = this.dataModel.featureData;
		options.viewModel = dataModel.viewModel.viewModel;
		options.getAutoRefreshSetting = this.dataModel.getAutoRefreshSetting.bind(this.dataModel);
		options.refreshOtherChangeData = this.refreshOtherChangeData.bind(this);
		TF.RoutingMap.LockData.call(this, options);
	}

	LandmarkLockData.prototype = Object.create(TF.RoutingMap.LockData.prototype);
	LandmarkLockData.prototype.constructor = LandmarkLockData;

	LandmarkLockData.prototype.refreshOtherChangeData = function(refreshIds)
	{
		var self = this;
		var deleteData = [];
		if (!refreshIds || refreshIds.length == 0)
		{
			return Promise.resolve();
		}
		refreshIds.forEach(function(id)
		{
			for (var i = 0; i < self.dataModel.all.length; i++)
			{
				var obj = self.dataModel.all[i];
				if ((obj.geometry.type + "_" + obj.id) == id || (obj.geometry.type + "_" + obj.OBJECTID) == id)
				{
					deleteData.push(obj);
					self.dataModel.all.splice(i, 1);
					break;
				}
			}
		});
		this.dataModel.onAllChangeEvent.notify({ add: [], edit: [], delete: deleteData });
		return this.dataModel.featureData.query(refreshIds).then(function(source)
		{
			self.dataModel.all = self.dataModel.all.concat(source);
			self.dataModel.onAllChangeEvent.notify({ add: source, edit: [], delete: [] });
		});
	};

	LandmarkLockData.prototype.saveData = function(changeData)
	{
		var self = this;
		var updatedRecords = [];
		changeData.addGraphic.map(function(item)
		{
			var record = {
				Id: item.geometry.type + "_" + item.attributes.OBJECTID,
				Type: self.options.type(),
				Operation: "add"
			};
			updatedRecords.push(record);
		});
		changeData.editGraphic.map(function(item)
		{
			var record = {
				Id: item.geometry.type + "_" + item.attributes.OBJECTID,
				Type: self.options.type(),
				Operation: "edit"
			};
			updatedRecords.push(record);
		});
		changeData.deleteGraphic.map(function(item)
		{
			var record = {
				Id: item.geometry.type + "_" + item.attributes.OBJECTID,
				Type: self.options.type(),
				Operation: "delete"
			};
			updatedRecords.push(record);
		});

		TF.RoutingMap.LockData.prototype.updateRecords.call(self, updatedRecords);
	};

})();
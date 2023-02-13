(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").StopPoolLockData = StopPoolLockData;

	function StopPoolLockData(dataModel)
	{
		var options = {};
		this.dataModel = dataModel;
		this.viewModel = dataModel.viewModel;
		options.type = function()
		{
			return "StopPool";
		};
		options.displayName = "Stop Pool";
		options.featureData = this.dataModel.featureData.stopFeatureData;
		options.viewModel = dataModel.viewModel.parentViewModel;
		options.getAutoRefreshSetting = this.dataModel.getAutoRefreshSetting.bind(this.dataModel);
		options.refreshOtherChangeData = this.refreshOtherChangeData.bind(this);
		TF.RoutingMap.LockData.call(this, options);
	}

	StopPoolLockData.prototype = Object.create(TF.RoutingMap.LockData.prototype);
	StopPoolLockData.prototype.constructor = StopPoolLockData;

	StopPoolLockData.prototype.refreshOtherChangeData = function(refreshIds)
	{
		var self = this;
		var deleteData = [];
		var all = self.dataModel.all;
		if (!refreshIds || refreshIds.length == 0)
		{
			return Promise.resolve();
		}
		refreshIds.forEach(function(id)
		{
			for (var i = 0, l = all.length; i < l; i++)
			{
				if (all[i].OBJECTID == id)
				{
					deleteData.push(all[i]);
					break;
				}
			}
		});
		return this.dataModel.featureData.query(refreshIds).then(function(source)
		{
			self.dataModel.onAllChangeEvent.notify({ add: [], edit: [], delete: deleteData });
			self.dataModel.all = self.dataModel.all.filter(function(d)
			{
				return !Enumerable.From(refreshIds).Any(function(c) { return c == d.OBJECTID; });
			});
			self.dataModel.all = self.dataModel.all.concat(source);
			self.dataModel.onCandidatesStudentsChangeEvent();
			self.dataModel.onAllChangeEvent.notify({ add: source, edit: [], delete: [] });
		});
	};

})();
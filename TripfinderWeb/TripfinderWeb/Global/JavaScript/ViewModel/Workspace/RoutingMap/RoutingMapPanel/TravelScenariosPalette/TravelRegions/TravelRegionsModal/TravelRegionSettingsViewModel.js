(function()
{
	createNamespace("TF.RoutingMap.TravelScenariosPalette").TravelRegionSettingsViewModel = TravelRegionSettingsViewModel;

	function TravelRegionSettingsViewModel(travelRegionViewModel, type)
	{
		this.travelRegionViewModel = travelRegionViewModel;
		this.dataModel = travelRegionViewModel.dataModel;
		this.obAutoRefresh = ko.observable(false);
		this.obMoveDuplicateNodes = ko.observable(false);
		this.obRemoveOverlapping = ko.observable(false);
		this.defaults = {
			autoRefresh: false,
			moveDuplicateNode: false,
			removeOverlapTravelRegion: false
		}
	};

	TravelRegionSettingsViewModel.prototype.init = function(viewModel, e)
	{
		var self = this;
		self.getSetting().then(function(setting)
		{
			self.obAutoRefresh(setting.autoRefresh);
			self.obMoveDuplicateNodes(setting.moveDuplicateNode);
			self.obRemoveOverlapping(setting.removeOverlapping);
		})
	};

	TravelRegionSettingsViewModel.prototype.getSetting = function(viewModel, e)
	{
		return this.dataModel.getTravelRegionSetting();
	};

	TravelRegionSettingsViewModel.prototype.getStorageKey = function(viewModel, e)
	{
		return this.dataModel.getTravelRegionStorageKey();
	};

	TravelRegionSettingsViewModel.prototype.apply = function()
	{
		var self = this;
		var storageKey = self.getStorageKey();

		//set the last change of auto refresh
		tf.storageManager.save(storageKey.autoRefreshStorageKey, self.obAutoRefresh().toString());
		// tf.storageManager.saveOnCurrentDocument(storageKey.autoRefreshStorageKey, self.obAutoRefresh().toString());
		tf.storageManager.save(storageKey.moveDuplicateNodeStorageKey, self.obMoveDuplicateNodes().toString());
		tf.storageManager.save(storageKey.removeOverlappingStorageKey, self.obRemoveOverlapping().toString());
		self.dataModel.onSettingChangeEvent.notify();
		//PubSub.publish(topicCombine(pb.DATA_CHANGE, "travelregionsetting", pb.EDIT));

		return Promise.resolve(true);
	};

	TravelRegionSettingsViewModel.prototype.cancel = function()
	{
		return Promise.resolve(true);
	};

})();
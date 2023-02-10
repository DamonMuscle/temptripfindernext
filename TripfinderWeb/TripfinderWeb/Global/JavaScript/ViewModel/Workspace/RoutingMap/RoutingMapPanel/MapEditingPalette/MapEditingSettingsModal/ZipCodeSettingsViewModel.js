(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").ZipCodeSettingsViewModel = ZipCodeSettingsViewModel;

	function ZipCodeSettingsViewModel(zipCodeViewModel, type)
	{
		this.zipCodeViewModel = zipCodeViewModel;
		this.dataModel = zipCodeViewModel.dataModel;
		this.obAutoRefresh = ko.observable(false);
		this.obMoveDuplicateNodes = ko.observable(false);
		this.obRemoveOverlapping = ko.observable(false);
		this.defaults = {
			autoRefresh: false,
			moveDuplicateNode: false,
			removeOverlapZipCode: false
		}
	};

	ZipCodeSettingsViewModel.prototype.init = function(viewModel, e)
	{
		var self = this;
		self.getSetting().then(function(setting)
		{
			self.obAutoRefresh(setting.autoRefresh);
			self.obMoveDuplicateNodes(setting.moveDuplicateNode);
			self.obRemoveOverlapping(setting.removeOverlapping);
		})
	};

	ZipCodeSettingsViewModel.prototype.getSetting = function(viewModel, e)
	{
		return this.dataModel.getZipCodeSetting();
	};

	ZipCodeSettingsViewModel.prototype.getStorageKey = function(viewModel, e)
	{
		return this.dataModel.getZipCodeStorageKey();
	};

	ZipCodeSettingsViewModel.prototype.apply = function()
	{
		var self = this;
		var storageKey = self.getStorageKey();

		//set the last change of auto refresh
		tf.storageManager.save(storageKey.autoRefreshStorageKey, self.obAutoRefresh().toString());
		tf.storageManager.save(storageKey.moveDuplicateNodeStorageKey, self.obMoveDuplicateNodes().toString());
		tf.storageManager.save(storageKey.removeOverlappingStorageKey, self.obRemoveOverlapping().toString());
		// tf.storageManager.saveOnCurrentDocument(storageKey.autoRefreshStorageKey, self.obAutoRefresh().toString());
		// tf.storageManager.saveOnCurrentDocument(storageKey.moveDuplicateNodeStorageKey, self.obMoveDuplicateNodes().toString());
		// tf.storageManager.saveOnCurrentDocument(storageKey.removeOverlappingStorageKey, self.obRemoveOverlapping().toString());
		self.dataModel.onSettingChangeEvent.notify();
		//PubSub.publish(topicCombine(pb.DATA_CHANGE, "zipcodesetting", pb.EDIT));

		return Promise.resolve(true);
	};

	ZipCodeSettingsViewModel.prototype.cancel = function()
	{
		return Promise.resolve(true);
	};

})();
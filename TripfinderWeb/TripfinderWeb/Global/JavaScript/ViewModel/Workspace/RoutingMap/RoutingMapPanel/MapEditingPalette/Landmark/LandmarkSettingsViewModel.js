(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").LandmarkSettingsViewModel = LandmarkSettingsViewModel;

	function LandmarkSettingsViewModel(dataModel)
	{
		this.dataModel = dataModel;
		this.obAutoRefresh = ko.observable(false);
		this.obMoveDuplicateNodes = ko.observable(false);
		this.obRemoveOverlapping = ko.observable(false);
		this.defaults = {
			autoRefresh: false,
			moveDuplicateNodes: false,
			removeOverlapping: false
		};
	}

	LandmarkSettingsViewModel.prototype.init = function(viewModel, e)
	{
		var self = this;
		self.getSetting().then(function(setting)
		{
			self.obAutoRefresh(setting.autoRefresh);
			self.obMoveDuplicateNodes(setting.moveDuplicateNodes);
			self.obRemoveOverlapping(setting.removeOverlapping);
		});
	};

	LandmarkSettingsViewModel.prototype.getSetting = function(viewModel, e)
	{
		return this.dataModel.getSetting();
	};

	LandmarkSettingsViewModel.prototype.getStorageKey = function(viewModel, e)
	{
		return this.dataModel.getStorageKey();
	};

	LandmarkSettingsViewModel.prototype.apply = function()
	{
		var self = this;
		var storageKey = self.getStorageKey();
		// set the last change of auto refresh
		self.saveKey(storageKey.autoRefreshStorageKey, self.obAutoRefresh().toString());
		self.saveKey(storageKey.moveDuplicateNodesStorageKey, self.obMoveDuplicateNodes().toString());
		self.saveKey(storageKey.removeOverlappingStorageKey, self.obRemoveOverlapping().toString());
		self.dataModel.settingChangeEvent.notify();
		return Promise.resolve(true);
	};

	LandmarkSettingsViewModel.prototype.saveKey = function(key, value)
	{
		tf.storageManager.save(key, value);
		// tf.storageManager.saveOnCurrentDocument(key, value);
	};

	LandmarkSettingsViewModel.prototype.cancel = function()
	{
		return Promise.resolve(true);
	};

})();
(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").WaterSettingsViewModel = WaterSettingsViewModel;

	function WaterSettingsViewModel(dataModel)
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

	WaterSettingsViewModel.prototype.init = function()
	{
		var self = this;
		self.getSetting().then(function(setting)
		{
			self.obAutoRefresh(setting.autoRefresh);
			self.obMoveDuplicateNodes(setting.moveDuplicateNodes);
			self.obRemoveOverlapping(setting.removeOverlapping);
		});
	};

	WaterSettingsViewModel.prototype.getSetting = function()
	{
		return this.dataModel.getSetting();
	};

	WaterSettingsViewModel.prototype.getStorageKey = function()
	{
		return this.dataModel.getStorageKey();
	};

	WaterSettingsViewModel.prototype.apply = function()
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

	WaterSettingsViewModel.prototype.saveKey = function(key, value)
	{
		tf.storageManager.save(key, value);
		// tf.storageManager.saveOnCurrentDocument(key, value);
	};

	WaterSettingsViewModel.prototype.cancel = function()
	{
		return Promise.resolve(true);
	};

})();
(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").RailroadSettingsViewModel = RailroadSettingsViewModel;

	function RailroadSettingsViewModel(dataModel, type)
	{
		this.dataModel = dataModel;
		this.obAutoRefresh = ko.observable(false);
		this.obMoveDuplicateNodes = ko.observable(false);
		this.defaults = {
			autoRefresh: false,
			moveDuplicateNodes: false
		}
	};

	RailroadSettingsViewModel.prototype.init = function(viewModel, e)
	{
		var self = this;
		self.getSetting().then(function(setting)
		{
			self.obAutoRefresh(setting.autoRefresh);
			self.obMoveDuplicateNodes(setting.moveDuplicateNodes);
		});
	};

	RailroadSettingsViewModel.prototype.getSetting = function(viewModel, e)
	{
		return this.dataModel.getSetting();
	};

	RailroadSettingsViewModel.prototype.getStorageKey = function(viewModel, e)
	{
		return this.dataModel.getStorageKey();
	};

	RailroadSettingsViewModel.prototype.apply = function()
	{
		var self = this;
		var storageKey = self.getStorageKey();
		//set the last change of auto refresh
		self.saveKey(storageKey.autoRefreshStorageKey, self.obAutoRefresh().toString())
		self.saveKey(storageKey.moveDuplicateNodesStorageKey, self.obMoveDuplicateNodes().toString())
		self.dataModel.settingChangeEvent.notify();
		return Promise.resolve(true);
	};

	RailroadSettingsViewModel.prototype.saveKey = function(key, value)
	{
		tf.storageManager.save(key, value);
		// tf.storageManager.saveOnCurrentDocument(key, value);
	};

	RailroadSettingsViewModel.prototype.cancel = function()
	{
		return Promise.resolve(true);
	};

})();
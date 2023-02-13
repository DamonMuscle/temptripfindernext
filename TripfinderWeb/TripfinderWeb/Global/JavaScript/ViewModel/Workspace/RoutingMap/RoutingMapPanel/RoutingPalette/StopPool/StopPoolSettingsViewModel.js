(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").StopPoolSettingsViewModel = StopPoolSettingsViewModel;

	function StopPoolSettingsViewModel(dataModel)
	{
		this.dataModel = dataModel;
		this.obAutoRefresh = ko.observable(false);
		this.obMoveDuplicateNodes = ko.observable(false);
		this.obRemoveOverlapping = ko.observable(false);
		this.obFillPattern = ko.observable("Semi");
		this.obBoundaryThickness = ko.observable(5);
	}

	StopPoolSettingsViewModel.prototype.init = function()
	{
		var self = this;
		self.dataModel.getSetting().then(function(setting)
		{
			self.obAutoRefresh(setting.autoRefresh);
			self.obMoveDuplicateNodes(setting.moveDuplicateNodes);
			self.obRemoveOverlapping(setting.removeOverlapping);
			self.obFillPattern(setting.fillPattern);
			self.obBoundaryThickness(setting.boundaryThickness);
		});
	};

	StopPoolSettingsViewModel.prototype.apply = function()
	{
		var self = this;
		var storages = this.dataModel.getStorage();
		self.saveKey(storages.autoRefresh.key, self.obAutoRefresh().toString());
		self.saveKey(storages.moveDuplicateNodes.key, self.obMoveDuplicateNodes().toString());
		self.saveKey(storages.removeOverlapping.key, self.obRemoveOverlapping().toString());
		self.saveKey(storages.fillPattern.key, self.obFillPattern().toString());
		self.saveKey(storages.boundaryThickness.key, self.obBoundaryThickness().toString());
		self.dataModel.settingChangeEvent.notify();
		return Promise.resolve(true);
	};

	StopPoolSettingsViewModel.prototype.saveKey = function(key, value)
	{
		tf.storageManager.save(key, value);
		// tf.storageManager.saveOnCurrentDocument(key, value);
	};

	StopPoolSettingsViewModel.prototype.cancel = function()
	{
		return Promise.resolve(true);
	};

})();
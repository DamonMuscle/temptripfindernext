(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").MapEditingSettingsViewModel = MapEditingSettingsViewModel;

	function MapEditingSettingsViewModel(dataModel)
	{
		this.dataModel = dataModel;
		this.obShowDirection = ko.observable(false);
		this.obMoveDuplicateNodes = ko.observable(false);
		this.obShowInvalidJunctions = ko.observable(false);
		this.defaults = {
			showDirection: false,
			moveDuplicateNodes: false,
			showInvalidJunctions: false
		};
	}

	MapEditingSettingsViewModel.prototype.init = function(viewModel, e)
	{
		var self = this;
		self.getSetting().then(function(setting)
		{
			self.obShowDirection(setting.showDirection);
			self.obMoveDuplicateNodes(setting.moveDuplicateNodes);
			self.obShowInvalidJunctions(setting.showInvalidJunctions);
		});
	};

	MapEditingSettingsViewModel.prototype.getSetting = function(viewModel, e)
	{
		return this.dataModel.getSetting();
	};

	MapEditingSettingsViewModel.prototype.getStorageKey = function(viewModel, e)
	{
		return this.dataModel.getStorageKey();
	};

	MapEditingSettingsViewModel.prototype.apply = function()
	{
		var self = this;
		var storageKey = self.getStorageKey();
		self.saveKey(storageKey.showDirectionStorageKey, self.obShowDirection().toString());
		self.saveKey(storageKey.moveDuplicateNodesStorageKey, self.obMoveDuplicateNodes().toString());
		self.saveKey(storageKey.showInvalidJunctionsStorageKey, self.obShowInvalidJunctions().toString());
		self.dataModel.settingChangeEvent.notify();
		return Promise.resolve(true);
	};

	MapEditingSettingsViewModel.prototype.saveKey = function(key, value)
	{
		tf.storageManager.save(key, value);
	};

	MapEditingSettingsViewModel.prototype.cancel = function()
	{
		return Promise.resolve(true);
	};

})();
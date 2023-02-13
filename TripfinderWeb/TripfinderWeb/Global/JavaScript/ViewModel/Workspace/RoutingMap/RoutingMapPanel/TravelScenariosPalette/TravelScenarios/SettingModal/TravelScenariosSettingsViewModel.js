(function()
{
	createNamespace("TF.RoutingMap.TravelScenariosPalette").TravelScenariosSettingsViewModel = TravelScenariosSettingsViewModel;

	function TravelScenariosSettingsViewModel(dataModel)
	{
		this.dataModel = dataModel;
		this.obShowStreet = ko.observable(true);
		this.obShowCurb = ko.observable(false);
		this.obShowManeuvers = ko.observable(false);
		this.defaults = {
			showStreet: true,
			showCurb: false,
			showManeuvers: false
		};
		this.originalShowStreet = true;
		this.observeButtonStatus();
	}

	TravelScenariosSettingsViewModel.prototype.init = function()
	{
		var self = this;
		self.getSetting().then((setting) =>
		{
			this.obShowStreet(setting.showStreet);
			this.originalShowStreet = this.obShowStreet();
			self.obShowCurb(setting.showCurb);
			self.obShowManeuvers(setting.showManeuvers);
		});
	};

	TravelScenariosSettingsViewModel.prototype.observeButtonStatus = function()
	{
		this.obShowStreet.subscribe(() =>
		{
			if (!this.obShowStreet())
			{
				this.obShowCurb(false);
				this.obShowManeuvers(false);
			}
		});
	};

	TravelScenariosSettingsViewModel.prototype.getSetting = function()
	{
		return this.dataModel.getSetting();
	};

	TravelScenariosSettingsViewModel.prototype.getStorageKey = function()
	{
		return this.dataModel.getStorageKey();
	};

	TravelScenariosSettingsViewModel.prototype.apply = function()
	{
		var self = this;
		var storageKey = self.getStorageKey();
		self.saveKey(storageKey.showStreetStorageKey, self.obShowStreet().toString());
		self.saveKey(storageKey.showCurbStorageKey, self.obShowCurb().toString());
		self.saveKey(storageKey.showManeuversStorageKey, self.obShowManeuvers().toString());
		self.dataModel.settingChangeEvent.notify();
		return Promise.resolve({
			showStreet: this.obShowStreet(),
			originalShowStreet: this.originalShowStreet
		});
	};

	TravelScenariosSettingsViewModel.prototype.saveKey = function(key, value)
	{
		tf.storageManager.save(key, value);
	};

	TravelScenariosSettingsViewModel.prototype.cancel = function()
	{
		return Promise.resolve(true);
	};

})();
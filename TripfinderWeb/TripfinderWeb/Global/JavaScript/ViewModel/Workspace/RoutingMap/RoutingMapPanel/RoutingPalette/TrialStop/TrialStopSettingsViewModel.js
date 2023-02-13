(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").TrialStopSettingsViewModel = TrialStopSettingsViewModel;

	function TrialStopSettingsViewModel(dataModel)
	{
		this.dataModel = dataModel;
		this.prohibitCrosser = ko.observable(false);
		this.walkoutType = ko.observable(0);
		this.walkoutDistance = ko.observable(1000);
		this.walkoutBuffer = ko.observable(200);
		this.obUnits = ko.observableArray(["meters", "feet", "kilometers", "miles", "yards"]);
		this.obSelectedDistanceUnit = ko.observable(this.obUnits()[1]);
		this.obSelectedDistanceUnitText = ko.computed(function()
		{
			return this.obSelectedDistanceUnit();
		}, this);
		this.obSelectedBufferUnit = ko.observable(this.obUnits()[1]);
		this.obSelectedBufferUnitText = ko.computed(function()
		{
			return this.obSelectedBufferUnit();
		}, this);
	}

	TrialStopSettingsViewModel.prototype.init = function(model, el)
	{
		var self = this;
		self.dataModel.getSetting().then(function(setting)
		{
			self.prohibitCrosser(setting.prohibitCrosser);
			self.walkoutType(setting.walkoutType);
			self.walkoutDistance(setting.walkoutDistance);
			self.obSelectedDistanceUnit(setting.walkoutDistanceUnit);
			self.walkoutBuffer(setting.walkoutBuffer);
			self.obSelectedBufferUnit(setting.walkoutBufferUnit);
			self.initValidation(el);
		});
	};

	TrialStopSettingsViewModel.prototype.initValidation = function(el)
	{
		var self = this;
		setTimeout(function()
		{
			self.validator = $(el).bootstrapValidator({
				excluded: [":disabled"],
				live: "enabled",
				message: "This value is not valid",
				fields: {
					walkoutDistance: {
						trigger: "blur change",
						validators: {
							notEmpty: {
								message: "required"
							},
							greaterThan: {
								value: 0,
								message: " must be > 0",
								inclusive: false
							}
						}
					}, walkoutBuffer: {
						trigger: "blur change",
						validators: {
							notEmpty: {
								message: "required"
							},
							greaterThan: {
								value: 0,
								message: " must be > 0",
								inclusive: false
							}
						}
					}
				}
			}).data("bootstrapValidator");
		}, 1000);
	};

	TrialStopSettingsViewModel.prototype.apply = function()
	{
		var self = this;
		return self.validator.validate().then(function(valid)
		{
			if (valid)
			{
				var storages = self.dataModel.getStorage();
				self.saveKey(storages.prohibitCrosser.key, self.prohibitCrosser());
				self.saveKey(storages.walkoutType.key, self.walkoutType());
				self.saveKey(storages.walkoutDistance.key, self.walkoutDistance());
				self.saveKey(storages.walkoutDistanceUnit.key, self.obSelectedDistanceUnitText());
				self.saveKey(storages.walkoutBuffer.key, self.walkoutBuffer());
				self.saveKey(storages.walkoutBufferUnit.key, self.obSelectedBufferUnitText());
				self.dataModel.settingChangeEvent.notify();
				return true;
			}

			return false;
		});
	};

	TrialStopSettingsViewModel.prototype.saveKey = function(key, value)
	{
		tf.storageManager.save(key, value);
	};

	TrialStopSettingsViewModel.prototype.cancel = function()
	{
		return Promise.resolve(true);
	};

})();
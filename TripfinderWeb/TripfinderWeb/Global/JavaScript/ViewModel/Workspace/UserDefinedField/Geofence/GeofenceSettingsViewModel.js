(function()
{
	createNamespace("TF.UserDefinedField").GeofenceSettingsViewModel = GeofenceSettingsViewModel;

	function GeofenceSettingsViewModel(dataModel, options)
	{
		this.options = $.extend({
			isEditMode: true
		}, options);

		this.dataModel = dataModel;
		this.obMoveDuplicateNode = ko.observable(false);
		this.obRemoveOverlapping = ko.observable(false);
		this.isEditMode = ko.observable(this.options.isEditMode);
	}

	GeofenceSettingsViewModel.prototype.init = function()
	{
		var self = this;
		var setting = self.dataModel.settings || {};
		self.obMoveDuplicateNode(setting.moveDuplicateNode || false);
		self.obRemoveOverlapping(setting.removeOverlapping || false);
	};

	GeofenceSettingsViewModel.prototype.apply = function()
	{
		var self = this;
		self.dataModel.settings['moveDuplicateNode'] = self.obMoveDuplicateNode();
		self.dataModel.settings['removeOverlapping'] = self.obRemoveOverlapping();
		self.dataModel.settingChangeEvent.notify();
		return Promise.resolve(true);
	};

	GeofenceSettingsViewModel.prototype.cancel = function()
	{
		return Promise.resolve(true);
	};

})();
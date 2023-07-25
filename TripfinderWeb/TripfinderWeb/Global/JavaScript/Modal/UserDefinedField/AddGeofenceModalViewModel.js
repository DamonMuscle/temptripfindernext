(function()
{
	createNamespace("TF.Modal.UserDefinedField").AddGeofenceModalViewModel = AddGeofenceModalViewModel;

	function AddGeofenceModalViewModel(options)
	{
		var self = this;
		TF.Modal.BaseModalViewModel.call(self);
		self.options = options;
		self._init();
	}

	AddGeofenceModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	AddGeofenceModalViewModel.prototype.constructor = AddGeofenceModalViewModel;

	AddGeofenceModalViewModel.prototype._init = function()
	{
		var self = this,
			//type = self.options ? self.options.gridType : "[Type]",
			//isNew = !self.options.dataEntity,
			//isCopy = self.options.dataEntity && self.options.dataEntity.isCopy,
			title = `Geofence`;
		self.sizeCss = "modal-lg";
		self.title(title);
		self.contentTemplate('modal/UserDefinedField/AddGeofence');
		self.buttonTemplate('modal/positivenegative');
		self.obPositiveButtonLabel("Save");
		self.geofenceViewModel = new TF.UserDefinedField.AddGeofenceViewModel(self);
		self.data(self.geofenceViewModel);
	};

	AddGeofenceModalViewModel.prototype.init = function()
	{
		console.log('AddGeofenceModalViewModel.prototype.init');
	};

	AddGeofenceModalViewModel.prototype.positiveClick = function()
	{
		this.geofenceViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	AddGeofenceModalViewModel.prototype.negativeClick = function()
	{
		this.geofenceViewModel.cancel().then(() =>
		{
			this.negativeClose();
		})
	};
})();

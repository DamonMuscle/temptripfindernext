(function()
{
	createNamespace('TF.Modal').FieldTripResourceVehicleModalViewModel = FieldTripResourceVehicleModalViewModel;

	function FieldTripResourceVehicleModalViewModel(source, id)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.contentTemplate('modal/fieldtripResourceVehiclecontrol');
		this.buttonTemplate('modal/positivenegative');
		this.fieldTripResourceViewModel = new TF.Control.FieldTripResourceVehicleViewModel(source, id);
		this.data(this.fieldTripResourceViewModel);
		this.sizeCss = "modal-sm";

		var viewTitle;

		///this is going to check if the popup form is add new records or edit an existing record
		if (id)
		{
			viewTitle = "Edit " + tf.applicationTerm.getApplicationTermSingularByName("Field Trip") + " Resource - " + tf.applicationTerm.getApplicationTermSingularByName("Vehicle");
		}
		else
		{
			viewTitle = "Add " + tf.applicationTerm.getApplicationTermSingularByName("Field Trip") + " Resource - " + tf.applicationTerm.getApplicationTermSingularByName("Vehicle");
		}

		this.title(viewTitle);

		this.containerLoaded = ko.observable(false);
	}

	FieldTripResourceVehicleModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);

	FieldTripResourceVehicleModalViewModel.prototype.constructor = FieldTripResourceVehicleModalViewModel;

	FieldTripResourceVehicleModalViewModel.prototype.positiveClick = function()
	{
		this.fieldTripResourceViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	FieldTripResourceVehicleModalViewModel.prototype.negativeClose = function(returnData)
	{
		if (this.fieldTripResourceViewModel.obEntityDataModel().apiIsDirty())
		{
			return tf.promiseBootbox.yesNo({ message: "You have unsaved changes.  Would you like to save your changes prior to closing?", backdrop: true, title: "Unsaved Changes", closeButton: true })
				.then(function(result)
				{
					if (result === true)
					{
						return this.positiveClick();
					}
					if (result === false)
					{
						return TF.Modal.BaseModalViewModel.prototype.negativeClose.call(this, returnData);
					}
				}.bind(this));
		}
		else
		{
			TF.Modal.BaseModalViewModel.prototype.negativeClose.call(this, returnData);
		}
	};

	FieldTripResourceVehicleModalViewModel.prototype.dispose = function()
	{
		this.fieldTripResourceViewModel.dispose();
	};

})();

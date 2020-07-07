(function()
{
	createNamespace('TF.Modal').FieldTripResourceModalViewModel = FieldTripResourceModalViewModel;

	function FieldTripResourceModalViewModel(source, id, resourceGroupDate, obFieldTrip)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.obPositiveButtonLabel("Apply");
		this.contentTemplate('modal/fieldtripResourcecontrol');
		this.buttonTemplate('modal/positivenegative');
		this.fieldTripResourceViewModel = new TF.Control.FieldTripResourceViewModel(source, id, resourceGroupDate, obFieldTrip);
		this.data(this.fieldTripResourceViewModel);
		this.sizeCss = "modal-dialog-lg";

		var viewTitle = "Add " + tf.applicationTerm.getApplicationTermSingularByName("Field Trip") + " Resource";

		this.title(viewTitle);

		this.containerLoaded = ko.observable(false);
	}

	FieldTripResourceModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);

	FieldTripResourceModalViewModel.prototype.constructor = FieldTripResourceModalViewModel;

	FieldTripResourceModalViewModel.prototype.positiveClick = function()
	{
		this.fieldTripResourceViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	FieldTripResourceModalViewModel.prototype.negativeClose = function(returnData)
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

	FieldTripResourceModalViewModel.prototype.dispose = function()
	{
		this.fieldTripResourceViewModel.dispose();
	};

})();

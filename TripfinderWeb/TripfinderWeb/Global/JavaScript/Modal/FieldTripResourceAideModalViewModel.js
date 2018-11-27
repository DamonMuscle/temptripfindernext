(function()
{
	createNamespace('TF.Modal').FieldTripResourceAideModalViewModel = FieldTripResourceAideModalViewModel;

	function FieldTripResourceAideModalViewModel(source, id, resourceGroupDate)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.contentTemplate('modal/fieldtripResourceAidecontrol');
		this.buttonTemplate('modal/positivenegative');
		this.fieldTripResourceViewModel = new TF.Control.FieldTripResourceAideViewModel(source, id, resourceGroupDate);
		this.data(this.fieldTripResourceViewModel);
		this.sizeCss = "modal-dialog-lg";

		var viewTitle;

		///this is going to check if the popup form is add new records or edit an existing record
		if (id)
		{
			viewTitle = "Edit " + tf.applicationTerm.getApplicationTermSingularByName("Field Trip") + " Resource - " + tf.applicationTerm.getApplicationTermSingularByName("Bus Aide");
		}
		else
		{
			viewTitle = "Add " + tf.applicationTerm.getApplicationTermSingularByName("Field Trip") + " Resource - " + tf.applicationTerm.getApplicationTermSingularByName("Bus Aide");
		}

		this.title(viewTitle);

		this.containerLoaded = ko.observable(false);
	}

	FieldTripResourceAideModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);

	FieldTripResourceAideModalViewModel.prototype.constructor = FieldTripResourceAideModalViewModel;

	FieldTripResourceAideModalViewModel.prototype.positiveClick = function()
	{
		this.fieldTripResourceViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	FieldTripResourceAideModalViewModel.prototype.negativeClose = function(returnData)
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

	FieldTripResourceAideModalViewModel.prototype.dispose = function()
	{
		this.fieldTripResourceViewModel.dispose();
	};

})();

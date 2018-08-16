(function()
{
	createNamespace('TF.Modal').FieldTripResourceDriverModalViewModel = FieldTripResourceDriverModalViewModel;

	function FieldTripResourceDriverModalViewModel(source, id)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.contentTemplate('modal/fieldtripResourcedrivercontrol');
		this.buttonTemplate('modal/positivenegative');
		this.fieldTripResourceViewModel = new TF.Control.FieldTripResourceDriverViewModel(source, id);
		this.data(this.fieldTripResourceViewModel);
		this.sizeCss = "modal-dialog-lg";

		var viewTitle;

		///this is going to check if the popup form is add new records or edit an existing record
		if (id)
		{
			viewTitle = "Edit " + tf.applicationTerm.getApplicationTermSingularByName("Field Trip") + " Resource - " + tf.applicationTerm.getApplicationTermSingularByName("Driver");
		}
		else
		{
			viewTitle = "Add " + tf.applicationTerm.getApplicationTermSingularByName("Field Trip") + " Resource - " + tf.applicationTerm.getApplicationTermSingularByName("Driver");
		}

		this.title(viewTitle);

		this.containerLoaded = ko.observable(false);
	}

	FieldTripResourceDriverModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);

	FieldTripResourceDriverModalViewModel.prototype.constructor = FieldTripResourceDriverModalViewModel;

	FieldTripResourceDriverModalViewModel.prototype.positiveClick = function()
	{
		this.fieldTripResourceViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	FieldTripResourceDriverModalViewModel.prototype.negativeClose = function(returnData)
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

	FieldTripResourceDriverModalViewModel.prototype.dispose = function()
	{
		this.fieldTripResourceViewModel.dispose();
	};

})();

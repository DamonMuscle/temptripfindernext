(function()
{
	createNamespace('TF.Modal').FieldTripDestinationModalViewModel = FieldTripDestinationModalViewModel;

	function FieldTripDestinationModalViewModel(fieldName, id)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.contentTemplate('modal/fieldtripdestinationcontrol');
		this.buttonTemplate('modal/positivenegative');
		this.fieldTripDestinationViewModel = new TF.Control.FieldTripDestinationViewModel(fieldName, id);
		this.data(this.fieldTripDestinationViewModel);
		this.sizeCss = "modal-dialog-lg";

		var viewTitle;

		///this is going to check if the popup form is add new records or edit an existing record
		if (id)
		{
			viewTitle = "Edit " + tf.applicationTerm.getApplicationTermSingularByName("Destination");
		}
		else
		{
			viewTitle = "Add " + tf.applicationTerm.getApplicationTermSingularByName("Destination");
			this.buttonTemplate('modal/positivenegativeextend');
		}

		this.title(viewTitle);

		this.containerLoaded = ko.observable(false);
	}

	FieldTripDestinationModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);

	FieldTripDestinationModalViewModel.prototype.constructor = FieldTripDestinationModalViewModel;

	FieldTripDestinationModalViewModel.prototype.positiveClick = function()
	{
		this.fieldTripDestinationViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	FieldTripDestinationModalViewModel.prototype.saveAndNewClick = function()
	{
		this.fieldTripDestinationViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.fieldTripDestinationViewModel.obEntityDataModel(new TF.DataModel.FieldTripDestinationDataModel());
				this.newDataList.push(result);
			}
		}.bind(this));
	};

	FieldTripDestinationModalViewModel.prototype.negativeClose = function(returnData)
	{
		if (this.fieldTripDestinationViewModel.obEntityDataModel().apiIsDirty())
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

	FieldTripDestinationModalViewModel.prototype.dispose = function()
	{
		this.fieldTripDestinationViewModel.dispose();
	};

})();

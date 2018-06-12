(function()
{
	createNamespace('TF.Modal').FieldTripBillingClassificationModalViewModel = FieldTripBillingClassificationModalViewModel;

	function FieldTripBillingClassificationModalViewModel(fieldName, id)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.contentTemplate('modal/fieldtripbillingclassificationcontrol');
		this.buttonTemplate('modal/positivenegative');
		this.fieldTripBillingClassificationViewModel = new TF.Control.FieldTripBillingClassificationViewModel(fieldName, id);
		this.data(this.fieldTripBillingClassificationViewModel);
		this.sizeCss = "modal-dialog-lg";

		var viewTitle;

		///this is going to check if the popup form is add new records or edit an existing record
		if (id)
		{
			viewTitle = "Edit " + tf.applicationTerm.getApplicationTermSingularByName("Billing Classification");
		}
		else
		{
			viewTitle = "Add " + tf.applicationTerm.getApplicationTermSingularByName("Billing Classification");
			this.buttonTemplate('modal/positivenegativeextend');
		}

		this.title(viewTitle);
	}

	FieldTripBillingClassificationModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);

	FieldTripBillingClassificationModalViewModel.prototype.constructor = FieldTripBillingClassificationModalViewModel;

	FieldTripBillingClassificationModalViewModel.prototype.positiveClick = function()
	{
		this.fieldTripBillingClassificationViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	FieldTripBillingClassificationModalViewModel.prototype.negativeClose = function(returnData)
	{
		if (this.fieldTripBillingClassificationViewModel.obEntityDataModel().apiIsDirty())
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

	FieldTripBillingClassificationModalViewModel.prototype.saveAndNewClick = function()
	{
		this.fieldTripBillingClassificationViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.fieldTripBillingClassificationViewModel.obEntityDataModel(new TF.DataModel.FieldTripBillingClassificationDataModel());
				this.newDataList.push(result);
			}
		}.bind(this));
	};

	FieldTripBillingClassificationModalViewModel.prototype.dispose = function()
	{
		this.fieldTripBillingClassificationViewModel.dispose();
	};

})();


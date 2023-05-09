
(function()
{
	createNamespace('TF.Modal').FieldTripInvoiceModalViewModel = FieldTripInvoiceModalViewModel;

	function FieldTripInvoiceModalViewModel(option)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.obPositiveButtonLabel("Apply");
		this.contentTemplate('modal/fieldtripInvoicecontrol');
		this.buttonTemplate('modal/positivenegative');
		this.fieldTripInvoiceViewModel = new TF.Control.FieldTripInvoiceViewModel(option);
		this.data(this.fieldTripInvoiceViewModel);
		this.sizeCss = "modal-sm";
		this.title(`${option.operationType} Invoicing Information`);
	}

	FieldTripInvoiceModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);

	FieldTripInvoiceModalViewModel.prototype.constructor = FieldTripInvoiceModalViewModel;

	FieldTripInvoiceModalViewModel.prototype.positiveClick = function()
	{
		this.fieldTripInvoiceViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	FieldTripInvoiceModalViewModel.prototype.negativeClose = function(returnData)
	{
		if (this.fieldTripInvoiceViewModel.obEntityDataModel().apiIsDirty() ||
			this.fieldTripInvoiceViewModel.obSelectedAccountText() !== this.fieldTripInvoiceViewModel.obEntityDataModel()._entityBackup.AccountName)
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

	FieldTripInvoiceModalViewModel.prototype.dispose = function()
	{
		this.fieldTripInvoiceViewModel.dispose();
	};

})();
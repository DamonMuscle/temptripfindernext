(function()
{
	createNamespace('TF.Modal').ReportUserInformationModalViewModel = ReportUserInformationModalViewModel;

	function ReportUserInformationModalViewModel(fieldName, id)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.contentTemplate('modal/ReportUserInformationControl');
		this.buttonTemplate('modal/positivenegative');
		this.sizeCss = "modal-lg";
		this.viewModel = new TF.Control.ReportUserInformationViewModel();
		this.data(this.viewModel);
		this.title("Report User Information");
	}

	ReportUserInformationModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);

	ReportUserInformationModalViewModel.prototype.constructor = ReportUserInformationModalViewModel;

	ReportUserInformationModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	ReportUserInformationModalViewModel.prototype.negativeClose = function(returnData)
	{
		if (this.viewModel.obEntityDataModel().apiIsDirty())
		{
			return tf.promiseBootbox.yesNo({ message: "You have unsaved changes.  Would you like to save your changes prior to closing?", backdrop: true, title: "Unsaved Changes", closeButton: true })
				.then(function(result)
				{
					if (result == true)
					{
						return this.positiveClick();
					}
					if (result == false)
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


	ReportUserInformationModalViewModel.prototype.dispose = function()
	{
	};

})();

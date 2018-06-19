(function()
{
	createNamespace("TF.Modal").ManageReportsModalViewModel = ManageReportsModalViewModel;

	function ManageReportsModalViewModel()
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.sizeCss = "modal-dialog-lg manage-reports-modal";
		this.title('Manage Your Reports');
		this.obOtherButtonLabel("Restore Defaults");
		this.contentTemplate('modal/managereportscontrol');
		this.buttonTemplate('modal/positivenegativeother');
		this.obPositiveButtonLabel = ko.observable("Save");
		this.viewModel = new TF.Control.ManageReportsViewModel();
		this.data(this.viewModel);
	}

	ManageReportsModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	ManageReportsModalViewModel.prototype.constructor = ManageReportsModalViewModel;

	ManageReportsModalViewModel.prototype.otherClick = function()
	{
		this.viewModel.reset();
	};

	ManageReportsModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		this.viewModel.apply()
			.then(function(result)
			{
				this.positiveClose(true);
			}.bind(this));
	};


	ManageReportsModalViewModel.prototype.closeClick = function(viewModel, e)
	{
		if (this.viewModel.isChange())
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
						this.negativeClose();
					}
				}.bind(this));
		}
		this.negativeClose();
	};

})();
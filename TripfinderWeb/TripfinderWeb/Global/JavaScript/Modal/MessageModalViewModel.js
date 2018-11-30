(function()
{
	createNamespace("TF.Modal").MessageModalViewModel = MessageModalViewModel;

	function MessageModalViewModel(messageSettings)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Message Center");
		this.sizeCss = TF.isPhoneDevice ? "modal-center unsave-mobile message-center-mobile" : "modal-center message-center";
		this.obPositiveButtonLabel("Close");
		this.obOtherButtonLabel("Español");
		this.contentTemplate('modal/message');
		this.buttonTemplate('modal/PositiveNegativeOther');
		this.model = new TF.Control.MessageViewModel(this, messageSettings);
		this.data(this.model);
	}

	MessageModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	MessageModalViewModel.prototype.constructor = MessageModalViewModel;

	MessageModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		this.positiveClose();
	};

	MessageModalViewModel.prototype.negativeClick = function()
	{
		this.negativeClose();
	};

	MessageModalViewModel.prototype.otherClick = function()
	{
		this.model.changeLanguage();
	};

	MessageModalViewModel.prototype.dispose = function()
	{
		this.model.dispose();
	};
})();

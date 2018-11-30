(function()
{
	createNamespace('TF.Modal').SendEmailOfGridModalViewModel = SendEmailOfGridModalViewModel;

	function SendEmailOfGridModalViewModel(option)
	{
		TF.Modal.BaseModalViewModel.call(this);
		if (TF.isPhoneDevice)
		{
			this.modalClass = 'mobile-modal-grid-modal';
			this.sizeCss = "modal-fullscreen";
			this.contentTemplate('modal/SendEmailOfGridMobileControl');
			$("#pageMenu .show-menu-button").css('z-index', '1');
		}
		else
		{
			if(option.modelType === 'SendTo')
			{
				this.obDisableControl(true);
				this.title("Send To");
			}
			else
			{
				this.title("Email");
			}
			this.contentTemplate('modal/SendEmailOfGridControl');
			this.buttonTemplate('modal/positivenegative');
			this.obPositiveButtonLabel("Send");
		}
		this.sendEmailOfGridViewModel = new TF.Control.SendEmailOfGridViewModel(option, this.obDisableControl);
		this.data(this.sendEmailOfGridViewModel);
	}

	SendEmailOfGridModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	SendEmailOfGridModalViewModel.prototype.constructor = SendEmailOfGridModalViewModel;



	SendEmailOfGridModalViewModel.prototype.positiveClick = function()
	{
		this.sendEmailOfGridViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	SendEmailOfGridModalViewModel.prototype.negativeClick = function()
	{
		this.sendEmailOfGridViewModel.close().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	SendEmailOfGridModalViewModel.prototype.dispose = function()
	{
		$("#pageMenu .show-menu-button").css('z-index', '1999');
		this.sendEmailOfGridViewModel.dispose();
	};

})();

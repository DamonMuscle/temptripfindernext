(function()
{
	createNamespace("TF").TripfinderLoginViewModel = TripfinderLoginViewModel;

	TripfinderLoginViewModel.prototype = Object.create(TF.LoginViewModel.prototype);
	TripfinderLoginViewModel.prototype.constructor = TripfinderLoginViewModel;

	function TripfinderLoginViewModel()
	{
		var rememberMe = tf.storageManager.get("rememberMe", true) || false;
		this.obRememberMe = ko.observable(rememberMe);
		this.obClientKey = ko.observable('');
		this.obClientKeyWarning = ko.observable(false);
		this.obUsername = ko.observable('');
		this.obUsernameWarning = ko.observable(false);
		this.obPassword = ko.observable('');
		this.obPasswordWarning = ko.observable(false);
		this.obLoginErrorMessage = ko.observable('');
		this.obLoginConfigErrorMessageVisible = ko.observable(false);
		this.obClientKeyRP = ko.observable('');
		this.obUsernameRP = ko.observable('');
		this.obPasswordRP = ko.observable('');
		this.obVerifyPasswordRP = ko.observable('');
		this.obLoginErrorMessageRP = ko.observable('');
		if (this.obRememberMe())
		{
			this.obClientKey = ko.observable(tf.tokenStorageManager.get("clientKey", true) || '');
			this.obUsername = ko.observable(tf.storageManager.get("userName", true) || '');
			this.obPassword = ko.observable(tf.storageManager.get("password", true) || '');
		}
	}

	TripfinderLoginViewModel.prototype.cleanErrorMessage = function(viewModel, e)
	{
		switch (e.currentTarget.name)
		{
			case 'clientId':
				this.obClientKeyWarning(false);
				break;
			case 'userName':
				this.obUsernameWarning(false);
				break;
			case 'password':
				this.obPasswordWarning(false);
				break;
			default:
				break;
		}
	}

	//to avoid required field check, override apply function in TF.LoginViewModel
	TripfinderLoginViewModel.prototype.apply = function()
	{
		return this.signIn();
	}
})();
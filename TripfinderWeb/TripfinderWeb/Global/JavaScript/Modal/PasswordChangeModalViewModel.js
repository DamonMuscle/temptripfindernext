(function()
{
	createNamespace("TF.Modal").PasswordChangeModalViewModel = PasswordChangeModalViewModel;

	function PasswordChangeModalViewModel(currentDatabaseName)
	{
		var self = this
		TF.Modal.BaseModalViewModel.call(this);
		self.title("Change Password");
		self.sizeCss = "modal-sm";
		self.obPositiveButtonLabel("Change Password");
		self.contentTemplate('modal/passwordchangecontrol');
		if (currentDatabaseName)
		{
			self.buttonTemplate('modal/positivenegative');
		}
		else
		{
			self.buttonTemplate('modal/positive');
			self.obCloseButtonVisible(false);
		}
		self.passwordChangeViewModel = new TF.Control.PasswordChangeViewModel();
		self.data(self.passwordChangeViewModel);
	}

	PasswordChangeModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	PasswordChangeModalViewModel.prototype.constructor = PasswordChangeModalViewModel;

	PasswordChangeModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		var self = this
		passed = true;
		if (!self.passwordChangeViewModel.obCurrentPassword() || self.passwordChangeViewModel.obCurrentPassword().length == 0 || self.passwordChangeViewModel.obCurrentPassword().toString().trim().length == 0)
		{
			self.passwordChangeViewModel.obCurrentPasswordWarning("required");
			passed = false;
		}
		if (!self.passwordChangeViewModel.obNewPassword() || self.passwordChangeViewModel.obNewPassword().length == 0 || self.passwordChangeViewModel.obNewPassword().toString().trim().length == 0)
		{
			self.passwordChangeViewModel.obNewPasswordWarning(true);
			passed = false;
		}
		if (!self.passwordChangeViewModel.obConfirmNewPassword() || self.passwordChangeViewModel.obConfirmNewPassword().length == 0 || self.passwordChangeViewModel.obConfirmNewPassword().toString().trim().length == 0)
		{
			self.passwordChangeViewModel.obConfirmNewPasswordWarning(true);
			passed = false;
		}
		if (self.passwordChangeViewModel.obNewPassword() !== self.passwordChangeViewModel.obConfirmNewPassword())
		{
			self.passwordChangeViewModel.obChangePasswordErrorMessage("Confirm new password not match new password!");
			passed = false;
		}

		if (passed)
		{
			var userId = tf.authManager.authorizationInfo.authorizationTree.userId;
			var checkPasswordData = {
				data: {
					Password: self.passwordChangeViewModel.obCurrentPassword()
				}
			};

			tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "user", "checkpassword"), checkPasswordData)
				.then(function(apiResponse)
				{
					if (apiResponse.Items[0])
					{
						var changePasswordData = {
							data: {
								Password: self.passwordChangeViewModel.obNewPassword()
							}
						};
						tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "user", "ChangePassword"), changePasswordData)
							.then(function(apiResponse)
							{
								if (apiResponse.Items[0])
								{
									ga('send', 'event', 'Action', 'Password Changed');
									return this.passwordChangeViewModel.apply()
										.then(function(result)
										{
											if (result)
											{
												this.positiveClose(result);
											} else
											{
												this.negativeClose();
											}
										}.bind(this));
								}
							}.bind(this));
					}
					else
					{
						self.passwordChangeViewModel.obCurrentPasswordWarning("Current password was wrong!");
					}
				}.bind(this));
		}
	};
})();

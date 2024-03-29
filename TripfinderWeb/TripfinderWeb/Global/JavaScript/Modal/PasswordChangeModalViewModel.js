﻿(function()
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

	PasswordChangeModalViewModel.prototype.init = function(viewModel, el)
	{
		var self = this;
		self._$form = $(el);
		self.passwordChangeViewModel.pageLevelViewModel.load(self._$form.data("bootstrapValidator"));

	};

	PasswordChangeModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		var self = this
		passed = true;

		// Add starts with function for IE version less than 11
		if (!String.prototype.startsWith)
		{
			String.prototype.startsWith = function(searchString, position)
			{
				position = position || 0;
				return this.indexOf(searchString, position) === position;
			};
		}
		if (!self.passwordChangeViewModel.obCurrentPassword() || self.passwordChangeViewModel.obCurrentPassword().length == 0 || self.passwordChangeViewModel.obCurrentPassword().toString().trim().length == 0)
		{
			self.passwordChangeViewModel.obCurrentPasswordWarning("required");
			passed = false;
		}
		else
		{
			self.passwordChangeViewModel.obCurrentPasswordWarning("");
		}

		if (!self.passwordChangeViewModel.obNewPassword() || self.passwordChangeViewModel.obNewPassword().length == 0 || self.passwordChangeViewModel.obNewPassword().toString().trim().length == 0 || self.passwordChangeViewModel.obNewPassword().toString().startsWith(' '))
		{
			self.passwordChangeViewModel.obNewPasswordWarning("required");
			passed = false;
		}

		if (self.passwordChangeViewModel.obNewPassword() === self.passwordChangeViewModel.obCurrentPassword())
		{
			self.passwordChangeViewModel.obNewPasswordWarning("cannot be the same as Current Password");
			passed = false;
		}
		else
		{
			self.passwordChangeViewModel.obNewPasswordWarning("");
		}

		if (!self.passwordChangeViewModel.obConfirmNewPassword() || self.passwordChangeViewModel.obConfirmNewPassword().length == 0 || self.passwordChangeViewModel.obConfirmNewPassword().toString().trim().length == 0 || self.passwordChangeViewModel.obConfirmNewPassword().toString().startsWith(' '))
		{
			self.passwordChangeViewModel.obConfirmNewPasswordWarning("required");
			passed = false;
		}
		else if (self.passwordChangeViewModel.obNewPassword() !== self.passwordChangeViewModel.obConfirmNewPassword())
		{
			self.passwordChangeViewModel.obConfirmNewPasswordWarning("must match New Password");
			passed = false;
		}
		else
		{
			self.passwordChangeViewModel.obConfirmNewPasswordWarning("");
		}

		if (!passed)
		{
			return;
		}

		var userId = tf.authManager.authorizationInfo.authorizationTree.userId;
		var checkPasswordData = {
			paramData: {
				username: tf.authManager.authorizationInfo.authorizationTree.username,
				password: self.passwordChangeViewModel.obCurrentPassword()
			}
		};

		tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "users"), checkPasswordData)
			.then(function(apiResponse)
			{
				if (apiResponse.Items[0])
				{
					self.passwordChangeViewModel.obCurrentPasswordWarning("");
					passed = true;
				}

				if (passed)
				{
					var changePasswordData = {
						data: '"' + self.passwordChangeViewModel.obNewPassword() + '"'
					};
					tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "passwords"), changePasswordData)
						.then(function(apiResponse)
						{
							if (apiResponse.Items[0])
							{
								ga('send', 'event', 'Action', 'Password Changed');
								self.passwordChangeViewModel.pageLevelViewModel.popupSuccessMessage("Password Changed.");
								return this.passwordChangeViewModel.apply()
									.then(function(result)
									{
										if (result)
										{
											self.positiveClose(result);
										} else
										{
											self.negativeClose();
										}
									}.bind(self));
							}
						}.bind(self));
				}
			}.bind(this)).catch(function()
			{
				self.passwordChangeViewModel.obCurrentPasswordWarning("Current Password is incorrect.");
				passed = false;
			});
	};

	/**
	 * Dispose.
	 */
	PasswordChangeModalViewModel.prototype.dispose = function()
	{
		var self = this;
		self.passwordChangeViewModel.dispose();
	};

	PasswordChangeModalViewModel.prototype.negativeClick = function(viewModel, e)
	{
		if (this.passwordChangeViewModel.obCurrentPassword() || this.passwordChangeViewModel.obNewPassword() || this.passwordChangeViewModel.obConfirmNewPassword())
		{
			return tf.promiseBootbox.yesNo({ message: "Are you sure you want to cancel?", backdrop: true, title: "Unsaved Changes", closeButton: true })
			.then(function(result)
			{
				if (result)
				{
					this.negativeClose();
				}
			}.bind(this));
		}
		this.negativeClose();
	};
})();

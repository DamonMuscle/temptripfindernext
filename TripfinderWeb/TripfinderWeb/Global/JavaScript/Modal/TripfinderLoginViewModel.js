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
		this.obClientKey = ko.observable('');
		this.obUsername = ko.observable('');
		this.obPassword = ko.observable('');
		if (this.obRememberMe())
		{
			this.obClientKey(tf.storageManager.get("clientKey", true) || '');
			this.obUsername(tf.storageManager.get("userName", true) || '');
			this.obPassword(tf.storageManager.get("password", true) || '');
		}

		this.obSecurityCode = ko.observable("");
		this.obIsShowCode = ko.observable(false);
		this.obResendCodeCanClick = ko.observable(false);
		this.obLoginCodeErrorMessage = ko.observable("");
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

	TripfinderLoginViewModel.prototype.signIn = function()
	{
		return this.trySignIn(true);
	};

	TripfinderLoginViewModel.prototype.trySignIn = function(confirmLogged)
	{
		const self = this;
		return (self.obIsShowCode() ? self.validatePin(confirmLogged) : self.sendSignInRequest(confirmLogged)).catch(function(exceptionRes)
		{
			switch (exceptionRes.StatusCode)
			{
				case 412:
					if (exceptionRes.Message === "Logined")
					{
						return tf.promiseBootbox.yesNo("This account is currently logged in on another browser or device, and will be logged out if you proceed. Are you sure you want to continue?", "Confirm")
							.then(function(choice)
							{
								if (choice)
								{
									return self.trySignIn(false);
								}
								else
								{
									return Promise.reject({ Message: "User canceled" })
								}
							})
					}
					break;
			}

			if (self.obIsShowCode())
			{
				var message = exceptionRes.Message;
				if (typeof message === "string")
				{
					self.obLoginCodeErrorMessage(message);
				}
			}
			else
			{
				return Promise.reject(exceptionRes);
			}
		});
	}

	TripfinderLoginViewModel.prototype.validatePin = function(confirmLogged)
	{
		const self = this,
			prefix = tf.storageManager.prefix.split('.')[0],
			clientKey = $.trim(self.obClientKey()),
			userName = $.trim(self.obUsername()),
			securityCode = $.trim(self.obSecurityCode());

		return tf.promiseAjax.post(pathCombine(tf.api.server(), clientKey, "authinfos"), {
			paramData: {
				vendor: "Transfinder",
				securityCode: securityCode,
				username: userName,
				prefix: prefix,
				confirmLogged: confirmLogged
			}
		}, {
			auth: { noInterupt: true }
		}).then(apiResponse =>
		{
			const token = apiResponse.Items[0];
			return token;
		}).then((token) =>
		{
			return this.buildUserInfo(token);
		});
	};

	TripfinderLoginViewModel.prototype.buildUserInfo = function(token)
	{
		const self = this,
			clientKey = $.trim(self.obClientKey()),
			userName = $.trim(self.obUsername()),
			password = self.obPassword();

		tf.storageManager.delete("datasourceId", true, true);
		tf.entStorageManager.save("token", token, true);
		if (tf.authManager)
		{
			tf.authManager.token = token;
		}
		return { clientKey: clientKey, username: userName, password: password };
	}

	TripfinderLoginViewModel.prototype.sendSignInRequest = function(confirmLogged)
	{
		const self = this,
			clientKey = $.trim(self.obClientKey()),
			userName = $.trim(self.obUsername()),
			password = self.obPassword(),
			prefix = tf.storageManager.prefix.split('.')[0];

		return tf.promiseAjax.post(pathCombine(tf.api.server(), clientKey, "authinfos"), {
			paramData: {
				vendor: "Transfinder",
				prefix: prefix,
				username: userName,
				confirmLogged: confirmLogged
			},
			data: '"' + password + '"'
		}, {
			auth: { noInterupt: true }
		}).then(function(apiResponse)
		{
			const tokenResultString = apiResponse.Items[0];
			if (tokenResultString === 'MFA')
			{
				self.obIsShowCode(true);
				self.countDown();
			}
			else
			{
				return self.buildUserInfo(tokenResultString);
			}
		});
	};

	TripfinderLoginViewModel.prototype.countDown = function()
	{
		let timeLeft = 30;
		clearInterval(this.counter);
		this.obResendCodeCanClick(false);
		this.counter = setInterval(() =>
		{
			if (timeLeft-- <= 0)
			{
				this.obResendCodeCanClick(true);
				clearInterval(this.counter);
			}
		}, 1000);
	}

	TripfinderLoginViewModel.prototype.resendCodeClick = function()
	{
		const self = this,
			clientKey = $.trim(self.obClientKey()),
			userName = $.trim(self.obUsername());

		return tf.promiseAjax.post(pathCombine(tf.api.server(), clientKey, "authinfos/mfa"), {
			paramData: {
				username: userName
			}
		}, {
			auth: { noInterupt: true }
		}).then(() =>
		{
			self.countDown();
			self.obLoginCodeErrorMessage('');
		});
	};

	TripfinderLoginViewModel.prototype.backClick = function()
	{
		this.obIsShowCode(false);
		this.obSecurityCode("");
		this.obLoginCodeErrorMessage("");
		this.$form.data('bootstrapValidator').disableSubmitButtons(false);
	};
})();
(function()
{
	createNamespace("TF.Modal").TripfinderLoginModel = TripfinderLoginModel;

	function TripfinderLoginModel()
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.forgotPasswordClick = this.forgotPasswordClick.bind(this);
		this.resetPasswordClick = this.resetPasswordClick.bind(this);
		this.cancelClick = this.cancelClick.bind(this);
		this.obCloseButtonVisible(false);
		this.obShowLogin = ko.observable(true);
		this.title('');
		this.sizeCss = 'modal-fullscreen';
		this.type = TF.productName;
		this.contentTemplate('tripfinderLogin');
		this.buttonTemplate('');
		this.loginViewModel = new TF.TripfinderLoginViewModel();
		this.data(this.loginViewModel);
		this.validateIsForgetPassword();
	}

	TripfinderLoginModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	TripfinderLoginModel.prototype.constructor = TripfinderLoginModel;

	TripfinderLoginModel.prototype.validateIsForgetPassword = function()
	{
		var signature = getQueryString("signature"),
			clientid = getQueryString("clientid");
		this.signature = signature;
		if (signature && clientid)
		{
			tf.promiseAjax.post(pathCombine(tf.api.server(), clientid, "auth", "validateurl?signature=" + signature))
				.then(function(apiResponse)
				{
					this.obShowLogin(false);
					var auth = apiResponse.Items[0];
					this.loginViewModel.obClientKeyRP(auth.clientid);
					this.loginViewModel.obUsernameRP(auth.username);
				}.bind(this))
				.catch(function(apiResponse)
				{
					if (apiResponse.StatusCode == 417)
					{
						tf.promiseBootbox.alert("The reset password link that you used has expired. If you would like to reset your password, click Forgot Password? on the Login page, and a new reset password link will be emailed to you.", "Reset Password Link Has Expired")
							.then(function()
							{
								var emptyInput = $("input:text:empty");
								if (emptyInput.length > 0)
								{
									$(emptyInput[0]).focus();
								} else
								{
									$("#password").focus();
								}
							}.bind(this));
					} else
					{
						this.loginViewModel.obLoginErrorMessageRP(apiResponse.Message || 'A valid Client ID and User Name are required to reset a password.');
					}
				}.bind(this));
		}
	};

	TripfinderLoginModel.prototype.resetPasswordClick = function(viewModel, e)
	{
		this.loginViewModel.$form.data("bootstrapValidator")
			.validate()
			.then(function(result)
			{
				if (result)
				{
					this.resetPasswordDetails();
				}
			}.bind(this));
	};

	TripfinderLoginModel.prototype.resetPasswordDetails = function()
	{
		var clientKey = $.trim(this.loginViewModel.obClientKeyRP());
		var userName = $.trim(this.loginViewModel.obUsernameRP());
		var passwordRP = this.loginViewModel.obPasswordRP();
		var verifyPasswordRP = this.loginViewModel.obVerifyPasswordRP();
		if (clientKey === "" || userName === "")
		{
			this.loginViewModel.obLoginErrorMessageRP('A valid Client ID and User Name are required to reset a password.');
			return;
		}
		if ($.trim(passwordRP) === "" || $.trim(verifyPasswordRP) === "" || passwordRP != verifyPasswordRP)
		{
			this.loginViewModel.obLoginErrorMessageRP('Verify Password must match Password.');
			return;
		}
		if (this.signature)
		{
			tf.promiseAjax.post(pathCombine(tf.api.server(), clientKey, "auth", "resetpassword?signature=" + this.signature), {
				data: "'" + passwordRP + "'"
			})
				.then(function(apiResponse)
				{
					tf.promiseBootbox.alert("The Password for " + userName + " has been successfully Reset.", "Password Successfully Reset")
						.then(function()
						{
							this.showLogin();
						}.bind(this));
				}.bind(this))
				.catch(function(apiResponse)
				{
					tf.promiseBootbox.yesNo({
						buttons: {
							yes: {
								label: "Try Again",
								className: "tf-btn-black btn-sm"
							},
							no: {
								label: "Cancel",
								className: "btn-default btn-sm"
							}
						},
						message: "The Password for " + userName + " was not able to be Reset. You can try again or cancel and try later."
					},
						"Unabel to Reset Password")
						.then(function(result)
						{
							if (!result)
							{
								this.showLogin();
							}
						}.bind(this));
				}.bind(this));
		}
	};

	TripfinderLoginModel.prototype.showLogin = function()
	{
		this.obShowLogin(true);
		$("#password").focus();
		var host = window.location.origin + window.location.pathname;
		window.history.pushState({}, "Tripfinder", host);
	};

	TripfinderLoginModel.prototype.cancelClick = function(viewModel, e)
	{
		tf.promiseBootbox.yesNo("Are you sure that you want to cancel your password reset.",
			"Confirmation Message")
			.then(function(result)
			{
				if (result)
				{
					this.showLogin();
				}
			}.bind(this));
	};

	TripfinderLoginModel.prototype.forgotPasswordClick = function(viewModel, e)
	{
		var clientKey = $.trim(this.loginViewModel.obClientKey());
		var userName = $.trim(this.loginViewModel.obUsername());
		if (clientKey === "" || userName === "")
		{
			this.loginViewModel.obLoginErrorMessage('A valid Client ID and User Name are required to reset a password.');
			return;
		}
		tf.tokenStorageManager.save("token", "");
		tf.promiseAjax.get(pathCombine(tf.api.server(), $.trim(this.loginViewModel.obClientKey()), "auth", "forgotpassword", "tripfinder", userName, "Transfinder"))
			.then(function(apiResponse)
			{
				this.loginViewModel.obLoginErrorMessage('');
				tf.promiseBootbox.alert("An email has been sent to you with instructions for resetting your password.", "Password Reset Email Sent")
					.then(function()
					{
						$("#password").focus();
					});
			}.bind(this))
			.catch(function(apiResponse)
			{
				this.loginViewModel.obLoginErrorMessage('');
				if (apiResponse.StatusCode == 404)
				{
					var message = apiResponse.Message || 'A valid Client ID and User Name are required to reset a password.';
					this.loginViewModel.obLoginErrorMessage(message);
				} else
				{
					tf.promiseBootbox.alert("An email could not be sent. Please contact your System Administrator to verify " + TF.productName + "'s email configuration and settings.", "Password Reset Email Could Not be Sent")
						.then(function()
						{
							$("#password").focus();
						}.bind(this));
				}
			}.bind(this));
	};

	TripfinderLoginModel.prototype.positiveClick = function(viewModel, e)
	{
		if (!this.checkRequiredField())
		{
			return;
		}

		this.loginViewModel.obLoginConfigErrorMessageVisible(false);
		tf.storageManager.save("rememberMe", this.loginViewModel.obRememberMe(), true);
		this.loginViewModel.apply()
			.then(function(result)
			{
				if (result)
				{
					tf.promiseAjax.get(pathCombine(tf.api.server(), $.trim(this.loginViewModel.obClientKey()), "auth", "authorization"), {
						error: function(message, status)
						{
							if (message)
							{
								this.loginViewModel.obLoginErrorMessage(message.Message);
							}
						}.bind(this)
					}, {
							auth: {
								noInterupt: true
							}
						})
						.then(function(apiResponse)
						{
							var authorizationInfo = new TF.AuthorizationInfo(apiResponse.Items[0]);
							if (!tf.authManager.clientKey)
							{
								tf.authManager.clientKey = this.loginViewModel.obClientKey();
							}
							tf.authManager.getPurchasedProducts()
								.then(function(purchasedProducts)
								{
									this.loginViewModel.obLoginErrorMessage('');
									if (purchasedProducts.indexOf("Tripfinder") === -1)
									{
										this.loginViewModel.obLoginErrorMessage('Tripfinder is not enabled for this Client ID.  Contact us at support@transfinder.com or 888-427-2403 to inquire about enabling this product.');
										return;
									}

									var ft1 = authorizationInfo.isAuthorizedFor("level1Requestor", "read");
									var ft2 = authorizationInfo.isAuthorizedFor("level2Administrator", "read");
									var ft3 = authorizationInfo.isAuthorizedFor("level3Administrator", "read");
									var ft4 = authorizationInfo.isAuthorizedFor("level4Administrator", "read");
									var ft5 = authorizationInfo.isAuthorizedFor("transportationAdministrator", "read");
									var ft = ft1 || ft2 || ft3 || ft4 || ft5;

									var flt = authorizationInfo.isAuthorizedFor("filters", "read");

									var pfiledtrip = authorizationInfo.isAuthorizedFor("filedtrip", "read");

									if (!(ft || pfiledtrip))
									{
										this.loginViewModel.obLoginErrorMessage('User is not authorized for any page.');
										return;
									} else
									{
										if (this.loginViewModel.obClientKey() !== "support")
										{
											tf.tokenStorageManager.save("clientKey", this.loginViewModel.obClientKey(), true);
											tf.storageManager.save("userName", this.loginViewModel.obUsername(), true);
											tf.storageManager.save("password", this.loginViewModel.obPassword(), true);

											//set clientKey in case to use it when get all preference
											tf.authManager.clientKey = this.loginViewModel.obClientKey();
											this.positiveClose(result);

										} else
										{
											this.positiveClose(result);
										}
									}
								}.bind(this));
						}.bind(this))
						.catch(function() { });
				}
			}.bind(this))
			.catch(function(apiResponse)
			{
				if (apiResponse)
				{
					if (apiResponse.Message === "Invalid Time")
					{
						apiResponse.Message = "You cannot login. Your computer's current time does not match the server " + TF.productName + " is installed on. Contact your System Administrator.";
					}
					if (apiResponse.Message === "Invalid Configurations")
					{
						apiResponse.Message = TF.productName + " is not properly configured.  You cannot login.  Contact us at support@transfinder.com or 888-427-2403.";
					}
					if (apiResponse.StatusCode == 401)
					{
						var message = apiResponse.Message || 'Invalid Client ID, User Name and Password combination.';
						this.loginViewModel.obLoginErrorMessage(message);
					} else
					{
						this.loginViewModel.obLoginErrorMessage('Error connecting to API.');
					}
				}
			}.bind(this));
	};

	TripfinderLoginModel.prototype.checkRequiredField = function()
	{
		var self = this;
		var isPassed = true;
		if (!self.loginViewModel.obClientKey())
		{
			self.loginViewModel.obClientKeyWarning(true);
			isPassed = false;
		}

		if (!self.loginViewModel.obUsername())
		{
			self.loginViewModel.obUsernameWarning(true);
			isPassed = false;
		}

		if (!self.loginViewModel.obPassword())
		{
			self.loginViewModel.obPasswordWarning(true);
			isPassed = false;
		}

		return isPassed;
	}
})();
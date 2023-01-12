(function()
{
	createNamespace("TF").TripfinderLoginViewModel = TripfinderLoginViewModel;

	TripfinderLoginViewModel.prototype = Object.create(TF.LoginViewModel.prototype);
	TripfinderLoginViewModel.prototype.constructor = TripfinderLoginViewModel;
	const SAML_REDIRECT_USERNAME_REGEX = /^\S+@\S+\.\S+$/;
	const SAML_POSTFORM_REMOVE_DELAY = 60000;
	const SAML_DELAY_REQUEST = 1000;

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
		var self = this,
			securityCode = $.trim(self.obSecurityCode());
		if (securityCode)
		{
			return self.signIn();
		}

		return self.getSAMLSecurity();
	}

	/**
	 * Get SAML user authentication.
	 *
	 * @returns
	 */
	TripfinderLoginViewModel.prototype.getSAMLSecurity = function()
	{
		var self = this,
			clientKey = $.trim(self.obClientKey()),
			username = $.trim(self.obUsername()),
			password = self.obPassword();

		return tf.promiseAjax.post(
			pathCombine(tf.api.server(), clientKey, "saml/sprequestinfo"),
			{
				paramData: { username },
				data: `"${password}"`,
			},
			{
				auth: { noInterupt: true }
			}
		).then((apiResponse) => 
		{
			const samlConfig = apiResponse.Items[0];
			const { IsSAMLSecurityOn, IdentityProvider, Saml2Id, PostContent } = samlConfig;

			if (IsSAMLSecurityOn)
			{
				// For ADFS, we just need to use form post
				if (IdentityProvider === "ADFS")
				{
					if (PostContent)
					{
						return self.authSamlViaPost(Saml2Id, PostContent);
					}
				}
				// For others (currently Google or Azure), SAML authentication would require redirceted login form
				else if (SAML_REDIRECT_USERNAME_REGEX.test(username))
				{
					return self.authSamlViaRedirect(username, Saml2Id, PostContent);
				}
			}

			return self.signIn();
		})
	};

	/**
	 * Authenticate SAML via form post.
	 *
	 * @param {*} postContent
	 */
	TripfinderLoginViewModel.prototype.authSamlViaPost = function(saml2Id, postContent)
	{
		let iframe = document.createElement('iframe');
		iframe.srcdoc = postContent;
		document.getElementById("SAMLIframe").appendChild(iframe);
		setTimeout(() =>
		{
			$('iframe:eq(-1)').remove()
		}, SAML_POSTFORM_REMOVE_DELAY);

		return this.signIn(saml2Id);
	};

	/**
	 * Authenticate SAML via redirected login form.
	 *
	 * @param {*} username
	 * @param {*} saml2Id
	 * @param {*} samlPostContent
	 * @returns
	 */
	TripfinderLoginViewModel.prototype.authSamlViaRedirect = function(username, saml2Id, postContent)
	{
		const self = this;
		// Re-establish the SignalR connection
		TF.SignalRHelper.init();
		TF.SignalRHelper.registerSignalRHubs([`SamlNotificationHub`], { 'Saml2Id': saml2Id });

		tf.loadingIndicator.show();

		return TF.SignalRHelper.ensureConnection()
			.then(() =>
			{
				let redirectWindow = null;

				return new Promise((resolve, reject) =>
				{
					// First bind the front-end notification method of singalR
					TF.SignalRHelper.bindEvent('SamlNotificationHub', 'update', self.samlLoginStateUpdate.bind(self, username, resolve, reject));

					// Wait for singalR to establish a connection
					setTimeout(() =>
					{
						const winUrl = URL.createObjectURL(
							new Blob([postContent], { type: "text/html" })
						);

						redirectWindow = window.open(winUrl);

					}, SAML_DELAY_REQUEST);
				}).then(() =>
				{
					return self.signIn(saml2Id);
				}).finally(() =>
				{
					if (redirectWindow)
					{
						redirectWindow.close();
					}

					// Unbind event and close the connection.
					TF.SignalRHelper.unbindEvent('SamlNotificationHub', 'update', self.samlLoginStateUpdate.bind(self));
					TF.SignalRHelper.dispose();

					tf.loadingIndicator.tryHide();
				})
			});
	};

	/**
	 * On when SAML IDP calls back API with authentication result.
	 *
	 * @param {*} userName
	 * @param {*} resolve
	 * @param {*} reject
	 * @param {*} result
	 */
	TripfinderLoginViewModel.prototype.samlLoginStateUpdate = function(username, resolve, reject, result)
	{
		if (result.LoginID && username && result.LoginID.toLowerCase() === username.toLowerCase())
		{
			resolve();
		}
		else
		{
			reject({ Message: "Invalid Client ID, User Name and Password combination",StatusCode: 401 });
		}
	};

	TripfinderLoginViewModel.prototype.signIn = function(saml2Id)
	{
		return this.trySignIn(true, saml2Id);
	};

	TripfinderLoginViewModel.prototype.trySignIn = function(confirmLogged, saml2Id)
	{
		const self = this;
		const clientKey = $.trim(self.obClientKey());
		const username = $.trim(self.obUsername());
		const password = self.obPassword();
		const securityCode = $.trim(self.obSecurityCode());
		const promiseTask = self.obIsShowCode()
			? self.validatePin(clientKey, username, password, securityCode, confirmLogged)
			: self.sendSignInRequest(clientKey, username, password, confirmLogged, saml2Id)

		return promiseTask.catch(function(exceptionRes)
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
									return self.trySignIn(false, saml2Id);
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

	TripfinderLoginViewModel.prototype.validatePin = function(clientKey, username, password, securityCode, confirmLogged)
	{
		const self = this;
		return tf.promiseAjax.post(pathCombine(tf.api.server(), clientKey, "authinfos"), {
			paramData: {
				vendor: "Transfinder",
				securityCode: securityCode,
				username: username,
				prefix: self.getProductPrefix(),
				confirmLogged: confirmLogged
			}
		}, {
			auth: { noInterupt: true }
		}).then(apiResponse =>
		{
			const token = apiResponse.Items[0];
			return self.buildUserInfo(clientKey, username, password, token);
		});
	};

	TripfinderLoginViewModel.prototype.buildUserInfo = function(clientKey, username, password, token)
	{
		tf.storageManager.delete("datasourceId", true, true);
		tf.entStorageManager.save("token", token, true);
		if (tf.authManager)
		{
			tf.authManager.token = token;
		}
		return { clientKey: clientKey, username: username, password: password };
	}

	TripfinderLoginViewModel.prototype.sendSignInRequest = function(clientKey, username, password, confirmLogged, saml2Id)
	{
		const self = this;
		const prefix = self.getProductPrefix();
		const paramData = {
			vendor: "Transfinder",
			prefix,
			username,
			confirmLogged,
		};

		if (saml2Id)
		{
			paramData.saml2Id = saml2Id;
		}

		return tf.promiseAjax.post(pathCombine(tf.api.server(), clientKey, "authinfos"),
			{
				paramData: paramData,
				data: '"' + password + '"'
			}, {
			auth: { noInterupt: true }
		}).then((apiResponse) =>
		{
			const tokenResultString = apiResponse.Items[0];
			if (tokenResultString === 'MFA')
			{
				self.obIsShowCode(true);
				self.resendCountDown();
			}
			else
			{
				return self.buildUserInfo(clientKey, username, password, tokenResultString);
			}
		});
	};

	TripfinderLoginViewModel.prototype.resendCountDown = function()
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

	TripfinderLoginViewModel.prototype.generatePin = function()
	{
		const self = this,
			clientKey = $.trim(self.obClientKey()),
			userName = $.trim(self.obUsername());

		return tf.promiseAjax.post(pathCombine(tf.api.server(), clientKey, "authinfos/mfa"), {
			paramData: {
				username: userName,
				prefix: self.getProductPrefix()
			}
		}, {
			auth: { noInterupt: true }
		}).then(() =>
		{
			self.resendCountDown();
			self.obLoginCodeErrorMessage('');
		});
	};

	TripfinderLoginViewModel.prototype.backFromMFAtoLogin = function()
	{
		this.obIsShowCode(false);
		this.obSecurityCode("");
		this.obLoginCodeErrorMessage("");
		this.$form.data('bootstrapValidator').disableSubmitButtons(false);
	};

	TripfinderLoginViewModel.prototype.getProductPrefix = function()
	{
		return tf.storageManager.prefix.split('.')[0];
	};
})();
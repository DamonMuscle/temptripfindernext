﻿
(function ()
{
	createNamespace("TF").LoginViewModel = LoginViewModel;

	LoginViewModel.prototype = Object.create(TF.Control.BaseControl.prototype);
	LoginViewModel.prototype.constructor = LoginViewModel;

	//Delay the time to send the IDP request so that signalr can establish a connection
	const SAML_POSTFORM_REMOVE_DELAY = 60000;
	const SAML_DELAY_REQUEST = 1000;
	const SAML_REDIRECT_USERNAME_REGEX = /^\S+@\S+\.\S+$/;
	const MULTIFACTOR_KEY = "MFA";

	function LoginViewModel(clientKey)
	{
		var rememberMe = Boolean(tf.storageManager.get("rememberMe", true));
		this.obRememberMe = ko.observable(rememberMe);
		this.obClientKey = ko.observable(clientKey);
		this.obClientKeyEnabled = ko.observable(!clientKey);
		this.obUsername = ko.observable('');
		this.obPassword = ko.observable('');
		this.obClientKeyRP = ko.observable('');
		this.obUsernameRP = ko.observable('');
		this.obPasswordRP = ko.observable('');
		this.obVerifyPasswordRP = ko.observable('');
		this.obLoginErrorMessageRP = ko.observable('');
		this.obLoginErrorMessage = ko.observable('');
		this.obLoginCodeErrorMessage = ko.observable("");
		this.obLoginConfigErrorMessageVisible = ko.observable(false);

		// MFA related variables
		this.obSecurityCode = ko.observable("");
		this.obIsShowCode = ko.observable(false);
		this.obResendCodeCanClick = ko.observable(false);
		this.resendCountDownInterval = null;

		if (rememberMe)
		{
			if (!clientKey)
			{
				/**
				 * If user visit our products by vanity url, we will populate obClientKey with the value what is getting from the url.
				 * So discarding the value in local storage.
				 */
				this.obClientKey(tf.storageManager.get("clientKey", true) || '');
			}
			this.obUsername(tf.storageManager.get("userName", true) || '');
			this.obPassword(tf.storageManager.get("password", true) || '');
		}

		const self = this;

		// The client key redirect required value cache. It can reduce duplicate requests.
		self.clientKeyRedirectRequiredCache = new Map();

		// If current client key enable SAML and SAML login should redirect to IPD server.
		self.obRequireLoginRedirect = ko.observable(false);

		// Caculate the password input box should be enable or disable.
		self.obEnablePassword = ko.computed(function ()
		{
			const enablePassword = !(self.obRequireLoginRedirect() && self.isSAMLRedirectUsername(self.obUsername()));
			if (!enablePassword)
			{
				// The password warning should be reset.
				self.obPasswordWarning(false);
				self.obPassword('');
			}

			return enablePassword;
		});

		// If disable password input, the password value should be empty.
		self.obPassword.subscribe(function (value)
		{
			if (!self.obEnablePassword() && self.obPassword())
			{
				self.obPassword('');
			}
		});

		self.requireLoginRedirect();
	}

	LoginViewModel.prototype.init = function(viewModel, el)
	{
		var signature = getQueryString("signature"),
			clientid = getQueryString("clientid");
		if (signature && clientid)
		{//reset form
			this.$form = $(el).find(".resetForm");
		}
		else
		{
			this.$form = $(el).find(".loginform");
		}

		this.bindValidator();

		$(document.body).addClass("no-scroll");
	};

	LoginViewModel.prototype.bindValidator = function($form)
	{
		var validatorFields = {};

		if (!!$form)
		{
			this.$form = $form;
		}

		this.$form.find("input[required]").each(function(n, field)
		{
			var name = $(field).attr("name");
			validatorFields[name] = {
				trigger: "blur change",
				validators: {
					notEmpty: {
						message: "required"
					},
					callback: {
						message: "required",
						callback: function(value, validator, $field)
						{
							if (value === " None")
							{
								return false;
							}
							return true;
						}
					}
				}
			}
		});

		this.$form.bootstrapValidator({
			excluded: [':hidden', ':not(:visible)'],
			live: 'enabled',
			fields: validatorFields
		});

		this.$form.data('bootstrapValidator')
			.disableSubmitButtons(false)
			.$hiddenButton.remove();
	};

	LoginViewModel.prototype.apply = function()
	{
		var _validator = this.$form.data("bootstrapValidator");

		_validator.$submitButton = null;
		return _validator
			.validate()
			.then(function(result)
			{
				if (result)
				{
					return this.signIn();
				}
			}.bind(this));
	};

	/**
	 * Initialize validators for security code modal.
	 *
	 */
	LoginViewModel.prototype.securityCodeValidator = function()
	{
		const self = this;
		$(".container").find(".security-code-form").bootstrapValidator("addField", "securityCode", {
			trigger: "blur change",
			validators: {
				notEmpty: {
					message: "required"
				},
				callback: {
					callback: function(value, validator, $field)
					{
						if (!value)
						{
							self.resetErrorMessage();
						}
						return true;
					}
				}
			}
		});
	}

	/**
	 * Clear security code modal.
	 *
	 */
	LoginViewModel.prototype.removeSecurityCodePage = function()
	{
		const self = this,
			$propertychanged = $(".container").find(".loginform").find("input[propertychanged]");
		$propertychanged.on("input propertychange", function(e)
		{
			if (self.obIsShowCode())
			{
				self.obIsShowCode(false);
				self.resetAllMessage();
				$propertychanged.off("input propertychange");
			}
		});
	}

	/**
	 * Count down for resend button.
	 *
	 */
	LoginViewModel.prototype.resendCountDown = function()
	{
		let timeLeft = 30;
		clearInterval(this.resendCountDownInterval);
		this.obResendCodeCanClick(false);
		this.resendCountDownInterval = setInterval(() =>
		{
			if (timeLeft-- <= 0)
			{
				this.obResendCodeCanClick(true);
				clearInterval(this.resendCountDownInterval);
			}
		}, 1000);
	}

	/**
	 * On when SAML IDP calls back API with authentication result.
	 *
	 * @param {*} userName
	 * @param {*} resolve
	 * @param {*} reject
	 * @param {*} result
	 */
	LoginViewModel.prototype.samlLoginStateUpdate = function(username, resolve, reject, result)
	{
		if (result.LoginID && username && result.LoginID.toLowerCase() === username.toLowerCase())
		{
			resolve();
		}
		else
		{
			reject({ Message: "Invalid Client ID, User Name and Password combination" });
		}
	};

	LoginViewModel.prototype.apply = function()
	{
		var self = this,
			securityCode = $.trim(self.obSecurityCode()),
			_validator = self.$form.data("bootstrapValidator");

		_validator.$submitButton = null;
		return _validator.validate().then(function(result)
		{
			if (result)
			{
				if (securityCode)
				{
					return self.signIn();
				}

				return self.GetSAMLSecurity();
			}
		});
	};

	/**
	 * Authenticate SAML via form post.
	 *
	 * @param {*} postContent
	 */
	LoginViewModel.prototype.authSamlViaPost = function(saml2Id, postContent)
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
	LoginViewModel.prototype.authSamlViaRedirect = function(username, saml2Id, postContent)
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
	 * Get SAML user authentication.
	 *
	 * @returns
	 */
	LoginViewModel.prototype.GetSAMLSecurity = function()
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
				else if (self.isSAMLRedirectUsername(username))
				{
					return self.authSamlViaRedirect(username, Saml2Id, PostContent);
				}
			}

			return self.signIn();
		});
	};

	/**
	 * Return back from MFA verification to login.
	 *
	 */
	LoginViewModel.prototype.backFromMFAtoLogin = function()
	{
		this.obIsShowCode(false);
		this.obSecurityCode("");
		this.obLoginCodeErrorMessage("");
	};

	LoginViewModel.prototype.signIn = function(saml2Id)
	{
		return this.trySignIn(true, saml2Id);
	};

	LoginViewModel.prototype.trySignIn = function(confirmLogged, saml2Id)
	{
		const self = this;
		const clientKey = $.trim(self.obClientKey());
		const username = $.trim(self.obUsername());
		const password = self.obPassword();
		const securityCode = $.trim(self.obSecurityCode());
		const isOnVerifyCodeMode = self.obIsShowCode();
		const promiseTask = isOnVerifyCodeMode
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

			if (isOnVerifyCodeMode)
			{
				var message = exceptionRes.TransfinderMessage || exceptionRes.Message;
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
	};

	LoginViewModel.prototype.sendSignInRequest = function(clientKey, username, password, confirmLogged, saml2Id)
	{
		const prefix = this.getProductPrefix()
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

		return tf.promiseAjax.post(
			pathCombine(tf.api.server(), clientKey, "authinfos"),
			{
				paramData: paramData,
				data: `"${password}"`
			},
			{
				auth: { noInterupt: true }
			}
		).then((apiResponse) =>
		{
			const tokenResultString = apiResponse.Items[0];

			// Indicates that security code is required
			if (tokenResultString === MULTIFACTOR_KEY)
			{
				this.obIsShowCode(true);
				this.resendCountDown();
			}
			else
			{
				return this.buildUserInfo(clientKey, username, password, tokenResultString);
			}
		});
	};

	LoginViewModel.prototype.validatePin = function(clientKey, username, password, securityCode, confirmLogged)
	{
		const prefix = this.getProductPrefix();

		this.obLoginCodeErrorMessage("");
		if (!securityCode)
		{
			return Promise.reject({ TransfinderMessage: "requried" });
		}


		return tf.promiseAjax.post(pathCombine(tf.api.server(), clientKey, "authinfos"), {
			paramData: {
				vendor: "Transfinder",
				securityCode,
				username,
				prefix,
				confirmLogged
			}
		}, {
			auth: { noInterupt: true }
		}).then(apiResponse =>
		{
			const token = apiResponse.Items[0];
			return this.buildUserInfo(clientKey, username, password, token);
		});
	};

	LoginViewModel.prototype.buildUserInfo = function(clientKey, username, password, token)
	{
		tf.storageManager.delete("datasourceId", true, true);
		tf.entStorageManager.save("token", token, true);

		if (tf.authManager)
		{
			tf.authManager.token = token;
		}

		return { clientKey, username, password };
	}

	LoginViewModel.prototype.generatePin = function()
	{
		var self = this,
			clientKey = $.trim(self.obClientKey()),
			username = $.trim(self.obUsername());

		return tf.promiseAjax.post(pathCombine(tf.api.server(), clientKey, "authinfos/mfa"), {
			paramData: {
				username,
				prefix: self.getProductPrefix(),
			}
		}, {
			auth: { noInterupt: true }
		}).then(() =>
		{
			self.resendCountDown();
			self.resetAllMessage();
		});
	};

	LoginViewModel.prototype.getProductPrefix = function()
	{
		return tf.storageManager.prefix.split('.')[0];
	};

	LoginViewModel.prototype.resetAllMessage = function()
	{
		this.resetErrorMessage();

		if (this.obSecurityCode())
		{
			this.obSecurityCode("");
		}
	}

	LoginViewModel.prototype.resetErrorMessage = function()
	{
		if (this.obLoginCodeErrorMessage())
		{
			this.obLoginCodeErrorMessage("");
		}
		if (this.obLoginErrorMessage())
		{
			this.obLoginErrorMessage("");
		}
		this.obLoginCodeErrorMessage('');
	}


	/**
	 * Check the user name with email regex. If the user name is email format, return true.
	 * @param {*} userName 
	 * @returns 
	 */
	LoginViewModel.prototype.isSAMLRedirectUsername = function (userName)
	{
		return SAML_REDIRECT_USERNAME_REGEX.test(userName);
	}

	/**
	 * When the client key input box blur, it should call 'requireLoginRedirect' function to verify the SAML setting.
	 */
	LoginViewModel.prototype.onClientKeyBlur = function ()
	{
		this.requireLoginRedirect();
	}

	/**
	 * Call endpoint to check is current SAML setting require redirect to idp server when SAML user login.
	 */
	LoginViewModel.prototype.requireLoginRedirect = function ()
	{
		const self = this;
		const currentClientKey = this.obClientKey();

		// If find value by client key in cache. Get cache value and set to obRequireLoginRedirect.
		if (!currentClientKey)
		{
			self.obRequireLoginRedirect(false);
		}
		else if (self.clientKeyRedirectRequiredCache.has(currentClientKey))
		{
			self.obRequireLoginRedirect(self.clientKeyRedirectRequiredCache.get(currentClientKey));
		}

		// Call endpoint and get value. Then add into cache and  set to obRequireLoginRedirect.
		else
		{
			let redirectRequired = false, storeInCache = true;

			// Call /saml/redirectRequired endpoint.
			tf.promiseAjax.get(pathCombine(tf.api.server(), this.obClientKey(), "saml", "redirectRequired"), {}, { overlay: false })
				.then(function (apiResponse)
				{
					redirectRequired = apiResponse.Items[0];
				})
				.catch(function (apiResponse)
				{
					storeInCache = apiResponse.StatusCode == 404;
				})
				.finally(function ()
				{
					// Store cache if need do that.
					if (storeInCache)
					{
						self.clientKeyRedirectRequiredCache.set(currentClientKey, redirectRequired);
					}

					self.obRequireLoginRedirect(redirectRequired);
				});
		}
	}

	LoginViewModel.prototype.dispose = function ()
	{
		$(document.body).removeClass("no-scroll");
		clearInterval(this.resendCountDownInterval);
	};
})();
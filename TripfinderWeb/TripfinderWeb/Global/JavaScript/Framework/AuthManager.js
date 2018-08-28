(function()
{
	createNamespace("TF").AuthManager = AuthManager;

	function AuthManager()
	{
		this.clientKey = null;
		this.userName = null;
		this.password = null;
		this._hasLoggedin = null;
		this.beforeLogOff = new TF.Events.PromiseEvent();
		this.logOffTag = false;

		this.obIsLogIn = ko.observable(false);
		var clientKey = tf.tokenStorageManager.get("clientKey", true);
		var username = tf.storageManager.get("userName", true);
		var password = tf.storageManager.get("password", true);
		this.token = tf.tokenStorageManager.get("token");
		var isLoggedin = typeof (tf.tokenStorageManager.get("isLoggedin")) === 'undefined' ? false : JSON.parse(tf.tokenStorageManager.get("isLoggedin"));
		this.clientKey = clientKey;
		this.userName = username;
		this.password = password;
		this._hasLoggedin = isLoggedin && Boolean(this.clientKey) && Boolean(this.token);

		if (this._hasLoggedin)
		{
			this.obIsLogIn(true);
		}
	}

	AuthManager.prototype.logOff = function()
	{
		if (this.token === tf.tokenStorageManager.get("token"))
		{
			tf.tokenStorageManager.save("token", "");
		}

		this.logOffWithoutRefresh()
			.then(function()
			{
				setTimeout(function()
				{
					location.reload();
				});
			});
	};

	AuthManager.prototype.logOffWithoutRefresh = function()
	{
		this.logOffTag = true;
		return this.beforeLogOff.notify()
			.then(function(results)
			{
				tf.tokenStorageManager.save("isLoggedin", false);
			})
	};

	AuthManager.prototype.auth = function(loginViewModal)
	{
		var p = null;
		if (this._hasLoggedin)
		{
			p = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "auth", "authentication", "test"), null, {
				auth: {
					noInterupt: true
				},
				overlay: false
			})
				.then(function()
				{
					var p1 = tf.promiseAjax.get(pathCombine(tf.api.server(), this.clientKey, "clientconfig", "timezonetotalminutes"), {}, {
						auth: {
							noInterupt: true
						},
						overlay: false
					}).then(function(apiResponse)
					{
						moment().constructor.prototype.currentTimeZoneTime = function()
						{
							var now = moment().utcOffset(apiResponse.Items[0]);
							return moment([now.year(), now.month(), now.date(), now.hour(), now.minutes(), now.seconds(), now.millisecond()]);
						};
						if (this.clientKey !== "support" && (!loginViewModal || !loginViewModal.type || loginViewModal.type !== TF.productName))
						{
							return tf.datasourceManager.validateAllDBs()
								.then(function(valResult)
								{
									if (!valResult.Items[0].AnyDBPass)
									{ //all db connection failed
										var message = "";
										if (valResult.Items[0].DBlength == 1)
										{
											message = valResult.Items[0].DBName + " could not load.  There is only one data source.  Try again later.  If you continue to experience issues, contact your Transfinder Project Manager or your Support Representative (support@transfinder.com or 888-427-2403).";
										} else
										{
											message = "None of your Data Sources can be loaded.  If you continue to experience issues, contact your Transfinder Project Manager or your Support Representative (support@transfinder.com or 888-427-2403).";
										}
										return this._loginUseModal(loginViewModal, message);
									}
								}.bind(this));
						}
					}.bind(this));
					return Promise.all([p1]);
				}.bind(this))
				.catch(function()
				{
					return Promise.resolve(false);
				}.bind(this))
		} else
		{
			p = this._loginUseModal(loginViewModal)
		}
		return p
			.then(function(result)
			{
				if (result === false)
				{
					tf.tokenStorageManager.save("token", "");
					location.reload();
					return Promise.reject("login failed");
				}
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "auth", "authorization"), null, {
					overlay: false,
					auth: {
						noInterupt: true
					}
				})
					.then(function(apiResponse)
					{
						tf.tokenStorageManager.save("isLoggedin", true);
						this._hasLoggedin = true;
						this.obIsLogIn(true);
						this.authorizationInfo = new AuthorizationInfo(apiResponse.Items[0]);
					}.bind(this));
			}.bind(this));
	};

	AuthManager.prototype._loginUseModal = function(loginViewModal, message)
	{
		var self = this;
		var loginViewModal = loginViewModal || new TF.Modal.LoginModalViewModel(this.clientKey);
		if (message)
		{
			// used for cached data, no need to login again.
			loginViewModal.loginViewModel.obLoginErrorMessage(message);
		}
		return tf.modalManager.showModal(loginViewModal)
			.then(function(result)
			{
				this.clientKey = result.clientKey;
				this.userName = result.username;
				this.password = result.password;
				tf.tokenStorageManager.save("clientKey", result.clientKey);
				tf.storageManager.save("userName", result.username, true);
				tf.storageManager.save("password", result.password, true);
				if (tf.datasourceManager.databaseId)
				{
					//when the datasource is selected, show all the menus
					tf.datasourceManager.navbarDisplay(true);
				}
				return Promise.resolve(true);
			}.bind(this));
	};


	AuthManager.prototype.isAuthorizedFor = function()
	{
		return this.authorizationInfo.isAuthorizedFor.apply(this.authorizationInfo, arguments);
	};

	AuthManager.prototype.authorizationUrl = function()
	{
		Array.prototype.unshift.call(arguments, tf.api.apiPrefix());
		return pathCombine.apply(null, arguments);
	};

	AuthManager.prototype.updateInfo = function()
	{
		this.clientKey = tf.tokenStorageManager.get("clientKey");
		this.userName = tf.storageManager.get("userName", true);
		this.password = tf.storageManager.get("password", true);
	};

	AuthManager.prototype.getPurchasedProducts = function()
	{
		return tf.promiseAjax.get(pathCombine(tf.api.server(), $.trim(this.clientKey), "vendoraccessinfo"))
			.then(function(response)
			{
				this.supportedProducts = response.Items[0].Products;
				return this.supportedProducts;
			}.bind(this));
	};

	createNamespace("TF").AuthorizationInfo = AuthorizationInfo;

	function AuthorizationInfo(authorizationInfoJson)
	{
		var self = this;
		self.isAdmin = authorizationInfoJson.IsAdmin;
		self.authorizationTree = authorizationInfoJson.AuthorizationTree;

		self.onUpdateAuthorized = new TF.Events.Event();
	}

	/**
	 * Update the anthorization info.
	 * @param {object} authorizationInfoJson the newest authorization info.
	 * @returns {void}
	 */
	AuthorizationInfo.prototype.updateAuthorized = function(authorizationInfoJson)
	{
		var self = this;
		self.isAdmin = authorizationInfoJson.IsAdmin;
		self.authorizationTree = authorizationInfoJson.AuthorizationTree;

		self.onUpdateAuthorized.notify();
	};

	AuthorizationInfo.prototype.isAuthorizedFor = function()
	{
		if (this.isAdmin)
		{
			return true;
		}
		var securedItems = this.authorizationTree.securedItems;
		var section0 = arguments[0];
		var section1 = arguments[1];
		if (securedItems[section0] && Array.contain(securedItems[section0], section1))
		{
			return true;
		}
		return false;
	};
})();
(function()
{
	createNamespace("TF").AuthManager = AuthManager;

	var securedItemDataMap = {
		altsite: "alternateSite",
		georegion: "georegion",
		student: "student",
		vehicle: "vehicle",
		staff: "staff",
		school: "school",
		contractor: "contractor",
		district: "district",
		tripstop: "trip", //tripstop secured item is same with trip
		trip: "trip",
		contact: "contact",
		document: "documentCenter",
		documentTab: "documentTab"
	}

	function AuthManager()
	{
		this.clientKey = null;
		this.userName = null;
		this.password = null;
		this._hasLoggedin = null;
		this.beforeLogOff = new TF.Events.PromiseEvent();
		this.logOffTag = false;

		this.obIsLogIn = ko.observable(false);
		var clientKey = tf.entStorageManager.get("clientKey", true) || tf.storageManager.get("clientKey");
		var username = tf.storageManager.get("userName", true);
		var password = tf.storageManager.get("password", true);
		this.token = tf.entStorageManager.get("token");
		var isLoggedin = typeof (tf.entStorageManager.get("isLoggedin")) === 'undefined' ? false : JSON.parse(tf.entStorageManager.get("isLoggedin"));
		this.clientKey = clientKey;
		this.userName = username;
		this.password = password;
		this._hasLoggedin = isLoggedin && Boolean(this.clientKey) && Boolean(this.token);
		this.supportedProducts = [];

		if (this._hasLoggedin)
		{
			this.obIsLogIn(true);
		}
	}

	AuthManager.prototype.logOff = function()
	{
		if (this.token === tf.entStorageManager.get("token"))
		{
			tf.entStorageManager.save("token", "");
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
				tf.entStorageManager.save("isLoggedin", false);
			})
	};

	AuthManager.prototype.isAuthorizedForDataType = function(dataType, right)
	{
		if (dataType == "fieldtrip")
		{
			return tf.helpers.fieldTripAuthHelper.isAuthorizedFor(right);
		}

		return this.authorizationInfo.isAuthorizedFor.call(this.authorizationInfo, securedItemDataMap[dataType], right);
	};

	AuthManager.prototype.auth = function(loginViewModal)
	{
		let self = this; 
		var prefix = tf.storageManager.prefix;
		prefix = prefix.split('.')[0];
		
		var p = null;
		if (self._hasLoggedin)
		{
			p = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "authinfos"), {
				paramData: {
					isValid: true
				}
			}, {
				auth:
				{
					noInterupt: true
				},
				overlay: false
			}).then(function()
			{
				if (self.clientKey !== "support")
				{
					return tf.datasourceManager.validateAllDBs()
						.then(function(valResult)
						{
							if (!valResult.Items[0].AnyDatabasePass)
							{
								//all db connection failed
								return self._loginUseModal(loginViewModal, valResult.Items[0].ErrorMessage);
							}
						});
				}
				return Promise.resolve(true);
			})
			.catch(function()
			{
				return Promise.resolve(false);
			})

		} else
		{
			p = self._loginUseModal(loginViewModal);
		}
		return p.then(function(result)
		{
			if (result === false)
			{
				tf.entStorageManager.save("token", "");
				location.reload();
				return Promise.reject("login failed");
			}
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "authinfos"), {
					paramData: {
						prefix: 'tfweb'
					}
				}, {
					overlay: false,
					auth: {
						noInterupt: true
					}
				})
				.then(function(apiResponse)
				{
					self.authorizationInfo = new AuthorizationInfo(apiResponse.Items[0]);
					tf.userEntity = apiResponse.Items[0].UserEntity;
					return tf.authManager.getPurchasedProducts()
						.then(function(purchasedProducts)
						{
							if (purchasedProducts.indexOf("Tripfinder") === -1)
							{
								return self._loginUseModal(loginViewModal);
							}

							var ft1 = self.authorizationInfo.isAuthorizedFor("level1Requestor", "read");
							var ft2 = self.authorizationInfo.isAuthorizedFor("level2Administrator", "read");
							var ft3 = self.authorizationInfo.isAuthorizedFor("level3Administrator", "read");
							var ft4 = self.authorizationInfo.isAuthorizedFor("level4Administrator", "read");
							var ft5 = self.authorizationInfo.isAuthorizedFor("transportationAdministrator", "read");
							var ft = ft1 || ft2 || ft3 || ft4 || ft5;

							var flt = self.authorizationInfo.isAuthorizedFor("filters", "read");

							var pfiledtrip = self.authorizationInfo.isAuthorizedFor("filedtrip", "read");

							if (!(ft || pfiledtrip))
							{
								return self._loginUseModal(loginViewModal);
							}

							tf.entStorageManager.save("isLoggedin", true);
							self._hasLoggedin = true;
							self.obIsLogIn(true);
						});

				}).catch(function(apiResponse) { 
					if (apiResponse.StatusCode == 401)
					{
						return self._loginUseModal(loginViewModal,"Have no permission to this product");
					}
				});

		});
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
				tf.entStorageManager.save("clientKey", result.clientKey);
				tf.entStorageManager.save("userName", result.username);
				tf.entStorageManager.save("password", result.password);
				tf.storageManager.save("clientKey", result.clientKey, true);
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
		// TODO-V2, need to research
		Array.prototype.unshift.call(arguments, tf.api.apiPrefix());
		return pathCombine.apply(null, arguments);
	};

	AuthManager.prototype.updateInfo = function()
	{
		this.clientKey = tf.storageManager.get("clientKey", true);
		this.userName = tf.storageManager.get("userName", true);
		this.password = tf.storageManager.get("password", true);
	};

	AuthManager.prototype.getPurchasedProducts = function()
	{
		var self = this;
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "vendoraccessinfo"))
			.then(function(response)
			{
				self.supportedProducts = response.Items[0].Products;
				return self.supportedProducts;
			}.bind(this));
	};

	createNamespace("TF").AuthorizationInfo = AuthorizationInfo;

	function AuthorizationInfo(authorizationInfoJson)
	{
		this.updateAuthorized(authorizationInfoJson);
		this.onUpdateAuthorized = new TF.Events.Event();
	}

	AuthorizationInfo.prototype.checkOnlyLevel1 = function()
	{
		if (this.isAdmin || this.isFieldTripAdmin) return false;

		var securedItems = this.authorizationTree.securedItems;
		return !["level2Administrator", "level3Administrator", "level4Administrator"].some(function(item)
		{
			var securedItem = securedItems[item];
			return securedItem && securedItem.length;
		});
	};


	/**
	 * Update the anthorization info.
	 * @param {object} authorizationInfoJson the newest authorization info.
	 * @returns {void}
	 */
	AuthorizationInfo.prototype.updateAuthorized = function(authorizationInfoJson)
	{
		this.isAdmin = authorizationInfoJson.IsAdmin;
		this.authorizationTree = authorizationInfoJson.AuthorizationTree;
		this.isFieldTripAdmin = this.isAuthorizedFor("transportationAdministrator", "read");
		this.onlyLevel1 = this.checkOnlyLevel1();
		if (this.onUpdateAuthorized)
		{
			this.onUpdateAuthorized.notify();
		}
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

		if (securedItems[section0])
		{
			if (!Array.isArray(section1))
			{
				return Array.contain(securedItems[section0], section1);
			}

			var ownedAllRights = true;
			section1.forEach(function(right) 
			{
				if (!Array.contain(securedItems[section0], right))
				{
					ownedAllRights = false;
					return false;
				}
			});

			return ownedAllRights;
		}
		return false;
	};
})();
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
		documentTab: "documentTab",
		form: "formsResults"
	}

	
	/**
	 * Restore userName, password and rememberMe from cookie to local storage, so that we can retain previous behavior.
	 * 
	 * Plus(serviceplus01.transfinder.com) and Enterprise Login(servicepluslogin.transfinder.com) have different domains.
	 * Cookie could be shared between Plus and Enterprise Login by setting cookie's domain, however local storage cann't.
	 * Refer to StorageManager.js (allowCookieList = ["ent.token", "ent.clientKey", "ent.isLoggedin", "ent.stopfinderToken"])
	 * ent.userName and ent.password are not in the cookie allowed list.
	 */
	function restoreInfo()
	{
		if (tf.storageManager.checkDomain())
		{
			const userKey = "ent.userName",
				passwordKey = "ent.password",
				userName = tf.storageManager.getCookie(userKey),
				password = tf.storageManager.getCookie(passwordKey);

			if (userName)
			{
				tf.storageManager.save("userName", userName, true);
				tf.entStorageManager.save("userName", userName);
				tf.storageManager.removeCookie(userKey);
			}
			if (password)
			{
				tf.storageManager.save("password", password, true);
				tf.entStorageManager.save("password", password);
				tf.storageManager.removeCookie(passwordKey);
			}
		}

		const rememberMeKey = `${tf.storageManager.prefix}rememberMe`;
		if (tf.storageManager.hasCookie(rememberMeKey))
		{
			/**
			 * The existence of this cookie(rememberMe) means that user comes from Enterprise Login,
			 * and we only take care of this scenario.
			 */
			const rememberMe = tf.storageManager.getCookie(rememberMeKey);
			tf.storageManager.removeCookie(rememberMeKey);
			tf.storageManager.save("rememberMe", !!rememberMe, true);

			const clientKey = tf.entStorageManager.get("clientKey") || "";
			tf.storageManager.save("clientKey", clientKey, true);
		}
	}

	function AuthManager()
	{
		restoreInfo();
		this.beforeLogOff = new TF.Events.PromiseEvent();
		this.logOffTag = false;

		var clientKey = tf.entStorageManager.get("clientKey", true) || tf.storageManager.get("clientKey");
		var username = tf.entStorageManager.get("userName", true) || tf.storageManager.get("userName", true);
		var password = tf.entStorageManager.get("password", true) || tf.storageManager.get("password", true);
		this.token = tf.entStorageManager.get("token");
		this.clientKey = clientKey;
		this.userName = username;
		this.password = password;
		this.supportedProducts = [];

		this.obIsLogIn = ko.observable(this.getLoginStatus());
	}

	AuthManager.prototype.getLoginStatus = function()
	{
		const isLoggedInStorage = tf.entStorageManager.get("isLoggedin");
		const potentialClientKey = (location.hostname.split(".")[0] || "").trim().toLowerCase();
		const isVanityUrl = !!window.vanitySessionGuard?.vendorAccessInfoCache[potentialClientKey];

		const isLogged = !!((isLoggedInStorage === true || isLoggedInStorage === "true") && Boolean(this.clientKey) && Boolean(this.token));
		return !isVanityUrl ? isLogged : (isLogged && potentialClientKey === (this.clientKey || "").toLowerCase());
	};

	AuthManager.prototype.logOff = function()
	{
		var self = this,
			prefix = tf.storageManager.prefix;
		prefix = prefix.split('.')[0];

		var password = tf.entStorageManager.get("password");
		return this.logOffWithoutRefresh().then(function()
			{
				return tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "authinfos"), {
					data: {
						Prefix: prefix,
						UserName: tf.authManager.userName,
						Password: password
					}
				}).then(function()
				{
					if (self.token === tf.entStorageManager.get("token"))
					{
						tf.entStorageManager.save("token", "");
					}

					tf.chatfinderHelper && tf.chatfinderHelper.stop();
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
				if (tf.cfConnection) 
				{
					tf.cfConnection.stop();
				}
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
		if (self.obIsLogIn())
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
							if (!purchasedProducts.find(x => x.Name == 'Tripfinder'))
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
							self.obIsLogIn(true);
						});

				}).catch(function(apiResponse)
				{
					if (apiResponse.StatusCode == 401)
					{
						return self._loginUseModal(loginViewModal, "Have no permission to this product");
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

	AuthManager.prototype.hasMergeDocumentAccess = function(type)
	{
		const authInfo = tf.authManager.authorizationInfo;
		if (authInfo.isAdmin)
		{
			return true;
		}
		let securedMergeDocuments = authInfo.authorizationTree &&
			authInfo.authorizationTree.securedItems &&
			authInfo.authorizationTree.securedItems.mergeDocuments;
		if (securedMergeDocuments != null && Array.isArray(securedMergeDocuments))
		{
			return securedMergeDocuments.some(item => item === type);
		}
		return false;
	}

	AuthManager.prototype.hasMergeEmailMessageAccess = function(type)
	{
		const authInfo = tf.authManager.authorizationInfo;
		if (authInfo.isAdmin)
		{
			return true;
		}
		let securedMergeEmailMessages = authInfo.authorizationTree &&
			authInfo.authorizationTree.securedItems &&
			authInfo.authorizationTree.securedItems.mergeEmailMessages;
		if (securedMergeEmailMessages != null && Array.isArray(securedMergeEmailMessages))
		{
			return securedMergeEmailMessages.some(item => item === type);
		}
		return false;
	}

		AuthManager.prototype.hasScheduledMergeDocumentAccess = function(type)
	{
		const authInfo = tf.authManager.authorizationInfo;
		if (authInfo.isAdmin)
		{
			return true;
		}
		const securedScheduledMergeDocuments = authInfo.authorizationTree &&
			authInfo.authorizationTree.securedItems &&
			authInfo.authorizationTree.securedItems.scheduledMergeDocuments;
		if (securedScheduledMergeDocuments != null && Array.isArray(securedScheduledMergeDocuments))
		{
			return securedScheduledMergeDocuments.some(item => item === type);
		}
		return false;
	}

	AuthManager.prototype.hasScheduledReportsAccess = function(type)
	{
		const authInfo = tf.authManager.authorizationInfo;
		if (authInfo.isAdmin)
		{
			return true;
		}
		let securedScheduledReports = authInfo.authorizationTree &&
			authInfo.authorizationTree.securedItems &&
			authInfo.authorizationTree.securedItems.scheduledReports;
		if (securedScheduledReports != null && Array.isArray(securedScheduledReports))
		{
			return securedScheduledReports.some(item => item === type);
		}
		return false;
	}

	AuthManager.prototype.hasMergeLibraryAccess = function(type)
	{
		const authInfo = tf.authManager.authorizationInfo;
		if (authInfo.isAdmin)
		{
			return true;
		}

		const securedMergeLibrary = authInfo.authorizationTree &&
			authInfo.authorizationTree.securedItems &&
			authInfo.authorizationTree.securedItems.mergeLibrary;
		if (securedMergeLibrary != null && Array.isArray(securedMergeLibrary))
		{
			return securedMergeLibrary.some(item => item === type);
		}

		return false;
	}

	AuthManager.prototype.updateInfo = function()
	{
		this.clientKey = tf.storageManager.get("clientKey", true);
		this.userName = tf.storageManager.get("userName", true);
		this.password = tf.storageManager.get("password", true);
	};

	AuthManager.prototype.hasGPS = function()
	{
		return this.supportedProducts.some((c) => { return c.Name == "GPSConnect"; });
	};

	AuthManager.prototype.hasWayfinder = function()
	{
		return this.supportedProducts.some((c) => { return c.Name.toLowerCase() == "wayfinder"; });
	};

	AuthManager.prototype.hasFormsResultsAccess = function(type)
	{
		const authInfo = tf.authManager.authorizationInfo;
		if (authInfo.isAdmin)
		{
			return true;
		}

		let securedForms = authInfo.authorizationTree &&
			authInfo.authorizationTree.securedItems &&
			authInfo.authorizationTree.securedItems.formsResults;
		if (securedForms != null && Array.isArray(securedForms))
		{
			return securedForms.some(item => item === type);
		}
		return false;
	}

	AuthManager.prototype.hasTraffic = function()
	{
		return this.supportedProducts.some((c) => { return c.Name == "Traffic"; });
	};

	AuthManager.prototype.updateAuthInfos = function()
	{
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
				this.authorizationInfo = new AuthorizationInfo(apiResponse.Items[0]);
				tf.userEntity = apiResponse.Items[0].UserEntity;
			}.bind(this));
	};

	AuthManager.prototype.getPurchasedProducts = function()
	{
		var self = this;
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "vendoraccessinfo"))
			.then(function(response)
			{
				self.supportedProducts = response.Items[0].ProductDetails || [];;
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
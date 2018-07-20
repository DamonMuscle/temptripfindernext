(function()
{
	createNamespace("TF").Startup = Startup;
	tf.applicationTerm = {};

	tf.applicationTerm.getApplicationTermByName = function(term, type)
	{
		var result;
		if (!term)
		{
			return term;
		}
		if (tf.applicationTerm[term] && tf.applicationTerm[term][type])
		{
			result = tf.applicationTerm[term][type];
		}
		else
		{
			var terms = term.split(" "), results = [];
			for (var i = 0; i < terms.length; i++)
			{
				if (tf.applicationTerm[terms[i]] && tf.applicationTerm[terms[i]][type])
				{
					results.push(tf.applicationTerm[terms[i]][type]);
				}
				else
				{
					results.push(terms[i]);
				}
			}
			result = results.join(" ");
		}
		return result;
	}

	tf.applicationTerm.getApplicationTermSingularByName = function(term)
	{
		return tf.applicationTerm.getApplicationTermByName(term, "Singular");
	};
	tf.applicationTerm.getApplicationTermPluralByName = function(term)
	{
		return tf.applicationTerm.getApplicationTermByName(term, "Plural");
	};
	tf.applicationTerm.getApplicationTermAbbrByName = function(term)
	{
		return tf.applicationTerm.getApplicationTermByName(term, "Abbreviation");
	};

	tf.showSelectDataSourceModel = function(databaseName)
	{
		return tf.modalManager.showModal(
			new TF.Modal.DataSourceChangeModalViewModel(databaseName)
		)
			.then(function(datasource)
			{
				if (!datasource)
				{
					if ((!databaseName))
					{
						return tf.showSelectDataSourceModel();
					}
					return Promise.resolve(true);
				}

				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), datasource.Id, "datasource", "test", datasource.DBType))
					.then(function()
					{
						//connection passed
						var notValidDatabaseName = datasource.DatabaseName;
						return tf.datasourceManager.verifyDataBaseNeedToRebuild(datasource.Id, datasource.DBType)
							.then(function(isValidate)
							{
								if (!isValidate)
								{
									return tf.DBNeedToRebuildAlert(notValidDatabaseName);
								}
								return Promise.resolve(true);
							});
					})
					.catch(function()
					{
						// failed to connection
						return tf.promiseBootbox.dialog({
							message: datasource.DatabaseName + " could not load.&nbsp;&nbsp;Try again later.&nbsp;&nbsp;If you continue to experience issues, please contact your Transfinder Project Manager or Support Representative (support@transfinder.com or 888-427-2403).",
							title: "Could Not Load",
							closeButton: true,
							buttons: {
								ok: {
									label: "OK",
									className: "tf-btn-black"
								}
							}
						})
							.then(function()
							{
								//maybe need logoff
								return Promise.resolve(false);
							});
					})
					.then(function(isPass)
					{
						if (isPass)
						{
							//verify datasource is change
							if (datasource && datasource.Id)
							{
								var p1 = tf.storageManager.save("databaseType", datasource.DBType);
								var p2 = tf.storageManager.save("datasourceId", datasource.Id);
								var p3 = tf.storageManager.save("databaseName", datasource.DatabaseName);
								return Promise.all([p1, p2]).then(function()
								{
									location.reload();
									return "loginpage";
								});
							}
						} else
						{
							if (!databaseName)
							{
								tf.datasourceManager.clearDBInfo();
								return tf.showSelectDataSourceModel();
							}
						}
					});

			}.bind(this));
	};

	function Startup() { }
	Startup.prototype.start = function()
	{
		var self = this;
		self.libraryInitialization().then(function()
		{
			tf.fullScreenHelper = new TF.FullScreenHelper();
			tf.shortCutKeys = new TF.ShortCutKeys();
			tf.storageManager = new TF.StorageManager("tfweb");
			tf.loadingIndicator = self._createLoadingIndicator();
			tf.ajax = new TF.Ajax(tf.loadingIndicator, true);
			tf.promiseAjax = new TF.PromiseAjax(tf.ajax);
			tf.modalManager = new TF.Modal.ModalManager();
			tf.modalHelper = new TF.ModalHelper();
			tf.datasourceManager = new TF.DatasourceManager();
			tf.contextMenuManager = new TF.ContextMenu.ContextMenuManager();
			tf.authManager = new TF.AuthManager();
			var sessionValidator = new TF.Session.SoftSessionValidator(tf.authManager);
			tf.api = new TF.API(tf.authManager, tf.datasourceManager);
			tf.pageManager = new TF.Page.PageManager();
			tf.kendoHackHelper = new TF.KendoHackHelper()
			tf.authManager.auth(new TF.Modal.TripfinderLoginModel())
				.then(function()
				{
					return sessionValidator.activate();
				})
				.then(function()
				{
					tf.setting = new TF.Setting();
					return tf.setting.getRoutingConfig();
				})
				.then(function()
				{
					tf.loadingIndicator.showImmediately();
					var p1 = tf.userPreferenceManager.getAllKey();
					var p2 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "clientconfig", "timezonetotalminutes")).then(function(apiResponse)
					{
						moment().constructor.prototype.currentTimeZoneTime = function()
						{
							var now = moment().utcOffset(apiResponse.Items[0]);
							return moment([now.year(), now.month(), now.date(), now.hour(), now.minutes(), now.seconds(), now.millisecond()]);
						};
					});
					return Promise.all([p1, p2])
						.then(function()
						{
							var validateAllDB = function()
							{
								return tf.datasourceManager.validateAllDBs()
									.then(function(valResult)
									{
										if (valResult.Items[0].AnyDBPass)
										{
											if (valResult.Items[0].DBlength === 1)
											{
												tf.storageManager.save("databaseType", valResult.Items[0].DBType);
												tf.storageManager.save("datasourceId", valResult.Items[0].DBId);
												tf.storageManager.save("databaseName", valResult.Items[0].DBName);
												return tf.datasourceManager.validate();
											}
											return false;
										} else
										{
											if (valResult.Items[0].DBlength === 1)
											{
												invalidateMessage = valResult.Items[0].DBName + " could not load.  There is only one data source.  Try again later.  If you continue to experience issues, contact your Transfinder Project Manager or your Support Representative (support@transfinder.com or 888-427-2403).";
											} else
											{
												invalidateMessage = "None of your Data Sources can be loaded.  If you continue to experience issues, contact your Transfinder Project Manager or your Support Representative (support@transfinder.com or 888-427-2403).";
											}
											return "nodatasource";
										}
									});
							}
							currentDatabaseId = tf.storageManager.get("datasourceId");
							if (!currentDatabaseId || currentDatabaseId < 0)
							{
								return validateAllDB();
							}
							if (currentDatabaseId)
							{
								return tf.datasourceManager.validate().then(function(result)
								{
									if (result === false)
									{
										return validateAllDB();
									}
									return result;
								});
							} else
							{
								return validateAllDB();
							}
						})
						.then(function(validateResult)
						{
							if (validateResult === "nodatasource")
							{
								tf.loadingIndicator.tryHide();
								return tf.promiseBootbox.alert(invalidateMessage, "No Valid Data Source")
									.then(function()
									{
										tf.storageManager.save("token", "", true);
										location.reload();
										return null;
									});
							} else if (validateResult)
							{
								return tf.datasourceManager.verifyDataBaseNeedToRebuild(tf.datasourceManager.databaseId, tf.datasourceManager.databaseType)
									.then(function(noRebuild)
									{
										if (!noRebuild)
										{
											tf.loadingIndicator.tryHide();
											return tf.DBNeedToRebuildAlert(tf.datasourceManager.databaseName);
										}
										return Promise.resolve(true);
									});
							} else
							{
								tf.loadingIndicator.tryHide();
								// cannot validate the connections string
								var databaseName = tf.storageManager.get("databaseName"),
									message = (databaseName && databaseName.length > 0 ? "[" + tf.storageManager.get("databaseName") + "]" : "Current Datasource") + " is not available. " + TF.productName + " cannot be used without a data source. Would you like to choose a different data source?";
								return tf.promiseBootbox.yesNo({
									message: message,
									title: "Data Source Not Available",
									className: null,
									buttons: {
										yes: {
											label: "Choose Data Source",
											className: "btn-primary btn-sm btn-primary-black"
										},
										no: {
											label: "Cancel",
											className: "btn-default btn-sm btn-default-link"
										}
									}
								}).then(function(result)
								{
									//set db to null and basic settings to null
									if (result === true)
									{
										return Promise.resolve(false);
									} else
									{
										tf.storageManager.save("token", "", true);
										location.reload();
										return null;
									}
								});
							}
						})
						.then(function(isPass)
						{
							if (isPass === null)
							{
								return null;
							} else if (!isPass)
							{
								tf.datasourceManager.clearDBInfo();
								return tf.showSelectDataSourceModel();
							}
							tf.loadingIndicator.tryHide();
							return true;
						})
						.then(function(value)
						{
							if (value !== null)
							{
								return self._locatizationInitialization().then(function()
								{
									tf.authManager.authorizationInfo.onUpdateAuthorized.subscribe(self.changePermissions.bind(self));
									self.changePermissions();
									if (!TF.isPhoneDevice)
									{
										tf.pageManager.initNavgationBar();
									}
									tf.pageManager.initResizePanel();

									tf.pageManager.resizablePage.onLoaded.subscribe(function()
									{
										tf.pageManager.resizablePage.onLoaded.unsubscribeAll();

										if (window.opener && window.name === "new-detailWindow")
										{
											var id = getParameterByName('id'),
												detailView = new TF.DetailView.DetailViewViewModel(id);
											tf.pageManager.resizablePage.setLeftPage("workspace/detailview/detailview", detailView, null, true);
										}
										else
										{
											tf.pageManager.openNewPage(tf.storageManager.get(TF.productName + ".page") || "fieldtrips", null, true);
										}
									});
									return true;
								});
							}
							return null;
						}).then(function(value)
						{
							if (value !== null)
							{
								return tf.pageManager.loadDataSourceName();
							}
						});
				});
		});
	};

	Startup.prototype._createLoadingIndicator = function()
	{
		var loadingIndicator = new TF.LoadingIndicator($('#loadingindicator'));
		var loadingElement = document.getElementById("loadingindicator");
		ko.applyBindings(ko.observable(loadingIndicator, loadingElement), loadingElement);
		return loadingIndicator;
	};

	Startup.prototype.changePermissions = function()
	{
		var self = this;

		var ft1 = tf.authManager.isAuthorizedFor("level1Requestor", "read");
		var ft2 = tf.authManager.isAuthorizedFor("level2Administrator", "read");
		var ft3 = tf.authManager.isAuthorizedFor("level3Administrator", "read");
		var ft4 = tf.authManager.isAuthorizedFor("level4Administrator", "read");
		var ft5 = tf.authManager.isAuthorizedFor("transportationAdministrator", "read");
		var ft = ft1 || ft2 || ft3 || ft4 || ft5;

		var fltRead = tf.authManager.isAuthorizedFor("filters", "read");
		var fltAdd = tf.authManager.isAuthorizedFor("filters", "add");
		var fltEdit = tf.authManager.isAuthorizedFor("filters", "edit");
		var fltDelete = tf.authManager.isAuthorizedFor("filters", "delete");

		var pAdmin = tf.authManager.authorizationInfo.isAdmin;

		if (!tf.permissions)
		{
			tf.permissions = {
				obFieldTrips: ko.observable(ft),
				filtersRead: fltRead,
				filtersAdd: fltAdd,
				filtersEdit: fltEdit,
				filtersDelete: fltDelete,
				obIsAdmin: ko.observable(pAdmin),
				isHost: self.isHost,
				hasAuthorized: ft
			};
		} else
		{
			tf.permissions.hasAuthorized = ft;
			tf.permissions.obFieldTrips(ft);
			tf.permissions.obIsAdmin(pAdmin);

			tf.permissions.filtersRead = fltRead;
			tf.permissions.filtersAdd = fltAdd;
			tf.permissions.filtersEdit = fltEdit;
			tf.permissions.filtersDelete = fltDelete;
		}
	};

	Startup.prototype.libraryInitialization = function()
	{
		moment.locale("en-US");
		return Promise.resolve(i18n.init({
			fallbackLng: "en-US",
			lng: "en-US",
			load: "current",
			resGetPath: 'localization/en-US.json',
			useCookie: false
		}));
	};

	Startup.prototype._locatizationInitialization = function()
	{
		tf.localization = {
			Postal: 'Zip Code',
			AreaName: 'State',
			LocalName: 'United States',
			MeasureSystem: 'US',
			UnitsOfMeasure: 'Miles',
			PerHour: 'MPH',
			Abbrev: 'mi',
			Vehicle: 'MPG',
			PostalCodeLength: 5
		};
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "localization"))
			.then(function(response)
			{
				if (response.Items && response.Items.length > 0)
				{
					tf.localization = response.Items[0];
					tf.localization.PerHour = tf.localization.PerHour.toUpperCase();
					tf.localization.Vehicle = tf.localization.Vehicle.toUpperCase();
				}
			}.bind(this));
	};

	tf.DBNeedToRebuildAlert = function(datasourceName)
	{
		return tf.promiseBootbox.alert("This Data Source (" + datasourceName + ") needs to be rebuilt before it can be opened in " + TF.productName + ". To rebuild this Data Source, open it in Routefinder Pro.", "Alert")
			.then(function()
			{
				return Promise.resolve(false);
			});
	};
})();
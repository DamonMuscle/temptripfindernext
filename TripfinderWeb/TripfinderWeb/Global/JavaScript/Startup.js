(function()
{
	createNamespace("TF").Startup = Startup;
	tf.applicationTerm = {};

	tf.APPLICATIONTERMDEFAULTVALUES = [
		{ "Id": 1, "Term": "Alternate Site", "Singular": "Alternate Site", "Plural": "Alternate Sites", "Abbreviation": "Alt. Sites" },
		{ "Id": 2, "Term": "Contractor", "Singular": "Contractor", "Plural": "Contractors", "Abbreviation": null },
		{ "Id": 3, "Term": "District", "Singular": "District", "Plural": "Districts", "Abbreviation": null },
		{ "Id": 4, "Term": "Field Trip", "Singular": "Field Trip", "Plural": "Field Trips", "Abbreviation": null },
		{ "Id": 5, "Term": "Geo Region", "Singular": "Geo Region", "Plural": "Geo Regions", "Abbreviation": null },
		{ "Id": 6, "Term": "School", "Singular": "School", "Plural": "Schools", "Abbreviation": null },
		{ "Id": 7, "Term": "Staff", "Singular": "Staff", "Plural": "Staff", "Abbreviation": null },
		{ "Id": 8, "Term": "Student", "Singular": "Student", "Plural": "Students", "Abbreviation": null },
		{ "Id": 9, "Term": "Trip", "Singular": "Trip", "Plural": "Trips", "Abbreviation": null },
		{ "Id": 10, "Term": "Trip Stop", "Singular": "Trip Stop", "Plural": "Trip Stops", "Abbreviation": null },
		{ "Id": 11, "Term": "Stop", "Singular": "Stop", "Plural": "Stops", "Abbreviation": null },
		{ "Id": 12, "Term": "Vehicle", "Singular": "Vehicle", "Plural": "Vehicles", "Abbreviation": null },
		{ "Id": 13, "Term": "Driver", "Singular": "Driver", "Plural": "Drivers", "Abbreviation": null },
		{ "Id": 14, "Term": "Bus Aide", "Singular": "Bus Aide", "Plural": "Bus Aides", "Abbreviation": "Aide" },
		{ "Id": 15, "Term": "Activity", "Singular": "Activity", "Plural": "Activities", "Abbreviation": null },
		{ "Id": 16, "Term": "Adult", "Singular": "Adult", "Plural": "Adults", "Abbreviation": null },
		{ "Id": 17, "Term": "Arrival", "Singular": "Arrival", "Plural": "Arrival Times", "Abbreviation": null },
		{ "Id": 18, "Term": "Assigned", "Singular": "Assign", "Plural": "Assigned", "Abbreviation": null },
		{ "Id": 19, "Term": "Begin", "Singular": "Begin", "Plural": "Begin Times", "Abbreviation": null },
		{ "Id": 20, "Term": "Billing Classification", "Singular": "Billing Classification", "Plural": "Billing Classifications", "Abbreviation": null },
		{ "Id": 21, "Term": "Cell Phone", "Singular": "Cell Phone", "Plural": "Cell Phones", "Abbreviation": null },
		{ "Id": 22, "Term": "Chaperone", "Singular": "Chaperone", "Plural": "Chaperones", "Abbreviation": null },
		{ "Id": 23, "Term": "City", "Singular": "City", "Plural": "Cities", "Abbreviation": null },
		{ "Id": 24, "Term": "Classification", "Singular": "Classification", "Plural": "Classifications", "Abbreviation": null },
		{ "Id": 25, "Term": "Cohort", "Singular": "Cohort", "Plural": "Cohorts", "Abbreviation": null },
		{ "Id": 26, "Term": "Contact", "Singular": "Contact", "Plural": "Contacts", "Abbreviation": null },
		{ "Id": 27, "Term": "Date of Birth", "Singular": "Date of Birth", "Plural": "Date of Births", "Abbreviation": "DOB" },
		{ "Id": 28, "Term": "Depart", "Singular": "Depart", "Plural": "Depart Times", "Abbreviation": null },
		{ "Id": 29, "Term": "Department", "Singular": "Department", "Plural": "Departments", "Abbreviation": null },
		{ "Id": 30, "Term": "Departure", "Singular": "Departure", "Plural": "Departures", "Abbreviation": null },
		{ "Id": 31, "Term": "Destination", "Singular": "Destination", "Plural": "Destinations", "Abbreviation": null },
		{ "Id": 32, "Term": "Disability", "Singular": "Disability", "Plural": "Disabilities", "Abbreviation": null },
		{ "Id": 33, "Term": "Drop Off", "Singular": "Drop Off", "Plural": "Drop Off", "Abbreviation": null },
		{ "Id": 34, "Term": "Email", "Singular": "Email", "Plural": "Emails", "Abbreviation": null },
		{ "Id": 35, "Term": "End", "Singular": "End", "Plural": "End Times", "Abbreviation": null },
		{ "Id": 36, "Term": "Equipment", "Singular": "Equipment", "Plural": "Equipment", "Abbreviation": null },
		{ "Id": 37, "Term": "Ethnicity", "Singular": "Ethnicity", "Plural": "Ethnicities", "Abbreviation": null },
		{ "Id": 38, "Term": "Exception", "Singular": "Exception", "Plural": "Exceptions", "Abbreviation": null },
		{ "Id": 39, "Term": "Extension", "Singular": "Extension", "Plural": "Extensions", "Abbreviation": "Ext." },
		{ "Id": 40, "Term": "Fax", "Singular": "Fax", "Plural": "Faxes", "Abbreviation": null },
		{ "Id": 41, "Term": "First", "Singular": "First", "Plural": "First", "Abbreviation": null },
		{ "Id": 42, "Term": "Gender", "Singular": "Gender", "Plural": "Genders", "Abbreviation": null },
		{ "Id": 43, "Term": "Geocode Address", "Singular": "Geocode Address", "Plural": "Geocode Addresses", "Abbreviation": null },
		{ "Id": 44, "Term": "Grade", "Singular": "Grade", "Plural": "Grades", "Abbreviation": null },
		{ "Id": 45, "Term": "Guardian", "Singular": "Guardian", "Plural": "Guardians", "Abbreviation": null },
		{ "Id": 46, "Term": "Home Phone", "Singular": "Home Phone", "Plural": "Home Phones", "Abbreviation": null },
		{ "Id": 47, "Term": "Last", "Singular": "Last", "Plural": "Last", "Abbreviation": null },
		{ "Id": 48, "Term": "Load Time", "Singular": "Load Time", "Plural": "Load Time", "Abbreviation": null },
		{ "Id": 49, "Term": "Local ID", "Singular": "Local ID", "Plural": "Local IDs", "Abbreviation": null },
		{ "Id": 50, "Term": "Location", "Singular": "Location", "Plural": "Locations", "Abbreviation": null },
		{ "Id": 51, "Term": "Mailing Address", "Singular": "Mailing Address", "Plural": "Mailing Address", "Abbreviation": null },
		{ "Id": 52, "Term": "Middle", "Singular": "Middle", "Plural": "Middle", "Abbreviation": "MI" },
		{ "Id": 53, "Term": "Name", "Singular": "Name", "Plural": "Names", "Abbreviation": null },
		{ "Id": 54, "Term": "Phone", "Singular": "Phone", "Plural": "Phones", "Abbreviation": null },
		{ "Id": 55, "Term": "Pick Up", "Singular": "Pick Up", "Plural": "Pick Up", "Abbreviation": null },
		{ "Id": 56, "Term": "Site", "Singular": "Site", "Plural": "Sites", "Abbreviation": null },
		{ "Id": 57, "Term": "Social Security Number", "Singular": "Social Security Number", "Plural": "Social Security Numbers", "Abbreviation": "SSN" },
		{ "Id": 58, "Term": "State", "Singular": "State", "Plural": "States", "Abbreviation": "ST" },
		{ "Id": 59, "Term": "Street", "Singular": "Street", "Plural": "Street", "Abbreviation": null },
		{ "Id": 60, "Term": "Title", "Singular": "Title", "Plural": "Titles", "Abbreviation": null },
		{ "Id": 61, "Term": "User Defined Field", "Singular": "User Defined Field", "Plural": "User Defined Fields", "Abbreviation": null },
		{ "Id": 62, "Term": "Wheel Chair", "Singular": "Wheel Chair", "Plural": "Wheel Chairs", "Abbreviation": "WC" },
		{ "Id": 63, "Term": "Work Phone", "Singular": "Work Phone", "Plural": "Work Phones", "Abbreviation": null }
	];

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

	tf.applicationTerm.updateDataPointsWithApplicationTerm = function()
	{
		var dataPoints = dataPointsJSON, gridKeys = Object.keys(dataPoints), categoryKeys, columns,
			updateString = function(str)
			{
				$.each(tf.APPLICATIONTERMDEFAULTVALUES, function(index, defaultTerm)
				{
					if (tf.applicationTerm[defaultTerm.Term])
					{
						str = str.replace(new RegExp('\\b' + defaultTerm.Singular + '\\b', 'ig'), tf.applicationTerm[defaultTerm.Term].Singular);
						str = str.replace(new RegExp('\\b' + defaultTerm.Plural + '\\b', 'ig'), tf.applicationTerm[defaultTerm.Term].Plural);
						str = str.replace(new RegExp('\\b' + defaultTerm.Abbreviation + '\\b', 'ig'), tf.applicationTerm[defaultTerm.Term].Abbreviation);
					}
				});

				return str;
			};

		$.each(gridKeys, function(index1, gridKey)
		{
			categoryKeys = Object.keys(dataPoints[gridKey]);
			$.each(categoryKeys, function(index2, categoryKey)
			{
				columns = dataPoints[gridKey][categoryKey];
				$.each(columns, function(index3, c)
				{
					c.title = updateString(c.title);
					if (c.type === "Boolean")
					{
						c.displayValue = updateString(c.displayValue);
						c.positiveLabel = updateString(c.positiveLabel);
						c.negativeLabel = updateString(c.negativeLabel);
					}
				});
			});
		});
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
								return Promise.all([p1, p2, p3]).then(function()
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
			tf.entStorageManager = new TF.EntStorageManager();
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
			tf.kendoHackHelper = new TF.KendoHackHelper();
			tf.urlParm = self.getURLParm();// For the link in notification email FT-380
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
							if (tf.urlParm && tf.urlParm.DB)
							{
								tf.storageManager.save("datasourceId", tf.urlParm.DB);
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
										tf.entStorageManager.save("token", "");
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
									productName = (TF.productName.charAt(0).toUpperCase() + TF.productName.slice(1)),
									message = (!!databaseName ? "[" + databaseName + "]" : "Current Data Source") + " is not available. " + productName + " cannot be used without a Data Source. Would you like to choose a different Data Source?";
								return tf.promiseBootbox.yesNo({
									message: message,
									title: "Data Source Not Available",
									className: null,
									buttons: {
										yes: {
											label: "Choose Data Source",
											className: TF.isPhoneDevice ? "btn-yes-mobile" : "btn-primary btn-sm btn-primary-black"
										},
										no: {
											label: "Cancel",
											className: TF.isPhoneDevice ? "btn-no-mobile" : "btn-default btn-sm btn-default-link"
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
										tf.entStorageManager.save("token", "");
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
							return true;
						})
						.then(function(value)
						{
							if (value !== null)
							{
								return self._locatizationInitialization().then(function()
								{
									if (tf.authManager.clientKey !== "support")
									{
										return self._loadApplicationTerm().then(function() { tf.loadingIndicator.tryHide(); });
									}

									tf.loadingIndicator.tryHide();

									return null;
								}).then(function()
								{
									tf.authManager.authorizationInfo.onUpdateAuthorized.subscribe(self.changePermissions.bind(self));
									self.changePermissions();
									tf.pageManager = new TF.Page.PageManager();
									if (!TF.isPhoneDevice)
									{
										tf.pageManager.initNavgationBar();
									}
									tf.pageManager.initResizePanel();

									tf.pageManager.resizablePage.onLoaded.subscribe(function()
									{
										tf.pageManager.resizablePage.onLoaded.unsubscribeAll();

										if (window.opener && window.name.indexOf("new-pageWindow") >= 0)
										{
											var pageType = getParameterByName("pagetype");
											if (pageType)
											{
												tf.pageManager.openNewPage(pageType, null, true, true);
												return;
											}
										}

										if (window.opener && window.name.indexOf("new-detailWindow") >= 0)
										{
											var id = getParameterByName('id');
											if (id != null)
											{
												var detailView = new TF.DetailView.DetailViewViewModel(id);
												tf.pageManager.resizablePage.setLeftPage("workspace/detailview/detailview", detailView, null, true);
												return;
											}
										}
										else
										{
											tf.pageManager.showMessageModal(true);
										}

										if (tf.urlParm && tf.urlParm.tripid)
										{
											tf.pageManager.openNewPage("fieldtrips", { filteredIds: [tf.urlParm.tripid] }, true);
											return;
										}

										if (tf.authManager.authorizationInfo.isFieldTripAdmin)
										{
											tf.pageManager.openNewPage(tf.storageManager.get(TF.productName.toLowerCase() + ".page") || "fieldtrips", null, true);
											return;
										}

										tf.pageManager.openNewPage("fieldtrips", null, true);
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

	Startup.prototype._loadApplicationTerm = function()
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "applicationterm", "getall"))
			.then(function(response)
			{
				if (response.Items && response.Items.length > 0)
				{
					// TODO: From Cait's mail, "For Production apps, we only need to worry about LanguageID=1 for now. 
					// When this additional functionality is complete and Plus is released and then 
					// we will have to look up the language through the localSettings table and 
					// look up app terms per that language ID.But, for now, just worry about LanguageID = 1."
					// But in local database, there is no LanguageID=1. Use min language id here.
					var minLanguageId = Number.MAX_VALUE;
					response.Items.forEach(function(term)
					{
						if (term.LanguageId < minLanguageId)
						{
							minLanguageId = term.LanguageId;
						}
					});
					response.Items.forEach(function(term)
					{
						if (term.LanguageId === minLanguageId)
						{
							tf.applicationTerm[term.Term] = term;
						}
					});

					tf.applicationTerm.updateDataPointsWithApplicationTerm();
				}
			}.bind(this));
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

		var docRead = tf.authManager.isAuthorizedFor("documentTab", "read");
		var docAdd = tf.authManager.isAuthorizedFor("documentTab", "add");
		var docEdit = tf.authManager.isAuthorizedFor("documentTab", "edit");
		var docDelete = tf.authManager.isAuthorizedFor("documentTab", "delete");

		var pAdmin = tf.authManager.authorizationInfo.isAdmin;

		if (!tf.permissions)
		{
			tf.permissions = {
				obFieldTrips: ko.observable(ft),
				filtersRead: fltRead,
				filtersAdd: fltAdd,
				filtersEdit: fltEdit,
				filtersDelete: fltDelete,
				documentRead: docRead,
				documentAdd: docAdd,
				documentEdit: docEdit,
				documentDelete: docDelete,
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

			tf.permissions.documentRead = docRead;
			tf.permissions.documentAdd = docAdd;
			tf.permissions.documentEdit = docEdit;
			tf.permissions.documentDelete = docDelete;

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
	Startup.prototype.getURLParm = function()
	{
		var parm = location.href;
		var parm_result = new Object;
		var start = parm.indexOf("?") != -1 ? parm.indexOf("?") + 1 : parm.length;
		var end = parm.indexOf("#") != -1 ? parm.indexOf("#") : parm.length;
		parm = parm.substring(start, end);
		parm_array = parm.split("&");
		for (var i = 0; i < parm_array.length; i++)
		{
			parm_result[parm_array[i].split("=")[0]] = parm_array[i].split("=")[1];
		}
		return parm_result;
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
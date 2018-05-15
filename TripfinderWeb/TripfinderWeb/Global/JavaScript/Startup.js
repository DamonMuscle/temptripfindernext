(function()
{
	createNamespace("TF").Startup = Startup;
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
									//self.clearDBInfo();
									return tf.DBNeedToRebuildAlert(notValidDatabaseName);
								}
								return Promise.resolve(true);
							});
					})
					.catch(function()
					{ // failed to connection
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
							{ //maybe need logoff
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

			tf.authManager.auth(new TF.Modal.TripfinderLoginModel())
				.then(function()
				{
					return sessionValidator.activate();
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
											if (valResult.Items[0].DBlength == 1)
											{
												tf.storageManager.save("databaseType", valResult.Items[0].DBType);
												tf.storageManager.save("datasourceId", valResult.Items[0].DBId);
												tf.storageManager.save("databaseName", valResult.Items[0].DBName);
												return tf.datasourceManager.validate();
											}
											return false;
										} else
										{
											if (valResult.Items[0].DBlength == 1)
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
								return tf.promiseBootbox.alert(invalidateMessage, "No Validate Data Source")
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
											return tf.DBNeedToRebuildAlert(tf.datasourceManager.databaseName);
										}
										return Promise.resolve(true);
									});
							} else
							{
								tf.loadingIndicator.tryHide();
								// cannot validate the connections string
								var databaseName = tf.storageManager.get("databaseName"),
									message = (databaseName && databaseName.length > 0 ? "[" + tf.storageManager.get("databaseName") + "]" : "Current Datasource") + " is not available. Viewfinder cannot be used without a data source. Would you like to choose a different data source?";
								return tf.promiseBootbox.yesNo({
									message: message,
									title: "Data Source Not Available",
									className: TF.isPhoneDevice ? "unsave-mobile" : null,
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
								tf.authManager.authorizationInfo.onUpdateAuthorized.subscribe(self.changePermissions.bind(self));
								self.changePermissions();
								tf.pageManager.openNewPage("fieldtrip");
								return true;
							}
							return null;
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

		var rep = tf.authManager.isAuthorizedFor("reports", "read");
		var rep1 = tf.authManager.isAuthorizedFor("reports", "add");
		var rep2 = tf.authManager.isAuthorizedFor("reports", "edit");
		var rep3 = tf.authManager.isAuthorizedFor("reports", "delete");

		var schduleRep = tf.authManager.isAuthorizedFor("scheduleReport", "read");
		var schduleRep1 = tf.authManager.isAuthorizedFor("scheduleReport", "add");
		var schduleRep2 = tf.authManager.isAuthorizedFor("scheduleReport", "edit");
		var schduleRep3 = tf.authManager.isAuthorizedFor("scheduleReport", "delete");

		var ft1 = tf.authManager.isAuthorizedFor("level1Requestor", "read");
		var ft2 = tf.authManager.isAuthorizedFor("level2Administrator", "read");
		var ft3 = tf.authManager.isAuthorizedFor("level3Administrator", "read");
		var ft4 = tf.authManager.isAuthorizedFor("level4Administrator", "read");
		var ft5 = tf.authManager.isAuthorizedFor("transportationAdministrator", "read");
		var ft = ft1 || ft2 || ft3 || ft4 || ft5;

		var p1 = tf.authManager.isAuthorizedFor("trip", "read");
		var p2 = tf.authManager.isAuthorizedFor("busfinder", "read");
		var p3 = tf.authManager.isAuthorizedFor("staff", "read");
		var p4 = tf.authManager.isAuthorizedFor("vehicle", "read");
		var p5 = tf.authManager.isAuthorizedFor("student", "read");
		var fltRead = tf.authManager.isAuthorizedFor("filters", "read");
		var fltAdd = tf.authManager.isAuthorizedFor("filters", "add");
		var fltEdit = tf.authManager.isAuthorizedFor("filters", "edit");
		var fltDelete = tf.authManager.isAuthorizedFor("filters", "delete");
		var pAltSite = tf.authManager.isAuthorizedFor("alternateSite", "read");
		var pContractor = tf.authManager.isAuthorizedFor("contractor", "read");
		var pDistrict = tf.authManager.isAuthorizedFor("district", "read");
		var pGeoRegion = tf.authManager.isAuthorizedFor("geoRegions", "read");
		var pSchool = tf.authManager.isAuthorizedFor("school", "read");
		var busfinder = self.isBusfinder && p2;
		var pAttendance = tf.authManager.isAuthorizedFor("tripCalendarAttendanceRecords", "read");
		var pAdmin = tf.authManager.authorizationInfo.isAdmin;

		if (!tf.permissions)
		{
			tf.permissions = {
				obTrips: ko.observable(p1),
				obFieldTrips: ko.observable(ft),
				obStudent: ko.observable(p5),
				obVehicle: ko.observable(p4),
				obAltsite: ko.observable(pAltSite),
				obContractor: ko.observable(pContractor),
				obDistrict: ko.observable(pDistrict),
				obGeoRegions: ko.observable(pGeoRegion),
				obSchool: ko.observable(pSchool),
				obStaff: ko.observable(p3),
				obTripstop: ko.observable(p1),
				obPlannedTripsVsActual: ko.observable(p1 && busfinder),
				obBusfinder: ko.observable(busfinder),
				obAttendance: ko.observable(pAttendance),
				obSummary: ko.observable(p1 && p3 && p4 && p5 && ft),
				reports: {
					obRead: ko.observable(rep || schduleRep),
					obAdd: ko.observable(rep1 || schduleRep1),
					obEdit: ko.observable(rep2 || schduleRep2),
					obDelete: ko.observable(rep3 || schduleRep3)
				},
				filtersRead: fltRead,
				filtersAdd: fltAdd,
				filtersEdit: fltEdit,
				filtersDelete: fltDelete,
				obIsAdmin: ko.observable(pAdmin),
				isHost: self.isHost,
				hasAuthorized: p1 || p2 || p3 || p4 || p5 || ft || rep || schduleRep || pAltSite || pContractor || pDistrict || pGeoRegion || pSchool || pAttendance
			};

			tf.permissions.obDashboards = ko.computed(function()
			{
				return tf.permissions.obTrips() || tf.permissions.obFieldTrips() || tf.permissions.obSummary() || tf.permissions.obPlannedTripsVsActual() || tf.permissions.obAttendance();
			});

			tf.permissions.obGrids = ko.computed(function()
			{
				return tf.permissions.obTrips() || tf.permissions.obFieldTrips() || tf.permissions.obAltsite() || tf.permissions.obContractor() || tf.permissions.obDistrict() ||
					tf.permissions.obGeoRegions() || tf.permissions.obSchool() || tf.permissions.obStaff() || tf.permissions.obStudent() || tf.permissions.obVehicle() || tf.permissions.obBusfinder();
			});
		} else
		{
			tf.permissions.hasAuthorized = p1 || p2 || p3 || p4 || p5 || ft || rep || schduleRep || pAltSite || pContractor || pDistrict || pGeoRegion || pSchool || pAttendance;

			tf.permissions.obTrips(p1);
			tf.permissions.obFieldTrips(ft);
			tf.permissions.obStudent(p5);
			tf.permissions.obVehicle(p4);
			tf.permissions.obAltsite(pAltSite);
			tf.permissions.obContractor(pContractor);
			tf.permissions.obDistrict(pDistrict);
			tf.permissions.obGeoRegions(pGeoRegion);
			tf.permissions.obSchool(pSchool);
			tf.permissions.obStaff(p3);
			tf.permissions.obTripstop(p1);
			tf.permissions.obPlannedTripsVsActual(p1 && busfinder);
			tf.permissions.obBusfinder(busfinder);
			tf.permissions.obAttendance(pAttendance);
			tf.permissions.obSummary(p1 && p3 && p4 && p5 && ft);
			tf.permissions.reports.obRead(rep || schduleRep);
			tf.permissions.reports.obAdd(rep1 || schduleRep1);
			tf.permissions.reports.obEdit(rep2 || schduleRep2);
			tf.permissions.reports.obDelete(rep3 || schduleRep3);
			tf.permissions.obIsAdmin(pAdmin);

			tf.permissions.filtersRead = fltRead;
			tf.permissions.filtersAdd = fltAdd;
			tf.permissions.filtersEdit = fltEdit;
			tf.permissions.filtersDelete = fltDelete;
		}
	};

	Startup.prototype.libraryInitialization = function()
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
		moment.locale("en-US");
		return Promise.resolve(i18n.init({
			fallbackLng: "en-US",
			lng: "en-US",
			load: "current",
			resGetPath: 'localization/en-US.json',
			useCookie: false
		}));
	};
})();
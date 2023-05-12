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
		{ "Id": 63, "Term": "Work Phone", "Singular": "Work Phone", "Plural": "Work Phones", "Abbreviation": null },
		{ "Id": 64, "Term": "Report", "Singular": "Report", "Plural": "Reports", "Abbreviation": null },
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
						str = str.replace(new RegExp(`\\b${defaultTerm.Singular}\\b`, 'ig'), tf.applicationTerm[defaultTerm.Term].Singular);
						str = str.replace(new RegExp(`\\b${defaultTerm.Plural}\\b`, 'ig'), tf.applicationTerm[defaultTerm.Term].Plural);
						str = str.replace(new RegExp(`\\b${defaultTerm.Abbreviation}\\b`, 'ig'), tf.applicationTerm[defaultTerm.Term].Abbreviation);
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

	tf.showSelectDataSourceModel = function(databaseName, disableClose)
	{
		var modal = new TF.Modal.DataSourceChangeModalViewModel(databaseName);
		modal.OutSizeClickEnable = !!disableClose;
		return tf.modalManager.showModal(modal)
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

				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "DatabaseVerifications?dbid=" + datasource.DBID))
					.then(function(result)
					{
						if (result && result.Items && result.Items[0] && result.Items[0].AnyDatabasePass)
						{
							tf.loadingIndicator.tryHide();
							return Promise.resolve(true);
						}
						else
						{
							Promise.reject();
						}
					})
					.catch(function()
					{
						// failed to connection
						return tf.promiseBootbox.dialog({
							message: `${databaseName} could not load.&nbsp;&nbsp;Try again later.&nbsp;&nbsp;`
								+ "If you continue to experience issues, please contact your Transfinder Project Manager or Support Representative "
								+ "(support@transfinder.com or 888-427-2403).",
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
							if (datasource && datasource.DBID)
							{
								var p1 = tf.storageManager.save("datasourceId", datasource.DBID);
								var p2 = tf.storageManager.save("databaseName", databaseName);
								return Promise.all([p1, p2]).then(function()
								{
									tf.reloadPageWithDatabaseId(datasource.DBID);

									return "loginpage";
								});
							}
						} else
						{
							if (!databaseName)
							{
								tf.datasourceManager.clearDBInfo();
								return tf.showSelectDataSourceModel(null, disableClose);
							}
						}
					});
			}.bind(this));
	};

	tf.PasswordChangeModalViewModel = function()
	{
		return tf.modalManager.showModal(
			new TF.Modal.PasswordChangeModalViewModel('aaa')
		)
			.then(function(datasource)
			{
				return Promise.resolve(true);
			}.bind(this));
	};

	tf.reloadPageWithDatabaseId = function(databaseId)
	{
		var newLocation = window.location.pathname,
			queryParameters = Object.getOwnPropertyNames(tf.urlParm)
				.filter(function(name)
				{
					return !databaseId ? (name && name !== "DB") : true;
				})
				.map(function(name)
				{
					var paramValue = name === "DB" ? databaseId : tf.urlParm[name];
					return String.format("{0}={1}", name, paramValue);
				});

		if (queryParameters.length > 0)
		{
			newLocation += ("?" + queryParameters.join("&"));
		}

		window.location.href = newLocation;
	};

	function Startup()
	{
		// This is intentional
	}

	Startup.prototype.start = function()
	{
		var self = this;
		const startupIndicatorName = "startup";
		self.libraryInitialization().then(function()
		{
			tf.dataFormatHelper = new TF.DataFormatHelper();
			tf.fullScreenHelper = new TF.FullScreenHelper();
			tf.shortCutKeys = new TF.ShortCutKeys();
			tf.storageManager = new TF.StorageManager("tfweb");
			tf.entStorageManager = new TF.EntStorageManager();
			tf.loadingIndicator = self._createLoadingIndicator();
			tf.ajax = new TF.Ajax(tf.loadingIndicator, true);
			tf.promiseAjax = new TF.PromiseAjax(tf.ajax);
			tf.documentEvent = new TF.DocumentEvent();
			tf.modalManager = new TF.Modal.ModalManager();
			tf.modalHelper = new TF.ModalHelper();
			tf.datasourceManager = new TF.DatasourceManager();
			tf.contextMenuManager = new TF.ContextMenu.ContextMenuManager();
			tf.authManager = new TF.AuthManager();
			var sessionValidator = new TF.Session.SoftSessionValidator(tf.authManager);
			tf.api = new TF.API(tf.authManager, tf.datasourceManager);
			tf.kendoHackHelper = new TF.KendoHackHelper();
			tf.docFilePreviewHelper = new TF.Control.DocumentFilePreviewViewModel($("body"));
			tf.helpers = {
				detailViewHelper: new TF.DetailView.DetailViewHelper(),
				kendoGridHelper: new TF.Helper.KendoGridHelper(),
				miniGridHelper: new TF.Helper.MiniGridHelper(),
				fieldTripAuthHelper: new TF.FieldTripAuthHelper()
			};
			tf.fieldTripConfigsDataHelper = new TF.Helper.FieldTripConfigsDataHelper();

			//tf.dataTypeHelper = new TF..DataTypeHelper();
			//tf.dataTypeHelper.init();
			tf.urlParm = self.getURLParm();// For the link in notification email FT-380
			TF.getLocation(); //request permission
			tf.authManager.auth(new TF.Modal.TripfinderLoginModel()).then(function()
			{
				tf.loadingIndicator.showByName(startupIndicatorName);
				tf.measurementUnitConverter = new TF.MeasurementUnitConverter();
				return tf.measurementUnitConverter.init();
			})
			.then(function()
			{
				sessionValidator.activate();
				tf.DataTypeHelper = new TF.Helper.DataTypeHelper();
				tf.dataTypeHelper = tf.DataTypeHelper;
				return tf.DataTypeHelper.init();
			})
			.then(function()
			{
				return self.loadExagoBIServerUrl()
					.then(function()
					{
						tf.exagoBIHelper = new TF.Helper.ExagoBIHelper();
						tf.exagoBIHelper.initClientReportContext();
					})
			})
			.then(function()
			{
				tf.setting = new TF.Setting();
				return tf.setting.getRoutingConfig();
			}).then(function()
			{
				tf.UDFDefinition = new TF.GridDefinition.UDFDefinition();
				return tf.UDFDefinition.loadAll();
			}).then(function()
			{
				tf.helpers.detailViewHelper.init();
			})
			.then(function()
			{
				var p1 = tf.userPreferenceManager.getAllKey();
				var p2 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "timezonetotalminutes")).then(function(timeZoneResponse)
				{
					if (timeZoneResponse && timeZoneResponse.Items && timeZoneResponse.Items[0] != undefined && timeZoneResponse.Items[0] != null)
					{
						tf.timezonetotalminutes = timeZoneResponse.Items[0];
						tf.localTimeZone = {
							timeZoneTotalMinutes: tf.timezonetotalminutes,
							hoursDiff: tf.timezonetotalminutes / 60
						};
					}
				});
				var p3 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "applications"), {
					paramData: {
						"Name": TF.productName
					}
				}).then(function(apiResponse)
				{
					TF.productID = apiResponse.Items[0].ID;
				});

				const array = location.pathname.split("/").filter(r => r);
				// get extra js location
				var extrasLocation = location.origin.concat(
					array.length === 1 ? "/" + array[0] : "",
					"/Global/JavaScript/Framework/Map");

				window.tf.map = new TF.Map.BaseMap();
				var p4 = window.tf.map.usingArcGIS(extrasLocation);

				var p5 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "clienttimezoneinfo")).then(function(timeZoneResponse)
				{
					if (timeZoneResponse && timeZoneResponse.Items && timeZoneResponse.Items[0] != undefined && timeZoneResponse.Items[0] != null)
					{
						tf.clientTimeZone = timeZoneResponse.Items[0];
					}
				});

				return Promise.all([p1, p2, p3, p4, p5])
					.then(function()
					{
						TF.SignalRHelper.registerSignalRHubs(['TimeZoneHub', 'TimeZoneInfoHub']);
						TF.SignalRHelper.bindEvent('TimeZoneHub', 'update', function update(result)
						{
							tf.timezonetotalminutes = result;
							if (tf.localTimeZone)
							{
								tf.localTimeZone.timeZoneTotalMinutes = tf.timezonetotalminutes;
								tf.localTimeZone.hoursDiff = tf.timezonetotalminutes / 60;
							}
						});
						TF.SignalRHelper.bindEvent('TimeZoneInfoHub', 'update', function update(result)
						{
							tf.clientTimeZone = result;
						});

						var dbIdSuppliedInUrl = tf.urlParm && tf.urlParm.hasOwnProperty("DB"),
							updateDataSourcePromise = Promise.resolve(true);

						if (dbIdSuppliedInUrl)
						{
							var dbIdInUrlValue = parseInt(tf.urlParm.DB),
								databaseIdFromUrl = (Number.isInteger(dbIdInUrlValue) && dbIdInUrlValue) ? dbIdInUrlValue : -1;

							updateDataSourcePromise = tf.storageManager.save("datasourceId", databaseIdFromUrl);
						}


						return updateDataSourcePromise
							.then(function()
							{
								return tf.datasourceManager.validate();
							})
							.then(function(isValid)
							{
								if (isValid === true)
								{
									tf.storageManager.save("databaseType", tf.datasourceManager.databaseType);
									tf.storageManager.save("datasourceId", tf.datasourceManager.databaseId);
									tf.storageManager.save("databaseName", tf.datasourceManager.databaseName);
									return true;
								}
								else
								{
									return isValid;
								}
							});
					})
					.then(function(validateResult)
					{
						if (validateResult === true)
						{
							tf.datasourceManager.getAllDataSources();
							tf.datasourceManager.setDatabaseInfo();
							return Promise.resolve(true);
						}
						else if (validateResult === false)
						{
							tf.loadingIndicator.hideByName(startupIndicatorName); // hide indicator before showing alert
							return tf.datasourceManager.getAllDataSources()
								.then(function (dataSources)
								{
									if (dataSources && dataSources.length > 0)
									{
										return tf.promiseBootbox.alert({
											message: "The Data Source requested is no longer available. Please select an active Data Source.",
											title: "No Data Source Selected"
										}).then(function ()
										{
											return false;
										});
									}
									else
									{
										var message = "There is no active Data Source available.Please contact your Tripfinder Administrator.";
										return tf.promiseBootbox.alert({
											message: message,
											title: "No Data Source Selected",
											className: null,
											buttons: {
												yes: {
													label: "Choose Data Source",
													className: TF.isPhoneDevice ? "btn-yes-mobile" : "btn-primary btn-sm btn-primary-black"
												}
											}
										}).then(function ()
										{
											tf.entStorageManager.save("token", "");
											tf.reloadPageWithDatabaseId(null);
											return null;
										});
									}
								});
						} else
						{
							tf.loadingIndicator.hideByName(startupIndicatorName); // hide indicator before showing select datasource modal
							return Promise.resolve(false);
						}
					})
					.then(function(isPass)
					{
						if (isPass === null)
						{
							// the indicator is hide already
							return null;
						} else if (!isPass)
						{
							// the indicator is hide already
							tf.datasourceManager.clearDBInfo();
							return tf.showSelectDataSourceModel(null, true).then((value) => {
								tf.loadingIndicator.showByName(startupIndicatorName); // show indicator for next steps
								return value;
							});
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
									return self._loadApplicationTerm();
								}

								return null;
							}).then(function()
							{
								tf.authManager.authorizationInfo.onUpdateAuthorized.subscribe(self.changePermissions.bind(self));
								self.changePermissions();
								tf.fieldTripConfigsDataHelper.CacheConfigs();

								tf.pageManager = new TF.Page.PageManager();
								var promise;
								if (!TF.isPhoneDevice)
								{

									promise = tf.pageManager.initNavgationBar();
								}
								else
								{
									promise = Promise.resolve();
								}

								return promise.then(function()
								{
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
												//var detailView = new TF.DetailView.DetailViewViewModel(id);
												var detailView = new TF.DetailView.DetailViewViewModel(id, null, true, {});
												tf.pageManager.resizablePage.setLeftPage("workspace/detailview/detailview", detailView, null, true);
												return;
											}
										}
										else
										{
											tf.pageManager.showMessageModal(true);
										}

										if (tf.urlParm)
										{
											if (tf.urlParm.tripid)
											{
												var pageOptions = {	// FT-1231 - setup some special flags for open a certain trip record on-demand
													filteredIds: [tf.urlParm.tripid],
													isTemporaryFilter: true,
													showRecordDetails: true
												};
												tf.pageManager.openNewPage("fieldtrips", pageOptions, true);
												return;
											}
											else if (tf.urlParm.DB)
											{
												if (tf.authManager.authorizationInfo.isAdmin || tf.authManager.authorizationInfo.onlyLevel1)
												{
													tf.pageManager.openNewPage("fieldtrips", null, true);
													return;
												}
												else
												{
													tf.pageManager.openNewPage("approvals", null, true);
													return;
												}
											}
										}

										var pageName = tf.storageManager.get(TF.productName.toLowerCase() + ".page");
										if (!pageName || pageName === "settingsConfig" || pageName === "reports" && !tf.authManager.authorizationInfo.isAuthorizedFor("reports", "read"))
										{
											pageName = "fieldtrips";
										}

										tf.pageManager.openNewPage(pageName, null, true);
									});
									self.changeStaffType();
									self._initClosePageConfirm();
									TF.SessionItem.refresh();
									return true;
								});
							});
						}
						return null;
					})
					.then(function(value)
					{
						if (!value)
						{
							return;
						}

						return tf.pageManager.loadDataSourceName();
					})
					.finally(function()
					{
						tf.loadingIndicator.hideByName(startupIndicatorName); // force to hide indicator in finally
					});
			});
		});
	};

	Startup.prototype.changeStaffType = function ()
	{
		if (tf.staffInfo != null)
		{
			return;
		}
		tf.staffInfo = {
			isStaff: false,
			isDriver: false,
			isAide: false,
			staffID: []
		};
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), 'staff'), {
			paramData: {
				'@relationships': 'all',
				userid: tf.authManager.authorizationInfo.authorizationTree.userId
			}
		})
			.then(function (apiResponse)
			{
				if (apiResponse.Items && apiResponse.Items.length > 0)
				{
					tf.staffInfo.items = apiResponse.Items;
					apiResponse.Items.forEach(item =>
					{
						tf.staffInfo.staffID.push(item.Id);
						if (item.StaffTypeIds && item.StaffTypeIds.length > 0)
						{
							item.StaffTypeIds.forEach(type =>
							{
								if (type === 2)
								{
									tf.staffInfo.isStaff = true;
									tf.staffInfo.isDriver = true;
								}
								else if (type === 1)
								{
									tf.staffInfo.isStaff = true;
									tf.staffInfo.isAide = true;
								}
							});
						}
					});
				}
			});
	};

	Startup.prototype._loadApplicationTerm = function()
	{
		tf.APPLICATIONTERMDEFAULTVALUES.map(function(item)
		{
			tf.applicationTerm[item.Term] = item;
		});

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "applicationterms"))
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

		var p1 = tf.authManager.isAuthorizedFor("staff", "read");
		var p2 = tf.authManager.isAuthorizedFor("vehicle", "read");

		var docRead = tf.authManager.isAuthorizedFor("documentTab", "read");
		var docAdd = tf.authManager.isAuthorizedFor("documentTab", "add");
		var docEdit = tf.authManager.isAuthorizedFor("documentTab", "edit");
		var docDelete = tf.authManager.isAuthorizedFor("documentTab", "delete");

		var pAdmin = tf.authManager.authorizationInfo.isAdmin;

		if (!tf.permissions)
		{
			tf.permissions = {
				obFieldTrips: ko.observable(ft),
				obStaff: ko.observable(p1),
				obVehicle: ko.observable(p2),
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
			AreaName: 'State/Province',
			LocalName: 'United States',
			MeasureSystem: 'US',
			UnitsOfMeasure: 'Miles',
			PerHour: 'MPH',
			Abbrev: 'mi',
			Vehicle: 'MPG',
			PostalCodeLength: 5
		};
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "localizations"))
			.then(function(response)
			{
				if (response.Items && response.Items.length > 0)
				{
					// hard code the Postal and AreaName on RW-33366
					tf.localization = {...response.Items[0], Postal: 'Postal Code', AreaName: 'State/Province'};
					tf.localization.PerHour = tf.localization.PerHour.toUpperCase();
					tf.localization.Vehicle = tf.localization.Vehicle.toUpperCase();
				}
			}.bind(this));
	};
	Startup.prototype.getURLParm = function()
	{
		var parm = location.href;
		var parmResult = new Object;
		var start = parm.indexOf("?") != -1 ? parm.indexOf("?") + 1 : parm.length;
		var end = parm.indexOf("#") != -1 ? parm.indexOf("#") : parm.length;
		parm = parm.substring(start, end);
		var parmArray = parm.split("&");
		for (var i = 0; i < parmArray.length; i++)
		{
			parmResult[parmArray[i].split("=")[0]] = parmArray[i].split("=")[1];
		}
		return parmResult;
	};
	Startup.prototype.loadExagoBIServerUrl = function()
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "tfsysinfo"), {
			paramData: { InfoID: 'ExagoBIServerUrl' }
		}, { overlay: false })
			.then(function(response)
			{
				if (response.Items && response.Items.length > 0)
				{
					window.ExagoBIServerUrl = response.Items[0].InfoValue;
				}
			});
	};
	Startup.prototype._initClosePageConfirm = function()
	{
		window.addEventListener("beforeunload", function(event)
		{
			tf.chatfinderHelper && tf.chatfinderHelper.stop();
		});
	};
})();

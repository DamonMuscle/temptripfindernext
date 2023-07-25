(function()
{
	createNamespace("TF.Page").PageManager = PageManager;

	function PageManager()
	{
		var self = this;
		self.obContextMenuVisible = ko.observable(false);
		self.datasourceId = tf.storageManager.get("datasourceId");
		self.currentDatabaseName = ko.observable();
		self.currentDatabaseName.subscribe(function(v)
		{
			if (!v)
			{
				$('title').html('Tripfinder');
			} else
			{
				$('title').html('Tripfinder - ' + v);
			}

		});
		self.obVersion = ko.observable("Version 1.0.9999"); // DO NOT CHANGE THIS NUMBER
		self.isTryGoAway = true;
		self.oldPageType = "";
		self.obPages = ko.observableArray();
		self.obFieldTripEditPage = ko.observable();
		self.onCurrentDatabaseNameChanged = new TF.Events.Event();
		self.changedPageEvent = new TF.Events.Event();
		self.loadDataSourceName();
		self.initContextMenuEvent();
		self.navigationData = null;
		self.applicationSwitcherList = [];
		self.applicationURLMappingList = [];

		self.logOffClick = self.logOffClick.bind(this);

		//Initial parameters
		self.availableApplications = {
			chatfinder: { route: "Chatfinder", title: "Chatfinder", url: "Chatfinder", prefix: "cfweb"},
			tfadmin: { route: "TFAdmin", title: "Administration", url: "TFAdmin", prefix: "tfaweb"},
			routefinderplus: { route: "RoutefinderPlus", title: "Routefinder", url: "RoutefinderPlus", prefix:"rfweb" },
			viewfinder: { route: "Viewfinder", title: "Viewfinder", url: "Viewfinder", prefix: "vfweb"},
			formfinder: { route: "Formfinder", title: "Formfinder", url: "Formfinder", prefix: "formweb"},
			stopfinderadmin: { route: "StopfinderAdmin", title: "Stopfinder Administration", url: "StopfinderAdmin", prefix: "sta"}
		};

		self.initApplicationSwitcher();
	}

	function transformAppName(name)
	{
		switch (name)
		{
			case "tfaweb":
				return 'tfadmin';
			case "rfweb":
				return 'routefinderplus';
			case "ffweb":
				return 'fleetfinder';
			case "tfweb":
				return 'tripfinder';
			case "formweb":
				return 'formfinder';
			case "vfweb":
				return 'viewfinder';
			case "sta":
				return 'stopfinderadmin';
			case "cfweb":
				return 'chatfinder';
			default:
				return null;
		}

	}

	PageManager.prototype.showConfirmation = function(message)
	{
		return tf.promiseBootbox.yesNo({
			message: message,
			title: "Confirmation Message"
		});
	};

	PageManager.prototype.initApplicationSwitcher = function()
	{
		var self = this, supportedProducts = tf.authManager.supportedProducts;

		if (supportedProducts.length > 0)
		{
			supportedProducts = tf.authManager.supportedProducts.filter(function(prod)
			{
				var productName = prod.Name.toLowerCase();
				return self.availableApplications.hasOwnProperty(productName);
			}).map(function(v)
			{
				return v.Name.toLowerCase();
			});

			var accessApps = tf.authManager.authorizationInfo.authorizationTree.applications.map(function(app)
			{
				return transformAppName(app)
			});
			supportedProducts = supportedProducts.filter(function(app)
			{
				return accessApps.includes(app)
			});

			if (!accessApps.includes(TF.productName.toLowerCase()))
			{
				tf.entStorageManager.save("token", "");
				location.reload();
			}

			tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "tfsysinfo"), {
				paramData: {
					ids: "VENDORVALIDATIONSERVER,VENDORACCESSINFOPATH"
				}
			}).then(function(apiResponse)
			{
				var path = apiResponse.Items[0].InfoID === "VENDORACCESSINFOPATH" ? apiResponse.Items[0].InfoValue : apiResponse.Items[1].InfoValue,
					server = apiResponse.Items[0].InfoID === "VENDORVALIDATIONSERVER" ? apiResponse.Items[0].InfoValue : apiResponse.Items[1].InfoValue;
				if (server[server.length - 1] == "/")
				{
					server = server.slice(0, server.length - 1);
				}

				if (path[0] == "/")
				{
					path = path.slice(1, path.length)
				}

				var myTransfinderURL = server + "/" + path;

				Promise.resolve($.ajax({
					url: myTransfinderURL,
					data: {
						vendorid: "Transfinder",
						clientid: tf.authManager.clientKey
					},
					dataType: 'json'
				}))
					.then(function(res)
					{
						hasURLProducts = res ? res.Products.filter(function(prod)
						{
							return !!prod.Uri && supportedProducts.indexOf(prod.Name.toLowerCase()) != -1;
						}) : [];

						if (hasURLProducts.length > 0)
						{
							self.applicationURLMappingList = hasURLProducts;
							self.applicationSwitcherList = hasURLProducts.map(function(item)
							{
								return item.Name.toLowerCase();
							});
							self.applicationSwitcherList = self.applicationSwitcherList.sort(function(a, b)
							{
								return self.availableApplications[a].title.localeCompare(self.availableApplications[b].title);
							});
						}
					})
					.then(function()
					{
						registerChatfinderHub();
					})

			});
		}
	}

	function registerChatfinderHub()
	{
		const chatfinderSite = tf.authManager.supportedProducts.find(p => p.Name && p.Name.toLowerCase() == "chatfinder");
		const chatfinderApi = tf.authManager.supportedProducts.find(p => p.Name && p.Name.toLowerCase() == "chatfinderapi");
		if (tf.authManager.authorizationInfo.authorizationTree.applications.indexOf("cfweb") >= 0
			&& chatfinderSite && chatfinderApi)
		{
			// remove trailing slashes to avoid duplicated serviceworker scope registration
			const chatfinderAddress = chatfinderSite.Uri.replace(/\/+$/, "").toLowerCase();
			const chatfinderAPIAddress = chatfinderApi.Uri;
			const verifyData = {
				paramData: {
					"clientId": tf.entStorageManager.get("clientKey"),
					"vendor": "Transfinder",
					"username": tf.authManager.userName || tf.authManager.authorizationInfo.authorizationTree.username,
				},
				headers: {
					'Transfinder': tf.api.server()
				}
			};

			tf.chatfinderHelper = new TF.ChatfinderHelper(tf.promiseAjax.get(pathCombine(chatfinderAPIAddress, "auth", "verify"), verifyData), "tfweb", TF.productName);
			tf.chatfinderHelper.entUserId = tf.authManager.authorizationInfo.authorizationTree.userId;
			tf.chatfinderHelper.registerHub(chatfinderAPIAddress, chatfinderAddress);
		}
		else
		{
			console.log('Chatfinder is not supported.');
		}
	}

	PageManager.prototype.initNavgationBar = function()
	{
		var self = this,
			$content, $navigationContent = $(".navigation-container");
		self.navigationData = new TF.NavigationMenu();
		return self.getMessageSettings().then(function(result)
		{
			if (!result.Items || !result.Items.length || result.Items.length <= 0 || (!result.Items[0].EnglishMessage && !result.Items[0].SpanishMessage))
			{
				self.navigationData.obShowMessageCenter(false);
			}
			else
			{
				self.navigationData.obShowMessageCenter(true);
			}
			$content = $("<!-- ko template:{ name:'workspace/navigation/menu',data:$data }--><!-- /ko -->");
			$navigationContent.append($content);

			ko.applyBindings(ko.observable(self.navigationData), $content[0]);
		});
	};

	PageManager.prototype.initResizePanel = function()
	{
		var self = this,
			$content, $pageContent = $("#pageContent");
		self.resizablePage = new TF.Page.ResizablePage();
		$content = $("<!-- ko template:{ name:'workspace/page/resizablepage',data:$data }--><!-- /ko -->");
		$pageContent.append($content);

		ko.applyBindings(ko.observable(self.resizablePage), $content[0]);
	};

	PageManager.prototype.isDateBeforeToday = function(target)
	{
		var targetDate = new Date(target);
		targetDate.setHours(0, 0, 0, 0);

		var todayDate = new Date();
		todayDate.setHours(0, 0, 0, 0);

		if (todayDate > targetDate)
			return true;

		return false;
	};

	PageManager.prototype.getMessageSettings = function()
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "tripfindermessages"));
	};

	PageManager.prototype.showMessageModal = function(isInitPage)
	{
		var self = this;
		return self.getMessageSettings().then(function(result)
		{
			if (result.Items && result.Items.length > 0)
			{
				if (!!result.Items[0].EnglishMessage || !!result.Items[0].SpanishMessage)
				{
					var shouldShowModal = true;
					if (isInitPage)
					{
						if (result.Items[0].DisplayOnceDaily)
						{
							var lastTime = tf.storageManager.get("lastTimeShowMessageDate");
							if (lastTime && !self.isDateBeforeToday(lastTime))
							{
								shouldShowModal = false;
							}
						}
						tf.storageManager.save("lastTimeShowMessageDate", new Date());
					}

					if (shouldShowModal)
					{
						tf.modalManager.showModal(new TF.Modal.MessageModalViewModel(result.Items[0]));
					}

					return true;
				}
			}

			return false;
		});
	};

	function getTitleByName(pageName)
	{
		var pageTitle = "", pageType = pageName.toLowerCase();
		switch (pageType)
		{
			case "approvals":
				pageTitle = "My Pending Approvals";
				break;
			case "approvalsScheduler":
				pageTitle = "My Pending Approvals Calendar";
				break;
			case "contacts":
				pageTitle = "Contacts"
				break;
			case "staff":
				pageTitle = "Staff";
				break;
			case "fieldtrips":
				pageTitle = "Field Trips";
				break;
			case "vehicles":
				pageTitle = "Vehicles"
				break;
			case "fieldtripScheduler":
				pageTitle = "Field Trips Calendar";
				break;
			case "myrequests":
				pageTitle = "My Submitted Requests";
				break;
			case "myrequestsScheduler":
				pageTitle = "My Submitted Requests Calendar";
				break;
			case "reports":
				pageTitle = "Reports";
				break;
			case "settingsConfig":
				ageTitle = "Settings";
				break;
			default:
				break;
		}
		return pageTitle;
	}

	PageManager.prototype.openNewPage = function(type, gridOptions, firstLoad, skipSavePage)
	{
		var self = this;
		if (self.isTryGoAway && self.obPages() && self.obPages().length > 0 && self.obPages()[0] && self.obPages()[0].data && self.obPages()[0].data.tryGoAway)
		{
			self.obPages()[0].data.tryGoAway(getTitleByName(type)).then(function(result)
			{
				if (result)
				{
					self._openNewPage(type, gridOptions, firstLoad, skipSavePage);
				}
			});
		}
		else if (self.obFieldTripEditPage() && self.obFieldTripEditPage().obEntityDataModel() && self.obFieldTripEditPage().tryGoAway)
		{
			self.obFieldTripEditPage().tryGoAway(getTitleByName(type)).then(function(result)
			{
				if (result)
				{
					tf.pageManager.obFieldTripEditPage(null);
					self._openNewPage(type, gridOptions, firstLoad, skipSavePage);
				}
			});
		}
		else if (self.obPages() && self.obPages().length > 0 && self.obPages()[0] && self.obPages()[0].data && self.obPages()[0].data.detailView && self.obPages()[0].data.detailView.obEditing())
		{
			const gridType = self.obPages()[0].data.type,
				gridName = tf.dataTypeHelper.getFormalDataTypeName(gridType),
				gridLabel = tf.applicationTerm.getApplicationTermSingularByName(gridName);
			self.showConfirmation("Do you want to close " + gridLabel + " detail view without saving?")
				.then(function(result)
				{
					if (result)
					{
						self._openNewPage(type, gridOptions, firstLoad, skipSavePage);
					}
					return;
				});
		}
		else
		{
			self._openNewPage(type, gridOptions, firstLoad, skipSavePage);
		}
		self.isTryGoAway = self;
	};

	PageManager.prototype._openNewPage = function(type, gridOptions, firstLoad, skipSavePage)
	{
		var self = this,
			pageData, templateName,
			storageKey = TF.productName.toLowerCase() + ".page";

		self.resizablePage.clearContent();
		gridOptions = gridOptions || {};

		if (self.obPages()[0] && self.obPages()[0].data && self.obPages()[0].data.dispose)
		{
			self.obPages()[0].data.dispose();
			self.obPages()[0].data = null;
		}

		const routeState = Math.random().toString(36).substring(7);

		if (self.checkPermission(type) === false)
		{
			// No permission for Vehicle data, show Field Trip grid by default.
			type = "fieldtrip";
		}

		switch (type)
		{
			case "approvals":
				pageData = new TF.Page.ApprovalsPage(gridOptions);
				templateName = "workspace/page/basegridpage";
				break;
			case "contact":
			case "contacts":
				pageData = new TF.Page.ContactPage(gridOptions);
				templateName = "workspace/page/basegridpage";
				break;
			case "fieldtrip":
			case "fieldtrips":
				pageData = new TF.Page.FieldTripPage(gridOptions);
				templateName = "workspace/page/basegridpage";
				break;
			case "staff":
				pageData = new TF.Page.StaffPage(gridOptions);
				templateName = "workspace/page/basegridpage";
				break;
			case "vehicles":
				pageData = new TF.Page.VehiclePage(gridOptions);
				templateName = "workspace/page/basegridpage";
				break;
			case "myrequests":
				pageData = new TF.Page.MyRequestPage();
				templateName = "workspace/page/basegridpage";
				break;
			case "reports":
				pageData = new TF.Page.ReportsPage();
				templateName = "workspace/page/basegridpage";
				break;
			case "settingsConfig":
				pageData = new TF.Page.SettingsConfigurationPage();
				templateName = "workspace/admin/settings_configuration";
				break;
			case "approvalsScheduler":
				pageData = new TF.Page.ApprovalsSchedulerPage();
				templateName = "workspace/page/schedulerpage";
				break;
			case "fieldtripsScheduler":
				var gridType = type.replace("Scheduler", "");
				pageData = new TF.Page.SchedulerPage(gridType);
				templateName = "workspace/page/schedulerpage";
				break;
			case "myrequestsScheduler":
				var gridType = type.replace("Scheduler", "");
				pageData = new TF.Page.MyRequestSchedulerPage(gridType);
				templateName = "workspace/page/schedulerpage";
				break;
			case "mapcanvas":
				pageData = new TF.Page.MapCanvasPage(null, routeState);
				templateName = "workspace/page/RoutingMap/mapcanvaspage";
				break;
			case "fieldtriplocations":
				pageData = new TF.Page.LocationPage(gridOptions);
				templateName = "workspace/page/basegridpage";
				break;
			case "userdefinedfields":
				pageData = new TF.Page.UserDefinedFieldsPage();
				templateName = "workspace/page/userdefinedfield/panel";
				break;
			// case "datalist":
			// 	pageData = {};
			// 	templateName = "workspace/page/datalist";
			// 	break;
			// if type is not matched use fieldtrip page as default
			default:
				pageData = new TF.Page.FieldTripPage(gridOptions);
				templateName = "workspace/page/basegridpage";
				break;
		}

		self.resizablePage.leftPageType = type;

		if (self.oldPageType != type)
		{
			self.changedPageEvent.notify(type);
		}

		self.oldPageType = type;

		self.resizablePage.setLeftPage(templateName, pageData, true, firstLoad);

		if (self.navigationData)
		{
			setTimeout(function()
			{
				self.navigationData.setActiveStateByPageType(type);
			}, 100);
		}
		if (!skipSavePage)
		{
			if (type != "settingsConfig")
			{
				tf.storageManager.save(storageKey, type);
			}
		}

		if (TF.isPhoneDevice)
		{
			$(".page-container").css("width", "100%");
		}

		self.obPages([
			{
				contentTemplate: templateName,
				data: pageData
			}]);
	};

	PageManager.prototype.checkPermission = function(type)
	{
		let permission = true;
		switch (type)
		{
			case "contact":
			case "contacts":
				permission = tf.permissions.obContact();
				break;
			case "vehicle":
			case "vehicles":
				permission = tf.permissions.obVehicle();
				break;
			default:
				break;
		}
		return permission;
	}

	PageManager.prototype.loadDataSourceName = function()
	{
		if (this.datasourceId)
		{
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "databases", this.datasourceId))
				.then(function(apiResponse)
				{
					this.currentDatabaseName(apiResponse.Items[0].Name);
					this.onCurrentDatabaseNameChanged.notify();
				}.bind(this));
		}
		else
		{
			this.currentDatabaseName("");
			this.onCurrentDatabaseNameChanged.notify();
		}

		return Promise.resolve();
	};

	PageManager.prototype.logOffClick = function()
	{
		var self = this;
		tf.promiseBootbox.confirm({
			buttons: TF.isPhoneDevice ? {
				OK: {
					label: "Log Out",
					className: "btn-yes-mobile"
				},
				Cancel: {
					label: "Cancel",
					className: "btn-no-mobile"
				}
			} : {
				OK: {
					label: "Log Out",
					className: "btn-primary btn-sm btn-primary-black"
				},
				Cancel: {
					label: "Cancel",
					className: "btn-default btn-sm btn-default-link"
				}
			},
			title: "Log Out",
			message: "Are you sure you want to log out?"
		}).then(function(result)
		{
			if (result)
			{
				self.logout(true);
			}
		})
	};

	PageManager.prototype.logout = function(flag)
	{
		tf.authManager.logOff().then(function()
		{
			const rememberMe = tf.storageManager.get("rememberMe", true) || false;
			if (!rememberMe)
			{
				if (flag)
				{
					tf.entStorageManager.save("clientKey", "");
					tf.entStorageManager.save("userName", "");
					tf.entStorageManager.save("password", "");
				}
				tf.storageManager.save("clientKey", "", true);
				tf.storageManager.save("userName", "", true);
				tf.storageManager.save("password", "", true);
			}

			location.reload();
		});
	};

	PageManager.prototype.showContextMenu = function(model, event)
	{
		setTimeout((function()
		{
			this.obContextMenuVisible(true);
		}).bind(this), 0);
	};

	PageManager.prototype.initContextMenuEvent = function()
	{
		var clickHideContextMenu = (function(evt)
		{
			var $target = $(evt.target);
			if ((($target.closest(".tf-contextmenu-wrap").length === 0 && !$target.hasClass("tf-contextmenu-wrap")) ||
				$target.hasClass("contextmenu-overlay")) && (!$target.hasClass("mobile") || $target.hasClass("addremovecolumn")))
			{
				tf.contextMenuManager.dispose();
				this.obContextMenuVisible(false);
			}
		}).bind(this);

		// when the context menu is open, listen for clicks outside of
		// the menu. When the click occurs, remove the listener and
		// close the context menu.
		this.obContextMenuVisible.subscribe(function(newValue)
		{
			var event = TF.isMobileDevice ? "touchstart" : "click";
			if (newValue)
			{
				$(window).off(event + '.contextmenu');
				//use timeout to prevent close contextmenu on ipad , after open on touchstart this close event will occur immeditatly
				setTimeout(function()
				{
					$(window).on(event + '.contextmenu', clickHideContextMenu);
				}, 100);
			}
			else
			{
				$(window).off(event + '.contextmenu', clickHideContextMenu);
			}
		});
	};

	/**
	 * Get the page title by name.
	 * @param {String} pageName
	 * @return {String} 
	 */
	PageManager.prototype.getPageTitleByPageName = function(pageName)
	{
		var self = this;
		switch (pageName)
		{
			case "fieldtrip":
				return tf.applicationTerm.getApplicationTermPluralByName("Field Trip");
			default:
				return null;
		}
	};

	PageManager.prototype.getSettingsMenuList = function()
	{
		const list = [],
			configurationSection = _.sortBy([
				{ text: "Automation", pageType: "automation" },
				{ text: "Field Trip Configurations", pageType: 'fieldtripconfigs' },
				{ text: "Required Fields", pageType: "requiredfield" },
				{ text: "System Configurations", pageType: "settingsConfig" },
				{ text: "User Defined Fields", pageType: "userdefinedfields" },
				{ text: "Change Password", pageType: "changePassword" }
			], "text");
		
		if (tf.authManager.hasWayNav())
		{
			configurationSection.push({ text: "Wayfinder", pageType: "wayfinderdetailview" });
		}

		list.push({
			text: "Configuration",
			items: tf.authManager.authorizationInfo.isAdmin ? configurationSection : [{ text: "Change Password", pageType: "changePassword" }],
		});

		if (tf.authManager.authorizationInfo.isAdmin)
		{
			list.push({
				text: "Data List",
				pageType: 'datalist'
			});

			list.push({
				text: "Tools",
				items: _.sortBy([
					{ text: "Auto Assign Vehicles", pageType: "autoassignvehicles", hidden: !tf.authManager.hasGPS() || !tf.authManager.GPSConnectValid },
					{ text: "Current User Sessions", pageType: "session", hidden: !tf.authManager.authorizationInfo.isAdmin },
					{ text: "Import Data", pageType: "importdata" },
					{ text: "Import Pictures", pageType: "recordpictures" },
					{ text: "Recapture GPS Data", pageType: "recapturegpsdata", hidden: ko.pureComputed(() => !(tf.authManager.hasGPS() && tf.authManager.authorizationInfo.isAdmin)) },
				], 'text'),
			});
		}

		list.forEach(category => {
			category.items?.forEach(item => item.isOpen = item.pageType === tf.storageManager.get(`${TF.productName.toLowerCase()}.page`));
		});

		return _.sortBy(list, 'text');
	};

	PageManager.prototype.addMenuPage = function(pageType, menu, name, displayText, permission, hasApplicationTerm)
	{
		var self = this, isOpen = pageType === tf.storageManager.get(TF.productName.toLowerCase() + ".page");
		if (permission)
		{
			var page = {
				"isOpen": isOpen,
				"pageType": pageType,
				"text": hasApplicationTerm ? tf.applicationTerm.getApplicationTermPluralByName(name) : name
			};
			menu.push(page);
		}
		else
		{
			if (isOpen)
			{
				self.handlePermissionDenied(displayText);
			}
		}
	};

	PageManager.prototype.handlePermissionDenied = function(pageName)
	{
		pageName = this.getPageTitleByPageName(pageName);
		var self = this, desc = "You do not have permissions to view" + (pageName ? " " + pageName : ".");
		if (!tf.permissions.hasAuthorized)
		{
			desc += " You are not authorized for any page.";
			return tf.promiseBootbox.alert(desc, "Invalid Permissions")
				.then(function()
				{
					self.logout(false);
				}.bind(this));
		}
		desc += " You will be redirected to your default login screen.";
		return tf.promiseBootbox.alert(desc, "Invalid Permissions")
			.then(function()
			{
				self.openNewPage("fieldtrips");
				tf.promiseBootbox.hideAllBox();
			}.bind(this));
	};

	/**
	* Get all data types that current user has permission to access.
	* @return {Array}
	*/
	PageManager.prototype.getAvailableDataTypes = function()
	{
		var allDataTypes = [
			{ name: "contact", label: "Contacts", permission: tf.permissions.obContact() },
			{ name: "fieldtrip", label: "Field Trips", permission: tf.permissions.obFieldTrips() },
			{ name: "vehicle", label: "Vehicles", permission: tf.permissions.obVehicle() }
		];
		return allDataTypes.filter(function(item) { return item.permission; });
	};

	/**
	 * Gets the application term by grid type.
	 * @param {String} gridType
	 * @returns {String} The application term related to grid type.
	 */
	PageManager.prototype.typeToTerm = function(gridType)
	{
		switch (gridType)
		{
			case "student":
				return "Student";
			case "school":
				return "School";
			case "contact":
				return "Contact";
			case "district":
				return "District";
			case "contractor":
				return "Contractor";
			case "document":
				return "Document";
			case "vehicle":
				return "Vehicle";
			case "staff":
				return "Staff";
			case "altsite":
				return "Alternate Site";
			case "trip":
				return "Trip";
			case "route":
				return "Route";
			case "tripstop":
				return "Trip Stop";
			case "fieldtrip":
				return "Field Trip";
			case "gpsevent":
				return "GPS Event"
			case "georegion":
				return "Geo Region";
			case "form":
				return "Form Result";
			case "forms":
				return "Forms";
			case "mergeDocumentsSent":
				return "Sent Merge";
			case "scheduledReportsSent":
				return "Sent Reports";
			case "busfinderhistorical":
				return 'Busfinder Historical';
			case "report":
				return "Report";
			case "fieldtripinvoice":
				return "Field Trip Invoice";
			case "fieldtriplocation":
				return "Field Trip Location";
		}
		return "";
	}
})();
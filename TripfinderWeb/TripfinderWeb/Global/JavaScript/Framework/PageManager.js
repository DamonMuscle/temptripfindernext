(function()
{
	createNamespace("TF.Page").PageManager = PageManager;

	function PageManager()
	{
		var self = this;
		self.obContextMenuVisible = ko.observable(false);
		self.datasourceId = tf.storageManager.get("datasourceId");
		self.currentDatabaseName = ko.observable();
		self.obVersion = ko.observable("Version 1.0.9999"); // DO NOT CHANGE THIS NUMBER
		self.onCurrentDatabaseNameChanged = new TF.Events.Event();
		self.loadDataSourceName();
		self.initContextMenuEvent();
		self.navigationData = null;

		//Pages menu
		self.obAdministrationPagesMenu = ko.computed(self.administrationPagesMenuComputer.bind(self));
		self.logOffClick = self.logOffClick.bind(this);
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
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "tripfindermessage"));
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
					console.log(lastTime);
					console.log(new Date());
					console.log(shouldShowModal);
					if (shouldShowModal)
					{
						tf.modalManager.showModal(
							new TF.Modal.MessageModalViewModel(result.Items[0])
						);
					}
					return true;
				}
			}

			return false;
		});
	};

	PageManager.prototype.openNewPage = function(type, gridOptions, firstLoad, skipSavePage)
	{
		var self = this,
			pageData, templateName,
			storageKey = TF.productName.toLowerCase() + ".page";

		self.resizablePage.clearContent();
		gridOptions = gridOptions || {};
		switch (type)
		{
			case "approvals":
				pageData = new TF.Page.ApprovalsPage(gridOptions);
				templateName = "workspace/page/basegridpage";
				break;
			case "fieldtrips":
				pageData = new TF.Page.FieldTripPage(gridOptions);
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
		}

		self.resizablePage.leftPageType = type;
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
			tf.storageManager.save(storageKey, type);
		}

		if (TF.isPhoneDevice)
		{
			$(".page-container").css("width", "100%");
		}
	};

	PageManager.prototype.loadDataSourceName = function()
	{
		if (this.datasourceId)
		{
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), this.datasourceId))
				.then(function(apiResponse)
				{
					this.currentDatabaseName(apiResponse.Items[0].DatabaseName);
					this.onCurrentDatabaseNameChanged.notify();
				}.bind(this));
		}
		else
		{
			this.currentDatabaseName("");
			this.onCurrentDatabaseNameChanged.notify();
		}
	};

	PageManager.prototype.logOffClick = function()
	{
		var self = this;
		tf.promiseBootbox.confirm({
			buttons: TF.isPhoneDevice ? {
				OK: {
					label: "Logout",
					className: "btn-yes-mobile"
				},
				Cancel: {
					label: "Cancel",
					className: "btn-no-mobile"
				}
			} : {
					OK: {
						label: "Logout",
						className: "btn-primary btn-sm btn-primary-black"
					},
					Cancel: {
						label: "Cancel",
						className: "btn-default btn-sm btn-default-link"
					}
				},
			title: "Logout",
			message: "Are you sure you want to logout?"
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
		tf.authManager.logOff();
		location.reload();
		var rememberMe = tf.storageManager.get("rememberMe", true) || false;
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

	/**
	 * Gets page menu for administration.
	 * @returns {array} The array of administration
	 */
	PageManager.prototype.administrationPagesMenuComputer = function()
	{
		var self = this, maxWidth = 239, width,
			dataSourceText = "Data Source: " + self.currentDatabaseName(),
			menu = [], $tempDiv = $("<div>"),
			css = {
				fontFamily: "SourceSansPro-Regular",
				fontSize: "14px",
				display: "inline"
			};
		$("body").append($tempDiv);
		$tempDiv.text(dataSourceText);
		$tempDiv.css(css);
		width = $tempDiv.outerWidth();
		$tempDiv.remove();

		self.addMenuPage("settingsConfig", menu, "Settings & Configuration", "Settings & Configuration", tf.permissions.obIsAdmin(), false);
		self.addMenuPage("dataSource", menu, width > maxWidth ? "Data Source" : dataSourceText, "Data Source", !tf.permissions.isSupport, false);
		self.addMenuPage("changePassword", menu, "Change Password", "Change Password", true, false);
		return menu;
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
			{ name: "fieldtrip", label: "Field Trips", permission: tf.permissions.obFieldTrips() }
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
			case "district":
				return "District";
			case "contractor":
				return "Contractor";
			case "vehicle":
				return "Vehicle";
			case "staff":
				return "Staff";
			case "altsite":
				return "Alternate Site";
			case "trip":
				return "Trip";
			case "tripstop":
				return "Trip Stop";
			case "fieldtrip":
				return "Field Trip";
			case "georegion":
				return "Geo Region";
			case "busfinderhistorical":
				return 'Busfinder Historical';
		}
		return "";
	}
})();
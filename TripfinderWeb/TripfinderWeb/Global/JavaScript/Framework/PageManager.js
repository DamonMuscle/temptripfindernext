(function()
{
	createNamespace("TF.Page").PageManager = PageManager;

	function PageManager()
	{
		var self = this;
		self.obContextMenuVisible = ko.observable(false);
		self.datasourceId = tf.storageManager.get("datasourceId");
		self.currentDatabaseName = ko.observable();
		self.onCurrentDatabaseNameChanged = new TF.Events.Event();
		self.initContextMenuEvent();
		self.navigationData = null;

		self.logOffClick = self.logOffClick.bind(this);
	}

	PageManager.prototype.initNavgationBar = function()
	{
		var self = this,
			$content, $navigationContent = $(".navigation-container");
		self.navigationData = new TF.NavigationMenu();
		$content = $("<!-- ko template:{ name:'workspace/navigation/menu',data:$data }--><!-- /ko -->");
		$navigationContent.append($content);

		ko.applyBindings(ko.observable(self.navigationData), $content[0]);
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

	PageManager.prototype.openNewPage = function(type, gridOptions, firstLoad)
	{
		var self = this, permission,
			pageData, templateName,
			$content, $leftPage = $("#pageContent .left-page"),
			storageKey = TF.productName + ".page";

		self.resizablePage.clearContent();
		switch (type)
		{
			case "fieldtrips":
				pageData = new TF.Page.FieldTripPage(gridOptions);
				templateName = "workspace/page/basegridpage";
				break;
			case "myrequests":
				pageData = new TF.Page.MyRequestPage();
				templateName = "workspace/page/basegridpage";
				break;
			case "settings":
				pageData = new TF.Page.SettingsConfigurationPage();
				templateName = "workspace/admin/settings_configuration";
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
		tf.storageManager.save(storageKey, type);

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
				self.logout();
			}
		})
	};

	PageManager.prototype.logout = function()
	{
		tf.authManager.logOff();
		location.reload();
		var rememberMe = tf.storageManager.get("rememberMe", true) || false;
		if (!rememberMe)
		{
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
				return "Field Trips";
			default:
				return null;
		}
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
})();
(function()
{
	createNamespace("TF.Page").PageManager = PageManager;

	function PageManager()
	{
		var self = this;
		self.obPages = ko.observableArray();
		self.obContextMenuVisible = ko.observable(false);
		self.datasourceId = tf.storageManager.get("datasourceId");
		self.currentDatabaseName = ko.observable();
		self.onCurrentDatabaseNameChanged = new TF.Events.Event();
		self.initContextMenuEvent();
	}

	PageManager.prototype.initNavgationBar = function()
	{
		var self = this, navigationData,
			$content, $navigationContent = $(".navigation-container");
		navigationData = new TF.NavigationMenu();
		$content = $("<!-- ko template:{ name:'workspace/navigation/menu',data:$data }--><!-- /ko -->");
		$navigationContent.append($content);

		ko.applyBindings(ko.observable(navigationData), $content[0]);
	};

	PageManager.prototype.openNewPage = function(type)
	{
		var self = this, permission,
			pageData, templateType,
			$content, $pageContent = $("#pageContent");

		self.removeCurrentPage();
		switch (type)
		{
			case "fieldtrip":
				pageData = new TF.Page.FieldTripPage();
				templateType = "basegridpage";
				break;
		}
		$content = $("<div class='main-body'><!-- ko template:{ name:'workspace/page/" + templateType + "',data:$data }--><!-- /ko --></div>");
		$pageContent.append($content);

		if (pageData)
		{
			ko.applyBindings(ko.observable(pageData), $content[0]);
		}
		self.obPages([{
			contentTemplate: 'workspace/page/' + templateType,
			data: pageData
		}]);
	};

	PageManager.prototype.removeCurrentPage = function()
	{
		var $pageContent = $("#pageContent"), $page = $pageContent.find(".page-container"),
			pageData;

		if ($pageContent.length === 0 || $page.length === 0)
		{
			$pageContent.empty();
			return;
		}

		pageData = ko.dataFor($page[0]);
		if (pageData && pageData.dispose)
		{
			pageData.dispose();
		}
		$pageContent.empty();
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
			//this.changeDataSourceClick();
		}
	};

	PageManager.prototype.logOff = function()
	{
		var self = this;
		tf.storageManager.save("token", "", true);
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
})();
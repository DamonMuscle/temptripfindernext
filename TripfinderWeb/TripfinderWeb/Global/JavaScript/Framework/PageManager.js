(function()
{
	createNamespace("TF.Page").PageManager = PageManager;

	function PageManager() { }

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
	}
})();
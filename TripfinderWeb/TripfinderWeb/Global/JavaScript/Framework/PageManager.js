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
		self.removeCurrentPage();
		tf.modalManager.showModal(new TF.Modal.TripfinderLoginModel());
	}
})();
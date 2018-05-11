(function() {
	createNamespace("TF.Page").PageManager = PageManager;

	function PageManager() {}

	PageManager.prototype.openNewPage = function(type) {
		var self = this,
			pageData, templateType,
			$content, $pageContent = $("#pageContent");

		$pageContent.empty();
		switch (type) {
			case "fieldtrip":
				pageData = new TF.Page.FieldTripPage();
				templateType = "fieldtrip";
				break;
		}
		$content = $("<div class='main-body'><!-- ko template:{ name:'workspace/page/" + templateType + "',data:$data }--><!-- /ko --></div>");
		$pageContent.append($content);

		if (pageData) {
			ko.applyBindings(ko.observable(pageData), $content[0]);
		}
	};

})();
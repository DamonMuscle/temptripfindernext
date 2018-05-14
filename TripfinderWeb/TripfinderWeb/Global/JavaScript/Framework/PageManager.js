(function()
{
	createNamespace("TF.Page").PageManager = PageManager;

	function PageManager() { }

	PageManager.prototype.openNewPage = function(type)
	{
		var self = this,
			pageData, templateType,
			$content, $pageContent = $("#pageContent");

		$pageContent.empty();
		var permission = tf.authManager.isAuthorizedFor(type, "read");
		switch (type)
		{
			case "fieldtrip":
				if (permission)
				{
					pageData = new TF.Page.FieldTripPage();
					templateType = "fieldtrip";
				} else
				{
					return tf.promiseBootbox.alert("You have no Trip Field view permission!")
						.then(function()
						{
							tf.modalManager.showModal(new TF.Modal.TripfinderLoginModel());
						});
				}
				break;
		}
		$content = $("<div class='main-body'><!-- ko template:{ name:'workspace/page/" + templateType + "',data:$data }--><!-- /ko --></div>");
		$pageContent.append($content);

		if (pageData)
		{
			ko.applyBindings(ko.observable(pageData), $content[0]);
		}
	};

})();
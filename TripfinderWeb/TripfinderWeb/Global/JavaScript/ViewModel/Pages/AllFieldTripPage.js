(function()
{
	createNamespace("TF.Page").AllFieldTripPage = AllFieldTripPage;

	function AllFieldTripPage()
	{
		TF.Page.FieldTripPage.apply(this, arguments);
		this.declineButton = false;
		this.approveButton = false;
	}

	AllFieldTripPage.prototype = Object.create(TF.Page.FieldTripPage.prototype);
	AllFieldTripPage.prototype.constructor = AllFieldTripPage;

	AllFieldTripPage.prototype.updateOptions = function()
	{
		TF.Page.FieldTripPage.prototype.updateOptions.apply(this, arguments);
		this.options.url = pathCombine(tf.api.apiPrefix(), "search", "fieldtrip");
	};
})();
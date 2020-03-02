(function()
{
	createNamespace("TF.Page").ApprovalsPage = ApprovalsPage;

	function ApprovalsPage()
	{
		TF.Page.FieldTripPage.apply(this, arguments);
		this.pageType = "approvals";
	}

	ApprovalsPage.prototype = Object.create(TF.Page.FieldTripPage.prototype);
	ApprovalsPage.prototype.constructor = ApprovalsPage;

	ApprovalsPage.prototype.updateOptions = function()
	{
		TF.Page.MyRequestPage.prototype.updateOptions.call(this);
		this.options.url = pathCombine(tf.api.apiPrefix(), "search",  tf.DataTypeHelper.getEndpoint("fieldtrip"));
		this.options.paramData = { "filterType": "permission" };
	};
})();
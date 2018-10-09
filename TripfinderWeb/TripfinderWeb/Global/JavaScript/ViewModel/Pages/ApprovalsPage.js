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
})();
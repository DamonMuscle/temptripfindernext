(function()
{
	createNamespace("TF.Page").ApprovalsSchedulerPage = ApprovalsSchedulerPage;

	function ApprovalsSchedulerPage()
	{
		TF.Page.SchedulerPage.call(this, "approvals");
		this.pageType = "approvals";
	}

	ApprovalsSchedulerPage.prototype = Object.create(TF.Page.SchedulerPage.prototype);

	ApprovalsSchedulerPage.prototype.constructor = ApprovalsSchedulerPage;

	ApprovalsSchedulerPage.prototype.getRequestUrl = function()
	{
		return pathCombine(tf.api.apiPrefix(), "search",  tf.DataTypeHelper.getEndpoint("fieldtrip") + "?filterType=permission");
	};
})();
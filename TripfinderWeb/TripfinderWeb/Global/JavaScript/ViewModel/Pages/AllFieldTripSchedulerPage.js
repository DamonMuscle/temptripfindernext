(function()
{
	createNamespace("TF.Page").AllFieldTripSchedulerPage = AllFieldTripSchedulerPage;

	function AllFieldTripSchedulerPage()
	{
		TF.Page.SchedulerPage.apply(this, arguments);
		this.declineButton = false;
		this.approveButton = false;
	}

	AllFieldTripSchedulerPage.prototype = Object.create(TF.Page.SchedulerPage.prototype);

	AllFieldTripSchedulerPage.prototype.constructor = AllFieldTripSchedulerPage;

	AllFieldTripSchedulerPage.prototype.getRequestUrl = function()
	{
		return pathCombine(tf.api.apiPrefix(), "search", "fieldtrip");
	}
})();
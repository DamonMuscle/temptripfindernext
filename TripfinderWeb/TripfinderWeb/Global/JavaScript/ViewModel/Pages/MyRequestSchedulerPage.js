(function()
{
	createNamespace("TF.Page").MyRequestSchedulerPage = MyRequestSchedulerPage;

	function MyRequestSchedulerPage(gridType)
	{
		var self = this;
		self.type = "fieldtrip";
		self.pageType = "myrequests";
		TF.Page.SchedulerPage.apply(self, arguments);
		self.cancelButton = true;
		self.detailButton = true;
		self.schedulerButton = true;
		self.changeStatusButton = false;
		self.copyButton = true;
	}

	MyRequestSchedulerPage.prototype.constructor = MyRequestSchedulerPage;

	MyRequestSchedulerPage.prototype = Object.create(TF.Page.SchedulerPage.prototype);

	MyRequestSchedulerPage.prototype.getRequestUrl = function(type)
	{
		return pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint("fieldtrip") + "?filterType=submitted");
	}
})();
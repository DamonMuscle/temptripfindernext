(function()
{
	createNamespace("TF.Page").MyRequestSchedulerPage = MyRequestSchedulerPage;

	function MyRequestSchedulerPage(gridType)
	{
		var self = this;
		TF.Page.SchedulerPage.apply(self, arguments);
		self.type = "fieldtrip";
		self.pageType = "myrequests";
		self.cancelButton = true;
		self.detailButton = true;
		self.schedulerButton = true;
		self.changeStatusButton = false;
	}

	MyRequestSchedulerPage.prototype.constructor = MyRequestSchedulerPage;

	MyRequestSchedulerPage.prototype = Object.create(TF.Page.SchedulerPage.prototype);

	MyRequestSchedulerPage.prototype.getRequestUrl = function(type)
	{
		return pathCombine(tf.api.apiPrefix(), "search", "fieldtrip", "submitted");
	}
})();
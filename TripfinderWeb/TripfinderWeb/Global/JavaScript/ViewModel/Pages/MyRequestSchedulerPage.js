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
		self.approveButton = false;
		self.declineButton = false;
	}

	MyRequestSchedulerPage.prototype.constructor = MyRequestSchedulerPage;

	MyRequestSchedulerPage.prototype = Object.create(TF.Page.SchedulerPage.prototype);
})();
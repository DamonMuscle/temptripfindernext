(function()
{
	createNamespace("TF.Page").MySchedulerPage = MySchedulerPage;

	function MySchedulerPage()
	{
		var self = this;
		self.detailView = null;
		self.type = "scheduler";
		self.pageType = "scheduler";
		self.calendarDataViewModel = new TF.Scheduler.FieldTripSchedulerViewModel();
		self.isDetailPanelShown = ko.observable(false);
	}

	MySchedulerPage.prototype.constructor = MySchedulerPage;

	MySchedulerPage.prototype.schedulerViewClick = function(viewModel, e)
	{
		var self = this;
		self.isDetailPanelShown(false);
		tf.pageManager.openNewPage("scheduler");
		//tf.pageManager.resizablePage.closeRightPage();
	};

	MySchedulerPage.prototype.navToGridViewClick = function(model, element)
	{
		tf.pageManager.openNewPage("fieldtrips");
	};

	MySchedulerPage.prototype.dispose = function()
	{
		//TODO
	};
})();

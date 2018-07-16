(function()
{
	createNamespace("TF.Page").BasePage = BasePage;

	function BasePage()
	{
		var self = this;
		self.obShowDetailPanel = ko.observable(false);
		self.obShowFieldTripDEPanel = ko.observable(false);
		self.detailView = null;
		self.fieldTripDataEntry = null;
	}

	BasePage.prototype.constructor = BasePage;

	BasePage.prototype.init = function(model, element)
	{

	};

	BasePage.prototype.clearRelatedRightPage = function(type)
	{
		var self = this;

		switch (type)
		{
			case "detailview":
				self.detailView = null;
				self.obShowDetailPanel(false);
				break;
			case "fieldtripde":
				self.fieldTripDataEntry = null;
				self.obShowFieldTripDEPanel(false);
				break;
			default:
				self.detailView = null;
				self.fieldTripDataEntry = null;
				self.obShowFieldTripDEPanel(false);
				self.obShowDetailPanel(false);
				break;
		}
	};

	BasePage.prototype.showDetailsClick = function()
	{
		var self = this, selectedIds = self.searchGrid.getSelectedIds(), selectedId;

		if (!selectedIds || selectedIds.length <= 0)
		{
			return;
		}

		selectedId = selectedIds[0];
		if (self.detailView && self.detailView.isReadMode() && self.obShowDetailPanel())
		{
			self.detailView.showDetailViewById(selectedId);
		}
		else
		{
			ga('send', 'event', 'Area', 'Details');
			self.detailView = new TF.DetailView.DetailViewViewModel(selectedId);
			self.detailView.onCloseDetailEvent.subscribe(
				self.closeDetailClick.bind(self)
			);
			if (TF.isPhoneDevice)
			{
				tf.pageManager.resizablePage.setLeftPage("workspace/detailview/detailview", self.detailView);
			}
			else
			{
				tf.pageManager.resizablePage.setRightPage("workspace/detailview/detailview", self.detailView);
			}

		}
		self.obShowDetailPanel(true);
	};


	BasePage.prototype.closeDetailClick = function(isNotMobile)
	{
		var self = this;
		if (isNotMobile === true)
		{
			tf.pageManager.resizablePage.closeRightPage();
		} else
		{
			tf.pageManager.resizablePage.clearLeftOtherContent();
			self.detailView.dispose();
			self.detailView = null;
			self.obShowDetailPanel(false);
			if ($(".kendoscheduler").length > 0)
			{
				$(".kendoscheduler").getKendoScheduler().refresh();
			}
		}

	};

	//TODO right click menu feature
	BasePage.prototype.copyToClipboardClick = function()
	{

	};

	//TODO right click menu feature
	BasePage.prototype.saveAsClick = function()
	{
	};

	//TODO right click menu feature
	BasePage.prototype.openSelectedClick = function()
	{
	};
})();

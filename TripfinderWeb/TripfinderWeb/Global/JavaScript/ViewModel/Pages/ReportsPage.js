(function()
{
	createNamespace("TF.Page").ReportsPage = ReportsPage;

	function ReportsPage()
	{
		var self = this;
		self.type = "reports";
		self.pageType = "reports";
		TF.Page.BaseGridPage.apply(self, arguments);
		self.cancelButton = false;
		self.detailButton = false;
	}

	ReportsPage.prototype = Object.create(TF.Page.BaseGridPage.prototype);
	ReportsPage.prototype.constructor = ReportsPage;

	ReportsPage.prototype.updateOptions = function()
	{
		var self = this;
		self.options.gridDefinition = tf.reportGridDefinition.gridDefinition();
		self.options.showOmittedCount = false;
		self.options.storageKey = "grid.currentlayout." + self.pageType;
		self.options.loadUserDefined = false;

		self.options.summaryFilters = [{
			Id: -1,
			Name: "Today",
			IsValid: true
		},
		{
			Id: -2,
			Name: "Vehicle Scheduled",
			IsValid: true
		},
		{
			Id: -3,
			Name: "Pending Approval",
			IsValid: true,
			WhereClause: " FieldTripStageId = 1 or FieldTripStageId = 3 or FieldTripStageId = 5 or FieldTripStageId = 7",
			GridType: self.type
		},
		{
			Id: -4,
			Name: "Declined",
			IsValid: true,
			WhereClause: "FieldTripStageId = 2 or FieldTripStageId = 4 or FieldTripStageId = 6 or FieldTripStageId = 98",
			GridType: self.type
		},
		{
			Id: -5,
			Name: "Total",
			IsValid: true,
			WhereClause: "FieldTripStageId != 100",
			GridType: self.type
		},
		{
			Id: -6,
			Name: "Transportation Approved",
			IsValid: true,
			WhereClause: "FieldTripStageId = 99",
			GridType: self.type
		}
		];
	};

	ReportsPage.prototype.showDetailsClick = function()
	{
	};

	ReportsPage.prototype.openReportUserInformationModel = function(viewModel, e)
	{
		tf.modalManager.showModal(new TF.Modal.ReportUserInformationModalViewModel());
	};

	ReportsPage.prototype.openManageYouReportsModel = function(viewModel, e)
	{
	};

	ReportsPage.prototype.dispose = function()
	{
		var self = this;
		TF.Page.BaseGridPage.prototype.dispose.call(self);
	};
})();
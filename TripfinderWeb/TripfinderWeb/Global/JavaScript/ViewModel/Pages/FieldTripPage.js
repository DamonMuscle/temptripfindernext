(function()
{
	createNamespace("TF.Page").FieldTripPage = FieldTripPage;

	function FieldTripPage(gridOptions)
	{
		var self = this, isLevel1User, authInfo = tf.authManager.authorizationInfo;
		self.type = "fieldtrip";
		self.pageType = "fieldtrips";
		self.gridOptions = gridOptions;
		TF.Page.BaseGridPage.apply(self, arguments);

		isLevel1User = !self.isAdmin && !authInfo.isAuthorizedFor("level4Administrator", "edit") && !authInfo.isAuthorizedFor("level3Administrator", "edit")
			&& !authInfo.isAuthorizedFor("level2Administrator", "edit") && authInfo.isAuthorizedFor("level1Requestor", "edit");
		if (!isLevel1User)
		{
			self.approveButton = true;
			self.declineButton = true;
		}
		self.detailButton = true;
		self.schedulerButton = true;
	}

	FieldTripPage.prototype = Object.create(TF.Page.BaseGridPage.prototype);
	FieldTripPage.prototype.constructor = FieldTripPage;

	FieldTripPage.prototype.updateOptions = function()
	{
		var self = this;
		if (self.gridOptions)
		{
			self.options.fromSearch = self.gridOptions.fromSearch;
			self.options.searchFilter = self.gridOptions.searchFilter;
			self.options.filteredIds = self.gridOptions.filteredIds;
		}
		self.options.gridDefinition = tf.fieldTripGridDefinition.gridDefinition();
		self.options.showOmittedCount = true;
		self.options.isGridView = true;
		self.options.url = pathCombine(tf.api.apiPrefix(), "search", "fieldtrip");
		self.options.extraFields = ["FieldTripStageId"];
		self.options.loadUserDefined = false;
		self.options.supportMobileMultipleSelect = true;

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

	FieldTripPage.prototype.createGrid = function(option)
	{
		TF.Page.BaseGridPage.prototype.createGrid.call(this, option);
		if (this.searchGrid)
		{
			this.searchGrid.onCtrlSPress.subscribe(this.onCtrlSPress.bind(this));
			this.searchGrid.onCtrlCPress.subscribe(this.onCtrlCPress.bind(this));
		}
	}

	FieldTripPage.prototype.dispose = function()
	{
		var self = this;
		TF.Page.BaseGridPage.prototype.dispose.call(self);
	};
})();
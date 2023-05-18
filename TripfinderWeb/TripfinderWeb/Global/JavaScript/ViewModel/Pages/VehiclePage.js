(function()
{
    createNamespace("TF.Page").VehiclePage = VehiclePage;

    function VehiclePage(gridOptions)
	{
		var self = this;
		self.type = "vehicle";
		self.pageType = "vehicles";
		self.gridOptions = gridOptions;
		TF.Page.BaseGridPage.apply(self, arguments);

        self.changeStatusButton = false;
		self.copyButton = true;
		self.detailButton = true;
		self.schedulerButton = false;
	}

    VehiclePage.prototype = Object.create(TF.Page.BaseGridPage.prototype);
	VehiclePage.prototype.constructor = VehiclePage;

    VehiclePage.prototype.updateOptions = function()
	{
		var self = this;
		if (self.gridOptions)
		{
			self.options.isTemporaryFilter = self.gridOptions.isTemporaryFilter;	// FT-1231 - Transfer the flag for open specific record (on-demand) from startup options to Trip grid view
			self.options.showRecordDetails = self.gridOptions.showRecordDetails;	// FT-1231 - Transfer the flag for show details (on-demand) from startup options to Trip grid view
			self.options.fromSearch = self.gridOptions.fromSearch;
			self.options.searchFilter = self.gridOptions.searchFilter;
			self.options.filteredIds = self.gridOptions.filteredIds;
		}
		self.options.gridDefinition = tf.vehicleGridDefinition.gridDefinition();
		self.options.showOmittedCount = true;
		self.options.isGridView = true;
		self.options.url = pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint("vehicle"));
		// self.options.extraFields = ["FieldTripStageId"];
		self.options.loadUserDefined = false;
		self.options.supportMobileMultipleSelect = true;

		// self.options.summaryFilters = tf.vehicleGridDefinition.getSummaryFilters();
		// self.options.summaryFilterFunction = tf.vehicleGridDefinition.getSummaryFunction();
	};

	VehiclePage.prototype.createGrid = function(option)
	{
		var self = this,
			shouldShowDetails = self.options.showRecordDetails;

		TF.Page.BaseGridPage.prototype.createGrid.call(self, option);

		if (shouldShowDetails)
		{
			self.openVehicleRecordDetailsOnInitialLoad();
		}
	};

	VehiclePage.prototype.openVehicleRecordDetailsOnInitialLoad = function()
	{
		this.showDetailsClick();
	};

	VehiclePage.prototype.updateEditable = function()
	{
		var isEditable = false;
		if (tf.authManager.authorizationInfo.isAdmin)
		{
			isEditable = true;
		}
		else
		{
			isEditable = tf.authManager.isAuthorizedForDataType(this.type, "edit");
		}

		this.selectedItemEditable(isEditable);
		this.selectedItemsEditable(isEditable);
	};
})();
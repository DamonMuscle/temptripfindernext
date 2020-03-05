(function()
{
	createNamespace("TF.Page").FieldTripPage = FieldTripPage;

	function FieldTripPage (gridOptions)
	{
		var self = this;
		self.type = "fieldtrip";
		self.pageType = "fieldtrips";
		self.gridOptions = gridOptions;
		TF.Page.BaseGridPage.apply(self, arguments);
		self.changeStatusButton = true;
		self.massUpdateButton = true;
		self.copyButton = true;
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
			self.options.isTemporaryFilter = self.gridOptions.isTemporaryFilter;	// FT-1231 - Transfer the flag for open specific record (on-demand) from startup options to Trip grid view
			self.options.showRecordDetails = self.gridOptions.showRecordDetails;	// FT-1231 - Transfer the flag for show details (on-demand) from startup options to Trip grid view
			self.options.fromSearch = self.gridOptions.fromSearch;
			self.options.searchFilter = self.gridOptions.searchFilter;
			self.options.filteredIds = self.gridOptions.filteredIds;
		}
		self.options.gridDefinition = tf.fieldTripGridDefinition.gridDefinition();
		self.options.showOmittedCount = true;
		self.options.isGridView = true;
		self.options.url = pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint("fieldtrip"));
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
		self.options.summaryFilterFunction = function(selectGridFilterEntityId)
		{
			var paramData = null;
			switch (selectGridFilterEntityId)
			{
				case -1:
				case -2:
					var today = new Date(), tomorrow = new Date();
					tomorrow.setTime(tomorrow.getTime()+ 24 * 60 * 60 * 1000);
					var today_str = today.getFullYear()+"-" + (today.getMonth() + 1) + "-" + today.getDate(),
					tomorrow_str = tomorrow.getFullYear()+"-" + (tomorrow.getMonth() + 1) + "-" + tomorrow.getDate();
					paramData = { 
						"@filter": "eq(FieldTripStageId,99)&lt(DepartDateTime," + tomorrow_str + ")&ge(EstimatedReturnDateTime," + today_str + ")", 
						"@fields": "Id" 
					}
						break;
				case -3:
					paramData = { "@filter": "in(FieldTripStageId,1,3,5,7)", "@fields": "Id" }
					break;
				case -4:
					paramData = { "@filter": "in(FieldTripStageId,2,4,6,8)", "@fields": "Id" }
					break;
				case -5:
					paramData = { "@filter": "noteq(FieldTripStageId,100)", "@fields": "Id" }
					break;
				case -6:
					paramData = { "@filter": "eq(FieldTripStageId,99)", "@fields": "Id" }
					break;
			}

			if (paramData)
			{
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), tf.DataTypeHelper.getEndpoint("fieldtrip")), { paramData: paramData}).then(function(response)
				{
					return response.Items.map(r=> r.Id);
				});
			}

			return Promise.resolve(null);
		};
	};

	FieldTripPage.prototype.createGrid = function(option)
	{
		var self = this,
			shouldShowDetails = self.options.showRecordDetails;

		TF.Page.BaseGridPage.prototype.createGrid.call(self, option);

		if (shouldShowDetails)
		{
			self.openTripRecordDetailsOnInitialLoad();
		}
	};

	FieldTripPage.prototype.openTripRecordDetailsOnInitialLoad = function()
	{
		var self = this,
			recordIdToOpen = self.options.filteredIds[0];

		// Setup a databound callback for searchgrid to open the specific FieldTrip record (only for on-demand page access with specified tripid in url)
		var initialDataBoundCallback = function()
		{
			self.searchGrid.onDataBoundEvent.unsubscribe(initialDataBoundCallback);

			var recordIdInGrid = self.searchGrid.allIds.filter(function(id)
			{
				return id == recordIdToOpen;
			})[0];

			if (!recordIdInGrid) return;

			self.showDetailsClick(recordIdInGrid);
			tf.pageManager.resizablePage.reLayoutPage(100);	// maximize the right panel (detailview)
		};
		self.searchGrid.onDataBoundEvent.subscribe(initialDataBoundCallback);
	};
})();
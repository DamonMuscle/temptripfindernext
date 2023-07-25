(function ()
{
	createNamespace("TF.Page").FieldTripPage = FieldTripPage;

	function FieldTripPage(gridOptions)
	{
		var self = this;
		self.type = "fieldtrip";
		self.pageType = "fieldtrips";
		self.gridOptions = gridOptions;
		TF.Page.BaseGridPage.apply(self, arguments);
		self.changeStatusButton = true;
		self.copyButton = true;
		self.detailButton = true;
		self.schedulerButton = true;
	}

	FieldTripPage.prototype = Object.create(TF.Page.BaseGridPage.prototype);
	FieldTripPage.prototype.constructor = FieldTripPage;

	FieldTripPage.prototype.updateOptions = function ()
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

		self.options.summaryFilters = tf.fieldTripGridDefinition.getSummaryFilters();
		self.options.summaryFilterFunction = tf.fieldTripGridDefinition.getSummaryFunction();
	};

	FieldTripPage.prototype.createGrid = function (option)
	{
		var self = this,
			shouldShowDetails = self.options.showRecordDetails;

		TF.Page.BaseGridPage.prototype.createGrid.call(self, option);

		if (shouldShowDetails)
		{
			self.openTripRecordDetailsOnInitialLoad();
		}
	};

	FieldTripPage.prototype.openTripRecordDetailsOnInitialLoad = function ()
	{
		var self = this,
			recordIdToOpen = self.options.filteredIds[0];

		// Setup a databound callback for searchgrid to open the specific FieldTrip record (only for on-demand page access with specified tripid in url)
		var initialDataBoundCallback = function ()
		{
			self.searchGrid.onDataBoundEvent.unsubscribe(initialDataBoundCallback);

			var recordIdInGrid = self.searchGrid.allIds.filter(function (id)
			{
				return id == recordIdToOpen;
			})[0];

			if (!recordIdInGrid) return;

			self.showDetailsClick(recordIdInGrid);
			tf.pageManager.resizablePage.reLayoutPage(100);	// maximize the right panel (detailview)
		};
		self.searchGrid.onDataBoundEvent.subscribe(initialDataBoundCallback);
	};

	FieldTripPage.prototype.getStaffs = function()
	{
		const self = this,
			selectedIds = self.searchGrid.getSelectedIds().join(',');

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), 'staff'), {
			paramData: {
				fieldtripIds: selectedIds,
				type: "driver"
			}
		}).then(function(apiResponse)
		{
			const drivers = apiResponse.Items;
			if (drivers && drivers.length > 0)
			{
				return drivers;

			}
			tf.promiseBootbox.alert("No users are associated with the selected Staff record(s).");
		});
	};

	FieldTripPage.prototype._getIdsFromRelated = function (relatedType, descriptor, relatedIds)
	{
		if (relatedType == 'fieldtripinvoice')
		{
			return this.getSelectedFieldTripIds(relatedIds);
		}

		return BaseGridPage.prototype._getIdsFromRelated.apply(this, arguments);
	};

	FieldTripPage.prototype.getSelectedFieldTripIds = function (relatedIds)
	{
		if (!relatedIds || !relatedIds.length)
		{
			return Promise.resolve([]);
		};

		const ids = relatedIds.join(',');
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "FieldTripInvoices"),
			{
				paramData: {
					'@filter': `in(FieldTripID,${ids})`,
					"@fields": "Id"
				}
			}).then(res =>
			{
				return [...new Set(res.Items.map(s => s.Id))];
			});
	};
})();
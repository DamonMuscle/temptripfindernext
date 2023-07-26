(function ()
{
	createNamespace("TF.Page").FieldTripInvoicePage = FieldTripInvoicePage;

	function FieldTripInvoicePage(gridOptions)
	{
		var self = this;
		self.type = "fieldtripinvoice";
		self.pageType = "fieldtripinvoices";
		self.gridOptions = gridOptions;
		TF.Page.BaseGridPage.apply(self, arguments);
		self.disableAdd = true;
		self.changeStatusButton = false;
		self.copyButton = false;
		self.disableDoubleClick = true;
		self.detailButton = false;
		self.schedulerButton = false;
	}

	FieldTripInvoicePage.prototype = Object.create(TF.Page.BaseGridPage.prototype);
	FieldTripInvoicePage.prototype.constructor = FieldTripInvoicePage;

	FieldTripInvoicePage.prototype.updateOptions = function ()
	{
		var self = this;
		if (self.gridOptions)
		{
			self.options.isTemporaryFilter = self.gridOptions.isTemporaryFilter;	// FT-1231 - Transfer the flag for open specific record (on-demand) from startup options to Trip grid view
			self.options.showRecordDetails = false;
			self.options.fromSearch = self.gridOptions.fromSearch;
			self.options.searchFilter = self.gridOptions.searchFilter;
			self.options.filteredIds = self.gridOptions.filteredIds;
		}
		self.options.gridDefinition = tf.fieldTripInvoicePageGridDefinition.gridDefinition();
		self.options.showOmittedCount = true;
		self.options.isGridView = true;
		self.options.url = pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint("fieldtripinvoice"));
		self.options.loadUserDefined = false;
		self.options.supportMobileMultipleSelect = true;
	};

	FieldTripInvoicePage.prototype.createGrid = function (option)
	{
		var self = this,
			shouldShowDetails = self.options.showRecordDetails;

		TF.Page.BaseGridPage.prototype.createGrid.call(self, option);

		if (shouldShowDetails)
		{
			self.openTripRecordDetailsOnInitialLoad();
		}
	};

	FieldTripInvoicePage.prototype._getIdsFromRelated = function (relatedType, descriptor, relatedIds)
	{
		if (relatedType == 'fieldtrip')
		{
			return this.getSelectedFieldTripIds(relatedIds);
		}

		return BaseGridPage.prototype._getIdsFromRelated.apply(this, arguments);
	};

	FieldTripInvoicePage.prototype.getSelectedFieldTripIds = function (relatedIds)
	{
		if (!relatedIds || !relatedIds.length)
		{
			return Promise.resolve([]);
		};

		const ids = relatedIds.join(',');
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "FieldTripInvoices"),
			{
				paramData: {
					'@filter': `in(id,${ids})`,
					"@fields": "FieldTripID"
				}
			}).then(res =>
			{
				return [...new Set(res.Items.map(s => s.FieldTripId))];
			});
	};
})();
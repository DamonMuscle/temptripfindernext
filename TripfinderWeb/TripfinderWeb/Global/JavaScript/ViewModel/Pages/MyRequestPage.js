(function ()
{
	createNamespace("TF.Page").MyRequestPage = MyRequestPage;

	function MyRequestPage()
	{
		var self = this;
		TF.Page.FieldTripPage.apply(self, arguments);
		self.pageType = "myrequests";
		self.cancelButton = true;
		self.copyButton = true;
		self.detailButton = true;
		self.schedulerButton = true;
	}

	MyRequestPage.prototype = Object.create(TF.Page.FieldTripPage.prototype);
	MyRequestPage.prototype.constructor = MyRequestPage;

	MyRequestPage.prototype.updateOptions = function ()
	{
		var self = this;
		self.options.gridDefinition = tf.fieldTripGridDefinition.gridDefinition();
		self.options.showOmittedCount = true;
		self.options.isGridView = true;
		self.options.url = pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint("fieldtrip"));
		self.options.extraFields = ["FieldTripStageId"];
		self.options.loadUserDefined = false;
		self.options.supportMobileMultipleSelect = true;
		self.options.paramData = { "filterType": "submitted" };
		if (self.pageType === "approvals")
		{
			self.options.summaryFilters = tf.fieldTripGridDefinition.getSummaryFilters("approvals");
		}
		else
		{
			self.options.summaryFilters = tf.fieldTripGridDefinition.getSummaryFilters();
		}
		self.options.summaryFilterFunction = tf.fieldTripGridDefinition.getSummaryFunction();
	};

	MyRequestPage.prototype._getIdsFromRelated = function (relatedType, descriptor, relatedIds)
	{
		if (relatedType == 'fieldtripinvoice')
		{
			return this.getSelectedFieldTripIds(relatedIds);
		}

		return BaseGridPage.prototype._getIdsFromRelated.apply(this, arguments);
	};

	MyRequestPage.prototype.getSelectedFieldTripIds = function (relatedIds)
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
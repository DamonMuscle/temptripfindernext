
(function()
{
	createNamespace("TF.Control").GlobalReplaceResultsViewModel = GlobalReplaceResultsViewModel;

	function GlobalReplaceResultsViewModel(resultsInfo, gridType)
	{
		var self = this;
		self.gridType = gridType;
		self.resultsInfo = resultsInfo;
		self.successIds = self.resultsInfo.SuccessIds;
		self.failedIds = self.resultsInfo.FailedIds;
		self.recordsCount = self.successIds.length + self.failedIds.length;
		self.successMessage = self.successIds.length.toString() + " record" + (self.successIds.length != 1 ? "s were " : " was ") + "successfully replaced.";
		self.failedMessage = self.failedIds.length.toString() + " record" + (self.failedIds.length != 1 ? "s " : " ") + "couldn't be replaced due to permission control.";
		self.obSuccessIds = ko.observableArray(self.successIds);
		self.obFailedIds = ko.observableArray(self.failedIds);
	}

	GlobalReplaceResultsViewModel.prototype.openResultsInNewGrid = function(ids, e)
	{
		var self = this;
		if (ids.length == 0)
		{
			return;
		}

		var documentData = new TF.Document.DocumentData(TF.Document.DocumentData.Grid,
			{
				gridType: self.gridType,
				isTemporaryFilter: false,
				gridState: {
					gridFilterId: null,
					filteredIds: ids
				}
			});
		tf.documentManagerViewModel.add(documentData, e.shiftKey || true, false, "", true, e.shiftKey);
	}

})();
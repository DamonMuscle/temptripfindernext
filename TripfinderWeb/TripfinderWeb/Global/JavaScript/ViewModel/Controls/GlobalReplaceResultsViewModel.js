
(function()
{
	createNamespace("TF.Control").GlobalReplaceResultsViewModel = GlobalReplaceResultsViewModel;

	function GlobalReplaceResultsViewModel(resultsInfo, gridType)
	{
		var self = this;
		self.gridType = gridType;
		self.resultsInfo = resultsInfo;
		self.updatedIds = self.resultsInfo.UpdatedIds;
		self.failedIds = self.resultsInfo.FailedIds;
		self.ignoredIds = self.resultsInfo.IgnoredIds == null ? [] : self.resultsInfo.IgnoredIds;
		self.invalidDateIds = self.resultsInfo.InvalidDateIds == null ? [] : self.resultsInfo.InvalidDateIds;
		self.recordsCount = self.updatedIds.length + self.failedIds.length + self.invalidDateIds.length + self.ignoredIds.length;
		self.successMessage = self.updatedIds.length.toString() + " record" + (self.updatedIds.length != 1 ? "s were " : " was ") + "successfully replaced.";
		if (resultsInfo.Error)
		{
			self.failedMessage = self.failedIds.length.toString() + " record" + (self.failedIds.length != 1 ? "s " : " ") + "couldn't be replaced." + `<div>${resultsInfo.Error}</div>`;
		}
		else
		{
			self.failedMessage = self.failedIds.length.toString() + " record" + (self.failedIds.length != 1 ? "s " : " ") + "couldn't be replaced" + (gridType == "fieldtrip" ? " due to permission control" : "") + ".";
		}

		self.obUpdatedIds = ko.observableArray(self.updatedIds);
		self.obFailedIds = ko.observableArray(self.failedIds);
		self.obIgnoredIds = ko.observableArray(self.ignoredIds);
		self.obInvalidDateIds = ko.observableArray(self.invalidDateIds);
		self.invalidDateMessage = "";
		if (self.invalidDateIds && self.invalidDateIds.length > 0 && gridType == "fieldtrip")
		{
			self.invalidDateMessage = self.invalidDateIds.length.toString() + " record" + (self.invalidDateIds.length !== 1 ? "s " : " ") + "couldn't be replaced because Return Date/Time must be later than Depart Date/Time.";
		}
		self.ignoreMessage = "";
		if (self.ignoredIds && self.ignoredIds.length)
		{
			if (gridType == "school")
			{
				self.ignoreMessage = self.ignoredIds.length.toString() + " record" + (self.ignoredIds.length != 1 ? "s were " : " was ") + "ignored because FeedSchool doesn't include the next grade.";
			}
			else
			{
				self.ignoreMessage = self.ignoredIds.length.toString() + " record" + (self.ignoredIds.length != 1 ? "s were " : " was ") + "ignored.";
			}
		}
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
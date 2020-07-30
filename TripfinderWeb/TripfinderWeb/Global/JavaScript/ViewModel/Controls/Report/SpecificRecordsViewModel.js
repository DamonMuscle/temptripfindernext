(function()
{
	createNamespace("TF.Control.Report").SpecificRecordsViewModel = SpecificRecordsViewModel;

	function SpecificRecordsViewModel(option)
	{
		var self = this;

		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();

		// search existing list mover.
		self.searchExistingViewModel = new TF.DetailView.SearchExistingRecordWrapper({
			selectedData: option.selectedData,
			dataType: option.dataType,
			defaultColumns: option.defaultColumns,
			pageLevelViewModel: self.pageLevelViewModel,
			dataSource: option.dataSourceId
		});
	};

	/**
	 * Save the object.
	 *
	 * @returns {void}
	 */
	SpecificRecordsViewModel.prototype.save = function()
	{

	};

	/**
	 * Dispose
	 * 
	 * @return {void}
	 */
	SpecificRecordsViewModel.prototype.dispose = function()
	{
		var self = this;
		self.pageLevelViewModel.dispose();
		self.searchExistingViewModel.dispose();
		self.pageLevelViewModel = null;
		self.searchExistingViewModel = null;
	};
})();
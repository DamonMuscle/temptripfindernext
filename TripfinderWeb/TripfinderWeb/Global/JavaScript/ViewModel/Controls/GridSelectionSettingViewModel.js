(function()
{
	createNamespace("TF.Control").GridSelectionSettingViewModel = GridSelectionSettingViewModel;

	function GridSelectionSettingViewModel(selectedCount)
	{
		this.obSpecifyRecords = ko.observableArray([
			{ value: 'allInFilter', text: 'All records in filter' },
			{ value: 'selected', disable: selectedCount == 0, text: 'Current ' + selectedCount + ' selected ' + TF.getSingularOrPluralTitle("record", selectedCount) }
		]);
		var selectedSpecifyRecord = this.obSpecifyRecords()[selectedCount > 0 ? 1 : 0];
		this.obSelectedSpecifyRecords = ko.observable(selectedSpecifyRecord.value);
	}

	GridSelectionSettingViewModel.prototype.apply = function()
	{
		return {
			specifyRecords: this.obSelectedSpecifyRecords()
		};
	};

})();
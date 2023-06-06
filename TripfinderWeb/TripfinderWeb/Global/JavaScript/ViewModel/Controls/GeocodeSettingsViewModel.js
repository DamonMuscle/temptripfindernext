(function()
{
	createNamespace("TF.Control").GeocodeSettingsViewModel = GeocodeSettingsViewModel;

	function GeocodeSettingsViewModel(selectedCount, allUngeocodeCount, selectUngeocodeCount, gridType)
	{
		var self = this;
		self.obSpecifyRecords = ko.observableArray([
			{ value: 'allInFilter', text: 'All records in filter(' + allUngeocodeCount + " Ungeocoded)" },
			{ value: 'selected', disable: selectedCount == 0, text: 'Current ' + selectedCount + ' selected ' + TF.getSingularOrPluralTitle("record", selectedCount) + "(" + selectUngeocodeCount + " Ungeocoded)" }
		]);
		var selectedSpecifyRecord = self.obSpecifyRecords()[selectedCount > 0 ? 1 : 0];
		self.obSelectedSpecifyRecords = ko.observable(selectedSpecifyRecord.value);
		self.obSelectedGeocodeSource = ko.observable('Street Address Range');
		self.obGeocodeSources = gridType == "student" ? ko.observable(['Address Point', 'Street Address Range', 'Phone']) : ko.observable(['Address Point', 'Street Address Range']);
		self.isInteractive = ko.observable(false);
		self.initSaveSetting(gridType);
	}

	GeocodeSettingsViewModel.prototype.initSaveSetting = function(gridType)
	{
		const self = this, key = gridType + "GeoCodeSetting", savedSetting = tf.storageManager.get(key);
		if (savedSetting)
		{
			self.obSelectedGeocodeSource(savedSetting);
		}

		self.obSelectedGeocodeSource.subscribe(function()
		{
			tf.storageManager.save(key, self.obSelectedGeocodeSource());
		});
	}
})();
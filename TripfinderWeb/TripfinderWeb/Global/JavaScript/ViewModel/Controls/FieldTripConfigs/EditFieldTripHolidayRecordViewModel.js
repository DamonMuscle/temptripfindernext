(function()
{
	createNamespace('TF.Control').EditFieldTripHolidayRecordViewModel = EditFieldTripHolidayRecordViewModel;

	function EditFieldTripHolidayRecordViewModel(configType, recordEntity)
	{
		var self = this;

		TF.Control.EditFieldTripConfigRecordViewModelBase.call(self, configType, recordEntity);

		self.obHolidayDateString = ko.observable(self.isEdit ? self.normalizeDateString(recordEntity.Holiday) : "");
		self._formatDateString = self.formatDateString.bind(self);
		self.obHolidaySub = self.obHolidayDateString.subscribe(self._formatDateString);
	}

	EditFieldTripHolidayRecordViewModel.prototype = Object.create(TF.Control.EditFieldTripConfigRecordViewModelBase.prototype);

	EditFieldTripHolidayRecordViewModel.prototype.constructor = EditFieldTripHolidayRecordViewModel;

	EditFieldTripHolidayRecordViewModel.prototype.formatDateString = function(value)
	{
		var self = this,
			val = self.normalizeDateString(value);

		if (val != null && val !== value)
		{
			self.obHolidaySub.dispose();
			self.obHolidayDateString(moment(val).format("MM/DD/YYYY"));
			self.obHolidaySub = self.obHolidayDateString.subscribe(self._formatDateString);
		}
	}

	EditFieldTripHolidayRecordViewModel.prototype.getRecordEntity = function()
	{
		var self = this;

		return {
			ID: self.obRecordId(),
			Holiday: self.normalizeDateString(self.obHolidayDateString())
		};
	}
})();


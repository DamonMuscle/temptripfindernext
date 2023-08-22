(function()
{
	createNamespace('TF.Control').EditFieldTripActivityRecordViewModel = EditFieldTripActivityRecordViewModel;

	function EditFieldTripActivityRecordViewModel(configType, recordEntity)
	{
		var self = this;

		TF.Control.EditFieldTripConfigRecordViewModelBase.call(self, configType, recordEntity);

		self.originalCode = self.isEdit ? recordEntity.Name : "";
		self.obCode = ko.observable(self.originalCode);
		self.obDescription = ko.observable(self.isEdit ? recordEntity.Description : "");

	}

	EditFieldTripActivityRecordViewModel.prototype = Object.create(TF.Control.EditFieldTripConfigRecordViewModelBase.prototype);

	EditFieldTripActivityRecordViewModel.prototype.constructor = EditFieldTripActivityRecordViewModel;

	EditFieldTripActivityRecordViewModel.prototype.getRecordEntity = function()
	{
		var self = this;

		return {
			Id: self.obRecordId(),
			Name: self.obCode(),
			Description: self.obDescription()
		};
	};

})();


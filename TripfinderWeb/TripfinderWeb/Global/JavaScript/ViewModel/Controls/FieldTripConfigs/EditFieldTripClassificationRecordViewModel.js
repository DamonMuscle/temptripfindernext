(function()
{
	createNamespace('TF.Control').EditFieldTripClassificationRecordViewModel = EditFieldTripClassificationRecordViewModel;

	function EditFieldTripClassificationRecordViewModel(configType, recordEntity)
	{
		var self = this, code, description;

		TF.Control.EditFieldTripConfigRecordViewModelBase.call(self, configType, recordEntity);

		code = self.isEdit ? recordEntity.Code : null;
		description = self.isEdit ? recordEntity.Description : null;

		self.obCode = ko.observable(code);
		self.obDescription = ko.observable(description);
	}

	EditFieldTripClassificationRecordViewModel.prototype = Object.create(TF.Control.EditFieldTripConfigRecordViewModelBase.prototype);

	EditFieldTripClassificationRecordViewModel.prototype.constructor = EditFieldTripClassificationRecordViewModel;

	EditFieldTripClassificationRecordViewModel.prototype.getRecordEntity = function()
	{
		var self = this,
			record = {
				Id: self.obRecordId(),
				Code: self.obCode(),
				Description: self.obDescription()
			};

		return record;
	};
})();


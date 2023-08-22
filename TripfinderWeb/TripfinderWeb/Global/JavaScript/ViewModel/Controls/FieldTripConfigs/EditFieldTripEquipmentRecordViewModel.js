(function()
{
	createNamespace('TF.Control').EditFieldTripEquipmentRecordViewModel = EditFieldTripEquipmentRecordViewModel;

	function EditFieldTripEquipmentRecordViewModel(configType, recordEntity)
	{
		var self = this;
		TF.Control.EditFieldTripConfigRecordViewModelBase.call(self, configType, recordEntity);

		self.obId = ko.observable(self.isEdit ? recordEntity.Id : -1);
		self.obEqName = ko.observable(self.isEdit ? recordEntity.EquipmentName : "");

	}
	EditFieldTripEquipmentRecordViewModel.prototype = Object.create(TF.Control.EditFieldTripConfigRecordViewModelBase.prototype);
	EditFieldTripEquipmentRecordViewModel.prototype.constructor = EditFieldTripEquipmentRecordViewModel;
	EditFieldTripEquipmentRecordViewModel.prototype.getRecordEntity = function()
	{
		var self = this;
		return {
			Id: self.obId(),
			EquipmentName: self.obEqName()
		};
	}
})()
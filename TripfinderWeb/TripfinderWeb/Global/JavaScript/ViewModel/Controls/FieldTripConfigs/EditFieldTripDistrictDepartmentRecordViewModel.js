(function()
{
	createNamespace('TF.Control').EditFieldTripDistrictDepartmentRecordViewModel = EditFieldTripDistrictDepartmentRecordViewModel;

	function EditFieldTripDistrictDepartmentRecordViewModel(configType, recordEntity) 
	{
		var self = this;
		TF.Control.EditFieldTripConfigRecordViewModelBase.call(self, configType, recordEntity);

		self.obId = ko.observable(self.isEdit ? recordEntity.Id : -1);
		self.obCode = ko.observable(self.isEdit ? recordEntity.Name : "");
		self.obDescription = ko.observable(self.isEdit ? recordEntity.Description : "");
	}
	EditFieldTripDistrictDepartmentRecordViewModel.prototype = Object.create(TF.Control.EditFieldTripConfigRecordViewModelBase.prototype);
	EditFieldTripDistrictDepartmentRecordViewModel.prototype.constructor = EditFieldTripDistrictDepartmentRecordViewModel;
	EditFieldTripDistrictDepartmentRecordViewModel.prototype.getRecordEntity = function()
	{
		var self = this;
		return {
			Id: self.obId(),
			Name: self.obCode(),
			Description: self.obDescription()
		};
	}
})()
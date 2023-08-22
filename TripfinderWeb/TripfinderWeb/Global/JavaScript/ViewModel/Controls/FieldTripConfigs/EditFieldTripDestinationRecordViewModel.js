(function()
{
	createNamespace('TF.Control').EditFieldTripDestinationRecordViewModel = EditFieldTripDestinationRecordViewModel;

	function EditFieldTripDestinationRecordViewModel(configType, recordEntity)
	{
		var self = this;
		TF.Control.EditFieldTripConfigRecordViewModelBase.call(self, configType, recordEntity);

		self.obId = ko.observable(self.isEdit ? recordEntity.Id : -1);
		self.obName = ko.observable(self.isEdit ? recordEntity.Name : "");
		self.obStreet = ko.observable(self.isEdit ? recordEntity.Street : null);
		self.obCity = ko.observable(self.isEdit ? recordEntity.City : null);
		self.obState = ko.observable(self.isEdit ? recordEntity.State : null);
		self.obZip = ko.observable(self.isEdit ? recordEntity.Zip : null);
		self.obContact = ko.observable(self.isEdit ? recordEntity.Contact : null);
		self.obTitle = ko.observable(self.isEdit ? recordEntity.ContactTitle : null);
		self.obPhone = ko.observable(self.isEdit ? recordEntity.Phone : null);
		self.obPhoneExt = ko.observable(self.isEdit ? recordEntity.PhoneExt : null);
		self.obFax = ko.observable(self.isEdit ? recordEntity.Fax : null);
		self.obEmail = ko.observable(self.isEdit ? recordEntity.Email : null);
		self.obNotes = ko.observable(self.isEdit ? recordEntity.Notes : null);
	}

	EditFieldTripDestinationRecordViewModel.prototype = Object.create(TF.Control.EditFieldTripConfigRecordViewModelBase.prototype);
	EditFieldTripDestinationRecordViewModel.prototype.constructor = EditFieldTripDestinationRecordViewModel;
	EditFieldTripDestinationRecordViewModel.prototype.getRecordEntity = function()
	{
		var self = this;
		return {
			Id: self.obId(),
			Name: self.obName(),
			City: self.obCity(),
			Street: self.obStreet(),
			State: self.obState(),
			Zip: self.obZip(),
			Notes: self.obNotes(),
			Email: self.obEmail(),
			Fax: self.obFax(),
			Contact: self.obContact(),
			Phone: self.obPhone(),
			PhoneExt: self.obPhoneExt(),
			ContactTitle: self.obTitle()
		};
	};

	EditFieldTripDestinationRecordViewModel.prototype.updateValidatorFields = function(validatorFields)
	{
		validatorFields.phone = {
			trigger: "change blur",
			validators: {
				phoneinplus: {
					country: "US",
					message: 'invalid phone number'
				}
			}
		};

		validatorFields.fax = {
			trigger: "change blur",
			validators: {
				phoneinplus: {
					country: "US",
					message: 'invalid fax number'
				}
			}
		};
	};
})()
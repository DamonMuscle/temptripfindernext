(function()
{
	var namespace = window.createNamespace("TF.DataModel");
	namespace.FieldTripTemplatesDataModel = function(fieldTripEntity)
	{
		namespace.BaseDataModel.call(this, fieldTripEntity);
	}

	namespace.FieldTripTemplatesDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.FieldTripTemplatesDataModel.prototype.constructor = namespace.FieldTripTemplatesDataModel;

	namespace.FieldTripTemplatesDataModel.prototype.mapping = [
		{ from: "Id", default: 0 },
		{ from: "FieldTripStageId", default: null },
		{ from: "PublicId", default: "" },
		{ from: "Name", default: "" },
		{ from: "DepartFromSchool", default: "" },
		{ from: "School", default: "" },
		{ from: "FieldTripClassificationId", default: null },
		{ from: "FieldTripActivityId", default: null },
		{ from: "FieldTripAccountId", default: null },
		{ from: "DistrictDepartmentId", default: null },
		{ from: "Notes", default: "" },
		{ from: "Destination", default: "" },
		{ from: "DestinationStreet", default: "" },
		{ from: "DestinationCity", default: "" },
		{ from: "DestinationState", default: "" },
		{ from: "DestinationZip", default: "" },
		{ from: "DirectionNotes", default: "" },
		{ from: "DestinationNotes", default: "" },
		{ from: "DestinationContact", default: "" },
		{ from: "DestinationContactPhone", default: "" },
		{ from: "DepartureNotes", default: "" },
		{ from: "NumberOfStudents", default: null },
		{ from: "NumberOfAdults", default: null },
		{ from: "NumberOfVehicles", default: null },
		{ from: "NumberOfWheelChairs", default: null },
		{ from: "EstimatedMiles", default: null },
		{ from: "EstimatedHours", default: null },
		{ from: "EstimatedCost", default: null },
		{ from: "ShowPublic", default: null },
		{ from: "PublicNotes", default: "" },
		{ from: "MileageRate", default: null },
		{ from: "FixedCost", default: null },
		{ from: "AideFixedCost", default: null },
		{ from: "DriverFixedCost", default: null },
		{ from: "VehFixedCost", default: null },
		{ from: "MinimumCost", default: null },
		{ from: "DriverRate", default: null },
		{ from: "DriverOtrate", default: null },
		{ from: "AideRate", default: null },
		{ from: "AideOtrate", default: null },
		{ from: "PurchaseOrder", default: "" },
		{ from: "FieldTripEquipmentId", default: null },
		{ from: "FieldTripDestinationId", default: null },
		{ from: "FieldTripContact", default: "" },
		{ from: "TemplateStatus", default: "" },
		{ from: "FieldTripName", default: "" },
		{ from: "InvoiceAmountType", default: null },
		{ from: "DestinationContactTitle", default: "" },
		{ from: "DestinationPhoneExt", default: "" },
		{ from: "DestinationFax", default: "" },
		{ from: "DestinationEmail", default: "" },
		{ from: "LastUpdated", default: "1970-01-01T00:00:00" },
		{ from: "LastUpdatedId", default: 0 },
		{ from: "LastUpdatedName", default: "" },
		{ from: "LastUpdatedType", default: 0 },
		{ from: "ContactPhone", default: "" },
		{ from: "ContactPhoneExt", default: "" },
		{ from: "ContactEmail", default: "" },

		{ from: "UserChar1", default: "" },
		{ from: "UserChar2", default: "" },
		{ from: "UserChar3", default: "" },
		{ from: "UserChar4", default: "" },
		{ from: "UserDate1", default: null },
		{ from: "UserDate2", default: null },
		{ from: "UserDate3", default: null },
		{ from: "UserDate4", default: null },
		{ from: "UserDate5", default: null },
		{ from: "UserDate6", default: null },
		{ from: "UserDate7", default: null },
		{ from: "UserDate8", default: null },
		{ from: "UserNum1", default: 0 },
		{ from: "UserNum2", default: 0 },
		{ from: "UserNum3", default: 0 },
		{ from: "UserNum4", default: 0 }
	];

})();

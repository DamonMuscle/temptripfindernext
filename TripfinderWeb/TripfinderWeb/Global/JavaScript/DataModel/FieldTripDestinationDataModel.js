(function()
{
	var namespace = window.createNamespace("TF.DataModel");

	namespace.FieldTripDestinationDataModel = function(fieldTripBillingClassificationEntity)
	{
		namespace.BaseDataModel.call(this, fieldTripBillingClassificationEntity);
	}

	namespace.FieldTripDestinationDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.FieldTripDestinationDataModel.prototype.constructor = namespace.FieldTripDestinationDataModel;

	namespace.FieldTripDestinationDataModel.prototype.mapping = [
		{ from: "Id", default: 0 },
		{ from: "Name", default: "" },
		{ from: "City", default: "" },
		{ from: "State", default: "" },
		{ from: "Zip", default: "" },
		{ from: "Contact", default: "" },
		{ from: "ContactTitle", default: "" },
		{ from: "Phone", default: "" },
		{ from: "PhoneExt", default: "" },
		{ from: "Notes", default: "" },
		{ from: "Street", default: "" },
		{ from: "Fax", default: "" },
		{ from: "Email", default: "" }
	];
})();
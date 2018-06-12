(function()
{
	var namespace = window.createNamespace("TF.DataModel");

	namespace.FieldTripEquipmentDataModel = function(fieldTripEquipmentEntity)
	{
		namespace.BaseDataModel.call(this, fieldTripEquipmentEntity);
	}

	namespace.FieldTripEquipmentDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.FieldTripEquipmentDataModel.prototype.constructor = namespace.FieldTripEquipmentDataModel;

	namespace.FieldTripEquipmentDataModel.prototype.mapping = [
		{ from: "Id", default: 0 },
		{ from: "EquipmentName", to: "name", default: "" },
		{ from: "EquipmentDescription", to: "description", default: "" }
	];
})();
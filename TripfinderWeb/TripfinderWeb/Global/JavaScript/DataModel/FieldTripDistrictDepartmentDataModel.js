(function()
{
	var namespace = window.createNamespace("TF.DataModel");

	namespace.FieldTripDistrictDepartmentDataModel = function(fieldTripDistrictDepartmentDataModel)
	{
		namespace.BaseDataModel.call(this, fieldTripDistrictDepartmentDataModel);
	}

	namespace.FieldTripDistrictDepartmentDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.FieldTripDistrictDepartmentDataModel.prototype.constructor = namespace.FieldTripDistrictDepartmentDataModel;

	namespace.FieldTripDistrictDepartmentDataModel.prototype.mapping = [
		{ from: "Id", default: 0 },
		{ from: "Name", default: "" },
		{ from: "Description", default: "" }
	];
})();
(function()
{
	var namespace = window.createNamespace("TF.DataModel");

	namespace.VehicleFuelTypeDataModel = function(vehicleFuelTypeDataModel)
	{
		namespace.BaseDataModel.call(this, vehicleFuelTypeDataModel);
	}

	namespace.VehicleFuelTypeDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.VehicleFuelTypeDataModel.prototype.constructor = namespace.VehicleFuelTypeDataModel;

	namespace.VehicleFuelTypeDataModel.prototype.mapping = [
		{ from: "Id", default: 0 },
		{ from: "Name", default: "" }
	];
})();
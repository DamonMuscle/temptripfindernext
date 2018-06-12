(function()
{
	var namespace = window.createNamespace("TF.DataModel");

	namespace.VehicleBrakeTypeDataModel = function(vehicleBrakeTypeDataModel)
	{
		namespace.BaseDataModel.call(this, vehicleBrakeTypeDataModel);
	}

	namespace.VehicleBrakeTypeDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.VehicleBrakeTypeDataModel.prototype.constructor = namespace.VehicleBrakeTypeDataModel;

	namespace.VehicleBrakeTypeDataModel.prototype.mapping = [
		{ from: "Id", default: 0 },
		{ from: "Name", default: "" }
	];
})();
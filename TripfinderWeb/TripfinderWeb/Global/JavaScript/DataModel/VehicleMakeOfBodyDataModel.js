(function()
{
	var namespace = window.createNamespace("TF.DataModel");

	namespace.VehicleMakeOfBodyDataModel = function(vehicleMakeOfBodyDataModel)
	{
		namespace.BaseDataModel.call(this, vehicleMakeOfBodyDataModel);
	}

	namespace.VehicleMakeOfBodyDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.VehicleMakeOfBodyDataModel.prototype.constructor = namespace.VehicleMakeOfBodyDataModel;

	namespace.VehicleMakeOfBodyDataModel.prototype.mapping = [
		{ from: "Id", default: 0 },
		{ from: "Name", default: "" }
	];
})();
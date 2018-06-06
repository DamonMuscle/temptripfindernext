(function()
{
	var namespace = window.createNamespace("TF.DataModel");

	namespace.VehicleMakeDataModel = function(vehicleMakeDataModel)
	{
		namespace.BaseDataModel.call(this, vehicleMakeDataModel);
	}

	namespace.VehicleMakeDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.VehicleMakeDataModel.prototype.constructor = namespace.VehicleMakeDataModel;

	namespace.VehicleMakeDataModel.prototype.mapping = [
		{ from: "Id", default: 0 },
		{ from: "Name", default: "" }
	];
})();
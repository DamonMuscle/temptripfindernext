(function()
{
	var namespace = window.createNamespace("TF.DataModel");

	namespace.VehicleModelDataModel = function(vehicleModelDataModel)
	{
		namespace.BaseDataModel.call(this, vehicleModelDataModel);
	}

	namespace.VehicleModelDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.VehicleModelDataModel.prototype.constructor = namespace.VehicleModelDataModel;

	namespace.VehicleModelDataModel.prototype.mapping = [
		{ from: "Id", default: 0 },
		{ from: "Name", default: "" }
	];
})();
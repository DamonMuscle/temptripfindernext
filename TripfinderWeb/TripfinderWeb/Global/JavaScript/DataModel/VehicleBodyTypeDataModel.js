(function()
{
	var namespace = window.createNamespace("TF.DataModel");

	namespace.VehicleBodyTypeDataModel = function(vehicleBodyTypeDataModel)
	{
		namespace.BaseDataModel.call(this, vehicleBodyTypeDataModel);
	}

	namespace.VehicleBodyTypeDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.VehicleBodyTypeDataModel.prototype.constructor = namespace.VehicleBodyTypeDataModel;

	namespace.VehicleBodyTypeDataModel.prototype.mapping = [
		{ from: "Id", default: 0 },
		{ from: "Name", default: "" }
	];
})();
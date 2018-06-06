(function()
{
	var namespace = window.createNamespace("TF.DataModel");

	namespace.VehicleCategoryDataModel = function(vehicleCategoryDataModel)
	{
		namespace.BaseDataModel.call(this, vehicleCategoryDataModel);
	}

	namespace.VehicleCategoryDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.VehicleCategoryDataModel.prototype.constructor = namespace.VehicleCategoryDataModel;

	namespace.VehicleCategoryDataModel.prototype.mapping = [
		{ from: "Id", default: 0 },
		{ from: "Name", default: "" }
	];
})();
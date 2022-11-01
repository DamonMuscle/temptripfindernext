(function()
{
	var namespace = window.createNamespace("TF.DataModel");

	namespace.FieldTripBillingClassificationDataModel = function(fieldTripBillingClassificationEntity)
	{
		namespace.BaseDataModel.call(this, fieldTripBillingClassificationEntity);
	}

	namespace.FieldTripBillingClassificationDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.FieldTripBillingClassificationDataModel.prototype.constructor = namespace.FieldTripBillingClassificationDataModel;

	namespace.FieldTripBillingClassificationDataModel.prototype.mapping = [
		{ from: "Id", default: 0 },
		{ from: "Name", default: "" },
		{ from: "FuelConsumptionRate", default: null, UnitOfMeasureSupported: true, UnitOfMeasureReverse: true },
		{ from: "FixedCost", default: null },
		{ from: "AideFixedCost", default: null },
		{ from: "DriverFixedCost", default: null },
		{ from: "VehFixedCost", default: null },
		{ from: "MinimumCost", default: null },
		{ from: "DriverRate", default: null },
		{ from: "DriverOTRate", default: null },
		{ from: "AideRate", default: null },
		{ from: "AideOTRate", default: null },
		{ from: "UsedForEstimates", default: false }
	];
})();
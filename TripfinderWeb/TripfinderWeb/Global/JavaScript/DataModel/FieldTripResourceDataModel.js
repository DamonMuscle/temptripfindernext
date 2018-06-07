(function()
{
	var namespace = window.createNamespace("TF.DataModel");

	namespace.FieldTripResourceDataModel = function(fieldTripResourceEntity)
	{
		namespace.BaseDataModel.call(this, fieldTripResourceEntity);
	}

	namespace.FieldTripResourceDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.FieldTripResourceDataModel.prototype.constructor = namespace.FieldTripResourceDataModel;

	namespace.FieldTripResourceDataModel.prototype.mapping = [
		{ from: "FieldTripId", default: 0 },
		{ from: "FieldTrip", default: "" },
		{ from: "Aide", default: "" },
		{ from: "AideFixedCost", default: 0 },
		{ from: "AideHours", default: 0 },
		{ from: "AideId", default: 0 },
		{ from: "AideOthours", default: 0 },
		{ from: "AideOtrate", default: 0 },
		{ from: "AideRate", default: 0 },
		{ from: "Chaperone", default: "" },
		{ from: "Chaperone2", default: "" },
		{ from: "Chaperone3", default: "" },
		{ from: "Chaperone4", default: "" },
		{ from: "Driver", default: "" },
		{ from: "DriverExpMeals", default: 0 },
		{ from: "DriverExpMisc", default: 0 },
		{ from: "DriverExpParking", default: 0 },
		{ from: "DriverExpTolls", default: 0 },
		{ from: "DriverFixedCost", default: 0 },
		{ from: "DriverHours", default: 0 },
		{ from: "DriverId", default: 0 },
		{ from: "DriverOthours", default: 0 },
		{ from: "DriverOtrate", default: 0 },
		{ from: "DriverRate", default: 0 },
		{ from: "Endingodometer", default: 0 },
		{ from: "FieldTripResourceGroupId", default: 0 },
		{ from: "MileageRate", default: 0 },
		{ from: "Startingodometer", default: 0 },
		{ from: "VehFixedCost", default: 0 },
		{ from: "Vehicle", default: "" },
		{ from: "VehicleId", default: 0 },
		{ from: "resourceId", default: 0 }
	];


})();
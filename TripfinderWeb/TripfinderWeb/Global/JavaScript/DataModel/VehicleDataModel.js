(function()
{
	var namespace = window.createNamespace("TF.DataModel");
	namespace.VehicleDataModel = function(vehicleEntity)
	{
		namespace.BaseDataModel.call(this, vehicleEntity);
		this.equipments = ko.observable("");
	}

	namespace.VehicleDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.VehicleDataModel.prototype.constructor = namespace.VehicleDataModel;

	namespace.VehicleDataModel.prototype.mapping = [
		{ "from": "AssetId", "default": "" },
		{ "from": "BodyType", "default": "" },
		{ "from": "BodyTypeId", "default": null },
		{ "from": "BrakeType", "default": "" },
		{ "from": "BrakeTypeId", "default": null },
		{ "from": "BusNum", "default": "" },
		{ "from": "Capacity", "default": null },
		{ "from": "CategoryIds", "default": null },
		{ "from": "CategoryNames", "default": null },
		{ "from": "Comments", "default": "" },
		{ "from": "ContractorId", "default": 0 },
		{ "from": "ContractorName", "default": null },
		{ "from": "Cost", "default": 0 },
		{ "from": "DBID", "default": function() { return tf.datasourceManager.databaseId; } },
		{ "from": "DBINFO", "default": null },
		{ "from": "EmmissInsp", "default": null },
		{ "from": "EquipmentCodes", "default": null },
		{ "from": "EquipmentIds", "default": [] },
		{ "from": "EstLife", "default": 0 },
		{ "from": "FuelCapacity", "default": null },
		{ "from": "FuelType", "default": "" },
		{ "from": "FuelTypeId", "default": null },
		{ "from": "Gpsid", "default": "" },
		{ "from": "Guid", "default": null },
		{ "from": "Height", "default": null },
		{ "from": "Id", "default": 0 },
		{ "from": "ImageBase64", "default": null },
		{ "from": "Inactive", "default": false },
		{ "from": "InspectionExp", "default": null },
		{ "from": "InsuranceExp", "default": null },
		{ "from": "InsuranceNum", "default": "" },
		{ "from": "LastUpdated", "default": "1970-01-01T00:00:00" },
		{ "from": "LastUpdatedId", "default": 0 },
		{ "from": "LastUpdatedType", "default": 0 },
		{ "from": "Length", "default": null },
		{ "from": "LicensePlate", "default": "" },
		{ "from": "LongName", "default": "" },
		{ "from": "MakeBody", "default": "" },
		{ "from": "MakeBodyId", "default": null },
		{ "from": "MakeChassis", "default": "" },
		{ "from": "MakeChassisId", "default": null },
		{ "from": "MaxWeight", "default": null },
		{ "from": "Model", "default": "" },
		{ "from": "ModelId", "default": null },
		{ "from": "FuelConsumption", "default": null },
		{ "from": "PurchaseDate", "default": null },
		{ "from": "PurchaseOdometer", "default": null },
		{ "from": "PurchasePrice", "default": null },
		{ "from": "RegisExp", "default": null },
		{ "from": "RegisNum", "default": "" },
		{ "from": "SalvageDate", "default": null },
		{ "from": "SalvageOdometer", "default": null },
		{ "from": "SalvageValue", "default": null },
		{ "from": "StateInspection", "default": "" },
		{ "from": "UserDefinedFields", "default": null },
		{ "from": "DocumentRelationships", "default": null },
		{ "from": "VehicleName", "default": null },
		{ "from": "Vin", "default": "" },
		{ "from": "WcCapacity", "default": null },
		{ "from": "Width", "default": null },
		{ "from": "YearMade", "default": null }
	];

})();

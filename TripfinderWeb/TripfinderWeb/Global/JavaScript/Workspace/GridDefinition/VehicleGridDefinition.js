(function()
{
	createNamespace("TF.GridDefinition").VehicleGridDefinition = VehicleGridDefinition;
	function VehicleGridDefinition()
	{
	}

	VehicleGridDefinition.prototype.gridDefinition = function()
	{
		return {
			Columns: [
				{
					FieldName: "BusNum",
					DisplayName: "Vehicle",
					DBName: "Bus_Num",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Vehicle
				},
				{
					FieldName: "Capacity",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "WcCapacity",
					DisplayName: "W/C Capacity",
					DBName: "WC_Capacity",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "Vin",
					DisplayName: "VIN",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "LicensePlate",
					DisplayName: "License Plate",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "YearMade",
					DisplayName: "Year Made",
					Width: '150px',
					TypeHint: 'integer',
					type: "number",
					format: "{0:####}"
				},
				{
					FieldName: "MakeBody",
					DisplayName: "Make Body",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("VehicleMakeBody", "vehicle", "MakeBody")
				},
				{
					FieldName: "MakeChassis",
					DisplayName: "Make Chassis",
					Width: '160px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("VehicleMake", "vehicle", "MakeChassis")
				},
				{
					FieldName: "Model",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("VehicleModel", "vehicle", "Model")
				},
				{
					FieldName: "BodyType",
					DisplayName: "Body Type",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("VehicleBodyType", "vehicle", "BodyType")
				},
				{
					FieldName: "BrakeType",
					DisplayName: "Brake Type",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("VehicleBrakeType", "vehicle", "BrakeType")
				},
				{
					FieldName: "PurchaseDate",
					DisplayName: "Purchase Date",
					Width: '160px',
					type: "date"
				},
				{
					FieldName: "AssetId",
					DisplayName: "Asset ID",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "Category",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("VehicleCategory", "vehicle", "Category")
				},
				{
					FieldName: "Cost",
					Width: '150px',
					type: "number",
					hidden: true,
					UnitOfMeasureReverse: true,
					UnitOfMeasureSupported: true
				},
				{
					FieldName: "EmmissInsp",
					DisplayName: "Emission Inspection",
					Width: '160px',
					type: "date",
					hidden: true
				},
				{
					FieldName: "EstLife",
					DisplayName: "Est Life (yrs)",
					Width: '150px',
					type: "number",
					hidden: true
				},
				{
					FieldName: "FuelType",
					DisplayName: "Fuel",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("VehicleFuelType", "vehicle", "FuelType")
				},
				{
					FieldName: "FuelCapacity",
					DisplayName: "Fuel Capacity",
					UnitOfMeasureSupported: true,
					UnitTypeOfMeasureSupported: tf.measurementUnitConverter.MeasurementUnitTypeEnum.GallonToLiter,
					Width: '150px',
					type: "number",
					hidden: true
				},
				{
					FieldName: "Gpsid",
					DisplayName: "GPS ID",
					Width: '160px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "Guid",
					DisplayName: "GUID",
					Width: '280px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "Height",
					Width: '150px',
					type: "number",
					UnitOfMeasureSupported: true,
					UnitTypeOfMeasureSupported: tf.measurementUnitConverter.MeasurementUnitTypeEnum.FootToMeter,
					hidden: true
				},
				{
					FieldName: "InActive",
					DisplayName: "Inactive",
					Width: '150px',
					type: "boolean",
					hidden: true,
					template: "<input type='checkbox' #: tf.georegionGridDefinition.gridDefinition().booleanToCheckboxFormatter(InActive)# onclick='return false' />"
				},
				{
					FieldName: "InsuranceNum",
					DisplayName: "Insurance #",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "InsuranceExp",
					DisplayName: "Insurance Expiration",
					Width: '160px',
					type: "date",
					hidden: true
				},
				{
					FieldName: "LastUpdatedName",
					DisplayName: "Last Updated By",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "LastUpdated",
					DisplayName: "Last Updated Date",
					Width: '160px',
					type: "date",
					hidden: true
				},
				{
					FieldName: "Length",
					Width: '150px',
					UnitOfMeasureSupported: true,
					UnitTypeOfMeasureSupported: tf.measurementUnitConverter.MeasurementUnitTypeEnum.FootToMeter,
					type: "number",
					hidden: true
				},
				{
					FieldName: "MaxWeight",
					DisplayName: "Max Weight",
					UnitOfMeasureSupported: true,
					UnitTypeOfMeasureSupported: tf.measurementUnitConverter.MeasurementUnitTypeEnum.PoundToKilogram,
					Width: '150px',
					type: "number",
					hidden: true
				},
				{
					FieldName: "FuelConsumption",
					DisplayName: `${tf.measurementUnitConverter.isImperial() ? "MPG" : "KM/L"}`,
					UnitOfMeasureSupported: true,
					UnitTypeOfMeasureSupported: tf.measurementUnitConverter.MeasurementUnitTypeEnum.MpgToKml,
					Width: '150px',
					type: "number",
					hidden: true
				},
				{
					FieldName: "LongName",
					DisplayName: "Name",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "Comments",
					DisplayName: "Notes",
					Width: '250px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "PurchaseOdometer",
					DisplayName: "Purchase Odometer",
					UnitOfMeasureSupported: true,
					Width: '150px',
					type: "number",
					hidden: true
				},
				{
					FieldName: "PurchasePrice",
					DisplayName: "Purchase Price",
					Width: '150px',
					type: "number",
					hidden: true
				},
				{
					FieldName: "RegisExp",
					DisplayName: "Registration Expiration",
					Width: '160px',
					type: "date",
					hidden: true
				},
				{
					FieldName: "RegisNum",
					DisplayName: "Registration Number",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "SalvageOdometer",
					DisplayName: "Salvage Odometer",
					UnitOfMeasureSupported: true,
					Width: '150px',
					type: "number",
					hidden: true
				},
				{
					FieldName: "SalvageValue",
					DisplayName: "Salvage Value",
					Width: '150px',
					type: "number",
					hidden: true
				},
				{
					FieldName: "SalvageDate",
					DisplayName: "Salvaged",
					Width: '160px',
					type: "date",
					hidden: true
				},
				{
					FieldName: "StateInspection",
					DisplayName: tf.localization.AreaName + " Inspection",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "InspectionExp",
					DisplayName: tf.localization.AreaName + " Inspection Expiration",
					Width: '160px',
					type: "date",
					hidden: true
				},
				{
					FieldName: "Width",
					Width: '150px',
					UnitOfMeasureSupported: true,
					UnitTypeOfMeasureSupported: tf.measurementUnitConverter.MeasurementUnitTypeEnum.FootToMeter,
					type: "number",
					hidden: true
				},
				{
					FieldName: "ContractorId",
					DBName: "Contractor_ID",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "SfEquipmentId",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "SIFChanged",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "Id",
					DBName: "vehicle_id",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "System1",
					Width: '150px',
					type: "string",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "System2",
					Width: '150px',
					type: "string",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "System3",
					Width: '150px',
					type: "string",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "System4",
					Width: '150px',
					type: "string",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "LastUpdatedId",
					DisplayName: "Last Updated Id",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "LastUpdatedType",
					DisplayName: "Last Updated Type",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				}
			].concat(tf.UDFDefinition.getAvailableWithCurrentDataSource("vehicle")),
			InvisibleUDFColumns: tf.UDFDefinition.getInvisibleUDFs("vehicle")
		};
	};

	tf.vehicleGridDefinition = new TF.GridDefinition.VehicleGridDefinition();
})();

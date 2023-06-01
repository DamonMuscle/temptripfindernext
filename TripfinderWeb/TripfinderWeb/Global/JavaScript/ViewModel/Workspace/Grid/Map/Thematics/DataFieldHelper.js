(function()
{
	createNamespace("TF.Map.Thematics").DataFieldHelper = DataFieldHelper;
	function DataFieldHelper()
	{
		var self = this;
		self.studentDataColumns = [
			{
				FieldName: "AidEligible",
				DisplayName: "Eligible for Aid",
				DBName: "aid_eligible",
				type: "boolean"
			},
			{
				FieldName: "AideReq",
				DisplayName: "Bus Aide Required",
				DBName: "aide_req",
				type: "boolean",
			},
			{
				FieldName: "Cohort",
				DisplayName: "Cohort",
				type: "string"
			},
			{
				FieldName: "Disabled",
				DBName: "disabled",
				type: "boolean"
			},
			{
				FieldName: "DisabilityCodes",
				DisplayName: "Disability Codes",
				DBName: "DisabilityCodes",
				type: "string"
			},
			{
				FieldName: "EthnicCode",
				DisplayName: "Ethnic Code",
				DBName: "EthnicCode",
				type: "string"
			},
			{
				FieldName: "District",
				DBName: "district",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.District.District2
			},
			{
				FieldName: "Dob",
				DisplayName: "Date of Birth",
				DBName: "dob",
				type: "date"
			},
			{
				FieldName: "Doguid",
				DBName: "DOGUID",
				type: "string"
			},
			{
				FieldName: "Dotransguid",
				DBName: "DOTRANSGUID",
				type: "string"
			},
			{
				FieldName: "EntryDate",
				DisplayName: "Entry Date",
				DBName: "entry_date",
				type: "datetime",
			},
			{
				FieldName: "FirstName",
				DisplayName: "First Name",
				DBName: "first_name",
				type: "string"
			},
			{
				FieldName: "GeoCity",
				DisplayName: "Geo City",
				DBName: "geo_city",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoCity2", "student", "GeoCity")
			},
			{
				FieldName: "GeoCounty",
				DisplayName: "Map Set",
				DBName: "geo_county",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("Mapset", "student", "GeoCounty")
			},
			{
				FieldName: "GeoStreet",
				DisplayName: "Geo Street",
				DBName: "geo_street",
				type: "string"
			},
			{
				FieldName: "GeoZip",
				DisplayName: "Geo " + tf.localization.Postal,
				DBName: "geo_zip",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoZipCode", "student", "GeoZip")
			},
			{
				FieldName: "GeoConfidence",
				DisplayName: "Geo Confidence",
				DBName: "geoConfidence",
				type: "integer"
			},
			{
				FieldName: "Grade",
				DBName: "grade",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Grades
			},
			{
				FieldName: "Guid",
				DisplayName: "GUID",
				DBName: "GUID",
				type: "string"
			},
			{
				FieldName: "InActive",
				DisplayName: "Inactive",
				DBName: "InActive",
				type: "boolean"
			},
			{
				FieldName: "IntGratChar1",
				DBName: "IntGratChar1",
				type: "string"
			},
			{
				FieldName: "IntGratChar2",
				DBName: "IntGratChar2",
				type: "string"
			},
			{
				FieldName: "IntGratDate1",
				DisplayName: "Integration Date",
				DBName: "IntGratDate1",
				type: "date"
			},
			{
				FieldName: "IntGratDate2",
				DBName: "IntGratDate2",
				type: "date"
			},
			{
				FieldName: "IntGratNum1",
				DBName: "IntGratNum1",
				type: "number"
			},
			{
				FieldName: "IntGratNum2",
				DBName: "IntGratNum2",
				type: "number"
			},
			{
				FieldName: "LastName",
				DisplayName: "Last Name",
				DBName: "last_name",
				type: "string"
			},
			{
				FieldName: "LastUpdated",
				DisplayName: "Last Updated Date",
				DBName: "LastUpdated",
				dbType: "datetime",
				type: "date",
				isUTC: true,
			},
			{
				FieldName: "LastUpdatedId",
				DisplayName: "Last Updated Id",
				DBName: "LastUpdatedId",
				type: "integer"
			},
			{
				FieldName: "LastUpdatedName",
				DisplayName: "Last Updated By",
				DBName: "LastUpdatedName",
				type: "string"
			},
			{
				FieldName: "LastUpdatedType",
				DisplayName: "Last Updated Type",
				DBName: "LastUpdatedType",
				type: "integer"
			},
			{
				FieldName: "LoadTime",
				DBName: "LoadTime",
				type: "integer",
			},
			{
				FieldName: "LoadTimeManuallyChanged",
				DisplayName: "Load Time Adjusted",
				DBName: "LoadTimeManuallyChanged",
				type: "boolean",
			},
			{
				FieldName: "LocalId",
				DisplayName: "Local ID",
				DBName: "local_id",
				type: "string"
			},
			{
				FieldName: "Locked",
				DisplayName: "Locked For Import",
				DBName: "locked",
				type: "boolean"
			},
			{
				FieldName: "MailCity",
				DisplayName: "Mail City",
				DBName: "mail_City",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingCity", "student", "MailCity")
			},
			{
				FieldName: "MailState",
				DisplayName: "Mail " + tf.localization.AreaName,
				DBName: "mail_State",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingState", "student", "MailState")
			},
			{
				FieldName: "MailStreet1",
				DisplayName: "Mail Street #1",
				DBName: "mail_Street1",
				type: "string"
			},
			{
				FieldName: "MailStreet2",
				DisplayName: "Mail Street #2",
				DBName: "mail_Street2",
				type: "string"
			},
			{
				FieldName: "MailZip",
				DisplayName: "Mail " + tf.localization.Postal,
				DBName: "mail_zip",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingZipCode", "student", "MailZip")
			},
			{
				FieldName: "Mi",
				DisplayName: "Middle Initial",
				DBName: "mi",
				type: "string"
			},
			{
				FieldName: "DistanceFromResidSch",
				DisplayName: "Distance From School of Residence",
				UnitOfMeasureSupported: true,
				DBName: "DistanceFromResidSch",
				type: "number"
			},
			{
				FieldName: "DistanceFromSchl",
				DisplayName: "Distance From School of Attendance",
				UnitOfMeasureSupported: true,
				DBName: "DistanceFromSchl",
				type: "number"
			},
			{
				FieldName: "PreRedistSchool",
				DisplayName: "PreRedistricting School of Attendance",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School
			},
			{
				FieldName: "Priorschool",
				DisplayName: "Prior School of Attendance",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School
			},
			{
				FieldName: "Puguid",
				type: "string",
			},
			{
				FieldName: "Putransguid",
				type: "string",
			},
			{
				FieldName: "ResidSchool",
				DisplayName: "School of Residence Code",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School.SchoolCode
			},
			{
				FieldName: "School",
				DisplayName: "School of Attendance Code",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School.SchoolCode
			},
			{
				FieldName: "Gender",
				DisplayName: "Gender",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Gender
			},
			{
				FieldName: "Id",
				DBName: "stud_id",
				type: "integer",
			},
			{
				FieldName: "TagId",
				DisplayName: "Card ID",
				type: "string",
			},
			{
				FieldName: "Transported",
				DisplayName: "Eligible for Transport",
				type: "boolean",
			},
			{
				FieldName: "Xcoord",
				DisplayName: "X Coord",
				type: "number",
				Precision: 6
			},
			{
				FieldName: "Ycoord",
				DisplayName: "Y Coord",
				type: "number",
				Precision: 6
			}];

		/**************************************************************************************************************************************/

		self.unassignedStudentDataColumns = [
			{
				FieldName: "AidEligible",
				DisplayName: "Eligible for Aid",
				DBName: "aid_eligible",
				type: "boolean"
			},
			{
				FieldName: "AideReq",
				DisplayName: "Bus Aide Required",
				DBName: "aide_req",
				type: "boolean",
			},
			{
				FieldName: "Cohort",
				DisplayName: "Cohort",
				type: "string"
			},
			{
				FieldName: "Disabled",
				DBName: "disabled",
				type: "boolean"
			},
			{
				FieldName: "DisabililityCode",
				DisplayName: "Disability Code",
				DBName: "DisabililityCode",
				type: "string"
			},
			{
				FieldName: "EthnicCode",
				DisplayName: "Ethnic Code",
				DBName: "EthnicCode",
				type: "string"
			},
			{
				FieldName: "District",
				DBName: "district",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.District.District2
			},
			{
				FieldName: "Dob",
				DisplayName: "Date of Birth",
				DBName: "dob",
				type: "date"
			},
			{
				FieldName: "Doguid",
				DBName: "DOGUID",
				type: "string"
			},
			{
				FieldName: "Dotransguid",
				DBName: "DOTRANSGUID",
				type: "string"
			},
			{
				FieldName: "Email",
				DBName: "email",
				type: "string"
			},
			{
				FieldName: "EmerEmail1",
				DisplayName: "Emergency Email #1",
				DBName: "emer_email1",
				type: "string"
			},
			{
				FieldName: "EmerEmail2",
				DisplayName: "Emergency Email #2",
				DBName: "emer_email2",
				type: "string"
			},
			{
				FieldName: "EmerName1",
				DisplayName: "Emergency Name #1",
				DBName: "emer_name1",
				type: "string",
			},
			{
				FieldName: "EmerName2",
				DisplayName: "Emergency Name #2",
				DBName: "emer_name2",
				type: "string",
			},
			{
				FieldName: "EmerPhone1",
				DisplayName: "Emergency Phone #1",
				DBName: "emer_Phone1",
				type: "string"
			},
			{
				FieldName: "EmerPhone1Ext",
				DisplayName: "Emergency Phone Ext. #1",
				DBName: "emer_Phone1_Ext",
				type: "string",
			},
			{
				FieldName: "EmerPhone2",
				DisplayName: "Emergency Phone #2",
				DBName: "emer_Phone2",
				type: "string"
			},
			{
				FieldName: "EmerPhone2Ext",
				DisplayName: "Emergency Phone Ext. #2",
				DBName: "emer_Phone2_Ext",
				type: "string"
			},
			{
				FieldName: "EntryDate",
				DisplayName: "Entry Date",
				DBName: "entry_date",
				type: "datetime",
			},
			{
				FieldName: "FirstName",
				DisplayName: "First Name",
				DBName: "first_name",
				type: "string"
			},
			{
				FieldName: "GeoCity",
				DisplayName: "Geo City",
				DBName: "geo_city",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoCity2", "student", "GeoCity")
			},
			{
				FieldName: "GeoCounty",
				DisplayName: "Map Set",
				DBName: "geo_county",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("Mapset", "student", "GeoCounty")
			},
			{
				FieldName: "GeoStreet",
				DisplayName: "Geo Street",
				DBName: "geo_street",
				type: "string"
			},
			{
				FieldName: "GeoZip",
				DisplayName: "Geo " + tf.localization.Postal,
				DBName: "geo_zip",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoZipCode", "student", "GeoZip")
			},
			{
				FieldName: "GeoConfidence",
				DisplayName: "Geo Confidence",
				DBName: "geoConfidence",
				type: "integer"
			},
			{
				FieldName: "Grade",
				DBName: "grade",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Grades
			},
			{
				FieldName: "Guardian",
				DBName: "guardian",
				type: "string"
			},
			{
				FieldName: "Guid",
				DisplayName: "GUID",
				DBName: "GUID",
				type: "string"
			},
			{
				FieldName: "InActive",
				DisplayName: "Inactive",
				DBName: "InActive",
				type: "boolean"
			},
			{
				FieldName: "IntGratChar1",
				DBName: "IntGratChar1",
				type: "string"
			},
			{
				FieldName: "IntGratChar2",
				DBName: "IntGratChar2",
				type: "string"
			},
			{
				FieldName: "IntGratDate1",
				DisplayName: "Integration Date",
				DBName: "IntGratDate1",
				type: "date"
			},
			{
				FieldName: "IntGratDate2",
				DBName: "IntGratDate2",
				type: "date"
			},
			{
				FieldName: "IntGratNum1",
				DBName: "IntGratNum1",
				type: "number"
			},
			{
				FieldName: "IntGratNum2",
				DBName: "IntGratNum2",
				type: "number"
			},
			{
				FieldName: "LastName",
				DisplayName: "Last Name",
				DBName: "last_name",
				type: "string"
			},
			{
				FieldName: "LastUpdated",
				DisplayName: "Last Updated Date",
				DBName: "LastUpdated",
				type: "date"
			},
			{
				FieldName: "LastUpdatedId",
				DisplayName: "Last Updated Id",
				DBName: "LastUpdatedId",
				type: "integer"
			},
			{
				FieldName: "LastUpdatedName",
				DisplayName: "Last Updated By",
				DBName: "LastUpdatedName",
				type: "string"
			},
			{
				FieldName: "LastUpdatedType",
				DisplayName: "Last Updated Type",
				DBName: "LastUpdatedType",
				type: "integer"
			},
			{
				FieldName: "LoadTime",
				DBName: "LoadTime",
				type: "integer",
			},
			{
				FieldName: "LoadTimeManuallyChanged",
				DisplayName: "Load Time Adjusted",
				DBName: "LoadTimeManuallyChanged",
				type: "boolean",
			},
			{
				FieldName: "LocalId",
				DisplayName: "Local ID",
				DBName: "local_id",
				type: "string"
			},
			{
				FieldName: "MailCity",
				DisplayName: "Mail City",
				DBName: "mail_City",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingCity", "student", "MailCity")
			},
			{
				FieldName: "MailState",
				DisplayName: "Mail " + tf.localization.AreaName,
				DBName: "mail_State",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingState", "student", "MailState")
			},
			{
				FieldName: "MailStreet1",
				DisplayName: "Mail Street #1",
				DBName: "mail_Street1",
				type: "string"
			},
			{
				FieldName: "MailStreet2",
				DisplayName: "Mail Street #2",
				DBName: "mail_Street2",
				type: "string"
			},
			{
				FieldName: "MailZip",
				DisplayName: "Mail " + tf.localization.Postal,
				DBName: "mail_zip",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingZipCode", "student", "MailZip")
			},
			{
				FieldName: "Mi",
				DisplayName: "Middle Initial",
				DBName: "mi",
				type: "string"
			},
			{
				FieldName: "DistanceFromResidSch",
				DisplayName: "Distance From School of Residence",
				UnitOfMeasureSupported: true,
				DBName: "DistanceFromResidSch",
				type: "number"
			},
			{
				FieldName: "DistanceFromSchl",
				DisplayName: "Distance From School of Attendance",
				UnitOfMeasureSupported: true,
				DBName: "DistanceFromSchl",
				type: "number"
			},
			{
				FieldName: "PreRedistSchool",
				DisplayName: "PreRedistricting School of Attendance",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School
			},
			{
				FieldName: "Priorschool",
				DisplayName: "Prior School of Attendance",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School
			},
			{
				FieldName: "ProhibitCross",
				DisplayName: "ProhibitCross",
				type: "boolean"
			},
			{
				FieldName: "Puguid",
				type: "string",
			},
			{
				FieldName: "Putransguid",
				type: "string",
			},
			{
				FieldName: "ResidSchool",
				DisplayName: "School of Residence Code",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School.SchoolCode
			},
			{
				FieldName: "School",
				DisplayName: "School of Attendance Code",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School.SchoolCode
			},
			{
				FieldName: "Gender",
				DisplayName: "Gender",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Gender
			},
			{
				FieldName: "Sifchanged",
				DisplayName: "SIF Changed",
				type: "integer",
			},
			{
				FieldName: "Id",
				DBName: "stud_id",
				type: "integer",
			},
			{
				FieldName: "System1",
				type: "string",
			},
			{
				FieldName: "System2",
				type: "string",
			},
			{
				FieldName: "System3",
				type: "string",
			},
			{
				FieldName: "System4",
				type: "string",
			},
			{
				FieldName: "TagId",
				DisplayName: "Card ID",
				type: "string",
			},
			{
				FieldName: "Transported",
				DisplayName: "Eligible for Transport",
				type: "boolean",
			},
			{
				FieldName: "Xcoord",
				DisplayName: "X Coord",
				type: "number",
				Precision: 6
			},
			{
				FieldName: "Ycoord",
				DisplayName: "Y Coord",
				type: "number",
				Precision: 6
			}];

		/**************************************************************************************************************************************/
		self.vehicleDataColumns = [
			{
				FieldName: "Id",
				DBName: "vehicle_id",
				type: "integer"
			},
			{
				FieldName: "BusNum",
				DisplayName: "Vehicle",
				DBName: "Bus_Num",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Vehicle
			},
			{
				FieldName: "Capacity",
				DBName: "Capacity",
				type: "integer"
			},
			{
				FieldName: "Comments",
				DisplayName: "Notes",
				DBName: "Comments",
				type: "string"
			},
			{
				FieldName: "ContractorId",
				DBName: "Contractor_ID",
				type: "integer"
			},
			{
				FieldName: "WcCapacity",
				DisplayName: "W/C Capacity",
				DBName: "WC_Capacity",
				type: "integer"
			},
			{
				FieldName: "RegisExp",
				DisplayName: "Registration Expiration",
				DBName: "RegisExp",
				type: "date"
			},
			{
				FieldName: "RegisNum",
				DisplayName: "Registration Number",
				DBName: "RegisNum",
				type: "string"
			},
			{
				FieldName: "Vin",
				DisplayName: "VIN",
				DBName: "VIN",
				type: "string"
			},
			{
				FieldName: "MakeChassis",
				DisplayName: "Make Chassis",
				DBName: "MakeChassis",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("VehicleMake", "vehicle", "MakeChassis")
			},
			{
				FieldName: "Model",
				DBName: "Model",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("VehicleModel", "vehicle", "Model")
			},
			{
				FieldName: "YearMade",
				DisplayName: "Year Made",
				DBName: "YearMade",
				type: 'integer'
			},
			{
				FieldName: "MakeBody",
				DisplayName: "Make Body",
				DBName: "MakeBody",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("VehicleMakeBody", "vehicle", "MakeBody")
			},
			{
				FieldName: "InsuranceNum",
				DisplayName: "Insurance #",
				DBName: "InsuranceNum",
				type: "string"
			},
			{
				FieldName: "InsuranceExp",
				DisplayName: "Insurance Expiration",
				DBName: "InsuranceExp",
				type: "date"
			},
			{
				FieldName: "StateInspection",
				DisplayName: "State Inspection",
				DBName: "StateInspection",
				type: "string"
			},
			{
				FieldName: "InspectionExp",
				DisplayName: "State Inspection Expiration",
				DBName: "InspectionExp",
				type: "date"
			},
			{
				FieldName: "BrakeType",
				DisplayName: "Brake Type",
				DBName: "BrakeType",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("VehicleBrakeType", "vehicle", "BrakeType")
			},
			{
				FieldName: "FuelType",
				DisplayName: "Fuel",
				DBName: "FuelType",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("VehicleFuelType", "vehicle", "FuelType")
			},
			{
				FieldName: "PurchaseDate",
				DisplayName: "Purchase Date",
				DBName: "PurchaseDate",
				type: "date"
			},
			{
				FieldName: "PurchasePrice",
				DisplayName: "Purchase Price",
				DBName: "PurchasePrice",
				type: "number"
			},
			{
				FieldName: "LicensePlate",
				DisplayName: "License Plate",
				DBName: "LicensePlate",
				type: "string"
			},
			{
				FieldName: "BodyType",
				DisplayName: "Body Type",
				DBName: "BodyType",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("VehicleBodyType", "vehicle", "BodyType")
			},
			{
				FieldName: "Cost",
				DBName: "Cost",
				type: "number",
				UnitOfMeasureSupported: true,
				UnitOfMeasureReverse: true
			},
			{
				FieldName: "EmmissInsp",
				DisplayName: "Emission Inspection",
				DBName: "EmmissInsp",
				type: "date"
			},
			{
				FieldName: "LastUpdated",
				DisplayName: "Last Updated Date",
				DBName: "LastUpdated",
				dbType: "datetime",
				type: "date",
				isUTC: true,
			},
			{
				FieldName: "LastUpdatedId",
				DisplayName: "Last Updated Id",
				DBName: "LastUpdatedId",
				type: "integer"
			},
			{
				FieldName: "LastUpdatedName",
				DisplayName: "Last Updated By",
				DBName: "LastUpdatedName",
				type: "string"
			},
			{
				FieldName: "LastUpdatedType",
				DisplayName: "Last Updated Type",
				DBName: "LastUpdatedType",
				type: "integer"
			},
			{
				FieldName: "Guid",
				DisplayName: "GUID",
				DBName: "GUID",
				type: "string"
			},
			{
				FieldName: "Gpsid",
				DisplayName: "GPSID",
				DBName: "GPSID",
				type: "string"
			},
			{
				FieldName: "FuelConsumption",
				DisplayName: `${tf.measurementUnitConverter.isImperial() ? "MPG" : "KM/L"}`,
				UnitOfMeasureSupported: true,
				UnitTypeOfMeasureSupported: tf.measurementUnitConverter.MeasurementUnitTypeEnum.MpgToKml,
				DBName: "FuelConsumption",
				type: "number"
			},
			{
				FieldName: "EstLife",
				DisplayName: "Est Life (yrs)",
				DBName: "EstLife",
				type: "number"
			},
			{
				FieldName: "PurchaseOdometer",
				DisplayName: "Purchase Odometer",
				UnitOfMeasureSupported: true,
				DBName: "PurchaseOdometer",
				type: "number"
			},


			{
				FieldName: "SalvageOdometer",
				DisplayName: "Salvage Odometer",
				UnitOfMeasureSupported: true,
				DBName: "SalvageOdometer",
				type: "number"
			},
			{
				FieldName: "SalvageValue",
				DisplayName: "Salvage Value",
				DBName: "SalvageValue",
				type: "number"
			},
			{
				FieldName: "SalvageDate",
				DisplayName: "Salvaged",
				DBName: "SalvageDate",
				type: "date"
			},
			{
				FieldName: "Height",
				DBName: "Height",
				UnitOfMeasureSupported: true,
				UnitTypeOfMeasureSupported: tf.measurementUnitConverter.MeasurementUnitTypeEnum.FootToMeter,
				type: "number"
			},
			{
				FieldName: "Length",
				UnitOfMeasureSupported: true,
				UnitTypeOfMeasureSupported: tf.measurementUnitConverter.MeasurementUnitTypeEnum.FootToMeter,
				DBName: "length",
				type: "number"
			},
			{
				FieldName: "MaxWeight",
				DisplayName: "Max Weight",
				UnitOfMeasureSupported: true,
				UnitTypeOfMeasureSupported: tf.measurementUnitConverter.MeasurementUnitTypeEnum.PoundToKilogram,
				DBName: "MaxWeight",
				type: "number"
			},

			{
				FieldName: "LongName",
				DisplayName: "Name",
				DBName: "LongName",
				type: "string"
			},
			{
				FieldName: "AssetId",
				DisplayName: "Asset ID",
				DBName: "AssetId",
				type: "string"
			},
			{
				FieldName: "InActive",
				DisplayName: "Inactive",
				DBName: "InActive",
				type: "boolean"
			},
			{
				FieldName: "FuelCapacity",
				DisplayName: "Fuel Capacity",
				UnitOfMeasureSupported: true,
				UnitTypeOfMeasureSupported: tf.measurementUnitConverter.MeasurementUnitTypeEnum.GallonToLiter,
				DBName: "FuelCapacity",
				type: "number"
			},
			{
				FieldName: "Category",
				DBName: "Category",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("VehicleCategory", "vehicle", "Category")
			},
			{
				FieldName: "Width",
				DBName: "Width",
				UnitOfMeasureSupported: true,
				UnitTypeOfMeasureSupported: tf.measurementUnitConverter.MeasurementUnitTypeEnum.FootToMeter,
				type: "number"
			},];

		/**************************************************************************************************************************************/
		self.tripDataColumns = [
			{
				FieldName: "Id",
				DBName: "trip_id",
				type: "integer"
			}, {
				FieldName: "Name",
				DisplayName: "Name",
				DBName: "Name",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Trip
			}, {
				FieldName: "AideId",
				DBName: "Aide_ID",
				type: "integer"
			}, {
				FieldName: "BusAide",
				DisplayName: "Aide Required",
				DBName: "Bus_Aide",
				type: "boolean"
			}, {
				FieldName: "Days",
				DBName: "Days",
				type: "string"
			}, {
				FieldName: "Description",
				DisplayName: "Description",
				DBName: "Description",
				type: "string"
			}, {
				FieldName: "Disabled",
				DisplayName: "Disabled Students",
				DBName: "Disabled",
				type: "boolean"
			}, {
				FieldName: "Distance",
				DisplayName: "Distance",
				UnitOfMeasureSupported: true,
				DBName: "Distance",
				type: "number",
			}, {
				FieldName: "DriverId",
				DBName: "Driver_ID",
				type: "integer"
			}, {
				FieldName: "FilterName",
				DisplayName: "Filter Name",
				type: "string"
			}, {
				FieldName: "NonDisabled",
				DisplayName: "Non-Disabled Students",
				DBName: "NonDisabled",
				type: "boolean"
			}, {
				FieldName: "Schools",
				DBName: "Schools",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School.SchoolCode
			}, {
				FieldName: "SessionName",
				DisplayName: "Trip Session",
				DBName: "SessionName",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.TripType
			},
			{
				FieldName: "VehicleId",
				DBName: "Vehicle_ID",
				type: "integer"
			}, {
				FieldName: "HomeSchl",
				DisplayName: "Home To School",
				DBName: "HomeSchl",
				type: "boolean"
			}, {
				FieldName: "HomeTrans",
				DisplayName: "Home To Transfer",
				DBName: "HomeTrans",
				type: "boolean"
			}, {
				FieldName: "Shuttle",
				DisplayName: "Transfer",
				DBName: "Shuttle",
				type: "boolean"
			}, {
				FieldName: "Comments",
				DisplayName: "Notes",
				DBName: "comments",
				type: "string"
			}, {
				FieldName: "NumTransport",
				DisplayName: "Number Assigned",
				DBName: "NumTransport",
				type: "integer"
			}, {
				FieldName: "MaxOnBus",
				DisplayName: "Max On Bus",
				DBName: "MaxOnBus",
				type: "integer"
			}, {
				FieldName: "StartTime",
				DisplayName: "Start Time",
				DBName: "StartTime",
				type: "time"
			}, {
				FieldName: "FinishTime",
				DisplayName: "Finish Time",
				DBName: "FinishTime",
				type: "time"
			}, {
				FieldName: "TripAlias",
				DisplayName: "Alias",
				DBName: "TripAlias",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsTripAlias", "trip", "TripAlias")
			}, {
				FieldName: "IntGratNum1",
				DBName: "IntGratNum1",
				type: "number"
			}, {
				FieldName: "IntGratNum2",
				DBName: "IntGratNum2",
				type: "number"
			}, {
				FieldName: "IntGratChar1",
				DBName: "IntGratChar1",
				type: "string"
			}, {
				FieldName: "IntGratChar2",
				DBName: "IntGratChar2",
				type: "string"
			}, {
				FieldName: "IntGratDate1",
				DBName: "IntGratDate1",
				type: "date"
			}, {
				FieldName: "IntGratDate2",
				DBName: "IntGratDate2",
				type: "date"
			}, {
				FieldName: "Cost",
				DisplayName: "Cost",
				DBName: "Cost",
				type: "number"
			}, {
				FieldName: "LastUpdated",
				DisplayName: "Last Updated Date",
				DBName: "LastUpdated",
				dbType: "datetime",
				type: "date",
				isUTC: true,
			}, {
				FieldName: "LastUpdatedId",
				DisplayName: "Last Updated Id",
				DBName: "LastUpdatedId",
				type: "integer"
			}, {
				FieldName: "LastUpdatedName",
				DisplayName: "Last Updated By",
				DBName: "LastUpdatedName",
				type: "string"
			}, {
				FieldName: "LastUpdatedType",
				DisplayName: "Last Updated Type",
				DBName: "LastUpdatedType",
				type: "integer"
			}, {
				FieldName: "IShow",
				DisplayName: "Infofinder i Visible",
				DBName: "I_Show",
				type: "boolean"
			}, {
				FieldName: "IName",
				DisplayName: "Infofinder i Display Name",
				DBName: "I_Name",
				type: "string"
			}, {
				FieldName: "IDescription",
				DisplayName: "Infofinder i Description",
				DBName: "I_Description",
				type: "string"
			}, {
				FieldName: "Dhdistance",
				DisplayName: "Deadhead Distance",
				UnitOfMeasureSupported: true,
				DBName: "Dhdistance",
				type: "number",
			}, {
				FieldName: "Guid",
				DisplayName: "GUID",
				DBName: "GUID",
				type: "string"
			}, {
				FieldName: "FilterSpec",
				DisplayName: "Filter Spec",
				DBName: "FilterSpec",
				type: "string"
			}, {
				FieldName: "GpsenabledFlag",
				DisplayName: "Busfinder Enabled",
				DBName: "GpsenabledFlag",
				type: "boolean"
			}, {
				FieldName: "ActivityTrip",
				DisplayName: "Activity Trip",
				DBName: "ActivityTrip",
				type: "boolean"
			}];



		/**************************************************************************************************************************************/
		self.tripStopDataColumns = [
			{
				FieldName: "ApproachXcoord",
				DBName: "ApproachXCoord",
				type: "number"
			}, {
				FieldName: "ApproachYcoord",
				DBName: "ApproachYCoord",
				type: "number"
			}, {
				FieldName: "AvgSpeed",
				DBName: "AvgSpeed",
				UnitOfMeasureSupported: true,
				type: "number"
			}, {
				FieldName: "BdyType",
				DisplayName: "Body Type",
				DBName: "Bdy_Type",
				type: "integer"
			}, {
				FieldName: "City",
				DisplayName: "City",
				DBName: "City",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoCity", "tripstop", "City")
			}, {
				FieldName: "Comment",
				DisplayName: "Notes",
				DBName: "Comment",
				type: "string"
			}, {
				FieldName: "Distance",
				DisplayName: "Distance to Next Stop",
				UnitOfMeasureSupported: true,
				DBName: "Distance",
				type: "number"
			}, {
				FieldName: "Guid",
				DBName: "GUID",
				type: "string"
			}, {
				FieldName: "LastUpdated",
				DisplayName: "Last Updated Date",
				DBName: "LastUpdated",
				dbType: "datetime",
				type: "date",
				isUTC: true,
			}, {
				FieldName: "LastUpdatedId",
				DisplayName: "Last Updated Id",
				DBName: "LastUpdatedId",
				type: "integer"
			}, {
				FieldName: "LastUpdatedName",
				DisplayName: "Last Updated By",
				DBName: "LastUpdatedName",
				type: "string"
			}, {
				FieldName: "LastUpdatedType",
				DisplayName: "Last Updated Type",
				DBName: "LastUpdatedType",
				type: "integer"
			}, {
				FieldName: "NumDoshut",
				DBName: "NumDOShut",
				type: "integer"
			}, {
				FieldName: "NumPushut",
				DBName: "NumPUShut",
				type: "integer"
			}, {
				FieldName: "NumStuds",
				DisplayName: "# Students",
				DBName: "NumStuds",
				type: "integer"
			}, {
				FieldName: "NumTrans",
				DBName: "NumTrans",
				type: "integer"
			}, {
				FieldName: "SchlCode",
				DisplayName: "School Code",
				DBName: "SchlCode",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School.SchoolCode
			}, {
				FieldName: "Sequence",
				DisplayName: "Sequence",
				DBName: "Sequence",
				type: "integer"
			}, {
				FieldName: "StopTime",
				DisplayName: "Stop Time",
				DBName: "StopTime",
				type: "time"
			}, {
				FieldName: "Street",
				DisplayName: "Street",
				DBName: "Street",
				type: "string"
			}, {
				FieldName: "TotalStopTime",
				DBName: "TotalStopTime",
				type: "integer"
			}, {
				FieldName: "TotalStopTimeManualChanged",
				DisplayName: "Total Time Adjusted",
				DBName: "TotalStopTimeManualChanged",
				type: "boolean"
			}, {
				FieldName: "TripId",
				DBName: "Trip_Id",
				type: "integer"
			}, {
				FieldName: "Id",
				DBName: "tripstopid",
				type: "integer"
			}, {
				FieldName: "Xcoord",
				DisplayName: "X Coord",
				DBName: "XCoord",
				type: "number",
				Precision: 6
			}, {
				FieldName: "Xstop",
				DBName: "XStop",
				type: "boolean"
			}, {
				FieldName: "Ycoord",
				DisplayName: "Y Coord",
				DBName: "YCoord",
				type: "number",
				Precision: 6
			}];
		/**************************************************************************************************************************************/
		self.staffDataColumns = [
			{
				FieldName: "Id",
				DBName: "StaffID",
				type: "integer"
			},
			{
				FieldName: "LastName",
				DisplayName: "Last Name",
				DBName: "LastName",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Staff.LastName
			}, {
				FieldName: "FirstName",
				DisplayName: "First Name",
				DBName: "FirstName",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Staff.FirstName
			}, {
				FieldName: "MiddleName",
				DisplayName: "MI",
				DBName: "MiddleName",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Staff.MiddleName
			}, {
				FieldName: "StaffGuid",
				DisplayName: "GUID",
				DBName: "StaffGUID",
				type: "string"
			}, {
				FieldName: "StaffLocalId",
				DisplayName: "Local ID",
				DBName: "StaffLocalID",
				type: "string"
			}, {
				FieldName: "ActiveFlag",
				DisplayName: "Active",
				DBName: "ActiveFlag",
				type: "boolean"
			}, {
				FieldName: "InactiveDate",
				DisplayName: "Date Inactive",
				DBName: "InactiveDate",
				type: "date"
			}, {
				FieldName: "ContractorId",
				DBName: "ContractorID",
				type: "integer"
			}, {
				FieldName: "Email",
				DisplayName: "Email",
				DBName: "Email",
				type: "string"
			}, {
				FieldName: "MailStreet1",
				DisplayName: "Mail Street #1",
				DBName: "MailStreet1",
				type: "string"
			}, {
				FieldName: "MailStreet2",
				DisplayName: "Mail Street #2",
				DBName: "MailStreet2",
				type: "string"
			}, {
				FieldName: "MailCity",
				DisplayName: "Mail City",
				DBName: "MailCity",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingCity", "staff", "MailCity")
			}, {
				FieldName: "MailCounty",
				DisplayName: "Mail County",
				DBName: "MailCounty",
				type: "string"
			}, {
				FieldName: "MailState",
				DisplayName: "Mail State/Province",
				DBName: "MailState",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingState", "staff", "MailState")
			}, {
				FieldName: "MailZip",
				DisplayName: "Mail Postal Code",
				DBName: "MailZip",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingZipCode", "staff", "MailZip")
			}, {
				FieldName: "HomePhone",
				DisplayName: "Home Phone",
				DBName: "HomePhone",
				type: "string"
			}, {
				FieldName: "WorkPhone",
				DisplayName: "Work Phone",
				DBName: "WorkPhone",
				type: "boolean"
			}, {
				FieldName: "CellPhone",
				DisplayName: "Cell Phone",
				DBName: "CellPhone",
				type: "string"
			}, {
				FieldName: "LicenseNumber",
				DisplayName: "License #",
				DBName: "LicenseNumber",
				type: "string"
			}, {
				FieldName: "LicenseState",
				DisplayName: "License State",
				DBName: "LicenseState",
				type: "string"
			}, {
				FieldName: "LicenseExpiration",
				DisplayName: "License Expiration",
				DBName: "LicenseExpiration",
				type: "date"
			}, {
				FieldName: "LicenseClass",
				DisplayName: "License Class",
				DBName: "LicenseClass",
				type: "string"
			}, {
				FieldName: "LicenseEndorsements",
				DisplayName: "License Endorsements",
				DBName: "LicenseEndorsements",
				type: "string"
			}, {
				FieldName: "LicenseRestrictions",
				DisplayName: "License Restrictions",
				DBName: "LicenseRestrictions",
				type: "string"
			}, {
				FieldName: "DateOfBirth",
				DisplayName: "Date of Birth",
				DBName: "DateOfBirth",
				type: "date"
			}, {
				FieldName: "Gender",
				DisplayName: "Gender",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Gender
			}, {
				FieldName: "HireDate",
				DisplayName: "Hire Date",
				DBName: "HireDate",
				type: "date"
			}, {
				FieldName: "Rate",
				DBName: "Rate",
				type: "number"
			}, {
				FieldName: "Otrate",
				DisplayName: "OT Rate",
				DBName: "OTRate",
				type: "number"
			}, {
				FieldName: "Comments",
				DisplayName: "Notes",
				DBName: "Comments",
				type: "string"
			}, {
				FieldName: "LastUpdated",
				DisplayName: "Last Updated Date",
				DBName: "LastUpdated",
				dbType: "datetime",
				type: "date",
				isUTC: true,
			}, {
				FieldName: "LastUpdatedId",
				DisplayName: "Last Updated Id",
				DBName: "LastUpdatedId",
				type: "integer"
			}, {
				FieldName: "MyLastUpdatedName",
				DisplayName: "Last Updated By",
				DBName: "MyLastUpdatedName",
				type: "string"
			}, {
				FieldName: "LastUpdatedType",
				DisplayName: "Last Updated Type",
				DBName: "LastUpdatedType",
				type: "integer"
			}, {
				FieldName: "DeletedFlag",
				DBName: "DeletedFlag",
				type: "boolean"
			}, {
				FieldName: "DeletedDate",
				DBName: "DeletedDate",
				type: "date"
			}, {
				FieldName: "EmployeeId",
				DisplayName: "Employee ID",
				DBName: "EmployeeId",
				type: "string"
			}];
		/**************************************************************************************************************************************/
		self.schoolDataColumns = [
			{
				FieldName: "ArrivalTime",
				DisplayName: "Arrival Time",
				DBName: "ArrivalTime",
				type: "time"
			}, {
				FieldName: "BeginTime",
				DisplayName: "Begin Time",
				DBName: "Begin_time",
				type: "time"
			}, {
				FieldName: "Capacity",
				DisplayName: "Student Capacity",
				DBName: "Capacity",
				type: "integer"
			}, {
				FieldName: "DepartTime",
				DisplayName: "Departure Time",
				DBName: "DepartTime",
				type: "time"
			}, {
				FieldName: "DispGrade",
				DBName: "DispGrade",
				type: "string"
			}, {
				FieldName: "District",
				DBName: "District",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.District.District2
			}, {
				FieldName: "EndTime",
				DisplayName: "End Time",
				DBName: "End_time",
				type: "time"
			}, {
				FieldName: "FeedSchl",
				DisplayName: "Feed School",
				DBName: "Feed_Schl",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School.SchoolCode
			}, {
				FieldName: "GeoCity",
				DisplayName: "Geo City",
				DBName: "Geo_City",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoCity2", "school", "GeoCity")
			}, {
				FieldName: "GeoCounty",
				DisplayName: "Map Set",
				DBName: "Geo_County",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("Mapset", "school", "GeoCounty")
			}, {
				FieldName: "GeoStreet",
				DisplayName: "Geo Street",
				DBName: "Geo_Street",
				type: "string"
			}, {
				FieldName: "GeoZip",
				DisplayName: "Geo Postal Code",
				DBName: "geo_zip",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoZipCode", "school", "GeoZip")
			}, {
				FieldName: "GeoConfidence",
				DBName: "geoConfidence",
				type: "integer"
			}, {
				FieldName: "GradeRange",
				DisplayName: "Grade Range",
				DBName: "grade_range",
				type: "string"
			}, {
				FieldName: "Guid",
				DisplayName: "GUID",
				DBName: "GUID",
				type: "string"
			}, {
				FieldName: "LastUpdated",
				DisplayName: "Last Updated Date",
				DBName: "LastUpdated",
				dbType: "datetime",
				type: "date",
				isUTC: true,
			}, {
				FieldName: "LastUpdatedId",
				DisplayName: "Last Updated Id",
				DBName: "LastUpdatedId",
				type: "integer"
			}, {
				FieldName: "LastUpdatedName",
				DisplayName: "Last Updated By",
				DBName: "LastUpdatedName",
				type: "string"
			}, {
				FieldName: "LastUpdatedType",
				DisplayName: "Last Updated Type",
				DBName: "LastUpdatedType",
				type: "string"
			}, {
				FieldName: "MailCity",
				DisplayName: "Mail City",
				DBName: "Mail_City",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingCity", "school", "MailCity")
			}, {
				FieldName: "MailState",
				DisplayName: "Mail State/Province",
				DBName: "Mail_State",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingState", "school", "MailState")
			}, {
				FieldName: "MailStreet1",
				DisplayName: "Mail Street #1",
				DBName: "Mail_Street1",
				type: "string"
			}, {
				FieldName: "MailStreet2",
				DisplayName: "Mail Street #2",
				DBName: "Mail_Street2",
				type: "string"
			}, {
				FieldName: "MailZip",
				DisplayName: "Mail Postal Code",
				DBName: "Mail_Zip",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingZipCode", "school", "MailZip")
			}, {
				FieldName: "Name",
				DBName: "Name",
				type: "string"
			}, {
				FieldName: "Private",
				DisplayName: "Private School",
				DBName: "Private",
				type: "boolean"
			}, {
				FieldName: "School",
				DisplayName: "School Code",
				DBName: "school",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School.SchoolCode
			}, {
				FieldName: "Id",
				DBName: "SchoolID",
				type: "integer"
			}, {
				FieldName: "Tschl",
				DisplayName: "Allows Transfers",
				DBName: "TSchl",
				type: "boolean"
			}, {
				FieldName: "Xcoord",
				DisplayName: "X Coord",
				DBName: "XCoord",
				type: "number",
				Precision: 6
			}, {
				FieldName: "Ycoord",
				DisplayName: "Y Coord",
				DBName: "YCoord",
				type: "number",
				Precision: 6
			}];
		/**************************************************************************************************************************************/
		self.geoRegionDataColumns = [
			{
				FieldName: "Id",
				DBName: "GeoRegionId",
				type: "integer"
			}, {
				FieldName: "Name",
				DBName: "Name",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.GeoRegion
			}, {
				FieldName: "Comments",
				DisplayName: "Notes",
				DBName: "Comments",
				type: "string"
			}, {
				FieldName: "GeoCity",
				DisplayName: "Geo City",
				DBName: "Geo_City",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoCity2", "georegion", "GeoCity")
			}, {
				FieldName: "GeoCounty",
				DisplayName: "Map Set",
				DBName: "Geo_County",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("Mapset2", "georegion", "GeoCounty")
			}, {
				FieldName: "GeoStreet",
				DisplayName: "Geo Street",
				DBName: "Geo_Street",
				type: "string"
			}, {
				FieldName: "MailCity",
				DisplayName: "Mail City",
				DBName: "Mail_City",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingCity", "georegion", "MailCity")
			}, {
				FieldName: "MailState",
				DisplayName: "Mail State/Province",
				DBName: "Mail_State",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingState", "georegion", "MailState")
			},
			{
				FieldName: "Georegiontype",
				DisplayName: "Geo Region Type",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.GeneralDataListsGeoRegionType
			},
			{
				FieldName: "MailStreet1",
				DisplayName: "Mail Street #1",
				DBName: "Mail_Street1",
				type: "string"
			}, {
				FieldName: "MailStreet2",
				DisplayName: "Mail Street #2",
				DBName: "Mail_Street2",
				type: "string"
			}, {
				FieldName: "MailZip",
				DisplayName: "Mail Postal Code",
				DBName: "Mail_Zip",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingZipCode", "georegion", "MailZip")
			}, {
				FieldName: "Xcoord",
				DisplayName: "X Coord",
				DBName: "XCoord",
				type: "number",
				Precision: 6
			}, {
				FieldName: "Ycoord",
				DisplayName: "Y Coord",
				DBName: "YCoord",
				type: "number",
				Precision: 6
			}, {
				FieldName: "GeoZip",
				DisplayName: "Geo Postal Code",
				DBName: "geo_zip",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoZipCode", "georegion", "GeoZip")
			}, {
				FieldName: "GeoConfidence",
				DisplayName: "Geo Confidence",
				DBName: "GeoConfidence",
				type: "integer"
			}, {
				FieldName: "LastUpdated",
				DisplayName: "Last Updated Date",
				DBName: "LastUpdated",
				dbType: "datetime",
				type: "date",
				isUTC: true,
			}, {
				FieldName: "LastUpdatedId",
				DisplayName: "Last Updated Id",
				DBName: "LastUpdatedId",
				type: "integer"
			}, {
				FieldName: "LastUpdatedName",
				DisplayName: "Last Updated By",
				DBName: "LastUpdatedName",
				type: "string"
			}, {
				FieldName: "LastUpdatedType",
				DisplayName: "Last Updated Type",
				DBName: "LastUpdatedType",
				type: "integer"
			}, {
				FieldName: "GeoRegionTypeId",
				DBName: "GeoRegionTypeId",
				type: "integer"
			}, {
				FieldName: "HotLink",
				DisplayName: "Hotlink",
				DBName: "HotLink",
				type: "string"
			}];
		/**************************************************************************************************************************************/
		self.altsiteDataColumns = [
			{
				FieldName: "Name",
				DisplayName: "Name",
				DBName: "Name",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.AlternateSite
			},
			{
				FieldName: "Comments",
				DisplayName: "Notes",
				DBName: "Comments",
				type: "string",
			},
			{
				FieldName: "GeoCity",
				DisplayName: "Geo City",
				DBName: "Geo_City",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoCity2", "altsite", "GeoCity")
			},
			{
				FieldName: "GeoCounty",
				DisplayName: "Map Set",
				DBName: "Geo_County",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("Mapset2", "altsite", "GeoCounty")
			},
			{
				FieldName: "GeoStreet",
				DisplayName: "Geo Street",
				DBName: "Geo_Street",
				type: "string",
			},
			{
				FieldName: "MailCity",
				DisplayName: "Mail City",
				DBName: "Mail_City",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingCity", "altsite", "MailCity")
			},
			{
				FieldName: "MailState",
				DisplayName: "Mail State/Province",
				DBName: "Mail_State",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingState", "altsite", "MailState")
			},
			{
				FieldName: "MailStreet1",
				DisplayName: "Mail Street #1",
				DBName: "Mail_Street1",
				type: "string",
			},
			{
				FieldName: "MailStreet2",
				DisplayName: "Mail Street #2",
				DBName: "Mail_Street2",
				type: "string",
			},
			{
				FieldName: "MailZip",
				DisplayName: "Mail Postal Code",
				DBName: "Mail_Zip",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingZipCode", "altsite", "MailZip")
			},
			{
				FieldName: "Xcoord",
				DisplayName: "X Coord",
				DBName: "XCoord",
				type: "number",
				Precision: 6
			},
			{
				FieldName: "Ycoord",
				DisplayName: "Y Coord",
				DBName: "YCoord",
				type: "number",
				Precision: 6
			},
			{
				FieldName: "GeoZip",
				DisplayName: "Geo Postal Code",
				DBName: "geo_zip",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoZipCode", "altsite", "GeoZip")
			},
			{
				FieldName: "Public",
				DisplayName: "Public",
				DBName: "Public",
				type: "boolean",
			},
			{
				FieldName: "GeoConfidence",
				DisplayName: "Geo Confidence",
				DBName: "geoConfidence",
				type: "integer",
			},
			{
				FieldName: "LastUpdated",
				DisplayName: "Last Updated Date",
				DBName: "LastUpdated",
				dbType: "datetime",
				type: "date",
				isUTC: true,
			},
			{
				FieldName: "LastUpdatedID",
				DisplayName: "Last Updated ID",
				DBName: "LastUpdatedID",
				type: "integer",
			},
			{
				FieldName: "LastUpdatedName",
				DisplayName: "Last Updated By",
				DBName: "LastUpdatedName",
				type: "string",
			},
			{
				FieldName: "LastUpdatedType",
				DisplayName: "Last Updated Type",
				DBName: "LastUpdatedType",
				type: "integer",
			}]
		/**************************************************************************************************************************************/
		self.contractorDataColumns = [
			{
				FieldName: "Name",
				DisplayName: "Name",
				DBName: "Name",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Contractor
			},
			{
				FieldName: "Comments",
				DisplayName: "Notes",
				DBName: "Comments",
				type: "string",
			},
			{
				FieldName: "MailCity",
				DisplayName: "Mail City",
				DBName: "Mail_City",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingCity", "contractor", "MailCity")
			},
			{
				FieldName: "MailState",
				DisplayName: "Mail State/Province",
				DBName: "Mail_State",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingState", "contractor", "MailState")
			},
			{
				FieldName: "MailStreet1",
				DisplayName: "Mail Street #1",
				DBName: "Mail_Street1",
				type: "string",
			},
			{
				FieldName: "MailStreet2",
				DisplayName: "Mail Street #2",
				DBName: "Mail_Street2",
				type: "string",
			},
			{
				FieldName: "MailZip",
				DisplayName: "Mail Postal Code",
				DBName: "Mail_Zip",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingZipCode", "contractor", "MailZip")
			},
			{
				FieldName: "LastUpdated",
				DisplayName: "Last Updated Date",
				DBName: "LastUpdated",
				dbType: "datetime",
				type: "date",
				isUTC: true,
			},
			{
				FieldName: "LastUpdatedId",
				DisplayName: "Last Updated Id",
				DBName: "LastUpdatedId",
				type: "integer",
			},
			{
				FieldName: "LastUpdatedName",
				DisplayName: "Last Updated By",
				DBName: "LastUpdatedName",
				type: "string",
			},
			{
				FieldName: "LastUpdatedType",
				DisplayName: "Last Updated Type",
				DBName: "LastUpdatedType",
				type: "integer",
			}]
		/**************************************************************************************************************************************/
		self.fieldTripDataColumns = [
			{
				FieldName: "Name",
				DisplayName: "Name",
				DBName: "Name",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.FieldTrip
			},
			{
				FieldName: "DepartFromSchool",
				DisplayName: "Depart From",
				DBName: "DepartFromSchool",
				type: "string",
			},
			{
				FieldName: "School",
				DisplayName: "School",
				DBName: "School",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School.SchoolCode
			},
			{
				FieldName: "ReturnDate",
				DisplayName: "ReturnDate",
				DBName: "EstimatedReturnDateTime",
				type: "date",
			},
			{
				FieldName: "ReturnTime",
				DisplayName: "Return Time",
				DBName: "EstimatedReturnDateTime",
				type: "time",
			},
			{
				FieldName: "Notes",
				DisplayName: "Notes",
				DBName: "Notes",
				type: "string",
			},
			{
				FieldName: "Destination",
				DisplayName: "Destination",
				DBName: "Destination",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("FieldTripDestination", "fieldtrip", "Destination")
			},
			{
				FieldName: "DestinationStreet",
				DisplayName: "Destination Street",
				DBName: "DestinationStreet",
				type: "string",
			},
			{
				FieldName: "DestinationCity",
				DisplayName: "Destination City",
				DBName: "DestinationCity",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoCity", "fieldtrip", "DestinationCity")
			},
			{
				FieldName: "DestinationState",
				DisplayName: "Destination State",
				DBName: "DestinationState",
				type: "string",
			},
			{
				FieldName: "DestinationZip",
				DisplayName: "Destination Postal Code",
				DBName: "DestinationZip",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoZipCode2", "fieldtrip", "DestinationZip")
			},
			{
				FieldName: "DirectionNotes",
				DisplayName: "Directions",
				DBName: "DirectionNotes",
				type: "string",
			},
			{
				FieldName: "DestinationNotes",
				DisplayName: "Destination Notes",
				DBName: "DestinationNotes",
				type: "string",
			},
			{
				FieldName: "DestinationContact",
				DisplayName: "Destination Contact",
				DBName: "DestinationContact",
				type: "string",
			},
			{
				FieldName: "DestinationContactPhone",
				DisplayName: "Destination Contact Phone",
				DBName: "DestinationContactPhone",
				type: "string",
			},
			{
				FieldName: "DepartDate",
				DisplayName: "Depart Date",
				DBName: "DepartDateTime",
				type: "date",
			},
			{
				FieldName: "DepartTime",
				DisplayName: "Depart Time",
				DBName: "DepartDateTime",
				type: "time",
			},
			{
				FieldName: "DepartureNotes",
				DisplayName: "Departure Notes",
				DBName: "DepartureNotes",
				type: "string",
			},
			{
				FieldName: "NumberOfStudents",
				DisplayName: "# Students",
				DBName: "NumberOfStudents",
				type: "integer",
			},
			{
				FieldName: "NumberOfAdults",
				DisplayName: "# Adults",
				DBName: "NumberOfAdults",
				type: "integer",
			},
			{
				FieldName: "NumberOfVehicles",
				DisplayName: "# Vehicles",
				DBName: "NumberOfVehicles",
				type: "integer",
			},
			{
				FieldName: "NumberOfWheelChairs",
				DisplayName: "# Wheelchairs",
				DBName: "NumberOfWheelChairs",
				type: "integer",
			},
			{
				FieldName: "EstimatedDistance",
				DisplayName: "Estimated Distance",
				UnitOfMeasureSupported: true,
				DBName: "EstimatedDistance",
				type: "number",
			},
			{
				FieldName: "EstimatedHours",
				DisplayName: "Estimated Hours",
				DBName: "EstimatedHours",
				type: "number",
			},
			{
				FieldName: "EstimatedCost",
				DisplayName: "Estimated Cost",
				DBName: "ShowPublic",
				type: "number",
			},
			{
				FieldName: "PublicNotes",
				DisplayName: "PublicNotes",
				DBName: "PublicNotes",
				type: "string",
			},
			{
				FieldName: "InvoiceDate",
				DisplayName: "Invoice Date",
				DBName: "InvoiceDate",
				type: "date",
			},
			{
				FieldName: "PaymentDate",
				DisplayName: "Payment Date",
				DBName: "PaymentDate",
				type: "date",
			},
			{
				FieldName: "BillingNotes",
				DisplayName: "Billing Notes",
				DBName: "BillingNotes",
				type: "string",
			},
			{
				FieldName: "FuelConsumptionRate",
				DisplayName: `Rate/${tf.measurementUnitConverter.getShortUnits()}`,
				UnitOfMeasureSupported: true,
				UnitOfMeasureReverse: true,
				DBName: "FuelConsumptionRate",
				type: "number",
			},
			{
				FieldName: "FixedCost",
				DisplayName: "Fixed Costs",
				DBName: "FixedCost",
				type: "number",
			},
			{
				FieldName: "AideFixedCost",
				DisplayName: "Aide Fixed Costs",
				DBName: "AideFixedCost",
				type: "number",
			},
			{
				FieldName: "DriverFixedCost",
				DisplayName: "Driver Fixed Costs",
				DBName: "DriverFixedCost",
				type: "number",
			},
			{
				FieldName: "MinimumCost",
				DisplayName: "Minimum Costs",
				DBName: "MinimumCost",
				type: "number",
			},
			{
				FieldName: "DriverRate",
				DisplayName: "Driver Rate",
				DBName: "DriverRate",
				type: "number",
			},
			{
				FieldName: "DriverOtrate",
				DisplayName: "Driver OT Rate",
				DBName: "DriverOTRate",
				type: "number",
			},
			{
				FieldName: "AideRate",
				DisplayName: "Aide Rate",
				DBName: "AideRate",
				type: "number",
			},
			{
				FieldName: "AideOtrate",
				DisplayName: "Aide OT Rate",
				DBName: "AideOTRate",
				type: "number",
			},
			{
				FieldName: "PurchaseOrder",
				DisplayName: "Purchase Order",
				DBName: "PurchaseOrder",
				type: "string",
			},
			{
				FieldName: "FieldTripContact",
				DisplayName: "Contact",
				DBName: "FieldTripContact",
				type: "string",
			},
			{
				FieldName: "DestinationContactTitle",
				DisplayName: "Destination Contact Title",
				DBName: "DestinationContactTitle",
				type: "string",
			},
			{
				FieldName: "DestinationPhoneExt",
				DisplayName: "Destination Phone Ext.",
				DBName: "DestinationPhoneExt",
				type: "string",
			},
			{
				FieldName: "DestinationFax",
				DisplayName: "Destination Fax",
				DBName: "DestinationFax",
				type: "string",
			},
			{
				FieldName: "DestinationEmail",
				DisplayName: "Destination Email",
				DBName: "DestinationEMail",
				type: "string",
			},
			{
				FieldName: "LastUpdated",
				DisplayName: "Last Updated Date",
				DBName: "LastUpdated",
				dbType: "datetime",
				type: "date",
				isUTC: true,
			},
			{
				FieldName: "LastUpdatedUserId",
				DisplayName: "Last Updated User Id",
				DBName: "LastUpdatedUserId",
				type: "integer",
			},
			{
				FieldName: "LastUpdatedName",
				DisplayName: "Last Updated By",
				DBName: "LastUpdatedName",
				type: "string",
			},
			{
				FieldName: "LastUpdatedType",
				DisplayName: "Last Updated Type",
				DBName: "LastUpdatedType",
				type: "integer",
			}]
		/**************************************************************************************************************************************/
		self.districtDataColumns = [
			{
				FieldName: "District",
				DisplayName: "District",
				DBName: "district",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.District.District
			},
			{
				FieldName: "Name",
				DisplayName: "Name",
				DBName: "Name",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.District
			},
			{
				FieldName: "Comments",
				DisplayName: "Notes",
				DBName: "Comments",
				type: "string",
			},
			{
				FieldName: "MailCity",
				DisplayName: "Mail City",
				DBName: "Mail_City",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingCity", "district", "MailCity")
			},
			{
				FieldName: "MailState",
				DisplayName: "Mail State/Province",
				DBName: "Mail_State",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingState", "district", "MailState")
			},
			{
				FieldName: "MailStreet1",
				DisplayName: "Mail Street #1",
				DBName: "Mail_Street1",
				type: "string",
			},
			{
				FieldName: "MailStreet2",
				DisplayName: "Mail Street #2",
				DBName: "Mail_Street2",
				type: "string",
			},
			{
				FieldName: "MailZip",
				DisplayName: "Mail Postal Code",
				DBName: "Mail_Zip",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingZipCode", "district", "MailZip")
			},
			{
				FieldName: "LastUpdated",
				DisplayName: "Last Updated Date",
				DBName: "LastUpdated",
				dbType: "datetime",
				type: "date",
				isUTC: true,
			},
			{
				FieldName: "LastUpdatedId",
				DisplayName: "Last Updated Id",
				DBName: "LastUpdatedId",
				type: "integer",
			},
			{
				FieldName: "LastUpdatedName",
				DisplayName: "Last Updated By",
				DBName: "LastUpdatedName",
				type: "string",
			},
			{
				FieldName: "LastUpdatedType",
				DisplayName: "Last Updated Type",
				DBName: "LastUpdatedType",
				type: "integer",
			}];
		/**************************************************************************************************************************************/
		self.routeDataColumns = [
			{
				FieldName: "ID",
				DisplayName: "ID",
				DBName: "RouteId",
				type: "integer"
			},
			{
				FieldName: "Name",
				DisplayName: "Name",
				DBName: "Name",
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Route
			},
			{
				FieldName: "LastUpdatedOn",
				DisplayName: "Last Updated Date",
				DBName: "LastUpdateOn",
				dbType: "datetime",
				type: "date",
				isUTC: true,
			},
			{
				FieldName: "LastUpdatedBy",
				DisplayName: "Last Updated By",
				DBName: "LastUpdatedBy",
				type: "integer",
			}];

		self.formsDataColumns = [
			{
				FieldName: "Name",
				Width: '150px',
				type: "string"
			},
			{
				FieldName: "Description",
				Width: '150px',
				type: "string"
			},
			{
				FieldName: "CreatedOn",
				DisplayName: "Created On",
				Width: '150px',
				type: "datetime",
				isUTC: true
			},
			{
				FieldName: "CreatedBy",
				DisplayName: "Created By",
				Width: '150px',
				type: "string"
			},
			{
				FieldName: "DataType",
				DisplayName: "Data Type",
				Width: '150px',
				type: "string"
			},
			{
				FieldName: "ExternalID",
				DisplayName: "External ID",
				Width: '150px',
				type: "string"
			},
			{
				FieldName: "Public",
				Width: '150px',
				type: "boolean"
			},
			{
				FieldName: "StartDate",
				DisplayName: "Start On",
				Width: '150px',
				type: "datetime",
				isUTC: true
			},
			{
				FieldName: "EndDate",
				DisplayName: "End On",
				Width: '150px',
				type: "datetime",
				isUTC: true
			},
			{
				FieldName: "FormColor",
				DisplayName: "Form Color",
				Width: '100px',
				type: "string",
				template: function(item)
				{
					if (!item.FormColor)
					{
						return '';
					}

					return `<div class="form-color" style="background-color:${item.FormColor}" >
						</div>`;
				}
			},
			{
				FieldName: "RequiredLocation",
				DisplayName: "Required Location",
				Width: '150px',
				type: "boolean",
				template: function(item)
				{
					return booleanToCheckboxFormatter(item.RequiredLocation);
				}
			}
		];

		self.gpseventDataColumns = [
			{
				FieldName: "BusNum",
				DisplayName: "Vehicle",
				Width: '150px',
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.BusfinderHistoricalVehicle
			}, {
				FieldName: "DayOfTheWeek",
				DisplayName: "Day of the Week",
				Width: '150px',
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DaysOfTheWeek,
			}, {
				FieldName: "EventName",
				DisplayName: "Event",
				Width: '150px',
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.GPSEventType,
			}, {
				FieldName: "TripName",
				DisplayName: "Trip",
				Width: '150px',
				type: "string",
			}, {
				FieldName: "StopName",
				DisplayName: "Trip Stop",
				Width: '150px',
				type: "string",
			}, {
				FieldName: "StopStatus",
				DisplayName: "Stop Status",
				Width: '150px',
				type: "string",
			},
		];

		/**************************************************************************************************************************************/
		self.fieldTripLocationDataColumns = [
			{
				FieldName: "Name",
				DisplayName: "Name",
				unique: true,
				type: "string",
				Width: '150px'
			},
			{
				FieldName: "City",
				DisplayName: "City",
				type: "string",
				Width: '120px'
			},
			{
				FieldName: "Street",
				DisplayName: "Street",
				defaultValue: "",
				type: "string",
				Width: '200px'
			},
			{
				FieldName: "State",
				DisplayName: "State",
				defaultValue: "",
				type: "string"
			},
			{
				FieldName: "Zip",
				DisplayName: "Zip",
				defaultValue: "",
				type: "string"
			},
			{
				FieldName: "Notes",
				DisplayName: "Notes",
				defaultValue: "",
				type: "string",
				Width: '200px'
			},
			{
				FieldName: "XCoord",
				DisplayName: "X Coord",
				Width: '150px',
				type: "number",
				Precision: 6,
				format: "{0:0.000000}"
			},
			{
				FieldName: "YCoord",
				DisplayName: "Y Coord",
				Width: '150px',
				type: "number",
				Precision: 6,
				format: "{0:0.000000}"
			},
			{
				FieldName: "GeocodeScore",
				DisplayName: "Geocode Score",
				Width: '150px',
				type: "number",
			},
			{
				FieldName: "LastUpdated",
				DisplayName: "Last Updated Date",
				Width: '150px',
				dbType: "datetime",
				type: "date",
				isUTC: true
			},
			{
				FieldName: "LastUpdatedName",
				DisplayName: "Last Updated By",
				Width: '150px',
				type: "string",
			},
			{
				FieldName: "Geocoded",
				DisplayName: "Geocoded",
				Width: '150px',
				type: "boolean",
			},
		];

		self.formResultDataColumns = [];

		self._updateDisplayNameWithApplicationTerm();
	};

	/**
	 * Get the data columns for sepcified type.
	 * @param {string} type The data type.
	 * @returns {void}
	 */
	DataFieldHelper.prototype.getColumnsByType = function(type, dataColumns)
	{
		var self = this, type = type && type.toLowerCase(), columns;

		switch (type)
		{
			case "altsite":
				columns = self.altsiteDataColumns;
				break;
			case "contractor":
				columns = self.contractorDataColumns;
				break;
			case "contact":
				columns = tf.contactGridDefinition.gridDefinition().Columns;
				break;
			case "document":
				columns = tf.documentGridDefinition.gridDefinition().Columns;
				break;
			case "district":
				columns = self.districtDataColumns;
				break;
			case "fieldtrip":
				columns = self.fieldTripDataColumns;
				break;
			case "forms":
				//columns = tf.formsGridDefinition.gridDefinition().Columns;
				columns = self.formsDataColumns;
				break;
			case "form":
				if (dataColumns)
				{
					self.formResultDataColumns = dataColumns.filter(d => d.hasOwnProperty("FieldName"));
				}
				columns = (self.formResultDataColumns && self.formResultDataColumns.length) ? self.formResultDataColumns : tf.formGridDefinition.gridDefinition([]).Columns;
				break;
			case "georegion":
				columns = self.geoRegionDataColumns;
				break;
			case "gpsevent":
				columns = self.gpseventDataColumns;
				break;
			case "route":
				columns = self.routeDataColumns;
				break;
			case "report":
				columns = tf.reportGridDefinition.gridDefinition().Columns;
				break;
			case "reportlibrary":
				columns = tf.ReportLibraryGridDefinition.gridDefinition().Columns;
				break;
			case "staff":
				columns = self.staffDataColumns;
				break;
			case "school":
				columns = self.schoolDataColumns;
				break;
			case "student":
				columns = self.studentDataColumns;
				break;
			case "studentattendanceschedule":
				columns = tf.studentScheduleGridDefinition.gridDefinition().Columns;
				break;
			case "scheduledreport":
				columns = tf.scheduledReportGridDefinition.gridDefinition().Columns;
				break;
			case "trip":
				columns = self.tripDataColumns;
				break;
			case "tripschedule":
				columns = tf.tripScheduleGridDefinition.gridDefinition().Columns;
				break;
			case "tripstop":
				columns = self.tripStopDataColumns;
				break;
			case "tripstopschedule":
				columns = tf.tripStopScheduleGridDefinition.gridDefinition().Columns;
				break;
			case "unassignedstudents":
				columns = self.unassignedStudentDataColumns;
				break;
			case "vehicle":
				columns = self.vehicleDataColumns;
				break;
			case "session":
				columns = tf.sessionGridDefinition.gridDefinition().Columns;
				break;
			case "dashboards":
				columns = tf.customizedDashboardGridDefinition.gridDefinition().Columns;
				break;
			case "dashboardlibrary":
				columns = tf.customizedDashboardLibraryGridDefinition.gridDefinition().Columns;
				break;
			case "mergedocumentssent":
				columns = tf.mergeDocumentsSentGridDefinition.gridDefinition().Columns;
				break;
			case "scheduledreportssent":
				columns = tf.scheduledReportsSentGridDefinition.gridDefinition().Columns;
				break;
			case "mergedocument":
				columns = tf.mergeDocumentGridDefinition.gridDefinition().Columns;
				break;
			case "mergeemailmessage":
				columns = tf.mergeEmailMessageGridDefinition.gridDefinition().Columns;
				break;
			case "scheduledmergedocument":
				columns = tf.scheduledMergeDocumentGridDefinition.gridDefinition().Columns;
				break;
			case "mergedocumentlibrary":
				columns = tf.mergeDocumentLibraryGridDefinition.gridDefinition().Columns;
				break;
			case "fieldtriplocation":
				columns = self.fieldTripLocationDataColumns;
				break;
		};

		return columns ? columns.filter(c => !c.hasOwnProperty("UDFGuid") && !c.hiddenForThematic) : columns;
	};

	/**
	 * Get the field data object by grid typd and field name.
	 * @param {string} gridType The grid type
	 * @param {string} fieldName The field name
	 * @return {Object} The matched field data object.
	 */
	DataFieldHelper.prototype.getDisplayName = function(gridType, fieldName)
	{
		var self = this, displayName;
		$.each(self.getColumnsByType(gridType), function(index, item)
		{
			if (item.FieldName === fieldName)
			{
				displayName = item.DisplayName || fieldName;
				return false;
			}
		});
		return displayName;
	};


	DataFieldHelper.prototype._updateDisplayNameWithApplicationTerm = function()
	{
		var self = this, resultStr, displayName,
			replaceAt = function(str, replacement, startIndex, length)
			{
				return str.substr(0, startIndex) + replacement + str.substr(startIndex + length, str.length);
			},
			updateString = function(str)
			{
				$.each(tf.APPLICATIONTERMDEFAULTVALUES, function(index, defaultTerm)
				{
					resultStr = str;
					strIndex = str.indexOf(defaultTerm.Plural);
					if (strIndex >= 0)
					{
						resultStr = tf.applicationTerm.getApplicationTermPluralByName(defaultTerm.Term);
						resultStr = replaceAt(str, resultStr, strIndex, defaultTerm.Plural.length);
						return false;
					}

					strIndex = str.indexOf(defaultTerm.Singular);
					if (strIndex >= 0)
					{
						resultStr = tf.applicationTerm.getApplicationTermSingularByName(defaultTerm.Term);
						resultStr = replaceAt(str, resultStr, strIndex, defaultTerm.Singular.length);
						return false;
					}
				});

				return resultStr;
			},
			updateColumns = function(columns)
			{
				$.each(columns, function(index, col)
				{
					displayName = col.DisplayName || col.FieldName;
					displayName = updateString(displayName);
					col.DisplayName = displayName;
				});
			};

		updateColumns(self.studentDataColumns);
		updateColumns(self.vehicleDataColumns);
		updateColumns(self.tripDataColumns);
		updateColumns(self.tripStopDataColumns);
		updateColumns(self.staffDataColumns);
		updateColumns(self.schoolDataColumns);
		updateColumns(self.geoRegionDataColumns);
		updateColumns(self.altsiteDataColumns);
		updateColumns(self.contractorDataColumns);
		updateColumns(self.fieldTripDataColumns);
		updateColumns(self.districtDataColumns);
		updateColumns(self.routeDataColumns);
		updateColumns(self.formsDataColumns);
	};

	DataFieldHelper.equals = function(type, value1, value2)
	{
		if (!type)
		{
			return false;
		}

		if (type !== "number")
		{
			value1 = isNullObj(value1) ? "" : value1;
			value2 = isNullObj(value2) ? "" : value2;
		}

		if (value1 === "" && value2 === "")
		{
			return true;
		}

		var self = this;
		switch (type)
		{
			case 'date':
				return self.compareValuesByFormat(value1, value2, 'YYYY/MM/DD');
			case 'datetime':
				return self.compareValuesByFormat(value1, value2, 'YYYY/MM/DD HH:mm');
			case 'time':
				return self.compareValuesByFormat(value1, value2, 'HH:mm');
			case 'boolean':
				return String(value1).toLowerCase() === String(value2).toLowerCase();
			case 'number':
				if ((value1 === null && value2 !== null) || (value1 !== null && value2 === null))
				{
					return false;
				}
				return value1 * 1 === value2 * 1;
			case 'string':
				return (value1.toLowerCase() === value2.toLowerCase());
			default:
				return value1 == value2;
		}
	}

	DataFieldHelper.compareValuesByFormat = function(value1, value2, format)
	{
		var m1 = moment(value1), m2 = moment(value2);

		// Fix bug #RW-39567
		// If a field is normal time field. value 1 is datatime format
		// If a field is UDF. value 1 is string (format 00:00:00)
		// Before #RW-36563 The thematic settings (value2) is DateTime format (1/1/1900 06:27:00 AM)
		// But After #RW-3656 3The thematic settings (value2) is Time string format (07:01:00)
		// So if value1 is datatime format. need to update value2 to datatime too.

		if (m1.isValid() && !m2.isValid())
		{
			m2 = moment(`${moment(new Date()).format("YYYY-MM-DD")} ${value2}`);
		}

		if (!m1.isValid() || !m2.isValid())
		{
			return value1 === value2;
		}

		return m1.format(format) === m2.format(format);
	}

	DataFieldHelper.prototype.dispose = function()
	{
		tfdispose(this);
	}
}());

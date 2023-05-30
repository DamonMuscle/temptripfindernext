(function()
{
	var namespace = window.createNamespace("TF.DataModel");
	namespace.StaffDataModel = function(staffEntity)
	{
		namespace.BaseDataModel.call(this, staffEntity);
	}

	namespace.StaffDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.StaffDataModel.prototype.constructor = namespace.StaffDataModel;

	namespace.StaffDataModel.prototype.mapping = [
		{ "from": "Abstract", "default": null },
		{ "from": "ActiveFlag", "default": true },
		{ "from": "Advanced", "default": null },
		{ "from": "AllStaffTypes", "default": null },
		{ "from": "ApplicationField", "default": null },
		{ "from": "BasicField", "default": null },
		{ "from": "CellPhone", "default": "" },
		{ "from": "Certification", "default": null },
		{ "from": "Comments", "default": "" },
		{ "from": "ContractorId", "default": 0 },
		{ "from": "ContractorName", "default": null },
		{ "from": "DBID", "default": function() { return tf.datasourceManager.databaseId; } },
		{ "from": "DBINFO", "default": null },
		{ "from": "DateOfBirth", "default": null },
		{ "from": "DefensiveDriving", "default": null },
		{ "from": "DeletedDate", "default": null },
		{ "from": "DeletedFlag", "default": false },
		{ "from": "DisplayGender", "default": null },
		{ "from": "DrivingTestPractical", "default": null },
		{ "from": "DrivingTestWritten", "default": null },
		{ "from": "Email", "default": "" },
		{ "from": "EmployeeId", "default": "" },
		{ "from": "FingerPrint", "default": null },
		{ "from": "FirstName", "default": "" },
		{ "from": "FullName", "default": null },
		{ "from": "Gender", "default": "" },
		{ "from": "HandicapPreService", "default": null },
		{ "from": "HandicapRef", "default": null },
		{ "from": "HepatitisB", "default": null },
		{ "from": "HireDate", "default": null },
		{ "from": "HomePhone", "default": "" },
		{ "from": "Id", "default": 0 },
		{ "from": "ImageBase64", "default": null },
		{ "from": "InactiveDate", "default": null },
		{ "from": "Interview", "default": null },
		{ "from": "LastName", "default": "" },
		{ "from": "LastUpdated", "default": "1970-01-01T00:00:00" },
		{ "from": "LastUpdatedId", "default": 0 },
		{ "from": "LastUpdatedType", "default": 0 },
		{ "from": "LicenseClass", "default": "" },
		{ "from": "LicenseEndorsements", "default": "" },
		{ "from": "LicenseExpiration", "default": null },
		{ "from": "LicenseNumber", "default": "" },
		{ "from": "LicenseRestrictions", "default": "" },
		{ "from": "LicenseState", "default": "" },
		{ "from": "MailCity", "default": function() { return tf.setting.userProfile.MailCityName; } },
		{ "from": "MailCityId", "default": function() { return tf.setting.userProfile.MailCity; } },
		{ "from": "MailCounty", "default": "" },
		{ "from": "MailState", "default": function() { return tf.setting.userProfile.MailStateName; } },
		{ "from": "MailStateId", "default": function() { return tf.setting.userProfile.MailState; } },
		{ "from": "MailStreet1", "default": "" },
		{ "from": "MailStreet2", "default": "" },
		{ "from": "MailZip", "default": function() { return tf.setting.userProfile.MailZipName; } },
		{ "from": "MailZipId", "default": function() { return tf.setting.userProfile.MailPostalCode; } },
		{ "from": "MedicalExam", "default": null },
		{ "from": "MiddleName", "default": "" },
		{ "from": "NewHireOrient", "default": null },
		{ "from": "Otrate", "default": null },
		{ "from": "PPTField", "default": null },
		{ "from": "PreService", "default": null },
		{ "from": "PrimaryFlag", "default": null },
		{ "from": "Rate", "default": null },
		{ "from": "RefresherPart1", "default": null },
		{ "from": "RefresherPart2", "default": null },
		{ "from": "StaffGuid", "default": "" },
		{ "from": "StaffLocalId", "default": "" },
		{ "from": "StaffName", "default": null },
		{ "from": "StaffTypeIds", "default": null },
		{ "from": "StaffTypes", "default": null },
		{ "from": "SuperintendentApprov", "default": null },
		{ "from": "UserDefinedFields", "default": null },
		{ "from": "DocumentRelationships", "default": null },
		{ "from": "WorkPhone", "default": "" }
	];

})();

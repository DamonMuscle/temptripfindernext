(function()
{
	createNamespace("TF.GridDefinition").StaffGridDefinition = StaffGridDefinition;
	function StaffGridDefinition()
	{
	}

	StaffGridDefinition.prototype.gridDefinition = function()
	{
		return {
			Columns: [
				{
					FieldName: "LastName",
					DisplayName: "Last Name",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Staff.LastName
				},
				{
					FieldName: "FirstName",
					DisplayName: "First Name",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Staff.FirstName
				},
				{
					FieldName: "StaffLocalId",
					DisplayName: "Local ID",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "DateOfBirth",
					DisplayName: "Date of Birth",
					Width: '150px',
					type: "date"
				},
				{
					FieldName: "Gender",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Gender
				},
				{
					FieldName: "Age",
					DisplayName: "Age",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "HireDate",
					DisplayName: "Hire Date",
					Width: '150px',
					type: "date"
				},
				{
					FieldName: "ActiveFlag",
					DisplayName: "Active",
					Width: '150px',
					type: "boolean"
				},
				{
					FieldName: "ContractorName",
					DisplayName: "Contractor Name",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.StaffContractorName
				},
				{
					FieldName: "MailStreet1",
					DisplayName: "Mail Street #1",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "MailStreet2",
					DisplayName: "Mail Street #2",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "MailCity",
					DisplayName: "Mail City",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingCity", "staff", "MailCity")
				},
				{
					FieldName: "MailCounty",
					DisplayName: "Mail County",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "MailState",
					DisplayName: "Mail " + tf.localization.AreaName,
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "MailZip",
					DisplayName: "Mail " + tf.localization.Postal,
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingZipCode", "staff", "MailZip")
				},
				{
					FieldName: "HomePhone",
					DisplayName: "Home Phone",
					Width: '150px',
					type: "string",
					template: function(item)
					{
						return tf.dataFormatHelper.phoneFormatter(item.HomePhone) || '';
					}
				},
				{
					FieldName: "CellPhone",
					DisplayName: "Cell Phone",
					Width: '150px',
					type: "string",
					template: function(item)
					{
						return tf.dataFormatHelper.phoneFormatter(item.CellPhone) || '';
					}
				},
				{
					FieldName: "LicenseNumber",
					DisplayName: "License #",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "LicenseState",
					DisplayName: "License " + tf.localization.AreaName,
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "LicenseExpiration",
					DisplayName: "License Expiration",
					Width: '150px',
					type: "date"
				},
				{
					FieldName: "LicenseClass",
					DisplayName: "License Class",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "LicenseEndorsements",
					DisplayName: "License Endorsements",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "LicenseRestrictions",
					DisplayName: "License Restrictions",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "EmployeeId",
					DisplayName: "Employee ID",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "MiddleName",
					DisplayName: "MI",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Staff.MiddleName
				},
				{
					FieldName: "FullName",
					DisplayName: "Name",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Staff
				},
				{
					FieldName: "InactiveDate",
					DisplayName: "Date Inactive",
					Width: '150px',
					type: "date",
					hidden: true
				},

				{
					FieldName: "Email",
					DisplayName: "Email",
					Width: '150px',
					type: "string",
					attributes: {
						"class": "k-link"
					},
					hidden: true
				},
				{
					FieldName: "WorkPhone",
					DisplayName: "Work Phone",
					Width: '150px',
					type: "boolean",
					hidden: true,
					template: function(item)
					{
						return tf.dataFormatHelper.phoneFormatter(item.WorkPhone) || '';
					}
				},
				{
					FieldName: "Rate",
					Width: '150px',
					type: "number",
					hidden: true
				},
				{
					FieldName: "Otrate",
					DisplayName: "OT Rate",
					Width: '150px',
					type: "number",
					hidden: true
				},
				{
					FieldName: "Comments",
					DisplayName: "Notes",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "StaffGuid",
					DisplayName: "GUID",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "FieldTripCount",
					DisplayName: "Field Trip Count",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "FieldTripHours",
					DisplayName: "Field Trip Hours",
					Width: '150px',
					type: "number",
					hidden: true
				},
				{
					FieldName: "MyLastUpdated",
					DisplayName: "Last Updated Date",
					Width: '150px',
					type: "date",
					hidden: true
				},
				{
					FieldName: "MyLastUpdatedName",
					DisplayName: "Last Updated By",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "ContractorID",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "DeletedDate",
					Width: '150px',
					type: "date",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "DeletedFlag",
					Width: '150px',
					type: "boolean",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "SfPersonId",
					Width: '150px',
					type: "integer",
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
			].concat(tf.UDFDefinition.getAvailableWithCurrentDataSource("staff")),
			InvisibleUDFColumns: tf.UDFDefinition.getInvisibleUDFs("staff")
		};
	};

	tf.staffGridDefinition = new TF.GridDefinition.StaffGridDefinition();
})();

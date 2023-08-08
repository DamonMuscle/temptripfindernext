(function()
{
	createNamespace("TF.GridDefinition").ContractorGridDefinition = ContractorGridDefinition;
	function ContractorGridDefinition()
	{
	}

	ContractorGridDefinition.prototype.gridDefinition = function()
	{
		return {
			Columns: [
				{
					FieldName: "Name",
					Width: '180px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Contractor
				},
				{
					FieldName: "MailStreet1",
					DisplayName: "Mail Street #1",
					DBName: "Mail_Street1",
					Width: '160px',
					type: "string"
				},
				{
					FieldName: "MailCity",
					DisplayName: "Mail City",
					DBName: "Mail_City",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingCity", "contractor", "MailCity")
				},
				{
					FieldName: "MailState",
					DisplayName: "Mail " + tf.localization.AreaName,
					DBName: "Mail_State",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingState", "contractor", "MailState")
				},
				{
					FieldName: "MailZip",
					DisplayName: "Mail " + tf.localization.Postal,
					DBName: "Mail_Zip",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingZipCode", "contractor", "MailZip")
				},
				{
					FieldName: "DocumentCount",
					DisplayName: "# Documents",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "Comments",
					DisplayName: "Notes",
					Width: '300px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "MailStreet2",
					DisplayName: "Mail Street #2",
					DBName: "Mail_Street2",
					Width: '160px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "LastUpdated",
					DisplayName: "Last Updated Date",
					Width: '160px',
					dbType: "datetime",
					type: "date",
					hidden: true,
					template: function(item)
					{
						let dt = utcToClientTimeZone(item["LastUpdated"]);
						return dt.isValid() ? dt.format("MM/DD/YYYY") : "";
					},
					isUTC: true,
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
					FieldName: "LastUpdatedName",
					DisplayName: "Last Updated By",
					Width: '130px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "LastUpdatedType",
					DisplayName: "Last Updated Type",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "Id",
					DBName: "contractor_id",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				}
			].concat(tf.UDFDefinition.getAvailableWithCurrentDataSource("contractor")),
			InvisibleUDFColumns: tf.UDFDefinition.getInvisibleUDFs("contractor")
		};
	};

	tf.contractorGridDefinition = new TF.GridDefinition.ContractorGridDefinition();
})();

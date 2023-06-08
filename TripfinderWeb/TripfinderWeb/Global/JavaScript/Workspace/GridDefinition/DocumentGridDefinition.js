(function()
{
	createNamespace("TF.GridDefinition").DocumentGridDefinition = DocumentGridDefinition;
	function DocumentGridDefinition()
	{

	}

	DocumentGridDefinition.prototype.gridDefinition = function()
	{
		return {
			Columns: [
				{
					FieldName: "FileType",
					DisplayName: "File Type",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "Name",
					DisplayName: "Name",
					Width: '190px',
					type: "string"
				},
				{
					FieldName: "FileName",
					DisplayName: "File Name",
					Width: '190px',
					type: "string"
				},
				{
					FieldName: "FileSizeKB",
					DisplayName: "Size (KB)",
					Width: '150px',
					type: "number"
				},
				{
					FieldName: "Description",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "DocumentClassificationName",
					DisplayName: "Classification",
					Width: '140px',
					type: "string",
					onlyForGrid: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.GeneralDataListsDocumentClassification
				},
				{
					FieldName: "LastUpdated",
					DisplayName: "Last Updated Date",
					Width: '150px',
					dbType: "datetime",
					type: "date",
					isUTC: true,
					template: function(item)
					{
						let dt = utcToClientTimeZone(item["LastUpdated"]);
						return dt.isValid() ? dt.format("MM/DD/YYYY") : "";
					},
				},
				{
					FieldName: "LastUpdatedName",
					DisplayName: "Last Updated By",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "AltsiteRelationshipCount",
					DisplayName: "Alternate Sites",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "ContactRelationshipCount",
					DisplayName: "Contacts",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "ContractorRelationshipCount",
					DisplayName: "Contractors",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "DistrictRelationshipCount",
					DisplayName: "Districts",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "FieldTripRelationshipCount",
					DisplayName: "Field Trips",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "GeoregionRelationshipCount",
					DisplayName: "Geo Regions",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "SchoolRelationshipCount",
					DisplayName: "Schools",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "StaffRelationshipCount",
					DisplayName: "Staff",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "StudentRelationshipCount",
					DisplayName: "Students",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "TripRelationshipCount",
					DisplayName: "Trips",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "TripStopRelationshipCount",
					DisplayName: "Trip Stops",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "VehicleRelationshipCount",
					DisplayName: "Vehicles",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "FieldTripTemplateRelationshipCount",
					DisplayName: "Field Trip Templates",
					Width: '150px',
					type: "integer"
				}
			].concat(tf.UDFDefinition.getAvailableWithCurrentDataSource("document")),
			InvisibleUDFColumns: tf.UDFDefinition.getInvisibleUDFs("document"),
			documentDeletion: function(value)
			{
				var baseDeletion = new TF.Executor.DocumentDeletion();
				return baseDeletion.execute(value);
			},
			documentEdit: function(entityType, entityId, value)
			{
				return tf.modalManager.showModal(
					new TF.Modal.DocumentModalViewModel({ parentType: entityType, parentId: entityId, documentId: value })
				);
			}
		}
	};
	DocumentGridDefinition.prototype.miniGridDefinition = function()
	{
		return {
			Columns: [
				{
					FieldName: "Name",
					DisplayName: "Name",
					Width: '190px',
					type: "string"
				},
				{
					FieldName: "FileName",
					DisplayName: "File Name",
					Width: '190px',
					type: "string"
				},
				{
					FieldName: "Description",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "DocumentClassificationName",
					DisplayName: "Classification",
					Width: '140px',
					type: "string",
					onlyForGrid: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.GeneralDataListsDocumentClassification
				},
				{
					FieldName: "AttachedCount",
					DisplayName: "Attached",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "FileSizeKB",
					DisplayName: "Size (KB)",
					Width: '150px',
					type: "number"
				},
				{
					FieldName: "LastUpdated",
					DisplayName: "Last Updated",
					Width: '150px',
					type: "date"
				},
				{
					FieldName: "LastUpdatedName",
					DisplayName: "Last Updated By",
					Width: '150px',
					type: "string"
				}
			],
			fileTypeFormatter: function(value)
			{
				var classCss = "glyphicon-picture";
				if (value === "image/jpeg")
				{
					classCss = "glyphicon-picture";
				}
				if (value === "application/pdf")
				{
					classCss = "glyphicon-list-alt";
				}
				return classCss;
			},
			documentDeletion: function(value)
			{
				var baseDeletion = new TF.Executor.DocumentDeletion();
				return baseDeletion.execute(value);
			},
			documentEdit: function(entityType, entityId, value)
			{
				return tf.modalManager.showModal(
					new TF.Modal.DocumentModalViewModel({ parentType: entityType, parentId: entityId, documentId: value })
				);
			}
		}
	};

	tf.documentGridDefinition = new TF.GridDefinition.DocumentGridDefinition();
})();


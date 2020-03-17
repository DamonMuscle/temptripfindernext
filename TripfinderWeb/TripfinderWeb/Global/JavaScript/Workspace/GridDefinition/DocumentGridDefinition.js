(function()
{
	createNamespace("TF.GridDefinition").DocumentGridDefinition = DocumentGridDefinition;
	function DocumentGridDefinition ()
	{

	}

	DocumentGridDefinition.prototype.gridDefinition = function()
	{
		return {
			Columns: [
				{
					FieldName: "MimeType",
					DisplayName: "File Icon",
					Width: '150px',
					type: "string",
					AllowFiltering: false,
					template: "<span class='glyphicon #:tf.documentGridDefinition.gridDefinition().fileTypeFormatter(MimeType)#'></span>"
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
					DisplayName: "Last Updated",
					Width: '150px',
					type: "date"
				},
				{
					FieldName: "LastUpdatedName",
					DisplayName: "Last Updated By",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "ContractorRelationshipCount",
					DisplayName: "Contractors",
					Width: '150px',
					type: "integer",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Contractor
				},
				{
					FieldName: "DistrictRelationshipCount",
					DisplayName: "Districts",
					Width: '150px',
					type: "integer",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.District
				},
				{
					FieldName: "FieldTripRelationshipCount",
					DisplayName: "Field Trips",
					Width: '150px',
					type: "integer",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.FieldTrip
				},
				{
					FieldName: "GeoregionRelationshipCount",
					DisplayName: "Geo Regions",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.GeoRegion
				},
				{
					FieldName: "SchoolRelationshipCount",
					DisplayName: "Schools",
					Width: '150px',
					type: "integer",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School
				},
				{
					FieldName: "StaffRelationshipCount",
					DisplayName: "Staff",
					Width: '150px',
					type: "integer",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Staff
				},
				{
					FieldName: "StudentRelationshipCount",
					DisplayName: "Students",
					Width: '150px',
					type: "integer",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Student
				},
				{
					FieldName: "TripRelationshipCount",
					DisplayName: "Trips",
					Width: '150px',
					type: "integer",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Trip
				},
				{
					FieldName: "TripStopRelationshipCount",
					DisplayName: "Trip Stops",
					Width: '150px',
					type: "integer",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.TripStop
				},
				{
					FieldName: "VehicleRelationshipCount",
					DisplayName: "Vehicles",
					Width: '150px',
					type: "integer",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Vehicle
				},
				{
					FieldName: "FieldTripTemplateRelationshipCount",
					DisplayName: "Field Trip Templates",
					Width: '150px',
					type: "integer",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.FieldTripTemplate
				},
				{
					FieldName: "Md5Hash",
					DisplayName: "Md5Hash",
					Width: '150px',
					type: "string",
					hidden: true
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
	DocumentGridDefinition.prototype.miniGridDefinition = function()
	{
		return {
			Columns: [
				{
					FieldName: "FileName",
					DisplayName: "File Name",
					Width: '190px',
					type: "string",
					template: function(data)
					{
						return data.FileName;
					}
				},
				{
					FieldName: "Description",
					Width: '150px',
					type: "string",
					isSortItem: true
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
					FieldName: "FieldTripRelationshipCount",
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


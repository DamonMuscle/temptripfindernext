(function()
{
	createNamespace("TF.GridDefinition").FieldTripGridDefinition = FieldTripGridDefinition;
	function FieldTripGridDefinition()
	{
	}

	FieldTripGridDefinition.prototype.gridDefinition = function()
	{
		return {
			Columns: [
				{
					FieldName: "ID",
					DisplayName: "FieldTripID",
					DBName: "FieldTripID",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "PublicId",
					DisplayName: "Public ID",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "FieldTripStageName",
					DisplayName: "Status",
					Width: '250px',
					type: "string",
					template: "<div style='height:15px;width:15px;margin-right:.5em;border:1px solid rgb(213, 213, 213);background-color:#: tf.fieldTripGridDefinition.gridDefinition().stageFormatter(data.FieldTripStageId)#;float:left'></div><span>#:FieldTripStageName||''#</span>"
				},
				{
					FieldName: "Name",
					DisplayName: "Name",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.FieldTrip
				},
				{
					FieldName: "DepartFromSchool",
					DisplayName: "Depart From",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "School",
					DisplayName: "School",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School.SchoolCode
				},
				{
					FieldName: "SchoolName",
					DisplayName: "School Name",
					Width: '250px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School
				},
				{
					FieldName: "ReturnDate",
					DisplayName: "Return Date",
					Width: '160px',
					type: "date",
				},
				{
					FieldName: "FieldTripContact",
					DisplayName: "Contact",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "ContactPhone",
					DisplayName: "Contact Phone",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "ContactPhoneExt",
					DisplayName: "Contact Phone Ext.",
					Width: '130px',
					type: "string"
				},
				{
					FieldName: "ContactEmail",
					DisplayName: "Contact Email",
					Width: '170px',
					type: "string",
					attributes: {
						"class": "k-link"
					}
				},
				{
					FieldName: "Notes",
					DisplayName: "Notes",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "Destination",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("FieldTripDestination", "fieldtrip", "Destination")
				},
				{
					FieldName: "DestinationContact",
					DisplayName: "Destination Contact",
					Width: '160px',
					type: "string"
				},
				{
					FieldName: "DestinationContactPhone",
					DisplayName: "Destination Contact Phone",
					Width: '190px',
					type: "string"
				},
				{
					FieldName: "DepartDate",
					DisplayName: "Departure Date",
					Width: '160px',
					type: "date"
				},
				{
					FieldName: "NumberOfStudents",
					DisplayName: "# Students",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "NumberOfAdults",
					DisplayName: "# Adults",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "NumberOfVehicles",
					DisplayName: "# Vehicles",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "NumberOfWheelChairs",
					DisplayName: "# Wheelchairs",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "EstimatedMiles",
					DisplayName: "Estimated " + tf.localization.UnitsOfMeasure,
					Width: '150px',
					type: "number"
				},
				{
					FieldName: "EstimatedHours",
					DisplayName: "Estimated Hours",
					Width: '150px',
					type: "number"
				},
				{
					FieldName: "EstimatedCost",
					DisplayName: "Estimated Cost",
					Width: '150px',
					type: "number"
				},
				{
					FieldName: "DepartTime",
					DisplayName: "Departure Time",
					Width: '160px',
					type: "time"
				},
				{
					FieldName: "ReturnTime",
					DisplayName: "Return Time",
					Width: '160px',
					type: "time"
				},
				{
					FieldName: "ClassificationName",
					DisplayName: "Classification",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.FieldTripClassification
				},
				{
					FieldName: "Ftactivity",
					DisplayName: "Activity",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.FieldTripActivity
				},
				{
					FieldName: "Ftequipment",
					DisplayName: "Equipment",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.FieldTripEquipment
				},

				{
					FieldName: "DestinationStreet",
					DisplayName: "Destination Street",
					Width: '130px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "DestinationCity",
					DisplayName: "Destination City",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoCity", "fieldtrip", "DestinationCity")
				},
				{
					FieldName: "DestinationState",
					DisplayName: "Destination " + tf.localization.AreaName,
					Width: '130px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "DestinationZip",
					DisplayName: "Destination " + tf.localization.Postal,
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoZipCode2", "fieldtrip", "DestinationZip")
				},
				{
					FieldName: "DirectionNotes",
					DisplayName: "Directions",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "DestinationNotes",
					DisplayName: "Destination Notes",
					Width: '180px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "DestinationContactTitle",
					DisplayName: "Destination Contact Title",
					Width: '180px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "DestinationPhoneExt",
					DisplayName: "Destination Phone Ext.",
					Width: '160px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "DestinationFax",
					DisplayName: "Destination Fax",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "DestinationEmail",
					DisplayName: "Destination Email",
					Width: '170px',
					type: "string",
					attributes: {
						"class": "k-link"
					},
					hidden: true
				},
				{
					FieldName: "DepartureNotes",
					DisplayName: "Departure Notes",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "DepartmentName",
					DisplayName: "Department",
					Width: '150px',
					type: "string",
					hidden: true,
					onlyForGrid: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("FieldTripDistrictDepartment", "fieldtrip", "DepartmentName")
				},
				{
					FieldName: "DistrictDepartmentID",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "DriverFixedCost",
					Width: '150px',
					type: "number",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "FieldTripAccountId",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "FieldTripActivityId",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "FieldTripClassificatoinId",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "FieldTripDestinationId",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "FieldTripEquipmentId",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "GUID",
					Width: '150px',
					type: "string",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "LastUpdated",
					DisplayName: "Last Updated Date",
					Width: '150px',
					type: "date",
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
					FieldName: "LastUpdatedName",
					DisplayName: "Last Updated By",
					Width: '150px',
					type: "string",
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
				},
				{
					FieldName: "PaymentDate",
					Width: '150px',
					type: "date",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "PublicNotes",
					Width: '150px',
					type: "string",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "PurchaseOrder",
					Width: '150px',
					type: "string",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "ShowPublic",
					Width: '150px',
					type: "boolean",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "VehFixedCost",
					Width: '150px',
					type: "number",
					hidden: true,
					onlyForFilter: true
				}
			],
			stageFormatter: function(value)
			{
				value = parseInt(value);
				switch (value)
				{
					case 1:
						return '#FFFF00';
					case 2:
					case 4:
					case 6:
					case 98:
						return '#FF0000';
					case 99:
						return '#00FF00';
					case 3:
						return '#E0A080';
					case 5:
						return '#FF00FF';
					case 7:
						return '#00FFFF';
					case 100:
						return '#FFFFFF';
					case 101:
						return '#0000FF';
					default:
						return '#FFFF00';
				}
			},
			stageNameFormatter: function(value)
			{
				value = parseInt(value);
				switch (value)
				{
					case 1:
						return "Level 1 - Request Submitted";
					case 2:
						return "Level 2 - Request Declined";
					case 4:
						return "Level 3 - Request Declined";
					case 6:
						return "Level 4 - Request Declined";
					case 98:
						return "Declined by Transportation";
					case 99:
						return "Transportation Approved";
					case 3:
						return "Level 2 - Request Approved";
					case 5:
						return "Level 3 - Request Approved";
					case 7:
						return "Level 4 - Request Approved";
					case 100:
						return "Canceled - Request Canceled";
					case 101:
						return "Completed - Request Completed";
					default:
						return "";
				}
			}
		};
	};

	FieldTripGridDefinition.prototype.getRelatedGridDefinition = function(type)
	{
		var obj = {};
		switch (type)
		{
			case "history":
				obj.Columns = [
					{
						FieldName: "FieldTripStageId",
						Width: '150px',
						DisplayName: "Status",
						type: "string",
						template: "<div style='height:15px;width:15px;margin-right:.5em;border:1px solid rgb(213, 213, 213);background-color:#: tf.fieldTripGridDefinition.gridDefinition().stageFormatter(data.FieldTripStageId)#;float:left'></div><span>#: tf.fieldTripGridDefinition.gridDefinition().stageNameFormatter(data.FieldTripStageId)#</span>"
					},
					{
						FieldName: "Notes",
						Width: '150px',
						DisplayName: "Notes",
						type: "string"
					},
					{
						FieldName: "TheDateTime",
						Width: '150px',
						DisplayName: "Updated Date Time",
						type: "datetime"
					},
					{
						FieldName: "UserName",
						Width: '150px',
						DisplayName: "Updated User Name",
						type: "string"
					}
				];
				break;
			case "resource":
				obj.Columns = [
					{
						FieldName: "VehicleName",
						Width: '150px',
						DisplayName: "Vehicle",
						type: "string"
					},
					{
						FieldName: "AideName",
						Width: '150px',
						DisplayName: "Bus Aide",
						type: "string"
					},
					{
						FieldName: "DriverName",
						Width: '150px',
						DisplayName: "Driver",
						type: "string"
					}
				];
				break;
			default:
				return null;
		}

		return obj;
	};

	tf.fieldTripGridDefinition = new TF.GridDefinition.FieldTripGridDefinition();
})();

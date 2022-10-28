(function()
{
	createNamespace("TF.GridDefinition").FieldTripTemplatesGridDefinition = FieldTripTemplatesGridDefinition;
	function FieldTripTemplatesGridDefinition()
	{
	}

	FieldTripTemplatesGridDefinition.prototype.gridDefinition = function()
	{
		return {
			Columns: [
				{
					field: "PublicId",
					title: "ID",
					width: '150px',
					type: "string"
				},
				{
					field: "FieldTripStageId",
					title: "Trip Stage",
					width: '250px',
					type: "string",
					template: "<div style='height:15px;width:15px;margin-right:.5em;border:1px solid rgb(213, 213, 213);background-color:#: tf.fieldTripTemplatesGridDefinition.gridDefinition().stageFormatter(data.FieldTripStageId)#;float:left'></div>"
				},
				{
					field: "Name",
					title: "Name",
					width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.FieldTripTemplate
				},
				{
					field: "DepartFromSchool",
					title: "Depart From",
					width: '150px',
					type: "string"
				},
				{
					field: "School",
					title: "School",
					width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School.SchoolCode
				},
				{
					field: "FieldTripContact",
					title: "Contact",
					width: '150px',
					type: "string"
				},
				{
					field: "ContactPhone",
					title: "Contact Phone",
					width: '150px',
					type: "string"
				},
				{
					field: "ContactPhoneExt",
					title: "Contact Phone Ext.",
					width: '130px',
					type: "string"
				},
				{
					field: "ContactEmail",
					title: "Contact Email",
					width: '170px',
					type: "string",
					attributes: {
						"class": "k-link"
					}
				},
				{
					field: "Notes",
					title: "Notes",
					width: '150px',
					type: "string"
				},
				{
					field: "Destination",
					width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.FieldTripDestination
				},
				{
					field: "DestinationContact",
					title: "Destination Contact",
					width: '160px',
					type: "string"
				},
				{
					field: "DestinationContactPhone",
					title: "Destination Contact Phone",
					width: '190px',
					type: "string"
				},
				{
					field: "NumberOfStudents",
					title: "# Students",
					width: '150px',
					type: "integer"
				},
				{
					field: "NumberOfAdults",
					title: "# Adults",
					width: '150px',
					type: "integer"
				},
				{
					field: "NumberOfVehicles",
					title: "# Vehicles",
					width: '150px',
					type: "integer"
				},
				{
					field: "NumberOfWheelChairs",
					title: "# Wheelchairs",
					width: '150px',
					type: "integer"
				},
				{
					field: "EstimatedDistance",
					title: "Estimated Distance",
					"UnitOfMeasureSupported": true,
					width: '150px',
					type: "number"
				},
				{
					field: "EstimatedHours",
					title: "Estimated Hours",
					width: '150px',
					type: "number"
				},
				{
					field: "EstimatedCost",
					title: "Estimated Cost",
					width: '150px',
					type: "number"
				},
				{
					field: "DestinationStreet",
					title: "Destination Street",
					width: '130px',
					type: "string",
					hidden: true
				},
				{
					field: "DestinationCity",
					title: "Destination City",
					width: '150px',
					type: "string",
					hidden: true
				},
				{
					field: "DestinationState",
					title: "Destination " + tf.localization.AreaName,
					width: '130px',
					type: "string",
					hidden: true
				},
				{
					field: "DestinationZip",
					title: "Destination " + tf.localization.Postal,
					width: '150px',
					type: "string",
					hidden: true
				},
				{
					field: "DirectionNotes",
					title: "Directions",
					width: '150px',
					type: "string",
					hidden: true
				},
				{
					field: "DestinationNotes",
					title: "Destination Notes",
					width: '180px',
					type: "string",
					hidden: true
				},
				{
					field: "DestinationContactTitle",
					title: "Destination Contact Title",
					width: '180px',
					type: "string",
					hidden: true
				},
				{
					field: "DestinationPhoneExt",
					title: "Destination Phone Ext.",
					width: '160px',
					type: "string",
					hidden: true
				},
				{
					field: "DestinationFax",
					title: "Destination Fax",
					width: '150px',
					type: "string",
					hidden: true
				},
				{
					field: "DestinationEmail",
					title: "Destination Email",
					width: '170px',
					type: "string",
					attributes: {
						"class": "k-link"
					},
					hidden: true
				},
				{
					field: "DepartureNotes",
					title: "Departure Notes",
					width: '150px',
					type: "string",
					hidden: true
				},

				{
					field: "FuelConsumptionRate",
					title: `Rate/${tf.measurementUnitConverter.getShortUnits()}`,
					"UnitOfMeasureSupported": true,
					"UnitOfMeasureReverse": true,
					width: '150px',
					type: "number",
					hidden: true
				},
				{
					field: "FixedCost",
					title: "Fixed Costs",
					width: '150px',
					type: "number",
					hidden: true
				},
				{
					field: "MinimumCost",
					title: "Minimum Costs",
					width: '150px',
					type: "number",
					hidden: true
				},
				{
					field: "DriverRate",
					title: "Driver Rate",
					width: '150px',
					type: "number",
					hidden: true
				},
				{
					field: "DriverOtrate",
					title: "Driver OT Rate",
					width: '150px',
					type: "number",
					hidden: true
				},
				{
					field: "AideRate",
					title: "Aide Rate",
					width: '150px',
					type: "number",
					hidden: true
				},
				{
					field: "AideOtrate",
					title: "Aide OT Rate",
					width: '160px',
					type: "number",
					hidden: true
				},
				{
					field: "DocumentAssociatedCount",
					title: "Document",
					width: '160px',
					type: "integer",
					hidden: true
				}
			],
			stageFormatter: function(value)
			{
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
						return '#00FF00';
					case 101:
						return '#0000FF';
					default:
						return '#FFFF00';
				}
			}
		};
	};

	tf.fieldTripTemplatesGridDefinition = new TF.GridDefinition.FieldTripTemplatesGridDefinition();

	//,[FieldTripClassificationID]
	//  ,[FieldTripActivityID]
	//  ,[FieldTripAccountID]
	//  ,[DistrictDepartmentID]
	//  ,
	//  ,[ShowPublic]
	//  ,[PublicNotes]
	//  ,[BillingClassificationID]
	//  ,[BillingNotes]

	//  ,[AideFixedCost]
	//  ,[DriverFixedCost]
	//  ,[VehFixedCost]

	//  ,[PurchaseOrder]
	//  ,[FieldTripEquipmentID]
	//  ,[FieldTripDestinationID]

	//  ,[TemplateStatus]
	//  ,[FieldTripName]
	//  ,[InvoiceAmountType]

	//  ,[LastUpdated]
	//  ,[LastUpdatedUserID]
	//  ,[LastUpdatedName]
	//  ,[LastUpdatedType]

})();

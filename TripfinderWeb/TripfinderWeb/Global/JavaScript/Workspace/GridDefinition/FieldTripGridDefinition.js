(function()
{
	createNamespace("TF.GridDefinition").FieldTripGridDefinition = FieldTripGridDefinition;
	const filters = [{
		Id: -1,
		Name: "Today",
		IsValid: true
	},
	{
		Id: -2,
		Name: "Vehicle Scheduled",
		IsValid: true
	},
	{
		Id: -3,
		Name: "Pending Approval",
		IsValid: true,
		WhereClause: " FieldTripStageId = 1 or FieldTripStageId = 3 or FieldTripStageId = 5 or FieldTripStageId = 7",
		GridType: self.type
	},
	{
		Id: -4,
		Name: "Declined",
		IsValid: true,
		WhereClause: "FieldTripStageId = 2 or FieldTripStageId = 4 or FieldTripStageId = 6 or FieldTripStageId = 98",
		GridType: self.type
	},
	{
		Id: -5,
		Name: "Total",
		IsValid: true,
		WhereClause: "FieldTripStageId != 100",
		GridType: self.type
	},
	{
		Id: -6,
		Name: "Transportation Approved",
		IsValid: true,
		WhereClause: "FieldTripStageId = 99",
		GridType: self.type
	}
	];
	const TEXT_FIXED_COST = "Fixed Cost";
	function FieldTripGridDefinition()
	{
		// constructor
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
					DisplayName: "ID",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "TotalAmount",
					DisplayName: "Total Amount",
					Width: '150px',
					type: "number"
				},
				{
					FieldName: "FieldTripStageName",
					DisplayName: "Status",
					Width: '250px',
					type: "string",
					template: `<div style='height:15px;width:15px;margin-right:.5em;border:1px solid rgb(213, 213, 213);
					background-color:#: tf.fieldTripGridDefinition.gridDefinition().stageFormatter(data.FieldTripStageId)#;float:left'></div><span>#:FieldTripStageName#</span>`
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
					type: "date"
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
					type: "string",
					template: function(item)
					{
						return tf.dataFormatHelper.phoneFormatter(item.ContactPhone) || '';
					}
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
					type: "string",
					template: function(item)
					{
						return tf.dataFormatHelper.phoneFormatter(item.DestinationContactPhone) || '';
					}
				},
				{
					FieldName: "DepartDate",
					DisplayName: "Departure Date",
					Width: '160px',
					type: "date"
				}
			].concat(this.getGridColumnsDefinationPart2())
				.concat(this.getGridColumnsDefinationPart3())
				.concat(tf.UDFDefinition.getAvailableWithCurrentDataSource("fieldtrip")),
			InvisibleUDFColumns: tf.UDFDefinition.getInvisibleUDFs("fieldtrip"),
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
						return '#964B00';
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

	FieldTripGridDefinition.prototype.getGridColumnsDefinationPart2 = function()
	{
		return [{
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
			FieldName: "DocumentCount",
			DisplayName: "# Documents",
			Width: '150px',
			type: "integer"
		},
		{
			FieldName: "EstimatedMiles",
			DisplayName: "Estimated Distance",
			UnitOfMeasureSupported: true,
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
			FieldName: "DriverName",
			DisplayName: "Driver",
			Width: '200px',
			type: "string",
			ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Staff.Driver.FirstNameInFront
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
			FieldName: "BillingClass",
			DisplayName: "Billing Classification",
			Width: '150px',
			type: "string",
			hidden: true,
			ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.FieldTripBillingClassification
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
			FieldName: "MileageRate",
			DisplayName: `Rate/${tf.measurementUnitConverter.getShortUnits()}`,
			UnitOfMeasureSupported: true,
			UnitOfMeasureReverse: true,
			Width: '150px',
			type: "number",
			hidden: true
		},
		{
			FieldName: "FixedCost",
			DisplayName: "Fixed Costs",
			Width: '150px',
			type: "number",
			hidden: true
		},
		{
			FieldName: "MinimumCost",
			DisplayName: "Minimum Costs",
			Width: '150px',
			type: "number",
			hidden: true
		}];
	}

	FieldTripGridDefinition.prototype.getGridColumnsDefinationPart3 = function()
	{
		return [{
			FieldName: "DriverRate",
			DisplayName: "Driver Rate",
			Width: '150px',
			type: "number",
			hidden: true
		},
		{
			FieldName: "DriverOtrate",
			DisplayName: "Driver OT Rate",
			Width: '150px',
			type: "number",
			hidden: true
		},
		{
			FieldName: "AideRate",
			DisplayName: "Aide Rate",
			Width: '150px',
			type: "number",
			hidden: true
		},
		{
			FieldName: "AideOtrate",
			DisplayName: "Aide OT Rate",
			Width: '160px',
			type: "number",
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
			FieldName: "BillingNotes",
			Width: '150px',
			type: "string",
			hidden: true,
			onlyForFilter: true
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
			type: "date"
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
			type: "string"
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
		}]
	}

	FieldTripGridDefinition.prototype.getSummaryFilters = function(subGridType)
	{
		if (subGridType && subGridType === "approvals")
		{
			return _.filter(filters, e => [-1, -2, -5].indexOf(e.Id) >= 0)
		}
		return filters;
	}
	FieldTripGridDefinition.prototype.getSummaryFunction = function(subGridType)
	{
		return function(selectGridFilterEntityId)
		{
			if (!selectGridFilterEntityId)
			{
				selectGridFilterEntityId = this.id;
			}
			var paramData = null;
			switch (selectGridFilterEntityId)
			{
				case -1:
				case -2:
					var today = new Date(), tomorrow = new Date();
					tomorrow.setTime(tomorrow.getTime() + 24 * 60 * 60 * 1000);
					var todayStr = `${today.getFullYear()}-${(today.getMonth() + 1)}-${today.getDate()}`,
						tomorrowStr = `${tomorrow.getFullYear()}-${(tomorrow.getMonth() + 1)}-${tomorrow.getDate()}`;
					paramData = {
						"@filter": `eq(FieldTripStageId,99)&lt(DepartDateTime,${tomorrowStr})&ge(EstimatedReturnDateTime,${todayStr})`,
						"@fields": "Id"
					}
					break;
				case -3:
					paramData = { "@filter": "in(FieldTripStageId,1,3,5,7)", "@fields": "Id" }
					break;
				case -4:
					paramData = { "@filter": "in(FieldTripStageId,2,4,6,8)", "@fields": "Id" }
					break;
				case -5:
					paramData = { "@filter": "noteq(FieldTripStageId,100)", "@fields": "Id" }
					break;
				case -6:
					paramData = { "@filter": "eq(FieldTripStageId,99)", "@fields": "Id" }
					break;
			}

			if (paramData)
			{
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), tf.DataTypeHelper.getEndpoint("fieldtrip")), { paramData: paramData }).then(function(response)
				{
					return response.Items.map(function(r)
					{
						return r.Id
					});
				});
			}

			return Promise.resolve(null);
		};
	}


	FieldTripGridDefinition.prototype.getRelatedGridDefinition = function(type)
	{
		var obj = {};
		switch (type)
		{
			case "history":
				obj.Columns = this._getHistoryDefinations();
				break;
			case "resource":
				obj.Columns = this._getResourceDefinations();
				break;
			case "driver":
				obj.Columns = this._getDriverDefinations();
				break;
			case "aide":
				obj.Columns = this._getAideDefinations();
				break;
			case "vehicle":
				obj.Columns = this._getVehicleDefinations();
				break;
			default:
				return null;
		}

		return obj;
	};

	FieldTripGridDefinition.prototype._getHistoryDefinations = function()
	{
		return [
			{
				FieldName: "FieldTripStageId",
				Width: '150px',
				DisplayName: "Status",
				type: "string",
				template: `<div style='height:15px;width:15px;margin-right:.5em;border:1px solid rgb(213, 213, 213);
						background-color:#: tf.fieldTripGridDefinition.gridDefinition().stageFormatter(data.FieldTripStageId)#;float:left'></div>
						<span>#: tf.fieldTripGridDefinition.gridDefinition().stageNameFormatter(data.FieldTripStageId)#</span>`
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
				type: "datetime",
				template: function(dataItem)
				{
					return moment(dataItem["TheDateTime"].toString("YYYY-MM-DD HH:mm:ss") + "Z").currentTimeZoneTimeFormat("MM/DD/YYYY hh:mm A");
				}
			},
			{
				FieldName: "UserName",
				Width: '150px',
				DisplayName: "Updated User Name",
				type: "string"
			}
		];
	}

	FieldTripGridDefinition.prototype._getResourceDefinations = function()
	{
		return [
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
			},
			{
				FieldName: "TotalCost",
				Width: '150px',
				DisplayName: "Total Cost",
				type: "number"
			}
		];
	}

	FieldTripGridDefinition.prototype._getDriverDefinations = function()
	{
		return [
			{
				FieldName: "DriverName",
				DisplayName: "Driver",
				Width: '150px',
				type: "string"
			},
			{
				FieldName: "DriverHours",
				DisplayName: "Hours",
				Width: '150px',
				type: "number",
				Precision: 2,
				format: "{0:0}"
			},
			{
				FieldName: "DriverRate",
				DisplayName: "Rate",
				Width: '150px',
				type: "number",
				Precision: 2,
				format: "{0:0.00}"
			},
			{
				FieldName: "DriverOTHours",
				DisplayName: "OT Hours",
				Width: '150px',
				type: "number",
				Precision: 2,
				format: "{0:0}"
			},
			{
				FieldName: "DriverOTRate",
				DisplayName: "OT Rate",
				Width: '150px',
				type: "number",
				Precision: 2,
				format: "{0:0.00}"
			},
			{
				FieldName: "DriverFixedCost",
				DisplayName: TEXT_FIXED_COST,
				Width: '150px',
				type: "number",
				Precision: 2,
				format: "{0:0.00}"
			},
			{
				FieldName: "DriverExpParking",
				DisplayName: "Parking Expense",
				Width: '150px',
				type: "number",
				Precision: 2,
				format: "{0:0.00}"
			},
			{
				FieldName: "DriverExpTolls",
				DisplayName: "Tolls Expense",
				Width: '150px',
				type: "number",
				Precision: 2,
				format: "{0:0.00}"
			},
			{
				FieldName: "DriverExpMeals",
				DisplayName: "Meals Expense",
				Width: '150px',
				type: "number",
				Precision: 2,
				format: "{0:0.00}"
			},
			{
				FieldName: "DriverExpMisc",
				DisplayName: "Misc Expense",
				Width: '150px',
				type: "number",
				Precision: 2,
				format: "{0:0.00}"
			},
			{
				FieldName: "DriverTotalCost",
				DisplayName: "Total",
				Width: '150px',
				type: "number",
				Precision: 2,
				format: "{0:0.00}"
			}
		];
	}

	FieldTripGridDefinition.prototype._getAideDefinations = function()
	{
		return [
			{
				FieldName: "AideName",
				DisplayName: "Bus Aide",
				Width: '150px',
				type: "string"
			},
			{
				FieldName: "AideHours",
				DisplayName: "Hours",
				Width: '150px',
				type: "number",
				Precision: 2,
				format: "{0:0}"
			},
			{
				FieldName: "AideRate",
				DisplayName: "Rate",
				Width: '150px',
				type: "number",
				Precision: 2,
				format: "{0:0.00}"
			},
			{
				FieldName: "AideOTHours",
				DisplayName: "OT Hours",
				Width: '150px',
				type: "number",
				Precision: 2,
				format: "{0:0}"
			},
			{
				FieldName: "AideOTRate",
				DisplayName: "OT Rate",
				Width: '150px',
				type: "number",
				Precision: 2,
				format: "{0:0.00}"
			},
			{
				FieldName: "AideFixedCost",
				DisplayName: TEXT_FIXED_COST,
				Width: '150px',
				type: "number",
				Precision: 2,
				format: "{0:0.00}"
			},
			{
				FieldName: "AideTotalCost",
				DisplayName: "Total",
				Width: '150px',
				type: "number",
				Precision: 2,
				format: "{0:0.00}"
			},
			{
				FieldName: "Chaperone",
				DisplayName: "Chaperone 1",
				Width: '150px',
				type: "string"
			},
			{
				FieldName: "Chaperone2",
				DisplayName: "Chaperone 2",
				Width: '150px',
				type: "string"
			},
			{
				FieldName: "Chaperone3",
				DisplayName: "Chaperone 3",
				Width: '150px',
				type: "string"
			},
			{
				FieldName: "Chaperone4",
				DisplayName: "Chaperone 4",
				Width: '150px',
				type: "string"
			}
		];
	}

	FieldTripGridDefinition.prototype._getVehicleDefinations = function()
	{
		return [
			{
				FieldName: "VehicleName",
				DisplayName: "Vehicle",
				Width: '150px',
				type: "string"
			},
			{
				FieldName: "StartingOdometer",
				DisplayName: "Odometer Start",
				Width: '150px',
				type: "number",
				Precision: 2,
				format: "{0:0}"
			},
			{
				FieldName: "EndingOdometer",
				DisplayName: "Odometer End",
				Width: '150px',
				type: "number",
				Precision: 2,
				format: "{0:0}"
			},
			{
				FieldName: "MileageRate",
				DisplayName: `Rate/${tf.measurementUnitConverter.getShortUnits()}`,
				Width: '150px',
				type: "number",
				Precision: 2,
				format: "{0:0.00}",
				UnitOfMeasureSupported: true,
				UnitOfMeasureReverse: true,
			},
			{
				FieldName: "VehFixedCost",
				DisplayName: TEXT_FIXED_COST,
				Width: '150px',
				type: "number",
				Precision: 2,
				format: "{0:0.00}"
			},
			{
				FieldName: "VehicleTotalCost",
				DisplayName: "Total",
				Width: '150px',
				type: "number",
				Precision: 2,
				format: "{0:0.00}"
			}
		];
	}

	tf.fieldTripGridDefinition = new TF.GridDefinition.FieldTripGridDefinition();
})();

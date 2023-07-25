(function ()
{
	createNamespace("TF.GridDefinition").FieldTripInvoicePageGridDefinition = FieldTripInvoicePageGridDefinition;
	function FieldTripInvoicePageGridDefinition()
	{

	}

	FieldTripInvoicePageGridDefinition.prototype.gridDefinition = function ()
	{
		function utc2Local(value)
		{
			const dt = utcToClientTimeZone(value);
			return dt.isValid() ? dt.format("MM/DD/YYYY hh:mm A") : "";
		}

		function datetimeFormat(value)
		{
			const dt = convertToMoment(value);
			return dt.isValid() ? dt.format("MM/DD/YYYY hh:mm A") : "";
		}

		return {
			Columns: [
				{
					FieldName: "PublicID",
					DisplayName: "Public ID",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "FieldTripName",
					DisplayName: "Field Trip Name",
					Width: '200px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.FieldTrip
				},
				{
					FieldName: "School",
					DisplayName: "School",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School.SchoolCode
				},
				{
					FieldName: "DepartDatetime",
					DisplayName: "Departure Date",
					Width: '150px',
					type: "date"
				},
				{
					FieldName: "FieldTripStageName",
					DisplayName: "Field Trip Status",
					Width: '250px',
					type: "string",
					template: function (item)
					{
						return item.FieldTripStageName ? `<div style='height:15px;width:15px;margin-right:.5em;border:1px solid rgb(213, 213, 213);background-color:${tf.fieldTripGridDefinition.gridDefinition().stageFormatter(item.FieldTripStageID)};float:left'></div><span>${item.FieldTripStageName}</span>` : ""
					}
				},
				{
					FieldName: "FieldTripAccountCode",
					DisplayName: "Field Trip Account Code",
					OriginalFieldName: "AccountName",
					Width: '150px',
					type: "string",
				},
				{
					FieldName: "Amount",
					DisplayName: "Amount",
					Width: '150px',
					type: "number"
				},
				{
					FieldName: "PurchaseOrder",
					DisplayName: "Purchase Order",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "InvoiceDate",
					DisplayName: "Invoice Date",
					Width: '150px',
					type: "date"
				},
				{
					FieldName: "PaymentDate",
					DisplayName: "Payment Date",
					Width: '150px',
					type: "date"
				},
				{
					FieldName: "SubmittedByName",
					DisplayName: "Field Trip Invoice Submitted By",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "LastUpdated",
					DisplayName: "Last Updated",
					Width: '150px',
					type: "datetime",
					hidden: true,
					isUTC: true,
					template: function (dataItem)
					{
						return utc2Local(dataItem["LastUpdated"]);
					}
				},
				{
					FieldName: "LastUpdatedUserLoginId",
					DisplayName: "Last Updated By",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "DepartFromSchool",
					DisplayName: "Field Trip Depart From School",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School.SchoolCode
				},
				{
					FieldName: "EstimatedReturnDatetime",
					DisplayName: "Field Trip Estimated Return Datetime",
					Width: '150px',
					type: "datetime",
					hidden: true,
					template: function (dataItem)
					{
						return datetimeFormat(dataItem["EstimatedReturnDatetime"]);
					}
				},
				{
					FieldName: "FieldTripClassificationCode",
					DisplayName: "Field Trip Classification",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.FieldTripClassification
				},
				{
					FieldName: "FieldTripActivityName",
					DisplayName: "Field Trip Activity Name",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "DistrictDepartmentName",
					DisplayName: "Field Trip District Department Name",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "Destination",
					DisplayName: "Field Trip Destination",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("FieldTripDestination", "fieldtrip", "Destination")
				},
				{
					FieldName: "EstimatedDistance",
					DisplayName: "Field Trip Estimated Distance",
					UnitOfMeasureSupported: true,
					Width: '150px',
					type: "number",
					hidden: true,
				},
				{
					FieldName: "EstimatedHours",
					DisplayName: "Field Trip Estimated Hours",
					Width: '150px',
					type: "number",
					hidden: true,
				},
				{
					FieldName: "EstimatedCost",
					DisplayName: "Field Trip Estimated Cost",
					Width: '150px',
					type: "number",
					hidden: true,
				},
				{
					FieldName: "BillingClassificationName",
					DisplayName: "Billing Classification Name",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.FieldTripBillingClassification
				},
				{
					FieldName: "FieldTripAccountDescription",
					DisplayName: "Field Trip Account Description",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "FieldTripAccountSchool",
					DisplayName: "Field Trip Account School",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School.SchoolCode
				},
				{
					FieldName: "FieldTripAccountDepartmentName",
					DisplayName: "Field Trip Account Department Name",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "FieldTripAccountFieldTripActivityName",
					DisplayName: "Field Trip Account Activity Name",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "FieldTripAccountActiveFromDate",
					DisplayName: "Field Trip Account Active From Date",
					Width: '150px',
					type: "date",
					hidden: true
				},
				{
					FieldName: "FieldTripAccountActiveToDate",
					DisplayName: "Field Trip Account Active To Date",
					Width: '150px',
					type: "date",
					hidden: true
				}
			]
		}
	};

	tf.fieldTripInvoicePageGridDefinition = new TF.GridDefinition.FieldTripInvoicePageGridDefinition();
})();
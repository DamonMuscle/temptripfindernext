(function()
{
	createNamespace("TF.GridDefinition").FieldTripAccountGridDefinition = FieldTripAccountGridDefinition;
	function FieldTripAccountGridDefinition()
	{

	}

	FieldTripAccountGridDefinition.prototype.gridDefinition = {
		Columns: [
			{
				field: "Code",
				title: "Code",
				defaultValue: "",
				type: "string"
			},
			{
				field: "Description",
				defaultValue: "",
				type: "string"
			},
			{
				field: "School",
				defaultValue: null,
				type: "string",
				hidden: true
			},
			{
				field: "SchoolName",
				defaultValue: null,
				type: "string"
			},
			{
				field: "DepartmentName",
				title: "Department",
				defaultValue: null,
				mappingField: "DepartmentId",
				type: "string"
			},
			{
				field: "FieldTripActivityName",
				title: "Activity",
				defaultValue: null,
				mappingField: "FieldTripActivityId",
				type: "string"
			},
			{
				field: "ActiveFromDate",
				title: "Active From",
				defaultValue: null,
				type: "date",
				format: "{0:MM/dd/yyyy}"
			},
			{
				field: "ActiveToDate",
				title: "Active To",
				defaultValue: null,
				type: "date",
				format: "{0:MM/dd/yyyy}"
			}
		]
	};

	tf.FieldTripAccountGridDefinition = new TF.GridDefinition.FieldTripAccountGridDefinition();
})();
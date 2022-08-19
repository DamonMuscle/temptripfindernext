(function()
{
	createNamespace("TF.GridDefinition").FieldTripBillingClassificationGridDefinition = FieldTripBillingClassificationGridDefinition;
	function FieldTripBillingClassificationGridDefinition()
	{

	}

	FieldTripBillingClassificationGridDefinition.prototype.gridDefinition = {
		Columns: [
			{
				field: "Classification",
				title: "Billing Classification",
				unique: true,
				defaultValue: "",
				type: "string",
				width: '150px'
			},
			{
				field: "MileageRate",
				title: () => `Rate/${tf.measurementUnitConverter.getShortUnits()}`,
				"UnitOfMeasureSupported": true,
				"UnitOfMeasureReverse": true,
				defaultValue: null,
				type: "number",
				width: '120px',
				Precision: 2,
				format: "{0:0.00}"
			},
			{
				field: "FixedCost",
				title: "Trip Fixed Cost",
				defaultValue: null,
				type: "number",
				width: '120px',
				Precision: 2,
				format: "{0:0.00}"
			},
			{
				field: "AideFixedCost",
				title: "Bus Aide Fixed Cost",
				type: "number",
				width: '150px',
				Precision: 2,
				format: "{0:0.00}"
			},
			{
				field: "DriverFixedCost",
				title: "Driver Fixed Cost",
				defaultValue: null,
				type: "number",
				width: '150px',
				Precision: 2,
				format: "{0:0.00}"
			},
			{
				field: "VehFixedCost",
				title: "Vehicle Fixed Cost",
				defaultValue: null,
				type: "number",
				width: '150px',
				Precision: 2,
				format: "{0:0.00}"
			},
			{
				field: "MinimumCost",
				title: "Minimum Cost",
				defaultValue: null,
				type: "number",
				width: '120px',
				Precision: 2,
				format: "{0:0.00}"
			},
			{
				field: "DriverRate",
				title: "Driver Rate",
				defaultValue: null,
				type: "number",
				width: '120px',
				Precision: 2,
				format: "{0:0.00}"
			},
			{
				field: "DriverOTRate",
				title: "Driver Overtime Rate",
				defaultValue: null,
				type: "number",
				width: '170px',
				Precision: 2,
				format: "{0:0.00}"
			},
			{
				field: "AideRate",
				title: "Aide Rate",
				defaultValue: null,
				type: "number",
				width: '120px',
				Precision: 2,
				format: "{0:0.00}"
			},
			{
				field: "AideOTRate",
				title: "Aide Overtime Rate",
				defaultValue: null,
				type: "number",
				width: '150px',
				Precision: 2,
				format: "{0:0.00}"
			}
		]
	};

	tf.FieldTripBillingClassificationGridDefinition = new TF.GridDefinition.FieldTripBillingClassificationGridDefinition();
})();
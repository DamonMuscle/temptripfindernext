(function()
{
	createNamespace("TF.GridDefinition").FieldTripHolidaysGridDefinition = FieldTripHolidaysGridDefinition;
	function FieldTripHolidaysGridDefinition()
	{

	}

	FieldTripHolidaysGridDefinition.prototype.gridDefinition = {
		Columns: [
			{
				field: "Holiday",
				title: "Holiday Dates",
				type: "date",
				unique: true,
				defaultValue: null,
				template: "#= kendo.toString(kendo.parseDate(Holiday, 'yyyy-MM-dd'), 'MM/dd/yyyy') #"
			}
		]
	};

	tf.FieldTripHolidaysGridDefinition = new TF.GridDefinition.FieldTripHolidaysGridDefinition();
})();
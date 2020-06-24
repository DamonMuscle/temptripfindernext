(function()
{
	createNamespace("TF.GridDefinition").FieldTripBlockOutTimesGridDefinition = FieldTripBlockOutTimesGridDefinition;
	function FieldTripBlockOutTimesGridDefinition()
	{

	}

	FieldTripBlockOutTimesGridDefinition.prototype.gridDefinition = {
		Columns: [
			{
				field: "From",
				title: "From Time",
				defaultValue: "",
				type: "Date",
				format: "{0:hh:mm tt}",
				parseFormats: ["HH:mm:ss"]
			},
			{
				field: "To",
				title: "To Time",
				defaultValue: "",
				type: "Date",
				format: "{0:hh:mm tt}",
				parseFormats: ["HH:mm:ss"]
			}
		]
	};

	tf.FieldTripBlockOutTimesGridDefinition = new TF.GridDefinition.FieldTripBlockOutTimesGridDefinition();
})();
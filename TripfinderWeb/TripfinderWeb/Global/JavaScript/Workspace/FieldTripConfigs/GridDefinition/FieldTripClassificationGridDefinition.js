(function()
{
	createNamespace("TF.GridDefinition").FieldTripClassificationGridDefinition = FieldTripClassificationGridDefinition;
	function FieldTripClassificationGridDefinition()
	{

	}

	FieldTripClassificationGridDefinition.prototype.gridDefinition = {
		Columns: [
			{
				field: "Code",
				title: "Code",
				type: "string",
				unique: true,
				defaultValue: "",
				width: '200px'
			},
			{
				field: "Description",
				defaultValue: "",
				type: "string"
			}
		]
	};

	tf.FieldTripClassificationGridDefinition = new TF.GridDefinition.FieldTripClassificationGridDefinition();
})();
(function()
{
	createNamespace("TF.GridDefinition").FieldTripActivityGridDefinition = FieldTripActivityGridDefinition;
	function FieldTripActivityGridDefinition()
	{

	}

	FieldTripActivityGridDefinition.prototype.gridDefinition = {
		Columns: [
			{
				field: "Name",
				title: "Code",
				width: '200px',
				unique: true,
				defaultValue: "",
				type: "string"
			},
			{
				field: "Description",
				defaultValue: "",
				type: "string"
			}
		]
	};

	tf.FieldTripActivityGridDefinition = new TF.GridDefinition.FieldTripActivityGridDefinition();
})();
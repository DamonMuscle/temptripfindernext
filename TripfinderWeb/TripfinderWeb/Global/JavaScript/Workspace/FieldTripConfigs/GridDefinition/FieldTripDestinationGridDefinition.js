(function()
{
	createNamespace("TF.GridDefinition").FieldTripDestinationGridDefinition = FieldTripDestinationGridDefinition;
	function FieldTripDestinationGridDefinition()
	{

	}

	FieldTripDestinationGridDefinition.prototype.gridDefinition = {
		Columns: [
			{
				field: "Name",
				title: "Destination",
				defaultValue: "",
				unique: true,
				type: "string",
				width: '150px'
			},
			{
				field: "City",
				defaultValue: "",
				type: "string",
				width: '120px'
			},
			{
				field: "Street",
				defaultValue: "",
				type: "string",
				width: '200px'
			},
			{
				field: "State",
				defaultValue: "",
				type: "string"
			},
			{
				field: "Zip",
				title: "Postal Code",
				defaultValue: "",
				type: "string"
			},
			{
				field: "Notes",
				defaultValue: "",
				type: "string",
				width: '200px'
			},
			{
				field: "Contact",
				title: "Contact",
				defaultValue: "",
				type: "string",
				width: '120px'
			},
			{
				field: "ContactTitle",
				title: "Title",
				defaultValue: "",
				type: "string"
			},
			{
				field: "Email",
				defaultValue: "",
				type: "string",
				width: '150px'
			},
			{
				field: "Phone",
				defaultValue: "",
				type: "string",
				width: '150px'
			},
			{
				field: "PhoneExt",
				title: "Phone Ext.",
				defaultValue: "",
				type: "string",
				width: '150px'
			},
			{
				field: "Fax",
				defaultValue: "",
				type: "string",
				width: '150px'
			}
		]
	};

	tf.FieldTripDestinationGridDefinition = new TF.GridDefinition.FieldTripDestinationGridDefinition();
})();
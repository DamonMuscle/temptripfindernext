(function()
{
	createNamespace("TF.GridDefinition").FieldTripDestinationGridDefinition = FieldTripDestinationGridDefinition;
	function FieldTripDestinationGridDefinition()
	{

	}

	FieldTripDestinationGridDefinition.prototype.gridDefinition = function () {
		var columns = [
			{
				FieldName: "Name",
				DisplayName: "Destination",
				defaultValue: "",
				unique: true,
				type: "string",
				Width: '150px'
			},
			{
				FieldName: "City",
				defaultValue: "",
				type: "string",
				Width: '120px'
			},
			{
				FieldName: "Street",
				defaultValue: "",
				type: "string",
				Width: '200px'
			},
			{
				FieldName: "State",
				defaultValue: "",
				type: "string"
			},
			{
				FieldName: "Zip",
				DisplayName: "Postal Code",
				defaultValue: "",
				type: "string"
			},
			{
				FieldName: "Notes",
				defaultValue: "",
				type: "string",
				Width: '200px'
			},
			{
				FieldName: "Contact",
				DisplayName: "Contact",
				defaultValue: "",
				type: "string",
				Width: '120px'
			},
			{
				FieldName: "ContactTitle",
				DisplayName: "Title",
				defaultValue: "",
				type: "string"
			},
			{
				FieldName: "Email",
				defaultValue: "",
				type: "string",
				Width: '150px'
			},
			{
				FieldName: "Phone",
				defaultValue: "",
				type: "string",
				Width: '150px'
			},
			{
				FieldName: "PhoneExt",
				DisplayName: "Phone Ext.",
				defaultValue: "",
				type: "string",
				Width: '150px'
			},
			{
				FieldName: "Fax",
				defaultValue: "",
				type: "string",
				Width: '150px'
			}
		];

		return {
			Columns: columns.concat(tf.UDFDefinition.getAvailableWithCurrentDataSource("location")),
			InvisibleUDFColumns: tf.UDFDefinition.getInvisibleUDFs("location")
		};
	};

	tf.fieldtripLocationGridDefinition = new TF.GridDefinition.FieldTripDestinationGridDefinition();
})();
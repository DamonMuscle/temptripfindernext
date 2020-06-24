(function()
{
	createNamespace("TF.GridDefinition").FieldTripDistrictDepartmentGridDefinition = FieldTripDistrictDepartmentGridDefinition;
	function FieldTripDistrictDepartmentGridDefinition()
	{

	}

	FieldTripDistrictDepartmentGridDefinition.prototype.gridDefinition = {
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

	tf.FieldTripDistrictDepartmentGridDefinition = new TF.GridDefinition.FieldTripDistrictDepartmentGridDefinition();
})();
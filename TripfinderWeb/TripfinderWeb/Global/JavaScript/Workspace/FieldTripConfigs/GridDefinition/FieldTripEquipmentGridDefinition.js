(function()
{
	createNamespace("TF.GridDefinition").FieldTripEquipmentGridDefinition = FieldTripEquipmentGridDefinition;
	function FieldTripEquipmentGridDefinition()
	{

	}

	FieldTripEquipmentGridDefinition.prototype.gridDefinition = {
		Columns: [
			{
				field: "EquipmentName",
				title: "Name",
				unique: true,
				defaultValue: "",
				type: "string"
			}
		]
	};

	tf.FieldTripEquipmentGridDefinition = new TF.GridDefinition.FieldTripEquipmentGridDefinition();
})();
(function()
{
	createNamespace("TF.GridDefinition").FieldTripGridConfigs = FieldTripGridConfigs;

	var _FT_CONFIG_METADATAS = [
		{
			name: "Holidays",
			singular: "Holiday",
			plural: "Holidays",
			value: "hol",
			apiEndpoint: "FieldTripHolidays",
			hasDBID: false,
			type: "FieldTripHolidays",
			definition: tf.FieldTripHolidaysGridDefinition.gridDefinition,
			editorContentTemplate: "Workspace/FieldTripConfigs/Modal/EditFieldTripHolidayRecord",
			editorViewModelType: "EditFieldTripHolidayRecordViewModel"
		},
		{
			name: "Block Out Times",
			singular: "Block Out Time",
			plural: "Block Out Times",
			value: "blt",
			apiEndpoint: "FieldTripBlockOuts",
			hasDBID: false,
			type: "FieldTripBlockOuts",
			definition: tf.FieldTripBlockOutTimesGridDefinition.gridDefinition,
			editorContentTemplate: "Workspace/FieldTripConfigs/Modal/EditFieldTripBlockOutTimeRecord",
			editorViewModelType: "EditFieldTripBlockOutTimeRecordViewModel"
		},
		{
			name: "District Departments",
			singular: "District Department",
			plural: "District Departments",
			value: "dep",
			apiEndpoint: "DistrictDepartments",
			hasDBID: false,
			type: "DistrictDepartments",
			definition: tf.FieldTripDistrictDepartmentGridDefinition.gridDefinition,
			editorContentTemplate: "Workspace/FieldTripConfigs/Modal/EditFieldTripDistrictDepartmentRecord",
			editorViewModelType: "EditFieldTripDistrictDepartmentRecordViewModel"
		},
		{
			name: "Activity",
			singular: "Activity",
			plural: "Activities",
			value: "act",
			apiEndpoint: "FieldTripActivities",
			hasDBID: true,
			type: "FieldTripActivities",
			definition: tf.FieldTripActivityGridDefinition.gridDefinition,
			editorContentTemplate: "Workspace/FieldTripConfigs/Modal/EditFieldTripActivityRecord",
			editorViewModelType: "EditFieldTripActivityRecordViewModel"
		},
		{
			name: "Account/Billing Codes",
			singular: "Account/Billing Code",
			plural: "Account/Billing Codes",
			value: "abc",
			apiEndpoint: "FieldTripAccounts",
			hasDBID: true,
			relationshipStr: "all",
			type: "FieldTripAccounts",
			definition: tf.FieldTripAccountGridDefinition.gridDefinition,
			editorContentTemplate: "Workspace/FieldTripConfigs/Modal/EditFieldTripAcountRecord",
			editorViewModelType: "EditFieldTripAccountRecordViewModel"
		},
		{
			name: "Billing Classification",
			singular: "Billing Classification",
			plural: "Billing Classifications",
			value: "bc",
			apiEndpoint: "FieldTripBillingClassifications",
			hasDBID: true,
			type: "FieldTripBillingClassifications",
			definition: tf.FieldTripBillingClassificationGridDefinition.gridDefinition,
			editorContentTemplate: "Workspace/FieldTripConfigs/Modal/EditFieldTripBillingClassificationRecord",
			editorViewModelType: "EditFieldTripBillingClassificationRecordViewModel"
		},
		{
			name: "Equipment",
			singular: "Equipment",
			plural: "Field Trip Equipments",
			value: "equ",
			apiEndpoint: "FieldTripEquipments",
			hasDBID: true,
			type: "FieldTripEquipments",
			definition: tf.FieldTripEquipmentGridDefinition.gridDefinition,
			editorContentTemplate: "Workspace/FieldTripConfigs/Modal/EditFieldTripEquipmentRecord",
			editorViewModelType: "EditFieldTripEquipmentRecordViewModel"
		},
		{
			name: "Classification",
			singular: "Classification",
			plural: "Classifications",
			value: "cla",
			apiEndpoint: "FieldTripClassifications",
			hasDBID: true,
			type: "FieldTripClassifications",
			definition: tf.FieldTripClassificationGridDefinition.gridDefinition,
			editorContentTemplate: "Workspace/FieldTripConfigs/Modal/EditFieldTripClassificationRecord",
			editorViewModelType: "EditFieldTripClassificationRecordViewModel"
		},
		{
			name: "Destination",
			singular: "Destination",
			plural: "Destinations",
			value: "des",
			apiEndpoint: "FieldTripDestinations",
			hasDBID: true,
			relationshipStr: "all",
			type: "FieldTripDestinations",
			definition: tf.FieldTripDestinationGridDefinition.gridDefinition,
			editorContentTemplate: "Workspace/FieldTripConfigs/Modal/EditFieldTripDestinationRecord",
			editorViewModelType: "EditFieldTripDestinationRecordViewModel"
		}
		// ,
		// {
		// 	name: "Field Trip Templates",
		// 	singular: "Field Trip Template",
		// 	plural: "Field Trip Templates",
		// 	value: "tem",
		// 	noDBID: false,
		// 	type: "FieldTripInvoiceTemplates",
		// 	definition: tf.fieldTripTemplatesGridDefinition.gridDefinition()
		// }
	];

	function FieldTripGridConfigs()
	{
	}

	FieldTripGridConfigs.prototype.gridDefinitions = function()
	{
		return _FT_CONFIG_METADATAS;
	};

	FieldTripGridConfigs.prototype.getConfigMetadataBykey = function(key)
	{
		var matchedItems = _FT_CONFIG_METADATAS.filter(function(md)
		{
			return md && md.value === key;
		});

		if (matchedItems.length === 1)
		{
			return matchedItems[0];
		}

		return null;
	};

	tf.FieldTripGridConfigs = new TF.GridDefinition.FieldTripGridConfigs();
})();
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
			editorContentTemplate: "Workspace/Page/FieldTripConfigs/Modal/EditFieldTripHolidayRecord",
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
			editorContentTemplate: "Workspace/Page/FieldTripConfigs/Modal/EditFieldTripBlockOutTimeRecord",
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
			editorContentTemplate: "Workspace/Page/FieldTripConfigs/Modal/EditFieldTripDistrictDepartmentRecord",
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
			editorContentTemplate: "Workspace/Page/FieldTripConfigs/Modal/EditFieldTripActivityRecord",
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
			editorContentTemplate: "Workspace/Page/FieldTripConfigs/Modal/EditFieldTripAcountRecord",
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
			editorContentTemplate: "Workspace/Page/FieldTripConfigs/Modal/EditFieldTripBillingClassificationRecord",
			editorViewModelType: "EditFieldTripBillingClassificationRecordViewModel",
			handleResponse: function(items)
			{
				if (tf.measurementUnitConverter.isNeedConversion())
				{
					const unitColumns = tf.FieldTripBillingClassificationGridDefinition.gridDefinition.Columns.filter(({ UnitOfMeasureSupported }) => UnitOfMeasureSupported);
					items.forEach(item =>
					{
						unitColumns.forEach(column =>
						{
							item[column.field] = tf.measurementUnitConverter.handleColumnUnitOfMeasure(item, column);
						});
					});
				}
				return items;
			}
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
			editorContentTemplate: "Workspace/Page/FieldTripConfigs/Modal/EditFieldTripEquipmentRecord",
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
			editorContentTemplate: "Workspace/Page/FieldTripConfigs/Modal/EditFieldTripClassificationRecord",
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
			editorContentTemplate: "Workspace/Page/FieldTripConfigs/Modal/EditFieldTripDestinationRecord",
			editorViewModelType: "EditFieldTripDestinationRecordViewModel",
			disabled: true
		},
		{
			name: "Template",
			singular: "Template",
			plural: "Templates",
			value: "tem",
			hasDBID: true,
			type: "FieldTripTemplates",
			definition: tf.fieldTripTemplatesGridDefinition.liteGridDefinition,
			editorContentTemplate: "Workspace/Page/FieldTripConfigs/Modal/EditFieldTripTemplateRecord",
			editorViewModelType: "EditFieldTripTemplateRecordViewModel",
			sizeCss: "modal-dialog-md",
			apiEndpoint: "FieldTripTemplates",
			relationshipStr: "FieldTripSchool,FieldTripDepartment,FieldTripActivity,FieldTripDeparture",
			disabled: true,
			handleResponse: function(items)
			{
				items.sort(function(a, b)
				{
					return (a.Name || "").toLowerCase() > (b.Name || "").toLowerCase() ? 1 : -1;
				});

				return items.map(item => ({
					...item,
					FieldTripActivityName: item.FieldTripActivity && item.FieldTripActivity.Name,
					FieldTripDepartureName: item.FieldTripDeparture && item.FieldTripDeparture.Name,
					FieldTripDepartmentName: item.FieldTripDepartment && item.FieldTripDepartment.Name,
					FieldTripSchoolName: item.FieldTripSchool && item.FieldTripSchool.Name,
					TemplateStatusName: item.TemplateStatus ? "Inactive" : "Active"
				}));
			}
		}
	];

	function FieldTripGridConfigs()
	{
	}

	FieldTripGridConfigs.prototype.gridDefinitions = function()
	{
		return _FT_CONFIG_METADATAS.sort(function(a, b)
		{
			return (a.name).toLowerCase() > (b.name).toLowerCase() ? 1 : -1;
		});;
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
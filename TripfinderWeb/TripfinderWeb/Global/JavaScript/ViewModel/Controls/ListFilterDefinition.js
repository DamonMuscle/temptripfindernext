(function()
{
	createNamespace('TF').ListFilterDefinition = ListFilterDefinition;

	function ListFilterDefinition()
	{ }
	ListFilterDefinition.ListFilterTemplate = {};

	var ListFilterTemplateDefaultOption = {
		listFilterType: 'WithSearchGrid',
		DisplayFilterTypeName: "",
		GridType: "",
		filterField: ""
	};

	ListFilterDefinition.ListFilterTemplate.FieldTrip = $.extend(
		{}, ListFilterTemplateDefaultOption,
		{
			DisplayFilterTypeName: "Field Trips",
			GridType: "FieldTrip",
			filterField: "Name",
			getUrl: function()
			{
				return pathCombine(tf.api.apiPrefix(), "search", "fieldTrip");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.School = $.extend(
		{}, ListFilterTemplateDefaultOption,
		{
			DisplayFilterTypeName: "Schools",
			GridType: "School",
			filterField: "Name",
			getUrl: function()
			{
				return pathCombine(tf.api.apiPrefix(), "search", "school");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.School.SchoolCode = $.extend(
		{}, TF.ListFilterDefinition.ListFilterTemplate.School,
		{
			filterField: "School"
		}, true);

	StaffTypeIdDict = {
		"BusAide": 1,
		"Driver": 2
	};

	var ListFilterTemplateDataManagementOption = $.extend(
		{}, ListFilterTemplateDefaultOption,
		{
			editCurrentDefinitionColumns: true
		}, true);

	ListFilterDefinition.ListFilterTemplate.FieldTripActivity = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "Field Trip Activities",
			GridType: "FieldTripActivity",
			filterField: "Name",
			getUrl: function()
			{
				return pathCombine(tf.api.apiPrefix(), "search", "FieldTripActivity");
			}
		}, true);


	ListFilterDefinition.ListFilterTemplate.FieldTripBillingClassification = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "Field Trip Billing Classifications",
			GridType: "FieldTripBillingClassification",
			filterField: "Name",
			getUrl: function()
			{
				return pathCombine(tf.api.apiPrefix(), "search", "FieldTripBillingClassification");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.FieldTripClassification = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "Field Trip Classifications",
			GridType: "FieldTripClassification",
			filterField: "Name",
			getUrl: function()
			{
				return pathCombine(tf.api.apiPrefix(), "search", "fieldtripclassification");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.FieldTripDistrictDepartment = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "District Departments",
			GridType: "FieldTripDistrictDepartment",
			filterField: "Name",
			getUrl: function()
			{
				return pathCombine(tf.api.apiPrefix(), "search", "FieldTripDistrictDepartment");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.FieldTripDestination = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "Field Trip Destinations",
			GridType: "FieldTripDestination",
			filterField: "Name",
			getUrl: function()
			{
				return pathCombine(tf.api.apiPrefix(), "search", "FieldTripDestination");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.FieldTripEquipment = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "Field Trip Equipment",
			GridType: "FieldTripEquipment",
			filterField: "EquipmentName",
			getUrl: function()
			{
				return pathCombine(tf.api.apiPrefix(), "search", "FieldTripEquipment");
			}
		}, true);

	var ListFilterTemplateMapDataOption = $.extend(
		{}, ListFilterTemplateDefaultOption,
		{
			listFilterType: 'MapData',
			editCurrentDefinitionColumns: false,
			leftGridWithSearch: true
		}, true);

	ListFilterDefinition.ListFilterTemplate.GeoCity = $.extend(
		{}, ListFilterTemplateMapDataOption,
		{
			DisplayFilterTypeName: "Cities",
			GridType: "GeoCity",
			filterField: "Item",
			getUrl: function()
			{
				return pathCombine(tf.api.apiPrefix(), "mailingcity");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.GeoCity2 = $.extend(
		{}, ListFilterTemplateMapDataOption,
		{
			DisplayFilterTypeName: "Geo Cities",
			GridType: "GeoCity",
			filterField: "Item",
			getUrl: function()
			{
				return pathCombine(tf.api.apiPrefix(), "mailingcity");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.GeoZipCode = function(gridType, fieldName)
	{
		return $.extend(
			{}, ListFilterTemplateMapDataOption,
			{
				DisplayFilterTypeName: "Geo Zip Codes",
				GridType: "GeoZipCode",
				requestMethod: "post",
				getUrl: function()
				{
					return pathCombine(tf.api.apiPrefix(), "search", gridType, "aggregate") + "?" + $.param(
						{
							FieldName: fieldName,
							AggregateOperator: "Distinct"
						});
				}
			}, true);
	};

	ListFilterDefinition.ListFilterTemplate.GeoZipCode2 = $.extend(
		{}, TF.ListFilterDefinition.ListFilterTemplate.GeoZipCode,
		{
			DisplayFilterTypeName: "Zip Codes"
		}, true);

	ListFilterDefinition.ListFilterTemplate.DistinctListValue = function(listFilterColumnSourceName, gridType, fieldName)
	{
		var tmp = TF.ListFilterDefinition.ListFilterTemplate[listFilterColumnSourceName];
		if ((typeof (tmp)) === 'function')
			tmp = tmp();

		return $.extend(
			{}, ListFilterTemplateMapDataOption,
			{
				isDistinctListTemplate: true,
				DisplayFilterTypeName: tmp.DisplayFilterTypeName,
				GridType: tmp.GridType,
				requestMethod: "post",
				getUrl: function()
				{
					return pathCombine(tf.api.apiPrefix(), "search", gridType, "aggregate") + "?" + $.param(
						{
							FieldName: fieldName,
							AggregateOperator: "Distinct"
						});
				}
			}, true);
	};

	var ListFilterTemplateEnumOption = {
		listFilterType: 'Enum',
		sortType: 'byAllItems',
		DisplayFilterTypeName: '',
		AllItems: [],
		leftGridWithSearch: true
	};

	ListFilterDefinition.ColumnSource = {};

	ListFilterDefinition.ColumnSource.FieldTrip = [
		{
			FieldName: "DepartDate",
			DisplayName: "Departure Date",
			Width: "160px",
			type: "date",
			isSortItem: true,
			sortIdx: 1,
			template: function(dataItem)
			{
				return moment(dataItem.DepartDateTime).format("MM/DD/YYYY");
			}
		},
		{
			FieldName: "DepartTime",
			DisplayName: "Departure Time",
			Width: "160px",
			type: "time",
			isSortItem: true,
			sortIdx: 2,
			template: function(dataItem)
			{
				return moment(dataItem.DepartDateTime).format("hh:mm A");
			}
		},
		{
			FieldName: "DepartFromSchool",
			DisplayName: "Depart From",
			Width: "150px",
			type: "string",
			isSortItem: true,
			sortIdx: 3
		},
		{
			FieldName: "Name",
			DisplayName: "Name",
			Width: "150px",
			type: "string",
			isSortItem: true,
			sortIdx: 4
		},
		{
			FieldName: "DestinationStreet",
			DisplayName: "Destination Street",
			Width: "130px",
			type: "string"
		},
		{
			FieldName: "ReturnDate",
			DisplayName: "Return Date",
			Width: "160px",
			type: "date",
			template: function(dataItem)
			{
				return moment(dataItem.EstimatedReturnDateTime).format("MM/DD/YYYY");
			}
		},
		{
			FieldName: "ReturnTime",
			DisplayName: "Return Time",
			Width: "160px",
			type: "time",
			template: function(dataItem)
			{
				return moment(dataItem.EstimatedReturnDateTime).format("hh:mm A");
			}
		}];

	ListFilterDefinition.ColumnSource.School = [
		{
			FieldName: "Name",
			Width: '290px',
			type: "string",
			isSortItem: true
		},
		{
			FieldName: "School",
			DisplayName: "School Code",
			Width: '150px',
			type: "string"
		}];

	ListFilterDefinition.ColumnSource.FieldTripActivity = [
		{
			FieldName: "Name",
			DisplayName: "Code",
			type: "string",
			isSortItem: true
		},
		{
			FieldName: "Description",
			Width: '200px',
			type: "string"
		}];

	ListFilterDefinition.ColumnSource.FieldTripBillingClassification = [
		{
			FieldName: "Name",
			DisplayName: "Classification",
			type: "string",
			isSortItem: true
		}];

	ListFilterDefinition.ColumnSource.FieldTripClassification = [
		{
			FieldName: "Name",
			DisplayName: "Code",
			Width: "160px",
			type: "string",
			isSortItem: true
		},
		{
			FieldName: "Description",
			Width: "160px",
			type: "string"
		}];

	ListFilterDefinition.ColumnSource.FieldTripDistrictDepartment = [
		{
			FieldName: "Name",
			DisplayName: "Code",
			type: "string",
			isSortItem: true
		},
		{
			FieldName: "Description",
			Width: '200px',
			type: "string"
		}];
	ListFilterDefinition.ColumnSource.FieldTripDestination = [
		{
			FieldName: "Name",
			type: "string",
			isSortItem: true
		}];
	ListFilterDefinition.ColumnSource.FieldTripEquipment = [
		{
			FieldName: "EquipmentName",
			DisplayName: "Name",
			type: "string",
			isSortItem: true
		},
		{
			FieldName: "EquipmentDescription",
			DisplayName: "Description",
			Width: '200px',
			type: "string"
		}];
	ListFilterDefinition.ColumnSource.GeoCity = [
		{
			FieldName: "Item",
			DisplayName: "Name",
			Width: "160px",
			type: "string",
			isSortItem: true
		}];

	ListFilterDefinition.ColumnSource.GeoZipCode = [
		{
			FieldName: "Item",
			DisplayName: "Name",
			Width: "160px",
			type: "string",
			isSortItem: true
		}];
})();

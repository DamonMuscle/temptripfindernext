(function ()
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

	function getFullName(nameDisplayFirst, nameDisplayLast, splitStr)
	{
		return [nameDisplayFirst, nameDisplayLast].filter(x => x).join(splitStr);
	}

	ListFilterDefinition.ListFilterTemplate.GPSEventType = $.extend(
		{}, ListFilterTemplateDefaultOption,
		{
			DisplayFilterTypeName: "Events",
			GridType: "GPSEventType",
			filterField: "EventTypeName",
			editCurrentDefinitionColumns: true,
			getUrl: function ()
			{
				// TODO-V2, need to remove
				return pathCombine(tf.api.apiPrefix(), "search", "gpsEventType");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.BusfinderHistoricalVehicle = $.extend(
		{}, ListFilterTemplateDefaultOption,
		{
			DisplayFilterTypeName: "Vehicles",
			GridType: "BusfinderHistoricalVehicle",
			filterField: "BusNum",
			editCurrentDefinitionColumns: true,
			getUrl: function ()
			{
				return pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint("vehicle"));
			},
			setLeftGridRequestURL: function (obShowEnabled, type)
			{
				// TODO-V2, need to research
				if (obShowEnabled)
					return pathCombine(tf.api.apiPrefix(), "search", "onroadvehicle");
				else
					return pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint("vehicle"));
			},
			setLeftGridRequestOption: function (requestOptions, obShowEnabled)
			{
				requestOptions = TF.Control.KendoListMoverWithSearchControlViewModel.prototype.setLeftRequestOption.call(this, requestOptions);

				if (obShowEnabled)
					requestOptions.paramData.time = toISOStringWithoutTimeZone(moment().currentTimeZoneTime());

				// add filter item for ticket view-1399
				requestOptions.data.filterSet = requestOptions.data.filterSet ||
				{
					FilterItems: [],
					FilterSets: [],
					LogicalOperator: "and"
				};
				filterItem = {
					FieldName: "Gpsid",
					Operator: "IsNotNull",
					Value: ""
				};
				requestOptions.data.filterSet.FilterItems.push(filterItem);

				return requestOptions;
			},
			displayCheckbox: true,
			filterCheckboxText: "Vehicles on the Road"
		}, true);

	ListFilterDefinition.ListFilterTemplate.AlternateSite = $.extend(
		{}, ListFilterTemplateDefaultOption,
		{
			DisplayFilterTypeName: "Alternate Sites",
			GridType: "AlternateSite",
			filterField: "Name",
			getUrl: function ()
			{
				// TODO-V2, need to remove
				return pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint("altsite"));
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.Contractor = $.extend(
		{}, ListFilterTemplateDefaultOption,
		{
			DisplayFilterTypeName: "Contractors",
			GridType: "Contractor",
			filterField: "Name",
			getUrl: function ()
			{
				return pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint("contractor"));
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.StaffContractorName = $.extend(
		{}, ListFilterTemplateDefaultOption,
		{
			DisplayFilterTypeName: "Contractor Name",
			GridType: "Staff",
			filterField: "ContractorName",
			serverPaging: false,
			columnSources: [
				{
					FieldName: "ContractorName",
					Width: '260px',
					type: "string",
					isSortItem: true
				}],
			getUrl: function()
			{
				return pathCombine(tf.api.apiPrefix(), "search", tf.dataTypeHelper.getEndpoint("staff"));
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.District = $.extend(
		{}, ListFilterTemplateDefaultOption,
		{
			DisplayFilterTypeName: "Districts",
			GridType: "District",
			filterField: "Name",
			getUrl: function ()
			{
				// TODO-V2, need to remove
				return pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint("district"));
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.District.District = $.extend(
		{}, ListFilterDefinition.ListFilterTemplate.District,
		{
			DisplayFilterTypeName: "District Codes",
			filterField: "District"
		}, true);

	ListFilterDefinition.ListFilterTemplate.District.District2 = $.extend(
		{}, ListFilterDefinition.ListFilterTemplate.District,
		{
			DisplayFilterTypeName: "Districts",
			filterField: "District"
		}, true);

	ListFilterDefinition.ListFilterTemplate.GeoRegion = $.extend(
		{}, ListFilterTemplateDefaultOption,
		{
			DisplayFilterTypeName: "Geo Regions",
			GridType: "GeoRegion",
			filterField: "Name",
			getUrl: function ()
			{
				// TODO-V2, need to remove
				return pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint("georegion"));
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.Trip = $.extend(
		{}, ListFilterTemplateDefaultOption,
		{
			DisplayFilterTypeName: "Trips",
			GridType: "Trip",
			filterField: "Name",
			getUrl: function ()
			{
				// TODO-V2, need to remove
				return pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint("trip"));
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.FieldTrip = $.extend(
		{}, ListFilterTemplateDefaultOption,
		{
			DisplayFilterTypeName: "Field Trips",
			GridType: "FieldTrip",
			filterField: "Name",
			getUrl: function ()
			{
				return pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint("fieldTrip"));
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.TripAlias = $.extend(
		{}, ListFilterTemplateDefaultOption,
		{
			DisplayFilterTypeName: "Trip Aliases",
			GridType: "TripAlias",
			filterField: "Item",
			getUrl: function ()
			{
				// TODO-V2, need to remove
				return pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint("tripAlias"));
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.TripStop = $.extend(
		{}, ListFilterTemplateDefaultOption,
		{
			DisplayFilterTypeName: "Trip Stops",
			GridType: "TripStop",
			filterField: "Name",
			getUrl: function ()
			{
				// TODO-V2, need to remove
				return pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint("tripStop"));
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.TripStop.Street = $.extend(
		{}, ListFilterDefinition.ListFilterTemplate.TripStop,
		{
			filterField: "Street"
		}, true);

	ListFilterDefinition.ListFilterTemplate.School = $.extend(
		{}, ListFilterTemplateDefaultOption,
		{
			DisplayFilterTypeName: "Schools",
			GridType: "School",
			filterField: "Name",
			getUrl: function ()
			{
				return pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint("school"));
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.School.SchoolCode = $.extend(
		{}, TF.ListFilterDefinition.ListFilterTemplate.School,
		{
			filterField: "School"
		}, true);

	ListFilterDefinition.ListFilterTemplate.School.Name = $.extend(
		{}, TF.ListFilterDefinition.ListFilterTemplate.School,
		{
			filterField: "Name"
		}, true);

	ListFilterDefinition.ListFilterTemplate.School.TransferSchool = $.extend(
		{}, TF.ListFilterDefinition.ListFilterTemplate.School,
		{
			DisplayFilterTypeName: "Schools",
			filterField: "School",
			setLeftGridRequestOption: function (requestOptions)
			{
				requestOptions.data.filterSet = requestOptions.data.filterSet ||
				{
					FilterItems: [],
					FilterSets: [],
					LogicalOperator: "and"
				};
				filterItem = {
					FieldName: "Tschl",
					Operator: "EqualTo",
					Value: "true"
				};
				requestOptions.data.filterSet.FilterItems.push(filterItem);
				return requestOptions;
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.Staff = $.extend(
		{}, ListFilterTemplateDefaultOption,
		{
			DisplayFilterTypeName: "Staff",
			GridType: "Staff",
			filterField: function (item)
			{
				return getFullName(item.LastName, item.FirstName, ', ')
			},
			getUrl: function ()
			{
				return pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint("staff"));
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.Staff.LastName = $.extend(
		{}, TF.ListFilterDefinition.ListFilterTemplate.Staff,
		{
			filterField: "LastName"
		}, true);

	ListFilterDefinition.ListFilterTemplate.Staff.FirstName = $.extend(
		{}, TF.ListFilterDefinition.ListFilterTemplate.Staff,
		{
			filterField: "FirstName"
		}, true);

	ListFilterDefinition.ListFilterTemplate.Staff.MiddleName = $.extend(
		{}, TF.ListFilterDefinition.ListFilterTemplate.Staff,
		{
			filterField: "MiddleName"
		}, true);

	ListFilterDefinition.ListFilterTemplate.Staff.Driver = $.extend(
		{}, TF.ListFilterDefinition.ListFilterTemplate.Staff,
		{
			DisplayFilterTypeName: "Staff",
			getUrl: function ()
			{
				return pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint("staff") + "?staffType=Driver");
			},
			setLeftGridRequestOption: function (requestOptions)
			{
				requestOptions.paramData = requestOptions.paramData ||
					{};
				requestOptions.paramData.staffTypeId = StaffTypeIdDict["Driver"];
				return requestOptions;
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.Staff.Driver.DriverName = $.extend(
		{}, TF.ListFilterDefinition.ListFilterTemplate.Staff.Driver,
		{
			filterField: function (item)
			{
				return getFullName(item.LastName, item.FirstName, ' ')
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.Staff.Driver.FirstNameInFront = $.extend(
		{}, TF.ListFilterDefinition.ListFilterTemplate.Staff.Driver,
		{
			filterField: function (item)
			{
				return getFullName(item.FirstName, item.LastName, ' ')
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.Staff.BusAide = $.extend(
		{}, TF.ListFilterDefinition.ListFilterTemplate.Staff,
		{
			DisplayFilterTypeName: "Staff",//"Bus Aides",
			getUrl: function ()
			{
				return pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint("staff") + "?staffType=Bus Aide");
			},
			setLeftGridRequestOption: function (requestOptions)
			{
				requestOptions.paramData = requestOptions.paramData ||
					{};
				requestOptions.paramData.staffTypeId = StaffTypeIdDict["BusAide"];
				return requestOptions;
			}
		}, true);

	StaffTypeIdDict = {
		"BusAide": 1,
		"Driver": 2
	};

	ListFilterDefinition.ListFilterTemplate.Student = $.extend(
		{}, ListFilterTemplateDefaultOption,
		{
			DisplayFilterTypeName: "Students",
			GridType: "Student",
			filterField: "Name",
			getUrl: function ()
			{
				return pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint("student"));
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.Vehicle = $.extend(
		{}, ListFilterTemplateDefaultOption,
		{
			DisplayFilterTypeName: "Vehicles",
			GridType: "Vehicle",
			filterField: "BusNum",
			getUrl: function ()
			{
				return pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint("vehicle"));
			}
		}, true);

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
			getUrl: function ()
			{
				return pathCombine(tf.api.apiPrefix(), "search", "FieldTripActivities");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.FieldTripAccountBillingCode = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "Field Trip Account Billing Codes",
			GridType: "FieldTripAccountBillingCode",
			filterField: "Name",
			getUrl: function ()
			{
				return pathCombine(tf.api.apiPrefix(), "search", "fieldtripaccounts");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.FieldTripBillingClassification = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "Field Trip Billing Classifications",
			GridType: "FieldTripBillingClassification",
			filterField: "Classification",
			getUrl: function ()
			{
				return pathCombine(tf.api.apiPrefix(), "search", "FieldTripBillingClassifications");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.FieldTripClassification = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "Field Trip Classifications",
			GridType: "FieldTripClassification",
			filterField: "Code",
			getUrl: function ()
			{
				return pathCombine(tf.api.apiPrefix(), "search", "fieldtripclassifications");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.FieldTripDistrictDepartment = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "District Departments",
			GridType: "FieldTripDistrictDepartment",
			filterField: "Name",
			getUrl: function ()
			{
				return pathCombine(tf.api.apiPrefix(), "search", "DistrictDepartments");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.FieldTripDestination = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "Field Trip Destinations",
			GridType: "FieldTripDestination",
			filterField: "Name",
			getUrl: function ()
			{
				return pathCombine(tf.api.apiPrefix(), "search", "FieldTripDestinations");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.FieldTripEquipment = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "Field Trip Equipment",
			GridType: "FieldTripEquipment",
			filterField: "EquipmentName",
			getUrl: function ()
			{
				return pathCombine(tf.api.apiPrefix(), "search", "FieldTripEquipments");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.FieldTripTemplate = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "Field Trip Templates",
			GridType: "FieldTripTemplate",
			filterField: "Name",
			getUrl: function ()
			{
				return pathCombine(tf.api.apiPrefix(), "search", "FieldTripTemplates");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.VehicleBodyType = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "Body Types",
			GridType: "VehicleBodyType",
			filterField: "Item",
			getUrl: function ()
			{
				// TODO-V2, need to remove
				return pathCombine(tf.api.apiPrefix(), "search", "VehicleBodyType");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.VehicleBrakeType = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "Brake Types",
			GridType: "VehicleBrakeType",
			filterField: "Item",
			getUrl: function ()
			{
				// TODO-V2, need to remove
				return pathCombine(tf.api.apiPrefix(), "search", "VehicleBrakeType");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.VehicleCategory = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "Categories",
			GridType: "VehicleCategory",
			filterField: "Item",
			getUrl: function ()
			{
				// TODO-V2, need to remove
				return pathCombine(tf.api.apiPrefix(), "search", "VehicleCategory");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.VehicleEquipementCode = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "Equipement Codes",
			GridType: "VehicleEquipementCode",
			filterField: "Code",
			getUrl: function ()
			{
				// TODO-V2, need to remove
				return pathCombine(tf.api.apiPrefix(), "search", "vehicleequipment");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.VehicleFuelType = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "Fuel Types",
			GridType: "VehicleFuelType",
			filterField: "Item",
			getUrl: function ()
			{
				// TODO-V2, need to remove
				return pathCombine(tf.api.apiPrefix(), "search", "VehicleFuelType");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.VehicleMake = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "Makes",
			GridType: "VehicleMake",
			filterField: "Item",
			getUrl: function ()
			{
				// TODO-V2, need to remove
				return pathCombine(tf.api.apiPrefix(), "search", "VehicleMake");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.VehicleMakeBody = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "Makes of Bodies",
			GridType: "VehicleMakeBody",
			filterField: "Item",
			getUrl: function ()
			{
				// TODO-V2, need to remove
				return pathCombine(tf.api.apiPrefix(), "search", "VehicleMakeOfBody");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.VehicleModel = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "Models",
			GridType: "VehicleModel",
			filterField: "Item",
			getUrl: function ()
			{
				// TODO-V2, need to remove
				return pathCombine(tf.api.apiPrefix(), "search", "VehicleModel");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.GeneralDataListsDisabilityCode = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "Disability Codes",
			GridType: "GeneralDataListsDisabilityCode",
			filterField: "Code",
			getUrl: function ()
			{
				return pathCombine(tf.api.apiPrefix(), "search", "disabilitycodes");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.GeneralDataListsEthnicCode = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "Ethnic Codes",
			GridType: "GeneralDataListsEthnicCode",
			filterField: "Code",
			getUrl: function ()
			{
				return pathCombine(tf.api.apiPrefix(), "search", "ethniccodes");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.GeneralDataListsDocumentClassification = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "Document Classifications",
			GridType: "GeneralDataListsDocumentClassification",
			filterField: "Name",
			getUrl: function ()
			{
				return pathCombine(tf.api.apiPrefix(), "search", "documentClassifications");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.GeneralDataListsNEZ = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "NEZ",
			GridType: "GeneralDataListsNEZ",
			filterField: "Name",
			getUrl: function ()
			{
				// TODO-V2, need to remove
				return pathCombine(tf.api.apiPrefix(), "search", "dataListsNEZ");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.GeneralDataListsTripAlias = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "Trip Aliases",
			GridType: "GeneralDataListsTripAlias",
			filterField: "Item",
			getUrl: function ()
			{
				// TODO-V2, need to remove
				return pathCombine(tf.api.apiPrefix(), "search", "tripAlias");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.Route = $.extend(
		{}, ListFilterTemplateDefaultOption,
		{
			DisplayFilterTypeName: "Routes",
			GridType: "Route",
			filterField: "Name",
			getUrl: function ()
			{
				return pathCombine(tf.api.apiPrefix(), "search", tf.dataTypeHelper.getEndpoint("route"));
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.GeneralDataListsGeoRegionType = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "Geo Region Type",
			GridType: "GeneralDataListsGeoRegionType",
			filterField: "Name",
			getUrl: function ()
			{
				// TODO-V2, need to remove
				return pathCombine(tf.api.apiPrefix(), "search", "georegiontype");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.GeneralDataListsCities = $.extend(
		{}, ListFilterTemplateDataManagementOption,
		{
			DisplayFilterTypeName: "Cities",
			GridType: "GeoCity",
			filterField: "Item",
			getUrl: function ()
			{
				return pathCombine(tf.api.apiPrefix(), "search", "cities");
			}
		}, true);

	var ListFilterTemplateMapDataOption = $.extend(
		{}, ListFilterTemplateDefaultOption,
		{
			listFilterType: 'MapData',
			editCurrentDefinitionColumns: false,
			leftGridWithSearch: true
		}, true);

	ListFilterDefinition.ListFilterTemplate.Mapset = $.extend(
		{}, ListFilterTemplateMapDataOption,
		{
			DisplayFilterTypeName: "Map Sets",
			GridType: "Mapset",
			filterField: "GeoCounty",
			getUrl: function ()
			{
				// TODO-V2, need to remove
				return pathCombine(tf.api.apiPrefixWithoutDatabase(), "mapdata", "mapsetandzipcode");
			},
			modifySource: function (source)
			{
				var geoDataSource = source[0];
				var geoCounties = Object.keys(geoDataSource);
				geoCounties = geoCounties.map(function (geoCounty)
				{
					return {
						Id: geoCounty,
						GeoCounty: geoCounty
					};
				});
				return geoCounties;
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.Mapset2 = $.extend(
		{}, TF.ListFilterDefinition.ListFilterTemplate.Mapset,
		{
			DisplayFilterTypeName: "Map Set/Counties"
		}, true);

	ListFilterDefinition.ListFilterTemplate.GeoCity = $.extend(
		{}, ListFilterTemplateMapDataOption,
		{
			DisplayFilterTypeName: "Cities",
			GridType: "GeoCity",
			filterField: "Item",
			getUrl: function ()
			{
				return pathCombine(tf.api.apiPrefixWithoutDatabase(), "mailingcities");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.GeoCity2 = $.extend(
		{}, ListFilterTemplateMapDataOption,
		{
			DisplayFilterTypeName: "Geo Cities",
			GridType: "GeoCity",
			filterField: "Item",
			getUrl: function ()
			{
				return pathCombine(tf.api.apiPrefixWithoutDatabase(), "mailingcities");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.GeneralDataListsMailingCity = $.extend(
		{}, TF.ListFilterDefinition.ListFilterTemplate.GeoCity,
		{
			DisplayFilterTypeName: "Mailing Cities",
		}, true);

	ListFilterDefinition.ListFilterTemplate.GeneralDataListsMailingState = $.extend(
		{}, ListFilterTemplateMapDataOption,
		{
			DisplayFilterTypeName: "Mailing State/Provinces",
			GridType: "MailingState",
			filterField: "Item",
			getUrl: function ()
			{
				return pathCombine(tf.api.apiPrefix(), "mailingstate");
			}
		}, true);

	ListFilterDefinition.ListFilterTemplate.GeoZipCode = function (gridType, fieldName)
	{
		return $.extend(
			{}, ListFilterTemplateMapDataOption,
			{
				DisplayFilterTypeName: "Geo Zip Codes",
				GridType: "GeoZipCode",
				requestMethod: "post",
				getUrl: function ()
				{
					return pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint(gridType), "aggregate") + "?" + $.param(
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

	ListFilterDefinition.ListFilterTemplate.DistinctListValue = function (listFilterColumnSourceName, gridType, fieldName)
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
				getUrl: function ()
				{
					return pathCombine(tf.api.apiPrefix(), "search", tf.DataTypeHelper.getEndpoint(gridType), "aggregate") + "?" + $.param(
						{
							FieldName: fieldName,
							AggregateOperator: "Distinct"
						});
				}
			}, true);
	};

	ListFilterDefinition.ListFilterTemplate.GeneralDataListsMailingZipCode = function (gridType, fieldName)
	{
		return $.extend(
			{}, TF.ListFilterDefinition.ListFilterTemplate.GeoZipCode(gridType, fieldName),
			{
				DisplayFilterTypeName: "Mailing Zip Codes",
			}, true);
	};

	var ListFilterTemplateEnumOption = {
		listFilterType: 'Enum',
		sortType: 'byAllItems',
		DisplayFilterTypeName: '',
		AllItems: [],
		leftGridWithSearch: true
	};

	ListFilterDefinition.ListFilterTemplate.TripType = $.extend(
		{}, ListFilterTemplateEnumOption,
		{
			DisplayFilterTypeName: "Trip Type",
			AllItems: ['To School', 'From School', 'Shuttle']
		}, true);

	ListFilterDefinition.ListFilterTemplate.StaffTypes = $.extend(
		{}, ListFilterTemplateDefaultOption,
		{
			DisplayFilterTypeName: "Staff Types",
			GridType: "StaffTypes",
			filterField: "StaffTypeName",
			serverPaging: false,
			getUrl: function()
			{
				return pathCombine(tf.api.apiPrefixWithoutDatabase(), "stafftypes");
			},
		}, true);

	function GenerateGenderListFilter(filedName)
	{
		return $.extend(
			{}, ListFilterTemplateDefaultOption,
			{
				DisplayFilterTypeName: "Gender",
				GridType: "Genders",
				filterField: filedName || "Code",
				showRemoveColumnButton: false,
				serverPaging: false,
				getUrl: function()
				{
					return pathCombine(tf.api.apiPrefixWithoutDatabase(), "genders");
				},
			}, true);
	}


	
	ListFilterDefinition.ListFilterTemplate.Gender = GenerateGenderListFilter();

	ListFilterDefinition.ListFilterTemplate.Grades = $.extend(
		{}, ListFilterTemplateEnumOption,
		{
			DisplayFilterTypeName: "Grades",
			EnumListFilterColumnName: "Grade",
			AllItems: ['S', 'P', 'PA', 'PP', 'K', 'KA', 'KP', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', 'G']
		}, true);

	ListFilterDefinition.ListFilterTemplate.DaysOfTheWeek = $.extend(
		{}, ListFilterTemplateEnumOption,
		{
			DisplayFilterTypeName: "Days of the Week",
			EnumListFilterColumnName: "Day of the Week",
			AllItems: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
		}, true);

	ListFilterDefinition.ListFilterTemplate.OnPathStatuses = $.extend(
		{}, ListFilterTemplateEnumOption,
		{
			DisplayFilterTypeName: "On Path Statuses",
			EnumListFilterColumnName: "On Path Status",
			AllItems: ['On Path', 'Off Path', 'n/a']
		}, true);

	ListFilterDefinition.ListFilterTemplate.AtSpeedStatuses = $.extend(
		{}, ListFilterTemplateEnumOption,
		{
			DisplayFilterTypeName: "At Speed Statuses",
			EnumListFilterColumnName: "At Speed Status",
			AllItems: ['At Speed', 'Over Speed Limit', 'Under Speed Limit', 'n/a']
		}, true);

	ListFilterDefinition.ListFilterTemplate.AtStopStatuses = $.extend(
		{}, ListFilterTemplateEnumOption,
		{
			DisplayFilterTypeName: "At Stop Statuses",
			EnumListFilterColumnName: "At Stop Status",
			AllItems: ['Planned Stop', 'Unplanned Stop', 'n/a']
		}, true);

	ListFilterDefinition.ListFilterTemplate.Directions = $.extend(
		{}, ListFilterTemplateEnumOption,
		{
			DisplayFilterTypeName: "Directions",
			EnumListFilterColumnName: "Heading",
			AllItems: ['North', 'NorthEast', 'East', 'SouthEast', 'South', 'SouthWest', 'West', 'NorthWest']
		}, true);

	ListFilterDefinition.ListFilterTemplate.OnTimeForStopStatuses = $.extend(
		{}, ListFilterTemplateEnumOption,
		{
			DisplayFilterTypeName: "On Time for Stop Statuses",
			EnumListFilterColumnName: "On Time Status",
			AllItems: ['Early', 'Late', 'On Time', 'n/a']
		}, true);

	//-----------------------------------------------------------------------------

	ListFilterDefinition.ColumnSource = {};

	ListFilterDefinition.ColumnSource.AlternateSite = [
		{
			FieldName: "Name",
			Width: '260px',
			type: "string",
			isSortItem: true
		},
		{
			FieldName: "Public",
			Width: '150px',
			type: "boolean"
		}];
	ListFilterDefinition.ColumnSource.Contractor = [
		{
			FieldName: "Name",
			Width: '260px',
			type: "string",
			isSortItem: true
		},
		{
			FieldName: "Contact",
			Width: '150px',
			type: "string"
		}];
	ListFilterDefinition.ListFilterTemplate.StaffContractorName = $.extend(
		{}, ListFilterTemplateDefaultOption,
		{
			DisplayFilterTypeName: "Contractor Name",
			GridType: "Staff",
			filterField: "ContractorName",
			serverPaging: false,
			columnSources: [
				{
					FieldName: "ContractorName",
					Width: '260px',
					type: "string",
					isSortItem: true
				}],
			getUrl: function ()
			{
				return pathCombine(tf.api.apiPrefix(), "search", tf.dataTypeHelper.getEndpoint("staff"));
			}
		}, true);
	ListFilterDefinition.ColumnSource.District = [
		{
			FieldName: "Name",
			Width: '260px',
			type: "string",
			isSortItem: true
		},
		{
			FieldName: "District",
			Width: '150px',
			type: "string"
		},
		{
			FieldName: "Contact",
			Width: '150px',
			type: "string"
		}];

	ListFilterDefinition.ColumnSource.StaffGridDistrict = [
		{
			FieldName: "Name",
			Width: '260px',
			type: "string",
			isSortItem: true
		},
		{
			FieldName: "District",
			Width: '150px',
			type: "string"
		}];
		
	ListFilterDefinition.ColumnSource.StaffGridStaffTypes = [
		{
			FieldName: "StaffTypeName",
			Width: '260px',
			type: "string",
			isSortItem: true
		}];		

	ListFilterDefinition.ColumnSource.Gender = [
		{
			FieldName: "Code",
			DisplayName: "Gender",
			type: "string",
			isSortItem: true,
			filterable: false
		}];		
	ListFilterDefinition.ColumnSource.GeoRegion = [
		{
			FieldName: "Name",
			Width: '250px',
			type: "string",
			isSortItem: true
		},
		{
			FieldName: "Georegiontype",
			DisplayName: "Geo Region Type",
			Width: '140px',
			type: "string"
		}];

	ListFilterDefinition.ColumnSource.FieldTrip = [
		{
			FieldName: "DepartDate",
			DisplayName: "Departure Date",
			Width: "160px",
			type: "date",
			isSortItem: true,
			sortIdx: 1,
			template: function (dataItem)
			{
				let date = moment(dataItem.DepartDateTime);
				return date.isValid() ? date.format("MM/DD/YYYY") : "";
			}
		},
		{
			FieldName: "DepartTime",
			DisplayName: "Departure Time",
			Width: "160px",
			type: "time",
			isSortItem: true,
			sortIdx: 2,
			template: function (dataItem)
			{
				let date = moment(dataItem.DepartDateTime);
				return date.isValid() ? date.format("hh:mm A") : "";
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
			template: function (dataItem)
			{
				let date = moment(dataItem.EstimatedReturnDateTime);
				return date.isValid() ? date.format("MM/DD/YYYY") : "";
			}
		},
		{
			FieldName: "ReturnTime",
			DisplayName: "Return Time",
			Width: "160px",
			type: "time",
			template: function (dataItem)
			{
				let date = moment(dataItem.EstimatedReturnDateTime);
				return date.isValid() ? date.format("hh:mm A") : "";
			}
		}];

	ListFilterDefinition.ColumnSource.Trip = [
		{
			FieldName: "Name",
			Width: "150px",
			type: "string",
			isSortItem: true,
			sortIdx: 1,
		},
		{
			FieldName: "StartTime",
			DisplayName: "Start Time",
			Width: "150px",
			type: "time",
			isSortItem: true,
			sortIdx: 2
		},
		{
			FieldName: "EndTime",
			DisplayName: "End Time",
			Width: "150px",
			type: "time"
		},
		{
			FieldName: "Schools",
			Width: "150px",
			type: "string",
			template: "#: tf.tripGridDefinition.gridDefinition().formatter(Schools)#"
		},
		{
			FieldName: "DriverName",
			DisplayName: "Driver",
			Width: "160px",
			type: "string"
		},
		{
			FieldName: "VehicleName",
			DisplayName: "Vehicle",
			Width: "150px",
			type: "string"
		}];

	ListFilterDefinition.ColumnSource.TripAlias = [
		{
			FieldName: "Item",
			DisplayName: "Name",
			Width: '200px',
			type: "string",
			isSortItem: true
		}];
	ListFilterDefinition.ColumnSource.TripStop = [
		{
			FieldName: "Name",
			DisplayName: "Trip Name",
			Width: '350px',
			type: "string",
			isSortItem: true
		},
		{
			FieldName: "Street",
			Width: '330px',
			type: "string"
		},
		{
			FieldName: "StopTime",
			DisplayName: "Stop Time",
			Width: '150px',
			type: "time"
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
	ListFilterDefinition.ColumnSource.Staff = [
		{
			FieldName: "LastName",
			DisplayName: "Last Name",
			Width: '150px',
			type: "string",
			isSortItem: true
		},
		{
			FieldName: "FirstName",
			DisplayName: "First Name",
			Width: '150px',
			type: "string",
			isSortItem: true
		}];
	ListFilterDefinition.ColumnSource.Student = [
		{
			FieldName: "LastName",
			DisplayName: "Last Name",
			Width: '150px',
			type: "string",
			isSortItem: true
		},
		{
			FieldName: "FirstName",
			DisplayName: "First Name",
			Width: '150px',
			type: "string",
			isSortItem: true
		}];
	ListFilterDefinition.ColumnSource.Vehicle = [
		{
			FieldName: "BusNum",
			DisplayName: "Vehicle",
			DBName: "Bus_Num",
			Width: '150px',
			type: "string",
			isSortItem: true
		},
		{
			FieldName: "Vin",
			DisplayName: "VIN",
			Width: '150px',
			type: "string"
		},
		{
			FieldName: "LicensePlate",
			DisplayName: "License Plate",
			Width: '150px',
			type: "string"
		},
		{
			FieldName: "MakeBody",
			DisplayName: "Make Body",
			Width: '150px',
			type: "string"
		},
		{
			FieldName: "Model",
			Width: '150px',
			type: "string"
		}];

	// todo-----------------
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

	ListFilterDefinition.ColumnSource.FieldTripAccountBillingCode = [
		{
			FieldName: "Name",
			DisplayName: "Code",
			type: "string",
			isSortItem: true
		},
		{
			FieldName: "School",
			type: "string"
		},
		{
			FieldName: "Department",
			type: "string"
		},
		{
			FieldName: "FieldTripActivity",
			DisplayName: "Activity",
			type: "string"
		},
		{
			FieldName: "ActiveFromDate",
			DisplayName: "Active From",
			type: "date"
		},
		{
			FieldName: "ActiveToDate",
			DisplayName: "Active To",
			type: "date"
		}];

	ListFilterDefinition.ColumnSource.FieldTripClassification = [
		{
			FieldName: "Code",
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
	ListFilterDefinition.ColumnSource.FieldTripTemplate = [
		{
			FieldName: "Name",
			DisplayName: "Name",
			type: "string",
			isSortItem: true
		}];
	ListFilterDefinition.ColumnSource.VehicleBodyType = [
		{
			FieldName: "Item",
			DisplayName: "Name",
			Width: '200px',
			type: "string",
			isSortItem: true
		}];
	ListFilterDefinition.ColumnSource.VehicleBrakeType = [
		{
			FieldName: "Item",
			DisplayName: "Name",
			Width: '200px',
			type: "string",
			isSortItem: true
		}];
	ListFilterDefinition.ColumnSource.VehicleCategory = [
		{
			FieldName: "Item",
			DisplayName: "Name",
			Width: '200px',
			type: "string",
			isSortItem: true
		}];
	ListFilterDefinition.ColumnSource.VehicleEquipementCode = [
		{
			FieldName: "Code",
			DisplayName: "Code",
			type: "string",
			isSortItem: true
		},
		{
			FieldName: "Description",
			Width: '200px',
			type: "string"
		}];
	ListFilterDefinition.ColumnSource.VehicleFuelType = [
		{
			FieldName: "Item",
			DisplayName: "Name",
			Width: '200px',
			type: "string",
			isSortItem: true
		}];
	ListFilterDefinition.ColumnSource.VehicleMake = [
		{
			FieldName: "Item",
			DisplayName: "Name",
			Width: '200px',
			type: "string",
			isSortItem: true
		}];
	ListFilterDefinition.ColumnSource.VehicleMakeBody = [
		{
			FieldName: "Item",
			DisplayName: "Name",
			Width: '200px',
			type: "string",
			isSortItem: true
		}];
	ListFilterDefinition.ColumnSource.VehicleModel = [
		{
			FieldName: "Item",
			DisplayName: "Name",
			Width: '200px',
			type: "string"
		}];
	ListFilterDefinition.ColumnSource.GeneralDataListsDisabilityCode = [
		{
			FieldName: "Code",
			DisplayName: "Code",
			type: "string",
			isSortItem: true
		},
		{
			FieldName: "Description",
			Width: '200px',
			type: "string"
		}];
	ListFilterDefinition.ColumnSource.GeneralDataListsEthnicCode = [
		{
			FieldName: "Code",
			DisplayName: "Code",
			type: "string",
			isSortItem: true
		},
		{
			FieldName: "Description",
			Width: '200px',
			type: "string"
		}];
	ListFilterDefinition.ColumnSource.GeneralDataListsDocumentClassification = [
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
	ListFilterDefinition.ColumnSource.GeneralDataListsNEZ = [
		{
			FieldName: "Name",
			type: "string",
			isSortItem: true
		},
		{
			FieldName: "Description",
			Width: '200px',
			type: "string"
		}];
	ListFilterDefinition.ColumnSource.GeneralDataListsGeoRegionType = [
		{
			FieldName: "Name",
			type: "string",
			isSortItem: true
		},
		{
			FieldName: "Boundary",
			Width: '200px',
			type: "string"
		}];

	ListFilterDefinition.ColumnSource.GeneralDataListsTripAlias = [
		{
			FieldName: "Item",
			DisplayName: "Name",
			type: "string",
			isSortItem: true
		}];

	ListFilterDefinition.ColumnSource.Mapset = [
		{
			FieldName: "GeoCounty",
			DisplayName: "Name",
			Width: "160px",
			type: "string",
			isSortItem: true
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

	ListFilterDefinition.ColumnSource.GPSEventType = [
		{
			FieldName: "EventTypeName",
			DisplayName: "Event",
			Width: "150px",
			type: "string",
			isSortItem: true
		}];
	ListFilterDefinition.ColumnSource.Driver = [
		{
			FieldName: "LastName",
			DisplayName: "Last Name",
			Width: "150px",
			type: "string",
			isSortItem: true
		},
		{
			FieldName: "FirstName",
			DisplayName: "First Name",
			Width: "150px",
			type: "string",
			isSortItem: true
		}];
	ListFilterDefinition.ColumnSource.BusfinderHistoricalTripStop = [
		{
			FieldName: "Name",
			DisplayName: "Trip Name",
			Width: "150px",
			type: "string",
			isSortItem: true
		},
		{
			FieldName: "Street",
			Width: "330px",
			type: "string"
		},
		{
			FieldName: "StopTime",
			DisplayName: "Stop Time",
			Width: "150px",
			type: "time"
		},
		{
			FieldName: "Xcoord",
			DisplayName: "X Coord",
			Width: "150px",
			type: "number",
			Precision: 6,
			format: "{0:0.000000}"
		},
		{
			FieldName: "Ycoord",
			DisplayName: "Y Coord",
			Width: '150px',
			type: "number",
			Precision: 6,
			format: "{0:0.000000}"
		},
		{
			FieldName: "Schoolname",
			DisplayName: "School Name",
			Width: "250px",
			type: "string"
		}];
	ListFilterDefinition.ColumnSource.BusfinderHistoricalTrip = [
		{
			FieldName: "Name",
			Width: '370px',
			type: "string",
			isSortItem: true
		},
		{
			FieldName: "Session",
			DisplayName: "Trip Session",
			Width: "100px",
			type: "integer"
		},
		{
			FieldName: "Schools",
			Width: "150px",
			template: "#: tf.tripGridDefinition.gridDefinition().formatter(Schools)#",
			type: "string"
		},
		{
			FieldName: "StartTime",
			DisplayName: "Start Time",
			Width: "150px",
			type: "time"
		},
		{
			FieldName: "FinishTime",
			DisplayName: "Finish Time",
			Width: "100px",
			type: "time"
		},
		{
			FieldName: "VehicleName",
			DisplayName: "Vehicle Name",
			Width: "150px",
			type: "string"
		},
		{
			FieldName: "DriverName",
			DisplayName: "Driver",
			Width: "160px",
			type: "string"
		}];
	ListFilterDefinition.ColumnSource.BusfinderHistoricalVehicle = [
		{
			FieldName: "BusNum",
			DisplayName: "Vehicle",
			Width: "150px",
			type: "string",
			isSortItem: true
		},
		{
			FieldName: "Vin",
			DisplayName: "VIN",
			Width: "150px",
			type: "string"
		},
		{
			FieldName: "Gpsid",
			DisplayName: "GPS ID",
			Width: "160px",
			type: "string"
		},
		{
			FieldName: "Vendor",
			Width: "150px",
			type: "string"
		},
		{
			FieldName: "VendorName",
			DisplayName: "Vendor Name",
			Width: "100px",
			type: "string"
		},
		{
			FieldName: "Category",
			Width: "150px",
			type: "string"
		},
		{
			FieldName: "FuelType",
			DisplayName: "Fuel",
			Width: "150px",
			type: "string"
		},
		{
			FieldName: "LastReportedEventDate",
			DisplayName: "Last Reported Event Date",
			Width: '150px',
			type: "date"
		},
		{
			FieldName: "LastReportedEventTime",
			DisplayName: "Last Reported Event Time",
			Width: '150px',
			type: "time"
		},
		{
			FieldName: "GPSEvents",
			DisplayName: "GPS Events",
			Width: '150px',
			type: "integer"
		}
	];
})();

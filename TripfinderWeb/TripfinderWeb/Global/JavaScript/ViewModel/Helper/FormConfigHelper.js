(function()
{

	createNamespace("TF.Form").FormConfigHelper = FormConfigHelper;
	const TYPE_PHONE_NUMBER = "Phone Number";

	function FormConfigHelper()
	{
		//constructor
	}

	FormConfigHelper.getFormColumnContent = function(columnName, dataTypeId)
	{

		switch (columnName)
		{
			case "HasObject":
			case "AppPoint":
			case "TotalStopTimeManualChanged":
			case "HomeSchl":
			case "HomeTrans":
			case "IShow":
			case "NonDisabled":
			case "BusAide":
			case "ActivityTrip":
			case "Shuttle":
			case "NonDisabled":
			case "GpsenabledFlag":
				return $("<input type='checkbox' onclick='return false' disabled/>");
			case "InActive":
			case "Disabled":
				if (dataTypeId !== 9)
				{
					return $("<input type='checkbox' onclick='return false' disabled/>");
				}
				return $(`<input type="text" class="question systemfield-question" disabled />`);
			case "Geo":
			case "PolicyDeviation":
			case "RidershipStatus":
				return $("<div></div>");
			case "FieldTripStageName":
				return $("<div></div><span></span>");
			default:
				return $(`<textarea class="question systemfield-question" rows="1" disabled></textarea>`);
		}

	}

	FormConfigHelper.systemFieldsConfig =
	{
		1: {
			"LastUpdated": { type: "Date" },
			"Phone": { type: TYPE_PHONE_NUMBER },
			"Public": { type: "boolean" },
			"Xcoord": { type: "Coord" },
			"Ycoord": { type: "Coord" }
		},
		19: {
			"Fax": { type: TYPE_PHONE_NUMBER },
			"Mobile": { type: TYPE_PHONE_NUMBER },
			"Phone": { type: TYPE_PHONE_NUMBER }
		},
		2: {
			"LastUpdated": { type: "Date" }
		},
		3: {
			"LastUpdated": { type: "Date" }
		},
		4: {
			"AideOtrate": { type: "number" },
			"AideRate": { type: "number" },
			"ContactPhone": { type: TYPE_PHONE_NUMBER },
			"DepartTime": { type: "Time" },
			"DepartDate": { type: "Date" },
			"DestinationContactPhone": { type: TYPE_PHONE_NUMBER },
			"DriverOtrate": { type: "number" },
			"DriverRate": { type: "number" },
			"EstimatedCost": { type: "number" },
			"EstimatedHours": { type: "number" },
			"EstimatedDistance": { type: "number" },
			"FixedCost": { type: "number" },
			"MileageRate": { type: "number" },
			"MinimumCost": { type: "number" },
			"TotalAmount": { type: "number" },
			"FieldTripStageName": { type: "FieldTripStage" },
			"ReturnDate": { type: "Date" },
			"ReturnTime": { type: "Time" }
		},
		5: {
			"HasObject": { type: "HasObject" },
			"LastUpdated": { type: "Date" },
			"Geo": { type: "Geo" },
			"Xcoord": { type: "Coord" },
			"Ycoord": { type: "Coord" }
		},
		7: {
			"LastUpdated": { type: "Date" },
			"BeginTime": { type: "Time" },
			"EndTime": { type: "Time" },
			"DepartTime": { type: "Time" },
			"ArrivalTime": { type: "Time" },
			"Xcoord": { type: "Coord" },
			"Ycoord": { type: "Coord" }
		},
		8: {
			"Abstract": { type: "Date" },
			"Advanced": { type: "Date" },
			"ApplicationField": { type: "Date" },
			"Certification": { type: "Date" },
			"CPR": { type: "Date" },
			"DefensiveDriving": { type: "Date" },
			"DrivingTestPractical": { type: "Date" },
			"DrivingTestWritten": { type: "Date" },
			"DateOfBirth": { type: "Date" },
			"InactiveDate": { type: "Date" },
			"FingerPrint": { type: "Date" },
			"HandicapPreService": { type: "Date" },
			"HepatitisB": { type: "Date" },
			"HireDate": { type: "Date" },
			"MyLastUpdated": { type: "Date" },
			"LicenseExpiration": { type: "Date" },
			"MedicalExam": { type: "Date" },
			"LastEval": { type: "Date/Time" },
			"CellPhone": { type: TYPE_PHONE_NUMBER },
			"HomePhone": { type: TYPE_PHONE_NUMBER },
			"WorkPhone": { type: TYPE_PHONE_NUMBER },
			"Otrate": { type: "number" },
			"PPTField": { type: "Date" },
			"PreService": { type: "Date" },
			"Rate": { type: "number" },
			"RefresherPart1": { type: "Date" },
			"RefresherPart2": { type: "Date" },
			"HandicapRef": { type: "Date" },
			"SuperintendentApprov": { type: "Date" },
			"Last Eval": { type: "Date/Time" }
		},
		9: {
			"Dob": { type: "Date" },
			"Mifromschl": { type: "number" },
			"MifromResidSch": { type: "number" },
			"EntryDate": { type: "Date/Time" },
			"Geo": { type: "Geo" },
			"IntGratDate1": { type: "Date" },
			"LastUpdated": { type: "Date" },
			"WalkToSchoolPolicy": { type: "numner" },
			"WalkToStopPolicy": { type: "number" },
			"Xcoord": { type: "Coord" },
			"Ycoord": { type: "Coord" }
		},
		13: {
			"AppPoint": { type: "Checkbox" },
			"Distance": { type: "number" },
			"StopTime": { type: "Time" },
			"NumStuds": { type: "number" },
			"TotalStopTimeManualChanged": { type: "Checkbox" },
			"Xcoord": { type: "Coord" },
			"Ycoord": { type: "Coord" }
		},
		10: {
			"ActivityTrip": { type: "Checkbox" },
			"BusAide": { type: "Checkbox" },
			"GpsenabledFlag": { type: "Checkbox" },
			"Cost": { type: "number" },
			"Dhdistance": { type: "number" },
			"Disabled": { type: "Checkbox" },
			"EndDate": { type: "Date" },
			"EstDistancePerYear": { type: "number" },
			"EstHoursPerYear": { type: "number" },
			"FinishTime": { type: "Time" },
			"HomeSchl": { type: "Checkbox" },
			"HomeTrans": { type: "Checkbox" },
			"IShow": { type: "Checkbox" },
			"LastUpdated": { type: "Date" },
			"NonDisabled": { type: "Checkbox" },
			"Schools": { type: "SchoolsType" },
			"RidershipEfficiencyPolicy": { type: "number" },
			"RidershipMaximumPolicy": { type: "number" },
			"RidershipRatio": { type: "number" },
			"StartDate": { type: "Date" },
			"StartTime": { type: "Time" },
			"Shuttle": { type: "Checkbox" },
			"PolicyDeviation": { type: "PolicyDeviation" },
			"RidershipStatus": { type: "RidershipStatus" }
		},
		11: {
			"Cost": { type: "number" },
			"EmmissInsp": { type: "Date" },
			"EstLife": { type: "number" },
			"FuelCapacity": { type: "number" },
			"Height": { type: "number" },
			"InActive": { type: "Checkbox" },
			"InsuranceExp": { type: "Date" },
			"LastUpdated": { type: "Date" },
			"Length": { type: "number" },
			"MaxWeight": { type: "number" },
			"Mpg": { type: "number" },
			"PurchaseDate": { type: "Date" },
			"PurchaseMileage": { type: "number" },
			"Purchase Price": { type: "number" },
			"RegisExp": { type: "Date" },
			"SalvageMileage": { type: "number" },
			"SalvageValue": { type: "number" },
			"SalvageDate": { type: "Date" },
			"InspectionExp": { type: "Date" },
			"YearMade": { type: "integer" }
		},
	}

	var getCommaSeparatedTwoDecimalsNumber = function(number)
	{
		const fixedNumber = Number.parseFloat(number).toFixed(2);
		return String(fixedNumber).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}

	var stageFormatter = function(value)
	{
		switch (value)
		{
			case 'Level 1 - Request Submitted':
				return '#FFFF00';
			case 'Level 2 - Request Declined':
			case 'Level 3 - Request Declined':
			case 'Level 4 - Request Declined':
			case 'Declined by Transportation':
				return '#FF0000';
			case 'Transportation Approved':
				return '#00FF00';
			case 'Level 2 - Request Approved':
				return '#E0A080';
			case 'Level 3 - Request Approved':
				return '#FF00FF';
			case 'Level 4 - Request Approved':
				return '#00FFFF';
			case 'Canceled - Request Canceled':
				return '#964B00';
			case 'Completed - Request Completed':
				return '#0000FF';
			default:
				return '#FFFF00';
		}
	};

	var _schoolsFormatter = function(value)
	{
		if (!value)
		{
			return "";
		}
		var result = value.replace(/!/g, ", ").trim();
		return result.substr(result.length - 1, 1) === ',' ? result.substr(0, result.length - 1) : result;
	}

	function clearEmptyImagePlacehold(elem)
	{
		elem.empty();
	}

	function appendEmptyImagePlacehold(elem)
	{
		if (!elem.find(".no-image-container").length)
		{
			elem.append(`<div class="no-image-container">
					<div class="grid-icon grid-icon-no-image"></div>
					<span class="no-image-label">No image available</span>
				</div>`);
		}
	}
	FormConfigHelper.systemFieldsFormat = function(type, value, el)
	{

		switch (type)
		{
			case "Date":
			case "date":
				return _formatDataSysField(value);
			case "Time":
			case "time":
				return _formatTimeSysField(value);
			case "Date/Time":
				return _formatDateTimeSysField(value);
			case "Coord":
				return _formatCoordSysField(value);
			case "Number":
				return _formatNumberSysField(value);
			case "number":
				return _formatnumberSysField(value);
			case TYPE_PHONE_NUMBER:
				return _formatPhoneNumberSysField(value);
			case "FieldTripStage":
				return _formatFieldTripStageSysField(el, value);
			case "HasObject":
				return _formatHasObjectSysField(value)
			case "Checkbox":
				return _formatCheckboxSysField(value);
			case "Geo":
				return _formatGeoSysField(value);
			case "PolicyDeviation":
				return _formatPolicyDeviationSysField(value);
			case "SchoolsType":
				return _schoolsFormatter(value);
			case "RidershipStatus":
				return _formatRidershipStatusSysField(value);
			case "string":
				return _formatStringSysField(value);
			default:
				return value;
		}
	}

	function _formatDataSysField(value)
	{
		return value ? moment(value).format("MM/DD/YYYY") : "";
	}

	function _formatTimeSysField(value)
	{
		return value ? moment("2018-01-01T" + value).format("h:mm A") : "";
	}

	function _formatDateTimeSysField(value)
	{
		return value ? moment(value).format("MM/DD/YYYY h:mm A") : "";
	}
	function _formatCoordSysField(value)
	{
		return (value === null || value === '') ? "" : value.toFixed(6);
	}

	function _formatNumberSysField(value)
	{
		return value ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "";
	}

	function _formatnumberSysField(value)
	{
		return value !== null && value !== "" ? getCommaSeparatedTwoDecimalsNumber(value) : "";
	}

	function _formatPhoneNumberSysField(value)
	{
		return tf.dataFormatHelper.phoneFormatter(value);
	}

	function _formatFieldTripStageSysField(el, value)
	{
		if (value !== null && value !== "")
		{
			$(el[0]).attr("style", `height:15px;width:15px;margin-right:.5em;border:1px solid rgb(213, 213, 213);background-color:${stageFormatter(value)};float:left`);
		} else
		{
			$(el[0]).removeAttr("style");
		}
		$(el[1]).text(value);
		return value;
	}

	function _formatHasObjectSysField(value)
	{
		const boolVal = value === "33";
		el.prop('checked', boolVal);
		return boolVal;
	}

	function _formatCheckboxSysField(value)
	{
		el.prop('checked', value);
		return value;
	}

	function _formatGeoSysField(value)
	{
		clearEmptyImagePlacehold(el);
		if (value !== "")
		{
			el.addClass("icon-inner icon-geocoded");
		}
		else
		{
			el.removeClass();
			appendEmptyImagePlacehold(el);

		}
		return value;
	}

	function _formatPolicyDeviationSysField(value)
	{
		clearEmptyImagePlacehold(el);
		if (value === '37')
		{
			el.addClass('grid-icon grid-icon-reddot');
		}
		else
		{
			el.removeClass();
			appendEmptyImagePlacehold(el);
		}
		return value;
	}

	function _formatRidershipStatusSysField(value)
	{
		clearEmptyImagePlacehold(el);
		if (value === '37')
		{
			el.addClass('grid-icon grid-icon-reddot');
		} else if (value === '39')
		{
			el.addClass('grid-icon grid-icon-yellowdot');
		} else
		{
			el.removeClass();
			appendEmptyImagePlacehold(el);
		}
		return value;
	}

	function _formatStringSysField(value)
	{
		return value ? value.replace(/<br\/>/g, ', ') : "";
	}
})();


(function()
{

	var generateFilterItems = function(filterItems, value)
	{
		const idx = value.indexOf(','),
			filterSets = [];
		const logicOperator = 'Or';
		let filters = $.extend(true, [], filterItems);

		if (idx > -1)
		{
			value = value.substring(0, idx);
		}
		value = value.trim();

		const values = value.split(' ');
		if (values.length > 1)
		{
			//First search the whole string
			filters.forEach(item =>
			{
				item.Value = value;
				const filterSet = new TF.FilterSet('Or', [item]);
				filterSets.push(filterSet);
			});
			//Then search the splitted words
			for (let i = 1; i < values.length; i++)
			{
				const copyFilters = $.extend(true, [], filterItems),
					last = values.slice(0, i).join(' '),
					first = values.slice(i).join(' ');

				copyFilters[0].Value = last;
				copyFilters[1].Value = first;

				const filterSet = new TF.FilterSet('And', copyFilters);
				filterSets.push(filterSet);
			}
			filters = [];
		}
		else
		{
			filters.forEach(item => item.Value = values[0]);
		}
		return {
			logicOperator: logicOperator,
			filterItems: filters,
			filterSets: filterSets
		};
	}

	function extractIdAndNameOnlyFormItem(item)
	{
		return {
			text: `${item.Name}`,
			value: item.Id
		}
	}

	function buildFilter(filterItems, value)
	{
		filterItems[0].Value = value;
		return {
			logicOperator: 'Or',
			filterItems: filterItems
		};
	}

	TF.Form.formConfig = {
		staff: {
			//lastname, firstname, staff id,
			fields: ["Id", "LastName", "FirstName", "StaffLocalId"],
			sortItems: [{
				Name: 'LastName',
				isAscending: () => true,
				Direction: "Ascending"
			}, {
				Name: 'FirstName',
				isAscending: () => true,
				Direction: "Ascending"
			}, {
				Name: 'StaffLocalId',
				isAscending: () => true,
				Direction: "Ascending"
			}],
			filterItems: [{
				FieldName: 'LastName',
				Operator: 'Contains',
				TypeHint: 'string',
				Value: ''
			}, {
				FieldName: 'FirstName',
				Operator: 'Contains',
				TypeHint: 'string',
				Value: ''
			}],
			formatItem: function(item)
			{
				return {
					text: `${item.LastName || ''} ${item.FirstName || ''}${(item.StaffLocalId === null || item.StaffLocalId === '') ? '' : (', ' + item.StaffLocalId)}`,
					value: item.Id
				}
			},
			generateFilterItems: generateFilterItems
		},
		student: {
			//lastname, firstname, local id
			fields: ["Id", "LocalId", "LastName", "FirstName"],
			sortItems: [{
				Name: 'LastName',
				isAscending: () => true,
				Direction: "Ascending"
			}, {
				Name: 'FirstName',
				isAscending: () => true,
				Direction: "Ascending"
			}, {
				Name: 'LocalId',
				isAscending: () => true,
				Direction: "Ascending"
			}],
			filterItems: [{
				FieldName: 'LastName',
				Operator: 'Contains',
				TypeHint: 'string',
				Value: ''
			}, {
				FieldName: 'FirstName',
				Operator: 'Contains',
				TypeHint: 'string',
				Value: ''
			}],
			formatItem: item =>
			{
				return {
					text: `${item.LastName || ''} ${item.FirstName || ''}${(item.LocalId === null || item.LocalId === '') ? '' : (', ' + item.LocalId)}`,
					value: item.Id
				}
			},
			generateFilterItems: generateFilterItems
		},
		vehicle: {
			//BusNum, , vehicle id
			fields: ["BusNum", "Id"],
			sortItems: [{
				Name: 'BusNum',
				isAscending: () => true,
				Direction: "Ascending"
			}, {
				Name: 'Id',
				isAscending: () => true,
				Direction: "Ascending"
			}],
			filterItems: [{
				FieldName: 'BusNum',
				Operator: 'Contains',
				TypeHint: 'string',
				Value: ''
			}],
			formatItem: item =>
			{
				return {
					text: `${item.BusNum}`,
					value: item.Id
				}
			},
			generateFilterItems: buildFilter
		},
		altsite: {
			//Name
			fields: ["Name", "Id"],
			sortItems: [{
				Name: 'Name',
				isAscending: () => true,
				Direction: "Ascending"
			}, {
				Name: 'Id',
				isAscending: () => true,
				Direction: "Ascending"
			}],
			filterItems: [{
				FieldName: 'Name',
				Operator: 'Contains',
				TypeHint: 'string',
				Value: ''
			}],
			formatItem: extractIdAndNameOnlyFormItem,
			generateFilterItems: buildFilter
		},
		contact: {
			//lastname, firstname,
			fields: ["Id", "LastName", "FirstName"],
			sortItems: [{
				Name: 'LastName',
				isAscending: () => true,
				Direction: "Ascending"
			}, {
				Name: 'FirstName',
				isAscending: () => true,
				Direction: "Ascending"
			}],
			filterItems: [{
				FieldName: 'LastName',
				Operator: 'Contains',
				TypeHint: 'string',
				Value: ''
			}, {
				FieldName: 'FirstName',
				Operator: 'Contains',
				TypeHint: 'string',
				Value: ''
			}],
			formatItem: item =>
			{
				return {
					text: `${item.LastName || ''} ${item.FirstName}`,
					value: item.Id
				}
			},
			generateFilterItems: generateFilterItems
		},
		contractor: {
			//Name
			fields: ["Name", "Id"],
			sortItems: [{
				Name: 'Name',
				isAscending: () => true,
				Direction: "Ascending"
			}, {
				Name: 'Id',
				isAscending: () => true,
				Direction: "Ascending"
			}],
			filterItems: [{
				FieldName: 'Name',
				Operator: 'Contains',
				TypeHint: 'string',
				Value: ''
			}],
			formatItem: extractIdAndNameOnlyFormItem,
			generateFilterItems: buildFilter
		},
		district: {
			//Name
			fields: ["Name", "Id"],
			sortItems: [{
				Name: 'Name',
				isAscending: () => true,
				Direction: "Ascending"
			}, {
				Name: 'Id',
				isAscending: () => true,
				Direction: "Ascending"
			}],
			filterItems: [{
				FieldName: 'Name',
				Operator: 'Contains',
				TypeHint: 'string',
				Value: ''
			}],
			formatItem: extractIdAndNameOnlyFormItem,
			generateFilterItems: buildFilter
		},
		fieldtrip: {
			//Name
			fields: ["Name", "Id"],
			sortItems: [{
				Name: 'Name',
				isAscending: () => true,
				Direction: "Ascending"
			}, {
				Name: 'Id',
				isAscending: () => true,
				Direction: "Ascending"
			}],
			filterItems: [{
				FieldName: 'Name',
				Operator: 'Contains',
				TypeHint: 'string',
				Value: ''
			}],
			formatItem: extractIdAndNameOnlyFormItem,
			generateFilterItems: buildFilter
		},
		georegion: {
			//Name
			fields: ["Name", "Id"],
			sortItems: [{
				Name: 'Name',
				isAscending: () => true,
				Direction: "Ascending"
			}, {
				Name: 'Id',
				isAscending: () => true,
				Direction: "Ascending"
			}],
			filterItems: [{
				FieldName: 'Name',
				Operator: 'Contains',
				TypeHint: 'string',
				Value: ''
			}],
			formatItem: extractIdAndNameOnlyFormItem,
			generateFilterItems: buildFilter
		},
		school: {
			//Name
			fields: ["Name", "Id"],
			sortItems: [{
				Name: 'Name',
				isAscending: () => true,
				Direction: "Ascending"
			}, {
				Name: 'Id',
				isAscending: () => true,
				Direction: "Ascending"
			}],
			filterItems: [{
				FieldName: 'Name',
				Operator: 'Contains',
				TypeHint: 'string',
				Value: ''
			}],
			formatItem: extractIdAndNameOnlyFormItem,
			generateFilterItems: buildFilter
		},
		trip: {
			//Name
			fields: ["Name", "Id", 'AideId', 'DriverId'],
			sortItems: [{
				Name: 'Name',
				isAscending: () => true,
				Direction: "Ascending"
			}, {
				Name: 'Id',
				isAscending: () => true,
				Direction: "Ascending"
			}],
			filterItems: [{
				FieldName: 'Name',
				Operator: 'Contains',
				TypeHint: 'string',
				Value: ''
			}],
			formatItem: extractIdAndNameOnlyFormItem,
			generateFilterItems: buildFilter
		},
		tripstop: {
			//Name
			fields: ["Name", "Street", "Id"],
			sortItems: [{
				Name: 'Name',
				isAscending: () => true,
				Direction: "Ascending"
			}, {
				Name: 'Street',
				isAscending: () => true,
				Direction: "Ascending"
			}, {
				Name: 'Id',
				isAscending: () => true,
				Direction: "Ascending"
			}],
			filterItems: [{
				FieldName: 'Name',
				Operator: 'Contains',
				TypeHint: 'string',
				Value: ''
			}, {
				FieldName: 'Street',
				Operator: 'Contains',
				TypeHint: 'string',
				Value: ''
			}],
			formatItem: item =>
			{
				return {
					text: `${item.Street}, ${item.Name}`,
					value: item.Id
				}
			},
			generateFilterItems: generateFilterItems
		}
	}
})()

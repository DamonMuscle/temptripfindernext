(function()
{

	createNamespace("TF.Form").FormConfigHelper = FormConfigHelper;
	const TYPE_PHONE_NUMBER = "Phone Number";

	function FormConfigHelper()
	{
		//constructor
	}

	FormConfigHelper.convertValueByMeasurementUnit = function(value, fieldName, dataType)
	{
		var item = {};
		item[fieldName] = value;
		var column = tf.helpers.kendoGridHelper.getGridColumnsFromDefinitionByType(dataType).filter(x => x.FieldName.toLowerCase() === fieldName.toLowerCase());
		if (column && column.length === 1 && column[0].UnitOfMeasureSupported)
		{
			column = column[0];
			return tf.measurementUnitConverter.handleColumnUnitOfMeasure(item, column);
		}
		return value;
	}

	FormConfigHelper.getFormColumnContent = function(columnName, dataTypeId, options = { isGrid: false })
	{

		let { isGrid } = options;
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
				return $("<input type='checkbox' onclick='return false'/>");
			case "InActive":
			case "Disabled":
				if (dataTypeId !== 9)
				{
					return $("<input type='checkbox' onclick='return false'/>");
				}
				return isGrid ? null : $(`<input type="text" class="question systemfield-question" disabled />`);
			case "Geo":
			case "PolicyDeviation":
			case "RidershipStatus":
				return $("<div></div>");
			case "FieldTripStageName":
				return $("<div></div><span></span>");
			default:
				return isGrid ? null : $(`<textarea class="question systemfield-question" rows="1" disabled></textarea>`);
		}

	}

	tf.systemFieldsConfig =
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
			"DestinationFax": { type: TYPE_PHONE_NUMBER },
			"DriverOtrate": { type: "number" },
			"DriverRate": { type: "number" },
			"EstimatedCost": { type: "number" },
			"EstimatedHours": { type: "number" },
			"EstimatedDistance": { type: "number" },
			"FixedCost": { type: "number" },
			"FuelConsumptionRate": { type: "number" },
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
			"DistanceFromSchl": { type: "number" },
			"DistanceFromResidSch": { type: "number" },
			"EntryDate": { type: "Date/Time" },
			"Geo": { type: "Geo" },
			"IntGratDate1": { type: "Date" },
			"LastUpdated": { type: "Date" },
			"WalkToSchoolPolicy": { type: "number" },
			"WalkToStopPolicy": { type: "number" },
			"Xcoord": { type: "Coord" },
			"Ycoord": { type: "Coord" },
			"PrimaryContactPhone": { type: TYPE_PHONE_NUMBER },
			"PrimaryContactMobile": { type: TYPE_PHONE_NUMBER }
		},
		13: {
			"AppPoint": { type: "AppPoint" },
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
			"FuelConsumption": { type: "number" },
			"PurchaseDate": { type: "Date" },
			"PurchaseOdometer": { type: "number" },
			"Purchase Price": { type: "number" },
			"RegisExp": { type: "Date" },
			"SalvageOdometer": { type: "number" },
			"SalvageValue": { type: "number" },
			"SalvageDate": { type: "Date" },
			"InspectionExp": { type: "Date" },
			"YearMade": { type: "integer" }
		},
	}

	FormConfigHelper.getSystemFieldRelatedColumnDefinition = function(fieldName, dataTypeId)
	{
		let gridColumnData = TF.Grid.FilterHelper.getGridDefinitionByType(tf.dataTypeHelper.getKeyById(dataTypeId));
		let targetColumn = gridColumnData.Columns.filter(c => c.FieldName == fieldName);
		if (Array.isArray(targetColumn) && targetColumn.length > 0)
		{
			return targetColumn[0];
		}

		return null;
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

	tf.systemFieldsFormat = function(type, value, el, attributeFlag, numberPrecision,
		trueDisplayName, falseDisplayName, options = { isGrid: false, isUTC: false })
	{
		const { isGrid, isUTC, systemQuestionTargetField, dataTypeId } = options;

		function clearEmptyImagePlacehold(_el)
		{
			_el.empty();
		}

		function appendEmptyImagePlacehold(_el)
		{
			if (!_el.find(".no-image-container").length &&
				_el.parents().find('input.form-entity-input') &&
				_el.parents().find('input.form-entity-input').val())
			{
				const img = isGrid ? `<div></div>` :
					`<div class="no-image-container">
						<div class="grid-icon grid-icon-no-image"></div>
						<span class="no-image-label">No image available</span>
					</div>`;

				_el.append(img);
			}
		}

		// Do not format PDE1049 number type RW-27957
		if (attributeFlag === 4 && type.toLowerCase() === "number")
		{
			return value ? value.toFixed(numberPrecision) : "";
		}

		function getFormattedTime(value)
		{
			if (!value)
			{
				return "";
			}

			if (value instanceof Date)
			{
				return moment(value).format("h:mm A");
			}

			return moment("2018-01-01T" + value).format("h:mm A");
		}

		function _getRealBooleanValue(value)
		{
			if (value === true || value === "true" || value === "True")
			{
				return true;
			}
			else if (value === false || value === "false" || value === "False")
			{
				return false;
			}
			else
			{
				return null;
			}
		}

		function _getRealBooleanDisplayName(value, options = { trueDisplayName: "true", falseDisplayName: "false" })
		{
			const { trueDisplayName, falseDisplayName } = options;

			const flag = _getRealBooleanValue(value)
			if (flag === null)
			{
				return "";
			}

			return flag ? trueDisplayName : falseDisplayName;
		}

		function setCheckbox($el, value)
		{
			value = _getRealBooleanValue(value);
			if (value === null)
			{
				$el.hide();
				return;
			}

			$el.show();
			$el.prop('checked', value);
			value ? $el.attr('checked', 'checked') : $el.removeAttr('checked');
		}

		function setDefaultTextComponent($el)
		{
			$el.replaceWith($(`<textarea class="question systemfield-question" rows="1" disabled></textarea>`));
		}

		switch (type)
		{
			case "Boolean":
				return _getRealBooleanDisplayName(value, { trueDisplayName: trueDisplayName, falseDisplayName: falseDisplayName });
			case "Date":
			case "date":
				if (IsEmptyString(value)) { return ""; }
				if (isUTC)
				{
					let dt = utcToClientTimeZone(value);
					return dt.isValid() ? dt.format("MM/DD/YYYY") : "";
				}

				return _formatDataSysField(value);
			case "Time":
			case "time":
				if (IsEmptyString(value)) { return ""; }
				return getFormattedTime(value);
			case "Date/Time":
				if (IsEmptyString(value)) { return ""; }
				if (isUTC)
				{
					let dt = utcToClientTimeZone(value);
					return dt.isValid() ? dt.format("MM/DD/YYYY h:mm A") : "";
				}

				return _formatDateTimeSysField(value);
			case "Coord":
				if (IsEmptyString(value)) { return ""; }
				return Number.parseFloat(value).toFixed(6);
			case "Currency":
			case "currency":
			case "Number":
			case "number":
			case "float":
				if (IsEmptyString(value)) { return ""; }
				if (systemQuestionTargetField && dataTypeId)
				{
					const dataTypeKey = tf.dataTypeHelper.getKeyById(dataTypeId);
					value = FormConfigHelper.convertValueByMeasurementUnit(value, systemQuestionTargetField, dataTypeKey);
				}
				return tf.dataFormatHelper.numberFormatter(value, numberPrecision);
			case TYPE_PHONE_NUMBER:
				if (IsEmptyString(value)) { return ""; }
				return _formatPhoneNumberSysField(value);
			case "FieldTripStage":
				return _formatFieldTripStageSysField(el, value);
			case "HasObject":
			case "AppPoint":
				const boolToCharDict = {
					'HasObject': '33',
					'AppPoint': '1',
				}

				const charCode = boolToCharDict[type]

				// get the result of nullableBool2CharField
				const boolVal = (value === null) ? null :
					(value === 'true' || value === charCode);

				if (isCopy)
				{
					return boolVal ? charCode : '';
				}

				if (!isGrid && value === null)
				{
					setDefaultTextComponent(el);
				}
				else
				{
					setCheckbox(el, boolVal);
				}

				return boolVal;
			case "Checkbox":
				setCheckbox(el, value);
				return value;
			case "Geo":
			case "PolicyDeviation":
			case "RidershipStatus":

				const imageToCharDict = {
					"Geo": {
						'4': 'icon-inner icon-geocoded'
					},
					"PolicyDeviation": {
						'37': 'grid-icon grid-icon-reddot'
					},
					"RidershipStatus": {
						'37': 'grid-icon grid-icon-reddot',
						'39': 'grid-icon grid-icon-yellowdot',
					}
				}

				if (!isCopy)
				{
					const charImageDict = imageToCharDict[type];
					imageToCharFieldFormatter(el, value, charImageDict)
				}

				return value;
			case "SchoolsType":
				return _schoolsFormatter(value);
			case "string":
				return _formatStringSysField(value);
			default:
				return value;
		}

		function imageToCharFieldFormatter(el, value, charImageDict)
		{
			clearEmptyImagePlaceHold(el);

			if (value in charImageDict)
			{
				el.addClass(charImageDict[value]);
			}
			else
			{
				el.removeClass();
				appendEmptyImagePlaceHold(el);
			}
		}
	}

	function _formatDataSysField(value)
	{
		return value ? moment(value).format("MM/DD/YYYY") : "";
	}

	function _formatDateTimeSysField(value)
	{
		return value ? moment(value).format("MM/DD/YYYY h:mm A") : "";
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
			$(el[1]).text(value);
		} else
		{
			$(el[0]).removeAttr("style");
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

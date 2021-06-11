(function()
{

	createNamespace("TF.Form").FormConfigHelper = FormConfigHelper;

	function FormConfigHelper()
	{
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

	FormConfigHelper.systemFieldsConfig = {
		1: {
			"LastUpdated": { type: "Date" },
			"Phone": { type: "Phone Number" },
			"Public": { type: "boolean" },
			"Xcoord": { type: "Coord" },
			"Ycoord": { type: "Coord" }
		},
		19: {
			"Fax": { type: "Phone Number" },
			"Mobile": { type: "Phone Number" },
			"Phone": { type: "Phone Number" }
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
			"ContactPhone": { type: "Phone Number" },
			"DepartTime": { type: "Time" },
			"DepartDate": { type: "Date" },
			"DestinationContactPhone": { type: "Phone Number" },
			"DriverOtrate": { type: "number" },
			"DriverRate": { type: "number" },
			"EstimatedCost": { type: "number" },
			"EstimatedHours": { type: "number" },
			"EstimatedMiles": { type: "number" },
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
			"CellPhone": { type: "Phone Number" },
			"HomePhone": { type: "Phone Number" },
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
			"Shuttle": { type: "Checkbox" },
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

	FormConfigHelper.systemFieldsFormat = function(type, value, el)
	{
		function clearEmptyImagePlacehold(el)
		{
			el.empty();
		}

		function appendEmptyImagePlacehold(el)
		{
			if (!el.find(".no-image-container").length)
			{
				el.append(`<div class="no-image-container">
					<div class="grid-icon grid-icon-no-image"></div>
					<span class="no-image-label">No image available</span>
				</div>`);
			}

		}

		switch (type)
		{
			case "Date":
			case "date":
				return value ? moment(value).format("MM/DD/YYYY") : "";
			case "Time":
			case "time":
				return value ? moment("2018-01-01T" + value).format("h:mm A") : "";
			case "Date/Time":
				return value ? moment(value).format("MM/DD/YYYY h:mm A") : "";
			case "Coord":
				return (value === null || value === '') ? "" : value.toFixed(6);
			case "Number":
				return value ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "";
			case "number":
				return value !== null && value !== "" ? getCommaSeparatedTwoDecimalsNumber(value) : "";
			case "Phone Number":
				return tf.dataFormatHelper.phoneFormatter(value);
			case "FieldTripStage":
				if (value !== null && value !== "")
				{
					$(el[0]).attr("style", "height:15px;width:15px;margin-right:.5em;border:1px solid rgb(213, 213, 213);background-color:" + stageFormatter(value) + ";float:left");
				} else
				{
					$(el[0]).removeAttr("style");
				}
				$(el[1]).text(value);
				return value;
			case "HasObject":
				let boolVal = value == '33';
				el.prop('checked', boolVal);
				return boolVal;
			case "Checkbox":
				el.prop('checked', value);
				return value;
			case "Geo":
				clearEmptyImagePlacehold(el);
				if (value !== "")
				{
					el.addClass("icon-inner icon-geocoded");
				} else
				{
					el.removeClass();
					appendEmptyImagePlacehold(el);

				}
				return value;
			case "PolicyDeviation":
				clearEmptyImagePlacehold(el);
				if (value == '37')
				{
					el.addClass('grid-icon grid-icon-reddot');
				} else
				{
					el.removeClass();
					appendEmptyImagePlacehold(el);
				}
				return value;
			case "SchoolsType":
				return scoolsFormatter(value);
			case "RidershipStatus":
				clearEmptyImagePlacehold(el);
				if (value == '37')
				{
					el.addClass('grid-icon grid-icon-reddot');
				} else if (value == '39')
				{
					el.addClass('grid-icon grid-icon-yellowdot');
				} else
				{
					el.removeClass();
					appendEmptyImagePlacehold(el);
				}
				return value;
			case "string":
				return value ? value.replace(/<br\/>/g, ', ') : "";
			default:
				return value;
		}
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

	var scoolsFormatter = function(value)
	{
		if (!value)
		{
			return "";
		}
		var result = value.replace(/!/g, ", ").trim();
		return result.substr(result.length - 1, 1) === ',' ? result.substr(0, result.length - 1) : result;
	}
})()
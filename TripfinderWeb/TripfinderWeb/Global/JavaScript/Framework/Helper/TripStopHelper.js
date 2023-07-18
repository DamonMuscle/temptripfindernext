(function()
{
	var namespace = createNamespace("TF.Helper");

	namespace.TripStopHelper = TripStopHelper;

	function TripStopHelper()
	{

	}

	TripStopHelper.prototype.constructor = TripStopHelper;

	TripStopHelper.convertTohourMinuteSecond = function(hours)
	{
		var hour = parseInt(hours);
		var minutes = (hours - hour) * 60;
		var minute = parseInt(minutes);
		var seconds = (minutes - minute) * 60;
		var second = parseInt(seconds);
		return moment({ hour: hour, minute: minute, second: second }).format("HH:mm:ss");
	};
	TripStopHelper.convertToMinuteSecond = function(seconds, format)
	{
		var second = seconds % 60;
		var minute = parseInt(seconds / 60);
		return moment({ minute: minute, second: second }).format(format || "mm:ss");
	};

	TripStopHelper.formatDistance = function(distance)
	{
		var formatResult = "";
		if (distance)
		{
			formatResult = Math.round(distance * 100) / 100 + ` ${tf.measurementUnitConverter.getShortUnits()}`;
		}
		return formatResult;
	};

	TripStopHelper.convertToSeconds = function(hourMinuteSecond, format)
	{
		hourMinuteSecond = hourMinuteSecond || "";

		if (hourMinuteSecond.toString().indexOf(":") < 0)
		{
			return hourMinuteSecond;
		}

		if (!format) { format = "HH:mm:ss"; }
		var time = moment(hourMinuteSecond, format);
		var hour = time.hours();
		var minute = time.minutes();
		var second = time.seconds();
		return hour * 60 * 60 + minute * 60 + second;
	};
	TripStopHelper.formatTime = function(time)
	{
		return moment(time).format("LT");
	};
	TripStopHelper.findTheStop = function(stopLists, sequence)
	{
		return Enumerable.From(stopLists).Where(function(c)
		{
			return c.Sequence === sequence;
		}.bind(this)).ToArray()[0];
	};
	TripStopHelper.caculateAvgSpeed = function(tripStop, localStorageDataModel)
	{
		if (localStorageDataModel.streetRoutingSpeedChecked)
		{
			if (tripStop)
			{
				return tripStop.AverageSpeed.toFixed(0);
			}
		}
		if (localStorageDataModel.defaultAverageSpeedChecked)
		{
			if (localStorageDataModel.defaultAverageSpeed)
			{
				return localStorageDataModel.defaultAverageSpeed;
			}
		}
		return 0;
	};

	TripStopHelper.caculateTravelTime = function(tripStop)
	{
		var hours = 0;
		if (tripStop.AvgSpeed && tripStop.AvgSpeed > 0)
		{
			hours = tripStop.Distance / tripStop.AvgSpeed;
		}
		return TripStopHelper.convertTohourMinuteSecond(hours);
	};

	TripStopHelper.calculateTotalStopTime = function(tripStop)
	{
		if (!tripStop)
		{
			return 0;
		}

		var totalStudentLoadTime = 0;
		if (tripStop.PickUpStudents && tripStop.PickUpStudents.length > 0)
		{
			totalStudentLoadTime += Enumerable.From(tripStop.PickUpStudents).Select(function(c) { return c.LoadTime ? c.LoadTime : 0; }).Sum();
		}
		if (tripStop.DropOffStudents && tripStop.DropOffStudents.length > 0)
		{
			totalStudentLoadTime += Enumerable.From(tripStop.DropOffStudents).Select(function(c) { return c.LoadTime ? c.LoadTime : 0; }).Sum();
		}
		return totalStudentLoadTime;
	};

	TripStopHelper.calculateTimeOfTripStop = function(tripStop, stopTime)
	{
		var travelTimeSeconds = TripStopHelper.convertToSeconds(TripStopHelper.caculateTravelTime(tripStop));
		tripStop.StopTime = moment(stopTime).add('seconds', tripStop.TotalStopTime).add('seconds', travelTimeSeconds).format();
	};

	TripStopHelper.loadUnassignedSchoolStudents = function(schoolCodes, session, stopSchool)
	{
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "student", "loadUnassignedTransferStudents?timePeriod=" + (session == 0 ? "AM" : "PM")),
			{
				data: {
					schoolCodes: schoolCodes,
					stopSchool: stopSchool
				}
			})
			.then(function(apiResponse)
			{
				return apiResponse.Items;
			}.bind(this));
	};

	TripStopHelper.loadSchoolStudents = function(schoolCodes, session, stopSchool)
	{
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "student", "loadTransferStudents?timePeriod=" + (session == 0 ? "AM" : "PM")),
			{
				data: {
					schoolCodes: schoolCodes,
					stopSchool: stopSchool
				}
			})
			.then(function(apiResponse)
			{
				return apiResponse.Items;
			}.bind(this));
	};
})();
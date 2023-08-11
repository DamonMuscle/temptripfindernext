(function() 
{
	createNamespace("TF.Document").MomentHelper = MomentHelper;

	function MomentHelper()
	{
		this.baselineDate = "12/30/1899";
		this.maxTime = "24:00";
		this.minTime = "00:00";
	};

	MomentHelper.prototype.constructor = MomentHelper;

	MomentHelper.prototype.toString = function(dateTime, format)
	{
		format = format || "HH:mm";
		return moment(this.toDate(dateTime)).locale("en-us").format(format);
	};

	MomentHelper.prototype.toDate = function(dateTime, toBaselineDate)
	{
		if (dateTime instanceof Date) return dateTime;

		// support Microsoft Edge
		if (dateTime === this.maxTime)
		{
			// '24:00' is invalid time in Microsoft Edge.
			dateTime = this.minTime;
			this.baselineDate = "12/31/1899";
		}
		else
		{
			this.baselineDate = "12/30/1899";
		}

		// suppose dateTime is string.
		if (isNaN(moment(dateTime).minutes()))
		{
			// startTime like "10:00 AM"
			dateTime = new Date(this.baselineDate + " " + dateTime);
		}
		else if (toBaselineDate)
		{
			dateTime = new Date(this.baselineDate + " " + this.toString(dateTime));
		}
		else
		{
			dateTime = new Date(dateTime);
		}

		return dateTime;
	};

	MomentHelper.prototype.add = function(dateTime, minutes)
	{
		return moment(this.toDate(dateTime)).locale("en-us").add(minutes, "minutes");
	}

	MomentHelper.prototype.minutesDiff = function(startTime, endTime)
	{
		if (startTime == endTime) return 0;

		if (startTime instanceof Date)
		{
			startTime = moment(startTime).format("HH:mm");
		}

		if (endTime instanceof Date)
		{
			endTime = moment(endTime).format("HH:mm");
		}

		var endTime = moment(this.toDate(endTime, true)).toDate(),
			startTime = moment(this.toDate(startTime, true)).toDate();

		return moment(endTime).diff(moment(startTime), "seconds") / 60;
	};

	/**
	 * @param  {String} dateTime format: 'HH:mm'
	 * @returns {Number} Hours of dateTime.
	 */
	MomentHelper.prototype.getHours = function(dateTime)
	{
		return dateTime === this.maxTime ? 24 : this.toDate(dateTime).getHours();
	};

	MomentHelper.prototype.minsToDDHHMM = function (minutesValue)
	{
		const mins_num = parseFloat(minutesValue, 10);
		const minutesInDay = 24 * 60;
		const minutesInHour = 60;

		let days = Math.floor(mins_num / minutesInDay);
		let remainingMinutes = mins_num % minutesInDay;
		let hours = Math.floor(remainingMinutes / minutesInHour);
		let minutes = remainingMinutes % minutesInHour;
	
		// Appends 0 when unit is less than 10
		if (days    < 10) {days    = "0"+days;}
		if (hours   < 10) {hours   = "0"+hours;}
		if (minutes < 10) {minutes = "0"+minutes;}

		return [days, hours, minutes];
	}

	MomentHelper.prototype.getDatePart = function (value, isUtc)
	{
		if (!value)
		{
			return null;
		}

		const dt = isUtc ? utcToClientTimeZone(value) : moment(value);
		return dt.format("MM/DD/YYYY");
	}

	MomentHelper.prototype.getTimePart = function (value, isUtc)
	{
		if (!value)
		{
			return null;
		}

		const dt = isUtc ? utcToClientTimeZone(value) : moment(value);
		return dt.format("hh:mm A");
	}

	MomentHelper.prototype.getDateTime = function (datePart, timePart, isUtc)
	{
		if (!datePart || !timePart)
		{
			return null;
		}

		const tDateIndex = datePart.indexOf("T");
		if (tDateIndex > -1)
		{
			datePart = datePart.substring(0, tDateIndex);
		}

		const tTimeIndex = timePart.indexOf("T")
		if (tTimeIndex > -1)
		{
			timePart = timePart.substring(tTimeIndex + 1);
		}

		const dtDate = moment(`${datePart} ${timePart}`);
		if (!dtDate.isValid())
		{
			return null;
		}

		let dtString = dtDate.format("YYYY-MM-DDTHH:mm:ss");
		if (isUtc)
		{
			const dt = clientTimeZoneToUtc(dtString);
			if (!dt.isValid)
			{
				return null;
			}
			dtString = dt.format("YYYY-MM-DDTHH:mm:ss");
		}

		return dtString;
	}	

	/**
	 * Dispose
	 *
	 */
	MomentHelper.prototype.dispose = function()
	{

	};
})();
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

	MomentHelper.prototype.minsToHHMMSS = function (minutesValue) {
		var mins_num = parseFloat(minutesValue, 10);
		var hours = Math.floor(mins_num / 60);
		var minutes = Math.floor((mins_num - ((hours * 3600)) / 60));
		var seconds = Math.floor((mins_num * 60) - (hours * 3600) - (minutes * 60));
	
		// Appends 0 when unit is less than 10
		if (hours   < 10) {hours   = "0"+hours;}
		if (minutes < 10) {minutes = "0"+minutes;}
		if (seconds < 10) {seconds = "0"+seconds;}

		return hours+':'+minutes+':'+seconds;
	}

	/**
	 * Dispose
	 *
	 */
	MomentHelper.prototype.dispose = function()
	{

	};
})();
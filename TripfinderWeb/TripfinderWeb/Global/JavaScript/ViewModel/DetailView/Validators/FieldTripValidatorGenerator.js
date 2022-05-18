(function()
{
	createNamespace("TF.DetailView.Validators").FieldTripValidatorGenerator = FieldTripValidatorGenerator;

	function FieldTripValidatorGenerator()
	{
	};

	FieldTripValidatorGenerator.prototype = Object.create(TF.DetailView.Validators.BaseValidatorGenerator.prototype);
	FieldTripValidatorGenerator.prototype.constructor = FieldTripValidatorGenerator;

	FieldTripValidatorGenerator.prototype.generateValidators = function()
	{
		// todo: add validators for every field that require certain validation logic
		// Add a property into "validators" object with name equals to the "field" name defined in DataPointsJSON.js
		var self = this,
			validators = {};

		if (!tf.helpers.fieldTripAuthHelper.isFieldTripAdmin())
		{
			validators["DepartDateTime"] = self._generateDepartDateTimeValidator();
		}

		return TF.DetailView.Validators.BaseValidatorGenerator.prototype.generateValidators.call(this, "fieldtrip")
			.then(function(baseValidators)
			{
				return $.extend(baseValidators, validators);
			});
	};

	FieldTripValidatorGenerator.prototype._generateDepartDateTimeValidator = function()
	{
		var self = this;
		return {
			callback: {
				message: "",
				callback: function(value, validator, $field)
				{
					if (!value)
					{
						return { valid: true, message: "" };
					}

					var mmtObj = moment(value);

					if (!mmtObj.isValid())
					{
						return { valid: false, message: " invalid DATE/TIME" };
					}

					return self._validateScheduleDaysInAdvance(value).then(function(result)
					{
						if (!result.valid)
						{
							return result;
						}

						return self._validateBlockTime(value);// Promise.resolve({ valid: false, message: "test" });
					});
				}
			}
		};
	};

	FieldTripValidatorGenerator.prototype._validateScheduleDaysInAdvance = function(dateTime)
	{
		var mmtObj = moment(dateTime), daysInAdvance = tf.fieldTripConfigsDataHelper.fieldTripConfigs.ScheduleDaysInAdvance;
		if (!Number.isInteger(daysInAdvance) || daysInAdvance < 0)	// at least 0 day in advance (>= today)
		{
			daysInAdvance = 0;
		}

		return tf.fieldTripConfigsDataHelper.getHolidayMap()
			.then(function(holidayMap)
			{
				var isSchoolDay = function(mmtDay)	// helper function for detect if a given day (moment date) is school day
				{
					var dateStr = mmtDay.format("YYYY-MM-DD");
					if (!holidayMap[dateStr])
					{
						return true;
					}

					return false;
				};

				if (!isSchoolDay(mmtObj))
				{
					return { valid: false, message: " must depart on school day" };
				}

				var schoolDays = 0,	// counter for valid school days passed
					mmtLeftBound = moment().startOf("day");	// start from today

				while (schoolDays < daysInAdvance)
				{
					mmtLeftBound.add(1, "days");
					if (isSchoolDay(mmtLeftBound))
					{
						++schoolDays;
					}
				}

				if (mmtObj.startOf("day") < mmtLeftBound)
				{
					return { valid: false, message: String.format("Depart Date must be on or after {0}", mmtLeftBound.format("M/D/YYYY")) };
				}

				return { valid: true, message: "" };
			});
	};

	FieldTripValidatorGenerator.prototype._validateBlockTime = function(dateTime)
	{
		var mmtObj = moment(dateTime);
		return tf.fieldTripConfigsDataHelper.getBlockTimes()
			.then(function(blockTimes)
			{
				var dateString = mmtObj.format("YYYY-MM-DD"), startTime = moment.invalid(), endTime = moment.invalid(),
					valid = blockTimes.every(function(blockTime)
					{
						startTime = moment(dateString + " " + blockTime.From);
						endTime = moment(dateString + " " + blockTime.To);

						return !mmtObj.isBetween(startTime, endTime);
					});

				return { valid: valid, message: mmtObj.format('hh:mm A') + " is invalid because of the blockout period of " + startTime.format("hh:mm A") + " to " + endTime.format("hh:mm A") + "." };
			});
	};
})();
(function()
{
	createNamespace('TF.Control').EditFieldTripBlockOutTimeRecordViewModel = EditFieldTripBlockOutTimeRecordViewModel;

	var _DEFAULT_START_DATETIME = new Date("1990-01-01T07:00:00");
	var _DEFAULT_END_DATETIME = new Date("1990-01-01T08:00:00");

	/**
	 * convert full DateTime string (obtained from DateTimePicker) to "HH:mm:ss" or "hh:mm A" format time only string
	 * @param timeStr 
	 */
	function normalizeTimeString(timeStr, use12HourFormat)
	{
		var mmtObj = moment(timeStr),
			formatStr = use12HourFormat === true ? "HH:mm A" : "HH:mm:ss";

		if(!mmtObj || !mmtObj.isValid())
		{
			return null;
		}

		return mmtObj.format(formatStr);
	}

	/**
	 * Convert js Date object to full DateTime String
	 * @param dateObj 
	 */
	function convertDateToTimeString(dateObj)
	{
		var defaultTimeStr = "1990-01-01T07:00:00";

		if(!dateObj)
		{
			return defaultTimeStr;
		}
		var mmtObj = moment(dateObj);

		if(!mmtObj || !mmtObj.isValid())
		{
			return defaultTimeStr;
		}

		return "1990-01-01T" + mmtObj.format("HH:mm:ss");
	}

	function EditFieldTripBlockOutTimeRecordViewModel(configType, recordEntity)
	{
		var self = this;

		TF.Control.EditFieldTripConfigRecordViewModelBase.call(self, configType, recordEntity);

		self.obFromTimeString = ko.observable(convertDateToTimeString(self.isEdit ? recordEntity.From : _DEFAULT_START_DATETIME));
		self.obToTimeString = ko.observable(convertDateToTimeString(self.isEdit ? recordEntity.To : _DEFAULT_END_DATETIME));
	}

	EditFieldTripBlockOutTimeRecordViewModel.prototype = Object.create(TF.Control.EditFieldTripConfigRecordViewModelBase.prototype);

	EditFieldTripBlockOutTimeRecordViewModel.prototype.constructor = EditFieldTripBlockOutTimeRecordViewModel;

	EditFieldTripBlockOutTimeRecordViewModel.prototype.getRecordEntity = function()
	{
		var self = this;

		return {
			ID: self.obRecordId(),
			From: normalizeTimeString(self.obFromTimeString()),
			To: normalizeTimeString(self.obToTimeString())
		};
	};

	EditFieldTripBlockOutTimeRecordViewModel.prototype.updateValidatorFields = function(validatorFields)
	{
		var self = this,
			timeValidatorField = {
				trigger: "blur change",
				validators: {
					callback: {
						message: " required",
						callback: function(value, validator, $field)
						{
							if(!value)
							{
								return {valid: false, message: " required"};
							}

							var mmtFrom = moment(value, ["h:mm A", "hh:mm A"], true);
							if(!mmtFrom.isValid())
							{
								return {valid: false, message: " is invalid"};
							}

							return {valid: true, message: ""};
						}
					}
				}
			};

		validatorFields.fromTime = timeValidatorField;
		validatorFields.toTime = timeValidatorField;
	};

	/**
	 * Only validate From-To time range on saving so as not to trigger too much api call for check unique
	 */
	EditFieldTripBlockOutTimeRecordViewModel.prototype.validateTimeRangeOfRecord = function()
	{
		var self = this,
			fromTime = normalizeTimeString(self.obFromTimeString()),
			toTime = normalizeTimeString(self.obToTimeString());

		if(self.isEdit && fromTime && toTime)
		{
			if(fromTime === normalizeTimeString(self.dataModel._entityBackup.From) &&
				toTime === normalizeTimeString(self.dataModel._entityBackup.To)
			)
			{
				return true;
			}
		}
		if(!fromTime || !toTime || fromTime >= toTime)
		{
			self.pageLevelViewModel.popupErrorMessage("Block Out Time range is invalid. To Time should be later than From Time.")
			return false;
		}

		var recordEntity = {
			From: fromTime,
			To: toTime
		};
		return tf.fieldTripConfigsDataHelper.isRecordExistingByType(self.configType, recordEntity).then(function(existed)
		{
			if(existed)
			{
				var fromTimeDisplay = normalizeTimeString(self.obFromTimeString(), true),
					toTimeDisplay = normalizeTimeString(self.obToTimeString(), true);
				self.pageLevelViewModel.popupErrorMessage(String.format("Block Out Time range already exists.", fromTimeDisplay, toTimeDisplay));
				return false;
			}

			return true;
		});
	}

	/**
	 * Override base save method since we will do time range validation before saving record
	 */
	EditFieldTripBlockOutTimeRecordViewModel.prototype.save = function()
	{
		var self = this;

		self.pageLevelViewModel.clearError();

		return self.pageLevelViewModel.saveValidate()
			.then(function(isValid)
			{
				if(isValid)
				{
					return self.validateTimeRangeOfRecord();
				}

				return false;
			})
			.then(function(isTimeRangeValid)
			{
				var configType = self.configType,
					isNew = self.obRecordId() === -1,
					recordEntity = self.getRecordEntity();

				if(isTimeRangeValid && recordEntity)
				{
					var saveActionPromise = (isNew ? tf.fieldTripConfigsDataHelper.addNewConfigRecordByType(configType, recordEntity) : tf.fieldTripConfigsDataHelper.updateConfigRecordByType(configType, recordEntity));
					return saveActionPromise;
				}

				return null;
			});
	};
})();


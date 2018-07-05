(function()
{
	var namespace = createNamespace('TF.PageLevel');
	namespace.FieldTripDataEntryPageLevelViewModel = FieldTripDataEntryPageLevelViewModel;

	function FieldTripDataEntryPageLevelViewModel(fieldTripDE)
	{
		var self = this;
		namespace.BasePageLevelViewModel.call(self);

		self.inactiveDateEmpty = true;
		self.activeDateEmpty = true;
		self.fieldTripDE = fieldTripDE;

		self.activeLostfouseName = "";
	}

	FieldTripDataEntryPageLevelViewModel.prototype.constructor = FieldTripDataEntryPageLevelViewModel;

	FieldTripDataEntryPageLevelViewModel.prototype = Object.create(namespace.BasePageLevelViewModel.prototype);

	FieldTripDataEntryPageLevelViewModel.prototype.getValidationErrorsSpecifed = function()
	{
		var self = this, validationErrors = [],
			returnDate = new moment(self.fieldTripDE.obEntityDataModel().returnDate()),
			departDate = new moment(self.fieldTripDE.obEntityDataModel().departDate()),
			start = new moment(self.fieldTripDE.obEntityDataModel().departTime()),
			end = new moment(self.fieldTripDE.obEntityDataModel().returnTime()),
			isSameDay = returnDate.isSame(departDate, "day"),
			isDateAfter = departDate.isAfter(returnDate),
			isTimeAfter = false,
			message;

		start.year(2010);
		start.dayOfYear(1);

		end.year(2010);
		end.dayOfYear(1);
		isTimeAfter = start.isValid() && end.isValid() && start.isAfter(end);

		if (!isSameDay && isDateAfter)
		{
			if (self.activeLostfouseName === "departDate")
			{
				message = 'Return Date must be greater than or equal to Depart Date';
				validationErrors.push({ message: message });
			}
			else
			{
				message = 'Depart Date must be less than or equal to Return Date';
				validationErrors.push({ message: message });
			}
		}
		else if (isSameDay && isTimeAfter)
		{
			if (self.activeLostfouseName === "departTime")
			{
				message = 'Return Time must be greater than or equal to Depart Time';
				validationErrors.push({ message: message });
			}
			else
			{
				message = 'Depart Time must be less than or equal to Return Time';
				validationErrors.push({ message: message });
			}
		}

		return validationErrors;
	}

	FieldTripDataEntryPageLevelViewModel.prototype.getValidationErrors = function(valid)
	{
		var baseValidationErrors = namespace.BasePageLevelViewModel.prototype.getValidationErrors.call(this);

		var validationErrors = [];
		baseValidationErrors.forEach(function(error)
		{
			if (error.rightMessage.indexOf("must be greater than or equal to") >= 0 || error.rightMessage.indexOf("must be less than or equal to") >= 0)
			{
				return;
			}

			validationErrors.push(error);
		});
		return validationErrors;
	}

})();


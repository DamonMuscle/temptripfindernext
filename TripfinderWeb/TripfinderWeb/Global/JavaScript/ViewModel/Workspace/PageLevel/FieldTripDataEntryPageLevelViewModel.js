(function()
{
	var namespace = createNamespace('TF.PageLevel');
	namespace.FieldTripDataEntryPageLevelViewModel = FieldTripDataEntryPageLevelViewModel;

	function FieldTripDataEntryPageLevelViewModel()
	{
		namespace.BasePageLevelViewModel.call(this);

		this.inactiveDateEmpty = true;
		this.activeDateEmpty = true;

		this.activeLostfouseName = "";
	}

	FieldTripDataEntryPageLevelViewModel.prototype.constructor = FieldTripDataEntryPageLevelViewModel;

	FieldTripDataEntryPageLevelViewModel.prototype = Object.create(namespace.BasePageLevelViewModel.prototype);

	FieldTripDataEntryPageLevelViewModel.prototype.getValidationErrorsSpecifed = function()
	{
		var validationErrors = [];
		if (this.activeLostfouseName != "")
		{
			if (this.activeLostfouseName == "departDate")
			{
				var message = 'Return Date must be greater than or equal to Depart Date';
				validationErrors.push({ message: message });
			}
			else if (this.activeLostfouseName == "returnDate")
			{
				var message = 'Depart Date must be less than or equal to Return Date';
				validationErrors.push({ message: message });
			}
			else if (this.activeLostfouseName == "departTime")
			{
				var message = 'Return Time must be greater than or equal to Depart Time';
				validationErrors.push({ message: message });
			}
			else if (this.activeLostfouseName == "returnTime")
			{
				var message = 'Depart Time must be less than or equal to Return Time';
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


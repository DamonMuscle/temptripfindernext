(function()
{
	var namespace = createNamespace('TF.PageLevel');
	namespace.EditThematicConfigPageLevelViewModel = EditThematicConfigPageLevelViewModel;

	function EditThematicConfigPageLevelViewModel(getSelectRecordsFunction)
	{
		var self = this;
		namespace.BasePageLevelViewModel.call(self);

		self.getSelectRecordsFunction = getSelectRecordsFunction;
	}

	EditThematicConfigPageLevelViewModel.prototype.constructor = EditThematicConfigPageLevelViewModel;

	EditThematicConfigPageLevelViewModel.prototype = Object.create(namespace.BasePageLevelViewModel.prototype);

	EditThematicConfigPageLevelViewModel.prototype.getValidationErrorsSpecifed = function()
	{
		var self = this, validationErrors = [];
		if (!self.getSelectRecordsFunction())
		{
			var message = "At least one Value need be selected.";
			validationErrors.push({ message: message });
		}

		return validationErrors;
	}

	/**
	 * Validate for thematic data excluding name.
	 * @return {Boolean} Whether the validation is successful.
	 */
	EditThematicConfigPageLevelViewModel.prototype.getThematicValidation = function()
	{
		var self = this,
			validationErrors = self.getValidationErrorsSpecifed(),
			validationPass = validationErrors.length == 0;

		self.obValidationErrorsSpecifed(validationErrors);
		self.obErrorMessageDivIsShow(!validationPass);
		return validationPass;
	};
})();

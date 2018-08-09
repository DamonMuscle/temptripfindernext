(function()
{
	var namespace = createNamespace('TF.PageLevel');
	namespace.EditDocumentPageLevelViewModel = EditDocumentPageLevelViewModel;

	function EditDocumentPageLevelViewModel()
	{
		namespace.BasePageLevelViewModel.call(this);
		this.failedDocumentNames = [];
	}

	EditDocumentPageLevelViewModel.prototype.constructor = EditDocumentPageLevelViewModel;

	EditDocumentPageLevelViewModel.prototype = Object.create(namespace.BasePageLevelViewModel.prototype);

	EditDocumentPageLevelViewModel.prototype.getValidationErrorsSpecifed = function()
	{
		var validationErrors = [];
		if (this.failedDocumentNames.length > 0)
		{
			var message = 'Failed to upload: "' + this.failedDocumentNames.join(",") + '" already exists.';
			validationErrors.push({ message: message });
		}
		this.failedDocumentNames=[];
		return validationErrors;
	}

	EditDocumentPageLevelViewModel.prototype.getValidationErrors = function(valid)
	{
		var validationErrors = namespace.BasePageLevelViewModel.prototype.getValidationErrors.call(this);

		return $.grep(validationErrors, function(error)
		{
			return error.rightMessage.indexOf("failed to upload") == -1;
		});
	}

})();


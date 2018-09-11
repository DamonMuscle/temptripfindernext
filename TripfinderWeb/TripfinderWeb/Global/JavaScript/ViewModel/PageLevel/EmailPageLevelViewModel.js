(function()
{
	var namespace = createNamespace('TF.PageLevel');
	namespace.EmailPageLevelViewModel = EmailPageLevelViewModel;

	function EmailPageLevelViewModel(viewModel)
	{
		namespace.BasePageLevelViewModel.call(this);

		this.sendEmailOfGridViewModel = viewModel;
	}

	EmailPageLevelViewModel.prototype.constructor = EmailPageLevelViewModel;

	EmailPageLevelViewModel.prototype = Object.create(namespace.BasePageLevelViewModel.prototype);

	EmailPageLevelViewModel.prototype.getValidationErrorsSpecifed = function()
	{
		var validationErrors = [], message = "", toAddressList = this.sendEmailOfGridViewModel.obEmailToList(), CcAddressList = this.sendEmailOfGridViewModel.obEmailCcList(), BccAddressList = this.sendEmailOfGridViewModel.obEmailBccList();
    if(toAddressList.length == 0 && CcAddressList.length == 0 && BccAddressList.length == 0)
    {
      message = "At least one recipient is required.";
      validationErrors.push({ message: message });
    }

		return validationErrors;
	}

})();

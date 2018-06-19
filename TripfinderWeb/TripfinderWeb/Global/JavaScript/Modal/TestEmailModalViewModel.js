(function()
{
    createNamespace('TF.Modal').TestEmailModalViewModel = TestEmailModalViewModel;

    function TestEmailModalViewModel(settingsConfigurationDataModal)
    {
        TF.Modal.BaseModalViewModel.call(this);
        this.title("Test Email");
        //this.sizeCss = "modal-lg";
        this.contentTemplate('modal/TestEmailControl');
        this.buttonTemplate('modal/positivenegative');
        this.obPositiveButtonLabel("Send Test Email");
        this.testEmailViewModel = new TF.Control.TestEmailViewModel(settingsConfigurationDataModal.clone());
        this.data(this.testEmailViewModel);
    }

    TestEmailModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
    TestEmailModalViewModel.prototype.constructor = TestEmailModalViewModel;

    TestEmailModalViewModel.prototype.positiveClick = function()
    {
        this.testEmailViewModel.apply().then(function(result)
        {
            if (result)
            {
                this.positiveClose(result);
            }
        }.bind(this));
    };

    TestEmailModalViewModel.prototype.negativeClick = function()
    {
        this.testEmailViewModel.close().then(function(result)
        {
            if (result)
            {
                this.positiveClose(result);
            }
        }.bind(this));
    };


    TestEmailModalViewModel.prototype.dispose = function()
    {
        this.testEmailViewModel.dispose();
    };

})();


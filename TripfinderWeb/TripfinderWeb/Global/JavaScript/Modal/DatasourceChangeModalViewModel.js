(function()
{
	createNamespace("TF.Modal").DataSourceChangeModalViewModel = DataSourceChangeModalViewModel;

	function DataSourceChangeModalViewModel(currentDatabaseName)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Data Source");
		this.sizeCss = "modal-sm";
		this.obPositiveButtonLabel("Apply");
		this.contentTemplate('modal/datasourcechangecontrol');
		if (currentDatabaseName)
		{
			this.buttonTemplate('modal/positivenegative');
		}
		else
		{
			this.buttonTemplate('modal/positive');
			this.obCloseButtonVisible(false);
		}
		this.dataSourceChangeViewModel = new TF.Control.DataSourceChangeViewModel();
		this.data(this.dataSourceChangeViewModel);
	}

	DataSourceChangeModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	DataSourceChangeModalViewModel.prototype.constructor = DataSourceChangeModalViewModel;

	DataSourceChangeModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		return this.dataSourceChangeViewModel.apply()
		.then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			} else
			{
				this.negativeClose();
			}
		}.bind(this));
	};

})();

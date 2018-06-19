(function()
{
	createNamespace("TF.Modal").GenerateReportModalViewModel = GenerateReportModalViewModel;

	function GenerateReportModalViewModel(udReport, output, options)
	{
		this.options = options;
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Generate Report");
		this.sizeCss = "modal-lg";
		this.contentTemplate('modal/GenerateReportControl');
		this.buttonTemplate('modal/positivenegative');
		this.addReportViewModel = new TF.Control.GenerateReportViewModel(udReport, output, options);
		this.data(this.addReportViewModel);

	}

	GenerateReportModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	GenerateReportModalViewModel.prototype.constructor = GenerateReportModalViewModel;

	GenerateReportModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		return this.addReportViewModel.apply()
		.then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	GenerateReportModalViewModel.prototype.negativeClick = function()
	{
		this.addReportViewModel.cancel().then(function(result)
		{
			if (result)
			{
				this.negativeClose(false);
			}
		}.bind(this));
	};


	GenerateReportModalViewModel.prototype.dispose = function()
	{
		//this.addReportViewModel().destroy();
	};


})();

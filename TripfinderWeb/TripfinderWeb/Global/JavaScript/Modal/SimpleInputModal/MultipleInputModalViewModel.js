(function()
{
	createNamespace("TF.Modal").MultipleInputModalViewModel = MultipleInputModalViewModel;

	function MultipleInputModalViewModel(options)
	{
		TF.Modal.SingleInputModalViewModel.call(this, options);
		this.contentTemplate('modal/SimpleInput/MultipleInput');
		this.viewModel = new TF.Control.MultipleInputViewModel(options);
		this.data(this.viewModel);
	}

	MultipleInputModalViewModel.prototype = Object.create(TF.Modal.SingleInputModalViewModel.prototype);

	MultipleInputModalViewModel.prototype.constructor = MultipleInputModalViewModel;
})();

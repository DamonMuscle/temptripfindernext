(function()
{
	createNamespace("TF.Modal").GlobalReplaceModalViewModel = GlobalReplaceModalViewModel;

	function GlobalReplaceModalViewModel(entityType, ids)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Global Replace");
		//this.sizeCss = "modal-lg";
		this.contentTemplate('workspace/grid/globalreplace');
		this.buttonTemplate('modal/positivenegative');
		this.obPositiveButtonLabel = ko.observable("Save");
		this.globalReplaceViewModel = new TF.Grid.GlobalReplaceViewModel(entityType, ids);
		this.data(this.globalReplaceViewModel);
	};

	GlobalReplaceModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	GlobalReplaceModalViewModel.prototype.constructor = GlobalReplaceModalViewModel;

	GlobalReplaceModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		this.globalReplaceViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	GlobalReplaceModalViewModel.prototype.dispose = function()
	{
		this.globalReplaceViewModel.dispose();
	};
})();

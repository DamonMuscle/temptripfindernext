(function()
{
	createNamespace('TF.Modal').ListMoverSelectRecordControlModalViewModel = ListMoverSelectRecordControlModalViewModel;

	function ListMoverSelectRecordControlModalViewModel(selectedData, options)
	{
		options.displayCheckbox = false;
		options.showRemoveColumnButton = true;
		options.contentTemplate = "modal/ListMoverSelectRecordControl";
		//options.mustSelect = false;
		TF.Modal.KendoListMoverWithSearchControlModalViewModel.call(this, selectedData, options);
		this.ListMoverSelectRecordControlViewModel = new TF.Control.ListMoverSelectRecordControlViewModel(selectedData, options);
		this.data(this.ListMoverSelectRecordControlViewModel);
	}

	ListMoverSelectRecordControlModalViewModel.prototype = Object.create(TF.Modal.KendoListMoverWithSearchControlModalViewModel.prototype);
	ListMoverSelectRecordControlModalViewModel.prototype.constructor = ListMoverSelectRecordControlModalViewModel;

	ListMoverSelectRecordControlModalViewModel.prototype.positiveClick = function()
	{
		this.ListMoverSelectRecordControlViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	ListMoverSelectRecordControlModalViewModel.prototype.negativeClick = function()
	{
		this.ListMoverSelectRecordControlViewModel.cancel().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
			else
			{
				this.negativeClose(false);
			}
		}.bind(this));
	};

})();

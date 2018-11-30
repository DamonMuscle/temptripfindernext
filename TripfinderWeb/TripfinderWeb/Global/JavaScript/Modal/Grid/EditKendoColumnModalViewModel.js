(function()
{
	createNamespace("TF.Modal.Grid").EditKendoColumnModalViewModel = EditKendoColumnModalViewModel;

	function EditKendoColumnModalViewModel(availableColumns, selectedColumns, defaultLayoutColumns)
	{
		var self = this;
		TF.Modal.BaseModalViewModel.call(self);
		self.sizeCss = "modal-dialog-lg";
		self.title("Show/Hide Grid Columns");
		self.contentTemplate("workspace/grid/editkendocolumn");
		self.buttonTemplate("modal/positivenegativeother");
		self.editKendoColumnViewModel = new TF.Grid.EditKendoColumnViewModel(availableColumns, selectedColumns, defaultLayoutColumns, this.shortCutKeyHashMapKeyName);
		self.data(self.editKendoColumnViewModel);
		self.obPositiveButtonLabel("Apply");
		self.obOtherButtonLabel("Reset");
	}

	EditKendoColumnModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	EditKendoColumnModalViewModel.prototype.constructor = EditKendoColumnModalViewModel;

	EditKendoColumnModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		this.editKendoColumnViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	EditKendoColumnModalViewModel.prototype.otherClick = function(viewModel, e)
	{
		this.editKendoColumnViewModel.reset();
	};

	EditKendoColumnModalViewModel.prototype.dispose = function()
	{
		this.editKendoColumnViewModel.dispose();
	};
})();


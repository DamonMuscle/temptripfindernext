(function()
{
	createNamespace("TF.DetailView").ListMoverFieldEditorModalViewModel = ListMoverFieldEditorModalViewModel;

	function ListMoverFieldEditorModalViewModel(options)
	{
		var self = this,
			title = 'Select ' + options.title;
		TF.Modal.BaseModalViewModel.call(self);
		self.sizeCss = "modal-md";
		self.modalClass = "list-mover-modal";
		self.title(title);
		self.contentTemplate('workspace/detailview/fieldeditorlistmover');
		self.buttonTemplate('modal/positivenegativeother');
		self.obPositiveButtonLabel("Save");
		self.obOtherButtonLabel("Reset");
		self.listMoverFieldEditor = new TF.DetailView.ListMoverFieldEditorViewModel(options);
		self.data(self.listMoverFieldEditor);
		if (options.onCloseListMover)
		{
			options.onCloseListMover.subscribe(function(e, value)
			{
				self[value ? "positiveClick" : "negativeClick"]();
			}.bind(self));
		}
		self.notDelayTrigger = true;
	};

	ListMoverFieldEditorModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	ListMoverFieldEditorModalViewModel.prototype.constructor = ListMoverFieldEditorModalViewModel;

	ListMoverFieldEditorModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		this.listMoverFieldEditor.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	ListMoverFieldEditorModalViewModel.prototype.negativeClick = function(viewModel, e)
	{
		this.negativeClose();
	};

	ListMoverFieldEditorModalViewModel.prototype.otherClick = function(viewModel, e)
	{
		this.listMoverFieldEditor.reset();
	}

	ListMoverFieldEditorModalViewModel.prototype.dispose = function()
	{
		TF.Modal.BaseModalViewModel.prototype.dispose.call(this);
		this.listMoverFieldEditor.dispose();
	};

})();
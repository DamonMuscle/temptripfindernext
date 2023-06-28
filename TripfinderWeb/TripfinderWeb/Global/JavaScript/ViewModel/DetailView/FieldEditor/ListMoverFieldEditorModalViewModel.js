(function()
{
	createNamespace("TF.DetailView").ListMoverFieldEditorModalViewModel = ListMoverFieldEditorModalViewModel;

	function ListMoverFieldEditorModalViewModel(options)
	{
		var self = this,
			title = 'Select ' + options.title;
		TF.Modal.BaseModalViewModel.call(self);
		self.options = options;
		self.obResizable(!!options.resizable);
		if(options.modalWidth)
		{
			self.modalWidth(options.modalWidth + "px");
		}

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
		self.requiredItems = typeof options.getRequiredItemIds === "function" && options.recordEntity ? options.getRequiredItemIds(options.recordEntity) : [];
	};

	ListMoverFieldEditorModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	ListMoverFieldEditorModalViewModel.prototype.constructor = ListMoverFieldEditorModalViewModel;

	ListMoverFieldEditorModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		var self = this;
		self.listMoverFieldEditor.apply().then(function(result)
		{
			if (result && Array.isArray(result))
			{
				Promise.resolve(self.requiredItems).then(items =>
				{
					var omittedItems = items.filter(x => !result.includes(x));

					if (!omittedItems.length)
					{
						self.positiveClose(result);
					}
					else
					{
						tf.promiseBootbox.alert(self.options.getWarningMessage(self.options, omittedItems));
					}
				});
			}
		});
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
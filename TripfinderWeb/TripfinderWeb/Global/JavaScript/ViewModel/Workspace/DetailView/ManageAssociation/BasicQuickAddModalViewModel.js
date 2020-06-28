(function()
{
	createNamespace("TF.DetailView").BasicQuickAddModalViewModel = BasicQuickAddModalViewModel;

	function BasicQuickAddModalViewModel(options)
	{
		var self = this,
			dataType = options.dataType,
			modeName = !options.recordId ? "Add" : "Edit",
			typeName = tf.dataTypeHelper.getFormalDataTypeName(dataType),
			title = String.format("{0} {1}", modeName, typeName),
			viewModel = new TF.DetailView.BasicQuickAddViewModel(options);

		TF.Modal.BaseModalViewModel.call(self);

		self.sizeCss = "modal-dialog-xl";
		self.modalClass = 'quick-add enable-tab';
		self.data(viewModel);
		self.title(title);
		self.contentTemplate("Workspace/detailview/ManageAssociation/BasicQuickAdd");
		self.buttonTemplate("modal/positivenegative");
		self.obPositiveButtonLabel("Save & Close");
	};

	BasicQuickAddModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	BasicQuickAddModalViewModel.prototype.constructor = BasicQuickAddModalViewModel;

	/**
	 * React when the positive button is clicked.
	 * @return {void}
	 */
	BasicQuickAddModalViewModel.prototype.positiveClick = function()
	{
		var self = this;
		self.data().save().then(function(result)
		{
			if (result) 
			{
				self.positiveClose(result);
			}
			else if (result !== false)
			{
				self.negativeClose();
			}
		});
	};

	/**
	 * React when the negative button is clicked.
	 * @return {void}
	 */
	BasicQuickAddModalViewModel.prototype.negativeClick = function()
	{
		this.negativeClose(false);
	};

	/**
	 * Dispose
	 * @return {void}
	 */
	BasicQuickAddModalViewModel.prototype.dispose = function()
	{
		this.data().dispose();
	};
})();
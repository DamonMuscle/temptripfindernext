(function()
{
	createNamespace("TF.DetailView").BasicQuickAddModalViewModel = BasicQuickAddModalViewModel;

	function BasicQuickAddModalViewModel(options)
	{
		let self = this,
            dataType = options.dataType,
            editModelName = options.isReadOnly ? "" : "Edit",
			modeName = !options.recordId ? "Add" : "Edit",
			typeName = tf.dataTypeHelper.getFormalDataTypeName(dataType),
			title = String.format("{0} {1}", modeName, typeName);

		if (options.isUDFGroup)
		{
			modeName = !options.recordEntity ? "Add" : "Edit";
			title = String.format("{0} {1} Entry", modeName, options.udGrid.Name);
		}

		let viewModel = new TF.DetailView.BasicQuickAddViewModel(options);

		TF.Modal.BaseModalViewModel.call(self);
        let hasSignature = false;
        if (options.recordEntity) {
            hasSignature = !!options.recordEntity.signature;
        }
        self.isReadOnly = options.isReadOnly || hasSignature;
		self.sizeCss = TF.isMobileDevice ? "modal-dialog-lg-mobile" : "modal-dialog-xl";
		self.modalClass = 'quick-add enable-tab';
		self.data(viewModel);
		self.title(title);
		self.contentTemplate("Workspace/detailview/ManageAssociation/BasicQuickAdd");
        if (self.isReadOnly) {
            self.buttonTemplate("modal/positive");
            self.obPositiveButtonLabel("OK");
            if (options.isUDFGroup) {
                self.obPositiveButtonLabel("Close");
            }
        } else {
            self.buttonTemplate("modal/positivenegative");
            if (options.isUDFGroup) {
                self.obPositiveButtonLabel("Submit");
            }
            else {
                self.obPositiveButtonLabel("Save & Close");
            }
        }	};

	BasicQuickAddModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	BasicQuickAddModalViewModel.prototype.constructor = BasicQuickAddModalViewModel;

	/**
	 * React when the positive button is clicked.
	 * @return {void}
	 */
	BasicQuickAddModalViewModel.prototype.positiveClick = function()
	{
        var self = this;
        if (this.isReadOnly) {
            self.negativeClose();
        } else {
            self.data().save().then(function (result) {
                if (result) {
                    self.positiveClose(result);
                }
                else if (result !== false) {
                    self.negativeClose();
                }
            });
        }
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
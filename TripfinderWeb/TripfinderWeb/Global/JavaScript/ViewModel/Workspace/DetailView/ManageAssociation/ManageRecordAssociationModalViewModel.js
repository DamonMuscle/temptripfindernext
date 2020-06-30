(function() {
    createNamespace("TF.DetailView").ManageRecordAssociationModalViewModel = ManageRecordAssociationModalViewModel;

    function ManageRecordAssociationModalViewModel(options) {
        var self = this,
            typeName = tf.dataTypeHelper.getFormalDataTypeName(options.associationType),
            title = String.format("Associate {0}", tf.applicationTerm.getApplicationTermPluralByName(typeName)),
            viewModel = new TF.DetailView.ManageRecordAssociationViewModel(options);

        TF.Modal.BaseModalViewModel.call(self);

        self.sizeCss = TF.isMobileDevice ? "modal-dialog-lg-mobile" : "modal-dialog-xl";
        self.modalClass = 'quick-add enable-tab';
        self.buttonTemplate("modal/positivenegative");
        self.contentTemplate("Workspace/detailview/ManageAssociation/ManageRecordAssociation");
        self.obPositiveButtonLabel("Save & Close");
        self.title(title);
        self.data(viewModel);
    };

    ManageRecordAssociationModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
    ManageRecordAssociationModalViewModel.prototype.constructor = ManageRecordAssociationModalViewModel;

    /**
     * React when the positive button is clicked.
     * @return {void}
     */
    ManageRecordAssociationModalViewModel.prototype.positiveClick = function() {
        var self = this;
        self.data().save().then(function(result) {
            if (result) {
                self.positiveClose(result);
            } else if (result !== false) {
                self.negativeClose();
            }
        });
    };

    /**
     * React when the negative button is clicked.
     * @return {void}
     */
    ManageRecordAssociationModalViewModel.prototype.negativeClick = function() {
        this.negativeClose(false);
    };

    /**
     * Dispose
     * @return {void}
     */
    ManageRecordAssociationModalViewModel.prototype.dispose = function() {
        this.data().dispose();
    };
})();
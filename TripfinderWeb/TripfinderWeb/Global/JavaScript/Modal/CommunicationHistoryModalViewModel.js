(function()
{
	createNamespace("TF.Modal").CommunicationHistoryModalViewModel = CommunicationHistoryModalViewModel;

	function CommunicationHistoryModalViewModel(options)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("View Communication History");
		this.sizeCss = "modal-dialog-lg";
		this.contentTemplate("Workspace/detailview/MergeDocumentsSentModal");
		this.buttonTemplate("modal/negative");
		this.obNegativeButtonLabel("Close");
		this.obResizable(false);
		this.mergeDocumentsSentDetailViewViewModel = new TF.DetailView.MergeDocumentsSentDetailViewViewModel(options.recordId, options.dataType, null, options.pageLevelViewModel, true, options, options.parentDocument);
		this.data(this.mergeDocumentsSentDetailViewViewModel);
	}

	CommunicationHistoryModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	CommunicationHistoryModalViewModel.prototype.constructor = CommunicationHistoryModalViewModel;

	CommunicationHistoryModalViewModel.prototype.negativeClick = function(viewModel, e)
	{
		var self = this;
		self.negativeClose();
		return true;
	};
})();



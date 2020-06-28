(function()
{
	createNamespace("TF.DetailView").FieldTripInvoiceModalViewModel = FieldTripInvoiceModalViewModel;

	function FieldTripInvoiceModalViewModel(options)
	{
		var self = this;
		options = options || {};
		TF.Modal.BaseModalViewModel.call(self, options);
		self.title((options.isNew ? "Add" : "Edit") + " Field Trip Invoice");
		self.contentTemplate = "Workspace/detailview/fieldTripInvoice";
		self.buttonTemplate("modal/positivenegative");
		self.sizeCss = "modal-dialog";
		var data = new TF.DetailView.FieldTripInvoiceViewModel(options);
		self.data(data);
	};

	FieldTripInvoiceModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	FieldTripInvoiceModalViewModel.prototype.constructor = FieldTripInvoiceModalViewModel;

	FieldTripInvoiceModalViewModel.prototype.positiveClick = function()
	{
		var self = this;
		self.data().apply().then(function(data)
		{
			if (data)
			{
				self.positiveClose(data);
			}
		});
	};

	FieldTripInvoiceModalViewModel.prototype.dispose = function()
	{
	};
})();
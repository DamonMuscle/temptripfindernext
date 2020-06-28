(function()
{
	createNamespace("TF.DetailView").FieldTripResourceModalViewModel = FieldTripResourceModalViewModel;

	function FieldTripResourceModalViewModel(options)
	{
		var self = this;
		options = options || {};
		TF.Modal.BaseModalViewModel.call(self, options);
		self.title((options.isNew ? "Add" : "Edit") + " Field Trip Resource");
		self.contentTemplate = "Workspace/detailview/FieldTripResource";
		self.buttonTemplate("modal/positivenegative");
		self.obPositiveButtonLabel("Save & Close");
		self.sizeCss = "modal-md";
		var data = new TF.DetailView.FieldTripResourceViewModel(options);
		self.data(data);
		self.cancelPrompt = true;
	};

	FieldTripResourceModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	FieldTripResourceModalViewModel.prototype.constructor = FieldTripResourceModalViewModel;

	FieldTripResourceModalViewModel.prototype.positiveClick = function()
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

	FieldTripResourceModalViewModel.prototype.dispose = function()
	{
		this.data().dispose();
	};
})();
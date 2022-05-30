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

	FieldTripResourceModalViewModel.prototype.negativeClose = function(returnData)
	{
		if (this.data().apiIsDirty())
		{
			return tf.promiseBootbox.yesNo({ message: "You have unsaved changes.  Would you like to save your changes prior to closing?", backdrop: true, title: "Unsaved Changes", closeButton: true })
				.then(function(result)
				{
					if (result === true)
					{
						return this.positiveClick();
					}
					if (result === false)
					{
						return TF.Modal.BaseModalViewModel.prototype.negativeClose.call(this, returnData);
					}
				}.bind(this));
		}
		else
		{
			TF.Modal.BaseModalViewModel.prototype.negativeClose.call(this, returnData);
		}
	};

	FieldTripResourceModalViewModel.prototype.dispose = function()
	{
		this.data().dispose();
	};
})();
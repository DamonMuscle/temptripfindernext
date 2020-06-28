(function()
{
	createNamespace("TF.DetailView").ConditionalAppearanceModalViewModel = ConditionalAppearanceModalViewModel;

	function ConditionalAppearanceModalViewModel(options)
	{
		var self = this;

		TF.Modal.BaseModalViewModel.call(self);

		self.sizeCss = "modal-dialog-condition";
		self.modalClass = "conditionalAppearance-modal";

		self.conditionalAppearanceViewModel = new TF.DetailView.ConditionalAppearanceViewModel(options);
		self.data(self.conditionalAppearanceViewModel);

		ko.computed(function()
		{
			self.dataPoint = self.conditionalAppearanceViewModel.dataPoint();
			self.title(self.dataPoint.displayText() + " Conditional Appearance");
		}, self);

		self.contentTemplate("Workspace/DetailView/ConditionalAppearanceModal");
		self.buttonTemplate("modal/positivenegative");
	};

	ConditionalAppearanceModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	ConditionalAppearanceModalViewModel.prototype.constructor = ConditionalAppearanceModalViewModel;

	/**
	 * The event handler when the positive button is clicked.
	 * @param {Object} viewModel 
	 * @param {Event} e
	 * @return {String} 
	 */
	ConditionalAppearanceModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		var self = this,
			result = self.conditionalAppearanceViewModel.save();

		if (!!result)
		{
			self.positiveClose(result);
		}
	};

	/** 
	 * The event handler when the negative button is clicked.
	 * @return {void}
	 */
	ConditionalAppearanceModalViewModel.prototype.negativeClick = function()
	{
		this.negativeClose(false);
	};
})();
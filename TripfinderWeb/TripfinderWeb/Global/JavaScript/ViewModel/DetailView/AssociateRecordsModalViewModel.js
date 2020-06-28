(function()
{
	createNamespace("TF.DetailView").AssociateRecordsModalViewModel = AssociateRecordsModalViewModel;

	function AssociateRecordsModalViewModel(options)
	{
		var self = this,
			selectedData = options.selectedData,
			defaultOptions = {
				'title': 'Associate Records',
				'contentTemplate': "Workspace/detailview/AssociateRecords",
				'type': 'record',
				'modalViewModel': self
			};
		options = $.extend({}, defaultOptions, options);
		TF.Modal.KendoListMoverWithSearchControlModalViewModel.call(self, selectedData, options);
		self.associateRecordsViewModel = new TF.DetailView.AssociateRecordsViewModel(selectedData, options);
		self.data(self.associateRecordsViewModel);
		self.obDisableControl(true);
	};

	AssociateRecordsModalViewModel.prototype = Object.create(TF.Modal.KendoListMoverWithSearchControlModalViewModel.prototype);
	AssociateRecordsModalViewModel.prototype.constructor = AssociateRecordsModalViewModel;

	AssociateRecordsModalViewModel.prototype.positiveClick = function()
	{
		var self = this,
			result = self.associateRecordsViewModel.exportResult();

		self.positiveClose(result);
	};

	AssociateRecordsModalViewModel.prototype.negativeClick = function()
	{
		var self = this;
		self.negativeClose(false);
	};

	AssociateRecordsModalViewModel.prototype.dispose = function()
	{
		this.associateRecordsViewModel.dispose();
	};
})();
(function()
{
	createNamespace("TF.Modal.Report").SpecificRecordsModalViewModel = SpecificRecordsModalViewModel;

	var DEFAULT_OPTION = {
		'type': 'record',
	};

	function SpecificRecordsModalViewModel(option)
	{
		var self = this,
			dataTypeName = tf.dataTypeHelper.getFormalDataTypeName(option.dataType),
			modalTitle = String.format("Select Records ({0})", dataTypeName);

		TF.Modal.BaseModalViewModel.call(self);

		self.title(modalTitle);
		self.sizeCss = TF.isMobileDevice ? "modal-lg is-mobile-device" : "modal-lg";
		self.contentTemplate("workspace/report/SpecificRecords");
		self.buttonTemplate("modal/positivenegative");

		option = $.extend({}, DEFAULT_OPTION, option);
		self.viewModel = new TF.Control.Report.SpecificRecordsViewModel(option);
		self.data(self.viewModel);
	};

	SpecificRecordsModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	SpecificRecordsModalViewModel.prototype.constructor = SpecificRecordsModalViewModel;

	SpecificRecordsModalViewModel.prototype.positiveClick = function()
	{
		var selectedIds = this.viewModel.searchExistingViewModel.obSelectedData();
		this.positiveClose(selectedIds);
	};

	SpecificRecordsModalViewModel.prototype.dispose = function()
	{
		this.viewModel.dispose();
	};
})();
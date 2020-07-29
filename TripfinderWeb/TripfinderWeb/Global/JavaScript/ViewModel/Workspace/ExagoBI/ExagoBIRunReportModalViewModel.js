(function()
{
	createNamespace('TF.Modal.Report').ExagoBIRunReportModalViewModel = ExagoBIRunReportModalViewModel;

	function ExagoBIRunReportModalViewModel(option)
	{
		var self = this,
			reportName = option.entity.Name,
			editOnly = option.editOnly === true,
			isPreview = option && option.previewReportInfo,
			modalTitlePrefix = editOnly ? "Set Default Filters and Parameters" : isPreview ? "Preview Report" : "Run Report",
			modalTitle = String.format("{0} - {1}", modalTitlePrefix, reportName),
			positiveButtonText = editOnly ? "Save" : isPreview ? "Preview" : "Run";

		TF.Modal.BaseModalViewModel.call(self);

		self.editOnly = editOnly;
		self.title(modalTitle);
		this.sizeCss = TF.isMobileDevice ? "modal-lg is-mobile-device" : "modal-lg";
		self.obPositiveButtonLabel(positiveButtonText);
		self.contentTemplate("workspace/Report/RunReport");
		self.buttonTemplate("modal/positivenegative");

		self.viewModel = new TF.Control.Report.ExagoBIRunReportViewModel(option);
		self.data(self.viewModel);
	}

	ExagoBIRunReportModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	ExagoBIRunReportModalViewModel.prototype.constructor = ExagoBIRunReportModalViewModel;

	ExagoBIRunReportModalViewModel.prototype.positiveClick = function()
	{
		var self = this,
			editOnly = self.editOnly;

		Promise.resolve(editOnly ? self.viewModel.saveFilterAndParameters() : self.viewModel.run())
			.then(function(result)
			{
				if (!result) return;

				self.positiveClose(result);
			});
	};

	ExagoBIRunReportModalViewModel.prototype.negativeClick = function()
	{
		this.negativeClose();
	};

	ExagoBIRunReportModalViewModel.prototype.dispose = function()
	{
		this.viewModel.dispose();
	};
})();


(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").AssignStudentsModalViewModel = AssignStudentsModalViewModel;

	function AssignStudentsModalViewModel(options)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Assign Students");
		this.sizeCss = "modal-dialog";
		this.modalClass = "assign-stop-body";
		this.contentTemplate("workspace/RoutingMap/RoutingMapPanel/RoutingPalette/AssignStudents");
		this.buttonTemplate('modal/positivenegative');
		this.obPositiveButtonLabel("Apply");
		this.obNegativeButtonLabel("Cancel");
		this.obDisableControl(true);
		this.viewModel = new TF.RoutingMap.RoutingPalette.AssignStudentsViewModel(options, this.obDisableControl);
		this.data(this.viewModel);
	}

	AssignStudentsModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	AssignStudentsModalViewModel.prototype.constructor = AssignStudentsModalViewModel;

	AssignStudentsModalViewModel.prototype.otherClick = function(viewModel, e)
	{
		this.viewModel.deleteSelectedTripStops();
	};

	AssignStudentsModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	AssignStudentsModalViewModel.prototype.negativeClick = function()
	{
		var self = this;
		this.viewModel.cancel().then(function(result)
		{
			if (result)
			{
				self.hide();
				self.resolve();
			}
		});
	};

})();
(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").StudentDetailModalViewModel = StudentDetailModalViewModel;

	function StudentDetailModalViewModel(students, isRightClick, dataModel, canOpenDetail)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Student Detail");
		this.sizeCss = "modal-dialog-sm";
		this.contentTemplate("workspace/Routing Map/RoutingMapPanel/RoutingPalette/StudentDetail");
		this.buttonTemplate("modal/positive");
		this.obPositiveButtonLabel("OK");
		this.viewModel = new TF.RoutingMap.RoutingPalette.StudentDetailViewModel(students, isRightClick, this, canOpenDetail);
		this.data(this.viewModel);
		this.isRightClick = isRightClick;
		this.originalProhibitCross = students[0].ProhibitCross;
		this.dataModel = dataModel;
	}

	StudentDetailModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	StudentDetailModalViewModel.prototype.constructor = StudentDetailModalViewModel;

	StudentDetailModalViewModel.prototype.positiveClick = function()
	{
		var self = this;
		this.positiveClose();
		// if (self.isRightClick && !self.originalProhibitCross && self.data().students[0].ProhibitCross)
		// {
		// 	var studentDataModel = self.dataModel.getStudentById(self.data().students[0].Id);
		// 	self.dataModel.findStudentScheduleHelper.getAffectedTrips(studentDataModel).then(function(affectedTrips)
		// 	{
		// 		if (affectedTrips.length > 0)
		// 		{
		// 			tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.SaveAllTripModalViewModel(affectedTrips)).then(function(res)
		// 			{
		// 				if (res) { self.positiveClose({ students: self.data().students, trips: affectedTrips }); }
		// 			});
		// 		} else
		// 		{
		// 			self.positiveClose({ students: self.data().students });
		// 		}
		// 	});
		// } else
		// {
		// 	this.positiveClose({ students: self.data().students });
		// }
	};

})();
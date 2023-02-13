(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").StudentDetailViewModel = StudentDetailViewModel;

	function StudentDetailViewModel(students, isRightClick, modalViewModel, canOpenDetail)
	{
		var self = this;
		self.students = students;
		this.modalViewModel = modalViewModel;
		this.obCurrentPage = ko.observable(0);
		this.obRecordsCount = ko.observable(students.length);
		this.obShowPaging = ko.observable(students.length > 1);
		this.obData = ko.computed(function()
		{
			return self.students[self.obCurrentPage()];
		});
		this.isReadOnly = ko.computed(function()
		{
			return self.students[self.obCurrentPage()] && self.students[self.obCurrentPage()].OpenType === 'View';
		});
		this.obIsRightClick = ko.observable(isRightClick);
		this.canOpenDetail = typeof canOpenDetail == "undefined" ? true : canOpenDetail;
		this.openDetailClick = this.openDetailClick.bind(this);
	}

	StudentDetailViewModel.prototype.previousClick = function()
	{
		this.obCurrentPage(this.obCurrentPage() - 1);
	};

	StudentDetailViewModel.prototype.nextClick = function()
	{
		this.obCurrentPage(this.obCurrentPage() + 1);
	};

	StudentDetailViewModel.prototype.init = function()
	{
	};

	StudentDetailViewModel.prototype.openDetailClick = function(modal, event)
	{
		var student = this.obData();
		var documentData = new TF.Document.DocumentData(TF.Document.DocumentData.Grid,
			{
				gridType: "student",
				isTemporaryFilter: true,
				gridState: {
					gridFilterId: null,
					filteredIds: [student.Id]
				},
				recordId: student.Id,
				openDetail: true
			});
		var newWindow = event.shiftKey || event.ctrlKey;
		TF.Helper.MapHelper.openNewGrid(event, documentData);
		if (!newWindow)
		{
			this.modalViewModel.positiveClose();
		}
	};
})();
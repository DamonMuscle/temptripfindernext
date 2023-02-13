(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").UnassignedStudentDisplay = UnassignedStudentDisplay;

	function UnassignedStudentDisplay(viewModel)
	{
		var self = this;
		self.viewModel = viewModel;
		self.dataModel = viewModel.dataModel;
		self.obUnassignedStudents = ko.observableArray([]);
		self.obFooterDisplay = ko.observable("");
		TF.RoutingMap.BaseMapDisplayModel.call(self, viewModel);
		self.dataModel.onAllChangeEvent.subscribe(self.onAllChange.bind(self));
		self.dataModel.highlightChangedEvent.subscribe(self.onHighlightChanged.bind(self));
		self.dataModel.selectedChangedEvent.subscribe(self.selectedChangedEvent.bind(this));
		self.keyProperty = "key";
	}

	UnassignedStudentDisplay.prototype = Object.create(TF.RoutingMap.BaseMapDisplayModel.prototype);
	UnassignedStudentDisplay.prototype.constructor = UnassignedStudentDisplay;

	UnassignedStudentDisplay.prototype.selectClick = function(selectItem, e)
	{
		this.selectWithKeyClick(selectItem, e);
	};

	UnassignedStudentDisplay.prototype.onAllChange = function() { };

	UnassignedStudentDisplay.prototype.setHighlighted = function(data)
	{
		this.dataModel.setHighlighted(data);
	};

	UnassignedStudentDisplay.prototype.getHighlighted = function()
	{
		return this.dataModel.highlighted;
	};

	UnassignedStudentDisplay.prototype.getSelected = function()
	{
		return this.dataModel.selected;
	};

	UnassignedStudentDisplay.prototype.onHighlightChanged = function()
	{
		this.setIsHighlight();
		this.setFooterDisplay();
	};

	UnassignedStudentDisplay.prototype.setIsHighlight = function()
	{
		var self = this;
		self.obUnassignedStudents().forEach(function(item)
		{
			item.obIsHighlighted(self.dataModel.isHighlighted(item.key));
		});
	};

	UnassignedStudentDisplay.prototype.selectedChangedEvent = function(e, data)
	{
		this.setDataSource(data);
		this.setFooterDisplay();
	};

	UnassignedStudentDisplay.prototype.setDataSource = function(source)
	{
		this.obUnassignedStudents(this.normalizeData(source));
	};

	UnassignedStudentDisplay.prototype.normalizeData = function(source)
	{
		var isMidTrip = this.dataModel.isMidTrip;
		return Enumerable.From(source).OrderBy(r => r.LastName).ThenBy(r => r.FirstName).ToArray().map(function(student)
		{
			var item = $.extend({}, student);
			item.obIsHighlighted = ko.observable(false);
			item.obName = ko.observable(student.FirstName + " " + student.LastName);
			item.obSessionType = ko.observable(isMidTrip ? (student.Session == 0 ? ' PU' : ' DO') : '');
			item.obSchoolCode = ko.observable(student.SchoolCode);
			item.obGrade = ko.observable(student.Grade);
			item.obAddress = ko.observable(student.Address);
			item.obIsLockedByOther = ko.observable(!!student.isLockedByOther);
			item.obLockedByUser = ko.observable(student.lockedByUser);
			item.obRequirementDays = ko.observableArray(student.RequirementDays);
			item.obRequirementDateRange = ko.observable(moment(student.RequirementStartDate).format("MM/DD/YYYY") + ' - ' + moment(student.RequirementEndDate).format("MM/DD/YYYY"));
			item.obRequirementType = ko.observable(student.RequirementType);
			return item;
		});
	};

	UnassignedStudentDisplay.prototype.setFooterDisplay = function()
	{
		var self = this,
			count = self.dataModel.all.length;
		self.setFooterDisplayText("Unassigned Student", count);
	};

	UnassignedStudentDisplay.prototype.refresh = function()
	{
		var source = this.getSelected();
		this.setDataSource(source);
	};

})();
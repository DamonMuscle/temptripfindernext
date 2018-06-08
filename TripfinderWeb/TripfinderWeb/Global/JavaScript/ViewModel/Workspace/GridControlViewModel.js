(function()
{
	createNamespace("TF.Control").GridControlViewModel = GridControlViewModel;

	function GridControlViewModel(gridType, filteredIds, entityId, entityType, entity, filterset, isDataRowHover, dataSource, routeState, removeTabIndex)
	{
		this._gridType = gridType;
		this._entityType = entityType;
		this._removeTabIndex = removeTabIndex;//grid columns button and input can not focus when tab keypress
		this._gridShowType = "viewformGrid";
		this._defaultGridLayoutExtendedEntity = null;
		this._showBulkMenu = true;
		this._overlay = false;
		this._gridState = new TF.Grid.GridState({ filteredIds: filteredIds, filterSet: filterset, entityId: entityId, entityType: entityType, entity: entity });
		this.title = ko.observable("");
		this.obTooltipAddNew = ko.observable("");
		this.obTooltipOpenNewGrid = ko.observable("Open New Grid");
		this.obIsDocument = ko.observable(false);
		this.obIsHideTitle = ko.observable(false);
		this.obCanOperation = ko.observable(false);
		this.obCanPrint = ko.observable(false);
		this.obMapCanOperation = ko.observable(true);
		this.obCanOpenGrid = ko.observable(false);
		this.obGridViewModel = ko.observable(null);
		this.obFocusState = ko.observable(true);
		this.openNewDocumentClick = this.openNewDocumentClick.bind(this);
		this.obCanAddNew = ko.observable(true);
		this.obCanOpenNewGrid = ko.observable(false);
		this.obOnlyLayout = ko.observable(false);
		this.obAddDivider = ko.observable(false);
		this.obPrintDivider = ko.observable(false);
		this.obEditDivider = ko.observable(false);
		this.obCanEdit = ko.observable(true);
		this.obCanCopy = ko.observable(true);
		if (entityType == "exception")
		{
			this.obIsHideTitle(true);
		}

		this.isDataRowHover = isDataRowHover ? isDataRowHover : false;
		this.dataSource = dataSource;
		this._routeState = routeState ? routeState : this._gridType;
	};

	GridControlViewModel.prototype.constructor = GridControlViewModel;

	GridControlViewModel.prototype.templateName = 'workspace/grid/base';

	GridControlViewModel.prototype.openNewDocumentClick = function(viewModel, e)
	{
		tf.documentManagerViewModel.add(new TF.Document.DocumentData(TF.Document.DocumentData.Grid, { gridType: this._gridType, gridState: new TF.Grid.GridState({ filteredIds: this._gridState.filteredIds }) }));
	}

	GridControlViewModel.prototype.afterRender = function(viewModel, element)
	{
		var gridViewModelType = null;
		var option = { height: 255, isDataRowHover: this.isDataRowHover, dataSource: this.dataSource, routeState: this._routeState, removeTabIndex: this._removeTabIndex };
		var gridLayoutExtendedDataModel = tf.storageManager.get(tf.storageManager.gridInViewCurrentLayout(this._entityType + "." + this._gridType));
		this.obTooltipAddNew("New");
		switch (this._gridType)
		{
			case 'school':
				this.title(tf.applicationTerm.getApplicationTermPluralByName("School"));
				gridViewModelType = TF.Grid.SchoolGridViewModel;
				this.obCanOpenNewGrid(true);
				break;
			case 'student':
				this.title(tf.applicationTerm.getApplicationTermPluralByName("Student"));
				gridViewModelType = TF.Grid.StudentGridViewModel;
				this.obCanOpenNewGrid(true);
				break;
			case 'trip':
				this.title(tf.applicationTerm.getApplicationTermPluralByName("Trip"));
				gridViewModelType = TF.Grid.TripGridViewModel;
				this.obCanOpenNewGrid(true);
				break;
			case 'vehicle':
				this.title(tf.applicationTerm.getApplicationTermPluralByName("Vehicle"));
				this.obMapCanOperation = ko.observable(false);
				gridViewModelType = TF.Grid.VehicleGridViewModel;
				this.obCanOpenNewGrid(true);
				break;
			case 'georegion':
				this.title(tf.applicationTerm.getApplicationTermPluralByName("Geo Region"));
				gridViewModelType = TF.Grid.GeoregionGridViewModel;
				break;
			case 'altsite':
				this.title(tf.applicationTerm.getApplicationTermPluralByName("Alternate Site"));
				gridViewModelType = TF.Grid.AltsiteGridViewModel;
				this.obCanOpenNewGrid(true);
				break;
			case 'tripstop':
				this.title(tf.applicationTerm.getApplicationTermPluralByName("Trip Stop"));
				gridViewModelType = TF.Grid.TripStopGridViewModel;
				this.obCanOpenNewGrid(true);
				break;
			case 'district':
				this.title(tf.applicationTerm.getApplicationTermPluralByName("District"));
				gridViewModelType = TF.Grid.DistrictGridViewModel;
				this.obCanOpenNewGrid(false);
				break;
			case 'contractor':
				this.title(tf.applicationTerm.getApplicationTermPluralByName("Contractor"));
				gridViewModelType = TF.Grid.ContractorGridViewModel;
				break;
			case 'fieldtrip':
				this.title(tf.applicationTerm.getApplicationTermPluralByName("Field Trip"));
				gridViewModelType = TF.Grid.FieldTripGridViewModel;
				this.obCanOpenNewGrid(true);
				break;
			case 'document':
				this.title("Documents");
				this.obTooltipAddNew("Add Documents");
				this.obCanOperation(true);
				this.obCanEdit(false);
				this.obCanCopy(false);
				gridViewModelType = TF.Grid.DocumentGridViewModel;
				var gridLayoutExtendedDataModel = new TF.DataModel.GridLayoutExtendedDataModel();
				gridLayoutExtendedDataModel.gridType(this._gridType);
				gridLayoutExtendedDataModel.layoutColumns([
					{ FieldName: "Filename" },
					{ FieldName: "Description" },
					{
						FieldName: "DocumentClassification"
					},
					{
						FieldName: "FileSizeKb",
						minWidth: 74,
						width: 74
					},
					{ FieldName: "LastUpdated" },
					{ FieldName: "LastUpdatedName" },
					{
						FieldName: "Action",
						minWidth: 60,
						width: 60,
						action: true
					}]);
				this._defaultGridLayoutExtendedEntity = gridLayoutExtendedDataModel;
				break;
			case 'documentmini':
				this.title("Documents");
				this.obTooltipAddNew("Add Documents");
				this.obCanOperation(true);
				this.obEditDivider(true);
				this.obCanEdit(true);
				this.obCanCopy(false);
				this.obOnlyLayout(true);
				this.obAddDivider(true);
				gridViewModelType = TF.Grid.DocumentMiniGridViewModel;
				//var gridLayoutExtendedDataModel = new TF.DataModel.GridLayoutExtendedDataModel();
				//gridLayoutExtendedDataModel.gridType(this._gridType);
				//gridLayoutExtendedDataModel.layoutColumns([
				//{ FieldName: "Filename" },
				//{ FieldName: "Description" },
				//{
				//	FieldName: "DocumentClassification"
				//},
				//{
				//	FieldName: "FileSizeKb",
				//	minWidth: 74,
				//	width: 74
				//},
				//{ FieldName: "LastUpdated" },
				//{ FieldName: "LastUpdatedName" },
				//{
				//	FieldName: "Action",
				//	minWidth: 60,
				//	width: 60,
				//	action: true
				//}]);
				//this._defaultGridLayoutExtendedEntity = gridLayoutExtendedDataModel;
				this.obCanOpenNewGrid(true);
				break;
			case 'staff':
				this.title(tf.applicationTerm.getApplicationTermPluralByName("Staff"));
				gridViewModelType = TF.Grid.StaffGridViewModel;
				this.obCanOpenNewGrid(true);
				break;
			case 'studentexception':
				this.title(tf.applicationTerm.getApplicationTermPluralByName("Exception"));
				this.obCanOperation(true);
				this.obEditDivider(true);
				this.obCanEdit(true);
				this.obCanCopy(false);
				this.obCanOpenGrid(true);
				this.obOnlyLayout(true);
				this.obAddDivider(true);
				gridViewModelType = TF.Grid.StudentExceptionGridViewModel;

				this._showBulkMenu = true;
				break;
			case 'triphistory':
				this.obCanOperation(true);
				this.obEditDivider(true);
				this.obCanEdit(true);
				this.obCanCopy(false);
				this.obCanOpenGrid(true);
				this.obCanPrint(true);
				this.obCanAddNew(true);
				this.obOnlyLayout(true);
				this.obAddDivider(true);
				this.obPrintDivider(true);
				gridViewModelType = TF.Grid.TripHistoryGridViewModel;
				this.title("Calendar Events");
				this._showBulkMenu = true;
				break;
			case 'attendance':
				this.obCanOperation(true);
				this.obCanEdit(false);
				this.obCanCopy(false);
				this.obCanOpenGrid(true);
				this.obOnlyLayout(true);
				this.obCanAddNew(false);
				gridViewModelType = TF.Grid.AttendanceGridViewModel;
				if (this._entityType == "student")
				{
					this.title("Attendance Records");
				}
				else
				{//this may no need anymore
					this.title("Calendar Events");
				}

				this._showBulkMenu = true;
				break;
			case 'fieldtripinvoice':
				this.title("Invoice Information");
				gridViewModelType = TF.Grid.FieldTripInvoiceGridViewModel;
				this._showBulkMenu = true;
				option.entityType = this._entityType;

				this.obCanOpenGrid(true);
				if (this.dataSource)
				{//field trip edit form
					this.obCanOperation(false);
					this.obCanAddNew(true);
				}
				else
				{
					this.obOnlyLayout(true);
					this.obCanOperation(true);
					this.obCanEdit(false);
					this.obCanCopy(false);
					this.obCanAddNew(false);
				}
				break;
			case 'fieldtriphistory':
				this.title("History");
				this.obCanOperation(true);
				this.obCanEdit(false);
				this.obCanCopy(false);
				this.obCanOpenGrid(true);
				this.obCanAddNew(false);
				this.obOnlyLayout(true);
				gridViewModelType = TF.Grid.FieldTripHistoryGridViewModel;

				this._showBulkMenu = true;
				break;
			case 'fieldtripresourcegroup':
				this.title("Resources");
				gridViewModelType = TF.Grid.FieldTripResourceGroupGridViewModel;
				option.entityType = this._entityType;
				option.selectable = "row";
				break;
			case 'fieldtriposholidays':
				this.title("Holidays");
				this.obCanOperation(true);
				this.obCanEdit(false);
				this.obCanCopy(false);
				this.obCanOpenGrid(true);
				this.obCanAddNew(false);
				gridViewModelType = TF.Grid.FieldTripOSHolidaysGridViewModel;
				option.entityType = this._entityType;
				option.selectable = "row";
				this._showBulkMenu = false;
				break;
			case 'fieldtriposdbotimes':
				this.title("Daily Block Out Times");
				this.obCanOperation(true);
				this.obCanEdit(false);
				this.obCanCopy(false);
				this.obCanOpenGrid(true);
				this.obCanAddNew(false);
				gridViewModelType = TF.Grid.FieldTripOSDBOTimesGridViewModel;
				option.entityType = this._entityType;
				option.selectable = "row";
				this._showBulkMenu = false;
				break;
			case 'tripstopforException':
				this.title(tf.applicationTerm.getApplicationTermPluralByName("Trip Stop"));
				gridViewModelType = TF.Grid.TripStopForExceptionGridViewModel;
				gridLayoutExtendedDataModel = new TF.DataModel.GridLayoutExtendedDataModel();
				gridLayoutExtendedDataModel.gridType(this._gridType);
				break;
			case 'fieldtripinvoiceTemplate':
				this.title("Invoice Information");
				this.obCanOperation(false);
				this.obCanOpenGrid(true);
				this.obCanAddNew(true);
				gridViewModelType = TF.Grid.FieldTripInvoiceTemplateGridViewModel;
				var gridLayoutExtendedDataModel = new TF.DataModel.GridLayoutExtendedDataModel();
				gridLayoutExtendedDataModel.gridType(this._gridType);
				gridLayoutExtendedDataModel.layoutColumns([
					{ FieldName: "AccountName" },
					{ FieldName: "Amount" }]);
				this._defaultGridLayoutExtendedEntity = gridLayoutExtendedDataModel;
				this._showBulkMenu = true;
				option.entityType = this._entityType;
				break;
		}
		var gridViewModel = new gridViewModelType(this.obFocusState, element, this._gridState, this._gridShowType, this._defaultGridLayoutExtendedEntity, this._showBulkMenu, option);
		//if (this._gridType == "document" || this._gridType == "studentexception" || this._gridType == "triphistory" || this._gridType == "documentmini")
		//{
		//	gridViewModel.addClick = gridViewModel.actionClick.bind(this);
		//}
		if (this.addClick)
		{
			gridViewModel.addClick = this.addClick.bind(this);
		}

		if (this.afterClick)
		{
			gridViewModel.afterClick = this.afterClick;
		}
		//gridViewModel.onGridStateChange.subscribe(this.raiseRouteChangeRequest.bind(this));
		this.obGridViewModel(gridViewModel);
		//this.raiseRouteChangeRequest();

	};

	GridControlViewModel.prototype.dispose = function()
	{
		if (this.obGridViewModel())
			this.obGridViewModel().dispose();
		this.obGridViewModel(null);
	};

})();

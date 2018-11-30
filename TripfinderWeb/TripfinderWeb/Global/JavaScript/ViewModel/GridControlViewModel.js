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
		this.obIsDocument = ko.observable(false);
		this.obIsHideTitle = ko.observable(false);
		this.obGridViewModel = ko.observable(null);
		this.obFocusState = ko.observable(true);
		this.obCanAddNew = ko.observable(true);
		this.obCanAdd = ko.observable(true);
		this.obAddDivider = ko.observable(false);
		this.obCanEdit = ko.observable(true);
		this.obEditEnable = ko.observable(true);
		if (entityType == "exception")
		{
			this.obIsHideTitle(true);
		}

		this.isDataRowHover = isDataRowHover ? isDataRowHover : false;
		this.dataSource = dataSource;
		this._routeState = routeState ? routeState : this._gridType;
	};

	GridControlViewModel.prototype.constructor = GridControlViewModel;

	GridControlViewModel.prototype.templateName = function()
	{
		return TF.isPhoneDevice ? 'workspace/grid/basemobile' : 'workspace/grid/base';
	}

	GridControlViewModel.prototype.afterRender = function(viewModel, element)
	{
		var gridViewModelType = null;
		var option = { height: 255, isDataRowHover: this.isDataRowHover, dataSource: this.dataSource, routeState: this._routeState, removeTabIndex: this._removeTabIndex };
		var gridLayoutExtendedDataModel = tf.storageManager.get(tf.storageManager.gridInViewCurrentLayout(this._entityType + "." + this._gridType));
		this.obTooltipAddNew("New");
		switch (this._gridType)
		{
			case 'documentmini':
				this.title("Documents");
				this.obTooltipAddNew("Add Documents");
				this.obCanAddNew(true);
				this.obCanEdit(true);
				this.obAddDivider(true);
				gridViewModelType = TF.Grid.DocumentMiniGridViewModel;
				break;
			case 'fieldtripinvoice':
				this.title("Invoice Information");
				gridViewModelType = TF.Grid.FieldTripInvoiceGridViewModel;
				this._showBulkMenu = true;
				option.entityType = this._entityType;

				if (this.dataSource)
				{//field trip edit form
					this.obCanAddNew(true);
				}
				else
				{
					this.obCanEdit(false);
					this.obCanAddNew(false);
				}
				break;
			case 'fieldtripresourcegroup':
				this.title("Resources");
				gridViewModelType = TF.Grid.FieldTripResourceGroupGridViewModel;
				option.entityType = this._entityType;
				option.selectable = "row";
				break;
		}
		var gridViewModel = new gridViewModelType(this.obFocusState, element, this._gridState, this._gridShowType, this._defaultGridLayoutExtendedEntity, this._showBulkMenu, option);
		if (this.addClick)
		{
			gridViewModel.addClick = this.addClick.bind(this);
		}

		if (this.afterClick)
		{
			gridViewModel.afterClick = this.afterClick;
		}
		this.obGridViewModel(gridViewModel);
	};

	GridControlViewModel.prototype.dispose = function()
	{
		if (this.obGridViewModel())
			this.obGridViewModel().dispose();
		this.obGridViewModel(null);
	};
})();

(function()
{
	createNamespace("TF.Grid").FieldTripInvoiceGridViewModel = FieldTripInvoiceGridViewModel;

	function FieldTripInvoiceGridViewModel(obDocumentFocusState, element, kendoGridState, gridShowType, defaultGridLayoutExtendedEntity, showBulkMenu, option)
	{
		TF.Grid.BaseKendoGridViewModel.call(this, obDocumentFocusState, element, kendoGridState, gridShowType, showBulkMenu, false, option);
		this.type = "fieldtripinvoice";
		this.baseDeletion = new TF.Executor.FieldtripInvoiceDeletion();
		var self = this;
		this.options.gridDefinition = tf.FieldTripInvoiceGridDefinition.gridDefinition();
		if (kendoGridState.entityType == "fieldtripEntry")
		{
			this.options.kendoGridOption = {
				pageable: false
			};
			this.options.disableQuickFilter = true;
			this.options.layoutAndFilterOperation = false;
			this.options.onDataBound = this.onDataBound.bind(this);
		}
		this.hasRightClickEvent = false;
		this.createGrid(this.options);
	};

	FieldTripInvoiceGridViewModel.prototype = Object.create(TF.Grid.BaseKendoGridViewModel.prototype);

	FieldTripInvoiceGridViewModel.prototype.constructor = FieldTripInvoiceGridViewModel;

	FieldTripInvoiceGridViewModel.prototype._viewfromDBClick = function(event, item)
	{
		switch (this._gridState.entityType)
		{
			case "fieldtrip":
				break;
			case "fieldtripEntry":
				this._viewfromDBClick(event);
				break;
			default:
				break;
		}
	};

	FieldTripInvoiceGridViewModel.prototype.getFieldTripInvoiceDataModel = function(e)
	{
		return this.searchGrid.kendoGrid.dataItem($(e.target).closest("tr"));
	};

	FieldTripInvoiceGridViewModel.prototype.onDataBound = function()
	{
		this.searchGrid.obFilteredRecordCount(this.searchGrid.kendoGrid.dataSource.data().length);
	}

})();
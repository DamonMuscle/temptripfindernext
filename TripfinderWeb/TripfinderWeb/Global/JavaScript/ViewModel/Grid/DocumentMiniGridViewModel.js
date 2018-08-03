(function()
{
	createNamespace("TF.Grid").DocumentMiniGridViewModel = DocumentMiniGridViewModel;

	function DocumentMiniGridViewModel(obDocumentFocusState, element, kendoGridState, gridShowType, defaultGridLayoutExtendedEntity, showBulkMenu, option, view, dataEntryObjects)
	{
		TF.Grid.BaseKendoGridViewModel.call(this, obDocumentFocusState, element, kendoGridState, gridShowType, showBulkMenu, false, option, view, dataEntryObjects);
		this.type = "documentmini";
		this.baseDeletion = new TF.Executor.DocumentDeletion();
		this.options.gridDefinition = tf.documentGridDefinition.miniGridDefinition();
		this.directoryViewDataModel = new TF.Grid.DocumentDirectoryViewModel();
		if (kendoGridState.entityType == "fieldtripEntry")
		{
			this.options.kendoGridOption = {
				pageable: false
			};
			this.options.disableQuickFilter = true;
			this.options.layoutAndFilterOperation = false;
			this.options.onDataBound = this.onDataBound.bind(this);
		}
		this.options.selectable = "row";//mini grid should be single select
		this.createGrid(this.options);
		this.filteredIds = kendoGridState.filteredIds;
	};

	DocumentMiniGridViewModel.prototype = Object.create(TF.Grid.BaseKendoGridViewModel.prototype);

	DocumentMiniGridViewModel.prototype.constructor = DocumentMiniGridViewModel;

	DocumentMiniGridViewModel.prototype._viewfromDBClick = function(event, item)
	{
		// this.editClick(item, event);
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

	DocumentMiniGridViewModel.prototype.getDocumentDataModel = function(e)
	{
		return this.searchGrid.kendoGrid.dataItem($(e.target).closest("tr"));
	};

	DocumentMiniGridViewModel.prototype.newGridClick = function(viewModel, e)
	{
		var documentData = new TF.Document.DocumentData(TF.Document.DocumentData.Grid, { gridType: "document", gridState: this._gridState });
		tf.documentManagerViewModel.add(documentData);
	};

	DocumentMiniGridViewModel.prototype.onDataBound = function()
	{
		this.searchGrid.obFilteredRecordCount(this.searchGrid.kendoGrid.dataSource.data().length);
	};
})();
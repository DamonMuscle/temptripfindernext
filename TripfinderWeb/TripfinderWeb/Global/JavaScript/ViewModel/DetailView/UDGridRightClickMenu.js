(function()
{
	createNamespace("TF.DetailView").UDGridRightClickMenu = UDGridRightClickMenu;

	function UDGridRightClickMenu(gridBlock, miniGridType)
	{
		this.gridBlock = gridBlock;
		this.miniGridType = miniGridType;
		this.detailviewType = this.gridBlock.detailView.gridType;
		this.copyToClipboardClick = this.copyToClipboardClick.bind(this);
		this.saveAsClick = this.saveAsClick.bind(this);
		this.allSelectionClick = this.allSelectionClick.bind(this);
		this.invertSelectionClick = this.invertSelectionClick.bind(this);
		this.omitSelectionClick = this.omitSelectionClick.bind(this);
		this.clearSelectionClick = this.clearSelectionClick.bind(this);
		this.clearFilterClick = this.clearFilterClick.bind(this);
		this.selectedCount = this.gridBlock.grid.select().length;
		this.selectedRow = this.selectedCount === 1 && this.gridBlock.grid.dataItem(this.gridBlock.grid.select()[0]);
		this.obIsAnyRowSelected = ko.observable(this.selectedCount > 0);
	}

	UDGridRightClickMenu.prototype = Object.create(TF.ContextMenu.BaseGeneralMenuViewModel.prototype);
	UDGridRightClickMenu.prototype.constructor = UDGridRightClickMenu;

	UDGridRightClickMenu.prototype.copyToClipboardClick = function()
	{
		tf.promiseBootbox.yesNo("Data has been retrieved. Would you like to copy this to your clipboard?", "Confirmation").then(result =>
		{
			if (result)
			{
				const operationType = "copy";
				var el = document.createElement('textarea');
				const columns = this.getColumns();
				el.value = TF.Helper.KendoGridHelper.getStringOfRecords(this.getSelectedItems(operationType, columns), columns);
				document.body.appendChild(el);
				el.select();
				document.execCommand('copy');
				document.body.removeChild(el);
			}
		})
	};

	UDGridRightClickMenu.prototype.saveAsClick = function()
	{
		var lightKendoGrid = this.gridBlock.lightKendoGrid;
		var selectedIds = lightKendoGrid.getSelectedIds();
		if (selectedIds.length > 0)
		{
			let title = this.gridBlock.options.title;
			let columns = this.getColumns();
			lightKendoGrid.options.gridData.text = title;
			lightKendoGrid.options.exportColumns = columns;
			lightKendoGrid.exportCurrentGrid(selectedIds);
		}
	};

	UDGridRightClickMenu.prototype.allSelectionClick = function()
	{
		this.gridBlock.grid.select(this.gridBlock.grid.items());
	};

	UDGridRightClickMenu.prototype.invertSelectionClick = function()
	{
		var items = [], selected = this.gridBlock.grid.select().toArray();
		this.gridBlock.grid.items().each((i, item) =>
		{
			if (selected.indexOf(item) < 0)
			{
				items.push(item);
			}
		});
		this.gridBlock.grid.clearSelection();
		this.gridBlock.grid.select(items);
	};

	UDGridRightClickMenu.prototype.omitSelectionClick = function()
	{
		var items = [], selected = this.getSelectedItems();
		this.gridBlock.grid.dataSource.data().forEach((record) =>
		{
			if (selected.indexOf(record) < 0)
			{
				items.push(record);
			}
		});
		this.gridBlock.grid.clearSelection();
		this.gridBlock.grid.dataSource.data(items);
		tf.helpers.kendoGridHelper.updateGridFooter(this.gridBlock.grid.element, items.length, this.gridBlock.dataItems.length);
	};

	UDGridRightClickMenu.prototype.clearSelectionClick = function()
	{
		this.gridBlock.grid.clearSelection();
	};

	UDGridRightClickMenu.prototype.getSelectedItems = function(operationType, columns)
	{
		var items = [];
		operationType = operationType || "";
		let signatureFields = [];
		if (this.gridBlock.options && this.gridBlock.options.UDGridFields && this.gridBlock.options.UDGridFields.length)
		{
			signatureFields = this.gridBlock.options.UDGridFields.filter(f =>
			{
				return f.type === "SignatureBlock";
			}).map(f => { return f.Guid; });
		}
		this.gridBlock.grid.select().each((i, item) =>
		{
			if ($(item).children("td")?.data()?.kendoField === "bulk_menu")
			{
				return;
			}

			let dataItem = $.extend(true, {}, this.gridBlock.grid.dataItem(item));
			switch (operationType)
			{
				case "saveAs":
					dataItem = TF.DetailView.UserDefinedGridHelper.handleItemForSaveAs(dataItem, columns, signatureFields);
					break;
				case "copy":
					dataItem = TF.DetailView.UserDefinedGridHelper.handleItemForCopy(dataItem, columns, signatureFields);
					break;
				default:
					// Do Nothing
					break;
			}
			items.push(dataItem);
		});
		return items;
	};

	UDGridRightClickMenu.prototype.getColumns = function()
	{
		return this.gridBlock.grid.columns.filter((item) =>
		{
			return item.field != "bulk_menu" && (!item.command || item.command.length == 0);
		});
	};

	UDGridRightClickMenu.prototype.clearFilterClick = function()
	{
		this.gridBlock.grid.dataSource.data(this.gridBlock.dataItems);
		tf.helpers.kendoGridHelper.updateGridFooter(this.gridBlock.grid.element, this.gridBlock.dataItems.length, this.gridBlock.dataItems.length);
	};
})();

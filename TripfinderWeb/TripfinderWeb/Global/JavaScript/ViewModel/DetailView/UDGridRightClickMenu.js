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
		const operationType = "saveAs";
		var title = this.gridBlock.options.title;
		const columns = this.getColumns();
		const items = TF.Helper.KendoGridHelper.getListOfRecords(this.getSelectedItems(operationType, columns), columns);
		tf.promiseBootbox.dialog(
			{
				closeButton: true,
				title: "Save As",
				message: "Select the file format that you would like to save the selected records in." +
					"<div class='col-xs-24'>" +
					"<br/><label>Type</label>" +
					"<div class='save-content'>" +
					"<input id='csvradio' type='radio' checked='checked' name='type' value='csv' />" +
					"<label for='csvradio'>Comma Separated Value (.csv)</label>" +
					"<br/><input id='xlsradio' type='radio' name='type' value='xls' />" +
					"<label for='xlsradio'>Excel 97 - 2003 Workbook (.xls)</label>" +
					"<div>" +
					"</div>",
				buttons:
				{
					save:
					{
						label: "Save",
						className: "btn tf-btn-black btn-sm",
						callback: function()
						{
							var fileFormat = $("#csvradio").is(':checked') ? 'csv' : 'xls';
							var getDataUrl = pathCombine(tf.api.apiPrefixWithoutDatabase(), "DataExportFiles");
							var getDataOption = {
								paramData:
								{
									fileFormat: fileFormat
								},
								data: items
							};

							tf.promiseAjax.post(getDataUrl, getDataOption).then(function(keyApiResponse)
							{
								var fileUrl = `${getDataUrl}?key=${keyApiResponse.Items[0]}&fileFormat=${fileFormat}&fileName=${title}`;
								var link = document.createElement("a");
								link.setAttribute('download', name);
								link.href = fileUrl;
								document.body.appendChild(link);
								link.click();
								link.remove();
							});
						}
					},
					cancel:
					{
						label: "Cancel",
						className: "btn btn-link btn-sm"
					}
				}
			});
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
		this.gridBlock.grid.dataSource.data().forEach((item) =>
		{
			if (selected.indexOf(item) < 0)
			{
				items.push(item);
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
			let dataItem = JSON.parse(JSON.stringify(this.gridBlock.grid.dataItem(item)));
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
			return !item.command || item.command.length === 0;
		});
	};

	UDGridRightClickMenu.prototype.clearFilterClick = function()
	{
		this.gridBlock.grid.dataSource.data(this.gridBlock.dataItems);
		tf.helpers.kendoGridHelper.updateGridFooter(this.gridBlock.grid.element, this.gridBlock.dataItems.length, this.gridBlock.dataItems.length);
	};
})();

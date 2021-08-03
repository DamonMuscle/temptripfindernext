(function()
{
	createNamespace("TF.DetailView").UDGridRightClickMenu = UDGridRightClickMenu;

	function UDGridRightClickMenu(gridBlock, miniGridType)
	{
		this.gridBlock = gridBlock;
		this.miniGridType = miniGridType;
		this.detailviewType = this.gridBlock.detailView.gridType;
		this.setPrimaryContact = this.setPrimaryContact.bind(this);
		this.setStopfinderContact = this.setStopfinderContact.bind(this);
		this.copyToClipboardClick = this.copyToClipboardClick.bind(this);
		this.saveAsClick = this.saveAsClick.bind(this);
		this.allSelectionClick = this.allSelectionClick.bind(this);
		this.invertSelectionClick = this.invertSelectionClick.bind(this);
		this.omitSelectionClick = this.omitSelectionClick.bind(this);
		this.clearSelectionClick = this.clearSelectionClick.bind(this);
		this.clearFilterClick = this.clearFilterClick.bind(this);
		this.selectedCount = this.gridBlock.grid.select().length;
		this.selectedRow = this.selectedCount == 1 && this.gridBlock.grid.dataItem(this.gridBlock.grid.select()[0]);
		this.IsPrimaryChecked = this.selectedRow && (this.selectedRow.IsPrimary != null && this.selectedRow.IsPrimary);
		this.IsStopfinderChecked = this.selectedRow && (this.selectedRow.IsStopfinder != null && this.selectedRow.IsStopfinder);
		this.obIsAnyRowSelected = ko.observable(this.selectedCount > 0);
	}

	UDGridRightClickMenu.prototype = Object.create(TF.ContextMenu.BaseGeneralMenuViewModel.prototype);
	UDGridRightClickMenu.prototype.constructor = UDGridRightClickMenu;

	UDGridRightClickMenu.prototype.copyToClipboardClick = function()
	{
		let operationType = "copy";
		var el = document.createElement('textarea');
		let columns = this.getColumns();
		el.value = TF.Helper.KendoGridHelper.getStringOfRecords(this.getSelectedItems(operationType, columns), columns);
		document.body.appendChild(el);
		el.select();
		document.execCommand('copy');
		document.body.removeChild(el);
	};

	UDGridRightClickMenu.prototype.saveAsClick = function()
	{
		let operationType = "saveAs";
		var title = this.gridBlock.options.title;
		let columns = this.getColumns();
		let items = TF.Helper.KendoGridHelper.getListOfRecords(this.getSelectedItems(operationType, columns), columns);
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
					"<br/><input id='xlsradio' type='radio' name='type' value='xlsx' />" +
					"<label for='xlsradio'>Excel 2007 Workbook (.xlsx)</label>" +
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
							var fileFormat = $("#csvradio").is(':checked') ? 'csv' : 'xlsx';
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
								var fileUrl = getDataUrl + "?key=" + keyApiResponse.Items[0] + "&fileFormat=" + fileFormat + "&fileName=" + title;
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
		let items = [];
		operationType = operationType || "";
		this.gridBlock.grid.select().each((i, item) =>
		{
			let dataItem = JSON.parse(JSON.stringify(this.gridBlock.grid.dataItem(item)));
			switch (operationType) {
				case "saveAs":
					dataItem = TF.DetailView.UserDefinedGridHelper.handleItemForSaveAs(dataItem, columns);
					break;
				case "copy":
					dataItem = TF.DetailView.UserDefinedGridHelper.handleItemForCopy(dataItem, columns);
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
			return !item.command || item.command.length == 0;
		});
	};

	UDGridRightClickMenu.prototype.clearFilterClick = function()
	{
		this.gridBlock.grid.dataSource.data(this.gridBlock.dataItems);
		tf.helpers.kendoGridHelper.updateGridFooter(this.gridBlock.grid.element, this.gridBlock.dataItems.length, this.gridBlock.dataItems.length);
	};

	UDGridRightClickMenu.prototype.setPrimaryContact = function()
	{
		let self = this,
			contact = this.selectedRow;
		let originDataSource = self.gridBlock.grid.dataSource.data(),
			curPrimary = originDataSource.filter(r => r.IsPrimary && (r.Id !== contact.Id));
		let tmpvalue = !contact.IsPrimary;
		let setPrimary = function()
		{
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "recordcontacts"), {
				paramData: {
					"databaseID": contact.DBID,
					"@filter": `eq(ContactID,${contact.Id})&eq(DataTypeID,${tf.dataTypeHelper.getIdByName('student')})&eq(RecordID,${self.gridBlock.recordId})`,
					"@fields": "ID"
				}
			}).then(function(response)
			{
				if (response.FilteredRecordCount > 0)
				{
					let recordContactId = response.Items[0].ID;
					return tf.promiseAjax.patch(pathCombine(tf.api.apiPrefixWithoutDatabase(), 'recordcontacts'), {
						data: [{
							Id: recordContactId,
							Op: "replace",
							Path: "IsPrimary",
							Value: tmpvalue
						}]
					}).then(function(response)
					{
						var responsedata = response.Items[0];
						let curContactId = responsedata && responsedata.ContactID;
						if (!curContactId) return;
						originDataSource.forEach(element =>
						{
							if (element.Id === curContactId)
							{
								element.IsPrimary = tmpvalue;
							} else
							{
								element.IsPrimary = null;
							}
						});
						if (self.gridBlock.grid.dataSource.hasChanges())
						{
							self.gridBlock.grid.dataSource.data(originDataSource);
						}

						self.gridBlock.detailView.pageLevelViewModel.popupSuccessMessage("The updates have been saved successfully.");
					});
				}
			});
		};

		if (curPrimary.length > 0)
		{
			return tf.promiseBootbox.yesNo("Primary Contact already exists. Do you want to continue?", "Confirmation Message").then(function(yesNo)
			{
				if (yesNo)
				{
					return setPrimary();
				}
			});
		}

		return setPrimary();

	};

	UDGridRightClickMenu.prototype.setStopfinderContact = function()
	{
		let self = this,
			contact = this.selectedRow;
		let tmpvalue = !contact.IsStopfinder;
		let originDataSource = self.gridBlock.grid.dataSource.data();
		let updateStopfinder = function()
		{
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "recordcontacts"), {
				paramData: {
					"databaseID": contact.DBID,
					"@filter": `eq(ContactID,${contact.Id})&eq(DataTypeID,${tf.dataTypeHelper.getIdByName('student')})&eq(RecordID,${self.gridBlock.recordId})`,
					"@fields": "ID"
				}
			}).then(function(response)
			{
				if (response.FilteredRecordCount > 0)
				{
					let recordContactId = response.Items[0].ID;
					return tf.promiseAjax.patch(pathCombine(tf.api.apiPrefixWithoutDatabase(), 'recordcontacts'), {
						data: [{
							Id: recordContactId,
							Op: "replace",
							Path: "IsStopfinder",
							Value: tmpvalue
						}]
					}).then(function(response)
					{
						var responsedata = response.Items[0];
						let curContactId = responsedata && responsedata.ContactID;
						if (!curContactId) return;
						originDataSource.forEach(element =>
						{
							if (element.Id === curContactId)
							{
								element.IsStopfinder = tmpvalue;
							}
						});
						if (self.gridBlock.grid.dataSource.hasChanges())
						{
							self.gridBlock.grid.dataSource.data(originDataSource);
						}

						self.gridBlock.detailView.pageLevelViewModel.popupSuccessMessage("The updates have been saved successfully.");
					});
				}
			});
		};

		return updateStopfinder();

	};
})();
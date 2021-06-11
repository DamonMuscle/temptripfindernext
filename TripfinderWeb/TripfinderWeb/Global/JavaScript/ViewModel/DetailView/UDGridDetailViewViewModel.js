(function()
{
	createNamespace("TF.DetailView").UDGridDetailViewViewModel = UDGridDetailViewViewModel;

	const _requiredDocumentFields = ['Name', 'FileName', 'MimeType'];
	function ensureRequiredDocumentFields(fields)
	{
		_requiredDocumentFields.forEach(requiredField =>
		{
			if (fields.indexOf(requiredField) < 0)
			{
				fields.push(requiredField);
			}
		});
	}

	/*****************************
	 * 
	 * we should make naming unified.
	 * 
	 * layoutTemplate: detail screen entity
	 * layoutId: detail screen id
	 * recordEntity: entity in grid rows
	 * recordId: the id of entity in grid rows
	 * 
	 * ***************************/

	/**
	 * Constructor
	 * @returns {void} 
	 */
	function UDGridDetailViewViewModel(udGrid, baseRecordEntity, recordEntity)
	{
		TF.DetailView.BaseCustomGridStackViewModel.call(this);
		this.udGrid = udGrid;
		this.baseRecordEntity = baseRecordEntity;
		this.recordEntity = recordEntity;
		this._documents = null;
		this.obIsReadOnly(udGrid.isReadOnly || false);
	}

	UDGridDetailViewViewModel.prototype = Object.create(TF.DetailView.BaseCustomGridStackViewModel.prototype);
	UDGridDetailViewViewModel.prototype.constructor = UDGridDetailViewViewModel;

	UDGridDetailViewViewModel.prototype.init = function(options)
	{
		TF.DetailView.BaseCustomGridStackViewModel.prototype.init.call(this, options);

		if (this.uploadDocumentHelper != null)
		{
			this.uploadDocumentHelper.fileDrop.subscribe((_, file) =>
			{
				this.onFileDrop(file);
			});
		}
	};

	UDGridDetailViewViewModel.prototype.generateDefaultEntity = function()
	{
		let defaultEntity = {};
		this.udGrid.UDGridFields.forEach(udgField =>
		{
			defaultEntity[udgField.Guid] = udgField.value;
		});

		return defaultEntity;
	};

	UDGridDetailViewViewModel.prototype.startCreateNewMode = function()
	{
		var self = this;
		self.defaultRecordEntity = self.generateDefaultEntity();
		self.isCreateGridNewRecord = true;
		self.onCreateGridNewRecord.notify();
	};

	UDGridDetailViewViewModel.prototype.applyLayoutTemplate = function(layoutEntity, recordEntity)
	{
		var self = this,
			type = self.gridType;
		if (recordEntity)
		{
			self.recordEntity = recordEntity;
			self.recordId = recordEntity.Id;
		}
		else
		{
			self.startCreateNewMode();
		}

		self.entityDataModel = new TF.DataModel.DetailScreenLayoutDataModel(layoutEntity);
		self.setStackBlocks({
			layout: layoutEntity.Layout
		});

		return Promise.resolve();
	};

	UDGridDetailViewViewModel.prototype.toggleBlockReadOnly = function()
	{
	};

	UDGridDetailViewViewModel.prototype.addOrUpdateEntity = function(isAdd)
	{
		return this.fieldEditorHelper.editStop().then(() =>
		{
			let messages = this.fieldEditorHelper.validateCustomInputs();
			if (messages.length > 0)
			{
				return {
					success: false,
					messages: messages.map(m => m.message),
				};
			}

			let defaultEntity = isAdd ? this.defaultRecordEntity : this.recordEntity,
				record = $.extend({}, defaultEntity, this.generateEntityToSave()),
				gridTypeId = tf.dataTypeHelper.getId(this.gridType),
				isBaseRecordAddNew = this.baseRecordEntity == null;

			if (isAdd)
			{
				return isBaseRecordAddNew ? Promise.resolve(record) : tf.udgHelper.addUDGridRecordOfEntity(this.udGrid, gridTypeId, this.baseRecordEntity.Id, record);
			}

			let savedDocumentIds = this._documents.map(document => document.Id),
				removedDocumentIds = this.recordEntity.DocumentUDGridRecords
					.filter(documentUDGridRecord => !savedDocumentIds.includes(documentUDGridRecord.DocumentID))
					.map(documentUDGridRecord => documentUDGridRecord.DocumentID);
			if (!isBaseRecordAddNew)
			{
				return tf.udgHelper.updateUDGridRecordOfEntity(this.udGrid, record)
					.then(responseRecord =>
					{
						if (removedDocumentIds.length > 0)
						{
							return tf.udgHelper.tryRemoveBaseRecordDocumentRelationships(this.baseRecordEntity.Id, gridTypeId, removedDocumentIds)
								.then(result =>
								{
									responseRecord.removedDocumentIds = result;
									return responseRecord;
								});
						}

						return responseRecord;
					});
			}

			if (removedDocumentIds.length > 0)
			{
				record.removedDocumentIds = removedDocumentIds;
			}

			return Promise.resolve(record);
		});
	};

	UDGridDetailViewViewModel.prototype.createEntity = function()
	{
		return this.addOrUpdateEntity(true);
	};

	UDGridDetailViewViewModel.prototype.updateEntity = function()
	{
		return this.addOrUpdateEntity(false);
	};

	UDGridDetailViewViewModel.prototype.generateEntityToSave = function()
	{
		let editFieldList = this.fieldEditorHelper.editFieldList,
			udGridDataPoint = dataPointsJSON[this.gridType]["User Defined Group"].filter(udGrid => udGrid.ID == this.udGrid.ID)[0],
			record = {};

		if (this._documents != null)
		{
			record.DocumentUDGridRecords = this._documents.map(item =>
			{
				return {
					DBID: tf.datasourceManager.databaseId,
					DocumentID: item.Id,
					UDGridRecordID: this.isCreateGridNewRecord ? null : this.recordEntity.Id,
				};
			});
		}

		Object.keys(editFieldList).map(key =>
		{
			let udGridFieldDataPoint = udGridDataPoint.UDGridFields.filter(udGridField => udGridField.field == key)[0];
			fieldItem = editFieldList[key];

			record[udGridFieldDataPoint.Guid] = fieldItem.value === undefined ? null : fieldItem.value;
		});

		return record;
	};

	UDGridDetailViewViewModel.prototype.getDocumentKendoGrids = function()
	{
		return this.$element.find(".kendo-grid").filter((_, item) =>
		{
			let $item = $(item),
				fieldData = $item.closest(".grid-stack-item").data();

			return fieldData && fieldData.field === "DocumentGrid";
		}).map((_, item) =>
		{
			return $(item).data("kendoGrid");
		});
	};

	UDGridDetailViewViewModel.prototype.readDocumentDataByIds = function(documentIds, columnFields)
	{
		if (!columnFields)
		{
			columnFields = [];
			this.getDocumentKendoGrids()
				.each((_, kendoGrid) =>
				{
					kendoGrid.columns.forEach(function(col)
					{
						if (columnFields.indexOf(col.FieldName) === -1)
						{
							columnFields.push(col.FieldName);
						}
					});
				});
			ensureRequiredDocumentFields(columnFields);
		}

		return tf.udgHelper.getDocumentGridRecords(columnFields, documentIds)
			.then(response =>
			{
				documents = response.Items;
				this._documents = documents;

				return documents;
			});
	};

	UDGridDetailViewViewModel.prototype.generateDocumentGridConfigs = function(dataItem)
	{
		let columns = this.prepareColumnsForDetailGrid("document", dataItem),
			columnFields = columns.map(function(column)
			{
				return column.FieldName;
			});

		ensureRequiredDocumentFields(columnFields);

		return {
			extraButtonConfigs: {
				checkPermission: function() { return tf.authManager.isAuthorizedForDataType("document", "add"); },
				btnClass: "add-document",
				btnLabel: "Associate"
			},
			columns: columns,
			getDataSource: () =>
			{
				if (this._documents != null)
				{
					return Promise.resolve({
						dataItems: this._documents,
						totalCount: this._documents.length,
						pageSize: 50
					});
				}

				if (this.isCreateGridNewRecord)
				{
					this._documents = [];
					return Promise.resolve({
						dataItems: this._documents,
						totalCount: this._documents.length,
						pageSize: 50
					});
				}

				return this.readDocumentDataByIds(this.recordEntity.DocumentUDGridRecords.map(document => document.DocumentID), columnFields)
					.then(documents =>
					{
						return {
							dataItems: documents,
							totalCount: documents.length,
							pageSize: 50
						};
					});
			},
			checkReadDataPermission: () =>
			{
				return true;
			},
			topRightButtonClick: () =>
			{
				this.manageDocumentAssociation();
			},
			recordDoubleClick: recordId =>
			{
				this.addOrEditMiniGridRecord(recordId);
			},
			dataBound: e =>
			{
				let $kendoGridElement = e.sender.element;
				$kendoGridElement.find(".k-grid-content table tr").each((_, el) =>
				{
					let data = $(el).closest(".kendo-grid").data("kendoGrid").dataItem(el);
					if (!data.FileName)
					{
						$(el).find(".k-grid-view").addClass("disable");
						$(el).find(".k-grid-download").addClass("disable");
					}

					if (!tf.docFilePreviewHelper.isFilePreviewable(data.MimeType))
					{
						$(el).find(".k-grid-view").addClass("disable");
					}
				});
			},
		};
	};

	UDGridDetailViewViewModel.prototype.onFileDrop = function(file)
	{
		this.addOrEditMiniGridRecord(null, file);
	};

	UDGridDetailViewViewModel.prototype.addOrEditMiniGridRecord = function(recordId, file)
	{
		if (this.obIsReadOnly())
		{
			return;
		}

		let recordType = "document",
			hasPermission = tf.authManager.isAuthorizedForDataType(recordType, recordId == null ? "add" : "edit");
		if (!hasPermission)
		{
			return;
		}

		return tf.helpers.detailViewHelper.getQuickAddLayoutByType(recordType).then(layout =>
		{
			if (!layout) return Promise.resolve(false);

			let options = {
				dataType: recordType,
				baseRecordType: this.gridType,
				baseRecordEntity: this.recordEntity,
				recordId: recordId,
				attachedFile: file,
				layoutEntity: layout,
				readonlyBlockFields: ["DocumentAssociationGrid"],
				pageLevelViewModel: this.pageLevelViewModel
			};

			return tf.modalManager.showModal(new TF.DetailView.BasicQuickAddModalViewModel(options))
				.then(result =>
				{
					if (!result || !result.success) return;

					if (result.isCreateGridNewRecord)
					{
						this._documents.push(result.entity);
					}
					else
					{
						let index = this._documents.findIndex(item => item.Id == result.entity.Id);
						this._documents.splice(index, 1, result.entity);
					}

					this.refreshDocumentGrids();
				});
		});
	};

	UDGridDetailViewViewModel.prototype.removeAssociationToDocument = function(recordId)
	{
		let index = this._documents.findIndex(item => item.Id == recordId);
		this._documents.splice(index, 1);

		this.refreshDocumentGrids();
	};

	UDGridDetailViewViewModel.prototype.getDocumentEntity = function(recordId)
	{
		let typeEndpoint = tf.dataTypeHelper.getEndpoint("document"),
			requestUrl = pathCombine(tf.api.apiPrefix(), typeEndpoint);

		requestUrl += `?@relationships=all&@excluded=FileContent&id=${ recordId }`;

		return tf.promiseAjax.get(requestUrl)
			.then(response =>
			{
				return response.Items[0];
			})
	};

	UDGridDetailViewViewModel.prototype.previewMiniGridDocumentFile = function(recordId)
	{
		this.getDocumentEntity(recordId)
			.then(entity =>
			{
				if (entity)
				{
					tf.docFilePreviewHelper.show(entity);
				}
			});
	};

	UDGridDetailViewViewModel.prototype.downloadMiniGridDocumentFile = function(recordId)
	{
		Promise.all([
			this.getDocumentEntity(recordId),
			tf.docFilePreviewHelper.readFileStream(recordId)
		]).then(values =>
		{
			var fileName = values[0].FileName,
				mimeType = values[0].MimeType,
				fileContent = values[1];
			//empty txt file  fileContent == ""
			if (fileContent == null)
			{
				tf.promiseBootbox.alert("The file content is empty!");
				return;
			}

			tf.docFilePreviewHelper.initDownloadOnBrowser(fileName, mimeType, fileContent);
		});
	};

	function getGridDataItem(e)
	{
		let $tr = $(e.target).closest("tr"),
			$grid = $tr.closest(".kendo-grid"),
			kendoGrid = $grid.data("kendoGrid");

		return kendoGrid.dataItem($tr);
	};

	UDGridDetailViewViewModel.prototype.getKendoGridActionColumn = function()
	{
		let command = [{
			name: "view",
			template: '<a class="k-button k-button-icontext k-grid-view" title="View"></a>',
			click: e =>
			{
				if ($(e.currentTarget).hasClass("disable"))
				{
					return;
				}

				this.previewMiniGridDocumentFile(getGridDataItem(e).Id);
			}
		},
		{
			name: "download",
			template: '<a class="k-button k-button-icontext k-grid-download" title="Download"><span></span>Download</a>',
			click: e =>
			{
				if ($(e.currentTarget).hasClass("disable"))
				{
					return;
				}

				this.downloadMiniGridDocumentFile(getGridDataItem(e).Id);
			}
		}];

		if (!this.obIsReadOnly())
		{
			command.push({
				name: "delete",
				template: '<a class="k-button k-button-icontext k-grid-delete delete-relationship" title="Disassociate"></a>',
				click: e =>
				{
					this.removeAssociationToDocument(getGridDataItem(e).Id);
				}
			});
		}

		// add min width to avoid title "Action" being cut.
		var minWidth = 45,
			columnWidth = Math.max(command.length * 30, minWidth) + "px";

		return {
			command: command,
			FieldName: "Action",
			DisplayName: "Action",
			Width: columnWidth,
			attributes: {
				class: "text-center"
			}
		};
	};

	UDGridDetailViewViewModel.prototype.getGridColumnsByType = function()
	{
		var self = this,
			columns = tf.helpers.kendoGridHelper.getGridColumnsFromDefinitionByType("document"),
			actionColumn = self.getKendoGridActionColumn();

		if (!!actionColumn)
		{
			columns.push(actionColumn);
		}

		return tf.helpers.kendoGridHelper.getDefinitionLayoutColumns(columns);
	};

	UDGridDetailViewViewModel.prototype.prepareColumnsForDetailGrid = function(dataItem)
	{
		var self = this,
			columns,
			allColumns = self.getGridColumnsByType();

		if (dataItem.columns && dataItem.columns.length > 0)
		{
			columns = dataItem.columns.map(function(savedColumn)
			{
				var columnName = typeof savedColumn === "string" ? savedColumn : savedColumn.FieldName;
				return allColumns.filter(function(column)
				{
					return column.FieldName === columnName;
				})[0];
			});

			columns = columns.filter(function(c)
			{
				return !!c;
			});
		}
		else
		{
			columns = allColumns.filter(function(c)
			{
				return ["Name", "FileName", "Description", "Action"].indexOf(c.FieldName) > -1;
			});
		}

		return columns;
	};

	UDGridDetailViewViewModel.prototype.manageDocumentAssociation = function()
	{
		let associationType = "document",
			p1 = tf.helpers.detailViewHelper.getQuickAddLayoutByType(associationType),
			p2 = tf.dataTypeHelper.getDefaultColumnsByDataType(associationType);

		Promise.all([p1, p2]).then(values =>
		{
			let layout = values[0],
				defaultColumns = values[1];

			if (!layout) return;

			let selectedData = this._documents,
				options = {
					baseRecordType: this.gridType,
					baseRecordEntity: this.recordEntity,
					layoutEntity: layout,
					associationType: associationType,
					selectedData: selectedData,
					defaultColumns: defaultColumns,
					readonlyBlockFields: ["DocumentAssociationGrid"],
					pageLevelViewModel: this.pageLevelViewModel
				};
			tf.modalManager.showModal(new TF.DetailView.ManageRecordAssociationModalViewModel(options))
				.then(response =>
				{
					if (!response) return;
					if (!response.isNewRecordCreated && Array.equals(selectedData.map(d => d.Id), response.selectedIds)) return;

					let selectedIds = response.selectedIds;
					if (!Array.isArray(selectedIds)) return;

					this.readDocumentDataByIds(selectedIds).then(() =>
					{
						this.refreshDocumentGrids();
					});
				});
		});
	};

	UDGridDetailViewViewModel.prototype.refreshDocumentGrids = function()
	{
		this.getDocumentKendoGrids().each((_, kendoGrid) =>
		{
			kendoGrid.dataSource.data(this._documents);
		});
	};
}());
(function()
{
	const GRID_TOP_RIGHT_BUTTON_SELECTOR = ".grid-top-right-button";
	const KENDO_GRID_SELECTOR = ".kendo-grid";
	createNamespace("TF.DetailView.DataBlockComponent").UDGridBlock = UDGridBlock

	function UDGridBlock(options, detailView)
	{
		var self = this;

		TF.DetailView.DataBlockComponent.BaseDataBlock.call(self, detailView);
		self.$detailView = detailView.$element;
		self.gridType = detailView.gridType;
		self.recordEntity = detailView.recordEntity;
		self.recordId = detailView.recordId;
		self.fieldEditorHelper = detailView.fieldEditorHelper;
		self.obEditing = detailView.obEditing;
		self.$element = null;
		self.uniqueClassName = null;
		self.options = options;
		self._ignoredColumnNames = [];
		self._documentColumn = {
			FieldName: "DocumentCount",
			DisplayName: "Document Count",
			Width: "120px"
		};
		self._getActionColumns = function(isEditableBasedOnSignedPolicy, isReadOnly)
		{
			const command = [];
			const viewBtnOption = {
				name: 'view',
				template: '<a class="k-button k-button-icontext k-grid-view" title="View" href="javascript:void(0)"></a>',
				click: self.editClickEvent.bind(self)
			};
			const editBtnOption = {
				name: 'edit',
				template: '<a class="k-button k-button-icontext k-grid-edit" title="Edit"></a>',
				click: self.editClickEvent.bind(self)
			};
			const deleteBtnOption = {
				name: "delete",
				template: '<a class="k-button k-button-icontext k-grid-delete" title="Delete"></a>',
				click: self.deleteRecord.bind(self)
			};

			if (isReadOnly)
			{
				command.push(viewBtnOption);
			}
			else
			{
				if (isEditableBasedOnSignedPolicy)
				{
					command.push(viewBtnOption);
				}
				command.push(editBtnOption);
			}

			if (!isReadOnly)
			{
				command.push(deleteBtnOption);
			}

			return {
				command: command,
				FieldName: "Action",
				DisplayName: "Action",
				Width: '80px',
				attributes: {
					class: "text-center"
				}
			};
		};

		self._updatedInfoColumns = TF.DetailView.UserDefinedGridHelper.getUpdatedInfoColumns();
		self._geoColumns = TF.DetailView.UserDefinedGridHelper.getGeoInfoColumns();
		self.initElement(options);

		self.pubSubSubscriptions = [];

		self.isBlockReadOnly.subscribe(val =>
		{
			if (val)
			{
				self.$el.find(GRID_TOP_RIGHT_BUTTON_SELECTOR).addClass("disabled");
			} else
			{
				self.$el.find(GRID_TOP_RIGHT_BUTTON_SELECTOR).removeClass("disabled");
			}
		});
	}

	UDGridBlock.prototype = Object.create(TF.DetailView.DataBlockComponent.BaseDataBlock.prototype);

	UDGridBlock.prototype.isReadOnly = function()
	{
		if (this.isBlockReadOnly())
		{
			return true;
		}
		if (this.detailView == null)
		{
			return true;
		}
		if (window.opener && window.name.indexOf("new-detailWindow") >= 0)
		{
			return true;
		}
		if (tf.isViewfinder)
		{
			return true;
		}
		if (!this.recordEntity && !this.recordId)
		{
			return true;
		}
		if (!this.checkModifyPermission(this.gridType))
		{
			return true;
		}

		//detailview's readonly doesn't affect form(udgrid).
		return this.detailView.obIsReadOnly();
	}

	UDGridBlock.prototype.initElement = function(options)
	{
		var self = this,
			uniqueClassName = options.uniqueClassName || tf.helpers.detailViewHelper.generateUniqueClassName(),
			title = options.title,
			$element = $("<div>", { class: uniqueClassName }),
			$gridStackItem = $("<div>", { class: "grid-stack-item-content custom-grid", "data-block-field-name": options.field }),
			$itemTitleInput = $("<input>", { class: "item-title", type: "text", value: title }),
			$itemTitleDiv = $("<div>", { class: "item-title" }),
			$itemContent = $("<div>", { class: "item-content grid" }),
			$kendoGrid = $("<div>", { class: "kendo-grid" }),
			$btn = $("<div/>", { class: "udgrid-btn grid-top-right-button add-document", text: "add" }),
			$itemTitleText = $("<div>", {
				class: "item-title-text base-ellipsis", text: options.ExternalID &&
					options.ExternalID.trim() !== "" ? title + ` ( External ID: ${options.ExternalID.trim()} )` : title
			});

		if (self.isReadOnly())
		{
			$btn.addClass("disabled");
		}
		// Fix RW-19496: Add button is overlap on label
		$itemTitleText.css({
			"width": "calc(100% - 60px)"
		});

		$itemTitleDiv.append($($itemTitleText));
		$itemTitleDiv.append($($btn));

		$itemTitleDiv.css({
			"margin-bottom": "30px",
			"top": "30px",
			"position": "relative"
		});
		$gridStackItem.attr("mini-grid-type", "UDGrid")
		$itemContent.append($kendoGrid);
		$gridStackItem.append($itemTitleInput, $itemTitleDiv, $itemContent);
		$element.append($gridStackItem);
		self.$el = $element;
		self.$el.attr("UDGridId", options.UDGridId)
		self.uniqueClassName = uniqueClassName;
		self.options = options;
	};

	UDGridBlock.prototype.getGridColumnsByType = function()
	{
		var self = this;
		var fieldNameAndGUID = tf.udgHelper.getGuidToNameMappingOfGridFields(self.options, true, true);
		var originColumns = [];
		for (var key in fieldNameAndGUID)
		{
			const isMapUDGridField = self.options.UDGridFields.findIndex((f) =>
			{
				return f.Guid === key && f.type === "Map";
			}) >= 0;
			if (isMapUDGridField)
			{
				originColumns.push({
					FieldName: TF.DetailView.UserDefinedGridHelper.getXCoordFieldName(key),
					DisplayName: TF.DetailView.UserDefinedGridHelper.getXCoordDisplayName(fieldNameAndGUID[key]),
				});

				originColumns.push({
					FieldName: TF.DetailView.UserDefinedGridHelper.getYCoordFieldName(key),
					DisplayName: TF.DetailView.UserDefinedGridHelper.getYCoordDisplayName(fieldNameAndGUID[key]),
				});
			}
			else
			{
				originColumns.push({
					FieldName: key,
					DisplayName: fieldNameAndGUID[key],
				});
			}
		}
		originColumns.push(...self._updatedInfoColumns);
		originColumns.push(...self._geoColumns);
		if (tf.udgHelper.isDocumentIncluded(self.options))
		{
			originColumns.push(self._documentColumn);
		}

		const isEditableBasedOnSignedPolicy = tf.udgHelper.getEditableBasedOnSignedPolicy(self.options);
		return originColumns.concat(self._getActionColumns(isEditableBasedOnSignedPolicy));
	};

	UDGridBlock.prototype.initEvents = function()
	{
		var self = this,
			$btn = self.$el.find(GRID_TOP_RIGHT_BUTTON_SELECTOR);
		$btn.on("click", () =>
		{
			tf.udgHelper.addEditUDFGroupRecordInQuickAddModal(self.options, self.gridType, self.detailView.recordEntity)
				.then((result) =>
				{
					if (!result)
					{
						return;
					}

					if (self.detailView.isCreateGridNewRecord)
					{
						self.initEventsWhenIsCreateGridNewRecord(result);
					}
					else
					{
						self.detailView.pageLevelViewModel.popupSuccessMessage('Updates have been saved successfully.');
					}

					if (result.DocumentUDGridRecords)
					{
						self.updateDocumentGrid(result.DocumentUDGridRecords.map(document => document.DocumentID), []);
					}

					PubSub.publish("udgrid", {});
				});
		});
	}

	UDGridBlock.prototype.initEventsWhenIsCreateGridNewRecord = function(result)
	{
		const self = this;
		if (!self.detailView.fieldEditorHelper.editFieldList.UDGrids)
		{
			self.detailView.fieldEditorHelper.editFieldList.UDGrids = [];
		}

		let udGrid = self.options;
		const editUdGrid = self.detailView.fieldEditorHelper.editFieldList.UDGrids.filter(item => item.ID === udGrid.ID);
		if (editUdGrid.length === 0)
		{
			self.detailView.fieldEditorHelper.editFieldList.UDGrids.push(udGrid);
		}
		else
		{
			udGrid = editUdGrid[0];
		}

		if (!udGrid.UDGridRecordsValues)
		{
			udGrid.UDGridRecordsValues = [];
		}
		result.Id = udGrid.UDGridRecordsValues.length + 1;// fake ID
		udGrid.UDGridRecordsValues.push(result);
		self.obEditing(true);
		self.detailView.pageLevelViewModel.popupSuccessMessage('Record has been added successfully.');
	};

	UDGridBlock.prototype.updateDocumentGrid = function(newDocumentIds, removedDocumentIds)
	{
		removedDocumentIds = removedDocumentIds || [];
		const documentGrids = tf.helpers.detailViewHelper.getAllGridsAndColumns(this.$detailView, "DocumentGrid").grids;
		if (documentGrids.length > 0)
		{
			const currentDocumentIds = $(documentGrids[0]).data("kendoGrid").dataSource.data().map(document => document.Id);
			let documentRelationshipIds = currentDocumentIds.concat(newDocumentIds);
			documentRelationshipIds = documentRelationshipIds.filter(documentId => !removedDocumentIds.includes(documentId));
			documentRelationshipIds = [...new Set(documentRelationshipIds)];
			tf.helpers.detailViewHelper.updateAllGridsDataSourceByIds("document", documentRelationshipIds, documentRelationshipIds.length, this.$detailView);
		}
	};

	UDGridBlock.prototype.afterDomAttached = function()
	{
		this.initDetailGrid();
		this.initGridActions();
	};

	UDGridBlock.prototype.getGridRelatedData = function()
	{
		var self = this;
		return tf.udgHelper.getUDGridRecordsOfEntity(self.options, self.options.dataTypeId, self.recordId)
			.then(res =>
			{
				return { Items: res };
			});
	};

	UDGridBlock.prototype.initGridActions = function()
	{
		var self = this;
		self.kendoGridActions = {
			"UDGrid": {
				delete: function(e, $target)
				{
					self.deleteRecord({ target: $target });
				}
			}
		}
	}

	UDGridBlock.prototype._initDetailGridColumn = function(col, columns, originFieldMapping)
	{
		var self = this;
		let specialColumns = [];

		const isXCoordField = TF.DetailView.UserDefinedGridHelper.isXCoordField(col);
		const isYCoordField = TF.DetailView.UserDefinedGridHelper.isYCoordField(col);
		if (isXCoordField || isYCoordField)
		{
			col = TF.DetailView.UserDefinedGridHelper.getPureFieldName(col);
		}

		if (col === "Action")
		{
			const isEditableBasedOnSignedPolicy = tf.udgHelper.getEditableBasedOnSignedPolicy(self.options);
			columns.push(self._getActionColumns(isEditableBasedOnSignedPolicy, self.isReadOnly()));
		}
		else if (TF.DetailView.UserDefinedGridHelper.isGeoInfoColumn(col))
		{
			const geoColumn = self._geoColumns.find(i => i.FieldName === col);
			_setGeoeInfoColumn(geoColumn, col);
			columns.push(geoColumn);
		}
		else if (TF.DetailView.UserDefinedGridHelper.isUpdatedInfoColumn(col))
		{

			const updatedColumn = self._updatedInfoColumns.find(i => i.FieldName === col);
			_setUpdateInfoColumn(updatedColumn, col);
			columns.push(updatedColumn);
		}
		else if (originFieldMapping[col])
		{
			const udgField = self.options.UDGridFields.find(field => field.Guid === col),
				column = {
					FieldName: col,
					DisplayName: originFieldMapping[col],
					width: 165,
					lockWidth: true,
					originalUdfField: udgField
				};

			switch (udgField.FieldOptions.TypeName)
			{
				case "Map":
					const xyCoordColumns = TF.DetailView.UserDefinedGridHelper.convertMapColumnToMapXYCoordColumns(column);
					specialColumns = _setSpecialColumns(specialColumns, isXCoordField, isYCoordField, xyCoordColumns)

					break;
				case "Signature":
					_setColumnSignature(column, col);
					break;
				case "Date/Time":
					_setColumnDateTime(column, col);
					break;
				case "Date":
					_setColumnDate(column, col);
					break;
				case "Time":
					_setColumnTime(column, col);
					break;
				case "List":
					_setColumnList(column, col);
					break;
				case "Boolean":
					_setColumnBoolean(column, col, udgField)
					break;
				case "Number":
					_setColumnNumber(column, col, udgField)
					break;
				case "Phone Number":
					_setColumnPhoneNumber(column, col);
					break;
				case "System Field":
					self._setIgnoredColumnNames(col);
					break;
			}

			if (specialColumns.length)
			{
				specialColumns.forEach(sc =>
				{
					sc.headerTemplate = GetQuestionHeaderTemplate(sc.DisplayName);
				});
				columns = columns.concat(specialColumns);
			}
			else
			{
				column.headerTemplate = GetQuestionHeaderTemplate(originFieldMapping[col]);
				columns.push(column);
			}

			function GetQuestionHeaderTemplate(displayName)
			{
				return `<span title="${displayName}" style="overflow: hidden;text-overflow: ellipsis;">${displayName}</span>`;
			}
		}

		return columns;
	}

	function _setSpecialColumns(specialColumns, isXCoordField, isYCoordField, xyCoordColumns)
	{
		if (isXCoordField)
		{
			specialColumns = [xyCoordColumns[0]];
		}
		else if (isYCoordField)
		{
			specialColumns = [xyCoordColumns[1]];
		}
		else
		{
			specialColumns = xyCoordColumns;
		}

		return specialColumns;
	}

	function _setGeoeInfoColumn(geoColumn, col)
	{
		geoColumn.template = function(item)
		{
			const value = item[col];
			return value == null ? '' : Number(value).toFixed(6);
		};
	}

	function _setUpdateInfoColumn(updatedColumn, col)
	{
		switch (updatedColumn.type)
		{
			case "datetime":
				updatedColumn.template = function(item)
				{
					const value = item[col];
					const dt = moment(value);
					if (tf.localTimeZone)
					{
						dt.add(tf.localTimeZone.hoursDiff, "hours");
					}

					return dt.isValid() ? dt.format("MM/DD/YYYY hh:mm A") : "";
				}
				break;
			case "string":
			default:
				updatedColumn.template = function(item)
				{
					const value = item[col];
					return value || "";
				};
				break;
		}
	}

	function _setColumnSignature(column, col)
	{
		column.type = "boolean";
		column.udfType = "SignatureBlock";
		column.template = function(item)
		{
			return `<div class='signature-checkbox-container'>
					<input type='checkbox' disabled class='signature-checkbox' ${item[col] ? 'checked' : ''}/>
				</div>`;
		};
	}
	function _setColumnDateTime(column, col)
	{
		var dateTimeTemplate = function(item)
		{
			const value = item[col];
			const dt = moment(value);
			return dt.isValid() ? dt.format("MM/DD/YYYY hh:mm A") : "";
		};

		column.template = dateTimeTemplate;
		column.type = "datetime";
	}
	function _setColumnDate(column, col)
	{
		column.template = function(item)
		{
			const value = item[col];
			const date = moment(value);
			return date.isValid() ? moment(value).format("MM/DD/YYYY") : "";
		};
		column.type = "date";
	}
	function _setColumnTime(column, col)
	{
		column.template = function(item)
		{
			const value = item[col];
			let time = moment(value);
			if (time.isValid())
			{
				return time.format("hh:mm A");
			}
			time = moment("1900-1-1 " + value);
			return time.isValid() ? time.format("hh:mm A") : "";
		};
	}
	function _setColumnList(column, col)
	{
		column.template = function(item)
		{
			const value = item[col];
			if (value instanceof Array)
			{
				return value.join(", ");
			}
			return isNullObj(value) ? "" : value;
		};
		column.type = "list";
	}
	function _setColumnBoolean(column, col, udgField)
	{
		column.template = function(item)
		{
			const value = item[col];
			if (isNullObj(value))
			{
				return '';
			}
			return value ? udgField.positiveLabel : udgField.negativeLabel || value;
		};
		/*
		 * Remove type for boolean since it impact the mini grid Boolean question, Boolean question always show TRUE label,
		 * because method "KendoGridHelper.prototype.getKendoField" covert "string" and "boolean" as "string", if here need type,please change the method
		 * "KendoGridHelper.prototype.getKendoField" as well.
		 */
	}
	function _setColumnNumber(column, col, udgField)
	{
		column.template = function(item)
		{
			let value = item[col];
			if (value == null || value === "")
			{
				return "";
			}

			const precision = udgField.FieldOptions.NumberPrecision;
			if (isNaN(Number(value)))
			{
				value = 0;
			}
			return Number(value).toFixed(_.isNumber(precision) ? precision : 0);

		};
		column.type = "number";
	}
	function _setColumnPhoneNumber(column, col)
	{
		column.template = function(item)
		{
			let value = item[col];
			if (isNullObj(value))
			{
				return '';
			}
			value = tf.dataFormatHelper.phoneFormatter(value);
			return value;
		};
	}

	UDGridBlock.prototype._setIgnoredColumnNames = function name(col)
	{
		const targetUdfFieldGuid = self.options.UDGridFields.find(x => x.Guid === col).editType.targetField;
		const targetUdf = self.recordEntity.UserDefinedFields.find(x => x.Guid === targetUdfFieldGuid);
		if (targetUdf)
		{
			const udfDatasourceIds = targetUdf.UDFDataSources.map(x => x.DBID);
			if (udfDatasourceIds.indexOf(tf.datasourceManager.databaseId) < 0)
			{
				self._ignoredColumnNames.push(col);
				return;
			}
		}
		else
		{
			self._ignoredColumnNames.push(col);
		}
	}

	UDGridBlock.prototype.initDetailGrid = function()
	{
		var self = this,
			isReadMode = self.isReadMode(),
			columns = [];

		if (self.options.columns && self.options.columns.length > 0)
		{
			var originFieldMapping = tf.udgHelper.getGuidToNameMappingOfGridFields(self.options, true, true);
			self.options.columns.forEach((c) =>
			{
				self._initDetailGridColumn(c, columns, originFieldMapping);
			});
		}
		else
		{
			columns = self.getGridColumnsByType();
		}

		self.$el.data("columns", columns);
		var getDataSource = function()
		{
			if (!isReadMode)
			{
				return Promise.resolve();
			}

			if (!self.recordId)
			{
				const udGridId = self.options.ID,
					udGrids = self.detailView.fieldEditorHelper.editFieldList["UDGrids"];

				self.dataItems = _formatNewDataSourceItems(udGridId, udGrids);
				return Promise.resolve({
					dataItems: dataSourceItems,
					totalCount: dataSourceItems.length,
					pageSize: 50
				});
			}

			return self.getGridRelatedData(self.options, columns.map(function(c)
			{
				var column = $.extend(true, {}, c);
				column.FieldName = tf.UDFDefinition.getOriginalName(c.FieldName);
				return column;
			})).then(function(result)
			{
				self.dataItems = result.Items;
				result.Items.sort((x, y) => (x.LastUpdatedOn > y.LastUpdatedOn ? -1 : 1));
				return {
					dataItems: result.Items,
					totalCount: result.Items.length,
					pageSize: 50
				};
			}, function(error)
			{
				self.$el.find(".custom-grid").addClass("no-permission");
				self.$el.find(".k-grid-content").empty().append("<p>You don't have permission to view data.</p>");
			});
		};

		var defaultGridOptions = {
			dataBound: function()
			{
				self._bindMiniGridEvent(self.$el.find(KENDO_GRID_SELECTOR));
			}
		};

		if (!TF.isMobileDevice)
		{
			defaultGridOptions.selectable = "multiple";
		}

		var options = {
			columns: columns,
			dataSource: getDataSource,
			sort: self.options.sort,
			gridOptions: $.extend(defaultGridOptions, {}),
			afterRenderCallback: function(kendoGrid, dataItems)
			{
				TF.DetailView.DataBlockComponent.UDGridBlock.renderCommandBtn(kendoGrid, dataItems);
			}.bind(self)
		};

		var grid = tf.helpers.kendoGridHelper.createSimpleGrid(self.$el, options);
		self.grid = grid;
		grid.options.totalCountHidden = options.totalCountHidden;

		function refreshGrid()
		{
			grid.options.afterRenderCallback = function(kendoGrid, dataItems)
			{
				TF.DetailView.DataBlockComponent.UDGridBlock.renderCommandBtn(kendoGrid, dataItems);
			}.bind(self)
			tf.helpers.kendoGridHelper.setGridDataSource(grid, getDataSource, grid.options);
		}

		self.pubSubSubscriptions.push(PubSub.subscribe("udgrid", () =>
		{
			refreshGrid();
		}));
	};

	function _formatNewDataSourceItems(udGridId, udGrids)
	{
		let currentEditUDGrid = [],
			dataSourceItems = [];

		if (udGrids)
		{
			currentEditUDGrid = udGrids.filter(udGrid => udGrid.ID === udGridId);
		}

		if (currentEditUDGrid.length > 0)
		{
			dataSourceItems = currentEditUDGrid[0].UDGridRecordsValues;
			dataSourceItems.forEach(item =>
			{
				if (Array.isArray(item.DocumentUDGridRecords))
				{
					item.DocumentCount = item.DocumentUDGridRecords.length;
				}
				else
				{
					item.DocumentCount = 0;
				}
			});
		}

		return dataSourceItems;
	}

	UDGridBlock.prototype._bindMiniGridEvent = function($grid)
	{
		var self = this;
		$grid.off("dblclick").on("dblclick", ".k-grid-content table tr", function(e)
		{
			self.editClickEvent(e);
		});

	};

	UDGridBlock.prototype.deleteRecord = function(e)
	{
		const self = this;
		tf.promiseBootbox.yesNo("Are you sure you want to delete this record?", "Detele Confirmation")
			.then(res =>
			{
				if (!res)
				{
					return undefined;
				}

				const $tr = $(e.target).closest("tr"),
					kendoGrid = $tr.closest(KENDO_GRID_SELECTOR).data("kendoGrid"),
					UDGRecord = kendoGrid.dataItem($tr[0]);

				if (this.detailView.isCreateGridNewRecord)
				{
					self._removeUnSavedRecord(UDGRecord);
				}

				tf.udgHelper.deleteUDGridRecordOfEntity(UDGRecord.Id).then(result =>
				{
					if (result)
					{
						this.detailView.detailViewHelper.removeFromAllGridsDataSourceByIds(this.$detailView, "UDGrid", [UDGRecord.Id]);
						this.detailView.pageLevelViewModel.popupSuccessMessage('Record has been deleted successfully.');
						PubSub.publish("udgrid");
						if (UDGRecord.DocumentUDGridRecords && UDGRecord.DocumentUDGridRecords.length > 0)
						{
							const relatedDocs = UDGRecord.DocumentUDGridRecords.map(item => item.DocumentID);
							tf.udgHelper.tryRemoveBaseRecordDocumentRelationships(this.recordId, this.options.DataTypeId, relatedDocs)
								.then(pureResult =>
								{
									return tf.helpers.detailViewHelper.removeFromAllGridsDataSourceByIds(this.$detailView, "document", pureResult);
								});
						}
					}
					else
					{
						tf.promiseBootbox.alert("Delete failed.")
					}
				}).catch(error =>
				{
					tf.promiseBootbox.alert("Delete failed.")
				});

				return undefined;
			});
	}

	UDGridBlock.prototype._removeUnSavedRecord = function(UDGRecord)
	{
		const udGrids = this.detailView.fieldEditorHelper.editFieldList["UDGrids"],
			currentEditUDGrid = udGrids.filter(udGrid => udGrid.ID === this.options.ID),
			udGridRecords = currentEditUDGrid[0].UDGridRecordsValues;

		const index = udGridRecords.findIndex(item => item.Id === UDGRecord.Id);
		udGridRecords.splice(index, 1);

		this.detailView.detailViewHelper.removeFromAllGridsDataSourceByIds(this.$detailView, "UDGrid", [UDGRecord.Id]);
		PubSub.publish("udgrid");
		if (UDGRecord.DocumentUDGridRecords && UDGRecord.DocumentUDGridRecords.length > 0)
		{
			const relatedDocs = UDGRecord.DocumentUDGridRecords.map(item => item.DocumentID);
			return tf.helpers.detailViewHelper.removeFromAllGridsDataSourceByIds(this.$detailView, "document", relatedDocs);
		}

		return undefined;
	}

	UDGridBlock.prototype.editClickEvent = function(e)
	{
		const $tr = $(e.target).closest("tr"),
			kendoGrid = $tr.closest(KENDO_GRID_SELECTOR).data("kendoGrid"),
			UDGRecord = kendoGrid.dataItem($tr[0]);

		const udfFields = kendoGrid.options.columns.filter(c => c.udfType === "SignatureBlock").map(d =>
		{
			return { Type: 15, Guid: d.FieldName }
		});
		const isSigned = tf.udgHelper.getIsReadOnlyBasedOnSignedPolicy(UDGRecord, udfFields);
		const isReadOnly = this.isReadOnly() || isSigned;
		isReadOnly ? this.viewRecord(UDGRecord) : this.editRecord(UDGRecord);
	}

	UDGridBlock.prototype.editMiniGridRecord = function(miniGridType, e, $target)
	{
		var self = this,
			$tr = $target.closest("tr"),
			kendoGrid = $tr.closest(KENDO_GRID_SELECTOR).data("kendoGrid"),
			UDGRecord = kendoGrid.dataItem($tr[0]);
		self.editRecord(UDGRecord);
	}

	UDGridBlock.prototype.editRecord = function(UDGRecord)
	{
		var self = this;

		tf.udgHelper.addEditUDFGroupRecordInQuickAddModal(self.options, self.gridType, self.detailView.recordEntity, UDGRecord).then((result) =>
		{
			if (!result)
			{
				return;
			}

			if (self.detailView.isCreateGridNewRecord)
			{
				let udGrid = self.options;
				const editUdGrid = self.detailView.fieldEditorHelper.editFieldList.UDGrids.filter(item => item.ID === udGrid.ID);
				udGrid = editUdGrid[0];
				const editUdGridRecord = udGrid.UDGridRecordsValues.filter(udgr => udgr.Id === UDGRecord.Id)[0];
				$.extend(editUdGridRecord, result);
				self.detailView.pageLevelViewModel.popupSuccessMessage('Record has been updated successfully.');
			}
			else
			{
				self.detailView.pageLevelViewModel.popupSuccessMessage('Updates have been saved successfully.');
			}

			if (result.DocumentUDGridRecords)
			{
				this.updateDocumentGrid(result.DocumentUDGridRecords.map(document => document.DocumentID), result.removedDocumentIds);
			}
			PubSub.publish("udgrid", {});
		});
	};

	UDGridBlock.prototype.viewRecord = function(UDGRecord)
	{
		tf.udgHelper.addEditUDFGroupRecordInQuickAddModal({ ...this.options, isReadOnly: true }, this.gridType, this.detailView.recordEntity, UDGRecord);
	};

	UDGridBlock.prototype.dispose = function(e)
	{
		var self = this;

		if (self.pubSubSubscriptions)
		{
			self.pubSubSubscriptions.forEach(function(item)
			{
				PubSub.unsubscribe(item);
			});

			self.pubSubSubscriptions = [];
		}

		var kendoGrid = self.$el.find(KENDO_GRID_SELECTOR).data("kendoGrid");
		if (kendoGrid)
		{
			kendoGrid.destroy();
		}
	};

	UDGridBlock.prototype.checkModifyPermission = function(dataType)
	{
		return tf.authManager.isAuthorizedForDataType(dataType, "edit");
	};

	UDGridBlock.renderCommandBtn = function(kendoGrid, dataItems)
	{
		if (!kendoGrid || !dataItems || !dataItems.length)
		{
			return;
		}

		const $rows = kendoGrid.element.find("tr");
		if (!$rows || !$rows.length)
		{
			return;
		}

		dataItems.forEach(function(dataItem, idx)
		{
			if ($rows.length >= idx + 1)
			{
				_SetEditAndReadBtn(kendoGrid, dataItem, idx, $rows)
			}

		});
	};

	function _SetEditAndReadBtn(kendoGrid, dataItem, idx, $rows)
	{
		const $editBtn = $($rows[idx + 1]).find('.k-button.k-button-icontext.k-grid-edit');
		const $viewBtn = $($rows[idx + 1]).find('.k-button.k-button-icontext.k-grid-view');

		const udfFields = kendoGrid.options.columns.filter(c => c.udfType === "SignatureBlock").map(d =>
		{
			return { Type: 15, Guid: d.FieldName };
		});
		const isReadOnly = tf.udgHelper.getIsReadOnlyBasedOnSignedPolicy(dataItem, udfFields);
		if (isReadOnly)
		{
			if ($editBtn && $editBtn.length)
			{
				$editBtn.hide();
			}
		}
		else
		{
			if ($viewBtn && $viewBtn.length)
			{
				$viewBtn.hide();
			}
		}
	}
})()

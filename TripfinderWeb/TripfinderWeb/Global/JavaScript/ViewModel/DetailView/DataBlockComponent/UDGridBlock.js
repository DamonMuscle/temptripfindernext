(function()
{
	createNamespace("TF.DetailView.DataBlockComponent").UDGridBlock = UDGridBlock;
	let STATUS = {
		EXPAND: 0,
		RESTORE: 1
	};
	const ADD_BUTTON_CLASS_NAME = '.grid-top-right-button.add-event';
	function UDGridBlock(options, detailView)
	{
		const self = this;
		options = TF.DetailView.UserDefinedGridHelper.handleFilterFormData(options);
		TF.DetailView.DataBlockComponent.BaseDataBlock.call(self, detailView);
		self.$detailView = detailView.$element;
		self.expandContainer = self.$detailView.find('.right-container');
		self.gridType = detailView.gridType;
		self.recordEntity = detailView.recordEntity;
		self.recordId = detailView.recordId;
		self.fieldEditorHelper = detailView.fieldEditorHelper;
		self.obEditing = detailView.obEditing;
		self.$element = null;
		self.lightKendoGrid = null;
		self.uniqueClassName = null;
		self.options = options;
		self.status = STATUS.RESTORE;
		self._ignoredColumnNames = [];
		self.includeIds = [];
		self._documentColumn = {
			FieldName: "DocumentCount",
			DisplayName: "Document Count",
			Width: "120px"
		};
		self._getActionColumns = function()
		{
			return {
				command: [
					{
						name: 'view',
						template: '<a style="display:none" class="k-button k-button-icontext k-grid-view" title="View" href="javascript:void(0)"></a>',
						click: self.editClickEvent.bind(self)
					},
					{
						name: 'edit',
						template: '<a style="display:none" class="k-button k-button-icontext k-grid-edit" title="Edit"></a>',
						click: self.editClickEvent.bind(self)
					},
					{
						name: "delete",
						template: '<a style="display:none" class="k-button k-button-icontext k-grid-delete" title="Delete"></a>',
						click: self.deleteRecord.bind(self)
					}
				],
				FieldName: "Action",
				DisplayName: "Action",
				type: "nofilter",
				Width: '80px',
				filterable: false,
				disableSummary: true,
				attributes: {
					class: "text-center"
				}
			};
		};
		self._updatedInfoColumns = TF.DetailView.UserDefinedGridHelper.getUpdatedInfoColumns();
		self._geoColumns = TF.DetailView.UserDefinedGridHelper.getGeoInfoColumns();
		self.initElement(options);

		self.pubSubSubscriptions = [];
		self.miniGridHelper = tf.helpers.miniGridHelper;

		self.isBlockReadOnly.subscribe(val =>
		{
			if (val)
			{
				self.$el.find(ADD_BUTTON_CLASS_NAME).addClass("disabled");
			} else
			{
				self.$el.find(ADD_BUTTON_CLASS_NAME).removeClass("disabled");
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
		//return this.detailView.obIsReadOnly();
		return false;
	}

	UDGridBlock.prototype._addExpandButton = function()
	{
		let self = this;
		if (!self.expandButton)
		{
			self.expandButton = $("<div title='Expand' style='margin-left:8px;width:30px;height:30px;top:0;padding:0;' class='grid-top-right-button expand-button'></div>")
			self.$el.find(`.custom-grid div.item-title`).prepend(self.expandButton);
		}
		self.expandButton.on('click', self._toggleClick.bind(self));

	};

	UDGridBlock.prototype._expand = function()
	{
		this.status = STATUS.EXPAND;
		this.expandedDom = $(`<div class="grid-stack"></div>`);
		this.expandContainer.children().hide();
		this.expandContainer.append(this.expandedDom);
		this.expandContainer.css({ position: "relative" }).addClass(TF.DetailView.DetailViewHelper.ExpandClassName);
		this.expandedDom.css({
			position: "absolute",
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			"z-index": 500,
			"background-color": "white"
		});
		this.expandedPrevHeight = this.$el.height();
		this.expandedPreWidth = this.$el.width();
		this.expandedPreLeft = this.$el.position().left;
		this.$originalPrevious = this.$el.prev();
		this.$originalContainer = this.$el.parent();
		this.expandedDom.append(this.$el);
		this.$el.css({ 'width': '100%', 'height': '100%', 'left': 0 });
		this.$innerGrid = this.$el.find('.kendo-grid .k-grid-content');
		this._fitExpandGridHeight();
	};

	UDGridBlock.prototype._restore = function()
	{
		this.status = STATUS.RESTORE;
		this.$el.removeAttr('style');
		this.$el.height(this.expandedPrevHeight);
		this.$innerGrid && this.$innerGrid.css('height', this.$innerGrid.parent().height() - 70);
		if (this.$originalPrevious && this.$originalPrevious.length > 0)
		{
			this.$el.insertAfter(this.$originalPrevious);
		} else if (this.$originalContainer && this.$originalContainer.length > 0)
		{
			this.$originalContainer.prepend(this.$el);
		}
		this.expandContainer.children().show();
		this.expandContainer.removeClass(TF.DetailView.DetailViewHelper.ExpandClassName);
		this.expandedDom && this.expandedDom.remove();
		this._fitExpandGridHeight();

		// for refresh the UI of grid
		PubSub.publish("udgrid_restore");
		PubSub.publish("document_restore");
	};

	UDGridBlock.prototype.manageLayout = function()
	{
		clearTimeout(this.reSizeExpandGridTimer);
		this.reSizeExpandGridTimer = setTimeout(() =>
		{
			if (this.status == STATUS.EXPAND)
			{
				this._fitExpandGridHeight();
			}
		}, 200)
	};

	UDGridBlock.prototype._fitExpandGridHeight = function()
	{
		this.lightKendoGrid.fitContainer();
	};

	UDGridBlock.prototype._toggleClick = function()
	{
		if (this.status == STATUS.RESTORE)
		{
			this._expand();

		} else
		{
			this._restore();
		}
		this.expandButton.toggleClass('restore');
		this.expandButton.attr('title', this.status == STATUS.RESTORE ? 'Expand' : 'Restore');
	};

	UDGridBlock.prototype.isAddBtnDisabled = function()
	{
		return this.isReadOnly() || !tf.authManager.isAuthorizedFor("formsResults", "add");
	};

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
			$kendoGrid = $("<div>", { class: "kendo-grid kendo-grid-container" }),
			$summaryContainer = $("<div>", { class: "kendo-grid kendo-summarygrid-container" }),
			$btn = $("<div/>", { class: "udgrid-btn grid-top-right-button add-event add-document", text: "add" }),
			$itemTitleText = $("<div>", {
				class: "item-title-text base-ellipsis", text: options.ExternalID &&
					options.ExternalID.trim() !== "" ? title + ` ( External ID: ${options.ExternalID.trim()} )` : title
			});

		if (self.isAddBtnDisabled())
		{
			$btn.addClass("disabled");
		}
		// Fix RW-19496: Add button is overlap on label
		$itemTitleText.css({
			"width": "calc(100% - 60px)",
			"top": "18px",
			"position": "relative"
		});

		$itemTitleDiv.append($($itemTitleText));
		$itemTitleDiv.append($($btn));

		$itemTitleDiv.css({
			"margin-bottom": "0px",
			"top": "0px",
			"height": "35px",
			"overflow": "hidden",
			"position": "relative"
		});
		$gridStackItem.attr("mini-grid-type", "UDGrid")
		$itemContent.append($kendoGrid, $summaryContainer);
		$gridStackItem.append($itemTitleInput, $itemTitleDiv, $itemContent);
		$element.append($gridStackItem);
		$kendoGrid.data("uniqueClassName", uniqueClassName);
		self.$el = $element;
		self.$el.attr("UDGridId", options.UDGridId)
		self.uniqueClassName = uniqueClassName;
		self.options = options;
		if (self.expandContainer && self.expandContainer.length > 0)
		{
			self._addExpandButton();
		}
	};

	UDGridBlock.prototype.getGridColumnsByType = function()
	{
		const self = this;
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
				self.miniGridHelper.updateUDGridColumns(originColumns, key, self);
			}
		}
		originColumns.push(...self._updatedInfoColumns);
		originColumns.push(...self._geoColumns);
		if (tf.udgHelper.isDocumentIncluded(self.options))
		{
			originColumns.push(self._documentColumn);
		}

		return originColumns.concat(self._getActionColumns());
	};

	UDGridBlock.prototype.initEvents = function()
	{
		var self = this,
			$btn = self.$el.find(ADD_BUTTON_CLASS_NAME);
		$btn.on("click", () =>
		{
			let checkFormHasSubmittedWithOneResponse = Promise.resolve([]);
			if (self.options.OneResponsePerRecipient)
			{
				checkFormHasSubmittedWithOneResponse = self.options.Public ?
					tf.udgHelper.getUDGridRecordsWithCreatedBy(self.options.UDGridId, self.options.DataTypeId) :
					tf.udgHelper.getUDGridRecordsWithRecordId(self.options.UDGridId, self.options.DataTypeId, self.recordId);
			}
			checkFormHasSubmittedWithOneResponse.then(res =>
			{
				if (res && res.length > 0)
				{
					tf.promiseBootbox.alert(TF.DetailView.UserDefinedGridHelper.ONE_RESPONSE_HAS_SUBMITTED, 'Warning');
					return;
				}
				tf.udgHelper.addEditUDFGroupRecordInQuickAddModal(self.options, self.gridType, self.detailView.recordEntity).then((result) =>
				{
					if (!result)
					{
						return;
					}

					if (self.detailView.isCreateGridNewRecord)
					{
						if (!self.detailView.fieldEditorHelper.editFieldList.UDGrids)
						{
							self.detailView.fieldEditorHelper.editFieldList.UDGrids = [];
						}

						let udGrid = self.options;
						let editUdGrid = self.detailView.fieldEditorHelper.editFieldList.UDGrids.filter(item => item.ID == udGrid.ID);
						if (editUdGrid.length == 0)
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
						seld.checkFormHasSubmittedWithOneResponse();
						self.detailView.pageLevelViewModel.popupSuccessMessage('Record has been added successfully.');
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

		});
	}

	UDGridBlock.prototype.updateDocumentGrid = function(newDocumentIds, removedDocumentIds)
	{
		removedDocumentIds = removedDocumentIds || [];
		let documentGrids = tf.helpers.detailViewHelper.getAllGridsAndColumns(this.$detailView, "DocumentGrid").grids;
		if (documentGrids.length > 0)
		{
			let currentDocumentIds = $(documentGrids[0]).data("kendoGrid").dataSource.data().map(document => document.Id),
				documentRelationshipIds = currentDocumentIds.concat(newDocumentIds);
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

	UDGridBlock.prototype.getIncludeIds = function()
	{
		var self = this;
		var isDesignMode = !self.isReadMode();
		if (isDesignMode)
		{
			return Promise.resolve([]);
		}

		if (!self.recordId)
		{
			let udGridId = self.options.ID,
				udGrids = self.detailView.fieldEditorHelper.editFieldList["UDGrids"],
				currentEditUDGrid = [],
				dataSourceItems = [];

			if (udGrids)
			{
				currentEditUDGrid = udGrids.filter(udGrid => udGrid.ID == udGridId);
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
			self.dataItems = dataSourceItems;
			var includeIds = (Array.isArray(dataSourceItems) && dataSourceItems.length > 0) ? dataSourceItems.map(function(item)
			{
				return item.Id;
			}) : [-1];
			return Promise.resolve(includeIds);
		}

		return self.getGridRelatedData().then(function(result)
		{
			return (Array.isArray(result.Items) && result.Items.length > 0) ? result.Items.map(function(item)
			{
				return item.Id;
			}) : [-1];
		});
	}

	UDGridBlock.prototype.initDetailGrid = function()
	{
		var self = this,
			isDesignMode = !self.isReadMode(),
			columns = [], prepareColumns = [],
			summaryConfig = self.miniGridHelper.getSummaryBarConfig(self.$el, self.options);

		let formId = self.options.ID;

		self.options.columns = self.renameUDGridColumnName(self.options.columns);

		//#RW-25103 refresh option columns every time
		prepareColumns = self.prepareColumnsForDetailGrid();
		if (prepareColumns && prepareColumns.length > 0)
		{
			self.options.columns = prepareColumns.map(x => x.FieldName);
		}

		if (self.options.columns && self.options.columns.length > 0)
		{
			self.options.columns.forEach(col =>
			{
				let isXCoordField = TF.DetailView.UserDefinedGridHelper.isXCoordField(col);
				let isYCoordField = TF.DetailView.UserDefinedGridHelper.isYCoordField(col);
				if (isXCoordField)
				{
					col = TF.DetailView.UserDefinedGridHelper.getPureFieldName(col);
				}
				else if (isYCoordField)
				{
					col = TF.DetailView.UserDefinedGridHelper.getPureFieldName(col);
				}

				var dateTimeTemplate = function(item)
				{
					let value = item[col];
					let dt = moment(value);
					return dt.isValid() ? dt.format("MM/DD/YYYY hh:mm A") : "";
				};

				var dateTimeTemplateLocalZone = function(item)
				{
					let value = item[col];
					let dt = moment(value); // value is Date object
					dt = utcToClientTimeZone(toISOStringWithoutTimeZone(dt));
					return dt.isValid() ? dt.format("MM/DD/YYYY hh:mm A") : "";
				};

				if (col === "Action")
				{
					columns.push(self._getActionColumns());
					return;
				}
				else if (TF.DetailView.UserDefinedGridHelper.isGeoInfoColumn(col))
				{
					let geoColumn = self._geoColumns.find(i => i.FieldName == col);
					geoColumn.template = function(item)
					{
						let value = item[col];
						return (value == null || value == 0) ? '' : Number(value).toFixed(6);
					};
					columns.push(geoColumn);
					return;
				}
				else if (TF.DetailView.UserDefinedGridHelper.isUpdatedInfoColumn(col))
				{

					let updatedColumn = self._updatedInfoColumns.find(i => i.FieldName == col);
					switch (updatedColumn.type)
					{
						case "datetime":
							updatedColumn.template = dateTimeTemplateLocalZone;
							break;
						case "string":
						default:
							updatedColumn.template = function(item)
							{
								let value = item[col];
								return value || "";
							};
							break;
					}

					columns.push(updatedColumn);
					return;
				}
				self.miniGridHelper.updateUDGridColumns(columns, col, self);
			});

		}
		else
		{
			columns = self.getGridColumnsByType();
		}

		self.$el.data("columns", columns);

		if (summaryConfig && summaryConfig["ShowSummaryBar"])
		{
			self.$el.find(".kendo-summarygrid-container").css("display", "block");
		}
		else
		{
			self.$el.find(".kendo-summarygrid-container").css("display", "none");
		}

		var options = {
			gridDefinition: self.miniGridHelper.getKendoColumnsExtend(columns),
			totalCountHidden: self.options.totalCountHidden,
			defaultSort: self.options.sort,
			defaultFilter: self.miniGridHelper.getFilterConfig(self.$el, self.options),
			gridType: "form",
			gridData: { value: formId },
			isMiniGrid: true, // apply some special settings 
			hasPermission: tf.authManager.isAuthorizedFor("formsResults", "read"),
			miniGridEditMode: isDesignMode,
			showOverlay: false, // do not need loading
			resizable: !isDesignMode, // enable column resize if not design mode
			reorderable: false, // disable column reorder.
			canDragDelete: false, // disable drag delete.
			filterable: self.miniGridHelper.getFilterableConfig(self.$el, self.options),
			lockColumnTemplate: self.miniGridHelper.getLockedColumnTemplate(self.$el, self.options),
			gridLayout: summaryConfig,
			url: pathCombine(tf.api.apiPrefix(), "search", "formResults"),
			setRequestOption: requestOption =>
			{
				return self._setRequestOption(requestOption, columns, formId);
			},
			getAsyncRequestOption: requestOption =>
			{
				return self.getIncludeIds().then((includeIds) =>
				{
					includeIds = [...new Set(includeIds)];
					self.includeIds = includeIds;
					requestOption.data.idFilter = {
						IncludeOnly: includeIds,
						ExcludeAny: []
					};
					return requestOption;
				})
			},
			onCreateGrid: () =>
			{
				self.grid = self.lightKendoGrid.kendoGrid;
			},
			onDataBound: () =>
			{
				self._onDataBound();
			}
		}

		if (!TF.isMobileDevice)
		{
			options.selectable = "multiple";
		}

		self.lightKendoGrid = new TF.Grid.KendoGrid(self.$el.find(".kendo-grid-container"), options);
		self.$el.find(".kendo-grid-container").data("lightKendoGrid", self.lightKendoGrid);

		function refreshGrid()
		{
			self.lightKendoGrid.refresh();
		}

		function fitContainer()
		{
			self.lightKendoGrid.fitContainer();
		}

		self.pubSubSubscriptions.push(PubSub.subscribe("udgrid", () => { refreshGrid() }));
		// Expand mode: when refresh the others grid, they are invisible and cannot get correct size of them;
		// so need refresh the ui after restoring
		self.pubSubSubscriptions.push(PubSub.subscribe("udgrid_restore", () => { fitContainer() }));
	};

	UDGridBlock.prototype._onDataBound = function()
	{
		var self = this;
		self._updateGridFooter();
		self._bindMiniGridEvent(self.$el.find(".kendo-grid-container"));
		self.renderCommandBtn();
	}

	/**
	 * Set the Request Option
	 */
	UDGridBlock.prototype._setRequestOption = function(requestOption, columns, formId)
	{
		var defaultFilter = tf.udgHelper.getUDGridIdFilter(formId);

		if (!requestOption.data.FilterSet || !Object.keys(requestOption.data.FilterSet).length)
		{
			const filterSet = {};
			filterSet["FilterItems"] = [];
			filterSet["FilterItems"].push(...defaultFilter);
			filterSet["FilterSets"] = [];
			filterSet["LogicalOperator"] = "and";
			requestOption.data.FilterSet = filterSet;
		}
		else
		{
			requestOption.data.FilterSet["FilterItems"].push(...defaultFilter);
		}

		if (requestOption.data.filterSet && requestOption.data.filterSet.FilterItems)
		{
			const filterItems = requestOption.data.filterSet.FilterItems;
			filterItems.forEach(tf.udgHelper.timeFieldFilterUpdated);
		}

		const filterSets = requestOption.data.filterSet && requestOption.data.filterSet.FilterSets;
		if (filterSets)
		{
			filterSets.forEach((filterSet) =>
			{
				if (filterSet && filterSet.FilterItems)
				{
					filterSet.FilterItems.forEach(tf.udgHelper.timeFieldFilterUpdated);
				}
			});
		}

		requestOption.data.fields = columns.map(x => x.FieldName);
		if (requestOption.data.fields)
		{
			requestOption.data.fields.push(...["Latitude", "Longitude", "RecordID"]);
		}

		if ((requestOption.data.sortItems || []).length == 0)
		{
			requestOption.data.sortItems = [{
				Direction: "Descending",
				Name: "LastUpdatedOn"
			}];
		}

		if (formId)
		{
			if (requestOption.data.filterSet)
			{
				requestOption.data.filterSet.UDGridID = formId || this.gridData.value;
			} else if (requestOption.data.FilterSet)
			{
				requestOption.data.FilterSet.UDGridID = formId || this.gridData.value;
			}
		}

		return requestOption;
	}

	/**
	 * Update Grid Footer Information
	 */
	UDGridBlock.prototype._updateGridFooter = function()
	{
		var self = this;
		var item = self.$el.find(".kendo-grid-container");
		var total = 0;
		var result = 0;
		var hasPermission = tf.authManager.isAuthorizedFor("formsResults", "read");
		if (self.isReadMode() && hasPermission)
		{
			total = self.grid.dataSource.total();
			result = Array.isArray(self.includeIds) ? self.includeIds.filter(x => x > 0).length : [];
		}

		tf.helpers.miniGridHelper.updateGridFooter(item, total, result);
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
		tf.promiseBootbox.yesNo("Are you sure you want to delete this record?", "Detele Confirmation").then(res =>
		{
			if (!res)
			{
				return;
			}

			let $tr = $(e.target).closest("tr"),
				kendoGrid = $tr.closest(".kendo-grid").data("kendoGrid"),
				UDGRecord = kendoGrid.dataItem($tr[0]);
			if (this.detailView.isCreateGridNewRecord)
			{
				let udGrids = this.detailView.fieldEditorHelper.editFieldList["UDGrids"],
					currentEditUDGrid = udGrids.filter(udGrid => udGrid.ID == this.options.ID),
					udGridRecords = currentEditUDGrid[0].UDGridRecordsValues;

				let index = udGridRecords.findIndex(item => item.Id == UDGRecord.Id);
				udGridRecords.splice(index, 1);

				this.detailView.detailViewHelper.removeFromAllGridsDataSourceByIds(this.$detailView, "UDGrid", [UDGRecord.Id]);
				PubSub.publish("udgrid");
				if (UDGRecord.DocumentUDGridRecords && UDGRecord.DocumentUDGridRecords.length > 0)
				{
					let relatedDocs = UDGRecord.DocumentUDGridRecords.map(item => item.DocumentID);
					return tf.helpers.detailViewHelper.removeFromAllGridsDataSourceByIds(this.$detailView, "document", relatedDocs);
				}

				return;
			}

			tf.udgHelper.deleteUDGridRecordOfEntity([UDGRecord.Id]).then(result =>
			{
				if (result)
				{
					// this.detailView.detailViewHelper.removeFromAllGridsDataSourceByIds(this.$detailView, "UDGrid", [UDGRecord.Id]);
					this.detailView.pageLevelViewModel.popupSuccessMessage('Record has been deleted successfully.');
					PubSub.publish("udgrid");
					if (UDGRecord.DocumentUDGridRecords && UDGRecord.DocumentUDGridRecords.length > 0)
					{
						let relatedDocs = UDGRecord.DocumentUDGridRecords.map(item => item.DocumentID);
						tf.udgHelper.tryRemoveBaseRecordDocumentRelationships(this.recordId, this.options.DataTypeId, relatedDocs)
							.then(result =>
							{
								return tf.helpers.detailViewHelper.removeFromAllGridsDataSourceByIds(this.$detailView, "document", result);
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
			})
		})
	}

	UDGridBlock.prototype.editClickEvent = function(e)
	{
		const self = this;
		const $tr = $(e.target).closest("tr");
		const kendoGrid = $tr.closest(".kendo-grid-container").data("kendoGrid");
		const formRecord = kendoGrid.dataItem($tr[0]);
		const gridArg = { UDGridFields: self.options.UDGridFields };
		const udGridRecordPromise = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgridrecords"),
			{
				paramData: {
					"Id": formRecord.Id,
					"@relationship": "DocumentUDGridRecords,MapUDGridRecords"
				}
			},
			{ overlay: false }
		);

		tf.loadingIndicator.showImmediately();
		udGridRecordPromise
			.then(res =>
			{
				const selectedRecord = tf.udgHelper.getFormRecord(tf.udgHelper.getGuidToNameMappingOfGridFields(gridArg), res.Items[0], self.options);
				tf.udgHelper.isFormReadonly(this.options.UDGridId, selectedRecord, this.options.DataTypeId).then(readonly =>
				{
					if (window.location.href.indexOf("/newwindow/") >= 0)
					{
						readonly = true;
					}

					//if main grid has no edit permission, the form should be readonly
					if (!tf.authManager.isAuthorizedForDataType((tf.dataTypeHelper.getKeyById(this.options.DataTypeId) || "").toLowerCase(), "edit"))
					{
						readonly = true;
					}

					readonly ? this.viewRecord(selectedRecord) : this.editRecord(selectedRecord);
				});
			})
			.finally(() =>
			{
				tf.loadingIndicator.tryHide();
			});
	}

	UDGridBlock.prototype.editMiniGridRecord = function(miniGridType, e, $target)
	{
		var self = this,
			$tr = $target.closest("tr"),
			kendoGrid = $tr.closest(".kendo-grid").data("kendoGrid"),
			UDGRecord = kendoGrid.dataItem($tr[0]);
		self.editRecord(UDGRecord);
	}

	UDGridBlock.prototype.prepareColumnsForDetailGrid = function()
	{
		var self = this,
			columns,
			allColumns = self.getGridColumnsByType();

		if (self.$el.data("columns") && self.$el.data("columns").length > 0)
		{
			// columns cached from edit mode.
			columns = self.$el.data("columns").map(function(savedColumn)
			{
				var columnName = typeof savedColumn === "string" ? savedColumn : savedColumn.FieldName;
				return allColumns.filter(function(column)
				{
					return column.FieldName === columnName;
				})[0];
			});
		}
		else if (self.options.columns && self.options.columns.length > 0)
		{
			columns = self.options.columns.map(function(savedColumn)
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

		return columns;
	};

	UDGridBlock.prototype.renameUDGridColumnName = function(columns)
	{
		const renameColumns = {
			'CreatedByUserName': 'CreatedBy',
			'LastUpdatedByUserName': 'LastUpdatedBy',
			'latitude': 'Latitude',
			'longitude': 'Longitude',
		};

		columns && columns.forEach((val, idx) =>
		{
			if (val && renameColumns.hasOwnProperty(val))
			{
				columns[idx] = renameColumns[val];
			}
		});

		return columns;
	}

	UDGridBlock.prototype.editRecord = function(UDGRecord)
	{
		var self = this;

		tf.udgHelper.addEditUDFGroupRecordInQuickAddModal(self.options, self.gridType, self.detailView.recordEntity, UDGRecord).then((result) =>
		{
			if (!result) return;

			if (self.detailView.isCreateGridNewRecord)
			{
				let udGrid = self.options;
				let editUdGrid = self.detailView.fieldEditorHelper.editFieldList.UDGrids.filter(item => item.ID == udGrid.ID);
				udGrid = editUdGrid[0];
				let editUdGridRecord = udGrid.UDGridRecordsValues.filter(udgr => udgr.Id == UDGRecord.Id)[0];
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

		var kendoGrid = self.$el.find(".kendo-grid-container").data("kendoGrid");
		if (kendoGrid)
		{
			kendoGrid.destroy();
			self.$el.find(".kendo-grid-container").data('ShortcutExtender')?.dispose();
			self.$el.find(".kendo-grid-container").html("");
		}

		var summaryGrid = self.$el.find(".kendo-summarygrid-container").data("kendoGrid");
		if (summaryGrid)
		{
			summaryGrid.destroy();
			self.$el.find(".kendo-summarygrid-container").data('ShortcutExtender')?.dispose();
			self.$el.find(".kendo-summarygrid-container").css("height", "0px");
			self.$el.find(".kendo-summarygrid-container").html("");
		}

		self._restore();
	};

	UDGridBlock.prototype.checkModifyPermission = function(dataType)
	{
		return tf.authManager.isAuthorizedForDataType(dataType, "edit");
	};

	UDGridBlock.prototype.renderCommandBtn = function()
	{
		const self = this;
		const kendoGrid = self.grid;
		if (!kendoGrid || !kendoGrid.content)
		{
			return;
		}

		const $rows = kendoGrid.content.find("tr");
		if (!$rows || !$rows.length)
		{
			return;
		}

		$rows.map(function(idx, tr)
		{
			var kendo_uid = $(tr).data('kendo-uid') || "";
			var dataItem = kendoGrid.dataSource.getByUid(kendo_uid);
			dataItem && self._SetEditAndReadBtn(kendoGrid, dataItem, idx, $rows);
		});
	};

	UDGridBlock.prototype._SetEditAndReadBtn = function(kendoGrid, dataItem, idx, $rows)
	{
		const self = this;
		const $editBtn = $($rows[idx]).find('.k-button.k-button-icontext.k-grid-edit');
		const $viewBtn = $($rows[idx]).find('.k-button.k-button-icontext.k-grid-view');
		const $delBtn = $($rows[idx]).find('.k-button.k-button-icontext.k-grid-delete');
		const udfFields = kendoGrid.options.columns.filter(c => c.udfType === "SignatureBlock").map(d =>
		{
			return { Type: 15, Guid: d.FieldName };
		});
		const hasSignatureRespond = tf.udgHelper.getIsReadOnlyBasedOnSignedPolicy(dataItem, udfFields);
		if (self.isReadOnly())
		{
			$viewBtn.show();
		}
		else
		{
			if (tf.authManager.isAuthorizedFor("formsResults", "delete"))
			{
				$delBtn.show();
			}
			if (hasSignatureRespond || !tf.authManager.isAuthorizedFor("formsResults", "edit"))
			{
				$viewBtn.show();
			}
			else
			{
				$editBtn.show();
			}
		}
	}
})()

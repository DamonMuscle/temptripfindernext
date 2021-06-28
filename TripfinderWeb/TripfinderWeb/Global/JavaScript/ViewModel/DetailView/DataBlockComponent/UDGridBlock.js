(function () {
    createNamespace("TF.DetailView.DataBlockComponent").UDGridBlock = UDGridBlock

    function UDGridBlock(options, detailView) {
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
        self._getActionColumns = function (isSignatureEnabled, isReadOnly) {
            let command = [];
            let viewBtnOption = {
                name: 'view',
                template: '<a class="k-button k-button-icontext k-grid-view" title="View" href="javascript:void(0)"></a>',
                click: self.editClickEvent.bind(self)
            };
            let editBtnOption = {
                name: 'edit',
                template: '<a class="k-button k-button-icontext k-grid-edit" title="Edit"></a>',
                click: self.editClickEvent.bind(self)
            };
            let deleteBtnOption = {
                name: "delete",
                template: '<a class="k-button k-button-icontext k-grid-delete" title="Delete"></a>',
                click: self.deleteRecord.bind(self)
            };

            if (isReadOnly) {
                command.push(viewBtnOption);
            }
            else {
                if (isSignatureEnabled) {
                    viewBtnOption.template = '<a class="k-button k-button-icontext k-grid-view is-signature-enabled" title="View" href="javascript:void(0)></a>';
                    editBtnOption.template = '<a class="k-button k-button-icontext k-grid-edit is-signature-enabled" title="Edit"></a>';
                    command.push(viewBtnOption);
                    command.push(editBtnOption);
                }
                else {
                    command.push(editBtnOption);
                }
            }

            if (!isReadOnly) {
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
        self._signatureColumn = TF.DetailView.UserDefinedGridHelper.getSignatureColumn();
        self._geoColumns = TF.DetailView.UserDefinedGridHelper.getGeoInfoColumns();
        self.initElement(options);

        self.pubSubSubscriptions = [];

        self.isBlockReadOnly.subscribe(val => {
            if (val) {
                self.$el.find(".grid-top-right-button").addClass("disabled");
            } else {
                self.$el.find(".grid-top-right-button").removeClass("disabled");
            }
        });
    }

    UDGridBlock.prototype = Object.create(TF.DetailView.DataBlockComponent.BaseDataBlock.prototype);

    UDGridBlock.prototype.isReadOnly = function () {
        if (this.isBlockReadOnly()) {
            return true;
        }
        if (this.detailView == null) {
            return true;
        }
        if (window.opener && window.name.indexOf("new-detailWindow") >= 0) {
            return true;
        }
        if (tf.isViewfinder) {
            return true;
        }
        //detailview's readonly doesn't affect form(udgrid).
        return this.detailView.obIsReadOnly();
        //return false;
    }

    UDGridBlock.prototype.initElement = function (options) {
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
                    options.ExternalID.trim() != "" ? title + ` ( External ID: ${options.ExternalID.trim()} )` : title
            });

        if (self.isReadOnly()) {
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

    UDGridBlock.prototype.getGridColumnsByType = function () {
        var self = this;
        var fieldNameAndGUID = tf.udgHelper.getGuidToNameMappingOfGridFields(self.options, true);
        var originColumns = [];
        let isSignatureEnabled = tf.udgHelper.isSignatureIncluded(self.options);
        for (var key in fieldNameAndGUID) {
            originColumns.push({
                FieldName: key,
                DisplayName: fieldNameAndGUID[key],
            });
        }
        originColumns.push(...self._updatedInfoColumns);
        originColumns.push(...self._geoColumns);
        if (isSignatureEnabled) {
            originColumns.push(self._signatureColumn);
        }
        if (tf.udgHelper.isDocumentIncluded(self.options)) {
            originColumns.push(self._documentColumn);
        }
        return originColumns.concat(self._getActionColumns(isSignatureEnabled, self.isReadOnly()));
    };

    UDGridBlock.prototype.initEvents = function () {
        var self = this,
            $btn = self.$el.find(".grid-top-right-button");
        $btn.on("click", () => {
            tf.udgHelper.addEditUDFGroupRecordInQuickAddModal(self.options, self.gridType, self.detailView.recordEntity).then((result) => {
                if (!result) return;

                if (self.detailView.isCreateGridNewRecord) {
                    if (!self.detailView.fieldEditorHelper.editFieldList.UDGrids) {
                        self.detailView.fieldEditorHelper.editFieldList.UDGrids = [];
                    }

                    let udGrid = self.options;
                    let editUdGrid = self.detailView.fieldEditorHelper.editFieldList.UDGrids.filter(item => item.ID == udGrid.ID);
                    if (editUdGrid.length == 0) {
                        self.detailView.fieldEditorHelper.editFieldList.UDGrids.push(udGrid);
                    }
                    else {
                        udGrid = editUdGrid[0];
                    }

                    if (!udGrid.UDGridRecordsValues) {
                        udGrid.UDGridRecordsValues = [];
                    }
                    result.Id = udGrid.UDGridRecordsValues.length + 1;// fake ID
                    udGrid.UDGridRecordsValues.push(result);
                    self.obEditing(true);
                    self.detailView.pageLevelViewModel.popupSuccessMessage('Record has been added successfully.');
                }
                else {
                    self.detailView.pageLevelViewModel.popupSuccessMessage('Updates have been saved successfully.');
                }

                if (result.DocumentUDGridRecords) {
                    self.updateDocumentGrid(result.DocumentUDGridRecords.map(document => document.DocumentID), []);
                }

                PubSub.publish("udgrid", {});
            });
        });
    }

    UDGridBlock.prototype.updateDocumentGrid = function (newDocumentIds, removedDocumentIds) {
        removedDocumentIds = removedDocumentIds || [];
        let documentGrids = tf.helpers.detailViewHelper.getAllGridsAndColumns(this.$detailView, "DocumentGrid").grids;
        if (documentGrids.length > 0) {
            let currentDocumentIds = $(documentGrids[0]).data("kendoGrid").dataSource.data().map(document => document.Id),
                documentRelationshipIds = currentDocumentIds.concat(newDocumentIds);
            documentRelationshipIds = documentRelationshipIds.filter(documentId => !removedDocumentIds.includes(documentId));
            documentRelationshipIds = [...new Set(documentRelationshipIds)];
            tf.helpers.detailViewHelper.updateAllGridsDataSourceByIds("document", documentRelationshipIds, documentRelationshipIds.length, this.$detailView);
        }
    };

    UDGridBlock.prototype.afterDomAttached = function () {
        this.initDetailGrid();
        this.initGridActions();
    };

    UDGridBlock.prototype.getGridRelatedData = function () {
        var self = this;
        return tf.udgHelper.getUDGridRecordsOfEntity(self.options, self.options.dataTypeId, self.recordId)
            .then(res => {
                return { Items: res };
            });
    };

    UDGridBlock.prototype.initGridActions = function () {
        var self = this;
        self.kendoGridActions = {
            "UDGrid": {
                delete: function (e, $target) {
                    self.deleteRecord({ target: $target });
                }
            }
        }
    }

    UDGridBlock.prototype.initDetailGrid = function () {
        var self = this,
            isReadMode = self.isReadMode(),
            columns = [];
        if (self.options.columns && self.options.columns.length > 0) {
            var originFieldMapping = tf.udgHelper.getGuidToNameMappingOfGridFields(self.options, true);
            self.options.columns.forEach(col => {
                var dateTimeTemplate = function (item) {
                    let value = item[col];
                    let dt = moment(value);
                    return dt.isValid() ? dt.format("MM/DD/YYYY hh:mm A") : "";
                };

                var dateTimeTemplateLocalZone = function (item) {
                    let value = item[col];
                    let dt = moment(value);
                    if (tf.localTimeZone) {
                        dt.add(tf.localTimeZone.hoursDiff, "hours");
                    }

                    return dt.isValid() ? dt.format("MM/DD/YYYY hh:mm A") : "";
                };

                let isSignatureEnabled = tf.udgHelper.isSignatureIncluded(self.options);
                if (col === "Action") {
                    columns.push(self._getActionColumns(isSignatureEnabled, self.isReadOnly()));
                    return;
                }
                else if (col === "DocumentCount" && tf.udgHelper.isDocumentIncluded(self.options)) {
                    columns.push(self._documentColumn);
                    return;
                }
                else if (col === "signature" && isSignatureEnabled) {
                    columns.push(self._signatureColumn);
                    return;
                }
                else if (col === 'longitude' || col === 'latitude') {
                    let geoColumn = self._geoColumns.find(i => i.FieldName == col);
                    geoColumn.template = function (item) {
                        let value = item[col];
                        return value == null ? '' : Number(value).toFixed(6);
                    };
                    columns.push(geoColumn);
                    return;
                }
                else if (col === "CreatedOn" || col === "LastUpdatedOn") {
                    let updatedColumn = self._updatedInfoColumns.find(i => i.FieldName == col);
                    updatedColumn.template = dateTimeTemplateLocalZone;
                    columns.push(updatedColumn);
                    return;
                }
                else if (col === "CreatedByUserName" || col === "LastUpdatedByUserName") {
                    let updatedColumn = self._updatedInfoColumns.find(i => i.FieldName == col);
                    updatedColumn.template = function (item) {
                        let value = item[col];
                        return value || "";
                    };
                    return columns.push(updatedColumn);
                }
                else if (originFieldMapping[col]) {
                    let udgField = self.options.UDGridFields.find(field => field.Guid == col),
                        column = {
                            FieldName: col,
                            DisplayName: originFieldMapping[col],
                            width: 165,
                            lockWidth: true
                        };

                    switch (udgField.FieldOptions.TypeName) {
                        case "Date/Time":
                            column.template = dateTimeTemplate;
                            column.type = "datetime";
                            break;
                        case "Date":
                            column.template = function (item) {
                                let value = item[col];
                                let date = moment(value);
                                return date.isValid() ? moment(value).format("MM/DD/YYYY") : "";
                            };
                            column.type = "date";
                            break;
                        case "Time":
                            column.template = function (item) {
                                let value = item[col];
                                let time = moment(value);
                                if (time.isValid()) {
                                    return time.format("hh:mm A");
                                }
                                time = moment("1900-1-1 " + value);
                                return time.isValid() ? time.format("hh:mm A") : "";
                            };
                            // column.type = "time";
                            break;
                        case "List":
                            column.template = function (item) {
                                let value = item[col];
                                if (value instanceof Array) {
                                    return value.join(", ");
                                }
                                return isNullObj(value) ? "" : value;
                            };
                            column.type = "list";
                            break;
                        case "Boolean":
                            column.template = function (item) {
                                let value = item[col];
                                if (isNullObj(value)) return '';
                                return value ? udgField.positiveLabel : udgField.negativeLabel || value;
                            };
							/* 
							 * Remove type for boolean since it impact the mini grid Boolean question, Boolean question always show TRUE label,
							 * because method "KendoGridHelper.prototype.getKendoField" covert "string" and "boolean" as "string", if here need type,please change the method
							 * "KendoGridHelper.prototype.getKendoField" as well.
							 */
                            //column.type = "boolean";
                            break;
                        case "Number":
                            column.template = function (item) {
                                let value = item[col];
                                if (value == null || value == "") return "";

                                let precision = udgField.FieldOptions.NumberPrecision;
                                if (isNaN(Number(value))) {
                                    value = 0;
                                }
                                return Number(value).toFixed(_.isNumber(precision) ? precision : 0);

                            };
                            column.type = "number";
                            break;
                        case "Phone Number":
                            column.template = function (item) {
                                let value = item[col];
                                if (isNullObj(value)) return '';
                                return value;
                            };
                            break;
                        case "System Field":
                            {
                                let targetUdfFieldGuid = self.options.UDGridFields.find(x => x.Guid === col).editType.targetField;
                                let targetUdf = self.recordEntity.UserDefinedFields.find(x => x.Guid === targetUdfFieldGuid);
                                if (targetUdf) {
                                    let udfDatasourceIds = targetUdf.UDFDataSources.map(x => x.DBID);
                                    if (udfDatasourceIds.indexOf(tf.datasourceManager.databaseId) < 0) {
                                        self._ignoredColumnNames.push(col);
                                        return;
                                    }
                                } else {
                                    self._ignoredColumnNames.push(col);
                                    return;
                                }
                            }
                            break;
                    }

                    column.headerTemplate = `<span title="${originFieldMapping[col]}" style="overflow: hidden;text-overflow: ellipsis;">${originFieldMapping[col]}</span>`;

                    columns.push(column);
                    return;
                }
            });

        }
        else
            columns = self.getGridColumnsByType();

        self.$el.data("columns", columns);
        var getDataSource = function () {
            if (!isReadMode) {
                return Promise.resolve();
            }

            if (!self.recordId) {
                let udGridId = self.options.ID,
                    udGrids = self.detailView.fieldEditorHelper.editFieldList["UDGrids"],
                    currentEditUDGrid = [],
                    dataSourceItems = [];

                if (udGrids) {
                    currentEditUDGrid = udGrids.filter(udGrid => udGrid.ID == udGridId);
                }

                if (currentEditUDGrid.length > 0) {
                    dataSourceItems = currentEditUDGrid[0].UDGridRecordsValues;
                    dataSourceItems.forEach(item => {
                        if (Array.isArray(item.DocumentUDGridRecords)) {
                            item.DocumentCount = item.DocumentUDGridRecords.length;
                        }
                        else {
                            item.DocumentCount = 0;
                        }
                    });
                }
                self.dataItems = dataSourceItems;
                return Promise.resolve({
                    dataItems: dataSourceItems,
                    totalCount: dataSourceItems.length,
                    pageSize: 50
                });
            }

            return self.getGridRelatedData(self.options, columns.map(function (c) {
                var column = $.extend(true, {}, c);
                column.FieldName = tf.UDFDefinition.getOriginalName(c.FieldName);
                return column;
            })).then(function (result) {
                self.dataItems = result.Items;
                result.Items.sort((x, y) => (x.LastUpdatedOn > y.LastUpdatedOn ? -1 : 1));
                return {
                    dataItems: result.Items,
                    totalCount: result.Items.length,
                    pageSize: 50
                };
            }, function (error) {
                self.$el.find(".custom-grid").addClass("no-permission");
                self.$el.find(".k-grid-content").empty().append("<p>You don't have permission to view data.</p>");
            });
        };

        var defaultGridOptions = {
            dataBound: function () {
                self._bindMiniGridEvent(self.$el.find(".kendo-grid"));
            }
        };
		
		if(!TF.isMobileDevice)
		{
			defaultGridOptions.selectable = "multiple";
		}

        var options = {
            columns: columns,
            dataSource: getDataSource,
            sort: self.options.sort,
            gridOptions: $.extend(defaultGridOptions, {}),
            afterRenderCallback: function (kendoGrid, dataItems) {
                TF.DetailView.DataBlockComponent.UDGridBlock.renderCommandBtn(kendoGrid, dataItems);
            }.bind(self)
        };

        var grid = tf.helpers.kendoGridHelper.createSimpleGrid(self.$el, options);
        self.grid = grid;
        grid.options.totalCountHidden = options.totalCountHidden;

        function refreshGrid() {
            grid.options.afterRenderCallback = function (kendoGrid, dataItems) {
                TF.DetailView.DataBlockComponent.UDGridBlock.renderCommandBtn(kendoGrid, dataItems);
            }.bind(self)
            tf.helpers.kendoGridHelper.setGridDataSource(grid, getDataSource, grid.options);
        }

        self.pubSubSubscriptions.push(PubSub.subscribe("udgrid", () => { refreshGrid() }));
    };

    UDGridBlock.prototype._bindMiniGridEvent = function ($grid) {
        var self = this;
        $grid.off("dblclick").on("dblclick", ".k-grid-content table tr", function (e) {
            self.editClickEvent(e);
        });

    };

    UDGridBlock.prototype.deleteRecord = function (e) {
        tf.promiseBootbox.yesNo("Are you sure you want to delete this record?", "Detele Confirmation").then(res => {
            if (!res) {
                return;
            }

            let $tr = $(e.target).closest("tr"),
                kendoGrid = $tr.closest(".kendo-grid").data("kendoGrid"),
                UDGRecord = kendoGrid.dataItem($tr[0]);
            if (this.detailView.isCreateGridNewRecord) {
                let udGrids = this.detailView.fieldEditorHelper.editFieldList["UDGrids"],
                    currentEditUDGrid = udGrids.filter(udGrid => udGrid.ID == this.options.ID),
                    udGridRecords = currentEditUDGrid[0].UDGridRecordsValues;

                let index = udGridRecords.findIndex(item => item.Id == UDGRecord.Id);
                udGridRecords.splice(index, 1);

                this.detailView.detailViewHelper.removeFromAllGridsDataSourceByIds(this.$detailView, "UDGrid", [UDGRecord.Id]);
                PubSub.publish("udgrid");
                if (UDGRecord.DocumentUDGridRecords && UDGRecord.DocumentUDGridRecords.length > 0) {
                    let relatedDocs = UDGRecord.DocumentUDGridRecords.map(item => item.DocumentID);
                    return tf.helpers.detailViewHelper.removeFromAllGridsDataSourceByIds(this.$detailView, "document", relatedDocs);
                }

                return;
            }

            tf.udgHelper.deleteUDGridRecordOfEntity(UDGRecord.Id).then(result => {
                if (result) {
                    this.detailView.detailViewHelper.removeFromAllGridsDataSourceByIds(this.$detailView, "UDGrid", [UDGRecord.Id]);
                    this.detailView.pageLevelViewModel.popupSuccessMessage('Record has been deleted successfully.');
                    PubSub.publish("udgrid");
                    if (UDGRecord.DocumentUDGridRecords && UDGRecord.DocumentUDGridRecords.length > 0) {
                        let relatedDocs = UDGRecord.DocumentUDGridRecords.map(item => item.DocumentID);
                        tf.udgHelper.tryRemoveBaseRecordDocumentRelationships(this.recordId, this.options.DataTypeId, relatedDocs)
                            .then(result => {
                                return tf.helpers.detailViewHelper.removeFromAllGridsDataSourceByIds(this.$detailView, "document", result);
                            });
                    }
                }
                else tf.promiseBootbox.alert("Delete failed.")
            }).catch(error => {
                tf.promiseBootbox.alert("Delete failed.")
            })
        })
    }

    UDGridBlock.prototype.editClickEvent = function (e) {
        let $tr = $(e.target).closest("tr"),
            kendoGrid = $tr.closest(".kendo-grid").data("kendoGrid"),
            UDGRecord = kendoGrid.dataItem($tr[0]);
        this.isReadOnly() ? this.viewRecord(UDGRecord) : this.editRecord(UDGRecord);
    }

    UDGridBlock.prototype.editMiniGridRecord = function (miniGridType, e, $target) {
        var self = this,
            $tr = $target.closest("tr"),
            kendoGrid = $tr.closest(".kendo-grid").data("kendoGrid"),
            UDGRecord = kendoGrid.dataItem($tr[0]);
        self.editRecord(UDGRecord);
    }

    UDGridBlock.prototype.editRecord = function (UDGRecord) {
        var self = this;

        tf.udgHelper.addEditUDFGroupRecordInQuickAddModal(self.options, self.gridType, self.detailView.recordEntity, UDGRecord).then((result) => {
            if (!result) return;

            if (self.detailView.isCreateGridNewRecord) {
                let udGrid = self.options;
                let editUdGrid = self.detailView.fieldEditorHelper.editFieldList.UDGrids.filter(item => item.ID == udGrid.ID);
                udGrid = editUdGrid[0];
                let editUdGridRecord = udGrid.UDGridRecordsValues.filter(udgr => udgr.Id == UDGRecord.Id)[0];
                $.extend(editUdGridRecord, result);
                self.detailView.pageLevelViewModel.popupSuccessMessage('Record has been updated successfully.');
            }
            else {
                self.detailView.pageLevelViewModel.popupSuccessMessage('Updates have been saved successfully.');
            }

            if (result.DocumentUDGridRecords) {
                this.updateDocumentGrid(result.DocumentUDGridRecords.map(document => document.DocumentID), result.removedDocumentIds);
            }
            PubSub.publish("udgrid", {});
        });
    };

    UDGridBlock.prototype.viewRecord = function (UDGRecord) {
        tf.udgHelper.addEditUDFGroupRecordInQuickAddModal({ ...this.options, isReadOnly: true }, this.gridType, this.detailView.recordEntity, UDGRecord);
    };

    UDGridBlock.prototype.dispose = function (e) {
        var self = this;

        if (self.pubSubSubscriptions) {
            self.pubSubSubscriptions.forEach(function (item) {
                PubSub.unsubscribe(item);
            });

            self.pubSubSubscriptions = [];
        }

        var kendoGrid = self.$el.find(".kendo-grid").data("kendoGrid");
        if (kendoGrid) {
            kendoGrid.destroy();
        }
    };

    UDGridBlock.renderCommandBtn = function (kendoGrid, dataItems) {
        if (!kendoGrid || !dataItems || !dataItems.length) {
            return;
        }

        const $rows = kendoGrid.element.find("tr");
        if ($rows && $rows.length) {
            dataItems.forEach(function (dataItem, idx) {
                if ($rows.length >= idx + 1) {
                    $editBtn = $($rows[idx + 1]).find('.k-button.k-button-icontext.k-grid-edit.is-signature-enabled');
                    $viewBtn = $($rows[idx + 1]).find('.k-button.k-button-icontext.k-grid-view.is-signature-enabled');
                    if (!!dataItem['signature']) {
                        if ($editBtn && $editBtn.length) {
                            $editBtn.hide();
                        }
                    }
                    else {
                        if ($viewBtn && $viewBtn.length) {
                            $viewBtn.hide();
                        }
                    }
                }
            });
        }
    };
})()
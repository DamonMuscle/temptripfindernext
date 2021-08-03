(function () {
    createNamespace("TF.DetailView").UserDefinedGridHelper = UserDefinedGridHelper;

    function UserDefinedGridHelper() {
    }

    UserDefinedGridHelper.prototype.constructor = UserDefinedGridHelper;

    UserDefinedGridHelper.getUpdatedInfoColumns = function () {
        function utc2Local(value) {
            let dt = moment(value);
            let tmpStr = "";
            if (tf.localTimeZone) {
                dt.add(tf.localTimeZone.hoursDiff, "hours");
            }
            tmpStr = dt.isValid() ? dt.format("MM/DD/YYYY hh:mm A") : "";
            return tmpStr;
        }

        return [
            { DisplayName: "Created By", FieldName: "CreatedByUserName", Width: "120px" },
            { DisplayName: "Created On", FieldName: "CreatedOn", Width: "120px", type: "datetime", formatCopyValue: utc2Local },
            { DisplayName: "Last Updated By", FieldName: "LastUpdatedByUserName", Width: "120px" },
            { DisplayName: "Last Updated On", FieldName: "LastUpdatedOn", Width: "150px", type: "datetime", formatCopyValue: utc2Local }
        ];
    };

    UserDefinedGridHelper.getGeoInfoColumns = function () {
        return [
            { DisplayName: "Y Coord", FieldName: "latitude", Width: "100px" },
            { DisplayName: "X Coord", FieldName: "longitude", Width: "100px" }
        ];
    };

    UserDefinedGridHelper.getSignatureColumn = function () {
        return {
            DisplayName: "Signature",
            FieldName: "signature",
            Width: "70px",
            template: function (dataItem) {
                return `<div class='signature-checkbox-container'>
										<input type='checkbox' disabled class='signature-checkbox' ${dataItem && dataItem.signature ? 'checked' : ''}/>
									</div>`;
            },
        };
    };

    UserDefinedGridHelper.handleItemForSaveAs = function (dataItem, columns) {
        dataItem = TF.DetailView.UserDefinedGridHelper.convertSignatureColumnToBoolean(dataItem);
        dataItem = TF.DetailView.UserDefinedGridHelper.handleItemForPhoneType(dataItem, columns);
        return dataItem;
    };

    UserDefinedGridHelper.handleItemForCopy = function (dataItem, columns) {
        dataItem = TF.DetailView.UserDefinedGridHelper.convertSignatureColumnToBoolean(dataItem);
        dataItem = TF.DetailView.UserDefinedGridHelper.handleItemForPhoneType(dataItem, columns);
        return dataItem;
    };

    UserDefinedGridHelper.convertSignatureColumnToBoolean = function (dataItem) {
        if (!dataItem) {
            return dataItem;
        }
        dataItem["signature"] = !!dataItem["signature"];
        return dataItem;
    };

    UserDefinedGridHelper.handleItemForPhoneType = function(dataItem, columns) {
        if(columns && columns.length) {
            columns.forEach(col => {
                if(col.originalUdfField && col.originalUdfField.questionType === 'Phone') {
                    let item = dataItem[col.FieldName];
                    if(item) {
                        item = tf.dataFormatHelper.phoneFormatter(item);
                    }
                    dataItem[col.FieldName] = item;
                 }
             });
         }
         return dataItem;
    };

    UserDefinedGridHelper.formatContent = function (questionContent) {
        if (!questionContent) {
            return questionContent;
        }
        var wrapper = $("<div/>").html(questionContent),
            tables = wrapper.find("table");
        tables.remove();
        return wrapper.text();
    };

    UserDefinedGridHelper.prototype.getAllValidUDGrids = function () {
        return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgrids"),
            {
                paramData: {
                    "@relationships": "UDGridDataSources"
                }
            },
            { overlay: false }
        ).then(resp => {
            if (resp && Array.isArray(resp.Items)) {
                // filter UDGrids current datasource availiable
                resp.Items = _.filter(resp.Items, item => item.UDGridDataSources.some(ds => ds.DBID == tf.datasourceManager.databaseId));
                // resp.Items.forEach(item =>
                // {
                // 	item.UDGridFields = this._updateUserDefinedGridFields(item.UDGridFields);
                // });,
                let isAdmin = tf.authManager.authorizationInfo.isAdmin,
                    forms = tf.authManager.authorizationInfo.authorizationTree.forms;

                if (!isAdmin) {
                    resp.Items = resp.Items.filter(function (item) {
                        return forms.indexOf(item.ID) > -1;
                    });
                }

                return resp.Items;
            }

            return [];
        })
    };

    UserDefinedGridHelper.prototype.getUDGridsByDataTypeId = function (dataTypeId) {
        return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgrids"),
            {
                paramData: {
                    "DataTypeId": dataTypeId,
                    "@relationships": "UDGridFields,UDGridDataSources"
                }
            },
            { overlay: false }
        ).then(resp => {
            if (resp && Array.isArray(resp.Items)) {
                // filter UDGrids current datasource availiable
                resp.Items = _.filter(resp.Items, item => item.UDGridDataSources.some(ds => ds.DBID == tf.datasourceManager.databaseId));
                resp.Items.forEach(item => {
                    item.UDGridFields = this._updateUserDefinedGridFields(item.UDGridFields);
                });

                return resp.Items;
            }

            return [];
        })
    };

    UserDefinedGridHelper.prototype.getUDGridById = function (id) {
        return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgrids"),
            {
                paramData: {
                    "Id": id,
                    "@relationships": "UDGridFields,UDGridDataSources"
                }
            },
            { overlay: false }
        ).then(resp => {
            if (resp && Array.isArray(resp.Items)) {
                // filter UDGrids current datasource availiable
                resp.Items = _.filter(resp.Items, item => item.UDGridDataSources.some(ds => ds.DBID == tf.datasourceManager.databaseId));
                resp.Items.forEach(item => {
                    item.UDGridFields = this._updateUserDefinedGridFields(item.UDGridFields);
                });

                return resp.Items;
            }

            return [];
        })
    };

    UserDefinedGridHelper.prototype.getUDGridColumns = function (res) {
        let columns = [];
        let sortFields = res[0].UDGridFields.sort(function (a, b) {
            return a.Index - b.Index;
        });
        sortFields.forEach(col => {
            if (col.type === 'SystemField') return;
            column = {
                FieldName: col.Guid,
                //DisplayName: originFieldMapping[col],
                DisplayName: TF.DetailView.UserDefinedGridHelper.formatContent(col.title),
                Width: '150px',
                Index: col.Index,
                type: 'string'
            };
            switch (col.type) {
                case "Date/Time":
                    column.type = "datetime",
                        column.template = function (item) {
                            let value = item[col.Guid];
                            if (value === "") {
                                return "";
                            }
                            let dt = moment(value);
                            return dt.isValid() ? dt.format("MM/DD/YYYY hh:mm A") : "";
                        };
                    break;
                case "Date":
                    column.type = "date",
                        column.template = function (item) {
                            let value = item[col.Guid];
                            if (value === "") {
                                return "";
                            }
                            let date = moment(value);
                            return date.isValid() ? moment(value).format("MM/DD/YYYY") : "";
                        };
                    break;
                case "Time":
                    column.type = "time",
                        column.template = function (item) {
                            let value = item[col.Guid];
                            if (value === "") {
                                return "";
                            }
                            let time = moment(value);
                            if (time.isValid()) {
                                return time.format("hh:mm A");
                            }
                            time = moment("1900-1-1 " + value);
                            return time.isValid() ? time.format("hh:mm A") : "";
                        };
                    break;
                case "List":
                    column.template = function (item) {
                        let value = item[col.Guid];
                        if (value instanceof Array) {
                            return value.join(", ");
                        }
                        return isNullObj(value) ? "" : value;
                    };
                    break;
                case "Boolean":
                    column.type = "boolean",
                        column.template = function (item) {
                            let value = item[col.Guid];
                            if (isNullObj(value)) return '';
                            return value == 'true' ? col.positiveLabel : col.negativeLabel || value;
                        };
                    break;
                case "Number":
                    column.type = "number",
                        column.template = function (item) {
                            let value = item[col.Guid];
                            if (value == null || value == "") return "";

                            let precision = col.FieldOptions.NumberPrecision;
                            if (isNaN(Number(value))) {
                                value = 0;
                            }
                            return Number(value).toFixed(_.isNumber(precision) ? precision : 0);

                        };
                    break;
                case "Phone Number":
                    column.template = function (item) {
                        let value = item[col.Guid];
                        if (isNullObj(value)) return '';
                        return value;
                    };
                    break;
            }

            if (col.questionType === "List") {
                let pickUpList = [];
                col.FieldOptions.UDFPickListOptions.forEach(plo => {
                    pickUpList.push(plo.PickList);
                });
                column.ListFilterTemplate = {
                    listFilterType: 'Enum',
                    sortType: 'byAllItems',
                    AllItems: pickUpList,
                    leftGridWithSearch: true,
                    EnumListFilterColumnName: "Display Name",
                    DisplayFilterTypeName: "Options"
                }
            }
            columns.push(column);
        });

        return columns;
    };

    UserDefinedGridHelper.prototype.getUDGridsByDataType = function (dataType) {
        let dataTypeId = tf.dataTypeHelper.getId(dataType);
        return this.getUDGridsByDataTypeId(dataTypeId);
    };

    UserDefinedGridHelper.prototype.getNameToGuidMappingOfGridFields = function (udGrid) {
        let gridFields = Array.isArray(udGrid.UDGridFields) ? _.sortBy(udGrid.UDGridFields, 'Index') : [],
            nameToGuidDict = {};

        gridFields.forEach(gf => {
            nameToGuidDict[gf.Name] = gf.Guid;
        });
        return nameToGuidDict;
    };

    UserDefinedGridHelper.prototype.getGuidToNameMappingOfGridFields = function (udGrid, excludeSystemField) {
        let gridFields = Array.isArray(udGrid.UDGridFields) ? _.sortBy(udGrid.UDGridFields, 'Index') : [],
            guidToNameDict = {};

        gridFields.forEach(gf => {
            if (excludeSystemField && gf.type === 'SystemField') {
                return;
            }
            var formatedUDGridFields = TF.DetailView.UserDefinedGridHelper.formatContent(gf.Name);
            guidToNameDict[gf.Guid] = formatedUDGridFields;
        });
        return guidToNameDict;
    };

    UserDefinedGridHelper.prototype.isDocumentIncluded = function (udGrid) {
        if (udGrid.GridOptions) {
            try {
                let gridOption = JSON.parse(udGrid.GridOptions);
                return gridOption.IsEnableDocument;
            } catch (error) {
                return false;
            }
        }
        return false;
    };

    UserDefinedGridHelper.prototype.isSignatureIncluded = function (udGrid) {
        if (udGrid.GridOptions) {
            try {
                let gridOption = JSON.parse(udGrid.GridOptions);
                return gridOption.IsSignatureRequired;
            }
            catch (error) {
                return false;
            }
        }
        return false;
    };

    UserDefinedGridHelper.prototype.updateAssociateDocuments = function (entityId, dataTypId, documentIds) {
        return tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "DocumentUDGridRecords"),
            {
                paramData: {
                    dbid: tf.datasourceManager.databaseId,
                    dataTypeId: dataTypId,
                    recordId: entityId,
                },
                data: documentIds
            })
    }

    UserDefinedGridHelper.prototype.getAffectedDocumentUDGridCount = function (entityId, dataTypeId, documentIds) {
        return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "DocumentUDGridRecords"),
            {
                paramData: {
                    dbid: tf.datasourceManager.databaseId,
                    dataTypeId: dataTypeId,
                    recordId: entityId,
                    documentIds: documentIds
                }
            })
            .then(res => {
                return _.groupBy(res.Items, "DocumentID");
            })
            .catch(err => {
                return null;
            })
    }

    UserDefinedGridHelper.prototype.getUDGridRecordsOfEntity = function (udGrid, dataTypeId, entityId) {
        let self = this,
            udGridId = udGrid.ID,
            documentEnabled = self.isDocumentIncluded(udGrid),
            signatureEnabled = self.isSignatureIncluded(udGrid),
            guidToNameDict = self.getGuidToNameMappingOfGridFields(udGrid);

        let relationships = "User";
        if (documentEnabled) {
            relationships += ",DocumentUDGridRecords";
        }
        return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgridrecords"),
            {
                paramData: {
                    DBID: tf.datasourceManager.databaseId,
                    RecordDataType: dataTypeId,
                    RecordID: entityId,
                    UDGridID: udGridId,
                    "@relationships": relationships
                }
            },
            { overlay: false }
        ).then(resp => {
            if (resp && Array.isArray(resp.Items)) {
                return resp.Items;
            }

            return [];
        }).then(rawRecords => {
            return rawRecords.map(rr => {
                return self.getFormRecord(guidToNameDict, signatureEnabled, documentEnabled, rr);
            });
        });
    };

    UserDefinedGridHelper.prototype.getFormRecord = function (formQuestionGuidToNameDict, signatureEnabled, documentEnabled, rawFormRecord) {
        let convertedRecord = null;
        if (!!rawFormRecord && !!rawFormRecord.RecordValue) {
            let recordValueObj = JSON.parse(rawFormRecord.RecordValue);
            convertedRecord = {};
            convertedRecord.Id = rawFormRecord.ID;
            for (let fguid in formQuestionGuidToNameDict) {
                if (fguid in recordValueObj) {
                    convertedRecord[fguid] = recordValueObj[fguid];
                }
                else {
                    convertedRecord[fguid] = null;
                }
            }
            if (signatureEnabled) {
                convertedRecord["signature"] = recordValueObj["signature"];
            }
            if (recordValueObj["latitude"] && recordValueObj["longitude"]) {
                convertedRecord["latitude"] = recordValueObj["latitude"];
                convertedRecord["longitude"] = recordValueObj["longitude"];
            }
        }

        //Created By / Last Updated By / Last Updated On
        TF.DetailView.UserDefinedGridHelper.getUpdatedInfoColumns().forEach(c => {
            convertedRecord[c.FieldName] = rawFormRecord[c.FieldName] || "";
        });

        if (documentEnabled) {
            convertedRecord["DocumentCount"] = rawFormRecord.DocumentUDGridRecords ? rawFormRecord.DocumentUDGridRecords.length : 0;
            convertedRecord["DocumentUDGridRecords"] = rawFormRecord.DocumentUDGridRecords || [];
        }
        return convertedRecord;
    };

    UserDefinedGridHelper.prototype.addUDGridRecordOfEntity = function (udGrid, dataTypeId, entityId, record) {
        let self = this,
            udGridId = udGrid.ID,
            signatureEnabled = self.isSignatureIncluded(udGrid),
            guidToNameDict = self.getGuidToNameMappingOfGridFields(udGrid),
            rawRecord = {
                DBID: tf.datasourceManager.databaseId,
                RecordDataType: dataTypeId,
                RecordID: entityId,
                UDGridID: udGridId,
                RecordValue: null
            },
            recordValueObj = {};

        if (!!record) {
            for (let fguid in guidToNameDict) {
                if (fguid in record) {
                    recordValueObj[fguid] = record[fguid];
                }
            }
            if (signatureEnabled) {
                recordValueObj["signature"] = record["signature"];
            }
            recordValueObj["latitude"] = record["latitude"];
            recordValueObj["longitude"] = record["longitude"];
        }

        rawRecord.RecordValue = JSON.stringify(recordValueObj);
        let paramData = {};
        if (record.DocumentUDGridRecords) {
            rawRecord.DocumentUDGridRecords = record.DocumentUDGridRecords;
            paramData["@relationships"] = "DocumentUDGridRecords";
        }
        return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgridrecords"),
            {
                paramData: paramData,
                data: [rawRecord]
            }, { overlay: false }
        ).then(resp => {
            let addedRawRecord = resp.Items[0];
            record.Id = addedRawRecord.ID;
            return record;
        });
    };

    UserDefinedGridHelper.prototype.uploadAttachments = function (attachements) {
        return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "documents"),
            {
                paramData: { "@relationships": "DocumentRelationship" },
                data: attachements
            }, { overlay: false }
        ).then(res => {
            return Promise.resolve(res.Items);
        })
    };

    UserDefinedGridHelper.prototype.updateUDGridRecordOfEntity = function (udGrid, record) {
        let self = this,
            signatureEnabled = self.isSignatureIncluded(udGrid),
            guidToNameDict = self.getGuidToNameMappingOfGridFields(udGrid),
            patchItem = {
                Op: "replace",
                Path: "RecordValue",
                Value: null
            },
            recordValueObj = {};

        if (!record || !record.Id) {
            return Promise.resolve(null)
        }

        for (let fguid in guidToNameDict) {
            if (fguid in record) {
                recordValueObj[fguid] = record[fguid];
            }
        }
        if (signatureEnabled) {
            recordValueObj["signature"] = record["signature"];
        }
        recordValueObj["latitude"] = record["latitude"];
        recordValueObj["longitude"] = record["longitude"];
        patchItem.Value = JSON.stringify(recordValueObj);
        let patchData = [patchItem], paramData = { "@filter": `eq(ID,${record.Id})` };
        if (record.DocumentUDGridRecords) {
            patchData.push({
                Id: record.Id,
                op: "relationship",
                path: "/DocumentUDGridRecords",
                value: JSON.stringify(record.DocumentUDGridRecords),
            });
            paramData["@relationships"] = "DocumentUDGridRecords";
        }

        return tf.promiseAjax.patch(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgridrecords"),
            {
                paramData: paramData,
                data: patchData
            }, { overlay: false }
        ).then(resp => {
            return record;
        });
    };

    UserDefinedGridHelper.prototype.deleteUDGridRecordOfEntity = function (recordId) {
        return tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgridrecords"),
            {
                paramData: {
                    "@filter": `eq(ID,${recordId})`
                }
            }, { overlay: false }
        ).then(resp => {
            return resp;
        });
    };

    UserDefinedGridHelper.prototype._updateUserDefinedGridFields = function (items) {
        if (items.length === 0) return [];

        var today = (new Date()).toDateString(), self = this;

        return items.map(function (item) {
            var editType,
                result,
                fieldOptions = typeof item.FieldOptions === "string" ? JSON.parse(item.FieldOptions) : item.FieldOptions,
                type = item.TypeName || item.FieldOptions.TypeName || item.FieldOptions.Type;

            switch (type) {
                case 'Text':
                    editType = {
                        "format": "String",
                        "maxLength": fieldOptions.MaxLength || 255
                    };
                    result = {
                        "field": item.Name,
                        "title": item.Name,
                        "type": "String",
                        "defaultValue": "User Defined Text",
                        "editType": editType,
                        "questionType": type
                    };
                    break;
                case 'Memo':
                    editType = {
                        "format": "Note",
                        "maxLength": fieldOptions.MaxLength || 2000
                    };
                    result = {
                        "field": item.Name,
                        "title": item.Name,
                        "type": "String",
                        "defaultValue": "Lorem ipsum dolor sit amet.",
                        "editType": editType,
                        "questionType": type
                    };
                    break;
                case 'Number':
                    var precision = fieldOptions.NumberPrecision,
                        nullPrecision = (precision === 0 || precision === null);
                    editType = {
                        "format": "Number",
                        "maxLength": 10 + (nullPrecision ? 0 : (1 + precision)),
                        "maxValue": 9999999999 + (nullPrecision ? 0 : (1 - (Math.pow(10, -1 * precision))))
                    };
                    result = {
                        "field": item.Name,
                        "title": item.Name,
                        "type": "Number",
                        "defaultValue": "3.14",
                        "editType": editType,
                        "questionType": type
                    };
                    if (precision != null) {
                        var format = 0;
                        format = format.toFixed(parseInt(precision)).toString();
                        result["format"] = format;
                    }
                    break;
                case 'Currency':
                    var precision = fieldOptions.NumberPrecision,
                        nullPrecision = (precision === 0 || precision === null);
                    editType = {
                        "format": "Number",
                        "maxIntegerLength": fieldOptions.MaxLength || 10,
                        "maxDecimalLength": 2
                    };
                    result = {
                        "field": item.Name,
                        "title": item.Name,
                        "type": "Currency",
                        "editType": editType,
                        "questionType": type
                    };
                    break;
                case 'Phone Number':
                    editType = {
                        "format": "Phone"
                    };
                    result = {
                        "field": item.Name,
                        "title": item.Name,
                        "type": "String",
                        "format": "Phone",
                        "defaultValue": "(987) 654-3210",
                        "editType": editType,
                        "questionType": "Phone"
                    };
                    break;
                case 'Zip Code':
                    editType = {
                        "format": "Number",
                        "maxLength": 5
                    };
                    result = {
                        "field": item.Name,
                        "title": item.Name,
                        "type": "Number",
                        "defaultValue": "12345",
                        "editType": editType,
                        "questionType": "ZipCode"
                    };
                    break;
                case 'Date':
                    editType = {
                        "format": "Date"
                    };
                    result = {
                        "field": item.Name,
                        "title": item.Name,
                        "type": "Date",
                        "defaultValue": today,
                        "editType": editType,
                        "questionType": type
                    };
                    break;
                case 'Date/Time':
                    editType = {
                        "format": "DateTime"
                    };
                    result = {
                        "field": item.Name,
                        "title": item.Name,
                        "type": "Date/Time",
                        "defaultValue": today,
                        "editType": editType,
                        "questionType": "DateTime"
                    };
                    break;
                case 'Time':
                    editType = {
                        "format": "Time"
                    };
                    result = {
                        "field": item.Name,
                        "title": item.Name,
                        "type": "Time",
                        "defaultValue": '12:00',
                        "editType": editType,
                        "questionType": type
                    };
                    break;
                case 'Boolean':
                    editType = {
                        "format": "BooleanDropDown"
                    };
                    result = {
                        "field": item.Name,
                        "title": item.Name,
                        "type": "Boolean",
                        "defaultValue": "False",
                        "displayValue": "User Defined Boolean",
                        "positiveLabel": fieldOptions.TrueDisplayName || "True",
                        "negativeLabel": fieldOptions.FalseDisplayName || "False",
                        "editType": editType,
                        "questionType": type
                    };
                    break;
                case 'List':
                    var defaultItems = fieldOptions.UDFPickListOptions.filter(function (item) {
                        return item.IsDefaultItem;
                    }).map(function (item) {
                        return item.PickList;
                    }),
                        getSource = function () {
                            return fieldOptions.UDFPickListOptions.map(function (item) {
                                return item.PickList;
                            });
                        };

                    result = {
                        "field": item.Name,
                        "title": item.Name,
                        "type": "String",
                        "defaultValue": "List Item 1, List Item 2, List Item 3",
                        "editType": fieldOptions.PickListMultiSelect ?
                            {
                                "format": "ListMover",
                                "getSource": function () {
                                    return Promise.resolve(getSource());
                                },
                                "allowNullValue": true,
                                "entityKey": ""
                            } : {
                                "format": "DropDown",
                                "getSource": function () { return Promise.resolve(getSource()); },
                                "allowNullValue": true,
                                "entityKey": ""
                            },
                        "questionType": type
                    };
                    break;
                case 'Rating Scale':
                    var ratingItems = Array.from({ length: fieldOptions.Scale }, (_, i) => i + 1);
                    var defaultItems = ratingItems.filter(function (item) {
                        return 1;
                    });
                    var getSource = function () {
                        return ratingItems;
                    };
                    result = {
                        "field": item.Name,
                        "title": item.Name,
                        "type": "String",
                        "defaultValue": "Rating Value",
                        "startScale": defaultItems[0],
                        "editType": {
                            "format": "DropDown",
                            "getSource": function () { return Promise.resolve(getSource()); },
                            "allowNullValue": true,
                            "entityKey": ""
                        },
                        "questionType": "Rating"
                    };
                    break;
                case 'System Field':
                    result = {
                        "field": item.Name,
                        "title": item.Name,
                        "type": "SystemField",
                        "questionType": "SystemField",
                        "editType": {
                            "targetField": fieldOptions.DefaultText
                        }
                    };
                    break;
                default:
                    break;
            }

            if (result) {
                result.UDGridFieldId = item.ID;
                result.UDGridID = item.UDGridID;
                result.editType["TypeId"] = item.Type;
                result.Index = item.Index;
                result.Guid = item.Guid;
                result.Name = item.Name;
                result.FieldOptions = fieldOptions;
                result.Required = item.Required;
                result.OriginItem = item;
            }

            return result;
        });
    };

    UserDefinedGridHelper.prototype.updateDataPoint = function (gridType, udGrids) {
        dataPointsJSON[gridType]["User Defined Group"] = udGrids.map(item => {
            return _.extend(item, {
                "field": "UDGridId",
                "title": item.Name,
                "UDGridId": item.ID,
                "type": "UDGrid",
                "defaultValue": "User Defined Group",
                "min-height": 3,
                "min-width": 2
            })
        })
    };

    UserDefinedGridHelper.prototype.generateQuickAddLayout = function (udGridId, gridType, dataPoint) {
        let udGridDataPoint = dataPointsJSON[gridType]["User Defined Group"].find(udGrid => udGrid.ID == udGridId);
        if (!udGridDataPoint) {
            udGridDataPoint = dataPoint
        }

        let layout = {
            width: 1,
            items: [],
            sliderFontRate: 0.5,
            version: "1.0.0"
        }, sortedFields = [...Array.sortBy(udGridDataPoint.UDGridFields, "Index")],
            gridOptions = udGridDataPoint.GridOptions == null ? {} : JSON.parse(udGridDataPoint.GridOptions);

        if (gridOptions.IsEnableDocument && gridOptions.DocumentFieldIndex >= 0) {
            sortedFields.splice(gridOptions.DocumentFieldIndex, 0, "document");
        }

        let positionY = 0, layoutItem = null;
        for (let i = 0; i < sortedFields.length; i++) {
            let field = sortedFields[i];
            if (field == "document") {
                layoutItem = {
                    x: 0,
                    y: positionY,
                    w: 1,
                    h: 4,
                    type: "grid",
                    field: "DocumentGrid",
                    UDGridID: udGridDataPoint.ID,
                    getDataSource: () => {
                        return [];
                    },
                };
            }
            else {
                layoutItem = {
                    x: 0,
                    y: positionY,
                    w: 1,
                    h: 1,
                    type: field.type,
                    UDGridFieldId: field.UDGridFieldId,
                    UDGridID: field.UDGridID,
                };
            }

            positionY += layoutItem.h;
            layout.items.push(layoutItem);
        }

        return layout;
    };

    UserDefinedGridHelper.prototype.addEditUDFGroupRecordInQuickAddModal = function (udGrid, gridType, baseRecordEntity, udgRecord, dataPoint) {
        let layout = tf.udgHelper.generateQuickAddLayout(udGrid.ID, gridType, dataPoint);
        let options = {
            dataType: gridType,
            recordEntity: udgRecord,
            baseRecordEntity: baseRecordEntity,
            udGrid: udGrid,
            layoutEntity: { Layout: JSON.stringify(layout) },
            isUDFGroup: true,
            isReadOnly: udGrid.isReadOnly
        };

        const modalVm = new TF.DetailView.BasicQuickAddModalViewModel(options);
        modalVm.title(null);
        return tf.modalManager.showModal(modalVm);
    };

    UserDefinedGridHelper.prototype.getDataPointByIdentifierAndGrid = function (udGridFieldId, udGridId, gridType) {
        let udGridDataPoint = dataPointsJSON[gridType]["User Defined Group"].filter(udGrid => udGrid.ID == udGridId)[0];
        let udGridFieldDataPoint = udGridDataPoint.UDGridFields.filter(udGridField => udGridField.UDGridFieldId == udGridFieldId);

        return $.extend(true, {}, udGridFieldDataPoint[0]);
    };

    UserDefinedGridHelper.prototype.getDataPointByUDGridId = function (udGridId, gridType) {
        let udGridDataPoint = dataPointsJSON[gridType]["User Defined Group"].filter(udGrid => udGrid.ID == udGridId)[0];
        return udGridDataPoint;
    };

    UserDefinedGridHelper.prototype.getDocumentGridRecords = function (columnFields, documentIds) {
        var excludeFields = ['FileContent'];

        return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", "documents"), {
            data: {
                fields: columnFields.filter(function (name) {
                    return excludeFields.indexOf(name) === -1;
                }),
                filterClause: "",
                filterSet: null,
                idFilter: {
                    IncludeOnly: documentIds,
                    ExcludeAny: []
                },
                sortItems: [{
                    Name: "Id",
                    isAscending: "asc",
                    Direction: "Ascending"
                }]
            }
        });
    };

    UserDefinedGridHelper.prototype.tryRemoveBaseRecordDocumentRelationships = function (baseRecordId, dataTypeId, documentIds) {
        return tf.udgHelper.getAffectedDocumentUDGridCount(baseRecordId, dataTypeId, documentIds.join())
            .then(res => {
                if (!res) {
                    return;
                }

                let nonExsitedDocs = documentIds.filter(d => !res[d]);
                if (nonExsitedDocs && nonExsitedDocs.length > 0) {
                    let msg = nonExsitedDocs.length == 1 ?
                        `The last association between UDF groups and document has been removed. Do you want to disassociate the document from current ${self.gridType} record? ` :
                        `The last associations between UDF groups and documents have been removed. Do you want to disassociate these documents from current ${self.gridType} record? `;
                    return tf.promiseBootbox.yesNo(msg, "Confirmation Message")
                        .then(ch => {
                            if (!ch) {
                                return;
                            }

                            return Promise.all(nonExsitedDocs.map(item => {
                                return tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "documentRelationships"), {
                                    paramData: {
                                        DBID: tf.datasourceManager.databaseId,
                                        DocumentID: item,
                                        AttachedToID: baseRecordId,
                                        AttachedToType: dataTypeId
                                    }
                                });
                            })).then(() => {
                                return nonExsitedDocs;
                            });
                        })
                }
            })
    };

    UserDefinedGridHelper.prototype.bindCounterBoxEvent = function ($inputEl, maxlength, $counterEl, preventEnterKey, getLength) {
        $inputEl.keyup(ev => {
            if (TF.isMobileDevice || isIpad()) {
                ev.target.style.height = 'auto';
                ev.target.style.height = ev.target.scrollHeight + 'px';
            }
        }).on('keyup focusin cut paste', ev => {
            if (typeof getLength === "function") {
                $counterEl.html(`${getLength(ev.target)}/${maxlength}`);
            }
            else {
                $counterEl.html(`${ev.target.value.length}/${maxlength}`);
            }
        }).focus(ev => {
            if (typeof getLength === "function") {
                $counterEl.html(`${getLength(ev.target)}/${maxlength}`);
            }
            else {
                $counterEl.html(`${ev.target.value.length}/${maxlength}`);
            }
            $counterEl.show();
        }).blur(() => {
            $counterEl.hide();
        }).keypress(ev => {
            if (ev.keyCode == 13 && !!preventEnterKey) {
                ev.preventDefault();
            }
        });
    }

    UserDefinedGridHelper.saveUserdefinedfield = function (udfEntity) {
        return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgrids"), {
            paramData: { "@Relationships": "UDGridFields" },
            data: [udfEntity]
        });
    }

    UserDefinedGridHelper.removeIdentityInfo = function (udfEntity) {
        resetFields(udfEntity, ["ID", "Id", "Guid"]);

        if (udfEntity.UDGridDataSources && udfEntity.UDGridDataSources.length) {
            udfEntity.UDGridDataSources.forEach(udgridDataSource => {
                resetFields(udgridDataSource, ["UDGridID", "UDGrid", "ID"]);
            });
        }

        if (udfEntity.UDGridFields && udfEntity.UDGridFields.length) {
            udfEntity.UDGridFields.forEach(udgridField => {
                resetFields(udgridField, ["UDGridID", "UDGrid", "Guid", "ID"]);
            });
        }

        function resetFields(entity, toResetFields) {
            let fields = Object.keys(entity);
            fields.forEach((f) => {
                if (toResetFields.includes(f)) {
                    entity[f] = null;
                    delete entity[f];
                };
            });
        }
    }

    tf.udgHelper = new TF.DetailView.UserDefinedGridHelper();
})();
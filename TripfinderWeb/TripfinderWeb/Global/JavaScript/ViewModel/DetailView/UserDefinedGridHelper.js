(function()
{
	createNamespace("TF.DetailView").UserDefinedGridHelper = UserDefinedGridHelper;

	function UserDefinedGridHelper()
	{
	};

	UserDefinedGridHelper.prototype.constructor = UserDefinedGridHelper;

	UserDefinedGridHelper.prototype.getUDGridsByDataTypeId = function(dataTypeId)
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgrids"),
			{
				paramData: {
					"DataTypeId": dataTypeId,
					"@relationships": "UDGridFields,UDGridDataSources"
				}
			},
			{ overlay: false }
		).then(resp =>
		{
			if (resp && Array.isArray(resp.Items))
			{
				// filter UDGrids current datasource availiable
				resp.Items = _.filter(resp.Items, item => item.UDGridDataSources.some(ds => ds.DBID == tf.datasourceManager.databaseId));
				resp.Items.forEach(item =>
				{
					item.UDGridFields = this._updateUserDefinedGridFields(item.UDGridFields);
				});

				return resp.Items;
			}

			return [];
		})
	};

	UserDefinedGridHelper.prototype.getUDGridsByDataType = function(dataType)
	{
		let dataTypeId = tf.dataTypeHelper.getId(dataType);
		return this.getUDGridsByDataTypeId(dataTypeId);
	};

	UserDefinedGridHelper.prototype.getNameToGuidMappingOfGridFields = function(udGrid)
	{
		let gridFields = Array.isArray(udGrid.UDGridFields) ? _.sortBy(udGrid.UDGridFields, 'Index') : [],
			nameToGuidDict = {};

		gridFields.forEach(gf =>
		{
			nameToGuidDict[gf.Name] = gf.Guid;
		});

		return nameToGuidDict;
	};

	UserDefinedGridHelper.prototype.getGuidToNameMappingOfGridFields = function(udGrid)
	{
		let gridFields = Array.isArray(udGrid.UDGridFields) ? _.sortBy(udGrid.UDGridFields, 'Index') : [],
			guidToNameDict = {};

		gridFields.forEach(gf =>
		{
			guidToNameDict[gf.Guid] = gf.Name;
		});

		return guidToNameDict;
	};

	UserDefinedGridHelper.prototype.isDocumentIncluded = function(udGrid)
	{
		if (udGrid.GridOptions)
		{
			try
			{
				let gridOption = JSON.parse(udGrid.GridOptions);
				return gridOption.IsEnableDocument;
			} catch (error)
			{
				return false;
			}
		}
		return false;
	}

	UserDefinedGridHelper.prototype.updateAssociateDocuments = function(entityId, dataTypId, documentIds)
	{
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

	UserDefinedGridHelper.prototype.getAffectedDocumentUDGridCount = function(entityId, dataTypeId, documentIds)
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "DocumentUDGridRecords"),
			{
				paramData: {
					dbid: tf.datasourceManager.databaseId,
					dataTypeId: dataTypeId,
					recordId: entityId,
					documentIds: documentIds
				}
			})
			.then(res =>
			{
				return _.groupBy(res.Items, "DocumentID");
			})
			.catch(err =>
			{
				return null;
			})
	}

	UserDefinedGridHelper.prototype.getUDGridRecordsOfEntity = function(udGrid, dataTypeId, entityId)
	{
		let self = this,
			udGridId = udGrid.ID,
			documentEnabled = self.isDocumentIncluded(udGrid),
			guidToNameDict = self.getGuidToNameMappingOfGridFields(udGrid);

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgridrecords"),
			{
				paramData: {
					DBID: tf.datasourceManager.databaseId,
					RecordDataType: dataTypeId,
					RecordID: entityId,
					UDGridID: udGridId,
					"@relationships": documentEnabled ? "DocumentUDGridRecords" : ""
				}
			},
			{ overlay: false }
		).then(resp =>
		{
			if (resp && Array.isArray(resp.Items))
			{
				return resp.Items;
			}

			return [];
		}).then(rawRecords =>
		{
			return rawRecords.map(rr =>
			{
				let convertedRecord = null;
				if (!!rr && !!rr.RecordValue)
				{
					let recordValueObj = JSON.parse(rr.RecordValue);
					convertedRecord = {};
					convertedRecord.Id = rr.ID;
					for (let fguid in guidToNameDict)
					{
						if (fguid in recordValueObj)
						{
							convertedRecord[fguid] = recordValueObj[fguid];
						}
						else
						{
							convertedRecord[fguid] = null;
						}
					}
				}
				if (documentEnabled)
				{
					convertedRecord["DocumentCount"] = rr.DocumentUDGridRecords ? rr.DocumentUDGridRecords.length : 0;
					convertedRecord["DocumentUDGridRecords"] = rr.DocumentUDGridRecords || [];
				}
				return convertedRecord;
			});
		});
	};

	UserDefinedGridHelper.prototype.addUDGridRecordOfEntity = function(udGrid, dataTypeId, entityId, record)
	{
		let self = this,
			udGridId = udGrid.ID,
			guidToNameDict = self.getGuidToNameMappingOfGridFields(udGrid),
			rawRecord = {
				DBID: tf.datasourceManager.databaseId,
				RecordDataType: dataTypeId,
				RecordID: entityId,
				UDGridID: udGridId,
				RecordValue: null
			},
			recordValueObj = {};

		if (!!record)
		{
			for (let fguid in guidToNameDict)
			{
				if (fguid in record)
				{
					recordValueObj[fguid] = record[fguid];
				}
			}
		}

		rawRecord.RecordValue = JSON.stringify(recordValueObj);
		let paramData = {};
		if (record.DocumentUDGridRecords)
		{
			rawRecord.DocumentUDGridRecords = record.DocumentUDGridRecords;
			paramData["@relationships"] = "DocumentUDGridRecords";
		}
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgridrecords"),
			{
				paramData: paramData,
				data: [rawRecord]
			}, { overlay: false }
		).then(resp =>
		{
			let addedRawRecord = resp.Items[0];
			record.Id = addedRawRecord.ID;
			return record;
		});
	};

	UserDefinedGridHelper.prototype.updateUDGridRecordOfEntity = function(udGrid, record)
	{
		let self = this,
			guidToNameDict = self.getGuidToNameMappingOfGridFields(udGrid),
			patchItem = {
				Op: "replace",
				Path: "RecordValue",
				Value: null
			},
			recordValueObj = {};

		if (!record || !record.Id)
		{
			return Promise.resolve(null)
		}

		for (let fguid in guidToNameDict)
		{
			if (fguid in record)
			{
				recordValueObj[fguid] = record[fguid];
			}
		}

		patchItem.Value = JSON.stringify(recordValueObj);
		let patchData = [patchItem], paramData = { "@filter": `eq(ID,${ record.Id })` };
		if (record.DocumentUDGridRecords)
		{
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
		).then(resp =>
		{
			return record;
		});
	};

	UserDefinedGridHelper.prototype.deleteUDGridRecordOfEntity = function(recordId)
	{
		return tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgridrecords"),
			{
				paramData: {
					"@filter": `eq(ID,${ recordId })`
				}
			}, { overlay: false }
		).then(resp =>
		{
			return resp;
		});
	};

	UserDefinedGridHelper.prototype._updateUserDefinedGridFields = function(items)
	{
		if (items.length === 0) return [];

		var today = (new Date()).toDateString(), self = this;

		return items.map(function(item)
		{
			var editType,
				result,
				fieldOptions = JSON.parse(item.FieldOptions),
				type = item.TypeName;

			switch (type)
			{
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
						"value": fieldOptions.DefaultText,
						"editType": editType
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
						"value": fieldOptions.DefaultMemo,
						"editType": editType
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
						"value": fieldOptions.DefaultNumeric,
						"editType": editType
					};
					if (precision != null)
					{
						var format = 0;
						format = format.toFixed(parseInt(precision)).toString();
						result["format"] = format;
					}
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
						"value": fieldOptions.DefaultPhoneNumber,
						"editType": editType
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
						"value": fieldOptions.DefaultZipCode,
						"editType": editType
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
						"value": fieldOptions.DefaultDate,
						"editType": editType
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
						"value": fieldOptions.DefaultDatetime,
						"editType": editType
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
						"value": fieldOptions.DefaultTime,
						"editType": editType
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
						"value": fieldOptions.DefaultBoolean,
						"displayValue": "User Defined Boolean",
						"positiveLabel": fieldOptions.TrueDisplayName || "True",
						"negativeLabel": fieldOptions.FalseDisplayName || "False",
						"editType": editType
					};
					break;
				case 'List':
					var defaultItems = fieldOptions.UDFPickListOptions.filter(function(item)
					{
						return item.IsDefaultItem;
					}).map(function(item)
					{
						return item.PickList;
					}),
						getSource = function()
						{
							return fieldOptions.UDFPickListOptions.map(function(item)
							{
								return item.PickList;
							});
						};

					result = {
						"field": item.Name,
						"title": item.Name,
						"type": "String",
						"defaultValue": "List Item 1, List Item 2, List Item 3",
						"value": fieldOptions.PickListMultiSelect ? defaultItems : defaultItems[0],
						"editType": fieldOptions.PickListMultiSelect ?
							{
								"format": "ListMover",
								"getSource": function()
								{
									return Promise.resolve(getSource());
								},
								"allowNullValue": true,
								"entityKey": ""
							} : {
								"format": "DropDown",
								"getSource": function() { return Promise.resolve(getSource()); },
								"allowNullValue": true,
								"entityKey": ""
							}
					};
					break;
				default:
					break;
			}

			if (result)
			{
				result.UDGridFieldId = item.ID;
				result.UDGridID = item.UDGridID;
				result.editType["TypeId"] = item.Type;
				result.Index = item.Index;
				result.Guid = item.Guid;
				result.Name = item.Name;
				result.FieldOptions = fieldOptions;
			}

			return result;
		});
	};

	UserDefinedGridHelper.prototype.updateDataPoint = function(gridType, udGrids)
	{
		dataPointsJSON[gridType]["User Defined Group"] = udGrids.map(item =>
		{
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

	UserDefinedGridHelper.prototype.generateQuickAddLayout = function(udGridId, gridType)
	{
		let udGridDataPoint = dataPointsJSON[gridType]["User Defined Group"].filter(udGrid => udGrid.ID == udGridId)[0],
			layout = {
				width: 1,
				items: [],
				sliderFontRate: 0.5,
				version: "1.0.0"
			}, sortedFields = [...Array.sortBy(udGridDataPoint.UDGridFields, "Index")],
			gridOptions = udGridDataPoint.GridOptions == null ? {} : JSON.parse(udGridDataPoint.GridOptions);

		if (gridOptions.IsEnableDocument && gridOptions.DocumentFieldIndex >= 0)
		{
			sortedFields.splice(gridOptions.DocumentFieldIndex, 0, "document");
		}

		let positionY = 0, layoutItem = null;
		for (let i = 0; i < sortedFields.length; i++)
		{
			let field = sortedFields[i];
			if (field == "document")
			{
				layoutItem = {
					x: 0,
					y: positionY,
					w: 1,
					h: 3,
					type: "grid",
					field: "DocumentGrid",
					UDGridID: udGridDataPoint.ID,
					getDataSource: () =>
					{
						return [];
					},
				};
			}
			else
			{
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

	UserDefinedGridHelper.prototype.addEditUDFGroupRecordInQuickAddModal = function(udGrid, gridType, baseRecordEntity, udgRecord)
	{
		let layout = tf.udgHelper.generateQuickAddLayout(udGrid.ID, gridType);
		let options = {
			dataType: gridType,
			recordEntity: udgRecord,
			baseRecordEntity: baseRecordEntity,
			udGrid: udGrid,
			layoutEntity: { Layout: JSON.stringify(layout) },
			isUDFGroup: true,
		};

		return tf.modalManager.showModal(new TF.DetailView.BasicQuickAddModalViewModel(options));
	};

	UserDefinedGridHelper.prototype.getDataPointByIdentifierAndGrid = function(udGridFieldId, udGridId, gridType)
	{
		let udGridDataPoint = dataPointsJSON[gridType]["User Defined Group"].filter(udGrid => udGrid.ID == udGridId)[0];
		let udGridFieldDataPoint = udGridDataPoint.UDGridFields.filter(udGridField => udGridField.UDGridFieldId == udGridFieldId);

		return $.extend(true, {}, udGridFieldDataPoint[0]);
	};

	UserDefinedGridHelper.prototype.getDataPointByUDGridId = function(udGridId, gridType)
	{
		let udGridDataPoint = dataPointsJSON[gridType]["User Defined Group"].filter(udGrid => udGrid.ID == udGridId)[0];
		return udGridDataPoint;
	};

	UserDefinedGridHelper.prototype.getDocumentGridRecords = function(columnFields, documentIds)
	{
		var excludeFields = ['FileContent'];

		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", "documents"), {
			data: {
				fields: columnFields.filter(function(name)
				{
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

	UserDefinedGridHelper.prototype.tryRemoveBaseRecordDocumentRelationships = function(baseRecordId, dataTypeId, documentIds)
	{
		return tf.udgHelper.getAffectedDocumentUDGridCount(baseRecordId, dataTypeId, documentIds.join())
			.then(res =>
			{
				if (!res)
				{
					return;
				}

				let nonExsitedDocs = documentIds.filter(d => !res[d]);
				if (nonExsitedDocs && nonExsitedDocs.length > 0)
				{
					let msg = nonExsitedDocs.length == 1 ?
						`The last association between UDF groups and document has been removed. Do you want to disassociate the document from current ${ self.gridType } record? ` :
						`The last associations between UDF groups and documents have been removed. Do you want to disassociate these documents from current ${ self.gridType } record? `;
					return tf.promiseBootbox.yesNo(msg, "Confirmation Message")
						.then(ch =>
						{
							if (!ch)
							{
								return;
							}

							return Promise.all(nonExsitedDocs.map(item =>
							{
								return tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "documentRelationships"), {
									paramData: {
										DBID: tf.datasourceManager.databaseId,
										DocumentID: item,
										AttachedToID: baseRecordId,
										AttachedToType: dataTypeId
									}
								});
							})).then(() =>
							{
								return nonExsitedDocs;
							});
						})
				}
			})
	};

	tf.udgHelper = new TF.DetailView.UserDefinedGridHelper();
})();
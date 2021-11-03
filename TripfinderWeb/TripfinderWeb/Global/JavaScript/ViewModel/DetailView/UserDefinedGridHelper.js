(function()
{
	const USER_DEFINED_GROUP = "User Defined Group";
	const PRAMATER_KEY_RELATIONSHIP = "@relationships";
	createNamespace("TF.DetailView").UserDefinedGridHelper = UserDefinedGridHelper;

	function UserDefinedGridHelper()
	{
		return;
	}

	UserDefinedGridHelper.prototype.constructor = UserDefinedGridHelper;

	UserDefinedGridHelper.getUpdatedInfoColumns = function()
	{
		function utc2Local(value)
		{
			const dt = moment(value);
			let tmpStr = "";
			if (tf.localTimeZone)
			{
				dt.add(tf.localTimeZone.hoursDiff, "hours");
			}
			tmpStr = dt.isValid() ? dt.format("MM/DD/YYYY hh:mm A") : "";
			return tmpStr;
		}

		return [
			{ DisplayName: "Created By", FieldName: "CreatedByUserName", Width: "120px", type: "string" },
			{ DisplayName: "Created On", FieldName: "CreatedOn", Width: "150px", type: "datetime", formatCopyValue: utc2Local },
			{ DisplayName: "Last Updated By", FieldName: "LastUpdatedByUserName", Width: "120px", type: "string" },
			{ DisplayName: "Last Updated On", FieldName: "LastUpdatedOn", Width: "150px", type: "datetime", formatCopyValue: utc2Local }
			/**, remove the IP for v2.5 release
			{ DisplayName: "IP Address", FieldName: "IPAddress", Width: '100px', type: "string" },
			{ DisplayName: "Host", FieldName: "Host", Width: '100px', type: "string" },
			{ DisplayName: "User Agent", FieldName: "UserAgent", Width: '150px', type: "string" }*/
		];
	};

	UserDefinedGridHelper.getGeoInfoColumns = function()
	{
		return [
			{ DisplayName: "Location Y Coord", FieldName: "latitude", Width: "100px" },
			{ DisplayName: "Location X Coord", FieldName: "longitude", Width: "100px" }
		];
	};


	UserDefinedGridHelper.isUpdatedInfoColumn = function(fieldName)
	{
		const updatedInfoFieldNames = TF.DetailView.UserDefinedGridHelper.getUpdatedInfoColumns().map(i => i.FieldName);
		return updatedInfoFieldNames.indexOf(fieldName) >= 0;
	};

	UserDefinedGridHelper.isGeoInfoColumn = function(fieldName)
	{
		const geoInfoFieldNames = TF.DetailView.UserDefinedGridHelper.getGeoInfoColumns().map(i => i.FieldName);
		return geoInfoFieldNames.indexOf(fieldName) >= 0;
	};

	UserDefinedGridHelper.getSignatureColumn = function()
	{
		return {
			DisplayName: "Signature",
			FieldName: "signature",
			Width: "70px",
			template: function(dataItem)
			{
				return `<div class='signature-checkbox-container'>
										<input type='checkbox' disabled class='signature-checkbox' ${dataItem && dataItem.signature ? 'checked' : ''}/>
									</div>`;
			},
		};
	};

	function handleDetailViewItem(dataItem, columns, signatureFields)
	{
		dataItem = TF.DetailView.UserDefinedGridHelper.convertSignatureColumnToBoolean(dataItem, signatureFields);
		dataItem = TF.DetailView.UserDefinedGridHelper.handleItemForBooleanType(dataItem, columns);
		dataItem = TF.DetailView.UserDefinedGridHelper.handleItemForPhoneType(dataItem, columns);
		return dataItem;
	}

	UserDefinedGridHelper.handleItemForSaveAs = function(dataItem, columns, signatureFields)
	{
		return handleDetailViewItem(dataItem, columns, signatureFields);
	}

	UserDefinedGridHelper.handleItemForCopy = function(dataItem, columns, signatureFields)
	{
		return handleDetailViewItem(dataItem, columns, signatureFields);
	};

	UserDefinedGridHelper.handleItemForBooleanType = function(dataItem, columns)
	{
		if (!columns || !columns.length)
		{
			return dataItem;
		}

		columns.forEach(col =>
		{
			if (col.originalUdfField && col.originalUdfField.type === 'Boolean')
			{
				var item = dataItem[col.FieldName],
					posLabel = col.originalUdfField.positiveLabel,
					negLabel = col.originalUdfField.negativeLabel;

				posLabel = (!posLabel) ? 'true' : posLabel;
				negLabel = (!negLabel) ? 'false' : negLabel;
				dataItem[col.FieldName] = item ? posLabel : negLabel;
			}
		});
		return dataItem;
	};

	UserDefinedGridHelper.handleItemForPhoneType = function(dataItem, columns)
	{
		if (columns && columns.length)
		{
			columns.forEach(col =>
			{
				if (col.originalUdfField && col.originalUdfField.questionType === 'Phone')
				{
					let item = dataItem[col.FieldName];
					if (item)
					{
						item = tf.dataFormatHelper.phoneFormatter(item);
					}
					dataItem[col.FieldName] = item;
				}
			});
		}
		return dataItem;
	};

	UserDefinedGridHelper.convertSignatureColumnToBoolean = function(dataItem, signatureFields)
	{
		if (!dataItem)
		{
			return dataItem;
		}

		signatureFields.forEach(f =>
		{
			dataItem[f] = !!dataItem[f];
		});
		return dataItem;
	};

	UserDefinedGridHelper.formatContent = function(questionContent)
	{
		if (!questionContent)
		{
			return questionContent;
		}
		var wrapper = $("<div/>").html(questionContent),
			tables = wrapper.find("table");
		tables.remove();
		return wrapper.text();
	};

	UserDefinedGridHelper.prototype.getAllValidUDGrids = function()
	{
		const self = this;
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgrids"),
			{
				paramData: {
					[PRAMATER_KEY_RELATIONSHIP]: "UDGridDataSources"
				}
			},
			{ overlay: false }
		).then(resp =>
		{
			if (resp && Array.isArray(resp.Items))
			{
				// filter UDGrids current datasource availiable
				resp.Items = _.filter(resp.Items, item => item.UDGridDataSources.some(ds => ds.DBID === tf.datasourceManager.databaseId));
				resp.Items = self.filterAssignedForms(resp.Items);
				return resp.Items;
			}

			return [];
		})
	};

	UserDefinedGridHelper.prototype.filterAssignedForms = function(rawForms)
	{
		const isAdmin = tf.authManager.authorizationInfo.isAdmin;
		if (isAdmin || !Array.isArray(rawForms))
		{
			return rawForms;
		}

		const forms = tf.authManager.authorizationInfo.authorizationTree.forms;
		return rawForms.filter(function(item)
		{
			return forms.indexOf(item.ID) > -1;
		});
	}

	UserDefinedGridHelper.prototype.getUDGridsByDataTypeId = function(dataTypeId)
	{
		var self = this;
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgrids"),
			{
				paramData: {
					"DataTypeId": dataTypeId,
					[PRAMATER_KEY_RELATIONSHIP]: "UDGridFields,UDGridDataSources"
				}
			},
			{ overlay: false }
		).then(resp =>
		{
			if (resp && Array.isArray(resp.Items))
			{
				// filter UDGrids current datasource availiable
				resp.Items = _.filter(resp.Items, item => item.UDGridDataSources.some(ds => ds.DBID === tf.datasourceManager.databaseId));
				resp.Items = self.filterAssignedForms(resp.Items);
				resp.Items.forEach(item =>
				{
					item.UDGridFields = this._updateUserDefinedGridFields(item.UDGridFields);
				});

				return resp.Items;
			}

			return [];
		})
	};

	UserDefinedGridHelper.prototype.getUDGridById = function(id)
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgrids"),
			{
				paramData: {
					"Id": id,
					[PRAMATER_KEY_RELATIONSHIP]: "UDGridFields,UDGridDataSources"
				}
			},
			{ overlay: false }
		).then(resp =>
		{
			if (resp && Array.isArray(resp.Items))
			{
				// filter UDGrids current datasource availiable
				resp.Items = _.filter(resp.Items, item => item.UDGridDataSources.some(ds => ds.DBID === tf.datasourceManager.databaseId));
				resp.Items.forEach(item =>
				{
					item.UDGridFields = this._updateUserDefinedGridFields(item.UDGridFields);
				});

				return resp.Items;
			}

			return [];
		})
	};

	UserDefinedGridHelper.prototype.getUDGridColumns = function(res)
	{
		let columns = [];
		let specialColumns = [];
		const sortFields = res[0].UDGridFields.sort(function(a, b)
		{
			return a.Index - b.Index;
		});
		sortFields.forEach(col =>
		{
			if (col.type === 'SystemField')
			{
				return;
			}
			const column = {
				FieldName: col.Guid,
				//DisplayName: originFieldMapping[col],
				DisplayName: TF.DetailView.UserDefinedGridHelper.formatContent(col.title),
				Width: '150px',
				Index: col.Index,
				type: 'string',
				QuestionTypeId: col.editType.TypeId,
				questionType: col.questionType
			};
			switch (col.type)
			{
				case "Date/Time":
					setColumnDateTime(column);
					break;
				case "Date":
					setColumnDate(column, col);
					break;
				case "Time":
					setColumnTime(column, col);
					break;
				case "List":
					setColumnList(column, col);
					break;
				case "Boolean":
					setColumnBoolean(column, col);
					break;
				case "SignatureBlock":
					setColumnSignatureBlock(column, col);
					break;
				case "Number":
					setColumnNumber(column, col);
					break;
				case "Phone Number":
					column.template = phoneTypeFieldTemplateFun;
					break;
				case "AttachBlock":
					column.type = "integer";
					break;
				case "Map":
					specialColumns = TF.DetailView.UserDefinedGridHelper.convertMapColumnToMapXYCoordColumns(column);
					break;
			}

			function phoneTypeFieldTemplateFun(item)
			{
				let value = item[col.Guid];
				if (isNullObj(value))
				{
					return '';
				}
				value = tf.dataFormatHelper.phoneFormatter(value);
				return value;
			}

			if ((col.questionType === "Phone") && (column.template === undefined))
			{
				column.template = phoneTypeFieldTemplateFun;
			}

			if (col.questionType === "List")
			{
				const pickUpList = [];
				col.FieldOptions.UDFPickListOptions.forEach(plo =>
				{
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

			if (specialColumns.length)
			{
				columns = columns.concat(specialColumns);
				specialColumns = [];
			}
			else
			{
				columns.push(column);
			}
		});

		return columns;
	};

	function setColumnDateTime(column)
	{
		column.type = "datetime";
		column.template = function(item)
		{
			const value = item[col.Guid];
			if (value === "")
			{
				return "";
			}
			const dt = moment(value);
			return dt.isValid() ? dt.format("MM/DD/YYYY hh:mm A") : "";
		};
	}

	function setColumnDate(column, col)
	{
		column.type = "date";
		column.template = function(item)
		{
			const value = item[col.Guid];
			if (value === "")
			{
				return "";
			}
			const date = moment(value);
			return date.isValid() ? moment(value).format("MM/DD/YYYY") : "";
		};
	}

	function setColumnTime(column, col)
	{
		column.type = "time";
		column.template = function(item)
		{
			const value = item[col.Guid];
			if (value === "")
			{
				return "";
			}
			let time = moment(value);
			if (time.isValid())
			{
				return time.format("hh:mm A");
			}
			time = moment("1900-1-1 " + value);
			return time.isValid() ? time.format("hh:mm A") : "";
		};
	}

	function setColumnList(column, col)
	{
		column.template = function(item)
		{
			const value = item[col.Guid];
			if (value instanceof Array)
			{
				return value.join(", ");
			}
			return isNullObj(value) ? "" : value;
		};
	}

	function setColumnBoolean(column, col)
	{
		column.type = "boolean";
		column.template = function(item)
		{
			const value = item[col.Guid];
			if (isNullObj(value))
			{
				return '';
			}
			return value === 'true' ? col.positiveLabel : col.negativeLabel || value;
		};
	}

	function setColumnSignatureBlock(column, col)
	{
		column.type = "boolean";
		column.template = function(item)
		{
			const checked = (item[col.Guid] === 'true');
			return `<div class='signature-checkbox-container'>
						<input type='checkbox' disabled class='signature-checkbox' ${checked ? 'checked' : ''}/>
					</div>`;
		};
	}

	function setColumnNumber(column, col)
	{
		column.type = "number";
		column.template = function(item)
		{
			let value = item[col.Guid];
			if (!value)
			{
				return "";
			}

			const precision = col.FieldOptions.NumberPrecision;
			if (isNaN(Number(value)))
			{
				value = 0;
			}
			return Number(value).toFixed(_.isNumber(precision) ? precision : 0);

		};
	}

	UserDefinedGridHelper.prototype.getUDGridsByDataType = function(dataType)
	{
		const dataTypeId = tf.dataTypeHelper.getId(dataType);
		return this.getUDGridsByDataTypeId(dataTypeId);
	};

	UserDefinedGridHelper.prototype.getNameToGuidMappingOfGridFields = function(udGrid)
	{
		const gridFields = Array.isArray(udGrid.UDGridFields) ? _.sortBy(udGrid.UDGridFields, 'Index') : [],
			nameToGuidDict = {};

		gridFields.forEach(gf =>
		{
			nameToGuidDict[gf.Name] = gf.Guid;
		});
		return nameToGuidDict;
	};

	UserDefinedGridHelper.prototype.getGuidToNameMappingOfGridFields = function(udGrid, excludeSystemField, excludeSignedFields)
	{
		const gridFields = Array.isArray(udGrid.UDGridFields) ? _.sortBy(udGrid.UDGridFields, 'Index') : [],
			guidToNameDict = {};

		gridFields.forEach(gf =>
		{
			if (excludeSystemField && gf.type === 'SystemField')
			{
				return;
			}
			var formatedUDGridFields = TF.DetailView.UserDefinedGridHelper.formatContent(gf.Name);
			guidToNameDict[gf.Guid] = formatedUDGridFields;
		});

		if (!excludeSignedFields)
		{
			guidToNameDict.signedFieldList = TF.DetailView.UserDefinedGridHelper.signedFieldListField;
		}

		return guidToNameDict;
	};

	UserDefinedGridHelper.prototype.isDocumentIncluded = function(udGrid)
	{
		if (udGrid.GridOptions)
		{
			try
			{
				const gridOption = JSON.parse(udGrid.GridOptions);
				return gridOption.IsEnableDocument;
			} catch (error)
			{
				return false;
			}
		}
		return false;
	};


	UserDefinedGridHelper.prototype.getEditableBasedOnSignedPolicy = function(udGrid)
	{
		console.log("Todo: getEditableBasedOnSignedPolicy -> Get Result Based on Workflow Setting")
		return true;
	};

	UserDefinedGridHelper.prototype.getIsReadOnlyBasedOnSignedPolicy = function(selectedRecord, udgridFields)
	{
		const signatureFileds = udgridFields.filter(u =>
		{
			return u.Type === 15;
		}).map(u => u.Guid);
		let isReadOnly = false;
		signatureFileds.forEach(f =>
		{
			if (selectedRecord[f] === "true" ||
				(selectedRecord[f] && selectedRecord[f].includes("data:image")))
			{
				isReadOnly = true;
				return true;
			}

			return undefined;
		});

		return isReadOnly;
	};

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
		const self = this,
			udGridId = udGrid.ID,
			guidToNameDict = self.getGuidToNameMappingOfGridFields(udGrid);

		const relationships = "User,DocumentUDGridRecords,MapUDGridRecords";
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgridrecords"),
			{
				paramData: {
					DBID: tf.datasourceManager.databaseId,
					RecordDataType: dataTypeId,
					RecordID: entityId,
					UDGridID: udGridId,
					[PRAMATER_KEY_RELATIONSHIP]: relationships
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
				return self.getFormRecord(guidToNameDict, rr);
			});
		});
	};

	UserDefinedGridHelper.prototype.getFormRecord = function(formQuestionGuidToNameDict, rawFormRecord)
	{
		let convertedRecord = {};
		//Created By / Last Updated By / Last Updated On
		TF.DetailView.UserDefinedGridHelper.getUpdatedInfoColumns().forEach(c =>
		{
			convertedRecord[c.FieldName] = rawFormRecord[c.FieldName] || "";
		});

		if (!rawFormRecord || !rawFormRecord.RecordValue)
		{
			return convertedRecord;
		}

		const recordValueObj = JSON.parse(rawFormRecord.RecordValue);
		convertedRecord = {};
		convertedRecord.Id = rawFormRecord.ID;
		for (const fguid in formQuestionGuidToNameDict)
		{
			if (rawFormRecord.DocumentUDGridRecords && rawFormRecord.DocumentUDGridRecords.some(dr => dr.UDGridField === fguid))
			{
				convertedRecord[fguid] = rawFormRecord.DocumentUDGridRecords.filter(dr => dr.UDGridField === fguid).length;
			}
			else if (rawFormRecord.MapUDGridRecords && rawFormRecord.MapUDGridRecords.some(dr => dr.UDGridField === fguid))
			{
				const mapData = rawFormRecord.MapUDGridRecords.filter(dr => dr.UDGridField === fguid);
				const data = mapData && mapData.length && mapData[0];

				convertedRecord[fguid] = data.ShapeData === "true";
				const xCoordFieldName = TF.DetailView.UserDefinedGridHelper.getXCoordFieldName(fguid);
				convertedRecord[xCoordFieldName] = data.XCoord;
				const yCoordFieldName = TF.DetailView.UserDefinedGridHelper.getYCoordFieldName(fguid);
				convertedRecord[yCoordFieldName] = data.YCoord;
			}
			else if (fguid in recordValueObj)
			{
				convertedRecord[fguid] = recordValueObj[fguid];
			}
			else
			{
				convertedRecord[fguid] = null;
			}
		}
		if (recordValueObj["latitude"] && recordValueObj["longitude"])
		{
			convertedRecord["latitude"] = recordValueObj["latitude"];
			convertedRecord["longitude"] = recordValueObj["longitude"];
		}


		return convertedRecord;
	};

	UserDefinedGridHelper.prototype.addUDGridRecordOfEntity = function(udGrid, dataTypeId, entityId, record)
	{
		const self = this,
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
			for (const fguid in guidToNameDict)
			{
				if (fguid in record)
				{
					recordValueObj[fguid] = record[fguid];
				}
			}
			recordValueObj["latitude"] = record["latitude"];
			recordValueObj["longitude"] = record["longitude"];
		}

		rawRecord.RecordValue = JSON.stringify(recordValueObj);
		const paramData = {};
		if (record.DocumentUDGridRecords)
		{
			_setNewDocumentUdGridRecordParam(rawRecord, record, paramData);
		}

		if (record.MapUDGridRecords)
		{
			_setNewMapUdGridRecordParam(rawRecord, record, paramData);
		}
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgridrecords"),
			{
				paramData: paramData,
				data: [rawRecord]
			}, { overlay: false }
		).then(resp =>
		{
			const addedRawRecord = resp.Items[0];
			record.Id = addedRawRecord.ID;
			return record;
		});
	};

	function _setNewDocumentUdGridRecordParam(rawRecord, record, paramData)
	{
		rawRecord.DocumentUDGridRecords = record.DocumentUDGridRecords;
		if (paramData[PRAMATER_KEY_RELATIONSHIP])
		{
			paramData[PRAMATER_KEY_RELATIONSHIP] += ",";
		}
		paramData[PRAMATER_KEY_RELATIONSHIP] = paramData[PRAMATER_KEY_RELATIONSHIP] || "";
		paramData[PRAMATER_KEY_RELATIONSHIP] += "DocumentUDGridRecords";
	}

	function _setNewMapUdGridRecordParam(rawRecord, record, paramData)
	{
		rawRecord.MapUDGridRecords = record.MapUDGridRecords;

		if (Array.isArray(rawRecord.MapUDGridRecords))
		{
			rawRecord.MapUDGridRecords.forEach(r =>
			{
				TF.DetailView.UserDefinedGridHelper.prepareMapData(r);
			});
		}

		if (paramData[PRAMATER_KEY_RELATIONSHIP])
		{
			paramData[PRAMATER_KEY_RELATIONSHIP] += ",";
		}
		paramData[PRAMATER_KEY_RELATIONSHIP] = paramData[PRAMATER_KEY_RELATIONSHIP] || "";
		paramData[PRAMATER_KEY_RELATIONSHIP] += "MapUDGridRecords";
	}

	UserDefinedGridHelper.prototype.uploadAttachments = function(attachements)
	{

		const attachementsOfNew = attachements.filter(a => !a.Id);
		const attachementsOfModify = attachements.filter(a => a.Id);

		const newPromise = Promise.resolve(attachementsOfNew.length).then(len =>
		{
			if (len === 0)
			{
				return Promise.resolve([]);
			}
			else
			{
				return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "documents", "?ignore_blob=true"),
					{
						paramData: { [PRAMATER_KEY_RELATIONSHIP]: "DocumentRelationship" },
						data: attachementsOfNew
					}, { overlay: false }
				).then(res =>
				{
					return Promise.resolve(res.Items);
				})
			}
		});

		const modifyPromise = Promise.resolve(attachementsOfModify.length).then(len =>
		{
			if (len === 0)
			{
				return Promise.resolve([]);
			}
			else
			{
				return tf.promiseAjax.put(pathCombine(tf.api.apiPrefix(), "documents", "?ignore_blob=true"),
					{
						paramData: { [PRAMATER_KEY_RELATIONSHIP]: "DocumentRelationship" },
						data: attachementsOfModify
					}, { overlay: false }
				).then(res =>
				{
					return Promise.resolve(res.Items);
				})
			}
		});

		return Promise.all([newPromise, modifyPromise]).then(res => Promise.resolve(res[0].concat(res[1])));
	};

	UserDefinedGridHelper.prototype.updateUDGridRecordOfEntity = function(udGrid, record)
	{
		const self = this,
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

		for (const fguid in guidToNameDict)
		{
			if (fguid in record)
			{
				let value = record[fguid];
				if (udGrid.UDGridFields.filter(x => x.format === "Phone").map(x => x.Guid).includes(fguid))
				{
					value = tf.dataFormatHelper.getPurePhoneNumber(value);
				}

				recordValueObj[fguid] = value;
			}
		}
		recordValueObj["latitude"] = record["latitude"];
		recordValueObj["longitude"] = record["longitude"];
		patchItem.Value = JSON.stringify(recordValueObj);
		const patchData = [patchItem], paramData = { "@filter": `eq(ID,${record.Id})` };
		if (record.DocumentUDGridRecords)
		{
			_updasteDirtyDocumentParam(patchData, record, paramData);
		}

		if (record.MapUDGridRecords)
		{
			_updasteDirtyMapParam(patchData, record, paramData);
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

	function _updasteDirtyDocumentParam(patchData, record, paramData)
	{
		patchData.push({
			Id: record.Id,
			op: "relationship",
			path: "/DocumentUDGridRecords",
			value: JSON.stringify(record.DocumentUDGridRecords),
		});
		if (paramData[PRAMATER_KEY_RELATIONSHIP])
		{
			paramData[PRAMATER_KEY_RELATIONSHIP] += ",";
		}
		paramData[PRAMATER_KEY_RELATIONSHIP] = paramData[PRAMATER_KEY_RELATIONSHIP] || "";
		paramData[PRAMATER_KEY_RELATIONSHIP] += "DocumentUDGridRecords";
	}

	function _updasteDirtyMapParam(patchData, record, paramData)
	{
		if (Array.isArray(record.MapUDGridRecords))
		{
			record.MapUDGridRecords.forEach(r =>
			{
				TF.DetailView.UserDefinedGridHelper.prepareMapData(r);
			});
		}

		patchData.push({
			Id: record.Id,
			op: "relationship",
			path: "/MapUDGridRecords",
			value: JSON.stringify(record.MapUDGridRecords),
		});
		if (paramData[PRAMATER_KEY_RELATIONSHIP])
		{
			paramData[PRAMATER_KEY_RELATIONSHIP] += ",";
		}
		paramData[PRAMATER_KEY_RELATIONSHIP] = paramData[PRAMATER_KEY_RELATIONSHIP] || "";
		paramData[PRAMATER_KEY_RELATIONSHIP] += "MapUDGridRecords";
	}

	UserDefinedGridHelper.prototype.deleteUDGridRecordOfEntity = function(recordId)
	{
		return tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgridrecords"),
			{
				paramData: {
					"@filter": `eq(ID,${recordId})`
				}
			}, { overlay: false }
		).then(resp =>
		{
			return resp;
		});
	};

	UserDefinedGridHelper.prototype._updateUserDefinedGridFields = function(items)
	{
		if (items.length === 0)
		{
			return [];
		}

		return items.map(function(item)
		{
			// var editType,
			let result;
			var fieldOptions = typeof item.FieldOptions === "string" ? JSON.parse(item.FieldOptions) : item.FieldOptions,
				type = item.TypeName || item.FieldOptions.TypeName || item.FieldOptions.Type;

			switch (type)
			{
				case 'Text':
					result = _updateTextUDGField(fieldOptions, item);
					break;
				case 'Memo':
					result = _updateMemoUDGField(fieldOptions, item);
					break;
				case 'Number':
					result = _updateNumberUDGField(fieldOptions, item);
					break;
				case 'Currency':
					result = _updateCurrencyUDGField(fieldOptions, item)
					break;
				case 'Phone Number':
					result = _updatePhoneNumberUDGField(item);
					break;
				case 'Zip Code':
					result = _updateZipCodeUDGField(item);
					break;
				case 'Date':
					result = _updateDateUDGField(item);
					break;
				case 'Date/Time':
					result = _updateDateTimeUDGField(item)
					break;
				case 'Time':
					result = _updateTimeUDGField(item)
					break;
				case 'Boolean':
					result = _updateBooleanUDGField(fieldOptions, item)
					break;
				case 'List':
					result = _updateListUDGField(fieldOptions, item)
					break;
				case 'Rating Scale':
					result = _updateRatingScaleUDGField(fieldOptions, item);
					break;
				case 'System Field':
					result = _updateSystemFieldUDGField(fieldOptions, item);
					break;
				case 'Attachment':
					result = _updateAttachmentUDGField(item);
					break;
				case 'Signature':
					result = _updateSignatureUDGField(item);
					break;
				case 'Map':
					result = _updateMapUDGField(item);
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
				result.Required = item.Required;
				result.OriginItem = item;
			}

			return result;
		});
	};

	function _updateTextUDGField(fieldOptions, item)
	{
		const editType = {
			"format": "String",
			"maxLength": fieldOptions.MaxLength || 255
		};

		return {
			"field": item.Name,
			"title": item.Name,
			"type": "String",
			"defaultValue": "User Defined Text",
			"editType": editType,
			"questionType": "Text"
		};
	}

	function _updateMemoUDGField(fieldOptions, item)
	{
		const editType = {
			"format": "Note",
			"maxLength": fieldOptions.MaxLength || 2000
		};
		return {
			"field": item.Name,
			"title": item.Name,
			"type": "String",
			"defaultValue": "Lorem ipsum dolor sit amet.",
			"editType": editType,
			"questionType": "Memo"
		};
	}
	function _updateNumberUDGField(fieldOptions, item)
	{
		var precision = fieldOptions.NumberPrecision,
			nullPrecision = (precision === 0 || precision === null);
		const editType = {
			"format": "Number",
			"maxLength": 10 + (nullPrecision ? 0 : (1 + precision)),
			"maxValue": 9999999999 + (nullPrecision ? 0 : (1 - (Math.pow(10, -1 * precision))))
		};
		var result = {
			"field": item.Name,
			"title": item.Name,
			"type": "Number",
			"defaultValue": "3.14",
			"editType": editType,
			"questionType": "Number"
		};

		if (precision != null)
		{
			var format = 0;
			format = format.toFixed(parseInt(precision)).toString();
			result["format"] = format;
		}

		return result;
	}
	function _updateCurrencyUDGField(fieldOptions, item)
	{
		const editType = {
			"format": "Number",
			"maxIntegerLength": fieldOptions.MaxLength || 10,
			"maxDecimalLength": 2
		};
		return {
			"field": item.Name,
			"title": item.Name,
			"type": "Currency",
			"editType": editType,
			"questionType": "Currency"
		};
	}
	function _updatePhoneNumberUDGField(item)
	{
		const editType = {
			"format": "Phone"
		};
		return {
			"field": item.Name,
			"title": item.Name,
			"type": "String",
			"format": "Phone",
			"defaultValue": "(987) 654-3210",
			"editType": editType,
			"questionType": "Phone"
		};
	}
	function _updateZipCodeUDGField(item)
	{
		const editType = {
			"format": "Number",
			"maxLength": 5
		};
		return {
			"field": item.Name,
			"title": item.Name,
			"type": "Number",
			"defaultValue": "12345",
			"editType": editType,
			"questionType": "ZipCode"
		};
	}
	function _updateDateUDGField(item)
	{
		var today = (new Date()).toDateString();
		const editType = {
			"format": "Date"
		};
		return {
			"field": item.Name,
			"title": item.Name,
			"type": "Date",
			"defaultValue": today,
			"editType": editType,
			"questionType": "Date"
		};
	}
	function _updateDateTimeUDGField(item)
	{
		const editType = {
			"format": "DateTime"
		};
		return {
			"field": item.Name,
			"title": item.Name,
			"type": "Date/Time",
			"defaultValue": today,
			"editType": editType,
			"questionType": "DateTime"
		};
	}
	function _updateTimeUDGField(item)
	{
		const editType = {
			"format": "Time"
		};
		return {
			"field": item.Name,
			"title": item.Name,
			"type": "Time",
			"defaultValue": '12:00',
			"editType": editType,
			"questionType": "Time"
		};
	}
	function _updateBooleanUDGField(fieldOptions, item)
	{
		const editType = {
			"format": "BooleanDropDown"
		};
		return {
			"field": item.Name,
			"title": item.Name,
			"type": "Boolean",
			"defaultValue": "False",
			"displayValue": "User Defined Boolean",
			"positiveLabel": fieldOptions.TrueDisplayName || "True",
			"negativeLabel": fieldOptions.FalseDisplayName || "False",
			"editType": editType,
			"questionType": "Boolean"
		};
	}
	function _updateListUDGField(fieldOptions, item)
	{
		fieldOptions.UDFPickListOptions.filter(function(data)
		{
			return data.IsDefaultItem;
		}).map(function(data)
		{
			return data.PickList;
		});
		const listGetSource = function()
		{
			return fieldOptions.UDFPickListOptions.map(function(data)
			{
				return data.PickList;
			});
		};
		return {
			"field": item.Name,
			"title": item.Name,
			"type": "String",
			"defaultValue": "List Item 1, List Item 2, List Item 3",
			"editType": fieldOptions.PickListMultiSelect ?
				{
					"format": "ListMover",
					"getSource": function()
					{
						return Promise.resolve(listGetSource());
					},
					"allowNullValue": true,
					"entityKey": ""
				} : {
					"format": "DropDown",
					"getSource": function() { return Promise.resolve(listGetSource()); },
					"allowNullValue": true,
					"entityKey": ""
				},
			"questionType": "List"
		};
	}
	function _updateRatingScaleUDGField(fieldOptions, item)
	{
		var ratingItems = Array.from({ length: fieldOptions.Scale }, (_, i) => i + 1);
		var ratingScaleDefaultItems = ratingItems.filter(function()
		{
			return 1;
		});
		const ratingScaleGetSource = function()
		{
			return ratingItems;
		};
		return {
			"field": item.Name,
			"title": item.Name,
			"type": "String",
			"defaultValue": "Rating Value",
			"startScale": ratingScaleDefaultItems[0],
			"editType": {
				"format": "DropDown",
				"getSource": function() { return Promise.resolve(ratingScaleGetSource()); },
				"allowNullValue": true,
				"entityKey": ""
			},
			"questionType": "Rating"
		};
	}
	function _updateSystemFieldUDGField(fieldOptions, item)
	{
		return {
			"field": item.Name,
			"title": item.Name,
			"type": "SystemField",
			"questionType": "SystemField",
			"editType": {
				"targetField": fieldOptions.DefaultText
			}
		};
	}
	function _updateAttachmentUDGField(item)
	{
		return {
			"field": item.Name,
			"title": item.Name,
			"type": "AttachBlock",
			"questionType": "AttachBlock",
			"editType": {}
		};
	}
	function _updateSignatureUDGField(item)
	{
		return {
			"field": item.Name,
			"title": item.Name,
			"type": "SignatureBlock",
			"questionType": "SignatureBlock",
			"editType": {}
		};
	}
	function _updateMapUDGField(item)
	{
		return {
			"field": item.Name,
			"title": item.Name,
			"type": "Map",
			"questionType": "Map",
			"editType": {}
		};
	}

	UserDefinedGridHelper.prototype.updateDataPoint = function(gridType, udGrids)
	{
		dataPointsJSON[gridType][USER_DEFINED_GROUP] = udGrids.map(item =>
		{
			return _.extend(item, {
				"field": "UDGridId",
				"title": item.Name,
				"UDGridId": item.ID,
				"type": "UDGrid",
				"defaultValue": USER_DEFINED_GROUP,
				"min-height": 3,
				"min-width": 2
			})
		})
	};

	UserDefinedGridHelper.prototype.generateQuickAddLayout = function(udGridId, gridType, dataPoint)
	{
		let udGridDataPoint = dataPointsJSON[gridType][USER_DEFINED_GROUP].find(udGrid => udGrid.ID === udGridId);
		if (!udGridDataPoint)
		{
			udGridDataPoint = dataPoint
		}

		const layout = {
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
			const field = sortedFields[i];
			if (field === "document")
			{
				layoutItem = {
					x: 0,
					y: positionY,
					w: 1,
					h: 4,
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

	UserDefinedGridHelper.prototype.addEditUDFGroupRecordInQuickAddModal = function(udGrid, gridType, baseRecordEntity, udgRecord, dataPoint)
	{
		const layout = tf.udgHelper.generateQuickAddLayout(udGrid.ID, gridType, dataPoint);
		const options = {
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
		modalVm.obEnableEsc(false);
		return tf.modalManager.showModal(modalVm);
	};

	UserDefinedGridHelper.prototype.getDataPointByIdentifierAndGrid = function(udGridFieldId, udGridId, gridType)
	{
		const udGridDataPoint = dataPointsJSON[gridType][USER_DEFINED_GROUP].filter(udGrid => udGrid.ID === udGridId)[0];
		const udGridFieldDataPoint = udGridDataPoint.UDGridFields.filter(udGridField => udGridField.UDGridFieldId === udGridFieldId);

		return $.extend(true, {}, udGridFieldDataPoint[0]);
	};

	UserDefinedGridHelper.prototype.getDataPointByUDGridId = function(udGridId, gridType)
	{
		return dataPointsJSON[gridType][USER_DEFINED_GROUP].filter(udGrid => udGrid.ID === udGridId)[0];
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
					return undefined;
				}

				const nonExsitedDocs = documentIds.filter(d => !res[d]);
				if (nonExsitedDocs && nonExsitedDocs.length > 0)
				{
					const msg = nonExsitedDocs.length === 1 ?
						`The last association between UDF groups and document has been removed. Do you want to disassociate the document from current ${self.gridType} record? ` :
						`The last associations between UDF groups and documents have been removed. Do you want to disassociate these documents from current ${self.gridType} record? `;
					return tf.promiseBootbox.yesNo(msg, "Confirmation Message")
						.then(ch =>
						{
							if (!ch)
							{
								return undefined;
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

				return undefined;
			})
	};

	UserDefinedGridHelper.prototype.bindCounterBoxEvent = function($inputEl, maxlength, $counterEl, preventEnterKey, getLength)
	{
		$inputEl.keyup(ev =>
		{
			if (TF.isMobileDevice || isIpad())
			{
				ev.target.style.height = 'auto';
				ev.target.style.height = ev.target.scrollHeight + 'px';
			}
		}).on('keyup focusin cut paste', ev =>
		{
			if (typeof getLength === "function")
			{
				$counterEl.html(`${getLength(ev.target)}/${maxlength}`);
			}
			else
			{
				$counterEl.html(`${ev.target.value.length}/${maxlength}`);
			}
		}).focus(ev =>
		{
			if (typeof getLength === "function")
			{
				$counterEl.html(`${getLength(ev.target)}/${maxlength}`);
			}
			else
			{
				$counterEl.html(`${ev.target.value.length}/${maxlength}`);
			}
			$counterEl.show();
		}).blur(() =>
		{
			$counterEl.hide();
		}).keypress(ev =>
		{
			if (ev.keyCode === 13 && !!preventEnterKey)
			{
				ev.preventDefault();
			}
		});
	}

	UserDefinedGridHelper.saveUserdefinedfield = function(udfEntity)
	{
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgrids"), {
			paramData: { [PRAMATER_KEY_RELATIONSHIP]: "UDGridFields" },
			data: [udfEntity]
		});
	}

	UserDefinedGridHelper.removeIdentityInfo = function(udfEntity)
	{
		resetFields(udfEntity, ["ID", "Id", "Guid"]);

		if (udfEntity.UDGridDataSources && udfEntity.UDGridDataSources.length)
		{
			udfEntity.UDGridDataSources.forEach(udgridDataSource =>
			{
				resetFields(udgridDataSource, ["UDGridID", "UDGrid", "ID"]);
			});
		}

		if (udfEntity.UDGridFields && udfEntity.UDGridFields.length)
		{
			udfEntity.UDGridFields.forEach(udgridField =>
			{
				resetFields(udgridField, ["UDGridID", "UDGrid", "Guid", "ID"]);
			});
		}

		function resetFields(entity, toResetFields)
		{
			const fields = Object.keys(entity);
			fields.forEach((f) =>
			{
				if (toResetFields.includes(f))
				{
					entity[f] = null;
					delete entity[f];
				}
			});
		}
	}

	UserDefinedGridHelper.getPureFieldName = function(fieldName)
	{
		return fieldName.substring(0, fieldName.length - 7);
	}

	UserDefinedGridHelper.getXCoordFieldName = function(fieldName)
	{
		return `${fieldName}_XCoord`;
	}

	UserDefinedGridHelper.getYCoordFieldName = function(fieldName)
	{
		return `${fieldName}_YCoord`;
	}

	UserDefinedGridHelper.getXCoordDisplayName = function(displayName)
	{
		return `${displayName} X Coord`;
	}

	UserDefinedGridHelper.getYCoordDisplayName = function(displayName)
	{
		return `${displayName} Y Coord`;
	}

	UserDefinedGridHelper.isXCoordField = function(fieldName)
	{
		return fieldName.includes("_XCoord");
	}

	UserDefinedGridHelper.isYCoordField = function(fieldName)
	{
		return fieldName.includes("_YCoord");
	}

	UserDefinedGridHelper.convertMapColumnToMapXYCoordColumns = function(column)
	{
		$.extend(column, {
			type: "number",
			Precision: 6,
			format: "{0:0.000000}"
		});

		const specialColumns = [];
		const fieldName = column.FieldName;
		const displayName = column.DisplayName;

		const xCoordFieldName = TF.DetailView.UserDefinedGridHelper.getXCoordFieldName(fieldName);
		const xCoordColumn = $.extend({}, column, {
			FieldName: xCoordFieldName,
			DisplayName: TF.DetailView.UserDefinedGridHelper.getXCoordDisplayName(displayName),
			template: function(item)
			{
				const value = item[xCoordFieldName];
				if (!value)
				{
					return "";
				}
				return value.toFixed(6);
			}
		});
		specialColumns.push(xCoordColumn);

		const yCoordFieldName = TF.DetailView.UserDefinedGridHelper.getYCoordFieldName(fieldName);
		const yCoordColumn = $.extend({}, column, {
			FieldName: yCoordFieldName,
			DisplayName: TF.DetailView.UserDefinedGridHelper.getYCoordDisplayName(displayName),
			template: function(item)
			{
				const value = item[yCoordFieldName];
				if (!value)
				{
					return "";
				}
				return value.toFixed(6);
			}
		});
		specialColumns.push(yCoordColumn);

		return specialColumns;
	}

	UserDefinedGridHelper.prepareMapData = function(record)
	{
		if (!record || !record.ShapeData)
		{
			return record;
		}

		record.XCoord = null;
		record.YCoord = null;

		const rawData = JSON.parse(record.ShapeData);
		if (rawData &&
			rawData.length &&
			rawData[0].geometry &&
			rawData[0].geometry.x && rawData[0].geometry.y)
		{
			const lngLat = tf.map.ArcGIS.webMercatorUtils.xyToLngLat(rawData[0].geometry.x, rawData[0].geometry.y);
			record.XCoord = lngLat[0].toFixed(6);
			record.YCoord = lngLat[1].toFixed(6);
		}

		return record;
	}

	UserDefinedGridHelper.signedFieldListField = "signedFieldList";

	tf.udgHelper = new TF.DetailView.UserDefinedGridHelper();
})();

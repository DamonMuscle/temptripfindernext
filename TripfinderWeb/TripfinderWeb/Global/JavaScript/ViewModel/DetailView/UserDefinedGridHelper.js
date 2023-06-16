(function()
{
	const USER_DEFINED_GROUP = "User Defined Group";
	const PRAMATER_KEY_RELATIONSHIP = "@relationships";
	createNamespace("TF.DetailView").UserDefinedGridHelper = UserDefinedGridHelper;

	function UserDefinedGridHelper()
	{
		return;
		// This is intentional
	}

	UserDefinedGridHelper.prototype.constructor = UserDefinedGridHelper;

	UserDefinedGridHelper.DEFAULT_FORM_NOT_AVAILABLE_MESSAGE = 'This form cannot be submitted.';
	UserDefinedGridHelper.HAS_NO_SUBMITTED_PERMISSION = 'You have no submit permission of forms.';
	UserDefinedGridHelper.ONE_RESPONSE_HAS_SUBMITTED = 'Your response has already been submitted. This form allows only one response per recipient.';
	UserDefinedGridHelper.RECORD_VERSION = 1;

	UserDefinedGridHelper.getUpdatedInfoColumns = function()
	{
		function utc2Local(value)
		{
			const dt = utcToClientTimeZone(value);
			return dt.isValid() ? dt.format("MM/DD/YYYY hh:mm A") : "";
		}

		return [
			{ DisplayName: "Created By", FieldName: "CreatedBy", Width: "120px", type: "string" },
			{ DisplayName: "Created On", FieldName: "CreatedOn", Width: "150px", type: "datetime", formatCopyValue: utc2Local, formatSummaryValue: utc2Local },
			{ DisplayName: "Last Updated By", FieldName: "LastUpdatedBy", Width: "120px", type: "string" },
			{ DisplayName: "Last Updated On", FieldName: "LastUpdatedOn", Width: "150px", type: "datetime", formatCopyValue: utc2Local, formatSummaryValue: utc2Local },
			{ DisplayName: "IP Address", FieldName: "IPAddress", Width: '100px', type: "string" },
			{ DisplayName: "Host", FieldName: "Host", Width: '100px', type: "string" },
			{ DisplayName: "User Agent", FieldName: "UserAgent", Width: '150px', type: "string" }

		];
	};

	UserDefinedGridHelper.DEFAULT_CANNOT_SUBMIT_FORM_MESSAGE = 'This form cannot be submitted.';

	UserDefinedGridHelper.getGeoInfoColumns = function()
	{
		return [
			{ DisplayName: "Location Y Coord", FieldName: "Latitude", Width: "130px", type: "number" },
			{ DisplayName: "Location X Coord", FieldName: "Longitude", Width: "130px", type: "number" }
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

	UserDefinedGridHelper.handleItemForSaveAs = function(dataItem, columns, signatureFields)
	{
		dataItem = TF.DetailView.UserDefinedGridHelper.convertSignatureColumnToBoolean(dataItem, signatureFields);
		dataItem = TF.DetailView.UserDefinedGridHelper.handleItemForBooleanType(dataItem, columns);
		dataItem = TF.DetailView.UserDefinedGridHelper.handleItemForPhoneType(dataItem, columns);
		dataItem = TF.DetailView.UserDefinedGridHelper.handleItemForDateTimeType(dataItem, columns, true);
		return dataItem;
	};

	UserDefinedGridHelper.handleItemForCopy = function(dataItem, columns, signatureFields)
	{
		dataItem = TF.DetailView.UserDefinedGridHelper.convertSignatureColumnToBoolean(dataItem, signatureFields);
		// Migrate Bug from PLUS
		// dataItem = TF.DetailView.UserDefinedGridHelper.handleItemForBooleanType(dataItem, columns);
		dataItem = TF.DetailView.UserDefinedGridHelper.handleItemForPhoneType(dataItem, columns);
		dataItem = TF.DetailView.UserDefinedGridHelper.handleItemForDateTimeType(dataItem, columns, false);
		return dataItem;
	};

	UserDefinedGridHelper.handleItemForDateTimeType = function(dataItem, columns, toClientTimeZone)
	{
		if (!columns || !columns.length)
		{
			return dataItem;
		}
		columns.forEach(col =>
		{
			if (col.FieldName === "CreatedOn" || col.FieldName === "LastUpdatedOn") // only convert for CreatedOn/LastUpdatedOn
			{
				let value = dataItem[col.FieldName];
				if (value) // skip the empty value
				{
					// RW-18022
					// the original value is utc string with browser time zone subtracted (2022/3/23 17:15 (+8) => "2022/03/23T09:15:00Z")
					// convert to iso string with browser time zone added ("2022/03/23T09:15:00Z" => "2022/03/23T17:15:00")
					value = toISOStringWithoutTimeZone(moment(value));
					if (toClientTimeZone)
					{
						// for copy action, the client time zone would be considered on getting content string
						// for saveAs action, the client time zone should be considered here for server side exporting
						value = toISOStringWithoutTimeZone(utcToClientTimeZone(value));
					}
					dataItem[col.FieldName] = value;
				}
			}
		});
		return dataItem;
	}

	UserDefinedGridHelper.handleItemForBooleanType = function(dataItem, columns)
	{
		if (columns && columns.length)
		{
			columns.forEach(col =>
			{
				if (col.originalUdfField && col.originalUdfField.type === 'Boolean')
				{
					var item = dataItem[col.FieldName],
						posLabel = col.originalUdfField.positiveLabel,
						negLabel = col.originalUdfField.negativeLabel;

					posLabel = (posLabel == null || posLabel == '') ? true : posLabel;
					negLabel = (negLabel == null || negLabel == '') ? false : negLabel;
					if (item !== null)
					{
						dataItem[col.FieldName] = item == true ? posLabel : negLabel;
					}
					else
					{
						dataItem[col.FieldName] = "";
					}
				}
			});
		}
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
					[PRAMATER_KEY_RELATIONSHIP]: "UDGridDataSources,UDGridFields,UDGridSections"
				}
			},
			{ overlay: false }
		).then(resp =>
		{
			if (resp && Array.isArray(resp.Items))
			{
				// filter UDGrids current datasource availiable
				resp.Items = _.filter(resp.Items, item => item.UDGridDataSources.some(ds => ds.DBID == tf.datasourceManager.databaseId));
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
			return item.Public || item.CreatedBy === tf.authManager.authorizationInfo.authorizationTree.userId || forms.indexOf(item.ID) > -1;
		});
	}

	UserDefinedGridHelper.prototype._getUDGridsByDataTypeId = function(dataTypeId, isPublic)
	{
		var self = this;
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgrids"),
			{
				paramData: {
					"DataTypeId": dataTypeId,
					"Public": isPublic,
					"checkIP": true,
					[PRAMATER_KEY_RELATIONSHIP]: "UDGridFields,UDGridDataSources,UDGridSections"
				}
			},
			{ overlay: false }
		).then(resp =>
		{
			if (resp && Array.isArray(resp.Items))
			{
				// filter UDGrids current datasource availiable
				resp.Items = _.filter(resp.Items, item => item.UDGridDataSources.some(ds => ds.DBID == tf.datasourceManager.databaseId));
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

	UserDefinedGridHelper.prototype.checkUDGridsInIPBoundary = function(id)
	{
		const paramData = {
			"Id": id,
			"requiredIPFilter": true
		};
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgrids"), {
			paramData: paramData
		}, {
			overlay: false
		});
	};

	UserDefinedGridHelper.prototype.checkUDGridsInGeofense = function(coord, geofenceBoundaries)
	{
		const existsGeoBoundaries = !!geofenceBoundaries;
		if (existsGeoBoundaries && tf.map && tf.map.ArcGIS)
		{
			const geoBoundaries = JSON.parse(geofenceBoundaries);
			const point = tf.map.ArcGIS.webMercatorUtils.geographicToWebMercator(new tf.map.ArcGIS.Point({ x: coord.longitude, y: coord.latitude }));
			return geoBoundaries.boundaries.length === 0 || geoBoundaries.boundaries.some(boundary =>
			{
				let polygon = tf.map.ArcGIS.Polygon.fromJSON(boundary.geometry);
				polygon = tf.map.ArcGIS.webMercatorUtils.geographicToWebMercator(tf.map.ArcGIS.webMercatorUtils.webMercatorToGeographic(polygon));
				return polygon.contains(point);
			});
		}
		else
		{
			return true; // no geofence setting
		}
	};

	UserDefinedGridHelper.prototype.getUDGridById = function(id)
	{
		return this.getRawUDGridById(id).then(items =>
		{
			if (Array.isArray(items))
			{
				// filter UDGrids current datasource availiable
				items = _.filter(items, item => item.UDGridDataSources.some(ds => ds.DBID === tf.datasourceManager.databaseId));
				items.forEach(item =>
				{
					item.UDGridFields = this._updateUserDefinedGridFields(item.UDGridFields);
				});

				return items;
			}

			return [];
		})
	};

	UserDefinedGridHelper.prototype.getRawUDGridById = function(id)
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgrids"),
			{
				paramData: {
					"Id": id,
					"checkIP": true,
					[PRAMATER_KEY_RELATIONSHIP]: "UDGridFields,UDGridDataSources,UDGridSections,RoleForms"
				}
			},
			{ overlay: false }
		).then(res =>
		{
			return res.Items || [];
		})
	}

	UserDefinedGridHelper.prototype.getUDGridColumns = function(res)
	{
		let columns = [];
		let specialColumns = [];

		this.resetUDFIndex(res[0]);
		let sortFields = res[0].UDGridFields.sort(function(a, b)
		{
			return a.Index - b.Index;
		});
		sortFields.forEach(col =>
		{
			const saveValueWithForm = col.FieldOptions?.SaveValueWithForm;
			if (col.type === 'SystemField' && !saveValueWithForm)
			{
				return;
			}

			var column = {
				FieldName: col.Guid,
				//DisplayName: originFieldMapping[col],
				DisplayName: TF.DetailView.UserDefinedGridHelper.formatContent(col.title),
				Width: '150px',
				Index: col.Index,
				type: 'string',
				QuestionTypeId: col.editType.TypeId,
				questionType: col.questionType
			};
			if (col.section)
			{
				column.DisplayName = TF.DetailView.UserDefinedGridHelper.formatContent(`${col.section} - ${column.DisplayName}`);
			}
			switch (col.type)
			{
				case "Date/Time":
					column.type = "datetime",
						column.template = function(item)
						{
							let value = item[col.Guid];
							if (value === "")
							{
								return "";
							}
							let dt = moment(value);
							return dt.isValid() ? dt.format("MM/DD/YYYY hh:mm A") : "";
						};
					break;
				case "Date":
					column.type = "date",
						column.template = function(item)
						{
							let value = item[col.Guid];
							if (value === "")
							{
								return "";
							}
							let date = moment(value);
							return date.isValid() ? moment(value).format("MM/DD/YYYY") : "";
						};
					break;
				case "Time":
					column.type = "time",
						column.template = function(item)
						{
							let value = item[col.Guid];
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
					break;
				case "List":
					column.template = function(item)
					{
						let value = item[col.Guid];
						if (value instanceof Array)
						{
							return value.join(", ");
						}
						return isNullObj(value) ? "" : value;
					};
					break;
				case "Boolean":
					column.type = "boolean",
						column.template = function(item)
						{
							let value = item[col.Guid];
							if (isNullObj(value))
							{
								return '';
							}

							return (value === true || value === 'true') ? col.positiveLabel : col.negativeLabel || value;
						};
					break;
				case "SignatureBlock":
					column.type = "boolean";
					column.template = function(item)
					{
						let checked = (item[col.Guid] === 'true');
						return `<div class='signature-checkbox-container'>
										<input type='checkbox' disabled class='signature-checkbox' ${checked ? 'checked' : ''}/>
									</div>`;
					};
					column.formatCopyValue = function(value)
					{
						return value == null ? "" : `${value}`;
					};
					break;
				case "Number":
				case "Currency":
					column.type = "number";
					column.template = function(item)
					{
						let value = item[col.Guid];
						if (value == null || value === undefined || value === "")
						{
							return "";
						}

						const precision = col.FieldOptions.TypeName === 'Currency' ? col.FieldOptions.MaxLength : col.FieldOptions.NumberPrecision;
						if (isNaN(Number(value)))
						{
							value = 0;
						}
						return Number(value).toFixed(_.isNumber(precision) ? precision : 0);

					};
					break;
				case "Phone Number":
					column.template = function(item)
					{
						let value = item[col.Guid];
						if (isNullObj(value))
						{
							return '';
						}
						value = tf.dataFormatHelper.phoneFormatter(value);
						return value;
					};
					break;
				case "AttachBlock":
					column.type = "integer";
					break;
				case "Map":
					let xyCoordColumns = TF.DetailView.UserDefinedGridHelper.convertMapColumnToMapXYCoordColumns(column);
					specialColumns = xyCoordColumns;
					break;
			}

			if ((col.questionType === "Phone") && (column.template === undefined))
			{
				column.template = function(item)
				{
					let value = item[col.Guid];
					if (isNullObj(value)) return '';
					value = tf.dataFormatHelper.phoneFormatter(value);
					return value;
				};
			}

			if (col.questionType === "ListFromData" || (col.questionType === "List" && col.FieldOptions.PickListMultiSelect))
			{
				let fieldName = column.FieldName;
				column.type = "select";
				column.ListFilterTemplate = this.generateListFilterTemplate(col, "");
				column.ListFilterTemplate.filterField = fieldName;
				column.ListFilterTemplate.columnSources = [{ FieldName: fieldName, DisplayName: column.DisplayName, Width: "150px", type: "string", isSortItem: true }];
				// add AllItems 
				column.ListFilterTemplate.requestOptions = this.getRequestOption(col);
			}

			if (col.questionType === "ListFromData" && col.template !== undefined && column.template === undefined)
			{
				column.template = col.template;
			}

			if (col.questionType === "List")
			{
				let pickUpList = [];
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

	UserDefinedGridHelper.prototype.getRequestOption = function(col)
	{
		const filterSet = {}, requestOption = {};
		const uDGridID = col.UDGridID;
		const defaultFilter = tf.udgHelper.getUDGridIdFilter(uDGridID);
		filterSet["FilterItems"] = [];
		filterSet["FilterItems"].push(...defaultFilter);
		filterSet["FilterSets"] = [];
		filterSet["LogicalOperator"] = "and";
		requestOption.data = {};
		requestOption.data.fields = [col.Guid];
		requestOption.data.filterSet = filterSet;
		requestOption.data.filterSet.UDGridID = uDGridID;

		return requestOption;
	}

	UserDefinedGridHelper.prototype.generateListFilterTemplate = function(listUdf, gridType)
	{
		var template = {
			UDGridID: listUdf.UDGridID,
			listFilterType: "WithSearchGrid",
			DisplayFilterTypeName: listUdf.Name,
			GridType: "Form",
			_gridType: "form",
			OriginalName: listUdf.DisplayName,
			getUrl: function()
			{
				return pathCombine(tf.api.apiPrefix(), "search", "formresults");
			}
		};

		return template;
	};

	UserDefinedGridHelper.prototype.getUDGridsByDataType = function(dataType, isPublic)
	{
		const dataTypeId = tf.dataTypeHelper.getId(dataType);
		return this._getUDGridsByDataTypeId(dataTypeId, isPublic);
	};

	UserDefinedGridHelper.prototype.resetUDFIndex = function(udGrid)
	{
		if (!udGrid)
		{
			return;
		}

		if (!udGrid.UDGridSections || !udGrid.UDGridSections.length)
		{
			return;
		}

		if (!udGrid.UDGridFields || !udGrid.UDGridFields.length)
		{
			return;
		}

		udGrid.UDGridFields.forEach(f =>
		{
			const sections = udGrid.UDGridSections.filter(s => s.Id === f.UDGridSectionId);
			if (sections.length)
			{
				f.Index = sections[0].Sequence * 10000 + f.Index;
			}
		});
	}

	UserDefinedGridHelper.prototype.getNameToGuidMappingOfGridFields = function(udGrid)
	{
		const gridFields = Array.isArray(udGrid.UDGridFields) ? _.sortBy(udGrid.UDGridFields, 'Index') : [];
		var nameToGuidDict = {};

		gridFields.forEach(gf =>
		{
			nameToGuidDict[gf.Name] = gf.Guid;
		});
		return nameToGuidDict;
	};

	UserDefinedGridHelper.prototype.getGuidToNameMappingOfGridFields = function(udGrid, excludeSystemField, excludeSignedFields)
	{
		this.resetUDFIndex(udGrid);
		const gridFields = Array.isArray(udGrid.UDGridFields) ? _.sortBy(udGrid.UDGridFields, 'Index') : [];
		var guidToNameDict = {};

		gridFields.forEach(gf =>
		{
			const saveValueWithForm = gf.FieldOptions?.SaveValueWithForm;
			if (excludeSystemField && gf.type === 'SystemField' && !saveValueWithForm)
			{
				return;
			}
			var formatedUDGridFields = TF.DetailView.UserDefinedGridHelper.formatContent(gf.section ? `${gf.section} - ${gf.Name}` : gf.Name);
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
				let gridOption = JSON.parse(udGrid.GridOptions);
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
		return true;
	};

	UserDefinedGridHelper.prototype.getIsReadOnlyBasedOnSignedPolicy = function(selectedRecord, udgridFields)
	{
		const signatureFileds = udgridFields.filter(u =>
		{
			return u.Type === 15
		}).map(u => u.Guid);
		return signatureFileds.some(f => selectedRecord[f] === "true" || (selectedRecord[f] && selectedRecord[f].includes("data:image")));
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
		let self = this,
			udGridId = udGrid.ID,
			guidToNameDict = self.getGuidToNameMappingOfGridFields(udGrid);

		let relationships = "User,DocumentUDGridRecords,MapUDGridRecords";
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
				return self.getFormRecord(guidToNameDict, rr, udGrid);
			});
		});
	};

	UserDefinedGridHelper.prototype.getFormRecord = function(formQuestionGuidToNameDict, rawFormRecord, udGrid)
	{
		let convertedRecord = null;
		if (!!rawFormRecord && !!rawFormRecord.RecordValue)
		{
			let recordValueObj = JSON.parse(rawFormRecord.RecordValue);
			convertedRecord = {};
			convertedRecord.Id = rawFormRecord.ID;
			for (let fguid in formQuestionGuidToNameDict)
			{
				if (rawFormRecord.DocumentUDGridRecords && rawFormRecord.DocumentUDGridRecords.some(dr => dr.UDGridField === fguid))
				{
					convertedRecord[fguid] = rawFormRecord.DocumentUDGridRecords.filter(dr => dr.UDGridField === fguid).length;
				}
				else if (rawFormRecord.MapUDGridRecords && rawFormRecord.MapUDGridRecords.some(dr => dr.UDGridField === fguid))
				{
					let mapData = rawFormRecord.MapUDGridRecords.filter(dr => dr.UDGridField === fguid);
					let data = mapData && mapData.length && mapData[0];

					convertedRecord[fguid] = data.ShapeData == "true";
					let xCoordFieldName = TF.DetailView.UserDefinedGridHelper.getXCoordFieldName(fguid);
					convertedRecord[xCoordFieldName] = data.XCoord;
					let yCoordFieldName = TF.DetailView.UserDefinedGridHelper.getYCoordFieldName(fguid);
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
		}

		//Created By / Last Updated By / Last Updated On
		TF.DetailView.UserDefinedGridHelper.getUpdatedInfoColumns().forEach(c =>
		{
			if ((c.FieldName === "CreatedByUserName" || c.FieldName === "LastUpdatedByUserName") && udGrid.Public)
			{
				convertedRecord[c.FieldName] = rawFormRecord[c.FieldName] || "Public";
			}
			else
			{
				convertedRecord[c.FieldName] = rawFormRecord[c.FieldName] || "";
			}
		});

		return convertedRecord;
	};

	UserDefinedGridHelper.prototype._getObjectIds = async function(options)
	{
		let { dataTypeId, dbId, recordIds } = options;
		dbId = dbId || tf.datasourceManager.databaseId;

		const dataTypeKey = tf.dataTypeHelper.getKeyById(dataTypeId);
		if (dataTypeKey === "contact")
		{
			return Promise.resolve(recordIds);
		}

		const opts = {
			paramData: {
				"@fields": "ObjectId",
				"@filter": "in(Id," + recordIds.join(",") + ")"
			}
		}

		const apiPrefix = `${tf.api.apiPrefixWithoutDatabase()}/${dbId}`;
		const dataTypeEndPoint = tf.dataTypeHelper.getEndpoint(dataTypeKey);
		const url = pathCombine(apiPrefix, `${dataTypeEndPoint}?dateTime=${new Date().toISOString().split("T")[0]}`);
		const objectIds = await tf.promiseAjax.get(url, opts, { overlay: false })
			.then(resp =>
			{
				return resp.Items.map((i) => i.ObjectId);
			});

		return objectIds;
	}

	UserDefinedGridHelper.prototype.addUDGridRecordOfEntity = async function(udGrid, dataTypeId, entityId, record)
	{
		let self = this,
			udGridId = udGrid.ID,
			guidToNameDict = self.getGuidToNameMappingOfGridFields(udGrid),
			rawRecord = {
				DBID: tf.datasourceManager.databaseId,
				RecordDataType: dataTypeId,
				RecordID: entityId,
				UDGridID: udGridId,
				RecordObjectID: null,
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
			recordValueObj["latitude"] = record["latitude"];
			recordValueObj["longitude"] = record["longitude"];
		}

		rawRecord.RecordValue = JSON.stringify(recordValueObj);
		rawRecord.RecordVersion = TF.DetailView.UserDefinedGridHelper.RECORD_VERSION;
		let paramData = {};
		if (record.DocumentUDGridRecords)
		{
			rawRecord.DocumentUDGridRecords = record.DocumentUDGridRecords;
			if (paramData[PRAMATER_KEY_RELATIONSHIP])
			{
				paramData[PRAMATER_KEY_RELATIONSHIP] += ",";
			}
			paramData[PRAMATER_KEY_RELATIONSHIP] = paramData[PRAMATER_KEY_RELATIONSHIP] || "";
			paramData[PRAMATER_KEY_RELATIONSHIP] += "DocumentUDGridRecords";
		}

		if (record.MapUDGridRecords)
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

	UserDefinedGridHelper.prototype.addSurveyUDGridRecordOfEntity = async function(udGrid, dataTypeId, entityId, record, udgridSurvey)
	{
		let self = this,
			udGridId = udGrid.ID,
			guidToNameDict = self.getGuidToNameMappingOfGridFields(udGrid),
			guid = udgridSurvey.Guid,
			rawRecord = {
				DBID: tf.datasourceManager.databaseId,
				RecordDataType: dataTypeId,
				RecordID: entityId,
				UDGridID: udGridId,
				RecordObjectID: null,
				RecordValue: null,
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
			recordValueObj["latitude"] = record["latitude"];
			recordValueObj["longitude"] = record["longitude"];
		}

		rawRecord.RecordValue = JSON.stringify(recordValueObj);
		rawRecord.RecordVersion = TF.DetailView.UserDefinedGridHelper.RECORD_VERSION;
		let paramData = {};
		if (record.DocumentUDGridRecords)
		{
			rawRecord.DocumentUDGridRecords = record.DocumentUDGridRecords;
			if (paramData[PRAMATER_KEY_RELATIONSHIP])
			{
				paramData[PRAMATER_KEY_RELATIONSHIP] += ",";
			}
			paramData[PRAMATER_KEY_RELATIONSHIP] = paramData[PRAMATER_KEY_RELATIONSHIP] || "";
			paramData[PRAMATER_KEY_RELATIONSHIP] += "DocumentUDGridRecords";
		}

		if (record.MapUDGridRecords)
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
			paramData["guidValue"] = guid;
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
				if (udGrid.UDGridFields.filter(x => x.format === "Phone").map(x => x.Guid).includes(fguid))
				{
					recordValueObj[fguid] = tf.dataFormatHelper.getPurePhoneNumber(record[fguid]);
				} else
				{
					recordValueObj[fguid] = record[fguid];
				}
			}
		}
		recordValueObj["latitude"] = record["latitude"];
		recordValueObj["longitude"] = record["longitude"];
		patchItem.Value = JSON.stringify(recordValueObj);
		let patchData = [patchItem], paramData = { "@filter": `eq(ID,${record.Id})` };
		if (record.DocumentUDGridRecords)
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

		if (record.MapUDGridRecords)
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

	UserDefinedGridHelper.prototype.deleteUDGridRecordOfEntity = function(recordIds)
	{
		return tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgridrecords"),
			{
				paramData: {
					"@filter": `in(ID,${recordIds.join(",")})`
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

		var today = (new Date()).toDateString(), self = this;

		return items.map(function(item)
		{
			var editType,
				result,
				fieldOptions = typeof item.FieldOptions === "string" ? JSON.parse(item.FieldOptions) : item.FieldOptions,
				type = item.TypeName || item.FieldOptions.TypeName || item.FieldOptions.Type;

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
					if (precision != null)
					{
						var format = 0;
						format = format.toFixed(parseInt(precision)).toString();
						result["format"] = format;
					}
					break;
				case 'Currency':
					var currencyPrecision = fieldOptions.MaxLength,
						nullCurrencyPrecision = (currencyPrecision === 0 || currencyPrecision === null);
					editType = {
						"format": "Number",
						"maxLength": 10 + (nullCurrencyPrecision ? 0 : (1 + currencyPrecision)),
						"maxValue": 9999999999 + (nullCurrencyPrecision ? 0 : (1 - (Math.pow(10, -1 * currencyPrecision))))
					};
					result = {
						"field": item.Name,
						"title": item.Name,
						"type": "Number",
						"editType": editType,
						"questionType": type
					};
					if (currencyPrecision != null)
					{
						var format = 0;
						format = format.toFixed(parseInt(currencyPrecision)).toString();
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
				case 'List From Data':
					result = self.updateListFormData(item);
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
							},
						"questionType": type
					};
					break;
				case 'Rating Scale':
					var ratingItems = Array.from({ length: fieldOptions.Scale }, (_, i) => i + 1);
					var defaultItems = ratingItems.filter(function(item)
					{
						return 1;
					});
					var getSource = function()
					{
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
							"getSource": function() { return Promise.resolve(getSource()); },
							"allowNullValue": true,
							"entityKey": ""
						},
						"questionType": "Rating"
					};
					break;
				case 'Rating Scale Matrix':
					var ratingItems = Array.from({ length: fieldOptions.Scale }, (_, i) => i + 1);
					var getSource = function()
					{
						return ratingItems;
					};
					result = {
						"field": item.Name,
						"title": item.Name,
						"type": "String",
						"defaultValue": "Rating Value Matrix",
						"editType": {
							"format": "DropDown",
							"getSource": function() { return Promise.resolve(getSource()); },
							"allowNullValue": true,
							"entityKey": ""
						},
						"questionType": "RatingScaleMatrix"
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
				case 'Attachment':
					result = {
						"field": item.Name,
						"title": item.Name,
						"type": "AttachBlock",
						"questionType": "AttachBlock",
						"editType": {}
					};
					break;
				case 'Signature':
					result = {
						"field": item.Name,
						"title": item.Name,
						"type": "SignatureBlock",
						"questionType": "SignatureBlock",
						"editType": {}
					};
					break;
				case 'Map':
					result = {
						"field": item.Name,
						"title": item.Name,
						"type": "Map",
						"questionType": "Map",
						"editType": {}
					};
					break;
				case 'QR and Barcode':
					editType = {
						"format": "Note",
						"maxLength": fieldOptions.MaxLength || 2000
					};
					result = {
						"field": item.Name,
						"title": item.Name,
						"type": "String",
						"questionType": "QRandBarcode",
						"editType": editType
					};
					break;
				default:
					break;
			}

			if (result)
			{
				result.UDGridFieldId = item.ID ? item.ID : item.UDGridFieldId;
				result.UDGridID = item.UDGridID;
				result.editType["TypeId"] = item.Type;
				result.Index = item.Index;
				result.Guid = item.Guid;
				result.section = item.SectionName;
				result.Name = item.Name;
				result.FieldOptions = fieldOptions;
				result.Required = item.Required;
				result.OriginItem = item;
				result.UDGridSectionId = item.UDGridSectionId;
			}

			return result;
		});
	};

	UserDefinedGridHelper.prototype.updateListFormData = function(item)
	{
		var self = this, result = {
			"field": item.Name,
			"title": item.Name,
			"type": "String",
			"editType": {},
			"questionType": "ListFromData"
		};

		if (item.FieldOptions)
		{
			var options = item.FieldOptions;
			if (typeof item.FieldOptions === 'string')
			{
				options = JSON.parse(item.FieldOptions);
			}
			var dataType = options['UDFPickListOptions'] ? options['UDFPickListOptions'].dataType : "";
			var fieldName = options['UDFPickListOptions'] && options['UDFPickListOptions']['field'] ? options['UDFPickListOptions']['field'].name : "";

			if (dataType === "trip")
			{
				switch (fieldName)
				{
					case "RidershipStatus":
						result = {
							"field": item.Name,
							"title": item.Name,
							"type": "String",
							"editType": {},
							"questionType": "ListFromData",
							template: function(resValue)
							{
								return UserDefinedGridHelper.getRidershipStatusTemp(resValue, item.Guid);
							}
						};
						break;
					case "PolicyDeviation":
						result = {
							"field": item.Name,
							"title": item.Name,
							"type": "String",
							"editType": {},
							"questionType": "ListFromData",
							template: function(resValue)
							{
								return UserDefinedGridHelper.getPolicyDeviationTemp(resValue, item.Guid);
							}
						};
						break;
					default:
						break;
				}
			}
		}

		return result;
	};

	UserDefinedGridHelper.getPolicyDeviationTemp = function(resValue, guidValue)
	{
		let tempResult = "";
		if (resValue[guidValue])
		{
			var splitValues = resValue[guidValue].split(",");
			splitValues.forEach((value) =>
			{
				if (value.trim() === '37')
				{
					tempResult += `<div style="display: inline-block;" class="grid-icon grid-icon-reddot"></div>`;
				}
			});
			if (tempResult === "")
			{
				tempResult = "<div></div>";
			}
		}
		else
		{
			tempResult = "<div></div>";
		}
		return tempResult;
	};

	UserDefinedGridHelper.getRidershipStatusTemp = function(resValue, guidValue)
	{
		let tempResult = "";
		if (resValue[guidValue])
		{
			var splitValues = resValue[guidValue].split(",");
			splitValues.forEach((value) =>
			{
				if (value.trim() === '37')
				{
					tempResult += `<div style="display: inline-block;" class="grid-icon grid-icon-reddot"></div>`;
				}
				else if (value.trim() === '39')
				{
					tempResult += `<div style="display: inline-block;" class="grid-icon grid-icon-yellowdot"></div>`;
				}
			});
			if (tempResult === "")
			{
				tempResult = "<div></div>";
			}
		}
		else
		{
			tempResult = "<div></div>";
		}
		return tempResult;
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
		let udGridDataPoint = dataPointsJSON[gridType][USER_DEFINED_GROUP].find(udGrid => udGrid.ID == udGridId);
		if (!udGridDataPoint)
		{
			udGridDataPoint = dataPoint
		}

		let layout = {
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

	UserDefinedGridHelper.prototype.addEditUDFGroupRecordInQuickAddModal = function(udGrid, gridType, baseRecordEntity, udgRecord, dataPoint, gridFilterOptions)
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
		const restrictionMessageWarpper = {};
		let errorMessage = TF.DetailView.UserDefinedGridHelper.DEFAULT_FORM_NOT_AVAILABLE_MESSAGE;
		let getPublicTokenPromise = Promise.resolve();
		if (options.udGrid.Public)
		{
			getPublicTokenPromise = TF.DetailView.UserDefinedGridHelper.getPublicFormTokenbyId(options.udGrid.ID, true);
		}
		let validPromise = Promise.resolve();
		if (options.isUDFGroup)
		{
			let filterOptions = {};
			if (udgRecord)
			{
				filterOptions = {
					activeFilter: gridFilterOptions && gridFilterOptions.activeFilter,
					expiredFilter: false,//gridFilterOptions && gridFilterOptions.expiredFilter,
					ipRangeFilter: false,
					geofenseFilter: false,
					gridDataEditFilter: !udGrid.isReadOnly
				}
			}
			validPromise = Promise.resolve()
				.then(() =>
				{
					tf.loadingIndicator.showImmediately();
					return tf.udgHelper.queryValidUDGridById(udGrid.ID, filterOptions, restrictionMessageWarpper);
				})
				.then(validUDGrid =>
				{
					if (restrictionMessageWarpper.message)
					{
						errorMessage = restrictionMessageWarpper.message;
					}
					tf.loadingIndicator.tryHide();
					if (!validUDGrid)
					{
						return Promise.reject();
					}
					return getPublicTokenPromise;
				});
		}

		return validPromise
			.then((res) =>
			{
				if (res)
				{
					tf.authManager.surveyToken = res;
				}
				const modalVm = new TF.DetailView.BasicQuickAddModalViewModel(options);
				modalVm.title(null);
				modalVm.obEnableEsc(false);
				return tf.modalManager.showModal(modalVm);
			})
			.catch(function()
			{
				tf.authManager.surveyToken = undefined;
				tf.promiseBootbox.alert(errorMessage, 'Not Available');
			});
	};

	UserDefinedGridHelper.prototype.getDataPointByIdentifierAndGrid = function(udGridFieldId, udGridId, gridType)
	{
		const udGridDataPoint = dataPointsJSON[gridType][USER_DEFINED_GROUP].filter(udGrid => udGrid.ID == udGridId)[0];
		const udGridFieldDataPoint = udGridDataPoint.UDGridFields.filter(udGridField => udGridField.UDGridFieldId == udGridFieldId);

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

	UserDefinedGridHelper.isActiveForm = function(udgrid)
	{
		if (!udgrid.HasActiveOn)
		{
			return true;
		}
		var formActiveDateTime = udgrid.ActiveOn;
		var currentActiveOn = formActiveDateTime;
		if (formActiveDateTime)
		{
			if (!formActiveDateTime.endsWith("Z") || !formActiveDateTime.endsWith("z"))
			{
				currentActiveOn += "Z";
			}
			var dateNow = new Date();
			var currentActiveOnDate = new Date(currentActiveOn);
			return currentActiveOnDate < dateNow;
		}
		return true;
	}

	UserDefinedGridHelper.isExpiredForm = function(udgrid)
	{
		if (!udgrid.HasExpiredOn)
		{
			return false;
		}
		var formExpiredDateTime = udgrid.ExpiredOn;
		var currentExpiredOn = formExpiredDateTime;
		if (formExpiredDateTime)
		{
			if (!formExpiredDateTime.endsWith("Z") || !formExpiredDateTime.endsWith("z"))
			{
				currentExpiredOn += "Z";
			}
			var dateNow = new Date();
			var currentExpiredOnDate = new Date(currentExpiredOn);
			return currentExpiredOnDate < dateNow;
		}
		return false;
	}

	UserDefinedGridHelper.prototype.isFormReadonly = function(formId, selectedRecord, dataType, isReadOnlyAsEditable = false)
	{
		var self = this;
		return self.getUDGridById(formId).then(res =>
		{
			const result = { UDGridFields: null, IsFormInvalid: true, isPublic: false };
			if (res.length > 0 && res[0])
			{
				result.UDGridFields = res[0].UDGridFields.map(q =>
				{
					q.Type = q.editType.TypeId;
					return q;
				});

				result.IsFormInvalid = false;
				result.isPublic = res[0].Public;
				result.OneResponsePerRecipient = res[0].OneResponsePerRecipient;
			}
			return result;
		}).then(result =>
		{
			let flag = result.IsFormInvalid;
			if (selectedRecord)
			{
				var dataTypeName = (tf.dataTypeHelper.getKeyById(dataType) || "").toLowerCase();
				var authRule = isReadOnlyAsEditable ? "read" : "edit";
				const isSignedPolicy = tf.udgHelper.getIsReadOnlyBasedOnSignedPolicy(selectedRecord, result.UDGridFields);
				const isOneResponse = result.OneResponsePerRecipient;
				const isAuthDataType = (!result.isPublic && !tf.authManager.isAuthorizedForDataType(dataTypeName, authRule));
				const hasEditPermission = tf.authManager.isAuthorizedFor("formsResults", "edit");
				flag = flag || isSignedPolicy
					|| isOneResponse
					|| isAuthDataType
					|| !hasEditPermission;
			} else
			{
				const hasAddPermission = tf.authManager.isAuthorizedFor("formsResults", "add");
				flag = flag || !hasAddPermission;
			}

			return flag;
		});
	};

	UserDefinedGridHelper.getPublicFormTokenbyId = function(formId, isPublic)
	{
		const ret = "";
		if (!formId)
		{
			return Promise.reject(ret);
		}

		if (isPublic)
		{
			if (tf.authManager.surveyToken !== "" && tf.authManager.surveyToken !== undefined && tf.authManager.surveyToken !== null)
			{
				return Promise.resolve(tf.authManager.surveyToken);
			}
			return this.getNewSurvey(formId)
				.then(function(udgSurvey)
				{
					if (!udgSurvey)
					{
						return ret;
					}

					return udgSurvey.PublicURL ? udgSurvey.PublicURL.split("&t=")[1] : undefined;
				});
		}
		else
		{
			return "";
		}
	}

	UserDefinedGridHelper.prototype.tryRemoveBaseRecordDocumentRelationships = function(baseRecordId, dataTypeId, documentIds)
	{
		return tf.udgHelper.getAffectedDocumentUDGridCount(baseRecordId, dataTypeId, documentIds.join())
			.then(res =>
			{
				if (!res)
				{
					return;
				}

				const nonExsitedDocs = documentIds.filter(d => !res[d]);
				if (nonExsitedDocs && nonExsitedDocs.length > 0)
				{
					let msg = nonExsitedDocs.length == 1 ?
						`The last association between UDF groups and document has been removed. Do you want to disassociate the document from current ${self.gridType} record? ` :
						`The last associations between UDF groups and documents have been removed. Do you want to disassociate these documents from current ${self.gridType} record? `;
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

	UserDefinedGridHelper.prototype.bindCounterBoxEvent = function($inputEl, maxlength, $counterEl, preventEnterKey, getLength)
	{
		$inputEl.keyup(ev => 
		{
			if (TF.isMobileDevice || isIpad())
			{
				ev.target.style.height = 'auto';
				ev.target.style.height = ev.target.scrollHeight + 'px';
			}
		}).on('keyup click focus focusin cut paste', ev =>
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

	UserDefinedGridHelper.isAssignedFormIdSync = function(formId)
	{
		if (tf.authManager.authorizationInfo.isAdmin)
		{
			return true;
		}

		return tf.authManager.authorizationInfo.authorizationTree.forms.includes(formId);
	}

	UserDefinedGridHelper.prototype.queryValidUDGridById = function(id, options, restrictionMessageWarpper)
	{
		options = $.extend({}, { ipRangeFilter: true, geofenseFilter: true }, options);
		const self = this,
			paramData = {
				"Id": id,
				"@relationships": 'UDGridDataSources,UDGridFields,UDGridSections'
			};

		if (options.ipRangeFilter)
		{
			paramData.checkIP = true;
		}

		return tf.authManager.updateAuthInfos()
			.then(() =>
			{
				return TF.getLocation();
			})
			.then(coord =>
			{
				options.coord = coord;
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgrids"),
					{
						paramData: paramData
					},
					{ overlay: false }
				).then((ret) =>
				{
					if (!ret || !ret.Items || !ret.Items.length)
					{
						if (restrictionMessageWarpper)
						{
							restrictionMessageWarpper.message = 'You do not have permissions for this form.';
						}
						return [];
					}

					return self.filterValidUDGrids(ret.Items, options, restrictionMessageWarpper)

				}).then(validUDrids =>
				{
					if (!validUDrids || !validUDrids.length)
					{
						return null;
					}
					return validUDrids[0];
				});
			});
	}

	UserDefinedGridHelper.prototype.filterValidUDGrids = function(udgrids, options, restrictionMessageWarpper)
	{
		const defaultFilterOptions = {
			activeFilter: true,
			expiredFilter: true,
			ipRangeFilter: true,
			geofenseFilter: true,
			gridDataReadFilter: true,
			gridDataEditFilter: true,
			sectionFilter: true,
		}
		options = $.extend({}, defaultFilterOptions, options);
		const hasGotLocationValue = function()
		{
			return !options.coord.errorCode && (options.coord.longitude !== null);
		};

		const getIsLocationRequired = function(item)
		{
			let isLocationRequired = true;
			if (item.GridOptions && typeof (item.GridOptions) === "string")
			{
				const gridOptions = JSON.parse(item.GridOptions);
				isLocationRequired = !!gridOptions.IsLocationRequired;
			}
			return isLocationRequired;
		};

		const currentDBID = tf.datasourceManager.databaseId || tf.surveyDBId;

		const countOfFormsBeforeAccessRightCheck = udgrids.length;
		udgrids = _.filter(udgrids, item => item.UDGridDataSources.some(ds => ds.DBID === currentDBID));

		udgrids = _.filter(udgrids, (item) =>
		{
			return item.Public || item.CreatedBy === tf.authManager.authorizationInfo.authorizationTree.userId || TF.DetailView.UserDefinedGridHelper.isAssignedFormIdSync(item.ID);
		});

		if (options.gridDataReadFilter)
		{
			udgrids = _.filter(udgrids, (item) =>
			{
				return item.Public || tf.authManager.isAuthorizedForDataType(tf.dataTypeHelper.getKeyById(item.DataTypeId), "read");
			});
		}

		if (options.gridDataEditFilter)
		{
			udgrids = _.filter(udgrids, (item) =>
			{
				return item.Public || tf.authManager.isAuthorizedForDataType(tf.dataTypeHelper.getKeyById(item.DataTypeId), "edit");
			});
		}

		// section filter
		if (options.sectionFilter)
		{
			udgrids = udgrids.filter((udgrid) =>
			{
				udgrid = TF.DetailView.UserDefinedGridHelper.handleFilterFormData(udgrid);
				return udgrid.UDGridFields.length > 0;
			});
		}

		const countOfFormsBeforeGeoLocationCheck = countOfFormsAfterAccessRightCheck = udgrids.length;

		if ((countOfFormsAfterAccessRightCheck !== countOfFormsBeforeAccessRightCheck)
			&& restrictionMessageWarpper && !restrictionMessageWarpper.message)
		{
			restrictionMessageWarpper.message = 'You do not have permissions for this form.';
		}

		// geolocation filter
		if (options.coord)
		{
			udgrids = udgrids.filter(udgrid => !getIsLocationRequired(udgrid) || hasGotLocationValue());
		}

		const countOfFormsBeforeGeofenseCheck = countOfFormsAfterGeoLocationCheck = udgrids.length;
		if ((countOfFormsBeforeGeoLocationCheck !== countOfFormsAfterGeoLocationCheck)
			&& restrictionMessageWarpper && !restrictionMessageWarpper.message)
		{
			restrictionMessageWarpper.message = 'This form requires your location services to be turned on.';
		}

		// geofence filter
		if (options.coord && options.geofenseFilter)
		{
			udgrids = udgrids.filter((udgrid) =>
			{
				return !getIsLocationRequired(udgrid) || this.checkUDGridsInGeofense(options.coord, udgrid.GeofenceBoundaries);
			});
		}

		const countOfFormsBeforeDateRangeCheck = countOfFormsAfterGeofenseCheck = udgrids.length;

		if ((countOfFormsBeforeGeofenseCheck !== countOfFormsAfterGeofenseCheck)
			&& restrictionMessageWarpper && !restrictionMessageWarpper.message)
		{
			restrictionMessageWarpper.message = 'This form requires this device to be within a specific location to answer.';
		}

		if (options.activeFilter)
		{
			udgrids = udgrids.filter((udgrid) =>
			{
				return TF.DetailView.UserDefinedGridHelper.isActiveForm(udgrid);
			})
		}

		if (options.expiredFilter)
		{
			udgrids = udgrids.filter((udgrid) =>
			{
				return !TF.DetailView.UserDefinedGridHelper.isExpiredForm(udgrid);
			})
		}

		const countOfFormsBeforeIpRangeCheck = countOfFormsAfterDateRangeCheck = udgrids.length;
		if ((countOfFormsBeforeDateRangeCheck !== countOfFormsAfterDateRangeCheck)
			&& restrictionMessageWarpper && !restrictionMessageWarpper.message)
		{
			restrictionMessageWarpper.message = 'This form is not in the selected date range.';
		}

		if (options.ipRangeFilter)
		{
			udgrids = udgrids.filter((udgrid) =>
			{
				return !getIsLocationRequired(udgrid) || udgrid.InIPBoundary;
			})
		}

		const countOfFormsAfterIpRangeCheck = udgrids.length;
		if ((countOfFormsBeforeIpRangeCheck !== countOfFormsAfterIpRangeCheck)
			&& restrictionMessageWarpper && !restrictionMessageWarpper.message)
		{
			restrictionMessageWarpper.message = 'This form doesn’t fall into the designated IP Range.';
		}

		return udgrids;
	};

	UserDefinedGridHelper.prototype.checkUDGridsWithFilterIdInSpecifyRecord = function(dataTypeId, filterId)
	{
		const paramData = {
			"dataTypeId": dataTypeId,
			"filterId": filterId
		};
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgrids"), {
			paramData: paramData
		}, {
			overlay: false
		});
	};

	UserDefinedGridHelper.prototype.timeFieldFilterUpdated = function(item)
	{
		const timeFields = ["CreatedOn", "LastUpdatedOn"];
		const isNilFilter = TF.FilterHelper.dateTimeNilFiltersOperator.includes(item.Operator.toLowerCase());
		const isDateParamFilter = TF.FilterHelper.dateTimeDateParamFiltersOperator.includes(item.Operator.toLowerCase());

		if (timeFields.includes(item.FieldName) && !item.ConvertedToUTC && !isNilFilter && !isDateParamFilter)
		{
			var dt = clientTimeZoneToUtc(item.Value);
			item.Value = toISOStringWithoutTimeZone(dt);
		}
	}

	UserDefinedGridHelper.saveUserdefinedfield = function(udfEntity)
	{
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgrids"), {
			paramData: { "@Relationships": "UDGridFields,UDGridSections,RoleForms" },
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

		if (udfEntity.UDGridSections && udfEntity.UDGridSections.length)
		{
			udfEntity.UDGridSections.forEach(udgridSection =>
			{
				resetFields(udgridSection, ["UDGridID", "UDGridId", "UDGrid", "Id", "id", "ID"]);
				if (udgridSection.UDGridFields && udgridSection.UDGridFields.length)
				{
					udgridSection.UDGridFields.forEach(udgridField =>
					{
						resetFields(udgridField, ["UDGridID", "UDGrid", "Guid", "ID", "id", "UDGridSection", "UDGridSectionId"]);
					});
				}
			});
		}

		function resetFields(entity, toResetFields)
		{
			let fields = Object.keys(entity);
			fields.forEach((f) =>
			{
				if (toResetFields.includes(f))
				{
					entity[f] = null;
					delete entity[f];
				};
			});
		}
	}

	UserDefinedGridHelper.handleUDGridSectionWhenExport = function(dataItem)
	{
		if (dataItem.UDGridSections && dataItem.UDGridSections.length > 0 && dataItem.UDGridFields && dataItem.UDGridFields.length > 0)
		{
			var tempUDGridField = dataItem.UDGridFields;
			dataItem.UDGridFields = [];
			dataItem.UDGridSections.forEach(us =>
			{
				currentFields = tempUDGridField.filter(uf => uf.UDGridSectionId === us.Id);
				us.UDGridFields = currentFields;
			});
		}
	}

	UserDefinedGridHelper.formatHtmlContent = function(questionContent)
	{
		if (!questionContent)
		{
			return questionContent;
		}
		var wrapper = $("<div/>").html(questionContent),
			tables = wrapper.find("table");
		tables.remove();
		return wrapper.text();
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

		let specialColumns = [];
		let fieldName = column.FieldName;
		let displayName = column.DisplayName;

		let xCoordFieldName = TF.DetailView.UserDefinedGridHelper.getXCoordFieldName(fieldName);
		let xCoordColumn = $.extend({}, column, {
			FieldName: xCoordFieldName,
			DisplayName: TF.DetailView.UserDefinedGridHelper.getXCoordDisplayName(displayName),
			template: function(item)
			{
				let fieldName = xCoordFieldName;
				let value = item[fieldName];
				if (value == 0 || !value) return "";
				return value.toFixed(6);
			}
		});
		specialColumns.push(xCoordColumn);

		let yCoordFieldName = TF.DetailView.UserDefinedGridHelper.getYCoordFieldName(fieldName);
		let yCoordColumn = $.extend({}, column, {
			FieldName: yCoordFieldName,
			DisplayName: TF.DetailView.UserDefinedGridHelper.getYCoordDisplayName(displayName),
			template: function(item)
			{
				let fieldName = yCoordFieldName;
				let value = item[fieldName];
				if (value == 0 || !value) return "";
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

		let rawData = JSON.parse(record.ShapeData);
		if (rawData &&
			rawData.length &&
			rawData[0].geometry &&
			rawData[0].geometry.x && rawData[0].geometry.y)
		{
			let lngLat = tf.map.ArcGIS.webMercatorUtils.xyToLngLat(rawData[0].geometry.x, rawData[0].geometry.y);
			record.XCoord = lngLat[0].toFixed(6);
			record.YCoord = lngLat[1].toFixed(6);
		}

		return record;
	}

	UserDefinedGridHelper.getAllActivedPublicForms = function()
	{
		let ret = [];

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgrids"), {
			paramData: {
				"@fields": "id,datatypeid,name,public,hasexpiredon,expiredon,udgriddatasources",
				"@filter": `eq(public, true)`,
				"@relationships": "UDGridDataSources"
			}
		}).then(function(data)
		{
			if (!data.Items || !data.Items.length)
			{
				return ret;
			}

			ret = data.Items.filter((f) =>
			{
				return !f.HasExpiredOn || (f.HasExpiredOn && moment(Date.now()).utc().isBefore(moment(f.ExpiredOn)))
			});

			return ret;
		}).then(function(ret)
		{
			ret = ret.filter((f) =>
			{
				return !f.UDGridDataSources.length ||
					(f.UDGridDataSources.findIndex((el) => { return el.DBID === tf.datasourceManager.databaseId; }) >= 0);
			});

			if (tf.authManager.authorizationInfo.isAdmin)
			{
				return ret;
			}

			return ret.filter((f) =>
			{
				return tf.authManager.isAuthorizedForDataType(tf.dataTypeHelper.getKeyById(f.DataTypeId), "read");
			});
		});
	}

	UserDefinedGridHelper.getFormURLbyId = function(formId, isPublic)
	{
		const ret = "";
		if (!formId)
		{
			return Promise.reject(ret);
		}

		if (isPublic)
		{
			return this.getNewSurvey(formId)
				.then(function(udgSurvey)
				{
					if (!udgSurvey)
					{
						return ret;
					}

					return udgSurvey.PublicURL;
				});
		}
		else
		{
			return this._getFormURL(formId);
		}
	}

	UserDefinedGridHelper._getFormURL = function(formId)
	{
		if (!formId)
		{
			return Promise.resolve(null);
		}

		return tf.authManager.getPurchasedProducts().then(products =>
		{
			const formData = products.filter(p => p.Name.toLowerCase() === 'formfinder');
			if (formData && formData.length && formData[0] && formData[0].Uri)
			{
				return `${formData[0].Uri}/?db=${tf.datasourceManager.databaseId}&formId=${formId}&formOpened=false`;
			}

			return null;
		});
	}

	UserDefinedGridHelper.getNewSurvey = function(formId)
	{
		if (!formId)
		{
			return Promise.resolve(null);
		}

		const newUDGridSurveys = [{
			UDGridID: formId,
			DBID: tf.datasourceManager.databaseId
		}];
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgridsurveys"), { data: newUDGridSurveys }).then(function(data)
		{
			if (!data.Items || !data.Items.length)
			{
				return null;
			}

			return data.Items[0];
		});
	}

	UserDefinedGridHelper.copyPublicFormURL = function(publicFormURL, pageLevelViewModel)
	{
		if (!publicFormURL)
		{
			if (pageLevelViewModel)
			{
				pageLevelViewModel.popupErrorMessage("Failed to get public form link.");
			}

			return;
		}

		const el = document.createElement('textarea');
		el.value = publicFormURL;
		document.body.appendChild(el);
		el.select();
		document.execCommand('copy');
		document.body.removeChild(el);

		if (pageLevelViewModel)
		{
			pageLevelViewModel.popupSuccessMessage("Link copied to clipboard and is ready for you to paste.");
		}
	}

	UserDefinedGridHelper.IsUDGridWithSubmission = function(udGridId)
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgridrecords"), {
			paramData: {
				UDGridID: udGridId,
				"@count": true
			}
		}).then((cnt) =>
		{
			return cnt > 0;
		});
	}

	UserDefinedGridHelper.isFormExpired = function(options)
	{
		options = options || {};
		const isPublic = !!options.Public;
		const hasExpiredOn = !!options.HasExpiredOn;
		const expiredOn = options.ExpiredOn;
		return isPublic && hasExpiredOn && moment(Date.now()).utc().isAfter(moment.utc(expiredOn));
	}

	UserDefinedGridHelper.prototype.getUDGridRecordsWithCreatedBy = function(udGridId, dataTypeId)
	{
		const userId = tf.authManager.authorizationInfo.authorizationTree.userId;
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgridrecords"),
			{
				paramData: {
					DBID: tf.datasourceManager.databaseId,
					RecordDataType: dataTypeId,
					UDGridID: udGridId,
					CreatedBy: userId
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
		});
	};

	UserDefinedGridHelper.prototype.getUDGridRecordsWithRecordId = function(udGridId, dataTypeId, recordId)
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgridrecords"),
			{
				paramData: {
					DBID: tf.datasourceManager.databaseId,
					RecordDataType: dataTypeId,
					RecordId:recordId,
					UDGridID: udGridId
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
		});
	};

	UserDefinedGridHelper.getFormSearchDataOptions = async function(searchValue, dbId, dataType, isSearchAll, specifyOptions)
	{
		const value = (searchValue || '').trim(),
			config = TF.Form.formConfig[dataType],
			sortItems = config.sortItems,
			generatedItems = config.generateFilterItems(config.filterItems, value),
			filterItems = generatedItems.filterItems,
			filterSets = generatedItems.filterSets;
		let filterSet;

		if (isSearchAll)
		{
			filterSet = new TF.FilterSet(generatedItems.logicOperator, '', filterSets);
		}
		else
		{
			filterSet = new TF.FilterSet(generatedItems.logicOperator, filterItems, filterSets);
		}

		const opts = {
			paramData: {
				take: 10,
				skip: 0,
				getCount: true
			},
			data: {
				fields: config.fields,
				sortItems: sortItems,
				idFilter: null,
				filterSet: filterSet,
				isQuickSearch: false,
				filterClause: ""
			}
		};
		if (specifyOptions.TypeId === SPECIFY_RECORD_TYPE_MY_RECORD ||
			specifyOptions.TypeId === SPECIFY_RECORD_TYPE_ALL)
		{
			return Promise.resolve(opts);
		}
		else if (specifyOptions.TypeId === SPECIFY_RECORD_TYPE_FILTER)
		{
			const getFilterPromise = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridfilters"),
				{
					paramData: {
						"Id": specifyOptions.FilterId
					}
				});

			const getOmittedRecordPromise = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "omittedRecords"),
				{
					paramData: {
						"FilterId": specifyOptions.FilterId,
						"DBID": tf.datasourceManager.databaseId || dbId,
					}
				});

			return Promise.all([getFilterPromise, getOmittedRecordPromise]).then((data) =>
			{
				const filterData = data[0];
				const omittedRecordData = data[1];

				const filter = filterData.Items[0];

				if (filter)
				{
					const omittedRecords = omittedRecordData.Items.map((o) =>
					{
						return o.OmittedRecordID;
					});

					const filterOption = {
						filterClause: filter.WhereClause,
						idFilter: {
							ExcludeAny: omittedRecords
						}
					};

					$.extend(opts.data, filterOption);
				}

				return Promise.resolve(opts);
			});
		}
		else if (specifyOptions.TypeId === SPECIFY_RECORD_TYPE_SPECIFIC)
		{
			opts.data.idFilter = {
				IncludeOnly: specifyOptions.SpecificRecordIds
			}

			return Promise.resolve(opts);
		}
	};

	UserDefinedGridHelper.getFormSearchData = function(searchValue, dbId, dataType, isSearchAll, specifyOptions)
	{
		return this.getFormSearchDataOptions(searchValue, dbId, dataType, isSearchAll, specifyOptions)
			.then((opts) =>
			{
				return this.fetchFormSearchData(opts, dbId, dataType);
			})
	};

	UserDefinedGridHelper.isOnlyOneRecord = async function(searchValue, dbId, dataType, isSearchAll, specifyOptions)
	{
		let isOnlyOneRecord = false;

		try
		{
			const opts = await this.getFormSearchDataOptions(searchValue, dbId, dataType, isSearchAll, specifyOptions)

			this.noRightFetchingData = false;
			const apiPrefix = `${tf.api.apiPrefixWithoutDatabase()}/${dbId}`;

			opts.data.fields = ['id'];
			delete opts.data.sortItems;
			opts.paramData = { take: 2, skip: 0, getCount: true };

			let res = await tf.promiseAjax.post(pathCombine(apiPrefix,
				"search",
				`${tf.dataTypeHelper.getEndpoint(dataType)}`,
				`id?dateTime=${new Date().toISOString().split("T")[0]}`,
			),
				opts,
				{ overlay: false });

			isOnlyOneRecord = res.Items.length === 1;
		}
		catch (e)
		{
			f(ex.StatusCode === 403 && ex.Message === `The roles of this user doesn't have the right to access this API`)
			{
				// Wait this.noRightFetchingData = true;
				console.warn(ex.Message);
			}
		}

		return isOnlyOneRecord;
	}

	UserDefinedGridHelper.fetchFormSearchData = function(opts, dbId, dataType)
	{
		this.noRightFetchingData = false;
		const apiPrefix = `${tf.api.apiPrefixWithoutDatabase()}/${dbId}`;

		return tf.promiseAjax.post(pathCombine(apiPrefix, "search", `${tf.dataTypeHelper.getEndpoint(dataType)}?dateTime=${new Date().toISOString().split("T")[0]}`),
			opts,
			{ overlay: false })
			.then(data =>
			{
				return data;
			}).catch(ex =>
			{
				if (ex.StatusCode === 403 && ex.Message === `The roles of this user doesn't have the right to access this API`)
				{
					// Wait this.noRightFetchingData = true;
					console.warn(ex.Message);
				}
				return {
					FilteredRecordCount: 0,
					Items: [],
					TotalRecordCount: 0
				};
			});
	};

	UserDefinedGridHelper.handleFormSection = function(newOptions)
	{
		if (newOptions.UDGridSections && newOptions.UDGridSections.length > 0 && newOptions.UDGridFields && newOptions.UDGridFields.length > 0)
		{
			newOptions.UDGridSections.forEach((section) =>
			{
				const currentFields = newOptions.UDGridFields.filter((field) =>
				{
					return field.UDGridSectionId === section.Id;
				})
				section.UDGridFields = currentFields;
			});

		}
	};

	UserDefinedGridHelper.handleFilterFormData = function(udgrid)
	{
		//filter fields by section roles
		var isAdmin = tf.authManager.authorizationInfo.isAdmin;
		var isCreatedBy = udgrid.CreatedBy === tf.authManager.authorizationInfo.authorizationTree.userId;
		var isPublic = udgrid.Public === true;

		//check if udgrid is survey or public or isCreateBy
		if (!udgrid || isAdmin || isCreatedBy)
		{
			return udgrid;
		}

		var userEntityRoles = tf.userEntity.UserRoles.map(x => x.RoleID);
		udgrid.UDGridSections = udgrid.UDGridSections.filter(function(section)
		{
			if ((isPublic && section.IsPublic) || (section.RoleSections.length === 0))
			{
				return true;
			}
			for (var singleRole of section.RoleSections)
			{
				if (userEntityRoles.indexOf(singleRole.RoleID) >= 0)
				{
					return true;
				}
			}
			return false;
		});

		var sectionsAllowed = udgrid.UDGridSections.map(x => x.Id);

		udgrid.UDGridFields = udgrid.UDGridFields.filter(function(field)
		{
			return field.UDGridSectionId ? sectionsAllowed.indexOf(field.UDGridSectionId) >= 0 : true;
		});

		//filter menu by Assigned Rights
		var key = tf.dataTypeHelper.getKeyById(udgrid.DataTypeId);
		tf.authManager.isAuthorizedForDataType(key, 'read') || (udgrid.UDGridFields = []);

		return udgrid;
	};

	UserDefinedGridHelper.signedFieldListField = "signedFieldList";

	const SPECIFY_RECORD_TYPE_ALL = 1;
	const SPECIFY_RECORD_TYPE_FILTER = 2;
	const SPECIFY_RECORD_TYPE_MY_RECORD = 3;
	const SPECIFY_RECORD_TYPE_SPECIFIC = 4;

	UserDefinedGridHelper.WITH_MY_RECORD_FILTER_GRID_TYPES = ["staff", "trip", "fieldtrip", "vehicle", "student"];
	UserDefinedGridHelper.initSpecifyRecordOption = function(gridType, specifyRecordOptions, gridOptionIsMyRecordsFilterRequired)
	{
		const isMyRecordsFilterRequired = (this.WITH_MY_RECORD_FILTER_GRID_TYPES.indexOf(gridType) >= 0 && typeof gridOptionIsMyRecordsFilterRequired !== "boolean") ?
			true : !!gridOptionIsMyRecordsFilterRequired;

		const defaultOptions = {
			"TypeId": isMyRecordsFilterRequired ? SPECIFY_RECORD_TYPE_MY_RECORD : SPECIFY_RECORD_TYPE_ALL,
			"SpecificRecordIds": [],
			"FilterId": null
		}

		return $.extend({}, defaultOptions, specifyRecordOptions);
	}

	UserDefinedGridHelper.prototype.getUDGridIdFilter = function(formId)
	{
		return [{
			"FieldName": "UDGridID",
			"Operator": "EqualTo",
			"Value": formId,
			"TypeHint": "String"
		}]
	};

	tf.udgHelper = new TF.DetailView.UserDefinedGridHelper();
})();

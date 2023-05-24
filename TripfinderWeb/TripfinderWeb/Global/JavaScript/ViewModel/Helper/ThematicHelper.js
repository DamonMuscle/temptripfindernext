(function()
{
	var namespace = createNamespace("TF.Helper");

	namespace.ThematicHelper = ThematicHelper;

	const endpoint = "thematicconfigs";
	const DEFAULT_THEMATIC_LABEL = "All Other Values";
	function ThematicHelper()
	{
	}

	ThematicHelper.prototype.constructor = ThematicHelper;

	ThematicHelper.getUrl = function()
	{
		return pathCombine(tf.api.apiPrefixWithoutDatabase(), endpoint);
	};

	/**
	 * convert the data from "has code x" to "Only has code x"
	 * @param {Array} data List of data item.
	 * @param {number} valueIdx Index of "disability code" or "ethnic code"
	 * @returns {void}
	 */
	ThematicHelper.convertCodeData = function(data, valueIdx)
	{
		var self = this, code, codes = [], combineCodes = {},
			valueKey = "Value" + valueIdx, codeValues;
		$.each(data, function(index, item)
		{
			code = item[valueKey];
			if (code !== null && code.indexOf(",") >= 0)
			{
				codes = code.split(",");
				for (var i = 0; i < codes.length; i++)
				{
					codeValues = "";
					for (var j = 1; j <= 3; j++)
					{
						if (j === valueIdx)
						{
							codeValues += "Value" + j + codes[i];
						}
						else
						{
							codeValues += "Value" + j + item["Value" + j];
						}
					}
					if (!combineCodes[codeValues])
					{
						combineCodes[codeValues] = item.Count;
					}
					else
					{
						combineCodes[codeValues] += item.Count;
					}
				}
			}
		});

		$.each(data, function(index, item)
		{
			code = item[valueKey];

			if (code !== null && code.indexOf(",") < 0)
			{
				codeValues = "";
				for (var j = 1; j <= 3; j++)
				{
					codeValues += "Value" + j + item["Value" + j];
				}

				if (combineCodes[codeValues])
				{
					item.Count -= combineCodes[codeValues];
				}
			}
		});
	}

	/**
	 * Set ids into thematic custom display settings, the updated object name is CustomDisplaySetting in parameter 'thematicData'.
	 * The CustomDisplaySetting, DisplaySettingIds, QuickFilters and DataType is a property in the parameter 'thematicData'.
	 * The CustomDisplaySetting is the thematics which would be used for map.
	 * The DisplaySettingIds is the mapping of id and group value.
	 * The QuickFilters is the fields ans filters of this themaitc info, it was edited in the modify thematic modal.
	 * Steps:
	 * 1. Change the QuickFilters from json to object, gets the datafield1, datafield2 and datafield3.
	 * 2. a. Create the hash map(Hash1) of special field(eq. Disability Codes, Ethnic Codes), the hash map includes values which were selected in the thematic grid.
	 *    b. The hash map key is the values of fields in QuickFilters.
	 *    c. Since the array is slow to hash map, so use hash map not array.
	 * 3. a. Create the hash map(Hash2) to group two or more ids if they have the same thematic style, the hash map key is the values of fields in QuickFilters.
	 *    b. This function need to foreach the DisplaySettingIds.
	 *    c. if the setting item is a part of combination, push it into the key 'combination' of hash map.
	 *    d. Since the array is slow to hash map, so create a hash map not use the array 'DisplaySettingIds'.
	 * 4. a. Since the hash map(Hash2) key is values of fields, set the ids of hash map into the CustomDisplaySetting if the values is same to hash map key.
	 *    b. This function need to foreach the CustomDisplaySetting.
	 * 5. Gets all select ids of grid, remove the ids which is in the CustomDisplaySetting, the surplus ids is part of 'All others' thematic style.
	 * @param {Object} thematicData The thematics entity.
	 * @return {void}
	 */
	ThematicHelper.setCustomDisplaySettingIds = function(thematicData, includeOnlyIds, filterSet)
	{
		//Step 1.
		if (thematicData.CustomDisplaySetting != null && !Array.isArray(thematicData.CustomDisplaySetting))
		{
			thematicData.CustomDisplaySetting = JSON.parse(thematicData.CustomDisplaySetting);
		}
		var self = this, specialField = {}, group = {},
			dataFieldHelper = new TF.Map.Thematics.DataFieldHelper(),
			dataType = tf.dataTypeHelper.getKeyById(thematicData.DataTypeID).toLowerCase(),
			datafields = dataFieldHelper.getColumnsByType(dataType === 'student' ? 'unassignedStudents' : dataType),
			quickFilterArray = JSON.parse(thematicData.QuickFilters).map(function(item) { return item.field; }).filter(function(field) { return field }),
			displaySettingIds = thematicData.DisplaySettingIds || [],
			displaySetting = thematicData.CustomDisplaySetting,
			options = {
				type: dataType,
				datafield1: datafields.filter(function(field) { return field.FieldName === quickFilterArray[0] })[0],
				datafield2: datafields.filter(function(field) { return field.FieldName === quickFilterArray[1] })[0],
				datafield3: datafields.filter(function(field) { return field.FieldName === quickFilterArray[2] })[0],
				combinationKeyName: "combination",
				/**
				 * Format the value of field, change the value to upper case. United format the values if the fields' type is date or time,
				 * @param {String} value The value of field.
				 * @param {Object} datafield The field info.
				 * @returns {String} The value after format
				 */
				formatValue: function(value, datafield)
				{
					var formatValue = (value || value === false) ? value.toString().toUpperCase() : value;
					if (formatValue && datafield && datafield.type === "time" && moment(formatValue).format() == "Invalid date")
					{
						formatValue = "1900-01-01T" + formatValue;
					}
					if (formatValue && datafield && (datafield.type === "date" || datafield.type === "time"))
					{
						formatValue = moment(formatValue).format("M/D/YYYY hh:mm:ss A");
					}
					return formatValue;
				},
				includeOnlyIds: includeOnlyIds ? includeOnlyIds : null
			};
		//Setp 2.
		specialField = self.getSpecialField(displaySetting, options);
		//Setp 3.
		group = self.getDisplaySettingIdsGroup(displaySettingIds, specialField, options);
		//Setp 4 & 5.
		return self.getDisplaySettingIncludeIds(displaySetting, group, options, filterSet);
	};

	/**
	 * Create the hash map of special field.
	 * @param {Array} displaySetting The thematic style which would be display in the map.
	 * @param {Object} options Includes the type, datafield, combination key name and the formatValue function.
	 * @returns {Object} The hash map and the sign.
	 */
	ThematicHelper.getSpecialField = function(displaySetting, options)
	{
		var values = {}, sign = null,
			datafield1 = options.datafield1, datafield2 = options.datafield2,
			datafield3 = options.datafield3, formatValue = options.formatValue;

		// Only student grid has the special field.
		if (options.type === "student")
		{
			/**
			 * Create the hash map(Hash1) of special field.
			 * @param {Array} displaySetting The thematic style which would be display in the map.
			 * @param {Object} options Includes the type, datafield, combination key name and the formatValue function.
			 * @returns {Object} The hash map and the sign.
			 */
			function setValues(valueName1, groupName1, groupName2, valueDatafield, groupDatafield1, groupDatafield2)
			{
				if (valueDatafield && (valueDatafield.DBName === "EthnicCode" || valueDatafield.DBName === "DisabililityCode"))
				{
					var setting, count = 0, value1, group1, group2;
					for (var i in displaySetting)
					{
						setting = displaySetting[i];
						value1 = formatValue(setting[valueName1], valueDatafield);
						group1 = formatValue(setting[groupName1], groupDatafield1);
						group2 = formatValue(setting[groupName2], groupDatafield2);
						if (value1)
						{
							if (group2 !== undefined)//Three fields.
							{
								if (!values[group2])
								{
									values[group2] = {};
								}
								if (!values[group2][group1])
								{
									values[group2][group1] = {};
								}
								values[group2][group1][value1] = true;
							}
							else if (group1 !== undefined)//Two fields
							{
								if (!values[group1])
								{
									values[group1] = {};
								}
								values[group1][value1] = true;
							}
							else//One field
							{
								values[value1] = true;
							}
							count++;
						}
					}
					if (count > 0)
					{
						sign = valueName1;
					}
				}
			};

			//Which field is the special field.
			setValues("Value1", "Value2", "Value3", datafield1, datafield2, datafield3);
			if (!sign)
			{
				setValues("Value2", "Value1", "Value3", datafield2, datafield1, datafield3);
			}
			if (!sign)
			{
				setValues("Value3", "Value1", "Value2", datafield3, datafield1, datafield2);
			}
		}

		return { values: values, sign: sign };
	};

	/**
	 * Create the hash map to group two or more ids if they have the same thematic style.
	 * @param {Array} displaySettingIds The mapping of ids and fields values.
	 * @param {Object} specialField Includes values which were selected in the thematic grid and the sign which field is the special field.
	 * @param {Object} options Includes the type, datafield, combination key name and the formatValue function.
	 * @returns {Object} The hash map
	 */
	ThematicHelper.getDisplaySettingIdsGroup = function(displaySettingIds, specialField, options)
	{
		var group = {}, value1, value2, value3, entity, id, specialValue,
			combinationKeyName = options.combinationKeyName,
			datafield1 = options.datafield1, datafield2 = options.datafield2,
			datafield3 = options.datafield3, formatValue = options.formatValue;
		/**
		 * Set the combination id into hash map.
		 * @param {String} value The special field value.
		 * @param {Number} id The id of one data.
		 * @param {String} group1 If there has two fields.
		 * @param {String} group2 If there has three fields.
		 * @returns {String} The special field value.
		 */
		function setCombinationGroup(value, id, group1, group2)
		{
			if (value === null)
			{
				return null;
			}

			var specialFieldValues, specialValues, j, hasSpecailValue, isCombination, specialSingleValue;
			specialValues = value.split(",");
			if (specialValues.length > 1)
			{
				hasSpecailValue = false;
				isCombination = false;
				specialFieldValues = group2 !== undefined ?
					specialField.values[group2][group1] : group1 !== undefined ?
						specialField.values[group1] : specialField.values;

				if (!specialFieldValues)
				{
					return null;
				}
				for (j = 0; j < specialValues.length; j++)
				{
					//Two choose:
					//1. If the special values has two select values, it will be shown combination thematic style.
					//2. If the special values only has a select value, it will be shown the select value thematic style.
					if (specialFieldValues[specialValues[j]])
					{
						if (hasSpecailValue)
						{
							isCombination = true;
							break;
						}
						else
						{
							specialSingleValue = specialValues[j];
							hasSpecailValue = true;
						}
					}
				}
				if (isCombination)
				{
					if (!group[combinationKeyName])
					{
						group[combinationKeyName] = [];
					}
					group[combinationKeyName].push(id);
					return null;
				}
				else if (hasSpecailValue)
				{
					return specialSingleValue;
				}
			}
			return value;
		};

		for (var i in displaySettingIds)
		{
			entity = displaySettingIds[i];
			if (entity.isUnGroup)
			{
				continue;
			}
			id = options.type !== "district" ? Number(entity.Id) : entity.Id;
			value1 = formatValue(entity.Value1, datafield1);
			value2 = formatValue(entity.Value2, datafield2);
			value3 = formatValue(entity.Value3, datafield3);
			if (value3 !== undefined)//Three fields
			{
				//If the field is the specila field.
				if (specialField.sign)
				{
					if (specialField.sign === "Value1")
					{
						specialValue = setCombinationGroup(value1, id, value2, value3);
						value1 = specialValue ? specialValue : value1;
					}
					else if (specialField.sign === "Value2")
					{
						specialValue = setCombinationGroup(value2, id, value1, value3);
						value2 = specialValue ? specialValue : value2;
					}
					else
					{
						specialValue = setCombinationGroup(value3, id, value1, value2);
						value3 = specialValue ? specialValue : value3
					}
					//If the value is null or combination.
					if (!specialValue)
					{
						continue;
					}
				}
				if (!group[value1])
				{
					group[value1] = {};
				}
				if (!group[value1][value2])
				{
					group[value1][value2] = {};
				}
				if (!group[value1][value2][value3])
				{
					group[value1][value2][value3] = [];
				}
				group[value1][value2][value3].push(id);
			}
			else if (value2 !== undefined)//Two fields
			{
				if (specialField.sign)
				{
					if (specialField.sign === "Value1")
					{
						specialValue = setCombinationGroup(value1, id, value2);
						value1 = specialValue ? specialValue : value1;
					}
					else
					{
						specialValue = setCombinationGroup(value2, id, value1);
						value2 = specialValue ? specialValue : value2;
					}
					if (!specialValue)
					{
						continue;
					}
				}
				if (!group[value1])
				{
					group[value1] = {};
				}
				if (!group[value1][value2])
				{
					group[value1][value2] = [];
				}
				group[value1][value2].push(id);
			}
			else//One field
			{
				if (specialField.sign === "Value1")
				{
					specialValue = setCombinationGroup(value1, id);
					if (!specialValue)
					{
						continue;
					}
					value1 = specialValue;
				}
				if (!group[value1])
				{
					group[value1] = [];
				}
				group[value1].push(id);
			}
		}

		return group;
	};

	/**
	 * Set the ids of hash map into the CustomDisplaySetting if the values is same to hash map key.
	 * @param {Array} displaySetting The thematic style which would be display in the map.
	 * @param {Object} group The hash map to group two or more ids if they have the same thematic style.
	 * @param {Object} options Includes the type, datafield, combination key name and the formatValue function.
	 * @returns {Object} The promise
	 */
	ThematicHelper.getDisplaySettingIncludeIds = function(displaySetting, group, options, filterSet)
	{
		var alreadyExistedIds = {}, promiseAll = [], setting, allOthersSetting, value1, value2, value3,
			type = options.type, datafield1 = options.datafield1, datafield2 = options.datafield2,
			datafield3 = options.datafield3,
			defaultSearchParameters = {
				fields: ["Id"],
				filterClause: "",
				filterSet: { FilterItems: [], FilterSets: [], LogicalOperator: "and" },
				idFilter: { IncludeOnly: options.includeOnlyIds, ExcludeAny: [] },
				sortItems: null
			};
		var isImperial = tf.measurementUnitConverter.isImperial();

		if (filterSet && options.type === "gpsevent")
		{
			defaultSearchParameters.filterSet = filterSet;
		}
		/**
		 * Sticky the ids which aren't shown the all others thematic style.
		 * @param {Array} Ids The ids.
		 * @returns {Void}
		 */
		function addExistIds(Ids)
		{
			for (var index = 0; index < Ids.length; index++)
			{
				alreadyExistedIds[Ids[index]] = true;
			}
		};
		/**
		 * If the type is district, use code, if not use id.
		 * @param {String} type The grid type.
		 * @param {Object} setting The thematic style object.
		 * @param {Array} keys The codes or ids.
		 * @returns {Void}
		 */
		function setSettingsKeys(type, setting, keys)
		{
			if (type === "district")
			{
				setting.Codes = keys;
				addExistIds(setting.Codes);
			}
			else
			{
				setting.Ids = keys;
				addExistIds(setting.Ids);
			}

			return setting;
		}

		function fixZeroGroupKey(value)
		{
			var groupKey = value;
			if (isNumber(value) && Number(value) === 0 && group["0"])
			{
				return "0";
			}

			return groupKey;
		}

		var formatValue = (x) => { return fixZeroGroupKey(options.formatValue(x)); };

		for (var i in displaySetting)
		{
			setting = displaySetting[i];
			value1 = formatValue(isImperial && setting.AdditionalValue1 != undefined ? setting.AdditionalValue1 : setting.Value1, datafield1);
			value2 = formatValue(isImperial && setting.AdditionalValue2 != undefined ? setting.AdditionalValue2 : setting.Value2, datafield2);
			value3 = formatValue(isImperial && setting.AdditionalValue3 != undefined ? setting.AdditionalValue3 : setting.Value3, datafield3);
			if (value3 !== undefined)
			{
				setting = setSettingsKeys(type, setting, (group[value1] && group[value1][value2] && group[value1][value2][value3]) ? group[value1][value2][value3] : []);
			}
			else if (value2 !== undefined)
			{
				setting = setSettingsKeys(type, setting, (group[value1] && group[value1][value2]) ? group[value1][value2] : []);
			}
			else if (value1 !== undefined)
			{
				setting = setSettingsKeys(type, setting, group[value1] ? group[value1] : []);
			}
			else
			{
				allOthersSetting = setting;
			}
		}

		// Gets all select ids of grid, remove the ids which is in the CustomDisplaySetting, the surplus ids is part of 'All others' thematic style.
		if (allOthersSetting)
		{
			if (type === 'district')
			{
				promiseAll.push(tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), tf.dataTypeHelper.getEndpoint(type))).then(function(response)
				{
					allOthersSetting.Codes = response.Items.map(function(item)
					{
						return item.Id;
					}).filter(function(code)
					{
						return !alreadyExistedIds[code];
					});
				}));
			} else if (type === 'gpsevent')
			{
				promiseAll.push(tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "search", tf.dataTypeHelper.getEndpoint(type), `id?databaseId=${tf.datasourceManager.databaseId}`), { data: defaultSearchParameters }).then(function(response)
				{
					allOthersSetting.Ids = response.Items.filter(function(id)
					{
						return !alreadyExistedIds[id];
					});
				}));
			} else
			{
				promiseAll.push(tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", tf.dataTypeHelper.getEndpoint(type), "id"), { data: defaultSearchParameters }).then(function(response)
				{
					allOthersSetting.Ids = response.Items.filter(function(id)
					{
						return !alreadyExistedIds[id];
					});
				}));
			}
		}

		return Promise.all(promiseAll);
	};

	ThematicHelper.mapDisplayName = function(dataType, fieldName, value)
	{
		var fieldConfigTable = {
			"trip": [{
				"session": {
					0: "To School",
					1: "From School",
					2: "Shuttle",
					3: "Both"
				}
			}],
			"reportlibrary": [
				{
					"status": {
						0: false,
						1: true
					}
				}
			]
		};

		if (!dataType || !fieldName)
		{
			return value;
		}

		var fieldsList = fieldConfigTable[dataType.toLowerCase()];
		if (!fieldsList || !fieldsList.length)
		{
			return value;
		}

		var fieldNames = [];
		fieldsList.forEach(function(fieldConfigs)
		{
			fieldNames = fieldNames.concat(Object.keys(fieldConfigs));
		});

		fieldName = fieldName.toLowerCase();
		var idx = fieldNames.indexOf(fieldName);
		if (idx < 0)
		{
			return value;
		}

		var map = fieldsList[idx][fieldName];
		return (map[value] != undefined) ? map[value] : value;
	}

	ThematicHelper.getThematicById = function(thematicId, option)
	{
		if (!thematicId || thematicId < 0)
		{
			return Promise.resolve({});
		}
		const overlay = option && option.hasOwnProperty("overlay") ? { overlay: option.overlay } : null;
		const url = this.getUrl();
		return tf.promiseAjax.get(url, { paramData: { id: thematicId } }, overlay)
			.then((res) => Array.isArray(res.Items) && res.Items[0]);
	};

	ThematicHelper.getThematicListByType = function(thematicType, dataType, udgridId, option)
	{
		const overlay = option && option.hasOwnProperty("overlay") ? { overlay: option.overlay } : null;
		const url = this.getUrl();
		return tf.promiseAjax.get(url, {
			paramData: {
				datatypeid: tf.dataTypeHelper.getId(dataType),
				type: thematicType,
				udgridId: udgridId
			}
		}, overlay).then(res => res.Items);
	};

	/**
	 * Get a dictionary with data item uid and color.
	 *
	 * @param {*} dataType
	 * @param {*} dataItemList
	 * @param {*} configSetList
	 * @return {*}
	 */
	ThematicHelper.getDataItemColorDict = function(dataType, dataItemList, configSetList, dataColumns)
	{
		const dataItemColorDict = {};
		const columns = ThematicHelper.mergeColumns(dataColumns, dataType === "form" ? [] : new TF.Map.Thematics.DataFieldHelper().getColumnsByType(dataType));
		const dataColumnDict = _.keyBy(columns, f => f.UDFId ? f.OriginalName : f.FieldName);

		const regularConfigSetList = [];
		let defaultColor = null;

		// All other values is a built-in type.
		configSetList.forEach(set =>
		{
			const defaultConfig = set.find(c => c.field === DEFAULT_THEMATIC_LABEL);
			if (defaultConfig)
			{
				defaultColor = defaultConfig.color;
			}
			else
			{
				regularConfigSetList.push(set);
			}
		});

		// Find match
		dataItemList.forEach(d =>
		{
			const matchedConfig = regularConfigSetList.find(s => this.checkIfMatchWithConfigSet(d, s, dataColumnDict));
			dataItemColorDict[d.uid] = matchedConfig ? matchedConfig[0].color : defaultColor;
		});

		return dataItemColorDict;
	};

	ThematicHelper.checkIfMatchWithConfigSet = function(dataItem, configSet, dataColumnDict)
	{
		return configSet.every(configItem =>
		{
			let { field, value, imperialValue } = configItem;
			const dataColumn = dataColumnDict[field];

			if (!dataColumn)
			{
				return false;
			}

			let dataItemValue = dataItem[field];
			if (isNullObj(dataItemValue) && dataColumn.type !== "number")
			{
				dataItemValue = "";
			}

			if (dataColumn.UnitOfMeasureSupported && dataColumn.type === "number" && !isNullObj(dataItemValue) && !isNullObj(value))
			{
				dataItemValue = Number(tf.measurementUnitConverter.handleColumnUnitOfMeasure(dataItem, dataColumn));
				value = Number(tf.measurementUnitConverter.handleColumnUnitOfMeasure({ [dataColumn.FieldName]: value }, dataColumn));
				if (imperialValue && tf.measurementUnitConverter.isImperial())
				{
					value = imperialValue;
				}
			}

			if (dataItemValue && dataColumn.isUTC && dataColumn.type === "date" && dataColumn.dbType === "datetime")
			{
				dataItemValue = utcToClientTimeZone(dataItemValue);
			}

			return TF.Map.Thematics.DataFieldHelper.equals(dataColumn.type, dataItemValue, value);
		});
	};

	ThematicHelper.restrictDisplayLabelLength = function(label)
	{
		const maxDisplayLabelLength = 48;

		return label.length <= maxDisplayLabelLength ? label : label.substr(0, maxDisplayLabelLength);
	}

	/**
	 * columns in the drop down list in the thematic dialog are from TF.Map.Thematics.DataFieldHelper
	 *
	 * grid definition doesn't contain all columns in TF.Map.Thematics.DataFieldHelper
	 *
	 * Attention the parameters' sequence.
	 * the parameters' sequence matters! columnsFromGridDefinition has a higher priority.
	 *
	 * @param {*} columnsFromGridDefinition columns from grid definition
	 * @param {*} columnsFromDataFieldHelper columns from TF.Map.Thematics.DataFieldHelper
	 */
	ThematicHelper.mergeColumns = function(columnsFromGridDefinition, columnsFromDataFieldHelper)
	{
		return _.unionBy(columnsFromGridDefinition, columnsFromDataFieldHelper, function(x) { return x.FieldName });
	};
})();

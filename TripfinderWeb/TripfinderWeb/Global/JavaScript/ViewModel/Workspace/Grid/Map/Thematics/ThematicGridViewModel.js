(function ()
{
	createNamespace("TF.Map.Thematics").ThematicGridViewModel = ThematicGridViewModel;

	const EMPTY_VALUE_DISPLAY = "";
	const DEFAULT_COLOR_SET = [
		"#FF0000", "#3333FF", "#FF6700", "#FF00FF", "#00FFFF", "#73D952", "#FFFF00",
		"#AA0000", "#0000A2", "#CC5200", "#E10087", "#00CCCC", "#006600", "#FFCC00",
		"#D47F7F", "#7F7FD0", "#E5A87F", "#F07FC3", "#7FE5E5", "#7FB27F", "#FFE57F"
	];
	const DEFAULT_CONFIG = {
		GRID: {
			DISPLAY_FIELD_NAME: "Color",
			VALUE_FIELD_NAME: "Value",
			LABEL_FIELD_NAME: "Label",
			COUNT_FIELD_NAME: "Count",
			GENERAL: { color: "#FFFFFF" },
			ALL_OTHERS: { color: "#FFFFFF" }
		},
		MAP: {
			DISPLAY_FIELD_NAME: "Display",
			VALUE_FIELD_NAME: "Value",
			LABEL_FIELD_NAME: "DisplayLabel",
			COUNT_FIELD_NAME: "Count",
			GENERAL: {
				symbol: "0",
				size: "12",
				color: "#ff0000",
				borderishow: true,
				bordersize: "1",
				bordercolor: "#333333"
			},
			ALL_OTHERS: {
				symbol: "0",
				size: "5",
				color: "#6B7CFC",
				borderishow: true,
				bordersize: "1",
				bordercolor: "#000000"
			}
		},
	};
	const SCHEDULE_GRIDS = ["studentattendanceschedule", "tripschedule", "tripstopschedule"];

	function ThematicGridViewModel(mapGrid, displaySetting, $element, sortInfo, thematicType, dataFieldHelper)
	{
		var self = this;
		self.mapGrid = mapGrid;
		self.dataType = mapGrid._gridType == "district" && thematicType === TF.ThematicTypeEnum.MAP ? "school" : mapGrid._gridType;

		if (displaySetting && Object.prototype.toString.call(displaySetting) !== '[object Array]')
		{
			self.initDisplaySetting = JSON.parse(displaySetting);
		}
		else
		{
			self.initDisplaySetting = displaySetting;
		}

		self.value1Type = null;
		self.sortInfo = sortInfo;
		self.$element = $element;
		self.grid = null;
		self.orginalValue = null;
		self.currentDataSourceCount = 0;
		self.currentFieldCount = 0;
		self.currentSelectedFieldCount = 0;
		self.currentSelectedRecordCount = 0;
		self.allOthersData = null;
		self.disabilityCodeData = null;
		self.ethnicCodeData = null;
		self.combinationFields = [];
		self.disabilityCodeIndex = -1;
		self.ethnicCodeIndex = -1;
		self.stickyGridData = null;
		self.dataFieldHelper = dataFieldHelper || new TF.Map.Thematics.DataFieldHelper();
		self.thematicType = thematicType;
		self.hasFormColor = false;
		self.sortByValue = self.sortByValue.bind(self);

		const defaultConfig = thematicType === TF.ThematicTypeEnum.GRID
			? DEFAULT_CONFIG.GRID
			: DEFAULT_CONFIG.MAP;

		self.defaultDisplayConfig = defaultConfig;

		// many of the variables are in string format, and need to be parsed when used.
		// No idea why, we can perhaps clean this if there is time.
		self.allOthersDataDefaultDisplay = JSON.stringify(defaultConfig.ALL_OTHERS);

		self.defaultColor = tf.thematicDefaultColorsManager.thematicDefaultColors || DEFAULT_COLOR_SET;

		self.gridDisplayChanged = false;

		if (!displaySetting || (displaySetting.length === 1 && !displaySetting.Value1))
		{
			self.setFieldsInfo(null);
		}
	}

	ThematicGridViewModel.prototype.generateDefaultDisplay = function ()
	{
		return $.extend({}, this.defaultDisplayConfig.GENERAL);
	};

	/**
	 * Generate style preview.
	 *
	 * @param {*} data
	 * @returns
	 */
	ThematicGridViewModel.prototype.generateStylePreviewHtml = function (data)
	{
		let htmlString = "";
		switch (this.thematicType)
		{
			case TF.ThematicTypeEnum.MAP:
				htmlString = this.GetSymbolString(data);
				break;
			case TF.ThematicTypeEnum.GRID:
				const { color } = data;
				htmlString = `<div style="width:0px;height:20px;margin-right:.5em;border:1px solid rgb(213, 213, 213);background-color:${color}" class="color-picker"></div>`;
				break;
			default:
				break;
		}

		return htmlString;
	};

	/**
	 * Gets the select records
	 * @returns {void} 
	 */
	ThematicGridViewModel.prototype.getSelectRecords = function (includeFormattedValue)
	{
		let self = this, allRecords, dataSource, sort, query;
		dataSource = self.grid.dataSource.data();

		sort = self.grid.dataSource.sort();
		if (sort)
		{
			query = new kendo.data.Query(dataSource);
			dataSource = query.sort(sort).data;
		}

		allRecords = JSON.parse(JSON.stringify(dataSource));
		const data = allRecords.filter(function (record) { return record.Selected && record.Value1 !== undefined });
		if (self.allOthersData)
		{
			data.push(self.allOthersData);
		}

		return data.map(function (record)
		{
			const display = JSON.parse(record.Display),
				item = {
					DisplayLabel: record.DisplayLabel,
					Value: record.Value,
					Size: display.size,
					Color: display.color,
					Symbol: display.symbol,
					Value1: record.Value1,
					Value2: record.Value2,
					Value3: record.Value3,
					Changed: (undefined === display.changed) ? false : display.changed,
					IsWithBorder: display.borderishow,
					BorderWidth: display.bordersize,
					BorderColor: display.bordercolor
				};

			const isOtherValues = item.Value === "All Other Values" && !Object.prototype.hasOwnProperty.call(record, "Value1")
			if (!isOtherValues)
			{
				let existingModification = false;

				["1", "2", "3"].forEach(partialKey =>
				{
					const unitOfMeasureFieldDefinition = record[`unitOfMeasureField${partialKey}`];
					if (unitOfMeasureFieldDefinition && tf.measurementUnitConverter.isNeedConversion(unitOfMeasureFieldDefinition.UnitInDatabase))
					{
						const precision = unitOfMeasureFieldDefinition.Precision || 2;
						item[`AdditionalValue${partialKey}`] = Number(item[`Value${partialKey}`]).toFixed(precision);
						item[`Value${partialKey}`] = (tf.measurementUnitConverter.convert({
							originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Imperial,
							targetUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
							precision,
							isReverse: !!unitOfMeasureFieldDefinition.UnitOfMeasureReverse,
							value: item[`Value${partialKey}`],
							unitType: unitOfMeasureFieldDefinition.UnitTypeOfMeasureSupported
						})).toFixed(precision);
						existingModification = true;
					}
				});

				if (existingModification)
				{
					item.Value = ["1", "2", "3"].filter(x => Object.prototype.hasOwnProperty.call(record, "Value" + x)).map(x => item["Value" + x]).join(", ");
				}
			}

			if (includeFormattedValue)
			{
				item.FormattedValue1 = record.FormattedValue1;
				item.FormattedValue2 = record.FormattedValue2;
				item.FormattedValue3 = record.FormattedValue3;
			}
			return item;
		});
	};

	/**
	 * Get sort information of current grid.
	 * @returns {string} The sort information object.
	 */
	ThematicGridViewModel.prototype.getSortInfo = function ()
	{
		var self = this, result = "";
		if (self.grid && self.grid.dataSource && self.grid.dataSource.sort() && self.grid.dataSource.sort()[0])
		{
			result = JSON.stringify(self.grid.dataSource.sort()[0]);
		}
		return result;
	}

	/**
	 * Get all data of current grid.
	 * @returns {object} All data.
	 */
	ThematicGridViewModel.prototype.getGridData = function ()
	{
		var self = this;
		return self.grid.dataSource.data();
	}

	/**
	 * Get GPS count data of current grid.
	 * @param {*} groups thematic gropus
	 * @returns GPS grid record count.
	 */
	ThematicGridViewModel.prototype.getGPSGridCount = function (groups)
	{
		const self = this;

		return self.thematicType === TF.ThematicTypeEnum.GRID ? groups.reduce((result, x) => result + x.Count, 0) : self.mapGrid.obTotalCount();
	}

	ThematicGridViewModel.prototype.gpsGridFilterInitialized = function ()
	{
		return this.mapGrid._gridType === 'gpsevent' && ((this.mapGrid.requestOptions && this.mapGrid.requestOptions()) || this.mapGrid.searchOption);
	}

	ThematicGridViewModel.prototype.getFilterSetFromGPSEventGridWithoutQuickFilter = function ()
	{
		const currentDocument = tf.documentManagerViewModel.obCurrentDocument();
		if (currentDocument && currentDocument.gridViewModel instanceof TF.Grid.GPSEventGridViewModel)
		{
			return currentDocument.gridViewModel.createRequestOptions(false).data.filterSet;
		}
	};

	ThematicGridViewModel.prototype.updateTimeFieldValue = function (item, allColumns)
	{
		let quickDateFilter = this.options.quickFilterData;
		let isQuickDateFilterOperator =
			quickDateFilter.quickDateFilterTypes.includes(item.Operator.toLowerCase()) ||
			quickDateFilter.quickDateFilterTypesWithoutInput.includes(item.Operator.toLowerCase()) ||
			quickDateFilter.quickDateFilterTypesDateTimeOnly.includes(item.Operator.toLowerCase());
		allColumns.forEach(column =>
		{
			if (column.FieldName === item.FieldName && column.isUTC && !isQuickDateFilterOperator)
			{
				item.Value = toISOStringWithoutTimeZone(clientTimeZoneToUtc(item.Value));
			}
		})
	}

	ThematicGridViewModel.prototype.timeFieldFilterUpdated = function (fieldsData, allColumns)
	{
		if (!fieldsData || !fieldsData.filterSet || !allColumns)
		{
			return;
		}

		this.updateFilterSet(fieldsData.filterSet, allColumns);
	}

	ThematicGridViewModel.prototype.updateFilterSet = function (filterSet, allColumns)
	{
		filterSet.FilterItems?.forEach(item =>
		{
			this.updateTimeFieldValue(item, allColumns);
		});
		filterSet.FilterSets?.forEach(set =>
		{
			this.updateFilterSet(set, allColumns);
		})
	}

	/**
	 * Get data source for kendo grid.
	 * @returns {kendo.data.DataSource} The data source for kendo grid.
	 */
	ThematicGridViewModel.prototype.getThematicGroupData = function (fieldsData, availableColumns)
	{
		var self = this, dataSource, promise, fieldTypes = [];

		if (this.mapGrid._gridType === 'gpsevent' && !self.gpsGridFilterInitialized())
		{
			// display empty all other data for empty gps event filter thematic
			self.allOthersData = self.generateRowData(
				"All Other Values",
				self.allOthersDataDefaultDisplay,
				{
					Count: 0,
				});

			return Promise.resolve([]);
		}

		if (self.gpsGridFilterInitialized())
		{
			let filterSet = self.mapGrid.requestOptions ? self.mapGrid.requestOptions().data.filterSet : self.getFilterSetFromGPSEventGridWithoutQuickFilter();
			fieldsData.filterSet.FilterItems = fieldsData.filterSet.FilterItems.concat(filterSet.FilterItems);
			fieldsData.filterSet.FilterSets = fieldsData.filterSet.FilterSets.concat(filterSet.FilterSets);
		}

		if (self.mapGrid._gridType.toLowerCase() === 'mergedocument')
		{
			fieldsData.filterSet.FilterItems.push({
				FieldName: "TemplateName",
				Operator: "NotEqualTo",
				Value: "Email"
			});
		}

		if (SCHEDULE_GRIDS.includes(self.mapGrid._gridType) && self.mapGrid.options && self.mapGrid.options.setRequestOption)
		{
			let options = self.mapGrid.options.setRequestOption();
			fieldsData.filterSet.FilterSets = fieldsData.filterSet.FilterSets.concat(options.data.filterSet.FilterSets)
		}

		const allColumns = availableColumns || self.dataFieldHelper.getColumnsByType(self.type.toLowerCase());
		for (var i = 0; i < fieldsData.fields.length; i++)
		{
			allColumns.filter(function (item)
			{
				if (item.FieldName === fieldsData.fields[i])
				{
					var groupField = {
						type: item.type,
						isUTC: item.isUTC
					};
					if (item.questionType === "Boolean" && self.mapGrid._gridType.toLowerCase() === 'form' && $.isFunction(item.template))
					{
						groupField.template = item.template;
					}
					fieldTypes.push(groupField);
				}
			});
		}

		self.timeFieldFilterUpdated(fieldsData, allColumns);

		if (self.stickyGridData)
		{
			var originDisabilityCodeIndex = self.disabilityCodeIndex,
				originethnicCodeIndex = self.disabilityCodeIndex;

			self.disabilityCodeIndex = fieldsData.fields.indexOf("DisabililityCode") + 1;
			self.ethnicCodeIndex = fieldsData.fields.indexOf("EthnicCode") + 1;
			var switchValue = function (data, oldIndex, newIndex)
			{
				var tempValue;
				$.each(data, function (index, item)
				{
					tempValue = item["Value" + oldIndex];
					item["Value" + oldIndex] = item["Value" + newIndex];
					item["Value" + newIndex] = tempValue;

					let tempUnitOfMeasureField = item["unitOfMeasureField" + oldIndex];
					item["unitOfMeasureField" + oldIndex] = item["unitOfMeasureField" + newIndex];
					item["unitOfMeasureField" + newIndex] = tempUnitOfMeasureField;
				})
			};

			if (self.disabilityCodeIndex > 0 && self.disabilityCodeIndex !== originDisabilityCodeIndex)
			{
				switchValue(self.disabilityCodeData, originDisabilityCodeIndex, self.disabilityCodeIndex);
			}
			else if (self.ethnicCodeIndex > 0 && self.ethnicCodeIndex !== originethnicCodeIndex)
			{
				switchValue(self.ethnicCodeData, originethnicCodeIndex, self.ethnicCodeIndex);
			}

			var gridData = self.stickyGridData;
			self.stickyGridData = null;
			self.currentSelectedFieldCount = 0;
			self.currentSelectedRecordCount = 0;
			self.allOthersData.Count = self.currentDataSourceCount.toString();
			promise = Promise.resolve(gridData);
		}
		else
		{
			if (self.mapGrid._gridType === 'form')
			{
				fieldsData.filterSet.UDGridID = self.mapGrid.options.gridData.value;
			}
			//
			fieldsData.filterSet.FilterItems.forEach(item =>
			{
				if (item.TypeHint === 'DateTime')
				{
					let columnInfo = allColumns.filter(x => x.FieldName === item.FieldName);
					let isUTC = false;
					if (columnInfo)
					{
						isUTC = columnInfo[0].isUTC;
					}
					item['IsUTC'] = isUTC;
				}
			});

			let paramData = {
				dbid: self.mapGrid._gridType === 'forms' ? 0 : tf.datasourceManager.databaseId,
				datatypeid: tf.dataTypeHelper.getId(self.dataType.toLowerCase()),
			}

			if (self.dataType === "fieldtrip")
			{
				switch (self.mapGrid.pageType)
				{
					case "approvals":
						paramData["filterType"] = 'permission';
						break;
					case "myrequests":
						paramData["filterType"] = 'submitted';
						break;
				}
			}

			promise = tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "thematicdisplaysettings"),
				{
					data: fieldsData,
					paramData: paramData,
					headers: { Prefix: tf.storageManager?.prefix?.split('.')[0] }
				}).then(function (response)
				{
					if (response.Items === null)
					{
						return [];
					}
					else
					{
						let data = response.Items[0],
							rowNumber = 0,
							allOthersCount = 0;

						self.currentDataSourceCount = self.dataType === "gpsevent" ? self.getGPSGridCount(data) : response.TotalRecordCount;
						self.currentFieldCount = data.length;

						self.combinationFields.length = 0;
						self.disabilityCodeIndex = fieldsData.fields.indexOf("DisabililityCode") + 1;
						self.ethnicCodeIndex = fieldsData.fields.indexOf("EthnicCode") + 1;
						self.disabilityCodeData = null;
						self.ethnicCodeData = null;
						if (self.disabilityCodeIndex > 0)
						{
							self.disabilityCodeData = $.extend(true, [], data);
							TF.Helper.ThematicHelper.convertCodeData(self.disabilityCodeData, self.disabilityCodeIndex);
							data = Enumerable.From(data).Where(function (c) { return c["Value" + self.disabilityCodeIndex] }).ToArray();
							self.currentDataSourceCount = response.TotalRecordCount;
							self.currentFieldCount = data.length;
						}
						if (self.ethnicCodeIndex > 0)
						{
							self.ethnicCodeData = $.extend(true, [], data);
							TF.Helper.ThematicHelper.convertCodeData(self.ethnicCodeData, self.ethnicCodeIndex);
							data = Enumerable.From(data).Where(function (c) { return c["Value" + self.ethnicCodeIndex] }).ToArray();
							self.currentDataSourceCount = response.TotalRecordCount;
							self.currentFieldCount = data.length;
						}

						data = self.formatThematicGroupData(data, fieldsData, fieldTypes, rowNumber);

						allOthersCount = self.currentDataSourceCount;
						self.allOthersData = self.generateRowData(
							"All Other Values",
							self.allOthersDataDefaultDisplay,
							{
								RowNumber: rowNumber,
								Count: allOthersCount.toString(),
							});

						return data;
					}
				}).catch(() => { tf.loadingIndicator.tryHide(); });
		}

		return promise.then(function (data)
		{
			if (!data || data.length === 0)
			{
				return data;
			}
			else
			{
				self.value1Type = fieldTypes[0] && fieldTypes[0].type;

				if (data && data.length > 0)
				{
					data = data.sort(self.sortByValue);
				}

				var sort = null, compare;

				if (self.sortInfo && self.sortInfo !== "")
				{
					if (self.sortInfo.field === "Count")
					{
						compare = function (a, b)
						{
							return parseInt(a.Count) - parseInt(b.Count);
						};
					}
					else if (self.sortInfo.field === "Value")
					{
						compare = self.sortByValue;
					}
					else if (self.sortInfo.field === "DisplayLabel")
					{
						compare = function (a, b)
						{
							return (a.DisplayLabel.toLowerCase() < b.DisplayLabel.toLowerCase() ? -1 : (a.DisplayLabel.toLowerCase() > b.DisplayLabel.toLowerCase() ? 1 : 0));
						};
					}
					sort = {
						field: self.sortInfo.field,
						dir: self.sortInfo.dir,
						compare: compare,
					};
				}

				dataSource = new kendo.data.DataSource({
					pageSize: 20,
					transport: {
						read: function (e)
						{
							e.success(data);
						},
						update: function (e)
						{
						}
					},
					schema: {
						model: {
							fields: {
								Selected: { type: "boolean" },
								Value: { type: "string", editable: false },
								DisplayLabel: { type: "string" },
								Count: { type: "string", editable: false },
								Color: { type: "string", editable: false },
								Display: { type: "string", editable: false },
								Value1: { type: "string", editable: false },
								Value2: { type: "string", editable: false },
								Value3: { type: "string", editable: false }
							}
						}
					},
					sort: sort
				});

				if (self.allOthersData)
				{
					dataSource.aggregate([{ field: "Selected", aggregate: "count" }]);
				}
				return dataSource;
			}
		});
	};

	ThematicGridViewModel.prototype.formatThematicGroupData = function (data, fieldsData, fieldTypes, rowNumber)
	{
		let self = this,
			gridColumns = self.dataFieldHelper.getColumnsByType(self.dataType.toLowerCase()),
			dataColumns = self.mapGrid && self.mapGrid._gridDefinition && self.mapGrid._gridDefinition.Columns || [],
			unitOfMeasureColumns = gridColumns.filter(({ UnitOfMeasureSupported }) => UnitOfMeasureSupported);

		dataColumns = TF.Helper.ThematicHelper.mergeColumns(dataColumns, gridColumns);

		return data.map(function (item)
		{
			item["RowNumber"] = rowNumber++;
			var value = "";
			for (var i = 1; i <= fieldsData.fields.length; i++)
			{
				var currentValue = item["Value" + i];
				let fieldConfig = fieldTypes[i - 1];
				let fieldType = fieldConfig && (fieldConfig.type || "").toLowerCase();
				let fieldData = fieldsData.fields[i - 1];
				let fieldTemplate = fieldConfig?.template;

				item["FormattedValue" + i] = EMPTY_VALUE_DISPLAY;
				// only undefined, null or empty value show empty
				// true, false, 0, 1 values must show value
				if (currentValue !== undefined && currentValue !== null && currentValue !== "")
				{
					if (fieldType === "date")
					{
						item["FormattedValue" + i] = moment(currentValue).format("MM/DD/YYYY")
						item["Value" + i] = moment(item["Value" + i]).format("M/D/YYYY hh:mm:ss A");
					}
					else if (fieldType === "time")
					{
						const fullTimeString = `${moment().format("MM/DD/YYYY")}  ${currentValue}`;
						item["FormattedValue" + i] = moment(fullTimeString).format("hh:mm A");
					}
					else if (fieldType === "datetime" || fieldType === "date/time")
					{
						let dt = convertToMoment(currentValue);
						if (fieldConfig.isUTC)
						{
							dt = utcToClientTimeZone(currentValue);
						}

						item["FormattedValue" + i] = dt.isValid() ? dt.format("MM/DD/YYYY hh:mm A") : "";
					}
					else if (self.dataType === "forms" && fieldData === "FormColor")
					{
						self.hasFormColor = true;
						item["FormattedValue" + i] = `<span style="width:20px;height:20px;display:inline-block;margin-bottom:-5px;background-color:${currentValue}"></span>`
					}
					else if (fieldType === "number")
					{
						let column = (dataColumns || []).find(d => d.FieldName === fieldData || d.DisplayName === fieldData || d.OriginalName === fieldData),
							formattedValue = (currentValue === null || currentValue === "") ? EMPTY_VALUE_DISPLAY : currentValue;

						let field = unitOfMeasureColumns.find(x => x.FieldName === fieldData || x.DisplayName === fieldData || x.OriginalName === fieldData);
						if (field)
						{
							item[`unitOfMeasureField${i}`] = field;
						}

						const format = `{0:n${(column && column.Precision) || 2}}`;
						item["FormattedValue" + i] = kendo.format(format, formattedValue);
					}
					else if (self.dataType === "form" && fieldType === "boolean" && fieldTemplate)
					{
						let formattedValue = EMPTY_VALUE_DISPLAY;
						if (currentValue !== null && currentValue !== "")
						{
							let isTrue = `${currentValue}`.toLowerCase() === "true";
							let itemData = {};
							itemData[fieldData] = isTrue ? "true" : "false";
							formattedValue = fieldTemplate(itemData);
						}
						item["FormattedValue" + i] = formattedValue;
					}
					else if (fieldType === "boolean")
					{
						var itemValue = dataColumns.find(x => x.FieldName === fieldData || x.OriginalName === fieldData || x.DisplayName === fieldData);
						if (itemValue !== null && currentValue !== null)
						{
							item["FormattedValue" + i] =
								(currentValue === true || currentValue.toString().toLowerCase() === 'true') ?
									(itemValue.questionFieldOptions ? itemValue.questionFieldOptions.TrueDisplayName : itemValue.TrueDisplayName || currentValue) :
									(itemValue.questionFieldOptions ? itemValue.questionFieldOptions.FalseDisplayName : itemValue.FalseDisplayName || currentValue);
						}
					}
					else
					{
						item["FormattedValue" + i] = currentValue;
					}
				}

				value += TF.Helper.ThematicHelper.mapDisplayName(self.dataType, fieldData, $.trim(item["FormattedValue" + i]));
				value += ", ";
			}

			if (value[value.length - 2] === ",")
			{
				value = value.substr(0, value.length - 2);
			}
			item.Value = value;

			item.DisplayLabel = TF.Helper.ThematicHelper.restrictDisplayLabelLength(value);

			return item;
		});
	}

	ThematicGridViewModel.prototype.generateRowData = function (name, displayStr, data)
	{
		return $.extend({}, {
			RowNumber: 0,
			Count: 0,
			Display: displayStr,
			DisplayObj: JSON.parse(displayStr),
			DisplayLabel: name,
			Selected: true,
			Value: name,
		}, data);
	};

	/**
	 * Apply the initial display setting to the grid
	 * @param {Array} displaySetting
	 * @return {void}
	 */
	ThematicGridViewModel.prototype.applyDisplaySettingToDataSource = function (displaySetting)
	{
		let self = this,
			gridDataSource = self.grid.dataSource,
			allChecked = true,
			formatKey = (d) => `${d.Value}`,
			valueMapping = _.keyBy(gridDataSource.data(), d => formatKey(d)),
			dataConvert = (data) => ({
				symbol: data.Symbol,
				size: data.Size && data.Size.toString(),
				color: data.Color,
				changed: data.Changed,
				borderishow: data.IsWithBorder,
				bordersize: data.BorderWidth && data.BorderWidth.toString(),
				bordercolor: data.BorderColor
			});

		let otherKeys = Object.keys(valueMapping).filter(item => item && !displaySetting.some(a => a.Value === item));
		let otherItem = displaySetting.filter(item => item.Value === 'All Other Values');
		if (otherKeys.length > 0 && otherItem.length > 0)
		{
			var settings = [];
			Object.keys(valueMapping).forEach((key, index) =>
			{
				var setting = Enumerable.From(displaySetting).FirstOrDefault(null, function (x) { return x.Value == key; });
				if (setting)
				{
					settings.push(setting);
				}
				else
				{
					settings.push({
						DisplayLabel: key,
						Value: key,
						Value1: key,
						Color: self.defaultColor[index % self.defaultColor.length],
						Changed: false,
						isNew: true,
						Symbol: 0,
						Size: "12",
						IsWithBorder: true,
						BorderWidth: "1",
						BorderColor: "#000000"
					});
				}
			});

			displaySetting = settings;
		}

		if (!displaySetting.some(item => item.Value === 'All Other Values') && otherItem.length > 0)
		{
			displaySetting.push(Enumerable.From(otherItem).FirstOrDefault());
		}

		displaySetting.forEach(tmp =>
		{
			let setting = dataConvert(tmp),
				rowData;
			if (tmp.Value1 === undefined)
			{
				rowData = self.allOthersData;
			}
			else
			{
				rowData = valueMapping[formatKey(tmp)] || valueMapping[self.numberFormatter(formatKey(tmp))];
			}

			if (rowData)
			{
				if (self.disabilityCodeIndex > 0 || self.ethnicCodeIndex > 0)
				{
					self.combinationFields.push(rowData);
				}
				rowData.Display = JSON.stringify(setting);
				rowData.DisplayObj = JSON.parse(rowData.Display);
				rowData.Selected = !tmp.isNew;
				rowData.DisplayLabel = tmp.DisplayLabel;

				if (self.thematicType === TF.ThematicTypeEnum.GRID)
				{
					rowData.Color = rowData.DisplayObj.color;
				}

				if (tmp.Value1 !== undefined)
				{
					if (rowData.Selected)
					{
						self.currentSelectedFieldCount++;
						self.currentSelectedRecordCount += parseInt(rowData.Count);
						self.allOthersData.Count = parseInt(self.allOthersData.Count) - parseInt(rowData.Count) + "";
					}
					const $row = self.grid.element.find(`[data-kendo-uid="${rowData.uid}"]`);
					if ($row.length > 0)
					{
						let $checkbox = $row.find("input[type=checkbox]"),
							$display = $row.find(".display-container"),
							$displayLabel = $row.find("td:eq(2) div");
						$displayLabel.text(tmp.DisplayLabel).attr("title", tmp.DisplayLabel);
						$checkbox.prop("checked", !tmp.isNew);
						self.updateDisplayContainer($display, setting);
					}
				}
				else
				{
					self.updateAllOthersRow();
				}
			}
		});

		const count = gridDataSource.total();
		if (count === 0)
		{
			allChecked = false;
		}
		else
		{
			for (let i = 0; i < count; i++)
			{
				if (!gridDataSource.at(i).Selected)
				{
					allChecked = false;
					break;
				}
			}
		}

		$("#selectAll").prop("checked", allChecked);
		self.updateGridFooter();
		self.updateAllOthersRow();
		self.grid.refresh();

		if (self.grid.dataSource._sort && self.grid.dataSource._sort.length > 0)
		{
			self.grid.dataSource.sort(self.grid.dataSource._sort);
		}
	};

	/**
	 * Get matched data row in grid based on fields' values.
	 * @param {string} value The combined value.
	 * @param {Array} valueList The list of field values.
	 * @param {Object} gridData The grid data.
	 * @return {Object} The matched data row, null if nothing is found.
	 */
	ThematicGridViewModel.prototype.getMatchedDataRow = function (value, valueList, gridData)
	{
		var idx, tmp,
			matchChcek = function (str1, str2)
			{
				return (str1 || str2) ? (str1 == str2) : true;
			};

		for (idx = 0; idx < gridData.length; idx++)
		{
			tmp = gridData[idx];

			if (matchChcek(tmp.Value, value) && matchChcek(tmp.Value1, valueList[0])
				&& matchChcek(tmp.Value2, valueList[1]) && matchChcek(tmp.Value3, valueList[2]))
			{
				return tmp;
			}
		}
	};

	/**
	 * Update the get with fields info
	 * @param {object} fieldsData Fields' data of grid.
	 * @param {Array} availableColumns All available columns.
	 * @returns {void} 
	 */
	ThematicGridViewModel.prototype.setFieldsInfo = function (fieldsData, availableColumns)
	{
		var self = this, $gridContent = $(".k-grid-content"),
			dataSource = new kendo.data.DataSource({
				pageSize: 20,
				transport: {
					read: function (e)
					{
						e.success([]);
					},
					update: function (e)
					{
					}
				},
				schema: {
					model: {
						fields: {
							Selected: { type: "boolean" },
							Value: { type: "string", editable: false },
							DisplayLabel: { type: "string" },
							Count: { type: "string", editable: false },
							Display: { type: "string", editable: false },
							Value1: { type: "string", editable: false },
							Value2: { type: "string", editable: false },
							Value3: { type: "string", editable: false }
						}
					}
				}
			});

		dataSource.aggregate([{ field: "Selected", aggregate: "count" }]);
		self.currentSelectedFieldCount = 0;
		self.currentSelectedRecordCount = 0;

		if (!fieldsData || !fieldsData.fields || fieldsData.fields.length === 0)
		{
			self.currentFieldCount = 0;
			self.currentDataSourceCount = self.mapGrid.result && self.mapGrid.result.TotalRecordCount;
			self.allOthersData = self.generateRowData(
				"All Other Values",
				self.allOthersDataDefaultDisplay,
				{ Count: self.mapGrid.result && self.mapGrid.result.TotalRecordCount }
			);

			self.disabilityCodeIndex = -1;
			self.ethnicCodeIndex = -1;
			self.combinationFields = [];
			self.disabilityCodeData = null;
			self.ethnicCodeData = null;

			self.createGrid(dataSource);
			if (self.initDisplaySetting)
			{
				self.applyDisplaySettingToDataSource(self.initDisplaySetting);
			}
		}
		else
		{
			tf.loadingIndicator.showImmediately();
			let quickFilter = self.options.quickFilterData;
			self.getThematicGroupData(fieldsData, availableColumns).then(function (data)
			{
				if (Array.isArray(data) && data.length === 0)
				{
					self.createGrid(dataSource);
				}
				else
				{
					self.createGrid(data);
				}

				if (self.initDisplaySetting)
				{
					self.applyDisplaySettingToDataSource(self.initDisplaySetting);
					self.initDisplaySetting = null;
				}

				// this is so that when editing thematics the quick date filters could have the correct element for values.
				// (the element will be replaced with a designated component(kendoNumberBox) and have the typeCode assigned as "dateNumber")
				quickFilter.obFields().forEach(item => quickFilter.dateQuickFilterElementEditorInit(item));

				tf.loadingIndicator.tryHide();
			});

			$gridContent.scrollTop(0);
		}
	};

	ThematicGridViewModel.prototype.sortByValue = function (a, b)
	{
		const self = this;
		if (self.value1Type !== "string")
		{
			if (!a.Value1)
			{
				return -1;
			}
			else if (!b.Value1)
			{
				return 1;
			}
			else if (a.Value1 === b.Value1)
			{
				return 0;
			}

			if (self.value1Type === "date" || self.value1Type === "time" || self.value1Type === "datetime")
			{
				return moment(a.Value1) > moment(b.Value1) ? 1 : (moment(a.Value1) < moment(b.Value1) ? -1 : 0);
			}
			else if (self.value1Type === "number" || self.value1Type === "integer")
			{
				return Number(a.Value1) - Number(b.Value1);
			}
			else if (self.value1Type === "boolean")
			{
				let aValue = JSON.parse(a.Value1.toLowerCase());
				let bValue = JSON.parse(b.Value1.toLowerCase());
				return aValue > bValue ? 1 : (aValue < bValue ? -1 : 0);
			}
		}

		// fallback, compare by string
		var aValue, bValue;
		const emptyValue = EMPTY_VALUE_DISPLAY.toLowerCase();
		aValue = !a.Value1 ? emptyValue : `${a.Value1}`.toLowerCase();
		bValue = !b.Value1 ? emptyValue : `${b.Value1}`.toLowerCase();
		return aValue.localeCompare(bValue);
	};

	/**
	 * Get custom thematic grid columns.
	 *
	 * @returns
	 */
	ThematicGridViewModel.prototype.getThematicGridColumns = function ()
	{
		const self = this;
		const generalColumns = [
			{
				sortable: false,
				title: "CheckBox",
				headerTemplate: "<input type='checkbox' id='selectAll' />",
				width: "30px",
				template: function (dataItem)
				{
					const value = dataItem.Selected ? 'checked' : '';
					return `<input type='checkbox' class='thematicSelected'${value}/>`;
				},
			},
			{
				sortable: {
					compare: (a, b) => self.sortByValue(a, b),
				},
				title: "Value",
				field: "Value",
				width: "144px",
				template: function (dataItem)
				{
					var title = kendo.htmlEncode(dataItem.Value),
						contentStr = self.hasFormColor ? dataItem.Value : title.replace(/ /g, "&nbsp");
					return `<div title="${title}">${contentStr}</div>`;
				},
			},
		];
		const additionalColumns = self.getAdditionalColumnsByType(self.thematicType);

		return generalColumns.concat(additionalColumns);
	};

	ThematicGridViewModel.prototype.getAdditionalColumnsByType = function (type)
	{
		const self = this;
		switch (type)
		{
			case TF.ThematicTypeEnum.MAP:
				return [
					{
						sortable: {
							compare: function (a, b)
							{
								return (a.DisplayLabel.toLowerCase() < b.DisplayLabel.toLowerCase() ? -1 : (a.DisplayLabel.toLowerCase() > b.DisplayLabel.toLowerCase() ? 1 : 0));
							}
						},
						title: "Display Label",
						field: "DisplayLabel",
						template: function (dataItem)
						{
							var title = kendo.htmlEncode(dataItem.DisplayLabel),
								contentStr = title.replace(/ /g, "&nbsp");
							return `<div title="${title}">${contentStr}</div>`;
						},
						width: "253px"
					},
					{
						sortable: {
							compare: function (a, b)
							{
								return parseInt(a.Count) - parseInt(b.Count);
							}
						},
						title: "Count",
						field: "Count",
						width: "65px"
					},
					{
						sortable: false,
						title: "Display",
						field: "Display",
						width: "64px",
						template: function (dataItem)
						{
							let symbolString = ""
							if (dataItem.Selected)
							{
								var color = self.defaultColor[dataItem.RowNumber % self.defaultColor.length];
								if (!dataItem.Display)
								{
									var settings = { "symbol": "0", "size": "12", "color": color, "borderishow": true, "bordersize": "1", "bordercolor": "#000000" };
									symbolString = self.generateStylePreviewHtml(settings);
									dataItem.Display = JSON.stringify(settings);
									dataItem.DisplayObj = JSON.parse(dataItem.Display);
								}
								else
								{
									const displayObj = JSON.parse(dataItem.Display);
									color = displayObj.color;
									symbolString = self.generateStylePreviewHtml(displayObj);
								}
							}
							return `<div class='display-container'>${symbolString}</div>`;
						},
					}
				];
			case TF.ThematicTypeEnum.GRID:
				return [
					{
						sortable: false,
						title: "Color",
						field: "Color",
						width: "32px",
						template: function (dataItem)
						{
							let previewHtml = "";
							if (dataItem.Selected)
							{

								if (dataItem.Display)
								{
									var displayObj = JSON.parse(dataItem.Display);
									dataItem.Display = JSON.stringify(displayObj);

									if (!dataItem.color)
									{
										dataItem.color = self.defaultDisplayConfig.GENERAL.color;
									}

									previewHtml = self.generateStylePreviewHtml(displayObj);
								}
							}

							return `<div class='display-container'>${previewHtml}</div>`;
						},
					}
				];
			default:
				return [];
		}
	}

	/**
	 * Create thematic grid
	 * @returns {void} 
	 */
	ThematicGridViewModel.prototype.createGrid = function (data)
	{
		var self = this;
		self.gridDisplayChanged = false;

		if (self.grid)
		{
			self.grid.destroy();
			self.$element.empty();
		}

		self.$element.removeClass("combination");

		const isEditable = self.thematicType === TF.ThematicTypeEnum.MAP;
		self.grid = self.$element.kendoGrid({
			dataSource: data,
			columns: self.getThematicGridColumns(),
			editable: isEditable,
			sortable: true,
			scrollable: {
				virtual: true
			},
			pageable: {
				numeric: false,
				previousNext: false,
				messages: {
					display: " "
				}
			},
			sort: function (e)
			{
			},
			dataBound: function (e)
			{
				if (self.grid && self.grid.dataSource)
				{
					if (self.grid.dataSource.sort() && self.grid.dataSource.sort()[0])
					{
						var sort = self.grid.dataSource.sort()[0];
						if (!self.sortInfo || self.sortInfo.field !== sort.field || self.sortInfo.dir !== sort.dir)
						{
							self.sortInfo = { field: sort.field, dir: sort.dir };
							//scroll the grid manually to avoid the virtual scrolling issue.
							if (self.grid.element)
							{
								self.grid.element.find(".k-scrollbar-vertical").scrollTop(0);
							}
						}
						self.sortInfo = { field: sort.field, dir: sort.dir };
					}
					else
					{
						if (self.sortInfo)
						{
							self.sortInfo = null;
							if (self.grid.element)
							{
								self.grid.element.find(".k-scrollbar-vertical").scrollTop(0);
							}
						}
						self.sortInfo = null;
					}
				}
				self.onDataBound(e, data);
			},
			selectable: "cell",
			edit: function (arg)
			{
				self.onEditing(arg);
			}
		}).data("kendoGrid");

		if (self.grid.dataSource._sort && self.grid.dataSource._sort.length > 0)
		{
			self.grid.dataSource.sort(self.grid.dataSource._sort);
		}

		self.updateAllOthersRow();
		self.grid.refresh();

		//There a gap between grid content and scroll bar, fix it.
		self.grid.element.find(".k-grid-content").css("padding-right", (self.grid.element.find(".k-scrollbar-vertical").width() - 1) + "px");

		self.updateGridFooter();
		self.updateSelectAllCheckbox(data);
	};

	ThematicGridViewModel.prototype.onColorPickerClick = function (e)
	{
		var self = this;
		var $container = $(e.target).closest(".color-picker");
		var $tr = $container.closest("tr");
		var dataItem = self.grid.dataItem($tr);
		$container.kendoColorPicker(
			{
				buttons: false,
				value: dataItem.DisplayObj.color,
				change: function (e)
				{
					self.selectedColor = e.sender.element[0].value;
					dataItem.Color = self.selectedColor;
					if (dataItem.Display)
					{
						var displayObj = JSON.parse(dataItem.Display);
						displayObj.color = self.selectedColor;
						dataItem.Display = JSON.stringify(displayObj);
					}
				},
				open: function ()
				{
					self.isColorPickerOpened = true;
				}
			});

		$container.data("kendoColorPicker").open();

	}

	ThematicGridViewModel.prototype.updateCounter = function (input, counterDiv)
	{
		var maxLength = 48, length = input.val().length;
		if (length - maxLength >= -8)
		{
			counterDiv.html(maxLength - length);
			counterDiv.css("color", "#333");
			if (length - maxLength > 0)
			{
				counterDiv.css("color", "#D0011B");
			}
		}
		else
		{
			counterDiv.html("");
		}
	};

	ThematicGridViewModel.prototype.checkMaxLength = function (value, arg, counterDiv, input, originalValue)
	{
		var maxLength = 48, self = this, grid = self.grid;
		if (value.length > maxLength)
		{
			var newValue = value.substr(0, maxLength);
			return tf.promiseBootbox.yesNo({
				message: "This name is too long, it will be displayed as " + "\"" + newValue + "\"" + ". Do you want to proceed?",
				title: "Name Length",
				buttons: {
					yes: {
						label: "Proceed",
						className: "btn-primary btn-sm btn-primary-black"
					},
					no: {
						label: "Cancel",
						className: "btn-default btn-sm btn-default-link"
					}
				}
			}).then(function (result)
			{
				if (result)
				{
					arg.model.DisplayLabel = newValue;
					grid.closeCell();
					if (arg.container.find("div").length > 0)
					{
						arg.container.find("div").html(arg.model.DisplayLabel);
					}
				}
				else
				{
					if (originalValue && !self.orginalValue)
					{
						self.orginalValue = originalValue;
					}
					arg.model.DisplayLabel = value;
					counterDiv.remove();
					input.off(".input");
					arg.container.click();
				}
			});
		}
		else
		{
			arg.model.DisplayLabel = value;
			grid.closeCell();
			counterDiv.remove();
			input.off(".input");
		}
	}

	/**
	 * Invoked when edition.
	 * @param {any} arg Event argument.
	 * @returns {void} 
	 */
	ThematicGridViewModel.prototype.onEditing = function (arg)
	{
		var self = this, grid = self.grid,
			input = arg.container.find("input[name='DisplayLabel']"),
			counterDiv = $("<div style='position:absolute;top:9px;right:8px;font-family:SourceSansPro-SemiBold;font-size:10px;'></div>"),
			onProcessing = false,
			originalValue = input.val();

		if (!arg.model.Selected)
		{
			grid.closeCell();
		}

		arg.container.append(counterDiv);
		input.addClass("unBindHotKey");
		input.attr("maxlength", "57");
		self.updateCounter(input, counterDiv);
		input.on("keydown.input", function (e)
		{
			if (e.keyCode === $.ui.keyCode.ENTER)
			{
				var $input = $(this), value = $input.val();
				if (value.trim() === "")
				{
					value = arg.model.Value;
				}
				onProcessing = true;
				setTimeout(function ()
				{
					self.checkMaxLength(value, arg, counterDiv, input, originalValue);
				});
			}
			else if (e.keyCode === $.ui.keyCode.ESCAPE)
			{
				if (self.orginalValue)
				{
					input.val(self.orginalValue);
					arg.model.DisplayLabel = self.orginalValue;
					self.orginalValue = null;
				}
				grid.closeCell();
				input.off(".input");
				counterDiv.remove();
				e.stopPropagation();
			}
		});

		input.on("input.input", function (e)
		{
			self.updateCounter(input, counterDiv);
		});

		input.on("blur.input", function (e)
		{
			if (onProcessing)
			{
				onProcessing = false;
				return;
			}
			var $input = $(this), value = $input.val();
			if (value.trim() === "")
			{
				value = arg.model.Value;
			}
			self.checkMaxLength(value, arg, counterDiv, input, originalValue);
		});
	}

	/**
	 * Update select all checkbox and bing event for it.
	 * @param {Array} data Datasource of grid
	 * @returns {void} 
	 */
	ThematicGridViewModel.prototype.updateSelectAllCheckbox = function (data)
	{
		var self = this, selectAll = $("#selectAll");

		selectAll.prop("disabled", !data || !data.total || data.total() <= 0);

		selectAll.change(function (ev)
		{
			var checked = ev.target.checked, count = data.total(), sourceCount = 0;

			self.combinationFields.length = 0;
			for (var i = 0; i < count; i++)
			{
				var item = data.at(i);
				sourceCount += parseInt(item.Count);
				item.Selected = checked;
				if (checked)
				{
					if (self.disabilityCodeIndex > 0)
					{
						self.combinationFields.push(item);
					}
					if (self.ethnicCodeIndex > 0)
					{
						self.combinationFields.push(item);
					}
					if (!item.Display)
					{
						var color = self.defaultColor[item.RowNumber % self.defaultColor.length],
							currentDisplay = self.generateDefaultDisplay();
						currentDisplay.color = color;
						item.Display = JSON.stringify(currentDisplay);
						item.DisplayObj = JSON.parse(item.Display);
					}
				}
			}
			if (self.allOthersData)
			{
				if (checked)
				{
					self.allOthersData.Count = self.currentDataSourceCount - sourceCount;
				}
				else
				{
					self.allOthersData.Count = self.currentDataSourceCount;
				}

				if (!self.allOthersData.Display && checked)
				{
					var allOthersColor = self.defaultColor[self.allOthersData.RowNumber % self.defaultColor.length],
						allOthersCurrentDisplay = self.generateDefaultDisplay();
					allOthersCurrentDisplay.color = allOthersColor;
					self.allOthersData.Display = JSON.stringify(allOthersCurrentDisplay);
					self.allOthersData.DisplayObj = JSON.parse(self.allOthersData.Display);
				}
			}
			if (checked)
			{
				self.currentSelectedFieldCount = self.currentFieldCount;
				self.currentSelectedRecordCount = self.currentDataSourceCount - parseInt(self.allOthersData.Count);
			}
			else
			{
				self.currentSelectedFieldCount = 0;
				self.currentSelectedRecordCount = 0;
			}

			self.updateAllOthersRow();
			self.updateGridFooter();
			self.grid.refresh();
		});
	}

	/**
	 * Invoked after data bound.
	 * @param {any} e event argument
	 * @returns {void}
	 */
	ThematicGridViewModel.prototype.onDataBound = function (e, data)
	{
		var grid = e.sender, self = this;
		if (!self.grid)
		{
			self.grid = grid;
		}
		grid.element.find(".display-container").off(".display").on("click.display", self.onDisplayCellClick.bind(self));
		grid.element.find(".color-picker").off(".colorpicker").on("click.colorpicker", self.onColorPickerClick.bind(self));
		grid.element.find(".thematicSelected").off(".selected").on("change.selected", function ()
		{
			self.checkBoxChanged(this);
		});
		self.updateAllOthersRow();
	};

	ThematicGridViewModel.prototype.checkBoxChanged = function (checkbox)
	{
		var self = this,
			grid = self.grid,
			data = grid.dataSource,
			$checkBox = $(checkbox),
			$tr = $checkBox.closest("tr"),
			$selectAll = $("#selectAll"),
			$displayCell = $tr.find(`td[data-kendo-field=${self.defaultDisplayConfig.DISPLAY_FIELD_NAME}]`),
			$displayContainer = $displayCell.find(".display"),
			count = data.total();

		const dataItem = grid.dataItem($tr);
		if (dataItem.Selected)
		{
			self.allOthersData.Count = parseInt(self.allOthersData.Count) + parseInt(dataItem.Count) + "";
		}
		else
		{
			self.allOthersData.Count = parseInt(self.allOthersData.Count) - parseInt(dataItem.Count) + "";
		}

		dataItem.Selected = $checkBox.prop("checked");

		if (dataItem.Selected)
		{
			self.currentSelectedFieldCount++;
			self.currentSelectedRecordCount += parseInt(dataItem.Count);
			var allChecked = true;
			for (var i = 0; i < count; i++)
			{
				if (!data.at(i).Selected)
				{
					allChecked = false;
					break;
				}
			}

			if (allChecked)
			{
				$selectAll.prop("checked", true);
			}

			if ($displayContainer.length <= 0)
			{
				var color = self.defaultColor[dataItem.RowNumber % self.defaultColor.length],
					currentDisplay = dataItem.Display ? JSON.parse(dataItem.Display) : self.generateDefaultDisplay();

				if (!dataItem.Display)
				{
					currentDisplay.color = color;
				}

				var previewHtmlStr = self.generateStylePreviewHtml(currentDisplay);
				$displayContainer.append(previewHtmlStr);
				dataItem.Display = JSON.stringify(currentDisplay);
				dataItem.DisplayObj = JSON.parse(dataItem.Display);
			}
			else
			{
				$displayContainer.parent().removeClass("hide");
			}
		}
		else
		{
			self.currentSelectedFieldCount--;
			self.currentSelectedRecordCount -= parseInt(dataItem.Count);
			if ($selectAll.prop("checked"))
			{
				$selectAll.prop("checked", false);
			}

			if ($displayContainer.length > 0)
			{
				$displayContainer.parent().addClass("hide");
			}
		}

		if (self.disabilityCodeIndex > 0)
		{
			self.combinationFields.length = 0;
			for (var i = 0; i < count; i++)
			{
				if (data.at(i).Selected)
				{
					self.combinationFields.push(data.at(i));
				}
			}
		}
		if (self.ethnicCodeIndex > 0)
		{
			self.combinationFields.length = 0;
			for (var i = 0; i < count; i++)
			{
				if (data.at(i).Selected)
				{
					self.combinationFields.push(data.at(i));
				}
			}
		}

		self.updateAllOthersRow();
		self.updateGridFooter();
		self.grid.refresh();
	}


	/**
	 * Update the row in grid for all others
	 * @returns {void} 
	 */
	ThematicGridViewModel.prototype.updateAllOthersRow = function ()
	{
		var self = this;
		self.updateFooterRow();
	};

	/**
	 * Footer cells do not have kendo-data-field, so need to check with indices.
	 *
	 * @param {*} grid
	 * @returns
	 */
	ThematicGridViewModel.prototype.getEssentialColumnIndices = function (grid)
	{
		const columns = grid.columns;
		const { VALUE_FIELD_NAME, LABEL_FIELD_NAME, DISPLAY_FIELD_NAME, COUNT_FIELD_NAME } = this.defaultDisplayConfig;
		let valueIdx = labelIdx = displayIdx = countIdx = 0;

		columns.forEach((col, idx) =>
		{
			switch (col.field)
			{
				case VALUE_FIELD_NAME:
					valueIdx = idx;
					break;
				case LABEL_FIELD_NAME:
					labelIdx = idx;
					break;
				case DISPLAY_FIELD_NAME:
					displayIdx = idx;
					break;
				case COUNT_FIELD_NAME:
					countIdx = idx;
					break;
				default:
					break;
			}
		});

		return { valueIdx, labelIdx, displayIdx, countIdx };
	};

	ThematicGridViewModel.prototype.updateFooterRowCell = function (data, row)
	{
		var self = this,
			row = self.$element.find(".k-grid-footer-wrap tr"),
			tds = row.find("td");

		const columnIndices = self.getEssentialColumnIndices(self.grid);
		const { valueIdx, labelIdx, displayIdx, countIdx } = columnIndices;
		const $displayCell = tds.eq(displayIdx);
		const $valueCell = tds.eq(valueIdx);
		const $countCell = tds.eq(countIdx);

		$valueCell.empty();
		$countCell.empty();
		$displayCell.empty();
		if (!data)
		{
			return;
		}

		$valueCell.html(`<div title="${data.Value}">${data.Value}</div>`);

		$countCell.html(data.Count);

		const displayObj = JSON.parse(data.Display);
		let previewHtmlStr = self.generateStylePreviewHtml(displayObj);

		if (self.thematicType === TF.ThematicTypeEnum.GRID)
		{
			$displayCell.append(previewHtmlStr);
			$displayCell.on("click", function (e)
			{
				var $colorPicker = $(e.target).closest(".color-picker");
				$colorPicker.kendoColorPicker({
					buttons: false,
					value: displayObj.color,
					change: function (e)
					{
						displayObj.color = e.sender.element[0].value;
						data.Display = JSON.stringify(displayObj);
					},
					open: function ()
					{
						self.isColorPickerOpened = true;
					}
				});

				if ($colorPicker.data("kendoColorPicker"))
				{
					$colorPicker.data("kendoColorPicker").open();
				}
			});
		}
		else
		{
			const $labelCell = tds.eq(labelIdx);
			const closeInput = function ()
			{
				$labelCell.empty();

				const title = kendo.htmlEncode(data.DisplayLabel),
					contentStr = title.replace(/ /g, "&nbsp");

				$labelCell.html(`<div title="${title}">${contentStr}</div>`);
			};

			closeInput();

			previewHtmlStr = previewHtmlStr.replace("<svg", "<svg class='display'");
			$displayCell.append("<div class='display-container'>" + previewHtmlStr + "</div>");

			$labelCell.on("click", function (e)
			{
				if (e.target.tagName === "INPUT")
				{
					return;
				}

				var input = $("<input type='text' maxlength='57' class='unBindHotKey'>"), originalValue,
					counterDiv = $("<div style='position:absolute;top:9px;right:8px;font-family:SourceSansPro-SemiBold;font-size:10px;'></div>"),
					maxLength = 48, onProcess = false, checkMaxLength = function (value)
					{
						if (value.length > maxLength)
						{
							var newValue = value.substr(0, maxLength);
							return tf.promiseBootbox.yesNo({
								message: `This name is too long, it will be displayed as "${newValue}". Do you want to proceed?`,
								title: "Name Length",
								buttons: {
									yes: {
										label: "Proceed",
										className: "btn-primary btn-sm btn-primary-black"
									},
									no: {
										label: "Cancel",
										className: "btn-default btn-sm btn-default-link"
									}
								}
							}).then(function (result)
							{
								if (result)
								{
									data.DisplayLabel = newValue;
									counterDiv.remove();
									$labelCell.removeClass("editing");
									closeInput();
								}
								else
								{
									data.DisplayLabel = value;
									input.focus();
								}
							});
						}
						else
						{
							data.DisplayLabel = value;
							input.off(".allotherInput");
							$labelCell.removeClass("editing");
							counterDiv.remove();
							closeInput();
						}
					};

				$labelCell.empty();
				$labelCell.append(input);
				originalValue = data.DisplayLabel;
				input.val(data.DisplayLabel);
				input.focus();

				$labelCell.append(counterDiv);
				$labelCell.addClass("editing");
				self.updateCounter(input, counterDiv);

				input.on("keydown.allotherInput", function (e)
				{
					if (e.keyCode === $.ui.keyCode.ENTER)
					{
						var $input = $(this), value = $input.val();
						if (value.trim() === "")
						{
							value = data.Value;
						}

						onProcess = true;
						setTimeout(function ()
						{
							checkMaxLength(value);
						});
					}
					else if (e.keyCode === $.ui.keyCode.ESCAPE)
					{
						input.off(".allotherInput");
						counterDiv.remove();
						data.DisplayLabel = originalValue;
						closeInput();
						$labelCell.removeClass("editing");
						e.stopPropagation();
					}
				});

				input.on("input.allotherInput", function (e)
				{
					self.updateCounter(input, counterDiv);
				});

				input.on("blur.allotherInput", function (e)
				{
					if (onProcess)
					{
						onProcess = false;
						return;
					}
					var $input = $(this), value = $input.val();
					if (value.trim() === "")
					{
						value = data.Value;
					}

					checkMaxLength(value, input);
				});
			});

			$displayCell.find(".display-container").on("click", self.onDisplayCellClick.bind(self));
		}
	}

	ThematicGridViewModel.prototype.updateFooterRow = function ()
	{
		var self = this, $row;
		self.$element.find(".k-grid-footer-wrap tr.combination").remove();
		$row = self.$element.find(".k-grid-footer-wrap tr")

		self.updateFooterRowCell(self.allOthersData, $row);
	};

	/**
	 * Update the footer information of grid.
	 * @returns {void} 
	 */
	ThematicGridViewModel.prototype.updateGridFooter = function ()
	{
		var self = this, dataType, currentSelectedRecordCount = self.currentSelectedRecordCount;

		if (self.combinationFields.length > 1)
		{
			currentSelectedRecordCount = self.currentDataSourceCount - self.allOthersData.Count;
		}

		self.grid.element.find(".k-grid-pager").empty();
		if (self.currentDataSourceCount > 0)
		{
			dataType = tf.dataTypeHelper.getDisplayNameByDataType(self.dataType);
			dataType = self.currentDataSourceCount > 1
				? tf.applicationTerm.getApplicationTermPluralByName(dataType)
				: tf.applicationTerm.getApplicationTermSingularByName(dataType);

			const pagerHtmlStr = self.numberFormatter(self.currentSelectedFieldCount) + " of " + self.numberFormatter(self.currentFieldCount) +
				" fields selected (" + self.numberFormatter(currentSelectedRecordCount) + " of " + self.numberFormatter(self.currentDataSourceCount) + " " + dataType + " shown)";
			self.grid.element.find(".k-grid-pager").html(pagerHtmlStr);
		}
	}

	/**
	 * Format the number so it has ','.
	 * @param {Any} number The input number or string.
	 * @return {string} The formatted number.
	 */
	ThematicGridViewModel.prototype.numberFormatter = function (number)
	{
		return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	};

	/**
	 * Fires after clicked the display column of grid.
	 * @returns {void} 
	 */
	ThematicGridViewModel.prototype.onDisplayCellClick = function (e)
	{
		if (e.target.className === "display-container") { return; }

		if (this.thematicType === TF.ThematicTypeEnum.MAP)
		{
			const $container = $(e.target).closest(".display-container");
			this.openAdjustDisplayModal($container);
		}
	};

	/**
	 * Open adjust value display modal, now only for map thematic.
	 *
	 * @param {*} $container
	 * @returns
	 */
	ThematicGridViewModel.prototype.openAdjustDisplayModal = function ($container)
	{
		var self = this, tr, selectedData, displayData,
			selected = $container.parent();

		if (selected.length <= 0)
		{
			return;
		}

		tr = selected.parent();

		if (tr.hasClass("k-footer-template"))
		{
			selectedData = self.allOthersData;
		}
		else
		{
			selectedData = self.grid.dataItem(selected.parent());
		}

		if ($container.length > 0 && selectedData.Selected)
		{
			if (selectedData.Display)
			{
				displayData = JSON.parse(selectedData.Display);
			}
			else
			{
				displayData = self.generateDefaultDisplay();
				selectedData.DisplayObj = displayData;
				selectedData.Display = JSON.stringify(displayData);
			}

			var displayDetail = {
				symbol: displayData.symbol,
				size: displayData.size,
				color: displayData.color,
				name: selectedData.DisplayLabel,
				borderishow: displayData.borderishow,
				bordersize: displayData.bordersize,
				bordercolor: displayData.bordercolor
			};

			tf.modalManager.showModal(new TF.Modal.AdjustValueDisplayModalViewModel(displayDetail))
				.then(function (result)
				{
					if (result)
					{
						self.updateDisplayContainer($container, result);
						selectedData.Display = JSON.stringify(result);
						selectedData.DisplayObj = JSON.parse(selectedData.Display);
						if (result.changed)
						{
							self.gridDisplayChanged = true;
						}
					}
				});
		}
	};

	/**
	 * Update the Display container in the grid based on display setting.
	 * @param {jQuery} $container The jQuery element.
	 * @param {Object} setting The display setting to be applied.
	 * @return {void}
	 */
	ThematicGridViewModel.prototype.updateDisplayContainer = function ($container, setting)
	{
		var self = this;

		if (setting)
		{
			$container.empty();
			const previewHtmlStr = self.generateStylePreviewHtml(setting);
			$container.append(previewHtmlStr);
		}
	};

	/**
	 * Gets the symbol html.
	 * @return {String} The symbol html
	 */
	ThematicGridViewModel.prototype.GetSymbolString = function (setting)
	{
		var borderColor, borderSize, maxdisplaySize = 24;
		if (setting.borderishow)
		{
			borderColor = setting.bordercolor;
			borderSize = setting.bordersize;
		}
		var symbolString = TF.Helper.AdjustValueSymbolHelper.getSVGSymbolString(setting.symbol, setting.color, setting.size, borderColor, borderSize, maxdisplaySize);
		symbolString = symbolString.replace("<svg", "<svg class='display'");
		return symbolString;
	}

	/**
	 * convert utc time to local.
	 * @return {String} The formatted date string
	 */
	ThematicGridViewModel.prototype.utc2Local = function (value)
	{
		const dt = utcToClientTimeZone(value);
		return dt.isValid() ? dt.format("MM/DD/YYYY hh:mm A") : "";
	}

	/**
	 * Dispose this view model
	 * @returns {void} 
	 */
	ThematicGridViewModel.prototype.dispose = function ()
	{
		if (self.grid)
		{
			self.grid.destroy();
		}
	}
})()

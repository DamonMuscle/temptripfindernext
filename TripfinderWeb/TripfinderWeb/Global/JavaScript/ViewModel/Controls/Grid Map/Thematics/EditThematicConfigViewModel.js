(function()
{
	createNamespace("TF.Control").EditThematicConfigViewModel = EditThematicConfigViewModel;

	function EditThematicConfigViewModel(grid, isNew, thematicsEntity, shortCutKeyName, isDetailView, thematicType)
	{
		const self = this;

		self.mapGrid = grid;
		self.gridType = grid._gridType == "district" && thematicType === TF.ThematicTypeEnum.MAP ? "school" : grid._gridType;
		self.dataFieldHelper = new TF.Map.Thematics.DataFieldHelper();

		self.requireNameInput = ko.observable(!!(thematicsEntity && thematicsEntity.Id !== 0));
		if (thematicsEntity)
		{
			if (isNew)
			{
				thematicsEntity.Id = 0;
				thematicsEntity.Name = "";
			}

			self.quickFilterInfo = self.restoreQuickFiltersToCurrentUnitOfMeasurement(JSON.parse(thematicsEntity.QuickFilters));
			// forward compatibility: support 'Sex' field.
			const PREVIOUS_GENDER_NAME = 'Sex';
			const CURRENT_GENDER_NAME = 'Gender';
			if (self.quickFilterInfo.filter(item => item.field === PREVIOUS_GENDER_NAME).length > 0)
			{
				const sexFilterInfos = self.quickFilterInfo.filter(item => item.field === PREVIOUS_GENDER_NAME);
				sexFilterInfos.forEach(filter =>
				{
					filter.field = CURRENT_GENDER_NAME;
				});
				thematicsEntity.QuickFilters = JSON.stringify(self.quickFilterInfo);
			}

			if (Object.prototype.toString.call(thematicsEntity.CustomDisplaySetting) !== '[object Array]')
			{
				self.customDisplaySetting = JSON.parse(thematicsEntity.CustomDisplaySetting);
			}
			else
			{
				self.customDisplaySetting = thematicsEntity.CustomDisplaySetting;
			}

			self.customDisplaySetting = self.restoreCustomDisplaySettingsToCurrentUnitOfMeasurement(self.customDisplaySetting);

			delete thematicsEntity.APIIsDirty;
			delete thematicsEntity.APIIsNew;
			delete thematicsEntity.APIToDelete;
		}

		self.isDetailView = isDetailView;
		self.isNew = ko.observable(isNew);
		self.thematicsEntity = thematicsEntity;
		self.element = null;
		self.shortCutKeyName = shortCutKeyName;
		self.thematicType = thematicType;
		self.showApplyThematic = thematicType === TF.ThematicTypeEnum.GRID;
		self.obApplyOnSave = ko.observable(false);

		// Template after render
		tf.loadingIndicator.showImmediately();
		self.initQuickfilterFinish = () => 
		{
			tf.loadingIndicator.tryHide();
			self.afterInitQuickfilterFinish();
		};

		// Page level
		self.getGridSelectRecords = self.getGridSelectRecords.bind(self);
		self.pageLevelViewModel = new TF.PageLevel.EditThematicConfigPageLevelViewModel(self.getGridSelectRecords);
		self.obEntityDataModel = ko.observable(new TF.DataModel.ThematicConfigurationDataModel(thematicsEntity));

		var type = grid.dataType === 'unassignedStudents' ? grid.dataType : self.gridType;
		var dataColumns = self.mapGrid && self.mapGrid.kendoGrid ? self.mapGrid.kendoGrid.columns : null;
		var availableColumns = self.dataFieldHelper.getColumnsByType(type, dataColumns);
		self.quickfilterData = ko.observable();

		tf.UDFDefinition.udfHelper.getCurrentDBUDFs(type).then(function(items)
		{
			items.forEach(i =>
			{
				i.FieldName = i.DisplayName;
				i.type = TF.DetailView.UserDefinedFieldHelper.getType(i);
			});

			availableColumns = availableColumns.concat(items);
			self.availableColumns = Array.sortBy(availableColumns, "DisplayName");

			// QuickFilter
			let quickFilterData = new TF.Map.Thematics.QuickFilterViewModel(self.gridType, self.availableColumns, self.quickFilterInfo, self.thematicType);
			quickFilterData.onFilterChange.subscribe(self.updateGridData.bind(self));
			quickFilterData.onFieldReordered.subscribe(self.setInitDisplaySetting.bind(self));
			self.quickfilterData(quickFilterData);
		});
	}

	/**
	 * Initialization.
	 * @returns {void}
	 */
	EditThematicConfigViewModel.prototype.init = function(model, element)
	{
		var self = this, sortInfo;

		if (self.thematicsEntity && self.thematicsEntity.SortInfo)
		{
			sortInfo = JSON.parse(self.thematicsEntity.SortInfo);
		}

		self.element = element;
		self.$grid = $(element).find(".thematic-grid");
		if (self.requireNameInput())
		{
			$(element).find(".grid").addClass("edit");
		}
		self.thematicGridViewModel = new TF.Map.Thematics.ThematicGridViewModel(self.mapGrid, self.customDisplaySetting, self.$grid, sortInfo, self.thematicType, self.dataFieldHelper);

		self.validationInit();
	};

	EditThematicConfigViewModel.prototype.restoreQuickFiltersToCurrentUnitOfMeasurement = function(quickFilters)
	{
		const self = this,
			type = self.mapGrid.dataType === 'unassignedStudents' ? self.mapGrid.dataType : self.gridType,
			availableColumns = self.dataFieldHelper.getColumnsByType(type);

		return quickFilters.map(qf =>
		{
			const matchedField = availableColumns.find(x => x.FieldName === qf.field && x.UnitOfMeasureSupported);
			if (matchedField && tf.measurementUnitConverter.isNeedConversion(matchedField.UnitInDatabase))
			{
				const precision = matchedField.Precision || 2;
				if (qf.filterType === "custom")
				{
					const filterValue = typeof qf.filterValue === "string" ? JSON.parse(qf.filterValue) : qf.filterValue;
					["firstFilter", "secondFilter"].forEach(key =>
					{
						if (filterValue[key])
						{
							const value = tf.measurementUnitConverter.convert({
								originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
								targetUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Imperial,
								precision,
								isReverse: !!matchedField.UnitOfMeasureReverse,
								value: filterValue[key].value,
								unitType: matchedField.UnitTypeOfMeasureSupported
							});

							if (!Number.isNaN(value))
							{
								filterValue[key].value = value;
							}
						}
					});

					qf.filterValue = JSON.stringify(filterValue);
				}
				else if (!["", undefined, null].includes(qf.filterValue))
				{
					const value = tf.measurementUnitConverter.convert({
						originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
						targetUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Imperial,
						precision,
						isReverse: !!matchedField.UnitOfMeasureReverse,
						value: qf.filterValue,
						unitType: matchedField.UnitTypeOfMeasureSupported
					});

					if (!Number.isNaN(value))
					{
						qf.filterValue = value;
					}
				}
			}

			return qf;
		});
	};

	EditThematicConfigViewModel.prototype.restoreCustomDisplaySettingsToCurrentUnitOfMeasurement = function(displaySettings)
	{
		const self = this,
			type = self.mapGrid.dataType === 'unassignedStudents' ? self.mapGrid.dataType : self.gridType,
			availableColumns = self.dataFieldHelper.getColumnsByType(type);

		const unitOfMeasureFields = (self.quickFilterInfo || []).map(qf =>
		{
			return availableColumns.find(x => x.FieldName === qf.field && x.UnitOfMeasureSupported);
		});

		return displaySettings?.map(setting =>
		{
			const isOtherValues = setting.Value === "All Other Values" && !Object.prototype.hasOwnProperty.call(setting, "Value1")
			if (!isOtherValues)
			{
				["1", "2", "3"].filter(x => Object.prototype.hasOwnProperty.call(setting, "Value" + x)).forEach((partialKey, index) =>
				{
					let existingModification = false;

					const additionKey = `AdditionalValue${partialKey}`;
					if (Object.keys(setting).includes(additionKey))
					{
						existingModification = true;
						setting[`Value${partialKey}`] = setting[additionKey];
					}
					else
					{
						const unitOfMeasureFieldDefinition = unitOfMeasureFields[index];
						if (!["", undefined, null].includes(setting[`Value${partialKey}`])
							&& unitOfMeasureFieldDefinition
							&& tf.measurementUnitConverter.isNeedConversion(unitOfMeasureFieldDefinition.UnitInDatabase))
						{
							const precision = unitOfMeasureFieldDefinition.Precision || 2;

							setting[`Value${partialKey}`] = (tf.measurementUnitConverter.convert({
								originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
								targetUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Imperial,
								precision,
								isReverse: !!unitOfMeasureFieldDefinition.UnitOfMeasureReverse,
								value: setting[`Value${partialKey}`],
								unitType: unitOfMeasureFieldDefinition.UnitTypeOfMeasureSupported
							})).toFixed(precision);
							existingModification = true;
						}
					}

					if (existingModification)
					{
						setting.Value = ["1", "2", "3"].filter(x => Object.prototype.hasOwnProperty.call(setting, "Value" + x)).map(x => setting["Value" + x]).join(", ");
					}
				});
			}

			return setting;
		});
	}
	/**
	 * Quick filter html was loaded
	 * @param {object} model knockout data model.
	 * @param {object} e html element.
	 * @return {void}
	 */
	EditThematicConfigViewModel.prototype.afterInitQuickfilterFinish = function(model, element)
	{
		var self = this;
		var action = () =>
		{
			if (self.quickFilterInfo)
			{
				self.quickfilterData().UpdateLastEnableDargHandleStyle();
			}
			self.quickfilterData().bindDragAndDropEvent();
		};

		if (self.quickfilterData())
		{
			action();
			return;
		}


		if (self.quickfilterDataChanged)
		{
			return;
		}

		self.quickfilterDataChanged = self.quickfilterData.subscribe(() =>
		{
			if (self.quickfilterData())
			{
				action();
				if (self.quickfilterDataChanged)
				{
					self.quickfilterDataChanged.dispose();
					self.quickfilterDataChanged = null;
				}
			}
		});
	};

	/**
	 * Validation initialization.
	 * @returns {void}
	 */
	EditThematicConfigViewModel.prototype.validationInit = function(model, element)
	{
		var self = this,
			validatorFields = {}, validatorPersistence = { "name": false },
			isValidating = false;

		validatorFields.name = {
			trigger: "blur change",
			validators:
			{
				notEmpty: {
					message: " required"
				},
				callback: {
					message: " must be unique",
					callback: function(value, validator, $field)
					{
						if (!value)
						{
							return true;
						}
						$field.addClass("delay-show");
						var $callbackElement = $field.parent().find("[data-bv-validator=callback]"),
							className = validatorPersistence.name ? "always-show" : "always-hide",
							borderColor = validatorPersistence.name ? "#e71931" : "";

						$field.css("border-color", borderColor);
						$callbackElement.addClass(className);

						const paramData = tf.dataTypeHelper.getParamDataByThematicType(self.thematicType, self.gridType, value);
						return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "thematicconfigs"), {
							paramData: paramData
						}, { overlay: false }).then(function(response)
						{
							if (!self || !self.thematicsEntity)
							{
								return;
							}
							var isValid = true;
							if (Enumerable.From(response.Items || []).Any(function(c) { return c.Id != self.thematicsEntity.Id; }))
							{
								isValid = false;
							}
							$field.css("border-color", "");
							$callbackElement.removeClass(className);
							validatorPersistence.name = !isValid;
							$field.removeClass("delay-show");
							return isValid;

						});
					}
				}
			}
		};

		$(self.element).bootstrapValidator(
			{
				excluded: [':hidden', ':not(:visible)'],
				live: 'enabled',
				message: 'This value is not valid',
				fields: validatorFields
			}).on('success.field.bv', function(e, data)
			{
				if (!isValidating)
				{
					isValidating = true;
					self.pageLevelViewModel.saveValidate(data.element).then(function()
					{
						isValidating = false;
					});
				}
			});

		self.pageLevelViewModel.load($(self.element).data("bootstrapValidator"));
	};

	/**
	 * reset the selected rows's display.
	 * @returns {void}
	 */
	EditThematicConfigViewModel.prototype.thematicGridReset = function()
	{
		var self = this;
		self.thematicGridViewModel.resetDisplayCheck();
		if (self.thematicGridViewModel.gridDisplayChanged)
		{
			tf.promiseBootbox.dialog(
				{
					closeButton: true,
					title: "Reset Confirmation",
					message: "One or more of the Values have been adjusted to display in a different Symbol, Color, and/or Size.  Are you sure you want to reset these Values?",
					buttons:
					{
						save:
						{
							label: "Yes",
							className: "btn tf-btn-black btn-sm"
						},
						cancel:
						{
							label: "No",
							className: "btn btn-link btn-sm"
						}
					}
				})
				.then(function(operation)
				{
					if (operation && operation.toLowerCase() === "save")
					{
						self.thematicGridViewModel.resetDisplay();
					}
				});
		}
	};

	/**
	 * Update grid data by filter set.
	 * @param {object} e EventData.
	 * @param {object} result The filter set.
	 */
	EditThematicConfigViewModel.prototype.updateGridData = function(e, result)
	{
		this.thematicGridViewModel.options = { quickFilterData: this.quickfilterData() };
		this.thematicGridViewModel.setFieldsInfo(result, this.availableColumns);
	};

	/**
	 * Set display setting for thematic grid.
	 * @param {object} e EventData.
	 * @param {object} result The filter set.
	 */
	EditThematicConfigViewModel.prototype.setInitDisplaySetting = function(e, result)
	{
		var self = this, selectedRecords = [];

		function updateGridRecord(item, formattedValue, value, unitOfMeasureField)
		{
			var newValue;
			item["Value" + i] = value;
			item["FormattedValue" + i] = formattedValue;
			item["unitOfMeasureField" + i] = unitOfMeasureField;
			if (item["FormattedValue1"] === undefined && item["FormattedValue2"] === undefined && item["FormattedValue3"] === undefined)
			{
				return item;
			}
			newValue = item["FormattedValue1"] +
				(item["FormattedValue2"] !== undefined ? ", " + item["FormattedValue2"] : "") +
				(item["FormattedValue3"] !== undefined ? ", " + item["FormattedValue3"] : "");
			if (item["Value"] === item["DisplayLabel"])
			{
				item["DisplayLabel"] = newValue;
			}
			item["Value"] = newValue;
			if (item["Selected"])
			{
				selectedRecords.push(getSelectItem(item));
			}
			return item;
		}

		function getSelectItem(item)
		{
			var display = item.DisplayObj;
			var selectedItem = {
				DisplayLabel: item.DisplayLabel,
				Value: item.Value,
				Size: display.size,
				Color: display.color,
				Symbol: display.symbol,
				Value1: item.Value1,
				Value2: item.Value2,
				Value3: item.Value3,
				Changed: (undefined === display.changed) ? false : display.changed,
				IsWithBorder: display.borderishow,
				BorderWidth: display.bordersize,
				BorderColor: display.bordercolor
			};
			return selectedItem;
		}

		var i, value, unitOfMeasureField, formattedValue, startIndex = result.startIndex + 1, endIndex = result.endIndex + 1,
			thematicGrid = self.thematicGridViewModel, records = thematicGrid.getGridData();
		if (startIndex < endIndex)
		{
			records = records.map(function(item)
			{
				value = item["Value" + startIndex];
				formattedValue = item["FormattedValue" + startIndex];
				unitOfMeasureField = item["unitOfMeasureField" + startIndex];

				for (i = startIndex; i < endIndex; i++)
				{
					if (item["Value" + (i + 1)] === undefined)
					{
						break;
					}
					item["Value" + i] = item["Value" + (i + 1)];
					item["FormattedValue" + i] = item["FormattedValue" + (i + 1)];
					item["unitOfMeasureField" + i] = item["unitOfMeasureField" + (i + 1)];
				}
				item = updateGridRecord(item, formattedValue, value, unitOfMeasureField);
				return item;
			});
		}
		else
		{
			records = records.map(function(item)
			{
				value = undefined;
				formattedValue = undefined;
				unitOfMeasureField = undefined;
				for (i = startIndex; i > endIndex; i--)
				{
					if (item["Value" + i] === undefined)
					{
						continue;
					}
					if (value === undefined)
					{
						value = item["Value" + i];
						formattedValue = item["FormattedValue" + i];
						unitOfMeasureField = item["unitOfMeasureField" + i];
					}
					item["Value" + i] = item["Value" + (i - 1)];
					item["FormattedValue" + i] = item["FormattedValue" + (i - 1)];
					item["unitOfMeasureField" + i] = item["unitOfMeasureField" + (i - 1)];
				}
				item = updateGridRecord(item, formattedValue, value, unitOfMeasureField);
				return item;
			});
		}
		thematicGrid.stickyGridData = records;

		var allothersItem = thematicGrid.allOthersData;
		if (allothersItem && allothersItem.Selected)
		{
			selectedRecords.push(getSelectItem(allothersItem));
		}
		if (selectedRecords.length > 0)
		{
			thematicGrid.initDisplaySetting = selectedRecords;
		}
	};

	/**
	 * The save function.
	 * @returns {void}
	 */
	EditThematicConfigViewModel.prototype.apply = function()
	{
		var self = this;
		return self.trySave();
	};

	/**
	 * Get entity data for temporary display.
	 * @return {Object} The thematic entity with extra information.
	 */
	EditThematicConfigViewModel.prototype.getTempEntityData = function()
	{
		var self = this, dataObj,
			validationResult = self.pageLevelViewModel.getThematicValidation();

		if (!validationResult) { return Promise.resolve(false); }

		dataObj = self.getEntityData();
		if (self.thematicType === TF.ThematicTypeEnum.MAP)
		{
			dataObj.Id = 0;
		}
		dataObj.Name = "";
		dataObj.DBID = tf.datasourceManager.databaseId;
		dataObj.CustomDisplaySetting = JSON.stringify(dataObj.CustomDisplaySetting);
		if (self.thematicType === TF.ThematicTypeEnum.GRID && self.mapGrid.obGridThematicDataModels && self.mapGrid.obGridThematicDataModels())
		{
			var tempThematicDataModel = self.mapGrid.obGridThematicDataModels().find(data => data.id() === dataObj.Id);
			if (tempThematicDataModel)
			{
				tempThematicDataModel.customDisplaySetting(dataObj.CustomDisplaySetting);
				self.mapGrid.tempGridThematicDataModel = tempThematicDataModel;
				self.mapGrid.selectedGridThematicConfigs = self.mapGrid.getSelectedGridThematicConigs();
			}
			else
			{
				self.mapGrid.tempGridThematicDataModel = TF.DataModel.BaseDataModel.create(TF.DataModel.ThematicConfigurationDataModel, dataObj);
				self.mapGrid.selectedGridThematicConfigs = self.mapGrid.getSelectedGridThematicConigs();
			}
		}

		if (self.gridType === 'gpsevent')
		{
			self.addFilterOpions(dataObj);
		}
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "thematicdisplaysettings"), { data: dataObj }).then(function(response)
		{
			dataObj.DisplaySettingIds = response.Items[0];
			return TF.Helper.ThematicHelper.setCustomDisplaySettingIds(dataObj, null, self.mapGrid.requestOptions && self.mapGrid.requestOptions().data.filterSet).then(function()
			{
				return dataObj || null;
			});
		}).catch(function(e)
		{
			if (e.StatusCode == 404) return null;
		});
	};

	/**
	 * The cancel function.
	 * @returns {void}
	 */
	EditThematicConfigViewModel.prototype.cancel = function(optionType)
	{
		const self = this;
		return new Promise(function(resolve)
		{
			if (optionType)
			{
				let filtersName = self.quickfilterData().getFiltersInfo().filter(function(a) { return a.field; }),
					dataModelName = self.obEntityDataModel().name();
				if (filtersName.length > 0 || dataModelName.length > 0 || (self.thematicGridViewModel.allOthersData && self.thematicGridViewModel.allOthersData.Selected))
				{
					resolve(tf.promiseBootbox.yesNo("Are you sure you want to cancel?", "Confirmation").then(function(result)
					{
						return result ? false : null;
					}));
				}
				else
				{
					resolve(false);
				}
			}
			else
			{
				if (self.thematicsEntity.Name !== self.obEntityDataModel().name()
					|| JSON.stringify(self.quickFilterInfo) !== JSON.stringify(self.quickfilterData().getFiltersInfo(true))
					|| self.thematicsEntity.SortInfo !== self.obEntityDataModel().sortInfo())
				{
					resolve(tf.promiseBootbox.yesNo("You have unsaved changes. Would you like to save your changes prior to canceling?", "Unsave Confirmation").then(function(response)
					{
						if (response)
						{
							return self.trySave();
						}
						return response === false ? false : null;
					}));
				}
				else
				{
					resolve(false);
				}
			}
		});
	};

	/**
	 * Validation for save function.
	 * @returns {Promise} the validate result.
	 */
	EditThematicConfigViewModel.prototype.validation = function()
	{
		return this.pageLevelViewModel.saveValidateExtend();
	};

	/**
	 * Try to save.
	 * @returns {void} the save entity.
	 */
	EditThematicConfigViewModel.prototype.trySave = function()
	{
		var self = this, requireNameModal = !self.requireNameInput(),
			getNameInput, dataObj;
		const udgridId = self.mapGrid.options && self.mapGrid.options.gridData && self.mapGrid.options.gridData.value;
		return self.validation().then(function(ValidationResult)
		{
			if (!ValidationResult) { return Promise.resolve(null); }

			getNameInput = requireNameModal ? tf.modalManager.showModal(new TF.Modal.SaveNewThematicModalViewModel(self.gridType, self.shortCutKeyName, self.thematicType, udgridId)) : null;

			return Promise.all([getNameInput]).then(function(response)
			{
				if (requireNameModal)
				{
					if (!response[0]) { return; }
					self.obEntityDataModel().name(response[0]);
				}

				dataObj = self.getEntityData();
				dataObj.Name = dataObj.Name.trim();
				dataObj.DBID = self.thematicType === TF.ThematicTypeEnum.GRID ? null : tf.datasourceManager.databaseId;
				dataObj.CustomDisplaySetting = JSON.stringify(dataObj.CustomDisplaySetting);
				dataObj.Type = self.thematicType === TF.ThematicTypeEnum.GRID ? self.thematicType : TF.ThematicTypeEnum.MAP;
				dataObj.UDGridId = udgridId;

				const isGridThematic = self.thematicType === TF.ThematicTypeEnum.GRID;
				if (self.gridType === 'gpsevent' && !isGridThematic)
				{
					self.addFilterOpions(dataObj);
				}

				const url = isGridThematic ? "thematicconfigs" : "thematicconfigs?@relationships=displaysettings";

				return tf.promiseAjax[self.isNew() ? "post" : "put"](pathCombine(tf.api.apiPrefixWithoutDatabase(), url), { data: [dataObj] }).then(function(saveResult)
				{
					if (isGridThematic)
					{
						saveResult.Items[0].DBID = tf.datasourceManager.databaseId;
					}

					if (self.obApplyOnSave())
					{
						self.mapGrid.obSelectedGridThematicId(saveResult.Items[0].Id);
					}

					if (isGridThematic)
					{
						return saveResult.Items[0];
					}
					else
					{
						return TF.Helper.ThematicHelper.setCustomDisplaySettingIds(saveResult.Items[0], null, self.mapGrid.requestOptions && self.mapGrid.requestOptions().data.filterSet).then(function()
						{
							PubSub.publish(topicCombine(pb.DATA_CHANGE, "thematicMenu"));
							return saveResult.Items[0] || null;
						});
					}
				});
			});
		});
	};

	EditThematicConfigViewModel.prototype.addFilterOpions = function(dataObj)
	{
		if (!this.mapGrid || !this.mapGrid.requestOptions)
		{
			return;
		}
		let quickFilter = JSON.parse(dataObj.QuickFilters);
		let filterSet = this.mapGrid.requestOptions().data.filterSet;
		dataObj.QuickFilters = JSON.stringify(quickFilter.concat(filterSet));
	}

	/**
	 * Generate entity data object.
	 * @return {Object} The formatted entity data object.
	 */
	EditThematicConfigViewModel.prototype.getEntityData = function()
	{
		var self = this;
		self.obEntityDataModel().dataTypeID(tf.dataTypeHelper.getId(self.isDetailView ? "student" : self.gridType));
		self.obEntityDataModel().quickFilters(JSON.stringify(self.quickfilterData().getFiltersInfo()));
		self.obEntityDataModel().sortInfo(self.thematicGridViewModel.getSortInfo());
		self.obEntityDataModel().customDisplaySetting(self.getGridSelectRecords());
		return self.obEntityDataModel().toData();
	};

	/**
	 * Gets the records which are selected on grid.
	 * @returns {Array} The array of records
	 */
	EditThematicConfigViewModel.prototype.getGridSelectRecords = function()
	{
		let self = this,
			records = self.thematicGridViewModel ? self.thematicGridViewModel.getSelectRecords() : null;
		if (records && records.length > 0)
		{
			return records;
		}
	};

	/**
	 * The dispose function.
	 * @returns {void}
	 */
	EditThematicConfigViewModel.prototype.dispose = function()
	{
		var self = this;
		var quickfilterData = self.quickfilterData();
		if (quickfilterData)
		{
			quickfilterData.dispose();
		}

		self.thematicGridViewModel.dispose();
		self.pageLevelViewModel.dispose();
		self.dataFieldHelper.dispose();
		tfdispose(self);
	};
})();

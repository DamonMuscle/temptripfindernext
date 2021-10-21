(function()
{
	createNamespace('TF.Control.Report').BaseRunReportViewModel = BaseRunReportViewModel;

	var DBID_ITEMKEY = "DBID_ITEMKEY";
	var RECORD_METHOD_ITEMKEY = "RECORD_METHOD_ITEMKEY";
	var FILTER_NAME_ITEMKEY = "33FILTER_NAME_ITEMKEY";
	var RECORD_IDS_ITEMKEY = "RECORD_IDS_ITEMKEY";
	var PARAMETER_MAP_ITEMKEY = "PARAMETER_MAP_ITEMKEY";
	var MAP_SETTINGS_ITEMKEY = "MAP_SETTINGS"
	var OUTPUT_TYPE_KEY = "OUTPUT_TYPE_KEY";
	var DEFAULT_EMPTY_FILTER = {
		name: "",
		whereClause: "",
		id: 0,
		isValid: true
	};
	const CLASS_NAME_FORM_GROUP = ".form-group";
	function parseRecordIdsFromString(str)
	{
		if (!str || typeof (str) !== "string")
		{
			return [];
		}

		return str.split(",").filter(function(field)
		{
			return !!field && $.isNumeric(field);
		}).map(function(field)
		{
			return Number.parseInt(field);
		});
	}

	function convertRecordsToString(records)
	{
		if (!Array.isArray(records))
		{
			return "";
		}

		var idList = records.filter(function(r)
		{
			return !!r && (!!r.Id || !!r.id || !!r.ID);
		}).map(function(r)
		{
			return r.Id || r.id || r.ID;
		});

		return idList.join(",");
	}

	function BaseRunReportViewModel(option)
	{
		var self = this,
			entity = option.entity,
			schema = tf.dataTypeHelper.getReportDataSchemaById(entity.ReportDataSchemaID),
			dataType = tf.dataTypeHelper.getKeyById(schema.DataTypeId),
			explicitRecordIds = option.explicitRecordIds;

		// General variables.
		self.element = null;
		self.availableFilters = null;
		self.entity = entity;
		self.schema = schema;
		self.dataType = dataType;

		// Copy and paste from VF.
		self.IsFirstLoading = true;


		self.fromSchedule = ko.observable(option['fromSchedule'] && option['fromSchedule'] === true);
		self.generateMapSettingProperties();
		self.generateFilterSettingProperties();	// Prepare observables and properties for fitler settings
		self.generateParameterItemViewModels();	// Generate ViewModels for each report parameters
		if (Array.isArray(explicitRecordIds) && explicitRecordIds.length > 0)
		{
			self.useExplicitRecordIdsAsDefaultFilterSettings(explicitRecordIds);	// overwrite original default setting if record Ids are explicitly supplied
		}

		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
	}

	BaseRunReportViewModel.prototype.generateMapSettingProperties = function()
	{
		var self = this, mapSettings = null,
			execInfo = self.entity.execInfo,
			baseMaps = tf.exagoBIHelper.baseMaps();
		if (execInfo[MAP_SETTINGS_ITEMKEY])
		{
			// Solve the settings in old version
			if (execInfo[MAP_SETTINGS_ITEMKEY].BaseMap)
			{
				console.warn("Expired map setting is now being rebuilt");
				mapSettings = self.initMapSettings(execInfo[MAP_SETTINGS_ITEMKEY])
			}
			else
			{
				mapSettings = execInfo[MAP_SETTINGS_ITEMKEY];
			}
		}
		else
		{
			mapSettings = self.initMapSettings();
		}
		const { isTripMapUsed = false, isStudentMapUsed = false, isTripStopMapUsed = false } = self.entity;
		const isMapAvailable = isTripMapUsed || isStudentMapUsed || isTripStopMapUsed;

		self.obMapAvailiable = ko.observable(isMapAvailable);

		self.obIsTripMapUsed = ko.observable(isTripMapUsed);
		self.obIsStudentMapUsed = ko.observable(isStudentMapUsed);
		self.obIsTripStopMapUsed = ko.observable(isTripStopMapUsed);
		self.obBasemaps = ko.observableArray(baseMaps);

		// Trip Map Configurations
		self.obSelectedTripBaseMap = ko.observable(mapSettings.TripMap.BaseMap ? mapSettings.TripMap.BaseMap : baseMaps[0])
		self.obSelectedTripBaseMapText = ko.pureComputed(function()
		{
			return !!self.obSelectedTripBaseMap() ? self.obSelectedTripBaseMap().title : "";
		});
		self.obShowPath = ko.observable(Boolean(mapSettings.TripMap.ShowPath));
		self.obShowStop = ko.observable(Boolean(mapSettings.TripMap.ShowStop));
		self.obShowAssignedStudents = ko.observable(Boolean(mapSettings.TripMap.ShowAssignedStudents));
		self.obShowBoundary = ko.observable(Boolean(mapSettings.TripMap.ShowBoundary));
		self.obShowStop.subscribe(newValue =>
		{
			if (!newValue)
			{
				self.obShowAssignedStudents = ko.observable(false);
				self.obShowBoundary = ko.observable(false);
			}
		});

		// Student Map Configurations
		self.obSelectedStudentBaseMap = ko.observable(mapSettings.StudentMap.BaseMap ? mapSettings.StudentMap.BaseMap : baseMaps[0])
		self.obSelectedStudentBaseMapText = ko.pureComputed(function()
		{
			return !!self.obSelectedStudentBaseMap() ? self.obSelectedStudentBaseMap().title : "";
		});
		self.obShowHome = ko.observable(Boolean(mapSettings.StudentMap.ShowHome));
		self.obShowAlternateSite = ko.observable(Boolean(mapSettings.StudentMap.ShowAlternateSites));
		self.obShowSchoolLocation = ko.observable(Boolean(mapSettings.StudentMap.ShowSchoolLocation));
		self.obShowAllStopLocations = ko.observable(Boolean(mapSettings.StudentMap.ShowAllStopLocations));
		self.obShowHomeToSchoolPath = ko.observable(Boolean(mapSettings.StudentMap.ShowHomeToSchoolPath));

		// Trip Stop Map Configurations
		self.obSelectedTripStopBaseMap = ko.observable(mapSettings.TripStopMap.BaseMap ? mapSettings.TripStopMap.BaseMap : baseMaps[0])
		self.obSelectedTripStopBaseMapText = ko.pureComputed(function()
		{
			return !!self.obSelectedTripStopBaseMap() ? self.obSelectedTripStopBaseMap().title : "";
		});
	}
	BaseRunReportViewModel.prototype.generateFilterSettingProperties = function()
	{
		var self = this,
			outputTypes = tf.exagoReportDataHelper.getAllOutputTypes(),
			dataSources = tf.datasourceManager.datasources.map(function(item)
			{
				return {
					name: item.Name,
					id: item.DBID,
					version: item.DBVersion
				};
			}),
			specifyRecordMethods = tf.exagoReportDataHelper.getAllSpecifyRecordMethods();

		// fields for storing current settings (for comparison in observable to trigger change event)
		self.currentDataSourceId = null;
		self.currentRecordMethodName = null;
		self.currentFilterName = null;

		// Observable items for syncing between UI and ViewModel
		// If on schedule editing, remove 'preview' and split line
		if (self.fromSchedule())
		{
			outputTypes.splice(0, 2);
		}
		self.obOutputTypeOptions = ko.observableArray(outputTypes);
		self.obSelectedOutputType = ko.observable(null);
		self.obSelectedOutputTypeText = ko.pureComputed(function()
		{
			return !!self.obSelectedOutputType() ? self.obSelectedOutputType().text : "";
		});

		self.obDataSourceOptions = ko.observableArray(dataSources);
		self.obSelectedDataSource = ko.observable(null);
		self.obSelectedDataSourceText = ko.pureComputed(function()
		{
			return !!self.obSelectedDataSource() ? self.obSelectedDataSource().name : "";
		});
		self.obSelectedDataSource.subscribe(self.onSelectedDataSourceUpdated.bind(self));

		self.obAllRecordMethods = ko.observableArray(specifyRecordMethods);
		self.obSelectedRecordMethod = ko.observable(null);
		self.obSelectedRecordMethodText = ko.pureComputed(function()
		{
			return !!self.obSelectedRecordMethod() ? self.obSelectedRecordMethod().text : "";
		});
		self.obSelectedRecordMethod.subscribe(self.onSelectedRecordMethodUpdated.bind(self));

		// Filters will be loaded after data is fetched.
		self.obAvailableFilters = ko.observableArray([]);
		self.obSelectedFilter = ko.observable(null);
		self.obSelectedFilterText = ko.pureComputed(function()
		{
			return !!self.obSelectedFilter() ? self.obSelectedFilter().name : "";
		});
		self.obSelectedFilterWhereClause = ko.pureComputed(function()
		{
			return !!self.obSelectedFilter() ? self.obSelectedFilter().whereClause : "";
		});
		self.obFilterDisabled = ko.pureComputed(function()
		{
			return self.obSelectedRecordMethod() !== self.obAllRecordMethods()[1];
		});
		self.obSelectedFilter.subscribe(self.onSelectedFilterUpdated.bind(self));


		self.obSpecifiedRecords = ko.observableArray([]);
		self.obSpecifiedRecordsDisabled = ko.pureComputed(function()
		{
			return self.obSelectedRecordMethod() !== self.obAllRecordMethods()[2];
		});

		// if specify method is set to be "specific records", the selection should not be empty.
		self.obSpecificRecordStringForValidation = ko.computed(function()
		{
			if (self.obSpecifiedRecordsDisabled())
			{
				return "1";
			}
			else
			{
				return (self.obSpecifiedRecords().length > 0 ? "1" : "");
			}
		});
		self.specificRecordFormatter = self.specificRecordFormatter.bind(self);

		// Define two events for hook-up changes after DataSource and RecordMethod is changed
		self.afterDataSourceChangedEvent = new TF.Events.Event();
		self.afterRecordMethodChangedEvent = new TF.Events.Event();
	};

	BaseRunReportViewModel.prototype.generateParameterItemViewModels = function()
	{
		var self = this,
			parameterList = self.entity.parameterList,
			execInfo = self.entity.execInfo,
			parameterMap = !!execInfo[PARAMETER_MAP_ITEMKEY] ? execInfo[PARAMETER_MAP_ITEMKEY] : {},
			parameterVMs = [];

		if (Array.isArray(parameterList))
		{
			parameterList.forEach(function(p)
			{
				var dataEntry = parameterMap[p.Name];
				if (!!dataEntry && dataEntry.DataType === p.DataType) // Populat parameter value from previously saved data
				{
					p.Value = dataEntry.Value;
				}
				parameterVMs.push(new TF.Control.ReportParameterItemViewModel(p));
			});
		}

		self.obReportParameterItems = ko.observableArray(parameterVMs);
	};

	BaseRunReportViewModel.prototype.useExplicitRecordIdsAsDefaultFilterSettings = function(explicitRecordIds)
	{
		var self = this,
			execInfo = self.entity.execInfo,
			explicitDataSourceId = tf.datasourceManager.databaseId,
			explicitRecordMethod = self.obAllRecordMethods()[2];

		execInfo[DBID_ITEMKEY] = explicitDataSourceId;
		execInfo[RECORD_METHOD_ITEMKEY] = explicitRecordMethod.name;
		execInfo[RECORD_IDS_ITEMKEY] = explicitRecordIds.join(",");
	};

	/**
	 * Initialization.
	 *
	 */
	BaseRunReportViewModel.prototype.init = function(viewModel, element)
	{
		var self = this;

		self.element = $(element);
		self.$tabstrip = self.element.find(".tabstrip-runreport:first");
		self.$tabstrip.kendoTabStrip({
			animation: {
				open: {
					effects: false
				}
			}
		});
		self.kendoTabStrip = self.$tabstrip.data("kendoTabStrip");

		self.restoreDefaultFilterSettings();	// Restore filter settings from previously saved data

		setTimeout(function()
		{
			self.initValidation(element);
			self.setTabsHeight();
		}, 1000);
	};

	BaseRunReportViewModel.prototype.setTabsHeight = function()
	{
		var self = this, filtersTabHeight = self.element.find('.clearfix.filters-tab').height();
		self.element.find('.clearfix.parameters-tab').css('min-height', filtersTabHeight + 'px');
		self.element.find('.clearfix.tripmap-tab').css('min-height', filtersTabHeight + 'px');
	}

	/**
	 * Method for restoring previously saved Filter settings to current Modal context
	 */
	BaseRunReportViewModel.prototype.restoreDefaultFilterSettings = function()
	{
		var self = this,
			execInfo = self.entity.execInfo,
			outputTypes = self.obOutputTypeOptions(),
			dataSources = self.obDataSourceOptions(),
			allRecordMethods = self.obAllRecordMethods(),
			defaultOutputType = _.find(outputTypes, { "type": execInfo.OUTPUT_TYPE_KEY }) ? _.find(outputTypes, { "type": execInfo.OUTPUT_TYPE_KEY }) : outputTypes[0],
			defaultDataSourceId = Number.isInteger(execInfo[DBID_ITEMKEY]) ? Number.parseInt(execInfo[DBID_ITEMKEY]) : -1,	// restore dataSourceId from execInfo
			recordMethodOption = allRecordMethods.filter(function(opt) { return opt.name === execInfo[RECORD_METHOD_ITEMKEY]; })[0],
			defaultRecordMethod = !!recordMethodOption ? recordMethodOption : allRecordMethods[0],
			defaultFilterName = execInfo[FILTER_NAME_ITEMKEY],
			defaultSpecifiedRecordIdStr = execInfo[RECORD_IDS_ITEMKEY],
			defaultDataSource = dataSources.filter(function(ds)
			{
				return ds.id === defaultDataSourceId;
			})[0];

		if (!defaultDataSource)
		{
			defaultDataSource = dataSources.filter(function(ds)
			{
				return ds.id === tf.datasourceManager.databaseId;
			})[0];
		}

		var restoreRecordMethod = function()
		{
			self.obSelectedRecordMethod(defaultRecordMethod);

			self.afterDataSourceChangedEvent.unsubscribe(restoreRecordMethod);	// remove the callback since we only need to restore once at begining
		};

		var restoreFilterOrSpecifiedRecords = function()
		{
			if (!self.obFilterDisabled())
			{
				var matchedFilter = self.obAvailableFilters().filter(function(f)
				{
					return f.name === defaultFilterName;
				})[0];
				if (!!matchedFilter)
				{
					self.obSelectedFilter(matchedFilter);
				}
			}

			if (!self.obSpecifiedRecordsDisabled())
			{
				// Fetch records by id list and populate the record grid
				var idList = parseRecordIdsFromString(defaultSpecifiedRecordIdStr);
				self.loadSpecificRecords(idList);
			}

			self.afterRecordMethodChangedEvent.unsubscribe(restoreFilterOrSpecifiedRecords);	// remove the callback since we only need to restore once at begining
		};

		self.afterDataSourceChangedEvent.subscribe(restoreRecordMethod);
		self.afterRecordMethodChangedEvent.subscribe(restoreFilterOrSpecifiedRecords);

		self.obSelectedOutputType(defaultOutputType);
		self.obSelectedDataSource(defaultDataSource);
	};

	BaseRunReportViewModel.prototype.initValidation = function(element)
	{

		var self = this, isValidating = false;

		self.validatorFields = {
			dataSource: {
				trigger: "change",
				validators:
				{
					callback:
					{
						message: 'required',
						callback: self.onValidateDataSourceField.bind(self)
					}
				}
			},
			filterName: {
				trigger: "blur change",
				validators:
				{
					notEmpty: { message: "required" }
				}
			},
			specificRecords: {
				trigger: "blur change",
				validators:
				{
					notEmpty:
					{
						message: " At least one record must be selected"
					}
				}
			}
		};

		var validatorFields = {
			dataSource: self.validatorFields["dataSource"],
			specificRecords: self.validatorFields["specificRecords"]
		};

		// Populate validators for report parameters
		var parameterItems = self.obReportParameterItems();
		if (Array.isArray(parameterItems) && parameterItems.length > 0)
		{
			parameterItems.forEach(function(p)
			{
				for (var validField in p.validatorFields)
				{
					if (p.validatorFields.hasOwnProperty(validField))
					{
						validatorFields[validField] = p.validatorFields[validField]
					}
				}
			});
		}

		$(element).bootstrapValidator({
			excluded: [],
			live: 'enabled',
			message: 'This value is not valid',
			fields: validatorFields
		}).on('success.field.bv', function(e, data)
		{
			var $parent = data.element.closest(CLASS_NAME_FORM_GROUP);
			$parent.removeClass('has-success');
			if (!isValidating)
			{
				isValidating = true;
				self.pageLevelViewModel.saveValidate(data.element).then(function()
				{
					isValidating = false;
				});
			}
		});

		self.pageLevelViewModel.load(self.element.data("bootstrapValidator"));
	}

	BaseRunReportViewModel.prototype.onSelectedDataSourceUpdated = function(newDataSource)
	{
		var self = this,
			oldDataSourceId = self.currentDataSourceId,
			newDataSourceId = !!newDataSource ? newDataSource.id : null;

		if (oldDataSourceId === newDataSourceId)
		{
			return;
		}
		self.currentDataSourceId = newDataSourceId;

		// Prerequisite works before initizlie filter settings(UI) for a new selected datasource
		self.initFiltersForCurrentDataSource().then(function()
		{
			setTimeout(function()
			{
				var defaultFilter = self.obAvailableFilters()[0];
				self.obSelectedFilter(defaultFilter);
				self.obSpecifiedRecords([]);

				self.afterDataSourceChangedEvent.notify();
			}, 0);
		});
	};

	BaseRunReportViewModel.prototype.onSelectedRecordMethodUpdated = function(newRecordMethod)
	{

		var self = this,
			oldMethodName = self.currentRecordMethodName,
			newMethodName = !!newRecordMethod ? newRecordMethod.name : null;

		if (oldMethodName === newMethodName)
		{
			return;
		}

		self.currentRecordMethodName = newMethodName;

		// Delay execution to next tick to so that other observables like obFilterDisabled, obSpecifiedRecordsDisabled can be updated first
		setTimeout(function()
		{
			if (self.obFilterDisabled())	// Need to reset filter to default(empty) when disabled
			{
				var defaultFilter = self.obAvailableFilters()[0];
				self.obSelectedFilter(defaultFilter);
			}
			self.updateValidatorsForFilterRecordMethod();

			if (self.obSpecifiedRecordsDisabled())	// Need to clear specified records when disabled
			{
				self.obSpecifiedRecords([]);
			}
			self.updateValidatorsForSpecifiedRecordsRecordMethod();

			self.afterRecordMethodChangedEvent.notify();
		}, 0);
	};

	BaseRunReportViewModel.prototype.onSelectedFilterUpdated = function(newFilter)
	{
		var self = this,
			oldFilterName = self.currentFilterName,
			newFilterName = !!newFilter ? newFilter.name : null;

		if (oldFilterName === newFilterName)
		{
			return;
		}

		self.currentFilterName = newFilterName;
	};

	/**
	 * Initialize filter dropdown menu.
	 *
	 */
	BaseRunReportViewModel.prototype.initFiltersForCurrentDataSource = function()
	{
		var self = this,
			dataType = self.dataType,
			dataSourceId = self.obSelectedDataSource().id,
			defaultEmptyFilter = $.extend({}, DEFAULT_EMPTY_FILTER);

		return self.getAvailableFilter(dataType, dataSourceId)
			.then(function(filters)
			{
				filters.unshift(defaultEmptyFilter);
				self.obAvailableFilters(filters);
			});
	};

	/**
	 * Initialize specific records.
	 *
	 */
	BaseRunReportViewModel.prototype.loadSpecificRecords = function(ids)
	{
		var self = this;
		if (!Array.isArray(ids) || ids.length === 0)
		{
			self.obSpecifiedRecords([]);
			return;
		}

		var dataType = self.dataType,
			columns = tf.dataTypeHelper.getBasicColumnsByDataType(dataType)
				.map(function(item)
				{
					return item.FieldName;
				});

		tf.dataTypeHelper.getRecordByIdsAndColumns(self.obSelectedDataSource().id, dataType, ids, columns)
			.then(function(selectedRecords)
			{
				self.obSpecifiedRecords(selectedRecords);
			});
	};

	/**
	 * Get all available filters by specified data type and database id.
	 *
	 * @param {string} dataType
	 * @param {number} databaseId
	 * @returns
	 */
	BaseRunReportViewModel.prototype.getAvailableFilter = function(dataType, databaseId)
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridfilters"), {
			paramData: {
				"@filter": String.format("(eq(dbid, {0})|isnull(dbid,))&eq(datatypeId,{1})", databaseId, tf.dataTypeHelper.getId(dataType)),
				"@relationships": "OmittedRecord"
			}
		}).then(function(res)
		{
			var summryFilter = {};
			if (dataType === "fieldtrip")
			{
				summryFilter = {
					filters: tf.fieldTripGridDefinition.getSummaryFilters(),
					function: tf.fieldTripGridDefinition.getSummaryFunction()
				}
			}
			if (!res || !Array.isArray(res.Items))
			{
				return undefined;
			}

			var normalFilters = res.Items.filter(function(filter)
			{
				return filter && filter.IsValid === true;
			}).map(function(filter)
			{
				return {
					name: filter.Name,
					whereClause: filter.WhereClause,
					id: filter.Id,
					isValid: filter.IsValid
				};
			});
			var sumFilters = [];
			if (summryFilter.filters)
			{
				sumFilters = summryFilter.filters.map(filter =>
				{
					return {
						name: filter.Name,
						whereClause: filter.WhereClause,
						id: filter.Id,
						isValid: filter.IsValid,
						summaryFunc: summryFilter.function
					};
				})
			}
			return normalFilters.concat(sumFilters);

		});
	};

	/**
	 * Get formatted name for specific record.
	 *
	 * @param {object} entity
	 * @returns
	 */
	BaseRunReportViewModel.prototype.specificRecordFormatter = function(entity)
	{
		return tf.dataTypeHelper.getEntityName(this.dataType, entity);
	}

	/**
	 * When select specific record button is clicked.
	 *
	 * @param {any} evt
	 */
	BaseRunReportViewModel.prototype.selectRecordClick = function(evt)
	{
		var self = this, loadDefaultColumns = Promise.resolve();

		if (!self.defaultColumns)
		{
			loadDefaultColumns = tf.dataTypeHelper.getDefaultColumnsByDataType(self.dataType)
				.then(function(columns)
				{
					self.defaultColumns = columns;
				})
		}

		loadDefaultColumns.then(function()
		{
			var option = {
				dataType: self.dataType,
				selectedData: self.obSpecifiedRecords(),
				defaultColumns: self.defaultColumns,
				dataSourceId: self.obSelectedDataSource().id,
				pageLevelViewModel: self.pageLevelViewModel
			};
			tf.modalManager.showModal(new TF.Modal.Report.SpecificRecordsModalViewModel(option))
				.then(function(ids)
				{
					if (Array.isArray(ids))
					{
						self.loadSpecificRecords(ids);
					}
				});
		});
	};

	/**
	 * Update the status of Filter related validators
	 */
	BaseRunReportViewModel.prototype.updateValidatorsForFilterRecordMethod = function()
	{
		var self = this,
			isFilterDisabled = self.obFilterDisabled(),
			$filterName = self.element.find(".filter-name");

		if (isFilterDisabled)
		{
			$filterName.removeClass("requirestar");

			if (self.element && self.element.data("bootstrapValidator"))
			{
				self.element.data("bootstrapValidator").removeField("filterName");
				self.element.find(".filter-name").closest(CLASS_NAME_FORM_GROUP).find(".help-block").remove();
				self.pageLevelViewModel.obValidationErrors.remove(function(data)
				{
					return data.name === "Filter Name";
				})
			}
		}
		else
		{
			$filterName.addClass("requirestar");

			if (self.element && self.element.data("bootstrapValidator") && self.validatorFields["filterName"])
			{
				self.element.data("bootstrapValidator").addField("filterName", self.validatorFields["filterName"]);
			}
		}
	};

	/**
	 * Update the status of SpecifiedRecords related validators
	 */
	BaseRunReportViewModel.prototype.updateValidatorsForSpecifiedRecordsRecordMethod = function()
	{
		var self = this,
			isDisabled = self.obSpecifiedRecordsDisabled(),
			$specificRecords = self.element.find(".specific-records");

		if (isDisabled)
		{
			$specificRecords.removeClass("requirestar");
			self.pageLevelViewModel.obValidationErrors.remove(function(data)
			{
				return data.name === "Specific Records";
			})
		}
		else
		{
			$specificRecords.addClass("requirestar");
		}
	};

	BaseRunReportViewModel.prototype.preGeneratingMapImages = function(recordIds)
	{
		var self = this;
		var execInfo = self.getCurrentExecutionInfo();
		if (execInfo["MAP_SETTINGS"])
		{
			var param = _.cloneDeep(execInfo["MAP_SETTINGS"]);
			if (self.schema.DataTypeName === "Trip")
			{

				param.TripMap.Ids = recordIds ? recordIds.join(",") : null;
			}
			else if (self.schema.DataTypeName === "Student")
			{
				param.StudentMap.Ids = recordIds ? recordIds.join(",") : null;
			}
			else
			{
				//TO-DO
			}
			return tf.exagoReportDataHelper.generatingMapImages(param, self.schema.DataTypeName, execInfo[DBID_ITEMKEY]).then(function(res)
			{
				return Promise.resolve(res.Items[0]);
			})
		}
		return Promise.resolve(null);
	}
	BaseRunReportViewModel.prototype.prepareTFVariablesForExecution = function()
	{
		var self = this,
			dataSourceText = self.obSelectedDataSourceText(),
			reportEntity = self.entity,
			mmtNowOfClient = moment().utcOffset(tf.timezonetotalminutes),
			mmtCreatedDateOfClient = moment.utc(reportEntity.CreatedOn).utcOffset(tf.timezonetotalminutes),
			userLastName = !tf.userEntity.LastName ? "" : tf.userEntity.LastName,
			userFirstName = !tf.userEntity.FirstName ? "" : tf.userEntity.FirstName,
			userFullName = (!userLastName || !userFirstName) ? String.format("{0}{1}", userLastName, userFirstName) : String.format("{0}, {1}", userLastName, userFirstName);

		// Populate context TFVariables
		// "createdDate", "runDate", "runTime", "runBy", "datasource"
		return Promise.resolve({
			createdDate: mmtCreatedDateOfClient.format("YYYY-MM-DD"),
			runDate: mmtNowOfClient.format("YYYY-MM-DD"),
			runTime: mmtNowOfClient.format("HH:mm:ss"),
			runBy: userFullName,
			datasource: dataSourceText
		});
	};

	BaseRunReportViewModel.prototype.createReportItemForExecution = function()
	{
		var self = this,
			dataSourceId = self.obSelectedDataSource().id,
			dataSchema = self.schema,
			reportEntity = self.entity,
			useFilter = !self.obFilterDisabled(),
			useSpecifiedRecords = !self.obSpecifiedRecordsDisabled(),
			execInfo = self.getCurrentExecutionInfo();

		const reportItem = {
			Name: reportEntity.Name,
			ParameterMap: execInfo[PARAMETER_MAP_ITEMKEY],
			MapSettings: execInfo[MAP_SETTINGS_ITEMKEY],
			SpecificRecordIds: null
		}

		if (useFilter)
		{
			// summaryFilter
			if (self.obSelectedFilter().summaryFunc)
			{
				return self.obSelectedFilter().summaryFunc().then(res =>
				{
					if (Array.isArray(res) && res.length > 0)
					{
						reportItem.SpecificRecordIds = res;
						return Promise.resolve(reportItem);
					}
					return Promise.resolve(null);
				})
			}
			else
			{
				return tf.exagoReportDataHelper.getRecordIdsByFilterClause(
					dataSourceId,
					dataSchema,
					self.obSelectedFilterWhereClause()
				).then(function(idsFromFilter)
				{
					if (Array.isArray(idsFromFilter) && idsFromFilter.length > 0)
					{
						reportItem.SpecificRecordIds = idsFromFilter;
						return Promise.resolve(reportItem);
					}

					return Promise.resolve(null);
				});
			}
		}
		else if (useSpecifiedRecords)
		{
			var idListStr = convertRecordsToString(self.obSpecifiedRecords()),
				idList = parseRecordIdsFromString(idListStr);

			if (idList.length > 0)
			{
				reportItem.SpecificRecordIds = idList;
				return Promise.resolve(reportItem);
			}

			return Promise.resolve(null);
		}
		else	// Use All Records
		{
			return Promise.resolve(reportItem);
		}
	};
	BaseRunReportViewModel.prototype.initMapSettings = function(TripMap, StudentMap, TripStopMap)
	{
		var setting = {
			TripMap: {
				Ids: null,
				BaseMap: null,
				Enable: false,
				ShowPath: true,
				ShowStop: false,
				ShowAssignedStudents: false,
				ShowBoundary: false,
			},
			StudentMap: {
				Enable: false,
				Ids: null,
				BaseMap: null,
				ShowHome: true,
				ShowAlternateSites: false,
				ShowSchoolLocation: false,
				ShowAllStopLocations: false,
				ShowHomeToSchoolPath: false,
			},
			TripStopMap: {
				Enable: false,
				Ids: null,
				BaseMap: null,
			}
		}
		_.extend(setting.TripMap, TripMap);
		_.extend(setting.StudentMap, StudentMap);
		_.extend(setting.TripStopMap, TripStopMap);
		return setting;
	}
	BaseRunReportViewModel.prototype.getCurrentExecutionInfo = function()
	{
		var self = this,
			selectedDataSourceId = self.currentDataSourceId,
			selectedRecordMethodName = self.currentRecordMethodName,
			parameterItems = self.obReportParameterItems(),
			execInfo = {};

		// Store filter settings into execInfo
		execInfo[DBID_ITEMKEY] = selectedDataSourceId;
		execInfo[RECORD_METHOD_ITEMKEY] = selectedRecordMethodName;

		if (self.obMapAvailiable())
		{
			const mapSettings = self.initMapSettings();
			// {
			// 	"BaseMap": self.obSelectedBaseMap()
			// };

			if (self.obIsTripMapUsed())
			{
				mapSettings.TripMap.Enable = true;
				mapSettings.TripMap.BaseMap = self.obSelectedTripBaseMap();
				mapSettings.TripMap.ShowPath = self.obShowPath();
				mapSettings.TripMap.ShowStop = self.obShowStop();
				mapSettings.TripMap.ShowAssignedStudents = self.obShowStop() && self.obShowAssignedStudents();
				mapSettings.TripMap.ShowBoundary = self.obShowStop() && self.obShowBoundary();
			}

			if (self.obIsStudentMapUsed())
			{
				mapSettings.StudentMap.Enable = true;
				mapSettings.StudentMap.BaseMap = self.obSelectedStudentBaseMap();
				mapSettings.StudentMap.ShowHome = self.obShowHome();
				mapSettings.StudentMap.ShowAlternateSites = self.obShowAlternateSite();
				mapSettings.StudentMap.ShowSchoolLocation = self.obShowSchoolLocation();
				mapSettings.StudentMap.ShowAllStopLocations = self.obShowAllStopLocations();
				mapSettings.StudentMap.ShowHomeToSchoolPath = self.obShowHomeToSchoolPath();
			}

			if (self.obIsTripStopMapUsed())
			{
				mapSettings.TripStopMap.Enable = true;
				mapSettings.TripStopMap.BaseMap = self.obSelectedTripBaseMap();
				// TO-DO
			}

			execInfo[MAP_SETTINGS_ITEMKEY] = mapSettings;
		}
		else
		{
			execInfo[MAP_SETTINGS_ITEMKEY] = null;
		}


		execInfo[OUTPUT_TYPE_KEY] = self.obSelectedOutputType().type;

		if (!self.obFilterDisabled())	// use Filter
		{
			execInfo[FILTER_NAME_ITEMKEY] = self.currentFilterName;
		}

		if (!self.obSpecifiedRecordsDisabled())	// use Specific RecordIds
		{
			execInfo[RECORD_IDS_ITEMKEY] = convertRecordsToString(self.obSpecifiedRecords());
		}

		// Store all parameter values into execInfo's value dict
		var parameterMap = {};
		if (Array.isArray(parameterItems))
		{
			parameterItems.forEach(function(p)
			{
				var rawParam = p.toDataEntry();
				if (Array.isArray(rawParam))
				{
					rawParam.forEach(function(rp)
					{
						parameterMap[rp.Name] = rp
					})
				}
				else
				{
					parameterMap[p.name] = rawParam;
				}
			});
		}
		execInfo[PARAMETER_MAP_ITEMKEY] = parameterMap;

		return execInfo;
	};

	BaseRunReportViewModel.prototype.saveFilterAndParameters = function()
	{
		// override in subclass
	};

	/**
	 * Run the report.
	 *
	 * @returns
	 */
	BaseRunReportViewModel.prototype.run = function()
	{
		// override
	};

	/**
	 * Validate data source field.
	 *
	 * @returns
	 */
	BaseRunReportViewModel.prototype.onValidateDataSourceField = function()
	{
		var self = this,
			dataSourceId = self.obSelectedDataSource().id;

		if (!dataSourceId)
		{
			if (self.IsFirstLoading)
			{
				self.IsFirstLoading = false;
				return true;
			}
			setTimeout(function()
			{ //put data source name into message.
				var $helpBlock = $("#filterDataSource").closest(CLASS_NAME_FORM_GROUP).find(".help-block");
				$helpBlock.text(" required");
				$helpBlock.attr("title", "");
			});
			return false;
		}
		self.IsFirstLoading = false;

		return true;
	}

	BaseRunReportViewModel.prototype.dispose = function()
	{
		var self = this;

		self.pageLevelViewModel.dispose();

		var parameterItems = self.obReportParameterItems();
		if (Array.isArray(parameterItems) && parameterItems.length > 0)
		{
			parameterItems.forEach(function(p)
			{
				p.dispose();
			});
		}
	};
})();


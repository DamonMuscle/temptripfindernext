(function()
{
	createNamespace("TF.UserDefinedField").RollupUserDefinedFieldViewModel = RollupUserDefinedFieldViewModel;
	const FunctionEnum =
	{
		Average: 1,
		Sum: 2,
		Max: 3,
		Min: 4,
		Range: 5,
		Count: 6,
		DistinctCount: 7,
	}

	const ValueFormatEnum =
	{
		Date: 1,
		DateTime: 2,
		Number: 3,
		Text: 4,
		Time: 5,
	}

	const CONST_TEXT = {
		ROLLUP_DATATYPE_DROPDOWN: "rollup-datatype-dropdownlist",
		DIV_FORM_GROUP: "div.form-group",
	}
	function RollupUserDefinedFieldViewModel(viewModel)
	{
		const self = this;
		this.obIsEnable = ko.observable(true);
		self.parent = viewModel;
		self.obComponentLoaded = ko.observable(false);
		self.initFormFieldPromise = null;
		self.initComponent();
	}

	RollupUserDefinedFieldViewModel.prototype.constructor = RollupUserDefinedFieldViewModel;

	RollupUserDefinedFieldViewModel.prototype.initComponent = function()
	{
		const self = this;
		self.obAvailableDataTypes = ko.observable(null);
		self.obSelectedDataType = ko.observable(null);
		self.obSelectedValueFormat = ko.observable(null);
		self.obNumberPrecision = ko.observable(null);

		// related field
		self.obSelectedDataField = ko.observable(null);
		self.availableDataFields = [];
		// related function
		self.obSelectedFunction = ko.observable(null);
		self.availableFunctions = [];
		// related filter
		self.availableFilters = [];
		// obSelectedFilter could be number or string
		self.obSelectedFilter = ko.observable(null);

		self.subscribeObSelectedDataType();
		self.subscribeObSelectedDataField();
		self.subscribeObSelectedFunction();
	}

	RollupUserDefinedFieldViewModel.prototype.subscribeObSelectedDataType = function()
	{
		const self = this;
		self.obSelectedDataType.subscribe(function(dataTypeID)
		{
			if (!dataTypeID)
			{
				return;
			}

			self.obSelectedDataField(null);
			self.dropdownAvailableDataFields.value(null);
			self.obSelectedFunction(null);
			self.dropdownAvailableFunctions.value(null);
			self.dropdownAvailableFunctions.setDataSource([]);
			self.obSelectedFilter(null);
			self.dropdownAvailableFilters.value(null);

			const isForm = dataTypeID.indexOf("form") >= 0;
			const formId = isForm ? dataTypeID.split(":")[1] : null;
			/* related fields */
			if (!isForm)
			{
				// common type
				self.availableDataFields = tf.dataTypeHelper
					.getRollupRelatedDataFields(parseInt(dataTypeID))
					.map(f => ({ text: f.displayName || f.fieldName, value: f.fieldName, type: f.type }))
					.sort(sortStringCompare);
				self.dropdownAvailableDataFields.setDataSource(self.availableDataFields);
			}
			else
			{
				// form field
				self.initFormFieldPromise = tf.udgHelper.getUDGridById(formId, true);
				self.initFormFieldPromise.then(grids =>
				{
					if (grids.length === 0)
					{
						return;
					}

					const fields = tf.udgHelper.getUDGridColumns(grids, true)
						.filter(f => !f.isUDFSystemField)
						.map(f => ({
							text: f.DisplayName,
							value: f.FieldName,
							type: f.type
						}));
					self.availableDataFields = self._getExtendFormFields().concat(fields).sort(sortStringCompare);
					self.dropdownAvailableDataFields.setDataSource(self.availableDataFields);
				})
			}
			self.subscribeObSelectedDataType_filter(isForm, formId, dataTypeID);
		});
	}

	RollupUserDefinedFieldViewModel.prototype.subscribeObSelectedDataType_filter = function(isForm, formId, dataTypeID)
	{
		const self = this;

		// related filters
		let filter = `(eq(dbid, ${tf.datasourceManager.databaseId})|isnull(dbid,))&eq(datatypeId,${isForm ? tf.dataTypeHelper.getId("form") : dataTypeID})`;
		if (isForm)
		{
			filter = `${filter}&eq(udgridId,${formId})`;
		}
		Promise.all([
			tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridfilters"), {
				paramData: {
					"@filter": filter,
					"@relationships": "OmittedRecord,Reminder"
				}
			}, { overlay: false }),
			Promise.resolve().then(() =>
			{
				if (dataTypeID.indexOf("form") >= 0)
				{
					return Promise.resolve({});
				}
				else
				{
					return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "staticfilters"), {
						paramData: {
							dataTypeId: dataTypeID
						}
					}, { overlay: false });
				}
			})
		]).then(([normalFilterResponse, staticFilterResponse]) =>
		{
			const normalFilters = normalFilterResponse.Items.map(f => ({
				text: f.Name,
				value: f.Id
			})).sort(sortStringCompare);
			const staticFilters = (staticFilterResponse.Items || []).map(v => ({
				text: v,
				value: v
			})).sort(sortStringCompare);

			self.availableFilters = [];
			if (staticFilters.length || normalFilters.length)
			{
				self.availableFilters.push({
					text: "",
					value: 0
				});
			}
			//separator
			const separatorItems = []
			if ((staticFilters.length && normalFilters.length))
			{
				separatorItems.push({
					text: "",
					value: null
				});
			}
			self.availableFilters = self.availableFilters.concat(staticFilters).concat(separatorItems).concat(normalFilters);

			self.dropdownAvailableFilters.setDataSource(self.availableFilters);
			// only happened in edit mode, obSelectedFilter already be set, but options not ready(still in request to fetch filter)
			if (self.obSelectedFilter())
			{
				self.dropdownAvailableFilters.value(self.obSelectedFilter());
			}
		});
	}

	RollupUserDefinedFieldViewModel.prototype.subscribeObSelectedDataField = function()
	{
		const self = this;
		self.obSelectedDataField.subscribe(function(fieldName)
		{
			if (!fieldName)
			{
				return; // no field name selected return
			}

			const field = (self.availableDataFields || []).find(f => f.value === fieldName);
			if (!field)
			{
				return; //no field found return
			}

			const defaultOptions = [{ text: "Count", value: FunctionEnum.Count }, { text: "Distinct count", value: FunctionEnum.DistinctCount }],
				dateTimeOptions = [{ text: "Max", value: FunctionEnum.Max }, { text: "Min", value: FunctionEnum.Min }, { text: "Range", value: FunctionEnum.Range }],
				numberOptions = [{ text: "Average", value: FunctionEnum.Average }, { text: "Sum", value: FunctionEnum.Sum }];
			let options = [];
			switch (field.type)
			{
				case 'datetime':
				case 'date':
				case "time":
					options = dateTimeOptions.concat(defaultOptions);
					break;
				case 'integer':
				case 'number':
					options = numberOptions.concat(dateTimeOptions).concat(defaultOptions);
					break;
				default:
					options = defaultOptions;
					break;
			}
			self.obSelectedFunction(null);
			self.availableFunctions = options;
			self.dropdownAvailableFunctions.value(null);
			self.dropdownAvailableFunctions.setDataSource(self.availableFunctions);
		});
	}

	RollupUserDefinedFieldViewModel.prototype.subscribeObSelectedFunction = function()
	{
		const self = this;
		self.obSelectedFunction.subscribe(function(selectedFunction)
		{
			self.obSelectedValueFormat(null); //reset
			self.obNumberPrecision(null);

			const selectedDataField = self.obSelectedDataField();
			const field = self.availableDataFields.find(f => f.value === selectedDataField);
			if (!field || !selectedFunction)
			{
				return;
			}

			selectedFunction = Number(selectedFunction);

			switch (true)
			{
				case field.type === "datetime" && selectedFunction === FunctionEnum.Max:
				case field.type === "datetime" && selectedFunction === FunctionEnum.Min:
					self.obSelectedValueFormat(ValueFormatEnum.DateTime)
					break;
				case field.type === "date" && selectedFunction === FunctionEnum.Max:
				case field.type === "date" && selectedFunction === FunctionEnum.Min:
					self.obSelectedValueFormat(ValueFormatEnum.Date)
					break;
				case field.type === "time" && selectedFunction === FunctionEnum.Max:
				case field.type === "time" && selectedFunction === FunctionEnum.Min:
					self.obSelectedValueFormat(ValueFormatEnum.Time)
					break;
				case selectedFunction === FunctionEnum.Range:
					self.obSelectedValueFormat(ValueFormatEnum.Text)
					break;
				default:
					self.calcDefaultValueFormat(field, selectedFunction);
					break;
			}
		});
	}

	RollupUserDefinedFieldViewModel.prototype.calcDefaultValueFormat = function(field, selectedFunction)
	{
		const self = this;
		self.obSelectedValueFormat(ValueFormatEnum.Number);
		if (selectedFunction === FunctionEnum.Average)
		{
			self.obNumberPrecision(2);
		}
		else if (selectedFunction === FunctionEnum.Count || selectedFunction === FunctionEnum.DistinctCount)
		{
			self.obNumberPrecision(null);
		}
		else
		{
			// Max, Min, Sum
			self.obNumberPrecision(field.type === "integer" ? null : 2);
		}
	}

	RollupUserDefinedFieldViewModel.prototype.getDefaultValue = function()
	{
		//NOSONAR
	}

	RollupUserDefinedFieldViewModel.prototype.updateDefaultValue = function(entity, defaultValue)
	{
		const self = this;
		if (!entity)
		{
			return;
		}

		const selectedDatType = self.obSelectedDataType();
		if (selectedDatType.indexOf("form") < 0)
		{
			entity.RelatedDataType = self.obSelectedDataType();
			entity.RelatedUDGridID = null;
		}
		else
		{
			entity.RelatedDataType = null;
			entity.RelatedUDGridID = parseInt(self.obSelectedDataType().split(":")[1]);
		}
		entity.RelatedDataField = self.obSelectedDataField();
		entity.Function = self.obSelectedFunction();
		entity.ValueFormat = self.obSelectedValueFormat();
		entity.NumberPrecision = self.obNumberPrecision();
		const selectedFilter = self.obSelectedFilter();
		if (selectedFilter)
		{
			if (Number.isNaN(Number(selectedFilter)))
			{
				entity.RelatedStaticDataFilter = selectedFilter;
				entity.RelatedDataFilterID = null;
			}
			else
			{
				entity.RelatedStaticDataFilter = null;
				entity.RelatedDataFilterID = Number(selectedFilter);
			}
		}
	}

	RollupUserDefinedFieldViewModel.prototype._getExtendFormFields = function()
	{
		return [
			{ text: "Name", value: "Name", type: "string" },
			{ text: "Description", value: "Description", type: "string" },
			{ text: "Created By", value: "CreatedBy", type: "string" },
			{ text: "Created On", value: "CreatedOn", type: "datetime" },
			{ text: "Last Updated By", value: "LastUpdatedBy", type: "string" },
			{ text: "Last  Updated On", value: "LastUpdatedOn", type: "datetime" },
			{ text: "Location X Coord", value: "Longitude", type: "number" },
			{ text: "Location Y Coord", value: "Latitude", type: "number" },
			{ text: "IP Address", value: "IPAddress", type: "string" },
			{ text: "Host", value: "Host", type: "string" },
			{ text: "User Agent", value: "UserAgent", type: "string" },
		];
	}

	RollupUserDefinedFieldViewModel.prototype.extendValidatorFields = function(validatorFields, $container)
	{
		if (!validatorFields || !$container)
		{
			return;
		}

		validatorFields.dropdownAvailableTypes = {
			excluded: false,
			container: $container.find("input[name='dropdownAvailableTypes']").closest(CONST_TEXT.DIV_FORM_GROUP),
			validators:
			{
				callback: {
					message: "Data type is required",
					callback: function(value, validator, $field)
					{
						return !!value;
					}
				}
			}
		};

		validatorFields.dropdownAvailableDataFields = {
			excluded: false,
			container: $container.find("input[name='dropdownAvailableDataFields']").closest(CONST_TEXT.DIV_FORM_GROUP),
			validators:
			{
				notEmpty: {
					message: "Data field is required"
				}
			}
		};

		validatorFields.dropdownAvailableFunctions = {
			excluded: false,
			container: $container.find("input[name='dropdownAvailableFunctions']").closest(CONST_TEXT.DIV_FORM_GROUP),
			validators:
			{
				notEmpty: {
					message: "Function is required"
				}
			}
		};
	};

	RollupUserDefinedFieldViewModel.prototype.init = function(model, ele)
	{
		const self = this;
		const dataTypeId = tf.dataTypeHelper.getId(self.parent.gridType);
		tf.udgHelper.getAllUDGridsByDataType(self.parent.gridType).then(forms =>
		{
			const types = tf.dataTypeHelper.getRollupRelatedDataType(dataTypeId).map(t => ({ text: t.name, value: t.id.toString() }));
			types.push({
				text: "Forms",
				items: forms.map(f => ({ text: f.Name, value: `form:${f.ID}` }))
			});
			types.sort(sortStringCompare);
			self.obAvailableDataTypes(types);
			const formIndex = types.findIndex(x => x.text === "Forms");
			self.dropdownAvailableTypes = $(ele).find("input#dropdownAvailableTypes").kendoDropDownTree({
				dataSource: self.obAvailableDataTypes() || [],
				clearButton: false,
				treeview: {
					select: (e) =>
					{
						const dataItem = e.sender.dataItem(e.node);
						if (dataItem && !dataItem.value)
						{
							const item = e.sender.findByText(dataItem.Name);
							dataItem.expanded ? e.sender.collapse(item) : e.sender.expand(item);
							e.preventDefault();
						}
					},
				},
				change: e =>
				{
					self.obSelectedDataType(e.sender.value());
				},
				open: (e) =>
				{
					e.sender.list.addClass("rollup-datatype-dropdowntree");
					var liItems = Array.from(e.sender.list.find(".k-treeview-lines>li"));
					liItems.forEach((li, index) =>
					{
						const className = index === formIndex ? "form-item" : "normal-item";
						$(li).addClass(className);
					});
				}
			}).data('kendoDropDownTree');

			self.dropdownAvailableDataFields = $(ele).find("input#dropdownAvailableDataFields").kendoDropDownList({
				dataTextField: "text",
				dataValueField: "value",
				dataSource: self.availableDataFields,
				clearButton: false,
				change: e =>
				{
					self.obSelectedDataField(e.sender.value());
				},
				open: e =>
				{
					e.sender.list.addClass(CONST_TEXT.ROLLUP_DATATYPE_DROPDOWN);
				}
			}).data("kendoDropDownList");

			self.dropdownAvailableFunctions = $(ele).find("input#dropdownAvailableFunctions").kendoDropDownList({
				dataTextField: "text",
				dataValueField: "value",
				dataSource: self.availableFunctions,
				clearButton: false,
				change: e =>
				{
					self.obSelectedFunction(e.sender.value());
				},
				open: e =>
				{
					e.sender.list.addClass(CONST_TEXT.ROLLUP_DATATYPE_DROPDOWN);
				}
			}).data("kendoDropDownList");

			self.dropdownAvailableFilters = $(ele).find("input#dropdownAvailableFilters").kendoDropDownList({
				dataTextField: "text",
				dataValueField: "value",
				dataSource: self.availableFilters,
				clearButton: false,
				change: e =>
				{
					self.obSelectedFilter(e.sender.value());
				},
				open: e =>
				{
					e.sender.list.addClass(CONST_TEXT.ROLLUP_DATATYPE_DROPDOWN);
					const separatorIndex = self.availableFilters.findIndex(x => x.value === null);
					if (separatorIndex !== -1)
					{
						e.sender.list.find("ul.k-list>li").eq(separatorIndex).addClass("separator");
					}
				}
			}).data("kendoDropDownList");

			setTimeout(() =>
			{
				self.restore();
				self.obComponentLoaded(true);
			}, 200);
		})
	}

	RollupUserDefinedFieldViewModel.prototype.restore = function()
	{
		const self = this;
		self.isInit = true;
		// standard type
		if (self.parent.dataEntity && self.parent.dataEntity.RelatedDataType)
		{
			self.obSelectedDataType(self.parent.dataEntity.RelatedDataType.toString());
			self.dropdownAvailableTypes.value(self.parent.dataEntity.RelatedDataType.toString())
		}

		// forms
		if (self.parent.dataEntity && self.parent.dataEntity.RelatedUDGridID)
		{
			const dataType = `form:${self.parent.dataEntity.RelatedUDGridID}`;
			self.obSelectedDataType(dataType);
			self.dropdownAvailableTypes.value(dataType)
		}

		Promise.resolve().then(() =>
		{
			if (self.initFormFieldPromise)
			{
				return self.initFormFieldPromise;
			}
			else
			{
				return Promise.resolve();
			}
		}).then(() =>
		{
			self.restore_fieldsAndFilter();
		})
	}

	RollupUserDefinedFieldViewModel.prototype.restore_fieldsAndFilter = function()
	{
		const self = this;
		// related date field
		if (self.parent.dataEntity && self.parent.dataEntity.RelatedDataField)
		{
			self.obSelectedDataField(self.parent.dataEntity.RelatedDataField);
			self.dropdownAvailableDataFields.value(self.parent.dataEntity.RelatedDataField)
		}

		// related function
		if (self.parent.dataEntity && self.parent.dataEntity.Function)
		{
			const func = self.parent.dataEntity.Function;
			self.obSelectedFunction(func);
			self.dropdownAvailableFunctions.value(func)
		}

		// related format
		if (self.parent.dataEntity && self.parent.dataEntity.FormatString)
		{
			self.obSelectedValueFormat(self.parent.dataEntity.FormatString);
		}

		// filter
		if (self.parent.dataEntity && (self.parent.dataEntity.RelatedDataFilterID || self.parent.dataEntity.RelatedStaticDataFilter))
		{
			self.obSelectedFilter(self.parent.dataEntity.RelatedDataFilterID || self.parent.dataEntity.RelatedStaticDataFilter);
			self.dropdownAvailableFilters.value(self.obSelectedFilter());
		}
	}

	RollupUserDefinedFieldViewModel.prototype.getDefaultValueTemplate = function()
	{
		//placeholder
	}

	RollupUserDefinedFieldViewModel.prototype.getTemplate = function()
	{
		return "modal/userdefinedfield/RollupUserDefinedField";
	}

	RollupUserDefinedFieldViewModel.prototype.dispose = function()
	{
		this.dropdownAvailableTypes && this.dropdownAvailableTypes.close();
	}


	function sortStringCompare(first, second)
	{
		if ((first.text || "").toLowerCase() < (second.text || "").toLowerCase())
		{
			return -1;
		}
		if ((first.text || "").toLowerCase() > (second.text || "").toLowerCase())
		{
			return 1;
		}
		return 0;
	}
})();

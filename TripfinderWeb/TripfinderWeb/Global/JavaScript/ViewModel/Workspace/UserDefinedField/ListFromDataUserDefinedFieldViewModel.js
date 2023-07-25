(function()
{
	createNamespace("TF.UserDefinedField").ListFromDataUserDefinedFieldViewModel = ListFromDataUserDefinedFieldViewModel;

	function ListFromDataUserDefinedFieldViewModel(options)
	{
		var self = this;
		self.obIsEnable = ko.observable(true);		
		self.dataEntity = options.dataEntity;
		self.pickListOptions = self.dataEntity ? self.dataEntity.UDFPickListOptions : {};
		self.obAllowMultiple = ko.observable();

		let dataTypeSource = tf.dataTypeHelper.getValidUDFListDataTypes();
		self.obIsUniqueValues = ko.observable(false);
		self.obDataTypeSource = ko.observableArray(dataTypeSource);
		self.obSelectedDataType = ko.observable();
		self.obSelectedDataTypeText = ko.observable();
		self.obFieldSource = ko.observableArray([]);
		self.obSelectedField = ko.observable();
		self.obSelectedFieldText = ko.observable();
		self.obSelectedFilterText = ko.observable();
		self.obFilterSource = ko.observableArray([]);
		self.obSelectedFilter = ko.observable();

		self.obSelectedDataTypeText.subscribe(function ()
		{
			self.checkPreviewButton();
		});

		self.obSelectedFieldText.subscribe(function ()
		{
			self.checkPreviewButton();
		});
	};

	/**
	 * Initialization.
	 *
	 * @param {Object} viewmodel
	 * @param {DOM} el
	 */
	ListFromDataUserDefinedFieldViewModel.prototype.init = function(viewmodel, el)
	{
		var self = this,
			isMultipleAllowed = !!(self.dataEntity && self.dataEntity.PickListMultiSelect);
		if (!self.pickListOptions || Array.isArray(self.pickListOptions))
		{
			self.pickListOptions = {};
		}
		var isUniqueValues = self.pickListOptions.isUniqueValues;
		self.$form = $(el);	
		// init default value
		self.obAllowMultiple(isMultipleAllowed);
		self.obIsUniqueValues(isUniqueValues);

		if (self.dataEntity)
		{
			if (!self.dataEntity.UDFPickListOptions)
			{
				self.dataEntity.UDFPickListOptions = {};
			}
			let dataType = self.dataEntity.UDFPickListOptions.dataType;
			let selectedDataType = self.obDataTypeSource().filter(function (item) { return item.key === dataType; })[0];
			self.obSelectedDataType(selectedDataType);
			if (selectedDataType)
			{
				self.obSelectedDataTypeText = ko.observable(selectedDataType.name);
				self.initFieldDropDownList();
				self.initFilterDropDownList();
			}
		}
	};

	ListFromDataUserDefinedFieldViewModel.prototype.afterDataTypeSelect = function (obValue, selectValue)
	{
		let self = this;
		self.dataTypeChanged = true;
		self.initFieldDropDownList();	
		self.initFilterDropDownList(); 
	};

	ListFromDataUserDefinedFieldViewModel.prototype.onPreviewBtnClick = function ()
	{
		let self = this, dataTye = self.obSelectedDataTypeText(), field = self.obSelectedFieldText();

		if (!dataTye || dataTye === "" || !field || field === "" ||
			self.$form.find(".preview-button").hasClass("disabled"))
		{
			return;
		}
		let selectedField = self.obSelectedField(),
			selectedFilter = self.obSelectedFilter(),
			dataType = self.obSelectedDataType().key,
			filter = {};
		if (selectedFilter)
		{
			filter = { id: selectedFilter.id || "", name: selectedFilter.name, isStatic: selectedField.isStatic };
		}
		let name = $("#QuestionBodyHtmlEditor").val();
		if (name)
		{
			name = TF.Control.QuestionHelper.formatQuestionName(name);
		}		
		let options = {
			dataType: dataType,
			Name: name,
			FieldOptions: {					
					dataType: dataType,
					PickListMultiSelect: self.obAllowMultiple(),
					UDFPickListOptions: {
						dataType: dataType,
						isUniqueValues: self.obIsUniqueValues(),
						field: { id: selectedField.Id || "", guid: selectedField.Guid || "", name: selectedField.FieldName || selectedField.DisplayName },
						filter: filter
					}
				}
		};

		tf.modalManager.showModal(new TF.Modal.ListFromDataPreviewModalViewModel(
			{
				title: "Preview List Form Data",
				field: options
			}))
			.then(function (text)
			{
			});
	};

	ListFromDataUserDefinedFieldViewModel.prototype.afterFilterRender = function (input)
	{
		var self = this;
		var typeahead = input.data("typeahead");
		var $menu = input.data("typeahead").$menu;
		setTimeout(function ()
		{
			$menu.find("a").each(function (index, a)
			{
				var text = $(a).text();
				if (text == "Clear")
				{
					$(a).click(function (e)
					{
						e.stopPropagation();
						e.preventDefault();
						typeahead.hide();
						self.obSelectedFilter(null);
						self.obSelectedFilterText("");
					});
				}

			});
		}, 10);
	};

	ListFromDataUserDefinedFieldViewModel.prototype.checkPreviewButton = function ()
	{
		var self = this, dataTye = self.obSelectedDataTypeText(), field = self.obSelectedFieldText(),
			selectedDataType = self.obSelectedDataType();

		const isDisabled = !(dataTye && dataTye !== "" && field && field !== "" &&
			tf.authManager.isAuthorizedForDataType(selectedDataType.key, "read"));

		self.$form.find(".preview-button").toggleClass("disabled",isDisabled);
	};

	ListFromDataUserDefinedFieldViewModel.prototype.initFieldDropDownList = function ()
	{
		let self = this, dataType = self.obSelectedDataType();
		if (!dataType) return;
		self.obSelectedField(null);
		self.obSelectedFieldText("");
		tf.UDFDefinition.RetrieveByType(dataType.key).then(function (response)
		{
			let udfData = [];
			if (response.Items)
			{
				udfData = response.Items;
			};

			let gridColumnData = TF.Grid.FilterHelper.getGridDefinitionByType(dataType.key);
			let allColumns = gridColumnData.Columns.concat(gridColumnData.InvisibleUDFColumns).slice(0);

			let tmpColumns = TF.Helper.KendoListMoverHelper.removeOnlyForFilterColumn(allColumns);
			tmpColumns = excludeSpecialColumn(tmpColumns);
			tmpColumns = tmpColumns.concat(udfData);
			fillDisplayName(tmpColumns);
			tmpColumns = sortColumns(tmpColumns);
			self.obFieldSource(tmpColumns);

			if (self.dataEntity && !self.dataTypeChanged)
			{
				let field = self.pickListOptions.field;
				self.obFieldSource().forEach((item) =>
				{
					if (field.id === item.Id || field.name === item.FieldName || field.name === item.DisplayName)
					{
						self.obSelectedField(item);
						self.obSelectedFieldText(item.DisplayName);
					}
				});
				let selectedFieldText = self.obSelectedFieldText();
				if (!selectedFieldText || selectedFieldText === "")
				{
					selectFirstField();
				}
			}
			else
			{
				selectFirstField();
			}
		});

		function selectFirstField()
		{
			let item = self.obFieldSource()[0];
			self.obSelectedField(item);
			self.obSelectedFieldText(item.DisplayName);
		}

		function excludeSpecialColumn(tmpColumns)
		{
			return tmpColumns.filter((column) =>
			{
				return column.FieldName !== 'Id' && !column.UDFGuid;
			});
		}

		function fillDisplayName(tmpColumns)
		{
			tmpColumns.forEach((c) =>
			{
				if (!c.DisplayName)
				{
					c.DisplayName = c.FieldName;
				}
			});
		}

		function sortColumns(columns)
		{
			return columns.sort(function (firstCol, secondCol)
			{
				let left = firstCol.DisplayName || '';
				let right = secondCol.DisplayName || '';
				return left.localeCompare(right);
			});
		};
	};

	ListFromDataUserDefinedFieldViewModel.prototype.initFilterDropDownList = function()
	{
		var self = this;
		self.obSelectedFilter(null);
		self.obSelectedFilterText("");
		var filterUrl = "gridfilters";
		var dataType = self.obSelectedDataType().key;
		var gridfiltersPromise = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), filterUrl), {
			paramData: {
				"@filter": String.format("(eq(dbid, {0})|isnull(dbid,))&eq(datatypeId,{1})", tf.datasourceManager.databaseId, tf.dataTypeHelper.getId(dataType)),
				"@relationships": "OmittedRecord,Reminder"
			}
		}).then(apiResponse => apiResponse.Items);
		var dataTypeId = tf.dataTypeHelper.getId(dataType);

		var staticfiltersPromise = Number.isInteger(dataTypeId) ? tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "staticfilters"), {
			paramData: {
				dataTypeId: dataTypeId
			}
		}).then(function(apiResponse)
		{
			var items = apiResponse.Items;
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), 'reminders'), {
				paramData: {
					"@filter": String.format("(in(StaticFilterName,{0}))", items.join(','))
				}
			}).then(apiResponse =>
			{
				return items.map((item, index) =>
				{
					return {
						Id: -(index + 1),
						IsValid: true,
						DataTypeID: dataTypeId,
						Name: item,
						WhereClause: item,
						Reminders: apiResponse.Items.filter(r => r.StaticFilterName === item),
						IsStatic: true
					}
				})
			});
		}) : Promise.resolve([]);
		return Promise.all([gridfiltersPromise, staticfiltersPromise])
			.then(Items =>
			{
				let filtersItems = Items.flat().filter(f => f.IsValid).map(f =>
				{
					return {
						id: f.Id,
						isStatic: f.IsStatic,
						name: f.Name
					}
				})
				filtersItems = filtersItems.sort(function (a, b)
				{
					let left = a.name || '';
					let right = b.name || '';
					return left.localeCompare(right);
				});

				if (filtersItems.length > 0)
				{
					filtersItems = [{
						id: -999,
						isStatic: false,
						name: "Clear"
					}, {
						name: "[divider]"
					}].concat(filtersItems);
				}

				self.obFilterSource(filtersItems);

				if (self.dataEntity)
				{
					let filter = self.pickListOptions.filter;
					self.obFilterSource().forEach((item) =>
					{
						if (item.name !== "[divider]" &&
							(filter && (filter.id === item.id || filter.name === item.name)))
						{
							self.obSelectedFilter(item);
							self.obSelectedFilterText(item.name);
						}
					});
				}
			});
	};


	ListFromDataUserDefinedFieldViewModel.prototype.getTemplate = function()
	{
		return "modal/userdefinedfield/ListFromDataUserDefinedField";
	};

	/**
	 * Get Default Value Template.
	 *
	 * @returns
	 */
	ListFromDataUserDefinedFieldViewModel.prototype.getDefaultValueTemplate = function ()
	{
		return;
	};

	/**
	 * Get Default Value.
	 *
	 * @returns
	 */
	ListFromDataUserDefinedFieldViewModel.prototype.getDefaultValue = function ()
	{
	};

	/**
	 * Update Default Value.
	 *
	 */
	ListFromDataUserDefinedFieldViewModel.prototype.updateDefaultValue = function ()
	{
	};

	ListFromDataUserDefinedFieldViewModel.prototype.extendValidatorFields = function (validatorFields, $container)
	{
		if (!validatorFields || !$container)
		{
			return;
		}

		validatorFields.dataType = {
			trigger: "blur change",
			container: $container.find("input[name='dataType']").closest("div.form-group"),
			validators: {
				notEmpty: {
					message: 'Data Type is required'
				}
			}
		};

		validatorFields.field = {
			trigger: "blur change",
			container: $container.find("input[name='field']").closest("div.form-group"),
			validators: {
				notEmpty: {
					message: 'Data field is required'
				}
			}
		};
	};

	/**
	 * Save special Value.
	 *
	 * @param {Object} entity
	 */
	ListFromDataUserDefinedFieldViewModel.prototype.saveSpecialValue = function(entity)
	{
		var self = this,
			selectedField = self.obSelectedField(),
			selectedFilter = self.obSelectedFilter(),
			allowMultiple = self.obAllowMultiple(),
			isUniqueValus = self.obIsUniqueValues(),
			dataType = self.obSelectedDataType().key,
			field = { id: selectedField.Id || "", guid: selectedField.Guid || "",  name: selectedField.FieldName || selectedField.DisplayName },
			filter = {};

			if (selectedFilter)
			{
				filter = { id: selectedFilter.id || "", name: selectedFilter.name, isStatic: selectedField.isStatic };
			}

		self.pickListOptions["dataType"] = dataType;
		self.pickListOptions["field"] = field;
		self.pickListOptions["filter"] = filter;
		self.pickListOptions["isUniqueValues"] = isUniqueValus;
		entity["UDFPickListOptions"] = self.pickListOptions;
		entity["PickListMultiSelect"] = allowMultiple;
	};
})();
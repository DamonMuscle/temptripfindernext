(function()
{
	createNamespace('TF.Control.Report').CreateReportViewModel = CreateReportViewModel;

	function CreateReportViewModel(options)
	{
		var self = this,
			AllDataTypeList = tf.exagoReportDataHelper.getReportDataTypesWithSchemas(),
			defaultReportName = options.defaultReportName,
			defaultDataType = AllDataTypeList[0],
			allReportTypes = tf.exagoReportDataHelper.getAllReportTypes();

		// Validation settings
		self.validatorFields = {
			reportName: {
				trigger: "change",
				validators:
				{
					stringLength: {
						max: 50,
						message: 'Report Name must be less than 50 characters'
					},
					notEmpty: { message: "Report Name required" },
					callback: {
						message: "Report Name already exists",
						callback: function(value)
						{
							if (!value) return true;

							value = $.trim(value);

							return self.checkIfNameIsUnique(value);
						}
					}
				}
			},
			dataType: {
				trigger: "change",
				validators:
				{
					callback:
					{
						message: 'Data Type required',
						callback: self.onValidateDataTypeField.bind(self)
					}
				}
			}
		};
		self.dataTypeWithSchemas = {};

		// Observable variables.
		self.obReportName = ko.observable(defaultReportName);
		self.obSelectedReportTypeName = ko.observable(allReportTypes[0]);
		self.obDataTypeOptions = ko.observableArray(AllDataTypeList);
		self.obSelectedDataType = ko.observable(defaultDataType);
		self.obSelectedDataTypeName = ko.observable(defaultDataType.Name);

		self.obSchemasOptions = ko.observableArray([]);
		self.obSelectedSchema = ko.observable(null);
		self.obSelectedSchemaName = ko.observable(null);
		self.OnDataTypeSelected(defaultDataType);
		self.obSelectedDataType.subscribe(self.OnDataTypeSelected.bind(self));

		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
	}

	CreateReportViewModel.prototype.constructor = CreateReportViewModel;

	/**
	 * Initialization.
	 *
	 */
	CreateReportViewModel.prototype.init = function(viewModel, element)
	{
		var self = this;

		self.element = $(element);
		self.initValidation(element);
	};

	CreateReportViewModel.prototype.initValidation = function(element)
	{
		var self = this, isValidating = false,
			validatorFields = {
				reportName: self.validatorFields["reportName"],
				dataType: self.validatorFields["dataType"]
			};

		$(element).bootstrapValidator({
			excluded: [],
			live: 'enabled',
			message: 'This value is not valid',
			fields: validatorFields
		}).on('success.field.bv', function(e, data)
		{
			var $parent = data.element.closest('.form-group');
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
	};

	CreateReportViewModel.prototype.validate = function()
	{
		var self = this;
		if (!tf.exagoBIHelper.checkReservedWord(self.obReportName()))
		{
			tf.promiseBootbox.alert(tf.exagoBIHelper.getReservedWordInfo());
			return Promise.resolve(false);
		}

		return self.pageLevelViewModel.saveValidate()
			.then(function(isValid)
			{
				if (!isValid) return false;

				return {
					reportName: self.obReportName(),
					dataTypeId: self.obSelectedDataType().Id,
					dataTypeName: self.obSelectedDataType().Name,
					dataSchemaId: self.obSelectedSchema().Id,
					dataSchemaName: self.obSelectedSchema().Name,
					isDashboard: false	// "Dashboard" report type is no longer used
				};
			});
	};

	CreateReportViewModel.prototype.onValidateDataTypeField = function(value, validator)
	{
		var self = this,
			dataType = self.obSelectedDataType();

		if (!dataType || !dataType.Id || !dataType.Name) return false;

		return true;
	};


	CreateReportViewModel.prototype.OnDataTypeSelected = function(dataType)
	{
		var self = this;

		self.obSchemasOptions(dataType.Schemas);
		self.obSelectedSchema(dataType.Schemas[0]);
		self.obSelectedSchemaName(dataType.Schemas[0].Name);
	};

	CreateReportViewModel.prototype.checkIfNameIsUnique = function(name)
	{
		var type = "report",
			endpoint = tf.dataTypeHelper.getEndpoint(type);

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), endpoint),
			{
				paramData: {
					"name": name
				},
			},
			{
				overlay: false
			}).then(function(response)
			{
				if (response && Array.isArray(response.Items))
				{
					var matchedItems = response.Items;
					if (matchedItems.length < 1)
					{
						return true;
					}

					return false;
				}

				return false;
			});
	};

	CreateReportViewModel.prototype.cleanupValidation = function()
	{
		var self = this,
			bv = $(self.element).data("bootstrapValidator");

		if (!!bv && bv.destroy)
		{
			bv.destroy();
		}
	};

	CreateReportViewModel.prototype.dispose = function()
	{
		var self = this;

		self.cleanupValidation();
		self.pageLevelViewModel.dispose();
	};

})();


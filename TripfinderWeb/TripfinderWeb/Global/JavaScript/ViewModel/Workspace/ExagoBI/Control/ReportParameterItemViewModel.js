(function()
{
	createNamespace('TF.Control').ReportParameterItemViewModel = ReportParameterItemViewModel;

	function ReportParameterItemViewModel(parameterObj)
	{
		var self = this;

		self.name = parameterObj.Name;
		self.displayName = parameterObj.DisplayName;
		self.dataType = parameterObj.DataType; // parameter's data type (Number, Date, Time, Boolean, Text)
		self.required = parameterObj.Required === true;
		self.requiredCssClass = self.required ? "requirestar" : "";
		self.originalValue = parameterObj.Value;
		self.obCurrentValue = ko.observable(null);
		self.buttons = [{
			text: "Today",
			value: "[Today]",
			style: null,
			css: null
		}, {
			text: "Tomorrow",
			value: "[Tomorrow]",
			style: null,
			css: null
		}, {
			text: "Next Weekday",
			value: "[Next Weekday]",
			style: null,
			css: null
		}
		];

		self.populateInitialValue();
		self.generateValidatorFields();
	}

	ReportParameterItemViewModel.prototype.constructor = ReportParameterItemViewModel;

	ReportParameterItemViewModel.prototype.init = function(viewModel, element)
	{
		var self = this;

		self.$element = $(element);
	};

	ReportParameterItemViewModel.prototype.populateInitialValue = function()
	{
		var self = this,
			initialValue;

		switch (self.dataType)
		{
			case "Date":
				initialValue = self.originalValue !== undefined ? self.originalValue : "[Today]";
				break;
			case "Time":
			case "Boolean":
			case "Number":
			case "Text":
			default:
				initialValue = self.originalValue !== undefined ? self.originalValue : null;
				break;
		}

		self.obCurrentValue(initialValue);
	};

	ReportParameterItemViewModel.prototype.generateValidatorFields = function()
	{
		var self = this;

		self.validatorFields = {};
		var validatorForValue;
		switch (self.dataType)
		{
			case "Date":
			case "Time":
			case "Boolean":
			case "Number":
			case "Text":
			default:
				validatorForValue = {
					trigger: "blur change",
					validators: {}
				};

				if (self.required)
				{
					validatorForValue.validators["notEmpty"] = { message: "required" };
				}
				break;
		}

		self.validatorFields[self.name] = validatorForValue;
	};

	ReportParameterItemViewModel.prototype.fastClick = function()
	{
		console.log(this.obCurrentValue)
	};

	ReportParameterItemViewModel.prototype.toDataEntry = function()
	{
		var self = this;

		return {
			Name: self.name,
			DataType: self.dataType,
			Value: self.obCurrentValue()
		};
	};

	ReportParameterItemViewModel.prototype.dispose = function()
	{
		// Need to do resource cleanup here for certain fields (like date/time picker ...)
	};

})();


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
			case "DateRange":
				var time = new Date()
				var today =  toISOStringWithoutTimeZone(moment(time.toLocaleDateString()))
				initialValue = self.originalValue !== undefined ? self.originalValue : {StartDate:"[Today]", EndDate:"[Today]",SelectedItem:"Today",DateNum:"1"};
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
			case "DateRange":
				var validatorForStart = {
					trigger: "blur change",
					validators: {}
				};
				if (self.required)
				{
					validatorForStart.validators["callback"] = 
					{
						callback: function(value, validator, $field) {

							var dateStartText = $("#dateRangeStart").val()
							var dateEndText =  $("#dateRangeEnd").val()
							var dateStart = moment( $("#dateRangeStart").val())
							var dateEnd = moment($("#dateRangeEnd").val())
							if(dateStartText =="" || dateEndText =="")
							{
								return {
									valid: false,
                                    message: 'Date value is required'
								}
							}

							if(dateStart.isValid() && dateEnd.isValid() && dateStart > dateEnd)
							{
								return {
									valid: false,
                                    message: 'End Date should be later than Start Date'
								}
							}
							return true;
						}
					};
				}
				self.validatorFields["StartDate"] = validatorForStart;
				var validatorForEnd = {
					trigger: "blur change",
					validators: {}
				};
				if (self.required)
				{
					//validatorForEnd.validators["notEmpty"] = null;

					validatorForEnd.validators["callback"] =
					{
						callback: function(value, validator, $field) {

							validator.revalidateField('StartDate')
							return true;
						}
					};
				}
				self.validatorFields["EndDate"] = validatorForEnd;
				validatorForValue = {
					trigger: "blur change",
					validators: {}
				};
				break;
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

		if(self.dataType == "DateRange")
		{
			return [
				{
					Name: "StartDate",
					DataType: "Date",
					Value: self.obCurrentValue().StartDate
				},{
					Name: "EndDate",
					DataType: "Date",
					Value: self.obCurrentValue().EndDate
				},{
					Name: "SelectedItem",
					DataType: "SaveOnly",
					Value: self.obCurrentValue().SelectedItem
				},{
					Name: "DateNum",
					DataType: "SaveOnly",
					Value: self.obCurrentValue().DateNum
				}
			];
		}
		else
		{
			return {
				Name: self.name,
				DataType: self.dataType,
				Value: self.obCurrentValue()
			};
		}
	};

	ReportParameterItemViewModel.prototype.dispose = function()
	{
		// Need to do resource cleanup here for certain fields (like date/time picker ...)
	};

})();


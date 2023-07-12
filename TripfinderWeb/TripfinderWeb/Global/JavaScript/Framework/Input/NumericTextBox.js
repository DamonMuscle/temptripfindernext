ko.bindingHandlers.numericTextBox = {
	init: function(element, valueAccessor, allBindings, viewModel, bindingContext)
	{
		var defaults = {
			min: 0,
			step: 1,
			decimals: 0,
			format: "0.",
			disable: false,
		};
		var option = $.extend(defaults, valueAccessor());
		$(element).kendoNumericTextBox(option);
		ko.bindingHandlers.numericTextBox.setValue(element, valueAccessor);

		$(element).data("kendoNumericTextBox").bind("change", function()
		{
			var value = this.value();
			valueAccessor().value(value);
		});
	},
	update: function(element, valueAccessor, allBindings, viewModel, bindingContext)
	{
		ko.bindingHandlers.numericTextBox.setValue(element, valueAccessor);
	},
	setValue: function(element, valueAccessor)
	{
		var kendoNumericTextBox = $(element).data("kendoNumericTextBox");
		var disable = valueAccessor().disable, disableType = typeof disable;
		kendoNumericTextBox.enable(disableType == "function" ? !disable() : (disableType == "boolean" ? !disable : true));
		kendoNumericTextBox.value(valueAccessor().value());
	}
};

ko.bindingHandlers.clickButton = {
	init: function(element, valueAccessor, allBindings, viewModel, bindingContext)
	{
		ko.bindingHandlers.clickButton.preventEvent(element, valueAccessor);
		$(element).on("click.disableClick", function(e)
		{
			if (!$(element).data("disable"))
			{
				valueAccessor().click.call(viewModel, viewModel, e);
			}
		})
	},
	update: function(element, valueAccessor, allBindings, viewModel, bindingContext)
	{
		ko.bindingHandlers.clickButton.preventEvent(element, valueAccessor);
	},
	preventEvent: function(element, valueAccessor)
	{
		var $element = $(element);
		var disable = valueAccessor().disable;
		$element.data("disable", disable);
		if (disable)
		{
			$element.addClass("disable");
		} else
		{
			$element.removeClass("disable");
		}
	}
}

ko.bindingHandlers.uiInit = {
	init: function(element, valueAccessor, allBindings, viewModel, bindingContext)
	{
		var value = ko.unwrap(valueAccessor());
		if (allBindings.has('onDestroy'))
		{
			ko.utils.domNodeDisposal.addDisposeCallback(element, function()
			{
				allBindings.get('onDestroy').call(viewModel);
			});
		}
		if (typeof value == 'function')
		{
			value.call(viewModel, viewModel, element);
			return;
		}
	},
	update: function(element, valueAccessor, allBindings, viewModel, bindingContext)
	{
		var value = ko.unwrap(valueAccessor());
		if (allBindings.has('onChange'))
		{
			allBindings.get('onChange').call(viewModel, viewModel, element);
		}
		if (!allBindings.has('finish'))
		{
			return;
		}
		else
		{
			if (value)
			{
				allBindings.get('finish').call(viewModel, viewModel, element, bindingContext);
			}
		}
	}
}



ko.bindingHandlers.domReference = {
	init: function(element, valueAccessor, allBindings, viewModel, bindingContext)
	{
		valueAccessor()(element);
	}
}

ko.virtualElements.allowedBindings.domReference = true;

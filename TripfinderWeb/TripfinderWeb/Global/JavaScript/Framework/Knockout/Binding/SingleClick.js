ko.bindingHandlers.singleClick = {
	init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
	{
		var handler = valueAccessor(),
            delay = 350,
            clickTimeout = false;

		$(element).click(function()
		{
			if (clickTimeout !== false)
			{
				clearTimeout(clickTimeout);
				clickTimeout = false;
			} else
			{
				clickTimeout = setTimeout(function()
				{
					clickTimeout = false;
					handler.call(viewModel);
				}, delay);
			}
		});
	}
};



ko.bindingHandlers.doubleClick = {
	init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
	{
		var handler = valueAccessor(),
            delay = 350,
            clickTimeout = false;

		$(element).click(function()
		{
			if (clickTimeout !== false)
			{
				handler.call(viewModel);
				clickTimeout = false;
			} else
			{
				clickTimeout = setTimeout(function()
				{
					clickTimeout = false;
				}, delay);
			}
		});
	}
};

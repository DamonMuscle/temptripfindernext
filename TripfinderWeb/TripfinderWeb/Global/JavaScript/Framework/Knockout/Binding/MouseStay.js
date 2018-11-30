ko.bindingHandlers.mouseStay = {
	init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
	{
		var handler = ko.unwrap(valueAccessor());
		delay = 350,
		timeoutHandle = null;
		var eBuffer = null;

		function callHandler()
		{
			handler(viewModel, eBuffer);
		}

		$(element).on("mouseover", function(e)
		{
			clearTimeout(timeoutHandle);
			timeoutHandle = setTimeout(callHandler, 250);
		});

		$(element).on("mousemove", function(e)
		{
			eBuffer = e.originalEvent;
			clearTimeout(timeoutHandle);
			timeoutHandle = setTimeout(callHandler, 250);
		});

		$(element).on("mouseout", function()
		{
			clearTimeout(timeoutHandle);
		});

		ko.utils.domNodeDisposal.addDisposeCallback(element, function()
		{
			$(element).off("mouseover");
			$(element).off("mousemove");
			$(element).off("mouseout");
		});
	}
};
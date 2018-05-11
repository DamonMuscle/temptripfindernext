ko.bindingHandlers.bootstrapSlider = {
	init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
	{
		var bindings = valueAccessor();
		var option = {};
		if (bindings.max)
		{
			option.max = ko.unwrap(bindings.max);
		}
		if (bindings.min)
		{
			option.min = ko.unwrap(bindings.min);
		}
		if (bindings.min)
		{
			option.value = ko.unwrap(bindings.value);
		}
		if (bindings.formatter)
		{
			option.formatter = bindings.formatter;
		}
		var slider = $(element).slider(option);

		slider.on("change", function(e)
		{
			if (e.value.oldValue != e.value.newValue)
			{
				bindings.value(e.value.newValue);
			}
		});
		slider.on("slideStart", function(e)
		{
			if (bindings.slideStart)
			{
				bindings.slideStart.call(viewModel);
			}
		});
		slider.on("slide", function(e)
		{
			if (bindings.slide)
			{
				bindings.slide.call(viewModel);
			}
		});
		slider.on("slideStop", function(e)
		{
			if (bindings.slideStop)
			{
				bindings.slideStop.call(viewModel);
			}
		});
		ko.utils.domNodeDisposal.addDisposeCallback(element, function()
		{
			$(element).slider("destroy");
		});
	},
	update: function(element, valueAccessor, allBindings, viewModel, bindingContext)
	{
		var bindings = valueAccessor();
		if (bindings.max)
		{
			$(element).slider("setAttribute", "max", ko.unwrap(bindings.max));
		}
		if (bindings.min)
		{
			$(element).slider("setAttribute", "min", ko.unwrap(bindings.min));
		}
		if (bindings.value)
		{
			$(element).slider("setValue", ko.unwrap(bindings.value), true, false);
		}
		if (bindings.finish)
		{
			bindings.finish.call(viewModel);
		}
	}
};
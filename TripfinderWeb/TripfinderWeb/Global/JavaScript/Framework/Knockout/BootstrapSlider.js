(function()
{
	function updateEnabled($element, enabled)
	{
		if (enabled == null)
		{
			enabled = true;
		}

		var slider = $element.data('slider');
		if (enabled)
		{
			slider.enable();
		}
		else
		{
			slider.disable();
		}
	}

	ko.bindingHandlers.bootstrapSlider = {
		init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
		{
			var bindings = valueAccessor(), option = {}, disposables = [];
			if (bindings.max)
			{
				option.max = ko.unwrap(bindings.max);
			}
			if (bindings.min)
			{
				option.min = ko.unwrap(bindings.min);
			}
			if (bindings.value)
			{
				option.value = ko.unwrap(bindings.value);
			}
			if (bindings.formatter)
			{
				option.formatter = bindings.formatter;
			}
			if (bindings.ticks_labels)
			{
				option.ticks_labels = bindings.ticks_labels;
			}
			if (bindings.tooltip)
			{
				option.tooltip = bindings.tooltip;
			}
			if (bindings.ticks)
			{
				option.ticks = bindings.ticks;
			}

			if (bindings.enabled)
			{
				var enabled = ko.unwrap(bindings.value);
				if (enabled == null)
				{
					enabled = true;
				}

				option.enabled = enabled;
			}

			var $element = $(element).slider(option);

			if (bindings.rendered)
			{
				bindings.rendered.call(viewModel);
			}
			$element.on("change", function(e)
			{
				if (e.value.oldValue != e.value.newValue)
				{
					bindings.value(e.value.newValue);
				}
			});
			$element.on("slideStart", function(e)
			{
				if (bindings.slideStart)
				{
					bindings.slideStart.call(viewModel);
				}
			});
			$element.on("slide", function(e)
			{
				if (bindings.slide)
				{
					bindings.slide.call(viewModel);
				}
			});
			$element.on("slideStop", function(e)
			{
				if (bindings.slideStop)
				{
					bindings.slideStop.call(viewModel);
				}
			});

			if (bindings.enabled)
			{
				updateEnabled($element, ko.unwrap(bindings.enabled));
				if (ko.isObservable(bindings.enabled))
				{
					disposables.push(bindings.enabled.subscribe(() =>
					{
						var enabled = bindings.enabled();
						updateEnabled($element, enabled);
					}));
				}
			}

			ko.utils.domNodeDisposal.addDisposeCallback(element, function()
			{
				disposables.forEach(i => i.dispose());
				$element.slider("destroy");
			});
		},
		update: function(element, valueAccessor, allBindings, viewModel, bindingContext)
		{
			var bindings = valueAccessor(), $e = $(element);
			if (bindings.max)
			{
				$e.slider("setAttribute", "max", ko.unwrap(bindings.max));
			}

			if (bindings.min)
			{
				$e.slider("setAttribute", "min", ko.unwrap(bindings.min));
			}

			if (bindings.value)
			{
				$e.slider("setValue", ko.unwrap(bindings.value), true, false);
			}

			if (bindings.enabled)
			{
				updateEnabled($e, ko.unwrap(bindings.enabled));
			}

			if (bindings.finish)
			{
				bindings.finish.call(viewModel);
			}
		}
	};
})();
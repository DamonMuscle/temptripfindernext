TF.DateTimeBindingInitializer = (function(handlerName, format)
{
	var domManager = new TF.DateTimeDomManager(format);

	function populateEmptyValue($element)
	{
		if ($element.val().length == 0)
		{
			$element.val(TF.Conversion.toDateTimeText(new Date(), format));
			$element.change();
			return true;
		}
		return false;
	}

	ko.bindingHandlers[handlerName] = {
		init: function(element, valueAccessor, allBindings, viewModel, bindingContext)
		{
			ko.bindingHandlers.dateBox.update(element, valueAccessor, allBindings, viewModel, bindingContext);

			ko.utils.registerEventHandler(element, "change", function(e)
			{
				var observable = valueAccessor();
				var date = TF.Conversion.toDateTime(element.value, format);

				$(element).attr('data-' + handlerName + '-bypassUpdate', 1);
				observable(date);
			});

			ko.utils.registerEventHandler(element, "keydown", function(e)
			{
				var $element = $(element);
				switch (e.which)
				{
					case TF.Events.KeyCode.UP:
						if (!populateEmptyValue($element))
						{
							domManager.incrementSelectedSection(element);
							$element.change();
							e.preventDefault();
						}
						break;
					case TF.Events.KeyCode.DOWN:
						if (!populateEmptyValue($element))
						{
							domManager.decrementSelectedSection(element);
							$element.change();
							e.preventDefault();
						}
						break;
				}

			});

			ko.utils.registerEventHandler(element, "mouseup", function(e)
			{
				if (element.value)
				{
					domManager.selectSection(element, null);
				}
			});
		},
		update: function(element, valueAccessor, allBindings, viewModel, bindingContext)
		{
			var $element = $(element);
			if ($element.attr('data-' + handlerName + '-bypassUpdate'))
			{
				$element.removeAttr('data-' + handlerName + '-bypassUpdate')
			}
			else
			{
				// Apply date events to element here.
				var value = ko.unwrap(valueAccessor());
				$(element).val(TF.Conversion.toDateTimeText(value, format));
			}
		}
	};
});

(function()
{
	TF.DateTimeBindingInitializer('dateBox', 'L');
	TF.DateTimeBindingInitializer('timeBox', 'LT')
})();
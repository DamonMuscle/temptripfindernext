(function()
{
	//function (element, valueAccessor, allBindings, viewModel, bindingContext) {
	//	var newValueAccessor = function () {
	//		var result = {};
	//		result[eventName] = valueAccessor();
	//		return result;
	//	};
	//	return ko.bindingHandlers['event']['init'].call(this, element, newValueAccessor, allBindings, viewModel, bindingContext);
	//}

	ko.bindingHandlers.contextMenuClick = {
		init: function(element, valueAccessor, allBindings, viewModel, bindingContext)
		{
			var $element = $(element);

			$element.on("click", function(e)
			{
				if (!($element.hasClass("disabled") || $element.hasClass("disabledToUse")))
				{
					valueAccessor().call(this, viewModel, e);

					// if (cancelCloseMenuEvent($element))
					if (!($element.hasClass("disable-auto-close") && TF.isPhoneDevice))
					{
						$element.trigger("contextMenuClose");
					}
				}
			});

			//might not necessary, since ko will call jquery unbind when jquery presents 
			ko.utils.domNodeDisposal.addDisposeCallback(element, function()
			{
				$element.off("click");
			});
		}
	};

	function cancelCloseMenuEvent($element)
	{
		return !TF.Grid.FilterHelper.isFilterMenuOpen($element);
	}
})();

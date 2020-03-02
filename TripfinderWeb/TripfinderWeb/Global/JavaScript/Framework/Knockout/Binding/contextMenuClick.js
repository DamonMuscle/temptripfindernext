(function()
{
	ko.bindingHandlers.contextMenuClick = {
		init: function(element, valueAccessor, allBindings, viewModel, bindingContext)
		{
			var $element = $(element);

			$element.on("click", function(e)
			{
				if (!($element.hasClass("disabled") || $element.hasClass("disabledToUse")))
				{
					// TODO, Disable the function for RCM of the grid for now
					if (!$element.parent().hasClass("grid-menu"))
					{
						valueAccessor().call(this, viewModel, e);
					}

					if (!$element.hasClass("disable-auto-close"))
					{
						tf.contextMenuManager.dispose();
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

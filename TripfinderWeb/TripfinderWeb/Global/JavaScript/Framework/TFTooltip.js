(function()
{
	createNamespace("TF.Helper").TFTooltip = TFTooltip;

	function TFTooltip()
	{
	}

	TFTooltip.prototype.init = function($element, options)
	{
		var defaultOptions = {
			placement: 'top',
			title: "this is a long tooltip. transfinder shanghai office.",
			trigger: 'hover focus',
			container: 'body',
			delay: { "show": 100, "hide": 0 },
			template: '<div class="tooltip tf-tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
		};

		if (options.className)
		{
			defaultOptions.template = '<div class="tooltip tf-tooltip ' + options.className + '" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>';
		}

		options = $.extend({}, defaultOptions, options);

		$element.tooltip(options);
	}

	TFTooltip.prototype.destroy = function($element)
	{
		$element.tooltip('destroy');
	}
})();

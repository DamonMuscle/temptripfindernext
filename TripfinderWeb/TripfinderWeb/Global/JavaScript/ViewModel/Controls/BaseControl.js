(function()
{
	createNamespace("TF.Control").BaseControl = BaseControl;

	function BaseControl()
	{

	}

	BaseControl.prototype.apply = function()
	{
		return Promise.resolve(this);
	};

	BaseControl.prototype.cancel = function()
	{
		return Promise.resolve(this);
	};

	BaseControl.keyboardShowHideToggleHeight = function(element)
	{
		if (TF.isPhoneDevice)
		{
			element.find(":text,textarea").on("focus", function()
			{
				if(element.find(".special-height").length===0)
				{
					var specialHeight = $("<div class='special-height'></div>").height($(window).height()/2);
					element.append(specialHeight);
				}
			}).on('focusout', function()
			{
				element.find(".special-height").remove();
			});
		}

	};

})();
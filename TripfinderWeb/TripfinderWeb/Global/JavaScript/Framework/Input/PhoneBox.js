(function()
{
	var namespace = window.createNamespace("TF.Input");
	namespace.PhoneBox = PhoneBox;

	function PhoneBox()
	{
		namespace.IntegerBox.apply(this, arguments);
		this.getElement().on("keyup", function(e)
		{
			if (event.which != 37 && event.which != 39)
			{
				$input = $(e.target);
				var rawValue = formatLocal(tfRegion, $input.val());
				$input.val(rawValue);
				this.obRawValue(rawValue);
			}
		}.bind(this));
	};

	PhoneBox.prototype = Object.create(namespace.IntegerBox.prototype);

	PhoneBox.constructor = PhoneBox;

	PhoneBox.prototype.type = "Phone";

	PhoneBox.prototype.rawValueChange = function(value)
	{
		namespace.StringBox.prototype.rawValueChange.call(this, value);
	};

	PhoneBox.prototype.valueChange = function(value)
	{
		value = formatLocal(tfRegion, value);
		namespace.StringBox.prototype.valueChange.call(this, value);
	};
})();

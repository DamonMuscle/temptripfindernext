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
				var val = $input.val().replace(/\D/g, '');
				var rawValue = this.formatPhone(val);
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
		value = this.formatPhone(value);
		namespace.StringBox.prototype.valueChange.call(this, value);
	};

	PhoneBox.prototype.formatPhone = function(phone) {
		if (!phone) return "";
		var output = (phone || "").replace(/\D/g, '');
		if (output.length <= 3) return output;
		output = output.substring(0, 10);
    if (output.length <= 3)
    {
      output = output.replace(/^(\d{0,3})/, '($1)');
    } else if (output.length <= 6)
    {
      output = output.replace(/^(\d{0,3})(\d{0,3})/, '($1) $2');
    } else
    {
      output = output.replace(/^(\d{0,3})(\d{0,3})(.*)/, '($1) $2-$3');
    }
		return output;
	};
})();

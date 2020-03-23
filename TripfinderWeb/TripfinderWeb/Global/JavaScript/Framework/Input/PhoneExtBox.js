(function()
{
	var namespace = window.createNamespace("TF.Input");
	namespace.PhoneExtBox = PhoneExtBox;

	function PhoneExtBox()
	{
		namespace.IntegerBox.apply(this, arguments);
		this.getElement().on("keypress keyup blur", function(event)
		{
			var key = event.which || event.keyCode || 0;
			if (key == 45)
			{
				event.preventDefault();
				event.stopPropagation();
			}
		});
	}

	PhoneExtBox.prototype = Object.create(namespace.IntegerBox.prototype);

	PhoneExtBox.constructor = PhoneExtBox;

	PhoneExtBox.prototype.type = "PhoneExt";

	PhoneExtBox.prototype.rawValueChange = function(value)
	{
		namespace.StringBox.prototype.rawValueChange.call(this, value);
	};

	PhoneExtBox.prototype.valueChange = function(value)
	{
		namespace.StringBox.prototype.valueChange.call(this, value);
	};
})();

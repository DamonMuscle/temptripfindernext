(function()
{
	var namespace = window.createNamespace("TF.Input");
	namespace.NaturalNumberBox = NaturalNumberBox;

	function NaturalNumberBox(initialValue, name, className, events)
	{
		namespace.StringBox.call(this, initialValue, name, className, undefined, undefined, events);
		this.getElement().on("keypress keyup blur", function(event)
		{
			var key = event.which || event.keyCode || 0;

			if (key < 48 || key > 57)
			{
				event.preventDefault();
				event.stopPropagation();
			}
		});
	}

	NaturalNumberBox.prototype = Object.create(namespace.StringBox.prototype);

	NaturalNumberBox.prototype.constructor = NaturalNumberBox;

	NaturalNumberBox.prototype.type = "NaturalNumber";
})();
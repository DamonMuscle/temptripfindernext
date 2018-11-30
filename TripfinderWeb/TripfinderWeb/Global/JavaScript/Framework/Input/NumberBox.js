(function()
{
	var namespace = window.createNamespace("TF.Input");
	namespace.NumberBox = NumberBox;

	function NumberBox(initialValue, attributes, disable, events)
	{
		namespace.DecimalBox.call(this, initialValue, attributes, disable, events);
	};

	NumberBox.prototype = Object.create(namespace.DecimalBox.prototype);

	NumberBox.constructor = NumberBox;

	NumberBox.prototype.type = "Number";
})();
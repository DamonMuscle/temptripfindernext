(function()
{
	var namespace = window.createNamespace("TF.Input");
	namespace.DisabledBox = DisabledBox;

	function DisabledBox(initialValue, attribute)
	{
		namespace.StringBox.call(this, null, attribute);
		this.$element.prop('disabled', true);
	};

	DisabledBox.prototype = Object.create(namespace.StringBox.prototype);

	DisabledBox.constructor = DisabledBox;

	DisabledBox.prototype.type = "Disabled";
})();
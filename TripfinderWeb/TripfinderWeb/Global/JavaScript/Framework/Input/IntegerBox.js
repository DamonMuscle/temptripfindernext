(function()
{
	var namespace = window.createNamespace("TF.Input");
	namespace.IntegerBox = IntegerBox;

	function IntegerBox(initialValue, name, className, events)
	{
		namespace.StringBox.call(this, initialValue, name, className, undefined, undefined, events);
		this.getElement().on("keypress keyup blur", function(event)
		{
			var key = event.which || event.keyCode || 0;
			if ((key < 48 || key > 57) && (key != 45 || ($(this).val().indexOf('-') !== -1 ? this.selectionStart > 0 || this.selectionEnd === 0 : false) || this.selectionStart > 0) && TF.Input.BaseBox.notSpecialKey(event))
			{
				event.preventDefault();
				event.stopPropagation();
			}
		});
	};

	IntegerBox.prototype = Object.create(namespace.StringBox.prototype);

	IntegerBox.constructor = IntegerBox;

	IntegerBox.prototype.type = "Integer";
})();
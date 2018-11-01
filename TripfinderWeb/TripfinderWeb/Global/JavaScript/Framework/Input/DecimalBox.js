(function()
{
	var namespace = window.createNamespace("TF.Input");
	namespace.DecimalBox = DecimalBox;

	function DecimalBox(initialValue, attributes, disable, events)
	{
		namespace.StringBox.call(this, initialValue, attributes, disable, undefined, undefined, events);

		this.getElement().on("keypress keyup blur", function(event)
		{
			var keyCode = event.which || event.keyCode || 0;
			//Fix bug FT-893: in FireFox, keypress event is fired when press backspace key. In Chrome, keypress event is not fired.
			if (event.type == "keypress" && keyCode == 8)
			{
				return;
			}

			if ((keyCode != 46 || $(this).val().indexOf('.') !== -1) && (keyCode != 45 || ($(this).val().indexOf('-') !== -1 ? this.selectionStart > 0 || this.selectionEnd === 0 : false) || this.selectionStart > 0) && (keyCode < 48 || keyCode > 57) && keyCode !== 37 && keyCode !== 39 && keyCode !== 9)
			{
				event.preventDefault();
				event.stopPropagation();
			}
		});
	};

	DecimalBox.prototype = Object.create(namespace.StringBox.prototype);

	DecimalBox.constructor = DecimalBox;

	DecimalBox.prototype.type = "Decimal";
})();
(function()
{
	var namespace = window.createNamespace("TF.Input");
	namespace.CurrencyBox = CurrencyBox;

	function CurrencyBox(initialValue, attributes)
	{
		namespace.StringBox.apply(this, arguments);

		this.getElement().on("keypress keyup blur", function(event)
		{
			var regex = /^[1-9]\d*(((,\d{3}){1})?(\.\d{0,1})?)$/,
				keyCode = event.which || event.keyCode || 0;

			if (($(this).val() !== '' && !regex.test($(this).val())) || (keyCode != 46 || $(this).val().indexOf('.') != -1) && (keyCode < 48 || keyCode > 57) && keyCode != 37 && keyCode != 39)
			{
				event.preventDefault();
			}
		});
	};

	CurrencyBox.prototype = Object.create(namespace.StringBox.prototype);

	CurrencyBox.constructor = CurrencyBox;

	CurrencyBox.prototype.type = "Currency";

})();
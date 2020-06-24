(function()
{
	createNamespace("TF").DataFormatHelper = DataFormatHelper;

	var MAX_NUMBER = 999999999;

	function DataFormatHelper()
	{

	}

	DataFormatHelper.prototype.currencyFormatter = function(value)
	{
		if (!value) return 0;

		var floatValue = parseFloat(value),
			decimalPrecision = 2,
			index = value.toString().indexOf('.');

		if (value !== 0 && index !== -1)
		{
			var count = value.toString().length - index - 1;
			if (count > decimalPrecision)
			{
				var kappa = Math.pow(10, decimalPrecision),
					floorValue = Math.floor(floatValue * kappa) / kappa

				value = floorValue.toFixed(decimalPrecision);
			}
		}

		// needs to keep value as text for "-" and "."
		return +value > MAX_NUMBER ? MAX_NUMBER : value;
	};
	DataFormatHelper.prototype.phoneFormatter = function(value)
	{
		if (isNullObj(value))
		{
			return value;
		}
		let content = value.toString(),
			cleanPhone = content.replace(/\D/g, ''),
			groups = cleanPhone.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
		if (cleanPhone.length < 3)
		{
			content = cleanPhone;
		} else if (cleanPhone.length >= 3 && cleanPhone.length <= 6)
		{
			content = `(${groups[1]}) ${groups[2]}`;
		} else if (cleanPhone.length >= 6 && cleanPhone.length <= 10)
		{
			content = `(${groups[1]}) ${groups[2]}-${groups[3]}`;
		}
		return content;
	}
})();

(function()
{
	createNamespace("TF").DataFormatHelper = DataFormatHelper;

	var MAX_NUMBER = 999999999;
	var PHONE_NUMBER_PATTERNS = [{
		order: 1,
		mode: /^\D*(?:1|01|001)?\D*(\d{3})\D*(\d{3})\D*(\d{4})\D*$/,
		display: "001-({0}){1}-{2}",
		value: "001{0}{1}{2}",
		region: "USA,Canada"
	}];

	function DataFormatHelper()
	{
		//constructor palceholder
	}

	DataFormatHelper.prototype.currencyFormatter = function(value)
	{
		if (!value)
		{
			return 0;
		}
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

	DataFormatHelper.prototype.getStandardPhoneNumberValue = function(value)
	{
		if (isNullObj(value))
		{
			return value;
		}
		let content = value.toString();
		const cleanPhone = content.replace(/\D/g, '');
		if (cleanPhone.length === 10)
		{
			return cleanPhone;
		}
		var phoneNumberWithCountryCodePatterns = PHONE_NUMBER_PATTERNS;
		let longPhoneNumberMatched = false;
		for (const pattern of phoneNumberWithCountryCodePatterns)
		{
			const groups = cleanPhone.match(pattern.mode);
			if (groups)
			{
				content = pattern.value.format(groups[1], groups[2], groups[3]);
				longPhoneNumberMatched = true;
				break;
			}
		}
		if (!longPhoneNumberMatched)
		{
			content = cleanPhone;
		}

		return content;
	}

	DataFormatHelper.prototype.isValidPhoneNumber = function(value)
	{
		var digitsValue = value.replace(/\D/g, '');
		if (digitsValue.length < 10)
		{
			return false;
		}
		const phoneNumberWithCountryCodePatterns = PHONE_NUMBER_PATTERNS;
		let longPhoneNumberMatched = false;
		for (const pattern of phoneNumberWithCountryCodePatterns)
		{
			const matched = pattern.mode.test(digitsValue);
			if (matched)
			{
				longPhoneNumberMatched = true;
				break;
			}
		}
		return longPhoneNumberMatched;
	};

	DataFormatHelper.prototype.getPurePhoneNumber = function(value)
	{
		if (!value)
		{
			return null;
		}

		return value.replace(/\D/g, '');
	}

	DataFormatHelper.prototype.phoneFormatter = function(value)
	{
		if (isNullObj(value))
		{
			return value;
		}
		let content = value.toString();
		const cleanPhone = content.replace(/\D/g, '');
		let groups = cleanPhone.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
		if (cleanPhone.length < 3)
		{
			content = cleanPhone;
		}
		else if (cleanPhone.length >= 3 && cleanPhone.length <= 6)
		{
			content = `(${groups[1]}) ${groups[2]}`;
		}
		else if (cleanPhone.length >= 6 && cleanPhone.length <= 10)
		{
			content = `(${groups[1]}) ${groups[2]}-${groups[3]}`;
		}
		else
		{
			var phoneNumberWithCountryCodePatterns = PHONE_NUMBER_PATTERNS;
			let longPhoneNumberMatched = false;
			for (const pattern of phoneNumberWithCountryCodePatterns)
			{
				groups = cleanPhone.match(pattern.mode);
				if (groups)
				{
					content = pattern.display.format(groups[1], groups[2], groups[3]);
					longPhoneNumberMatched = true;
					break;
				}
			}
			if (!longPhoneNumberMatched)
			{
				content = content.substr(0, 16);
			}
		}
		return content;
	}

	DataFormatHelper.prototype.clearPhoneNumberFormat = function(data, self)
	{
		const _getColumnByFieldName = (columns, item) =>
			columns.find(x => x.field === item.field);
		const _stripValue = (value) =>
			value?.replace("(", "").replace(")", "").replace("-", "").replace(" ", "");

		data?.forEach(item =>
		{
			let column = self.options.originalGridDefinition ?
				_getColumnByFieldName(self.options.originalGridDefinition.Columns, item) :
				_getColumnByFieldName(self.options.gridDefinition.Columns, item);
			if (column &&
				(column.formatType?.toLowerCase() === "phone" ||
					column.questionType?.toLowerCase() === "phone" ||
					column.UDFType === "phone number"))
			{
				item.value = _stripValue(item.value);
			}
		});
	}
})();

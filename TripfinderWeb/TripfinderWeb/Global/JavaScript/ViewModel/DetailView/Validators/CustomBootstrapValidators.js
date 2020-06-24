(function($)
{
	function transportValue(value)
	{
		switch (typeof value)
		{
			case 'function':
				return value();
			default:
				return value;
		}
	}

	$.fn.bootstrapValidator.validators.datetimeGreaterThan = {
		/**
		 * @param {BootstrapValidator} validator The validator plugin instance
		 * @param {jQuery} $field The jQuery object represents the field element
		 * @param {Object} options The validator options
		 * @returns {Boolean}
		 */
		validate: function(validator, $field, options)
		{
			if (options == null)
			{
				return false;
			}
			var fieldVal = moment($field.val(), options['format']);
			if (!fieldVal.isValid())
			{
				return true;
			}
			var data = transportValue(options['value']);
			if (data == null)
			{
				return true;
			}
			var optionValue = moment(data);
			if (!optionValue.isValid())
			{
				return true;
			}

			return fieldVal.isAfter(optionValue) || !!(options['inclusive'] && fieldVal.isSame(optionValue));
		}
	};

	$.fn.bootstrapValidator.validators.datetimeLessThan = {
		/**
		 * @param {BootstrapValidator} validator The validator plugin instance
		 * @param {jQuery} $field The jQuery object represents the field element
		 * @param {Object} options The validator options
		 * @returns {Boolean}
		 */
		validate: function(validator, $field, options)
		{
			if (options == null)
			{
				return false;
			}

			var fieldVal = moment($field.val(), options['format']);
			if (!fieldVal.isValid())
			{
				return true;
			}
			var data = transportValue(options['value']);
			if (data == null)
			{
				return true;
			}
			var optionValue = moment(data);
			if (!optionValue.isValid())
			{
				return true;
			}

			return fieldVal.isBefore(optionValue) || !!(options['inclusive'] && fieldVal.isSame(optionValue));
		}
	};
	$.fn.bootstrapValidator.validators.phoneinplus = {
		validate: function(validator, $field, options)
		{
			var value = $field.val();
			if (options.specialInputSupport && (value === '@' || /^@@/.test(value)))
			{
				return true;
			}
			return value === "" ? true : !!value.match(/^\D*\d{3}\D*\d{3}\D*\d{4}$/);
		}
	}
}(window.jQuery));
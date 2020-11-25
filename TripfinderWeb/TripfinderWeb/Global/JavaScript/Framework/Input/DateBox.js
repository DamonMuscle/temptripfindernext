(function()
{
	var namespace = window.createNamespace("TF.Input");
	namespace.DateBox = DateBox;

	var DEFAULT_MIN_DATE = "1/1/1753";
	var DEFAULT_MAX_DATE = "12/31/9999";

	function DateBox(initialValue, attributes, disable, noWrap, delayChange, element, allBindings)
	{
		var attr = $.extend(
			{
				min: DEFAULT_MIN_DATE,
				max: DEFAULT_MAX_DATE,
			},
			attributes,
			{
				format: 'MM/DD/YYYY'
			});
		namespace.DateTimeBox.call(this, initialValue, attr, disable, noWrap, delayChange, element);
		this.$element.data('kendoDatePicker', this._dateTimePicker);
	}
	DateBox.prototype = Object.create(namespace.DateTimeBox.prototype);

	DateBox.prototype.type = "Date";

	DateBox.constructor = DateBox;

	DateBox.prototype.formatString = "L";

	DateBox.prototype.getInvalidCharacterRegex = function()
	{
		return /[^0-9A-Za-z|\/]/g;
	};

	DateBox.prototype.updateValue = function(self, e)
	{
		if (namespace.DateTimeBox.prototype.updateValue.apply(this, arguments))
		{
			var curDate = moment(this.value());
			if ((curDate.isBefore(this.maxDate) || curDate.isSame(this.maxDate, 'day')) && (curDate.isAfter(this.minDate) || curDate.isSame(this.minDate, 'day')))
			{
				return true;
			} else
			{
				this.value(null);
				return false;
			}
		}
		return false;
	}
})();

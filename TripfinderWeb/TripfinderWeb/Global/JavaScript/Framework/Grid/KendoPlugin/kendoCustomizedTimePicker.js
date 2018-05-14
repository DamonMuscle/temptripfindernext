
(function($)
{
	// shorten references to variables. this is better for uglification
	var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget,
		proxy = $.proxy,
		CHANGE = "change",
		extractFormat = kendo._extractFormat,
		isArray = $.isArray,
		NS = ".kendoCustomizedTimePicker",
		parse = kendo.parseDate,
		DATE = Date,
		TODAY = new DATE(1899,11,30);

	TODAY = new DATE(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate(), 0, 0, 0);

	var CustomizedTimePickerWidget = Widget.extend({
		init: function(element, options)
		{
			var that = this;
			var attrs = $(element).attr("attr-name");
			if (attrs)
			{
				attrs = { name: attrs };
			}
			var timeBox = (new TF.Input.TimeBox(null, attrs, null, true, true)).getElement();
			$(element).append(timeBox);
			Widget.fn.init.call(that, element, options);

			element = that.wrapper = that.element;
			options = that.options;

			normalize(options);

			that.inputElement = element.find(".datepickerinput");
			that.inputElement
                .on("blur" + NS, proxy(that._blur, that));

			kendo.notify(that);
		},
		options: {
			name: "CustomizedTimePicker",
			icon: "",
			spriteCssClass: "",
			imageUrl: "",
			parseFormats: [],
			enable: true
		},
		_blur: function()
		{
			var that = this;

			//to debug and find the real element
			that._change(that.inputElement.val());
		},
		_change: function(value)
		{
			var that = this;

			value = that._parse(value);
			that._value = value;

			if (that._old != value)
			{
				that._old = value;
				that.trigger(CHANGE);
			}
		},
		_parse: function(value)
		{
			var that = this,
                options = that.options,
                current = that._value || TODAY;

			if (value instanceof DATE)
			{
				return value;
			}

			value = parse(value, options.parseFormats, options.culture);

			if (value)
			{
				value = new DATE(TODAY.getFullYear(),
					TODAY.getMonth(),
					TODAY.getDate(),
					value.getHours(),
					value.getMinutes(),
					value.getSeconds(),
					value.getMilliseconds());
			}

			return value;
		},
		value: function(value)
		{
			var that = this;

			if (value === undefined)
			{
				return that._value;
			}
			if (that._old !== value)
			{
				that._old = that._value;
				that._value = value;
				if (moment(value).isValid())
				{
					that.inputElement.data('DateTimePicker').date(moment(value));
				} else if (moment(that._parse(value)).isValid())
				{
					that.inputElement.data('DateTimePicker').date(moment(that._parse(value)));
				} else
				{
					that.inputElement.data('DateTimePicker').clear();
					that.inputElement.val('');
				}
			}
			if (!value)
			{
				that.inputElement.data('DateTimePicker').clear();
				that.inputElement.val('');
			}
		}
	});

	function normalize(options)
	{
		var parseFormats = options.parseFormats;

		options.format = extractFormat(options.format || kendo.getCulture(options.culture).calendars.standard.patterns.t);

		parseFormats = isArray(parseFormats) ? parseFormats : [parseFormats];
		parseFormats.splice(0, 0, options.format);
		options.parseFormats = parseFormats;
	}

	ui.plugin(CustomizedTimePickerWidget);

})(window.kendo.jQuery);
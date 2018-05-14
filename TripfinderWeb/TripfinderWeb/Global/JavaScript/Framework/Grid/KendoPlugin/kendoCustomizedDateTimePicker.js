
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
		NS = ".kendoCustomizedDateTimePicker",
		parse = kendo.parseDate,
		DATE = Date,
		TODAY = new DATE();

	TODAY = new DATE(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate(), 0, 0, 0);

	var customizedTimePickerWidget = Widget.extend({
		init: function(element, options)
		{
			var that = this;
			var dateTimeBox = (new TF.Input.DateTimeBox(null, null, null, true, true)).getElement();
			$(element).append(dateTimeBox);
			Widget.fn.init.call(that, element, options);

			element = that.wrapper = that.element;
			options = that.options;

			normalize(options);

			that.inputElement = element.find(".datepickerinput");
			that.inputElement
                .on("blur" + NS, proxy(that._blur, that))

			kendo.notify(that);
		},
		options: {
			name: "CustomizedDateTimePicker",
			icon: "",
			spriteCssClass: "",
			imageUrl: "",
			parseFormats: ["MM/dd/yyyy hh:mm tt"],
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
				var isTimeColumn = TF.DateTimeBoxHelper.testIsTimeColumn(this.element);
				if (isTimeColumn)
					value = new DATE(current.getFullYear(), current.getMonth(), current.getDate(),
                                 value.getHours(), value.getMinutes(), value.getSeconds(), value.getMilliseconds());	
				//else
// 					value = new DATE(value.getFullYear(), value.getMonth(), value.getDate(),
//                                  value.getHours(), value.getMinutes(), value.getSeconds(), value.getMilliseconds());
                    //value = new DATE(toISOStringWithoutTimeZone(moment(value)));
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
				} else
				{
					that.inputElement.val('');
				}
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
	};

	kendo.ui.plugin(customizedTimePickerWidget);

})(jQuery);
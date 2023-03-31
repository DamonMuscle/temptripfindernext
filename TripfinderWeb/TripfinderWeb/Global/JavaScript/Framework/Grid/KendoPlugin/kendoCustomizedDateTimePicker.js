
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
			that.inputElement
				.on("focus" + NS, proxy(that._focus, that))

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
		_focus: function()
		{
			var that = this;
			var value = that.inputElement.val();
			var prefix = getOperatorName(that.inputElement);
			if (prefix && value.indexOf(prefix) > -1)
			{
				value = value.replace(prefix, "");
			}

			that.inputElement.val(value);
		},
		_change: function(value)
		{
			var that = this;

			value = that._parse(value);
			that._value = value;

			var left = that._old && that._old.toString();
			var right = value && value.toString();

			if (left !== right)
			{
				that._old = value;
				that.trigger(CHANGE);
			}
			else if (!!value)
			{
				var operatorName = getOperatorName(that.inputElement);
				var format = "MM/dd/yyyy hh:mm tt";
				if (operatorName && value.toString().indexOf(operatorName) == -1)
				{
					that.inputElement.val(operatorName + kendo.format("{0:" + format + "}", moment(value).toDate()));
				}
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

			var prefix = getOperatorName(that.inputElement);
			if (prefix && value.indexOf(prefix) > -1)
			{
				value = value.replace(prefix, "");
			}

			value = parse(value, options.parseFormats, options.culture);

			if (value)
			{
				var isTimeColumn = TF.DateTimeBoxHelper.testIsTimeColumn(this.element);
				if (isTimeColumn)
					value = new DATE(current.getFullYear(), current.getMonth(), current.getDate(),
						value.getHours(), value.getMinutes(), value.getSeconds(), value.getMilliseconds());
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
			if (that._old !== value || value === null)
			{
				that._old = that._value;
				that._value = value;
				if (moment(value).isValid())
				{
					var kendoDateTimePicker = that.inputElement.data('DateTimePicker');
					kendoDateTimePicker.date(moment(value));
					var operatorName = getOperatorName(that.inputElement);
					var format = "MM/dd/yyyy hh:mm tt";
					var timeOut = that.options.init === true ? 0 : 500;
					that.options.init = true;

					// The settimeout is to fix the delay in modifying control values when components are first loaded. Will be removed if there are better solution.
					setTimeout(() =>
					{
						operatorName && that.inputElement.val(operatorName + kendo.format("{0:" + format + "}", moment(value).toDate()));
					}, timeOut);
				}
				else
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

	function getOperatorName(element)
	{
		var dateTimeDateParamFiltersNames = ['On X', 'On or After X', 'On or Before X'];
		var name = element.parent()?.parent()?.find('input.k-dropdown-operator')?.attr("aria-label");
		if (dateTimeDateParamFiltersNames.includes(name))
		{
			return name.replace("X", "");
		}
		else
		{
			return "";
		}
	}

	kendo.ui.plugin(customizedTimePickerWidget);

})(jQuery);
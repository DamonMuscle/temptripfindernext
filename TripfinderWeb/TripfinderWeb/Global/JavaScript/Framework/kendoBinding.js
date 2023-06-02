(function()
{
	function jsUcfirst(string) 
	{
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	function kendoBinding()
	{
	}

	kendoBinding.create = function(config)
	{
		(new kendoBinding()).create(config);
	};

	kendoBinding.prototype.buildOptions = function(rawOptions, config)
	{
		rawOptions = rawOptions || {};
		let options = {},
			events = config.events || [];
		$.each(rawOptions, function(k, v)
		{
			if (ko.isObservable(v))
			{
				v = v();
			}
			else if ($.isPlainObject(v) && v.read && v.write)
			{
				v = ko.computed(v);
				rawOptions[k] = v;
				v = v();
			}
			else if (typeof v == 'function' && events.indexOf(k) == -1)
			{
				v = ko.computed(v);
				rawOptions[k] = v;
				v = v();
			}

			options[k] = v;
		});

		return options;
	};

	kendoBinding.prototype.watchWidget = function(widget, watches)
	{
		watches = watches || [];
		watches.forEach(function(item)
		{
			widget.bind(item.event, function()
			{
				var name = item.name;
				if (ko.isObservable(widget.rawOptions[name]))
				{
					var v = widget[name] ? widget[name]() : widget.options[name];
					if (name == "value" && widget.koValueConvertBack)
					{
						v = widget.koValueConvertBack(v);
					}
					else if (item.convert)
					{
						v = item.convert(v);
					}
					widget.rawOptions[name](v);
				}
			});
		});
	};

	kendoBinding.prototype.watchOptions = function(widget, config)
	{
		this.clearOptions(widget);
		var subscriptions = [];
		var rawOptions = ko.unwrap(widget.koValueAccessor());
		delete rawOptions.dependencies;
		widget.rawOptions = rawOptions;
		var events = config.events || [];
		var setValue = function(k, v)
		{
			var setMethodName = 'set' + jsUcfirst(k);
			if (typeof widget[setMethodName] == 'function')
			{
				if (setMethodName == "setDataSource" && $.isArray(v))
				{
					v = new kendo.data.DataSource({
						data: v
					});
				}

				widget[setMethodName](v);
				return;
			}

			if (events.indexOf(k) > -1)
			{
				var options = {};
				options[k] = v;
				widget.setOptions(options);
				return;
			}

			if (typeof widget[k] == 'function')
			{
				if (v !== widget[k]())
				{
					widget[k](v);
				}
				return;
			}

			if (v !== widget.options[k])
			{
				var options = {};
				options[k] = v;
				widget.setOptions(options);
			}
		};

		$.each(rawOptions, function(k, v)
		{
			if (ko.isObservable(v))
			{
				subscriptions.push(v.subscribe(function()
				{
					setValue(k, v());
				}));
			}
		});

		widget.optionSubscriptions = subscriptions;
	};

	kendoBinding.prototype.watchDependencies = function(widget, config)
	{
		var self = this,
			subscriptions = [];
		widget.koDependencies.forEach(function(item)
		{
			subscriptions.push(item.subscribe(function()
			{
				self.watchOptions(widget, config);
			}));
		});

		widget.dependenciesSubscriptions = subscriptions;
	};

	kendoBinding.prototype.watchModel = function(widget, config)
	{
		var self = this;
		self.watchOptions(widget, config);
		self.watchDependencies(widget, config);
	};

	kendoBinding.prototype.clearOptions = function(widget)
	{
		if (widget.optionSubscriptions)
		{
			widget.optionSubscriptions.forEach(function(item) { item.dispose() });
			widget.optionSubscriptions = [];
		}
	};

	kendoBinding.prototype.afterCreateWidget = function(widget, options)
	{
		// when pass an invalid value as DropDownList.options.value, DropDownList will be
		// selected. Setting value after creating the widget can unselect the item.
		if (options.hasOwnProperty("value") && typeof widget.value === "function")
		{
			widget.value(options.value);
		}
	};

	kendoBinding.prototype.create = function(config)
	{
		var self = this;
		var name = config.name;
		ko.bindingHandlers[name] = {
			init: function(element, valueAccessor, allBindings, viewModel, bindingContext)
			{
				var rawOptions = ko.unwrap(valueAccessor());
				var dependencies = rawOptions.dependencies || [];
				delete rawOptions.dependencies;
				var valueConvertBack = rawOptions.valueConvertBack;
				delete rawOptions.valueConvertBack;
				var options = self.buildOptions(rawOptions, config);
				var $element = $(element)[name](options);
				var widget = $element.data(name);
				widget.koValueConvertBack = valueConvertBack;
				widget.koValueAccessor = valueAccessor;
				widget.koDependencies = dependencies;
				self.afterCreateWidget(widget, options);
				self.watchModel(widget, config);
				self.watchWidget(widget, config.watches);
				ko.utils.domNodeDisposal.addDisposeCallback(element, function()
				{
					self.clearOptions(widget);

					if (widget.dependenciesSubscriptions)
					{
						widget.dependenciesSubscriptions.forEach(function(item) { item.dispose() });
					}

					if (widget.destroy)
					{
						widget.destroy();
					}
				});
			}
		};
	};

	kendoBinding.create({
		name: "kendoNumericTextBox",
		watches: [
			{
				name: "value",
				event: "change"
			}
		]
	});

	kendoBinding.create({
		name: "kendoDropDownList",
		watches: [
			{
				name: "value",
				event: "change"
			}
		],
		events: [
			"change",
			"close",
			"dataBound",
			"filtering",
			"open",
			"select",
			"cascade",
		]
	});

	kendoBinding.create({
		name: "kendoDatePicker",
		watches: [
			{
				name: "value",
				event: "change"
			}
		]
	});

	kendoBinding.create({
		name: "kendoTimePicker",
		watches: [
			{
				name: "value",
				event: "change"
			}
		]
	});

	kendoBinding.create({
		name: "kendoGrid",
		events: [
			"beforeEdit",
			"cancel",
			"cellClose",
			"change",
			"columnHide",
			"columnLock",
			"columnMenuInit",
			"columnMenuOpen",
			"columnReorder",
			"columnResize",
			"columnShow",
			"columnStick",
			"columnUnlock",
			"columnUnstick",
			"dataBinding",
			"dataBound",
			"detailCollapse",
			"detailExpand",
			"detailInit",
			"edit",
			"excelExport",
			"filter",
			"filterMenuInit",
			"filterMenuOpen",
			"group",
			"groupCollapse",
			"groupExpand",
			"navigate",
			"page",
			"pdfExport",
			"remove",
			"save",
			"saveChanges",
			"sort",
		]
	});

	kendoBinding.create({
		name: "kendoMenu",
		events: [
			"close",
			"dataBound",
			"open",
			"activate",
			"deactivate",
			"select"
		]
	});

	kendoBinding.create({
		name: "kendoPopup"
	});

	kendoBinding.create({
		name: "kendoUpload",
		events: [
			"cancel",
			"clear",
			"complete",
			"error",
			"pause",
			"progress",
			"resume",
			"remove",
			"select",
			"success",
			"upload"
		]
	});

	kendoBinding.create({
		name: "kendoRangeSlider",
		watches: [
			{
				name: "selectionStart",
				event: "change"
			},
			{
				name: "selectionEnd",
				event: "change"
			}
		],
		events: ["change", "slide"]
	});

	kendoBinding.create({
		name: "kendoTextBox",
		watches: [
			{
				name: "value",
				event: "change"
			}
		]
	});
})();

(function()
{
	function createInputByType(type, initialValue, attributes, nowrap, disable, events, element, allBindings)
	{
		switch (type)
		{
			case "Disabled":
				return new TF.Input.DisabledBox(initialValue, attributes, disable, events);
			case "Boolean":
				return new TF.Input.BooleanBox(initialValue, attributes, disable, events);
			case "String":
				return new TF.Input.StringBox(initialValue, attributes, disable, undefined, undefined, events);
			case "Email":
				return new TF.Input.EmailBox(initialValue, attributes, disable, events);
			case "ZipCode":
				return new TF.Input.ZipCodeBox(initialValue, attributes, disable, events);
			case "Url":
				return new TF.Input.UrlBox(initialValue, attributes, disable, events);
			case "DateTime":
				return new TF.Input.DateTimeBox(initialValue, attributes, disable, nowrap, events, element);
			case "Date":
				return new TF.Input.DateBox(initialValue, attributes, disable, nowrap, events, element, allBindings);
			case "ExtendedDate":
				return new TF.Input.ExtendedDateBox(initialValue, attributes, disable, nowrap, events, element, allBindings);
			case "Time":
				return new TF.Input.TimeBox(initialValue, attributes, disable, nowrap, events, element);
			case "Integer":
				return new TF.Input.IntegerBox(initialValue, attributes, disable, events);
			case "NaturalNumber":
				return new TF.Input.NaturalNumberBox(initialValue, attributes, disable, events);
			case "Decimal":
				return new TF.Input.DecimalBox(initialValue, attributes, disable, events);
			case "Money":
			case "Number":
				return new TF.Input.NumberBox(initialValue, attributes, disable, events);
			case "Currency":
				return new TF.Input.CurrencyBox(initialValue, attributes, disable, events);
			case "Phone":
				return new TF.Input.PhoneBox(initialValue, attributes, disable, events);
			case "Color":
				return new TF.Input.ColorBox(initialValue, attributes, disable, nowrap, events);
			case "DataList":
				return new TF.Input.DataListBox(initialValue, attributes, disable, nowrap, events);
			case "PhoneExt":
				return new TF.Input.PhoneExtBox(initialValue, attributes, disable, events);
			case "Select":
				return new TF.Input.SelectBox(initialValue, attributes, disable, events);
			case "PhoneExt":
				return new TF.Input.PhoneExtBox(initialValue, attributes, disable, events);
			case "ListMover":
				return new TF.Input.ListMoverBox(initialValue, attributes, disable, nowrap, events);
		}
	}

	/**
	 * customInput now supports pass in observable expression like !$parent.obDatabaseDataModel().gpsenabled()
	 * the updateDisable option flag defines whether you want to bind the !$parent.obDatabaseDataModel().gpsenabled() to its disable status or not,
	 * so it gets updated when the evaluation of the expression changed
	 */
	ko.bindingHandlers.customInput = {
		init: function(element, valueAccessor, allBindings, viewModel, bindingContext)
		{
			var bindingValue = ko.unwrap(valueAccessor());
			var input;
			if (bindingValue.type != undefined)
			{
				input = createInputByType(ko.unwrap(bindingValue.type), bindingValue.value(), bindingValue.attributes, bindingValue.nowrap, bindingValue.disable, bindingValue.events, element, allBindings);
			}
			else
			{
				var type = ko.unwrap(bindingValue.attributes).type;
				delete bindingValue.attributes().type;
				input = createInputByType(type, bindingValue.value(), ko.unwrap(bindingValue.attributes), bindingValue.nowrap, bindingValue.disable, bindingValue.events, element, allBindings);
			}
			ko.utils.domData.set(element, "input", input);
			var $element = input.getElement();
			for (var i = $element.length - 1; i >= 0; i--)
			{
				ko.virtualElements.insertAfter(element, $element[i]);
			}
			input.afterRender();
			if (input.events && input.events.lineAutoFit)
			{
				input.events.lineAutoFit(input);
			}
			if (!ko.isComputed(bindingValue.value))
			{
				input.onValueChange.subscribe(function(e, value)
				{
					bindingValue.value(value);
				});
			}
			return { controlsDescendantBindings: true };
		},

		update: function(element, valueAccessor, allBindings, viewModel, bindingContext)
		{
			var bindingValue = ko.unwrap(valueAccessor());
			var attributes, type, fieldName;
			if (bindingValue.type != undefined)
			{
				type = ko.unwrap(bindingValue.type);
				attributes = bindingValue.attributes;
			}
			else
			{
				fieldName = ko.unwrap(bindingValue.attributes).fieldName;
				type = ko.unwrap(bindingValue.attributes).type;
				attributes = ko.unwrap(bindingValue.attributes);
				delete attributes.type;
			}
			var input = ko.utils.domData.get(element, "input");
			if (bindingValue.type != undefined ? input.getType() == type : input.getFieldName() == fieldName)
			{
				if (bindingValue.disable !== undefined && bindingValue.updateDisable === true)
				{
					input.update(bindingValue.value(), bindingValue.disable);
				}
				else
				{
					input.update(bindingValue.value());
				}
				input.onValueChange.unsubscribeAll();
				if (!ko.isComputed(bindingValue.value))
				{
					input.onValueChange.subscribe(function(e, value)
					{
						var valueString = bindingValue.value();
						if ((value === "" || value === null || value === undefined) && ((valueString === "" || valueString === null || valueString === undefined)))
						{
							return;
						}
						if (valueString !== value)
						{
							bindingValue.value(value);
						}
					});
				}
			}
			else
			{
				input.onValueChange.unsubscribeAll();
				if (!ko.isComputed(bindingValue.value))
				{
					bindingValue.value("");
				}
				if (input.bindingValueChange)
				{
					input.bindingValueChange.dispose();
				}
				input.dispose();
				input = createInputByType(type, "", attributes, bindingValue.errorClassName, bindingValue.disable, bindingValue.events, element, allBindings);
				ko.utils.domData.set(element, "input", input);
				ko.virtualElements.emptyNode(element);
				var $element = input.getElement();
				for (var i = $element.length - 1; i >= 0; i--)
				{
					ko.virtualElements.insertAfter(element, $element[i]);
				}
				input.afterRender();
				if (!ko.isComputed(bindingValue.value))
				{
					input.bindingValueChange = bindingValue.value.subscribe(function(value)
					{
						input.value(value);
					});
					input.onValueChange.subscribe(function(e, value)
					{
						var valueString = bindingValue.value();
						if ((value === "" || value === null || value === undefined) && ((valueString === "" || valueString === null || valueString === undefined)))
						{
							return;
						}
						if (valueString !== value)
						{
							bindingValue.value(value);
						}
					});
				}
			}
			if (input.events && input.events.lineAutoFit)
			{
				input.events.lineAutoFit(input);
			}

			var symbols = bindingValue.symbols;
			if (symbols)
			{
				var text = bindingValue.value();
				input.$element.addClass('typeahead-symbol-text');
				input.$element.parent().find('.typeahead-input-symbol').remove();
				input.$element.after('<div class="typeahead-input-symbol ' + symbols[text] + '"></div>');
			}

			var styles = bindingValue.styles;
			if (styles)
			{
				var text = bindingValue.value();
				input.$element.addClass('typeahead-symbol-text');
				input.$element.parent().find('.typeahead-input-symbol').remove();
				input.$element.after('<div class="typeahead-input-symbol ' + styles[text] + '"></div>');
			}
		}
	};

	ko.virtualElements.allowedBindings.customInput = true;
})();
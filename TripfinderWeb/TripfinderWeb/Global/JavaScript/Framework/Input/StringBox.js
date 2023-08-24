(function()
{
	var namespace = window.createNamespace("TF.Input");
	namespace.StringBox = StringBox;

	function StringBox(initialValue, attributes, disable, noWrap, delayChange, events)
	{
		this.keypress = this.keypress.bind(this);

		namespace.BaseBox.call(this, initialValue, attributes, disable, events);
		this.obRawValue = ko.observable(initialValue);
		this.obRawValue.subscribe(this.rawValueChange, this);
		this.value.subscribe(this.valueChange, this);
		this.delayChange = delayChange;
		this.delayChangeTimer = null;
		this.attributes = attributes;
		this.initialize();
	};

	StringBox.prototype = Object.create(namespace.BaseBox.prototype);

	StringBox.constructor = StringBox;

	StringBox.prototype.type = "String";

	StringBox.prototype.initialize = function()
	{
		var required = "", events = "";
		if (this.attributes && this.attributes[required])
		{
			required = " required ";
		}
		this.eventObject = {};
		for (var i in this.events)
		{
			this.eventObject[i] = this.events[i];
			events += i + ":eventObject." + i + ",";
		}
		var $input = $('<input type="text" ' + required + 'class="form-control" data-tf-input-type=' + this.type + ' autocomplete="new-password" data-bind="value:obRawValue, disable:disable,css:{disabled:disable},event:{keypress:keypress,keyup:keyup,' + events + '}" />');
		this.$input = $input;
		var $element = $input;
		this.applyAttribute($element, this.attributes);
		ko.applyBindings(this, $element[0]);
		this.$element = $element;
	};

	//after render,bind blur event on input element,bind click,mouseenter,mouseleave evnet on li element
	//blur event:change the input text if input element lose fouse.
	//click event:change the input text when the li element clicked.
	StringBox.prototype.afterRender = function()
	{
		if (this.attributes && this.attributes.dataList && this.attributes.dataList.length != 0)
		{
			this.isInPopup = false;
			this.$element.on("blur", function()
			{
				if (!this.isInPopup)
				{
					var selectData = $.grep(this.attributes.dataList, function(n)
					{
						return n.text === this.$element.val();
					}.bind(this));
					if (selectData.length == 0)
					{
						this.value("");
						this.$element.val("");
					}
					else
					{
						if (this.attributes.fieldName == "mail_city")
						{
							this.value(selectData[0].text);
						}
						else
						{
							this.value(selectData[0].value);
						}
						this.$element.val(selectData[0].text);
					}
					this.$element.parent().prev().hide();
				}
			}.bind(this));
			this.$element.parent().prev().find("ul").on("click", 'li', function(e)
			{
				if (this.attributes.fieldName == "mail_city")
				{
					this.value($(e.currentTarget).data("text"));
				}
				else
				{
					this.value($(e.currentTarget).data("value"));
				}
				this.$element.val($(e.currentTarget).data("text"));
				this.$element.parent().prev().hide();
				this.$element.trigger("blur");
			}.bind(this))
				.on("mouseenter", 'li', function(e)
				{
					this.isInPopup = true;
				}.bind(this))
				.on("mouseleave", 'li', function(e)
				{
					this.isInPopup = false;
				}.bind(this));
		}
	}

	StringBox.prototype.keypress = function(viewModel, e)
	{
		if (e.keyCode == 13)
		{
			var rawValue = this.$input.val();
			this.obRawValue(this.convertValueType(rawValue));
		}
		return true;
	};

	StringBox.prototype.keyup = function(viewModel, e)
	{
		if (this.attributes && this.attributes.dataList && this.attributes.dataList.length != 0)
		{
			this._setPopup();
		}
		if (this.delayChange)
		{
			clearTimeout(this.delayChangeTimer);
			this.delayChangeTimer = setTimeout(function()
			{
				var rawValue = this.$input.val();
				this.obRawValue(this.convertValueType(rawValue));
			}.bind(this), 500);
		}
	};

	StringBox.prototype._setPopup = function()
	{
		var value = this.$element.val(), $popup = this.$element.parent().prev(), $ul = this.$element.parent().prev().find("ul");
		$ul.html("");
		for (var i in this.attributes.dataList)
		{
			if (this.attributes.dataList[i].text.toLowerCase().indexOf(value.toLowerCase()) != -1)
			{
				var $option = $('<li tabindex="-1" role="option" class="k-item">' + this.attributes.dataList[i].text + '</li>');
				$option.data("value", this.attributes.dataList[i].value);
				$option.data("text", this.attributes.dataList[i].text);
				$ul.append($option[0]);
			}
		}
		if ($ul.html() == "")
			$ul.append('<div class="text-center text-danger">No results match your search</div>');
		$popup.width(this.$element.parent().width() - 6);
		$popup.show();

	}

	StringBox.prototype.rawValueChange = function(value)
	{
		if (!this.updating)
		{
			this.value(value);
		}
	};

	StringBox.prototype.valueChange = function(value)
	{
		value = this.convertValueType(value);
		if (value !== this.obRawValue())
		{
			this.obRawValue(value);
		}
	};

	StringBox.prototype.convertValueType = function(value)
	{
		switch (this.type)
		{
			case "Integer":
				value = isNaN(parseInt(value)) ? "" : parseInt(value);
				break;
			case "Decimal":
				value = isNaN(parseFloat(value)) ? "" : parseFloat(value);
				break;
			default:
				break;
		}
		return value;
	}

	StringBox.prototype.dispose = function()
	{
		ko.removeNode(this.$element[0]);
		namespace.BaseBox.prototype.dispose.call(this);
	};
})();

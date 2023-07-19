(function()
{
	createNamespace("TF.Input").BaseBox = BaseBox;

	function BaseBox(initialValue, attributes, disable, events)
	{
		this.$element = null;
		this.updating = false;
		if (initialValue)
		{
			this.value = ko.observable(initialValue);
		}
		else
		{
			this.value = ko.observable();
		}
		this.valueSubscribe();
		this.onValueChange = new TF.Events.Event();
		this.attributes = attributes;
		this.events = events;
		this.onClearRequest = new TF.Events.Event();
		this.disable = disable ? disable : ko.observable("");
		if (disable !== undefined && typeof disable === "boolean")
		{
			this.disable = ko.observable(disable);
		}
		if (attributes != null)
			this.fieldName = attributes.fieldName;
	}

	BaseBox.notSpecialKey = function(e)
	{
		var key = e.which || e.keyCode || 0;
		return key != 37 // left
			&& key != 39 // right
			&& key != 35 // end
			&& key != 36 // home
			&& key != 8 // backspace
			&& key != 9 // tab
			&& e.ctrlKey == false
			&& e.altKey == false
			&& (key != 46 || (key == 46 && e.originalEvent.code != "Delete"))
	};

	BaseBox.prototype.type = null;

	BaseBox.prototype.update = function(value)
	{
		this.updating = true;
		this.value(value);
		this.updating = false;
		//pass in the second parameter means that the observable disable status needs to be refreshed.
		if (arguments.length > 1)
		{
			var disable = arguments[1];
			if (typeof disable === "boolean")
			{
				this.disable(disable);
			}
		}
	};

	BaseBox.prototype.getElement = function()
	{
		return this.$element;
	};

	BaseBox.prototype.getType = function()
	{
		return this.type;
	};

	BaseBox.prototype.getFieldName = function()
	{
		return this.fieldName;
	};

	BaseBox.prototype.clearValue = function()
	{
		this.value("");
		this.onClearRequest.notify();
	};

	BaseBox.prototype.getState = function()
	{
		return this.value();
	};

	BaseBox.prototype.applyAttribute = function($el, attributes)
	{
		for (var key in attributes)
		{
			const value = attributes[key];
			if (ko.isObservable(value))
			{
				$el.attr(key, value());
				value.subscribe(function(newKey)
				{
					return (newValue) =>
					{
						$el.attr(newKey, newValue);
					};
				}(key));
			}
			else
			{
				$el.attr(key, value);
			}
		}
	};

	BaseBox.prototype.afterRender = function()
	{

	}

	BaseBox.prototype.valueSubscribe = function()
	{
		this.value.subscribe(function(newValue)
		{
			if (!this.updating)
			{
				this.onValueChange.notify(newValue);
			}
		}, this);
	}

	BaseBox.prototype.dispose = function()
	{
		this.onValueChange.unsubscribeAll();
		this.onClearRequest.unsubscribeAll();
	};
})()

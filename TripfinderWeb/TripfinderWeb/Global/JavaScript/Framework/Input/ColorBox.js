(function()
{
	var namespace = window.createNamespace("TF.Input");
	namespace.ColorBox = ColorBox;

	function ColorBox(initialValue, attributes, disable, noWrap)
	{
		namespace.BaseBox.call(this, initialValue, attributes, disable);
		this._noWrap = noWrap;
		this.obColorValue = ko.observable(this.value());
		this.initialize.call(this);
	}

	ColorBox.prototype = Object.create(namespace.BaseBox.prototype);

	ColorBox.prototype.type = "Color";

	ColorBox.constructor = ColorBox;

	ColorBox.prototype.initialize = function()
	{
		var $input = $('<input ' + this.type + ' type="text" data-tf-input-type="' + this.type + '" data-bind="value:obColorValue" />');
		this.$input = $input;
		var $element = $input;
		this.applyAttribute($element, this.attributes);


		ko.applyBindings(this, $element[0]);
		this.$element = $element;
	};

	ColorBox.prototype.afterRender = function()
	{
		var self = this;
		this.$input.kendoColorPicker(
			{
				buttons: false,
				change: function(e)
				{
					self.value(TF.Color.toLongColorFromHTMLColor(e.value));
				},
				open: function()
				{
					var kendoColorPicker = self.$input.data("kendoColorPicker");
					if (self.$input.closest(".document-dataentry.editparcel").length > 0)
					{
						var palette = self.$input.closest(".document-dataentry.editparcel");
						setTimeout(function()
						{
							var offset = kendoColorPicker.wrapper.offset();
							var $popup = kendoColorPicker._popup.element.parent();
							if (offset.left < $(window).width() / 2)
							{
								$popup.css("left", palette.offset().left);
							} else
							{
								$popup.css("left", palette.offset().left + palette.outerWidth() - $popup.width());
							}
						});
					}
				}
			});
		var colorpicker = this.$input.data("kendoColorPicker");
		if (this.value())
		{
			//the value is not always a number ,need verify here ,such as in edit geo region DE form
			if (this.value().toString().indexOf("#") >= 0)
			{
				colorpicker.value(this.value());
			}
			else
			{
				colorpicker.value(TF.Color.toHTMLColorFromLongColor(this.value()));
			}
		}
		this.value.subscribe(function(value)
		{
			if (value.toString().indexOf("#") >= 0)
			{
				colorpicker.value(value);
			}
			else
			{
				colorpicker.value(TF.Color.toHTMLColorFromLongColor(value));
			}
		}, this);

	};

	ColorBox.prototype.getElement = function()
	{
		if (this._noWrap)
		{
			return this.$element;
		}
		else
		{
			return $("<div>").addClass("input-group colorbox").append(this.$element);
		}
	};

	ColorBox.prototype.dispose = function()
	{
		ko.removeNode(this.$element[0]);
		namespace.BaseBox.prototype.dispose.call(this);
	};
})();

(function()
{
	var namespace = window.createNamespace("TF.Input");
	namespace.DateBox = DateBox;

	function DateBox(initialValue, attributes, disable, noWrap, delayChange)
	{
		namespace.BaseBox.call(this, initialValue, attributes, disable);
		this.delayChange = delayChange;
		this._dateTimePicker = null;
		this.initialize.call(this);
		//this.disableWeekend = disableWeekend;
	};

	DateBox.prototype = Object.create(namespace.BaseBox.prototype);

	DateBox.prototype.type = "Date";

	DateBox.constructor = DateBox;

	DateBox.prototype.formatString = "L";

	DateBox.prototype.pickerIconClass = "k-i-calendar";

	DateBox.prototype.initialize = function()
	{
		var $input = $('<input ' + this.type + ' name="' + this.type + '" type="text" class="datepickerinput" data-tf-input-type="' + this.type + '" data-bind="disable:disable, css:{disabled:disable}" />');
		this.applyAttribute($input, this.attributes);
		var $element = $input;
		ko.applyBindings(this, $element[0]);
		this.$element = $element;
	};

	DateBox.prototype.valueSubscribe = function()
	{
		this.value.subscribe(function(newValue)
		{
			if (!this.updating)
			{
				if (newValue == '')
					newValue = null;
				this.onValueChange.notify(newValue);
			}
		}, this);
	};

	DateBox.prototype.afterRender = function()
	{
		if (this.attributes && this.attributes["disableWeekend"])
		{ //not working for v2015, need v2016
			this.$element.kendoDatePicker(
				{
					disableDates: ["sa", "su"]
				});
		}
		else
		{
			this.$element.kendoDatePicker(
				{
					max: new Date("12/31/9999"),
					min: new Date("1/1/1753"),
					open: function(e)
					{
						this._toggleScroll(false);
						this._toggleScroll(true);
					}.bind(this),
					close: function(e)
					{
						this._toggleScroll(false);
					}.bind(this),
					change: function(e)
					{
						this.dateBoxHelper.dateChange();
					}.bind(this)
				});
		}
		this._dateTimePicker = this.$element.data('kendoDatePicker');
		this.value.subscribe(function(value)
		{
			var datetime = moment.utc(this.value(), [this.formatString, moment.ISO_8601]);
			if (!value || !datetime.isValid())
			{
				this._dateTimePicker.value(null);
			}
			else
			{
				this._dateTimePicker.value(datetime.format());
			}
		}, this);
		this.onClearRequest.subscribe(function(e)
		{
			this._dateTimePicker.value(null);
		}.bind(this));
		if (!this.value())
		{
			this._dateTimePicker.value(null);
		}
		else
		{
			var datetime = moment.utc(this.value(), [this.formatString, moment.ISO_8601]);
			this._dateTimePicker.value(datetime.format());
		}
		this.$element.next("span.k-select").on("click", function(e)
		{
			if (!this.isOpen)
			{
				var $input = $($(e.currentTarget).prev()[0]);
				var $span = $(e.currentTarget);
				var id = $input.attr("aria-activedescendant").split("_")[0];
				var $calendar = $($("#" + id).parents()[1]);

				if ($(e.currentTarget).closest('.set-calander-right-15px').length > 0)
				{
					$calendar[0].style.left = null;
					$calendar.css('right', '15px');
				}
				else
				{
					var leftPlus = Number($calendar.css('left').split('px')[0]) + Number($input.css('width').split('px')[0]) + (Number($span.css('width').split('px')[0]) / 2) - (Number($calendar.css('width').split('px')[0]) / 2);
					if ((leftPlus + $calendar.width()) <= $(window).width())//VIEW-1296 only change left when in the window
					{
						$calendar.css('left', leftPlus + "px");
					}
				}

				this.isOpen = true;
			}
			else
			{
				this.isOpen = false
			}
		}.bind(this));
		this.$element.on("blur", function(e)
		{
			this.isOpen = false;
		}.bind(this));

		this.dateBoxHelper = new TF.DateBoxHelper(this._dateTimePicker, this);
	}

	DateBox.prototype._toggleScroll = function(toggle)
	{
		var method = toggle ? "on" : "off";
		var scrollableParents = this._scrollableParents();
		if (method === "on")
		{
			scrollableParents.map(function(i, item)
			{
				$(item).data("scrollTop", item.scrollTop)
			});
			scrollableParents[method]("scroll.databox", this._resizeProxy.bind(this));
		}
		else
		{
			scrollableParents[method]("scroll.databox");
		}
	}

	DateBox.prototype._scrollableParents = function()
	{
		var that = this;
		return that.$element
			.parentsUntil("body")
			.filter(function(index, element)
			{
				return that._isScrollable(element);
			});
	}

	DateBox.prototype._isScrollable = function(element)
	{
		var overflow = $(element).css("overflow");
		return overflow == "auto" || overflow == "scroll";
	}

	DateBox.prototype._resizeProxy = function(e)
	{
		this._dateTimePicker.dateView.div.data("handler")._hovered = true;
		var $menu = this._dateTimePicker.dateView.div.parent();
		var scrollTop = $(e.currentTarget).data("scrollTop");
		$menu.css(
			{
				top: $menu.offset().top + scrollTop - e.currentTarget.scrollTop
			});
		$(e.currentTarget).data("scrollTop", e.currentTarget.scrollTop);
	}

	DateBox.prototype.dispose = function()
	{
		this._dateTimePicker.destroy();
		ko.removeNode(this.$element[0]);
		namespace.BaseBox.prototype.dispose.call(this);
	}
})();

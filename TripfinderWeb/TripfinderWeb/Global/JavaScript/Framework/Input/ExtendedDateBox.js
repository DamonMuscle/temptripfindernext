(function()
{
	var namespace = window.createNamespace("TF.Input");
	namespace.ExtendedDateBox = ExtendedDateBox;

	function ExtendedDateBox(initialValue, attributes, disable, noWrap, delayChange, element, allBindings)
	{
		namespace.BaseBox.call(this, initialValue, attributes, disable, noWrap);
		this.delayChange = delayChange;
		this._dateTimePicker = null;
		this.allBindings = allBindings;
		this.initialize.call(this);
		this.fastBtnTemplate = null;
	}

	ExtendedDateBox.prototype = Object.create(namespace.BaseBox.prototype);

	ExtendedDateBox.prototype.type = "ExtendedDate";

	ExtendedDateBox.constructor = ExtendedDateBox;

	ExtendedDateBox.prototype.formatString = "L";

	ExtendedDateBox.prototype.pickerIconClass = "k-i-calendar";

	ExtendedDateBox.prototype.initialize = function()
	{
		var $element = $('<input id="origin"' + this.type + ' name="' + this.type + '" type="text" class="datepickerinput" data-tf-input-type="' + this.type + '" data-bind="disable:disable, css:{disabled:disable}" />');
		this.applyAttribute($element, this.attributes);
		ko.applyBindings(this, $element[0]);
		// if need buttons, create extra element and push it as a sibling to the Date element.
		if (this.allBindings().customInput.buttons)
		{
			var $shadowElement = $('<input id="shadow"' + this.type + ' name="' + this.type + '" type="text" class="datepickerinput" data-tf-input-type="' + this.type + '" data-bind="disable:disable, css:{disabled:disable}" />');
			$element.push($shadowElement[0]);
		}
		this.$element = $element;
	};

	ExtendedDateBox.prototype.valueSubscribe = function()
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

	ExtendedDateBox.prototype.afterRender = function()
	{
		var self = this;
		if (this.attributes && this.attributes["disableWeekend"])
		{ // not working for v2015, need v2016
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
					format: 'MM/dd/yyyy',
					open: function(e)
					{
						self.isOpen = true;
						self._toggleScroll(false);
						self._toggleScroll(true);
						var navigate = self.allBindings().customInput.navigate;
						if (navigate)
						{
							var datePicker = this;
							navigate(datePicker);
							datePicker.dateView.calendar._events.navigate = (this.dateView.calendar._events.navigate || []).concat([function()
							{
								navigate(datePicker);
							}]);
						}
					},
					close: function(e)
					{
						self.isOpen = false;
						self._toggleScroll(false);
						if (self.allBindings().customInput.navigate)
						{
							this.dateView.calendar._events.navigate.pop();
						}
					},
					change: function(e)
					{
						if (!moment(this.$element[0].value).isValid())
							this.$element[0].value = this.$element[1].value
						this.dateBoxHelper.dateChange();
					}.bind(this)
				});
		}
		var buttons = this.allBindings().customInput.buttons;
		if (buttons && buttons.length > 0)
		{
			this.fastBtnTemplate = null;
			var template = $('<div class="button-group"></div>')
			var self = this;
			_.each(buttons, function(btn)
			{
				var btnTemp = $('<button><span>' + btn.text + '</span></button>')
				btn.css && btnTemp.addClass(btn.css);
				btn.style && btnTemp.css(btn.style);
				btnTemp.on('click', function(e)
				{
					if ($(e.currentTarget).hasClass('selected'))
						return
					else
					{
						$('.button-group .selected').removeClass('selected')
						$(e.currentTarget).addClass('selected')
						self.value(btn.value);
					}
					btn.calback && btn.calback(e)
				});
				template.append(btnTemp)
			})
			this.fastBtnTemplate = template;
			this.$element.parent().parent().parent().append(template);
		}
		this._dateTimePicker = this.$element.data('kendoDatePicker');
		this.value.subscribe(function(value)
		{
			this.bindText(value)
		}, this);
		this.onClearRequest.subscribe(function(e)
		{
			this._dateTimePicker.value(null);
		}.bind(this));
		this.bindText(this.value())
		this.$element.next("span.k-select").on("click", function(e)
		{
			if (this.isOpen)
			{
				var $input = $(e.currentTarget).prev();
				if ($input.prop("disabled")) return;
				if (!$input.attr("aria-activedescendant")) return;

				var $span = $(e.currentTarget);
				var id = $input.attr("aria-activedescendant").split("_")[0];
				var $calendar = $("#" + id).closest(".k-animation-container");

				if ($(e.currentTarget).closest('.set-calander-right-15px').length > 0)
				{
					$calendar[0].style.left = null;
					$calendar.css('right', '15px');
				}
				else
				{
					var leftPlus = Number($calendar.css('left').split('px')[0]) + Number($input.css('width').split('px')[0]) + (Number($span.css('width').split('px')[0]) / 2) - (Number($calendar.css('width').split('px')[0]) / 2);
					if ((leftPlus + $calendar.width()) <= $(window).width())// VIEW-1296 only change left when in the window
					{
						$calendar.css('left', leftPlus + "px");
					}
				}
			}
		}.bind(this));

		this.dateBoxHelper = new TF.DateBoxHelper(this._dateTimePicker, this);
	};

	/*
	 * @param {string} value the object which will be assiged to different input element
	 *
	 * Exchange value of attribute[name] for Validator
	*/
	ExtendedDateBox.prototype.bindText = function(value)
	{
		var datetime = moment.utc(this.value(), [this.formatString, moment.ISO_8601]);
		// if there is extra element, hide it firstly,
		if ($(this.$element[1]))
		{
			//'form-control' to keep the some apperance
			if (!$(this.$element[1]).parent().parent().hasClass('form-control'))
				!$(this.$element[1]).parent().parent().addClass('form-control')
			this.$element[0].name === "" && (this.$element[0].name = this.$element[1].name);
			this.$element[0].value === "" && (this.$element[0].value = this.$element[1].value)
			this.$element[1].name = "";
			$(this.$element[0]).parent().parent().show();
			$(this.$element[1]).parent().parent().hide();
		}
		if (!value)
		{
			this._dateTimePicker.value(null);
		}
		else if (value != '' && !datetime.isValid())
		{
			//if there is extra element and value is invalid date, display it with real
			if (this.$element[1])
			{
				$(this.$element).val(value);
				this.$element[1].name === "" && (this.$element[1].name = this.$element[0].name);
				this.$element[0].name = "";
				$(this.$element[0]).parent().parent().hide();
				$(this.$element[1]).parent().parent().show();
			} else
			{
				this._dateTimePicker.value(null);
			}
		}
		else
		{
			this._dateTimePicker.value(datetime.format());
		}
	}
	ExtendedDateBox.prototype._toggleScroll = function(toggle)
	{
		var method = toggle ? "on" : "off";
		var scrollableParents = this._scrollableParents();
		if (method === "on")
		{
			scrollableParents.map(function(i, item)
			{
				$(item).data("scrollTop", item.scrollTop);
			});
			scrollableParents[method]("scroll.databox", this._resizeProxy.bind(this));
		}
		else
		{
			scrollableParents[method]("scroll.databox");
		}
	};

	ExtendedDateBox.prototype._scrollableParents = function()
	{
		var that = this;
		return that.$element
			.parentsUntil("body")
			.filter(function(index, element)
			{
				return that._isScrollable(element);
			});
	};

	ExtendedDateBox.prototype._isScrollable = function(element)
	{
		var overflow = $(element).css("overflow");
		return overflow == "auto" || overflow == "scroll";
	};

	ExtendedDateBox.prototype._resizeProxy = function(e)
	{
		this._dateTimePicker.dateView.div.data("handler")._hovered = true;
		var $menu = this._dateTimePicker.dateView.div.parent();
		var scrollTop = $(e.currentTarget).data("scrollTop");
		$menu.css(
			{
				top: $menu.offset().top + scrollTop - e.currentTarget.scrollTop
			});
		$(e.currentTarget).data("scrollTop", e.currentTarget.scrollTop);
	};

	ExtendedDateBox.prototype.dispose = function()
	{
		this._dateTimePicker.destroy();
		ko.removeNode(this.$element[0]);
		//remove if there is extra element
		if (this.$element[1])
		{
			ko.removeNode(this.$element[1]);
		}
		namespace.BaseBox.prototype.dispose.call(this);
	};
})();

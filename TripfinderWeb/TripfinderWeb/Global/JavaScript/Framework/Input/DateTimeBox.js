(function()
{
	var namespace = window.createNamespace("TF.Input");
	namespace.DateTimeBox = DateTimeBox;

	function DateTimeBox(initialValue, attributes, disable, noWrap, delayChange, element)
	{
		this.keypress = this.keypress.bind(this);

		namespace.BaseBox.call(this, initialValue, attributes, disable);
		this._noWrap = noWrap;
		this.delayChange = delayChange;
		this._dateTimePicker = null;
		this.$parent = $(element);
		this.initialize.call(this);

		this.height = 289;
	}

	DateTimeBox.prototype = Object.create(namespace.BaseBox.prototype);

	DateTimeBox.prototype.type = "DateTime";

	DateTimeBox.constructor = DateTimeBox;

	DateTimeBox.prototype.formatString = "L LT";

	DateTimeBox.prototype.pickerIconClass = "k-i-calendar";

	DateTimeBox.prototype.initialize = function()
	{
		this.onClearRequest.subscribe(function(e)
		{
			this._dateTimePicker.date(null);
		}.bind(this));
		this.value.subscribe(function(value)
		{
			var datetime = moment.utc(this.value(), [ this.formatString, moment.ISO_8601 ]);
			if (value == "Empty" || value == 'Not empty' || !value || !datetime.isValid())
			{
				this._dateTimePicker.date(null);
			}
			else
			{
				this._dateTimePicker.date(datetime);
			}
		}, this);
		var $input = $('<input ' + this.type + ' type="text" class="form-control datepickerinput" data-tf-input-type="' + this.type + '" data-bind="disable:disable, css:{disabled:disable},event: {blur: updateValue,keypress:keypress}" />');
		this.applyAttribute($input, this.attributes);
		var $button = $('<div class="input-group-addon glyphicon datepickerbutton"><span unselectable="on" class="k-icon ' + this.pickerIconClass + '">select</span></div>');
		if (this.attributes)
		{
			this.applyAttribute($button, this.attributes.picker);
		}

		if (TF.isPhoneDevice) //VIEW-1252 Date Control is not visible when focus is still set to input
		{
			$button.click(function()
			{
				$(":focus").blur();
			});
		}
		var $element = $input.add($button);

		if (this.$parent.closest(".document-dataentry").length > 0)
		{
			$element.datetimepicker(
				{
					useCurrent: false,
					keepInvalid: true,
					widgetPositioning:
					{
						horizontal: 'left'
					},
					format: this.formatString,
					locale: moment.locale(),
					keyBinds:
					{
						enter: null
					}
				});
		}
		else
		{
			$element.datetimepicker(
				{
					widgetParent: "body",
					useCurrent: false,
					keepInvalid: true,
					widgetPositioning:
					{
						horizontal: 'left'
					},
					format: this.formatString,
					locale: moment.locale(),
					keyBinds:
					{
						enter: null
					}
				});
		}

		this._dateTimePicker = $element.data('DateTimePicker');
		this.value.valueHasMutated();
		ko.applyBindings(this, $element[ 0 ]);
		this.$element = $element;

		var delayTimeOut;
		$element.on('dp.change', function(event)
		{
			clearTimeout(delayTimeOut);
			delayTimeOut = setTimeout(function()
			{
				var value = this.value(),
					dateTime = this._dateTimePicker.date();
				if (dateTime && value !== toISOStringWithoutTimeZone(dateTime))
				{
					this.updateValue(this, event);
				}
			}.bind(this), this.delayChange ? 500 : 0);
		}.bind(this));
		$element.on('dp.show', function(e)
		{
			var widget = $("body>.bootstrap-datetimepicker-overlay>.bootstrap-datetimepicker-widget:last"),
				widgetWidth = widget.width(),
				bodyWidth = $("body").width();
			if (TF.isPhoneDevice)
			{
				var overlay = $("body>.bootstrap-datetimepicker-overlay");
				overlay.on("click", function()
				{
					this._dateTimePicker.hide();
				}.bind(this));
			}

			if (widget.length == 0)
			{
				widget = this.$element.parent().find(".bootstrap-datetimepicker-widget");
				if (widget)
				{
					var modal = this.$element.closest(".modal-dialog");
					if (modal.length > 0)
					{

						widget.css(
							{
								top: this.$element.outerHeight(),
								bottom: 'auto',
								left: $button.closest(".input-group").outerWidth() - $button.outerWidth() / 2 - widget.outerWidth() / 2
							});
					}
					else
					{
						var top = this.$element.outerHeight(), left, right;
						if (($button.offset().top + $button.outerHeight() + this.height + 67) > document.body.offsetHeight)
						{
							top = -this.height;
						}
						if (document.body.offsetWidth - $button[ 0 ].getBoundingClientRect().right > widget.outerWidth() / 2)
						{
							left = $button.closest(".input-group").outerWidth() - $button.outerWidth() / 2 - widget.outerWidth() / 2;
							right = 'auto';
						}
						else
						{
							left = 'auto';
							right = widget.outerWidth() - widget.innerWidth();
						}
						widget.css(
							{
								top: top,
								left: left,
								right: right,
								bottom: 'auto'
							});
					}
				}
			}
			else if (widget && widget.offset())
			{
				widget.css('left', $button.offset().left - widget.outerWidth() / 2 + $button.outerWidth() / 2);
				if (widget.offset().left > bodyWidth - widgetWidth)
				{
					widget.css('left', bodyWidth - widgetWidth - 10);
				}
				else if (widget.offset().left < 5)
				{
					widget.css('left', 10);
				}

				if (widget.offset().top <= 0)
				{
					var top = $(e.currentTarget).offset().top - widget.outerHeight();
					widget.css(
						{
							top: top,
							bottom: "auto"
						});
				}
				else if (widget.offset().top !== $(e.currentTarget).offset().top + $(e.currentTarget).height())
				{
					var top = $(e.currentTarget).offset().top + $(e.currentTarget).height();
					if (top + widget.outerHeight() > $("body").height())
					{
						top = $(e.currentTarget).offset().top - widget.outerHeight();
					}
					widget.css(
						{
							top: top,
							bottom: "auto"
						});
				}
			}
			this._toggleScroll(false);
			this._toggleScroll(true);
			if (TF.isPhoneDevice) //VIEW-1252 Date Control is not visible when focus is still set to input
			{
				if (widget.closest(".modal-dialog").length == 0)
				{
					setTimeout(function()
					{
						var windowHeight = $(window).height();
						var offset = this.$element.offset();
						var overlay = $("body>.bootstrap-datetimepicker-overlay");
						if (overlay.length == 0)
						{
							var top;
							if (document.body.offsetHeight - $button[ 0 ].getBoundingClientRect().bottom > 160)
							{
								top = $button.outerHeight();
							}
							else
							{
								top = -widget.outerHeight();
							}
							widget.css(
								{
									top: top,
									bottom: 'auto'
								});
						}
						else
						{
							if (offset.top + widget.height() * 1.5 >= $(window).height() + $(window).scrollTop() &&
								widget.height() + this.$element.outerHeight() < offset.top)
							{
								//top
								widget.css(
									{
										top: 'auto',
										bottom: windowHeight - this.$element.offset().top
									});
							}
							else
							{
								//bottom
								widget.css(
									{
										top: 'auto',
										bottom: windowHeight - this.$element.offset().top - widget.outerHeight() - this.$element.outerHeight()
									});
							}
						}
					}.bind(this), 100);
				}
				$(window).on("resize.dateTime", function()
				{
					setTimeout(function()
					{
						this._dateTimePicker.hide();
					}.bind(this), 10);
				}.bind(this));
			}

		}.bind(this));

		$element.on('dp.hide', function()
		{
			this._toggleScroll(false);
			$(window).off("resize.dateTime");
		}.bind(this));
	};

	DateTimeBox.prototype.keypress = function(viewModel, e)
	{
		if (e.keyCode == 13)
		{
			setTimeout(function()
			{
				$(viewModel.$element[ 0 ]).blur();
			}.bind(this), 0);
		}
		return true;
	};

	DateTimeBox.prototype.updateValue = function(self, e)
	{
		var text = e ? e.currentTarget.value : '';
		var timePatten = /^([01]?[0-9]):[0-5]?[0-9]$/;

		var dateTime = this._dateTimePicker.date();
		if (!dateTime)
		{
			this.value(null);
			return true;
		}
		if (dateTime.isValid())
		{
			var isTimeColumn = TF.DateTimeBoxHelper.testIsTimeColumn($(e.currentTarget));

			this.value(toISOStringWithoutTimeZone(dateTime));

			if (isTimeColumn)
				e ? (timePatten.test(text) ? null : (e.currentTarget.value = dateTime.format('h:mm') + ' ' + (dateTime.hours() < 12 ? 'AM' : 'PM'))) : null;
			else
				null;

			return true;
		}
		else
		{
			this.value(null);
			return false;
		}
	};

	DateTimeBox.prototype.getElement = function()
	{
		if (this._noWrap)
		{
			return this.$element;
		}
		else
		{
			return $("<div>").addClass("input-group").append(this.$element);
		}
	};

	DateTimeBox.prototype._toggleScroll = function(toggle)
	{
		var method = toggle ? "on" : "off";
		var scrollableParents = this._scrollableParents();
		if (method === "on")
		{
			scrollableParents.map(function(i, item)
			{
				$(item).data("scrollTop", item.scrollTop)
			});
			scrollableParents[ method ]("scroll.datatimebox", this._resizeProxy.bind(this));
			scrollableParents[ method ]("mousedown.datatimebox", this.$element.data("DateTimePicker").hide);
			$(window)[ method ]("scroll.datatimebox", this._resizeProxy.bind(this));
			if (!TF.isPhoneDevice) //VIEW-1252 Date Control is not visible when focus is still set to input
			{
				$(window)[ method ]("resize.datatimebox", this.$element.data("DateTimePicker").hide);
			}
		}
		else
		{
			scrollableParents[ method ]("scroll.datatimebox");
			scrollableParents[ method ]("mousedown.datatimebox");
			$(window)[ method ]("scroll.datatimebox");
			$(window)[ method ]("resize.datatimebox");
		}
	};

	DateTimeBox.prototype._scrollableParents = function()
	{
		var that = this;
		return that.$element
			.parentsUntil("body")
			.filter(function(index, element)
			{
				return that._isScrollable(element);
			});
	};

	DateTimeBox.prototype._isScrollable = function(element)
	{
		var overflow = $(element).css("overflow");
		return overflow == "auto" || overflow == "scroll";
	};

	DateTimeBox.prototype._resizeProxy = function(e)
	{
		var widget = $("body>.bootstrap-datetimepicker-overlay>.bootstrap-datetimepicker-widget:last");
		if (widget && widget.offset())
		{
			var scrollTop = $(e.currentTarget).data("scrollTop");
			widget.css(
				{
					top: widget.offset().top + scrollTop - e.currentTarget.scrollTop,
					height: this.height
				});
			$(e.currentTarget).data("scrollTop", e.currentTarget.scrollTop);
		}
	};

	DateTimeBox.prototype.dispose = function()
	{
		this._dateTimePicker.destroy();
		ko.removeNode(this.$element[ 0 ]);
		namespace.BaseBox.prototype.dispose.call(this);
	};
})();

(function()
{
	var TF = window.createNamespace("TF");

	DateTimeBoxHelper = {
		testIsTimeColumn: function($timeWidgetPopButttonWrapper)
		{
			return $timeWidgetPopButttonWrapper.find('.k-i-clock').length > 0
		}
	}

	TF.DateTimeBoxHelper = DateTimeBoxHelper;

})();
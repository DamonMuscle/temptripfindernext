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
		if (attributes)
		{
			if (attributes.format)
			{
				this.formatString = attributes.format;
			}

			this.minDate = attributes.minDate;
			this.maxDate = attributes.maxDate;
			this.disableWeekend = attributes.disableWeekend;
			this.ignoreReadonly = attributes.ignoreReadonly;
			this.inputEnable = attributes.inputEnable;
			this._exactFormat = attributes.exactFormat;
		}
		this.initialize.call(this);

		this.height = 289;
	}

	DateTimeBox.prototype = Object.create(namespace.BaseBox.prototype);

	DateTimeBox.prototype.type = "DateTime";

	DateTimeBox.constructor = DateTimeBox;

	DateTimeBox.prototype.formatString = "L LT";

	DateTimeBox.prototype.pickerIconClass = "k-i-calendar";

	DateTimeBox.prototype.convertToDateFormat = function(strValue)
	{
		if (strValue.indexOf(".") > 0)
		{
			if (strValue.trim().split(".").length == 3)
			{
				strValue = strValue.replace(/\./g, "-");
			}
			else
			{
				return strValue;
			}
		}
		if (strValue.indexOf("-") > 0)
		{
			var strArr = strValue.trim().split("-");
			if (strArr.length == 3)
			{
				if (strArr[0].length == 4)
				{
					return strArr[1] + "/" + strArr[2] + "/" + strArr[0];
				}
				return strArr[1] + "/" + strArr[0] + "/" + strArr[2];
			}
			return strValue;
		}
		return strValue;
	};

	DateTimeBox.prototype.initialize = function()
	{
		var self = this;
		this.onClearRequest.subscribe(function(e)
		{
			this._dateTimePicker.date(null);
		}.bind(this));
		this.value.subscribe(function(value)
		{
			var datetime = moment.utc(this.value(), [this.formatString, moment.ISO_8601]);
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
			var parentContainer = $('<div style="position:relative;"></div>');
			this.$parent.parent().append(parentContainer);
			$element.datetimepicker(
				{
					widgetParent: parentContainer,
					useCurrent: false,
					keepInvalid: true,
					minDate: this.minDate,
					maxDate: this.maxDate,
					daysOfWeekDisabled: this.disableWeekend ? [0, 6] : [],
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
					ignoreReadonly: this.ignoreReadonly,
					minDate: this.minDate,
					maxDate: this.maxDate,
					daysOfWeekDisabled: this.disableWeekend ? [0, 6] : [],
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
		ko.applyBindings(this, $element[0]);
		this.$element = $element;

		var delayTimeOut;
		$element.on('dp.change', function(event)
		{
			clearTimeout(delayTimeOut);
			delayTimeOut = setTimeout(function()
			{
				if (!event.date) return;
				if (!event.oldDate)
				{
					this.value(this.getValueString(event.date));
					return;
				}
				var oldDate = moment(event.oldDate),
					newDate = moment(event.date);
				//RW-13267 check whether the date changed is result from time changed
				if (this.type == 'DateTime' && oldDate.date() !== newDate.date())	
				{
					var diff = newDate.diff(oldDate, 'minutes');

					if (diff == 1 || diff == -1 || diff == 60 || diff == -60)
					{
						newDate.subtract(diff > 0 ? 1 : -1, 'days');
					}
				}
				if (!newDate.isSame(oldDate, 'minutes'))
				{
					this.value(this.getValueString(newDate));
				}
			}.bind(this), this.delayChange ? 500 : 0);
		}.bind(this));
		$element.on('dp.show', function(e)
		{
			var widgetParent = $(this._dateTimePicker.widgetParent());
			var $modalBody = widgetParent.closest(".modal-body");
			if (TF.isMobileDevice && $modalBody.length)
			{
				$modalBody.bind('mousewheel touchmove', lockScroll);
			}

			var widget = widgetParent.find(".bootstrap-datetimepicker-overlay>.bootstrap-datetimepicker-widget:last"),
				widgetWidth = widget.width(),
				bodyWidth = $("body").width();//widgetParent.width();
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
								top: this.$element.outerHeight(), //+ this.$element.offset().top - modal.offset().top,
								bottom: 'auto',
								left: $button.closest(".input-group").outerWidth() - $button.outerWidth() / 2 - widget.outerWidth() / 2 //$button.offset().left - widget.outerWidth() / 2 + $button.outerWidth() / 2 - modal.offset().left
							});
					}
					else
					{
						var top = this.$element.outerHeight(),
							left = $button.closest(".input-group").outerWidth() - $button.outerWidth() / 2 - widget.outerWidth() / 2,
							widgetOffsetRight;
						if (($button.offset().top + $button.outerHeight() + this.height + 67) > document.body.offsetHeight)
						{
							top = -this.height;
						}
						widget.css(
							{
								top: top,
								left: left
							});

						widgetOffsetRight = widget.offset().left + widget.outerWidth();
						if (widgetOffsetRight > document.body.offsetWidth)
						{
							left -= widgetOffsetRight - document.body.offsetWidth + 5;
							widget.css(
								{
									left: left
								});
						}
					}
					//widget.height(this.height - 10);
				}
			}
			else if (widget && widget.offset())
			{
				var preWightOffset = widget.offset();
				var wightOffsetLeft = $button.offset().left - widget.outerWidth() / 2 + $button.outerWidth() / 2;
				var wightCss = {}, modal;
				if (TF.isMobileDevice)
				{
					if (widget.width() + wightOffsetLeft > window.outerWidth) {
						wightOffsetLeft = window.outerWidth - (widget.width() + 25);
					}

					modal = this.$element.closest(".modal-dialog");
					if (modal.length > 0)
					{
						bodyWidth = modal.width();
					}

					if (modal && modal.length > 0 && wightOffsetLeft > modal.offset().left + bodyWidth - widgetWidth && bodyWidth > widgetWidth)
					{
						wightCss['left'] = modal.offset().left + bodyWidth - widgetWidth - 10;
					}
					else if (modal && modal.length > 0 && wightOffsetLeft < modal.offset().left + 5)
					{
						wightCss['left'] = modal.offset().left;
					} else
					{
						wightCss['left'] = wightOffsetLeft;
					}
				}
				else
				{
					if (wightOffsetLeft > bodyWidth - widgetWidth && bodyWidth > widgetWidth)
					{
						wightCss['left'] = bodyWidth - widgetWidth - 10;
					}
					else if (wightOffsetLeft < 5)
					{
						wightCss['left'] = 10;
					} else
					{
						wightCss['left'] = wightOffsetLeft;
					}

				}

				const widgetToBottom = widget.outerHeight()+this.$element.offset().top +this.$element.outerHeight();
				if (widgetToBottom <= widget.offsetParent()[0].clientHeight + widget.offsetParent().scrollTop())
				{
					widget.css({top: this.$element.offset().top + this.$element.outerHeight()});
				}
				else
				{
					widget.css({top: this.$element.offset().top -  widget.outerHeight()});
				}

				//for form
				if ($(e.currentTarget).closest(".form-container").length > 0) {
					let timeEle = $(e.currentTarget).closest(".input-group.time-question").find("input.form-control"),
					rect = timeEle[0].getBoundingClientRect();
					if (rect.bottom + widget.outerHeight(true) < document.body.clientHeight) {
						widget.css({ top: `${rect.bottom}px`, right: "auto", bottom: "auto", left: `${rect.left}px` })
					} else {
						widget.css({ top: "auto", right: "auto", bottom: `${document.body.offsetHeight - rect.top}px`, left: `${rect.left}px` })
					}
				}
			}
			this._toggleScroll(false);
			this._toggleScroll(true);
			if (TF.isPhoneDevice && modal.length > 0) //VIEW-1252 Date Control is not visible when focus is still set to input
			{
				if (widget.closest(".modal-dialog").length == 0)
				{
					setTimeout(function()
					{
						var windowHeight = $(window).height();
						var offset = this.$element.offset();
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
			var widgetParent = $(this._dateTimePicker.widgetParent());
			var $modalBody = widgetParent.closest(".modal-body");
			if (TF.isMobileDevice && $modalBody.length)
			{
				$modalBody.unbind('mousewheel touchmove', lockScroll);
			}

			this._toggleScroll(false);
			$(window).off("resize.dateTime");
		}.bind(this));

		var reg = this.getInvalidCharacterRegex();
		$element.on("input", function()
		{
			var text = $(this).val();
			if (self.inputEnable && text.indexOf('@') === 0)
			{
				$(this).val(text);
			}
			else
			{
				$(this).val(text.replace(reg, ""));
			}
		});
	};

	DateTimeBox.prototype.getInvalidCharacterRegex = function()
	{
		return /[^0-9A-Za-z|\/|\:| ]/g;
	};

	DateTimeBox.prototype.keypress = function(viewModel, e)
	{
		if (e.keyCode == 13)
		{
			setTimeout(function()
			{
				$(viewModel.$element[0]).blur();
			}.bind(this), 0);
		}
		else
			return true;
	};

	DateTimeBox.prototype.updateValue = function(self, e)
	{
		var text = e ? e.currentTarget.value : '';
		if (this.inputEnable && text.indexOf('@') === 0)
		{
			return true;
		}

		var timePatten = /^([01]?[0-9]):[0-5]?[0-9]$/;

		var dateTime = this.type == "Time" ? this._dateTimePicker.date() : moment(this.convertToDateFormat(text));
		if (!dateTime)
		{
			this.value(null);
			return true;
		}
		if (dateTime.isValid())
		{
			var isTimeColumn = TF.DateTimeBoxHelper.testIsTimeColumn($(e.currentTarget));

			this.value(this.getValueString(dateTime));

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

	DateTimeBox.prototype.getValueString = function(dateTime)
	{
		if(!dateTime || !dateTime.isValid())
		{
			return null;
		}

		if (this._exactFormat)
		{
			return dateTime.format(this.formatString);
		}
		return toISOStringWithoutTimeZone(dateTime);
	}

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
			scrollableParents[method]("scroll.datatimebox", this._resizeProxy.bind(this));
			scrollableParents[method]("mousedown.datatimebox", this.$element.data("DateTimePicker").hide);
			$(window)[method]("scroll.datatimebox", this._resizeProxy.bind(this));
			if (!TF.isPhoneDevice) //VIEW-1252 Date Control is not visible when focus is still set to input
			{
				$(window)[method]("resize.datatimebox", this.$element.data("DateTimePicker").hide);
			}
		}
		else
		{
			scrollableParents[method]("scroll.datatimebox");
			scrollableParents[method]("mousedown.datatimebox");
			$(window)[method]("scroll.datatimebox");
			$(window)[method]("resize.datatimebox");
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
		ko.removeNode(this.$element[0]);
		namespace.BaseBox.prototype.dispose.call(this);
	};

	function lockScroll(e)
	{
		e.preventDefault();
	}
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
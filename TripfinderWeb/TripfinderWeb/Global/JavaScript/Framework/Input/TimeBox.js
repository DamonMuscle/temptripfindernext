// Bootstrap Time Picker
(function()
{
	createNamespace("TF.Input").TimeBox = TimeBox;

	function TimeBox(initialValue, attributes, disable, noWrap, delayChange, element)
	{
		this.showClearIcon = attributes && attributes.showClearIcon;
		this.keypress = this.keypress.bind(this);

		if (attributes && attributes.adjustPopupPosition)
		{
			this.adjustPopupPosition = attributes.adjustPopupPosition;
			delete attributes.adjustPopupPosition;
		}

		TF.Input.BaseBox.call(this, initialValue, attributes, disable);
		this.keepInvalid = true;
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

			this.keepInvalid = attributes.hasOwnProperty("keepInvalid") ? attributes.keepInvalid : true;
			this.minDate = attributes.min;
			this.maxDate = attributes.max;
			this.disableWeekend = attributes.disableWeekend;
			this.inputEnable = attributes.inputEnable;
			this._exactFormat = attributes.exactFormat;
		}
		this.initialize.call(this);

		this.height = 158;
	}

	TimeBox.prototype = Object.create(TF.Input.BaseBox.prototype);

	TimeBox.constructor = TimeBox;

	TimeBox.prototype.getInvalidCharacterRegex = function()
	{
		return /[^0-9A-Za-z|\:| ]/g;
	};

	TimeBox.prototype.type = "Time";

	TimeBox.prototype.formatString = "LT";

	TimeBox.prototype.pickerIconClass = "k-i-clock";

	TimeBox.prototype.convertToDateFormat = function(strValue)
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
					return `${strArr[1]}/${strArr[2]}/${strArr[0]}`;
				}
				return `${strArr[1]}/${strArr[0]}/${strArr[2]}`;
			}
			return strValue;
		}
		return strValue;
	};

	TimeBox.prototype.initialize = function()
	{
		var self = this;
		let $clearX = null;
		if (self.showClearIcon)
		{
			$clearX = $(`<span class="clear-x" title="clear">&times;</span>`);
		}

		this.value.subscribe(function(value)
		{
			var datetime = moment.utc(this.value(), [this.formatString, moment.ISO_8601]);
			if (value == "Empty" || value == 'Not empty' || !value || !datetime.isValid())
			{
				this._dateTimePicker.date(null);
				if (this.showClearIcon)
				{
					$clearX.addClass("empty");
				}
			}
			else
			{
				this._dateTimePicker.date(datetime);
				if (this.showClearIcon)
				{
					$clearX.removeClass("empty");
				}
			}
		}, this);
		var $input = $(`<input ${this.type} type="text" class="form-control datepickerinput" data-tf-input-type="${this.type}"` +
			` data-bind="disable:disable, css:{disabled:disable},event: {blur: updateValue,keypress:keypress}" />`);
		this.applyAttribute($input, this.attributes);
		var $button = $(`<div class="input-group-addon glyphicon datepickerbutton"><span unselectable="on" class="k-icon ${this.pickerIconClass}">select</span></div>`);
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

		var $element = null;
		if (self.showClearIcon)
		{
			$element = $input.add($clearX).add($button);
		}
		else
		{
			$element = $input.add($button);
		}
		var $container = "body";

		if (this.$parent.closest(".document-dataentry").length > 0)
		{
			$container = $('<div style="position:relative;"></div>');
			this.$parent.parent().append($container);
		}

		$element.datetimepicker({
			widgetParent: $container,
			useCurrent: false,
			keepInvalid: this.keepInvalid,
			keepInvalid: true,
			minDate: this.minDate,
			maxDate: this.maxDate,
			ignoreReadonly: true,
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

		this._dateTimePicker = $element.data('DateTimePicker');
		const dateTimePicker = this._dateTimePicker;
		this.value.valueHasMutated();
		ko.applyBindings(this, $element[0]);
		if (self.showClearIcon)
		{
			$clearX.click(function()
			{
				self.value('');
				dateTimePicker.hide();
			});
		}
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
					this.value(this.getTimeString(event.date));
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
					this.value(this.getTimeString(newDate));
				}
				if(TF.isPhoneDevice) {
					this._dateTimePicker.hide();
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
				bodyWidth = widget.offsetParent().width();
			if (TF.isPhoneDevice || tf.isFromWayfinder)
			{
				var overlay = $(".bootstrap-datetimepicker-overlay");
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
				if (this.adjustPopupPosition && typeof this.adjustPopupPosition === "function")
				{
					this.adjustPopupPosition(this.$element, widget);
				}
				else
				{
					var wightCss = {}, modal;
					if (TF.isMobileDevice)
					{
						modal = this.$element.closest(".modal-dialog");
						if (modal.length > 0)
						{
							bodyWidth = modal.width();

							if (modal && wightOffsetLeft > modal.offset().left + bodyWidth - widgetWidth && bodyWidth > widgetWidth)
							{
								wightCss['left'] = modal.offset().left + bodyWidth - widgetWidth - 10;
							}
							else if (modal && wightOffsetLeft < modal.offset().left + 5)
							{
								wightCss['left'] = modal.offset().left;
							} else
							{
								wightCss['left'] = wightOffsetLeft;
							}
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
					var top = 0, currentTargetOffset = $(e.currentTarget).offset();

					if (preWightOffset.top <= 0)
					{
						top = currentTargetOffset.top - widget.outerHeight();
					}
					else if (preWightOffset.top !== currentTargetOffset.top + $(e.currentTarget).height())
					{
						top = currentTargetOffset.top + $(e.currentTarget).height();
						if (top + widget.outerHeight() > widgetParent.height() && widgetParent.height() > 0)
						{
							top = currentTargetOffset.top - widget.outerHeight();
						}
					}

					wightCss['top'] = top;
					wightCss['bottom'] = "auto";

					widget.css(wightCss);
				}
			}
			this._toggleScroll(false);
			this._toggleScroll(true);
			if (TF.isPhoneDevice && !this.adjustPopupPosition) //VIEW-1252 Date Control is not visible when focus is still set to input
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

						const widgetToLeft = offset.left + this.$element.outerWidth() - widget.outerWidth();
						if (widgetToLeft > 0)
						{
							widget.css({ left: widgetToLeft });
						}
						else
						{
							widget.css({ left: offset.left });
						}
					}.bind(this));
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

	TimeBox.prototype.getInvalidCharacterRegex = function()
	{
		return /[^0-9A-Za-z|\/|\:| ]/g;
	};

	TimeBox.prototype.keypress = function(viewModel, e)
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

	TimeBox.prototype.updateValue = function(self, e)
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
			this.value(this.getTimeString(dateTime));

			if (isTimeColumn)
				e ? (timePatten.test(text) ? null : (e.currentTarget.value = `${dateTime.format('h:mm')} ${(dateTime.hours() < 12 ? 'AM' : 'PM')}`)) : null;
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

	TimeBox.prototype.getTimeString = function(dateTime)
	{
		if (this._exactFormat)
		{
			return `${dateTime.format('hh:mm')} ${(dateTime.hours() < 12 ? 'AM' : 'PM')}`;
		}
		return toISOStringWithoutTimeZone(dateTime);
	}

	TimeBox.prototype.getElement = function()
	{
		if (this._noWrap)
		{
			return this.$element;
		}
		else
		{
			const formClass = this.disable() ? "input-group disabled" : "input-group";
			return $("<div>").addClass(formClass).append(this.$element);
		}
	};

	TimeBox.prototype._toggleScroll = function(toggle)
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

	TimeBox.prototype._scrollableParents = function()
	{
		var that = this;
		return that.$element
			.parentsUntil("body")
			.filter(function(index, element)
			{
				return that._isScrollable(element);
			});
	};

	TimeBox.prototype._isScrollable = function(element)
	{
		var overflow = $(element).css("overflow");
		return overflow == "auto" || overflow == "scroll";
	};

	TimeBox.prototype._resizeProxy = function(e)
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

	TimeBox.prototype.dispose = function()
	{
		this._dateTimePicker.destroy();
		ko.removeNode(this.$element[0]);
		TF.Input.BaseBox.prototype.dispose.call(this);
	};

	function lockScroll(e)
	{
		e.preventDefault();
	}
})();


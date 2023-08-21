// Kendo Date Time Picker and Bootstrap Time Picker
(function()
{
	createNamespace("TF.Input").DateTimeBox = DateTimeBox;

	function DateTimeBox(initialValue, attributes, disable, noWrap, delayChange, element)
	{
		this.keypress = this.keypress.bind(this);

		if (attributes && attributes.adjustPopupPosition)
		{
			this.adjustPopupPosition = attributes.adjustPopupPosition;
			delete attributes.adjustPopupPosition;
		}

		this.eventNameSpace = `.datetimebox_${Math.random().toString(36).substring(7)}_${Date.now()}`;
		TF.Input.BaseBox.call(this, initialValue, attributes, disable);
		this._noWrap = noWrap;
		this.delayChange = delayChange;
		this.kendoDateTimePicker = null;
		this.isfocus = false;
		this.$parent = $(element);
		if (attributes)
		{
			if (attributes.format)
			{
				this.formatString = attributes.format;
			}
			if (attributes.pickerFormat)
			{
				this.pickerFormat = attributes.pickerFormat;
			}

			this.minDate = attributes.minDate;
			this.maxDate = attributes.maxDate;
			this.disableWeekend = attributes.disableWeekend;
			this.inputEnable = attributes.inputEnable;
			this.disablePosition = !!attributes.disablePosition;
			let disabled = disable;
			if ($.isFunction(disable))
			{
				disabled = disable();
			}
			this.readonly = !!(attributes.readonly || disabled);
			this.noIcon = !!attributes.noIcon;
			this.position = attributes.position || 'center';

			/**
			 * when no initial value supplied, the default value would be [Today].
			 * So if we want to make it empty, use this attribute
			 */
			if (!initialValue && !!attributes.discardDefaultValue)
			{
				this.value("");
			}
		}
		this.initialize();

		this.height = 289;
	}

	DateTimeBox.prototype = Object.create(TF.Input.BaseBox.prototype);

	DateTimeBox.prototype.type = "DateTime";

	DateTimeBox.prototype.constructor = DateTimeBox;

	DateTimeBox.prototype.formatString = "MM/DD/YYYY hh:mm A";
	DateTimeBox.prototype.pickerFormat = "MM/dd/yyyy hh:mm tt"; // format of kendo datetime picker

	DateTimeBox.prototype.initialize = function()
	{
		var self = this;

		self.value.subscribe(function()
		{
			var datetime = moment(self.value());

			if (!datetime.isValid())
			{
				self.kendoDateTimePicker.value(null);
				if (self.type === "DateTime")
				{
					self.bootstrapTimePicker && self.bootstrapTimePicker.date(null);
				}
				$input.val(null);
			}
			else
			{
				self.kendoDateTimePicker.value(datetime.toDate());
				if (self.type === "DateTime")
				{
					self.bootstrapTimePicker && self.bootstrapTimePicker.date(datetime.toDate());
				}
				$input.val(datetime.format(self.formatString));
			}
		});

		var $input = $(`
			<input ${self.type} type="text" class="form-control datepickerinput" data-tf-input-type="${self.type}"
				data-bind="disable:disable, css:{disabled:disable},event: {keypress:keypress}" />
		`);

		self.applyAttribute($input, self.attributes);
		var $button = $(`<div class="input-group-addon glyphicon datepickerbutton">
							<span unselectable="on" class="k-icon k-i-calendar">select</span>
						</div>`);

		if (self.attributes)
		{
			self.applyAttribute($button, self.attributes.picker);
		}

		var $element = self.noIcon ? $input : $input.add($button);

		$input.kendoDateTimePicker({
			max: self.maxDate,
			min: self.minDate,
			format: self.pickerFormat,
			open: function({ sender })
			{
				self.initializeTimePicker(sender);
				self.isWidgetOpen = true;
				if (typeof self.adjustPopupPosition === "function" || (!self.disablePosition && sender.dateView.div))
				{
					sender.dateView.div.css("left", "-1000px");
				}
				if (!$input.is(':focus') && !TF.isMobileDevice)
				{
					$input.focus();
				}
				$(document).on("mousedown.datetimepickopen touchstart.datetimepickopen", function(e)
				{
					if (self.type === "DateTime")
					{
						if ($(e.target).closest(".k-calendar").length > 0)
						{
							self.keepWidgetOpen = true;
						} else
						{
							self.keepWidgetOpen = false;
						}
					}
				});
				if (tf.isViewfinder && TF.isMobileDevice && self.type === "DateTime" )
				{
					$(document).one("mousedown.datetimepickopen touchstart.datetimepickopen", function (e)
					{
						if ($(e.target).closest(".k-calendar-container").length <= 0)
						{
							self.kendoDateTimePicker.close();
						}
					});
				}

				if (sender && sender.dateView
					&& sender.dateView.calendar
					&& sender.dateView.calendar.element
					&& sender.dateView.calendar.element.css)
				{
					sender.dateView.calendar.element.css("font-size", "14px");
				}

				if (self.type !== "DateTime")
				{
					// for Date, the selected date is not marked.
					// I don't know why.
					setTimeout(function()
					{
						var day = parseInt(moment(self.value()).format("DD"));
						if (!!day)
						{
							var matched = Array.from(sender.dateView.calendar.element.find("td:not(.k-other-month)")).filter(current =>
							{
								return parseInt($(current).text()) == day;
							});

							$(matched[0]).addClass("k-state-selected k-state-focused");
						}
					});
				}

				if (typeof self.adjustPopupPosition === "function")
				{
					self.adjustPopupPosition(sender.element, sender.dateView.calendar.element, sender.dateView.div);
					if (sender.dateView.div)
					{
						sender.dateView.div.css("left", "");
					}
				}
				else if (!self.disablePosition)
				{
					setTimeout(function()
					{
						let target = sender.element,
							calendar = sender.dateView.calendar.element;

						var zindex = Math.max(...Array.from(target.parents()).map(el => parseInt($(el).css("z-index"))).filter(x => !Number.isNaN(x)));

						var position;
						if (target.closest("[data-kendo-role=customizeddatetimepicker]").length)
						{
							// quick filter in grid
							// no need to handle here. It's already handled in grid.
							let rect = target[0].getBoundingClientRect(), $popup;
							if ($input.closest(".k-filtercell[data-kendo-field]").length > 0)
							{
								rect = $input.closest(".k-filtercell[data-kendo-field]")[0].getBoundingClientRect();
							}
							if ($input.attr("aria-activedescendant"))
							{
								let id = $input.attr("aria-activedescendant").split("_")[0];
								$popup = $(`#${id}`).closest(".k-animation-container");
							}
							else if ($input.data("DateTimePicker"))
							{
								$popup = $("body>.bootstrap-datetimepicker-overlay>.bootstrap-datetimepicker-widget:last");
								$popup.css({ margin: 0, padding: 0 })
							}

							if ($popup)
							{
								if ($popup.width() + rect.left > $(window).width())
								{
									$popup.css({ left: $(window).width() - $popup.width() - 1, top: rect.top + rect.height + 1 });
								}
								else
								{
									$popup.css({ left: rect.left, top: rect.top + rect.height + 1 });
								}
							}
							$popup.css({ "z-index": zindex + 5 });
						}
						else
						{
							var rect = target[0].getBoundingClientRect(),
								calendarWidth = calendar.closest(".k-animation-container").width(),
								bodyWidth = $("body").width();

							position = {
								"z-index": zindex + 5,
								top: rect.bottom - 1,
								left: self.position === 'left' ? rect.left : (rect.right + calendarWidth / 2 > bodyWidth ? bodyWidth - calendarWidth - 1 : rect.right - calendarWidth / 2)
							}
						}

						if (position)
						{
							calendar.closest(".k-animation-container").css(position);
						}
						if (sender.dateView.div)
						{
							sender.dateView.div.css("left", "");
						}
					});
				}

				sender.dateView.calendar.element.find(".k-footer a").off().on("click", function()
				{
					if (self.type === "DateTime")
					{
						self.value(`${moment().format("MM/DD/YYYY")} ${moment(moment(self.value()).isValid() ? self.value() : new Date()).format("hh:mm A")}`);
					}
					else
					{
						self.value(`${moment().format("MM/DD/YYYY")}`);
					}
				});
			},
			change: self.handleChange.bind(self),
			close: function(e)
			{
				if (!self.isWidgetOpen) return;

				if (self.keepWidgetOpen && self.type === "DateTime")
				{
					e.preventDefault();
					return;
				}

				self.isWidgetOpen = false;
				self.restoreKendoDatePicker();
				$input.blur();

				if (self.attributes && self.attributes.afterHide && self.type === "DateTime")
				{
					self.attributes.afterHide();
				}

				setTimeout(function()
				{
					$input.change();
				});
			}
		});
		self.kendoDateTimePicker = $input.data('kendoDateTimePicker');

		$input.on(`blur${self.eventNameSpace}`, function({ target })
		{
			if (!$(target).val())
			{
				self.value(null);
			}

			self.kendoDateTimePicker.close();
		});

		$input.on(`change${self.eventNameSpace}`, function({ target })
		{
			var dateTimeVal = moment($(target).val(), self.formatString);
			var isFromQuickFilter = $(target).parent().hasClass("tf-filter");
			if ($(target).val() && !isFromQuickFilter)
			{
				if (dateTimeVal.year() === 0) 
				{
					const currentYear = new Date().getFullYear();
					dateTimeVal.year(currentYear);
				}
				self.value(moment(dateTimeVal).format(self.formatString));
				self.value.valueHasMutated();
			}
		});

		if (!self.readonly) 
		{
			if (self.noIcon)
			{
				$input.off().on(`click${self.eventNameSpace}`, self.toggleWidget.bind(self));
			} else
			{
				$button.off().on(`click${self.eventNameSpace}`, self.toggleWidget.bind(self));
				if (TF.isMobileDevice)
				{
					$button.on('mousedown', function(e)
					{
						if ($input.is(":focus"))
						{
							self.isfocus = true;
						}
					});
				}
			}

		}

		$(window).on(`resize${self.eventNameSpace}`, function()
		{
			if (self && self.kendoDateTimePicker)
			{
				self.kendoDateTimePicker.close();
			}
		});

		// close date time picker on detail view scrolling
		$(".right-container").off(`wheel${self.eventNameSpace}`).on(`wheel${self.eventNameSpace}`, function()
		{
			if (self && self.kendoDateTimePicker)
			{
				self.kendoDateTimePicker.close();
			}
		});

		self.value.valueHasMutated();
		ko.applyBindings(self, $input[0]);
		self.$element = $element;
	};

	DateTimeBox.prototype.handleChange = function()
	{
		var self = this;
		if (!self.isWidgetOpen) return;

		var date = moment(self.kendoDateTimePicker.value()),
			time = self.bootstrapTimePicker && moment(self.bootstrapTimePicker.date());

		if (!date.isValid())
		{
			date = moment();
		}

		if (self.type === "DateTime")
		{
			if (!time || !time.isValid())
			{
				time = moment();
			}
			self.value(`${date.format("MM/DD/YYYY")} ${time.format("hh:mm A")}`);
		}
		else
		{
			self.value(`${date.format("MM/DD/YYYY")}`);
		}
	};

	DateTimeBox.prototype.initializeTimePicker = function(sender)
	{
		var self = this;
		if (self.type !== "DateTime") return;

		if (self.bootstrapTimePicker) return;

		let $kendoDateTimePicker = sender.dateView.calendar.element.closest(".k-calendar-container");

		if (!$kendoDateTimePicker.find("> .time-icon-container").length)
		{
			const $timeiconContainer = $(`<div class="time-icon-container" style="text-align: center;"></div>`);
			$kendoDateTimePicker.append($timeiconContainer);
			$kendoDateTimePicker.append(`<div class="time-picker"></div>`)

			var $timeInput = $(`<input Time type="text" class="form-control datepickerinput" style="display:none;" data-tf-input-type="Time" />`);
			var $timeButton = $(`<span unselectable="on" class="glyphicon glyphicon-time" style="cursor:pointer;color:#D0503C;"></span>`)
			if (TF.productName === 'Viewfinder')
			{
				$timeButton.css('color', '#8E52A1');
			}
			var $el = $timeInput.add($timeButton)

			$timeiconContainer.append($el)

			$el.datetimepicker({
				widgetParent: $kendoDateTimePicker.find(".time-picker"),
				useCurrent: false,
				keepInvalid: true,
				daysOfWeekDisabled: this.disableWeekend ? [0, 6] : [],
				widgetPositioning:
				{
					horizontal: 'left'
				},
				format: "hh:mm A",
				locale: moment.locale(),
				keyBinds: {
					enter: null
				}
			});

			self.bootstrapTimePicker = $el.data("DateTimePicker");
			self.bootstrapTimePicker.date(moment(self.value()).toDate());

			$el.on("dp.show", function()
			{
				function findClosestNoneStaticElement($el)
				{
					return Array.from($el.parents()).reduce(function(acc, current)
					{
						if (acc) return acc;

						return $(current).css("position") !== "static" ? current : null;
					}, null);
				}

				var inputDom = self.$element[0],
					calendarMarginTop = 10,
					position = {
						left: 0,
						top: 0
					};
				$widget = $kendoDateTimePicker.find(".time-picker .bootstrap-datetimepicker-widget");
				let lockFromBottom = false;
				if (inputDom && inputDom.getBoundingClientRect)
				{
					var inputRect = inputDom.getBoundingClientRect();
					var widgetContainerRect = self.kendoDateTimePicker.dateView.div[0].getBoundingClientRect();

					if (!(widgetContainerRect.top > inputRect.top && widgetContainerRect.bottom > inputRect.bottom))
					{
						lockFromBottom = true;
						position = { left: 0, bottom: -($widget.parents(".k-animation-container").outerHeight(true) - $widget.parents(".bootstrap-datetimepicker-overlay").outerHeight(true)) };
					}
				}

				if (!lockFromBottom)
				{
					$kendoDateTimePicker.find(".time-picker .bootstrap-datetimepicker-widget").css({
						width: "100%",
						padding: "0px",
						left: position.left,
						top: position.top
					});
				}
				else 
				{
					$kendoDateTimePicker.find(".time-picker .bootstrap-datetimepicker-widget").css({
						width: "100%",
						padding: "0px",
						left: position.left,
						top: "auto",
						bottom: position.bottom
					});
				}

				self.calendarHeight = self.calendarHeight || $kendoDateTimePicker.find(".k-calendar").height();
				$kendoDateTimePicker.addClass("enhanced-datetimepicker timepicker-selected");
				$kendoDateTimePicker.find(".k-calendar").height(1);

				$widget = $kendoDateTimePicker.find(".time-picker .bootstrap-datetimepicker-widget");
				if (!lockFromBottom) 
				{
					$widget.css({ bottom: "auto" });
				}

				$widget.find(".calendar-icon-container .glyphicon-calendar").off().remove();
				$widget.prepend(`<div class="calendar-icon-container" style="text-align: center;margin: ${calendarMarginTop}px 0px 0px 0px;">
									<span class="glyphicon glyphicon-calendar" style="color:#D0503C; cursor: pointer;"></span>
								</div>`);
				$widget.find(".calendar-icon-container .glyphicon-calendar").on("click", self.restoreKendoDatePicker.bind(self));

				if (TF.productName === 'Viewfinder')
				{
					$widget.find(".calendar-icon-container .glyphicon-calendar").css('color', '#8E52A1');
				}
				self.bootstrapTimePicker.date(moment(self.value()).toDate());
			});

			$el.on("dp.hide", function()
			{
				$kendoDateTimePicker.removeClass("timepicker-selected");
			});

			$el.on("dp.change", self.handleChange.bind(self));
		}
	}

	DateTimeBox.prototype.restoreKendoDatePicker = function()
	{
		var self = this;
		self.bootstrapTimePicker && self.bootstrapTimePicker.hide();
		var $kendoDateTimePicker = self.kendoDateTimePicker.dateView.calendar.element.closest(".k-calendar-container");
		$kendoDateTimePicker.find(".k-calendar").height(self.calendarHeight);
		$kendoDateTimePicker.css({ "border-width": "1px", "box-shadow": "0 2px 2px 0 rgba(0, 0, 0, 0.2)" });
		$kendoDateTimePicker.removeClass("timepicker-selected");
	};

	/**
	 * toggle whole widget
	 */
	DateTimeBox.prototype.toggleWidget = function()
	{
		if (this.kendoDateTimePicker.element.prop('disabled')) // disable the button to open calendar when the widget is disable
		{
			return;
		}

		if (this.isfocus && TF.isMobileDevice)
		{
			this.kendoDateTimePicker.close();
			this.isfocus = false;
			return;
		}
		if (!this.isWidgetOpen)
		{
			this.kendoDateTimePicker.open();
		}
		else
		{
			this.kendoDateTimePicker
				&& this.kendoDateTimePicker.dateView
				&& this.kendoDateTimePicker.dateView.calendar
				&& this.kendoDateTimePicker.dateView.calendar.element.hide();
		}
	};

	DateTimeBox.prototype.getInvalidCharacterRegex = function()
	{
		return /[^0-9A-Za-z|\/|\:| ]/g;
	};

	DateTimeBox.prototype.keypress = function(viewModel, e)
	{
		if (e.keyCode != 13)
		{
			return true;
		}

		setTimeout(function()
		{
			var element = viewModel.$element.eq(0);
			if (element.val())
			{
				element.blur();
			}
		});
	};

	DateTimeBox.prototype.getElement = function()
	{
		if (this._noWrap)
		{
			return this.$element;
		}

		return $("<div>").addClass("input-group").append(this.$element);
	};

	DateTimeBox.prototype.dispose = function()
	{
		$("*").off(this.eventNameSpace);
		$(window).off(this.eventNameSpace);
		this.kendoDateTimePicker.destroy();
		this.bootstrapTimePicker && this.bootstrapTimePicker.destroy();
		ko.removeNode(this.$element[0]);
		TF.Input.BaseBox.prototype.dispose.call(this);
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
(function()
{
	createNamespace("TF.Control.Form").DateTimeQuestion = DateTimeQuestion;

	const STR_DATE_FORMAT = "YYYY-MM-DD";
	const STR_DATE_SHOW_FORMAT = 'M/D/YYYY';
	const STR_TIME_FORMAT = 'HH:mm:ss';
	const STR_TIME_SHOW_FORMAT = 'h:m A';

	function DateTimeQuestion()
	{
		TF.Control.Form.BaseQuestion.apply(this, arguments);
		this.validateOnBlur = true;
	}

	DateTimeQuestion.prototype = Object.create(TF.Control.Form.BaseQuestion.prototype);
	DateTimeQuestion.prototype.constructor = DateTimeQuestion;

	Object.defineProperty(DateTimeQuestion.prototype, 'dirty', {
		get()
		{
			const dt = moment(this.initialValue || '');
			const _initialValue = dt.isValid() ? dt.format("YYYY-MM-DDTHH:mm:ss") : "";
			return _initialValue !== (this.value || '')
		}
	});

	DateTimeQuestion.prototype.initQuestionContent = function()
	{
		const dtContainer = $("<div class='datetime-question-container'></div>");
		this.dateValue = null;
		this.timeValue = null;
		const input = $(`<input class="date-question question" placeholder="Enter your date" />`);
		const popupOption = !TF.isMobileDevice ? {
			origin: "bottom right",
			position: "top center"
		} : {};
		this.datePicker = input.kendoDatePicker({
			popup: popupOption,
			change: () =>
			{
				if (!this.datePicker.value())
				{
					this.dateValue = null;
				}
				else
				{
					this.dateValue = moment(this.datePicker.value()).format('YYYY-MM-DD');
				}
				this.value = this.timeValue ? `${this.dateValue}T${this.timeValue}` : this.dateValue + "T00:00:00";
			},
			open: ({ sender }) =>
			{
				if (TF.isMobileDevice)
				{
					this.adjustDatePopupPosition(sender.element, sender.dateView.calendar.element);
					input.focus();
				}
			},
			close: () =>
			{
				this.validateInternal();
			}
		}).data("kendoDatePicker");
		const $clearX = $(`<span class="clear-x empty" title="clear">&times;</span>`);
		this.$clearX = $clearX;
		input.after($clearX);
		$clearX.click(() =>
		{
			this.dateValue = null;
			input.val('');
			this.value = this.timeValue;
		});
		if (this.field.value)
		{
			this.datePicker.value(this.field.value)
			this.dateValue = moment(this.datePicker.value()).format('YYYY-MM-DD');
		}

		input.on("focusout", ev =>
		{
			if (!this.field.readonly)
			{
				const dateText = input.val().trim();
				const dateValue = new moment(dateText, STR_DATE_SHOW_FORMAT, true);
				if (!dateValue.isValid())
				{
					this.value = this.timeValue;
					this.dateValue = null;
					input.val('');
					return;
				}
				this.dateValue = dateValue.format('YYYY-MM-DD');
				this.value = this.field.value = this.timeValue ? `${this.dateValue}T${this.timeValue}` : this.dateValue + "T00:00:00";
				input.val(dateText);
				this.validateInternal();
			}
		});

		if (this.field.readonly)
		{
			this.datePicker.readonly();
			input.attr("readonly", true);
		}

		// time 
		const timeContainer = $("<div></div>");
		const timebox = new TF.Input.TimeBox(null, {
			class: 'form-control', ignoreReadonly: true, showClearIcon: !this.field.readonly,
			tabindex: '4', adjustPopupPosition: this.adjustTimePopupPosition, keepInvalid: false
		}, undefined, undefined, $('<div></div>'));
		const timeboxEle = timebox.getElement();
		timebox.value(null);
		const $timeInputBox = timebox.$element.first();
		$timeInputBox.attr("placeholder", `Enter your time`);
		if (TF.isMobileDevice)
		{
			timebox._dateTimePicker.widgetPositioning({ horizontal: 'right' });
		}

		timebox.onValueChange.subscribe((ev, newvalue) =>
		{
			if (newvalue && newvalue !== "Invalid date")
			{
				const newTimeValue = moment(newvalue);
				this.timeValue = newTimeValue.format(STR_TIME_FORMAT);
				$timeInputBox.val(newTimeValue.format(STR_TIME_SHOW_FORMAT));
				this.value = this.dateValue ? `${this.dateValue}T${this.timeValue}` : this.timeValue;
			}
			else
			{
				if (!newvalue)
				{
					this.timeValue = "";
					this.value = `${this.dateValue}T00:00:00`;
				}

				this.validateInternal();
			}
		});
		$timeInputBox
			.css("background-color", "#fff").css("color", "#333").css("cursor", "text");
		timebox.$element.filter(".datepickerbutton").click(ev =>
		{
			if (!this.field.readonly)
			{
				timebox._dateTimePicker.toggle();
			}
		});

		timebox.$element.on('dp.hide', () =>
		{
			this.validateInternal();
		});

		timebox.$element.on('dp.show', (sender) =>
		{
			if (TF.isMobileDevice)
			{
				timebox._dateTimePicker.widgetPositioning({ horizontal: 'right' });
				var widgetParent = $(timebox._dateTimePicker.widgetParent());
				var widget = widgetParent.find(".bootstrap-datetimepicker-overlay>.bootstrap-datetimepicker-widget:last");
				this.adjustTimePopupPosition($(sender.target), widget);
			}
		});

		timeboxEle.addClass("time-question");
		if (this.field.value)
		{
			const time = moment(this.field.value).format('HH:mm:ss')
			timebox.value(time);
		}
		if (this.field.readonly)
		{
			timebox.$element.off("click");
			timeboxEle.addClass("disabled");
			$timeInputBox.attr("readonly", true);
		}
		this.datePicker.wrapper.css("width", "50%");
		timeContainer.css("width", "50%");
		dtContainer.append(this.datePicker.wrapper);
		timeContainer.append(timeboxEle);
		dtContainer.append(timeContainer);
		return dtContainer;
	}

	DateTimeQuestion.prototype.valueChanged = function()
	{
		if (this.dateValue && this.dateValue !== "Invalid date")
		{
			this.$clearX.removeClass("empty");
		} else
		{
			this.$clearX.addClass("empty");
		}
	}

	DateTimeQuestion.prototype.getValidateResult = function()
	{
		let result = '';
		if (this.isRequired)
		{
			if (this.dateValue === null || this.dateValue === '' ||
				this.timeValue === null || this.timeValue === '')
			{
				result = 'Answer is required.';
			}
		}
		else
		{
			if (this.dateValue && !this.timeValue)
			{
				result = 'Time is required.';
			}
			else if (!this.dateValue && this.timeValue)
			{
				result = 'Date is required.';
			}
		}

		if (this.dateValue === 'Invalid date')
		{
			result = `Invalid date`;
		}
		else if (this.timeValue === 'Invalid date')
		{
			result = `Invalid time`;
		}

		return result;
	}

	DateTimeQuestion.prototype.getValidateResult = function()
	{
		let result = '';
		if (this.isRequired)
		{
			if (this.dateValue == null || this.dateValue == '' ||
				this.timeValue == null || this.timeValue == '')
			{
				result = 'Answer is required.';
			}
		} else
		{
			if (this.dateValue !== null && this.timeValue == null)
			{
				result = 'Time is required.';
			}
			if (this.dateValue == null && this.timeValue !== null)
			{
				result = 'Date is required.';
			}
		}
		return result;
	}

	DateTimeQuestion.prototype.adjustDatePopupPosition = function(senderElement, calendarViewElement)
	{
		TF.Control.QuestionHelper.adjustDatePopupPosition(senderElement, calendarViewElement);
	};

	DateTimeQuestion.prototype.adjustTimePopupPosition = function($senderElement, $timerElement)
	{
		TF.Control.QuestionHelper.adjustTimerPopupPosition($senderElement, $timerElement);
	}
})();

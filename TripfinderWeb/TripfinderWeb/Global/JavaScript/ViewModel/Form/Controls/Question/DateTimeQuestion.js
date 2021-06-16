(function()
{
	createNamespace("TF.Control.Form").DateTimeQuestion = DateTimeQuestion;

	function DateTimeQuestion()
	{
		TF.Control.Form.BaseQuestion.apply(this, arguments);
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
		let dtContainer = $("<div class='datetime-question-container'></div>");
		this.dateValue = null;
		this.timeValue = null;
		let input = $(`<input class="date-question question" />`);
		this.datePicker = input.kendoDatePicker({
			change: () =>
			{
				this.dateValue = moment(this.datePicker.value()).format('YYYY-MM-DD');
				this.value = this.timeValue ? this.dateValue + "T" + this.timeValue : this.dateValue + "T00:00:00";
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
		input.attr("readonly", true);
		if (this.field.value)
		{
			this.datePicker.value(this.field.value)
			this.dateValue = moment(this.datePicker.value()).format('YYYY-MM-DD');
		}
		if (!this.field.readonly)
		{
			input.click(ev =>
			{
				this.datePicker.dateView.toggle();
			});
		}
		if (this.field.readonly)
		{
			this.datePicker.readonly();
		}

		// time 
		let timeContainer = $("<div></div>");
		let timebox = new TF.Input.TimeBox(null, { class: 'form-control', ignoreReadonly: true, tabindex: '4', adjustPopupPosition: this.adjustTimePopupPosition }, undefined, undefined, $('<div></div>'));
		let timeboxEle = timebox.getElement();
		timebox.value(null);

		if (TF.isMobileDevice)
		{
			timebox._dateTimePicker.widgetPositioning({ horizontal: 'right' });
		}

		timebox.onValueChange.subscribe((ev, newvalue) =>
		{
			this.timeValue = moment(newvalue).format('HH:mm:ss');
			this.value = this.dateValue ? this.dateValue + "T" + this.timeValue : this.timeValue;
		});
		timebox.$element.first()
			.attr("readonly", true).css("background-color", "#fff").css("color", "#333").css("cursor", "text")
			.click(ev =>
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

		timeboxEle.addClass("time-question");
		if (this.field.value)
		{
			let time = moment(this.field.value).format('HH:mm:ss')
			timebox.value(time);
		}
		if (this.field.readonly)
		{
			timebox.$element.off("click");
			timeboxEle.addClass("disabled");
		}
		this.datePicker.wrapper.css("width", "50%");
		timeContainer.css("width", "50%");
		dtContainer.append(this.datePicker.wrapper);
		timeContainer.append(timeboxEle);
		dtContainer.append(timeContainer);
		return dtContainer;
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
		let timeInteval = TF.isMobileDevice ? 200 : 0;
		setTimeout(function()
		{
			var zindex = Math.max(...Array.from(senderElement.parents()).map(el => parseInt($(el).css("z-index"))).filter(x => !Number.isNaN(x)));
			var rect = senderElement[0].getBoundingClientRect(),
				calendarWidth = calendarViewElement.closest(".k-animation-container").width(),
				calendarHeight = calendarViewElement.closest(".k-animation-container").height(),
				bodyWidth = $("body").width();

			let isPopupOnTop = rect.bottom + 1 + calendarHeight > document.body.clientHeight;
			// adjust calendar popup layer position: popup from associated textbox top if not enouch height in the bottom area, otherwise popup from the bottom
			const popupTop = isPopupOnTop ? rect.top - calendarHeight : rect.bottom - 1;
			calendarViewElement.closest(".k-animation-container").css({
				"z-index": zindex + 1,
				top: popupTop + 1,
				left: rect.left + calendarWidth < bodyWidth ? rect.left : bodyWidth - calendarWidth
			});
		}, timeInteval);
	};
})();

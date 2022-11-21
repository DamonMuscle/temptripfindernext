(function()
{
	createNamespace("TF.Control.Form").TimeQuestion = TimeQuestion;

	const STR_TIME_FORMAT = 'HH:mm:ss';
	const STR_TIME_SHOW_FORMAT = 'h:m A';

	function TimeQuestion()
	{
		TF.Control.Form.BaseQuestion.apply(this, arguments);
	}

	TimeQuestion.prototype = Object.create(TF.Control.Form.BaseQuestion.prototype);
	TimeQuestion.prototype.constructor = TimeQuestion;

	TimeQuestion.prototype.initQuestionContent = function()
	{
		const timebox = new TF.Input.TimeBox(null, { class: 'form-control', ignoreReadonly: true, showClearIcon: !this.field.readonly,
			tabindex: '4', adjustPopupPosition: this.adjustPopupPosition }, undefined, undefined, $('<div></div>'));
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
				const timeValue = moment(newvalue);
				this.value = timeValue.format(STR_TIME_FORMAT);
				$timeInputBox.val(timeValue.format(STR_TIME_SHOW_FORMAT));
			}
			else
			{
				if (!newvalue)
				{
					this.value = "";
				}

				this.validateInternal();
			}
		});
		$timeInputBox
			.click(ev => 
			{
				if (!this.value)
				{
					const now = new moment();
					$timeInputBox.val(now.format(STR_TIME_SHOW_FORMAT));
					this.value = now.format(STR_TIME_FORMAT);
					timebox.value(this.value);
				}
			})
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

		if (this.field.value)
		{
			this.value = this.field.value;
			timebox.value(this.value);
		}

		const timeEle = timebox.getElement();
		if (this.field.readonly) 
		{
			timebox.$element.off("click");
			timeEle.addClass("disabled");
			$timeInputBox.attr("readonly", true);
		}
		timeEle.addClass("time-question");
		return timeEle;
	}

	TimeQuestion.prototype.initEvents = function () {
		if (!TF.isMobileDevice) {
			this.bindValidateValueEvents();
		}
	}

	TimeQuestion.prototype.adjustPopupPosition = function($senderElement, $timerElement)
	{
		TF.Control.QuestionHelper.adjustTimerPopupPosition($senderElement, $timerElement);
	};
})();

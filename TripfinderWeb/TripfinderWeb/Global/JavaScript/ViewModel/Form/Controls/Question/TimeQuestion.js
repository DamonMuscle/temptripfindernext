(function()
{
	createNamespace("TF.Control.Form").TimeQuestion = TimeQuestion;

	function TimeQuestion()
	{
		TF.Control.Form.BaseQuestion.apply(this, arguments);
	}

	TimeQuestion.prototype = Object.create(TF.Control.Form.BaseQuestion.prototype);
	TimeQuestion.prototype.constructor = TimeQuestion;

	TimeQuestion.prototype.initQuestionContent = function()
	{
		/*
		{type:'Time',value:obDefaultValue,attributes:{class:'form-control',tabindex:'4'}}
		*/
		let timebox = new TF.Input.TimeBox(null, { class: 'form-control', ignoreReadonly: true, tabindex: '4' }, undefined, undefined, undefined, $('<div></div>'));
		timebox.value(null);
		timebox.onValueChange.subscribe((ev, newvalue) =>
		{
			this.value = moment(newvalue).format('HH:mm:ss');
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

		if (this.field.value) 
		{
			this.value = this.field.value;
			timebox.value(this.value);
		}

		let timeEle = timebox.getElement();
		if (this.field.readonly) 
		{
			timebox.$element.off("click");
			timeEle.addClass("disabled");
		}
		timeEle.addClass("time-question");
		return timeEle;
	}

	TimeQuestion.prototype.adjustPopupPosition = function($senderElement, $timerElement) 
	{

		let rect = $senderElement.first()[0].getBoundingClientRect();
		if (rect.bottom + $timerElement.outerHeight(true) < document.body.clientHeight)
		{
			$timerElement.css({ top: `${rect.bottom}px`, right: "auto", bottom: "auto", left: `${rect.left}px` })

		}
		else
		{
			$timerElement.css({ top: "auto", right: "auto", bottom: `${document.body.offsetHeight - $senderElement.first()[0].getBoundingClientRect().top}px`, left: `${rect.left}px` })
		}
	};
})();

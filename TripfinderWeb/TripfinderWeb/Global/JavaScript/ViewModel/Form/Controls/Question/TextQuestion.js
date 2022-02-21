(function ()
{
	createNamespace("TF.Control.Form").TextQuestion = TextQuestion;

	function TextQuestion()
	{
		TF.Control.Form.BaseQuestion.apply(this, arguments);
	}

	TextQuestion.prototype = Object.create(TF.Control.Form.BaseQuestion.prototype);
	TextQuestion.prototype.constructor = TextQuestion;

	TextQuestion.prototype.initQuestionContent = function ()
	{

		let input = $(`<textarea class="text-question question" type="text" rows="1" maxlength="${this.field.editType.maxLength}" placeholder="Enter your answer" /><small style="position: absolute;top: -17px;right: 0px;display:none">${(this.field.value || "").length}/${this.field.editType.maxLength}</small>`);
		$(input[0]).on('change', ev =>
		{
			this.value = ev.target.value;
		}).keypress(ev => 
		{
			if (ev.keyCode === 13)
			{
				ev.preventDefault();
			}
		})

		if (!this.field.readonly)
		{
			$(input[0]).keyup(ev =>
			{
				if (TF.isMobileDevice || isIpad())
				{
					ev.target.style.height = 'auto';
					ev.target.style.height = ev.target.scrollHeight + 'px';
				}
			}).on('input', ev =>
			{
				$(input[1]).html(`${ev.target.value.length}/${this.field.editType.maxLength}`);
				this.value = ev.target.value;
			}).focus(() =>
			{
				$(input[1]).show();
			}).blur(() =>
			{
				$(input[1]).hide();
			});
		}

		if (this.field.value) 
		{
			this.value = this.field.value;
			input.val(this.field.value)
		}

		if (this.field.readonly) 
		{
			input.attr("readonly", "readonly")
		}
		return input;
	}

	TextQuestion.prototype.getValidateInputs = function ()
	{
		return this.element.find('textarea');
	}

})();

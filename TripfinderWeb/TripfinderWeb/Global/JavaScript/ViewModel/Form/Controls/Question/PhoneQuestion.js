(function ()
{
	createNamespace("TF.Control.Form").PhoneQuestion = PhoneQuestion;
	function PhoneQuestion()
	{
		TF.Control.Form.BaseQuestion.apply(this, arguments);
	}

	PhoneQuestion.prototype = Object.create(TF.Control.Form.BaseQuestion.prototype);
	PhoneQuestion.prototype.constructor = PhoneQuestion;

	PhoneQuestion.prototype.initQuestionContent = function ()
	{
		let formatValue = !!this.field.readonly ? tf.dataFormatHelper.phoneFormatter(this.field.value) : this.field.value;
		const phonebox = new TF.Input.PhoneBox(formatValue || "", { readonly: !!this.field.readonly, maxlength: 18, placeholder: "Enter your phone number" });
		phonebox.$input.attr("type", "tel");
		this.phonebox = phonebox;
		phonebox.onValueChange.subscribe((ev, newvalue) =>
		{
			this.value = newvalue;
		});

		if (this.field.value) 
		{
			this.value = this.field.value;
		}

		phonebox.getElement().addClass("telphone-question");
		return phonebox.getElement();
	}

	PhoneQuestion.prototype.getValidateResult = function ()
	{
		if (this.phonebox.getElement().is(':focus'))
		{
			//do not validate when input is focused to prevent from validating error when typing.
			return '';
		}
		let result = '';
		if (this.field.Required && !this.value)
		{
			result = 'Answer is required.';
		}
		if (this.value && ((typeof this.value !== "string") || (this.value.indexOf("_") >= 0) || !tf.dataFormatHelper.isValidPhoneNumber(this.value)))
		{
			if (result)
			{
				result += ";";
			}
			result += "Invalid phone number.";
		}

		return result;
	};
})();

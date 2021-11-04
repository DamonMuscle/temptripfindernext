(function()
{
	createNamespace("TF.Control.Form").PhoneQuestion = PhoneQuestion;

	function PhoneQuestion()
	{
		TF.Control.Form.BaseQuestion.apply(this, arguments);
	}

	PhoneQuestion.prototype = Object.create(TF.Control.Form.BaseQuestion.prototype);
	PhoneQuestion.prototype.constructor = PhoneQuestion;

	PhoneQuestion.prototype.initQuestionContent = function()
	{
		const input = $(`<input class="phone-question question" type="tel" placeholder="Enter your phone number"/>`);
		this.maskedInput = input.kendoMaskedTextBox({
			mask: '0000000000000',
			change: () =>
			{
				if (this.maskedInput.element[0].value.length > 13)
				{
					return;
				}
				this.value = this.maskedInput.value().replaceAll("_", "");
				if (this.value.length === 10)
				{
					this.maskedInput.element[0].value = `(${this.value.substr(0, 3)})${this.value.substr(3, 3)}-${this.value.substring(6)}`;
				}
				else if (this.value.length > 10)
				{
					if (tf.dataFormatHelper.isValidPhoneNumber(this.value))
					{
						this.maskedInput.element[0].value = tf.dataFormatHelper.phoneFormatter(this.value);
					}
				}
			}
		}).data('kendoMaskedTextBox');
		input.keyup(ev =>
		{
			this.value = ev.target.value.replace(/_/g, '');
		});

		if (this.field.readonly)
		{
			input.attr("readonly", "readonly")
			this.maskedInput.readonly();
		}
		input.val(tf.dataFormatHelper.phoneFormatter(this.field.value));
		this._value = this.field.value;//this._value: different from this.value, will not trigger validation
		return this.maskedInput.wrapper;
	}

	PhoneQuestion.prototype.getValidateResult = function()
	{
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

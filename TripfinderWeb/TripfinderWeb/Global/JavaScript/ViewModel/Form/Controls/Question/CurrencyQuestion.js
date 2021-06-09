(function()
{
	createNamespace("TF.Control.Form").CurrencyQuestion = CurrencyQuestion;

	function CurrencyQuestion()
	{
		TF.Control.Form.BaseQuestion.apply(this, arguments);
	}

	CurrencyQuestion.prototype = Object.create(TF.Control.Form.BaseQuestion.prototype);
	CurrencyQuestion.prototype.constructor = CurrencyQuestion;

	CurrencyQuestion.prototype.initQuestionContent = function()
	{
		const field = this.field;
		const $inputContainer = $(`<div class="currency-question">
		<span class="currency-symbol">${this.field.currencySymbol || "$"}</span>
		<input type="number" class="question" step="any" />
		</div>`);

		const $input = $inputContainer.find("input");
		$input.keypress(ev => 
		{
			var keyCode = ev.which || ev.keyCode || 0;
			if (
				(keyCode != ".".charCodeAt(0) || $(ev.target).val().indexOf('.') !== -1)
				&& (keyCode != "-".charCodeAt(0))
				&& (keyCode < "0".charCodeAt(0) || keyCode > "9".charCodeAt(0))
				&& !(keyCode == 37 && ev.key != "%")
				&& !(keyCode == 39 && ev.key != "'")
				&& keyCode !== 9)
			{
				ev.preventDefault();
				ev.stopPropagation();
				return;
			}

		}).keyup(ev =>
		{
			const unSafedNumber = (ev.target.value || '').split('.');
			if (unSafedNumber[0].length > field.editType.maxIntegerLength ||
				(unSafedNumber.length === 2 && unSafedNumber[1].length > field.editType.maxDecimalLength))
			{
				const newValue = [];
				newValue[0] = unSafedNumber[0].substring(0, field.editType.maxIntegerLength);
				unSafedNumber.length === 2 && (newValue[1] = unSafedNumber[1].substring(0, field.editType.maxDecimalLength))
				ev.target.value = newValue.join('.');
			}

			if (ev.target.value == "" && $(ev.target).data("oldValue") != "")
			{
				ev.target.value = "";
			}
			this.value = ev.target.value;
			$(ev.target).data("oldValue", ev.target.value);
		}).blur(ev =>
		{
			/* 
			 * follow line maybe looks weird, for input[type=number], if we type "--345.45" which it is invalid number,
			 * the event.target.value will got empty string but the invalid number still show on input box
			 */
			if (ev.target.value == "")
			{
				ev.target.value = "";
			}
		}).change(ev =>
		{
			this.value = ev.target.value;
		});

		if (this.field.value) 
		{
			this.value = this.field.value;
			$input.val(this.field.value)
		}

		if (this.field.readonly) 
		{
			$input.attr("readonly", "readonly")
		}

		return $inputContainer;
	}
})();

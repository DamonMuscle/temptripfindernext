(function ()
{
	const DEFAULT_DECIMALS = 2;
	createNamespace("TF.Control.Form").CurrencyQuestion = CurrencyQuestion;

	function CurrencyQuestion()
	{
		TF.Control.Form.BaseQuestion.apply(this, arguments);
	}

	CurrencyQuestion.prototype = Object.create(TF.Control.Form.BaseQuestion.prototype);
	CurrencyQuestion.prototype.constructor = CurrencyQuestion;

	CurrencyQuestion.prototype.getValidateInputs = function ()
	{
		return this.element.find('input:not(.k-formatted-value)');
	}

	CurrencyQuestion.prototype._getNumericOption = function (input)
	{
		const numericOption = {
			change: (e) =>
			{
				this.value = this.numericInput.value();
			},
			spin: (e) =>
			{
				let flootValue = Math.floor(this.numericInput.value());
				if (flootValue < 0)
				{
					flootValue = flootValue * -1;
					if (flootValue.toString().length > 10)
					{
						this.numericInput.value(this.numericInput.value() + 1);
						input.val(this.numericInput.value());
					}
					else
					{
						this.value = flootValue;
					}
				} else
				{
					if (flootValue.toString().length > 10)
					{
						this.numericInput.value(this.numericInput.value() - 1);
						input.val(this.numericInput.value());
					}
					else
					{
						this.value = flootValue;
					}
				}
			}
		};

		numericOption.decimals = DEFAULT_DECIMALS;
		numericOption.format = "c";

		const decimals = this.field.editType.maxIntegerLength;
		if (decimals !== DEFAULT_DECIMALS)
		{
			numericOption.restrictDecimals = true;
			numericOption.decimals = decimals;
			numericOption.format = "c" + decimals.toString();
		}

		var currCulture = kendo.culture();
		currCulture.numberFormat.currency.symbol = this.field.currencySymbol || '$';
		currCulture.numberFormat.currency.pattern[0] = "$-n";
		numericOption.currCulture = currCulture;

		return numericOption;
	}

	CurrencyQuestion.prototype.initQuestionContent = function ()
	{
		var input = $(`<input class="number-question question" placeholder="Enter your answer"/>`);
		const numericOption = this._getNumericOption(input);

		this.numericInput = input.kendoNumericTextBox(numericOption).data("kendoNumericTextBox");
		this.previousValue = null;
		input.attr("type", "number");
		input.attr("step", "any");

		input.keydown((e) =>
		{
			const flootValue = Math.floor(input.val());
			if (Math.abs(flootValue).toString().length > 10)
			{
				e.preventDefault();
				return false;
			}
			this.previousValue = input.val();
			return undefined;
		});
		input.keyup(() =>
		{
			if (input.val() === '')
			{
				this.value = '';
				return;
			}
			let flootValue = Math.floor(input.val());
			if (flootValue < 0)
			{
				flootValue = flootValue * -1;
			}
			if (flootValue.toString().length > 10)
			{
				input.val(this.previousValue);
			}
			else
			{
				this.value = flootValue;
			}
		});

		if (this.field.value)
		{
			this.value = this.field.value;
			this.numericInput.value(this.field.value);
		}

		if (this.field.readonly)
		{
			this.numericInput.readonly();
			this.numericInput.wrapper.find("input[type=text]").off("focus");

		}
		return this.numericInput.wrapper;
	}
})();

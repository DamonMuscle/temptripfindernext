(function()
{
	createNamespace("TF.Control.Form").NumberQuestion = NumberQuestion;

	function NumberQuestion()
	{
		TF.Control.Form.BaseQuestion.apply(this, arguments);
	}

	NumberQuestion.prototype = Object.create(TF.Control.Form.BaseQuestion.prototype);
	NumberQuestion.prototype.constructor = NumberQuestion;
	
	NumberQuestion.prototype.getValidateInputs = function()
	{
		return this.element.find('input:not(.k-formatted-value)');
	}


	NumberQuestion.prototype.initQuestionContent = function()
	{
		let defVal = this.field.DefaultValue;

		let input = $(`<input class="number-question question" placeholder="Enter your answer"/>`);
		const numericOption = {
			change: (e) =>
			{
				this.value = this.numericInput.value();
			},
			spin: (e) => {
				let flootValue = Math.floor(this.numericInput.value());
				if (flootValue < 0) {
					flootValue = flootValue * -1;
					if (flootValue.toString().length > 10) {
						this.numericInput.value(this.numericInput.value() + 1);
						input.val(this.numericInput.value());
					}
					else
					{
						this.value = flootValue;
					}
				} else {
					if (flootValue.toString().length > 10) {
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

		if (this.field.FieldOptions.NumberPrecision) 
		{
			numericOption.decimals = this.field.FieldOptions.NumberPrecision;
			numericOption.restrictDecimals = true;
			numericOption.format = "N" + this.field.FieldOptions.NumberPrecision.toString();
		}
		else
		{
			numericOption.format = "";
			numericOption.decimals = 2;
		}

		this.numericInput = input.kendoNumericTextBox(numericOption).data("kendoNumericTextBox");
		this.previousValue = null;
		input.attr("type", "number");
		input.attr("step", "any");

		input.keydown((e) => {
			let flootValue = Math.floor(input.val());
			if (Math.abs(flootValue).toString().length > 10) {
				e.preventDefault();
				return false;
			}
			this.previousValue = input.val();
		});
		input.keyup(() => {
			if(input.val() == '')
			{
				this.value = '';
				return;
			}
			let flootValue = Math.floor(input.val());
			if (flootValue < 0) {
				flootValue = flootValue * -1;
			}
			if (flootValue.toString().length > 10) {
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
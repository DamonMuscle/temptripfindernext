(function()
{
	createNamespace("TF.Control.Form").DateQuestion = DateQuestion;

	function DateQuestion()
	{
		TF.Control.Form.BaseQuestion.apply(this, arguments);
	}

	DateQuestion.prototype = Object.create(TF.Control.Form.BaseQuestion.prototype);
	DateQuestion.prototype.constructor = DateQuestion;


	Object.defineProperty(DateQuestion.prototype, 'dirty', {
		get()
		{
			const dtInitialValue = moment(this.initialValue || '');
			const _initialValue = dtInitialValue.isValid() ? dtInitialValue.format("YYYY-MM-DDT00:00:00") : "";
			const dtCurrentValue = moment(this.value || '');
			const _currentValue = dtCurrentValue.isValid() ? dtCurrentValue.format("YYYY-MM-DDT00:00:00") : "";

			return _initialValue !== _currentValue;
		}
	});

	DateQuestion.prototype.initQuestionContent = function()
	{
		let input = $(`<input class="date-question question" />`);

		this.datePicker = input.kendoDatePicker({
			change: () =>
			{
				this.value = moment(this.datePicker.value()).format('YYYY-MM-DDT00:00:00');
			},
			close: () =>
			{
				this.validateInternal();
			}
		}).data("kendoDatePicker");
		input.attr("readonly", true);
		if (!this.field.readonly) 
		{
			input.click(ev =>
			{
				this.datePicker.dateView.toggle();
			});
		}

		if (this.field.value) 
		{
			this.value = this.field.value;
			this.datePicker.value(this.field.value)
		}

		if (this.field.readonly) 
		{
			this.datePicker.readonly();
		}

		return this.datePicker.wrapper;
	}
})();

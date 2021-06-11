(function()
{
	createNamespace("TF.Control.Form").BooleanQuestion = BooleanQuestion;

	function BooleanQuestion()
	{
		TF.Control.Form.BaseQuestion.apply(this, arguments);
	}

	BooleanQuestion.prototype = Object.create(TF.Control.Form.BaseQuestion.prototype);
	BooleanQuestion.prototype.constructor = BooleanQuestion;

	Object.defineProperty(BooleanQuestion.prototype, 'dirty', {
		get()
		{
			const _intialValue = this.initialValue === undefined ? null : this.initialValue;
			const _value = this.value === undefined ? null : this.value;
			return _intialValue !== _value;
		}
	});

	BooleanQuestion.prototype.setInitialValue = function()
	{
		this.initialValue = this.field.value;
	}

	BooleanQuestion.prototype.initQuestionContent = function()
	{
		let field = this.field,
			defVal = field.DefaultValue;

		let options = $(`
			<div class="boolean-question question">
				<div class="boolean-question-option">
					<label for="${field.Guid}_true">
						<input type="radio" id="${field.Guid}_true" name="${field.Guid}" value="1" />
						${field.positiveLabel}
					</label>
				</div>
				<div class="boolean-question-option">
					<label for="${field.Guid}_false">
						<input type="radio" id="${field.Guid}_false" name="${field.Guid}" value="0" />
						${field.negativeLabel}
					</label>
				</div>
			</div>
			`);

		options.find('.boolean-question-option input').on('change', () =>
		{
			this.value = !!parseInt(options.find(".boolean-question-option input:checked").val());
		});

		if (field.value !== undefined && field.value !== null)
		{
			this.value = field.value;
			options.find(`#${field.Guid}_${field.value}`).prop("checked", true);
		}
		if (field.readonly) 
		{
			options.find("input[type=radio]").attr("disabled", "disabled")
		}

		return options;
	}

})();

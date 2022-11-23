(function()
{
	createNamespace("TF.Control.Form").DateQuestion = DateQuestion;

	const STR_DATE_FORMAT = "YYYY-MM-DDT00:00:00";
	const STR_DATE_SHOW_FORMAT = 'M/D/YYYY';

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
			const _initialValue = dtInitialValue.isValid() ? dtInitialValue.format(STR_DATE_FORMAT) : "";
			const dtCurrentValue = moment(this.value || '');
			const _currentValue = dtCurrentValue.isValid() ? dtCurrentValue.format(STR_DATE_FORMAT) : "";

			return _initialValue !== _currentValue;
		}
	});

	DateQuestion.prototype.initQuestionContent = function()
	{
		const input = $(`<input class="date-question question" placeholder="Enter your date" />`);
		const $clearX = $(`<span class="clear-x empty" title="clear">&times;</span>`);
		this.$clearX = $clearX;

		const popupOption = !TF.isMobileDevice ? {
			origin: "bottom right",
			position: "top center"
		} : {};
		this.datePicker = input.kendoDatePicker({
			popup: popupOption,
			change: () =>
			{
				this.value = moment(this.datePicker.value()).format(STR_DATE_FORMAT);
			},
			close: () =>
			{
				this.validateInternal();
			}
		}).data("kendoDatePicker");

		input.after($clearX);
		$clearX.click(() =>
		{
			input.val('');
			this.value = null;
		});

		input.on("focusout", ev =>{
			if (!this.field.readonly)
			{
				const dateText = input.val();
				const dateValue = new moment(dateText, STR_DATE_SHOW_FORMAT, true);
				this.value = this.field.value = dateValue.format(STR_DATE_FORMAT);
				this.validateInternal();
			}
		});

		if (this.field.value)
		{
			this.value = this.field.value;
			this.datePicker.value(this.field.value)
		}

		if (this.field.readonly)
		{
			this.datePicker.readonly();
			$clearX.hide();
			input.attr("readonly", true);
		}

		return this.datePicker.wrapper;
	}

	DateQuestion.prototype.getValidateResult = function()
	{
		let result = '';
		if (this.isRequired)
		{
			if (this.value === null || this.value === '')
			{
				result = 'Answer is required.';
			}
			else
			{
				if (this.value === 'Invalid date')
				{
					result = `Invalid date`;
				}
			}
		}
		return result;
	}

	DateQuestion.prototype.valueChanged = function()
	{
		if (this.hasValue())
		{
			this.$clearX.removeClass("empty");
		} else
		{
			this.$clearX.addClass("empty");
		}
	}

	DateQuestion.prototype.hasValue = function()
	{
		return this.value && this.value !== "Invalid date";
	}
})();

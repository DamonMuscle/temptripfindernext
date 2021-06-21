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
	let defVal = this.field.DefaultValue;

	let input = $(`<input class="phone-question question" type="tel" placeholder="Enter your phone number"/>`);
	this.maskedInput = input.kendoMaskedTextBox({
	    mask: '0000000000',
	    change: () => {
		if (this.maskedInput.element[0].value.length > 10) {
		    return;
		}
		this.value = this.maskedInput.value();
		if (this.value.length === 10) {
		    this.maskedInput.element[0].value = "(" + this.value.substr(0, 3) + ")" + this.value.substr(3, 3) + "-" + this.value.substring(6);
		}
	    }
	}).data('kendoMaskedTextBox');
	input.keyup(ev => {
	    this.value = ev.target.value.replace(/_/g, '');
	})
	return this.maskedInput.wrapper;
	}

	PhoneQuestion.prototype.getValidateResult = function()
	{
	let result = '';
	if (this.field.Required && !this.value) {
	    result = 'Answer is required.';
	}
	if (this.value && ((typeof this.value !== "string") || (this.value.indexOf("_") >= 0))) {
	    if (result) {
		result += ";";
	    }
	    result += "Invalid phone number.";
	}

	return result;
	};
})();

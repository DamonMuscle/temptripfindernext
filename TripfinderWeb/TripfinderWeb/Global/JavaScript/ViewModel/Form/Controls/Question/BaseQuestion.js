(function()
{
	createNamespace("TF.Control.Form").BaseQuestion = BaseQuestion;

	function BaseQuestion(field)
	{
		this.field = field;
		this.elem = null;
		this._value = null;
		this.initElement();
		this.initEvents();
	}
	BaseQuestion.prototype = Object.create(TF.Control.Form.BaseQuestion.prototype);
	BaseQuestion.prototype.constructor = BaseQuestion;

	Object.defineProperty(BaseQuestion.prototype, 'element', {
		get() { return this.elem; },
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(BaseQuestion.prototype, 'isRequired', {
		get() { return this.field.Required; },
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(BaseQuestion.prototype, 'value', {
		get() { return this._value; },
		set(val)
		{
			this._value = val;
			this.validateInternal();
			this.valueChanged();
		},
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(BaseQuestion.prototype, 'dirty', {
		get() { return (this.initialValue || '') !== (this.value || '') }
	});

	BaseQuestion.prototype.valueChanged = function()
	{

	}

	BaseQuestion.prototype.initEvents = function()
	{
		this.bindValidateValueEvents();
	}

	BaseQuestion.prototype.bindValidateValueEvents = function()
	{
		let inputs = this.getValidateInputs();
		inputs.blur(() =>
		{
			this.validateInternal();
		});
	}

	BaseQuestion.prototype.getValidateInputs = function()
	{
		return this.element.find('input');
	}


	BaseQuestion.prototype.hasValue = function()
	{
		return this.value != null && this.value != '';
	}


	BaseQuestion.prototype.initElement = function()
	{
		let self = this, field = this.field;

		this.elem = $(`<div class="form-question">
			<div class="question-title">
				${field.Name}
			</div>
			<div class="question-content ${!!field.readonly ? "readonly" : ""}"></div>
			<span class="invalid-message"></span>
		</div>`);
		this.elem.find('.question-content').append(this.initQuestionContent());
		this.setInitialValue();
		setTimeout(function()
		{
			if (self.ratingSlider)
			{
				self.ratingSlider.refresh();
			}
		}, 200);
	}

	BaseQuestion.prototype.setInitialValue = function()
	{
		this.initialValue = this.field.value || null;
	}

	BaseQuestion.prototype.initQuestionContent = function()
	{
		return $(`<span>TYPE: ${this.field.questionType}</span>`);
	}

	BaseQuestion.prototype.validate = function()
	{
		let validResult = this.validateInternal();
		if (validResult === true)
		{
			return Promise.resolve(true);
		}
		else
		{
			return Promise.reject(validResult);
		}
	}

	BaseQuestion.prototype.getValidateResult = function()
	{
		let result = '';
		if (this.isRequired && (this.value == null || this.value === ''))
		{
			result = 'Answer is required.';
		}
		return result;
	}

	BaseQuestion.prototype.validateInternal = function()
	{
		this.element.removeClass('invalid');
		if (this.field.readonly)
		{
			return true;
		}
		let result = this.getValidateResult();
		if (result.length > 0)
		{
			this.element.addClass('invalid');
			this.element.find('.invalid-message').html(result);
			return result;
		}
		return true;
	}

})();

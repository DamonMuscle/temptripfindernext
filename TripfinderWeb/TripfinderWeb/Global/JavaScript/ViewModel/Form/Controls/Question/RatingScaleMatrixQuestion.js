(function()
{
	createNamespace("TF.Control.Form").RatingScaleMatrixQuestion = RatingScaleMatrixQuestion;

	function RatingScaleMatrixQuestion()
	{
		TF.Control.Form.BaseQuestion.apply(this, arguments);
	}
	
	RatingScaleMatrixQuestion.prototype = Object.create(TF.Control.Form.BaseQuestion.prototype);
	RatingScaleMatrixQuestion.prototype.constructor = RatingScaleMatrixQuestion;

	RatingScaleMatrixQuestion.prototype.initQuestionContent = function () {
		let field = this.field, fieldOptions = field.FieldOptions,
			min = field.startScale,
			max = fieldOptions.Scale,
			leftSideRatingLabel = fieldOptions.LeftSideRatingLabel,
			rightSideRatingLabel = fieldOptions.RightSideRatingLabel;
	 
		let wrapper = $(`<div class="rating-scale-matrix-question question"></div>`);
		let ratingScaleMatrix = new TF.Control.Form.RatingScaleMatrix({
			min: min,
			max: max,
			step: field.step,
			fieldOptions: fieldOptions,
			leftLabel: leftSideRatingLabel,
			rightLabel: rightSideRatingLabel,
			value: this.field.value,
			change: () =>
			{
				this.value = this.formatValue(ratingScaleMatrix.value);
			}
		});
		wrapper.append(ratingScaleMatrix.element);
		this.ratingScaleMatrix = ratingScaleMatrix;
		if (this.field.value) {
			this.value = this.field.value;
		}
		if (this.field.readonly) {
			wrapper.addClass("readonly");
			wrapper.find(`.tf-rating .tf-rating-item .tf-rating-value`).attr("disabled", "disabled");
			wrapper.find(".tf-rating .tf-rating-item .tf-rating-label").css("cursor", "default");
		}
		return wrapper;
	}

	RatingScaleMatrixQuestion.prototype.refresh = function (value)
	{
		if (this.ratingScaleMatrix)
		{
			this.ratingScaleMatrix.updateMatrixWidth();
		}
	}

	RatingScaleMatrixQuestion.prototype.getValidateResult = function()
	{
		let result = '',
			matrixItems = this.field.FieldOptions.UDFPickListOptions ?
				this.field.FieldOptions.UDFPickListOptions.map(item => { return item.PickList }) : [];

		if (this.isRequired && (this.value == null || this.value === '' || this.value.length !== matrixItems.length))
		{
			result = 'Answer is required.';
		}
		return result;
	}

	// TODO: maybe need to change value format
	RatingScaleMatrixQuestion.prototype.formatValue = function (value)
	{
		let matrixItems = this.field.FieldOptions.UDFPickListOptions ?
			this.field.FieldOptions.UDFPickListOptions.map(item => { return item.PickList }) : [];
		let valueStr = '', valueArr = [];
		matrixItems.forEach(key =>
		{
			if (value[key])
			{
				valueStr = key + ": " + value[key];
				valueArr.push(valueStr);
			}
		});
		return valueArr;
	}
})();

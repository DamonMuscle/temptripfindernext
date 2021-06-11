(function()
{
	createNamespace("TF.Control.Form").RatingQuestion = RatingQuestion;

	function RatingQuestion()
	{
		TF.Control.Form.BaseQuestion.apply(this, arguments);
	}

	RatingQuestion.prototype = Object.create(TF.Control.Form.BaseQuestion.prototype);
	RatingQuestion.prototype.constructor = RatingQuestion;

	RatingQuestion.prototype.initQuestionContent = function()
	{
		let field = this.field, fieldOptions = field.FieldOptions,
			min = field.startScale,
			max = fieldOptions.Scale,
			leftSideRatingLabel = fieldOptions.LeftSideRatingLabel,
			rightSideRatingLabel = fieldOptions.RightSideRatingLabel;

		let wrapper = $(`<div class="rating-question question"></div>`);
		let rating = new TF.Control.Form.Rating({
			min: min,
			max: max,
			step: field.step,
			leftLabel: leftSideRatingLabel,
			rightLabel: rightSideRatingLabel,
			change: () =>
			{
				this.value = rating.value;
			}
		});
		wrapper.append(rating.element);

		if (this.field.value) 
		{
			wrapper.find(`.tf-rating .tf-rating-item .tf-rating-value[value=${this.field.value}]`).prop("checked", true).parents(".tf-rating-item").addClass("tf-rating-item-selected");
			this.value = this.field.value;
		}

		if (this.field.readonly) 
		{
			wrapper.addClass("readonly");
			wrapper.find(`.tf-rating .tf-rating-item .tf-rating-value`).attr("disabled", "disabled");
			wrapper.find(".tf-rating .tf-rating-item .tf-rating-label").css("cursor", "default");
		}

		return wrapper;
	}
})();

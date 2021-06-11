(function()
{
	createNamespace("TF.Control.Form").MemoQuestion = MemoQuestion;

	function MemoQuestion()
	{
		TF.Control.Form.BaseQuestion.apply(this, arguments);
	}

	MemoQuestion.prototype = Object.create(TF.Control.Form.BaseQuestion.prototype);
	MemoQuestion.prototype.constructor = MemoQuestion;

	MemoQuestion.prototype.initQuestionContent = function()
	{
		let memoTextArea = $(`<textarea class="memo-question question" placeholder="Enter your answer"></textarea>`);
		memoTextArea.on('change', () =>
		{
			this.value = memoTextArea.val();
		}).keyup(ev => {
			if (TF.isMobileDevice || isIpad()) {
				ev.target.style.height = 'auto';
				ev.target.style.height = ev.target.scrollHeight + 2 + 'px';
			}
			this.value = memoTextArea.val();
		});

		if (this.field.value) 
		{
			this.value = this.field.value;
			memoTextArea.val(this.field.value);
		}

		if (this.field.readonly) 
		{
			memoTextArea.attr("readonly", "readonly");
		}
		return memoTextArea;
	}
	
	MemoQuestion.prototype.getValidateInputs = function()
	{
		return this.element.find('textarea');
	}
})();

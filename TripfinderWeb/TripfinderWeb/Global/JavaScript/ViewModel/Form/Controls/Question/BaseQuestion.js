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
		//placeholder
	}

	BaseQuestion.prototype.initEvents = function()
	{
		this.bindValidateValueEvents();
	}

	BaseQuestion.prototype.bindValidateValueEvents = function()
	{
		const inputs = this.getValidateInputs();
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
		return this.value != null && this.value !== '';
	}


	BaseQuestion.prototype.initElement = function()
	{
		const self = this, field = this.field;

		this.elem = $(`<div class="form-question">
			<div class="question-title">
				${field.Name}
				<span class="title-close-warn-msg"></span>
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
		const validResult = this.validateInternal();
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
		const result = this.getValidateResult();
		if (result.length > 0)
		{
			this.element.addClass('invalid');
			this.element.find('.invalid-message').html(result);
			return false;
		}
		return true;
	}

	BaseQuestion.prototype.dispose = function()
	{
		/* it should override dispose method in specific question if needed */
	}

})();

(function()
{
	createNamespace("TF.Control").QuestionHelper = QuestionHelper;

	function QuestionHelper()
	{
	}

	QuestionHelper.adjustTimerPopupPosition = function($senderElement, $timerElement)
	{
		let adjustFun = function()
		{
			let rect = $senderElement.first()[0].getBoundingClientRect();

			let timeBtnRight = $senderElement.last()[0].getBoundingClientRect().right;
			let timeCtrlWidth = $timerElement.outerWidth();
			let halfTimeCtrlWidth = timeCtrlWidth / 2;

			let cssOptions = {};
			if (rect.bottom + $timerElement.outerHeight(true) < document.body.clientHeight)
			{
				cssOptions = { top: `${rect.bottom}px`, right: "auto", bottom: "auto" };
			}
			else
			{
				cssOptions = { top: "auto", right: "auto", bottom: `${document.body.offsetHeight - $senderElement.first()[0].getBoundingClientRect().top}px` };
			};

			if (!TF.isMobileDevice)
			{
				const htmlWidth = document.body.parentNode.clientWidth;
				let leftPosition = (timeBtnRight + halfTimeCtrlWidth > htmlWidth) ?
					htmlWidth - timeCtrlWidth :
					timeBtnRight - halfTimeCtrlWidth;

				$.extend(cssOptions, { left: `${leftPosition}px` });
			}

			$timerElement.css(cssOptions);
		}

		if (TF.isMobileDevice && TF.isIOS && TF.getIOSVersion[0] === 11)
		{
			setTimeout(function()
			{
				adjustFun();
			}, 200);
		} else
		{
			adjustFun();
		}
	}

	QuestionHelper.adjustDatePopupPosition = function(senderElement, calendarViewElement)
	{
		let timeInteval = TF.isMobileDevice ? 200 : 0;
		setTimeout(function()
		{
			var zindex = Math.max(...Array.from(senderElement.parents()).map(el => parseInt($(el).css("z-index"))).filter(x => !Number.isNaN(x)));
			var rect = senderElement[0].getBoundingClientRect(),
				calendarWidth = calendarViewElement.closest(".k-animation-container").width(),
				calendarHeight = calendarViewElement.closest(".k-animation-container").height(),
				bodyWidth = $("body").width();

			let isPopupOnTop = rect.bottom + 1 + calendarHeight > document.body.clientHeight;
			// adjust calendar popup layer position: popup from associated textbox top if not enouch height in the bottom area, otherwise popup from the bottom
			const popupTop = isPopupOnTop ? rect.top - calendarHeight : rect.bottom - 1;
			calendarViewElement.closest(".k-animation-container").css({
				"z-index": zindex + 1,
				top: popupTop + 1,
				left: rect.left + calendarWidth < bodyWidth ? rect.left : bodyWidth - calendarWidth
			});
		}, timeInteval);
	};

	QuestionHelper.formatQuestionName = function (name)
	{
		if (!name) return "";
		return name.trim().replace(/(?:^(?:&nbsp;)+)|(?:(?:&nbsp;)+$)/g, '');
	}
})();



(function()
{
	createNamespace("TF.Control.Form").SignatureBlockQuestion = SignatureBlock;

	function SignatureBlock(field)
	{
		TF.Control.Form.BaseQuestion.apply(this, arguments);
		this.field = field;
		this.isFullPage = false;
		this.field.readonly = !!field.readonly;
		if (this.field.readonly)
		{
			this.elem.addClass('disabled');
		}
		if (field.value)
		{
			this.field.value = field.value;
			this.value = field.value;
		}
	}

	SignatureBlock.prototype = Object.create(TF.Control.Form.BaseQuestion.prototype);
	SignatureBlock.prototype.constructor = SignatureBlock;


	Object.defineProperty(SignatureBlock.prototype, 'value', {
		get() { return this._value; },
		set(val)
		{
			this._value = val;
			this.togglePlaceHolder(this._value);
		},
		enumerable: false,
		configurable: false
	});

	SignatureBlock.prototype._getESignContainer = function(field)
	{
		return $(`
		<div class="e-sign-wrapper">
				<div class="form-question e-sign-element">
					<div class="question-title">
						<div class="title">
							${field.Name}
						</div>
						<span class="modal-title">Signature</span> 
						<button type="button" title="Close" class="e-sign-close-button btn-close">
							<div class="action close"></div>
						</button>
					</div>
					<div class="question-content e-sign-content">
						<canvas id="${field.Guid}" class="e-sign"></canvas>
						<div class="e-sign-cover-layer">
							<div class="place-holder">Tap here to sign:</div>
						</div>
					</div>
					<div class="e-sign-action-bar">
						<button class="k-button e-sign-save-button" role="button">Save</button>
						<button class="k-button e-sign-clear-button" role="button">Clear</button>
						<button class="k-button e-sign-undo-button" role="button">Undo</button>
					</div>
					<span class="invalid-message"></span>
				</div>
			</div>
		`);
	}

	SignatureBlock.prototype.initElement = function()
	{
		const field = this.field;
		const elem = this._getESignContainer(field);

		this._initSignaturePad(elem, field);

		elem.on('click', '.e-sign-cover-layer', e =>
		{
			const $ele = $(e.target);
			$ele.closest(".e-sign-wrapper").removeClass('invalid');
			!this.field.readonly && this.enterFullPage();
		});

		const questionContent = elem.find(".form-question");
		questionContent.on('click', '.e-sign-close-button', e =>
		{
			this.exitFullPage();
		});

		questionContent.on('click', '.k-button', e =>
		{
			const $ele = $(e.target);
			if ($ele.hasClass('e-sign-clear-button'))
			{
				this.signaturePad.clear();
				this.value = null;
				this.toggleSaveButton();
			}
			else if ($ele.hasClass('e-sign-undo-button'))
			{
				var data = this.signaturePad.toData();
				if (data)
				{
					data.pop(); // remove the last dot or line
					this.signaturePad.fromData(data);
					this.toggleSaveButton();
				}
			}
			else if ($ele.hasClass('e-sign-save-button'))
			{
				if (this.signaturePad.isEmpty())
				{
					this.value = null;
				}
				else
				{
					this.value = this.signaturePad.toDataURL();
				}
				this.exitFullPage();
			}
		});

		setTimeout(() =>
		{
			if (this.field && this.field.value)
			{
				this.signaturePad.fromDataURL(this.field.value);
			}
		}, 300);

		this._bindResizeCanvasEvent();

		this.elem = elem;
	}

	SignatureBlock.prototype._initSignaturePad = function(elem, field)
	{
		const $canvas = elem.find(`#${field.Guid}`);
		if ($canvas.length > 0)
		{
			const canvas = $canvas[0];
			setTimeout(() =>
			{
				this.canvas = canvas;
				this.exitFullPage();
				this.signaturePad = new SignaturePad(canvas, {
					onEnd: () =>
					{
						this.toggleSaveButton();
					},
					minWidth: 2.5,
					maxWidth: 5
				});
			}, 0);
		}
	}

	SignatureBlock.prototype._bindResizeCanvasEvent = function()
	{
		$(window).off("orientationchange.signatureIsMobileDevice")
			.on("orientationchange.signatureIsMobileDevice", () =>
			{
				setTimeout(() =>
				{
					if (TF.isMobileDevice && this.isFullPage)
					{
						this.resizeCanvas('100%', `${$(window).outerHeight() - 90}px`, true);
					}
				}, 300);
			});
	}

	SignatureBlock.prototype.valueChanged = function()
	{
		this.togglePlaceHolder();
	}

	SignatureBlock.prototype.togglePlaceHolder = function(value)
	{
		const elemContainer = this.signatureQuestion ? this.signatureQuestion : this.elem;
		const elem = elemContainer.find('.e-sign-cover-layer .place-holder');
		if (elem.length > 0)
		{
			if (this.value == null)
			{
				elem.show();
			}
			else
			{
				elem.hide();
			}
			if (value != null)
			{
				elem.hide();
			}
		}
	}

	SignatureBlock.prototype.enterFullPage = function()
	{
		this.isFullPage = true;
		if (TF.isMobileDevice)
		{
			this.signatureQuestion = this.elem.find(".form-question");
			this.signatureQuestion.addClass('full-page');
			$("body").append(this.signatureQuestion);
			this.resizeCanvas('100%', `${$(window).outerHeight() - 80}px`);
		}
		else
		{
			this.elem.closest("div.form-body").css("overflow-y", "initial");
			this.elem.addClass('full-page');
			this.resizeCanvas('100%', '300px');
		}
		this.toggleSaveButton();
	}

	SignatureBlock.prototype.exitFullPage = function()
	{
		const self = this;
		self.isFullPage = false;
		if (TF.isMobileDevice)
		{
			if (self.signatureQuestion)
			{
				self.signatureQuestion.removeClass('full-page');
				this.elem.append(self.signatureQuestion);
			}
		} else
		{
			this.elem.removeClass('full-page');
		}
		this.resizeCanvas('200px', '50px');
	}

	SignatureBlock.prototype.toggleSaveButton = function()
	{
		let $sigContainerEle = this.element;
		if (TF.isMobileDevice && this.signatureQuestion)
		{
			$sigContainerEle = this.signatureQuestion;
		}
		const saveButton = $sigContainerEle.find('.e-sign-save-button');

		if (this.signaturePad.isEmpty())
		{
			saveButton.prop('disabled', true);
		}
		else
		{
			saveButton.prop('disabled', false);
		}
	}

	SignatureBlock.prototype.resizeCanvas = function(width, height, keepCurrent)
	{
		const canvas = this.canvas;
		let val = null;

		if (keepCurrent && this.signaturePad && !this.signaturePad.isEmpty())
		{
			val = this.signaturePad.toDataURL();
		}
		canvas.style.width = width;
		canvas.style.height = height;
		// ...then set the internal size to match
		var ratio = Math.max(window.devicePixelRatio || 1, 1);
		canvas.width = canvas.offsetWidth * ratio;
		canvas.height = canvas.offsetHeight * ratio;
		canvas.getContext("2d").scale(ratio, ratio);
		if (this.signaturePad != null)
		{
			this.signaturePad.clear();
			if (keepCurrent && val)
			{
				this.signaturePad.fromDataURL(val);
			}
			else if (this.value != null)
			{
				this.signaturePad.fromDataURL(this.value);
			}
		}
	}

	SignatureBlock.prototype.getValidateResult = function()
	{
		let result = '';
		if (this.isRequired && (this.value == null || this.value === ''))
		{
			result = 'Signature is required.';
		}
		return result;
	}

})();

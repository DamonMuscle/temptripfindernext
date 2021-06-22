
(function()
{
	createNamespace("TF.Control.Form").SignatureBlock = SignatureBlock;

	function SignatureBlock(field)
	{
		TF.Control.Form.BaseQuestion.apply(this, arguments);
		//create field for saving.
		this.field = {
			Guid: 'signature'
		};
		this.isFullPage = false;
        this.field.readonly = !!field.readonly;
        this.elemenContainer = undefined;
		if (this.field.readonly)
		{
			this.elem.addClass('disabled');
		}
		if (field.value) 
		{
			this.field.value = field.value;
			this.togglePlaceHolder(field.value);
		}

		if (field.signatureQuestion)
		{
			this.signatureQuestion = field.signatureQuestion || "Signature:";
			this._updateQuestionTitle(field.signatureQuestion);
		}
	}

	SignatureBlock.prototype = Object.create(TF.Control.Form.BaseQuestion.prototype);
	SignatureBlock.prototype.constructor = SignatureBlock;

	Object.defineProperty(SignatureBlock.prototype, 'isRequired', {
		get() { return true; },
		enumerable: false,
		configurable: false
	});

	SignatureBlock.prototype.initElement = function()
	{
		this.elem = $(`<div class="form-question e-sign-element">
			<div class="question-title">
				<div class="title">
					<span>Signature:</span>
				</div>
				<span class="modal-title">Signature</span> 
				<button type="button" title="Close" class="e-sign-close-button btn-close">
					<div class="action close"></div>
				</button>
			</div>
			<div class="question-content e-sign-content">
				<canvas id="e-sign-canvas" class="e-sign"></canvas>
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
		`);

		let $canvas = this.elem.find("#e-sign-canvas");
		if ($canvas.length > 0)
		{
			let canvas = $canvas[0];
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
		this.elem.on('click', '.e-sign-cover-layer', e =>
		{
			!this.field.readonly && this.enterFullPage();
		});
		this.elem.on('click', '.e-sign-close-button', e =>
		{
			this.exitFullPage();
		});
		this.elem.on('click', '.k-button', e =>
		{
			let $ele = $(e.target);
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

		$(window).off("orientationchange.signatureIsMobileDevice")
			.on("orientationchange.signatureIsMobileDevice", () =>
			{
				setTimeout(() =>
				{
					if (TF.isMobileDevice && this.isFullPage)
					{
						this.resizeCanvas('100%', ($(window).outerHeight() - 90) + 'px', true);
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
		let elem = this.elem.find('.e-sign-cover-layer .place-holder');
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
        this.elemenContainer = this.elem.parent();
		this.elem.parent().addClass('full-page');
		if (TF.isMobileDevice)
        {
            this.elem.addClass('full-page');
            $("body").append(this.elem);
            this.resizeCanvas('100%', ($(window).outerHeight() - 80) + 'px');
		}
		else
		{
			this.resizeCanvas('100%', '300px');
		}
		this.toggleSaveButton();
	}

	SignatureBlock.prototype.exitFullPage = function()
	{
        this.isFullPage = false;
        this.elem.removeClass('full-page');
       
        if (this.elemenContainer) {
            this.elemenContainer.removeClass('full-page');
            //$("body").remove(this.elem);
            this.elemenContainer.append(this.elem);
        }
		this.resizeCanvas('200px', '50px');
	}

	SignatureBlock.prototype.toggleSaveButton = function()
	{
		let saveButton = this.element.find('.e-sign-save-button');
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
		let canvas = this.canvas,
			val = null;

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
		if (this.isRequired && (this.value == null || this.value == ''))
		{
			result = 'Signature is required.';
		}
		return result;
	}

	SignatureBlock.prototype._updateQuestionTitle = function(title)
	{
		let $questionTitle = this.elem.find('.question-title');
		if ($questionTitle.length)
		{
			if (/<\/?[a-z][\s\S]*>/i.test(title)) // To valid title contains html tag or not
			{
				$questionTitle.find('.title').html(title);
			}
			else
			{
				$questionTitle.find('.title').text(title);
			}
		}
	}
})();

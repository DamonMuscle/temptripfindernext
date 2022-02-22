(function ()
{
	createNamespace("TF.Control.Form").ListQuestion = ListQuestion;

	function ListQuestion()
	{
		TF.Control.Form.BaseQuestion.apply(this, arguments);
	}

	ListQuestion.prototype = Object.create(TF.Control.Form.BaseQuestion.prototype);
	ListQuestion.prototype.constructor = ListQuestion;

	Object.defineProperty(ListQuestion.prototype, 'dirty', {
		get()
		{
			// multi-select
			if (Array.isArray(this.value))
			{
				return this.value.sort().join(',') !== (this.initialValue || []).sort().join(',')
			}
			// single select
			return (this.initialValue || '') !== (this.value || '');
		}
	});

	ListQuestion.prototype.hasValue = function ()
	{
		return !(this.value == null || this.value == '' || (Array.isArray(this.value) && this.value.length == 0));
	}

	ListQuestion.prototype.initQuestionContent = function ()
	{
		let field = this.field,
			defVal = field.DefaultValue,
			filedOptions = field.FieldOptions,
			isMultiple = filedOptions.PickListMultiSelect,
			isAddOtherOption = filedOptions.PickListAddOtherOption,
			guid = field.Guid;

		let htmlStr = '<div class="list-question question">';
		if (filedOptions.UDFPickListOptions && filedOptions.UDFPickListOptions.length > 0)
		{
			filedOptions.UDFPickListOptions.forEach((option, idx) =>
			{
				htmlStr += this.generateOption(isMultiple, idx, option, guid);
			});

			if (isAddOtherOption)
			{
				htmlStr += this.generateOtherOption(isMultiple, filedOptions.UDFPickListOptions.length, guid);
			}
		}
		htmlStr += '</div>';
		let options = $(htmlStr);

		if (isMultiple)
		{
			this._value = [];
		}
		else
		{
			this._value = '';
		}

		options.find('.list-question-option input').on('change', ev =>
		{
			let checkedOptions = options.find(".list-question-option input:checked");
			let val = '';
			if (isMultiple)
			{
				val = [];
			}
			else 
			{
				val = '';
			}

			// show other option
			if ($(ev.target).attr("data-other") === '1')
			{
				$(ev.target).closest('.list-question').find('textarea').prop('disabled', !ev.target.checked)
			}
			else if (ev.target.type === "radio")
			{
				$(ev.target).closest('.list-question').next(".list-question-option").find('textarea').prop('disabled', true)
			}

			$.each(checkedOptions, (idx, option) =>
			{
				let v = $(option).val();

				if (isMultiple)
				{
					if (v)
					{
						val.push(v);
					}
				}
				else
				{
					val = v;
				}
			});
			this.value = val;
		});

		options.find("textarea").on('change', ev =>
		{
			$(ev.target).parents("div.list-question-option").find('input[type="radio"],input[type="checkbox"]').val(ev.target.value);
			options.find('.list-question-option input').trigger("change");
		}).keypress(ev => 
		{
			if (ev.keyCode === 13)
			{
				ev.preventDefault();
			}
		}).keyup(ev => 
		{
			if (TF.isMobileDevice || isIpad())
			{
				ev.target.style.height = 'auto';
				ev.target.style.height = ev.target.scrollHeight + 'px';
			}
		}).on('input', ev =>
		{
			$(ev.target).next('small').html(`${ev.target.value.length}/50`);
			$(ev.target).trigger('change');
		}).focus(ev =>
		{
			$(ev.target).next('small').show();
		}).blur(ev =>
		{
			$(ev.target).next('small').hide();
		});


		if (this.field.value)
		{
			if (!Array.isArray(this.field.value) || this.field.value.length > 0)
			{
				this.value = this.field.value;
			}

			//this.datePicker.value(this.field.value)  PickListAddOtherOption
			if (!!this.field.FieldOptions.PickListMultiSelect) 
			{
				const bindValue = _v =>
				{
					const $item = options.find(`input[type=checkbox][value="${_v}"]`);
					if ($item.length > 0) 
					{
						$item.prop("checked", true);
					}
					else 
					{
						options.find("input[type=checkbox][data-other=1]").prop("checked", true);
						options.find("textarea").removeAttr("disabled").val(_v);
					}
				};
				if (Array.isArray(this.field.value))
				{
					this.field.value.forEach(_v =>
					{
						bindValue(_v);
					});
				}
				else 
				{
					bindValue(this.field.value);
				}
			}
			else
			{
				const normalItem = options.find(`input[type=radio][value="${this.field.value}"]`);
				//cannot found means need fill into other textbox.
				if (normalItem.length == 0)
				{
					options.find("textarea").removeAttr("disabled").val(this.field.value);
					options.find("input[type=radio][data-other]").prop("checked", true);
				}
				else
				{
					normalItem.prop("checked", true);
				}
			}
		}

		if (this.field.readonly) 
		{
			options.find("input").attr("disabled", "disabled");
			options.find("textarea").attr("disabled", "disabled");
		}


		return options;
	}

	ListQuestion.prototype.getValidateResult = function ()
	{
		let result = '';
		if (this.field.Required && (!this.value || (Array.isArray(this.value) && this.value.length === 0)))
		{
			result = 'Answer is required.';
		}
		return result;
	}

	ListQuestion.prototype.generateOption = function (isMultiple, idx, option, guid)
	{
		let type = isMultiple ? 'checkbox' : 'radio';

		return `
			<div class="list-question-option">
				<label for="${guid}_${idx}">
					<input type="${type}" id="${guid}_${idx}" name="${guid}" value="${option.PickList}"}/>
					${option.PickList}
				</label>
			</div>`;
	}

	ListQuestion.prototype.generateOtherOption = function (isMultiple, idx, guid)
	{
		let type = isMultiple ? 'checkbox' : 'radio';

		return `
			<div class="list-question-option">
				<label for="${guid}_${idx}">
					<input type="${type}" id="${guid}_${idx}" name="${guid}" value="" data-other="1"/>
					Other
				</label>
				<div style="position:relative;padding-left: 16px;"><textarea class="text-question question" maxlength="50" rows="1" for="${guid}_${idx}" class="disabled" disabled></textarea><small style="position: absolute;top: -17px;right: 0px;display:none">0/50</small></div>
			</div>`;
	}

})();

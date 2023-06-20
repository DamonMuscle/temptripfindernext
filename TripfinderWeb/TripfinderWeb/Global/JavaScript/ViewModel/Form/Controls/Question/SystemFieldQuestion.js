(function()
{
	createNamespace("TF.Control.Form").SystemFieldQuestion = SystemFieldQuestion;

	function SystemFieldQuestion(field, dataTypeId)
	{
		field.Required = false;
		this.dataTypeId = dataTypeId;
		TF.Control.Form.BaseQuestion.apply(this, [field]);
	}

	SystemFieldQuestion.prototype = Object.create(TF.Control.Form.BaseQuestion.prototype);
	SystemFieldQuestion.prototype.constructor = SystemFieldQuestion;

	SystemFieldQuestion.prototype.initQuestionContent = function()
	{
		let editType = this.field.editType;
		let targetField = editType.targetField;
		const $input = TF.Form.FormConfigHelper.getFormColumnContent(targetField, this.dataTypeId);
		this.$el = $input;
		this.autoFoldContent();

		return $input;
	}

	SystemFieldQuestion.prototype.setValue = function(value, udfs)
	{
		let dataTypeId = this.dataTypeId;
		let editType = this.field.editType;
		let systemFieldType = this.field.FieldOptions.SystemFieldType;
		let trueDisplayName = "true";
		let falseDisplayName = "false";
		if (udfs && udfs.length > 0)
		{
			let defaultText = this.field.FieldOptions.DefaultText; // default text is UDF Guid
			let udf = udfs.find(u => u.Guid === defaultText);
			numberPrecision = udf ? udf.NumberPrecision : 0;
			udf && (trueDisplayName = udf.TrueDisplayName ? udf.TrueDisplayName : "true");
			udf && (falseDisplayName = udf.FalseDisplayName ? udf.FalseDisplayName : "false");
		}

		if (systemFieldType === 'Roll-up')
		{
			const udfField = tf.UDFDefinition.getUDFByGuid(this.field.FieldOptions.DefaultText);
			if (udfField)
			{
				systemFieldType = udfField.OriginalType;
			}
		}
		let targetField = editType.targetField;
		let formType = TF.Form.FormConfigHelper.systemFieldsConfig[dataTypeId];
		if (formType)
		{
			let fieldFormatDef = TF.Form.FormConfigHelper.systemFieldsConfig[dataTypeId][targetField];
			if (fieldFormatDef)
			{
				displayValue = TF.Form.FormConfigHelper.systemFieldsFormat(fieldFormatDef.type, value, this.$el, trueDisplayName, falseDisplayName);
			} else if (systemFieldType)
			{
				displayValue = TF.Form.FormConfigHelper.systemFieldsFormat(systemFieldType, value, this.$el, trueDisplayName, falseDisplayName);
			} else
			{
				displayValue = value !== null ? value : "";
			}
		} else
		{
			displayValue = value !== null ? value : "";
		}

		this.value = value
		this.$el.val(displayValue);
		this.autoFoldContent();
	}

	SystemFieldQuestion.prototype.autoFoldContent = function()
	{
		var self = this;
		var funcAutoHeight = function()
		{
			const elem = self.$el[0];
			elem.style.height = 'auto';
			elem.style.height = elem.scrollHeight + 5 + 'px';
		};
		if (self.$el.is("textarea"))
		{
			setTimeout(funcAutoHeight, 200);
		}
	}

	SystemFieldQuestion.prototype.validate = () => true;
})();

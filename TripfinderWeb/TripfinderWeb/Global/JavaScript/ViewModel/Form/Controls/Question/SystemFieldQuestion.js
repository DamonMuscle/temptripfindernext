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
		let attributeFlag = this.field.OriginItem ? this.field.OriginItem.AttributeFlag : 0;
		let numberPrecision = 2; // set default number Precision to 2 for normal Grid fields
		let trueDisplayName = "true";
		let falseDisplayName = "false";
		let options = { isGrid: false, isUTC: false };
		if (udfs && udfs.length > 0)
		{
			let defaultText = this.field.FieldOptions.DefaultText; // default text is UDF Guid
			let udf = udfs.find(u => u.Guid === defaultText);
			if (udf)
			{
				numberPrecision = tf.udgHelper.getPrecisionByType(systemFieldType, udf);
				trueDisplayName = udf.TrueDisplayName ? udf.TrueDisplayName : "true";
				falseDisplayName = udf.FalseDisplayName ? udf.FalseDisplayName : "false";
			}
		}

		if (systemFieldType === 'Roll-up')
		{
			const udfField = tf.UDFDefinition.getUDFByGuid(this.field.FieldOptions.DefaultText);
			if (udfField)
			{
				systemFieldType = udfField.OriginalType;
			}
		}

		if (!this.field.FieldOptions.IsUDFSystemField)
		{
			let gridDefinition = TF.Form.FormConfigHelper.getSystemFieldRelatedColumnDefinition(this.field.editType.targetField, dataTypeId);
			options.isUTC = (gridDefinition && gridDefinition.isUTC == true)
		}

		let targetField = editType.targetField;
		const fieldFormatConfig = tf.udgHelper.getSystemFieldsConfig(dataTypeId, targetField);

		if (fieldFormatConfig)
		{
			options.dataTypeId = dataTypeId;
			options.systemQuestionTargetField = this.field.editType.targetField;
			displayValue = tf.systemFieldsFormat(fieldFormatConfig.type, value, this.$el, attributeFlag, numberPrecision, trueDisplayName, falseDisplayName, options);
		}
		else if (systemFieldType)
		{
			displayValue = tf.systemFieldsFormat(systemFieldType, value, this.$el, attributeFlag, numberPrecision, trueDisplayName, falseDisplayName, options);
		}
		else
		{
			displayValue = value !== null ? value : "";
		}

		this.value = value;
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

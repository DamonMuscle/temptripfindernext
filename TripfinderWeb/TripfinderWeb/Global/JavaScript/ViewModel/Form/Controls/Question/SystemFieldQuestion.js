(function () {
	createNamespace("TF.Control.Form").SystemFieldQuestion = SystemFieldQuestion;

	function SystemFieldQuestion(field, dataTypeId) {
		field.Required = false;
		this.dataTypeId = dataTypeId;
		TF.Control.Form.BaseQuestion.apply(this, [field]);
	}

	SystemFieldQuestion.prototype = Object.create(TF.Control.Form.BaseQuestion.prototype);
	SystemFieldQuestion.prototype.constructor = SystemFieldQuestion;

	SystemFieldQuestion.prototype.initQuestionContent = function () {
		let editType = this.field.editType;
		let targetField = editType.targetField;
		const $input = TF.Form.FormConfigHelper.getFormColumnContent(targetField, this.dataTypeId);
		this.$el = $input;
		this.autoFoldContent();

		return $input;
	}

	SystemFieldQuestion.prototype.setValue = function (value) {
		let dataTypeId = this.dataTypeId;
		let editType = this.field.editType;
		let systemFieldType = this.field.FieldOptions.SystemFieldType;
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
		if (formType) {
			let fieldFormatDef = TF.Form.FormConfigHelper.systemFieldsConfig[dataTypeId][targetField];
			if (fieldFormatDef) {
				this.value = TF.Form.FormConfigHelper.systemFieldsFormat(fieldFormatDef.type, value, this.$el);
			} else if (systemFieldType) {
				this.value = TF.Form.FormConfigHelper.systemFieldsFormat(systemFieldType, value, this.$el);
			} else {
				this.value = value !== null ? value : "";
			}
		} else {
			this.value = value !== null ? value : "";
		}


		this.$el.val(this.value);
		this.autoFoldContent();
	}

	SystemFieldQuestion.prototype.autoFoldContent = function() {
		var self = this;
		var funcAutoHeight = function() {
			const elem = self.$el[0];
			elem.style.height = 'auto';
			elem.style.height = elem.scrollHeight + 5 + 'px';
		};
		if (self.$el.is("textarea")) {
			setTimeout(funcAutoHeight, 200);
		}
	}

	SystemFieldQuestion.prototype.validate = () => true;
})();

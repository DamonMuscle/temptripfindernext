
(function()
{
	createNamespace("TF.DetailView.FieldEditor").BaseFieldEditor = BaseFieldEditor;

	function BaseFieldEditor(type)
	{
		var self = this;
		self._editorType = type;
		self._$parent = null;
		self._$element = null;
		self.editingCss = "editing";
		self.innderFieldEditingCss = "inner-field-editing";
		self._errorMessages = null;
		self.editStopOnWheel = false;

		self.applied = new TF.Events.Event();
		self.valueChanged = new TF.Events.Event();
		self.editStopped = new TF.Events.Event();
		self.momentHelper = new TF.Document.MomentHelper();

		self._uniqueName = Math.random().toString(36).substring(7);
		self.DEFAULT_TEXT_HEIGHT = '19px';
		self._eventNamespace = String.format(".{0}FieldEditor{1}", self.editorType(), self._uniqueName);
	};

	BaseFieldEditor.prototype.constructor = BaseFieldEditor;

	BaseFieldEditor.prototype.editorType = function()
	{
		return this._editorType;
	}

	BaseFieldEditor.prototype.validator = {};

	BaseFieldEditor.prototype.render = function(options)
	{
		var self = this;

		self._initElement(options);
		self._initValidators(options);
	};

	BaseFieldEditor.prototype._initElement = function(options)
	{
		// Base method, can be overwritten in sub classes to populate field editor UI
	};

	BaseFieldEditor.prototype.getSpecialValidators = function(options)
	{
		return {};
	};

	BaseFieldEditor.prototype._getEditingElement = function()
	{
		return this._$element.find('input');
	};

	BaseFieldEditor.prototype._initValidators = function(options)
	{
		var self = this,
			validatorFields = {},
			validators = $.extend({},
				(options) ? options.validators : {},
				self.getSpecialValidators(options)),
			fieldName = self.getFieldName();

		if (Object.keys(validators).length > 0)
		{
			validatorFields[fieldName] = {
				trigger: "",	// do not trigger it automatically, we will do validation in editStop time (to avoid duplicated validation attempts)
				container: self.getContainerElement(),
				validators: validators
			};

			self._getEditingElement().attr("name", fieldName);
			self.$validator = self._$element.bootstrapValidator(
				{
					excluded: [],
					live: 'enabled',
					message: 'This value is not valid',
					fields: validatorFields
				});
			self.bootstrapValidator = self.$validator.data("bootstrapValidator");
		}
	};

	BaseFieldEditor.prototype.editStart = function($parent, options)
	{
		var self = this;
		self._$parent = $parent;

		$parent.addClass(self.editingCss);
		self.render(options);
		self.bindEvents(options);
		$parent.data("editor", self);
	};

	BaseFieldEditor.prototype.hide = function()
	{
		var self = this,
			$parent = self._$parent;

		$parent.removeClass(self.editingCss);
		if (self._$element)
		{
			self._$element.remove();
		}
		$parent.removeData("editor");
		$parent.removeClass('validateError');
	};

	BaseFieldEditor.prototype._updateParentContent = function()
	{

	};

	BaseFieldEditor.prototype.apply = function(value, text)
	{
		var self = this,
			data = self.getFieldData(),
			result = null;

		self._updateParentContent();
		result = self._getAppliedResult(data, value, text);

		if (data.UDFId)
		{
			result["UDFId"] = data.UDFId;
			result["TypeId"] = data.editType.TypeId;
			result["DataTypeId"] = data.editType.DataTypeId;
		}

		if (data.UDGridField && data.UDGridField.Guid)
		{
			result["UDGridField_Guid"] = data.UDGridField.Guid;
		}

		self.applied.notify(result);
	};

	BaseFieldEditor.prototype.bindEvents = function()
	{
		var self = this;

		if (!self._$element) return;

		if (self.$validator)
		{
			self.$validator
				.on('error.field.bv', function(e)
				{
					$(self._$parent).addClass('validateError');
					$(self._$parent).parent().find('small.help-block').css({ 'display': 'none' });
				})
				.on('success.field.bv', function(e)
				{
					$(self._$parent).removeClass('validateError');
				})
		}
	};

	BaseFieldEditor.prototype.onValueChanged = function()
	{
		this.valueChanged.notify();
	};

	BaseFieldEditor.prototype.save = function()
	{
		console.log('TODO: Implement BaseFieldEditor.prototype.save');
	};

	/**
	 * Cancel editing, should revert value.
	 */
	BaseFieldEditor.prototype.cancel = function()
	{
		this.hide();
	};

	/**
	 * Stop editing, should apply changed value.
	 */
	BaseFieldEditor.prototype.editStop = function()
	{
		var self = this;
		self.hide();
		self.editStopped.notify();
		self.dispose();
		return Promise.resolve()
	};

	BaseFieldEditor.prototype.closeWidget = function()
	{
	};

	BaseFieldEditor.prototype.getContainerElement = function()
	{
		return this._$parent.closest("div.grid-stack-item");
	};

	BaseFieldEditor.prototype.getContentElement = function()
	{
		return this._$parent.find("div.item-content");
	};

	BaseFieldEditor.prototype.getGridStackItemContentElement = function()
	{
		return this._$parent.closest("div.grid-stack-item-content");
	};

	BaseFieldEditor.prototype.getFieldName = function()
	{
		var data = this.getFieldData();

		return data.editType.entityKey || data.field;
	};

	BaseFieldEditor.prototype.getFieldData = function()
	{
		return this.getContainerElement().data();
	};

	BaseFieldEditor.prototype.sortByAlphaOrder = function(array, sortKey)
	{
		return Array.sortBy(array, sortKey);
	};

	BaseFieldEditor.prototype._getAppliedResult = function(data, value, text)
	{
		var self = this, relationshipKey = "",
			fieldName = data.field;

		if (data.editType)
		{
			fieldName = data.editType.entityKey || fieldName;
			relationshipKey = data.editType.relationshipKey;
		}

		return {
			fieldName: fieldName,
			blockName: data.field,
			title: data.title,
			recordValue: value,
			text: text,
			type: self.editorType(),
			errorMessages: self._errorMessages,
			relationshipKey: relationshipKey
		};
	};

	/**
	 * Dispose this editor.
	 *
	 */
	BaseFieldEditor.prototype.dispose = function()
	{
		var self = this;
		self.bootstrapValidator = null;
		self.applied.unsubscribeAll();
		self.valueChanged.unsubscribeAll();
		self.editStopped.unsubscribeAll();
		self.momentHelper.dispose();
	};
})();
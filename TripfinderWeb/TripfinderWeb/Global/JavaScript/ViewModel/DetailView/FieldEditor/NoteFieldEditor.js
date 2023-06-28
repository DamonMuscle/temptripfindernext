(function()
{
	createNamespace("TF.DetailView.FieldEditor").NoteFieldEditor = NoteFieldEditor;

	function NoteFieldEditor(type)
	{
		var self = this;
		this.enableRightClickMenu = true;
		TF.DetailView.FieldEditor.StringFieldEditor.call(self, type);
	};

	NoteFieldEditor.prototype = Object.create(TF.DetailView.FieldEditor.StringFieldEditor.prototype);

	NoteFieldEditor.prototype.constructor = NoteFieldEditor;

	NoteFieldEditor.prototype.editorType = function()
	{
		return "Memo";
	}

	NoteFieldEditor.prototype.bindEvents = function()
	{
		var self = this,
			$editingElement = self._getEditingElement();

		if (!self._$element) return;
		$editingElement.keyup(function(event)
		{
			var keyCode = event.keyCode || event.which;
			if (keyCode === $.ui.keyCode.ESCAPE)
			{
				self.cancel();
			}
		}).on("input", function()
		{
			self.onValueChanged();
		}).on("dblclick", function(e)
		{
			$editingElement.select();
		});
		self._$element.focusout(function()
		{
			self._$element.off('focusout');
			self.editStop();
		});

		TF.DetailView.FieldEditor.BaseFieldEditor.prototype.bindEvents.call(self);
	}

	NoteFieldEditor.prototype._updateParentContent = function()
	{
		var self = this,
			$content = self.getContentElement(),
			value = self._convertValueToHtmlFormat(self.obValue());
		$content.html(value);
	};

	NoteFieldEditor.prototype._initElement = function(options)
	{
		var self = this,
			$div = $("<div class='custom-field-input note' />"),
			$textarea = $("<textarea class='item-content' data-bind='value:obValue' />");
		$textarea.css({
			'display': 'block',
			'width': '100%',
			'overflow-x': 'hidden',
			'overflow-y': 'hidden',
			'height': '100%'
		});
		$div.append($textarea);
		ko.applyBindings(ko.observable(self), $textarea[0]);
		self._$element = $div;
	};

	NoteFieldEditor.prototype._setElementStyle = function(cssOptions)
	{
		var self = this,
			$element = self._getEditingElement();

		$element.css({
			'border': 'none',
			'outline': 'none',
			'background': 'transparent',
			'font-size': cssOptions.fontSize,
			'font-family': cssOptions.fontFamily,
			'font-weight': cssOptions.fontWeight
		});
	};

	NoteFieldEditor.prototype._getEditingElement = function()
	{
		return this._$element.find('textarea');
	};

	NoteFieldEditor.prototype.save = function()
	{
		var self = this;
		return self.validate().then(function()
		{
			self.apply(self.obValue(), self._convertValueToHtmlFormat(self.obValue()));
		});
	};
	NoteFieldEditor.prototype._convertValueToHtmlFormat = function(value)
	{
		if (!value)
		{
			return 'None';
		}
		return String(value).replace(/\n/g, '<br>');
	};
})();
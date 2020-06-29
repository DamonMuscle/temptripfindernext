(function()
{
	createNamespace("TF.DetailView.FieldEditor").BooleanDropDownFieldEditor = BooleanDropDownFieldEditor;

	function BooleanDropDownFieldEditor(type)
	{
		var self = this;
		TF.DetailView.FieldEditor.DropDownFieldEditor.call(self, type);
	};

	BooleanDropDownFieldEditor.prototype = Object.create(TF.DetailView.FieldEditor.DropDownFieldEditor.prototype);

	BooleanDropDownFieldEditor.prototype.constructor = BooleanDropDownFieldEditor;

	BooleanDropDownFieldEditor.prototype.save = function(selectedItem)
	{
		var self = this, value = selectedItem.value;
		if (value != null)
		{
			self.getContentElement().removeClass('not-specified');
			value ? self._$parent.removeClass('false-item').addClass('true-item') :
				self._$parent.removeClass('true-item').addClass('false-item');
		}
		TF.DetailView.FieldEditor.DropDownFieldEditor.prototype.save.call(self, selectedItem);
	};

	BooleanDropDownFieldEditor.prototype._getDataSource = function()
	{
		var data = this.getFieldData(),
			positiveLabel = data.positiveLabel,
			negativeLabel = data.negativeLabel;

		return Promise.resolve([{ "text": positiveLabel, "value": true }, { "text": negativeLabel, "value": false }]);
	};

	BooleanDropDownFieldEditor.prototype._sortByAlphaOrderWithTitles = function(source)
	{
		// Do not order drop down source in boolean field editor.
		return source;
	}
})();
(function()
{
	createNamespace("TF.DetailView.FieldEditor").TimeFieldEditor = TimeFieldEditor;

	function TimeFieldEditor(type)
	{
		var self = this;
		TF.DetailView.FieldEditor.DateTimeFieldEditor.call(self, type);
	};

	TimeFieldEditor.prototype = Object.create(TF.DetailView.FieldEditor.DateTimeFieldEditor.prototype);

	TimeFieldEditor.prototype.constructor = TimeFieldEditor;

	TimeFieldEditor.prototype.validator = {};

	TimeFieldEditor.prototype.type = "Time";

	TimeFieldEditor.prototype.format = "hh:mm A";

	TimeFieldEditor.prototype.getValue = function()
	{
		return moment(this.obValue()).format(this.format);
	};

	TimeFieldEditor.prototype.getFormatedValue = function(value)
	{
		if (value.indexOf('T') === -1)
		{
			value = "1899-12-30 " + value;
		}
		return moment(value).format("HH:mm:ss");
	};

	TimeFieldEditor.prototype.getContentValue = function(value)
	{
		if (!value) return "";

		if (value.indexOf('T') === -1)
		{
			return moment(value, [this.format, "HH:mm:ss"]).format(this.format);
		} else
		{
			return moment(value).format(this.format);
		}
	};

	TimeFieldEditor.prototype.closeWidget = function()
	{
		var dateTimePicker = this._$element.find("input").data("DateTimePicker");
		if (dateTimePicker)
		{
			dateTimePicker.destroy();
		}
	};
})();
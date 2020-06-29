(function()
{
	createNamespace("TF.DetailView.FieldEditor").DateFieldEditor = DateFieldEditor;

	function DateFieldEditor(type)
	{
		var self = this;
		TF.DetailView.FieldEditor.DateTimeFieldEditor.call(self, type);
	};

	DateFieldEditor.prototype = Object.create(TF.DetailView.FieldEditor.DateTimeFieldEditor.prototype);

	DateFieldEditor.prototype.constructor = DateFieldEditor;

	DateFieldEditor.prototype.validator = {};

	DateFieldEditor.prototype.type = "Date";

	DateFieldEditor.prototype.format = "MM/DD/YYYY";

	DateFieldEditor.prototype.getContentValue = function(value)
	{
		return this.momentHelper.toString(value || null, 'MM/DD/YYYY');
	};

	DateFieldEditor.prototype.getFormatedValue = function(value)
	{
		return moment(value).format("YYYY-MM-DDT00:00:00");
	};
})();
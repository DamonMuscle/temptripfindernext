(function()
{
	createNamespace("TF.DetailView.FieldEditor").EmailFieldEditor = EmailFieldEditor;

	function EmailFieldEditor(type)
	{
		var self = this;
		TF.DetailView.FieldEditor.TextFieldEditor.call(self, type);
	};

	EmailFieldEditor.prototype = Object.create(TF.DetailView.FieldEditor.TextFieldEditor.prototype);

	EmailFieldEditor.prototype.constructor = EmailFieldEditor;

	EmailFieldEditor.prototype._initElement = function(options)
	{
		var self = this,
			$emailInput = $(`<div class='custom-field-input email'>
			<!-- ko customInput:{type:'Email',value:obValue,attributes:{class:'form-control item-content',name:'email',maxlength:'${options.maxLength || 50}'}} --><!-- /ko --></div>`);
		ko.applyBindings(ko.observable(self), $emailInput[0]);

		self._$element = $emailInput;
	};

	EmailFieldEditor.prototype.getSpecialValidators = function(options)
	{
		return {
			emailAddress: {
				message: String.format('Invalid Email Format ({0})', options.title)
			}
		}
	};
})();

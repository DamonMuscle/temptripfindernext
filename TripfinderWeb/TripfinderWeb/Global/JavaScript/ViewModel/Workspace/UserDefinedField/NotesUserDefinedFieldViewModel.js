(function()
{
	createNamespace("TF.UserDefinedField").NotesUserDefinedFieldViewModel = NotesUserDefinedFieldViewModel;

	function NotesUserDefinedFieldViewModel(viewModel)
	{
		this.obIsEnable = ko.observable(true);
		var self = this;
		self.parent = viewModel;
		self.parent.onKeyUp = self.onKeyUp.bind(self);
	};

	NotesUserDefinedFieldViewModel.prototype.constructor = NotesUserDefinedFieldViewModel;

	NotesUserDefinedFieldViewModel.prototype.getTemplate = function()
	{
		return null;
	};

	NotesUserDefinedFieldViewModel.prototype.getDefaultValueTemplate = function()
	{
		return "<div><textarea class='form-control' style='height: 66px;' data-bind='value:obDefaultValue,event:{keyup:onKeyUp}' tabindex='4'/></div>";
	};

	NotesUserDefinedFieldViewModel.prototype.updateDefaultValue = function(entity, defaultValue)
	{
		entity["DefaultMemo"] = defaultValue;
	};

	NotesUserDefinedFieldViewModel.prototype.getDefaultValue = function(entity)
	{
		return entity["DefaultMemo"];
	};

	NotesUserDefinedFieldViewModel.prototype.onKeyUp = function(parent, e)
	{
		var keyCode = event.keyCode || event.which;
		if (keyCode === $.ui.keyCode.ENTER)
		{
			var value = e.currentTarget.value;
			e.currentTarget.value = value.replace(/\n/g, '');
		}
	};
})();
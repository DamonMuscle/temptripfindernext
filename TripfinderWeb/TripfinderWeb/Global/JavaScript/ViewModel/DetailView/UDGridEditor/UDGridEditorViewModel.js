(function()
{
	createNamespace("TF.DetailView").UDGridEditorViewModel = UDGridEditorViewModel;

	function UDGridEditorViewModel(UDGrid, recordEntity)
	{
		var self = this;
		self.UDGrid = UDGrid;

	}

	UDGridEditorViewModel.prototype.init = function(data, el)
	{
		var self = this;
		self.$element = $(el);
	};
	UDGridEditorViewModel.prototype.dispose = function()
	{
		//dispose here
	};
})()
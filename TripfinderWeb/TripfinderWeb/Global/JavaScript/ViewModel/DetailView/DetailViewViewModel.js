(function()
{
	createNamespace("TF.DetailView").DetailViewViewModel = DetailViewViewModel;

	function DetailViewViewModel(id)
	{
		var self = this;
		self.obId = ko.observable(id);
	}

	DetailViewViewModel.prototype.constructor = DetailViewViewModel;

	DetailViewViewModel.prototype.init = function(model, element)
	{
	};

	DetailViewViewModel.prototype.setEntity = function(id)
	{
		var self = this;
		self.obId(id);
	};
})();
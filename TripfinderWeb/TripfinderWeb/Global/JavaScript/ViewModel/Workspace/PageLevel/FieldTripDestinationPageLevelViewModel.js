(function()
{
	var namespace = createNamespace('TF.PageLevel');
	namespace.FieldTripDestinationPageLevelViewModel = FieldTripDestinationPageLevelViewModel;

	function FieldTripDestinationPageLevelViewModel()
	{
		namespace.BasePageLevelViewModel.call(this);
	}

	FieldTripDestinationPageLevelViewModel.prototype.constructor = FieldTripDestinationPageLevelViewModel;

	FieldTripDestinationPageLevelViewModel.prototype = Object.create(namespace.BasePageLevelViewModel.prototype);
})();


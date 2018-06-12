(function()
{
	createNamespace('TF.Modal').FieldTripViewResourceModalViewModel = FieldTripViewResourceModalViewModel;

	function FieldTripViewResourceModalViewModel(source)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.contentTemplate('modal/fieldtripViewResourcecontrol');
		this.fieldTripViewResourceViewModel = new TF.Control.FieldTripViewResourceViewModel(source);
		this.data(this.fieldTripViewResourceViewModel);
		this.sizeCss = "modal-dialog-lg";

		this.title("Resources");

		this.containerLoaded = ko.observable(false);
	}

	FieldTripViewResourceModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);

	FieldTripViewResourceModalViewModel.prototype.constructor = FieldTripViewResourceModalViewModel;

	FieldTripViewResourceModalViewModel.prototype.dispose = function()
	{
		this.fieldTripViewResourceViewModel.dispose();
	};

})();

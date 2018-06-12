(function()
{
	createNamespace("TF.Grid").FieldTripGridViewModel = FieldTripGridViewModel;

	function FieldTripGridViewModel(obDocumentFocusState, element, kendoGridState, gridShowType, defaultGridLayoutExtendedEntity, showBulkMenu, option, view, dataEntryObjects)
	{
		TF.Page.BaseGridPage.call(this, obDocumentFocusState, element, kendoGridState, gridShowType, showBulkMenu, false, option, view, dataEntryObjects);
		this.type = "fieldtrip";
		this.baseDeletion = new TF.Executor.FieldtripDeletion();
		this.options.gridDefinition = tf.fieldTripGridDefinition.gridDefinition();
		this.createGrid(this.options);
	};

	FieldTripGridViewModel.prototype = Object.create(TF.Page.BaseGridPage.prototype);

	FieldTripGridViewModel.prototype.constructor = FieldTripGridViewModel;

	FieldTripGridViewModel.prototype.getMinigridColumns = function()
	{
		var columns = [];
		columns = [
			"PublicId",
			"FieldTripStageName",
			"Name",
			"DepartFromSchool",
			"SchoolName",
			"DepartDateTime",
			"EstimatedReturnDateTime",
			"Destination",
			"DestinationStreet",
			"DestinationCity",
			"DestinationState",
			"DestinationZip",
			"DestinationContact",
			"DestinationContactTitle",
			"DestinationContactPhone",
			"DestinationPhoneExt",
			"DestinationFax",
			"DestinationEmail"
		];
		return columns;
	};

})();
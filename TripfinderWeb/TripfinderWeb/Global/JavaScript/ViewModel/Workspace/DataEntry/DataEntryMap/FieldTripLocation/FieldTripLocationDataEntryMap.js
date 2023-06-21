(function()
{
	createNamespace("TF.DataEntry").FieldTripLocationDataEntryMap = FieldTripLocationDataEntryMap;

	TF.DetailView.BaseCustomGridStackViewModel.MapManagers["fieldtriplocation"] = TF.DataEntry.FieldTripLocationDataEntryMap;

	function FieldTripLocationDataEntryMap(options)
	{
		this.type = "fieldtriplocation";
		TF.DataEntry.BaseDataEntryMap.call(this, options);
		this.layerId = "fieldtriplocationLayer";
		this.contextMenu = new TF.DataEntry.DataEntryMapContextMenu(this, []);
	}

	FieldTripLocationDataEntryMap.prototype = Object.create(TF.DataEntry.BaseDataEntryMap.prototype);
	FieldTripLocationDataEntryMap.prototype.constructor = FieldTripLocationDataEntryMap;

})();
(function()
{
	var namespace = window.createNamespace("TF.DataModel");
	namespace.LocalStorageDataModel = function(locaStorageEntity)
	{
		namespace.BaseDataModel.call(this, locaStorageEntity);
	}

	namespace.LocalStorageDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.LocalStorageDataModel.prototype.constructor = namespace.LocalStorageDataModel;

	namespace.LocalStorageDataModel.prototype.mapping = [
	    { from: "VehicleStopTime", default: 10 },
		{ from: "UseSchoolArrivalOrDeparture", default: true },
		{ from: "StreetRoutingSpeedChecked", default: false },
		{ from: "DefaultAverageSpeedChecked", default: true },
		{ from: "DefaultAverageSpeed", default: 1 },
		{ from: "AutomationStudent", default: true }
	];

})();

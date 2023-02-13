(function()
{
	var namespace = window.createNamespace("TF.DataModel");
	namespace.TravelScenarioDataModel = function(travelScenarioEntity)
	{
		namespace.BaseDataModel.call(this, travelScenarioEntity);
	};

	namespace.TravelScenarioDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.TravelScenarioDataModel.prototype.constructor = namespace.TravelScenarioDataModel;

	namespace.TravelScenarioDataModel.prototype.mapping = [
		{ from: "Id", default: 0, required: true },
		{ from: "ProhibitedId", default: 0 },
		{ from: "RestrictedId", default: 0 },
		{ from: "Name", default: "" },
		{ from: "LastUpdated", default: "1970-01-01T00:00:00" },
		{ from: "LastUpdatedId", default: 0 },
		{ from: "Approve", default: -1 },
	];
})();

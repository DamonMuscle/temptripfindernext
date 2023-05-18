(function()
{
	var namespace = window.createNamespace("TF.DataModel");
	namespace.ThematicConfigurationDataModel = function(ThematicConfigurationEntity)
	{
		namespace.BaseDataModel.call(this, ThematicConfigurationEntity);
	}

	namespace.ThematicConfigurationDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.ThematicConfigurationDataModel.constructor = namespace.ThematicConfigurationDataModel;

	namespace.ThematicConfigurationDataModel.prototype.mapping = [
		{ from: "Id", default: 0 },
		{ from: "Name", default: "" },
		{ from: "DataTypeID", default: "" },
		{ from: "QuickFilters", default: "" },
		{ from: "SortInfo", default: "" },
		{ from: "CustomDisplaySetting", default: [] }
	];
})();
(function()
{
	var namespace = window.createNamespace("TF.DataModel");
	namespace.UserPreferenceDataModel = function(userPreferenceEntity)
	{
		namespace.BaseDataModel.call(this, userPreferenceEntity);
	}

	namespace.UserPreferenceDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.UserPreferenceDataModel.prototype.constructor = namespace.UserPreferenceDataModel;

	namespace.UserPreferenceDataModel.prototype.mapping = [
		{ from: "Id", default: 0 },
		{ from: "TfuserId", default: 0 },
		{ from: "TfuserName", default: "" },
		{ from: "Key", default: "" },
		{ from: "Value", default: "" }
	];

})();

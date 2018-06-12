(function()
{
	var namespace = window.createNamespace("TF.DataModel");

	namespace.FieldTripActivityDataModel = function(fieldTripActivityDataModel)
	{
		namespace.BaseDataModel.call(this, fieldTripActivityDataModel);
	}

	namespace.FieldTripActivityDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.FieldTripActivityDataModel.prototype.constructor = namespace.FieldTripActivityDataModel;

	namespace.FieldTripActivityDataModel.prototype.mapping = [
		{ from: "Id", default: 0 },
		{ from: "Name", default: "" },
		{ from: "Description", default: "" }
	];
})();
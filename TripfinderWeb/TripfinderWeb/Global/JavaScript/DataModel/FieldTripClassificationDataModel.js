(function()
{
	var namespace = window.createNamespace("TF.DataModel");

	namespace.FieldTripClassificationDataModel = function(fieldTripClassificationEntity)
	{
		namespace.BaseDataModel.call(this, fieldTripClassificationEntity);
	}

	namespace.FieldTripClassificationDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.FieldTripClassificationDataModel.prototype.constructor = namespace.FieldTripClassificationDataModel;

	namespace.FieldTripClassificationDataModel.prototype.mapping = [
		{ from: "Id", default: 0 },
		{ from: "Code", default: "" },
		{ from: "Description", default: "" }
	];
})();
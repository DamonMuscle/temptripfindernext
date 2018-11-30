(function()
{
	var namespace = window.createNamespace("TF.DataModel");

	namespace.DocumentClassificationDataModel = function(documentClassificationDataModel)
	{
		namespace.BaseDataModel.call(this, documentClassificationDataModel);
	}

	namespace.DocumentClassificationDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.DocumentClassificationDataModel.prototype.constructor = namespace.DocumentClassificationDataModel;

	namespace.DocumentClassificationDataModel.prototype.mapping = [
		{ from: "Id", default: 0 },
		{ from: "Name", default: "" },
		{ from: "Description", default: "" }
	];
})();
(function()
{
	var namespace = window.createNamespace("TF.DataModel");
	namespace.DocumentDataModel = function(documentEntity)
	{
		namespace.BaseDataModel.call(this, documentEntity);
	}

	namespace.DocumentDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.DocumentDataModel.prototype.constructor = namespace.DocumentDataModel;

	namespace.DocumentDataModel.prototype.mapping = [
		{ from: "Id", default: 0 },
		{ from: "DocumentEntities", default: [] },
		{ from: "DocumentRelationshipEntities", default: [] },
		{ from: "Filename", default: "" },
		{ from: "FileSizeKb", default: 0 },
		{ from: "FileContent", default: "" },
		{ from: "MimeType", default: "" },
		{ from: "DocumentClassification", default: "" },
		{ from: "DocumentClassificationId", default: 0 },
		{ from: "Description", default: "" },
		{ from: "LastUpdated", default: null },
		{ from: "LastUpdatedId", default: 0 },
		{ from: "LastUpdatedName", default: "" },
		{ from: "LastUpdatedType", default: 0 }
	];

})();

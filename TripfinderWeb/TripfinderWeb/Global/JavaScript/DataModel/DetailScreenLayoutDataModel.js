(function()
{
	var namespace = window.createNamespace("TF.DataModel");
	namespace.DetailScreenLayoutDataModel = function(LayoutEntity)
	{
		namespace.BaseDataModel.call(this, LayoutEntity);
	}

	namespace.DetailScreenLayoutDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.DetailScreenLayoutDataModel.constructor = namespace.DetailScreenLayoutDataModel;

	namespace.DetailScreenLayoutDataModel.prototype.mapping = [
		{ from: "Id", default: 0 },
		{ from: "Name", default: "" },
		{ from: "Table", default: "" },
		{ from: "Layout", default: '{"items":[],"width":4}' },
		{ from: "Comments", default: "" },
		{ from: "SubTitle", default: "" }
	];
})();
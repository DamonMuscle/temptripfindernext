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
		{ from: "Layout", default: '{"width":4,"sliderFontRate":0.5,"items":[]}' },
		{ from: "Comments", default: "" },
		{ from: "SubTitle", default: "" },
		{ from: "DataType", default: "" }
	];
})();
(function()
{
	var namespace = window.createNamespace("TF.DataModel");
	namespace.GridLayoutExtendedDataModel = function(gridFilterEntity)
	{
		namespace.BaseDataModel.call(this, gridFilterEntity);
	}

	namespace.GridLayoutExtendedDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.GridLayoutExtendedDataModel.prototype.constructor = namespace.GridLayoutExtendedDataModel;

	namespace.GridLayoutExtendedDataModel.prototype.mapping = [
		{ from: "Description", default: "" },
		{ from: "Id", default: 0, required: true },
		{ from: "Name", default: "" },
		{ from: "DataTypeId", default: "" },
		{ from: "GridType", default: "" },
		{ from: "FilterId", default: null },
		{ from: "FilterName", default: "" },
		{ from: "ShowSummaryBar", default: false },
		{ from: "DataExportExists", default: false },
		{
			from: "LayoutColumns",
			default: [],
			format: function(value)
			{
				if (!Array.isArray(value) && typeof value === "string")
				{
					try
					{
						value = JSON.parse(value);
					}
					catch (err)
					{
						console.error("Invalid Column Layout.");
						value = null;
					}
				}
				return value;
			}
		}
	];
})();

(function()
{
	var namespace = window.createNamespace("TF.DataModel");
	namespace.GridLayoutExtendedDataModel = function(gridFilterEntity)
	{
		namespace.BaseDataModel.call(this, gridFilterEntity);
		this.autoExportNames = ko.computed(function()
		{
			const autoExports = this.autoExports();
			if (!autoExports || !autoExports.length)
			{
				return "";
			}

			var names = autoExports.map(e => e.Name);
			if (names.length === 1)
			{
				return names[0];
			}

			var lastOne = names.pop();
			return `${names.join(", ")} and ${lastOne}`;
		}, this);
	}

	namespace.GridLayoutExtendedDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.GridLayoutExtendedDataModel.prototype.constructor = namespace.GridLayoutExtendedDataModel;

	namespace.GridLayoutExtendedDataModel.prototype.mapping = [
		{ from: "Description", default: "" },
		{ from: "Id", default: 0, required: true },
		{ from: "Name", default: "" },
		{ from: "DataTypeId", default: "" },
		{ from: "DataTypeName", default: "" },
		{ from: "UDGridId", default: null },
		{ from: "FilterId", default: null },
		{ from: "FilterName", default: "" },
		{ from: "ThematicId", default: null },
		{ from: "ThematicName", default: "" },
		{ from: "ShowSummaryBar", default: false },
		{ from: "ShowRecurringDate", default: null },
		{ from: "DataExportExists", default: false },
		{ from: "AutoExportExists", default: false },
		{ from: "AutoExports", default: [] },
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

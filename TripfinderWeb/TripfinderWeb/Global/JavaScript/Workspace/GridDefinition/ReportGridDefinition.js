﻿(function ()
{
	createNamespace("TF.GridDefinition").ReportGridDefinition = ReportGridDefinition;
	function ReportGridDefinition()
	{

	}

	ReportGridDefinition.prototype.gridDefinition = function ()
	{
		return {
			Columns: [
				{
					FieldName: "Name",
					DisplayName: "Name",
					Width: '200px',
					type: "string"
				},
				{
					FieldName: "Description",
					DisplayName: "Description",
					Width: '300px',
					type: "string"
				},
				{
					FieldName: "DataTypeName",
					DisplayName: "Data Type",
					Width: '300px',
					type: "string",
				},
				{
					FieldName: "DataSchemaDisplayName",
					DisplayName: "Data Schema",
					Width: '250px',
					type: "string"
				},
				{
					FieldName: "CreatedOn",
					DisplayName: "Created On",
					Width: '150px',
					type: "datetime",
					template: function (dataItem)
					{
						let dt = utcToClientTimeZone(dataItem["CreatedOn"]);
						return dt.isValid() ? dt.format("MM/DD/YYYY hh:mm A") : "";
					},
					isUTC: true,
				},
				{
					FieldName: "CreatedByName",
					DisplayName: "Created By",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "Type",
					DisplayName: "Report Type",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "IsFavorite",
					DisplayName: "Favorite",
					Width: '150px',
					type: "boolean",
					template: function (item)
					{
						if (item.IsFavorite && item.IsFavorite !== "false")
							return "<div class='icon-inner favorite-report'></div>";
						else
							return "<div class='icon-inner'></div>";
					}
				},
				// ,
				// {
				// 	FieldName: "IsSystem",
				// 	DisplayName: "User/System",
				// 	Width: '100px',
				// 	type: "boolean",
				// 	template: function(data)
				// 	{
				// 		return (data.IsSystem === true || data.IsSystem === "true") ? "System" : "User";
				// 	}
				// }
			]
		}
	};
	tf.reportGridDefinition = new TF.GridDefinition.ReportGridDefinition();
})();


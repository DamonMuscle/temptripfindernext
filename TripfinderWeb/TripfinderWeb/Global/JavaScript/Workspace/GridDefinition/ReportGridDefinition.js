(function()
{
	createNamespace("TF.GridDefinition").ReportGridDefinition = ReportGridDefinition;
	function ReportGridDefinition()
	{

	}

	ReportGridDefinition.prototype.gridDefinition = function()
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
					FieldName: "Comments",
					DisplayName: "Description",
					Width: '300px',
					type: "string"
				},
				{
					FieldName: "Layout",
					DisplayName: "Layout",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "Version",
					DisplayName: "Version",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "CreatedDate",
					DisplayName: "Created Date",
					Width: '150px',
					type: "date"
				},
				{
					FieldName: "CreatedTime",
					DisplayName: "Created Time",
					Width: '150px',
					type: "time"
				},
				{
					FieldName: "Favorite",
					DisplayName: "Favorite",
					Width: '180px',
					type: "boolean",
					template: "<input type='checkbox' disabled #: booleanToCheckboxFormatter(Favorite)# onclick='return false' />"
				}
			]
		}
	};
	tf.reportGridDefinition = new TF.GridDefinition.ReportGridDefinition();
})();


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
					Width: '400px',
					type: "string"
				}
			]
		}
	};
	tf.reportGridDefinition = new TF.GridDefinition.ReportGridDefinition();
})();


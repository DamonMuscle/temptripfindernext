(function()
{
	createNamespace("TF.Document").DocumentData = DocumentData;

	function DocumentData(documentType, data, routeState)
	{
		this.documentType = documentType;
		this.data = data;
		this.routeState = routeState;
	};

	DocumentData.DataEntry = "DataEntry";
})();


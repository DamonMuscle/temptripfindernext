(function()
{
	createNamespace("TF").API = API;

	function API(authManager, datasourceManager)
	{
		this.authManager = authManager;
		this.datasourceManager = datasourceManager;
	}

	API.prototype.apiPrefix = function(version)
	{
		// TODO-V2
		this.datasourceManager.databaseId = 7;
		return pathCombine(this.server(version), this.authManager.clientKey, this.datasourceManager.databaseId);
	};

	API.prototype.apiPrefixWithoutDatabase = function()
	{
		return pathCombine(this.server(), this.authManager.clientKey);
	};

	API.prototype.server = function(version)
	{
		var server = "";
		if (APIServer.indexOf("http") == -1)
		{
			server = window.location.protocol + APIServer;
		}
		else
		{
			server = APIServer;
		}

		return server + (version ? "/" + version : "/v2");
	};
})();
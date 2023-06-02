(function()
{
	createNamespace("TF.Helper").ApplicationDataHelper = ApplicationDataHelper;

	function ApplicationDataHelper()
	{
		this.endpoint = "applications";
		this.applicationData = [];
	}

	ApplicationDataHelper.prototype.init = function() 
	{
		var requestUrl = pathCombine(tf.api.apiPrefixWithoutDatabase(), this.endpoint);
		var authorizedAppPrefixes = tf.authManager.authorizationInfo.authorizationTree.applications;

		return tf.promiseAjax.get(requestUrl, {
			paramData: {
				"@filter": `in(prefix,${authorizedAppPrefixes})`,
				"@fields": "ID,Name,Prefix"
			}
		}).then(res =>
		{
			this.applicationData = res.Items;
		});
	};

	ApplicationDataHelper.prototype.getAuthorizedApplicationData = function()
	{
		return this.applicationData;
	};

	ApplicationDataHelper.prototype.FindByName = function(name)
	{
		name = name.toLowerCase();
		return this.applicationData.find(o => o.Name.toLowerCase() === name);
	};

})();

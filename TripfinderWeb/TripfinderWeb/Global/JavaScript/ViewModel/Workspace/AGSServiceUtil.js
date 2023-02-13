(function()
{
	createNamespace("TF").AGSServiceUtil = AGSServiceUtil;

	function AGSServiceUtil()
	{
	}

	AGSServiceUtil.prototype.isGPServiceExecuting = function(GPServicesName)
	{
		if (!GPServicesName || GPServicesName.length == 0)
		{
			GPServicesName = ["TFUtilitiesGPService", "MasterFileGDBGPService"]
		}
		let promises = GPServicesName.map(GPName => tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase("v2"), "arcgis", "JobExecuting"),
			{
				paramData:
				{
					serviceName: GPName
				}
			}));
		return Promise.all(promises).then(
			results => results.some(r => r.Items[0]));
	};
})();
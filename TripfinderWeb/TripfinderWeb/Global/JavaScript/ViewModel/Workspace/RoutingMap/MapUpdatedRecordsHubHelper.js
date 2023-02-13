(function()
{
	createNamespace("TF.RoutingMap").MapUpdatedRecordsHubHelper = MapUpdatedRecordsHubHelper;

	function MapUpdatedRecordsHubHelper()
	{

	}

	MapUpdatedRecordsHubHelper.prototype.updateRecords = function(updatedRecords, hubName)
	{
		var self = this;
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix("v2"), "mapcanvasupdatedrecords", "update"),
			{
				data: {
					UpdatedRecords: updatedRecords,
					HubName: hubName
				}
			});
	};

})();
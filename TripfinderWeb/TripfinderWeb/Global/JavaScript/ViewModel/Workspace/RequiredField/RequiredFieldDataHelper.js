(function()
{
	createNamespace("TF.Helper").RequiredFieldDataHelper = RequiredFieldDataHelper;

	function RequiredFieldDataHelper()
	{
	}

	RequiredFieldDataHelper.prototype.constructor = RequiredFieldDataHelper;

	RequiredFieldDataHelper.prototype.getAllRequiredRecordsByType = function(type)
	{
		var fetchGeneralItems = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "RequiredFields"),
			{
				paramData: { dataTypeID: tf.dataTypeHelper.getId(type) }
			}),
			fetchUdfItems = tf.UDFDefinition.RetrieveByType(type)
				.then(result => 
				{
					PubSub.publish(pb.REQUIRED_UDF_FIELDS_CHANGED, type)
					return result;
				});

		return Promise.all([fetchGeneralItems, fetchUdfItems]).then(function(response)
		{
			var [generalItems, udfItems] = response.map(r => (r && r.Items || []));

			var dataPoints = dataPointsJSON[type];
			if (dataPoints == null)
			{
				return [];
			}
			var points = {};
			for (var dp in dataPoints)
			{
				var items = dataPoints[dp];
				items.forEach(function(item)
				{
					var key = item.field;

					if (item.editType && item.editType.entityKey)
					{
						key = item.editType.entityKey;
					}
					points[key] = item;
				});
			}
			generalItems = generalItems.filter(function(item)
			{
				if (type === "fieldtrip" && ["AccountName", "PurchaseOrder"].includes(item.FieldName))
				{
					return true;
				}

				var exist = points[item.FieldName] != null;
				if (exist)
				{
					item.Label = points[item.FieldName].title;
					if (points[item.FieldName].editType != null)
					{
						return true;
					}
				}

				return false;
			});

			udfItems.forEach(function(item)
			{
				item.RowID = item.Id;
				item.SystemRequired = false;
				item.FieldName = item.DisplayName;
				//Use display name to show as description.
				//item.Label = item.Description;
				item.Label = item.DisplayName;
				item.UdfField = true;
				generalItems.push(item);
			});
			return generalItems;
		});
	}

	RequiredFieldDataHelper.prototype.updateRecords = function(records)
	{
		if (!Array.isArray(records))
		{
			records = [records];
		}
		var generalData = records.filter(function(record)
		{
			return !record.UdfField;
		}).map(function(record)
		{
			return {
				op: "replace",
				path: "/Required",
				id: record.RowID,
				value: record.Required
			}
		});
		var udfData = records.filter(function(record)
		{
			return record.UdfField;
		}).map(function(record)
		{
			return {
				op: "replace",
				path: "/Required",
				id: record.RowID,
				value: record.Required
			}
		});

		var promises = [];
		if (generalData.length)
		{
			promises.push(tf.promiseAjax.patch(pathCombine(tf.api.apiPrefixWithoutDatabase(), "RequiredFields"),
				{
					data: generalData
				}).then(() => "general"));
		}
		if (udfData.length)
		{
			promises.push(tf.UDFDefinition.Patch(udfData).then(() => "udf"));
		}
		return Promise.all(promises).then(function(resp)
		{
			if (resp && resp.length)
			{
				return resp;
			}
			return null;
		}).catch(function(err)
		{
			return null;
		});
	}

	tf.requiredFieldDataHelper = new TF.Helper.RequiredFieldDataHelper();
})();

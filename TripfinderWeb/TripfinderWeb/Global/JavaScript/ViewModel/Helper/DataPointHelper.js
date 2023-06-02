(function()
{
	createNamespace("TF.Helper").DataPointHelper = DataPointHelper;
	function DataPointHelper()
	{
		this.userDefinedFieldHelper = new TF.DetailView.UserDefinedFieldHelper();
	}

	DataPointHelper.prototype.updateDataPointUDF = function(gridType, withDefaultValue)
	{
		let dataPointsForCurrentPage = dataPointsJSON[gridType];
		return Promise.all([
			this.userDefinedFieldHelper.get(gridType, withDefaultValue),
			tf.udgHelper.getUDGridsByDataType(gridType)
		]).then(([udfResult, groupResult]) =>
		{
			if (!gridType) return;

			if (udfResult)
			{
				var userdefinedpoints = [];
				var statePoints = [];
				udfResult.forEach(function(i)
				{
					if (i)
					{
						if (i.AttributeFlag)
						{
							statePoints.push(i);
						} else
						{
							userdefinedpoints.push(i);
						}
					}
				})

				if (statePoints.length > 0)
				{
					dataPointsForCurrentPage["State Report Fields"] = statePoints;
				} else
				{
					if (dataPointsForCurrentPage)
					{
						delete dataPointsForCurrentPage["State Report Fields"];
					}
				}
				if (userdefinedpoints.length > 0)
				{
					dataPointsForCurrentPage["User Defined"] = userdefinedpoints;
				}
			}

			if (groupResult)
			{
				groupResult = groupResult.filter(obj =>
				{
					obj = TF.DetailView.UserDefinedGridHelper.handleFilterFormData(obj);
					return obj.UDGridFields.length > 0;
				});
				tf.udgHelper.updateDataPoint(gridType, groupResult);
			}
		})
	}

	DataPointHelper.prototype.getDataPointGroups = function(gridType)
	{
		if (tf.dataTypeHelper === undefined) return [];

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "datapointgroups"), {
			paramData: {
				DataTypeId: tf.dataTypeHelper.getId(gridType)
			}
		}).then(function(result)
		{
			return result;
		}).catch(function(error)
		{
			console.error(error);
			return [];
		});
	};

})();
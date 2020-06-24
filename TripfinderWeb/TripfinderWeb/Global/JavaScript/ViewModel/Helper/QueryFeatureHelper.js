(function()
{
	createNamespace("TF.Helper").QueryFeatureHelper = QueryFeatureHelper;
	var _featureLayers = {};
	function QueryFeatureHelper()
	{

	}

	function getFeatureLayer(layerId)
	{
		var urls = {
			"georegion": arcgisUrls.MapEditingOneService + "/26",
			"trippath": arcgisUrls.MapEditingOneService + "/37",
			"tripboundary": arcgisUrls.MapEditingOneService + "/38"
		};

		layerId = layerId.toLowerCase();
		if (_featureLayers[layerId])
		{
			return _featureLayers[layerId];
		}
		else
		{
			_featureLayers[layerId] = new tf.map.ArcGIS.FeatureLayer({
				url: urls[layerId],
				spatialReference: {
					wkid: 102100
				},
				objectIdField: "OBJECTID"
			});
			return _featureLayers[layerId];
		}
	}

	function query(layerId, queryOption)
	{
		return new Promise(function(resolve)
		{
			var query = generateQuery(queryOption);
			getFeatureLayer(layerId).queryFeatures(query).then(
				function(featureSet)
				{
					var features = featureSet.features;
					resolve(features);
				}
			);
		});
	}

	function generateQuery(queryOption)
	{
		var query = new tf.map.ArcGIS.Query();
		query.outFields = ["*"];
		query.where = "1=1";
		query.returnGeometry = true;
		if (queryOption)
		{
			query.where = queryOption.where;
			if (queryOption.outFields)
			{
				query.outFields = queryOption.outFields;
			}
			if (queryOption.geometry)
			{
				query.geometry = queryOption.geometry;
			}
		}
		return query;
	}

	function getQueryIdsString(ids)
	{
		if ($.isArray(ids))
		{
			return ids.length > 0 ? "(" + ids.join(",") + ")" : "(-1)";
		}
		else
		{
			return "(" + ids.toString() + ")";
		}
	}

	QueryFeatureHelper.getTripBoundary = function(tripIds, queryOption)
	{
		var layerId = "tripboundary",
			tripIdWhereString = getQueryIdsString(tripIds),
			defaultOption = { where: "DBID = " + tf.datasourceManager.databaseId + " and Trip_ID in " + tripIdWhereString },
			newQueryOption = null;
		if (queryOption)
		{
			newQueryOption = $.extend({}, defaultOption, queryOption);
		}
		else
		{
			newQueryOption = defaultOption;
		}
		return query(layerId, newQueryOption);
	};

	QueryFeatureHelper.getTripBoundaryByTripStopIds = function(tripStopIds, queryOption)
	{
		var tripStopIdWhereString = getQueryIdsString(tripStopIds), defaultOption = { where: "DBID = " + tf.datasourceManager.databaseId + " and TripStopID  in " + tripStopIdWhereString }, newQueryOption = null;
		if (queryOption)
		{
			newQueryOption = $.extend({}, defaultOption, queryOption);
		}
		else
		{
			newQueryOption = defaultOption;
		}
		return this.getTripBoundary(tripStopIds, newQueryOption);
	};

	QueryFeatureHelper.getTripIdByGeometry = function(geometry)
	{
		var layerId = "trippath",
			defaultOption =
			{
				where: "DBID = " + tf.datasourceManager.databaseId,
				returnGeometry: false,
				outFields: "Tripid",
				geometry: geometry
			};

		return query(layerId, defaultOption);
	};

	QueryFeatureHelper.getTripPath = function(tripIds, queryOption)
	{
		var layerId = "trippath",
			tripIdWhereString = getQueryIdsString(tripIds),
			defaultOption = { where: "DBID = " + tf.datasourceManager.databaseId + " and Tripid in " + tripIdWhereString },
			newQueryOption = null;
		if (queryOption)
		{
			newQueryOption = $.extend({}, defaultOption, queryOption);
		}
		else
		{
			newQueryOption = defaultOption;
		}
		return query(layerId, newQueryOption);
	};

	QueryFeatureHelper.getTripPathByTripStopIds = function(tripStopIds, queryOption)
	{
		var self = this,
			tripStopIdWhereString = getQueryIdsString(tripStopIds),
			defaultOption = { where: "DBID = " + tf.datasourceManager.databaseId + " and Tripstop in " + tripStopIdWhereString },
			newQueryOption = null;
		if (queryOption)
		{
			newQueryOption = $.extend({}, defaultOption, queryOption);
		}
		else
		{
			newQueryOption = defaultOption;
		}
		return self.getTripPath(tripStopIds, newQueryOption);
	};

	QueryFeatureHelper.getGeoregion = function(georegionIds, queryOption)
	{
		var layerId = "georegion",
			georegionIdWhereString = getQueryIdsString(georegionIds),
			defaultOption = { where: "DBID = " + tf.datasourceManager.databaseId + " and GeoID in " + georegionIdWhereString },
			newQueryOption = null;
		if (queryOption)
		{
			newQueryOption = $.extend({}, defaultOption, queryOption);
		}
		else
		{
			newQueryOption = defaultOption;
		}
		return query(layerId, newQueryOption);
	};

	QueryFeatureHelper.getFeatureLayerById = function(layerId)
	{
		return getFeatureLayer(layerId);
	};
})();
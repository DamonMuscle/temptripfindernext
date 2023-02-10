(function()
{
	var zipCodes = [];
	var municipalCities = [];
	var GeocodeHelper = {
		initialize: function()
		{
			if (zipCodes.length == 0)
			{
				var zipCodeUrl = arcgisUrls.MapEditingOneService + "/32";
				var query = new tf.map.ArcGIS.Query();
				query.outFields = ["*"];
				query.where = "1=1";
				query.returnGeometry = true;
				query.outSpatialReference = new tf.map.ArcGIS.SpatialReference(4326);
				var featureLayer = new tf.map.ArcGIS.FeatureLayer({
					url: zipCodeUrl,
					spatialReference: {
						wkid: 102100
					},
					objectIdField: "OBJECTID"
				});
				featureLayer.queryFeatures(query).then(function(featureSet)
				{
					zipCodes = featureSet.features;
				});
			}
			if (municipalCities.length == 0)
			{
				var cityUrl = arcgisUrls.MapEditingOneService + "/30";
				var query = new tf.map.ArcGIS.Query();
				query.outFields = ["*"];
				query.where = "1=1";
				query.returnGeometry = true;
				query.outSpatialReference = new tf.map.ArcGIS.SpatialReference(102100);
				var featureLayer = new tf.map.ArcGIS.FeatureLayer({
					url: cityUrl,
					spatialReference: {
						wkid: 102100
					},
					objectIdField: "OBJECTID"
				});
				featureLayer.queryFeatures(query).then(function(featureSet)
				{
					municipalCities = featureSet.features;
				});
			}
		},
		getzipCodes: function()
		{
			return zipCodes;
		},
		getZipCodeText: function(location)
		{
			var zip = "N/A";
			var point = null;
			if (location.spatialReference && !location.spatialReference.isWGS84)
			{
				point = tf.map.ArcGIS.webMercatorUtils.webMercatorToGeographic(location);
			} else
			{
				point = new tf.map.ArcGIS.Point({
					spatialReference: tf.map.ArcGIS.SpatialReference.WGS84,
					x: location.x,
					y: location.y
				});
			}

			if (point && zipCodes)
			{
				for (var i = 0; i < zipCodes.length; i++)
				{
					if (tf.map.ArcGIS.geometryEngine.intersects(zipCodes[i].geometry, point))
					{
						zip = zipCodes[i].attributes.Name;
						break;
					}
				}
			}
			return zip;
		},
		getCities: function()
		{
			return municipalCities;
		},
		getCityName: function(geometry)
		{
			var cityName = "N/A";
			for (var i = 0; i < municipalCities.length; i++)
			{
				if (tf.map.ArcGIS.geometryEngine.intersects(municipalCities[i].geometry, geometry))
				{
					cityName = municipalCities[i].attributes.Name;
					break;
				}
			}
			return cityName;
		},
		getStateName: function(geometry)
		{
			let stateName = "N/A";
			for (var i = 0; i < municipalCities.length; i++)
			{
				if (tf.map.ArcGIS.geometryEngine.intersects(municipalCities[i].geometry, geometry))
				{
					stateName = municipalCities[i].attributes.State;
					break;
				}
			}
			return stateName;
		},
		isExactMatchStreet: function(street1, street2)
		{
			const name1 = replaceStreetName(street1), name2 = replaceStreetName(street2);
			return name1.indexOf(name2) >= 0 || name2.indexOf(name1) >= 0;
			function replaceStreetName(streetName)
			{
				streetName = streetName.toLowerCase().split(",")[0] + " ";
				for (var key in streetSuffixAbbreviations)
				{
					streetSuffixAbbreviations[key].forEach(function(altName)
					{
						streetName = streetName.replace(" " + altName + " ", " " + key + " ");
					})
				}
				return streetName;
			}

		}

	}
	createNamespace("TF.RoutingMap").GeocodeHelper = GeocodeHelper;

})();

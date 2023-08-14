(function()
{
	var namespace = createNamespace("TF.RoutingMap.RoutingPalette");
	namespace.RoutingFeatureData = RoutingFeatureData;

	function RoutingFeatureData(dataModel)
	{
		this.dataModel = dataModel;
		this.viewModel = dataModel ? dataModel.viewModel.viewModel : null;
		this.tripPathFeatureData = this._createFeatureData(arcgisUrls.MapEditingOneService + "/37", namespace.TripPathDataModelMaps, "tripPath");
		this.tripBoundaryFeatureData = this._createFeatureData(arcgisUrls.MapEditingOneService + "/38", namespace.TripBoundaryDataModelMaps, "tripBoundary");
		this.curbApproachData = this._createFeatureData(arcgisUrls.MapEditingOneService + "/24", namespace.curbApproachDataModelMaps);
		this.travelRegionData = this._createFeatureData(arcgisUrls.MapEditingOneService + "/25", namespace.travelRegionDataModelMaps);
		this.curbApproachFileData = this._createFeatureData(arcgisUrls.MapEditingOneServiceFile + "/24", namespace.curbApproachDataModelMaps);
		this.travelRegionFileData = this._createFeatureData(arcgisUrls.MapEditingOneServiceFile + "/25", namespace.travelRegionDataModelMaps);
		this.municipalBoundaryData = this._createFeatureData(arcgisUrls.MapEditingOneService + "/30", namespace.municipalBoundaryDataModelMaps);
	}

	RoutingFeatureData.prototype.clear = function(refreshIds)
	{
		this.tripPathFeatureData.clear(refreshIds);
		this.tripBoundaryFeatureData.clear(refreshIds);
		this.curbApproachData.clear(refreshIds);
		this.travelRegionData.clear(refreshIds);
		this.curbApproachFileData.clear(refreshIds);
		this.travelRegionFileData.clear(refreshIds);
	};

	RoutingFeatureData.prototype.delete = function(tripId)
	{
		return Promise.all([
			this.saveChangeData(this.tripPathFeatureData, tripId, "TripID", []),
			this.saveChangeData(this.tripBoundaryFeatureData, tripId, "Trip_ID", [])
		]);
	};

	RoutingFeatureData.prototype.save = function(tripId)
	{
		var self = this;
		var trip = self.dataModel.getTripById(tripId);
		var tripPaths = [];
		var tripBoundaries = [];
		trip.TripStops.forEach(function(stop)
		{
			if (stop.path && stop.path.geometry)
			{
				tripPaths.push(self.tripPathFeatureData.options.convertToFeatureData(stop.path));
			}
			if (stop.boundary && stop.boundary.geometry)
			{
				tripBoundaries.push(self.tripBoundaryFeatureData.options.convertToFeatureData(stop.boundary));
			}
		});
		return Promise.all([
			this.saveChangeData(this.tripPathFeatureData, tripId, "TripID", tripPaths),
			this.saveChangeData(this.tripBoundaryFeatureData, tripId, "Trip_ID", tripBoundaries),
		]);
	};

	/**
	* refresh trip and tripStop id to new id from api return data
	*/
	RoutingFeatureData.prototype.changeId = function(oldTrip, newTrip)
	{
		var self = this;
		var tripStopIdMap = {};
		oldTrip.TripStops.forEach(function(stop)
		{
			tripStopIdMap[stop.id] = self.dataModel.getFieldTripStopBySequence(newTrip, stop.Sequence).id;
		});
		([this.tripPathFeatureData, this.tripBoundaryFeatureData]).forEach(function(featureData)
		{
			featureData.updateItems.concat(featureData.addItems).forEach(function(item)
			{
				item.TripId = newTrip.id;
				item.TripStopId = tripStopIdMap[item.TripStopId];
			});
		});

		oldTrip.id = newTrip.id;
		oldTrip.Id = newTrip.id;
		oldTrip.TripStops.forEach(function(stop)
		{
			stop.oldId = stop.id;
			stop.TripId = newTrip.id;
			stop.id = tripStopIdMap[stop.id];
			stop.TripStopId = stop.id;
			if (stop.path)
			{
				stop.path.TripId = newTrip.id;
				stop.path.TripStopId = stop.id;
				stop.path.DBID = tf.datasourceManager.databaseId;
			}
			if (stop.boundary)
			{
				stop.boundary.TripId = newTrip.id;
				stop.boundary.TripStopId = stop.id;
				stop.boundary.DBID = tf.datasourceManager.databaseId;
			}
			stop.Students.forEach(function(student)
			{
				student.TripID = stop.TripId;
				student.TripStopID = stop.id;
				student.AnotherTripStopID = tripStopIdMap[student.AnotherTripStopID];
			});
			if (self.dataModel.tripStopDictionary[stop.oldId])
			{
				var data = self.dataModel.tripStopDictionary[stop.oldId];
				self.dataModel.tripStopDictionary[stop.id] = data;
				if (stop.id != stop.oldId)
				{
					delete self.dataModel.tripStopDictionary[stop.oldId];
				}
			}
		});
	};

	RoutingFeatureData.prototype.saveChangeData = function(featureData, tripId, tripIdFieldName, newFeatures)
	{
		// delete all then create all
		return new Promise(function(resolve)
		{
			var query = new tf.map.ArcGIS.Query();
			query.outFields = ["*"];
			query.where = tripIdFieldName + "=" + tripId + " and DBID = " + tf.datasourceManager.databaseId;
			function save()
			{
				newFeatures = newFeatures.filter(f => 
				{
					if (f.geometry && f.geometry.type !== 'polyline')
					{
						return true;
					}

					if (!f.geometry || !f.geometry.paths)
					{
						return false;
					}

					f.geometry.paths = f.geometry.paths.filter(p => p.length);
					return f.geometry.paths.length;
				});
				newFeatures.forEach(function(c)
				{
					c.OBJECTID = 0;
				});
				if (newFeatures && newFeatures.length > 0)
				{
					featureData.getFeatureLayer().applyEdits({ addFeatures: newFeatures }).then(function()
					{
						resolve();
					}, function()
					{
						resolve();
					});
				}
				else
				{
					resolve();
				}
			}
			featureData.getFeatureLayer().queryFeatures(query).then(function(featureSet)
			{
				var features = featureSet.features;
				// delete all
				if (features.length > 0)
				{
					featureData.getFeatureLayer().applyEdits({ deleteFeatures: features }).then(
						function()
						{
							save();
						},
						function()
						{
							console.error(arguments);
							save();
						});
				}
				else
				{
					save();
				}
			});
		});
	};

	RoutingFeatureData.prototype._convertLayerDataToData = function(item, dataMaps, type)
	{
		var data = this.dataModel.convertServerToData(item, dataMaps);
		data.geometry = item.geometry;
		data.id = data.OBJECTID;
		if (type) data.type = type;
		return data;
	};

	RoutingFeatureData.prototype._convertDataToLayerData = function(item, dataMaps)
	{
		var data = TF.RoutingMap.FeatureDataModel.convertDataToServer(item, dataMaps);
		return new tf.map.ArcGIS.Graphic(item.geometry, null, data);
	};

	RoutingFeatureData.prototype._createFeatureData = function(url, dataMaps, type)
	{
		var self = this;
		var featureData = new TF.RoutingMap.FeatureDataModel(
			{
				url: url,
				backup: false,
				convertToData: function(item)
				{
					return self._convertLayerDataToData(item, dataMaps, type);
				}.bind(self),
				convertToFeatureData: function(item)
				{
					return self._convertDataToLayerData(item, dataMaps);
				}.bind(self)
			});
		return featureData;
	};
	RoutingFeatureData.prototype._updateFeatureDataFile = function()
	{
		this.curbApproachFileData = this._createFeatureData(arcgisUrls.MapEditingOneServiceFile + "/24", namespace.curbApproachDataModelMaps);
		this.travelRegionFileData = this._createFeatureData(arcgisUrls.MapEditingOneServiceFile + "/25", namespace.travelRegionDataModelMaps);
	};

	namespace.TripPathDataModelMaps = [
		{ fromServer: "OBJECTID", to: "OBJECTID" },
		{ fromServer: "Tripid", to: "TripId" },
		{ fromServer: "Tripstop", to: "TripStopId" },
		{ fromServer: "Dist", to: "Dist" },
		{ fromServer: "Avgspeed", to: "AvgSpeed" },
		{ fromServer: "Tptlist", to: "TPTlist" },
		{ fromServer: "Lrlist", to: "LRList" },
		{ fromServer: "DBID", to: "DBID" }
	];

	namespace.TripBoundaryDataModelMaps = [
		{ fromServer: "OBJECTID", to: "OBJECTID" },
		{ fromServer: "Trip_ID", to: "TripId" },
		{ fromServer: "TripStopID", to: "TripStopId" },
		{ fromServer: "Bdy_Type", to: "BdyType" },
		{ fromServer: "Shape_Leng", to: "ShapeLeng" },
		{ fromServer: "DBID", to: "DBID" }
	];

	namespace.travelRegionDataModelMaps = [
		{ fromServer: "OBJECTID", to: "OBJECTID" },
		{ fromServer: "Name", to: "name" },
		{ fromServer: "Type", to: "type" },
		{ fromServer: "ScenarioId", to: "scenarioId" },
		{ fromServer: "Weight", to: "weight" },
		{ fromServer: "IsChangeTime", to: "isChangeTime" }
	];

	namespace.curbApproachDataModelMaps = [
		{ fromServer: "OBJECTID", to: "OBJECTID" },
		{ fromServer: "SideOfStreet", to: "SideOfStreet" },
		{ fromServer: "StreetSegmentID", to: "StreetSegmentID" },
		{ fromServer: "ScenarioId", to: "scenarioId" },
		{ fromServer: "Type", to: "type" }
	];

	namespace.municipalBoundaryDataModelMaps = [
		{ fromServer: "OBJECTID", to: "OBJECTID" },
		{ fromServer: "Name", to: "name" },
		{ fromServer: "City", to: "city" },
	];
})();

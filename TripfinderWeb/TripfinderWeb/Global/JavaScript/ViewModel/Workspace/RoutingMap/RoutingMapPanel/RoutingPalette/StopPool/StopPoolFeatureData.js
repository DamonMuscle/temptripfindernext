(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").StopPoolFeatureData = StopPoolFeatureData;

	function StopPoolFeatureData(dataModel)
	{
		var self = this;
		self.dataModel = dataModel;
		this.boundaryFeatureData = this._createFeatureData(arcgisUrls.MapEditingOneService + "/35", StopPoolFeatureData.BoundaryData.maps, StopPoolFeatureData.BoundaryData.type);
		this.stopFeatureData = this._createFeatureData(arcgisUrls.MapEditingOneService + "/36", StopPoolFeatureData.StopPoolData.maps, StopPoolFeatureData.StopPoolData.type);
		self.stopRecords = [];
	}

	StopPoolFeatureData.prototype.clear = function(ids)
	{
		this.boundaryFeatureData.clear(ids);
		this.stopFeatureData.clear(ids);
		this.stopRecords = [];
	};

	StopPoolFeatureData.prototype.query = function(refreshIds)
	{
		var self = this;
		if (!this.dataModel.selectedCategory() || !this.dataModel.selectedCategory().Id)
		{
			self.stopRecords = [];
			return Promise.resolve([]);
		}
		return self.queryStopPool(this.dataModel.selectedCategory().Id, refreshIds).then(function(data)
		{
			self.stopRecords = data;
			return self.queryBoundary(self.stopRecords.map(function(c)
			{
				return c.StopId;
			}));
		}).then(function(boundaryList)
		{
			var boundaryEnumerable = Enumerable.From(boundaryList);
			self.stopRecords.forEach(function(stop)
			{
				stop.boundary = boundaryEnumerable.FirstOrDefault({}, function(c) { return c.StopId == stop.StopId; });
			});

			return self.stopRecords;
		});
	};

	StopPoolFeatureData.prototype.queryStopPool = function(categoryId, stopPoolIds)
	{
		var self = this;
		var idWhereString = "DBID=" + tf.datasourceManager.databaseId + " and StopPoolCategoryID=" + categoryId;
		if (stopPoolIds)
		{
			idWhereString += " and OBJECTID in (" + stopPoolIds.join(",") + ")";
		}
		return self.stopFeatureData.query({ where: idWhereString });
	};

	StopPoolFeatureData.prototype.queryBoundary = function(stopIds)
	{
		var self = this;
		if (stopIds.length == 0)
		{
			return Promise.resolve();
		}
		return self.boundaryFeatureData.query({ where: "DBID=" + tf.datasourceManager.databaseId + " and Stop_Id in (" + stopIds.join(",") + ")" });
	};

	StopPoolFeatureData.prototype.getChangeData = function()
	{
		return this.stopFeatureData.getChangeData();
	};

	StopPoolFeatureData.prototype.add = function(data)
	{
		var forceChange = false;
		// if boundary change, force stop change
		if (data.OBJECTID > 0)
		{
			forceChange = this.isBoundaryChanged(data);
		}
		this.stopFeatureData.add(data, forceChange);
		this.boundaryFeatureData.add(data.boundary);
	};

	StopPoolFeatureData.prototype.update = function(data)
	{
		var forceChange = this.isBoundaryChanged(data);
		this.boundaryFeatureData.update(data.boundary);
		this.stopFeatureData.update(data, forceChange);
	};

	StopPoolFeatureData.prototype.delete = function(data)
	{
		this.stopFeatureData.delete(data);
		this.boundaryFeatureData.delete(data.boundary);
	};

	StopPoolFeatureData.prototype.isBoundaryChanged = function(data)
	{
		return this.boundaryFeatureData._isEntityChange(data.boundary);
	};

	StopPoolFeatureData.prototype.save = function()
	{
		var self = this;
		var changeData = this.stopFeatureData.getChangeData();
		self.updateTotalStopTime(changeData);
		var boundaryChangeData = this.boundaryFeatureData.getChangeData();
		return Promise.all([this.stopFeatureData.save(changeData), this.boundaryFeatureData.save(boundaryChangeData)]).then(function()
		{
			self.dataModel.lockData.saveData(changeData);
			self.dataModel.lockData.unLockCurrentDocument();
			self.dataModel.lockData.calcSelfChangeCount();
		});
	};

	StopPoolFeatureData.prototype.updateTotalStopTime = function(changeData)
	{
		for (var key in changeData)
		{
			if (changeData[key] && $.isArray(changeData[key]))
			{
				changeData[key].forEach(g =>
				{
					g.attributes.TotalStopTime = TF.Helper.TripStopHelper.convertToSeconds(g.attributes.TotalStopTime) || 0;
				})
			}
		}
	}

	StopPoolFeatureData.prototype._convertLayerDataToData = function(item, dataMaps, type)
	{
		var data = TF.RoutingMap.BaseMapDataModel.convertServerToData(item, dataMaps);
		data.geometry = item.geometry;
		data.id = data.OBJECTID;
		if (type)
		{
			data.type = type;
		}
		return data;
	};

	StopPoolFeatureData.prototype._convertDataToLayerData = function(item, dataMaps)
	{
		var data = TF.RoutingMap.FeatureDataModel.convertDataToServer(item, dataMaps);
		return new tf.map.ArcGIS.Graphic(item.geometry, null, data);
	};

	StopPoolFeatureData.prototype._createFeatureData = function(url, dataMaps, type)
	{
		var self = this;
		var featureData = new TF.RoutingMap.FeatureDataModel(
			{
				url: url,
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

	StopPoolFeatureData.prototype.dispose = function()
	{
		([this.stopFeatureData, this.boundaryFeatureData]).forEach(function(featureData)
		{
			featureData.dispose();
		});
		this.featureDataItems = [];
	};

	StopPoolFeatureData.BoundaryData = {
		type: "stopPoolBoundary",
		maps: [
			{ fromServer: "OBJECTID", to: "OBJECTID" },
			{ fromServer: "Stop_ID", to: "StopId" },
			{ fromServer: "DBID", to: "DBID" },
		],
		createTripBoundary: function(tripStop)
		{
			return {
				OBJECTID: 0,
				id: TF.createId(),
				StopId: tripStop.StopId,
				geometry: tripStop.boundary.geometry,
				type: this.type,
				BdyType: tripStop.boundary.BdyType
			};
		}
	};

	StopPoolFeatureData.StopPoolData = {
		vehicleCurbApproach: 1,
		type: "stopPoolStop",
		maps: [
			{ fromServer: "OBJECTID", to: "OBJECTID" },
			{ fromServer: "Stop_ID", to: "StopId" },
			{ fromServer: "Street", to: "Street" },
			{ fromServer: "City", to: "City" },
			{ fromServer: "DBID", to: "DBID" },
			{ fromServer: "Comments", to: "Comments" },
			{ fromServer: "StopPoolCategoryID", to: "StopPoolCategoryID" },
			{ fromServer: "TotalStopTime", to: "TotalStopTime" },
			{ fromServer: "ProhibitCrosser", to: "ProhibitCrosser" },
		],
		getDataModel: function getDataModel()
		{
			return {
				id: 0,
				Street: "",
				City: "",
				Comments: "",
				StopId: 0,
				DBID: 0,
				type: this.type,
				boundary: {},
				OBJECTID: 0,
				vehicleCurbApproach: tf.storageManager.get("stopPoolStop-vehicleCurbApproach") >= 0 ? tf.storageManager.get("stopPoolStop-vehicleCurbApproach") : 1,
				TotalStopTime: new TF.DataModel.LocalStorageDataModel().vehicleStopTime(),
				ProhibitCrosser: 0
			};
		}
	};
})();
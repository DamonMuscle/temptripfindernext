(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").LandmarkFeatureData = LandmarkFeatureData;

	function LandmarkFeatureData(dataModel)
	{
		this.dataModel = dataModel;
		this.viewModel = dataModel.viewModel.viewModel;
		this.featureDataPolygon = this.createFeatureData(arcgisUrls.MapEditingOneService + "/28", "polygon");
		this.featureDataPoint = this.createFeatureData(arcgisUrls.MapEditingOneService + "/27", "point");
		this.featureDataPolyline = this.createFeatureData(arcgisUrls.MapEditingOneService + "/29", "polyline");
		this.featureDataItems = [this.featureDataPolygon, this.featureDataPoint, this.featureDataPolyline];
		this.updateItems = [];
		this.addItems = [];
		this.deleteItems = [];
	}

	LandmarkFeatureData.prototype.query = function(refreshIds)
	{
		var promiseAll = [];
		this.featureDataItems.forEach(function(featureData)
		{
			var where = null;
			if (refreshIds)
			{
				var refreshIdsInType = Enumerable.From(refreshIds)
					.Where(function(c) { return c.indexOf(featureData.geometryType) >= 0; })
					.Select(function(c) { return c.split("_")[1]; }).ToArray();
				if (refreshIdsInType.length > 0)
				{
					where = {
						where: "OBJECTID in (" + refreshIdsInType.join(",") + ")"
					};
				} else
				{
					where = {
						where: " 1=2 "
					};
				}
			}
			promiseAll.push(featureData.query(where));
		});
		return Promise.all(promiseAll).then(function(items)
		{
			var data = [];
			items.forEach(function(c)
			{
				data = data.concat(c);
			});
			return data;
		});
	};

	LandmarkFeatureData.prototype.getCount = function()
	{
		var promiseAll = [];
		this.featureDataItems.forEach(function(featureData)
		{
			promiseAll.push(featureData.getCount());
		});
		return Promise.all(promiseAll).then(function(items)
		{
			return Enumerable.From(items).Sum();
		}).catch(function()
		{
			return 0;
		});
	};

	LandmarkFeatureData.prototype.getChangeData = function()
	{
		var addGraphic = [];
		var editGraphic = [];
		var deleteGraphic = [];
		this.featureDataItems.forEach(function(featureData)
		{
			var changeData = featureData.getChangeData();
			addGraphic = addGraphic.concat(changeData.addGraphic);
			editGraphic = editGraphic.concat(changeData.editGraphic);
			deleteGraphic = deleteGraphic.concat(changeData.deleteGraphic);
		});
		return {
			addGraphic: addGraphic,
			editGraphic: editGraphic,
			deleteGraphic: deleteGraphic
		};
	};

	LandmarkFeatureData.prototype.add = function(data)
	{
		this.featureDataItems.forEach(function(featureData)
		{
			if (featureData.geometryType == data.geometry.type)
			{
				featureData.add(data);
			}
		});
		this.refreshItems();
	};

	LandmarkFeatureData.prototype.update = function(data)
	{
		var isGeomChange = false;
		this.featureDataItems.forEach(function(featureData)
		{
			if (featureData.geometryType == data.geometry.type)
			{
				if (featureData.update(data)) isGeomChange = true;
			}
		});
		this.refreshItems();
		return isGeomChange;
	};

	LandmarkFeatureData.prototype.delete = function(data)
	{
		this.featureDataItems.forEach(function(featureData)
		{
			if (featureData.geometryType == data.geometry.type)
			{
				featureData.delete(data);
			}
		});
		this.refreshItems();
	};

	LandmarkFeatureData.prototype.refreshItems = function()
	{
		var updateItems = [];
		var addItems = [];
		var deleteItems = [];
		this.featureDataItems.forEach(function(featureData)
		{
			updateItems = updateItems.concat(featureData.updateItems);
			addItems = addItems.concat(featureData.addItems);
			deleteItems = deleteItems.concat(featureData.deleteItems);
		});
		this.updateItems = updateItems;
		this.addItems = addItems;
		this.deleteItems = deleteItems;
	};

	LandmarkFeatureData.prototype.save = function(data)
	{
		var savePromise = [];
		this.featureDataItems.forEach(function(featureData)
		{
			var saveData = {};
			saveData.addGraphic = Enumerable.From(data.addGraphic).Where(function(c) { return c.geometry.type == featureData.geometryType; }).ToArray();
			saveData.editGraphic = Enumerable.From(data.editGraphic).Where(function(c) { return c.geometry.type == featureData.geometryType; }).ToArray();
			saveData.deleteGraphic = Enumerable.From(data.deleteGraphic).Where(function(c) { return c.geometry.type == featureData.geometryType; }).ToArray();
			savePromise.push(featureData.save(saveData));
		});
		return Promise.all(savePromise);
	};

	LandmarkFeatureData.prototype.clear = function(ids)
	{
		this.featureDataItems.forEach(function(featureData)
		{
			featureData.clear(ids);
		});
		this.updateItems = [];
		this.addItems = [];
		this.deleteItems = [];
	};

	LandmarkFeatureData.prototype.createFeatureData = function(url, type)
	{
		var self = this;
		var featureData = new TF.RoutingMap.FeatureDataModel(
			{
				url: url,
				convertToData: function(item)
				{
					return this.convertFeaterLayerDataToData(item);
				}.bind(self),
				convertToFeatureData: function(data)
				{
					return this.convertDataToFeaterLayerData(data);
				}.bind(self)
			});
		featureData.geometryType = type;
		return featureData;
	};

	LandmarkFeatureData.prototype.convertFeaterLayerDataToData = function(item)
	{
		var data = this.dataModel.getDataModel();
		for (var key in item.attributes)
		{
			if (typeof item.attributes[key] === "string" || item.attributes[key] instanceof String)
			{
				data[key] = item.attributes[key].trim();
			}
			else
			{
				data[key] = item.attributes[key];
			}
		}

		data.geometry = item.geometry;
		data.id = data.geometry.type + "_" + data.OBJECTID;
		return data;
	};

	LandmarkFeatureData.prototype.convertDataToFeaterLayerData = function(item)
	{
		this.dataModel.trimStringSpace(item);
		return new tf.map.ArcGIS.Graphic(item.geometry, null, item);
	};

	LandmarkFeatureData.prototype.getDataModel = function()
	{
		return {
			OBJECTID: "",
			id: 0,
			Id: 0,
			Name: "",
			type: "Landmark",
			geometry: null
		};
	};

	LandmarkFeatureData.prototype.dispose = function()
	{
		this.featureDataItems.forEach(function(featureData)
		{
			featureData.dispose();
		});
		this.featureDataItems = [];
	};
})();
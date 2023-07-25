(function()
{
	createNamespace("TF.UserDefinedField").GeofenceFeatureDataModel = GeofenceFeatureDataModel;
	var caches = {};
	function GeofenceFeatureDataModel(options)
	{
		var defaults = {
			convertToData: function() { },
			convertToFeatureData: function() { }
		};

		this.addItems = [];
		this.updateItems = [];
		this.deleteItems = [];
		this.featureLayer = null;
		this.arcgis = tf.map.ArcGIS;
		this.options = $.extend({}, defaults, options);
		//this.url = this.options.url;
		this.isModified = false;
		this.backupData = {};
		this._canQuery = false;
		this.fields = {};
	}

	GeofenceFeatureDataModel.prototype.getFeatureLayer = function()
	{
		var self = this;
		if (self.featureLayer)
		{
			return self.featureLayer;
		}

		self.featureLayer = new self.arcgis.FeatureLayer({
			id: "geofenceLayer",
			//url: self.url,
			spatialReference: {
				wkid: 102100
			},
			objectIdField: "OBJECTID"
		});

		return self.featureLayer;
	};

	GeofenceFeatureDataModel.prototype.save = function(changeData)
	{
		var self = this;
		var data = changeData || self.getChangeData();
		return new Promise(function(resolve, reject)
		{
			if (data.addGraphic.length == 0 && data.editGraphic.length == 0 && data.deleteGraphic.length == 0)
			{
				resolve();
				return;
			}
			self._deleteFakeId(data);
			self.getFeatureLayer().applyEdits({
				addFeatures: data.addGraphic,
				updateFeatures: data.editGraphic,
				deleteFeatures: data.deleteGraphic
			}).then(function(resultItems)
			{
				var addItems = resultItems.addFeatureResults;
				if (addItems && addItems.length > 0 && addItems[0].error)
				{
					reject();
					return;
				}
				(addItems || []).forEach(function(item, i)
				{
					if (item && item.objectId)
					{
						self.addItems[i].OBJECTID = item.objectId;
						data.addGraphic[i].attributes.OBJECTID = item.objectId;
						self._backupData(item);
					}
				});
				(self.updateItems || []).forEach(function(item)
				{
					self._backupData(item);
				});
				self.addItems = [];
				self.updateItems = [];
				self.deleteItems = [];
				self.isModified = self.addItems.length != 0 || self.updateItems.length != 0 || self.deleteItems.length != 0;
				resolve(resultItems);
			});
		});
	};

	GeofenceFeatureDataModel.prototype._deleteFakeId = function(data)
	{
		for (var key in data)
		{
			data[key].forEach(function(g)
			{
				if (typeof (g.attributes.Id) != "undefined" && typeof (g.attributes.id) != "undefined")
				{
					g.attributes = $.extend(true, {}, g.attributes);
					delete g.attributes.id;
				}
			});
		}
	};

	GeofenceFeatureDataModel.prototype.getChangeDataArray = function()
	{
		for (var i = 0; i < this.updateItems.length; i++)
		{
			for (var j = i + 1; j < this.updateItems.length; j++)
			{
				if (this.updateItems[i].id == this.updateItems[j].id)
				{
					this.updateItems.splice(i, 1);
					i--;
					break;
				}
			}
		}
		var deleteItemsEnumerable = Enumerable.From(this.deleteItems).Distinct(function(c) { return c.OBJECTID; }).Where(function(c) { return c.OBJECTID > 0; });
		var updateItemsEnumerable = Enumerable.From(this.updateItems).Distinct(function(c) { return c.OBJECTID; }).Where(function(c) { return c.OBJECTID > 0 && !deleteItemsEnumerable.Any(function(d) { return c.id == d.id; }); });
		var addItemsEnumerable = Enumerable.From(this.addItems).Where(function(c) { return c.OBJECTID == 0 && !deleteItemsEnumerable.Any(function(d) { return c.id == d.id; }) && !updateItemsEnumerable.Any(function(d) { return c.id == d.id; }); });

		return {
			add: addItemsEnumerable.ToArray(),
			edit: updateItemsEnumerable.ToArray(),
			delete: deleteItemsEnumerable.ToArray()
		};
	};

	GeofenceFeatureDataModel.prototype.getChangeData = function()
	{
		var self = this;
		var data = self.getChangeDataArray();
		return {
			addGraphic: data.add.map(function(item) { return self.options.convertToFeatureData(item); }),
			editGraphic: data.edit.map(function(item) { return self.options.convertToFeatureData(item); }),
			deleteGraphic: data.delete.map(function(item) { return self.options.convertToFeatureData(item); })
		};
	};


	GeofenceFeatureDataModel.prototype.query = function(queryOption, cacheKey, backUp = true)
	{
		var self = this;
		if (cacheKey && caches[cacheKey])
		{
			return Promise.resolve(caches[cacheKey]);
		}
		return new Promise(function(resolve, reject)
		{
			self.backupData = {};
			self._canQuery = true;
			var query = self.options.query(queryOption);
			query.returnGeometry = true;
			self.getFeatureLayer().queryFeatures(query).then(
				function(featureSet)
				{
					if (!self._canQuery)
					{
						reject();
						return;
					}
					var features = featureSet.features;
					var data = [];
					(featureSet.fields || []).forEach(function(item)
					{
						self.fields[item.name] = "";
					});
					features.forEach(function(item)
					{
						var d = self.options.convertToData(item);
						data.push(d);
						backUp && self._backupData(d);
					});
					self.isModified = false;
					if (cacheKey)
					{
						caches[cacheKey] = data;
					}
					resolve(data);
				}
			).catch(function(error)
			{
				TF.consoleOutput("error", "GeofenceFeatureDataModel query fails: " + error);
				reject();
			});
		});
	};

	GeofenceFeatureDataModel.prototype._backupData = function(item)
	{
		var self = this;
		var id = item.id ? item.id : item.OBJECTID ? item.OBJECTID : item.objectId;
		this.backupData[id] = {};
		for (var key in item)
		{
			if (item.hasOwnProperty(key))
			{
				if (key == "geometry")
				{
					self.backupData[id][key] = TF.cloneGeometry(item.geometry);
				} else
				{
					self.backupData[id][key] = item[key];
				}
			}
		}
	};

	GeofenceFeatureDataModel.prototype._isEntityChange = function(item, excludes)
	{
		var self = this;
		var change = false;
		var backUp = self.backupData[item.OBJECTID || item.id];
		if (!backUp)
		{
			return true;
		}
		for (var p in backUp)
		{
			if (p == "clientKey" || p == "id" || p == "databaseId" || p == "totalStudents" || p == "relateId")
			{
				continue;
			}
			if (excludes && Enumerable.From(excludes).Any(function(c) { return c == p; }))
			{
				continue;
			}
			if (p == "geometry")
			{
				if (!tf.map.ArcGIS.geometryEngine.contains(backUp.geometry, item.geometry) ||
					!tf.map.ArcGIS.geometryEngine.contains(item.geometry, backUp.geometry))
				{
					change = true;
					break;
				}
			}
			else if (item[p] != backUp[p] && typeof (item[p]) != "object")
			{
				change = true;
				break;
			}
		}
		return change;
	};

	GeofenceFeatureDataModel.prototype.countChange = function()
	{
		var changeData = this.getChangeData();
		return changeData.addGraphic.length + changeData.editGraphic.length + changeData.deleteGraphic.length;
	};

	GeofenceFeatureDataModel.prototype.update = function(data, force)
	{
		if (data.OBJECTID > 0)
		{
			this.deleteItems = this.deleteItems.filter(function(c)
			{
				return c.id != data.id;
			});
			if (this._isEntityChange(data) || force)
			{
				this.updateItems.push(data);
			} else
			{
				this.updateItems = this.updateItems.filter(function(c)
				{
					return c.id != data.id;
				});
			}
		}
		else 
		{
			this.add(data);
		}
		this.isModified = this.countChange() > 0;

		return true;
	};

	GeofenceFeatureDataModel.prototype.add = function(data, force)
	{
		var exist = Enumerable.From(this.addItems).FirstOrDefault(null, function(c) { return c.id == data.id; });
		if (exist)
		{
			$.extend(exist, data);
		}
		else if (!data.OBJECTID)
		{
			this.addItems.push(data);
		} else
		{
			this.update(data, force);
		}
		this.deleteItems = this.deleteItems.filter(function(c)
		{
			return c.id != data.id;
		});
		this.isModified = this.countChange() > 0;
	};

	GeofenceFeatureDataModel.prototype.delete = function(data)
	{
		if (data.OBJECTID)
		{
			this.deleteItems.push(data);
		}
		for (var i = 0; i < this.addItems.length; i++)
		{
			if (this.addItems[i].id == data.id)
			{
				this.addItems.splice(i, 1);
				break;
			}
		}
		this.isModified = this.countChange() > 0;
	};

	GeofenceFeatureDataModel.prototype.mergeChange = function()
	{
		var changeData = this.getChangeDataArray();
		var allObject = $.extend({}, this.backupData);
		changeData.add.forEach(function(t)
		{
			allObject[t.id] = t;
		});
		changeData.edit.forEach(function(t)
		{
			allObject[t.id] = t;
		});
		changeData.delete.forEach(function(t)
		{
			if (allObject[t.id] && !Enumerable.From(changeData.add).FirstOrDefault(null, function(c) { return c.id == t.id; }))
			{
				delete allObject[t.id];
			}
		});
		var ans = [];
		for (var key in allObject)
		{
			ans.push(allObject[key]);
		}
		return ans;
	};

	GeofenceFeatureDataModel.prototype.clear = function(ids)
	{
		if (ids)
		{
			var idsEnum = Enumerable.From(ids);
			this.addItems = this.addItems.filter(function(c)
			{
				return !idsEnum.Any("$==" + c.id);
			});
			this.updateItems = this.updateItems.filter(function(c)
			{
				return !idsEnum.Any("$==" + c.id);
			});
			this.deleteItems = this.deleteItems.filter(function(c)
			{
				return !idsEnum.Any("$==" + c.id);
			});
			if (this.addItems.length == 0 && this.updateItems.length == 0 && this.deleteItems.length == 0)
			{
				this.isModified = false;
			}
		} else
		{
			this.addItems = [];
			this.updateItems = [];
			this.deleteItems = [];
			this.isModified = false;
			this._canQuery = false;
		}
	};

	GeofenceFeatureDataModel.prototype.dispose = function()
	{
		this.addItems = [];
		this.updateItems = [];
		this.deleteItems = [];
		this.isModified = false;
		this._canQuery = false;
		this.backupData = null;
	};
})();
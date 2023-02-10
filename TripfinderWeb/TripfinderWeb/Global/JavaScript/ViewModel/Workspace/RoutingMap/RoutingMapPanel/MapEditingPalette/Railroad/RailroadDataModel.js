(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").RailroadDataModel = RailroadDataModel;
	var helper = TF.RoutingMap.MapEditingPalette.RailroadHelper;

	function RailroadDataModel(viewModel)
	{
		var self = this;
		self.viewModel = viewModel;
		self._viewModal = viewModel.viewModel._viewModal;
		self.all = [];
		self.highlighted = [];
		self.selected = [];
		self.map = null;
		this.onAllChangeEvent = new TF.Events.Event();
		this.highlightChangedEvent = new TF.Events.Event();
		this.selectedChangedEvent = new TF.Events.Event();
		this.settingChangeEvent = new TF.Events.Event();
		this.featureData = this.createFeatureData(arcgisUrls.MapEditingOneService + "/42");
		this.lockData = new TF.RoutingMap.LockData({
			type: function() { return 'railroad'; },
			displayName: 'My Railroads',
			featureData: this.featureData,
			viewModel: this.viewModel.viewModel,
			getAutoRefreshSetting: this.getAutoRefreshSetting.bind(this),
			refreshOtherChangeData: this.refreshOtherChangeData.bind(this)
		});
		this.rebuildCrossPointUrl = arcgisUrls.MasterFileGDBGPService + "/CopyAndRebuild";
		this.travelScenarioViewModel = self.viewModel._viewModal.travelScenariosPaletteViewModel.travelScenariosViewModel;
	}

	RailroadDataModel.prototype.init = function()
	{
		var self = this;
		self.map = self.viewModel.viewModel._viewModal._map;
		self.onAllChangeEvent.notify({ add: [], edit: [], delete: self.all });
		return self.lockData.init()
			.then(function()
			{
				if (self.viewModel.showCount == 0)
				{
					return [];
				}
				return self.featureData.query();
			}).then(function(items)
			{
				var railroads = items;
				self.all = railroads;
				self.onAllChangeEvent.notify(
					{
						add: railroads,
						delete: [],
						edit: []
					});
				self.inited = true;
			}).catch(function(error)
			{
				TF.consoleOutput("error", "RailroadDataModel init fails: " + error);
			});
	};

	RailroadDataModel.prototype.getCount = function()
	{
		var self = this;
		if (!self.count)
		{
			return self.featureData.getCount().then(function(count)
			{
				self.count = count;
				return count;
			});
		}
		var data = self.featureData.getChangeData();
		return Promise.resolve(self.count + data.addGraphic.length - data.deleteGraphic.length);
	};

	RailroadDataModel.prototype.getSelected = function()
	{
		return this.selected;
	};

	RailroadDataModel.prototype.createFeatureData = function(url)
	{
		var self = this;
		return new TF.RoutingMap.FeatureDataModel(
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
	};

	RailroadDataModel.prototype.convertFeaterLayerDataToData = function(item)
	{
		var data = this.getDataModel();
		for (var key in item.attributes)
		{
			data[key] = item.attributes[key];
		}
		data.id = data.OBJECTID;
		data.geometry = item.geometry;
		data.FromElevation = item.attributes.FromElevation;
		data.ToElevation = item.attributes.ToElevation;
		return data;
	};

	RailroadDataModel.prototype.convertDataToFeaterLayerData = function(item)
	{
		return new tf.map.ArcGIS.Graphic(item.geometry, null, item);
	};

	RailroadDataModel.prototype.getDataModel = function()
	{
		return {
			OBJECTID: "",
			id: 0,
			Id: 0,
			// Feattyp: 0,
			// F_jnctid: 0,
			// F_jncttyp: 0,
			// T_jnctid: 0,
			// T_jncttyp: 0,
			// Meters: 0,
			Name: "",
			// Namelc: "",
			FromElevation: 0,
			ToElevation: 0,
			// Dispclass: 0,
			// Partstruc: 0,
			type: "railroad",
			geometry: null
		};
	};

	RailroadDataModel.prototype.setHighlighted = function(ids)
	{
		var self = this;
		var highlighted = [];
		var allMapping = TF.toMapping(this.all || []);
		ids.forEach(function(id)
		{
			if (allMapping[id])
			{
				highlighted.push(allMapping[id]);
			}
		});
		self.highlighted = highlighted;
		this.highlightChangedEvent.notify(highlighted);
	};

	RailroadDataModel.prototype.setSelected = function(ids)
	{
		var self = this;
		var selected = [];
		var allMapping = TF.toMapping(this.all || []);
		ids.forEach(function(id)
		{
			if (allMapping[id])
			{
				selected.push(allMapping[id]);
			}
		});
		self.selected = selected;
		this.selectedChangedEvent.notify(selected);
		this.lockData.setAndGetlockInfo([], true);
	};

	RailroadDataModel.prototype.getHighlighted = function()
	{
		return this.highlighted;
	};

	RailroadDataModel.prototype.findById = function(id)
	{
		for (var i = 0; i < this.all.length; i++)
		{
			if (this.all[i].id == id)
			{
				return this.all[i];
			}
		}
	};

	RailroadDataModel.prototype.addInGird = function(ids)
	{
		this.setSelected(Enumerable.From(this.selected.map(function(c) { return c.id; }).concat(ids)).Distinct().ToArray());
		this.setHighlighted(ids);
	};

	RailroadDataModel.prototype.addOrRemoveInGird = function(ids)
	{
		var self = this;
		var newSelectedIds = self.selected.map(function(c) { return c.id; }).concat(ids);
		var newHighlightedIds = self.highlighted.map(function(c) { return c.id; }).concat(ids);
		for (var i = 0; i < newSelectedIds.length - 1; i++)
		{
			for (var j = i + 1; j < newSelectedIds.length; j++)
			{
				if (newSelectedIds[i] == newSelectedIds[j])
				{
					newHighlightedIds = newHighlightedIds.filter(function(t) { return t != newSelectedIds[i]; });
					newSelectedIds.splice(j, 1);
					newSelectedIds.splice(i, 1);
					i--;
					break;
				}
			}
		}
		this.setSelected(newSelectedIds);
		this.setHighlighted(newHighlightedIds);
	};

	RailroadDataModel.prototype.isHighlighted = function(id)
	{
		if (!id)
		{
			return false;
		}
		var self = this;
		for (var i = 0; i < self.highlighted.length; i++)
		{
			if (self.highlighted[i].id == id)
			{
				return true;
			}
		}
		return false;
	};

	RailroadDataModel.prototype.isSelected = function(id)
	{
		if (!id)
		{
			return false;
		}
		var self = this;
		for (var i = 0; i < self.selected.length; i++)
		{
			if (self.selected[i].id === id)
			{
				return true;
			}
		}
		return false;
	};

	RailroadDataModel.prototype.refreshOtherChangeData = function(refreshIds)
	{
		var self = this;
		var deleteData = [];
		if (!refreshIds || refreshIds.length == 0)
		{
			return Promise.resolve();
		}
		refreshIds.forEach(function(id)
		{
			for (var i = 0; i < self.all.length; i++)
			{
				var obj = self.all[i];
				if (obj.id == id || obj.OBJECTID == id)
				{
					deleteData.push(obj);
					self.all.splice(i, 1);
					break;
				}
			}
		});
		this.onAllChangeEvent.notify({ add: [], edit: [], delete: deleteData });
		return this.featureData.query({
			where: "OBJECTID in (" + refreshIds.join(",") + ")"
		}).then(function(source)
		{
			self.all = self.all.concat(source);
			self.onAllChangeEvent.notify({ add: source, edit: [], delete: [] });
		});
	};

	RailroadDataModel.prototype.getAutoRefreshSetting = function()
	{
		return this.getSettingByKey(this.getStorageKey().autoRefreshStorageKey);
	};

	RailroadDataModel.prototype.create = function(newData)
	{
		var self = this;
		self._viewModal.revertMode = "create-railroads";
		self._viewModal.revertData = [];
		var data = this.getDataModel();
		for (var key in newData)
		{
			data[key] = newData[key];
		}
		self.insertToRevertData(data);
		self.all.push(data);
		self.featureData.add(data);
		self.onAllChangeEvent.notify({
			add: [data],
			delete: [],
			edit: []
		});
		self.lockData.calcSelfChangeCount();
		return data;
	};

	RailroadDataModel.prototype.insertToRevertData = function(data, oldRings)
	{
		this._viewModal.revertData.push($.extend({}, data, { geometry: oldRings ? new tf.map.ArcGIS.Polyline({ spatialReference: data.geometry.spatialReference, paths: oldRings }) : TF.cloneGeometry(data.geometry) }));
	};

	RailroadDataModel.prototype.update = function(modifyDataArray)
	{
		var self = this;
		self._viewModal.revertMode = "update-railroads";
		self._viewModal.revertData = [];
		var allMapping = TF.toMapping(this.all);
		if (!$.isArray(modifyDataArray)) { modifyDataArray = [modifyDataArray]; }
		modifyDataArray.forEach(function(modifyData)
		{
			var data = allMapping[modifyData.id];
			self.insertToRevertData(data, modifyData.oldRings);
			for (var key in data)
			{
				helper.setValue(modifyData, key, data);
			}
			if (modifyData.geometry)
			{
				data.geometry = TF.cloneGeometry(modifyData.geometry);
			}
			self.featureData.update(data);
			self.onAllChangeEvent.notify({
				add: [],
				delete: [],
				edit: [data]
			});
			self.lockData.calcSelfChangeCount();
		});
	};

	RailroadDataModel.prototype.save = function()
	{
		var self = this;
		if (self.saving)
		{
			return;
		}
		var changeData = this.featureData.getChangeData();
		PubSub.publish("clear_ContextMenu_Operation");
		self.clearRevertInfo();
		self.saving = true;
		return this.featureData.save(changeData).then(function()
		{
			self.lockData.saveData(changeData);
			self.lockData.unLockCurrentDocument();
			self.lockData.calcSelfChangeCount();
		}).then(function()
		{
			var message = {
				type: 'success',
				content: 'This record has been successfully saved.',
				autoClose: true
			};
			self._viewModal.obToastMessages.push(message);
			self.saving = false;
			self.travelScenarioViewModel.updateVectorTileService("Railroads");
			self.buildRailRoadCrossPoint();
		});
	};

	RailroadDataModel.prototype.buildRailRoadCrossPoint = function()
	{
		var self = this,
			processor = new tf.map.ArcGIS.Geoprocessor(self.rebuildCrossPointUrl),
			params = { "Delete Dataset": "DEL", "OnlyCalculateStreetRailRoad": "ONLY", "IsRunForPublish": "False" };
		processor.submitJob(params).then(function(jobInfo)
		{
			var jobid = jobInfo.jobId;
			processor.waitForJobCompletion(jobid, {}).then(function(result)
			{
				console.log("build railroad cross point finished!");
			})
		})
	};

	RailroadDataModel.prototype.delete = function(deleteArray)
	{
		var self = this;
		self._viewModal.revertMode = "delete-railroads";
		self._viewModal.revertData = [];
		deleteArray.forEach(function(segment)
		{
			var deleteData = self.findById(segment.id);
			self.insertToRevertData(deleteData);
			self.featureData.delete(deleteData);
			self.all = self.all.filter(function(c)
			{
				return c.id != segment.id;
			});

			self.onAllChangeEvent.notify({ add: [], edit: [], delete: [deleteData] });
			self.refreshSelectAndHighlighted();
			self.lockData.calcSelfChangeCount();
		});
	};

	RailroadDataModel.prototype.refreshSelectAndHighlighted = function()
	{
		var self = this;
		var allMapping = TF.toMapping(this.all);
		var selected = self.selected.filter(function(item)
		{
			return allMapping[item.id];
		}).map(function(item)
		{
			return item.id;
		});
		self.setSelected(selected);
		var highlighted = self.highlighted.filter(function(item)
		{
			return allMapping[item.id];
		}).map(function(item)
		{
			return item.id;
		});
		self.setHighlighted(highlighted);
	};

	RailroadDataModel.prototype.revert = function(showMessage)
	{
		var self = this;
		self.clearControls();
		self.onAllChangeEvent.notify({ add: [], edit: [], delete: self.all });
		self.setSelected([]);
		self.setHighlighted([]);
		self.init().then(function()
		{
			if (showMessage != false)
			{
				var message = {
					type: 'success',
					content: 'This record has been successfully reverted.',
					autoClose: true
				};
				self._viewModal.obToastMessages.push(message);
			}
		});
	};

	RailroadDataModel.prototype.close = function()
	{
		var self = this;
		self.clearControls();
		self.all = [];
	};

	RailroadDataModel.prototype.clearControls = function()
	{
		var self = this;
		self.featureData.clear();
		this.viewModel.editModal.closeEditModal();
		self.clearRevertInfo();
		PubSub.publish("clear_ContextMenu_Operation");
		self.lockData.unLockCurrentDocument();
		self.lockData.calcSelfChangeCount();
		self.viewModel.drawTool.stop();
		self.setSelected([]);
		self.setHighlighted([]);
	};

	// #region settings
	RailroadDataModel.prototype.getStorageKey = function()
	{
		return {
			autoRefreshStorageKey: 'autoRefreshRailroad',
			moveDuplicateNodesStorageKey: 'moveDuplicateNodesRailroad',
		};
	};

	RailroadDataModel.prototype.getSetting = function()
	{
		var self = this;
		var storageKey = this.getStorageKey();
		var setting = {
			autoRefresh: self.getSettingByKey(storageKey.autoRefreshStorageKey),
			moveDuplicateNodes: self.getSettingByKey(storageKey.moveDuplicateNodesStorageKey),
		};
		return Promise.resolve(setting);
	};

	RailroadDataModel.prototype.getSettingByKey = function(key)
	{
		var storage = tf.storageManager.get(key);
		if (storage == null)
		{
			storage = TF.convertToBoolean(tf.storageManager.get(key));
			tf.storageManager.save(key, storage);
		}
		else
		{
			storage = TF.convertToBoolean(storage);
		}
		return storage;
	};
	// #endregion

	RailroadDataModel.prototype.clearRevertInfo = function()
	{
		var self = this;
		self._viewModal.revertMode = "";
		self._viewModal.revertData = [];
	};

	RailroadDataModel.prototype.dispose = function()
	{
		this.onAllChangeEvent.unsubscribeAll();
		this.highlightChangedEvent.unsubscribeAll();
		this.selectedChangedEvent.unsubscribeAll();
		this.featureData.dispose();
		this.all = [];
	};
})();
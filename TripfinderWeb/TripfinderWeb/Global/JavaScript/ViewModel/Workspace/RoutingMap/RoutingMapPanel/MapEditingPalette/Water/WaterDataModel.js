(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").WaterDataModel = WaterDataModel;
	var helper = TF.RoutingMap.MapEditingPalette.WaterHelper;

	function WaterDataModel(viewModel)
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

		this.featureData = new TF.RoutingMap.MapEditingPalette.WaterFeatureData(self);
		this.lockData = new TF.RoutingMap.MapEditingPalette.WaterLockData(self);
		this.travelScenarioViewModel = self.viewModel._viewModal.travelScenariosPaletteViewModel.travelScenariosViewModel;
	}

	WaterDataModel.prototype.init = function()
	{
		var self = this;
		self.map = self.viewModel.viewModel._viewModal._map;
		self.loadedExtent = null;
		self.all = [];
		self.featureData.clear();
		self.onAllChangeEvent.notify({ add: [], edit: [], delete: self.all });
		return self.lockData.init()
			.then(function()
			{
				if (self.viewModel.viewModel.showCount > 0)
				{
					self.viewModel.drawTool.displayGraphicInExtent();
				}
				self.viewModel.display.setFooterDisplay();
			});
	};

	WaterDataModel.prototype.getDataInExtent = function(extent)
	{
		var self = this;
		var featureData = this.featureData;
		if (!self.map || self.map.mapView.zoom < self.viewModel.drawTool.minZoom)
		{
			return Promise.resolve();
		}
		if (self.loadedExtent && tf.map.ArcGIS.geometryEngine.contains(self.loadedExtent, extent))
		{
			return Promise.resolve();
		}
		if (!self.loadedExtent)
		{
			self.loadedExtent = extent;
		} else
		{
			self.loadedExtent = tf.map.ArcGIS.geometryEngine.union([self.loadedExtent, extent]);
		}

		return self.featureData.query(null, extent).then(function(items)
		{
			var newDataMapping = TF.toMapping(items, function(c) { return c.OBJECTID; });
			var oldDataMapping = TF.toMapping(self.all, function(c) { return c.OBJECTID; });
			var deleteDataMapping = TF.toMapping(featureData.deleteItems, function(c) { return c.OBJECTID; });
			for (var key in newDataMapping)
			{
				if (!oldDataMapping[key] && !deleteDataMapping[key])
				{
					var item = newDataMapping[key];
					self.all.push(item);
				}
			}
		});
	};

	WaterDataModel.prototype.getCount = function()
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

	WaterDataModel.prototype.getDataModel = function()
	{
		return this.featureData.getDataModel();
	};

	WaterDataModel.prototype.setHighlighted = function(ids)
	{
		var self = this;
		var highlighted = [];
		var mapping = TF.toMapping(this.all);
		ids.forEach(function(id)
		{
			if (mapping[id])
			{
				highlighted.push(mapping[id]);
			}
		});
		self.highlighted = highlighted;
		this.highlightChangedEvent.notify(highlighted);
	};

	WaterDataModel.prototype.setSelected = function(ids)
	{
		var self = this;
		var selected = [];
		var mapping = TF.toMapping(this.all);
		ids.forEach(function(id)
		{
			if (mapping[id])
			{
				selected.push(mapping[id]);
			}
		});
		self.selected = selected;
		this.selectedChangedEvent.notify(selected);
		this.lockData.setAndGetlockInfo([], true);
	};

	WaterDataModel.prototype.getHighlighted = function()
	{
		return this.highlighted;
	};

	WaterDataModel.prototype.findById = function(id)
	{
		for (var i = 0; i < this.all.length; i++)
		{
			if (this.all[i].id == id)
			{
				return this.all[i];
			}
		}
	};

	WaterDataModel.prototype.addInGird = function(ids)
	{
		this.setSelected(Enumerable.From(this.selected.map(function(c) { return c.id; }).concat(ids)).Distinct().ToArray());
		this.setHighlighted(ids);
	};

	WaterDataModel.prototype.addOrRemoveInGird = function(ids)
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

	WaterDataModel.prototype.isHighlighted = function(id)
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

	WaterDataModel.prototype.isSelected = function(id)
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

	WaterDataModel.prototype.getAutoRefreshSetting = function()
	{
		return this.getSettingByKey(this.getStorageKey().autoRefreshStorageKey);
	};

	WaterDataModel.prototype.isPolygon = function(data)
	{
		return data.geometry.type == "polygon";
	};

	WaterDataModel.prototype.create = function(newData)
	{
		var self = this;
		self._viewModal.revertMode = "create-Water";
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

	WaterDataModel.prototype.insertToRevertData = function(data)
	{
		this._viewModal.revertData.push($.extend({}, data, { geometry: TF.cloneGeometry(data.geometry) }));
	};

	WaterDataModel.prototype.update = function(modifyDataArray)
	{
		var self = this;
		self._viewModal.revertMode = "update-Water";
		self._viewModal.revertData = [];
		if (!$.isArray(modifyDataArray)) { modifyDataArray = [modifyDataArray]; }
		modifyDataArray.forEach(function(modifyData)
		{
			var data = self.findById(modifyData.id);
			self.insertToRevertData(data);
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

	WaterDataModel.prototype.save = function()
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
				type: "success",
				content: "This record has been successfully saved.",
				autoClose: true
			};
			self._viewModal.obToastMessages.push(message);
			self.saving = false;
			self.travelScenarioViewModel.updateVectorTileService("Water");
		});
	};

	WaterDataModel.prototype.delete = function(deleteArray)
	{
		var self = this;
		self._viewModal.revertMode = "delete-Water";
		self._viewModal.revertData = [];
		deleteArray.forEach(function(segment)
		{
			var deleteData = self.findById(segment.id);
			self.insertToRevertData(deleteData);
			self.featureData.delete(deleteData);
			self.all = self.all.filter(function(c) { return c.id != segment.id; });
			self.onAllChangeEvent.notify({ add: [], edit: [], delete: [deleteData] });
			self.refreshSelectAndHighlighted();
			self.lockData.calcSelfChangeCount();
		});
	};

	WaterDataModel.prototype.refreshSelectAndHighlighted = function()
	{
		var self = this;
		var mapping = TF.toMapping(this.all);
		var selected = self.selected.filter(function(item)
		{
			return mapping[item.id];
		}).map(function(item)
		{
			return item.id;
		});
		self.setSelected(selected);
		var highlighted = self.highlighted.filter(function(item)
		{
			return mapping[item.id];
		}).map(function(item)
		{
			return item.id;
		});
		self.setHighlighted(highlighted);
	};

	WaterDataModel.prototype.revert = function(showMessage)
	{
		var self = this;
		self.clearControls();
		self.onAllChangeEvent.notify({ add: [], edit: [], delete: self.all });
		self.init().then(function()
		{
			if (showMessage != false)
			{
				var message = {
					type: "success",
					content: "This record has been successfully reverted.",
					autoClose: true
				};
				self._viewModal.obToastMessages.push(message);
			}
		});
	};

	WaterDataModel.prototype.close = function()
	{
		var self = this;
		self.clearControls();
		self.all = [];
	};

	WaterDataModel.prototype.clearControls = function()
	{
		var self = this;
		self.featureData.clear();
		this.viewModel.editModal.closeEditModal();
		self.clearRevertInfo();
		PubSub.publish("clear_ContextMenu_Operation");
		self.lockData.unLockCurrentDocument();
		self.lockData.calcSelfChangeCount();
		self.setHighlighted([]);
		self.setSelected([]);
		self.viewModel.drawTool.stop();
	};

	WaterDataModel.prototype.trimStringSpace = function(item)
	{
		for (var key in item)
		{
			if (typeof item[key] === "string" || item[key] instanceof String)
			{
				item[key] = item[key].trim();
			}
		}
		return item;
	};

	// #region settings
	WaterDataModel.prototype.getStorageKey = function()
	{
		return {
			autoRefreshStorageKey: "autoRefreshWater",
			moveDuplicateNodesStorageKey: "moveDuplicateNodesWater",
			removeOverlappingStorageKey: "removeOverlappingWater"
		};
	};

	WaterDataModel.prototype.getSetting = function()
	{
		var self = this;
		var storageKey = this.getStorageKey();
		var setting = {
			autoRefresh: self.getSettingByKey(storageKey.autoRefreshStorageKey),
			moveDuplicateNodes: self.getSettingByKey(storageKey.moveDuplicateNodesStorageKey),
			removeOverlapping: self.getSettingByKey(storageKey.removeOverlappingStorageKey),
		};
		return Promise.resolve(setting);
	};

	WaterDataModel.prototype.getSettingByKey = function(key)
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

	WaterDataModel.prototype.clearRevertInfo = function()
	{
		var self = this;
		self._viewModal.revertMode = "";
		self._viewModal.revertData = [];
	};

	WaterDataModel.prototype.dispose = function()
	{
		this.onAllChangeEvent.unsubscribeAll();
		this.highlightChangedEvent.unsubscribeAll();
		this.selectedChangedEvent.unsubscribeAll();
		this.featureData.dispose();
		this.all = [];
		this.highlighted = [];
		this.selected = [];
		this.map = null;
	};
})();
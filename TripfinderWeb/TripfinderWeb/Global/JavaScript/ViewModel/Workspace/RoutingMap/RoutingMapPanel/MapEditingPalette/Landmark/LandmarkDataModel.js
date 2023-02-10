(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").LandmarkDataModel = LandmarkDataModel;
	var helper = TF.RoutingMap.MapEditingPalette.LandmarkHelper;

	function LandmarkDataModel(viewModel)
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

		this.featureData = new TF.RoutingMap.MapEditingPalette.LandmarkFeatureData(self);
		this.lockData = new TF.RoutingMap.MapEditingPalette.LandmarkLockData(self);
		this.travelScenarioViewModel = self.viewModel._viewModal.travelScenariosPaletteViewModel.travelScenariosViewModel;
	}

	LandmarkDataModel.prototype.init = function()
	{
		var self = this;
		self.map = self.viewModel.viewModel._viewModal._map;
		self.featureData.clear();
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
				var Landmarks = items;
				self.all = Landmarks;
				self.onAllChangeEvent.notify(
					{
						add: Landmarks,
						delete: [],
						edit: []
					});
				self.inited = true;
			}).catch(function(error)
			{
				TF.consoleOutput("error", "LandmarkDataModel init fails: " + error);
			});
	};

	LandmarkDataModel.prototype.getCount = function()
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

	LandmarkDataModel.prototype.getDataModel = function()
	{
		return this.featureData.getDataModel();
	};

	LandmarkDataModel.prototype.setHighlighted = function(ids)
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

	LandmarkDataModel.prototype.setSelected = function(ids)
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

	LandmarkDataModel.prototype.getHighlighted = function()
	{
		return this.highlighted;
	};

	LandmarkDataModel.prototype.getSelected = function()
	{
		return this.selected;
	};

	LandmarkDataModel.prototype.findById = function(id)
	{
		for (var i = 0; i < this.all.length; i++)
		{
			if (this.all[i].id == id)
			{
				return this.all[i];
			}
		}
	};

	LandmarkDataModel.prototype.addInGird = function(ids)
	{
		this.setSelected(Enumerable.From(this.selected.map(function(c) { return c.id; }).concat(ids)).Distinct().ToArray());
		this.setHighlighted(ids);
	};

	LandmarkDataModel.prototype.addOrRemoveInGird = function(ids)
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

	LandmarkDataModel.prototype.isHighlighted = function(id)
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

	LandmarkDataModel.prototype.isSelected = function(id)
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

	LandmarkDataModel.prototype.getAutoRefreshSetting = function()
	{
		return this.getSettingByKey(this.getStorageKey().autoRefreshStorageKey);
	};

	LandmarkDataModel.prototype.create = function(newData)
	{
		var self = this;
		self._viewModal.revertMode = "create-Landmarks";
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

	LandmarkDataModel.prototype.insertToRevertData = function(data)
	{
		this._viewModal.revertData.push($.extend({}, data, { geometry: TF.cloneGeometry(data.geometry) }));
	};

	LandmarkDataModel.prototype.update = function(modifyDataArray)
	{
		var self = this;
		self._viewModal.revertMode = "update-Landmarks";
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

	LandmarkDataModel.prototype.save = function()
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
			self.travelScenarioViewModel.updateVectorTileService("Landmarks");
		});
	};

	LandmarkDataModel.prototype.delete = function(deleteArray)
	{
		var self = this;
		self._viewModal.revertMode = "delete-Landmarks";
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

	LandmarkDataModel.prototype.refreshSelectAndHighlighted = function()
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

	LandmarkDataModel.prototype.revert = function(showMessage)
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

	LandmarkDataModel.prototype.close = function()
	{
		var self = this;
		self.clearControls();
		self.all = [];
	};

	LandmarkDataModel.prototype.clearControls = function()
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

	LandmarkDataModel.prototype.trimStringSpace = function(item)
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
	LandmarkDataModel.prototype.getStorageKey = function()
	{
		return {
			autoRefreshStorageKey: "autoRefreshLandmark",
			moveDuplicateNodesStorageKey: "moveDuplicateNodesLandmark",
			removeOverlappingStorageKey: "removeOverlappingLandmark"
		};
	};

	LandmarkDataModel.prototype.getSetting = function()
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

	LandmarkDataModel.prototype.getSettingByKey = function(key)
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

	LandmarkDataModel.prototype.clearRevertInfo = function()
	{
		var self = this;
		self._viewModal.revertMode = "";
		self._viewModal.revertData = [];
	};

	LandmarkDataModel.prototype.dispose = function()
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
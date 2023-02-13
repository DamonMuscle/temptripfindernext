(function()
{
	createNamespace("TF.RoutingMap").BaseMapDataModel = BaseMapDataModel;

	function BaseMapDataModel(viewModal, viewModel, dataModelName)
	{
		this._viewModal = viewModal;
		this.viewModel = viewModel;
		this.all = [];
		this.settings = {};
		this.highlighted = [];
		this.selected = [];
		this.dataModelName = dataModelName;
		this.onAllChangeEvent = new TF.Events.Event();
		this.highlightChangedEvent = new TF.Events.Event();
		this.selectedChangedEvent = new TF.Events.Event();
		this.settingChangeEvent = new TF.Events.Event();
		this.findById = this.findById.bind(this);
		this.getAutoRefreshSetting = this.getAutoRefreshSetting.bind(this);
		this.keyProperty = "id";
	}

	BaseMapDataModel.prototype.init = function() { };

	BaseMapDataModel.prototype.calcSelfChangeCount = function()
	{
		this.lockData.calcSelfChangeCount();
	};

	BaseMapDataModel.prototype.setHighlighted = function(items)
	{
		var self = this;
		self.highlighted = this._getDataModelItems(items);
		self.highlightChangedEvent.notify(self.highlighted);
	};

	BaseMapDataModel.prototype.setSelected = function(items)
	{
		var self = this;
		self.selected = this._getDataModelItems(items);
		if (self.sortSelected)
		{
			self.selected = self.sortSelected(self.selected);
		}
		self.selectedChangedEvent.notify(self.selected);
	};

	BaseMapDataModel.prototype._getDataModelItems = function(items)
	{
		var self = this;
		var records = [];
		items.forEach(function(item)
		{
			var id = typeof item == "object" ? item[self.keyProperty] : item;
			var selectedItem = Enumerable.From(self.all).FirstOrDefault(null, function(c) { return c[self.keyProperty] == id; });
			if (selectedItem)
			{
				records.push(selectedItem);
			}
		});
		return Enumerable.From(records).Distinct(function(c) { return c[self.keyProperty]; }).ToArray();
	};

	BaseMapDataModel.prototype.isSelected = function(id)
	{
		return this._findIdInArray(id, this.selected);
	};

	BaseMapDataModel.prototype.isHighlighted = function(id)
	{
		return this._findIdInArray(id, this.highlighted);
	};

	BaseMapDataModel.prototype._findIdInArray = function(id, array)
	{
		if (!id)
		{
			return false;
		}
		for (var i = 0; i < array.length; i++)
		{
			if (array[i][this.keyProperty] == id)
			{
				return true;
			}
		}
		return false;
	};

	BaseMapDataModel.prototype.refreshSelectAndHighlighted = function()
	{
		var self = this;
		var selected = self._filterExistsInAll(this.selected);
		self.setSelected(selected);

		var highlighted = self._filterExistsInAll(this.highlighted);
		self.setHighlighted(highlighted);
	};

	BaseMapDataModel.prototype._filterExistsInAll = function(array)
	{
		var self = this;
		return array.filter(function(item)
		{
			return self.findById(item[self.keyProperty]);
		});
	};

	BaseMapDataModel.prototype.findById = function(id)
	{
		for (var i = 0, l = this.all.length; i < l; i++)
		{
			if (this.all[i][this.keyProperty] == id)
			{
				return this.all[i];
			}
		}
	};

	BaseMapDataModel.prototype.addInGird = function(ids)
	{
		this.setSelected(Enumerable.From(this.selected.map(function(c) { return c[this.keyProperty]; }).concat(ids)).Distinct().ToArray());
		this.setHighlighted(ids);
	};

	BaseMapDataModel.prototype.addOrRemoveInGird = function(ids)
	{
		var self = this;
		var newSelectedIds = self.selected.map(function(c) { return c[self.keyProperty]; }).concat(ids);
		var newHighlightedIds = self.highlighted.map(function(c) { return c[self.keyProperty]; }).concat(ids);
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

	// #region setting
	BaseMapDataModel.prototype.getSetting = function(routeState, noPromise)
	{
		var storages = this.getStorage();
		var setting = {};
		for (var key in storages)
		{
			var storageKey = storages[key].key;
			var defaults = storages[key].default;
			var isLocal = storages[key].isLocal;
			if (isLocal)
			{
				setting[key] = this.settings[key] || defaults;
			} else
			{
				setting[key] = this.getSettingByKey(storageKey, routeState, defaults);
			}
		}
		if (noPromise)
		{
			return setting;
		}
		return Promise.resolve(setting);
	};

	BaseMapDataModel.prototype.getStorage = function()
	{
		return {};
	};

	BaseMapDataModel.prototype.getSettingByKey = function(key, routeState, defaults)
	{
		return BaseMapDataModel.getSettingByKey(key, defaults);
	};

	BaseMapDataModel.prototype.getSettingFromKey = function(name)
	{
		var storages = this.getStorage();
		var storageKey = storages[name].key;
		var defaults = storages[name].default;
		return this.getSettingByKey(storageKey, "", defaults);
	};

	BaseMapDataModel.getSettingByKey = function(key, defaults)
	{
		var type = typeof defaults;
		var storage = tf.storageManager.get(key);
		if (storage == null)
		{
			storage = defaults;
		}
		else if (type == "boolean")
		{
			storage = TF.convertToBoolean(storage);
		}
		if (type == "boolean")
		{
			storage = TF.convertToBoolean(storage);
		}
		return storage;
	};

	BaseMapDataModel.prototype.getAutoRefreshSetting = function()
	{
		return this._getSettingByKey("autoRefresh");
	};

	BaseMapDataModel.prototype.getMoveDuplicateNodesSetting = function()
	{
		return this._getSettingByKey("moveDuplicateNodes");
	};

	BaseMapDataModel.prototype.getRemoveOverlappingSetting = function()
	{
		return this._getSettingByKey("removeOverlapping");
	};

	BaseMapDataModel.prototype._getSettingByKey = function(key)
	{
		var storages = this.getStorage();
		var defaults = storages[key].default;
		return this.getSettingByKey(storages[key].key, this.routeState, defaults);
	};

	// #endregion

	BaseMapDataModel.prototype._showToastMessage = function(message, success)
	{
		message = {
			type: success ? "success" : "error",
			content: message,
			autoClose: true
		};
		this._viewModal.obToastMessages.push(message);
	};

	BaseMapDataModel.prototype.showSaveErrorToastMessage = function(message)
	{
		this._showToastMessage(message || "Save Failed.", false);
	};

	BaseMapDataModel.prototype.showSaveSuccessToastMessage = function()
	{
		this._showToastMessage("This record has been successfully saved.", true);
	};

	BaseMapDataModel.prototype.showRevertSuccessToastMessage = function()
	{
		this._showToastMessage("This record has been successfully reverted.", true);
	};

	BaseMapDataModel.prototype.insertToRevertData = function(data)
	{
		this._viewModal.revertData.push($.extend({}, data, { geometry: TF.cloneGeometry(data.geometry) }));
	};

	BaseMapDataModel.prototype.clearRevertInfo = function()
	{
		var self = this;
		self.clearContextMenuOperation();
		self._viewModal.revertMode = "";
		self._viewModal.revertData = [];
	};

	BaseMapDataModel.prototype.clearContextMenuOperation = function()
	{
		PubSub.publish("clear_ContextMenu_Operation");
	};

	BaseMapDataModel.prototype.convertServerToData = function()
	{
		return BaseMapDataModel.convertServerToData.apply(this, arguments);
	};

	BaseMapDataModel.convertServerToData = function(item, dataMaps)
	{
		var data = {};
		var attributesKeyMap = {};
		dataMaps.forEach(function(mapInfo)
		{
			attributesKeyMap[mapInfo.fromServer] = mapInfo.to;
		});
		for (var key in attributesKeyMap)
		{
			if (attributesKeyMap[key])
			{
				if (typeof item.attributes[key] === "string" || item.attributes[key] instanceof String)
				{
					data[attributesKeyMap[key]] = item.attributes[key].trim();
				}
				else
				{
					data[attributesKeyMap[key]] = item.attributes[key];
				}
			}
		}
		return data;
	};

	BaseMapDataModel.prototype.singleToArray = function(items)
	{
		if (!$.isArray(items))
		{
			return [items];
		}
		return items;
	};

	BaseMapDataModel.prototype.mapSourceToAll = function(source, all)
	{
		for (var i = 0; i < source.length; i++)
		{
			all[source[i][this.keyProperty]] = source[i];
		}
	};

	BaseMapDataModel.prototype.create = function() { };

	BaseMapDataModel.prototype.update = function() { };

	BaseMapDataModel.prototype.delete = function() { };

	BaseMapDataModel.prototype.save = function() { };

	BaseMapDataModel.prototype.revert = function() { };

	BaseMapDataModel.prototype.close = function()
	{
		var self = this;
		if (self.featureData)
		{
			self.featureData.clear();
		}
		if (self.viewModel && self.viewModel.editModal)
		{
			self.viewModel.editModal.closeEditModal();
		}
		self.clearRevertInfo();
		if (self.lockData)
		{
			self.lockData.unLockCurrentDocument();
			self.lockData.calcSelfChangeCount();
		}
		if (self.viewModel.editTool && self.viewModel.editTool.isEditing)
		{
			self.viewModel.editTool.stop();
		}
		self.onAllChangeEvent.notify({ add: [], edit: [], delete: self.all });
		self.all = [];
		self.setHighlighted([]);
		self.setSelected([]);
	};

	BaseMapDataModel.prototype.unSaveCheck = function()
	{
		var self = this;
		if (self.viewModel.editModal && self.viewModel.editModal.beforeChangeData && self.lockData)
		{
			return self.viewModel.editModal.beforeChangeData().then(function(ans)
			{
				if (ans)
				{
					return self.save().then(function()
					{
						return false;
					});
				}
				return self.lockData.obSelfChangeCount() > 0;
			});
		}
		throw "please implement your own unSaveCheck";
	};

	BaseMapDataModel.prototype.unSaveCheckConfirmBox = function()
	{
		var self = this;
		return tf.promiseBootbox.yesNo("You have unsaved changes.&nbsp;Would you like to save your changes?", "Unsaved Changes")
			.then(function(result)
			{
				if (result)
				{
					return self.save();
				}
				else if (result == false)
				{
					self.close();
					return Promise.resolve(true);
				}
			});
	};

	BaseMapDataModel.prototype.dispose = function()
	{
		this.onAllChangeEvent && this.onAllChangeEvent.unsubscribeAll();
		this.highlightChangedEvent && this.highlightChangedEvent.unsubscribeAll();
		this.selectedChangedEvent && this.selectedChangedEvent.unsubscribeAll();
		this.onAllChangeEvent = null;
		this.highlightChangedEvent = null;
		this.selectedChangedEvent = null;
		this.featureData && this.featureData.dispose();
	};
})();
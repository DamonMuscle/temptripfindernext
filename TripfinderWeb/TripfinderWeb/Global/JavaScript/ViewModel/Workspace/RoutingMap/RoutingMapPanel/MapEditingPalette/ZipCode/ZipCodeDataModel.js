(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").ZipCodeDataModel = ZipCodeDataModel;

	function ZipCodeDataModel(viewModel)
	{
		var self = this;
		this.viewModel = viewModel;
		self._viewModal = self.viewModel._viewModal;
		this.arcgis = tf.map.ArcGIS;
		this.oldItems = {};
		this.selectedChangedEvent = new TF.Events.Event();
		this.zipCodes = [];
		this.zipCodePropertyChangedEvent = new TF.Events.Event();
		this.zipCodeCollectionChangedEvent = new TF.Events.Event();
		this.highlightChangedEvent = new TF.Events.Event();
		this.onSettingChangeEvent = new TF.Events.Event();
		this.zipCodeFeatureData = this._createZipCodeFeatureData();

		this.zipCodeLockData = new TF.RoutingMap.LockData({
			type: function() { return "zipCode"; },
			displayName: "Postal Code Boundary",
			featureData: this.zipCodeFeatureData,
			viewModel: this.viewModel,
			getAutoRefreshSetting: this.getZipCodeAutoRefreshSetting.bind(this),
			refreshOtherChangeData: this.refreshOtherChangeZipCodeData.bind(this)
		});

		PubSub.subscribe(topicCombine(pb.DATA_CHANGE, "userprofile", pb.EDIT), function() { self._userProfileCache = null; });
	}

	ZipCodeDataModel.prototype.init = function()
	{
		this.fetchZipCode();
	};

	ZipCodeDataModel.prototype.createNewZipCode = function()
	{
		return {
			id: TF.createId(),
			OBJECTID: 0,
			name: "",
			zip: "",
			geometry: null,
			isSelected: false,
			isHighlighted: false,
			isLockedByOther: false,
			lockedByUser: "",
			type: "ZipCode",
		};
	};

	ZipCodeDataModel.prototype.getModifyStatus = function()
	{
		return this.zipCodeFeatureData.isModified;
	};

	ZipCodeDataModel.prototype.setHighlighted = function(regions)
	{
		var highlightedZipCode = [];

		this.zipCodes.forEach(function(item)
		{
			item.isHighlighted = false;
			regions.map(function(region)
			{
				if (region.id == item.id)
				{
					item.isSelected = true;
					return item.isHighlighted = true;
				}
			});
			if (item.isHighlighted)
			{
				highlightedZipCode.push(item);
			}
		});

		this.highlightChangedEvent.notify(highlightedZipCode);
	};

	ZipCodeDataModel.prototype.getHighlightedZipCode = function()
	{
		var self = this;
		var data = [];

		data = data.concat(this.zipCodes.filter(function(item)
		{
			return item.isHighlighted;
		}));
		return data;
	};

	ZipCodeDataModel.prototype.getEditableHighlightedZipCode = function()
	{
		return this.zipCodeLockData.filterUnLockItems(this.getHighlightedZipCode());
	};

	ZipCodeDataModel.prototype.getZipCodeHighlighted = function()
	{
		var self = this;
		var data = this.zipCodes.filter(function(item)
		{
			return item.isHighlighted;
		});
		return data;
	};

	ZipCodeDataModel.prototype.addZipCodeInGird = function(ids)
	{
		var self = this;
		if (ids.length === 0)
		{
			return;
		}
		var highlightedZipCode = [];
		this.zipCodes.forEach(function(item)
		{
			var currentSelected = false;
			ids.map(function(id)
			{
				if (id == item.id)
				{
					currentSelected = true;
				}
			});
			if (currentSelected)
			{
				item.isSelected = true;
				item.isHighlighted = true;
				highlightedZipCode.push(item);
			}
			else
			{
				item.isHighlighted = false;
			}
		});

		this.selectedChangedEvent.notify();
		this.highlightChangedEvent.notify(highlightedZipCode);
	};

	ZipCodeDataModel.prototype.addOrRemoveZipCodeInGird = function(ids)
	{
		var self = this;
		var highlightedZipCode = [];
		this.zipCodes.forEach(function(item)
		{
			ids.map(function(id)
			{
				if (id == item.id)
				{
					if (item.isSelected)
					{
						item.isSelected = false;
						item.isHighlighted = false;
						return;
					}

					item.isSelected = true;
					item.isHighlighted = true;
					return;

				}
			});
			if (item.isHighlighted)
			{
				highlightedZipCode.push(item);
			}
		});

		this.selectedChangedEvent.notify();
		this.highlightChangedEvent.notify(highlightedZipCode);
	};

	ZipCodeDataModel.prototype.setSelected = function(items)
	{
		var self = this;
		var zipCodeSelectedItems = [];

		this.zipCodes.forEach(function(item)
		{
			item.isSelected = Enumerable.From(items).Any(function(c) { return c.id == item.id; });
			if (item.isSelected)
			{
				zipCodeSelectedItems.push(item);
			}
		});
		this.selectedChangedEvent.notify(zipCodeSelectedItems);
	};

	ZipCodeDataModel.prototype.cancelSelected = function(items)
	{
		for (var i = 0; i < items.length; i++)
		{
			items[i].isSelected = false;
			items[i].isHighlighted = false;
		}
		this.selectedChangedEvent.notify();
		this.highlightChangedEvent.notify();
	};

	ZipCodeDataModel.prototype.getSelected = function()
	{
		var self = this;
		var data = [];
		data = self.zipCodes.filter(function(item)
		{
			return item.isSelected;
		});
		return data;
	};

	// #region ZipCode

	ZipCodeDataModel.prototype.getZipCodes = function()
	{
		return this.zipCodes;
	};

	ZipCodeDataModel.prototype.getSelectedZipCodes = function()
	{
		return this.zipCodes.filter(function(item)
		{
			return item.isSelected;
		});
	};

	ZipCodeDataModel.prototype._createZipCodeFeatureData = function()
	{
		var self = this;
		return new TF.RoutingMap.FeatureDataModel({
			url: arcgisUrls.MapEditingOneService + "/32",
			query: function(queryOption)
			{
				var query = new tf.map.ArcGIS.Query();
				query.outFields = ["*"];
				query.where = " 1=1 ";
				if (queryOption)
				{
					query.where += " and " + queryOption.where;
				}
				return query;
			},
			convertToData: function(item)
			{
				var d = {
					OBJECTID: item.attributes.OBJECTID,
					name: item.attributes.Name,
					zip: item.attributes.Name,
					geometry: item.geometry,
					type: "ZipCode",
				};
				return d;
			},
			convertToFeatureData: function(data)
			{
				var entity = {
					Name: data.name,
					ZIP: data.zip,
					id: data.id
				};
				if (data.OBJECTID)
				{
					entity.OBJECTID = data.OBJECTID;
				}
				return new self.arcgis.Graphic(data.geometry, null, data);
			}
		});
	};

	ZipCodeDataModel.prototype.fetchZipCode = function()
	{
		var self = this;
		return this.zipCodeLockData.init().then(function()
		{
			return self.zipCodeFeatureData.query(null, null, false).then(function(source)
			{
				if (source)
				{
					var zipCodeArray = source.map(function(data)
					{
						var zipCode = self.createNewZipCode();
						zipCode.id = data.OBJECTID;
						zipCode.OBJECTID = data.OBJECTID;
						zipCode.geometry = data.geometry;
						zipCode.name = data.name;
						zipCode.zip = data.zip;
						return zipCode;
					});
					self.zipCodes = zipCodeArray;
					self.zipCodeCollectionChangedEvent.notify({ add: zipCodeArray, delete: [] });
				}
			});
		});

	};
	ZipCodeDataModel.prototype.create = function(newData)
	{
		this.createZipCode(newData);
	}
	ZipCodeDataModel.prototype.createZipCode = function(newData)
	{
		var self = this, createData = [];
		self.viewModel._viewModal.revertMode = "create-zipCode";
		self.viewModel._viewModal.revertData = [];
		if (!$.isArray(newData.geometry))
		{
			newData.geometry = [newData.geometry];
		}
		for (var i = 0; i < newData.geometry.length; i++)
		{
			var data = this.createNewZipCode();
			if (newData.id)
			{
				data.OBJECTID = newData.OBJECTID;
				data.id = newData.id;
			}
			data.name = newData.name;
			data.zip = newData.zip;
			data.geometry = newData.geometry[i];
			this.zipCodes.push(data);
			this.zipCodeFeatureData.add(data);
			createData.push(data);
		}
		self.viewModel._viewModal.revertData = createData;
		this.zipCodeCollectionChangedEvent.notify({ add: createData, delete: [] });
		this.zipCodeLockData.calcSelfChangeCount();
		return createData[0];
	};

	ZipCodeDataModel.prototype.update = function(modifyDataArray)
	{
		var self = this;
		self.viewModel._viewModal.revertMode = "update-zipCode";
		self.viewModel._viewModal.revertData = [];
		modifyDataArray = self.singleToArray(modifyDataArray);
		modifyDataArray.forEach(function(modifyData)
		{
			var data = self.getZipCodeById(modifyData.id);
			self.viewModel._viewModal.revertData.push($.extend(true, {}, data));
			data.name = modifyData.zip;
			data.zip = modifyData.zip;
			if (modifyData.geometry)
			{
				data.geometry = modifyData.geometry.clone();
			}
			// log boundary to modify
			self.zipCodeFeatureData.update(data);
			self.zipCodePropertyChangedEvent.notify(data);
			self.zipCodeLockData.calcSelfChangeCount();
			// if (modifyData.isHighlighted)
			// {
			// 	self.viewModel.zipCodestreetModal.onHighLightChangedEvent();
			// }
		});
		//self.viewModel._viewModal.mapLayersPaletteViewModel.postalCodeBoundaryDisplaySetting.refreshMapLayerLabels();
	};

	ZipCodeDataModel.prototype.delete = function(zipCodeArray)
	{
		this.removeZipCode(zipCodeArray);
	};

	ZipCodeDataModel.prototype.removeZipCode = function(zipCodeArray)
	{
		var self = this;
		self.viewModel._viewModal.revertMode = "delete-zipCode";
		self.viewModel._viewModal.revertData = [];
		zipCodeArray.forEach(function(zipCode)
		{
			self.zipCodes = Enumerable.From(self.zipCodes).Where(function(c) { return c.id != zipCode.id; }).ToArray();
			self.zipCodeFeatureData.delete(zipCode);
			self.viewModel._viewModal.revertData.push(zipCode);
			self.zipCodeCollectionChangedEvent.notify({ add: [], delete: [zipCode] });
			self.zipCodeLockData.calcSelfChangeCount();
		});
	};

	ZipCodeDataModel.prototype.getZipCodeById = function(id)
	{
		return Enumerable.From(this.zipCodes).FirstOrDefault(null, function(c) { return c.id == id; });
	};

	ZipCodeDataModel.prototype.refreshOtherChangeZipCodeData = function(refreshIds)
	{
		var self = this;
		// delete exist graphic
		var deleteData = [];
		this.prepareOldStatus(self.zipCodes, "zipCode");
		if (!refreshIds || refreshIds.length == 0)
		{
			return Promise.resolve();
		}
		refreshIds.forEach(function(id)
		{
			for (var i = 0; i < self.zipCodes.length; i++)
			{
				if (self.zipCodes[i].id == id || self.zipCodes[i].OBJECTID == id)
				{
					deleteData.push(self.zipCodes[i]);
					self.zipCodes.splice(i, 1);
					i--;
				}
			}
		});
		this.zipCodeCollectionChangedEvent.notify({ add: [], delete: deleteData });
		return this.zipCodeFeatureData.query({
			where: "OBJECTID in (" + refreshIds.join(",") + ")"
		}).then(function(source)
		{

			var zipCodeArray = source.map(function(data)
			{
				var zipCode = self.createNewZipCode();
				zipCode.OBJECTID = data.OBJECTID;
				zipCode.id = data.OBJECTID;
				zipCode.geometry = data.geometry;
				zipCode.name = data.name;
				zipCode.zip = data.zip;
				return zipCode;
			});
			self.resetOldStatus(zipCodeArray, "zipCode");
			// refresh highlight
			self.zipCodes = self.zipCodes.concat(zipCodeArray);
			self.zipCodeCollectionChangedEvent.notify({ add: zipCodeArray, delete: [] });
		});
	};

	ZipCodeDataModel.prototype.save = function()
	{
		var self = this;
		var changeData = this.zipCodeFeatureData.getChangeData();
		PubSub.publish("clear_ContextMenu_Operation");
		self.clearRevertInfo();
		return this.zipCodeFeatureData.save(changeData).then(function()
		{
			self.zipCodeLockData.saveData(changeData);
			self.zipCodeLockData.unLockCurrentDocument();
			self.zipCodeLockData.calcSelfChangeCount();
		});
	};

	ZipCodeDataModel.prototype.revert = function()
	{
		var self = this;
		self.clearControls();
		self.zipCodeCollectionChangedEvent.notify({ add: [], delete: self.zipCodes });
		return self.fetchZipCode();
	};

	ZipCodeDataModel.prototype.close = function()
	{
		var self = this;
		self.clearControls();
		self.zipCodes = [];
	};

	ZipCodeDataModel.prototype.clearControls = function()
	{
		var self = this;
		self.zipCodeFeatureData.clear();
		self.zipCodeLockData.unLockCurrentDocument();
		self.zipCodeLockData.calcSelfChangeCount();
		self.viewModel.zipCodeEditModal.closeEditModal();
		self.clearRevertInfo();
		PubSub.publish("clear_ContextMenu_Operation");
		self.viewModel.drawTool && self.viewModel.drawTool.stop();
		self.setHighlighted([]);
		self.setSelected([]);
	};

	ZipCodeDataModel.prototype.getZipCodeStorageKey = function()
	{
		return {
			autoRefreshStorageKey: "autoRefreshZipCode",
			moveDuplicateNodeStorageKey: "moveDuplicateNodeZipCode",
			removeOverlappingStorageKey: "removeOverlappingZipCode"
		};
	};

	ZipCodeDataModel.prototype.getZipCodeSetting = function()
	{
		var self = this;
		var storageKey = this.getZipCodeStorageKey();
		var setting = {
			autoRefresh: self.getZipCodeAutoRefreshSetting(),
			moveDuplicateNode: TF.convertToBoolean(tf.storageManager.get(storageKey.moveDuplicateNodeStorageKey)),
			removeOverlapping: TF.convertToBoolean(tf.storageManager.get(storageKey.removeOverlappingStorageKey))
		};
		return Promise.resolve(true).then(function()
		{
			return setting;
		});
	};

	ZipCodeDataModel.prototype.getZipCodeAutoRefreshSetting = function()
	{
		var storageKey = this.getZipCodeStorageKey();
		var autoRefreshStorage = tf.storageManager.get(storageKey.autoRefreshStorageKey);
		if (autoRefreshStorage == null)
		{
			autoRefreshStorage = TF.convertToBoolean(tf.storageManager.get(storageKey.autoRefreshStorageKey));
			tf.storageManager.save(storageKey.autoRefreshStorageKey, autoRefreshStorage);
		}
		else
		{
			autoRefreshStorage = TF.convertToBoolean(autoRefreshStorage);
		}
		return autoRefreshStorage;
	};

	// #endregion

	ZipCodeDataModel.prototype.prepareOldStatus = function(items, key)
	{
		var oldItems = {};
		items.forEach(function(item)
		{
			oldItems[item.id] = { isSelected: item.isSelected, isHighlighted: item.isHighlighted };
		});
		this.oldItems[key] = oldItems;
	};

	ZipCodeDataModel.prototype.resetOldStatus = function(items, key)
	{
		var self = this;
		items.forEach(function(item)
		{
			if (self.oldItems[key] && self.oldItems[key][item.id])
			{
				item.isSelected = self.oldItems[key][item.id].isSelected;
				item.isHighlighted = self.oldItems[key][item.id].isHighlighted;
			}
		});
		self.oldItems[key] = null;
	};

	ZipCodeDataModel.prototype.appendClientKeyQuery = function()
	{
		return String.format(" and ClientKey='{0}' and DatabaseId = {1}", tf.authManager.clientKey, tf.datasourceManager.databaseId);
	};

	ZipCodeDataModel.prototype.isHighlighted = function(id)
	{
		if (!id)
		{
			return false;
		}
		var self = this;
		var highlightedItems = self.getHighlightedZipCode();
		for (var i = 0; i < highlightedItems.length; i++)
		{
			if (highlightedItems[i].id == id)
			{
				return true;
			}
		}
		return false;
	};
	ZipCodeDataModel.prototype.clearRevertInfo = function()
	{
		var self = this;
		self.viewModel._viewModal.revertMode = "";
		self.viewModel._viewModal.revertData = [];
	};

	ZipCodeDataModel.compare = function(a, b, propertyA)
	{
		if (a[propertyA] < b[propertyA])
		{
			return -1;
		}
		else if (a[propertyA] > b[propertyA])
		{
			return 1;
		}

		return 0;

	};

	ZipCodeDataModel.prototype.singleToArray = function(items)
	{
		if (!$.isArray(items))
		{
			return [items];
		}
		return items;
	};

	ZipCodeDataModel.prototype.dispose = function()
	{
		this.selectedChangedEvent.unsubscribeAll();
		this.zipCodePropertyChangedEvent.unsubscribeAll();
		this.zipCodeCollectionChangedEvent.unsubscribeAll();
		this.highlightChangedEvent.unsubscribeAll();
		this.zipCodes = null;
		this._userProfileCache = null;
		this.zipCodeFeatureData.dispose();
		this.oldItems = null;
	};
})();

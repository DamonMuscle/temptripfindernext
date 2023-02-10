(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").MunicipalBoundaryDataModel = MunicipalBoundaryDataModel;

	function MunicipalBoundaryDataModel(viewModel)
	{
		var self = this;
		this.viewModel = viewModel;
		this.arcgis = tf.map.ArcGIS;
		this.oldItems = {};
		this.municipalBoundaryFeatureDataUrl = arcgisUrls.MapEditingOneService + "/30";
		this.selectedChangedEvent = new TF.Events.Event();
		this.municipalBoundaries = [];
		this.municipalBoundaryPropertyChangedEvent = new TF.Events.Event();
		this.municipalBoundaryCollectionChangedEvent = new TF.Events.Event();
		this.highlightChangedEvent = new TF.Events.Event();
		this.municipalBoundaryFeatureData = this._createMunicipalBoundaryFeatureData();
		this.onSettingChangeEvent = new TF.Events.Event();

		this.municipalBoundaryLockData = new TF.RoutingMap.LockData({
			type: function() { return "municipalBoundary"; },
			displayName: "Postal Code Boundary",
			featureData: this.municipalBoundaryFeatureData,
			viewModel: this.viewModel,
			getAutoRefreshSetting: this.getMunicipalBoundaryAutoRefreshSetting.bind(this),
			refreshOtherChangeData: this.refreshOtherChangeMunicipalBoundaryData.bind(this)
		});

		PubSub.subscribe(topicCombine(pb.DATA_CHANGE, "userprofile", pb.EDIT), function() { self._userProfileCache = null; });
	}

	MunicipalBoundaryDataModel.prototype.init = function()
	{
		this.fetchMunicipalBoundary();
	};

	MunicipalBoundaryDataModel.prototype.createNewMunicipalBoundary = function()
	{
		return {
			id: TF.createId(),
			OBJECTID: 0,
			name: "",
			city: "",
			geometry: null,
			isSelected: false,
			isHighlighted: false,
			isLockedByOther: false,
			lockedByUser: "",
			type: "MunicipalBoundary",
		};
	};

	MunicipalBoundaryDataModel.prototype.getModifyStatus = function()
	{
		return this.municipalBoundaryFeatureData.isModified;
	};

	MunicipalBoundaryDataModel.prototype.setHighlighted = function(regions)
	{
		var highlightedMunicipalBoundary = [];

		this.municipalBoundaries.forEach(function(item)
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
				highlightedMunicipalBoundary.push(item);
			}
		});

		this.highlightChangedEvent.notify(highlightedMunicipalBoundary);
	};

	MunicipalBoundaryDataModel.prototype.getHighlighted = function()
	{
		var data = [];

		data = data.concat(this.municipalBoundaries.filter(function(item)
		{
			return item.isHighlighted;
		}));
		return data;
	};

	MunicipalBoundaryDataModel.prototype.getEditableHighlightedMunicipalBoundary = function()
	{
		return this.municipalBoundaryLockData.filterUnLockItems(this.getHighlighted());
	};

	MunicipalBoundaryDataModel.prototype.getMunicipalBoundaryHighlighted = function(type)
	{
		var data = this.municipalBoundaries.filter(function(item)
		{
			return item.isHighlighted;
		});
		return data;
	};

	MunicipalBoundaryDataModel.prototype.addMunicipalBoundaryInGird = function(ids)
	{
		if (ids.length === 0)
		{
			return;
		}
		var highlightedMunicipalBoundary = [];
		this.municipalBoundaries.forEach(function(item)
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
				highlightedMunicipalBoundary.push(item);
			}
			else
			{
				item.isHighlighted = false;
			}
		});

		this.selectedChangedEvent.notify();
		this.highlightChangedEvent.notify(highlightedMunicipalBoundary);
	};

	MunicipalBoundaryDataModel.prototype.addOrRemoveMunicipalBoundaryInGird = function(ids)
	{
		var highlightedMunicipalBoundary = [];
		this.municipalBoundaries.forEach(function(item)
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
				highlightedMunicipalBoundary.push(item);
			}
		});

		this.selectedChangedEvent.notify();
		this.highlightChangedEvent.notify(highlightedMunicipalBoundary);
	};

	MunicipalBoundaryDataModel.prototype.setSelected = function(items)
	{
		var municipalBoundarySelectedItems = [];

		this.municipalBoundaries.forEach(function(item)
		{
			item.isSelected = Enumerable.From(items).Any(function(c) { return c.id == item.id; });
			if (item.isSelected)
			{
				municipalBoundarySelectedItems.push(item);
			}
		});
		this.selectedChangedEvent.notify(municipalBoundarySelectedItems);
	};

	MunicipalBoundaryDataModel.prototype.cancelSelected = function(items)
	{
		for (var i = 0; i < items.length; i++)
		{
			items[i].isSelected = false;
			items[i].isHighlighted = false;
		}
		this.selectedChangedEvent.notify();
		this.highlightChangedEvent.notify();
	};

	MunicipalBoundaryDataModel.prototype.getSelected = function()
	{
		var self = this;
		var data = [];
		data = self.municipalBoundaries.filter(function(item)
		{
			return item.isSelected;
		});
		return data;
	};

	// #region MunicipalBoundary

	MunicipalBoundaryDataModel.prototype.getMunicipalBoundaries = function()
	{
		return this.municipalBoundaries;
	};

	MunicipalBoundaryDataModel.prototype.getSelectedMunicipalBoundaries = function()
	{
		return this.municipalBoundaries.filter(function(item)
		{
			return item.isSelected;
		});
	};

	MunicipalBoundaryDataModel.prototype._createMunicipalBoundaryFeatureData = function()
	{
		var self = this;
		return new TF.RoutingMap.FeatureDataModel({
			url: this.municipalBoundaryFeatureDataUrl,
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
					city: item.attributes.City,
					geometry: item.geometry,
					type: "MunicipalBoundary",
				};
				return d;
			},
			convertToFeatureData: function(data)
			{
				var entity = {
					Name: data.name,
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

	MunicipalBoundaryDataModel.prototype.fetchMunicipalBoundary = function()
	{
		var self = this;
		self.initData().then(function(municipalBoundaryArray)
		{
			self.municipalBoundaryCollectionChangedEvent.notify({ add: municipalBoundaryArray, delete: [] });
		}).catch(function(error)
		{
			TF.consoleOutput("error", "MunicipalBoundaryDataModel fetchMunicipalBoundary fails: " + error);
		});
	};

	MunicipalBoundaryDataModel.prototype.initData = function()
	{
		var self = this;
		return this.municipalBoundaryLockData.init().then(function()
		{
			return self.municipalBoundaryFeatureData.query(null, null, false).then(function(source)
			{
				var municipalBoundaryArray = source.map(function(data)
				{
					var municipalBoundary = self.createNewMunicipalBoundary();
					municipalBoundary.id = data.OBJECTID;
					municipalBoundary.OBJECTID = data.OBJECTID;
					municipalBoundary.geometry = data.geometry;
					municipalBoundary.name = data.name;
					municipalBoundary.city = data.city;
					return municipalBoundary;
				});
				self.municipalBoundaries = municipalBoundaryArray;
				return Promise.resolve(municipalBoundaryArray);
			});
		})
	}

	MunicipalBoundaryDataModel.prototype.create = function(newData)
	{
		var self = this, createData = [];
		self.viewModel._viewModal.revertMode = "create-municipalBoundary";
		self.viewModel._viewModal.revertData = [];
		if (!$.isArray(newData.geometry))
		{
			newData.geometry = [newData.geometry];
		}
		for (var i = 0; i < newData.geometry.length; i++)
		{
			var data = this.createNewMunicipalBoundary();
			if (newData.id)
			{
				data.OBJECTID = newData.OBJECTID;
				data.id = newData.id;
			}
			data.name = newData.name;
			data.geometry = newData.geometry[i];
			this.municipalBoundaries.push(data);
			this.municipalBoundaryFeatureData.add(data);
			createData.push(data);
		}
		self.viewModel._viewModal.revertData = createData;
		this.municipalBoundaryCollectionChangedEvent.notify({ add: createData, delete: [] });
		this.municipalBoundaryLockData.calcSelfChangeCount();
		return createData[0];
	};

	MunicipalBoundaryDataModel.prototype.update = function(modifyDataArray)
	{
		var self = this;
		self.viewModel._viewModal.revertMode = "update-municipalBoundary";
		self.viewModel._viewModal.revertData = [];
		if (!$.isArray(modifyDataArray)) { modifyDataArray = [modifyDataArray]; }
		modifyDataArray.forEach(function(modifyData)
		{
			var data = self.getMunicipalBoundaryById(modifyData.id);
			self.viewModel._viewModal.revertData.push($.extend(true, {}, data));
			data.name = modifyData.name;
			if (modifyData.geometry)
			{
				data.geometry = modifyData.geometry.clone();
			}
			self.municipalBoundaryFeatureData.update(data);
			self.municipalBoundaryPropertyChangedEvent.notify(data);
			self.municipalBoundaryLockData.calcSelfChangeCount();
		});
		//self.viewModel._viewModal.mapLayersPaletteViewModel.municipalBoundaryDisplaySetting.refreshMapLayerLabels();
	};
	MunicipalBoundaryDataModel.prototype.delete = function(municipalBoundaryArray)
	{
		var self = this;
		self.viewModel._viewModal.revertMode = "delete-municipalBoundary";
		self.viewModel._viewModal.revertData = [];
		municipalBoundaryArray.forEach(function(municipalBoundary)
		{
			self.municipalBoundaries = Enumerable.From(self.municipalBoundaries).Where(function(c) { return c.id != municipalBoundary.id; }).ToArray();
			self.municipalBoundaryFeatureData.delete(municipalBoundary);
			self.viewModel._viewModal.revertData.push(municipalBoundary);
			self.municipalBoundaryCollectionChangedEvent.notify({ add: [], delete: [municipalBoundary] });
			self.municipalBoundaryLockData.calcSelfChangeCount();
		});
	};

	MunicipalBoundaryDataModel.prototype.getMunicipalBoundaryById = function(id)
	{
		return Enumerable.From(this.municipalBoundaries).FirstOrDefault(null, function(c) { return c.id == id; });
	};

	MunicipalBoundaryDataModel.prototype.refreshOtherChangeMunicipalBoundaryData = function(refreshIds)
	{
		var self = this;
		// delete exist graphic
		var deleteData = [];
		this.prepareOldStatus(self.municipalBoundaries, "municipalBoundary");
		if (!refreshIds || refreshIds.length == 0)
		{
			return Promise.resolve();
		}
		refreshIds.forEach(function(id)
		{
			for (var i = 0; i < self.municipalBoundaries.length; i++)
			{
				if (self.municipalBoundaries[i].id == id || self.municipalBoundaries[i].OBJECTID == id)
				{
					deleteData.push(self.municipalBoundaries[i]);
					self.municipalBoundaries.splice(i, 1);
					i--;
				}
			}
		});
		this.municipalBoundaryCollectionChangedEvent.notify({ add: [], delete: deleteData });
		return this.municipalBoundaryFeatureData.query({
			where: "OBJECTID in (" + refreshIds.join(",") + ")"
		}).then(function(source)
		{

			var municipalBoundaryArray = source.map(function(data)
			{
				var municipalBoundary = self.createNewMunicipalBoundary();
				municipalBoundary.OBJECTID = data.OBJECTID;
				municipalBoundary.id = data.OBJECTID;
				municipalBoundary.geometry = data.geometry;
				municipalBoundary.name = data.name;
				municipalBoundary.city = data.city;
				return municipalBoundary;
			});
			self.resetOldStatus(municipalBoundaryArray, "municipalBoundary");
			// refresh highlight
			self.municipalBoundaries = self.municipalBoundaries.concat(municipalBoundaryArray);
			self.municipalBoundaryCollectionChangedEvent.notify({ add: municipalBoundaryArray, delete: [] });
		});
	};

	MunicipalBoundaryDataModel.prototype.saveMunicipalBoundary = function()
	{
		var self = this;
		var changeData = this.municipalBoundaryFeatureData.getChangeData();
		PubSub.publish("clear_ContextMenu_Operation");
		self.clearRevertInfo();
		return this.municipalBoundaryFeatureData.save(changeData).then(function()
		{
			self.municipalBoundaryLockData.saveData(changeData);
			self.municipalBoundaryLockData.unLockCurrentDocument();
			self.municipalBoundaryLockData.calcSelfChangeCount();
			// self.viewModel._viewModal._borderTool.onAllChangeEvent.notify({ add: { mcBorder: [], type: "municipal", initialLoad: true } });
		});
	};

	MunicipalBoundaryDataModel.prototype.revertMunicipalBoundary = function()
	{
		var self = this;
		self.clearControls();
		self.municipalBoundaryCollectionChangedEvent.notify({ add: [], delete: self.municipalBoundaries });
		//self.viewModel._viewModal.mapLayersPaletteViewModel.municipalBoundaryDisplaySetting.refreshMapLayerLabels();
		return self.fetchMunicipalBoundary();
	};

	MunicipalBoundaryDataModel.prototype.close = function()
	{
		var self = this;
		self.clearControls();
		self.municipalBoundaries = [];
		self.setHighlighted([]);
		self.setSelected([]);
	};

	MunicipalBoundaryDataModel.prototype.clearControls = function()
	{
		var self = this;
		self.municipalBoundaryFeatureData.clear();
		self.municipalBoundaryLockData.unLockCurrentDocument();
		self.municipalBoundaryLockData.calcSelfChangeCount();
		this.viewModel.municipalBoundaryEditModal.closeEditModal();
		self.viewModel.drawTool && self.viewModel.drawTool.stop();
		self.clearRevertInfo();
		PubSub.publish("clear_ContextMenu_Operation");
	};

	MunicipalBoundaryDataModel.prototype.getMunicipalBoundaryStorageKey = function()
	{
		return {
			autoRefreshStorageKey: "autoRefreshMunicipalBoundary",
			moveDuplicateNodeStorageKey: "moveDuplicateNodeMunicipalBoundary",
			removeOverlappingStorageKey: "removeOverlappingMunicipalBoundary"
		};
	};

	MunicipalBoundaryDataModel.prototype.getMunicipalBoundarySetting = function()
	{
		var self = this;
		var storageKey = this.getMunicipalBoundaryStorageKey();
		var setting = {
			autoRefresh: self.getMunicipalBoundaryAutoRefreshSetting(),
			moveDuplicateNode: TF.convertToBoolean(tf.storageManager.get(storageKey.moveDuplicateNodeStorageKey)),
			removeOverlapping: TF.convertToBoolean(tf.storageManager.get(storageKey.removeOverlappingStorageKey))
		};
		return Promise.resolve(true).then(function()
		{
			return setting;
		});
	};

	MunicipalBoundaryDataModel.prototype.getMunicipalBoundaryAutoRefreshSetting = function()
	{
		var storageKey = this.getMunicipalBoundaryStorageKey();
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

	MunicipalBoundaryDataModel.prototype.prepareOldStatus = function(items, key)
	{
		var oldItems = {};
		items.forEach(function(item)
		{
			oldItems[item.id] = { isSelected: item.isSelected, isHighlighted: item.isHighlighted };
		});
		this.oldItems[key] = oldItems;
	};

	MunicipalBoundaryDataModel.prototype.resetOldStatus = function(items, key)
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

	MunicipalBoundaryDataModel.prototype.appendClientKeyQuery = function()
	{
		return String.format(" and ClientKey='{0}' and DatabaseId = {1}", tf.authManager.clientKey, tf.datasourceManager.databaseId);
	};

	MunicipalBoundaryDataModel.prototype.isHighlighted = function(id)
	{
		if (!id)
		{
			return false;
		}
		var self = this;
		var highlightedItems = self.getHighlighted();
		for (var i = 0; i < highlightedItems.length; i++)
		{
			if (highlightedItems[i].id == id)
			{
				return true;
			}
		}
		return false;
	};
	MunicipalBoundaryDataModel.prototype.clearRevertInfo = function()
	{
		var self = this;
		self.viewModel._viewModal.revertMode = "";
		self.viewModel._viewModal.revertData = [];
	};

	MunicipalBoundaryDataModel.compare = function(a, b, propertyA)
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

	MunicipalBoundaryDataModel.prototype.dispose = function()
	{
		this.selectedChangedEvent.unsubscribeAll();
		this.municipalBoundaryPropertyChangedEvent.unsubscribeAll();
		this.municipalBoundaryCollectionChangedEvent.unsubscribeAll();
		this.highlightChangedEvent.unsubscribeAll();
		this.municipalBoundaries = null;
		this._userProfileCache = null;
		this.municipalBoundaryFeatureData.dispose();
	};
})();

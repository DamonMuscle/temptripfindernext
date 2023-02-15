(function()
{
	createNamespace("TF.RoutingMap.TravelScenariosPalette").TravelRegionsDataModel = TravelRegionsDataModel;

	function TravelRegionsDataModel(viewModel)
	{
		var self = this;
		this.viewModel = viewModel;
		this.arcgis = tf.map.ArcGIS;
		this.oldItems = {};
		this.selectedChangedEvent = new TF.Events.Event();
		this.travelRegions = [];
		this.travelRegionPropertyChangedEvent = new TF.Events.Event();
		this.travelRegionCollectionChangedEvent = new TF.Events.Event();
		this.highlightChangedEvent = new TF.Events.Event();
		this.onSettingChangeEvent = new TF.Events.Event();
		this.travelRegionFeatureData = TravelRegionsDataModel.createTravelRegionFeatureData();

		this.travelRegionLockData = new TF.RoutingMap.TravelScenariosPalette.TravelRegionsLockData({
			type: function() { return "travelRegion"; },
			displayName: "Travel Region",
			featureData: this.travelRegionFeatureData,
			viewModel: this.viewModel.viewModel,
			getAutoRefreshSetting: this.getTravelRegionAutoRefreshSetting.bind(this),
			refreshOtherChangeData: this.refreshOtherChangeTravelRegionData.bind(this)
		});

		self.isSaving = false;

		PubSub.subscribe(topicCombine(pb.DATA_CHANGE, "userprofile", pb.EDIT), function() { self._userProfileCache = null; });
		PubSub.subscribe("selected-travel-scenario-change" + self.viewModel._viewModal.routeState, self.selectedTravelScenarioChanged.bind(self));
		PubSub.subscribe("travel-scenario-delete" + self.viewModel._viewModal.routeState, this.deleteTravelScenario.bind(this));
		PubSub.subscribe("MapCanvasPublishedHub", self._travelScenarioApprovePublished.bind(self));
	}

	TravelRegionsDataModel.prototype.init = function()
	{
	};

	TravelRegionsDataModel.prototype.deleteTravelScenario = function(type, obj)
	{
		var travelRegionFeatureDeleteData = TravelRegionsDataModel.createTravelRegionFeatureData();
		return travelRegionFeatureDeleteData.query({ where: "ScenarioId = " + obj.Id }).then(function(source)
		{
			source.forEach(function(item)
			{
				travelRegionFeatureDeleteData.delete(item);
			});
			travelRegionFeatureDeleteData.save().then(function()
			{
				travelRegionFeatureDeleteData.dispose();
			});
		});
	};

	TravelRegionsDataModel.newCopyFromTravelScenario = function(objectIds)
	{
		let travelRegionFeatureData = TravelRegionsDataModel.createTravelRegionFeatureData();
		return travelRegionFeatureData.query({ where: "ScenarioId = " + objectIds.copyFromScenario.id() }).then(function(source)
		{
			if (!source.length)
			{
				return false;
			}

			var travelRegionArray = source.map(function(data)
			{
				var travelRegion = TravelRegionsDataModel.createNewTravelRegion();
				travelRegion.id = data.OBJECTID;
				travelRegion.OBJECTID = 0;
				travelRegion.geometry = data.geometry;
				travelRegion.name = data.name;
				travelRegion.type = data.type;
				travelRegion.weight = data.weight;
				travelRegion.scenarioId = objectIds.NewScenario.Id;
				travelRegion.clientKey = tf.authManager.clientKey;
				travelRegion.isChangeTime = data.isChangeTime;
				return travelRegion;
			});
			var travelRegionFeatureNewData = TravelRegionsDataModel.createTravelRegionFeatureData();
			travelRegionArray.forEach(function(item)
			{
				travelRegionFeatureNewData.add(item);
			});

			return travelRegionFeatureNewData.save().then(function()
			{
				travelRegionFeatureNewData.dispose();
				return true;
			});
		});
	};

	TravelRegionsDataModel.prototype.selectedTravelScenarioChanged = function(type, data)
	{
		var self = this;
		self.selectedTravelScenario = data;
		if (data)
		{
			self.selectedTravelScenarioId = data.Id;
			self.viewModel.obTravelScenarioIsSelected(true);
		}
		else
		{
			self.selectedTravelScenarioId = -1;
			self.viewModel.obTravelScenarioIsSelected(false);
		}
		if (self.viewModel.viewModel.obShow())
		{
			this.revertTravelRegion();
		}
	};

	TravelRegionsDataModel.createNewTravelRegion = function()
	{
		return {
			id: TF.createId(),
			OBJECTID: 0,
			name: "",
			// color: null,
			type: TF.RoutingMap.MapEditingPalette.Type.Preferred,
			weight: 0,
			geometry: null,
			isSelected: false,
			isHighlighted: false,
			isLockedByOther: false,
			lockedByUser: "",
			dataType: TF.RoutingMap.MapEditingPalette.DataType.TravelRegion,
			scenarioId: 0,
			clientKey: "",
			isChangeTime: 0
		};
	};

	TravelRegionsDataModel.prototype.getModifyStatus = function()
	{
		return this.travelRegionFeatureData.isModified;
	};

	TravelRegionsDataModel.prototype.setHighlighted = function(regions)
	{
		var highlightedTravelRegion = [];

		this.travelRegions.forEach(function(item)
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
				highlightedTravelRegion.push(item);
			}
		});

		this.highlightChangedEvent.notify(highlightedTravelRegion);
	};

	$.extend(createNamespace("TF.RoutingMap.MapEditingPalette"), {
		Type: { Preferred: 0, Restricted: 1, Prohibited: 2 },
		DataType: { TravelRegion: "TravelRegion" }
	});

	TravelRegionsDataModel.prototype.getColorByType = function(type)
	{
		switch (type)
		{
			case 0:
				return "#008800";
			case 1:
				return "#fdff31";
			case 2:
				return "#ff0000";
			default:
				return "#008800";
		}
	};

	TravelRegionsDataModel.prototype.getHighlightedTravelRegion = function()
	{
		var data = [];

		data = data.concat(this.travelRegions.filter(function(item)
		{
			return item.isHighlighted;
		}));
		return data;
	};

	TravelRegionsDataModel.prototype.getEditableHighlightedTravelRegion = function()
	{
		return this.travelRegionLockData.filterUnLockItems(this.getHighlightedTravelRegion());
	};

	TravelRegionsDataModel.prototype.getTravelHighlighted = function()
	{
		var data = this.travelRegions.filter(function(item)
		{
			return item.isHighlighted;
		});
		return data;
	};

	TravelRegionsDataModel.prototype.addTravelRegionInGird = function(ids)
	{
		if (ids.length === 0)
		{
			return;
		}
		var highlightedTravelRegion = [];
		this.travelRegions.forEach(function(item)
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
				highlightedTravelRegion.push(item);
			}
			else
			{
				item.isHighlighted = false;
			}
		});

		this.selectedChangedEvent.notify();
		this.highlightChangedEvent.notify(highlightedTravelRegion);
	};

	TravelRegionsDataModel.prototype.addOrRemoveTravelRegionInGird = function(ids)
	{
		var highlightedTravelRegion = [];
		this.travelRegions.forEach(function(item)
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
					else
					{
						item.isSelected = true;
						item.isHighlighted = true;
						return;
					}
				}
			});
			if (item.isHighlighted)
			{
				highlightedTravelRegion.push(item);
			}
		});

		this.selectedChangedEvent.notify();
		this.highlightChangedEvent.notify(highlightedTravelRegion);
	};

	TravelRegionsDataModel.prototype.setSelected = function(items)
	{
		var self = this;
		var selected = [];
		items.forEach(function(item)
		{
			var id = isNaN(item) ? item.id : item;
			var selectedItem = Enumerable.From(self.travelRegions).FirstOrDefault(null, function(c) { return c.id == id; });
			if (selectedItem)
			{
				selected.push(selectedItem);
			}
		});
		this.selectedChangedEvent.notify(selected);
	};

	TravelRegionsDataModel.prototype.cancelSelected = function(items)
	{
		for (var i = 0; i < items.length; i++)
		{
			items[i].isSelected = false;
			items[i].isHighlighted = false;
		}
		this.selectedChangedEvent.notify();
		this.highlightChangedEvent.notify();
	};

	TravelRegionsDataModel.prototype.getSelected = function()
	{
		var self = this;
		var data = [];
		data = self.travelRegions.filter(function(item)
		{
			return item.isSelected;
		});
		return data;
	};

	// #region TravelRegion

	TravelRegionsDataModel.prototype.getTravelRegions = function()
	{
		return this.travelRegions;
	};

	TravelRegionsDataModel.prototype.getSelectedTravelRegions = function()
	{
		return this.travelRegions.filter(function(item)
		{
			return item.isSelected;
		});
	};

	TravelRegionsDataModel.createTravelRegionFeatureData = function()
	{
		return new TF.RoutingMap.FeatureDataModel({
			url: TF.getOnlineUrl(arcgisUrls.MapEditingOneService + "/25"),
			query: function(queryOption)
			{
				var query = new tf.map.ArcGIS.Query();
				query.outFields = ["*"];
				query.outSpatialReference = new tf.map.ArcGIS.SpatialReference({ wkid: 4326 });
				query.where = " 1=1 ";
				if (queryOption)
				{
					query.where += " and " + queryOption.where;
				}
				return query;
			},
			convertToData: function(item)
			{
				item.geometry = tf.map.ArcGIS.webMercatorUtils.geographicToWebMercator(item.geometry);
				var d = {
					OBJECTID: item.attributes.OBJECTID,
					name: item.attributes.Name,
					geometry: item.geometry,
					weight: item.attributes.Weight,
					type: item.attributes.Type,
					dataType: TF.RoutingMap.MapEditingPalette.DataType.TravelRegion,
					scenarioId: item.attributes.ScenarioId,
					clientKey: item.attributes.ClientKey,
					id: item.attributes.OBJECTID,
					isChangeTime: item.attributes.IsChangeTime
				};
				return d;
			},
			convertToFeatureData: function(data)
			{
				var entity = {
					Name: data.name,
					Type: data.type,
					Weight: data.weight,
					OBJECTID: data.OBJECTID,
					ScenarioId: data.scenarioId,
					ClientKey: data.clientKey,
					isChangeTime: data.isChangeTime
				};
				return new tf.map.ArcGIS.Graphic(data.geometry, null, entity);
			}
		});
	};

	TravelRegionsDataModel.prototype.fetchTravelRegion = function(selectedTravelScenarioId)
	{
		var self = this;
		self._initTravelRegions(selectedTravelScenarioId).then(function(travelRegionArray)
		{
			self.travelRegionCollectionChangedEvent.notify({ add: travelRegionArray, delete: [] });
		});
	};

	TravelRegionsDataModel.prototype._initTravelRegions = function(selectedTravelScenarioId)
	{
		var self = this;
		return this.travelRegionLockData.init().then(function()
		{
			return self.travelRegionFeatureData.query({ where: "ScenarioId = " + selectedTravelScenarioId }).then(function(source)
			{
				var travelRegionArray = source.map(function(data)
				{
					var travelRegion = TravelRegionsDataModel.createNewTravelRegion();
					travelRegion.id = data.OBJECTID;
					travelRegion.OBJECTID = data.OBJECTID;
					travelRegion.geometry = data.geometry;
					travelRegion.name = data.name;
					travelRegion.type = data.type;
					travelRegion.weight = data.weight;
					travelRegion.scenarioId = data.scenarioId;
					travelRegion.clientKey = data.clientKey;
					travelRegion.isChangeTime = data.isChangeTime;
					return travelRegion;
				});
				self.travelRegions = travelRegionArray;
				return Promise.resolve(travelRegionArray);
			});
		}).catch(function(error)
		{
			console.log("TravelRegionsDataModel _initTravelRegions fails: " + error);
		});
	};

	TravelRegionsDataModel.prototype.create = function(newData)
	{
		var self = this, createData = [];
		self.viewModel._viewModal.revertMode = "create-travelRegion";
		self.viewModel._viewModal.revertData = [];
		if (!$.isArray(newData.geometry))
		{
			newData.geometry = [newData.geometry];
		}
		for (var i = 0; i < newData.geometry.length; i++)
		{
			var data = TravelRegionsDataModel.createNewTravelRegion();
			if (newData.id)
			{
				data.OBJECTID = newData.OBJECTID;
				data.id = newData.id;
			}
			data.name = newData.name;
			data.geometry = newData.geometry[i];
			data.type = newData.type;
			data.weight = newData.weight;
			data.scenarioId = self.selectedTravelScenarioId;
			data.clientKey = newData.clientKey;
			data.isChangeTime = newData.isChangeTime;
			this.travelRegions.push(data);
			this.travelRegionFeatureData.add(data);
			createData.push(data);
		}
		self.viewModel._viewModal.revertData = createData;
		this.travelRegionCollectionChangedEvent.notify({ add: createData, delete: [] });
		this.travelRegionLockData.calcSelfChangeCount();
		// TODO: uncomment this line if related palette add in the future
		//self.viewModel._viewModal.routingPaletteViewModel.dataModel.onWalkTSRestrictionChangeEvent.notify({ add: [createData[0]], edit: [], delete: [] });
		return createData[0];
	};

	TravelRegionsDataModel.prototype.update = function(modifyDataArray)
	{
		var self = this;
		self.viewModel._viewModal.revertMode = "update-travelRegion";
		self.viewModel._viewModal.revertData = [];
		modifyDataArray = self.singleToArray(modifyDataArray);
		modifyDataArray.forEach(function(modifyData)
		{
			var data = self.getTravelRegionById(modifyData.id);
			self.viewModel._viewModal.revertData.push($.extend(true, {}, data));
			data.name = modifyData.name;
			// data.color = modifyData.color;
			data.type = modifyData.type;
			data.weight = modifyData.weight;
			data.isChangeTime = modifyData.isChangeTime;
			if (modifyData.geometry)
			{
				data.geometry = modifyData.geometry.clone();
			}
			// log boundary to modify
			self.travelRegionFeatureData.update(data);
			self.travelRegionPropertyChangedEvent.notify(data);
			self.travelRegionLockData.calcSelfChangeCount();
			// TODO: uncomment this line if related palette add in the future
			// self.viewModel._viewModal.routingPaletteViewModel.dataModel.onWalkTSRestrictionChangeEvent.notify({ add: [], edit: [data], delete: [] });
		});
	};

	TravelRegionsDataModel.prototype.delete = function(travelRegionArray)
	{
		var self = this;
		self.viewModel._viewModal.revertMode = "delete-travelRegion";
		self.viewModel._viewModal.revertData = [];
		travelRegionArray.forEach(function(travelRegion)
		{
			self.travelRegions = Enumerable.From(self.travelRegions).Where(function(c) { return c.id != travelRegion.id; }).ToArray();
			self.travelRegionFeatureData.delete(travelRegion);
			self.viewModel._viewModal.revertData.push(travelRegion);
			self.travelRegionCollectionChangedEvent.notify({ add: [], delete: [travelRegion] });
			self.travelRegionLockData.calcSelfChangeCount();
			// TODO: uncomment this line if related palette add in the future
			// self.viewModel._viewModal.routingPaletteViewModel.dataModel.onWalkTSRestrictionChangeEvent.notify({ add: [], edit: [], delete: [travelRegion] });
		});
	};

	TravelRegionsDataModel.prototype.getTravelRegionById = function(id)
	{
		return Enumerable.From(this.travelRegions).FirstOrDefault(null, function(c) { return c.id == id; });
	};

	TravelRegionsDataModel.prototype.refreshOtherChangeTravelRegionData = function(refreshIds)
	{
		var self = this;
		// delete exist graphic
		var deleteData = [];
		this.prepareOldStatus(self.travelRegions, "travel");
		if (!refreshIds || refreshIds.length == 0)
		{
			return Promise.resolve();
		}
		refreshIds.forEach(function(id)
		{
			for (var i = 0; i < self.travelRegions.length; i++)
			{
				var travelRegion = self.travelRegions[i];
				if (travelRegion.OBJECTID == id || travelRegion.id == id)
				{
					deleteData.push(travelRegion);
					self.travelRegions.splice(i, 1);
					i--;
				}
			}
		});
		this.travelRegionCollectionChangedEvent.notify({ add: [], delete: deleteData });
		return this.travelRegionFeatureData.query({
			where: "OBJECTID in (" + refreshIds.join(",") + ")"
		}).then(function(source)
		{
			var travelRegionArray = source.map(function(data)
			{
				var travelRegion = TravelRegionsDataModel.createNewTravelRegion();
				travelRegion.OBJECTID = data.OBJECTID;
				travelRegion.id = data.OBJECTID;
				travelRegion.geometry = data.geometry;
				travelRegion.name = data.name;
				travelRegion.type = data.type;
				travelRegion.weight = data.weight;
				travelRegion.isChangeTime = data.isChangeTime;
				travelRegion.scenarioId = data.scenarioId;
				travelRegion.clientKey = data.clientKey;
				return travelRegion;
			});
			self.resetOldStatus(travelRegionArray, "travel");
			// refresh highlight
			self.travelRegions = self.travelRegions.concat(travelRegionArray);
			self.travelRegionCollectionChangedEvent.notify({ add: travelRegionArray, delete: [] });
		});
	};

	TravelRegionsDataModel.prototype.saveTravelRegion = function()
	{
		let self = this, p = Promise.resolve(true),
			changeData = this.travelRegionFeatureData.getChangeData(),
			travelScenariosViewModel = self.viewModel.viewModel.travelScenariosViewModel,
			travelScenario = travelScenariosViewModel.obPreviousSelectedTravelScenarios ? travelScenariosViewModel.obPreviousSelectedTravelScenarios : travelScenariosViewModel.obSelectedTravelScenarios();
		PubSub.publish("clear_ContextMenu_Operation");
		self.clearRevertInfo();
		self.isSaving = true;
		travelScenariosViewModel.lock([travelScenario.Id]);
		if (self.travelRegionLockData.obSelfChangeCount() > 0)
		{
			self.changeScenarioApproveStatus(changeData);
			p = this.travelRegionFeatureData.save(changeData).then(() =>
			{
				self.travelRegionLockData.saveData(changeData);
				self.travelRegionLockData.unLockCurrentDocument();

				// TODO: uncomment this line if need to create MMPK file
				// self.createMmpk();
				return Promise.resolve(true);
			}).catch((ex) =>
			{
				self.travelRegionsViewModel._viewModal.obToastMessages.push({
					type: 'error',
					content: 'Save failed',
					autoClose: true
				});
				return Promise.resolve(false);
			});
		}

		return p.then(result =>
		{
			if (result)
			{
				travelScenariosViewModel.ApproveSelectTravelScenario(travelScenario, self._saveTravelRegionCallback.bind(self), "Travel Region");
			}
			else
			{
				travelScenariosViewModel.unLock([travelScenario.Id]);
			}
		});
	};

	TravelRegionsDataModel.prototype.createMmpk = function()
	{
		if (!this.createMmpkMessageSubscription)
		{
			this.createMmpkMessageSubscription = TF.CreateMmpkService.instance.messageOutput.subscribe((e, data) =>
			{
				this.changeCreateMmpkMessage(data);
			});
		}

		TF.CreateMmpkService.instance.execute().then(() =>
		{
			this.createMmpkMessage = null;
			if (this.createMmpkMessageSubscription)
			{
				this.createMmpkMessageSubscription.dispose();
				this.createMmpkMessageSubscription = null;
			}
		});
	};

	TravelRegionsDataModel.prototype.changeCreateMmpkMessage = function(message)
	{
		messages = this.viewModel._viewModal.obToastMessages;
		if (this.createMmpkMessage && messages.indexOf(this.createMmpkMessage) > -1)
		{
			messages.replace(this.createMmpkMessage, message);
		}
		else
		{
			messages.push(message);
		}

		this.createMmpkMessage = message;
	};

	TravelRegionsDataModel.prototype._saveTravelRegionCallback = function(ans)
	{
		let self = this;
		self.travelRegionLockData.calcSelfChangeCountAndStyle(ans);
		self.isSaving = false;
	};

	TravelRegionsDataModel.prototype._travelScenarioApprovePublished = function(name, result)
	{
		let self = this,
			travelScenarioId = self.viewModel.viewModel.travelScenariosViewModel.obSelectedTravelScenarios().Id,
			changeStyle = result ? result.TravelScenarioStatus ? result.TravelScenarioStatus.filter(r => r.Id === travelScenarioId && r.Approve === 1).length > 0 ? false : true : true : true;
		self.travelRegionLockData.obSelfChangeStyle(changeStyle);
	};

	TravelRegionsDataModel.prototype.changeScenarioApproveStatus = function(changeData)
	{
		var self = this;
		if (self.selectedTravelScenario && self.selectedTravelScenario.Approve != -1 &&
			(changeData.addGraphic.length != 0 || changeData.editGraphic.length != 0 || changeData.deleteGraphic.length != 0))
		{
			tf.promiseAjax.patch(pathCombine(tf.api.apiPrefixWithoutDatabase(), "travelscenarios"), {
				data: [
					{ "op": "replace", "path": "/Approve", "value": 0 },
				],
				paramData: {
					id: self.selectedTravelScenarioId
				}
			});
			PubSub.publish("ScenarioApproveStatusChange");
		}
	};

	TravelRegionsDataModel.prototype.revertTravelRegion = function()
	{
		var self = this;
		self.inited = true;
		self.clearControls();
		this.fetchTravelRegion(self.selectedTravelScenarioId);
	};

	TravelRegionsDataModel.prototype.revertTravelRegionAfterUnSaveChange = function()
	{
		var self = this;
		self.inited = true;
		self.clearControls();
	};

	TravelRegionsDataModel.prototype.close = function()
	{
		var self = this;
		self.clearControls();
		// self.travelRegions = [];
	};

	TravelRegionsDataModel.prototype.clearControls = function()
	{
		var self = this;
		self.travelRegionFeatureData.clear();
		self.travelRegionLockData.unLockCurrentDocument();
		self.travelRegionLockData.calcSelfChangeCount();
		self.travelRegionCollectionChangedEvent.notify({ add: [], delete: this.travelRegions });
		this.viewModel.travelRegionEditModal.closeEditModal();
		this.viewModel.drawTool && this.viewModel.drawTool.stop();
		self.clearRevertInfo();
		PubSub.publish("clear_ContextMenu_Operation");
		self.setHighlighted([]);
		self.setSelected([]);
	};

	TravelRegionsDataModel.prototype.getTravelRegionStorageKey = function()
	{
		return {
			autoRefreshStorageKey: "autoRefreshTravelRegion",
			moveDuplicateNodeStorageKey: "moveDuplicateNodeTravelRegion",
			removeOverlappingStorageKey: "removeOverlappingTravelRegion"
		};
	};

	TravelRegionsDataModel.prototype.getTravelRegionSetting = function()
	{
		var self = this;
		var storageKey = this.getTravelRegionStorageKey();
		var setting = {
			autoRefresh: self.getTravelRegionAutoRefreshSetting(),
			moveDuplicateNode: TF.convertToBoolean(tf.storageManager.get(storageKey.moveDuplicateNodeStorageKey)),
			removeOverlapping: TF.convertToBoolean(tf.storageManager.get(storageKey.removeOverlappingStorageKey))
		};
		return Promise.resolve(true).then(function()
		{
			return setting;
		});
	};

	TravelRegionsDataModel.prototype.getTravelRegionAutoRefreshSetting = function()
	{
		var storageKey = this.getTravelRegionStorageKey();
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

	TravelRegionsDataModel.prototype.prepareOldStatus = function(items, key)
	{
		var oldItems = {};
		items.forEach(function(item)
		{
			oldItems[item.id] = { isSelected: item.isSelected, isHighlighted: item.isHighlighted };
		});
		this.oldItems[key] = oldItems;
	};

	TravelRegionsDataModel.prototype.resetOldStatus = function(items, key)
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

	TravelRegionsDataModel.prototype.appendClientKeyQuery = function()
	{
		return String.format(" and ClientKey=\"{0}\" and DatabaseId = {1}", tf.authManager.clientKey, tf.datasourceManager.databaseId);
	};

	TravelRegionsDataModel.prototype.isHighlighted = function(id)
	{
		if (!id)
		{
			return false;
		}
		var self = this;
		var highlightedItems = self.getHighlightedTravelRegion();
		for (var i = 0; i < highlightedItems.length; i++)
		{
			if (highlightedItems[i].id == id)
			{
				return true;
			}
		}
		return false;
	};

	TravelRegionsDataModel.prototype.clearRevertInfo = function()
	{
		var self = this;
		self.viewModel._viewModal.revertMode = "";
		self.viewModel._viewModal.revertData = [];
	};

	TravelRegionsDataModel.compare = function(a, b, propertyA)
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

	TravelRegionsDataModel.prototype.singleToArray = function(items)
	{
		if (!$.isArray(items))
		{
			return [items];
		}
		return items;
	};

	TravelRegionsDataModel.prototype.dispose = function()
	{
		this.selectedChangedEvent.unsubscribeAll();
		this.travelRegionPropertyChangedEvent.unsubscribeAll();
		this.travelRegionCollectionChangedEvent.unsubscribeAll();
		this.highlightChangedEvent.unsubscribeAll();
		this.travelRegions = null;
		this._userProfileCache = null;
		this.travelRegionFeatureData.dispose();
		if (this.createMmpkMessageSubscription)
		{
			this.createMmpkMessageSubscription.dispose();
			this.createMmpkMessageSubscription = null;
		}
	};
})();

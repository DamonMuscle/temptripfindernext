(function()
{
	createNamespace("TF.RoutingMap.TravelScenariosPalette").TravelScenariosDataModel = TravelScenariosDataModel;

	function TravelScenariosDataModel(viewModel)
	{
		var self = this;
		self.viewModel = viewModel;
		self.travelScenariosSelectedChangedEvent = new TF.Events.Event();
		self.travelScenariosCollectionChangedEvent = new TF.Events.Event();
		this.settingChangeEvent = new TF.Events.Event();
		self.travelScenarios = [];
		PubSub.subscribe("travel-scenario-collection-change" + viewModel.routeState, this.getAllTravelScenarios.bind(this));
		self.onMenuDataUpdateChange = self.onMenuDataUpdateChange.bind(this);
		self.viewModel._viewModal.menuDataUpdateEvent.subscribe(this.onMenuDataUpdateChange);
		self.lockData = new TF.RoutingMap.TravelScenariosPalette.TravelScenariosLockData();
	}

	TravelScenariosDataModel.prototype.init = function()
	{
		var self = this;
		return this.initData().then(function(travelScenario)
		{
			self.viewModel.viewModel.travelRegionsViewModel.dataModel._initTravelRegions(travelScenario.Id);
			self.viewModel.streetCurbTurnDataModel.getCurbData(travelScenario);
		});
	};

	TravelScenariosDataModel.prototype.onMenuDataUpdateChange = function(e, data)
	{
		var self = this;
		if (Enumerable.From(data.UpdatedRecords).Any(function(c) { return c.Type == "TravelScenario"; }))
		{
			self.getAllTravelScenarios();
		}
	};

	TravelScenariosDataModel.prototype.getTravelScenarios = function()
	{
		return this.travelScenarios;
	};

	TravelScenariosDataModel.prototype.setLastSelectedTravelScenario = function(travelScenarios)
	{
		return tf.storageManager.save("travelScenarios-last-select-value", travelScenarios);
	};

	TravelScenariosDataModel.prototype.getAllTravelScenarios = function()
	{
		var self = this;
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase("v2"), "travelscenarios")).then(function(data)
		{
			self.travelScenarios = data.Items;
			self.travelScenariosCollectionChangedEvent.notify({ add: self.travelScenarios, delete: [] });
		});
	};

	TravelScenariosDataModel.prototype.initData = function()
	{
		var self = this;
		var p1 = self.getLastSelectedTravelScenario();
		var p2 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase("v2"), "travelscenarios"));
		return Promise.all([p1, p2]).then(function(data)
		{
			self.travelScenarios = data[1].Items;
			self.travelScenariosCollectionChangedEvent.notify({ add: self.travelScenarios, delete: [] });
			var travelScenario;
			if (data[0] != null)
			{
				travelScenario = self.getTravelScenariosById(data[0] ? data[0].Id : 1);
			}
			if (!travelScenario && self.travelScenarios.length > 0)
			{
				travelScenario = self.travelScenarios[0];
			}
			if (!self.viewModel.obSelectedTravelScenarios() ||
				self.viewModel.obSelectedTravelScenarios().id != travelScenario.id)
			{
				self.viewModel.obSelectedTravelScenarios(travelScenario);
			}
			return Promise.resolve(self.viewModel.obSelectedTravelScenarios());
		});
	};

	TravelScenariosDataModel.prototype.getLastSelectedTravelScenario = function()
	{
		var lastValue = tf.storageManager.get("travelScenarios-last-select-value");
		return lastValue;
	};

	TravelScenariosDataModel.prototype.deleteScenarioById = function(scenarioId)
	{
		var self = this;
		this.getAllTravelScenarios().then(function()
		{
			if (self.viewModel.obSelectedTravelScenarios() && scenarioId == self.viewModel.obSelectedTravelScenarios().Id)
			{
				self.viewModel.obSelectedTravelScenarios(null);
			}
		});

		TravelScenariosDataModel.unUseTravelScenario(scenarioId, this.viewModel.routeState);
	};

	TravelScenariosDataModel.prototype.openTravelScenario = function(travelScenario)
	{
		var self = this;
		PubSub.publish("clear_ContextMenu_Operation");
		self.viewModel.obSelectedTravelScenarios(travelScenario);
		return Promise.resolve(true);
	};

	TravelScenariosDataModel.prototype.compare = function(a, b, propertyA)
	{
		if (a[propertyA] < b[propertyA])
		{
			return -1;
		}
		else if (a[propertyA] > b[propertyA])
		{
			return 1;
		}
		else
		{
			return 0;
		}
	};

	TravelScenariosDataModel.prototype.update = function(modifyDataArray)
	{

	};

	TravelScenariosDataModel.prototype.getTravelScenariosById = function(id)
	{
		return Enumerable.From(this.travelScenarios).FirstOrDefault(null, function(c) { return c.Id == id; });
	};

	TravelScenariosDataModel.prototype.saveTravelScenarios = function()
	{
		PubSub.publish("clear_ContextMenu_Operation");
	};

	TravelScenariosDataModel.prototype.appendClientKeyQuery = function()
	{
		return String.format(" and ClientKey='{0}' and DatabaseId = {1}", tf.authManager.clientKey, tf.datasourceManager.databaseId);
	};

	TravelScenariosDataModel.prototype.isLocked = function(id)
	{
		return tf.lockData.isLocked(id, "travelScenarios", "-999");
	};

	// #region settings

	TravelScenariosDataModel.prototype.getStorageKey = function()
	{
		return {
			showStreetStorageKey: "showStreet",
			showCurbStorageKey: "showCurb",
			showManeuversStorageKey: "showManeuvers",
		};
	};

	TravelScenariosDataModel.prototype.getSetting = function()
	{
		var storageKey = this.getStorageKey();
		var setting = {
			showStreet: TF.RoutingMap.BaseMapDataModel.getSettingByKey(storageKey.showStreetStorageKey, true),
			showCurb: TF.RoutingMap.BaseMapDataModel.getSettingByKey(storageKey.showCurbStorageKey, false),
			showManeuvers: TF.RoutingMap.BaseMapDataModel.getSettingByKey(storageKey.showManeuversStorageKey, false)
		};
		return Promise.resolve(setting);
	};

	TravelScenariosDataModel.prototype.dispose = function()
	{
		this.travelScenariosSelectedChangedEvent.unsubscribeAll();
		this.travelScenariosCollectionChangedEvent.unsubscribeAll();
		this.travelScenarios = null;
		this.viewModel._viewModal.menuDataUpdateEvent.unsubscribe(this.onMenuDataUpdateChange);

		var selfLocks = JSON.parse(tf.storageManager.get("selfLockRoutes", true) || "{}");
		if (selfLocks[this.viewModel.routeState + "-travelScenarioUseLock"] && selfLocks[this.viewModel.routeState + "-travelScenarioUseLock"].ids)
		{
			TravelScenariosDataModel.unUseTravelScenario(selfLocks[this.viewModel.routeState + "-travelScenarioUseLock"].ids, this.viewModel.routeState);
		}
	};

	// #endregion

	TravelScenariosDataModel.useTravelScenario = function(id, routeState)
	{
		lockUse(id, true, routeState);
	};

	TravelScenariosDataModel.unUseTravelScenario = function(id, routeState)
	{
		lockUse(id, false, routeState);
	};

	TravelScenariosDataModel.getUseInfo = function()
	{
		return lockUse(null, true, "").then(function(data)
		{
			return data.selfLockedList.concat(data.lockedByOtherList);
		});
	};

	function lockUse(ids, lock, routeState)
	{
		if (ids && !$.isArray(ids))
		{
			ids = [ids];
		}
		return tf.lockData.setLock({
			ids: ids ? ids : [],
			type: "travelScenarioUseLock",
			extraInfo: routeState,
			isLock: lock,
			databaseId: 0
		}).then((ans) =>
		{
			if (ids)
			{
				var selfLocks = JSON.parse(tf.storageManager.get("selfLockRoutes", true) || "{}");
				var key = routeState + "-travelScenarioUseLock";
				if (!selfLocks[key])
				{
					selfLocks[key] = {
						ids: [],
						type: "travelScenarioUseLock",
						extraInfo: routeState,
						dbid: 0
					};
				}
				ids.forEach(function(id)
				{
					if (lock && selfLocks[key].ids.indexOf(id) < 0)
					{
						selfLocks[key].ids.push(id);
					}
					if (!lock && selfLocks[key].ids.indexOf(id) >= 0)
					{
						selfLocks[key].ids = selfLocks[key].ids.filter(c => { return c != id; });
					}
				});
				tf.storageManager.save("selfLockRoutes", JSON.stringify(selfLocks), true);
			}
			return ans;
		});
	}
})();

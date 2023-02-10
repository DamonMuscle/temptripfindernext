(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").MyStreetsEventsManager = MyStreetsEventsManager;

	function MyStreetsEventsManager(viewModel)
	{
		let self = this;
		self.viewModel = viewModel;
		self._viewModal = viewModel.viewModel._viewModal;
		self.dataModel = self.viewModel.dataModel;
		self.settingsClickEvent = new TF.Events.Event();
		self.selectionChange = self.selectionChange.bind(self);
		self.dataModel.highlightChangedEvent.subscribe(self.onHighlightChanged.bind(self));
		self.obHighlighted = ko.observable(false);
	}

	MyStreetsEventsManager.prototype = Object.create(TF.RoutingMap.EventBase.prototype);
	MyStreetsEventsManager.prototype.constructor = MyStreetsEventsManager;

	MyStreetsEventsManager.prototype.onHighlightChanged = function()
	{
		this.obHighlighted(this.dataModel.highlighted.length > 0);
		this._viewModal.changeHighlight(this.dataModel.highlighted, "mystreets", this.dataModel.findById.bind(this.dataModel));
	};

	MyStreetsEventsManager.prototype.beforeEdit = function(item)
	{
		var self = this;
		return self.dataModel.streetsLockData.lockId(item.OBJECTID || item.id).then(function(id)
		{
			if (id > 0)
			{
				return id;
			}
			return Promise.reject();
		});
	};

	MyStreetsEventsManager.prototype.createStreetClick = function()
	{
		var self = this;
		self.viewModel.drawTool.create("polyline");
		PubSub.publish("clear_ContextMenu_Operation");
	};

	MyStreetsEventsManager.prototype.createFromSelectionClick = function()
	{
		var copyObject = this._viewModal.obCopyLineObject().getData();
		this.viewModel.editModal.create(copyObject).catch(function() { });
	};

	MyStreetsEventsManager.prototype.streetInfoClick = function()
	{
		this.viewModel.editModal.showEditModal();
	};

	MyStreetsEventsManager.prototype.updateGeocodeLayerClick = function()
	{
		this._viewModal.travelScenariosPaletteViewModel.travelScenariosViewModel.rebuildGeocode();
	};

	MyStreetsEventsManager.prototype.updateMyBaseMapClick = function()
	{
		this._viewModal.travelScenariosPaletteViewModel.travelScenariosViewModel.updateVectorTileService("Streets");
	};

	MyStreetsEventsManager.prototype.infoClick = function(item)
	{
		PubSub.publish("clear_ContextMenu_Operation");
		var self = this;
		self.beforeEdit(item).then(function()
		{
			self.viewModel.editModal.showEditModal([item]).then(function()
			{
				self._viewModal.setMode("MyStreets", "Normal");
				self.viewModel.drawTool.changeSymbolToEditing(item.id);
				var closeEvent = function()
				{
					self.viewModel.drawTool.changeSymbolToNotEditing();
					self.viewModel.editModal.onCloseEditModalEvent.unsubscribe(closeEvent);
					self.dataModel.highlightChangedEvent.unsubscribe(closeEvent);
				};
				self.viewModel.editModal.onCloseEditModalEvent.subscribe(closeEvent);
				self.dataModel.highlightChangedEvent.subscribe(closeEvent);
			}).catch(function()
			{
			});
		});
	};

	MyStreetsEventsManager.prototype.transformClick = function(type, data)
	{
		var self = this;
		this.viewModel.calculator.clear();
		self.beforeEdit(data).then(function()
		{
			self.viewModel.drawTool.transform(data.id);
		});
	};

	MyStreetsEventsManager.prototype.splitClick = function(data)
	{
		var self = this;
		this.viewModel.calculator.clear();
		self.beforeEdit(data).then(function()
		{
			self.viewModel.drawTool.split(data.id);
		});
	};

	MyStreetsEventsManager.prototype.settingsClick = function()
	{
		tf.modalManager.showModal(new TF.RoutingMap.MapEditingPalette.MapEditingSettingsModalViewModel(this.dataModel));
	};

	MyStreetsEventsManager.prototype.selectAreaOptionClick = function(type)
	{
		this.viewModel.drawTool.select(type);
		PubSub.publish("clear_ContextMenu_Operation");
	};

	MyStreetsEventsManager.prototype.selectionChange = function(e, selectedIds)
	{
		this.dataModel.setSelected(selectedIds);
		this.dataModel.setHighlighted(selectedIds);
	};

	MyStreetsEventsManager.prototype.saveClick = function(model, e)
	{
		e.stopPropagation();
		let self = this, travelScenariosViewModel = self._viewModal.travelScenariosPaletteViewModel.travelScenariosViewModel;
		return travelScenariosViewModel.IsLock().then(lockedByInfo =>
		{
			if (lockedByInfo)
			{
				return tf.promiseBootbox.alert(`Edits are currently being saved by ${lockedByInfo.UserName} and cannot be saved again until they are finished. This will take several minutes to complete. Please try again.`);
			}
			return tf.AGSServiceUtil.isGPServiceExecuting(["MasterFileGDBGPService"]).then((isExecuting) =>
			{
				if (isExecuting)
				{
					return tf.promiseBootbox.alert(`Map edit is currently executing and cannot be saved again until it is finished. This will take several minutes to complete. Please try again.`);
				}
				return tf.promiseBootbox.yesNo(
					{
						message: "Are you sure you want to save your changes?",
						title: "Confirmation"
					})
					.then((result) =>
					{
						if (result)
						{

							let promise = Promise.resolve(true),
								isNeedApproveScenario = travelScenariosViewModel.getNeedApprovedScenarios().length > 0;
							if (isNeedApproveScenario)
							{
								promise = tf.promiseBootbox.yesNo(
									{
										message: "Street changes are made, all travel scenarios need to be approved before publish.",
										closeButton: true
									}, "Confirmation");
							}
							promise.then(function(result)
							{
								if (result)
								{
									self.dataModel.save();
								}
							});
						}
					})
			});
		});
	};

	MyStreetsEventsManager.prototype.revertClick = function()
	{
		this.dataModel.revert();
	};

	MyStreetsEventsManager.prototype.deleteClick = function(modal, e)
	{
		e.stopPropagation();
		var self = this;
		var highlightedData = this.dataModel.highlighted;
		if (modal && modal.id)
		{
			highlightedData = [self.dataModel.findById(modal.id)];
		}
		return self.dataModel.streetsLockData.lockAndGetLockInfo(highlightedData.map(function(item) { return item.id; })).then(function(lockInfo)
		{
			var ids = lockInfo.selfLockedList.map(function(data)
			{
				return data.id;
			});
			if (ids.length == 0)
			{
				return;
			}
			tf.promiseBootbox.yesNo(
				{
					message: "Are you sure you want to delete " + (ids.length === 1 ? "this segment" : "these segments") + "? ",
					closeButton: true
				}, "Confirmation").then(function(result)
				{
					if (!result)
					{
						return;
					}
					var items = highlightedData.filter(function(item)
					{
						return Enumerable.From(ids).Any(function(c) { return c == item.id; });
					});

					if (items.length > 0)
					{
						setTimeout(function()
						{
							self.dataModel.delete(items);
						});
					}
					PubSub.publish("clear_ContextMenu_Operation");
				});
		});
	};

	MyStreetsEventsManager.prototype.centerMapClick = function(modal, e)
	{
		e.stopPropagation();
		var map = this.viewModel.viewModel._viewModal._map;
		if (modal && modal.geometry)
		{
			TF.RoutingMap.EsriTool.centerSingleItem(map, modal);
			return;
		}
		var geometries = this.dataModel.getHighlighted().map(function(item)
		{
			return item.geometry;
		});
		if (geometries.length == 0)
		{
			TF.StreetHelper.getStreetExtent().then((extent) =>
			{
				if (map.mapView.zoom < this.viewModel.drawTool.minZoom)
				{
					map.mapView.zoom = this.viewModel.drawTool.minZoom;
				}
				map.mapView.center = extent.center;
			});
		} else
		{
			TF.RoutingMap.EsriTool.centerMultipleItem(map, geometries);
		}
	};

	MyStreetsEventsManager.prototype.reshapeClick = function(type, data)
	{
		var self = this;
		this.viewModel.calculator.clear();
		self.beforeEdit(data).then(function()
		{
			self.viewModel.drawTool.reshape(data.id);
		});
	};

	MyStreetsEventsManager.prototype.selectAllClick = function()
	{
		var data = [];
		data = this.dataModel.selected.map(function(d) { return d.id; });
		this.dataModel.setSelected(data);
		this.dataModel.setHighlighted(data);
	};

	MyStreetsEventsManager.prototype.deselectAllClick = function()
	{
		this.dataModel.setHighlighted([]);
	};

	MyStreetsEventsManager.prototype.clearAllClick = function()
	{
		var selected = this.dataModel.selected;
		var highlighted = Enumerable.From(this.dataModel.getHighlighted());
		this.dataModel.setSelected(selected.filter(function(c)
		{
			return !highlighted.Any(function(t) { return t.id == c.id; });
		}).map(function(c)
		{
			return c.id;
		}));
		this.dataModel.setHighlighted([]);
	};

})();
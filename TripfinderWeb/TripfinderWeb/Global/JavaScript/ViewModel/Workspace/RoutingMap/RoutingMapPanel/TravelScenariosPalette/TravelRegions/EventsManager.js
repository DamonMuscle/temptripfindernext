(function()
{
	createNamespace("TF.RoutingMap.TravelScenariosPalette.TravelRegions").EventsManager = EventsManager;
	function EventsManager(travelRegionsViewModel)
	{
		var self = this;
		self.dataModel = travelRegionsViewModel.dataModel;
		this.travelRegionsViewModel = travelRegionsViewModel;
		this.selectionChange = this.selectionChange.bind(this);
		this.copyFromObject = ko.computed(this.getCopyFrom.bind(this));
		this.createTravelRegionFromSelectionClick = this.createTravelRegionFromSelectionClick.bind(this);
	}

	EventsManager.prototype = Object.create(TF.RoutingMap.EventBase.prototype);
	EventsManager.prototype.constructor = EventsManager;

	EventsManager.prototype.init = function()
	{
	};

	EventsManager.prototype.selectionChange = function(e, selectedIds)
	{
		var selected = [], i;
		var selectedItems = this.dataModel.getSelectedTravelRegions();
		for (i = 0; i < selectedItems.length; i++)
		{
			selectedItems[i].isHighlighted = false;
			selectedItems[i].isSelected = false;
		}
		for (i = 0; i < selectedIds.length; i++)
		{
			var b = this.dataModel.getTravelRegionById(selectedIds[i]);
			if (!b) return;
			b.isSelected = true;
			b.isHighlighted = true;
			selected.push(b);
		}
		this.dataModel.setSelected(selected);
		this.dataModel.setHighlighted(selected);
	};

	EventsManager.prototype.reshapeClick = function(type, data, e)
	{
		this.travelRegionsViewModel.drawTool.reshape(data.id);
	};

	EventsManager.prototype.redrawClick = function(type, data, e)
	{
		this.travelRegionsViewModel.drawTool.redrawRegion(type, data.id);
	};

	EventsManager.prototype.removeRegionClick = function(type, data, e)
	{
		this.travelRegionsViewModel.drawTool.removeRegion(type, data.id);
	};

	EventsManager.prototype.addRegionClick = function(type, data, e)
	{
		this.travelRegionsViewModel.drawTool.addRegion(type, data.id);
	};

	EventsManager.prototype.travelRegionSelectAllClick = function(model, e)
	{
		var data = this.dataModel.getSelectedTravelRegions();
		this.dataModel.setHighlighted(data);
	};

	EventsManager.prototype.travelRegionDeselectAllClick = function(model, e)
	{
		this.dataModel.setHighlighted([]);
	};

	EventsManager.prototype.editParcelClick = function(type, data, e)
	{
		this.travelRegionsViewModel.drawTool.transform(data.id);
	};

	EventsManager.prototype.travelRegionClearAllClick = function(model, e)
	{
		var data = this.dataModel.getTravelHighlighted();
		this.dataModel.cancelSelected(data);
	};

	EventsManager.prototype.travelRegionDetailsClick = function()
	{
		this.travelRegionsViewModel._viewModal.setMode("TravelRegion", "Normal");
		PubSub.publish("clear_ContextMenu_Operation");
		this.travelRegionsViewModel.travelRegionEditModal.showEditModal();
	};

	EventsManager.prototype.infoClick = function(item)
	{
		PubSub.publish("clear_ContextMenu_Operation");
		var self = this;
		self._lockId(item.OBJECTID || item.id).then(function(editableId)
		{
			if (!editableId)
			{
				return;
			}
			self.travelRegionsViewModel.travelRegionEditModal.showEditModal([item]).then(function()
			{
				self.travelRegionsViewModel._viewModal.setMode("TravelRegion", "Normal");
				var closeEvent = function()
				{
					self.travelRegionsViewModel.travelRegionEditModal.onCloseEditModalEvent.unsubscribe(closeEvent);
					self.dataModel.highlightChangedEvent.unsubscribe(closeEvent);
				};
				self.travelRegionsViewModel.travelRegionEditModal.onCloseEditModalEvent.subscribe(closeEvent);
				self.dataModel.highlightChangedEvent.subscribe(closeEvent);
			}).catch(function() { });
		});
	};

	EventsManager.prototype._lockId = function(id)
	{
		var self = this;
		if ($.isArray(id))
		{
			id = id[0];
		}
		return self.dataModel.travelRegionLockData.lockId(id);
	};

	EventsManager.prototype.settingsClick = function()
	{
		tf.modalManager.showModal(new TF.RoutingMap.TravelScenariosPalette.TravelRegionSettingsModalViewModel(this.travelRegionsViewModel, "travelRegion"));
	};

	EventsManager.prototype.centerMapClick = function(model, e)
	{
		e.stopPropagation();
		var map = this.travelRegionsViewModel._viewModal._map;
		// center one boundary
		if (model && model.geometry)
		{
			TF.RoutingMap.EsriTool.centerSingleItem(map, model);
			return;
		}
		var geometries = this.dataModel.getTravelHighlighted();
		if (geometries.length == 0)
		{
			TF.RoutingMap.EsriTool.centerMultipleItem(map, this.dataModel.travelRegions);
		} else
		{
			TF.RoutingMap.EsriTool.centerMultipleItem(map, geometries);
		}
	};

	EventsManager.prototype.saveClick = function(model, e)
	{
		this.saveTravelRegionClick(model, e);
	};

	EventsManager.prototype.deleteClick = function(viewModel, e)
	{
		e.stopPropagation();
		var self = this;
		var highlightedData = this.dataModel.getTravelHighlighted();
		if (viewModel)
		{
			if (viewModel.id)
			{
				highlightedData = [self.dataModel.getTravelRegionById(viewModel.id)];
			}
		}
		return self.dataModel.travelRegionLockData.lockAndGetLockInfo(highlightedData.map(function(item) { return item.id; })).then(function(lockInfo)
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
					message: "Are you sure you want to delete " + (ids.length === 1 ? "this travel region" : "these travel regions") + "? ",
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
					var travelRegionItems = [], boundaryItems = [];
					items.forEach(function(item)
					{
						travelRegionItems.push(item);
					});
					if (travelRegionItems.length > 0) self.dataModel.delete(travelRegionItems);
					if (boundaryItems.length > 0) self.dataModel.delete(boundaryItems);

					PubSub.publish("clear_ContextMenu_Operation");
					self.dataModel.highlightChangedEvent.notify(self.dataModel.getHighlightedTravelRegion());
				});
		});
	};

	EventsManager.prototype.deleteTravelRegionClick = function(model, e)
	{
		this.deleteClick(model, e);
	};

	EventsManager.prototype.saveTravelRegionClick = function(model, e)
	{
		e.preventDefault();
		e.stopPropagation();
		var self = this, travelScenariosViewModel = self.travelRegionsViewModel.viewModel.travelScenariosViewModel;
		travelScenariosViewModel.IsLock().then(lockedByInfo =>
		{
			if (lockedByInfo)
			{
				return tf.promiseBootbox.alert(`Edits are currently being saved by ${lockedByInfo.UserName} and cannot be saved again until they are finished. This will take several minutes to complete. Please try again.`)
			}
			return tf.AGSServiceUtil.isGPServiceExecuting(["MasterFileGDBGPService"]).then((isExecuting) =>
			{
				if (isExecuting)
				{
					return tf.promiseBootbox.alert(`Map edit is currently executing and cannot be saved again until it is finished. This will take several minutes to complete. Please try again.`);
				}
				tf.promiseBootbox.yesNo(
					{
						message: "Are you sure you want to Save your changes?",
						title: "Confirmation"
					})
					.then(function(result)
					{
						if (result)
						{
							self.travelRegionsViewModel._viewModal.setMode("TravelRegion", "Normal");
							self.travelRegionsViewModel.dataModel.saveTravelRegion();
						}
					});
			});
		});

	};

	EventsManager.prototype.revertTravelRegionClick = function(model, e)
	{
		var self = this;
		e.preventDefault();
		// return tf.promiseBootbox.yesNo(
		// 	{
		// 		message: "Are you sure you want to Revert your changes?",
		// 		title: "Confirmation"
		// 	})
		// 	.then(function(result)
		// 	{
		// if (result)
		// {
		self.travelRegionsViewModel._viewModal.setMode("TravelRegion", "Normal");
		self.travelRegionsViewModel.dataModel.revertTravelRegion();
		self.travelRegionsViewModel._viewModal.obToastMessages.push({
			type: 'success',
			content: 'This record has been successfully reverted.',
			autoClose: true
		});
		// 	}
		// });
	};

	EventsManager.prototype.createTravelRegionClick = function()
	{
		this.travelRegionsViewModel.drawTool.create("polygon");
	};

	EventsManager.prototype.createTravelRegionFromSelectionClick = function()
	{
		var copyObject = this.copyFromObject();
		this.travelRegionsViewModel.travelRegionEditModal.create({ geometry: copyObject.geometry }).catch(function() { });
	};

	EventsManager.prototype.getCopyFrom = function()
	{
		var copyFrom = this.travelRegionsViewModel._viewModal.obCopyPolygonObject();
		if (copyFrom)
		{
			return copyFrom.getData();
		}
		return null;
	};

	EventsManager.prototype.travelRegionSelectAreaOptionClick = function(type, data, e)
	{
		this.travelRegionsViewModel.drawTool.select(type);
	};

})();
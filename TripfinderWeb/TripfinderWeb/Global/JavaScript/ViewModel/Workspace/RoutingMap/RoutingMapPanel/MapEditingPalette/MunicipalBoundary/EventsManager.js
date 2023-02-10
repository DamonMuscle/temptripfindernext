(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette.MunicipalBoundary").EventsManager = EventsManager;
	function EventsManager(viewModel)
	{
		var self = this;
		this.viewModel = viewModel;
		this.dataModel = this.viewModel.dataModel;
		this._viewModal = this.viewModel._viewModal;
		this.copyFromObject = ko.computed(this.getCopyFrom.bind(this));
		self.selectionChange = this.selectionChange.bind(this);
	}
	EventsManager.prototype = Object.create(TF.RoutingMap.EventBase.prototype);
	EventsManager.prototype.constructor = EventsManager;

	EventsManager.prototype.init = function(data, domElement)
	{
	};

	EventsManager.prototype.selectionChange = function(e, selectedIds)
	{
		var selected = [], i;
		var selectedItems = this.dataModel.getSelected();
		for (i = 0; i < selectedItems.length; i++)
		{
			selectedItems[i].isHighlighted = false;
			selectedItems[i].isSelected = false;
		}
		for (i = 0; i < selectedIds.length; i++)
		{
			var b = this.dataModel.getMunicipalBoundaryById(selectedIds[i]);
			if (!b) return;
			b.isSelected = true;
			b.isHighlighted = true;
			selected.push(b);
		}
		this.dataModel.setSelected(selected);
		this.dataModel.setHighlighted(selected);
	};

	EventsManager.prototype.getCopyFrom = function()
	{
		return this.getCopyFromArray([this._viewModal.obCopyPolygonObject()]);
	};

	EventsManager.prototype.createFromSelectionClick = function()
	{
		var copyObject = this.copyFromObject();
		this.viewModel.municipalBoundaryEditModal.create({ geometry: copyObject.geometry }).catch(function() { });
	};

	EventsManager.prototype.reshapeClick = function(type, data, e)
	{
		this.viewModel.drawTool.reshape(data.id);
	};

	EventsManager.prototype.redrawClick = function(type, data, e)
	{
		// var array = [data.id()];
		this.redrawClickEvent.fire(type, data);
	};

	EventsManager.prototype.removeRegionClick = function(type, data, e)
	{
		this.removeRegionClickEvent.fire(type, data);
	};

	EventsManager.prototype.addRegionClick = function(type, data, e)
	{
		// var array = [type, data.id()];
		this.addRegionClickEvent.fire(type, data);
	};

	EventsManager.prototype.municipalBoundarySelectAllClick = function(model, e)
	{
		var data = [];
		data = this.dataModel.getSelectedMunicipalBoundaries();
		this.dataModel.setHighlighted(data);
	};

	EventsManager.prototype.municipalBoundaryDeselectAllClick = function(model, e)
	{
		this.dataModel.setHighlighted([]);
	};

	EventsManager.prototype.municipalBoundaryClearAllClick = function(model, e)
	{
		var data = this.dataModel.getMunicipalBoundaryHighlighted();
		this.dataModel.cancelSelected(data);
	};

	EventsManager.prototype.transformClick = function(type, data, e)
	{
		this.viewModel.drawTool.transform(data.id);
	};

	EventsManager.prototype.municipalBoundaryDetailsClick = function()
	{
		this.viewModel._viewModal.setMode("MunicipalBoundary", "Normal");
		PubSub.publish("clear_ContextMenu_Operation");
		this.viewModel.municipalBoundaryEditModal.showEditModal();
	};

	EventsManager.prototype.infoClick = function(model, e)
	{
		PubSub.publish("clear_ContextMenu_Operation");
		var self = this;
		e.stopPropagation();
		self._lockId(model.id).then(function(editableId)
		{
			if (!editableId)
			{
				return;
			}
			self.viewModel.municipalBoundaryEditModal.showEditModal([model]).then(function()
			{
				self.viewModel._viewModal.setMode("MunicipalBoundary", "Normal");
				var closeEvent = function()
				{
					self.viewModel.municipalBoundaryEditModal.onCloseEditModalEvent.unsubscribe(closeEvent);
					self.dataModel.highlightChangedEvent.unsubscribe(closeEvent);
				};
				self.viewModel.municipalBoundaryEditModal.onCloseEditModalEvent.subscribe(closeEvent);
				self.dataModel.highlightChangedEvent.subscribe(closeEvent);
			}).catch(function() { });

		});
	};

	EventsManager.prototype.municipalBoundarySettingsClick = function(model, e)
	{
		tf.modalManager.showModal(new TF.RoutingMap.MapEditingPalette.MunicipalBoundarySettingsModalViewModel(this.viewModel, "municipalBoundary"));
	};

	EventsManager.prototype.centerMapClick = function(model, e)
	{
		e.stopPropagation();
		var map = this._viewModal._map;
		if (model && model.geometry)
		{
			TF.RoutingMap.EsriTool.centerSingleItem(map, model);
			return;
		}
		var geometries = this.dataModel.getMunicipalBoundaryHighlighted();

		if (geometries.length == 0)
		{
			TF.RoutingMap.EsriTool.centerMultipleItem(map, this.dataModel.municipalBoundaries);
		} else
		{
			TF.RoutingMap.EsriTool.centerMultipleItem(map, geometries);
		}
	};

	EventsManager.prototype.deleteClick = function(model, e)
	{
		this.deleteClickEvent(model, e);
	};

	EventsManager.prototype.deleteMunicipalBoundaryClick = function(model, e)
	{
		this.deleteClickEvent(model, e);
	};

	EventsManager.prototype.deleteClickEvent = function(viewModel, e)
	{
		e.stopPropagation();
		var self = this;
		var highlightedData = this.dataModel.getMunicipalBoundaryHighlighted();
		if (viewModel)
		{
			if (viewModel.id)
			{
				highlightedData = [self.dataModel.getMunicipalBoundaryById(viewModel.id)];
			}
		}
		return self.dataModel.municipalBoundaryLockData.lockAndGetLockInfo(highlightedData.map(function(item) { return item.id; })).then(function(lockinfo)
		{
			var ids = lockinfo.selfLockedList.map(function(data)
			{
				return data.id;
			});
			if (ids.length == 0)
			{
				return;
			}
			tf.promiseBootbox.yesNo(
				{
					message: "Are you sure you want to delete " + (ids.length === 1 ? "this municipal boundary" : "these municipal boundaries") + "? ",
					closeButton: true
				}, "Confirmation").then(function(result)
				{
					if (!result)
					{
						return;
					}
					var items = highlightedData.filter(function(item)
					{
						return Enumerable.From(ids).Any(function(c) { return c == item.id });
					});
					var municipalBoundaryItems = [], boundaryItems = [];
					items.forEach(function(item)
					{
						municipalBoundaryItems.push(item);
					});
					if (municipalBoundaryItems.length > 0) self.dataModel.delete(municipalBoundaryItems);
					if (boundaryItems.length > 0) self.dataModel.delete(boundaryItems);

					PubSub.publish("clear_ContextMenu_Operation");
					self.dataModel.highlightChangedEvent.notify(self.dataModel.getHighlighted());
				});
		});

	};

	EventsManager.prototype.saveMunicipalBoundaryClick = function(model, e)
	{
		e.preventDefault();
		e.stopPropagation();
		var self = this;
		return tf.promiseBootbox.yesNo(
			{
				message: "Are you sure you want to Save your changes?",
				title: "Confirmation"
			})
			.then(function(result)
			{
				if (result)
				{
					self.viewModel._viewModal.setMode("MunicipalBoundary", "Normal");
					self.viewModel.dataModel.saveMunicipalBoundary().then(function()
					{
						self.viewModel._viewModal.obToastMessages.push({
							type: 'success',
							content: 'This record has been successfully saved.',
							autoClose: true
						});
						return true;
					}).catch(function()
					{
						self.viewModel._viewModal.obToastMessages.push({
							type: 'error',
							content: 'Save failed',
							autoClose: true
						});
						return false;
					}).then(function(res)
					{
						if (res)
						{
							self.viewModel._viewModal.travelScenariosPaletteViewModel.travelScenariosViewModel.updateVectorTileService("MC");
						}
					})
				}
			});
	};

	EventsManager.prototype.revertMunicipalBoundaryClick = function(model, e)
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
		// 		if (result)
		// 		{
		self.viewModel._viewModal.setMode("MunicipalBoundary", "Normal");
		self.viewModel.dataModel.revertMunicipalBoundary();
		self.viewModel._viewModal.obToastMessages.push({
			type: 'success',
			content: 'This record has been successfully reverted.',
			autoClose: true
		});
		// 	}
		// });
	};

	EventsManager.prototype.createMunicipalBoundaryClick = function()
	{
		this.viewModel.drawTool.create("polygon");
	};

	EventsManager.prototype.createMunicipalBoundaryFromSelectionClick = function()
	{
		this.viewModel._viewModal.setMode("MunicipalBoundary", "Normal");
		PubSub.publish("clear_ContextMenu_Operation");
		this.createMunicipalBoundaryFromSelectionClickEvent.notify();
	};

	EventsManager.prototype.municipalBoundarySelectAreaOptionClick = function(type, data, e)
	{
		this.viewModel.drawTool.select(type);
	};

	EventsManager.prototype._lockId = function(id)
	{
		var self = this;
		if ($.isArray(id))
		{
			id = id[0];
		}
		return self.viewModel.dataModel.municipalBoundaryLockData.lockId(id);
	};
})();

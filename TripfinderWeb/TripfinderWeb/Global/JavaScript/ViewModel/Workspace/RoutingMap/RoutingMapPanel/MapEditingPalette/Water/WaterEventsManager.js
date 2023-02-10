(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").WaterEventsManager = WaterEventsManager;

	function WaterEventsManager(viewModel)
	{
		var self = this;
		self.viewModel = viewModel;
		self._viewModal = viewModel.viewModel._viewModal;
		self.dataModel = self.viewModel.dataModel;
		this.selectionChange = this.selectionChange.bind(this);
		self.dataModel.highlightChangedEvent.subscribe(this.onHighlightChanged.bind(this));
		this.obHighlighted = ko.observable(false);
		this.copyFromObject = ko.computed(this.getCopyFrom.bind(this));
	}

	WaterEventsManager.prototype = Object.create(TF.RoutingMap.EventBase.prototype);
	WaterEventsManager.prototype.constructor = WaterEventsManager;

	WaterEventsManager.prototype.onModeChange = function()
	{
		var self = this;
		var mode = this.viewModel.viewModel._viewModal.mode;
		self.changeMenuButtonStyle(mode);
		self.onModeChangeEvent(mode);
	};

	WaterEventsManager.prototype.selectionChange = function(e, selectedIds)
	{
		var selected = [];
		var selectedItems = this.dataModel.getSelected();
		for (var i = 0; i < selectedItems.length; i++)
		{
			selectedItems[i].isHighlighted = false;
			selectedItems[i].isSelected = false;
		}
		for (var i = 0; i < selectedIds.length; i++)
		{
			var b = this.dataModel.findById(selectedIds[i]);
			if (!b) return;
			b.isSelected = true;
			b.isHighlighted = true;
			selected.push(b);
		}
		this.dataModel.setSelected(selected);
		this.dataModel.setHighlighted(selected);
	};

	WaterEventsManager.prototype.getCopyFrom = function()
	{
		var copyFrom = [this._viewModal.obCopyPolygonObject(), this._viewModal.obCopyLineObject()];
		for (var i = 0; i < copyFrom.length; i++)
		{
			if (copyFrom[i])
			{
				var copyObject = copyFrom[i].getData();
				return copyObject;
			}
		}
		return null;
	};

	WaterEventsManager.prototype.onHighlightChanged = function()
	{
		this.obHighlighted(this.dataModel.highlighted.length > 0);
		this._viewModal.changeHighlight(this.dataModel.highlighted, "Water", this.dataModel.findById.bind(this.dataModel));
	};

	WaterEventsManager.prototype.beforeEdit = function(item)
	{
		var self = this;
		return self.dataModel.lockData.lockId(item.OBJECTID || item.id).then(function(id)
		{
			if (id && id != 0)
			{
				return id;
			}
			return Promise.reject();
		});
	};

	WaterEventsManager.prototype.createClick = function(type)
	{
		this.viewModel.drawTool.create(type.toLowerCase());
	};

	WaterEventsManager.prototype.createFromSelectionClick = function()
	{
		var copyObject = this.copyFromObject();
		this.viewModel.editModal.create(copyObject).catch(function() { });
	};

	WaterEventsManager.prototype.settingsClick = function()
	{
		tf.modalManager.showModal(new TF.RoutingMap.MapEditingPalette.WaterSettingsModalViewModel(this.dataModel));
	};

	WaterEventsManager.prototype.WaterInfoClick = function()
	{
		this.viewModel.editModal.showEditModal();
	};

	WaterEventsManager.prototype.infoClick = function(item)
	{
		PubSub.publish("clear_ContextMenu_Operation");
		var self = this;
		self.beforeEdit(item).then(function()
		{
			self.viewModel.editModal.showEditModal([item]).then(function()
			{
				self._viewModal.setMode("Water", "Normal");
				function closeEvent()
				{
					self.viewModel.editModal.onCloseEditModalEvent.unsubscribe(closeEvent);
					self.dataModel.highlightChangedEvent.unsubscribe(closeEvent);
				}
				self.viewModel.editModal.onCloseEditModalEvent.subscribe(closeEvent);
				self.dataModel.highlightChangedEvent.subscribe(closeEvent);
			}).catch(function() { });
		});
	};

	WaterEventsManager.prototype.editClick = function(type, data)
	{
		var self = this;
		self.viewModel.drawTool.transform(data.id, data.geometry.type);
	};

	WaterEventsManager.prototype.addRegionClick = function(type, data)
	{
		var self = this;
		self.beforeEdit(data).then(function(editableId)
		{
			self.viewModel.drawTool.addRegion(type, editableId);
		});
	};

	WaterEventsManager.prototype.redrawClick = function(type, data)
	{
		var self = this;
		self.beforeEdit(data).then(function(editableId)
		{
			self.viewModel.drawTool.redraw(type, editableId);
		});
	};

	WaterEventsManager.prototype.removeRegionClick = function(type, data)
	{
		var self = this;
		self.beforeEdit(data).then(function(editableId)
		{
			self.viewModel.drawTool.removeRegionClick(type, editableId);
		});
	};

	WaterEventsManager.prototype.selectAreaOptionClick = function(type, data, e)
	{
		this.viewModel.drawTool.select(type);
	};

	WaterEventsManager.prototype.selectionChange = function(e, selectedIds)
	{
		this.dataModel.setSelected(selectedIds);
		this.dataModel.setHighlighted(selectedIds);
	};

	WaterEventsManager.prototype.saveClick = function(model, e)
	{
		e.stopPropagation();
		this.dataModel.save();
	};

	WaterEventsManager.prototype.revertClick = function()
	{
		this.dataModel.revert();
	};

	WaterEventsManager.prototype.deleteClick = function(modal, e)
	{
		e.stopPropagation();
		var self = this;
		var highlightedData = this.dataModel.highlighted;
		if (modal && modal.id)
		{
			highlightedData = [self.dataModel.findById(modal.id)];
		}
		return self.dataModel.lockData.lockAndGetLockInfo(highlightedData.map(function(item) { return item.id; })).then(function(lockinfo)
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
					message: "Are you sure you want to delete " + (ids.length === 1 ? "this water" : "these water") + "? ",
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
						self.dataModel.delete(items);
					}
					PubSub.publish("clear_ContextMenu_Operation");
				});
		});
	};

	WaterEventsManager.prototype.centerMapClick = function(modal, e)
	{
		e.stopPropagation();
		var map = this.viewModel.viewModel._viewModal._map;
		if (modal && modal.geometry)
		{
			TF.RoutingMap.EsriTool.centerSingleItem(map, modal);
			return;
		}
		if (this.dataModel.highlighted.length == 0)
		{
			this.dataModel.featureData.getExtent().then((extent) =>
			{
				if (map.mapView.zoom < this.viewModel.drawTool.minZoom)
				{
					map.mapView.zoom = this.viewModel.drawTool.minZoom;
				}
				map.mapView.center = extent.center;
			});
		} else
		{
			TF.RoutingMap.EsriTool.centerMultipleItem(map, this.dataModel.highlighted);
		}
	};

	WaterEventsManager.prototype.reshapeClick = function(type, data)
	{
		var self = this;
		self.viewModel.drawTool.reshape(data.id, data.geometry.type);

	};

	WaterEventsManager.prototype.selectAllClick = function()
	{
		var data = [];
		data = this.dataModel.selected.map(function(d) { return d.id; });
		this.dataModel.setSelected(data);
		this.dataModel.setHighlighted(data);
	};

	WaterEventsManager.prototype.deselectAllClick = function()
	{
		this.dataModel.setHighlighted([]);
	};

	WaterEventsManager.prototype.clearAllClick = function()
	{
		var selected = this.dataModel.selected;
		var highlighted = Enumerable.From(this.dataModel.highlighted);
		this.dataModel.setSelected(selected.filter(function(c)
		{
			return !highlighted.Any(function(t) { return t.id == c.id; });
		}).map(function(c)
		{
			return c.id;
		}));
		this.dataModel.setHighlighted([]);
	};

	WaterEventsManager.prototype.stopEditing = function(e, items)
	{
		var self = this;
		self.dataModel.update(items);
	};

})();
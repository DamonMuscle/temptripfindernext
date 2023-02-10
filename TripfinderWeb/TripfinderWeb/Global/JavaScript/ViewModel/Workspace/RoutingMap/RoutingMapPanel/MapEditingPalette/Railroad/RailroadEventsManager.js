(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").RailroadEventsManager = RailroadEventsManager;

	function RailroadEventsManager(viewModel)
	{
		var self = this;
		self.viewModel = viewModel;
		self._viewModal = viewModel.viewModel._viewModal;
		self.dataModel = self.viewModel.dataModel;
		this.selectionChange = this.selectionChange.bind(this);
		self.dataModel.highlightChangedEvent.subscribe(this.onHighlightChanged.bind(this));
		this.obHighlighted = ko.observable(false);
	}

	RailroadEventsManager.prototype = Object.create(TF.RoutingMap.EventBase.prototype);
	RailroadEventsManager.prototype.constructor = RailroadEventsManager;

	RailroadEventsManager.prototype.onModeChange = function()
	{
		var self = this;
		var mode = this.viewModel.viewModel._viewModal.mode;
		if (self.viewModel.$element)
		{
			var menuContainer = self.viewModel.$element.find(".parcelpoint-tool");
			self.changeButtonActiveStyle(menuContainer, mode);
		}
		self.onModeChangeEvent(mode);
	};

	RailroadEventsManager.prototype.selectionChange = function(e, selectedIds)
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
			var b = this.dataModel.findById(selectedIds[i]);
			if (!b) return;
			b.isSelected = true;
			b.isHighlighted = true;
			selected.push(b);
		}
		this.dataModel.setSelected(selected);
		this.dataModel.setHighlighted(selected);
	};

	RailroadEventsManager.prototype.onHighlightChanged = function()
	{
		this.obHighlighted(this.dataModel.highlighted.length > 0);
		this._viewModal.changeHighlight(this.dataModel.highlighted, "railroad", this.dataModel.findById.bind(this.dataModel));
	};

	RailroadEventsManager.prototype.beforeEdit = function(item)
	{
		var self = this;
		return self.dataModel.lockData.lockId(item.OBJECTID || item.id).then(function(id)
		{
			if (id > 0)
			{
				return id;
			}
			return Promise.reject();
		});
	};

	RailroadEventsManager.prototype.createClick = function()
	{
		var self = this;
		self.viewModel.drawTool.create("polyline");
	};

	RailroadEventsManager.prototype.createFromSelectionClick = function()
	{
		var copyObject = this._viewModal.obCopyLineObject().getData();
		this.viewModel.editModal.create(copyObject).catch(function() { });
	};

	RailroadEventsManager.prototype.settingsClick = function(model, e)
	{
		tf.modalManager.showModal(new TF.RoutingMap.MapEditingPalette.RailroadSettingsModalViewModel(this.dataModel));
	};

	RailroadEventsManager.prototype.railroadInfoClick = function()
	{
		this.viewModel.editModal.showEditModal();
	};

	RailroadEventsManager.prototype.infoClick = function(item)
	{
		PubSub.publish("clear_ContextMenu_Operation");
		var self = this;
		self.beforeEdit(item).then(function()
		{
			self.viewModel.editModal.showEditModal([item]).then(function()
			{
				self._viewModal.setMode("Railroad", "Normal");
				var closeEvent = function()
				{
					self.viewModel.editModal.onCloseEditModalEvent.unsubscribe(closeEvent);
					self.dataModel.highlightChangedEvent.unsubscribe(closeEvent);
				};
				self.viewModel.editModal.onCloseEditModalEvent.subscribe(closeEvent);
				self.dataModel.highlightChangedEvent.subscribe(closeEvent);
			}).catch(function() { });
		});
	};

	RailroadEventsManager.prototype.transformClick = function(type, data)
	{
		var self = this;
		self.beforeEdit(data).then(function()
		{
			self.viewModel.editTool.rightClickEdit("transform", data.id);
		});
	};

	RailroadEventsManager.prototype.selectAreaOptionClick = function(type, data, e)
	{
		this.viewModel.drawTool.select(type);
		PubSub.publish("clear_ContextMenu_Operation");
	};

	RailroadEventsManager.prototype.selectionChange = function(e, selectedIds)
	{
		this.dataModel.setSelected(selectedIds);
		this.dataModel.setHighlighted(selectedIds);
	};

	RailroadEventsManager.prototype.saveClick = function(model, e)
	{
		e.stopPropagation();
		tf.AGSServiceUtil.isGPServiceExecuting(["MasterFileGDBGPService"]).then((isExecuting) =>
		{
			if (isExecuting)
			{
				return tf.promiseBootbox.alert(`Map edit is currently executing and cannot be saved again until it is finished. This can take several minutes to complete. Please try again.`);
			}
			else
			{
				this.dataModel.save();
			}
		});
	};

	RailroadEventsManager.prototype.revertClick = function()
	{
		this.dataModel.revert();
	};

	RailroadEventsManager.prototype.deleteClick = function(modal, e)
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
						self.dataModel.delete(items);
					}
					PubSub.publish("clear_ContextMenu_Operation");
				});
		});
	};

	RailroadEventsManager.prototype.centerMapClick = function(modal, e)
	{
		e.stopPropagation();
		var map = this.viewModel.viewModel._viewModal._map;
		if (modal && modal.geometry)
		{
			TF.RoutingMap.EsriTool.centerSingleItem(map, modal);
			return;
		}
		var geometries = this.dataModel.highlighted.map(function(item)
		{
			return item.geometry;
		});
		if (geometries.length == 0)
		{
			TF.RoutingMap.EsriTool.centerMultipleItem(map, this.dataModel.all);
		} else
		{
			TF.RoutingMap.EsriTool.centerMultipleItem(map, geometries);
		}
	};

	RailroadEventsManager.prototype.reshapeClick = function(type, data)
	{
		var self = this;
		self.beforeEdit(data).then(function()
		{
			self.viewModel.drawTool.reshape(data.id);
		});

	};

	RailroadEventsManager.prototype.selectAllClick = function(modal, e)
	{
		var data = [];
		data = this.dataModel.selected.map(function(d) { return d.id; });
		this.dataModel.setSelected(data);
		this.dataModel.setHighlighted(data);
	};

	RailroadEventsManager.prototype.deselectAllClick = function(modal, e)
	{
		this.dataModel.setHighlighted([]);
	};

	RailroadEventsManager.prototype.clearAllClick = function(modal, e)
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

})();
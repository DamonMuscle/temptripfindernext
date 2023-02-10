(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").LandmarkEventsManager = LandmarkEventsManager;

	function LandmarkEventsManager(viewModel)
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

	LandmarkEventsManager.prototype = Object.create(TF.RoutingMap.EventBase.prototype);
	LandmarkEventsManager.prototype.constructor = LandmarkEventsManager;

	LandmarkEventsManager.prototype.onHighlightChanged = function()
	{
		this.obHighlighted(this.dataModel.highlighted.length > 0);
		this._viewModal.changeHighlight(this.dataModel.highlighted, "Landmark", this.dataModel.findById.bind(this.dataModel));
	};

	LandmarkEventsManager.prototype.getCopyFrom = function()
	{
		var copyFrom = [this._viewModal.obCopyPolygonObject(), this._viewModal.obCopyLineObject(), this._viewModal.obCopyPointObject()];
		for (var i = 0; i < copyFrom.length; i++)
		{
			if (copyFrom[i])
			{
				return copyFrom[i].getData();
			}
		}
		return null;
	};

	LandmarkEventsManager.prototype.beforeEdit = function(item)
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

	LandmarkEventsManager.prototype.createClick = function(type, data, e)
	{
		var self = this;
		self.viewModel.drawTool.create(type.toLowerCase());
		PubSub.publish("clear_ContextMenu_Operation");
	};

	LandmarkEventsManager.prototype.createFromSelectionClick = function()
	{
		var copyObject = this.copyFromObject();
		this._viewModal.setMode("Landmark", "Normal");
		this.viewModel.editModal.create(copyObject).catch(function() { });
	};

	LandmarkEventsManager.prototype.settingsClick = function()
	{
		tf.modalManager.showModal(new TF.RoutingMap.MapEditingPalette.LandmarkSettingsModalViewModel(this.dataModel));
	};

	LandmarkEventsManager.prototype.LandmarkInfoClick = function()
	{
		this.viewModel.editModal.showEditModal();
	};

	LandmarkEventsManager.prototype.infoClick = function(item)
	{
		PubSub.publish("clear_ContextMenu_Operation");
		var self = this;
		self.beforeEdit(item).then(function()
		{
			self.viewModel.editModal.showEditModal([item]).then(function()
			{
				self._viewModal.setMode("Landmark", "Normal");
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

	LandmarkEventsManager.prototype.editClick = function(type, data)
	{
		var self = this;
		self.beforeEdit(data).then(function()
		{
			if (type == "movePoint")
			{
				self.viewModel.drawTool.movePoint(data.id);
			} else
			{
				self.viewModel.drawTool.transform(data.id);
			}
		});
	};

	LandmarkEventsManager.prototype.reshapeClick = function(type, data)
	{
		var self = this;
		self.beforeEdit(data).then(function()
		{
			self.viewModel.drawTool.reshape(data.id, data.geometry.type);
		});
	};

	LandmarkEventsManager.prototype.addRegionClick = function(type, data)
	{
		var self = this;
		self.beforeEdit(data).then(function()
		{
			self.viewModel.drawTool.addRegion(type, data.id);
		});
	};

	LandmarkEventsManager.prototype.redrawClick = function(type, data)
	{
		var self = this;
		self.beforeEdit(data).then(function()
		{
			self.viewModel.drawTool.redrawRegion(type, data.id);
		});
	};

	LandmarkEventsManager.prototype.removeRegionClick = function(type, data)
	{
		var self = this;
		self.beforeEdit(data).then(function()
		{
			self.viewModel.drawTool.removeRegion(type, data.id);
		});
	};

	LandmarkEventsManager.prototype.selectAreaOptionClick = function(type, data, e)
	{
		this.viewModel.drawTool.select(type);
		PubSub.publish("clear_ContextMenu_Operation");
	};

	LandmarkEventsManager.prototype.selectionChange = function(e, selectedIds)
	{
		this.dataModel.setSelected(selectedIds);
		this.dataModel.setHighlighted(selectedIds);
	};

	LandmarkEventsManager.prototype.saveClick = function(model, e)
	{
		e.stopPropagation();
		this.dataModel.save();
	};

	LandmarkEventsManager.prototype.revertClick = function()
	{
		this.dataModel.revert();
	};

	LandmarkEventsManager.prototype.deleteClick = function(modal, e)
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
					message: "Are you sure you want to delete " + (ids.length === 1 ? "this landmark" : "these landmarks") + "? ",
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

	LandmarkEventsManager.prototype.centerMapClick = function(modal, e)
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
			TF.RoutingMap.EsriTool.centerMultipleItem(map, this.dataModel.all);
		} else
		{
			TF.RoutingMap.EsriTool.centerMultipleItem(map, this.dataModel.highlighted);
		}
	};

	LandmarkEventsManager.prototype.selectAllClick = function()
	{
		var data = [];
		data = this.dataModel.selected.map(function(d) { return d.id; });
		this.dataModel.setSelected(data);
		this.dataModel.setHighlighted(data);
	};

	LandmarkEventsManager.prototype.deselectAllClick = function()
	{
		this.dataModel.setHighlighted([]);
	};

	LandmarkEventsManager.prototype.clearAllClick = function()
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
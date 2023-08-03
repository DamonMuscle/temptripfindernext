(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").StopPoolEventsManager = StopPoolEventsManager;

	function StopPoolEventsManager(viewModel)
	{
		var self = this;
		TF.RoutingMap.RoutingPalette.BaseRoutingEventsManager.call(this, viewModel, viewModel.viewModel._viewModal);
		self.dataModel = self.viewModel.dataModel;
		self.selectionChange = this.selectionChange.bind(this);
		self.stopDrawing = this.stopDrawing.bind(this);
		// self._viewModal.onModeChangeEvent.subscribe(this.onModeChange.bind(this));
		self.dataModel.highlightChangedEvent.subscribe(this.onHighlightChanged.bind(this));
		self.obHighlighted = ko.observable(false);
		self.openClick = self.openClick.bind(this);
		self.obDisableCreateTripStop = ko.observable(true);
		self.obIsOpenCategory = ko.computed(function()
		{
			return self.dataModel.selectedCategory() && self.dataModel.selectedCategory().Id > 0;
		});
		// self.dataModel.onAllChangeEvent.subscribe(this.continueDrawTripStop.bind(this));
		self.obMode = ko.observable();
		self.routingTripDataModel = viewModel.viewModel.fieldTripPaletteSection.dataModel;
		self.routingTripDataModel.onTripsChangeEvent.subscribe(self.onTripsChangeEvent.bind(self));
	}

	StopPoolEventsManager.prototype = Object.create(TF.RoutingMap.RoutingPalette.BaseRoutingEventsManager.prototype);
	StopPoolEventsManager.prototype.constructor = StopPoolEventsManager;

	StopPoolEventsManager.prototype.onModeChange = function()
	{
		var self = this;
		var mode = this.viewModel.viewModel._viewModal.mode;
		self.obMode(mode);
		self.onModeChangeEvent(mode);
	};

	StopPoolEventsManager.prototype.onHighlightChanged = function()
	{
		this.obDisableCreateTripStop(this.dataModel.highlighted.length == 0 || this.routingTripDataModel.trips.filter(function(trip) { return trip.OpenType == "Edit" }).length == 0);
		this.obHighlighted(this.dataModel.highlighted.length > 0);
	};

	StopPoolEventsManager.prototype.onTripsChangeEvent = function()
	{
		this.obDisableCreateTripStop(this.dataModel.highlighted.length == 0 || this.routingTripDataModel.trips.filter(function(trip) { return trip.OpenType == "Edit" }).length == 0);
	};

	StopPoolEventsManager.prototype.beforeEdit = function(item)
	{
		var self = this;
		return self.dataModel.lockData.lockId(item.id).then(function(id)
		{
			if (id && id != 0)
			{
				return id;
			}
			return Promise.reject();
		});
	};

	StopPoolEventsManager.prototype.continueDrawTripStop = function()
	{
		var self = this;
		if (self._viewModal.mode == "StopPool-Create")
		{
			setTimeout(function()
			{
				self.viewModel.drawTool.start("point", "createPoint");
			});
		} else
		{
			if (self.viewModel.drawTool && self._viewModal.mode != "StopPool-Edit")
			{
				self.viewModel.drawTool.stop();
			}
		}
	};

	StopPoolEventsManager.prototype.createClick = function(model, e)
	{
		var self = this;
		// self._viewModal.setMode("StopPool", "Create");
		self.viewModel.drawTool.create("point");
	};

	StopPoolEventsManager.prototype.createFromSearchResultClick = function(model, e)
	{
		var self = this;
		self._viewModal.setMode("StopPool", "AddFromSearchResult");
		self._createFromSearchResult().then(function()
		{
			self._viewModal.setMode("StopPool", "Normal");
			TF.RoutingMap.RoutingMapPanel.RoutingMapContextMenu.clearOperation();
		});
	};

	StopPoolEventsManager.prototype.createStopFromSelectionClick = function(model, e)
	{
		var self = this;
		self._viewModal.setMode("Routing", "Normal");
		// self._createFromSelection();
	};

	StopPoolEventsManager.prototype.createFromFileClick = function(model, e)
	{
		var $target = e.currentTarget ? $(e.currentTarget).closest(".menu") : e.find(".menu");
		this.fileInput = $target.find("#create-stop-from-file");
		this.fileInput.click();
	};

	StopPoolEventsManager.prototype.settingsClick = function()
	{
		tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.StopPoolSettingsModalViewModel(this.dataModel));
	};

	StopPoolEventsManager.prototype.openClick = function(stopPool)
	{
		this.dataModel.openCategory(stopPool);
	};

	StopPoolEventsManager.prototype.manageCategoryClick = function()
	{
		tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.StopPoolCategoryManageModalViewModel(this.viewModel));
	};

	StopPoolEventsManager.prototype.menuInfoClick = function()
	{
		this.viewModel.editModal.showEditModal();
	};

	StopPoolEventsManager.prototype.infoClick = function(item)
	{
		PubSub.publish("clear_ContextMenu_Operation");
		var self = this;
		self.beforeEdit(item).then(function()
		{
			self.viewModel.editModal.showEditModal([item]).then(function()
			{
				self._viewModal.setMode("StopPool", "Normal");
				self.viewModel.drawTool.changeSymbolToEditing(item.boundary.id);
				function closeEvent()
				{
					self.viewModel.drawTool.changeSymbolToNotEditing();
					self.viewModel.editModal.onCloseEditModalEvent.unsubscribe(closeEvent);
					self.dataModel.highlightChangedEvent.unsubscribe(closeEvent);
				}
				self.viewModel.editModal.onCloseEditModalEvent.subscribe(closeEvent);
				self.dataModel.highlightChangedEvent.subscribe(closeEvent);
			}).catch(function() { });
		});
	};

	StopPoolEventsManager.prototype.copytoTripStopClick = function(item)
	{
		var self = this;
		var tripStop = self.dataModel.findById(item.id);
		return self.viewModel.viewModel.fieldTripPaletteSection.drawTool.copyToTripStop(tripStop);
	};

	StopPoolEventsManager.prototype.createTripStopFromSelectionClick = function()
	{
	};

	StopPoolEventsManager.prototype.copyTripStop = function(stop)
	{
		var self = this;
		var s = TF.RoutingMap.RoutingPalette.StopPoolFeatureData.StopPoolData.getDataModel();
		for (var key in s)
		{
			s[key] = stop[key];
		}
		s.address = stop.address;
		s.boundary = { geometry: TF.cloneGeometry(stop.boundary.geometry) };
		s.geometry = TF.cloneGeometry(stop.geometry);
		s.walkoutGuide = stop.walkoutGuide ? { geometry: TF.cloneGeometry(stop.walkoutGuide.geometry) } : stop.walkoutGuide;
		s.TotalStopTime = TF.Helper.TripStopHelper.convertToMinuteSecond(TF.Helper.TripStopHelper.convertToSeconds(s.TotalStopTime) || 0, "HH:mm:ss");
		s.ProhibitCrosser = stop.ProhibitCrosser || 0;
		return s;
	};
	StopPoolEventsManager.prototype.transformClick = function(type, data)
	{
		var self = this;
		self.beforeEdit(data).then(function()
		{
			self._viewModal.setMode("StopPool", "Edit");
			self.viewModel.drawTool.transform(data.id);
			// self.viewModel.editTool.rightClickEdit("transform", data.id);
		});
	};

	StopPoolEventsManager.prototype.editClick = function(type, data)
	{
		var self = this;
		self.beforeEdit(data).then(function(editableId)
		{
			self.dataModel.lockData.filterEditableGraphics(self.viewModel.editTool.getTouchedGraphic(self.dataModel.findById(editableId), type)).then(function()
			{
				self._viewModal.setMode("StopPool", "Edit");
				self.viewModel.editTool.rightClickEdit(type, editableId);
			}).catch(function() { });
		});
	};

	// StopPoolEventsManager.prototype.reshapeClick = function(type, data)
	// {
	// 	var self = this;
	// 	self.beforeEdit(data).then(function(editableId)
	// 	{
	// 		self.dataModel.lockData.filterEditableGraphics(self.viewModel.editTool.getTouchedGraphic(self.dataModel.findById(editableId), type)).then(function()
	// 		{
	// 			self._viewModal.setMode("StopPool", "Edit");
	// 			self.viewModel.editTool.rightClickEdit("reshape", editableId);
	// 		}).catch(function() { });
	// 	});
	// };

	StopPoolEventsManager.prototype.addRegionClick = function(type, data)
	{
		var self = this;
		self.beforeEdit(data).then(function(editableId)
		{
			self.viewModel.drawTool.addRegion(type, editableId);
		});
	};

	StopPoolEventsManager.prototype.redrawClick = function(type, data)
	{
		var self = this;
		self.beforeEdit(data).then(function(editableId)
		{
			self.viewModel.drawTool.redrawRegion(type, editableId);
		});
	};

	StopPoolEventsManager.prototype.removeRegionClick = function(type, data)
	{
		var self = this;
		self.beforeEdit(data).then(function(editableId)
		{
			self.viewModel.drawTool.removeRegion(type, editableId);
		});
	};

	StopPoolEventsManager.prototype.selectAreaOptionClick = function(type, data, e)
	{
		var self = this;
		self.viewModel.drawTool.select(type);
		PubSub.publish("clear_ContextMenu_Operation");
	};

	StopPoolEventsManager.prototype.selectionChange = function(e, selectedIds)
	{
		this.dataModel.setSelected(selectedIds);
		this.dataModel.setHighlighted(selectedIds);
	};

	StopPoolEventsManager.prototype.saveClick = function(model, e)
	{
		e.stopPropagation();
		this.dataModel.save();
	};

	StopPoolEventsManager.prototype.revertClick = function()
	{
		this.dataModel.revert();
	};

	StopPoolEventsManager.prototype.onModeChangeEvent = function(mode)
	{
		var self = this;
		if (mode.indexOf("StopPool-Create") < 0
			|| mode.indexOf("StopPool-SelectMapArea") < 0)
		{
			self.viewModel.drawTool.stop();
		}
		if (mode != "StopPool-Edit")
		{
			if (self.viewModel.editTool.isEditing)
			{
				self.viewModel.editTool.stop();
			}
		}

		setTimeout(function()
		{
			if (mode == "StopPool-Create")
			{
				self.viewModel.drawTool.start("point", "createPoint");
			}
			// if (mode == "StopPool-Edit")
			// {
			// 	self.viewModel.editTool.start();
			// }
			if (mode.indexOf("StopPool-SelectMapArea") == 0)
			{
				self.viewModel.drawTool.start(mode.split("-")[2], "select");
			}
		});
	};

	StopPoolEventsManager.prototype.deleteClick = function(modal, e)
	{
		e.stopPropagation();
		var self = this;
		var highlightedData = this.dataModel.highlighted;
		if (modal && modal.id)
		{
			highlightedData = [self.dataModel.findById(modal.id)];
		}
		return self.dataModel.lockData.lockAndGetLockInfo(highlightedData.map(function(item) { return item.id; })).then(function(lockInfo)
		{
			var ids = lockInfo.selfLockedList.map(function(data)
			{
				return data.id;
			});
			if (ids.length == 0)
			{
				return;
			}
			self._viewModal.setMode("StopPool", "Normal");
			tf.promiseBootbox.yesNo(
				{
					message: "Are you sure you want to delete " + (ids.length === 1 ? "this Stop" : "these Stops") + "? ",
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

	StopPoolEventsManager.prototype.centerMapClick = function(modal, e)
	{
		e.stopPropagation();
		var map = this.viewModel.viewModel._viewModal._map;
		if (modal && modal.geometry && modal.boundary.geometry)
		{
			TF.RoutingMap.EsriTool.centerSingleItem(map, modal.boundary);
			return;
		}
		if (modal && modal.geometry && !modal.boundary.geometry)
		{
			TF.RoutingMap.EsriTool.centerSingleItem(map, modal);
			return;
		}
		var geometries = this.dataModel.highlighted.map(function(item)
		{
			if (item.boundary.geometry)
			{
				return item.boundary;
			}
			return item;
		});
		if (geometries.length == 0)
		{
			var layer = map.findLayerById("stopPoolFeatureLayer");
			var graphics = layer.graphics.items;
			if (graphics.length == 0)
			{
				return;
			}
			TF.RoutingMap.EsriTool.centerMultipleItem(map, graphics);
		} else
		{
			TF.RoutingMap.EsriTool.centerMultipleItem(map, geometries);
		}
	};

	StopPoolEventsManager.prototype.reshapeClick = function(type, data)
	{
		var self = this;
		self.beforeEdit(data).then(function()
		{
			self._viewModal.setMode("StopPool", "Edit");
			self.viewModel.drawTool.reshape(data.id);
		});
	};

	StopPoolEventsManager.prototype.selectAllClick = function()
	{
		this.dataModel.setHighlighted(this.dataModel.all);
	};

	StopPoolEventsManager.prototype.deselectAllClick = function()
	{
		this.dataModel.setHighlighted([]);
	};

	StopPoolEventsManager.prototype.deleteOneClick = function()
	{

	};

	StopPoolEventsManager.prototype.editBoundaryClick = function()
	{

	};

	StopPoolEventsManager.prototype.editStopClick = function(type, data)
	{
		this.viewModel.drawTool.movePoint(data.id);
	};
	StopPoolEventsManager.prototype.stopEditing = function(e, items)
	{
		var self = this;
		self.dataModel.update(items[0]);
	};

	StopPoolEventsManager.prototype.stopDrawing = function(e, items)
	{
		var self = this;
		this.viewModel.editModal.create({ geometry: items[0] }).then(function()
		{
			self.viewModel.drawTool._polygonLayer.remove(items[1]);
			if (self._viewModal.mode == "StopPool-Create-Polyline")
			{
				self.viewModel.drawTool.start("polyline", "createline");
			}
			if (self._viewModal.mode == "StopPool-Create-Polygon")
			{
				self.viewModel.drawTool.start("polygon", "create");
			}
		}).catch(function()
		{
			self.viewModel.drawTool._polygonLayer.remove(items[1]);
			self._viewModal.setMode("StopPool", "Normal");
		});
	};

	StopPoolEventsManager.prototype.createFromSelectionClick = function()
	{
		var self = this;
		var copyObject = this.copyFromObject();
		self.viewModel.drawTool.copyToStopPool(copyObject);
	};
})();
(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette.ZipCode").EventsManager = EventsManager;
	function EventsManager(zipCodeViewModel)
	{
		this.zipCodeViewModel = zipCodeViewModel;
		this.dataModel = zipCodeViewModel.dataModel;
		this._viewModal = this.zipCodeViewModel._viewModal;
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
		var selected = [];
		var selectedItems = this.dataModel.getSelected();
		for (var i = 0; i < selectedItems.length; i++)
		{
			selectedItems[i].isHighlighted = false;
			selectedItems[i].isSelected = false;
		}
		for (var i = 0; i < selectedIds.length; i++)
		{
			var b = this.dataModel.getZipCodeById(selectedIds[i]);
			if (!b) return;
			b.isSelected = true;
			b.isHighlighted = true;
			selected.push(b);
		}
		this.dataModel.setSelected(selected);
		this.dataModel.setHighlighted(selected);
	};

	EventsManager.prototype.onModeChange = function()
	{
		var self = this;
		var mode = this.zipCodeViewModel._viewModal.mode;
		if (self.zipCodeViewModel.$element)
		{
			var menuContainer = self.zipCodeViewModel.$element.closest(".slider-list");
			self.changeButtonActiveStyle(menuContainer, mode);
		}
	};

	EventsManager.prototype.reshapeClick = function(type, data, e)
	{
		this.zipCodeViewModel.drawTool.reshape(data.id);
	};

	EventsManager.prototype.redrawClick = function(type, data, e)
	{
		this.redrawClickEvent.fire(type, data);
	};

	EventsManager.prototype.removeRegionClick = function(type, data, e)
	{
		this.removeRegionClickEvent.fire(type, data);
	};

	EventsManager.prototype.addRegionClick = function(type, data, e)
	{
		this.addRegionClickEvent.fire(type, data);
	};

	EventsManager.prototype.transformClick = function(type, data, e)
	{
		this.zipCodeViewModel.drawTool.transform(data.id);
	};

	EventsManager.prototype.zipCodeSelectAllClick = function(model, e)
	{
		var data = [];
		data = this.dataModel.getSelectedZipCodes();
		this.dataModel.setHighlighted(data);
	};

	EventsManager.prototype.zipCodeDeselectAllClick = function(model, e)
	{
		this.dataModel.setHighlighted([]);
	};

	EventsManager.prototype.zipCodeClearAllClick = function(model, e)
	{
		var data = this.dataModel.getZipCodeHighlighted();
		this.dataModel.cancelSelected(data);
	};

	EventsManager.prototype.zipCodeDetailsClick = function()
	{
		this.zipCodeViewModel._viewModal.setMode("ZipCode", "Normal");
		PubSub.publish("clear_ContextMenu_Operation");
		this.zipCodeViewModel.zipCodeEditModal.showEditModal();
	};

	EventsManager.prototype.infoClick = function(item)
	{
		PubSub.publish("clear_ContextMenu_Operation");
		var self = this;
		self._lockId(item.id).then(function(editableId)
		{
			if (!editableId)
			{
				return;
			}
			self.zipCodeViewModel.zipCodeEditModal.showEditModal([item]).then(function()
			{
				self.zipCodeViewModel._viewModal.setMode("ZipCode", "Normal");
				var closeEvent = function()
				{
					self.zipCodeViewModel.zipCodeEditModal.onCloseEditModalEvent.unsubscribe(closeEvent);
					self.dataModel.highlightChangedEvent.unsubscribe(closeEvent);
				};
				self.zipCodeViewModel.zipCodeEditModal.onCloseEditModalEvent.subscribe(closeEvent);
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
		return self.dataModel.zipCodeLockData.lockId(id);
	};

	EventsManager.prototype.zipCodeSettingsClick = function(model, e)
	{
		tf.modalManager.showModal(new TF.RoutingMap.MapEditingPalette.ZipCodeSettingsModalViewModel(this.zipCodeViewModel, "zipCode"));
	};

	EventsManager.prototype.centerMapClick = function(boundary, e)
	{
		e.stopPropagation();
		var map = this._viewModal._map;
		if (boundary && boundary.geometry)
		{
			TF.RoutingMap.EsriTool.centerSingleItem(map, boundary);
			return;
		}
		var geometries = this.dataModel.getZipCodeHighlighted();

		if (geometries.length == 0)
		{
			TF.RoutingMap.EsriTool.centerMultipleItem(map, this.dataModel.zipCodes);
		} else
		{
			TF.RoutingMap.EsriTool.centerMultipleItem(map, geometries);
		}
	};

	EventsManager.prototype.deleteZipCodeClick = function(model, e)
	{
		e.stopPropagation();
		var self = this;
		var highlightedData = this.dataModel.getZipCodeHighlighted();
		if (model && model.id)
		{
			highlightedData = [self.dataModel.getZipCodeById(model.id)];
		}
		return self.dataModel.zipCodeLockData.lockAndGetLockInfo(highlightedData.map(function(item) { return item.id; })).then(function(lockinfo)
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
					message: "Are you sure you want to delete " + (ids.length === 1 ? "this postal code boundary" : "these postal code boundaries") + "? ",
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
					var zipCodeItems = [], boundaryItems = [];
					items.forEach(function(item)
					{
						zipCodeItems.push(item);
					});
					if (zipCodeItems.length > 0)
					{
						setTimeout(function()
						{
							self.dataModel.removeZipCode(zipCodeItems);
						});
					}
					if (boundaryItems.length > 0) self.dataModel.removeZipCode(boundaryItems);

					PubSub.publish("clear_ContextMenu_Operation");
					self.dataModel.highlightChangedEvent.notify(self.dataModel.getHighlightedZipCode());
				});
		});
	};

	EventsManager.prototype.saveZipCodeClick = function(model, e)
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
					self.zipCodeViewModel._viewModal.setMode("ZipCode", "Normal");
					self.zipCodeViewModel.dataModel.save().then(function()
					{
						self.zipCodeViewModel._viewModal.obToastMessages.push({
							type: 'success',
							content: 'This record has been successfully saved.',
							autoClose: true
						});
						return true;
					}).catch(function()
					{
						self.zipCodeViewModel._viewModal.obToastMessages.push({
							type: 'error',
							content: 'Save failed',
							autoClose: true
						});
						return false;
					}).then(function(res)
					{
						if (res)
						{
							self.zipCodeViewModel._viewModal.travelScenariosPaletteViewModel.travelScenariosViewModel.updateVectorTileService("PC");
						}
					})
				}
			});
	};

	EventsManager.prototype.revertZipCodeClick = function(model, e)
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
		self.zipCodeViewModel._viewModal.setMode("ZipCode", "Normal");
		self.zipCodeViewModel.dataModel.revert();
		self.zipCodeViewModel._viewModal.obToastMessages.push({
			type: 'success',
			content: 'This record has been successfully reverted.',
			autoClose: true
		});
		// 	}
		// });
	};

	EventsManager.prototype.createZipCodeClick = function()
	{
		this.zipCodeViewModel.drawTool.create("polygon");
	};

	EventsManager.prototype.createFromSelectionClick = function()
	{
		this.zipCodeViewModel._viewModal.setMode("ZipCode", "Normal");
		PubSub.publish("clear_ContextMenu_Operation");
		var copyObject = this.copyFromObject();
		this.zipCodeViewModel.zipCodeEditModal.create(copyObject).catch(function() { });
	};

	EventsManager.prototype.getCopyFrom = function()
	{
		return this.getCopyFromArray([this._viewModal.obCopyPolygonObject()]);
	};

	EventsManager.prototype.zipCodeSelectAreaOptionClick = function(type, data, e)
	{
		this.zipCodeViewModel.drawTool.select(type);
	};

})();

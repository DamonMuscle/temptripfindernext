(function()
{
	createNamespace("TF.UserDefinedField").GeofenceEventsManager = GeofenceEventsManager;

	function GeofenceEventsManager(viewModel)
	{
		var self = this;
		self.viewModel = viewModel;
		self._viewModal = self.viewModel._viewModal;
		self.dataModel = self.viewModel.dataModel;
		// self._viewModal.onModeChangeEvent.subscribe(this.onModeChangeEvent.bind(this));
		self.dataModel.highlightChangedEvent.subscribe(this.onHighlightChanged.bind(this));
		self.obHighlighted = ko.observable(false);
		this.obMode = ko.observable();
		this.saveClick = this.saveClick.bind(this);
		this.centerMapClick = this.centerMapClick.bind(this);
		this.deleteClick = this.deleteClick.bind(this);
	}

	GeofenceEventsManager.prototype.onHighlightChanged = function()
	{
		this.obHighlighted(this.dataModel.highlighted.length > 0);
	};

	GeofenceEventsManager.prototype.stopEditing = function(e, items)
	{
		this.dataModel.update(items);
	};

	GeofenceEventsManager.prototype.createGeofenceClick = function()
	{
		this.viewModel.drawTool.create("polygon");
		this.viewModel.$element.find(".add-parcel").addClass("active");
	}

	GeofenceEventsManager.prototype.selectionChange = function(e, selectedIds)
	{
		this.dataModel.setSelected(selectedIds);
		this.dataModel.setHighlighted(selectedIds);
	};

	GeofenceEventsManager.prototype.settingClick = function()
	{
		tf.modalManager.showModal(new TF.UserDefinedField.GeofenceSettingsModalViewModel(this.dataModel));
	};

	GeofenceEventsManager.prototype.saveClick = function()
	{
		this.dataModel._viewModal.addGeofenceModalVm.positiveClick();
	};

	GeofenceEventsManager.prototype.revertClick = function()
	{
		this.dataModel.revert();
	};

	GeofenceEventsManager.prototype.geoSelectOptionClick = function(type)
	{
		this.viewModel.drawTool.select(type);
		PubSub.publish("clear_ContextMenu_Operation");
	};

	GeofenceEventsManager.prototype.centerMapClick = function(modal, e)
	{
		e.stopPropagation();
		var map = this._viewModal.map;
		if (modal && modal.geometry)
		{
			TF.RoutingMap.EsriTool.centerSingleItem(map, modal);
			return;
		}
		var data = this.dataModel.highlighted;
		if (data.length == 0)
		{
			data = this.viewModel.drawTool._polygonLayer.graphics.items;
		}
		if (data.length == 0)
		{
			return;
		}
		TF.RoutingMap.EsriTool.centerMultipleItem(map, data);
	};

	GeofenceEventsManager.prototype.deleteClick = function(data)
	{
		var self = this, records = [];
		if (data.id)
		{
			records = [data];
		} else
		{
			records = this.dataModel.highlighted;
		}
		const msg = records.length > 1 ? "Are you sure you want to delete these geofences?" : "Are you sure you want to delete this geofence?";

		return tf.promiseBootbox.yesNo({ message: msg, title: "Confirm Message", closeButton: true })
			.then(function(results)
			{
				if (results)
				{
					self.dataModel.delete(records);
				}
				return;
			});
	};

	GeofenceEventsManager.prototype.selectAllClick = function()
	{
		this.dataModel.setHighlighted(this.dataModel.all);
	};

	GeofenceEventsManager.prototype.deselectAllClick = function()
	{
		this.dataModel.setHighlighted([]);
	};

	GeofenceEventsManager.prototype.editParcelClick = function(type, data)
	{
		this.viewModel.drawTool.transform(data.id);
	};

	GeofenceEventsManager.prototype.addRegionClick = function(type, data)
	{
		this.viewModel.drawTool.addRegion(type, data.id);
	};

	GeofenceEventsManager.prototype.removeRegionClick = function(type, data)
	{
		this.viewModel.drawTool.removeRegion(type, data.id);
	};

	GeofenceEventsManager.prototype.redrawClick = function(type, data)
	{
		this.viewModel.drawTool.redrawRegion(type, data.id);
	};

	GeofenceEventsManager.prototype.reshapeClick = function(type, data)
	{
		this.viewModel.drawTool.reshape(data.id);
	};

})();
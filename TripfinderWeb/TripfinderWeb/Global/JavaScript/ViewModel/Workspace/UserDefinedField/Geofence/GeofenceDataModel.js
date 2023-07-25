(function()
{
	createNamespace("TF.UserDefinedField").GeofenceDataModel = GeofenceDataModel;

	function GeofenceDataModel(viewModel)
	{
		const self = this;
		TF.RoutingMap.BaseMapDataModel.call(this, viewModel._viewModal, viewModel);
		if (viewModel._viewModal.geofenceBoundaries)
		{
			this.settings = viewModel._viewModal.geofenceBoundaries.settings;
		}
		self.arcgis = tf.map.ArcGIS;
		self.featureData = self._createGeofenceFeatureData();
		self.refreshEvent = new TF.Events.Event();
		self.obIsModified = ko.observable(false);
		this._canChangeAllDataVisible = true;
	}

	GeofenceDataModel.prototype = Object.create(TF.RoutingMap.BaseMapDataModel.prototype);
	GeofenceDataModel.prototype.constructor = GeofenceDataModel;

	GeofenceDataModel.prototype.init = function()
	{
		var self = this;
		self.map = self.viewModel._viewModal.map;
		self.queryAndDisplay();
		self.obIsModified(false);
	};

	GeofenceDataModel.prototype.queryAndDisplay = function()
	{
		var self = this;
		var oldAll = self.all.slice();
		return self.query().then(function(data)
		{
			self.all = data;
			self.original = self.all.map(function(c)
			{
				return $.extend(true, {}, c);
			});
			self.onAllChangeEvent.notify({ add: [], edit: [], delete: oldAll, isInit: true });
			self.onAllChangeEvent.notify({ add: self.all, delete: [], edit: [], isInit: true });
			self.refreshEvent.notify();
			self.centerLayer();
		});
	};

	GeofenceDataModel.prototype.centerLayer = function ()
	{
		var self = this, map = self.map, data = self.highlighted;
		if (data.length == 0)
		{
			data = self.viewModel.drawTool._polygonLayer.graphics.items;
		}
		if (data.length == 0)
		{
			return;
		}
		TF.RoutingMap.EsriTool.centerMultipleItem(map, data);
	};

	GeofenceDataModel.prototype.create = function(newData)
	{
		var self = this;
		self.viewModel._viewModal.revertMode = "create-geofence";
		self.viewModel._viewModal.revertData = [];
		var data = newData;
		data.id = TF.createId();
		data.DBID = tf.api.datasourceManager.databaseId;

		self.all.push(data);
		self.featureData.add(data);
		self.viewModel._viewModal.revertData.push(data);
		self.onAllChangeEvent.notify({
			add: [data],
			delete: [],
			edit: []
		});
		self.obIsModified(true);
		return data;
	};

	GeofenceDataModel.prototype._createGeofenceFeatureData = function()
	{
		return new TF.UserDefinedField.GeofenceFeatureDataModel();
	};

	GeofenceDataModel.prototype.query = function()
	{
		var self = this;
		let boundaries = [];
		if (self.viewModel._viewModal.geofenceBoundaries)
		{
			const boundariesClone = _.cloneDeep(self.viewModel._viewModal.geofenceBoundaries);
			boundariesClone.boundaries.forEach(boundary =>
			{
				boundary.geometry = tf.map.ArcGIS.Polygon.fromJSON(boundary.geometry);
			});
			boundaries = boundariesClone.boundaries;
		}
		return Promise.resolve(boundaries);
	};

	GeofenceDataModel.prototype.getSetting = function()
	{
		return Promise.resolve(this.settings);
	}

	GeofenceDataModel.prototype.update = function(modifyDataArray, force = false)
	{
		var self = this;
		self.viewModel._viewModal.revertMode = "update-geofence";
		self.viewModel._viewModal.revertData = [];
		if (!$.isArray(modifyDataArray))
		{
			modifyDataArray = [modifyDataArray];
		}
		modifyDataArray.forEach(function(modifyData)
		{
			var data = self.findById(modifyData.id);
			modifyData.geometryChange = modifyData.geometry.rings.toString() != data.geometry.rings.toString();
			const settingChanges = modifyData.name != data.name || modifyData.color != data.color || modifyData.fillPattern != data.fillPattern
			self.viewModel._viewModal.revertData.push($.extend(true, {}, data));
			$.extend(data, modifyData);
			if (modifyData.geometry)
			{
				data.geometry = TF.cloneGeometry(modifyData.geometry);
			}
			self.featureData.update(data, force);
			self.obIsModified(settingChanges || modifyData.geometryChange);
			self.onAllChangeEvent.notify({
				add: [],
				delete: [],
				edit: [data]
			});
		});
		//self.lockData.internalChangeStatus();
	};

	GeofenceDataModel.prototype.delete = function(deleteArray)
	{
		var self = this;
		self.viewModel._viewModal.revertMode = "delete-geofence";
		self.viewModel._viewModal.revertData = [];
		if (!$.isArray(deleteArray))
		{
			deleteArray = [deleteArray];
		}
		deleteArray.forEach(function(data)
		{
			var deleteData = self.findById(data.id);
			self.featureData.delete(deleteData);
			self.viewModel._viewModal.revertData.push(deleteData);
			self.all = self.all.filter(function(c)
			{
				return c.id != data.id;
			});
			self.onAllChangeEvent.notify({ add: [], edit: [], delete: [deleteData] });
		});
		self.obIsModified(true);
		self.refreshSelectAndHighlighted();
		//self.lockData.internalChangeStatus();
	};

	GeofenceDataModel.prototype.revert = function(showMessage)
	{
		var self = this;
		TF.RoutingMap.BaseMapDataModel.prototype.close.call(this);

		self.queryAndDisplay().then(function()
		{
			//self.lockData.internalChangeStatus();
			if (showMessage != false)
			{
				self.showRevertSuccessToastMessage();
			}
			self.obIsModified(false);
		});
	};

	GeofenceDataModel.prototype.close = function()
	{
		TF.RoutingMap.BaseMapDataModel.prototype.close.call(this);
	};

	GeofenceDataModel.prototype.changeVisible = function(id, visible)
	{
		this._canChangeAllDataVisible = false;
		var nez = this.findById(id);
		nez.display = visible;
		this.onAllChangeEvent.notify({ add: [], edit: [nez], delete: [], changeType: "visible" });
		this._canChangeAllDataVisible = true;
	};

	GeofenceDataModel.prototype.changeAllDataVisible = function(visible)
	{
		if (this._canChangeAllDataVisible)
		{
			var self = this;
			this.all.forEach(function(nez)
			{
				if (nez.display != visible)
				{
					self.changeVisible(nez.id, visible);
				}
			});
		}
	};

	GeofenceDataModel.prototype.findById = function(id)
	{
		for (var i = 0, l = this.all.length; i < l; i++)
		{
			if (this.all[i].id == id)
			{
				return this.all[i];
			}
		}
	};

	GeofenceDataModel.prototype._showToastMessage = function(message)
	{
		this.viewModel._viewModal.pageLevelViewModel.popupSuccessMessage(message);
	};


	GeofenceDataModel.prototype.showErrorMessage = function(message)
	{
		this.viewModel._viewModal.pageLevelViewModel.popupErrorMessage(message);
	};

	GeofenceDataModel.prototype.sortSelected = function(source)
	{
		return source.sort(function(a, b)
		{
			return TF.compareOnProperty(a, b, "name");
		});
	};

	GeofenceDataModel.prototype.getAutoRefreshSetting = function()
	{
		return false;
	};

	GeofenceDataModel.prototype.dispose = function()
	{		
		TF.RoutingMap.BaseMapDataModel.prototype.dispose.call(this);
		this.refreshEvent && this.refreshEvent.unsubscribeAll();
	};

})();
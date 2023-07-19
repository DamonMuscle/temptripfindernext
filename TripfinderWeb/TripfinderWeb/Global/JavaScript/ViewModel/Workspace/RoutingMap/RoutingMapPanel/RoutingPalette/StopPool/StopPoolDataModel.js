(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").StopPoolDataModel = StopPoolDataModel;

	function StopPoolDataModel(viewModel)
	{
		TF.RoutingMap.BaseMapDataModel.call(this, viewModel._viewModal, viewModel, "StopPool");
		var self = this;
		self.viewModel = viewModel;
		self.parentViewModel = self.viewModel.parentViewModel;
		self.routeState = self.parentViewModel.routeState;
		self.tripDataModel = self.parentViewModel.tripViewModel.dataModel;
		self.all = [];
		self.highlighted = [];
		self.selected = [];
		self.stopPoolCategories = ko.observableArray([]);
		self.selectedCategory = ko.observable();

		self.onAllChangeEvent = new TF.Events.Event();
		self.highlightChangedEvent = new TF.Events.Event();
		self.selectedChangedEvent = new TF.Events.Event();
		self.settingChangeEvent = new TF.Events.Event();
		self.stopPoolSelectedChangedEvent = new TF.Events.Event();
		self.selectedCategorySettingChangedEvent = new TF.Events.Event();
		self.onTrialStopWalkoutPreviewChange = new TF.Events.Event();

		self.featureData = new TF.RoutingMap.RoutingPalette.StopPoolFeatureData(self);
		self.lockData = new TF.RoutingMap.RoutingPalette.StopPoolLockData(self);
		self.lockData.onLockedChangeEvent.subscribe(self.onLockedChange.bind(self));
		self.tripDataModel.onCandidatesStudentsChangeToMapEvent.subscribe(this.onCandidatesStudentsChangeEvent.bind(this));
	}

	StopPoolDataModel.prototype = Object.create(TF.RoutingMap.BaseMapDataModel.prototype);
	StopPoolDataModel.prototype.constructor = StopPoolDataModel;

	StopPoolDataModel.prototype.init = function()
	{
		var self = this;
		self.inited = true;
		self.map = self.parentViewModel._viewModal._map;
		self.onAllChangeEvent.notify({ add: [], edit: [], delete: self.all });
		self.all = [];
		this.onMenuDataUpdateChange = this.onMenuDataUpdateChange.bind(this);
		self.parentViewModel._viewModal.menuDataUpdateEvent.subscribe(this.onMenuDataUpdateChange);
		return self.initStopPoolCategory().then(function()
		{
			return self.lockData.init();
		}).then(function()
		{
			var category = self.selectedCategory();
			if ((!category || !category.Id) && self.stopPoolCategories().length > 0)
			{
				category = self.stopPoolCategories()[0];
				// apply stop pool category in storage
				if (tf.storageManager.get("stopPoolCategory"))
				{
					var savedCategoryId = tf.storageManager.get("stopPoolCategory");
					var savedCategory = Enumerable.From(self.stopPoolCategories()).FirstOrDefault(null, function(c) { return c.Id == savedCategoryId; });
					if (savedCategory)
					{
						category = savedCategory;
					}
				}
			}

			self.openCategory(category);
		});
	};

	StopPoolDataModel.prototype.onMenuDataUpdateChange = function(e, data)
	{
		var self = this;
		if (Enumerable.From(data.UpdatedRecords).Any(function(c) { return c.Type == "StopPoolCategory"; }))
		{
			self.initStopPoolCategory().then(function()
			{
				var category = self.selectedCategory();
				if (category)
				{
					var newCategory = Enumerable.From(self.stopPoolCategories()).FirstOrDefault(null, function(c) { return c.Id == category.Id; });
					if (newCategory)
					{
						self.selectedCategory(newCategory);
						self.selectedCategorySettingChangedEvent.notify(newCategory);
					}
				}
			});
		}
	};

	StopPoolDataModel.prototype.openCategory = function(stopPoolCategory)
	{
		var self = this;
		if (!stopPoolCategory || (self.selectedCategory() && stopPoolCategory.Id == self.selectedCategory().Id))
		{
			return;
		}

		self.unSaveCheck().then(function(isModified)
		{
			if (isModified)
			{
				return self.unSaveCheckConfirmBox();
			}
		}).then(function()
		{
			self.close();
			self.selectedCategory(stopPoolCategory);
			tf.storageManager.save("stopPoolCategory", stopPoolCategory.Id);
			self.queryAndDisplay();
		});
	};

	/**
	* query stop pool data and notify them to display
	*/
	StopPoolDataModel.prototype.queryAndDisplay = function()
	{
		var self = this;
		return self.featureData.query().then(function(items)
		{
			// set default vehicle curb approach value temporarily, will delete after T2 add this field to table.
			items.forEach(function(item)
			{
				item.vehicleCurbApproach = 1;
				item.id = item.StopId;
			});
			if (self.parentViewModel.obShow())
			{
				self.all = items;
				self.onAllChangeEvent.notify({ add: items, delete: [], edit: [] });
				self.onCandidatesStudentsChangeEvent();
			}
		}).catch(function(error)
		{
			TF.consoleOutput("error", "StopPoolDataModel queryAndDisplay fails: " + error);
		});
	};

	/**
	* get all category and auto use first one
	*/
	StopPoolDataModel.prototype.initStopPoolCategory = function()
	{
		var self = this;
		return this._getStopPoolCategories().then(function(data)
		{
			self.stopPoolCategories(data);
		});
	};

	StopPoolDataModel.prototype._getStopPoolCategories = function()
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "stoppoolcategories"), {
			paramData: {
				dbid: tf.datasourceManager.databaseId
			}
		}).then(function(apiResponse)
		{
			return apiResponse.Items;
		});
	};

	StopPoolDataModel.prototype.getEditTrips = function()
	{
		return [];
	};
	/**
	 * delete category
	 * @param {number} id
	 */
	StopPoolDataModel.prototype.deleteCategory = function(id)
	{
		if (this.selectedCategory() && id == this.selectedCategory().Id)
		{
			this.close();
		}
		return this.initStopPoolCategory();
	};

	StopPoolDataModel.prototype.updateSelectedCategory = function(updatedCategory)
	{
		var self = this;
		if (self.selectedCategory() && self.selectedCategory().Id == updatedCategory.Id)
		{
			self.selectedCategory(updatedCategory);
			self.selectedCategorySettingChangedEvent.notify(updatedCategory);
		}
	};

	StopPoolDataModel.prototype.create = function(newData)
	{
		var self = this;
		self._viewModal.revertMode = "create-StopPool";
		self._viewModal.revertData = [];
		var data = TF.RoutingMap.RoutingPalette.StopPoolFeatureData.StopPoolData.getDataModel();
		for (var key in newData)
		{
			data[key] = newData[key];
		}

		// check id 0 when from revert operation
		if (data.id == 0)
		{
			data.id = TF.createId();
			data.StopId = data.id;
		}
		data.DBID = tf.datasourceManager.databaseId;
		data.StopPoolCategoryID = self.selectedCategory().Id;
		if (!data.boundary || !data.boundary.id)
		{
			data.boundary = TF.RoutingMap.RoutingPalette.StopPoolFeatureData.BoundaryData.createTripBoundary(data);
		}
		data.boundary.DBID = tf.datasourceManager.databaseId;
		data.boundary.StopId = data.StopId;
		self.all.push(data);
		self.insertToRevertData(data);
		self.updateStudent(data);
		self.featureData.add(data);
		self.onAllChangeEvent.notify({
			add: [data],
			delete: [],
			edit: []
		});
		self.calcSelfChangeCount();
		return Promise.resolve(data);
	};

	StopPoolDataModel.prototype.update = function(modifyDataArray)
	{
		var self = this, updateData = [];
		self._viewModal.revertMode = "update-StopPool";
		self._viewModal.revertData = [];
		if (!$.isArray(modifyDataArray))
		{
			modifyDataArray = [modifyDataArray];
		}
		modifyDataArray.forEach(function(modifyData)
		{
			var data = self.findById(modifyData.id);
			self.insertToRevertData(data);
			if (!TF.equals(data.boundary, modifyData.boundary, false))
			{
				$.extend(data, modifyData);
				if (modifyData.geometry)
				{
					data.geometry = TF.cloneGeometry(modifyData.geometry);
				}

				if (modifyData.boundary.geometry)
				{
					data.boundary.geometry = TF.cloneGeometry(modifyData.boundary.geometry);
				}
				self.updateStudent(data);
				self.featureData.update(data);
				updateData.push(data);
			}
		});
		if (updateData.length > 0) self.onAllChangeEvent.notify({ add: [], edit: updateData, delete: [] });
		self.calcSelfChangeCount();
	};

	StopPoolDataModel.prototype.delete = function(deleteArray)
	{
		var self = this;
		self._viewModal.revertMode = "delete-StopPool";
		self._viewModal.revertData = [];
		deleteArray.forEach(function(data)
		{
			var deleteData = self.findById(data.id);
			self.insertToRevertData(deleteData);
			self.featureData.delete(deleteData);
			self.all = self.all.filter(function(c)
			{
				return c.id != data.id;
			});
			self.onAllChangeEvent.notify({ add: [], edit: [], delete: [deleteData] });
		});
		self.refreshSelectAndHighlighted();
		self.calcSelfChangeCount();
	};

	StopPoolDataModel.prototype.onCandidatesStudentsChangeEvent = function()
	{
		var self = this;
		clearTimeout(self.onCandidatesStudentsChangeEventTimeout);
		self.onCandidatesStudentsChangeEventTimeout = setTimeout(function()
		{
			if (self.all)
			{
				self.all.forEach(function(stop)
				{
					self.updateStudent(stop);
				});
				self.onAllChangeEvent.notify({ add: [], edit: self.all, delete: [] });
			}
		}, 100);
	};

	StopPoolDataModel.prototype.updateStudent = function(data)
	{
	};

	StopPoolDataModel.prototype.findByStopId = function(stopId)
	{
		for (var i = 0, l = this.all.length; i < l; i++)
		{
			if (this.all[i].StopId == stopId)
			{
				return this.all[i];
			}
		}
	};

	StopPoolDataModel.prototype.getHeartBoundaryId = function(pointGraphic)
	{
		return pointGraphic.attributes.dataModel.boundary.id;
	};

	/**
	* modify data lock property when locked
	*/
	StopPoolDataModel.prototype.onLockedChange = function(e, lockInfo)
	{
		var self = this;
		var otherLockEnumerable = Enumerable.From(lockInfo.lockedByOtherList);
		self.all.forEach(function(data)
		{
			var lockedInfo = otherLockEnumerable.FirstOrDefault(null, function(x) { return x.Id == data.id; });
			var isLockedByOther = !!lockedInfo;
			var lockedByUser = TF.RoutingMap.LockData.displayLockedUser(lockedInfo);
			data.isLockedByOther = isLockedByOther;
			data.lockedByUser = lockedByUser;
		});
	};

	StopPoolDataModel.prototype.getStorage = function()
	{
		return {
			autoRefresh: { key: "autoRefreshStopPool", default: false },
			moveDuplicateNodes: { key: "moveDuplicateNodesStopPool", default: false },
			removeOverlapping: { key: "removeOverlappingStopPool", default: false },
			fillPattern: { key: "fillPatternStopPool", default: "Semi" },
			boundaryThickness: { key: "boundaryThicknessStopPool", default: 5 }
		};
	};

	StopPoolDataModel.prototype.save = function()
	{
		var self = this;
		self.clearRevertInfo();
		return this.featureData.save().then(function()
		{
			self.showSaveSuccessToastMessage();
		}).catch(function()
		{
			self._getStopPoolCategories().then(function(categories)
			{
				var exist = Enumerable.From(categories).Any(function(c) { return c.Id == self.selectedCategory().Id; });
				if (!exist)
				{
					tf.promiseBootbox.alert("Save Failed, current category is deleted.", 'Error').then(function()
					{
						self.close();
					});
				}
			});
		});
	};

	StopPoolDataModel.prototype.revert = function(showMessage)
	{
		var self = this;
		TF.RoutingMap.BaseMapDataModel.prototype.close.call(this);
		self.queryAndDisplay().then(function()
		{
			if (showMessage != false)
			{
				self.showRevertSuccessToastMessage();
			}
		});
	};

	StopPoolDataModel.prototype.sortSelected = function(source)
	{
		return source.sort(function(a, b)
		{
			return TF.compareOnProperty(a, b, "Street");
		});
	};

	StopPoolDataModel.prototype.close = function()
	{
		TF.RoutingMap.BaseMapDataModel.prototype.close.call(this);
		this.selectedCategory({});
		this.selectedCategorySettingChangedEvent.notify({});
	};

	StopPoolDataModel.prototype.dispose = function()
	{
		this.parentViewModel._viewModal.menuDataUpdateEvent.unsubscribe(this.onMenuDataUpdateChange);
		this.featureData.dispose();
		this.lockData.dispose();
		this.all = null;
		this.highlighted = null;
		this.selected = null;
		this.stopPoolCategories = null;
		this.selectedCategory = null;
	};
})();
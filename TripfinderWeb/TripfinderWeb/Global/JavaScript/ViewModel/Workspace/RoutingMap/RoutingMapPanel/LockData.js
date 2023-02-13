(function()
{
	createNamespace("TF.RoutingMap").LockData = LockData;

	function LockData(options)
	{
		var self = this;
		this.options = $.extend({}, defaults, options);
		this.lockInfo = {};
		this.obSelfChangeCount = ko.observable(0);
		this.obSelfChangeStyle = ko.observable(false);
		this.obOtherChangeCount = ko.observable(0);
		this.obOtherChangeContent = ko.observable("");
		this.otherChangeInfo = {};
		this._emptyOtherChangeInfo();
		this.refreshOtherChange = this.refreshOtherChange.bind(this);
		this.hasNewOtherChangeInfo = false;

		this.onLockedChangeEvent = new TF.Events.Event();
		this.updatedRecords = {};
		this.selfLockIds = ko.observableArray([]);
		this.selfLockIds.subscribe(self._updateGlobalSelfLockInfo.bind(self));

		// unlock all data when close windows
		// $(window).unbind("beforeunload." + options.type()).on("beforeunload." + options.type(), function()
		// {
		// 	self.unLock();
		// });

		this.onUpdateRecords = this.onUpdateRecords.bind(this);
		this.releaseUnEditLock = this.releaseUnEditLock.bind(this);
		if (self.options.viewModel._viewModal)
		{
			if (this.options.viewModel._viewModal.onUpdateRecordsEvent)
			{
				this.options.viewModel._viewModal.onUpdateRecordsEvent.subscribe(this.onUpdateRecords);
			}
			if (this.options.viewModel._viewModal.onStopEditingEvent)
			{
				this.options.viewModel._viewModal.onStopEditingEvent.subscribe(this.releaseUnEditLock);
			}
		}
	}

	var defaults = {
		type: function() { return ""; },
		displayName: "",
		featureData: null,
		extraInfo: function() { return ""; },
		viewModel: null,
		getAutoRefreshSetting: function() { return true; },
		refreshOtherChangeData: function()
		{
			return Promise.resolve();
		},
		getRelatedId: function() { return null; }
	};

	LockData.prototype._updateGlobalSelfLockInfo = function()
	{
		var self = this;
		var storage = JSON.parse(tf.storageManager.get("selfLockRoutes", true) || "{}");
		window.selfLocks = storage || {};
		window.selfLocks[self.options.viewModel.routeState + "-" + self.options.type()] = {
			ids: self.selfLockIds(),
			extraInfo: self.options.extraInfo(),
			type: self.options.type(),
			dbid: tf.datasourceManager.databaseId
		};

		tf.storageManager.save("selfLockRoutes", JSON.stringify(window.selfLocks), true);
	};

	LockData.displayLockedUser = function(lockInfo)
	{
		if (lockInfo)
		{
			return "Locked by " + lockInfo.UserName;
		}
		return "";
	};

	// #region lock 
	LockData.prototype.unLock = function(ids)
	{
		if (ids && !Array.isArray(ids))
		{
			ids = [ids];
		}

		var unLockId = ids || (this.lockInfo.selfLockedList || []).map(function(c) { return c.id; });
		if (unLockId.length == 0)
		{
			return this.setAndGetlockInfo(unLockId, false);
		}

		let selfLockIds = [];
		if (ids && ids.length)
		{
			let firstId = ids[0];
			if (typeof firstId != "string")
			{
				ids = ids.map(i => i?.toString());
			}

			selfLockIds = this.selfLockIds().filter(i => !ids.includes(i));
		}

		this.selfLockIds(selfLockIds);
		return this.setAndGetlockInfo(unLockId, false);
	};

	LockData.prototype.unLockCurrentDocument = function()
	{
		return this.unLock(this.selfLockIds.slice());
	};

	LockData.prototype.getLockInfo = function()
	{
		return this.setAndGetlockInfo([], true);
	};

	LockData.prototype.lockAndGetLockInfo = function(ids)
	{
		var self = this;
		if (!$.isArray(ids))
		{
			ids = [ids];
		}
		return self.setAndGetlockInfo(ids, true).then(function(lockInfo)
		{
			let first = lockInfo.selfLockedList[0],
				isString = first && typeof first.id == "string",
				firstId = ids[0],
				hasIdField = firstId != null && firstId.id != null;
			ids = ids.map(x =>
			{
				x = hasIdField ? x.id : x;
				return isString ? x?.toString() : x;
			});

			return {
				lockedByOtherList: lockInfo.lockedByOtherList,
				selfLockedList: lockInfo.selfLockedList.filter(function(x)
				{
					return ids.includes(x.id);
				})
			};
		});
	};

	LockData.prototype.lockId = function(id)
	{
		var self = this;
		return self._getAndLockIds(id).then(function(ids)
		{
			if (ids.length == 1)
			{
				return ids[0];
			}
			PubSub.publish("clear_ContextMenu_Operation");
			return null;
		});
	};

	LockData.prototype.lockIds = function(ids)
	{
		var self = this;
		return self._getAndLockIds(ids);
	};

	LockData.prototype._getAndLockIds = function(id)
	{
		var self = this;

		return this.lockAndGetLockInfo(id).then(function(lockInfo)
		{
			var ids = lockInfo.selfLockedList.map(function(x) { return x.id; });
			var selfLockIds = self.selfLockIds().slice();
			ids.forEach(function(id)
			{
				if (selfLockIds.indexOf(id) < 0)
				{
					selfLockIds.push(id);
				}
			});
			self.selfLockIds(selfLockIds);
			return ids;
		});
	};

	LockData.prototype.getChangeIds = function()
	{
		var self = this;
		function getIds(items)
		{
			return items.map(function(t) { return t.id; });
		}
		var updateItemsIds = getIds(self.options.featureData.updateItems);
		var addItemsIds = getIds(self.options.featureData.addItems);
		var deleteItemsIds = getIds(self.options.featureData.deleteItems);

		var selfChangeIds = updateItemsIds.concat(addItemsIds).concat(deleteItemsIds);

		if (self.options.type() == "Point")
		{
			var relateIds = self.options.viewModel.dataModel
				.parcelFeatureData.updateItems.map(function(t) { return t.relateId; });

			selfChangeIds = selfChangeIds.concat(relateIds);
		}

		return Enumerable.From(selfChangeIds);
	};

	LockData.prototype.releaseUnEditLock = function()
	{
		var self = this;
		if (!self.options.viewModel.obShow() ||
			!self.options.featureData ||
			!self.options.featureData.addItems ||
			!self.lockInfo ||
			!self.lockInfo.selfLockedList)
		{
			return;
		}
		this.autoReleaseUnEditTimeout = setTimeout(function()
		{
			if (self.lockInfo && self.lockInfo.selfLockedList)
			{
				var changeIds = self.getChangeIds();
				var unLockIds = [];
				self.lockInfo.selfLockedList.filter(function(lockInfo)
				{
					if (!changeIds.Any(function(x) { return x == lockInfo.Id || x == self.options.getRelatedId(lockInfo.Id); }))
					{
						unLockIds.push(lockInfo.Id);
						if (self.options.getRelatedId && self.options.getRelatedId(lockInfo.Id))
						{
							unLockIds.push(self.options.getRelatedId(lockInfo.Id));
						}
					}
				});
				if (unLockIds.length > 0)
				{
					self.unLock(unLockIds);
				}
			}
		});
	};

	LockData.prototype.filterUnLockItems = function(items, autoLock)
	{
		if (!$.isArray(items))
		{
			items = [items];
		}
		var converted = {};
		var filterItems = items.map(function(t)
		{
			if (t && t.relatePoint)
			{
				converted[t.relatePoint.id] = t;
				return t.relatePoint;
			}
			converted[t.id] = t;
			return t;
		});
		var self = this;
		var isAutoLock = typeof (autoLock) != "undefined" ? !!autoLock : true;

		// if these ids is all locked by self,and it is cached, then return cache value
		if (filterItems && filterItems.length > 0 && this.lockInfo && this.lockInfo.selfLockedList && this.lockInfo.selfLockedList.length > 0)
		{
			var selfLockedListEnumerable = Enumerable.From(this.lockInfo.selfLockedList);
			var allSelfLocked = true;
			for (var i = 0, l = filterItems.length; i < l; i++)
			{
				if (!selfLockedListEnumerable.Any(function(x) { return x.id == filterItems[i].id; }))
				{
					allSelfLocked = false;
					break;
				}
			}
			if (allSelfLocked)
			{
				return Promise.resolve(items);
			}
		}

		return self.setAndGetlockInfo(isAutoLock ? (filterItems.map(function(s) { return s.id; }) || []) : [], true).then(function(lockInfo)
		{
			var locks = (filterItems || []).filter(function(item)
			{
				return !Enumerable.From(lockInfo.lockedByOtherList).Any(function(x) { return x.id == item.id; });
			});
			if (isAutoLock)
			{
				locks.forEach(function(i) { self.selfLockIds.push(i.id); });
			}

			return locks.map(function(t)
			{
				return converted[t.id];
			});
		});
	};

	LockData.prototype.filterEditableGraphics = function(graphics)
	{
		var self = this;
		var items = graphics.map(function(item)
		{
			return item.attributes.dataModel;
		});
		items = Enumerable.From(items).Distinct("$.id").ToArray();
		return self.filterUnLockItems(items).then(function(data)
		{
			if (data.length != items.length)
			{
				tf.promiseBootbox.alert("One or more boundaries are locked for editing.  Turn off Move Duplicate Nodes.");
				PubSub.publish("clear_ContextMenu_Operation");
				return Promise.reject();
			}
			return self.filterUnLockItems(items, true).then(function(data)
			{
				var dataEnum = Enumerable.From(data);
				return Enumerable.From(graphics).Where(function(c) { return dataEnum.Any("$.id=='" + c.attributes.dataModel.id + "'"); }).Distinct("$.attributes.dataModel.id").ToArray();
			});
		});
	};

	/**
	* lock or unlock parcel
	* @param {array} ids parcel id to lock or unlock
	* @param {boolean} isLock lock or unlock 
	* @returns lock information
	*/
	LockData.prototype.setAndGetlockInfo = function(ids, isLock)
	{
		var self = this, needRefreshData = [];
		if (!$.isArray(ids))
		{
			ids = [ids];
		}
		if (isLock)
		{
			if (ids.length > 0)
			{
				ids = ids.filter(function(id)
				{
					var refreshData = self.getRefreshDataById(id);
					if (refreshData)
					{
						needRefreshData.push({ id: refreshData.RecordId, UserId: refreshData.UserId });
						return false;
					}
					return true;
				});
			}
			this.otherChangeInfo.splitData.forEach(function(item)
			{
				item.forEach(function(d)
				{
					needRefreshData.push({ id: d.RecordId, UserId: d.UserId });
				});
			});
		}
		return tf.lockData.setLock({
			ids: ids,
			extraInfo: self.options.extraInfo(),
			type: self.options.type(),
			isLock: isLock,
			databaseId: dataBaseWhiteList.indexOf(self.options.type()) >= 0 ? 0 : tf.datasourceManager.databaseId
		}).then(function(response)
		{
			var lockEntity = {
				lockedByOtherList: response.lockedByOtherList.concat(needRefreshData),
				selfLockedList: response.selfLockedList
			};
			self.onLockedChangeEvent.notify(lockEntity);
			self.lockInfo = lockEntity;
			return lockEntity;
		});
	};

	LockData.prototype.getRefreshDataById = function(id)
	{
		if (this.otherChangeInfo)
		{
			for (var i = this.otherChangeInfo.splitData.length - 1; i >= 0; i--)
			{
				for (var j = 0; j < this.otherChangeInfo.splitData[i].length; j++)
				{
					if (this.otherChangeInfo.splitData[i][j].RecordId == id && this.otherChangeInfo.splitData[i][j].Type == this.options.type())
					{
						return this.otherChangeInfo.splitData[i][j];
					}
				}
			}
		}
		return null;
	};

	// #endregion

	// #region refresh
	LockData.prototype.init = function()
	{
		this._removeRefreshToast();
		this._emptyOtherChangeInfo();
		this.lockInfo = {};
		return Promise.resolve();
	};

	LockData.prototype.calcSelfChangeCount = function()
	{
		var changeData = this.getChangeData();
		var changeCount = changeData.adds.length + changeData.updates.length + changeData.deletes.length;
		this.obSelfChangeCount(changeCount);
	};

	LockData.prototype.calcSelfChangeCountAndStyle = function(ans)
	{
		var self = this;
		self.calcSelfChangeCount();
		self.obSelfChangeStyle(ans != "success");
	};

	LockData.prototype.getChangeData = function()
	{
		if (this.options && this.options.featureData)
		{
			var changeData = this.options.featureData.getChangeData();
			return {
				deletes: changeData.deleteGraphic,
				updates: changeData.editGraphic,
				adds: changeData.addGraphic
			};
		} else
		{
			return {
				deletes: [],
				updates: [],
				adds: [],
			};
		}
	};

	LockData.prototype._removeRefreshToast = function(data)
	{
		var self = this;
		if (self.options.viewModel._viewModal.obToastMessages)
		{
			for (var i = 0; i < self.options.viewModel._viewModal.obToastMessages().length; i++)
			{
				var item = self.options.viewModel._viewModal.obToastMessages()[i];
				if (item == data || (!data && item.key == self.options.type()))
				{
					self.options.viewModel._viewModal.obToastMessages.remove(item);
					i--;
				}
			}
		}
	};

	LockData.prototype._setOtherChangePopup = function()
	{
		var self = this;
		var changeContent = "";
		var userCount = 0;
		for (var key in self.otherChangeInfo.groupedData)
		{
			userCount++;
			var item = self.otherChangeInfo.groupedData[key];
			changeContent += String.format("{0} made {1} change{2}<br/>", item.userName, item.records.length, item.records.length > 1 ? "s" : "");
		}
		if (changeContent && userCount == 1)
		{
			changeContent = changeContent.substring(0, changeContent.length - 5) + ".";
		}
		self.obOtherChangeContent(changeContent);
	};

	LockData.prototype._getAutoRefreshSetting = function()
	{
		return true;
	};

	LockData.prototype._setOtherChangeToast = function()
	{
		var self = this;
		if (self.hasNewOtherChangeInfo && !self._getAutoRefreshSetting() && self.options.viewModel.obShow())
		{
			var index = self.otherChangeInfo.splitData.length - 1;
			if (self.otherChangeInfo.splitData[index].length > 0)
			{
				var data = {
					type: "success",
					key: self.options.type(),
					content: self._getRefreshMessage(self.otherChangeInfo.splitData[index], true),
					autoClose: true,
					autoCloseSecond: 10,
					refresh: function(index)
					{
						self.refreshOtherChange(null, null, index);
						self._removeRefreshToast(data);
					}.bind(self, index)
				};
				if (data.content)
				{
					self.options.viewModel._viewModal.obToastMessages.push(data);
				}
			}
		}
	};

	LockData.prototype._emptyOtherChangeInfo = function()
	{
		this.otherChangeInfo = {
			count: 0,
			groupedData: {},
			splitData: [],
			allIds: []
		};
		this.obOtherChangeCount(0);
		this.obOtherChangeContent("");
	};

	var dataBaseWhiteList = ["travelRegion", "myStreets", "railroad", "zipCode", "municipalBoundary", "water", "landmark", "Point"];

	/**
	* get update record interval
	*/
	LockData.prototype.onUpdateRecords = function(e, data)
	{
		var self = this;
		if (!self.options.viewModel.obShow())
		{
			return;
		}
		var updatedRecords = Enumerable.From(data.UpdatedRecords).Where(function(c)
		{
			if (dataBaseWhiteList.indexOf(c.Type) < 0 && data.DatabaseId != tf.datasourceManager.databaseId)
			{
				return false;
			}
			var isModifyBySelf = self.updatedRecords[c.RecordId] && c.UserId == self.getSelfUserId();
			if (isModifyBySelf && c.RouteState && c.RouteState != self.options.viewModel.routeState)
			{
				isModifyBySelf = false;
			}
			return c.Type == self.options.type() && !isModifyBySelf;
		}).ToArray();

		self.displayUpdatedRecords(updatedRecords);
	};

	LockData.prototype.displayUpdatedRecords = function(updatedRecords)
	{
		var self = this;

		if (updatedRecords.length > 0)
		{
			self.hasNewOtherChangeInfo = true;
			self.otherChangeInfo.splitData.push(updatedRecords);
			self.calcOtherChangeInfo();
			self._setOtherChangeAutoRefresh();
			self._setOtherChangeToast();
		} else
		{
			self.hasNewOtherChangeInfo = false;
		}
	};

	LockData.prototype.refreshOtherChange = function(model, e, splitDataIndex)
	{
		var self = this;
		if (e)
		{
			$(e.target).closest(".tooltip").hide();
		}
		var refreshIds = self.otherChangeInfo.allIds;
		if (splitDataIndex > -1)
		{
			refreshIds = [];
			self.otherChangeInfo.splitData[splitDataIndex].forEach(function(refreshData)
			{
				refreshIds.push(refreshData.RecordId);
				self.otherChangeInfo.splitData.forEach(function(data, index)
				{
					if (index != splitDataIndex)
					{
						for (var i = 0; i < data.length; i++)
						{
							if (data[i].RecordId == refreshData.RecordId)
							{
								data.splice(i, 1);
								i--;
							}
						}
					}
				});
			});
			self.otherChangeInfo.splitData[splitDataIndex] = [];
		}
		else
		{
			self._removeRefreshToast();
			self.otherChangeInfo.splitData = [];
		}
		self.calcOtherChangeInfo();

		self.setAndGetlockInfo([], true);

		return self.options.refreshOtherChangeData(refreshIds).then(function(changedIds)
		{
			PubSub.publish("clear_ContextMenu_Operation");
			self.clearChangeData(refreshIds);
			self.calcSelfChangeCount();
			return Promise.resolve(changedIds);
		});
	};

	LockData.prototype.getSelfUserId = function()
	{
		return tf.authManager.authorizationInfo.authorizationTree.userId;
	};

	/**
	* when open multiple tab of maps , auto refresh self change on different tab
	*/
	LockData.prototype.autoRefreshSelfChange = function()
	{
		var self = this;
		var selfUserId = self.getSelfUserId();
		if (self.otherChangeInfo.groupedData[selfUserId])
		{
			// get self change ids
			var refreshIds = self.otherChangeInfo.groupedData[selfUserId].records.map(function(t) { return t.id; });

			// remove self change from update list
			for (var i = 0; i < refreshIds.length; i++)
			{
				self.otherChangeInfo.allIds = self.otherChangeInfo.allIds.filter(function(d)
				{
					return d != refreshIds[i];
				});
				for (var j = 0; j < self.otherChangeInfo.splitData.length; j++)
				{
					self.otherChangeInfo.splitData[j] = self.otherChangeInfo.splitData[j].filter(function(d)
					{
						return d.RecordId != refreshIds[i];
					});
				}
			}

			self.calcOtherChangeInfo();

			self.setAndGetlockInfo([], true);

			// refresh self change data
			self.options.refreshOtherChangeData(refreshIds).then(function()
			{
				PubSub.publish("clear_ContextMenu_Operation");
			});
			self.clearChangeData(refreshIds);
			self.calcSelfChangeCount();
		}
	};

	LockData.prototype.clearChangeData = function(refreshIds)
	{
		if (this.options.featureData)
		{
			this.options.featureData.clear(refreshIds);
		}
	};

	LockData.prototype._setOtherChangeAutoRefresh = function()
	{
		var self = this;
		self.autoRefreshSelfChange();
		if (self.hasNewOtherChangeInfo && self._getAutoRefreshSetting())
		{
			var changeContent = self._getRefreshMessage(self.otherChangeInfo.splitData[self.otherChangeInfo.splitData.length - 1], false);
			self._removeRefreshToast();
			self.refreshOtherChange().then(function(changeIds) 
			{
				if ((!changeIds || (changeIds && changeIds.length > 0)) && changeContent && self.options.viewModel._viewModal.obToastMessages)
				{
					self.options.viewModel._viewModal.obToastMessages.push(
						{
							type: "success",
							content: changeContent,
							autoClose: true
						});
				}
			});
		}
	};

	LockData.prototype._getRefreshMessage = function(records, addRefreshButton)
	{
		const self = this;
		let changeContent = "";
		let groupedRecords = Enumerable.From(records)
			.GroupBy((x) => x.UserName)
			.Select((x) =>
			{
				return {
					userName: x.Key(),
					count: x.Count((y) => y.RecordId)
				};
			})
			.Where((x) => x.count > 0)
			.ToArray();

		if (groupedRecords.length > 0)
		{
			groupedRecords.forEach((item) =>
			{
				changeContent += `${item.userName} has made ${item.count} ${self.options.displayName} update${item.count > 1 ? "s" : ""}, `;
			});
			changeContent = changeContent.substring(0, changeContent.length - 2);
			if (addRefreshButton)
			{
				changeContent += "<a data-bind='click:refresh'>  Refresh</a>";
			}
			else
			{
				changeContent += ", map has been refreshed";
			}
		}
		return changeContent;
	};

	LockData.prototype.calcOtherChangeInfo = function()
	{
		var self = this;
		var allCount = 0;
		self.otherChangeInfo.count = 0;
		self.otherChangeInfo.groupedData = {};
		self.otherChangeInfo.allIds = [];
		self.otherChangeInfo.splitData.forEach(function(data)
		{
			data.forEach(function(item)
			{
				if (!self.otherChangeInfo.groupedData[item.UserId])
				{
					self.otherChangeInfo.groupedData[item.UserId] = { userName: item.UserName, records: [] };
				}
				if (!Enumerable.From(self.otherChangeInfo.groupedData[item.UserId].records).Any(function(c) { return c.id == item.RecordId; }))
				{
					self.otherChangeInfo.groupedData[item.UserId].records.push({ id: item.RecordId });
					self.otherChangeInfo.allIds.push(item.RecordId);
				}
			});
		});
		for (var key in self.otherChangeInfo.groupedData)
		{
			allCount += self.otherChangeInfo.groupedData[key].records.length;
		}
		self.otherChangeInfo.count = allCount;
		self.obOtherChangeCount(allCount);
		self._setOtherChangePopup();
	};

	LockData.prototype._getId = function(attributes)
	{
		return attributes.OBJECTID || attributes.ID || attributes.id;
	};

	LockData.prototype.saveData = function(changeData)
	{
		var self = this;
		var updatedRecords = [];
		changeData.addGraphic.map(function(item)
		{
			var record = {
				Id: self._getId(item.attributes),
				Type: self.options.type(),
				Operation: "add"
			};
			updatedRecords.push(record);
		});
		changeData.editGraphic.map(function(item)
		{
			var record = {
				Id: self._getId(item.attributes),
				Type: self.options.type(),
				Operation: "edit"
			};
			updatedRecords.push(record);
		});
		changeData.deleteGraphic.map(function(item)
		{
			var record = {
				Id: self._getId(item.attributes),
				Type: self.options.type(),
				Operation: "delete"
			};
			updatedRecords.push(record);
		});
		self.updateRecords(updatedRecords);
	};

	LockData.prototype.updateRecords = function(updatedRecords)
	{
		var self = this;
		updatedRecords.forEach(function(item)
		{
			item.routeState = self.options.viewModel.routeState;
			self.updatedRecords[item.Id] = $.extend({}, item);
		});
		return TF.RoutingMap.MapUpdatedRecordsHubHelper.prototype.updateRecords(updatedRecords, "MapCanvasUpdatedRecordsHub");
	};

	// #endregion

	LockData.prototype.deleteData = function(target, deleteIds, idField)
	{
		idField = idField || "Id";
		var deletes = [];
		target = target.filter(function(a)
		{
			if (Enumerable.From(deleteIds).Any(function(id) { return a.OBJECTID == id || a[idField] == id; }))
			{
				deletes.push(a);
				return false;
			}
			return true;
		});
		return {
			delete: deletes,
			remain: target
		};
	};

	LockData.prototype._mergeData = function(target, source, compare)
	{
		compare = compare || function(a, b) { return a.Id == b.Id; };
		target = target.filter(function(a)
		{
			return !Enumerable.From(source).Any(function(b) { return compare(a, b); });
		});
		target = target.concat(source.map(function(c)
		{
			return $.extend({}, c);
		}));
		return target;
	};

	LockData.prototype.dispose = function()
	{
		this.options.viewModel._viewModal.onUpdateRecordsEvent.unsubscribe(this.onUpdateRecords);
		this.options.viewModel._viewModal.onStopEditingEvent.unsubscribe(this.releaseUnEditLock);
		this.updatedRecords = {};
		this.selfLockIds = [];
		this.onLockedChangeEvent.unsubscribeAll();
	};

})();
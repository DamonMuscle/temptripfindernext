(function()
{
	createNamespace("TF").LockData = LockData;

	function LockData()
	{
		if (!tf.isViewfinder)
		{
			this.initChannel();
			// clear self lock data when load plus
			this.clearSelfLockDataByStorage();
			setInterval(() =>
			{
				this.clearSelfLockDataByStorage(["trip", "travelScenarioUseLock", "School", "student", "studentRequirement"]);
			}, 300000);
		}
	}

	LockData.prototype.setLock = function(options)
	{
		let defaults = {
			ids: [],
			extraInfo: "",
			type: "",
			isLock: true,
			databaseId: tf.datasourceManager.databaseId
		}, promiseRequest;
		options = $.extend({}, defaults, options);

		if (options.isLock)
		{
			promiseRequest = tf.promiseAjax.put(pathCombine(tf.api.apiPrefixWithoutDatabase(), "lockdatas"), {
				paramData: {
					dbid: options.databaseId
				},
				data: {
					ids: options.ids,
					ExtraInfo: options.extraInfo,
					type: options.type
				}
			}, { overlay: false });
		}
		else
		{
			const paramData = {};
			if (options.ids && options.ids.length > 0)
			{
				paramData.dbid = options.databaseId;
			}

			promiseRequest = tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "lockdatas"), {
				paramData: paramData,
				data: {
					ids: options.ids,
					ExtraInfo: options.extraInfo,
					type: options.type
				}
			}, { overlay: false });
		}

		return promiseRequest.then(function(response)
		{
			let lockedByOtherList = [],
				selfLockedList = [],
				lockInfoList = Enumerable.From(response.Items).Where(function(c) { return c.Type == options.type || !options.type; }).ToArray();

			lockInfoList.forEach(function(lockInfo)
			{
				lockInfo.id = lockInfo.Id;
				if (tf.authManager.authorizationInfo.authorizationTree.userId == lockInfo.UserId)
				{
					selfLockedList.push(lockInfo);
				}
				else
				{
					lockedByOtherList.push(lockInfo);
				}
			});
			return {
				lockedByOtherList: lockedByOtherList,
				selfLockedList: selfLockedList
			};
		});
	};

	LockData.prototype.unLockByExtraInfo = function(extraInfo, type)
	{
		const options = {
			ids: [],
			extraInfo: extraInfo,
			type: type,
			isLock: false,
			databaseId: tf.datasourceManager.databaseId
		};

		return tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "lockdatas"), {
			paramData: {
				dbid: options.databaseId
			},
			data: {
				ids: options.ids,
				ExtraInfo: options.extraInfo,
				type: options.type
			}
		}, { overlay: false });
	};

	LockData.prototype.isLocked = function(id, type, databaseId)
	{
		return this.setLock({
			ids: [],
			extraInfo: "",
			type: type,
			isLock: true,
			databaseId: databaseId
		}).then(function(lockInfo)
		{
			var selfLock = lockInfo.selfLockedList.filter(function(x) { return x.id == id; }).length > 0;
			var otherLock = lockInfo.lockedByOtherList.filter(function(x) { return x.id == id; }).length > 0;
			return selfLock || otherLock;
		});
	};

	LockData.prototype.getLockedInfo = async function(id, type, databaseId)
	{
		let lockInfo = await this.setLock({
			ids: [],
			extraInfo: "",
			type: type,
			isLock: true,
			databaseId: databaseId
		});

		var selfLock = lockInfo.selfLockedList.filter(function(x) { return x.id == id; });
		var otherLock = lockInfo.lockedByOtherList.filter(function(x) { return x.id == id; });
		return selfLock.length > 0 ? selfLock : (otherLock.length > 0 ? otherLock : null);
	};

	LockData.prototype._clearAllSelfLockData = function()
	{
		const self = this;
		self.setLock({
			ids: [],
			isLock: false,
			databaseId: 0
		}).then(function(lockInfo)
		{
			let typeExtraInfo = new Set();
			lockInfo.selfLockedList.forEach(function(lockData)
			{
				typeExtraInfo.add(lockData.ExtraInfo + ";" + lockData.Type);
			});
			typeExtraInfo.forEach(function(lockData)
			{
				lockData = lockData.split(";");
				lockData = { Type: lockData[1], ExtraInfo: lockData[0] };
				if (lockData.Type != "DataBase")
				{
					self.setLock({
						ids: [],
						extraInfo: lockData.ExtraInfo,
						type: lockData.Type,
						isLock: false,
						databaseId: 0
					});
				}
			});
		});
	};

	LockData.prototype.initChannel = function()
	{
		var self = this;
		if (window.BroadcastChannel)
		{
			var channel = new BroadcastChannel("selfLockRoutes");
			channel.onmessage = function(response)
			{
				if (response.data.type == "get")
				{
					channel.postMessage({ type: "alive", selfLocksRouteState: self._getSelfLockOnCurrentWindow() });
				} else if (response.data.type == "alive")
				{
					if (!self.aliveSelfLocks)
					{
						self.aliveSelfLocks = [];
					}
					self.aliveSelfLocks = self.aliveSelfLocks.concat(response.data.selfLocksRouteState);
				}
			};
			this.channel = channel;
		}
	};

	LockData.prototype._getSelfLockOnCurrentWindow = function()
	{
		if(!tf.documentManagerViewModel) return;

		return tf.documentManagerViewModel.allDocuments().map(function(document)
		{
			return document.routeState;
		});
	};

	LockData.prototype.clearSelfLockDataByStorage = function(types)
	{

		var self = this;
		self.aliveSelfLocks = [];
		self.channel && self.channel.postMessage({ type: "get" });
		setTimeout(function()
		{
			clearSelfLock();
		}, 10000);

		function clearSelfLock()
		{
			var selfLocks = tf.storageManager.get("selfLockRoutes", true),
				cleared = false;
			if (selfLocks)
			{
				selfLocks = JSON.parse(selfLocks);
				if (!types && (typeof (selfLocks) == "string" || $.isEmptyObject(selfLocks)))
				{
					self._clearAllSelfLockData();
					selfLocks = {};
					cleared = true;
				}
				else
				{
					var changed = false;
					self.aliveSelfLocks = self.aliveSelfLocks.concat(self._getSelfLockOnCurrentWindow());
					for (var key in selfLocks)
					{
						if (self.aliveSelfLocks.indexOf(key.split("-")[0]) < 0 && (!types || types.indexOf(selfLocks[key].type) >= 0))
						{
							self.setLock({
								ids: selfLocks[key].type == "travelScenarioUseLock" ? [] : selfLocks[key].ids,
								isLock: false,
								extraInfo: selfLocks[key].extraInfo,
								type: selfLocks[key].type,
								databaseId: selfLocks[key].dbid || selfLocks[key].databaseId
							}).then(function(lockInfo)
							{
								lockInfo.selfLockedList.forEach(function(lockData)
								{
									if (lockData.Type != "DataBase" && lockData.ExtraInfo.indexOf("-") > 0 && self.aliveSelfLocks.indexOf(lockData.ExtraInfo.split("-")[0]) < 0)
									{
										self.setLock({
											ids: [],
											extraInfo: lockData.ExtraInfo,
											type: lockData.Type,
											isLock: false,
											databaseId: 0
										});
									}
								});
							});
							changed = true;
							cleared = true;
							delete selfLocks[key];
						}
					}
					if (changed)
					{
						tf.storageManager.save("selfLockRoutes", JSON.stringify(selfLocks), true);
					}
				}
			}

			if (!cleared && !types)
			{
				self.setLock({ isLock: false });
			}
		}
	};
})();
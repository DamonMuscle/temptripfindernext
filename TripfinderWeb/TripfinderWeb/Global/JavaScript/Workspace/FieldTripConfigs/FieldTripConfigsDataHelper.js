(function()
{
	createNamespace("TF.Helper").FieldTripConfigsDataHelper = FieldTripConfigsDataHelper;

	var _FT_NONDBID_SETTING_NAMES = ["EnableNotifications", "NotificationFromEmail", "NotificationFromName", "NotifyAllOnDecline", "ScheduleDaysInAdvance", "StrictAcctCodes", "StrictDest", "URL", "RespectDepartments"];
	var _FT_DBID_SETTING_NAMES = ["NextTripID"];
	var _CACHED_HOLIDAY_MAP = null;
	var _CACHED_BLOCK_TIME = null;

	function FieldTripConfigsDataHelper()
	{
		var self = this;
		self.fieldTripConfigs = {};

		// Add an event for notify/subscribe FieldTrip NextTripID changed 
		self.nextTripIDChangedEvent = new TF.Events.Event();

		tf.datasourceManager.onDatabaseIdSet.subscribe(self.onDatabaseIdSet.bind(self));
	}

	// FieldTripConfigsDataHelper.prototype.init = function()
	// {
	// 	return this.CacheConfigs();
	// }

	FieldTripConfigsDataHelper.prototype.onDatabaseIdSet = function(event, databaseId)
	{
		if (databaseId)
		{
			this.CacheConfigs();
		}
	};

	FieldTripConfigsDataHelper.prototype.getHolidayMap = function()
	{
		var self = this;

		if (!_CACHED_HOLIDAY_MAP)
		{
			return self.getAllConfigRecordsByType("hol")
				.then(function(items)
				{
					var holidayMap = {};
					items.forEach(function(item)
					{
						var dateStr = moment(item.Holiday).format("YYYY-MM-DD");
						holidayMap[dateStr] = true;
					});

					_CACHED_HOLIDAY_MAP = holidayMap;
					return $.extend({}, holidayMap);
				});
		}
		else
		{
			return Promise.resolve($.extend({}, _CACHED_HOLIDAY_MAP));
		}
	};

	FieldTripConfigsDataHelper.prototype.getBlockTimes = function()
	{
		var self = this;

		if (!_CACHED_BLOCK_TIME)
		{
			return self.getAllConfigRecordsByType("blt")
				.then(function(items)
				{
					_CACHED_BLOCK_TIME = items;
					return $.extend([], items);
				});
		}
		else
		{
			return Promise.resolve($.extend([], _CACHED_BLOCK_TIME));
		}
	};

	FieldTripConfigsDataHelper.prototype.getAllConfigRecordsByType = function(key)
	{
		var self = this,
			configType = tf.FieldTripGridConfigs.getConfigMetadataBykey(key),
			apiEndpoint = configType.apiEndpoint,
			hasDBID = configType.hasDBID,
			relationshipStr = configType.relationshipStr,
			handleResponse = configType.handleResponse,
			options = relationshipStr ? {
				paramData: {
					'@relationships': relationshipStr
				}
			} : "",
			apiUrl = pathCombine(hasDBID ? tf.api.apiPrefix() : tf.api.apiPrefixWithoutDatabase(), apiEndpoint);

		return tf.promiseAjax.get(apiUrl, options).then(function(resp)
		{
			if (resp && resp.Items && resp.Items.length)
			{
				return handleResponse ? handleResponse(resp.Items) : resp.Items;
			}

			return [];
		});
	};

	FieldTripConfigsDataHelper.prototype.addNewConfigRecordByType = function(key, recordEntity)
	{
		var self = this,
			configType = tf.FieldTripGridConfigs.getConfigMetadataBykey(key),
			apiEndpoint = configType.apiEndpoint,
			hasDBID = configType.hasDBID,
			apiUrl = pathCombine(hasDBID ? tf.api.apiPrefix() : tf.api.apiPrefixWithoutDatabase(), apiEndpoint),
			paramData = configType.relationshipStr ? { "@relationships": configType.relationshipStr } : {};
		recordEntity.Id = 0;
		return tf.promiseAjax.post(apiUrl, { data: [recordEntity], paramData: paramData })
			.then(function(resp)
			{
				if (resp && resp.Items && resp.Items.length)
				{
					self._syncLocalCacheByType(key);
					return resp.Items[0];
				}

				return null;
			});
	};

	FieldTripConfigsDataHelper.prototype.updateConfigRecordByType = function(key, recordEntity)
	{
		var self = this,
			configType = tf.FieldTripGridConfigs.getConfigMetadataBykey(key),
			apiEndpoint = configType.apiEndpoint,
			hasDBID = configType.hasDBID,
			apiUrl = pathCombine(hasDBID ? tf.api.apiPrefix() : tf.api.apiPrefixWithoutDatabase(), apiEndpoint),
			paramData = configType.relationshipStr ? { "@relationships": configType.relationshipStr } : {};

		return tf.promiseAjax.put(apiUrl, { data: [recordEntity], paramData: paramData })
			.then(function(resp)
			{
				if (resp && resp.Items && resp.Items.length)
				{
					self._syncLocalCacheByType(key);
					return resp.Items[0];
				}

				return null;
			});
	};

	FieldTripConfigsDataHelper.prototype.removeConfigRecordByType = function(key, recordEntity)
	{
		var self = this,
			configType = tf.FieldTripGridConfigs.getConfigMetadataBykey(key),
			apiEndpoint = configType.apiEndpoint,
			hasDBID = configType.hasDBID,
			apiUrl = pathCombine(hasDBID ? tf.api.apiPrefix() : tf.api.apiPrefixWithoutDatabase(), apiEndpoint),
			filterData = { "@filter": String.format("in(id,{0})", recordEntity.ID || recordEntity.Id || recordEntity.id) };

		return tf.promiseAjax.delete(apiUrl, { paramData: filterData })
			.then(function(deletedCount)
			{
				self._syncLocalCacheByType(key);
				return deletedCount == 1;
			});
	};

	FieldTripConfigsDataHelper.prototype.isRecordExistingByType = function(key, recordEntity)
	{
		var self = this,
			configType = tf.FieldTripGridConfigs.getConfigMetadataBykey(key),
			apiEndpoint = configType.apiEndpoint,
			hasDBID = configType.hasDBID,
			apiUrl = pathCombine(hasDBID ? tf.api.apiPrefix() : tf.api.apiPrefixWithoutDatabase(), apiEndpoint),
			filterData = $.extend({ "@count": true }, recordEntity);

		return tf.promiseAjax.get(apiUrl, { paramData: filterData }, { overlay: false })
			.then(function(resp)
			{
				if (typeof (resp) === "number" && resp >= 1)
				{
					return true;
				}

				return false;
			});
	};

	/**
	 * function for retrieving DBID specific FieldTrip general settings
	 */
	function getFieldTripSettingRecord()
	{
		var dbId = tf.datasourceManager.databaseId,
			apiUrl = pathCombine(tf.api.apiPrefixWithoutDatabase(), "FieldTripSettings", dbId);

		return tf.promiseAjax.get(apiUrl)
			.then(function(resp)
			{
				if (resp && resp.Items && resp.Items.length)
				{
					return resp.Items[0];
				}

				return null;
			})
			.catch(function(err)
			{
				return null;
			});
	}

	/**
	 * function for retrieving non-DBID specific FieldTrip general settings
	 */
	function getFieldTripConfigRecord()
	{
		var apiUrl = pathCombine(tf.api.apiPrefixWithoutDatabase(), "FieldTripConfigs");

		return tf.promiseAjax.get(apiUrl, {})
			.then(function(resp)
			{
				if (resp && resp.Items && resp.Items.length)
				{
					return resp.Items[0];
				}

				return null;
			})
			.catch(function(err)
			{
				return null;
			});
	}

	FieldTripConfigsDataHelper.prototype.getGeneralSettings = function()
	{
		var p1 = getFieldTripSettingRecord(),
			p2 = getFieldTripConfigRecord();

		return Promise.all([p1, p2])
			.then(function(results)
			{
				if (!results)
				{
					return null;
				}

				var dbSettings = results[0],
					nonDbSettings = results[1],
					record = {};

				_FT_DBID_SETTING_NAMES.forEach(function(name)
				{
					if (name in dbSettings)
					{
						record[name] = dbSettings[name];
					}
				});

				_FT_NONDBID_SETTING_NAMES.forEach(function(name)
				{
					if (name in nonDbSettings)
					{
						record[name] = nonDbSettings[name];
					}
				});

				return record;
			})
			.catch(function(err)
			{
				return null;
			});
	};

	function generatePatchItem(name, value)
	{
		return { "op": "replace", "path": "/" + name, "value": value };
	}

	/**
	 * update DBID specific general settings
	 */
	function updateFieldTripSettingRecord(record)
	{
		var apiUrl = pathCombine(tf.api.apiPrefixWithoutDatabase(), "FieldTripSettings"),
			dbId = tf.datasourceManager.databaseId,
			patchList = [];

		_FT_DBID_SETTING_NAMES.forEach(function(name)
		{
			if (name in record)
			{
				patchList.push(generatePatchItem(name, record[name]));
			}
		});

		if (patchList.length === 0)
		{
			return Promise.resolve(true);
		}

		return tf.promiseAjax.patch(
			apiUrl, {
			paramData: { DBID: dbId },
			data: patchList
		})
			.then(function(resp)
			{
				if (resp && Array.isArray(resp.Items))
				{
					return resp.Items[0];
				}

				return null;
			})
			.catch(function(err)
			{
				return null;
			});
	}

	/**
	 * update non-DBID specific general settings
	 */
	function updateFieldTripConfigRecord(record)
	{
		var apiUrl = pathCombine(tf.api.apiPrefixWithoutDatabase(), "FieldTripConfigs"),
			patchList = [];

		_FT_NONDBID_SETTING_NAMES.forEach(function(name)
		{
			if (name in record)
			{
				patchList.push(generatePatchItem(name, record[name]));
			}
		});

		if (patchList.length === 0)
		{
			return Promise.resolve(true);
		}

		return tf.promiseAjax.patch(
			apiUrl, {
			data: patchList
		})
			.then(function(resp)
			{
				if (resp && Array.isArray(resp.Items))
				{
					return resp.Items[0];
				}

				return null;
			})
			.catch(function(err)
			{
				return null;
			});
	}

	FieldTripConfigsDataHelper.prototype.setGeneralSettings = function(record)
	{
		var self = this,
			p1 = updateFieldTripSettingRecord(record),
			p2 = updateFieldTripConfigRecord(record);

		return Promise.all([p1, p2])
			.then(function(results)
			{
				if (!results || !results[0] || !results[1]) return false;

				return true;
			})
			.then(function(res)
			{
				return self.CacheConfigs();
			})
			.catch(function(err)
			{
				return false;
			});
	};

	FieldTripConfigsDataHelper.prototype.CacheConfigs = function()
	{
		var self = this;
		return self.getGeneralSettings()
			.then(function(res)
			{
				self.fieldTripConfigs = res;

				return $.extend({}, self.fieldTripConfigs);
			}).catch(function()
			{

			});
	};

	FieldTripConfigsDataHelper.prototype.notifyChangesOnNextFieldTripID = function()
	{
		var self = this;

		self.CacheConfigs().then(function(latestSetting)
		{
			self.nextTripIDChangedEvent.notify(latestSetting.NextTripID);
		});
	};

	FieldTripConfigsDataHelper.prototype.subscribeNextTripIDChangedEvent = function(callbackHandler)
	{
		var self = this;

		if (!callbackHandler || typeof (callbackHandler) !== "function")
		{
			return;
		}

		self.nextTripIDChangedEvent.subscribe(callbackHandler);
	};

	FieldTripConfigsDataHelper.prototype.unSubscribeNextTripIDChangedEvent = function(callbackHandler)
	{
		var self = this;

		if (!callbackHandler || typeof (callbackHandler) !== "function")
		{
			return;
		}

		self.nextTripIDChangedEvent.unsubscribe(callbackHandler);
	};

	FieldTripConfigsDataHelper.prototype._syncLocalCacheByType = function(key)
	{
		switch (key)
		{
			case "hol":
				_CACHED_HOLIDAY_MAP = null;
				break;
			case "blt":
				_CACHED_BLOCK_TIME = null;
				break;
		}
	};
})();

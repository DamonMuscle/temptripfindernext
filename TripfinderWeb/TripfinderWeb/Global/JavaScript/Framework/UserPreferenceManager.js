﻿(function()
{
	createNamespace("TF").UserPreferenceManager = UserPreferenceManager;

	function UserPreferenceManager()
	{
		this.UserPreferenceDataList = [];
	}

	UserPreferenceManager.prototype.getAllKey = function()
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "userpreference"), { paramData: { prefix: tf.storageManager.prefix } })
			.then(function(apiResponse)
			{
				this.UserPreferenceDataList = apiResponse.Items;
			}.bind(this));
	};

	UserPreferenceManager.prototype.getUserPreferenceValue = function(key, defaultValue)
	{
		if (this.UserPreferenceDataList)
		{
			var theUserPreferenceItem = Enumerable.From(this.UserPreferenceDataList).Where(function(item)
			{
				return item.Key == key;
			}).ToArray();
			if (theUserPreferenceItem.length > 0)
			{
				if (theUserPreferenceItem[0].Value === "")
					return defaultValue;
				else
				{
					try
					{
						var data = JSON.parse(theUserPreferenceItem[0].Value);
						return data;
					}
					catch (e)
					{
						return theUserPreferenceItem[0].Value;
					}
				}
			}
		}
		return defaultValue;
	}
	UserPreferenceManager.prototype.setUserPreferenceValue = function(key, value)
	{
		if (!this.UserPreferenceDataList)
		{
			this.UserPreferenceDataList = [];
		}
		var theUserPreferenceList = Enumerable.From(this.UserPreferenceDataList).Where(function(item)
		{
			return item.Key == key;
		}).ToArray();
		var theUserPreferenceItem;
		if (theUserPreferenceList.length == 0)
		{
			theUserPreferenceItem = { "Key": key };
			this.UserPreferenceDataList.push(theUserPreferenceItem);
		} else
		{
			theUserPreferenceItem = theUserPreferenceList[0];
		}
		theUserPreferenceItem.Value = value;
	}

	UserPreferenceManager.prototype.removeUserPreferenceValue = function(key)
	{
		if (!this.UserPreferenceDataList)
		{
			this.UserPreferenceDataList = [];
		}
		var theUserPreferenceList = Enumerable.From(this.UserPreferenceDataList).Where(function(item)
		{
			return item.Key == key;
		}).ToArray();
		if (theUserPreferenceList.length > 0)
		{
			this.UserPreferenceDataList.splice(this.UserPreferenceDataList.indexOf(theUserPreferenceList[0]), 1);
		}
	}

	UserPreferenceManager.prototype.removeRelatedUserPreferenceValue = function(relatedKey)
	{
		if (!this.UserPreferenceDataList)
		{
			this.UserPreferenceDataList = [];
		}
		var theUserPreferenceList = Enumerable.From(this.UserPreferenceDataList).Where(function(item)
		{
			return item.Key.indexOf(relatedKey) == 0;
		}).ToArray();
		if (theUserPreferenceList.length > 0)
		{
			this.UserPreferenceDataList.splice(this.UserPreferenceDataList.indexOf(theUserPreferenceList[0]), 1);
		}
	}

	UserPreferenceManager.prototype.save = function(key, data, async)
	{
		if (async == null)
		{
			async = true;
		}

		var apiPrefix = tf.api.apiPrefixWithoutDatabase();
		if (typeof data == 'object' && data != null)
		{
			data = JSON.stringify(data);
		}
		this.setUserPreferenceValue(key, data);
		return tf.promiseAjax.post(pathCombine(apiPrefix, "userpreference"),
			{
				data: new TF.DataModel.UserPreferenceDataModel({ Key: key, Value: data }).toData(),
				async: async
			}, { overlay: false });
	};

	UserPreferenceManager.prototype.get = function(key, defaultValue)
	{
		return this.getUserPreferenceValue(key, defaultValue);
	};

	UserPreferenceManager.prototype.delete = function(key)
	{
		var apiPrefix = tf.api.apiPrefixWithoutDatabase();
		this.removeUserPreferenceValue(key);
		tf.promiseAjax.delete(pathCombine(apiPrefix, "userpreference", key), null, { overlay: false })
			.then(function(apiResponse)
			{
				// console.log(apiResponse.Items[0]);
			});
	};

	UserPreferenceManager.prototype.deleteAllRelated = function(relatedKey)
	{
		var apiPrefix = tf.api.apiPrefixWithoutDatabase();
		this.removeRelatedUserPreferenceValue(relatedKey);
		tf.promiseAjax.delete(pathCombine(apiPrefix, "userpreference/deleteRelated", relatedKey), null, { overlay: false })
			.then(function(apiResponse)
			{
				// console.log(apiResponse.Items[0]);
			});
	};

	createNamespace("tf").userPreferenceManager = new UserPreferenceManager();
})();

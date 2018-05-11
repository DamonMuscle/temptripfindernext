(function()
{
	createNamespace("TF").StorageManager = StorageManager;

	function StorageManager(prefix)
	{
		this.prefix = prefix + ".";
	}

	StorageManager.prototype.save = function(key, data, isLocal, isSession, async)
	{
		var oldKey = key;
		key = this.prefix + key;
		if (isSession)
		{
			return Promise.resolve(sessionStorage.setItem(key, data));
		}
		else if (isLocal)
		{
			return Promise.resolve(store.set(key, data));
		}
		else
		{
			if (equals(data, this.get(oldKey, isLocal, isSession)) && equals(this.get(oldKey, isLocal, isSession), data))
			{
				return Promise.resolve(true);
			}
			return tf.userPreferenceManager.save(key, data, async);
		}
	};

	StorageManager.prototype.saveOnCurrentDocument = function(key, data, isLocal, isSession, async)
	{
		var routeState = tf.documentManagerViewModel.obCurrentDocument().routeState;
		return this.save(key + "." + routeState, data, isLocal, isSession, async);
	};

	StorageManager.prototype.get = function(key, isLocal, isSession)
	{
		if (!key)
		{
			return null;
		}
		key = this.prefix + key;
		if (isSession)
		{
			return sessionStorage.getItem(key);
		}
		else if (isLocal)
		{
			return store.get(key);
		}
		else
		{
			return tf.userPreferenceManager.get(key);
		}
	};

	StorageManager.prototype.getOnCurrentDocument = function(key, data, isLocal, isSession, async)
	{
		var routeState = tf.documentManagerViewModel.obCurrentDocument().routeState;
		return this.get(key + "." + routeState, isLocal, isSession);
	};

	StorageManager.prototype.delete = function(key, isLocal, isSession)
	{
		key = this.prefix + key;
		if (isSession)
		{
			sessionStorage.removeItem(key);
		}
		else if (isLocal)
		{
			store.remove(key);
		}
		else
		{
			tf.userPreferenceManager.delete(key);
		}
	};

	StorageManager.prototype.deleteAllRelated = function(relatedKey, isLocal, isSession)
	{
		if (isSession)
		{
			sessionStorage.removeItem(relatedKey);
		}
		else if (isLocal)
		{
			store.remove(relatedKey);
		}
		else
		{
			tf.userPreferenceManager.deleteAllRelated(relatedKey);
		}
	};

	StorageManager.prototype.pop = function(key, isLocal, isSession)
	{
		var data = this.get(key, isLocal, isSession);
		this.delete(key, isLocal, isSession);
		return data;
	};

	StorageManager.prototype.newWindowDocumentData = function()
	{
		return this.prefix + "newwindowdocumentdata";
	};

	StorageManager.prototype.gridCurrentLayout = function(gridType)
	{
		return "grid.currentlayout." + gridType;
	};

	StorageManager.prototype.gridCurrentQuickFilter = function(gridType)
	{
		return "grid.currentquickfilter." + gridType;
	};

	StorageManager.prototype.gridInViewCurrentLayout = function(gridType)
	{
		return "grid.view.currentlayout." + gridType;
	};

	StorageManager.prototype.calendarInViewCurrentLayout = function(calendarType)
	{
		return "calendar.view.currentlayout." + calendarType;
	};

	StorageManager.prototype.listMoverCurrentSelectedColumns = function(gridType, userName)
	{
		return "listMover.currentselectedcolumns." + gridType + "." + userName;
	};

	StorageManager.prototype.DocumentAssociationLeftGridSelectedColumns = function(gridType, userName)
	{
		return "documentAssociation.currentselectedcolumns." + gridType + "." + userName;
	};

	/**
	 * Get the thematic id's sticky key by grid type.
	 * @param {string} gridType grid type.
	 * @return {string} sticky key.
	 */
	StorageManager.prototype.gridMapThematic = function(gridType)
	{
		return tf.datasourceManager.databaseId + ".grid." + gridType + ".map.thematic";
	};

	function equals(entity, backup)
	{
		if (entity === backup) return true;

		if (!(entity instanceof Object) || !(backup instanceof Object)) return false;

		// if (entity.constructor !== backup.constructor)
		// {
		// 	return false;
		// } 
		if ($.isArray(entity) && entity.length != backup.length)
		{
			return false;
		}
		for (var p in entity)
		{
			if (!entity.hasOwnProperty(p)) continue;

			if (!backup.hasOwnProperty(p) && entity[p] != null) 
			{
				return false;
			}

			if (entity[p] === backup[p])
			{
				continue;
			}

			if (typeof (entity[p]) !== "object")
			{
				if (String(entity[p]) === String(backup[p]))
				{
					continue;
				}
			}

			if (((entity[p] === null && backup[p] === "") || (entity[p] === "" && backup[p] === null)))
			{
				continue;
			}

			if (typeof (entity[p]) !== "object")
			{
				return false;
			}

			if (!equals(entity[p], backup[p]))
			{
				return false;
			}

		}

		return true;
	}

})();

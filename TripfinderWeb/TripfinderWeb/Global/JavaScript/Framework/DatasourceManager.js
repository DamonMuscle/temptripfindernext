(function()
{
	createNamespace("TF").DatasourceManager = DatasourceManager;

	function DatasourceManager()
	{
		this.databaseId = null;
		this.databaseName = "";
		this.databaseType = "";
		this.loginSource = null;
		//this.datasourceChanged = new TF.Events.Event();
		this.onDatabaseIdSet = new TF.Events.Event();
	}

	// Provide a dedicated method for retrieving all valid datasources (for current authInfo context)
	DatasourceManager.prototype.getAllValidDBs = function()
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "databases"))
			.then(function(response)
			{
				var dataSources = response && Array.isArray(response.Items) ? response.Items : [];
				return dataSources;
			});
	};

	DatasourceManager.prototype.validate = function()
	{
		var self = this;

		var databaseId = tf.storageManager.get("datasourceId");
		if (!databaseId)
		{
			self.navbarDisplay(false);
			return Promise.resolve(true);//no datasource, but still could login.
		}
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "DatabaseVerifications?dbid=" + databaseId))
			.then(function(result)
			{
				if (result && result.Items && result.Items[0] && result.Items[0].AnyDatabasePass)
				{
					return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "databases"))
						.then(function(apiResponse)
						{
							var datasources = apiResponse.Items;
							var datasource = Enumerable.From(datasources).Where(function(c) { return c.DBID == databaseId }).ToArray()[0];
							if (!datasource)
							{
								return false;
							}
							self.loginSource = datasource;
							self.databaseId = databaseId;
							self.databaseName = datasource.DatabaseName;
							self.databaseNameWithWrapper = "(" + datasource.DatabaseName + ")";
							self.databaseType = datasource.DBType;
							return true;
						});
				}

				return false;
			})
			.catch(function()
			{
				return false;
			})
	};

	DatasourceManager.prototype.validateAllDBs = function(auth)
	{
		var self = this,
			p;
		var databaseId = tf.storageManager.get("datasourceId");
		if (auth)
		{
			p = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "DatabaseVerifications?dbid=" + databaseId),
				{},
				auth);
		}
		else
		{
			p = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "DatabaseVerifications?dbid=" + databaseId), null, { overlay: false });
		}
		return p
			.then(function(result)
			{
				return result;
			})
			.catch(function()
			{
				return false;
			})
	};

	DatasourceManager.prototype.clearDBInfo = function()
	{
		tf.storageManager.delete("datasourceId");
		tf.storageManager.delete("databaseName");
		tf.storageManager.delete("databaseType");
		this.databaseId = null;
		this.databaseName = "";
		this.navbarDisplay(false);
	};

	DatasourceManager.prototype.setDataBaseId = function(databaseId)
	{
		if (Number.isNaN(databaseId))
		{
			databaseId = null;
		}

		var changed = this.databaseId != databaseId;
		this.databaseId = databaseId;

		if (changed)
		{
			TF.SessionItem.refresh();
		}

		this.onDatabaseIdSet.notify(databaseId);
	};

	DatasourceManager.prototype.navbarDisplay = function(state)
	{
		var items = $(".tf-navbar").find(".nav-item");
		for (var i = 0; i < items.length; i++)
		{
			var $item = $(items[i]);
			if ($item.text() == "FILE" || $item.hasClass("help") || $item.hasClass("user"))
			{
				continue;
			}
			$item.css("display", state ? "block" : "none");
		}
	}

	DatasourceManager.prototype.getDataSources = function()
	{
		var self = this;
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "databases"))
			.then(function(apiResponse)
			{
				self.datasources = apiResponse.Items;
			});
	};

	DatasourceManager.prototype.setDatabaseInfo = function()
	{
		var id = getQueryString("dbid");
		if (id)
		{
			tf.storageManager.save("datasourceId", id, true, true);
		}
		this.setDataBaseId(parseInt(tf.storageManager.get("datasourceId", true, true) || tf.storageManager.get("datasourceId")));
		this.databaseName = tf.storageManager.get("databaseName", true) || tf.storageManager.get("databaseName");
		this.databaseType = tf.storageManager.get("databaseType");
	};

})();

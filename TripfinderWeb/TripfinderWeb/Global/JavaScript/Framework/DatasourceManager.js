(function()
{
	createNamespace("TF").DatasourceManager = DatasourceManager;

	function DatasourceManager()
	{
		this.databaseId = null;
		this.databaseName = "";
		this.databaseType = "";
		this.loginSource = null;
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

		if (auth)
		{
			p = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "datasource", "test"),
				{},
				auth);
		}
		else
		{
			p = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "datasource", "test"), null, { overlay: false });
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
})();

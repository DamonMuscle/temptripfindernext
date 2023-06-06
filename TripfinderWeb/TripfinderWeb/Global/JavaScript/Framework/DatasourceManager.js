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
		this.beforeDatasourceChange = new TF.Events.PromiseEvent();
		this.updateSuccess = true;
		this.isChangingSource = false;
		this.datasources = [];
	}

	// Provide a dedicated method for retrieving all valid datasources (for current authInfo context)
	DatasourceManager.prototype.getAllDataSources = function()
	{
		var self = this;
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "databases"))
			.then(function(response)
			{
				self.datasources = response && Array.isArray(response.Items) ? response.Items : [];
				return self.datasources;
			});
	};

	DatasourceManager.prototype.getAllAuthedDataSources = function()
	{
		var self = this;
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "databases"),{
			paramData:{
				authedOnly:true
			}
		})
			.then(function(response)
			{
				self.datasources = response && Array.isArray(response.Items) ? response.Items : [];
				return self.datasources;
			});
	};

	DatasourceManager.prototype.validate = function()
	{
		var self = this;

		var databaseId = tf.storageManager.get("datasourceId");
		if (!databaseId)
		{
			self.navbarDisplay(false);
			return Promise.resolve(null);//no datasource, but still could login.
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

	DatasourceManager.prototype.verifyDatabase = function(databaseId)
	{
		return tf.promiseAjax.get(
			pathCombine(tf.api.apiPrefixWithoutDatabase(), "DatabaseVerifications"),
			{
				paramData: {
					dbid: databaseId
				}
			}).then(result => result && result.Items && result.Items[0] && result.Items[0].AnyDatabasePass);
	};

	DatasourceManager.prototype.validateAllDBs = function(auth)
	{
		var p;

		if (auth)
		{
			p = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "DatabaseVerifications"), {}, auth);
		}
		else
		{
			p = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "DatabaseVerifications"), null, { overlay: false });
		}
		return p
			.then(function(result)
			{
				return result;
			})
			.catch(function()
			{
				return false;
			});
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

	/**
	 * Find database by DBID.
	 *
	 * @param {number} databaseId
	 * @returns
	 */
	DatasourceManager.prototype.findDatabaseById = function(databaseId)
	{
		return tf.promiseAjax.get(
			pathCombine(tf.api.apiPrefixWithoutDatabase(), "databases"),
			{
				paramData: { "@filter": `eq(DBID,${databaseId})` }
			}
		).then(res => res && res.Items[0]);
	};

	DatasourceManager.prototype.choose = function(database, skipNotification)
	{
		var self = this;
		var databaseId = parseInt(database.DBID);
		var databaseName = database.Name;
		this.PromptMessage = "You have unsaved changes.&nbsp;&nbsp;Would you like to save your changes prior to closing this form?";
		this.isChangingSource = true;
		return this.beforeDatasourceChange.notify()
			.then(function()
			{
				self.isChangingSource = false;
				if (self.updateSuccess)
				{
					tf.loadingIndicator.setSubtitle('Loading ' + databaseName);
					tf.loadingIndicator.showImmediately();
					return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "DatabaseVerifications?dbid=" + databaseId))
						.then(function(result)
						{
							if (result && result.Items && result.Items[0] && result.Items[0].AnyDatabasePass)
							{
								tf.loadingIndicator.tryHide();
								return Promise.resolve(true);
							}
							else
							{
								Promise.reject();
							}
						})
						.catch(function()
						{
							tf.loadingIndicator.tryHide();
							self.clearDBInfo();
							return tf.promiseBootbox.dialog({
								message: databaseName + " could not load.&nbsp;&nbsp;Try again later or select another Data Source.&nbsp;&nbsp;If you continue to experience issues, please contact your Transfinder Project Manager or Support Representative (support@transfinder.com or 888-427-2403).",
								title: "Could Not Load",
								closeButton: true,
								buttons: {
									ok: {
										label: "OK",
										className: "tf-btn-black"
									}
								}
							})
								.then(function(result)
								{
									return Promise.resolve(false);
								});

						})
						.then(function(isPass)
						{
							if (isPass)
							{
								tf.storageManager.save("datasourceId", databaseId);
								tf.storageManager.save("datasourceId", databaseId, true, true);
								tf.storageManager.save("databaseName", databaseName);
								tf.storageManager.save("databaseName", databaseName, true);
								tf.storageManager.save("databaseType", database.DBType);

								self.setDatabaseInfo();
								self.databaseName = "(" + databaseName + ")";
								self.navbarDisplay(true);
								var promise = Promise.resolve();
								if (!skipNotification)
								{
									promise = tf.promiseBootbox.dialog({
										message: databaseName + " loaded successfully.",
										title: "Data Source Loaded",
										closeButton: true,
										buttons: {
											ok: {
												label: "OK",
												className: "tf-btn-black"
											}
										}
									});
								}
								return promise.then(function()
								{
									return Promise.resolve(true);
								});
							}
						});
				}
			}, function()
			{
				self.updateSuccess = true;
			});
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

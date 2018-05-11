(function()
{
	createNamespace("TF").DatasourceManager = DatasourceManager;

	function DatasourceManager()
	{
		this.databaseId = null;
		this.databaseName = "";
		this.databaseType = "";
		this.loginSource = null;
		this.beforeDatasourceClose = new TF.Events.PromiseEvent();
		this.beforeDatasourceChange = new TF.Events.PromiseEvent();
		this.open = this.open.bind(this);
		this.close = this.close.bind(this);
		this.PromptMessage = null;
		this.updateSuccess = true;
		this.isChangingSource = false;
	}

	DatasourceManager.prototype.validate = function()
	{
		var self = this;

		var databaseId = tf.storageManager.get("datasourceId");
		if (!databaseId)
		{
			self.navbarDisplay(false);
			return Promise.resolve(true);//no datasource, but still could login.
		}
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), databaseId, "datasource", "test"))
		.then(function(result)
		{
			if (result)
			{
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "datasource"))
				.then(function(apiResponse)
				{
					var datasources = apiResponse.Items;
					var datasource = Enumerable.From(datasources).Where(function(c) { return c.Id == databaseId }).ToArray()[0];
					if (!datasource || datasource.IsSQLServer == false /*|| datasource.DbfullVersion != 13000004*/)
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

	DatasourceManager.prototype.setDatabaseInfo = function()
	{
		this.databaseId = tf.storageManager.get("datasourceId");
		this.databaseName = tf.storageManager.get("databaseName");
		this.databaseType = tf.storageManager.get("databaseType");
	}

	DatasourceManager.prototype.open = function()
	{
		tf.modalManager.showModal(
			new TF.Modal.Navigation.OpenDataSourceModalViewModel
		).then(function(result)
		{
			if (!result)
			{
				return;
			}
			if (result.alreadyOpen)
			{
				return;
			}
			this.choose(result);
		}.bind(this));

	};

	DatasourceManager.prototype.new = function()
	{
		tf.modalManager.showModal(
			new TF.Modal.Navigation.NewDataSourceModalViewModel
		);
	}

	DatasourceManager.prototype.choose = function(database)
	{
		var self = this;
		var databaseId = parseInt(database.Id);
		var databaseName = database.DatabaseName;
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
					//$('#open-datasouce-loading').show();
					//$('#open-datasouce-loading').find('.loading-name')[0].innerText = ;
					tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), databaseId, "datasource", "test", database.DBType))
						.then(function()
						{
							return self.verifyDataBaseNeedToRebuild(databaseId, database.DBType)
								.then(function(isValidate)
								{
									tf.loadingIndicator.tryHide();
									if (!isValidate)
									{
										self.clearDBInfo();
										return tf.promiseBootbox.dialog({
											message: "This Data Source (" + databaseName + ") needs to be rebuilt before it can be opened in Routefinder Plus. To rebuild this Data Source, open it in Routefinder Pro.",
											title: "Alert",
											closeButton: true,
											buttons: {
												ok: {
													label: "OK",
													className: "tf-btn-black"
												}
											}
										}).then(function(result)
										{
											if (!!result)
											{
												self.open();
											}
											else
											{
												return Promise.resolve(false);
											}
										});
									}
									return Promise.resolve(true);
								});
						})
						.catch(function()
						{
							tf.loadingIndicator.tryHide();
							self.clearDBInfo();
							tf.navigationBarViewModel.loadReminderData();
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
								if (!!result)
								{
									self.open();
								}
								else
								{
									return Promise.resolve(false);
								}
							});

						})
						.then(function(isPass)
						{
							if (isPass)
							{
								//$('#open-datasouce-loading').hide();
								tf.promiseBootbox.dialog({
									message: databaseName + " loaded successfully.",
									title: "Data Source Loaded",
									closeButton: true,
									buttons: {
										ok: {
											label: "OK",
											className: "tf-btn-black"
										}
									}
								})
								.then(function()
								{

									tf.routeManager.loadSticky();
								});
								tf.storageManager.save("datasourceId", databaseId);
								tf.storageManager.save("databaseName", databaseName);
								tf.storageManager.save("databaseType", database.DBType);
								self.databaseId = databaseId;
								self.databaseName = "(" + databaseName + ")";
								self.navbarDisplay(true);
								tf.navigationBarViewModel.loadReminderData();
							}

						});
				}
				else
				{
				}
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

	DatasourceManager.prototype.close = function(noShow)
	{
		var self = this;
		this.beforeDatasourceClose.notify()
			.then(function()
			{
				if (self.updateSuccess)
				{
					if (!noShow)
						tf.promiseBootbox.dialog({
							message: self.databaseName + " closed successfully.",
							title: "Data Source Closed",
							closeButton: true,
							buttons: {
								ok: {
									label: "ok",
									className: "btn-primary"
								}
							}
						});

					tf.storageManager.delete("datasourceId");
					tf.storageManager.delete("databaseName");
					tf.storageManager.delete("databaseType");
					self.databaseId = null;
					self.databaseName = "";
					self.navbarDisplay(false);
					tf.navigationBarViewModel.loadReminderData();
				}
			});
	};

	DatasourceManager.prototype.about = function()
	{
		tf.modalManager.showModal(
			new TF.Modal.Navigation.AboutModalViewModel
		);
	};

	DatasourceManager.prototype.setProperties = function()
	{
		tf.modalManager.showModal(
			new TF.Modal.Navigation.PropertiesModalViewModel
		);
	};

	DatasourceManager.prototype.isCurSourceActive = function()
	{
		if (this.loginSource && this.loginSource.Status == "Inactive")
		{
			return tf.promiseBootbox.yesNo(this.loginSource.DatabaseName + " is not active (" + this.loginSource.ActivePeriod + ").  Are you sure you want to open this Data Source?", "Inactive Data Source")
				.then(function(result)
				{
					if (result)
					{
						return Promise.resolve(true);
					}
					else
					{
						return tf.modalManager.showModal(new TF.Modal.Navigation.OpenDataSourceModalViewModel)
							.then(function(result)
							{
								if (!result)
								{
									this.clearDBInfo();
									return false;
								}
								if (result.alreadyOpen)
								{
									return true;
								}
								this.choose(result);
								return result;
							}.bind(this));
					}
				}.bind(this));
		}
		return Promise.resolve(true);
	};

	DatasourceManager.prototype.verifyDataBaseNeedToRebuild = function(datasourceId, databaseType)
	{
		if (!datasourceId)
		{
			return Promise.resolve(true);
		}
		if (!databaseType)
			databaseType = "";
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), datasourceId, "tfsysinfo", "verifydbversion", databaseType, TF.productName))
			.then(function(apiResponse)
			{
				if (apiResponse.Items[0] !== false)
				{
					return Promise.resolve(true);
				}
				return Promise.resolve(false);
			});
	};

})();

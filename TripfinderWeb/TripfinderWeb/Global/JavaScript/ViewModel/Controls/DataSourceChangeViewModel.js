﻿(function()
{
	createNamespace("TF.Control").DataSourceChangeViewModel = DataSourceChangeViewModel;

	DataSourceChangeViewModel.prototype = Object.create(TF.Control.BaseControl.prototype);
	DataSourceChangeViewModel.prototype.constructor = DataSourceChangeViewModel;

	function DataSourceChangeViewModel()
	{
		this.databaseId = tf.storageManager.get("datasourceId");
		this.datasources = ko.observableArray([]);
		this.selectedDatabase = ko.observable();

		//drop down menu
		this.obSelectedDatabaseText = ko.observable();
	}

	DataSourceChangeViewModel.prototype.apply = function()
	{
		return this.changeDataSource();
	};

	DataSourceChangeViewModel.prototype.init = function(model, element)
	{
		tf.datasourceManager.getAllValidDBs()
			.then(function(datasources)
			{
				var datasource = Enumerable.From(datasources).Where(function(c)
				{
					return c.Id == this.databaseId;
				}.bind(this)).ToArray()[0];
				this.datasources(datasources);
				this.selectedDatabase(datasource);
				this.obSelectedDatabaseText(datasource ? datasource.DatabaseName : "");
				setTimeout(function()
				{
					$(element).find('select:eq(0)').focus();
				}, 100);
			}.bind(this));
	};

	DataSourceChangeViewModel.prototype.changeDataSource = function()
	{
		var ans;
		if (this.selectedDatabase() && (this.selectedDatabase().Id == this.databaseId))
		{
			ans = false;
		}
		else
		{
			ans = this.selectedDatabase();
			ga('send', 'event', 'Action', '	Data Source', ans.DatabaseName);
		}
		return Promise.resolve(ans);
	};

})();

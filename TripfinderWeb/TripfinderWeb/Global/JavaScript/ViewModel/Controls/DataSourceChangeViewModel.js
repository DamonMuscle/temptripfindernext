(function()
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
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "datasource"))
			.then(function(apiResponse)
			{
				var datasources = Enumerable.From(apiResponse.Items).Where(function(c)
				{
					return c.IsSQLServer == true && c.DbfullVersion >= 12000025;
				}.bind(this)).ToArray();
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
		}
		return Promise.resolve(ans);
	};

})();

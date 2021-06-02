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
		tf.datasourceManager.getAllDataSources()
			.then(function(datasources)
			{
				var datasource = Enumerable.From(datasources).Where(function(c)
				{
					return c.DBID == this.databaseId;
				}.bind(this)).ToArray()[0];
				datasources = datasources.sort((l, r) => { return l.Name.toLowerCase() < r.Name.toLowerCase() ? -1 : 1; });
				this.datasources(datasources);
				this.selectedDatabase(datasource);
				this.obSelectedDatabaseText(datasource ? datasource.Name : "");
				setTimeout(function()
				{
					$(element).find('select:eq(0)').focus();
				}, 100);
			}.bind(this));
	};

	DataSourceChangeViewModel.prototype.changeDataSource = function()
	{
		var ans;
		if (this.selectedDatabase() && (this.selectedDatabase().DBID == this.databaseId))
		{
			ans = false;
		}
		else
		{
			ans = this.selectedDatabase();
			ga('send', 'event', 'Action', '	Data Source', ans.Name);
		}
		return Promise.resolve(ans);
	};

})();

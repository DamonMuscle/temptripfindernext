(function()
{
	createNamespace("TF.Control").PasswordChangeViewModel = PasswordChangeViewModel;

	PasswordChangeViewModel.prototype = Object.create(TF.Control.BaseControl.prototype);
	PasswordChangeViewModel.prototype.constructor = PasswordChangeViewModel;

	function PasswordChangeViewModel()
	{
		var self = this;
		self.obCurrentPassword = ko.observable();
		self.obCurrentPasswordWarning = ko.observable();
		self.obNewPassword = ko.observable();
		self.obNewPasswordWarning = ko.observable();
		self.obConfirmNewPassword = ko.observable();
		self.obConfirmNewPasswordWarning = ko.observable();
		self.obChangePasswordErrorMessage = ko.observable();
	}

	PasswordChangeViewModel.prototype.apply = function()
	{
		return this.changeDataSource();
	};

	PasswordChangeViewModel.prototype.init = function(model, element)
	{
		// tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "datasource"))
		// 	.then(function(apiResponse)
		// 	{
		// 		var datasources = Enumerable.From(apiResponse.Items).Where(function(c)
		// 		{
		// 			return c.IsSQLServer == true && c.DbfullVersion >= 12000025;
		// 		}.bind(this)).ToArray();
		// 		var datasource = Enumerable.From(datasources).Where(function(c)
		// 		{
		// 			return c.Id == this.databaseId;
		// 		}.bind(this)).ToArray()[0];
		// 		this.datasources(datasources);
		// 		this.selectedDatabase(datasource);
		// 		this.obSelectedDatabaseText(datasource ? datasource.DatabaseName : "");
		// 		setTimeout(function()
		// 		{
		// 			$(element).find('select:eq(0)').focus();
		// 		}, 100);
		// 	}.bind(this));
	};

	PasswordChangeViewModel.prototype.changeDataSource = function()
	{
		// var ans;
		// if (this.selectedDatabase() && (this.selectedDatabase().Id == this.databaseId))
		// {
		// 	ans = false;
		// }
		// else
		// {
		// 	ans = this.selectedDatabase();
		// 	ga('send', 'event', 'Action', '	Data Source', ans.DatabaseName);
		// }
		// return Promise.resolve(ans);
	};

	PasswordChangeViewModel.prototype.cleanErrorMessage = function()
	{ }

})();

(function()
{
	createNamespace("TF.Scheduler").BaseSchedulerViewModel = BaseSchedulerViewModel;

	//TODO 
	function BaseSchedulerViewModel()
	{
		var self = this;
	};

	BaseSchedulerViewModel.prototype.init = function()
	{
		var self = this;
		self.initScheduler();
	};

	BaseSchedulerViewModel.prototype.initScheduler = function()
	{
		var self = this, $element = $(".kendoscheduler");

		$element.empty();

		self.getOriginalDataSource(self.type).then(function(data)
		{
			$element.kendoScheduler({

				date: new Date(),

				startTime: new Date(),

				height: 800,

				dataSource: self.getSchedulerDataSources(data),

				views: self.getSchedulertView(self.extendDays),

				editable: self.type === 'fieldtrip' ? false : true,

				resources: self.getSchedulerResources(data)
			});

			self.setFilterOpitons();

			self.eventBinding();
		});
	};

	BaseSchedulerViewModel.prototype.getOriginalDataSource = function(type)
	{
		var self = this, url, params;
		//TODO add SchedulerHelper to manage
		switch (type)
		{
			case "fieldtrip":
				url = pathCombine(tf.api.apiPrefix(), "search", "fieldtrip", "permission");
				params = {
					"sortItems": [{ "Name": "PublicId" }, { "Name": "Id", "isAscending": "asc" }],
					"idFilter": { "IncludeOnly": null, "ExcludeAny": [] },
					"filterSet": null,
					"filterClause": "",
					"isQuickSearch": false,
					"fields": ["PublicId", "FieldTripStageName", "Name", "ReturnDate", "DepartDate", "DepartTime", "ReturnTime", "Id", "FieldTripStageId", "DepartDateTime"]
				};
				break;
			default:
				break;
		}
		return tf.ajax.post(url, params);
	}

	BaseSchedulerViewModel.prototype.dispose = function()
	{
		//TODO 

	};
})();

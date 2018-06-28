(function()
{
	createNamespace("TF.Page").MySchedulerPage = MySchedulerPage;

	function MySchedulerPage()
	{
		var self = this;
		self.detailView = null;

		self.isDetailPanelShown = ko.observable(false);
	}

	MySchedulerPage.prototype.constructor = MySchedulerPage;

	MySchedulerPage.prototype.init = function()
	{
		var self = this;

		self.initScheduler();

		//fix kendoscheduler week view event not align properly
		$(".kendoscheduler").on("click", '.k-view-week', function()
		{
			$(".kendoscheduler").getKendoScheduler().refresh();
		});

		$(".kendoscheduler").on("dblclick", '.k-event', function(e)
		{
			var scheduler = $(".kendoscheduler").getKendoScheduler();
			var element = $(e.target).is(".k-event") ? $(e.target) : $(e.target).closest(".k-event");
			var event = scheduler.occurrenceByUid(element.data("kendoUid"));
			self.showDetailsClick(event.id);
			self.isDetailPanelShown(true);
			scheduler.refresh();
		});

		$(".kendoscheduler").on("click", '.k-event', function(e)
		{
			if (self.isDetailPanelShown())
			{
				var scheduler = $(".kendoscheduler").getKendoScheduler();
				var element = $(e.target).is(".k-event") ? $(e.target) : $(e.target).closest(".k-event");
				var event = scheduler.occurrenceByUid(element.data("kendoUid"));
				if (!self.detailView)
				{
					self.detailView = new TF.DetailView.DetailViewViewModel(event.id);
				}
				self.detailView.showDetailViewById(event.id);
				scheduler.refresh();
			}
		});

	};

	MySchedulerPage.prototype.initScheduler = function($element)
	{
		var self = this, $element = $(".kendoscheduler");
		// Hard coded Only for prototype
		tf.ajax.post(pathCombine(tf.api.apiPrefix(), "search", "fieldtrip", "permission"),
			{
				"sortItems": [{ "Name": "PublicId" }, { "Name": "Id", "isAscending": "asc" }],
				"idFilter": { "IncludeOnly": null, "ExcludeAny": [] },
				"filterSet": null,
				"filterClause": "",
				"isQuickSearch": false,
				"fields": ["PublicId", "FieldTripStageName", "Name", "ReturnDate", "DepartDate", "DepartTime", "ReturnTime", "Id", "FieldTripStageId", "DepartDateTime"]
			},
		).then(function(data)
		{
			var schedulerDatas = [];
			var schedulerResources = [];
			var schedulerOptions = [];
			data.Items.forEach(item =>
			{
				schedulerDatas.push({
					"Id": item['Id'],
					"StageId": item['FieldTripStageId'],
					"Title": item['Name'],
					"Start": item['DepartDateTime'],
					"End": item['EstimatedReturnDateTime']
				})
				schedulerResources.push({
					"text": item['FieldTripStageName'],
					"value": item['FieldTripStageId'],
					"color": tf.fieldTripGridDefinition.gridDefinition().stageFormatter(item['FieldTripStageId'])
				});
			});

			$(".stage-option").empty();
			$.each(schedulerResources, function(index, value)
			{
				if ($.inArray(value["value"], schedulerOptions) == -1)
				{
					schedulerOptions.push(value["value"]);
					$(".stage-option").append(
						'<div style="display: inline-block;"><div style="display: inline-block;height:15px; width:15px; margin-right:.2em; border:1px solid rgb(213, 213, 213); background-color:' + value["color"] + '"></div><span>' + value["text"] + ': </span>&nbsp;<input checked id="' + value["FieldTripStageName"] + '"type="checkbox" value="' + value["value"] + '">&nbsp;&nbsp;</div>'
					);
				}
			});

			$element.empty();

			$element.kendoScheduler({
				date: new Date("2015/9/9"),
				startTime: new Date("2015/9/9 07:00 AM"),
				height: 800,
				views: [
					"day",
					"week",
					{ type: "month", selected: true },
					"agenda"
				],
				dataSource: {
					batch: true,
					data: schedulerDatas,
					schema: {
						model: {
							id: "id",
							fields: {
								id: { from: "Id", type: "number" },
								title: { from: "Title", defaultValue: "No title", validation: { required: true } },
								start: { type: "date", from: "Start" },
								end: { type: "date", from: "End" },
								stageId: { from: "StageId", defaultValue: 1 }
							}
						}
					}
				},
				editable: false,
				resources: [
					{
						field: "stageId",
						title: "Trip Stage",
						dataSource: schedulerResources
					}
				]
			});
			$(".stage-option :checkbox").change(function(e)
			{
				var checked = $.map($(".stage-option :checked"), function(checkbox)
				{
					return parseInt($(checkbox).val());
				});

				var scheduler = $(".kendoscheduler").data("kendoScheduler");

				scheduler.dataSource.filter({
					operator: function(trip)
					{
						return $.inArray(trip.stageId, checked) >= 0;
					}
				});
			});
		})
	};
	MySchedulerPage.prototype.showDetailsClick = function(idFromScheduler)
	{
		var self = this;
		self.detailView = new TF.DetailView.DetailViewViewModel(idFromScheduler);
		if (TF.isPhoneDevice)
		{
			//TODO Mobile
			tf.pageManager.resizablePage.setLeftPage("workspace/detailview/detailview", self.detailView);
		}
		else
		{
			tf.pageManager.resizablePage.setRightPage("workspace/detailview/detailview", self.detailView);
		}

	};

	MySchedulerPage.prototype.schedulerViewClick = function(viewModel, e)
	{
		var self = this;
		self.isDetailPanelShown(true);
		tf.pageManager.openNewPage("scheduler");
	};

	MySchedulerPage.prototype.navToGridViewClick = function(model, element)
	{
		// self.obShowDetailPanel(false);
		// var self = this, page = new TF.Page.MySchedulerPage();
		// page.init(self, self.$element.find(".kendoscheduler"));
		tf.pageManager.openNewPage("fieldtrips");
	};


	MySchedulerPage.prototype.dispose = function()
	{

	};
})();

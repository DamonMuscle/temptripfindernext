(function()
{
	createNamespace("TF.Scheduler").FieldTripSchedulerViewModel = FieldTripSchedulerViewModel;

	function FieldTripSchedulerViewModel()
	{
		var self = this;
		self.height = 800;
		self.detailView = null;
		self.isDetailPanelShown = ko.observable(false);
		self.type = "fieldtrip";
		self.extendDays = 50;

		self.schedulerDataSources = [];
		self.schedulerResources = [];
		self.schedulerOptions = [];

	};

	FieldTripSchedulerViewModel.prototype.constructor = FieldTripSchedulerViewModel;

	FieldTripSchedulerViewModel.prototype = Object.create(TF.Scheduler.BaseSchedulerViewModel.prototype);

	FieldTripSchedulerViewModel.prototype.setFilterOpitons = function()
	{
		var self = this;
		$(".stage-option").empty();
		$.each(self.schedulerResources, function(index, value)
		{
			if ($.inArray(value["value"], self.schedulerOptions) == -1)
			{
				self.schedulerOptions.push(value["value"]);
				$(".stage-option").append(
					'<div style="display: inline-block;"><div style="display: inline-block;height:15px; width:15px; margin-right:.2em; border:1px solid rgb(213, 213, 213); background-color:' + value["color"] + '"></div><span>' + value["text"] + ': </span>&nbsp;<input checked id="' + value["FieldTripStageName"] + '"type="checkbox" value="' + value["value"] + '">&nbsp;&nbsp;</div>'
				);
			}
		});
	}


	FieldTripSchedulerViewModel.prototype.eventBinding = function()
	{
		var self = this;

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

		//fix kendoscheduler week view event not align properly
		$(".kendoscheduler").on("click", '.k-view-week', function()
		{
			$(".kendoscheduler").getKendoScheduler().refresh();
		});

		$(".kendoscheduler").on("dblclick", '.k-event', function(e)
		{
			var scheduler = $(".kendoscheduler").getKendoScheduler(),
				element = $(e.target).is(".k-event") ? $(e.target) : $(e.target).closest(".k-event"),
				event = scheduler.occurrenceByUid(element.data("kendoUid"));
			self.showDetailsClick(event.id);
			self.isDetailPanelShown(true);
			scheduler.refresh();
		});

		$(".kendoscheduler").on("click", '.k-event', function(e)
		{
			if (self.isDetailPanelShown())
			{
				var scheduler = $(".kendoscheduler").getKendoScheduler(),
					element = $(e.target).is(".k-event") ? $(e.target) : $(e.target).closest(".k-event"),
					event = scheduler.occurrenceByUid(element.data("kendoUid"));
				self.detailView.showDetailViewById(event.id);
				scheduler.refresh();
			}
		});
	};

	FieldTripSchedulerViewModel.prototype.getSchedulerDataSources = function(data)
	{
		var self = this;
		data.Items.forEach(item =>
		{
			self.schedulerDataSources.push({
				"Id": item['Id'],
				"StageId": item['FieldTripStageId'],
				"Title": item['Name'],
				"Start": item['DepartDateTime'],
				"End": item['EstimatedReturnDateTime'],
				"Descirption": "Test Desciption"
			});
		});
		return {
			batch: true,
			data: self.schedulerDataSources,
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
		}
	};

	FieldTripSchedulerViewModel.prototype.getSchedulerResources = function(data)
	{
		var self = this;
		data.Items.forEach(item =>
		{
			self.schedulerResources.push({
				"text": item['FieldTripStageName'],
				"value": item['FieldTripStageId'],
				"color": tf.fieldTripGridDefinition.gridDefinition().stageFormatter(item['FieldTripStageId'])
			});
		});
		return [
			{
				field: "stageId",
				title: "Trip Stage",
				dataSource: self.schedulerResources
			}
		]
	};


	FieldTripSchedulerViewModel.prototype.showDetailsClick = function(idFromScheduler)
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

	FieldTripSchedulerViewModel.prototype.getSchedulertView = function()
	{
		var CustomAgenda = kendo.ui.AgendaView.extend({
			endDate: function()
			{
				var date = kendo.ui.AgendaView.fn.endDate.call(this);
				return kendo.date.addDays(date, 2000);
			}
		});
		var schedulerView = [
			{ type: "day" },
			{ type: "week" },
			{ type: "month", selected: true },
			{ type: CustomAgenda, title: "ListView" }
		];
		return schedulerView;
	};

	FieldTripSchedulerViewModel.prototype.dispose = function()
	{
		//TODO
	};
})();

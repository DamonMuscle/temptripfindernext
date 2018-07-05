(function()
{
	createNamespace("TF.Page").SchedulerPage = SchedulerPage;

	function SchedulerPage(gridType)
	{
		var self = this;
		self.height = 800;
		self.detailView = null;
		self.isDetailPanelShown = ko.observable(false);
		self.gridType = gridType || "fieldtrips";
		self.pageType = "scheduler";
		self.extendDays = 50;

		TF.Page.BasePage.apply(self, arguments);

		self.schedulerDataSources = [];
		self.schedulerResources = [];
		self.schedulerOptions = [];

		self.isSchedulerPage = true;
		self.currentDetailId = -1;
	}

	SchedulerPage.prototype.constructor = SchedulerPage;

	SchedulerPage.prototype = Object.create(TF.Page.BasePage.prototype);

	SchedulerPage.prototype.init = function()
	{
		var self = this;

		self.initScheduler();
	};

	SchedulerPage.prototype.setFilterOpitons = function()
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
	};

	SchedulerPage.prototype.eventBinding = function()
	{
		var self = this, scheduler = $(".kendoscheduler").getKendoScheduler();

		$(".stage-option :checkbox").change(function(e)
		{
			var checked = $.map($(".stage-option :checked"), function(checkbox)
			{
				return parseInt($(checkbox).val());
			}),
				notContainCurrentDetailId = false,
				notCheckedIds = [];

			scheduler.dataSource.filter({
				operator: function(trip)
				{
					if ($.inArray(trip.stageId, checked) < 0)
					{
						notCheckedIds.push(trip.id);
					}
					return $.inArray(trip.stageId, checked) >= 0;
				}
			});

			notCheckedIds.forEach(function(id)
			{
				if (id === self.currentDetailId)
				{
					notContainCurrentDetailId = true;
				}
			});

			if (notContainCurrentDetailId)
			{
				self.closeDetailClick(true);
				$(".kendoscheduler").getKendoScheduler().refresh();
				self.currentDetailId = -1;
				self.isDetailPanelShown(false);
			}
		});
		$(document).on("mousedown.kendoscheduler", function(e)
		{
			0 === $(e.target).closest(".k-scheduler-views").length && $(".kendoscheduler").find(".k-state-expanded").removeClass("k-state-expanded"),
				$(document).off("click..kendoScheduler")
		});

		//fix kendoscheduler week view event not align properly
		$(".kendoscheduler").on("click", '.k-view-week', function()
		{
			$(".kendoscheduler").getKendoScheduler().refresh();
		});

		var doubleClickBind = function(e, selector)
		{
			var element = $(e.target).is(selector) ? $(e.target) : $(e.target).closest(selector),
				event = scheduler.occurrenceByUid(element.data("kendoUid"));
			self.currentDetailId = event.id;
			self.showDetailsClick(event.id);
			self.isDetailPanelShown(true);
			scheduler.refresh();
		},
			clickBind = function(e, selector)
			{
				if (self.isDetailPanelShown())
				{
					var element = $(e.target).is(selector) ? $(e.target) : $(e.target).closest(selector),
						event = scheduler.occurrenceByUid(element.data("kendoUid"));
					self.currentDetailId = event.id;
					self.detailView.showDetailViewById(event.id);
					scheduler.refresh();
				}
			};

		var eventselector = '.k-event';
		var taskselector = '.k-task';
		if (TF.isPhoneDevice)
		{
			$(".kendoscheduler").on("click", eventselector, function(e) 
			{
				doubleClickBind(e, eventselector);
			});

			$(".kendoscheduler").on("click", taskselector, function(e) 
			{
				doubleClickBind(e, taskselector);
			});
		}
		else
		{
			$(".kendoscheduler").on("dblclick", eventselector, function(e) 
			{
				doubleClickBind(e, eventselector);
			});

			$(".kendoscheduler").on("click", eventselector, function(e) 
			{
				clickBind(e, eventselector);
			});
			$(".kendoscheduler").on("dblclick", taskselector, function(e) 
			{
				doubleClickBind(e, taskselector);
			});

			$(".kendoscheduler").on("click", taskselector, function(e) 
			{
				clickBind(e, taskselector);
			});
		}
		$(document).on("click", function(e)
		{
			if ($(e.target).closest(".k-view-listview").length == 0 && $(".k-scheduler-agendaview.k-scheduler-agenda").length == 0)
			{
				$(".k-state-default.k-header.k-nav-prev").css("display", "inline-block");
				$(".k-state-default.k-header.k-nav-next").css("display", "inline-block");
			} else
			{
				$(".k-state-default.k-header.k-nav-prev").css("display", "none");
				$(".k-state-default.k-header.k-nav-next").css("display", "none");
			}
		});
	};

	SchedulerPage.prototype.initScheduler = function($element)
	{
		var self = this, $element = $(".kendoscheduler");


		$element.empty();

		self.getOriginalDataSource(self.gridType).then(function(data)
		{
			$element.kendoScheduler({

				date: new Date(),

				// startTime: new Date("2015/9/9 07:00 AM"),

				height: 800,

				dataSource: self.getSchedulerDataSources(data),

				views: self.getSchedulertView(self.extendDays),

				editable: self.gridType === 'fieldtrips' ? false : true,

				resources: self.getSchedulerResources(data)
			});

			$(".kendoscheduler").find(".k-scheduler-toolbar li.k-nav-current .k-sm-date-format").css("display", "none");
			$(".kendoscheduler").find(".k-scheduler-toolbar li.k-nav-current .k-lg-date-format").css("display", "none");
			self.setFilterOpitons();

			self.eventBinding();
		});
	};

	SchedulerPage.prototype.getOriginalDataSource = function(type)
	{
		var self = this, url, params;
		//TODO add SchedulerHelper to manage
		switch (type)
		{
			case "fieldtrips":
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

	SchedulerPage.prototype.getSchedulerDataSources = function(data)
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

	SchedulerPage.prototype.getSchedulerResources = function(data)
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

	SchedulerPage.prototype.getSchedulertView = function()
	{
		var CustomAgenda = kendo.ui.AgendaView.extend({
			startDate: function()
			{
				var date = new Date("1899/12/30");
				return kendo.date.addDays(date, 1);
			},
			endDate: function()
			{
				var date = kendo.ui.AgendaView.fn.endDate.call(this);
				return kendo.date.addDays(date, 20000);
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

	SchedulerPage.prototype.showDetailsClick = function(idFromScheduler)
	{
		var self = this;
		self.detailView = new TF.DetailView.DetailViewViewModel(idFromScheduler);
		self.detailView.onCloseDetailEvent.subscribe(
			self.closeDetailClick.bind(self)
		);
		if (TF.isPhoneDevice)
		{
			tf.pageManager.resizablePage.setLeftPage("workspace/detailview/detailview", self.detailView);
		}
		else
		{
			tf.pageManager.resizablePage.setRightPage("workspace/detailview/detailview", self.detailView);
		}

	};

	SchedulerPage.prototype.schedulerViewClick = function(viewModel, e)
	{
		var self = this;
		self.isDetailPanelShown(true);
		tf.pageManager.openNewPage(self.gridType + "Scheduler");
	};

	SchedulerPage.prototype.navToGridViewClick = function(model, element)
	{
		var self = this;
		tf.pageManager.openNewPage(self.gridType);
	};

	SchedulerPage.prototype.dispose = function()
	{
		//TODO
	};
})();

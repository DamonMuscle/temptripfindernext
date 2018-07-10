(function()
{
	createNamespace("TF.Page").SchedulerPage = SchedulerPage;

	function SchedulerPage(gridType)
	{
		var self = this;
		self.detailView = null;
		self.isDetailPanelShown = ko.observable(false);
		self.gridType = gridType || "fieldtrips";
		self.pageType = "scheduler";

		TF.Page.BasePage.apply(self, arguments);

		self.schedulerDataSources = [];
		self.schedulerResources = [];
		self.schedulerOptions = [];

		self.isSchedulerPage = true;
		self.kendoSchedule = null;
		self.currentDetailId = -1;
		self.$element = null;
		self.$kendoscheduler = null;
		self.$stageOption = null;
	}

	SchedulerPage.prototype.constructor = SchedulerPage;

	SchedulerPage.prototype = Object.create(TF.Page.BasePage.prototype);

	SchedulerPage.prototype.init = function(model, element)
	{
		var self = this;

		self.$element = $(element);
		self.$kendoscheduler = self.$element.find(".kendoscheduler");
		self.$stageOption = self.$element.find(".stage-option");
		self.initScheduler();
	};

	SchedulerPage.prototype.setFilterOpitons = function()
	{
		var self = this;
		self.$stageOption.empty();
		$.each(self.schedulerResources, function(index, value)
		{
			if ($.inArray(value["value"], self.schedulerOptions) === -1)
			{
				self.schedulerOptions.push(value["value"]);
				self.$stageOption.append(
					'<div class="content"><div class="stage-color" style="background-color:' + value["color"] + '"></div><span class="stage-name">' + value["text"] +
					': </span><input class="stage-check-box" checked id="' + value["text"] + '"type="checkbox" value="' + value["value"] + '"></div>'
				);
			}
		});
	};

	SchedulerPage.prototype.eventBinding = function()
	{
		var self = this, scheduler = self.$kendoscheduler.getKendoScheduler();

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
				self.$kendoscheduler.getKendoScheduler().refresh();
				self.currentDetailId = -1;
				self.isDetailPanelShown(false);
			}
		});
		$(document).on("mousedown.kendoscheduler", function(e)
		{
			0 === $(e.target).closest(".k-scheduler-views").length && self.$kendoscheduler.find(".k-state-expanded").removeClass("k-state-expanded"),
				$(document).off("click..kendoScheduler")
		});

		//fix kendoscheduler week view event not align properly
		self.$kendoscheduler.on("click.kendoscheduler", '.k-view-week', function()
		{
			self.$kendoscheduler.getKendoScheduler().refresh();
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
		var viewselector = '.k-view-listview';
		if (TF.isPhoneDevice)
		{
			self.$kendoscheduler.on("click.kendoscheduler", eventselector, function(e) 
			{
				doubleClickBind(e, eventselector);
			});

			self.$kendoscheduler.on("click.kendoscheduler", taskselector, function(e) 
			{
				doubleClickBind(e, taskselector);
			});
		}
		else
		{
			self.$kendoscheduler.on("dblclick.kendoscheduler", eventselector, function(e) 
			{
				doubleClickBind(e, eventselector);
			});

			self.$kendoscheduler.on("click.kendoscheduler", eventselector, function(e) 
			{
				clickBind(e, eventselector);
			});
			self.$kendoscheduler.on("dblclick.kendoscheduler", taskselector, function(e) 
			{
				doubleClickBind(e, taskselector);
			});

			self.$kendoscheduler.on("click.kendoscheduler", taskselector, function(e) 
			{
				clickBind(e, taskselector);
			});
		}
		$(document).on("click.kendoscheduler", function(e)
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

		self.$kendoscheduler.on("click.kendoscheduler", viewselector, function()
		{
			var calendarDate = $(".k-scheduler-calendar.k-widget.k-calendar .k-state-selected .k-link").data("kendoValue");
			if (!calendarDate)
			{
				var today = new Date(),
					todayDate = (today.getMonth() + 1) + "/" + today.getDate() + "/" + today.getFullYear();
				initScrollBar(todayDate);
			}
		});
	};

	function initScrollBar(date)
	{
		setTimeout(function()
		{
			var schedulerSource = $(".kendoscheduler").getKendoScheduler(),
				matchedDate,
				dateFormat = Date.parse(date),
				eventDateArray = [];

			schedulerSource.dataSource.options.data.filter(function(trip)
			{
				var startDate = trip.start.toLocaleString().split(",")[0],
					endDate = trip.end.toLocaleString().split(",")[0];
				Array.prototype.push.apply(eventDateArray, getAll(startDate, endDate));
			});
			eventDateArray.sort(function(a, b) { return a - b; });
			var beforeTodayDateArray = eventDateArray.filter(function(itemDate)
			{
				return itemDate <= dateFormat;
			});

			matchedDate = beforeTodayDateArray[beforeTodayDateArray.length - 1];
			var matchedDateFormat = new Date(matchedDate);
			matchedDate = matchedDateFormat.toLocaleString().split(",")[0];

			$(".kendoscheduler table tbody .k-scheduler-content .k-scheduler-table tbody tr td.k-scheduler-datecolumn").each(function(index, dom)
			{
				var $element = $(dom),
					dayString = $element.find(".k-scheduler-agendaday").text(),
					dateArray = $element.find(".k-scheduler-agendadate").text().split(","),
					dateMonth = dateArray[0],
					dateYear = dateArray[1].replace(/\s+/g, "");
				if (dayString.substr(0, 1) === "0")
				{
					dayString = dayString.slice(1);
				}
				switch (dateMonth)
				{
					case "January":
						dateMonth = "1";
						break;
					case "February":
						dateMonth = "2";
						break;
					case "March":
						dateMonth = "3";
						break;
					case "April":
						dateMonth = "4";
						break;
					case "May":
						dateMonth = "5";
						break;
					case "June":
						dateMonth = "6";
						break;
					case "July":
						dateMonth = "7";
						break;
					case "August":
						dateMonth = "8";
						break;
					case "September":
						dateMonth = "9";
						break;
					case "October":
						dateMonth = "10";
						break;
					case "November":
						dateMonth = "11";
						break;
					case "December":
						dateMonth = "12";
						break;
					default:
						break;
				}
				var domDateString = dateMonth + "/" + dayString + "/" + dateYear;

				if (domDateString === matchedDate)
				{
					var tableOffsetTop = $(".k-scheduler-table").offset().top;
					$(".k-scheduler-content").scrollTop($element.offset().top - (tableOffsetTop + 28));
					return false;
				}
			});
		}, 50);
	}

	function format(date)
	{
		var s = '';
		var mouth = date.getMonth() + 1;
		var day = date.getDate();
		s += mouth + "/"; // 获取月份。
		s += day + "/"; // 获取日。
		s += date.getFullYear(); // 获取年份。
		return (s); // 返回日期。
	}

	function getAll(begin, end)
	{
		var ab = begin.split("/");
		var ae = end.split("/");
		var db = new Date();
		db.setUTCFullYear(ab[2], ab[0] - 1, ab[1]);
		var de = new Date();
		de.setUTCFullYear(ae[2], ae[0] - 1, ae[1]);
		var unixDb = db.getTime();
		var unixDe = de.getTime();
		var dateArray = [];
		for (var k = unixDb; k <= unixDe;)
		{
			dateArray.push(Date.parse((format(new Date(parseInt(k))))));
			k = k + 24 * 60 * 60 * 1000;
		}
		return dateArray;
	}

	SchedulerPage.prototype.initScheduler = function($element)
	{
		var self = this;

		self.$kendoscheduler.empty();
		self.getOriginalDataSource(self.gridType).then(function(data)
		{
			self.kendoSchedule = self.$kendoscheduler.kendoScheduler({
				date: new Date(),
				dataSource: self.getSchedulerDataSources(data),
				views: self.getSchedulertView(self.extendDays),
				editable: false,
				resources: self.getSchedulerResources(data),
				navigate: function()
				{
					setTimeout(function()
					{
						if ($(".k-scheduler-layout.k-scheduler-agendaview").length > 0)
						{
							if ($(".k-state-default.k-header.k-nav-today.k-state-hover").length > 0)
							{
								var today = new Date(),
									todayDate = (today.getMonth() + 1) + "/" + today.getDate() + "/" + today.getFullYear();
								initScrollBar(todayDate);

							} else
							{
								var calendarDate = $(".k-scheduler-calendar.k-widget.k-calendar .k-state-selected .k-link").data("kendoValue");
								if (calendarDate)
								{
									var calendarDateArray = calendarDate.split("/"),
										selectCalendarDate = (parseInt(calendarDateArray[1]) + 1) + "/" + calendarDateArray[2] + "/" + calendarDateArray[0];
									initScrollBar(selectCalendarDate);
								}
							}
						}
					});
				}
			}).data("kendoScheduler");

			self.$kendoscheduler.find(".k-scheduler-toolbar li.k-nav-current .k-sm-date-format").css("display", "none");
			self.$kendoscheduler.find(".k-scheduler-toolbar li.k-nav-current .k-lg-date-format").css("display", "none");
			self.setFilterOpitons();

			self.eventBinding();
		});
	};

	SchedulerPage.prototype.getOriginalDataSource = function(type)
	{
		var self = this, url, params;

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
			case "myrequests":
				url = pathCombine(tf.api.apiPrefix(), "search", "fieldtrip", "submitted");
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
		data.Items.forEach(function(item)
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
		data.Items.forEach(function(item)
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
		var self = this;

		$(document).off(".kendoscheduler");
		if (self.$kendoscheduler)
		{
			self.$kendoscheduler.off(".kendoscheduler");
		}
		if (self.kendoSchedule)
		{
			self.kendoSchedule.destroy();
		}
	};
})();

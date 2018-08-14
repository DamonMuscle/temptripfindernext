(function()
{
	createNamespace("TF.Page").SchedulerPage = SchedulerPage;

	function SchedulerPage(gridType)
	{
		var self = this, isLevel1User, authInfo = tf.authManager.authorizationInfo;;
		self.detailView = null;
		self.options = {};
		self.isGridPage = false;
		self.searchGridInited = ko.observable(false);
		self.isDetailPanelShown = ko.observable(false);
		self.gridType = gridType || "fieldtrips";
		self.pageType = gridType;
		self.filterData = null;

		TF.Page.BasePage.apply(self, arguments);

		self.schedulerDataSources = [];
		self.schedulerResources = [];
		self.schedulerOptions = [];

		self.isSchedulerPage = true;
		self.kendoSchedule = null;
		self.currentDetailId = -1;
		self.fieldTripId = [];
		self.fieldTripRecord = [];
		self.$element = null;
		self.$kendoscheduler = null;
		self.$stageOption = null;
		self.filterClick = self.filterClick.bind(self);
		self.refreshClick = self.refreshClick.bind(self);

		isLevel1User = !self.isAdmin && !authInfo.isAuthorizedFor("level4Administrator", "edit") && !authInfo.isAuthorizedFor("level3Administrator", "edit")
			&& !authInfo.isAuthorizedFor("level2Administrator", "edit") && authInfo.isAuthorizedFor("level1Requestor", "edit");
		if (!isLevel1User)
		{
			self.approveButton = true;
			self.declineButton = true;
		}
	}

	SchedulerPage.prototype.constructor = SchedulerPage;

	SchedulerPage.prototype = Object.create(TF.Page.BaseGridPage.prototype);

	SchedulerPage.prototype.init = function(model, element)
	{
		var self = this;

		self.options.gridDefinition = {
			Columns: [{
				DBName: "FieldTripID",
				DisplayName: "FieldTripID",
				FieldName: "Id",
				Width: "150px"
			}]
		};
		self.options.gridType = "fieldtrip";
		self.options.url = self.getRequestUrl(self.gridType);
		self.options.isGridView = false;
		self.options.isCalendarView = true;
		self.options.storageKey = "grid.currentlayout." + self.pageType;
		self.options.summaryFilters = [{
			Id: -1,
			Name: "Today",
			IsValid: true
		},
		{
			Id: -2,
			Name: "Vehicle Scheduled",
			IsValid: true
		},
		{
			Id: -3,
			Name: "Pending Approval",
			IsValid: true,
			WhereClause: " FieldTripStageId = 1 or FieldTripStageId = 3 or FieldTripStageId = 5 or FieldTripStageId = 7",
			GridType: self.type
		},
		{
			Id: -4,
			Name: "Declined",
			IsValid: true,
			WhereClause: "FieldTripStageId = 2 or FieldTripStageId = 4 or FieldTripStageId = 6 or FieldTripStageId = 98",
			GridType: self.type
		},
		{
			Id: -5,
			Name: "Total",
			IsValid: true,
			WhereClause: "FieldTripStageId != 100",
			GridType: self.type
		},
		{
			Id: -6,
			Name: "Transportation Approved",
			IsValid: true,
			WhereClause: "FieldTripStageId = 99",
			GridType: self.type
		}
		];

		self.options.summaryFilterFunction = function(selectGridFilterEntityId)
		{
			if (selectGridFilterEntityId === -1 || selectGridFilterEntityId === -2)
			{
				return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "statistics", "fieldtripdepartingtrips")).then(function(response)
				{
					return response.Items[0];
				});
			}
			if (selectGridFilterEntityId === -3 || selectGridFilterEntityId === -4 ||
				selectGridFilterEntityId === -5 || selectGridFilterEntityId === -6)
			{
				return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "statistics", "fieldtrip")).then(function(response)
				{
					switch (selectGridFilterEntityId)
					{
						case -3:
							return response.AwaitingApprovalList;
						case -4:
							return response.RejectedList;
						case -5:
							return response.TotalList;
						case -6:
							return response.TransportationApprovedList;
						default:
							return null;
					}
				});
			}
			return Promise.resolve(null);
		};

		TF.Page.BaseGridPage.prototype.init.call(self, model, element);
		self.searchGrid.onFilterChanged.subscribe(self.filterChanged.bind(self));
		self.searchGrid.onFieldTripStageChanged.subscribe(self.fieldTripStageChanged.bind(self));
		self.searchGrid.onClearGridFilterClickEvent.subscribe(self.filterCleared.bind(self));
		self.$element = $(element);
		self.$kendoscheduler = self.$element.find(".kendoscheduler");
		self.$stageOption = self.$element.find(".stage-option");
		self.initScheduler();
	};

	SchedulerPage.prototype.filterChanged = function(e, options)
	{
		var self = this;
		self.filterData = options.data;
		self.setDataSource();
	};

	SchedulerPage.prototype.filterCleared = function(e)
	{
		var self = this;
		self.filterData = null;
		self.setDataSource();
	};

	SchedulerPage.prototype.fieldTripStageChanged = function(e)
	{
		var self = this, checked = self.getAvailableStageId(), scheduler = self.$kendoscheduler.getKendoScheduler(),
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

		self.resetScrollBar();
	};

	SchedulerPage.prototype.resetScrollBar = function(viewModel, e)
	{
		var self = this;
		if (self.kendoSchedule.view().name === "agenda")
		{
			$(".k-scheduler-content").scrollTop(0);
			self.getScrollBarPosition();
		}
	};

	SchedulerPage.prototype.filterClick = function(viewModel, e)
	{
		var self = this,
			cacheOperatorBeforeHiddenMenu = TF.menuHelper.needHiddenOpenedMenu(e),
			cacheOperatorBeforeOpenMenu = TF.menuHelper.needOpenCurrentMenu(e);

		if (cacheOperatorBeforeHiddenMenu)
			TF.menuHelper.hiddenMenu();

		if (cacheOperatorBeforeOpenMenu)
		{
			tf.pageManager.showContextMenu(e.currentTarge);
			self.searchGrid.filterMenuClick(e, function()
			{
				var iconWrap = $(e.target).closest(".grid-icons").find(".grid-staterow-wrap");
				if (iconWrap.length > 0)
				{
					iconWrap.css("display", "block");
				}
			});
		}
	};

	SchedulerPage.prototype.refreshClick = function()
	{
		this.initScheduler();
	};

	SchedulerPage.prototype.setDataSource = function()
	{
		var self = this;
		self.getOriginalDataSource(self.gridType).then(function(data)
		{
			data.Items.forEach(function(item)
			{
				if (!item.EstimatedReturnDateTime)
				{
					var date = new Date(item.DepartDateTime);
					date.setDate(date.getDate() + 1);
					var month = date.getMonth() + 1;
					item.EstimatedReturnDateTime = date.getFullYear() + '-' + month + '-' + date.getDate();
				}
			});

			var dataSource = new kendo.data.SchedulerDataSource(self.getSchedulerDataSources(data));
			self.kendoSchedule.setDataSource(dataSource);

			self.resetScrollBar();
		});
	};

	SchedulerPage.prototype.getAvailableStageId = function()
	{
		return this.searchGrid.selectedFieldTripStageFilters();
	};

	SchedulerPage.prototype.eventBinding = function()
	{
		var self = this, scheduler = self.$kendoscheduler.getKendoScheduler(), eventselector = '.k-event',
			taskselector = ".k-task", tdselector = '.k-scheduler-agendaview .k-scheduler-content tr td:last-child';

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
			var element = $(e.target).is(selector) ? $(e.target) : ($(e.target).find(selector).length > 0 ? $(e.target).find(selector) : $(e.target).closest(selector)),
				event = self.kendoSchedule.occurrenceByUid(element.data("kendoUid"));
			self.currentDetailId = event.id;
			self.showDetailsClick(event.id);
			self.isDetailPanelShown(true);
			scheduler.refresh();
		},
			clickBind = function(e, selector)
			{
				if (self.isDetailPanelShown())
				{
					var element = $(e.target).is(selector) ? $(e.target) : ($(e.target).find(selector).length > 0 ? $(e.target).find(selector) : $(e.target).closest(selector)),
						event = scheduler.occurrenceByUid(element.data("kendoUid"));
					self.currentDetailId = event.id;
					self.detailView.showDetailViewById(event.id);
					scheduler.refresh();
				}
			};

		if (TF.isPhoneDevice)
		{
			self.$kendoscheduler.on("click.kendoscheduler", eventselector, function(e) 
			{
				doubleClickBind(e, eventselector);
			});

			self.$kendoscheduler.on("click.kendoscheduler", tdselector, function(e) 
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

			self.$kendoscheduler.on("dblclick.kendoscheduler", tdselector, function(e) 
			{
				doubleClickBind(e, taskselector);
			});

			self.$kendoscheduler.on("click.kendoscheduler", tdselector, function(e) 
			{
				clickBind(e, taskselector);
			});
		}
		$(document).on("click.kendoscheduler", function(e)
		{
			if ($(e.target).closest(".k-view-listview").length == 0 && $(".k-scheduler-agendaview.k-scheduler-agenda").length == 0)
			{
				self.$kendoscheduler.find(".k-state-default.k-header.k-nav-prev").css("display", "inline-block");
				self.$kendoscheduler.find(".k-state-default.k-header.k-nav-next").css("display", "inline-block");
				if (!TF.isMobileDevice)
				{
					self.$kendoscheduler.find(".k-scheduler-toolbar li.k-nav-current .k-lg-date-format").css("display", "inline");
				}
			} else
			{
				self.$kendoscheduler.find(".k-state-default.k-header.k-nav-prev").css("display", "none");
				self.$kendoscheduler.find(".k-state-default.k-header.k-nav-next").css("display", "none");
				self.$kendoscheduler.find(".k-scheduler-toolbar li.k-nav-current .k-lg-date-format").css("display", "none");
			}
		});
	};
	SchedulerPage.prototype._openBulkMenu = function()
	{
		var self = this;
		self.$kendoscheduler = self.$element.find(".kendoscheduler");
		self.$kendoscheduler.delegate(".k-event", "mousedown", function(e, parentE)
		{
			var element = e;
			var $element = $(e.target).is(".k-event") ? $(e.target) : ($(e.target).find(".k-event").length > 0 ? $(e.target).find(".k-event") : $(e.target).closest(".k-event")),
				event = self.kendoSchedule.occurrenceByUid($element.data("kendoUid"));
			self.fieldTripId = [];
			self.fieldTripRecord = [];
			self.fieldTripId.push(event.id);
			event.Id = event.id;
			self.fieldTripRecord.push(event);
			if (parentE)
			{
				element = parentE;
			}
			if (element.button === 2)
			{
				var $virsualTarget = $("<div></div>").css(
					{
						position: "absolute",
						left: element.clientX,
						top: element.clientY
					});
				$("body").append($virsualTarget);
				self.bulkMenu = new TF.ContextMenu.BulkContextMenu(pathCombine("Workspace/Page/grid/scheduler/bulkmenu"), new TF.Grid.GridMenuViewModel(self, self.searchGrid));
				tf.contextMenuManager.showMenu($virsualTarget, self.bulkMenu);
				return false;
			}
			return true;
		});

		self.$kendoscheduler.delegate(".k-scheduler-agendaview .k-scheduler-content tr td:last-child", "mousedown", function(e, parentE)
		{
			var element = e;
			var $element = $(e.target).is(".k-task") ? $(e.target) : ($(e.target).find(".k-task").length > 0 ? $(e.target).find(".k-task") : $(e.target).closest(".k-task")),
				event = self.kendoSchedule.occurrenceByUid($element.data("kendoUid"));
			self.fieldTripId = [];
			self.fieldTripRecord = [];
			self.fieldTripId.push(event.id);
			event.Id = event.id;
			self.fieldTripRecord.push(event);
			if (parentE)
			{
				element = parentE;
			}
			if (element.button === 2)
			{
				var $virsualTarget = $("<div></div>").css(
					{
						position: "absolute",
						left: element.clientX,
						top: element.clientY
					});
				$("body").append($virsualTarget);
				self.bulkMenu = new TF.ContextMenu.BulkContextMenu(pathCombine("Workspace/Page/grid/scheduler/bulkmenu"), new TF.Grid.GridMenuViewModel(self, self.searchGrid));
				tf.contextMenuManager.showMenu($virsualTarget, self.bulkMenu);
				return false;
			}
			return true;
		});
	};
	SchedulerPage.prototype.initScrollBar = function(date)
	{
		var self = this;
		setTimeout(function()
		{
			var schedulerSource = $(".kendoscheduler").getKendoScheduler(),
				eventDateArray = [], matchedDate;

			schedulerSource.dataSource.options.data.filter(function(trip)
			{
				var checked = self.getAvailableStageId();
				if ($.inArray(trip.stageId, checked) < 0)
				{
					return true;
				};

				var startDate = new Date(trip.start),
					endDate = new Date(trip.end);
				while (startDate <= endDate)
				{
					eventDateArray.push(new Date(startDate.getTime()));
					startDate.setDate(startDate.getDate() + 1);
				}
			});
			eventDateArray.sort(function(a, b)
			{
				if (a < b) { return -1; }
				if (a > b) { return 1; }
				return 0;
			});
			var beforeTodayDateArray = eventDateArray.filter(function(itemDate)
			{
				itemDate.setHours(0, 0, 0, 0);
				return itemDate <= date;
			});

			matchedDate = beforeTodayDateArray[beforeTodayDateArray.length - 1];
			matchedDate = moment(matchedDate).format("M/D/YYYY");

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
	};

	SchedulerPage.prototype.initScheduler = function()
	{
		var self = this;

		self.searchGrid.initFieldTripStageFilters();
		if (self.kendoSchedule)
		{
			$(document).off(".kendoscheduler");
			self.$kendoscheduler.off(".kendoscheduler");
			self.kendoSchedule.destroy();
			self.$kendoscheduler.empty();
		}

		self.getOriginalDataSource(self.gridType).then(function(data)
		{
			data.Items.forEach(function(item)
			{
				if (!item.EstimatedReturnDateTime)
				{
					var date = new Date(item.DepartDateTime);
					date.setDate(date.getDate() + 1);
					var month = date.getMonth() + 1;
					item.EstimatedReturnDateTime = date.getFullYear() + '-' + month + '-' + date.getDate();
				}
			});

			self.kendoSchedule = self.$kendoscheduler.kendoScheduler({
				date: new Date(),
				dataSource: self.getSchedulerDataSources(data),
				views: self.getSchedulertView(self.extendDays),
				editable: false,
				resources: self.getSchedulerResources(data),
				navigate: function()
				{
					self.getScrollBarPosition();
				},
				footer: false
			}).data("kendoScheduler");

			self.eventBinding();
		});
	};

	SchedulerPage.prototype.getScrollBarPosition = function()
	{
		var self = this;
		setTimeout(function()
		{
			if ($(".k-scheduler-layout.k-scheduler-agendaview").length > 0)
			{
				if ($(".k-state-default.k-header.k-nav-today.k-state-hover").length > 0)
				{
					var today = new Date();
					self.initScrollBar(today);

				} else
				{
					var calendarDate = $(".k-scheduler-calendar.k-widget.k-calendar .k-state-selected .k-link").data("kendoValue");
					if (calendarDate)
					{
						var calendarDateArray = calendarDate.split("/");
						selectCalendarDate = (parseInt(calendarDateArray[1]) + 1) + "/" + calendarDateArray[2] + "/" + calendarDateArray[0];
						selectCalendarDate = new Date(selectCalendarDate);
						self.initScrollBar(selectCalendarDate);
					} else
					{
						var today = new Date();
						self.initScrollBar(today);
					}
				}
			}
		});
	};

	SchedulerPage.prototype.getRequestUrl = function(type)
	{
		var url = null;
		switch (type)
		{
			case "fieldtrips":
				url = pathCombine(tf.api.apiPrefix(), "search", "fieldtrip", "permission");
				break;
			case "myrequests":
				url = pathCombine(tf.api.apiPrefix(), "search", "fieldtrip", "submitted");
				break;
			default:
				break;
		}
		return url;
	}

	SchedulerPage.prototype.getOriginalDataSource = function(type, filters)
	{
		var self = this, url, params = {
			"sortItems": [{ "Name": "PublicId" }, { "Name": "Id", "isAscending": "asc" }],
			"idFilter": { "IncludeOnly": null, "ExcludeAny": [] },
			"filterSet": null,
			"filterClause": "",
			"isQuickSearch": false,
			"fields": ["PublicId", "FieldTripStageName", "Name", "ReturnDate", "DepartDate", "DepartTime", "ReturnTime", "Id", "FieldTripStageId", "DepartDateTime"]
		};

		if (self.filterData)
		{
			params.idFilter = self.filterData.idFilter;
			params.filterSet = self.filterData.filterSet;
			params.filterClause = self.filterData.filterClause;
		}

		url = self.getRequestUrl(type);
		return tf.ajax.post(url, { data: params });
	}

	SchedulerPage.prototype.getSchedulerDataSources = function(data)
	{
		var self = this;
		self.schedulerDataSources.length = 0;
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
			{ type: CustomAgenda, title: "List" }
		];
		return schedulerView;
	};

	SchedulerPage.prototype.showDetailsClick = function(idFromScheduler)
	{
		var self = this;
		ga('send', 'event', 'Area', 'Details');
		if (self.fieldTripId.length > 0)
		{
			self.isDetailPanelShown(true);
			idFromScheduler = self.fieldTripId;
		}
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
		if (self.searchGrid)
		{
			self.searchGrid.dispose();
			self.searchGrid = null;
		}
	};
})();

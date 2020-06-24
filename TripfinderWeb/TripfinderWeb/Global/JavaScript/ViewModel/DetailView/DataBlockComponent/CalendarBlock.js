(function()
{
	createNamespace("TF.DetailView.DataBlockComponent").CalendarBlock = CalendarBlock;

	var maxCalendarRole = 1;
	var allCalendars = {};

	function CalendarBlock(options, detailView, $wrapper)// isReadMode, gridType, calendarEvents, $wrapper)
	{
		var self = this,
			columnClass = "four-columns";

		TF.DetailView.DataBlockComponent.BaseDataBlock.call(self, detailView);

		self.gridType = detailView.gridType;
		self.calendarEvents = detailView.calendarEvents;

		var editModeClass = self.isReadMode() ? "" : "temp-edit",
			role = options.role ? parseInt(options.role) : maxCalendarRole ? maxCalendarRole + 1 : 1,
			fillClass = options.w === 1 ? "fill-one" : options.w === 2 ? "fill-two" : options.w === 3 ? "fill-three" : "fill-four",
			isReadMode = self.isReadMode(),
			detailViewHelper = tf.helpers.detailViewHelper;

		self.uniqueClassName = options.uniqueClassName || detailViewHelper.generateUniqueClassName();
		self.$el = $(String.format("\
				<div>\
					<div class='grid-stack-item-content'>\
						<div class= 'calendar-item {0} {1} {2}'></div>\
					</div>\
				</div>", columnClass, fillClass, editModeClass)).addClass(self.uniqueClassName);

		self.options = options;

		var $calendarBlock = self.$el.find(".grid-stack-item-content .calendar-item"),
			$calendar = $wrapper.closest(".right-container.grid-stack-container").siblings(".preload").find(".calendar[role=" + role + "]");

		if ($calendar.length <= 0)
		{
			$calendar = $(String.format("<div class='calendar' role='{0}'></div>", role));
			$calendarBlock.append($calendar);
			self.initCalendar($calendar, role);
			if (!isReadMode)
			{
				self.addCalendarEvents($calendarBlock, $calendar.find("table td a"));
			}
		}
		else
		{
			$calendarBlock.append($calendar);
			self.addCalendarEvents($calendarBlock, $calendar.find("table td a"));
		}
	}

	CalendarBlock.prototype = Object.create(TF.DetailView.DataBlockComponent.BaseDataBlock.prototype);

	function getShortClassName($calendarBlock)
	{
		return ($calendarBlock.hasClass("fill-four") ||
			$calendarBlock.hasClass("fill-three") ||
			($calendarBlock.hasClass("fill-two") && $calendarBlock.hasClass("two-columns")) ||
			($calendarBlock.hasClass("fill-one") && $calendarBlock.hasClass("one-column"))) ?
			"" : "short";
	}

	/**
	 * Calendar initialize.
	 */
	CalendarBlock.prototype.initCalendar = function($calendar, role)
	{
		var self = this,
			calendarTypes = ["district", "school", "trip"],
			changeCalendarWidthTimeout = null;
		if (calendarTypes.indexOf(self.gridType) <= -1)
		{
			return;
		}
		$calendar.kendoCalendar({
			month: {
				content: '<div class="date-text">#= data.value #</div><div class="events-group"><div class="events-point"></div></div>'
			},
			width: "100%",
			height: "100%",
			value: new Date(),
			navigate: function()
			{
				var calendar = this;
				if (changeCalendarWidthTimeout)
				{
					clearTimeout(changeCalendarWidthTimeout);
					changeCalendarWidthTimeout = null;
				}
				if (self.calendarEvents)
				{
					calendar.element.next(".schedule").remove();
					self.addCalendarEvents(calendar.element.parent(), calendar._table.find("td a"));
				}
				changeCalendarWidthTimeout = setTimeout(function()
				{
					calendar._table.width("100%");
				}, 1000);
			}
		});
		allCalendars[role] = $calendar;
		maxCalendarRole = Math.max(maxCalendarRole || 0, role);
	};

	/**
	 * Add calendar events blocks by data.
	 * @param {JQuery} $calendarBlock
	 * @param {JQuery} $tdItems
	 * @return {void}
	 */
	CalendarBlock.prototype.addCalendarEvents = function($calendarBlock, $tdItems)
	{
		var self = this,
			$item,
			startDate = moment($($tdItems[0]).attr("title")).format("M/D/YYYY"),
			endDate = moment($($tdItems[$tdItems.length - 1]).attr("title")).format("M/D/YYYY"),
			$scheduleDom = $("<div class='schedule'></div>"),
			scheduleItemDom = "",
			eventsDom = "",
			allEvents = [];


		if (!self.isReadMode())
		{
			var shortClass = getShortClassName($calendarBlock);

			$tdItems.each(function(index, item)
			{
				$item = $(item);
				$item.find(".events-group").removeClass("show");
				if (moment($item.attr("title")).format("M/D/YYYY") === moment().format("M/D/YYYY"))
				{
					$item.find(".events-group").addClass("show");
				}
			});
			eventsDom = String.format("\
					<div class='event'>\
						<div class='left {0}'>In the Haunted House</div>\
						<div class='right'>{1}</div>\
					</div>", shortClass, (shortClass ? "12:00PM" : "12:00PM - 6:00PM"));
			scheduleItemDom = String.format("\
					<div class='group'>\
						<div class='date today'>TODAY, {0}</div>\
						<div class='events'>{1}</div>\
					</div>", moment().format("ddd M/D/YY"), eventsDom);
			$scheduleDom.append($(scheduleItemDom));
			$calendarBlock.append($scheduleDom);
			return;
		}

		if (self.calendarEvents)
		{
			for (var i in self.calendarEvents)
			{
				if (moment(i) >= moment(startDate) && moment(i) <= moment(endDate))
				{
					if (self.calendarEvents[i].isToday)
					{
						allEvents.unshift(self.calendarEvents[i]);
					}
					else
					{
						allEvents.push(self.calendarEvents[i]);
					}
				}
			}
		}

		if (allEvents.length > 0)
		{
			$tdItems.each(function(_, item)
			{
				$item = $(item);
				$item.find(".events-group").removeClass("show");
				if (self.calendarEvents[moment($item.attr("title")).format("M/D/YYYY")])
				{
					$item.find(".events-group").addClass("show");
				}
			});

			var shortClass = getShortClassName($calendarBlock);

			allEvents.forEach(function(item)
			{
				eventsDom = "";
				item.events.forEach(function(event)
				{
					eventsDom += String.format("\
							<div class='event'>\
								<div class='left {0} {1}'>{2}</div>\
								<div class='right'>{3}</div>\
							</div>", shortClass, (event.isAllDay ? "full" : ""), event.name, (event.isAllDay ? "" : shortClass ? event.startTime : event.startTime + " - " + event.endTime));
				});

				scheduleItemDom = String.format("\
						<div class='group'>\
							<div class='date {0}'>{1} {2}</div>\
							<div class='events'>{3}</div>\
						</div>", (item.isToday ? "today" : ""), (item.isToday ? "TODAY, " : ""), item.date, eventsDom);
				$scheduleDom.append($(scheduleItemDom));
			});
		}
		else
		{
			$tdItems.each(function(_, item)
			{
				$item = $(item);
				$item.find(".events-group").removeClass("show");
			});
			$scheduleDom = $("<div class='schedule display-table'></div>");
			$scheduleDom.append($("<div class='empty'>No Events</div>"));
		}

		$calendarBlock.append($scheduleDom);
	};

	/**
	 * If the calendar reset the width, sticky the calendar width.
	 * The calendar width isn't changed when resizing.
	 * @param {HtmlDom} target
	 */
	CalendarBlock.prototype.fixedCalendarStatus = function(target)
	{
		var $target = $(target),
			$calendarGroup = $target.find(".calendar-item");
		if (!$calendarGroup.length === 0)
		{
			return;
		}

		var $calendar = $calendarGroup.find(".calendar"),
			$events = $calendarGroup.find(".schedule"),
			calendarWidth = $calendar.width(),
			allPadding = 40;
		$calendar.width(calendarWidth);
		$events.width("calc(100% - " + (calendarWidth + allPadding) + "px)").css("display", "block");
	};

	/**
	 * If the calendar reset the width, update the calendar style
	 * @param {HtmlDom} target
	 */
	CalendarBlock.prototype.updateCalendarStatus = function(target)
	{
		var $target = $(target),
			$calendarGroup = $target.find(".calendar-item");
		if (!$calendarGroup.length === 0)
		{
			return;
		}

		var $calendar = $calendarGroup.find(".calendar"),
			$events = $calendarGroup.find(".schedule");

		function resetClass(className)
		{
			$calendarGroup.removeClass("fill-one");
			$calendarGroup.removeClass("fill-two");
			$calendarGroup.removeClass("fill-three");
			$calendarGroup.removeClass("fill-four");
			$calendarGroup.addClass(className);
		};

		function updateEvents(className)
		{
			if (!className || $calendarGroup.hasClass(className))
			{
				$events.find(".event .left").removeClass("short");
				$events.find(".event .right").text("12:00PM - 6:00PM");
			}
			else
			{
				$events.find(".event .left").addClass("short");
				$events.find(".event .right").text("12:00PM");
			}
		};

		switch ($target.data("_gridstack_node").width)
		{
			case 1:
				resetClass("fill-one");
				updateEvents("one-column");
				break;
			case 2:
				resetClass("fill-two");
				updateEvents("two-columns");
				break;
			case 3:
				resetClass("fill-three");
				updateEvents();
				break;
			case 4:
				resetClass("fill-four");
				updateEvents();
				break;
		}

		$calendar.width("");
		$events.width("").css("display", "");
	};

	CalendarBlock.prototype.dispose = function()
	{
		//TODO
	};
})();
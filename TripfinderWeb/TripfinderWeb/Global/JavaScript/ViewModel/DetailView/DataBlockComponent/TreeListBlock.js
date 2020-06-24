(function()
{
	createNamespace("TF.DetailView.DataBlockComponent").TreeListBlock = TreeListBlock;

	function TreeListBlock(options, detailView)
	{
		var self = this;
		self.options = options;

		TF.DetailView.DataBlockComponent.BaseDataBlock.call(self, detailView);

		var detailViewHelper = tf.helpers.detailViewHelper;

		self.uniqueClassName = options.uniqueClassName || detailViewHelper.generateUniqueClassName();

		self.$el = $("<div><div class='grid-stack-item-content custom-grid'>\
								<div class='item-title'>" + self.options.title + "</div>\
								<div class='item-content grid'><div class='kendo-grid'></div></div>\
							</div></div>").addClass(self.uniqueClassName);
	}

	TreeListBlock.prototype = Object.create(TF.DetailView.DataBlockComponent.BaseDataBlock.prototype);

	TreeListBlock.prototype.afterDomAttached = function()
	{
		var self = this;
		var columns = this._getConfigByType().columns;
		self.$el.find(".kendo-grid").kendoTreeList({
			dataSource: new kendo.data.TreeListDataSource({ data: [] }),
			filterable: false,
			sortable: false,
			resizable: true,
			selectable: true,
			pageable: false,
			messages: {
				noRows: ""
			},
			columns: columns,
			dataBound: function()
			{
				self._fullFillGridBlank();
			},
			change: function()
			{
				self._refreshGridBlankStyle();
			},
			collapse: function()
			{
				setTimeout(function()
				{
					self._refreshGridBlankStyle();
				});
			},
			expand: function()
			{
				setTimeout(function()
				{
					self._refreshGridBlankStyle();
				});
			}
		});
		self.kendoTreeList = self.$el.find(".kendo-grid").data("kendoTreeList");
		self._setDataSource();
	};

	TreeListBlock.prototype._fullFillGridBlank = function()
	{
		var self = this;
		clearTimeout(this.timeout);
		this.timeout = setTimeout(function()
		{
			var $content = self.$el.find('.k-grid-content');
			$content.find('.kendogrid-blank-fullfill').remove();

			var $blankFiller = $('<div class="kendogrid-blank-fullfill"></div>');
			var $trs = $content.find('table tr');
			$trs.map(function(idx, tr)
			{
				var $tr = $(tr);
				var uid = $tr.data('uid');
				var fillItemColor = getFillItemColor($tr);
				var fillItemHeight = calculateFillItemHeight($tr);
				var fillItemClass = (idx % 2 === 0) ? 'l' : 'l-alt';
				$blankFiller.append(
					'<div data-id="' + uid + '" class="fillItem ' + fillItemClass + '"' +
					' style="height:' + fillItemHeight + 'px;background-color:' + fillItemColor + '">' +
					'</div>'
				);
			});

			$blankFiller.find(".fillItem").click(function()
			{
				var uid = $(this).data('id');
				var row = self.kendoTreeList.items().filter(function(i, item)
				{
					return item.dataset.uid == uid;
				});
				self.kendoTreeList.select(row);
			});

			$content.prepend($blankFiller).find('table').addClass('table-blank-fullfill');

		}, 20);
	};

	function calculateFillItemHeight($tr)
	{
		return $($tr.find('td')[0]).outerHeight();
	}

	function getFillItemColor($tr)
	{
		var $td = $($tr.find('td')[0]);
		return $td.css('background-color');
	}

	TreeListBlock.prototype._refreshGridBlankStyle = function()
	{
		var self = this;
		var $content = self.$el.find('.k-grid-content');
		var $fillItem = $content.find(".fillItem");
		var $trs = $content.find('table tr');
		$trs.map(function(idx, tr)
		{
			var $tr = $(tr);
			var fillItemColor = getFillItemColor($tr);
			var fillItemHeight = calculateFillItemHeight($tr);
			$fillItem.eq(idx).css({ "background-color": fillItemColor, "height": fillItemHeight });
			if ($tr.is(":hidden"))
			{
				$fillItem.eq(idx).hide();
			} else
			{
				$fillItem.eq(idx).show();
			}
		});
	};

	TreeListBlock.prototype._setDataSource = function()
	{
		var self = this;

		if (self.isReadMode())
		{
			self._getConfigByType().getDataSource().then(function(dataSource)
			{
				self.kendoTreeList.setDataSource(dataSource);
			});
		}
	};

	TreeListBlock.prototype._getConfigByType = function()
	{
		var self = this;
		var config = {
			dataSource: [],
			columns: []
		};
		if (self.options.field == "StudentScheduleGrid")
		{
			config = this.studentScheduleGridConfig();
		}

		return config;
	};

	TreeListBlock.prototype.studentScheduleGridConfig = function()
	{
		var self = this;

		function getDays(studentScheduleDays)
		{
			var days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
			var weekDays = TF.RoutingMap.RoutingPalette.RoutingDataModel.weekdays;
			var display = { startDate: "", endDate: "", days: "" };
			studentScheduleDays.forEach(function(scheduleDay, index)
			{
				var newLine = index != studentScheduleDays.length - 1 ? "<br/>" : "";
				var emptySpace = studentScheduleDays.length > 1 ? "--" : "&nbsp;";
				var startDate = scheduleDay.StartDate ? moment(scheduleDay.StartDate).format("L") : emptySpace;
				var endDate = scheduleDay.EndDate ? moment(scheduleDay.EndDate).format("L") : emptySpace;
				display.startDate += startDate + newLine;
				display.endDate += endDate + newLine;

				var displayDays = [];
				weekDays.forEach(function(weekday, i)
				{
					if (scheduleDay[weekday])
					{
						displayDays.push(days[i]);
					}
				});

				display.days += displayDays.join(",") + newLine;
			});

			return display;
		}

		function reverseParentIdForFromTrip(items)
		{
			var itemsDictionary = items.reduce(function(map, obj)
			{
				map[obj.id] = obj;
				return map;
			}, {});

			var results = [];

			var lefts = items.filter(function(item)
			{
				return !items.some(function(record)
				{
					return record.parentId == item.id;
				});
			});
			results = results.concat(lefts);

			function createParent(item, parentId)
			{
				if (parentId)
				{
					var parent = $.extend({}, itemsDictionary[parentId], { id: TF.createId() });
					var originalParentId = parent.parentId;
					parent.parentId = item.id;
					results.push(parent);
					createParent(parent, originalParentId);
				}
			}
			lefts.forEach(function(item)
			{
				createParent(item, item.parentId);
				item.parentId = null;
			});

			return results;
		}

		return {
			getDataSource: function()
			{
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "StudentSchedules"), {
					paramData: {
						"@filter": "eq(StudentID," + self.detailView.recordId + ")",
						"@relationships": "all",
						DBID: tf.datasourceManager.databaseId
					}
				}).then(function(response)
				{
					var items = [];
					response.Items.forEach(function(item)
					{
						var displayDays = getDays(item.StudentScheduleDays);
						items.push({
							id: item.ID,
							scheduleId: item.ID,
							TripName: item.Trip.Name,
							Type: TF.RoutingMap.RoutingPalette.RoutingDataModel.sessions[item.StudentRequirement.SessionID].name,
							Session: item.StudentRequirement.SessionID,
							PuStopName: item.PuTripStop && item.PuTripStop.Street,
							DoStopName: item.DoTripStop && item.DoTripStop.Street,
							Days: displayDays.days,
							StartDate: displayDays.startDate,
							EndDate: displayDays.endDate,
							PreviousScheduleID: item.PreviousScheduleID,
							parentId: item.PreviousScheduleID
						});
					});

					items = items.filter(function(c) { return c.Session == 0; }).concat(reverseParentIdForFromTrip(items.filter(function(c) { return c.Session == 1; })));

					var dataSource = new kendo.data.TreeListDataSource({
						data: items,
						schema: {
							model: {
								expanded: true
							}
						}
					});
					return dataSource;
				});
			},
			columns: [
				{ field: "TripName", title: "Trip", width: 200 },
				{ field: "PuStopName", title: "Pick Up Stop", width: 150 },
				{ field: "DoStopName", title: "Drop Off Stop", width: 150 },
				{ field: "Type", title: "Type", width: 100 },
				{ field: "Days", title: "Days", width: 150, encoded: false },
				{ field: "StartDate", title: "Start Date", width: 150, encoded: false },
				{ field: "EndDate", title: "End Date", width: 150, encoded: false }
			]
		};
	};

	TreeListBlock.prototype.dispose = function()
	{
		this.kendoTreeList && this.kendoTreeList.destroy();
		this.$el = null;
	};

})();
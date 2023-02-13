(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").SelectJunctionViewModel = SelectJunctionViewModel;

	function SelectJunctionViewModel(stops, drawTool, dataModel)
	{
		this.selectedStops = [];
		this.stops = stops;
		this.drawTool = drawTool;
		this.dataModel = dataModel;
	}

	SelectJunctionViewModel.prototype.init = function(viewModel, element)
	{
		this.$element = $(element);
		this.initGrid();
	};

	SelectJunctionViewModel.prototype.initGrid = function()
	{
		var self = this;
		TF.fixGeometryErrorInKendo(this.stops);
		this.$element.find(".kendo-grid").kendoGrid({
			dataSource: new kendo.data.DataSource({
				data: this.stops,
			}),
			columns: [{
				title: "Street",
				field: "Street"
			}, {
				title: "Walkout",
				field: "Distance",
				template: function(dataItem)
				{
					return self.getDistanceTemplate(dataItem);
				}
			}, {
				title: "Number of Students",
				field: "studentCount"
			}],
			height: 400,
			selectable: "multiple",
			resizable: true,
			sortable: {
				mode: "single",
				allowUnsort: true
			},
			hideScrollNotOverflow: true,
			pageable: {
				pageSize: 5000,
				messages: {
					display: ""
				}
			},
			dataBinding: function()
			{
				self.setFooterDisplay();
			},
			dataBound: function(e)
			{
				self.setSelectDisplay(e.sender);
			},
			change: function()
			{
				self.selectChange();
			}
		});
		this.kendoGrid = this.$element.find(".kendo-grid").data("kendoGrid");

		this.initChangeDistanceAndBufferSetting();
	};

	SelectJunctionViewModel.prototype.setSelectDisplay = function(kendoGrid)
	{
		var self = this;
		var items = kendoGrid.items();
		var selected = [];
		var selectedStopIdsMap = {};
		this.selectedStops.forEach(function(data)
		{
			selectedStopIdsMap[data.previewId] = data;
		});
		items.each(function(index, item)
		{
			var dataItem = kendoGrid.dataItem(item);
			if (selectedStopIdsMap[dataItem.previewId])
			{
				selected.push(item);
			}
		});
		self.isSelectByKeepSelect = true;
		kendoGrid.select(selected);
		setTimeout(function()
		{
			self.isSelectByKeepSelect = false;
		});
	};

	SelectJunctionViewModel.prototype.selectChange = function()
	{
		if (this.isSelectByKeepSelect)
		{
			return;
		}
		var selectedRows = this.kendoGrid.select();
		this.selectedStops = [];
		for (var i = 0; i < selectedRows.length; i++)
		{
			var dataItem = this.kendoGrid.dataItem(selectedRows[i]);
			var stop = this.stops.filter(function(stop) { return stop.id == dataItem.id; });
			if (stop && stop.length > 0)
			{
				this.selectedStops.push(stop[0]);
			}
		}
		this.setFooterDisplay();
		this.drawTool.stopPreviewTool.toggleWalkoutPreviewFromJunctionSelect(this.selectedStops);
		this.changeStudentCount();
	};

	SelectJunctionViewModel.prototype.getDistanceTemplate = function(dataItem)
	{
		if (dataItem.isDoorToDoor)
		{
			return "door to door";
		}
		return dataItem.Distance + " " + dataItem.DistanceUnit + " (buffer " + dataItem.Buffer + " " + dataItem.BufferUnit + ")";
	};

	SelectJunctionViewModel.prototype.initChangeDistanceAndBufferSetting = function()
	{
		var self = this;
		var $gridContent = this.$element.find(".k-grid-content");
		// double click to change buffer and distance
		// why use mousedown and not use dblclick event is because student count change cause the grid refresh, so the td will rebuild and dblclick event can not occur
		$gridContent.delegate("tr>td:nth-child(2)", "mousedown", function()
		{
			var time = 300;
			var now = (new Date()).getTime();
			if (self.dblClickTime && now - self.dblClickTime < time)
			{
				tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.TrialStopSettingsModalViewModel(self.dataModel)).then(function(result)
				{
					if (result)
					{
						self.changeSettingOnGrid();
					}
				});
			} else
			{
				self.dblClickTime = now;
			}
		});
	};

	SelectJunctionViewModel.prototype.changeSettingOnGrid = function()
	{
		var self = this;
		self.clearDrawToolPreview();
		self.drawTool.removeNotSelectGraphic([]);

		self.drawTool.prepareCreateFromJunctionData(this.drawTool.junctionsToCreateStop).then(function(trialStops)
		{
			self.stops = trialStops;
			self.selectedStops = [];
			self.kendoGrid.dataSource.data(trialStops);
		});
	};

	SelectJunctionViewModel.prototype.changeStudentCount = function()
	{
		var self = this;
		this.changeNotSelectStopStudentCount();
		this.changeSelectStopStudentCount();
		this.applyStudentCountChangeToGrid();
		// reorder student count when student count is set to need sort 
		var sorts = this.kendoGrid.dataSource.sort() || [];
		for (var i = 0; i < sorts.length; i++)
		{
			if (sorts[i].field == "studentCount")
			{
				self.kendoGrid.dataSource.fetch();
			}
			return;
		}
	};

	/**
	* remove student in not selected 
	*/
	SelectJunctionViewModel.prototype.changeNotSelectStopStudentCount = function()
	{
		var selectedStopsMap = this.toDictionary(this.selectedStops, "id");
		var selectedStudent = this.getUniqueStudents(this.selectedStops);
		var selectedStudentMap = this.toDictionary(selectedStudent, "id");
		this.stops.forEach(function(stop) 
		{
			if (!selectedStopsMap[stop.id])
			{
				stop.studentCount = Enumerable.From(stop.students).Where(function(c) { return !selectedStudentMap[c.id]; }).Count();
				stop.occupyStudents = [];
			}
		});
	};

	/**
	* change student count between selected
	*/
	SelectJunctionViewModel.prototype.changeSelectStopStudentCount = function()
	{
		var selectedStops = this.selectedStops;

		selectedStops.forEach(function(stop)
		{
			var occupy = [];
			stop.students.forEach(function(student)
			{
				if (!isOccupyByOther(stop, student))
				{
					occupy.push(student);
				}
			});
			stop.occupyStudents = occupy;
			stop.studentCount = stop.occupyStudents.length;
		});

		function isOccupyByOther(stop, student)
		{
			for (var i = 0; i < selectedStops.length; i++)
			{
				var otherStop = selectedStops[i];
				if (otherStop.id != stop.id)
				{
					if (Enumerable.From(otherStop.occupyStudents).Any(function(c) { return c.id == student.id; }))
					{
						return true;
					}
				}
			}
			return false;
		}
	};

	SelectJunctionViewModel.prototype.applyStudentCountChangeToGrid = function()
	{
		var self = this;
		var kendoGrid = this.kendoGrid;
		var rows = kendoGrid.items();
		// apply source stops change to kendo grid source
		this.kendoGrid.dataSource.data().forEach(function(item)
		{
			var stop = self.stops.filter(function(stop) { return stop.id == item.id; });
			if (stop && stop.length > 0)
			{
				stop = stop[0];
				item.occupyStudents = stop.occupyStudents;
				item.studentCount = stop.studentCount;
			}
		});

		rows.each(function(i, row)
		{
			$(row).find("td").eq(2).text(kendoGrid.dataItem(row).studentCount);
		});
	};

	SelectJunctionViewModel.prototype.toDictionary = function(items, key)
	{
		var map = {};
		items.forEach(function(item)
		{
			if (key)
			{
				map[item[key]] = item;
			} else
			{
				map[item] = item;
			}
		});
		return map;
	};

	SelectJunctionViewModel.prototype.setFooterDisplay = function()
	{
		var self = this;
		var name = TF.getSingularOrPluralTitle("Stops", self.stops.length);
		var studentTotalCounts = self.getUniqueStudents(self.stops).length;
		var studentDisplay = TF.getSingularOrPluralTitle("Students", studentTotalCounts);

		self.$element.find(".kendo-grid").find(".k-grid-pager").css("text-align", "left")
			.html(String.format("{0} of {1} {2}, {3} of {4} {5}",
				self.selectedStops.length, self.stops.length, name, self.getUniqueStudents(self.selectedStops).length, studentTotalCounts, studentDisplay));
	};

	SelectJunctionViewModel.prototype.getUniqueStudents = function(stops)
	{
		var students = [];
		stops.forEach(function(stop) 
		{
			stop.students.forEach(function(student)
			{
				students.push(student);
			});
		});
		var uniqueStudents = Enumerable.From(students).Distinct(function(c) { return c.RequirementID; }).ToArray();
		return uniqueStudents;
	};

	SelectJunctionViewModel.prototype.apply = function()
	{
		this.drawTool.stopPreviewTool.clear();
		return Promise.resolve(this.selectedStops || []);
	};

	SelectJunctionViewModel.prototype.cancel = function()
	{
		this.clearDrawToolPreview();
		return Promise.resolve(true);
	};

	SelectJunctionViewModel.prototype.clearDrawToolPreview = function()
	{
		this.selectedStops = [];
		this.drawTool._clearTempDrawing();
		this.drawTool.stopPreviewTool.clear();
	};

	SelectJunctionViewModel.prototype.suggest = function()
	{
		var self = this;
		var stops = [];// self.stops.filter(function(stop) { return !stop.isDoorToDoor });
		var dtdStopIds = [];
		self.stops.forEach(function(stop)
		{
			if (!stop.isDoorToDoor) stops.push(stop);
			else
			{
				dtdStopIds.push(stop.id);
			}
		});

		if (stops.length == 0) return tf.promiseBootbox.alert("Failed to get suggestions!", "Warning");
		var result = this.drawTool.solveLocationAllocation(stops);

		if (result && result.length > 0)
		{
			self.kendoGrid.clearSelection();
			var selected = [];
			for (var i = 0; i < self.kendoGrid.items().length; i++)
			{
				var item = self.kendoGrid.items()[i];
				if (result.indexOf(self.kendoGrid.dataItem(item).id) >= 0
					|| dtdStopIds.indexOf(self.kendoGrid.dataItem(item).id) >= 0)
				{
					selected.push(item);
				}
			}
			self.isSelectByKeepSelect = false;
			self.kendoGrid.select(selected);
		} else
		{
			tf.promiseBootbox.alert("Failed to get suggestions!", "Warning");
		}

	};
})();
(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").AssignStudentsViewModel = AssignStudentsViewModel;

	function AssignStudentsViewModel(options, disableControl)
	{
		this.tripStops = this.getTripStops(options);
		this.obDisableControl = disableControl;
		this.selectedTripStops = ko.observable();
	}

	AssignStudentsViewModel.prototype.init = function(viewModel, element)
	{
		this.$element = $(element);
		this.initGrid();
	};

	AssignStudentsViewModel.prototype.initGrid = function()
	{
		var self = this, gridElement = this.$element.find(".kendo-grid"), grid = gridElement.data("kendoGrid");
		if (grid)
		{
			grid.destroy();
		}

		gridElement.kendoGrid({
			dataSource: new kendo.data.DataSource({
				data: this.tripStops
			}),
			columns: [{
				title: "Trip",
				field: "TripName",
				template: "<div><div style='height:20px;width:10px;float:left;margin-right:10px;background:#: color #;'></div>#: TripName #</div>",
				width: 190
			}, {
				title: "Street Location",
				field: "Street",
				template: '<div><span class="stop-number" style="background-color:#:color#;color:#:fontColor#">#:Sequence#</span><span class="stop-street">#: Street #</span><div>',
				width: 250
			},
			{
				title: "# Students",
				field: "AssignedStudentCount",
				type: "number",
				width: 100
			}],
			height: 400,
			selectable: "row",
			sortable: false,
			pageable: {
				pageSize: 5000,
				messages: {
					display: ""
				},
				alwaysVisible: false
			},
			dataBinding: function()
			{
				self.totalStops = self.tripStops.length;
				var $pager = $(this.element).find(".k-grid-pager");
				$pager.css("text-align", "left").html("");
				$pager.append("<span class='total-trips' style='position:absolute;left:1%;'>0 of " + self.totalTrips + (self.totalTrips == 1 ? " trip" : " trips") + "</span>");
				$pager.append("<span class='total-stops' style='position:absolute;left:35%;'>0 of " + self.totalStops + (self.totalStops == 1 ? " stop" : " stops") + "</span>");
				$pager.append("<span class='total-students' style='position:absolute;left:80%;'>0 of " + self.totalStudents + (self.totalStudents == 1 ? " student" : " students") + "</span>");
			},
			change: function()
			{
				self.obDisableControl(this.select().length === 0);
				self.selectedTripStops(self.tripStops[this.select().index()]);
			}
		});
	};

	AssignStudentsViewModel.prototype.getTripStops = function(options)
	{
		return options
			.sort((t1, t2) =>
			{
				const a = t1.Name.toLowerCase();
				const b = t2.Name.toLowerCase();
				if (a < b)
				{
					return -1;
				}
				if (a > b)
				{
					return 1;
				}
				return 0;
			})
			.reduce((calc, trip) => calc.concat(
				trip.TripStops
					.filter(stop => !stop.SchoolCode)
					.map(stop =>
					{
						const fontColor = TF.isLightness(TF.Color.toHTMLColorFromLongColor(stop.color)) ? '#333333' : '#ffffff';
						return {
							Street: stop.Street,
							AssignedStudentCount: stop.AssignedStudentCount,
							TripName: trip.Name,
							TripId: stop.TripId,
							id: stop.id,
							fontColor: fontColor,
							color: stop.color,
							Sequence: stop.Sequence
						}
					})
			), []);
	}

	AssignStudentsViewModel.prototype.apply = function()
	{
		return Promise.resolve(this.selectedTripStops());
	};

	AssignStudentsViewModel.prototype.cancel = function()
	{
		return Promise.resolve(true);
	};

})();
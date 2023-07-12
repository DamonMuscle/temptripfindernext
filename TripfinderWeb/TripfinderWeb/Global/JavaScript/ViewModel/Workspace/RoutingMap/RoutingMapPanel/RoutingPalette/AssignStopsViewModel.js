(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").AssignStopsViewModel = AssignStopsViewModel;

	function AssignStopsViewModel(options, disableControl, modalNegativeClick)
	{
		var self = this;
		self.routingDataModel = options.routingDataModel;
		self.modalNegativeClick = modalNegativeClick;
		self.stopPoolName = options.stopPoolName;
		self.stopPoolColor = options.stopPoolColor;
		this.selectedTripStops = ko.observableArray([]);
		this.addExtendProperty(options.tripStops, options.trips);
		this.tripStops = options.tripStops;
		this.originalTrips = options.trips;
		this.trips = options.trips.length > 1 ? options.trips : [];

		this.totalStops = 0;
		this.totalStudents = 0;
		this.selectedStops = 0;
		this.selectedStudents = 0;
		this.totalTrips = 0;
		this.selectedTrips = 0;
		this.obLabelName = ko.observable('');

		this.obSequenceOptimize = ko.observable(false);
		this.obPreserveContiguous = ko.observable(false);
		this.obOptimizeDisable = ko.observable(false);
		this.obContiguousDisable = ko.observable(false);
		this.obSmartDisable = ko.observable(false);
		this.obSmartSequence = ko.observable(false);
		this.obSequenceOptimize.subscribe(function()
		{
			if (self.obSequenceOptimize())
			{
				self.obSmartSequence(false);
				self.obSmartDisable(true);
			}
			else if (self.obSmartSequence() !== 'Copy To:')
			{
				self.obSmartDisable(false);
			}
		});
		this.obSmartSequence.subscribe(function()
		{
			if (self.obSmartSequence())
			{
				self.obSequenceOptimize(false);
				self.obOptimizeDisable(true);
			}
			else 
			{
				self.obOptimizeDisable(false);
			}
		});

		this.obLabelName.subscribe(function()
		{
			if (self.obLabelName() === 'Copy To:')
			{
				self.obSequenceOptimize(false);
				self.obPreserveContiguous(false);
				self.obSmartSequence(false);
				self.obOptimizeDisable(true);
				self.obContiguousDisable(true);
				self.obSmartDisable(true);
			}
			else
			{
				self.obOptimizeDisable(false);
				self.obContiguousDisable(false);
				if (!self.obSequenceOptimize())
				{
					self.obSmartDisable(false);
				}
			}
		});

		var avaliableTrips = options.trips;
		if (avaliableTrips.length > 1)
		{
			self.obLabelName('Move To:');
			avaliableTrips = avaliableTrips.concat([{ Name: 'divide-line' }, { Name: self.stopPoolName, color: self.stopPoolColor, isStopPool: true }]);
		}
		else if (avaliableTrips.length == 1)
		{
			self.obLabelName('Copy To:');
			avaliableTrips = [{ Name: self.stopPoolName, color: self.stopPoolColor, isStopPool: true }];
		}
		this.obTrips = ko.observableArray(avaliableTrips);
		this.obSelectedTrip = ko.observable(avaliableTrips[0]);

		this.tripSelectTemplate = this.tripSelectTemplate.bind(this);
		this.obSelectedTripText = ko.computed(function()
		{
			if (this.obSelectedTrip())
			{
				if (this.obSelectedTrip().isStopPool)
				{
					this.obLabelName('Copy To:');
				}
				else
				{
					this.obLabelName('Move To:');
				}
				return this.obSelectedTrip().Name;
			}
			return "";
		}, this);
		this.obDisableControl = disableControl;
	}

	AssignStopsViewModel.prototype.init = function(viewModel, element)
	{
		this.$element = $(element);
		this.initGrid();
	};

	AssignStopsViewModel.prototype.addExtendProperty = function(tripStops, trips)
	{
		tripStops.map(function(tripStop)
		{
			for (var i = 0; i < trips.length; i++)
			{
				if (trips[i].id == tripStop.TripId)
				{
					tripStop.TripName = trips[i].Name;
					tripStop.color = trips[i].color;
					break;
				}
			}
		});
	};

	AssignStopsViewModel.prototype.removeExtendProperty = function(tripStops)
	{
		tripStops.map(function(tripStop)
		{
			delete tripStop.TripName;
		});
	};

	AssignStopsViewModel.prototype.tripSelectTemplate = function(tripName)
	{
		var trip = Enumerable.From(this.obTrips()).FirstOrDefault({}, function(c) { return c.Name == tripName; });
		if (trip.color)
		{
			return "<a href=\"#\" role=\"option\" style=\"line-height: 22px\"><div style=\"float: left; width: 10px; height: 22px; background: " + trip.color + "; margin-right: 10px\"></div>" + tripName + "</a>";
		}
		else if (tripName != 'divide-line')
		{
			return "<a href=\"#\" role=\"option\" style=\"line-height: 22px; \">" + tripName + "</a>";
		}
		else
		{
			return "<div style=\"border-top:1px solid;margin-left: 8px;\"></div>";
		}
	};

	AssignStopsViewModel.prototype.initGrid = function()
	{
		function getStudentCount(tripStops)
		{
			var totalCount = 0;
			tripStops.map(function(tripStop)
			{
				totalCount += tripStop.AssignedStudentCount;
			});
			return totalCount;
		}

		function getTripsCount(tripStops)
		{
			var flags = [], totalCount = 0;
			for (var i = 0; i < tripStops.length; i++)
			{
				if (flags[tripStops[i].TripId]) continue;
				flags[tripStops[i].TripId] = true;
				totalCount++;
			}
			return totalCount;
		}
		var self = this, gridElement = this.$element.find(".kendo-grid"), grid = gridElement.data("kendoGrid");
		if (grid)
		{
			grid.destroy();
		}

		gridElement.kendoGrid({
			dataSource: new kendo.data.DataSource({
				data: this.tripStops.map(function(stop)
				{
					var fontColor = TF.isLightness(TF.Color.toHTMLColorFromLongColor(stop.color)) ? '#333333' : '#ffffff';

					return {
						Street: stop.Street,
						AssignedStudentCount: stop.AssignedStudentCount,
						TripName: stop.TripName,
						TripId: stop.TripId,
						id: stop.id,
						fontColor: fontColor,
						color: stop.color,
						Sequence: stop.Sequence
					}
				}),
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
			selectable: "multiple",
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
				self.totalStudents = getStudentCount(self.tripStops);
				self.totalTrips = getTripsCount(self.tripStops);
				var $pager = $(this.element).find(".k-grid-pager");
				$pager.css("text-align", "left").html("");
				$pager.append("<span class='total-trips' style='position:absolute;left:1%;'>0 of " + self.totalTrips + (self.totalTrips == 1 ? " trip" : " trips") + "</span>");
				$pager.append("<span class='total-stops' style='position:absolute;left:35%;'>0 of " + self.totalStops + (self.totalStops == 1 ? " stop" : " stops") + "</span>");
				$pager.append("<span class='total-students' style='position:absolute;left:80%;'>0 of " + self.totalStudents + (self.totalStudents == 1 ? " student" : " students") + "</span>");
			},
			change: function()
			{
				var selectedRows = this.select();
				var selectedTripStops = [];
				for (var i = 0; i < selectedRows.length; i++)
				{
					var currentRowIndex = $(selectedRows[i]).closest("tr").index();
					if (currentRowIndex > -1)
					{
						selectedTripStops.push(self.tripStops[currentRowIndex]);
					}
				}

				self.selectedTripStops(selectedTripStops);
				self.selectedStops = selectedTripStops.length;
				self.selectedStudents = getStudentCount(selectedTripStops);
				self.selectedTrips = getTripsCount(selectedTripStops);
				var avaliableTrips = self.trips.filter(function(trip)
				{
					return !Enumerable.From(selectedTripStops).Any(function(c) { return c.TripId == trip.id; });
				})
				if (avaliableTrips.length > 0)
				{
					avaliableTrips = avaliableTrips.concat([{ Name: 'divide-line' }, { Name: self.stopPoolName, color: self.stopPoolColor, isStopPool: true }]);
				}
				else
				{
					avaliableTrips.push({ Name: self.stopPoolName, color: self.stopPoolColor, isStopPool: true });
				}
				//fix if the datasource change, the drop down list already opened will not be refreshed by new datasource
				if ($('.typeahead.dropdown-menu').css('display') === 'block')
				{
					$('.assign-stop-trip-select').find('.form-control.dropdown-list').click()
				}

				self.obTrips(avaliableTrips);
				if (!Enumerable.From(avaliableTrips).Any(function(p) { return p.Name === self.obSelectedTrip().Name }))
				{
					self.obSelectedTrip(avaliableTrips[0]);
				}
				if (self.obSelectedTrip().isStopPool)
				{
					self.obLabelName('Copy To:');
				}
				else
				{
					self.obLabelName('Move To:');
				}
				self.obDisableControl(self.selectedTripStops().length === 0);
				self.setFootInfo();
			}
		});
	};

	AssignStopsViewModel.prototype.deleteSelectedTripStops = function(viewModel, e)
	{
		var self = this, tripStops = self.selectedTripStops();
		if (!tripStops.length)
		{
			return;
		}

		var msg = "Are you sure you want to delete " + tripStops.length + " stop" + (tripStops.length > 1 ? "s" : "") + "?";
		tf.promiseBootbox.yesNo(
			{
				message: msg,
				closeButton: true
			}, "Warning")
			.then(function(operationResult)
			{
				if (!operationResult)
				{
					return;
				}

				tf.loadingIndicator.showImmediately();
				var promise = self.routingDataModel.fieldTripStopDataModel.delete(tripStops, false, true);

				promise.then(function()
				{
					self.selectedTripStops([]);
					self.tripStops = self.tripStops.filter(function(i)
					{
						return tripStops.indexOf(i) == -1;
					});

					self.initGrid();
					tf.loadingIndicator.tryHide();
					if(self.tripStops.length === 0)
					{
						self.modalNegativeClick && self.modalNegativeClick();
					}
				}).catch(function()
				{
					tf.loadingIndicator.tryHide();
				});
			});
	};

	AssignStopsViewModel.prototype.setFootInfo = function()
	{
		var tripsInfo = this.selectedTrips + " of " + this.totalTrips + (this.totalTrips == 1 ? " trip" : " trips");
		var stopsInfo = this.selectedStops + " of " + this.totalStops + (this.totalStops == 1 ? " stop" : " stops");
		var studentsInfo = this.selectedStudents + " of " + this.totalStudents + (this.totalStudents == 1 ? " student" : " students");
		$(this.$element).find(".total-trips").text(tripsInfo);
		$(this.$element).find(".total-stops").text(stopsInfo);
		$(this.$element).find(".total-students").text(studentsInfo);
	};

	AssignStopsViewModel.prototype.apply = function()
	{
		if (this.selectedTripStops().length == 0)
		{
			tf.promiseBootbox.alert("Please select one or more stops.");
			return Promise.resolve(false);
		}
		this.removeExtendProperty(this.tripStops);
		var result = {
			selectedTripStops: this.selectedTripStops(),
			targetTripId: this.obSelectedTrip() ? this.obSelectedTrip().id : -1,
			sequenceOptimize: this.obSequenceOptimize(),
			smartSequence: this.obSmartSequence(),
			preserveContiguous: this.obPreserveContiguous(),
		};

		return Promise.resolve(result);
	};

	AssignStopsViewModel.prototype.cancel = function()
	{
		this.removeExtendProperty(this.tripStops);
		return Promise.resolve(true);
	};

})();
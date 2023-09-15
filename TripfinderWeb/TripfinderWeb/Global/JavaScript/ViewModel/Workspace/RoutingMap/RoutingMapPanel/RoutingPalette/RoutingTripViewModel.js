(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingTripViewModel = RoutingTripViewModel;

	function RoutingTripViewModel(options)
	{
		TF.DataEntry.BaseDataEntryViewModel.call(this, [], {}, {}, {});
		this.type = "trip";
		this.options = options;
		this.mode = options.trip ? "edit" : "create";
		this.currentOpenTrip = options.currentOpenTrip;
		this.saveToNewTrip = options.saveToNewTrip;
		this.dataModel = options.dataModel;
		this.trip = null;
		this.obOtherButtonVisible = options.obOtherButtonVisible;
		this.obOtherButtonDisable = options.obOtherButtonDisable;
		this.isImperialUnit = tf.measurementUnitConverter.isImperial();
		if (options && options.trip)
		{
			var newTrip = JSON.parse(JSON.stringify(options.trip));
			TF.loopCloneGeometry(newTrip, options.trip);
			this.trip = newTrip;
			this.addStopExtendAttributes(options.trip.FieldTripStops);
		}
		this.obEntityDataModel = ko.observable(new TF.DataModel.TripDataModel());

		// vehicles selector
		this.obVehicles = ko.observableArray();
		this.obSelectedVehicle = ko.observable({});
		this.obSelectedVehicleText = ko.computed(function()
		{
			return this.vehicleNameFormatter(this.obSelectedVehicle());
		}, this);

		// drivers selector
		this.obDrivers = ko.observableArray();
		this.obSelectedDriver = ko.observable({});
		this.obSelectedDriverText = ko.computed(function()
		{
			return this.staffNameFormatter(this.obSelectedDriver());
		}, this);

		// bus aides selector
		this.obBusAides = ko.observableArray();
		this.obSelectedBusAide = ko.observable({});
		this.obSelectedBusAideText = ko.computed(function()
		{
			return this.staffNameFormatter(this.obSelectedBusAide());
		}, this);

		this.obRoutes = ko.observableArray();
		this.obSelectedRoute = ko.observable({});
		this.obSelectedRouteText = ko.computed(() => (this.obSelectedRoute() || {}).Name);

		// travel scenario selector
		this.obTravelScenarios = ko.observableArray();
		this.obSelectedTravelScenario = ko.observable({});
		this.obSelectedTravelScenarioText = ko.computed(function()
		{
			return this.travelScenarioNameFormatter(this.obSelectedTravelScenario());
		}, this);

		this.obTravelScenario = ko.observable();
		ko.computed(function()
		{
			this.obTravelScenario(this.obSelectedTravelScenario() ? this.obSelectedTravelScenario().Id : null);

			if (this.$form)
			{
				this.$form.find("input[name=\"travelScenario\"]").change();
			}
		}, this);

		// Vehicle Curb Approach
		this.obCurbApproach = ko.observableArray([{ text: "Either", value: 0 }, { text: "Right", value: 1 }, { text: "Left", value: 2 }]);

		// Alias
		this.obTripAliasDataModels = ko.observableArray();
		this.obSelectedTripAlias = ko.observable({});
		this.obSelectedTripAliasText = ko.observable();
		this.obSelectedTripAlias.subscribe(function(e)
		{
			if (e)
			{
				this.obSelectedTripAliasText(e.Name);
			}
		}, this);

		// Schools
		this.obSelectedSchools = ko.observableArray();
		this.obUngeocodedSchoolsDataModels = ko.observableArray();
		this.obSchoolsDataModels = ko.observableArray();
		this.schoolFormatter = this.schoolFormatter.bind(this);
		this.selectSchools = this.selectSchools.bind(this);

		// criteria
		this.obCriteriaDisable = ko.observable(false);
		this.obCriteriaTextList = ko.observableArray();
		this.obCriteriaDisableTitle = ko.observable("");
		this.obCriteria = ko.observable("");
		ko.computed(this.criteriaTextListComputer, this);
		ko.computed(this.criteriaImpactedStudentsComputer, this);
		this.obOptimizeSequence = ko.observable(this.mode === "create");

		//ExcludeNoStudStopAndDirections
		this.obExcludeNoStudStopAndDirections = ko.observable(false);
		this.obEntityDataModel().excludeNoStudStopAndDirections.subscribe(this.excludeNoStudChange, this);

		// student filter
		this.obSelectedFilter = ko.observable();
		this.obSelectedFilter.subscribe(this.setFilter, this);

		// trip requirements
		// this.obTripRequirements = ko.observable();
		// ko.computed(this.tripRequirementsImpactedStudentsComputer, this);

		this.hasTripOpen = ko.computed(this.hasMultipleOpen, this);
		this.hasEditTrip = this.dataModel.getEditTrips().length > 0;
		// day of week
		this.obDayOfWeek = ko.observable();
		ko.computed(this.dayOfWeekComputer, this);

		this.obNameError = ko.observable();
		ko.computed(this.tripNameComputer, this);

		this.obStartDateValidFlag = ko.observable("");
		this.obEndDateValidFlag = ko.observable("");
		ko.computed(this.startDateValidComputer, this);
		ko.computed(this.endDateValidComputer, this);

		// trip data
		this.dataModel.viewModel.eventsManager.fileOpenCompleteEvent.subscribe(this.fileOpenComplete.bind(this));

		// trip stops
		this.lineOriginalIndex = 0;
		this.obTripStops = ko.observableArray([]);

		// color
		this.color = ko.observable(this.trip ? this.trip.color : (options.newTripColor ? options.newTripColor : "#ff0000"));
		this.color.subscribe(this.setColor, this);
		this.fontColor = ko.computed(function()
		{
			return TF.isLightness(this.color()) ? "#333333" : "#ffffff";
		}.bind(this));
		this.isColorChanged = ko.observable(false);

		this.isDisabled = !!(options.trip && options.trip.OpenType == "View");
		this.disableOptimizeSequence = true;


		// tap
		this.obTabPage = ko.observable(TF.RoutingMap.RoutingPalette.RoutingTripViewModel.PageTab.TripInfo);

		// direction
		this.routingDirectionDetailViewModel = new TF.RoutingMap.RoutingPalette.RoutingDirectionDetailViewModel(this, this.isDisabled);

		this.routingMapSearch = new TF.RoutingMap.RoutingMapSearch(this.dataModel.mapCanvasPage.mapInstance, {
			addButtonVisible: true,
			// onChoseFromFileEvent: this.addStopsFromFile.bind(this),
			onAddButtonClick: this.addStopsFromSearch.bind(this),
			isDisabled: this.isDisabled
		});

		this._lockWeekDayChange = false;
		this._lockDateChange = false;

		this.isMidDayTrip = ko.computed(function()
		{
			return this.obEntityDataModel().session() == TF.Helper.TripHelper.Sessions.Both;
		}.bind(this));

		this.obEntityDataModel().obMonToFri = ko.observable(this.obEntityDataModel().monday() && this.obEntityDataModel().tuesday() &&
			this.obEntityDataModel().wednesday() && this.obEntityDataModel().thursday() && this.obEntityDataModel().friday());

		this.obEntityDataModel().monday.subscribe(this.setWeekdayGroup, this);
		this.obEntityDataModel().tuesday.subscribe(this.setWeekdayGroup, this);
		this.obEntityDataModel().wednesday.subscribe(this.setWeekdayGroup, this);
		this.obEntityDataModel().thursday.subscribe(this.setWeekdayGroup, this);
		this.obEntityDataModel().friday.subscribe(this.setWeekdayGroup, this);
		this.obEntityDataModel().obMonToFri.subscribe(this.setWeekdayInGroup, this);
		this.obEntityDataModel().session.subscribe(this.sessionChange, this);

		setTimeout(() =>
		{
			tf.shortCutKeys.unbind("enter", Math.random().toString(36).substring(7));
			$(".modal-body").on("keypress", event =>
			{
				if (event.keyCode === 13 && $(".trip-tab").hasClass("active") && !$(event.target).is("textarea"))
				{
					this.apply();
				}
			});
		});
	}

	RoutingTripViewModel.prototype = Object.create(TF.DataEntry.BaseDataEntryViewModel.prototype);
	RoutingTripViewModel.prototype.constructor = RoutingTripViewModel;

	RoutingTripViewModel.PageTab = {
		TripInfo: 0,
		StopInfo: 1,
		DirectionInfo: 2
	};

	RoutingTripViewModel.prototype.init = function(viewModel, e)
	{
		var self = this;
		this.$form = $(e);
		self.loadSupplement().then(function()
		{
			self.loadRoutingSpeedSetting();
			self.getStickyTravelScenario();
			self.getStickyExcludeNoStud();
			self.validationInitialize();
			self.pageLevelViewModel.load(self.$form.data("bootstrapValidator"));
			self.$form.data("bootstrapValidator").resetForm();
			self._initTripData();
			self.bindSaveNewDataInfo();
			self.bindCurrentOpenDataInfo();
			self.bindEditDataInfo();
			self._sortable();
			self.bindChange();
			self.$form.data("bootstrapValidator").options.excluded = [];
			self.avgSpeedNotEmpty();
			self.openTrip = JSON.parse(JSON.stringify(self.trip));
		});
	};

	RoutingTripViewModel.prototype.getStickyTravelScenario = function()
	{
		let StickyTravelScenarioId = tf.storageManager.get(this.type + "-newTripTravelScenario");
		if (this.mode === 'create' && StickyTravelScenarioId)
		{
			var stickyTravelScenario = Enumerable.From(this.obTravelScenarios()).FirstOrDefault(null, function(c) { return c.Id == StickyTravelScenarioId; });
			this.obSelectedTravelScenario(stickyTravelScenario)
		}
	};

	RoutingTripViewModel.prototype.StickyTravelScenario = function(StickyTravelScenarioId)
	{
		var self = this;
		tf.storageManager.save(self.type + "-newTripTravelScenario", StickyTravelScenarioId);
	}

	RoutingTripViewModel.prototype.getStickyExcludeNoStud = function()
	{
		if (tf.storageManager.get(this.type + "-newTripExcludeNoStud"))
		{
			this.obEntityDataModel().excludeNoStudStopAndDirections(tf.storageManager.get(this.type + "-newTripExcludeNoStud"));

		}
	}

	RoutingTripViewModel.prototype.excludeNoStudChange = function(e)
	{
		var self = this;
		tf.storageManager.save(self.type + "-newTripExcludeNoStud", e);
	}


	RoutingTripViewModel.prototype.avgSpeedNotEmpty = function()
	{
		var oldSpeedValue;
		this.obEntityDataModel().defaultSpeed.subscribe((oldValue) =>
		{
			if (oldValue)
			{
				oldSpeedValue = oldValue;
			}
		}, null, "beforeChange");

		this.obEntityDataModel().defaultSpeed.subscribe((newValue) =>
		{
			if (!newValue)
			{
				this.obEntityDataModel().defaultSpeed(oldSpeedValue);
			}
		});
	};

	RoutingTripViewModel.prototype.loadRoutingSpeedSetting = function()
	{
		const avgSpeed = this.dataModel.getSettingFromKey("avgSpeed");
		let avgSpeedForDisplay = avgSpeed;
		if (this.isImperialUnit)
		{
			avgSpeedForDisplay = tf.measurementUnitConverter.convert({
				value: avgSpeed,
				originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
				targetUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Imperial,
				precision: 6
			});
		} else
		{
			avgSpeedForDisplay = Number(avgSpeed);
		}

		if (this.mode == "create")
		{
			var speedType = this.dataModel.getSettingFromKey("speedType");
			this.obEntityDataModel().defaultSpeed(avgSpeedForDisplay);
			this.obEntityDataModel().speedType(speedType);
		}
		else if (!this.trip.DefaultSpeed)
		{
			this.trip.DefaultSpeed = avgSpeed;
			this.obEntityDataModel().defaultSpeed(avgSpeedForDisplay);
		}
	};

	RoutingTripViewModel.prototype.validationInitialize = function()
	{
		var self = this;
		TF.DataEntry.BaseDataEntryViewModel.prototype.validationInitialize.call(self);
		var validator = self.$form.data("bootstrapValidator");
		validator.addField("endDate", {
			trigger: "blur change",
			validators: {
				callback: {
					message: "",
					callback: function(value, validator)
					{
						self.obEndDateValidFlag("");
						if (value != "")
						{
							if (!value.match(/^(\d{2})(\/)(\d{2})(\/)(\d{4})$/)) return { message: "Invaild date", valid: false };
							self.clearDateTimeAlerts();
							if (self.obEntityDataModel().startDate())
							{
								var startDate = new moment(self.obEntityDataModel().startDate());
								var endDate = new moment(value);
								if (endDate.isBefore(startDate))
								{
									self.obEndDateValidFlag("1");
									return {
										message: "",
										valid: true
									};
								}
								return true;
							}
						}
						return true;
					}
				}
			}
		});
		validator.addField("startDate", {
			trigger: "blur change",
			validators: {
				callback: {
					message: "",
					callback: function(value, validator)
					{
						self.obStartDateValidFlag("");
						if (value != "")
						{
							if (!value.match(/^(\d{2})(\/)(\d{2})(\/)(\d{4})$/)) return { message: "Invaild date", valid: false };
							self.clearDateTimeAlerts();
							if (self.obEntityDataModel().endDate())
							{
								var endDate = new moment(self.obEntityDataModel().endDate());
								var startDate = new moment(value);
								if (endDate.isBefore(startDate))
								{
									self.obStartDateValidFlag("1");
									return {
										message: "",
										valid: true
									};
								}
								return true;
							}
						}
						return true;
					}
				}
			}
		});

		validator.addField("enddateerror", {
			trigger: "change",
			validators: {
				callback: {
					message: "",
					callback: function(value, validator)
					{
						if (value != "")
						{
							return {
								message: " must >= Start Date",
								valid: false
							};
						}
						return true;
					}
				}
			}
		});
		validator.addField("startdateerror", {
			trigger: "change",
			validators: {
				callback: {
					message: "",
					callback: function(value, validator)
					{
						if (value != "")
						{
							return {
								message: " must <= End Date",
								valid: false
							};
						}
						return true;
					}
				}
			}
		});
	};

	RoutingTripViewModel.prototype.clearDateTimeAlerts = function()
	{
		var self = this;
		if (self.$form)
		{
			self.$form.find("[name=startDate]").closest(".form-group").find("small[data-bv-validator=callback]").hide();
			self.$form.find("[name=endDate]").closest(".form-group").find("small[data-bv-validator=callback]").hide();
		}
	};

	RoutingTripViewModel.prototype.switchTabClick = function(model, e)
	{
		$(".tab-selection").removeClass("active");
		$(e.currentTarget).addClass("active");
		if ($(e.currentTarget).hasClass("trip-tab"))
		{
			this.obTabPage(TF.RoutingMap.RoutingPalette.RoutingTripViewModel.PageTab.TripInfo);
			this.obOtherButtonDisable(true);
			this.obOtherButtonVisible(false)
		}
		else if ($(e.currentTarget).hasClass("stop-tab"))
		{
			this.obTabPage(TF.RoutingMap.RoutingPalette.RoutingTripViewModel.PageTab.StopInfo);
			this.obOtherButtonDisable(true);
			this.obOtherButtonVisible(false)
		}
		else
		{
			this.obTabPage(TF.RoutingMap.RoutingPalette.RoutingTripViewModel.PageTab.DirectionInfo);
			this.obOtherButtonDisable(false);
			this.obOtherButtonVisible(true)
		}
	};

	RoutingTripViewModel.prototype.getTripType = function(model, e)
	{
		for (var i = 0, sessions = TF.RoutingMap.RoutingPalette.RoutingDataModel.sessions; i < sessions.length; i++)
		{
			if (this.obEntityDataModel().session() == sessions[i].session)
			{
				return sessions[i].name;
			}
		}
	};

	RoutingTripViewModel.prototype.bindChange = function()
	{
		var self = this;
		for (var key in self.obEntityDataModel())
		{
			if (ko.isObservable(self.obEntityDataModel()[key]))
			{
				self.obEntityDataModel()[key].subscribe(function()
				{
					self.setTripByDataModel(self.trip);
				});
			}
		}
	};

	RoutingTripViewModel.prototype._initTripData = function()
	{
		if (this.mode == "create")
		{
			var trip = this.getSaveData();
			trip.id = this.saveToNewTrip ? this.saveToNewTrip.id : TF.createId();
			trip.Session = this.currentOpenTrip ? this.currentOpenTrip.Session : trip.Session;
			trip.IsToSchool = trip.Session == TF.Helper.TripHelper.Sessions.ToSchool;
			trip.type = "trip";
			trip.OpenType = "Edit";
			trip.visible = true;
			trip.color = !trip.color ? this.color() : trip.color;
			trip.FieldTripStops = this.saveToNewTrip ? this.saveToNewTrip.FieldTripStops : this.obTripStops();
			this.trip = trip;
			this.refreshDirection();
		}
	};

	RoutingTripViewModel.prototype.deleteTripStop = function(viewModel, e)
	{
		let removeElement = e.currentTarget.parentElement.parentElement,
			previousElement,
			removeElementIndex,
			msg = "Are you sure you want to delete this field trip stop?";

		return tf.promiseBootbox.yesNo({
			message: msg,
			maxHeight: 600,
			buttons:
			{
				yes: {
					label: "Delete",
					className: "tf-btn-black btn-sm"
				},
				no: {
					label: "Cancel",
					className: "btn-default btn-sm btn-default-link"
				}
			}
		}, "Delete Confirmation").then(result =>
		{
			if (result)
			{
				// Get remove element index
				if ((previousElement = removeElement.previousElementSibling) != null)
				{
					removeElementIndex = 1;
					while ((previousElement = previousElement.previousElementSibling) != null)
					{
						removeElementIndex++;
					}
				}
				else
				{
					// the first conditional rule.
					removeElementIndex = 0;
				}

				var schoolId = this.obTripStops()[removeElementIndex].SchoolId;
				if (schoolId)
				{
					var schoolFullyDelete = !this.obTripStops().some((c, index) => c.SchoolId == schoolId && index != removeElementIndex);
					if (schoolFullyDelete)
					{
						this.setSchools(this.obSelectedSchools().filter(c => c.Id != schoolId), false);
					}
				}

				var obTripStopsArray = this.obTripStops();
				obTripStopsArray.splice(removeElementIndex, 1);
				this.obTripStops([]);
				this._resetStopSequence(obTripStopsArray);
				this.obTripStops(obTripStopsArray);
			}
		});
	};

	RoutingTripViewModel.prototype.hasMultipleOpen = function()
	{
		return this.dataModel.getEditTrips().length > (this.mode == "edit" ? 1 : 0);
	};

	RoutingTripViewModel.prototype.setColor = function()
	{
		var self = this, color = self.color();
		self.trip.color = color;
		self.trip.FieldTripStops.map(function(tripStop)
		{
			tripStop.color = color;
		});
		self.obTripStops([]);
		self.obTripStops(self.trip.FieldTripStops);
		self.refreshDirection();
		self.isColorChanged(true);
	};

	RoutingTripViewModel.prototype.refreshDirection = function()
	{
		this.routingDirectionDetailViewModel.onStopChangeEvent.notify({ tripStops: this.trip.FieldTripStops, color: this.trip.color });
	};

	RoutingTripViewModel.prototype.setTripStopScheduleTime = function(data)
	{
		var self = this;
		if (self.isDisabled)
		{
			return;
		}
		tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.SetScheduledTimeModalViewModel(data, self.trip, self.dataModel))
			.then(function(result)
			{
				if (result)
				{
					self.obTripStops([]);
					self.obTripStops(self.trip.FieldTripStops);
				}
			});
	};

	RoutingTripViewModel.prototype.setStopType = function(data)
	{
		var self = this;
		if (data.SchoolCode || self.isDisabled)
		{
			return;
		}
		tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.NewRoutingTripStopModalViewModel([data], self.trip, self.dataModel, true))
			.then(function(data)
			{
				if (data && data.length > 0)
				{
					var index, tripStop = data[0];
					var tripstopsTemp = self.obTripStops();
					tripstopsTemp.some(function(c, i) { if (c.id == tripStop.id) { index = i; return true; } });
					tripstopsTemp.splice(index, 1, tripStop);
					self.obTripStops([]);
					self.obTripStops(tripstopsTemp);
				}
			});
	};

	RoutingTripViewModel.prototype.bindCurrentOpenDataInfo = function()
	{
		var self = this,
			currentOpenTrip = self.currentOpenTrip;
		if (!currentOpenTrip)
		{
			return;
		}
		if (self.trip && this.mode == "edit")
		{
			currentOpenTrip = self.trip;
		}
		else if (self.saveToNewTrip)
		{
			currentOpenTrip = self.saveToNewTrip;
		}
		this.obEntityDataModel().homeSchl(currentOpenTrip.HomeSchl);
		this.obEntityDataModel().homeTrans(currentOpenTrip.HomeTrans);
		this.obEntityDataModel().shuttle(currentOpenTrip.Shuttle);
		this.obEntityDataModel().activityTrip(currentOpenTrip.ActivityTrip);
		this.obEntityDataModel().hasBusAide(currentOpenTrip.HasBusAide);
		this.obEntityDataModel().nonDisabled(currentOpenTrip.NonDisabled);
		this.obEntityDataModel().disabled(currentOpenTrip.Disabled);
		this.obEntityDataModel().day(currentOpenTrip.Day);
		this.obEntityDataModel().filterName(currentOpenTrip.FilterName);
		this.obEntityDataModel().filterSpec(currentOpenTrip.FilterSpec);
		this.obEntityDataModel().session(currentOpenTrip.Session);
		this.obEntityDataModel().travelScenarioId(currentOpenTrip.TravelScenarioId);
		this.obEntityDataModel().monday(currentOpenTrip.Monday);
		this.obEntityDataModel().tuesday(currentOpenTrip.Tuesday);
		this.obEntityDataModel().wednesday(currentOpenTrip.Wednesday);
		this.obEntityDataModel().thursday(currentOpenTrip.Thursday);
		this.obEntityDataModel().friday(currentOpenTrip.Friday);
		this.obEntityDataModel().saturday(currentOpenTrip.Saturday);
		this.obEntityDataModel().sunday(currentOpenTrip.Sunday);

		this.obEntityDataModel().obMonToFri(currentOpenTrip.Monday && currentOpenTrip.Tuesday && currentOpenTrip.Wednesday && currentOpenTrip.Thursday && currentOpenTrip.Friday);

		this.obEntityDataModel().startDate(currentOpenTrip.StartDate);
		this.obEntityDataModel().endDate(currentOpenTrip.EndDate);
		// var schoolList = (currentOpenTrip.SchoolIds || "").split("!").filter(Boolean);
		// this.setSchools(self.obSchoolsDataModels().filter(function(item)
		// {
		// 	return schoolList.some(function(c) { return c == item.Id; });
		// }));

		this.setTravelScenario(currentOpenTrip.TravelScenarioId);

		if (currentOpenTrip.FilterSpec)
		{
			self.obSelectedFilter(TF.DataModel.BaseDataModel.create(TF.DataModel.GridFilterDataModel, {
				Id: 0,
				Name: currentOpenTrip.FilterName,
				WhereClause: currentOpenTrip.FilterSpec
			}));
		}
	};

	RoutingTripViewModel.prototype.setTravelScenario = function(selectedTravelScenario)
	{
		if (!selectedTravelScenario)
		{
			return;
		}
		this.bindValueInArray(selectedTravelScenario, this.obTravelScenarios(), this.obSelectedTravelScenario);
		this.obTravelScenario(this.obSelectedTravelScenario() ? this.obSelectedTravelScenario().Id : null);
	};

	RoutingTripViewModel.prototype.bindSaveNewDataInfo = function()
	{
		var self = this;
		if (this.saveToNewTrip)
		{
			this.obEntityDataModel().Distance = this.saveToNewTrip.Distance;
			this.saveToNewTrip.FieldTripStops.map(function(tripStop)
			{
				tripStop.color = self.color();
				if (tripStop.SchoolCode == "" || tripStop.SchoolCode == null)
				{
					tripStop.stopBoundaryType = "Current Stop Boundary";
					tripStop.originalBoundary = tripStop.boundary;
					tripStop.sourceType = "tripstop";
				}
			});
			this.obEntityDataModel().update(this.saveToNewTrip);
			this.addStopExtendAttributes(this.saveToNewTrip.FieldTripStops);
			this.obTripStops(this.saveToNewTrip.FieldTripStops);
		}
	};

	RoutingTripViewModel.prototype.bindEditDataInfo = function()
	{
		if (this.mode == "edit")
		{
			this.trip.FieldTripStops.map(function(tripStop)
			{
				if (tripStop.SchoolCode == "" || tripStop.SchoolCode == null)
				{
					tripStop.stopBoundaryType = "Current Stop Boundary";
					tripStop.originalBoundary = tripStop.boundary;
					tripStop.sourceType = "tripstop";
				}
				tripStop.openDrivingDirections = tripStop.RouteDrivingDirections;
				tripStop.openDirections = tripStop.DrivingDirections;
			});
			this.obEntityDataModel().update(this.trip);
			if (tf.measurementUnitConverter.isImperial())
			{
				this.obEntityDataModel().defaultSpeed(tf.measurementUnitConverter.convert({
					value: this.trip.DefaultSpeed,
					originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
					targetUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Imperial,
					precision: 6
				}));
			} else
			{
				this.obEntityDataModel().defaultSpeed(Number(this.trip.DefaultSpeed));
			}
			this.addStopExtendAttributes(this.trip.FieldTripStops);
			this.obTripStops(this.trip.FieldTripStops);
			this.bindValueInArray(this.trip.VehicleId, this.obVehicles(), this.obSelectedVehicle);
			this.bindValueInArray(this.trip.AideId, this.obBusAides(), this.obSelectedBusAide);
			this.bindValueInArray(this.trip.DriverId, this.obDrivers(), this.obSelectedDriver);
			this.bindValueInArray(this.trip.RouteId, this.obRoutes(), this.obSelectedRoute);
			this.bindValueInArray(this.trip.TravelScenarioId || 1, this.obTravelScenarios(), this.obSelectedTravelScenario);
			if (this.trip.TripAliasID > 0)
			{
				this.bindValueInArray(this.trip.TripAliasID, this.obTripAliasDataModels(), this.obSelectedTripAlias);
			}
			else if (this.trip.TripAlias)
			{
				this.obSelectedTripAliasText(this.trip.TripAlias);
			}
			this.refreshDirection();
		}
	};

	RoutingTripViewModel.prototype.bindValueInArray = function(id, source, observer)
	{
		if (id > 0)
		{
			var data = Enumerable.From(source).FirstOrDefault(null, function(c) { return c.Id == id; });
			if (!data && this.obSelectedTravelScenario == observer)
			{
				data = Enumerable.From(source).FirstOrDefault(null, function(c) { return c.Id == 1; }); // get default value
			}
			if (data)
			{
				observer(data);
			}
		}
	};

	RoutingTripViewModel.prototype.loadSupplement = function()
	{
		var p2 = Promise.resolve(), p3 = Promise.resolve(), p4 = Promise.resolve(), p5 = Promise.resolve(), p6 = Promise.resolve();
		var p1 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "tripalias"))
			.then(function(data)
			{
				this.obTripAliasDataModels(data.Items);
			}.bind(this));

		if (tf.authManager.isAuthorizedFor("school", "read"))
		{
			p2 = tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", "schools"), {
				data: {
					fields: ["Name", "School", "GradeRange", "Id", "ArrivalTime", "DepartTime", "Xcoord", "Ycoord"]
				}
			}).then(function(data)
			{
				this.obSchoolsDataModels(data.Items);
			}.bind(this));

			p3 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "schools"),
				{
					paramData: { "@filter": "eq(Xcoord,0)|eq(Ycoord,0)|isnull(Xcoord,)|isnull(Ycoord,)" }
				})
				.then(function(data)
				{
					this.obUngeocodedSchoolsDataModels(data.Items);
				}.bind(this));
		}

		if (tf.authManager.isAuthorizedFor("vehicle", "read"))
		{
			p4 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "vehicles?Inactive=false"))
				.then(function(data)
				{
					this.obVehicles(data.Items);
				}.bind(this));
		}

		if (tf.authManager.isAuthorizedFor("staff", "read"))
		{
			let nameComparer = (x, y) => 
			{
				let xName = x.FullName.toLocaleUpperCase();
				let yName = y.FullName.toLocaleUpperCase();
				return (xName > yName) ? 1 : (xName < yName) ? -1 : 0;
			};
			p5 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "staff?stafftype=Driver"))
				.then(function(data)
				{
					data.Items.sort(nameComparer);
					this.obDrivers(data.Items);
				}.bind(this));

			p6 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "staff?stafftype=Bus Aide"))
				.then(function(data)
				{
					data.Items.sort(nameComparer);
					this.obBusAides(data.Items);
				}.bind(this));
		}

		var p7 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "travelscenarios"))
			.then(function(data)
			{
				// remove walking travel scenario
				this.obTravelScenarios(data.Items.filter(function(t) { return t.Approve != -1 && !(t.ProhibitedId == 1 && t.RestrictedId == 13); }));
			}.bind(this));

		let getRoutes = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "routes"))
			.then(data =>
			{
				this.obRoutes(data.Items);
			});

		return Promise.all([p1, p2, p3, p4, p5, p6, p7, getRoutes]);
	};

	RoutingTripViewModel.prototype.vehicleNameFormatter = function(vehicleDataModel)
	{
		if (!vehicleDataModel || !vehicleDataModel.BusNum)
		{
			return "";
		}
		return (vehicleDataModel.BusNum + " ( " + vehicleDataModel.Capacity + " / " + vehicleDataModel.WcCapacity + " )");
	};

	RoutingTripViewModel.prototype.travelScenarioNameFormatter = function(travelScenarioDataModel)
	{
		if (!travelScenarioDataModel || !travelScenarioDataModel.Name)
		{
			return "";
		}
		return (travelScenarioDataModel.Name);
	};

	RoutingTripViewModel.prototype.staffNameFormatter = function(staffDataModel)
	{
		if (!staffDataModel || !staffDataModel.FullName)
		{
			return "";
		}
		return (staffDataModel.FullName);
	};

	// #region criteria
	RoutingTripViewModel.prototype.criteriaTextListComputer = function()
	{
		if (this.obEntityDataModel().session() == TF.Helper.TripHelper.Sessions.ToSchool)
		{
			this.obCriteriaTextList([tf.applicationTerm.getApplicationTermSingularByName("Home to School"), "Home to Transfer", tf.applicationTerm.getApplicationTermSingularByName("Transfer to School")]);
			this.obCriteriaDisable(false);
			this.obCriteriaDisableTitle("");
			this.obEntityDataModel().homeSchl(true);
		}
		else if (this.obEntityDataModel().session() == TF.Helper.TripHelper.Sessions.FromSchool)
		{
			this.obCriteriaTextList([tf.applicationTerm.getApplicationTermSingularByName("School to Home"), "Transfer to Home", tf.applicationTerm.getApplicationTermSingularByName("School to Transfer")]);
			this.obCriteriaDisable(false);
			this.obCriteriaDisableTitle("");
			this.obEntityDataModel().homeSchl(true);
		}
		else
		{
			if (!this.obCriteriaTextList() || this.obCriteriaTextList().length == 0)
			{
				this.obCriteriaTextList([tf.applicationTerm.getApplicationTermSingularByName("Home to School"), "Home to Transfer", tf.applicationTerm.getApplicationTermSingularByName("Transfer to School")]);
			}
			this.obCriteriaDisable(true);
			this.obEntityDataModel().homeSchl(false);
			this.obEntityDataModel().homeTrans(false);
			this.obEntityDataModel().shuttle(false);
			this.obEntityDataModel().activityTrip(false);
			this.obCriteriaDisableTitle("Criteria does not apply to Shuttles");
		}
	};

	RoutingTripViewModel.prototype.criteriaImpactedStudentsComputer = function()
	{
		if (this.obEntityDataModel().session() == TF.Helper.TripHelper.Sessions.Shuttle)
		{
			this.obCriteria("1");
		}
		else
		{
			this.obCriteria((this.obEntityDataModel().homeSchl() || this.obEntityDataModel().homeTrans() ||
				this.obEntityDataModel().shuttle() || this.obEntityDataModel().activityTrip()) ? "1" : "");
		}
		if (this.$form)
		{
			this.$form.find("input[name=\"criteria\"]").change();
		}
	};
	// #endregion

	// #region School
	RoutingTripViewModel.prototype.schoolFormatter = function(item)
	{
		if (this.mode === "create")
		{
			if (this.obEntityDataModel().session() != TF.Helper.TripHelper.Sessions.FromSchool)
			{
				return `${item.Name} (${item.ArrivalTime || "08:00:00"})`;
			}
			else
			{
				return `${item.Name} (${item.DepartTime || "14:00:00"})`;
			}
		}

		var time;
		for (var i = 0; i < this.obTripStops().length; i++)
		{
			var tripStop = this.obTripStops()[i];
			if (tripStop.SchoolCode == item.SchoolCode || tripStop.SchoolCode == item.School)
			{
				time = item.Name + " (" + tripStop.StopTime + ")";
				break;
			}
		}
		return time;
	};

	RoutingTripViewModel.prototype.selectSchools = function()
	{
		var self = this;
		const excludeData = this.obUngeocodedSchoolsDataModels().map(item => item.Id);
		tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), 'search', 'schools', "id"), {
			data: {
				filterClause: '',
				filterSet: null,
				idFilter: {
					ExcludeAny: excludeData
				}
			}
		}).then(response =>
		{
			tf.modalManager.showModal(
				new TF.Modal.ListMoverSelectSchoolModalViewModel(
					this.obSelectedSchools(),
					{
						title: tf.applicationTerm.getApplicationTermPluralByName("School") + (this.obEntityDataModel().name() != "" ? " serviced by " + this.obEntityDataModel().name() : ""),
						availableTitle: "Available",
						selectedTitle: "Selected",
						type: "school",
						serverPaging: true,
						gridOptions: {
							excludeIds: excludeData
						},
						totalRecordCount: response.TotalRecordCount
					}
				)
			).then(function(selectedSchool)
			{
				self.setSchools(selectedSchool);
			}.bind(self));
		});
	};

	RoutingTripViewModel.prototype.setSchools = function(selectedSchool, changeTripStops)
	{
		if (!selectedSchool)
		{
			return;
		}
		this.obSelectedSchools(selectedSchool);
		var schoolCodes = selectedSchool.map(function(item)
		{
			return item.School || item.SchoolCode;
		});
		var schoolIds = selectedSchool.map(function(item)
		{
			return item.Id;
		});
		function toDataStr(array)
		{
			var ans = "";
			array.forEach(function(item)
			{
				ans = ans + item + "!";
			});
			return ans;
		}
		this.obEntityDataModel().schools(toDataStr(schoolCodes));
		this.obEntityDataModel().schoolIds(toDataStr(schoolIds));
		if (!this.saveToNewTrip && changeTripStops != false)
		{
			if (schoolIds.length > 0)
			{
				this.addSchoolStop(schoolIds);
			}
			else
			{
				this.removeSchoolStops();
			}
		}
		this.$form.find("input[name=\"schools\"]").change();
	};

	RoutingTripViewModel.prototype.removeSchoolStops = function()
	{
		var self = this;
		self.obTripStops.remove(function(c)
		{
			return c.SchoolCode;
		});

		self.obTripStops().forEach(function(tripStop, i)
		{
			tripStop.Sequence = i + 1;
		});
		self.trip.FieldTripStops = self.obTripStops();
		// refresh
		self.obTripStops([]);
		self.obTripStops(self.trip.FieldTripStops);
	};

	RoutingTripViewModel.prototype.addSchoolStop = function(schoolIds)
	{
		var self = this;
		return tf.ajax.get(pathCombine(tf.api.apiPrefix(), "schools"), {
			paramData: {
				"@filter": "in(Id," + schoolIds.join(",") + ")"
			}
		}).then(function(response)
		{
			var schools = schoolIds.map(function(schoolId)
			{
				return Enumerable.From(response.Items).FirstOrDefault({}, function(c) { return c.Id == schoolId; });
			});

			// remove not exists schools
			self.obTripStops.remove(function(c)
			{
				return c.SchoolCode && !Enumerable.From(schools).Any(function(t) { return t.Id == c.SchoolId; });
			});
			if (self.mode == "create")
			{
				if (self.isMidDayTrip())
				{
					schools = schools.concat(schools);
				} else
				{
					self.obTripStops.remove(function(c)
					{
						return c.SchoolCode;
					});
				}
			} else if (self.isMidDayTrip())
			{
				var newSchools = schools.filter(function(school)
				{
					return !Enumerable.From(self.obTripStops()).Any(function(c) { return c.SchoolCode == school.SchoolCode; });
				});
				newSchools.forEach(function(school)
				{
					school.isNew = true;
				});
				// double create new school
				schools = schools.concat(newSchools);
			}

			schools.forEach(function(school, index)
			{
				var tripStop = self.dataModel.fieldTripStopDataModel.getDataModel();
				tripStop.id = TF.createId();
				tripStop.TripStopId = tripStop.id;
				tripStop.TripId = self.trip.id;
				tripStop.StopTime = self.obEntityDataModel().session() != TF.Helper.TripHelper.Sessions.FromSchool ? (school.ArrivalTime ? school.ArrivalTime : "08:00:00") : (school.DepartTime ? school.DepartTime : "14:00:00");
				tripStop.XCoord = school.Xcoord;
				tripStop.YCoord = school.Ycoord;
				// tripStop.Sequence = self.obTripStops().length + 1;
				tripStop.SchoolCode = school.SchoolCode;
				tripStop.SchoolId = school.Id;
				tripStop.Street = school.Name;
				tripStop.City = school.MailCity;
				tripStop.ToSchoolStudents = { HomeToSchool: 0, SchoolToHome: 0 };
				tripStop.ToTransStudents = { HomeToTrans: 0, TransToHome: 0 };
				tripStop.TransToTrans = { PUTransToTrans: 0, DOTransToTrans: 0 };
				tripStop.PUTransToSchool = { TransToSchool: 0, SchoolToTrans: 0 };
				tripStop.DOTransToSchool = { TransToSchool: 0, SchoolToTrans: 0 };
				tripStop.vehicleCurbApproach = 1;
				tripStop.geometry = TF.xyToGeometry(school.Xcoord, school.Ycoord);
				tripStop.color = !self.trip.color ? self.color() : self.trip.color;
				self.addStopExtendAttributes([tripStop]);
				// tripStops.push(tripStop);
				var stopCount = self.obTripStops().length;
				if (self.isMidDayTrip() && (self.mode == "create" || school.isNew))
				{
					if (self.obTripStops().filter(function(c) { return c.SchoolId == tripStop.SchoolId; }).length == 0)
					{
						if (stopCount > 0)
						{
							self.setStopTime(index - 1 >= 0 ? self.obTripStops()[index - 1] : null, self.obTripStops()[index], tripStop);
						}
						self.obTripStops().splice(index, 0, tripStop);
					} else if (self.obTripStops().filter(function(c) { return c.SchoolId == tripStop.SchoolId; }).length == 1)
					{
						var insertIndex = self.obTripStops().length;
						if (stopCount > 0)
						{
							self.setStopTime(insertIndex - 1 >= 0 ? self.obTripStops()[insertIndex - 1] : null, self.obTripStops()[insertIndex], tripStop);
						}
						self.obTripStops().splice(insertIndex, 0, tripStop);
					}
				} else if (!Enumerable.From(self.obTripStops()).Any(function(c) { return c.SchoolId == tripStop.SchoolId; }))
				{
					if (self.obEntityDataModel().session() == TF.Helper.TripHelper.Sessions.FromSchool)
					{
						if (stopCount > 0)
						{
							self.setStopTime(null, self.obTripStops()[0], tripStop);
						}
						self.obTripStops().unshift(tripStop);
					}
					else
					{
						if (stopCount > 0)
						{
							self.setStopTime(self.obTripStops()[stopCount - 1], null, tripStop);
						}
						self.obTripStops().push(tripStop);
					}
				}

			});
			self.obTripStops().forEach(function(tripStop, i)
			{
				tripStop.Sequence = i + 1;
				// if (self.isMidDayTrip() && tripStop.SchoolId)
				// {
				// 	if (tripStop.StopTime === "00:00:00")
				// 	{}
				// 	tripStop.StopTime = moment("12:00:00", "HH:mm:ss").add(60 * index, "minutes").format("HH:mm:ss");
				// 	index++;
				// }
			});
			self.trip.FieldTripStops = self.obTripStops();
			// refresh
			self.obTripStops([]);
			self.obTripStops(self.trip.FieldTripStops);
		});
	};

	RoutingTripViewModel.prototype.setStopTime = function(previousStop, nextStop, newStop)
	{
		if (previousStop && nextStop)
		{
			var duration = moment.duration(moment(nextStop.StopTime, "HH:mm:ss").diff(moment(previousStop.StopTime, "HH:mm:ss"))).asMinutes();
			newStop.StopTime = moment(previousStop.StopTime, "HH:mm:ss").add(duration / 2, "minutes").format("HH:mm:ss");
		}
		else if (previousStop)
		{
			newStop.StopTime = previousStop.StopTime;
		}
		else if (nextStop)
		{
			newStop.StopTime = nextStop.StopTime;
		}
	};

	RoutingTripViewModel.prototype.addStopExtendAttributes = function(tripStops)
	{
		tripStops.map(function(tripStop)
		{
			tripStop.obVehicleCurbApproach = ko.observable(tripStop.vehicleCurbApproach);
		});
	};

	RoutingTripViewModel.prototype.removeStopExtendAttributes = function(tripStop)
	{
		delete tripStop.obVehicleCurbApproach;
		delete tripStop.originalBoundary;
		delete tripStop.sourceType;
		delete tripStop.stopBoundaryType;
		delete tripStop.walkoutDistance;
		delete tripStop.distanceUnit;
		delete tripStop.walkoutBuffer;
		delete tripStop.BufferUnit;
		delete tripStop.walkoutType;
		delete tripStop.sourceStudentGeom;
	};

	// #endregion

	// #region student filter

	RoutingTripViewModel.prototype.setFilter = function()
	{
		if (this.obSelectedFilter())
		{
			this.obEntityDataModel().filterName(this.obSelectedFilter().name());
			this.obEntityDataModel().filterSpec(this.obSelectedFilter().whereClause());
		} else
		{
			this.obEntityDataModel().filterName("");
			this.obEntityDataModel().filterSpec("");
		}
	};

	// #endregion

	// #region midday
	RoutingTripViewModel.prototype.sessionChange = function()
	{
		var self = this;
		var validator = self.$form.data("bootstrapValidator");
		if (this.isMidDayTrip())
		{
			validator.removeField("criteria");
		} else
		{
			validator.addField("criteria", {
				trigger: "blur change",
				validators: {
					notEmpty: {
						message: "required"
					}
				}
			});
		}
		if (this.mode == "create")
		{
			self.setSchools(self.obSelectedSchools());
		}

	};
	// #endregion

	// #region tripRequirements
	// RoutingTripViewModel.prototype.tripRequirementsImpactedStudentsComputer = function()
	// {
	// 	this.obTripRequirements((this.obEntityDataModel().hasBusAide() || this.obEntityDataModel().nonDisabled() || this.obEntityDataModel().disabled()) ? "1" : "");
	// 	if (this.$form)
	// 	{
	// 		this.$form.find("input[name=\"triprequirements\"]").change();
	// 	}
	// };
	// #endregion

	/**
	 * compute day of week  
	 */
	RoutingTripViewModel.prototype.dayOfWeekComputer = function()
	{
		this.obDayOfWeek((this.obEntityDataModel().monday() || this.obEntityDataModel().tuesday() ||
			this.obEntityDataModel().wednesday() || this.obEntityDataModel().thursday() || this.obEntityDataModel().friday() ||
			this.obEntityDataModel().saturday() || this.obEntityDataModel().sunday()) ? "1" : "");
		if (this.$form)
		{
			this.$form.find("input[name=\"dayofweek\"]").change();
		}
	};

	RoutingTripViewModel.prototype.tripNameComputer = function()
	{
		const tripName = this.obEntityDataModel().name().trim();
		this.obEntityDataModel().name(tripName)
		this.obNameError((tripName == "") ? "" : "1");
		if (this.$form)
		{
			this.$form.find("input[name=\"tripname\"]").change();
		}
	};

	RoutingTripViewModel.prototype.startDateValidComputer = function()
	{
		var self = this;
		var orgFlag = self.obStartDateValidFlag();
		self.obStartDateValidFlag((orgFlag == "") ? "" : " must <= End Date");
		if (self.$form)
		{
			self.$form.find("input[name=\"startdateerror\"]").change();
		}
	};

	RoutingTripViewModel.prototype.endDateValidComputer = function()
	{
		var self = this;
		var orgFlag = self.obEndDateValidFlag();
		self.obEndDateValidFlag((orgFlag == "") ? "" : " must >= Start Date");
		if (self.$form)
		{
			self.$form.find("input[name=\"enddateerror\"]").change();
		}
	};

	RoutingTripViewModel.prototype.resetEmpty = function(m, collection, key)
	{
		var inputValue = m.currentTarget.value;
		if (collection.indexOf(inputValue) == -1)
		{
			if (this.obEntityDataModel()[key]() == "" || this.obEntityDataModel()[key]() == null)
			{
				$(m.currentTarget).val("");
			}
			this.obEntityDataModel()[key]("");
		}
	};

	// #region Validation

	RoutingTripViewModel.prototype.validateShuttle = function()
	{
		// Shuttle Validation - A shuttle must go to at least 2 schools
		if (this.obEntityDataModel().session() == TF.Helper.TripHelper.Sessions.Shuttle && this.obSelectedSchools().length < 2)
		{
			tf.promiseBootbox.alert("A shuttle must go to at least 2 schools!");
			return Promise.reject();
		}
		return Promise.resolve();
	};

	RoutingTripViewModel.prototype.saveValidate = function()
	{
		var self = this;
		return this.pageLevelViewModel.saveValidate().then(function(result)
		{
			if (result)
			{
				return Promise.all([self.validateShuttle()]).then(function()
				{
					return true;
				}).catch(function()
				{
					return false;
				});
			}
			return result;
		});
	};

	// #endregion

	// #region Trip stop List

	RoutingTripViewModel.prototype._sortable = function()
	{
		var self = this;
		if (this.isDisabled)
		{
			return;
		}
		$("#trip-Stop-wrapper-sortable").sortable({
			axis: "y",
			containment: $("#trip-Stop-wrapper-sortable").closest(".stop-info-container"),
			cancel: ".first-stop,.last-stop",
			items: ".normal-stop",
			start: function(event, ui)
			{
				self.lineOriginalIndex = ui.item.index();
			},
			stop: function(e, ui)
			{
				var newIndex = ui.item.index(),
					obTripStopsArray = self.obTripStops();
				var tempItem = obTripStopsArray[self.lineOriginalIndex];
				tempItem.Sequence = newIndex + 1;
				obTripStopsArray.splice(self.lineOriginalIndex, 1);
				obTripStopsArray.splice(newIndex, 0, tempItem);
				self.obTripStops([]);
				self._resetStopSequence.call(self, obTripStopsArray);
				self.obTripStops(obTripStopsArray);
			},
			placeholder: "trip-stop-occupy-item",
		});
		$("#trip-Stop-wrapper-sortable").disableSelection();
	};

	RoutingTripViewModel.prototype._resetStopSequence = function(tripStops)
	{
		tripStops.map(function(tripStop, index)
		{
			tripStop.Sequence = index + 1;
		});
		this.trip.FieldTripStops = tripStops;
	};

	RoutingTripViewModel.prototype.addStopsFromSearch = function(data)
	{
		var self = this;
		data.type = "tripStop";
		data.address = data.address.split(",")[0];

		this.dataModel.viewModel.eventsManager.createFieldTripStopFromSearchResult([data], { trip: this.trip, operate: "CreateNewTrip" }).then(function(trip)
		{
			if (trip)
			{
				self.fixStopTime(trip);
				self.trip = trip;
				self.obTripStops([]);
				self.addStopExtendAttributes(self.trip.FieldTripStops);
				self.obTripStops(self.trip.FieldTripStops);
			}
		});
	};

	RoutingTripViewModel.prototype.fileOpenComplete = function(e, trip)
	{
		var self = this;
		if (trip)
		{
			self.fixStopTime(trip);
			self.trip = trip;
			self.obTripStops([]);
			self.addStopExtendAttributes(self.trip.FieldTripStops);
			self.obTripStops(self.trip.FieldTripStops);
		}
	};

	RoutingTripViewModel.prototype.fixStopTime = function(trip)
	{
		this.dataModel.setFieldTripActualStopTime([trip]);
		this.dataModel.setStopTimeForEmptyRecords(trip);
	};

	// #endregion

	RoutingTripViewModel.prototype.save = function()
	{
		var self = this;
		self.setTripByDataModel(self.trip);
		var isTripStopPathChanged = this.isTripStopPathChanged();
		var newTrip = self.trip;
		var pList = [];
		var newStopList = [];

		if (this.mode == "create")
		{
			newTrip.UnsavedNewTrip = true;
		}

		tf.loadingIndicator.show();

		return self.getNewFieldTripStops(newTrip, isTripStopPathChanged).then(function(newTripStops)
		{
			newTrip.FieldTripStops = newTripStops;
			self.changeTripStopSpeeds(newTrip.FieldTripStops);

			return self.dataModel.recalculate([newTrip]).then(function(response)
			{
				var tripData = response[0];
				newTrip.Distance = tripData.Distance;
				newTrip.FinishTime = tripData.FinishTime;
				newTrip.StartTime = tripData.StartTime;
				for (var j = 0; j < newTrip.FieldTripStops.length; j++)
				{
					newTrip.FieldTripStops[j].TotalStopTime = tripData.FieldTripStops[j].TotalStopTime;
					newTrip.FieldTripStops[j].Duration = tripData.FieldTripStops[j].Duration;
					newTrip.FieldTripStops[j].OpenType = newTrip.OpenType;
				}
				self.dataModel.setFieldTripActualStopTime([newTrip]);
				return self.setTripOptimizeInfo(newTrip).then(function()
				{
					tf.loadingIndicator.tryHide();

					return Promise.resolve(newTrip);
				});
			});
		});
	};

	RoutingTripViewModel.prototype.needUpdateTrip = function()
	{
		if (this.isTripStopPathChanged() || this.isDirectionChanged() || this.isTripStopsChanged())
		{
			this.dataModel.needUpdateTrip(true);
			return;
		}

		let newTrip = JSON.parse(JSON.stringify(this.trip));
		delete newTrip.color;
		delete newTrip.FieldTripStops;
		delete newTrip.IsToSchool;
		let oldTrip = JSON.parse(JSON.stringify(this.openTrip));
		delete oldTrip.color;
		delete oldTrip.FieldTripStops;
		delete oldTrip.IsToSchool;
		if (!newTrip.TripAlias && !oldTrip.TripAlias)
		{
			delete newTrip.TripAlias;
			delete oldTrip.TripAlias;
		}
		if (!newTrip.TripAliasID && !oldTrip.TripAliasID)
		{
			delete newTrip.TripAliasID;
			delete oldTrip.TripAliasID;
		}


		this.dataModel.needUpdateTrip(JSON.stringify(newTrip) !== JSON.stringify(oldTrip));
	}

	RoutingTripViewModel.prototype.changeTripStopSpeeds = function(tripStops)
	{
		const self = this;
		tripStops.forEach((stop, i) =>
		{
			if (i != tripStops.length - 1)
			{
				if (self.obEntityDataModel().speedType() == TF.Enums.RoutingSpeedType.StreetSpeed)
				{
					stop.Speed = stop.StreetSpeed ? stop.StreetSpeed : 0;
				}
				else if (self.obEntityDataModel().speedType() == TF.Enums.RoutingSpeedType.DefaultSpeed)
				{
					let speed = self.obEntityDataModel().defaultSpeed();
					if (self.isImperialUnit)
					{
						speed = tf.measurementUnitConverter.convert({
							value: speed,
							originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Imperial,
							targetUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
							precision: 6
						});
					} else
					{
						speed = Number(speed);
					}
					stop.Speed = speed;
				}
			}
		});
	};

	RoutingTripViewModel.prototype.setTripOptimizeInfo = function(trip)
	{
		var self = this, promise = Promise.resolve(true);
		if (self.dataModel.showImpactDifferenceChart())
		{
			if (self.obOptimizeSequence() || trip.FieldTripStops.length <= 1)
			{
				trip.durationDiffRate = 0;
				trip.distanceDiffRate = 0;
				trip.durationDiff = 0;
				trip.distanceDiff = 0;
			}
			else if (!self.obOptimizeSequence())
			{
				promise = self.dataModel.refreshOptimizeSequenceRate(null, true, trip);
			}
		}
		return promise;
	};

	RoutingTripViewModel.prototype.apply = function()
	{
		var self = this;
		this.$form.find("input").trigger("blur");

		return self.saveValidate().then(function(result)
		{
			if (result)
			{
				if (self.mode == "create" && self.trip && self.trip.TravelScenarioId)
				{
					self.StickyTravelScenario(self.trip.TravelScenarioId);
				}
				return self.save();
			}
		});
	};

	RoutingTripViewModel.prototype.cancel = function()
	{
		this.pageLevelViewModel.dispose();
		return Promise.resolve(true);
	};

	RoutingTripViewModel.prototype.other = function()
	{
		this.trip.FieldTripStops.forEach(tripStop =>
		{
			tripStop.DrivingDirections = tripStop.openDrivingDirections;
			tripStop.IsCustomDirection = false;
		});
		this.refreshDirection();
	};

	RoutingTripViewModel.prototype.setTripByDataModel = function(trip)
	{
		var currentTripData = this.getSaveData();
		trip.Name = currentTripData.Name;
		trip.Description = currentTripData.Description;
		trip.Session = currentTripData.Session;
		trip.IsToSchool = trip.Session == TF.Helper.TripHelper.Sessions.ToSchool;
		trip.HomeSchl = currentTripData.HomeSchl;
		trip.HomeTrans = currentTripData.HomeTrans;
		trip.Shuttle = currentTripData.Shuttle;
		trip.ActivityTrip = currentTripData.ActivityTrip;
		trip.HasBusAide = currentTripData.HasBusAide;
		trip.NonDisabled = currentTripData.NonDisabled;
		trip.Disabled = currentTripData.Disabled;
		trip.SchoolIds = currentTripData.SchoolIds;
		trip.Schools = currentTripData.Schools;
		trip.FilterName = currentTripData.FilterName;
		trip.FilterSpec = currentTripData.FilterSpec;
		trip.Day = currentTripData.Day;
		trip.Monday = currentTripData.Monday;
		trip.Tuesday = currentTripData.Tuesday;
		trip.Wednesday = currentTripData.Wednesday;
		trip.Thursday = currentTripData.Thursday;
		trip.Friday = currentTripData.Friday;
		trip.Saturday = currentTripData.Saturday;
		trip.Sunday = currentTripData.Sunday;
		trip.StartDate = currentTripData.StartDate;
		trip.EndDate = currentTripData.EndDate;
		trip.DriverId = this.obSelectedDriver() ? this.obSelectedDriver().Id : 0;
		trip.AideId = this.obSelectedBusAide() ? this.obSelectedBusAide().Id : 0;
		trip.VehicleId = this.obSelectedVehicle() ? this.obSelectedVehicle().Id : 0;
		trip.RouteId = this.obSelectedRoute() ? this.obSelectedRoute().Id : null;
		trip.TravelScenarioId = this.obSelectedTravelScenario() && this.obSelectedTravelScenario().Id ? this.obSelectedTravelScenario().Id : 1;
		trip.ExcludeNoStudStopAndDirections = currentTripData.ExcludeNoStudStopAndDirections;
		trip.TripAlias = this.obSelectedTripAliasText() ? this.obSelectedTripAliasText() : '';
		var tripAlias = this.obTripAliasDataModels().filter(function(item) { return item.Name === this.obSelectedTripAliasText(); }.bind(this));
		if (tripAlias.length > 0)
		{
			trip.TripAliasID = tripAlias[0].Id;
		}
		else
		{
			trip.TripAliasID = 0;
		}
		trip.FieldTripStops = this.obTripStops();
		trip.SpecialEquipments = currentTripData.SpecialEquipments;
		trip.SpeedType = currentTripData.SpeedType;
		let mappings = this.obEntityDataModel().getMapping();
		let defaultSpeedMapping = mappings.find(function(e) { return e.from === 'DefaultSpeed'; })
		let defaultSpeed = currentTripData.DefaultSpeed || defaultSpeedMapping.default;
		trip.DefaultSpeed = tf.measurementUnitConverter.convert({
			value: defaultSpeed.toFixed(0),
			originalUnit: this.isImperialUnit ? tf.measurementUnitConverter.MeasurementUnitEnum.Imperial : tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
			targetUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
			precision: 6
		});
	};

	RoutingTripViewModel.prototype.getNewFieldTripStops = function(newTrip, isTripStopPathChanged)
	{
		var self = this;
		var startIndex = 0;
		var promiseList = [];
		let isAdditional = false;

		promiseList.push(Promise.resolve(newTrip.FieldTripStops));

		return Promise.all(promiseList).then(function(newList)
		{
			var newTripStops = [];
			if (newList && newList[0] && newList[0][0])
			{
				newList.map(function(stopsList, index)
				{
					var isNASolved = !!stopsList;
					if (isNASolved)
					{
						if (index == 0)
						{
							newTripStops = newTripStops.concat(stopsList);
						}
						else
						{
							newTripStops = newTripStops.concat(stopsList.slice(1, stopsList.length));
						}
					} else
					{
						newTripStops = newTrip.FieldTripStops;
					}
				});
			} else
			{
				newTripStops = newTrip.FieldTripStops;
			}

			if (isAdditional && newTripStops.length != newTrip.FieldTripStops.length)
			{
				let tripStops = newTrip.FieldTripStops.map(r =>
				{
					let tripStop = newTripStops.filter(p => p.id == r.id)[0];
					return tripStop ? tripStop : r;
				});
				newTripStops = tripStops;
			}

			// alert message when calculate path failed
			if (newList && newList[0])
			{
				for (var i = 0; i < newList[0].length; i++)
				{
					if (typeof newList[0][i] == "string")
					{
						tf.promiseBootbox.alert(newList[0][i]);
						break;
					}
				}
			}

			newTripStops = newTripStops.filter(i => !!i);
			// newTripStops[newTripStops.length - 1].path = {};
			if (newTripStops.length > 0)
			{
				newTrip.FieldTripStops = newTripStops;
			}
			newTrip.FieldTripStops.map(function(tripStop, index)
			{
				tripStop.Sequence = index + 1;
				tripStop.vehicleCurbApproach = tripStop.obVehicleCurbApproach();
			});

			self.setLockTimeStop(newTrip.FieldTripStops);
			var lastStop = newTripStops[newTripStops.length - 1];
			lastStop.path = {};
			lastStop.Distance = 0;
			lastStop.Speed = 0;
			lastStop.DrivingDirections = "";
			return newTripStops;
		});
	};

	RoutingTripViewModel.prototype.setLockTimeStop = function(tripStops)
	{
		var containLockStop = Enumerable.From(tripStops).FirstOrDefault(null, function(p) { return p.LockStopTime === true; });
		if (!containLockStop)
		{
			var find = false;
			for (var i = 0; i < tripStops.length && !find; i++)
			{
				if (tripStops[i].SchoolCode)
				{
					tripStops[i].LockStopTime = true;
					find = true;
				}
				else
				{
					tripStops[i].LockStopTime = false;
				}
			}
		}
	};

	RoutingTripViewModel.prototype.isTripStopPathChanged = function()
	{
		if (this.mode == "create")
		{
			return true;
		}
		var originalTrip = this.options.saveToNewTrip ? this.options.saveToNewTrip : this.options.trip;
		var oldCompare = originalTrip.FieldTripStops.map(function(item)
		{
			return item.id + "-" + item.vehicleCurbApproach;
		});
		var newCompare = this.obTripStops().map(function(item)
		{
			return item.id + "-" + item.obVehicleCurbApproach();
		});
		return JSON.stringify(oldCompare) != JSON.stringify(newCompare);
	};

	RoutingTripViewModel.prototype.isDirectionChanged = function()
	{
		return this.trip.FieldTripStops.some(x => x.openDirections && x.DrivingDirections && JSON.stringify(x.DrivingDirections) !== JSON.stringify(x.openDirections))
	}

	RoutingTripViewModel.prototype.isTripStopsChanged = function()
	{
		let newTripStops = this.obTripStops().map(item =>
		{
			return {
				...item,
				color: null,
				geometry: null,
				boundary: null,
				Speed: 0,
				DrivingDirections: item.DrivingDirections ? item.DrivingDirections : ''
			}
		});
		let originalTripStops = this.openTrip.FieldTripStops.map(item =>
		{
			return {
				...item,
				color: null,
				geometry: null,
				boundary: null,
				Speed: 0,
				DrivingDirections: item.DrivingDirections ? item.DrivingDirections : ''
			}
		});

		return JSON.stringify(newTripStops) != JSON.stringify(originalTripStops);
	}

	RoutingTripViewModel.prototype.setWeekdayGroup = function()
	{
		var self = this;
		if (self._lockWeekDayChange === false)
		{
			self._lockWeekDayChange = true;
			if (self.obEntityDataModel().monday() && self.obEntityDataModel().tuesday() && self.obEntityDataModel().wednesday() && self.obEntityDataModel().thursday() && self.obEntityDataModel().friday())
			{
				self.obEntityDataModel().obMonToFri(true);
			}
			else
			{
				self.obEntityDataModel().obMonToFri(false);
			}
			self._lockWeekDayChange = false;
		}
	};

	RoutingTripViewModel.prototype.setWeekdayInGroup = function()
	{
		var self = this;
		if (self._lockWeekDayChange === false)
		{
			self._lockWeekDayChange = true;
			if (self.obEntityDataModel().obMonToFri())
			{
				self.obEntityDataModel().monday(true);
				self.obEntityDataModel().tuesday(true);
				self.obEntityDataModel().wednesday(true);
				self.obEntityDataModel().thursday(true);
				self.obEntityDataModel().friday(true);
			}
			else
			{
				self.obEntityDataModel().monday(false);
				self.obEntityDataModel().tuesday(false);
				self.obEntityDataModel().wednesday(false);
				self.obEntityDataModel().thursday(false);
				self.obEntityDataModel().friday(false);
			}
			self._lockWeekDayChange = false;
		}
	};

	RoutingTripViewModel.prototype.getUpdatedStops = function(newFieldTrip)
	{
		const self = this;
		let originalTripStops = self.options.trip.FieldTripStops;
		let newTripStops = newFieldTrip.FieldTripStops;

		let addedStops = [], updatedStops = [], deletedStops = [];

		// deal with delete
		for (let i = 0; i < originalTripStops.length; ++i)
		{
			const originalStop = originalTripStops[i];
			const isDeleted = !newTripStops.some(newStop => originalStop.id == newStop.id);

			if (isDeleted)
			{
				deletedStops.push(originalStop);
			}
		}

		if (deletedStops.length > 0)
		{
			originalTripStops = originalTripStops.filter(originalStop => !deletedStops.some(deletedStop => deletedStop.id == originalStop.id));
			self._resetStopSequence(originalTripStops);
		}

		// deal with add and update
		for (let i = 0; i < newTripStops.length; ++i)
		{
			const tripStop = newTripStops[i];
			const isNewStop = !originalTripStops.some(originalStop => originalStop.id == tripStop.id);
			const isNotDeletedStop = !deletedStops.some(stop => stop.id == tripStop.id);
			const isPrimaryStop = tripStop.PrimaryDeparture || tripStop.PrimaryDestination;

			if (isNewStop)
			{
				addedStops.push(tripStop);
			}
			else if(isNotDeletedStop && !isPrimaryStop)
			{
				let orignalTripStop = originalTripStops.filter(r => r.id == tripStop.id)[0];

				if (orignalTripStop.Sequence != tripStop.Sequence || orignalTripStop.obVehicleCurbApproach() != tripStop.obVehicleCurbApproach())
				{
					updatedStops.push(tripStop);
				}
			}
		}

		return [addedStops, updatedStops, deletedStops];
	}

	RoutingTripViewModel.prototype._calculateTripPath = function(newTrip)
	{
		let self = this;
		let originalTripStops = self.options.trip.FieldTripStops;
		let newTripStops = newTrip.FieldTripStops;

		let count = newTripStops.length;
		let calculateTripStops = [];
		for (let i = 0; i < count; i++)
		{
			let tripStop = newTripStops[i];
			let nextTripStop = i == count - 1 ? null : newTripStops[i + 1];
			let orignalTripStop = originalTripStops.filter(r => r.id == tripStop.id)[0];
			let orignalNextTripStop = orignalTripStop == null ? null : originalTripStops.filter(r => r.Sequence == orignalTripStop.Sequence + 1)[0];

			if (orignalTripStop != null && tripStop.obVehicleCurbApproach() != orignalTripStop.VehicleCurbApproach)
			{
				calculateTripStops.push(tripStop);
				if (i != 0)
				{
					calculateTripStops.push(newTripStops[i - 1]);
				}
			}
			else if (!((nextTripStop == null && orignalNextTripStop == null) || (nextTripStop != null && orignalNextTripStop != null && nextTripStop.id == orignalNextTripStop.id)) || orignalTripStop == null)
			{
				calculateTripStops.push(tripStop);
			}
		}

		let result = [];
		if (calculateTripStops.length > 0)
		{
			let items = [];
			let maxSequence = 0;

			result.push(items);
			calculateTripStops = calculateTripStops.sort((a, b) => a.Sequence < b.Sequence ? -1 : a.Sequence > b.Sequence ? 1 : 0);
			calculateTripStops = Array.from(new Set(calculateTripStops.map(s => s.Sequence))).map(Sequence => { return calculateTripStops.find(s => s.Sequence === Sequence) });
			for (let i in calculateTripStops)
			{
				let stop = calculateTripStops[i];
				if (stop.Sequence - 1 == maxSequence || maxSequence == 0)
				{
					items.push(stop);
				}
				else
				{
					items = [];
					result.push(items);
					items.push(stop);
				}

				maxSequence = stop.Sequence;
			}

			result.forEach(r =>
			{
				let sequence = Math.max.apply(Math, r.map(p => p.Sequence)) + 1;
				let stop = newTripStops.filter(q => q.Sequence == sequence)[0];
				if (stop)
				{
					r.push(stop);
				}
			});
		}

		return result;
	};
})();
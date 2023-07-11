(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").NewRoutingTripStopViewModel = NewRoutingTripStopViewModel;

	function NewRoutingTripStopViewModel(points, trip, dataModel, isEditModal)
	{
		var self = this;
		this.dataModel = dataModel;
		this.trip = trip;
		this.isEditModal = isEditModal;
		this.points = points;
		this.canCopyBoundary = isEditModal ? (points[0].sourceType == 'poolStops' || points[0].sourceType == 'tripstop') : (points[0].type == 'poolStops' || points[0].type == 'tripstop');
		this.tripStops = [];

		this.obIsSmartAssignment = ko.observable(false);

		this.isCopied = ko.observable(false);
		this.isDoorToDoor = ko.observable(false);
		//stop types
		this.multipleTypes = this.canCopyBoundary ? ["Door-to-Door", "Walkout", "Current Stop Boundary"] : ["Door-to-Door", "Walkout"];
		this.obStopTypes = ko.observableArray(this.multipleTypes);
		this.obSelectedStopType = ko.observable(this.obStopTypes()[0]);
		this.obSelectedStopTypeText = ko.computed(function()
		{
			return this.obSelectedStopType();
		}, this);

		this.walkoutType = ko.observable(0);
		this.walkoutDistance = ko.observable(100);
		this.walkoutBuffer = ko.observable(30);

		// units
		this.obUnits = ko.observableArray(["meters", "feet", "kilometers", "miles", "yards"]);
		this.obSelectedDistanceUnit = ko.observable(this.obUnits()[0]);
		this.obSelectedBufferUnit = ko.observable(this.obUnits()[0]);

		this.obSelectedBufferUnit.subscribe(function() { self.initValidation(); });
		this.obSelectedDistanceUnit.subscribe(function() { self.initValidation(); });
		this.walkoutType.subscribe(function() { self.initValidation(); });
		this.obSelectedStopType.subscribe(function() { self.initValidation(); });

		this.obSelectedDistanceUnitText = ko.computed(function()
		{
			return this.obSelectedDistanceUnit();
		}, this);
		this.obSelectedBufferUnitText = ko.computed(function()
		{
			return this.obSelectedBufferUnit();
		}, this);

	}

	NewRoutingTripStopViewModel.prototype.init = function(modal, element)
	{
		var self = this;
		this.element = element;
		if (!self.isEditModal)
		{
			this.points.forEach(function(point)
			{
				point.City = TF.RoutingMap.GeocodeHelper.getCityName(point.geometry);
			});
			this.points.map(function(stop)
			{
				self.tripStops.push($.extend(self.dataModel.tripStopDataModel.getDataModel(), {
					Street: !!stop.address ? stop.address : 'Unknown',
					XCoord: stop.x,
					YCoord: stop.y,
					geometry: stop.geometry,
					City: stop.city,
					unassignStudent: stop.unassignStudent,
					originalBoundary: stop.boundary,
					sourceType: stop.type,
					sourceStudentGeom: stop.sourceStudentGeom
				}));
			});
		}
		else
		{
			self.tripStops = self.points;
		}

		this.initValidation();
	};

	NewRoutingTripStopViewModel.prototype.initValidation = function()
	{
		var self = this;
		self.$form = $(self.element);
		var validatorFields = {};

		if (self.$form.data("bootstrapValidator"))
		{
			self.$form.data("bootstrapValidator").destroy();
		}
		validatorFields.walkoutDistance = {
			trigger: "blur change",
			validators: {
				greaterThan: {
					value: 0,
					message: " must be > 0",
					inclusive: false
				},
				lessThan: {
					value: TF.RoutingMap.RoutingPalette.BaseFieldTripStopEditModal.unitMax(self.obSelectedDistanceUnit()),
				}
			}
		};
		if (this.obSelectedStopType() == "Walkout")
		{
			validatorFields.walkoutDistance.validators.notEmpty = { message: "required" };
		}
		validatorFields.walkoutBuffer = {
			trigger: "blur change",
			validators: {
				greaterThan: {
					value: 0,
					message: " must be > 0",
					inclusive: false
				},
				lessThan: {
					value: TF.RoutingMap.RoutingPalette.BaseFieldTripStopEditModal.unitMax(self.obSelectedBufferUnit()),
				}
			}
		};
		if (this.obSelectedStopType() == "Walkout" && this.walkoutType() == 0)
		{
			validatorFields.walkoutBuffer.validators.notEmpty = { message: "required" };
		}

		self.$form.bootstrapValidator({
			excluded: [],
			live: "enabled",
			message: "This value is not valid",
			fields: validatorFields
		});
		this.validator = self.$form.data("bootstrapValidator");
		this.validator.validate();
	};

	NewRoutingTripStopViewModel.prototype.getDataModel = function()
	{
		return this.dataModel.tripStopDataModel.getDataModel();
	};

	NewRoutingTripStopViewModel.prototype._createMultipleStops = function()
	{
		var self = this;
		var createTripBoundaryAndAssignPromises = [];
		self.tripStops.forEach(function(tripStop)
		{
			createTripBoundaryAndAssignPromises.push(self._createOneStop(tripStop));
		});
		tf.loadingIndicator.show();
		return Promise.all(createTripBoundaryAndAssignPromises)
			.then(function(stops)
			{
				tf.loadingIndicator.tryHide();
				return Promise.resolve(stops);
			});
	};

	NewRoutingTripStopViewModel.prototype._createOneStop = function(tripStop)
	{
		var self = this;
		var data = self.trimStringSpace(tripStop);

		var p = Promise.resolve(true);
		// if (self.obSelectedStopType() != 'Current Stop Boundary')
		// {
		// 	p = self.dataModel.viewModel.drawTool.stopTool.generateWalkoutZone(new tf.map.ArcGIS.Graphic(tripStop.geometry), self.obSelectedStopType() == 'Walkout' ? self.walkoutDistance() : 15, self.obSelectedStopType() == 'Walkout' ? self.obSelectedDistanceUnit() : 'meters',
		// 		self.walkoutBuffer(), self.obSelectedBufferUnitText(), self.obSelectedStopType() == 'Walkout' ? self.walkoutType() : 1, self.trip.color);
		// }
		return p.then(function(result)
		{
			if (self.obSelectedStopType() != 'Current Stop Boundary')
			{
				// data.boundary = result.walkoutZone;
				data.boundary = {};
				data.boundary.type = 'tripBoundary';
			}
			else
			{
				data.boundary = data.originalBoundary;
				data.boundary.type = 'tripBoundary';
			}
			data.TripId = self.trip.id;
			data.color = self.trip.color;
			data.stopBoundaryType = self.obSelectedStopType();
			data.walkoutDistance = self.walkoutDistance();
			data.distanceUnit = self.obSelectedDistanceUnit();
			data.walkoutBuffer = self.walkoutBuffer();
			data.BufferUnit = self.obSelectedBufferUnitText();
			data.walkoutType = self.walkoutType() == 0 ? 'Street Path' : 'Radius';
			data = self.dataModel.tripStopDataModel.createNewData(data, self.isEditModal ? true : false, true);
			return Promise.resolve(data);
		});
	};

	NewRoutingTripStopViewModel.prototype.trimStringSpace = function(item)
	{
		for (var key in item)
		{
			if (typeof item[key] === "string" || item[key] instanceof String)
			{
				item[key] = item[key].trim();
			}
		}
		return item;
	};

	NewRoutingTripStopViewModel.prototype.apply = function()
	{
		var self = this;
		return self.validator.validate().then(function(result)
		{
			if (result)
			{
				return self._createMultipleStops().then(function(stops)
				{
					return Promise.resolve(stops);
				});
			}
			return false;
		});
	};

	NewRoutingTripStopViewModel.prototype.cancel = function()
	{
		return Promise.resolve(false);
	};

})();
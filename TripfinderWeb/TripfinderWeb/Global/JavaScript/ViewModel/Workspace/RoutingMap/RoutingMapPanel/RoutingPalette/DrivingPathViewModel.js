(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").DrivingPathViewModel = DrivingPathViewModel;

	var twoIntegerDigitsFormat = Intl.NumberFormat(undefined, { minimumIntegerDigits: 2 });
	function durationToHms(duration)
	{
		if (duration.years() > 0 || duration.months() > 0 || duration.days() > 0)
		{
			return "23:59:59";
		}

		if (duration.milliseconds() > 500)
		{
			// keep consistent to api recalculate value
			duration.add(1, 'second');
		}
		return duration.hours() + ":" + twoIntegerDigitsFormat.format(duration.minutes()) + ":" + twoIntegerDigitsFormat.format(duration.seconds());
	}

	function DrivingPathViewModel(tripStop, trip, generatedPath, obOtherButtonVisible, obOtherButtonDisable)
	{
		var self = this;
		self.tripStop = tripStop;
		self.generatedPath = generatedPath;
		self.isImperialUnit = tf.measurementUnitConverter.isImperial();
		self.avgSpeed = ko.observable(tripStop.Speed);
		self.distance = ko.observable(tripStop.Distance.toFixed(2));
		if (self.isImperialUnit)
		{
			self.avgSpeed = ko.observable(tf.measurementUnitConverter.convert({
				originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
				targetUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Imperial,
				precision: 5,
				value: self.tripStop.Speed
			}));

			self.distance = ko.observable(tf.measurementUnitConverter.convert({
				originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
				targetUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Imperial,
				precision: 2,
				value: self.tripStop.Distance
			}));
		}

		self.duration = ko.pureComputed(function()
		{
			if (!self.avgSpeed())
			{
				return "23:59:59";
			}

			var duration = self.distance() / self.avgSpeed();
			duration = moment.duration(duration, "hours");
			return durationToHms(duration);
		});

		self.trip = trip;
		self.tripForeColor = TF.RoutingMap.RoutingPalette.RoutingDisplayHelper.getFontColor(trip.color);
		var endPointIndex = trip.TripStops.findIndex(function(i) { return i.id === tripStop.id; }) + 1;
		self.endPoint = trip.TripStops[endPointIndex].Street;

		var drivingDirections = self.tripStop.DrivingDirections || "",
			directions = drivingDirections.split(/\.[^\d]/g), validDirections = [];
		directions.forEach(function(i)
		{
			if (i == null)
			{
				return;
			}

			i = i.trim();
			if (i === "")
			{
				return;
			}

			if (!i.endsWith("."))
			{
				i += ".";
			}

			validDirections.push(i);
		});

		self.drivingDirections = validDirections.join("\r\n");
		self.routingDirectionDetailViewModel = new TF.RoutingMap.RoutingPalette.RoutingDirectionDetailViewModel(self);
		self.tripStop.openDrivingDirections = self.tripStop.RouteDrivingDirections;
	}

	DrivingPathViewModel.prototype.generateDirections = function()
	{
		this.getDirection(true);
	};

	DrivingPathViewModel.prototype.getDirection = function(doGenerate)
	{
		let stop = $.extend({}, this.tripStop), nextStop, stops = [stop];
		if (doGenerate)
		{
			stop.DrivingDirections = stop.openDrivingDirections;
			stop.IsCustomDirection = false;
		}

		let getNextStop = (tripStops, sequence) =>
		{
			for (let i = 0; i < tripStops.length; i++)
			{
				if (tripStops[i].Sequence == sequence)
				{
					return tripStops[i];
				}
			}
		}

		if (stop.Sequence + 1 <= this.trip.TripStops.length)
		{
			nextStop = getNextStop(this.trip.TripStops, stop.Sequence + 1);
		}

		if (nextStop != undefined)
		{
			stops.push(nextStop);
		}

		this.routingDirectionDetailViewModel.onStopChangeEvent.notify({ tripStops: stops, color: this.trip.color });
	};

	DrivingPathViewModel.prototype.init = function(model, el)
	{
		this.validator = $(el).bootstrapValidator({
			excluded: [],
			live: 'enabled',
			fields: {
				avgSpeed: {
					trigger: "blur change",
					validators:
					{
						notEmpty:
						{
							message: "required"
						}
					}
				}
			}
		}).data('bootstrapValidator');

		this.getDirection();
	}


	DrivingPathViewModel.prototype.apply = function()
	{
		var self = this;
		return self.validator.validate().then(function(result)
		{
			if (result)
			{
				self.routingDirectionDetailViewModel.applyDirection([self.tripStop]);
				let avgSpeed = self.avgSpeed();
				if (self.isImperialUnit)
				{
					avgSpeed = tf.measurementUnitConverter.convert({
						originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Imperial,
						targetUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
						precision: 5,
						value: avgSpeed
					});
				}
				var data = { avgSpeed: avgSpeed, duration: self.duration() };
				return data;
			}

			return false;
		});
	};
})();
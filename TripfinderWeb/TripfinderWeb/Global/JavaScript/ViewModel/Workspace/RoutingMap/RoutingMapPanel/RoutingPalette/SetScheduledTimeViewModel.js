(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").SetScheduledTimeViewModel = SetScheduledTimeViewModel;

	function SetScheduledTimeViewModel(tripStop, trip)
	{
		var self = this;
		
		this.momentHelper = new TF.Document.MomentHelper();

		this.tripStop = tripStop;
		this.trip = trip;
		this.arrivalDate = ko.observable();
		this.arrivalTime = ko.observable();
		this.numOfMinutes = ko.observable(0);
		this.changeType = ko.observable(0);

		self.convertStopTimeArrive(tripStop);


		this.arrivalDateTime = ko.computed(function()
		{
			const arrivalDateTime = self.momentHelper.getDateTime(self.arrivalDate(), self.arrivalTime(), true);
			const stopTime = self.tripStop.StopTimeArrive || self.tripStop.StopTimeDepart;

			var minutesDiff = moment(arrivalDateTime).diff(stopTime, "minutes");
			if (minutesDiff >= 0)
			{
				self.changeType(0);
			} else
			{
				self.changeType(1);
			}
			self.numOfMinutes(Math.abs(minutesDiff));

			return arrivalDateTime;
		});

		this.stopAffect = ko.observable(0);
		// this.numOfMinutes = ko.computed(function()
		// {
		// 	return moment(self.arrivalDateTime()).diff(self.tripStop.StopTime, 'minutes');
		// });
		this.updateDisabled = ko.observable(false);
		this.updateDisabledNumberBox = ko.computed(function()
		{
			return !self.updateDisabled();
		});
		this.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
	}

	SetScheduledTimeViewModel.prototype.convertStopTimeArrive = function(tripStop)
	{
		const stopTime = tripStop.StopTimeArrive || tripStop.StopTimeDepart;
		this.arrivalDate(this.momentHelper.getDatePart(stopTime, true));
		this.arrivalTime(this.momentHelper.getTimePart(stopTime, true));
	}

	SetScheduledTimeViewModel.prototype.init = function(viewModel, element)
	{
		var self = this;
		self.$element = $(element);
		self.validateInit(viewModel, element);
	};

	SetScheduledTimeViewModel.prototype.minuMinutes = function()
	{
		// this.arrivalTime(moment.utc(this.arrivalTime()).subtract(1, 'minutes'));
		var minute = Number(this.numOfMinutes());
		if (minute > 0)
		{
			this.numOfMinutes(minute - 1);
		}
	};

	SetScheduledTimeViewModel.prototype.addMinutes = function()
	{
		// this.arrivalTime(moment.utc(this.arrivalTime()).add(1, 'minutes'));
		var minute = Number(this.numOfMinutes());
		this.numOfMinutes(minute + 1);
	};

	SetScheduledTimeViewModel.prototype.validateInit = function(model, el)
	{
		var self = this,
			validatorFields = {};
		this.$form = $(el);
		// var nameInput = $(el).find("[name=name]");
		var isValidating = false;
		setTimeout(function()
		{
			validatorFields.stopTime = {
				trigger: "blur change",
				validators:
				{
					notEmpty:
					{
						message: "required"
					},
					callback:
					{
						message: " not a valid time.",
						callback: function(value)
						{
							if (value && value.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9] ([AaPp][Mm])/) == null)
							{
								return false;
							}

							return true;

						}.bind(this)
					}
				}
			};

			validatorFields.stopDate = {
				trigger: "blur change",
				validators:
				{
					notEmpty:
					{
						message: "required"
					}
				}
			}

			this.$form.bootstrapValidator(
				{
					excluded: [":hidden", ":not(:visible)"],
					live: "enabled",
					message: "This value is not valid!!!",
					fields: validatorFields
				}).on("success.field.bv", function(e, data)
				{
					if (!isValidating)
					{
						isValidating = true;
						self.pageLevelViewModel.saveValidate(data.element);
						isValidating = false;
					}
				});

			self.pageLevelViewModel.load(self.$form.data("bootstrapValidator"));
			if (self.$form.data("bootstrapValidator")) self.$form.data("bootstrapValidator").validate();
		}.bind(this));
	};

	SetScheduledTimeViewModel.prototype.apply = function()
	{
		var self = this;
		return this.pageLevelViewModel.saveValidate()
			.then(function(result)
			{
				if (result)
				{
					self.tripStop.StopTime = self.arrivalDateTime();
					var isUpdatedRelatedTime = self.updateDisabled();
					if (isUpdatedRelatedTime)
					{
						self.trip.FieldTripStops.map(function(tripStopTemp)
						{
							if ((self.stopAffect() == self.stopAffectEnum.AllStops && tripStopTemp.id != self.tripStop.id)
								|| (self.stopAffect() == self.stopAffectEnum.AllPrevious && tripStopTemp.Sequence < self.tripStop.Sequence)
								|| (self.stopAffect() == self.stopAffectEnum.AllFollowing && tripStopTemp.Sequence > self.tripStop.Sequence)
							)
							{
								if (tripStopTemp.PrimaryDeparture)
								{
									tripStopTemp.StopTime = tripStopTemp.StopTimeDepart;
								}
								else
								{
									tripStopTemp.StopTime = tripStopTemp.StopTimeArrive;
								}

								tripStopTemp.StopTime = (self.changeType() == self.changeTypeEnum.Add ?
									(moment(tripStopTemp.StopTime, "HH:mm:ss").add(self.numOfMinutes(), "minutes"))
									: (moment(tripStopTemp.StopTime, "HH:mm:ss").subtract(self.numOfMinutes(), "minutes")));
								tripStopTemp.StopTime = tripStopTemp.StopTime.format("YYYY-MM-DDTHH:mm:ss");

								if(!tripStopTemp.PrimaryDeparture && !tripStopTemp.PrimaryDestination)
								{
									tripStopTemp.StopTimeArrive = tripStopTemp.StopTime;
									tripStopTemp.StopTimeDepart = moment(self.tripStop.StopTimeArrive)
																		.add(Math.ceil(moment.duration(tripStopTemp.Duration).asMinutes()), "minutes")
																		.format("YYYY-MM-DDTHH:mm:ss");
								}
							}
						});
					}
					else
					{
						if (self.tripStop.PrimaryDepature)
						{
							self.tripStop.StopTimeDepart = self.tripStop.StopTime;
						}
						else
						{
							self.tripStop.StopTimeArrive = self.tripStop.StopTime;
						}
					}

					var data = { isUpdatedRelatedTime: isUpdatedRelatedTime, trip: self.trip, tripStop: self.tripStop };

					return Promise.resolve(data);
				}
			});
	};

	SetScheduledTimeViewModel.prototype.changeTypeEnum = { "Add": 0, "Subtract": 1 };
	SetScheduledTimeViewModel.prototype.stopAffectEnum = { "AllPrevious": 0, "AllFollowing": 1, "AllStops": 2 };

	SetScheduledTimeViewModel.prototype.cancel = function()
	{
		return Promise.resolve(true);
	};
})();
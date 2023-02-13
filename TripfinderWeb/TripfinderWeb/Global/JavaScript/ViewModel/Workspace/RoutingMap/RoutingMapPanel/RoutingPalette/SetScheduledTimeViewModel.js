(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").SetScheduledTimeViewModel = SetScheduledTimeViewModel;

	function SetScheduledTimeViewModel(tripStop, trip)
	{
		var self = this;
		this.tripStop = tripStop;
		this.trip = trip;
		this.arrivalTime = ko.observable(tripStop.StopTime);
		this.numOfMinutes = ko.observable(0);
		this.changeType = ko.observable(0);
		this.arrivalDateTime = ko.computed(function()
		{
			var result = moment(self.arrivalTime()).format("HH:mm:ss").toLowerCase() == "invalid date" ? moment(self.arrivalTime(), "HH:mm:ss") : moment(self.arrivalTime()).format("HH:mm:ss");
			var minutesDiff = moment(result, "HH:mm:ss").diff(moment(self.tripStop.StopTime, "HH:mm:ss"), "minutes");
			if (minutesDiff >= 0)
			{
				self.changeType(0);
			} else
			{
				self.changeType(1);
			}
			self.numOfMinutes(Math.abs(minutesDiff));
			return result;
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

	SetScheduledTimeViewModel.prototype.init = function(viewModel, element)
	{
		var self = this;
		this.$element = $(element);
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
			validatorFields.arrivalTime = {
				trigger: "blur change",
				validators:
				{
					// notEmpty:
					// {
					// 	message: "required"
					// },
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

			$(el).bootstrapValidator(
				{
					excluded: [":hidden", ":not(:visible)"],
					live: "enabled",
					message: "This value is not valid",
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

			this.pageLevelViewModel.load(this.$form.data("bootstrapValidator"));
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
						self.trip.TripStops.map(function(tripStopTemp)
						{
							if ((self.stopAffect() == self.stopAffectEnum.AllStops && tripStopTemp.id != self.tripStop.id)
								|| (self.stopAffect() == self.stopAffectEnum.AllPrevious && tripStopTemp.Sequence < self.tripStop.Sequence)
								|| (self.stopAffect() == self.stopAffectEnum.AllFollowing && tripStopTemp.Sequence > self.tripStop.Sequence)
							)
							{
								tripStopTemp.StopTime = (self.changeType() == self.changeTypeEnum.Add ?
									(moment(tripStopTemp.StopTime, "HH:mm:ss").add(self.numOfMinutes(), "minutes"))
									: (moment(tripStopTemp.StopTime, "HH:mm:ss").subtract(self.numOfMinutes(), "minutes")));
								tripStopTemp.StopTime = tripStopTemp.StopTime.format("HH:mm:ss");
								if (tripStopTemp.Sequence == 1)
								{
									self.trip.StartTime = tripStopTemp.StopTime;
								}
								else if (tripStopTemp.Sequence == self.trip.TripStops.length)
								{
									self.trip.FinishTime = tripStopTemp.StopTime;
								}
							}
						});
					}

					if (self.tripStop.Sequence == 1)
					{
						self.trip.StartTime = self.tripStop.StopTime;
					}
					else if (self.tripStop.Sequence == self.trip.TripStops.length)
					{
						self.trip.EndTime = self.tripStop.StopTime;
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
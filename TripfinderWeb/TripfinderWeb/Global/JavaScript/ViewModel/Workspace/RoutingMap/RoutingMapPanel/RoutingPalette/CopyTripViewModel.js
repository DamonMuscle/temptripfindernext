(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").CopyTripViewModel = CopyTripViewModel;

	function CopyTripViewModel(trip, dataModel)
	{
		var self = this;
		this.trip = trip;
		this.dataModel = dataModel;
		this.obOriginalTripName = ko.observable(trip.Name);
		this.obOriginalTripType = ko.observable(TF.RoutingMap.RoutingPalette.RoutingDataModel.sessions[trip.Session].name);
		this.obReverse = ko.observable(trip.Session == 3 || trip.Session == 2 ? false : true);
		this.obAutoAssignStudent = ko.observable(true);
		this.obOpenType = ko.observable(0);
		this.obCreateTrip = ko.observable(true);
		this.obTripType = ko.observable(trip.Session);
		this.obName = ko.observable(trip.Name + ' Copy');
		this.disableEditOption = ko.computed(function()
		{
			if (self.obTripType() != self.trip.Session)
			{
				self.obOpenType(1);
				return true;
			}
		});
	}

	CopyTripViewModel.prototype.copyTrip = function()
	{
		var self = this;
		for (var i = 0; i < this.trip.TripStops.length - 1; i++)
		{
			this.trip.TripStops[i].StreetEndBeforeCpoy = this.trip.TripStops[i + 1].Street;
		}
		var newTrip = self.copyFromOriginal(this.trip);
		this.dataModel.resetCopyTripValue(newTrip);
		newTrip.Session = self.obTripType();
		newTrip.IsToSchool = self.obTripType() === 0;
		newTrip.Name = this.obName();

		// when copying from a copied trip, [this.trip.Id] equals to 0. So we take advantage of [this.trip.copyFromTripId]
		newTrip.copyFromTripId = this.trip.Id || this.trip.copyFromTripId;

		// remove unique property when copy
		newTrip.GUID = null;
		var openType = self.obOpenType() === 0 ? 'Edit' : 'View';
		// add flag to mark unsaved new trip
		if (openType === 'Edit' || (openType === 'View' && !self.obCreateTrip()))
		{
			newTrip.UnsavedNewTrip = true;
		}

		this.setNewTripStops(newTrip);
		this.dataModel.trips.push(newTrip);
		this.dataModel._setOpenType([newTrip], openType);
		return self.dataModel.initialNewTripInfo(newTrip, !self.obAutoAssignStudent(), self.trip.Session != self.obTripType()).then(function()
		{
			newTrip.TripStops.map(function(tripStop)
			{
				// view trip only show assigned students
				if (tripStop.OpenType === 'View')
				{
					tripStop.TotalStudentCount = tripStop.AssignedStudentCount;
				}
				tripStop.Students.map(function(student)
				{
					student.OpenType = openType;
				});
			});
			self.initTripStopTime(newTrip);
			return newTrip;
		});
	};

	CopyTripViewModel.prototype.initTripStopTime = function(newTrip)
	{
		newTrip.TripStops.map(function(tripStop)
		{
			tripStop.StopTime = tripStop.ActualStopTime;
		});
	};

	CopyTripViewModel.prototype.setNewTripStops = function(newTrip)
	{
		var policy = this.getNewCopyPolicy(), self = this;

		if (self.trip.Session == 3 || self.trip.Session == 2)
		{
			return newTrip;
		}

		if (policy == self.tripTypeEnum.NotReverseAndToSchool)
		{
			if (self.trip.Session == 0)
			{
				return newTrip;
			}
			else if (self.trip.Session == 1)
			{
				var array = [];
				for (var i = 0; i < newTrip.TripStops.length; i++)
				{
					if (newTrip.TripStops[i].SchoolCode)
					{
						array.push(newTrip.TripStops.splice(i, 1)[0]);
					}
					else
					{
						break;
					}
				}
				array.reverse();
				newTrip.TripStops = newTrip.TripStops.concat(array);
			}
		}
		else if (policy == self.tripTypeEnum.ReverseAndToSchool)
		{
			if (self.trip.Session == 0)
			{
				array = [];
				for (i = newTrip.TripStops.length - 1; i > -1; i--)
				{
					if (newTrip.TripStops[i].SchoolCode)
					{
						array.push(newTrip.TripStops.splice(i, 1)[0]);
					}
					else
					{
						break;
					}
				}
				array.reverse();
				newTrip.TripStops.reverse();
				newTrip.TripStops = newTrip.TripStops.concat(array);
			}
			else if (self.trip.Session == 1)
			{
				newTrip.TripStops.reverse();
			}
		}
		else if (policy == self.tripTypeEnum.ReverseAndFromSchool)
		{
			if (self.trip.Session == 0)
			{
				newTrip.TripStops.reverse();
			}
			else if (self.trip.Session == 1)
			{
				array = [];
				for (i = 0; i < newTrip.TripStops.length; i++)
				{
					if (newTrip.TripStops[i].SchoolCode)
					{
						array.push(newTrip.TripStops.splice(i, 1)[0]);
					}
					else
					{
						break;
					}
				}
				newTrip.TripStops.reverse();
				newTrip.TripStops = array.concat(newTrip.TripStops);
			}
		}
		else if (policy == self.tripTypeEnum.NotReverseAndFromSchool)
		{
			if (self.trip.Session == 0)
			{
				array = [];
				for (var i = newTrip.TripStops.length - 1; i > -1; i--)
				{
					if (newTrip.TripStops[i].SchoolCode)
					{
						array.push(newTrip.TripStops.splice(i, 1)[0]);
					}
				}
				newTrip.TripStops = array.concat(newTrip.TripStops);
			}
			else if (self.trip.Session == 1)
			{
				return newTrip;
			}
		}
		newTrip.TripStops.map(function(tripStop, index)
		{
			tripStop.Sequence = index + 1;
		});
	};

	CopyTripViewModel.prototype.copyFromOriginal = function(trip)
	{
		// remove route stop path, cause route stop property contain _map property, json copy would catch circular sturcture error
		trip.TripStops.map(function(tripStop)
		{
			if (tripStop.routeStops)
			{
				delete tripStop.routeStops;
			}
		});
		var newTrip = JSON.parse(JSON.stringify(trip));
		TF.loopCloneGeometry(newTrip, trip);
		return newTrip;
	};

	CopyTripViewModel.prototype.getNewCopyPolicy = function()
	{
		if (this.obTripType() == 0 && !this.obReverse())
		{
			return this.tripTypeEnum.NotReverseAndToSchool;
		}
		else if (this.obTripType() == 0 && this.obReverse())
		{
			return this.tripTypeEnum.ReverseAndToSchool;
		}
		else if (this.obTripType() == 1 && this.obReverse())
		{
			return this.tripTypeEnum.ReverseAndFromSchool;
		}
		else if (this.obTripType() == 1 && !this.obReverse())
		{
			return this.tripTypeEnum.NotReverseAndFromSchool;
		}
	};

	CopyTripViewModel.prototype.saveValidate = function()
	{
		var self = this;
		return self.dataModel.validateUniqueName(self.obName()).then(function()
		{
			return true;
		});
	};

	CopyTripViewModel.prototype.tripTypeEnum = { 'NotReverseAndToSchool': 0, 'ReverseAndToSchool': 1, 'ReverseAndFromSchool': 2, 'NotReverseAndFromSchool': 3 };

	CopyTripViewModel.prototype.apply = function()
	{
		var self = this;
		return self.saveValidate().then(function(result)
		{
			if (result)
			{
				tf.loadingIndicator.showImmediately();
				return self.copyTrip().then(function(newTrip)
				{
					let tripPathPromise = Promise.resolve(false);
					if (!self.obReverse() && (self.obTripType() == self.trip.Session))
					{
						tripPathPromise = Promise.resolve();
					}
					else
					{
						if (newTrip.TripStops.length > 1)
						{
							tripPathPromise = self.dataModel.viewModel.drawTool.NAtool.refreshTripByMultiStops(newTrip.TripStops);
						}
					}

					return tripPathPromise.then(function()
					{
						for (var i = 0; i < newTrip.TripStops.length - 1; i++)
						{
							newTrip.TripStops[i].StreetEndAfterCpoy = newTrip.TripStops[i + 1].Street;
						}

						newTrip.TripStops.forEach(function(tripStop)
						{
							for (var i = 0; i < self.trip.TripStops.length - 1; i++)
							{
								if ((tripStop.Street == self.trip.TripStops[i].Street && tripStop.StreetEndAfterCpoy == self.trip.TripStops[i].StreetEndBeforeCpoy))
								{
									tripStop.Speed = self.trip.TripStops[i].Speed;
								}
							}
						});

						self.dataModel.recalculate([newTrip]).then(function(response)
						{
							var tripData = response[0];
							for (var j = 0; j < newTrip.TripStops.length; j++)
							{
								newTrip.TripStops[j].TotalStopTime = tripData.TripStops[j].TotalStopTime;
								newTrip.TripStops[j].Duration = tripData.TripStops[j].Duration;
							}
							self.dataModel.setActualStopTime([newTrip]);
						});

						tf.loadingIndicator.tryHide();
						if (self.obCreateTrip() && self.obOpenType() == 1)
						{
							self.dataModel.save([newTrip]);
						}
						return newTrip;
					});
				});
			}
		});
	};

	CopyTripViewModel.prototype.cancel = function()
	{
		return Promise.resolve(true);
	};

})();
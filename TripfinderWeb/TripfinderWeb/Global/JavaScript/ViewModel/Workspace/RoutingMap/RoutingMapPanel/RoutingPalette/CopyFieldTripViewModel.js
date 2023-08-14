(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").CopyFieldTripViewModel = CopyFieldTripViewModel;

	function CopyFieldTripViewModel(fieldTrip, dataModel)
	{
		var self = this;
		this.fieldTrip = fieldTrip;
		this.dataModel = dataModel;
		this.obOriginalTripName = ko.observable(fieldTrip.Name);
		// this.obOriginalTripType = ko.observable(TF.RoutingMap.RoutingPalette.RoutingDataModel.sessions[fieldTrip.Session].name);
		// this.obReverse = ko.observable(fieldTrip.Session == 3 || fieldTrip.Session == 2 ? false : true);
		this.obAutoAssignStudent = ko.observable(true);
		this.obOpenType = ko.observable(0);
		this.obCreateTrip = ko.observable(true);
		this.obTripType = ko.observable(fieldTrip.Session);
		this.obName = ko.observable(fieldTrip.Name + ' Copy');
		this.obDepartureDateTime = ko.observable(fieldTrip.DepartDateTime);
		this.disableEditOption = ko.computed(function()
		{
			if (self.obTripType() != self.fieldTrip.Session)
			{
				self.obOpenType(1);
				return true;
			}
		});
	}

	CopyFieldTripViewModel.prototype.copyFieldTrip = function()
	{
		var self = this;
		// for (var i = 0; i < this.fieldTrip.TripStops.length - 1; i++)
		// {
		// 	this.fieldTrip.TripStops[i].StreetEndBeforeCpoy = this.fieldTrip.TripStops[i + 1].Street;
		// }
		var newTrip = self.copyFromOriginal(this.fieldTrip);
		this.dataModel.resetCopyFieldTripValue(newTrip);
		// newTrip.Session = self.obTripType();
		// newTrip.IsToSchool = self.obTripType() === 0;
		newTrip.Name = this.obName();
		
		newTrip.DepartDate = moment(this.obDepartureDateTime()).format("YYYY-MM-DDT00:00:00");
		newTrip.DepartDateTime = moment(this.obDepartureDateTime()).format("YYYY-MM-DDTHH:mm:ss");
		newTrip.DepartTime = moment(this.obDepartureDateTime()).format("HH:mm");

		// when copying from a copied trip, [this.trip.Id] equals to 0. So we take advantage of [this.trip.copyFromFieldTripId]
		newTrip.copyFromFieldTripId = this.fieldTrip.Id || this.fieldTrip.copyFromFieldTripId;

		var openType = self.obOpenType() === 0 ? 'Edit' : 'View';
		// add flag to mark unsaved new fieldTrip
		if (openType === 'Edit' || (openType === 'View' && !self.obCreateTrip()))
		{
			newTrip.UnsavedNewTrip = true;
		}

		// this.setNewTripStops(newTrip);
		this.dataModel.trips.push(newTrip);
		this.dataModel._setOpenType([newTrip], openType);
		return Promise.resolve(newTrip);
	};

	CopyFieldTripViewModel.prototype.initTripStopTime = function(newTrip)
	{
		newTrip.TripStops.map(function(fieldTripStop)
		{
			fieldTripStop.StopTime = fieldTripStop.ActualStopTime;
		});
	};

	CopyFieldTripViewModel.prototype.setNewTripStops = function(newTrip)
	{
		var policy = this.getNewCopyPolicy(), self = this;

		if (self.fieldTrip.Session == 3 || self.fieldTrip.Session == 2)
		{
			return newTrip;
		}

		if (policy == self.fieldTripTypeEnum.NotReverseAndToSchool)
		{
			if (self.fieldTrip.Session == 0)
			{
				return newTrip;
			}
			else if (self.fieldTrip.Session == 1)
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
		else if (policy == self.fieldTripTypeEnum.ReverseAndToSchool)
		{
			if (self.fieldTrip.Session == 0)
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
			else if (self.fieldTrip.Session == 1)
			{
				newTrip.TripStops.reverse();
			}
		}
		else if (policy == self.fieldTripTypeEnum.ReverseAndFromSchool)
		{
			if (self.fieldTrip.Session == 0)
			{
				newTrip.TripStops.reverse();
			}
			else if (self.fieldTrip.Session == 1)
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
		else if (policy == self.fieldTripTypeEnum.NotReverseAndFromSchool)
		{
			if (self.fieldTrip.Session == 0)
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
			else if (self.fieldTrip.Session == 1)
			{
				return newTrip;
			}
		}
		newTrip.TripStops.map(function(fieldTripStop, index)
		{
			fieldTripStop.Sequence = index + 1;
		});
	};

	CopyFieldTripViewModel.prototype.copyFromOriginal = function(fieldTrip)
	{
		// remove route stop path, cause route stop property contain _map property, json copy would catch circular sturcture error
		fieldTrip.FieldTripStops.map(function(fieldTripStop)
		{
			if (fieldTripStop.routeStops)
			{
				delete fieldTripStop.routeStops;
			}
		});
		var newTrip = JSON.parse(JSON.stringify(fieldTrip));
		TF.loopCloneGeometry(newTrip, fieldTrip);
		return newTrip;
	};

	CopyFieldTripViewModel.prototype.getNewCopyPolicy = function()
	{
		if (this.obTripType() == 0 && !this.obReverse())
		{
			return this.fieldTripTypeEnum.NotReverseAndToSchool;
		}
		else if (this.obTripType() == 0 && this.obReverse())
		{
			return this.fieldTripTypeEnum.ReverseAndToSchool;
		}
		else if (this.obTripType() == 1 && this.obReverse())
		{
			return this.fieldTripTypeEnum.ReverseAndFromSchool;
		}
		else if (this.obTripType() == 1 && !this.obReverse())
		{
			return this.fieldTripTypeEnum.NotReverseAndFromSchool;
		}
	};

	CopyFieldTripViewModel.prototype.saveValidate = function()
	{
		var self = this;
		return Promise.resolve(true);
	};

	CopyFieldTripViewModel.prototype.fieldTripTypeEnum = { 'NotReverseAndToSchool': 0, 'ReverseAndToSchool': 1, 'ReverseAndFromSchool': 2, 'NotReverseAndFromSchool': 3 };

	CopyFieldTripViewModel.prototype.apply = function()
	{
		var self = this;
		return self.saveValidate().then(function(result)
		{
			if (result)
			{
				return self.copyFieldTrip().then(function(newTrip){

					tf.loadingIndicator.showImmediately();
					let fieldTripPathPromise = Promise.resolve(false);

					if (newTrip.FieldTripStops.length > 1)
					{
					}

					let newTrips = [newTrip];

					const departureDateTime = moment(self.obDepartureDateTime()).format("YYYY-MM-DDTHH:mm:ss");
					self.dataModel.setFieldTripActualStopTime(newTrips, true, clientTimeZoneToUtc(departureDateTime));
					self.dataModel.copyFieldTripStopTimeWithActualTime(newTrips);

					return fieldTripPathPromise.then(function()
					{
						for (var i = 0; i < newTrip.FieldTripStops.length - 1; i++)
						{
							// newTrip.FieldTripStops[i].StreetEndAfterCpoy = newTrip.FieldTripStops[i + 1].Street;
						}

						// newTrip.FieldTripStops.forEach(function(fieldTripStop)
						// {
						// 	for (var i = 0; i < self.fieldTrip.FieldTripStops.length - 1; i++)
						// 	{
						// 		if ((fieldTripStop.Street == self.fieldTrip.FieldTripStops[i].Street && fieldTripStop.StreetEndAfterCpoy == self.fieldTrip.TripStops[i].StreetEndBeforeCpoy))
						// 		{
						// 			fieldTripStop.Speed = self.fieldTrip.FieldTripStops[i].Speed;
						// 		}
						// 	}
						// });
						
						// self.dataModel.recalculate([newTrip]).then(function(response)
						// {
						// 	var fieldTripData = response[0];
						// 	for (var j = 0; j < newTrip.FieldTripStops.length; j++)
						// 	{
						// 		newTrip.FieldTripStops[j].TotalStopTime = fieldTripData.FieldTripStops[j].TotalStopTime;
						// 		newTrip.FieldTripStops[j].Duration = fieldTripData.FieldTripStops[j].Duration;
						// 	}
						// 	self.dataModel.setFieldTripActualStopTime([newTrip]);
						// });
						
						if (self.obCreateTrip() && self.obOpenType() == 1)
						{
							self.dataModel.saveFieldTrip(newTrips);
							// self.dataModel.copyFieldTrip(newTrip);
						}
						tf.loadingIndicator.tryHide();
						return newTrip;
					});
				
				});
			}
		});
	};

	CopyFieldTripViewModel.prototype.cancel = function()
	{
		return Promise.resolve(true);
	};

})();
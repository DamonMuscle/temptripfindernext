(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingFieldTripStopEditModal = RoutingFieldTripStopEditModal;
	var TripStopHelper = TF.Helper.TripStopHelper;

	function RoutingFieldTripStopEditModal(viewModel)
	{
		TF.RoutingMap.RoutingPalette.BaseFieldTripStopEditModal.call(this, viewModel, "workspace/RoutingMap/RoutingMapPanel/RoutingPalette/EditRoutingFieldTripStop");

		this.viewModel = viewModel;
		this.dataModel = viewModel.dataModel;
		this.availableTrips = [];
		this.obDataModel = this.createObservableDataModel(this.dataModel.fieldTripStopDataModel.getDataModel());

		this.obIsSmartAssignment = ko.observable(false);
		this.obIsSmartSequence = ko.observable(false);
		this.obIsSmartAssignment.subscribe(isSmartAssignment => isSmartAssignment && this.obIsSmartSequence(true));

		// trips selector
		this.obTrips = ko.observableArray([]);
		this.obSelectedTrip = ko.observable({});
		this.tripSelectTemplate = this.tripSelectTemplate.bind(this);
		this.obSelectedTripText = ko.computed(function()
		{
			if (this.obSelectedTrip())
			{
				return this.obSelectedTrip().Name;
			}
			return "";
		}, this);
		this.obIsOpenMultipleTrips = ko.observable(false);
		this.isCopied = ko.observable(false);
		this.isDoorToDoor = ko.observable(false);

		this.disabled = ko.computed(function() { return this.showWalkout() == false && this.obSelectedStopType() != "Walkout"; }, this);

		this.bindTag = false;
		this.isJunction.subscribe(e =>
		{
			if (e)
			{
				tf.storageManager.save("tripStop-vehicleCurbApproach", 0);
				this.obDataModel.vehicleCurbApproach(0);
			}
		});

		this.obIncludeNoStudStop = ko.observable(false);

		// stop time arrive
		this.obStopTimeArriveDisable = ko.observable(false);
		this.obStopTimeArriveDate = ko.observable(null);
		this.obStopTimeArriveTime = ko.observable(null);
		this.obStopTimeArriveDisplay = ko.observable("");
		this.obDataModel.StopTimeArrive.subscribe(this.stopTimeArriveChange, this);
		this.obStopTimeArriveDate.subscribe(this.obStopTimeArriveDateChange, this);
		this.obStopTimeArriveTime.subscribe(this.obStopTimeArriveTimeChange, this);
		this.obStopTimeArriveDatePlaceholder = ko.computed(()=>
		{
			return this.obStopTimeArriveDisable() ? "None" : "MM/DD/YYYY";
		}, this);
		this.obStopTimeArriveTimePlaceholder = ko.computed(()=>
		{
			return this.obStopTimeArriveDisable() ? "None" : "hh:mm tt";
		}, this);

		// stop time depart
		this.obStopTimeDepartDisable = ko.observable(false);
		this.obStopTimeDepartDate = ko.observable(null);
		this.obStopTimeDepartTime = ko.observable(null);
		this.obStopTimeDepartDisplay = ko.observable("");
		this.obDataModel.StopTimeDepart.subscribe(this.stopTimeDepartChange, this);
		this.obStopTimeDepartDate.subscribe(this.obStopTimeDepartDateChange, this);
		this.obStopTimeDepartTime.subscribe(this.obStopTimeDepartTimeChange, this);
		this.obStopTimeDepartDatePlaceholder = ko.computed(()=>
		{
			return this.obStopTimeDepartDisable() ? "None" : "MM/DD/YYYY";
		}, this);
		this.obStopTimeDepartTimePlaceholder = ko.computed(()=>
		{
			return this.obStopTimeDepartDisable() ? "None" : "hh:mm tt";
		}, this);

		this.vrpTool = new TF.RoutingMap.RoutingPalette.VRPTool();
		this.dataModel.onTripStopsChangeEvent.subscribe(this.onTripStopsChangeEvent.bind(this));

		// stop sequence
		this.stopSequenceGraphics = [];
		this.obSequenceSource = ko.observableArray();
		this.obSelectedSequence = ko.observable();
		this.obSelectedSequenceText = ko.computed(() =>
		{
			return this.obSelectedSequence();
		});

		// this.obSelectedSequenceDisable = ko.computed(() => (this.obIsSmartSequence() && (this.mode() == "new" || this.mode() === 'edit')) || this.isReadOnly());
		this.obSelectedSequenceDisable = ko.computed(() => this.isReadOnly());

		// disable for future implementation
		this.obSelectedFieldTripDisable = ko.observable(true);
		this.obSmartAssignmentDisable = ko.observable(true);
		this.obSmartSequenceDisable = ko.observable(true);
		// this.obStopSequenceDisable = ko.computed(() => this.obSmartSequenceDisable() || this.obSelectedSequenceDisable());
		this.obStopSequenceDisable = ko.computed(() => this.obSelectedSequenceDisable());
		this.obCornerStopVisible = ko.observable(false);

		this.initSequenceSubscribe();
	}

	RoutingFieldTripStopEditModal.prototype = Object.create(TF.RoutingMap.RoutingPalette.BaseFieldTripStopEditModal.prototype);
	RoutingFieldTripStopEditModal.prototype.constructor = RoutingFieldTripStopEditModal;

	RoutingFieldTripStopEditModal.prototype.getWalkoutBufferVisible = function()
	{
		return this.isNoWalkoutType() && !this.isCopied() && this.mode() == 'new' && this.walkoutType() == 0 && this.obSelectedStopType() == 'Walkout';
	};

	RoutingFieldTripStopEditModal.prototype.init = function(options)
	{
		var self = this;
		this.availableTrips = Enumerable.From(self.dataModel.getEditTrips()).OrderBy("$.Name").ToArray();
		this.obTrips(self.availableTrips);
		this.obSelectedTrip(self.getSelectedTrip());
		this.obIsSmartAssignment(false);
		this.obIsSmartSequence(this.mode() !== 'edit' && this.dataModel.getSmartSequenceSetting());
		this.obIsOpenMultipleTrips(this.availableTrips.length > 1 && (this.mode() == "new" || this.mode() === 'edit'));
		this.isJunction(false);
		this.isNewStop(this.mode() === 'new');
		self.initWalkoutData();
		if (!self.bindTag)
		{
			self._bindParamsChange("#showWalkoutCheckbox", "ShowWalkout");
			self._bindParamsChange("#tripStopDistance", "Distance");
			self._bindParamsChange("#tripStopDistanceUnit", "DistanceUnit");
			self._bindParamsChange("input[type=radio][name=walkoutType]", "WalkoutType");
			self._bindParamsChange("#smartSequenceCheckbox", "SmartSequence");
			self._bindParamsChange(".tripStopCurbApproachRadio", "vehicleCurbApproach");
			self._bindParamsChange("#includeNoStudStopCheckbox", "IncludeNoStudStop");
			self._bindParamsChange("#stopTypeDropDown>input", "stopType");
			self.bindTag = true;
		}
		return TF.RoutingMap.RoutingPalette.BaseFieldTripStopEditModal.prototype.init.call(self, options);
	};

	RoutingFieldTripStopEditModal.prototype.initSequenceSubscribe = function()
	{
		this.obSelectedTrip.subscribe(this.initStopSequenceSelector.bind(this));
		this.updateStopGraphicSequence = this.updateStopGraphicSequence.bind(this);
		this.obIsSmartSequence.subscribe(this.updateStopGraphicSequence);
		this.obSelectedSequence.subscribe(this.updateStopGraphicSequence);
		this.obSelectedTrip.extend({ notify: 'always' });
		this.obIsSmartSequence.extend({ notify: 'always' });
		this.obSelectedSequence.extend({ notify: 'always' });
	};

	RoutingFieldTripStopEditModal.prototype.initStopSequenceSelector = function()
	{
		var trip = this.obSelectedTrip();
		if (!trip || this.obIsMultipleCreate())
		{
			return;
		}
		// init sequence source
		var sequences = [];
		trip.FieldTripStops.forEach(x =>
		{
			sequences.push(x.Sequence);
		});
		var tripChanged = this.data.length == 1 && this.obSelectedTrip().id != this.original[0].FieldTripId;
		if (this.mode() === 'new' || tripChanged)
		{
			sequences.push(sequences[sequences.length - 1] + 1);
		}
		this.obSequenceSource(sequences);
		// set sequence number
		var lastSequence = _.last(sequences);
		var defaultSequence = lastSequence - 1;

		if(this.mode() === 'edit')
		{
			defaultSequence = TF.Helper.TripHelper.getTripStopInsertSequence(trip.FieldTripStops, trip.Session);
		}
		
		var sequence = this.data[0].Sequence ? this.data[0].Sequence : defaultSequence;
		this.obSelectedSequence(sequence);
	};

	/**
	 * update the sequence number on trip stop graphic
	 */
	RoutingFieldTripStopEditModal.prototype.updateStopGraphicSequence = function()
	{
		// update stop point sequence when user manually set stop sequence
		var stopSequence = 0;
		// this.removeStopSequenceGraphics();
		if (this.data.length == 1 && !this.obIsMultipleCreate())
		{
			stopSequence = this.obSelectedSequence();
			this.highlightStopSequencePathAndPoint(stopSequence);
			console.log(`selected stop sequence: ${stopSequence}`);

			// update sequence for check data changed when cancel click
			if (this.mode() != "new" && !this.obIsSmartSequence())
			{
				if (stopSequence)
				{
					this.data[0].Sequence = stopSequence;
				}
				else
				{
					this.data[0].Sequence = this.original[0].Sequence;
				}
			}
		}
	};

	/**
	 * highlight current stop to previous and after
	 */
	RoutingFieldTripStopEditModal.prototype.highlightStopSequencePathAndPoint = function(sequence)
	{
		const currentTrip = this.obSelectedTrip();
		const currentStop = this.data[0];

		if(!currentStop.FieldTripId)
		{
			currentStop.FieldTripId = currentTrip.id;
		}

		const data = { tripId: currentStop.FieldTripId, stopId: currentStop.id, stopSequence: sequence };

		PubSub.publish(TF.RoutingPalette.FieldTripMapEventEnum.HighlightFieldTripStop, data);
	};

	RoutingFieldTripStopEditModal.prototype.removeStopSequenceGraphics = function()
	{
		PubSub.publish(TF.RoutingPalette.FieldTripMapEventEnum.ClearHighlightFieldTripStop);
	};

	RoutingFieldTripStopEditModal.prototype.initWalkoutData = function()
	{
		var self = this;
		var d = self.getWalkoutData();
		if (d.walkoutBuffer) self.walkoutBuffer(d.walkoutBuffer);
		if (d.walkoutDistance) self.walkoutDistance(d.walkoutDistance);
		if (d.distanceUnit) self.obSelectedDistanceUnit(d.distanceUnit);
		if (d.bufferUnit) self.obSelectedBufferUnit(d.bufferUnit);
	};

	RoutingFieldTripStopEditModal.prototype.onTripStopsChangeEvent = function(e, items)
	{
		var self = this;
		if (items.delete.length > 0 && Enumerable.From(items.delete).Any(function(c) { return c.id == self.obDataModel.id(); }))
		{
			self.closeEditModal();
		}
	};

	RoutingFieldTripStopEditModal.prototype.getDataModel = function()
	{
		return this.dataModel.fieldTripStopDataModel.getDataModel();
	};

	RoutingFieldTripStopEditModal.prototype.getAllHighlight = function()
	{
		return [];
	};

	RoutingFieldTripStopEditModal.prototype.getSelectedTrip = function()
	{
		if (this.mode() != "new" && this.data.length > 0)
		{
			return this.dataModel.getTripById(this.data[0].FieldTripId);
		}
		if (this.availableTrips.length == 0) return {};
		if (tf.storageManager.get("routing-selectedTripId"))
		{
			var selectTrip = this.availableTrips.filter(function(trip)
			{
				return trip.id == tf.storageManager.get("routing-selectedTripId");
			});
			if (selectTrip.length > 0) return selectTrip[0];
		}
		return this.availableTrips[0];
	};

	RoutingFieldTripStopEditModal.prototype.getWalkoutData = function()
	{
		var data = {};
		data.walkoutBuffer = tf.storageManager.get("routing-walkoutBuffer");
		data.walkoutDistance = tf.storageManager.get("routing-walkoutDistance");
		data.distanceUnit = tf.storageManager.get("routing-distanceUnit");
		data.bufferUnit = tf.storageManager.get("routing-bufferUnit");
		return data;
	};

	RoutingFieldTripStopEditModal.prototype.saveWalkoutData = function(data)
	{
		tf.storageManager.save("routing-walkoutBuffer", data.walkoutBuffer);
		tf.storageManager.save("routing-walkoutDistance", data.walkoutDistance);
		tf.storageManager.save("routing-distanceUnit", data.distanceUnit);
		tf.storageManager.save("routing-bufferUnit", data.bufferUnit);
		tf.storageManager.save("routing-selectedTripId", this.obSelectedTrip().id);
	};

	RoutingFieldTripStopEditModal.prototype.tripSelectTemplate = function(tripName)
	{

		var trip = Enumerable.From(this.availableTrips).FirstOrDefault({}, function(c) { return c.Name == tripName; });
		return "<a href=\"#\" role=\"option\" style=\"line-height: 22px\"><div style=\"float: left; width: 10px; height: 22px; background: " + trip.color + "; margin-right: 10px\"></div>" + tripName + "</a>";
	};

	RoutingFieldTripStopEditModal.prototype.initTitle = function(isNew, openType)
	{
		TF.RoutingMap.BaseEditModal.prototype.initTitle.call(this, isNew, "Stop", null, openType);
	};

	RoutingFieldTripStopEditModal.prototype._create = function()
	{
		var self = this;
		self.createdTripBoundary = [];
		var promise;
		if (self.data.length == 1)
		{
			self.obIsMultipleCreate(false);
			promise = self._createStop(self.data[0]);
		} else if (self.data.length > 1)
		{
			self.obIsMultipleCreate(true);
			promise = self._createMultipleStops(self.data);
		}

		return promise && promise.then(function()
		{

			self.resolve(self.createdTripBoundary);
		}).catch(e =>
		{
			self.viewModel.display.arcgisError(e.message);
		});
	};

	RoutingFieldTripStopEditModal.prototype._createStop = function(stop)
	{
		var self = this;
		return self._createOneStop(stop).then(function(tripStop)
		{
			if (!tripStop)
			{
				return Promise.reject();
			}
			if (self.dataModel.getRemoveOverlappingSetting() && tripStop.boundary.BdyType != 0)
			{
				return self.dataModel.fieldTripStopDataModel.viewModel.drawTool.removeOverlapBoundaries([tripStop]);
			}
			return Promise.resolve(tripStop);
		}).then(function(tripStop)
		{
			if (tripStop)
			{
				var sequence = self.insertBehindSpecialStop ? self.insertBehindSpecialStop.Sequence : null;
				if (!sequence)
				{
					sequence = tripStop.Sequence ? tripStop.Sequence - 1 : null;
				}
				if (self.obSelectedSequence() && !self.obSelectedSequenceDisable())
				{
					sequence = parseInt(self.obSelectedSequence() - 1);
				}

				return self.dataModel.fieldTripStopDataModel.create(tripStop, null, sequence);
			}
		}, function() { });
	};

	RoutingFieldTripStopEditModal.prototype._createMultipleStops = function(tripStops)
	{
		var self = this;
		tf.loadingIndicator.show();
		var createTripBoundaryAndAssignPromises = [], promises = [];
		if (self.obIsSmartAssignment())
		{
			if (self.availableTrips.length == 1)
			{
				promises.push(self.vrpTool.getSmartAssignment_multi(tripStops, self.availableTrips, self.obIsSmartSequence(), self.viewModel.drawTool));
			} else
			{
				var canVrp = true;
				var start = self.availableTrips[0].FieldTripStops[0].geometry.x;
				var end = self.availableTrips[0].FieldTripStops[self.availableTrips[0].FieldTripStops.length - 1].geometry.x;
				for (var i = 1; i < self.availableTrips.length; i++)
				{
					if (self.availableTrips[i].FieldTripStops[0].geometry.x.toFixed(4) != start.toFixed(4) ||
						self.availableTrips[i].FieldTripStops[self.availableTrips[i].FieldTripStops.length - 1].geometry.x.toFixed(4) != end.toFixed(4))
					{
						canVrp = false;
						break;
					}
				}
				if (canVrp)
				{
					promises.push(self.vrpTool.getSmartAssignment_multi(tripStops, self.availableTrips, self.obIsSmartSequence(), self.viewModel.drawTool));
				} else
				{
					tripStops.forEach(function(tripStop)
					{
						promises.push(self.viewModel.drawTool.NAtool.getSmartAssignment(tripStop, self.availableTrips));
					});
				}
			}
		} else
		{
			if (self.obIsSmartSequence())
			{
				tripStops.forEach(function(tripStop)
				{
					if (!tripStop.id) tripStop.id = TF.createId(100000);
					//promises.push(self.viewModel.drawTool.NAtool.getSmartAssignment(tripStop, [self.obSelectedTrip()]));
				});
				promises.push(self.vrpTool.getSmartAssignment_multi(tripStops, [self.obSelectedTrip()], self.obIsSmartSequence(), self.viewModel.drawTool));
			} else
			{
				tripStops.forEach(function(stop)
				{
					stop.FieldTripId = self.obSelectedTrip().id;
				});
				promises.push(Promise.resolve(tripStops));
			}
		}
		return Promise.all(promises).then(function(res)
		{
			// if (tripIds)
			// {
			var outTripStops = $.isArray(res[0]) ? res[0] : res;
			if (!outTripStops[0])
			{
				tripStops.forEach(function(tripStop)
				{
					tripStop.FieldTripId = self.obIsSmartAssignment() ? self.availableTrips[0].id : self.obSelectedTrip().id;
					createTripBoundaryAndAssignPromises.push(self._createOneStop(tripStop));
				});
			}
			else
			{
				outTripStops.forEach(function(tripStop)
				{
					// tripStops[index].FieldTripId = tripId;
					createTripBoundaryAndAssignPromises.push(self._createOneStop(tripStop));

				});
			}

			// }
			// else
			// {
			// 	tripStops.map(function(tripStop)
			// 	{
			// 		tripStop.FieldTripId = self.obSelectedTrip().id;
			// 		createTripBoundaryAndAssignPromises.push(self._createOneStop(tripStop));
			// 	});
			// }
			return Promise.all(createTripBoundaryAndAssignPromises)
				.then(function(stops)
				{
					if (self.dataModel.getRemoveOverlappingSetting())
					{
						return self.dataModel.fieldTripStopDataModel.viewModel.drawTool.removeOverlapBoundaries(stops);
					}
					return stops;
				}).then(function(stops)
				{
					if (stops)
					{
						var sequences = [];
						if (self.insertBehindSpecialStop)
						{
							sequences.push(self.insertBehindSpecialStop.Sequence + 1);
						} else
						{
							sequences = stops.filter(function(stop) { return stop.Sequence; }).map(function(stop) { return stop.Sequence; });
						}
						self.dataModel.fieldTripStopDataModel.createMultiple(stops, sequences).then(() =>
						{
							tf.loadingIndicator.tryHide();
						});
					}
					if (res.err) { tf.promiseBootbox.alert(res.err); tf.loadingIndicator.tryHide(); }
				});
		});
	};
	RoutingFieldTripStopEditModal.prototype._createOneStop = function(tripStop)
	{
		var self = this;
		// var travelScenarioId = self.dataModel.trips ? self.dataModel.trips[0].TravelScenarioId : 1;
		// var travelScenario = self.dataModel._viewModal.travelScenariosPaletteViewModel.travelScenariosViewModel.dataModel.getTravelScenariosById(travelScenarioId);
		
		var data = self.trimStringSpace(tripStop);
		var tripStopPromise = Promise.resolve(tripStop);
		data.FieldTripId = tripStop.FieldTripId ? tripStop.FieldTripId : self.obSelectedTrip().id;
		if (!self.obIsMultipleCreate() && !self.obIsInsertToSpecialStop())
		{
			if (self.obIsSmartAssignment())
			{
				tripStopPromise = self.viewModel.drawTool.NAtool.getSmartAssignment(data, self.availableTrips);
				//tripStopPromise = self.vrpTool.getSmartAssignment([data], self.availableTrips, self.obIsSmartSequence(), self.viewModel.drawTool);
			} else
			{
				data.FieldTripId = self.obSelectedTrip().id;
				tripStopPromise = Promise.resolve(data);
			}
		} else if (self.obIsInsertToSpecialStop())
		{
			data.FieldTripId = self.obSelectedTrip().id;
			tripStopPromise = Promise.resolve(data);
		}

		return tripStopPromise.then(function(tripStop)
		{

			if (tripStop == false)
			{
				return false;
			}
			data.FieldTripId = tripStop.FieldTripId;
			// data.boundary = tripBoundary;
			data.color = self.obSelectedTrip().color;
			data.Sequence = tripStop.Sequence;
			return data;
		});
	};

	RoutingFieldTripStopEditModal.prototype.stopCreate = function()
	{
		var self = this;
		self.viewModel.drawTool._clearTempDrawing();
		self.reject();
	};

	RoutingFieldTripStopEditModal.prototype._update = function(data)
	{
		const canNotEditFields = ['LockStopTime', 'Speed', 'DrivingDirections', 'SchoolLocation'];
		var tripStopData = this.dataModel.getFieldTripStop(data[0].id);
		canNotEditFields.forEach(function(field)
		{
			data[0][field] = tripStopData[field];
		});
		var self = this;
		const isSetSmartSequence = !self.obIsSmartAssignment() && self.obIsSmartSequence();
		var sequenceChanged = self.data.length == 1 && (self.obSelectedSequence() != self.original[0].Sequence || isSetSmartSequence);
		var tripChanged = self.data.length == 1 && self.obSelectedTrip().id != self.original[0].FieldTripId;
		if (sequenceChanged || tripChanged)
		{
			// use changeStopPosition to change sequence, so revert it to original here.
			data[0].Sequence = self.original[0].Sequence;
			data[0].FieldTripId = self.original[0].FieldTripId;
		}
		return this.dataModel.fieldTripStopDataModel.update(data).then(async function()
		{
			if (!data[0].SchoolCode && (sequenceChanged || tripChanged || self.obIsSmartAssignment()))
			{
				var tripId = data[0].FieldTripId, targetTripId = self.obSelectedTrip().id;
				var tripStop = self.data[0];
				self.viewModel.display.deleteNode(tripStop, !tripChanged);

				//smart assignment,smart sequence
				let position = self.obSelectedSequence() - 1;
				tf.loadingIndicator.show();
				if (self.obIsSmartAssignment())
				{
					const _tripStop = { ...tripStop };
					const res = await self.viewModel.drawTool.NAtool.getSmartAssignment(_tripStop, self.availableTrips);
					if (res)
					{
						targetTripId = res.FieldTripId;
						position = res.Sequence - 1;
					}

				}
				else if (self.obIsSmartSequence())
				{
					const _tripStop = { ...tripStop };
					if (tripChanged)
					{
						_tripStop.FieldTripId = targetTripId;
					}
					const res = await self.viewModel.drawTool.NAtool.calculateSmartSequence(_tripStop);
					if (res.sequence != null)
					{
						position = res.sequence - 1;
					}
				}

				return self.dataModel.changeStopPosition(tripStop, targetTripId, position).then(function()
				{
					self.viewModel.display.afterChangeStopPosition(tripStop, !tripChanged, tripId);
					tf.loadingIndicator.tryHide()
				});
			}
		});
	};

	RoutingFieldTripStopEditModal.prototype.subscribeDataChange = function(key)
	{
		var self = this;
		return function(value)
		{
			if (self.initing)
			{
				return;
			}
			var data = self.data[self.obCurrentPage()];
			if (key == "StopTime")
			{
				value = moment(value).format("HH:mm:ss");
			}
			data[key] = value;
			if (self.obIsMultipleCreate())
			{
				self.data.forEach(function(d)
				{
					if (key == "StopTime" || key == "vehicleCurbApproach")
					{
						d[key] = value;
					}
				});
			}
		};
	};

	RoutingFieldTripStopEditModal.prototype.stopTimeArriveChange = function()
	{
		this.obStopTimeArriveDate(getDatePart(this.obDataModel.StopTimeArrive(), true));
		this.obStopTimeArriveTime(getTimePart(this.obDataModel.StopTimeArrive(), true));
		this.obStopTimeArriveDisplay(getDateTime(this.obStopTimeArriveDate(), this.obStopTimeArriveTime(), true) || "");
		this.obStopTimeArriveDisable(this.isReadOnly() || this.obDataModel.PrimaryDeparture());
	};

	RoutingFieldTripStopEditModal.prototype.obStopTimeArriveDateChange = function()
	{
		const value = getDateTime(this.obStopTimeArriveDate(), this.obStopTimeArriveTime(), true);
		if (value)
		{
			this.obDataModel.StopTimeArrive(value);
		}
		this.obStopTimeArriveDisplay(getDateTime(this.obStopTimeArriveDate(), this.obStopTimeArriveTime(), true) || "");
	};

	RoutingFieldTripStopEditModal.prototype.obStopTimeArriveTimeChange = function()
	{
		const value = getDateTime(this.obStopTimeArriveDate(), this.obStopTimeArriveTime(), true);
		if (value)
		{
			this.obDataModel.StopTimeArrive(value);
		}
		this.obStopTimeArriveDisplay(getDateTime(this.obStopTimeArriveDate(), this.obStopTimeArriveTime(), true) || "");
	};

	RoutingFieldTripStopEditModal.prototype.stopTimeDepartChange = function()
	{
		this.obStopTimeDepartDate(getDatePart(this.obDataModel.StopTimeDepart(), true));
		this.obStopTimeDepartTime(getTimePart(this.obDataModel.StopTimeDepart(), true));
		this.obStopTimeDepartDisplay(getDateTime(this.obStopTimeDepartDate(), this.obStopTimeDepartTime(), true) || "");
		this.obStopTimeDepartDisable(this.isReadOnly() || this.obDataModel.PrimaryDestination());
	};

	RoutingFieldTripStopEditModal.prototype.obStopTimeDepartDateChange = function()
	{
		const value = getDateTime(this.obStopTimeDepartDate(), this.obStopTimeDepartTime(), true);
		if (value)
		{
			this.obDataModel.StopTimeDepart(value);
		}
		this.obStopTimeDepartDisplay(getDateTime(this.obStopTimeDepartDate(), this.obStopTimeDepartTime(), true) || "");
	};

	RoutingFieldTripStopEditModal.prototype.obStopTimeDepartTimeChange = function()
	{
		const value = getDateTime(this.obStopTimeDepartDate(), this.obStopTimeDepartTime(), true);
		if (value)
		{
			this.obDataModel.StopTimeDepart(value);
		}
		this.obStopTimeDepartDisplay(getDateTime(this.obStopTimeDepartDate(), this.obStopTimeDepartTime(), true) || "");
	};

	RoutingFieldTripStopEditModal.prototype.hide = function()
	{
		TF.RoutingMap.RoutingPalette.BaseFieldTripStopEditModal.prototype.hide.call(this);
		this.removeStopSequenceGraphics();
	};

	function getDatePart(value, isUtc)
	{
		if (!value)
		{
			return null;
		}

		const dt = isUtc ? utcToClientTimeZone(value) : moment(value);
		return dt.format("MM/DD/YYYY");
	}

	function getTimePart(value, isUtc)
	{
		if (!value)
		{
			return null;
		}

		const dt = isUtc ? utcToClientTimeZone(value) : moment(value);
		return dt.format("hh:mm A");
	}

	function getDateTime(datePart, timePart, isUtc)
	{
		if (!datePart || !timePart)
		{
			return null;
		}

		const tDateIndex = datePart.indexOf("T");
		if (tDateIndex > -1)
		{
			datePart = datePart.substring(0, tDateIndex);
		}

		const tTimeIndex = timePart.indexOf("T")
		if (tTimeIndex > -1)
		{
			timePart = timePart.substring(tTimeIndex + 1);
		}

		const dtDate = moment(`${datePart} ${timePart}`);
		if (!dtDate.isValid())
		{
			return null;
		}

		let dtString = dtDate.format("YYYY-MM-DDTHH:mm:ss");
		if (isUtc)
		{
			const dt = clientTimeZoneToUtc(dtString);
			if (!dt.isValid)
			{
				return null;
			}
			dtString = dt.format("YYYY-MM-DDTHH:mm:ss");
		}

		return dtString;
	}

})();
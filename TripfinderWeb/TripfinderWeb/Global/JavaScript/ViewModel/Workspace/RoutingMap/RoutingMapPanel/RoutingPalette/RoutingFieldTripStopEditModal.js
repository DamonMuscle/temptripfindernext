(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingFieldTripStopEditModal = RoutingFieldTripStopEditModal;

	const INIT_SEQUENCE_VALUE = -1;

	function RoutingFieldTripStopEditModal(fieldTripPaletteSectionVM)
	{
		TF.RoutingMap.RoutingPalette.BaseFieldTripStopEditModal.call(this, fieldTripPaletteSectionVM, "workspace/RoutingMap/RoutingMapPanel/RoutingPalette/EditRoutingFieldTripStop");

		this.viewModel = fieldTripPaletteSectionVM;
		this.dataModel = fieldTripPaletteSectionVM.dataModel;
		this.availableTrips = [];
		this.obDataModel = this.createObservableDataModel(this.dataModel.fieldTripStopDataModel.getDataModel());

		this.obIsSmartAssignment = ko.observable(false);
		this.obIsSmartSequence = ko.observable(false);
		this.obIsSmartAssignment.subscribe(isSmartAssignment => isSmartAssignment && this.obIsSmartSequence(true));

		// trips selector
		this.obTrips = ko.observableArray([]);
		this.obSelectedTrip = ko.observable({});
		this.tripSelectTemplate = this.tripSelectTemplate.bind(this);
		this.tripDisplayText = this.tripDisplayText.bind(this);
		this.tripFormatText = this.tripFormatText.bind(this);
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
		this.obSelectedSequence(INIT_SEQUENCE_VALUE);
		this.obSelectedSequenceText = ko.computed(() =>
		{
			return this.obSelectedSequence();
		});

		this.obIsFirstStop = ko.observable(false);
		this.obIsLastStop = ko.observable(false);
		// this.obSelectedSequenceDisable = ko.computed(() => (this.obIsSmartSequence() && (this.mode() == "new" || this.mode() === 'edit')) || this.isReadOnly());
		this.obSelectedSequenceDisable = ko.computed(() => this.obIsFirstStop() || this.obIsLastStop() || this.isReadOnly());
		this.obSelectedFieldTripDisable = ko.computed(() => this.obIsFirstStop() || this.obIsLastStop());

		// disable for future implementation
		this.obSmartAssignmentDisable = ko.observable(true);
		this.obSmartSequenceDisable = ko.observable(true);
		this.obCornerStopVisible = ko.observable(false);

		this.initSequenceSubscribe();

		this.momentHelper = new TF.Document.MomentHelper();

		this.obStopPauseMinutes = ko.observable();
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
		self.isInitialModal = true;
		this.availableTrips = self.dataModel.getEditTrips();
		this.availableTrips.sort((a, b) =>
		{
			const v1 = a.Name && a.Name.toLowerCase();
			const v2 = b.Name && b.Name.toLowerCase();
			if(v1 === v2)
			{
				return a.id > b.id ? 1: -1;
			}
			return v1 > v2 ? 1 : -1;
		});
		this.obTrips(self.availableTrips);
		this.obSelectedSequence(INIT_SEQUENCE_VALUE);
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
			self.bindTag = true;
		}
		self.isInitialModal = false;
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

		const sortedSequences = this._calculateSortedSequence(trip);
		this._initSequenceSource(sortedSequences);

		let selectedSequence = this.obSelectedSequence();
		if (selectedSequence === INIT_SEQUENCE_VALUE ||
			selectedSequence >= _.last(sortedSequences))
		{
			this._setSequenceNumber(sortedSequences);
			selectedSequence = this.obSelectedSequence();
		}
		else
		{
			// trigger update stop graphic when switch trips.
			this.obSelectedSequence(selectedSequence);
		}

		this.obIsFirstStop(selectedSequence==_.first(sortedSequences));
		this.obIsLastStop(selectedSequence==_.last(sortedSequences));
	};

	/**
	 * update the sequence number on trip stop graphic
	 */
	RoutingFieldTripStopEditModal.prototype.updateStopGraphicSequence = function()
	{
		if (this.obSelectedSequence() === INIT_SEQUENCE_VALUE)
		{
			return;
		}

		// update stop point sequence when user manually set stop sequence
		var stopSequence = 0;
		if (this.data.length == 1 && !this.obIsMultipleCreate())
		{
			stopSequence = this.obSelectedSequence();
			this.highlightStopSequencePathAndPoint(stopSequence);

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
	RoutingFieldTripStopEditModal.prototype.highlightStopSequencePathAndPoint = function(assignSequence)
	{
		const currentTrip = this.obSelectedTrip();
		const currentStop = this.data[0];
		const fromFieldTripId =  currentStop.FieldTripId || currentTrip.id;
		const data = { FromTripId: fromFieldTripId, ToTripId: currentTrip.id, StopId: currentStop.id, AssignSequence: +assignSequence };
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
		let trip;
		const leftIndex = tripName.lastIndexOf("("), rightIndex = tripName.lastIndexOf(")");
		if (leftIndex === -1 || rightIndex === -1)
		{
			trip = this.availableTrips.find((t) => t.Name === tripName);
		}
		else
		{
			const tripId = +tripName.substring(leftIndex + 1, rightIndex);
			tripName = tripName.substring(0, leftIndex);
			trip = this.availableTrips.find((t) => t.id === tripId );
		}

		const tripColor = trip? trip.color : "transparent";
		if (trip)
		{
			tripName = trip.Name;
		}
		return "<a href=\"#\" role=\"option\" style=\"line-height: 22px\"><div style=\"float: left; width: 10px; height: 22px; background: " + tripColor + "; margin-right: 10px\"></div>" + tripName + "</a>";
	};

	RoutingFieldTripStopEditModal.prototype.tripDisplayText = function(tripName)
	{
		const leftIndex = tripName.lastIndexOf("("), rightIndex = tripName.lastIndexOf(")");
		if (leftIndex !== -1 && rightIndex !== -1)
		{
			tripName = tripName.substring(0, leftIndex);
		}
		return tripName;
	};

	RoutingFieldTripStopEditModal.prototype.tripFormatText = function(trip)
	{
		return trip ? `${trip.Name}(${trip.id})` : "";
	};

	RoutingFieldTripStopEditModal.prototype.initTitle = function(isNew, openType)
	{
		TF.RoutingMap.BaseEditModal.prototype.initTitle.call(this, isNew, "Stop", null, openType);
	};

	RoutingFieldTripStopEditModal.prototype._create = function()
	{
		const self = this;
		let promise;
		if (self.data.length == 1)
		{
			self.obIsMultipleCreate(false);
			promise = self._createStop(self.data[0]);
		}
		else if (self.data.length > 1)
		{
			self.obIsMultipleCreate(true);
			promise = self._createMultipleStops(self.data);
		}

		return Promise.resolve(promise).then(function()
		{
			self.resolve();
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

			return tripStop;
		}).then(function(tripStop)
		{
			if (tripStop)
			{
				var sequence = self.insertBehindSpecialStop ? self.insertBehindSpecialStop.Sequence : null;
				let sequenceIndex = null;
				if (!sequence)
				{
					sequenceIndex = tripStop.Sequence ? tripStop.Sequence - 1 : null;
				}
				if (self.obSelectedSequence() && !self.obSelectedSequenceDisable())
				{
					sequenceIndex = parseInt(self.obSelectedSequence() - 1);
				}

				return self.dataModel.fieldTripStopDataModel.create(tripStop, null, sequenceIndex, self.obIsSearchCreate());
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
			// support smart assignment
		}
		else
		{
			if (self.obIsSmartSequence())
			{
				// support smart sequence
			}
			else
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
					createTripBoundaryAndAssignPromises.push(self._createOneStop(tripStop));
				});
			}

			return Promise.all(createTripBoundaryAndAssignPromises).then(function(stops)
			{
				if (stops)
				{
					stops.forEach(stop => {
						stop.StopPauseMinutes = self.obStopPauseMinutes() || 0;
					});
					self.dataModel.fieldTripStopDataModel.createMultiple(stops).then(() =>
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
		data.DBID = self.obSelectedTrip().DBID;
		if (!self.obIsMultipleCreate() && !self.obIsInsertToSpecialStop())
		{
			if (self.obIsSmartAssignment())
			{
				// tripStopPromise = self.viewModel.drawTool.NAtool.getSmartAssignment(data, self.availableTrips);
				// tripStopPromise = self.vrpTool.getSmartAssignment([data], self.availableTrips, self.obIsSmartSequence(), self.viewModel.drawTool);
			}
			else
			{
				data.FieldTripId = self.obSelectedTrip().id;
				tripStopPromise = Promise.resolve(data);
			}
		}
		else if (self.obIsInsertToSpecialStop())
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
		const sequenceChanged = self.data.length == 1 && (self.obSelectedSequence() != self.original[0].Sequence || isSetSmartSequence);
		const tripChanged = self.data.length == 1 && self.obSelectedTrip().id != self.original[0].FieldTripId;
		const curbApproachChanged = self.data.length === 1 && self.data[0].vehicleCurbApproach !== self.original[0].vehicleCurbApproach;
		const callZoomToLayers = sequenceChanged || tripChanged;
		if (sequenceChanged || tripChanged || curbApproachChanged)
		{
			// use changeStopPosition to change sequence, so revert it to original here.
			data[0].Sequence = self.original[0].Sequence;
			data[0].FieldTripId = self.original[0].FieldTripId;
			data[0].DBID = self.obSelectedTrip().DBID;
			data[0].VehicleCurbApproach = self.original[0].VehicleCurbApproach;
		}

		if (tripChanged && data[0].LockStopTime === true)
		{
			data[0].LockStopTime = false;
		}

		return this.dataModel.fieldTripStopDataModel.update(data).then(async function()
		{
			if (!data[0].SchoolCode && (sequenceChanged || tripChanged || curbApproachChanged || self.obIsSmartAssignment()))
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

				return self.dataModel.changeStopPosition(tripStop, targetTripId, position, callZoomToLayers).then(function()
				{
					self.viewModel.display.afterChangeStopPosition(tripStop, !tripChanged, tripId);
					if (callZoomToLayers)
					{
						PubSub.publish(TF.RoutingPalette.FieldTripMapEventEnum.ZoomToLayers, self.dataModel.trips);
					}
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
		this.obStopTimeArriveDate(this.momentHelper.getDatePart(this.obDataModel.StopTimeArrive(), true));
		this.obStopTimeArriveTime(this.momentHelper.getTimePart(this.obDataModel.StopTimeArrive(), true));
		this.obStopTimeArriveDisplay(this.momentHelper.getDateTime(this.obStopTimeArriveDate(), this.obStopTimeArriveTime(), true) || "");
		this.obStopTimeArriveDisable(this.isReadOnly() || this.obDataModel.PrimaryDeparture());
	};

	RoutingFieldTripStopEditModal.prototype.obStopTimeArriveDateChange = function()
	{
		const value = this.momentHelper.getDateTime(this.obStopTimeArriveDate(), this.obStopTimeArriveTime(), true);
		if (value)
		{
			this.obDataModel.StopTimeArrive(value);
		}
		this.obStopTimeArriveDisplay(this.momentHelper.getDateTime(this.obStopTimeArriveDate(), this.obStopTimeArriveTime(), true) || "");
	};

	RoutingFieldTripStopEditModal.prototype.obStopTimeArriveTimeChange = function()
	{
		const value = this.momentHelper.getDateTime(this.obStopTimeArriveDate(), this.obStopTimeArriveTime(), true);
		if (value)
		{
			this.obDataModel.StopTimeArrive(value);
		}
		this.obStopTimeArriveDisplay(this.momentHelper.getDateTime(this.obStopTimeArriveDate(), this.obStopTimeArriveTime(), true) || "");
	};

	RoutingFieldTripStopEditModal.prototype.stopTimeDepartChange = function()
	{
		this.obStopTimeDepartDate(this.momentHelper.getDatePart(this.obDataModel.StopTimeDepart(), true));
		this.obStopTimeDepartTime(this.momentHelper.getTimePart(this.obDataModel.StopTimeDepart(), true));
		this.obStopTimeDepartDisplay(this.momentHelper.getDateTime(this.obStopTimeDepartDate(), this.obStopTimeDepartTime(), true) || "");
		this.obStopTimeDepartDisable(this.isReadOnly() || this.obDataModel.PrimaryDestination());
	};

	RoutingFieldTripStopEditModal.prototype.obStopTimeDepartDateChange = function()
	{
		const value = this.momentHelper.getDateTime(this.obStopTimeDepartDate(), this.obStopTimeDepartTime(), true);
		if (value)
		{
			this.obDataModel.StopTimeDepart(value);
		}
		this.obStopTimeDepartDisplay(this.momentHelper.getDateTime(this.obStopTimeDepartDate(), this.obStopTimeDepartTime(), true) || "");
	};

	RoutingFieldTripStopEditModal.prototype.obStopTimeDepartTimeChange = function()
	{
		const value = this.momentHelper.getDateTime(this.obStopTimeDepartDate(), this.obStopTimeDepartTime(), true);
		if (value)
		{
			this.obDataModel.StopTimeDepart(value);
		}
		this.obStopTimeDepartDisplay(this.momentHelper.getDateTime(this.obStopTimeDepartDate(), this.obStopTimeDepartTime(), true) || "");
	};

	RoutingFieldTripStopEditModal.prototype.hide = function()
	{
		TF.RoutingMap.RoutingPalette.BaseFieldTripStopEditModal.prototype.hide.call(this);
		this.removeStopSequenceGraphics();
		this.obIsMultipleCreate(false);
	};

	RoutingFieldTripStopEditModal.prototype._calculateSortedSequence = function(trip)
	{
		var sequences = trip.FieldTripStops.map(x => x.Sequence);
		var tripChanged = this.data.length == 1 && this.obSelectedTrip().id != this.original[0].FieldTripId;
		if (this.mode() === 'new' || tripChanged)
		{
			sequences.push(sequences[sequences.length - 1] + 1);
		}
		sequences.sort((a,b) => a-b);

		return sequences;
	}

	RoutingFieldTripStopEditModal.prototype._initSequenceSource = function(sortedSequences)
	{
		const source = sortedSequences.map((x, index, array) =>
		{
			if(index === 0 || _.last(array) === x)
			{
				return `[disable]${x}`
			}
			return `${x}`;
		});

		this.obSequenceSource(source);		
	}

	RoutingFieldTripStopEditModal.prototype._setSequenceNumber = function(sortedSequences)
	{
		const lastSequence = _.last(sortedSequences),
			defaultSequence = lastSequence - 1,
			dataSequence = this.data[0].Sequence,
			disableLastStopSequence = this.isInitialModal ? (dataSequence && dataSequence <= lastSequence) : (dataSequence && dataSequence < lastSequence),
			sequence = disableLastStopSequence ? dataSequence : defaultSequence;

		this.obSelectedSequence(sequence);
	}
})();
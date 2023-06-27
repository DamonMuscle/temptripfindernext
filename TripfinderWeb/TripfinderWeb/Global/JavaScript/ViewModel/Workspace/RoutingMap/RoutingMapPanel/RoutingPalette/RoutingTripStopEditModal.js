(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingTripStopEditModal = RoutingTripStopEditModal;
	var TripStopHelper = TF.Helper.TripStopHelper;

	function RoutingTripStopEditModal(viewModel)
	{
		TF.RoutingMap.RoutingPalette.BaseTripStopEditModal.call(this, viewModel, "workspace/Routing Map/RoutingMapPanel/RoutingPalette/EditRoutingTripStop");

		this.viewModel = viewModel;
		this.dataModel = viewModel.dataModel;
		this.availableTrips = [];
		this.obDataModel = this.createObservableDataModel(this.dataModel.tripStopDataModel.getDataModel());

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

		// total stop time
		this.obRedAlertTotalStopTimeControl = ko.observable(false);
		this.obTotalStopTimeShow = ko.observable("00:00");
		this.obTotalStopTimeShow.subscribe(this.obTotalStopTimeShowChange, this);
		this.obDataModel.TotalStopTime.subscribe(this.totalStopTimeChange, this);
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
		this.obSelectedSequenceDisable = ko.computed(() => (this.obIsSmartSequence() && (this.mode() == "new" || this.mode() === 'edit')) || this.isReadOnly());
		this.initSequenceSubscribe();
	}

	RoutingTripStopEditModal.prototype = Object.create(TF.RoutingMap.RoutingPalette.BaseTripStopEditModal.prototype);
	RoutingTripStopEditModal.prototype.constructor = RoutingTripStopEditModal;

	RoutingTripStopEditModal.prototype.getWalkoutBufferVisible = function()
	{
		return this.isNoWalkoutType() && !this.isCopied() && this.mode() == 'new' && this.walkoutType() == 0 && this.obSelectedStopType() == 'Walkout';
	};

	RoutingTripStopEditModal.prototype.init = function(options)
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
		return TF.RoutingMap.RoutingPalette.BaseTripStopEditModal.prototype.init.call(self, options).then(function()
		{
			return self.calculateTotalStopTime(options);
		}).then(function()
		{
			self.data.forEach((record) =>
			{
				record.StopTime = convertToMoment(record.StopTime).format("HH:mm:00");
			});
			// calculate total stop time will change stop time ,so reset original data for check change
			self.normalizeData(self.data);
		});
	};

	RoutingTripStopEditModal.prototype.initSequenceSubscribe = function()
	{
		this.obSelectedTrip.subscribe(this.initStopSequenceSelector.bind(this));
		this.updateStopGraphicSequence = this.updateStopGraphicSequence.bind(this);
		this.obIsSmartSequence.subscribe(this.updateStopGraphicSequence);
		this.obSelectedSequence.subscribe(this.updateStopGraphicSequence);
		this.obSelectedTrip.extend({ notify: 'always' });
		this.obIsSmartSequence.extend({ notify: 'always' });
		this.obSelectedSequence.extend({ notify: 'always' });
	};

	RoutingTripStopEditModal.prototype.initStopSequenceSelector = function()
	{
		var trip = this.obSelectedTrip();
		if (!trip || this.obIsMultipleCreate())
		{
			return;
		}
		// init sequence source
		var sequences = [];
		trip.TripStops.forEach(x =>
		{
			sequences.push(x.Sequence);
		});
		var tripChanged = this.data.length == 1 && this.obSelectedTrip().id != this.original[0].TripId;
		if (this.mode() === 'new' || tripChanged)
		{
			sequences.push(sequences[sequences.length - 1] + 1);
		}
		this.obSequenceSource(sequences);
		// set sequence number
		var defaultSequence = TF.Helper.TripHelper.getTripStopInsertSequence(trip.TripStops, trip.Session);
		var sequence = this.data[0].Sequence ? this.data[0].Sequence : defaultSequence;
		this.obSelectedSequence(sequence);
	};

	/**
	 * update the sequence number on trip stop graphic
	 */
	RoutingTripStopEditModal.prototype.updateStopGraphicSequence = function()
	{
		// update stop point sequence when user manually set stop sequence
		var stopSequence = 0;
		this.removeStopSequenceGraphics();
		if (this.data.length == 1 && !this.obIsMultipleCreate())
		{
			if (!this.obSelectedSequenceDisable())
			{
				stopSequence = this.obSelectedSequence();
				this.highlightStopSequencePathAndPoint(stopSequence);
			}
			var symbol = new TF.Map.Symbol();
			var stopGraphic = this.data[0].graphic;
			var layer = this.viewModel.drawTool._pointLayer;
			var stopSequenceGraphic = {};
			if (!this.data[0].SchoolCode)
			{
				if (!stopGraphic || (this.mode() != "new" && !this.obIsSmartSequence()))
				{
					stopGraphic = new tf.map.ArcGIS.Graphic({
						symbol: symbol.tripStop("0", "#FFFFFF"),
						geometry: this.data[0].geometry,
					});
					this.data[0].graphic = stopGraphic;
				}

				if (!stopGraphic.layer)
				{
					layer.add(stopGraphic);
					stopSequenceGraphic = { layer: layer, graphic: layer.graphics.items[layer.graphics.items.length - 1] };
				}

				this.stopSequenceGraphics.push(stopSequenceGraphic);
				stopGraphic.symbol = symbol.tripStop(stopSequence, "#FFFFFF");
			}

			// update sequence for check data changed when cancel click
			if (this.mode() != "new" && !this.obIsSmartSequence())
			{
				if (stopSequence)
				{
					this.data[0].Sequence = stopSequence;
				} else
				{
					this.data[0].Sequence = this.original[0].Sequence;
				}
			}
		}
	};

	/**
	 * highlight current stop to previous and after
	 */
	RoutingTripStopEditModal.prototype.highlightStopSequencePathAndPoint = function(stopSequence)
	{
		var trip = this.obSelectedTrip(),
			beforeStop,
			afterStop,
			currentStop = this.data[0],
			tripStops = trip.TripStops.filter(x => x.id != currentStop.id),
			pathPoints = [],
			stopGraphics = [],
			color = [253, 245, 53, 0.7],
			symbolHelper = new TF.Map.Symbol();
		if (stopSequence > 1)
		{
			beforeStop = tripStops[stopSequence - 2];
		}
		if (stopSequence <= tripStops.length)
		{
			afterStop = tripStops[stopSequence - 1];
		}
		[beforeStop, currentStop, afterStop].filter(x => x).forEach(stop =>
		{
			var stopGeometry = stop.geometry;
			if (stop.SchoolLocation)
			{
				stopGeometry = TF.xyToGeometry(stop.SchoolLocation.Xcoord, stop.SchoolLocation.Ycoord);
			}
			// create path highlight
			pathPoints.push([stopGeometry.x, stopGeometry.y]);
			// create stop highlight
			stopGraphics.push(new tf.map.ArcGIS.Graphic({
				symbol: this.createStopHighlightSymbol(stop, symbolHelper, color),
				geometry: stopGeometry
			}));
		});

		var graphic = this.viewModel.drawTool.createPathGraphic([pathPoints], trip);
		var graphicHighlight = graphic.clone(), symbol = graphicHighlight.symbol.clone();
		symbol.width = graphicHighlight.symbol.width + 4;
		symbol.color = color;
		graphicHighlight.symbol = symbol;
		var layer = this.viewModel.drawTool._studentLayer;
		layer.addMany(stopGraphics.concat([graphicHighlight, graphic]));
		this.stopSequenceGraphics.push({ layer: layer, graphic: graphicHighlight });
		stopGraphics.forEach(x => this.stopSequenceGraphics.push({ layer: layer, graphic: x }));
		this.stopSequenceGraphics.push({ layer: layer, graphic: graphic });
	};

	RoutingTripStopEditModal.prototype.createStopHighlightSymbol = function(stop, symbolHelper, color)
	{
		var symbol = {
			type: "simple-marker",
			color: color,
			size: 32,
			outline: null
		};
		if (stop.SchoolCode)
		{
			if (stop.SchoolLocation)
			{
				symbol = symbolHelper.schoolLocation(color, color, new tf.map.ArcGIS.SimpleLineSymbol({ width: 6, color: color }));
			} else
			{
				symbol = symbolHelper.school(null, 0, null, new tf.map.ArcGIS.SimpleLineSymbol({ width: 4, color: color }));
			}
		}
		return symbol;
	};

	RoutingTripStopEditModal.prototype.removeStopSequenceGraphics = function()
	{
		if (this.stopSequenceGraphics.length > 0)
		{
			this.stopSequenceGraphics.forEach(item =>
			{
				item.layer && item.layer.remove(item.graphic);
			});
			this.stopSequenceGraphics = [];
		}
	};

	RoutingTripStopEditModal.prototype.initWalkoutData = function()
	{
		var self = this;
		var d = self.getWalkoutData();
		if (d.walkoutBuffer) self.walkoutBuffer(d.walkoutBuffer);
		if (d.walkoutDistance) self.walkoutDistance(d.walkoutDistance);
		if (d.distanceUnit) self.obSelectedDistanceUnit(d.distanceUnit);
		if (d.bufferUnit) self.obSelectedBufferUnit(d.bufferUnit);
	};

	RoutingTripStopEditModal.prototype.onTripStopsChangeEvent = function(e, items)
	{
		var self = this;
		if (items.delete.length > 0 && Enumerable.From(items.delete).Any(function(c) { return c.id == self.obDataModel.id(); }))
		{
			self.closeEditModal();
		}
	};

	RoutingTripStopEditModal.prototype.getDataModel = function()
	{
		return this.dataModel.tripStopDataModel.getDataModel();
	};

	RoutingTripStopEditModal.prototype.getAllHighlight = function()
	{
		return [];
	};

	RoutingTripStopEditModal.prototype.getSelectedTrip = function()
	{
		if (this.mode() != "new" && this.data.length > 0)
		{
			return this.dataModel.getTripById(this.data[0].TripId);
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

	RoutingTripStopEditModal.prototype.getWalkoutData = function()
	{
		var data = {};
		data.walkoutBuffer = tf.storageManager.get("routing-walkoutBuffer");
		data.walkoutDistance = tf.storageManager.get("routing-walkoutDistance");
		data.distanceUnit = tf.storageManager.get("routing-distanceUnit");
		data.bufferUnit = tf.storageManager.get("routing-bufferUnit");
		return data;
	};

	RoutingTripStopEditModal.prototype.saveWalkoutData = function(data)
	{
		tf.storageManager.save("routing-walkoutBuffer", data.walkoutBuffer);
		tf.storageManager.save("routing-walkoutDistance", data.walkoutDistance);
		tf.storageManager.save("routing-distanceUnit", data.distanceUnit);
		tf.storageManager.save("routing-bufferUnit", data.bufferUnit);
		tf.storageManager.save("routing-selectedTripId", this.obSelectedTrip().id);
	};

	RoutingTripStopEditModal.prototype.tripSelectTemplate = function(tripName)
	{

		var trip = Enumerable.From(this.availableTrips).FirstOrDefault({}, function(c) { return c.Name == tripName; });
		return "<a href=\"#\" role=\"option\" style=\"line-height: 22px\"><div style=\"float: left; width: 10px; height: 22px; background: " + trip.color + "; margin-right: 10px\"></div>" + tripName + "</a>";
	};

	RoutingTripStopEditModal.prototype.initTitle = function(isNew, openType)
	{
		TF.RoutingMap.BaseEditModal.prototype.initTitle.call(this, isNew, "Stop", null, openType);
	};

	RoutingTripStopEditModal.prototype._create = function()
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

	RoutingTripStopEditModal.prototype._createStop = function(stop)
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
				return self.dataModel.tripStopDataModel.viewModel.drawTool.removeOverlapBoundaries([tripStop]);
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

				return self.dataModel.tripStopDataModel.create(tripStop, null, sequence);
			}
		}, function() { });
	};

	RoutingTripStopEditModal.prototype._createMultipleStops = function(tripStops)
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
				var start = self.availableTrips[0].TripStops[0].geometry.x;
				var end = self.availableTrips[0].TripStops[self.availableTrips[0].TripStops.length - 1].geometry.x;
				for (var i = 1; i < self.availableTrips.length; i++)
				{
					if (self.availableTrips[i].TripStops[0].geometry.x.toFixed(4) != start.toFixed(4) ||
						self.availableTrips[i].TripStops[self.availableTrips[i].TripStops.length - 1].geometry.x.toFixed(4) != end.toFixed(4))
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
					stop.TripId = self.obSelectedTrip().id;
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
					tripStop.TripId = self.obIsSmartAssignment() ? self.availableTrips[0].id : self.obSelectedTrip().id;
					createTripBoundaryAndAssignPromises.push(self._createOneStop(tripStop));
				});
			}
			else
			{
				outTripStops.forEach(function(tripStop)
				{
					// tripStops[index].TripId = tripId;
					createTripBoundaryAndAssignPromises.push(self._createOneStop(tripStop));

				});
			}

			// }
			// else
			// {
			// 	tripStops.map(function(tripStop)
			// 	{
			// 		tripStop.TripId = self.obSelectedTrip().id;
			// 		createTripBoundaryAndAssignPromises.push(self._createOneStop(tripStop));
			// 	});
			// }
			return Promise.all(createTripBoundaryAndAssignPromises)
				.then(function(stops)
				{
					if (self.dataModel.getRemoveOverlappingSetting())
					{
						return self.dataModel.tripStopDataModel.viewModel.drawTool.removeOverlapBoundaries(stops);
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
						self.dataModel.tripStopDataModel.createMultiple(stops, sequences).then(() =>
						{
							tf.loadingIndicator.tryHide();
						});
					}
					if (res.err) { tf.promiseBootbox.alert(res.err); tf.loadingIndicator.tryHide(); }
				});
		});
	};
	RoutingTripStopEditModal.prototype._createOneStop = function(tripStop)
	{
		var self = this;
		var travelScenarioId = self.dataModel.trips ? self.dataModel.trips[0].TravelScenarioId : 1;
		var travelScenario = self.dataModel._viewModal.travelScenariosPaletteViewModel.travelScenariosViewModel.dataModel.getTravelScenariosById(travelScenarioId);
		return self.createTripBoundary(self.studentSelectionCreate() && tripStop.unassignStudent ? "Door-to-Door" : (self.isCopied() ? "" : self.obSelectedStopType()), tripStop, travelScenario)
			.then(function(tripBoundary)
			{
				self.createdTripBoundary.push(tripBoundary);
				if (!tripBoundary)
				{
					return;
				}
				var data = self.trimStringSpace(tripStop);
				var tripStopPromise = Promise.resolve(tripStop);
				data.TripId = tripStop.TripId ? tripStop.TripId : self.obSelectedTrip().id;
				if (!self.obIsMultipleCreate() && !self.obIsInsertToSpecialStop())
				{
					if (self.obIsSmartAssignment())
					{
						tripStopPromise = self.viewModel.drawTool.NAtool.getSmartAssignment(data, self.availableTrips);
						//tripStopPromise = self.vrpTool.getSmartAssignment([data], self.availableTrips, self.obIsSmartSequence(), self.viewModel.drawTool);
					} else
					{
						data.TripId = self.obSelectedTrip().id;
						tripStopPromise = Promise.resolve(data);
					}
				} else if (self.obIsInsertToSpecialStop())
				{
					data.TripId = self.obSelectedTrip().id;
					tripStopPromise = Promise.resolve(data);
				}

				return tripStopPromise.then(function(tripStop)
				{

					if (tripStop == false)
					{
						return false;
					}
					data.TripId = tripStop.TripId;
					data.boundary = tripBoundary;
					data.color = self.obSelectedTrip().color;
					data.Sequence = tripStop.Sequence;
					return data;
				});

			}).catch(function()
			{
				self.reject();
			});
	};

	RoutingTripStopEditModal.prototype.stopCreate = function()
	{
		var self = this;
		self.viewModel.drawTool._clearTempDrawing();
		self.reject();
	};

	RoutingTripStopEditModal.prototype._update = function(data)
	{
		const canNotEditFields = ['LockStopTime', 'Speed', 'DrivingDirections', 'SchoolLocation'];
		var tripStopData = this.dataModel.getTripStop(data[0].id);
		canNotEditFields.forEach(function(field)
		{
			data[0][field] = tripStopData[field];
		});
		var self = this;
		const isSetSmartSequence = !self.obIsSmartAssignment() && self.obIsSmartSequence();
		var sequenceChanged = self.data.length == 1 && (self.obSelectedSequence() != self.original[0].Sequence || isSetSmartSequence);
		var tripChanged = self.data.length == 1 && self.obSelectedTrip().id != self.original[0].TripId;
		if (sequenceChanged || tripChanged)
		{
			// use changeStopPosition to change sequence, so revert it to original here.
			data[0].Sequence = self.original[0].Sequence;
			data[0].TripId = self.original[0].TripId;
		}
		return this.dataModel.tripStopDataModel.update(data).then(async function()
		{
			if (!data[0].SchoolCode && (sequenceChanged || tripChanged || self.obIsSmartAssignment()))
			{
				var tripId = data[0].TripId, targetTripId = self.obSelectedTrip().id;
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
						targetTripId = res.TripId;
						position = res.Sequence - 1;
					}

				}
				else if (self.obIsSmartSequence())
				{
					const _tripStop = { ...tripStop };
					if (tripChanged)
					{
						_tripStop.TripId = targetTripId;
					}
					const res = await self.viewModel.drawTool.NAtool.calculateSmartSequence(_tripStop);
					if (res.sequence != null)
					{
						position = res.sequence - 1;
					}
				}

				return self.dataModel.changeStopPosition(tripStop, targetTripId, position).then(function()
				{
					self.viewModel.display.afterChangeStopPosition(tripStop, !tripChanged, tripId).then(() =>
					{
						self.viewModel.analyzeTripByDistrictPolicy.analyze(Enumerable.From(self.dataModel.trips).Where(x => x.id == tripId || x.id == targetTripId).ToArray());
					});
					tf.loadingIndicator.tryHide()
				});
			}
		});
	};

	RoutingTripStopEditModal.prototype.subscribeDataChange = function(key)
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

	// stop time
	RoutingTripStopEditModal.prototype.calculateTotalStopTime = function(options)
	{
		var self = this;
		var trip = this.obTrips()[0];
		var newTrip = $.extend({}, trip);
		newTrip.TripStops = this.data.map(function(d)
		{
			var stop = $.extend({}, d);
			stop.TotalStopTimeManualChanged = false;
			return stop;
		});
		return this.dataModel.recalculate([newTrip]).then(function(trips)
		{
			trips.forEach(function(trip)
			{
				self.data.forEach(function(stop)
				{
					var tripStopCalculated = Enumerable.From(trip.TripStops).FirstOrDefault(null, function(c) { return c.id == stop.id; });
					if (tripStopCalculated)
					{
						stop.totalStopTimeCalc = tripStopCalculated.TotalStopTime;
						if (!stop.TotalStopTimeManualChanged && (!options || !options.isCopied))
						{
							stop.TotalStopTime = tripStopCalculated.TotalStopTime;
						}
					}
				});
			});
		});
	};

	RoutingTripStopEditModal.prototype.calculateTotalStopTimeClick = function()
	{
		var stop = this.data[this.obCurrentPage()];
		this.obDataModel.TotalStopTime(stop.totalStopTimeCalc);
	};

	RoutingTripStopEditModal.prototype.addTotalStopTimeClick = function()
	{
		this.changeTotalStopTime(1);
	};

	RoutingTripStopEditModal.prototype.minusTotalStopTimeClick = function()
	{
		this.changeTotalStopTime(-1);
	};

	RoutingTripStopEditModal.prototype.changeTotalStopTime = function(changeNumber)
	{
		var totalStopTime = TripStopHelper.convertToSeconds(this.obDataModel.TotalStopTime());
		totalStopTime = totalStopTime + changeNumber;
		if (totalStopTime < 0)
		{
			totalStopTime = 0;
		}
		this.obDataModel.TotalStopTime(TripStopHelper.convertToMinuteSecond(totalStopTime || 0, "HH:mm:ss"));
	};

	RoutingTripStopEditModal.prototype.totalStopTimeChange = function()
	{
		var stop = this.data[this.obCurrentPage()];
		this.obRedAlertTotalStopTimeControl(stop.totalStopTimeCalc !== this.obDataModel.TotalStopTime());
		this.obDataModel.TotalStopTimeManualChanged(this.obRedAlertTotalStopTimeControl());
		this.obTotalStopTimeShow(formatTotalStopTimeDisplay(this.obDataModel.TotalStopTime()));
	};

	RoutingTripStopEditModal.prototype.obTotalStopTimeShowChange = function()
	{
		var minutesSecond = this.obTotalStopTimeShow();
		if (/^[0-5]\d:[0-5]\d$/g.exec(minutesSecond))
		{
			this.obDataModel.TotalStopTime("00:" + minutesSecond);
		} else
		{
			this.obTotalStopTimeShow(formatTotalStopTimeDisplay(this.obDataModel.TotalStopTime()));
		}
	};

	RoutingTripStopEditModal.prototype.hide = function()
	{
		TF.RoutingMap.RoutingPalette.BaseTripStopEditModal.prototype.hide.call(this);
		this.removeStopSequenceGraphics();
	};

	function formatTotalStopTimeDisplay(stopTime)
	{
		var totalStopTime = TripStopHelper.convertToSeconds(stopTime);
		return TripStopHelper.convertToMinuteSecond(totalStopTime || 0, "mm:ss");
	}

})();
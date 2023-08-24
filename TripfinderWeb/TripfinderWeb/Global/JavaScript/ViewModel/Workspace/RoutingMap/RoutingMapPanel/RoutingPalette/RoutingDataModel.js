(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingDataModel = RoutingDataModel;

	const ALLFIELDTRIPS = [];

	function RoutingDataModel(fieldTripPaletteSectionVM)
	{
		var self = this;
		self.mapCanvasPage = fieldTripPaletteSectionVM.routingPaletteVM.mapCanvasPage;
		TF.RoutingMap.BaseMapDataModel.call(this, self.mapCanvasPage);
		self.viewModel = fieldTripPaletteSectionVM; //delete in future
		self.fieldTripPaletteSectionVM = fieldTripPaletteSectionVM;
		self.routeState = self.mapCanvasPage.routeState;
		self.tripStopDictionary = {};
		self.tripStopOriginalData = [];
		self.tripOriginalData = [];
		self.originalTripAssignment = {};
		self.schoolLocationDictionary = {};
		self.tripOriginalRestrictions = {};
		self.schoolSequences = {};
		self.restrictions = ['Session', 'Schools', 'BusAide', 'Day', 'Disabled', 'FilterName',
			'NonDisabled', 'HomeSchl', 'HomeTrans', 'Shuttle', 'FilterSpec', 'TravelScenarioId'];
		self.stopPathDictionary = {};
		self.onInit = new TF.Events.Event();
		self.onTripsChangeEvent = new TF.Events.Event();
		self.onTripColorChangeEvent = new TF.Events.Event();
		self.onTripStopsChangeEvent = new TF.Events.Event();
		self.onChangeTripVisibilityEvent = new TF.Events.Event();
		self.onSettingChangeEvent = new TF.Events.Event();
		self.onTripSequenceChangeEvent = new TF.Events.Event();
		self.onTripDisplayRefreshEvent = new TF.Events.Event();
		self.onWalkTSRestrictionChangeEvent = new TF.Events.Event();
		self.onTripSaveEvent = new TF.Events.Event();
		self.onTripStopTimeChangeEvent = new TF.Events.Event();
		self.onTrialStopWalkoutPreviewChange = new TF.Events.Event();
		self.onOptimizeSequenceDiffRateChange = new TF.Events.Event();
		self.onShowChartChangeEvent = new TF.Events.Event();
		self.onSchoolLocationChangeEvent = new TF.Events.Event();
		self.onTripTreeColorChangeEvent = new TF.Events.Event();
		self.onTripPathLineDisplayChangeEvent = new TF.Events.Event();

		// lock data
		self.featureData = new TF.RoutingMap.RoutingPalette.RoutingFeatureData(self);
		self.tripLockData = new TF.RoutingMap.RoutingPalette.RoutingLockData(self);
		self.fieldTripStopDataModel = new TF.RoutingMap.RoutingPalette.RoutingFieldTripStopDataModel(self);

		// change count
		self.changeDataStack = ko.observableArray();
		self.changeDataStack.subscribe(self.changeDataStackChange.bind(self));
		self.obSelfChangeCount = ko.computed(self.calcSelfChangeCount.bind(self));

		// show impact difference chart
		self.showImpactDifferenceChart = ko.observable(false);

		// self.streetDataModel = self.mapCanvasPage.mapEditingPaletteViewModel.myStreetsViewModel.dataModel;
		// self.streetMeterBuffer = 40;

		self.stopPathChange = self.stopPathChange.bind(this);
		PubSub.subscribe(topicCombine(pb.DATA_CHANGE, "stoppath"), this.stopPathChange);
		this.onSchoolLocationDataSourceChange = this.onSchoolLocationDataSourceChange.bind(this);
		this.fieldTripEditBroadcast = new TF.RoutingMap.RoutingPalette.FieldTripEditBroadcast(this);
		this.needUpdateTrip = ko.observable(true);
		this.needUpdateTripColor = ko.observable(false);
		Object.defineProperty(self, "fieldTrips",
		{
			get() { return ALLFIELDTRIPS; },
			enumerable: false,
		});

		Object.defineProperty(self, "trips",
		{
			get()
			{
				console.log("This property is obsoleted, please use fieldTrips instead. it should be removed in future.")
				return ALLFIELDTRIPS;
			},
			enumerable: false,
		});
	}

	RoutingDataModel.weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

	RoutingDataModel.prototype = Object.create(TF.RoutingMap.BaseMapDataModel.prototype);
	RoutingDataModel.prototype.constructor = RoutingDataModel;

	RoutingDataModel.prototype.init = function()
	{
		var self = this;
		// this.fieldTripEditBroadcast.init();
		// self.subscribeStreetChange();
		self.mapCanvasPage.onUpdateRecordsEvent.subscribe(this.onSchoolLocationDataSourceChange);

		return Promise.all([self.setUserProfileTripColor()]).then(function()
		{
			var docData = self.mapCanvasPage.DocumentData.data;
			// the trips that need to be auto open when trip panel initial
			if (docData && docData.trips)
			{
				var trips = docData.trips;
				if (docData.tryOpenFieldTrip)
				{
					self.tryOpenFieldTrip(trips);
					return;
				}

				if (trips[0].OpenType)
				{
					self.setFieldTrips(trips);
					self.bindColor(true);
					self._getSchoolLocations(trips).then(function()
					{
						self.setFieldTripActualStopTime(self.fieldTrips);

						self.onTripsChangeEvent.notify({ add: self.fieldTrips, edit: [], delete: [] });
					});
				} else
				{
					self.displayByFindCandidateTripStops(trips);
				}
			}
			self.onInit.notify();
		});
	};

	RoutingDataModel.prototype.tryOpenFieldTrip = function(fieldTrips)
	{
		var self = this;
		var openedTripIds = self.fieldTrips.map(function(c) { return c.Id; });
		fieldTrips = fieldTrips.filter((t) => { return openedTripIds.indexOf(t.Id) < 0; });
		if (fieldTrips.length == 0)
		{
			return Promise.resolve();
		}
		return self.tripLockData.getLockInfo().then(function(lockInfo)
		{
			return lockInfo.selfLockedList.filter(function(item)
			{
				return item.ExtraInfo != self.routeState;
			}).concat(lockInfo.lockedByOtherList).filter(item =>
			{
				return item.Type == "fieldtrip";
			});
		}).then(items =>
		{
			var openTrips = [],
				viewTrips = [],
				editTrips = self.getEditTrips(),
				tripA = editTrips.length > 0 ? editTrips[0] : fieldTrips[0];
			fieldTrips.forEach((trip) =>
			{
				if (items.some(i => i.Id == trip.Id))
				{
					viewTrips.push(trip);
				} else
				{
					openTrips.push(trip);
				}
			});
			return Promise.all([
				openTrips.length > 0 && self.setOpenFieldTrips(self.getEditTrips().concat(openTrips)),
				viewTrips.length > 0 && self.setViewFieldTrips(self.getViewTrips().concat(viewTrips))
			]);
		});
	};

	RoutingDataModel.prototype.displayByFindCandidateTripStops = function(trips)
	{
		var self = this;
		self.setOpenFieldTrips(trips).then(function()
		{
		});
	};

	RoutingDataModel.prototype.toggleShowOptimizeChart = function()
	{
		if (!this.showImpactDifferenceChart())
		{
			this.showImpactDifferenceChart(true);
		}
		else
		{
			this.showImpactDifferenceChart(false);
		}
		this.onShowChartChangeEvent.notify();
	};

	RoutingDataModel.prototype.setUserProfileTripColor = function()
	{
		var self = this;
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "userprofiles", "?dbid=" + tf.datasourceManager.databaseId)).then(function(responses)
		{
			self.colors = responses.Items[0].TripColors.split(";");
		});
	};

	RoutingDataModel.prototype.stopPathChange = function(name, stops)
	{
		let self = this;
		if (!($.isArray(stops))) return;
		(stops || []).map(function(stop)
		{
			if (stop)
			{
				self.stopPathDictionary[stop.id] = stop.DrivingDirections;
			}
		});
	};

	RoutingDataModel.prototype.getGeneratedPath = function(stopId)
	{
		return this.stopPathDictionary[stopId];
	};

	RoutingDataModel.prototype.loadDistrictPolicy = function()
	{
		var self = this;
		var databaseId = tf.datasourceManager.databaseId;
		var getDistrictStudentPolicies = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "districtStudentPolicies"), { paramData: { dbid: databaseId } }, { overlay: false });
		var getGrades = self.grades ? Promise.resolve({ Items: self.grades }) : tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "grades"));
		var getDistrictTripPolicies = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "districtTripPolicies"), { paramData: { dbid: databaseId } }, { overlay: false });

		return Promise.all([getDistrictStudentPolicies, getGrades, getDistrictTripPolicies])
			.then(function(data)
			{
				var districtStudentPolicies = data[0].Items;
				self.grades = data[1].Items;
				var districtTripPolicy = data[2].Items[0];
				var rawData = TF.DistrictPolicyHelper.mergeDistrictPolicies(districtStudentPolicies, self.grades, districtTripPolicy);
				return rawData;
			});
	};

	RoutingDataModel.prototype.loadTrip = function(trips)
	{
		var ids = trips.map(function(trip)
		{
			return trip.id;
		}).join(",");
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "trips"), {
			paramData: {
				"@filter": "in(id," + ids + ")",
				"@relationships": "TripStop,vehicle"
			}
		}, { overlay: false }).then(function(data)
		{
			return data.Items;
		});
	};

	RoutingDataModel.prototype.setViewFieldTrips = function(data)
	{
		var self = this;
		if (data.length == 0)
		{
			// if no need to open,close all view trips
			return self.closeAllViewTrips();
		}
		var newTrips = self._getNewTrip(data);
		var ids = newTrips.map(function(c) { return c.id; });
		self.setFieldTrips(self.fieldTrips.concat(newTrips));
		self.bindColor();

		return Promise.all([ self._fetchTripData(ids)]).then(function()
		{
			self._setOpenType(newTrips, "View");
			return self._removeNotOpenViewTrips(data, newTrips);
		}).then(function()
		{
			self.onTripsChangeEvent.notify({ add: newTrips, edit: [], delete: [], draw: false });
		});
	};

	RoutingDataModel.prototype.setOpenFieldTrips = function(data, disableAutoZoom)
	{
		var self = this, newTrips = [], newTripIds = [], remainTripIds = [], remainTrips = [];

		if (data.length == 0)
		{
			// if no need to open,close all
			return self.closeAllEditTrips();
		}

		data = Enumerable.From(data).OrderBy("$.Name").ToArray();
		var viewTrips = self.getViewTrips().filter(function(trip)
		{
			return Enumerable.From(data).Any(function(c) { return c.Id == trip.id; });
		});
		if (viewTrips && viewTrips.length > 0)
		{
			self.closeByViewFieldTrips(viewTrips);
		}
		tf.loadingIndicator.showImmediately();
		return self._filterNotLockTripIds(data).then(function(availableIds)
		{
			data = data.filter(function(c) { return availableIds.indexOf(c.Id + "") >= 0; });
			if (data.length == 0)
			{
				return Promise.reject();
			}
			self.fieldTrips.forEach(function(trip)
			{
				if (Enumerable.From(data).Any(function(c) { return c.Id == trip.id; }))
				{
					remainTripIds.push(trip.id);
					remainTrips.push(trip);
				}
			});

			newTrips = self._getNewTrip(data);
			newTripIds = newTrips.map(function(c) { return c.id; });
			self.setFieldTrips(self.fieldTrips.concat(newTrips));
			self.viewModel.routingChangePath && self.viewModel.routingChangePath.stop();
			self._removeNotOpenEditTrips(data);
			self.bindColor();

			var p1 = self._fetchTripData(newTripIds);
			var p2 = self._getFieldTripPathFeatureData(newTripIds, p1).then(function()
			{
				if (!disableAutoZoom)
				{
					self.viewModel.eventsManager.zoomClick({});
				}
			});

			return Promise.all([p1, p2]);
		}).then(function(tripsData)
		{
			const fetchedTripsData = tripsData[0].FieldTrips;

			// remove not exist new trip
			newTrips = newTrips.filter(function(trip)
			{
				var exist = Enumerable.From(fetchedTripsData).Any(function(t) { return t.id == trip.id; });
				if (!exist)
				{
					self.setFieldTrips(self.fieldTrips.filter(function(t) { return t.id != trip.id; }));
				}
				return exist;
			});

			// remember trip original assignment info.
			for (let i = 0; i < fetchedTripsData.length; i++)
			{
				const tripData = fetchedTripsData[i];
				self.originalTripAssignment[tripData.id] = tripData;
			}

			self._setOpenType(newTrips, "Edit");

		}).then(function()
		{
			self.onTripsChangeEvent.notify({ add: newTrips, edit: remainTrips, delete: [], draw: false });
			self.setTripOriginalData(newTrips);
			if (self.showImpactDifferenceChart()) { newTrips.forEach(function(trip) { self.refreshOptimizeSequenceRate(trip.id); }); }

			self._updateTravelScenarioLock();
		}).catch(function(args)
		{
			console.log(args);
			self.tripLockData.unLock(data.map(x => x.Id));
		}).finally(()=>tf.loadingIndicator.tryHide());
	};

	RoutingDataModel.prototype._setOpenType = function(trips, openType)
	{
		trips.map(function(trip)
		{
			trip.OpenType = openType;
			trip.FieldTripStops.map(function(tripStop)
			{
				tripStop.OpenType = openType;
			});
		});
	};

	RoutingDataModel.prototype._getSchoolLocations = function(trips)
	{
		var self = this, promiseAll = [];
		if (trips.length == 0)
		{
			return Promise.resolve([]);
		}
		trips[0].FieldTripStops.map(function(tripStop)
		{
			if (tripStop.SchoolCode)
			{
				promiseAll.push(tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "schoollocations", "?schoolCode=" + tripStop.SchoolCode))
					.then(function(apiResponse)
					{
						var items = apiResponse.Items;
						items.forEach(function(item)
						{
							item.geometry = TF.xyToGeometry(item.Xcoord, item.Ycoord);
						});
						self.schoolLocationDictionary[tripStop.SchoolCode] = items;
					}));
			}
		});
		return Promise.all(promiseAll);
	};

	RoutingDataModel.prototype.getSchoolLocationsBySchoolCode = function(schoolCode)
	{
		return this.schoolLocationDictionary[schoolCode];
	};

	RoutingDataModel.prototype.setTripOriginalData = function(trips)
	{
		var self = this;
		trips.map(function(trip, index)
		{
			// save current trip restrictions
			if (index == 0)
			{
				self.restrictions.map(function(r)
				{
					self.tripOriginalRestrictions[r] = trip[r];
				});
			}

			trip.FieldTripStops.map(function(tripStop)
			{
				self.stopPathDictionary[tripStop.id] = tripStop.DrivingDirections;
				self.tripStopOriginalData[tripStop.id] = trip.id;
				if (!self.tripOriginalData[trip.id])
				{
					self.tripOriginalData[trip.id] = [tripStop.id];
				}
				else
				{
					self.tripOriginalData[trip.id].push(tripStop.id);
				}
			});
		});
	};

	RoutingDataModel.prototype.updateTripOriginalData = function(trips)
	{
		trips = trips.filter(function(trip) { return trip.OpenType == "Edit"; });
		this.clearTripOriginalData(trips);
		this.setTripOriginalData(trips);
	};

	RoutingDataModel.prototype.clearTripOriginalData = function(trips)
	{
		var self = this;
		trips.map(function(trip)
		{
			if (self.tripOriginalData[trip.id])
			{
				delete self.tripOriginalData[trip.id];
			}
			trip.FieldTripStops.map(function(tripStop)
			{
				if (self.tripStopOriginalData[tripStop.id])
				{
					delete self.tripStopOriginalData[tripStop.id];
				}
			});
		});
	};

	RoutingDataModel.prototype.handleRelatedTrip = function(trips, type)
	{
		var self = this;
		var allRelatedTrips = $.extend([], trips);
		self.getRelatedUnsavedTrip(trips, allRelatedTrips);
		if (allRelatedTrips.length > trips.length)
		{
			var otherRelatedTrips = allRelatedTrips.filter(function(trip)
			{
				return !Enumerable.From(trips).Any(function(p) { return p.id == trip.id; });
			});
			var message = self.getMessage(type);
			otherRelatedTrips.map(function(trip, index)
			{
				if (index != otherRelatedTrips.length - 1)
				{
					message += trip.Name + ', ';
				}
				else
				{
					message += trip.Name + '.';
				}
			});
			return { trips: allRelatedTrips, message: message };
		}
		else
		{
			return { trips: trips };
		}
	};

	RoutingDataModel.prototype.getMessage = function(type)
	{
		switch (type)
		{
			case 'save':
				return "Trips change related with other trips, you will be also saving ";
			case 'revert':
				return "Trips change related with other trips, you will also revert ";
			case 'close':
				return "Trips change related with other trips, you will be also closing ";
			default:
				return '';
		}
	};

	RoutingDataModel.prototype.getRelatedUnsavedTrip = function(trips, allRelatedTrips)
	{
		var relatedTripsDictionary = {}, self = this;
		function _getRelatedUnsavedTrip(trips, allRelatedTrips)
		{
			trips.map(function(trip)
			{
				trip.FieldTripStops.map(function(tripStop)
				{
					var tripId = self.tripStopOriginalData[tripStop.id];
					if (tripId)
					{
						if (!relatedTripsDictionary[tripId])
						{
							relatedTripsDictionary[tripId] = self.getFieldTripById(tripId);
						}
					}
				});

				if (self.tripOriginalData[trip.id])
				{
					self.tripOriginalData[trip.id].map(function(tripStopId)
					{
						if (tripStopId)
						{
							self.fieldTrips.map(function(tripTemp)
							{
								tripTemp.FieldTripStops.map(function(tripStop)
								{
									if (tripStop.id == tripStopId)
									{
										if (!relatedTripsDictionary[tripStop.FieldTripId])
										{
											relatedTripsDictionary[tripStop.FieldTripId] = tripTemp;
										}
									}
								});
							});
						}
					});
				}
			});
			var relatedTrips = [];
			for (var item in relatedTripsDictionary)
			{
				if (!Enumerable.From(allRelatedTrips).Any(function(p) { return p.id == item; }))
				{
					allRelatedTrips.push(relatedTripsDictionary[item]);
					relatedTrips.push(relatedTripsDictionary[item]);
				}
			}
			if (relatedTrips.length > 0)
			{
				return _getRelatedUnsavedTrip(relatedTrips, allRelatedTrips);
			}
			else
			{
				return allRelatedTrips;
			}
		}

		return _getRelatedUnsavedTrip(trips, allRelatedTrips);
	};

	RoutingDataModel.prototype.clearOptimizeImpact = function(canvas_container)
	{
		function clearCanvas(element)
		{
			var c = element;
			var ctx = c.getContext("2d");

			ctx.clearRect(0, 0, c.width, c.height);
		}
		if (canvas_container)
		{
			canvas_container.find('.trip-canvas-distance-info').map(function(index, element)
			{
				clearCanvas(element);
			});
			canvas_container.find('.trip-canvas-duration-info').map(function(index, element)
			{
				clearCanvas(element);
			});
		}
	};

	RoutingDataModel.prototype.refreshOptimizeSequenceRate = function(tripId, noNeedTriggerEvent, trip, inactiveHideLocator)
	{
		var self = this, tripStopRouteDictionary = {};
		var oldTrip = trip ? trip : self.getFieldTripById(tripId);
		if (oldTrip.FieldTripStops.length <= 1)
		{
			if (!noNeedTriggerEvent)
			{
				self.onOptimizeSequenceDiffRateChange.notify({
					tripId: oldTrip.id
				});
			}
			return false;
		}
		var treeView = self.viewModel.$element.find("#routingtreeview").data('kendoTreeView');
		var tripNode = treeView.dataSource.getFirst(tripId, function(item)
		{
			return item.customData && item.customData.isTrip;
		});
		var canvas_container;
		if (tripNode)
		{
			var tripElement = treeView.findByUid(tripNode.uid);
			// add loading until complete
			self.clearOptimizeImpact(tripElement);
			canvas_container = tripElement.find('.trip-canvas-container');
			var loadingElement = '<div class="process-loading"></div>';
			canvas_container.append(loadingElement);
		}
		// remove route stop path, cause route stop property contain _map property, json copy would catch circular sturcture error
		oldTrip.FieldTripStops.map(function(tripStop)
		{
			if (tripStop.routeStops)
			{
				if (!tripStopRouteDictionary[tripStop.id])
				{
					tripStopRouteDictionary[tripStop.id] = tripStop.routeStops;
				}
				delete tripStop.routeStops;
			}
		});
		var newTrip = JSON.parse(JSON.stringify(oldTrip));
		// revert removed route stop property
		oldTrip.FieldTripStops.map(function(tripStop)
		{
			if (tripStopRouteDictionary[tripStop.id])
			{
				tripStop.routeStops = tripStopRouteDictionary[tripStop.id];
			}
		});
		TF.loopCloneGeometry(newTrip, oldTrip);
		var newTripStops = [];
		var promiseList = [];
		var startIndex = 0;
		for (var i = 0; i < newTrip.FieldTripStops.length; i++)
		{
			if (i != 0 && newTrip.FieldTripStops[i].SchoolCode)
			{
				promiseList.push(self.viewModel.drawTool.NAtool.refreshTripByMultiStops(newTrip.FieldTripStops.slice(startIndex, i + 1), true));
				startIndex = i;
			}
			else if (i == newTrip.FieldTripStops.length - 1 && (newTrip.FieldTripStops[i].SchoolCode === "" || newTrip.FieldTripStops[i].SchoolCode === null))
			{
				promiseList.push(self.viewModel.drawTool.NAtool.refreshTripByMultiStops(newTrip.FieldTripStops.slice(startIndex, i + 1), true));
			}
		}
		return Promise.all(promiseList).then(function(newList)
		{
			var promise = Promise.resolve(true);
			if (newList[0] && newList[0].err)
			{
				promise = Promise.reject(new Error(newList[0].err));
			}
			else
			{
				promise = self.recalculate([newTrip]);
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
				newTrip.FieldTripStops = newTripStops;
				newTrip.FieldTripStops.map(function(tripStop, index)
				{
					tripStop.Sequence = index + 1;
				});
			}
			return promise.then(function(response)
			{
				var tripData = response[0];
				newTrip.Distance = tripData.Distance;
				newTrip.Name = newTrip.Name + ' Copy';
				for (var j = 0; j < newTrip.FieldTripStops.length; j++)
				{
					newTrip.FieldTripStops[j].TotalStopTime = tripData.FieldTripStops[j].TotalStopTime;
					newTrip.FieldTripStops[j].Duration = tripData.FieldTripStops[j].Duration;
				}
				self.setFieldTripActualStopTime([newTrip]);
				if (!inactiveHideLocator)
				{
					tf.loadingIndicator.tryHide();
				}
				var diffRates = self.getOptimizeDiffRate(oldTrip, newTrip);
				oldTrip.durationDiffRate = diffRates[0];
				oldTrip.distanceDiffRate = diffRates[1];
				oldTrip.durationDiff = diffRates[2];
				oldTrip.distanceDiff = diffRates[3];
				if (!noNeedTriggerEvent)
				{
					self.onOptimizeSequenceDiffRateChange.notify({
						durationDiffRate: diffRates[0],
						distanceDiffRate: diffRates[1],
						durationDiff: diffRates[2],
						distanceDiff: diffRates[3],
						tripId: newTrip.id
					});
				}
				if (canvas_container)
				{
					canvas_container.find('.process-loading').remove();
				}
			}).catch(function()
			{
				tf.loadingIndicator.tryHide();
				oldTrip.durationDiffRate = -999;
				oldTrip.distanceDiffRate = -999;
				oldTrip.durationDiff = -999;
				oldTrip.distanceDiff = -999;
				if (!noNeedTriggerEvent)
				{
					self.onOptimizeSequenceDiffRateChange.notify({
						durationDiffRate: -999,
						distanceDiffRate: -999,
						durationDiff: -999,
						distanceDiff: -999,
						tripId: oldTrip.id
					});
				}
				if (canvas_container)
				{
					canvas_container.find('.process-loading').remove();
				}
			});
		});
	};

	RoutingDataModel.prototype.recalculate = function(fieldTrips)
	{
		var cannotCalculate = false;
		var data = $.extend(true, [], fieldTrips);
		data.forEach(function(fieldTrip)
		{
			delete fieldTrip.directions;
			delete fieldTrip.routePath;
			delete fieldTrip.routePathAttributes;
			fieldTrip.FieldTripStops.forEach(function(fieldTripStop)
			{
				delete fieldTripStop._geoPath;
				if (!fieldTripStop)
				{
					cannotCalculate = true;
				}
			});
		});
		if (cannotCalculate)
		{
			return Promise.resolve(fieldTrips);
		}

		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "RoutingFieldTrips", "routing", "recalculate"),
			{
				data: data
			}, { overlay: false }).then(function(response)
			{
				return response.Items;
			});
	};

	RoutingDataModel.prototype.getOptimizeDiffRate = function(oldTrip, newTrip)
	{
		var oldDuration = getTripDuration(oldTrip);
		var newDuration = getTripDuration(newTrip);
		var durationDiff = ((oldDuration - newDuration) / 60).toFixed(1);
		var durationDiffRate = oldDuration == 0 ? 'N/A' : ((((Math.abs((oldDuration - newDuration) / oldDuration)) * 100).toFixed(0)) * (durationDiff >= 0 ? 1 : -1));
		var distanceDiff = (oldTrip.Distance - newTrip.Distance).toFixed(2);
		var distanceDiffRate = oldTrip.Distance == 0 ? 'N/A' : (((Math.abs(distanceDiff / oldTrip.Distance)) * 100).toFixed(0) * (distanceDiff >= 0 ? 1 : -1));
		function getTripDuration(trip)
		{
			return Math.abs(convertToMoment(trip.ActualStartTime).diff(convertToMoment(trip.ActualEndTime), "s"));
		}
		return [durationDiffRate, distanceDiffRate, durationDiff, distanceDiff];
	};

	RoutingDataModel.prototype.getNewTripColor = function()
	{
		const self = this;
		if (self.fieldTrips.length < self.colors.length)
		{
			return Enumerable.From(self.colors).FirstOrDefault(this.colors[0], (c) => { return !Enumerable.From(self.fieldTrips).Any((trip) => { return trip.color == c; }); });
		}
		return self.colors[self.fieldTrips.length % this.colors.length];
	};

	RoutingDataModel.prototype.editTrip = function(trip)
	{
		var self = this;
		tf.modalManager.showModal(
			new TF.RoutingMap.RoutingPalette.RoutingTripModalViewModel({
				currentOpenTrip: self.fieldTrips.length > 0 ? self.fieldTrips[0] : null,
				dataModel: self,
				trip: trip
			})
		).then(function(trip)
		{
			if (!trip)
			{
				return;
			}
			for (var i = 0; i < self.fieldTrips.length; i++)
			{
				if (self.fieldTrips[i].id == trip.id)
				{
					self.fieldTrips[i] = trip;
					break;
				}
			}
			if (self.needUpdateTrip())
			{
				self.updateTrip(trip);
			}
			if (self.needUpdateTripColor())
			{
				self.changeTripColor(trip.id, trip.color, true);
			}
		});
	};

	RoutingDataModel.prototype.updateTrip = function(trip)
	{
		this.onTripsChangeEvent.notify({ add: [], edit: [trip], delete: [] });
		this.changeDataStack.push(trip);
		if (this.showImpactDifferenceChart())
		{
			this.refreshOptimizeSequenceRate(trip.id);
		}
		this._updateTravelScenarioLock();
	};

	RoutingDataModel.prototype.saveAsNewTrip = function(trip)
	{
		var self = this;
		tf.modalManager.showModal(
			new TF.RoutingMap.RoutingPalette.RoutingTripModalViewModel({
				currentOpenTrip: self.fieldTrips.length > 0 ? self.fieldTrips[0] : null,
				saveToNewTrip: trip,
				dataModel: self,
				newTripColor: trip.color
			})
		).then(function(data)
		{
			if (!data)
			{
				return;
			}
			self.createNewTrip(data);
		});
	};

	RoutingDataModel.prototype.createNewTrip = function(trip)
	{
		var self = this;
		self.addFieldTrip(trip);
		self.onTripsChangeEvent.notify({ add: [trip], edit: [], delete: [], options: { resetScheduleTime: true } });
		if (trip.OpenType === 'Edit')
		{
			self.changeDataStack.push(trip);
		}
	};

	RoutingDataModel.prototype.resetCopyTripValue = function(trip)
	{
		var self = this;
		trip.id = TF.createId();
		trip.Id = 0;
		trip.NumTransport = 0;
		trip.MaxOnBus = 0;
		trip.color = self.getNewTripColor();
		trip.oldId = trip.id;
		let tripStopTempId = TF.createId();
		let stopBoundaryTempId = TF.createId();
		trip.FieldTripStops.map(function(tripStop)
		{
			tripStop.id = tripStopTempId++;
			tripStop.color = trip.color;
			tripStop.TripStopId = tripStop.id;
			tripStop.FieldTripId = trip.id;
			// remove student
			tripStop.Students = [];
			tripStop.ToSchoolStudents = { HomeToSchool: 0, SchoolToHome: 0 };
			tripStop.ToTransStudents = { HomeToTrans: 0, TransToHome: 0 };
			tripStop.TransToTrans = { PUTransToTrans: 0, DOTransToTrans: 0 };
			tripStop.PUTransToSchool = { TransToSchool: 0, SchoolToTrans: 0 };
			tripStop.DOTransToSchool = { TransToSchool: 0, SchoolToTrans: 0 };
			tripStop.AssignedStudentCount = 0;
			tripStop.TotalStudentCount = 0;
			tripStop.oldId = tripStop.id;
			if (tripStop.boundary)
			{
				tripStop.boundary.OBJECTID = 0;
				tripStop.boundary.FieldTripId = trip.id;
				tripStop.boundary.TripStopId = tripStop.id;
				tripStop.boundary.id = stopBoundaryTempId++;
				tripStop.boundary.newAssignStudent = [];
			}
		});
	};

	RoutingDataModel.prototype.resetCopyFieldTripValue = function(trip)
	{
		var self = this;
		trip.id = TF.createId();
		trip.Id = 0;
		// trip.NumTransport = 0;
		// trip.MaxOnBus = 0;
		trip.color = self.getNewTripColor();
		// trip.oldId = trip.id;
		let tripStopTempId = TF.createId();
		let stopBoundaryTempId = TF.createId();
		trip.FieldTripStops.map(function(tripStop)
		{
			// FieldTripStop TODO: Reset FieldTripStop field here
			tripStop.id = tripStopTempId++;
			tripStop.color = trip.color;
			tripStop.FieldTripStopId = tripStop.id;
			tripStop.FieldTripId = trip.id;
			
		});
	};

	/**
	* initial trip info for copy field trip
	*/
	RoutingDataModel.prototype.initialNewFieldTripInfo = function(trip, notAutoAssignStudent, changeTripType)
	{
		var self = this, promise = Promise.resolve(true), boundaries = [];

		return promise.then(function()
		{
			promise = Promise.resolve(true);

			return promise.then(function(newTripCandidateStudents)
			{
				var p = Promise.resolve(true);

				return p.then(function()
				{
					return self.recalculate([trip]).then(function(response)
					{
						var tripData = response[0];
						trip.Distance = tripData.Distance;
						for (var j = 0; j < trip.FieldTripStops.length; j++)
						{
							trip.FieldTripStops[j].TotalStopTime = tripData.FieldTripStops[j].TotalStopTime;
							trip.FieldTripStops[j].Duration = tripData.FieldTripStops[j].Duration;
						}
						self.setFieldTripActualStopTime([trip]);

						return Promise.resolve(trip);
					});
				});
			});
		});
	};

	RoutingDataModel.prototype.copyAsNewFieldTrip = function(trip)
	{
		var self = this;
		tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.CopyFieldTripModalViewModel(trip, self))
			.then(function(data)
			{
				if (!data)
				{
					return;
				}

				delete data.routePathAttributes;
				self.onTripsChangeEvent.notify({ add: [data], edit: [], delete: [], options: { resetScheduleTime: true } });
				if (data.OpenType === 'Edit')
				{
					self.changeDataStack.push(data);
				}
			});
	};

	RoutingDataModel.prototype._fetchTripData = function(fieldTripIds, overlay)
	{
		var self = this;
		if (fieldTripIds.length == 0)
		{
			return { Trips: [] };
		}
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "routingfieldtrips"), {
			paramData: { fieldTripIds: fieldTripIds.toString() }
		}, { overlay: overlay != false ? true : false }).then(function(response)
		{
			var data = response.Items[0];
			let filterTips = '';
			if (data.HasInvalidAdditionalStuFilter)
			{
				filterTips = 'The additional student filter is invalid.';
			}

			// if (data.HasInvalidNEZFilter)
			// {
			// 	filterTips = filterTips === '' ? 'Map NEZ student filter is invalid.' : 'Map NEZ student filter and additional student filter are invalid.';
			// }

			if (filterTips)
			{
				tf.promiseBootbox.alert(filterTips);
			}

			var schoolIdsDic = {}, schoolIds = [];
			data.FieldTrips.forEach(function(trip)
			{
				trip.visible = true;
				trip.type = "trip";
				trip.FieldTripStops.forEach(function(fieldTripStop)
				{
					fieldTripStop.FieldTripId = trip.id;
					fieldTripStop.type = "tripStop";
					fieldTripStop.vehicleCurbApproach = fieldTripStop.VehicleCurbApproach;
					if (fieldTripStop.SchoolLocation)
					{
						fieldTripStop.SchoolLocation.geometry = TF.xyToGeometry(fieldTripStop.SchoolLocation.Xcoord, fieldTripStop.SchoolLocation.Ycoord);
					}
					if (fieldTripStop.SchoolId > 0 && (fieldTripStop.XCoord == 0 || fieldTripStop.YCoord == 0))
					{
						if (!schoolIdsDic[fieldTripStop.SchoolId])
						{
							schoolIdsDic[fieldTripStop.SchoolId] = fieldTripStop.SchoolId;
						}
					}
				});
				return trip;
			});

			for (var schoolId in schoolIdsDic)
			{
				schoolIds.push(schoolIdsDic[schoolId]);
			}
			var promise = Promise.resolve(true);
			if (schoolIds.length > 0)
			{
				promise = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "schools"), {
					paramData: {
						"@filter": "in(Id," + schoolIds.join(",") + ")"
					}
				}).then(function(result)
				{
					data.Trips.forEach(function(trip)
					{
						trip.FieldTripStops.forEach(function(fieldTripStop)
						{
							if (fieldTripStop.SchoolId > 0)
							{
								var school = Enumerable.From(result.Items).FirstOrDefault(null, function(s) { return s.Id == fieldTripStop.SchoolId; });
								if (school)
								{
									fieldTripStop.XCoord = school.Xcoord;
									fieldTripStop.YCoord = school.Ycoord;
								}
							}
						});
					});
				});
			}

			return promise.then(function()
			{
				return data;
			});
		}).then(function(tripsData)
		{
			var allTripStops = [];
			var assignedStudents = [];
			tripsData.FieldTrips.forEach(function(trip)
			{
				var existTrip = self.getFieldTripById(trip.id);
				if (existTrip)
				{
					existTrip.originalStudents = [];
					for (var key in trip)
					{
						if(trip[key] !== null && trip[key] !== undefined)
						{
							existTrip[key] = trip[key];
						}
						if (typeof existTrip[key] == "undefined")
						{
							existTrip[key] = trip[key];
						}
					}
				}
			});
			tripsData.AllTripStops = allTripStops;
			return tripsData;
		});
	};

	RoutingDataModel.prototype._getNewTrip = function(newTrips)
	{
		var self = this;
		return newTrips.filter(function(trip)
		{
			return trip.Id && !Enumerable.From(self.fieldTrips).Any(function(c) { return c.id == trip.Id || c.Id == trip.Id || c.Id == trip.id || c.id == trip.id; });
		}).map(function(trip)
		{
			trip.id = trip.Id;
			trip.visible = true;
			trip.FieldTripStops = [];
			trip.FieldTripStops = [];
			trip.type = "trip";
			return trip;
		});
	};

	RoutingDataModel.prototype.assignStops = function(tripStops, tripId, isSequenceOptimize, isSmartSequence, isPreserve)
	{
		var self = this, tripStopArray = [], affectedTrips = [self.getFieldTripById(tripId)];
		tripStops.map(function(tripStop)
		{
			if (tripStop.FieldTripId != tripId)
			{
				var affectedTrip = self.getFieldTripById(tripStop.FieldTripId);
				if (!affectedTrips.includes(affectedTrip))
				{
					affectedTrips.push(affectedTrip);
				}
				tripStopArray.push(tripStop);
			}
		});

		if (tripStopArray.length == 0)
		{
			return Promise.resolve();
		}

		tf.loadingIndicator.showImmediately();
		return new Promise(function(resolve)
		{
			setTimeout(function()
			{
				self.fieldTripStopDataModel.moveTripStopsToOtherTrip(tripStopArray, tripId, null, isSequenceOptimize, isSmartSequence, isPreserve).then(function(stops)
				{
					tf.loadingIndicator.tryHide();
					if (!stops || !$.isArray(stops))
					{
						return tf.promiseBootbox.alert("VRP calculation failed!");
					}

					self.onTripsChangeEvent.notify({ add: [], edit: affectedTrips, delete: [] });
					resolve();
				});
			});
		});
	};

	/**
	 * calculate trip stop new sequence when drag a trip stop to another trip
	 * @param {*} trip 
	 * @param {*} tripStop 
	 */
	RoutingDataModel.prototype.calculateTripStopSequence = function(trip, tripStop)
	{
		if (!this.getSmartSequenceSetting())
		{
			return Promise.resolve(TF.Helper.TripHelper.getTripStopInsertSequence(trip.FieldTripStops, trip.Session));
		}
		return this.fieldTripStopDataModel.calculateSmartSequence(trip, tripStop);
	};

	RoutingDataModel.prototype.changeStopPosition = function(tripStop, fieldTripId, newPositionIndex, callZoomToLayers = true)
	{
		var self = this;
		return self.fieldTripStopDataModel.reorderTripStopSequence(tripStop, fieldTripId, newPositionIndex + 1, callZoomToLayers);
	};

	RoutingDataModel.prototype._removeNotOpenEditTrips = function(openTrips)
	{
		var self = this;
		var deleteTrips = [];
		self.getEditTrips().forEach(function(trip)
		{
			if (!Enumerable.From(openTrips).Any(function(c) { return c.Id == trip.id || c.id == trip.id; })
				&& trip.Id !== 0)
			{
				deleteTrips.push(trip);
			}
		});
		self.closeByFieldTrips(deleteTrips, true);
	};

	RoutingDataModel.prototype._removeNotOpenViewTrips = function(openTrips, newTrips)
	{
		var self = this;
		var deleteTrips = [];
		self.getViewTrips().forEach(function(trip)
		{
			if (!Enumerable.From(openTrips).Any(function(c) { return c.Id == trip.id || c.id == trip.id; }))
			{
				deleteTrips.push(trip);
			}
		});
		return this.closeByViewFieldTrips(deleteTrips, newTrips);
	};

	RoutingDataModel.prototype._filterNotLockTripIds = function(trips)
	{
		var self = this;
		return self.viewModel.eventsManager._getLockedByOtherTrips().then(function(lockedByOther)
		{
			return trips.filter(function(trip)
			{
				return !Enumerable.From(lockedByOther).Any(function(c) { return c.Id == trip.Id; });
			});
		}).then(function(trips)
		{
			return self.tripLockData.lockIds(trips.filter(function(trip)
			{
				return trip.Id;
			}).map(function(trip)
			{
				return trip.Id;
			}));
		});
	};

	RoutingDataModel.prototype.setLockTime = function(fieldTripStopId, fieldTripId)
	{
		var self = this;
		for (var i = 0; i < self.fieldTrips.length; i++)
		{
			if (self.fieldTrips[i].id == fieldTripId)
			{
				for (var j = 0; j < self.fieldTrips[i].FieldTripStops.length; j++)
				{
					const mateched = self.fieldTrips[i].FieldTripStops[j].id == fieldTripStopId;
					self.fieldTrips[i].FieldTripStops[j].LockStopTime = !!mateched;
				}
				break;
			}
		}
	};

	RoutingDataModel.prototype.getFieldTripStopByStopId = function(fieldTripStopId)
	{
		var self = this;
		for (var i = 0; i < self.fieldTrips.length; i++)
		{
			const fieldTrip = self.fieldTrips[i];
			for (var j = 0; j < fieldTrip.FieldTripStops.length; j++)
			{
				const fieldTripStop = fieldTrip.FieldTripStops[j];
				if (fieldTripStop.id === fieldTripStopId || fieldTripStop.oldId === fieldTripStopId)
				{
					return fieldTripStop;
				}
			}
		}

		return null;
	};

	RoutingDataModel.prototype.getTripStopByTripId = function(tripId)
	{
		var self = this;
		for (var i = 0; i < self.fieldTrips.length; i++)
		{
			if (tripId && self.fieldTrips[i].id != tripId)
			{
				continue;
			}
			return self.fieldTrips[i].FieldTripStops;
		}
	};

	RoutingDataModel.prototype.getSchoolStopsByTripId = function(tripId)
	{
		var self = this;
		for (var i = 0; i < self.fieldTrips.length; i++)
		{
			if (tripId && self.fieldTrips[i].id != tripId)
			{
				continue;
			}
			return self.fieldTrips[i].FieldTripStops.filter(function(item)
			{
				return !IsEmptyString(item.SchoolCode);
			});
		}
	};

	RoutingDataModel.prototype._getFieldTripPathFeatureData = function(tripIds, tripDataPromise)
	{
		if (tripIds.length === 0)
		{
			return Promise.resolve([]);
		}

		var self = this;
		return tripDataPromise.then(function()
		{
			const records = [];
			self.fieldTrips.forEach(function(trip)
			{
				// only refresh new trips
				if (tripIds.indexOf(trip.id) < 0)
				{
					return;
				}
				trip.FieldTripStops.forEach(function(tripStop)
				{
					let tripPath = {};
					if (tripStop.GeoPath)
					{
						tripPath = {
							id: TF.createId(),
							OBJECTID: 0,
							type: "tripPath",
							FieldTripId: tripStop.FieldTripId,
							FieldTripStopId: tripStop.id,
							// geometry: // todo, convert geo path to geometry
							AvgSpeed: tripStop.Speed || 0,
							Dist: tripStop.Distance
						};
						records.push(tripPath);
					}
					tripStop.path = tripPath;
				});
			});
			return records;
		});
	};

	RoutingDataModel.prototype.getFieldTripById = function(tripId)
	{
		const self = this;
		return self.fieldTrips.find(function(trip)
		{
			return trip.id == tripId || trip.oldId == tripId || trip.FieldTripID == tripId;
		});
	};

	RoutingDataModel.prototype.addFieldTrip = function(fieldTrip)
	{
		ALLFIELDTRIPS.push(fieldTrip);
	};

	RoutingDataModel.prototype.setFieldTrips = function(fieldTrips)
	{
		ALLFIELDTRIPS.splice(0, ALLFIELDTRIPS.length, ...fieldTrips);
	};

	RoutingDataModel.prototype.getSession = function()
	{
		if (typeof this._session == "number")
		{
			return this._session;
		}
		var editTrips = this.getEditTrips();
		if (editTrips.length > 0)
		{
			this._session = editTrips[0].Session;
			setTimeout(function()
			{
				this._session = null;
			}.bind(this), 20);
			return this._session;
		}
		return null;
	};

	RoutingDataModel.prototype.getTripStopsByStopIds = function(tripStopIds)
	{
		var self = this;
		var tripStops = [];
		for (var i = 0; i < self.fieldTrips.length; i++)
		{
			for (var j = 0; j < self.fieldTrips[i].FieldTripStops.length; j++)
			{
				if (tripStopIds.indexOf(self.fieldTrips[i].FieldTripStops[j].id) > -1)
				{
					tripStops.push(self.fieldTrips[i].FieldTripStops[j]);
				}
			}
		}
		return tripStops;
	};

	RoutingDataModel.prototype.copyFieldTripStopTimeWithActualTime = function(trips)
	{
		var stopTimeFormat = "YYYY-MM-DDTHH:mm:ss";
		for (var i = 0; i < trips.length; i++)
		{
			for (var j = 0; j < trips[i].FieldTripStops.length; j++)
			{
				const actualStopTime = trips[i].FieldTripStops[j].ActualStopTime;

				if(j == 0)
				{
					trips[i].FieldTripStops[j].StopTimeArrive = null;
					trips[i].FieldTripStops[j].StopTimeDepart = actualStopTime;
				}
				else if(j == trips[i].FieldTripStops.length - 1)
				{
					trips[i].FieldTripStops[j].StopTimeArrive = actualStopTime;
					trips[i].FieldTripStops[j].StopTimeDepart = null;
				}
				else
				{
					let pauseDuration = trips[i].FieldTripStops[j].StopPauseMinutes || moment.duration(moment(trips[i].FieldTripStops[j].StopTimeDepart).diff(moment(trips[i].FieldTripStops[j].StopTimeArrive))).asMinutes();
					trips[i].FieldTripStops[j].StopPauseMinutes = null;
					trips[i].FieldTripStops[j].StopTimeArrive = actualStopTime;
					trips[i].FieldTripStops[j].StopTimeDepart = moment(actualStopTime).add(Math.ceil(pauseDuration), "minutes").format(stopTimeFormat);
				}
			}
		}
		this.onTripStopTimeChangeEvent.notify({});
	};

	RoutingDataModel.prototype.setFieldTripActualStopTime = function(trips, reset, resetDateTime)
	{
		var j = 0;
		var stopTimeFormat = "YYYY-MM-DDTHH:mm:ss";
		for (var i = 0; i < trips.length; i++)
		{
			let lockStop;
			let lockStopIndex;
			if (!reset)
			{
				for (j = 0; j < trips[i].FieldTripStops.length; j++)
				{
					if (trips[i].FieldTripStops[j].LockStopTime)
					{
						trips[i].FieldTripStops[j].ActualStopTime = trips[i].FieldTripStops[j].StopTimeArrive || trips[i].FieldTripStops[j].StopTimeDepart;
						lockStop = trips[i].FieldTripStops[j];
						lockStopIndex = j;
						break;
					}
				}
				if (!lockStopIndex && trips[i].FieldTripStops.length > 0)
				{
					trips[i].FieldTripStops[0].LockStopTime = true;
					trips[i].FieldTripStops[0].ActualStopTime = trips[i].FieldTripStops[0].StopTimeDepart;
					lockStop = trips[i].FieldTripStops[0];
					lockStopIndex = 0;
				}
			}
			else
			{
				lockStop = trips[i].FieldTripStops[0];
				lockStopIndex = 0;

				lockStop.ActualStopTime = moment(resetDateTime).format(stopTimeFormat);;

				for (j = 0; j < trips[i].FieldTripStops.length; j++)
				{
					if (trips[i].FieldTripStops[j].id == lockStop.id)
					{
						trips[i].FieldTripStops[j].LockStopTime = true;
					}
					else
					{
						trips[i].FieldTripStops[j].LockStopTime = false;
					}
				}
			}

			for (j = lockStopIndex + 1; j < trips[i].FieldTripStops.length; j++)
			{
				let previousStop = trips[i].FieldTripStops[j - 1];
				let actualStopTime = moment(previousStop.ActualStopTime, stopTimeFormat)
											.add(Math.ceil(moment.duration(previousStop.Duration).asMinutes()), "minutes")
											.format(stopTimeFormat);

				trips[i].FieldTripStops[j].ActualStopTime = actualStopTime;
			}
			for (j = lockStopIndex - 1; j > -1; j--)
			{
				let nextPauseStop = trips[i].FieldTripStops[j + 1];
				let actualStopTime = moment(nextPauseStop.ActualStopTime, stopTimeFormat)
											.subtract(Math.ceil(moment.duration(trips[i].FieldTripStops[j].Duration).asMinutes()), "minutes")
											.format(stopTimeFormat);

				trips[i].FieldTripStops[j].ActualStopTime = actualStopTime;
			}
			if (trips[i].FieldTripStops.length > 0)
			{
				trips[i].ActualStartTime = trips[i].FieldTripStops[0].ActualStopTime.format(stopTimeFormat);
				trips[i].ActualEndTime = trips[i].FieldTripStops[trips[i].FieldTripStops.length - 1].ActualStopTime?.format(stopTimeFormat);
			}
		}
	};

	RoutingDataModel.prototype.setStopTimeForEmptyRecords = function(trip)
	{
		if (!trip)
		{
			return;
		}

		const emptyValue = "00:00:00";
		for (var i = 0; i < trip.FieldTripStops.length; i++)
		{
			let stop = trip.FieldTripStops[i];
			if (stop.StopTime == emptyValue)
			{
				stop.StopTime = stop.ActualStopTime;
				var prevStop = i == 0 ? null : trip.FieldTripStops[i - 1];
				var nextStop = i == trip.FieldTripStops.length - 1 ? null : trip.FieldTripStops[i + 1];
				if (prevStop && prevStop.StopTime != emptyValue && !!prevStop.StopTime && moment(stop.StopTime).diff(moment(prevStop.StopTime)) < 0)
				{
					stop.StopTime = prevStop.StopTime;
				}
				if (nextStop && nextStop.StopTime != emptyValue && !!nextStop.StopTime && moment(stop.StopTime).diff(moment(nextStop.StopTime)) > 0)
				{
					stop.StopTime = nextStop.StopTime;
				}

				if(!stop.StopTimeArrive && !stop.StopTimeDepart)
				{
					if(stop.PrimaryDeparture)
					{
						stop.StopTimeDepart = stop.StopTime;
					}
					else if(stop.PrimaryDestination)
					{
						stop.StopTimeArrive = stop.StopTime;
					}
					else
					{
						const pauseDuration = moment.duration(moment(stop.StopTimeDepart).diff(moment(stop.StopTimeArrive))).asMinutes();
			
						stop.StopTimeArrive = stop.StopTime;
						stop.StopTimeDepart = moment(stop.StopTimeArrive)
														.add(Math.ceil(pauseDuration), "minutes")
														.format("YYYY-MM-DDTHH:mm:ss");
					}	
				}		
			}
		}
	};

	RoutingDataModel.prototype.setStopTimeAfterSpeedChange = function(trip, changeSpeedStop)
	{
		var secondsDiff;
		let lockStop;
		let lockStopIndex;
		let i;
		for (i = 0; i < trip.FieldTripStops.length; i++)
		{
			if (trip.FieldTripStops[i].LockStopTime)
			{
				trip.FieldTripStops[i].ActualStopTime = trip.FieldTripStops[i].StopTime;
				lockStop = trip.FieldTripStops[i];
				lockStopIndex = i;
				break;
			}
		}
		if (!lockStopIndex && trip.FieldTripStops.length > 0)
		{
			trip.FieldTripStops[0].LockStopTime = true;
			trip.FieldTripStops[0].ActualStopTime = trip.FieldTripStops[0].StopTime;
			lockStop = trip.FieldTripStops[0];
			lockStopIndex = 0;
		}
		if (changeSpeedStop.Sequence >= lockStopIndex + 1)
		{
			for (i = lockStopIndex + 1; i < trip.FieldTripStops.length; i++)
			{
				let nextStopSequence = changeSpeedStop.Sequence + 1;
				if (trip.FieldTripStops[i].Sequence == nextStopSequence)
				{
					let stopTimeNew = moment(trip.FieldTripStops[i - 1].StopTime, "HH:mm:ss")
						.add(moment.duration(moment(trip.FieldTripStops[i - 1].Duration, "HH:mm:ss")).asMinutes(), "minutes").format("HH:mm:ss");
					secondsDiff = moment(stopTimeNew, "HH:mm:ss").diff(moment(trip.FieldTripStops[i].StopTime, "HH:mm:ss"), "seconds");
					trip.FieldTripStops[i].StopTime = stopTimeNew;
				}
				else if (trip.FieldTripStops[i].Sequence > nextStopSequence)
				{
					trip.FieldTripStops[i].StopTime = moment(trip.FieldTripStops[i].StopTime, "HH:mm:ss").add(secondsDiff, "seconds").format("HH:mm:ss");
				}
			}
		}
		else
		{
			for (i = lockStopIndex - 1; i > -1; i--)
			{
				if (trip.FieldTripStops[i].Sequence == changeSpeedStop.Sequence)
				{
					let stopTimeNew = moment(trip.FieldTripStops[i + 1].StopTime, "HH:mm:ss")
						.subtract(moment.duration(moment(trip.FieldTripStops[i].Duration, "HH:mm:ss")).asMinutes(), "minutes").format("HH:mm:ss");
					secondsDiff = moment(stopTimeNew, "HH:mm:ss").diff(moment(trip.FieldTripStops[i].StopTime, "HH:mm:ss"), "seconds");
					trip.FieldTripStops[i].StopTime = stopTimeNew;
				}
				else if (trip.FieldTripStops[i].Sequence < changeSpeedStop.Sequence)
				{
					trip.FieldTripStops[i].StopTime = moment(trip.FieldTripStops[i].StopTime, "HH:mm:ss").add(secondsDiff, "seconds").format("HH:mm:ss");
				}
			}
		}

		this.onTripStopTimeChangeEvent.notify({});
	};

	RoutingDataModel.prototype.getLockTimeStop = function(tripId)
	{
		var self = this;
		for (var i = 0; i < self.fieldTrips.length; i++)
		{
			if (self.fieldTrips[i].id == tripId)
			{
				for (var j = 0; j < self.fieldTrips[i].FieldTripStops.length; j++)
				{
					if (self.fieldTrips[i].FieldTripStops[j].LockStopTime)
					{
						return self.fieldTrips[i].FieldTripStops[j];
					}
				}
			}
		}
	};

	RoutingDataModel.prototype.getFieldTripStop = function(tripStopId)
	{
		const self = this,
			trips = self.fieldTrips;
		for (var i = 0, l = trips.length; i < l; i++)
		{
			var tripStops = trips[i].FieldTripStops;
			for (var j = 0; j < tripStops.length; j++)
			{
				if (tripStops[j].id == tripStopId || tripStops[j].oldId == tripStopId)
				{
					return tripStops[j];
				}
			}
		}
	};

	RoutingDataModel.prototype.getFieldTripStopBySequence = function(trip, sequence)
	{
		return Enumerable.From(trip.FieldTripStops).FirstOrDefault(null, function(c) { return c.Sequence == sequence; });
	};

	RoutingDataModel.prototype.getColorByTripId = function(tripId)
	{
		var trip = this.getFieldTripById(tripId);
		return trip ? trip.color : "#FFFFFF";
	};

	RoutingDataModel.prototype.changeTripColor = function(tripId, color, onlyRefreshTree)
	{
		var self = this;
		self.fieldTrips.map(function(trip)
		{
			if (trip.id == tripId)
			{
				trip.color = color;
				trip.FieldTripStops.map(function(tripStop)
				{
					tripStop.color = color;
				});
			}
		});
		if (onlyRefreshTree)
		{
			self.onTripTreeColorChangeEvent.notify({ FieldTripId: tripId, color: color });
		}

		self.onTripColorChangeEvent.notify({ FieldTripId: tripId, color: color });
		const fieldTrip = self.fieldTrips.filter(item => item.id === tripId)[0];
		PubSub.publish(TF.RoutingPalette.FieldTripMapEventEnum.UpdateColor, fieldTrip);
	};

	RoutingDataModel.prototype.bindColor = function(force = false)
	{
		var self = this;
		var trips = self.fieldTrips;
		trips.map(function(trip, index)
		{
			if (!trip.color || force)
			{
				var color = force ? self.colors[index] : self.generateColor(index);
				trip.color = color;
				trip.FieldTripStops.map(function(fieldTripStop)
				{
					fieldTripStop.color = color;
				});
			}
		});
	};

	RoutingDataModel.prototype.generateColor = function(index, vrpIndex)
	{
		var self = this,
			trips = self.fieldTrips,
			colors = this.colors;
		var notUsedColor = colors.filter(function(c)
		{
			return !Enumerable.From(trips).Any(function(t) { return t.color == c; });
		});
		if (vrpIndex >= 0) { return notUsedColor[vrpIndex] }
		index = index || self.fieldTrips.length;
		return notUsedColor.length > 0 ? notUsedColor[0] : colors[index % colors.length];
	};

	RoutingDataModel.prototype.changeTripVisibility = function(tripIds, visible)
	{
		var self = this;
		if (!$.isArray(tripIds))
		{
			tripIds = [tripIds];
		}
		self.fieldTrips.map(function(trip)
		{
			if (tripIds.indexOf(trip.id) >= 0)
			{
				trip.visible = visible;
			}
		});
		self.onChangeTripVisibilityEvent.notify({ TripIds: tripIds, visible: visible });

		const trips = self.fieldTrips.filter(trip => tripIds.includes(trip.id));
		PubSub.publish(TF.RoutingPalette.FieldTripMapEventEnum.ShowHide, trips);
	};

	RoutingDataModel.prototype.closeByFieldTrips = function(tripsToClose, notifyChange)
	{
		var self = this;
		var promise = Promise.resolve();
		if (tripsToClose && tripsToClose.length > 0)
		{
			tripsToClose.forEach(function(trip)
			{
				self.deleteChangeDataStackByTripId(trip.id);
			});
			self.unLockTripData(tripsToClose);
			self.removeNeedDeleteTrip(tripsToClose);
			if (notifyChange != false)
			{
				self.onTripsChangeEvent.notify({ add: [], edit: [], delete: tripsToClose });
			}
		}

		self.viewModel.routingChangePath && self.viewModel.routingChangePath.clearAll();
		self.clearContextMenuOperation();
		self.viewModel.editFieldTripStopModal.closeEditModal();
		self.fieldTripPaletteSectionVM.routingPaletteVM?.fieldTripMap?.confirmToExitAddingStop(false);
		// self.clearTripOriginalData(tripsToClose);
		return promise.then(function()
		{
			if (tripsToClose && tripsToClose.length > 0)
			{
				self.onTripsChangeEvent.notify({ add: [], edit: self.getEditTrips(), delete: [], draw: false });
			}
		});
	};

	RoutingDataModel.prototype.closeAllEditTrips = function()
	{
		var self = this;
		return self.closeByFieldTrips(self.getEditTrips());
	};

	RoutingDataModel.prototype.closeUnsavedNewFieldTrips = function(fieldTrips, noSaveCheck, exceptTrips)
	{
		var self = this, p = Promise.resolve(false);
		if (!noSaveCheck)
		{
			p = self.unSaveConfirmBox(fieldTrips);
		}
		return p.then(function(ans)
		{
			var savePromise = Promise.resolve(ans);
			if (ans)
			{
				savePromise = self.saveRoutingFieldTrips(fieldTrips);
			}
			return savePromise.then(function(result)
			{
				tf.loadingIndicator.showImmediately();

				if (!result)
				{
					fieldTrips.forEach(function(trip)
					{
						self.deleteChangeDataStackByTripId(trip.id);
					});

				}

				if (fieldTrips.length > 0)
				{
					self.removeNeedDeleteTrip(fieldTrips);
					self.onTripsChangeEvent.notify({
						add: [],
						edit: self.getEditTrips().filter(function(a) { return !Enumerable.From(exceptTrips).Any(function(b) { return b.id == a.id; }); }),
						delete: fieldTrips
					});
				}

				self.clearContextMenuOperation();
				self.viewModel.editFieldTripStopModal.closeEditModal();
				self.mapCanvasPage.setMode("Routing", "Normal");
				tf.loadingIndicator.tryHide();
				// self._updateTravelScenarioLock();
			});
		});
	};

	RoutingDataModel.prototype._updateTravelScenarioLock = function()
	{
		var self = this,
			travelScenarioIds = self.fieldTrips.map((trip) => { return trip.TravelScenarioId; });
		if (!self.lockTravelScenarioIds)
		{
			self.lockTravelScenarioIds = [];
		}
		var addIds = [], deleteIds = [];
		travelScenarioIds.forEach((id) =>
		{
			if (self.lockTravelScenarioIds.indexOf(id) < 0)
			{
				addIds.push(id);
			}
		});

		self.lockTravelScenarioIds.forEach((id) =>
		{
			if (travelScenarioIds.indexOf(id) < 0)
			{
				deleteIds.push(id);
			}
		});
		addIds.length > 0 && TF.RoutingMap.TravelScenariosPalette.TravelScenariosDataModel.useTravelScenario(addIds, self.routeState);
		deleteIds.length > 0 && TF.RoutingMap.TravelScenariosPalette.TravelScenariosDataModel.unUseTravelScenario(deleteIds, self.routeState);
		self.lockTravelScenarioIds = travelScenarioIds;
	};

	RoutingDataModel.prototype.removeNeedDeleteTrip = function(deleteTrips)
	{
		const self = this;
		self.setFieldTrips(self.fieldTrips.filter(function(trip)
		{
			return !Enumerable.From(deleteTrips).Any(function(c) { return c.id == trip.id || c.id == trip.Id || c.Id == trip.id || c.oldId == trip.Id || c.oldId == trip.id; });
		}));
	};

	RoutingDataModel.prototype.closeByViewFieldTrips = function(viewTripsToClose)
	{
		var self = this;
		var promise = Promise.resolve();
		if (viewTripsToClose.length > 0)
		{
			self.removeNeedDeleteTrip(viewTripsToClose);
			self.onTripsChangeEvent.notify({ add: [], edit: [], delete: viewTripsToClose });
		}
		self.clearContextMenuOperation();
		self.viewModel.editFieldTripStopModal.closeEditModal();
		self.fieldTripPaletteSectionVM.routingPaletteVM?.fieldTripMap?.confirmToExitAddingStop(false);
		return promise;
	};

	RoutingDataModel.prototype.closeAllViewTrips = function()
	{
		var self = this;
		return self.closeByViewFieldTrips(self.getViewTrips());
	};

	RoutingDataModel.prototype.getViewTrips = function()
	{
		var self = this;
		return self.fieldTrips.filter(function(trip)
		{
			return trip.OpenType === "View";
		});
	};

	RoutingDataModel.prototype.getEditTrips = function()
	{
		var self = this;
		return self.fieldTrips.filter(function(trip)
		{
			return trip.OpenType === "Edit";
		});
	};

	RoutingDataModel.prototype.isHighlighted = function() { return false; };

	RoutingDataModel.prototype.unSaveCheckConfirmBox = function(tripsToClose, openTrips)
	{
		var self = this;
		if (tripsToClose.length == 0)
		{
			return Promise.resolve(true);
		}

		var editTrips = self.getEditTrips();
		if (!openTrips)
		{
			openTrips = editTrips.filter(function(trip)
			{
				return !Enumerable.From(tripsToClose).Any(function(c) { return c.id == trip.Id || c.Id == trip.Id || c.Id == trip.id || c.id == trip.id; });
			});
		}

		var message = null;

		return self.unSaveConfirmBox(tripsToClose, message).then(function(ans)
		{
			if (ans)
			{
				var changedTripsToClose = self.getChangedTrips(tripsToClose);
				var failMessage = self.checkDataValid(changedTripsToClose);
				if (failMessage)
				{
					tf.promiseBootbox.alert(
						{
							message: failMessage,
							title: "Error"
						});
					return Promise.resolve();
				}
				return self.saveRoutingFieldTrips(changedTripsToClose);
				// self.refresh(openTrips);
			}

			return Promise.resolve(true);
		});
	};

	RoutingDataModel.prototype.unSaveConfirmBox = function(trips, message)
	{
		var self = this;
		return self.unSaveCheck(trips).then(function(isChanged)
		{
			if (isChanged)
			{
				return tf.promiseBootbox.yesNo({
					message: message || "There are unsaved changes. Do you want to save your changes?",
					title: "Unsaved Changes"
				});
			}
			return false;
		});
	};

	RoutingDataModel.prototype.unSaveCheck = function(tripsToClose)
	{
		var self = this;
		return self.viewModel.editFieldTripStopModal.beforeChangeData().then(function(ans)
		{
			if (ans)
			{
				return self.save().then(function()
				{
					return false;
				});
			}
			return self.getChangedTrips(tripsToClose).length > 0;
		});
	};

	RoutingDataModel.prototype.getChangedTrips = function(tripsToClose)
	{
		var self = this;
		var trips = tripsToClose || self.fieldTrips.slice();
		var changeTrips = self.getChangeTripIds();
		return trips.filter(function(trip)
		{
			return Enumerable.From(changeTrips).Any(function(c) { return c == trip.id; });
		});
	};

	// #region edit

	RoutingDataModel.prototype.update = function(items, isNoStopChange)
	{
		var self = this,
			tripStops = self.singleToArray(items).filter(({type})=>type === "tripStop");

		if (tripStops.length > 0)
		{
			return self.fieldTripStopDataModel.update(tripStops, false, isNoStopChange);
		}
	};

	// #endregion

	RoutingDataModel.prototype.deleteTrip = function(trip)
	{
		var self = this, promises = [];
		if (trip.Id && !tf.authManager.authorizationInfo.isAuthorizedFor("trip", "delete"))
		{
			return tf.promiseBootbox.alert("you don't have permission to delete trip");
		}

		tf.promiseBootbox.yesNo({
			message: "Are you sure you want to delete this trip?",
			title: "Confirm"
		}).then(function(ans)
		{
			if (ans)
			{
				var resultObject = self.handleRelatedTrip([trip], 'revert');
				if (resultObject.message)
				{
					tf.promiseBootbox.confirm({
						message: resultObject.message,
						title: "Confirmation"
					}).then(function(result)
					{
						if (result)
						{
							deleteTrip(trip);
							self.revert(resultObject.trips.filter(function(t)
							{
								return !Enumerable.From([trip]).Any(function(p) { return p.id == t.id; });
							}));
						}
					});
				}
				else
				{
					deleteTrip(trip);
				}
			}
		});

		function deleteTrip(trip)
		{
			var deletePromise = Promise.resolve();
			if (trip.Id)
			{
				deletePromise = tf.promiseAjax.delete(pathCombine(tf.api.apiPrefix(), "trips?id=" + trip.id));
			}
			deletePromise.then(function()
			{
				// save trip geometry data
				promises.push(self.featureData.delete(trip.id));
				Promise.all(promises).then(function()
				{
					self.closeByFieldTrips([trip]);
					self.tripLockData.saveData([trip]);
				});
			});
		}
	};

	RoutingDataModel.prototype.save = function(trips)
	{
		var self = this;
		if (!trips || trips.length == 0)
		{
			trips = self.fieldTrips;
		}
		var failMessage = self.checkDataValid(trips);
		if (failMessage)
		{
			tf.promiseBootbox.alert(
				{
					message: failMessage,
					title: "Error"
				});
			return Promise.resolve();
		}
		self.viewModel.routingChangePath.stop();
		return self.saveRoutingFieldTrips(trips).then(function(success)
		{
			if (success)
			{
				self.showSaveSuccessToastMessage();
				self.updateTripOriginalData(trips);
				self.onTripDisplayRefreshEvent.notify(self.fieldTrips);
				self.tripLockData.lockIds(trips.filter(function(trip)
				{
					return trip.Id && trip.OpenType != "View";
				}).map(i => i.Id));
			}
		});
	};

	RoutingDataModel.prototype.saveFieldTrip = function(fieldTrips)
	{
		var self = this;
		if (!fieldTrips || fieldTrips.length == 0)
		{
			fieldTrips = this.fieldTrips;
		}
		var failMessage = self.checkDataValid(fieldTrips);
		if (failMessage)
		{
			tf.promiseBootbox.alert(
				{
					message: failMessage,
					title: "Error"
				});
			return Promise.resolve();
		}
		self.viewModel.routingChangePath.stop();
		return self.saveRoutingFieldTrips(fieldTrips).then(function(success)
		{
			if (success)
			{
				self.showSaveSuccessToastMessage();
				self.updateTripOriginalData(fieldTrips);
				self.tripLockData.lockIds(fieldTrips.filter(function(trip)
				{
					return trip.Id && trip.OpenType != "View";
				}).map(i => i.Id));
			}
		});
	};

	RoutingDataModel.prototype.checkDataValid = function(trips)
	{
		var i, j;
		for (i = 0; i < trips.length; i++)
		{
			for (j = i + 1; j < trips.length; j++)
			{
				if (trips[i].Name === trips[j].Name)
				{
					return `The field trip name '${trips[i].Name}' is not unique. Please keep each field trip name unique before saving.`;
				}
			}
		}
		return null;
	};

	RoutingDataModel.prototype.saveRoutingFieldTrips = function(fieldTrips)
	{
		var self = this;
		if (self.saving)
		{
			return Promise.resolve(false);
		}
	
		let copiedTrips = fieldTrips.filter(t => !!t.copyFromFieldTripId);
	
		return Promise.resolve(fieldTrips.every(x => (x.Name || "").trim() !== "")).then(function(valid)
		{
			if (!valid)
			{
				return Promise.reject();
			}
	
			self.clearRevertInfo();
			tf.loadingIndicator.show();
	
			// return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "tripresources"), {
			// 	paramData: {
			// 		"DBID": tf.datasourceManager.databaseId,
			// 		"@filter": "in(FieldTripId," + fieldTrips.map(x => x.id).join(",") + ")",
			// 		"@fields": "FieldTripId,StartDate,EndDate,IsTripLevel"
			// 	}
			// })
			return Promise.resolve(null)
			.then(function(response)
			{
				const tripResources = response && response.Items && response.Items.length > 0 ? response.Items.filter(c => !c.IsTripLevel) : null;
				// Check if any trip's assignment has been updated.
				let shouldUpdateTripResource = false;
	
				fieldTrips.forEach((trip) =>
				{
					trip.oldId = trip.id;
					trip.UnsavedNewTrip = false;
					const relatedTripResources = tripResources && tripResources.length > 0 ? tripResources.filter(c => c.FieldTripId == trip.id) : null;
					const originalAssignment = self.originalTripAssignment[trip.id];
					if (self.hasFutureResource(relatedTripResources))
					{
						if (!shouldUpdateTripResource && originalAssignment)
						{
							if (self.compareTripAssignment(trip, originalAssignment))
							{
								shouldUpdateTripResource = true;
							}
						}
					}
				});
	
				if (shouldUpdateTripResource)
				{
					shouldUpdateTripResource = tf.promiseBootbox.yesNo(
						"Future resource substitution exist.  Do you want to replace them with this change?",
						"Confirmation"
					);
				}
	
				return Promise.resolve(shouldUpdateTripResource)
					.then(result =>
					{
						return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "routingfieldtrips"),
							{
								/* paramData: { affectFutureResource: result }, */
								data: fieldTrips
							})
							.then((response) =>
							{
								const savedTrips = response.Items;
	
								copiedTrips = savedTrips.reduce(function(result, st)
								{
									const matched = copiedTrips.find(x => x.Name === st.Name);
									if (!matched)
									{
										return result;
									}
	
									return result.concat({ ...st, copyFromTripId: matched.copyFromTripId })
								}, []);
								
								fieldTrips.forEach(function(trip)
								{
									self.deleteChangeDataStackByTripId(trip.oldId);
									var savedTrip = Enumerable.From(savedTrips).FirstOrDefault({}, function(c) { return c.Name == trip.Name; });
									// change id from local create to match the create after save 
									self.featureData.changeId(trip, savedTrip);
								});
	
								self.onTripSaveEvent.notify(fieldTrips);
								self.tripLockData.saveData(fieldTrips);
								self.saving = false;
								tf.loadingIndicator.tryHide();
								return Promise.resolve(true);

							}).catch(function(error)
							{
								tf.loadingIndicator.tryHide();
								if (error.Message) { tf.promiseBootbox.alert({ message: error.Message, title: "Error" }); }
								self.saving = false;
								return false;
							});
					});
			});
		});
	};

	RoutingDataModel.prototype.copyTripUDFs = function(copiedTrips)
	{
		// It's ok even copiedTrips is empty.
		return Promise.all(copiedTrips.map(trip => Promise.all([
			tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "trips"), {
				paramData: {
					"@relationships": "UDF",
					id: trip.copyFromTripId
				}
			}).then((r => r.Items[0])),
			tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "trips"), {
				paramData: {
					id: trip.id
				}
			}).then((r => r.Items[0]))
		]).then(function([originalTrip, copiedTrip])
		{
			// 19:Roll-up   20:Case
			copiedTrip.UserDefinedFields = originalTrip.UserDefinedFields.filter(x => ![19, 20].includes(x.TypeId));

			return tf.promiseAjax.put(pathCombine(tf.api.apiPrefix(), "trips"), {
				paramData: {
					"@relationships": "UDF",
					affectFutureResource: false
				},
				data: [copiedTrip]
			})
		})));
	};

	RoutingDataModel.prototype.compareTripAssignment = function(prev, cur)
	{
		return (((cur.DriverId || prev.DriverId) && cur.DriverId !== prev.DriverId)
			|| ((cur.AideId || prev.AideId) && cur.AideId !== prev.AideId)
			|| ((cur.VehicleId || prev.VehicleId) && cur.VehicleId !== prev.VehicleId));
	};

	RoutingDataModel.prototype.hasFutureResource = function(tripResources)
	{
		let hasFutureResource = false;
		if (tripResources && tripResources.length > 0)
		{
			let currentDate = moment().utc().startOf('day').add('s', -1); // include today
			for (let i = 0; i < tripResources.length; i++)
			{
				const startDate = moment.utc(tripResources[i].StartDate);
				const endDate = moment.utc(tripResources[i].EndDate);
				if (startDate.isAfter(currentDate) || endDate.isAfter(currentDate))
				{
					hasFutureResource = true;
					break;
				}
			}
		}
		return hasFutureResource
	};

	RoutingDataModel.prototype.revert = function(trips)
	{
		var self = this;
		var reopenTrips = self.getEditTrips().filter(function(t) { return t.Id; });
		var travelScenarios = new Map();
		trips.forEach((trip) => { travelScenarios.set(trip.TravelScenarioId, trip.TravelScenarioName); });
		return self.close(trips).then(function()
		{
			if (trips.length == 0 || reopenTrips.length == 0)
			{
				return;
			}
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "fieldtrips"), {
				paramData: {
					"@filter": "in(Id," + reopenTrips.map(function(t) { return t.Id; }).join(",") + ")"
				}
			}).then(function(response)
			{
				response.Items.forEach((trip) => { trip.TravelScenarioName = travelScenarios.get(trip.TravelScenarioId); })
				return self.setOpenFieldTrips(response.Items, true).then(function()
				{
					return self.showRevertSuccessToastMessage();
				});
			});
		});
	};

	RoutingDataModel.prototype.close = function(trips, notifyChange)
	{
		var self = this;
		trips = trips || self.fieldTrips;
		self.featureData.clear();
		self.clearRevertInfo();
		self.viewModel.routingChangePath && self.viewModel.routingChangePath.clearAll();
		var unsavedNewTrips = [], viewTrips = [], editTrips = [];
		trips.map(function(trip)
		{
			if (trip)
			{
				if (trip.UnsavedNewTrip && trip.OpenType === "Edit")
				{
					unsavedNewTrips.push(trip);
				}
				else if (trip.OpenType === "Edit")
				{
					editTrips.push(trip);
				}
				else
				{
					viewTrips.push(trip);
				}
			}
		});
		if (viewTrips && viewTrips.length > 0)
		{
			self.closeByViewFieldTrips(viewTrips);
		}
		var promise = Promise.resolve();
		if (unsavedNewTrips.length > 0)
		{
			promise = self.closeUnsavedNewFieldTrips(unsavedNewTrips, true, editTrips);
		}
		if (editTrips.length > 0)
		{
			return promise.then(function()
			{
				return self.closeByFieldTrips(editTrips, notifyChange);
			});
		}
		else
		{
			return promise;
		}
	};

	RoutingDataModel.prototype.refresh = function(refreshTrips)
	{
		var self = this;

		// only exists trip can be refresh
		refreshTrips = (refreshTrips || []).filter(function(trip)
		{
			return Enumerable.From(self.fieldTrips).Any(function(c) { return c.id == trip.id || c.Id == trip.id; });
		});

		if (refreshTrips.length > 0)
		{
			var trips = refreshTrips.slice();
			self.featureData.clear();
			self.clearRevertInfo();
			self.viewModel.routingChangePath.clearAll();
			self.setFieldTrips(self.getViewTrips());
			self.changeDataStack([]);
			self.onTripsChangeEvent.notify({ add: [], edit: [], delete: trips });
			self.setOpenFieldTrips(refreshTrips);
		}
	};

	RoutingDataModel.prototype.unLockTripData = function(trips)
	{
		var self = this,
			isCloseAll = trips.length == self.fieldTrips.length;

		if (isCloseAll)
		{
			this.tripLockData.unLockCurrentDocument();
		} else
		{
			var tripIds = trips.map(function(trip) { return trip.id || trip.Id; });
			this.tripLockData.unLock(tripIds);
		}
	};

	// #region setting

	RoutingDataModel.prototype.getStorage = function()
	{
		// convert 
		const defaultSpeed = tf.measurementUnitConverter.convert({
			value: 19,
			originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Imperial,
			targetUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric
		});

		return {
			autoRefresh: { key: "autoRefreshRouting", default: false },
			moveDuplicateNodes: { key: "moveDuplicateNodesRouting", default: false },
			removeOverlapping: { key: "removeOverlappingRouting", default: true },
			smartSequence: { key: "smartSequenceRouting", default: false },
			fillPattern: { key: "fillPatternRouting", default: "Semi" },
			uTurnPolicy: { key: "uTurnPolicyRouting", default: 1 },
			impedanceAttribute: { key: "impedanceAttrRouting", default: "Time" },
			pathThickness: { key: "pathThicknessRouting", default: 5 },
			boundaryThickness: { key: "boundaryThicknessRouting", default: 2 },
			boundaryLineStyle: { key: "boundaryLineStyleRouting", default: "short-dot" },
			showAssignedStudents: { key: "showAssignedStudentsRouting", default: true },
			showAssignedStudentsCount: { key: "showAssignedStudentsCountRouting", default: false },
			studentCountLabelColor: { key: "studentCountLabelColorRouting", default: "" },
			showLabel: { key: "routingTripStopShowLabel", default: false },
			arrowPosition: { key: "arrowPosition", default: 1 },
			geoLink: { key: "geoLink", default: false },
			avgSpeed: { key: "avgSpeed", default: defaultSpeed },
			speedType: { key: "speedType", default: 0 },
			showStopBoundary: { key: "showStopBoundary", default: true }
		};
	};

	RoutingDataModel.prototype.getGeoLinkSetting = function()
	{
		var storages = this.getStorage();
		var storageKey = storages.geoLink.key;
		var defaults = storages.geoLink.default;
		return this.getSettingByKey(storageKey, "", defaults);
	};

	RoutingDataModel.prototype.getSmartSequenceSetting = function()
	{
		var storages = this.getStorage();
		var storageKey = storages.smartSequence.key;
		var defaults = storages.smartSequence.default;
		return this.getSettingByKey(storageKey, "", defaults);
	};

	RoutingDataModel.prototype.setSmartSequenceSetting = function(value)
	{
		var storages = this.getStorage();
		var storageKey = storages.smartSequence.key;
		tf.storageManager.save(storageKey, value);
		this.onSettingChangeEvent.notify();
	};
	// #endregion

	// #region assign and not assign student

	RoutingDataModel.prototype.getUnAssignStudentInBoundaryProhibitCross = function(stop)
	{
		var self = this;
		var allNewAssignStudents = self.getUnAssignStudentInBoundary([stop.boundary]);
		return self.getStudentRemoveCrosser(stop, allNewAssignStudents);
	};

	RoutingDataModel.prototype.getUnAssignStudentInBoundary = function(boundaries, students, needCopyStudent)
	{
		var self = this;
		var intersects = tf.map.ArcGIS.geometryEngine.intersects;
		var allNewAssignStudents = [];
		var allNewAssignStudentsMapping = {};

		if (!$.isArray(boundaries))
		{
			boundaries = [boundaries];
		}

		boundaries = boundaries.filter(x => x.geometry);

		if (boundaries.length == 0)
		{
			return [];
		}

		if (!students)
		{
			students = self.routingStudentManager.getCandidates(boundaries[0].FieldTripId);
		}

		boundaries.forEach(function(boundary)
		{
			if (!boundary)
			{
				return;
			}
			boundary.newAssignStudent = [];
			students.forEach(function(student)
			{
				if (!student.geometry)
				{
					student.geometry = TF.xyToGeometry(student.XCoord, student.YCoord);
				}
				if (student.geometry.x >= boundary.geometry.extent.xmin && student.geometry.x <= boundary.geometry.extent.xmax && student.geometry.y >= boundary.geometry.extent.ymin && student.geometry.y <= boundary.geometry.extent.ymax)
				{
					if (!allNewAssignStudentsMapping[student.id + "-" + student.RequirementID + "-" + student.PreviousScheduleID]
						&& boundary.geometry && intersects(boundary.geometry, student.geometry) && student.Session != TF.Helper.TripHelper.Sessions.Shuttle)
					{
						var isInSchoolStopIds = false;
						if (needCopyStudent)
						{
							var trip = self.getFieldTripById(boundary.FieldTripId);
							if (trip)
							{
								var tripstop = trip.FieldTripStops.filter(r => r.boundary.TripStopId == boundary.TripStopId)[0];
								if (tripstop)
								{
									var schoolStopIds = self.routingStudentManager.findSchoolStopIds(trip, tripstop, student);
									if (schoolStopIds.length !== 0)
									{
										isInSchoolStopIds = true;
									}
								}
							}
						}
						else
						{
							isInSchoolStopIds = true;
						}

						if (isInSchoolStopIds)
						{
							var newStudent = student;
							if (needCopyStudent)
							{
								newStudent = $.extend({}, student);
								TF.loopCloneGeometry(newStudent, student);
							}
							boundary.newAssignStudent.push(newStudent);
							allNewAssignStudents.push(newStudent);
							allNewAssignStudentsMapping[newStudent.id + "-" + newStudent.RequirementID + "-" + newStudent.PreviousScheduleID] = true;
						}
					}
				}
			});
		});
		return allNewAssignStudents;
	};

	RoutingDataModel.prototype.getStudentRemoveCrosser = function(stop, newAssignStudents, trip, isAssignStudent)
	{
		let self = this;
		let allNewAssignStudents = newAssignStudents.slice();
		// exclude the ungeocode and exception student.
		let needCalcuAcrossStreetStudents = allNewAssignStudents.filter(stu => stu.XCoord != 0 && stu.YCoord != 0 && stu.RequirementID);

		return self.viewModel.drawTool.NAtool._getAcrossStreetStudents(stop, needCalcuAcrossStreetStudents, null, trip, isAssignStudent).then(function(results)
		{
			var crossStudentIds = results[0];
			var stopCrossStudentIds = results[3] || [];
			var allNewAssignStudentsMap = {};
			allNewAssignStudents.forEach(function(student)
			{
				allNewAssignStudentsMap[student.id] = true;
				setDlyCrossToStop(student);
			});

			function setDlyCrossToStop(student)
			{
				if (allNewAssignStudentsMap[student.id])
				{
					student.CrossToStop = crossStudentIds.indexOf(student.id) > -1;
					student.StopCrosser = stopCrossStudentIds.indexOf(student.id) > -1;
				}
			}

			stop.Students && stop.Students.forEach(function(student)
			{
				setDlyCrossToStop(student);
			});

			self.tripStopDictionary[stop.id] && self.tripStopDictionary[stop.id].forEach(function(studentEntity)
			{
				setDlyCrossToStop(studentEntity.student);
			});

			var crossProhibitStreetStudentIds = results[1];

			allNewAssignStudents = allNewAssignStudents.filter(function(c)
			{
				return !c.ProhibitCross || crossStudentIds.indexOf(c.id) < 0;
			});

			allNewAssignStudents = allNewAssignStudents.filter(function(c)
			{
				return crossProhibitStreetStudentIds.indexOf(c.id) < 0;
			});

			if (stop.ProhibitCrosser)
			{
				allNewAssignStudents = allNewAssignStudents.filter(function(c)
				{
					return crossStudentIds.indexOf(c.id) < 0;
				});
			}

			return Promise.resolve(allNewAssignStudents);
		});
	};

	// #endregion

	RoutingDataModel.prototype.deleteChangeDataStackByTripId = function(tripId)
	{
		var self = this;
		this.changeDataStack(this.changeDataStack().filter(function(data)
		{
			var records = data;
			if (!$.isArray(data))
			{
				records = [data];
			}
			return self.getFieldTripId(records[0]) != tripId;
		}));
	};

	RoutingDataModel.prototype.getChangeTripIds = function()
	{
		var self = this;
		var tripIdObj = {};
		this.changeDataStack().forEach(function(data)
		{
			var records = data;
			if (!$.isArray(data))
			{
				records = [data];
			}
			records.forEach(function(record)
			{
				tripIdObj[self.getFieldTripId(record)] = record;
			});
		});

		var tripIds = [];
		for (var key in tripIdObj)
		{
			tripIds.push(key);
		}
		return tripIds;
	};

	RoutingDataModel.prototype.calcSelfChangeCount = function()
	{
		var self = this;
		return self.getChangeTripIds().length;
	};

	RoutingDataModel.prototype.getFieldTripId = function(data)
	{
		switch (data.type)
		{
			case "tripStop":
				return data.FieldTripId;
			case "trip":
				return data.id;
		}
	};

	RoutingDataModel.prototype.getBoundaryHeartId = function(boundaryGraphic)
	{
		return boundaryGraphic.attributes.dataModel.TripStopId;
	};

	RoutingDataModel.prototype.getHeartBoundaryId = function(pointGraphic)
	{
		return pointGraphic.attributes.dataModel.boundary.id;
	};

	RoutingDataModel.prototype.onSchoolLocationDataSourceChange = function(e, data)
	{
		var isSchoolLocationChanged = Enumerable.From(data.UpdatedRecords).Any(function(c) { return c.Type == "SchoolLocation"; });
		if (isSchoolLocationChanged && this.fieldTrips.length > 0)
		{
			this.onSchoolLocationChangeEvent.notify();
		}
	};

	RoutingDataModel.prototype.validateName = function(name, id)
	{
		if (name.trim() === '')
		{
			tf.promiseBootbox.alert("Field Trip name is required.");
			return Promise.reject();
		}

		if (name.length > 200)
		{
			tf.promiseBootbox.alert("Field Trip name should be less than 201 characters.");
			return Promise.reject();
		}

		return Promise.resolve();
	};

	RoutingDataModel.prototype.getKey = function(studentId, requirementId, tripStopId, anotherTripStopID, previousScheduleID)
	{
		if (requirementId)
		{
			return `${studentId}_${requirementId}_${previousScheduleID}`;
		}
		else
		{
			return `${studentId}_StopID${tripStopId}_${anotherTripStopID}_${previousScheduleID}`;
		}
	}

	RoutingDataModel.prototype.getVRPSetting = function()
	{
		return {
			capacity: tf.storageManager.get("vrpCapacityChange"),
			totalDistance: tf.storageManager.get("vrpMaxTripDistanceChange"),
			ridingTime: tf.storageManager.get("vrpMaxRidingTimeChange"),
			totalTime: tf.storageManager.get("vrpMaxTripTimeChange")
		};
	};

	RoutingDataModel.prototype.changeDataStackChange = function()
	{
		var self = this;
		self.getChangedTrips().forEach(function(trip)
		{
		});
	};

	RoutingDataModel.prototype.getSyncEditTripStopsCount = function(data)
	{

	};

	RoutingDataModel.prototype.confirmSyncEditTripStops = function(tripStops, type)
	{
		var self = this;
		if (tripStops.length == 0)
		{
			return;
		}
		tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.SelectTripStopModalViewModel(tripStops, type, true))
			.then(function(tripStops)
			{
				if (!tripStops || tripStops.length == 0)
				{
					return;
				}
				self.fieldTripEditBroadcast.syncEditTripStops(tripStops);
			});
	};

	RoutingDataModel.prototype.syncEditTripStops = function(tripStops)
	{
	};

	RoutingDataModel.prototype.dispose = function()
	{
		const self = this;
		self.tripLockData.unLockCurrentDocument();
		self.onTripsChangeEvent.unsubscribeAll();
		self.fieldTripEditBroadcast.dispose();
		self.onTripColorChangeEvent.unsubscribeAll();
		self.onChangeTripVisibilityEvent.unsubscribeAll();
		self.onWalkTSRestrictionChangeEvent.unsubscribeAll();
		// self.streetDataModel.onStreetModifyEvent.unsubscribe(self.onStreetModifyEvent);
		self.onShowChartChangeEvent.unsubscribeAll();
		self.mapCanvasPage.onUpdateRecordsEvent.unsubscribe(self.onSchoolLocationDataSourceChange);
		self.onSchoolLocationChangeEvent.unsubscribeAll();
		PubSub.unsubscribe(self.stopPathChange);
		self.tripLockData.dispose();
		self.fieldTripStopDataModel.dispose();
		tfdispose(self);
	};

	RoutingDataModel.isSchoolsEqual = function(currentSchools, originalSchools)
	{
		if (!currentSchools || !originalSchools) { return false; }
		return currentSchools.replace(/\s/g, "").replace(/,/g, "!").split("!").filter(function(c) { return c; }).sort().join() == originalSchools.replace(/\s/g, "").replace(/,/g, "!").split("!").filter(function(c) { return c; }).sort().join();
	};

	RoutingDataModel.checkCriteria = function(tripA, tripB)
	{
		return tripA.Session == tripB.Session
			&& RoutingDataModel.isSchoolsEqual(tripA.Schools, tripB.Schools)
			&& !!tripA.BusAide == !!tripB.BusAide
			&& tripA.Disabled == tripB.Disabled
			&& (tripA.FilterName || "") == (tripB.FilterName || "")
			&& tripA.NonDisabled == tripB.NonDisabled
			&& tripA.Monday == tripB.Monday
			&& tripA.Tuesday == tripB.Tuesday
			&& tripA.Wednesday == tripB.Wednesday
			&& tripA.Thursday == tripB.Thursday
			&& tripA.Friday == tripB.Friday
			&& tripA.Saturday == tripB.Saturday
			&& tripA.Sunday == tripB.Sunday
			&& tripA.StartDate == tripB.StartDate
			&& tripA.EndDate == tripB.EndDate
			&& (tripA.FilterSpec || "") == (tripB.FilterSpec || "")
			&& tripA.TravelScenarioId == tripB.TravelScenarioId;
	};

	RoutingDataModel.checkFieldTripCriteria = function(tripA, tripB)
	{
		return true;
	};

	RoutingDataModel.prototype.copyFieldTrip = function(newTrip)
	{
		var self = this;
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), tf.DataTypeHelper.getEndpoint("FieldTrip")), {
			paramData: {
				copyFromId: newTrip.Id,
				fieldTripName: newTrip.Name
			}
		})
		.then(function(response)
		{
			if (response && response.StatusCode === 404)
			{//change the api side to avoid http error, using response status 404 to identify the nonexistence.
				return Promise.reject(response);
			}
			self.showSaveSuccessToastMessage();
			return true;
		}.bind(self))
		.catch(function(response)
		{
			if (response && response.StatusCode === 412)
			{
				tf.promiseBootbox.alert(
					{
						message: response.Message,
						title: "Error"
					});		
				return Promise.reject(response);
			}

			if (response && response.StatusCode === 404)
			{
				return Promise.reject(response);
			}
		}.bind(self));
	}

	RoutingDataModel.sessions = [
		{ name: "To School", session: 0 },
		{ name: "From School", session: 1 },
		{ name: "Shuttle", session: 2 },
		{ name: "Both", session: 3 }
	];
})();
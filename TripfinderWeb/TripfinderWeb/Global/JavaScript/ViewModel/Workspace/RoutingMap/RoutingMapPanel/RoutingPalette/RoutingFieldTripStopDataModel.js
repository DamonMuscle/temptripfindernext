(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingFieldTripStopDataModel = RoutingFieldTripStopDataModel;

	function RoutingFieldTripStopDataModel(dataModel)
	{
		var self = this;
		self.dataModel = dataModel;
		self.fieldTripPaletteSectionVM = dataModel.fieldTripPaletteSectionVM;
		self.featureData = dataModel.featureData.tripStopFeatureData;
		self.tripBoundaryFeatureData = dataModel.featureData.tripBoundaryFeatureData;
		self.tripPathFeatureData = dataModel.featureData.tripPathFeatureData;
		self.mapCanvasPage = dataModel.fieldTripPaletteSectionVM.mapCanvasPage;
		self.currentTripStudentsCount = 0;
		self.onFieldTripStopUpdatedEvent = new TF.Events.Event();

		Object.defineProperty(self, "viewModel",
		{
			get()
			{
				console.log("This property is obsoleted, please use fieldTripPaletteSectionVM instead. it should be removed in future.(RoutingFieldTripStopDataModel)")
				return self.fieldTripPaletteSectionVM;
			},
			enumerable: false,
		});
		Object.defineProperty(self, "_viewModal",
		{
			get()
			{
				console.log("This property is obsoleted, please use mapCanvasPage instead. it should be removed in future.(RoutingFieldTripStopDataModel)")
				return self.mapCanvasPage;
			},
			enumerable: false,
		});
	}

	RoutingFieldTripStopDataModel.prototype.create = function(newData, isFromRevert, insertToSpecialSequenceIndex, isSearchCreate)
	{
		var self = this;
		self.mapCanvasPage.revertMode = "create-TripStop";
		self.mapCanvasPage.revertData = [];
		var data = self.createNewData(newData);
		data.OpenType = "Edit";
		data.type = "tripStop";
		self.insertTripStopToTrip(data, insertToSpecialSequenceIndex);

		self.fieldTripPaletteSectionVM.routingPaletteVM.fieldTripMapOperation?.applyAddFieldTripStops([{...data, Sequence: insertToSpecialSequenceIndex + 1, VehicleCurbApproach: data.vehicleCurbApproach}], function()
		{
			if (!isSearchCreate)
			{
				self.fieldTripPaletteSectionVM.routingPaletteVM.fieldTripMapOperation?.startAddFieldTripStop();
			}

			self.insertToRevertData(data);

			self.dataModel.onTripStopsChangeEvent.notify({
				add: [data],
				delete: [],
				edit: []
			});

			self.dataModel.changeTripVisibility(data.FieldTripId, true);
			self.changeRevertStack(data, isFromRevert);
		});
	};

	RoutingFieldTripStopDataModel.prototype.createMultiple = function(tripStops)
	{
		const self = this;
		if (!tripStops)
		{
			return Promise.resolve();
		}

		self.mapCanvasPage.revertMode = "create-TripStop";
		self.mapCanvasPage.revertData = [];

		const targetFieldTrip = self.dataModel.getFieldTripById(tripStops[0].FieldTripId);
		const stops = tripStops.filter(Boolean).map(function(tripStop)
		{
			tripStop = self.createNewData(tripStop);
			tripStop.OpenType = "Edit";
			tripStop.Sequence = _.last(targetFieldTrip.FieldTripStops).Sequence;
			tripStop.VehicleCurbApproach = tripStop.vehicleCurbApproach;
			self.insertTripStopToTrip(tripStop, tripStop.Sequence - 1);
			tripStop.type = "tripStop";
			return tripStop;
		});

		return self.fieldTripPaletteSectionVM.routingPaletteVM.fieldTripMapOperation?.applyAddFieldTripStops(stops, function()
		{
			// set stop time to new trip stop by calculate
			const fieldTripId = stops[0].FieldTripId;

			stops.forEach(data =>
			{
				data.StopTime = data.ActualStopTime;
				self.insertToRevertData(data);
			});

			self.dataModel.onTripStopsChangeEvent.notify({
				add: stops,
				delete: [],
				edit: []
			});

			self.dataModel.changeTripVisibility(fieldTripId, true);
			self.changeRevertStack(stops, false);
		});
	};

	RoutingFieldTripStopDataModel.prototype.refreshTripByStops = function(stops)
	{
		var tripIds = new Set();
		stops.forEach(x =>
		{
			tripIds.add(x.FieldTripId);
		});
		var trips = [];
		tripIds.forEach(x => trips.push(this.dataModel.getFieldTripById(x)));
		this.dataModel.onTripsChangeEvent.notify({ add: [], edit: trips, delete: [] });
	}

	RoutingFieldTripStopDataModel.prototype.addTripStopsToNewTrip = function(newTripStops, insertToStops, targetTrip)
	{
		var self = this, stops;
		self.bindTripDataToTripStop(newTripStops, targetTrip);
		var solvePromise = Promise.resolve([]);

		if (!self.dataModel.getSmartSequenceSetting())
		{
			stops = insertToStops.slice().map(function(stop) { return $.extend({}, stop); });
			stops = self.appendNewStopsToTrip(newTripStops, stops, targetTrip);
			solvePromise = Promise.resolve(stops);
		}
		else
		{
			solvePromise = insertToStops.length === 0 ? Promise.resolve(newTripStops) :
				self._refreshTripByAddMultiStopsSmart(newTripStops, insertToStops, targetTrip); // if there only a stop, don't need to calculate the path
		}

		return solvePromise.then(function(tripStops)
		{
			targetTrip.FieldTripStops = targetTrip.FieldTripStops.concat(newTripStops);

			// trip stops is solved
			if (tripStops && tripStops[0])
			{
				tripStops.forEach(function(data, i)
				{
					var sequence = i + 1;
					var sourceTripStop = Enumerable.From(targetTrip.FieldTripStops).FirstOrDefault(null, function(c) { return c.id == data.id; });
					if (sourceTripStop)
					{
						sourceTripStop.Sequence = sequence;
					}
				});

				targetTrip.FieldTripStops = self._sortTripStops(targetTrip.FieldTripStops);
			}

			return targetTrip;
		});
	};

	RoutingFieldTripStopDataModel.prototype.bindTripDataToTripStop = function(newTripStops, trip)
	{
		newTripStops.forEach(function(tripStop)
		{
			tripStop.FieldTripId = trip.id;
			if (tripStop.path) tripStop.path.FieldTripId = trip.id;
			tripStop.routeStops = null;
		});
	};

	RoutingFieldTripStopDataModel.prototype.createNewData = function(newData, isKeepStopId)
	{
		var data = this.getDataModel();
		if ($.isArray(newData))
		{
			newData = newData[0];
		}
		for (var key in newData)
		{
			data[key] = newData[key];
		}
		if (!isKeepStopId)
		{
			data.id = TF.createId();
		}
		data.FieldTripStopId = data.id;

		data.routeStops = null;
		return data;
	};

	/**
	 * @param {*} newTripStops 
	 * @param {*} insertToStops 
	 * @param {*} atSequences the corresponding sequences for newTripStops
	 * @param {*} isNotifyTripStopChangeEvent 
	 * @param {*} isSequenceOptimize 
	 * @param {*} isSmartSequence 
	 * @param {*} isPreserve 
	 * @param {*} resetScheduleTime 
	 * @param {*} notNotifyTreeAndMap 
	 * @returns 
	 */
	RoutingFieldTripStopDataModel.prototype.moveTripStopsFromOtherTrip = function(newTripStops, insertToStops, atSequences, isNotifyTripStopChangeEvent,
		isSequenceOptimize, isSmartSequence, isPreserve, resetScheduleTime, notNotifyTreeAndMap)
	{
		var self = this, stops;
		self.mapCanvasPage.revertMode = "";
		self.mapCanvasPage.revertData = [];
		insertToStops = sortTripStops(insertToStops);
		var targetTrip = self.dataModel.getFieldTripById(insertToStops[0].FieldTripId);
		var sequenceOffset = insertToStops[0].Sequence;
		self.bindTripDataToTripStop(newTripStops, targetTrip);
		var solvePromise = Promise.resolve([]);

		if (atSequences && atSequences.length > 0)
		{
			stops = insertToStops.slice().map(function(stop) { return $.extend({}, stop); });
			newTripStops.forEach(function(stop, index)
			{
				var sequence = atSequences.length == 1 ? atSequences[0] : atSequences[index];
				stops.splice(sequence - 1, 0, stop);
			});
			stops.forEach(function(stop, i)
			{
				stop.Sequence = i + 1;
			});
			stops = sortTripStops(stops);
			solvePromise = self._refreshTripPathByTripStops(stops, false);
		}
		else if (isSmartSequence)
		{
			// add one stop smart sequence
			var stop = newTripStops[0];
			stop.FieldTripId = insertToStops[0].FieldTripId;
			solvePromise = self._refreshTripByAddStopSmart(newTripStops[0]);
		}
		else if (isSequenceOptimize)
		{
			if (isPreserve)
			{
				solvePromise = self._refreshTripSequenceOptimizeAndPreserve(newTripStops, insertToStops);
			}
			else
			{
				// add stop(s) and do smart sequence
				solvePromise = self._refreshTripByAddMultiStopsSmart(newTripStops, insertToStops);
			}
		}
		else
		{
			// add stops to the end
			stops = insertToStops.slice().map(function(stop) { return $.extend({}, stop); });
			stops = self.appendNewStopsToTrip(newTripStops, stops);
			solvePromise = self._refreshTripPathByTripStops(stops);
		}

		return solvePromise.then(function(response)
		{
			var tripStops = response.hasOwnProperty("stops") ? response.stops : response;
			if (response.err) tf.promiseBootbox.alert(response.err);
			if (isSmartSequence)
			{
				targetTrip.FieldTripStops = tripStops.concat(newTripStops);
			}
			else
			{
				if (!tripStops)
				{
					newTripStops.map(function(tripStop)
					{
						tripStop.path = null;
						tripStop.Distance = 0;
						tripStop.Speed = 0;
					});
					if (!atSequences && !isSequenceOptimize)
					{
						targetTrip.FieldTripStops = self.appendNewStopsToTrip(newTripStops, targetTrip.FieldTripStops);
					}
					else if (atSequences)
					{
						targetTrip.FieldTripStops = stops ? stops : self.appendNewStopsToTrip(newTripStops, targetTrip.FieldTripStops);
					}
					else
					{
						targetTrip.FieldTripStops = self.appendNewStopsToTrip(newTripStops, targetTrip.FieldTripStops);//targetTrip.FieldTripStops.concat(newTripStops);
					}
					targetTrip.FieldTripStops.forEach(function(stop, index) { stop.Sequence = index + 1; });
				}
				else
				{
					if (!atSequences && !isSequenceOptimize)
					{
						targetTrip.FieldTripStops = self.appendNewStopsToTrip(newTripStops, targetTrip.FieldTripStops);
					}
					else if (isSequenceOptimize && isPreserve)
					{
						targetTrip.FieldTripStops = tripStops;
					}
					else if (atSequences)
					{
						targetTrip.FieldTripStops = stops ? stops : self.appendNewStopsToTrip(newTripStops, targetTrip.FieldTripStops);
					}
					else
					{
						targetTrip.FieldTripStops = self.appendNewStopsToTrip(newTripStops, targetTrip.FieldTripStops);//targetTrip.FieldTripStops.concat(newTripStops);
					}
					tripStops.forEach(function(data, i)
					{
						var sequence = i + sequenceOffset;
						var sourceTripStop = Enumerable.From(targetTrip.FieldTripStops).FirstOrDefault(null, function(c) { return c.id == data.id; });
						var newTripStop = Enumerable.From(newTripStops).FirstOrDefault(null, function(c) { return c.id == data.id; });
						if (newTripStop)
						{
							newTripStop.Sequence = sequence;
							updateStopPathAndDirection(newTripStop, data);
						}
						else if (sourceTripStop)
						{
							sourceTripStop.Sequence = sequence;
							if (isSequenceOptimize || isStopNearNewStop(sequence, newTripStops))
							{
								updateStopPathAndDirection(sourceTripStop, data);
							}
						}
						function updateStopPathAndDirection(oldStop, newStop)
						{
							oldStop.path = newStop.path;
							oldStop.Distance = newStop.Distance;
							oldStop.Speed = newStop.Speed;
							oldStop.DrivingDirections = newStop.DrivingDirections;
							oldStop.RouteDrivingDirections = newStop.DrivingDirections;
							oldStop.IsCustomDirection = false;
						}
						function isStopNearNewStop(sequence, newTripStops)
						{
							var isNear = false;
							for (var i = 0; i < newTripStops.length; i++)
							{
								if ((newTripStops[i].Sequence == sequence + 1))
								{
									isNear = true;
									break;
								}
							}
							return isNear;
						}
					});
				}
			}

			targetTrip.FieldTripStops = sortTripStops(targetTrip.FieldTripStops);
			if (!tripStops)
			{
				self.clearPreviousStopPathIfUnsolved(newTripStops, targetTrip);
			}

			if (isNotifyTripStopChangeEvent)
			{
				newTripStops = Enumerable.From(newTripStops).OrderBy("$.Sequence").ToArray();
				self.dataModel.onTripStopsChangeEvent.notify({
					add: newTripStops,
					delete: [],
					edit: [],
					options: {
						resetScheduleTime: resetScheduleTime,
						notNotifyTreeAndMap: notNotifyTreeAndMap
					}
				});
			}

			self.dataModel.onTripSequenceChangeEvent.notify(targetTrip.FieldTripStops);
			self.changeRevertStack(newTripStops, false);
			return newTripStops;
		});
	};

	RoutingFieldTripStopDataModel.prototype.clearPreviousStopPathIfUnsolved = function(tripStops, trip)
	{
		// clear previous stop path If inserted stops can not calculate path.
		var minSequence = Math.min(tripStops.map(function(tripStop)
		{
			return tripStop.Sequence;
		}));

		var previousStop = Enumerable.From(trip.FieldTripStops).FirstOrDefault(null, function(ts)
		{
			return ts.Sequence == minSequence - 1;
		});
		if (previousStop)
		{
			previousStop.path = null;
		}
	};

	RoutingFieldTripStopDataModel.prototype.appendNewStopsToTrip = function(newTripStops, stops, targetTrip)
	{
		var session = targetTrip && targetTrip.Session ? targetTrip.Session : this.dataModel.getSession();
		var sequence = TF.Helper.TripHelper.getFieldTripStopInsertSequence(stops);
		stops = stops.slice(0, sequence - 1).concat(newTripStops).concat(stops.slice(sequence - 1, stops.length));
		stops.forEach(function(stop, i)
		{
			stop.Sequence = i + 1;
		});

		return sortTripStops(stops);
	};

	RoutingFieldTripStopDataModel.prototype.update = function(modifyDataArray, isFromBroadCastSync, isNoStopChange)
	{
		var self = this;
		self.mapCanvasPage.revertMode = "update-TripStop";
		self.mapCanvasPage.revertData = [];
		var changeData = [];
		var moveTripStops = [];
		modifyDataArray.forEach(function(modifyData)
		{
			var data = self.dataModel.getFieldTripStop(modifyData.id);
			if (data.XCoord != modifyData.XCoord ||
				data.YCoord != modifyData.YCoord ||
				data.vehicleCurbApproach != modifyData.vehicleCurbApproach ||
				data.SchoolLocation != modifyData.SchoolLocation)
			{
				moveTripStops.push(modifyData);
				moveTripStops.forEach(function(stop) { stop.StreetSegment = null; })
			}
			self.insertToRevertData(data);
			$.extend(data, modifyData);

			changeData.push(data);
		});
		return Promise.resolve().then(function()
		{
			moveTripStops.forEach(function(stop)
			{
				self.dataModel.getFieldTripStop(stop.id).StreetSegment = stop.StreetSegment;
			});

			self._updateTripStops(changeData, null, isNoStopChange);
			return modifyDataArray;
		});
	};

	RoutingFieldTripStopDataModel.prototype._updateTripStops = function(tripStops, refreshTrip, isNoStopChange)
	{
		if (!isNoStopChange)
		{
			this.dataModel.onTripStopsChangeEvent.notify({ add: [], delete: [], edit: tripStops, refreshTrip: refreshTrip });
		}
		this.changeRevertStack(tripStops, false);
	};

	RoutingFieldTripStopDataModel.prototype._runAfterPathChanged = function(tripStops, type, autoAssign, isCreateMultiple)
	{
		this.refreshOptimizeSequenceRate(tripStops);
		return Promise.resolve(true);
	};

	RoutingFieldTripStopDataModel.prototype.refreshOptimizeSequenceRate = function(stops)
	{
		var self = this;
		if (self.dataModel.showImpactDifferenceChart())
		{
			var tripIds = stops.map(function(s) { return s.FieldTripId; });
			var uniqueIds = Enumerable.From(tripIds).Distinct().ToArray();
			uniqueIds.forEach(function(tripId)
			{
				self.dataModel.refreshOptimizeSequenceRate(tripId);
			});
		}
	};

	RoutingFieldTripStopDataModel.prototype.delete = function(deleteArray, isFromRevert, isFromBroadCastSync)
	{
		var self = this;
		return this.deleteTripStop(deleteArray, isFromRevert).then(function(deleteTripStops)
		{
			self.dataModel.onTripStopsChangeEvent.notify({ add: [], edit: [], delete: deleteTripStops });
			if (!isFromBroadCastSync && !isFromRevert)
			{
				self.dataModel.fieldTripEditBroadcast.deleteTripStop(deleteArray);
			}
			self._runAfterPathChanged(deleteTripStops, "delete");
		});
	};

	RoutingFieldTripStopDataModel.prototype.deleteTripStop = function(toDeleteData, isFromRevert, isMoveToOtherTrip)
	{
		var self = this;
		var deleteArray = this.dataModel.singleToArray(toDeleteData);
		var tripStopsGroup = Enumerable.From(deleteArray).GroupBy("$.FieldTripId").ToArray();
		var promiseArray = [];
		for (var i = 0; i < tripStopsGroup.length; i++)
		{
			promiseArray.push(self._deleteTripStopInOneTrip(tripStopsGroup[i].source, isFromRevert, isMoveToOtherTrip));
		}
		return Promise.all(promiseArray).then(function(data)
		{
			return data.reduce(function(acc, d)
			{
				return acc.concat(d);
			},[]);
		});
	};

	RoutingFieldTripStopDataModel.prototype._deleteTripStopInOneTrip = function(deleteArray, isFromRevert, isMoveToOtherTrip)
	{
		var self = this;
		self.mapCanvasPage.revertMode = "delete-TripStop";
		self.mapCanvasPage.revertData = [];
		deleteArray = self.dataModel.singleToArray(deleteArray);
		var deleteTripStops = [];
		var editTripStops = [];
		var changePathTripStops = [];
		var trip = self.dataModel.getFieldTripById(deleteArray[0].FieldTripId);

		deleteArray.forEach(function(tripStop)
		{
			var deleteData = self.dataModel.getFieldTripStop(tripStop.id);
			deleteData.routeStops = null;
			if (!isMoveToOtherTrip)
			{
				self.insertToRevertData(deleteData);
			}
			deleteTripStops.push(tripStop);
			if (tripStop.Sequence > 1)
			{
				var prevStop = self.dataModel.getFieldTripStopBySequence(trip, tripStop.Sequence - 1);
				if (prevStop)
				{
					if (changePathTripStops.length == 0)
					{
						editTripStops.push(prevStop);
					}
					changePathTripStops.push(prevStop);
				}
			}
		});

		var tripStops = trip.FieldTripStops.filter(function(stop)
		{
			return !deleteTripStops.some(function(c) { return c.id == stop.id; })
		});
		tripStops.forEach(function(stop, i)
		{
			var newSequence = i + 1;
			if (stop.Sequence != newSequence)
			{
				editTripStops.push(stop);
				// commented to fix bug RW-6524
				// if (i > 1)
				// {
				// 	editTripStops.push(trip.FieldTripStops[i - 1]);
				// }
				stop.Sequence = newSequence;
			}
		});
		tripStops = sortTripStops(tripStops);
		trip.FieldTripStops = tripStops;
		const callZoomToLayers = !isMoveToOtherTrip;
		return self._refreshTripPathByTripStops(tripStops, callZoomToLayers).then(function(tripStops)
		{
			editTripStops.forEach(function(stop)
			{
				if (!tripStops) { stop.path = {}; }
				var tripStop = Enumerable.From(tripStops).FirstOrDefault(null, function(c) { return c.id == stop.id; });
				var needChangePath = Enumerable.From(changePathTripStops).Any(function(c) { return c.id == stop.id; });
				if (tripStop && needChangePath)
				{
					stop.path = tripStop.path;
				}
			});
			self.dataModel.onTripSequenceChangeEvent.notify(editTripStops);
			self.changeRevertStack(deleteArray, isFromRevert);
			return deleteTripStops;
		});
	};

	RoutingFieldTripStopDataModel.prototype.reorderTripStopSequence = function(tripStop, fieldTripId, newSequence, callZoomToLayers = true)
	{
		var self = this;
		if (tripStop.FieldTripId == fieldTripId)
		{
			return self._reorderTripStopSequenceInOneTrip(tripStop, newSequence, callZoomToLayers);
		}

		return self.moveTripStopsToOtherTrip([tripStop], fieldTripId, newSequence);
	};

	/**
	 * 
	 * @param {*} tripStops 
	 * @param {*} fieldTripId target field trip id
	 * @param {*} newSequence the new sequence in the target field trip
	 * @param {*} isSequenceOptimize 
	 * @param {*} isSmartSequence 
	 * @param {*} isPreserve 
	 * @returns 
	 */
	RoutingFieldTripStopDataModel.prototype.moveTripStopsToOtherTrip = async function(tripStops, fieldTripId, newSequence, isSequenceOptimize, isSmartSequence, isPreserve)
	{
		var self = this;
		var addTrip = self.dataModel.getFieldTripById(fieldTripId);
		var removeStop = tripStops[0];
		var removeStopTrip = self.dataModel.getFieldTripById(removeStop.FieldTripId);
		if (isSmartSequence)
		{
			console.log("TODO: Move field trip stop to another trip with smart sequence checked.");

			self.fieldTripPaletteSectionVM.drawTool.redrawPath(removeStopTrip);
			var getSequencePromise = Promise.resolve(tripStops);
			if (isPreserve) getSequencePromise = self.fieldTripPaletteSectionVM.eventsManager.contiguousHelper.getSmartAssignment(tripStops, addTrip, self.fieldTripPaletteSectionVM.drawTool);
			else { getSequencePromise = self.fieldTripPaletteSectionVM.eventsManager.vrpTool.getSmartAssignment_multi(tripStops, [addTrip], true, self.fieldTripPaletteSectionVM.drawTool); }
			return getSequencePromise.then(function(stops)
			{
				if (!stops || !$.isArray(stops) || stops.length == 0) return stops;
				var sequences = newSequence ? [newSequence] : null;
				if (stops && $.isArray(stops)) sequences = stops.map(function(stop) { return stop.Sequence; })
				return self.moveTripStopsFromOtherTrip(stops, addTrip.FieldTripStops, sequences, false, isSequenceOptimize, isSmartSequence, isPreserve);
			}).then(function(edits)
			{
				if (!edits || !$.isArray(edits) || edits.length == 0) return edits;
				return self.deleteTripStop(tripStops, false, true).then(function()
				{
					var changedStudents = [];
					edits.map(function(stop)
					{
						changedStudents = changedStudents.concat(stop.Students);
					});
					self.fieldTripPaletteSectionVM.drawTool.onTripStopsChangeEvent(null, { add: [], edit: edits, delete: [] });
					self.fieldTripPaletteSectionVM.drawTool.redrawPath(addTrip);
					return edits;
				})
			});
		}
		else
		{
			await self.deleteTripStop(tripStops, false, true);

			var sequences = newSequence ? [newSequence] : null;
			await self.moveTripStopsFromOtherTrip(tripStops, addTrip.FieldTripStops, sequences, false, isSequenceOptimize, isSmartSequence, isPreserve);

			self.onFieldTripStopUpdatedEvent.notify({
				DBID: removeStopTrip.DBID,
				fromFieldTripId: removeStopTrip.id,
				toFieldTripId: fieldTripId,
				fieldTripStopId: removeStop.id,
				toStopSequence: newSequence,
				color: addTrip.color
			});
		}
	};

	RoutingFieldTripStopDataModel.prototype._reorderTripStopSequenceInOneTrip = function(tripStop, newSequence, callZoomToLayers = true)
	{
		var self = this;
		self.mapCanvasPage.revertMode = "";
		self.mapCanvasPage.revertData = [];
		var oldSequence = tripStop.Sequence;
		var editTripPathStops = [];
		var trip = self.dataModel.getFieldTripById(tripStop.FieldTripId);
		var newPrevStop = newSequence > 1 ? self.dataModel.getFieldTripStopBySequence(trip, newSequence - 1) : null;
		var oldPrevStop = oldSequence > 1 ? self.dataModel.getFieldTripStopBySequence(trip, oldSequence - 1) : null;
		if (oldSequence < newSequence)
		{
			newPrevStop = self.dataModel.getFieldTripStopBySequence(trip, newSequence);
		}
		editTripPathStops.push(tripStop);
		if (newPrevStop)
		{
			editTripPathStops.push(newPrevStop);
		}
		if (oldPrevStop)
		{
			editTripPathStops.push(oldPrevStop);
		}
		trip.FieldTripStops.splice(oldSequence - 1, 1);
		trip.FieldTripStops.splice(newSequence - 1, 0, tripStop);
		const stopsCount = trip.FieldTripStops.length;
		trip.FieldTripStops.forEach(function(stop, i)
		{
			stop.Sequence = i + 1;
			if (i === 0)
			{
				stop.PrimaryDeparture = true;
				stop.PrimaryDestination = false;
				stop.StopTimeDepart = stop.StopTimeDepart || stop.StopTimeArrive;
				stop.StopTimeArrive = null;
			}
			else if (i === stopsCount - 1)
			{
				stop.PrimaryDeparture = false;
				stop.PrimaryDestination = true;
				stop.StopTimeArrive = stop.StopTimeArrive || stop.StopTimeDepart;
				stop.StopTimeDepart = null;
				stop.Paths = null;
			}
			else
			{
				stop.PrimaryDeparture = false;
				stop.PrimaryDestination = false;
				stop.StopTimeArrive = stop.StopTimeArrive || stop.StopTimeDepart;
				stop.StopTimeDepart = stop.StopTimeDepart || stop.StopTimeArrive;
			}
		});
		return self._refreshTripPathByTripStops(trip.FieldTripStops, callZoomToLayers).then(function(tripStops)
		{
			editTripPathStops.forEach(function(stop)
			{
				var tripStop = Enumerable.From(tripStops).FirstOrDefault(null, function(c) { return c.id == stop.id; });
				if (tripStop)
				{
					stop.path = tripStop.path;
					stop.Distance = tripStop.Distance;
					stop.DrivingDirections = tripStop.DrivingDirections;
					stop.RouteDrivingDirections = tripStop.DrivingDirections;
					stop.Speed = tripStop.Speed;
					stop.IsCustomDirection = false;
				}
			});
			var sequenceChanges = trip.FieldTripStops.filter(function(c) { return c.Sequence <= Math.max(oldSequence, newSequence); });
			self.dataModel.onTripSequenceChangeEvent.notify(sequenceChanges);
			self.changeRevertStack(editTripPathStops, false);
		});
	};

	RoutingFieldTripStopDataModel.prototype._refreshTripByAddStopSmart = function(tripStop)
	{
		var self = this;
		var sequenceChanges = [];
		tripStop.routeStops = null;
		return self.fieldTripPaletteSectionVM.drawTool.NAtool.refreshTrip(tripStop, "new", false, true).then(function(data)
		{
			var prevStop = data[0];
			var currentStop = data.length > 1 ? data[1] : null;
			if (currentStop)
			{
				var stop = self.dataModel.getFieldTripStop(currentStop.id);
				if (stop)
				{
					stop.path.geometry = currentStop.path.geometry;
					currentStop.path = stop.path;
					stop.Distance = currentStop.Distance;
				}
			}
			if (prevStop)
			{
				prevStop.routeStops = null;
			}
			var tripStops = self.dataModel.getFieldTripById(tripStop.FieldTripId).FieldTripStops;
			tripStops = sortTripStops(tripStops);
			var startSequence = currentStop ? currentStop.Sequence : prevStop.Sequence;

			for (var i = 0; i < tripStops.length; i++)
			{
				if (prevStop && (tripStops[i].id == prevStop.id))
				{
					tripStops[i].path = prevStop.path;
				} else if (currentStop && tripStops[i].id == currentStop.id)
				{
					tripStops[i].path = currentStop.path;
					tripStops[i].Sequence = currentStop.Sequence;
				} else if (tripStops[i].Sequence >= startSequence)
				{
					tripStops[i].Sequence = ++startSequence;
					sequenceChanges.push(tripStops[i]);
				}
			}
			return tripStops;
		});
	};

	RoutingFieldTripStopDataModel.prototype._refreshTripByAddMultiStopsSmart = function(newTripStops, currentTripStops, newTrip)
	{
		var self = this;
		return self.fieldTripPaletteSectionVM.drawTool.NAtool.refreshTripByAddMultiStopsSmart(newTripStops, currentTripStops, newTrip);
	};

	RoutingFieldTripStopDataModel.prototype._refreshTripSequenceOptimizeAndPreserve = function(newTripStops, currentTripStops)
	{
		var self = this;
		return self.fieldTripPaletteSectionVM.drawTool.NAtool.refreshTripByMultiStops(currentTripStops, true).then(function(currentStops)
		{
			currentStops.forEach(function(stop, index) { stop.Sequence = index + 1; })
			return self.fieldTripPaletteSectionVM.eventsManager.contiguousHelper.getSmartAssignment(newTripStops, { FieldTripStops: currentStops }, self.fieldTripPaletteSectionVM.drawTool).then(function(newStops)
			{
				newStops.forEach(function(stop)
				{
					currentStops = currentStops.slice(0, stop.Sequence - 1).concat([stop]).concat(currentStops.slice(stop.Sequence - 1));
				});
				return self.fieldTripPaletteSectionVM.drawTool.NAtool.refreshTripByMultiStops(currentStops, false).then(function(currentStops)
				{
					return { stops: currentStops };
				})
			})
		})
	}

	RoutingFieldTripStopDataModel.prototype._refreshTripPathByTripStops = function(tripStops, callZoomToLayers = true)
	{
		const data = { tripStops, callZoomToLayers, onCompleted: ()=> tf.loadingIndicator.tryHide()};
		
		tf.loadingIndicator.showImmediately();
		
		PubSub.publish("on_MapCanvas_RefreshTripByStops", data);
		return Promise.resolve(tripStops);
	};

	RoutingFieldTripStopDataModel.prototype.insertTripStopToTrip = function(data, positionIndex)
	{
		var self = this;
		var trip = this.dataModel.getFieldTripById(data.FieldTripId);
		if (positionIndex == undefined)
		{
			if (data.doorToDoorSchoolId) { trip.FieldTripStops.splice(TF.Helper.TripHelper.getTripStopInsertSequenceBeforeSchool(trip.FieldTripStops.filter(s => s.id != data.id), trip.Session, data.doorToDoorSchoolId) - 1, 0, data); }
			else { trip.FieldTripStops.splice(TF.Helper.TripHelper.getTripStopInsertSequence(trip.FieldTripStops, trip.Session) - 1, 0, data); }

		}
		else
		{
			trip.FieldTripStops.splice(positionIndex, 0, data);
		}

		if (!this.dataModel.getSmartSequenceSetting() ||
			positionIndex != undefined)
		{
			self.updateSequence(trip);
		}
	};

	RoutingFieldTripStopDataModel.prototype.removeTripStopsFromTrip = function(stops)
	{
		const trip = this.dataModel.getFieldTripById(stops[0].FieldTripId);

		trip.FieldTripStops = trip.FieldTripStops.filter(stop => !stops.some(removeStop => removeStop.id == stop.id));

		if (!this.dataModel.getSmartSequenceSetting() || positionIndex != undefined)
		{
			this.updateSequence(trip);
		}
	}

	/**
	 * calculate trip stop smart sequence
	 * @param {*} trip
	 * @param {*} tripStop
	 */
	RoutingFieldTripStopDataModel.prototype.calculateSmartSequence = function(trip, tripStop)
	{
		var self = this;
		var tripStopToCalc = $.extend({}, tripStop, { FieldTripId: trip.id });
		return self.fieldTripPaletteSectionVM.drawTool.NAtool.refreshTrip(tripStopToCalc, "new").then(function(data)
		{
			return Enumerable.From(data).FirstOrDefault({}, function(c) { return c.id == tripStopToCalc.id; }).Sequence;
		});
	};

	RoutingFieldTripStopDataModel.prototype.changeRevertStack = function(data, isFromRevert)
	{
		if (!isFromRevert)
		{
			var toObject = {};
			if ($.isArray(data))
			{
				toObject = [];
			}
			this.dataModel.changeDataStack.push($.extend(true, toObject, data));
		} else
		{
			this.dataModel.changeDataStack.pop();
		}
	};

	RoutingFieldTripStopDataModel.prototype.updateSequence = function(trip)
	{
		for (var i = 0; i < trip.FieldTripStops.length; i++)
		{
			trip.FieldTripStops[i].Sequence = i + 1;
		}
	};

	RoutingFieldTripStopDataModel.prototype.insertToRevertData = function(data)
	{
		this.mapCanvasPage.revertData.push($.extend({}, data, { geometry: data && data.geometry ? TF.cloneGeometry(data.geometry) : null }));
	};

	RoutingFieldTripStopDataModel.prototype._sortTripStops = function(stops)
	{
		return stops.sort(function(a, b) { return a.Sequence > b.Sequence ? 1 : -1; });
	};

	RoutingFieldTripStopDataModel.prototype.getDataModel = function()
	{
		return {
			id: 0,
			SchoolCode: "",
			SchoolId: -1,
			Sequence: 0,
			PrimaryDeparture: false,
			PrimaryDestination: false,
			StopTime: "00:00:00",
			TotalStopTime: "00:00:00",
			StopTimeArrive: "",
			StopTimeDepart: "",
			TotalStopTimeManualChanged: false,
			IShow: true,
			IsCustomDirection: false,
			RouteDrivingDirections: "",
			Street: "",
			City: "",
			XCoord: "",
			YCoord: "",
			Comment: "",
			FieldTripId: "",
			StopType: "",
			Students: [],
			type: "tripStop",
			ActualStopTime: "0001-01-01 00:00:00",
			AssignedStudentCount: 0,
			Distance: 0,
			Duration: "00:00:00",
			Speed: 0,
			TotalStudentCount: 0,
			Travel: "00:00:00",
			ProhibitCrosser: 0,
			path: {},
			boundary: {},
			vehicleCurbApproach: tf.storageManager.get("tripStop-vehicleCurbApproach") >= 0 ? tf.storageManager.get("tripStop-vehicleCurbApproach") : 1,
			isSnapped: false,
			unassignStudent: false,
			SchoolLocation: null,
			LockStopTime: false,
			StreetSegment: null,
			StreetSpeed: 0,
			IncludeNoStudStop: tf.storageManager.get("tripStop-IncludeNoStudStop") ? true : false,
			StopPauseMinutes: null
		};
	};

	RoutingFieldTripStopDataModel.prototype.dispose = function()
	{
		this.onFieldTripStopUpdatedEvent?.unsubscribeAll();
	};

	function sortTripStops(stops)
	{
		return stops.sort(function(a, b) { return a.Sequence > b.Sequence ? 1 : -1; });
	};
})();
(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingEventsManager = RoutingEventsManager;

	function RoutingEventsManager(fieldTripPaletteSectionVM, routeState)
	{
		var self = this;
		TF.RoutingMap.RoutingPalette.BaseRoutingEventsManager.call(this, fieldTripPaletteSectionVM, fieldTripPaletteSectionVM.viewModel._viewModal);
		self.routeState = routeState;
		self.vrpTool = new TF.RoutingMap.RoutingPalette.VRPTool();
		self.contiguousHelper = new TF.RoutingMap.RoutingPalette.ContiguousHelper();
		self.dataModel = fieldTripPaletteSectionVM.dataModel;
		self.playBackControl = fieldTripPaletteSectionVM.playBackControl;
		self.display = fieldTripPaletteSectionVM.display;
		self.obTripSelected = ko.observable(false);
		self.obEditFieldTripSelected = ko.observable(false);
		self.obVrpableTripsSelected = ko.observable(false);
		self.dataModel.onTripsChangeEvent.subscribe(this._onTripsChangeEvent.bind(this));
		self.obSequencePath = ko.observable(tf.storageManager.get('pathLineType') === 'Sequence');
		self.obDataChanged = ko.computed(function()
		{
			return self.dataModel.obSelfChangeCount() > 0;
		});
		self.bindRefreshMissingTripPathEvent();
		self.requireDetailsEvent = new TF.Events.Event();

		PubSub.subscribe(TF.RoutingPalette.FieldTripMapEventEnum.AddStopFromMapCompleted, self.onAddStopFromMapCompleted.bind(self));
	}

	RoutingEventsManager.prototype = Object.create(TF.RoutingMap.RoutingPalette.BaseRoutingEventsManager.prototype);
	RoutingEventsManager.prototype.constructor = RoutingEventsManager;

	RoutingEventsManager.prototype.continueDrawTripStop = function()
	{
		var self = this;
		if (self._viewModal.mode == "Routing-Create")
		{
			setTimeout(function()
			{
				self.viewModel.drawTool.start("point", "createPoint");
			});
		} else
		{
			if (self._viewModal.mode != "Routing-Edit")
			{
				self.viewModel.drawTool.stop();
			}
		}
	};

	RoutingEventsManager.prototype.createTripClick = function()
	{
		this.dataModel.createTrip();
	};

	RoutingEventsManager.prototype.tripInfoClick = function(data)
	{
		var trip = this.dataModel.getTripById(data.id);
		this.dataModel.editTrip(trip);
	};

	RoutingEventsManager.prototype.deleteTripClick = function(data)
	{
		var trip = this.dataModel.getTripById(data.id);
		this.dataModel.deleteTrip(trip);
	};

	RoutingEventsManager.prototype.openTripClick = function()
	{
		var self = this;
		self.openTrip();
		// if (self.dataModel.trips.length == 1 && self.dataModel.hasUnsavedRestrictions())
		// {
		// 	tf.promiseBootbox.alert({
		// 		message: "There are unsaved restriction changes. You must save or revert changes before opening new trips.",
		// 		title: "Confirmation"
		// 	});
		// }
		// else
		// {
		// 	self.openTrip();
		// }
	};

	RoutingEventsManager.prototype.openReadOnlyTripClick = function()
	{
		this.openTrip(true);
	};

	/**
	 * Open field trip in Palette level
	 * @param {*} isViewTrip 
	 */
	RoutingEventsManager.prototype.openTrip = function(isViewTrip)
	{
		var self = this;
		tf.modalManager.showModal(
			isViewTrip ? (new TF.RoutingMap.RoutingPalette.ViewFieldTripModalViewModel(
				self.dataModel.getViewTrips(),
				self.dataModel.getEditTrips()
			)) : (new TF.RoutingMap.RoutingPalette.OpenFieldTripModalViewModel(
				self.dataModel.getEditTrips(), {
				getLockedInfo: self._getLockedByOtherTrips.bind(self)
			}
			))
		).then(function(data)
		{
			if ($.isArray(data))
			{
				var deleteTrips = [], newTrips = [], originalTrips = [];
				originalTrips = isViewTrip ? self.dataModel.getViewTrips() : self.dataModel.getEditTrips();
				originalTrips.forEach(function(trip)
				{
					if (!Enumerable.From(data).Any(function(c) { return c.id == trip.Id || c.Id == trip.Id || c.Id == trip.id || c.id == trip.id; }))
					{
						deleteTrips.push(trip);
					}
				});
				data.forEach(function(trip)
				{
					if (!Enumerable.From(originalTrips).Any(function(c) { return c.id == trip.Id || c.Id == trip.Id || c.Id == trip.id || c.id == trip.id; }))
					{
						newTrips.push(trip);
					}
				});
				if (deleteTrips.length == 0 && newTrips.length == 0)
				{
					return;
				}
				if (!isViewTrip)
				{
					self.getRelatedTrips(deleteTrips, 'close').then(function(deleteRelatedTrips)
					{
						if (deleteRelatedTrips)
						{
							data = data.filter(function(trip)
							{
								return !Enumerable.From(deleteRelatedTrips).Any(function(c) { return c.id == trip.Id || c.Id == trip.Id || c.Id == trip.id || c.id == trip.id; });
							});
							self.dataModel.unSaveCheckConfirmBox(deleteRelatedTrips).then(function(result)
							{
								if (result)
								{
									self.dataModel.setOpenFieldTrips(data);
								}
							});
						}
					});
				}
				else
				{
					self.dataModel.setViewFieldTrips(data);
				}
			}
		});
	};

	RoutingEventsManager.prototype.openSettingClick = function()
	{
		tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.RoutingSettingModalViewModel(this.dataModel, this.routeState));
	};

	RoutingEventsManager.prototype.addStopClick = function(data, e)
	{
		var self = this;
		var $target = $(e.currentTarget);
		if (self._viewModal.mode === "Routing-Create")
		{
			self._viewModal.setMode("", "Normal");
			$target.addClass("active");
		}
		$target.addClass("checked");
	}

	RoutingEventsManager.prototype.zoomClick = function(data, type)
	{
		if (this.dataModel.trips.length == 0 && !data)
		{
			return;
		}

		if (type === 'fieldtrip')
		{
			if (data === null)
			{
				data = this.dataModel.trips;
			}
			else
			{
				data = [data];
			}

			PubSub.publish(TF.RoutingPalette.FieldTripMapEventEnum.ZoomToLayers, data);
			return;
		}

		if (type === 'fieldTripStop')
		{
			if (data && data.customData)
			{
				const { tripId, sequence } = data.customData;
				PubSub.publish(TF.RoutingPalette.FieldTripMapEventEnum.ZoomToStop, { tripId, sequence });
			}
			else
			{
				console.warn(`Center Map at field trip stop.`);
			}

			return;
		}

		var map = this._viewModal._map;
		var trips = [];
		if (type != "trip" && data.customData && data.customData.geometry)
		{
			if (type == "tripStop" && data.customData.schoolCode && data.customData.schoolCode.length > 0)
			{
				var schoolStop = this.dataModel.getFieldTripStopByStopId(data.id);
				if (schoolStop.SchoolLocation)
				{
					TF.RoutingMap.EsriTool.centerSingleItem(map, schoolStop.SchoolLocation);
					return;
				}
			}
			TF.RoutingMap.EsriTool.centerSingleItem(map, data.customData);
			return;
		} else if (data.id)
		{
			trips.push(data);
		}

		var geometries = [];
		if (trips.length == 0)
		{
			trips = this.dataModel.trips;
		}
		trips.map(function(trip)
		{
			trip.FieldTripStops.map(function(tripStop)
			{
				if (tripStop.path && tripStop.path.geometry &&
					tripStop.path.geometry.paths && tripStop.path.geometry.paths.length > 0 && tripStop.path.geometry.paths[0].length > 0)
				{
					geometries.push(tripStop.path);
				} else
				{
					geometries.push(tripStop);
				}
			});
		});
		if (geometries.length == 1)
		{
			TF.RoutingMap.EsriTool.centerSingleItem(map, geometries[0]);
		} else if (geometries.length > 1)
		{
			TF.RoutingMap.EsriTool.centerMultipleItem(map, geometries);
		}
	};

	RoutingEventsManager.prototype.expandAllClick = function()
	{
		var self = this;
		var treeView = self.viewModel.$element.find("#routingtreeview").data('kendoTreeView');
		treeView.expand("> .k-group > .k-item");
	};

	RoutingEventsManager.prototype.collapseAllClick = function()
	{
		var self = this;
		var treeView = self.viewModel.$element.find("#routingtreeview").data('kendoTreeView');

		// set suspend attribute to false if its true to ensure the collapse method works
		self.viewModel.$element.find("#routingtreeview .k-item").each((index,element) => {
			var isSuspend = $(element).attr('suspend');

			if(isSuspend == 'true')
			{
				$(element).attr('suspend', false);
			}
		});

		treeView.collapse(".k-item");
	};

	RoutingEventsManager.prototype.toggleTripPath = function(type)
	{
		tf.storageManager.save("pathLineType", type);
		this.obSequencePath(type === 'Sequence');
		this.dataModel.onTripPathLineDisplayChange.notify(type);
		PubSub.publish(TF.RoutingPalette.FieldTripMapEventEnum.TripPathTypeChange, this.obSequencePath());
	};

	RoutingEventsManager.prototype._getLockedByOtherTrips = function()
	{
		var self = this;
		var routeState = this.viewModel.viewModel.routeState;
		return self.dataModel.tripLockData.getLockInfo().then(function(lockInfo)
		{
			return lockInfo.selfLockedList.filter(function(item)
			{
				return item.ExtraInfo != routeState;
			}).concat(lockInfo.lockedByOtherList);
		});
	};

	RoutingEventsManager.prototype.getRelatedTrips = function(trips, type)
	{
		var self = this;
		var resultObject = self.dataModel.handleRelatedTrip(trips, type);
		if (resultObject.message)
		{
			return tf.promiseBootbox.confirm({
				message: resultObject.message,
				title: "Confirmation"
			}).then(function(result)
			{
				if (result)
				{
					return resultObject.trips;
				}
				else
				{
					return false;
				}
			});
		}
		else
		{
			return Promise.resolve(resultObject.trips);
		}
	};

	RoutingEventsManager.prototype.closeTripClick = function(model, e, tripsData)
	{
		var self = this, promise = Promise.resolve(tripsData);
		var trips = tripsData ? tripsData : this.dataModel.trips;
		if (!tripsData)
		{
			promise = tf.modalManager.showModal(
				new TF.RoutingMap.RoutingPalette.SelectTripModalViewModel(trips, { otherButtonName: "Close All Field Trips", optionType: "close" }, self.dataModel)
			);
		}
		promise.then(function(data)
		{
			if (data && data.length > 0)
			{
				var p = Promise.resolve(data);
				if (tripsData)
				{
					p = self.getRelatedTrips(tripsData, 'close');
				}
				p.then(function(resultData)
				{
					if (!resultData)
					{
						return;
					}
					var unsavedNewTrips = [], viewTrips = [], editTrips = [];
					resultData.map(function(trip)
					{
						if (trip)
						{
							if (trip.UnsavedNewTrip && trip.OpenType === "Edit")
							{
								unsavedNewTrips.push(trip);
							}
							else if (trip.OpenType === "View")
							{
								viewTrips.push(trip);
							}
							else if (trip.OpenType === "Edit")
							{
								editTrips.push(trip);
							}
						}
					});
					var promiseList = [];
					if (unsavedNewTrips.length > 0)
					{
						// promiseList.push(self.dataModel.closeUnsavedNewTrips(unsavedNewTrips, false));
						promiseList.push(self.dataModel.closeUnsavedNewFieldTrips(unsavedNewTrips, false));
					}
					if (viewTrips.length > 0)
					{
						// promiseList.push(self.dataModel.closeByViewTrips(viewTrips));
						promiseList.push(self.dataModel.closeByViewFieldTrips(viewTrips));
					}
					if (editTrips.length > 0)
					{
						Promise.all(promiseList).then(function()
						{
							self.dataModel.unSaveCheckConfirmBox(editTrips).then(function(result)
							{
								if (result)
								{
									// self.dataModel.closeByTrips(editTrips);
									self.dataModel.closeByFieldTrips(editTrips);
								}
							});
						});
					}
				});
			}
		});
	};

	RoutingEventsManager.prototype.copyTripClick = function(tripData)
	{
		this.viewModel.routingChangePath.stop();
		this.dataModel.copyAsNewFieldTrip(tripData);
	};

	RoutingEventsManager.prototype.copyTripStopClick = function(tripStopId)
	{
		var self = this;
		if (self._viewModal.mode === 'Routing-Create')
		{
			self._viewModal.setMode("Routing", "Normal");
		}
		this.viewModel.routingChangePath.stop();
		var tripStop = self.dataModel.getFieldTripStopByStopId(tripStopId);
		tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.CopyTripStopModalViewModel(tripStop, self.dataModel))
			.then(function(tripName)
			{
				if (!tripName)
				{
					return;
				}
				var stop = self.dataModel.fieldTripStopDataModel.createNewData(tripStop);
				stop.LockStopTime = false;
				stop.Street = tripName;
				stop.path = null;
				stop.TotalStudentCount = 0;
				stop.AssignedStudentCount = 0;
				stop.Students = [];
				stop.originalStudents = [];
				stop.ToSchoolStudents = { HomeToSchool: 0, SchoolToHome: 0 };
				stop.ToTransStudents = { HomeToTrans: 0, TransToHome: 0 };
				stop.TransToTrans = { PUTransToTrans: 0, DOTransToTrans: 0 };
				stop.PUTransToSchool = { TransToSchool: 0, SchoolToTrans: 0 };
				stop.DOTransToSchool = { TransToSchool: 0, SchoolToTrans: 0 };
				self.dataModel.fieldTripStopDataModel.create(stop, false, tripStop.Sequence, true);
			});
	};

	RoutingEventsManager.prototype._onTripsChangeEvent = function()
	{
		var self = this;
		self.obTripSelected(self.dataModel.trips.length > 0);
		
		self.obEditFieldTripSelected(self.dataModel.getEditTrips().length > 0);

		// self.obVrpableTripsSelected(self.dataModel.getEditTrips().length > 0);
		self.obVrpableTripsSelected(false);


		// if (self.dataModel.getEditTrips().length > 0)
		// {
		// 	var schools = self.dataModel.getEditTrips()[0].FieldTripStops.filter(function(stop)
		// 	{
		// 		return stop.SchoolCode && stop.SchoolCode.length > 0;
		// 	});
		// 	if (schools.length > 1) self.obVrpableTripsSelected(false);
		// }
	};

	RoutingEventsManager.prototype.createClick = function()
	{
		PubSub.publish(TF.RoutingPalette.FieldTripMapEventEnum.AddStopFromMap);
	};

	RoutingEventsManager.prototype.createFromSelectionClick = function()
	{
		var self = this;
		var copyObject = this.copyFromObject();
		self.viewModel.drawTool.copyToTripStop(copyObject);
	};

	RoutingEventsManager.prototype.createStopFromSelectionClick = function()
	{
		var self = this;
		self._viewModal.setMode("Routing", "Normal");
		self._createFromSelection();
	};

	RoutingEventsManager.prototype._createFromSelection = function()
	{
		var self = this;
		var points = [];
		var pointWithoutBoundaryCount = 0;
		self._viewModal.geoSearchPaletteViewModel.dataModel.getHighlighted().forEach(function(item)
		{
			if (item.type == "student")
			{
				var geometryExist = false;
				points.map(function(point)
				{
					if (point.geometry.x == item.geometry.x && point.geometry.y == item.geometry.y)
					{
						geometryExist = true;
						return;
					}
				});
				if (!geometryExist)
				{
					points.push({
						address: item.Address,
						geometry: item.geometry,
						type: "student"
					});
					if (!(item.boundary && item.boundary.geometry)) { pointWithoutBoundaryCount++; }
				}
			}

			else if (item.type == "tripStop" || item.type == "stopPoolStop")
			{
				points.push({
					address: item.Street,
					geometry: item.geometry,
					type: "mapAddress",
					boundary: item.boundary
				});
				if (!(item.boundary && item.boundary.geometry)) { pointWithoutBoundaryCount++; }
			}
		});

		if (points.length > 0)
		{
			self.createFromMultiple(points, {
				isCreateFromSelection: true,
				isAllCreateFromPoints: pointWithoutBoundaryCount == points.length,
				isContainsPoints: pointWithoutBoundaryCount > 0
			});
		} else
		{
			tf.promiseBootbox.alert("No items selected,please select items into Geo Search palette");
		}

	};
	RoutingEventsManager.prototype.createFromSearchResultClick = function(model, e, option, insertBehindSpecialStop)
	{
		var self = this;
		self._viewModal.setMode("Routing", "AddFromSearchResult");
		self.insertBehindSpecialStop = insertBehindSpecialStop;
		if (e)
		{
			self.insertBehindSpecialStop = null;
			this.fileOpenOption = null;
		}
		return self._createFromSearchResult(option).then(function(data)
		{
			self._viewModal.setMode("Routing", "Normal");
			return data;
		});
	};

	RoutingEventsManager.prototype.createFromFileClick = function(model, e, option, insertBehindSpecialStop)
	{
		if (e)
		{
			var $target = e.currentTarget ? $(e.currentTarget).closest(".menu") : e.find(".menu");
			this.fileInput = $target.find("#create-stop-from-file");
			this.fileOpenOption = null;
			this.insertBehindSpecialStop = null;
		}
		else
		{
			this.fileInput = $($.find("#create-stop-from-file")[0]);
			this.fileOpenOption = option;
			this.insertBehindSpecialStop = insertBehindSpecialStop;
		}
		this.fileInput.click();
	};

	RoutingEventsManager.prototype.infoClick = function(item)
	{
		PubSub.publish("clear_ContextMenu_Operation");
		var self = this;
		if (self._viewModal.mode === 'Routing-Create')
		{
			self._viewModal.setMode("Routing", "Normal");
		}
		// this item is boundary ,so change it to trip stop
		var fieldTripStop = self.dataModel.getFieldTripStop(item.FieldTripStopId ? item.FieldTripStopId : item.id, item.FieldTripId);

		self.viewModel.editFieldTripStopModal.showEditModal([fieldTripStop]).then(function()
		{
			self.viewModel.drawTool.changeSymbolToEditing(item.id);
			function closeEvent()
			{
				self.viewModel.drawTool.changeSymbolToNotEditing();
				self.viewModel.editFieldTripStopModal.onCloseEditModalEvent.unsubscribe(closeEvent);
			}
			self.viewModel.editFieldTripStopModal.onCloseEditModalEvent.subscribe(closeEvent);
		}).catch(function() { });
	};

	RoutingEventsManager.prototype.onAddStopFromMapCompleted = function (_, stop)
	{
		var defaultOptions = {
			isDoorToDoor: false,
			student: null,
			isCreateFromUnassignStudent: false,
			isCreateFromStopSearch: false,
			isCreateFromSearch: false,
			boundary: null,
			insertBehindSpecialStop: null,
			streetName: "",
			isCopied: false,
			selectLastSelectedTrip: true,
			tryUseLastSettings: false
		};

		this.viewModel.editFieldTripStopModal.create({
			Street: stop.Name,
			City: stop.City
		}, null, defaultOptions);
	}

	RoutingEventsManager.prototype.changeStopSelectAreaClick = function(type, data, e)
	{
		this.viewModel.drawTool.select(type);
		//this._viewModal.setMode("Routing", "SelectMapArea-" + type);
		PubSub.publish("clear_ContextMenu_Operation");
	};

	RoutingEventsManager.prototype.editTripBoundaryClick = function(type, data)
	{
		var self = this;
		var boundaryID = data.boundary ? data.boundary.id : data.id;
		self.viewModel.drawTool.transform(boundaryID);
	};

	RoutingEventsManager.prototype.selectionChange_routing = function(e, selectedIds)
	{
		var self = this;
		var selectedItems = self.dataModel.getTripStopsByStopIds(selectedIds);
		if (selectedItems.length > 0)
		{
			var options = {
				routingDataModel: self.dataModel,
				tripStops: selectedItems,
				trips: self.dataModel.getEditTrips(),
				stopPoolName: self.viewModel.stopPoolPaletteSection.display.obStopPoolName(),
				stopPoolColor: self.viewModel.stopPoolPaletteSection.display.obStopPoolColor()
			};

			tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.AssignStopsModalViewModel(options))
				.then(function(data)
				{
					if (!data)
					{
						return;
					}

					if (data.targetTripId > 0)
					{
						self.dataModel.assignStops(data.selectedTripStops, data.targetTripId, data.sequenceOptimize, data.smartSequence, data.preserveContiguous);
					}
					else
					{
						self.viewModel.stopPoolPaletteSection.drawTool.copyToStopPools(data.selectedTripStops);
					}
				});
		}
	};

	RoutingEventsManager.prototype.setScheduledTimeClick = function(tripStop)
	{
		var self = this;
		var trip = Enumerable.From(self.dataModel.trips).FirstOrDefault(null, function(c)
		{
			return c.id == tripStop.FieldTripId;
		});
		return tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.SetScheduledTimeModalViewModel(tripStop, trip))
			.then(function(data)
			{
				if (data)
				{
					return data;
				}
				return Promise.resolve(false);
			});
	};

	RoutingEventsManager.prototype.copytoStopPoolClick = function(tripStopId)
	{
		var self = this;
		var tripStop = self.dataModel.getFieldTripStopByStopId(tripStopId);
		return self.viewModel.viewModel.stopPoolPaletteSection.drawTool.copyToStopPool(tripStop);
	};

	RoutingEventsManager.prototype._toDictionary = function(data)
	{
		var map = {};
		(data || []).forEach(function(item)
		{
			map[item.id] = item;
		});
		return map;
	};

	RoutingEventsManager.prototype.tripAbsorptionClick = function(tripId)
	{
		var self = this;
		var editTrips = self.dataModel.trips.filter(function(trip) { return trip.OpenType == "Edit" && trip.id != tripId });
		var trip = self.dataModel.getTripById(tripId);
		var tripStops = $.extend(true, [], trip.FieldTripStops.filter(function(stop) { return stop.SchoolCode == null || stop.SchoolCode.length == 0 }));
		var promise = tf.modalManager.showModal(
			new TF.RoutingMap.RoutingPalette.SelectTripModalViewModel(editTrips, { title: "Absorption" })
		);
		self.viewModel.routingChangePath.stop();
		promise.then(function(data)
		{
			if (!data) return;
			var targetTrips = data.length == 0 ? editTrips : data;
			if (targetTrips.length == 0) return;

			self.vrpTool.getTripAbsorption(tripStops, targetTrips, self.viewModel.drawTool).then(function(result)
			//self.vrpTool.getSmartAssignment_multi(tripStops, targetTrips, true, self.viewModel.drawTool, true).then(function(result)
			{
				if (result && $.isArray(result) && result.length > 0)
				{
					var stopsToDelete = trip.FieldTripStops.filter(function(stop) { return result.filter(function(so) { return so.id == stop.id }).length > 0 });
					self.dataModel.fieldTripStopDataModel.delete(stopsToDelete, false, true);
					result = result.sort(function(a, b) { return parseInt(a.FieldTripId) - parseInt(b.FieldTripId) });

					var sequences = result.filter(function(stop) { return stop.Sequence; }).map(
						function(stop)
						{
							//remove lock tag before move to other trip
							stop.LockStopTime = false;
							return stop.Sequence;
						});

					var stopCreatePromises = [];
					targetTrips.forEach(function(targetTrip)
					{
						var newStops = result.filter(function(stop) { return stop.FieldTripId == targetTrip.id });
						if (newStops.length > 0)
						{
							stopCreatePromises.push(self.dataModel.fieldTripStopDataModel.moveTripStopsFromOtherTrip(newStops, targetTrip.FieldTripStops, sequences, true, null, null, null, true));
						}
					});

					return Promise.all(stopCreatePromises).then(function()
					{
						tf.loadingIndicator.tryHide();
					})
				} else
				{
					tf.loadingIndicator.tryHide();
					var message = "No stop was absorbed, please check the district policy settings and UTurn policy.";
					if (result) message += "\n" + result;
					tf.promiseBootbox.alert(message);

				}
			})
		})
	}

	RoutingEventsManager.prototype.optimizeSequenceClick = function(tripId)
	{
		var self = this, tripStopRouteDictionary = {};
		var oldTrip = self.dataModel.getTripById(tripId);
		if (oldTrip.FieldTripStops.length <= 1)
		{
			return tf.promiseBootbox.alert("No path need to optimize.");
		}
		self.viewModel.routingChangePath.stop();
		tf.loadingIndicator.show();
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
		return this.optimizeSequenceOnTrip(newTrip).then(function(result)
		{
			tf.loadingIndicator.tryHide();
			if (!result) return tf.promiseBootbox.alert("One or more locations cannot be reached!");
			return tf.modalManager.showModal(
				new TF.RoutingMap.RoutingPalette.OptimizeSequenceModalViewModel(oldTrip, newTrip, self.dataModel)
			).then(function(data)
			{
				if (data == "SaveAsNew")
				{
					newTrip.Name = newTrip.Name + ' Copy';
					self.dataModel.resetCopyTripValue(newTrip);
					self.dataModel.saveAsNewTrip(newTrip);
					return;
				}
				if (data)
				{
					self._applyOptimizeSequenceChange(newTrip);
				}
			});
		});
	};

	RoutingEventsManager.prototype._applyOptimizeSequenceChange = function(newTrip)
	{
		var self = this;
		newTrip.durationDiffRate = 0;
		newTrip.distanceDiffRate = 0;
		newTrip.durationDiff = 0;
		newTrip.distanceDiff = 0;
		var oldTrip;
		for (var i = 0; i < self.dataModel.trips.length; i++)
		{
			if (self.dataModel.trips[i].id == newTrip.id)
			{
				oldTrip = self.dataModel.trips[i];
				self.dataModel.trips[i] = newTrip;
				break;
			}
		}
		self.dataModel.onTripsChangeEvent.notify({ add: [], edit: [], delete: [oldTrip] });
		self.dataModel.onTripsChangeEvent.notify({ add: [newTrip], edit: [], delete: [], notZoom: true, options: { resetScheduleTime: true } });
		self.dataModel.changeDataStack.push(newTrip);
	};

	RoutingEventsManager.prototype.optimizeSequenceOnTrip = function(trip)
	{
		var self = this;
		var tripStops = [];
		var promiseList = [];
		var startIndex = 0;
		for (var i = 0; i < trip.FieldTripStops.length; i++)
		{
			if (i != 0 && trip.FieldTripStops[i].SchoolCode)
			{
				promiseList.push(self.viewModel.drawTool.NAtool.refreshTripByMultiStops(trip.FieldTripStops.slice(startIndex, i + 1), true));
				startIndex = i;
			}
			else if (i == trip.FieldTripStops.length - 1 && (trip.FieldTripStops[i].SchoolCode === "" || trip.FieldTripStops[i].SchoolCode === null))
			{
				promiseList.push(self.viewModel.drawTool.NAtool.refreshTripByMultiStops(trip.FieldTripStops.slice(startIndex, i + 1), true));
			}
		}
		return Promise.all(promiseList).then(function(newList)
		{
			if (!newList || newList.filter(r => !r || r.err).length > 0)
			{
				tf.loadingIndicator.tryHide();
				return false;
			}
			newList.map(function(stopsList, index)
			{
				if (index == 0)
				{
					tripStops = tripStops.concat(stopsList);
				}
				else
				{
					tripStops = tripStops.concat(stopsList.slice(1, stopsList.length));
				}
			});
			trip.FieldTripStops = tripStops;
			trip.FieldTripStops.map(function(tripStop, index)
			{
				tripStop.Sequence = index + 1;
			});
			return trip;
		}).then(function(newTrip)
		{
			if (!newTrip) return false;
			return self.dataModel.recalculate([newTrip]).then(function(response)
			{
				var tripData = response[0];
				newTrip.Distance = tripData.Distance;

				for (var j = 0; j < newTrip.FieldTripStops.length; j++)
				{
					newTrip.FieldTripStops[j].TotalStopTime = tripData.FieldTripStops[j].TotalStopTime;
					newTrip.FieldTripStops[j].Duration = tripData.FieldTripStops[j].Duration;
				}
				self.dataModel.setActualStopTime([newTrip]);
				return newTrip;
			});
		});
	};

	RoutingEventsManager.prototype.editTripStopClick = function(type, stopId, fieldTripId)
	{
		console.log("Move Stop Location clicked", stopId, fieldTripId);

		const data = { fieldTripId, stopId };
		PubSub.publish(TF.RoutingPalette.FieldTripMapEventEnum.MoveStopLocation, data);
	};

	RoutingEventsManager.prototype.addRegionClick = function(type, data)
	{
		this.viewModel.routingChangePath.stop();
		this.viewModel.drawTool.addRegion(type, data.id);
	};

	RoutingEventsManager.prototype.removeRegionClick = function(type, data)
	{
		this.viewModel.routingChangePath.stop();
		this.viewModel.drawTool.removeRegion(type, data.id);
	};

	RoutingEventsManager.prototype.redrawClick = function(type, data)
	{
		this.viewModel.routingChangePath.stop();
		this.viewModel.drawTool.redrawRegion(type, data.id);
	};

	RoutingEventsManager.prototype.reshapeClick = function(type, data)
	{
		this.viewModel.routingChangePath.stop();
		this.viewModel.drawTool.reshape(data.id);
	};

	RoutingEventsManager.prototype.deleteOneClick = function(fieldTripStopId, fieldTripId, e)
	{
		e.stopPropagation();
		let  msg = "Are you sure you want to delete this field trip stop?";

		return tf.promiseBootbox.yesNo({
			message: msg,
			maxHeight: 600,
			closeButton: true
		}, "Confirmation").then(result =>
		{
			console.log("Stop Delete clicked", fieldTripStopId, fieldTripId);
			if (result)
			{
				const data = { fieldTripId, fieldTripStopId };
				PubSub.publish(TF.RoutingPalette.FieldTripMapEventEnum.DeleteStopLocation, data);

				this.viewModel.routingChangePath && this.viewModel.routingChangePath.clearAll();
				this._viewModal.setMode("Routing", "Normal");
			}

			PubSub.publish("clear_ContextMenu_Operation");
			return result;
		});
	};

	RoutingEventsManager.prototype.stopEditing = function(e, items)
	{
		var self = this;
		self.dataModel.update(items[0]).then(function(results)
		{
			if (items[1] && items[1].length > 0)
			{
				results.filter(function(result)
				{
					if (items[1][result.id]) return result;
				});

				self.dataModel.onStudentCrossStreetStopChangeEvent.notify(results);
			}

		});
	};

	RoutingEventsManager.prototype.saveClick = function(modal, e)
	{
		e.stopPropagation();
		var self = this;
		var trips = this.dataModel.getChangedTrips();
		if (trips.length > 0)
		{
			tf.modalManager.showModal(
				new TF.RoutingMap.RoutingPalette.SelectTripModalViewModel(trips, { title: "Select Field Trip", otherButtonName: "Save All Field Trips", optionType: "save" }, self.dataModel)
			).then(function(data)
			{
				if (data && data.length > 0)
				{
					self.dataModel.saveFieldTrip(trips.filter(function(trip)
					{
						return Enumerable.From(data).Any(function(p) { return p.id == trip.id; });
					}));
				}
			});
		}

	};

	RoutingEventsManager.prototype.revertClick = function(modal, e)
	{
		e.stopPropagation();
		var self = this;
		var trips = this.dataModel.getChangedTrips();
		if (trips.length > 0)
		{
			tf.modalManager.showModal(
				new TF.RoutingMap.RoutingPalette.SelectTripModalViewModel(trips, { title: "Select Field Trip", otherButtonName: "Revert All Field Trips", optionType: "revert" }, self.dataModel)
			).then(function(data)
			{
				if (data && data.length > 0)
				{
					self.dataModel.revert(trips.filter(function(trip)
					{
						return Enumerable.From(data).Any(function(p) { return p.id == trip.id; });
					}));
				}
			});
		}
	};

	RoutingEventsManager.prototype.showDirectionClick = function(data)
	{
		var self = this;
		this.clearMode();
		var trip = self.dataModel.getTripById(data.id);
		var tripStops = trip.FieldTripStops;
		self._showRoutingDirectionModalViewModel(tripStops, trip, false);
	};

	RoutingEventsManager.prototype.tripPathInfoClick = function(data)
	{
		var self = this;
		this.clearMode();
		var trip = data.trip;
		var tripStops = data.tripStops;
		self._showRoutingDirectionModalViewModel(tripStops, trip, true);
	};

	RoutingEventsManager.prototype.refreshPathClick = function(data)
	{
		this.clearMode();
		this.viewModel.routingChangePath && this.viewModel.routingChangePath.clearAll();

		tf.loadingIndicator.enhancedShow(this.viewModel.viewModel.onRefreshFieldTripPath({fieldTripId: data.id}));
	};

	/**
	* ctrl+m to refresh the missing trip path
	*/
	RoutingEventsManager.prototype.bindRefreshMissingTripPathEvent = function()
	{
		var self = this;
		tf.documentEvent.bind("keydown.refreshTripPath", self.routeState, function(e)
		{
			var trips = self.dataModel.getEditTrips(),
				mKey = 77;
			if (trips.length > 0 && e.ctrlKey && e.keyCode == mKey)
			{
				var refreshTripPathPromises = [];
				tf.loadingIndicator.show();
				trips.forEach(function(trip)
				{
					trip.FieldTripStops.forEach(function(tripStop, stopIndex)
					{
						// not last stop and has no path
						if (stopIndex != trip.FieldTripStops.length - 1 && (!tripStop.path || !tripStop.path.geometry))
						{
							refreshTripPathPromises.push(
								self._refreshTripPath(tripStop, trip.FieldTripStops[stopIndex + 1])
							);
						}
					});
				});
				Promise.all(refreshTripPathPromises).then(function()
				{
					tf.loadingIndicator.tryHide();
				});
			}
		});
	};

	RoutingEventsManager.prototype.tripPathRefreshClick = function(data)
	{
		this.clearMode();
		var tripStops = data.tripStops;
		var trip = data.trip;
		if (tripStops)
		{
			var tripStop = tripStops[0];
			var nextTripStop = trip.FieldTripStops[tripStop.Sequence];
			tripStop.routeStops = null;
			tf.loadingIndicator.show();
			this._refreshTripPath(tripStop, nextTripStop)
				.then(function()
				{
					tf.loadingIndicator.tryHide();
				});
		}
	};

	RoutingEventsManager.prototype._refreshTripPath = function(tripStopStart, tripStopEnd)
	{
		var self = this;
		return this.viewModel.drawTool.NAtool.refreshTripByMultiStops([tripStopStart, tripStopEnd], null, null, null, true)
			.then(function(result)
			{
				if (result && $.isArray(result))
				{
					self.dataModel.fieldTripStopDataModel.updatePath(tripStopStart);
				} else
				{
					var tripStopChanged = $.extend(true, {}, tripStopStart);
					if (tripStopChanged.path && tripStopChanged.path.geometry) tripStopChanged.path.geometry.paths = [];
					self.dataModel.fieldTripStopDataModel.updatePath(tripStopChanged);
				}

			});
	};

	RoutingEventsManager.prototype.clearMode = function()
	{
		this._viewModal.setMode("Routing", "Normal");
		PubSub.publish("clear_ContextMenu_Operation");
		this.viewModel.routingChangePath && this.viewModel.routingChangePath.stop();
	};

	RoutingEventsManager.prototype._showRoutingDirectionModalViewModel = function(tripStops, trip, isShowStopTitle)
	{
		tf.modalManager.showModal(
			new TF.RoutingMap.RoutingPalette.RoutingDirectionModalViewModel(tripStops, trip, isShowStopTitle)
		).then(result =>
		{
			if (result && trip.OpenType !== "View")
			{
				this.dataModel.changeDataStack.push(trip);
			}
		});
	};

	RoutingEventsManager.prototype.tripPathEditClick = function(data)
	{
		var self = this;
		this.clearMode();
		var tripStops = data.tripStops;
		if (tripStops)
		{
			self.viewModel.routingChangePath.route(tripStops[0]);
		}
	};

	/**
	* delete the trip path click
	*/
	RoutingEventsManager.prototype.tripPathDeleteClick = function(data)
	{
		this.clearMode();
		var tripStop = data.tripStop;
		tripStop.path = {};
		this.dataModel.fieldTripStopDataModel.updatePath(tripStop);
	};

	RoutingEventsManager.prototype.tripDetailsClick = function(data)
	{
		this.requireDetailsEvent.notify({ dataType: "trip", ids: [data.id] });
	};

	// #region vrp 

	RoutingEventsManager.prototype.vrpRouteClick = function(modal, e, isOrderPair)
	{
		var self = this;
		var trips = self.dataModel.getEditTrips();
		if (trips.length == 0)
		{
			return;
		}
		self.viewModel.routingChangePath.stop();
		var promise = Promise.resolve(trips);
		promise = tf.modalManager.showModal(
			new TF.RoutingMap.RoutingPalette.SelectTripModalViewModel(trips, { title: "Select Field Trips", otherButtonName: "Optimize All Field Trips", isVrpClick: true })
		);
		promise.then(function(data)
		{
			if (!data || data.length == 0) return;
			var containsStop = false;
			for (var i = 0; i < data.length; i++)
			{
				for (var j = 0; j < data[i].FieldTripStops.length; j++)
				{
					if (data[i].FieldTripStops[j].SchoolCode == "" || data[i].FieldTripStops[j].SchoolCode == null)
					{
						containsStop = true;
						break;
					}
				}
			}
			if (!containsStop) return tf.promiseBootbox.alert("Unable to solve vrp, Please add Trip Stops on the map!");
			tf.loadingIndicator.show();
			Promise.all([self.dataModel.loadDistrictPolicy(), self.dataModel.loadTrip(data)])
				.then(function(result)
				{
					return self.vrpTool.getVRP(data, self.viewModel.drawTool);
				}).then(function(newTripStops)
				{
					// if (self._isSameSchoolLocationForAllTripsVRP(trips))
					// {
					// 	return newTripStops;
					// }
					return self._solveRouteSchoolLocations(newTripStops, trips);
				}).then(function(newTripStops)
				{
					if (newTripStops) PubSub.publish(topicCombine(pb.DATA_CHANGE, "stoppath"), newTripStops);
					self._displayVRPRoute(newTripStops, data);
				});
		});

		tf.gaHelper.send("Area", "Trip Optimization", "");	// Send Google Analytics event
	};

	RoutingEventsManager.prototype._solveRouteSchoolLocations = function(newTripStops, trips)
	{
		var self = this;
		if (!newTripStops || !($.isArray(newTripStops))) return newTripStops;
		var isToSchool = self.dataModel.getSession() == 0, promises = [];
		if (newTripStops.length > trips.length)
		{
			for (var i = trips.length; i < newTripStops.length; i++)
			{
				if (isToSchool) newTripStops[i][newTripStops[i].length - 1].SchoolLocation = null;
				else newTripStops[i][0].SchoolLocation = null;
			}
		}

		newTripStops.forEach(function(newTrip)
		{
			promises.push(self.viewModel.drawTool.NAtool.refreshTripByMultiStops(newTrip));

		});
		return Promise.all(promises).then(function(results)
		{
			results.forEach(function(result, index)
			{
				if (result)
				{
					newTripStops[index].forEach(function(newTripStop, i)
					{
						if (!result[i] || !result[i].path) return;
						newTripStop.path = result[i].path;
						newTripStop.Speed = result[i].Speed;
						newTripStop.Distance = result[i].Distance;
						newTripStop.DrivingDirections = result[i].DrivingDirections;
						newTripStop.RouteDrivingDirections = result[i].DrivingDirections;
						newTripStop.IsCustomDirection = false;
						newTripStop.SchoolLocation = result[i].SchoolLocation;
					});
				}
			});
			return Promise.resolve(newTripStops);
		});
	};

	RoutingEventsManager.prototype._getResultTrips = function(newTripStops, trips)
	{
		if (newTripStops.length >= trips.length) return newTripStops;
		for (var i = newTripStops.length; i < trips.length; i++)
		{
			var schools = trips[i].FieldTripStops.filter(function(stop) { return stop.SchoolCode && stop.SchoolCode.length > 0 });
			schools.forEach(function(stop, i) { stop.Sequence = i + 1; })
			newTripStops.push(schools);
		}
		return newTripStops;
	}

	RoutingEventsManager.prototype.copyTrips = function(trips)
	{
		var copyTrips = [];
		trips.forEach(function(trip)
		{
			var newTrip = JSON.parse(JSON.stringify(trip));
			TF.loopCloneGeometry(newTrip, trip);
			copyTrips.push(newTrip);
		});
		return copyTrips;

	}

	RoutingEventsManager.prototype._displayVRPRoute = function(newTripStops, trips)
	{
		if (!newTripStops || !$.isArray(newTripStops))
		{
			tf.loadingIndicator.tryHide();
			return;
		}
		var self = this;
		self._getResultTrips(newTripStops, trips);
		var oldTrips = self.copyTrips(trips);
		var newTrips = [];
		var newIndex = 1;
		var id = TF.createId();
		var promiselist = [];
		var otherColorIndex = 0;
		newTripStops.forEach(function(tripStops, i)
		{
			var newTrip = {};
			if (oldTrips[i])
			{
				var trip = oldTrips[i];
				newTrip = $.extend({}, trip);
				tripStops.forEach(function(tripStop, i)
				{
					tripStop.FieldTripId = trip.id;
					if (tripStop.path) tripStop.path.FieldTripId = trip.id;
					if (tripStop.boundary) tripStop.boundary.FieldTripId = trip.id;
					tripStop.routeStops = null;
					tripStop.color = trip.color;
					tripStop.Sequence = i + 1;
				});
			} else
			{
				id = id + newIndex;
				newTrip = $.extend({}, oldTrips[0]);
				self._clearTripInfo(newTrip);
				newTrip.id = id;
				newTrip.Id = id;
				newTrip.color = self.dataModel.generateColor(null, otherColorIndex);
				otherColorIndex++;
				newTrip.Name = "new Trip " + newIndex;
				newTrip.UnsavedNewTrip = true;
				tripStops.forEach(function(stop, i)
				{
					stop.FieldTripId = newTrip.id;
					if (stop.boundary) stop.boundary.FieldTripId = newTrip.id;
					if (stop.path) stop.path.FieldTripId = newTrip.id;
					//stop.TripStopId = Number(id + "0" + i);
					//stop.id = stop.TripStopId;
					stop.Sequence = i + 1;
					if (i == tripStops.length - 1 || i == 0)
					{
						stop.TripStopId = TF.createId();
						stop.id = stop.TripStopId;
					}
					stop.Students.map(function(student)
					{
						student.TripID = newTrip.id;
					});
				});
				newIndex++;
			}
			newTrip.FieldTripStops = tripStops.sort(function(a, b)
			{
				return a.Sequence > b.Sequence ? 1 : -1;
			});
			promiselist.push(self.dataModel.recalculate([newTrip]).then(function(response)
			{
				var tripData = response[0];
				newTrip.Distance = tripData.Distance;

				for (var j = 0; j < newTrip.FieldTripStops.length; j++)
				{
					newTrip.FieldTripStops[j].TotalStopTime = tripData.FieldTripStops[j].TotalStopTime;
					newTrip.FieldTripStops[j].Duration = tripData.FieldTripStops[j].Duration;
				}
				self.dataModel.setActualStopTime([newTrip], true);
				// if (oldTrips.filter(function(trip) { return trip.id == newTrip.id }).length == 0)
				// {
				// 	self.dataModel.resetCopyTripValue(newTrip);
				// }
				self.dataModel.copyStopTimeWithActualTime([newTrip]);
				self.dataModel.setStudentTravelTimeVRP([newTrip]);
				newTrips.push(newTrip);
				return Promise.resolve(newTrip);
			}));

		});
		Promise.all(promiselist).then(function()
		{
			var trips = [];
			newTrips.forEach(function(newTrip)
			{
				if (oldTrips.filter(function(oldTrip) { return oldTrip.id == newTrip.id; }).length > 0)
				{
					trips.unshift(newTrip);
				} else
				{
					trips.push(newTrip);
				}
			});
			self._displaySummaryModal(oldTrips, trips);
		});

		// self.dataModel.onTripDisplayRefreshEvent.notify(trips, null, null, [true]);
	};
	RoutingEventsManager.prototype._clearTripInfo = function(trip)
	{
		trip.AideName = null;
		trip.Driver = null;
		trip.DriverId = null;
		trip.DriverName = null;
		trip.DriverLastName = null;
		trip.DriverFirstName = null;
		trip.VehicleId = null;
		trip.VehicleName = null;
		trip.BusAide = false;
		trip.BusAideName = null;
		trip.AideId = 0;
		trip.AideLastName = null;
		trip.AideFirstName = null;
		trip.Description = null;
		trip.Comments = null;
	}
	RoutingEventsManager.prototype._displaySummaryModal = function(oldTrips, newTrips)
	{
		var self = this, oldTripDataList = [],
			newTripDataList = [];
		Promise.all([
			this.viewModel.display.resetTripInfo(oldTrips, true),
			this.viewModel.display.resetTripInfo(newTrips, true)]).then(function()
			{
				newSummaryTripObject(oldTrips, oldTripDataList);
				newSummaryTripObject(newTrips, newTripDataList);
				tf.modalManager.showModal(
					new TF.RoutingMap.RoutingPalette.VRPSummaryModalViewModel({
						newTrips: newTripDataList,
						oldTrips: oldTripDataList,
						onUiInit: function()
						{
							tf.loadingIndicator.tryHide();
						}
					})
				).then(function(res)
				{
					if (res)
					{
						tf.loadingIndicator.show();
						self._createNewTripForNotSolvedStops(oldTrips, newTrips).then(function(notSolvedTrip)
						{
							if (notSolvedTrip) newTrips.push(notSolvedTrip);
							if (res == "OpenInNewMap")
							{
								// var tripsOpenInNewCanvas = newTrips.filter(function(trip)
								// {
								// 	return trip.FieldTripStops.length > 2;
								// });
								// set trip type to view
								newTrips.map(function(trip)
								{
									trip.OpenType = 'View';
									trip.visible = true;
									trip.FieldTripStops.map(function(tripStop)
									{
										tripStop.OpenType = 'View';
										// view trip only display assigned student
										tripStop.TotalStudentCount = tripStop.AssignedStudentCount;
										tripStop.Students.map(function(student)
										{
											student.OpenType = 'View';
											student.TripID = tripStop.FieldTripId;
										});
									});
								});
								tf.documentManagerViewModel.add(new TF.Document.DocumentData(TF.Document.DocumentData.RoutingMap, { type: 'RoutingMap', tabName: 'Routing Map', trips: newTrips, autoOpen: false })).then((routeState) =>
								{
									self.viewModel.dataModel._viewModal.RoutingMapTool.compareMapCanvasTool.openCompareMapCanvasByRouteState(routeState);
								});
							}
							else
							{
								self._applyVrpTrips(newTrips, oldTrips);
							}
							tf.loadingIndicator.tryHide();
						});
					}
				});
			});

		function newSummaryTripObject(source, toArray)
		{
			source.forEach(function(trip)
			{
				toArray.push({
					name: trip.Name,
					students: trip.NumTransport,
					stops: trip.FieldTripStops.length,
					time: convertToMoment(trip.ActualEndTime).diff(convertToMoment(trip.ActualStartTime), 'minutes'),
					distance: trip.Distance
				});
			});
		}
	};
	RoutingEventsManager.prototype._applyVrpTrips = function(newTrips, oldTrips)
	{
		var self = this, deleteTripIds = [];
		// update and delete trips
		newTrips.slice(0, oldTrips.length).forEach(function(trip, index)
		{
			for (var i = 0; i < self.dataModel.trips.length; i++)
			{
				if (self.dataModel.trips[i].id == trip.id)
				{
					trip.FieldTripStops.map(function(tripStop)
					{
						tripStop.Students.map(function(student)
						{
							student.TripID = tripStop.FieldTripId;
						});
					});
					self.dataModel.trips[i] = trip;
					self.dataModel.changeDataStack.push(trip);

					// if (trip.FieldTripStops.length > 2)
					// {
					self.dataModel.onTripsChangeEvent.notify({ add: [], edit: [trip], delete: [] });
					if (self.dataModel.showImpactDifferenceChart()) { self.dataModel.refreshOptimizeSequenceRate(trip.id); }
					// } else
					// {
					// 	self.dataModel.onTripsChangeEvent.notify({ add: [], edit: [], delete: [oldTrips[index]] });
					// 	deleteTripIds.push(trip.id);
					// }
					break;
				}
			}
		});
		// remove delete trips from dataModel trips array
		self.dataModel.trips = self.dataModel.trips.filter(function(trip)
		{
			return deleteTripIds.indexOf(trip.id) < 0;
		});

		// create new trips
		newTrips.slice(oldTrips.length, newTrips.length).forEach(function(trip)
		{
			let schoolStops = {};
			trip.FieldTripStops.forEach(s =>
			{
				if (s.SchoolCode)
				{
					s.id = TF.createId();
					schoolStops[s.SchoolCode] = s.id;
				}
			});

			trip.FieldTripStops.forEach(s =>
			{
				if (!s.SchoolCode)
				{
					s.Students.forEach(stu =>
					{
						stu.AnotherTripStopID = schoolStops[stu.SchoolCode];
					});
				}
			});

			self.dataModel.createNewTrip(trip);
			self.dataModel.refreshOptimizeSequenceRate(trip.id);
		});

	};

	RoutingEventsManager.prototype._createNewTripForNotSolvedStops = function(oldTrips, newTrips)
	{
		var self = this;
		var unassignedStops = [];
		var allAssignedStops = [];
		var id = TF.createId();
		var unassignedStopsTrip = JSON.parse(JSON.stringify(oldTrips[0]));
		TF.loopCloneGeometry(unassignedStopsTrip, oldTrips[0]);
		unassignedStopsTrip.id = id;
		unassignedStopsTrip.Id = id;
		unassignedStopsTrip.TravelScenarioId = oldTrips[0].TravelScenarioId;
		unassignedStopsTrip.Name = "Not Solved Trip";
		newTrips.forEach(function(trip)
		{
			allAssignedStops = allAssignedStops.concat(trip.FieldTripStops);
		});
		oldTrips.forEach(function(trip)
		{
			var tripCopy = JSON.parse(JSON.stringify(trip));
			TF.loopCloneGeometry(tripCopy, trip);
			tripCopy.FieldTripStops.map(function(stop, index)
			{
				if (allAssignedStops.filter(function(s) { return stop.id == s.id; }).length <= 0 &&
					index != 0 && index != tripCopy.FieldTripStops.length - 1 && (!stop.SchoolCode || stop.SchoolCode.length == 0))
				{
					unassignedStops.push(stop);
				}
			});
		});
		if (unassignedStops.length == 0) { return Promise.resolve(false); }

		var schools = oldTrips[0].FieldTripStops.filter(function(stop) { return stop.SchoolCode && stop.SchoolCode.length > 0 });// oldTrips[0].Session == 0 ? unassignedStopsTrip.FieldTripStops[unassignedStopsTrip.FieldTripStops.length - 1] : unassignedStopsTrip.FieldTripStops[0];
		schools.forEach(function(school)
		{
			school.TripStopId = TF.createId();
			school.id = school.TripStopId;
			school.SchoolLocation = null;
		});

		// if (!self._isSameSchoolLocationForAllTripsVRP(oldTrips))
		// {
		// 	school.SchoolLocation = null;
		// }

		var parkinglot = oldTrips[0].Session == 0 ? unassignedStopsTrip.FieldTripStops[0] : unassignedStopsTrip.FieldTripStops[unassignedStopsTrip.FieldTripStops.length - 1];
		parkinglot.TripStopId = TF.createId();
		parkinglot.id = parkinglot.tripStopId;

		if (oldTrips[0].Session == 0)
		{
			unassignedStops.unshift(parkinglot);
			unassignedStops = unassignedStops.concat(schools);

		} else
		{
			unassignedStops.push(parkinglot);
			unassignedStops = schools.concat(unassignedStops);
		}

		unassignedStops.forEach(function(stop, i)
		{
			stop.FieldTripId = unassignedStopsTrip.id;
			stop.boundary.FieldTripId = unassignedStopsTrip.id;
			if (stop.path) stop.path.FieldTripId = unassignedStopsTrip.id;
			//stop.TripStopId = Number(id + "0" + i);
			stop.Sequence = i + 1;
		});
		//var promise;
		//	var startIndex = 0;
		// for (var i = 0; i < unassignedStops.length; i++)
		// {
		// 	if (i != 0 && unassignedStops[i].SchoolCode)
		// 	{
		var promise = self.viewModel.drawTool.NAtool.refreshTripByMultiStops(unassignedStops, true, null, null, null, unassignedStopsTrip);
		// 		startIndex = i;
		// 	}
		// 	else if (i == unassignedStops.length - 1 && (unassignedStops[i].SchoolCode === "" || unassignedStops[i].SchoolCode === null))
		// 	{
		// 		promiseList.push(self.viewModel.drawTool.NAtool.refreshTripByMultiStops(unassignedStops.slice(startIndex, i + 1), true, null, null, null, unassignedStopsTrip));
		// 	}
		// }
		var newTripStops = [];
		return promise.then(function(newTripStops)
		{
			if (newTripStops && $.isArray(newTripStops))
			{
				unassignedStopsTrip.FieldTripStops = newTripStops;
			} else
			{
				unassignedStopsTrip.FieldTripStops = unassignedStops;
				unassignedStopsTrip.FieldTripStops.map(function(tripStop, index)
				{
					tripStop.Distance = 0;
					tripStop.path = {};
					tripStop.Speed = 0;
				})
			}

			unassignedStopsTrip.FieldTripStops.map(function(tripStop, index)
			{
				tripStop.Sequence = index + 1;
				tripStop.Students.forEach(function(student)
				{
					var schoolCode = self.dataModel.getFieldTripStopByStopId(student.AnotherTripStopID).SchoolCode;
					var schoolStops = unassignedStopsTrip.FieldTripStops.filter(function(stop) { return stop.SchoolCode == schoolCode });
					if (schoolStops.length > 0)
					{
						student.AnotherTripStopID = schoolStops[0].id;
						student.FieldTripId = tripStop.FieldTripId;
					}

				})
			});
			self._clearTripInfo(unassignedStopsTrip);
			return self.dataModel.recalculate([unassignedStopsTrip]).then(function(response)
			{
				var tripData = response[0];
				unassignedStopsTrip.Distance = tripData.Distance;

				for (var j = 0; j < unassignedStopsTrip.FieldTripStops.length; j++)
				{
					unassignedStopsTrip.FieldTripStops[j].TotalStopTime = tripData.FieldTripStops[j].TotalStopTime;
					unassignedStopsTrip.FieldTripStops[j].Duration = tripData.FieldTripStops[j].Duration;
				}
				self.dataModel.setActualStopTime([unassignedStopsTrip], true);
				self.dataModel.resetCopyTripValue(unassignedStopsTrip);
				self.dataModel.copyStopTimeWithActualTime([unassignedStopsTrip]);
				unassignedStopsTrip.color = "#000000";
				return unassignedStopsTrip;
			});
		});
	};
	RoutingEventsManager.prototype._isSameSchoolLocationForAllTripsVRP = function(trips)
	{
		if (this._getVrpDepots(trips)[2]) return true;
		return false;
	}
	RoutingEventsManager.prototype._getVrpDepots = function(trips)
	{
		var self = this;
		var schoolLocations = [], isToSchool = self.dataModel.getSession() == 0;
		var lastDepot, firstDepot;
		for (var i = 0; i < trips.length; i++)
		{
			lastDepot = isToSchool ? trips[i].FieldTripStops[trips[i].FieldTripStops.length - 1] : trips[i].FieldTripStops[0];
			firstDepot = isToSchool ? trips[i].FieldTripStops[0] : trips[i].FieldTripStops[trips[i].FieldTripStops.length - 1];
			if (isToSchool && lastDepot.SchoolLocation)
			{
				schoolLocations.push(lastDepot.SchoolLocation)
			} else if (!isToSchool && firstDepot.SchoolLocation)
			{
				schoolLocations.push(firstDepot.SchoolLocation)
			}
		}
		if (schoolLocations.length == 0) return [firstDepot, lastDepot, true]
		if (schoolLocations.length == trips.length && Enumerable.From(schoolLocations).Distinct(function(c) { return c.Id; }).ToArray().length == 1)
		{
			var results = isToSchool ? [firstDepot, schoolLocations[0], true] : [schoolLocations[0], lastDepot, true];
			return results;
		}
		return [firstDepot, lastDepot];
	}
	// #endregion

	RoutingEventsManager.prototype.playBackClick = function()
	{
		this.playBackControl.toggleShow();
	};

	RoutingEventsManager.prototype.showImpactDifferenceChartClick = function()
	{
		this.dataModel.toggleShowOptimizeChart();
	};

	RoutingEventsManager.prototype.optimizeSequenceMenuClick = function()
	{
		var self = this;
		self.viewModel.routingChangePath.stop();
		tf.modalManager.showModal(
			new TF.RoutingMap.RoutingPalette.SelectTripModalViewModel(this.dataModel.getEditTrips(), { otherButtonName: "Optimize Sequence All Field Trips", title: "Select Field Trip" }, self.dataModel)
		).then(function(data)
		{
			if (data && data.length > 0)
			{
				data.forEach(function(trip)
				{
					tf.loadingIndicator.show();
					self.optimizeSequenceOnTrip(trip).then(function()
					{
						self._applyOptimizeSequenceChange(trip);
						tf.loadingIndicator.tryHide();
					});
				});
			}
		});
	};
})();
(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingDisplay = RoutingDisplay;

	function RoutingDisplay(viewModel)
	{
		var self = this;
		self.viewModel = viewModel;
		self.dataModel = self.viewModel.dataModel;
		self.eventsManager = self.viewModel.eventsManager;
		self.isInitial = true;
		self.dataSource = [];
		self.obFooterDisplay = ko.observable("0 Field Trips, 0 Field Trip Stops");
		self.expandStatusDictionary = {};
		self.treeview;
		self.stopLocationDisctionary = {};
		self.triggerEventType = '';
		self.updateMissionDictionary = {};

		self.dataModel.onTripsChangeEvent.subscribe(self.onTripChange.bind(self));
		self.dataModel.onTripTreeColorChangeEvent.subscribe(self.onTripTreeColorChange.bind(self));
		self.dataModel.onAssignStudentsChangeEvent.subscribe(self.onAssignStudentsChange.bind(self));
		self.dataModel.onTripStopsChangeEvent.subscribe(self.onTripStopsChange.bind(self));
		self.dataModel.onStudentChangeEvent.subscribe(self.onStudentChange.bind(self));
		self.dataModel.onStudentCrossStreetStopChangeEvent.subscribe(self.onStudentCrossStreetStopChangeEvent.bind(self));
		self.changeVisible = self.changeVisible.bind(self);
		self.dataModel.onTripDisplayRefreshEvent.subscribe(self.onTripDisplayRefresh.bind(self));
		self.dataModel.onOptimizeSequenceDiffRateChange.subscribe(self.showOptimizeInfo.bind(self));
		self.dataModel.onShowChartChangeEvent.subscribe(self.onShowChartChange.bind(self));
		self.dataModel.onSchoolLocationChangeEvent.subscribe(self.onSchoolLocationChange.bind(self));
		self.dataModel.onStopCandidateStudentChangeEvent.subscribe(self.onStopCandidateStudentChange.bind(self));
		self.dataModel.onTripSaveEvent.subscribe(self.onTripSaveEvent.bind(self));

		self.routingDisplayFixTitle = new TF.RoutingMap.RoutingPalette.RoutingDisplayFixTitle();
		self.routingDisplayAutoScroll = new TF.RoutingMap.RoutingPalette.RoutingDisplayAutoScroll();
		self.routingDisplayHelper = new TF.RoutingMap.RoutingPalette.RoutingDisplayHelper(self);
		self.isImperialUnit = tf.measurementUnitConverter.isImperial();
	}

	RoutingDisplay.prototype.onTripDisplayRefresh = function(e, trips, displaySummaryModal)
	{
		var self = this;
		self.routingDisplayHelper.clearExpandedDictionary(trips);
		tf.loadingIndicator.showImmediately();
		self.resetTripInfo(trips, !!displaySummaryModal).then(function()
		{
			var newAddList = [],
				oldTripDataList = [],
				newTripDataList = [];
			self.treeview.dataSource.data().map(function(trip)
			{
				var oldTripData = self.newSummaryTripObject(trip.text, trip.customData.students,
					trip.customData.stops, convertToMoment(trip.customData.actualEndTime).diff(convertToMoment(trip.customData.actualStartTime), 'minutes'), trip.customData.distance);
				oldTripDataList.push(oldTripData);
			});

			trips.map(function(trip)
			{
				var newTrip = self.newFieldTripData(trip);
				newAddList.push(newTrip);
				newTripDataList.push(self.newSummaryTripObject(trip.Name, trip.NumTransport,
					trip.TripStops.length, convertToMoment(trip.ActualEndTime).diff(convertToMoment(trip.ActualStartTime), 'minutes'), trip.Distance));
			});

			// self.refreshNextTripData(newAddList);
			var homogeneous = new kendo.data.HierarchicalDataSource({
				data: newAddList,
				sort: { field: "customData.sortValue", dir: "asc" }
			});
			self.treeview.setDataSource(homogeneous);
			self.bindEventAndCustomElement();
			if (displaySummaryModal)
			{
				self.eventsManager._displaySummaryModal(oldTripDataList, newTripDataList);
			}
			trips.map(function(trip)
			{
				self.showOptimizeInfo(null, trip);
			});
			tf.loadingIndicator.tryHide();
		}).catch(function()
		{
			tf.loadingIndicator.tryHide();
		});
	}

	RoutingDisplay.prototype.clearSchoolStudentInfo = function(trips)
	{
		trips.map(function(trip)
		{
			trip.TripStops.map(function(tripStop)
			{
				tripStop.ToSchoolStudents = { HomeToSchool: 0, SchoolToHome: 0 };
				tripStop.ToTransStudents = { HomeToTrans: 0, TransToHome: 0 };
				tripStop.TransToTrans = { PUTransToTrans: 0, DOTransToTrans: 0 };
				tripStop.PUTransToSchool = { TransToSchool: 0, SchoolToTrans: 0 };
				tripStop.DOTransToSchool = { TransToSchool: 0, SchoolToTrans: 0 };
			});
		});
	}

	RoutingDisplay.prototype.newSummaryTripObject = function(name, studentCount, stopCount, time, distance)
	{
		return {
			name: name,
			students: studentCount,
			stops: stopCount,
			time: time,
			distance: distance
		};
	};

	RoutingDisplay.prototype.dropTreeNode = function(e)
	{
		var insertIcon = $('#insertRoutingTripTreeIcon');
		if (insertIcon.length > 0) insertIcon.remove();

		e.preventDefault();
		var self = this;
		self.routingDisplayAutoScroll.onEnd();
		self.viewModel.$element.find("#routingtreeview").removeClass("in-draging-status");
		var source = e.sender.dataItem(e.sourceNode);
		var destination = e.sender.dataItem(e.destinationNode);
		if (!destination || (destination.customData && source.customData && destination.customData.tripId != source.customData.tripId && source.customData.schoolCode))
		{
			return;
		}

		var position = e.dropPosition;
		var currentIndex = source.customData.sequence - 1;

		var destTripId = null,
			sourceTripId = source.customData.tripId;
		if (destination.customData.isTrip && position == "over") destTripId = destination.id; // add to a trip
		else if (destination.customData.isStop) destTripId = destination.customData.tripId;
		if (!destTripId) return;

		var isSameTrip = sourceTripId == destTripId;
		var tripStop = this.dataModel.getTripStopsByStopIds([source.id])[0];
		if (isNullObj(tripStop)) return;

		var originalTripId = tripStop.TripId;
		var invalidStudents = self.dataModel.getInvalidStudentByPUDOStatus(tripStop, destination.customData.tripId);
		var executeCoreInsertion = Promise.resolve(false);
		if (invalidStudents.length > 0)
		{
			// prompt
			executeCoreInsertion = tf.promiseBootbox.confirm(
				{
					message: "As there are students with different PUDO status in destination trip, would you like to unassign students to continue?",
					title: "PUDO Status CONFLICT",
					buttons:
					{
						OK:
						{
							label: "Yes"
						},
						Cancel:
						{
							label: "No"
						}
					}
				})
				.then(function(result)
				{
					if (result)
					{
						self.dataModel.unAssignStudent(invalidStudents, tripStop);
					}
					return result;
				});
		}
		else
		{
			executeCoreInsertion = Promise.resolve(true);
		}

		executeCoreInsertion.then(function(result)
		{
			if (result)
			{
				var destTrip = Enumerable.From(self.dataModel.trips).FirstOrDefault(null, function(c) { return c.id == destTripId; });
				self.routingDisplayHelper.getInsertPosition(position, source, destination, isSameTrip, tripStop, destTrip).then(function(destinationIndex)
				{
					if (destinationIndex == -1 || (isSameTrip && currentIndex == destinationIndex))
					{
						return;
					}

					tf.loadingIndicator.show();

					self.deleteNode(tripStop, isSameTrip);
					self.dataModel.changeStopPosition(tripStop, destTripId, destinationIndex).then(function()
					{
						self.afterChangeStopPosition(tripStop, isSameTrip, originalTripId);
					});
				});
			}
		});
	};

	RoutingDisplay.prototype.afterChangeStopPosition = function(tripStop, isSameTrip, originalTripId)
	{
		var self = this;
		var promises = [];
		var oldTrip = [Enumerable.From(self.dataModel.trips).FirstOrDefault(null, function(c) { return c.id == originalTripId; })];
		promises.push(self.resetTripInfo(oldTrip, null, true).then(function()
		{
			if (!isSameTrip)
			{
				self.setIsValidPropertyOnTree(oldTrip[0]);
				self.refreshAllStopNode(oldTrip[0]);
			}
		}));
		self.addNode(tripStop, isSameTrip);

		if (self.dataModel.showImpactDifferenceChart() && !isSameTrip)
		{
			self.dataModel.refreshOptimizeSequenceRate(oldTrip[0].id, null, null, true);
		}
		var currentTrip = [Enumerable.From(self.dataModel.trips).FirstOrDefault(null, function(c) { return c.id == tripStop.TripId; })];
		promises.push(self.resetTripInfo(currentTrip, null, true).then(function()
		{
			self.setIsValidPropertyOnTree(currentTrip[0]);
			if (self.dataModel.showImpactDifferenceChart())
			{
				self.dataModel.refreshOptimizeSequenceRate(currentTrip[0].id, null, null, true);
			}
			self.refreshAllStopNode(currentTrip[0]);
			tf.loadingIndicator.tryHide();
		}));
		return Promise.all(promises);
	}

	RoutingDisplay.prototype.addMultipleNodes = function(tripStops, trip)
	{
		function _arrayMove(arr, old_index, new_index)
		{
			if (new_index >= arr.length)
			{
				var k = new_index - arr.length + 1;
				while (k--)
				{
					arr.push(undefined);
				}
			}
			arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
			return arr;
		}

		var self = this;
		var tripNode = self.routingDisplayHelper.getExpandedTreeNode(trip.id, 'trip', self.treeview.dataSource);
		var tripStopNodes;
		if (self.routingDisplayHelper.checkNodeWasExpanded(tripNode) && tripNode.children._data.length > 0)
		{
			tripStopNodes = tripNode.children._data;
		}
		else
		{
			tripStopNodes = tripNode.children.options.data.items;
		}
		var schoolStudents = [];
		if (trip.Session != TF.Helper.TripHelper.Sessions.ToSchool)
		{
			trip.TripStops.sort(function(a, b) 
			{
				return a.Sequence < b.Sequence ? 1 : (a.Sequence > b.Sequence ? -1 : 0);
			});
		}
		else
		{
			trip.TripStops.sort(function(a, b) 
			{
				return a.Sequence > b.Sequence ? 1 : (a.Sequence < b.Sequence ? -1 : 0);
			});
		}

		trip.TripStops.map(function(tripStop)
		{
			var oldIndex;
			var tripStopNode = Enumerable.From(tripStopNodes).FirstOrDefault(null, function(ts, index)
			{
				if (isNullObj(ts))
				{
					return false;
				}
				oldIndex = index;
				return ts.id == tripStop.id;
			});
			if (tripStopNode)
			{
				if (tripStopNode.customData.sequence == tripStop.Sequence)
				{
					return;
				}
				if (self.routingDisplayHelper.checkNodeWasExpanded(tripNode))
				{
					self.routingDisplayHelper.resetUnexpandedTreeNodeValue(tripStopNode, tripStop);
					self.routingDisplayHelper.removeTreeNode(tripStopNode, tripNode);
					self._insertNode(tripStop, tripStopNode, tripNode, trip, tripStopNodes);
				}
				else
				{
					_arrayMove(tripStopNodes, oldIndex, tripStop.Sequence - 1);
					self.routingDisplayHelper.resetUnexpandedTreeNodeValue(tripStopNode, tripStop);
				}
			}
			else
			{
				var tripStopTreeView = self.newTripStop(tripStop, trip.Session, trip.Name);
				schoolStudents = schoolStudents.concat(tripStop.Students);
				self._insertNode(tripStop, tripStopTreeView, tripNode, trip, tripStopNodes);
			}
		});
	}

	RoutingDisplay.prototype._insertNode = function(tripStopData, tripStopNode, tripNode, tripData, tripStopNodes)
	{
		var self = this;
		tripStopNode.expanded = !!self.expandStatusDictionary['Stop' + tripStopNode.id];
		if (self.routingDisplayHelper.checkNodeWasExpanded(tripNode))
		{
			if (tripStopData.Sequence == 1 || tripStopData.Sequence == tripData.TripStops.length)
			{
				if (tripStopNodes.length > 0)
				{
					if (tripStopData.Sequence == 1)
					{
						var firstNodeElement = self.treeview.findByUid(tripStopNodes[0].uid);
						self.treeview.insertBefore(tripStopNode, firstNodeElement);
					}
					else
					{
						var lastNodeElement = self.treeview.findByUid(tripStopNodes[tripStopNodes.length - 1].uid);
						self.treeview.insertAfter(tripStopNode, lastNodeElement);
					}
				}
				else
				{
					var tripElement = self.treeview.findByUid(tripNode.uid);
					self.treeview.append(tripStopNode, tripElement, null, !!self.expandStatusDictionary['Stop' + tripStopNode.id]);
				}
			}
			else
			{
				var preTripStop = Enumerable.From(tripStopNodes).FirstOrDefault(null, function(ts) { return ts.customData.sequence == tripStopData.Sequence - 1 });
				var nextTripStop = Enumerable.From(tripStopNodes).FirstOrDefault(null, function(ts) { return ts.customData.sequence == tripStopData.Sequence + 1 });
				if (preTripStop)
				{
					var preNodeElement = self.treeview.findByUid(preTripStop.uid);
					self.treeview.insertAfter(tripStopNode, preNodeElement);
				}
				else if (nextTripStop)
				{
					var nextNodeElement = self.treeview.findByUid(nextTripStop.uid);
					self.treeview.insertBefore(tripStopNode, nextNodeElement);
				}
			}
		}
		else
		{
			if (!tripStopNodes[tripStopData.Sequence - 1])
			{
				tripStopNodes[tripStopData.Sequence - 1] = tripStopNode;
			} else
			{
				tripStopNodes.splice(tripStopData.Sequence - 1, 0, tripStopNode);
			}
		}
	}

	RoutingDisplay.prototype.deleteNode = function(tripStop, isSameTrip)
	{
		var total = 0,
			studentData = [],
			self = this, newLockStopId, tripStopNodes;
		var trip = Enumerable.From(self.dataModel.trips).FirstOrDefault(null, function(c) { return c.id == tripStop.TripId });
		var tripNode = self.routingDisplayHelper.getExpandedTreeNode(tripStop.TripId, 'trip', self.treeview.dataSource);
		var tripWasExpanded = self.routingDisplayHelper.checkNodeWasExpanded(tripNode);
		if (self.routingDisplayHelper.checkNodeWasExpanded(tripNode) && tripNode.children._data.length > 0)
		{
			tripStopNodes = tripNode.children._data;
		}
		else
		{
			tripStopNodes = tripNode.children.options.data.items;
		}
		if (!isSameTrip && tripStop.LockStopTime && tripStopNodes.length > 0)
		{
			if (tripStopNodes[0].id != tripStop.id)
			{
				self.dataModel.setLockTime(tripStopNodes[0].id, trip.id);
			}
			else if (tripStopNodes.length > 1)
			{
				self.dataModel.setLockTime(tripStopNodes[1].id, trip.id);
			}
		}
		var deleteElement, deleteNode;
		tripStopNodes.map(function(oldTripStop)
		{
			if (oldTripStop.id == tripStop.id)
			{
				deleteNode = oldTripStop;
			}
		});
		self.routingDisplayHelper.removeTreeNode(deleteNode, tripNode);
	}

	RoutingDisplay.prototype.addNode = function(tripStop, isSameTrip)
	{
		var self = this;
		var trip = Enumerable.From(self.dataModel.trips).FirstOrDefault(null, function(c) { return c.id == tripStop.TripId });
		var tripStopTreeView = self.newTripStop(tripStop, trip.Session, trip.Name);
		var tripNode = self.routingDisplayHelper.getExpandedTreeNode(tripStop.TripId, 'trip', self.treeview.dataSource);
		var tripWasExpanded = self.routingDisplayHelper.checkNodeWasExpanded(tripNode);
		var insertPositionElement, insertPositionSequence, tripStopNodes, insertBeforeTripStop;
		if (tripWasExpanded && tripNode.children._data.length > 0)
		{
			tripStopNodes = tripNode.children._data;
		}
		else
		{
			tripStopNodes = tripNode.children.options.data.items;
		}
		insertPositionSequence = tripStop.Sequence;
		if (insertPositionSequence != trip.TripStops.length)
		{
			var insertBeforeCurrentTripStop = Enumerable.From(trip.TripStops).FirstOrDefault(null, function(ts)
			{
				return ts.Sequence == tripStop.Sequence + 1;
			});
			if (insertBeforeCurrentTripStop)
			{
				insertBeforeTripStop = Enumerable.From(tripStopNodes).FirstOrDefault(null, function(ts)
				{
					return ts.id == insertBeforeCurrentTripStop.id;
				});
			}
		}
		if (insertBeforeTripStop)
		{
			insertPositionElement = self.treeview.findByUid(insertBeforeTripStop.uid);
		}
		if (insertPositionElement)
		{
			tripStopTreeView.expanded = !!self.expandStatusDictionary['Stop' + tripStopTreeView.id];
			if (tripWasExpanded)
			{
				self.treeview.insertBefore(tripStopTreeView, insertPositionElement);
			}
			else
			{
				tripStopNodes.splice(insertPositionSequence - 1, 0, tripStopTreeView);
			}
		}
		else
		{
			if (tripWasExpanded)
			{
				if (tripStopNodes.length > 0)
				{
					var lastItem = self.treeview.findByUid(tripStopNodes[tripStopNodes.length - 1].uid);
					self.treeview.insertAfter(tripStopTreeView, lastItem);
				}
				else
				{
					//trip does not contain stop
					var changedTrip = self.treeview.findByUid(tripNode.uid);
					self.treeview.append(tripStopTreeView, changedTrip, null, !!self.expandStatusDictionary['Stop' + tripStopTreeView.id]);
				}
			}
			else
			{
				tripStopNodes.splice(tripStopNodes.length, 0, tripStopTreeView);
			}
		}
	}

	RoutingDisplay.prototype.resetTripInfo = function(trips, notReset, clearOptimizeImpact, resetScheduleTime)
	{
		var self = this, tripStopRouteDictionary = {};
		if (trips === null || trips === undefined)
		{
			return Promise.resolve(true);
		}
		//remove route stop path, cause route stop property contain _map property, json copy would catch circular sturcture error
		trips.map(function(trip)
		{
			trip.TripStops.map(function(tripStop)
			{
				if (tripStop.routeStops)
				{
					if (isNullObj(tripStopRouteDictionary[tripStop.id]))
					{
						tripStopRouteDictionary[tripStop.id] = tripStop.routeStops;
					}
					delete tripStop.routeStops;
				}
			});
		})
		return self.dataModel.recalculate(trips).then(function(response)
		{
			trips.map(function(trip)
			{
				//revert removed route stop property
				trip.TripStops.map(function(tripStop)
				{
					if (tripStopRouteDictionary[tripStop.id])
					{
						tripStop.routeStops = tripStopRouteDictionary[tripStop.id];
					}
				});
			})
			var tripData = response;
			for (var i = 0; i < tripData.length; i++)
			{
				if (trips[i].TripStops.length != tripData[i].TripStops.length)
				{
					continue;
				}
				trips[i].NumTransport = tripData[i].NumTransport;
				trips[i].MaxOnBus = tripData[i].MaxOnBus;
				trips[i].Distance = tripData[i].Distance;
				let tripDataTrip = tripData.find(r => r.id == trips[i].id);
				if (tripDataTrip)
				{
					for (var j = 0; j < trips[i].TripStops.length; j++)
					{
						let tripDataStop = tripDataTrip.TripStops.find(n => n.id == trips[i].TripStops[j].id);
						if (!tripDataStop) { continue; }
						trips[i].TripStops[j].TotalStopTime = tripDataStop.TotalStopTime;
						trips[i].TripStops[j].Duration = tripDataStop.Duration;
					}
				}
				self.dataModel.setActualStopTime([trips[i]]);
				self.dataModel.setStopTimeForEmptyRecords(trips[i]);
				if (resetScheduleTime)
				{
					self.dataModel.copyStopTimeWithActualTime([trips[i]]);
				}
				if (!notReset)
				{
					var tripNode = self.treeview.dataSource.getFirst(trips[i].id, function(data)
					{
						return data.customData && data.customData.isTrip;
					});
					if (tripNode)
					{
						self.setTripNodeProperty(tripNode, self.treeview.findByUid(tripNode.uid));
					}
					if (clearOptimizeImpact)
					{
						self.dataModel.clearOptimizeImpact();
					}
				}
			}
			return Promise.resolve(true);
		});
	};

	RoutingDisplay.prototype.initialTreeView = function()
	{
		var self = this;
		var routingtreeview = self.viewModel.$element.find("#routingtreeview");
		routingtreeview.kendoTreeView({
			template: self.routingDisplayHelper.getTreeViewTemplate(),
			dataSource: [],
			dragAndDrop: false,
			sortable: true,
			loadOnDemand: true,
			animation: {
				collapse: false,
				expand: false
			},
			select: function(e)
			{
				closeSchoolLocation(e.node);
				e.preventDefault();
			},
			expand: function(e)
			{
				self.triggerEventType = 'expand';
				var dataItem = self.treeview.dataItem(e.node);
				self.routingDisplayHelper.updateExpandedDictionary(dataItem, true);

				if (dataItem.children._data.length != 0 && dataItem.customData.isStop &&
					dataItem.customData.sequence == dataItem.parent().length)
				{
					self.routingDisplayHelper.toggleLastStopStyle($(e.node).find('.sequence-line'), true);
				}

				var items = dataItem.children._data.length > 0 ? dataItem.children._data : (dataItem.items.length > 0 ? dataItem.items : (dataItem.children ? dataItem.children.options.data.items : dataItem.items));
				items = items.filter(function(item)
				{
					return item.customData.crossToStop === null || item.customData.crossToStop === undefined;
				});
				if (dataItem.customData.isStop &&
					items.length > 0)
				{
					var result = self.handleUnknowCrossingStatusStudents(items);
					if (result != null)
					{
						result.then(function(nodes)
						{
							nodes.map(function(node)
							{
								var studentNodeData = dataItem.children.getFirst(node.id, function(data)
								{
									return data.customData && data.customData.isStudent
										&& data.customData.requirementId == node.customData.requirementId
										&& data.customData.previousScheduleID == node.customData.previousScheduleID
										&& data.customData.tripStopId == node.customData.tripStopId;
								});
								if (studentNodeData)
								{
									self.setStudentNodeProperty(studentNodeData, self.treeview.findByUid(studentNodeData.uid), node.customData.crossToStop);
								}
							});
						});
					}
				}
			},
			collapse: function(e)
			{
				var dataItem = self.treeview.dataItem(e.node);
				self.routingDisplayHelper.updateExpandedDictionary(dataItem, false);

				if (dataItem.customData.isStop &&
					dataItem.customData.sequence == dataItem.parent().length)
				{
					self.routingDisplayHelper.toggleLastStopStyle($(e.node).find('.sequence-line'), false);
				}
				setTimeout(function()
				{
					self.routingDisplayFixTitle.fixTitle();
				}, 300);
			},
			dragstart: function(e)
			{
				closeSchoolLocation(e.sourceNode);
				var customData = e.sender.dataItem($(e.sourceNode)).customData;
				if (isNullObj(customData) || customData.openType === 'View' || !customData.isStop)
				{
					e.preventDefault();
					return;
				}

				var pannelContent = self.viewModel.$element.find("#routingtreeview");
				if (!pannelContent.hasClass("in-draging-status"))
				{
					pannelContent.addClass("in-draging-status");
				}

				self.routingDisplayAutoScroll.onStart(e);
			},
			drag: function(e)
			{
				var dragiconSpan = $('span.k-icon.k-drag-status.k-denied');
				if (dragiconSpan && dragiconSpan.css('background-image') == 'none')
				{
					dragiconSpan.css('background-image', 'url(../../global/thirdparty/kendo/styles/Default/sprite.png)');
					dragiconSpan.css('width', '16px');
				}
				var targetDataItem = e.sender.dataItem($(e.dropTarget));
				var source = e.sender.dataItem(e.sourceNode);
				if (isNullObj(targetDataItem) || !targetDataItem.customData || targetDataItem.customData.openType === 'View'
					|| (targetDataItem.customData && source.customData && targetDataItem.customData.tripId != source.customData.tripId && source.customData.schoolCode))
				{
					var insertIcon = $('#insertRoutingTripTreeIcon');
					if (insertIcon.length > 0) insertIcon.remove();
					e.setStatusClass("k-denied");
					return;
				}
				var status = e.statusClass;
				if (targetDataItem.customData.isTrip && status == "i-plus")
				{
					var insertIcon = $('#insertRoutingTripTreeIcon');
					if (insertIcon.length > 0) insertIcon.remove();
					if (!targetDataItem.expanded)
					{
						e.sender.expand(e.dropTarget);
					}
				}
				else if (targetDataItem.customData.isStop && status.indexOf("i-insert") == 0) 
				{
					setTimeout(function(targetItem)
					{
						var treeViewInsertHint = $('.k-treeview .k-drop-hint');
						if (treeViewInsertHint.length == 0) return;
						var insertIcon = $('#insertRoutingTripTreeIcon');
						if (insertIcon.length > 0) insertIcon.remove();

						var insertIcon = $('<div id="insertRoutingTripTreeIcon" style="background-image:url(data:image/svg+xml;utf8,%3Csvg%3E%3C/svg%3E)"></div>');
						treeViewInsertHint.parent().append(insertIcon);

						var color = this.dataModel.getColorByTripId(targetItem.parent().parent().id).replace('#', '%23');
						var iconSVG = "%3Csvg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none' viewbox='0 0 222 22' width='222' height='22'%3E%3Ccircle cx='11' cy='11' r='9' stroke='" + color + "' fill='" + color + "' stroke-width='1'%3E%3C/circle%3E%3Ccircle cx='11' cy='11' r='10' stroke='%23000000' fill='none' stroke-width='2'%3E%3C/circle%3E%3Cpath d='M22 11L200 11' stroke='" + color + "'%3E%3C/path%3E%3C/svg%3E";

						var top = treeViewInsertHint.css('top');
						var left = treeViewInsertHint.css('left');
						var img = insertIcon.css('background-image');
						insertIcon.css('background-image', img.replace(/%3Csvg(.*?)%3C\/svg%3E/, iconSVG));
						insertIcon.css('position', 'absolute');
						insertIcon.css('left', (parseInt(left) - 9) + 'px');
						insertIcon.css('top', (parseInt(top) - 11) + 'px');
						insertIcon.css('z-index', 10000);
						insertIcon.css('width', '222px');
						insertIcon.css('height', '22px');
					}.bind(self, targetDataItem), 0);
				}
				else
				{
					var insertIcon = $('#insertRoutingTripTreeIcon');
					if (insertIcon.length > 0) insertIcon.remove();
					e.setStatusClass("k-denied");
				}

				self.routingDisplayAutoScroll.onDrag(e);

			},
			dragend: function(e)
			{
				var insertIcon = $('#insertRoutingTripTreeIcon');
				var hints = $('div.k-treeview .k-drop-hint');

				if (insertIcon.length > 0) insertIcon.remove();
				if (hints.length > 0) hints.remove();

				self.routingDisplayAutoScroll.onEnd(e);

			},
			drop: self.dropTreeNode.bind(self),
			dataBound: function(e)
			{
				if (self.treeviewDataBoundTimer != null)
				{
					clearTimeout(self.treeviewDataBoundTimer);
				}

				if (!self.treeview)
				{
					initTree(e);
					return;
				}

				// Avoid updating the treeview UI too often
				const delay = 100;
				self.treeviewDataBoundTimer = setTimeout(() => initTree(e), delay);
			}
		});

		function initTree(e)
		{
			self.treeviewDataBoundTimer = null;
			if (e.node)
			{
				self.setLineColorAndStyle(e.node);
				self.bindEventAndCustomElement(e.node);
				return;
			}

			var tripNodes = self.viewModel.$element.find('#routingtreeview > ul > li');
			tripNodes.prepend('<div class="icon close-current-item" title="Close"></div>');
			self.viewModel.$element.find('#routingtreeview > ul').removeClass('k-group k-treeview-lines').addClass('km-fix-color-palette-position k-group k-treeview-lines');
			tripNodes.map(function(index, tripNode)
			{
				var $tripColor = $(tripNode).find('.trip-color');
				if ($tripColor.data('kendoColorPicker'))
				{
					return;
				}

				self.treeview = routingtreeview.data('kendoTreeView');
				var dataItem = self.treeview.dataItem(tripNode);
				var color = dataItem.customData.color;
				$tripColor.kendoColorPicker({
					buttons: false,
					change: function(e)
					{
						self.routingDisplayHelper.setSequenceLineColor(e.value, tripNode, 'trip');
						self.dataModel.changeTripColor(dataItem.id, e.value);
					},
					value: color,
					open: function(e)
					{
						$(e.sender.element.closest('li')).attr('suspend', 'true');
					}
				});

				self.koBindTripNode(tripNode, dataItem);
			});
			self.routingDisplayFixTitle.init({ scrollContainer: routingtreeview.closest("div.list-container"), fixElements: tripNodes.children("div") });
			//disable double click expand or collapse
			routingtreeview.data('kendoTreeView').items().each(function(i, el)
			{
				$(el).on("dblclick", function(event)
				{
					return false;
				});
			});

			var $closeButton = routingtreeview.find(".icon.close-current-item");
			$closeButton.off('click').on('click', closeClick.bind(self));
			self.viewModel.analyzeTripByDistrictPolicy._displayWarning();
		}

		function closeSchoolLocation(node)
		{
			if ($(node).find("input").data("typeahead"))
			{
				$(node).find("input").data("typeahead").blur();
			}
		}

		var kendoTreeView = routingtreeview.data('kendoTreeView');
		routingtreeview.on("click", ".k-in", function(e)
		{
			if ($(e.target).hasClass('insert-behind-stops-area') ||
				$(e.target).hasClass('insert-front-stops-area') ||
				$(e.target).hasClass('student-requirement') ||
				$(e.target).hasClass('student-PUDOStatus') ||
				$(e.target).hasClass('day') ||
				e.target.closest('.k-colorpicker'))
			{
				return;
			}

			//fix click node button then single click can not toggle node expanded status
			if ($(e.target).closest(".k-item").length > 0 && $($(e.target).closest(".k-item")[0]).attr('suspend') === 'true')
			{
				$($(e.target).closest(".k-item")[0]).attr('suspend', 'false');
			}
			kendoTreeView.toggle($(e.target).closest(".k-item"));
			var dataTemp = self.treeview.dataItem($(e.target).closest('li'));
			if (dataTemp && dataTemp.customData && dataTemp.customData.isTrip)
			{
				self.fixSchoolNodeStyle($(e.target).closest('li'));
			}
		});

		routingtreeview.data("kendoTreeView").templates.dragClue = kendo.template("No. #=data.item.customData.sequence?data.item.customData.sequence:''#, #=data.item.text#<div style='padding-left:20px'>Trip: #=item.customData.tripName?item.customData.tripName:''#, Total Students: #=data.item.customData.totalStudentCount != null ?data.item.customData.totalStudentCount:''#</div>");

		self.isInitial = false;
	};

	RoutingDisplay.prototype.koBindTripNode = function(node, data)
	{
		const textInfoNode = $(node).find(".trip-info-text")[0];
		ko.cleanNode(textInfoNode);
		ko.applyBindings({
			prevLayover: data.prevLayover,
			nextLayover: data.nextLayover,
			customData: {
				students: data.customData.students,
				stops: data.customData.stops,
				tripTotalTime: data.customData.tripTotalTime,
				distance: data.customData.distance,
				measurementUnit: data.customData.measurementUnit,
				startTime: data.customData.startTime,
				endTime: data.customData.endTime,
			}
		}, textInfoNode);
	};

	RoutingDisplay.prototype.handleUnknowCrossingStatusStudents = function(studentNodes)
	{
		var self = this, unknowCrossingStatusStudentNodes = [], unknowCrossingStatusStudents = [];

		var tripStopIds = {};
		studentNodes.map(function(student)
		{
			if (self.dataModel.tripStopDictionary[student.customData.tripStopId])
			{
				var studentEntities = self.dataModel.tripStopDictionary[student.customData.tripStopId].map(function(p) { return p.student });
				var studentCrossStatusCache = Enumerable.From(studentEntities).FirstOrDefault(null, function(p)
				{
					return p.id == student.id && student.customData.requirementId == p.RequirementID && student.customData.previousScheduleID == p.PreviousScheduleID;
				});
				if (studentCrossStatusCache && studentCrossStatusCache.CrossToStop != null)
				{
					return student.customData.crossToStop = studentCrossStatusCache.CrossToStop;
				}
				else
				{
					var studentEntity
					if (!student.customData.isAssigned)
					{
						studentEntity = self.dataModel.getCandidateStudentById(student.id);
					}
					else
					{
						studentEntity = self.dataModel.getAssignedStudentById(student.customData.requirementId, student.customData.tripId, student.customData.previousScheduleID, student.customData.tripStopId, student.id);
					}

					if (!isNullObj(studentEntity))
					{
						unknowCrossingStatusStudents.push(studentEntity);
						unknowCrossingStatusStudentNodes.push(student);

						if (isNullObj(tripStopIds[student.customData.tripStopId]))
						{
							tripStopIds[student.customData.tripStopId] = { entities: [], nodes: [] };
						}
						tripStopIds[student.customData.tripStopId].entities.push(studentEntity);
						tripStopIds[student.customData.tripStopId].nodes.push(student);
					}
				}
			}
		});
		if (unknowCrossingStatusStudents.length == 0)
		{
			return Promise.resolve(studentNodes);
		}
		var promises = [];
		for (var key in tripStopIds)
		{
			(function(key)
			{
				var tripStop = self.dataModel.getTripStopByStopId(key);
				let needCalcuAcrossStreetStudents = tripStopIds[key].entities.filter(stu => stu.XCoord != 0 && stu.YCoord != 0 && stu.RequirementID);
				promises.push(self.dataModel.viewModel.drawTool.NAtool._getAcrossStreetStudents(tripStop, needCalcuAcrossStreetStudents, true).then(function(crossStudentArray)
				{
					tripStopIds[key].nodes.map(function(student)
					{
						if (crossStudentArray[0].indexOf(student.id) == -1)
						{
							student.customData.crossToStop = false;
						}
						else
						{
							student.customData.crossToStop = true;
						}
						self.dataModel.updateStudentCrossStatus(tripStop.id, student, student.customData.crossToStop);
					});
				}));
			})(key);
		}
		return Promise.all(promises).then(function()
		{
			return studentNodes;
		});
	};

	RoutingDisplay.prototype.bindEventAndCustomElement = function()
	{
		this.bindEvent();
		this.bindSchoolLocation();
	};

	RoutingDisplay.prototype.setLineColorAndStyle = function(nodeElement)
	{
		var self = this;
		var dataItem = self.treeview.dataItem(nodeElement);
		if (isNullObj(dataItem))
		{
			return;
		}
		var color = dataItem.customData.isTrip ? self.dataModel.getColorByTripId(dataItem.id) : self.dataModel.getColorByTripId(dataItem.parent().parent().id);
		self.routingDisplayHelper.setSequenceLineColor(color, self.treeview.findByUid(dataItem.uid), dataItem.customData.isTrip ? 'trip' : (dataItem.customData.isStop ? 'tripStop' : 'student'));
		if (dataItem.children._data.length != 0 && dataItem.customData.isStop &&
			dataItem.customData.sequence == dataItem.parent().length)
		{
			self.routingDisplayHelper.toggleLastStopStyle($(nodeElement).find('.sequence-line'), true);
		}
	};

	RoutingDisplay.prototype.setFootInfo = function()
	{
		const self = this,
			tripCount = self.dataModel.trips.length,
			tripStopCount = self.dataModel.trips.reduce((result, trip) => result + trip.FieldTripStops.length, 0);

		self.obFooterDisplay(`${tripCount} ${self.routingDisplayHelper.getSingleOrMultiple(tripCount, 'Field Trip')}, ${tripStopCount} ${self.routingDisplayHelper.getSingleOrMultiple(tripStopCount, 'Field Trip Stop')}`);
	}

	RoutingDisplay.prototype.initSchoolLocationDropDownList = function(schoolLocationContainer, tripStop)
	{
		var schoolLocations = $.extend(true, [], this.dataModel.getSchoolLocationsBySchoolCode(tripStop.SchoolCode));
		if (schoolLocations.length == 0)
		{
			return;
		}
		if (tripStop.SchoolLocation != null)
		{
			tripStop.SchoolLocation = schoolLocations.filter(function(schoolLocation) { return schoolLocation.Id == tripStop.SchoolLocation.Id })[0];
		}
		schoolLocations = schoolLocations.concat([{ Id: -1, Name: 'divide-line' }, { Id: -1, Name: 'School Location' }]);
		var obSchoolLocations = ko.observable(schoolLocations);
		var schoolLocationSelectTemplate = function(Name)
		{
			if (Name != 'divide-line')
			{
				return "<a href=\"#\" role=\"option\" >" + Name + "</a>";
			}
			else
			{
				return "<div style=\"border-top:1px solid;margin-left: 8px;\"></div>";
			}
		}

		var obSelectedSchoolLocation = ko.observable(tripStop.SchoolLocation != null ? tripStop.SchoolLocation.Id : -1);
		var obSelectedSchoolLocationText = ko.observable(tripStop.SchoolLocation != null ? tripStop.SchoolLocation.Name : 'School Location');
		var source = { obSchoolLocations: obSchoolLocations, obSelectedSchoolLocation: obSelectedSchoolLocation, obSelectedSchoolLocationText: obSelectedSchoolLocationText, schoolLocationSelectTemplate: schoolLocationSelectTemplate }
		var schoolLocationDom = $('<div class="input-group" ' + (tripStop.OpenType == 'View' ? 'style="opacity:0.5"' : '') + '><div data-bind="typeahead:{source:obSchoolLocations,format:function(obj){return obj.Name;},template:schoolLocationSelectTemplate,drowDownShow:true,selectedValue:obSelectedSchoolLocation ,notSort:true}" ><input data-bind="value:obSelectedSchoolLocationText" class="form-control" readonly="true" ' +
			(tripStop.OpenType == 'View' ? 'disabled="disabled"' : '') + ' data-notTriggerOtherEvent="true"></div>'
			+ '<div class="input-group-btn"><button type="button" class="btn btn-default btn-sharp"><span class="caret"></span></button></div></div>')
		ko.applyBindings(source, schoolLocationDom[0]);
		schoolLocationContainer.append(schoolLocationDom[0]);
		obSelectedSchoolLocationText.subscribe(this.bindSchoolLocationValue.bind(this, obSchoolLocations, obSelectedSchoolLocation, tripStop));
	};

	RoutingDisplay.prototype.onSchoolLocationChange = function()
	{
		var self = this;
		self.dataModel._getSchoolLocations(self.dataModel.trips).then(function()
		{
			self.bindSchoolLocation();
		});
	};

	RoutingDisplay.prototype.bindSchoolLocationValue = function(obSchoolLocations, obSelectedSchoolLocation, tripStop)
	{
		if (tripStop.SchoolLocation != null && tripStop.SchoolLocation.Id == obSelectedSchoolLocation().Id)
		{
			return;
		}
		var self = this;
		tripStop = $.extend({}, tripStop);
		if (obSelectedSchoolLocation().Id == -1)
		{
			tripStop.SchoolLocation = null;
		} else
		{
			tripStop.SchoolLocation = obSchoolLocations().filter(function(location)
			{
				return location.Id == obSelectedSchoolLocation().Id;
			})[0];
		}

		tripStop.StreetSegment = null;
		self.dataModel.tripStopDataModel.update([tripStop], true);
		self.dataModel.lockSchoolLocation(tripStop);
	};

	RoutingDisplay.prototype.fixSchoolNodeStyle = function(nodeElement)
	{
		var self = this, $schoolNodeElements;
		if (!nodeElement)
		{
			var routingtreeview = self.viewModel.$element.find("#routingtreeview");
			$schoolNodeElements = routingtreeview.find(".school-row");
		}
		else
		{
			$schoolNodeElements = nodeElement.find(".school-row");
		}
		$schoolNodeElements.map(function()
		{
			var el = $(this);
			var data = self.treeview.dataItem(el);
			var trip = self.dataModel.getTripById(data.customData.tripId);
			if (!trip)
			{
				return;
			}
			var tripNode = self.routingDisplayHelper.getExpandedTreeNode(trip.id, 'trip', self.treeview.dataSource);
			if (!tripNode.expanded)
			{
				return;
			}

			var schoolLine = el.find(".sequence-line.school-line"),
				insertStartArea = el.find(".insert-front-stops-area"),
				insertIcon = el.find(".insert-icon"),
				insertEndArea = el.find(".insert-behind-stops-area");
			schoolLine.css("lineHeight", 0);
			var totalHeight = el.height();

			if (totalHeight % 2 == 1)
			{
				totalHeight = totalHeight + 1;
			}
			schoolLine.css("lineHeight", totalHeight + 'px');
			insertStartArea.css("height", (totalHeight - 29) / 2 + 'px');
			insertIcon.css("top", totalHeight - 15 + 'px');
			insertEndArea.css("height", (totalHeight - 29) / 2 + 'px');
			insertEndArea.css("top", totalHeight / 2 + 15 + 'px');
		});
	};

	RoutingDisplay.prototype.bindSchoolLocation = function(nodeElement)
	{
		var self = this, $schoolLocationElements, data, tripStop;
		if (!nodeElement)
		{
			var routingtreeview = self.viewModel.$element.find("#routingtreeview");
			$schoolLocationElements = routingtreeview.find(".school-location");
		}
		else
		{
			$schoolLocationElements = nodeElement.find(".school-location");
		}
		$schoolLocationElements.map(function(index, schoolLocationContainer)
		{
			if (nodeElement)
			{
				data = self.treeview.dataItem(nodeElement);
			}
			else
			{
				data = self.treeview.dataItem(schoolLocationContainer.closest('li'));
			}
			if (data && data.id)
			{
				tripStop = self.dataModel.getTripStopByStopId(data.id);
				if (isNullObj(tripStop) || (tripStop && IsEmptyString(tripStop.SchoolCode)))
				{
					return;
				}
			}

			if ($(schoolLocationContainer).find('.input-group').length != 0)
			{
				$(schoolLocationContainer).empty();
			}
			self.initSchoolLocationDropDownList.call(self, schoolLocationContainer, tripStop);
		});

		self.fixSchoolNodeStyle(nodeElement);
	}

	RoutingDisplay.prototype.bindEvent = function()
	{
		var self = this;
		var routingtreeview = self.viewModel.$element.find("#routingtreeview");

		var $eyeButtons = routingtreeview.find(".icon.show-eye");
		$eyeButtons.off('click').on('click', showClick.bind(self));

		if (!self.dataModel.onChangeTripVisibilityEvent.hasSubscribed(self.changeVisible))
		{
			self.dataModel.onChangeTripVisibilityEvent.subscribe(self.changeVisible)
		}

		var $refreshButtons = routingtreeview.find(".icon.refresh");
		$refreshButtons.off('click').on('click', refreshPathClick.bind(self));

		var $zoomButtons = routingtreeview.find(".icon.zoom-map-to-layers");
		$zoomButtons.off('click').on('click', zoomClick.bind(self));

		var $deleteButtons = routingtreeview.find(".icon.stop-delete");
		$deleteButtons.off('click').on('click', deleteClick.bind(self));

		var $assignStudentForStopButtons = routingtreeview.find(".icon.assign");
		$assignStudentForStopButtons.off('click').on('click', assignStudentForStopClick.bind(self));

		var $infoButtons = routingtreeview.find(".icon.stop-info");
		$infoButtons.off('click').on('click', infoClick.bind(self));

		var $tripInfoButtons = routingtreeview.find(".icon.trip-info");
		$tripInfoButtons.off('click').on('click', tripInfoClick.bind(self));

		var $tripDeleteButtons = routingtreeview.find(".icon.trip-delete");
		$tripDeleteButtons.off('click').on('click', tripDeleteClick.bind(self));

		var $minusButtons = routingtreeview.find(".icon.minus");
		$minusButtons.off('click').on('click', minusClick.bind(self));

		var $addButtons = routingtreeview.find(".icon.add");
		$addButtons.off('click').on('click', addClick.bind(self));

		var $scheduledTimeButtons = routingtreeview.find(".schedule-time");
		$scheduledTimeButtons.off('click').on('click', scheduledTimeClick.bind(self));

		var $avgSpeedButtons = routingtreeview.find(".avg-speed");
		$avgSpeedButtons.off('click').on('click', avgSpeedClick.bind(self));

		var $setLockTimeButtons = routingtreeview.find(".icon.lock-time");
		$setLockTimeButtons.off('click').on('click', setLockTimeClick.bind(self));

		var $copy_information = routingtreeview.find(".icon.copy-information");
		$copy_information.off('click').on('click', copyInformationClick.bind(self));

		var $optimize_sequence = routingtreeview.find(".icon.optimize-sequence");
		$optimize_sequence.off('click').on('click', optimizeSequenceClick.bind(self));

		var $trip_absorption = routingtreeview.find(".icon.trip-absorption");
		$trip_absorption.off('click').on('click', tripAbsorptionClick.bind(self));

		var $assign_student = routingtreeview.find(".icon.assign-student");
		$assign_student.off('click').on('click', assignStudentClick.bind(self));

		var $closeButton = routingtreeview.find(".icon.close-current-item");
		$closeButton.off('click').on('click', closeClick.bind(self));

		var $copyTripButton = routingtreeview.find(".icon.copyTrip");
		$copyTripButton.off('click').on('click', copyTripClick.bind(self));

		var $copyStopButton = routingtreeview.find(".icon.copyStop");
		$copyStopButton.off('click').on('click', copyStopClick.bind(self));

		var $insertBeforeTripStopsButton = routingtreeview.find(".insert-front-stops-area");
		$insertBeforeTripStopsButton.off('click').on('click', insertTripStopsClick.bind(self));
		$insertBeforeTripStopsButton.off('mouseover').on('mouseover', insertBeforeButtonMouseOver.bind(self));
		$insertBeforeTripStopsButton.off('mouseout').on('mouseout', insertBeforeButtonMouseOut.bind(self));

		var $insertBehindTripStopsButton = routingtreeview.find(".insert-behind-stops-area");
		$insertBehindTripStopsButton.off('click').on('click', insertTripStopsClick.bind(self));
		$insertBehindTripStopsButton.off('mouseover').on('mouseover', insertAfterButtonMouseOver.bind(self));
		$insertBehindTripStopsButton.off('mouseout').on('mouseout', insertAfterButtonMouseOut.bind(self));

		var $insertTripStopsButton = routingtreeview.find(".insert-stops-area");
		$insertTripStopsButton.off('click').on('click', insertTripStopsClick.bind(self));
		$insertTripStopsButton.off('mouseover').on('mouseover', insertStopButtonMouseOver.bind(self));
		$insertTripStopsButton.off('mouseout').on('mouseout', insertStopButtonMouseOut.bind(self));

		var $dayButtons = routingtreeview.find(".student-requirement .day");
		$dayButtons.off('click').on('click', studentDayClick.bind(self));

		var $sessionStatusButtons = routingtreeview.find(".student-PUDOStatus .status");
		$sessionStatusButtons.off('click').on('click', studentStatusClick.bind(self));

	}

	function insertBeforeButtonMouseOver(e)
	{
		var icon = $(e.target).closest('li').prev().find(".insert-icon");
		var ul = $(e.target.closest('li')).prev().find('ul');
		if (ul.css('display') != 'none')
		{
			icon.css('top', parseInt(icon.css('top')) + 66 * ul.find('li').length + 'px');
		}
		icon.addClass("show-icon");
	}

	function insertBeforeButtonMouseOut(e)
	{
		var icon = $(e.target).closest('li').prev().find(".insert-icon");
		var ul = $(e.target.closest('li')).prev().find('ul');
		if (ul.css('display') != 'none')
		{
			icon.css('top', parseInt(icon.css('top')) - 66 * ul.find('li').length + 'px');
		}
		icon.removeClass("show-icon");
	}

	function insertAfterButtonMouseOver(e)
	{
		var icon = $(e.target).siblings(".insert-icon");
		icon.addClass("show-icon");
	}

	function insertAfterButtonMouseOut(e)
	{
		var icon = $(e.target).siblings(".insert-icon");
		icon.removeClass("show-icon");
	}

	function insertStopButtonMouseOver(e)
	{
		var icon = $(e.target).closest('ul').closest('li').find(".insert-icon");
		var iconTop = parseInt(icon.css('top'));
		var index = $(e.target.closest('ul')).find('li').index(e.target.closest('li'));
		icon.css('top', iconTop + 66 * index + 'px');
		icon.addClass("show-icon");
	}

	function insertStopButtonMouseOut(e)
	{
		var icon = $(e.target).closest('ul').closest('li').find(".insert-icon");
		var iconTop = parseInt(icon.css('top'));
		var index = $(e.target.closest('ul')).find('li').index(e.target.closest('li'));
		icon.css('top', iconTop - 66 * index + 'px');
		icon.removeClass("show-icon");
	}

	function insertTripStopsClick(e)
	{
		console.log("Tripfinder Next TODO: insertTripStopsClick");
		return;

		var insertIcon, self = this;
		if ($(e.target).hasClass('insert-front-stops-area'))
		{
			insertIcon = $(e.target).closest('li').prev().find(".insert-icon");
		}
		else if ($(e.target).hasClass('insert-behind-stops-area'))
		{
			insertIcon = $(e.target).siblings(".insert-icon");
		}
		else if ($(e.target).hasClass('insert-stops-area'))
		{
			insertIcon = $(e.target).closest('ul').closest('li').find(".insert-icon");
		}
		var data = self.treeview.dataItem(insertIcon.closest('li'));
		if (!data || data.customData.openType === 'View')
		{
			return;
		}
		var tripStop = self.dataModel.getTripStopByStopId(data.id);
		self.dataModel.viewModel.eventsManager.createFromSearchResultClick(null, null, null, tripStop);
	}

	function copyTripClick(e)
	{
		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var data = self.treeview.dataItem(e.target.closest('li'));
		var trip = self.dataModel.getTripById(data.id);
		this.eventsManager.copyTripClick(trip);
	}

	function copyStopClick(e)
	{
		console.log("Tripfinder Next TODO: copyStopClick");
		return;

		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var data = self.treeview.dataItem(e.target.closest('li'));
		this.eventsManager.copyTripStopClick(data.id);
	}

	function closeClick(e)
	{
		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var data = self.treeview.dataItem(e.target.closest('li'));
		var trip = self.dataModel.getTripById(data.id);
		this.eventsManager.closeTripClick(null, null, [trip]);
	}

	function assignStudentClick(e)
	{
		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var data = self.treeview.dataItem(e.target.closest('li'));
		var trip = self.dataModel.getTripById(data.id);
		self.dataModel.autoAssignStudent([trip]);
	}

	function optimizeSequenceClick(e)
	{
		console.log("Tripfinder Next TODO: optimizeSequenceClick");
		return;

		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var data = self.treeview.dataItem(e.target.closest('li'));
		this.eventsManager.optimizeSequenceClick(data.id).then(function(result)
		{

		});
	}

	function tripAbsorptionClick(e)
	{
		console.log("Tripfinder Next TODO: tripAbsorptionClick");
		return;

		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var data = self.treeview.dataItem(e.target.closest('li'));
		this.eventsManager.tripAbsorptionClick(data.id);
	}

	function copyInformationClick(e)
	{
		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var data = self.treeview.dataItem(e.target.closest('li'));
		var lockedTripStop = this.dataModel.getLockTimeStop(data.id);

		return tf.promiseBootbox.confirm(
			{
				message: "You are about to Copy Calculated Duration for all field trip stops. The Duration and the locked field trip stop time (" +
					moment(lockedTripStop.StopTimeArrive || lockedTripStop.StopTimeDepart).format('MM-DD-YYYY h:mm a') + ") will be used to determine the Times. Any manual adjustments to Time will be overwritten. Are you sure you want to continue?",
				title: "Confirmation"
			})
			.then(function(result)
			{
				if (result)
				{
					var trips = [self.dataModel.getTripById(data.id)];

					self.dataModel.setFieldTripActualStopTime(trips);
					self.dataModel.copyFieldTripStopTimeWithActualTime(trips);

					// self.dataModel.setActualStopTime(trips);
					// self.dataModel.copyStopTimeWithActualTime(trips);
					// self.dataModel.setStudentTravelTime(trips);
					var tripNode = self.routingDisplayHelper.getExpandedTreeNode(data.id, 'trip', self.treeview.dataSource);
					var tripElement = self.treeview.findByUid(tripNode.uid);
					self.setTripNodeProperty(tripNode, tripElement);
					self.dataModel.changeDataStack.push(trips[0]);
					// update the timeline of the playback
					self.viewModel.playBackControl.tripPlaybackControlTool.initTripData();
				}
			});
	}

	function scheduledTimeClick(e)
	{
		console.log("Tripfinder Next TODO: scheduledTimeClick");
		return;

		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var data = self.treeview.dataItem(e.target.closest('li'));
		if (data.customData.openType === 'View')
		{
			return;
		}

		var tripStop = self.dataModel.getTripStopByStopId(data.id);
		this.eventsManager.setScheduledTimeClick(tripStop).then(function(result)
		{
			if (result.isUpdatedRelatedTime != undefined)
			{
				self.dataModel.setStudentTravelTime([result.trip]);
				var tripNode = self.routingDisplayHelper.getExpandedTreeNode(result.trip.id, 'trip', self.treeview.dataSource);
				var tripWasExpanded = self.routingDisplayHelper.checkNodeWasExpanded(tripNode);
				var tripElement = self.treeview.findByUid(tripNode.uid);
				if (result.isUpdatedRelatedTime)
				{
					if (tripNode)
					{
						self.setTripNodeProperty(tripNode, tripElement);
					}
				}
				else
				{
					var tripStopNode = self.routingDisplayHelper.getTreeNodeFromParentNode(result.tripStop.id, tripNode, 'tripstop');
					if (tripStopNode)
					{
						if (tripWasExpanded)
						{
							var tripStopElement = self.treeview.findByUid(tripStopNode.uid);
						}
						if (moment(result.tripStop.StopTime, "HH:mm:ss").format('h:mm a') != tripStopNode.customData.stopTime)
						{
							if (result.tripStop.Sequence == 1 || result.tripStop.Sequence == result.trip.TripStops.length)
							{
								if (tripNode)
								{
									self.setTripNodeProperty(tripNode, tripElement);
								}
							}
							else
							{
								self.setTripStopNodeProperty(tripStopNode, tripStopElement);
							}
						}
					}
				}
				self.dataModel.changeDataStack.push(tripStop);
			}
		});
	}

	async function avgSpeedClick(e)
	{
		console.log("Tripfinder Next TODO: avgSpeedClick");
		return;

		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var data = self.treeview.dataItem(e.target.closest('li'));
		if (data.customData.openType === 'View')
		{
			return;
		}

		var tripStop = self.dataModel.getTripStopByStopId(data.id),
			trip = self.dataModel.getTripById(tripStop.TripId),
			generatedPath = self.dataModel.getGeneratedPath(tripStop.id);
		let result = await tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.DrivingPathModalViewModel(tripStop, trip, generatedPath));
		if (result)
		{
			tripStop.Speed = result.avgSpeed;
			trip.SpeedType = -1;
			let response = await self.dataModel.recalculate([trip]);
			var tripData = response[0];
			for (var j = 0; j < trip.TripStops.length; j++)
			{
				trip.TripStops[j].TotalStopTime = tripData.TripStops[j].TotalStopTime;
				trip.TripStops[j].Duration = tripData.TripStops[j].Duration;
			}

			var tripNode = self.treeview.dataSource.getFirst(data.customData.tripId, function(item)
			{
				return item.customData && item.customData.isTrip;
			});
			self.setTripNodeProperty(tripNode, self.treeview.findByUid(tripNode.uid));
			self.dataModel.changeDataStack.push(trip);
		}
	}

	function setLockTimeClick(e)
	{
		console.log("Tripfinder Next TODO: setLockTimeClick");
		return;

		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var data = self.treeview.dataItem(e.target.closest('li'));

		self.dataModel.setLockTime(data.id, data.customData.tripId);

		var tripNode = self.treeview.dataSource.getFirst(data.customData.tripId, function(item)
		{
			return item.customData && item.customData.isTrip;
		});
		if (tripNode)
		{
			var tripElement = self.treeview.findByUid(tripNode.uid);
			self.setTripNodeProperty(tripNode, tripElement, false, true);
		}

		self.dataModel.changeDataStack.push(self.dataModel.getTripStopByStopId(data.id));
	}

	async function assignStudentForStopClick(e)
	{
		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var data = self.treeview.dataItem(e.target.closest('li'));

		let result = await this.eventsManager.assignStudentForStopClick(data.id);
		if (result && result.prohibitStudents && result.prohibitStudents.length > 0)
		{
			return tf.promiseBootbox.alert(result.prohibitStudents.map(s => { return `${s.FirstName} ${s.LastName}` }).join(', ') + ` ${result.prohibitStudents.length == 1 ? 'is' : 'are'} not allowed to cross the road.`, 'Message');
		}
	}

	function showClick(e)
	{
		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var data = self.treeview.dataItem(e.target.closest('li'));
		var visible = $(e.target).hasClass("hide-eye");
		self.dataModel.changeTripVisibility(data.id, visible);

		$(e.target.closest('li')).attr('suspend', 'true');
	}

	function deleteClick(e)
	{
		console.log("Tripfinder Next TODO: deleteClick");
		return;

		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var data = self.treeview.dataItem(e.target.closest('li'));
		var tripStop = self.dataModel.getTripStopByStopId(data.id);
		if (!tripStop)
		{
			return false;
		}
		this.eventsManager.deleteOneClick(tripStop.id, e).then(function(result)
		{
			if (result)
			{
				self.dataModel.changeDataStack.push(tripStop);
			}
		});

	}

	function infoClick(e)
	{
		e.preventDefault();
		e.stopPropagation();
		console.log("Tripfinder Next TODO: field trip stop info infoClick");
		return;

		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var data = self.treeview.dataItem(e.target.closest('li'));
		var tripStop = self.dataModel.getTripStopByStopId(data.id);
		this.eventsManager.infoClick(tripStop);
	}

	function tripInfoClick(e)
	{
		e.preventDefault();
		e.stopPropagation();
		console.log("Tripfinder Next TODO: tripInfoClick");
		return;

		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var data = self.treeview.dataItem(e.target.closest('li'));
		this.eventsManager.tripInfoClick(data);
	}

	function tripDeleteClick(e)
	{
		console.log("Tripfinder Next TODO: tripDeleteClick");
		return;

		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var data = self.treeview.dataItem(e.target.closest('li'));
		this.eventsManager.deleteTripClick(data);
	}

	function showDirectionClick(e)
	{
		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var data = self.treeview.dataItem(e.target.closest('li'));
		this.eventsManager.showDirectionClick(data);
	}

	function refreshPathClick(e)
	{
		e.preventDefault();
		e.stopPropagation();
		console.log("Tripfinder Next TODO: refreshPathClick");
		return;

		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var data = self.treeview.dataItem(e.target.closest('li'));
		this.eventsManager.refreshPathClick(data);
	}

	function zoomClick(e)
	{
		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var data = self.treeview.dataItem(e.target.closest('li'));
		var type = '';
		if (data.level() == 0)
		{
			data = this.dataModel.getTripById(data.id);
			type = 'fieldtrip';
		}
		else if (data.level() == 1)
		{
			type = 'tripStop';
		}
		else if (data.level() == 2)
		{
			let message = "";
			if (data.customData.geometry.x === 0)
			{
				message = "Cannot zoom to ungeocoded student.";
			} else if (!data.customData.requirementId)
			{
				message = "Cannot zoom to a student exception record.";
			}

			if (message !== "")
			{
				return tf.promiseBootbox.alert({
					message: message,
					title: "Warning"
				});
			}

			type = 'student';
		}
		this.eventsManager.zoomClick(data, type);
		$(e.target.closest('li')).attr('suspend', 'true');
	}

	function minusClick(e)
	{
		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var data = self.treeview.dataItem(e.target.closest('li'));
		var student = [self.dataModel.getStudent(data.id, data.customData.tripStopId, data.customData.anotherTripStopID, data.customData.requirementId, data.customData.previousScheduleID)];
		var tripStop = self.dataModel.getTripStopByStopId(data.customData.tripStopId);
		self.dataModel.unAssignStudent(student, tripStop, true);
		self.dataModel.changeDataStack.push(tripStop);
	}

	function addClick(e)
	{
		var self = this;
		e.preventDefault();
		e.stopPropagation();
		let data = self.treeview.dataItem(e.target.closest('li')), student;
		if (data.customData.requirementId)
		{
			student = self.dataModel.getCanAssignCandidateStudentById(data.id, data.customData.requirementId, data.customData.previousScheduleID);
		}
		else
		{
			let stopStudents = self.dataModel.tripStopDictionary[data.customData.tripStopId] || [],
				exception = stopStudents.find(s => s.student.id === data.id);
			if (exception)
			{
				student = self.dataModel.getCanAssignCandidateStudentById(data.id, null, data.customData.previousScheduleID, exception.student);
			}
		}
		if (isNullObj(student))
		{
			return;
		}

		var studentArray = [student];
		var tripStop = self.dataModel.getTripStopByStopId(data.parent().parent().id), schoolAssigned;
		if (tripStop.SchoolCode && ((student.TransSchoolCode != null && tripStop.SchoolCode != student.TransSchoolCode) || !student.TransSchoolCode))
		{
			schoolAssigned = tripStop;
			tripStop = self.dataModel.getTripStopByStopId(data.customData.tripStopId);
		}

		var tripStopNode = self.treeview.dataSource.getFirst(tripStop.id, function(_data)
		{
			return _data.customData && _data.customData.isStop;
		});
		var studentNode = self.routingDisplayHelper.getTreeNodeFromParentNode(data.id, tripStopNode, 'student', data.customData.requirementId, tripStop.id, data.customData.previousScheduleID);
		if (studentNode && self.routingDisplayHelper.filterArray(studentNode.customData.dayCheckList, true).length == 0)
		{
			return tf.promiseBootbox.alert('Please select a day to assign.');
		}
		self.dataModel.assignStudent(studentArray, tripStop, null, null, null, null, true, schoolAssigned).then(function(result)
		{
			self.dataModel.changeDataStack.push(tripStop);
			if (result && result.prohibitStudents && result.prohibitStudents.length > 0)
			{
				return tf.promiseBootbox.alert(result.prohibitStudents.map(s => { return `${s.FirstName} ${s.LastName}` }).join(', ') + ` ${result.prohibitStudents.length == 1 ? 'is' : 'are'} not allowed to cross the road.`, 'Message');
			}
		});

	}

	function studentStatusClick(e)
	{
		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var currentElement = e.target;
		if (currentElement.classList.contains("checked") || currentElement.classList.contains("cannot-checked"))
		{
			return;
		}

		var currentIndex = 0;
		for (var i = 0; i < 2; i++)
		{
			if (currentElement == $(currentElement.closest('li')).find('.student-PUDOStatus .status')[i])
			{
				currentIndex = i; break;
			}
		}
		$($(currentElement.closest('li')).find('.student-PUDOStatus .status')[currentIndex]).addClass("checked");
		$($(currentElement.closest('li')).find('.student-PUDOStatus .status')[1 - currentIndex]).removeClass("checked");
		var data = self.treeview.dataItem(currentElement.closest('li'));
		var studentId = data.id, requirementId = data.customData.requirementId, previousScheduleID = data.customData.previousScheduleID;
		var currentTripStop = self.dataModel.getTripStopByStopId(data.parent().parent().id);
		var student = self.dataModel.getStudent(studentId, currentTripStop.id, data.customData.anotherTripStopID, requirementId, previousScheduleID);
		var isSchool = currentTripStop.SchoolCode ? true : false;
		if (isNullObj(student) && isSchool)
		{
			currentTripStop = self.dataModel.getTripStopByStopId(data.customData.tripStopId);
			student = self.getStudentFromSchoolNode(data.customData.tripStopId, data.customData.anotherTripStopID, studentId, requirementId, previousScheduleID);
		}
		return self.dataModel.updateStudentPUDOStatus(student, 1 - student.Session, currentTripStop.TripId).then(function()
		{
			self.dataModel.setAssignedStudentValidProperty(currentTripStop);
			self.refreshAffectStopByStudentId(student.id);
			self.dataModel.changeDataStack.push(currentTripStop);
		});
	}

	function studentDayClick(e)
	{
		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var currentElement = e.target;
		var dayIndex = $(currentElement).parent().children().index(currentElement);
		var destinationDayValue = !currentElement.classList.contains("checked");
		var canExecuteClick = !currentElement.classList.contains("disabled") && !currentElement.classList.contains("cannot-checked");
		if (!canExecuteClick)
		{
			return;
		}
		var data = self.treeview.dataItem(currentElement.closest('li'));

		var studentId = data.id, requirementId = data.customData.requirementId, previousScheduleID = data.customData.previousScheduleID;
		var currentTripStop = self.dataModel.getTripStopByStopId(data.parent().parent().id);
		var tripNode = self.routingDisplayHelper.getExpandedTreeNode(currentTripStop.TripId, 'trip', self.treeview.dataSource);
		var trip = self.dataModel.getTripById(currentTripStop.TripId);

		if (!data.customData.isAssigned)
		{
			var tripStopNode = self.routingDisplayHelper.getTreeNodeFromParentNode(currentTripStop.id, tripNode, 'tripstop');
			var studentNode = self.routingDisplayHelper.getTreeNodeFromParentNode(studentId, tripStopNode, 'student', requirementId, data.customData.tripStopId, previousScheduleID);

			var student = self.dataModel.getStudent(studentId, currentTripStop.id, studentNode.customData.anotherTripStopID, requirementId, previousScheduleID);
			if (isNullObj(student) && currentTripStop.SchoolCode)
			{
				currentTripStop = self.dataModel.getTripStopByStopId(studentNode.customData.tripStopId);
				student = self.getStudentFromSchoolNode(studentNode.customData.tripStopId, studentNode.customData.anotherTripStopID, studentId, requirementId, previousScheduleID);
				tripStopNode = self.routingDisplayHelper.getTreeNodeFromParentNode(currentTripStop.id, tripNode, 'tripstop');
				studentNode = self.routingDisplayHelper.getTreeNodeFromParentNode(studentId, tripStopNode, 'student', requirementId, data.customData.tripStopId, previousScheduleID);
			}
			self.dataModel.changeAssignedStudentDay(studentId, requirementId, previousScheduleID, destinationDayValue, dayIndex, currentTripStop, studentNode.customData.anotherTripStopID, true);
			self.updateStudentDay(tripStopNode, studentNode, student, dayIndex, destinationDayValue);
			self.refreshAllStopNode(trip, true);
			return;
		}

		var lockInfo = {
			RequirementId: requirementId,
			PreviousScheduleID: previousScheduleID,
			StudId: studentId,
			TripId: trip.id,
			TripStopId: data.customData.tripStopId
		};

		var studentAssigned = currentTripStop.Students.find(function(c) { return c.RequirementID == requirementId && c.id == studentId });
		if (studentAssigned)
		{
			lockInfo.EndDate = studentAssigned.EndDate;
			lockInfo.StartDate = studentAssigned.StartDate;
		}

		for (var i = 0; i < 7; i++)
		{
			lockInfo[self.dataModel.getWeekdayAttributeNameByIndex(i)] = i == dayIndex ? destinationDayValue : data.customData.dayCheckList[i];
		}

		self.dataModel.lockRoutingStudent([lockInfo], null, null, true).then(function()
		{
			if (currentTripStop.SchoolCode)
			{
				var tripStopNode = self.routingDisplayHelper.getTreeNodeFromParentNode(currentTripStop.id, tripNode, 'tripstop');
				var studentNode = self.routingDisplayHelper.getTreeNodeFromParentNode(studentId, tripStopNode, 'student', requirementId, data.customData.tripStopId, previousScheduleID);
				currentTripStop = self.dataModel.getTripStopByStopId(studentNode.customData.tripStopId);
			}

			self.dataModel.changeAssignedStudentDay(studentId, requirementId, previousScheduleID, destinationDayValue, dayIndex, currentTripStop, data.customData.anotherTripStopID);
			self.refreshAffectStopByStudentId(studentId, requirementId ? null : currentTripStop);
			self.dataModel.changeDataStack.push(currentTripStop);
		});
	}

	RoutingDisplay.prototype.updatePUDOStatus = function(tripStopNode, studentNode, student)
	{
		var self = this;
		if (tripStopNode && self.routingDisplayHelper.checkNodeWasExpanded(tripStopNode))
		{
			self.updateStudentNode(studentNode);
		}
		else
		{
			self.dataModel.setStudentDayValue(dayIndex, destinationDayValue, student);
			self.routingDisplayHelper.resetUnexpandedTreeNodeValue(studentNode, student);
			studentNode.customData.prohibitCross = studentNode.customData.prohibitCross || tripStopNode.customData.prohibitCrosser;
		}
	}

	RoutingDisplay.prototype.updateStudentDay = function(tripStopNode, studentNode, student, dayIndex, destinationDayValue)
	{
		var self = this;
		if (tripStopNode && self.routingDisplayHelper.checkNodeWasExpanded(tripStopNode))
		{
			self.updateStudentNode(studentNode);
		}
		else
		{
			self.dataModel.setStudentDayValue(dayIndex, destinationDayValue, student);
			self.routingDisplayHelper.resetUnexpandedTreeNodeValue(studentNode, student);
			studentNode.customData.prohibitCross = studentNode.customData.prohibitCross || tripStopNode.customData.prohibitCrosser;
		}
	}

	RoutingDisplay.prototype.getStudentFromSchoolNode = function(relatedTripStopId, anotherTripStopID, studentId, requirementId, previousScheduleID)
	{
		var self = this;
		return self.dataModel.getStudent(studentId, relatedTripStopId, anotherTripStopID, requirementId, previousScheduleID);
	}

	RoutingDisplay.prototype.updateStudentNode = function(studentNode)
	{
		var self = this;
		var studentElement = self.treeview.findByUid(studentNode.uid);
		self.setStudentNodeProperty(studentNode, studentElement);
	}

	RoutingDisplay.prototype.isStudentExist = function(tripStop, student)
	{
		for (var i = 0; i < tripStop.Students.length; i++)
		{
			if (tripStop.Students[i].id == student.id)
			{
				return true;
			}
		}
		return false;
	}

	RoutingDisplay.prototype.onStudentChange = function(e, student)
	{
		var self = this;
		var key = self.dataModel.routingStudentManager._getKey(student);
		if (isNullObj(self.dataModel.studentsDictionary[key]))
		{
			return;
		}
		self.dataModel.studentsDictionary[key].map(function(item)
		{
			var tripStopData = self.dataModel.getTripStopByStopId(item.id);
			var tripNode = self.routingDisplayHelper.getExpandedTreeNode(tripStopData.TripId, 'trip', self.treeview.dataSource);
			var tripStopNode = self.routingDisplayHelper.getTreeNodeFromParentNode(item.id, tripNode, 'tripstop');
			var studentNode = self.routingDisplayHelper.getTreeNodeFromParentNode(student.id, tripStopNode, 'student', student.RequirementID, item.id, student.PreviousScheduleID);
			if (self.routingDisplayHelper.checkNodeWasExpanded(tripStopNode))
			{
				var studentNodeElement = self.treeview.findByUid(studentNode.uid);
				self.setStudentNodeProperty(studentNode, studentNodeElement);
			}
			else
			{
				var studentData;
				if (student.IsAssigned)
				{
					studentData = self.dataModel.getStudent(student.id, tripStopData.id, studentNode.customData.anotherTripStopID, student.RequirementID, student.PreviousScheduleID);
				}
				else
				{
					studentData = self.dataModel.getCandidateStudentById(student.id);
				}
				if (studentData != undefined)
				{
					self.routingDisplayHelper.resetUnexpandedTreeNodeValue(studentNode, studentData);
					studentNode.customData.prohibitCross = studentNode.customData.prohibitCross || tripStopNode.customData.prohibitCrosser;
				}
			}
		});
	}

	RoutingDisplay.prototype.onTripStopsChange = function(e, data)
	{
		var self = this;
		if ((data && data.add.length == 0 && data.edit.length == 0 && data.delete.length == 0)
			|| (data.options && data.options.notNotifyTreeAndMap))
		{
			return;
		}
		if (data.add.length > 0)
		{
			data.add.map(function(tripStop)
			{
				self._addTripStop(tripStop);
			}.bind(self));
		}
		if (data.edit.length > 0)
		{
			data.edit.map(function(tripStop)
			{
				self._editTripStop(tripStop);
			}.bind(self));
		}
		if (data.delete.length > 0)
		{
			data.delete.map(function(tripStop)
			{
				self._deleteTripStop(tripStop);
			}.bind(self));
		}

		self.setFootInfo();

		var dataAll = data.add.concat(data.edit, data.delete);
		var changeTripIds = {};
		dataAll.map(function(d)
		{
			if (!changeTripIds[d.TripId])
			{
				changeTripIds[d.TripId] = true;
			}
		});
		for (var changeTripId in changeTripIds)
		{
			var trip = Enumerable.From(self.dataModel.trips).FirstOrDefault(null, function(c) { return c.id == changeTripId || c.TripID == changeTripId });
			self.resetTripInfo([trip], null, null, data.options ? data.options.resetScheduleTime : null);
			self.refreshAllStopNode(trip);
		}
	}

	RoutingDisplay.prototype._addTripStop = function(tripStop)
	{
		var self = this;
		var total = tripStop.Students.length;
		var studentData = [];
		var trip = Enumerable.From(self.dataModel.trips).FirstOrDefault(null, function(c) { return c.id == tripStop.TripId; });

		var tripStopTreeViewNode = self.newTripStop(tripStop, self.routingDisplayHelper.getTripType(), trip.Name);

		var tripNode = self.routingDisplayHelper.getExpandedTreeNode(tripStop.TripId, 'trip', self.treeview.dataSource);
		var tripWasExpanded = self.routingDisplayHelper.checkNodeWasExpanded(tripNode);
		var insertPositionElement;
		var insertPositionSequence;
		var tripStopNodesTemp;
		if (tripWasExpanded)
		{
			tripStopNodesTemp = tripNode.children._data;
		}
		else
		{
			tripStopNodesTemp = tripNode.children.options.data.items;
		}
		tripStopNodesTemp.forEach(function(oldTripStop, index)
		{
			var sequence = index + 1;
			if (sequence >= tripStop.Sequence)
			{
				if (sequence == tripStop.Sequence)
				{
					insertPositionSequence = sequence;
				}

				if (tripWasExpanded)
				{
					var oldTripStopElement = self.treeview.findByUid(oldTripStop.uid);
					if (sequence == tripStop.Sequence)
					{
						insertPositionElement = oldTripStopElement;
					}
				}
			}
		});
		if (insertPositionSequence)
		{
			if (tripWasExpanded)
			{
				self.treeview.insertBefore(tripStopTreeViewNode, insertPositionElement);
			}
			else
			{
				tripNode.children.options.data.items.splice(insertPositionSequence - 1, 0, tripStopTreeViewNode);
			}
		}
		else
		{
			if (tripWasExpanded)
			{
				if (tripNode.children._data.length > 0)
				{
					var lastItem = self.treeview.findByUid(tripNode.children._data[tripNode.children._data.length - 1].uid);
					self.treeview.insertAfter(tripStopTreeViewNode, lastItem);
				}
				else
				{
					//trip does not contain stop
					var changedTrip = self.treeview.findByUid(tripNode.uid);
					self.treeview.append(tripStopTreeViewNode, changedTrip, null, !!self.expandStatusDictionary['Stop' + tripStopTreeViewNode.id]);
				}
			}
			else
			{
				tripNode.children.options.data.items.push(tripStopTreeViewNode);
			}
		}
		// after create stop continue to add stop from map
		if (self.viewModel._viewModal.mode === "Routing-Create")
		{
			self.viewModel.drawTool.create("point");
		}
	};

	RoutingDisplay.prototype._editTripStop = function(tripStop)
	{
		if (tripStop.SchoolCode)
		{
			return;
		}

		var self = this;
		var studentData = [];
		var total = 0;
		var tripNode = self.routingDisplayHelper.getExpandedTreeNode(tripStop.TripId, 'trip', self.treeview.dataSource);
		if (!tripNode) return;
		var tripWasExpanded = self.routingDisplayHelper.checkNodeWasExpanded(tripNode);
		var tripStopNode = self.routingDisplayHelper.getTreeNodeFromParentNode(tripStop.id, tripNode, 'tripstop');

		self.removeUnassignedStudentElementFromStop(tripStopNode);
		if (tripStopNode)
		{
			if (self.dataModel.tripStopDictionary[tripStop.id])
			{
				self.dataModel.tripStopDictionary[tripStop.id].map(function(studentEntity)
				{
					var alreadyContain = false;
					for (var i = 0; i < tripStop.Students.length; i++)
					{
						if (tripStop.Students[i].id == studentEntity.student.id && tripStop.Students[i].RequirementID == studentEntity.student.RequirementID && tripStop.Students[i].PreviousScheduleID == studentEntity.student.PreviousScheduleID)
						{
							alreadyContain = true;
							break;
						}
					}
					if (!alreadyContain && studentEntity.canBeAssigned)
					{
						self.setTripStopStudentStatus(studentEntity.student, tripStop);
						studentData.push(self.newStudent(studentEntity.student, tripStop, tripStop.ProhibitCrosser));

						total++;
					}
				});
			}
		}
		if (studentData.length > 0)
		{
			if (tripWasExpanded && self.routingDisplayHelper.checkNodeWasExpanded(tripStopNode))
			{
				studentData.map(function(student)
				{
					self.routingDisplayHelper.insertStudentsByAlphaOrder(student, tripStopNode);
				});
			}
			else
			{
				self.routingDisplayHelper.addNodeDataOnDemand(studentData, tripStopNode);
			}
		}
		var totalStudentCount = tripStopNode.customData.assignedStudentCount + total;
		if (tripWasExpanded)
		{
			var changedTripStop = self.treeview.findByUid(tripStopNode.uid);
			changedTripStop.TotalStudentCount = totalStudentCount;
			self.setTripStopNodeProperty(tripStopNode, changedTripStop);
		}
		else
		{
			tripStopNode.customData.totalStudentCount = totalStudentCount;
			tripStop.TotalStudentCount = totalStudentCount;
			self.routingDisplayHelper.resetUnexpandedTreeNodeValue(tripStopNode, tripStop);
		}
	}

	RoutingDisplay.prototype._deleteTripStop = function(tripStop)
	{
		var self = this;
		var trip = Enumerable.From(self.dataModel.trips).FirstOrDefault(null, function(c) { return c.id == tripStop.TripId });
		var tripNode = self.routingDisplayHelper.getExpandedTreeNode(tripStop.TripId, 'trip', self.treeview.dataSource);
		var tripWasExpanded = self.routingDisplayHelper.checkNodeWasExpanded(tripNode);
		var newLockStopId;
		if (tripStop.LockStopTime && trip.TripStops.length > 0)
		{
			if (trip.TripStops[0].id != tripStop.id)
			{
				self.dataModel.setLockTime(trip.TripStops[0].id, trip.id);
				newLockStopId = trip.TripStops[0].id;
			}
		}

		var tripStopsTemp = [];
		if (tripWasExpanded && tripNode.children._data.length > 0)
		{
			tripStopsTemp = tripNode.children._data;
		}
		else
		{
			tripStopsTemp = tripNode.children.options.data.items;
		}

		var deleteElement;
		var deleteNodeSequence = tripStop.Sequence;
		tripStopsTemp.map(function(oldTripStop)
		{
			var oldTripStopElement;
			if (tripWasExpanded)
			{
				oldTripStopElement = self.treeview.findByUid(oldTripStop.uid);
				if (newLockStopId && oldTripStop.id == newLockStopId)
				{
					self.setTripStopNodeProperty(oldTripStop, oldTripStopElement, true);
				}
			}
			if (oldTripStop.id == tripStop.id)
			{
				if (tripWasExpanded)
				{
					deleteNodeSequence = oldTripStop.customData.sequence;
					deleteElement = oldTripStopElement;
				}
			}
			if (oldTripStop.customData.sequence > deleteNodeSequence)
			{
				if (!tripWasExpanded)
				{
					oldTripStop.customData.sequence--;
				}
			}

		});

		if (tripWasExpanded)
		{
			self.treeview.remove(deleteElement);
		}
		else
		{
			var indexes = $.map(tripNode.children.options.data.items, function(obj, index) { if (obj.id == tripStop.id) { return index } });
			if (indexes && indexes.length > 0)
			{
				tripNode.children.options.data.items.splice(indexes[0], 1);
			}

			var indexes = $.map(tripNode.items, function(obj, index) { if (obj.id == tripStop.id) { return index } });
			if (indexes && indexes.length > 0)
			{
				tripNode.items.splice(indexes[0], 1);
			}
		}
	}

	RoutingDisplay.prototype.refreshAllTripsSchoolStop = function()
	{
		var self = this;
		var trips = self.dataModel.getEditTrips();
		trips.map(function(tripTemp)
		{
			self.refreshAllStopNode(tripTemp, true);
		});
	}

	RoutingDisplay.prototype.refreshAllStopNode = function(trip, onlyAffectSchool)
	{
		var self = this;
		trip.TripStops.map(function(tripStop)
		{
			// if (!IsEmptyString(tripStop.SchoolCode))
			// {
			// 	self.routingDisplayHelper.recalculateSchoolStudentCount(tripStop);
			// }
			if (!onlyAffectSchool || (onlyAffectSchool && !IsEmptyString(tripStop.SchoolCode)))
			{
				self.refreshStopNode(tripStop, trip);
			}
		});
	}

	RoutingDisplay.prototype.refreshStopNode = function(tripStop, trip)
	{
		function getTypeStudents(students, nodes)
		{
			var newStudents = [];
			var updateStudents = [];
			var deleteStudents = [];
			nodes.map(function(node)
			{
				for (var i = 0; i < students.length; i++)
				{
					if (node.id == students[i].id
						&& node.customData.previousScheduleID == students[i].PreviousScheduleID
						&& node.customData.requirementId == students[i].RequirementID
						&& node.customData.isAssigned == students[i].IsAssigned
						&& node.customData.tripStopId == students[i].TripStopID
						&& node.customData.anotherTripStopID == students[i].AnotherTripStopID)
					{
						updateStudents.push(node);
						return;
					}
				}
				deleteStudents.push(node);
			});

			for (var i = 0; i < students.length; i++)
			{
				if (Enumerable.From(updateStudents).FirstOrDefault(null, function(s)
				{
					return s.id == students[i].id
						&& s.customData.previousScheduleID == students[i].PreviousScheduleID
						&& s.customData.requirementId == students[i].RequirementID
						&& s.customData.tripStopId == students[i].TripStopID
						&& s.customData.anotherTripStopID == students[i].AnotherTripStopID;
				}) === null)
				{
					newStudents.push(students[i]);
				}
			}
			return { new: newStudents, update: updateStudents, delete: deleteStudents };
		}

		var self = this, students = self.getVisibleStudent(tripStop), nodes = [];
		var currentMissionId = TF.generateUUID();
		self.updateMissionDictionary[tripStop.id] = currentMissionId;
		var tripNode = self.routingDisplayHelper.getExpandedTreeNode(tripStop.TripId, 'trip', self.treeview.dataSource);
		var tripWasExpanded = self.routingDisplayHelper.checkNodeWasExpanded(tripNode);
		var tripStopNode = self.routingDisplayHelper.getTreeNodeFromParentNode(tripStop.id, tripNode, 'tripstop');
		if (!tripStopNode)
		{
			return;
		}
		var nodeElement = self.treeview.findByUid(tripStopNode.uid);
		removeSchoolLocation(nodeElement);
		if (self.routingDisplayHelper.checkNodeWasExpanded(tripStopNode) && tripStopNode.children && tripStopNode.children.options)
		{
			nodes = tripStopNode.children._data;
		}
		else
		{
			nodes = tripStopNode.items.length > 0 ? tripStopNode.items : ((tripStopNode.children && tripStopNode.children.options) ? tripStopNode.children.options.data.items : tripStopNode.items);
		}

		var data = getTypeStudents(students, nodes);
		var pList = [];
		data['new'].map(function(student)
		{
			self.setTripStopStudentStatus(student, tripStop);
			var newStudent = self.newStudent(student, tripStop, tripStop.ProhibitCrosser);
			pList.push(self.routingDisplayHelper.addTreeNode(newStudent, tripStopNode, 'student', currentMissionId));
		});

		data['update'].map(function(studentNode)
		{
			var student = self.dataModel.getStudent(studentNode.id, studentNode.customData.tripStopId, studentNode.customData.anotherTripStopID, studentNode.customData.requirementId, studentNode.customData.previousScheduleID);
			if (self.routingDisplayHelper.checkNodeWasExpanded(tripStopNode))
			{
				let promise = Promise.resolve(true);
				if (student.CrossToStop === null)
				{
					promise = self.handleUnknowCrossingStatusStudents([studentNode]);
				}
				promise.then(() =>
				{
					self.setStudentNodeProperty(studentNode, self.treeview.findByUid(studentNode.uid));
				});
			}
			else
			{
				var stuTemp = $.extend(true, {}, student);
				if (trip.Session == self.routingDisplayHelper.tripType.MidDay && tripStop.SchoolCode != student.TransSchoolCode)
				{
					stuTemp.Session = 1 - stuTemp.Session;
				}
				self.routingDisplayHelper.resetUnexpandedTreeNodeValue(studentNode, stuTemp);
				studentNode.customData.prohibitCross = studentNode.customData.prohibitCross || tripStopNode.customData.prohibitCrosser;
			}
		});

		data['delete'].map(function(studentNode)
		{
			self.routingDisplayHelper.removeTreeNode(studentNode, tripStopNode);
		});

		Promise.all(pList).then(function()
		{
			if (currentMissionId != self.updateMissionDictionary[tripStop.id])
			{
				return;
			}

			if (!tripWasExpanded)
			{
				self.routingDisplayHelper.resetUnexpandedTreeNodeValue(tripStopNode, tripStop);
			}
			else
			{
				self.setTripStopNodeProperty(tripStopNode, self.treeview.findByUid(tripStopNode.uid));
			}
		});
	}

	function removeSchoolLocation(nodeElement)
	{
		var input = nodeElement.find("input");
		if (input.length > 0 && input.data("typeahead"))
		{
			input.typeahead("destroy");
		}
	}

	RoutingDisplay.prototype.getVisibleStudent = function(tripStop)
	{
		var students = [], self = this;
		if (self.dataModel.tripStopDictionary[tripStop.id])
		{
			students = students.concat(self.dataModel.tripStopDictionary[tripStop.id].filter(function(ts)
			{
				return ts.canBeAssigned || ts.student.IsAssigned;
			}).map(function(ts)
			{
				return ts.student;
			}));
		}
		if (self.dataModel.routingStudentManager.schoolStopDictionary[tripStop.id])
		{
			students = students.concat(self.dataModel.routingStudentManager.schoolStopDictionary[tripStop.id].filter(function(ts)
			{
				return ts.canBeAssigned || ts.student.IsAssigned;
			}).map(function(ts)
			{
				return ts.student;
			}));
		}

		return students;
	}

	RoutingDisplay.prototype.onStudentCrossStreetStopChangeEvent = function(e, data)
	{
		this.resetStudentCrossStatus(data);
	}

	RoutingDisplay.prototype.resetStudentCrossStatus = function(changeTripStopList)
	{
		var self = this;
		var trips = {};
		changeTripStopList.map(function(tripStop)
		{
			var tripNode = self.routingDisplayHelper.getExpandedTreeNode(tripStop.TripId, 'trip', self.treeview.dataSource);
			var tripStopData = self.routingDisplayHelper.getTreeNodeFromParentNode(tripStop.id, tripNode, 'tripstop');
			var allStudents = self.dataModel.tripStopDictionary.hasOwnProperty(tripStop.id) ? self.dataModel.tripStopDictionary[tripStop.id] : [];
			if (isNullObj(trips[tripStop.TripId]))
			{
				trips[tripStop.TripId] = self.dataModel.getTripById(tripStop.TripId);
			}
			allStudents.map(function(studentEntity)
			{
				var studentNode = self.routingDisplayHelper.getTreeNodeFromParentNode(studentEntity.student.id, tripStopData, 'student', studentEntity.student.RequirementID, tripStop.id, studentEntity.student.PreviousScheduleID);
				if (studentNode && self.routingDisplayHelper.checkNodeWasExpanded(tripStopData))
				{
					var studentNodeElement = self.treeview.findByUid(studentNode.uid);
					self.setStudentNodeProperty(studentNode, studentNodeElement, studentEntity.student.CrossToStop);
				}
				else if (studentNode)
				{
					studentNode.customData.crossToStop = studentEntity.student.CrossToStop;
				}
				if (!studentEntity.canBeAssigned)
				{
					tripStop.Students.map(function(student)
					{
						if (student.id == studentEntity.student.id)
						{
							return student.CrossToStop = studentEntity.student.CrossToStop;
						}
					});
				}
			});
		});
		for (var key in trips)
		{
			self.refreshAllStopNode(trips[key], true);
		}
	};

	RoutingDisplay.prototype.removeUnassignedStudentElementFromStop = function(tripStopData)
	{
		var self = this, students;
		function getStudents(tripStopData)
		{
			return tripStopData.items.length > 0 ? tripStopData.items : ((tripStopData.children && tripStopData.children.options) ? tripStopData.children.options.data.items : [])
		}

		students = getStudents(tripStopData);
		for (var i = students.length - 1; i > -1; i--)
		{
			if (!students[i].customData.isAssigned)
			{
				self.routingDisplayHelper.removeTreeNode(students[i], tripStopData);
			}
		}
	}

	RoutingDisplay.prototype.IsConfusedStudent = function(studentId, requirementID, previousScheduleID, tripStopId)
	{
		var self = this;
		var tripStopEntities = self.dataModel.studentsDictionary[studentId + "_" + requirementID + "_" + previousScheduleID];
		if (tripStopEntities)
		{
			var tripStopEntity = Enumerable.From(tripStopEntities).FirstOrDefault(null, function(ts) { return ts.id == tripStopId; });
			if (tripStopEntity)
			{
				if (tripStopEntity.schoolStopId && tripStopEntity.schoolStopId.length > 1)
				{
					return true;
				}
			}
		}
		return false;
	}

	RoutingDisplay.prototype.changeSchoolStop = function(student, oldSchoolStop, newSchoolStop, changeDestinationStop, refresh)
	{
		var self = this;
		if (changeDestinationStop)
		{
			student.AnotherTripStopID = newSchoolStop.id;
			if (refresh)
			{
				self.refreshAllTripsSchoolStop();
			}
		}
		else
		{
			student.TripStopID = newSchoolStop.id;
			var studentCopy = $.extend({}, student);
			self.dataModel.unAssignStudent([student], oldSchoolStop);
			var studentsInDictionary = self.dataModel.tripStopDictionary[newSchoolStop.id];
			var studInDict = Enumerable.From(studentsInDictionary).FirstOrDefault(null, function(c)
			{
				return c.student.id == student.id && c.student.RequirementID == student.RequirementID && c.student.PreviousScheduleID == student.PreviousScheduleID;
			});
			if (studInDict)
			{
				var weekdays = TF.RoutingMap.RoutingPalette.RoutingDataModel.weekdays;
				var studentMap = self.dataModel.routingStudentManager.students[self.dataModel.routingStudentManager._getKey(student)];
				studentMap.availableWeekdays.forEach(function(weekday, index)
				{
					studInDict.student[weekdays[index]] = studentCopy[weekdays[index]];
					studInDict.student["Valid" + weekdays[index]] = studentCopy["Valid" + weekdays[index]];
				});
			}
			self.dataModel.assignStudent([student], newSchoolStop, null, null, null, null, true);
		}
	};

	RoutingDisplay.prototype.onAssignStudentsChange = function(e, data)
	{
		var self = this, affectedStudentIds = [];
		var tripStop = data.tripStop;
		self.setFootInfo();
		var trip = Enumerable.From(self.dataModel.trips).FirstOrDefault(null, function(c) { return c.id == tripStop.TripId; });
		data.isRecalculate != false && self.resetTripInfo([trip]);
		var affectedStudents = affectedStudentIds.concat(data.add, data.delete);
		affectedStudents.map(function(student)
		{
			self.refreshAffectStopByStudentId(student.id, student.RequirementID ? null : tripStop);
		});
	}

	RoutingDisplay.prototype.setTripStopStudentStatus = function(student, tripStop)
	{
		var self = this;
		self.routingDisplayHelper.setStudentStatus(student, tripStop);
	};

	RoutingDisplay.prototype.setStudentNodeProperty = function(nodeData, nodeElement, crossStatus)
	{
		var self = this, inNotTransferSchool = false;
		if (self.routingDisplayHelper.getTripType() == self.routingDisplayHelper.tripType.MidDay && nodeElement.parent().parent().find('.school-row').length > 0)
		{
			var stopNode = self.treeview.dataItem(nodeElement.parent().parent());
			inNotTransferSchool = (nodeData.customData.transSchoolCode === undefined || nodeData.customData.transSchoolCode === null) || (stopNode.customData.schoolCode.toLowerCase() != nodeData.customData.transSchoolCode.toLowerCase());
		}

		if (nodeData.customData.isStudent)
		{
			var tripStop = self.dataModel.getTripStopByStopId(nodeData.customData.tripStopId);
			if (isNullObj(tripStop))
			{
				return;
			}
			var stopId = tripStop.id;
			//schoolstop may contains multiple same students
			if (!IsEmptyString(tripStop.SchoolCode))
			{
				stopId = nodeData.customData.tripStopId;
			}

			var student = self.dataModel.getStudent(nodeData.id, stopId, nodeData.customData.anotherTripStopID, nodeData.customData.requirementId, nodeData.customData.previousScheduleID);
			if (crossStatus != null && crossStatus != undefined)
			{
				nodeData.set('customData.crossToStop', crossStatus);
			}
			if (student && student.TotalTime)
			{
				nodeData.set('customData.totalTime', student.TotalTime);
			}
			if (student && student.IsValid != undefined)
			{
				nodeData.set('customData.isValid', student.IsAssigned ? !!student.IsValid : true);
			}
			if (student)
			{
				var parentStopData = nodeData.parent().parent();
				var isConfused = self.IsConfusedStudent(student.id, student.RequirementID, student.PreviousScheduleID, parentStopData.id);
				nodeData.set('customData.isConfused', isConfused);
			}
			if (student)
			{
				nodeData.set('customData.walkToStopDistance', student.IsAssigned ? parseFloat(self.convertToCurrentMeasurementUnit(student.WalkToStopDistance)).toFixed(2) : "--");
				nodeData.set('customData.walkToStopDistanceWarning', student.WalkToStopDistanceWarning);
				nodeData.set('customData.prohibitCross', student.ProhibitCross == true || tripStop.ProhibitCrosser == true);
			}
			if (student)
			{
				self.routingDisplayHelper.updateStudentDayStatus(nodeData, student);
				if (self.routingDisplayHelper.getTripType() == self.routingDisplayHelper.tripType.MidDay)
				{
					self.routingDisplayHelper.updateStudentPUDOStatus(nodeData, student, inNotTransferSchool, tripStop);
				}
			}

			var color = self.dataModel.getColorByTripId(nodeData.parent().parent().parent().parent().id);
			self.routingDisplayHelper.setSequenceLineColor(color, nodeElement, 'student');
			if (nodeData.customData.isAssigned)
			{
				nodeElement.find(".icon.minus").off('click').on('click', minusClick.bind(self));
			}
			else
			{
				nodeElement.find(".icon.add").off('click').on('click', addClick.bind(self));
			}
			nodeElement.find(".icon.zoom-map-to-layers").off('click').on('click', zoomClick.bind(self));
			nodeElement.find(".student-requirement .day").off('click').on('click', studentDayClick.bind(self));

			if (self.routingDisplayHelper.getTripType() == self.routingDisplayHelper.tripType.MidDay)
			{
				nodeElement.find(".student-PUDOStatus .status").off('click').on('click', studentStatusClick.bind(self));
			}
		}
	}

	RoutingDisplay.prototype.setTripStopNodeProperty = function(nodeData, nodeElement, onlyAffectCurrentNode)
	{
		var self = this;
		if (nodeData.customData.isStop)
		{
			var tripStopData = self.dataModel.getTripStop(nodeData.id, nodeData.customData.tripId);
			if (isNullObj(tripStopData))
			{
				return;
			}

			var trip = self.dataModel.getTripById(nodeData.customData.tripId),
				isLast = self.isLastStop(trip, tripStopData);
			if (tripStopData && tripStopData.TotalStudentCount != null)
			{
				nodeData.set('customData.totalStudentCount', tripStopData.TotalStudentCount);
			}

			if (tripStopData && tripStopData.AssignedStudentCount != null)
			{
				nodeData.set('customData.assignedStudentCount', tripStopData.AssignedStudentCount);
			}

			nodeData.set('customData.isLast', isLast);
			if (tripStopData && tripStopData.Sequence)
			{
				nodeData.set('customData.sequence', tripStopData.Sequence);
			}
			if (tripStopData && tripStopData.geometry)
			{
				nodeData.set('customData.geometry', tripStopData.geometry);
			}
			if (tripStopData && tripStopData.Street)
			{
				nodeData.set('text', tripStopData.Street);
			}
			if (tripStopData && tripStopData.id)
			{
				nodeData.set('id', tripStopData.id);
			}
			if (tripStopData && tripStopData.SchoolCode && tripStopData.ToSchoolStudents)
			{
				nodeData.set('customData.toSchoolStudents', tripStopData.ToSchoolStudents);
			}
			if (tripStopData && tripStopData.SchoolCode && tripStopData.ToTransStudents)
			{
				nodeData.set('customData.toTransStudents', tripStopData.ToTransStudents);
			}
			if (tripStopData && tripStopData.SchoolCode && tripStopData.TransToTrans)
			{
				nodeData.set('customData.transToTrans', tripStopData.TransToTrans);
			}
			if (tripStopData && tripStopData.SchoolCode && tripStopData.PUTransToSchool)
			{
				nodeData.set('customData.puTransToSchool', tripStopData.PUTransToSchool);
			}
			if (tripStopData && tripStopData.SchoolCode && tripStopData.DOTransToSchool)
			{
				nodeData.set('customData.doTransToSchool', tripStopData.DOTransToSchool);
			}
			if (tripStopData && tripStopData.Distance > -1)
			{
				nodeData.set('customData.distance', parseFloat(self.convertToCurrentMeasurementUnit(tripStopData.Distance)).toFixed(2));
			}
			if (tripStopData && tripStopData.StopTime)
			{
				nodeData.set('customData.stopTime', moment(tripStopData.StopTime, "HH:mm:ss").format('h:mm a'));
			}
			if (tripStopData && tripStopData.Duration)
			{
				nodeData.set('customData.duration', durationToString(tripStopData.Duration));
			}
			if (tripStopData && tripStopData.Speed)
			{
				nodeData.set('customData.avgSpeed', self.speedToString(tripStopData.Speed));
			}
			if (tripStopData && tripStopData.LockStopTime != undefined)
			{
				nodeData.set('customData.lockStopTime', tripStopData.LockStopTime);
			}
			if (tripStopData)
			{
				nodeData.set('customData.deletable', self.tripStopDeletable(tripStopData));
			}
			var color = self.dataModel.getColorByTripId(nodeData.parent().parent().id);
			self.routingDisplayHelper.setSequenceLineColor(color, nodeElement, 'tripStop');
			//fix last stop style will be return to bottom style not respect the stop expended status after changing its property
			var nodeWasExpanded = self.routingDisplayHelper.checkNodeWasExpanded(nodeData);
			self.routingDisplayHelper.fixStopLineStyle(nodeData, nodeElement);
			if (!onlyAffectCurrentNode)
			{
				if (nodeWasExpanded && nodeData.children && nodeData.children._data)
				{
					nodeData.children._data.map(function(student)
					{
						var studentNodeElement = self.treeview.findByUid(student.uid);
						self.setStudentNodeProperty(student, studentNodeElement, null);
					});
				}
				else
				{
					var studentNodes = nodeData.items.length > 0 ? nodeData.items : ((nodeData.children && nodeData.children.options) ? nodeData.children.options.data.items : nodeData.items);
					studentNodes.map(function(studentNode)
					{
						var student = Enumerable.From(tripStopData.Students).FirstOrDefault(null, function(p)
						{
							return p.id == studentNode.id && p.RequirementID == studentNode.customData.requirementId && p.TripStopID == studentNode.customData.tripStopId;
						});

						if (isNullObj(student) && self.dataModel.routingStudentManager.schoolStopDictionary[tripStopData.id])
						{
							var studentInSchool = Enumerable.From(self.dataModel.routingStudentManager.schoolStopDictionary[tripStopData.id]).FirstOrDefault(null, function(data)
							{
								return data.student.id == studentNode.id && data.student.RequirementID == studentNode.customData.requirementId && data.student.TripStopID == studentNode.customData.tripStopId;
							});
							if (studentInSchool)
							{
								student = studentInSchool.student;
							}
						}

						if (student)
						{
							self.routingDisplayHelper.resetUnexpandedTreeNodeValue(studentNode, student);
							studentNode.customData.prohibitCross = studentNode.customData.prohibitCross || tripStopData.ProhibitCrosser;

							if (self.routingDisplayHelper.getTripType() == self.routingDisplayHelper.tripType.MidDay && tripStopData.SchoolCode && tripStopData.SchoolCode != studentNode.customData.transSchoolCode)
							{
								var studentData = self.dataModel.getStudent(studentNode.id, studentNode.customData.tripStopId, studentNode.customData.anotherTripStopID, studentNode.customData.requirementId, studentNode.customData.previousScheduleID);
								var availableSession = self.dataModel.routingStudentManager.getAvailableSession(student, tripStopData.TripId, tripStopData);
								var puValid = availableSession.indexOf(0) < 0 ? false : true;
								var doValid = availableSession.indexOf(1) < 0 ? false : true;
								studentNode.customData.session = 1 - studentData.Session;
								if (!(puValid && doValid))
								{
									studentNode.customData.PUValid = !puValid;
									studentNode.customData.DOValid = !doValid;
								}
							}
						}
					});
				}
			}
			nodeElement.find(".icon.stop-delete").off('click').on('click', deleteClick.bind(self));
			nodeElement.find(".icon.stop-info").off('click').on('click', infoClick.bind(self));
			nodeElement.find(".icon.copyStop").off('click').on('click', copyStopClick.bind(self));
			nodeElement.find(".icon.zoom-map-to-layers").off('click').on('click', zoomClick.bind(self));
			nodeElement.find('.schedule-time').off('click').on('click', scheduledTimeClick.bind(self));
			nodeElement.find('.avg-speed').off('click').on('click', avgSpeedClick.bind(self));
			nodeElement.find('.icon.lock-time').off('click').on('click', setLockTimeClick.bind(self));
			nodeElement.find('.icon.assign').off('click').on('click', assignStudentForStopClick.bind(self));
			if (tripStopData && tripStopData.SchoolCode)
			{
				self.bindSchoolLocation(nodeElement);
			}
		}
	}

	RoutingDisplay.prototype.setTripNodeProperty = function(nodeData, nodeElement, notAffectTripStop, notAffectStudent)
	{
		var self = this;
		if (nodeData.customData.isTrip)
		{
			var tripData = self.dataModel.getTripById(nodeData.id);
			var totalAssignedStudents = tripData.FieldTripStops
				.reduce((prev, curr) => prev.concat(curr.Students), [])
				.reduce((prev, curr) => prev.concat(!prev.some(x => x.id === curr.id) ? curr : []), [])
				.length;
			var totalDistance = 0;
			tripData.FieldTripStops.map(function(tripStop)
			{
				totalDistance += tripStop.Distance;
			});
			if (tripData.FieldTripStops.length > 0)
			{
				tripData.StartTime = tripData.FieldTripStops[0].StopTime;
				tripData.FinishTime = tripData.FieldTripStops[tripData.FieldTripStops.length - 1].StopTime;
			}
			tripData.NumTransport = totalAssignedStudents;
			tripData.Distance = totalDistance;
			nodeData.set('visible', tripData.visible);
			nodeData.set('id', tripData.id);
			nodeData.set('text', tripData.Name);
			nodeData.set('customData.students', tripData.NumTransport);
			nodeData.set('customData.actualStartTime', tripData.ActualStartTime);
			nodeData.set('customData.actualEndTime', tripData.ActualEndTime);
			nodeData.set('customData.color', tripData.color);
			nodeData.set('customData.stops', tripData.FieldTripStops.length);
			nodeData.set('customData.distance', self.convertToCurrentMeasurementUnit(totalDistance).toFixed(2));
			nodeData.set('customData.startTime', convertToMoment(tripData.StartTime).format('h:mm a'));
			nodeData.set('customData.endTime', convertToMoment(tripData.FinishTime).format('h:mm a'));
			nodeData.set('customData.tripTotalTime', convertToMoment(tripData.FinishTime).diff(convertToMoment(tripData.StartTime), 'minutes'));
			// nodeData.set('customData.hasDistrictPolicyError', self.viewModel.analyzeTripByDistrictPolicy.hasError(tripData.id));
			// if (self.dataModel.showImpactDifferenceChart())
			// {
			// 	self.showOptimizeInfo(null, nodeData);
			// }
			if (!notAffectTripStop)
			{
				if (self.routingDisplayHelper.checkNodeWasExpanded(nodeData) && nodeData.children && nodeData.children._data)
				{
					nodeData.children._data.map(function(tripStopNode)
					{
						self.setTripStopNodeProperty(tripStopNode, self.treeview.findByUid(tripStopNode.uid), notAffectStudent);
					});
					if (nodeData.children._data.length == 1)
					{
						self.routingDisplayHelper.resetStopStyle(self.treeview.findByUid(nodeData.children._data[0].uid).find('.sequence-line'), self.routingDisplayHelper.StopStyle.one);
					}
				}
				else
				{
					self.routingDisplayHelper.updateUnexpandedTripNode(nodeData, tripData);
				}
			}

			self.koBindTripNode(nodeElement, nodeData);

			var $tripColor = $(nodeElement).find('.trip-color');
			if ($tripColor.data('kendoColorPicker'))
			{
				return;
			}
			$tripColor.kendoColorPicker({
				buttons: false,
				change: function(e)
				{
					self.routingDisplayHelper.setSequenceLineColor(e.value, nodeElement, 'trip');
					self.dataModel.changeTripColor(nodeData.id, e.value);
				},
				value: tripData.color,
				open: function(e)
				{
					$(e.sender.element.closest('li')).attr('suspend', 'true');
				}
			});

			nodeElement.find(".icon.copy-information").off('click').on('click', copyInformationClick.bind(self));
			nodeElement.find(".icon.optimize-sequence").off('click').on('click', optimizeSequenceClick.bind(self));
			nodeElement.find(".icon.trip-absorption").off('click').on('click', tripAbsorptionClick.bind(self));
			nodeElement.find(".icon.close-current-item").off('click').on('click', closeClick.bind(self));
			nodeElement.find(".icon.show-eye").off('click').on('click', showClick.bind(self));
			nodeElement.find(".icon.zoom-map-to-layers").off('click').on('click', zoomClick.bind(self));
			nodeElement.find(".icon.refresh").off('click').on('click', refreshPathClick.bind(self));
			nodeElement.find(".icon.trip-info").off('click').on('click', tripInfoClick.bind(self));
			nodeElement.find(".icon.trip-delete").off('click').on('click', tripDeleteClick.bind(self));
			nodeElement.find(".icon.copyTrip").off('click').on('click', copyTripClick.bind(self));
			nodeElement.find(".icon.copyStop").off('click').on('click', copyStopClick.bind(self));
			nodeElement.find(".insert-front-stops-area").off('click').on('click', insertTripStopsClick.bind(self));
			nodeElement.find(".insert-front-stops-area").off('mouseover').on('mouseover', insertBeforeButtonMouseOver.bind(self));
			nodeElement.find(".insert-front-stops-area").off('mouseout').on('mouseout', insertBeforeButtonMouseOut.bind(self));
			nodeElement.find(".insert-behind-stops-area").off('click').on('click', insertTripStopsClick.bind(self));
			nodeElement.find(".insert-behind-stops-area").off('mouseover').on('mouseover', insertAfterButtonMouseOver.bind(self));
			nodeElement.find(".insert-behind-stops-area").off('mouseout').on('mouseout', insertAfterButtonMouseOut.bind(self));
			nodeElement.find(".insert-stops-area").off('click').on('click', insertTripStopsClick.bind(self));
			nodeElement.find(".insert-stops-area").off('mouseover').on('mouseover', insertStopButtonMouseOver.bind(self));
			nodeElement.find(".insert-stops-area").off('mouseout').on('mouseout', insertStopButtonMouseOut.bind(self));
		}
	}

	RoutingDisplay.prototype.newStudent = function(student, tripStop, tripStopProhibit)
	{
		var self = this;
		var checkedDayList = [false, false, false, false, false, false, false];
		if (student.Monday != null)
		{
			checkedDayList = [student.Monday, student.Tuesday, student.Wednesday, student.Thursday, student.Friday, student.Saturday, student.Sunday];
		}
		var initCannotCheckableList = [!student.ValidMonday, !student.ValidTuesday, !student.ValidWednesday, !student.ValidThursday, !student.ValidFriday, !student.ValidSaturday, !student.ValidSunday];
		var uncheckableList = [!student.ValidMonday, !student.ValidTuesday, !student.ValidWednesday, !student.ValidThursday, !student.ValidFriday, !student.ValidSaturday, !student.ValidSunday];
		if (self.routingDisplayHelper.filterArray(checkedDayList, true).length == 1)
		{
			uncheckableList = checkedDayList.map(function(value, index)
			{
				return value || uncheckableList[index];
			});
		}
		var isAssigned = student.IsAssigned;
		var _isValid = student.IsValid ? student.IsValid : true;
		var PUValid = true, DOValid = true;
		if (self.routingDisplayHelper.getTripType() == self.routingDisplayHelper.tripType.MidDay)
		{
			var availableSession = self.dataModel.routingStudentManager.getAvailableSession(student, tripStop.TripId, tripStop);
			PUValid = availableSession.indexOf(0) >= 0;
			DOValid = availableSession.indexOf(1) >= 0;
		}
		var session = student.Session;
		if (session != TF.Helper.TripHelper.Sessions.Shuttle && tripStop.SchoolCode && tripStop.SchoolCode != student.TransSchoolCode)
		{
			if (!(PUValid && DOValid))
			{
				PUValid = !PUValid;
				DOValid = !DOValid;
			}
			session = !session;
		}

		if (tripStop && !tripStop.SchoolCode && isAssigned)
		{
			self.dataModel.getStudentValidValue(student, tripStop);
		}
		var isConfused = self.IsConfusedStudent(student.id, student.RequirementID, student.PreviousScheduleID, tripStop.id);
		return {
			id: student.id,
			text: student.FirstName + ' ' + student.LastName,
			expand: false,
			expanded: !!self.expandStatusDictionary['Student' + student.id],
			customData: {
				session: session,
				tripSession: self.dataModel.getSession(),
				PUValid: PUValid,
				DOValid: DOValid,
				requirementId: student.RequirementID,
				previousScheduleID: student.PreviousScheduleID,
				tripStopId: student.TripStopID,
				tripId: tripStop.TripId,
				anotherTripStopID: student.AnotherTripStopID,
				schoolCode: student.SchoolCode,
				grade: student.Grade,
				totalTime: student.TotalTime || 0,
				loadTime: loadTimeToString((student.LoadTime != null && student.LoadTime != 0 && student.LoadTime != "00:00:00") ? student.LoadTime : self.routingDisplayHelper.getLoadTimeByGrade(student)),
				walkToStopDistance: isAssigned ? parseFloat(self.convertToCurrentMeasurementUnit(student.WalkToStopDistance || 0)).toFixed(2) : "--",
				walkToStopDistanceWarning: !!student.WalkToStopDistanceWarning,
				isAssigned: isAssigned,
				geometry: student.geometry,
				PUDOStatus: student.PUDOStatus,
				isStudent: true,
				sortValue: (isAssigned ? 'a' : 'z') + student.LastName + student.FirstName,
				crossToStop: student.CrossToStop,
				isValid: isAssigned ? _isValid : true,
				openType: tripStop.OpenType,
				prohibitCross: student.ProhibitCross || tripStopProhibit,
				dayCheckList: checkedDayList,
				dayDisableList: uncheckableList,
				initDayUncheckableList: initCannotCheckableList,
				isConfused: isConfused,
				transSchoolCode: student.TransSchoolCode
			}
		}
	}

	function durationToString(text)
	{
		return text.substring(1, text.length);
	}

	function loadTimeToString(text)
	{
		return text.substring(3, text.length);
	}

	RoutingDisplay.prototype.speedToString = function(speed)
	{
		const self = this;
		return `${(speed ? self.convertToCurrentMeasurementUnit(speed).toLocaleString(undefined, { maximumFractionDigits: 2 }) : 0)} ${(self.isImperialUnit ? "mph" : "kph")}`;
	}

	RoutingDisplay.prototype.isLastStop = function(trip, tripStop)
	{
		var index = trip.TripStops.findIndex(function(i) { return i.id === tripStop.id; });
		return index === trip.TripStops.length - 1;
	};

	RoutingDisplay.prototype.newTripStop = function(tripStop, session, tripName)
	{
		var self = this,
			trip = self.dataModel.trips.find(function(i) { return i.Name === tripName; }),
			isLast = self.isLastStop(trip, tripStop);
		return {
			id: tripStop.id,
			text: tripStop.Street,
			expand: false,
			expanded: !!self.expandStatusDictionary['Stop' + tripStop.id],
			customData: {
				totalStudentCount: tripStop.TotalStudentCount,
				assignedStudentCount: tripStop.AssignedStudentCount,
				toSchoolStudents: tripStop.ToSchoolStudents,
				toTransStudents: tripStop.ToTransStudents,
				transToTrans: tripStop.TransToTrans,
				puTransToSchool: tripStop.PUTransToSchool,
				doTransToSchool: tripStop.DOTransToSchool,
				isLast: isLast,
				duration: durationToString(tripStop.Duration),
				avgSpeed: self.speedToString(tripStop.Speed),
				stopTime: moment(tripStop.StopTimeArrive||tripStop.StopTimeDepart).format('MM-DD-YYYY h:mm a'),
				sequence: tripStop.Sequence,
				geometry: tripStop.geometry,
				schoolCode: tripStop.SchoolCode,
				tripId: tripStop.TripId,
				tripName: tripName,
				distance: self.convertToCurrentMeasurementUnit(tripStop.Distance).toFixed(2),
				measurementUnit: tf.measurementUnitConverter.getShortUnits(),
				sortValue: tripStop.Sequence,
				lockStopTime: tripStop.LockStopTime,
				session: session,
				openType: tripStop.OpenType,
				deletable: self.tripStopDeletable(tripStop),
				prohibitCrosser: tripStop.ProhibitCrosser,
				isStop: true
			},
			items: []//this.newStudentData(tripStop)
		}
	}

	RoutingDisplay.prototype.tripStopDeletable = function(tripStop)
	{
		return !(tripStop.PrimaryDeparture || tripStop.PrimaryDestination);
	};

	RoutingDisplay.prototype.onCandidatesStudentsChange = function(e, data)
	{
	}

	RoutingDisplay.prototype.onTripSaveEvent = function(evt, trips)
	{
		var self = this;
		trips.forEach(function(trip)
		{
			var tripNode = self.treeview.dataSource.getFirst(trip.oldId, function(data)
			{
				return data.customData && data.customData.isTrip;
			});
			self.setTripNodeProperty(tripNode, self.treeview.findByUid(tripNode.uid));
		});
	};

	RoutingDisplay.prototype.onStopCandidateStudentChange = function(e, data)
	{
		var self = this;
		data.add.map(function(student)
		{
			var pList = [];
			var tripStopEntities = self.dataModel.studentsDictionary[self.dataModel.routingStudentManager._getKey(student)];
			if (tripStopEntities && tripStopEntities.length > 0 && self.treeview)
			{
				var stopIds = [];
				tripStopEntities.forEach(function(stop)
				{
					stopIds.push(stop.id);
					stopIds = stopIds.concat($.isArray(stop.schoolStopId) ? stop.schoolStopId : [stop.schoolStopId]);
				});
				stopIds = Enumerable.From(stopIds).Distinct().ToArray();
				stopIds.map(function(stopId)
				{
					var promise = Promise.resolve(true);
					var tripStop = self.dataModel.getTripStopByStopId(stopId);
					if (isNullObj(tripStop) || tripStop.OpenType != 'Edit')
					{
						return;
					}
					var tripNode = self.routingDisplayHelper.getExpandedTreeNode(tripStop.TripId, 'trip', self.treeview.dataSource);
					if (isNullObj(tripNode))
					{
						return;
					}

					var ts = self.routingDisplayHelper.getTreeNodeFromParentNode(tripStop.id, tripNode, 'tripstop');
					var studentTemp = null;
					if (self.dataModel.tripStopDictionary[stopId].length > 0)
					{
						var studentEntity = Enumerable.From(self.dataModel.tripStopDictionary[stopId]).FirstOrDefault(null, function(s) { return s && s.student.RequirementID == student.RequirementID && s.student.PreviousScheduleID == student.PreviousScheduleID; });
						if (studentEntity != null)
						{
							if (!studentEntity.canBeAssigned)
							{
								return;
							}
							studentTemp = studentEntity.student;
						}
					}
					if (studentTemp === null && self.dataModel.routingStudentManager.schoolStopDictionary[stopId].length > 0)
					{
						var studentEntity = Enumerable.From(self.dataModel.routingStudentManager.schoolStopDictionary[stopId]).FirstOrDefault(null, function(s) { return s && s.student.RequirementID == student.RequirementID && s.student.PreviousScheduleID == student.PreviousScheduleID; });
						if (studentEntity != null)
						{
							if (!studentEntity.canBeAssigned)
							{
								return;
							}
							studentTemp = studentEntity.student;
						}
					}
					if (studentTemp !== null)
					{
						student = studentTemp;
					}
					if (!student.PUDOStatus)
					{
						self.routingDisplayHelper.setStudentStatus(student, tripStop);
					}

					var newStudent = self.newStudent(student, tripStop, tripStop.ProhibitCrosser);

					promise = self.routingDisplayHelper.addTreeNode(newStudent, ts, 'student').then(function()
					{
						if (self.routingDisplayHelper.checkNodeWasExpanded(tripNode))
						{
							var element = self.treeview.findByUid(ts.uid);
							self.setTripStopNodeProperty(ts, element);
						}
					});

					pList.push(promise);
				});
			}
		});
		data.edit.map(function(student)
		{
			self.dataModel.trips.forEach(function(trip)
			{
				var tripNode = self.routingDisplayHelper.getExpandedTreeNode(trip.id, 'trip', self.treeview.dataSource);
				if (isNullObj(tripNode))
				{
					return;
				}
				trip.TripStops.forEach(function(tripStopEntity)
				{
					var studentInDictionary = Enumerable.From(self.dataModel.tripStopDictionary[tripStopEntity.id]).FirstOrDefault(null, function(c) { return c.student.RequirementID == student.RequirementID && c.student.PreviousScheduleID == student.PreviousScheduleID });
					if (studentInDictionary)
					{
						student = studentInDictionary.student;
						var tripStopNode = self.routingDisplayHelper.getTreeNodeFromParentNode(tripStopEntity.id, tripNode, 'tripstop');
						var studentNode = self.routingDisplayHelper.getTreeNodeFromParentNode(student.id, tripStopNode, 'student', student.RequirementID, tripStopEntity.id, student.PreviousScheduleID);
						if (studentNode)
						{
							if (self.routingDisplayHelper.checkNodeWasExpanded(tripStopNode))
							{
								self.setStudentNodeProperty(studentNode, self.treeview.findByUid(studentNode.uid), studentNode.customData.crossToStop);
							} else
							{
								self.routingDisplayHelper.resetUnexpandedTreeNodeValue(studentNode, student);
								studentNode.customData.prohibitCross = studentNode.customData.prohibitCross || tripStopEntity.ProhibitCrosser;
							}
						}
					}

				});
			});
		});
		// deletes
		if (data.delete && data.delete.length > 0)
		{
			var deleteStudentDictionary = {};
			data.delete.forEach(function(student)
			{
				deleteStudentDictionary[student.id + "_" + student.RequirementID + "_" + student.PreviousScheduleID] = true;
			});

			self.dataModel.trips.forEach(function(trip)
			{
				var tripNode = self.routingDisplayHelper.getExpandedTreeNode(trip.id, 'trip', self.treeview.dataSource);
				if (isNullObj(tripNode))
				{
					return;
				}
				trip.TripStops.forEach(function(tripStopEntity)
				{
					var tripStop = self.dataModel.getTripStopByStopId(tripStopEntity.id);
					var ts = self.routingDisplayHelper.getTreeNodeFromParentNode(tripStop.id, tripNode, 'tripstop');
					if (!ts) return;
					var studentNodes = self.routingDisplayHelper.getAllTreeNodeFromParentNode(ts).slice();
					studentNodes.forEach(function(studentNode)
					{
						if (studentNode && studentNode.customData.isAssigned == false && deleteStudentDictionary[studentNode.id + "_" + studentNode.customData.requirementId + "_" + studentNode.customData.previousScheduleID])
						{
							self.routingDisplayHelper.removeTreeNode(studentNode, ts);
							if (self.routingDisplayHelper.checkNodeWasExpanded(tripNode))
							{
								self.setTripStopNodeProperty(ts, self.treeview.findByUid(ts.uid), true);
							}
						}
					});
				});
			});
		}
	};

	RoutingDisplay.prototype.showOptimizeInfo = function(e, data)
	{
		var self = this;
		if (!self.treeview || !self.dataModel.showImpactDifferenceChart())
		{
			return;
		}
		self.toggleShowOptimizeInfo();
		var tripNode = self.treeview.dataSource.getFirst(data.tripId ? data.tripId : data.id, function(data)
		{
			return data.customData && data.customData.isTrip;
		});
		var tripNodeElement = self.treeview.findByUid(tripNode.uid);
		if (!data.tripId)
		{
			data = self.dataModel.getTripById(data.id);
		}
		if (tripNode.customData.openType == 'Edit' && tripNodeElement)
		{
			self.routingDisplayHelper.drawOptimizeInfo(tripNodeElement.find('.trip-canvas-distance-info'), (data.distanceDiffRate == 'N/A' || (data.distanceDiffRate != undefined && Math.abs(data.distanceDiffRate) >= 1)) ? data.distanceDiffRate : 0, 'Distance', ((data.distanceDiff != undefined && Math.abs(data.distanceDiff) >= 0.01 && data.distanceDiff != '-999') ? data.distanceDiff : 0) + ` ${tf.measurementUnitConverter.getUnits()}`);
			self.routingDisplayHelper.drawOptimizeInfo(tripNodeElement.find('.trip-canvas-duration-info'), (data.durationDiffRate == 'N/A' || (data.durationDiffRate != undefined && Math.abs(data.durationDiffRate) >= 1)) ? data.durationDiffRate : 0, 'Time', ((data.durationDiff != undefined && Math.abs(data.durationDiff) >= 0.01 && data.durationDiff != '-999') ? data.durationDiff : 0) + ' minutes');
		}
	}

	RoutingDisplay.prototype.toggleShowOptimizeInfo = function()
	{
		var self = this;
		var routingtreeview = self.viewModel.$element.find("#routingtreeview");
		var $tree_trip_rows = routingtreeview.find('.row.tree-trip-row');
		if (self.dataModel.showImpactDifferenceChart())
		{
			$tree_trip_rows.map(function(index, row)
			{
				var tripNodeData = self.treeview.dataItem($(row).closest('li'));
				if (tripNodeData.customData.openType != 'View' && !$(row).hasClass('show-optimize-info'))
				{
					$(row).addClass('show-optimize-info');
				}
			});
		}
		else
		{
			$tree_trip_rows.removeClass('show-optimize-info');
		}
	}

	RoutingDisplay.prototype.onShowChartChange = function()
	{
		var self = this;
		if (!self.treeview)
		{
			return;
		}
		self.toggleShowOptimizeInfo();
		if (self.dataModel.showImpactDifferenceChart())
		{
			self.dataModel.getEditTrips().forEach(function(trip)
			{
				self.dataModel.refreshOptimizeSequenceRate(trip.id);
			});
		}
	}

	RoutingDisplay.prototype.changeVisible = function(e, data)
	{
		var self = this;
		var routingtreeview = self.viewModel.$element.find("#routingtreeview");
		var $eyeButtons = routingtreeview.find(".icon.show-eye");
		$eyeButtons.each(function(i, eyeButton)
		{
			var $eyeButton = $(eyeButton);
			var trip = self.treeview.dataItem($eyeButton.closest('li'));
			if (data.TripIds.indexOf(trip.id) >= 0)
			{
				if (data.visible)
				{
					$eyeButton.removeClass("hide-eye");
				} else
				{
					$eyeButton.addClass("hide-eye");
				}
			}
		});
	};

	RoutingDisplay.prototype.getDataSource = function(data)
	{
		const self = this;
		let promise = null;
		tf.loadingIndicator.showImmediately();
		var treeview = self.viewModel.$element.find("#routingtreeview").data('kendoTreeView');
		var sortItems = (list) =>
		{
			list.forEach(item =>
			{
				item.items.forEach(el =>
				{
					el.items = el.items.sort((a, b) =>
					{
						const v1 = a.customData.sortValue && a.customData.sortValue.toLowerCase();
						const v2 = a.customData.sortValue && b.customData.sortValue.toLowerCase();
						return v1 > v2 ? 1 : (v1 < v2 ? -1 : 0);
					});
				})
			})
		}
		if (data.add.length > 0)
		{
			var newAddList = [];
			data.add.map(function(trip)
			{
				var newTrip = self.newFieldTripData(trip);
				newAddList.push(newTrip);
			});
			sortItems(newAddList);
			var homogeneous = new kendo.data.HierarchicalDataSource({
				data: newAddList,
				sort: { field: "customData.sortValue", dir: "asc" },
				loadOnDemand: true,
				animation: {
					collapse: false,
					expand: false
				},
			});
			if (treeview.dataSource._data && treeview.dataSource._data.length > 0)
			{
				newAddList.map(function(newTrip)
				{
					treeview.dataSource._data.sort(function(a, b)
					{
						const v1 = a.text && a.text.toLowerCase();
						const v2 = b.text && b.text.toLowerCase();
						return v1 > v2 ? 1 : (v1 < v2 ? -1 : 0);
					});
					for (var i = 0; i < treeview.dataSource._data.length; i++)
					{
						if (newTrip.text > treeview.dataSource._data[i].text)
						{
							continue;
						}
						else
						{
							return treeview.insertBefore(newTrip, treeview.findByUid(treeview.dataSource._data[i].uid));
						}
					}
					treeview.append(newTrip);
				});
			}
			else
			{
				treeview.setDataSource(homogeneous);
			}

			// if (data.options && data.options.resetScheduleTime)
			// {
			// 	promise = self.resetTripInfo(data.add, null, null, data.options.resetScheduleTime);
			// }
			//newAddList.forEach(function(trip) { self.dataModel.refreshOptimizeSequenceRate(trip.id) });
			// this.refreshNextTripData(newAddList);
		}

		if (data.delete.length > 0)
		{
			self.routingDisplayHelper.clearExpandedDictionary(data.delete);
			data.delete.map(function(trip)
			{
				var deleteTrip = self.routingDisplayHelper.getTripNodeById(trip);
				if (deleteTrip.length > 0)
				{
					const deletingDom = Array.from(treeview.element.find("ul > li")).find(el => $(el).data("kendoUid") === deleteTrip[0].uid);
					treeview.remove(treeview.findByUid(deleteTrip[0].uid));
					self.cleanRemovedTreeViewItem(deletingDom, deleteTrip[0]);
				}
				if (!data.notClearStudentCache)
				{
					trip.TripStops.map(function(tripStop)
					{
						var students = tripStop.Students;
						if (self.dataModel.tripStopDictionary[tripStop.id])
						{
							students = self.dataModel.tripStopDictionary[tripStop.id].map(function(studentEntity)
							{
								return studentEntity.student;
							});
							delete self.dataModel.tripStopDictionary[tripStop.id];
						}
						students.map(function(student)
						{
							var key = self.dataModel.routingStudentManager._getKey(student);
							if (self.dataModel.studentsDictionary[key])
							{
								for (var i = self.dataModel.studentsDictionary[key].length - 1; i > -1; i--)
								{
									if (self.dataModel.studentsDictionary[key][i].id == tripStop.id)
									{
										self.dataModel.studentsDictionary[key].splice(i, 1);
									}
								}
							}
						});
					});
				}
			});
		}
		if (data.edit.length > 0)
		{
			promise = self.resetTripInfo(data.edit, true).then(function()
			{
				var newAddList = [];
				// self.clearSchoolStudentInfo(data.edit);
				data.edit.map(function(trip)
				{
					var deleteTrip = self.routingDisplayHelper.getTripNodeById(trip);
					if (deleteTrip.length > 0)
					{
						const deletingDom = Array.from(treeview.element.find("ul > li")).find(el => $(el).data("kendoUid") === deleteTrip[0].uid);
						treeview.remove(treeview.findByUid(deleteTrip[0].uid));
						self.cleanRemovedTreeViewItem(deletingDom, deleteTrip[0]);
					}
					if (self.dataModel.trips.some(i => i.Name === trip.Name))
					{
						let newTrip = self.newFieldTripData(trip);
						newAddList.push(newTrip);
					}
				});
				// self.refreshNextTripData(newAddList);
				sortItems(newAddList);
				var homogeneous = new kendo.data.HierarchicalDataSource({
					data: newAddList,
					sort: { field: "customData.sortValue", dir: "asc" }
				});
				if (treeview.dataSource._data && treeview.dataSource._data.length > 0)
				{
					newAddList.map(function(newTrip)
					{
						treeview.dataSource._data.sort(function(a, b)
						{
							const v1 = a.text && a.text.toLowerCase();
							const v2 = b.text && b.text.toLowerCase();
							return v1 > v2 ? 1 : (v1 < v2 ? -1 : 0);
						});
						for (var i = 0; i < treeview.dataSource._data.length; i++)
						{
							if (newTrip.text > treeview.dataSource._data[i].text)
							{
								continue;
							}
							else
							{
								return treeview.insertBefore(newTrip, treeview.findByUid(treeview.dataSource._data[i].uid));
							}
						}
						treeview.append(newTrip);
					});
				}
				else
				{
					treeview.setDataSource(homogeneous);
				}
			});
		}
		self.setFootInfo();
		tf.loadingIndicator.tryHide();
		return promise;
	}

	RoutingDisplay.prototype.newFieldTripData = function(trip)
	{
		const self = this;
		let = totalAssignedStudents = 0;
		totalAssignedStudents = trip.TripStops
			.reduce((prev, curr) => prev.concat(curr.Students), [])
			.reduce((prev, curr) => prev.concat(!prev.some(x => x.id === curr.id) ? curr : []), [])
			.length;
		return {
			id: trip.id,
			text: trip.Name,
			expand: false,
			expanded: !!self.expandStatusDictionary['Trip' + trip.id],
			visible: trip.visible,
			session: trip.Session,
			prevLayover: ko.observable(null),
			nextLayover: ko.observable(null),
			customData: {
				//students: trip.Session == 0 ? trip.PickUpStudents.length : trip.DropOffStudents.length,
				students: totalAssignedStudents,
				stops: trip.FieldTripStops.length,
				tripTotalTime: convertToMoment(trip.EstimatedReturnDateTime).diff(convertToMoment(trip.DepartDateTime), 'minutes'),
				distance: self.convertToCurrentMeasurementUnit(trip.EstimatedDistance || 0).toFixed(2),
				measurementUnit: tf.measurementUnitConverter.getShortUnits(),
				startTime: convertToMoment(trip.DepartDateTime).format('MM-DD-YYYY h:mm a'),
				endTime: convertToMoment(trip.EstimatedReturnDatetime).format('MM-DD-YYYY h:mm a'),
				actualStartTime: trip.ActualStartTime,
				actualEndTime: trip.ActualEndTime,
				//originalTrip: trip,
				color: trip.color,
				sortValue: trip.Name,
				openType: trip.OpenType,
				hasDistrictPolicyError: self.viewModel.analyzeTripByDistrictPolicy.hasError(trip.id),
				isTrip: true,

				EstimatedHours: trip.EstimatedHours ? trip.EstimatedHours * 60 : 0,
				EstimatedDistance: self.convertToCurrentMeasurementUnit(trip.EstimatedDistance || 0).toFixed(2),
				DepartDateTime: convertToMoment(trip.DepartDateTime).format('MM-DD-YYYY h:mm a'),
				EstimatedReturnDateTime: convertToMoment(trip.EstimatedReturnDateTime).format('MM-DD-YYYY h:mm a'),
				//durationOptimizeNmber: ""
			},
			items: self.newTripStopData(trip.FieldTripStops, trip)
		};
	}

	// RoutingDisplay.prototype.refreshNextTripData = function(trips)
	// {
	// 	tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "trips"),
	// 		{
	// 			paramData: {
	// 				"@fields": "id,LayoverToNextTrip,LayoverFromPreviousTrip",
	// 				specialCalculation: "NextTrip,PreviousTrip",
	// 				ids: trips.map(i => i.id).join(",")
	// 			}
	// 		}, { overlay: false }).then(response =>
	// 		{
	// 			let items = response.Items || [],
	// 				nextTripData = {};
	// 			items.forEach(i => nextTripData[i.Id] = i);
	// 			trips.forEach(trip =>
	// 			{
	// 				let data = nextTripData[trip.id] || {},
	// 					nextLayover = toMinutes(data.LayoverToNextTrip),
	// 					prevLayover = toMinutes(data.LayoverFromPreviousTrip);
	// 				trip.nextLayover = trip.nextLayover || ko.observable();
	// 				trip.prevLayover = trip.prevLayover || ko.observable();
	// 				trip.nextLayover(nextLayover);
	// 				trip.prevLayover(prevLayover);
	// 			});
	// 		});
	// };

	function toMinutes(time)
	{
		const naString = "N/A";
		const unit = " min";
		if (!time) return naString;

		let sign = "";
		if (time[0] === "-")
		{
			sign = "-"
			time = time.substring(1);
		};

		let parts = time.split(":");
		if (parts.lenght === 1)
		{
			return sign + parts[0] + unit;
		}

		const hours = parseInt(parts[0]);
		if (Number.isNaN(hours))
		{
			return naString;
		}

		const minutes = parseInt(parts[1]);
		if (Number.isNaN(minutes))
		{
			return naString;
		}

		const seconds = parseInt(parts[2]);
		let carryNumber = !Number.isNaN(seconds) && seconds ? 1 : 0;

		let total = hours * 60 + minutes + carryNumber;
		if (parts.lenght > 2)
		{
			const seconds = parseInt(parts[2]);
			if (!Number.isNaN(seconds) && seconds >= 30)
			{
				total++;
			}
		}

		if (total === 0)
		{
			sign = "";
		}

		return sign + total + unit;
	};

	RoutingDisplay.prototype.cleanRemovedTreeViewItem = function(deletingDom, dataItem)
	{
		if (deletingDom)
		{
			ko.cleanNode(deletingDom);
		}

		const prototype = Object.getPrototypeOf(dataItem);

		if (prototype && prototype.children && prototype.children.data)
		{
			if (!prototype.children.data.length)
			{
				tfdispose(prototype);
			}
			else
			{
				const index = prototype.children.data.findIndex(x => x.id === dataItem.id);
				prototype.children.data.splice(index, 1);
			}
		}
		tfdispose(dataItem);

		const treeview = this.treeview;

		if (treeview && treeview.dataSource && treeview.dataSource.data && treeview.dataSource.data().length === 0)
		{
			treeview.setDataSource(new kendo.data.HierarchicalDataSource({ data: [] }));
		}
	}

	RoutingDisplay.prototype.newTripStopData = function(tripStops, fieldTrip)
	{
		var self = this, {Session:session, Name: tripName} = fieldTrip;
		var result = [];
		function setTripStops(tripStop)
		{
			tripStop.OpenType = fieldTrip.OpenType;
			result.push(self.newTripStop(tripStop, session, tripName));
		}
		var tslength = tripStops.length;
		if (session == TF.Helper.TripHelper.Sessions.ToSchool || session == TF.Helper.TripHelper.Sessions.Shuttle)
		{
			for (var i = 0; i < tslength; i++)
			{
				var tripStopTemp = $.extend(true, {}, tripStops[i]);
				setTripStops(tripStopTemp);
			}
		}
		else
		{
			for (var j = tslength - 1; j > -1; j--)
			{
				var tripStopTemp = $.extend(true, {}, tripStops[j]);
				setTripStops(tripStopTemp);
			}
			result = result.reverse();
		}

		return result;
	}

	RoutingDisplay.prototype.newStudentData = function(tripStop)
	{
		var self = this;
		var result = [];
		var students = tripStop.Students;
		var tripStopId = tripStop.id;
		var studentList = students;
		if (tripStop.OpenType != 'View' && self.dataModel.tripStopDictionary[tripStopId])
		{
			studentList = studentList.concat(self.dataModel.tripStopDictionary[tripStopId].filter(function(item)
			{
				return item.canBeAssigned;
			}).map(function(item)
			{
				return item.student;
			}));
		}
		if (tripStop.SchoolCode && self.dataModel.routingStudentManager.schoolStopDictionary)
		{
			if (self.dataModel.routingStudentManager.schoolStopDictionary[tripStop.id])
			{
				if (tripStop.OpenType == 'View')
				{
					studentList = studentList.concat(self.dataModel.routingStudentManager.schoolStopDictionary[tripStop.id].filter(function(item)
					{
						return item.student.IsAssigned;
					}).map(function(item)
					{
						return item.student;
					}));
				}
				else
				{
					studentList = studentList.concat(self.dataModel.routingStudentManager.schoolStopDictionary[tripStop.id].filter(function(item)
					{
						return item.canBeAssigned || item.student.IsAssigned;
					}).map(function(item)
					{
						return item.student;
					}));
				}
			}
		}
		result = studentList.map(function(student)
		{
			if (!student.PUDOStatus || tripStop.SchoolCode)
			{
				self.routingDisplayHelper.setStudentStatus(student, tripStop);
			}
			var newStudent = $.extend(true, {}, student, { tripStopId: tripStopId });

			return self.newStudent(student, tripStop, tripStop.ProhibitCrosser);
		});
		return result;
	}

	RoutingDisplay.prototype.afterDataSourceBinding = function(data)
	{
		var self = this;
		self.bindEventAndCustomElement();
		if (data && (data.add.length != 0 || data.edit.length != 0))
		{
			data.add.map(function(trip)
			{
				self.showOptimizeInfo(null, trip);
			});
			data.edit.map(function(trip)
			{
				self.showOptimizeInfo(null, trip);
				self.setIsValidPropertyOnTree(trip);
				self.refreshAllStopNode(trip);
				if (data.isAfterDistrictPolicyChanged)
				{
					self.viewModel.analyzeTripByDistrictPolicy.analyze(trip, true);
				}
			});
		}
	}

	RoutingDisplay.prototype.onTripTreeColorChange = function(e, data)
	{
		var self = this;
		if (data && data.TripId)
		{
			let tripNode = self.routingDisplayHelper.getExpandedTreeNode(data.TripId, 'trip', self.treeview.dataSource);
			var tripElement = self.treeview.findByUid(tripNode.uid)
			self.routingDisplayHelper.setSequenceLineColor(data.color, tripElement.context, 'trip');
		}
	}

	RoutingDisplay.prototype.onTripChange = function(e, data)
	{
		var self = this;
		self.dataModel.onTripsChangeEventCalled = true;
		if (data && data.add.length == 0 && data.edit.length == 0 && data.delete.length == 0)
		{
			return;
		}
		if (self.isInitial)
		{
			self.initialTreeView();
		}
		// self.recalculateAllSchoolStudentCount(data.add.concat(data.edit));
		var result = self.getDataSource(data);
		if (result != null)
		{
			result.then(function()
			{
				self.afterDataSourceBinding(data);
				PubSub.publish("on_FieldTripMap_Change", data);
			});
		}
		else
		{
			self.afterDataSourceBinding(data);
			PubSub.publish("on_FieldTripMap_Change", data);
		}
	}

	RoutingDisplay.prototype.refreshAffectStopByStudentId = function(ids, tripStop)
	{
		var self = this;
		if (!$.isArray(ids))
		{
			ids = [ids];
		}
		var affectTripIds = [];
		var affectTrips = [];
		if (tripStop)
		{
			var trip = self.dataModel.getTripById(tripStop.TripId);
			affectTrips.push(trip);
			self.refreshStopNode(tripStop, trip);
		}
		else
		{
			ids.forEach(function(id)
			{
				var stops = self.getAffectedStopByStudentId(id);
				stops.map(function(stop)
				{
					var trip = self.dataModel.getTripById(stop.TripId);
					if (affectTripIds.indexOf(trip.id) < 0)
					{
						affectTripIds.push(trip.id);
						affectTrips.push(trip);
					}
					self.refreshStopNode(stop, trip);
				});
			});
		}

		affectTrips.map(function(trip)
		{
			self.refreshAllStopNode(trip, true);
		});
	}

	RoutingDisplay.prototype.getAffectedStopByStudentId = function(id)
	{
		var self = this, nodes, stopIds = [], requirementIds = [];
		nodes = self.routingDisplayHelper.getNodesByIdAndType(id, 'student');
		nodes.map(function(node)
		{
			if (stopIds.indexOf(node.customData.tripStopId) < 0)
			{
				stopIds.push(node.customData.tripStopId);
			}
		});
		requirementIds = requirementIds.concat(self.dataModel.getStudentRequirementIdsBySession(id, 0));
		requirementIds = requirementIds.concat(self.dataModel.getStudentRequirementIdsBySession(id, 1));
		requirementIds = requirementIds.concat(self.dataModel.getStudentRequirementIdsBySession(id, 2));
		requirementIds.map(function(requirementIdTemp)
		{
			var key = id + '_' + requirementIdTemp.RequirementID + "_" + requirementIdTemp.PreviousScheduleID;
			var tripStopEntities = self.dataModel.studentsDictionary[key];
			tripStopEntities.map(function(tripStopEntity)
			{
				if (stopIds.indexOf(tripStopEntity.id) < 0)
				{
					stopIds.push(tripStopEntity.id);
				}
			});
		});

		return self.dataModel.getTripStopsByStopIds(stopIds);
	}

	// RoutingDisplay.prototype.recalculateAllSchoolStudentCount = function(trips)
	// {
	// 	var self = this;
	// 	trips.map(function(trip)
	// 	{
	// 		trip.TripStops.map(function(tripStop)
	// 		{
	// 			if (tripStop.SchoolCode && !tripStop.isSchoolStop)
	// 			{
	// 				self.routingDisplayHelper.recalculateSchoolStudentCount(tripStop);
	// 			}
	// 		});
	// 	});
	// }

	RoutingDisplay.prototype.setIsValidPropertyOnTree = function(trip)
	{
		var self = this;
		self.dataModel.initSchoolSequence(trip.id, [trip]);
		for (var j = 0; j < trip.TripStops.length; j++)
		{
			var _tripStop = trip.TripStops[j];
			var students = _tripStop.Students;
			if (isNullObj(students) || students.length == 0)
			{
				continue;
			}
			self.dataModel.tryValidateSchoolStop(students, _tripStop, false);
		}
		self.dataModel.routingStudentManager.refresh();
	}

	RoutingDisplay.prototype.bindStudentNodeEvent = function(element)
	{
		var self = this;
		if (element)
		{
			element.find(".icon.minus").off('click').on('click', minusClick.bind(self));
			element.find(".icon.add").off('click').on('click', addClick.bind(self));
			element.find(".icon.zoom-map-to-layers").off('click').on('click', zoomClick.bind(self));
			element.find(".student-requirement .day").off('click').on('click', studentDayClick.bind(self));
			element.find(".student-PUDOStatus .status").off('click').on('click', studentStatusClick.bind(self));
		}
	};

	RoutingDisplay.prototype.convertToCurrentMeasurementUnit = function(value)
	{
		if (!this.isImperialUnit)
		{
			return value;
		}

		return tf.measurementUnitConverter.convert({
			originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
			targetUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Imperial,
			precision: 5,
			value: value
		});
	}

	RoutingDisplay.prototype.arcgisError = function(message)
	{
		tf.promiseBootbox.alert({
			message: message,
			title: "ArcGIS Server Error"
		}).then(() =>
		{
			tf.loadingIndicator.tryHide(true);
		});
	}

	RoutingDisplay.prototype.dispose = function()
	{
		if (this.treeviewDataBoundTimer != null)
		{
			clearTimeout(this.treeviewDataBoundTimer);
			this.treeviewDataBoundTimer = null;
		}
		this.treeview && this.treeview.destroy();
		tfdispose(this);
	};

})();
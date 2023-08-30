(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingDisplay = RoutingDisplay;

	function RoutingDisplay(fieldTripPaletteSectionVM)
	{
		var self = this;
		self.viewModel = fieldTripPaletteSectionVM;
		self.dataModel = fieldTripPaletteSectionVM.dataModel;
		self.eventsManager = fieldTripPaletteSectionVM.eventsManager;
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
		self.dataModel.onTripStopsChangeEvent.subscribe(self.onTripStopsChange.bind(self));
		self.changeVisible = self.changeVisible.bind(self);
		self.dataModel.onTripDisplayRefreshEvent.subscribe(self.onTripDisplayRefresh.bind(self));
		self.dataModel.onOptimizeSequenceDiffRateChange.subscribe(self.showOptimizeInfo.bind(self));
		self.dataModel.onShowChartChangeEvent.subscribe(self.onShowChartChange.bind(self));
		self.dataModel.onSchoolLocationChangeEvent.subscribe(self.onSchoolLocationChange.bind(self));
		self.dataModel.onTripSaveEvent.subscribe(self.onTripSaveEvent.bind(self));

		self.routingDisplayFixTitle = new TF.RoutingMap.RoutingPalette.RoutingDisplayFixTitle();
		self.routingDisplayAutoScroll = new TF.RoutingMap.RoutingPalette.RoutingDisplayAutoScroll();
		self.routingDisplayHelper = new TF.RoutingMap.RoutingPalette.RoutingDisplayHelper(self);
		self.isImperialUnit = tf.measurementUnitConverter.isImperial();
		self.momentHelper = new TF.Document.MomentHelper();
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
					trip.FieldTripStops.length, convertToMoment(trip.ActualEndTime).diff(convertToMoment(trip.ActualStartTime), 'minutes'), trip.Distance));
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
		const self = this,
			source = e.sender.dataItem(e.sourceNode),
			destination = e.sender.dataItem(e.destinationNode);

		self.routingDisplayAutoScroll.onEnd();
		self.viewModel.$element.find("#routingtreeview").removeClass("in-draging-status");

		if (!destination || destination?.customData.openType === 'View') return;

		var position = e.dropPosition,
			currentIndex = source.customData.sequence - 1,
			destinationFieldTripId = null,
			sourceTripId = source.customData.tripId;

		if (destination.customData.isTrip && position == "over")
		{
			// add to a trip
			destinationFieldTripId = destination.id;
		}
		else if (destination.customData.isStop)
		{
			destinationFieldTripId = destination.customData.tripId;
		}

		if (!destinationFieldTripId) return;

		var isSameTrip = sourceTripId == destinationFieldTripId;
		var tripStop = self.dataModel.getTripStopsByStopIds([source.id])[0];
		if (isNullObj(tripStop)) return;

		var originalFieldTripId = tripStop.FieldTripId;

		var destTrip = self.dataModel.getFieldTripById(destinationFieldTripId);
		self.routingDisplayHelper.getInsertPosition(position, source, destination, isSameTrip, tripStop, destTrip).then(function(destinationIndex)
		{
			if (destinationIndex == -1 || (isSameTrip && currentIndex == destinationIndex))
			{
				return;
			}

			tf.loadingIndicator.enhancedShow(() =>
			{
				self.deleteNode(tripStop, isSameTrip);
				return self.dataModel.changeStopPosition(tripStop, destinationFieldTripId, destinationIndex).then(function()
				{
					return self.afterChangeStopPosition(tripStop, isSameTrip, originalFieldTripId);
				});
			});
		});
	};

	RoutingDisplay.prototype.afterChangeStopPosition = function(tripStop, isSameTrip, originalTripId)
	{
		var self = this;
		var promises = [];
		var oldTrip = self.dataModel.getFieldTripById(originalTripId);
		promises.push(self.resetTripInfo([oldTrip], null, true, false, true).then(function()
		{
			if (!isSameTrip)
			{
				self.refreshAllStopNode(oldTrip);
			}
		}));
		self.addNode(tripStop, isSameTrip);

		if (self.dataModel.showImpactDifferenceChart() && !isSameTrip)
		{
			self.dataModel.refreshOptimizeSequenceRate(oldTrip.id, null, null, true);
		}
		var currentTrip = self.dataModel.getFieldTripById(tripStop.FieldTripId);
		promises.push(self.resetTripInfo([currentTrip], null, true, false, true).then(function()
		{
			if (self.dataModel.showImpactDifferenceChart())
			{
				self.dataModel.refreshOptimizeSequenceRate(currentTrip.id, null, null, true);
			}
			self.refreshAllStopNode(currentTrip);
		}));
		return Promise.all(promises);
	}

	RoutingDisplay.prototype._insertNode = function(tripStopData, tripStopNode, tripNode, tripData, tripStopNodes)
	{
		var self = this;
		tripStopNode.expanded = !!self.expandStatusDictionary['Stop' + tripStopNode.id];
		if (self.routingDisplayHelper.checkNodeWasExpanded(tripNode))
		{
			if (tripStopData.Sequence == 1 || tripStopData.Sequence == tripData.FieldTripStops.length)
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
		var self = this, tripStopNodes,
			trip = self.dataModel.getFieldTripById(tripStop.FieldTripId),
			tripNode = self.routingDisplayHelper.getExpandedTreeNode(tripStop.FieldTripId, 'trip', self.treeview.dataSource);
		
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

		var deleteNode = tripStopNodes.find((oldTripStop) => oldTripStop.id == tripStop.id);
		self.routingDisplayHelper.removeTreeNode(deleteNode, tripNode);
	}

	RoutingDisplay.prototype.addNode = function(tripStop, isSameTrip)
	{
		var self = this;
		var trip = self.dataModel.getFieldTripById(tripStop.FieldTripId);
		var tripStopTreeView = self.newTripStop(tripStop, trip.Session, trip.Name);
		var tripNode = self.routingDisplayHelper.getExpandedTreeNode(tripStop.FieldTripId, 'trip', self.treeview.dataSource);
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
		if (insertPositionSequence != trip.FieldTripStops.length)
		{
			var insertBeforeCurrentTripStop = Enumerable.From(trip.FieldTripStops).FirstOrDefault(null, function(ts)
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

	RoutingDisplay.prototype.resetTripInfo = function(fieldTrips, notReset, clearOptimizeImpact, resetScheduleTime, disableRecalculate)
	{
		const self = this;
		if (fieldTrips === null || fieldTrips === undefined)
		{
			return Promise.resolve(true);
		}

		let promise = Promise.resolve(fieldTrips);
		
		if (!disableRecalculate)
		{
			promise = self.dataModel.recalculate(fieldTrips);
		}

		return promise.then(function(response)
		{
			var fieldTripData = response;
			for (var i = 0; i < fieldTripData.length; i++)
			{
				if (fieldTrips[i].FieldTripStops.length != fieldTripData[i].FieldTripStops.length)
				{
					continue;
				}
				fieldTrips[i].NumTransport = fieldTripData[i].NumTransport;
				fieldTrips[i].MaxOnBus = fieldTripData[i].MaxOnBus;
				fieldTrips[i].Distance = fieldTripData[i].Distance;
				let tripDataTrip = fieldTripData.find(r => r.id == fieldTrips[i].id);
				if (tripDataTrip)
				{
					for (var j = 0; j < fieldTrips[i].FieldTripStops.length; j++)
					{
						let tripDataStop = tripDataTrip.FieldTripStops.find(n => n.id == fieldTrips[i].FieldTripStops[j].id);
						if (!tripDataStop) { continue; }
						fieldTrips[i].FieldTripStops[j].TotalStopTime = tripDataStop.TotalStopTime;
						fieldTrips[i].FieldTripStops[j].Duration = tripDataStop.Duration;
					}
				}
				self.dataModel.setFieldTripActualStopTime([fieldTrips[i]]);
				self.dataModel.setStopTimeForEmptyRecords(fieldTrips[i]);
				if (resetScheduleTime)
				{
					self.dataModel.copyFieldTripStopTimeWithActualTime([fieldTrips[i]]);
				}
				if (!notReset)
				{
					var tripNode = self.treeview.dataSource.getFirst(fieldTrips[i].id, function(data)
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
			return true;
		});
	};

	RoutingDisplay.prototype.initialTreeView = function()
	{
		var self = this;
		var routingtreeview = self.viewModel.$element.find("#routingtreeview");
		routingtreeview.kendoTreeView({
			template: self.routingDisplayHelper.getTreeViewTemplate(),
			dataSource: [],
			dragAndDrop: true,
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

				if (isNullObj(customData) || customData.openType === 'View' || !customData.isStop || customData.isFirst || customData.isLast)
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
					// dragiconSpan.css('background-image', 'url(../../global/thirdparty/kendo/styles/Default/sprite.png)');
					dragiconSpan.css('width', '16px');
				}
				var targetDataItem = e.sender.dataItem($(e.dropTarget)),
					status = e.statusClass;
				if (isNullObj(targetDataItem) || !targetDataItem.customData || targetDataItem.customData.openType === 'View'
				|| ["i-insert-up", "i-insert-down"].includes(status))
				{
					// "i-insert-up", "i-insert-down" in latest kendo treeview these status rename to "i-insert-top", "i-insert-bottom"
					// https://docs.telerik.com/kendo-ui/api/javascript/ui/treeview/events/drag
					var insertIcon = $('#insertRoutingTripTreeIcon');
					if (insertIcon.length > 0) insertIcon.remove();
					e.setStatusClass("k-denied");
					return;
				}

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

						insertIcon.css({
							'background-image': img.replace(/%3Csvg(.*?)%3C\/svg%3E/, iconSVG),
							'position': 'absolute',
							'left': `${(parseInt(left) - 9)}px`,
							'top': `${(parseInt(top) - 11)}px`,
							'z-index': 10000,
							'width': '222px',
							'height': '22px'
						});
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
			drop: function(e)
			{
				self.dropTreeNode(e);
			},
			kendoKeydown: function(e)
			{
				if (e.key === "Escape")
				{
					$('#insertRoutingTripTreeIcon').remove();
				}
			},
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

		routingtreeview.data("kendoTreeView").templates.dragClue = kendo.template("No. #=data.item.customData.sequence?data.item.customData.sequence:''#, #=data.item.text#<div style='padding-left:20px'>Field Trip: #=item.customData.tripName?item.customData.tripName:''#</div>");

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
				stops: data.customData.stops,
				tripTotalTime: data.customData.tripTotalTime,
				tripTotalTimeArray: data.customData.tripTotalTimeArray,
				distance: data.customData.distance,
				measurementUnit: data.customData.measurementUnit,
				startTime: data.customData.startTime,
				endTime: data.customData.endTime,
			}
		}, textInfoNode);
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
			tripCount = self.dataModel.fieldTrips.length,
			tripStopCount = self.dataModel.fieldTrips.reduce((result, trip) => result + trip.FieldTripStops.length, 0);

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
		self.dataModel._getSchoolLocations(self.dataModel.fieldTrips).then(function()
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
		self.dataModel.fieldTripStopDataModel.update([tripStop], true);
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
			var trip = self.dataModel.getFieldTripById(data.customData.tripId);
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
				tripStop = self.dataModel.getFieldTripStopByStopId(data.id);
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

		var $infoButtons = routingtreeview.find(".icon.stop-info");
		$infoButtons.off('click').on('click', infoClick.bind(self));

		var $tripInfoButtons = routingtreeview.find(".icon.trip-info");
		$tripInfoButtons.off('click').on('click', tripInfoClick.bind(self));

		var $tripDeleteButtons = routingtreeview.find(".icon.trip-delete");
		$tripDeleteButtons.off('click').on('click', tripDeleteClick.bind(self));

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
		var tripStop = self.dataModel.getFieldTripStopByStopId(data.id);
		self.dataModel.viewModel.eventsManager.addStopFromSearchResultClick(null, null, null, tripStop);
	}

	function copyTripClick(e)
	{
		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var data = self.treeview.dataItem(e.target.closest('li'));
		var trip = self.dataModel.getFieldTripById(data.id);
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
		var trip = self.dataModel.getFieldTripById(data.id);
		this.eventsManager.closeTripClick(null, null, [trip]);
	}

	function assignStudentClick(e)
	{
		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var data = self.treeview.dataItem(e.target.closest('li'));
		var trip = self.dataModel.getFieldTripById(data.id);
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
						utcToClientTimeZone(self.dataModel.getFieldTripStopTime(lockedTripStop)).format('MM-DD-YYYY h:mm a') + ") will be used to determine the Times. Any manual adjustments to Time will be overwritten. Are you sure you want to continue?",
				title: "Confirmation"
			})
			.then(function(result)
			{
				if (result)
				{
					var trips = [self.dataModel.getFieldTripById(data.id)];

					self.dataModel.setFieldTripActualStopTime(trips);
					self.dataModel.copyFieldTripStopTimeWithActualTime(trips);

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
		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var data = self.treeview.dataItem(e.target.closest('li'));
		if (data.customData.openType === 'View')
		{
			return;
		}

		var tripStop = self.dataModel.getFieldTripStopByStopId(data.id);
		this.eventsManager.setScheduledTimeClick(tripStop).then(function(result)
		{
			if (result.isUpdatedRelatedTime != undefined)
			{
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
							if (result.tripStop.Sequence == 1 || result.tripStop.Sequence == result.trip.FieldTripStops.length)
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

		var tripStop = self.dataModel.getFieldTripStopByStopId(data.id),
			trip = self.dataModel.getFieldTripById(tripStop.FieldTripId),
			generatedPath = self.dataModel.getGeneratedPath(tripStop.id);
		let result = await tf.modalManager.showModal(new TF.RoutingMap.RoutingPalette.DrivingPathModalViewModel(tripStop, trip, generatedPath));
		if (result)
		{
			tripStop.Speed = result.avgSpeed;
			trip.SpeedType = -1;
			let response = await self.dataModel.recalculate([trip]);
			var tripData = response[0];
			for (var j = 0; j < trip.FieldTripStops.length; j++)
			{
				trip.FieldTripStops[j].TotalStopTime = tripData.FieldTripStops[j].TotalStopTime;
				trip.FieldTripStops[j].Duration = tripData.FieldTripStops[j].Duration;
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

		self.dataModel.changeDataStack.push(self.dataModel.getFieldTripStopByStopId(data.id));
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
		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var data = self.treeview.dataItem(e.target.closest('li'));
		var fieldTripStop = self.dataModel.getFieldTripStopByStopId(data.id);
		var trip = self.dataModel.getFieldTripById(fieldTripStop.FieldTripId);

		if (!fieldTripStop)
		{
			return false;
		}
		this.eventsManager.deleteOneClick(fieldTripStop.id, trip.id, e).then(function(result)
		{
			if (result)
			{
				self.dataModel.changeDataStack.push(fieldTripStop);
			}
		});

	}

	function infoClick(e)
	{
		var self = this;
		e.preventDefault();
		e.stopPropagation();
		var data = self.treeview.dataItem(e.target.closest('li'));
		var fieldTripStop = self.dataModel.getFieldTripStopByStopId(data.id);
		this.eventsManager.infoClick(fieldTripStop);
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
			data = this.dataModel.getFieldTripById(data.id);
			type = 'fieldtrip';
		}
		else if (data.level() == 1)
		{
			type = 'fieldTripStop';
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
			if (!changeTripIds[d.FieldTripId])
			{
				changeTripIds[d.FieldTripId] = true;
			}
		});
		for (var changeTripId in changeTripIds)
		{
			var trip = self.dataModel.getFieldTripById(changeTripId);
			self.resetTripInfo([trip], null, null, data.options ? data.options.resetScheduleTime : null);
			self.refreshAllStopNode(trip);
		}
	}

	RoutingDisplay.prototype._addTripStop = function(tripStop)
	{
		var self = this;
		var trip = self.dataModel.getFieldTripById(tripStop.FieldTripId);

		var tripStopTreeViewNode = self.newTripStop(tripStop, self.routingDisplayHelper.getTripType(), trip.Name);
		var tripNode = self.routingDisplayHelper.getExpandedTreeNode(tripStop.FieldTripId, 'trip', self.treeview.dataSource);
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
	};

	RoutingDisplay.prototype._editTripStop = function(tripStop)
	{
		var self = this;
		var tripNode = self.routingDisplayHelper.getExpandedTreeNode(tripStop.FieldTripId, 'trip', self.treeview.dataSource);
		if (!tripNode)
		{
			return;
		}

		var tripWasExpanded = self.routingDisplayHelper.checkNodeWasExpanded(tripNode);
		var tripStopNode = self.routingDisplayHelper.getTreeNodeFromParentNode(tripStop.id, tripNode, 'tripstop');

		if (tripWasExpanded)
		{
			var changedTripStop = self.treeview.findByUid(tripStopNode.uid);
			self.setTripStopNodeProperty(tripStopNode, changedTripStop);
		}
		else
		{
			self.routingDisplayHelper.resetUnexpandedTreeNodeValue(tripStopNode, tripStop);
		}
	}

	RoutingDisplay.prototype._deleteTripStop = function(tripStop)
	{
		var self = this;
		var trip = self.dataModel.getFieldTripById(tripStop.FieldTripId);

		var tripNode = self.routingDisplayHelper.getExpandedTreeNode(tripStop.FieldTripId, 'trip', self.treeview.dataSource);
		var tripWasExpanded = self.routingDisplayHelper.checkNodeWasExpanded(tripNode);
		var newLockStopId;
		if (tripStop.LockStopTime && trip.FieldTripStops.length > 0)
		{
			if (trip.FieldTripStops[0].id != tripStop.id)
			{
				self.dataModel.setLockTime(trip.FieldTripStops[0].id, trip.id);
				newLockStopId = trip.FieldTripStops[0].id;
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

	RoutingDisplay.prototype.refreshAllStopNode = function(trip, onlyAffectSchool)
	{
		var self = this;
		trip.FieldTripStops.map(function(tripStop)
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
		var self = this;
		var currentMissionId = TF.generateUUID();
		self.updateMissionDictionary[tripStop.id] = currentMissionId;
		var tripNode = self.routingDisplayHelper.getExpandedTreeNode(tripStop.FieldTripId, 'trip', self.treeview.dataSource);
		var tripWasExpanded = self.routingDisplayHelper.checkNodeWasExpanded(tripNode);
		var tripStopNode = self.routingDisplayHelper.getTreeNodeFromParentNode(tripStop.id, tripNode, 'tripstop');

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
	}

	RoutingDisplay.prototype.setTripStopNodeProperty = function(nodeData, nodeElement, onlyAffectCurrentNode)
	{
		var self = this;
		if (nodeData.customData.isStop)
		{
			var tripStopData = self.dataModel.getFieldTripStop(nodeData.id, nodeData.customData.tripId);
			if (isNullObj(tripStopData))
			{
				return;
			}

			var trip = self.dataModel.getFieldTripById(nodeData.customData.tripId),
				isLast = tripStopData.PrimaryDestination;
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
			if (tripStopData && self.dataModel.getFieldTripStopTime(tripStopData))
			{
				nodeData.set('customData.stopTime', self.dataModel.getFieldTripStopTime(tripStopData));
			}
			if (tripStopData && tripStopData.Duration)
			{
				nodeData.set('customData.duration', TF.RoutingMap.RoutingPalette.RoutingDisplayHelper.durationToString(tripStopData.Duration));
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
			self.routingDisplayHelper.fixStopLineStyle(nodeData, nodeElement);
			
			nodeElement.find(".icon.stop-delete").off('click').on('click', deleteClick.bind(self));
			nodeElement.find(".icon.stop-info").off('click').on('click', infoClick.bind(self));
			nodeElement.find(".icon.copyStop").off('click').on('click', copyStopClick.bind(self));
			nodeElement.find(".icon.zoom-map-to-layers").off('click').on('click', zoomClick.bind(self));
			nodeElement.find('.schedule-time').off('click').on('click', scheduledTimeClick.bind(self));
			nodeElement.find('.avg-speed').off('click').on('click', avgSpeedClick.bind(self));
			nodeElement.find('.icon.lock-time').off('click').on('click', setLockTimeClick.bind(self));

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
			var tripData = self.dataModel.getFieldTripById(nodeData.id);
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
			tripData.NumTransport = 0;
			tripData.Distance = totalDistance;

			var tripTotalTime = self.getDurationForFieldTrip(tripData);
			nodeData.set('visible', tripData.visible);
			nodeData.set('id', tripData.id);
			nodeData.set('text', tripData.Name);
			nodeData.set('customData.students', tripData.NumTransport);
			nodeData.set('customData.actualStartTime', tripData.ActualStartTime);
			nodeData.set('customData.actualEndTime', tripData.ActualEndTime);
			nodeData.set('customData.color', tripData.color);
			nodeData.set('customData.stops', tripData.FieldTripStops.length);
			nodeData.set('customData.distance', self.convertToCurrentMeasurementUnit(totalDistance).toFixed(2));
			nodeData.set('customData.startTime', self.getStartTimeForFieldTrip(tripData));
			nodeData.set('customData.endTime', self.getEndTimeForFieldTrip(tripData));
			nodeData.set('customData.tripTotalTime', tripTotalTime);
			nodeData.set('customData.tripTotalTimeArray', self.momentHelper.minsToDDHHMM(tripTotalTime));

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

	RoutingDisplay.prototype.speedToString = function(speed)
	{
		const self = this;
		return `${(speed ? self.convertToCurrentMeasurementUnit(speed).toLocaleString(undefined, { maximumFractionDigits: 2 }) : 0)} ${(self.isImperialUnit ? "mph" : "kph")}`;
	}

	RoutingDisplay.prototype.newTripStop = function(tripStop, session, tripName)
	{
		var self = this,
			isFirst = tripStop.PrimaryDeparture,
			isLast = tripStop.PrimaryDestination;
		return {
			id: tripStop.id,
			text: tripStop.Street,
			expand: false,
			expanded: !!self.expandStatusDictionary['Stop' + tripStop.id],
			customData: {
				totalStudentCount: tripStop.TotalStudentCount,
				assignedStudentCount: tripStop.AssignedStudentCount,
				transToTrans: tripStop.TransToTrans,
				puTransToSchool: tripStop.PUTransToSchool,
				doTransToSchool: tripStop.DOTransToSchool,
				isLast,
				isFirst,
				duration: TF.RoutingMap.RoutingPalette.RoutingDisplayHelper.durationToString(tripStop.Duration),
				avgSpeed: self.speedToString(tripStop.Speed),
				stopTime: self.dataModel.getFieldTripStopTime(tripStop),
				sequence: tripStop.Sequence,
				geometry: tripStop.geometry,
				schoolCode: tripStop.SchoolCode,
				tripId: tripStop.FieldTripId,
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
	};

	RoutingDisplay.prototype.tripStopDeletable = function(tripStop)
	{
		return !(tripStop.PrimaryDeparture || tripStop.PrimaryDestination);
	};

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
			data = self.dataModel.getFieldTripById(data.id);
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
		function sortRiders(fieldTrips)
		{
			fieldTrips.forEach(fieldTrip =>
			{
				fieldTrip.items.forEach(fieldTripStop =>
				{
					fieldTripStop.items = fieldTripStop.items.sort((riderA, riderB) =>
					{
						const v1 = riderA.customData.sortValue && riderA.customData.sortValue.toLowerCase();
						const v2 = riderA.customData.sortValue && riderB.customData.sortValue.toLowerCase();
						return v1 > v2 ? 1 : (v1 < v2 ? -1 : 0);
					});
				})
			})
		}

		function compareFieldTrip(a, b)
		{
			const v1 = a.text && a.text.toLowerCase();
			const v2 = b.text && b.text.toLowerCase();
			if(v1 === v2)
			{
				return a.id > b.id ? 1: -1;
			}
			return v1 > v2 ? 1 : -1;
		}

		function insertFieldTrip2TreeView(insertingList)
		{
			insertingList.forEach(function(fieldTrip)
			{
				for (var i = 0; i < treeview.dataSource._data.length; i++)
				{
					if (compareFieldTrip(fieldTrip, treeview.dataSource._data[i]) === -1)
					{
						return treeview.insertBefore(fieldTrip, treeview.findByUid(treeview.dataSource._data[i].uid));
					}
				}
				treeview.append(fieldTrip);
			});
		}

		if (data.add.length > 0)
		{
			const newAddList = data.add.map((fieldTrip)=>self.newFieldTripData(fieldTrip));
			newAddList.sort(compareFieldTrip);
			sortRiders(newAddList);
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
				insertFieldTrip2TreeView(newAddList);
			}
			else
			{
				treeview.setDataSource(homogeneous);
			}
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
			});
		}
		if (data.edit.length > 0)
		{
			promise = self.resetTripInfo(data.edit, true).then(function()
			{
				const editingList = [];
				data.edit.forEach(function(fieldTrip)
				{
					var deleteTrip = self.routingDisplayHelper.getTripNodeById(fieldTrip);
					if (deleteTrip.length > 0)
					{
						const deletingDom = Array.from(treeview.element.find("ul > li")).find(el => $(el).data("kendoUid") === deleteTrip[0].uid);
						treeview.remove(treeview.findByUid(deleteTrip[0].uid));
						self.cleanRemovedTreeViewItem(deletingDom, deleteTrip[0]);
					}
					if (self.dataModel.fieldTrips.some(i => i.Name === fieldTrip.Name))
					{
						let newTrip = self.newFieldTripData(fieldTrip);
						editingList.push(newTrip);
					}
				});
				// self.refreshNextTripData(editingList);
				editingList.sort(compareFieldTrip);
				sortRiders(editingList);
				var homogeneous = new kendo.data.HierarchicalDataSource({
					data: editingList,
					sort: { field: "customData.sortValue", dir: "asc" }
				});
				if (treeview.dataSource._data && treeview.dataSource._data.length > 0)
				{
					insertFieldTrip2TreeView(editingList);
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

		const tripTotalTime = self.getDurationForFieldTrip(trip);

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
				stops: trip.FieldTripStops.length,
				tripTotalTime: tripTotalTime,
				tripTotalTimeArray: self.momentHelper.minsToDDHHMM(tripTotalTime),
				distance: self.getDistanceForFieldTrip(trip),
				measurementUnit: tf.measurementUnitConverter.getShortUnits(),
				startTime: self.getStartTimeForFieldTrip(trip),
				endTime: self.getEndTimeForFieldTrip(trip),
				actualStartTime: trip.ActualStartTime,
				actualEndTime: trip.ActualEndTime,
				color: trip.color,
				sortValue: trip.Name,
				openType: trip.OpenType,
				isTrip: true,
			},
			items: self.newFieldTripStopData(trip.FieldTripStops, trip)
		};
	}

	RoutingDisplay.prototype.getStartTimeForFieldTrip = function(fieldTrip)
	{
		const firstStop = fieldTrip.FieldTripStops.reduce((min, val) => min.Sequence < val.Sequence ? min : val);
		return firstStop?.StopTimeDepart;
	}

	RoutingDisplay.prototype.getEndTimeForFieldTrip = function(fieldTrip)
	{
		const lastStop = fieldTrip.FieldTripStops.reduce((max, val) => max.Sequence > val.Sequence ? max : val);
		return lastStop?.StopTimeArrive;
	}

	RoutingDisplay.prototype.getDurationForFieldTrip = function(fieldTrip)
	{
		if(fieldTrip.FieldTripStops.length < 2)
		{
			return 0;
		}

		let firstStop = fieldTrip.FieldTripStops.reduce((min, val) => min.Sequence < val.Sequence ? min : val);
		let lastStop  = fieldTrip.FieldTripStops.reduce((max, val) => max.Sequence > val.Sequence ? max : val);

		if (!firstStop.StopTimeDepart || !lastStop.StopTimeArrive)
		{
			return 0;
		}

		let minutes = Math.ceil(moment.duration(moment(lastStop.StopTimeArrive).diff(moment(firstStop.StopTimeDepart))).asMinutes());

		return minutes;
	}

	RoutingDisplay.prototype.getDistanceForFieldTrip = function(fieldTrip)
	{
		let distance = 0;

		fieldTrip.FieldTripStops.forEach((stop) => distance += stop.Distance);

		return this.convertToCurrentMeasurementUnit(distance).toFixed(2);
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

	RoutingDisplay.prototype.newFieldTripStopData = function(tripStops, fieldTrip)
	{
		var self = this, {Session:session, Name: tripName} = fieldTrip;
		var result = [];
		function setFieldTripStops(tripStop)
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
				setFieldTripStops(tripStopTemp);
			}
		}
		else
		{
			for (var j = tslength - 1; j > -1; j--)
			{
				var tripStopTemp = $.extend(true, {}, tripStops[j]);
				setFieldTripStops(tripStopTemp);
			}
			result = result.reverse();
		}

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
				self.refreshAllStopNode(trip);
			});
		}
	}

	RoutingDisplay.prototype.onTripTreeColorChange = function(e, data)
	{
		var self = this;
		if (data && data.FieldTripId)
		{
			let tripNode = self.routingDisplayHelper.getExpandedTreeNode(data.FieldTripId, 'trip', self.treeview.dataSource);
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

		tf.loadingIndicator.showImmediately();
		if (self.isInitial)
		{
			self.initialTreeView();
		}
		// self.recalculateAllSchoolStudentCount(data.add.concat(data.edit));
		Promise.resolve(self.getDataSource(data)).then(function()
		{
			self.afterDataSourceBinding(data);
			PubSub.publish(TF.RoutingPalette.FieldTripMapEventEnum.Change, {...data, onCompleted: ()=> tf.loadingIndicator.tryHide() });
		});
	}

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
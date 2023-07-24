(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingDisplayHelper = RoutingDisplayHelper;
	function RoutingDisplayHelper(routingDisplay)
	{
		this.routingDisplay = routingDisplay;
	}

	RoutingDisplayHelper.prototype.tripType = { ToSchool: 0, FromSchool: 1, MidDay: 3 };

	RoutingDisplayHelper.prototype.StopStyle = { 'top': 0, 'middle': 1, 'bottom': 2, 'one': 3 };

	RoutingDisplayHelper.prototype.addTreeNode = function(node, parentNode, nodeType, currentMissionId)
	{
		var self = this, promise = Promise.resolve(true);
		if (self.checkNodeWasExpanded(parentNode))
		{
			if (nodeType == 'student')
			{
				return promise.then(function()
				{
					if (currentMissionId !== null && currentMissionId !== undefined && currentMissionId != self.routingDisplay.updateMissionDictionary[parentNode.id])
					{
						return;
					}
				});
			}
		}
		else
		{
			self.addNodeDataOnDemand([node], parentNode);
			return promise;
		}
	};

	RoutingDisplayHelper.prototype.addNodeDataOnDemand = function(newNodeDataArray, parentNode)
	{
		newNodeDataArray.map((newNodeData) =>
		{
			if (!parentNode.children)
			{
				parentNode.items.push(newNodeData);
			}
			else
			{
				var unexpanedSourceLength = parentNode.children.options ? parentNode.children.options.data.items.length : 0;
				var expandedSourceLength = parentNode.items.length;
				if (expandedSourceLength < unexpanedSourceLength)
				{
					parentNode.children.options.data.items.push(newNodeData);
				}
				else if (expandedSourceLength > unexpanedSourceLength)
				{
					parentNode.items.push(newNodeData);
				}
				else
				{
					var parentNodeElement = this.routingDisplay.treeview.element.find("[data-kendo-uid='" + parentNode.uid + "']");
					var expanded = parentNode.expanded;
					this.routingDisplay.treeview.append(newNodeData, parentNodeElement);
					if (!expanded)
					{
						// treeView append will expand the node, change the expand status to original status
						this.routingDisplay.treeview._expanded(parentNodeElement, false, true);
					}
				}
			}
		});
	}

	RoutingDisplayHelper.prototype.checkNodeWasExpanded = function(node)
	{
		var self = this;
		if (!node || !node.uid)
		{
			return false;
		}
		else if (node.expanded)
		{
			return true;
		}
		var nodeElement = self.routingDisplay.treeview.findByUid(node.uid);
		if (nodeElement)
		{
			var expandChildrenElement = nodeElement.find('li.k-item');
			if (expandChildrenElement.length > 0)
			{
				return true;
			}
		}
		return false;
	}

	RoutingDisplayHelper.prototype.removeTreeNode = function(node, parentNode)
	{
		var self = this;

		function checkItem(obj, index)
		{
			if (obj.customData && obj.customData.requirementId)
			{
				if (obj.customData.requirementId == node.customData.requirementId)
				{
					return index;
				}
			} else if (obj.id == node.id)
			{
				return index;
			}
		}

		if (node)
		{
			if (self.checkNodeWasExpanded(parentNode))
			{
				self.routingDisplay.treeview.remove(self.routingDisplay.treeview.findByUid(node.uid));
				// fix remove element but not remove prepare data
				if (parentNode.children)
				{
					var indexes = $.map(parentNode.children.options.data.items, checkItem);
					if (indexes && indexes.length > 0)
					{
						parentNode.children.options.data.items.splice(indexes[0], 1);
					}
				}
			}
			else
			{
				if (parentNode.children && parentNode.children.options)
				{
					var indexes = $.map(parentNode.children.options.data.items, checkItem);
					if (indexes && indexes.length > 0)
					{
						parentNode.children.options.data.items.splice(indexes[0], 1);
					}
				}

				var indexes = $.map(parentNode.items, checkItem);
				if (indexes && indexes.length > 0)
				{
					parentNode.items.splice(indexes[0], 1);
				}
			}
		}
	}

	RoutingDisplayHelper.prototype.getTreeNodeFromParentNode = function(id, parentNode, nodeType, requirementId, tripStopId, previousScheduleID)
	{
		var node, self = this;
		if (parentNode === null || parentNode === undefined)
		{
			return null;
		}

		if (self.checkNodeWasExpanded(parentNode))
		{
			node = parentNode.children.getFirst(id, function(data)
			{
				return data.customData && (nodeType == 'tripstop' ? data.customData.isStop : (data.customData.isStudent && data.customData.previousScheduleID == previousScheduleID && data.customData.requirementId == requirementId && (!tripStopId || data.customData.tripStopId == tripStopId)));
			});
		}
		else
		{
			var nodes = parentNode.items.length > 0 ? parentNode.items : (parentNode.children && parentNode.children.options ? parentNode.children.options.data.items : parentNode.items);
			node = Enumerable.From(nodes).FirstOrDefault(null, function(p)
			{
				return p && p.id == id && (((p.customData.requirementId == requirementId && p.customData.previousScheduleID == previousScheduleID) && (p.nodeType == 'student') && (!tripStopId || p.customData.tripStopId == tripStopId)) || (p.nodeType != 'student'));
			});
		}
		return node;
	}

	RoutingDisplayHelper.prototype.getAllTreeNodeFromParentNode = function(parentNode)
	{
		var nodes, self = this;
		if (self.checkNodeWasExpanded(parentNode))
		{
			nodes = parentNode.children._data;
		}
		else
		{
			nodes = parentNode.items.length > 0 ? parentNode.items : ((parentNode.children && parentNode.children.options) ? parentNode.children.options.data.items : parentNode.items);
		}
		return nodes;
	};

	RoutingDisplayHelper.prototype.getTripType = function()
	{
		var editTrips = this.routingDisplay.dataModel.getEditTrips();
		if (editTrips.length > 0)
		{
			return editTrips[0].Session;
		}
	}

	RoutingDisplayHelper.prototype.getExpandedTreeNode = function(id, nodeType, dataSource)
	{
		return dataSource.getFirst(id, function(data)
		{
			return data.customData && (nodeType == 'trip' ? data.customData.isTrip : (nodeType == 'tripstop' ? data.customData.isStop : data.customData.isStudent));
		});
	}

	RoutingDisplayHelper.prototype.drawOptimizeInfo = function(element, percent, title, number)
	{
		function drawCircle(element, percent, text, title, number)
		{
			var c = element[0];
			var ctx = c.getContext("2d");

			ctx.clearRect(0, 0, c.width, c.height);

			var radius = 38;
			var ox = 50, oy = c.height / 2 - 2;

			ctx.fillStyle = "lightgray";
			ctx.beginPath();
			ctx.moveTo(ox, oy);
			ctx.arc(ox, oy, radius, 0, 2 * Math.PI, false);
			ctx.closePath();
			ctx.fill();

			ctx.fillStyle = percent >= 0 ? "#399A14" : "#333333";
			ctx.beginPath();
			ctx.moveTo(ox, oy);
			if (Math.abs(percent) > 1)
			{
				percent = percent / Math.abs(percent) * 0.9999;
			}
			ctx.arc(ox, oy, radius, 1.5 * Math.PI, (1.5 + Math.abs(percent) * 2) % 2 * Math.PI, false);
			ctx.closePath();
			ctx.fill();

			ctx.fillStyle = "#FFFFFF";
			ctx.beginPath();
			ctx.moveTo(ox, oy);
			ctx.arc(ox, oy, radius - 15, 0, 2 * Math.PI, false);
			ctx.closePath();
			ctx.fill();

			ctx.fillStyle = percent >= 0 ? "#399A14" : "#333333";
			ctx.font = '13px Arial';
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText(text, ox, oy);

			ctx.fillStyle = "#333333";
			ctx.textAlign = "left";
			ctx.font = 'bold 13px Arial';
			ctx.fillText(title, ox + 42, oy - 10);

			ctx.fillStyle = percent >= 0 ? "#399A14" : "#333333";
			ctx.textAlign = "left";
			ctx.font = '12px Arial';
			ctx.fillText(number, ox + 42, oy + 10);
		}

		//params
		var text = (percent != '-999' && percent != 'N/A') ? (percent + '%') : 'N/A';
		percent = (percent != '-999' && percent != 'N/A') ? (percent / 100) : (percent == 'N/A' ? -0.9999 : 0);

		drawCircle(element, percent, text, title, number);
	};

	RoutingDisplayHelper.prototype.getTripNodeById = function(trip)
	{
		if (this.routingDisplay.treeview)
		{
			return this.routingDisplay.treeview.dataItems().filter(function(item)
			{
				return item.id == trip.id || item.id == trip.oldId;
			});
		}
		return [];
	}

	RoutingDisplayHelper.prototype.getFontColor = function(color)
	{
		return RoutingDisplayHelper.getFontColor(color);
	};

	RoutingDisplayHelper.getFontColor = function(color)
	{
		return TF.isLightness(color) ? '#333333' : '#ffffff'
	};

	RoutingDisplayHelper.durationToString = function(text)
	{
		return text.startsWith("0") ? text.substring(1, text.length) : text;
	}

	RoutingDisplayHelper.prototype.resetUnexpandedTreeNodeValue = function(node, data)
	{
		const self = this;
		function handleSpecialProperty(node, property, data)
		{
			var result = true;
			if (property.toLowerCase() == 'triptotaltime')
			{
				node.customData[property] = convertToMoment(data.FinishTime).diff(convertToMoment(data.StartTime), 'minutes');
			}
			else if (property.toLowerCase() == 'numtransport')
			{
				node.customData[property] = data.NumTransport;
			}
			else if (property.toLowerCase() == 'stops')
			{
				node.customData[property] = data.FieldTripStops.length;
			}
			else if (property.toLowerCase() == 'distance')
			{
				node.customData[property] = parseFloat(self.convertToCurrentMeasurementUnit(data.Distance)).toFixed(2);
			}
			else if(property.toLowerCase() == 'avgspeed')
			{
				node.customData[property] = self.routingDisplay.speedToString(data.Speed);
			}
			else if (property.toLowerCase() == 'starttime')
			{
				node.customData[property] = convertToMoment(data.StartTime).format('h:mm a');
			}
			else if (property.toLowerCase() == 'endtime')
			{
				node.customData[property] = convertToMoment(data.FinishTime).format('h:mm a');
			}
			else if (property.toLowerCase() == 'stopTime'.toLowerCase())
			{
				node.customData[property] = data.StopTimeArrive || data.StopTimeDepart;
			}
			else if (property.toLowerCase() == 'duration')
			{
				node.customData[property] = TF.RoutingMap.RoutingPalette.RoutingDisplayHelper.durationToString(data.Duration);
			}
			else if (property.toLowerCase() == 'isvalid')
			{
				node.customData[property] = data.IsAssigned ? !!data.IsValid : true;
			}
			else if (property.toLowerCase() == 'loadtime')
			{
				// remove later
			}
			else if (property.toLowerCase() == 'totalTime')
			{
				node.customData[property] = data.TotalTime.toFixed(2);
			}
			else if (property.toLowerCase() == 'walktostopdistance')
			{
				node.customData[property] = data.IsAssigned && data.WalkToStopDistance != null ? parseFloat(self.convertToCurrentMeasurementUnit(data.WalkToStopDistance || 0)).toFixed(2) : "--";
			}
			else if (property.toLowerCase() == 'walktostopdistancewarning')
			{
				node.customData[property] = !!data.WalkToStopDistanceWarning;
			}
			else
			{
				result = false;
			}
			return result;
		}

		node.id = data.id;
		if (node.customData.isStop)
		{
			node.text = data.Street;
			node.customData.sortValue = data.Sequence;
		}
		else if (node.customData.isStudent)
		{
			node.text = data.FirstName + ' ' + data.LastName;

			var student = data;
			if (student)
			{
				var nowDayCheckList = [!!student.Monday, !!student.Tuesday, !!student.Wednesday, !!student.Thursday, !!student.Friday, !!student.Saturday, !!student.Sunday]
				node.customData.dayCheckList = nowDayCheckList;

				var nowDayDisableList = [];
				if (self.filterArray(node.customData.dayCheckList, true).length == 1)
				{
					nowDayDisableList = node.customData.dayCheckList.map(function(value, index)
					{
						return value || node.customData.initDayUncheckableList[index];
					});
				}
				else
				{
					nowDayDisableList = node.customData.initDayUncheckableList.map(function(value)
					{
						return value;
					});
				}
				node.customData.dayDisableList = nowDayDisableList;
			}
		}

		for (var p in node.customData)
		{
			if (node.customData.hasOwnProperty(p))
			{
				var result = handleSpecialProperty(node, p, data);
				if (result)
				{
					continue;
				}
				for (var property in data)
				{
					if (data.hasOwnProperty(property))
					{
						if (property.toLowerCase() == p.toLowerCase())
						{
							node.customData[p] = data[property];
							break;
						}
					}
				}
			}
		}
	}

	RoutingDisplayHelper.prototype.convertToCurrentMeasurementUnit = function(value)
	{
		const self = this;
		if (!tf.measurementUnitConverter.isImperial())
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

	RoutingDisplayHelper.prototype.updateUnexpandedTripNode = function(tripNode, trip)
	{
		var self = this;
		var stopNodes = tripNode.items.length > 0 ? tripNode.items : ((tripNode.children && tripNode.children.options) ? tripNode.children.options.data.items : tripNode.items);
		stopNodes.map(function(tripStopNode)
		{
			var tripStopData = Enumerable.From(trip.FieldTripStops).FirstOrDefault(null, function(p)
			{
				if (!tripStopNode)
				{
					return false;
				}
				return p.id == tripStopNode.id;
			});
			if (tripStopData)
			{
				self.resetUnexpandedTreeNodeValue(tripStopNode, tripStopData);
				var studentNodes = tripStopNode.items.length > 0 ? tripStopNode.items : ((tripStopNode.children && tripStopNode.children.options) ? tripStopNode.children.options.data.items : tripStopNode.items);
				studentNodes.map(function(studentNode)
				{
					var studentData = Enumerable.From(tripStopData.Students).FirstOrDefault(null, function(p)
					{
						return p.id == studentNode.id;
					});
					if (studentData)
					{
						self.resetUnexpandedTreeNodeValue(studentNode, studentData);
					}
				});
			}
		});
	}

	RoutingDisplayHelper.prototype.toggleLastStopStyle = function(tripStopNode, isExpand)
	{
		var img = $(tripStopNode).css('background-image');
		var color = img.match(/%23([0-9A-Fa-f]{6})/)[0];
		var replaceString = "%3C/circle%3E%3Cpath d='M15 100L15 180' stroke='" + color + "' fill='none' stroke-width='1'%3E%3C/path%3E";
		if (isExpand && $(tripStopNode).css('background-image').indexOf(replaceString) < 0)
		{
			$(tripStopNode).css('background-image',
				img.replace('%3C/circle%3E', replaceString));
		}
		else
		{
			$(tripStopNode).css('background-image',
				img.replace(replaceString, '%3C/circle%3E'));
		}
	}

	RoutingDisplayHelper.prototype.getInsertPosition = function(position, source, target, isSameTrip, tripStop, destTrip)
	{
		if (target.customData.isTrip && position == "over")
		{


			if (!target.items || target.items.length == 0)
			{
				return Promise.resolve(0);
			}
			else if (isSameTrip)
			{
				return Promise.resolve(target.items.length - 1);
			} else
			{
				return this.routingDisplay.dataModel.calculateTripStopSequence(destTrip, tripStop).then(function(sequence)
				{
					return sequence - 1;
				});
			}
		}
		else if (target.customData.isStop)
		{



			if (position == "before")
			{
				if (isSameTrip && source.customData.sequence < target.customData.sequence)
				{
					return Promise.resolve(target.customData.sequence - 2);
				}
				else
				{
					return Promise.resolve(target.customData.sequence - 1);
				}
			}
			else if (position == "after")
			{
				if (isSameTrip && source.customData.sequence < target.customData.sequence)
				{
					return Promise.resolve(target.customData.sequence - 1);
				}
				else
				{
					return Promise.resolve(target.customData.sequence);
				}
			}
		}
		return Promise.resolve(-1);
	};

	RoutingDisplayHelper.prototype.getSingleOrMultiple = function(count, unit)
	{
		if (count == 1)
		{
			return unit;
		}
		else
		{
			return unit + 's';
		}
	}

	RoutingDisplayHelper.prototype.filterArray = function(array, value)
	{
		return array.filter(function(element)
		{
			return element === value;
		});
	}

	RoutingDisplayHelper.prototype.isSchoolStopNode = function(node)
	{
		if (!IsEmptyString(node.customData.SchoolCode))
		{
			return true;
		}
		return false;
	}

	RoutingDisplayHelper.prototype.fixStopLineStyle = function(stopNodeData, stopNodeElement)
	{
		let stopElement = $(stopNodeElement).find('.sequence-line'), stopStyle = this.StopStyle.middle, parent = stopNodeData.parent();
		if (parent.length == 1)
		{
			stopStyle = this.StopStyle.one;
		}
		else if (parent.length && parent.indexOf(stopNodeData) === 0)
		{
			stopStyle = this.StopStyle.top;
		}
		else if (parent.length && parent.indexOf(stopNodeData) === parent.length - 1)
		{
			let treeNode = this.getAllTreeNodeFromParentNode(stopNodeData);
			stopStyle = treeNode && treeNode.length && stopNodeData.expanded ? this.StopStyle.middle : this.StopStyle.bottom;
		}

		this.resetStopStyle(stopElement, stopStyle);
	};

	RoutingDisplayHelper.prototype.resetStopStyle = function(tripStopNode, newStyle)
	{
		var self = this;
		var img = $(tripStopNode).css('background-image');
		var color = img.match(/%23([0-9A-Fa-f]{6})/)[0];
		$(tripStopNode).css('color', self.getFontColor(color.replace('%23', '#')));
		var insteadOfMidString = "%3Csvg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none' viewbox='0 0 30 180' width='30' height='180'%3E%3Cpath d='M15 0L15 80' stroke='" + color + "' fill='none' stroke-width='1'%3E%3C/path%3E %3Ccircle cx='15' cy='90' r='13' stroke='" + color + "' fill='" + color + "' stroke-width='1'%3E%3C/circle%3E%3Cpath d='M15 100L15 180' stroke='" + color + "' fill='none' stroke-width='1'%3E%3C/path%3E%3Ccircle cx='15' cy='90' r='14' stroke='%23000000' stroke-width='2' fill='none'%3E%3C/circle%3E%3C/svg%3E";
		var insteadOfTopString = "%3Csvg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none' viewbox='0 0 30 180' width='30' height='180'%3E%3Cpath d='M15 100L15 180' stroke='" + color + "' fill='none' stroke-width='1'%3E%3C/path%3E %3Ccircle cx='15' cy='90' r='13' stroke='" + color + "' fill='" + color + "' stroke-width='1'%3E%3C/circle%3E%3Ccircle cx='15' cy='90' r='14' stroke='%23000000' stroke-width='2' fill='none'%3E%3C/circle%3E%3C/svg%3E";
		var insteadOfBotString = "%3Csvg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none' viewbox='0 0 30 180' width='30' height='180'%3E%3Cpath d='M15 0L15 80' stroke='" + color + "' fill='none' stroke-width='1'%3E%3C/path%3E %3Ccircle cx='15' cy='90' r='13' stroke='" + color + "' fill='" + color + "' stroke-width='1'%3E%3C/circle%3E%3Ccircle cx='15' cy='90' r='14' stroke='%23000000' stroke-width='2' fill='none'%3E%3C/circle%3E%3C/svg%3E";
		var insteadOfOneString = "%3Csvg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none' viewbox='0 0 30 180' width='30' height='180'%3E%3Ccircle cx='15' cy='90' r='13' stroke='" + color + "' fill='" + color + "' stroke-width='1'%3E%3C/circle%3E%3Ccircle cx='15' cy='90' r='14' stroke='%23000000' stroke-width='2' fill='none'%3E%3C/circle%3E%3C/svg%3E";
		if (newStyle == self.StopStyle.top)
		{
			$(tripStopNode).css('background-image',
				img.replace(/%3Csvg(.*?)%3C\/svg%3E/, insteadOfTopString));
		}
		else if (newStyle == self.StopStyle.middle)
		{
			$(tripStopNode).css('background-image',
				img.replace(/%3Csvg(.*?)%3C\/svg%3E/, insteadOfMidString));
		}
		else if (newStyle == self.StopStyle.bottom)
		{
			$(tripStopNode).css('background-image',
				img.replace(/%3Csvg(.*?)%3C\/svg%3E/, insteadOfBotString));
		}
		else if (newStyle == self.StopStyle.one)
		{
			$(tripStopNode).css('background-image',
				img.replace(/%3Csvg(.*?)%3C\/svg%3E/, insteadOfOneString));
		}
	}

	RoutingDisplayHelper.prototype.setSequenceLineColor = function(color, node, nodeType)
	{
		var self = this;
		var $tripColor = $(node).find('.trip-color');
		$tripColor.css('background-color', color);
		$tripColor.closest('.trip-text-info').find('.k-selected-color').css('background-color', color);
		var tripStopNodes = $(node).find('.sequence-line');
		if (nodeType == 'trip' && tripStopNodes.length == 1)
		{
			self.resetStopStyle(tripStopNodes[0], self.StopStyle.one);
		}
		if (nodeType == 'trip' || nodeType == 'tripStop')
		{
			tripStopNodes.map(function(index, tripStopNode)
			{
				$(tripStopNode).css('color', self.getFontColor(color));
				var svgColor = color.replace('#', '%23');
				var img = $(tripStopNode).css('background-image');
				$(tripStopNode).css('background-image',
					img.replace(/stroke='%23([0-9A-Fa-f]{6})'\s*fill='%23([0-9A-Fa-f]{6})'/g, "stroke='" + svgColor + "' fill='" + svgColor + "'")
						.replace(/stroke='%23([0-9A-Fa-f]{6})'\s*fill='none'/g, "stroke='" + svgColor + "' fill='none'"));
			});
		}
		if (nodeType == 'trip' || nodeType == 'tripStop' || nodeType == 'student')
		{
			var studentNodes = $(node).find('.sequence-line-line');
			var svgColor = color.replace('#', '%23');
			studentNodes.map(function(index, studentNode)
			{
				var img = $(studentNode).css('background-image');
				$(studentNode).css('background-image',
					img.replace(/stroke='%23([0-9A-Fa-f]{6})'\s*fill='\%23([0-9A-Fa-f]{6})'/g, "stroke='" + svgColor + "' fill='" + svgColor + "'")
						.replace(/stroke='%23([0-9A-Fa-f]{6})'\s*fill='none'/g, "stroke='" + svgColor + "' fill='none'"));
			});
		}
	}

	RoutingDisplayHelper.prototype.updateExpandedDictionary = function(nodeData, isExpand)
	{
		let self = this;
		if (isExpand)
		{
			if (nodeData.customData.isStop)
			{
				self.routingDisplay.expandStatusDictionary["Stop" + nodeData.id] = true;
			}
			else if (nodeData.customData.isStudent)
			{
				self.routingDisplay.expandStatusDictionary["Student" + nodeData.id] = true;
			}
			else
			{
				self.routingDisplay.expandStatusDictionary["Trip" + nodeData.id] = true;
			}
		}
		else
		{
			if (nodeData.customData.isStop)
			{
				delete self.routingDisplay.expandStatusDictionary["Stop" + nodeData.id];
			}
			else if (nodeData.customData.isStudent)
			{
				delete self.routingDisplay.expandStatusDictionary["Student" + nodeData.id];
			}
			else
			{
				delete self.routingDisplay.expandStatusDictionary["Trip" + nodeData.id];
			}
		}
	}

	RoutingDisplayHelper.prototype.clearExpandedDictionary = function(trips)
	{
		let self = this;
		trips?.map(function(trip)
		{
			delete self.routingDisplay.expandStatusDictionary["Trip" + trip.id];
			trip.FieldTripStops.map(function(tripStop)
			{
				delete self.routingDisplay.expandStatusDictionary["Stop" + tripStop.id];
			});
		});
	}

	RoutingDisplayHelper.prototype.getTreeViewTemplate = function()
	{
		const hideClassName = 'hide';
		return `#if(item.level() == 0) {#

				<div class="row tree-trip-row #: item.customData.openType == "View" ? "view-trip" : ""#">
					<div class="col-xs-24 context">
						<div class="trip-text-info">
							<div class="trip-color"></div>
							<div class="context-text">
								<div class="text-name trip-name">
									<div>#: item.text# </div>
									<div class="tree-buttons trip-button">
										<div class="icon trip-absorption view-disabled-button" title="Absorption"></div>
										<div class="icon optimize-sequence view-disabled-button" title="Optimize Sequence"></div>
										<div class="icon copy-information #: item.customData.openType == "View" ? "view-disabled-button" : ""#" title="Copy Calculated Duration"></div>
										<div class="icon refresh #: item.customData.openType == "View" ? "view-disabled-button" : ""#" title="Refresh Path"></div>
										<div class="icon delete trip-delete view-disabled-button" title="Delete"></div>
										<div class="icon copy copyTrip #: item.customData.openType == "View" ? "view-disabled-button" : ""#" title="New Copy"></div>
										<div class="icon info trip-info ${hideClassName}" title="Info"></div>
										<div class="icon zoom-map-to-layers" title="Center Map"></div>
										<div class="icon show-eye #: item.visible? "" : "hide-eye"#" title="Hide field trip" ></div>
									</div>

									#if(item.customData.openType == "View") {#
									<div class="read-only"></div>
									#}#

								</div>
								${this.getFieldTripInfoTemplate()}
							</div>
						</div>
					</div>
					<div class="trip-canvas-container">
						<canvas style="margin-left:10px" class="trip-canvas-distance-info" height="80" width="160"></canvas>
						<canvas style="margin-left:10px" class="trip-canvas-duration-info" height="80" width="160"></canvas>
					</div>
				</div>


				#}else if(item.level() == 1){#
				<div class="row k-tripstop-state-hover #: item.customData.schoolCode ? "school-row" : ""# #: item.customData.openType == "View" ? "view-trip" : ""#">
					<div class="col-xs-24 context no-bottom-border k-tripstop-state-hover">
						<div class="sequence-line k-tripstop-state-hover #:item.customData.schoolCode ? "school-line":""#">#: item.customData.sequence#</div>
						<div class="insert-front-stops-area"></div>
						<div class="insert-icon"></div>
						<div class="insert-behind-stops-area"></div>
						<div class="sublevel-context-text k-tripstop-state-hover">
							<div class="text-hover-overflow-hidden">
								<div class="text-name k-tripstop-state-hover">#: item.text# </div>
								<div class="tree-buttons k-tripstop-state-hover">
									<div class="icon lock-time k-tripstop-state-hover #: item.customData.openType == "View" ? "view-disabled-button" : ""#" title="Set Lock Time"></div>
									<div class="icon delete stop-delete k-tripstop-state-hover #: item.customData.openType == "View"||!item.customData.deletable ? "view-disabled-button" : ""#" title="Delete"></div>
									<div class="icon copy copyStop ${hideClassName} #: item.customData.openType == "View" ? "view-disabled-button" : ""#"  title="Duplicate Stop"></div>
									<div class="icon info stop-info k-tripstop-state-hover" title="Field Trip Stop Details"></div>
									<div class="icon zoom-map-to-layers k-tripstop-state-hover" title="Center Map" ></div></div></div>
									<div class="trip-info k-tripstop-state-hover"><div class="student-info #: item.customData.schoolCode ? "school-student-info" : ""#">

									#if(!item.customData.schoolCode){#
									<div style="display:none;" class="student-count-info k-tripstop-state-hover">#:item.customData.session == 2 ? "" : (item.customData.assignedStudentCount==0&&item.customData.totalStudentCount==0?"No Students":(item.customData.assignedStudentCount + " of " + item.customData.totalStudentCount + (item.customData.totalStudentCount == 1 ? " Student " : " Students "))) #</div>
									#}#

									#if(item.customData.toSchoolStudents && item.customData.toSchoolStudents.HomeToSchool > 0){#
									<div>#: item.customData.toSchoolStudents.HomeToSchool + (item.customData.session == 1 ? " DO - school to home" : item.customData.session == 2 ? " DO - school to school" : " DO - home to school") #</div>
									#}#

									#if(item.customData.toSchoolStudents &&  item.customData.toSchoolStudents.SchoolToHome > 0){#
									<div>#: item.customData.toSchoolStudents.SchoolToHome + (item.customData.session == 0 ? " PU - home to school" : item.customData.session == 2 ? " PU - school to school" : " PU - school to home") #</div>
									#}#

									#if(item.customData.toTransStudents && item.customData.toTransStudents.HomeToTrans > 0){#
									<div>#: item.customData.toTransStudents.HomeToTrans + " DO - home to trans" #</div>
									#}#

									#if(item.customData.toTransStudents && item.customData.toTransStudents.TransToHome > 0){#
									<div>#: item.customData.toTransStudents.TransToHome +" PU - trans to home" #</div>
									#}#

									#if(item.customData.transToTrans && item.customData.transToTrans.PUTransToTrans > 0){#
									<div>#: item.customData.transToTrans.PUTransToTrans + " PU - trans to trans"#</div>
									#}#

									#if(item.customData.transToTrans && item.customData.transToTrans.DOTransToTrans > 0){#
									<div>#: item.customData.transToTrans.DOTransToTrans + " DO - trans to trans"#</div>
									#}#

									#if(item.customData.puTransToSchool && item.customData.puTransToSchool.TransToSchool > 0){#
									<div>#: item.customData.puTransToSchool.TransToSchool + " PU - trans to school" #</div>
									#}#

									#if(item.customData.puTransToSchool && item.customData.puTransToSchool.SchoolToTrans > 0){#
									<div>#: item.customData.puTransToSchool.SchoolToTrans + " PU - school to trans" #</div>
									#}#

									#if(item.customData.doTransToSchool && item.customData.doTransToSchool.TransToSchool > 0){#
									<div>#: item.customData.doTransToSchool.TransToSchool + " DO - trans to school" #</div>
									#}#

									#if(item.customData.doTransToSchool && item.customData.doTransToSchool.SchoolToTrans > 0){#
									<div>#: item.customData.doTransToSchool.SchoolToTrans + " DO - school to trans" #</div>
									#}#

									#if(!item.customData.schoolCode){#
									<span class="arrival-time-span k-tripstop-state-hover"><div class="locked-time #: item.customData.lockStopTime ? "active" : ""#"></div>
									<span title="Scheduled time" class="schedule-time">#:utcToClientTimeZone(item.customData.stopTime).format("MM/DD/YYYY hh:mm A")#</span> #:" | "#
									<span title="Avg. Speed" class="#: item.customData.isLast ? "" : "avg-speed" #">#:item.customData.isLast ? "<none>" : item.customData.avgSpeed #</span>#:" | "#
									<span title="Distance">#:item.customData.isLast ? "<none>" : item.customData.distance + " " + item.customData.measurementUnit #</span>#:" | "#
									<span title="Duration">#:item.customData.isLast ? "<none>" : item.customData.duration#</span>
									#}#
								</div>
							</div>

							#if(item.customData.schoolCode){#
							<div class="dock-position-bottom">
								<div class="school-location"></div>
								<div class="time-info">
									<span class="arrival-time-span k-tripstop-state-hover">
										<div class="locked-time #: item.customData.lockStopTime ? "active" : ""#"></div>
										<span title="Scheduled time" class="schedule-time">#:item.customData.stopTime#</span> #:" | "#
										<span title="Avg. Speed" class="#: item.customData.isLast ? "" : "avg-speed" #">#:item.customData.isLast ? "<none>" : item.customData.avgSpeed#</span>#:" | "#
										<span title="Distance">#:item.customData.isLast ? "<none>" : item.customData.distance + " " + item.customData.measurementUnit #</span>#:" | "#
										<span title="Duration">#:item.customData.isLast ? "<none>" : item.customData.duration#</span>
									</span>
								</div>
							</div>
							#}#
						</div>
					</div>

					#}else{#

					<div class="row student-row-under-stop #: item.customData.openType == "View" ? "view-trip" : ""#">
						<div class="col-xs-24 context no-bottom-border">
							<div class="sequence-line-line"></div>
							<div class="insert-stops-area"></div>
							<div class="sublevel-context-text #: item.customData.isAssigned ? "assign-student-color" : "unassign-student-color"#">
							<div class="student-text"><div class="student-status-info">
								<div class="text-name opacity-change student-text-name" title="#: item.text#">#: item.text# </div>

									#if(item.customData.prohibitCross) {#
									<div class="prohibit-cross"></div>
									#}#

									#if(!item.customData.isValid) {#
									<div class="invalid-student"></div>
									#}#

									<div class="text-status opacity-change">

									#if(item.customData.tripSession != 3){#
									#: item.customData.PUDOStatus#
									#}else{#
									<div class="student-PUDOStatus">
										<span title="PU" class="po status #:item.customData.session == 0 ? "checked" :""# #:item.customData.PUValid ? "" : "cannot-checked"#">PU</span>
										<span title="DO" class="du status #:item.customData.session == 1 ? "checked" :""# #:item.customData.DOValid ? "" : "cannot-checked"#">DO</span>
									</div>
									#}#
								</div>

								#if(!item.customData.requirementId) {#
								<div class="student-exception" title="Exception"></div>
								#}#
							</div>
						</div>

						<div class="student-requirement">
							<span title="Monday" class="day #:item.customData.dayCheckList[0] ? "checked" : ""# #:item.customData.initDayUncheckableList[0] ? "cannot-checked" : ""# #:item.customData.dayDisableList[0]||item.customData.openType == "View" ? "disabled" : ""#">Mo</span>
							<span title="Tuesday" class="day #:item.customData.dayCheckList[1] ? "checked" : ""# #:item.customData.initDayUncheckableList[1] ? "cannot-checked" : ""# #:item.customData.dayDisableList[1]||item.customData.openType == "View" ? "disabled" : ""#">Tu</span>
							<span title="Wednesday" class="day #:item.customData.dayCheckList[2] ? "checked" : ""# #:item.customData.initDayUncheckableList[2] ? "cannot-checked" : ""# #:item.customData.dayDisableList[2]||item.customData.openType == "View" ? "disabled" : ""#">We</span>
							<span title="Thursday" class="day #:item.customData.dayCheckList[3] ? "checked" : ""# #:item.customData.initDayUncheckableList[3] ? "cannot-checked" : ""# #:item.customData.dayDisableList[3]||item.customData.openType == "View" ? "disabled" : ""#">Th</span>
							<span title="Friday" class="day #:item.customData.dayCheckList[4] ? "checked" : ""# #:item.customData.initDayUncheckableList[4] ? "cannot-checked" : ""# #:item.customData.dayDisableList[4] ||item.customData.openType == "View"? "disabled" : ""#">Fr</span>
							<span title="Saturday" class="day #:item.customData.dayCheckList[5] ? "checked" : ""# #:item.customData.initDayUncheckableList[5] ? "cannot-checked" : ""# #:item.customData.dayDisableList[5]||item.customData.openType == "View" ? "disabled" : ""#">Sa</span>
							<span title="Sunday" class="day #:item.customData.dayCheckList[6] ? "checked" : ""# #:item.customData.initDayUncheckableList[6] ? "cannot-checked" : ""# #:item.customData.dayDisableList[6]||item.customData.openType == "View" ? "disabled" : ""#">Su</span>
						</div>

						<div class="trip-info opacity-change">
							<span title="School">#: item.customData.schoolCode + " | "#</span>
							<span title="Grade">#: item.customData.grade + " | "#</span>
							<span title="Walk to Stop">#: item.customData.walkToStopDistance + " | "#</span>
							<span title="Duration on Bus">#: item.customData.totalTime + " min | " #</span>
							<span title="Load Time">#: item.customData.loadTime #</span>
						</div>
					</div>
					<div class="cross-flex-box">
						#if(item.customData.crossToStop != null && item.customData.crossToStop) {#
						<div class="student-cross-street"></div>
						#} else if(item.customData.crossToStop == null){#
						<div class="cross-status-loading"></div>
						#}#
					</div>
				</div>

				<div class="tree-buttons #: item.customData.isAssigned ? "assign-student-color" : "unassign-student-color"#">
					#if(!item.customData.isConfused){#
					<div class="icon #: item.customData.isAssigned ? "minus" : "add"# #: item.customData.openType == "View" ? "view-disabled-button" : ""#" title="#: item.customData.isAssigned ? "Remove" : "Add"#"></div>
					#}#
					<div class="icon zoom-map-to-layers" title="Center Map"></div>
				</div>

				<div class="#: item.customData.walkToStopDistanceWarning && item.customData.isAssigned ? "warning-icon" : ""#"></div>
				</div>
				#}#`;

				//adding this code snippet to the template to debug #console.log(item);console.log($kendoOutput);#
	};

	RoutingDisplayHelper.prototype.getFieldTripInfoTemplate = function()
	{
		return `
		<div class="trip-info-text">
			<span class="info-block">#: item.customData.stops #<br/>Stop#: item.customData.stops==1 ? "" : "s" #</span>
			<span class="splitter"></span>
			<span class="info-block">#: item.customData.tripTotalTime #<br/>min</span>
			<span class="splitter"></span>
			<span class="info-block">#: item.customData.distance #<br/>#: item.customData.measurementUnit#</span>
			<span class="splitter"></span>
			<span class="info-block">#: utcToClientTimeZone(item.customData.startTime).format("MM/DD/YYYY hh:mm A") #<br/>#: utcToClientTimeZone(item.customData.endTime).format("MM/DD/YYYY hh:mm A") #</span>
		</div>`;
	}
})();
(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").UnassignedStudentMapTool = UnassignedStudentMapTool;

	function UnassignedStudentMapTool(viewModel)
	{
		var self = this;
		self.viewModel = viewModel;
		self.dataModel = viewModel.dataModel;
		self._viewModal = viewModel.viewModel._viewModal;
		self._map = self._viewModal._map;
		self.dataModel = viewModel.dataModel;
		self._arcgis = tf.map.ArcGIS;
		self.tripViewModel = self.viewModel.viewModel.tripViewModel;
		self.routingDataModel = self.viewModel.viewModel.dataModel;
		self.editModal = self.viewModel.viewModel.tripViewModel.editFieldTripStopModal;
		self.dataModel.highlightChangedEvent.subscribe(self.onHighlightChangedEvent.bind(this));
		self.routingDataModel.onCandidatesStudentsChangeToMapEvent.subscribe(function(e, data)
		{
			if (data.add.length > 0 || data.delete.length > 0)
			{
				self.refreshUnassignStudentLegend();
			}
		});
		self.renderer = null;
		self.stopTool = new TF.RoutingMap.RoutingPalette.StopTool(self);
		self.symbolHelper = new TF.Map.Symbol();
		TF.RoutingMap.EsriFeatureTool.call(self, self._map);
	}

	UnassignedStudentMapTool.prototype = Object.create(TF.RoutingMap.EsriFeatureTool.prototype);

	UnassignedStudentMapTool.prototype.constructor = UnassignedStudentMapTool;

	UnassignedStudentMapTool.prototype.initialize = function()
	{
		var self = this;
		self.initializeBase({
			point: {
				id: "candidateStudentFeatureLayer",
				symbol: self.symbol.getUnassignedStudentSymbol(),
				renderer: {
					type: "unique-value",
					defaultSymbol: self.symbol.getUnassignedStudentSymbol(),
					field: "criteriaStatus"
				}
			}
		});
		self.dataModel.getSetting().then(function(setting)
		{
			self.changePointLayerRenderer(self.getRenderer(setting));
			// self.initUnassignedStudentLegend();
		});

		self.initializeOtherLayers();
	};

	// UnassignedStudentMapTool.prototype.initUnassignedStudentLegend = function()
	// {
	// 	var self = this,
	// 		grid = { _gridType: "unassignedStudent" },
	// 		$onMapTool = self._viewModal.element.find(".on-map-tool");
	// 	self.unassignedStudentLegend = new TF.Map.Thematics.ThematicLegendViewModel(grid, $onMapTool, false, true, false);
	// 	self.unassignedStudentLegend.onCloseMapLegend.subscribe(self.onLegendClose.bind(self));

	// 	setTimeout(function()
	// 	{
	// 		// use timeout to fix thematicTool not initialize issue
	// 		self._viewModal.RoutingMapTool && self._viewModal.RoutingMapTool.thematicTool.thematicMenu.onSelectThematic.subscribe(self.closeLegend.bind(self));
	// 	}, 2000);
	// };

	UnassignedStudentMapTool.prototype.refreshUnassignStudentLegend = function()
	{
		var self = this,
			unassignedStudentSetting = self.viewModel.dataModel.getCandidateSetting(),
			studentTypeCount = self.reCalculateStudentsTypeCount(),
			legendDetail = self.getUnassignStudentLegendDetail(unassignedStudentSetting, studentTypeCount);
		self.refreshThematicStatus(unassignedStudentSetting);
		self.unassignedStudentLegend.changeLegend(null, legendDetail);
	};

	UnassignedStudentMapTool.prototype.reCalculateStudentsTypeCount = function()
	{
		var self = this,
			candidatesOnMap = self.routingDataModel.routingStudentManager.getCandidatesOnMap(),
			inCriteriaScheduledCount = 0,
			inCriteriaUnassignedCount = 0,
			notInCriteriaScheduledCount = 0,
			notInCriteriaUnassignedCount = 0;
		candidatesOnMap.forEach(function(student)
		{
			if (student.InCriteriaScheduledElsewhere) inCriteriaScheduledCount++;
			if (student.InCriteriaUnassigned) inCriteriaUnassignedCount++;
			if (student.NotInCriteriaScheduledElsewhere) notInCriteriaScheduledCount++;
			if (student.NotInCriteriaUnassigned) notInCriteriaUnassignedCount++;
		});
		return {
			inScheduledCount: inCriteriaScheduledCount,
			inUnassignedCount: inCriteriaUnassignedCount,
			notInScheduledCount: notInCriteriaScheduledCount,
			notInUnassignedCount: notInCriteriaUnassignedCount
		};
	};

	UnassignedStudentMapTool.prototype.getSettingDisplayCount = function(unassignedStudentSetting)
	{
		var studentType = 0;
		if (unassignedStudentSetting.inCriteriaScheduledElsewhere)
		{
			studentType++;
		}
		if (unassignedStudentSetting.inCriteriaUnassigned)
		{
			studentType++;
		}
		if (unassignedStudentSetting.notInCriteriaScheduledElsewhere)
		{
			studentType++;
		}
		if (unassignedStudentSetting.notInCriteriaUnassigned)
		{
			studentType++;
		}
		return studentType;
	};

	UnassignedStudentMapTool.prototype.refreshThematicStatus = function(unassignedStudentSetting)
	{
		var self = this, studentType = this.getSettingDisplayCount(unassignedStudentSetting), thematicTool = self._viewModal.RoutingMapTool.thematicTool, $thematicIcon = self._viewModal.RoutingMapTool.$offMapTool.find(".tool-icon.thematics");
		if (thematicTool.thematicInfo)
		{
			thematicTool.thematicMenu.clearThematicSelection(true, true);
			thematicTool.thematicLegend.showHideLegend(false, true);
			thematicTool.thematicInfo = null;
			thematicTool.legendStatus = null;
		}
		if (studentType > 1)
		{
			$thematicIcon.addClass("disable");
		}
		else
		{
			$thematicIcon.removeClass("disable");
		}
		self.refreshCandidateStudentSymbol(unassignedStudentSetting);
	};

	UnassignedStudentMapTool.prototype.refreshCandidateStudentSymbol = function(candidateSetting)
	{
		var self = this, renderer = self.getRenderer(candidateSetting);
		self.changePointLayerRenderer(renderer);
	};

	UnassignedStudentMapTool.prototype.getUnassignStudentLegendDetail = function(setting, studentTypeCount)
	{
		var legendContent = {}, legendDetail = [];
		legendContent.isLegendShow = setting.showLegend && this.routingDataModel.trips.length > 0;
		if (setting.inCriteriaUnassigned)
		{
			var inCriteriaUnassignedDetail = setting.attendingUnassignedSymbol;
			inCriteriaUnassignedDetail.DisplayLabel = "Attending Unassigned";
			inCriteriaUnassignedDetail.count = studentTypeCount.inUnassignedCount;
			legendDetail.push(inCriteriaUnassignedDetail);
		}
		if (setting.inCriteriaScheduledElsewhere)
		{
			var inCriteriaScheduledElsewhereDetail = setting.attendingScheduledSymbol;
			inCriteriaScheduledElsewhereDetail.DisplayLabel = "Attending Scheduled Elsewhere";
			inCriteriaScheduledElsewhereDetail.count = studentTypeCount.inScheduledCount;
			legendDetail.push(inCriteriaScheduledElsewhereDetail);
		}
		if (setting.notInCriteriaUnassigned)
		{
			var notInCriteriaUnassignedDetail = setting.notAttendingUnassignedSymbol;
			notInCriteriaUnassignedDetail.DisplayLabel = "Not Attending Unassigned";
			notInCriteriaUnassignedDetail.count = studentTypeCount.notInUnassignedCount;
			legendDetail.push(notInCriteriaUnassignedDetail);
		}
		if (setting.notInCriteriaScheduledElsewhere)
		{
			var notInCriteriaScheduledElsewhereDetail = setting.notAttendingScheduledSymbol;
			notInCriteriaScheduledElsewhereDetail.DisplayLabel = "Not Attending Scheduled Elsewhere";
			notInCriteriaScheduledElsewhereDetail.count = studentTypeCount.notInScheduledCount;
			legendDetail.push(notInCriteriaScheduledElsewhereDetail);
		}
		legendContent.detail = legendDetail;
		legendContent.isTitleShow = true;
		legendContent.isDescriptionShow = true;
		legendContent.title = "Students";
		legendContent.description = "Unassigned / Potential Candidates";
		return legendContent;
	};

	UnassignedStudentMapTool.prototype.closeLegend = function()
	{
		var self = this;
		if (self.dataModel.currentSettings.showLegend)
		{
			self.unassignedStudentLegend.closeLegend(false);
		}
	};

	UnassignedStudentMapTool.prototype.onLegendClose = function()
	{
		var self = this;
		self.dataModel.currentSettings.showLegend = false;
		tf.storageManager.save(self.dataModel.getStorage().showLegend.key, "false");
		self.dataModel.settingChangeEvent.notify();
	};

	UnassignedStudentMapTool.prototype.otherFields = function()
	{
		return [{
			name: "IsTotalMatch",
			fieldName: 'IsTotalMatch',
			getText: function(item)
			{
				return item.IsTotalMatch;
			}
		}, {
			name: "criteriaStatus",
			fieldName: 'criteriaStatus'
		}, {
			name: "studId",
			fieldName: 'studId'
		}, {
			name: "value",
			fieldName: 'value'
		}];
	};

	UnassignedStudentMapTool.prototype.initializeOtherLayers = function()
	{
		var self = this;
		self._doorToDoorStopLayer = new self._arcgis.GraphicsLayer({
			"id": "doorToDoorStopLayer"
		});
		self._map.add(self._doorToDoorStopLayer);
		self.viewModel.layers.push(self._doorToDoorStopLayer.id);

		self._pointArrowLayer = new self._arcgis.GraphicsLayer({
			"id": "studentPointArrowLayer"
		});
		self._map.add(self._pointArrowLayer);
		self.viewModel.layers.push(self._pointArrowLayer.id);

		self._tempWalkoutLayer = new self._arcgis.GraphicsLayer({
			"id": "studentTempWalkoutLayer"
		});
		self._map.add(self._tempWalkoutLayer);
		self.viewModel.layers.push(self._tempWalkoutLayer.id);

		self._walkoutGuideLayer = new self._arcgis.GraphicsLayer({
			"id": "studentWalkoutGuideLayer"
		});
		self._map.add(self._walkoutGuideLayer);
		self.viewModel.layers.push(self._walkoutGuideLayer.id);
	};

	UnassignedStudentMapTool.prototype.drawArrowToPoints = function(arrow)
	{
		this._pointArrowLayer.add(new tf.map.ArcGIS.Graphic({
			geometry: arrow.geometry,
			symbol: this.symbol.arrowToPoint(arrow.color),
			attributes: arrow.attributes
		}));
	};

	UnassignedStudentMapTool.prototype.selectCallback = function(graphics)
	{
		var self = this, selectIds = [];
		graphics.forEach(function(graphic)
		{
			var studentDataModel = self.dataModel.getStudentById(graphic.attributes.id);
			if (studentDataModel && studentDataModel.isShowOnCandidateMap)
			{
				selectIds.push(graphic.attributes.id);
			}
		});
		self.selectionChange.notify(selectIds);

		self._viewModal.setMode("", "Normal");
	};

	UnassignedStudentMapTool.prototype.getSymbol = function(graphic, type)
	{
		var self = this, unassignedStudentSymbol = self.symbol.getUnassignedStudentSymbol();
		if (type == this.StatusType.highlight)
		{
			unassignedStudentSymbol.outline = { color: self.symbol.symbolColors.yellowForHighlight, width: 2 };
			return unassignedStudentSymbol;
		}
		else
		{
			return unassignedStudentSymbol;
		}
	};

	// UnassignedStudentMapTool.prototype.onHighlightChangedEvent = function()
	// {
	// 	var self = this;
	// 	if (!self._viewModal.RoutingMapTool.hasApplyThematic())
	// 	{
	// 		self.highlightChangedEvent();
	// 	}
	// };

	UnassignedStudentMapTool.prototype.createDoorToDoorStop = function(student)
	{
		var self = this;
		self.stopTool.getDoorToDoorLocationForStudent({ geometry: student.geometry, address: student.Address }).then(function(midPoint)
		{
			var pointGraphic = self._createSimplePointGraphic(midPoint);
			self._doorToDoorStopLayer.add(pointGraphic);
			self._newTripStopGraphic = pointGraphic;
			var addressPromise = Promise.resolve();
			if (student.Address && student.Address.split(",")[0].length > 0)
			{
				addressPromise = Promise.resolve(student.Address.split(",")[0]);
			} else
			{
				addressPromise = self.stopTool.reverseGeocodeStop(midPoint);
			}
			addressPromise.then(function(result)
			{
				tf.loadingIndicator.tryHide();
				if (result)
				{
					var options = {
						isDoorToDoor: true,
						student: student,
						isCreateFromUnassignStudent: true,
						isCreateFromStopSearch: false,
						isCreateFromSearch: false,
						boundary: null,
						insertBehindSpecialStop: false,
						streetName: result
					};
					self.stopTool.addStopAddressAndBoundary(pointGraphic, options);
				} else
				{
					self._doorToDoorStopLayer.remove(self._newTripStopGraphic);
				}
			});
		});
	};

	UnassignedStudentMapTool.prototype._createSimplePointGraphic = function(geometry)
	{
		return new this._arcgis.Graphic({
			geometry: geometry,
			attributes: { id: TF.createId() },
			symbol: this.symbol.tripStop("0", "#FFFFFF")
		});
	};

	UnassignedStudentMapTool.prototype.drawTempTripStopsOnMap = function(tripStops)
	{
		var self = this;
		self._newTripStopGraphic = [];
		tripStops.forEach(function(item)
		{
			var pointGraphic = self._createSimplePointGraphic(item);
			self._doorToDoorStopLayer.add(pointGraphic);
			self._newTripStopGraphic.push(pointGraphic);
		});
	};

	UnassignedStudentMapTool.prototype._clearTempDrawing = function()
	{
		var self = this;
		if ($.isArray(self._newTripStopGraphic))
		{
			self._doorToDoorStopLayer.removeMany(self._newTripStopGraphic);
		} else
		{
			self._doorToDoorStopLayer.remove(self._newTripStopGraphic);
		}
	};

	UnassignedStudentMapTool.prototype.clearArrow = function(students)
	{
		var self = this;
		students.forEach(function(student)
		{
			var graphics = self._pointArrowLayer.graphics.filter(function(graphic)
			{
				return graphic.attributes && graphic.attributes.id == student.id && graphic.attributes.requirementId == student.RequirementID;
			});
			self._pointArrowLayer.removeMany(graphics);
		});
	};

	UnassignedStudentMapTool.prototype.getRenderer = function(setting)
	{
		var self = this;
		return {
			type: "unique-value",
			defaultSymbol: self.symbol.getUnassignedStudentSymbol(),
			field: "criteriaStatus",
			uniqueValueInfos: [
				{
					value: 0,
					symbol: self.getSymbol(setting.attendingUnassignedSymbol)
				},
				{
					value: 1,
					symbol: self.getSymbol(setting.attendingScheduledSymbol)
				},
				{
					value: 2,
					symbol: self.getSymbol(setting.notAttendingUnassignedSymbol)
				},
				{
					value: 3,
					symbol: self.getSymbol(setting.notAttendingScheduledSymbol)
				}
			]
		};

	};

	UnassignedStudentMapTool.prototype.getSymbol = function(symbolSetting)
	{
		var self = this;
		return self.getSVGMarkSymbol(symbolSetting);
	};

	UnassignedStudentMapTool.prototype.changePointLayerRenderer = function(renderer)
	{
		var self = this;
		if (!self.renderer || !self.compareRenderer(renderer))
		{
			self.renderer = renderer;
			self._pointLayer.renderer = renderer;
		}
	};

	UnassignedStudentMapTool.prototype.compareRenderer = function(compareRenderer)
	{
		var self = this, originHash = TF.getHashCode(JSON.stringify(self.renderer)), compareHash = TF.getHashCode(JSON.stringify(compareRenderer));
		if (originHash == compareHash &&
			self._pointLayer.renderer.uniqueValueInfos.length == compareRenderer.uniqueValueInfos.length &&
			self._pointLayer.renderer.uniqueValueInfos[0].value == compareRenderer.uniqueValueInfos[0].value)
		{
			return true;
		}
		else
		{
			return false;
		}
	}

	UnassignedStudentMapTool.prototype.getSVGMarkSymbol = function(setting)
	{
		var self = this, symbolNumber = setting.Symbol ? setting.Symbol : setting.symbol, pathString = self.getOriginSVGSymbolString(symbolNumber);
		if (symbolNumber === "-1")
		{
			return self.symbolHelper.pathSymbol(pathString, "transparent", "0", false);
		}
		else
		{
			return self.symbolHelper.pathSymbol(pathString, setting.Color ? setting.Color : setting.color, setting.Size ? setting.Size : setting.size,
				setting.IsWithBorder ? setting.IsWithBorder : setting.borderishow, setting.BorderColor ? setting.BorderColor : setting.bordercolor, setting.BorderWidth ? setting.BorderWidth : setting.bordersize);
		}
	};

	UnassignedStudentMapTool.prototype.getOriginSVGSymbolString = function(symbolnumber)
	{
		var pathString = "", i = thematicSymbolPath.length - 1;
		if (symbolnumber === "-1")
		{
			pathString = thematicSymbolPath[0].pathString;
		}
		else
		{
			for (; i >= 0; i--)
			{
				if (thematicSymbolPath[i].id === Number(symbolnumber))
				{
					pathString = thematicSymbolPath[i].pathString;
				}
			}

		}
		return pathString;
	};

	UnassignedStudentMapTool.prototype.deferRefreshCandidateTripArrow = function()
	{
		if (this.refreshCandidateTripArrowTimer != null)
		{
			clearTimeout(this.refreshCandidateTripArrowTimer);
		}

		this.refreshCandidateTripArrowTimer = setTimeout(function()
		{
			this.refreshCandidateTripArrow();
			this.refreshCandidateTripArrowTimer = null;
		}.bind(this), 1000);
	};

	UnassignedStudentMapTool.prototype.refreshCandidateTripArrow = function()
	{
		var info = this.tripViewModel.dataModel._viewModal.DocumentData.data.candidateInfo;
		if (!info)
		{
			return;
		}

		var drawTool = this.tripViewModel.dataModel.viewModel.drawTool,
			layer = drawTool._studentLayer,
			student = info.student,
			requirement = info.requirement,
			arrow = { id: student.Id, RequirementID: requirement.StudentRequirement.Id, x: requirement.LocationX, y: requirement.LocationY, type: "CandidateTripArrow" },
			operationStudent, existedArrow,
			onMapStudents = layer.graphics.items;
		for (var i = 0, l = onMapStudents.length; i < l; i++)
		{
			var item = onMapStudents[i], attributes = item.attributes;
			if (!operationStudent && attributes.dataModel.id === arrow.id && attributes.dataModel.RequirementID === arrow.RequirementID)
			{
				operationStudent = item;
			}

			if (!existedArrow && attributes.type == "CandidateTripArrow")
			{
				existedArrow = item;
			}

			if (existedArrow && operationStudent)
			{
				break;
			}
		}

		this._pointArrowLayer.removeAll();
		if (!operationStudent)
		{
			if (existedArrow)
			{
				layer.remove(existedArrow);
			}

			var key = arrow.id + "_" + arrow.RequirementID + "_0";
			if (this.tripViewModel.dataModel.routingStudentManager.students[key])
			{
				this._pointArrowLayer.add(this.createCandidateTripArrow(arrow, drawTool.symbol));
			}
			return;
		}

		if (!existedArrow)
		{
			existedArrow = this.createCandidateTripArrow(arrow, drawTool.symbol);
			layer.add(existedArrow);
		}

		existedArrow.visible = operationStudent.visible;
	};

	UnassignedStudentMapTool.prototype.createCandidateTripArrow = function(arrow, symbol)
	{
		return new tf.map.ArcGIS.Graphic({
			geometry: TF.xyToGeometry(arrow.x, arrow.y),
			symbol: symbol.arrowToPoint([255, 0, 0]),
			attributes: arrow
		});
	};

	UnassignedStudentMapTool.prototype.overlapCheck = function(graphic)
	{
		var self = this, routingTripTool = self.tripViewModel.drawTool;
		return routingTripTool.overlapCheck(graphic);
	};

	UnassignedStudentMapTool.prototype.addPolygonToLayer = function(graphic)
	{
		var self = this;

		if (!self._stopInBoundaryCheck(self._newTripStopGraphic.geometry, graphic.geometry))
		{
			graphic = self.tripViewModel.drawTool.removeOverlapBoundary(graphic);
			graphic.geometry = self.tripViewModel.drawTool._cutResultHandler(graphic.geometry, self._newTripStopGraphic.geometry);
			self._walkoutGuideLayer.removeAll();
			self.createStopBoundaryResolve({
				geometry: graphic.geometry,
				graphic: graphic,
				BdyType: self.editModal.isDoorToDoor() ? 0 : 1
			});
		}

	};


	UnassignedStudentMapTool.prototype._tripStopNotInBoundaryDialogBox = function()
	{
		return this._warningDialogBox("Please draw a new shape which includes the trip stop");
	};

	UnassignedStudentMapTool.prototype._stopInBoundaryCheck = function(stopGeom, boundaryGeom)
	{
		var self = this;
		if (!self._arcgis.geometryEngine.intersects(stopGeom, boundaryGeom))
		{
			return self._tripStopNotInBoundaryDialogBox().then(function()
			{
				self.sketchTool._drawingLayer.removeAll();
				self.create(self.editModal.obSelectedStopType().toLowerCase());
			});
		}
		return false;
	};

	UnassignedStudentMapTool.prototype.clear = function()
	{
		this._pointLayer.removeAll();
		this._pointArrowLayer.removeAll();
		this.unassignedStudentLegend.dispose();
	};

	UnassignedStudentMapTool.prototype.dispose = function()
	{
		TF.RoutingMap.EsriFeatureTool.prototype.dispose.call(this);
		clearTimeout(this.refreshCandidateTripArrowTimer);
		tfdispose(this);
	};

})();
(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").StopPreviewTool = StopPreviewTool;

	function StopPreviewTool(drawTool, map)
	{
		var self = this;
		self._arcgis = tf.map.ArcGIS;
		self._map = map;
		if (drawTool)
		{
			self.drawTool = drawTool;
			self.dataModel = drawTool.dataModel;
			self.viewModel = drawTool.viewModel;
			self._viewModel = drawTool.viewModel._viewModal;
			self._viewModal = drawTool._viewModal;
			self.editModal = drawTool.editModal;
			self._map = drawTool._map;
		}

		self.initialize();
		self.stopTool = drawTool.stopTool;
		self._tempWalkoutLayer = self.drawTool._tempWalkoutLayer;
		self._previewLayer = self.drawTool._previewLayer;

		self._walkoutPreviewLineSymbol = new self._arcgis.SimpleLineSymbol({
			color: "#696969",
			width: "5px"
		});
		self._walkoutPreviewCircleSymbol = new self._arcgis.SimpleFillSymbol({
			color: [0, 0, 0, 0],
			outline: self._walkoutPreviewLineSymbol
		});

		self.Symbol = new TF.Map.Symbol();
		self.highlightedStudentGraphics = [];
	}

	StopPreviewTool.prototype.constructor = StopPreviewTool;

	StopPreviewTool.prototype.initialize = function()
	{

	}

	StopPreviewTool.prototype._startWalkoutPreview = function(distance, distanceUnit, buffer, bufferUnit, walkoutType, isTrial)
	{
		var self = this, timeout = null;
		self._walkoutPreviewHandler = self._map.mapView.on("pointer-move", function(e)
		{
			if (!window.event.shiftKey)
			{
				self._tempWalkoutLayer.removeAll();
				return;
			}
			self._mouseOutMap = false;
			clearTimeout(timeout);
			//self._tempWalkoutLayer.clear();
			self._isPreviewMode = true;
			timeout = setTimeout(function()
			{
				if (self._isPreviewMode)
				{
					var mapPoint = self._map.mapView.toMap({ x: e.x, y: e.y });
					self.stopTool.generateWalkoutZone(new self._arcgis.Graphic({ geometry: mapPoint }), distance, distanceUnit, buffer, bufferUnit, walkoutType, null, true)
						.then(function(result)
						{
							var previewGraphic = null;
							if (walkoutType == 0)
							{
								previewGraphic = new self._arcgis.Graphic({ geometry: result.walkoutGuide, symbol: self._walkoutPreviewLineSymbol })
							}
							else if (walkoutType == 1)
							{
								previewGraphic = new self._arcgis.Graphic({ geometry: result.walkoutZone.geometry, symbol: self._walkoutPreviewCircleSymbol })
							}
							if (!self._mouseOutMap)
							{
								var stop = { geometry: mapPoint, boundary: { geometry: result.walkoutZone.geometry }, ProhibitCrosser: self.drawTool._prohibitCrosser };
								if (isTrial)
								{
									self.viewModel.viewModel.fieldTripPaletteSection.dataModel.getUnAssignStudentInBoundaryProhibitCross(stop).then(function(students)
									{
										self._tempWalkoutLayer.removeAll();
										self._tempWalkoutLayer.add(previewGraphic);

										var stopGraphic = new self._arcgis.Graphic({ geometry: mapPoint });
										stop.symbol = self.drawTool.getSymbol(stopGraphic, "edit");

										stop.studentCount = students.length;
										var studentLabelGraphic = new self._arcgis.Graphic(mapPoint, self.Symbol.createStudentLabelSymbol(stop), { type: "studentLabel" });
										self._tempWalkoutLayer.add(studentLabelGraphic);
										self._tempWalkoutLayer.add(stopGraphic);
										self._map.reorder(self._tempWalkoutLayer, self._map.layers.length + 1);
									});
								} else
								{
									self._tempWalkoutLayer.removeAll();
									self._tempWalkoutLayer.add(previewGraphic);
									self._map.reorder(self._tempWalkoutLayer, self._map.layers.length + 1);
								}
							}
						});
				}

			}, 250);
		});
		self._walkoutPreviewOutHandler = self._map.mapView.on("pointer-leave", function()
		{
			self._tempWalkoutLayer.removeAll();
			self._mouseOutMap = true;
		});
	}

	StopPreviewTool.prototype._stopWalkoutPreview = function()
	{
		var self = this;
		//if (self.drawTool._mode != "createPoint") return;
		if (self._walkoutPreviewHandler)
		{
			self._walkoutPreviewHandler.remove();
		}
		if (self._walkoutPreviewOutHandler)
		{
			self._walkoutPreviewOutHandler.remove();
		}

		self._tempWalkoutLayer.removeAll();
		setTimeout(function()
		{
			self._tempWalkoutLayer.removeAll();
		}, 300);
	};

	StopPreviewTool.prototype.addPreview = function(evt, distance, distanceUnit, buffer, bufferUnit, walkoutType, isTrial, travelScenario)
	{
		var self = this;
		self._isPreviewMode = false;

		self._previewLayer.graphics.removeAll();
		self._tempWalkoutLayer.graphics.removeAll();

		evt.previewId = TF.createId();
		self._addPreviewOnClick([evt], distance, distanceUnit, buffer, bufferUnit, walkoutType, isTrial, travelScenario);

		self._stopWalkoutPreview();
	}

	StopPreviewTool.prototype._addPreviewOnHover = function()
	{
		var self = this;
		self._tempWalkoutLayer.graphics.forEach(function(graphic)
		{
			if (graphic.geometry.type != "point")
			{
				var attributes = graphic.attributes || {};
				//attributes.previewId = self.drawTool._createId();
				self._previewLayer.add(new self._arcgis.Graphic(TF.cloneGeometry(graphic.geometry), self._walkoutPreviewLineSymbol, attributes));
			}
			if (graphic.attributes && graphic.attributes.type == "studentLabel")
			{
				self._previewLayer.add(new self._arcgis.Graphic(TF.cloneGeometry(graphic.geometry), graphic.symbol, graphic.attributes));
			}
		});
		self.drawTool._newTripStopGraphic.forEach(function(graphic)
		{
			graphic.symbol = self.drawTool.stopSymbol(self.Symbol.symbolColors.grayForEditing);
		})
		self._tempWalkoutLayer.removeAll();
	}

	StopPreviewTool.prototype._addPreviewOnClick = function(evtArray, distance, distanceUnit, buffer, bufferUnit, walkoutType, isTrial, travelScenario)
	{
		var self = this, promises = [];
		evtArray.forEach(function(evt)
		{
			promises.push(self.stopTool.generateWalkoutZone(new self._arcgis.Graphic(evt.geometry), distance, distanceUnit, buffer, bufferUnit, walkoutType, null, null, null, travelScenario));
		});
		Promise.all(promises).then(function(results)
		{
			results.forEach(function(result, index)
			{
				if (!result)
				{
					return;
				}
				var pointCllicked = TF.cloneGeometry(evtArray[index].geometry);
				var previewGraphic = null;
				if (walkoutType == 0)
				{
					previewGraphic = new self._arcgis.Graphic(result.walkoutGuide, self._walkoutPreviewLineSymbol, { previewId: evtArray[index].previewId })
				}
				else if (walkoutType == 1)
				{
					previewGraphic = new self._arcgis.Graphic(result.walkoutZone.geometry, self._walkoutPreviewCircleSymbol, { previewId: evtArray[index].previewId })
				}
				if (isTrial)
				{
					var stop = { geometry: pointCllicked, boundary: { geometry: result.walkoutZone.geometry }, ProhibitCrosser: self.drawTool._prohibitCrosser };
					self.viewModel.viewModel.fieldTripPaletteSection.dataModel.getUnAssignStudentInBoundaryProhibitCross(stop).then(function(students)
					{
						self._previewLayer.add(previewGraphic);
						stop.studentCount = students.length;
						var studentLabelGraphic = new self._arcgis.Graphic(pointCllicked, self.Symbol.createStudentLabelSymbol(stop), { type: "studentLabel", previewId: evtArray[index].previewId });
						self._previewLayer.add(studentLabelGraphic);
						self._tempWalkoutLayer.removeAll();
					});
				}
				else
				{
					self._previewLayer.add(previewGraphic);
					self._tempWalkoutLayer.graphics.removeAll();

				}

			})
		}).catch(e =>
		{
			self.viewModel.display.arcgisError(e.message);
		});
	}

	StopPreviewTool.prototype._getWalkoutPreviews = function(evtArray, barriers)
	{
		var self = this, promises = [];
		self.resolve = null;
		self.reject = null;
		self.promise = new Promise(function(resolve, reject) { self.resolve = resolve; self.reject = reject; });
		var ps = [], previewGraphics = [];
		evtArray.forEach(function(evt)
		{
			if (evt.walkoutZone)
			{
				promises.push(new Promise(function(resolve) { resolve({ walkoutZone: new self._arcgis.Graphic(evt.walkoutZone) }) }))
			} else
			{
				promises.push(self.stopTool.generateWalkoutZone(new self._arcgis.Graphic(evt.geometry), self.drawTool._walkoutDistance, self.drawTool._walkoutDistanceUnit, self.drawTool._walkoutBuffer,
					self.drawTool._walkoutBufferUnit, self.drawTool._walkoutType, null, null, null, null, barriers));
			}
		})

		Promise.all(promises).then(function(results)
		{
			results.forEach(function(result, index)
			{
				var pointCllicked = TF.cloneGeometry(evtArray[index].geometry);
				var previewGraphic = null;
				if (self.drawTool._walkoutType == 0 || !result.walkoutGuide)
				{
					if (result.walkoutGuide)
					{
						previewGraphic = new self._arcgis.Graphic(result.walkoutGuide, self._walkoutPreviewLineSymbol, { previewId: evtArray[index].previewId })
					} else
					{
						previewGraphic = new self._arcgis.Graphic(result.walkoutZone.geometry, self._walkoutPreviewCircleSymbol, { previewId: evtArray[index].previewId })
					}

				}
				else if (self.drawTool._walkoutType == 1)
				{
					previewGraphic = new self._arcgis.Graphic(result.walkoutZone.geometry, self._walkoutPreviewCircleSymbol, { previewId: evtArray[index].previewId })
				}
				var stop = { geometry: pointCllicked, boundary: { geometry: result.walkoutZone.geometry }, ProhibitCrosser: self.drawTool._prohibitCrosser };
				previewGraphics.push(previewGraphic);
				ps.push(self.viewModel.viewModel.fieldTripPaletteSection.dataModel.getUnAssignStudentInBoundaryProhibitCross(stop));
			})
			Promise.all(ps).then(function(results)
			{
				results.forEach(function(students, index)
				{
					previewGraphics[index].attributes.students = students;
					self._tempWalkoutLayer.add(previewGraphics[index]);
					previewGraphics[index].visible = false
					evtArray[index].students = students;
					evtArray[index].studentCount = students.length;
					var studentLabelGraphic = new self._arcgis.Graphic(TF.cloneGeometry(evtArray[index].geometry), self.Symbol.createStudentLabelSymbol(evtArray[index]), { type: "studentLabel", previewId: evtArray[index].previewId });
					self._tempWalkoutLayer.add(studentLabelGraphic);
					studentLabelGraphic.visible = false
				});
				self.resolve(true);

			})
		});
		return self.promise;
	}

	StopPreviewTool.prototype.onTrialStopWalkoutPreviewChange = function(event, items)
	{
		var self = this, item, boundaryGeometry, boundarySymbol, graphics = [], walkoutGraphic, walkoutType;
		if (items.edit && items.edit.length > 0)
		{
			item = items.edit[0];

			//update walkout
			graphics = self._previewLayer.graphics.items;
			walkoutGraphic = graphics.filter(function(graphic)
			{
				return graphic.geometry.type != "point" && item.previewId == graphic.attributes.previewId
			})[0];
			if (!walkoutGraphic)
			{
				walkoutGraphic = graphics.filter(function(graphic)
				{
					return graphic.geometry.type != "point"
				})[0];
			}
			if (!walkoutGraphic) return;
			walkoutType = item.WalkoutType == null || undefined ? self.editModal.walkoutType() : item.WalkoutType;
			if (walkoutType == 0)
			{
				boundaryGeometry = TF.cloneGeometry(item.walkoutGuide.geometry);
				boundarySymbol = self._walkoutPreviewLineSymbol;
			} else
			{
				boundaryGeometry = TF.cloneGeometry(item.boundary.geometry);
				boundarySymbol = self._walkoutPreviewCircleSymbol;
			}
			walkoutGraphic.geometry = boundaryGeometry;
			walkoutGraphic.symbol = boundarySymbol;


			//update student label count
			if (item.type == "trialStop")
			{
				var studentLabelGraphic = graphics.filter(function(graphic)
				{
					return graphic.attributes && graphic.attributes.type == "studentLabel"
				})[0];
				var studentLabelSymbol = self.Symbol.createStudentLabelSymbol(item);
				studentLabelGraphic.symbol = studentLabelSymbol;
			}
		}
		else if (items.add && items.add.length > 0)
		{
			self._previewLayer.removeAll();
			item = items.add[0];
			var walkoutPromise = self.stopTool.generateWalkoutZone(new tf.map.ArcGIS.Graphic(item.geometry),
				item.Distance,
				self.editModal.obSelectedDistanceUnit(),
				self.editModal.walkoutBuffer(),
				self.editModal.obSelectedBufferUnit(),
				this.editModal.walkoutType());
			walkoutPromise.then(function(result)
			{
				item.walkoutGuide = { geometry: result.walkoutGuide };
				item.boundary = result.walkoutZone;
				walkoutType = item.WalkoutType == null || undefined ? self.editModal.walkoutType() : item.WalkoutType;
				if (walkoutType == 0)
				{
					boundaryGeometry = TF.cloneGeometry(item.walkoutGuide.geometry);
					boundarySymbol = self._walkoutPreviewLineSymbol;
				} else
				{
					boundaryGeometry = TF.cloneGeometry(item.boundary.geometry);
					boundarySymbol = self._walkoutPreviewCircleSymbol;
				}
				if (!item.previewId) item.previewId = TF.createId();
				walkoutGraphic = new tf.map.ArcGIS.Graphic({ geometry: boundaryGeometry, symbol: boundarySymbol, attributes: { previewId: item.previewId } })


				self._previewLayer.add(walkoutGraphic);

			});

		}

	}

	StopPreviewTool.prototype.toggleWalkoutPreviewFromJunctionSelect = function(selected)
	{
		var self = this;
		var studentIds = [];
		self.highlightedStudentGraphics = [];
		self.drawTool._newTripStopGraphic.forEach(function(graphic)
		{
			graphic.symbol = self.drawTool.stopSymbol(self.Symbol.symbolColors.grayForEditing);
			var stop = Enumerable.From(selected).Where(function(c) { return c.id == graphic.attributes.id }).ToArray()[0];
			if (stop)
			{
				graphic.symbol = self.drawTool.stopSymbol("#ffff00");
			}
		})
		self._tempWalkoutLayer.graphics.forEach(function(graphic)
		{
			graphic.visible = false;
			var stop = Enumerable.From(selected).Where(function(c) { return c.previewId == graphic.attributes.previewId && graphic.geometry.type != "point" }).ToArray()[0];
			if (stop)
			{
				graphic.symbol = self.drawTool._walkoutHighlightLineSymbol;
				graphic.visible = true;
				graphic.attributes.students.forEach(function(student)
				{
					if (studentIds.indexOf(student.id) < 0) studentIds.push(student.id);
				})

			}
		});
		this._map.mapView.whenLayerView(self.drawTool._map.findLayerById("candidateStudentFeatureLayer")).then(function(layerView)
		{
			if (self.highlightCandidateSelect)
			{
				self.highlightCandidateSelect.remove();
			}
			var studentOids = [];
			selected.forEach(function(select) { studentOids = studentOids.concat(select.students.map(function(item) { return item.oid; })) });
			self.highlightCandidateSelect = layerView.highlight(studentOids);
		});
	}

	StopPreviewTool.prototype.clear = function()
	{
		var self = this;
		TF.Helper.MapHelper.clearLayer(self._previewLayer);
		if (self.highlightCandidateSelect)
		{
			self.highlightCandidateSelect.remove();
		}
	}

	StopPreviewTool.prototype.dispose = function()
	{
		tfdispose(this);
	}
})();
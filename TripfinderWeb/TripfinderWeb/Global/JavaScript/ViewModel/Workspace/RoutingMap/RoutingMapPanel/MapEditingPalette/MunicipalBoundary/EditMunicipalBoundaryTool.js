(function()
{
	createNamespace('TF.RoutingMap.MapEditingPalette').EditMunicipalBoundaryTool = EditMunicipalBoundaryTool;

	function EditMunicipalBoundaryTool(map, arcgis, contextMenuEvent, viewModel)
	{
		var self = this;
		TF.RoutingMap.BaseEditTool.call(self, map, arcgis, contextMenuEvent, viewModel);





		// map events

		this._currentSelectedParcelIndexes = [];


		self._selectedVertexSymbol = new this._arcgis.SimpleMarkerSymbol({
			"color": [70, 130, 180],
			"size": 6,
			"xoffset": 0,
			"yoffset": 0,
			"type": "esriSMS",
			"style": "esriSMSCircle"
		});
		self._vertexSymbol = new this._arcgis.SimpleMarkerSymbol({
			"color": [0, 0, 0],
			"size": 6,
			"xoffset": 0,
			"yoffset": 0,
			"type": "esriSMS",
			"style": "esriSMSCircle"
		});


		this.initialize();
	};
	EditMunicipalBoundaryTool.prototype = Object.create(TF.RoutingMap.BaseEditTool.prototype);
	EditMunicipalBoundaryTool.prototype.constructor = EditMunicipalBoundaryTool;

	EditMunicipalBoundaryTool.prototype.drawColor = null;

	EditMunicipalBoundaryTool.prototype.initialize = function()
	{
		this.initializeBase();
	};

	EditMunicipalBoundaryTool.prototype._bindEvents = function()
	{
		this._bindEventsBase();
		if (!this._mapKeyESCDown)
		{
			this._mapKeyESCDown = this._map.on("key-down", this._onMapKeyDown.bind(this));
		}
		this.bindTag = true;
	};


	EditMunicipalBoundaryTool.prototype._startEditPolygon = function(type, graphic)
	{
		var self = this;
		switch (type)
		{
			case "reshape":
				var ghostVertexSymbol = new self._arcgis.SimpleMarkerSymbol(self._arcgis.SimpleMarkerSymbol.STYLE_CIRCLE, 6, null, new self._arcgis.Color([169, 169, 169, 1]));
				var options = { allowAddVertices: true, allowDeleteVertices: true, vertexSymbol: self._vertexSymbol, ghostVertexSymbol: ghostVertexSymbol };
				self._editToolbar.activate(self._arcgis.Edit.EDIT_VERTICES, graphic, options);
				break;
			case "transform":
				self._editToolbar.activate(self._arcgis.Edit.ROTATE | self._arcgis.Edit.SCALE | self._arcgis.Edit.MOVE, graphic, self._options);
				graphic.getDojoShape().moveToFront();

				self._makeRightMenuClickableWhenMoving(self._editToolbar._graphicMover);
				break;
		}
	};


	EditMunicipalBoundaryTool.prototype.dispose = function()
	{
	};

	EditMunicipalBoundaryTool.prototype._notifyEditParcelPanel = function(e)
	{
		var dataModels = [];
		this._currentSelectedParcelIndexes = [0];

		dataModels.push(e.graphic.attributes.dataModel);

		this.onVertexLeftClick.notify(dataModels);
	};
	EditMunicipalBoundaryTool.prototype._notifyEdit = function(ids)
	{
		this._notifyEditBase(ids);

	};


	EditMunicipalBoundaryTool.prototype.stop = function(e, stopByTabChange)
	{
		var self = this;
		self._stopEditPolygon();
		self.stopBase(e, stopByTabChange);
	};

	EditMunicipalBoundaryTool.prototype._stopEditPolygon = function()
	{
		this._editToolbar.deactivate();

	};
	EditMunicipalBoundaryTool.prototype.deleteSelectedNode = function()
	{
		if ($(".bootbox").length && $(".bootbox").length > 0) return;
		var self = this;
		if (self._currentSelectedVertex && !self._currentSelectedVertex.vertexinfo.isGhost)
		{
			var graphic = self._currentSelectedVertex.graphic,
				attributes = graphic.attributes,
				oldRings = $.extend(true, [], graphic.geometry.rings),
				segmentIndex = self._currentSelectedVertex.vertexinfo.segmentIndex,
				pointIndex = self._currentSelectedVertex.vertexinfo.pointIndex,
				totalVertexes = graphic.geometry.rings[segmentIndex].length;
			if (totalVertexes <= 4)
			{
				tf.promiseBootbox.alert("There are three nodes associated with this parcel.  This node cannot be deleted.");
			}
			else
			{
				self._removePointHandler(pointIndex, segmentIndex, graphic);
				self._donutHandler(self._currentSelectedVertex, oldRings);
				var ids = {};
				ids[graphic.attributes.dataModel.id] = true;
				self._notifyEdit(ids);
				self._currentSelectedVertex = null;
			}
		}


	};
	EditMunicipalBoundaryTool.prototype._donutIntersectHandler = function(currentRings, oldRings)
	{
		var self = this, geometries = [], geometry = [], ps = [],
			ringWithCentroid = new self._arcgis.Polygon(self._map.spatialReference),
			newP = new self._arcgis.Polygon(self._map.spatialReference);

		var outrings = self._findOutterRing(oldRings);

		oldRings.map(function(ring, index)
		{
			var p = new self._arcgis.Polygon(self._map.spatialReference).addRing(currentRings[index]);

			if (self._equalsAnyRing(ring, outrings))
			{
				ringWithCentroid.addRing(currentRings[index]);//bugs when self-intersecting polygons
			}
			else
			{
				ps.push(p);
			}
		});



		ps.map(function(el, index)
		{
			if (!self._arcgis.geometryEngine.contains(ringWithCentroid, el) && !self._arcgis.geometryEngine.contains(el, ringWithCentroid) && self._arcgis.geometryEngine.intersects(ringWithCentroid, el) && !self.drawTool._isTouches(ringWithCentroid, el, oldRings))
			{
				ringWithCentroid = self._arcgis.geometryEngine.difference(ringWithCentroid, el);
			}
			else
			{
				newP.addRing(el.rings[0]);
			}
		});
		ringWithCentroid.rings.map(function(r)
		{
			newP.addRing(r);
		})

		return newP;
	}
	EditMunicipalBoundaryTool.prototype._equalsAnyRing = function(ring, outrings)
	{
		var self = this, equal = false;
		outrings.map(function(or)
		{
			var polygonI = new self._arcgis.Polygon(self._map.spatialReference).addRing(ring);
			var polygonJ = new self._arcgis.Polygon(self._map.spatialReference).addRing(or);
			if (self._arcgis.geometryEngine.contains(polygonI, polygonJ) && self._arcgis.geometryEngine.contains(polygonJ, polygonI))
			{
				equal = true;
			}
		});
		return equal;
	}
	EditMunicipalBoundaryTool.prototype._findOutterRing = function(rings)
	{
		var self = this, geometries = [];
		for (var i = 0; i < rings.length; i++)
		{
			var polygon = new self._arcgis.Polygon(self._map.spatialReference);
			polygon.addRing(rings[i]);
			geometries.push(self._arcgis.geometryEngine.simplify(polygon));

		}
		var resultGeometry = self._arcgis.geometryEngine.union(geometries);
		return resultGeometry.rings;

	}
	EditMunicipalBoundaryTool.prototype._isRingsIntersect = function(rings)
	{
		var self = this;
		var outRings = self._findOutterRing(rings);
		var outPolygons = outRings.map(function(r) { return self._arcgis.Polygon(self._map.spatialReference).addRing(r); })
		if (self._combineTouchedPolygons(outPolygons).length > 1) return false;
		else return true;
	};
	EditMunicipalBoundaryTool.prototype.seperatePolygon = function(geometry)
	{
		var self = this, geometries = [], resultPolygons = [];
		var rings = geometry.rings;
		var resultRings = self._findOutterRing(rings);
		for (var i = 0; i < resultRings.length; i++)
		{
			var polygon = new self._arcgis.Polygon(self._map.spatialReference);
			polygon.addRing(resultRings[i]);
			for (var j = 0; j < rings.length; j++)
			{
				var polygonJ = new self._arcgis.Polygon(self._map.spatialReference);
				polygonJ.addRing(rings[j]);
				if (self._arcgis.geometryEngine.contains(polygon, polygonJ) && !self._arcgis.geometryEngine.contains(polygonJ, polygon))
				{
					polygon.addRing(rings[j]);
				}
			}

			resultPolygons.push(self._arcgis.geometryEngine.simplify(polygon));
		}
		return self._combineTouchedPolygons(resultPolygons);
	};
	EditMunicipalBoundaryTool.prototype._combineTouchedPolygons = function(polygons)
	{
		var self = this, resultPolygons = [polygons[0]], rings = [];
		polygons.map(function(p)
		{
			p.rings.map(function(r) { rings.push(r); });

		})
		polygons.shift();
		polygons.map(function(p, index)
		{
			var istouch = false;
			resultPolygons.map(function(pr)
			{
				if (self._arcgis.geometryEngine.contains(pr, p) && self._arcgis.geometryEngine.contains(p, pr))
				{

				}
				else if (self.drawTool._isTouches(pr, p, rings))
				{
					p.rings.map(function(r)
					{
						pr.addRing(r);
						return;
					});
					istouch = true;
				}
			});
			if (!istouch)
			{
				resultPolygons.push(p);
			}

		});
		return resultPolygons;
	}
	EditMunicipalBoundaryTool.prototype._donutFunc = function(graphic, oldRings)
	{
		var self = this;
		graphic.setGeometry(self._donutIntersectHandler(graphic.geometry.rings, oldRings));
	}
	EditMunicipalBoundaryTool.prototype._removeOverlap = function(e, oldRings, type)
	{
		var self = this;
		var isMove = !e.info;
		if (($("#notallowreshape2").length && $("#notallowreshape2").length > 0) ||
			($("#checkboxsinglepointmoveparcel").length && $("#checkboxsinglepointmoveparcel").length > 0) ||
			($(".bootbox").length && $(".bootbox").length > 0)) { return; }

		//parcel completely falls inside another parcel after moving, show the alert message, and revert the parcel to original location.
		//parcel intersect with other parcels, and point also falls inside the intersect part, show the alert message, and revert the parcel to original location.
		var intersectGeometry = self.drawTool._intersectWithCurrentPolygons(e.graphic);
		//e.graphic.setGeometry(self._donutEditingHandler(centroid, e));
		if (!self.drawTool._allowOverlap)
		{
			if (self.drawTool._isContainedByCurrentPolygons(e.graphic))
			{
				self._overlapDialogBox().then(function()
				{
					var oldG;
					if (isMove)
					{
						oldG = new self._arcgis.Polygon(self._map.spatialReference);
						oldG.rings = oldRings ? oldRings : self._oldParcelRings;
					} else
					{
						oldG = self.drawTool._currentRightClickPolygon.geometry
					}
					e.graphic.setGeometry(oldG);
					//e.graphic.attributes.dataModel.geometry = oldG;
					var dataModel = self.drawTool.createCopyDataModel(e.graphic);
					self.stopEditing.notify([dataModel]);

					self._revertandNotifyTouchedGeometry(e);

					self.rightClickEdit(self.rightClickMode, self.drawTool._currentRightClickPolygon.attributes.dataModel.id);
					self.viewModel._viewModal.revertMode = "";
					self.viewModel._viewModal.revertData = [];
					self.drawTool.getDataModel().clearRevertInfo();
					return [];
				})
			}
			else if (intersectGeometry)
			{
				var g =new self._arcgis.Polygon(self._map.spatialReference);
				g.rings = e.graphic.geometry.rings;
				var cutResult = self._arcgis.geometryEngine.difference(g, intersectGeometry);
				//cutResult = self._cutResultHandler(cutResult, centroid.geometry);
				e.graphic.setGeometry(cutResult);
				self.rightClickEdit(self.rightClickMode, self.drawTool._currentRightClickPolygon.attributes.dataModel.id);

			}
		}
		return [];
	};
	EditMunicipalBoundaryTool.prototype._revertToOriginalPolygon = function()
	{
		var oldPolygon = new self._arcgis.Polygon(self._map.spatialReference);
		if (oldRings)
		{
			oldRings.map(function(ring)
			{
				oldPolygon.addRing(ring);
			});
			e.graphic.setGeometry(oldPolygon);
			//e.graphic.attributes.dataModel.geometry = e.graphic.geometry;
			var dataModel = self.drawTool.createCopyDataModel(e.graphic);
			self.stopEditing.notify([dataModel]);
			self._stopEditPolygon();
			self._startEditPolygon(type, e.graphic);

		}
	}

	EditMunicipalBoundaryTool.prototype._vertexMoveStopEvent = function(e)
	{
		if (!e.transform.dx && !e.transform.dy) return;
		var self = this, ids = [];

		if (!e.vertexinfo.isGhost)
		{
			e.vertexinfo.graphic.setSymbol(self._vertexSymbol);
		}
		e.graphic.setGeometry(self._arcgis.geometryEngine.simplify(e.graphic.geometry));
		self._moveDuplicateNodeStopEvent(e, "reshape");
		self._removeOverlap(e, self._oldParcelRings);
		// var result = self._donutHandler(e, self._oldParcelRings);

		ids[e.graphic.attributes.dataModel.id] = true;

		self._getTouchedCurrentGraphics(e).map(function(graphic)
		{
			if (e.graphic.attributes.dataModel.id != graphic.attributes.dataModel.id)
			{
				// 		result = result.concat(self._donutHandler({ graphic: graphic }, self._getTouchedGraphicOldRings(graphic)));
				if (JSON.stringify(graphic.geometry.rings) != JSON.stringify(self._getTouchedGraphicOldRings(graphic)))
				{
					ids[graphic.attributes.dataModel.id] = true;
				}
			}

		});
		self._notifyEdit(ids);
	};

	EditMunicipalBoundaryTool.prototype._vertexSymbolChange = function(e)
	{
		if (!e.vertexinfo.isGhost)
		{
			if (this._currentSelectedVertex)
			{
				this._currentSelectedVertex.vertexinfo.graphic.setSymbol(this._vertexSymbol);
			}
			e.vertexinfo.graphic.setSymbol(this._selectedVertexSymbol);
		}

	}




	EditMunicipalBoundaryTool.prototype._donutHandler = function(e, oldRings)
	{
		var self = this,
			graphic = e.graphic,
			attributes = graphic.attributes;
		if (graphic.geometry.rings.length > 1)
		{
			//handle cases when inner ring intersect with polygon after delete a node
			graphic.setGeometry(self._donutIntersectHandler(graphic.geometry.rings, oldRings));
			//handle cases when inner ring is not inside the polygon after delete a node
			self._donutOutsideHandler(graphic, oldRings);


		}
		var result = self._removeOverlap(e, oldRings, "reshape");
		//self._stopEditPolygon();
		self.rightClickEdit(self.rightClickMode, self.drawTool._currentRightClickPolygon.attributes.dataModel.id);
		//self._startEditPolygon("reshape", e.graphic);
		//attributes.dataModel.geometry = e.graphic.geometry;
		//self.stopEditing.notify([attributes.dataModel]);
		return result;
	}
	EditMunicipalBoundaryTool.prototype._donutOutsideHandler = function(graphic, oldRings)
	{
		var self = this;
		if (graphic.attributes.dataModel.type == "PopulationRegion" && graphic.geometry.rings.length > 1)
		{
			if (!self._isRingsIntersect(graphic.geometry.rings))
			{
				tf.promiseBootbox.alert("Population Region cannot be reshaped into multi-parts").then(function()
				{
					var oldPolygon = new self._arcgis.Polygon(self._map.spatialReference);
					if (oldRings)
					{
						oldRings.map(function(ring)
						{
							oldPolygon.addRing(ring);
						});
						graphic.setGeometry(oldPolygon);
						//graphic.attributes.dataModel.geometry = graphic.geometry;
						var dataModel = self.drawTool.createCopyDataModel(graphic);
						self.stopEditing.notify([dataModel]);
						self._stopEditPolygon();
						self._startEditPolygon("reshape", graphic);
						self._currentSelectedVertex = null;
						self.drawTool.getDataModel().clearRevertInfo();
					}

				});
			}
		}
	}
})();
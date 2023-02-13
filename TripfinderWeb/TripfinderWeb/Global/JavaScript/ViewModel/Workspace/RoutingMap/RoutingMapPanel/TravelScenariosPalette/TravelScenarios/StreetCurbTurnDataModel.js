(function()
{
	createNamespace("TF.RoutingMap.TravelScenariosPalette").StreetCurbTurnDataModel = StreetCurbTurnDataModel;
	var helper = TF.RoutingMap.MapEditingPalette.MyStreetsHelper;

	var curbUrl, turnUrl;
	function StreetCurbTurnDataModel(viewModal)
	{
		this._viewModal = viewModal;
		this.curbs = [];
		this.maneuvers = [];
		this.maneuversBackUp = [];
		curbUrl = arcgisUrls.MapEditingOneService + "/24";
		this.curbFeatureData = StreetCurbTurnDataModel.createCurbFeatureData(curbUrl);
		turnUrl = arcgisUrls.MapEditingOneService + "/";
		this.onControlChangeEvent = new TF.Events.Event();
		PubSub.subscribe("selected-travel-scenario-change" + this._viewModal.routeState, this.selectedTravelScenarioChanged.bind(this));
		PubSub.subscribe("travel-scenario-delete" + this._viewModal.routeState, this.travelScenarioDelete.bind(this));
		this.obSelfChangeCount = ko.observable(0);
		this.map = null;
	}

	StreetCurbTurnDataModel.prototype.init = function()
	{
		this.map = this._viewModal._map;
	};

	StreetCurbTurnDataModel.prototype.update = function(streetData, allStreets)
	{
		this.updateCurb(streetData);
		this.updateTurn(streetData, allStreets);
		this.calcSelfChangeCount();
	};

	StreetCurbTurnDataModel.prototype.updateCurb = function(streetData)
	{
		var self = this;
		if (self.travelScenario && streetData.maneuverInfo && streetData.maneuverInfo.curbInfo)
		{
			if (streetData.maneuverInfo.curbInfo.length == 0)
			{
				this.curbs.forEach(function(curb)
				{
					if (curb.StreetSegmentID == streetData.id || curb.StreetSegmentID == streetData.OBJECTID)
					{
						self.curbFeatureData.delete(curb);
					}
				});
			}
			streetData.maneuverInfo.curbInfo.forEach(function(curb)
			{
				curb.StreetSegmentID = streetData.OBJECTID || streetData.id;
				if (curb.Type == helper.curbApproachNull.type)
				{
					self.curbFeatureData.delete(curb);
				} else
				{
					self.setCurbGeometry(curb, streetData);
					if (curb.OBJECTID > 0)
					{
						self.curbFeatureData.update(curb);
					} else
					{
						self.curbFeatureData.add(curb);
					}
				}
			});
			self.curbs = self.curbFeatureData.mergeChange();
		}
	};

	StreetCurbTurnDataModel.prototype.updateTurn = function(streetData, allStreets)
	{
		var self = this;
		if (!self.travelScenario)
		{
			return;
		}
		this.updateManeuverGeometry(streetData, allStreets);
		if (streetData.maneuverInfo.maneuvers)
		{
			["red", "yellow"].forEach(function(status)
			{
				var feature = self[status + "TurnFeatureData"];
				feature.deleteItems = feature.deleteItems.filter(function(t)
				{
					return t.Edge1FID != (streetData.OBJECTID || streetData.id);
				});
				feature.deleteItems = feature.deleteItems.concat(self.maneuversBackUp.filter(function(t)
				{
					return t.Edge1FID == (streetData.OBJECTID || streetData.id) && t.oldStatus == status && t.OBJECTID > 0;
				}));
				feature.addItems = feature.addItems.filter(function(t)
				{
					return t.Edge1FID != (streetData.OBJECTID || streetData.id);
				});
			});
			var allMapping = self.getStreetDataModel().toMappingByObjectID(allStreets);
			streetData.maneuverInfo.maneuvers.forEach(function(turn)
			{
				turn.Edge1FID = streetData.OBJECTID || streetData.id;
				if (helper.getManeuverTouchPoint(turn, allMapping))
				{
					var featureData = self[turn.status + "TurnFeatureData"];
					if (turn.status != "null" && featureData)
					{
						turn.OBJECTID = 0;
						featureData.addItems.push(turn);
					}
				}
			});

			// refresh all maneuvers
			var maneuvers = [];
			["red", "yellow"].forEach(function(status)
			{
				var feature = self[status + "TurnFeatureData"];
				maneuvers = maneuvers.concat(feature.mergeChange());
			});
			self.maneuvers = maneuvers;
		}
		this.deleteUnTouchManeuver(allStreets);
	};

	StreetCurbTurnDataModel.prototype.revert = function(showMessage)
	{
		var self = this;
		self.getStreetDataModel()._confirmRelated("curbTurn", "revert").then((ans) =>
		{
			if (!ans)
			{
				return;
			}
			self.revertData();
			if (ans.indexOf("street") >= 0)
			{
				self.getStreetDataModel().revertData();
			}

			if (showMessage != false)
			{
				self._viewModal.obToastMessages.push({
					type: "success",
					content: "This record has been successfully reverted.",
					autoClose: true
				});
			}
		});
	};

	StreetCurbTurnDataModel.prototype.revertData = function()
	{
		this.clearControls();
		if (this.travelScenario)
		{
			return this.getCurbAndTurnData().then(() =>
			{
				this.calcSelfChangeCount();
			});
		}
	};

	StreetCurbTurnDataModel.prototype.unSaveCheck = function()
	{
		return Promise.resolve(this.obSelfChangeCount() > 0);
	};

	StreetCurbTurnDataModel.prototype.save = function()
	{
		return this.getStreetDataModel().save("curbTurn");
	};

	StreetCurbTurnDataModel.prototype.saveData = function(streetAddItems = [])
	{
		this.changeScenarioApproveStatus();
		if (!this.travelScenario)
		{
			return Promise.resolve();
		}

		let curbAddItemsEnumerable = Enumerable.From(this.curbFeatureData.addItems),
			redTurnAddItemsEnumerable = Enumerable.From(this.redTurnFeatureData.addItems),
			yellowTurnAddItemsEnumerable = Enumerable.From(this.yellowTurnFeatureData.addItems);
		streetAddItems.forEach(function(street)
		{
			let curb = curbAddItemsEnumerable.FirstOrDefault({}, "$.StreetSegmentID==" + street.id);
			curb.StreetSegmentID = street.OBJECTID;
			let redTurn = redTurnAddItemsEnumerable.FirstOrDefault({}, "$.Edge1FID==" + street.id);
			redTurn.Edge1FID = street.OBJECTID;
			let redTurn2 = redTurnAddItemsEnumerable.FirstOrDefault({}, "$.Edge2FID==" + street.id);
			redTurn2.Edge2FID = street.OBJECTID;
			let yellowTurn = yellowTurnAddItemsEnumerable.FirstOrDefault({}, "$.Edge1FID==" + street.id);
			yellowTurn.Edge1FID = street.OBJECTID;
			let yellowTurn2 = yellowTurnAddItemsEnumerable.FirstOrDefault({}, "$.Edge2FID==" + street.id);
			yellowTurn2.Edge2FID = street.OBJECTID;
		});
		return Promise.all([this.curbFeatureData.save(), this.redTurnFeatureData.save(), this.yellowTurnFeatureData.save()]).then(() =>
		{
			this.calcSelfChangeCount();
		});
	};

	StreetCurbTurnDataModel.prototype.getRelateStreetIds = function()
	{
		var streetIds = new Set();
		_.flatten([this.curbFeatureData.addItems, this.curbFeatureData.updateItems, this.curbFeatureData.deleteItems]).forEach((item) =>
		{
			streetIds.add(item.StreetSegmentID);
		});
		_.flatten([this.redTurnFeatureData.addItems, this.redTurnFeatureData.updateItems, this.redTurnFeatureData.deleteItems,
		this.yellowTurnFeatureData.addItems, this.yellowTurnFeatureData.updateItems, this.yellowTurnFeatureData.deleteItems]).forEach((item) =>
		{
			streetIds.add(item.Edge1FID);
			streetIds.add(item.Edge2FID);
		});

		return Array.from(streetIds);
	};

	StreetCurbTurnDataModel.prototype.changeScenarioApproveStatus = function()
	{
		var self = this;
		if (self.travelScenario.Approve != -1 && (self.curbFeatureData.addItems.length != 0 ||
			self.curbFeatureData.deleteItems.length != 0 ||
			self.curbFeatureData.updateItems.length != 0 ||
			self.redTurnFeatureData.addItems.length != 0 ||
			self.redTurnFeatureData.deleteItems.length != 0 ||
			self.redTurnFeatureData.updateItems.length != 0 ||
			self.yellowTurnFeatureData.addItems.length != 0 ||
			self.yellowTurnFeatureData.deleteItems.length != 0 ||
			self.yellowTurnFeatureData.updateItems.length != 0))
		{

			tf.promiseAjax.patch(pathCombine(tf.api.apiPrefixWithoutDatabase(), "travelscenarios"), {
				data: [
					{ "op": "replace", "path": "/Approve", "value": 0 },
				],
				paramData: {
					id: self.travelScenario.Id
				}
			});
			PubSub.publish("ScenarioApproveStatusChange");
		}
	};

	StreetCurbTurnDataModel.getRedTurnUrl = function(travelScenario)
	{
		return turnUrl + travelScenario.ProhibitedId;
	};

	StreetCurbTurnDataModel.prototype.setTurnFeatureData = function()
	{
		var travelScenario = this.travelScenario;
		this.redTurnFeatureData = StreetCurbTurnDataModel.createTurnFeatureData(StreetCurbTurnDataModel.getRedTurnUrl(travelScenario), "red");
		this.redTurnFeatureData.getChangeDataArray = this.getChangeDataArray("red", this.redTurnFeatureData);
		this.yellowTurnFeatureData = StreetCurbTurnDataModel.createTurnFeatureData(turnUrl + travelScenario.RestrictedId, "yellow");
		this.yellowTurnFeatureData.getChangeDataArray = this.getChangeDataArray("yellow", this.yellowTurnFeatureData);
	};

	StreetCurbTurnDataModel.prototype.getCurbAndTurnData = function()
	{
		var self = this;
		var travelScenario = this.travelScenario;
		if (!travelScenario)
		{
			return Promise.resolve();
		}
		return self.curbFeatureData.query({
			where: " ScenarioId = " + travelScenario.Id
		}).then(function(items)
		{
			self.curbs = items;
		}).then(function()
		{
			return Promise.all([self.redTurnFeatureData.query(), self.yellowTurnFeatureData.query()]);
		}).then(function(items)
		{
			self.calcSelfChangeCount();
			if (items)
			{
				self.maneuvers = items[0].concat(items[1]);
				self.maneuversBackUp = self.maneuvers.slice(0);
				self.onControlChangeEvent.notify();
			}
		});
	};

	StreetCurbTurnDataModel.prototype.getCurbData = function(travelScenario)
	{
		var self = this;
		if (!travelScenario) travelScenario = this.travelScenario;
		if (!travelScenario)
		{
			return Promise.resolve();
		}
		return self.curbFeatureData.query({
			where: " ScenarioId = " + travelScenario.Id
		}).then(function(items)
		{
			self.curbs = items;
		}, () => { });
	};

	StreetCurbTurnDataModel.prototype.isShow = function()
	{
		return this._viewModal.travelScenariosPaletteViewModel.obShow();
	};

	StreetCurbTurnDataModel.prototype.selectedTravelScenarioChanged = function(e, travelScenario)
	{
		var self = this;
		if (!travelScenario)
		{
			self.curbs = [];
			self.maneuvers = [];
			self.maneuversBackUp = [];
			self.travelScenario = null;
			if (self.isShow())
			{
				self.clearControls();
				self.calcSelfChangeCount();
			}
			return;
		}

		if (!this.travelScenario || this.travelScenario.Id != travelScenario.Id)
		{
			this.travelScenario = travelScenario;
			this.setTurnFeatureData();
			if (self.isShow())
			{
				this.clearControls();
				this.getCurbAndTurnData().then(function()
				{
					self.calcSelfChangeCount();
				}).catch(function(error)
				{
					TF.consoleOutput("error", "StreetCurbTurnDataModel selectedTravelScenarioChanged:" + error);
				});
			}
		}
	};

	StreetCurbTurnDataModel.createTurnFeatureData = function(url, type)
	{
		return new TF.RoutingMap.FeatureDataModel({
			url: url,
			convertToData: item =>
			{
				var dataModel = StreetCurbTurnDataModel.getTurnDataModel();
				var data = $.extend({}, dataModel);
				for (var key in dataModel)
				{
					data[key] = item.attributes[key];
				}
				data.id = data.OBJECTID;
				data.geometry = item.geometry;
				data.status = type;
				data.oldStatus = type;
				return data;
			},
			convertToFeatureData: function(item)
			{
				return StreetCurbTurnDataModel.convertDataToFeaterLayerData(item);
			}
		});
	};

	StreetCurbTurnDataModel.createCurbFeatureData = function(url)
	{
		return new TF.RoutingMap.FeatureDataModel({
			url: url,
			convertToData: function(item)
			{
				var data = StreetCurbTurnDataModel.getCurbDataModel();
				for (var key in data)
				{
					data[key] = item.attributes[key];
				}
				data.id = data.OBJECTID;
				data.geometry = item.geometry;
				return data;
			},
			convertToFeatureData: function(item)
			{
				return StreetCurbTurnDataModel.convertDataToFeaterLayerData(item);
			}
		});
	};

	StreetCurbTurnDataModel.convertDataToFeaterLayerData = function(item)
	{
		return new tf.map.ArcGIS.Graphic(item.geometry, null, item);
	};

	StreetCurbTurnDataModel.prototype.createCurb = function(street, type, sideOfStreet)
	{
		var curb = {
			id: TF.createId(),
			OBJECTID: 0,
			Type: type,
			SideOfStreet: sideOfStreet,
			StreetSegmentID: street.OBJECTID,
			ClientKey: tf.authManager.clientKey,
			ScenarioId: this.travelScenario.Id
		};
		this.setCurbGeometry(curb, street);
		return curb;
	};

	StreetCurbTurnDataModel.prototype.setCurbGeometry = function(curb, street)
	{
		if (street)
		{
			var middleIndex = Math.ceil(street.geometry.paths[0].length / 2);
			curb.geometry = new tf.map.ArcGIS.Point({
				x: street.geometry.paths[0][middleIndex][0],
				y: street.geometry.paths[0][middleIndex][1],
				spatialReference: this.map.mapView.spatialReference
			});
		}
	};

	StreetCurbTurnDataModel.prototype.travelScenarioDelete = function(e, travelScenario)
	{
		StreetCurbTurnDataModel.deleteTurnAndCurbOnTravelScenario(travelScenario).then(() =>
		{
			if (this.travelScenario && this.travelScenario.Id == travelScenario.Id)
			{
				this.travelScenario = null;
				this.curbs = [];
				this.maneuvers = [];
				this.onControlChangeEvent.notify();
				this.maneuversBackUp = [];
			}
		});
	};

	StreetCurbTurnDataModel.prototype.deleteInOtherScenarios = function(streetIds)
	{
		if (!streetIds || !streetIds.length)
		{
			return Promise.resolve(false);
		}

		let streetsText = streetIds.join(","),
			curbFeatureData = StreetCurbTurnDataModel.createCurbFeatureData(curbUrl),
			curbQuery = curbFeatureData.query({ where: `ScenarioId <> ${this.travelScenario.Id} and StreetSegmentID in (${streetsText})` }),
			queries = [curbQuery],
			turnFeatures = [];
		for (let i = 0; i < 12; i++)
		{
			if (i === this.travelScenario.Id)
			{
				continue;
			}

			let redTurnFeatureData = StreetCurbTurnDataModel.createTurnFeatureData(turnUrl + i, "red"),
				yellowTurnFeatureData = StreetCurbTurnDataModel.createTurnFeatureData(turnUrl + (i + 12), "yellow"),
				where = `Edge1FID in (${streetsText}) or Edge2FID in (${streetsText})`;
			turnFeatures.push(redTurnFeatureData);
			turnFeatures.push(yellowTurnFeatureData);
			queries.push(redTurnFeatureData.query({ where: where }));
			queries.push(yellowTurnFeatureData.query({ where: where }));
		}

		return Promise.all(queries).then(items =>
		{
			let changed = [],
				curbResult = items.shift();
			if (curbResult.length)
			{
				changed.push(curbFeatureData);
			}

			curbResult.forEach(t =>
			{
				curbFeatureData.delete(t);
			});

			items.forEach((turnResult, index) =>
			{
				if (!turnResult.length)
				{
					return;
				}

				let turnFeatureData = turnFeatures[index];
				changed.push(turnFeatureData);
				turnResult.forEach(t =>
				{
					turnFeatureData.delete(t);
				});
			});

			return Promise.all(changed.map(i => i.save())).then(() => !!changed.length);
		});
	};

	StreetCurbTurnDataModel.deleteTurnAndCurbOnTravelScenario = function(travelScenario)
	{
		var curbFeatureData = StreetCurbTurnDataModel.createCurbFeatureData(curbUrl);
		var redTurnFeatureData = StreetCurbTurnDataModel.createTurnFeatureData(StreetCurbTurnDataModel.getRedTurnUrl(travelScenario), "red");
		var yellowTurnFeatureData = StreetCurbTurnDataModel.createTurnFeatureData(turnUrl + travelScenario.RestrictedId, "yellow");
		return Promise.all([curbFeatureData.query({
			where: " ScenarioId = " + travelScenario.Id
		}), redTurnFeatureData.query(), yellowTurnFeatureData.query()]).then(items =>
		{
			let changed = false;
			items[0].forEach(function(t)
			{
				curbFeatureData.delete(t);
				changed = true;
			});
			items[1].forEach(function(t)
			{
				redTurnFeatureData.delete(t);
				changed = true;
			});
			items[2].forEach(function(t)
			{
				yellowTurnFeatureData.delete(t);
				changed = true;
			});
			return Promise.all([curbFeatureData.save(), redTurnFeatureData.save(), yellowTurnFeatureData.save()]).then(() => changed);
		});
	};

	StreetCurbTurnDataModel.getCurbDataModel = function()
	{
		return {
			id: "",
			OBJECTID: "",
			Type: "",
			SideOfStreet: "",
			StreetSegmentID: "",
			ClientKey: "",
			ScenarioId: 0,
			geometry: null
		};
	};

	// #region turn
	StreetCurbTurnDataModel.prototype.createTurn = function(street, toStreet, status, isStart)
	{
		var data = StreetCurbTurnDataModel.getTurnDataModel();
		data.OBJECTID = 0;
		data.id = TF.createId();
		data.Edge1End = isStart ? "N" : "Y";
		data.Edge1FCID = window.streetFCID;
		data.Edge1FID = street.OBJECTID || street.id;
		data.Edge1Pos = 0.5;
		data.Edge2FCID = window.streetFCID;
		data.Edge2FID = toStreet.OBJECTID || toStreet.id;
		data.Edge2Pos = 0.5;
		data.status = status;
		this.setTurnGeometry(data, street, toStreet);
		return data;
	};

	StreetCurbTurnDataModel.prototype.setTurnGeometry = function(turn, street, toStreet)
	{

		if (street && toStreet)
		{
			var middlePointFrom = helper.calculateMiddlePos(street.geometry.paths[0], this.map).middlePos;
			var middlePointTo = helper.calculateMiddlePos(toStreet.geometry.paths[0], this.map).middlePos;
			turn.geometry = new tf.map.ArcGIS.Polyline({
				paths: [
					[
						[middlePointFrom.x, middlePointFrom.y],
						[middlePointTo.x, middlePointTo.y]
					]
				],
				spatialReference: this.map.mapView.spatialReference
			});
		}
	};

	StreetCurbTurnDataModel.getTurnDataModel = function()
	{
		return {
			OBJECTID: "",
			id: "",
			Edge1End: "",
			Edge1FCID: "",
			Edge1FID: "",
			Edge1Pos: "",
			Edge2FCID: "",
			Edge2FID: "",
			Edge2Pos: "",
			geometry: null
		};
	};
	// #endregion

	StreetCurbTurnDataModel.prototype.refreshOtherChangeData = function(refreshIds)
	{
		var self = this;
		if (!self.travelScenario)
		{
			return Promise.resolve();
		}
		if (!refreshIds || refreshIds.length == 0)
		{
			return Promise.resolve();
		}
		var refreshIdsEnumerable = Enumerable.From(refreshIds);
		self.curbFeatureData.query({
			where: " ScenarioId = " + self.travelScenario.Id + " and StreetSegmentID  in (" + refreshIds.join(",") + ")"
		}).then(function(items)
		{
			var curbs = Enumerable.From(self.curbs).Where(function(c)
			{
				return !refreshIdsEnumerable.Any(function(t)
				{
					return t == c.StreetSegmentID;
				});
			}).ToArray();
			self.curbs = curbs.concat(items);
		}).then(function()
		{
			return Promise.all([self.redTurnFeatureData.query({
				where: "Edge1FID in (" + refreshIds.join(",") + ")"
			}), self.yellowTurnFeatureData.query({
				where: "Edge1FID in (" + refreshIds.join(",") + ")"
			})]);
		}).then(function(items)
		{
			var maneuvers = Enumerable.From(self.maneuvers).Where(function(c)
			{
				return !refreshIdsEnumerable.Any(function(t)
				{
					return t == c.Edge1FID;
				});
			}).ToArray();
			self.maneuvers = maneuvers.concat(items[0]).concat(items[1]);
			self.maneuversBackUp = self.maneuvers.slice(0);
			self.onControlChangeEvent.notify();
		});
	};

	StreetCurbTurnDataModel.prototype.getChangeDataArray = function(type)
	{
		return function()
		{
			var deleteItemsEnumerable = Enumerable.From(this.deleteItems).Distinct(function(c)
			{
				return c.OBJECTID;
			}).Where(function(c)
			{
				return c.OBJECTID > 0 && c.oldStatus == type;
			});
			var addItemsEnumerable = Enumerable.From(this.addItems);
			return {
				add: addItemsEnumerable.ToArray(),
				edit: [],
				delete: deleteItemsEnumerable.ToArray()
			};
		};
	};

	StreetCurbTurnDataModel.prototype.deleteUnTouchManeuver = function(allStreets)
	{
		var self = this;
		var streetChangeIds = this.getStreetDataModel().getChangeStreetRealIds();
		var allMapping = this.getStreetDataModel().toMappingByObjectID(allStreets);
		for (var i = 0; i < this.maneuvers.length; i++)
		{
			var maneuver = this.maneuvers[i];
			if ((streetChangeIds.has(maneuver.Edge1FID) || streetChangeIds.has(maneuver.Edge2FID)) && !helper.getManeuverTouchPoint(maneuver, allMapping))
			{
				var featureData = maneuver.oldStatus == "red" ? self.redTurnFeatureData : self.yellowTurnFeatureData;
				featureData.delete(maneuver);
				this.maneuvers.splice(i, 1);
				i--;
			}
		}
	};

	StreetCurbTurnDataModel.prototype.getStreetDataModel = function()
	{
		return this._viewModal.mapEditingPaletteViewModel.myStreetsViewModel.dataModel;
	};

	StreetCurbTurnDataModel.prototype.updateManeuverGeometry = function(street, allStreets)
	{
		var self = this;
		var allMapping = self.getStreetDataModel().toMappingByObjectID(allStreets);
		for (var i = 0; i < this.maneuvers.length; i++)
		{
			var maneuver = this.maneuvers[i];
			if (maneuver.Edge1FID == (street.OBJECTID || street.id) || maneuver.Edge2FID == (street.OBJECTID || street.id))
			{
				var fromStreet = allMapping[maneuver.Edge1FID];
				var toStreet = allMapping[maneuver.Edge2FID];
				self.setTurnGeometry(maneuver, fromStreet, toStreet);
			}
		}
	};

	StreetCurbTurnDataModel.prototype.deleteCurb = function(street)
	{
		var self = this;
		for (var i = 0; i < this.curbs.length; i++)
		{
			var curb = this.curbs[i];
			if (curb.StreetSegmentID == street.id || curb.StreetSegmentID == street.OBJECTID)
			{
				self.curbFeatureData.delete(curb);
				this.curbs.splice(i, 1);
				i--;
			}
		}
	};

	StreetCurbTurnDataModel.prototype.deleteManeuver = function(street)
	{
		var self = this;
		for (var i = 0; i < this.maneuvers.length; i++)
		{
			var maneuver = this.maneuvers[i];
			if (maneuver.Edge2FID == (street.OBJECTID || street.id) || maneuver.Edge1FID == (street.OBJECTID || street.id))
			{
				var featureData = maneuver.oldStatus == "red" ? self.redTurnFeatureData : self.yellowTurnFeatureData;
				featureData.delete(maneuver);
				this.maneuvers.splice(i, 1);
				i--;
			}
		}
	};

	StreetCurbTurnDataModel.prototype.clearUI = function()
	{
		this.onControlChangeEvent.notify();
		// TODO: uncomment the following line if map editing palette is added
		// var streetViewModel = this._viewModal.mapEditingPaletteViewModel.myStreetsViewModel;
		// streetViewModel.editModal.closeEditModal();
		// streetViewModel.drawTool && streetViewModel.drawTool.stop();
		PubSub.publish("clear_ContextMenu_Operation");
	};

	StreetCurbTurnDataModel.prototype.clearControls = function()
	{
		this.redTurnFeatureData && this.redTurnFeatureData.clear();
		this.yellowTurnFeatureData && this.yellowTurnFeatureData.clear();
		this.curbFeatureData.clear();
		this.maneuvers = [];
		this.curbs = [];
		this.obSelfChangeCount(0);
		this.clearUI();
	};

	StreetCurbTurnDataModel.prototype.calcSelfChangeCount = function()
	{
		var self = this;
		var curbChangeIds = [];
		var redChangeIds = [];
		var yellowChangeIds = [];
		if (this.travelScenario)
		{
			curbChangeIds = getChangeStreet(this.curbFeatureData, "StreetSegmentID");
			redChangeIds = getTurnChangeStreet(this.redTurnFeatureData);
			yellowChangeIds = getTurnChangeStreet(this.yellowTurnFeatureData);
		}
		self.setNeedRebuild(curbChangeIds, redChangeIds, yellowChangeIds);
		var changeIds = Enumerable.From(curbChangeIds.concat(redChangeIds).concat(yellowChangeIds)).Distinct().ToArray();
		this.obSelfChangeCount(changeIds.length);

		function getChangeStreet(featureData, streetIdKey)
		{
			var changeData = featureData.getChangeData();
			var changeIds = [];
			[changeData.addGraphic, changeData.editGraphic, changeData.deleteGraphic].forEach(function(c)
			{
				c.forEach(function(t)
				{
					changeIds.push(t.attributes[streetIdKey]);
				});
			});
			return changeIds;
		}

		function getTurnChangeStreet(featureData)
		{
			var streetIds = [];
			if (featureData.addItems.length == 0 && featureData.deleteItems.length == 0)
			{
				return streetIds;
			}

			function exists(sources, item)
			{
				for (var i = 0; i < sources.length; i++)
				{
					if (sources[i].Edge1FID == item.Edge1FID && sources[i].Edge2FID == item.Edge2FID)
					{
						return true;
					}
				}
			}
			featureData.addItems.forEach(function(t)
			{
				if (!exists(featureData.deleteItems, t))
				{
					streetIds.push(t.Edge1FID);
				}
			});
			featureData.deleteItems.forEach(function(t)
			{
				if (!exists(featureData.addItems, t))
				{
					streetIds.push(t.Edge1FID);
				}
			});
			return streetIds;
		}
	};

	StreetCurbTurnDataModel.prototype.setNeedRebuild = function(curbChangeIds, redChangeIds, yellowChangeIds)
	{
		var self = this;
		if (curbChangeIds.length > 0 ||
			redChangeIds.length > 0 ||
			yellowChangeIds.length > 0)
		{
			self.needRebuildTurn = true;
			return;
		}
		self.needRebuildTurn = false;
	};

	StreetCurbTurnDataModel.travelScenarioCopy = function(copyInfo)
	{
		return StreetCurbTurnDataModel.deleteTurnAndCurbOnTravelScenario(copyInfo.NewScenario).then(deleted =>
		{
			var curbFeatureData = StreetCurbTurnDataModel.createCurbFeatureData(curbUrl);
			var redTurnFeatureDataFrom = StreetCurbTurnDataModel.createTurnFeatureData(StreetCurbTurnDataModel.getRedTurnUrl({ ProhibitedId: copyInfo.copyFromScenario.prohibitedId() }), "red");
			var yellowTurnFeatureDataFrom = StreetCurbTurnDataModel.createTurnFeatureData(turnUrl + copyInfo.copyFromScenario.restrictedId(), "yellow");
			return Promise.all([curbFeatureData.query({
				where: " ScenarioId = " + copyInfo.copyFromScenario.id()
			}), redTurnFeatureDataFrom.query(), yellowTurnFeatureDataFrom.query()]).then(items =>
			{
				let redTurnFeatureDataTo = StreetCurbTurnDataModel.createTurnFeatureData(StreetCurbTurnDataModel.getRedTurnUrl(copyInfo.NewScenario), "red"),
					yellowTurnFeatureDataTo = StreetCurbTurnDataModel.createTurnFeatureData(turnUrl + copyInfo.NewScenario.RestrictedId, "yellow"),
					added = false;
				items[0].forEach(function(t)
				{
					t.ScenarioId = copyInfo.NewScenario.Id;
					t.OBJECTID = 0;
					curbFeatureData.addItems.push(t);
					added = true;
				});
				items[1].forEach(function(t)
				{
					t.OBJECTID = 0;
					redTurnFeatureDataTo.addItems.push(t);
					added = true;
				});
				items[2].forEach(function(t)
				{
					t.OBJECTID = 0;
					yellowTurnFeatureDataTo.addItems.push(t);
					added = true;
				});
				return Promise.all([curbFeatureData.save(), redTurnFeatureDataTo.save(), yellowTurnFeatureDataTo.save()]).then(() => deleted || added);
			});
		});
	};

	StreetCurbTurnDataModel.prototype.dispose = function()
	{
		this.onControlChangeEvent.unsubscribeAll();
		this.redTurnFeatureData && this.redTurnFeatureData.dispose();
		this.yellowTurnFeatureData && this.yellowTurnFeatureData.dispose();
		this.curbFeatureData && this.curbFeatureData.dispose();
		this.maneuvers = null;
		this.maneuversBackUp = null;
		this.curbs = null;
	};

})();

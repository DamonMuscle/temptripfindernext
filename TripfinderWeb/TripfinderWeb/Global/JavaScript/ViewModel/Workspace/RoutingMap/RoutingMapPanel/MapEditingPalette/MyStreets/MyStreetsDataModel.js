(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").MyStreetsDataModel = MyStreetsDataModel;
	var helper = TF.RoutingMap.MapEditingPalette.MyStreetsHelper;

	function MyStreetsDataModel(viewModel)
	{
		var self = this;
		self.viewModel = viewModel;
		self._viewModal = viewModel.viewModel._viewModal;
		self.all = [];
		self.highlighted = [];
		self.selected = [];
		self.streetChangeIds = new Set();
		self.map = null;
		this.onAllChangeEvent = new TF.Events.Event();
		this.highlightChangedEvent = new TF.Events.Event();
		this.selectedChangedEvent = new TF.Events.Event();
		this.settingChangeEvent = new TF.Events.Event();
		this.afterStreetInitializedEvent = new TF.Events.Event();
		this.onStreetModifyEvent = new TF.Events.Event();

		this.curbTurnDataModel = self._viewModal.travelScenariosPaletteViewModel.travelScenariosViewModel.streetCurbTurnDataModel;
		this.myStreetsCurbTurnDataModel = new TF.RoutingMap.TravelScenariosPalette.StreetCurbTurnDataModel(this._viewModal);

		this.streetInitialized = false;
		this.streetUrl = arcgisUrls.MapEditingOneService + "/43";
		this.streetsFeatureData = this.createStreetsFeatureData(this.streetUrl);

		this.rebuildUrl = arcgisUrls.TFUtilitiesGPService + "/Build%20Network";
		this.fileGDBUpdateUrl = arcgisUrls.TFUtilitiesGPService + "/GDBLayerUpdate";

		this.streetsLockData = new TF.RoutingMap.LockData({
			type: function()
			{
				return "myStreets";
			},
			displayName: "My Streets",
			featureData: this.streetsFeatureData,
			viewModel: this.viewModel.viewModel,
			refreshOtherChangeData: this.refreshOtherChangeData.bind(this)
		});
		this.streetsLockData.calcSelfChangeCount = this.calcSelfChangeCount.bind(this);
		this.travelScenario = null;
		self.isSaving = false;
		PubSub.subscribe("MapCanvasPublishedHub", self._streetApprovePublished.bind(self));
		this.streetsFields = [
			{
				"name": "OBJECTID",
				"type": "esriFieldTypeOID",
				"alias": "OBJECTID"
			},
			{
				"name": "Street",
				"type": "esriFieldTypeString",
				"alias": "Street",
				"length": 255
			},
			{
				"name": "Fromleft",
				"type": "esriFieldTypeString",
				"alias": "Fromleft",
				"length": 255
			},
			{
				"name": "Toleft",
				"type": "esriFieldTypeString",
				"alias": "Toleft",
				"length": 255
			},
			{
				"name": "Fromright",
				"type": "esriFieldTypeString",
				"alias": "Fromright",
				"length": 255
			},
			{
				"name": "Toright",
				"type": "esriFieldTypeString",
				"alias": "Toright",
				"length": 255
			},
			{
				"name": "GroupID",
				"type": "esriFieldTypeDouble",
				"alias": "GroupID"
			},
			{
				"name": "Speedleft",
				"type": "esriFieldTypeInteger",
				"alias": "Speedleft"
			},
			{
				"name": "Speedright",
				"type": "esriFieldTypeInteger",
				"alias": "Speedright"
			},
			{
				"name": "TraversableByVehicle",
				"type": "esriFieldTypeString",
				"alias": "TraversableByVehicle",
				"length": 255
			},
			{
				"name": "TraversableByWalkers",
				"type": "esriFieldTypeString",
				"alias": "TraversableByWalkers",
				"length": 255
			},
			{
				"name": "Style",
				"type": "esriFieldTypeString",
				"alias": "Style",
				"length": 255
			},
			{
				"name": "Cfcc",
				"type": "esriFieldTypeString",
				"alias": "Cfcc",
				"length": 255
			},
			{
				"name": "Oneway",
				"type": "esriFieldTypeString",
				"alias": "Oneway",
				"length": 255
			},
			{
				"name": "PostedLeft",
				"type": "esriFieldTypeInteger",
				"alias": "PostedLeft"
			},
			{
				"name": "PostedRight",
				"type": "esriFieldTypeInteger",
				"alias": "PostedRight"
			},
			{
				"name": "RoadClass",
				"type": "esriFieldTypeInteger",
				"alias": "RoadClass"
			},
			{
				"name": "Lock",
				"type": "esriFieldTypeString",
				"alias": "Lock",
				"length": 255
			},
			{
				"name": "Fow",
				"type": "esriFieldTypeSmallInteger",
				"alias": "Fow"
			},
			{
				"name": "FromElevation",
				"type": "esriFieldTypeSmallInteger",
				"alias": "FromElevation"
			},
			{
				"name": "ToElevation",
				"type": "esriFieldTypeSmallInteger",
				"alias": "ToElevation"
			},
			{
				"name": "HeightClearance",
				"type": "esriFieldTypeDouble",
				"alias": "HeightClearance"
			},
			{
				"name": "WeightLimit",
				"type": "esriFieldTypeDouble",
				"alias": "WeightLimit"
			},
			{
				"name": "LocalId",
				"type": "esriFieldTypeString",
				"alias": "LocalId",
				"length": 255
			},
			{
				"name": "City",
				"type": "esriFieldTypeString",
				"alias": "City",
				"length": 255
			},
			{
				"name": "State",
				"type": "esriFieldTypeString",
				"alias": "State",
				"length": 255
			},
			{
				"name": "LeftPostalCode",
				"type": "esriFieldTypeString",
				"alias": "LeftPostalCode",
				"length": 255
			},
			{
				"name": "RightPostalCode",
				"type": "esriFieldTypeString",
				"alias": "RightPostalCode",
				"length": 255
			},
			{
				"name": "ProhibitCrosser",
				"type": "esriFieldTypeSmallInteger",
				"alias": "ProhibitCrosser"
			},
			{
				"name": "LENGTH_GEO",
				"type": "esriFieldTypeDouble",
				"alias": "LENGTH_GEO"
			}
		];
	}

	MyStreetsDataModel.prototype.init = function()
	{
		var self = this;
		self.map = self.viewModel.viewModel._viewModal._map;
		self.loadedExtent = null;
		self.all = [];
		self.streetChangeIds = new Set();
		this.closed = false;
		return self.streetsLockData.init()
			.then(function()
			{
				if (self.isShow())
				{
					self.viewModel.drawTool && self.viewModel.drawTool.displayGraphicInExtent();
					self.viewModel.myStreetsDisplay.setFooterDisplay();
					return self.curbTurnDataModel.getCurbAndTurnData();
				}
			});
	};

	MyStreetsDataModel.prototype.isShow = function()
	{
		var showInfo = this.viewModel.showMode();
		return showInfo.mapEditing || showInfo.travelScenario;
	};

	MyStreetsDataModel.prototype.getCount = function()
	{
		var self = this;
		if (!self.count)
		{
			return TF.StreetHelper.getStreetCount().then(function(count)
			{
				self.count = count;
				return count;
			});
		}

		return Promise.resolve(self.count + self.streetsFeatureData.addItems.length - Enumerable.From(self.streetsFeatureData.deleteItems).Count(function(c) { return c.OBJECTID > 0; }));
	};

	MyStreetsDataModel.prototype.getDataInExtent = function(extent)
	{
		var self = this;
		if (!self.map) self.map = self._viewModal._map;
		if (self.map.mapView.zoom < self.viewModel.drawTool.minZoom)
		{
			return Promise.resolve();
		}
		if (self.loadedExtent && tf.map.ArcGIS.geometryEngine.contains(self.loadedExtent, extent))
		{
			self.viewModel.controlDisplay.extentChangeEvent();
			return Promise.resolve();
		}
		if (!self.loadedExtent)
		{
			self.loadedExtent = extent;
		} else
		{
			self.loadedExtent = tf.map.ArcGIS.geometryEngine.union([self.loadedExtent, extent]);
		}
		return TF.StreetHelper.getStreetInExtent(extent).then(function(items)
		{
			if (self.closed) { return; }
			var newDataMapping = TF.toMapping(items, function(c) { return c.OBJECTID; });
			var oldDataMapping = TF.toMapping(self.all, function(c) { return c.OBJECTID; });
			var deleteDataMapping = TF.toMapping(self.streetsFeatureData.deleteItems, function(c) { return c.OBJECTID; });
			for (var key in newDataMapping)
			{
				if (!oldDataMapping[key] && !deleteDataMapping[key])
				{
					var item = newDataMapping[key];
					self.setStyleField(item);
					if (self.streetsFeatureData.backupData)
					{
						self.streetsFeatureData.backupData[item.id] = {};
					}
					self.all.push(item);
				}
			}
			self.viewModel.controlDisplay.extentChangeEvent();
		});
	};

	MyStreetsDataModel.prototype.createStreetsFeatureData = function(url)
	{
		var self = this;
		return new TF.RoutingMap.FeatureDataModel({
			url: url,
			convertToData: function(item)
			{
				return this.convertFeaterLayerDataToData(item);
			}.bind(self),
			convertToFeatureData: function(data)
			{
				return this.convertDataToFeaterLayerData(data);
			}.bind(self)
		});
	};

	MyStreetsDataModel.prototype.toMapping = function(all)
	{
		return TF.toMapping(all || this.all);
	};

	MyStreetsDataModel.prototype.toMappingByObjectID = function(all)
	{
		return TF.toMapping(all || this.all, (c) => { return c.OBJECTID || c.id; });
	};

	MyStreetsDataModel.prototype.convertFeaterLayerDataToData = function(item)
	{
		var data = this.getDataModel();
		for (var key in item.attributes)
		{
			data[key] = item.attributes[key];
		}
		data.id = data.OBJECTID;
		data.street = item.attributes.Street;
		data.geometry = item.geometry;
		this.setStyleField(data);
		return data;
	};

	MyStreetsDataModel.prototype.setStyleField = function(data)
	{
		var defaultColor = TF.StreetHelper.color;
		data.color = defaultColor;
		data.opacity = 1;
		data.width = 1;
		data.pattern = 2;
		if (data.Style && data.Style.trim())
		{
			var linStyle = JSON.parse(data.Style.replace(/'/g, "\""));
			if (linStyle[0] && linStyle[0].Pen)
			{
				data.width = linStyle[0].Pen.Width;
				data.pattern = linStyle[0].Pen.Pattern;
				data.opacity = linStyle[0].Pen.Opacity;
				data.color = TF.Color.toHTMLColorFromLongColor(linStyle[0].Pen.Color).toLowerCase();
			}
		}
		this.setStyleValue(data);
	};

	MyStreetsDataModel.prototype.setStyleValue = function(data)
	{
		var colorIndex = TF.Map.MapLineStyle.colors.indexOf(data.color);
		if (colorIndex < 0)
		{
			data.color = TF.StreetHelper.color;
		}
		data.styleValue = data.pattern + ":" + data.color.toLowerCase();
	};

	MyStreetsDataModel.prototype.getDataModel = function()
	{
		return TF.StreetHelper.getDataModel();
	};

	MyStreetsDataModel.prototype.newLineStyleJson = function()
	{
		return [{
			Pen: {
				Width: "1",
				Pattern: "2",
				Color: "15774720",
				Opacity: "1"
			}
		}];
	};

	MyStreetsDataModel.prototype.convertDataToFeaterLayerData = function(item)
	{
		item["LENGTH_GEO"] = tf.map.ArcGIS.geometryEngine.geodesicLength(item.geometry);
		return new tf.map.ArcGIS.Graphic(item.geometry, null, item);
	};

	MyStreetsDataModel.prototype.getHighlighted = function()
	{
		var self = this;
		return this.highlighted.map(function(data)
		{
			return self.findById(data.id);
		});
	};

	MyStreetsDataModel.prototype.getSelected = function()
	{
		var self = this;
		return this.selected.map(function(data)
		{
			return self.findById(data.id);
		});
	};

	MyStreetsDataModel.prototype.findById = function(id)
	{
		for (var i = 0; i < this.all.length; i++)
		{
			if (this.all[i].id == id)
			{
				return this.all[i];
			}
		}
	};

	MyStreetsDataModel.prototype.findAndCloneById = function(id)
	{
		for (var i = 0; i < this.all.length; i++)
		{
			if (this.all[i].id == id)
			{
				this.all[i] = $.extend({}, this.all[i], {
					geometry: this.all[i].geometry.clone()
				});
				return this.all[i];
			}
		}
	};

	MyStreetsDataModel.prototype.findConnectedStreet = function(data)
	{
		var intersectStreets = [];
		for (var i = 0; i < this.all.length; i++)
		{
			var street = this.all[i];
			if (street.id == data.id)
			{
				continue;
			}
			var fromPoint = new tf.map.ArcGIS.Point(data.geometry.paths[0][0], data.geometry.spatialReference);
			var toPoint = new tf.map.ArcGIS.Point(data.geometry.paths[0][data.geometry.paths[0].length - 1], data.geometry.spatialReference);
			var intersectFrom = tf.map.ArcGIS.geometryEngine.intersects(street.geometry, fromPoint);
			var intersectTo = tf.map.ArcGIS.geometryEngine.intersects(street.geometry, toPoint);
			var points = [];
			if (intersectFrom)
			{
				points.push(fromPoint);
			}
			if (intersectTo)
			{
				points.push(toPoint);
			}
			if (intersectFrom || intersectTo)
			{
				intersectStreets.push({
					street: street,
					points: points
				});
			}
		}
		return intersectStreets;
	};

	MyStreetsDataModel.prototype.addMissVertexToConnect = function(street)
	{
		var self = this;
		var connectedStreets = self.findConnectedStreet(street);
		connectedStreets.forEach(function(streetData)
		{
			streetData.points.forEach(function(point)
			{
				self.addVertexToStreet(streetData.street, [point.x, point.y]);
			});
		});
	};

	MyStreetsDataModel.prototype.addVertexToStreet = function(street, xy)
	{
		var self = this;
		var point = new tf.map.ArcGIS.Point(xy, street.geometry.spatialReference);
		var polylinePoints = street.geometry.paths[0];
		for (var i = 0; i < polylinePoints.length - 1; i++)
		{
			var startPoint = polylinePoints[i];
			var endPoint = polylinePoints[i + 1];
			if (helper.isSamePoint(startPoint, xy) || helper.isSamePoint(endPoint, xy))
			{
				return;
			}
			var segment = new tf.map.ArcGIS.Polyline({
				paths: [
					[startPoint, endPoint]
				],
				spatialReference: street.geometry.spatialReference
			});
			var intersect = tf.map.ArcGIS.geometryEngine.intersects(segment, point);
			if (intersect)
			{
				street.geometry.insertPoint(0, i + 1, point);
				var streetsFeatureData = self.createStreetsFeatureData(self.streetUrl);
				streetsFeatureData.update(street, true);
				streetsFeatureData.save();
				self.onAllChangeEvent.notify({
					add: [],
					delete: [],
					edit: [street]
				});
				return;
			}
		}
	};

	MyStreetsDataModel.prototype.addInGird = function(ids)
	{
		this.setSelected(Enumerable.From(this.selected.map(function(c)
		{
			return c.id;
		}).concat(ids)).Distinct().ToArray());
		this.setHighlighted(ids);
	};

	MyStreetsDataModel.prototype.addOrRemoveInGird = function(ids)
	{
		var self = this;
		var newSelectedIds = self.selected.map(function(c)
		{
			return c.id;
		}).concat(ids);
		var newHighlightedIds = self.highlighted.map(function(c)
		{
			return c.id;
		}).concat(ids);
		for (var i = 0; i < newSelectedIds.length - 1; i++)
		{
			for (var j = i + 1; j < newSelectedIds.length; j++)
			{
				if (newSelectedIds[i] == newSelectedIds[j])
				{
					newHighlightedIds = newHighlightedIds.filter(function(t)
					{
						return t != newSelectedIds[i];
					});
					newSelectedIds.splice(j, 1);
					newSelectedIds.splice(i, 1);
					i--;
					break;
				}
			}
		}
		this.setSelected(newSelectedIds);
		this.setHighlighted(newHighlightedIds);
	};

	MyStreetsDataModel.prototype.setHighlighted = function(ids)
	{
		var self = this;
		var highlighted = [];
		var allMapping = this.toMapping();
		ids.forEach(function(id)
		{
			if (allMapping[id])
			{
				highlighted.push(allMapping[id]);
			}
		});
		self.highlighted = highlighted;
		this.highlightChangedEvent.notify(highlighted);
	};

	MyStreetsDataModel.prototype.setSelected = function(ids)
	{
		var self = this;
		var selected = [];
		var allMapping = this.toMapping();
		ids.forEach(function(id)
		{
			if (allMapping[id])
			{
				selected.push(allMapping[id]);
			}
		});
		self.sortItems(selected);
		self.selected = selected;
		this.selectedChangedEvent.notify(selected);
		this.streetsLockData.setAndGetlockInfo([], true);
	};

	MyStreetsDataModel.prototype.sortItems = function(items)
	{
		items.sort(function(a, b)
		{
			var aSortString = a.Street + a.Fromleft + a.Fromright;
			var bSortString = b.Street + b.Fromleft + b.Fromright;
			return aSortString > bSortString ? 1 : (aSortString < bSortString ? -1 : 0);
		});
	}

	MyStreetsDataModel.prototype.isHighlighted = function(id)
	{
		if (!id)
		{
			return false;
		}
		var self = this;
		for (var i = 0; i < self.highlighted.length; i++)
		{
			if (self.highlighted[i].id == id)
			{
				return true;
			}
		}
		return false;
	};

	MyStreetsDataModel.prototype.isSelected = function(id)
	{
		if (!id)
		{
			return false;
		}
		var self = this;
		for (var i = 0; i < self.selected.length; i++)
		{
			if (self.selected[i].id === id)
			{
				return true;
			}
		}
		return false;
	};

	// #region settings
	MyStreetsDataModel.prototype.getStorageKey = function()
	{
		return {
			showDirectionStorageKey: "showDirectionMyStreets",
			moveDuplicateNodesStorageKey: "moveDuplicateNodesMyStreets",
			showInvalidJunctionsStorageKey: "showInvalidJunctions"
		};
	};

	MyStreetsDataModel.prototype.getSetting = function()
	{
		var storageKey = this.getStorageKey();
		var setting = {
			showDirection: TF.RoutingMap.BaseMapDataModel.getSettingByKey(storageKey.showDirectionStorageKey, false),
			moveDuplicateNodes: TF.RoutingMap.BaseMapDataModel.getSettingByKey(storageKey.moveDuplicateNodesStorageKey, false),
			showInvalidJunctions: TF.RoutingMap.BaseMapDataModel.getSettingByKey(storageKey.showInvalidJunctionsStorageKey, false),
		};
		return Promise.resolve(setting);
	};

	MyStreetsDataModel.prototype.getSettingByKey = function(key)
	{
		var storage = tf.storageManager.get(key);
		if (storage == null)
		{
			storage = TF.convertToBoolean(tf.storageManager.get(key));
			tf.storageManager.save(key, storage);
		} else
		{
			storage = TF.convertToBoolean(storage);
		}
		return storage;
	};
	// #endregion

	MyStreetsDataModel.prototype.refreshOtherChangeData = function(refreshIds)
	{
		var self = this;
		var deleteData = [];
		var deleteDataMapping = {};
		var allMapping = {};
		this.all.forEach(function(obj)
		{
			allMapping[obj.OBJECTID] = obj;
		});
		if (!refreshIds || refreshIds.length == 0)
		{
			return Promise.resolve();
		}
		refreshIds.forEach(function(id)
		{
			if (allMapping[id])
			{
				deleteData.push(allMapping[id]);
				deleteDataMapping[id] = true;
			}
		});
		this.onAllChangeEvent.notify({
			add: [],
			edit: [],
			delete: deleteData
		});
		this.all = this.all.filter(function(item)
		{
			return !deleteDataMapping[item.OBJECTID];
		});
		return this.streetsFeatureData.query({
			where: "OBJECTID in (" + refreshIds.join(",") + ")"
		}).then(function(source)
		{
			source.forEach(function(data)
			{
				allMapping[data.id] = data;
			});
			self.all = self.all.concat(source);
			source.forEach(function(item)
			{
				self.streetsFeatureData.backupData[item.id] = item;
			});

			self.onAllChangeEvent.notify({
				add: source,
				edit: [],
				delete: []
			});
		}).then(function()
		{
			self.curbTurnDataModel.refreshOtherChangeData(refreshIds);
		});
	};

	MyStreetsDataModel.prototype.create = function(newData, isFromSplit)
	{
		var self = this;
		self._viewModal.revertMode = "create-mystreets";
		self._viewModal.revertData = [];
		var data = this.getDataModel();
		for (var key in newData)
		{
			data[key] = newData[key];
		}
		data.City = TF.RoutingMap.GeocodeHelper.getCityName(data.geometry);
		data.State = TF.RoutingMap.GeocodeHelper.getStateName(data.geometry);
		self.updateStreetGeocodeInfo(data);
		self.insertToRevertData(data);
		self.setStyleValue(data);
		self.all.push(data);
		self.streetChangeIds.add(data.id);
		self.streetsFeatureData.add(data);
		if (this.viewModel.showMode().travelScenario)
		{
			self.curbTurnDataModel.update(data, self.all);
		}
		self.updateTime(data);
		data.maneuverInfo = {};
		self.onAllChangeEvent.notify({
			add: [data],
			delete: [],
			edit: []
		});
		self.onStreetModifyEvent.notify({ newData: data, type: "add", oldData: null });
		self.streetsLockData.calcSelfChangeCount();
		self.curbTurnDataModel.onControlChangeEvent.notify();
		if (!isFromSplit) self.splitStreetAtTJunctions(data);
		PubSub.publish("StreetChange");
		return data;
	};

	MyStreetsDataModel.prototype.getElevationAtPoint = function(street, point)
	{
		if (street.FromElevation == street.ToElevation) return street.FromElevation;
		if (point.x.toFixed(4) == street.geometry.paths[0][0][0].toFixed(4) &&
			point.y.toFixed(4) == street.geometry.paths[0][0][1].toFixed(4)) return street.FromElevation;
		if (point.x.toFixed(4) == street.geometry.paths[0][street.geometry.paths[0].length - 1][0].toFixed(4) &&
			point.y.toFixed(4) == street.geometry.paths[0][street.geometry.paths[0].length - 1][1].toFixed(4)) return street.ToElevation;
		return (street.FromElevation + street.ToElevation) / 2;
	}

	/**
	 * split the touched street from the snapped vertex of the new street, if there is a t-intersection
	 * @param  
	 */
	MyStreetsDataModel.prototype.splitStreetAtTJunctions = function(data)
	{
		var self = this,
			points = [],
			streetGeometry = data.geometry,
			fromElev = data.FromElevation,
			toElev = data.ToElevation;
		streetGeometry.paths[0].forEach(function(p, index)
		{
			if (fromElev == toElev || index == 0 || index == streetGeometry.paths[0].length - 1)
			{
				var vertex = new tf.map.ArcGIS.Point({ x: p[0], y: p[1], spatialReference: { wkid: 102100 } });
				points.push(vertex);
			}
		});
		var snapPoints = [], splitStreetsDic = [];
		//split the exisitng streets
		points.forEach(function(p, index)
		{
			var snapPoint = self._viewModal.routingSnapManager._findOtherItemInExtent(tf.map.ArcGIS.geometryEngine.geodesicBuffer(p, 1, "meters").extent);
			if (snapPoint && snapPoint.point)
			{
				var snapStreet = self.findAndCloneById(snapPoint.item.attributes.id);
				if (snapStreet && self.getElevationAtPoint(snapStreet, snapPoint.point) == self.getElevationAtPoint(data, snapPoint.point))
				{
					//self.viewModel.drawTool._splitStreet({ geometry: snapPoint.point }, snapStreet);
					//splitStreets.push(snapStreet);
					if (!splitStreetsDic[snapStreet.id]) splitStreetsDic[snapStreet.id] = [];
					splitStreetsDic[snapStreet.id].push(snapPoint.point);
					snapPoints.push(snapPoint.point);
				}
			}
		});
		for (var key in splitStreetsDic)
		{
			if (key != data.id)
			{
				var snapStreet = self.findAndCloneById(key);
				var _streetSegments = self.viewModel.drawTool._splitStreetByMultiPoints(splitStreetsDic[key], snapStreet);
				updateStreets(_streetSegments, snapStreet);
			}

		}
		//split the newly added street
		var splittedStreets = self.viewModel.drawTool._splitStreetByMultiPoints(snapPoints, data);
		updateStreets(splittedStreets, data);

		function updateStreets(splittedStreets, street)
		{
			if (splittedStreets.length > 1)
			{
				self.delete([street]);

				for (var i = 0; i < splittedStreets.length; i++)
				{
					var createData = $.extend(true, {}, street);
					createData.id = TF.createId();
					createData.geometry = splittedStreets[i];
					createData.distance = tf.map.ArcGIS.geometryEngine.geodesicLength(splittedStreets[i], "miles");
					createData.leftTime = (createData.distance / createData.Speedleft) * 60;
					createData.rightTime = (createData.distance / createData.Speedright) * 60;
					createData.Fromleft = 0;
					createData.Fromright = 0;
					createData.Toleft = 0;
					createData.Toright = 0;
					createData.OBJECTID = 0;
					var maneuverInfo = {
						curbInfo: TF.RoutingMap.MapEditingPalette.MyStreetsHelper.getCurbToStreet(createData, self.curbTurnDataModel.curbs),
						maneuvers: TF.RoutingMap.MapEditingPalette.MyStreetsHelper.getTurnToStreet(createData, self.curbTurnDataModel.maneuvers)
					};
					createData.maneuverInfo = TF.RoutingMap.MapEditingPalette.MyStreetsHelper.copyManeuverInfo(maneuverInfo, createData);
					self.create(createData, true);
				}
			}
		}
	};

	MyStreetsDataModel.prototype.updateTime = function(data)
	{
		data.distance = tf.map.ArcGIS.geometryEngine.geodesicLength(data.geometry, "miles");
		data.leftTime = data.Speedleft == 0 ? 0 : (data.distance / data.Speedleft) * 60;
		data.rightTime = data.Speedright == 0 ? 0 : (data.distance / data.Speedright) * 60;
	};

	MyStreetsDataModel.prototype.insertToRevertData = function(data, oldRings)
	{
		this._viewModal.revertData.push($.extend({}, data, {
			geometry: oldRings ? new tf.map.ArcGIS.Polyline({ spatialReference: data.geometry.spatialReference, paths: oldRings }) : TF.cloneGeometry(data.geometry)
		}, {
			maneuverInfo: {
				curbInfo: helper.getCurbToStreet(data, this.curbTurnDataModel.curbs),
				maneuvers: helper.getTurnToStreet(data, this.curbTurnDataModel.maneuvers)
			}
		}));

	};

	MyStreetsDataModel.prototype.update = function(modifyDataArray, isFromSplit)
	{
		var self = this;
		self._viewModal.revertMode = "update-mystreets";
		self._viewModal.revertData = [];
		if (!$.isArray(modifyDataArray)) { modifyDataArray = [modifyDataArray]; }
		var updateData = [], splitDataArray = [];
		modifyDataArray.forEach(function(modifyData)
		{
			var isSplitChange = false;
			var data = self.findAndCloneById(modifyData.id);
			self.curbTurnDataModel.update(modifyData, self.all);

			if (!TF.equals(data, modifyData, false))
			{
				if (self.streetsFeatureData.backupData && self.streetsFeatureData.backupData[modifyData.id] && !self.streetsFeatureData.backupData[modifyData.id].id)
				{
					self.streetsFeatureData.backupData[modifyData.id] = $.extend({}, data, {
						geometry: data.geometry.clone()
					});
				}
				if (modifyData.FromElevation != data.FromElevation || modifyData.ToElevation != data.ToElevation
					|| JSON.stringify(modifyData.geometry.paths) != JSON.stringify(data.geometry.paths))
				{
					isSplitChange = true;
				}
				self.onStreetModifyEvent.notify({ newData: modifyData, type: "update", oldData: data });
				self.insertToRevertData(data, modifyData.oldRings);

				for (var key in data)
				{
					helper.setValue(modifyData, key, data);
				}
				if (modifyData.geometry)
				{
					data.geometry = TF.cloneGeometry(modifyData.geometry);
				}
				self.streetChangeIds.add(data.id);
				updateData.push(data);
				if (isSplitChange && !isFromSplit) { splitDataArray.push(data); }
			}
		});

		updateData.forEach(function(data)
		{
			self.updateStreetGeocodeInfo(data);
			self.streetsFeatureData.update(data);

			self.setStyleValue(data);
			self.updateSelectedData(data);
			self.onAllChangeEvent.notify({
				add: [],
				delete: [],
				edit: [data]
			});
			self.streetsLockData.calcSelfChangeCount();
			data.maneuverInfo = {};
		});
		splitDataArray.forEach(function(splitData)
		{
			self.splitStreetAtTJunctions(splitData);
		});
		self.curbTurnDataModel.onControlChangeEvent.notify();
		PubSub.publish("StreetChange");
	};

	MyStreetsDataModel.prototype.updateSelectedData = function(data)
	{
		for (var i = 0; i < this.selected.length; i++)
		{
			if (this.selected[i].id === data.id)
			{
				//fix the selected record still cache old value after user change the street name, fromleft or fromright property those could affect sort index.
				this.selected[i].Street = data.Street;
				this.selected[i].Fromleft = data.Fromleft;
				this.selected[i].Fromright = data.Fromright;
				break;
			}
		}
		this.sortItems(this.selected);
	};

	MyStreetsDataModel.prototype.updateStreetGeocodeInfo = function(street)
	{
		var self = this;
		var boundaries = self._viewModal.mapEditingPaletteViewModel.municipalBoundaryViewModel.dataModel.municipalBoundaries;
		var zipcodes = self._viewModal.mapEditingPaletteViewModel.zipCodeViewModel.dataModel.zipCodes;
		for (var i = 0; i < boundaries.length; i++)
		{
			if (tf.map.ArcGIS.geometryEngine.intersects(boundaries[i].geometry, street.geometry))
			{
				street.city = boundaries[i].city;
				street.LeftMunicipalName = boundaries[i].name;
				street.RightMunicipalName = boundaries[i].name;
				break;
			}
		}
		for (var i = 0; i < zipcodes.length; i++)
		{
			if (tf.map.ArcGIS.geometryEngine.intersects(zipcodes[i].geometry, street.geometry))
			{
				street.LeftPostalCode = zipcodes[i].name;
				street.RightPostalCode = zipcodes[i].name;
				break;
			}
		}
	};

	MyStreetsDataModel.prototype.calcSelfChangeCount = function()
	{
		var streetIds = this.getChangeStreet(this.streetsFeatureData, "id");
		this.curbTurnDataModel.calcSelfChangeCount();
		var changeIds = Enumerable.From(streetIds).Distinct().ToArray();
		this.streetsLockData.needChangeData = this.streetsFeatureData.getChangeData();
		this.streetsLockData.obSelfChangeCount(changeIds.length);
	};

	MyStreetsDataModel.prototype.getChangeStreet = function(featureData, streetIdKey)
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
	};

	MyStreetsDataModel.prototype.updateStreetId = function(street)
	{
		delete this.all[street.id];
		this.all[street.OBJECTID] = street;
		street.id = street.OBJECTID;
	};

	MyStreetsDataModel.prototype.changeStreetApproveStatus = function(changeData)
	{
		if (changeData.addGraphic.length != 0 || changeData.editGraphic.length != 0 || changeData.deleteGraphic.length != 0)
		{
			PubSub.publish("StreetApproveStatusChange");
			return tf.promiseAjax.put(pathCombine(tf.api.apiPrefixWithoutDatabase(), "tfsysinfo", "StreetApprove"), {
				data: {
					InfoID: "StreetApprove",
					InfoValue: "0"
				}
			});
		}
	};

	MyStreetsDataModel.prototype.save = function(from = "street")
	{
		return this._confirmRelated(from).then((result) =>
		{
			if (result)
			{
				return this._saveData(result);
			}
		});
	};

	MyStreetsDataModel.prototype._saveData = function(saveType)
	{
		let self = this,
			isRebuildGeocode = false,
			isRebuildNetwork = self.curbTurnDataModel.needRebuildTurn,
			p = Promise.resolve(true),
			streetAddItems = self.streetsFeatureData.addItems,
			changeData = self.streetsFeatureData.getChangeData(),
			travelScenariosViewModel = self._viewModal.travelScenariosPaletteViewModel.travelScenariosViewModel,
			needApprovedScenariosIdsWithoutEmpty = travelScenariosViewModel.getNeedApprovedScenarios().concat(-1),
			travelScenario = travelScenariosViewModel.obPreviousSelectedTravelScenarios ? travelScenariosViewModel.obPreviousSelectedTravelScenarios : travelScenariosViewModel.obSelectedTravelScenarios();
		PubSub.publish("clear_ContextMenu_Operation");
		self.clearRevertInfo();
		self.isSaving = true;
		let hasStreetChange = self.streetsLockData.obSelfChangeCount() > 0,
			hasCurbTurnChange = self.curbTurnDataModel.obSelfChangeCount() > 0,
			saveStreet = saveType.indexOf("street") >= 0,
			saveCurbTurn = saveType.indexOf("curbTurn") >= 0,
			onlyApproveTravelScenario = ((saveStreet && !hasStreetChange) || (!saveStreet)) && hasCurbTurnChange && saveCurbTurn;

		if (saveStreet)
		{
			changeData.addGraphic.forEach(function(item)
			{
				item.attributes.LocalId = self._guid();
			});
			travelScenariosViewModel.lock(needApprovedScenariosIdsWithoutEmpty);
			self.changeStreetApproveStatus(changeData);
		}

		if (onlyApproveTravelScenario)
		{
			travelScenariosViewModel.lock([travelScenario.Id]);
			p = self.curbTurnDataModel.saveData(streetAddItems).then(() =>
			{
				return self.curbTurnDataModel.getCurbAndTurnData();
			}).then(() =>
			{
				return TF.CreateMmpkService.instance.isActived().then(isActived =>
				{
					if (isActived)
					{
						this.changeMessage({
							type: "success",
							content: "Rebuilding Streets...",
							autoClose: false
						});

						return this.buildNetworkDataset();
					}

					return Promise.resolve(true);
				});
			}).catch((ex) =>
			{
				console.error(ex);
				if (self._viewModal && self._viewModal.obToastMessages)
				{
					self._viewModal.obToastMessages.push({
						type: 'error',
						content: 'Save failed',
						autoClose: true
					});
				}
				return Promise.resolve(false);
			});
		}
		else if (hasStreetChange || hasCurbTurnChange)
		{
			travelScenariosViewModel.lock(needApprovedScenariosIdsWithoutEmpty);
			p = self.needToRebuild(changeData).then(isRebuild => 
			{
				isRebuildGeocode = isRebuild.needToRebuildGeocode;
				isRebuildNetwork = isRebuild.needToRebuildNetwork || self.curbTurnDataModel.needRebuildTurn;
				if (saveStreet && hasStreetChange)
				{
					return self.streetsFeatureData.save(changeData).then(() =>
					{
						self.streetChangeIds.clear();
					});
				}
			}).then(() =>
			{
				let curbTurnPromises = [];
				if (hasStreetChange)
				{
					curbTurnPromises.push(self.curbTurnDataModel.deleteInOtherScenarios(changeData.deleteGraphic.map(s => s.attributes.OBJECTID)));
				}

				if (saveCurbTurn && hasCurbTurnChange)
				{
					curbTurnPromises.push(self.curbTurnDataModel.saveData(streetAddItems));
				}

				return Promise.all(curbTurnPromises);
			}).then(() =>
			{
				if (saveStreet && hasStreetChange)
				{
					self.streetsLockData.saveData(self.streetsLockData.needChangeData);
					self.streetsLockData.unLockCurrentDocument();
				}
				if (saveCurbTurn && hasCurbTurnChange)
				{
					return self.curbTurnDataModel.getCurbAndTurnData();
				}
			}).then(() =>
			{
				let content = "This record has been successfully saved.", promise = Promise.resolve(true);
				if (isRebuildNetwork)
				{
					content += " Rebuilding Streets...";
					promise = self.buildNetworkDataset();
				}

				self.message = {
					type: "success",
					content: content,
					autoClose: isRebuildNetwork ? false : true
				};
				self._viewModal.obToastMessages && self._viewModal.obToastMessages.push(self.message);
				return promise;
			}).catch((ex) =>
			{
				console.error(ex);
				self._viewModal.obToastMessages && self._viewModal.obToastMessages.push({
					type: 'error',
					content: 'Save failed',
					autoClose: true
				});
				return Promise.resolve(false);
			});
		}

		return p.then(result => 
		{
			if (onlyApproveTravelScenario)
			{
				if (result)
				{
					travelScenariosViewModel.ApproveSelectTravelScenario(travelScenario, self._saveCallback.bind(self), "Travel Scenario");
				}
				else
				{
					travelScenariosViewModel.unLock([travelScenario.Id]);
				}
			}
			else if (result)
			{
				let isNeedApproveScenario = travelScenariosViewModel.getNeedApprovedScenarios().length > 0;
				if (hasStreetChange && !hasCurbTurnChange && !isNeedApproveScenario)
				{
					self.updateFileGDBStreets(changeData, isRebuildGeocode, isRebuildNetwork);
				}
				else
				{
					travelScenariosViewModel.publishStreet(isRebuildGeocode, self._saveCallback.bind(self));
				}
			}
			else
			{
				self.streetsLockData.calcSelfChangeCount();
				travelScenariosViewModel.unLock(needApprovedScenariosIdsWithoutEmpty);
			}
		});
	};

	MyStreetsDataModel.prototype._guid = function()
	{
		var S4 = function()
		{
			return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
		};
		return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
	};

	MyStreetsDataModel.prototype._confirmRelated = function(from = "street", type = "save")
	{
		var showMode = this.viewModel.showMode();
		if (!this.isRelateStreetScenarioChanged())
		{
			if (!showMode.mapEditing || !showMode.travelScenario)
			{
				return Promise.resolve(["street", "curbTurn"]);
			}
			return Promise.resolve([from]);
		}

		var message = "";
		if (from == "street")
		{
			message = `Related travel scenarios are changed. Are you sure to ${type} it together?`;
		} else
		{
			message = `Related streets are changed. Are you sure to ${type}  it together?`;
		}

		return tf.promiseBootbox.confirm(
			{
				message: message,
				title: "Confirmation"
			}).then((ans) =>
			{
				if (ans)
				{
					return ["street", "curbTurn"];
				}
				return false;
			});
	};

	MyStreetsDataModel.prototype.isRelateStreetScenarioChanged = function()
	{
		var showMode = this.viewModel.showMode();
		var streetIds = this.curbTurnDataModel.getRelateStreetIds();

		if (!showMode.mapEditing || !showMode.travelScenario)
		{
			return false;
		}

		if (!streetIds || streetIds.length == 0)
		{
			return false;
		}

		var streetChangeIds = this.getChangeStreetRealIds();
		if (streetChangeIds.size == 0)
		{
			return false;
		}

		var overlap = false;

		for (var i = 0; i < streetIds.length; i++)
		{
			if (streetChangeIds.has(streetIds[i]))
			{
				overlap = true;
				break;
			}
		}

		if (!overlap)
		{
			return false;
		}

		return true;
	};

	MyStreetsDataModel.prototype.getChangeStreetRealIds = function()
	{
		var allMapping = this.toMapping();
		return new Set(Array.from(this.streetChangeIds).map((c) =>
		{
			return (allMapping[c] && allMapping[c].OBJECTID) || c;
		}));
	};

	MyStreetsDataModel.prototype._saveCallback = function(ans)
	{
		let self = this;
		self.streetsLockData.calcSelfChangeCountAndStyle(ans);
		self.isSaving = false;
	};

	MyStreetsDataModel.prototype._streetApprovePublished = function(name, result)
	{
		let changeStyle = result ? result.StreetApprove === 1 ? false : true : true;
		this.streetsLockData.obSelfChangeStyle(changeStyle);
	};

	MyStreetsDataModel.prototype.changeMessageCore = function(oldMessage, newMessage)
	{
		var messages = this._viewModal.obToastMessages;
		if (!messages)
		{
			return;
		}

		if (oldMessage && messages.indexOf(oldMessage) > -1)
		{
			messages.replace(oldMessage, newMessage);
		}
		else
		{
			messages.push(newMessage);
		}
	};

	MyStreetsDataModel.prototype.changeMessage = function(message)
	{
		this.changeMessageCore(this.message, message);
		this.message = message;
	};

	MyStreetsDataModel.prototype.changeCreateMmpkMessage = function(message)
	{
		this.changeMessageCore(this.createMmpkMessage, message);
		this.createMmpkMessage = message;
	};

	MyStreetsDataModel.prototype.createMmpk = function()
	{
		if (!this.createMmpkMessageSubscription)
		{
			this.createMmpkMessageSubscription = TF.CreateMmpkService.instance.messageOutput.subscribe((e, data) =>
			{
				this.changeCreateMmpkMessage(data);
			});
		}

		TF.CreateMmpkService.instance.execute().then(() =>
		{
			this.createMmpkMessage = null;
			if (this.createMmpkMessageSubscription)
			{
				this.createMmpkMessageSubscription.dispose();
				this.createMmpkMessageSubscription = null;
			}
		});
	};

	MyStreetsDataModel.prototype.buildNetworkDataset = function()
	{
		var processor = new tf.map.ArcGIS.Geoprocessor(this.rebuildUrl);
		return processor.submitJob({}).then(jobInfo =>
		{
			var jobid = jobInfo.jobId;
			return processor.waitForJobCompletion(jobid, {}).then(result =>
			{
				if (result.jobStatus == "job-succeeded")
				{
					this.changeMessage({
						type: "success",
						content: "Streets built successfully.",
						autoClose: true
					});

					this.createMmpk();
				}
				else
				{
					this.changeMessage({
						type: "error",
						content: "Streets failed to build.",
						autoClose: true
					});
				}

				return Promise.resolve(true);
			})
		});
	};

	MyStreetsDataModel.prototype.updateFileGDBStreets = function(changeData, isRebuildGeocode, isRebuildNetwork)
	{
		let travelScenariosViewModel = this._viewModal.travelScenariosPaletteViewModel.travelScenariosViewModel
		let needApprovedScenariosIds = travelScenariosViewModel.getNeedApprovedScenarios(),
			isNeedApproveScenario = needApprovedScenariosIds.length > 0;
		this._publishStreets(changeData, isRebuildGeocode, isRebuildNetwork).then((ans) =>
		{
			travelScenariosViewModel.updateVectorTileService("Streets");
			this.clearStatus()
			if (ans == "success")
			{
				if (isNeedApproveScenario)
				{
					travelScenariosViewModel.changeScenarioApproveStatus(needApprovedScenariosIds).then(function()
					{
						travelScenariosViewModel._updateRecords();
					});
				}
				travelScenariosViewModel._changeStreetApproveStatus().then(() => travelScenariosViewModel._notifyPublised());
			}
			else
			{
				this.changeMessage({
					type: "error",
					content: "Streets failed to publish.",
					autoClose: false
				});
			}
		});

	};

	MyStreetsDataModel.prototype._publishStreets = function(changeData, isRebuildGeocode, isRebuildNetwork)
	{
		let params = {};
		let setting = {};
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "tfsysinfo"))
			.then((response) =>
			{
				if (response.Items && response.Items.length > 0)
				{
					response.Items.forEach(function(obj)
					{
						setting[obj.InfoID] = obj.InfoValue;
					});
				}
				let serviceDirectory = $.trim(setting["ARCGISSERVER"]) + "/arcgis/rest/services/";
				let activeFileBasedFolderName = setting["ActiveServiceFolderName"] + "/";
				let inActiveFileBasedFolderName = setting["InActiveServiceFolderName"] + "/";
				let buildFileBasedFolderName = setting["ActiveServiceFolderName"].endsWith("_Master") ? activeFileBasedFolderName : inActiveFileBasedFolderName;
				let MasterFileGDBGPService = serviceDirectory + buildFileBasedFolderName + setting["MasterFileGDBGPService"] + "/GPServer";
				let rebuildStreetGeocodeFileUrl = MasterFileGDBGPService + "/RebuildStreetLocactor";
				let updateFileGDBProcessor = new tf.map.ArcGIS.Geoprocessor(this.fileGDBUpdateUrl);


				let addFeatureSet = new Object();
				let deleteFeatureSet = new Object();
				let modifyFeatureSet = new Object();
				addFeatureSet.features = changeData.addGraphic;
				addFeatureSet.fields = this.streetsFields;
				deleteFeatureSet.features = changeData.deleteGraphic;
				deleteFeatureSet.fields = this.streetsFields;
				modifyFeatureSet.features = changeData.editGraphic;
				modifyFeatureSet.fields = this.streetsFields;
				params["folder_path"] = arcgisUrls.LinuxFolderRootPath ? arcgisUrls.LinuxFolderRootPath : arcgisUrls.FileGDBPath;;
				params["ActiveFolder"] = setting["InActiveServiceFolderName"];
				params["NewFeatures"] = addFeatureSet;
				params["ModifyFeatures"] = modifyFeatureSet;
				params["DeleteFeatures"] = deleteFeatureSet;
				params["LayerName"] = "[MAP_STREET]";
				return this._updateFileGDBByGP(updateFileGDBProcessor, rebuildStreetGeocodeFileUrl, params, isRebuildGeocode, isRebuildNetwork, true).then((ans) =>
				{
					let travelScenariosViewModel = this._viewModal.travelScenariosPaletteViewModel.travelScenariosViewModel;
					if (ans === "success")
					{
						return travelScenariosViewModel._updateInActiveServiceFolderName(setting["InActiveServiceFolderName"], setting["ActiveServiceFolderName"]).then(() =>
						{
							params["ActiveFolder"] = setting["ActiveServiceFolderName"];
							this._updateFileGDBByGP(updateFileGDBProcessor, rebuildStreetGeocodeFileUrl, params, isRebuildGeocode, isRebuildNetwork, false).then(() =>
							{
								travelScenariosViewModel.unLock(travelScenariosViewModel.getNeedApprovedScenarios().concat(-1));
							});
							return "success";
						});
					}
					travelScenariosViewModel.unLock(travelScenariosViewModel.getNeedApprovedScenarios().concat(-1));
					return "fail";
				});
			}).catch((error) =>
			{
				console.log(error);
				return "fail";
			});
	};

	MyStreetsDataModel.prototype._updateFileGDBByGP = function(updateFileGDBProcessor, rebuildStreetGeocodeFileUrl, params, isRebuildGeocode, isRebuildNetwork, isNeedMassage)
	{
		let self = this, travelScenariosViewModel = this._viewModal?.travelScenariosPaletteViewModel?.travelScenariosViewModel;
		if (isRebuildNetwork)
		{
			if (isNeedMassage)
			{
				this.changeMessage({
					type: "success",
					content: "Publishing Streets...",
					autoClose: false
				});
			}
			return updateFileGDBProcessor.submitJob(params).then(function(jobInfo)
			{
				const jobId = jobInfo.jobId;
				return updateFileGDBProcessor.waitForJobCompletion(jobId, {}).then(function(res)
				{
					return gpJobComplete(res);
				}, error =>
				{
					return "fail";
				});

				function gpJobComplete(result)
				{
					if (result.jobStatus == "job-succeeded")
					{
						if (isNeedMassage)
						{
							self.changeMessage({
								type: "success",
								content: "Streets published successfully.",
								autoClose: false
							});
						}
						if (!isRebuildGeocode)
						{
							return "success";
						}
						return self.rebuildFileGDBGeocode(params["ActiveFolder"], rebuildStreetGeocodeFileUrl, isNeedMassage, travelScenariosViewModel);
					} else
					{
						return "fail";
					}
				}
			}, error =>
			{
				return "fail";
			});
		}
		if (!isRebuildGeocode)
		{
			return Promise.resolve("success");
		}
		return self.rebuildFileGDBGeocode(params["ActiveFolder"], rebuildStreetGeocodeFileUrl, isNeedMassage, travelScenariosViewModel);
	};

	MyStreetsDataModel.prototype.rebuildFileGDBGeocode = function(serviceFolder, rebuildStreetGeocodeFileUrl, isNeedMassage, travelScenariosViewModel)
	{
		if (!travelScenariosViewModel)
		{
			return Promise.resolve("fail");
		}

		if (isNeedMassage)
		{
			this.changeMessage({
				type: "success",
				content: "Rebuilding Geocode...",
				autoClose: true
			});
		}
		return travelScenariosViewModel.rebuildFileGeocode(serviceFolder, rebuildStreetGeocodeFileUrl).then(ans =>
		{
			if (ans == "success")
			{
				if (isNeedMassage)
				{
					this.changeMessage({
						type: "success",
						content: "Rebuilt geocode successfully.",
						autoClose: false
					});
				}
				return "success";
			}
			else
			{
				if (isNeedMassage)
				{
					this.changeMessage({
						type: "error",
						content: "Rebuilding geocode failed.",
						autoClose: false
					});
				}
				return "fail";
			}
		});
	};

	MyStreetsDataModel.prototype.needToRebuild = function(changeData)
	{
		let rebuild = { needToRebuildGeocode: false, needToRebuildNetwork: false };
		if (changeData.deleteGraphic.length > 0 || changeData.addGraphic.length > 0)
		{
			rebuild.needToRebuildGeocode = true;
			rebuild.needToRebuildNetwork = true;
			return Promise.resolve(rebuild);
		}
		if (changeData.editGraphic.length > 0)
		{
			const editIds = changeData.editGraphic.map(function(g) { return g.attributes.OBJECTID });
			return this.streetsFeatureData.query({
				where: "OBJECTID in (" + editIds.join(",") + ")"
			}, "", false).then((source) =>
			{
				for (let i = 0; i < changeData.editGraphic.length; i++)
				{
					let newData = changeData.editGraphic[i].attributes;
					let oldData = source.find((c) => c.OBJECTID == newData.OBJECTID);
					if (!oldData) { continue; }
					if (oldData.Street != newData.Street ||
						oldData.Fromleft != newData.Fromleft ||
						oldData.Toleft != newData.Toleft ||
						oldData.Fromright != newData.Fromright ||
						oldData.Toright != newData.Toright ||
						!tf.map.ArcGIS.geometryEngine.contains(oldData.geometry, changeData.editGraphic[i].geometry) || !tf.map.ArcGIS.geometryEngine.contains(changeData.editGraphic[i].geometry, oldData.geometry))
					{
						rebuild.needToRebuildGeocode = true;
					}
					if (
						!tf.map.ArcGIS.geometryEngine.contains(oldData.geometry, changeData.editGraphic[i].geometry) || !tf.map.ArcGIS.geometryEngine.contains(changeData.editGraphic[i].geometry, oldData.geometry) ||
						oldData.FromElevation != newData.FromElevation ||
						oldData.ToElevation != newData.ToElevation ||
						oldData.Speedleft != newData.Speedleft ||
						oldData.Speedright != newData.Speedright ||
						oldData.HeightClearance != newData.HeightClearance ||
						oldData.WeightLimit != newData.WeightLimit ||
						oldData.RoadClass != newData.RoadClass ||
						oldData.TraversableByVehicle != newData.TraversableByVehicle ||
						oldData.TraversableByWalkers != newData.TraversableByWalkers)
					{
						rebuild.needToRebuildNetwork = true;
					}
					if (rebuild.needToRebuildNetwork && rebuild.needToRebuildGeocode)
					{
						break;
					}
				}
				return rebuild;
			});
		}
		return Promise.resolve(rebuild);
	};

	MyStreetsDataModel.prototype.delete = function(deleteArray)
	{
		var self = this;
		self._viewModal.revertMode = "delete-mystreets";
		self._viewModal.revertData = [];
		deleteArray.forEach(function(segment)
		{
			var deleteData = self.findById(segment.id);
			self.insertToRevertData(deleteData);
			self.streetsFeatureData.delete(deleteData);
			self.curbTurnDataModel.deleteCurb(deleteData);
			self.curbTurnDataModel.deleteManeuver(deleteData);
			self.all = self.all.filter(function(c)
			{
				return c.id != segment.id;
			});
			self.refreshSelectAndHighlighted();
			self.streetChangeIds.add(segment.id);
			self.onAllChangeEvent.notify({
				add: [],
				delete: [deleteData],
				edit: []
			});
			self.onStreetModifyEvent.notify({ newData: deleteData, type: "delete", oldData: null });
			self.streetsLockData.calcSelfChangeCount();
		});
		self.curbTurnDataModel.onControlChangeEvent.notify();
		PubSub.publish("StreetChange");
	};

	MyStreetsDataModel.prototype.refreshSelectAndHighlighted = function()
	{
		var self = this;
		var allMapping = this.toMapping();
		var selected = self.selected.filter(function(item)
		{
			return allMapping[item.id];
		}).map(function(item)
		{
			return item.id;
		});
		self.setSelected(selected);
		var highlighted = self.highlighted.filter(function(item)
		{
			return allMapping[item.id];
		}).map(function(item)
		{
			return item.id;
		});
		self.setHighlighted(highlighted);
	};

	MyStreetsDataModel.prototype.revert = function(showMessage)
	{
		var self = this;
		return self._confirmRelated("street", "revert").then((ans) =>
		{
			if (!ans)
			{
				return;
			}
			if (ans.indexOf("curbTurn") >= 0)
			{
				self.curbTurnDataModel.revertData();
			}
			return self.revertData().then(function()
			{
				if (showMessage != false)
				{
					var message = {
						type: "success",
						content: "This record has been successfully reverted.",
						autoClose: true
					};
					self._viewModal.obToastMessages.push(message);
				}
			});
		});
	};

	MyStreetsDataModel.prototype.revertData = function()
	{
		var self = this;
		self.streetsFeatureData.clear();
		self.streetsLockData.unLockCurrentDocument();
		self.streetsLockData.calcSelfChangeCount();
		self.viewModel.drawTool._polylineLayer.removeAll();
		return self.init().then(function()
		{
			self.setHighlighted([]);
			self.setSelected([]);
		}).catch(function(error)
		{
			TF.consoleOutput("error", "MyStreetsDataModel init fails: " + error);
		});
	};

	MyStreetsDataModel.prototype.close = function()
	{
		this.clearStatus();
		this.curbTurnDataModel.clearControls();
		this.all = [];
		this.closed = true;
	};

	MyStreetsDataModel.prototype.clearStatus = function()
	{
		var self = this;
		self.streetChangeIds = new Set();
		self.streetsFeatureData.clear();
		self.streetsLockData.unLockCurrentDocument();
		self.streetsLockData.calcSelfChangeCount();
		self.setHighlighted([]);
		self.setSelected([]);
		self.saving = false;
		this._viewModal && this._viewModal.closeToastMessages(this.loadingStreetMessage);
	};

	MyStreetsDataModel.prototype.clearRevertInfo = function()
	{
		var self = this;
		self._viewModal.revertMode = "";
		self._viewModal.revertData = [];
	};

	MyStreetsDataModel.prototype.dispose = function()
	{
		this.onAllChangeEvent.unsubscribeAll();
		this.highlightChangedEvent.unsubscribeAll();
		this.selectedChangedEvent.unsubscribeAll();
		this.streetsFeatureData.dispose();
		if (this.createMmpkMessageSubscription)
		{
			this.createMmpkMessageSubscription.dispose();
			this.createMmpkMessageSubscription = null;
		}

		this.all = null;
		this.highlighted = null;
		this.selected = null;
		this.map = null;
		this._viewModal && this._viewModal.closeToastMessages(this.loadingStreetMessage);
		this.closed = true;
	};
})();
(function()
{
	createNamespace("TF.Grid").GeocodeTool = GeocodeTool;

	function GeocodeTool(viewModel)
	{
		var self = this;
		self.viewModel = viewModel;
		Object.defineProperty(this,"searchGrid", {get(){
			return self.viewModel.searchGrid;
		}})
		self.previouslyGeocodeList = [];
		self.successMatchList = [];
		self.notMatchList = [];
		TF.RoutingMap.GeocodeHelper.initialize();// temp function for geocode service bug,since geocode service currently doesn't return zipcode for intersection.  
	}

	GeocodeTool.prototype.geocodingSelectionClick = function(viewmodel, evt)
	{
		this.geocodingClick(viewmodel, evt);
	};

	GeocodeTool.prototype.geocodingClick = function(viewmodel, evt)
	{
		var self = this;
		self.getRecords().then(function(records)
		{
			var allUngeocodeCount = records.length;
			var selectUngeocodeRecords = records.filter(function(r) { return self.searchGrid.getSelectedIds().indexOf(r.Id) >= 0 });
			var geocodeSettingsModal = new TF.Modal.GeocodeSettingsModalViewModel(self.searchGrid.getSelectedIds().length, allUngeocodeCount, selectUngeocodeRecords.length, self.viewModel.type);
			tf.modalManager.showModal(geocodeSettingsModal).then(function(res)
			{
				if (res)
				{
					self.executeGeocode(res, records, viewmodel);
				}
			});
		});
	};

	GeocodeTool.prototype.executeGeocode = function(res, records, viewmodel)
	{
		var self = this;
		var result = records;
		var selectUngeocodeRecords = records.filter(function(r) { return self.searchGrid.getSelectedIds().indexOf(r.Id) >= 0 });
		if (res.obSelectedSpecifyRecords() == "selected")
		{
			result = selectUngeocodeRecords;
		}

		var needGeocodeRecords = result;
		var previousCount = self.previouslyGeocodeList.length;
		if (res.obSelectedSpecifyRecords() == "selected")
		{
			self.previouslyGeocodeList = _.difference(self.searchGrid.getSelectedIds(), needGeocodeRecords.map(x => x.Id));
			previousCount = self.previouslyGeocodeList.length;
		}

		if (needGeocodeRecords.length > 0)
		{
			self.copyMailToGeoAddress(needGeocodeRecords, res).then(function()
			{
				if (res.isInteractive())
				{
					self._executeGeocodeInteractive(res, needGeocodeRecords, previousCount, viewmodel);
				}
				else
				{
					self._executeGeocodeAuto(res, needGeocodeRecords, previousCount);
				}
			})
		}
		else
		{
			self.notMatchList = [];
			self.successMatchList = [];
			var message = self.getMessage(previousCount, 0, 0);
			tf.promiseBootbox.alert(message, "Geocode Results").then(function()
			{
				self.clearRecords();
			});
			self.bindLinkEvent();
		}
	}

	// replace by next function with same name
	GeocodeTool.prototype._executeGeocodeAuto = function(res, needGeocodeRecords, previousCount, viewmodel)
	{
		var self = this;
		tf.loadingIndicator.show();
		GeocodeTool.geocodeAddresses(res.obSelectedGeocodeSource(), needGeocodeRecords).then(function(result)
		{
			self.updateRecordsByCoordinates(result, previousCount, needGeocodeRecords, res.obSelectedGeocodeSource());
		});
	}

	// the new way to use arcgis online
	GeocodeTool.prototype._executeGeocodeAuto = function(res, needGeocodeRecords, previousCount)
	{
		const self = this;
		needGeocodeRecords = needGeocodeRecords || [];
		Promise.all((needGeocodeRecords).map(record =>
		{
			if (record.Street)
			{
				const address = {
					Street: record.Street,
					City: record.City || '',
					State: record.State || '',
					Zone: record.Zip || ''
				};
				const analysis = TF.GIS.Analysis.getInstance();
				return analysis.geocodeService.addressToLocations(address).then((result) => {
					const location = {
						x: result.location.x,
						y: result.location.y,
						score: result.score
					};

					record.Xcoord = record.XCoord = +location.x.toFixed(6);
					record.Ycoord = record.YCoord = +location.y.toFixed(6);
					record.GeocodeScore = +location.score.toFixed(2);
					record.Geocoded = true;
					return record;
				}).catch((error) => {
					console.log(error);
				});
			}
		})).then((records)=>{
			self.updateRecordsByCoordinates(records, previousCount, needGeocodeRecords, res.obSelectedGeocodeSource());
		});
	}

	GeocodeTool.prototype._executeGeocodeInteractive = function(res, needGeocodeRecords, previousCount, viewmodel)
	{
		var self = this;
		var interactiveGeocodeModal = new TF.Modal.Grid.GeocodeInteractiveModalViewModel(res.obSelectedGeocodeSource(), needGeocodeRecords, previousCount, self.viewModel);
		tf.modalManager.showModal(interactiveGeocodeModal).then(function(result)
		{
			if (result)
			{
				var points = [], manuallyPinResults = [], nonPinResults = [];
				result.forEach(function(r)
				{
					if (r.isManuallyPin)
					{
						manuallyPinResults.push(r);
					} else
					{
						nonPinResults.push(r);
						points.push({
							attributes: { Addr_type: "street" },
							location: { x: r.Xcoord, y: r.Ycoord }
						});
					}
				})

				let validResult = result.filter(r => r.Xcoord);
				// has valid record and the grid type is geo regions.
				if (validResult.length > 0 && validResult[0].GeoRegionTypeId)
				{
					GeocodeTool.createBoundary(validResult);
				}

				self.updateRecordsByCoordinates(nonPinResults.concat(manuallyPinResults), previousCount, needGeocodeRecords, "Interactive");
			}
		});
	}

	GeocodeTool.prototype.getMessage = function(previousCount, geocodeCount, ungeocodeCount)
	{
		function cursor(count)
		{
			return count > 0 ? "pointer" : "default";
		}
		return "<div id='geocode-dialog'>" + '<span id="geocode-previous-complete-link" style="cursor: ' + cursor(previousCount) + ';">' + previousCount + (previousCount != 1 ? " records" : " record") + (previousCount != 1 ? " were" : " was") + " previously geocoded\n" + "</span>"
			+ '<span id="success-match-link" style="cursor: ' + cursor(geocodeCount) + ';">' + geocodeCount + (geocodeCount != 1 ? " records" : " record") + (geocodeCount != 1 ? " were" : " was") + " successfully matched\n" + "</span>"
			+ '<span id="not-match-link" style="cursor: ' + cursor(ungeocodeCount) + ';">' + ungeocodeCount + (ungeocodeCount != 1 ? " records" : " record") + " could not be matched" + "</span>" + "</div>";
	};

	GeocodeTool.prototype.copyMailToGeoAddress = function(records, res)
	{
		const self = this,
			data = [],
			gridType = self.searchGrid._gridType;
		if (gridType != "student" || gridType === "fieldtriplocation" || res.obSelectedGeocodeSource().toLowerCase() != "street address range")
		{
			return Promise.resolve(records);
		}
		records.forEach(function(record)
		{
			if (!record.GeoStreet || record.GeoStreet.length == 0)
			{
				record.GeoStreet = record.MailStreet1 + (record.MailStreet2 ? " " + record.MailStreet2 : "");
				record.GeoCity = record.MailCity;
				record.GeoZip = record.MailZip;
				//record.GeoCounty = record.MailState;
				data.push({ "Id": record.Id, "op": "replace", "path": "/GeoStreet", "value": record.GeoStreet || "" });
				data.push({ "Id": record.Id, "op": "replace", "path": "/GeoCity", "value": record.GeoCity || "" });
				data.push({ "Id": record.Id, "op": "replace", "path": "/GeoZip", "value": record.GeoZip || "" });
				//data.push({ "Id": record.Id, "op": "replace", "path": "/GeoCounty", "value": record.GeoCounty || "" });
			}
		});
		return tf.promiseAjax.patch(pathCombine(tf.api.apiPrefix(), tf.dataTypeHelper.getEndpoint(self.searchGrid._gridType)), {
			data: data,
		}).then(function()
		{
			return Promise.resolve(records);
		});
	}

	GeocodeTool.prototype.getRecords = function(useSelected)
	{
		const self = this,
			gridType = this.searchGrid._gridType,
			url = pathCombine(tf.api.apiPrefix(), "search", tf.dataTypeHelper.getEndpoint(gridType)),
			filterData = $.extend({}, self.searchGrid.searchOption.data),
			fields = ["Xcoord", "Ycoord", "Id", "GeoStreet", "GeoCity", "GeoZip", "GeoCounty"];

		switch(gridType)
		{
			case "student":
				filterData.fields = fields.concat(["Grade", "FirstName", "LastName", "ResidSchool", "DistanceFromSchl", "DistanceFromResidSch", "School", "MailStreet1", "MailStreet2", "MailZip", "MailCity", "MailState"]);
				["street", "city", "state", "zip"].forEach(c => { filterData.fields.push(GeocodeTool.getAddressFieldNameByGridType(c, "student")) });
				break;
			case "georegion":
				filterData.fields = fields.concat(["GeoRegionTypeId", "Name"]);
				break;
			case "fieldtriplocation":
				filterData.fields = fields.concat(["Name", "City", "Street", "State", "Zip", "XCoord", "YCoord"]);
				break;
			default:
				filterData.fields = fields.concat(["Name"]);
				break;
		}

		if (useSelected)
		{
			filterData.idFilter = {
				IncludeOnly: self.searchGrid.getSelectedIds()
			};
		}

		filterData.sortItems = []; // For this scenario, we didn't need the sort items.
		return tf.promiseAjax.post(url, {
			paramData: {},
			data: filterData
		}).then(function({Items})
		{
			if(gridType !== "fieldtriplocation")
			{
				return Items;
			}

			return Items.map(i => ({ ...i, Xcoord: i.XCoord, Ycoord: i.YCoord }));
		}).then(function(items)
		{
			var needGeocodeRecords = [];
			items.forEach(function(record)
			{
				record.Name = record.Name || (record.FirstName + " " + record.LastName);
				if (record.Xcoord == null || record.Xcoord == 0 || record.Ycoord == null || record.Ycoord == 0)
				{
					needGeocodeRecords.push(record);
				}
				else
				{
					self.previouslyGeocodeList.push(record.Id);
				}
			});

			return needGeocodeRecords;
		});
	};

	GeocodeTool.geocodeAddresses = function(sourceType, records)
	{
		if (sourceType == "Phone")
		{
			var url = pathCombine(tf.api.apiPrefix(), "studentGeocodes") + "?ids=" + records.map(function(record)
			{
				return record.Id;
			}).join(",");
			return tf.promiseAjax.get(url).then(function(responses)
			{
				var result = [];
				if (responses && responses.Items)
				{
					var geocodeInfos = responses.Items;
					geocodeInfos.forEach(function(geocodeInfo)
					{
						if (geocodeInfo.Students && geocodeInfo.Students.length == 1)
						{
							result.push({
								Id: geocodeInfo.Id, Xcoord: geocodeInfo.Students[0].Xcoord, Ycoord: geocodeInfo.Students[0].Ycoord
							});
						}
					});
				}
				return Promise.resolve(result);
			});
		}

		var isAddressPoint = sourceType ? sourceType.toLowerCase() == "address point" : false;
		return tf.startup.loadArcgisUrls().then(function()
		{
			// when auto geocoding, if any one of the address(street name,street number or &,Zip) is missing, the record is skipped and not geocoded.
			// RW-37432. With the changes in RW-16206 and RW-14543, the requirement for street number needs to allow digits or alphabets.
			const digAndAlphaRegex = /^[0-9a-zA-Z]+$/;
			records = records.filter(function(record)
			{
				return record.GeoStreet && record.GeoZip &&
					(digAndAlphaRegex.test(record.GeoStreet.split(" ")[0]) || records[0].GeoStreet.indexOf("&") > 0 || records[0].GeoStreet.toLowerCase().indexOf(" and ") > 0);

			});
			if (records.length == 0)
			{
				return Promise.resolve([]);
			}
			return records;
		}).then(function(records)
		{
			var recordSet = [];
			var batchSize = 500;
			for (var i = 0; i <= records.length / batchSize; i++)
			{
				recordSet[i] = records.slice(i * batchSize, (i + 1) * batchSize);
			}

			var promises = [], addressSet = [];
			recordSet.forEach(function(records, i)
			{
				var addresses = [];
				addresses = records.map(function(item, index)
				{
					// geocode rules: 1.case insensitive 2.need to have space(s) around & for intersection geocode.
					var streetAddress = item.GeoStreet ? item.GeoStreet.toLowerCase().replace(/&&/g, " & ").replace(/ and /g, " & ") : "";
					if (streetAddress.indexOf(" & ") < 0) { streetAddress = streetAddress.replace(/&/g, " & "); }
					var attr = {
						"attributes": {
							"OBJECTID": index + 1,
							"Address": streetAddress,
							"City": (item.GeoCity && item.GeoCity.trim().length > 0) ? item.GeoCity.trim() : "",
							"Postal": item.GeoZip ? item.GeoZip : ""
						}
					};
					// if (isAddressPoint)
					// {
					// 	attr = {
					// 		"attributes": {
					// 			"OBJECTID": index + 1,
					// 			"Address": streetAddress,
					// 			// "City": item.GeoCity ? item.GeoCity : "",//comment this now since T1 has bugs and don't have zip and city.
					// 			"ZIP": item.GeoZip ? item.GeoZip : ""
					// 		}
					// 	};
					// }
					return attr;
				});
				var data = { "records": addresses };
				addressSet[i] = addresses;
				var query = {
					"f": "json",
					"addresses": JSON.stringify(data),
					"outSR": "4326"
				};
				var geocodeUrl = arcgisUrls.StreetGeocodeServiceFile + "/geocodeAddresses";
				if (isAddressPoint)
				{
					geocodeUrl = arcgisUrls.AddressPointGeocodeService + "/geocodeAddresses";
				}

				promises.push(tf.map.ArcGIS.esriRequest(geocodeUrl,
					{
						responseType: "json",
						query: query
					}
				));
			});
			return Promise.all(promises).then(function(responses)
			{
				var result = [];
				responses.forEach(function(response, i)
				{
					var res = response.data.locations.sort(function(a, b) { return (a.attributes.ResultID - b.attributes.ResultID > 0) ? 1 : -1; });
					result = result.concat(res.map(function(item, j)
					{
						if (item.score < 80 || !checkResult(addressSet[i][j].attributes, item, isAddressPoint)) { return false; }
						let record = records[i * batchSize + j];
						let recordEntity = {
							Id: record.Id,
							Xcoord: item.location.x,
							Ycoord: item.location.y,
							location: item.location,
							attributes: item.attributes,
							address: item.address,
							GeoStreet: item.attributes.StAddr,
							GeoZip: item.attributes.Postal,
							GeoCity: item.attributes.City,
							GeoCounty: item.attributes.Region,
							Grade: records[i * batchSize + j].Grade
						};

						if (record.GeoRegionTypeId)
						{
							recordEntity.GeoRegionTypeId = record.GeoRegionTypeId;
						}

						return recordEntity;
					}));
				});

				let validResult = result.filter(r => r !== false && r.Xcoord);
				// has valid record and the grid type is geo regions.
				if (validResult.length > 0 && validResult[0].GeoRegionTypeId)
				{
					GeocodeTool.createBoundary(validResult);
				}

				return Promise.resolve(result);
			});
			function checkResult(inputAddress, result)
			{
				// check if the result zipcode and address matches the input geocode address.
				if ($.trim(inputAddress.Postal).length > 0)
				{
					if ($.trim(inputAddress.Postal) != $.trim(result.address.split(",")[result.address.split(",").length - 1])) return false;
				}
				var isStreetMatch = TF.RoutingMap.GeocodeHelper.isExactMatchStreet((result.address || "").toLowerCase(), $.trim(inputAddress.Address.toLowerCase()));
				if (!isStreetMatch) return false;
				//if (inputAddress.Street.indexOf("&") >= 0 && result.attributes.Loc_name.indexOf("intersection") < 0) return false;
				//if (inputAddress.Street.indexOf("&") < 0 && result.attributes.Loc_name.indexOf("streetLocator") < 0) return false;
				return true;
			}

		});
	};

	GeocodeTool.createBoundary = function(geoRecords)
	{
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "georegiontypes")).then(result =>
		{
			const geoRegionTypes = {};
			result.Items.forEach(item =>
			{
				geoRegionTypes[item.Id] = item;
			});

			let promises = [];

			geoRecords.forEach(recordEntity =>
			{
				let typeid = recordEntity.GeoRegionTypeId;
				if (typeid)
				{
					let geoRegionType = geoRegionTypes[typeid];
					if (!geoRegionType || geoRegionType.Boundary === "User Defined")
					{
						return;
					}

					let promise = GeocodeTool.getBoundaryGeometry(geoRegionType, recordEntity);
					promises.push(promise);
				}
			});

			return Promise.all(promises);
		}).then(geoRegions =>
		{
			let validGeoRegions = geoRegions.filter(g => g !== false);
			if (validGeoRegions.length > 0)
			{
				const layer = TF.Helper.QueryFeatureHelper.getFeatureLayerById("georegion");
				layer.applyEdits({ addFeatures: validGeoRegions });
			}
		});

	}

	GeocodeTool.getBoundaryGeometry = function(geoRegionType, recordEntity)
	{
		let distanceUnit = geoRegionType.DistanceUnits,
			bufferUnit = geoRegionType.BufferUnits,
			distance = geoRegionType.Distance,
			buffer = geoRegionType.Buffer,
			boundary = geoRegionType.Boundary;

		const boundaryMapping = {
			"Radius": 1,
			"Street Path": 0
		};
		const type = boundaryMapping[boundary];
		if (type === null)
		{
			return Promise.resolve(false);
		}

		const graphic = new tf.map.ArcGIS.Graphic(TF.xyToGeometry(recordEntity.Xcoord, recordEntity.Ycoord), null, null);
		const stopTool = new TF.RoutingMap.RoutingPalette.StopTool(null, null, null);

		return stopTool.generateWalkoutGeometry(graphic, distance, distanceUnit, buffer, bufferUnit, type)
			.then((geometry) =>
			{
				if (!geometry)
				{
					return false;
				}

				let georegion = new tf.map.ArcGIS.Graphic(geometry, null, {
					BdyType: 0,
					DBID: tf.datasourceManager.databaseId,
					GeoID: recordEntity.Id,
					GeoType: 1,
					Style: ""
				});

				return georegion;
			});
	}

	GeocodeTool.prototype.updateRecordsByCoordinates = function(result, previousCount, needGeocodeRecords, updateSource)
	{
		var self = this, entities = [];

		result.forEach(function(record)
		{
			if (record)
			{
				entities.push(record);
			}
		});
		tf.loadingIndicator.tryHide();
		if (entities.length > 0)
		{
			self.updateRecordsCoors(entities, needGeocodeRecords, previousCount, updateSource);
		} else
		{
			self.notMatchList = needGeocodeRecords.map(function(r) { return r.Id; });
			self.successMatchList = [];
			var message = self.getMessage(previousCount, 0, needGeocodeRecords.length);
			tf.promiseBootbox.alert(message, "Geocode Results").then(function()
			{
				self.clearRecords();
				self.searchGrid.refresh();
			});
			self.bindLinkEvent();
		}
	};

	GeocodeTool.prototype.clearRecords = function()
	{
		this.previouslyGeocodeList = [];
		this.successMatchList = [];
		this.notMatchList = [];
	};

	GeocodeTool.prototype.updateRecordsCoors = function(entities, needGeocodeRecords, previousCount, updateSource)
	{
		var self = this, data = [], gridType = self.viewModel.type;
		entities.forEach(function(entity)
		{
			if (gridType === "fieldtriplocation")
			{
				data.push({ "Id": entity.Id, "op": "replace", "path": "/XCoord", "value": entity.XCoord });
				data.push({ "Id": entity.Id, "op": "replace", "path": "/YCoord", "value": entity.YCoord });
				data.push({ "Id": entity.Id, "op": "replace", "path": "/GeocodeScore", "value": entity.GeocodeScore });
			}
			else
			{
				data.push({ "Id": entity.Id, "op": "replace", "path": "/Xcoord", "value": entity.Xcoord });
				data.push({ "Id": entity.Id, "op": "replace", "path": "/Ycoord", "value": entity.Ycoord });
				data.push({ "Id": entity.Id, "op": "replace", "path": "/GeoConfidence", "value": GeocodeTool.getGeoConfidence(entity.isManuallyPin ? "ManuallyPin" : updateSource) });
				if (gridType == "student" || updateSource == "Interactive")
				{
					addSystemAddressFileds(data, entity, gridType);
				}
			}
		});

		function addSystemAddressFileds(data, entity, gridType)
		{
			data.push({
				"Id": entity.Id, "op": "replace", "path": "/" + GeocodeTool.getAddressFieldNameByGridType("street", gridType), "value": entity.GeoStreet
			});
			data.push({
				"Id": entity.Id, "op": "replace", "path": "/" + GeocodeTool.getAddressFieldNameByGridType("zip", gridType), "value": entity.GeoZip
			});
			data.push({
				"Id": entity.Id, "op": "replace", "path": "/" + GeocodeTool.getAddressFieldNameByGridType("city", gridType), "value": entity.GeoCity
			});
			data.push({
				"Id": entity.Id, "op": "replace", "path": "/" + GeocodeTool.getAddressFieldNameByGridType("state", gridType), "value": entity.GeoCounty
			});
		}

		tf.loadingIndicator.showImmediately();
		return self.automation(entities, data).then(function()
		{
			tf.promiseAjax.patch(pathCombine(tf.api.apiPrefix(), tf.dataTypeHelper.getEndpoint(self.searchGrid._gridType)), {
				data: data,
			}).then(function()
			{
				self.findSchedule(entities).then(function()
				{
					tf.loadingIndicator.tryHide();
					self.searchGrid.refresh();
					self.successMatchList = entities.map(function(e) { return e.Id; });
					self.notMatchList = needGeocodeRecords.filter(function(r)
					{
						return !Enumerable.From(entities).Any(function(ts) { return ts.Id == r.Id; });
					}).map(function(r)
					{
						return r.Id;
					});
					var message = self.getMessage(previousCount, entities.length, needGeocodeRecords.length - entities.length);
					tf.promiseBootbox.alert(message, "Geocode Results").then(function()
					{
						self.clearRecords();
					});
					self.bindLinkEvent();
				});
			});
		});
	};

	GeocodeTool.prototype.automation = function(entities, paramData)
	{
		var self = this;

		if (self.searchGrid._gridType == "student")
		{
			return TF.AutomationHelper.getSetting().then(function(setting)
			{
				self.automationSetting = setting;
				return TF.AutomationHelper.getGrades().then(function(grades)
				{
					var promises = [];
					entities.forEach(function(student)
					{
						student.SchoolCode = student.School;
						student.GradeId = student.GradeId ? student.GradeId : student.Grade ? grades.find(function(g) { return g.Code == student.Grade; }).Id : null
						promises.push(TF.AutomationHelper.autoFind(student, setting));
					});
					return Promise.all(promises).then(function()
					{
						entities.forEach(function(student)
						{
							paramData.push({ "Id": student.Id, "op": "replace", "path": "/DistanceFromSchl", "value": student.DistanceFromSchl || 0 });
							paramData.push({ "Id": student.Id, "op": "replace", "path": "/DistanceFromResidSch", "value": student.DistanceFromResidSch || 0 });
							paramData.push({ "Id": student.Id, "op": "replace", "path": "/ResidSchool", "value": student.ResidSchool || "" });
						});
					});
				});
			});
		}

		return Promise.resolve();
	};

	GeocodeTool.prototype.findSchedule = function(entities)
	{
		var self = this, setting = self.automationSetting;
		if (self.searchGrid._gridType == "student" && setting.findScheduleforStudent)
		{
			var promise = [];
			entities.forEach(function(recordEntity)
			{
				promise.push(TF.AutomationHelper.findSchedule([recordEntity.Id], setting.useStopPool, setting.selectedStopPoolCategoryId, setting.createDoorToDoor));
			});
			return Promise.all(promise);
		}

		return Promise.resolve();
	};

	GeocodeTool.prototype.bindLinkEvent = function()
	{
		var self = this;
		setTimeout(function()
		{
			$('#geocode-dialog').click(function(e)
			{
				function linkTo(ids, event)
				{
					if (ids.length == 0)
					{
						return;
					}
					var documentData = new TF.Document.DocumentData(TF.Document.DocumentData.Grid,
						{
							gridType: self.viewModel.type,//'student',
							isTemporaryFilter: false,
							gridState: {
								gridFilterId: null,
								filteredIds: ids
							}
						});
					tf.documentManagerViewModel.add(documentData, true, true, "", true, event.shiftKey);
				}

				if ($(e.target).closest("#geocode-previous-complete-link").length > 0)
				{
					linkTo.call(self, self.previouslyGeocodeList, e);
				}
				else if ($(e.target).closest("#success-match-link").length > 0)
				{
					linkTo.call(self, self.successMatchList, e);
				}
				else if ($(e.target).closest("#not-match-link").length > 0)
				{
					linkTo.call(self, self.notMatchList, e);
				}
			});
		}, 100);
	};

	GeocodeTool.getGeoConfidence = function(updateSource)
	{
		switch (updateSource)
		{
			case "Phone":
				return 888;
			case "Interactive":
				return 105;
			case "ManuallyPin":
				return 997;
			default:
				return 101;
		}
	};

	GeocodeTool.getAddressFieldNameByGridType = function(fielType, gridType)
	{
		var fields = {
			"street": "GeoStreet",
			"city": "GeoCity",
			"zip": "GeoZip",
			"state": "GeoCounty"
		}
		var student_fields = {
			"street": "SystemStreet",
			"city": "SystemCity",
			"zip": "SystemZip",
			"state": "SystemState"
		}

		var fieldName = gridType == "student" ? student_fields[fielType.toLowerCase()] : fields[fielType.toLowerCase()];
		return fieldName;

	}

})();
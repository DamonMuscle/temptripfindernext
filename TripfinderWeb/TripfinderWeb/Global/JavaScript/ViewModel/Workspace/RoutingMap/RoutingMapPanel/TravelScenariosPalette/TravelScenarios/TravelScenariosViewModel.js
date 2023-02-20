(function()
{
	createNamespace("TF.RoutingMap.TravelScenariosPalette").TravelScenariosViewModel = TravelScenariosViewModel;
	function TravelScenariosViewModel(viewModel, isOpen, routeState)
	{
		var self = this;
		self.type = "travelScenarios";
		self.$element = null;
		self.routeState = routeState;
		self.viewModel = viewModel;
		self._viewModal = viewModel._viewModal;
		self.obPreviousSelectedTravelScenarios = null;
		self.obSelectedTravelScenarios = ko.observable();
		self.obSelectedTravelScenarios.subscribe(this.setTravelScenariosToData, this);
		self.obTravelScenarios = ko.observableArray();
		self.obTravelScenariosFooterDisplay = ko.observable("");
		self.dataModel = new TF.RoutingMap.TravelScenariosPalette.TravelScenariosDataModel(self);
		self.eventsManager = new TF.RoutingMap.TravelScenariosPalette.TravelScenariosEventsManager(self);
		this.streetCurbTurnDataModel = new TF.RoutingMap.TravelScenariosPalette.StreetCurbTurnDataModel(this._viewModal);
		self.dataModel.travelScenariosCollectionChangedEvent.subscribe(self.onTravelScenariosCollectionChanged.bind(self));
		self.getStreetApprove().then(result =>
		{
			// TODO: Uncomment this line when MapEditing palette is added.
			// self._viewModal.mapEditingPaletteViewModel.myStreetsViewModel.dataModel.streetsLockData.obSelfChangeStyle(!result);
		});
		self.mapEditingSections = {
			"Streets": "My Streets",
			"Railroads": "My Railroads",
			"Landmarks": "My Landmarks",
			"PC": "Postal Code Boundaries",
			"MC": "Municipal Boundaries",
			"Water": "Water",
			"Parcel": "Parcels & Address Points"
		};
	}

	TravelScenariosViewModel.prototype.setTravelRegionFooterDisplay = function(gridType)
	{
		var self = this;
		this.obTravelScenariosFooterDisplay(this.getFooterDisplay(self.obTravelScenarios(), "Travel Scenario"));
	};

	TravelScenariosViewModel.prototype.getFooterDisplay = function(countInfo, typeTitle)
	{
		if (countInfo.length > 1 || countInfo.length == 0)
		{
			typeTitle = "Travel Scenarios";
		}
		return String.format("{0} {1} ", countInfo.length, typeTitle);
	};

	TravelScenariosViewModel.prototype.uiInit = function(viewModal, e)
	{
		this.$element = $(e);
	};

	TravelScenariosViewModel.prototype.init = function()
	{
		this.streetCurbTurnDataModel.init();
		this.dataModel.init();
	};

	TravelScenariosViewModel.prototype.compareTravelScenarios = function(a, b)
	{
		return this.dataModel.compare(a, b, "Name");
	};

	TravelScenariosViewModel.prototype.changeToObservable = function(data)
	{
		for (var key in data)
		{
			if (!data.hasOwnProperty(key)) continue;
			if (data.hasOwnProperty("ob" + key.substring(0, 1).toUpperCase() + key.substring(1, key.length))) continue;
			if (key.indexOf("ob") == 0)
			{
				continue;
			}
			data["ob" + key.substring(0, 1).toUpperCase() + key.substring(1, key.length)] = ko.observable(data[key]);
		}
		return $.extend(true, {}, data);
	};

	TravelScenariosViewModel.prototype.onTravelScenariosCollectionChanged = function()
	{
		var self = this;
		self.obTravelScenarios([]);
		self.obTravelScenarios(self.dataModel.travelScenarios.sort(self.compareTravelScenarios.bind(self)));
		self.setTravelRegionFooterDisplay();
	};

	TravelScenariosViewModel.prototype.show = function()
	{
		// this.obPreviousSelectedTravelScenarios = null;
		return this.dataModel.getSetting().then((setting) =>
		{
			if (setting.showStreet)
			{
				// display street
				// TODO: Uncomment this line when MapEditing palette is added.
				// this._viewModal.mapEditingPaletteViewModel.myStreetsViewModel.show();
				// display curb and turn
				this.streetCurbTurnDataModel.getCurbAndTurnData();
			}
			return this.dataModel.init();
		});
	};

	TravelScenariosViewModel.prototype.close = function()
	{
		var self = this;
		if (this.viewModel.showCount == 0)
		{
			if (self.obSelectedTravelScenarios() && self.obSelectedTravelScenarios().Id != -1)
			{
				TF.RoutingMap.TravelScenariosPalette.TravelScenariosDataModel.unUseTravelScenario(self.obSelectedTravelScenarios().Id, self.routeState);
			}

			self.obPreviousSelectedTravelScenarios = null;
			self.streetCurbTurnDataModel.clearUI();
			self._viewModal.mapEditingPaletteViewModel.myStreetsViewModel.close();
		}
	};

	TravelScenariosViewModel.prototype.isActive = function()
	{
		const self = this;

		return self.obSelectedTravelScenarios() == null ? false : true;
	};

	TravelScenariosViewModel.prototype.setTravelScenariosToData = function()
	{
		var self = this;

		if (self._viewModal.sketchTool) self._viewModal.sketchTool.stopAndClear();
		// use setTimeout to wait sketch tool stop
		setTimeout(function()
		{
			if (self.obSelectedTravelScenarios() && self.viewModel.travelRegionsViewModel)
			{
				self.viewModel.travelRegionsViewModel.dataModel.travelRegionLockData.obSelfChangeStyle(self.obSelectedTravelScenarios().Approve === 0);
			}

			if (self.obPreviousSelectedTravelScenarios == null || (self.obPreviousSelectedTravelScenarios != null
				&& self.obSelectedTravelScenarios() && self.obSelectedTravelScenarios().Id !== self.obPreviousSelectedTravelScenarios.Id)
				|| (self.obSelectedTravelScenarios() == null && self.obPreviousSelectedTravelScenarios != null))
			{
				self.viewModel.unSaveCheck("", true).then(function(result)
				{
					if (result == null)
					{
						self.obSelectedTravelScenarios(self.obPreviousSelectedTravelScenarios);
						return;
					}
					if (result == "break")
					{
						return;
					}
					self.obTravelScenarios().map(function(item)
					{
						if (self.obSelectedTravelScenarios() && item.Id == self.obSelectedTravelScenarios().Id)
						{
							item.isSelected = true;
						}
						else
						{
							item.isSelected = false;
						}
					});
					PubSub.publish("selected-travel-scenario-change" + self.routeState, self.obSelectedTravelScenarios());
					self.dataModel.setLastSelectedTravelScenario(self.obSelectedTravelScenarios());

					const releasingTravelScenarioId = self.obPreviousSelectedTravelScenarios && self.obPreviousSelectedTravelScenarios.Id;
					if (releasingTravelScenarioId)
					{
						TF.RoutingMap.TravelScenariosPalette.TravelScenariosDataModel.unUseTravelScenario(releasingTravelScenarioId, self.routeState);
					}

					if (self.obSelectedTravelScenarios())
					{
						TF.RoutingMap.TravelScenariosPalette.TravelScenariosDataModel.useTravelScenario(self.obSelectedTravelScenarios().Id, self.routeState);
					}

					self.obPreviousSelectedTravelScenarios = self.obSelectedTravelScenarios();
				});
			}
		}, 100);
	};

	TravelScenariosViewModel.prototype.IsLock = function()	
	{
		return this.dataModel.lockData.getLockInfo();
	};

	TravelScenariosViewModel.prototype.lock = function(travelScenaioIds)
	{
		this._changeTravelScenarioLockStatus(travelScenaioIds, true);
	};

	TravelScenariosViewModel.prototype.unLock = function(travelScenaioIds)
	{
		this._changeTravelScenarioLockStatus(travelScenaioIds, false);
	};

	TravelScenariosViewModel.prototype.getNeedApprovedScenarios = function()
	{
		return this.obTravelScenarios().filter(ts => ts.Approve != 1).map(c => c.Id);
	};

	TravelScenariosViewModel.prototype.getStreetApprove = function()
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "tfsysinfo"))
			.then(function(response)
			{
				var setting = {};
				response.Items.forEach(function(obj)
				{
					setting[obj.InfoID] = obj.InfoValue;
				});
				return setting.StreetApprove === "1";
			});
	};

	TravelScenariosViewModel.prototype.publishStreet = function(isRebuildGeocode, callback)
	{
		let self = this,
			needApprovedScenariosIds = self.getNeedApprovedScenarios(),
			isNeedApproveScenario = needApprovedScenariosIds.length > 0,
			needApprovedScenariosIdsWithoutEmpty = needApprovedScenariosIds.concat(-1);

		self._showToastMessage("Publishing streets...", true);
		self._publishTravelScenario(undefined, isRebuildGeocode).then(function(ans)
		{
			callback && callback(ans);
			self.updateVectorTileService("Streets");
			self.removeAllMessages();
			if (ans == "success")
			{
				self._showToastMessage("Streets published successfully.", true);
				if (isNeedApproveScenario)
				{
					self.changeScenarioApproveStatus(needApprovedScenariosIds).then(function()
					{
						self._updateRecords();
					});
				}
				self._changeStreetApproveStatus().then(() => self._notifyPublised());
			}
			else
			{
				self._showToastMessage("Streets failed to publish.", false);
			}
		});
	};

	TravelScenariosViewModel.prototype.ApproveSelectTravelScenario = function(travelScenario, callback, title)
	{
		var self = this, data = travelScenario;
		title = title || "Travel Scenario";
		self._showToastMessage(`Saving ${title}...`, true);

		return self._publishTravelScenario(data).then(function(ans)
		{
			self.unLock([data.Id]);
			callback && callback(ans);
			self.removeAllMessages();

			if (ans == "success")
			{
				self._showToastMessage(`${title} saved successfully.`, true);
				self.changeScenarioApproveStatus(data.Id).then(function()
				{
					self._updateRecords();
					self._notifyPublised();
				});
			}
			else
			{
				self._showToastMessage(`${title} failed to save.`, false);
			}
		});
	};

	TravelScenariosViewModel.prototype.rebuildGeocode = function()
	{
		let self = this;
		self.IsLock().then(lockedByInfo =>
		{
			if (lockedByInfo)
			{
				tf.promiseBootbox.alert(`Edits are currently being saved by ${lockedByInfo.UserName} and cannot be saved again until they are finished. This can take several minutes to complete. Please try again.`);
			}
			else
			{
				tf.AGSServiceUtil.isGPServiceExecuting(["MasterFileGDBGPService"]).then((isExecuting) =>
				{
					if (isExecuting)
					{
						tf.promiseBootbox.alert(`Map edit is currently executing and cannot be saved again until it is finished. This will take several minutes to complete. Please try again.`);
						return;
					}
					let scenariosIds = [-1];
					self.lock(scenariosIds);
					self._showToastMessage("Rebuilding geocode...", true);
					let promise = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "tfsysinfo"))
						.then(response =>
						{
							let setting = {}, publishSets = null;
							if (response.Items && response.Items.length > 0)
							{
								response.Items.forEach(function(obj)
								{
									setting[obj.InfoID] = obj.InfoValue;
								});
								if (setting["InActiveServiceFolderName"] && setting["ActiveServiceFolderName"])
								{
									publishSets = self._generatePublishSets(setting, false);
								}
							}

							if (!publishSets) return Promise.resolve("fail");

							return self.rebuildFileGeocode(setting["InActiveServiceFolderName"], publishSets.firstSet.rebuildStreetGeocodeFileUrl).then(ans =>
							{
								if (ans == "success")
								{
									return self._updateInActiveServiceFolderName(publishSets.firstSet.nowActiveFolder, publishSets.firstSet.nowInActiveFolder).then(() =>
									{
										return Promise.resolve("success");
									});
								}
								else
								{
									return Promise.resolve("fail");
								}
							});
						})
						.catch(() =>
						{
							return Promise.resolve("fail");
						});

					promise.then(ans =>
					{
						self.unLock(scenariosIds);
						if (ans == "success")
						{
							self._showToastMessage("Rebuilt geocode successfully.", true);
						}
						else
						{
							self._showToastMessage("Rebuilding geocode failed.", false);
						}
					});
				});
			}
		});
	};

	TravelScenariosViewModel.prototype.updateVectorTileService = function(vectorType)
	{
		var self = this;
		self._showToastMessage("Updating " + self.mapEditingSections[vectorType] + " Vector Tile Basemap...", true);
		var processor = new tf.map.ArcGIS.Geoprocessor(arcgisUrls.UpdateVectorBasemapService + "/UpdateVectorBaseMap");
		var portalUrl = arcgisUrls.PortalURL.trim().replace(/\/$/, "") + "/portaltest";
		var params = {
			"UpdateList": vectorType,
			"ProjectsPath": arcgisUrls.ProjectFolder4UpdateVector,
			"PublishOrUpdate": "Update",
			"PortalUrl": portalUrl
		};
		return processor.submitJob(params).then(function(jobInfo)
		{
			var jobid = jobInfo.jobId;
			return processor.waitForJobCompletion(jobid, {}).then(function(res)
			{
				return gpJobComplete(res)
			})
		}).catch(function()
		{
			self._showToastMessage("Updating " + self.mapEditingSections[vectorType] + " Vector Tile Basemap failed.", false);
		})

		function gpJobComplete(result)
		{
			if (result.jobStatus.indexOf("failed") >= 0)
			{
				self._showToastMessage("Updating " + self.mapEditingSections[vectorType] + " Vector Tile Basemap failed.", false);
			}
			else
			{
				self._showToastMessage("Updated " + self.mapEditingSections[vectorType] + " Vector Tile Basemap successfully.", true);
				self.reloadVectorTileBasemap();
			}
		}
		// tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase("v2"), "arcgis", "VectorTileService")).catch(() =>
		// {
		//});
	};

	TravelScenariosViewModel.prototype.reloadVectorTileBasemap = function()
	{
		var self = this;
		if (self._viewModal._map.basemap.id == "my-maps")
		{
			self._viewModal.mapLayersPaletteViewModel.allDisplaySettings.forEach(function(displaySetting)
			{
				displaySetting.loadStyle();
			});
		}
	}

	TravelScenariosViewModel.prototype._publishTravelScenario = function(travelScenarioData, isRebuildGeocode)
	{
		var self = this, params = {}, publishSets = null, isPublishStreet = !travelScenarioData;
		var setting = {};

		// Only rebuild TravelScenario if connect to self hosted ArcGIS environment
		// if(self._viewModal.directionPaletteViewModel.obMapServiceType() != 2)
		// {
		// 	return Promise.resolve("success");
		// }

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "tfsysinfo"))
			.then(function(response)
			{
				if (response.Items && response.Items.length > 0)
				{
					response.Items.forEach(function(obj)
					{
						setting[obj.InfoID] = obj.InfoValue;
					});
					if (setting["InActiveServiceFolderName"] && setting["ActiveServiceFolderName"])
					{
						publishSets = self._generatePublishSets(setting, !isPublishStreet);
					}
				}

				if (!publishSets) return Promise.resolve("fail");

				if (!isPublishStreet)
				{
					if ($.isArray(travelScenarioData))
					{
						params = {
							"ScenarioId": travelScenarioData.map(function(c) { return c.Id; }).join(),
							"ProhibitedId": travelScenarioData.map(function(c) { return c.ProhibitedId; }).join(),
							"RestrictedId": travelScenarioData.map(function(c) { return c.RestrictedId; }).join()
						};
					}
					else
					{
						params = {
							"ScenarioId": travelScenarioData.Id,
							"ProhibitedId": travelScenarioData.ProhibitedId,
							"RestrictedId": travelScenarioData.RestrictedId
						};
					}
				}
				params["ServiceFolder"] = setting["InActiveServiceFolderName"];
				params["Delete Dataset"] = "DEL";
				params["IsRunForLinuxPublish"] = "False";

				return self._copyPublishAndRebuildStreetGeocode(travelScenarioData, publishSets.firstSet.copyPublishProcessor, publishSets.firstSet.rebuildStreetGeocodeFileUrl, params, isPublishStreet, isRebuildGeocode, true).then(function(ans)
				{
					if (ans == "success")
					{
						return self._updateInActiveServiceFolderName(publishSets.firstSet.nowActiveFolder, publishSets.firstSet.nowInActiveFolder).then(function(response)
						{
							params["ServiceFolder"] = setting["ActiveServiceFolderName"];
							self._copyPublishAndRebuildStreetGeocode(travelScenarioData, publishSets.secondSet.copyPublishProcessor, publishSets.secondSet.rebuildStreetGeocodeFileUrl, params, isPublishStreet, isRebuildGeocode, false).then(() =>
							{
								self.unLock(self.getNeedApprovedScenarios().concat(-1));
							});
							return Promise.resolve("success");
						});
					}
					else
					{
						self.unLock(self.getNeedApprovedScenarios().concat(-1));
						return Promise.resolve("fail");
					}
				});
			})
			.catch(() =>
			{
				return Promise.resolve("fail");
			});
	};

	TravelScenariosViewModel.prototype._generatePublishSets = function(setting, isApprove)
	{
		var serviceDirectory = $.trim(setting["ARCGISSERVER"]) + "/arcgis/rest/services/",
			activeFileBasedFolderName = setting["ActiveServiceFolderName"] + "/",
			inActiveFileBasedFolderName = setting["InActiveServiceFolderName"] + "/",
			buildFileBasedFolderName = setting["ActiveServiceFolderName"].endsWith("_Master") ? activeFileBasedFolderName : inActiveFileBasedFolderName,
			//buildStreetGeocodeServiceFile = serviceDirectory + buildFileBasedFolderName + setting["StreetRebuildServiceName"] + "/GPServer",
			MasterFileGDBGPService = serviceDirectory + buildFileBasedFolderName + setting["MasterFileGDBGPService"] + "/GPServer",
			// copyStreetAndRebuildService = serviceDirectory + buildFileBasedFolderName + setting["CopyStreetAndRebuildService"] + "/GPServer",
			copyAndPublishFileUrl = isApprove ? MasterFileGDBGPService + "/RebuildScenario" : MasterFileGDBGPService + "/CopyAndRebuild";
		return {
			firstSet: {
				copyPublishProcessor: new tf.map.ArcGIS.Geoprocessor(copyAndPublishFileUrl),
				rebuildStreetGeocodeFileUrl: MasterFileGDBGPService + "/RebuildStreetLocactor",
				nowActiveFolder: setting["InActiveServiceFolderName"],
				nowInActiveFolder: setting["ActiveServiceFolderName"]
			},
			secondSet: {
				copyPublishProcessor: new tf.map.ArcGIS.Geoprocessor(copyAndPublishFileUrl),
				rebuildStreetGeocodeFileUrl: MasterFileGDBGPService + "/RebuildStreetLocactor",
			}
		};
	};

	TravelScenariosViewModel.prototype._copyPublishAndRebuildStreetGeocode = function(travelScenarioData, copyPublishProcessor, rebuildStreetGeocodeFileUrl, params, isPublishStreet, isRebuildGeocode, isShowMessage)
	{
		var self = this;
		return self._restartCopyAndRebuild(copyPublishProcessor.url).then(() =>
		{
			return copyPublishProcessor.submitJob(params).then(function(jobInfo)
			{
				var jobid = jobInfo.jobId;
				return copyPublishProcessor.waitForJobCompletion(jobid, {}).then(function(res)
				{
					return gpJobComplete(res);
				}, error =>
				{
					return Promise.resolve("fail");
				});

				function gpJobComplete(result)
				{
					if (result.jobStatus == "job-succeeded")
					{
						if (isPublishStreet)
						{
							if (!isRebuildGeocode)
							{
								return Promise.resolve("success");
							}
							if (isShowMessage)
							{
								self._showToastMessage("Streets published successfully.", true, false);
								self._showToastMessage("Rebuilding Geocode...", true, true);
							}
							return self.rebuildFileGeocode(params.ServiceFolder, rebuildStreetGeocodeFileUrl).then(ans =>
							{
								if (ans == "success")
								{
									if (isShowMessage)
									{
										self._showToastMessage("Rebuilt geocode successfully.", true);
									}
									return Promise.resolve("success");
								}
								else
								{
									if (isShowMessage)
									{
										self._showToastMessage("Rebuilding geocode failed.", false);
									}
									return Promise.resolve("fail");
								}
							});
						}
						else
						{
							self.removeAllMessages();
							if (!travelScenarioData)
							{
								if (isShowMessage)
								{
									self._showToastMessage("Published all travel scenarios successfully. ", true);
								}
							}
							return Promise.resolve("success");
						}
					} else
					{
						return Promise.resolve("fail");
					}
				}
			}, error =>
			{
				return Promise.resolve("fail");
			});
		}, error =>
		{
			return Promise.resolve("fail");
		});
	};

	TravelScenariosViewModel.prototype._restartCopyAndRebuild = function(copyPublishURL)
	{
		if (copyPublishURL.indexOf("GPServer/CopyAndRebuild") > 0)
		{
			return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase("v2"), "arcgis", "Restart"),
				{
					paramData:
					{
						serviceName: "MasterFileGDBGPService"
					}
				}).then(() =>
				{
					return Promise.resolve();
				});
		}
		else
		{
			return Promise.resolve();
		}
	};

	TravelScenariosViewModel.prototype.rebuildFileGeocode = function(serviceFolder, rebuildStreetGeocodeFileUrl)
	{
		let self = this;
		let geocodeProcessor = new tf.map.ArcGIS.Geoprocessor(rebuildStreetGeocodeFileUrl);
		return geocodeProcessor.submitJob({ "ServiceFolder": serviceFolder, "IsRunForLinuxPublish": "False" }).then(jobinfo =>
		{
			return geocodeProcessor.waitForJobCompletion(jobinfo.jobId, {}).then(function(res)
			{
				self.removeAllMessages();
				return Promise.resolve(res.jobStatus == "job-succeeded" ? "success" : "fail");
			});
		}, () =>
		{
			self.removeAllMessages();
			return Promise.resolve("fail");
		});
	};

	TravelScenariosViewModel.prototype._updateInActiveServiceFolderName = function(activeServiceFolderName, inActiveServiceFolderName)
	{
		return tf.promiseAjax.patch(pathCombine(tf.api.apiPrefixWithoutDatabase(), "tfsysinfo"), {
			data: [
				{ "Id": "ActiveServiceFolderName", "op": "replace", "path": "/InfoValue", "value": activeServiceFolderName },
				{ "Id": "InActiveServiceFolderName", "op": "replace", "path": "/InfoValue", "value": inActiveServiceFolderName },
			]
		});
	};

	TravelScenariosViewModel.prototype.changeScenarioApproveStatus = function(id)
	{
		var requestData = {};
		if ($.isArray(id))
		{
			requestData = {
				data: id.map(function(id)
				{
					return { "Id": id, "op": "replace", "path": "/Approve", "value": 1 };
				})
			};
		} else
		{
			requestData = {
				data: [
					{ "Id": id, "op": "replace", "path": "/Approve", "value": 1 },
				]
			};
		}
		PubSub.publish("ScenarioApproveStatusChange");
		return tf.promiseAjax.patch(pathCombine(tf.api.apiPrefixWithoutDatabase(), "travelscenarios"), requestData);
	};

	TravelScenariosViewModel.prototype._updateRecords = function()
	{
		var updatedRecords = [{
			Id: "",
			Type: "TravelScenario",
			Operation: ""
		}];
		return TF.RoutingMap.MapUpdatedRecordsHubHelper.prototype.updateRecords(updatedRecords, "MenuDataUpdatedHub");
	};

	TravelScenariosViewModel.prototype._changeTravelScenarioLockStatus = function(data, isLocked)
	{
		var self = this, option = {
			ids: data,
			extraInfo: "",
			type: "travelScenarios",
			databaseId: "-999",//All the datasources use the same travelscenaio data. 
			isLock: isLocked
		};
		tf.lockData.setLock(option);
		self._clearAllSelfLock(option, isLocked);
	};

	TravelScenariosViewModel.prototype._changeStreetApproveStatus = function()
	{
		PubSub.publish("StreetApproveStatusChange");//used for direction palette reload travel scenarios.
		return tf.promiseAjax.put(pathCombine(tf.api.apiPrefixWithoutDatabase(), "tfsysinfo", "StreetApprove"), {
			data: {
				InfoID: "StreetApprove",
				InfoValue: "1"
			}
		});
	};

	TravelScenariosViewModel.prototype._clearAllSelfLock = function(option, isLocked)
	{
		var selfLockRoutes = JSON.parse(tf.storageManager.get("selfLockRoutes", true));
		if (isLocked)
		{
			selfLockRoutes["travelScenariosLock"] = option;
		}
		else
		{
			delete selfLockRoutes["travelScenariosLock"];
		}
		tf.storageManager.save("selfLockRoutes", JSON.stringify(selfLockRoutes), true);
	};

	TravelScenariosViewModel.prototype._notifyPublised = function()
	{
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "mapcanvasapprovestatus"));
	};

	TravelScenariosViewModel.prototype._showToastMessage = function(message, success, autoClose = false)
	{
		if (!this._viewModal?.obToastMessages)
		{
			return;
		}

		this.messages = this.messages || [];
		message = {
			type: success ? "success" : "error",
			content: message,
			autoClose: autoClose
		};
		this._viewModal.obToastMessages.push(message);
		this.messages.push(message);
	};

	TravelScenariosViewModel.prototype.removeAllMessages = function()
	{
		if (this.messages)
		{
			if (this._viewModal?.obToastMessages)
			{
				this.messages.forEach(m =>
				{
					this._viewModal.obToastMessages.remove(m);
				});
			}

			this.messages = [];
		}
	};

	TravelScenariosViewModel.prototype.unSaveCheck = function()
	{
		return this.streetCurbTurnDataModel.unSaveCheck();
	};

	TravelScenariosViewModel.prototype.save = function()
	{
		return this.streetCurbTurnDataModel.save();
	};

	TravelScenariosViewModel.prototype.revert = function()
	{
		return this.streetCurbTurnDataModel.revert();
	};

	TravelScenariosViewModel.prototype.dispose = function()
	{
		this.streetCurbTurnDataModel.dispose();
		this.dataModel.dispose();
		this.dataModel = null;
		this.eventsManager = null;
		this.travelScenariosDisplay = null;
	};

})();
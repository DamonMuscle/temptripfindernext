(function()
{
	createNamespace("TF.Helper").ExagoBIHelper = ExagoBIHelper;

	var CLIENT_CONTEXT_PING_INTERVAL = 1000 * 60 * 5; // Duration to wait for checking if ClientContext of Exago Reporting Extension Service is alive 
	var DEFAULT_EXAGOBI_SERVER_URL = "http://localhost";

	/**
	 * Helper class for handling data access and operations between routefinder web and Exago web (including built-in and TFExtensions pages)
	 */
	function ExagoBIHelper()
	{
		var self = this;
		self._serverUrl = !window.ExagoBIServerUrl ? DEFAULT_EXAGOBI_SERVER_URL : window.ExagoBIServerUrl;
		self._webBaseUrl = self._serverUrl + "/Exago/";

		// Page urls for aspx endpoints in Exago Extensions web app
		self._exagoAdminPageUrl = self._webBaseUrl + "Admin.aspx";
		self._initClientContextUrl = self._webBaseUrl + "TFExtensions/InitTFClientContextPage.aspx";
		self._reportLibraryOperatingUrl = self._webBaseUrl + "TFExtensions/ReportLibraryData.aspx";
		self._createReportUrl = self._webBaseUrl + "TFExtensions/CreateReport.aspx";
		self._getTempReportLayoutContentUrl = self._webBaseUrl + "TFExtensions/GetTempReportLayoutContent.aspx";
		self._deleteTempReportUrl = self._webBaseUrl + "TFExtensions/DeleteTempReport.aspx";
		self._copyReportUrl = self._webBaseUrl + "TFExtensions/CopyReport.aspx";
		self._exportReportFileUrl = self._webBaseUrl + "TFExtensions/ExportReport.aspx";
		self._importReportFileUrl = self._webBaseUrl + "TFExtensions/ImportReportFile.aspx";
		self._initExagoUIPageUrl = self._webBaseUrl + "TFExtensions/InitExagoUIPage.aspx";
		self._executeReportUrl = self._webBaseUrl + "TFExtensions/ExecuteReport.aspx";
		self._updateUDFColumnMetadataUrl = self._webBaseUrl + "TFExtensions/UpdateColumnMetadataForUDFs.aspx";
		self._checkReportLayoutsForDeletedUDFUrl = self._webBaseUrl + "TFExtensions/CheckReportsForDeletedUDF.aspx";

		// setup event for DevExpress IFrame communication
		self.onReportOpenedEvent = new TF.Events.Event();
		self.onReportSavedEvent = new TF.Events.Event();
		self.onPreviewReportGeneratedEvent = new TF.Events.Event();
		self.onToolbarBtnClickedEvent = new TF.Events.Event();
		self.reportListUpdated = new TF.Events.Event();
		window.addEventListener("message", self._onWindowMessage.bind(self), false);
	}

	ExagoBIHelper.prototype.constructor = ExagoBIHelper;

	ExagoBIHelper.prototype.initClientReportContext = function()
	{
		var self = this;

		self._userCtx = {
			userName: tf.authManager.userName,
			clientKey: tf.authManager.clientKey.toLowerCase(),
			token: tf.entStorageManager.get("token", true)
		};

		self._exagoCtx = {
			Id: null
		};

		return self.initExagoReportContext(null)
			.then(function(ctxData)
			{
				if (!ctxData)
				{
					console.warn("Exago Report Context is not initialized correctly.");
				}
				else
				{
					self._exagoCtx.Id = ctxData.Id;
					console.log(String.format("Exago Report Context (Id: {0}) has been initialized.", ctxData.Id));

					// synchronize report library
					self.syncClientDatabaseWithReportLibrary().then(function(res)
					{
						console.log("Report Library has been synchronized.");
					})

					setTimeout(function()
					{
						self.keepExagoReportContextAlive();
					}, CLIENT_CONTEXT_PING_INTERVAL);

					// Try cleanup existing orphan temporary report files in exagos local reports _Temp folder (detect by a TTL time-range)
					self.deleteTemporaryReportFile(null);
				}
			});
	};

	ExagoBIHelper.prototype.createReportContextParameter = function(dataSourceId, reportItems, tfVariablesDict)
	{
		var apiBaseUrl = tf.api.server(),
			contextParameter = {
				APIServer: apiBaseUrl,
				Token: tf.entStorageManager.get("token", true),
				ClientKey: tf.authManager.clientKey.toLowerCase(),
				DBID: dataSourceId,
				DataSchemas: tf.dataTypeHelper.getAllReportDataSchemas().map(function(rds)
				{
					var dataItem = {
						Key: String.format("[{0}].[{1}]", rds.DataTypeName, rds.Name),
						Id: rds.Id
					};

					return dataItem;
				}),
				Reports: reportItems || [],
				TFVariables: tfVariablesDict
			};

		return contextParameter;
	};

	//
	//	Below starts the api methods for dealing with custom Web Api (aspx page handlers in ExagoWeb)
	////////////////////////////////////////////////////////////////////////////////////////
	ExagoBIHelper.prototype.createTFClientContextData = function(dataSourceId)
	{
		var apiBaseUrl = tf.api.server(),
			contextData = {
				ClientKey: tf.authManager.clientKey.toLowerCase(),
				ApiServer: apiBaseUrl,
				ApiToken: tf.entStorageManager.get("token", true),
				DBID: dataSourceId,
				TotalTimeZoneOffsetInMiniutesFromUtc: tf.timezonetotalminutes,
				ReportDataSchemas: [],
				ReportDataSchemasKeyToIdMap: {},
				DataProperties: {}	// For storing additional properties
			};

		tf.dataTypeHelper.getAllReportDataSchemas().forEach(function(rds)
		{
			var dsKey = String.format("[{0}].[{1}]", rds.DataTypeName, rds.Name);
			contextData.ReportDataSchemas.push(rds);
			contextData.ReportDataSchemasKeyToIdMap[dsKey] = rds.Id;
		});

		return contextData;
	};

	ExagoBIHelper.prototype.isExagoReportContextAlive = function(ctxId)
	{
		var self = this,
			apiUrl = self._initClientContextUrl,
			paramData = { ctxId: ctxId };

		return tf.promiseAjax.get(
			apiUrl,
			{
				paramData: paramData
			},
			{ overlay: false }
		).then(function(result)
		{
			return result.Data === true;
		}).catch(function()
		{
			return false;
		});
	};

	ExagoBIHelper.prototype.initExagoReportContext = function(ctxId)
	{
		var self = this,
			apiUrl = self._initClientContextUrl,
			postData = self.createTFClientContextData(null);

		if (!!ctxId)
		{
			apiUrl = apiUrl + "?ctxId=" + ctxId;
		}

		return new Promise(function(resolve, reject)
		{
			$.ajax({
				type: "POST",
				url: apiUrl,
				dataType: 'json',
				async: true,
				data: JSON.stringify(postData)
			}).done(function(result)
			{
				resolve(result.Data);
			}).fail(function()
			{
				resolve(null);
			});
		});

	};

	ExagoBIHelper.prototype.keepExagoReportContextAlive = function()
	{
		var self = this;

		self.isExagoReportContextAlive(self._exagoCtx.Id)
			.then(function(isAlive)
			{
				return isAlive ? Promise.resolve(null) : self.initExagoReportContext(self._exagoCtx.Id);
			}).then(function()
			{
				setTimeout(function()
				{
					self.keepExagoReportContextAlive();
				}, CLIENT_CONTEXT_PING_INTERVAL);
			});
	};

	ExagoBIHelper.prototype.updateColumnMetadataForUDFs = function(dataTypeIds)
	{
		if (!Array.isArray(dataTypeIds) || dataTypeIds.length === 0)
		{
			return Promise.resolve(true);
		}

		var self = this,
			ctxId = self._exagoCtx.Id,
			apiUrl = self._updateUDFColumnMetadataUrl,
			paramData = {
				ctxId: ctxId,
				dataTypeIds: dataTypeIds.join(",")
			};

		return tf.promiseAjax.get(
			apiUrl,
			{
				paramData: paramData
			},
			{ overlay: false }
		).then(function(result)
		{
			if (!result || !result.Data)
			{
				return false;
			}

			return true;
		}).catch(function()
		{
			return false;
		});
	};

	ExagoBIHelper.prototype.updateReportLayoutsForDeletedUDF = function(udfGuid)
	{
		// need to send request to Exago Reporting extension which will check Report Layouts and cleanup invalid Field placeholders
		//?udfGuid=
		var self = this,
			ctxId = self._exagoCtx.Id,
			apiUrl = self._checkReportLayoutsForDeletedUDFUrl,
			paramData = {
				ctxId: ctxId,
				udfGuid: udfGuid
			};

		return tf.promiseAjax.get(
			apiUrl,
			{
				paramData: paramData
			},
			{ overlay: false }
		).then(function(result)
		{
			if (!result || !Array.isArray(result.Data))
			{
				return null;
			}

			return result.Data;
		}).catch(function()
		{
			return null;
		});
	}

	ExagoBIHelper.prototype.syncClientDatabaseWithReportLibrary = function()
	{
		var self = this,
			ctxId = self._exagoCtx.Id,
			apiUrl = self._reportLibraryOperatingUrl,
			paramData = {
				ctxId: ctxId,
				op: "sync"
			};

		return tf.promiseAjax.get(
			apiUrl,
			{
				paramData: paramData
			},
			{ overlay: false }
		).then(function(result)
		{
			return result;
		});
	};

	ExagoBIHelper.prototype.downloadReportFromLibrary = function(recordId, pathInLibrary)
	{
		var self = this,
			ctxId = self._exagoCtx.Id,
			apiUrl = self._reportLibraryOperatingUrl,
			paramData = {
				ctxId: ctxId,
				recordId: recordId,
				op: "download",
				pathInLibrary: pathInLibrary
			};

		return tf.promiseAjax.get(
			apiUrl,
			{
				paramData: paramData
			},
			{ overlay: false }
		).then(function(result)
		{
			return result.Data;
		});
	};

	ExagoBIHelper.prototype.unDownloadReportFromLibrary = function(recordId, pathInLibrary)
	{
		var self = this,
			ctxId = self._exagoCtx.Id,
			apiUrl = self._reportLibraryOperatingUrl,
			paramData = {
				ctxId: ctxId,
				recordId: recordId,
				op: "undownload",
				pathInLibrary: pathInLibrary
			};

		return tf.promiseAjax.get(
			apiUrl,
			{
				paramData: paramData
			},
			{ overlay: false }
		).then(function(result)
		{
			return result.Data;
		});
	};

	ExagoBIHelper.prototype.getPreviewDataUrlOfReportLibraryItem = function(pathInLibrary)
	{
		var self = this,
			ctxId = self._exagoCtx.Id,
			apiUrl = String.format("{0}?ctxId={1}&op=preview&pathInLibrary={2}", self._reportLibraryOperatingUrl, ctxId, pathInLibrary);

		return apiUrl;
	};

	ExagoBIHelper.prototype.initReportEditorPageUrl = function(reportId, reportName, isSystem, reportPath, sessionContextData)
	{
		var self = this,
			ctxId = self._exagoCtx.Id,
			apiUrl = self._initExagoUIPageUrl,
			paramData = {
				ctxId: ctxId,
				pageName: "editor",
				reportId: reportId,
				reportName: reportName,
				reportType: isSystem ? "Library" : "User",
				reportPath: reportPath
			};

		return tf.promiseAjax.post(
			apiUrl,
			{
				paramData: paramData,
				data: sessionContextData
			},
			{ overlay: false }
		).then(function(result)
		{
			var pageUrl = result.Data;

			return self._webBaseUrl + pageUrl;
		});
	};

	ExagoBIHelper.prototype.initReportViewerPageUrl = function(reportId, reportName, isSystem, reportPath, sessionContextData)
	{
		var self = this,
			ctxId = self._exagoCtx.Id,
			apiUrl = self._initExagoUIPageUrl,
			paramData = {
				ctxId: ctxId,
				pageName: "viewer",
				reportId: reportId,
				reportName: reportName,
				reportType: isSystem ? "Library" : "User",
				reportPath: reportPath,
				format: "pdf"
			};

		return tf.promiseAjax.post(
			apiUrl,
			{
				paramData: paramData,
				data: sessionContextData
			},
			{ overlay: false }
		).then(function(result)
		{
			if (result.Error) throw result;

			var pageUrl = result.Data;

			return self._webBaseUrl + pageUrl;
		});
	};

	ExagoBIHelper.prototype.initReportPreviewPageUrl = function(reportId, reportName, previewReportName, sessionContextData)
	{
		var self = this,
			ctxId = self._exagoCtx.Id,
			apiUrl = self._initExagoUIPageUrl,
			paramData = {
				ctxId: ctxId,
				pageName: "preview",
				reportId: reportId,
				reportName: reportName,
				previewReportName: previewReportName,
				format: "pdf"
			};

		return tf.promiseAjax.post(
			apiUrl,
			{
				paramData: paramData,
				data: sessionContextData
			},
			{ overlay: false }
		).then(function(result)
		{
			if (result.Error) throw result;

			var pageUrl = result.Data;

			return self._webBaseUrl + pageUrl;
		});
	};

	ExagoBIHelper.prototype.getLayoutContentOfTemporaryReport = function(tempReportName)
	{
		var self = this,
			ctxId = self._exagoCtx.Id,
			apiUrl = self._getTempReportLayoutContentUrl,
			paramData = {
				ctxId: ctxId,
				tempReportName: tempReportName
			};

		return tf.promiseAjax.get(
			apiUrl,
			{
				paramData: paramData
			},
			{ overlay: false }
		).then(function(resp)
		{
			return resp.Data;
		});

	};

	ExagoBIHelper.prototype.deleteTemporaryReportFile = function(tempReportName)
	{
		var self = this,
			ctxId = self._exagoCtx.Id,
			apiUrl = self._deleteTempReportUrl,
			paramData = {
				ctxId: ctxId,
				tempReportName: !!tempReportName ? tempReportName : ""
			};

		$.get(
			apiUrl,
			paramData
		);
	};

	ExagoBIHelper.prototype.executeReport = function(reportId, reportName, sessionContextData, outputType)
	{
		var self = this,
			clientKey = self._userCtx.clientKey,
			ctxId = self._exagoCtx.Id,
			apiUrl = self._executeReportUrl,
			paramData = {
				clientKey: clientKey,
				ctxId: ctxId,
				reportId: reportId,
				reportName: reportName,
				format: outputType ? outputType : 'pdf',
				outputAsJson: "true"
			};

		return tf.promiseAjax.post(
			apiUrl,
			{
				paramData: paramData,
				data: sessionContextData
			},
			{ overlay: false }
		);
	};

	ExagoBIHelper.prototype.getDownloadFileUrl = function(reportId, reportName, outputType, resultId)
	{
		let clientKey = this._userCtx.clientKey,
			ctxId = this._exagoCtx.Id,
			apiUrl = this._executeReportUrl,
			paramData = {
				clientKey: clientKey,
				ctxId: ctxId,
				reportId: reportId,
				reportName: reportName,
				format: outputType ? outputType : 'pdf',
				outputAsJson: "false",
				resultId: resultId
			};

		return `${apiUrl}?${jQuery.param(paramData)}`;
	};

	ExagoBIHelper.prototype.executePreviewReport = function(reportId, reportName, previewReportName, sessionContextData, outputType)
	{
		var self = this,
			clientKey = self._userCtx.clientKey,
			ctxId = self._exagoCtx.Id,
			apiUrl = self._executeReportUrl,
			paramData = {
				clientKey: clientKey,
				ctxId: ctxId,
				reportId: reportId,
				reportName: reportName,
				isPreview: true,
				previewReportName: previewReportName,
				format: outputType ? outputType : 'pdf',
				outputAsJson: "true"
			};

		return tf.promiseAjax.post(
			apiUrl,
			{
				paramData: paramData,
				data: sessionContextData
			},
			{ overlay: false }
		);
	};

	ExagoBIHelper.prototype.createNewUserReport = function(reportName, dataTypeName, dataSchemaName)
	{
		var self = this,
			ctxId = self._exagoCtx.Id,
			apiUrl = self._createReportUrl,
			paramData = {
				ctxId: ctxId,
				reportName: reportName,
				reportType: "User",
				dataTypeName: dataTypeName,
				dataSchemaName: dataSchemaName
			};

		return tf.promiseAjax.get(
			apiUrl,
			{
				paramData: paramData
			},
			{ overlay: false }
		).then(function(result)
		{
			var addedReportRecord = result.Data,
				reportInfo = {
					Id: addedReportRecord.Id,
					Name: reportName,
					Path: addedReportRecord.Path
				};

			self.reportListUpdated.notify(null);
			return reportInfo;
		});

	};

	ExagoBIHelper.prototype.importReportFile = function(reportName, base64FileContent)
	{
		var self = this,
			ctxId = self._exagoCtx.Id,
			apiUrl = self._importReportFileUrl,
			paramData = {
				ctxId: ctxId,
				reportName: reportName
			},
			postData = {
				base64FileContent: base64FileContent
			};

		return tf.promiseAjax.post(
			apiUrl,
			{
				paramData: paramData,
				data: postData
			},
			{ overlay: false }
		).then(function(result)
		{
			return result.Data;
		}).catch(function()
		{
			return null;
		});

	};

	ExagoBIHelper.prototype.exportReportFile = function(reportId)
	{
		var self = this,
			ctxId = self._exagoCtx.Id,
			apiUrl = self._exportReportFileUrl,
			paramData = {
				ctxId: ctxId,
				reportId: reportId
			};

		return tf.promiseAjax.get(
			apiUrl,
			{
				paramData: paramData
			},
			{ overlay: false }
		).then(function(result)
		{
			return result.Data;
		}).catch(function()
		{
			return null;
		});

	};

	ExagoBIHelper.prototype.deleteReport = function(reportId)
	{
		var self = this,
			actionUrl = pathCombine(tf.api.apiPrefixWithoutDatabase(), tf.dataTypeHelper.getEndpoint("Report")),
			paramData = {
				"@filter": String.format("in(Id,{0})", reportId)
			};

		return tf.promiseAjax.delete(
			actionUrl,
			{
				paramData: paramData
			},
			{ overlay: false }
		).then(function(ret)
		{
			if (typeof (ret) === "number" && ret > 0)
			{
				self.reportListUpdated.notify(null);

				return ret;
			}

			return 0;
		});
	};

	ExagoBIHelper.prototype.copyReport = function(reportId, newReportName)
	{
		var self = this,
			ctxId = self._exagoCtx.Id,
			apiUrl = self._copyReportUrl,
			paramData = {
				ctxId: ctxId,
				reportId: reportId,
				newReportName: newReportName
			};

		return tf.promiseAjax.get(
			apiUrl,
			{
				paramData: paramData
			},
			{ overlay: false }
		).then(function(result)
		{
			return result.Data;
		}).catch(function()
		{
			return null;
		});
	};

	ExagoBIHelper.prototype.getNextOccurrenceDate = function(recurSetting)
	{
		var apiUrl = pathCombine(tf.api.apiPrefixWithoutDatabase(), "RecurrenceEvaluations"),
			inputData = {
				StartDate: recurSetting.StartDate,
				EndDate: recurSetting.EndDate,
				StartTime: recurSetting.StartTime,
				RecurMode: recurSetting.RecurBy,
				RecurEveryNum: recurSetting.RecurEvery,
				WeeklyDaysInWeek: recurSetting.WeeklyDaysInWeek,
				DailyWeekdaysOnly: recurSetting.ByDayWeekdayOnly,
				MonthlyMode: recurSetting.ByMonthMode,
				MonthlySpecificDay: recurSetting.ByMonthSpecificDay,
				MonthlyPatternPosition: recurSetting.ByMonthPatternSelection,
				MonthlyPatternDayType: recurSetting.ByMonthPatternWeekDay,
				StartSearchDate: null,
				TakeCount: 1
			};

		return tf.promiseAjax.get(
			apiUrl,
			{
				paramData: {
					inputValue: JSON.stringify(inputData)
				}
			},
			{ overlay: false }
		).then(function(result)
		{
			return result.Items;
		});
	};

	//current [library] is reserved
	ExagoBIHelper.prototype.checkReservedWord = function(reportName)
	{
		return !reportName.match(/\[library\]/gi);
	};

	ExagoBIHelper.prototype.getReservedWordInfo = function()
	{
		return "Key word [library] is reserved in our system.";
	};

	ExagoBIHelper.prototype.extractEditReportNameFromUrl = function(exagoEditorPageUrl)
	{
		var urlParamOfEditReportName = exagoEditorPageUrl.split("&").filter(function(qp)
		{
			return qp.startsWith("editReportName=");
		})[0];

		if (!!urlParamOfEditReportName)
		{
			return urlParamOfEditReportName.split("=")[1];
		}

		return null;
	};

	ExagoBIHelper.prototype.baseMaps = function(imageJsonUrlPrefix)
	{
		return [
			{
				title: "Dark Grey",
				id: "dark-gray-vector",
				baseMapLayers: [{
					"id": "layer0",
					"layerType": "ArcGISTiledMapServiceLayer",
					"url": "https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer",
					"visibility": true,
					"opacity": 1,
					"title": "World Dark Gray Canvas Base"
				}, {
					"id": "World_Dark_Gray_Reference_8618",
					"layerType": "ArcGISTiledMapServiceLayer",
					"url": "https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Reference/MapServer",
					"visibility": true,
					"opacity": 1,
					"title": "World Dark Gray Reference",
					"isReference": true
				}],
				thumbnail: "https://www.arcgis.com/sharing/rest/content/items/25869b8718c0419db87dad07de5b02d8/info/thumbnail/DGCanvasBase.png?f=json"
			},
			{
				title: "Imagery with Labels",
				id: "hybrid",
				baseMapLayers: [{
					"id": "World_Imagery_6611",
					"layerType": "ArcGISTiledMapServiceLayer",
					"url": "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
					"visibility": true,
					"opacity": 1,
					"title": "World Imagery"
				}, {
					"id": "World_Boundaries_and_Places_1145",
					"layerType": "ArcGISTiledMapServiceLayer",
					"url": "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer",
					"visibility": true,
					"opacity": 1,
					"title": "World Boundaries and Places",
					"isReference": true
				}],
				thumbnail: "https://www.arcgis.com/sharing/rest/content/items/413fd05bbd7342f5991d5ec96f4f8b18/info/thumbnail/imagery_labels.jpg?f=json",
				// basemap: new tf.map.ArcGIS.Basemap({
				// 	baseLayers: [
				// 		new tf.map.ArcGIS.TileLayer({
				// 			url: "//services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
				// 		}),
				// 		new tf.map.ArcGIS.VectorTileLayer({
				// 			url: `${imageJsonUrlPrefix ? imageJsonUrlPrefix : '../../'}Global/JavaScript/Framework/Map/hybrid_english.json`
				// 		})
				// 	],
				// 	id: "hybrid",
				// 	title: "Imagery with Labels"
				// })
			},
			{
				title: "Light Grey",
				id: "gray-vector",
				baseMapLayers: [{
					"id": "World_Light_Gray_Base_1486",
					"layerType": "ArcGISTiledMapServiceLayer",
					"url": "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer",
					"visibility": true,
					"opacity": 1,
					"title": "World Light Gray Canvas Base"
				}, {
					"id": "World_Light_Gray_Reference_8656",
					"layerType": "ArcGISTiledMapServiceLayer",
					"url": "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer",
					"visibility": true,
					"opacity": 1,
					"title": "World Light Gray Reference",
					"isReference": true
				}],
				thumbnail: "https://www.arcgis.com/sharing/rest/content/items/8b3b470883a744aeb60e5fff0a319ce7/info/thumbnail/light_gray_canvas.jpg?f=json"
			},
			{
				title: "Open Streets Map",
				id: "osm",
				baseMapLayers: [{
					"type": "VectorTileLayer",
					"styleUrl": "https://cdn.arcgis.com/sharing/rest/content/items/3e1a00aeae81496587988075fe529f71/resources/styles/root.json",
					"id": "VectorTile_3287",
					"title": "OpenStreetMap",
					"opacity": 1,
					"minScale": 0,
					"maxScale": 0
				}],
				thumbnail: "https://www.arcgis.com/sharing/rest/content/items/c29cfb7875fc4b97b58ba6987c460862/info/thumbnail/thumbnail1547740877120.jpeg?f=json"
			},
			{
				title: "Streets",
				id: "streets-vector",
				baseMapLayers: [{
					"type": "VectorTileLayer",
					"styleUrl": "https://cdn.arcgis.com/sharing/rest/content/items/de26a3cf4cc9451298ea173c4b324736/resources/styles/root.json",
					"id": "VectorTile_118",
					"title": "World Street Map",
					"opacity": 1,
					"minScale": 0,
					"maxScale": 0
				}],
				thumbnail: "https://www.arcgis.com/sharing/rest/content/items/f81bc478e12c4f1691d0d7ab6361f5a6/info/thumbnail/street_thumb_b2wm.jpg?f=json"
			}
		];
	}

	function tryParseWebReportEvent(dataStr)
	{
		var eventData = null;

		try
		{
			eventData = JSON.parse(dataStr);
			if (!eventData.sender || eventData.sender !== "ExagoJSEmbed")
			{
				eventData = null;
			}
		}
		catch (e)
		{
			eventData = null;
		}

		return eventData;
	}

	/**
	 * Will check data and process DevExpress Report related data only
	 * json schema of event.data should match below:
	 * 
	 */
	ExagoBIHelper.prototype._onWindowMessage = function(event)
	{
		var self = this;
		//console.log(event.data);
		var reportEventData = tryParseWebReportEvent(event.data);
		if (!reportEventData)
		{
			return;
		}

		switch (reportEventData.eventType.toLowerCase())
		{
			case "reportopened":
				self.onReportOpenedEvent.notify(reportEventData);
				break;
			case "reportsaved":
				self.onReportSavedEvent.notify(reportEventData);
				self.reportListUpdated.notify(null);
				break;
			case "toolbtnclicked":
				self.onToolbarBtnClickedEvent.notify(reportEventData);
				break;
			case "previewreportgenerated":
				self.onPreviewReportGeneratedEvent.notify(reportEventData);
				break;
		}
	};
})();
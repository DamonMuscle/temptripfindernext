(function()
{
	createNamespace("TF.Document").ExagoBIReportEditorDocumentViewModel = ExagoBIReportEditorDocumentViewModel;

	function ExagoBIReportEditorDocumentViewModel(documentData, documentManager)
	{
		var self = this,
			routeState = documentData.routeState,
			typeName = documentData.data.type,
			reportInfo = documentData.reportInfo,
			isDashboard = reportInfo.isDashboard,
			dataSchema = tf.dataTypeHelper.getReportDataSchemaById(reportInfo.dataSchemaId);

		TF.Document.BaseDocumentViewModel.call(self, routeState, typeName);

		self.DocumentData = documentData;
		self.documentType = documentData.documentType;
		self.documentManager = documentManager;

		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
		self.pageLevelViewModel.autoFocus = false;

		self.isReadMode = ko.observable(true);
		self.obtabName(documentData.data.tabName);
		self.obIsDashBoard = ko.observable(reportInfo.isDashboard);

		// Populate Report Designer/Viewer related properties
		self.reportInfo = reportInfo;
		self.obReportId = ko.observable(reportInfo.id);
		self.obIsSystem = ko.observable(reportInfo.isSystem);
		self.obOriginalReportName = ko.observable(reportInfo.name);
		self.obReportName = ko.observable(reportInfo.name);
		self.obReportPath = ko.observable(reportInfo.reportPath);
		self.obDataTypeName = ko.observable(isDashboard ? "Dashboard" : dataSchema.DataTypeName);
		self.tempReportNameForEdit = null;	// Hold the temp report name used by exago designer at design-time (auto-generated)

		self.onRunButtonClicked = self.onRunButtonClicked.bind(self);
		self.onPreviewButtonClicked = self.onPreviewButtonClicked.bind(self);
		self.onSaveButtonClicked = self.onSaveButtonClicked.bind(self);
		self.onSaveAsNewClicked = self.onSaveAsNewClicked.bind(self);
		self.onCloseButtonClicked = self.onCloseButtonClicked.bind(self);
		self.onDesignerToolbarBtnClicked = self.onDesignerToolbarBtnClicked.bind(self);

		// register frame messaging event
		self._addReportWebEventHandlers();
	};

	ExagoBIReportEditorDocumentViewModel.prototype = Object.create(TF.Document.BaseDocumentViewModel.prototype);

	ExagoBIReportEditorDocumentViewModel.prototype.constructor = ExagoBIReportEditorDocumentViewModel;

	ExagoBIReportEditorDocumentViewModel.prototype.templateName = "workspace/ExagoBI/BIReportEditorPanel";

	ExagoBIReportEditorDocumentViewModel.prototype.initialize = function(el, data)
	{
		var self = this;

		self.$exagoEditFrame = self.$element.find(".exago-frame.edit");
		self.editFrameWindow = self.$exagoEditFrame[0].contentWindow;

		self.initValidation();
		self.initReportEditorUI(self.$exagoEditFrame);
	};

	ExagoBIReportEditorDocumentViewModel.prototype.getHash = function()
	{
		return "ExagoBIReportEditor";
	};

	/**
	 * Initialization.
	 * @param {DOM} model
	 * @param {Object} element
	 */
	ExagoBIReportEditorDocumentViewModel.prototype.init = function(model, element)
	{
		var self = this;

		self.$element = $(element);
	};

	ExagoBIReportEditorDocumentViewModel.prototype.initReportEditorUI = function($frame)
	{
		var self = this,
			dataSourceId = tf.datasourceManager.databaseId,
			reportId = self.obReportId(),
			reportName = self.obReportName(),
			reportPath = self.obReportPath(),
			sessionContextData = tf.exagoBIHelper.createReportContextParameter(dataSourceId, [], null);

		tf.loadingIndicator.showImmediately();
		tf.exagoBIHelper.initReportEditorPageUrl(reportId, reportName, self.obIsSystem(), reportPath, sessionContextData).then(function(editorPageUrl)
		{
			$frame[0].src = editorPageUrl;
			self.tempReportNameForEdit = tf.exagoBIHelper.extractEditReportNameFromUrl(editorPageUrl);

			self.waitUntilReportEditorLoaded().then(function()
			{
				tf.loadingIndicator.tryHide();
				setTimeout(function()
				{
					self.$element.find('.preload').hide();	// Hide the fake splitor div after 10 seconds
				}, 10000);
			});
		}).catch(function()
		{
			tf.loadingIndicator.tryHide();
			var errMessage = String.format("Error occurred when trying to load report file of \"{0}\"", reportName);
			tf.promiseBootbox.alert(errMessage, "Exago Reporting Error").then(function()
			{
				self.closeDocument(true);
			});
		});
	};

	/**
	 * Validation initialization.
	 * @returns {void}
	 */
	ExagoBIReportEditorDocumentViewModel.prototype.initValidation = function(model, element)
	{
		var self = this,
			validatorFields = {};

		validatorFields.name = {
			trigger: "blur",
			validators:
			{
				stringLength: {
					max: 50,
					message: 'Report Name must be less than 50 characters'
				},
				notEmpty: {
					message: "Report Name required",
				},
				callback: {
					message: "Report Name already exists",
					callback: function(value)
					{
						if (!value) return true;

						value = $.trim(value);

						return self.checkIfNameIsUnique(value);
					}
				}
			}
		};

		self.$element.bootstrapValidator(
			{
				excluded: [':hidden', ':not(:visible)'],
				live: 'enabled',
				message: 'This value is not valid',
				fields: validatorFields
			}).on('success.field.bv', function(e, data)
			{

			});

		self.pageLevelViewModel.load(self.$element.data("bootstrapValidator"));
	};

	ExagoBIReportEditorDocumentViewModel.prototype.canClose = function()
	{
		var self = this;

		if (self._forceClose === true)
		{
			return Promise.resolve(true);
		}

		var alertMessage = String.format("Do you want to close designer for \"{0}\"?", self.obReportName());

		return tf.promiseBootbox.confirm(
			{
				message: alertMessage,
				title: "Confirmation",
				buttons:
				{
					OK:
					{
						label: "Yes"
					},
					Cancel:
					{
						label: "No"
					}
				}
			});
	};

	ExagoBIReportEditorDocumentViewModel.prototype.onRunButtonClicked = function(model, e)
	{
		var self = this,
			reportId = self.obReportId();

		tf.exagoReportDataHelper.fetchReportWithMetadata(reportId)
			.then(function(entity)
			{
				if (!entity) return;

				return tf.modalManager.showModal(new TF.Modal.Report.ExagoBIRunReportModalViewModel(
					{
						editOnly: false,
						entity: entity
					}
				));
			}).then(function(execResult)
			{
				if (execResult && execResult.externalReportViewerUrl)
				{
					window.open(execResult.externalReportViewerUrl, "_blank");
				}
			});
	};

	ExagoBIReportEditorDocumentViewModel.prototype.onPreviewButtonClicked = function(model, e)
	{
		var self = this,
			reportId = self.obReportId(),
			currentReportName = self.obReportName(),
			previewReportInfo;

		tf.loadingIndicator.showImmediately();
		self.generateTempReportForPreview().then(function(tempReport)
		{
			tf.loadingIndicator.tryHide();
			if (!tempReport || !tempReport.reportName) 
			{
				tf.promiseBootbox.alert("Cannot create temporary report file for preview.", "Warning");
				return null;
			}

			previewReportInfo = tempReport;
			return tf.exagoReportDataHelper.fetchReportWithMetadata(reportId, tempReport.reportName);
		}).then(function(entity)
		{
			if (!entity) return;

			entity.Name = currentReportName; // Make sure Preview modal display latest reportName (if changed and not saved) in title bar
			return tf.modalManager.showModal(new TF.Modal.Report.ExagoBIRunReportModalViewModel(
				{
					editOnly: false,
					entity: entity,
					previewReportInfo: previewReportInfo
				}
			));
		}).then(function(execResult)
		{
			if (execResult && execResult.externalReportViewerUrl)
			{
				window.open(execResult.externalReportViewerUrl, "_blank");
			}

			// send request to cleanup temporary report file for preview
			if (previewReportInfo && previewReportInfo.reportName)
			{
				tf.exagoBIHelper.deleteTemporaryReportFile(previewReportInfo.reportName);
			}
		});
	}

	ExagoBIReportEditorDocumentViewModel.prototype.onSaveButtonClicked = function(model, e)
	{
		var self = this;

		if (self.obIsSystem()) return;

		self.pageLevelViewModel.saveValidate()
			.then(function(result)
			{
				if (!result) return;

				if (!tf.exagoBIHelper.checkReservedWord(self.obReportName()))
				{
					tf.promiseBootbox.alert(tf.exagoBIHelper.getReservedWordInfo());
					return;
				}

				tf.loadingIndicator.showImmediately();
				self.saveReportFile().then(function(savedReportInfo)
				{
					if (!savedReportInfo || !savedReportInfo.Id)
					{
						throw "Report File is not saved correctly.";
					}

					self.refreshReportInfo(savedReportInfo);
					self._refreshReportsGrid();
					tf.loadingIndicator.tryHide();
					self.pageLevelViewModel.popupSuccessMessage("Saved successfully!");

				}).catch(function(err)
				{
					tf.loadingIndicator.tryHide();
					self.pageLevelViewModel.popupErrorMessage(err);
				});
			});
	};

	ExagoBIReportEditorDocumentViewModel.prototype.onSaveAsNewClicked = function(model, e)
	{
		var self = this,
			reportId = self.obReportId();

		self.getAllReports().then(function(reports)
		{
			tf.modalManager.showModal(new TF.Modal.SingleInputModalViewModel({
				title: "Save As New",
				field: "name",
				maxLength: 50,
				text: "",
				ignoreCaseWhenDetermineUnique: true,
				existingItems: reports.map(function(report) { return report.Name; })
			})).then(function(reportName)
			{
				if (!reportName) return;

				tf.loadingIndicator.showImmediately();
				tf.exagoBIHelper.copyReport(reportId, reportName)
					.then(function(copyResult)
					{
						self.refreshReportInfo(copyResult);
						return self.saveReportFile();
					})
					.then(function(savedReportInfo)
					{
						if (!savedReportInfo || !savedReportInfo.Id)
						{
							throw "Report File is not saved correctly.";
						}

						//self.refreshReportInfo(savedReportInfo);
						self._refreshReportsGrid();
						tf.loadingIndicator.tryHide();
						self.pageLevelViewModel.popupSuccessMessage("Saved successfully!");

					}).catch(function(err)
					{
						tf.loadingIndicator.tryHide();
						self.pageLevelViewModel.popupErrorMessage(err);
					});
			});
		});
	};

	ExagoBIReportEditorDocumentViewModel.prototype.refreshReportInfo = function(reportInfo)
	{
		var self = this;
		self.reportInfo.id = reportInfo.Id;
		self.reportInfo.reportPath = reportInfo.Path;
		self.reportInfo.name = reportInfo.Name;
		self.reportInfo.isSystem = reportInfo.IsSystem;

		self.DocumentData.data.tabName = self.reportInfo.name;

		self.obtabName(self.reportInfo.name);
		self.obReportId(self.reportInfo.id);
		self.obOriginalReportName(self.reportInfo.name);
		self.obReportName(self.reportInfo.name);
		self.obReportPath(self.reportInfo.reportPath);
		self.obIsSystem(self.reportInfo.isSystem);
	};

	ExagoBIReportEditorDocumentViewModel.prototype.onCloseButtonClicked = function(model, e)
	{
		var self = this;

		self.closeDocument();
	};

	ExagoBIReportEditorDocumentViewModel.prototype.onDesignerToolbarBtnClicked = function(evt, data)
	{
		var self = this,
			reportId = self.obReportId(),
			reportName = self.obReportName(),
			actionId = reportId;

		if (!data.actionId || data.actionId !== actionId || !data.btnName)	// Only respond to events related to this report session
		{
			return;
		}

		switch (data.btnName.toLowerCase())
		{
			case "editexecutioninfo":
				tf.exagoReportDataHelper.fetchReportWithMetadata(reportId)
					.then(function(entity)
					{
						if (!entity) return;

						return tf.modalManager.showModal(new TF.Modal.Report.ExagoBIRunReportModalViewModel(
							{
								editOnly: true,
								entity: entity
							}
						));
					}).then(function(execInfo)
					{
						if (!!execInfo)
						{
							tf.exagoReportDataHelper.setReportExecutionInfo(reportId, execInfo).then(function(isSaved)
							{
								if (isSaved === true)
								{
									self.pageLevelViewModel.popupSuccessMessage("Report Filter and Parameters have been saved succesfully");
								}
								else
								{
									self.pageLevelViewModel.popupErrorMessage("Failed to save Report Filter and Parameters");
								}
							});

						}
					});

				break;
		}
	};

	/**
	 * Send command to embeded report designer frame to save report file
	 * @returns {Boolean} indicating whether report layout is successfully saved in designer-frame (got saved notification)
	 */
	ExagoBIReportEditorDocumentViewModel.prototype.saveReportFile = function()
	{
		var self = this,
			reportId = self.obReportId(),
			reportName = self.obReportName(),
			actionId = String.format("{0}-{1}", reportId, new Date().toTimeString());

		return new Promise(function(resolve)
		{
			var isReportSavedOrTimeout = false,
				reportSavedCallback = function(evt, data)
				{
					if (!data.actionId || data.actionId !== actionId)	// Only respond to events related to this report session
					{
						return;
					}

					if (isReportSavedOrTimeout !== true)
					{
						isReportSavedOrTimeout = true;
						tf.exagoBIHelper.onReportSavedEvent.unsubscribe(reportSavedCallback);

						var savedReportInfo = data.report;
						resolve(savedReportInfo);
					}
				};

			// send save report message to reportFrame and wait for saved notification
			//self.obIsReportLayoutChanged(false);
			tf.exagoBIHelper.onReportSavedEvent.subscribe(reportSavedCallback);
			self.editFrameWindow.postMessage(
				JSON.stringify({
					sender: "rfweb",
					eventType: "savereport",
					actionId: actionId,
					report: {
						reportId: reportId,
						reportName: reportName,
						reportType: "advanced"
					}
				})
				,
				"*"
			);

			// Set a timeout for viewModel to restore saving status
			window.setTimeout(function()
			{
				if (isReportSavedOrTimeout !== true)
				{
					isReportSavedOrTimeout = true;
					tf.exagoBIHelper.onReportSavedEvent.unsubscribe(reportSavedCallback);
					resolve(null);
				}
			}, 10 * 1000);
		});
	};

	/**
 	 * Send command to embeded report designer frame to create a temporary report for previewing
 	 * @returns {Object} object contains name and path of the temporary report generated for preview. This report can be used by sequential request for execution 
 	 */
	ExagoBIReportEditorDocumentViewModel.prototype.generateTempReportForPreview = function()
	{
		var self = this,
			reportId = self.obReportId(),
			reportName = self.obReportName(),
			actionId = String.format("{0}-{1}", reportId, new Date().toTimeString());

		return new Promise(function(resolve)
		{
			var isTempReportGeneratedOrTimeout = false,
				tempReportGeneratedCallback = function(evt, data)
				{
					if (!data.actionId || data.actionId !== actionId)	// Only respond to events related to this report session
					{
						return;
					}

					if (isTempReportGeneratedOrTimeout !== true)
					{
						isTempReportGeneratedOrTimeout = true;
						tf.exagoBIHelper.onPreviewReportGeneratedEvent.unsubscribe(tempReportGeneratedCallback);

						var previewReportInfo = data.report;
						resolve(previewReportInfo);
					}
				};

			// send 'generate preview report' message to reportFrame and wait for generated event notification
			tf.exagoBIHelper.onPreviewReportGeneratedEvent.subscribe(tempReportGeneratedCallback);
			self.editFrameWindow.postMessage(
				JSON.stringify({
					sender: "rfweb",
					eventType: "generatepreviewreport",
					actionId: actionId,
					report: {
						reportId: reportId,
						reportName: reportName
					}
				})
				,
				"*"
			);

			// Set a timeout for viewModel to restore preview generation status (in case of internal error or timeout at Exago designer side)
			window.setTimeout(function()
			{
				if (isTempReportGeneratedOrTimeout !== true)
				{
					isTempReportGeneratedOrTimeout = true;
					tf.exagoBIHelper.onReportSavedEvent.unsubscribe(tempReportGeneratedCallback);
					resolve(null);
				}
			}, 10 * 1000);
		});
	};

	ExagoBIReportEditorDocumentViewModel.prototype.waitUntilReportEditorLoaded = function()
	{
		var self = this,
			reportId = self.obReportId(),
			reportName = self.obReportName(),
			actionId = reportId;

		return new Promise(function(resolve)
		{
			var isEditorLoadedOrTimeout = false,
				reportOpenedCallback = function(evt, data)
				{
					if (!data.actionId || data.actionId !== actionId)	// Only respond to events related to this report session
					{
						return;
					}

					if (isEditorLoadedOrTimeout !== true)
					{
						isEditorLoadedOrTimeout = true;
						tf.exagoBIHelper.onReportOpenedEvent.unsubscribe(reportOpenedCallback);
						resolve(true);	// indicate saving operation is successful
					}
				};

			// send save report message to reportFrame and wait for saved notification
			tf.exagoBIHelper.onReportOpenedEvent.subscribe(reportOpenedCallback);

			// Set a timeout for viewModel to restore saving status
			window.setTimeout(function()
			{
				if (isEditorLoadedOrTimeout !== true)
				{
					isEditorLoadedOrTimeout = true;
					tf.exagoBIHelper.onReportOpenedEvent.unsubscribe(reportOpenedCallback);
					resolve(false);
				}
			}, 20 * 1000);

		});
	};

	ExagoBIReportEditorDocumentViewModel.prototype.onNameInputFocus = function()
	{
		this.$element.find("[data-bv-validator=callback]").css("display", "none");
	};

	/**
	 * Check if the name meets "unique" requirements.
	 *
	 * @param {Number} id
	 * @param {String} name
	 * @returns
	 */
	ExagoBIReportEditorDocumentViewModel.prototype.checkIfNameIsUnique = function(name)
	{
		var self = this,
			reportId = self.obReportId();

		return !!self.getAllReports().then(function(reports)
		{
			return !reports.filter(function(r)
			{
				return r.Id !== reportId;
			}).filter(function(r)
			{
				return r.Name === name;
			}).length;
		});
	};

	ExagoBIReportEditorDocumentViewModel.prototype.getAllReports = function()
	{
		var type = "report",
			endpoint = tf.dataTypeHelper.getEndpoint(type);
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), endpoint), {}, { overlay: false }).then(function(response)
		{
			return response.Items;
		});
	};

	ExagoBIReportEditorDocumentViewModel.prototype._refreshReportsGrid = function()
	{
		var self = this,
			reportGridTabSource = tf.documentManagerViewModel.applicationTabSource.GridSource.report;

		if (reportGridTabSource && reportGridTabSource.length)
		{
			var reportsGridVM = reportGridTabSource[0].document,
				searchGrid = reportsGridVM.getSearchGrid();
			if (searchGrid)
			{
				searchGrid.needRefresh = true;
			}
		}
	};

	ExagoBIReportEditorDocumentViewModel.prototype.closeDocument = function(forceClose)
	{
		var self = this;

		self._forceClose = forceClose;
		tf.documentManagerViewModel.closeDocument(self);
	};

	ExagoBIReportEditorDocumentViewModel.prototype._addReportWebEventHandlers = function()
	{
		var self = this;
		tf.exagoBIHelper.onToolbarBtnClickedEvent.subscribe(self.onDesignerToolbarBtnClicked);
	};

	ExagoBIReportEditorDocumentViewModel.prototype._removeReportWebEventHandlers = function()
	{
		var self = this;
		tf.exagoBIHelper.onToolbarBtnClickedEvent.unsubscribe(self.onDesignerToolbarBtnClicked);
	};

	/**
	 * Send request to exago service endpoint to remove the temporary report file (created for editing report in exago designer page)
	 */
	ExagoBIReportEditorDocumentViewModel.prototype._cleanupTempReportForEdit = function()
	{
		var self = this,
			tmpReportNameToClean = self.tempReportNameForEdit;

		tf.exagoBIHelper.deleteTemporaryReportFile(tmpReportNameToClean);
	};

	ExagoBIReportEditorDocumentViewModel.prototype.dispose = function()
	{
		var self = this;

		self._removeReportWebEventHandlers();
		self._cleanupTempReportForEdit();
	};

})();
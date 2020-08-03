(function()
{
	createNamespace('TF.Control.Report').ExagoBIRunReportViewModel = ExagoBIRunReportViewModel;

	function ExagoBIRunReportViewModel(option)
	{
		var self = this;

		TF.Control.Report.BaseRunReportViewModel.call(self, option);

		self.isPreview = !!option && !!option.previewReportInfo && !!option.previewReportInfo.reportName;
		self.previewReportName = self.isPreview ? option.previewReportInfo.reportName : null;
	}

	ExagoBIRunReportViewModel.prototype = Object.create(TF.Control.Report.BaseRunReportViewModel.prototype);

	ExagoBIRunReportViewModel.prototype.saveFilterAndParameters = function()
	{
		var self = this;

		return self.pageLevelViewModel.saveValidate()
			.then(function(isValid)
			{
				if (!isValid) return null;

				// Return the latest Execution Info data
				var execInfo = self.getCurrentExecutionInfo();

				return execInfo;
			});
	};

	/**
	 * Run the report.
	 *
	 * @returns
	 */
	ExagoBIRunReportViewModel.prototype.run = function()
	{
		var self = this,
			outputType = self.obSelectedOutputType(),
			newWindow = window.open("", "_blank");

		return self.pageLevelViewModel.saveValidate()
			.then(function(isValid)
			{
				if (!isValid) return null;

				if (outputType.text === "View in Browser")
				{
					return self.runWithExternalViewer();
				}
				else
				{
					return self.runAsFile();
				}

			}).then(function(execResult)
			{
				if (execResult && execResult.externalReportViewerUrl)
				{
					newWindow.location = execResult.externalReportViewerUrl;
				} else
				{
					newWindow.close();
				}
			});
	};

	ExagoBIRunReportViewModel.prototype.runWithExternalViewer = function()
	{
		var self = this,
			reportEntity = self.entity,
			reportId = reportEntity.Id,
			reportName = reportEntity.Name,
			reportPath = reportEntity.Path,
			isSystem = reportEntity.IsSystem,
			dataSourceId = self.obSelectedDataSource().id,
			reportItems = [],
			execResult = {
				externalReportViewerUrl: null
			};

		tf.loadingIndicator.showImmediately();
		return self.createReportItemForExecution()
			.then(function(item)
			{
				if (!item)
				{
					tf.loadingIndicator.tryHide();
					tf.promiseBootbox.alert("No record found under current condition, please change your filter settings");
					return null;
				}

				reportItems.push(item);
				return self.prepareTFVariablesForExecution().then(function(tfVarsDict)
				{
					if (!tfVarsDict) return null;
					if (reportEntity.isTripMapUsed || reportEntity.isStudentMapUsed)
					{
						return self.preGeneratingMapImages(reportItems[0].SpecificRecordIds).then(function(res)
						{
							tfVarsDict.mapDataKey = res;

							return tf.exagoBIHelper.createReportContextParameter(dataSourceId, reportItems, tfVarsDict);
						})
					}
					else
					{
						return tf.exagoBIHelper.createReportContextParameter(dataSourceId, reportItems, tfVarsDict);
					}
				}).then(function(sessionCtxData)
				{
					if (!sessionCtxData) return null;

					if (self.isPreview)
					{
						return tf.exagoBIHelper.initReportPreviewPageUrl(reportId, reportName, self.previewReportName, sessionCtxData);
					}
					else
					{
						return tf.exagoBIHelper.initReportViewerPageUrl(reportId, reportName, isSystem, reportPath, sessionCtxData);
					}
				}).then(function(viewerPageUrl)
				{
					tf.loadingIndicator.tryHide();
					if (!viewerPageUrl) return false;	// Abort execution

					viewerPageUrl = viewerPageUrl + "&from=Tripfinder"
					execResult.externalReportViewerUrl = viewerPageUrl;

					return execResult;
				}).catch(function(ex)
				{
					tf.loadingIndicator.tryHide();
					var errMessage = String.format("Error occurred when trying to execute report \"{0}\"", reportName);
					tf.promiseBootbox.alert(errMessage, "Exago Reporting Error");
					return null;
				});
			})
	}

	ExagoBIRunReportViewModel.prototype.runAsFile = function()
	{
		var self = this,
			reportEntity = self.entity,
			reportId = reportEntity.Id,
			reportName = reportEntity.Name,
			reportPath = reportEntity.Path,
			isSystem = reportEntity.IsSystem,
			dataSourceId = self.obSelectedDataSource().id,
			reportItems = [];


		tf.loadingIndicator.showImmediately();
		return self.createReportItemForExecution()
			.then(function(item)
			{
				if (!item)
				{
					tf.promiseBootbox.alert("No record found under current condition, please change your filter settings");
					return null;
				}
				reportItems.push(item);
				return self.prepareTFVariablesForExecution();
			}).then(function(tfVarsDict)
			{
				if (!tfVarsDict) return null;
				if (reportEntity.isTripMapUsed || reportEntity.isStudentMapUsed)
				{
					return self.preGeneratingMapImages(reportItems[0].SpecificRecordIds).then(function(res)
					{
						tfVarsDict.mapDataKey = res;

						return tf.exagoBIHelper.createReportContextParameter(dataSourceId, reportItems, tfVarsDict);
					})
				}
				else
				{
					return tf.exagoBIHelper.createReportContextParameter(dataSourceId, reportItems, tfVarsDict);
				}
			}).then(function(sessionCtxData)
			{
				if (!sessionCtxData) return null;

				if (self.isPreview)
				{
					return tf.exagoBIHelper.executePreviewReport(reportId, reportName, self.previewReportName, sessionCtxData, self.obSelectedOutputType().type);
				}
				else
				{
					return tf.exagoBIHelper.executeReport(reportId, reportName, sessionCtxData, self.obSelectedOutputType().type);
				}

			}).then(function(result)
			{
				tf.loadingIndicator.tryHide();

				var execResultData = result.Data;
				tf.docFilePreviewHelper.initDownloadOnBrowser(execResultData.FileName, execResultData.MimeType, execResultData.Base64FileContent);
			})
			.catch(function()
			{
				tf.loadingIndicator.tryHide();
				var errMessage = String.format("Error occurred when trying to execute report \"{0}\"", reportName);
				tf.promiseBootbox.alert(errMessage, "Exago Reporting Error");
				return null;
			});
	}

})();

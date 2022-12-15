(function()
{
	createNamespace("TF.Helper").ExagoReportDataHelper = ExagoReportDataHelper;

	var REPORT_EXECINFO_KEY = "ReportExecutionInfo",
		REPORT_LAYOUT_KEY = "LayoutFileContent";

	var REPORT_TYPES = ["Report"];

	var REPORT_OUTPUT_TYPES = [
		{
			text: "View in Browser",
			name: "View_pdf",
			type: 'pdf',
			MimeType: 'application/pdf',
		},
		{
			text: "[disable]------------------------------"
		},
		{
			text: "PDF",
			name: "download_pdf",
			type: "pdf",
			MimeType: 'application/pdf'
		},
		{
			text: "EXCEL",
			type: "excel",
		}, {
			text: "CSV",
			type: "csv",
		}
	];

	var SPECIFY_RECORD_METHODS = [
		{
			text: "All Records",
			name: "all_records",
		},
		{
			text: "Filter",
			name: "filter"
		},
		{
			text: "Specific Records",
			name: "specific_records"
		}
	];

	var DATA_TYPES_REQUIRE_DATE_PARAMETERS = ["Alternate Site", "School", "Staff", "Student", "Trip", "Vehicle","Field Trip"];

	function ExagoReportDataHelper()
	{
		var self = this;

	}

	ExagoReportDataHelper.prototype.constructor = ExagoReportDataHelper;

	ExagoReportDataHelper.prototype.getAllReportTypes = function()
	{
		return REPORT_TYPES.slice();
	};

	ExagoReportDataHelper.prototype.getAllOutputTypes = function()
	{
		return REPORT_OUTPUT_TYPES.slice();
	};

	ExagoReportDataHelper.prototype.getAllSpecifyRecordMethods = function()
	{
		return SPECIFY_RECORD_METHODS.slice();
	};

	ExagoReportDataHelper.prototype.getReportDataTypesWithSchemas = function()
	{
		var dataTypeKeyMap = {},
			dataTypes = [],
			allSchemas = tf.dataTypeHelper.getAllReportDataSchemas();

		allSchemas.filter(function(schema)
		{
			return schema.Name === "Default";
		}).forEach(function(schema)
		{
			var curTypeId = schema.DataTypeId;
			if (!(curTypeId in dataTypeKeyMap))
			{
				dataTypeKeyMap[curTypeId] = {
					Id: curTypeId,
					Name: schema.DataTypeName,
					Schemas: []
				};
				dataTypes.push(dataTypeKeyMap[curTypeId]);
			}

			dataTypeKeyMap[curTypeId].Schemas.push({
				Id: schema.Id,
				Name: schema.Name,
				SchemaInfo: schema.SchemaInfo
			});
		});

		return dataTypes;
	};

	ExagoReportDataHelper.prototype.getReportExecutionInfo = function(reportId)
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "ExagoReportParameters"), {
			paramData: {
				ReportId: reportId,
				Name: REPORT_EXECINFO_KEY
			}
		}).then(function(response)
		{
			if (!response || !Array.isArray(response.Items) || response.Items.length < 1)
			{
				// if not already exists, create a ExecutionInfo parameter for the given report
				return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "ExagoReportParameters"), {
					data: [
						{
							"Name": REPORT_EXECINFO_KEY,
							"ReportId": reportId,
							"Value": "{}"
						}
					]
				});
			}
			else
			{
				return response;
			}
		}).then(function(response)
		{
			try
			{
				var execInfo = JSON.parse(response.Items[0].Value);

				return execInfo;
			}
			catch (err)
			{
				return {}
			}
		}).catch(function()
		{
			return null;
		});
	};

	ExagoReportDataHelper.prototype.setReportExecutionInfo = function(reportId, execInfo)
	{
		var execInfoJsonStr = !execInfo ? "{}" : JSON.stringify(execInfo);

		return tf.promiseAjax.patch(pathCombine(tf.api.apiPrefixWithoutDatabase(), "ExagoReportParameters"), {
			paramData: {
				ReportId: reportId,
				Name: REPORT_EXECINFO_KEY
			},
			data: [{
				"op": "replace",
				"path": "/Value",
				"value": execInfoJsonStr
			}]
		}).then(function()
		{
			return true;
		}).catch(function()
		{
			return false;
		});
	};

	ExagoReportDataHelper.prototype.fetchReportWithMetadata = function(reportId, previewReportName)
	{
		var self = this,
			p1 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "ExagoReports"), {
				paramData:
				{
					Id: reportId
				}
			},
				{ overlay: false }
			),
			p2 = self.getReportExecutionInfo(reportId),
			p3 = self.getReportDataSources(),
			reportEntity;

		return Promise.all([p1, p2, p3])	// Retrieve report record and associated parameter values
			.then(function(results)
			{
				var resp1 = results[0], resp2 = results[1], resp3 = results[2], dataSchema;

				if (!resp1 || !Array.isArray(resp1.Items) || resp1.Items.length === 0) return null;

				reportEntity = resp1.Items[0];
				reportEntity.execInfo = resp2;
				reportEntity.dataSources = resp3;
				dataSchema = tf.dataTypeHelper.getReportDataSchemaById(reportEntity.ReportDataSchemaID);

				return self.getReportMetadata(reportId, dataSchema, previewReportName);
			})
			.then(function(metaData)	// process report metedata retrieved from Exago extension aspx endpoint
			{
				if (!metaData) return null;

				// Attache parameter items info into report entity
				reportEntity.parameterList = Array.isArray(metaData.Parameters) ? metaData.Parameters : [];

				// Set flags about whether some certain special fields are used in report
				reportEntity.isStudentPictureUsed = metaData.isStudentPictureUsed;
				reportEntity.isTripMapUsed = metaData.isTripMapUsed;
				reportEntity.isTripStopMapUsed = metaData.isTripStopMapUsed;
				reportEntity.isStudentMapUsed = metaData.isStudentMapUsed;
				reportEntity.isTripStopDrivingDirectionsUsed = metaData.isTripStopDrivingDirectionsUsed;

				return reportEntity;
			});
	};

	ExagoReportDataHelper.prototype.getReportDataSources = function()
	{
		if (tf.authManager.authorizationInfo.isAdmin)
		{
			return Promise.resolve(tf.datasourceManager.datasources);
		}

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "databases?authedOnly=true&@sort=Name"))
			.then(function(apiResponse)
			{
				return apiResponse.Items;
			});
	};

	ExagoReportDataHelper.prototype.getRecordIdsByFilterClause = function(dataSourceId, dataSchema, filterClause)
	{
		var self = this,
			dataTypeName = dataSchema.DataTypeName,
			prefix = tf.dataTypeHelper.getSearchApiPrefix(dataTypeName, dataSourceId),
			requestUrl = pathCombine(prefix, "id"),
			searchData = {
				fields: ["Id"],
				filterSet: null,
				filterClause: filterClause,
				idFilter: {
					ExcludeAny: [],
					IncludeOnly: null
				},
				isQuickSearch: false,
				sortItems: [{
					Name: "Id",
					isAscending: "asc",
					Direction: "Ascending"
				}]
			};

		return tf.promiseAjax.post(
			requestUrl,
			{
				data: searchData
			})
			.then(function(response)
			{
				return response.Items;
			})
			.catch(function(err)
			{
				console.warn(String.format("[Warning]Error when trying to fetch record Ids throug filter: '{0}' for DataType: {1}", filterClause, dataTypeName));
				return [];
			});
	};

	ExagoReportDataHelper.prototype.getReportMetadata = function(reportId, dataSchema, previewReportName)
	{
		var self = this,
			dataTypeOfReport = dataSchema.DataTypeName,
			metaData = {
				Parameters: [
					// {
					// 	"Name": "ScheduleDate",
					// 	"DisplayName": "Schedule Date",
					// 	"DataType": "Date",
					// 	"Required": true,
					// 	"ExagoDataType": "string"
					// }
				],
				isStudentPictureUsed: false,
				isTripMapUsed: false,
				isTripStopMapUsed: false,
				isStudentMapUsed: false,
				isTripStopDrivingDirectionsUsed: false
			}, getReportLayoutPromise;

		// For previewReport, retrieve layout from Exago service (from temp .wr file), else retrieve layout from DB
		getReportLayoutPromise = !!previewReportName ? tf.exagoBIHelper.getLayoutContentOfTemporaryReport(previewReportName) : self.getLayoutContentOfReport(reportId);

		return getReportLayoutPromise.then(function(layoutContent)
		{
			if (!!layoutContent)
			{
				var $layoutXml = $(layoutContent),
					$parameters = $layoutXml.find("parameter"),
					$cellTextElms = $layoutXml.find("cell_text"),
					parameterKeyMap = {};

				// Detect report-level parameters from report's xml layout content
				if ($parameters && $parameters.length > 0)
				{
					$.each($parameters, function(i, p)
					{
						var $p = $(p),
							parameterItem = {
								Name: $p.find("id").text(),
								ExagoDataType: $p.find("data_type").text()
							},
							extData = JSON.parse($p.find("prompt_text").text());

						parameterItem.DisplayName = extData.DisplayName;
						parameterItem.DataType = extData.DataType;
						parameterItem.Required = extData.Required;
						metaData.Parameters.push(parameterItem);
						parameterKeyMap[parameterItem.Name] = true;
					});
				}

				if (DATA_TYPES_REQUIRE_DATE_PARAMETERS.indexOf(dataTypeOfReport) >= 0)
				{
					// Remove "ScheduleDate" parameter from old Trip report
					if (parameterKeyMap["ScheduleDate"])
					{
						metaData.Parameters = metaData.Parameters.filter(function(p)
						{
							return p.Name !== "ScheduleDate";
						});
					}

					// For some certain data types, we need to ensure the existence of Date parameters at report-level
					if (!parameterKeyMap["StartDate"])
					{
						metaData.Parameters.push({
							Name: "StartDate",
							ExagoDataType: "string",
							DisplayName: "Start Date",
							DataType: "Date",
							Required: true
						});
					}

					if (!parameterKeyMap["EndDate"])
					{
						metaData.Parameters.push({
							Name: "EndDate",
							ExagoDataType: "string",
							DisplayName: "End Date",
							DataType: "Date",
							Required: true
						});
					}
				}

				// Detect existence ofImage fields (like Map, DrivingDirections, StudentPicture, etc...)
				$.each($cellTextElms, function(i, cellTextElm)
				{
					var textValue = cellTextElm.innerText;
					if (!!textValue)
					{
						if (textValue.indexOf('Student.Picture') >= 0)
						{
							metaData.isStudentPictureUsed = true;
						}
						else if (textValue.indexOf('StudentMap') >= 0)
						{
							metaData.isStudentMapUsed = true;
						}
						else if (textValue.indexOf('Trip.MapImage') >= 0)
						{
							metaData.isTripMapUsed = true;
						}
						else if (textValue.indexOf('Trip.TripStop#DrivingDirectionsImage') >= 0)
						{
							metaData.isTripStopDrivingDirectionsUsed = true;
						}
					}
				});

			}

			return metaData;
		}).catch(function()
		{
			return metaData;
		});
	};

	ExagoReportDataHelper.prototype.getLayoutContentOfReport = function(reportId)
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "ExagoReportParameters"), {
			paramData: {
				"ReportId": reportId,
				"Name": REPORT_LAYOUT_KEY,
				"@fields": "Value"
			}
		}).then(function(resp)
		{
			if (!!resp && Array.isArray(resp.Items) && resp.Items[0] && resp.Items[0].Value)
			{
				return resp.Items[0].Value;
			}

			return null;
		});
	};
	ExagoReportDataHelper.prototype.generatingMapImages = function(mapPrameter, reportyType, databaseId)
	{
		var requestUrl = tf.api.apiPrefixWithoutDatabase() + '/mapimages?reportType=' + reportyType + "&databaseId=" + databaseId;
		if (mapPrameter)
		{
			return tf.promiseAjax.post(
				requestUrl,
				{
					data: mapPrameter
				}, { "Reffer": "" })
				.then(function(res)
				{
					return Promise.resolve(res);
				})
		}
		else
		{
			return Promise.resolve(true);
		}
	}
	tf.exagoReportDataHelper = new TF.Helper.ExagoReportDataHelper();
})();
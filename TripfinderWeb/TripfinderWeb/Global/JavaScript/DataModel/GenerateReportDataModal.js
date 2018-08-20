(function()
{
	var namespace = window.createNamespace("TF.DataModel");
	namespace.GenerateReportDataModal = function()
	{
		namespace.BaseDataModel.call(this);
	};

	namespace.GenerateReportDataModal.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.GenerateReportDataModal.prototype.constructor = namespace.GenerateReportDataModal;

	namespace.GenerateReportDataModal.prototype.mapping = [
		{ from: "Id", default: 0, required: true },
		{ from: "ReportName", default: "" },
		{ from: "ReportOldName", default: "" },
		{ from: "ReportTitle", default: "" },
		{ from: "Preparer", default: "" },
		{ from: "SubTitle", default: "" },
		{ from: "ScheduledReportId", default: 0 },
		{ from: "Description", default: "" },
		{ from: "FilterDataSource", default: null },
		{ from: "SpecifyRecordOption", default: null },
		{ from: "IncludeInActiveFlag", default: false },
		{ from: "FilterId", default: "" },
		{ from: "FilterName", default: "" },
		{ from: "FilterSpec", default: "" },
		{ from: "DataSourceId", default: 0 },
		{ from: "DataSourceName", default: "" },
		{ from: "LastUpdated", default: "1970-01-01T00:00:00" },
		{ from: "LastUpdatedId", default: 0 },
		{ from: "LastUpdatedName", default: "" },
		{ from: "LastUpdatedType", default: 0 },
		{ from: "SelectedRecordType", default: "" },
		{ from: "OutputTo", default: "" },
		{ from: "SelectedRecordIds", default: [] },
		{ from: "ReportParameterRunFor", default: "yesterday" },
		{ from: "ReportParameterTimeFrom", default: "1970-01-01T00:00:00" },
		{ from: "ReportParameterTimeTo", default: "1970-01-01T23:59:59" }
	];

})();

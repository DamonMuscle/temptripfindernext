(function()
{
	var namespace = window.createNamespace("TF.DataModel");
	namespace.ReportReceiptDataModel = function(ReportReceiptEntity)
	{
		namespace.BaseDataModel.call(this, ReportReceiptEntity);
	};

	namespace.ReportReceiptDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.ReportReceiptDataModel.prototype.constructor = namespace.ReportReceiptDataModel;

	namespace.ReportReceiptDataModel.prototype.mapping = [
		{ from: "Id", default: 0, required: true },
		{ from: "ScheduledReportId", default: 0 },
		{ from: "SelectedUserId", default: 0 },
		{ from: "RecipientType", default: 0 },
		{ from: "UserName", default: "" },
		{ from: "EmailAddress", default: "" }
	];

})();
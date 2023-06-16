(function()
{
	var namespace = window.createNamespace("TF.DataModel");
	namespace.ScheduledReportReceiptDataModel = function(scheduledReportReceiptEntity)
	{
		namespace.BaseDataModel.call(this, scheduledReportReceiptEntity);
	};

	namespace.ScheduledReportReceiptDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.ScheduledReportReceiptDataModel.prototype.constructor = namespace.ScheduledReportReceiptDataModel;

	namespace.ScheduledReportReceiptDataModel.prototype.mapping = [
		{ from: "Id", default: 0, required: true },
		{ from: "ScheduledReportId", default: 0 },
		{ from: "SelectedUserId", default: 0 },
		{ from: "RecipientType", default: 0 },
		{ from: "UserName", default: "" },
		{ from: "EmailAddress", default: "" }
	];

})();
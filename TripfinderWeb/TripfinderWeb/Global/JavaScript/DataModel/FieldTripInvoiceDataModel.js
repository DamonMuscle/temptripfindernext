(function()
{
	var namespace = window.createNamespace("TF.DataModel");

	namespace.FieldTripInvoiceDataModel = function(fieldTripInvoiceEntity)
	{
		namespace.BaseDataModel.call(this, fieldTripInvoiceEntity);
	}

	namespace.FieldTripInvoiceDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.FieldTripInvoiceDataModel.prototype.constructor = namespace.FieldTripInvoiceDataModel;

	namespace.FieldTripInvoiceDataModel.prototype.mapping = [
		{ from: "AccountName", default: "" },
		{ from: "Amount", default: 0 },
		{ from: "FieldTripAccountId", default: 0 },
		{ from: "FieldTripId", default: 0 },
		{ from: "Id", default: 0 },
		{ from: "InvoiceDate", default: null },
		{ from: "LastUpdated", default: null },
		{ from: "LastUpdatedName", default: "" },
		{ from: "LastUpdatedType", default: null },
		{ from: "LastUpdatedUserId", default: null },
		{ from: "PaymentDate", default: null },
		{ from: "PurchaseOrder", default: "" },
		{ from: "SubmittedBy", default: null },
		{ from: "resourceId", default: 0 }
	];

})();
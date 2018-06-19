(function()
{
	createNamespace("TF.GridDefinition").FieldTripInvoiceGridDefinition = FieldTripInvoiceGridDefinition;
	function FieldTripInvoiceGridDefinition()
	{

	}

	FieldTripInvoiceGridDefinition.prototype.gridDefinition = function()
	{
		return {
			Columns: [
				{
					FieldName: "AccountName",
					DisplayName: "Account Name",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "Amount",
					DisplayName: "Amount",
					Width: '150px',
					type: "number"
				},
				{
					FieldName: "PurchaseOrder",
					DisplayName: "Purchase Order",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "InvoiceDate",
					DisplayName: "Invoice Date",
					Width: '150px',
					type: "date"
				},
				{
					FieldName: "PaymentDate",
					DisplayName: "Payment Date",
					Width: '150px',
					type: "date"
				}
			]
		}
	};

	tf.FieldTripInvoiceGridDefinition = new TF.GridDefinition.FieldTripInvoiceGridDefinition();
})();
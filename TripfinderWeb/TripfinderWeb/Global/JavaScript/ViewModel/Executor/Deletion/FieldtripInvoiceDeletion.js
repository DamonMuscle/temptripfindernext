(function()
{
	var namespace = createNamespace("TF.Executor");

	namespace.FieldtripInvoiceDeletion = FieldtripInvoiceDeletion;

	function FieldtripInvoiceDeletion()
	{
		this.type = 'fieldtripinvoice';
		namespace.BaseDeletion.apply(this, arguments);
	}

	FieldtripInvoiceDeletion.prototype = Object.create(namespace.BaseDeletion.prototype);
	FieldtripInvoiceDeletion.prototype.constructor = FieldtripInvoiceDeletion;

	FieldtripInvoiceDeletion.prototype.getAssociatedData = function(ids)
	{
		var associatedDatas = [];

		return Promise.all([]).then(function()
		{
			return associatedDatas;
		});
	}
})();
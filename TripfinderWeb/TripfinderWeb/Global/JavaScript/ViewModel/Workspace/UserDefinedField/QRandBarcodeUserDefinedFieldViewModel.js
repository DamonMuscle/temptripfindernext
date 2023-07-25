(function()
{
	createNamespace("TF.UserDefinedField").QRandBarcodeUserDefinedFieldViewModel = QRandBarcodeUserDefinedFieldViewModel;

	function QRandBarcodeUserDefinedFieldViewModel()
	{
		this.obMaxLength = ko.observable(null);
		this.obIsEnable = ko.observable(false);
	}

	QRandBarcodeUserDefinedFieldViewModel.prototype.constructor = QRandBarcodeUserDefinedFieldViewModel;

	QRandBarcodeUserDefinedFieldViewModel.prototype.init = function(vm, e)
	{
		this.$parent = $(e).closest(".Edit-UDF-Modal");
	};

	QRandBarcodeUserDefinedFieldViewModel.prototype.getTemplate = function()
	{
		return "";
	};

	QRandBarcodeUserDefinedFieldViewModel.prototype.getDefaultValueTemplate = function()
	{
		return `<div>
			<!-- ko customInput:{type:'String',value:obDefaultValue,disable:isSystemDefined,attributes:{name:'defaultValue',class:'form-control',maxlength:'200',tabindex:'4'}} -->
			<!-- /ko -->
		</div>`;
	};

	QRandBarcodeUserDefinedFieldViewModel.prototype.getDefaultValue = function(entity)
	{
		return entity["DefaultQRandBarcode"];
	};
})();

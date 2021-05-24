(function()
{
	createNamespace("TF.DetailView").FieldTripInvoiceViewModel = FieldTripInvoiceViewModel;

	function FieldTripInvoiceViewModel(options)
	{
		var self = this,
			invoice = options.invoice || {},
			availableAccounts = options.accounts || [],
			defaultAccount = availableAccounts.find(function(item) { return item.Id === invoice.FieldTripAccountId; });

		self.invoice = invoice;
		self.isNew = options.isNew;
		self.newEntityDataSource = options.newEntityDataSource;
		self.originalItem = options.originalItem;
		self.isStrictAcctCodes = tf.fieldTripConfigsDataHelper.fieldTripConfigs['StrictAcctCodes'];

		const requiredFields = tf.helpers.detailViewHelper.getRequiredFields("fieldtrip");
		self.obIsAccountNameRequired = ko.observable(!!requiredFields.find(x => x.name === "AccountName"));
		self.obIsPurchaseOrderRequired = ko.observable(!!requiredFields.find(x => x.name === "PurchaseOrder"));
		self.obAccountSource = ko.observableArray(availableAccounts);
		self.obSelectedAccount = ko.observable(defaultAccount);
		self.obSelectedAccountName = ko.observable(defaultAccount ? defaultAccount.Code : null);

		self.obAmount = ko.observable([null, undefined, ""].includes(invoice.Amount) ? "" : tf.dataFormatHelper.currencyFormatter(invoice.Amount));
		self.obPurchaseOrder = ko.observable(invoice.PurchaseOrder);

		if (invoice.InvoiceDate && typeof invoice.InvoiceDate === "object")
		{
			invoice.InvoiceDate = invoice.InvoiceDate.toLocaleString("en-US");
		}

		if (invoice.PaymentDate && typeof invoice.PaymentDate === "object")
		{
			invoice.PaymentDate = invoice.PaymentDate.toLocaleString("en-US");
		}

		self.obInvoiceDate = ko.observable(invoice.InvoiceDate || null);
		self.obPaymentDate = ko.observable(invoice.PaymentDate || null);
		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
	}

	FieldTripInvoiceViewModel.prototype.init = function(viewModel, el)
	{
		var self = this;
		self.$element = $(el);

		setTimeout(function()
		{
			self.initValidator();
		})
	};

	FieldTripInvoiceViewModel.prototype.initValidator = function()
	{
		var self = this,
			validatorFields = {};

		if (self.obIsAccountNameRequired())
		{
			validatorFields.accountName = {
				trigger: "blur change",
				validators: {
					callback: {
						message: " is required",
						callback: function()
						{
							return !!self.obSelectedAccountName();
						}
					},
				}
			}
		}

		if (self.obIsPurchaseOrderRequired())
		{
			validatorFields.purchaseOrder = {
				trigger: "blur change",
				validators: {
					notEmpty: {
						message: 'required'
					},
				}
			}
		}

		self.validator = self.$element.bootstrapValidator({
			excluded: [".data-bv-excluded"],
			fields: validatorFields,
			live: 'disabled'
		}).data("bootstrapValidator");

		self.pageLevelViewModel.load(self.validator);
	};

	FieldTripInvoiceViewModel.prototype.onChange = function(decimalBox, evt)
	{
		evt.target.value = tf.dataFormatHelper.currencyFormatter(evt.target.value);
	};

	FieldTripInvoiceViewModel.prototype.apply = function()
	{
		var self = this;

		return self.pageLevelViewModel.saveValidate()
			.then(function(valid)
			{
				if (!valid) return;

				var selectAccountName = (self.obSelectedAccountName() || "").trim(),
					selectAccount = self.obAccountSource().find(({ Code }) => Code === selectAccountName),
					updatedInvoice = $.extend({}, self.invoice, {
						Amount: self.obAmount(),
						PurchaseOrder: self.obPurchaseOrder(),
						InvoiceDate: self.obInvoiceDate(),
						PaymentDate: self.obPaymentDate(),
						DBID: tf.datasourceManager.databaseId,
						AccountName: selectAccountName
					});

				return (!!selectAccount ? Promise.resolve(selectAccount.Id) : p = tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "fieldtripaccounts"), {
					data: [{
						Code: selectAccountName,
					}]
				}).then(({ Items }) =>
				{
					const [account] = Items;
					return account.Id;
				})).then(accountId =>
				{
					updatedInvoice.FieldTripAccountId = accountId;

					// Manipulate mini grid data source when it is on a new field trip 
					if (self.newEntityDataSource)
					{
						var fieldtripInvoiceData = (new TF.DataModel.FieldTripInvoiceDataModel(updatedInvoice)).toData();

						if (self.isNew)
						{
							self.newEntityDataSource.push(fieldtripInvoiceData);
						}
						else
						{
							var index = self.newEntityDataSource
								.findIndex(function(item)
								{
									return item._guid == self.originalItem._guid;
								});

							self.newEntityDataSource[index] = fieldtripInvoiceData;
						}

						return fieldtripInvoiceData;
					}

					if (self.isNew)
					{
						return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "fieldtripinvoices"), {
							paramData: { "@relationships": "FieldTripAccount" },
							data: [updatedInvoice]
						});
					}
					else
					{
						return tf.promiseAjax.put(pathCombine(tf.api.apiPrefix(), "fieldtripinvoices"),
							{
								paramData: {
									Id: self.invoice.Id,
									DBID: tf.datasourceManager.databaseId
								},
								data: [updatedInvoice]
							});
					}
				});
			});
	};

	FieldTripInvoiceViewModel.prototype.dispose = function()
	{
		this.pageLevelViewModel.dispose();
	};
})();
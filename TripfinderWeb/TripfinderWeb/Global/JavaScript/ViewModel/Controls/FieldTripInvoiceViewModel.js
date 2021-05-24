(function()
{
	createNamespace('TF.Control').FieldTripInvoiceViewModel = FieldTripInvoiceViewModel;

	function FieldTripInvoiceViewModel(option)
	{
		this.option = option;
		this.requiredFields = option.requiredFields;
		this.obEntityType = ko.observable(option.entityType);
		this.obEntityDataModel = ko.observable(new TF.DataModel.FieldTripInvoiceDataModel(option.data));

		// required fields
		this.obIsAccountNameRequired = ko.observable(false);
		this.obIsPurchaseOrderRequired = ko.observable(false);
		this.obIsInvoiceDateRequired = ko.observable(false);
		this.obIsPaymentDateRequired = ko.observable(false);

		this.obAccountSource = ko.observableArray();
		this.isStrictAcctCodes = tf.fieldTripConfigsDataHelper.fieldTripConfigs['StrictAcctCodes'];

		this.pageLevelViewModel = new TF.PageLevel.BaseDataEntryPageLevelViewModel();

		//drop down list
		this.obSelectedAccount = ko.observable();
		this.obSelectedAccount.subscribe(TF.Helper.DropDownMenuHelper.setSelectValue(this, "fieldTripAccountId", "obSelectedAccount", function(obj) { return obj ? obj.Id : 0; }), this);
		this.obSelectedAccountText = ko.observable();
		if (option.data)
		{
			if (option.data.FieldTripAccountId)
			{
				this.obSelectedAccount(option.data.FieldTripAccountId);
			}
			if (option.data.AccountName)
			{
				this.obSelectedAccountText(option.data.AccountName);
			}
		}
	}

	FieldTripInvoiceViewModel.prototype.save = function()
	{
		return this.pageLevelViewModel.saveValidate()
			.then(function(result)
			{
				if (result)
				{
					var accountName = this.obSelectedAccountText();
					var selectedAccount = this.obAccountSource().find(({Code})=>Code === accountName);
					var entity = this.obEntityDataModel().toData();
					var p = Promise.resolve();
					if(!selectedAccount) {
						p = tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "fieldtripaccounts"), {
							data: [{
								Code: accountName,
							}]
						}).then(function({Items}){
							const [{Id}] = Items;
							entity.FieldTripAccountId = Id;
						});
					}

					return p.then(function(){
						entity.AccountName = accountName;
						return entity;
					});
				}
			}.bind(this));
	}

	/**
	 * Adjust modal to apply required fields setting.
	 *
	 * @param {Array} validatorFields
	 */
	FieldTripInvoiceViewModel.prototype.applyRequiredFieldSetting = function(validatorFields)
	{
		const { AccountName, InvoiceDate, PaymentDate, PurchaseOrder } = this.requiredFields;
		const requiredValidator = {
			trigger: "blur change",
			validators: { notEmpty: { message: "required" } }
		};

		if (AccountName && AccountName.Required){
			this.obIsAccountNameRequired(true);
			validatorFields.account = $.extend(true, {}, requiredValidator);
		}

		if (InvoiceDate && InvoiceDate.Required)
		{
			this.obIsInvoiceDateRequired(true);
			validatorFields.invoiceDate = $.extend(true, {}, requiredValidator);
		}

		if (PaymentDate && PaymentDate.Required)
		{
			this.obIsPaymentDateRequired(true);
			validatorFields.paymentDate = $.extend(true, {}, requiredValidator);
		}

		if (PurchaseOrder && PurchaseOrder.Required)
		{
			this.obIsPurchaseOrderRequired(true);
			validatorFields.purchaseOrder = $.extend(true, {}, requiredValidator);
		}
	};

	FieldTripInvoiceViewModel.prototype.init = function(viewModel, el)
	{
		this.$form = $(el);
		var validatorFields = {}, isValidating = false, self = this;

		this.applyRequiredFieldSetting(validatorFields);

		setTimeout(function()
		{
			this.$form.bootstrapValidator({
				excluded: [':hidden', ':not(:visible)'],
				live: 'enabled',
				message: 'This value is not valid',
				fields: validatorFields
			}).on('success.field.bv', function(e, data)
			{
				if (!isValidating)
				{
					isValidating = true;
					self.pageLevelViewModel.saveValidate(data.element);
					isValidating = false;
				}
			});

			this.pageLevelViewModel.load(this.$form.data("bootstrapValidator"));
		}.bind(this));

		this.$form.find("select[name=account]").focus();
		this.load();
	};

	FieldTripInvoiceViewModel.prototype.load = function()
	{
		var strictAcctCodes = this.option.strictAcctCodes, selectAccount = this.option.selectAccount,
			selectedSchool = this.option.selectedSchool;

		tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), tf.DataTypeHelper.getEndpoint("fieldtripaccounts")))
			.then(function(data)
			{
				var accountItems = (data && Array.isArray(data.Items)) ? data.Items.filter(function(item)
				{
					return !!$.trim(item.Code);
				}) : [];

				accountItems = sortArray(accountItems, "Code");
				var items = accountItems;
				if (strictAcctCodes)
				{
					items = [];
					if (selectAccount)
					{
						$.each(accountItems, function(index, item)
						{
							if ((item.DepartmentId === selectAccount.DepartmentId || selectAccount.Department.Name === "[Any]")
								&& (item.FieldTripActivityId === selectAccount.FieldTripActivityId || selectAccount.FieldTripActivity.Name === "[Any]")
								&& item.School === selectedSchool)
							{
								items.push(item);
							}
						});
					}
				}

				this.obAccountSource(items);
				if (this.option.data)
				{
					this.obEntityDataModel().fieldTripAccountId(this.option.data.FieldTripAccountId);
				}
			}.bind(this));
	};

	FieldTripInvoiceViewModel.prototype.IsRequired = function(item)
	{
		return item ? { required: "required" } : {};
	};

	FieldTripInvoiceViewModel.prototype.apply = function()
	{
		return this.save()
			.then(function(data)
			{
				return data;
				this.dispose();
			}, function()
			{
			});
	};

	FieldTripInvoiceViewModel.prototype.dispose = function()
	{
		this.pageLevelViewModel.dispose();
	};

})();


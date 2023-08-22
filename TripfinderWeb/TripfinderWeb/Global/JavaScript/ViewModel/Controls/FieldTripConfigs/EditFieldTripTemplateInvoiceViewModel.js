(function()
{
	createNamespace('TF.Control').EditFieldTripTemplateInvoiceViewModel = EditFieldTripTemplateInvoiceViewModel;

	function EditFieldTripTemplateInvoiceViewModel(entity)
	{
		let self = this;

		self.entity = entity || {};
		self.obFieldTripAccounts = ko.observableArray();

		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();

		self.obSelectedAccount = ko.observable();
		self.obSelectedAccountText = ko.computed(function()
		{
			return (self.obSelectedAccount() || {}).value;
		});

		self.obAmount = ko.observable(self.entity.Amount);
	}

	EditFieldTripTemplateInvoiceViewModel.prototype.init = function(viewModel, el)
	{
		let self = this;
		self.$form = $(el);

		tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "FieldTripAccounts")).then(function(data)
		{
			var accountItems = ((data && Array.isArray(data.Items)) ? data.Items.filter(function(item)
			{
				return !!$.trim(item.Code);
			}) : []).map(({ Id, Code }) => ({ key: Id, value: Code }));

			accountItems.sort(function(a, b)
			{
				return (a.value || "").toLowerCase() > (b.value || "") ? 1 : -1;
			});

			self.obFieldTripAccounts(accountItems);
			if (self.entity && self.entity.FieldTripAccountId)
			{
				self.obSelectedAccount(accountItems.find(x => x.key === self.entity.FieldTripAccountId));
			}
		});
	};

	EditFieldTripTemplateInvoiceViewModel.prototype.afterRender = function()
	{
		let self = this,
			validatorFields = {
				account: {
					trigger: "blur change",
					validators: { notEmpty: { message: "required" } }
				}
			},
			isValidating = false;

		self.$form.bootstrapValidator({
			excluded: [':hidden', ':not(:visible)'],
			live: 'enabled',
			message: 'self value is not valid',
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

		self.pageLevelViewModel.load(self.$form.data("bootstrapValidator"));
	};

	EditFieldTripTemplateInvoiceViewModel.prototype.apply = function()
	{
		let self = this;

		return self.pageLevelViewModel.saveValidate().then(function(result)
		{
			if (result)
			{
				return {
					FieldTripAccountId: (self.obSelectedAccount() || {}).key,
					AccountName: self.obSelectedAccountText(),
					Amount: self.obAmount()
				};
			}
		});
	};
})();
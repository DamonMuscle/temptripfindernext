(function()
{
	createNamespace('TF.Control').FieldTripInvoiceViewModel = FieldTripInvoiceViewModel;

	function FieldTripInvoiceViewModel(option)
	{
		this.option = option;
		this.obEntityType = ko.observable(option.entityType);
		this.obEntityDataModel = ko.observable(new TF.DataModel.FieldTripInvoiceDataModel(option.data));

		this.obAccountSource = ko.observableArray();

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
					var entity = this.obEntityDataModel().toData();
					entity.AccountName = this.obSelectedAccountText();
					return entity;
				}
			}.bind(this));
	}

	FieldTripInvoiceViewModel.prototype.init = function(viewModel, el)
	{
		this.$form = $(el);
		var validatorFields = {}, isValidating = false, self = this;

		validatorFields.name = {
			trigger: "blur change",
			validators: {
				notEmpty: {
					message: "required"
				}
			}
		}

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

		this.$form.find("select[name=name]").focus();
		this.load();
	};

	FieldTripInvoiceViewModel.prototype.load = function()
	{
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "fieldtripaccount"))
			.then(function(data)
			{
				this.obAccountSource(data.Items);
				if (this.option.data)
				{
					this.obEntityDataModel().fieldTripAccountId(this.option.data.FieldTripAccountId);
				}
			}.bind(this));
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


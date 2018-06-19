(function()
{
	createNamespace('TF.Control').ReportUserInformationViewModel = ReportUserInformationViewModel;

	function ReportUserInformationViewModel()
	{
		this.obEntityDataModel = ko.observable(new TF.DataModel.ReportUserInformationDataModel());
		this.obErrorMessageDivIsShow = ko.observable(false);
		this.obValidationErrors = ko.observableArray([]);
		this.obErrorMessageTitle = ko.observable("Error Occurred");
		this.obErrorMessageDescription = ko.observable("The following error occurred.");

		this.opacityCssSource = {
			enable: 'opacity-enabled',
			disable: 'opacity-disabled'
		};

		this.mailCityOnBlur = function(e, m)
		{
			var inputValue = m.currentTarget.value;
			var collection = (function()
			{
				var c = [];
				var array = this.obMailCityDataModels();
				for (var i in array)
				{
					c.push(array[i]['Item']);
				}
				return c;
			}.bind(this))();
			if (collection.indexOf(inputValue) == -1)
			{
				if (this.obEntityDataModel().city() == '')
				{
					$(m.currentTarget).val('');
				}
				this.obEntityDataModel().city('')
			}
		}.bind(this);


		this.mailZipOnBlur = function(e, m)
		{
			var inputValue = m.currentTarget.value;
			var collection = (function()
			{
				var c = [];
				var array = this.obMailZipDataModels();
				for (var i in array)
				{
					c.push(array[i]['Item']);
				}
				return c;
			}.bind(this))();
			if (collection.indexOf(inputValue) == -1)
			{
				if (this.obEntityDataModel().zip() == '')
				{
					$(m.currentTarget).val('');
				}
				this.obEntityDataModel().zip('')
			}
		}.bind(this);

		this.setInputEditCssAndEnableDisable('mailCity', 'city', '');

		this.setInputEditCssAndEnableDisable('mailZip', 'zip', '');

		this.obMailCityDataModels = ko.observableArray();
		this.obMailZipDataModels = ko.observableArray();
		this.obSelectedMailCity = ko.observable();
		this.obSelectedMailZip = ko.observable();

		this.getCollections = function(arr, key)
		{
			var collections = [];
			for (var i in arr)
			{
				collections.push(arr[i][key]);
			}
			return collections;
		};

		this.mailCityDisable = function() { return this.obEntityDataModel().city() == ''; };

		this.mailCityCss = function() { return this.mailCityDisable() ? this.opacityCssSource.disable : this.opacityCssSource.enable; };

		this.mailCityOnBlur = function(e, m)
		{
			var inputValue = m.currentTarget.value;
			var collection = this.getCollections(this.obMailCityDataModels(), 'Name');
			if (collection.indexOf(inputValue) == -1)
			{
				this.obEntityDataModel().city('');
			}
		}.bind(this);

		this.mailZipDisable = function() { return this.obEntityDataModel().zip() == ''; };

		this.mailZipCss = function() { return this.mailZipDisable() ? this.opacityCssSource.disable : this.opacityCssSource.enable; };

		this.mailZipOnBlur = function(e, m)
		{
			var inputValue = m.currentTarget.value;
			var collection = this.getCollections(this.obMailZipDataModels(), 'Item');
			if (collection.indexOf(inputValue) == -1)
			{
				this.obEntityDataModel().zip('');
			}
		}.bind(this);

		this.obIsAdmin = ko.observable(tf.authManager.authorizationInfo.isAdmin);
	}
	ReportUserInformationViewModel.prototype.init = function(viewModel, element)
	{
		this.element = $(element);
		this.element.find("input:text:eq(0)").focus();
		this.load();
	};

	ReportUserInformationViewModel.prototype.load = function()
	{
		return this._loadMailZipSupplement().then(function()
		{
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "reportuser"))
			.then(function(data)
			{
				this.obEntityDataModel(new TF.DataModel.ReportUserInformationDataModel(data.Items[0]));
			}.bind(this));
		}.bind(this));
	};


	ReportUserInformationViewModel.prototype.save = function()
	{
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "reportuser"),
			{
				data: this.obEntityDataModel().toData()
			})
			.then(function(data)
			{
				this.obEntityDataModel().update(data.Items[0]);
			}.bind(this));
	};

	ReportUserInformationViewModel.prototype.apply = function()
	{
		return this.save()
		.then(function()
		{
			return this.obEntityDataModel();
		}.bind(this));
	};


	ReportUserInformationViewModel.prototype.setInputEditCssAndEnableDisable = function(element, entityDataModelKey, emptyValue)
	{
		// enable / disable and set css of the edit button, including city and zipcode.
		var disable = element + 'Disable';
		var css = element + 'Css';

		this[disable] = function() { return this.obEntityDataModel()[entityDataModelKey]() == emptyValue; }.bind(this);

		this[css] = function() { return this[disable]() ? this.opacityCssSource.disable : this.opacityCssSource.enable; };
	};


	ReportUserInformationViewModel.prototype.generateFunction = function(fn)
	{
		return fn.bind(this, Array.prototype.slice.call(arguments, 1));
	}

	ReportUserInformationViewModel.prototype.addFieldItem = function(parameters)
	{
		this._openFieldItemModal(parameters);
	}

	ReportUserInformationViewModel.prototype.editFieldItem = function(parameters)
	{
		this._openFieldItemModal(parameters, true);
	}

	ReportUserInformationViewModel.prototype._openFieldItemModal = function(parameters, isEdit)
	{
		var type = parameters[0], fieldName, entityFieldName, title, modelType, dataSource, select;
		switch (type)
		{
			case "mailingcity":
				title = "Mailing City";
				entityFieldName = "city";
				modelType = TF.DataModel.MailingCityDataModel;
				dataSource = this.obMailCityDataModels;
				select = this.obSelectedMailCity;
				fieldName = "Name";
				break;
			case "mailingpostalcode":
				title = "Mailing Postal Code";
				entityFieldName = "zip";
				modelType = TF.DataModel.MailingPostalCodeDataModel;
				dataSource = this.obMailZipDataModels;
				select = this.obSelectedMailZip;
				fieldName = "Postal";
				break;
		}
		if (modelType)
		{
			var promise;
			if (isEdit)
			{
				promise = tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), type, "id"), { data: select().Id });
			}
			else
			{
				promise = Promise.resolve(false);
			}
			promise.then(function(data)
			{
				var model;
				if (data)
					model = new modelType(data.Items[0]);
				else
					model = new modelType();
				tf.modalManager.showModal(new TF.Modal.AddOneFieldModalViewModel(title, type, fieldName, model, modelType, function(result)
				{
					if (result && result != true)
					{
						var index = dataSource.indexOf(select());
						if (index != -1)
							dataSource.splice(index, 1);
						result.Text = result[fieldName];
						dataSource.push(result);
						select(result);
						this.obEntityDataModel()[entityFieldName](result.Text);
					}
				}.bind(this)));
			}.bind(this));
		}

	}

	ReportUserInformationViewModel.prototype._loadMailZipSupplement = function()
	{
		var p1 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "mailingpostalcode"))
		.then(function(data)
		{
			this.obMailZipDataModels(data.Items);
		}.bind(this));

		var p2 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "mailingcity"))
		.then(function(data)
		{
			this.obMailCityDataModels(data.Items);
		}.bind(this));

		return Promise.all([p1, p2]);
	}
})();


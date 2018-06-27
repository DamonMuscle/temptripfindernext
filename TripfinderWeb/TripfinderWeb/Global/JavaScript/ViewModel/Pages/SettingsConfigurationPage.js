(function()
{
	createNamespace("TF.Page").SettingsConfigurationPage = SettingsConfigurationPage;

	function SettingsConfigurationPage()
	{
		if (!tf.permissions.obIsAdmin())
		{
			return tf.pageManager.handlePermissionDenied("Settings");
		}

		this.obSuccessMessageDivIsShow = ko.observable(false);
		this.obErrorMessage = ko.observable('');
		this.obErrorMessageDivIsShow = ko.observable(false);
		this.obValidationErrors = ko.observableArray([]);
		this.testSentEmailClick = this.testSentEmailClick.bind(this);
		this.obEntityDataModel = ko.observable(new TF.DataModel.SettingsConfigurationDataModal());
		this.obIsUpdate = ko.observable(true);
		this.obSelectedClientId = ko.observable();
		this.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
	}

	SettingsConfigurationPage.prototype = Object.create(TF.Page.BaseGridPage.prototype);
	SettingsConfigurationPage.prototype.constructor = SettingsConfigurationPage;

	SettingsConfigurationPage.prototype.authValidation = function()
	{
		if (!tf.permissions.obIsAdmin())
		{
			return tf.pageManager.handlePermissionDenied("Settings").then(function()
			{
				return Promise.resolve(false);
			});
		}
		return Promise.resolve(true);
	};

	SettingsConfigurationPage.prototype.load = function()
	{
		this.getClients().then(function()
		{
			this.loadClientConfig();
		}.bind(this));
	};

	SettingsConfigurationPage.prototype.getClients = function()
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "clientconfig", "getClientIds"))
			.then(function(result)
			{
				result.Items.forEach(function(item)
				{
					if (item.toLowerCase() === tf.authManager.clientKey.toLowerCase())
					{
						this.obSelectedClientId(item);
					}
				}, this);
			}.bind(this));
	};

	SettingsConfigurationPage.prototype.loadClientConfig = function()
	{
		var clientId = this.obSelectedClientId() !== "New" ? this.obSelectedClientId() : "";
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "clientconfig"), { data: { clientId: clientId } })
			.then(function(data)
			{
				this.obEntityDataModel(new TF.DataModel.SettingsConfigurationDataModal(data.Items[0]));
				this.obIsUpdate(clientId !== "");
				this.obEntityDataModel().apiIsDirty(false);
				this.setValidation();
				if (!this.obIsUpdate())
				{
					$("input[name=clientId]").focus();
				}
			}.bind(this));
	};

	SettingsConfigurationPage.prototype.init = function(viewModel, el)
	{
		this.authValidation().then(function(response)
		{
			if (response)
			{
				this._$form = $(el);

				this.setValidation();
				this._$form.find("[name=clientId]").focus();
				this.load();
			}
		}.bind(this));
	};

	SettingsConfigurationPage.prototype.setValidation = function()
	{
		setTimeout(function()
		{
			var validatorFields = {}, isValidating = false, self = this, updateErrors = function($field, errorInfo)
			{
				var errors = [];
				$.each(self.pageLevelViewModel.obValidationErrors(), function(index, item)
				{
					if ($field[0] === item.field[0])
					{
						if (item.rightMessage.indexOf(errorInfo) >= 0)
						{
							return true;
						}
					}
					errors.push(item);
				});
				self.pageLevelViewModel.obValidationErrors(errors);
			};
			var validator;

			validatorFields.emailAddress = {
				trigger: "blur change",
				validators: {
					callback:
					{
						message: "invalid email",
						callback: function(value, validator, $field)
						{
							if (!value)
							{
								updateErrors($field, "email");
								return true;
							}
							var emailRegExp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
							var isValid = emailRegExp.test(value);
							if (!isValid)
							{
								return false;
							}
							return true;
						}
					}
				}
			};

			if (this._$form.data("bootstrapValidator"))
			{
				this._$form.data("bootstrapValidator").destroy();
			}
			this._$form.bootstrapValidator({
				excluded: [':hidden', ':not(:visible)'],
				live: 'enabled',
				message: 'This value is not valid',
				fields: validatorFields
			}).on('success.field.bv', function(e, data)
			{
				var $parent = data.element.closest('.form-group');
				$parent.removeClass('has-success');
				if (!isValidating)
				{
					isValidating = true;
					self.pageLevelViewModel.saveValidate(data.element).then(function()
					{
						isValidating = false;
					});
				}
			});
			this.pageLevelViewModel.load(this._$form.data("bootstrapValidator"));
		}.bind(this), 0);
	};

	SettingsConfigurationPage.prototype.testSentEmailClick = function()
	{
		tf.modalManager.showModal(
			new TF.Modal.TestEmailModalViewModel(this.obEntityDataModel())
		);
	};

	SettingsConfigurationPage.prototype.legalLinkClick = function()
	{
		window.open("Workspace/LegalPage.html");
	};

	SettingsConfigurationPage.prototype.saveClick = function()
	{
		return this.pageLevelViewModel.saveValidate()
			.then(function(valid)
			{
				if (!valid)
				{
					return false;
				}
				else
				{
					return this.postData();
				}
			}.bind(this));
	};

	SettingsConfigurationPage.prototype.postData = function()
	{
		this.obEntityDataModel().apiIsNew(!this.obIsUpdate());
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "clientconfig"), {
			data: this.obEntityDataModel().toData()
		}).then(function(data)
		{
			this.pageLevelViewModel.popupSuccessMessage();
			this.obEntityDataModel().apiIsDirty(false);

			if (!this.obIsUpdate())
			{
				this.getClients().then(function()
				{
					this.obSelectedClientId(this.obEntityDataModel().clientId());
				}.bind(this));
				this.obIsUpdate(true);
			}
			return true;
		}.bind(this), function(data)
		{
			this.obErrorMessageDivIsShow(true);
			this.obErrorMessage(data.ExceptionMessage);
			return false;
		}.bind(this));
	};

	SettingsConfigurationPage.prototype.cancelClick = function()
	{
		if (this.obEntityDataModel().apiIsDirty())
		{
			tf.promiseBootbox.yesNo("You have unsaved changes.  Would you like to save your changes prior to canceling?", "Unsaved Changes")
				.then(function(result)
				{
					if (result === true)
					{
						this.saveClick().then(function(result)
						{
							if (result)
							{
								tf.pageManager.openNewPage("fieldtrips");
							}
						});
					} else if (result === false)
					{
						tf.pageManager.openNewPage("fieldtrips");
					} else
					{
						return;
					}
				}.bind(this));
		} else
		{
			tf.pageManager.openNewPage("fieldtrips");
		}
	};

	SettingsConfigurationPage.prototype.dispose = function()
	{
		this.pageLevelViewModel.dispose();
	};
})();

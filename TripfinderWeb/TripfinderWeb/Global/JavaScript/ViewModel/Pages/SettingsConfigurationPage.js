(function()
{
	createNamespace("TF.Page").SettingsConfigurationPage = SettingsConfigurationPage;

	function SettingsConfigurationPage()
	{
		var self = this;
		self.type = "settings";
		self.pageType = "settings";
		self.obSuccessMessageDivIsShow = ko.observable(false);
		self.obErrorMessage = ko.observable('');
		self.obErrorMessageDivIsShow = ko.observable(false);
		self.obValidationErrors = ko.observableArray([]);
		self.testSentEmailClick = self.testSentEmailClick.bind(self);
		self.obEntityDataModel = ko.observable(new TF.DataModel.SettingsConfigurationDataModal());
		self.obIsUpdate = ko.observable(true);
		self.obSelectedClientId = ko.observable();
		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
		TF.Page.BaseGridPage.apply(self, arguments);
		self.displayPassword = "****fake*password****";
	}

	SettingsConfigurationPage.prototype.constructor = SettingsConfigurationPage;
	SettingsConfigurationPage.prototype = Object.create(TF.Page.BaseGridPage.prototype);

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
		var self = this;
		self.getClients().then(function()
		{
			self.loadClientConfig();
		}.bind(this));
	};

	SettingsConfigurationPage.prototype.getClients = function()
	{
		var self = this;
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "clientconfig", "getClientIds"))
			.then(function(result)
			{
				result.Items.forEach(function(item)
				{
					if (item.toLowerCase() === tf.authManager.clientKey.toLowerCase())
					{
						self.obSelectedClientId(item);
					}
				}, this);
			}.bind(this));
	};

	SettingsConfigurationPage.prototype.loadClientConfig = function()
	{
		var self = this, clientId = self.obSelectedClientId() !== "New" ? self.obSelectedClientId() : "";
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "clientconfig"), { data: { clientId: clientId } })
			.then(function(data)
			{
				if (self.obSelectedClientId() !== "New")
				{
					data.Items[0].Smtppassword = self.displayPassword;
				}
				self.obEntityDataModel(new TF.DataModel.SettingsConfigurationDataModal(data.Items[0]));
				self.obIsUpdate(clientId !== "");
				self.obEntityDataModel().apiIsDirty(false);
				self.setValidation();
				if (!self.obIsUpdate())
				{
					$("input[name=clientId]").focus();
				}
			}.bind(this));
	};

	SettingsConfigurationPage.prototype.resetFakePassword = function()
	{
		var self = this, settings = self.obEntityDataModel().clone();
		if (self.obSelectedClientId() !== "New")
		{
			if (settings.smtppassword() === self.displayPassword)
			{
				settings.smtppassword("");
			}
		}

		return settings;
	}

	SettingsConfigurationPage.prototype.init = function(viewModel, el)
	{
		var self = this;
		self.authValidation().then(function(response)
		{
			if (response)
			{
				self._$form = $(el);

				self.setValidation();
				self._$form.find("[name=clientId]").focus();
				if (TF.isPhoneDevice)
				{
					self._$form.find(".mobile-header .add").hide();
				}

				self.load();
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

			if (self._$form.data("bootstrapValidator"))
			{
				self._$form.data("bootstrapValidator").destroy();
			}
			self._$form.bootstrapValidator({
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
			self.pageLevelViewModel.load(self._$form.data("bootstrapValidator"));
		}.bind(this), 0);
	};

	SettingsConfigurationPage.prototype.testSentEmailClick = function()
	{
		var self = this;
		tf.modalManager.showModal(
			new TF.Modal.TestEmailModalViewModel(self.resetFakePassword())
		);
	};

	SettingsConfigurationPage.prototype.legalLinkClick = function()
	{
		window.open("Workspace/LegalPage.html");
	};

	SettingsConfigurationPage.prototype.saveClick = function()
	{
		var self = this;
		return self.pageLevelViewModel.saveValidate()
			.then(function(valid)
			{
				if (!valid)
				{
					return false;
				}
				else
				{
					return self.postData();
				}
			}.bind(this));
	};

	SettingsConfigurationPage.prototype.postData = function()
	{
		var self = this;
		self.obEntityDataModel().apiIsNew(!self.obIsUpdate());
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "clientconfig"), {
			data: self.resetFakePassword().toData()
		}).then(function(data)
		{
			self.pageLevelViewModel.popupSuccessMessage();
			self.obEntityDataModel().apiIsDirty(false);

			if (!self.obIsUpdate())
			{
				self.getClients().then(function()
				{
					self.obSelectedClientId(self.obEntityDataModel().clientId());
				}.bind(this));
				self.obIsUpdate(true);
			}
			return true;
		}.bind(this), function(data)
		{
			self.obErrorMessageDivIsShow(true);
			self.obErrorMessage(data.ExceptionMessage);
			return false;
		}.bind(this));
	};

	SettingsConfigurationPage.prototype.cancelClick = function()
	{
		var self = this;
		if (self.obEntityDataModel().apiIsDirty())
		{
			tf.promiseBootbox.yesNo("You have unsaved changes.  Would you like to save your changes prior to canceling?", "Unsaved Changes")
				.then(function(result)
				{
					if (result === true)
					{
						self.saveClick().then(function(result)
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
		var self = this;
		self.pageLevelViewModel.dispose();
	};
})();

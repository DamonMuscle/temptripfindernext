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
		self.englishEditor = null;
		self.spanishEditor = null;
		self.showTotalCost = false;
		self.changeTotalCost = false;
		self.messageStatus = false;
		self.changeMessageStatus = false;
		self.englishEditorChanged = false;
		self.spanishEditorChanged = false;
		self.obPreEnglishMessage = ko.observable();
		self.obPreSpanishMessage = ko.observable();
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
			self.getFieldTripSettings();
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

	SettingsConfigurationPage.prototype.getFieldTripSettings = function()
	{
		var self = this;
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "fieldtripoptionandsetting", "fromini"))
			.then(function(result)
			{
				if (result.Items && result.Items.length > 0)
				{
					$(".show-total-cost").prop("checked", result.Items[0].ShowTripTotalCost);
					self.showTotalCost = result.Items[0].ShowTripTotalCost;
				}
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
				self.initEditor();
			}.bind(this));
	};

	SettingsConfigurationPage.prototype.initEditor = function()
	{
		var self = this;
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "tripfindermessage")).then(function(result)
		{
			$(".editor-wrapper").css("visibility", "visible");
			self.englishEditor = $("#EnglishEditor").kendoEditor({
				resizable: {
					content: true,
					toolbar: true
				},
				change: function()
				{
					if (self.englishEditor.value() !== self.obPreEnglishMessage())
					{
						self.englishEditorChanged = true;
					}
					else
					{
						self.englishEditorChanged = false;
					}
				},
			}).data("kendoEditor");
			self.spanishEditor = $("#SpanishEditor").kendoEditor({
				resizable: {
					content: true,
					toolbar: true
				},
				change: function()
				{
					if (self.spanishEditor.value() !== self.obPreSpanishMessage())
					{
						self.spanishEditorChanged = true;
					}
					else
					{
						self.spanishEditorChanged = false;
					}
				},
			}).data("kendoEditor");

			$(".editor-wrapper").find(".k-insertImage").closest(".k-tool").hide();
			var $head = $("#EnglishEditor").closest(".edit-content").find("iframe").contents().find("head");
			$head.append($("<link/>",
				{ rel: "stylesheet", href: "Global/ThirdParty/bootstrap/css/bootstrap.min.css", type: "text/css" }
			));
			$head.append($("<link/>",
				{ rel: "stylesheet", href: "Global/Css/tripfinder.css", type: "text/css" }
			));

			if (result.Items && result.Items.length > 0)
			{
				self.englishEditor.value(result.Items[0].EnglishMessage);
				self.obPreEnglishMessage(result.Items[0].EnglishMessage);
				self.spanishEditor.value(result.Items[0].SpanishMessage);
				self.obPreSpanishMessage(result.Items[0].SpanishMessage);
				$(".display-once-daily").prop("checked", result.Items[0].DisplayOnceDaily);
				self.messageStatus = result.Items[0].DisplayOnceDaily;
			}
			self.englishEditor.refresh();
			self.spanishEditor.refresh();

			$(".editor-options-wrap .design").addClass("selected");
			$(".editor-options-wrap .html").removeClass("selected");
		});
	};

	SettingsConfigurationPage.prototype.changePattern = function(viewModel, e)
	{
		var self = this, $optionBtn = $(e.target).closest(".option");
		if ($optionBtn.hasClass("selected")) 
		{
			return;
		}

		var $container = $optionBtn.closest(".editor-wrapper"),
			isEnglish = $optionBtn.hasClass("english");
		$container.find(".option").removeClass("selected");
		$optionBtn.addClass("selected");

		if ($optionBtn.hasClass("design"))
		{
			$container.find(".text-editor-wrapper").show();
			$container.find(".html-editor-wrapper").hide();
			if (isEnglish)
			{
				self.englishEditor.value($("#EnglishHtmlEditor").val());
			}
			else
			{
				self.spanishEditor.value($("#SpanishHtmlEditor").val());
			}
		}
		else
		{
			$container.find(".html-editor-wrapper").show();
			$container.find(".text-editor-wrapper").hide();
			if (isEnglish)
			{
				$("#EnglishHtmlEditor").val(self.englishEditor.value());
			}
			else
			{
				$("#SpanishHtmlEditor").val(self.spanishEditor.value());
			}
		}
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
					return self.postData().then(function(result)
					{
						var settings = {};
						settings["SHOWTRIPTOTALCOST"] = $(".show-total-cost").prop("checked");
						var p1 = tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "tripfindermessage"), {
							data: {
								EnglishMessage: $(".option.english.design").hasClass("selected") ? self.englishEditor.value() : $("#EnglishHtmlEditor").val(),
								SpanishMessage: $(".option.spanish.design").hasClass("selected") ? self.spanishEditor.value() : $("#SpanishHtmlEditor").val(),
								DisplayOnceDaily: $(".display-once-daily").prop("checked"),
								APIIsDirty: true
							}
						}).then(function(response)
						{
							return response;
						}),
							p2 = tf.promiseAjax.put(pathCombine(tf.api.apiPrefix(), "fieldtripoptionandsetting", "fromini"), {
								data: JSON.stringify(settings)
							}).then(function(response)
							{
								return response;
							});
						return Promise.all([p1, p2]).then(function()
						{
							if (tf.pageManager.navigationData)
							{
								tf.pageManager.navigationData.obShowMessageCenter(self.englishEditor.value() !== "" || self.spanishEditor.value() !== "");
							}
							if (result)
							{
								self.pageLevelViewModel.popupSuccessMessage();
								self.changeTotalCost = false;
								self.showTotalCost = $(".show-total-cost").prop("checked");
								self.messageStatus = $(".display-once-daily").prop("checked");
								self.changeMessageStatus = false;
								self.englishEditorChanged = false;
								self.spanishEditorChanged = false;
							}
							return result;
						});
					});
				}
			}.bind(this));
	};

	SettingsConfigurationPage.prototype.postData = function()
	{
		var self = this;
		self.obEntityDataModel().apiIsNew(!self.obIsUpdate());
		var queryString = "?emptySMTPPassword=" + (this.obSelectedClientId() !== "New" && !this.obEntityDataModel().smtppassword());
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "clientconfig", queryString), {
			data: self.resetFakePassword().toData()
		}).then(function(data)
		{
			self.obEntityDataModel().apiIsDirty(false);

			if (this.obSelectedClientId() !== "New")
			{
				this.obEntityDataModel().smtppassword(this.displayPassword);
			}

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

	SettingsConfigurationPage.prototype.checkDataChanges = function()
	{
		var self = this;
		if ($(".show-total-cost").prop("checked") !== self.showTotalCost)
		{
			self.changeTotalCost = true;
		}
		else
		{
			self.changeTotalCost = false;
		}
		if ($(".display-once-daily").prop("checked") !== self.messageStatus)
		{
			self.changeMessageStatus = true;
		}
		else
		{
			self.changeMessageStatus = false;
		}
	};

	SettingsConfigurationPage.prototype.cancelClick = function()
	{
		var self = this;
		self.checkDataChanges();
		var pageName = tf.storageManager.get(TF.productName.toLowerCase() + ".page");

		if (self.obEntityDataModel().apiIsDirty() || self.changeTotalCost || self.changeMessageStatus || self.englishEditorChanged || self.spanishEditorChanged)
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
								tf.pageManager._openNewPage(pageName);
							}
						});
					} else if (result === false)
					{
						tf.pageManager._openNewPage(pageName);
					} else
					{
						return;
					}
				}.bind(this));
		} else
		{
			tf.pageManager._openNewPage(pageName);
		}
	};

	SettingsConfigurationPage.prototype.tryGoAway = function(pageName)
	{
		var self = this;
		self.checkDataChanges();

		if ((self.obEntityDataModel().apiIsDirty() || self.changeTotalCost || self.changeMessageStatus || self.englishEditorChanged || self.spanishEditorChanged) && tf.permissions.obIsAdmin())
		{
			return tf.promiseBootbox.yesNo("You have unsaved changes. Would you like to save your changes prior to opening up " + pageName + "?", "Unsaved Changes")
				.then(function(result)
				{
					if (result)
					{
						return Promise.resolve().then(function()
						{
							return self.saveClick();
						}.bind(self));
					}
					else
					{
						return Promise.resolve(result === false);
					}
				}.bind(self));
		}
		else
		{
			return Promise.resolve(true);
		}
	};

	SettingsConfigurationPage.prototype.dispose = function()
	{
		var self = this;
		self.pageLevelViewModel.dispose();
	};
})();

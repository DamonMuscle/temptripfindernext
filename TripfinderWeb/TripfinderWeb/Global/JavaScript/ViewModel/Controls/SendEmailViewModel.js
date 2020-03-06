(function()
{
	createNamespace('TF.Control').SendEmailViewModel = SendEmailViewModel;

	function SendEmailViewModel(option)
	{
		this.option = option ||
			{};
		this.selectRecipientToClick = this.selectRecipientToClick.bind(this);
		this.deleteFileClick = this.deleteFileClick.bind(this);
		this.obErrorMessageDivIsShow = ko.observable(false);
		this.obValidationErrors = ko.observableArray([]);
		this.obEntityDataModel = ko.observable(new TF.DataModel.SettingsConfigurationDataModal());
		this.obEmailToList = ko.observableArray([]);
		this.obEmailToErrorList = ko.observableArray([]);
		this.obEmailToString = ko.computed(function()
		{
			return this.obEmailToList().map(function(item)
			{
				return this.EmailFormatter(item);
			}.bind(this)).join(";");
		}.bind(this));
		this.documentEntities = ko.observableArray([]);

		this.setEmailSubject();
		this.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
		this.checkConfigure();
	}

	SendEmailViewModel.prototype.setEmailSubject = function()
	{
		this.obEntityDataModel().emailSubject(this.option.subject || "");
	};

	SendEmailViewModel.prototype.EmailFormatter = function(item)
	{
		return item.emailAddress();
	};
	SendEmailViewModel.prototype.initModel = function(viewModel, el)
	{
		this._$form = $(el);
		var validatorFields = {},
			isValidating = false,
			self = this,
			updateErrors = function($field, errorInfo)
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

		validatorFields["mailToList"] = {
			trigger: "blur change",
			validators:
			{
				notEmpty:
				{
					message: "required"
				},
				callback:
				{
					callback: function(value, validator, $field)
					{
						if (!value)
						{
							updateErrors($field, "email");
							return true;
						}
						else
						{
							updateErrors($field, "required");
						}
						value = value.trim();
						if (value === "")
						{
							this.obEmailToList([]);
							return true;
						}
						var result = true;
						var reg = /[,;]/;
						var emailList = value.split(reg);
						var emailRegExp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
						var errorEmails = [];
						var oldList = this.obEmailToList();
						var newList = [];
						$.each(emailList, function(n, item)
						{
							item = item.trim();
							if (item == "")
							{
								return;
							}
							var isValid = emailRegExp.test(item);
							if (!isValid)
							{
								errorEmails.push(item);
								result = false;
							}

							var to = Enumerable.From(oldList).Where(function(c)
							{
								return this.EmailFormatter(c).trim() == item.trim();
							}.bind(this)).ToArray();
							if (to.length > 0)
							{
								newList.push(to[0]);
							}
							else
							{
								newList.push(
									new TF.DataModel.ReportReceiptDataModel(
										{
											SelectedUserId: 0,
											EmailAddress: item
										})
								);
							}

						}.bind(this));

						this.obEmailToList(newList);
						this._$form.find("small[data-bv-for=mailToList][data-bv-validator=callback]").text(errorEmails.length == 1 ? errorEmails[0] + ' is not a valid email.' : errorEmails.length + ' emails are invalid.');
						return result;

					}.bind(this)
				}
			}
		};

		$(el).bootstrapValidator(
			{
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
					self.pageLevelViewModel.saveValidate(data.element);
					isValidating = false;
				}
			});
		this.pageLevelViewModel.load(this._$form.data("bootstrapValidator"));

		this.obEntityDataModel().apiIsDirty(false);

		setTimeout(function()
		{
			this._$form.find("input[name='mailToList']").focus();
		}.bind(this));
	};


	SendEmailViewModel.prototype.focusField = function(viewModel, e)
	{
		$(viewModel.field).focus();
	};

	SendEmailViewModel.prototype.selectRecipientToClick = function(viewModel, e)
	{
		var ids = this.obEmailToList().map(function(item)
		{
			return item.selectedUserId();
		});
		var searchData = new TF.SearchParameters(null, null, null, null, null, ids, null);
		tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", "user"),
			{
				data: searchData.data
			})
			.then(function(apiResponse)
			{
				tf.modalManager.showModal(
					new TF.Modal.ListMoverSelectRecipientControlModalViewModel(
						apiResponse.Items
					))
					.then(function(result)
					{
						if (result === true)
						{
							return;
						}
						var list = result.map(function(item)
						{
							var name = item.LoginId;
							if (item.FirstName != "" || item.LastName != "")
							{
								name = item.FirstName + " " + item.LastName;
							}
							return new TF.DataModel.ReportReceiptDataModel(
								{
									SelectedUserId: item.Id,
									EmailAddress: item.Email,
									UserName: name
								});
						});
						$.each(this.obEmailToList(), function(n, item)
						{
							if (item.selectedUserId() == 0)
							{
								list.push(item);
							}
						});
						this.obEmailToList(list);
						this._$form.find("input[name='mailToList']").trigger("change");
					}.bind(this));
			}.bind(this));
	};

	SendEmailViewModel.prototype.deleteFileClick = function(viewModel, e)
	{
		return tf.promiseAjax["delete"](pathCombine(tf.api.apiPrefix(), "search", this.option.type, "export", "email/delete"),
			{
				data: [viewModel.Guid]
			})
			.then(function(response)
			{
				this.documentEntities.remove(
					function(item)
					{
						return item.Filename == viewModel.Filename;
					});
			}.bind(this));
	};

	SendEmailViewModel.prototype.apply = function()
	{
		return this.trysave()
			.then(function(data)
			{
				return data;
			})
			.catch(function() { });
	};

	SendEmailViewModel.prototype.trysave = function()
	{
		return this.pageLevelViewModel.saveValidate()
			.then(function(valid)
			{
				if (!valid)
				{
					var messages = validator.getMessages(validator.getInvalidFields());
					var $fields = validator.getInvalidFields();
					var validationErrors = [];
					$fields.each(function(i, fielddata)
					{
						if (i == 0)
						{
							$(fielddata).focus();
						}
						validationErrors.push(
							{
								name: ($(fielddata).attr('data-bv-error-name') ? $(fielddata).attr('data-bv-error-name') : $(fielddata).closest("div.form-group").find("strong").text()),
								message: messages[i].replace('&lt;', '<').replace('&gt;', '>'),
								field: $(fielddata)
							});

					}.bind(this));
					this.obErrorMessageDivIsShow(true);
					this.obValidationErrors(validationErrors);

					return Promise.reject();
				}
				else
				{
					var list = this.obEmailToList();
					//Verify Recipients - At least one recipient must be specified for the To or Bcc.  If not, display the following page-level error message 
					//"At least one recipient is required (To or Bcc).
					if (list.length == 0)
					{
						var validationErrors = [];
						validationErrors.push(
							{
								name: "mailToList",
								message: "At least one recipient is required ",
								field: $("input[name=mailToList]")
							});

						this.obErrorMessageDivIsShow(true);
						this.obValidationErrors(validationErrors);
						return Promise.reject();
					}

					if (this.obEntityDataModel().emailSubject() === "" || this.obEntityDataModel().emailMessage() === "" ||
						this.obEntityDataModel().emailSubject() === null || this.obEntityDataModel().emailMessage() === null)
					{
						var info = "The Subject and Message have";
						if ((this.obEntityDataModel().emailSubject() === "" || this.obEntityDataModel().emailSubject() === null) && (this.obEntityDataModel().emailMessage() != "" && this.obEntityDataModel().emailMessage() != null))
						{
							info = "The Subject has";
						}
						if ((this.obEntityDataModel().emailSubject() != "" && this.obEntityDataModel().emailSubject() != null) &&
							(this.obEntityDataModel().emailMessage() === "" || this.obEntityDataModel().emailMessage() === null))
						{
							info = "The Message has";
						}
						return tf.promiseBootbox.yesNo(info + " not been specified.  Are you sure you want to Send?", "Confirmation Message")
							.then(function(ans)
							{
								if (!ans)
								{
									return Promise.reject();
								}
							}.bind(this))
							.then(function()
							{
								return this.save();
							}.bind(this));
					}
					return this.save();
				}
			}.bind(this));
	};

	SendEmailViewModel.prototype.save = function()
	{
		return this.checkConfigure().then(function(result)
		{
			if (result)
			{
				this.obEntityDataModel().mailToList(this.obEmailToList().map(function(item)
				{
					return item.emailAddress();
				}));

				var sendData = this.obEntityDataModel().toData();
				sendData.attachments = this.documentEntities();
				var promisePost;
				if (this.option.postSendEmail)
				{
					promisePost = this.option.postSendEmail;
				}
				else
				{
					promisePost = function()
					{
						return tf.promiseAjax["post"](pathCombine(tf.api.apiPrefixWithoutDatabase(), "emails?onlyMessage=true"),
							{
								data: sendData
							});
					};
				}
				return promisePost(sendData).then(function(data)
				{
					if (data.Items[0] !== "")
					{
						return tf.promiseBootbox.okRetry(
							{
								message: "An email could not be sent. Verify your SMTP Server settings. If you continue to experience issues, contact us at support@transfnder.com or 888-427-2403",
								title: "Unable to Send Email"
							})
							.then(function(confirm)
							{
								if (!confirm)
								{
									this.save();
								}
							}.bind(this));
					}
					else
					{
						return tf.promiseBootbox.alert("An email has been successfully sent.", "Email Successfully Sent")
							.then(function()
							{
								return true;
							}.bind(this));
					}
				}.bind(this));
			}
			else
			{
				return tf.promiseBootbox.alert("The SMTP Server must be configured to send emails. This is not configured for your product. Contact your System Administrator to configure these settings. If you continue to experience issues, contact us at support@transfinder.com or 888-427-2403", "SMTP Server Settings Are Not Configured");
			}
		}.bind(this));
	};

	SendEmailViewModel.prototype.checkConfigure = function()
	{
		var self = this;
		if (self.clientConfig && self.clientConfig.Smtphost)
		{
			return Promise.resolve(self.clientConfig.Smtphost && self.clientConfig.Smtpport)
		}
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "clientconfigs"), null)
			.then(function(data)
			{
				if (data.Items && data.Items.length > 0)
				{
					self.clientConfig = data.Items[0];
					self.obEntityDataModel().emailAddress(data.Items[0].EmailAddress);
					if (data.Items[0].Smtphost && data.Items[0].Smtpport)
					{
						return true;
					}
				}
				return false;
			});
	};

	SendEmailViewModel.prototype.close = function()
	{
		return new Promise(function(resolve, reject)
		{
			if (this.obEntityDataModel() && this.obEntityDataModel().apiIsDirty())
			{
				resolve(tf.promiseBootbox.yesNo("Are you sure you want to cancel this email?", "Confirmation Message"));
			}
			else
			{
				resolve(true);
			}
		}.bind(this));
	};

	SendEmailViewModel.prototype.dispose = function()
	{
		this.pageLevelViewModel.dispose();
	};

})();

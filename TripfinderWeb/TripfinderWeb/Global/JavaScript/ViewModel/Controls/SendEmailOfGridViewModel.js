(function()
{
	createNamespace('TF.Control').SendEmailOfGridViewModel = SendEmailOfGridViewModel;

	function SendEmailOfGridViewModel(option, obDisableControl)
	{
		this.option = option;
		this.status = ko.observable("sendEmail");
		this.obdisabledSend = obDisableControl;
		if (this.option.modelType === 'SendTo')
		{
			this.disabledSendInMobile = ko.observable('disabled');
		}
		else
		{
			this.disabledSendInMobile = ko.observable('');
		}
		this.titleContent = ko.observable(option.modelType === 'SendTo' ? 'SEND TO' : 'EMAIL');
		this.obRecipientList = ko.observableArray([]);
		this.obSearchRecipient = ko.observable("");
		this.obRecipientSearchResultIsEmpty = ko.observable(false);
		this.obNewEmail = ko.observable("");
		this.obIsNewEditing = ko.observable(false);
		this.selectRecipientToClick = this.selectRecipientToClick.bind(this);
		this.deleteFileClick = this.deleteFileClick.bind(this);
		this.retryClick = this.retryClick.bind(this);
		this.obErrorMessageDivIsShow = ko.observable(false);
		this.obValidationErrors = ko.observableArray([]);
		this.obEntityDataModel = ko.observable(new TF.DataModel.SettingsConfigurationDataModal());
		this.obEmails = ko.observableArray(option.emailAddress);
		this.obCcEnable = ko.observable(false);
		this.obBccEnable = ko.observable(false);
		// this.associatedAddress = ko.observable("");
		if (option.placeEmailTo)
		{
			tf.promiseAjax["get"](pathCombine(tf.api.apiPrefix(), tf.DataTypeHelper.getEndpoint(this.option.type)),
				{
					paramData:
					{
						Id: this.option.selectedIds,
						"@relationships": "Contact, DestinationContact",
						"@fields": "ContactEmail, DestinationContactEmail"
					}
				}, { overlay: false }).then(function(result)
				{
					var address = [];
					result.Items.filter(function(item)
					{
						return item.ContactEmail !== '' && item.ContactEmail !== null;
					}).map(function(item)
					{
						address.push(
							new TF.DataModel.ReportReceiptDataModel(
								{
									SelectedUserId: 0,
									EmailAddress: item.ContactEmail
								})
						)
					});
					if (option.placeEmailTo == 'Bcc')
					{
						this.obEmailBccList(address);
						this.obBccEnable(true);
					}
					else
					{
						this.obEmailToList(address);
					}
				}.bind(this));
		}

		this.initFromEmailSource(option).then(function()
		{
			// if (option.emailAddress.indexOf(tf.storageManager.get("fromEmailAddress")) >= 0)
			// {
			// 	this.obEntityDataModel().emailAddress(tf.storageManager.get("fromEmailAddress"));
			// }
			// else
			// {
			this.obEntityDataModel().emailAddress(option.emailAddress[0]);
			// }
		}.bind(this));
		this.obEntityDataModel().emailAddress.subscribe(function()
		{
			tf.storageManager.save("fromEmailAddress", this.obEntityDataModel().emailAddress());
		}.bind(this));
		this.obEmailToList = ko.observableArray([]);
		this.obEmailCcList = ko.observableArray([]);
		this.obEmailBccList = ko.observableArray([]);
		this.obEmailToErrorList = ko.observableArray([]);
		this.isNewEmailValid = ko.observable(true);
		this.obEmailDoneClickable = ko.observable(true);
		this.obEmailToString = ko.computed(function()
		{
			if (TF.isPhoneDevice)
			{
				var emailCount = this.obEmailToList().length;
				if (!this.obEmailToList() || emailCount === 0)
				{
					return "";
				}
				else if (emailCount === 1)
				{
					return this.EmailFormatter(this.obEmailToList()[0]);
				}
				else
				{
					return this.EmailFormatter(this.obEmailToList()[0]) + " & " + (emailCount - 1) + " others";
				}
			}
			return this.obEmailToList().map(function(item)
			{
				return this.EmailFormatter(item);
			}.bind(this)).join(";");
		}.bind(this));
		this.obEmailCcString = ko.computed(function()
		{
			if (TF.isPhoneDevice)
			{
				var emailCount = this.obEmailCcList().length;
				if (!this.obEmailCcList() || emailCount === 0)
				{
					return "";
				}
				else if (emailCount === 1)
				{
					return this.EmailFormatter(this.obEmailCcList()[0]);
				}
				else
				{
					return this.EmailFormatter(this.obEmailCcList()[0]) + " & " + (emailCount - 1) + " others";
				}
			}
			return this.obEmailCcList().map(function(item)
			{
				return this.EmailFormatter(item);
			}.bind(this)).join(";");
		}.bind(this));
		this.obEmailBccString = ko.computed(function()
		{
			if (TF.isPhoneDevice)
			{
				var emailCount = this.obEmailBccList().length;
				if (!this.obEmailBccList() || emailCount === 0)
				{
					return "";
				}
				else if (emailCount === 1)
				{
					return this.EmailFormatter(this.obEmailBccList()[0]);
				}
				else
				{
					return this.EmailFormatter(this.obEmailBccList()[0]) + " & " + (emailCount - 1) + " others";
				}
			}
			return this.obEmailBccList().map(function(item)
			{
				return this.EmailFormatter(item);
			}.bind(this)).join(";");
		}.bind(this));
		this.documentEntities = ko.observableArray([]);
		if (this.option.modelType === 'SendTo')
			this.initAttachments();

		this.setEmailSubject();
		this.pageLevelViewModel = new TF.PageLevel.EmailPageLevelViewModel(this);
		this.obSearchRecipient.subscribe(this.searchRecipientForMobile.bind(this));
	}

	SendEmailOfGridViewModel.prototype.initAttachments = function()
	{
		this.documentEntities.push(
			{
				Filename: tf.applicationTerm.getApplicationTermPluralByName(this.option.term) + (this.option.modelType === 'SendTo' ? '.csv' : '.xls'),
				Guid: ko.observable(''),
				DatabaseId: tf.datasourceManager.databaseId,
				FileProgress: ko.observable("0%"),
				DownLoadComplete: ko.observable(false),
				UploadFailed: ko.observable(false)
			});
		if (this.option.type == 'altsite' ||
			this.option.type == 'student' ||
			this.option.type == 'school' ||
			this.option.type == 'tripstop' ||
			this.option.type == 'trip')
		{
			this.documentEntities.push(
				{
					Filename: tf.applicationTerm.getApplicationTermPluralByName(this.option.term) + ".KML",
					Guid: ko.observable(''),
					DatabaseId: tf.datasourceManager.databaseId,
					FileProgress: ko.observable("0%"),
					DownLoadComplete: ko.observable(false),
					UploadFailed: ko.observable(false)
				});
		}
	};

	SendEmailOfGridViewModel.prototype.setEmailSubject = function()
	{
		this.obEntityDataModel().emailSubject(this.option.subject);
	};

	SendEmailOfGridViewModel.prototype.EmailFormatter = function(item)
	{
		return item.emailAddress();
	};

	SendEmailOfGridViewModel.prototype.initFromEmailSource = function(option)
	{
		if (option.emailAddress)
		{
			return Promise.resolve();
		}
		option.emailAddress = [];
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "clientconfigs"), null, { overlay: false })
			.then(function(data)
			{
				if (!!data.Items[0].EmailAddress)
				{
					option.emailAddress.push(data.Items[0].EmailAddress);
				}
			}.bind(this)).then(function()
			{
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "userprofiles?dbid=" + tf.datasourceManager.databaseId + "&@relationships=all"), {}, { overlay: false })
					.then(function(response)
					{
						if (!!response.Items[0].Email)
						{
							if (option.emailAddress.length <= 0 || option.emailAddress[0] !== response.Items[0].Email)
							{
								option.emailAddress.push(response.Items[0].Email);
							}
						}
					}.bind(this));
			}.bind(this)).then(function()
			{
				this.obEmails(option.emailAddress);
			}.bind(this));
	};


	function testEmail(email)
	{
		var reg = /[,;]/;
		var emailList = [];
		email.split(reg).map(function(item)
		{
			if (item.trim() != '')
			{
				emailList.push(item.trim());
			}
		});
		var emailRegExp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		var valid = true;
		var inValidList = [];
		emailList.forEach(function(element, index)
		{
			if ($.trim(element) && !emailRegExp.test(element))
			{
				inValidList.push(element);
				valid = false;
			}
		});
		return {
			valid: valid,
			inValidList: inValidList
		};
	}

	SendEmailOfGridViewModel.prototype.initModel = function(viewModel, el)
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
		if (!TF.isPhoneDevice)
		{
			this._$form.find("input[name='from']").focus();
		}
		validatorFields.FromAddress = {
			trigger: "blur change",
			validators:
			{
				notEmpty:
				{
					message: "required"
				},
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
						else
						{
							updateErrors($field, "required");
						}
						if (!testEmail(value).valid)
						{
							return false;
						}
						return true;
					}
				}
			}
		};

		validatorFields["mailToList"] = {
			trigger: "blur change",
			validators:
			{
				callback:
				{
					callback: function(value, validator, $field)
					{
						if (TF.isPhoneDevice)
						{
							return true;
						}
						// if (!value)
						// {
						// 	updateErrors($field, "email");
						// 	return true;
						// }
						// else
						if (value)
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
							var isValid = testEmail(item).valid;
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

		validatorFields["mailCcList"] = {
			trigger: "blur change",
			validators:
			{
				callback:
				{
					callback: function(value, validator, $field)
					{
						if (TF.isPhoneDevice)
						{
							return true;
						}
						// if (!value)
						// {
						// 	updateErrors($field, "email");
						// 	return true;
						// }
						// else
						if (value)
						{
							updateErrors($field, "required");
						}
						value = value.trim();
						if (value === "")
						{
							this.obEmailCcList([]);
							return true;
						}
						var result = true;
						var reg = /[,;]/;
						var emailList = value.split(reg);
						var errorEmails = [];
						var oldList = this.obEmailCcList();
						var newList = [];
						$.each(emailList, function(n, item)
						{
							item = item.trim();
							if (item == "")
							{
								return;
							}
							var isValid = testEmail(item).valid;
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

						this.obEmailCcList(newList);
						this._$form.find("small[data-bv-for=mailCcList][data-bv-validator=callback]").text(errorEmails.length == 1 ? errorEmails[0] + ' is not a valid email.' : errorEmails.length + ' emails are invalid.');

						return result;

					}.bind(this)
				}
			}
		};

		validatorFields["mailBccList"] = {
			trigger: "blur change",
			validators:
			{
				callback:
				{
					callback: function(value, validator, $field)
					{
						if (TF.isPhoneDevice)
						{
							return true;
						}
						// if (!value)
						// {
						// 	updateErrors($field, "email");
						// 	return true;
						// }
						// else
						if (value)
						{
							updateErrors($field, "required");
						}
						value = value.trim();
						if (value === "")
						{
							this.obEmailBccList([]);
							return true;
						}
						var result = true;
						var reg = /[,;]/;
						var emailList = value.split(reg);
						var errorEmails = [];
						var oldList = this.obEmailBccList();
						var newList = [];
						$.each(emailList, function(n, item)
						{
							item = item.trim();
							if (item == "")
							{
								return;
							}
							var isValid = testEmail(item).valid;
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

						this.obEmailBccList(newList);
						this._$form.find("small[data-bv-for=mailBccList][data-bv-validator=callback]").text(errorEmails.length == 1 ? errorEmails[0] + ' is not a valid email.' : errorEmails.length + ' emails are invalid.');

						return result;

					}.bind(this)
				}
			}
		};

		$(el).bootstrapValidator(
			{
				excluded: [],
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
		this.loadRecipientsForMobile();
		if (this.option.modelType === 'SendTo')
		{
			this.LoadAttachments();
			this.intervalID = this.GetProgress();
			this.setTimeoutID = setTimeout(function()
			{
				clearInterval(self.intervalID);
				tf.promiseAjax["get"](pathCombine(tf.api.apiPrefix(), "search", self.option.type, "export", "resetProgress"), {}, { overlay: false });
			}, 120000);
		}
	};

	SendEmailOfGridViewModel.prototype.GetProgress = function()
	{
		var self = this;
		tf.promiseAjax["get"](pathCombine(tf.api.apiPrefix(), "search", self.option.type, "export", "getProgress"), {}, { overlay: false })
			.then(function(response)
			{
				if (response.Items.length > 0)
				{
					self.documentEntities().map(function(item)
					{
						item.FileProgress(response.Items[0] + '%');
					});
				}
			});
		return setInterval(function()
		{
			tf.promiseAjax["get"](pathCombine(tf.api.apiPrefix(), "search", self.option.type, "export", "getProgress"), {}, { overlay: false })
				.then(function(response)
				{
					if (response.Items.length > 0)
					{
						self.documentEntities().map(function(item)
						{
							item.FileProgress(response.Items[0] + '%');
						});
					}
				});
		}, 3000);
	};

	SendEmailOfGridViewModel.prototype.LoadAttachments = function()
	{
		var self = this;

		var url = pathCombine(tf.api.apiPrefix(), "search", this.option.type, "export", "email");
		var requestOption =
		{
			data:
			{
				gridLayoutExtendedEntity: this.option.layout,
				term: tf.applicationTerm.getApplicationTermPluralByName(this.option.term),
				SelectedIds: this.option.selectedIds,
				sortItems: this.option.sortItems,
				documentType: this.option.modelType === 'SendTo' ? 'csv' : 'xls'
			}
		};

		if (this.option.type === "busfinderhistorical")
			self.option.setRequestOption(requestOption);

		return tf.promiseAjax.post(url, requestOption, { overlay: false })
			.then(function(response)
			{
				if (this.intervalID)
					clearInterval(this.intervalID);
				this.obdisabledSend(false);
				this.disabledSendInMobile('');

				if (response.StatusCode != 200)
				{
					this.documentEntities().map(function(item)
					{
						item.FileProgress('100%');
						item.DownLoadComplete(true);
						item.UploadFailed(true);
					}.bind(this));
				}
				else
				{
					if (response.Items && response.Items.length > 0)
					{
						var obj = response.Items[0];
						this.documentEntities().map(function(item)
						{
							item.FileProgress('100%');
							item.DownLoadComplete(true);
							item.UploadFailed(false);
							if (item.Filename === tf.applicationTerm.getApplicationTermPluralByName(this.option.term) + ".KML")
							{
								if (obj.Kml)
								{
									item.Guid(obj.Kml.Guid);
								}
							}
							else
							{
								if (obj.Document)
								{
									item.Guid(obj.Document.Guid);
								}
							}
						}.bind(this));
					}
				}
				return this.resetProgress();
			}.bind(this))
			.catch(function()
			{
				this.documentEntities().map(function(item)
				{
					item.FileProgress('100%');
					item.DownLoadComplete(true);
					item.UploadFailed(true);
				}.bind(this));
			}.bind(this));
	};

	SendEmailOfGridViewModel.prototype.resetProgress = function()
	{
		if (this.option.modelType === 'SendTo')
		{
			if (this.setTimeoutID)
				window.clearTimeout(this.setTimeoutID);
			return tf.promiseAjax["get"](pathCombine(tf.api.apiPrefix(), "search", this.option.type, "export", "resetProgress"), {}, { overlay: false });
		}
		return Promise.resolve(true);
	};

	SendEmailOfGridViewModel.prototype.focusField = function(viewModel, e)
	{
		$(viewModel.field).focus();
	};

	SendEmailOfGridViewModel.prototype.CcEnableClick = function()
	{
		this.obCcEnable(true);
	};

	SendEmailOfGridViewModel.prototype.BccEnableClick = function()
	{
		this.obBccEnable(true);
	};

	SendEmailOfGridViewModel.prototype.selectRecipientToClick = function(viewModel, e)
	{
		var addressList;
		var addressType = $(e.currentTarget).data('send-type');
		if (addressType === 'To')
		{
			addressList = this.obEmailToList();
		}
		else if (addressType === 'Cc')
		{
			addressList = this.obEmailCcList();
		}
		else
		{
			addressList = this.obEmailBccList();
		}
		var ids = addressList.map(function(item)
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
						$.each(addressList, function(n, item)
						{
							if (item.selectedUserId() == 0)
							{
								list.push(item);
							}
						});
						if (addressType === 'To')
						{
							this.obEmailToList(list);
						}
						else if (addressType === 'Cc')
						{
							this.obEmailCcList(list);
						}
						else
						{
							this.obEmailBccList(list);
						}
					}.bind(this));
			}.bind(this));
	};

	SendEmailOfGridViewModel.prototype.retryClick = function(viewModel, e)
	{
		viewModel.FileProgress('0%');
		viewModel.DownLoadComplete(false);
		viewModel.UploadFailed(false);
		this.intervalID = this.GetProgress();
		this.obdisabledSend(true);
		this.disabledSendInMobile('disabled');

		return tf.promiseAjax["post"](pathCombine(tf.api.apiPrefix(), "search", this.option.type, "export", "email"),
			{
				data:
				{
					gridLayoutExtendedEntity: this.option.layout,
					term: tf.applicationTerm.getApplicationTermPluralByName(this.option.term),
					SelectedIds: this.option.selectedIds,
					sortItems: this.option.sortItems,
					documentType: this.option.modelType === 'SendTo' ? 'csv' : 'xls'
				}
			}, { overlay: false })
			.then(function(response)
			{
				if (this.intervalID)
					clearInterval(this.intervalID);
				this.obdisabledSend(false);
				this.disabledSendInMobile('');

				if (response.StatusCode != 200)
				{
					viewModel.FileProgress('100%');
					viewModel.DownLoadComplete(true);
					viewModel.UploadFailed(true);
				}
				else
				{
					if (response.Items && response.Items.length > 0)
					{
						var obj = response.Items[0];
						viewModel.FileProgress('100%');
						viewModel.DownLoadComplete(true);
						viewModel.UploadFailed(false);
						if (viewModel.Filename === tf.applicationTerm.getApplicationTermPluralByName(this.option.term) + ".KML")
						{
							if (obj.kml)
							{
								viewModel.Guid(obj.kml.Guid);
							}
						}
						else
						{
							if (obj.document)
							{
								viewModel.Guid(obj.document.Guid);
							}
						}
					}
				}
				this.resetProgress();
			}.bind(this))
			.catch(function()
			{
				this.documentEntities().map(function(item)
				{
					item.FileProgress('100%');
					item.DownLoadComplete(true);
					item.UploadFailed(true);
				}.bind(this));
			}.bind(this));;
	};

	SendEmailOfGridViewModel.prototype.deleteFileClick = function(viewModel, e)
	{
		return tf.promiseAjax["delete"](pathCombine(tf.api.apiPrefix(), "search", this.option.type, "export", "email/delete"),
			{
				data: [viewModel.Guid()]
			}, { overlay: false })
			.then(function(response)
			{
				this.documentEntities.remove(
					function(item)
					{
						return item.Filename == viewModel.Filename;
					});
			}.bind(this));
	};

	SendEmailOfGridViewModel.prototype.apply = function()
	{
		return this.trysave()
			.then(function(data)
			{
				return data;
			})
			.catch(function() { });
	};

	SendEmailOfGridViewModel.prototype.trysave = function()
	{
		return this.pageLevelViewModel.saveValidate()
			.then(function(valid)
			{
				if (!valid)
				{
					if (TF.isPhoneDevice)
					{
						if (this.obEmailToList().length == 0 && this.obEmailCcList().length == 0 && this.obEmailBccList().length == 0)
						{
							var message = "At least one recipient is required.";
							tf.promiseBootbox.alert(message, "Warning");
							return Promise.reject();
						}
					}
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
						return tf.promiseBootbox.yesNo(info + " not been specified.  Are you sure you want to send?", "Confirmation Message")
							.then(function(ans)
							{
								if (!ans)
								{
									return Promise.reject();
								}
								else
								{
									return this.save();
								}
							}.bind(this));
					}
					return this.save();
				}
			}.bind(this));
	};


	SendEmailOfGridViewModel.prototype._convertDocumentEntitiesToJSON = function(documentEntities)
	{
		var result = documentEntities.map(function(doc)
		{
			return {
				Filename: doc.Filename,
				Guid: doc.Guid(),
				DatabaseId: doc.DatabaseId,
				FileProgress: doc.FileProgress(),
				DownLoadComplete: doc.DownLoadComplete(),
				UploadFailed: doc.UploadFailed()
			};
		});

		return result;
	};

	SendEmailOfGridViewModel.prototype.save = function()
	{
		return this.checkConfigure().then(function(result)
		{
			if (result)
			{
				this.obEntityDataModel().mailToList(this.obEmailToList().map(function(item)
				{
					return item.emailAddress();
				}));

				this.obEntityDataModel().mailCcList(this.obEmailCcList().map(function(item)
				{
					return item.emailAddress();
				}));

				this.obEntityDataModel().mailBccList(this.obEmailBccList().map(function(item)
				{
					return item.emailAddress();
				}));

				var sendData = this.obEntityDataModel().toData();
				if (this.option.modelType === 'SendTo')
				{
					sendData.attachments = this._convertDocumentEntitiesToJSON(this.documentEntities());
				}
				return tf.promiseAjax["post"](pathCombine(tf.api.apiPrefixWithoutDatabase(), "Emails?onlyMessage=true"),
					{
						data: sendData
					}).then(function(data)
					{
						if (data.Items[0] !== "")
						{
							tf.promiseBootbox.okRetry(
								{
									message: "An email could not be sent. Verify your SMTP Server settings. If you continue to experience issues, contact us at support@transfnder.com or 888-427-2403",
									title: "Unable to Send " + (!!this.option.selectedIds ? "" : "Test ") + "Email"
								})
								.then(function(confirm)
								{
									if (!confirm)
									{
										return this.save();
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
				tf.promiseBootbox.alert("The SMTP Server must be configured to send emails. This is not configured for your product. Contact your System Administrator to configure these settings. If you continue to experience issues, contact us at support@transfinder.com or 888-427-2403", "SMTP Server Settings Are Not Configured");
			}
		}.bind(this));
	};

	SendEmailOfGridViewModel.prototype.checkConfigure = function()
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "clientconfigs"), null, { overlay: false })
			.then(function(data)
			{
				if (data.Items && data.Items.length > 0)
				{
					if (data.Items[0].SMTPHost && data.Items[0].SMTPPort)
					{
						return true;
					}
				}
				return false;
			});
	};

	SendEmailOfGridViewModel.prototype.close = function()
	{
		return new Promise(function(resolve, reject)
		{
			if (this.obEntityDataModel() && this.obEntityDataModel().apiIsDirty())
			{
				resolve(tf.promiseBootbox.yesNo("Are you sure you want to cancel this " + (!!this.option.selectedIds ? "" : "test ") + "email?", "Confirmation Message"));
			}
			else
			{
				resolve(true);
			}
		}.bind(this));
	};

	//select recipients in mobile
	SendEmailOfGridViewModel.prototype.selectRecipients = function(e)
	{
		var addressList;
		var addressType = $(e).data('send-type');
		if (addressType === 'To')
		{
			addressList = this.obEmailToList();
			this.status("selectToRecipients");
		}
		else if (addressType === 'Cc')
		{
			addressList = this.obEmailCcList();
			this.status("selectCcRecipients");
		}
		else
		{
			addressList = this.obEmailBccList();
			this.status("selectBccRecipients");
		}
		$(".mobile-modal-content-body").scrollTop(0);
		var self = this;
		var recipients = [];
		this.recipientListSource.forEach(function(item)
		{
			item.obSelected(false);
			var selected = Enumerable.From(addressList).Any(function(email)
			{
				return email.selectedUserId() == item.Id;
			});
			item.obSelected(selected);
			recipients.push(item);
		});
		addressList.forEach(function(item)
		{
			if (item.selectedUserId() === 0)
			{
				recipients.push(
					{
						Email: item.emailAddress(),
						Id: 0,
						obSelected: ko.observable(true),
						isNew: true,
						FirstName: '',
						LastName: '',
						show: ko.observable(true)
					});
			}
		});
		this.obSearchRecipient("");
		this.obIsNewEditing(false);
		this.obNewEmail("");
		this.isNewEmailValid(true);
		this.obRecipientList(Enumerable.From(recipients).OrderByDescending("$.obSelected()").ThenByDescending("$.isNew").ThenBy("$.Email").ToArray());
	};

	SendEmailOfGridViewModel.prototype.selectRecipientsCancel = function()
	{
		if (!this.isNewEmailValid())
		{
			this.obIsNewEditing(false);
			this.obNewEmail("");
		}
		this.status("sendEmail");
	};

	SendEmailOfGridViewModel.prototype.selectRecipientsDone = function()
	{
		if (!this.obEmailDoneClickable())
		{
			return;
		}
		var addressList = this.obRecipientList().filter(function(item)
		{
			return item.obSelected();
		}).map(function(item)
		{
			return new TF.DataModel.ReportReceiptDataModel(
				{
					SelectedUserId: item.Id,
					EmailAddress: item.Email,
					UserName: item.FirstName + " " + item.LastName
				});
		});
		if (this.status() === 'selectToRecipients')
		{
			this.obEmailToList(addressList);
		}
		else if (this.status() === 'selectCcRecipients')
		{
			this.obEmailCcList(addressList);
		}
		else
		{
			this.obEmailBccList(addressList);
		}
		this.status("sendEmail");
		this._$form.data("bootstrapValidator").validate();
	};

	SendEmailOfGridViewModel.prototype.loadRecipientsForMobile = function(viewModel, e)
	{
		if (this.obRecipientList().length === 0 && TF.isPhoneDevice)
		{
			tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "search", "users"), {}, { overlay: false }).then(function(apiResponse)
			{
				apiResponse.Items = Enumerable.From(apiResponse.Items).Where("$.Email!=''").OrderBy("$.Email").ToArray();
				apiResponse.Items.forEach(function(item)
				{
					item.obSelected = ko.observable(false);
					item.isNew = false;
					item.show = ko.observable(true);
				});
				this.obRecipientList(apiResponse.Items);
				this.recipientListSource = apiResponse.Items.slice();
			}.bind(this));
		}
	};

	SendEmailOfGridViewModel.prototype.selectRecipientForMobile = function(user, e)
	{
		user.obSelected(!user.obSelected());
		this.obRecipientList(Enumerable.From(this.obRecipientList()).OrderByDescending("$.obSelected()").ThenBy("$.Email").ToArray());
	};

	SendEmailOfGridViewModel.prototype.addNewRecipientForMobile = function(user, e)
	{
		var self = this;
		self.obEmailDoneClickable(false);
		if (this.obIsNewEditing())
		{
			return;
		}
		this.obIsNewEditing(true);

		var newInput = self._$form.find(".new-input"),
			newInputError = newInput.next();
		newInputError.hide();

		function addNew()
		{
			function emailIsValid()
			{
				self.isNewEmailValid(true);
				self.obIsNewEditing(false);
				self.obNewEmail("");
				setTimeout(function()
				{
					self.obEmailDoneClickable(!self.obIsNewEditing() && self.isNewEmailValid());
				});
			}
			if (!self.obNewEmail() || !$.trim(self.obNewEmail()))
			{
				emailIsValid();
			}
			else if (!testEmail(self.obNewEmail()).valid)
			{
				var invalidList = testEmail(self.obNewEmail()).inValidList;
				newInputError.children().html("invalid email" + (invalidList.length > 1 ? "s" : "")).end().show();
				self.obIsNewEditing(false);
				self.isNewEmailValid(false);
			}
			else
			{
				var reg = /[,;]/;
				var emailList = self.obNewEmail().split(reg);
				emailList.forEach(function(mail, index)
				{
					if (mail && mail.trim() !== '')
					{
						self.obRecipientList.unshift(
							{
								Email: mail,
								Id: 0,
								obSelected: ko.observable(true),
								isNew: true,
								FirstName: '',
								LastName: '',
								show: ko.observable(true)
							});
					}
				});
				// self.obRecipientList(self.obRecipientList());
				emailIsValid();
			}
		}
		newInput.on("keydown", function(e)
		{
			newInputError.hide();
		});
		newInput.on("keyup", function(e)
		{
			if (e.keyCode === $.ui.keyCode.ENTER)
			{
				addNew();
			}
		});
		newInput.focusout(function(e)
		{
			//Safari has 'done' button on the keyboard, it's keycode is not 13.
			addNew();
		});
		newInput.focus();
		newInput.click();
		newInput.trigger("tap");
	};

	SendEmailOfGridViewModel.prototype.deleteRecipientForMobile = function(recipient)
	{
		this.obRecipientList.remove(recipient);
	};

	SendEmailOfGridViewModel.prototype.searchRecipientForMobile = function()
	{
		var self = this;
		var showCount = 0;
		this.obRecipientList().forEach(function(item)
		{
			if (!self.obSearchRecipient())
			{
				showCount++;
				item.show(true);
			}
			else if (item.Email.toLowerCase().indexOf(self.obSearchRecipient().toLowerCase()) >= 0)
			{
				showCount++;
				item.show(true);
			}
			else
			{
				item.show(false);
			}
		});
		this.obRecipientSearchResultIsEmpty(showCount === 0);
		$(".mobile-modal-content-body").scrollTop(0);
	};

	SendEmailOfGridViewModel.prototype.emptySearchRecipient = function()
	{
		this.obSearchRecipient("");
	};

	SendEmailOfGridViewModel.prototype.dispose = function()
	{
		var data = [];
		this.pageLevelViewModel.dispose();
		if (this.documentEntities)
		{
			this.documentEntities().forEach(function(item)
			{
				data.push(item.Guid());
			});
		}
		if (this.intervalID)
			clearInterval(this.intervalID);
		if (this.option.modelType === 'SendTo')
		{
			return this.resetProgress().then(function()
			{
				return tf.promiseAjax["delete"](pathCombine(tf.api.apiPrefix(), "search", this.option.type, "export", "email/delete"),
					{
						data: data
					}, { overlay: false })
					.then(function(response) { }.bind(this));
			}.bind(this));
		}
		else
		{
			return Promise.resolve(true);
		}
		//this._$form.data("bootstrapValidator").destroy();
	};

})();

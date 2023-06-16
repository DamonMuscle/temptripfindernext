(function()
{
	createNamespace("TF.Control").SendEmailOfGridViewModel = SendEmailOfGridViewModel;

	const DataTypesWithSummary = ['staff'];
	function SendEmailOfGridViewModel(options, obDisableControl)
	{
		this.options = options;
		this.status = ko.observable("sendEmail");
		this.obdisabledSend = obDisableControl;
		if (this.options.modelType === "SendTo")
		{
			this.disabledSendInMobile = ko.observable("disabled");
		}
		else
		{
			this.disabledSendInMobile = ko.observable("");
		}
		this.titleContent = ko.observable(options.modelType === "SendTo" ? "SEND TO" : "EMAIL");
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
		this.obEmails = ko.observableArray(options.emailAddress);
		this.obCcEnable = ko.observable(false);
		this.obBccEnable = ko.observable(false);

		this.obSelectEmailToList = ko.observableArray([]);
		this.obSelectEmailCcList = ko.observableArray([]);
		this.obSelectEmailBccList = ko.observableArray([]);

		const self = this;
		if (options.placeEmailTo && options.modelType === "Email")
		{
			// Click RCM -> Email in Contacts grid will reach here only.
			Promise.all(tf.urlHelper.chunk(this.options.selectedIds, 500).map(function(tempArr)
			{
				return tf.promiseAjax.get(tf.dataTypeHelper.getApiPrefix(self.getEmailRecipientType()),
					{
						paramData: {
							"@filter": `in(Id,${tempArr.join(",")})`
						}
					},
					{
						overlay: false
					}
				)
			})).then(function(data)
			{
				return data.flatMap(function(cur)
				{
					return cur.Items;
				});
			}).then(function(result)
			{
				var address = [];
				result.forEach(item =>
				{
					if (item.Email)
					{
						const name = [item.FirstName, item.LastName].filter(x => x).join(" ") || item.LoginId;
						address.push(new TF.DataModel.ScheduledReportReceiptDataModel({
							SelectedUserId: item.Id,
							EmailAddress: item.Email,
							UserName: name
						}));
					}

				});

				if (options.placeEmailTo == "Bcc")
				{
					this.obEmailBccList(address);
					this.obSelectEmailBccList(address);
					this.obBccEnable(true);
				}
				else
				{
					this.obEmailToList(address);
					this.obSelectEmailToList(address);
				}
			}.bind(this));
		}

		this.initFromEmailSource(options).then(function()
		{
			// if (options.emailAddress.indexOf(tf.storageManager.get("fromEmailAddress")) >= 0)
			// {
			// 	this.obEntityDataModel().emailAddress(tf.storageManager.get("fromEmailAddress"));
			// }
			// else
			// {
			this.obEntityDataModel().emailAddress(options.emailAddress[0]);
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
			return this.convertEmailListToString(this.obEmailToList());
		}.bind(this));
		this.obEmailCcString = ko.computed(function()
		{
			return this.convertEmailListToString(this.obEmailCcList());
		}.bind(this));
		this.obEmailBccString = ko.computed(function()
		{
			return this.convertEmailListToString(this.obEmailBccList());
		}.bind(this));
		this.documentEntities = ko.observableArray([]);
		if (this.options.modelType === "SendTo")
		{
			this.initAttachments();
		}

		this.setEmailSubject();
		this.pageLevelViewModel = new TF.PageLevel.EmailPageLevelViewModel(this);
		this.obSearchRecipient.subscribe(this.searchRecipientForMobile.bind(this));
	}

	SendEmailOfGridViewModel.prototype.convertEmailListToString = function(emailList)
	{
		var list = _.uniq((emailList || []).map(function(i)
		{
			return (i.emailAddress() || "").toLowerCase();
		}).filter(Boolean));

		if (TF.isPhoneDevice)
		{
			var emailCount = list.length;
			if (emailCount === 0)
			{
				return "";
			}
			else if (emailCount === 1)
			{
				return list[0];
			}
			else
			{
				return list[0] + " & " + (emailCount - 1) + " others";
			}
		}

		return list.join(";");
	};

	SendEmailOfGridViewModel.prototype.initAttachments = function()
	{
		this.documentEntities.push(
			{
				FileName: tf.applicationTerm.getApplicationTermPluralByName(this.options.term) + ".csv",
				DatabaseId: tf.datasourceManager.databaseId,
				DownLoadComplete: ko.observable(true),
				UploadFailed: ko.observable(false)
			});
		this.documentEntities.push(
			{
				FileName: tf.applicationTerm.getApplicationTermPluralByName(this.options.term) + ".xlsx",
				DatabaseId: tf.datasourceManager.databaseId,
				DownLoadComplete: ko.observable(true),
				UploadFailed: ko.observable(false)
			});
	};

	SendEmailOfGridViewModel.prototype.setEmailSubject = function()
	{
		if (this.options.modelType !== 'Email')
		{
			this.obEntityDataModel().emailSubject(this.options.subject);
		}
	};

	SendEmailOfGridViewModel.prototype.EmailFormatter = function(item)
	{
		return item.emailAddress();
	};

	SendEmailOfGridViewModel.prototype.initFromEmailSource = function(options)
	{
		if (options.emailAddress)
		{
			return Promise.resolve();
		}
		options.emailAddress = [];
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "clientconfigs"),
			{
				paramData:
				{
					clientId: tf.authManager.clientKey
				}
			}, { overlay: false })
			.then(function(data)
			{
				if (!!data.Items[0].EmailAddress)
				{
					options.emailAddress.push(data.Items[0].EmailAddress);
				}
			}.bind(this)).then(function()
			{
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "userprofiles?dbid=" + tf.datasourceManager.databaseId), {}, { overlay: false })
					.then(function(response)
					{
						if (!!response.Items[0].Email)
						{
							if (options.emailAddress.length <= 0 || options.emailAddress[0] !== response.Items[0].Email)
							{
								options.emailAddress.push(response.Items[0].Email);
							}
						}
					}.bind(this));
			}.bind(this)).then(function()
			{
				this.obEmails(options.emailAddress);
			}.bind(this));
	};

	function testEmail(email)
	{
		var reg = /[,;]/;
		var emailList = [];
		email.split(reg).map(function(item)
		{
			if (item.trim() != "")
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
						return self.validateEmail("To", value, $field, updateErrors);
					}
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
						return self.validateEmail("Cc", value, $field, updateErrors);
					}
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
						return self.validateEmail("Bcc", value, $field, updateErrors);
					}
				}
			}
		};

		$(el).bootstrapValidator(
			{
				excluded: [],
				live: "enabled",
				message: "This value is not valid",
				fields: validatorFields
			}).on("success.field.bv", function(e, data)
			{
				var $parent = data.element.closest(".form-group");
				$parent.removeClass("has-success");
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

		this.obdisabledSend(false);	// Allow send email after initialize (as no attachments pregeneration needed now)
	};

	SendEmailOfGridViewModel.prototype.validateEmail = function(emailType, value, $field, updateErrors)
	{
		if (TF.isPhoneDevice)
		{
			return true;
		}

		var self = this,
			obEmailList = self[String.format("obEmail{0}List", emailType)];
		if (value)
		{
			updateErrors($field, "required");
		}
		value = value.trim();

		if (!value)
		{
			obEmailList([]);
			return true;
		}

		var result = true,
			reg = /[,;]/,
			errorEmails = [],
			oldList = obEmailList(),
			emptyEmailList = obEmailList().filter(function(item) { return !self.EmailFormatter(item); }),
			newList = [];

		_.uniq(value.split(reg).map(function(i) { return i.trim(); })).forEach(function(item)
		{
			item = item.trim();
			if (!item)
			{
				return;
			}

			if (!testEmail(item).valid)
			{
				errorEmails.push(item);
				result = false;
			}

			var matched = oldList.filter(function(c)
			{
				return (self.EmailFormatter(c) || "").trim().toLowerCase() == item.trim().toLowerCase();
			})

			if (matched.length > 0)
			{
				newList = newList.concat(matched);
			}
			else
			{
				newList.push(new TF.DataModel.ScheduledReportReceiptDataModel({
					SelectedUserId: 0,
					EmailAddress: item
				}));
			}
		});

		obEmailList(newList.concat(emptyEmailList));
		if (self.shouldShowSummary())
		{
			return true;
		}
		var message = errorEmails.length == 1 ? errorEmails[0] + " is not a valid email." : errorEmails.length + " emails are invalid.";
		self._$form.find(String.format("small[data-bv-for=mail{0}List][data-bv-validator=callback]", emailType)).text(message);

		if (result)
		{
			self.pageLevelViewModel.obValidationErrorsSpecifed([]);
		}

		return result;
	};

	SendEmailOfGridViewModel.prototype.getOptionsForGeneratingAttachments = function()
	{
		var self = this,
			fileFormats = self.documentEntities().map(function(entity)
			{
				var fileNameParts = entity.FileName.split(".");
				return fileNameParts[fileNameParts.length - 1];
			}),
			requestOption =
			{
				databaseId: tf.datasourceManager.databaseId,
				dataTypeId: tf.dataTypeHelper.getId(self.options.type),
				fileFormats: fileFormats,
				data:
				{
					DocumentType: fileFormats[0],
					FilterSet: {},
					GridLayoutExtendedEntity: self.options.layout,
					SelectedIds: self.options.selectedIds,
					SortItems: self.options.sortItems,
					Term: tf.applicationTerm.getApplicationTermPluralByName(self.options.term)
				}
			};

		requestOption.data.GridLayoutExtendedEntity.GridType = self.options.type;	// Set GridType property which is checked by GridExporter

		if (self.options.type === "busfinderhistorical")
		{
			self.options.setRequestOption(requestOption);
		}
		else if (self.options.type === "form")
		{
			self.options.setRequestOption(requestOption, self.options.formId);
		}

		// return tf.promiseAjax.post(url, requestOption, { overlay: false }).then(function(response)
		// {
		// 	if (this.intervalID)
		// 		clearInterval(this.intervalID);

		// 	this.obdisabledSend(false);
		// 	this.disabledSendInMobile("");

		// 	if (response.StatusCode != 200)
		// 	{
		// 		this.documentEntities().map(function(item)
		// 		{
		// 			item.DownLoadComplete(true);
		// 			item.UploadFailed(true);
		// 		}.bind(this));
		// 	}
		// 	else
		// 	{
		// 		if (response.Items && response.Items.length > 0)
		// 		{
		// 			var obj = response.Items[0];
		// 			this.documentEntities().map(function(item)
		// 			{
		// 				item.DownLoadComplete(true);
		// 				item.UploadFailed(false);
		// 			}.bind(this));
		// 		}
		// 	}
		// 	return Promise.resolve(true);
		// }.bind(this))
		// 	.catch(function()
		// 	{
		// 		this.documentEntities().map(function(item)
		// 		{
		// 			item.DownLoadComplete(true);
		// 			item.UploadFailed(true);
		// 		}.bind(this));
		// 	}.bind(this));

		return requestOption;
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
		var self = this,
			sendType = $(e.currentTarget).data("send-type"),
			addressList = self[String.format("obEmail{0}List", sendType)],
			selectAddressList = self[String.format("obSelectEmail{0}List", sendType)];
		self.getSelectedItems(addressList()).then(function(selectedItems)
		{
			var options = self.options.modelType != "Email" ? {} : {
				type: self.getEmailRecipientType(),
				skipEmptyAndDuplicateCheck: true,
				columnSources: [
					{
						FieldName: "FirstName",
						DisplayName: "First Name",
						type: "string",
						Width: "80px"
					},
					{
						FieldName: "LastName",
						DisplayName: "Last Name",
						type: "string",
						Width: "80px"
					},
					{
						FieldName: "Email",
						DisplayName: "Email",
						type: "string",
						Width: "140px"
					}
				]
			};
			tf.modalManager.showModal(new TF.Modal.ListMoverSelectRecipientControlModalViewModel(selectedItems, options)).then(function(result)
			{
				if (!result)
				{
					return;
				}
				const emailAddressList = [];
				var list = result.map(function(item)
				{
					const name = [item.FirstName, item.LastName].filter(x => x).join(" ") || item.LoginId;
					if (!emailAddressList.includes(item.Email))
					{
						emailAddressList.push(item.Email);
					}
					return new TF.DataModel.ScheduledReportReceiptDataModel(
						{
							SelectedUserId: item.Id,
							EmailAddress: item.Email,
							UserName: name
						});
				});
				list = list.concat(addressList().filter(function(i) { return i.selectedUserId() == 0 && !emailAddressList.includes(i.emailAddress()) }));
				addressList(list);
				selectAddressList(list);
				self.pageLevelViewModel.saveValidate();
			});
		});
	};

	SendEmailOfGridViewModel.prototype.getSelectedItems = function(recipients)
	{
		var self = this;
		return self.options.modelType === "Email" ? self.getSelectedItemsForContact(recipients) : self.getSelectedItemsForSystemUser(recipients);
	};

	SendEmailOfGridViewModel.prototype.getSelectedItemsForContact = function(recipients)
	{
		var self = this,
			emails = recipients.filter(function(item)
			{
				return item.selectedUserId() === 0;
			}).map(function(item)
			{
				return (item.emailAddress() || "").trim().toLowerCase();
			}).filter(Boolean),
			ids = recipients.filter(function(item)
			{
				return item.selectedUserId() !== 0;
			}).map(function(item)
			{
				return item.selectedUserId();
			});

		emails = _.uniq(emails);

		return Promise.all([
			self.getSelectedItemsByIds(ids),
			self.getSelectedItemsByEmails(emails).then(function(v) { return v.filter(function(i) { return i.DBID == tf.datasourceManager.databaseId; }) })
		]).then(function(values)
		{
			return _.uniqBy(_.flattenDeep(values), function(i) { return i.Id; });
		});
	};

	SendEmailOfGridViewModel.prototype.getSelectedItemsForSystemUser = function(recipients)
	{
		var self = this,
			emails = recipients.map(function(item)
			{
				return (item.emailAddress() || "").trim().toLowerCase();
			}).filter(Boolean);

		return self.getSelectedItemsByEmails(emails);
	};

	SendEmailOfGridViewModel.prototype.getSelectedItemsByIds = function(ids)
	{
		var self = this;
		return !ids.length ? Promise.resolve([]) : Promise.all(tf.urlHelper.chunk(ids, 1000).map(function(emailChunk)
		{
			var filterSyntax = emailChunk.join(","),
				paramData = { "@filter": String.format("in(Id,{0})", filterSyntax) };

			return tf.promiseAjax.get(self.getRequestUrl(), { paramData: paramData }).then(function(r)
			{
				return r.Items;
			}, function()
			{
				return [];
			});
		})).then(function(values)
		{
			return _.flattenDeep(values);
		});
	};

	SendEmailOfGridViewModel.prototype.getSelectedItemsByEmails = function(emails)
	{
		var self = this;
		return !emails.length ? Promise.resolve([]) : Promise.all(tf.urlHelper.chunk(emails, 100).map(function(emailChunk)
		{
			var filterSyntax = emailChunk.join(","),
				paramData = { "@filter": String.format("in(Email,{0})", filterSyntax) };

			return tf.promiseAjax.get(self.getRequestUrl(), { paramData: paramData }).then(function(r)
			{
				return r.Items;
			}, function()
			{
				return [];
			});
		})).then(function(values)
		{
			return _.flattenDeep(values);
		});
	};

	SendEmailOfGridViewModel.prototype.retryClick = function(viewModel, e)
	{
		var self = this,
			isSendToMode = self.options.modelType === "SendTo",
			paramData;

		if (isSendToMode)
		{
			paramData = {
				databaseId: tf.datasourceManager.databaseId
			};
		}
		else
		{
			paramData = {
				databaseId: tf.datasourceManager.databaseId,
				dataTypeId: tf.dataTypeHelper.getId(self.options.type),
			};
		}

		return tf.promiseAjax["post"](pathCombine(tf.api.apiPrefixWithoutDatabase(), "emails"),
			{
				paramData: paramData,
				data: this.clientConfig,
				overlay: false
			});
		// .then(function()
		// {
		// 	this.obdisabledSend(false);
		// 	this.disabledSendInMobile("");

		// 	viewModel.DownLoadComplete(true);
		// 	viewModel.UploadFailed(false);

		// }.bind(this))
		// .catch(function()
		// {
		// 	viewModel.DownLoadComplete(true);
		// 	viewModel.UploadFailed(true);

		// 	this.documentEntities().map(function(item)
		// 	{
		// 		item.DownLoadComplete(true);
		// 		item.UploadFailed(true);
		// 	}.bind(this));
		// }.bind(this));;
	};

	SendEmailOfGridViewModel.prototype.getRequestUrl = function()
	{
		if (this.options.modelType === "SendTo")
		{
			return pathCombine(tf.api.apiPrefixWithoutDatabase(), "users");
		}
		else
		{
			return tf.dataTypeHelper.getApiPrefix(this.getEmailRecipientType());
		}


	};

	SendEmailOfGridViewModel.prototype.deleteFileClick = function(viewModel, e)
	{
		this.documentEntities.remove(
			function(item)
			{
				return item.FileName == viewModel.FileName;
			});
	};

	SendEmailOfGridViewModel.prototype.apply = function()
	{
		return this.trysave().catch(function() { });
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
								name: ($(fielddata).attr("data-bv-error-name") ? $(fielddata).attr("data-bv-error-name") : $(fielddata).closest("div.form-group").find("strong").text()),
								message: messages[i].replace("&lt;", "<").replace("&gt;", ">"),
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
						return tf.promiseBootbox.yesNo(info + " not been specified.  Are you sure you want to send this email?", "Confirmation Message")
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

	SendEmailOfGridViewModel.prototype.save = function()
	{
		var self = this,
			isSendToMode = self.options.modelType === "SendTo",
			paramData;

		if (isSendToMode)
		{
			paramData = {
				databaseId: tf.datasourceManager.databaseId
			};
		}
		else
		{
			paramData = {
				databaseId: tf.datasourceManager.databaseId,
				dataTypeId: tf.dataTypeHelper.getId(self.options.type)
			};
		}

		return self.checkConfigure().then(function(result)
		{
			if (!result)
			{
				tf.promiseBootbox.alert("The SMTP Server must be configured to send emails. This is not configured for your product. Contact your System Administrator to configure these settings. If you continue to experience issues, contact us at support@transfinder.com or 888-427-2403.", "SMTP Server Settings Are Not Configured");
			}

			var sendData = self.clientConfig;
			function handleEmail(emails)
			{
				return _.uniq(emails.map(function(i)
				{
					return (i.emailAddress() || "").trim().toLowerCase();
				}).filter(Boolean));
			}

			sendData.MailToList = handleEmail(self.obEmailToList());
			sendData.MailCcList = handleEmail(self.obEmailCcList());
			sendData.MailBccList = handleEmail(self.obEmailBccList());
			sendData.EmailMessage = self.obEntityDataModel().emailMessage();
			sendData.EmailSubject = self.obEntityDataModel().emailSubject();
			sendData.Attachments = [];
			sendData.EmailAddress = self.obEntityDataModel().emailAddress();

			const shouldShowSummary = self.shouldShowSummary();
			if (isSendToMode)
			{
				var attachOptions = self.getOptionsForGeneratingAttachments();
				sendData.DataTypeId = attachOptions.dataTypeId;
				sendData.FileFormats = attachOptions.fileFormats;
				sendData.GridLayoutAndSelectedId = attachOptions.data;
			}
			// if data type should show summary for send email
			else if (shouldShowSummary)
			{
				paramData.showSummary = true;
				const sendTypes = ['To', 'Cc', 'Bcc'];
				sendTypes.forEach(sendType =>
				{
					const senderList = self[`obSelectEmail${sendType}List`];
					const senders = senderList().map(item => 
					{
						return {
							EmailAddress: item._entityBackup.EmailAddress || '',
							SenderName: item._entityBackup.UserName,
							Key: item._entityBackup.SelectedUserId
						}
					});
					sendData[`Mail${sendType}Senders`] = senders;
				});
			}
			return tf.promiseAjax["post"](pathCombine(tf.api.apiPrefixWithoutDatabase(), "emails"),
				{
					paramData: paramData,
					data: sendData
				}).then(function(response)
				{
					if (isSendToMode)
					{
						return true;
					}

					let sendEmailResult = true;
					if (shouldShowSummary)
					{
						const summary = response && response.Items && response.Items[0];
						if (!summary)
						{
							return sendEmailResult;
						}
						let errorCount = 0;
						let errorMessages = [];
						summary.ErrorList.forEach(item =>
						{
							const senderFullNameArr = item.SenderFullName.split(',')
							senderFullNameArr.forEach(sender =>
							{
								const senderName = sender.trim();
								errorMessages.push({ senderName, errorMessage: item.ErrorMessage });
								errorCount++;
							});

						});
						errorCount = summary.ErrorCount > errorCount ? summary.ErrorCount : errorCount;
						sendEmailResult = {
							successCount: summary.SuccessCount,
							errorCount: errorCount,
							errorMessages: errorMessages.sort((last, now) => last.senderName.toLowerCase() > now.senderName.toLowerCase() ? 1 : -1).map(x => `-[${x.senderName}] (${x.errorMessage})`)
						};
					}
					return sendEmailResult;

				}).catch(function (error)
				{
					var message = "An email could not be sent. Verify your SMTP Server settings. If you continue to experience issues, contact us at support@transfinder.com or 888-427-2403.";
					if (error && error.StatusCode === 500 && error.Message && error.Message.indexOf("Your file size is too big") != -1)
					{
						message = error.Message;
					}
					
					return tf.promiseBootbox.okRetry(
						{
							message: message,
							title: "Unable to Send " + (!!self.options.selectedIds ? "" : "Test ") + "Email"
						}).then(function(confirm)
						{
							if (!confirm)
							{
								return self.save();
							}
						});
				});
		});
	};

	SendEmailOfGridViewModel.prototype.checkConfigure = function()
	{
		var self = this;

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "clientconfigs"),
			{
				paramData:
				{
					clientId: tf.authManager.clientKey
				}
			}, { overlay: false })
			.then(function(data)
			{
				if (data.Items && data.Items.length > 0)
				{
					if (data.Items[0].SMTPHost && data.Items[0].SMTPPort)
					{
						self.clientConfig = data.Items[0];
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
				resolve(tf.promiseBootbox.yesNo("Are you sure you want to cancel this " + (!!this.options.selectedIds ? "" : "test ") + "email?", "Confirmation Message"));
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
		var addressType = $(e).data("send-type");
		if (addressType === "To")
		{
			addressList = this.obEmailToList();
			this.status("selectToRecipients");
		}
		else if (addressType === "Cc")
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
						FirstName: "",
						LastName: "",
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
			return new TF.DataModel.ScheduledReportReceiptDataModel(
				{
					SelectedUserId: item.Id,
					EmailAddress: item.Email,
					UserName: item.FirstName + " " + item.LastName
				});
		});
		if (this.status() === "selectToRecipients")
		{
			this.obEmailToList(addressList);
		}
		else if (this.status() === "selectCcRecipients")
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
			tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "search", "user"), {}, { overlay: false }).then(function(apiResponse)
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
				emailList.forEach(function(mail)
				{
					if (mail && mail.trim() !== "")
					{
						self.obRecipientList.unshift(
							{
								Email: mail,
								Id: 0,
								obSelected: ko.observable(true),
								isNew: true,
								FirstName: "",
								LastName: "",
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

	SendEmailOfGridViewModel.prototype.getEmailRecipientType = function()
	{
		const self = this;
		if (self.options.type === 'student')
		{
			return 'contact'
		}
		return self.options.type;
	}

	SendEmailOfGridViewModel.prototype.shouldShowSummary = function()
	{
		const self = this;
		return DataTypesWithSummary.indexOf(self.getEmailRecipientType()) >= 0;
	}

	SendEmailOfGridViewModel.prototype.dispose = function()
	{
		this.pageLevelViewModel.dispose();
		if (this.documentEntities)
		{
			this.documentEntities.length = 0;
		}

		if (this.intervalID)
		{
			clearInterval(this.intervalID);
		}

		//this._$form.data("bootstrapValidator").destroy();

		return Promise.resolve(true);
	};

})();

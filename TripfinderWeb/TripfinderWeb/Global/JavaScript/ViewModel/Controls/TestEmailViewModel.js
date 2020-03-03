
(function()
{
	createNamespace('TF.Control').TestEmailViewModel = TestEmailViewModel;
	function TestEmailViewModel(settingsConfigurationDataModal)
	{
		this.selectRecipientToClick = this.selectRecipientToClick.bind(this);
		this.obErrorMessageDivIsShow = ko.observable(false);
		this.obValidationErrors = ko.observableArray([]);
		this.obEntityDataModel = ko.observable(settingsConfigurationDataModal);
		this.obEmailToList = ko.observableArray([]);
		this.obEmailToErrorList = ko.observableArray([]);
		this.obEmailToString = ko.computed(function()
		{
			return this.obEmailToList().map(function(item)
			{
				return this.EmailFormatter(item);
			}.bind(this)).join(";");
		}.bind(this));
		this.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
	}
	TestEmailViewModel.prototype.EmailFormatter = function(item)
	{
		return item.emailAddress();
	};
	TestEmailViewModel.prototype.initModel = function(viewModel, el)
	{
		this._$form = $(el);
		var validatorFields = {}, isValidating = false, self = this,
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
		this._$form.find("input[name='from']").focus();

		validatorFields.FromAddress = {
			trigger: "blur change",
			validators: {
				notEmpty: {
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

		validatorFields["mailToList"] =
			{
				trigger: "blur change",
				validators: {
					notEmpty: {
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
							var reg = /[,;]/;
							var emailList = value.split(reg);
							var emailRegExp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
							var oldList = this.obEmailToList();
							var newList = [];
							this.obEmailToErrorList([]);
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
									var str = item.match("<(.*?)>");
									if (str === null || item.substring(item.length - 1) != ">")
									{
										this.obEmailToErrorList.push(item);
									} else
									{
										isValid = emailRegExp.test(str[str.length - 1]);
										if (!isValid)
										{
											this.obEmailToErrorList.push(item);
										}
									}
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
										new TF.DataModel.ReportReceiptDataModel({
											SelectedUserId: 0,
											EmailAddress: item
										})
									);
								}
							}.bind(this));
							this.obEmailToList(newList);
							return {
								valid: this.obEmailToErrorList().length == 0,
								message: this.obEmailToErrorList().length == 1 ? this.obEmailToErrorList()[0] + ' is not a valid email.' :
									this.obEmailToErrorList().length + '  emails are invalid.'
							};
						}.bind(this)
					}
				}
			};

		$(el).bootstrapValidator({
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
	};

	TestEmailViewModel.prototype.focusField = function(viewModel, e)
	{
		$(viewModel.field).focus();
	};

	TestEmailViewModel.prototype.selectRecipientToClick = function(viewModel, e)
	{
		var ids = this.obEmailToList().map(function(item)
		{
			return item.selectedUserId();
		});
		var searchData = new TF.SearchParameters(null, null, null, null, null, ids, null);
		tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", "user"), {
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
						if (result === true || result.length <= 0)
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
							return new TF.DataModel.ReportReceiptDataModel({
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

						if (this._$form)
						{
							this._$form.find("input[name=mailToList]").change();
						}
					}.bind(this));
			}.bind(this));
	};

	TestEmailViewModel.prototype.apply = function()
	{
		return this.trysave()
			.then(function(data)
			{
				return data;
			})
			.catch(function()
			{

			});
	};

	TestEmailViewModel.prototype.trysave = function()
	{
		return this.pageLevelViewModel.saveValidate()
			.then(function(valid)
			{
				if (!valid)
				{
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
						validationErrors.push({ name: "mailToList", message: "At least one recipient is required ", field: $("input[name=mailToList]") });

						this.pageLevelViewModel.obErrorMessageDivIsShow(true);
						this.pageLevelViewModel.obValidationErrors(validationErrors);
						return Promise.reject();
					}

					if (this.obEntityDataModel().emailSubject() === "" || this.obEntityDataModel().emailMessage() === "" ||
						this.obEntityDataModel().emailSubject() === null || this.obEntityDataModel().emailMessage() === null)
					{
						var info = "The Subject and Message have";
						if ((this.obEntityDataModel().emailSubject() === "" || this.obEntityDataModel().emailSubject() === null)
							&& (this.obEntityDataModel().emailMessage() != "" && this.obEntityDataModel().emailMessage() != null))
						{
							info = "The Subject has";
						}
						if ((this.obEntityDataModel().emailSubject() != "" && this.obEntityDataModel().emailSubject() != null) &&
							(this.obEntityDataModel().emailMessage() === "" || this.obEntityDataModel().emailMessage() === null))
						{
							info = "The Message has";
						}
						return tf.promiseBootbox.yesNo(info + " not been specified.  Are you sure you want to Save?", "Confirmation Message")
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

	TestEmailViewModel.prototype.save = function()
	{
		this.obEntityDataModel().mailToList(this.obEmailToList().map(function(item)
		{
			return item.emailAddress();
		}));
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "emails"),
			{
				data: this.obEntityDataModel().toData()
			}).then(function(data)
			{
				return tf.promiseBootbox.alert("An email has been successfully sent. Verify that the " + this.obEmailToString() + (this.obEmailToList().length == 1 ? " has" : " have") + " received this email.", "Test Email Successfully Sent")
						.then(function()
						{
							return true;
						}.bind(this));
			}.bind(this), function(e) {
				return tf.promiseBootbox.alert("A test email could not be sent.", "Unable to Send Test Email");
			});
	};

	TestEmailViewModel.prototype.close = function()
	{
		return new Promise(function(resolve, reject)
		{
			if (this.obEntityDataModel().apiIsDirty())
			{
				resolve(tf.promiseBootbox.yesNo("Are you sure you want to cancel this test email?", "Confirmation Message"));
			} else
			{
				resolve(true);
			}
		}.bind(this));
	};

	TestEmailViewModel.prototype.dispose = function()
	{
		this.pageLevelViewModel.dispose();
	};

})();


(function()
{
	createNamespace("TF.DataEntry").BaseDataEntryViewModel = BaseDataEntryViewModel;

	function BaseDataEntryViewModel(ids, view)
	{
		this.initialize = this.initialize.bind(this);
		this.refreshClick = this.refreshClick.bind(this);
		this.leftPress = this.leftPress.bind(this);
		this.rightPress = this.rightPress.bind(this);
		this.loadRecord = this.loadRecord.bind(this);
		this._updateEntityStatusMessage = this._updateEntityStatusMessage.bind(this);
		this.newCopyClick = this.newCopyClick.bind(this);

		this.obNeedSave = ko.observable(false);
		this.obNeedSaveTemplate = ko.observable(false);
		this.obNeedSaveAndClose = ko.observable(true);

		this.onRequestClose = new TF.Events.Event();
		this.onMainDataLoaded = new TF.Events.Event();

		this.initializationFrontdesk = null;

		this._updateEntityStatusMessageHandler = null;

		this.type = view ? view.type : null;
		this.obTitle = ko.observable();
		this.obgridTitle = ko.observable();
		this.dataModelType = null;
		this.obEntityDataModel = ko.observable();
		this.obIds = ko.observableArray(ids);


		this._view = view;
		this.dataEntryTemplateName = "";
		this.obCurrentPage = ko.observable(this._view.orderID);

		this._isCopyAndNew = false;
		this.obMode = ko.observable(this._view.mode || (this._view.id ? "Edit" : "Add"));
		this.obPageTitle = ko.computed(this.pageTitleComputer, this);
		this.obIsEditMode = ko.computed(this.isEditModeComputer, this);
		this.onContentChange = new TF.Events.Event();

		//now new copy only exists when trip DE
		this.obShowNewCopy = ko.observable(false);
		this.obshowPaginator = ko.observable(true);
		obshowPrint = ko.observable(true);
		obshowDelete = ko.observable(true);
		this.obDisableControl = ko.observable(null);
		this.obUpdateStatus = ko.observable(null);
		this.obUpdateStatusUserName = ko.computed(this.updateStatusUserNameComputer, this);
		this.obLockMessage = ko.computed(this.lockMessageComputer, this);
		this.obModifiedMessage = ko.computed(this.modifiedMessageComputer, this);

		this.obLockDisableControl = ko.computed(this.lockDisableControlComputer, this);


		if (!this.pageLevelViewModel)
		{
			this.pageLevelViewModel = new TF.PageLevel.BaseDataEntryPageLevelViewModel();
		}
		if (!this.uploadDocumentHelper)
		{
			this.uploadDocumentHelper = new TF.DetailView.UploadDocumentHelper();
		}
		this.obContentDivHeight = ko.computed(this.showMessageComputer, this);
		if (this._view.document)
		{
			tf.shortCutKeys.bind("left", this.leftPress, this._view.document.routeState);
			tf.shortCutKeys.bind("right", this.rightPress, this._view.document.routeState);
		}
		this.CharacterTypeID = view.type == "student" ? ["0", "1", "2", "3", "12", "13", "14", "15"] : ["0", "1", "2", "3"];
		this.NumericTypeID = ["4", "5", "6", "7"];
		this.dateFieldsTypeID = view.type == "staff" ? ["8", "9", "10", "11", "16", "17", "18", "19"] : ["8", "9", "10", "11"];

		this.obPageNavName = ko.computed(this._pageNavComputer, this);
		this.baseDeletion = null;
		this.obShowControlPanel = ko.observable(false);

		this.obshowMap = ko.observable(true);
		this.obDeleteOpacity = ko.computed(function()
		{
			if (this.obEntityDataModel())
			{
				if (this.obEntityDataModel().id() != 0)
				{
					return "0.7";
				}
			}
			return "0.3";
		}, this);

		this.obApiIsDirty = ko.computed(function()
		{
			if (this.obEntityDataModel() && this.obEntityDataModel().apiIsDirty && this.obEntityDataModel().apiIsDirty())
			{
				return this.obEntityDataModel().apiIsDirty();
			}
			else
				return false;
		}, this);

		ko.computed(function()
		{
			var apiIsDirty = this.obApiIsDirty();
			if (!this.pageLevelViewModel.obSuccessMessageDivIsShow() || apiIsDirty)
			{
				this.pageLevelViewModel.obSuccessMessageDivIsShow(false);
			}
		}, this);

		this.getSecurities();

		//by default, when the tab close, need check change, but when deleted and close, no need to check change.
		this.checkChangeWhenClose = true;

		this.opacityCssSource = {
			enable: 'opacity-enabled',
			disable: 'opacity-disabled'
		};

		this.editable = ko.pureComputed(this.getEditable, this);
	};

	BaseDataEntryViewModel.prototype.getEditable = function()
	{
		return true;
	};

	BaseDataEntryViewModel.prototype.getSecurities = function()
	{// this might need be tuning sooner
		//--securities----------
		this.obIsAdmin = ko.observable(tf.authManager.authorizationInfo.isAdmin);

		this.obIsContractorAdd = ko.observable(false);
		if (this.obIsAdmin() || tf.authManager.isAuthorizedFor("Contractors", "add"))
		{//add button security
			this.obIsContractorAdd(true);
		}
		this.obIsContractorEdit = ko.observable(false);
		if (this.obIsAdmin() || tf.authManager.isAuthorizedFor("Contractors", "edit"))
		{//edit button security
			this.obIsContractorEdit(true);
		}

		this.obIsSchoolAdd = ko.observable(false);
		if (this.obIsAdmin() || tf.authManager.isAuthorizedFor("Schools", "add"))
		{//add button security
			this.obIsSchoolAdd(true);
		}
		this.obIsSchoolEdit = ko.observable(false);
		if (this.obIsAdmin() || tf.authManager.isAuthorizedFor("Schools", "edit"))
		{//edit button security
			this.obIsSchoolEdit(true);
		}

		this.obIsDistrictAdd = ko.observable(false);
		if (this.obIsAdmin() || tf.authManager.isAuthorizedFor("Districts", "add"))
		{//add button security
			this.obIsDistrictAdd(true);
		}
		this.obIsDistrictEdit = ko.observable(false);
		if (this.obIsAdmin() || tf.authManager.isAuthorizedFor("Districts", "edit"))
		{//edit button security
			this.obIsDistrictEdit(true);
		}

		this.obIsVehicleAdd = ko.observable(false);
		if (this.obIsAdmin() || tf.authManager.isAuthorizedFor("Vehicles", "add"))
		{//add button security
			this.obIsVehicleAdd(true);
		}
		this.obIsVehicleEdit = ko.observable(false);
		if (this.obIsAdmin() || tf.authManager.isAuthorizedFor("Vehicles", "edit"))
		{//edit button security
			this.obIsVehicleEdit(true);
		}

		this.obIsStaffAdd = ko.observable(false);
		if (this.obIsAdmin() || tf.authManager.isAuthorizedFor("Staff", "add"))
		{//add button security
			this.obIsStaffAdd(true);
		}
		this.obIsStaffEdit = ko.observable(false);
		if (this.obIsAdmin() || tf.authManager.isAuthorizedFor("Staff", "edit"))
		{//edit button security
			this.obIsStaffEdit(true);
		}

		this.obIsFilterAdd = ko.observable(false);
		if (this.obIsAdmin() || tf.authManager.isAuthorizedFor("Filters", "add"))
		{//add button security
			this.obIsFilterAdd(true);
		}
		this.obIsFilterEdit = ko.observable(false);
		if (this.obIsAdmin() || tf.authManager.isAuthorizedFor("Filters", "edit"))
		{//edit button security
			this.obIsFilterEdit(true);
		}

		this.obIsAltsiteAdd = ko.observable(false);
		if (this.obIsAdmin() || tf.authManager.isAuthorizedFor("Alternate Sites", "add"))
		{//add button security
			this.obIsAltsiteAdd(true);
		}
		this.obIsAltsiteEdit = ko.observable(false);
		if (this.obIsAdmin() || tf.authManager.isAuthorizedFor("Alternate Sites", "edit"))
		{//edit button security
			this.obIsAltsiteEdit(true);
		}
		//--end of securities----------
	}

	BaseDataEntryViewModel.prototype._pageNavComputer = function()
	{
		return (this.obCurrentPage() + 1) + ' of ' + this.obIds().length;
	};

	BaseDataEntryViewModel.prototype.newCopyClick = function(viewModel, e)
	{//this is the copy function of the data entry form, now only for trip DE

	};

	BaseDataEntryViewModel.prototype.rightPress = function(e, keyCombination)
	{
	};

	BaseDataEntryViewModel.prototype.leftPress = function(e, keyCombination)
	{
	};

	BaseDataEntryViewModel.prototype.load = function()
	{
		if (this.$form)
		{
			this.$form.find(":text,select,textarea,:checkbox,:password,:radio,:file").not(":disabled,[readonly]").eq(0).focus();
		}

		//all buttons can not focus when tab keypress
		//all drop down menu can not focus when tab keypress
		// remove the disable tabs FT-2340
		// $(this.$form.context).find("button").attr("tabindex", "-1");
		// $(this.$form.context).find("input[type=button]").attr("tabindex", "-1");
		// $(this.$form.context).find("input[data-tf-input-type=Select]").attr("tabindex", "-1");

		if (this._view && this._view.id)
		{
			this._isCopyAndNew = this._view.mode === "Add";
			tf.loadingIndicator.showImmediately();
			var getData = {
				paramData: {
					Id: this._view.id,
					"@relationships": "all",
				}
			};
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), tf.DataTypeHelper.getEndpoint(this.type)), getData)
				.then(function(response)
				{
					if (response && response.StatusCode === 404)
					{//change the api side to avoid http error, using response status 404 to identify the nonexistence.
						return Promise.reject(response);
					}

					var item = response.Items[0];
					this.obEntityDataModel(new this.dataModelType(item));


					//check school is in the obSchoolDataModels
					if (this.obEntityDataModel().school() &&
						Enumerable.From(this.obSchoolDataModels()).Where(function(s) { return s.SchoolCode === this.obEntityDataModel().school() }.bind(this)).ToArray().length === 0)
					{
						return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), tf.DataTypeHelper.getEndpoint(this.type)),
							{
								paramData:
								{
									Id: this.obEntityDataModel().id(),
									"@relationships": "School"
								}
							})
							.then(function(data)
							{
								this.obSchoolDataModels([{ SchoolCode: data.Items[0].School, Name: data.Items[0].SchoolName }]);
								tf.loadingIndicator.tryHide();
								return true;
							}.bind(this));
					}

					this.onMainDataLoaded.notify(item);
					if (this._view.mode === "Add")
					{
						this._view.id = undefined;
					}
					tf.loadingIndicator.tryHide();
					return true;
				}.bind(this))
				.catch(function(response)
				{
					this.obEntityDataModel(new this.dataModelType());
					tf.loadingIndicator.tryHide();
					if (response && response.StatusCode === 404)
					{
						this.omitCurrentRecord();
						return Promise.reject(response);
					}
				}.bind(this))
		}
		else
		{
			this.obEntityDataModel(new this.dataModelType());
			this.onMainDataLoaded.notify();
			return Promise.resolve();
		}
	};

	BaseDataEntryViewModel.prototype.initialize = function()
	{
		return this.loadSupplement()
			.then(function()
			{
				this.$form = $(".form");
				this.loadRecord();
			}.bind(this));
	};

	BaseDataEntryViewModel.prototype.loadSupplement = function()
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "userdefinedlabels" + "id=", tf.datatypehelper.getid(this.type)))
			.then(function(data)
			{
				var userDefinedColumns = this.obUserDefinedColumns();
				for (var i in data.Items[0])
				{
					userDefinedColumns[i] = data.Items[0][i];
				}
				this.obUserDefinedColumns(userDefinedColumns);
			}.bind(this));
	};

	BaseDataEntryViewModel.prototype.validationInitialize = function()
	{
		var validatorFields = {}, self = this, isValidating = false,
			updateValidationMessage = function($field)
			{
				if (!isValidating)
				{
					isValidating = true;
					self.pageLevelViewModel.saveValidate($field);
					isValidating = false;
				}
			};

		this.$form.find("input[required],textarea[required]").each(function(n, field)
		{
			var name = $(field).attr("name");
			validatorFields[name] = {
				trigger: "blur change",
				validators: {
					notEmpty: {
						message: "required"
					},
					callback: {
						message: "required",
						callback: function(value, validator, $field)
						{
							if (value == " None")
							{
								return false;
							}
							return true;
						}
					}
				}
			}
		});

		this.$form.find("div[required]").find("input").each(function(n, field)
		{
			var name = $(field).attr("name");
			validatorFields[name] = {
				trigger: "blur change",
				validators: {
					notEmpty: {
						message: "required"
					},
					callback: {
						message: "required",
						callback: function(value, validator, $field)
						{
							if (value == "None")
							{
								return false;
							}
							return true;
						}
					}
				}
			}
		});

		this.$form.find("input[data-tf-input-type=Email]").each(function(n, field)
		{
			var name = $(field).attr("name");
			if (validatorFields[name] && validatorFields[name].validators)
			{
				validatorFields[name].validators.emailAddress = {
					message: " invalid email"
				};
			}
			else
			{
				validatorFields[name] = {
					trigger: "blur change",
					validators: {
						emailAddress: {
							message: " invalid email"
						}
					}
				};
			}
		});

		this.$form.find("input[data-tf-input-type=Phone],input[data-tf-input-type=Fax]").each(function(n, field)
		{
			var name = $(field).attr("name"), type = $(field).attr("phonetype") || "phone";

			if (validatorFields[name] && validatorFields[name].validators)
			{
				validatorFields[name].validators.callback = {
					message: " invalid " + type + " number",
					callback: function(value)
					{
						return value === '' || tf.dataFormatHelper.isValidPhoneNumber(value);
					}
				};
			}
			else
			{
				validatorFields[name] = {
					trigger: "blur change",
					validators: {
						callback: {
							message: " invalid " + type + " number",
							callback: function(value)
							{
								return value === '' || tf.dataFormatHelper.isValidPhoneNumber(value);
							}
						}
					}
				}
			}
		});

		this.$form.find("input[data-tf-validation=notInFuture]").each(function(n, field)
		{
			var name = $(field).attr("name");
			validatorFields[name] = {
				trigger: "blur change",
				validators: {
					date: {
						notInFuture: true,
						format: moment.localeData()._longDateFormat.L,
						message: " must be < " + moment(new Date).format('L')
					}
				}
			}
		});

		this.$form.find("input[data-tf-input-type=Date]").each(function(n, field)
		{
			var name = $(field).attr("name");
			validatorFields[name] = {
				trigger: "blur change",
				validators: {
					date: {
						message: ' invalid date'
					}
				}
			}
		});

		this.$form.find("input[data-tf-input-type=Time]").each(function(n, field)
		{
			var name = $(field).attr("name");
			validatorFields[name] = {
				trigger: "blur change",
				validators: {
					notEmpty: {
						message: "required"
					},
					callback: {
						message: "invalid time",
						callback: function(value, validator)
						{
							if (value != "")
							{
								var m = new moment(value, 'h:m A', true);

								if (!m.isValid())
								{
									return false;
								}
							}
							return true;
						}
					}
				}
			}
		});

		this.validatorFields = this.getSpecialValidatorFields(validatorFields);

		return this.$form.bootstrapValidator({
			excluded: [':hidden', ':not(:visible)'],
			live: 'enabled',
			message: 'This value is not valid',
			fields: this.validatorFields
		})
			.on('error.validator.bv', function(e, data)
			{
				data.element
					.data('bv.messages')
					.find('.help-block[data-bv-for="' + data.field + '"]').hide()
					.filter('[data-bv-validator="' + data.validator + '"]').show();
			})
			.on('success.field.bv', function(e, data)
			{
				updateValidationMessage(data.element);
				var $parent = data.element.closest('.form-group');
				$parent.removeClass('has-success');
			});
	};

	BaseDataEntryViewModel.prototype.getSpecialValidatorFields = function(validatorFields)
	{
		return validatorFields;
	}


	BaseDataEntryViewModel.prototype.loadRecord = function()
	{
		this._disposeCheckEntityStatus();
		this.pageLevelViewModel.obErrorMessageDivIsShow(false);
		this.pageLevelViewModel.obSuccessMessageDivIsShow(false);
		this.load()
			.then(function()
			{
				this.validationInitialize();
				this.pageLevelViewModel.load(this.$form.data("bootstrapValidator"));
				this.$form.data('bootstrapValidator').resetForm();

				this._UpdateMailingAddressList();

				this._setupCheckEntityStatus();

				//bind typehead
				this.$form.delegate(".typeahead li", "mouseenter", function(e)
				{
					this.isInPopup = true;
				}.bind(this))
					.delegate(".typeahead li", "mouseleave", function(e)
					{
						this.isInPopup = false;
					}.bind(this));
			}.bind(this));
	};

	BaseDataEntryViewModel.prototype.canClose = function()
	{
		return this.tryGoAway('close');
	};

	BaseDataEntryViewModel.prototype.promiseBootbox = function(type)
	{
		switch (type)
		{
			case 'close':
				return tf.promiseBootbox.yesNo({ message: "You have unsaved changes.  Would you like to save your changes prior to closing this form?", backdrop: true, title: "Unsaved Changes", closeButton: true })
			case 'changepage':
				return tf.promiseBootbox.yesNo({ message: "You have unsaved changes.  Would you like to save your changes prior to navigating away?", backdrop: true, title: "Unsaved Changes", closeButton: true })
		}
		return Promise.resolve(true);
	}

	BaseDataEntryViewModel.prototype.canCloseExpand = function(cover)
	{
		return Promise.resolve()
			.then(function()
			{
				return cover ? this.trySave() : true
			}.bind(this));
	};

	BaseDataEntryViewModel.prototype.focusField = function(viewModel, e)
	{
		$(viewModel.field).focus();
	}

	BaseDataEntryViewModel.prototype.saveClick = function(viewModel, e)
	{
		return this.trySave().then(function(e)
		{
			if (e)
			{
				if (TF.isMobileDevice)
				{
					tf.pageManager.resizablePage.clearLeftOtherContent();
					tf.pageManager.resizablePage.refreshLeftGridKeepSelectItems();
				}
				else
				{
					tf.pageManager.resizablePage.refreshLeftGridKeepSelectItems();
					this.obMode('Edit');
				}
			}
		}.bind(this));
	};

	BaseDataEntryViewModel.prototype.saveAsTemplateClick = function(viewModel, e)
	{
		return this.trySaveTemplate();
	};

	BaseDataEntryViewModel.prototype.saveAndCloseClick = function(viewModel, e)
	{
		this.trySave()
			.then(function(e)
			{
				if (e)
				{
					if (TF.isMobileDevice)
					{
						tf.pageManager.resizablePage.clearLeftOtherContent();
						tf.pageManager.resizablePage.refreshLeftGridKeepSelectItems();
					}
					else
					{
						tf.pageManager.resizablePage.refreshLeftGridKeepSelectItems();
						tf.pageManager.resizablePage.closeRightPage();
					}
				}
			}.bind(this));
	};

	BaseDataEntryViewModel.prototype.closeClick = function(viewModel, e)
	{
		var self = this;
		if (self.obEntityDataModel().toData().APIIsDirty)
		{
			tf.promiseBootbox.yesNo({ message: "You have unsaved changes.  Would you like to save your changes prior to closing this form?", backdrop: true, title: "Unsaved Changes", closeButton: true })
				.then(function(result)
				{
					if (result === false)
					{
						if (TF.isMobileDevice) 
						{
							tf.pageManager.resizablePage.clearLeftOtherContent();
						}
						else
						{
							tf.pageManager.resizablePage.closeRightPage();
						}
					}
					else if (result === true)
					{
						self.saveAndCloseClick();
					}
				});
		} else
		{
			if (TF.isMobileDevice)
			{
				tf.pageManager.resizablePage.clearLeftOtherContent();
			}
			else
			{
				tf.pageManager.resizablePage.closeRightPage();
			}
		}

	};

	BaseDataEntryViewModel.prototype.pendingSave = function()
	{
		if (this.checkChangeWhenClose && this.obApiIsDirty)
		{
			return this.obApiIsDirty();
		}
	};

	BaseDataEntryViewModel.prototype.save = function()
	{
		const self = this,
			obEntityDataModel = self.obEntityDataModel(),
			isNew = obEntityDataModel.id() ? false : true,
			paramDatas = self.type === 'fieldtrip' ? {
				'@relationships': "FieldTripResourceGroup,FieldTripInvoice,DocumentRelationship,FieldTripEquipment"
			} : {},
			entity = self.getSaveData();

		let p = Promise.resolve(entity);

		if(isNew)
		{
			p =	tf.UDFDefinition.udfHelper.get(self.type).then(function(udfs)
			{
				entity.UserDefinedFields = entity.UserDefinedFields || [];

				udfs.forEach(udf=>
				{
					if (udf.value == null) return;

					const field = {
						Id: udf.UDFId,
						Name: udf.field,
						RecordValue: udf.value,
						errorMessages: null,
						TypeId: udf.editType.TypeId,
						DataTypeId: udf.editType.DataTypeId
					}

					if (udf.UDFType === "List")
					{
						field.AlternateKey = "SelectPickListOptionIDs";
						field.SelectPickListOptionIDs = udf.value.map(function(v) { return v.value; });
						field.RecordValue = udf.value.map(function(v) { return v.text; }).join(", ");
					}

					entity.UserDefinedFields.push(field);
					if(!paramDatas["@relationships"].endsWith(",UDF"))
					{
						paramDatas["@relationships"] += ",UDF";
					}
				})

				return entity;
			});
		}

		return p.then(function(entity)
		{
			return tf.promiseAjax[isNew ? "post" : "put"](pathCombine(tf.api.apiPrefix(), tf.DataTypeHelper.getEndpoint(self.type)),
			{
				paramData: paramDatas,
				data: [entity],
				//async:true will generate an non user interaction, which will make window.open opens a Popup
				async: false
			})
			.then(function(data)
			{
				obEntityDataModel.update(tf.measurementUnitConverter.convertToDisplay(data.Items[0], new TF.DataModel.FieldTripDataModel()));
				self._view.id = obEntityDataModel.id();
				self.onContentChange.notify();
				if (isNew)
				{
					self._view.mode = "Edit";
					var hasEditRights = tf.helpers.fieldTripAuthHelper.checkFieldTripEditable(self.obEntityDataModel() ? self.obEntityDataModel()._entityBackup : null);
					self.obMode(self._view.mode);
					self.obNeedSave(hasEditRights);
					self.obNeedSaveTemplate(hasEditRights);
					self.obNeedSaveAndClose(hasEditRights);
				}
				PubSub.publish(topicCombine(pb.DATA_CHANGE, self.type, pb.EDIT), obEntityDataModel.id());
				if (self.obDocumentGridViewModel())
				{
					self.refreshDocumentMiniGrid(obEntityDataModel.toData().Id, isNew);
				}
			})
			.catch(function(response)
			{
			});
		});
	};

	BaseDataEntryViewModel.prototype.saveTemplate = function()
	{
		var title = tf.applicationTerm.getApplicationTermSingularByName("Field Trip") + " Template",
			fieldTripEntity = this.getSaveData(true),
			fieldTripTemplateEntity = fieldTripEntity;
		fieldTripEntity.Notes = fieldTripEntity.Notes;
		tf.modalManager.showModal(new TF.Modal.AddOneFieldModalViewModel(title, this.type + "template", "Name", new TF.DataModel.FieldTripTemplatesDataModel()))
			.then(function(data)
			{
				if (!data)
				{
					return;
				}
				fieldTripTemplateEntity["FieldTripName"] = fieldTripEntity.Name;
				fieldTripTemplateEntity.Name = data;
				ga('send', 'event', 'Action', 'Template Added');
				return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), tf.DataTypeHelper.getEndpoint(this.type + "template")),
					{
						data: [fieldTripTemplateEntity],
						//async:true will generate an non user interaction, which will make window.open opens a Popup
						async: false
					})
					.then(function(data)
					{
						this.saveTemplateRelationships(fieldTripTemplateEntity, data).then(()=>
						{
							this.getTemplate(data, true);
						});
					}.bind(this))
					.catch(function(response)
					{
					}.bind(this))
			}.bind(this));
	};

	BaseDataEntryViewModel.prototype.saveTemplateRelationships = function(fieldTripTemplateEntity, data)
	{
		return Promise.resolve();
	};

	BaseDataEntryViewModel.prototype.getSaveData = function()
	{
		return this.obEntityDataModel().toData();
	}

	BaseDataEntryViewModel.prototype.tryGoAway = function(type)
	{
		return Promise.resolve()
			.then(function()
			{
				if (this.pendingSave())
				{
					return this.promiseBootbox(type)
						.then(function(result)
						{
							if (result == true)
							{
								return this.trySave();
							}
							if (result == false)
							{
								if (this.cancelSave)
								{
									return this.cancelSave();
								}
								else
								{
									return true;
								}
							}
							if (result == null)
							{
								return false;
							}
						}.bind(this));
				}
				else
				{
					if (this.cancelSave)
					{
						return this.cancelSave();
					}
					else
					{
						return true;
					}
				}
			}.bind(this))
	};

	BaseDataEntryViewModel.prototype.trySave = function()
	{
		var self = this;
		return this.pageLevelViewModel.saveValidate()
			.then(function(result)
			{
				if (result)
				{
					return this._saveStatusCheck()
						.then(function(result)
						{
							if (result)
							{
								this.sendGAEvent();
								return this.uploadDocuments().then(function(result)
								{
									self.generateDocumentRelationships(result.Items);
									return this.updateDocuments().then(function(result)
									{
										return this.save()
											.then(function()
											{
												this.pageLevelViewModel.popupSuccessMessage();
												this.onMainDataLoaded.notify(this.obEntityDataModel());
												return true;
											}.bind(this));
									}.bind(this));
								}.bind(this));
							}
						}.bind(this));
				}
				else
				{
					this.addLinkToDate();
				}
			}.bind(this))
			.catch(function(response)
			{
			}.bind(this))
	};

	BaseDataEntryViewModel.prototype.addLinkToDate = function(e)
	{
		//some form like field trip DE from need date vaidation
	}

	BaseDataEntryViewModel.prototype.trySaveTemplate = function()
	{
		return this.pageLevelViewModel.saveValidate()
			.then(function(result)
			{
				if (result)
				{
					return this._saveStatusCheck()
						.then(function(result)
						{
							if (result)
							{
								return this.saveTemplate();
							}
						}.bind(this))
				}
			}.bind(this))
			.catch(function(response)
			{
			}.bind(this))
	};

	BaseDataEntryViewModel.prototype._saveStatusCheck = function()
	{
		return this._checkEntityStatusAndSetMessage()
			.then(function()
			{
				if (this.obLockMessage())
				{
					return;
				}
				if (this.obModifiedMessage())
				{
					return tf.promiseBootbox.yesNo(String.format("This record was {0}.  Saving will store the values that you entered.  This may overwrite the changes that they made to this record.  Are you sure you want to save?", this.obModifiedMessage()))
				}
				else
				{
					return true;
				}
			}.bind(this));
	};

	BaseDataEntryViewModel.prototype._UpdateMailingAddressList = function()
	{

	}

	BaseDataEntryViewModel.prototype._setupCheckEntityStatus = function()
	{
		if (this.obIds().length > 0)
		{
			this._updateEntityStatusMessage();
		}
	};

	BaseDataEntryViewModel.prototype._disposeCheckEntityStatus = function()
	{
		clearTimeout(this._updateEntityStatusMessageHandler);
	};

	BaseDataEntryViewModel.prototype._updateEntityStatusMessage = function()
	{
	};

	BaseDataEntryViewModel.prototype._checkEntityStatusAndSetMessage = function()
	{
		if (this._view && this._view.id)
		{
			var lastUpdated = this.obEntityDataModel().lastUpdated();
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), tf.DataTypeHelper.getEndpoint(this.type)), {
				paramData: {
					id: this._view.id,
					"@fields": "LastUpdated,Id"
				}
			},
				{ overlay: false })
				.then(function(response)
				{
					if (response.Items && response.Items.length > 0)
					{
						var compareTime = lastUpdated ? new Date(lastUpdated) : new Date();
						var lastUpdatedOnServer = response.Items[0].lastUpdated ? new Date(response.Items[0].lastUpdated) : compareTime;
						if (compareTime !== lastUpdatedOnServer)
						{
							var defaultStatus = { "Id": this._view.id, "LastUpdated": null, "Status": "Modified", "User": null };
							this.obUpdateStatus(defaultStatus);
						}
						else
						{
							var defaultStatus = { "Id": 0, "LastUpdated": null, "Status": "Unchanged", "User": null };
							this.obUpdateStatus(defaultStatus);
						}
					}
					else
					{
						var defaultStatus = { "Id": 0, "LastUpdated": null, "Status": "Unchanged", "User": null };
						this.obUpdateStatus(defaultStatus);
					}
					return true;
				}.bind(this))
		}
		else
		{
			return Promise.resolve();
		}
	};

	BaseDataEntryViewModel.prototype.updateStatusUserNameComputer = function()
	{
		var name = "";
		var updateStatus = this.obUpdateStatus();
		if (updateStatus)
		{
			var userEntity = updateStatus.User;
			if (userEntity)
			{
				if (userEntity.FirstName && userEntity.LastName)
				{
					return userEntity.FirstName + " " + userEntity.LastName;
				}
				else
				{
					return userEntity.FirstName + userEntity.LastName;
				}
			}
		}
		return name;
	};

	BaseDataEntryViewModel.prototype.showMessageComputer = function()
	{
		var contentHeightCSS = "dataentry-container-init";

		return contentHeightCSS
	};

	BaseDataEntryViewModel.prototype.lockMessageComputer = function()
	{
		var message = null;
		var updateStatus = this.obUpdateStatus();
		if (updateStatus)
		{
			if (updateStatus.Status == "Locked")
			{
				message = "Locked";
				if (this.obUpdateStatusUserName())
				{
					message += " by " + this.obUpdateStatusUserName();
				}
			}
		}
		return message;
	};

	BaseDataEntryViewModel.prototype.lockDisableControlComputer = function()
	{
		var updateStatus = this.obUpdateStatus();
		if (updateStatus)
		{
			if (updateStatus.Status == "Locked")
			{
				return true;
			}
		}
		return false;
	};


	BaseDataEntryViewModel.prototype.modifiedMessageComputer = function()
	{
		var message = null;
		var updateStatus = this.obUpdateStatus();
		if (updateStatus)
		{
			if (updateStatus.Status == "Modified")
			{
				message = "Modified";
				if (this.obUpdateStatusUserName())
				{
					return message += " by " + this.obUpdateStatusUserName();
				}
				if (updateStatus.LastUpdated)
				{
					message += " " + moment(updateStatus.LastUpdated).format("L LT");
				}
			}
		}
		return message;
	};

	BaseDataEntryViewModel.prototype.focusStateChange = function()
	{
		this._setupCheckEntityStatus();
	};

	BaseDataEntryViewModel.prototype.pageTitleComputer = function()
	{
		switch (this.obMode())
		{
			case "Edit":
				return i18n.t("dataentry.common.page_title_edit", { type: this.obTitle() });
			case "Add":
				return i18n.t("dataentry.common.page_title_add", { type: this.obTitle() });
		}
	};

	BaseDataEntryViewModel.prototype.generateFunction = function(fn)
	{
		return fn.bind(this, Array.prototype.slice.call(arguments, 1));
	}

	BaseDataEntryViewModel.prototype.addNewEntity = function(parameters, viewModel, e)
	{
		var documentData = new TF.Document.DocumentData(TF.Document.DocumentData.DataEntry, { type: parameters[0], ids: [] });
		tf.documentManagerViewModel.add(documentData, TF.DocumentManagerViewModel.isOpenNewWindow(e));
	};

	BaseDataEntryViewModel.prototype.editNewEntity = function(parameters, viewModel, e)
	{
		if (parameters[1])
		{
			var documentData = new TF.Document.DocumentData(TF.Document.DocumentData.DataEntry, { type: parameters[0], ids: [parameters[1]], tabNames: [parameters[2]] });
			tf.documentManagerViewModel.add(documentData, TF.DocumentManagerViewModel.isOpenNewWindow(e));
		}
	};

	BaseDataEntryViewModel.prototype.refreshClick = function(viewModel, e)
	{
		this._checkEntityStatusAndSetMessage()
			.then(function()
			{
				if (this.obApiIsDirty() || this.obModifiedMessage())
				{
					return tf.promiseBootbox.yesNo("This record has been modified since it was last loaded or there are unsaved changes.  Refreshing will discard any unsaved changes.  Are you sure you want to refresh?", "Unsaved Changes");
				}
				else
				{
					return true;
				}
			}.bind(this))
			.then(function(result)
			{
				if (result)
				{
					this.loadSupplement()
						.then(this.loadRecord);
				}
			}.bind(this))
	};

	BaseDataEntryViewModel.prototype.omitCurrentRecord = function()
	{
		var currentPage = this.obCurrentPage();
		this.obIds.remove(this.obIds()[currentPage]);
		if (currentPage > this.obIds().length - 1)
		{
			this.obCurrentPage(currentPage - 1);
		}
		else
		{
			this.loadRecord();
		}
		if (!this.obIds().length)
		{
			tf.promiseBootbox.alert("There are no records in the underlining table.  This may be due to records being deleted by another user.")
				.then(function()
				{
					this.onRequestClose.notify();
				}.bind(this))
		}
	};

	BaseDataEntryViewModel.prototype.isEditModeComputer = function()
	{
		return this.obMode() == "Edit";
	};

	BaseDataEntryViewModel.prototype.setSelectValue = function(field, itemName, format)
	{
		return function()
		{
			var observableField = this.obEntityDataModel()[field];
			if (this[itemName] && observableField() != format(this[itemName]()))
			{
				observableField(format(this[itemName]()));
			}
		}
	};

	BaseDataEntryViewModel.prototype.setSelectText = function(source, field, textName, valueName)
	{
		var item = $.grep(source, function(d) { return d.value == this.obEntityDataModel()[field]() }.bind(this))[0];
		if (item)
		{
			if (valueName)
			{
				this[valueName](item);
			}
			this[textName](item.text);
		}
	};

	BaseDataEntryViewModel.prototype.setSelectTextComputer = function(sourceName, field, valueFormat, Textformat)
	{
		return function()
		{
			var item = Enumerable.From(this[sourceName]()).Where(function(c)
			{
				return valueFormat(c) === this.obEntityDataModel()[field]()
			}.bind(this)).ToArray()[0];
			return item ? Textformat(item) : "";
		}
	};

	BaseDataEntryViewModel.prototype.isNotSpecialEdit = function()
	{
		return true;
	};

	/**
	 * Return the specified property from an array of objects.
	 * @param {object} array The array of objects.
	 * @param {string} key The property key.
	 * @returns {void} 
	 */
	BaseDataEntryViewModel.prototype.getCollection = function(array, key)
	{
		return array.map(function(item)
		{
			return item[key];
		});
	};

	/**
	 * Send Google Analytics event.
	 * @returns {void} 
	 */
	BaseDataEntryViewModel.prototype.sendGAEvent = function()
	{
		var self = this, type = self.type, isNew = self.obEntityDataModel().id() == 0, isCreatedFromTemplate = self.obEntityDataModel().isCreatedFromTemplate(), templateName = self.obEntityDataModel().templateName();
		if (isNew && isCreatedFromTemplate)
		{
			switch (type)
			{
				case "fieldtrip":
					ga('send', 'event', 'Action', 'Field Trip Added', templateName);
					break;
				default:
					break;
			}
		}
	};

	BaseDataEntryViewModel.prototype.uploadDocuments = function()
	{
		var self = this, promiseAll = [], fieldTripDocuments = this.obDocumentGridDataSource();
		fieldTripDocuments = fieldTripDocuments.filter(function(item)
		{
			return item.NeedSave && item.Id <= 0;
		});
		if (fieldTripDocuments && fieldTripDocuments.length > 0)
		{
			fieldTripDocuments.forEach(function(document)
			{
				let uploadHelper = new TF.DetailView.UploadDocumentHelper(null, true);
				uploadHelper.initHidden();
				promiseAll.push(uploadHelper.uploadDocument(document));
			});

			return Promise.all(promiseAll).then(
				function(result)
				{
					return self.saveDocumentEntities(result);
				}
			);
		}
		else
		{
			return Promise.resolve([]);
		}
	};

	BaseDataEntryViewModel.prototype.updateDocuments = function()
	{
		var self = this;
		var fieldTripDocuments = self.obDocumentGridDataSource();
		fieldTripDocuments = fieldTripDocuments.filter(function(item)
		{
			return item.NeedSave && item.Id > 0;
		});
		if (fieldTripDocuments && fieldTripDocuments.length > 0)
		{
			var patchData = [];
			fieldTripDocuments.forEach(function(item)
			{
				patchData.push({ "id": item.Id, "op": "replace", "path": "/DocumentClassificationID", "value": item.DocumentClassificationID });
				patchData.push({ "id": item.Id, "op": "replace", "path": "/Description", "value": item.Description });
			});

			return tf.promiseAjax.patch(pathCombine(tf.api.apiPrefix(), tf.DataTypeHelper.getEndpoint("document")),
				{
					data: patchData
				})
		}
		else
		{
			return Promise.resolve([]);
		}
	};

	BaseDataEntryViewModel.prototype.saveDocumentEntities = function(documentEntities)
	{
		var self = this, newDocumentList = [];
		documentEntities.forEach(function(document)
		{
			var newDocument = new TF.DataModel.DocumentDataModel(document);
			newDocument = newDocument.toData();
			if (newDocument.Id < 0)
			{
				newDocument.Id = 0
			}
			newDocument.Name = self.getFileOnlyName(newDocument.FileName);
			newDocument.MimeType = newDocument.DocumentEntities[0].documentEntity.type;
			newDocument.DocumentEntities = [];
			newDocument.DocumentRelationshipEntities = [];
			newDocument.FileContent = null;
			newDocument.DocumentEntity = null;
			newDocument.UserDefinedFields = [];
			newDocument.DocumentRelationships = [];
			newDocumentList.push(newDocument);
		});

		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), tf.DataTypeHelper.getEndpoint("document")), {
			data: newDocumentList
		});
	};

	BaseDataEntryViewModel.prototype.getFileOnlyName = function(fullName)
	{
		var pattern = /\.{1}[a-z]{1,}$/;
		if (pattern.exec(fullName) !== null)
		{
			return (fullName.slice(0, pattern.exec(fullName).index));
		} else
		{
			return fullName;
		}
	};

	BaseDataEntryViewModel.prototype.dispose = function()
	{
		this.onContentChange.unsubscribeAll();
		this.onRequestClose.unsubscribeAll();
		this.onMainDataLoaded.unsubscribeAll();
		clearTimeout(this._updateEntityStatusMessageHandler);
	};
})();

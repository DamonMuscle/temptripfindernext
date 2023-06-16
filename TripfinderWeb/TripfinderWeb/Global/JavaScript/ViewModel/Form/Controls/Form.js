(function()
{
	const EVENT_ORIENTATION_CHANGE_MOBILE = "orientationchange.formMobile";
	const QUESTION_TYPE_SYSTEM_FIELD = "System Field";
	const CLASS_NAME_FORM_SUBTITLE = ".form-subtitle";
	const CLASS_NAME_FORM_HEADER = ".form-header";
	const CLASS_NAME_FORM_TITLE = ".form-title";
	const CLASS_NAME_LINE_CLAMP2 = "line-clamp-2";
	const CLASS_NAME_LINE_CLAMP3 = "line-clamp-3";
	createNamespace("TF.Control.Form").Form = Form;

	const SPECIFY_RECORD_TYPE_MY_RECORD = 3;
	const ALL_RECORD = 1;
	const FILTER_RECORD = 2;
	const SPECIFY_RECORD_TYPE_SPECIFIC = 4;

	function _initSpecifyOptions(options)
	{
		const gridType = tf.dataTypeHelper.getKeyById(Number(options.DataTypeId));
		let isMyRecordsFilterRequired = undefined;
		let specifyRecordOptions = {};

		if (options.GridOptions)
		{
			const gridOptions = JSON.parse(options.GridOptions);
			isMyRecordsFilterRequired = gridOptions.IsMyRecordsFilterRequired;

			if (gridOptions && gridOptions.SpecifyRecordOptions)
			{
				specifyRecordOptions = gridOptions.SpecifyRecordOptions;
			}
		}

		return TF.DetailView.UserDefinedGridHelper.initSpecifyRecordOption(gridType, specifyRecordOptions, isMyRecordsFilterRequired);
	}

	function Form(dataType, options)
	{
		const self = this;
		this.dataType = dataType;

		options = TF.DetailView.UserDefinedGridHelper.handleFilterFormData(options);

		this.options = options;
		this._specifyOptions = _initSpecifyOptions(this.options);

		this.obRecordID = ko.observable(null);
		this.isFormExpired = options.obFormExpiredAfterOpen;

		this.obRecordID.subscribe(recordId => this.toggleSystemFieldValue(recordId));
		this.getPublicTokenPromise = Promise.resolve();
		if (options.Public)
		{
			this.getPublicTokenPromise = TF.DetailView.UserDefinedGridHelper.getPublicFormTokenbyId(options.ID, true);
		}

		this.hasSections = this.options.UDGridSections && this.options.UDGridSections.length > 0;
		// For section display
		if (self.hasSections && this.options.DisplayOneSection)
		{
			this.options.UDGridSections = this.options.UDGridSections.sort((a, b) => a.Sequence - b.Sequence);
			const firstSection = this.options.UDGridSections[0];
			const lastSection = this.options.UDGridSections[this.options.UDGridSections.length - 1];
			this.currentSectionId = ko.observable(firstSection.Id);
			this.lastSectionId = ko.observable(lastSection.Id);
			this.firstSectionId = ko.observable(firstSection.Id);
			this.doOneSection = ko.observable(true);
			this.currentSectionName = ko.observable(firstSection.Name);
		}
		else
		{
			this.currentSectionId = ko.observable();
			this.lastSectionId = ko.observable();
			this.firstSectionId = ko.observable();
			this.doOneSection = ko.observable(false);
			this.currentSectionName = ko.observable(false);
		}

		this.displayOneSection = this.options.DisplayOneSection;
		this.questions = [];
		this.sections = [];
		this.searchControlTemplate = new TF.Control.SearchControlViewModel();
		this.onFormElementInit = new TF.Events.Event();
		this.elem = this.initElement();
		this.onFormElementInit.notify();
		if (self.hasSections && this.options.DisplayOneSection)
		{
			self.handleFooterForSectionGrid();
		}

		this.initUDFSystemFieldStatePromise = this.initUDFSystemFieldState().then(() =>
		{
			if (this.sections.length > 0) 
			{
				this.sections.forEach((section, index) =>
				{
					const onlyContainsSystemFields = (section.element.find(".form-question:visible").length === 0) && (section.element.find(".systemfield-question").length > 0);
					if (onlyContainsSystemFields)
					{
						section.element.find(".system-field-invalid").removeClass("hide");
					}
				});
			} else
			{
				this.resetSubmitButtonsAndWarningMessage(this.elem);
			}
			if (self.doOneSection())
			{
				ko.applyBindings(self, self.elem.find(".form-section")[0]);
			}
		});

		this.getPublicTokenPromise.then((res) =>
		{
			if (res)
			{
				tf.authManager.surveyToken = res;
			}
			this.initRecordSelectorPromise = this.initRecordSelector().then((res) =>
			{
				this.initEvents();

				this.options.isReadOnly = !this.checkModifyPermission(dataType);

				// waiting element attched to appropriate node
				setTimeout(() =>
				{
					this.attachActionOnFormHeader(this.elem);
				}, 100);
			});
		});
	}

	Form.prototype = Object.create(TF.Control.Form.Form.prototype);
	Form.prototype.constructor = Form;

	Object.defineProperty(Form.prototype, 'element',
		{
			get() { return this.elem; },
			enumerable: false,
			configurable: false
		});

	Form.prototype.initEvents = function()
	{
		const footerElement = $('.modal-footer');
		footerElement.on('click', '.form-close', () =>
		{
			this.triggerCloseForm();
		});
		footerElement.on('click', '.form-save', () =>
		{
			this._saveBtnClickEvent();
		});
		footerElement.on('click', '.form-next', () =>
		{
			this._nextBtnClickEvent();
		});
		footerElement.on('click', '.form-previous', () =>
		{
			this._previousBtnClickEvent();
		});
	}

	Form.prototype.closeForm = function()
	{
		this.elem.trigger('formClose');
		tf.authManager.surveyToken = undefined;
	}

	Form.prototype.triggerCloseForm = function()
	{
		this.elem.trigger('triggerFormClose');
	}

	Form.prototype._saveBtnClickEvent = function()
	{
		this.elem.trigger('formSave');
	}

	Form.prototype._nextBtnClickEvent = function()
	{
		const self = this;
		if (self.currentSectionId() !== self.lastSectionId())
		{
			const currentSection = self.sections.filter((s) => s.Id === self.currentSectionId());
			Promise.all([...currentSection[0].questions.map(q => q.validate())]).then(() =>
			{
				let nextIndex = 0;
				self.sections.forEach((section, index) =>
				{
					if (section.Id === self.currentSectionId())
					{
						nextIndex = index + 1;
					}
				});
				const nextSection = self.sections[nextIndex];
				self.currentSectionId(nextSection.Id);
				self.currentSectionName(nextSection.Name);
				self.resetWarningMessage(nextSection.element);
				// update the Rating Scale Matrix label width for it's in next section can not be visible
				self.questions.filter(q => q.field.questionType === "RatingScaleMatrix").forEach(q =>
				{
					q.refresh();
				})
				setTimeout(function()
				{
					$(".form-body").scrollTop(0);
				}, 10);
			}).catch(err =>
			{
				self.handleScrollLocationWhenErrorDisplay();
				tf.loadingIndicator.tryHide();
			});
		}
	}

	Form.prototype._previousBtnClickEvent = function()
	{
		const self = this;
		if (self.currentSectionId() !== self.firstSectionId())
		{
			let previousIndex = 0;
			self.sections.forEach((section, index) =>
			{
				if (section.Id === self.currentSectionId())
				{
					previousIndex = index - 1;
				}
			});
			const previousSection = self.sections[previousIndex];
			self.currentSectionId(previousSection.Id);
			self.currentSectionName(previousSection.Name);
			self.resetWarningMessage(previousSection.element);
			setTimeout(function()
			{
				$(".form-body").scrollTop(0);
			}, 10);
		}
	}


	Form.prototype.validateLocationRequired = function()
	{
		//Do not validate location required when the form is edited.
		if (this.options.udGridRecordId) 
		{
			return Promise.resolve(true);
		}
		return TF.getLocation().then(res =>
		{
			if (this.options.isLocationRequired && (res.latitude == null || res.longitude == null))
			{
				return Promise.reject('location access denied');
			}
			return Promise.resolve(true)
		});
	}

	Form.prototype.saveForm = async function()
	{
		const self = this;
		if (this.obRecordID() == null)
		{
			const aStr = this.dataType === 'altsite' ? 'an' : 'a';
			const dateType = tf.dataTypeHelper.getFormDataType(this.dataType);
			return tf.promiseBootbox.alert({
				message: `Please select ${aStr} ${dateType} first.`,
				title: `No ${dateType} Selected`
			}).then(function()
			{
				return null;
			});
		}
		else if (self.obRecordID() && self.options.OneResponsePerRecipient && !self.options.Public) 
		{
			//check private + one response + recorded first
			let udGridRecords = await tf.udgHelper.getUDGridRecordsWithRecordId(self.options.ID, self.options.DataTypeId, this.obRecordID());
			if (udGridRecords && udGridRecords.length > 0)
			{
				return tf.promiseBootbox.alert(TF.DetailView.UserDefinedGridHelper.ONE_RESPONSE_HAS_SUBMITTED, 'Warning').then(()=>
				{
					return null;
				});
			}
		}

		const filterOptions = {
			gridDataEditFilter: true
		};
		const restrictionMessageWrapper = {};
		let errorMessage = TF.DetailView.UserDefinedGridHelper.DEFAULT_CANNOT_SUBMIT_FORM_MESSAGE;
		tf.loadingIndicator.showImmediately(); //#RW-32658
		return TF.getLocation()
			.then(res =>
			{
				if (this.options.isLocationRequired && res.errorCode !== 0)
				{
					tf.loadingIndicator.tryHide();
					let errorTipMessage = "Unknown error of getting geolocation";
					switch (res.errorCode)
					{
						case GeolocationPositionError.PERMISSION_DENIED:
							errorTipMessage = "Location services must be turned on in order to submit this form.";
							break;
						case GeolocationPositionError.POSITION_UNAVAILABLE:
							errorTipMessage = "Location services must be enabled in order to submit this form.";
							break;
						case GeolocationPositionError.TIMEOUT:
							errorTipMessage = "Location getting timed out, please try to submit this form again.";
							break;
					}
					tf.promiseBootbox.alert({
						message: errorTipMessage,
						title: 'Location Service Not Available'
					});
					return Promise.reject();
				}
				else
				{
					self.coord = res;
					return Promise.resolve();
				}
			})
			.then(() => 
			{
				return tf.udgHelper.getUDGridById(self.options.ID)
					.then(udgrids =>
					{
						var availableFields = TF.DetailView.UserDefinedGridHelper.handleFilterFormData(udgrids[0]).UDGridFields.map(x => x.UDGridFieldId);
						var optionsFields = self.options.UDGridFields.map(x => x.UDGridFieldId).filter(Boolean);

						//validate if availableFields contains optionsFields
						for (var i of optionsFields)
						{
							if (availableFields.indexOf(i) === -1)
							{
								return Promise.reject("not_available");
							}
						}
						return Promise.resolve();
					});
			})
			.then(() => 
			{
				//tf.loadingIndicator.showImmediately(); #RW-32658 fix
				return tf.udgHelper.queryValidUDGridById(self.options.ID, filterOptions, restrictionMessageWrapper);
			})
			.then(validUDGrid =>
			{
				if (!validUDGrid)
				{
					if (restrictionMessageWrapper.message)
					{
						errorMessage = restrictionMessageWrapper.message;
					}
					return Promise.reject("not_available");
				}

				return Promise.resolve();
			})
			.then(() =>
			{
				return Promise.all([...this.questions.map(q => q.validate()), this.validateLocationRequired()])
			}).then(() =>
			{
				var udgRecord = {};
				this.questions.filter(q => q.field.questionType !== 'Map').forEach(q =>
				{
					//filter out attachment since multi-documents saved in sperate table
					if (q.field.questionType !== 'AttachBlock')
					{
						udgRecord[q.field.Guid] = q.value;

						// format phone
						if (q.field.questionType === 'Phone')
						{
							udgRecord[q.field.Guid] = tf.dataFormatHelper.getStandardPhoneNumberValue(q.value);
						}
					}

					if (q instanceof TF.Control.Form.SignatureBlockQuestion && q.value)
					{
						udgRecord[TF.DetailView.UserDefinedGridHelper.signedFieldListField] = udgRecord[TF.DetailView.UserDefinedGridHelper.signedFieldListField] || [];
						udgRecord[TF.DetailView.UserDefinedGridHelper.signedFieldListField].push(q.field.Guid);
					}
				});
				return new Promise(resolve =>
				{
					// attachment associated
					const attachmentQuestions = this.questions.filter(q => q.field.questionType === 'AttachBlock' && q.value);
					if (attachmentQuestions.length > 0)
					{
						const promises = attachmentQuestions.map(q =>
						{
							const attachments = q.value.map(_ =>
							{
								return {
									Id: _.documentId,
									FileContent: _.FileContentBase64,
									FileName: _.FileName,
									FileSizeKB: _.FileSizeKB,
									LastUpdated: (new Date()).toISOString(),
									Name: _.Name,
									MimeType: _.MimeType,
									DocumentClassificationID: 8, //general
									DocumentRelationships: [{ AttachedToID: this.obRecordID(), AttachedToType: tf.dataTypeHelper.getId(this.dataType), DBID: tf.datasourceManager.databaseId }]
								};
							});
							return tf.udgHelper.uploadAttachments(attachments).then(res =>
							{
								return { questionid: q.field.Guid, attachments: res }
							});
						})
						Promise.all(promises).then(res => resolve(res));
					}
					else
					{
						resolve([]);
					}
				}).then(res =>
				{
					udgRecord.DocumentUDGridRecords = [];
					if (res.length > 0)
					{
						udgRecord.DocumentUDGridRecords = res.flatMap(qa => qa.attachments.map(a =>
						{
							return {
								DBID: tf.datasourceManager.databaseId,
								UDGridField: qa.questionid,
								DocumentID: a.Id
							};
						}));
					}

					udgRecord.MapUDGridRecords = this.questions.filter(q => q.field.questionType === 'Map').map(q =>
					{
						return {
							DBID: tf.datasourceManager.databaseId,
							UDGridField: q.field.Guid,
							ShapeData: JSON.stringify(q.value)
						};
					});

					// normal
					if (self.coord.errorCode === 0)
					{
						udgRecord.latitude = self.coord.latitude;
						udgRecord.longitude = self.coord.longitude;
					}

					return Promise.resolve().then(() =>
					{
						if (!this.options.udGridRecordId)
						{
							if (!this.options.Public)
							{
								return tf.udgHelper.addUDGridRecordOfEntity(this.options, tf.dataTypeHelper.getId(this.dataType), this.obRecordID(), udgRecord);
							} else
							{
								return TF.DetailView.UserDefinedGridHelper.getNewSurvey(self.options.ID)
									.then(function(udgridSurvey)
									{
										return tf.udgHelper.addSurveyUDGridRecordOfEntity(self.options, tf.dataTypeHelper.getId(self.dataType), self.obRecordID(), udgRecord, udgridSurvey);
									});
							}
						}
						// update exsiting record
						else
						{
							udgRecord.Id = this.options.udGridRecordId;
							return tf.udgHelper.updateUDGridRecordOfEntity(this.options, udgRecord);
						}
					});
				}).then((res) =>
				{
					if (this.saved)
					{
						this.saved().then(() =>
						{
							tf.loadingIndicator.tryHide();
							this.closeForm();
						})
					}
					else
					{
						tf.loadingIndicator.tryHide();
						this.closeForm();
					}
					return res;
				}).catch(err =>
				{
					tf.loadingIndicator.tryHide();
					if (err && err.Message)
					{
						tf.promiseBootbox.alert(err.Message, 'Warning');
					}
				});
			}, rej =>
			{
				tf.loadingIndicator.tryHide();
				if (rej === 'location access denied')
				{
					tf.promiseBootbox.alert({
						message: `Location services must be enabled in order to submit this form.`,
						title: 'Location Service Not Available'
					})
				}
				else if (rej === 'not_available')
				{
					tf.promiseBootbox.alert(TF.DetailView.UserDefinedGridHelper.DEFAULT_FORM_NOT_AVAILABLE_MESSAGE, 'Not Available');
				}
				else
				{
					self.handleScrollLocationWhenErrorDisplay();
				}
			});

	}

	Form.prototype.onChange = function(e)
	{
		if (e.sender && e.sender.dataItem())
		{
			this.obRecordID(e.sender.dataItem().value);
		}
		else
		{
			this.obRecordID(null);
		}
	}

	Form.prototype.initRecordSelector = async function()
	{
		let type = this.dataType;
		let selector = 'FormRecordSelector',
			submitFormIsAllRecordType = this._specifyOptions.TypeId === ALL_RECORD && this.options.udGridRecordId;

		if (!this.options.Public &&
			this._specifyOptions.TypeId !== SPECIFY_RECORD_TYPE_SPECIFIC &&
			this._specifyOptions.TypeId !== FILTER_RECORD &&
			!submitFormIsAllRecordType)
		{
			type = type[0].toUpperCase() + type.substring(1);
			if (((tf.staffInfo.isStaff && type === 'staff') || type === 'Fieldtrip' || tf.staffInfo.isDriver || tf.staffInfo.isAide) &&
				TF.Control[`Form${type}RecordSelector`])
			{
				selector = `Form${type}RecordSelector`;
			}
		}

		const dbId = tf.datasourceManager.databaseId || this.dbId;
		await this.renderFormEntityContainer('', dbId, this.dataType, true, this._specifyOptions, selector);
	}

	Form.prototype.renderFormEntityContainer = async function(searchValue, dbId, dataType, isSearchAll, specifyOptions, selector)
	{
		const autoCompleteElem = this.elem.find(".form-entity-input");

		autoCompleteElem.keydown(function(event)
		{
			if (event.keyCode === 13)
			{
				event.stopPropagation()
			}
		});

		let onlyOneRecord = false;
		const willHideRecordSelector = specifyOptions.TypeId === SPECIFY_RECORD_TYPE_SPECIFIC && specifyOptions.SpecificRecordIds?.length === 1;
		if (!willHideRecordSelector)
		{
			//FORM-1874, show record selector any time
			this.showRecordSelector();
		}
		onlyOneRecord = await TF.DetailView.UserDefinedGridHelper.isOnlyOneRecord(searchValue, dbId, dataType, isSearchAll, specifyOptions);

		if (onlyOneRecord && this._specifyOptions.TypeId === SPECIFY_RECORD_TYPE_SPECIFIC)
		{
			this.hideRecordSelector();
		}
		else if (willHideRecordSelector)
		{
			this.showRecordSelector();
		}

		//initialize FormRecordSelector
		if (this.options.udGridRecordId)
		{
			this.recordSelector = new TF.Control[selector](autoCompleteElem, {
				dbId: tf.datasourceManager.databaseId || this.dbId,
				dataType: this.dataType,
				enable: this.options.RecordID == null,
				needOneRecordCheck: !this.options.udGridRecordId,
				canClearFilter: this.options.canClearFilter,
				valueChanged: val =>
				{
					this.obRecordID(val);
				},
				specifyOptions: this._specifyOptions,
				isPublicForm: this.options.Public
			});
			autoCompleteElem.css("width", '');
			if (this.options.isReadOnly || this.options.signatureReadonly)
			{
				autoCompleteElem.attr("disabled", 'disabled');
			}

			this.showRecordSelector();
			return Promise.resolve(true);
		}

		let enableStatus = this.options.RecordID == null;
		if (onlyOneRecord)
		{
			enableStatus = false;
		}

		this.recordSelector = new TF.Control[selector](autoCompleteElem, {
			dbId: tf.datasourceManager.databaseId || this.dbId,
			dataType: this.dataType,
			enable: enableStatus,
			needOneRecordCheck: !this.options.udGridRecordId && !this.options.uniqueClassName,
			canClearFilter: this.options.canClearFilter,
			valueChanged: val =>
			{
				this.obRecordID(val);
			},
			onlyOneRecordCallback: (oneRecord) =>
			{
				//FORM-1874
				const autoCompleteElem = $("input[name='form-entity-input']");
				if (oneRecord)
				{
					autoCompleteElem.attr("disabled", "disabled");
					autoCompleteElem.addClass("k-state-disabled");
					autoCompleteElem.parent(".k-widget").children(".k-clear-value").hide();
					const autoSearchElem = this.elem.find(".k-i-search");
					if (autoSearchElem && autoSearchElem.length > 0)
					{
						autoSearchElem.hide();
					}
				}
				else
				{
					autoCompleteElem.removeAttr("disabled");
					autoCompleteElem.removeClass("k-state-disabled");
					autoCompleteElem.parent(".k-widget").children(".k-clear-value").show();
					const autoSearchElem = this.elem.find(".k-i-search");
					if (autoSearchElem && autoSearchElem.length > 0)
					{
						autoSearchElem.show();
					}
				}
			},
			specifyOptions: this._specifyOptions,
			isPublicForm: this.options.Public
		});

		return TF.DetailView.UserDefinedGridHelper.getFormSearchData('', dbId, this.dataType, true, this._specifyOptions)
			.then((res) =>
			{
				if (onlyOneRecord && selector == "FormRecordSelector")
				{
					const config = TF.Form.formConfig[this.dataType];
					const recValue = res.Items[0], nameVal = config.formatItem(res.Items[0]).text;
					this.obRecordID(recValue.Id);
					this.recordSelector.elem.val(nameVal);
					this.disAbleFormRecordSelector();
				}

				return Promise.resolve(true);
			});
	}

	Form.prototype.showRecordSelector = function()
	{
		const $recordSelector = this.elem.find("div.form-entity-container.entity-record");
		if ($recordSelector)
		{
			$recordSelector.show();
		}
	}

	Form.prototype.hideRecordSelector = function()
	{
		const $recordSelector = this.elem.find("div.form-entity-container.entity-record");
		if ($recordSelector)
		{
			$recordSelector.hide();
		}
	}

	Form.prototype.checkModifyPermission = function(type)
	{
		return tf.authManager.isAuthorizedForDataType(type, this.options.udGridRecordId ? "edit" : "add");
	};

	Form.prototype.initElement = function()
	{
		const self = this;
		let color = this.options.color,
			dateType = tf.dataTypeHelper.getFormDataType(this.dataType),
			searchHint = dateType === "Staff" ? "Search " + dateType : "Search " + dateType + "s";

		const newButton = `<button type="button" class="form-button form-next" data-bind="visible: currentSectionId() !== lastSectionId()">
								<div class="action next">Next</div>
							</button>
							<button type="button" class="form-button form-previous" data-bind="visible: currentSectionId() !== firstSectionId()">
								<div class="action previous">Previous</div>
							</button>`;

		const sectionTitle = `<div class="form-entity-container form-section ${TF.isMobileDevice ? 'form-section-mobile-title' : 'form-section-title'}">
						<div class="form-entity-title" data-bind="html: currentSectionName">Test</div>
					</div>`;

		let elem = $(`<div class="form-container hide">
			<div class="form-layer" style="background-color:${this.convertHex(color, 0.2)}">
				<div class="form">
					<div class="form-header" style="background-color:${color}">
						<div class="form-title">${this.options.Name || ''}</div>
						<div class="form-subtitle">${this.options.Description || ''}</div>
						<div class="showmore">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="14">
								<path fill="currentColor" d="M0 7.33l2.829-2.83 9.175 9.339 9.167-9.339 2.829 2.83-11.996 12.17z"></path>
							</svg>
						</div>
					</div>
					<div class="form-body">
					${self.doOneSection() ? sectionTitle : ''}
						<div class="form-entity-container entity-record" style="display:none">
							<span class="form-entity-title">${dateType}: </span>
							<input class="form-entity-input" name="form-entity-input" placeholder="${searchHint}"></input>
						</div>
					<div class="form-base-container">
						</div>
						<div class="e-sign">
							<div class="e-sign-container">
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>`);

		if (TF.isMobileDevice)
		{
			elem = $(`<div class="form-container hide">
			<div class="form-layer" style="background-color:${this.convertHex(color, 0.2)}">
				<div class="form">
					<div class="form-body">	
						<div class="form-header" style="background-color:${color}">
							<div class="form-title">${this.options.Name || ''}</div>
							<div class="form-subtitle">${this.options.Description || ''}</div>
						</div>
							${self.doOneSection() ? sectionTitle : ''}
							<div class="form-entity-container entity-record" style="display:none">
								<span class="form-entity-title">${dateType}: </span>
								<input class="form-entity-input" name="form-entity-input" placeholder="${searchHint}"></input>
							</div>

					<div class="form-base-container">
						</div>
							<div class="e-sign">
								<div class="e-sign-container">
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>`);
		}

		/* hack default kendo behavor */
		const kendoNumericWidget = kendo.widgets.find(_ => _.name === "kendoNumericTextBox");
		if (kendoNumericWidget)
		{
			this._kendoNumericTextBox_keypress = kendoNumericWidget.widget.fn._keypress;
			kendoNumericWidget.widget.fn._keypress = () => true;
		}

		if (this.hasSections)
		{
			if (this.displayOneSection)
			{
				this.createSections(elem);
			}
			else
			{
				this.createDisplayAllSections(elem);
			}
		}
		else
		{
			elem.find('.form-base-container').append(`
				<div class="form-question-container">
							<div class="system-field-invalid warning hide">System field is not in the current data source</div>
				</div>`);
			this.createQuestions(elem.find('.form-base-container'), this.options.UDGridFields);
		}
		this._processElement(elem);

		if (TF.isMobileDevice)
		{
			$(window).off(EVENT_ORIENTATION_CHANGE_MOBILE)
				.on(EVENT_ORIENTATION_CHANGE_MOBILE, () =>
				{
					setTimeout(function()
					{

						let dialog = elem.closest('.modal-dialog');
						if (dialog.length > 0)
						{
							dialog.find('.modal-body').css("max-height", $(window).height() - 46);
							let bodyHeight = dialog.find('.modal-body').height();
							// elem.closest(".basic-quick-add").css("max-height", bodyHeight + "px");
							elem.closest(".grid-stack-container").css("min-height", bodyHeight + "px");

							let bodyHeightWithoutPadding = dialog.find('.modal-body').height();
							elem.closest(".basic-quick-add").css("min-height", bodyHeightWithoutPadding + "px");
							elem.find(".form").css("min-height", bodyHeightWithoutPadding + "px");

							setTimeout(function()
							{
								//self.checkHeaderWrapped(elem);
								let keepRotate = true;
								let toRotate = self.resetFormHeader(elem, keepRotate);
								setTimeout(function()
								{
									//self.resetFormSubTitleClamp(elem, toRotate); // for sticky header
									window.scroll(0, 1);
								}, 200);
							}, 100);
						}
					}, 400)
				});
		}

		return elem;
	}

	/* assign type record, invoked by UDGridGridStackQuickAddWrapper.prototype._updateQuickAddDetailView */
	Form.prototype.assignEntityRecord = function(record)
	{
		this.getPublicTokenPromise.then((res) =>
		{
			if (res)
			{
				tf.authManager.surveyToken = res;
			}

			this.initRecordSelectorPromise.then(() =>
			{
				const id = record && (record.RecordID || record.Id); // recordID contains value when form opened on form grid
				if (!!id)
				{
					this.obRecordID(id);
				}
				if (this.obRecordID() !== null)
				{
					if (this.recordSelector && this.recordSelector.options.enable)
					{
						this.recordSelector.autoComplete.enable(false);
						const autoSearchElem = this.elem.find(".k-i-search");
						if (autoSearchElem && autoSearchElem.length > 0)
						{
							autoSearchElem.remove();
						}
					}
					this.fetchFilterData();
				}
			});
		});
	}

	Form.prototype._processElement = function(element)
	{
		let anchors = element.find('.question-title a');
		if (anchors.length > 0)
		{
			$.each(anchors, (idx, a) =>
			{
				let $a = $(a);
				if ($a.attr('target') != '_blank')
				{
					$a.attr('target', '_blank');
				}
			});
		}
	}

	Form.prototype.initUDFSystemFieldState = function()
	{
		const getUDFOptionPromise = () =>
		{
			const systemFieldQuestions = this.questions.filter(el => el.field.FieldOptions && el.field.FieldOptions.TypeName === QUESTION_TYPE_SYSTEM_FIELD);

			if (this.udfOptionPromise === undefined)
			{
				this.udfOptionPromise = Promise.resolve(this.udfs).then(udfs => 
				{
					const udfUniqueIds = systemFieldQuestions.filter(q => q.field.FieldOptions.IsUDFSystemField).map(q => q.field.FieldOptions.DefaultText);
					if (udfs === undefined && udfUniqueIds.length > 0)
					{
						return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "userDefinedFields"),
							{ paramData: { "@Relationships": "UDFDataSources", "@fields": "DisplayName,Guid,UDFDataSources", "@filter": `eq(DataTypeId,${this.options.DataTypeId})&in(Guid,${udfUniqueIds.join(",")})` } },
							{ overlay: false })
							.then(data =>
							{
								if (data.FilteredRecordCount > 0)
								{
									this.udfs = data.Items;
									return this.udfs;
								}
							});
					}
					else
					{
						return this.udfs;
					}
				});
			}

			return this.udfOptionPromise;
		};

		return new Promise((resolve) =>
		{
			const systemFieldUDFQuestions = this.questions.filter(q => q.field.FieldOptions && q.field.FieldOptions.TypeName === QUESTION_TYPE_SYSTEM_FIELD && q.field.FieldOptions.IsUDFSystemField);
			if (systemFieldUDFQuestions.length === 0)
			{
				resolve();
			}

			systemFieldUDFQuestions.forEach(q =>
			{
				getUDFOptionPromise().then(udfs =>
				{
					let existsDbMatchedUDF = false;
					// re assign targetField with udf display name
					udfs && udfs.forEach(udf =>
					{
						if (udf.Guid === q.field.FieldOptions.DefaultText && udf.UDFDataSources.some(ds => ds.DBID === tf.datasourceManager.databaseId))
						{
							existsDbMatchedUDF = true;
						}

						if (q.field.FieldOptions.IsUDFSystemField && q.field.editType.targetField === udf.Guid)
						{
							q.field.editType.targetField = udf.DisplayName.trim();
						}
					})

					// hide question if current database does not exists in udf database source list
					if (!existsDbMatchedUDF)
					{
						q.elem.hide();
					}

					resolve();
				});
			});
		});

	}

	Form.prototype.attachActionOnFormHeader = function($element)
	{
		// make subtitle display block to calculate full height
		$element.find(CLASS_NAME_FORM_SUBTITLE).css("display", "block");
		let subtitleHeight = $element.find(CLASS_NAME_FORM_SUBTITLE).outerHeight(),
			headerInnerHeight = $element.find(CLASS_NAME_FORM_HEADER).height(),
			titleHeight = $element.find(CLASS_NAME_FORM_TITLE).outerHeight();
		/*
		 * greater than 0 means insufficient height for subtitle(form description), 
		 * need show "shore more" icon for arrow down to present full height content
		 */
		let offsetHeight = subtitleHeight - (headerInnerHeight - titleHeight);
		let self = this;
		if (!TF.isMobileDevice)
		{
			self.checkHeaderWrapped($element);
			const isRotated = $element.find(".showmore").hasClass("rotate");
			setTimeout(function()
			{
				self.resetFormSubTitleClamp($element, isRotated);
			}, 200);
		}
		if (offsetHeight > 0)
		{
			if (!TF.isMobileDevice)
			{
				$element.find(".form-subtitle").css("display", "-webkit-box");
			}
			this.elem.find(".showmore").show().on("click", ev =>
			{
				let toRotate = this.resetFormHeader($element);
				setTimeout(function()
				{
					self.resetFormSubTitleClamp($element, toRotate);
				}, 200);
			});
		}
	}

	Form.prototype.checkHeaderWrapped = function($element)
	{
		let titleEle = $element.find(CLASS_NAME_FORM_TITLE),
			titleHeight = $element.find(CLASS_NAME_FORM_TITLE).outerHeight();

		titleEle.css('white-space', 'nowrap');
		let height = titleEle.outerHeight();
		titleEle.css('white-space', 'normal');

		$element.find('.form-subtitle').removeClass(CLASS_NAME_LINE_CLAMP2);
		if (height < titleHeight)
		{
			//add mini-class to subtitle
			$element.find('.form-subtitle').addClass(CLASS_NAME_LINE_CLAMP2);
		}
	}

	Form.prototype.resetFormHeader = function($element, keepRotate)
	{
		//Recalculating height in case of orientation change
		$element.find(".form-subtitle").css("display", "block");

		let subtitleHeight = $element.find(".form-subtitle").outerHeight(),
			headerInnerHeight = $element.find(CLASS_NAME_FORM_HEADER).height(),
			headerOuterHeight = $element.find(CLASS_NAME_FORM_HEADER).outerHeight(),
			titleHeight = $element.find(CLASS_NAME_FORM_TITLE).outerHeight(),
			headerTop = $element.find(CLASS_NAME_FORM_HEADER).position().top,
			offsetHeight = subtitleHeight - (headerInnerHeight - titleHeight);

		if (isMobileDevice())
		{
			offsetHeight += 10;
		}

		const isRotated = $element.find(".showmore").hasClass("rotate");
		const toRotate = keepRotate ? isRotated : !isRotated;
		if (toRotate)
		{
			if (!isRotated)
			{
				$element.find(".showmore").addClass("rotate");
			}
			let formHeaderHeight = headerOuterHeight + offsetHeight;
			$element.find(CLASS_NAME_FORM_HEADER).outerHeight(formHeaderHeight);
			$element.find(".form-subtitle").css("display", "block");
			$element.find(".form-body").css("top", formHeaderHeight + headerTop - 15);
		}
		else
		{
			if (isRotated)
			{
				$element.find(".showmore").removeClass("rotate");
			}
			$element.find(CLASS_NAME_FORM_HEADER).css("height", "");
			$element.find(".form-subtitle").css("display", "");
			$element.find(".form-body").css("top", "");
		}

		return toRotate;
	}

	Form.prototype.resetFormSubTitleClamp = function($element, toRotate)
	{
		let rotateBtnHeight = 20;
		let lineHeight = 22;

		let $formSubtitle = $element.find(".form-subtitle");
		let displayText = $formSubtitle.css("display");
		$formSubtitle.css("display", "block");
		let formSubtitleHeight = $formSubtitle.height();

		let isLineClampDisabled = formSubtitleHeight <= lineHeight;

		if (isLineClampDisabled)
		{
			$formSubtitle.removeClass(CLASS_NAME_LINE_CLAMP2).removeClass(CLASS_NAME_LINE_CLAMP3);
			$element.find(".showmore").addClass("rotate");
			$element.find(".showmore").hide();
			return;
		}

		$formSubtitle.css("display", displayText);
		$element.find(".showmore").show();

		let headerInnerHeight = $element.find(CLASS_NAME_FORM_HEADER).height(),
			titleHeight = $element.find(CLASS_NAME_FORM_TITLE).outerHeight();

		let lineClampValue = Math.floor((headerInnerHeight - titleHeight - rotateBtnHeight) / lineHeight);
		$formSubtitle.removeClass(CLASS_NAME_LINE_CLAMP2).removeClass(CLASS_NAME_LINE_CLAMP3).addClass('line-clamp-' + lineClampValue);
	}

	Form.prototype.toggleSystemFieldValue = function(recordId)
	{
		this.initUDFSystemFieldStatePromise && this.initUDFSystemFieldStatePromise.then(() =>
		{
			let systemFieldQuestions = this.questions.filter(el => el.field.FieldOptions && el.field.FieldOptions.TypeName === QUESTION_TYPE_SYSTEM_FIELD);
			let targetColumns = systemFieldQuestions.map(el => el.field.editType.targetField);

			if (targetColumns.length == 0)
			{
				return;
			}

			if (!recordId)
			{
				systemFieldQuestions.forEach(q =>
				{
					q.setValue("");
				});
				return;
			}

			let requestDataType = this.dataType;
			if (this.dataType === "form")
			{
				requestDataType = tf.dataTypeHelper.getKeyById(this.options.DataTypeId);
			}

			tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", tf.dataTypeHelper.getEndpoint(requestDataType)),
				{
					data: {
						"fields": targetColumns, "idFilter": { "IncludeOnly": [recordId] }
					}
				},
				{ overlay: false })
				.then(data =>
				{
					if (data.FilteredRecordCount === 1)
					{
						systemFieldQuestions.forEach(q =>
						{
							const value = this.getSystemFieldValue(data.Items[0], q);
							q.setValue(value, self.udfs);
						});
					}
				});
		});
	}

	Form.prototype.getSystemFieldValue = function(data, question)
	{
		const fieldOptions = question.field.FieldOptions;
		let value = data[question.field.editType.targetField];
		value = this.convertValueByMeasurementUnit(value, question.field.editType.targetField);

		if (fieldOptions.SaveValueWithForm && this.options.udGridRecordId)
		{
			value = question.field.value;
		}

		return value;
	}

	Form.prototype.convertValueByMeasurementUnit = function(value, fieldName)
	{
		var item = {};
		item[fieldName] = value;
		var column = tf.helpers.kendoGridHelper.getGridColumnsFromDefinitionByType(this.dataType).filter(x => x.FieldName.toLowerCase() === fieldName.toLowerCase());
		if (column && column.length === 1 && column[0].UnitOfMeasureSupported)
		{
			column = column[0];
			return tf.measurementUnitConverter.handleColumnUnitOfMeasure(item, column);
		}
		return value;
	};

	Form.prototype.restoreAttachment = function(docs, docRelationships)
	{
		if (docs.length > 0 && docRelationships.length > 0)
		{
			let attachmentsOfQuestions = _.groupBy(docRelationships, "UDGridField");
			this.questions.filter(q => q.field.type === 'AttachBlock').forEach(q =>
			{
				const docRelations = attachmentsOfQuestions[q.field.Guid];
				if (docRelations)
				{
					const docsOfAttachment = docs.filter(d => docRelations.some(dr => dr.DocumentID == d.Id));
					q.restore(docsOfAttachment);
				}
			});
		}
	}

	Form.prototype.drawMapShapes = function(mapRecords)
	{
		if (mapRecords.length == 0)
		{
			return;
		}
		const intervalSeed = setInterval(() =>
		{
			if (this.questions.filter(q => q.field.type === 'Map').every(q => q.locationMarkerLayer))
			{
				clearInterval(intervalSeed);
				this.questions.filter(q => q.field.type === 'Map').forEach(q =>
				{
					const mapData = mapRecords.find(r => r.UDGridField === q.field.Guid);
					if (mapData)
					{
						q.restoreShape(JSON.parse(mapData.ShapeData));
					}
				});
			}
		}, 100);
	}

	Form.prototype.createDisplayAllSections = function(element)
	{
		const self = this;

		const sections = self.options.UDGridSections.sort((a, b) => a.Sequence - b.Sequence),
			sectionContainer = element.find('.form-base-container');
		sectionContainer.css('padding', '0px');
		sections.forEach(section =>
		{
			if (!section)
			{
				return;
			}

			var currentSectionBlock = $(`<div class="form-entity-container form-section ${tf.isFromWayfinder || isMobileDevice() ? 'form-section-mobile-title' : 'form-section-title'}">
						<div class="form-entity-title">${section.Name}</div>
					</div>
					<div class="section-block" style="padding: 20px 30px">
		<div class="form-question-container">
			<div class="system-field-invalid warning hide">System field is not in the current data source</div>
		</div>
		</div>`);
			self.createQuestions($(currentSectionBlock[2]), section.UDGridFields, section);
			section.element = currentSectionBlock;
			self.sections.push(section);
			sectionContainer.append(currentSectionBlock);
		});
	}

	Form.prototype.createSections = function(element)
	{
		const self = this;

		const sections = self.options.UDGridSections.sort((a, b) => a.Sequence - b.Sequence),
			sectionContainer = element.find('.form-base-container');

		if (sections.length === 0)
		{
			return;
		}
		sections.forEach(section =>
		{
			if (!section)
			{
				return;
			}

			var currentSectionBlock = $(`<div class="section-block" id="${section.Id}" data-bind="visible: currentSectionId() === ${section.Id}">
		<div class="form-question-container">
			<div class="system-field-invalid warning hide">System field is not in the current data source</div>
		</div>
</div>`);
			ko.applyBindings(self, currentSectionBlock[0]);
			self.createQuestions(currentSectionBlock.find('.form-question-container'), section.UDGridFields, section);
			section.element = currentSectionBlock;
			self.sections.push(section);
			sectionContainer.append(currentSectionBlock);
		});
	}

	Form.prototype.createQuestions = function(element, newFields, currentSection)
	{
		let fields = newFields.sort((a, b) => a.Index - b.Index),
			questionContainer = element;

		if (currentSection && !currentSection.questions)
		{
			currentSection.questions = [];
		}

		if (fields.length == 0)
		{
			return;
		}
		fields.forEach(field =>
		{
			if (!field)
			{
				return;
			}
			let questionControl = new TF.Control.Form[field.questionType + 'Question'](field, this.options.DataTypeId, this.onFormElementInit);
			this.questions.push(questionControl);
			if (currentSection)
			{
				currentSection.questions.push(questionControl);
			}
			questionContainer.append(questionControl.element);
		});

	}

	Form.prototype.convertHex = function(hex, opacity)
	{
		hex = hex.replace('#', '');
		r = parseInt(hex.substring(0, 2), 16);
		g = parseInt(hex.substring(2, 4), 16);
		b = parseInt(hex.substring(4, 6), 16);
		result = 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';
		return result;
	}

	Form.prototype.resetSubmitButtonsAndWarningMessage = function(element)
	{
		let onlyContainsSystemFields = (element.find(".form-question:visible").length === 0) && (element.find(".systemfield-question").length > 0);
		if (onlyContainsSystemFields)
		{
			element.find(".system-field-invalid").removeClass("hide");
		}

		if (onlyContainsSystemFields)
		{
			this.handleFooterForReadOnly(element);
		}
	}

	Form.prototype.isFormsResultsReadOnly = function()
	{
		return !this.options.udGridRecordId ? !tf.authManager.isAuthorizedFor("formsResults", "add") :
			!tf.authManager.isAuthorizedFor("formsResults", "edit");
	}

	Form.prototype.resetWarningMessage = function(element)
	{
		const onlyContainsSystemFields = (element.find(".form-question:visible").length === 0) && (element.find(".systemfield-question").length > 0);
		element.find(".system-field-invalid").toggleClass("hide", !onlyContainsSystemFields);
	}

	Form.prototype.handleScrollLocationWhenErrorDisplay = function()
	{
		const self = this;
		const errorElems = self.elem.find(".invalid");
		if (errorElems && errorElems.length > 0)
		{
			const errorElem = errorElems[0];
			const top = errorElem.offsetTop;
			const shouldScrollTop = top > 30 ? top - 30 : 0;
			self.elem.find(".form-body").scroll();
			self.elem.find(".form-body").animate({
				scrollTop: shouldScrollTop
			}, 1000);
		}
	};

	Form.prototype.fetchFilterData = function()
	{
		let config = TF.Form.formConfig[this.dataType];
		let opts = {
			paramData: {
				take: 10,
				//skip: 0,
				getCount: true
			},
			data: {
				fields: config.fields,
				sortItems: null,
				filterSet: null,
				idFilter: { IncludeOnly: [this.obRecordID()] },
				isQuickSearch: false,
				filterClause: ""
			}
		};
		tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", tf.dataTypeHelper.getEndpoint(this.dataType)),
			opts,
			{ overlay: false })
			.then(data =>
			{
				let text = config.formatItem(data.Items[0]).text;
				this.recordSelector.elem.val(text);
				this.disAbleFormRecordSelector();
			});
	}

	Form.prototype.disAbleFormRecordSelector = function()
	{
		this.recordSelector.autoComplete.enable(false);
		const autoSearchElem = this.elem.find(".k-i-search");
		if (autoSearchElem && autoSearchElem.length > 0)
		{
			autoSearchElem.remove();
		}
	};

	Form.prototype.handleFooterForReadOnly = function(element)
	{
		let $modal = element.closest(".modal-dialog")
		let $positiveBtn = $modal.find(".btn.positive");
		if ($positiveBtn && $positiveBtn.length)
		{
			$positiveBtn.remove();
		}

		let $negativeBtn = $modal.find(".btn.negative");
		if ($negativeBtn && $negativeBtn.length)
		{
			$negativeBtn.removeClass("btn-link").addClass("tf-btn-black");
			$negativeBtn.find("p").text("Close");
		}
	};

	Form.prototype.handleFooterForSectionGrid = function()
	{
		const self = this;
		const $footerModel = $('.modal-footer');
		const formsResultsReadOnly = self.isFormsResultsReadOnly();
		if ($footerModel.length > 0)
		{
			const currentIsReadOnly = self.options.isReadOnly || self.options.signatureReadonly || formsResultsReadOnly;
			self.removeAllChildNodes($footerModel[0]);
			let newFooter = `<div class="action-bar">
							<button type="button" data-bind="visible: currentSectionId() === lastSectionId()"
							class="form-button btn tf-btn-black btn-sm form-save${self.isFormExpired() ? ' disabled' : ''}"${self.isFormExpired() ? ' disabled' : ''}>
								<div class="action submit">Submit</div>
							</button>
							<button type="button" class="form-button btn tf-btn-black btn-sm form-next" data-bind="visible: currentSectionId() !== lastSectionId()">
								<div class="action next">Next</div>
							</button>
							<button type="button" class="form-button btn btn-link btn-sm form-previous" data-bind="visible: currentSectionId() !== firstSectionId()">
								<div class="action previous">Previous</div>
							</button>
							<button type="button" class="form-button btn btn-link btn-sm form-close">
								<div class="action cancel">Cancel</div>
							</button>
						</div>`;
			if (currentIsReadOnly)
			{
				newFooter = `<div class="action-bar">
							<button type="button" class="form-button btn tf-btn-black btn-sm positive form-close">
								<div class="action cancel">Close</div>
							</button>
							<button type="button" class="form-button btn tf-btn-black btn-sm form-next" data-bind="visible: currentSectionId() !== lastSectionId()">
								<div class="action next">Next</div>
							</button>
							<button type="button" class="form-button btn btn-link btn-sm form-previous" data-bind="visible: currentSectionId() !== firstSectionId()">
								<div class="action previous">Previous</div>
							</button>
						</div>`;
			}
			const newFooterEntity = $(newFooter);
			ko.applyBindings(self, newFooterEntity[0])
			$footerModel.append(newFooterEntity[0]);
		}
	};

	Form.prototype.removeAllChildNodes = function(parent)
	{
		while (parent.firstChild)
		{
			parent.removeChild(parent.firstChild);
		}
	};

	Form.prototype.dispose = function()
	{
		this.questions.forEach(q => q.dispose());
		this.elem.off('click');
		this.elem.remove();
		["from_kendo-control", "form_timepicker", "form_rating"].forEach(el => document.getElementById(el) && document.getElementById(el).remove());
		tf.authManager.surveyToken = undefined;
		const kendoNumericWidget = kendo.widgets.find(_ => _.name === "kendoNumericTextBox");
		if (kendoNumericWidget && this._kendoNumericTextBox_keypress)
		{
			kendoNumericWidget.widget.fn._keypress = this._kendoNumericTextBox_keypress;
		}
	}

	function _isSubmitAvailable(udgrids, options)
	{
		const msgText = TF.DetailView.UserDefinedGridHelper.DEFAULT_FORM_NOT_AVAILABLE_MESSAGE;
		const msgTitle = 'Not Available';

		var availableFields = TF.DetailView.UserDefinedGridHelper.handleFilterFormData(udgrids[0]).UDGridFields.map(x => x.UDGridFieldId);
		var optionsFields = options.UDGridFields.map(x => x.UDGridFieldId);

		//validate if availableFields contains optionsFields
		for (var i of optionsFields)
		{
			if (availableFields.indexOf(i) === -1)
			{
				tf.promiseBootbox.alert(mstText, msgTitle);
				return Promise.reject();
			}
		}

		return Promise.resolve()
			.then(() =>
			{
				return udgrids.length === 0 ? Promise.reject() : Promise.resolve();
			})
			.then(() =>
			{
				const isFormExpired = TF.DetailView.UserDefinedGridHelper.isExpiredForm(udgrids[0]);
				return isFormExpired ? Promise.reject() : Promise.resolve();
			})
			.then(() =>
			{
				return tf.udgHelper.checkUDGridsInIPBoundary(formId).then(res =>
				{
					const isWithInIPBoundary = !(res && res.Items && res.Items.length === 0);
					return isWithInIPBoundary ? Promise.resolve() : Promise.reject();
				})
			})
			.then(() =>
			{
				return Promise.resolve(tf.udgHelper.checkUDGridsInGeofense(this.coord, udgrids[0].GeofenceBoundaries)).then(res =>
				{
					const isWithInGeofense = res;
					return isWithInGeofense ? Promise.resolve() : Promise.reject();
				});
			})
			.catch(() =>
			{
				tf.promiseBootbox.alert(msgText, msgTitle);
				return Promise.reject();
			});
	}
})();

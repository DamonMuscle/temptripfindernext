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
	function Form(dataType, options)
	{
		this.dataType = dataType;
		this.options = options;
		this.obRecordID = ko.observable(null);
		this.obRecordID.subscribe(recordId => this.toggleSystemFieldValue(recordId));
		this.questions = [];
		this.searchControlTemplate = new TF.Control.SearchControlViewModel();
		this.onFormElementInit = new TF.Events.Event();
		this.elem = this.initElement();
		this.onFormElementInit.notify();
		this.initUDFSystemFieldStatePromise = this.initUDFSystemFieldState().then(() =>
		{
			this.resetSubmitButtonsAndWarningMessage(this.elem);
		});
		this.initRecordSelector();
		this.initEvents();

		if (!this.checkModifyPermission(dataType))
		{
			this.options.isReadOnly = true;
		}

		// waiting element attched to appropriate node
		setTimeout(() =>
		{
			this.attachActionOnFormHeader(this.elem);
		}, 100);
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
		this.elem.on('click', '.form-close', () =>
		{
			const hasValue = this.questions.some(question => question.hasValue()),
				hasAttachments = this.attachBlock && this.attachBlock.formDocuments.length > 0;
			if (hasValue || hasAttachments)
			{
				tf.promiseBootbox.yesNo("Are you sure you want to cancel?", "Unsaved Changes")
					.then(result =>
					{
						if (result)
						{
							this.closeForm();
						}
					});
			}
			else
			{
				this.closeForm();
			}
		});
		this.elem.on('click', '.form-save', () =>
		{
			this.saveForm();
		});
	}

	Form.prototype.closeForm = function()
	{
		this.elem.trigger('formClose');
		$(window).off(EVENT_ORIENTATION_CHANGE_MOBILE);
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

	Form.prototype.wrapQuestionAnswer = function()
	{
		const udgRecord = {};
		this.questions.filter(q => q.field.questionType !== 'Map').forEach(q =>
		{
			//filter out attachment since multi-documents saved in sperate table
			if (q.constructor.name !== 'AttachBlock')
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

		return udgRecord;
	}

	Form.prototype.tryObtainLocation = function()
	{
		return TF.getLocation().then(locationRes =>
		{
			if (this.options.isLocationRequired && locationRes.errorCode !== 0)
			{
				tf.loadingIndicator.tryHide();
				let errorTipMessage = "Unknown error of getting geolocation";
				switch (locationRes.errorCode)
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
				return Promise.resolve({
					latitude: locationRes.latitude,
					longitude: locationRes.longitude
				});
			}
		});
	}

	Form.prototype.tranlateAnswer = function(udgRecord)
	{
		return Promise.resolve().then(() =>
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
				return Promise.all(promises);
			}
			else
			{
				return Promise.resolve([]);
			}
		}).then(docs =>
		{
			udgRecord.DocumentUDGridRecords = [];
			if (docs.length > 0)
			{
				udgRecord.DocumentUDGridRecords = docs.flatMap(qa => qa.attachments.map(a =>
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
		});
	}

	Form.prototype.saveForm = function()
	{
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
		return Promise.all([...this.questions.map(q => q.validate())])
			.then(() =>
			{
				return this.validateLocationRequired().then(resolve =>
				{
					return Promise.resolve();
				}, rej =>
				{
					if (rej === 'location access denied')
					{
						tf.promiseBootbox.alert({
							message: `Location services must be enabled in order to submit this form.`,
							title: 'Location Service Not Available'
						})
					}
					return Promise.reject();
				})
			})
			.then(() =>
			{
				const udgRecord = this.wrapQuestionAnswer();
				tf.loadingIndicator.showImmediately();
				return this.tranlateAnswer(udgRecord).then(() =>
				{
					return Promise.resolve(this.tryObtainLocation())
						.then(coord =>
						{
							udgRecord.latitude = coord.latitude;
							udgRecord.longitude = coord.longitude;
							// save new record
							if (!this.options.udGridRecordId)
							{
								return tf.udgHelper.addUDGridRecordOfEntity(this.options, tf.dataTypeHelper.getId(this.dataType), this.obRecordID(), udgRecord);
							}
							// update exsiting record
							else
							{
								udgRecord.Id = this.options.udGridRecordId;
								return tf.udgHelper.updateUDGridRecordOfEntity(this.options, udgRecord);
							}
						});
				}).then(res =>
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
				});
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

	Form.prototype.initRecordSelector = function()
	{
		const autoCompleteElem = this.elem.find(".form-entity-input");
		let type = this.dataType, selector = 'FormRecordSelector';

		type = type[0].toUpperCase() + type.substring(1);
		/**
		if (((tf.staffInfo.isStaff && type === 'staff') || type === 'Fieldtrip' || tf.staffInfo.isDriver || tf.staffInfo.isAide) &&
			TF.Control[`Form${type}RecordSelector`]) {
			selector = `Form${type}RecordSelector`;
		}*/
		if (type === 'Fieldtrip' &&
			TF.Control[`Form${type}RecordSelector`])
		{
			selector = `Form${type}RecordSelector`;
		}
		//initialize FormRecordSelector
		this.recordSelector = new TF.Control[selector](autoCompleteElem, {
			dataType: this.dataType,
			enable: this.options.RecordID == null,
			canClearFilter: this.options.canClearFilter,
			valueChanged: val =>
			{
				this.obRecordID(val);
			}
		});
		autoCompleteElem.css("width", '');
		if (this.options.isReadOnly || this.options.signatureReadonly)
		{
			autoCompleteElem.attr("disabled", 'disabled');
		}
		autoCompleteElem.keydown(function(event)
		{
			if (event.keyCode === 13)
			{
				event.stopPropagation()
			}
		});
	}

	Form.prototype.checkModifyPermission = function(type)
	{
		return tf.authManager.isAuthorizedForDataType(type, ["edit"]);
	};

	Form.prototype.initElement = function()
	{
		const color = this.options.color,
			dateType = tf.dataTypeHelper.getFormDataType(this.dataType),
			searchHint = dateType === "Staff" ? "Search " + dateType : `Search ${dateType}s`;

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
						<div class="form-entity-container">
							<span class="form-entity-title">${dateType}: </span>
							<input class="form-entity-input" name="form-entity-input" placeholder="${searchHint}"></input>
						</div>
						<div class="form-question-container">
							<div class="system-field-invalid warning hide">System field is not in the current data source</div>
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
					
						<div class="form-entity-container">
							<span class="form-entity-title">${dateType}: </span>
							<input class="form-entity-input" name="form-entity-input" placeholder="${searchHint}"></input>
						</div>
						<div class="form-question-container">
							<div class="system-field-invalid warning hide">System field is not in the current data source</div>
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

		this.createQuestions(elem);
		this._processElement(elem);

		const self = this;
		if (TF.isMobileDevice)
		{
			$(window).off(EVENT_ORIENTATION_CHANGE_MOBILE)
				.on(EVENT_ORIENTATION_CHANGE_MOBILE, () =>
				{
					setTimeout(function()
					{

						const classNameModalBody = ".modal-body";
						const cssNameMinHeight = "min-height";
						const dialog = elem.closest('.modal-dialog');
						if (dialog.length > 0)
						{
							dialog.find(classNameModalBody).css(cssNameMinHeight, $(window).height() - 46);
							const bodyHeight = dialog.find(classNameModalBody).height();
							elem.closest(".grid-stack-container").css(cssNameMinHeight, bodyHeight + "px");

							const bodyHeightWithoutPadding = dialog.find(classNameModalBody).height();
							elem.closest(".basic-quick-add").css(cssNameMinHeight, bodyHeightWithoutPadding + "px");
							elem.find(".form").css(cssNameMinHeight, bodyHeightWithoutPadding + "px");

							setTimeout(function()
							{
								const keepRotate = true;
								self.resetFormHeader(elem, keepRotate);
								setTimeout(function()
								{
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
	Form.prototype.assginEntityRecord = function(record)
	{
		const id = record && (record.RecordID || record.Id); // recordID contains value when form opened on form grid
		if (!!id)
		{
			this.obRecordID(id);
		}
		if (this.obRecordID() !== null)
		{
			if (this.recordSelector.options.enable)
			{
				this.recordSelector.autoComplete.enable(false);
			}
			this.fetchFilterData();
		}
	}

	Form.prototype._processElement = function(element)
	{
		const anchors = element.find('.question-title a');
		if (anchors.length > 0)
		{
			$.each(anchors, (idx, a) =>
			{
				const $a = $(a);
				if ($a.attr('target') !== '_blank')
				{
					$a.attr('target', '_blank');
				}
			});
		}
	}

	Form.prototype.getUDFDefinationOfSystemFieldQuestion = function()
	{
		return Promise.resolve().then(() =>
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
							{
								paramData: {
									"@Relationships": "UDFDataSources",
									"@fields": "DisplayName,Guid,UDFDataSources",
									"@filter": `eq(DataTypeId,${this.options.DataTypeId})&in(Guid,${udfUniqueIds.join(",")})`
								}
							},
							{ overlay: false })
							.then(data =>
							{
								if (data.FilteredRecordCount > 0)
								{
									this.udfs = data.Items;
									return this.udfs;
								}
								return [];
							});
					}
					else
					{
						return this.udfs;
					}
				});
			}

			return this.udfOptionPromise;
		});
	}

	Form.prototype.hideSystemFieldQuestionNoMatchedDb = function(question, udfs)
	{
		let existsDbMatchedUDF = false;
		// re assign targetField with udf display name
		udfs && udfs.forEach(udf =>
		{
			if (udf.Guid === question.field.FieldOptions.DefaultText && udf.UDFDataSources.some(ds => ds.DBID === tf.datasourceManager.databaseId))
			{
				existsDbMatchedUDF = true;
			}

			if (question.field.FieldOptions.IsUDFSystemField && question.field.editType.targetField === udf.Guid)
			{
				question.field.editType.targetField = udf.DisplayName.trim();
			}
		})

		// hide question if current database does not exists in udf database source list
		if (!existsDbMatchedUDF)
		{
			question.elem.hide();
		}
	}

	Form.prototype.initUDFSystemFieldState = function()
	{
		const getUDFOptionPromise = this.getUDFDefinationOfSystemFieldQuestion();
		return new Promise((resolve) =>
		{
			const systemFieldUDFQuestions = this.questions.filter(q => q.field.FieldOptions
				&& q.field.FieldOptions.TypeName === QUESTION_TYPE_SYSTEM_FIELD
				&& q.field.FieldOptions.IsUDFSystemField);
			if (systemFieldUDFQuestions.length === 0)
			{
				resolve();
			}

			const promiseArr = systemFieldUDFQuestions.map(q =>
			{
				return getUDFOptionPromise().then(udfs =>
				{
					this.hideSystemFieldQuestionNoMatchedDb(q, udfs);
				});
			});

			Promise.all(promiseArr).then(() => resolve());
		});

	}

	Form.prototype.attachActionOnFormHeader = function($element)
	{
		// make subtitle display block to calculate full height
		$element.find(CLASS_NAME_FORM_SUBTITLE).css("display", "block");
		const subtitleHeight = $element.find(CLASS_NAME_FORM_SUBTITLE).outerHeight(),
			headerInnerHeight = $element.find(CLASS_NAME_FORM_HEADER).height(),
			titleHeight = $element.find(CLASS_NAME_FORM_TITLE).outerHeight();
		/*
		 * greater than 0 means insufficient height for subtitle(form description),
		 * need show "shore more" icon for arrow down to present full height content
		 */
		const offsetHeight = subtitleHeight - (headerInnerHeight - titleHeight);
		const self = this;
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
				$element.find(CLASS_NAME_FORM_SUBTITLE).css("display", "-webkit-box");
			}
			this.elem.find(".showmore").show().on("click", ev =>
			{
				const toRotate = this.resetFormHeader($element);
				setTimeout(function()
				{
					self.resetFormSubTitleClamp($element, toRotate);
				}, 200);
			});
		}
	}

	Form.prototype.checkHeaderWrapped = function($element)
	{
		const titleEle = $element.find(CLASS_NAME_FORM_TITLE),
			titleHeight = $element.find(CLASS_NAME_FORM_TITLE).outerHeight();

		titleEle.css('white-space', 'nowrap');
		const height = titleEle.outerHeight();
		titleEle.css('white-space', 'normal');

		$element.find(CLASS_NAME_FORM_SUBTITLE).removeClass(CLASS_NAME_LINE_CLAMP2);
		if (height < titleHeight)
		{
			//add mini-class to subtitle
			$element.find(CLASS_NAME_FORM_SUBTITLE).addClass(CLASS_NAME_LINE_CLAMP2);
		}
	}

	Form.prototype.resetFormHeader = function($element, keepRotate)
	{
		//Recalcultaing height in case of orientation change
		$element.find(CLASS_NAME_FORM_SUBTITLE).css("display", "block");

		const subtitleHeight = $element.find(CLASS_NAME_FORM_SUBTITLE).outerHeight(),
			headerInnerHeight = $element.find(CLASS_NAME_FORM_HEADER).height(),
			headerOuterHeight = $element.find(CLASS_NAME_FORM_HEADER).outerHeight(),
			titleHeight = $element.find(CLASS_NAME_FORM_TITLE).outerHeight(),
			headerTop = $element.find(CLASS_NAME_FORM_HEADER).position().top;
		let offsetHeight = subtitleHeight - (headerInnerHeight - titleHeight);

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
			const formHeaderHeight = headerOuterHeight + offsetHeight;
			$element.find(CLASS_NAME_FORM_HEADER).outerHeight(formHeaderHeight);
			$element.find(CLASS_NAME_FORM_SUBTITLE).css("display", "block");
			$element.find(".form-body").css("top", formHeaderHeight + headerTop - 15);
		}
		else
		{
			if (isRotated)
			{
				$element.find(".showmore").removeClass("rotate");
			}
			$element.find(CLASS_NAME_FORM_HEADER).css("height", "");
			$element.find(CLASS_NAME_FORM_SUBTITLE).css("display", "");
			$element.find(".form-body").css("top", "");
		}

		return toRotate;
	}

	Form.prototype.resetFormSubTitleClamp = function($element, toRotate)
	{
		const rotateBtnHeight = 20;
		const lineHeight = 22;

		const $formSubtitle = $element.find(CLASS_NAME_FORM_SUBTITLE);
		const displayText = $formSubtitle.css("display");
		$formSubtitle.css("display", "block");
		const formSubtitleHeight = $formSubtitle.height();
		const isLineClampDisabled = formSubtitleHeight <= lineHeight;

		if (isLineClampDisabled)
		{
			$formSubtitle.removeClass(CLASS_NAME_LINE_CLAMP2).removeClass(CLASS_NAME_LINE_CLAMP3);
			$element.find(".showmore").addClass("rotate");
			$element.find(".showmore").hide();
			return;
		}

		$formSubtitle.css("display", displayText);
		$element.find(".showmore").show();

		const headerInnerHeight = $element.find(CLASS_NAME_FORM_HEADER).height(),
			titleHeight = $element.find(CLASS_NAME_FORM_TITLE).outerHeight();

		const lineClampValue = Math.floor((headerInnerHeight - titleHeight - rotateBtnHeight) / lineHeight);
		$formSubtitle.removeClass(CLASS_NAME_LINE_CLAMP2).removeClass(CLASS_NAME_LINE_CLAMP3).addClass('line-clamp-' + lineClampValue);
	}

	Form.prototype.toggleSystemFieldValue = function(recordId)
	{
		this.initUDFSystemFieldStatePromise && this.initUDFSystemFieldStatePromise.then(() =>
		{
			const systemFieldQuestions = this.questions.filter(el => el.field.FieldOptions && el.field.FieldOptions.TypeName === QUESTION_TYPE_SYSTEM_FIELD);
			const targetColumns = systemFieldQuestions.map(el => el.field.editType.targetField);

			if (targetColumns.length === 0)
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
							q.setValue(data.Items[0][q.field.editType.targetField]);
						});
					}
				});
		});
	}

	Form.prototype.restoreAttachment = function(docs, docRelationships)
	{
		if (docs.length > 0 && docRelationships.length > 0)
		{
			const attachmentsOfQuestions = _.groupBy(docRelationships, "UDGridField");
			this.questions.filter(q => q.field.type === 'AttachBlock').forEach(q =>
			{
				const docRelations = attachmentsOfQuestions[q.field.Guid];
				if (docRelations)
				{
					const docsOfAttachment = docs.filter(d => docRelations.some(dr => dr.DocumentID === d.Id));
					q.restore(docsOfAttachment);
				}
			});
		}
	}

	Form.prototype.drawMapShapes = function(mapRecords)
	{
		if (mapRecords.length === 0)
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

	Form.prototype.createQuestions = function(element)
	{
		const fields = this.options.UDGridFields.sort((a, b) => a.Index - b.Index),
			questionContainer = element.find('.form-question-container');

		if (fields.length === 0)
		{
			return;
		}
		fields.forEach(field =>
		{
			if (!field)
			{
				return;
			}
			const questionControl = new TF.Control.Form[field.questionType + 'Question'](field, this.options.DataTypeId, this.onFormElementInit);
			this.questions.push(questionControl);
			questionContainer.append(questionControl.element);
		});

	}

	Form.prototype.convertHex = function(hex, opacity)
	{
		hex = hex.replace('#', '');
		const r = parseInt(hex.substring(0, 2), 16),
			g = parseInt(hex.substring(2, 4), 16),
			b = parseInt(hex.substring(4, 6), 16);
		return `rgba(${r},${g},${b},${opacity})`;
	}

	Form.prototype.resetSubmitButtonsAndWarningMessage = function(element)
	{
		const onlyContainsSystemFields = (element.find(".form-question:visible").length === 0) && (element.find(".systemfield-question").length > 0);
		if (onlyContainsSystemFields)
		{
			element.find(".system-field-invalid").removeClass("hide");
		}

		if (onlyContainsSystemFields)
		{
			const $modal = element.closest(".modal-dialog")
			const $positiveBtn = $modal.find(".btn.positive");
			if ($positiveBtn && $positiveBtn.length)
			{
				$positiveBtn.remove();
			}

			const $negativeBtn = $modal.find(".btn.negative");
			if ($negativeBtn && $negativeBtn.length)
			{
				$negativeBtn.removeClass("btn-link").addClass("tf-btn-black");
				$negativeBtn.find("p").text("Close");
			}
		}
	}

	Form.prototype.fetchFilterData = function()
	{
		const config = TF.Form.formConfig[this.dataType];
		const opts = {
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
				const text = config.formatItem(data.Items[0]).text;
				this.recordSelector.elem.val(text);
			});
	}

	Form.prototype.dispose = function()
	{
		this.questions.forEach(q =>
		{
			q.dispose()
		});
		this.elem.off('click');
		this.elem.remove();
		["from_kendo-control", "form_timepicker", "form_rating"].forEach(el => document.getElementById(el) && document.getElementById(el).remove());
		const kendoNumericWidget = kendo.widgets.find(_ => _.name === "kendoNumericTextBox");
		if (kendoNumericWidget && this._kendoNumericTextBox_keypress)
		{
			kendoNumericWidget.widget.fn._keypress = this._kendoNumericTextBox_keypress;
		}
	}
})();

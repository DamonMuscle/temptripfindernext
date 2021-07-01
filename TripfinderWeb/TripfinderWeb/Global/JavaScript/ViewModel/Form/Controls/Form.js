(function()
{
	createNamespace("TF.Control.Form").Form = Form;
	function Form(dataType, options)
	{
		this.dataType = dataType;
		this.options = options;
		this.obRecordID = ko.observable(null);
		this.obRecordID.subscribe(recordId => this.toggleSystemFieldValue(recordId));
		this.questions = [];
		this.searchControlTemplate = new TF.Control.SearchControlViewModel();
		this.elem = this.initElement();
		this.initUDFSystemFieldStatePromise = this.initUDFSystemFieldState().then(() =>
		{
			this.resetSubmitButtonsAndWarningMessage(this.elem);
		});
		this.attachBlock = null;
		this.initAttachment();
		this.initEvents();

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
			let hasValue = this.questions.some(question => question.hasValue()),
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
		$(window).off("orientationchange.formMobile");
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

	Form.prototype.saveForm = function()
	{
		if (this.obRecordID() == null)
		{
			let aStr = this.dataType === 'altsite' ? 'an' : 'a';
			return tf.promiseBootbox.alert({
				message: `Please select ${aStr} ${tf.applicationTerm[this.dataType].LowerCaseTerm} first.`,
				title: `No ${tf.applicationTerm[this.dataType].Singular} Selected`
			}).then(function()
			{
				return null;
			});
		}
		return Promise.all([...this.questions.map(q => q.validate()), this.attachBlock && this.attachBlock.validate(), this.validateLocationRequired()])
			.then(res =>
			{
				let udgRecord = {};
				this.questions.forEach(q =>
				{
					udgRecord[q.field.Guid] = q.value;
				});
				tf.loadingIndicator.showImmediately();
				return new Promise(resolve =>
				{
					// attachment associated
					if (this.attachBlock && this.attachBlock.formDocuments.length > 0 && this.attachBlock.dirty)
					{
						const attachments = this.attachBlock.formDocuments.map(_ =>
						{
							return {
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
						tf.udgHelper.uploadAttachments(attachments).then(res =>
						{
							resolve(res);
						});
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
						udgRecord.DocumentUDGridRecords = res.map(_ =>
						{
							return {
								DBID: tf.datasourceManager.databaseId,
								DocumentID: _.Id
							};
						});
					}

					//save new record
					if (!this.options.udGridRecordId) 
					{
						return TF.getLocation().then(res =>
						{
							udgRecord.latitude = res.latitude;
							udgRecord.longitude = res.longitude;
							return tf.udgHelper.addUDGridRecordOfEntity(this.options, tf.dataTypeHelper.getId(this.dataType), this.obRecordID(), udgRecord);
						});
					}
					//update exsiting record
					else 
					{
						udgRecord.latitude = this.options.latitude;
						udgRecord.longitude = this.options.longitude;
						udgRecord.Id = this.options.udGridRecordId;
						return tf.udgHelper.updateUDGridRecordOfEntity(this.options, udgRecord);
					}
				}).then(res =>
				{
					if (this.saved)
					{
						this.saved().then(res =>
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
			}, rej =>
			{
				if (rej === 'location access denied')
				{
					tf.promiseBootbox.alert({
						message: `Location services must be enabled in order to submit this form.`,
						title: 'Location Service Not Available'
					})
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

	Form.prototype.initElement = function()
	{
		let color = this.options.color,
			dateType = this.dataType,
			searchHint = "Search " + dateType.replace(/^./, dateType[0].toUpperCase());

		let elem = $(`<div class="form-container hide">
			<div class="form-layer" style="background-color:${this.convertHex(color, 0.2)}">
				<div class="form">
					<div class="form-header" style="background-color:${color}">
						<div class="form-title">${this.options.Name || ''}</div>
						<div class="form-subtitle">${this.options.Description || ''}</div>
						<div class="showmore">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="14"><path fill="currentColor" d="M0 7.33l2.829-2.83 9.175 9.339 9.167-9.339 2.829 2.83-11.996 12.17z"></path></svg>
						</div>
					</div>
					<div class="form-body">	
						<div class="form-question-container">
							<div class="system-field-invalid warning hide">System field is not in the current data source</div>
						</div>
						<div class="attachment-container hide">
							<label>${this.options.documentQuestion || 'Attach File(s)'} <span class="maxnum-desc"></span></label>
						</div>
						<div class="e-sign">
							<div class="e-sign-container">
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>`);

		/* hack default kendo behavor */
		const kendoNumericWidget = kendo.widgets.find(_ => _.name === "kendoNumericTextBox");
		if (kendoNumericWidget)
		{
			this._kendoNumericTextBox_keypress = kendoNumericWidget.widget.fn._keypress;
			kendoNumericWidget.widget.fn._keypress = () => true;
		}

		this.createQuestions(elem);
		this._processElement(elem);
		if (TF.isMobileDevice) {
			$(window).off("orientationchange.formMobile")
				.on("orientationchange.formMobile", () => {
					setTimeout(() => {
						this.checkHeaderWrapped();
						this.resetFormHeader(elem);
						let dialog = elem.closest('.modal-dialog');
						if (dialog.length > 0) {
							dialog.find('.modal-body').css("max-height", $(window).height() - 46);
							let bodyHeight = dialog.find('.modal-body').height();
							elem.closest(".grid-stack-container").css("min-height", bodyHeight + "px");
						}
					}, 400);
			});
		}

		return elem;
	}

	/* assign type record, invoked by UDGridGridStackQuickAddWrapper.prototype._updateQuickAddDetailView */
	Form.prototype.assginEntityRecord = function(record)
	{
		let id = record.RecordID || record.Id; // recordID contains value when form opened on form grid
		this.obRecordID(id);
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
			const systemFieldQuestions = this.questions.filter(el => el.field.FieldOptions && el.field.FieldOptions.TypeName === "System Field");

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
			const systemFieldUDFQuestions = this.questions.filter(q => q.field.FieldOptions && q.field.FieldOptions.TypeName === "System Field" && q.field.FieldOptions.IsUDFSystemField);
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

	Form.prototype.resetFormHeader = function ($element) {
		//Recalcultaing height in case of orientation change
		$element.find(".form-subtitle").css("display", "block");

		let subtitleHeight = $element.find(".form-subtitle").outerHeight(),
			headerInnerHeight = $element.find(".form-header").height(),
			headerOuterHeight = $element.find(".form-header").outerHeight(),
			titleHeight = $element.find(".form-title").outerHeight(),
			headerTop = $element.find('.form-header').position().top,
			offsetHeight = subtitleHeight - (headerInnerHeight - titleHeight);

		if (isMobileDevice()) {
			offsetHeight += 10;
		}

		if (!$element.find(".showmore").hasClass("rotate")) {
			$element.find(".showmore").addClass("rotate");
			$element.find(".form-header").outerHeight(headerOuterHeight + offsetHeight);
			$element.find(".form-subtitle").css("display", "block");
			$element.find(".form-body").css("top", headerOuterHeight + offsetHeight + headerTop);
		}
		else {
			$element.find(".showmore").removeClass("rotate");
			$element.find(".form-header").css("height", "");
			$element.find(".form-subtitle").css("display", "");
			$element.find(".form-body").css("top", "");
		}
	}

	Form.prototype.checkHeaderWrapped = function () {
		let $element = this.element,
			titleEle = $element.find(".form-title"),
			titleHeight = $element.find(".form-title").outerHeight();

		titleEle.css('white-space', 'nowrap');
		let height = titleEle.outerHeight();
		titleEle.css('white-space', 'normal');
		if (height < titleHeight) {
			//add mini-class to subtitle
			$element.find('.form-subtitle').addClass('form-subtitle-mini');
		}
	}

	Form.prototype.attachActionOnFormHeader = function($element)
	{
		// make subtitle display block to calculate full height
		$element.find(".form-subtitle").css("display", "block");
		const subtitleHeight = $element.find(".form-subtitle").outerHeight(),
			headerInnerHeight = $element.find(".form-header").height(),
			headerOuterHeight = $element.find(".form-header").outerHeight(),
			titleHeight = $element.find(".form-title").outerHeight();
		/*
		 * greater than 0 means insufficient height for subtitle(form description), 
		 * need show "shore more" icon for arrow down to present full height content
		 */
		let offsetHeight = subtitleHeight - (headerInnerHeight - titleHeight);
		if (isMobileDevice()) {
			offsetHeight += 10;
		}
		if (offsetHeight > 0)
		{
			$element.find(".form-subtitle").css("display", "-webkit-box");
			this.elem.find(".showmore").show().on("click", ev =>
			{
				if (!$element.find(".showmore").hasClass("rotate"))
				{
					$element.find(".showmore").addClass("rotate");
					$element.find(".form-header").outerHeight(headerOuterHeight + offsetHeight);
					$element.find(".form-subtitle").css("display", "block");
					//-15 since the css setting of .form-header( margin-top: -15px; )
					$element.find(".form-body").css("top", headerOuterHeight + offsetHeight - 15);
				}
				else
				{
					$element.find(".showmore").removeClass("rotate");
					$element.find(".form-header").css("height", "");
					$element.find(".form-subtitle").css("display", "");
					$element.find(".form-body").css("top", "");
				}
			});
		}
	}

	Form.prototype.initAttachment = function()
	{
		if (tf.udgHelper.isDocumentIncluded(this.options))
		{
			this.uploadDocumentHelper = new TF.Form.UploadDocumentHelper(this);
			this.elem.find(".attachment-container").removeClass("hide");
			this.attachBlock = new TF.Control.Form.AttachBlock({ readonly: this.options.attachBlockReadonly }, this);
			this.elem.find(".attachment-container").append(this.attachBlock.$el);
		}
	}

	Form.prototype.toggleSystemFieldValue = function(recordId)
	{
		this.initUDFSystemFieldStatePromise && this.initUDFSystemFieldStatePromise.then(() =>
		{
			let systemFieldQuestions = this.questions.filter(el => el.field.FieldOptions && el.field.FieldOptions.TypeName === "System Field");
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
							q.setValue(data.Items[0][q.field.editType.targetField]);
						});
					}
				});
		});
	}

	Form.prototype.restoreAttachment = function(docs)
	{
		this.attachBlock && this.attachBlock.restore(docs);
	}

	Form.prototype.createQuestions = function(element)
	{
		let fields = this.options.UDGridFields.sort((a, b) => a.Index - b.Index),
			questionContainer = element.find('.form-question-container'),
			eSignContainer = element.find('.e-sign-container');

		if (fields.length == 0 && !this.options.isSignatureRequired)
		{
			return;
		}
		fields.forEach(field =>
		{
			if (!field) return;
			let questionControl = new TF.Control.Form[field.questionType + 'Question'](field, this.options.DataTypeId);
			this.questions.push(questionControl);
			questionContainer.append(questionControl.element);
		});

		eSignContainer.parent().hide();
		if (eSignContainer.length > 0 && this.options.isSignatureRequired)
		{
			eSignContainer.parent().show();
			let signControl = new TF.Control.Form.SignatureBlock({
				value: this.options.signature,
				readonly: this.options.signatureReadonly,
				signatureQuestion: this.options.signatureQuestion,
			});
			this.questions.push(signControl);
			eSignContainer.append(signControl.element);
		}
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
		if ((element.find(".form-question:visible,.attachment-container:visible,.e-sign:visible").length === 0)
			&& (element.find(".systemfield-question").length > 0))
		{
			element.find(".system-field-invalid").removeClass("hide");
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
		}
	}

	Form.prototype.dispose = function()
	{
		this.elem.off('click');
		if (this.attachBlock)
		{
			this.attachBlock.dispose();
		}
		this.elem.remove();
		["from_kendo-control", "form_timepicker", "form_rating"].forEach(el => document.getElementById(el) && document.getElementById(el).remove());

		const kendoNumericWidget = kendo.widgets.find(_ => _.name === "kendoNumericTextBox");
		if (kendoNumericWidget && this._kendoNumericTextBox_keypress)
		{
			kendoNumericWidget.widget.fn._keypress = this._kendoNumericTextBox_keypress;
		}
	}
})();
(function ()
{
	const MODAL_BODY_SELECTOR = '.modal-body';
	createNamespace("TF.DetailView").UDGridGridStackQuickAddWrapper = UDGridGridStackQuickAddWrapper;
	const CSS_MIN_HEIGHT = "min-height";
	function UDGridGridStackQuickAddWrapper(options)
	{
		var self = this;
		self.dataType = options.dataType;
		self.recordId = options.recordId;
		self.obFormExpiredAfterOpen = options.obFormExpiredAfterOpen;
		self.recordEntity = options.recordEntity;
		self.baseRecordType = options.baseRecordType;
		self.baseRecordEntity = options.baseRecordEntity;
		self.layoutEntity = options.layoutEntity;
		self.pageLevelViewModel = options.pageLevelViewModel;
		self.attachedFile = options.attachedFile;
		self.udGrid = options.udGrid;
		self.isReadOnly = options.isReadOnly;
		self.negativeClick = options.negativeClick;
		self.negativeClose = options.negativeClose;
		self.positiveClick = options.positiveClick;
		self.template = "Workspace/detailview/ManageAssociation/QuickAddDetailView";
		self.$element = null;
	}

	/**
	 * Initialization
	 * @return {void}
	 */
	UDGridGridStackQuickAddWrapper.prototype.init = function (data, element)
	{
		var self = this;
		self.$element = $(element);
		self.$scrollBody = self.$element.closest(MODAL_BODY_SELECTOR);

		self.initCustomDetailView();
	};

	/**
	 * Initialize the custom detail view in the modal.
	 *
	 * @returns {void}
	 */
	UDGridGridStackQuickAddWrapper.prototype.initCustomDetailView = function ()
	{
		var self = this;
		self.customDetailView = new TF.DetailView.UDGridDetailViewViewModel(self.udGrid, self.baseRecordEntity, self.recordEntity);
		self.customDetailView.init({
			$element: self.$element,
			$scrollBody: self.$scrollBody,
			gridType: self.dataType,
			pageLevelViewModel: self.pageLevelViewModel,
			udGrid: self.udGrid,
		});

		self.customDetailView.onEditRecordSuccess.subscribe(function (e, entity)
		{
			self.recordEntity = entity;
			self.recordId = entity ? entity.Id : 0;
		});

		self._updateQuickAddDetailView();
	};

	UDGridGridStackQuickAddWrapper.prototype._updateQuickAddDetailView = function ()
	{
		var self = this;
		self._getRecordEntity().then(function ()
		{
			let formOption = self.udGrid;
			let gridOptions = {};
			if (formOption.GridOptions)
			{
				gridOptions = JSON.parse(formOption.GridOptions);
				formOption.isLocationRequired = !!gridOptions.IsLocationRequired;
				formOption.color = gridOptions.BackgroundColor || '#2686b8';
				formOption.canClearFilter = !gridOptions.IsMyRecordsFilterRequired;
			}
			formOption.obFormExpiredAfterOpen = self.obFormExpiredAfterOpen;
			formOption.UDGridFields = tf.udgHelper._updateUserDefinedGridFields(formOption.UDGridFields);
			formOption.udGridRecordId = undefined;
			formOption.latitude = null;
			formOption.longitude = null;
			if (self.recordEntity)
			{
				formOption.udGridRecordId = self.recordEntity.Id;
				formOption.UDGridFields.forEach(field =>
				{
					let value = self.recordEntity[field.Guid];
					if (field.questionType === "Phone")
					{
						value = tf.dataFormatHelper.phoneFormatter(value);
					}
					if (field.questionType === "ListFromData")
					{
						if (self.recordEntity[`${field.Guid}_originalValue`])
						{
							value = self.recordEntity[`${field.Guid}_originalValue`];
						}
					}
					field.value = value;
				});

				formOption.latitude = self.recordEntity.latitude;
				formOption.longitude = self.recordEntity.longitude;
				if (self.isReadOnly || !tf.authManager.isAuthorizedFor("formsResults", "edit"))
				{
					formOption.UDGridFields.forEach(field => field.readonly = true);
				}
			}
			TF.DetailView.UserDefinedGridHelper.handleFormSection(formOption);
			self.form = new TF.Control.Form.Form(self.dataType, formOption);
			if (self.baseRecordEntity)
			{
				self.form.assignEntityRecord(self.baseRecordEntity);
			}
			self.$element.find(".custom-detail-view").empty().append(self.form.element);
			//set form min-height to adapt page view size,  30(modal padding)
			self.form.element.find(".form").css(CSS_MIN_HEIGHT, `${parseInt(self.$element.parents(MODAL_BODY_SELECTOR).css("max-height")) - 30}px`);

			if (TF.isMobileDevice)
			{
				let dialog2 = self.$element.closest('.tfmodal.modal');
				dialog2.addClass("is-form-on-mobile");

				let dialog = self.$element.closest('.modal-dialog');
				dialog.addClass("modal-fullscreen");
				dialog.find(MODAL_BODY_SELECTOR).css("max-height", $(window).height() - 46);

				let bodyHeight = dialog.find(MODAL_BODY_SELECTOR).height();
				self.$element.closest(".grid-stack-container").css(CSS_MIN_HEIGHT, bodyHeight + "px");

				let bodyHeightWithoutPadding = dialog.find(MODAL_BODY_SELECTOR).height();
				self.$element.closest(".basic-quick-add").css(CSS_MIN_HEIGHT, bodyHeightWithoutPadding + "px");
				self.$element.find(".form").css(CSS_MIN_HEIGHT, bodyHeightWithoutPadding + "px");

				self.$element.find(".form-body").css("bottom", "0");
			}

			//restore attchments
			if (self.recordEntity)
			{
				let docuemntRelationships = [];
				tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "DocumentUDGridRecords"),
					{
						paramData: {
							DBID: tf.datasourceManager.databaseId,
							UDGridRecordID: self.recordEntity.Id
						}
					}).then(res =>
					{
						if (res.Items && res.Items.length > 0)
						{
							docuemntRelationships = res.Items;
							const documentIds = res.Items.map(item => item.DocumentID);
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), tf.datasourceManager.databaseId, "Documents"),
								{
									paramData: {
										DBID: tf.datasourceManager.databaseId,
										"@filter": `in(Id, ${documentIds.join(",")})`,
										"@fields": "Id,Name,FileName,FileSizeKB,MimeType",
									}
								});
						}
						else
						{
							return { Items: [] };
						}
					}).then(res =>
					{
						self.form.restoreAttachment(res.Items || [], docuemntRelationships);
					});

				tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "MapUDGridRecords"),
					{
						paramData: {
							DBID: tf.datasourceManager.databaseId,
							UDGridRecordID: self.recordEntity.Id
						}
					}).then(res => 
					{
						self.form.drawMapShapes(res.Items || []);
					});
			}

			self.form.element.on('formClose', () =>
			{
				self.form.dispose();
				self.form = null;
			});


			self.form.element.on('triggerFormClose', () =>
			{
				if (self.isReadOnly)
				{
					if (self.negativeClose)
					{
						self.negativeClose();
					}
				}
				else
				{
					if (self.negativeClick)
					{
						self.negativeClick(true);
					}
				}
			});

			self.form.element.on('formSave', () =>
			{
				if (self.positiveClick)
				{
					self.positiveClick();
				}
			});

			self.form.saved = () =>
			{
				if (self.formSaved)
				{
					return self.formSaved();
				}
				else
				{
					return Promise.resolve(true);
				}
			}
			self.form.element.removeClass('hide');
		});
	};

	/**
	 * Save the object.
	 *
	 * @returns {void}
	 */
	UDGridGridStackQuickAddWrapper.prototype.save = function ()
	{
		var self = this;
		// update auth info
		let updateAuthPromise = tf.authManager.updateAuthInfos();
		return updateAuthPromise.then(() =>
		{
			const isReadOnly = !self.form.options.udGridRecordId? !tf.authManager.isAuthorizedFor("formsResults", "add"):
				 !tf.authManager.isAuthorizedFor("formsResults", "edit");
			if (isReadOnly)
			{
				return tf.promiseBootbox.alert(TF.DetailView.UserDefinedGridHelper.HAS_NO_SUBMITTED_PERMISSION, 'Warning').then(() =>
				{
					this.negativeClose();
				});	
			}

			return self.form.saveForm()
				.then(function(result)
				{
					if (result == null)
					{
						result = { success: false };
					}

					if (result.success == null)
					{
						result.success = true;
					}

					return result;
				});
		});
	};

	/*
	 * Handle modal Cancel button callback, to check whether form has uncommited data while click Cancel
	 */
	UDGridGridStackQuickAddWrapper.prototype.cancel = function ()
	{
		var self = this;
		if (self.form.questions.some(question => question.field.type !== "SystemField" && question.dirty)
			|| (self.form.attachBlock && self.form.attachBlock.dirty))
		{
			return tf.promiseBootbox.yesNo("Are you sure you want to cancel?", "Unsaved Changes")
				.then(result =>
				{
					if (result)
					{
						self.form.closeForm();
					}
					return !result;
				});
		}
		else
		{
			self.form.closeForm();
			return Promise.resolve(false);
		}
	};

	/**
	 * If has recordId but no record entity, request to get the entity.
	 * 
	 */
	UDGridGridStackQuickAddWrapper.prototype._getRecordEntity = function ()
	{
		var self = this,
			deferred = (self.recordEntity || !self.recordId) ? Promise.resolve(true) :
				self.customDetailView.getRecordEntity(self.dataType, self.recordId)
					.then(function (entity)
					{
						self.recordEntity = entity;
					});

		return deferred;
	};

	/**
	 * Dispose
	 * 
	 * @return {void}
	 */
	UDGridGridStackQuickAddWrapper.prototype.dispose = function ()
	{
		var self = this;

		if (self.customDetailView)
		{
			self.customDetailView.dispose();
		}

		self.$element = null;
		self.$scrollBody = null;
	};
})();
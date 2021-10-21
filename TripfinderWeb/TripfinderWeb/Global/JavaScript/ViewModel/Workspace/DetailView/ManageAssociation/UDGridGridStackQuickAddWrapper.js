(function()
{
	const MODAL_BODY_SELECTOR = '.modal-body';

	createNamespace("TF.DetailView").UDGridGridStackQuickAddWrapper = UDGridGridStackQuickAddWrapper;

	function UDGridGridStackQuickAddWrapper(options)
	{
		var self = this;
		self.dataType = options.dataType;
		self.recordId = options.recordId;
		self.recordEntity = options.recordEntity;
		self.baseRecordType = options.baseRecordType;
		self.baseRecordEntity = options.baseRecordEntity;
		self.layoutEntity = options.layoutEntity;
		self.pageLevelViewModel = options.pageLevelViewModel;
		self.attachedFile = options.attachedFile;
		self.udGrid = options.udGrid;
		self.isReadOnly = options.isReadOnly;

		self.template = "Workspace/detailview/ManageAssociation/QuickAddDetailView";

		self.$element = null;
	}

	/**
	 * Initialization
	 * @return {void}
	 */
	UDGridGridStackQuickAddWrapper.prototype.init = function(data, element)
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
	UDGridGridStackQuickAddWrapper.prototype.initCustomDetailView = function()
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

		self.customDetailView.onEditRecordSuccess.subscribe(function(e, entity)
		{
			self.recordEntity = entity;
			self.recordId = entity ? entity.Id : 0;
		});

		self._updateQuickAddDetailView();
	};

	UDGridGridStackQuickAddWrapper.prototype._updateQuickAddDetailView = function()
	{
		var self = this;
		self._getRecordEntity().then(function()
		{
			const formOption = self.udGrid;
			let gridOptions = {};
			if (formOption.GridOptions)
			{
				gridOptions = JSON.parse(formOption.GridOptions);
				formOption.isLocationRequired = !!gridOptions.IsLocationRequired;
				formOption.color = gridOptions.BackgroundColor || '#2686b8';
				formOption.canClearFilter = !gridOptions.IsMyRecordsFilterRequired;
			}
			formOption.UDGridFields = tf.udgHelper._updateUserDefinedGridFields(formOption.UDGridFields);
			formOption.udGridRecordId = undefined;
			formOption.isSigned = null;
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
					field.value = value;
				});

				const isSigned = tf.udgHelper.getIsReadOnlyBasedOnSignedPolicy(self.recordEntity, formOption.UDGridFields);
				const readOnly = formOption.isReadOnly || isSigned;
				formOption.isSigned = isSigned;
				formOption.latitude = self.recordEntity.latitude;
				formOption.longitude = self.recordEntity.longitude;
				if (readOnly)
				{
					formOption.UDGridFields.forEach(field => field.readonly = true);
				}

			}
			self.form = new TF.Control.Form.Form(self.dataType, formOption);
			if (self.baseRecordEntity)
			{
				self.form.assginEntityRecord(self.baseRecordEntity);
			}
			self.$element.find(".custom-detail-view").empty().append(self.form.element);
			//set form min-height to adapt page view size,  30(modal padding)
			const MINI_HEIGHT_PROPERTY = "min-height";
			self.form.element.find(".form").css(MINI_HEIGHT_PROPERTY, `${parseInt(self.$element.parents(MODAL_BODY_SELECTOR).css("max-height")) - 30}px`);

			if (TF.isMobileDevice)
			{
				const dialog2 = self.$element.closest('.tfmodal.modal');
				dialog2.addClass("is-form-on-mobile");

				const dialog = self.$element.closest('.modal-dialog');
				dialog.addClass("modal-fullscreen");
				dialog.find(MODAL_BODY_SELECTOR).css("max-height", $(window).height() - 46);

				const bodyHeight = dialog.find(MODAL_BODY_SELECTOR).height();
				self.$element.closest(".grid-stack-container").css(MINI_HEIGHT_PROPERTY, bodyHeight + "px");

				const bodyHeightWithoutPadding = dialog.find(MODAL_BODY_SELECTOR).height();
				self.$element.closest(".basic-quick-add").css(MINI_HEIGHT_PROPERTY, bodyHeightWithoutPadding + "px");
				self.$element.find(".form").css(MINI_HEIGHT_PROPERTY, bodyHeightWithoutPadding + "px");

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
										"@fields": "Id,Name,FileName,FileSizeKB,MimeType,FileContentBase64",
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
	UDGridGridStackQuickAddWrapper.prototype.save = function()
	{
		var self = this;

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
	};

	/*
	 * Handle modal Cancel button callback, to check whether form has uncommited data while click Cancel
	 */
	UDGridGridStackQuickAddWrapper.prototype.cancel = function()
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
	UDGridGridStackQuickAddWrapper.prototype._getRecordEntity = function()
	{
		var self = this,
			deferred = (self.recordEntity || !self.recordId) ? Promise.resolve(true) :
				self.customDetailView.getRecordEntity(self.dataType, self.recordId)
					.then(function(entity)
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
	UDGridGridStackQuickAddWrapper.prototype.dispose = function()
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

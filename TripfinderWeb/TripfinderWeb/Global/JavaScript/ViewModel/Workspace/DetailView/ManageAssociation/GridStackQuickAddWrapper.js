(function()
{
	createNamespace("TF.DetailView").GridStackQuickAddWrapper = GridStackQuickAddWrapper;

	function GridStackQuickAddWrapper(options)
	{
		var self = this;
		self.options = options;
		self.dataType = options.dataType;
		self.recordId = options.recordId;
		self.recordEntity = options.recordEntity;
		self.baseRecordType = options.baseRecordType;
		self.baseRecordEntity = options.baseRecordEntity;
		self.layoutEntity = options.layoutEntity;
		self.pageLevelViewModel = options.pageLevelViewModel;
		self.attachedFile = options.attachedFile;

		self.template = "Workspace/detailview/ManageAssociation/QuickAddDetailView";

		self.$element = null;
	};

	/**
	 * Initialization
	 * @return {void}
	 */
	GridStackQuickAddWrapper.prototype.init = function(data, element)
	{
		var self = this;
		self.$element = $(element);
		self.$scrollBody = self.$element.closest('.modal-body');

		self.initParametersByType();
		self.initCustomDetailView();
	};

	GridStackQuickAddWrapper.prototype.initParametersByType = function()
	{
		var self = this;
		switch (self.dataType)
		{
			case "contact":
				self.associationGridName = "ContactAssociationGrid";
				self.associationFieldName = "RecordContacts";
				self.associationIdFieldName = "RecordID";
				break;
			case "document":
				self.associationGridName = "DocumentAssociationGrid";
				self.associationFieldName = "DocumentRelationships";
				self.associationIdFieldName = "AttachedToID";
				break;
		}
	};

	/**
	 * Initialize the custom detail view in the modal.
	 *
	 * @returns {void}
	 */
	GridStackQuickAddWrapper.prototype.initCustomDetailView = function()
	{
		var self = this;
		self.customDetailView = new TF.DetailView.BaseCustomGridStackViewModel();
		self.customDetailView.init({
			$element: self.$element,
			$scrollBody: self.$scrollBody,
			gridType: self.dataType,
			pageLevelViewModel: self.pageLevelViewModel
		});

		self.customDetailView.onEditRecordSuccess.subscribe(function(e, entity)
		{
			self.recordEntity = entity;
			self.recordId = entity ? entity.Id : 0;
		});

		self._updateQuickAddDetailView();
	};

	GridStackQuickAddWrapper.prototype._updateQuickAddDetailView = function()
	{
		var self = this;
		self._getRecordEntity().then(function()
		{
			self.customDetailView.applyLayoutTemplate(self.layoutEntity, self.recordEntity).then(function()
			{
				if (!self.recordEntity)
				{
					self._updateAssociationGrid();
				}

				self.customDetailView.refreshEditStatus();

				if (self.afterInitCustomDetailView)
				{
					self.afterInitCustomDetailView();
				}

				self.customDetailView.highlightRequiredFieldByAsterisk();
			});
		});
	};

	GridStackQuickAddWrapper.prototype.afterInitCustomDetailView = function()
	{
		var self = this;
		if (self.dataType === "document"
			&& self.attachedFile != null
			&& self.customDetailView.uploadDocumentHelper)
		{
			self.customDetailView.uploadDocumentHelper.addFile(self.attachedFile);
		}

		if (Array.isArray(self.options.readonlyBlockFields))
		{
			self.options.readonlyBlockFields.forEach(blockField =>
			{
				self.customDetailView.toggleBlockReadOnly(true, r => r.options.field == blockField);
			});
		}
	};

	/**
	 * Save the object.
	 *
	 * @returns {void}
	 */
	GridStackQuickAddWrapper.prototype.save = function()
	{
		var self = this, isAssociated = self._isAssociatedWithBaseEntity();

		return self.customDetailView.saveCurrentEntity()
			.then(function(result)
			{
				// Associated is saved separately, so there would be no result.
				if (!isAssociated && self.recordEntity && !result)
				{
					result = {
						success: true,
						entity: self.recordEntity
					}
				}

				if (result)
				{
					result.associated = !!isAssociated;
				}

				return result;
			});
	};

	/**
	 * If has recordId but no record entity, request to get the entity.
	 * 
	 */
	GridStackQuickAddWrapper.prototype._getRecordEntity = function()
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

	GridStackQuickAddWrapper.prototype._updateAssociationGrid = function()
	{
		var self = this,
			recordItem = {
				Type: tf.dataTypeHelper.getFormalDataTypeName(self.baseRecordType)
			};

		self._getAssociationGridTotalCount()
			.then(function(totalCount)
			{
				if (!self.baseRecordEntity)
				{
					// This is when creating a new entity.
					recordItem.Id = 0;
					recordItem.Name = "New Record";
					totalCount++;
				}
				else
				{
					recordItem.Id = self.baseRecordEntity.Id;
					recordItem.Name = tf.dataTypeHelper.getEntityName(self.baseRecordType, self.baseRecordEntity);
				}

				tf.helpers.detailViewHelper.appendToAllGridsDataSource(self.associationGridName, [recordItem], totalCount, self.customDetailView.$element);
				self._updateAssociationGridContent(recordItem);
			});
	};

	GridStackQuickAddWrapper.prototype._isAssociatedWithBaseEntity = function()
	{
		var self = this,
			isAssociatedWithBaseEntity = true,
			fieldName = self.associationFieldName,
			associations = null;
		if (self.recordEntity)
		{
			associations = self.recordEntity[fieldName];
			if (self.customDetailView.fieldEditorHelper.entityModified && associations)
			{
				associations = self.recordEntity[fieldName];
			}
		}
		else
		{
			associations = self.customDetailView.fieldEditorHelper.editFieldList[fieldName] && self.customDetailView.fieldEditorHelper.editFieldList[fieldName].value;
		}

		if (associations)
		{
			isAssociatedWithBaseEntity = self._isContainsBaseEntity(associations);
		}
		else
		{
			isAssociatedWithBaseEntity = false;
		}

		return isAssociatedWithBaseEntity;
	};

	GridStackQuickAddWrapper.prototype._isContainsBaseEntity = function(associations)
	{
		var self = this, fieldName = self.associationIdFieldName,
			baseRecordId = self.baseRecordEntity ? self.baseRecordEntity.Id : 0;

		return associations.some(function(item)
		{
			return item[fieldName] == baseRecordId;
		});
	};

	GridStackQuickAddWrapper.prototype._getAssociationGridTotalCount = function()
	{
		return tf.dataTypeHelper.getAssociationTotalCount(this.dataType);
	};

	GridStackQuickAddWrapper.prototype._updateAssociationGridContent = function(recordItem)
	{
		switch (this.dataType)
		{
			case "document":
				this.customDetailView.updateDocumentAssociationRecordEntity([recordItem]);
				break;
			case "contact":
				this.customDetailView.updateContactAssociationRecordEntity([recordItem]);
				break;
			default:
				break;
		}

		this.associateRecordItem = recordItem;
	};

	GridStackQuickAddWrapper.prototype.isAnyFieldsUpdated = function()
	{
		let editFieldList = this.customDetailView.fieldEditorHelper.editFieldList,
			keys = Object.keys(editFieldList);

		if (keys.length == 0) return false;

		let recordEntity = tf.dataTypeHelper.getDataModelByGridType(this.dataType).toData();

		this.customDetailView.fieldEditorHelper.fillUserDefinedFieldsToEntity(recordEntity);
		this.customDetailView.fieldEditorHelper.applyModificationsToEntity(recordEntity);

		return keys.some(key =>
		{
			if (this.dataType == "contact" && key == "RecordContacts")
			{
				if (editFieldList[key].value.length == 1)
				{
					let recordContact = editFieldList[key].value[0];
					return recordContact.RecordID != this.associateRecordItem.Id ||
						recordContact.DataTypeId != tf.dataTypeHelper.getIdByName(this.associateRecordItem.Type);
				}

				return true;
			}

			if (this.dataType == "document" && key == "DocumentRelationships")
			{
				if (editFieldList[key].value.length == 1)
				{
					let documentRelationship = editFieldList[key].value[0];
					return documentRelationship.AttachedToID != this.associateRecordItem.Id ||
						documentRelationship.AttachedToType != tf.dataTypeHelper.getIdByName(this.associateRecordItem.Type);
				}

				return true;
			}

			if (key == "UserDefinedFields")
			{
				return editFieldList[key].some(item =>
				{
					let udfField = recordEntity.UserDefinedFields.filter(function(udf) { return udf.Id === item.Id });
					if ((udfField.length > 0 && (udfField[0].RecordValue == null || udfField[0].RecordValue.length === 0))
						|| udfField.length == 0)
					{
						return false;
					}

					return true;
				});
			}

			if (this.dataType == "document")
			{
				switch (key)
				{
					case "FileName":
					case "FileSizeKB":
					case "MimeType":
						return recordEntity["FileName"] != null && recordEntity["FileName"].length != 0;
				}
			}

			return !this.customDetailView.fieldEditorHelper.isEntityValueEmpty(recordEntity, key);
		});
	};

	/**
	 * Dispose
	 * 
	 * @return {void}
	 */
	GridStackQuickAddWrapper.prototype.dispose = function()
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
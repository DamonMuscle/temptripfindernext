(function()
{
	createNamespace('TF.Control').EditDocumentViewModel = EditDocumentViewModel;

	function EditDocumentViewModel(objtype, objid, documentId, files, obSelectedAssociations, parentType, parentId, documentData, documentEntities)
	{
		this.UploadedFileChangeEvent = this.UploadedFileChangeEvent.bind(this);
		this.deleteFileClick = this.deleteFileClick.bind(this);

		this.objtype = objtype;
		this.objid = objid;
		this.obSelectedAssociations = obSelectedAssociations;
		this.associations = [];
		this.parentType = parentType;
		this.parentId = parentId;
		this.obClassificationDataModels = ko.observableArray();
		this.obEntityDataModel = ko.observable(new TF.DataModel.DocumentDataModel());
		if (documentId && documentId > 0)
		{
			this.obEntityDataModel().id(documentId);
		}
		if (documentData)
		{
			this.documentData = documentData;
		}
		if (documentEntities)
		{
			this.documentEntities = documentEntities;
		}
		this.currentDocumentClassificationName = ko.computed(this.currentDocumentClassificationNameComputer, this);
		this.obDisplayFileName = ko.computed(function()
		{
			if (!this.obEntityDataModel().apiIsNew())
			{
				return this.obEntityDataModel().filename();
			}
			else
			{
				var documentEntities = this.obEntityDataModel().documentEntities();
				if (documentEntities.length == 1)
				{
					return documentEntities[0].Filename;
				}
				else if (documentEntities.length > 0)
				{
					return "multiple files associated";
				}
				else
				{
					return null;
				}
			}
		}, this);
		this.obSelectedDocumentClassification = ko.observable();
		this.obSelectedDocumentClassification.subscribe(this.setDocumentClassification, this);

		this.pageLevelViewModel = new TF.PageLevel.EditDocumentPageLevelViewModel();

		this.UploadedFile(files);
	}
	EditDocumentViewModel.prototype.currentDocumentClassificationNameComputer = function()
	{
		var classificationDataModels = this.obClassificationDataModels();
		var classificationDataModel = Enumerable.From(classificationDataModels).Where(function(c)
		{
			return c.Id === this.obEntityDataModel().documentClassificationId()
		}.bind(this)).ToArray()[0];
		setTimeout(function()
		{
			if (this.$form && classificationDataModel && !!classificationDataModel.Name)
			{
				this.$form.find("input[name='documentClassification']").change();
			}
		}.bind(this));
		return classificationDataModel ? classificationDataModel.Name : "";
	};

	EditDocumentViewModel.prototype.setDocumentClassification = function()
	{
		this.obEntityDataModel().documentClassification(this.obSelectedDocumentClassification() ? this.obSelectedDocumentClassification().Name : "");
		this.obEntityDataModel().documentClassificationId(this.obSelectedDocumentClassification() ? this.obSelectedDocumentClassification().Id : 0);
	};

	EditDocumentViewModel.prototype.save = function()
	{
		return this.pageLevelViewModel.saveValidate()
			.then(function(valid)
			{
				if (!valid)
				{
					// may pop up error("some fields are invalid");
					return Promise.reject();
				}
				else
				{
					var isAssociated = false, associatedWithThisRecord = false;
					if (this.obSelectedAssociations)
					{
						var associations = [];

						this.obSelectedAssociations().forEach(function(item)
						{
							if (item.FieldType === this.parentType && item.Id === this.parentId)
							{
								associatedWithThisRecord = true;
							}
							if (item.Id !== 0) { associations.push({ AttachedToType: item.FieldType, AttachedToId: item.Id }); }
							else { isAssociated = true; }
						}.bind(this));

						this.obEntityDataModel().documentRelationshipEntities(associations);
					}

					if (this.obEntityDataModel().id() > 0)
					{

						var saveEditDocument = function()
						{
							return { pendingChange: { isAssociated: isAssociated, ids: [this.obEntityDataModel().id()], associations: associations }, data: this.obEntityDataModel().toData() };
						}.bind(this);
						if (this.obSelectedAssociations().length <= 0 && this.parentType && this.parentId)
						{
							return tf.promiseBootbox.yesNo({
								message: "There are no other records associated with this file. Would you like to delete this file from the Document Center?",
								backdrop: true, title: "Confirmation Message", closeButton: true
							})
								.then(function(result)
								{
									if (result === true)
									{
										return tf.promiseAjax.delete(pathCombine(tf.api.apiPrefix(), "document"), {
											data: [this.obEntityDataModel().id()]
										})
											.then(function()
											{
												return { pendingChange: { isAssociated: false, ids: [this.obEntityDataModel().id()], isDeleted: true }, data: this.obEntityDataModel().toData() };
												//return true;
											}.bind(this));
									}
									if (result === false)
									{
										return saveEditDocument();
									}
								}.bind(this));
						}
						return saveEditDocument();
					}
					else
					{
						var saveAddDocument = function()
						{
							return { pendingChange: { isAssociated: isAssociated, ids: [], associations: associations }, data: this.obEntityDataModel().toData() };
						}.bind(this);

						if (this.documentData)
						{
							return saveAddDocument();
						}
						if (this.obEntityDataModel().documentEntities().length == 0)
						{
							// may pop up error("At least one file need be uploaded!");
							return;
						}
						if (!associatedWithThisRecord && this.parentType && (this.parentId || this.parentType === "fieldtriptemplate"))
						{
							return tf.promiseBootbox.yesNo({
								message: "You have disassociated " + (this.obEntityDataModel().documentEntities().length > 1 ? "these files" : "this file") + " from this record. If you continue, "
									+ (this.obEntityDataModel().documentEntities().length > 1 ? "they" : "it") + " will be uploaded to the Document Center. "
									+ (this.obEntityDataModel().documentEntities().length > 1 ? "They" : "It") + " will not be associated with this record. Are you sure you want to upload "
									+ (this.obEntityDataModel().documentEntities().length > 1 ? "these files" : "this file") + "?",
								backdrop: true, title: "Confirmation Message", closeButton: true
							})
								.then(function(result)
								{
									if (result === true)
									{
										return saveAddDocument();
									}
									if (result === false)
									{
										var currentAssociations = this.obSelectedAssociations();
										currentAssociations.push(this.associations[0]);
										this.obSelectedAssociations(currentAssociations);
										return false;
									}
								}.bind(this));
						}
						return saveAddDocument();
					}
				}
			}.bind(this));
	};

	EditDocumentViewModel.prototype.setInitAssociations = function(associations)
	{
		this.associations = associations;
	}

	EditDocumentViewModel.prototype.init = function(viewModel, el)
	{
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "documentclassification"))
			.then(function(data)
			{
				var docClsItems = (data && Array.isArray(data.Items)) ? data.Items.filter(function(item)
				{
					return !!$.trim(item.Name);
				}) : [];
				this.obClassificationDataModels(docClsItems);
				if (this.documentData)
				{
					var documentEntity = new TF.DataModel.DocumentDataModel().toData();
					documentEntity.Id = this.documentData.Id;
					documentEntity.Filename = this.documentData.Filename;
					documentEntity.FileSizeKb = this.documentData.FileSizeKb;
					documentEntity.LastUpdated = moment().format("MM/DD/YYYY");
					documentEntity.LastUpdatedName = tf.authManager.authorizationInfo.authorizationTree.username;
					documentEntity.DocumentClassificationId = this.documentData.DocumentClassificationId;
					documentEntity.Description = this.documentData.Description;
					documentEntity.DocumentEntity = this.documentData.DocumentEntity;
					documentEntity.APIIsNew = false;
					documentEntity.APIIsDirty = false;
					documentEntity.APIToDelete = false;
					this.obEntityDataModel(new TF.DataModel.DocumentDataModel(documentEntity));
					this.obEntityDataModel().documentEntity = this.documentData.DocumentEntity;
					this.obEntityDataModel().DocumentEntities = this.documentData.DocumentEntities;
					this.obEntityDataModel().lastUpdated = ko.observable(this.documentData.LastUpdated);
					var classificationDataModels = this.obClassificationDataModels();
					var classificationDataModel = Enumerable.From(classificationDataModels).Where(function(c)
					{
						return c.Id === this.obEntityDataModel().documentClassificationId();
					}.bind(this)).ToArray()[0];
					this.obSelectedDocumentClassification(classificationDataModel);
				}
			}.bind(this));

		var self = this, isValidating = false;
		this.$form = $(el);

		this.$uploadedFile = this.$form.find('#uploadedFileInput');
		this.$uploadedFileInput = this.$form.find('input[type=file]');
		var validatorFields = {
			documentClassification: {
				trigger: "blur change",
				validators: {
					notEmpty: {
						message: "required"
					}
				}
			},
			fileName: {
				trigger: "blur change",
				validators: {
					notEmpty: {
						message: "required"
					}
				}
			},
			upload: {
				trigger: "",
				validators: {
					callback: {
						message: "failed to upload: document already exists.",
						callback: function(value, validator)
						{
							if (self.documentData)
							{
								return true;
							}
							if (!self.obEntityDataModel().documentEntities())
							{
								return true;
							}
							var filter = (self.obEntityDataModel().documentEntities().filter(function(item)
							{
								if (item.UploadFailed)
								{
									self.pageLevelViewModel.failedDocumentNames.push(item.Filename);
									return true;
								}
							}));
							return filter.length <= 0;
						}
					}
				}
			}
		};
		this.$form.bootstrapValidator({
			excluded: [':hidden', ':not(:visible)'],
			live: 'enabled',
			message: 'This value is not valid',
			fields: validatorFields
		})
			.on('error.validator.bv', function(e, data)
			{
				if ("upload" == data.field)
				{
					data.element
						.data('bv.messages')
						.find('.help-block[data-bv-for="' + data.field + '"]').hide();
					return;
				}
			}).on('success.field.bv', function(e, data)
			{
				if (!isValidating)
				{
					isValidating = true;
					self.pageLevelViewModel.saveValidate(data.element);
					isValidating = false;
				}
			});

		this.pageLevelViewModel.load(this.$form.data("bootstrapValidator"));
	};
	EditDocumentViewModel.prototype.deleteFileClick = function(fileModel, event)
	{
		this.obEntityDataModel().documentEntities.remove(function(item)
		{
			return item.Filename == fileModel.Filename;
		});
		$("input#inputFile").val("");
	}

	EditDocumentViewModel.prototype.UploadedFileChangeEvent = function(viewModel, e)
	{
		var files = e.target.files;
		this.UploadedFile(files);
	};

	EditDocumentViewModel.prototype.UploadedFile = function(files)
	{
		var self = this;
		var uploadFail = false;

		if (files && files.length)
		{
			for (var i = 0; i < files.length; i++)
			{
				var file = files[i];
				var reader = new FileReader();
				self.obEntityDataModel().filename(file.name);
				var step = 1024 * 10;
				var loaded = 0;
				var total = file.size;
				var fileModel = { Filename: file.name, FileProgress: ko.observable("0%"), UploadFailed: uploadFail };
				var content = "";
				reader.fileName = file.name;
				self.obEntityDataModel().documentEntities.push(fileModel);
				self.$uploadedFile.change();

				reader.onprogress = function(event)
				{
					loaded += event.loaded;
					var fileModel = Enumerable.From(self.obEntityDataModel().documentEntities()).Where(function(c)
					{
						return c.Filename === event.target.fileName
					}).ToArray()[0];
					if (fileModel)
					{
						fileModel.FileProgress(loaded * 100 / total + "%");
					}
				}.bind(this);
				reader.onload = function(event)
				{
					var fileModel = Enumerable.From(self.obEntityDataModel().documentEntities()).Where(function(c)
					{
						return c.Filename === event.target.fileName
					}).ToArray()[0];
					if (fileModel)
					{
						fileModel.FileProgress("100%");
						fileModel.FileContent = event.target.result;
					}
				}.bind(this);
				reader.readAsDataURL(file);
			}
		}
	}

	EditDocumentViewModel.prototype.apply = function()
	{
		return this.save()
			.then(function(response)
			{
				return response;
			})
			.catch(function()
			{

			});
	};

	EditDocumentViewModel.prototype.dispose = function()
	{
		this.pageLevelViewModel.dispose();
	};

})();


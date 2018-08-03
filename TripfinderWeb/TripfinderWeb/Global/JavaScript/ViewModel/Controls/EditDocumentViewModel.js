(function()
{
	createNamespace('TF.Control').EditDocumentViewModel = EditDocumentViewModel;

	function EditDocumentViewModel(objtype, objid, documentId, files, obSelectedAssociations, parentType, parentId)
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

	function byteLength(str)
	{
		// returns the byte length of an utf8 string
		var bytes = str.length;
		for (var i = str.length - 1; i >= 0; i--)
		{
			var code = str.charCodeAt(i);
			if (code > 0x7f && code <= 0x7ff) bytes++;
			else if (code > 0x7ff && code <= 0xffff) bytes += 2;
			if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
		}
		return bytes / 1024;
	}

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
							return tf.promiseAjax.put(pathCombine(tf.api.apiPrefix(), "document", this.objtype, this.objid, this.obEntityDataModel().id()),
								{ data: this.obEntityDataModel().toData() })
								.then(function()
								{
									return { pendingChange: { isAssociated: isAssociated, ids: [this.obEntityDataModel().id()], associations: associations }, data: this.obEntityDataModel().toData() };
								}.bind(this));
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
							// return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "document", this.objtype, this.objid),
							// 	{ data: this.obEntityDataModel().toData() })
							// 	.then(function(response)
							// 	{
							// flag determines whether to add or remove association
							this.obEntityDataModel().fileSizeKb(byteLength(this.obEntityDataModel().toData().DocumentEntities[0].FileContent));
							return { pendingChange: { isAssociated: isAssociated, ids: [], associations: associations }, data: this.obEntityDataModel().toData() };
							// }.bind(this));
						}.bind(this);

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
			}.bind(this))
	}

	EditDocumentViewModel.prototype.setInitAssociations = function(associations)
	{
		this.associations = associations;
	}

	EditDocumentViewModel.prototype.init = function(viewModel, el)
	{
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "documentclassification"))
			.then(function(data)
			{
				this.obClassificationDataModels(data.Items);
				if (this.obEntityDataModel().id() > 0)
				{
					tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "document", this.obEntityDataModel().id()))
						.then(function(data)
						{
							this.obEntityDataModel(new TF.DataModel.DocumentDataModel(data.Items[0]));
							var classificationDataModels = this.obClassificationDataModels();
							var classificationDataModel = Enumerable.From(classificationDataModels).Where(function(c)
							{
								return c.Id === this.obEntityDataModel().documentClassificationId()
							}.bind(this)).ToArray()[0];
							this.obSelectedDocumentClassification(classificationDataModel);
						}.bind(this));
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
		if (files && files.length)
		{
			for (var i = 0; i < files.length; i++)
			{
				tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "document", "unique"), { data: new TF.DataModel.DocumentDataModel({ Filename: files[i].name, Id: 0 }).toData() })
					.then(function(apiResponse)
					{
						for (var j = 0; j < this.model.obEntityDataModel().documentEntities().length; j++)
						{
							if (this.model.obEntityDataModel().documentEntities()[j].Filename === this.file.name)
							{
								return;
							}
						}

						var file = this.file;
						var reader = new FileReader();
						this.model.obEntityDataModel().filename(file.name);
						var step = 1024 * 10;
						var loaded = 0;
						var total = file.size;
						var fileModel = { Filename: file.name, FileProgress: ko.observable("0%"), UploadFailed: !apiResponse.Items[0] };
						var content = "";
						reader.fileName = file.name;
						this.model.obEntityDataModel().documentEntities.push(fileModel);
						self.$uploadedFile.change();

						reader.onprogress = function(event)
						{
							loaded += event.loaded;
							var fileModel = Enumerable.From(this.model.obEntityDataModel().documentEntities()).Where(function(c)
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
							var fileModel = Enumerable.From(this.model.obEntityDataModel().documentEntities()).Where(function(c)
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
					}.bind({ model: this, file: files[i] }));
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


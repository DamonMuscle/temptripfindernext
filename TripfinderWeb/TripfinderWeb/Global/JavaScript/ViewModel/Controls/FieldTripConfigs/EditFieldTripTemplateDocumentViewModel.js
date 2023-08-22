(function()
{
	createNamespace("TF.Control").EditFieldTripTemplateDocumentViewModel = EditFieldTripTemplateDocumentViewModel;

	function EditFieldTripTemplateDocumentViewModel(entity, classificationList)
	{
		let self = this;
		self.isNew = !entity;
		self.deleteFileClick = self.deleteFileClick.bind(self);
		self.entity = entity || {};

		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();

		self.obClassificationList = ko.observableArray(classificationList);
		self.obSelectedClassification = ko.observable(classificationList.find(x => self.entity &&
			(self.entity.DocumentClassificationID == x.key || (self.entity.classification && self.entity.classification.key === x.key))));
		self.obSelectedClassificationText = ko.computed(function()
		{
			return (self.obSelectedClassification() || {}).value;
		});

		self.obAttachedFiles = ko.observableArray([]);

		self.obDisplayFileName = ko.computed(function()
		{
			if (!self.isNew)
			{
				return self.entity.FileName;
			}

			var file = self.obAttachedFiles() || [];
			switch (file.length)
			{
				case 0:
					return "";
				case 1:
					return file[0].name;
				default:
					return "multiple files associated";
			}
		});

		self.obDescription = ko.observable(self.entity.Description);
	}

	EditFieldTripTemplateDocumentViewModel.prototype.init = function(viewModel, el)
	{
		let self = this;
		self.$el = $(el);
	};

	EditFieldTripTemplateDocumentViewModel.prototype.afterRender = function()
	{
		let self = this,
			isValidating = false,
			validatorFields = {
				documentClassificationName: {
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
				}
			};

		self.$el.bootstrapValidator({
			excluded: [':hidden', ':not(:visible)'],
			live: 'enabled',
			message: 'This value is not valid',
			fields: validatorFields
		}).on('error.validator.bv', function(e, data)
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

		self.pageLevelViewModel.load(self.$el.data("bootstrapValidator"));
	};

	EditFieldTripTemplateDocumentViewModel.prototype.onFileChangeEvent = function(viewModel, e)
	{
		var self = this,
			files = e.target.files,
			isFileValid = self.readFiles(files);
		if (!isFileValid)
		{
			e.target.value = '';
		}
	};

	EditFieldTripTemplateDocumentViewModel.prototype.readFiles = function(files)
	{
		files = Array.from(files);
		let self = this;

		self.obAttachedFiles([]);

		return files.reduce(function(isFileValid, file)
		{
			if (!isFileValid) return false;

			let index = file.name.lastIndexOf('.'),
				extension = file.name.substr(index, file.name.length - index).toLowerCase();
			let extensionCheck = index > 0 && TF.DetailView.UploadDocumentHelper.acceptFileExtensions.includes(extension);
			if (!extensionCheck)
			{
				tf.promiseBootbox.alert("Invalid file extension.");
				return false;
			}

			let fileSizeCheck = file.size < TF.DetailView.UploadDocumentHelper.maxFileByteSize;
			if (!fileSizeCheck)
			{
				var maxFileMBSize = parseInt(TF.DetailView.UploadDocumentHelper.maxFileByteSize / 1024 / 1024);
				tf.promiseBootbox.alert(`File size must be less than ${maxFileMBSize} MB.`);
				return false;
			}

			let reader = new FileReader();
			reader.onload = function()
			{
				self.obAttachedFiles(self.obAttachedFiles().concat({
					originalFile: file,
					name: file.name,
					size: file.size,
					type: file.type,
					lastModifiedDate: file.lastModifiedDate
				}))
			};
			reader.readAsDataURL(file);

			return true;
		}, true);
	};

	EditFieldTripTemplateDocumentViewModel.prototype.deleteFileClick = function(file)
	{
		let self = this;
		self.obAttachedFiles(self.obAttachedFiles().filter(x => x != file));
	};

	EditFieldTripTemplateDocumentViewModel.prototype.apply = function()
	{
		let self = this;

		return self.pageLevelViewModel.saveValidate().then(function(result)
		{
			if (result)
			{
				if (!self.isNew)
				{
					return { ...self.entity, description: self.obDescription(), classification: self.obSelectedClassification() }
				}

				return self.obAttachedFiles().map(x => ({ ...x, description: self.obDescription(), classification: self.obSelectedClassification() }));
			}
		});
	};
})();
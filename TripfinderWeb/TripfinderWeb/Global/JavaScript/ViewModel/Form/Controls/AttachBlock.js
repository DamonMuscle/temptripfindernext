(function()
{
	var CONFIRMATION_TITLE = "Confirmation Message";
	createNamespace("TF.Control.Form").AttachBlock = AttachBlock;

	function AttachBlock(options, form)
	{
		var self = this;

		self.$formRoot = form.elem;
		self.uploadDocumentHelper = form.uploadDocumentHelper;
		self.attachFileChangedEvent = form.attachFileChangedEvent;
		self.attachedDocuments = [];
		self.attachedDocumentsName = [];
		self.formDocuments = [];
		self.uniqueClassName = "form-attach";
		self.readonly = !!options.readonly;

		self.refresh = self.refresh.bind(self);

		self.$el = $(`<div style='margin-top:10px'>
					<div class= 'attach-document-block' >
								<div class='item-content'>
                                    <div class='place-holder'>Drop files to add documents, or <span class='browse-file'>browse</span></div>
									<input type='file' id='document-file-selector' multiple='multiple' style='display:none' accept='*.*' />
									<div class='document-list'>
									<div class='browse-file'></div>
									</div>
								</div>
							</div >
							<span class='invalid-message'></span>
						</div>`);

		self.$fileSelector = self.$el.find("#document-file-selector").bind("change", self.uploadedFilesChangeEvent.bind(self));
		self.initEvents();
	}

	AttachBlock.prototype = Object.create(TF.Control.Form.AttachBlock.prototype);
	AttachBlock.prototype.constructor = AttachBlock;

	Object.defineProperty(AttachBlock.prototype, 'dirty', {
		get()
		{
			if (this.initialFormDocuments)
			{
				if (this.initialFormDocuments.length !== this.formDocuments.length)
				{
					return true;
				}
				else
				{
					return this.formDocuments.some((doc, index) =>
					{
						return doc.Name !== this.initialFormDocuments[index].Name
							|| doc.FileSizeKB !== this.initialFormDocuments[index].FileSizeKB
							|| doc.MimeType !== this.initialFormDocuments[index].MimeType;
					})
				}
			}
			else
			{
				return this.formDocuments.length > 0;
			}
		}
	});

	AttachBlock.prototype.uploadedFilesChangeEvent = function(e)
	{
		let self = this, files = e.target.files;
		if (files.length > 0)
		{
			self.uploadedFiles(files);
		}
	};

	AttachBlock.prototype.uploadedFiles = function(files)
	{
		let self = this, validateFiles = [], filesNumber = self.attachedDocumentsName.length;
		if (filesNumber === 5)
		{
			return;
		}
		// max number of files is 5
		_.each(files, (file) =>
		{
			if (filesNumber < 5)
			{
				validateFiles.push(file);
				filesNumber++;
			}
		});

		// update valid attched documents
		self.updateAttachedDocuments(validateFiles);
	}

	AttachBlock.prototype.getAdaptiveFileStream = function(index)
	{
		var self = this;

		if (!self.uploadDocumentHelper) return;

		var uploadFiles = self.attachedDocuments;

		if (Array.isArray(uploadFiles) && uploadFiles.length > 0)
		{
			var rawFile = uploadFiles[index];

			if (self.formDocuments[index])
			{
				return Promise.resolve({
					FileName: self.formDocuments[index].Name,
					MimeType: self.formDocuments[index].MimeType,
					FileContent: self.formDocuments[index].FileContentBase64
				});
			}
			else 
			{

				return self.uploadDocumentHelper.getFileStream(rawFile)
					.then(function(fileStream)
					{
						if (fileStream)
						{
							var fileStreamSplit = fileStream.split(",");
							return {
								FileName: rawFile.name,
								MimeType: rawFile.type,
								FileContent: fileStreamSplit.length == 2 ? _.last(fileStream.split(",")) : ""
							};
						}
					});

			}
		}

		return Promise.resolve(false);
	};

	AttachBlock.prototype.showDocumentPreview = function(document)
	{
		tf.docFilePreviewHelper.show(document);
	};

	AttachBlock.prototype.browseAttachFile = function(e)
	{
		var self = this,
			$fileSelector = self.$formRoot.find('#document-file-selector');
		if (self.$el.find(".browse-file").hasClass("disable-upload"))
		{
			return;
		}

		e.stopPropagation();
		$fileSelector.trigger('click');
	};

	AttachBlock.prototype.initEvents = function()
	{
		var self = this;

		self.$el.on("click", ".browse-file", self.browseAttachFile.bind(self));
		self.$el.on('click', ".preview", function(e)
		{
			let conentWrapper = $(e.currentTarget).closest(".content-wrapper"),
				index = conentWrapper.index(".content-wrapper");
			self.getAdaptiveFileStream(index).then(function(document)
			{
				if (!document) return;

				self.showDocumentPreview(document);
			});
		});

		self.$el.on("click", ".download", function(e)
		{
			let conentWrapper = $(e.currentTarget).closest(".content-wrapper"),
				index = conentWrapper.index(".content-wrapper");
			self.getAdaptiveFileStream(index).then(function(document)
			{
				var helper = tf.docFilePreviewHelper;
				if (document && document.FileContent)
				{
					helper.initDownloadOnBrowser(document.FileName, document.MimeType, document.FileContent);
				}
			});
		});

		self.$el.on('click', '.trash-can', function(e)
		{
			let conentWrapper = $(e.currentTarget).closest(".content-wrapper"),
				index = conentWrapper.index(".content-wrapper");
			e.stopPropagation();

			var currentAttachedFileName = self.attachedDocumentsName[index],
				confirmMsg = String.format("Are you sure you want to remove the attached file \"{0}\"?", currentAttachedFileName);

			tf.promiseBootbox.yesNo(confirmMsg, CONFIRMATION_TITLE)
				.then(function(result)
				{
					if (result)
					{
						if (self.uploadDocumentHelper)
						{
							self.attachedDocuments.splice(index, 1);
							self.attachedDocumentsName.splice(index, 1);
							self.formDocuments.splice(index, 1);
							self.refresh();
							self.$el.find("#document-file-selector").val("");
						}
					}
				});
		});
	};

	AttachBlock.prototype.updateAttachedDocuments = function(files)
	{
		let self = this;
		// filter duplicated file 
		var filterFiles = files.filter((file) =>
		{
			return self.attachedDocumentsName.indexOf(file.name) === -1;
		});

		if (filterFiles.length === 0) return;

		self.attachedDocuments = self.attachedDocuments.concat(filterFiles);
		self.refresh();

		//update form documents
		self.updateFormDocuments(filterFiles);
	};

	AttachBlock.prototype.refresh = function()
	{
		let self = this, trashFlag = TF.isMobileDevice ? " &times;" : "";
		//self.$el.find(".document-list").empty();
		self.$el.find(".content-wrapper").remove();
		self.attachedDocumentsName = [];
		self.attachedDocuments.forEach((file) =>
		{
			let isvalid = self.uploadDocumentHelper.validateFile(file.name, file.size);
			let fileElem = $(`<div class='content-wrapper' title='${file.name}'>
										<div class='file-container'>
											<div class='file-icon'></div>
											<div class='file-name'>${file.name}</div>
										</div>
										<div class='control-bar'>
											<a class='preview invisible'>Preview</a>
											<a class='download'>Download</a>
											<span class='file-warning'>&#9888;</span>
											${self.readonly ? "" : `<span class='trash-can'>${trashFlag}</span>`}
										</div>
									</div>`),

				isDocFilePreviewable = tf.docFilePreviewHelper.isFilePreviewable(file.type);
			if (!isvalid) fileElem.addClass("invalid-file");
			self.attachedDocumentsName.push(file.name);
			if (!isDocFilePreviewable)
			{
				fileElem.find(".preview").addClass("invisible");
			}
			else
			{
				fileElem.find(".preview").removeClass("invisible");
			}
			self.$el.find(".document-list").append(fileElem);
		});

		if (self.$el.find('.invalid-file').length > 0)
		{
			self.$el.find('.invalid-message').html("Some files do not match the supported size or formats.");
			self.$el.find('.attach-document-block').addClass("has-invalid");
		} else
		{
			self.$el.find('.invalid-message').html("");
			self.$el.find('.attach-document-block').removeClass("has-invalid");
		}

		if (self.attachedDocumentsName.length === 5)
		{
			self.$el.find(".browse-file").addClass("disable-upload");
			self.$formRoot.find(".maxnum-desc").html("5 file maximum reached");
		} else
		{
			self.$el.find(".browse-file").removeClass("disable-upload");
			self.$formRoot.find(".maxnum-desc").html("");
		}

		if (self.readonly) 
		{
			self.$el.find(".browse-file").addClass("disable-upload");
			self.$formRoot.find(".maxnum-desc").html("");
		}
	}

	AttachBlock.prototype.updateFormDocuments = function(rawFiles)
	{
		let self = this;
		rawFiles.forEach((rawFile) =>
		{
			self.uploadDocumentHelper.getFileStream(rawFile)
				.then(function(fileStream)
				{
					if (fileStream)
					{
						var fileStreamSplit = fileStream.split(","),
							document = {
								DBID: tf.datasourceManager.databaseId,
								Name: rawFile.name.substr(0, rawFile.name.lastIndexOf(".")),
								FileName: rawFile.name,
								FileSizeKB: rawFile.size / 1000,
								MimeType: rawFile.type,
								FileContentBase64: fileStreamSplit.length == 2 ? _.last(fileStream.split(",")) : ""
							};
						self.formDocuments.push(document);
					} else
					{
						self.formDocuments.push({});
					}
				});
		});
	}

	AttachBlock.prototype.restore = function(docs)
	{
		const self = this;
		docs.forEach(doc =>
		{
			self.attachedDocuments.push({ documentId: doc.Id, name: doc.FileName, size: doc.FileSizeKB * 1000, type: doc.MimeType });
			self.formDocuments.push({
				documentId: doc.Id,
				DBID: tf.datasourceManager.databaseId,
				Name: doc.Name,
				FileName: doc.FileName,
				FileSizeKB: doc.FileSizeKB,
				MimeType: doc.MimeType,
				FileContentBase64: doc.FileContentBase64
			});
		})
		self.refresh();

		self.initialFormDocuments = self.formDocuments.map(d => d); //clone
	}

	AttachBlock.prototype.validate = function()
	{
		let self = this, invalidFiles = self.$el.find('.invalid-file');
		if (invalidFiles.length === 0)
		{
			return Promise.resolve(true);
		}
		else
		{
			return Promise.reject(false);
		}
	}

	AttachBlock.prototype._unbindDragAndDropFileEvent = function()
	{
		$(document).off('dragover.form' + ' dragenter.form'
			+ ' dragleave.form' + ' dragend.form' + ' drop.form');
	};

	AttachBlock.prototype.dispose = function()
	{
		var self = this;
		self.attachedDocuments = [];
		self.attachedDocumentsName = [];
		self.formDocuments = [];
		self.uploadDocumentHelper.dispose();
		self._unbindDragAndDropFileEvent();
		self.$el.off('click');
	};
})();
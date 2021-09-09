(function () {
	var CONFIRMATION_TITLE = "Confirmation Message";
	createNamespace("TF.Control.Form").AttachBlockQuestion = AttachBlock;

	function AttachBlock() {
		TF.Control.Form.BaseQuestion.apply(this, arguments);
		var self = this;
		self.attachedDocuments = [];
		self.attachedDocumentsName = [];
		self.formDocuments = [];
		self.uniqueClassName = "form-attach";
		self.refresh = self.refresh.bind(self);
		self.uploadDocumentHelper = new TF.Form.UploadDocumentHelper(self);
	}

	AttachBlock.prototype = Object.create(TF.Control.Form.BaseQuestion.prototype);
	AttachBlock.prototype.constructor = AttachBlock;

	Object.defineProperty(AttachBlock.prototype, 'dirty', {
		get() {
			if (this.initialFormDocuments) {
				if (this.initialFormDocuments.length !== this.formDocuments.length) {
					return true;
				}
				else {
					return this.formDocuments.some((doc, index) => {
						return doc.Name !== this.initialFormDocuments[index].Name
							|| doc.FileSizeKB !== this.initialFormDocuments[index].FileSizeKB
							|| doc.MimeType !== this.initialFormDocuments[index].MimeType;
					})
				}
			}
			else {
				return this.formDocuments.length > 0;
			}
		}
	});

	AttachBlock.prototype.initQuestionContent = function () {
		let self = this;
		let $attachmentContent = $(`<div class= 'attachment-question attachment-container' >
								<div class='item-content attach-document-block'>
                                    <div class='place-holder'>Drop files to add documents, or <span class='browse-file'>browse</span></div>
									<input type='file' id='document-file-selector' multiple='multiple' style='display:none' accept='*.*' />
									<div class='document-list'>
										<div class='browse-file'></div>
									</div>
								</div>
							</div >
						</div>`);
		if (self.field.readonly) {
			$attachmentContent.find(".browse-file").addClass("disable-upload");
		}
		return $attachmentContent;
	}

	AttachBlock.prototype.uploadedFilesChangeEvent = function (e) {
		let self = this, files = e.target.files;
		if (files.length > 0) {
			self.uploadedFiles(files);
		}
	};

	AttachBlock.prototype.uploadedFiles = function (files) {
		let self = this, validateFiles = [], filesNumber = self.attachedDocumentsName.length;
		if (filesNumber === 5) {
			return;
		}
		// max number of files is 5
		_.each(files, (file) => {
			if (filesNumber < 5) {
				validateFiles.push(file);
				filesNumber++;
			}
		});

		// update valid attched documents
		self.updateAttachedDocuments(validateFiles);
	}

	AttachBlock.prototype.getAdaptiveFileStream = function (index) {
		var self = this;

		if (!self.uploadDocumentHelper) return;

		var uploadFiles = self.attachedDocuments;

		if (Array.isArray(uploadFiles) && uploadFiles.length > 0) {
			var rawFile = uploadFiles[index];

			if (self.formDocuments[index]) {
				return Promise.resolve({
					FileName: self.formDocuments[index].Name,
					MimeType: self.formDocuments[index].MimeType,
					FileContent: self.formDocuments[index].FileContentBase64
				});
			}
			else {

				return self.uploadDocumentHelper.getFileStream(rawFile)
					.then(function (fileStream) {
						if (fileStream) {
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

	AttachBlock.prototype.showDocumentPreview = function (document) {
		tf.docFilePreviewHelper.show(document);
	};

	AttachBlock.prototype.browseAttachFile = function (e) {
		var self = this,
			$fileSelector = self.elem.find('#document-file-selector');
		if (self.elem.find(".browse-file").hasClass("disable-upload")) {
			return;
		}

		e.stopPropagation();
		$fileSelector.trigger('click');
	};

	AttachBlock.prototype.initEvents = function () {
		var self = this;

		self.elem.on("click", ".browse-file", self.browseAttachFile.bind(self));
		self.elem.on("change", "#document-file-selector", self.uploadedFilesChangeEvent.bind(self));
		self.elem.on('click', ".preview", function (e) {
			let conentWrapper = $(e.currentTarget).closest(".content-wrapper"),
				index = self.elem.find('.content-wrapper').index(conentWrapper);
			self.getAdaptiveFileStream(index).then(function (document) {
				if (!document) return;

				self.showDocumentPreview(document);
			});
		});

		self.elem.on("click", ".download", function (e) {
			let conentWrapper = $(e.currentTarget).closest(".content-wrapper"),
				index = self.elem.find('.content-wrapper').index(conentWrapper);
			self.getAdaptiveFileStream(index).then(function (document) {
				var helper = tf.docFilePreviewHelper;
				if (document && document.FileContent) {
					helper.initDownloadOnBrowser(document.FileName, document.MimeType, document.FileContent);
				}
			});
		});

		self.elem.on('click', '.trash-can', function (e) {
			let conentWrapper = $(e.currentTarget).closest(".content-wrapper"),
				index = self.elem.find('.content-wrapper').index(conentWrapper);
			e.stopPropagation();

			var currentAttachedFileName = self.attachedDocumentsName[index],
				confirmMsg = String.format("Are you sure you want to remove the attached file \"{0}\"?", currentAttachedFileName);

			tf.promiseBootbox.yesNo(confirmMsg, CONFIRMATION_TITLE)
				.then(function (result) {
					if (result) {
						if (self.uploadDocumentHelper) {
							self.attachedDocuments.splice(index, 1);
							self.attachedDocumentsName.splice(index, 1);
							self.formDocuments.splice(index, 1);
							self.refresh();
							self.elem.find("#document-file-selector").val("");
						}
					}
				});
		});
	};

	AttachBlock.prototype.updateAttachedDocuments = function (files) {
		let self = this;
		// filter duplicated file 
		var filterFiles = files.filter((file) => {
			return self.attachedDocumentsName.indexOf(file.name) === -1;
		});

		if (filterFiles.length === 0) return;

		self.attachedDocuments = self.attachedDocuments.concat(filterFiles);
		//update form documents
		self.updateFormDocuments(filterFiles).then(() => self.refresh());
	};

	AttachBlock.prototype.refresh = function () {
		let self = this, trashFlag = TF.isMobileDevice ? " &times;" : "";
		//self.elem.find(".document-list").empty();
		self.elem.find(".content-wrapper").remove();
		self.attachedDocumentsName = [];
		self.attachedDocuments.forEach((file) => {
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
											${self.field.readonly ? "" : `<span class='trash-can'>${trashFlag}</span>`}
										</div>
									</div>`),

				isDocFilePreviewable = tf.docFilePreviewHelper.isFilePreviewable(file.type);
			if (!isvalid) fileElem.addClass("invalid-file");
			self.attachedDocumentsName.push(file.name);
			if (!isDocFilePreviewable) {
				fileElem.find(".preview").addClass("invisible");
			}
			else {
				fileElem.find(".preview").removeClass("invisible");
			}
			self.elem.find(".document-list").append(fileElem);
		});

		if (self.elem.find('.invalid-file').length > 0) {
			self.elem.find('.invalid-message').html("Some files do not match the supported size or formats.");
			self.elem.find('.attach-document-block').addClass("has-invalid");
		} else {
			self.elem.find('.invalid-message').html("");
			self.elem.find('.attach-document-block').removeClass("has-invalid");
		}

		if (self.attachedDocumentsName.length === 5) {
			self.elem.find(".browse-file").addClass("disable-upload");
			self.elem.find(".title-close-warn-msg").html("5 file maximum reached");
		} else {
			self.elem.find(".browse-file").removeClass("disable-upload");
			self.elem.find(".title-close-warn-msg").html("");
		}
		if (self.field.readonly) {
			self.elem.find(".browse-file").addClass("disable-upload");
		}
		self.value = self.formDocuments;
	}

	AttachBlock.prototype.updateFormDocuments = function (rawFiles) {
		let self = this, skipSize = self.formDocuments.length;
		let translate2Base64PromiseArr = []
		rawFiles.forEach((rawFile, i) => {
			translate2Base64PromiseArr.push(
				self.uploadDocumentHelper.getFileStream(rawFile)
					.then(function (fileStream) {
						if (fileStream) {
							if (TF.isMobileDevice && rawFile.name === 'image.jpg') {
								self.photoNameTimeStamp = Date.now();
								let fileStreamSplit = fileStream.split(",");
								let fileName = self.attachedDocumentsName[i + skipSize];
								document = {
									DBID: tf.datasourceManager.databaseId,
									Name: fileName.substr(0, fileName.lastIndexOf(".")),
									FileName: fileName,
									FileSizeKB: rawFile.size / 1000,
									MimeType: rawFile.type,
									FileContentBase64: fileStreamSplit.length == 2 ? _.last(fileStream.split(",")) : ""
								};
								self.formDocuments.push(document);
							} else {
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
							}

						}
						else {
							self.formDocuments.push({});
						}
					}));
		})
		return Promise.all(translate2Base64PromiseArr);
	}

	AttachBlock.prototype.restore = function (docs) {
		const self = this;
		docs.forEach(doc => {
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
		self.value = self.formDocuments;
		self.initialFormDocuments = self.formDocuments.map(d => d); //clone
	}

	AttachBlock.prototype.getValidateResult = function () {
		let result = '';
		if (this.isRequired && (this.value == null || this.value.length === 0)) {
			result = 'Answer is required.';
		}

		if (this.elem.find(".document-list .content-wrapper.invalid-file").length >= 1) {
			result = 'Some files do not match the supported size or formats.';
		}

		return result;
	}

	AttachBlock.prototype.hasValue = function () {
		return this.value != null && this.value.length >= 1;
	}

	AttachBlock.prototype._unbindDragAndDropFileEvent = function () {
		$(document).off('dragover.form' + ' dragenter.form'
			+ ' dragleave.form' + ' dragend.form' + ' drop.form');
	};

	AttachBlock.prototype.dispose = function () {
		var self = this;
		self.attachedDocuments = [];
		self.attachedDocumentsName = [];
		self.formDocuments = [];
		// self.uploadDocumentHelper.dispose();
		// self._unbindDragAndDropFileEvent();
		self.elem.off('click');
	};
})();
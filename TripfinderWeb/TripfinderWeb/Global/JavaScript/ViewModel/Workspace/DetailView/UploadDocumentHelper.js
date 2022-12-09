(function()
{
	createNamespace("TF.DetailView").UploadDocumentHelper = UploadDocumentHelper;

	function UploadDocumentHelper(detailView, noselected)
	{
		var self = this;
		var options = {
			maxFileByteSize: UploadDocumentHelper.maxFileByteSize,
			acceptFileExtensions: UploadDocumentHelper.acceptFileExtensions,
			acceptMimeType: UploadDocumentHelper.acceptMimeType
		}
		if (noselected === undefined)
		{
			options.onFileSelected = self.onFileSelected.bind(self);
		}
		self.uploadHelper = new TF.UploadHelper(options);
		self.uploader = null;
		self.detailView = detailView;
		self.$fileSelector = null;

		self.fileDrop = new TF.Events.Event();
	};

	UploadDocumentHelper.maxFileByteSize = 50 * 1024 * 1024; // 50MB
	UploadDocumentHelper.acceptFileExtensions = ['.csv', '.aac', '.3g2', '.bmp', '.doc', '.aiff', '.3gp', '.gif', '.docm', '.au',
		'.asf', '.jpeg', '.docx', '.m4a', '.avi', '.jpg', '.dotm', '.mp3', '.divx', '.png', '.dotx',
		'.ogg', '.flv', '.tif', '.tiff', '.htm', '.rmi', '.m2ts', '.wmf', '.html', '.wav', '.m4v', '.odp',
		'.wma', '.mkv', '.odt', '.mov', '.pdf', '.mp4', '.pps', '.mpe', '.ppt', '.mpeg', '.pptx', '.mpeg4',
		'.rtf', '.mpg', '.txt', '.ogv', '.xls', '.qt', '.xlsx', '.swf', '.xps', '.vob', '.wmv', '.tfformconfiguration'];
	UploadDocumentHelper.acceptMimeType = "*.*";

	UploadDocumentHelper.prototype.isDetailViewReadOnly = function()
	{
		return this.detailView.obIsReadOnly && this.detailView.obIsReadOnly();
	}

	UploadDocumentHelper.prototype.init = function()
	{
		var self = this;
		if (self.$fileSelector !== null)
		{
			return;
		}

		var $element = self.detailView.$element,
			$uploadFileContainer = $("<div class='upload-file-container'>\
				<form class=\"input-box\" method=\"POST\" action=\"\" enctype=\"multipart/form-data\">\
					<div class=\"input\">\
						<label class='input-label'>Drop file to attach to this record.</label>\
						<input class=\"upload-file-input\" />\
					</div>\
				</form>\
			</div>"),
			$dragoverMask = $("<div class='dragover-mask'></div>"),
			$fileSelector = self.uploadHelper.createFileSelector("document-file-selector");

		$element.addClass("allow-file-upload");
		$element.parent().append($dragoverMask);
		if ($('.quick-add').length > 0)
		{
			$('.quick-add').off('scroll').on('scroll', function(e)
			{
				$uploadFileContainer.css('top', e.target.scrollTop)
				$uploadFileContainer.css('height', e.target.clientHeight - 20)
			})
			setTimeout(function()
			{
				$('.quick-add').scroll()
			}, 500)
		}

		$element.append($uploadFileContainer);
		$uploadFileContainer.hide();

		$element.append($fileSelector);
		self.$fileSelector = $fileSelector;
		self.uploadHelper.init($fileSelector);
		$(document).on("dragenter" + self.detailView.eventNameSpace, function(e)
		{
			if (self.isDetailViewReadOnly())
			{
				return;
			}

			if (!e.originalEvent.dataTransfer.types.includes('Files'))
			{
				e.preventDefault();
				e.stopPropagation();
				return;
			}
			if ($(e.target).closest('.detail-view,.quick-add .grid-stack-container')[0] === self.detailView.$element[0])
			{
				$dragoverMask.css("z-index", "99999");
			}
		});

		$dragoverMask.on("dragenter.detailview", function(e)
		{
			if (self.isDetailViewReadOnly())
			{
				return;
			}

			if (!e.originalEvent.dataTransfer.types.includes('Files'))
			{
				e.preventDefault();
				e.stopPropagation();
				return;
			}
			$uploadFileContainer.show();
		});

		$dragoverMask.on("dragleave.detailview", function(e)
		{
			if (self.isDetailViewReadOnly())
			{
				return;
			}

			$uploadFileContainer.hide();
			$dragoverMask.css("z-index", "-1");
		});

		$dragoverMask.on('drag dragstart dragend dragover dragenter dragleave drop', function(e)
		{
			if (self.isDetailViewReadOnly())
			{
				return;
			}

			e.preventDefault();
			e.stopPropagation();
		});

		$dragoverMask.on("drop.detailview", function(e)
		{
			if (self.isDetailViewReadOnly())
			{
				return;
			}

			if (!e.originalEvent.dataTransfer.types.includes('Files'))
			{
				e.preventDefault();
				e.stopPropagation();
				return;
			}
			$uploadFileContainer.hide();
			$dragoverMask.css("z-index", "-1");

			var file = e.originalEvent.dataTransfer.files[0];
			if (self.detailView.gridType === "document")
			{
				self.addFile(file);
			} else
			{
				self.onFileDrop(file);
				if (self.detailView.udGrid == null)
				{
					tf.helpers.detailViewHelper.addEditRecordInQuickAddModal(self.detailView.$element, "document", self.detailView.gridType, self.detailView.recordEntity,
						null, self.detailView.pageLevelViewModel, self.detailView.isCreateGridNewRecord, file);
				}
			}
		});
	};

	UploadDocumentHelper.prototype.initHidden = function()
	{
		var self = this;
		if (self.$fileSelector !== null)
		{
			return;
		}
		var $fileSelector = self.uploadHelper.createFileSelector("document-file-selector");
		self.$fileSelector = $fileSelector;
		self.uploadHelper.init($fileSelector);
	};

	UploadDocumentHelper.prototype._validateDocumentAttach = function()
	{
		var self = this, task = Promise.resolve(true);

		if (self.detailView.gridType !== "document")
		{
			var fileName,
				editFileName = self.detailView.fieldEditorHelper ?
					self.detailView.fieldEditorHelper.editFieldList.FileName :
					"";

			if (editFileName)
			{
				fileName = editFileName.value;
			}
			else if (self.detailView.recordEntity)
			{
				fileName = self.detailView.recordEntity.FileName;
			}

			if ((fileName && fileName.length > 0) || self.getFiles().length > 0)
			{
				task = tf.promiseBootbox.yesNo("A file is already attached to this record. Are you sure you want to replace the existing file?", "Confirmation Message");
			}
		}

		return task;
	};

	UploadDocumentHelper.prototype.onFileSelected = function(file)
	{
		var self = this;

		self.detailView.attachFileChangedEvent.notify({
			isEmpty: false,
			file: file.rawFile
		});
		self.detailView.manageLayout();
	};

	UploadDocumentHelper.prototype.addFile = function(file)
	{
		var self = this;
		if (self.uploadHelper.validateFile(file.name, file.size))
		{
			self._validateDocumentAttach().then(function(result)
			{
				if (result)
				{
					self.uploadHelper.selectFile(file);
					self.detailView.manageLayout();
				}
			});
		}
	};

	UploadDocumentHelper.prototype.getFiles = function()
	{
		return this.uploadHelper.getFiles();
	};

	UploadDocumentHelper.prototype.upload = function()
	{
		return this.uploadHelper.upload();
	};

	UploadDocumentHelper.prototype.clearAllFiles = function()
	{
		return this.uploadHelper.clearAllFiles();
	};

	UploadDocumentHelper.prototype.getFileStream = function()
	{
		return this.uploadHelper.getFileStream();
	};

	UploadDocumentHelper.prototype.onFileDrop = function(file)
	{
		this.fileDrop.notify(file);
	};

	UploadDocumentHelper.prototype.selectFile = function(file)
	{
		var self = this;
		self.uploadHelper.selectFile(file);
	};

	UploadDocumentHelper.prototype.uploadDocument = function(documentEntity)
	{
		var self = this;
		self.selectFile(documentEntity.DocumentEntity.documentEntity);
		return self.uploadHelper.upload().then(function(result)
		{
			documentEntity.TempFileName = result;
			return documentEntity;
		});
	};

	UploadDocumentHelper.prototype.dispose = function()
	{
		var self = this,
			$element = self.detailView.$element;

		self.fileDrop.unsubscribeAll();

		$(document).off("dragenter" + self.detailView.eventNameSpace);

		if ($element === undefined)
		{
			return;
		}
		$('.quick-add').off('srcoll')
		var $dragoverMask = $element.closest(".right-doc").find('.dragover-mask'),
			$uploadFileContainer = $element.find('.upload-file-container'),
			$fileSelector = $element.find('#document-file-selector');

		$dragoverMask.remove();
		$uploadFileContainer.remove();
		$fileSelector.remove();
		self.$fileSelector = null;
	};
})();
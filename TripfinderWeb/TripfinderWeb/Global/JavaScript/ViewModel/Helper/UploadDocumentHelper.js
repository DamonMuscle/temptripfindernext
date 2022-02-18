(function ()
{
	createNamespace("TF.Form").UploadDocumentHelper = UploadDocumentHelper;

	function UploadDocumentHelper(targetQuestion)
	{
		var self = this;
		self.targetQuestion = targetQuestion;
		self.$targetEle = targetQuestion.elem;
		if (!targetQuestion.field.readonly)
		{
			self.init();
		}
	};
	UploadDocumentHelper.prototype.constructor = UploadDocumentHelper;

	UploadDocumentHelper.maxNumber = 5; // 5 files limit
	UploadDocumentHelper.maxFileByteSize = 250 * 1024 * 1024; // 50MB
	UploadDocumentHelper.acceptFileExtensions = ['.csv', '.bmp', '.doc', '.gif', '.docm', '.jpeg',
		'.docx', '.jpg', '.dotm', '.png', '.dotx', '.tif', '.tiff', '.htm', '.wmf', '.html',
		'.odp', '.odt', '.pdf', '.pps', '.ppt', '.pptx', '.rtf', '.txt', '.xls', '.xlsx', '.xps', '.mp4', '.mov'];
	UploadDocumentHelper.acceptMimeType = "*.*";

	UploadDocumentHelper.prototype.isInvalid = function ()
	{
		const self = this;
		return self.targetQuestion.value && self.targetQuestion.value.length === UploadDocumentHelper.maxNumber;
	}

	UploadDocumentHelper.prototype.init = function ()
	{
		const self = this;
		const $element = self.$targetEle,
			$uploadFileContainer = $("<div class='upload-file-container'>\
										<label class='input-label'>Drop file to attach to this form.</label>\
										<div class='inner-mask' style='position:absolute;top:0;right:0;bottom:0;left:0;'></div>\
									</div>"),
			$dragoverMask = $("<div class='dragover-mask'></div>");

		$element.addClass("allow-file-upload");
		$element.append($dragoverMask);

		$element.append($uploadFileContainer);
		$uploadFileContainer.hide();

		$($element).on("dragenter" + ".form", function (e)
		{
			if (self.isInvalid())
			{
				return;
			}

			if (!e.originalEvent.dataTransfer.types.includes('Files'))
			{
				e.preventDefault();
				e.stopPropagation();
				return;
			}
			$dragoverMask.css("z-index", "99999");
		});

		$dragoverMask.on("dragenter.form", function (e)
		{
			if (self.isInvalid())
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

		$uploadFileContainer.find(".inner-mask").on("dragleave.form", function (e)
		{
			if (self.isInvalid())
			{
				return;
			}
			$uploadFileContainer.hide();
			$dragoverMask.css("z-index", "-1");
		});

		$uploadFileContainer.find(".inner-mask").on('drag dragstart dragend dragover dragenter dragleave drop', function (e)
		{
			if (self.isInvalid())
			{
				return;
			}
			e.preventDefault();
			e.stopPropagation();
		});

		$uploadFileContainer.find(".inner-mask").on("drop.form", function (e)
		{
			if (self.isInvalid())
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

			var files = e.originalEvent.dataTransfer.files;
			if (files.length > 0)
			{
				self.addDocuments(files);
			}
		});
	};

	UploadDocumentHelper.prototype.addDocuments = function (files)
	{
		let self = this;
		self.targetQuestion.uploadedFiles(files);
	};

	UploadDocumentHelper.prototype.validateFile = function (fileName, fileSize)
	{
		return this._validateAttachFileExtension(fileName) && this._validateAttachFileSize(fileSize);
	};

	UploadDocumentHelper.prototype._validateAttachFileExtension = function (fileName)
	{
		var self = this,
			index = fileName.lastIndexOf('.'),
			extension = fileName.substr(index, fileName.length - index).toLowerCase(), result;

		if (index > 0 && UploadDocumentHelper.acceptFileExtensions.includes(extension))
		{
			result = true;
		}

		return result;
	};

	UploadDocumentHelper.prototype._validateAttachFileSize = function (size)
	{
		var result = size < UploadDocumentHelper.maxFileByteSize;
		return result;
	};

	UploadDocumentHelper.prototype.getFileStream = function (rawFile)
	{
		const self = this;
		return new Promise(function (resolve, reject)
		{
			var file = rawFile, reader = new FileReader();

			reader.readAsDataURL(file);
			reader.onload = function (e)
			{
				if (!self.validateFile(rawFile.name, rawFile.size))
				{
					resolve(null);
				}
				else
				{
					resolve(e.target.result);
				}
			};
			reader.onerror = function (error)
			{
				reject(error);
			};
		});
	};

	UploadDocumentHelper.prototype.dispose = function ()
	{
		var self = this,
			$element = self.form.elem;

		$(document).off("dragenter.form");

		if ($element === undefined)
		{
			return;
		}
		var $dragoverMask = $element.find('.dragover-mask'),
			$uploadFileContainer = $element.find('.upload-file-container'),
			$fileSelector = $element.find('#document-file-selector');

		$dragoverMask.remove();
		$uploadFileContainer.remove();
		$fileSelector.remove();
		self.$fileSelector = null;
	};
})();
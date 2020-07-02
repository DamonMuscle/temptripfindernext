(function()
{
	createNamespace("TF").UploadHelper = UploadHelper;

	function UploadHelper(options)
	{
		var self = this;
		self.options = options || {};
	};

	UploadHelper.prototype.constructor = UploadHelper;

	UploadHelper.prototype.createFileSelector = function(id)
	{
		return $("<input type='file' id='" + id + "' style='display:none' accept='" + this.options.acceptMimeType + "' />");
	};

	UploadHelper.prototype.init = function($fileSelector)
	{
		this.$fileSelector = $fileSelector;
		this.createUploader();
	};

	UploadHelper.prototype.createUploader = function()
	{
		var self = this,
			$input = self.$fileSelector;

		self.uploader = $input.kendoUpload({
			multiple: false,
			async: {
				saveUrl: pathCombine(tf.api.server(), "actions", "files", "upload", "document"),
				withCredentials: false,
				autoUpload: false
			},
			success: function(e)
			{
				var tempFileName = e.response.fileName;
				self.uploadPromise.resolve(tempFileName);
			},
			select: function(e) { self.onSelect(e); }
		}).data("kendoUpload");

		$input.closest(".k-upload").hide();
	};

	UploadHelper.prototype._validateAttachFileExtension = function(fileName)
	{
		var self = this;
		var result = TF.UploadHelper.ValidateAttachFileExtensionInner(fileName, self.options);

		if (!result)
		{
			self.clearAllFiles();
			tf.promiseBootbox.alert("Invalid file format.");
		}

		return result;
	};

	UploadHelper.prototype._validateAttachFileSize = function(size)
	{
		var self = this,
			result = TF.UploadHelper.ValidateAttachFileSizeInner(size, self.options);

		if (!result)
		{
			var maxFileMBSize = parseInt(self.options.maxFileByteSize / 1024 / 1024);
			tf.promiseBootbox.alert("File size must be less than " + maxFileMBSize + " MB.");
		}

		return result;
	};

	UploadHelper.prototype.validateFile = function(fileName, fileSize)
	{
		return this._validateAttachFileExtension(fileName) && this._validateAttachFileSize(fileSize);
	};

	UploadHelper.ValidateAttachFileExtensionInner = function(fileName, options)
	{
		var index = fileName.lastIndexOf('.'),
			extension = fileName.substr(index, fileName.length - index).toLowerCase(), result;

		if (index > 0 && options.acceptFileExtensions.includes(extension))
		{
			result = true;
		}

		return result;
	};

	UploadHelper.ValidateAttachFileSizeInner = function(size, options)
	{
		return size < options.maxFileByteSize;
	};

	UploadHelper.prototype.onSelect = function(e)
	{
		var self = this, files = e.files;
		if (files.length === 0) return;

		var file = files[0],
			fileName = file.name,
			fileSize = file.size || file.rawFile.size;

		if (!self.validateFile(fileName, fileSize)) return;

		if (self.options.onFileSelected)
		{
			self.options.onFileSelected(file);
		}

		self.clearAllFiles();
	};

	UploadHelper.prototype.upload = function()
	{
		var self = this;
		self.uploadPromise = $.Deferred();
		self.uploader._module.onSaveSelected();

		return self.uploadPromise;
	};

	UploadHelper.prototype.getFiles = function()
	{
		var self = this, filesData, allFiles = [];
		if (self.uploader == null)
		{
			return allFiles;
		}

		var listItems = self.uploader.wrapper.find('.k-file');

		$.each(listItems, function(index, file)
		{
			filesData = $(file).data('fileNames');
			if (filesData)
			{
				allFiles = allFiles.concat(filesData);
			}
		});

		return allFiles;
	};

	UploadHelper.prototype.selectFile = function(file)
	{
		this.uploader.selectFiles([file]);
	};

	UploadHelper.prototype.clearAllFiles = function()
	{
		var self = this;

		if (!self.uploader) return;

		var files = self.uploader.wrapper.find('.k-file');

		files.each(function(index, file)
		{
			var fileData = { target: $(file, self.uploader.wrapper) };
			self.uploader._module.onRemove(fileData);
		});

		files.remove();
	};

	UploadHelper.prototype.getFileStream = function()
	{
		var self = this, files = self.getFiles(), filesLength = files.length;

		if (filesLength === 0) return Promise.resolve(null);

		return new Promise(function(resolve, reject)
		{
			var file = files[filesLength - 1].rawFile, reader = new FileReader();

			reader.readAsDataURL(file);
			reader.onload = function(e)
			{
				resolve(e.target.result);
			};
			reader.onerror = function(error)
			{
				reject(error);
			};
		});
	};
})();
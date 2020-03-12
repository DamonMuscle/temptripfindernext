(function()
{
	createNamespace("TF").UploadDocumentHelper = UploadDocumentHelper;

	function UploadDocumentHelper ()
	{
		var self = this;
		self.uploadHelper = new TF.UploadHelper({
			maxFileByteSize: UploadDocumentHelper.maxFileByteSize,
			acceptFileExtensions: UploadDocumentHelper.acceptFileExtensions,
			acceptMimeType: UploadDocumentHelper.acceptMimeType,
		});
		self.uploader = null;
		self.$fileSelector = null;
		self.init();
	};

	UploadDocumentHelper.maxFileByteSize = 25 * 1024 * 1024; // 25MB
	UploadDocumentHelper.acceptFileExtensions = ['.txt', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.png', '.jpeg', '.jpg', '.gif', '.tif', '.tiff', '.bmp', '.pdf', '.mp4'];
	UploadDocumentHelper.acceptMimeType = 'text/plain, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, \
		application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, \
		application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, \
		image/png, image/jpeg, application/pdf, video/mp4';

	UploadDocumentHelper.prototype.init = function()
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

	UploadDocumentHelper.prototype.addFile = function(file)
	{
		var self = this;
		self.uploadHelper.selectFile(file);
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

	UploadDocumentHelper.prototype.validateFile = function(fileName, fileSize)
	{
		return this.uploadHelper.validateFile(fileName, fileSize);
	};

	UploadDocumentHelper.prototype.validateAttachFileExtension = function(fileName)
	{
		return this.uploadHelper._validateAttachFileExtension(fileName, fileSize);
	};

	UploadDocumentHelper.prototype.validateAttachFileSize = function(fileSize)
	{
		return this.uploadHelper._validateAttachFileSize(fileName, fileSize);
	};

	UploadDocumentHelper.prototype.UploadDocument = function(documentEntity)
	{
		var self = this;
		self.addFile(documentEntity.DocumentEntity.documentEntity);
		return self.uploadHelper.upload().then(function(result)
		{
			documentEntity.TempFileName = result;
			return documentEntity;
		});
	};

	UploadDocumentHelper.prototype.dispose = function()
	{
		var self = this;
	};
})();
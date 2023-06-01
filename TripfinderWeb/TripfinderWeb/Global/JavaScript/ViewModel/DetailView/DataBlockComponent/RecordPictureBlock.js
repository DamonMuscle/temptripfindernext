(function()
{
	createNamespace("TF.DetailView.DataBlockComponent").RecordPictureBlock = RecordPictureBlock;

	function RecordPictureBlock(image, options, dataBlockStyles, $wrapper, detailView)// isReadMode, gridType, obRecordPicture, obEditing, fieldEditorHelper)
	{
		var self = this;

		TF.DetailView.DataBlockComponent.BaseDataBlock.call(self, detailView);

		var detailViewHelper = tf.helpers.detailViewHelper,
			uniqueClassName = options.uniqueClassName || detailViewHelper.generateUniqueClassName(),
			hasImage = image && image !== "None",
			imageSrc = hasImage ? ('data:' + image.MimeType + ';base64,' + (image.FileContent || image.ImageBase64)) : detailViewHelper.getDefaultRecordPicture(detailView.gridType);

		self.$wrapper = $wrapper;
		self.obRecordPicture = detailView.obRecordPicture;
		self.fieldEditorHelper = detailView.fieldEditorHelper;
		self.obEditing = detailView.obEditing;
		self.gridType = detailView.gridType;
		self.uniqueClassName = uniqueClassName;
		self.options = options;
		self.$el = $("<div>\
                            <div class='grid-stack-item-content recordPicture-stack-item " + ((self.isReadMode() && self.isReadOnly()) ? "disabled" : "") + "'  style='" +
			(dataBlockStyles.backgroundColor ? ("background:" + dataBlockStyles.backgroundColor + ";") : "") +
			(dataBlockStyles.borderColor ? ("border-color:" + dataBlockStyles.borderColor + ";") : "") +
			"' data-block-field-name = 'RecordPicture'>\
								 <label for='inputrecordPicture" + self.gridType + "' style='width:100%; height: 100% '>\
                                 <input " + ((self.isReadMode() && !self.isReadOnly()) ? "" : "disabled") + " class='uploadImg' id='inputrecordPicture" + self.gridType + "' name='file' type='file' accept='image/*'>\
								 <img src=" + imageSrc + " />\
								 </label>\
							</div>\
						</div>").addClass(uniqueClassName);
		if (self.isReadMode() && !self.isReadOnly())
		{
			//set the title for the avator and the picture blocks, relate to the css, cursor set to pointer also.
			self.$el.attr('title', hasImage ? 'Click to change' : 'Click to upload');
			$('.head-picture>label>span').attr('title', hasImage ? 'Click to change' : 'Click to upload').css('cursor', 'pointer');
			//end
		}
		else
		{
			$('.head-picture>label>span').attr('title', null).css('cursor', 'auto');
			self.$el.css('backgound', 'transparent')
		}
	}

	RecordPictureBlock.prototype = Object.create(TF.DetailView.DataBlockComponent.BaseDataBlock.prototype);

	RecordPictureBlock.prototype.uploadImage = function(e)
	{
		var self = this,
			files = e.currentTarget.files,
			file,
			reader = new FileReader();
		if (files && files.length)
		{
			file = files[0];
			if (file.type.indexOf('image') < 0)
			{
				tf.promiseBootbox.alert("Invalid file format");
				return;
			}
			if (file.size >= 1024 * 1024 * 2)
			{
				tf.promiseBootbox.alert("Size too large (<2MB)");
				return;
			}
			reader.onload = function(event)
			{
				self.obRecordPicture("url(" + event.currentTarget.result + ")");
				$('#head-picture-upload' + self.gridType).off('change').on('change', self.uploadImage.bind(self)); //avoid duplicated change
				self.$wrapper.closest(".detail-view-panel").find("div[data-block-field-name=RecordPicture]>label>img").each(function(_, element)
				{
					element.src = event.currentTarget.result;
				});
				self.$el.attr('title', 'Click to change').css('cursor', 'pointer');
				$('.head-picture>label>span').attr('title', 'Click to change').css('cursor', 'pointer');;

				var recordPic = {
					FileName: file.name,
					MimeType: file.type,
					ImageBase64: event.currentTarget.result.replace('data:' + file.type + ';base64,', ""),
					//this property is not suitable for the save api, replaced by the ImageBase64 above.
					//Md5Hash: event.currentTarget.result.replace('data:' + file.type + ';base64,', ""),
					FileSizeKB: file.size
				}
				self.fieldEditorHelper.editFieldList['RecordPicture'] = {
					value: recordPic,
					blockName: 'RecordPicture',
					relationshipKey: 'image'
				}
				self.obEditing(true);
			}.bind(e.target);
			reader.readAsDataURL(file);
		}
	}

	RecordPictureBlock.prototype.initEvents = function()
	{
		var self = this;
		if (self.isReadMode() && !self.isReadOnly())
		{
			self.$el.find('input#inputrecordPicture' + self.gridType).on('change', self.uploadImage.bind(self))
			$('#head-picture-upload' + self.gridType).on('change', self.uploadImage.bind(self));
		}
	}

	RecordPictureBlock.prototype.dispose = function()
	{
		this.$el.find('input#inputrecordPicture' + this.gridType).off('change');
	}
})();
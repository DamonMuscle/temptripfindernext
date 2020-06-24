(function()
{
	createNamespace("TF.DetailView.DataBlockComponent").ImageBlock = ImageBlock;

	function ImageBlock(options, detailView)
	{
		var self = this,
			detailViewHelper = tf.helpers.detailViewHelper;

		TF.DetailView.DataBlockComponent.BaseDataBlock.call(self, detailView);

		self.options = options;
		self.uniqueClassName = options.uniqueClassName || detailViewHelper.generateUniqueClassName();

		var inputElement = String.format("<input class='uploadImg' id='inputImage{0}' name='file' type='file' accept='image/*' {1}>",
			options.imageId, self.isReadMode() ? "disabled" : ""),
			imageElement = "<img class='uploadedPhoto' style='opacity:0.4;width:auto;height:auto;max-width:100%;max-height:100%'/>";

		self.$el = $("<div class='image'>\
						<div class='grid-stack-item-content image-stack-item' type='image'>\
							<label for='inputImage"+ options.imageId + "' style='width:100%; height: 100% '>" + inputElement + imageElement + "</label>\
						</div>\
					</div>").addClass(self.uniqueClassName);

		if (options.image !== undefined)
		{
			setTimeout(function()
			{
				self.$el.find("img").attr("src", options.image.fileData || options.image).css("opacity", "1");
				self.$el.data("filePostData", { fileData: options.image.fileData || options.image });
			});
		}
		else
		{
			self.$el.find("img").attr("src", detailViewHelper.imgUrl + "image_24x24-pos.svg");
		}
	}
	ImageBlock.prototype = Object.create(TF.DetailView.DataBlockComponent.BaseDataBlock.prototype);

	ImageBlock.prototype.initEvents = function()
	{
		var self = this;
		self.$el.find(".uploadImg").on('change', self.imageChange.bind(self));
	};

	ImageBlock.prototype.imageChange = function(e)
	{
		var self = this,
			files = e.currentTarget.files,
			url = window.URL || window.webkitURL,
			file,
			reader = new FileReader();
		self.$uploadedPhoto = $(e.currentTarget.nextElementSibling);
		if (files && files.length)
		{
			file = files[0];

			reader.onload = function(event)
			{
				$(this).data("filePostData", { fileName: file.name, fileData: event.target.result });
				self.$el.data("filePostData", { fileName: file.name, fileData: event.target.result });
			}.bind(e.target);
			reader.readAsDataURL(file);
			if (file.size >= 1024 * 1024 * 2)
			{
				tf.promiseBootbox.alert("Size too large (<2MB)", "Alert");
			}
			else
			{
				var blobUrl = url.createObjectURL(file);
				this.$uploadedPhoto.attr('src', blobUrl);
				this.$uploadedPhoto.css('opacity', '1');
			}
		}

		self.clearFiles($(e.currentTarget));
	};

	ImageBlock.prototype.clearFiles = function($el)
	{
		$el.wrap('<form>').closest('form').get(0).reset();
		$el.unwrap();
	};

	ImageBlock.prototype.dispose = function()
	{
		this.$el.find(".uploadImg").off('change');
	}
})();
(function()
{
	createNamespace("TF.Control").EditPhotoViewModel = EditPhotoViewModel;

	EditPhotoViewModel.prototype = Object.create(TF.Control.BaseControl.prototype);
	EditPhotoViewModel.prototype.constructor = EditPhotoViewModel;

	function checkImageExist(apiPrefix, imageType, imageId)
	{
		return tf.promiseAjax.get(pathCombine(apiPrefix, "image", "checkimageexist", imageType, imageId))
			.then(function(response)
			{
				return response.Items[0];
			});
	}

	EditPhotoViewModel.prototype.getImage = function(imageType, imageId, placeholderImage, apiPrefix, hideOverlay)
	{
		var apiPrefix = typeof (apiPrefix) !== "undefined" ? apiPrefix : tf.api.apiPrefix();
		var paramData = {};
		if (placeholderImage)
		{
			paramData = {
				placeholderImage: placeholderImage
			};
		}
		return tf.promiseAjax.get(pathCombine(apiPrefix, "image", imageType, imageId),
			{
				paramData: paramData
			},
			{
				overlay: !hideOverlay
			})
			.then(function(response)
			{
				return response;
			});
	};

	function EditPhotoViewModel(imageType, imageId, recordName, databaseId)
	{
		this.recordName = recordName;
		this.imageWidth = 146;
		this.imageType = imageType;
		this.imageId = imageId;
		this.filePostData = {};
		this.obImageExist = ko.observable(false);
		this.oberrormessage = ko.observable(null);
		this.imageUpdated = false;
		this.apiPrefix = typeof (databaseId) !== "undefined" ? (tf.api.apiPrefixWithoutDatabase() + "/" + databaseId) : tf.api.apiPrefix();
	}

	EditPhotoViewModel.prototype.init = function(viewModel, el)
	{
		var $el = $(el);
		var url = window.URL || window.webkitURL;
		this.$form = $el.find('form');
		this.$overlay = this.$form.find("#open-datasouce-loading");
		this.$uploadedPhoto = $el.find('img.uploadedPhoto');
		this.$uploadedPhotoFileInput = $el.find('input[type=file]');

		checkImageExist(this.apiPrefix, this.imageType, this.imageId).then(function(exist)
		{
			this.obImageExist(exist);
			this.getImage(this.imageType, this.imageId, null, this.apiPrefix).then(function(image)
			{
				var current = $el.find('img.current');
				current.attr("src", 'data:image/jpeg;base64,' + image);
			}.bind(this));

		}.bind(this));
	};

	EditPhotoViewModel.prototype.imageChange = function()
	{
		//TF.Grid.LightKendoGrid.prototype.refreshClick.apply(this);

		var files = this.$uploadedPhotoFileInput[0].files,
			url = window.URL || window.webkitURL,
			file,
			reader = new FileReader();

		if (files && files.length)
		{
			this.$overlay.show();

			file = files[0];

			reader.onload = function(event)
			{
				this.filePostData.fileName = file.name;
				this.filePostData.fileData = event.target.result;

				this.$overlay.hide();
			}.bind(this);
			reader.readAsDataURL(file);
			if (/^image\/\w+$/.test(file.type) == false)
			{
				this.oberrormessage('Choose an image file.');
			}
			else if (file.type != "image/png" && file.type != "image/jpeg")
			{
				this.oberrormessage('Choose jpg or png.');
			}
			else if (file.size >= 2097152)
			{
				this.oberrormessage('Size too large (<2MB)');
			}
			else
			{
				this.oberrormessage(null);
				var blobUrl = url.createObjectURL(file);
				this.$uploadedPhoto.attr('src', blobUrl).cropper(
					{
						background: false,
						guides: false,
						autoCrop: true,
						aspectRatio: 1 / 1,
						minContainerWidth: this.imageWidth,
						preview: '.img-preview',
						autoCropArea: 0.8,
						crop: function(data)
						{
							$.extend(this.filePostData, data);
							this.imageUpdated = true;
						}.bind(this)
					}).cropper('replace', blobUrl);
				this.imageUpdated = true;
			}
		}
	};

	EditPhotoViewModel.prototype.rotateLeft = function()
	{
		this.rotateImage(-90);
	};

	EditPhotoViewModel.prototype.rotateRight = function()
	{
		this.rotateImage(90);
	};

	EditPhotoViewModel.prototype.rotateImage = function(rotate)
	{
		if (this.$uploadedPhoto.data('cropper'))
		{
			this.$uploadedPhoto.cropper('rotate', rotate);
			this.imageUpdated = true;
		}
	};


	EditPhotoViewModel.prototype.deletePhoto = function()
	{
		var alterMessage = "Are you sure you want to delete the photo for this record" + (this.recordName ? " (" + this.recordName + ")" : "") + "?";
		return tf.promiseBootbox.yesNo(alterMessage, "Delete Photo").then(function(result)
		{
			if (result)
			{
				return tf.promiseAjax.delete(pathCombine(this.apiPrefix, "image", "delete", this.imageType, this.imageId))
					.then(function()
					{
						return true;
					}.bind(this));
			}
			return false;
		}.bind(this));
	};

	EditPhotoViewModel.prototype.apply = function()
	{
		var self = this;
		self.$overlay.show();
		return tf.promiseAjax.post(pathCombine(this.apiPrefix, "image", self.imageType, self.imageId),
			{
				data: self.filePostData
			})
			.then(function()
			{
				return tf.promiseAjax.get(
					pathCombine(self.apiPrefix, "image", self.imageType, self.imageId),
					{
						paramData:
						{}
					}
				);
			})
			.then(function(response)
			{
				self.$overlay.hide();
				return "data:image/png;base64," + response; // return self.filePostData.fileData;
			});
	};
})();

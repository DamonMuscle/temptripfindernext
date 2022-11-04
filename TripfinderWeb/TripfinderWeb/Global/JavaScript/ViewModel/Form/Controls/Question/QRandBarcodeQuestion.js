(function()
{
	createNamespace("TF.Control.Form").QRandBarcodeQuestion = QRandBarcodeQuestion;

	function QRandBarcodeQuestion()
	{
		this.CodeReader = new ZXingBrowser.BrowserMultiFormatReader();
		this.CodeReaderTimeout = 500;
		this.CodeReaderTarget = null;
		this.videoSetting = { audio: false, video: { facingMode: "environment" } };
		TF.Control.Form.BaseQuestion.apply(this, arguments);
	}

	QRandBarcodeQuestion.prototype = Object.create(TF.Control.Form.BaseQuestion.prototype);
	QRandBarcodeQuestion.prototype.constructor = QRandBarcodeQuestion;

	QRandBarcodeQuestion.prototype.initQuestionContent = function()
	{
		const field = this.field;
		let wrapper = $(`<div class='qr-and-barcode-wrapper'></div>`);
		const scanButtonArea = $(`<div class="qr-and-barcode-content">
									<div class="qr-and-barcode-buttons">
									<span class="scan-button">Scan Code</span>
									<span class="clear-button k-state-disabled">clear</span>
									</div>
									<p class="qr-and-barcode-answer"></p>
									</div>`);
		var barcodeTextArea = scanButtonArea.find(".qr-and-barcode-answer");
		var videoStreamContainer = $('body').find(".video-stream-container");
		if (videoStreamContainer.length == 0)
		{
			videoStreamContainer = $(`<div class="video-stream-container" id="videoStreamContainer">
											<div class="scan-tips">Find a code to scan</div>				
											<div class="scan-icon"></div>
											<a class="scan-close-button"></a>
											<video id="videoStream" autoPlay playsInline></video>
											<canvas id="scanCanvas" style='position:absolute;left:0;top:0'></canvas>
											</div></div>`);
			$('body').append(videoStreamContainer);
		}

		this.scanVideo = videoStreamContainer.find("#videoStream")[0];
		this.scanIcon = videoStreamContainer.find(".scan-icon")[0];
		this.scanCanvas = videoStreamContainer.find("#scanCanvas")[0];
		this.videoStreamContainer = videoStreamContainer;
		this.barcodeTextArea = barcodeTextArea;
		this.scanButtonArea = scanButtonArea;

		scanButtonArea.on('click', ".clear-button", e =>
		{
			this.setFieldValue("");
		});

		scanButtonArea.on('click', ".scan-button", e =>
		{
			navigator.mediaDevices.getUserMedia(this.videoSetting)
				.then((mediaStream) =>
				{
					// AFAICT in Safari this only gets default devices until gUM is called :/
					navigator.mediaDevices.enumerateDevices()
						.then((inputDevices) =>
						{
							if (inputDevices.length === 0)
							{
								tf.promiseBootbox.alert("Can not find camera for this device.", "Error");
								return;
							}

							this.startScanLoad(mediaStream);
						})
						.catch((err) =>
						{
							tf.promiseBootbox.alert(err.toString(), "Error");
							return;
						});
				})
				.catch((err) =>
				{
					if (err.toString().indexOf("NotAllowedError") > -1)
					{
						tf.promiseBootbox.alert("Please allow camera access in Settings.", "Error");
					}
					else if (err.toString().indexOf("NotFoundError") > -1)
					{
						tf.promiseBootbox.alert("Can not find camera for this device.", "Error");
					}
					else
					{
						tf.promiseBootbox.alert(err.toString(), "Error");
					}

					return;
				});
		});

		videoStreamContainer.on('click', '.scan-close-button', e =>
		{
			this.scanCancel();
		});

		if (field.value)
		{
			this.setFieldValue(field.value);
		}

		if (field.readonly)
		{
			scanButtonArea.find(".qr-and-barcode-buttons").hide();
		}

		wrapper.append(scanButtonArea);
		return wrapper;
	}

	QRandBarcodeQuestion.prototype.setFieldValue = function(value)
	{
		this.value = value;
		this.barcodeTextArea.text(value);
		this.scanButtonArea.find(".clear-button").removeClass("k-state-disabled");
		this.barcodeTextArea.show();
		if (!value)
		{
			this.scanButtonArea.find(".clear-button").addClass("k-state-disabled");
			this.barcodeTextArea.hide();
		}
	};

	QRandBarcodeQuestion.prototype.startScanLoad = function(mediaStream)
	{
		this.scanVideo.srcObject = mediaStream;
		setTimeout(() =>
		{
			this.scanFrameReload();
			this.videoStreamContainer.show();
		}, 100);
	};

	QRandBarcodeQuestion.prototype.setCanvasSize = function()
	{
		var canvasScaleOffset = 0.02;
		var scale = 0.38;
		if (this.scanVideo.clientHeight < this.scanVideo.clientWidth)
		{
			//landscape mode
			scale = 0.6;
			var canvasScaleOffset = 0.2;
		}

		const frameScaleHeight = this.scanVideo.clientHeight * scale;
		const frameScaleWidth = frameScaleHeight;
		const frameScaleLeft = (this.scanVideo.clientWidth - frameScaleWidth) / 2;
		const frameScaleTop = (this.scanVideo.clientHeight - frameScaleHeight) / 2;
		this.scanIcon.style.width = frameScaleWidth + 'px';
		this.scanIcon.style.height = frameScaleHeight + 'px';
		this.scanIcon.style.left = frameScaleLeft + 'px';
		this.scanIcon.style.top = frameScaleTop + 'px';

		var scaleWidth = frameScaleWidth / this.scanVideo.clientWidth + canvasScaleOffset;

		// set position of scan icon video
		const width = this.scanVideo.videoWidth;
		const height = this.scanVideo.videoHeight;
		const canvasScaleWidth = width * scaleWidth;
		const canvasScaleHeight = canvasScaleWidth;
		const canvasScaleLeft = (width - canvasScaleWidth) / 2;
		const canvasScaleTop = (height - canvasScaleHeight) / 2;

		this.scanCanvas.width = canvasScaleWidth;
		this.scanCanvas.height = canvasScaleHeight;
		this.scanCanvas.style.top = "-9999px";
		this.scanCanvas.style.left = "-9999px";

		this.scanCanvas.getContext('2d').drawImage(
			this.scanVideo,
			// source x, y, w, h:
			canvasScaleLeft,
			canvasScaleTop,
			canvasScaleWidth,
			canvasScaleHeight,
			// dest x, y, w, h:
			0,
			0,
			canvasScaleWidth,
			canvasScaleHeight
		);
	}

	QRandBarcodeQuestion.prototype.scanCancel = function()
	{
		if (this.scanVideo && this.scanVideo.srcObject)
		{
			this.scanVideo.srcObject.getTracks().forEach(track => track.stop());  // stop webcam feed
			this.scanVideo.srcObject = null;
		}

		this.videoStreamContainer.hide();
	}

	QRandBarcodeQuestion.prototype.scanFrameReload = async function()
	{
		if (!this.scanVideo || !this.scanVideo.srcObject)
		{
			return;
		}

		this.setCanvasSize();
		try
		{
			var result = await this.CodeReader.decodeFromCanvas(this.scanCanvas);
			if (result && result.text)
			{
				this.CodeReaderTarget && clearTimeout(this.CodeReaderTarget);
				this.setFieldValue(result.text);
				this.scanCancel();
				return;
			}
		}
		catch (error)
		{
			//ignore the error
		}

		this.CodeReaderTarget = setTimeout(() =>
		{
			this.scanFrameReload();
		}, this.CodeReaderTimeout); // repeat	
	}
})();
(function()
{
	function getClientKey()
	{
		return tf.authManager.clientKey.replace(/[^\w]/g, "");
	}

	function getNow()
	{
		return moment().utc();
	}

	function formatDate(d)
	{
		return d.format("YYYYMMDDHHmmss");
	}

	createNamespace("TF").CreateMmpkService = CreateMmpkService;

	function CreateMmpkService()
	{
		this.messageOutput = new TF.Events.Event();
		this.processor = null;
		this.abortController = null;
		this.jobId = null;
	};

	CreateMmpkService.prototype.isActived = function()
	{
		if (this.actived != null)
		{
			return Promise.resolve(this.actived);
		}

		return tf.authManager.getPurchasedProducts().then(products => this.actived = products.some(p => p.Name == "Wayfinder"));
	};

	CreateMmpkService.prototype.fireMessageOutput = function(data)
	{
		this.messageOutput.notify(data);
	};

	CreateMmpkService.prototype.getProcessor = function()
	{
		var createMmpkUrl = arcgisUrls.CreateMmpkGPService + "/Create%20Mmpk";
		if (this.processor == null || this.processor.url !== createMmpkUrl)
		{
			this.processor = new tf.map.ArcGIS.Geoprocessor(createMmpkUrl);
		}

		return this.processor;
	};

	CreateMmpkService.prototype.execute = function()
	{
		return this.isActived().then(actived =>
		{
			if (actived)
			{
				return this.cancel().then(this.executeCore.bind(this));
			}
		});
	};

	CreateMmpkService.prototype.executeCore = function()
	{
		this.fireMessageOutput({
			type: "success",
			content: "Creating Wayfinder mobile map package...",
			autoClose: false
		});

		return this.restartService().then(() =>
		{
			let processor = this.getProcessor();
			let params = {
				outputFile: getClientKey() + "_" + formatDate(getNow()) + ".mmpk",
				uploadUrl: pathCombine(tf.api.apiPrefixWithoutDatabase(), "mmpkfiles"),
				uploadUrlToken: tf.entStorageManager.get("token"),
				locatorData: "'MAP_STREET' 'Primary Table'"
			};
			this.abortController = new AbortController();
			return processor.submitJob(params, { signal: this.abortController.signal }).then(jobInfo =>
			{
				this.jobId = jobInfo.jobId;
				this.abortController = new AbortController();
				return processor.waitForJobCompletion(this.jobId, { signal: this.abortController.signal }).then(result =>
				{
					this.abortController = null;
					this.jobId = null;
					if (result.jobStatus == "job-succeeded")
					{
						this.fireMessageOutput({
							type: "success",
							content: "Wayfinder mobile map package created successfully.",
							autoClose: false
						});
					}
					else
					{
						this.fireMessageOutput({
							type: "error",
							content: "Wayfinder mobile map package failed to create.",
							autoClose: false
						});
					}
				});
			});
		}).catch(err =>
		{
			this.abortController = null;
			this.jobId = null;
			if (err.name === 'AbortError')
			{
				this.fireMessageOutput({
					type: "success",
					content: "Creating Wayfinder mobile map package canceled.",
					autoClose: true
				});
			}
			else
			{
				this.fireMessageOutput({
					type: "error",
					content: "Creating Wayfinder mobile map package failed.",
					autoClose: false
				});
			}
		});
	};

	CreateMmpkService.prototype.cancel = function()
	{
		if (this.abortController)
		{
			this.abortController.abort();
			this.abortController = null;
		}

		if (this.jobId)
		{
			var processor = this.getProcessor();
			return processor.cancelJob(this.jobId).then(() =>
			{
				this.jobId = null;
			});
		}

		return Promise.resolve();
	};

	CreateMmpkService.prototype.restartService = function()
	{
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase("v2"), "arcgis", "Restart"),
			{
				paramData:
				{
					serviceName: "CreateMmpkGPService"
				}
			});
	};

	CreateMmpkService.instance = new CreateMmpkService();
})();

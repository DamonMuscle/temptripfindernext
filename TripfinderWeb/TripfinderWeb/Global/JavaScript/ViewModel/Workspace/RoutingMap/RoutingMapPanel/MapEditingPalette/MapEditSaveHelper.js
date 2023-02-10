(function()
{
	createNamespace("TF.RoutingMap").MapEditSaveHelper = new MapEditSaveHelper();
	let handledServices = [
		"copyandrebuild",
		"rebuildscenario",
		"rebuildstreetlocactor",
		"create mmpk",
		"gdblayerupdate",
		"build network",
		"rebuildaddresspointlocactor",
		"updatevectorbasemap",
	];

	function MapEditSaveHelper()
	{
		this.saving = false;
		this.resolveTimer = null;
		this.resolve = null;
		this.promise = null;
	}

	MapEditSaveHelper.prototype.isHandledService = function(url)
	{
		if (!url)
		{
			return false;
		}

		url = decodeURI(url.toLowerCase());
		return handledServices.some(i => '/gpserver/' + url.endsWith(i));
	};

	MapEditSaveHelper.prototype.complete = function()
	{
		if (this.saving)
		{
			this.ensurePromise();
			return this.promise;
		}

		let resolve, promise = new Promise(r => resolve = r);
		setTimeout(() =>
		{
			if (!this.saving) 
			{
				resolve();
				return;
			}

			this.ensurePromise();
			this.promise.then(resolve);
		}, 2000);

		return promise;
	};

	MapEditSaveHelper.prototype.ensurePromise = function()
	{
		this.promise = this.promise ?? new Promise(r => this.resolve = r);
	};

	MapEditSaveHelper.prototype.setSaving = function(saving)
	{
		if (saving || this.saving == saving)
		{
			this.saving = saving;
			return;
		}

		this.saving = saving;
		this.ensurePromise();
		if (this.resolveTimer != null)
		{
			clearTimeout(this.resolveTimer);
		}

		this.resolveTimer = setTimeout(() =>
		{
			if (!this.saving) 
			{
				this.resolve();
				this.promise = null;
				this.resolve = null;
				this.resolveTimer = null;
			}
		}, 2000);
	};

})();
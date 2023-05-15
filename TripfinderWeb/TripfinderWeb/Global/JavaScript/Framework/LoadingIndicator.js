(function()
{
	createNamespace("TF").LoadingIndicator = LoadingIndicator;

	//the main purpose of this class is not to indicate loading state but to block user input of different kinds
	function LoadingIndicator($element)
	{
		var self = this;
		this._$element = $element;
		$element.hide();
		this._$overlay = $element.find(".overlay").hide();
		this._$spinner = $element.find(".spinner").hide();
		this._$progressbar = $element.find(".progressbar").hide();
		self.$kendoProgress = self._$progressbar.find(".progress-bar");
		this._$subtitle = $element.find(".spinner .subtitle").hide();
		this._counter = 0;
		this._mapper = {};
		this._handle = null;
		this._hideHandle = null;

		this.subtitle = ko.observable("");
		this.subtitle.subscribe(this._updateSubtitleDiplay.bind(this));
		this._updateSubtitleDiplay(this.subtitle());

		this._defaultSubtitle = 'Loading';

		this.reminderLoadingStatus = new TF.Events.Event();

		self.progressLabel = ko.observable("Waiting");
		self.$kendoProgress.kendoProgressBar({
			min: 0,
			max: 100,
			type: "percent"
		});
	}

	LoadingIndicator.prototype = {
		setSubtitle: function(subtitle)
		{
			if (this.isHiding())
				this.subtitle(subtitle);
		},
		tryHide: function()
		{
			this._counter--;
			this._hideHandle = setTimeout(function()
			{
				this.hide();
			}.bind(this), 200);
		},
		hide: function()
		{
			if (this.isHiding())
			{
				this._counter = 0;
				clearTimeout(this._handle);
				this._$overlay.hide();
				this._$element.removeClass("no-overlay").hide();
				this._$spinner.hide();
				this._$progressbar.hide();
				this.subtitle(this._defaultSubtitle);
				this.reminderLoadingStatus.notify(false);
			}
		},
		hideByName: function(name)
		{
			if (!name || !this._mapper[name])
			{
				return; // never shown by this name
			}

			delete this._mapper[name];
			this.tryHide();
		},
		hideCompletely: function()
		{
			this._counter = 0;
			this._mapper = {};
			this.tryHide();
		},
		show: function(progressbar, overlay, delayTime)
		{
			this._counter++;
			this._$element.show();
			this.reminderLoadingStatus.notify(true);
			clearTimeout(this._hideHandle);
			var self = this;
			this._handle = setTimeout(function()
			{
				if (self.isShowing())
				{
					this._$overlay.show();
					if (overlay === false)
					{
						this._$element.addClass("no-overlay");
					}
					if (!progressbar)
					{
						this._$spinner.show();
					}
					else
					{
						this._$progressbar.show();
					}
				}
			}.bind(this), delayTime || (progressbar ? 0 : 1000));
		},
		showByName: function(name) {
			if (this._mapper[name])
			{
				return; // already shown by this name
			}
			this._mapper[name] = true;
			this.show();
		},
		enhancedShow: function(promiseOrFunction){
			const self = this;
			if (!(promiseOrFunction instanceof Function || promiseOrFunction instanceof Promise))
			{
				throw new Error("Accepting promise or function only.");
			}

			self.show();

			return new Promise(function(resolve)
			{
				if (promiseOrFunction instanceof Function)
				{
					resolve(promiseOrFunction());
				}
				else
				{
					resolve(promiseOrFunction);
				}
			}).then(function(result)
			{
				return result;
			}, function(error){
				// Generally, we should never arrive here. Exceptions should be handled in promiseOrFunction
				console.error(error);
			}).finally(() => self.tryHide());
		},
		showImmediately: function()
		{
			if (!this.subtitle())
			{
				this.setSubtitle(this._defaultSubtitle);
			}

			this._counter++;
			this._$element.show(0);
			this.reminderLoadingStatus.notify(true);
			if (this.isShowing())
			{
				this._$overlay.show(0);
				this._$spinner.show(0);
			}
		},
		isShowing: function()
		{
			return this._counter != 0 || Object.keys(this._mapper).length > 0;
		},
		isHiding: function() {
			return this._counter <= 0 && !Object.keys(this._mapper).length;
		},
		resetProgressbar: function()
		{
			var self = this,
				progressbar = self.$kendoProgress.data("kendoProgressBar");
			progressbar.value(0);
			self.progressLabel("Waiting");
		},
		changeProgressbar: function(val, message)
		{
			var self = this,
				progressbar = self.$kendoProgress.data("kendoProgressBar");
			progressbar.value(val);
			if (message)
			{
				self.progressLabel(message);
			}
		},
		_updateSubtitleDiplay: function(subtitleText)
		{
			if (subtitleText != "")
			{
				this._$subtitle.show();
			}
			else
			{
				this._$subtitle.hide();
			}
		}
	};
})();
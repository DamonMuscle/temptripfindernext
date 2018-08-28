(function()
{
	createNamespace('TF').Ajax = Ajax;

	function Ajax(loadingIndicator, cacheAjaxRequestsArray)
	{
		this.loadingIndicator = loadingIndicator;
		this.ajaxRequests = [];
		this.cacheAjaxRequestsArray = !!cacheAjaxRequestsArray;
	}

	Ajax.prototype = {

		_onBeforeSend: function(xmlHttpRequest, settings, overlay, externalPointer)
		{
			if (overlay == true)
			{
				this.loadingIndicator.setSubtitle(settings.loadingSubtitle);
				this.loadingIndicator.show();
			}
			if (externalPointer)
			{
				externalPointer();
			}
		},

		_onComplete: function(xmlHttpRequest, status, overlay, externalPointer)
		{
			if (overlay == true)
			{
				this.loadingIndicator.tryHide();
			}
			if (externalPointer)
			{
				expternalPointer();
			}

			this._clearAjax(xmlHttpRequest);
		},

		_onError: function(xmlHttpRequest, status, error, externalPointer, auth)
		{
			if (!(auth && auth.noInterupt) && error == "Unauthorized")
			{
				tf.promiseBootbox.alert("Login session expired")
					.then(function()
					{
						tf.pageManager.logout();
					});
				return;
			}
			if (!(auth && auth.noInterupt) && !!xmlHttpRequest.responseText && JSON.parse(xmlHttpRequest.responseText).Message === "Invalid Token")
			{
				tf.promiseBootbox.alert("Login session expired")
					.then(function()
					{
						tf.pageManager.logout();
					});
				return;
			}
			if (externalPointer)
			{
				externalPointer(xmlHttpRequest.responseJSON, xmlHttpRequest.status);
			}
		},

		_onSuccess: function(data, xmlHttpRequest, status, externalPointer)
		{
			if (externalPointer)
			{
				externalPointer(data);
			}
		},

		get: function(url, settings, option)
		{
			var settings = this._applyDefaults(url, settings, option);

			if (settings.paramData)
			{
				settings.data = settings.paramData;
			}
			var ajaxRequest = $.ajax(settings);

			ajaxRequest.requestUrl = url;
			if (this.cacheAjaxRequestsArray)
			{
				this.ajaxRequests[this.ajaxRequests.length] = ajaxRequest;
			}
			return ajaxRequest;
		},

		post: function(url, settings, option)
		{
			var settings = this._applyDefaults(url, settings, option);
			this._handleData(settings);
			settings.type = "POST";
			if (option && option.isCopyRequest)
			{
				settings.async = false;
			}
			var ajaxRequest = $.ajax(settings);
			ajaxRequest.requestUrl = url;
			if (this.cacheAjaxRequestsArray)
			{
				this.ajaxRequests[this.ajaxRequests.length] = ajaxRequest;
			}
			return ajaxRequest;
		},

		put: function(url, settings, option)
		{
			var settings = this._applyDefaults(url, settings, option);
			this._handleData(settings);
			settings.type = "PUT";
			var ajaxRequest = $.ajax(settings);
			if (this.cacheAjaxRequestsArray)
			{
				this.ajaxRequests[this.ajaxRequests.length] = ajaxRequest;
			}
			return ajaxRequest;
		},

		delete: function(url, settings, option)
		{
			var settings = this._applyDefaults(url, settings, option);
			this._handleData(settings);
			settings.type = "DELETE";
			var ajaxRequest = $.ajax(settings);
			if (this.cacheAjaxRequestsArray)
			{
				this.ajaxRequests[this.ajaxRequests.length] = ajaxRequest;
			}
			return ajaxRequest;
		},

		_applyDefaults: function(url, externalSettings, option)
		{
			option = $.extend({ overlay: true, auth: null, authorization: true }, option);

			var settings = {
				url: url,
				dataType: 'json',
				contentType: 'application/json; charset=utf-8',
				cache: false,
				traditional: false,
				loadingSubtitle: "Loading"
			};


			if (externalSettings)
			{
				// Preserve any function pointers set by external code.
				var beforeSend = externalSettings.beforeSend;
				var complete = externalSettings.complete;
				var successCallback = externalSettings.success;
				var errorCallback = externalSettings.error;

				// Override default settins with external settings.
				$.extend(settings, externalSettings);
			}

			// Replace the function pointers on the settings object with wrappers.
			settings.beforeSend = function(xmlHttpRequest, settings)
			{
				this._onBeforeSend(xmlHttpRequest, settings, option.overlay, beforeSend)
				var token = tf.tokenStorageManager.get("token");
				xmlHttpRequest.setRequestHeader('Token', token);
			}.bind(this);

			settings.complete = function(xmlHttpRequest, status)
			{
				this._onComplete(xmlHttpRequest, settings, option.overlay, complete)
			}.bind(this);

			settings.error = function(xmlHttpRequest, status, error)
			{
				this._onError(xmlHttpRequest, status, error, errorCallback, option.auth);
			}.bind(this);

			settings.success = function(data, status, xmlHttpRequest)
			{
				this._onSuccess(data, xmlHttpRequest, status, successCallback);
			}.bind(this);

			return settings;
		},

		_handleData: function(settings)
		{
			if (!(typeof settings.data == 'string' || settings.data instanceof String))
			{
				settings.data = JSON.stringify(settings.data);
			}
			if (settings.paramData && jQuery.param(settings.paramData))
			{
				settings.url = settings.url + (settings.url.indexOf("?") > -1 ? "&" : "?") + jQuery.param(settings.paramData);
			}
			return;
		},
		_clearAjax: function(xmlHttpRequest)
		{
			if (this.cacheAjaxRequestsArray)
			{
				for (var i = 0; i < this.ajaxRequests.length; i++)
				{
					if (this.ajaxRequests[i] == xmlHttpRequest)
					{
						this.ajaxRequests[i] = null;
					}
				}
			}
		}
	};
})();

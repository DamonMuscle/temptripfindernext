(function()
{
	//PromiseAjax is a wrapper for Ajax when swtich from traditional jquery ajax to promise based ajax
	//resulting not so clean code, should combine PromiseAjax and ajax together sometime
	createNamespace("TF").PromiseAjax = PromiseAjax;

	function PromiseAjax(ajax, ajaxSettings)
	{
		this.ajax = ajax;
		this.ajaxSettings = $.extend({
			onResolve: function(args)
			{
				return Promise.resolve(args);
			},
			onReject: function(args)
			{
				return Promise.reject(args);
			}
		}, ajaxSettings)
	}

	PromiseAjax.prototype.generic = function(httpVerb, url, settings, option)
	{
		if (!settings)
		{
			settings = {};
		}

		var self = this;
		return (new Promise(function(resolve, reject)
		{
			Promise.resolve(self.ajax[httpVerb](url, settings, option))
				.then(function(arg)
				{
					resolve(arg);
				})
				.catch(function(arg)
				{
					if (arg.responseJSON && arg.status == 401 && !(option && option.auth && option.auth.noInterupt))
					{
						return;
					}
					reject(arg.responseJSON);
				})

		}))
			.then(this.ajaxSettings.onResolve,
			this.ajaxSettings.onReject);
	}

	PromiseAjax.prototype.get = function(url, settings, option)
	{
		return this.generic("get", url, settings, option);
	};

	PromiseAjax.prototype.post = function(url, settings, option)
	{
		url = url.replace(/documentmini/g, "document");//change the documentmini to document,do not have any documentmini url in api
		return this.generic("post", url, settings, option);
	};

	PromiseAjax.prototype.put = function(url, settings, option)
	{
		return this.generic("put", url, settings, option);
	};

	PromiseAjax.prototype.delete = function(url, settings, option)
	{
		return this.generic("delete", url, settings, option);
	};

	PromiseAjax.prototype.patch = function(url, settings, option)
	{
		return this.generic("patch", url, settings, option);
	};
})()
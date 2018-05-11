(function()
{
	//Session for RoutefinderWeb should be a different implementation

	createNamespace("TF.Session").SoftSessionValidator = SoftSessionValidator;
	function SoftSessionValidator(authManager)
	{
		this._monitorSession = this._monitorSession.bind(this);
		this._authManager = authManager;
	}

	SoftSessionValidator.prototype._monitorInteval = 30000;

	SoftSessionValidator.prototype.activate = function()
	{
		setTimeout(this._monitorSession, this._monitorInteval);
	};

	SoftSessionValidator.prototype._verify = function()
	{
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "token", "verify", "extend")).then(function(response)
		{
			return response.Items[0];
		});
	};

	SoftSessionValidator.prototype._monitorSession = function()
	{
		var self = this;
		self._verify().then(function(result)
		{
			if (result.Verify !== true)
			{
				self._authManager.logOffWithoutRefresh();
			}
			else
			{
				if (self._authManager.authorizationInfo)
				{
					self._authManager.authorizationInfo.updateAuthorized(result.Authinfo);
				}
				setTimeout(self._monitorSession, self._monitorInteval);
			}
		})
	};
})()
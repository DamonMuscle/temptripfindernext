(function()
{
	//Session for RoutefinderWeb should be a different implementation

	createNamespace("TF.Session").SoftSessionValidator = SoftSessionValidator;
	function SoftSessionValidator(authManager)
	{
		this._monitorSession = this._monitorSession.bind(this);
		this._monitorTokenChanged = this._monitorTokenChanged.bind(this);
		this._authManager = authManager;
	}

	SoftSessionValidator.prototype._monitorInteval = 30000;
	SoftSessionValidator.prototype._tokenMonitorInteval = 10000;

	SoftSessionValidator.prototype.activate = function()
	{
		setTimeout(this._monitorSession, this._monitorInteval);
		setTimeout(this._monitorTokenChanged, this._tokenMonitorInteval);
	};

	SoftSessionValidator.prototype._verify = function()
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "tokens"), {
			paramData: {
				verify: true,
				includeAuthInfo: true
			}
		}, { overlay: false }).then(function(response)
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

	SoftSessionValidator.prototype._monitorTokenChanged = function()
	{
		var self = this;
		if (tf.entStorageManager.get("token") !== self._authManager.token)
		{
			// if switch to the stopfinder, must refresh the _authManager token
			if (self._authManager.updateToken)
			{
				self._authManager.token = tf.entStorageManager.get("token");
				if (!tf.entStorageManager.get("stopfinderToken"))
				{
					return;
				}
				setTimeout(() =>
				{
					self._authManager.updateToken = false;
				});
				return;
			}

			tf.promiseBootbox.alert("Login session expired")
				.then(function () {
					if (tf.cfConnection) {
						tf.cfConnection.stop();
					}
					self._authManager.logOffTag = true;
					location.reload();
				});
			return;
		}

		setTimeout(self._monitorTokenChanged, self._tokenMonitorInteval);
	};
})()

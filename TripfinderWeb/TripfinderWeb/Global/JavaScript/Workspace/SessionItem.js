(function()
{
	var SessionItem = {}, storageKey = "sessionItem.Id", interval = 60000, timer, xhr;
	createNamespace("TF").SessionItem = SessionItem;

	SessionItem.beforeUpdate = new TF.Events.Event();
	SessionItem.idChanged = new TF.Events.Event();

	SessionItem.getId = () =>
	{
		return tf.storageManager.get(storageKey, null, true);
	};

	SessionItem.setId = (id) =>
	{
		var current = SessionItem.getId();
		if (id != current)
		{
			tf.storageManager.save(storageKey, id, null, true);
			SessionItem.idChanged.notify(id);
		}
	};

	function send()
	{
		var id = SessionItem.getId(),
			sessionItem = {
				DBID: tf.datasourceManager.databaseId,
				Id: id,
				ClientKey: tf.authManager.clientKey
			};
		SessionItem.beforeUpdate.notify(sessionItem);
		return tf.promiseAjax.put(pathCombine(tf.api.apiPrefixWithoutDatabase(), "sessionitems"),
			{
				data: sessionItem,
				headers: { "no-extend-expiration": true },
				beforeSend: beforeSend
			}, { overlay: false });
	}

	function beforeSend(jqXHR)
	{
		xhr = jqXHR;
	}

	function loopSend()
	{
		timer = null;
		send().then(function(res)
		{
			var sessionItem = res.Items[0];
			if (sessionItem.HeartBeatInterval)
			{
				interval = sessionItem.HeartBeatInterval * 1000;
			}

			SessionItem.setId(sessionItem.Id)
			restart();
		}).catch(function(result)
		{
			var isCancel = result && result.StatusCode === 0;
			if (!isCancel) restart();
		});
	}

	function restart()
	{
		xhr = null;
		timer = setTimeout(loopSend, interval);
	}

	SessionItem.refresh = function()
	{
		if (timer)
		{
			clearTimeout(timer);
			timer = null;
		}

		if (xhr)
		{
			xhr.abort();
			xhr = null;
		}

		loopSend();
	};
})();
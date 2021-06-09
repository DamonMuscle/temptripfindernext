function tfdispose(obj)
{
	if (obj == window) return;

	const funName = obj && obj.constructor && obj.constructor.name;

	Object.keys(obj).forEach(key =>
	{
		var value = obj[key];

		if (value === null) return;

		if (value instanceof TF.Events.Event)
		{
			value.unsubscribeAll();
		}
		else if (value && value.subscribe && value.getSubscriptionsCount
			&& typeof value.getSubscriptionsCount === "function"
			&& value.getSubscriptionsCount() > 0)
		{
			window.unremovedSubscriptions = window.unremovedSubscriptions || {};
			window.unremovedSubscriptions[funName] = window.unremovedSubscriptions[funName] || new Set();
			window.unremovedSubscriptions[funName].add(key)
		}
		else if (value instanceof $)
		{
			Array.from(value).forEach(el =>
			{
				if (ko.dataFor(el) == obj)
				{
					ko.cleanNode(el);
				}
			});
		}

		obj[key] = null;
	});
}

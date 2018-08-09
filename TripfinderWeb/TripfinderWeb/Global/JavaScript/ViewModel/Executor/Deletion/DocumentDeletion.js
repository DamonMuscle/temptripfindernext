(function()
{
	var namespace = createNamespace("TF.Executor");

	namespace.DocumentDeletion = DocumentDeletion;

	function DocumentDeletion()
	{
		this.type = 'document';
		namespace.BaseDeletion.apply(this, arguments);
	}

	DocumentDeletion.prototype = Object.create(namespace.BaseDeletion.prototype);
	DocumentDeletion.prototype.constructor = DocumentDeletion;

	DocumentDeletion.prototype.getAssociatedData = function(ids)
	{
		var associatedDatas = [];
		var p0 = tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "document", "group", "documentrelationship"), {
			data: ids
		}).then(function(response)
		{
			response.Items.forEach(function(items)
			{
				if (items.length > 0)
				{
					associatedDatas.push({
						type: items[0].AttachedToType,
						items: items
					});
				}
			});
		});
		return Promise.all([p0]).then(function()
		{
			return associatedDatas;
		});
	}

	DocumentDeletion.prototype.getEntityPermissions = function(ids)
	{
		this.associatedDatas = [];

		if (!tf.authManager.isAuthorizedFor(this.type, 'delete'))
		{
			this.associatedDatas.push(this.type);
		}

		var p0 = this.getDataPermission(ids, "document", "documentrelationship");

		return Promise.all([p0]).then(function()
		{
			return this.associatedDatas;
		}.bind(this));
	}
})();
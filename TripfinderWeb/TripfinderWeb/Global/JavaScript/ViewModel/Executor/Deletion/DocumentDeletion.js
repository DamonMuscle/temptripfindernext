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
		var p0 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "documentRelationships"), {
			paramData: {
				"@filter": "eq(DBID," + tf.datasourceManager.databaseId + ")&in(AttachedToID," + ids.toString() + ")&eq(AttachedToType," + tf.DataTypeHelper.getId("fieldtrip") + ")"
			}
		}).then(function(response)
		{
			if (response.Items.length > 0)
			{
				associatedDatas.push({
					type: response.Items[0].AttachedToType,
					items: response.Items
				});
			}
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